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
  allStarSelections: number;   // times named to the All-Star Starting 5
  rookieOfYear: boolean;       // won Rookie of the Year (once, in year 1)
  // which SEASON each honor was won (calendar year, e.g. 2027)
  titleYears: number[];
  mvpYears: number[];
  allStarYears: number[];
}

export interface Nationality {
  country: string;     // full name, e.g. 'Slovenia'
  abbr: string;        // 3-letter, e.g. 'SLO'
  flag: string;        // emoji flag
}

export interface Player {
  id: string;
  name: string;
  nationality: Nationality;
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
  seasonsWithTeam: number;    // consecutive seasons on the current team
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
// A staff member's record with one team across a span of seasons.
export interface StaffStint {
  teamLabel: string;
  fromSeason: number;
  toSeason: number | null;     // null = current/ongoing
  wins: number;
  losses: number;
  titles: number;
  bestResult: string;          // best playoff finish during the stint
}

export interface Coach {
  id: string;
  name: string;
  rarity: Rarity;
  offense: string;
  defense: string;
  history: StaffStint[];
}
export interface GM {
  id: string;
  name: string;
  rarity: Rarity;
  history: StaffStint[];
}

// ─── Team ───
export interface Team {
  id: string;
  city: string;
  name: string;
  abbr: string;
  primary: string;         // team primary color (hex)
  secondary: string;       // team secondary color (hex)
  conference: Conference;
  division: string;
  market: MarketTier;
  marketValue: number;     // 1 / 2 / 3 (Regular / Large / Huge)
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
  // one row per completed season for the team's history table
  seasonHistory: TeamSeasonRecord[];
}

export interface TeamSeasonRecord {
  season: number;
  wins: number;
  losses: number;
  playoffResult: string;       // 'Champion' | 'Conf. Finals' | 'First Round' | 'DNQ' etc.
  franchisePlayer: string;     // name of the franchise star that season
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
  // populated only for close playoff games in rounds 2+ (final 2 minutes)
  playByPlay?: PlayByPlayBeat[];
}

/**
 * One beat of the final-two-minutes play-by-play. The UI plays these in
 * sequence with ~1s pauses. A possession is usually two beats: a "setup"
 * beat (the shot description) and a "result" beat (made/missed + score).
 * Free throws emit one beat per shot.
 */
export interface PlayByPlayBeat {
  clock: string;          // "1:48" style game clock
  teamAbbr: string;       // team on this possession
  text: string;           // play description
  kind: 'setup' | 'make' | 'miss' | 'ft' | 'final';
  homeScore: number;      // score AFTER this beat resolves
  awayScore: number;
}

export interface PlayoffGame {
  result: GameResult | null;   // null until simulated
  played: boolean;
}

export interface PlayoffSeries {
  id: string;
  round: number;
  highSeedId: string;
  lowSeedId: string;
  highSeed: number;            // seed number 1-8
  lowSeed: number;
  highWins: number;
  lowWins: number;
  winnerId: string | null;
  games: PlayoffGame[];        // best-of-3: up to 3 slots
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
// ─── Awards (shown first thing in the offseason) ───
export interface AwardWinner {
  playerId: string;
  playerName: string;
  teamLabel: string;
  rarity: Rarity;
  detail: string;          // e.g. "28.4 PPG" or position
}
export interface AwardsReport {
  season: number;
  championLabel: string;
  championId: string;
  mvp: AwardWinner | null;
  rookieOfYear: AwardWinner | null;
  allStarFive: AwardWinner[];   // one per position PG/SG/SF/PF/C
}

// ─── A single trade or release done in the cap-reconciliation step ───
export interface TradeRecord {
  kind: 'trade' | 'release';
  teamALabel: string;
  teamBLabel: string;         // for 'release', the FA pool
  playerOut: string;          // player leaving team A
  playerOutRarity: Rarity;
  playerIn: string;           // player joining team A ('' for a pure release)
  playerInRarity: Rarity | null;
  reason: string;
}

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
  trades: TradeRecord[];
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
  freeCoaches: Coach[];        // fired coaches available for re-hire
  freeGMs: GM[];               // fired GMs available for re-hire
  results: GameResult[];
  seasonStats: Record<string, SeasonStatLine>;
  playoffBracket: PlayoffSeries[] | null;
  champion: string | null;
  records: LeagueRecords;
  history: HistoryEntry[];
  archive: SeasonArchive[];
  awardsHistory: AwardsReport[];
  newsFeed: string[];
  lastOffseason: OffseasonReport | null;
  lastAwards: AwardsReport | null;
}

// ─── Tuning constants ───
export const WEEKS_REGULAR = 14;
export const ROUND_NAMES = ['', 'First Round', 'Conf. Semifinals', 'Conf. Finals', 'Finals', 'Champion'];

// Games needed to WIN a series, by round (best-of: 3, 5, 5, 7).
// Index 1 = First Round ... index 4 = Finals.
export const WINS_NEEDED = [0, 2, 3, 3, 4];
export const SERIES_LENGTH = [0, 3, 5, 5, 7];

// target population shape (~105 players)
export const POP_TARGET = 105;
export const RARITY_TARGETS: Record<Rarity, number> = {
  Legend: 4,
  Epic: 9,
  Rare: 17,
  Uncommon: 23,
  Common: 52,
};
