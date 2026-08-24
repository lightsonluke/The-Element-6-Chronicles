import React from 'react';
import { getCharLevelData, getUnlockedElements } from './elements.js';

export default function ElementSelect({ charId, currentElement, onSelect, charLevels, label = 'ELEMENT' }) {
  if (!charId) return null;
  const levelData = getCharLevelData({ charLevels }, charId);
  const unlocked = getUnlockedElements(levelData.level);
  const current = currentElement || 'basic';
  return (
    <div className="bg-muted/30 rounded-lg p-2 border border-border/50">
      <p className="text-[9px] font-heading text-muted-foreground mb-1">{label} <span className="text-accent">(Lv {levelData.level})</span></p>
      <div className="flex gap-1 flex-wrap">
        {unlocked.map(el => (
          <button key={el.id} onClick={() => onSelect(el.id)}
            className="px-2 py-0.5 rounded text-[9px] font-heading text-white"
            style={{ backgroundColor: current === el.id ? (el.color || '#666') : 'rgba(128,128,128,0.3)' }}>
            {el.name}
          </button>
        ))}
      </div>
    </div>
  );
}