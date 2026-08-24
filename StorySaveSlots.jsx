import React, { useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

export default function StorySaveSlots({ slots, onSelect, onDelete, onBack }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSlotSummary = (data) => {
    if (!data) return null;
    const heroId = data.currentHeroId || (data.unlockedIds || ['yellow'])[0];
    const hero = ALL.find(c => c.id === heroId);
    const defeated = (data.defeatedVillains || []).length;
    const totalVillains = VILLAINS.filter(v => !v.isFinalBoss).length;
    return {
      heroName: hero?.name || 'Unknown',
      heroColor: hero?.color || '#FFD700',
      defeated,
      totalVillains,
      date: formatDate(data._savedAt),
    };
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">STORY MODE — SAVE FILES</h2>
          <p className="text-xs text-muted-foreground font-body">Choose a save file to continue your journey</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="flex flex-col gap-3">
        {slots.map((data, idx) => {
          const summary = getSlotSummary(data);
          const isEmpty = !summary;
          const isConfirming = confirmDelete === idx;

          return (
            <div
              key={idx}
              className={`bg-card border-2 rounded-xl p-4 flex items-center gap-4 transition ${isEmpty ? 'border-border' : 'border-accent/40'}`}
            >
              {/* Slot number badge */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-heading text-xl ${isEmpty ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}>
                {idx + 1}
              </div>

              {/* Slot content */}
              <div className="flex-1">
                {isEmpty ? (
                  <div>
                    <p className="font-heading text-sm text-foreground">Empty Save Slot</p>
                    <p className="text-xs text-muted-foreground font-body">Start a new adventure</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: summary.heroColor, borderColor: summary.heroColor, boxShadow: `0 0 8px ${summary.heroColor}55` }} />
                    <div>
                      <p className="font-heading text-sm text-foreground">{summary.heroName}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        Villains defeated: <span className="text-accent">{summary.defeated}/{summary.totalVillains}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body">Last saved: {summary.date}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isEmpty ? (
                  <button onClick={() => onSelect(idx)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">
                    NEW GAME
                  </button>
                ) : isConfirming ? (
                  <>
                    <button onClick={() => { onDelete(idx); setConfirmDelete(null); }} className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg font-heading text-xs hover:opacity-90">
                      CONFIRM
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs hover:opacity-90">
                      CANCEL
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onSelect(idx)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">
                      CONTINUE
                    </button>
                    <button onClick={() => setConfirmDelete(idx)} className="px-3 py-2 bg-secondary text-destructive rounded-lg font-heading text-xs text-destructive hover:opacity-90">
                      DELETE
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading text-sm text-accent mb-2">SAVE FILE INFO</h3>
        <p className="text-xs text-muted-foreground font-body">• Each slot stores a separate story playthrough (villains defeated, inventory, world position)</p>
        <p className="text-xs text-muted-foreground font-body">• Tokens, cosmetics, and character unlocks are shared across ALL saves — never reset by story mode</p>
        <p className="text-xs text-muted-foreground font-body">• Delete a slot to permanently erase that playthrough's story progress</p>
      </div>
    </div>
  );
}