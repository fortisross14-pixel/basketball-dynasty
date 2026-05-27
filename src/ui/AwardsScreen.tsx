import type { LeagueState, Player, AwardWinner } from '../engine/types';
import { RarityChip } from './components';

export function AwardsScreen({ state, onPlayer }: {
  state: LeagueState;
  onPlayer: (p: Player) => void;
}) {
  const a = state.lastAwards;
  if (!a) {
    return <div className="panel"><div className="empty">Awards are presented at the end of each season. Keep advancing.</div></div>;
  }

  const open = (w: AwardWinner | null) => {
    if (!w) return;
    const p = state.players[w.playerId];
    if (p) onPlayer(p);
  };

  return (
    <div>
      <div className="awards-hero">
        <div className="a-ttl">★ {a.season} CHAMPIONS ★</div>
        <div className="a-champ">{a.championLabel}</div>
      </div>

      <div className="award-grid">
        <div className="award-card" onClick={() => open(a.mvp)}>
          <div className="award-kind">Most Valuable Player</div>
          {a.mvp ? (
            <>
              <div className="award-name">{a.mvp.playerName}</div>
              <div className="award-meta">
                {a.mvp.teamLabel} · <RarityChip rarity={a.mvp.rarity} />
              </div>
              <div className="award-detail">{a.mvp.detail}</div>
            </>
          ) : <div className="award-meta">Not awarded</div>}
        </div>

        <div className="award-card" onClick={() => open(a.rookieOfYear)}>
          <div className="award-kind">Rookie of the Year</div>
          {a.rookieOfYear ? (
            <>
              <div className="award-name">{a.rookieOfYear.playerName}</div>
              <div className="award-meta">
                {a.rookieOfYear.teamLabel} · <RarityChip rarity={a.rookieOfYear.rarity} />
              </div>
              <div className="award-detail">{a.rookieOfYear.detail}</div>
            </>
          ) : <div className="award-meta">No first-year players qualified</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>All-Star Starting Five</h3></div>
        <div className="panel-body">
          {a.allStarFive.length > 0 ? (
            <div className="starting-five">
              {a.allStarFive.map((w) => (
                <div key={w.playerId} className="five-slot" onClick={() => open(w)}>
                  <div className="five-pos">{w.detail}</div>
                  <div className="five-name">{w.playerName}</div>
                  <div className="five-team">{w.teamLabel}</div>
                  <RarityChip rarity={w.rarity} />
                </div>
              ))}
            </div>
          ) : <div className="empty-sm">No All-Stars selected.</div>}
        </div>
      </div>
    </div>
  );
}
