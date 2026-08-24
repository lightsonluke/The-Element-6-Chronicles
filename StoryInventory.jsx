import React from 'react';
import { BLOCK_COLORS, BLOCK_NAMES, BLOCKS } from './world.js';
import GameIcon from "./GameIcon.jsx";

export default function StoryInventory({ inventory, selectedBlock, onSelect, onClose }) {
  const blockTypes = Object.keys(inventory).filter(k => inventory[k] > 0).map(Number);

  return (
    <div className="absolute top-12 right-4 bg-card/95 backdrop-blur border border-border rounded-xl p-4 w-64 shadow-2xl z-20">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-heading text-sm text-foreground">INVENTORY</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg"><GameIcon emoji="✕" size={14} /></button>
      </div>
      {blockTypes.length === 0 ? (
        <p className="text-muted-foreground text-xs font-body">Empty. Mine blocks with SPACE!</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {blockTypes.map(bt => (
            <button
              key={bt}
              onClick={() => onSelect(bt)}
              className={`flex flex-col items-center p-2 rounded-lg border transition ${
                selectedBlock === bt ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: BLOCK_COLORS[bt] || '#888' }}
              />
              <span className="text-[9px] font-body text-muted-foreground mt-1">{BLOCK_NAMES[bt]}</span>
              <span className="text-xs font-heading text-foreground">{inventory[bt]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}