// ═══ Season flow: weekly sim, standings, playoffs ═══
import type {
  LeagueState, Team, Player, GameResult, SeasonStatLine, PlayoffSeries,
} from './types';
import { WEEKS_REGULAR, WINS_NEEDED, SERIES_LENGTH } from './types';
import { simulateGame } from './simulation';
import { buildPlayByPlay } from './playbyplay';
import { teamScoreWith, teamLabel } from './league';
import { randInt, chance, shuffle, genId } from './rng';

// ─── schedule: several rounds per week → ~49 games/team/season ───
function weekSchedule(teams: Team[]): [Team, Team][] {
  const rounds = randInt(3, 4);
  const all: [Team, Team][] = [];
  for (let r = 0; r < rounds; r++) {
    const pool = shuffle([...teams]);
    for (let i = 0; i + 1 < pool.length; i += 2) {
      all.push([pool[i], pool[i + 1]]);
    }
  }
  return all;
}

function ensureStat(stats: Record<string, SeasonStatLine>, p: Player, teamId: string) {
  if (!stats[p.id]) {
    stats[p.id] = {
      playerId: p.id, teamId, games: 0, points: 0, rebounds: 0, assists: 0,
      blocks: 0, steals: 0, threes: 0, tripleDoubles: 0,
    };
  }
}

// ─── simulate one regular-season week ───
export function simulateWeek(state: LeagueState): LeagueState {
  const teams = state.teams.map((t) => ({ ...t }));
  const players = { ...state.players };
  const byId = new Map(teams.map((t) => [t.id, t]));
  const stats: Record<string, SeasonStatLine> = { ...state.seasonStats };
  const newResults: GameResult[] = [];
  const records = { ...state.records };

  for (const [h, a] of weekSchedule(teams)) {
    const home = byId.get(h.id)!;
    const away = byId.get(a.id)!;
    const rivalry = home.division === away.division;
    const big = teamScoreWith(home, players) >= 12 && teamScoreWith(away, players) >= 12;
    const sim = simulateGame(home, away, players, {
      week: state.week, highlight: rivalry || big || chance(0.15), playoff: false, rivalry,
    });
    newResults.push(sim.result);

    if (sim.result.homeScore > sim.result.awayScore) { home.wins++; away.losses++; }
    else { away.wins++; home.losses++; }

    for (const team of [home, away]) {
      for (const id of team.starIds) {
        const p = players[id];
        if (!p) continue;
        const b = sim.box[id];
        if (!b) continue;
        ensureStat(stats, p, team.id);
        const line = stats[id];
        line.games++; line.points += b.pts; line.rebounds += b.reb;
        line.assists += b.ast; line.blocks += b.blk; line.steals += b.stl;
        line.threes += b.tpm;
        const td = [b.pts >= 10, b.reb >= 10, b.ast >= 10].filter(Boolean).length >= 3;
        if (td) line.tripleDoubles++;

        // career running totals
        const c = p.career;
        c.games++; c.points += b.pts; c.rebounds += b.reb; c.assists += b.ast;
        c.blocks += b.blk; c.steals += b.stl; c.threes += b.tpm;
        if (td) c.tripleDoubles++;
        if (sim.buzzerPlayerId === id) c.buzzerBeaters++;

        // records
        if (b.pts > records.mostPointsGame.value)
          records.mostPointsGame = { value: b.pts, label: p.name, season: state.season };
        if (b.ast > records.mostAssistsGame.value)
          records.mostAssistsGame = { value: b.ast, label: p.name, season: state.season };
        if (b.reb > records.mostReboundsGame.value)
          records.mostReboundsGame = { value: b.reb, label: p.name, season: state.season };
        if (line.threes > records.mostThreesSeason.value)
          records.mostThreesSeason = { value: line.threes, label: p.name, season: state.season };
        if (c.points > records.mostCareerPoints.value)
          records.mostCareerPoints = { value: c.points, label: p.name, season: state.season };
        if (c.assists >= 1000) {
          if (!records.youngestTo1000Assists || p.age < records.youngestTo1000Assists.value) {
            records.youngestTo1000Assists = { value: p.age, label: p.name, season: state.season };
          }
        }
      }
    }
    const winT = sim.result.homeScore > sim.result.awayScore ? home : away;
    const loseT = winT === home ? away : home;
    winT.morale = Math.min(100, winT.morale + 1);
    loseT.morale = Math.max(40, loseT.morale - 1);
  }

  const news = newResults.filter((r) => r.clutch).slice(0, 5).map((r) => r.narrative);
  const nextWeek = state.week + 1;
  const enteringPlayoffs = nextWeek > WEEKS_REGULAR;

  let bracket = state.playoffBracket;
  let history = state.history;
  if (enteringPlayoffs && !bracket) {
    bracket = seedPlayoffs(teams, players);
    // mark playoff appearances
    const inPlayoffs = new Set<string>();
    bracket.forEach((s) => { inPlayoffs.add(s.highSeedId); inPlayoffs.add(s.lowSeedId); });
    teams.forEach((t) => {
      if (inPlayoffs.has(t.id)) {
        t.playoffAppearances++;
        t.lastPlayoffSeason = state.season;
      }
    });
    history = [...history, {
      season: state.season, kind: 'milestone',
      text: 'The regular season ends — 16 teams advance to the playoffs.',
    }];
  }

  return {
    ...state,
    week: nextWeek,
    phase: enteringPlayoffs ? 'playoffs' : 'regular',
    teams,
    players,
    results: [...state.results, ...newResults],
    seasonStats: stats,
    records,
    playoffBracket: bracket,
    history,
    newsFeed: news,
  };
}

// ═══════════════════ PLAYOFFS ═══════════════════
// Best-of-3 series. Series are NOT auto-resolved: the UI plays each game
// individually via simulatePlayoffGame(). advancePlayoffRound() only builds
// the next round once every series in the current round has a winner.

// ─── playoff seeding: top 8 per conference, 1v8 2v7 3v6 4v5 ───
function seedPlayoffs(teams: Team[], players: Record<string, Player>): PlayoffSeries[] {
  const series: PlayoffSeries[] = [];
  for (const conf of ['East', 'West'] as const) {
    const seeded = teams
      .filter((t) => t.conference === conf)
      .sort((a, b) => b.wins - a.wins || teamScoreWith(b, players) - teamScoreWith(a, players))
      .slice(0, 8);
    for (let i = 0; i < 4; i++) {
      series.push(newSeries(1, seeded[i], i + 1, seeded[7 - i], 8 - i));
    }
  }
  return series;
}

function newSeries(round: number, high: Team, highSeed: number, low: Team, lowSeed: number): PlayoffSeries {
  const length = SERIES_LENGTH[round] ?? 3;
  return {
    id: genId('sr'),
    round,
    highSeedId: high.id,
    lowSeedId: low.id,
    highSeed,
    lowSeed,
    highWins: 0,
    lowWins: 0,
    winnerId: null,
    games: Array.from({ length }, () => ({ result: null, played: false })),
  };
}

/**
 * Does the higher seed host game `gi` (0-indexed)?
 * Higher seed hosts the odd-numbered games (1,3,5,7 → indices 0,2,4,6),
 * i.e. a 2-2-1 / 2-2-1-1-1 / 2-2-1-1-1-1-1 pattern.
 */
function highSeedHosts(gi: number): boolean {
  return gi % 2 === 0;
}

// which game index is next to play in a series (or -1 if series is done)
export function nextGameIndex(s: PlayoffSeries): number {
  if (s.winnerId) return -1;
  for (let i = 0; i < s.games.length; i++) {
    if (!s.games[i].played) return i;
  }
  return -1;
}

/**
 * Simulate ONE game in ONE series. Returns the updated league state.
 * Close games (≤5 pts) in rounds 2+ get a final-2:00 play-by-play attached.
 */
export function simulatePlayoffGame(state: LeagueState, seriesId: string): LeagueState {
  if (!state.playoffBracket) return state;
  const teams = state.teams.map((t) => ({ ...t }));
  const players = { ...state.players };
  const byId = new Map(teams.map((t) => [t.id, t]));
  const bracket = state.playoffBracket.map((s) => ({
    ...s, games: s.games.map((g) => ({ ...g })),
  }));
  const series = bracket.find((s) => s.id === seriesId);
  if (!series || series.winnerId) return state;

  const gi = nextGameIndex(series);
  if (gi < 0) return state;

  const high = byId.get(series.highSeedId)!;
  const low = byId.get(series.lowSeedId)!;
  // higher seed hosts odd-numbered games (2-2-1-1-1... pattern)
  const homeIsHigh = highSeedHosts(gi);
  const home = homeIsHigh ? high : low;
  const away = homeIsHigh ? low : high;

  const sim = simulateGame(home, away, players, {
    week: 99, highlight: true, playoff: true, rivalry: home.division === away.division,
  });
  const result: GameResult = { ...sim.result };

  // play-by-play for close games in rounds 2+ (NOT the first round)
  const margin = Math.abs(result.homeScore - result.awayScore);
  if (series.round >= 2 && margin <= 5) {
    const homeStars = home.starIds.map((id) => players[id]).filter(Boolean);
    const awayStars = away.starIds.map((id) => players[id]).filter(Boolean);
    result.playByPlay = buildPlayByPlay(
      home, away, result.homeScore, result.awayScore, homeStars, awayStars,
    );
  }

  series.games[gi] = { result, played: true };
  const homeWon = result.homeScore > result.awayScore;
  const highWon = (homeIsHigh && homeWon) || (!homeIsHigh && !homeWon);
  if (highWon) series.highWins++; else series.lowWins++;
  const needed = WINS_NEEDED[series.round] ?? 2;
  if (series.highWins >= needed || series.lowWins >= needed) {
    series.winnerId = series.highWins > series.lowWins ? high.id : low.id;
  }

  return { ...state, teams, players, playoffBracket: bracket };
}

// are all series in the current (highest) round decided?
export function currentRoundComplete(state: LeagueState): boolean {
  if (!state.playoffBracket) return false;
  const round = Math.max(...state.playoffBracket.map((s) => s.round));
  return state.playoffBracket
    .filter((s) => s.round === round)
    .every((s) => s.winnerId !== null);
}

/**
 * Build the next round (or crown the champion). Only valid when the current
 * round is complete — the UI guards this with currentRoundComplete().
 */
export function advancePlayoffRound(state: LeagueState): LeagueState {
  if (!state.playoffBracket || !currentRoundComplete(state)) return state;
  const teams = state.teams.map((t) => ({ ...t }));
  const players = { ...state.players };
  const byId = new Map(teams.map((t) => [t.id, t]));
  const bracket = state.playoffBracket.map((s) => ({ ...s }));
  const round = Math.max(...bracket.map((s) => s.round));
  const roundSeries = bracket.filter((s) => s.round === round);
  const winners = roundSeries.map((s) => s.winnerId!);

  // champion crowned
  if (winners.length === 1) {
    const champ = byId.get(winners[0])!;
    champ.titles++;
    for (const id of champ.starIds) {
      const p = players[id];
      if (p) { p.career.championships++; p.career.titleYears.push(state.season); }
    }
    const history = [...state.history, {
      season: state.season, kind: 'champion' as const,
      text: `${teamLabel(champ)} win the ${state.season} Championship!`,
    }];
    return {
      ...state, teams, players, playoffBracket: bracket,
      champion: champ.id, history, phase: 'offseason',
    };
  }

  // build next round — pair winners, better regular-season record is high seed
  const next: PlayoffSeries[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const a = byId.get(winners[i])!;
    const b = byId.get(winners[i + 1])!;
    const aSeed = roundSeries.find((s) => s.winnerId === a.id)!;
    const bSeed = roundSeries.find((s) => s.winnerId === b.id)!;
    const aSeedNo = aSeed.winnerId === aSeed.highSeedId ? aSeed.highSeed : aSeed.lowSeed;
    const bSeedNo = bSeed.winnerId === bSeed.highSeedId ? bSeed.highSeed : bSeed.lowSeed;
    const aIsHigh = a.wins > b.wins || (a.wins === b.wins && aSeedNo <= bSeedNo);
    const high = aIsHigh ? a : b;
    const low = aIsHigh ? b : a;
    const highSeedNo = aIsHigh ? aSeedNo : bSeedNo;
    const lowSeedNo = aIsHigh ? bSeedNo : aSeedNo;
    next.push(newSeries(round + 1, high, highSeedNo, low, lowSeedNo));
  }

  return { ...state, teams, players, playoffBracket: [...bracket, ...next] };
}
