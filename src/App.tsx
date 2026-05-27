import { useState, useCallback, useEffect } from 'react';
import type { LeagueState, Team, Player } from './engine/types';
import { WEEKS_REGULAR } from './engine/types';
import { createLeague } from './engine/setup';
import { simulateWeek, simulatePlayoffGame, advancePlayoffRound, currentRoundComplete } from './engine/season';
import { runOffseason } from './engine/offseason';
import { saveSlot, loadSlot, deleteSlot, exportState, importState } from './state/saves';
import { HomeScreen } from './ui/HomeScreen';
import { StandingsScreen } from './ui/StandingsScreen';
import { TeamsScreen } from './ui/TeamsScreen';
import { StarsScreen } from './ui/StarsScreen';
import { StatsScreen } from './ui/StatsScreen';
import { PlayoffsScreen } from './ui/PlayoffsScreen';
import { OffseasonScreen } from './ui/OffseasonScreen';
import { AwardsScreen } from './ui/AwardsScreen';
import { PlayerModal, TeamModal, StaffModal } from './ui/modals';

type Tab = 'standings' | 'teams' | 'stars' | 'stats' | 'playoffs' | 'awards' | 'offseason';
const TABS: [Tab, string][] = [
  ['standings', 'Standings'],
  ['teams', 'Teams'],
  ['stars', 'Stars'],
  ['stats', 'Stats'],
  ['playoffs', 'Playoffs'],
  ['awards', 'Awards'],
  ['offseason', 'Offseason'],
];

export default function App() {
  const [state, setState] = useState<LeagueState | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('standings');
  const [modalTeam, setModalTeam] = useState<Team | null>(null);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [modalStaff, setModalStaff] = useState<{ kind: 'coach' | 'gm'; team: Team } | null>(null);

  // autosave whenever state changes
  useEffect(() => {
    if (state && activeSlot !== null) saveSlot(activeSlot, state);
  }, [state, activeSlot]);

  const startNew = useCallback((slot: number) => {
    const fresh = createLeague();
    setActiveSlot(slot);
    setState(fresh);
    setTab('standings');
  }, []);

  const loadExisting = useCallback((slot: number) => {
    const loaded = loadSlot(slot);
    if (loaded) {
      setActiveSlot(slot);
      setState(loaded);
      setTab(loaded.phase === 'offseason' ? 'offseason' : 'standings');
    } else {
      alert('Could not load this slot — the save may be from an older version.');
    }
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      if (!s) return s;
      if (s.phase === 'regular') return simulateWeek(s);
      if (s.phase === 'playoffs') return advancePlayoffRound(s);
      return runOffseason(s);
    });
  }, []);

  // simulate a single playoff game within a series (driven by the Playoffs tab)
  const simGame = useCallback((seriesId: string) => {
    setState((s) => (s ? simulatePlayoffGame(s, seriesId) : s));
  }, []);

  // jump to playoffs/offseason tab automatically when phase shifts
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'playoffs' && tab === 'standings') setTab('playoffs');
    if (state.phase === 'offseason') setTab('awards');
  }, [state?.phase]);

  function doExport() {
    if (!state) return;
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dynasty-${state.season}-w${state.week}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = importState(String(reader.result));
      if (imported) { setState(imported); }
      else alert('Invalid save file.');
    };
    reader.readAsText(file);
  }

  // ─── home screen ───
  if (!state) {
    return <HomeScreen onNew={startNew} onLoad={loadExisting} onDelete={deleteSlot} />;
  }

  const playoffsRoundDone = state.phase === 'playoffs' && currentRoundComplete(state);
  const advanceLabel = state.phase === 'regular'
    ? `Sim Week ${Math.min(state.week, WEEKS_REGULAR)}`
    : state.phase === 'playoffs'
      ? (playoffsRoundDone ? 'Advance Playoff Round →' : 'Finish Series in Playoffs Tab')
      : 'Run Offseason → Next Season';
  const advanceDisabled = state.phase === 'playoffs' && !playoffsRoundDone;

  return (
    <div className="app">
      <div className="scoreboard">
        <div className="scoreboard-top">
          <div className="logo" onClick={() => { setState(null); setActiveSlot(null); }}>
            <span className="mark">DYNASTY</span>
            <span className="sub">Slot {activeSlot !== null ? activeSlot + 1 : '—'}</span>
          </div>
          <div className="season-clock">
            <div className="clock-cell">
              <div className="lbl">Season</div>
              <div className="val">{state.season}</div>
            </div>
            <div className="clock-cell">
              <div className="lbl">Week</div>
              <div className="val">{Math.min(state.week, WEEKS_REGULAR)}</div>
            </div>
            <div className={`phase-pill phase-${state.phase}`}>{state.phase}</div>
          </div>
        </div>
        <div className="tabs">
          {TABS.map(([t, label]) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="advance-bar">
        <button
          className="btn-advance"
          onClick={advance}
          disabled={advanceDisabled}
        >
          {advanceLabel}
        </button>
        <button className="btn-ghost" onClick={doExport}>Export Save</button>
        <label className="btn-ghost import-label">
          Import Save
          <input type="file" accept="application/json" onChange={doImport} hidden />
        </label>
        <button className="btn-ghost" onClick={() => { setState(null); setActiveSlot(null); }}>
          Home
        </button>
      </div>

      {state.newsFeed.length > 0 && (
        <div className="ticker">
          {state.newsFeed.map((n, i) => <div key={i} className="ticker-item">{n}</div>)}
        </div>
      )}

      {tab === 'standings' && <StandingsScreen state={state} onTeam={setModalTeam} />}
      {tab === 'teams' && <TeamsScreen state={state} onTeam={setModalTeam} />}
      {tab === 'stars' && <StarsScreen state={state} onPlayer={setModalPlayer} />}
      {tab === 'stats' && <StatsScreen state={state} onPlayer={setModalPlayer} />}
      {tab === 'playoffs' && <PlayoffsScreen state={state} onTeam={setModalTeam} onSimGame={simGame} />}
      {tab === 'awards' && <AwardsScreen state={state} onPlayer={setModalPlayer} />}
      {tab === 'offseason' && <OffseasonScreen state={state} />}

      {modalTeam && (
        <TeamModal
          team={state.teams.find((t) => t.id === modalTeam.id) ?? modalTeam}
          state={state}
          onClose={() => setModalTeam(null)}
          onPlayer={(p) => { setModalTeam(null); setModalPlayer(p); }}
          onStaff={(kind, team) => { setModalTeam(null); setModalStaff({ kind, team }); }}
        />
      )}
      {modalPlayer && (
        <PlayerModal
          player={state.players[modalPlayer.id] ?? modalPlayer}
          state={state}
          onClose={() => setModalPlayer(null)}
        />
      )}
      {modalStaff && (
        <StaffModal
          kind={modalStaff.kind}
          team={state.teams.find((t) => t.id === modalStaff.team.id) ?? modalStaff.team}
          onClose={() => setModalStaff(null)}
        />
      )}
    </div>
  );
}
