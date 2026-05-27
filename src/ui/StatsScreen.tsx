import { useState, useMemo } from 'react';
import type { LeagueState, Player } from '../engine/types';

type Mode = 'season' | 'historical';

export function StatsScreen({ state, onPlayer }: { state: LeagueState; onPlayer: (p: Player) => void }) {
  const [mode, setMode] = useState<Mode>('season');

  return (
    <div>
      <div className="subtabs">
        <button className={`subtab ${mode === 'season' ? 'active' : ''}`} onClick={() => setMode('season')}>
          This Season
        </button>
        <button className={`subtab ${mode === 'historical' ? 'active' : ''}`} onClick={() => setMode('historical')}>
          All-Time
        </button>
      </div>
      {mode === 'season' ? <SeasonStats state={state} onPlayer={onPlayer} />
                         : <HistoricalStats state={state} onPlayer={onPlayer} />}
    </div>
  );
}

// ─── season per-game leaders ───
function SeasonStats({ state, onPlayer }: { state: LeagueState; onPlayer: (p: Player) => void }) {
  const lines = Object.values(state.seasonStats).filter((l) => l.games > 0);
  if (lines.length === 0) {
    return <div className="panel"><div className="empty">No games played yet this season.</div></div>;
  }
  const nameOf = (id: string) => state.players[id]?.name ?? '—';
  const boards: [string, 'points' | 'rebounds' | 'assists' | 'blocks' | 'steals' | 'threes', string][] = [
    ['Points', 'points', 'PPG'],
    ['Rebounds', 'rebounds', 'RPG'],
    ['Assists', 'assists', 'APG'],
    ['Blocks', 'blocks', 'BPG'],
    ['Steals', 'steals', 'SPG'],
    ['Three-Pointers', 'threes', '3PG'],
  ];
  return (
    <div className="grid-2">
      {boards.map(([title, key, abbr]) => {
        const ranked = [...lines].sort((a, b) => b[key] / b.games - a[key] / a.games).slice(0, 10);
        return (
          <div key={key} className="panel">
            <div className="panel-head"><h3>{title}</h3></div>
            <div className="panel-body table-wrap">
              <table>
                <thead><tr><th>Player</th><th>{abbr}</th><th>Tot</th></tr></thead>
                <tbody>
                  {ranked.map((l, i) => {
                    const p = state.players[l.playerId];
                    return (
                      <tr key={l.playerId} onClick={() => p && onPlayer(p)} style={{ cursor: 'pointer' }}>
                        <td><span className="rank">{i + 1}</span> {nameOf(l.playerId)}</td>
                        <td className="num accent-val">{(l[key] / l.games).toFixed(1)}</td>
                        <td className="num muted">{l[key]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── all-time records + career leaders ───
function HistoricalStats({ state, onPlayer }: { state: LeagueState; onPlayer: (p: Player) => void }) {
  const r = state.records;
  const careerLeaders = useMemo(() => {
    const all = Object.values(state.players);
    return {
      points: [...all].sort((a, b) => b.career.points - a.career.points).slice(0, 10),
      assists: [...all].sort((a, b) => b.career.assists - a.career.assists).slice(0, 10),
      rebounds: [...all].sort((a, b) => b.career.rebounds - a.career.rebounds).slice(0, 10),
      titles: [...all].sort((a, b) => b.career.championships - a.career.championships).slice(0, 10),
    };
  }, [state.players]);

  return (
    <div>
      <div className="panel">
        <div className="panel-head"><h2>League <span className="accent">Records</span></h2></div>
        <div className="panel-body">
          <div className="record-grid">
            <RecordCard label="Most Points (Game)" value={r.mostPointsGame.value} who={r.mostPointsGame.label} season={r.mostPointsGame.season} />
            <RecordCard label="Most Assists (Game)" value={r.mostAssistsGame.value} who={r.mostAssistsGame.label} season={r.mostAssistsGame.season} />
            <RecordCard label="Most Rebounds (Game)" value={r.mostReboundsGame.value} who={r.mostReboundsGame.label} season={r.mostReboundsGame.season} />
            <RecordCard label="Most 3PM (Season)" value={r.mostThreesSeason.value} who={r.mostThreesSeason.label} season={r.mostThreesSeason.season} />
            {r.youngestTo1000Assists && (
              <RecordCard label="Youngest to 1,000 AST" value={`Age ${r.youngestTo1000Assists.value}`} who={r.youngestTo1000Assists.label} season={r.youngestTo1000Assists.season} />
            )}
            <RecordCard label="Most Career Points" value={r.mostCareerPoints.value} who={r.mostCareerPoints.label} season={r.mostCareerPoints.season} />
            {r.mostTitlesTeam.value > 0 && (
              <RecordCard label="Most Championships (Team)" value={r.mostTitlesTeam.value} who={r.mostTitlesTeam.label} season={0} />
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <CareerBoard title="Career Points" players={careerLeaders.points} stat={(p) => p.career.points} onPlayer={onPlayer} />
        <CareerBoard title="Career Assists" players={careerLeaders.assists} stat={(p) => p.career.assists} onPlayer={onPlayer} />
        <CareerBoard title="Career Rebounds" players={careerLeaders.rebounds} stat={(p) => p.career.rebounds} onPlayer={onPlayer} />
        <CareerBoard title="Championships" players={careerLeaders.titles} stat={(p) => p.career.championships} onPlayer={onPlayer} />
      </div>

      {state.awardsHistory.length > 0 && (
        <div className="panel">
          <div className="panel-head"><h3>Awards by Season</h3></div>
          <div className="panel-body table-wrap">
            <table className="awards-table">
              <thead>
                <tr>
                  <th>Season</th><th>Champion</th><th>MVP</th><th>Rookie</th>
                  <th>PG</th><th>SG</th><th>SF</th><th>PF</th><th>C</th>
                </tr>
              </thead>
              <tbody>
                {[...state.awardsHistory].reverse().map((a) => {
                  const five = (pos: string) =>
                    a.allStarFive.find((w) => w.detail === pos)?.playerName ?? '—';
                  return (
                    <tr key={a.season}>
                      <td className="accent-val">{a.season}</td>
                      <td>🏆 {a.championLabel}</td>
                      <td>{a.mvp ? a.mvp.playerName : '—'}</td>
                      <td>{a.rookieOfYear ? a.rookieOfYear.playerName : '—'}</td>
                      <td className="muted">{five('PG')}</td>
                      <td className="muted">{five('SG')}</td>
                      <td className="muted">{five('SF')}</td>
                      <td className="muted">{five('PF')}</td>
                      <td className="muted">{five('C')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="hint">Every season's Champion, MVP, Rookie of the Year, and All-Star Starting Five.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordCard({ label, value, who, season }: { label: string; value: string | number; who: string; season: number }) {
  return (
    <div className="record-card">
      <div className="record-label">{label}</div>
      <div className="record-value">{value}</div>
      <div className="record-who">{who}</div>
      {season > 0 && <div className="record-season">Season {season}</div>}
    </div>
  );
}

function CareerBoard({ title, players, stat, onPlayer }: {
  title: string; players: Player[]; stat: (p: Player) => number; onPlayer: (p: Player) => void;
}) {
  return (
    <div className="panel">
      <div className="panel-head"><h3>{title}</h3></div>
      <div className="panel-body table-wrap">
        <table>
          <thead><tr><th>Player</th><th>Total</th></tr></thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} onClick={() => onPlayer(p)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="rank">{i + 1}</span> {p.name}
                  {p.retired && <span className="muted"> (ret.)</span>}
                </td>
                <td className="num accent-val">{stat(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
