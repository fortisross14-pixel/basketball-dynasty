import { useState, useEffect } from 'react';
import { listSlots, type SlotMeta } from '../state/saves';

export function HomeScreen({ onNew, onLoad, onDelete }: {
  onNew: (slot: number) => void;
  onLoad: (slot: number) => void;
  onDelete: (slot: number) => void;
}) {
  const [slots, setSlots] = useState<SlotMeta[]>([]);

  useEffect(() => { setSlots(listSlots()); }, []);
  const refresh = () => setSlots(listSlots());

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-mark">DYNASTY</div>
        <div className="home-sub">Basketball Simulator</div>
        <p className="home-blurb">
          Build a franchise. Draft generational talent. Chase rings across decades of
          alternate basketball history. Three save slots — pick one to begin.
        </p>
      </div>

      <div className="slot-grid">
        {slots.map((s) => (
          <div key={s.slot} className="slot-card">
            <div className="slot-head">Slot {s.slot + 1}</div>
            {s.empty ? (
              <>
                <div className="slot-empty">Empty</div>
                <button className="btn-advance slot-btn" onClick={() => { onNew(s.slot); }}>
                  New League
                </button>
              </>
            ) : (
              <>
                <div className="slot-info">
                  <div className="slot-season">Season {s.season}</div>
                  <div className="slot-phase">{s.phase} · week {s.week}</div>
                  {s.championLabel && <div className="slot-champ">Last champ: {s.championLabel}</div>}
                  {s.savedAt && (
                    <div className="slot-date">{new Date(s.savedAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="slot-actions">
                  <button className="btn-advance slot-btn" onClick={() => onLoad(s.slot)}>Continue</button>
                  <button className="btn-ghost btn-sm" onClick={() => {
                    if (confirm(`Delete Slot ${s.slot + 1}? This cannot be undone.`)) {
                      onDelete(s.slot); refresh();
                    }
                  }}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="home-foot">Progress autosaves to the active slot after every advance.</div>
    </div>
  );
}
