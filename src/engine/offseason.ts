// ═══ Offseason: retirement → cap reroll → support → draft → free agency ═══
import type {
  LeagueState, Team, Player, OffseasonReport, HistoryEntry, Rarity,
} from './types';
import { POP_TARGET, RARITY_TARGETS, RARITY_ORDER, RARITY_VALUE } from './types';
import {
  teamStars, teamLabel, nonStarSpend, franchisePlayer,
} from './league';
import {
  renewalProbability, teamWantsToKeep, offerLength, nonRenewalReason,
} from './contracts';
import { genPlayerOfRarity } from '../data/generators';
import { RELOCATION_CITIES, MARKET_BASE } from '../data/teamSeeds';
import { randInt, rng, chance, pick, shuffle, gaussian, clamp } from './rng';
import { computeAwards, applyAwardsToCareers } from './awards';
import { reconcileCaps } from './trades';
import { recordStaffSeason, processStaffChanges } from './staff';

// ─── age-curve progression applied to every active player ───
function progress(p: Player) {
  p.age++;
  p.seasonsPlayed++;
  let delta = 0;
  if (p.age <= 22) delta = randInt(2, 6);
  else if (p.age <= 27) delta = randInt(0, 4);
  else if (p.age <= 32) delta = randInt(-1, 2);
  else if (p.age <= 36) delta = randInt(-5, 0);
  else delta = randInt(-9, -2);
  if (delta > 0) delta = Math.min(delta, Math.max(0, p.potential - p.overall));
  p.overall = clamp(p.overall + delta, 40, 99);
  for (const k of ['twoP', 'threeP', 'physical', 'passing', 'defense'] as const) {
    p.stats[k] = clamp(p.stats[k] + Math.round(delta * (0.6 + rng() * 0.8)), 35, 99);
  }
  // rarity can climb for risers
  if (p.overall >= 91 && p.rarity !== 'Legend' && chance(0.2)) p.rarity = 'Legend';
  else if (p.overall >= 83 && (p.rarity === 'Rare' || p.rarity === 'Uncommon') && chance(0.25)) p.rarity = 'Epic';
  else if (p.overall >= 73 && (p.rarity === 'Uncommon' || p.rarity === 'Common') && chance(0.25)) p.rarity = 'Rare';
}

// snapshot a finished season into a player's season log
function logSeason(p: Player, state: LeagueState) {
  const line = state.seasonStats[p.id];
  const team = state.teams.find((t) => t.id === p.teamId);
  if (!line || !team) return;
  p.seasonLog.push({
    season: state.season,
    teamId: team.id,
    teamLabel: teamLabel(team),
    games: line.games,
    points: line.points,
    rebounds: line.rebounds,
    assists: line.assists,
    blocks: line.blocks,
    steals: line.steals,
    threes: line.threes,
    tripleDoubles: line.tripleDoubles,
    champion: state.champion === team.id,
    mvp: false, // set later if MVP
  });
}

export function runOffseason(state: LeagueState): LeagueState {
  const season = state.season;
  const teams = state.teams.map((t) => ({ ...t, starIds: [...t.starIds] }));
  const players: Record<string, Player> = {};
  for (const [id, p] of Object.entries(state.players)) {
    players[id] = { ...p, stats: { ...p.stats }, career: { ...p.career }, seasonLog: [...p.seasonLog] };
  }
  let freeAgentIds = [...state.freeAgentIds];
  const history: HistoryEntry[] = [...state.history];
  const teamById = new Map(teams.map((t) => [t.id, t]));

  const report: OffseasonReport = {
    season, retirements: [], capChanges: [], supportChanges: [],
    draftPicks: [], signings: [], nonRenewals: [], trades: [],
  };

  // ── AWARDS — computed first, on the just-finished season, before any
  //    roster changes so retiring players can still win ──
  const awards = computeAwards(state);
  // write MVP / ROY / All-Star honors onto permanent career totals
  applyAwardsToCareers(awards, players);

  // ── 0. log the completed season into player logs ──
  const allActive = Object.values(players).filter((p) => !p.retired);
  for (const p of allActive) logSeason(p, state);
  // every rostered player just completed a season with their team
  for (const t of teams) {
    for (const id of t.starIds) {
      const p = players[id];
      if (p) p.seasonsWithTeam += 1;
    }
  }

  // mark the MVP's season log + add a history line (MVP comes from awards)
  const mvp = awards.mvp ? players[awards.mvp.playerId] ?? null : null;
  if (mvp) {
    const lastLog = mvp.seasonLog[mvp.seasonLog.length - 1];
    if (lastLog && lastLog.season === season) lastLog.mvp = true;
    history.push({
      season, kind: 'mvp',
      text: `${awards.mvp!.playerName} (${awards.mvp!.teamLabel}) named Season MVP.`,
    });
  }

  // champion archive entry
  const champTeam = state.champion ? teamById.get(state.champion) : null;
  let archive = [...state.archive];
  const awardsHistory = [...state.awardsHistory, awards];
  if (champTeam) {
    // find runner-up from final bracket
    let runnerLabel = '—';
    if (state.playoffBracket) {
      const finalRound = Math.max(...state.playoffBracket.map((s) => s.round));
      const finals = state.playoffBracket.find((s) => s.round === finalRound);
      if (finals) {
        const runnerId = finals.winnerId === finals.highSeedId ? finals.lowSeedId : finals.highSeedId;
        const r = teamById.get(runnerId);
        if (r) runnerLabel = teamLabel(r);
      }
    }
    archive.push({
      season, championId: champTeam.id, championLabel: teamLabel(champTeam),
      runnerUpLabel: runnerLabel,
      mvpName: mvp ? mvp.name : '—',
      mvpTeamLabel: mvp && teamById.get(mvp.teamId ?? '') ? teamLabel(teamById.get(mvp.teamId!)!) : '—',
    });
    if (champTeam.titles > state.records.mostTitlesTeam.value) {
      state.records.mostTitlesTeam = { value: champTeam.titles, label: teamLabel(champTeam), season };
    }
  }

  // ── record each team's season-history row (before any roster changes) ──
  // derive how far each team got in the playoffs
  const playoffFinish = new Map<string, string>();
  if (state.playoffBracket) {
    const maxRound = Math.max(...state.playoffBracket.map((s) => s.round));
    // round-name for the round a team was eliminated in
    const roundLabel = (r: number): string => {
      if (r === 1) return 'First Round';
      if (r === 2) return 'Conf. Semifinals';
      if (r === 3) return 'Conf. Finals';
      if (r === 4) return 'Finals';
      return `Round ${r}`;
    };
    for (const series of state.playoffBracket) {
      // the loser of a series was eliminated in that round
      const loserId = series.winnerId
        ? (series.winnerId === series.highSeedId ? series.lowSeedId : series.highSeedId)
        : null;
      if (loserId && !playoffFinish.has(loserId)) {
        playoffFinish.set(loserId, roundLabel(series.round));
      }
    }
    // champion + runner-up overrides
    if (state.champion) playoffFinish.set(state.champion, 'Champion');
    const finals = state.playoffBracket.find((s) => s.round === maxRound);
    if (finals && finals.winnerId) {
      const runner = finals.winnerId === finals.highSeedId ? finals.lowSeedId : finals.highSeedId;
      playoffFinish.set(runner, 'Runner-Up');
    }
  }
  for (const t of teams) {
    const fp = franchisePlayer(t, players);
    const finish = playoffFinish.get(t.id) ?? 'DNQ';
    t.seasonHistory = [
      ...t.seasonHistory,
      {
        season,
        wins: t.wins,
        losses: t.losses,
        playoffResult: finish,
        franchisePlayer: fp ? fp.name : '—',
      },
    ];
    // update the coach's & GM's current stint with this season
    recordStaffSeason(t, finish, state.champion === t.id);
  }
  // struggling teams may fire their coach / GM (after stats are recorded)
  const freeCoaches = [...state.freeCoaches];
  const freeGMs = [...state.freeGMs];
  for (const t of teams) {
    const staffNews = processStaffChanges(t, season, freeCoaches, freeGMs);
    for (const line of staffNews) {
      history.push({ season, kind: 'signing', text: line });
    }
  }

  // ── 1. RETIREMENTS — players whose career length is reached ──
  for (const t of teams) {
    for (const id of [...t.starIds]) {
      const p = players[id];
      if (!p) continue;
      // age up first
      progress(p);
      // retire when career length is reached OR age catches up (realism cap)
      const ageForcesRetire = p.age >= 39 || (p.age >= 36 && chance(0.4));
      if (p.seasonsPlayed >= p.careerLength || ageForcesRetire) {
        p.retired = true;
        p.teamId = null;
        t.starIds = t.starIds.filter((x) => x !== id);
        report.retirements.push({
          name: p.name, rarity: p.rarity, teamLabel: teamLabel(t), seasons: p.seasonsPlayed,
        });
        const legacy = p.career.championships > 0 || p.rarity === 'Legend' || p.rarity === 'Epic';
        history.push({
          season, kind: 'retirement',
          text: `${p.name} retires after ${p.seasonsPlayed} seasons${legacy ? ' — a Hall of Fame career' : ''}.`,
        });
      }
    }
  }
  // age free agents too (they can retire from the pool)
  for (const id of [...freeAgentIds]) {
    const p = players[id];
    if (!p) continue;
    progress(p);
    if (p.seasonsPlayed >= p.careerLength || p.age >= 39) {
      p.retired = true;
      freeAgentIds = freeAgentIds.filter((x) => x !== id);
      report.retirements.push({
        name: p.name, rarity: p.rarity, teamLabel: 'Free Agent', seasons: p.seasonsPlayed,
      });
    }
  }

  // ── 2. TEAM MAX POINTS CHANGE — reroll the random component ──
  for (const t of teams) {
    const before = t.maxPoints;
    t.randomValue = randInt(8, 12);
    t.maxPoints = t.marketValue + t.randomValue;
    if (t.maxPoints !== before) {
      report.capChanges.push({
        teamLabel: teamLabel(t), before, after: t.maxPoints, delta: t.maxPoints - before,
      });
    }
  }

  // ── 3. SUPPORT CORE UPDATE — normal dist −5..+5, clamped 49..72 ──
  for (const t of teams) {
    const before = t.supportCore;
    const change = clamp(Math.round(gaussian(0, 2.4)), -5, 5);
    t.supportCore = clamp(before + change, 49, 72);
    if (t.supportCore !== before) {
      report.supportChanges.push({ teamLabel: teamLabel(t), before, after: t.supportCore });
    }
  }

  // ── 4. CONTRACTS — decrement, then handle expirations ──
  // contract decrement happens for all rostered stars
  for (const t of teams) {
    for (const id of t.starIds) {
      const p = players[id];
      if (p) p.contractLeft = Math.max(0, p.contractLeft - 1);
    }
  }
  // expirations: player at contractLeft 0 → renew or hit free agency
  for (const t of teams) {
    for (const id of [...t.starIds]) {
      const p = players[id];
      if (!p || p.contractLeft > 0) continue;
      const playerWants = rng() < renewalProbability(p, t, season);
      const teamWants = teamWantsToKeep(p, t);
      if (playerWants && teamWants) {
        // renew
        p.contractYears = offerLength(p);
        p.contractLeft = p.contractYears;
        history.push({
          season, kind: 'contract',
          text: `${p.name} re-signs with ${teamLabel(t)} (${p.contractYears}-year deal).`,
        });
      } else {
        // to free agency
        t.starIds = t.starIds.filter((x) => x !== id);
        p.teamId = null;
        p.contractYears = 0;
        p.contractLeft = 0;
        freeAgentIds.push(id);
        report.nonRenewals.push({
          playerName: p.name, rarity: p.rarity, fromTeamLabel: teamLabel(t),
          reason: nonRenewalReason(p, t, !teamWants ? false : !playerWants),
        });
      }
    }
  }

  // ── 5. DRAFT — replenish pool toward POP_TARGET, worst teams pick first ──
  const activeCount = Object.values(players).filter((p) => !p.retired).length;
  const needed = Math.max(0, POP_TARGET - activeCount);
  // build a draft class that nudges rarity distribution back toward targets
  const draftClass: Player[] = [];
  const currentByRarity: Record<Rarity, number> = {
    Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legend: 0,
  };
  for (const p of Object.values(players)) {
    if (!p.retired) currentByRarity[p.rarity]++;
  }
  for (let i = 0; i < needed; i++) {
    // pick the rarity furthest below target
    let bestRarity: Rarity = 'Common';
    let biggestGap = -Infinity;
    for (const r of RARITY_ORDER) {
      const gap = RARITY_TARGETS[r] - currentByRarity[r];
      if (gap > biggestGap) { biggestGap = gap; bestRarity = r; }
    }
    const prospect = genPlayerOfRarity(bestRarity, { rookie: true });
    currentByRarity[bestRarity]++;
    draftClass.push(prospect);
    players[prospect.id] = prospect;
  }
  // draft order: teams with open star slots, worst record first
  const draftingTeams = teams
    .filter((t) => t.starIds.length < 3)
    .sort((a, b) => a.wins - b.wins);

  // remaining STAR budget for a team: cap minus non-star spend minus
  // rarity points of stars already signed. A team can only draft/sign a
  // player whose rarity points fit this budget. Common (+0) always fits,
  // so a cap-strapped team can always still fill its slots.
  const starBudgetLeft = (t: Team): number => {
    const onRoster = teamStars(t, players)
      .reduce((sum, p) => sum + RARITY_VALUE[p.rarity], 0);
    return t.maxPoints - nonStarSpend(t) - onRoster;
  };

  // best prospects first
  const prospectQueue = [...draftClass].sort((a, b) => b.potential - a.potential);
  let pickNo = 1;
  // teams may need multiple picks; loop until all slots filled or class exhausted
  let progressMade = true;
  while (prospectQueue.length > 0 && progressMade) {
    progressMade = false;
    for (const t of draftingTeams) {
      if (t.starIds.length >= 3) continue;
      const budget = Math.max(0, starBudgetLeft(t));
      // pick the best prospect the team can actually afford
      const idx = prospectQueue.findIndex((p) => RARITY_VALUE[p.rarity] <= budget);
      const prospect = idx >= 0 ? prospectQueue.splice(idx, 1)[0] : null;
      if (!prospect) continue;
      prospect.teamId = t.id;
      prospect.seasonsWithTeam = 0;
      prospect.contractYears = offerLength(prospect);
      prospect.contractLeft = prospect.contractYears;
      t.starIds.push(prospect.id);
      report.draftPicks.push({
        pick: pickNo++, teamLabel: teamLabel(t), playerName: prospect.name, rarity: prospect.rarity,
      });
      progressMade = true;
    }
  }
  // any undrafted prospects → free agency
  for (const p of prospectQueue) {
    if (p.teamId === null) freeAgentIds.push(p.id);
  }
  if (report.draftPicks.length > 0) {
    const top = report.draftPicks[0];
    history.push({
      season, kind: 'draft',
      text: `DRAFT: ${top.teamLabel} select ${top.playerName} (${top.rarity}) at #1.`,
    });
  }

  // ── 6. FREE AGENCY — teams pick within their remaining cap budget ──
  // Teams that still need stars sign first; among them, the team with the
  // most remaining STAR budget picks first. A team can only sign a player
  // whose rarity points fit its budget (Common always fits).
  let faPool = freeAgentIds
    .map((id) => players[id])
    .filter((p) => p && !p.retired) as Player[];

  const needyTeams = teams.filter((t) => t.starIds.length < 3);

  // process needy teams repeatedly: each pass, the neediest-budget team signs
  // the best affordable free agent
  let faGuard = 0;
  while (needyTeams.some((t) => t.starIds.length < 3) && faGuard < 200) {
    faGuard++;
    const stillNeedy = needyTeams
      .filter((t) => t.starIds.length < 3)
      .sort((a, b) => starBudgetLeft(b) - starBudgetLeft(a));
    const t = stillNeedy[0];
    if (!t) break;
    const budget = Math.max(0, starBudgetLeft(t));
    // best affordable free agent (by overall)
    faPool.sort((a, b) => b.overall - a.overall);
    const idx = faPool.findIndex((p) => RARITY_VALUE[p.rarity] <= budget);
    let signed = idx >= 0 ? faPool.splice(idx, 1)[0] : null;
    if (!signed) {
      // pool has nobody affordable — generate a Common filler so the team
      // can always field 3 stars
      signed = genPlayerOfRarity('Common', { rookie: false });
      players[signed.id] = signed;
    }
    signed.teamId = t.id;
    signed.seasonsWithTeam = 0;
    signed.contractYears = offerLength(signed);
    signed.contractLeft = signed.contractYears;
    t.starIds.push(signed.id);
    freeAgentIds = freeAgentIds.filter((x) => x !== signed!.id);
    report.signings.push({
      playerName: signed.name, rarity: signed.rarity,
      toTeamLabel: teamLabel(t), years: signed.contractYears,
    });
    if (signed.rarity === 'Epic' || signed.rarity === 'Legend') {
      history.push({
        season, kind: 'signing',
        text: `FREE AGENCY: ${signed.name} (${signed.rarity}) signs with ${teamLabel(t)}.`,
      });
    }
  }

  // teams with spare budget may upgrade — swap their weakest star for a
  // better free agent, but only if the new star's rarity fits the budget
  // freed by releasing the weakest.
  const upgraders = shuffle(teams.filter((t) => t.starIds.length === 3));
  for (const t of upgraders) {
    if (faPool.length === 0) break;
    const stars = teamStars(t, players);
    const weakest = stars.reduce((w, s) => (s.overall < w.overall ? s : w), stars[0]);
    // budget available if we release the weakest star
    const budgetAfterRelease = starBudgetLeft(t) + RARITY_VALUE[weakest.rarity];
    faPool.sort((a, b) => b.overall - a.overall);
    const target = faPool.find(
      (p) => p.overall > weakest.overall + 3 && RARITY_VALUE[p.rarity] <= budgetAfterRelease,
    );
    if (target) {
      faPool = faPool.filter((p) => p.id !== target.id);
      // weakest → free agency
      t.starIds = t.starIds.filter((x) => x !== weakest.id);
      weakest.teamId = null;
      weakest.contractYears = 0;
      weakest.contractLeft = 0;
      freeAgentIds.push(weakest.id);
      // target → team
      target.teamId = t.id;
      target.seasonsWithTeam = 0;
      target.contractYears = offerLength(target);
      target.contractLeft = target.contractYears;
      t.starIds.push(target.id);
      freeAgentIds = freeAgentIds.filter((x) => x !== target.id);
      report.signings.push({
        playerName: target.name, rarity: target.rarity,
        toTeamLabel: teamLabel(t), years: target.contractYears,
      });
    }
  }

  // ── 7. TRADES — cap reconciliation. No team may end over its cap; any
  //    that does trades a star (or releases one and signs cheaper). ──
  report.trades = reconcileCaps({ teams, players, freeAgentIds });
  // reconcileCaps may have repopulated freeAgentIds via release moves
  freeAgentIds = freeAgentIds.filter((id) => {
    const p = players[id];
    return p && !p.retired && p.teamId === null;
  });
  // also capture any released players not yet in the list
  for (const p of Object.values(players)) {
    if (!p.retired && p.teamId === null && !freeAgentIds.includes(p.id)) {
      freeAgentIds.push(p.id);
    }
  }

  // ── 8. RELOCATION — every 5-6 years, a struggling small-market team moves ──
  const yearsIn = season - 2026;
  if (yearsIn > 0 && yearsIn % randInt(5, 6) === 0 && chance(0.7)) {
    const candidates = teams
      .filter((t) => t.market === 'Regular')
      .sort((a, b) => a.titles - b.titles);
    const mover = candidates[0];
    if (mover) {
      const dest = pick(RELOCATION_CITIES);
      const oldLabel = teamLabel(mover);
      mover.relocatedFrom = oldLabel;
      mover.city = dest.city;
      mover.name = dest.name;
      mover.abbr = dest.abbr;
      mover.primary = dest.primary;
      mover.secondary = dest.secondary;
      mover.market = dest.market;
      mover.marketValue = MARKET_BASE[dest.market];
      mover.maxPoints = mover.marketValue + mover.randomValue;
      history.push({
        season, kind: 'relocation',
        text: `RELOCATION: The ${oldLabel} move to ${dest.city} — now the ${dest.city} ${dest.name}.`,
      });
    }
  }

  // ── 8. reset records for the new season ──
  for (const t of teams) {
    t.wins = 0;
    t.losses = 0;
    t.morale = clamp(t.morale, 45, 95);
  }

  const news: string[] = [];
  if (report.retirements.length > 0) {
    news.push(`${report.retirements.length} players retired this offseason.`);
  }
  if (report.signings.length > 0) {
    const big = report.signings.find((s) => s.rarity === 'Legend' || s.rarity === 'Epic');
    if (big) news.push(`${big.playerName} signs with ${big.toTeamLabel}.`);
  }
  if (report.draftPicks.length > 0) {
    news.push(`${report.draftPicks[0].playerName} drafted #1 by ${report.draftPicks[0].teamLabel}.`);
  }

  return {
    season: season + 1,
    week: 1,
    phase: 'regular',
    teams,
    players,
    freeAgentIds,
    freeCoaches,
    freeGMs,
    results: [],
    seasonStats: {},
    playoffBracket: null,
    champion: null,
    records: state.records,
    history,
    archive,
    awardsHistory,
    newsFeed: news,
    lastOffseason: report,
    lastAwards: awards,
  };
}
