// ═══ Save-slot persistence (localStorage) — 3 slots, autosave ═══
import type { LeagueState } from '../engine/types';

const SLOT_COUNT = 3;
const KEY_PREFIX = 'bball-dynasty-slot-';
const SCHEMA_VERSION = 2;

export interface SlotMeta {
  slot: number;
  empty: boolean;
  season?: number;
  week?: number;
  phase?: string;
  championLabel?: string;
  savedAt?: string;
}

interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: LeagueState;
}

function keyFor(slot: number) {
  return `${KEY_PREFIX}${slot}`;
}

export function listSlots(): SlotMeta[] {
  const metas: SlotMeta[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const raw = safeGet(keyFor(i));
    if (!raw) {
      metas.push({ slot: i, empty: true });
      continue;
    }
    try {
      const env = JSON.parse(raw) as SaveEnvelope;
      const s = env.state;
      const champ = s.archive.length > 0
        ? s.archive[s.archive.length - 1].championLabel
        : undefined;
      metas.push({
        slot: i, empty: false,
        season: s.season, week: s.week, phase: s.phase,
        championLabel: champ, savedAt: env.savedAt,
      });
    } catch {
      metas.push({ slot: i, empty: true });
    }
  }
  return metas;
}

export function saveSlot(slot: number, state: LeagueState): boolean {
  const env: SaveEnvelope = {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  return safeSet(keyFor(slot), JSON.stringify(env));
}

export function loadSlot(slot: number): LeagueState | null {
  const raw = safeGet(keyFor(slot));
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as SaveEnvelope;
    if (env.version !== SCHEMA_VERSION) return null;
    return env.state;
  } catch {
    return null;
  }
}

export function deleteSlot(slot: number): void {
  try {
    localStorage.removeItem(keyFor(slot));
  } catch {
    /* ignore */
  }
}

// ─── export / import to JSON file ───
export function exportState(state: LeagueState): string {
  return JSON.stringify({ version: SCHEMA_VERSION, savedAt: new Date().toISOString(), state }, null, 2);
}
export function importState(json: string): LeagueState | null {
  try {
    const env = JSON.parse(json) as SaveEnvelope;
    if (!env.state || !env.state.teams) return null;
    return env.state;
  } catch {
    return null;
  }
}

// ─── safe localStorage access (handles private mode / disabled storage) ───
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
