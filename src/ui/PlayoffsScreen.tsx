import { useState, useEffect, useRef } from 'react';
import type { LeagueState, Team, PlayoffSeries, GameResult, PlayByPlayBeat } from '../engine/types';
import { ROUND_NAMES, SERIES_LENGTH } from '../engine/types';
import { teamLabel } from '../engine/league';
import { nextGameIndex } from '../engine/season';
import { Modal } from './components';

export function PlayoffsScreen({ state, onTeam, onSimGame }: {
  state: LeagueState;
  onTeam: (t: Team) => void;
  onSimGame: (seriesId: string) => void;
}) {
  const [openSeriesId, setOpenSeriesId] = useState<string | null>(null);

  const byId = new Map(state.teams.map((t) => [t.id, t]));
  if (!state.playoffBracket) {
    return <div className="panel"><div className="empty">The playoffs begin after the regular season. Keep advancing.</div></div>;
  }
  const rounds = [...new Set(state.playoffBracket.map((s) => s.round))].sort((a, b) => a - b);
  const champ = state.champion ? byId.get(state.champion) : null;
  const openSeries = state.playoffBracket.find((s) => s.id === openSeriesId) ?? null;

  return (
    <div>
      {champ && (
        <div className="champ-banner">
          <div className="champ-ttl">★ {state.season} CHAMPIONS ★</div>
          <div className="champ-team">{teamLabel(champ)}</div>
        </div>
      )}

      {rounds.map((rd) => (
        <div key={rd} className="panel">
          <div className="panel-head"><h3>{ROUND_NAMES[rd] ?? `Round ${rd}`}</h3></div>
          <div className="panel-body">
            <div className="bracket-grid">
              {state.playoffBracket!.filter((s) => s.round === rd).map((s) => {
                const hi = byId.get(s.highSeedId)!;
                const lo = byId.get(s.lowSeedId)!;
                const done = s.winnerId !== null;
                const started = s.games.some((g) => g.played);
                return (
                  <div key={s.id} className={`series-card ${done ? 'done' : ''}`}
                       onClick={() => setOpenSeriesId(s.id)}>
                    <div className={`series-line ${s.winnerId === hi.id ? 'winner' : ''}`}>
                      <span className="seed">{s.highSeed}</span>
                      <span className="series-abbr">{hi.abbr}</span>
                      <span className="series-w">{s.highWins}</span>
                    </div>
                    <div className={`series-line ${s.winnerId === lo.id ? 'winner' : ''}`}>
                      <span className="seed">{s.lowSeed}</span>
                      <span className="series-abbr">{lo.abbr}</span>
                      <span className="series-w">{s.lowWins}</span>
                    </div>
                    <div className="series-status">
                      {done ? 'Series over' : started ? 'In progress' : 'Click to play'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {openSeries && (
        <SeriesModal
          series={openSeries}
          state={state}
          onClose={() => setOpenSeriesId(null)}
          onSimGame={onSimGame}
          onTeam={onTeam}
        />
      )}
    </div>
  );
}

// ─── series popup: game 1 / 2 / 3, simulate one at a time ───
function SeriesModal({ series, state, onClose, onSimGame, onTeam }: {
  series: PlayoffSeries;
  state: LeagueState;
  onClose: () => void;
  onSimGame: (id: string) => void;
  onTeam: (t: Team) => void;
}) {
  const byId = new Map(state.teams.map((t) => [t.id, t]));
  const high = byId.get(series.highSeedId)!;
  const low = byId.get(series.lowSeedId)!;
  const next = nextGameIndex(series);

  const [pbpGame, setPbpGame] = useState<GameResult | null>(null);
  const prevPlayed = useRef(series.games.filter((g) => g.played).length);

  useEffect(() => {
    const playedCount = series.games.filter((g) => g.played).length;
    if (playedCount > prevPlayed.current) {
      const newest = [...series.games].reverse().find((g) => g.played);
      if (newest?.result?.playByPlay && newest.result.playByPlay.length > 0) {
        setPbpGame(newest.result);
      }
    }
    prevPlayed.current = playedCount;
  }, [series.games]);

  const roundName = ROUND_NAMES[series.round] ?? `Round ${series.round}`;
  const seriesLen = SERIES_LENGTH[series.round] ?? 3;
  // higher seed hosts odd-numbered games (game index 0,2,4,6)
  const homeForGame = (gi: number) => (gi % 2 === 0 ? high : low);
  const awayForGame = (gi: number) => (gi % 2 === 0 ? low : high);

  return (
    <Modal title={roundName} onClose={onClose}>
      <div className="series-head">
        <button className="series-team-btn" onClick={() => onTeam(high)}>
          <span className="seed-lg">{series.highSeed}</span> {teamLabel(high)}
        </button>
        <span className="series-vs">{series.highWins} – {series.lowWins}</span>
        <button className="series-team-btn right" onClick={() => onTeam(low)}>
          {teamLabel(low)} <span className="seed-lg">{series.lowSeed}</span>
        </button>
      </div>
      {series.winnerId && (
        <div className="series-result-banner">
          {teamLabel(byId.get(series.winnerId)!)} win the series
        </div>
      )}

      <div className="section-title">Games (Best of {seriesLen})</div>
      {series.games.map((g, gi) => {
        // hide game slots that will never be needed (series already decided)
        if (series.winnerId && !g.played) return null;
        const home = homeForGame(gi);
        const away = awayForGame(gi);
        const isNext = gi === next;
        return (
          <div key={gi} className="game-row">
            <div className="game-label">Game {gi + 1}</div>
            {g.played && g.result ? (
              <div className="game-score-wrap">
                <span className="game-score">
                  {away.abbr} {sideScore(g.result, away.id)} — {sideScore(g.result, home.id)} {home.abbr}
                </span>
                {g.result.playByPlay && (
                  <button className="btn-ghost btn-sm" onClick={() => setPbpGame(g.result!)}>
                    Replay Final 2:00
                  </button>
                )}
              </div>
            ) : isNext ? (
              <button className="btn-advance btn-sm" onClick={() => onSimGame(series.id)}>
                Simulate Game {gi + 1}
              </button>
            ) : (
              <span className="game-pending">—</span>
            )}
          </div>
        );
      })}

      {!series.winnerId && next >= 0 && (
        <p className="hint" style={{ marginTop: 10 }}>
          {series.round >= 2
            ? 'Close games (within 5) show a live final-two-minutes play-by-play.'
            : 'First-round games show the final score only.'}
        </p>
      )}

      {pbpGame && pbpGame.playByPlay && (
        <PlayByPlayViewer
          beats={pbpGame.playByPlay}
          home={byId.get(pbpGame.homeId)!}
          away={byId.get(pbpGame.awayId)!}
          onClose={() => setPbpGame(null)}
        />
      )}
    </Modal>
  );
}

function sideScore(r: GameResult, teamId: string): number {
  return r.homeId === teamId ? r.homeScore : r.awayScore;
}

// ─── final-2:00 play-by-play viewer: 2s auto-advance, tap to skip ahead ───
function PlayByPlayViewer({ beats, home, away, onClose }: {
  beats: PlayByPlayBeat[];
  home: Team;
  away: Team;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (done) return;
    if (idx >= beats.length - 1) { setDone(true); return; }
    timer.current = window.setTimeout(() => setIdx((i) => i + 1), 2000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, done, beats.length]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [idx]);

  // tap anywhere in the viewer to advance one beat immediately
  const advanceOne = () => {
    if (done) return;
    if (timer.current) clearTimeout(timer.current);
    if (idx >= beats.length - 1) { setDone(true); return; }
    setIdx((i) => i + 1);
  };

  const skip = () => {
    if (timer.current) clearTimeout(timer.current);
    setIdx(beats.length - 1);
    setDone(true);
  };

  const beat = beats[idx];
  const visible = beats.slice(0, idx + 1);

  return (
    <div className="pbp-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="pbp-box">
        <div className="pbp-scoreboard">
          <div className="pbp-team">
            <div className="pbp-abbr">{away.abbr}</div>
            <div className="pbp-pts">{beat.awayScore}</div>
          </div>
          <div className="pbp-clock">
            <div className="pbp-clock-time">{beat.clock}</div>
            <div className="pbp-clock-lbl">4TH QTR</div>
          </div>
          <div className="pbp-team">
            <div className="pbp-abbr">{home.abbr}</div>
            <div className="pbp-pts">{beat.homeScore}</div>
          </div>
        </div>

        {/* tapping the feed advances one beat */}
        <div className="pbp-feed" ref={feedRef} onClick={advanceOne}
             style={{ cursor: done ? 'default' : 'pointer' }}>
          {visible.map((b, i) => (
            <div key={i} className={`pbp-beat k-${b.kind} ${i === idx ? 'current' : ''}`}>
              <span className="pbp-beat-clock">{b.clock}</span>
              <span className="pbp-beat-team">{b.teamAbbr}</span>
              <span className="pbp-beat-text">{b.text}</span>
            </div>
          ))}
          {!done && <div className="pbp-tap-hint">tap to advance · auto-plays every 2s</div>}
        </div>

        <div className="pbp-controls">
          {!done ? (
            <button className="btn-advance btn-sm" onClick={skip}>Skip to Final</button>
          ) : (
            <button className="btn-advance btn-sm" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
