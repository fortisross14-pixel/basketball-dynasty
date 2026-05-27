import { useState, useMemo } from 'react';
import type { LeagueState, Player } from '../engine/types';

import { RarityChip, ContractBadge } from './components';
import { Flag } from './Flag';

type SortKey = 'overall' | 'twoP' | 'threeP' | 'physical' | 'passing' | 'defense' | 'age' | 'career';

export function StarsScreen({ state, onPlayer }: { state: LeagueState; onPlayer: (p: Player) => void }) {
  const [sort, setSort] = useState<SortKey>('overall');
  const [conf, setConf] = useState<'All' | 'East' | 'West'>('All');

  const teamOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of state.teams) {
      for (const id of t.starIds) m.set(id, t.id);
    }
    return m;
  }, [state.teams]);

  const stars = useMemo(() => {
    const teamConf = new Map(state.teams.map((t) => [t.id, t.conference]));
    let list = Object.values(state.players).filter((p) => !p.retired && p.teamId !== null);
    if (conf !== 'All') {
      list = list.filter((p) => teamConf.get(p.teamId!) === conf);
    }
    list.sort((a, b) => {
      if (sort === 'overall') return b.overall - a.overall;
      if (sort === 'age') return a.age - b.age;
      if (sort === 'career') return b.seasonsPlayed - a.seasonsPlayed;
      return b.stats[sort] - a.stats[sort];
    });
    return list;
  }, [state, sort, conf]);

  const labelOf = (id: string) => {
    const tid = teamOf.get(id);
    const t = state.teams.find((x) => x.id === tid);
    return t ? t.abbr : '—';
  };

  const cols: [SortKey, string][] = [
    ['overall', 'OVR'], ['twoP', '2PT'], ['threeP', '3PT'],
    ['physical', 'PHY'], ['passing', 'PAS'], ['defense', 'DEF'],
    ['age', 'AGE'], ['career', 'YR'],
  ];

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Conference</span>
          {(['All', 'East', 'West'] as const).map((c) => (
            <button key={c} className={`filter-btn ${conf === c ? 'active' : ''}`} onClick={() => setConf(c)}>
              {c}
            </button>
          ))}
        </div>
        <span className="hint">{stars.length} active stars · click a column to sort · click a row for detail</span>
      </div>

      <div className="panel">
        <div className="panel-body table-wrap">
          <table className="stars-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th>Rarity</th>
                {cols.map(([k, lbl]) => (
                  <th key={k} className={`sortable ${sort === k ? 'sorted' : ''}`} onClick={() => setSort(k)}>
                    {lbl}
                  </th>
                ))}
                <th>Contract</th>
              </tr>
            </thead>
            <tbody>
              {stars.map((p) => (
                <tr key={p.id} onClick={() => onPlayer(p)} style={{ cursor: 'pointer' }}>
                  <td className="star-name">
                    <Flag abbr={p.nationality.abbr} size={16} /> {p.name}
                  </td>
                  <td className="muted">{labelOf(p.id)}</td>
                  <td>{p.position}</td>
                  <td><RarityChip rarity={p.rarity} /></td>
                  <td className="num accent-val">{p.overall}</td>
                  <td className="num">{p.stats.twoP}</td>
                  <td className="num">{p.stats.threeP}</td>
                  <td className="num">{p.stats.physical}</td>
                  <td className="num">{p.stats.passing}</td>
                  <td className="num">{p.stats.defense}</td>
                  <td className="num">{p.age}</td>
                  <td className="num">{p.seasonsPlayed} of {p.careerLength}</td>
                  <td><ContractBadge p={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
