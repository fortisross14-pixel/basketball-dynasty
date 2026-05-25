// ═══ Static franchise database — 32 teams ═══
import type { MarketTier, Conference } from '../engine/types';

export interface TeamSeed {
  city: string;
  name: string;
  abbr: string;
  conference: Conference;
  division: string;
  market: MarketTier;
}

export const MARKET_BASE: Record<MarketTier, number> = {
  Huge: 8, Large: 5, Regular: 2,
};

export const TEAM_SEEDS: TeamSeed[] = [
  // ─── EAST ───
  { city: 'New York', name: 'Knights', abbr: 'NYK', conference: 'East', division: 'Atlantic', market: 'Huge' },
  { city: 'Brooklyn', name: 'Waves', abbr: 'BKN', conference: 'East', division: 'Atlantic', market: 'Huge' },
  { city: 'Boston', name: 'Shamrocks', abbr: 'BOS', conference: 'East', division: 'Atlantic', market: 'Large' },
  { city: 'Philadelphia', name: 'Liberty', abbr: 'PHI', conference: 'East', division: 'Atlantic', market: 'Large' },
  { city: 'Chicago', name: 'Gusts', abbr: 'CHI', conference: 'East', division: 'Central', market: 'Large' },
  { city: 'Detroit', name: 'Motors', abbr: 'DET', conference: 'East', division: 'Central', market: 'Regular' },
  { city: 'Cleveland', name: 'Tide', abbr: 'CLE', conference: 'East', division: 'Central', market: 'Regular' },
  { city: 'Milwaukee', name: 'Stags', abbr: 'MIL', conference: 'East', division: 'Central', market: 'Regular' },
  { city: 'Miami', name: 'Surge', abbr: 'MIA', conference: 'East', division: 'Southeast', market: 'Large' },
  { city: 'Atlanta', name: 'Falcons', abbr: 'ATL', conference: 'East', division: 'Southeast', market: 'Regular' },
  { city: 'Orlando', name: 'Comets', abbr: 'ORL', conference: 'East', division: 'Southeast', market: 'Regular' },
  { city: 'Washington', name: 'Sentinels', abbr: 'WAS', conference: 'East', division: 'Southeast', market: 'Regular' },
  { city: 'Toronto', name: 'Hawks', abbr: 'TOR', conference: 'East', division: 'Northeast', market: 'Large' },
  { city: 'Charlotte', name: 'Hornets', abbr: 'CHA', conference: 'East', division: 'Northeast', market: 'Regular' },
  { city: 'Indianapolis', name: 'Racers', abbr: 'IND', conference: 'East', division: 'Northeast', market: 'Regular' },
  { city: 'Pittsburgh', name: 'Forge', abbr: 'PIT', conference: 'East', division: 'Northeast', market: 'Regular' },
  // ─── WEST ───
  { city: 'Los Angeles', name: 'Stars', abbr: 'LAS', conference: 'West', division: 'Pacific', market: 'Huge' },
  { city: 'Los Angeles', name: 'Sharks', abbr: 'LAK', conference: 'West', division: 'Pacific', market: 'Huge' },
  { city: 'Golden State', name: 'Current', abbr: 'GSC', conference: 'West', division: 'Pacific', market: 'Large' },
  { city: 'Sacramento', name: 'Royals', abbr: 'SAC', conference: 'West', division: 'Pacific', market: 'Regular' },
  { city: 'Dallas', name: 'Rangers', abbr: 'DAL', conference: 'West', division: 'Southwest', market: 'Large' },
  { city: 'Houston', name: 'Pumas', abbr: 'HOU', conference: 'West', division: 'Southwest', market: 'Large' },
  { city: 'San Antonio', name: 'Spurs', abbr: 'SAS', conference: 'West', division: 'Southwest', market: 'Regular' },
  { city: 'Memphis', name: 'Blues', abbr: 'MEM', conference: 'West', division: 'Southwest', market: 'Regular' },
  { city: 'Denver', name: 'Peaks', abbr: 'DEN', conference: 'West', division: 'Northwest', market: 'Regular' },
  { city: 'Portland', name: 'Lumber', abbr: 'POR', conference: 'West', division: 'Northwest', market: 'Regular' },
  { city: 'Salt Lake City', name: 'Saints', abbr: 'SLC', conference: 'West', division: 'Northwest', market: 'Regular' },
  { city: 'Minnesota', name: 'Frost', abbr: 'MIN', conference: 'West', division: 'Northwest', market: 'Regular' },
  { city: 'Phoenix', name: 'Heat', abbr: 'PHX', conference: 'West', division: 'Southern', market: 'Large' },
  { city: 'New Orleans', name: 'Voodoo', abbr: 'NOL', conference: 'West', division: 'Southern', market: 'Regular' },
  { city: 'Oklahoma City', name: 'Drillers', abbr: 'OKC', conference: 'West', division: 'Southern', market: 'Regular' },
  { city: 'Seattle', name: 'Pioneers', abbr: 'SEA', conference: 'West', division: 'Southern', market: 'Large' },
];

export const RELOCATION_CITIES: { city: string; name: string; abbr: string; market: MarketTier }[] = [
  { city: 'Las Vegas', name: 'Aces', abbr: 'LV', market: 'Large' },
  { city: 'Vancouver', name: 'Grizzlies', abbr: 'VAN', market: 'Regular' },
  { city: 'Kansas City', name: 'Monarchs', abbr: 'KC', market: 'Regular' },
  { city: 'Mexico City', name: 'Aztecs', abbr: 'MEX', market: 'Large' },
  { city: 'St. Louis', name: 'Arch', abbr: 'STL', market: 'Regular' },
  { city: 'San Diego', name: 'Sails', abbr: 'SD', market: 'Large' },
];
