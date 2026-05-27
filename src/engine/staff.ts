// ═══ Coach & GM career tracking: stints, firing, hiring ═══
import type { Team, StaffStint, Coach, GM } from './types';
import { teamLabel } from './league';
import { genCoach, genGM } from '../data/generators';
import { chance } from './rng';

/** Open a fresh stint for a staff member joining a team. */
export function openStint(teamLabel: string, season: number): StaffStint {
  return {
    teamLabel, fromSeason: season, toSeason: null,
    wins: 0, losses: 0, titles: 0, bestResult: 'DNQ',
  };
}

// rank playoff finishes so we can keep the "best" one
const FINISH_RANK: Record<string, number> = {
  'DNQ': 0, 'First Round': 1, 'Conf. Semifinals': 2,
  'Conf. Finals': 3, 'Runner-Up': 4, 'Champion': 5,
};
function betterFinish(a: string, b: string): string {
  return (FINISH_RANK[b] ?? 0) > (FINISH_RANK[a] ?? 0) ? b : a;
}

/**
 * Update the current (open) stint of a team's coach and GM with the season
 * just completed.
 */
export function recordStaffSeason(team: Team, playoffResult: string, wonTitle: boolean): void {
  for (const staff of [team.coach, team.gm]) {
    let stint = staff.history.find((s) => s.toSeason === null);
    if (!stint) {
      // safety: no open stint — open one starting this season
      stint = openStint(teamLabel(team), team.seasonHistory.length
        ? team.seasonHistory[team.seasonHistory.length - 1].season
        : 0);
      staff.history.push(stint);
    }
    stint.wins += team.wins;
    stint.losses += team.losses;
    if (wonTitle) stint.titles += 1;
    stint.bestResult = betterFinish(stint.bestResult, playoffResult);
  }
}

/**
 * After a season, struggling teams may fire their coach and/or GM. A fired
 * staff member's stint is closed and they go to the free pool; the team hires
 * a replacement — preferring a previously-fired coach/GM from the pool (so
 * staff build multi-team histories) and otherwise generating a fresh one.
 * Returns short text lines describing the changes.
 */
export function processStaffChanges(
  team: Team, season: number, freeCoaches: Coach[], freeGMs: GM[],
): string[] {
  const news: string[] = [];
  const winPct = team.wins + team.losses > 0
    ? team.wins / (team.wins + team.losses)
    : 0.5;

  let fireChance = 0;
  if (winPct < 0.3) fireChance = 0.7;
  else if (winPct < 0.4) fireChance = 0.35;
  else if (winPct < 0.5) fireChance = 0.1;

  if (fireChance > 0 && chance(fireChance)) {
    const old = team.coach;
    const open = old.history.find((s) => s.toSeason === null);
    if (open) open.toSeason = season;
    freeCoaches.push(old);                       // fired coach joins the pool
    // hire: ~55% chance to rehire an experienced coach from the pool
    let fresh: Coach;
    if (freeCoaches.length > 1 && chance(0.55)) {
      // pick the most accomplished available coach (by career titles)
      freeCoaches.sort((a, b) =>
        b.history.reduce((n, s) => n + s.titles, 0)
        - a.history.reduce((n, s) => n + s.titles, 0));
      fresh = freeCoaches.shift()!;
    } else {
      fresh = genCoach();
    }
    fresh.history.push(openStint(teamLabel(team), season + 1));
    team.coach = fresh;
    news.push(`${teamLabel(team)} fire head coach ${old.name}; hire ${fresh.name}.`);
  }

  if (winPct < 0.32 && chance(0.4)) {
    const old = team.gm;
    const open = old.history.find((s) => s.toSeason === null);
    if (open) open.toSeason = season;
    freeGMs.push(old);
    let fresh: GM;
    if (freeGMs.length > 1 && chance(0.5)) {
      fresh = freeGMs.shift()!;
    } else {
      fresh = genGM();
    }
    fresh.history.push(openStint(teamLabel(team), season + 1));
    team.gm = fresh;
    news.push(`${teamLabel(team)} part ways with GM ${old.name}; hire ${fresh.name}.`);
  }

  return news;
}
