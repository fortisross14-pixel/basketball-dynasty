import { useState } from 'react';
import type { LeagueState, Team } from '../engine/types';
import { teamScoreWith } from '../engine/league';

type View = 'conference' | 'division';

export function StandingsScreen({ state, onTeam }: { state: LeagueState; onTeam: (t: Team) => void }) {
  const [view, setView] = useState<View>('conference');

  function row(t: Team, rank: number, cutoff?: number) {
    const gp = t.wins + t.losses;
    const pct = gp ? (t.wins / gp).toFixed(3).replace(/^0/, '') : '.000';
    return (
      <tr key={t.id} className={cutoff !== undefined && rank === cutoff ? 'playoff-line' : ''}
          onClick={() => onTeam(t)} style={{ cursor: 'pointer' }}>
        <td><span className="rank">{rank}</span> {t.abbr} <span className="muted">{t.name}</span></td>
        <td className="num">{t.wins}</td>
        <td className="num">{t.losses}</td>
        <td className="num">{pct}</td>
        <td className="num accent-val">{teamScoreWith(t, state.players)}</td>
      </tr>
    );
  }

  return (
    <div>
      <div className="subtabs">
        <button className={`subtab ${view === 'conference' ? 'active' : ''}`} onClick={() => setView('conference')}>
          By Conference
        </button>
        <button className={`subtab ${view === 'division' ? 'active' : ''}`} onClick={() => setView('division')}>
          By Division
        </button>
      </div>

      {view === 'conference' && (
        <div className="grid-2">
          {(['East', 'West'] as const).map((conf) => {
            const teams = state.teams
              .filter((t) => t.conference === conf)
              .sort((a, b) => b.wins - a.wins || teamScoreWith(b, state.players) - teamScoreWith(a, state.players));
            return (
              <div key={conf} className="panel">
                <div className="panel-head"><h3>{conf} Conference</h3></div>
                <div className="panel-body table-wrap">
                  <table>
                    <thead><tr><th>Team</th><th>W</th><th>L</th><th>PCT</th><th>RTG</th></tr></thead>
                    <tbody>{teams.map((t, i) => row(t, i + 1, 8))}</tbody>
                  </table>
                  <div className="hint">Dashed line marks the playoff cutoff (top 8).</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'division' && (
        <div className="grid-2">
          {[...new Set(state.teams.map((t) => t.division))].map((div) => {
            const teams = state.teams
              .filter((t) => t.division === div)
              .sort((a, b) => b.wins - a.wins);
            const conf = teams[0]?.conference;
            return (
              <div key={div} className="panel">
                <div className="panel-head">
                  <h3>{div}</h3>
                  <span className="muted-cond">{conf}</span>
                </div>
                <div className="panel-body table-wrap">
                  <table>
                    <thead><tr><th>Team</th><th>W</th><th>L</th><th>PCT</th><th>RTG</th></tr></thead>
                    <tbody>{teams.map((t, i) => row(t, i + 1))}</tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
