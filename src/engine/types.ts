// ═══ Basketball Dynasty Simulator — domain types (v2) ═══

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legend';
export const RARITY_ORDER: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legend'];
export const RARITY_VALUE: Record<Rarity, number> = {
  Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legend: 4,
};

export type MarketTier = 'Huge' | 'Large' | 'Regular';
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type Conference = 'East' | 'West';

export type Archetype =
  | 'Sharpshooter' | 'Floor General' | 'Slasher' | 'Two-Way Wing'
  | 'Rim Protector' | 'Stretch Big' | 'Post Anchor' | 'Glue Guy';

// ─── Player ───
export interface Stats {
  twoP: number;
  threeP: number;
  physical: number;
  passing: number;
  defense: number;
}

export interface SeasonRecord {
  season: number;
  teamId: string;
  teamLabel: string;
  games: number;
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  threes: number;
  tripleDoubles: number;
  champion: boolean;
  mvp: boolean;
}

export interface CareerTotals {
  games: number;
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  threes: number;
  tripleDoubles: number;
  championships: number;
  mvps: number;
  buzzerBeaters: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  archetype: Archetype;
  rarity: Rarity;
  overall: number;
  potential: number;
  stats: Stats;
  morale: number;
  clutch: number;
  durability: number;
  // career lifecycle
  careerLength: number;       // 9-14 seasons total
  seasonsPlayed: number;      // counts up; retires when >= careerLength
  retired: boolean;
  // contract
  contractYears: number;      // total length of current deal (1-5)
  contractLeft: number;       // seasons remaining; 0 = expiring/expired
  teamId: string | null;      // null = free agent
  // history
  seasonLog: SeasonRecord[];
  career: CareerTotals;
}

// ─── Coach & GM ───
export interface Coach {
  id: string;
  name: string;
  rarity: Rarity;
  offense: string;
  defense: string;
}
export interface GM {
  id: string;
  name: string;
  rarity: Rarity;
}

// ─── Team ───
export interface Team {
  id: string;
  city: string;
  name: string;
  abbr: string;
  conference: Conference;
  division: string;
  market: MarketTier;
  marketValue: number;     // 2 / 5 / 8
  randomValue: number;     // 8-12, rerolled each offseason
  maxPoints: number;       // marketValue + randomValue (the cap)
  starIds: string[];       // exactly 3
  supportCore: number;     // 49-72, no name/stats — just the average
  coach: Coach;
  gm: GM;
  wins: number;
  losses: number;
  titles: number;
  playoffAppearances: number;
  morale: number;
  lastPlayoffSeason: number | null;
  relocatedFrom?: string;
}

// ─── Games & playoffs ───
export interface GameResult {
  week: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  highlight: boolean;
  clutch: boolean;
  narrative: string;
}

export interface PlayoffSeries {
  round: number;
  highSeedId: string;
  lowSeedId: string;
  highWins: number;
  lowWins: number;
  winnerId: string | null;
  games: GameResult[];
}

// ─── Season stat aggregation ───
export interface SeasonStatLine {
  playerId: string;
  teamId: string;
  games: number;
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  threes: number;
  tripleDoubles: number;
}

// ─── Records & history ───
export interface RecordHolder {
  value: number;
  label: string;       // player or team name
  season: number;
}
export interface LeagueRecords {
  mostPointsGame: RecordHolder;
  mostAssistsGame: RecordHolder;
  mostReboundsGame: RecordHolder;
  mostThreesSeason: RecordHolder;
  youngestTo1000Assists: RecordHolder | null;
  mostTitlesTeam: RecordHolder;
  mostCareerPoints: RecordHolder;
}

export type HistoryKind =
  | 'champion' | 'mvp' | 'record' | 'draft' | 'relocation'
  | 'milestone' | 'retirement' | 'signing' | 'contract';

export interface HistoryEntry {
  season: number;
  kind: HistoryKind;
  text: string;
}

// ─── Champion archive (per completed season) ───
export interface SeasonArchive {
  season: number;
  championId: string;
  championLabel: string;
  runnerUpLabel: string;
  mvpName: string;
  mvpTeamLabel: string;
}

// ─── Offseason report (shown to the user) ───
export interface OffseasonReport {
  season: number;
  retirements: { name: string; rarity: Rarity; teamLabel: string; seasons: number }[];
  capChanges: { teamLabel: string; before: number; after: number; delta: number }[];
  supportChanges: { teamLabel: string; before: number; after: number }[];
  draftPicks: { pick: number; teamLabel: string; playerName: string; rarity: Rarity }[];
  signings: { playerName: string; rarity: Rarity; toTeamLabel: string; years: number }[];
  nonRenewals: { playerName: string; rarity: Rarity; fromTeamLabel: string; reason: string }[];
}

// ─── Full league state ───
export type Phase = 'regular' | 'playoffs' | 'offseason';

export interface LeagueState {
  season: number;
  week: number;
  phase: Phase;
  teams: Team[];
  players: Record<string, Player>;   // ALL players incl. free agents, keyed by id
  freeAgentIds: string[];
  results: GameResult[];
  seasonStats: Record<string, SeasonStatLine>;
  playoffBracket: PlayoffSeries[] | null;
  champion: string | null;
  records: LeagueRecords;
  history: HistoryEntry[];
  archive: SeasonArchive[];
  newsFeed: string[];
  lastOffseason: OffseasonReport | null;
}

// ─── Tuning constants ───
export const WEEKS_REGULAR = 14;
export const ROUND_NAMES = ['', 'First Round', 'Conf. Semifinals', 'Conf. Finals', 'Finals', 'Champion'];

// target population shape (~105 players)
export const POP_TARGET = 105;
export const RARITY_TARGETS: Record<Rarity, number> = {
  Legend: 4,
  Epic: 9,
  Rare: 17,
  Uncommon: 23,
  Common: 52,
};
