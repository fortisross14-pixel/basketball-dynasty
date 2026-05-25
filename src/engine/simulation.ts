// ═══ Game simulation: pressure → raw → normalized score → clutch ═══
import type { Team, Player, GameResult } from './types';
import {
  teamScoreWith, teamOffense, teamDefense, teamThree, teamLabel,
} from './league';
import { rng, randInt, gaussian, chance, pick } from './rng';

interface SimContext {
  week: number;
  highlight: boolean;
  playoff: boolean;
  rivalry: boolean;
}

export interface BoxLine {
  pts: number; reb: number; ast: number; blk: number; stl: number; tpm: number;
}
export interface SimOutput {
  result: GameResult;
  box: Record<string, BoxLine>;     // keyed by player id
  buzzerPlayerId: string | null;
}

function pressure(team: Team, opp: Team, players: Record<string, Player>): number {
  const off = teamOffense(team, players);
  const def = teamDefense(opp, players);
  const advantage = off - def;
  const moraleSwing = (team.morale - 65) * 0.15;
  const capRating = teamScoreWith(team, players);
  return 55 + advantage * 0.9 + moraleSwing + capRating * 1.6 + gaussian(0, 6);
}

function distributeBox(
  team: Team, teamPts: number, players: Record<string, Player>, box: Record<string, BoxLine>,
) {
  const stars = team.starIds.map((id) => players[id]).filter(Boolean);
  const weights = stars.map((s) => s.stats.twoP + s.stats.threeP + s.overall);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  stars.forEach((s, i) => {
    const share = weights[i] / total;
    const pts = Math.max(0, Math.round(teamPts * share * (0.55 + rng() * 0.25)));
    const reb = Math.round((s.stats.physical / 99) * randInt(2, 14));
    const ast = Math.round((s.stats.passing / 99) * randInt(1, 13));
    const blk = Math.round((s.stats.defense / 99) * randInt(0, 4));
    const stl = Math.round((s.stats.defense / 99) * randInt(0, 3));
    const tpm = Math.min(Math.floor(pts / 3), Math.round((s.stats.threeP / 99) * randInt(0, 8)));
    box[s.id] = { pts, reb, ast, blk, stl, tpm };
  });
}

export function simulateGame(
  home: Team, away: Team, players: Record<string, Player>, ctx: SimContext,
): SimOutput {
  // 1. pressure
  const pHome = pressure(home, away, players) + 3; // home edge
  const pAway = pressure(away, home, players);

  // 2. raw scores
  const rawHome = Math.max(8, pHome + gaussian(0, 7));
  const rawAway = Math.max(8, pAway + gaussian(0, 7));

  // 3. pace baseline
  const paceFactor = (teamThree(home, players) + teamThree(away, players)) / 2;
  let targetTotal = 190 + Math.round((paceFactor - 60) * 1.1) + randInt(-6, 10);
  targetTotal = Math.max(178, Math.min(250, targetTotal));

  // 4. normalize — compress differential, preserve dominance
  const rawDiff = rawHome - rawAway;
  const sign = rawDiff >= 0 ? 1 : -1;
  const compressed = Math.sqrt(Math.abs(rawDiff)) * 3.6 * sign;
  let homeScore = Math.round(targetTotal / 2 + compressed / 2);
  let awayScore = targetTotal - homeScore;

  // 5. clutch
  let clutch = false;
  let buzzerPlayerId: string | null = null;
  let buzzerName: string | null = null;
  const margin = Math.abs(homeScore - awayScore);
  if (margin <= 6 && (ctx.playoff || ctx.rivalry || chance(0.5))) {
    clutch = true;
    const homeStars = home.starIds.map((id) => players[id]).filter(Boolean);
    const awayStars = away.starIds.map((id) => players[id]).filter(Boolean);
    const homeHero = pick(homeStars);
    const awayHero = pick(awayStars);
    const homeClutch = homeHero.clutch + (homeScore >= awayScore ? 8 : 0);
    const awayClutch = awayHero.clutch + (awayScore > homeScore ? 8 : 0);
    if (homeClutch + gaussian(0, 20) >= awayClutch + gaussian(0, 20)) {
      homeScore = Math.max(homeScore, awayScore + randInt(1, 3));
      buzzerPlayerId = homeHero.id;
      buzzerName = homeHero.name;
    } else {
      awayScore = Math.max(awayScore, homeScore + randInt(1, 3));
      buzzerPlayerId = awayHero.id;
      buzzerName = awayHero.name;
    }
  }
  if (homeScore === awayScore) homeScore += 1;

  // 6. box scores
  const box: Record<string, BoxLine> = {};
  distributeBox(home, homeScore, players, box);
  distributeBox(away, awayScore, players, box);

  // 7. narrative
  const winner = homeScore > awayScore ? home : away;
  const loser = homeScore > awayScore ? away : home;
  const wScore = Math.max(homeScore, awayScore);
  const lScore = Math.min(homeScore, awayScore);
  const winStars = winner.starIds.map((id) => players[id]).filter(Boolean);
  const topStar = [...winStars].sort((a, b) => (box[b.id]?.pts ?? 0) - (box[a.id]?.pts ?? 0))[0];
  const topPts = box[topStar?.id]?.pts ?? 0;

  let narrative: string;
  if (clutch && buzzerName) {
    narrative = `0:04 — ${buzzerName} rises... BURIES IT AT THE BUZZER! ${teamLabel(winner)} edge ${teamLabel(loser)} ${wScore}-${lScore}.`;
  } else if (margin >= 24) {
    narrative = `${teamLabel(winner)} demolish ${teamLabel(loser)} ${wScore}-${lScore}. ${topStar?.name} pours in ${topPts}.`;
  } else if (margin <= 5) {
    narrative = `${teamLabel(winner)} survive ${wScore}-${lScore} over ${teamLabel(loser)}. ${topStar?.name} leads with ${topPts}.`;
  } else {
    narrative = `${teamLabel(winner)} beat ${teamLabel(loser)} ${wScore}-${lScore}. ${topStar?.name} drops ${topPts}.`;
  }

  return {
    result: {
      week: ctx.week, homeId: home.id, awayId: away.id,
      homeScore, awayScore, highlight: ctx.highlight, clutch, narrative,
    },
    box,
    buzzerPlayerId,
  };
}
