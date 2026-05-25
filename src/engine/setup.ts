// ═══ Initial league construction: 32 teams + ~105-player population ═══
import type { Team, Player, LeagueState, LeagueRecords } from './types';
import { RARITY_TARGETS, RARITY_ORDER } from './types';
import { TEAM_SEEDS, MARKET_BASE } from '../data/teamSeeds';
import { genPlayerOfRarity, genCoach, genGM } from '../data/generators';
import { genId, randInt, shuffle } from './rng';
import { offerLength } from './contracts';

function emptyRecords(): LeagueRecords {
  return {
    mostPointsGame: { value: 0, label: '—', season: 0 },
    mostAssistsGame: { value: 0, label: '—', season: 0 },
    mostReboundsGame: { value: 0, label: '—', season: 0 },
    mostThreesSeason: { value: 0, label: '—', season: 0 },
    youngestTo1000Assists: null,
    mostTitlesTeam: { value: 0, label: '—', season: 0 },
    mostCareerPoints: { value: 0, label: '—', season: 0 },
  };
}

/**
 * Build a balanced population. We need 96 rostered stars + ~9 free agents.
 * The rarity TARGETS describe the whole ~105-player pool.
 */
function buildPopulation(): Player[] {
  const players: Player[] = [];
  for (const rarity of RARITY_ORDER) {
    const count = RARITY_TARGETS[rarity];
    for (let i = 0; i < count; i++) {
      players.push(genPlayerOfRarity(rarity));
    }
  }
  return players;
}

const START_SEASON = 2026;

export function createLeague(): LeagueState {
  // 1. build the player pool
  const pool = shuffle(buildPopulation());
  const players: Record<string, Player> = {};
  for (const p of pool) players[p.id] = p;

  // 2. build teams and assign 3 stars each
  // sort pool so each team gets a sensible spread (one strong franchise star)
  const byOverall = [...pool].sort((a, b) => b.overall - a.overall);
  const teams: Team[] = [];

  TEAM_SEEDS.forEach((seed) => {
    const marketValue = MARKET_BASE[seed.market];
    const randomValue = randInt(8, 12);
    const team: Team = {
      id: genId('t'),
      city: seed.city,
      name: seed.name,
      abbr: seed.abbr,
      conference: seed.conference,
      division: seed.division,
      market: seed.market,
      marketValue,
      randomValue,
      maxPoints: marketValue + randomValue,
      starIds: [],
      supportCore: randInt(50, 70),
      coach: genCoach(),
      gm: genGM(),
      wins: 0,
      losses: 0,
      titles: 0,
      playoffAppearances: 0,
      morale: randInt(55, 80),
      lastPlayoffSeason: null,
    };
    teams.push(team);
  });

  // distribute stars: snake draft over byOverall so talent spreads evenly
  let order = teams.map((_, i) => i);
  let pickIdx = 0;
  for (let round = 0; round < 3; round++) {
    const roundOrder = round % 2 === 0 ? order : [...order].reverse();
    for (const ti of roundOrder) {
      const p = byOverall[pickIdx++];
      if (!p) continue;
      p.teamId = teams[ti].id;
      p.contractYears = offerLength(p);
      p.contractLeft = randInt(1, p.contractYears); // staggered so contracts don't all expire together
      teams[ti].starIds.push(p.id);
    }
  }

  // 3. leftover players become free agents
  const freeAgentIds = pool
    .filter((p) => p.teamId === null)
    .map((p) => p.id);

  return {
    season: START_SEASON,
    week: 1,
    phase: 'regular',
    teams,
    players,
    freeAgentIds,
    results: [],
    seasonStats: {},
    playoffBracket: null,
    champion: null,
    records: emptyRecords(),
    history: [
      { season: START_SEASON, kind: 'milestone', text: 'A new basketball era tips off. 32 franchises chase the first dynasty.' },
    ],
    archive: [],
    newsFeed: [],
    lastOffseason: null,
  };
}
