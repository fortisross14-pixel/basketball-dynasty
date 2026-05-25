// ═══ League helpers: team rating, attribute aggregation ═══
import type { Team, Player, Rarity } from './types';
import { RARITY_VALUE } from './types';

export function supportPenalty(core: number): number {
  if (core <= 55) return 3;
  if (core <= 65) return 2;
  if (core <= 70) return 1;
  return 0;
}

export function rarityPoints(rarity: Rarity): number {
  return rarity === 'Legend' ? 4 : RARITY_VALUE[rarity];
}

// resolve a team's 3 star Player objects from the league player map
export function teamStars(team: Team, players: Record<string, Player>): Player[] {
  return team.starIds.map((id) => players[id]).filter(Boolean);
}

/**
 * Base quality from the three stars' overall ratings (0..~10 scale).
 * Franchise star (starIds[0]) is weighted heaviest.
 */
export function teamBaseQuality(team: Team, players: Record<string, Player>): number {
  const s = teamStars(team, players);
  if (s.length < 3) return 0;
  const avg = s[0].overall * 0.5 + s[1].overall * 0.3 + s[2].overall * 0.2;
  return (avg - 55) / 4.4;
}

/**
 * Rarity bonus layer (the design spec):
 *  - franchise star: rarity value (Legend = +4)
 *  - stars 2+3 + GM: rarity values, combined and capped at +2
 *  - coach: rarity value (Legend = +4)
 *  - minus tiered support-core penalty
 */
export function teamRarityBonus(team: Team, players: Record<string, Player>): number {
  const s = teamStars(team, players);
  if (s.length < 3) return 0;
  const franchise = rarityPoints(s[0].rarity);
  const coach = rarityPoints(team.coach.rarity);
  const trioRaw =
    RARITY_VALUE[s[1].rarity] + RARITY_VALUE[s[2].rarity] + RARITY_VALUE[team.gm.rarity];
  const trio = Math.min(2, trioRaw);
  return franchise + coach + trio - supportPenalty(team.supportCore);
}

/** Effective team rating, clamped to the team's maxPoints cap. */
export function teamScoreWith(team: Team, players: Record<string, Player>): number {
  const raw = teamBaseQuality(team, players) + teamRarityBonus(team, players);
  return Math.max(0, Math.min(team.maxPoints, Math.round(raw)));
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
