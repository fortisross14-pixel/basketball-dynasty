import type { Player, Team, LeagueState } from '../engine/types';
import {
  teamScoreWith, teamStars, teamLabel,
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

      {(c.mvps > 0 || c.allStarSelections > 0 || c.rookieOfYear || c.championships > 0) && (() => {
        // career-relative season number: year minus the player's first season
        const firstYear = player.seasonLog.length > 0
          ? player.seasonLog[0].season
          : Math.min(
              ...[...c.titleYears, ...c.mvpYears, ...c.allStarYears, 9999],
            );
        const rel = (years: number[]) =>
          years.map((y) => y - firstYear + 1).sort((a, b) => a - b).join(', ');
        return (
          <>
            <div className="section-title">Honors</div>
            <div className="honor-card-grid">
              {c.championships > 0 && (
                <div className="honor-card champ">
                  <div className="hc-label">Titles</div>
                  <div className="hc-count">{c.championships}</div>
                  <div className="hc-seasons">Seasons {rel(c.titleYears)}</div>
                </div>
              )}
              {c.mvps > 0 && (
                <div className="honor-card mvp">
                  <div className="hc-label">MVP</div>
                  <div className="hc-count">{c.mvps}</div>
                  <div className="hc-seasons">Seasons {rel(c.mvpYears)}</div>
                </div>
              )}
              {c.allStarSelections > 0 && (
                <div className="honor-card allstar">
                  <div className="hc-label">Best 5</div>
                  <div className="hc-count">{c.allStarSelections}</div>
                  <div className="hc-seasons">Seasons {rel(c.allStarYears)}</div>
                </div>
              )}
              {c.rookieOfYear && (
                <div className="honor-card roy">
                  <div className="hc-label">Rookie of the Year</div>
                  <div className="hc-count">★</div>
                  <div className="hc-seasons">Season 1</div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {player.seasonLog.length > 0 && (
        <>
          <div className="section-title">Season by Season</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th><th>Team</th><th>G</th><th>PPG</th><th>RPG</th>
                  <th>APG</th><th>SPG</th><th>BPG</th><th>3PG</th><th></th>
                </tr>
              </thead>
              <tbody>
                {[...player.seasonLog].reverse().map((sr) => {
                  const pg = (n: number) => (sr.games ? (n / sr.games).toFixed(1) : '—');
                  return (
                    <tr key={sr.season}>
                      <td className="accent-val">{sr.season}</td>
                      <td className="muted">{sr.teamLabel}</td>
                      <td className="num">{sr.games}</td>
                      <td className="num">{pg(sr.points)}</td>
                      <td className="num">{pg(sr.rebounds)}</td>
                      <td className="num">{pg(sr.assists)}</td>
                      <td className="num">{pg(sr.steals)}</td>
                      <td className="num">{pg(sr.blocks)}</td>
                      <td className="num">{pg(sr.threes)}</td>
                      <td>{sr.champion ? '🏆' : ''}{sr.mvp ? '★' : ''}</td>
                    </tr>
                  );
                })}
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

  // a section title with the team's primary color as its background bar
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div
      className="section-title team-section-title"
      style={{ background: `linear-gradient(90deg, ${team.primary}, ${team.primary}22 80%, transparent)` }}
    >
      {children}
    </div>
  );

  return (
    <Modal title={teamLabel(team)} onClose={onClose} accent={team.primary}>
      <div className="team-stripe" style={{
        ['--team-primary' as string]: team.primary,
        ['--team-secondary' as string]: team.secondary,
      }} />
      <div className="modal-row" style={{ marginTop: 8 }}>
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

      <SectionTitle>Starting Stars</SectionTitle>
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

      <SectionTitle>Front Office</SectionTitle>
      <StatLine k={`Coach · ${team.coach.name}`} v={team.coach.rarity} />
      <div className="muted-cond">{team.coach.offense} / {team.coach.defense}</div>
      <StatLine k={`GM · ${team.gm.name}`} v={team.gm.rarity} />

      <SectionTitle>Season by Season</SectionTitle>
      {team.seasonHistory.length === 0 ? (
        <div className="empty-sm">No completed seasons yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Year</th><th>Record</th><th>Playoffs</th><th>Franchise Player</th></tr>
            </thead>
            <tbody>
              {[...team.seasonHistory].reverse().map((row) => (
                <tr key={row.season}>
                  <td className="accent-val">{row.season}</td>
                  <td className="num">{row.wins}-{row.losses}</td>
                  <td className={row.playoffResult === 'Champion' ? 'accent-val' : ''}>
                    {row.playoffResult === 'Champion' ? '🏆 ' : ''}{row.playoffResult}
                  </td>
                  <td className="muted">{row.franchisePlayer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SectionTitle>Franchise</SectionTitle>
      <StatLine k="Current Record" v={`${team.wins}-${team.losses}`} />
      <StatLine k="Championships" v={team.titles} />
      <StatLine k="Playoff Appearances" v={team.playoffAppearances} />
      <StatLine k="Morale" v={team.morale} />
    </Modal>
  );
}
