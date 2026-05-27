// ═══ Season awards: MVP, Rookie of the Year, All-Star Starting 5 ═══
import type { LeagueState, AwardsReport, AwardWinner, Player, Position } from './types';
import { teamLabel } from './league';

function teamLabelFor(state: LeagueState, teamId: string | null): string {
  const t = state.teams.find((x) => x.id === teamId);
  return t ? teamLabel(t) : 'Free Agent';
}

// a player's "season value" — used to rank MVP / ROY / All-Stars
function seasonValue(state: LeagueState, p: Player): number {
  const line = state.seasonStats[p.id];
  if (!line || line.games === 0) return -1;
  const g = line.games;
  // per-game production, lightly weighted toward playmaking
  return (line.points + line.assists * 1.5 + line.rebounds * 1.1
    + line.steals * 2 + line.blocks * 2) / g;
}

function toWinner(state: LeagueState, p: Player, detail: string): AwardWinner {
  return {
    playerId: p.id,
    playerName: p.name,
    teamLabel: teamLabelFor(state, p.teamId),
    rarity: p.rarity,
    detail,
  };
}

function ppg(state: LeagueState, p: Player): string {
  const line = state.seasonStats[p.id];
  if (!line || line.games === 0) return '—';
  return `${(line.points / line.games).toFixed(1)} PPG`;
}

/**
 * Compute the season's awards. Called at the very start of the offseason,
 * BEFORE retirements/aging, so the awards reflect the season just played.
 */
export function computeAwards(state: LeagueState): AwardsReport {
  const champTeam = state.teams.find((t) => t.id === state.champion);
  const rostered = Object.values(state.players)
    .filter((p) => !p.retired && p.teamId !== null);

  // ── MVP — highest season value among all rostered players ──
  let mvp: Player | null = null;
  let mvpVal = -1;
  for (const p of rostered) {
    const v = seasonValue(state, p);
    if (v > mvpVal) { mvpVal = v; mvp = p; }
  }

  // ── Rookie of the Year — best player in season 1 of their career ──
  let roy: Player | null = null;
  let royVal = -1;
  for (const p of rostered) {
    if (p.seasonsPlayed !== 0) continue; // year-1 players only
    const v = seasonValue(state, p);
    if (v > royVal) { royVal = v; roy = p; }
  }

  // ── All-Star Starting 5 — best player at each position ──
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const allStarFive: AwardWinner[] = [];
  for (const pos of positions) {
    let best: Player | null = null;
    let bestVal = -1;
    for (const p of rostered) {
      if (p.position !== pos) continue;
      const v = seasonValue(state, p);
      if (v > bestVal) { bestVal = v; best = p; }
    }
    if (best) allStarFive.push(toWinner(state, best, best.position));
  }

  return {
    season: state.season,
    championLabel: champTeam ? teamLabel(champTeam) : '—',
    championId: champTeam ? champTeam.id : '',
    mvp: mvp ? toWinner(state, mvp, ppg(state, mvp)) : null,
    rookieOfYear: roy ? toWinner(state, roy, ppg(state, roy)) : null,
    allStarFive,
  };
}

/**
 * Write an awards report's honors onto the players' permanent career totals.
 * Called during the offseason with the mutable players map so MVP / ROY /
 * All-Star selections are remembered for the rest of a player's career.
 */
export function applyAwardsToCareers(
  awards: AwardsReport, players: Record<string, Player>,
): void {
  if (awards.mvp) {
    const p = players[awards.mvp.playerId];
    if (p) p.career.mvps += 1;
  }
  if (awards.rookieOfYear) {
    const p = players[awards.rookieOfYear.playerId];
    if (p) p.career.rookieOfYear = true;
  }
  for (const w of awards.allStarFive) {
    const p = players[w.playerId];
    if (p) p.career.allStarSelections += 1;
  }
}
