import React from 'react';
import { ERAS } from './eras.js';
import { sfx } from './sfx.js';

export default function EraSelector({ selectedEra, onSelect, compact = false }) {
  return (
    <div className={`flex gap-1 ${compact ? 'flex-wrap' : 'flex-wrap'}`}>
      {ERAS.map(era => {
        const active = selectedEra === era.id;
        return (
          <button
            key={era.id}
            onClick={() => { sfx.click(); onSelect(era.id); }}
            className={`px-3 py-1.5 rounded-lg border-2 font-heading text-[10px] transition-all ${
              active
                ? 'text-white border-transparent shadow-lg scale-105'
                : 'bg-card/60 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
            style={active ? { background: era.accent, borderColor: era.accent } : {}}
            title={era.aesthetic}
          >
            <span className="block leading-tight">{era.name}</span>
            <span className="block text-[7px] opacity-70">{era.subtitle}</span>
          </button>
        );
      })}
      <button
        onClick={() => { sfx.click(); onSelect('all'); }}
        className={`px-3 py-1.5 rounded-lg border-2 font-heading text-[10px] transition-all ${
          selectedEra === 'all'
            ? 'bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-lg scale-105'
            : 'bg-card/60 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
        }`}
      >
        <span className="block leading-tight">ALL ERAS</span>
        <span className="block text-[7px] opacity-70">Every character</span>
      </button>
    </div>
  );
}