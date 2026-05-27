import type { Player, Team, LeagueState } from '../engine/types';
import {
  teamScoreWith, teamRawScore, teamStars, teamLabel, rarityPoints, supportPoints,
} from '../engine/league';
import { RarityChip, MarketTag, StatLine, AttrBar, ContractBadge, Modal } from './components';

export function PlayerModal({ player, state, onClose }: { player: Player; state: LeagueState; onClose: () => void }) {
  const team = state.teams.find((t) => t.id === player.teamId);
  const c = player.career;
  const ppg = c.games ? (c.points / c.games).toFixed(1) : '0.0';
  const rpg = c.games ? (c.rebounds / c.games).toFixed(1) : '0.0';
  const apg = c.games ? (c.assists / c.games).toFixed(1) : '0.0';

  return (
    <Modal title={player.name} onClose={onClose}>
      <div className="modal-row">
        <RarityChip rarity={player.rarity} />
        <span className="muted-cond">{player.position} · {player.archetype}</span>
        <ContractBadge p={player} />
      </div>
      <div className="muted-cond" style={{ marginTop: 4 }}>
        {team ? teamLabel(team) : 'Free Agent'} · Age {player.age} · OVR {player.overall} · Potential {player.potential}
      </div>
      <div className="muted-cond">
        Career: season {player.seasonsPlayed} of {player.careerLength}
      </div>

      <div className="section-title">Attributes</div>
      <AttrBar label="2PT" value={player.stats.twoP} />
      <AttrBar label="3PT" value={player.stats.threeP} />
      <AttrBar label="Physical" value={player.stats.physical} />
      <AttrBar label="Passing" value={player.stats.passing} />
      <AttrBar label="Defense" value={player.stats.defense} />
      <AttrBar label="Clutch" value={player.clutch} />
      <AttrBar label="Durability" value={player.durability} />

      <div className="section-title">Career Totals</div>
      <div className="stat-grid">
        <StatLine k="Games" v={c.games} />
        <StatLine k="PPG" v={ppg} />
        <StatLine k="RPG" v={rpg} />
        <StatLine k="APG" v={apg} />
        <StatLine k="Triple-Dbls" v={c.tripleDoubles} />
        <StatLine k="Buzzer-Beaters" v={c.buzzerBeaters} />
        <StatLine k="Championships" v={c.championships} />
        <StatLine k="MVPs" v={c.mvps} />
      </div>

      {(c.mvps > 0 || c.allStarSelections > 0 || c.rookieOfYear || c.championships > 0) && (
        <>
          <div className="section-title">Honors</div>
          <div className="honor-row">
            {c.championships > 0 && (
              <span className="honor-badge champ">🏆 {c.championships}× Champion</span>
            )}
            {c.mvps > 0 && (
              <span className="honor-badge mvp">★ {c.mvps}× MVP</span>
            )}
            {c.rookieOfYear && (
              <span className="honor-badge roy">Rookie of the Year</span>
            )}
            {c.allStarSelections > 0 && (
              <span className="honor-badge allstar">{c.allStarSelections}× All-Star Five</span>
            )}
          </div>
        </>
      )}

      {player.seasonLog.length > 0 && (
        <>
          <div className="section-title">Season History</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Yr</th><th>Team</th><th>G</th><th>PPG</th><th>RPG</th><th>APG</th><th></th></tr>
              </thead>
              <tbody>
                {[...player.seasonLog].reverse().map((sr) => (
                  <tr key={sr.season}>
                    <td>{sr.season}</td>
                    <td className="muted">{sr.teamLabel}</td>
                    <td className="num">{sr.games}</td>
                    <td className="num">{sr.games ? (sr.points / sr.games).toFixed(1) : '—'}</td>
                    <td className="num">{sr.games ? (sr.rebounds / sr.games).toFixed(1) : '—'}</td>
                    <td className="num">{sr.games ? (sr.assists / sr.games).toFixed(1) : '—'}</td>
                    <td>{sr.champion ? '🏆' : ''}{sr.mvp ? ' MVP' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

export function TeamModal({ team, state, onClose, onPlayer }: {
  team: Team; state: LeagueState; onClose: () => void; onPlayer: (p: Player) => void;
}) {
  const stars = teamStars(team, state.players);
  const score = teamScoreWith(team, state.players);
  const raw = teamRawScore(team, state.players);
  const overCap = raw > team.maxPoints;

  return (
    <Modal title={teamLabel(team)} onClose={onClose}>
      <div className="modal-row">
        <MarketTag market={team.market} />
        <span className="muted-cond">{team.conference} · {team.division}</span>
      </div>
      {team.relocatedFrom && (
        <div className="muted-cond" style={{ color: 'var(--flame)', marginTop: 4 }}>
          Formerly the {team.relocatedFrom}
        </div>
      )}

      <div className="cap-wrap">
        <div className="cap-head">
          <span>RATING {score}</span>
          <span>CAP {team.maxPoints}</span>
        </div>
        <div className="cap-bar">
          <div className="cap-fill" style={{ width: `${(score / team.maxPoints) * 100}%` }} />
        </div>
      </div>

      <div className="section-title">Starting Stars</div>
      {stars.map((s, i) => (
        <div key={s.id} className="roster-row" onClick={() => onPlayer(s)}>
          <div>
            <div className="roster-name">
              {s.name} {i === 0 && <span className="franchise-tag">FRANCHISE</span>}
            </div>
            <div className="muted-cond">{s.position} · {s.archetype} · Age {s.age} · OVR {s.overall}</div>
          </div>
          <div className="roster-right">
            <RarityChip rarity={s.rarity} />
            <ContractBadge p={s} />
          </div>
        </div>
      ))}

      <div className="section-title">Front Office</div>
      <StatLine k={`Coach · ${team.coach.name}`} v={team.coach.rarity} />
      <div className="muted-cond">{team.coach.offense} / {team.coach.defense}</div>
      <StatLine k={`GM · ${team.gm.name}`} v={team.gm.rarity} />

      <div className="section-title">Score Breakdown</div>
      {stars.map((s, i) => (
        <StatLine
          key={s.id}
          k={`${i === 0 ? 'Franchise star' : `Star ${i + 1}`} · ${s.name} (${s.rarity})`}
          v={`+${rarityPoints(s.rarity)}`}
        />
      ))}
      <StatLine k={`Coach · ${team.coach.rarity}`} v={`+${rarityPoints(team.coach.rarity)}`} />
      <StatLine k={`GM · ${team.gm.rarity}`} v={`+${rarityPoints(team.gm.rarity)}`} />
      <StatLine k={`Support core (${team.supportCore})`} v={`+${supportPoints(team.supportCore)}`} />
      <div className="divider" />
      <StatLine k="Total spend" v={raw} />
      <StatLine k="Team cap" v={team.maxPoints} />
      <div className="divider" />
      <StatLine k="Effective rating" v={score} />
      {overCap && (
        <div className="muted-cond" style={{ color: 'var(--flame)', marginTop: 4 }}>
          Spend exceeds cap by {raw - team.maxPoints} — rating is clamped to {team.maxPoints}.
        </div>
      )}

      <div className="section-title">Franchise</div>
      <StatLine k="Record" v={`${team.wins}-${team.losses}`} />
      <StatLine k="Championships" v={team.titles} />
      <StatLine k="Playoff Appearances" v={team.playoffAppearances} />
      <StatLine k="Morale" v={team.morale} />
    </Modal>
  );
}
