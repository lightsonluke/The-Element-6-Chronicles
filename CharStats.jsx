import React from 'react';
import { applyElement } from './elements.js';

export default function CharStats({ char, element = 'basic' }) {
  if (!char) return null;
  const baseStats = char.stats || {};
  const stats = applyElement(baseStats, element);
  return (
    <div className="bg-card/60 rounded-lg p-2 border border-border">
      <div className="flex items-center gap-1 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: char.color }} />
        <span className="text-[10px] font-heading" style={{ color: char.color }}>{char.name}</span>
        {char.title && <span className="text-[8px] text-muted-foreground truncate">{char.title}</span>}
      </div>
      {char.weapon && (
        <p className="text-[8px] text-muted-foreground mb-1 truncate">
          <span className="text-foreground/80">{char.weapon}</span> · <span className="text-foreground/80">{char.power}</span>
        </p>
      )}
      {['speed', 'power', 'defense', 'control', 'utility'].filter(s => stats[s] !== undefined).map((stat) => {
        const val = stats[stat];
        const baseVal = baseStats[stat] || 5;
        const isBoosted = val > baseVal;
        const isReduced = val < baseVal;
        return (
          <div key={stat} className="flex items-center gap-1 mb-0.5">
            <span className="text-[8px] text-muted-foreground w-10 capitalize">{stat}</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: isBoosted ? '#FFFFFF' : char.color, boxShadow: isBoosted ? '0 0 6px #FFFFFF' : 'none' }} />
            </div>
            <span className="text-[8px] font-heading w-3 text-right" style={{ color: isBoosted ? '#FFFFFF' : isReduced ? '#FF6666' : 'inherit', textShadow: isBoosted ? '0 0 6px #FFFFFF' : 'none' }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}