// ═══ Cap-reconciliation: trades & release-and-sign-down ═══
// The final offseason step. No team may finish over its cap. An over-cap team
// either trades a star to a team that has room (swapping for a lower-rarity
// player), or — if no partner exists — releases a star and signs a cheaper
// free agent. Repeats one rarity-step at a time until every team is legal.
import type { Team, Player, TradeRecord } from './types';
import { RARITY_VALUE } from './types';
import { teamRawScore, teamStars, teamLabel, rarityPoints } from './league';
import { genPlayerOfRarity } from '../data/generators';
import { offerLength } from './contracts';

interface TradeCtx {
  teams: Team[];
  players: Record<string, Player>;
  freeAgentIds: string[];
}

const overBy = (t: Team, players: Record<string, Player>) =>
  teamRawScore(t, players) - t.maxPoints;

// the star whose rarity is highest (the most tradeable to shed points)
function priciestStar(t: Team, players: Record<string, Player>): Player | null {
  const stars = teamStars(t, players);
  if (stars.length === 0) return null;
  return stars.reduce((hi, s) =>
    RARITY_VALUE[s.rarity] > RARITY_VALUE[hi.rarity] ? s : hi, stars[0]);
}

// can a team absorb `pts` more rarity points without going over cap?
function roomFor(t: Team, players: Record<string, Player>, pts: number): boolean {
  return teamRawScore(t, players) + pts <= t.maxPoints;
}

/**
 * Reconcile every team to be at or under its cap.
 * Returns the list of trades/releases for the offseason report.
 */
export function reconcileCaps(ctx: TradeCtx): TradeRecord[] {
  const { teams, players } = ctx;
  const trades: TradeRecord[] = [];
  let guard = 0;

  while (guard < 400) {
    guard++;
    const overTeam = teams.find((t) => overBy(t, players) > 0);
    if (!overTeam) break; // everyone legal

    const need = overBy(overTeam, players);          // points to shed
    const out = priciestStar(overTeam, players);     // star we want to move
    if (!out || RARITY_VALUE[out.rarity] === 0) {
      // can't shed via stars (all Commons) — shouldn't happen, but bail safely
      break;
    }

    // ── try a TRADE: find a partner with a lower-rarity star and room ──
    // ideal: partner sends a star exactly `need` points cheaper, and the
    // partner can absorb our star without itself going over.
    let done = false;
    for (let step = need; step >= 1 && !done; step--) {
      // we want a partner star whose rarity = out.rarity - step
      const targetVal = RARITY_VALUE[out.rarity] - step;
      if (targetVal < 0) continue;
      for (const partner of teams) {
        if (partner.id === overTeam.id) continue;
        const pStars = teamStars(partner, players);
        const incoming = pStars.find((s) => RARITY_VALUE[s.rarity] === targetVal);
        if (!incoming) continue;
        // partner receives `out` (gains `step` points) — must stay legal
        if (!roomFor(partner, players, step)) continue;
        // execute swap
        swapStars(overTeam, partner, out, incoming, players);
        trades.push({
          kind: 'trade',
          teamALabel: teamLabel(overTeam),
          teamBLabel: teamLabel(partner),
          playerOut: out.name,
          playerOutRarity: out.rarity,
          playerIn: incoming.name,
          playerInRarity: incoming.rarity,
          reason: `${teamLabel(overTeam)} shed ${step} cap point${step > 1 ? 's' : ''}`,
        });
        done = true;
        break;
      }
    }
    if (done) continue;

    // ── no trade partner: RELEASE the star, sign a cheaper free agent ──
    // pick a free agent at least one rarity step cheaper that fits the cap.
    const fa = ctx.freeAgentIds
      .map((id) => players[id])
      .filter((p): p is Player => !!p && !p.retired)
      .filter((p) => RARITY_VALUE[p.rarity] < RARITY_VALUE[out.rarity])
      .sort((a, b) => RARITY_VALUE[b.rarity] - RARITY_VALUE[a.rarity]); // best affordable first

    // budget after releasing `out`: cap minus the team's spend without `out`
    const spendWithoutOut = teamRawScore(overTeam, players) - rarityPoints(out.rarity);
    const budgetAfter = overTeam.maxPoints - spendWithoutOut;
    let replacement = fa.find((p) => RARITY_VALUE[p.rarity] <= budgetAfter) ?? null;

    if (!replacement) {
      // nobody suitable in the pool — generate a Common filler
      replacement = genPlayerOfRarity('Common', { rookie: false });
      players[replacement.id] = replacement;
    } else {
      ctx.freeAgentIds = ctx.freeAgentIds.filter((id) => id !== replacement!.id);
    }

    // release `out` to the pool
    overTeam.starIds = overTeam.starIds.filter((id) => id !== out.id);
    out.teamId = null;
    out.contractYears = 0;
    out.contractLeft = 0;
    ctx.freeAgentIds.push(out.id);

    // sign the replacement
    replacement.teamId = overTeam.id;
    replacement.seasonsWithTeam = 0;
    replacement.contractYears = offerLength(replacement);
    replacement.contractLeft = replacement.contractYears;
    overTeam.starIds.push(replacement.id);

    trades.push({
      kind: 'release',
      teamALabel: teamLabel(overTeam),
      teamBLabel: 'Free Agency',
      playerOut: out.name,
      playerOutRarity: out.rarity,
      playerIn: replacement.name,
      playerInRarity: replacement.rarity,
      reason: `${teamLabel(overTeam)} released ${out.rarity} for ${replacement.rarity} to clear the cap`,
    });
  }

  return trades;
}

// swap two stars between teams
function swapStars(a: Team, b: Team, fromA: Player, fromB: Player, players: Record<string, Player>): void {
  a.starIds = a.starIds.filter((id) => id !== fromA.id);
  b.starIds = b.starIds.filter((id) => id !== fromB.id);
  a.starIds.push(fromB.id);
  b.starIds.push(fromA.id);
  fromA.teamId = b.id;
  fromA.seasonsWithTeam = 0;
  fromB.teamId = a.id;
  fromB.seasonsWithTeam = 0;
  // contracts travel with the player; nothing else changes
  void players;
}
