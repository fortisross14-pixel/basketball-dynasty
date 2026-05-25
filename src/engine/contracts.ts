// ═══ Contract system: renewal probability, offer lengths ═══
import type { Player, Team } from './types';
import { rng, randInt, clamp } from './rng';
import { teamScore } from './league';

/**
 * Probability (0..1) that a player re-signs with their current team when
 * their contract expires. Driven by:
 *  - player rarity (stars are pickier; they want to win)
 *  - team success (recent playoffs, win rate, titles)
 *  - team morale
 *  - randomness
 *
 * Asymmetric design cases (per spec):
 *  - A Legend on a losing team with no recent playoffs ≈ very low (~10%).
 *  - A Common player whose team has lots of unused cap space may be let go
 *    by the team even if the player wants to stay (handled separately as a
 *    team-side non-renewal — see teamWantsToKeep()).
 */
export function renewalProbability(player: Player, team: Team, season: number): number {
  const winRate = team.wins + team.losses > 0
    ? team.wins / (team.wins + team.losses)
    : 0.5;
  const madePlayoffsRecently =
    team.lastPlayoffSeason !== null && season - team.lastPlayoffSeason <= 1;

  // base by rarity — higher-rarity players are more demanding
  const base: Record<string, number> = {
    Common: 0.78,
    Uncommon: 0.72,
    Rare: 0.62,
    Epic: 0.5,
    Legend: 0.42,
  };
  let p = base[player.rarity];

  // team success swing
  if (winRate >= 0.6) p += 0.18;
  else if (winRate >= 0.5) p += 0.06;
  else if (winRate >= 0.4) p -= 0.1;
  else p -= 0.22;

  if (madePlayoffsRecently) p += 0.14;
  else p -= 0.12;

  if (team.titles > 0) p += 0.05;

  // morale
  p += (team.morale - 65) * 0.004;

  // ambition penalty: stars on bad teams REALLY want out
  if ((player.rarity === 'Legend' || player.rarity === 'Epic') && winRate < 0.45 && !madePlayoffsRecently) {
    p -= 0.25;
  }

  // small noise
  p += (rng() - 0.5) * 0.1;

  return clamp(p, 0.05, 0.96);
}

/**
 * Team-side decision: does the team WANT to keep this player?
 * A team with lots of unused cap space and a weak/cheap player may decline
 * to renew, sending the player to free agency to chase an upgrade.
 */
export function teamWantsToKeep(player: Player, team: Team): boolean {
  const used = teamScore(team);
  const unused = team.maxPoints - used;
  // weak player + big unused cap → team lets them walk to chase an upgrade
  if ((player.rarity === 'Common' || player.rarity === 'Uncommon') && unused >= 5) {
    return rng() > 0.7; // ~70% chance the team moves on
  }
  // otherwise teams keep their guys
  return true;
}

/** Length (1-5 years) of a new/renewed contract — better players get longer deals. */
export function offerLength(player: Player): number {
  switch (player.rarity) {
    case 'Legend': return randInt(3, 5);
    case 'Epic': return randInt(3, 5);
    case 'Rare': return randInt(2, 4);
    case 'Uncommon': return randInt(1, 3);
    default: return randInt(1, 3);
  }
}

/** Human-readable reason a player left, for the offseason report. */
export function nonRenewalReason(player: Player, team: Team, playerChose: boolean): string {
  if (playerChose) {
    const winRate = team.wins + team.losses > 0 ? team.wins / (team.wins + team.losses) : 0.5;
    if ((player.rarity === 'Legend' || player.rarity === 'Epic') && winRate < 0.45) {
      return 'Star wants to contend elsewhere';
    }
    return 'Declined to re-sign';
  }
  return 'Team moved on (cap space for an upgrade)';
}
