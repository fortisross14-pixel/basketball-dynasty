// ═══ League helpers: team rating, attribute aggregation ═══
import type { Team, Player, Rarity } from './types';
import { RARITY_VALUE } from './types';

// ─── Support-core points: tiered by the 49-72 rating ───
// 70+ → +4, 65-69 → +3, 60-64 → +2, 55-59 → +1, below 55 → 0
export function supportPoints(core: number): number {
  if (core >= 70) return 4;
  if (core >= 65) return 3;
  if (core >= 60) return 2;
  if (core >= 55) return 1;
  return 0;
}

// rarity → points: Common 0, Uncommon 1, Rare 2, Epic 3, Legend 4
export function rarityPoints(rarity: Rarity): number {
  return RARITY_VALUE[rarity];
}

// resolve a team's 3 star Player objects from the league player map
export function teamStars(team: Team, players: Record<string, Player>): Player[] {
  return team.starIds.map((id) => players[id]).filter(Boolean);
}

/**
 * A team's score is the SUM of its parts — every piece competes for the same
 * budget, and the total cannot exceed the team's maxPoints cap:
 *
 *   franchise star + star2 + star3 + coach + GM + support points
 *
 * Each star/coach/GM contributes its rarity points (0-4); the support core
 * contributes 0-4 by tier. The raw sum is the team's "spend"; the score is
 * that sum clamped to the cap.
 */
export function teamRawScore(team: Team, players: Record<string, Player>): number {
  const s = teamStars(team, players);
  const starPts = s.reduce((sum, p) => sum + rarityPoints(p.rarity), 0);
  return starPts
    + rarityPoints(team.coach.rarity)
    + rarityPoints(team.gm.rarity)
    + supportPoints(team.supportCore);
}

/** Effective team rating — the raw rarity sum, clamped to the cap. */
export function teamScoreWith(team: Team, players: Record<string, Player>): number {
  return Math.min(team.maxPoints, teamRawScore(team, players));
}

/** Cap room left to spend: maxPoints minus everything except the 3 stars. */
export function nonStarSpend(team: Team): number {
  return rarityPoints(team.coach.rarity)
    + rarityPoints(team.gm.rarity)
    + supportPoints(team.supportCore);
}

// convenience wrapper used where a global player map is in scope via closure
let _activePlayers: Record<string, Player> | null = null;
export function bindPlayers(players: Record<string, Player>) { _activePlayers = players; }
export function teamScore(team: Team): number {
  if (!_activePlayers) return 0;
  return teamScoreWith(team, _activePlayers);
}

// ─── attribute aggregations for the sim ───
export function teamOffense(team: Team, players: Record<string, Player>): number {
  const s = teamStars(team, players);
  if (s.length < 3) return team.supportCore;
  const starAvg =
    (s[0].stats.twoP + s[0].stats.threeP + s[1].stats.twoP + s[1].stats.threeP +
     s[2].stats.twoP + s[2].stats.threeP) / 6;
  return starAvg * 0.7 + team.supportCore * 0.3;
}
export function teamDefense(team: Team, players: Record<string, Player>): number {
  const s = teamStars(team, players);
  if (s.length < 3) return team.supportCore;
  const starAvg =
    (s[0].stats.defense + s[1].stats.defense + s[2].stats.defense + s[0].stats.physical * 0.4) / 3.4;
  return starAvg * 0.65 + team.supportCore * 0.35;
}
export function teamThree(team: Team, players: Record<string, Player>): number {
  const s = teamStars(team, players);
  if (s.length < 3) return 60;
  return (s[0].stats.threeP + s[1].stats.threeP + s[2].stats.threeP) / 3;
}

export function teamLabel(team: Team): string {
  return `${team.city} ${team.name}`;
}
