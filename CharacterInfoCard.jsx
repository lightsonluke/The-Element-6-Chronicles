import React from 'react';
import { STAT_KEYS, getStatTotal, getEraLabel, getEraAccent, getAlignment, getPowerName, getRealName } from './charSelectHelpers.js';

// Hover information panel — shows when the user hovers over a character tile.
export default function CharacterInfoCard({ char }) {
  if (!char) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 min-w-[200px]">
        <p className="text-[10px] text-muted-foreground font-body text-center py-4">Hover a character to see details</p>
      </div>
    );
  }

  const realName = getRealName(char);
  const eraAccent = getEraAccent(char);
  const statTotal = getStatTotal(char.stats || {});

  return (
    <div className="bg-card border-2 rounded-xl p-3 min-w-[200px] shadow-lg" style={{ borderColor: eraAccent + '44' }}>
      {/* Name */}
      <p className="font-heading text-base leading-tight" style={{ color: char.color, textShadow: `0 0 8px ${char.color}44` }}>{char.name}</p>
      {realName && <p className="text-[9px] text-muted-foreground font-body">{realName}</p>}
      <p className="text-[8px] text-muted-foreground font-body italic mb-1.5">"{char.title}"</p>

      {/* Era / Alignment / Element */}
      <div className="space-y-0.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-heading text-muted-foreground w-14">ERA:</span>
          <span className="text-[8px] font-heading" style={{ color: eraAccent }}>{getEraLabel(char)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-heading text-muted-foreground w-14">ALIGNMENT:</span>
          <span className="text-[8px] font-heading text-foreground">{getAlignment(char)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-heading text-muted-foreground w-14">ELEMENT:</span>
          <span className="text-[8px] font-heading" style={{ color: char.color }}>{getPowerName(char)}</span>
        </div>
      </div>

      {/* Stat bars */}
      <div className="space-y-0.5 mb-2">
        {STAT_KEYS.map(stat => {
          const val = char.stats?.[stat] || 0;
          return (
            <div key={stat} className="flex items-center gap-1.5">
              <span className="text-[7px] font-heading text-muted-foreground w-12 uppercase">{stat}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: char.color }} />
              </div>
              <span className="text-[7px] font-heading w-3 text-right text-foreground">{val}</span>
            </div>
          );
        })}
        <div className="flex items-center justify-between pt-0.5 border-t border-border">
          <span className="text-[7px] font-heading text-muted-foreground">TOTAL</span>
          <span className="text-[8px] font-heading text-accent">{statTotal} / 35</span>
        </div>
      </div>

      {/* Ability */}
      <div className="bg-muted/30 rounded-lg p-1.5 border border-border/50">
        <p className="text-[7px] font-heading text-accent mb-0.5">ABILITY</p>
        <p className="text-[8px] font-body text-foreground/80 leading-tight">
          {char.powerDescription || char.lore || 'No ability description available.'}
        </p>
      </div>
    </div>
  );
}