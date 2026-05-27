// ═══ Procedural generation of players, coaches, GMs ═══
import type { Player, Coach, GM, Rarity, Position, Archetype, Stats } from '../engine/types';
import { genId, randInt, pick, rng, gaussian, clamp } from '../engine/rng';

const FIRST = [
  'Marcus', 'Theo', 'Darius', 'Leon', 'Andre', 'Trey', 'Malik', 'Jaylen', 'Caleb', 'Devin',
  'Isaiah', 'Quentin', 'Roman', 'Xavier', 'Damon', 'Cyrus', 'Elias', 'Brock', 'Tyrell', 'Amari',
  'Donovan', 'Kai', 'Zion', 'Reggie', 'Ezra', 'Marquis', 'Cole', 'Jaxon', 'Silas', 'Omar',
  'Dante', 'Lucas', 'Travis', 'Nico', 'Rashad', 'Bryce', 'Emmett', 'Khalil', 'Tobias', 'Vince',
  'Jamal', 'Otis', 'Grant', 'Pierce', 'Hassan', 'Dominic', 'Ledger', 'Cassius', 'Roy', 'Zane',
  'Axel', 'Beau', 'Curtis', 'Dexter', 'Felix', 'Gideon', 'Hugo', 'Ira', 'Joel', 'Knox',
];
const LAST = [
  'Hale', 'King', 'Cross', 'Vaughn', 'Brooks', 'Mercer', 'Stone', 'Knox', 'Reyes', 'Tate',
  'Sloan', 'Archer', 'Boone', 'Fontaine', 'Hayes', 'Mott', 'Pace', 'Quill', 'Rhodes', 'Slade',
  'Voss', 'Welch', 'Yates', 'Ash', 'Bram', 'Calloway', 'Doyle', 'Ellison', 'Frost', 'Gentry',
  'Holt', 'Ives', 'Jennings', 'Kemp', 'Locke', 'Maddox', 'North', 'Oakes', 'Pruitt', 'Ramsey',
  'Sterling', 'Thorne', 'Underwood', 'Vance', 'Whitfield', 'Banner', 'Cobb', 'Dunmore', 'Easton', 'Falk',
  'Granger', 'Hollis', 'Iverson', 'Joyner', 'Keane', 'Lowry', 'Macklin', 'Nash', 'Orton', 'Pike',
];

export function genName(): string {
  return `${pick(FIRST)} ${pick(LAST)}`;
}

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const ARCHETYPES: Archetype[] = [
  'Sharpshooter', 'Floor General', 'Slasher', 'Two-Way Wing',
  'Rim Protector', 'Stretch Big', 'Post Anchor', 'Glue Guy',
];
const OFFENSES = ['Fast Break', 'Perimeter Heavy', 'Motion Offense', 'Isolation', 'Post-Centric', 'Balanced'];
const DEFENSES = ['Paint Protection', 'Perimeter Pressure', 'Switching', 'Aggressive Trapping', 'Conservative', 'Balanced'];

// Star overall ranges by rarity (per design spec).
const RARITY_OVERALL: Record<Rarity, [number, number]> = {
  Common: [65, 72],
  Uncommon: [72, 78],
  Rare: [79, 84],
  Epic: [85, 90],
  Legend: [90, 99],
};

function statsFor(archetype: Archetype, overall: number): Stats {
  const base = () => Math.round(clamp(gaussian(overall - 4, 8), 38, 99));
  const hi = () => Math.round(clamp(gaussian(overall + 6, 5), overall - 2, 99));
  const s: Stats = {
    twoP: base(), threeP: base(), physical: base(), passing: base(), defense: base(),
  };
  switch (archetype) {
    case 'Sharpshooter': s.threeP = hi(); break;
    case 'Floor General': s.passing = hi(); break;
    case 'Slasher': s.twoP = hi(); s.physical = hi(); break;
    case 'Two-Way Wing': s.defense = hi(); s.threeP = hi(); break;
    case 'Rim Protector': s.defense = hi(); s.physical = hi(); break;
    case 'Stretch Big': s.threeP = hi(); s.physical = hi(); break;
    case 'Post Anchor': s.twoP = hi(); s.physical = hi(); break;
    case 'Glue Guy': s.defense = hi(); s.passing = hi(); break;
  }
  return s;
}

function emptyCareer() {
  return {
    games: 0, points: 0, rebounds: 0, assists: 0, blocks: 0, steals: 0,
    threes: 0, tripleDoubles: 0, championships: 0, mvps: 0, buzzerBeaters: 0,
    allStarSelections: 0, rookieOfYear: false,
  };
}

/**
 * Generate a player of a SPECIFIC rarity (so the population balancer can
 * hit its rarity targets precisely).
 */
export function genPlayerOfRarity(rarity: Rarity, opts: { age?: number; rookie?: boolean } = {}): Player {
  const [lo, hi] = RARITY_OVERALL[rarity];
  const overall = randInt(lo, hi);
  const age = opts.age ?? (opts.rookie ? randInt(18, 22) : randInt(20, 29));
  const archetype = pick(ARCHETYPES);
  const stats = statsFor(archetype, overall);
  const growthRoom = age <= 22 ? randInt(5, 14) : age <= 26 ? randInt(1, 7) : 0;
  const potential = Math.min(99, overall + growthRoom);
  // 9-14 season careers
  const careerLength = randInt(9, 14);
  // a rookie starts at 0 seasons; an existing player has some behind them
  const seasonsPlayed = opts.rookie ? 0 : randInt(0, Math.min(careerLength - 2, Math.max(0, age - 20)));
  return {
    id: genId('p'),
    name: genName(),
    age,
    position: pick(POSITIONS),
    archetype,
    rarity,
    overall,
    potential,
    stats,
    morale: randInt(55, 85),
    clutch: randInt(40, 99),
    durability: randInt(45, 95),
    careerLength,
    seasonsPlayed,
    retired: false,
    contractYears: 0,
    contractLeft: 0,
    teamId: null,
    seasonLog: [],
    career: emptyCareer(),
  };
}

export function genCoach(): Coach {
  const r = rng();
  let rarity: Rarity = 'Common';
  if (r < 0.05) rarity = 'Legend';
  else if (r < 0.2) rarity = 'Epic';
  else if (r < 0.5) rarity = 'Rare';
  else if (r < 0.8) rarity = 'Uncommon';
  return { id: genId('c'), name: genName(), rarity, offense: pick(OFFENSES), defense: pick(DEFENSES) };
}

export function genGM(): GM {
  const r = rng();
  let rarity: Rarity = 'Common';
  if (r < 0.04) rarity = 'Legend';
  else if (r < 0.18) rarity = 'Epic';
  else if (r < 0.48) rarity = 'Rare';
  else if (r < 0.8) rarity = 'Uncommon';
  return { id: genId('g'), name: genName(), rarity };
}
