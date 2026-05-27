// ═══ Static franchise database — 30 real NBA teams + 2 expansion ═══
import type { MarketTier, Conference } from '../engine/types';

export interface TeamSeed {
  city: string;
  name: string;
  abbr: string;
  conference: Conference;
  division: string;
  market: MarketTier;
  primary: string;    // team primary color (hex)
  secondary: string;  // team secondary color (hex)
}

export const MARKET_BASE: Record<MarketTier, number> = {
  Huge: 3, Large: 2, Regular: 1,
};

// 30 real NBA franchises + 2 expansion teams (Montreal, Seattle) = 32.
// Colors are each franchise's real primary/secondary; expansion teams use
// fitting invented palettes.
export const TEAM_SEEDS: TeamSeed[] = [
  // ─── EASTERN CONFERENCE ───
  // Atlantic
  { city: 'Boston', name: 'Celtics', abbr: 'BOS', conference: 'East', division: 'Atlantic', market: 'Large', primary: '#007a33', secondary: '#bb9753' },
  { city: 'Brooklyn', name: 'Nets', abbr: 'BKN', conference: 'East', division: 'Atlantic', market: 'Huge', primary: '#cfcfcf', secondary: '#000000' },
  { city: 'New York', name: 'Knicks', abbr: 'NYK', conference: 'East', division: 'Atlantic', market: 'Huge', primary: '#f58426', secondary: '#006bb6' },
  { city: 'Philadelphia', name: '76ers', abbr: 'PHI', conference: 'East', division: 'Atlantic', market: 'Large', primary: '#006bb6', secondary: '#ed174c' },
  { city: 'Toronto', name: 'Raptors', abbr: 'TOR', conference: 'East', division: 'Atlantic', market: 'Large', primary: '#ce1141', secondary: '#a1a1a4' },
  // Central
  { city: 'Chicago', name: 'Bulls', abbr: 'CHI', conference: 'East', division: 'Central', market: 'Large', primary: '#ce1141', secondary: '#000000' },
  { city: 'Cleveland', name: 'Cavaliers', abbr: 'CLE', conference: 'East', division: 'Central', market: 'Regular', primary: '#860038', secondary: '#fdbb30' },
  { city: 'Detroit', name: 'Pistons', abbr: 'DET', conference: 'East', division: 'Central', market: 'Regular', primary: '#c8102e', secondary: '#1d428a' },
  { city: 'Indiana', name: 'Pacers', abbr: 'IND', conference: 'East', division: 'Central', market: 'Regular', primary: '#fdbb30', secondary: '#002d62' },
  { city: 'Milwaukee', name: 'Bucks', abbr: 'MIL', conference: 'East', division: 'Central', market: 'Regular', primary: '#00471b', secondary: '#eee1c6' },
  // Southeast
  { city: 'Atlanta', name: 'Hawks', abbr: 'ATL', conference: 'East', division: 'Southeast', market: 'Regular', primary: '#e03a3e', secondary: '#c1d32f' },
  { city: 'Charlotte', name: 'Hornets', abbr: 'CHA', conference: 'East', division: 'Southeast', market: 'Regular', primary: '#1d1160', secondary: '#00788c' },
  { city: 'Miami', name: 'Heat', abbr: 'MIA', conference: 'East', division: 'Southeast', market: 'Large', primary: '#98002e', secondary: '#f9a01b' },
  { city: 'Orlando', name: 'Magic', abbr: 'ORL', conference: 'East', division: 'Southeast', market: 'Regular', primary: '#0077c0', secondary: '#c4ced4' },
  { city: 'Washington', name: 'Wizards', abbr: 'WAS', conference: 'East', division: 'Southeast', market: 'Regular', primary: '#002b5c', secondary: '#e31837' },
  // Expansion (East)
  { city: 'Montreal', name: 'Voyageurs', abbr: 'MTL', conference: 'East', division: 'Atlantic', market: 'Large', primary: '#0a2756', secondary: '#c8102e' },

  // ─── WESTERN CONFERENCE ───
  // Northwest
  { city: 'Denver', name: 'Nuggets', abbr: 'DEN', conference: 'West', division: 'Northwest', market: 'Regular', primary: '#0e2240', secondary: '#fec524' },
  { city: 'Minnesota', name: 'Timberwolves', abbr: 'MIN', conference: 'West', division: 'Northwest', market: 'Regular', primary: '#0c2340', secondary: '#78be20' },
  { city: 'Oklahoma City', name: 'Thunder', abbr: 'OKC', conference: 'West', division: 'Northwest', market: 'Regular', primary: '#007ac1', secondary: '#ef3b24' },
  { city: 'Portland', name: 'Trail Blazers', abbr: 'POR', conference: 'West', division: 'Northwest', market: 'Regular', primary: '#e03a3e', secondary: '#cfcfcf' },
  { city: 'Utah', name: 'Jazz', abbr: 'UTA', conference: 'West', division: 'Northwest', market: 'Regular', primary: '#002b5c', secondary: '#f9a01b' },
  // Pacific
  { city: 'Golden State', name: 'Warriors', abbr: 'GSW', conference: 'West', division: 'Pacific', market: 'Large', primary: '#1d428a', secondary: '#ffc72c' },
  { city: 'Los Angeles', name: 'Clippers', abbr: 'LAC', conference: 'West', division: 'Pacific', market: 'Huge', primary: '#c8102e', secondary: '#1d428a' },
  { city: 'Los Angeles', name: 'Lakers', abbr: 'LAL', conference: 'West', division: 'Pacific', market: 'Huge', primary: '#552583', secondary: '#fdb927' },
  { city: 'Phoenix', name: 'Suns', abbr: 'PHX', conference: 'West', division: 'Pacific', market: 'Large', primary: '#1d1160', secondary: '#e56020' },
  { city: 'Sacramento', name: 'Kings', abbr: 'SAC', conference: 'West', division: 'Pacific', market: 'Regular', primary: '#5a2d81', secondary: '#63727a' },
  // Southwest
  { city: 'Dallas', name: 'Mavericks', abbr: 'DAL', conference: 'West', division: 'Southwest', market: 'Large', primary: '#0053bc', secondary: '#00538c' },
  { city: 'Houston', name: 'Rockets', abbr: 'HOU', conference: 'West', division: 'Southwest', market: 'Large', primary: '#ce1141', secondary: '#c4ced4' },
  { city: 'Memphis', name: 'Grizzlies', abbr: 'MEM', conference: 'West', division: 'Southwest', market: 'Regular', primary: '#5d76a9', secondary: '#12173f' },
  { city: 'New Orleans', name: 'Pelicans', abbr: 'NOP', conference: 'West', division: 'Southwest', market: 'Regular', primary: '#0c2340', secondary: '#c8102e' },
  { city: 'San Antonio', name: 'Spurs', abbr: 'SAS', conference: 'West', division: 'Southwest', market: 'Regular', primary: '#c4ced4', secondary: '#000000' },
  // Expansion (West)
  { city: 'Seattle', name: 'SuperSonics', abbr: 'SEA', conference: 'West', division: 'Northwest', market: 'Large', primary: '#00653a', secondary: '#fdbb30' },
];

export const RELOCATION_CITIES: { city: string; name: string; abbr: string; market: MarketTier; primary: string; secondary: string }[] = [
  { city: 'Las Vegas', name: 'Aces', abbr: 'LV', market: 'Large', primary: '#b9975b', secondary: '#000000' },
  { city: 'Vancouver', name: 'Grizzlies', abbr: 'VAN', market: 'Regular', primary: '#1a3b2a', secondary: '#b34a2f' },
  { city: 'Kansas City', name: 'Kings', abbr: 'KC', market: 'Regular', primary: '#3b5ca8', secondary: '#c0c0c0' },
  { city: 'San Diego', name: 'Clippers', abbr: 'SD', market: 'Large', primary: '#d4a017', secondary: '#0a2756' },
  { city: 'St. Louis', name: 'Spirits', abbr: 'STL', market: 'Regular', primary: '#7a1f2b', secondary: '#d4c08a' },
  { city: 'Mexico City', name: 'Capitanes', abbr: 'MEX', market: 'Large', primary: '#0a5c36', secondary: '#c8102e' },
];
