// ═══ Season flow: weekly sim, standings, playoffs ═══
import type {
  LeagueState, Team, Player, GameResult, SeasonStatLine, PlayoffSeries,
} from './types';
import { WEEKS_REGULAR } from './types';
import { simulateGame } from './simulation';
import { teamScoreWith, teamLabel } from './league';
import { randInt, chance, shuffle } from './rng';

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

// ─── playoff seeding ───
function seedPlayoffs(teams: Team[], players: Record<string, Player>): PlayoffSeries[] {
  const series: PlayoffSeries[] = [];
  for (const conf of ['East', 'West'] as const) {
    const seeded = teams
      .filter((t) => t.conference === conf)
      .sort((a, b) => b.wins - a.wins || teamScoreWith(b, players) - teamScoreWith(a, players))
      .slice(0, 8);
    for (let i = 0; i < 4; i++) {
      series.push({
        round: 1, highSeedId: seeded[i].id, lowSeedId: seeded[7 - i].id,
        highWins: 0, lowWins: 0, winnerId: null, games: [],
      });
    }
  }
  return series;
}

// ─── simulate one playoff round (best of 3) ───
export function simulatePlayoffRound(state: LeagueState): LeagueState {
  if (!state.playoffBracket) return state;
  const teams = state.teams.map((t) => ({ ...t }));
  const players = { ...state.players };
  const byId = new Map(teams.map((t) => [t.id, t]));
  const bracket = state.playoffBracket.map((s) => ({ ...s, games: [...s.games] }));
  const active = bracket.filter((s) => !s.winnerId);
  const round = active[0]?.round ?? 1;

  for (const s of active) {
    const high = byId.get(s.highSeedId)!;
    const low = byId.get(s.lowSeedId)!;
    while (s.highWins < 2 && s.lowWins < 2) {
      const homeIsHigh = s.highWins + s.lowWins !== 1;
      const home = homeIsHigh ? high : low;
      const away = homeIsHigh ? low : high;
      const sim = simulateGame(home, away, players, {
        week: 99, highlight: true, playoff: true, rivalry: home.division === away.division,
      });
      s.games.push(sim.result);
      const homeWon = sim.result.homeScore > sim.result.awayScore;
      const highWon = (homeIsHigh && homeWon) || (!homeIsHigh && !homeWon);
      if (highWon) s.highWins++; else s.lowWins++;
    }
    s.winnerId = s.highWins > s.lowWins ? high.id : low.id;
  }

  const winners = active.map((s) => s.winnerId!);
  let champion = state.champion;
  let history = state.history;
  let phase = state.phase;
  let nextBracket = bracket;
  let archive = state.archive;

  if (winners.length === 1) {
    champion = winners[0];
    const champ = byId.get(champion)!;
    champ.titles++;
    for (const id of champ.starIds) {
      const p = players[id];
      if (p) p.career.championships++;
    }
    history = [...history, {
      season: state.season, kind: 'champion',
      text: `${teamLabel(champ)} win the ${state.season} Championship!`,
    }];
    phase = 'offseason';
    archive = [...archive]; // mvp/archive entry added in offseason
  } else {
    const next: PlayoffSeries[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      const a = byId.get(winners[i])!;
      const b = byId.get(winners[i + 1])!;
      const high = a.wins >= b.wins ? a : b;
      const low = high === a ? b : a;
      next.push({
        round: round + 1, highSeedId: high.id, lowSeedId: low.id,
        highWins: 0, lowWins: 0, winnerId: null, games: [],
      });
    }
    nextBracket = [...bracket, ...next];
  }

  return {
    ...state, teams, players, playoffBracket: nextBracket,
    champion, history, phase, archive,
  };
}
