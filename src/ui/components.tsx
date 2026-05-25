import type { Rarity, Player } from '../engine/types';

export function RarityChip({ rarity }: { rarity: Rarity }) {
  return <span className={`chip r-${rarity}`}>{rarity}</span>;
}

export function MarketTag({ market }: { market: string }) {
  return <span className={`market-tag mk-${market}`}>{market}</span>;
}

export function StatLine({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="statline">
      <span className="k">{k}</span>
      <span className="v num">{v}</span>
    </div>
  );
}

export function AttrBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="attr">
      <span className="attr-label">{label}</span>
      <div className="attr-track">
        <div className="attr-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="attr-val num">{value}</span>
    </div>
  );
}

export function ContractBadge({ p }: { p: Player }) {
  if (p.teamId === null) return <span className="contract-badge fa">Free Agent</span>;
  const expiring = p.contractLeft <= 1;
  return (
    <span className={`contract-badge ${expiring ? 'expiring' : ''}`}>
      {p.contractLeft}/{p.contractYears}y
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h2>{title}</h2>
          <button className="btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}
