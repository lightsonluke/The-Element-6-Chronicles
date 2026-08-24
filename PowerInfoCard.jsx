import React from 'react';
import { getPowerEffect } from './powerEffects.js';
import { POWER_TYPE_INFO } from './powerDescriptions.js';
import GameIcon from "./GameIcon.jsx";

export default function PowerInfoCard({ char, compact = false }) {
  if (!char) return null;
  const effect = getPowerEffect(char.id, char);
  if (!effect) return null;
  const info = POWER_TYPE_INFO[effect.type] || { how: 'Self-buff or targeted effect.', effect: 'See power details.' };

  return (
    <div className="rounded-lg p-3 border-2 w-full" style={{ borderColor: char.color + '55', backgroundColor: char.color + '0d' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: char.color + '22' }}>
          <span className="text-xs font-heading" style={{ color: char.color }}><GameIcon emoji="⚡" size={14} /></span>
        </div>
        <div>
          <p className="font-heading text-sm" style={{ color: char.color }}>{effect.name}</p>
          <p className="text-[8px] text-muted-foreground font-body uppercase tracking-wider">Power Button (.) for P1, (C) for P2</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div>
          <p className="text-[8px] font-heading text-accent uppercase mb-0.5">How to Use</p>
          <p className="text-[10px] text-foreground/80 font-body leading-relaxed">{info.how}</p>
        </div>
        <div>
          <p className="text-[8px] font-heading text-accent uppercase mb-0.5">Effect</p>
          <p className="text-[10px] text-foreground/80 font-body leading-relaxed">{info.effect}</p>
        </div>
      </div>

      {!compact && (
        <div className="flex gap-3 mt-2 pt-2 border-t" style={{ borderColor: char.color + '22' }}>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-body text-muted-foreground">Duration:</span>
            <span className="text-[9px] font-heading" style={{ color: char.color }}>{effect.duration > 0 ? `${effect.duration}s` : 'Instant'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-body text-muted-foreground">Cooldown:</span>
            <span className="text-[9px] font-heading" style={{ color: char.color }}>{effect.cooldown}s</span>
          </div>
        </div>
      )}
    </div>
  );
}