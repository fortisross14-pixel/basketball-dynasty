import { useState, useMemo } from 'react';
import type { LeagueState, Team } from '../engine/types';
import { teamScoreWith, teamLabel } from '../engine/league';
import { MarketTag } from './components';

type ConfFilter = 'All' | 'East' | 'West';
type SortKey = 'rating' | 'record' | 'titles';

export function TeamsScreen({ state, onTeam }: { state: LeagueState; onTeam: (t: Team) => void }) {
  const [conf, setConf] = useState<ConfFilter>('All');
  const [sort, setSort] = useState<SortKey>('rating');

  const teams = useMemo(() => {
    let list = state.teams.filter((t) => conf === 'All' || t.conference === conf);
    list = [...list].sort((a, b) => {
      if (sort === 'rating') return teamScoreWith(b, state.players) - teamScoreWith(a, state.players);
      if (sort === 'record') return (b.wins - b.losses) - (a.wins - a.losses);
      return b.titles - a.titles;
    });
    return list;
  }, [state, conf, sort]);

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Conference</span>
          {(['All', 'East', 'West'] as ConfFilter[]).map((c) => (
            <button key={c} className={`filter-btn ${conf === c ? 'active' : ''}`} onClick={() => setConf(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Sort by</span>
          {([['rating', 'Avg Rating'], ['record', 'This Year'], ['titles', 'History']] as [SortKey, string][]).map(([k, lbl]) => (
            <button key={k} className={`filter-btn ${sort === k ? 'active' : ''}`} onClick={() => setSort(k)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="card-grid">
        {teams.map((t) => {
          const score = teamScoreWith(t, state.players);
          // quality on a league-wide scale (effective ratings run ~6-15)
          const RATING_MAX = 15;
          const pct = Math.min(100, (score / RATING_MAX) * 100);
          const tier = score >= 13 ? 'Contender'
            : score >= 11 ? 'Strong'
            : score >= 9 ? 'Solid'
            : score >= 7 ? 'Middling'
            : 'Rebuilding';
          const tierColor = score >= 13 ? '#3fcf8e'
            : score >= 11 ? '#7ec98f'
            : score >= 9 ? '#e8b04a'
            : score >= 7 ? '#e8843a'
            : '#e23b3b';
          return (
            <div
              key={t.id}
              className="team-card"
              onClick={() => onTeam(t)}
              style={{
                ['--team-primary' as string]: t.primary,
                ['--team-secondary' as string]: t.secondary,
              }}
            >
              <div className="tc-top">
                <span className="tc-abbr">{t.abbr}</span>
                <MarketTag market={t.market} />
              </div>
              <div className="tc-name">{teamLabel(t)}</div>
              <div className="tc-meta">{t.conference} · {t.division}</div>
              <div className="tc-stats">
                <div className="tc-stat">
                  <span className="tc-stat-val">{t.wins}-{t.losses}</span>
                  <span className="tc-stat-lbl">Record</span>
                </div>
                <div className="tc-stat">
                  <span className="tc-stat-val accent-val">{score}</span>
                  <span className="tc-stat-lbl">Rating</span>
                </div>
                <div className="tc-stat">
                  <span className="tc-stat-val">{t.titles}</span>
                  <span className="tc-stat-lbl">Titles</span>
                </div>
              </div>
              <div className="rating-bar">
                <div className="rating-fill"
                  style={{ width: `${pct}%`, background: tierColor }} />
              </div>
              <div className="tc-tier" style={{ color: tierColor }}>{tier}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
