import type { LeagueState } from '../engine/types';
import { RarityChip } from './components';

export function OffseasonScreen({ state }: { state: LeagueState }) {
  const r = state.lastOffseason;
  if (!r) {
    return <div className="panel"><div className="empty">No offseason has been processed yet.</div></div>;
  }
  return (
    <div>
      <div className="panel">
        <div className="panel-head"><h2>{r.season} <span className="accent">Offseason Report</span></h2></div>
        <div className="panel-body">
          <p className="muted-cond">
            Processed in order: retirements → team max-points reroll → support-core updates →
            draft → free agency.
          </p>
        </div>
      </div>

      <ReportSection title={`Retirements (${r.retirements.length})`}>
        {r.retirements.length === 0 ? <Empty text="No retirements." /> : (
          <table>
            <thead><tr><th>Player</th><th>Rarity</th><th>Last Team</th><th>Seasons</th></tr></thead>
            <tbody>
              {r.retirements.map((x, i) => (
                <tr key={i}>
                  <td>{x.name}</td>
                  <td><RarityChip rarity={x.rarity} /></td>
                  <td className="muted">{x.teamLabel}</td>
                  <td className="num">{x.seasons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title={`Team Max-Points Changes (${r.capChanges.length})`}>
        {r.capChanges.length === 0 ? <Empty text="No cap changes." /> : (
          <table>
            <thead><tr><th>Team</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
            <tbody>
              {[...r.capChanges].sort((a, b) => b.delta - a.delta).map((x, i) => (
                <tr key={i}>
                  <td>{x.teamLabel}</td>
                  <td className="num">{x.before}</td>
                  <td className="num">{x.after}</td>
                  <td className={`num ${x.delta > 0 ? 'up' : 'down'}`}>
                    {x.delta > 0 ? `▲ +${x.delta}` : `▼ ${x.delta}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title={`Support-Core Updates (${r.supportChanges.length})`}>
        {r.supportChanges.length === 0 ? <Empty text="No support-core changes." /> : (
          <table>
            <thead><tr><th>Team</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
            <tbody>
              {[...r.supportChanges].sort((a, b) => (b.after - b.before) - (a.after - a.before)).map((x, i) => {
                const d = x.after - x.before;
                return (
                  <tr key={i}>
                    <td>{x.teamLabel}</td>
                    <td className="num">{x.before}</td>
                    <td className="num">{x.after}</td>
                    <td className={`num ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? `▲ +${d}` : `▼ ${d}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title={`Draft (${r.draftPicks.length} picks)`}>
        {r.draftPicks.length === 0 ? <Empty text="No draft picks — full rosters." /> : (
          <table>
            <thead><tr><th>Pick</th><th>Team</th><th>Player</th><th>Rarity</th></tr></thead>
            <tbody>
              {r.draftPicks.map((x) => (
                <tr key={x.pick}>
                  <td className="accent-val">#{x.pick}</td>
                  <td>{x.teamLabel}</td>
                  <td>{x.playerName}</td>
                  <td><RarityChip rarity={x.rarity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title={`Free-Agent Signings (${r.signings.length})`}>
        {r.signings.length === 0 ? <Empty text="No signings." /> : (
          <table>
            <thead><tr><th>Player</th><th>Rarity</th><th>Signed With</th><th>Years</th></tr></thead>
            <tbody>
              {r.signings.map((x, i) => (
                <tr key={i}>
                  <td>{x.playerName}</td>
                  <td><RarityChip rarity={x.rarity} /></td>
                  <td>{x.toTeamLabel}</td>
                  <td className="num">{x.years}y</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title={`Players Who Left Their Team (${r.nonRenewals.length})`}>
        {r.nonRenewals.length === 0 ? <Empty text="Everyone re-signed." /> : (
          <table>
            <thead><tr><th>Player</th><th>Rarity</th><th>Former Team</th><th>Reason</th></tr></thead>
            <tbody>
              {r.nonRenewals.map((x, i) => (
                <tr key={i}>
                  <td>{x.playerName}</td>
                  <td><RarityChip rarity={x.rarity} /></td>
                  <td className="muted">{x.fromTeamLabel}</td>
                  <td className="muted-cond">{x.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title={`Trades & Cap Reconciliation (${r.trades.length})`}>
        {r.trades.length === 0 ? <Empty text="No cap reconciliation needed — every team was already legal." /> : (
          <>
            <div className="empty-sm">
              Teams over their cap must shed points — by trading a star to a team with
              room, or releasing one and signing a cheaper free agent.
            </div>
            {r.trades.map((t, i) => (
              <div key={i} className="trade-row">
                <span className={`trade-kind ${t.kind}`}>{t.kind}</span>
                <span>{t.teamALabel}</span>
                <span className="muted">sends</span>
                <span>{t.playerOut} <RarityChip rarity={t.playerOutRarity} /></span>
                <span className="trade-arrow">→</span>
                <span className="muted">{t.kind === 'trade' ? t.teamBLabel : 'released'}</span>
                {t.playerIn && (
                  <>
                    <span className="muted">·{t.kind === 'trade' ? ' receives' : ' signs'}</span>
                    <span>{t.playerIn}{t.playerInRarity && <> <RarityChip rarity={t.playerInRarity} /></>}</span>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </ReportSection>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-head"><h3>{title}</h3></div>
      <div className="panel-body table-wrap">{children}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="empty-sm">{text}</div>;
}
