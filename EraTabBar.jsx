// Reusable era tab bar — drop into any character-selection grid.
// Renders the five era names + "All Eras" + random buttons.
import React from 'react';
import { ERAS } from './eras.js';
import { sfx } from './sfx.js';
import { randomCharFromEra, randomCharAllEras } from './allCharacters.js';
import GameIcon from "./GameIcon.jsx";

export default function EraTabBar({ selectedEra, onEraChange, onRandom, compact = false }) {
  const tabs = [
    { id: 'all', name: 'All Eras', short: 'ALL', accent: '#9944CC' },
    ...ERAS,
  ];

  const handleRandomEra = () => {
    const era = ERAS[Math.floor(Math.random() * ERAS.length)];
    onEraChange(era.id);
    sfx.click();
  };

  const handleRandomAll = () => {
    const c = randomCharAllEras();
    if (c && onRandom) { onRandom(c.id); sfx.click(); }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { onEraChange(t.id); sfx.click(); }}
            className={`px-2.5 py-1.5 rounded font-heading transition border-2 ${
              selectedEra === t.id
                ? 'text-white scale-105'
                : 'bg-secondary text-secondary-foreground border-border hover:border-muted-foreground'
            }`}
            style={selectedEra === t.id ? {
              backgroundColor: t.accent || t.accent2,
              borderColor: t.accent || '#9944CC',
              boxShadow: `0 0 10px ${(t.accent || '#9944CC')}66`,
            } : {}}
          >
            <span className={compact ? 'text-[8px]' : 'text-[9px]'}>{t.short || t.name}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <button onClick={handleRandomEra} className="px-2 py-1 rounded text-[9px] font-heading bg-primary/30 text-primary-foreground hover:opacity-80 border border-primary/40"><GameIcon emoji="🎲" size={14} /> RANDOM ERA</button>
        <button onClick={handleRandomAll} className="px-2 py-1 rounded text-[9px] font-heading bg-accent/30 text-accent-foreground hover:opacity-80 border border-accent/40"><GameIcon emoji="🎲" size={14} /> RANDOM (ALL ERAS)</button>
      </div>
    </div>
  );
}