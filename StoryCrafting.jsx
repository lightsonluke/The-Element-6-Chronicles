import React from 'react';
import { RECIPES, canCraft } from './crafting.js';
import { BLOCK_COLORS, BLOCK_NAMES } from './world.js';
import GameIcon from "./GameIcon.jsx";

export default function StoryCrafting({ inventory, onCraft, onClose }) {
  return (
    <div className="absolute top-12 left-4 bg-card/95 backdrop-blur border border-border rounded-xl p-4 w-72 shadow-2xl z-20">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-heading text-sm text-foreground">CRAFTING</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg"><GameIcon emoji="✕" size={14} /></button>
      </div>
      <div className="space-y-2">
        {RECIPES.map((recipe, idx) => {
          const possible = canCraft(recipe, inventory);
          return (
            <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${possible ? 'border-accent/50 bg-accent/5' : 'border-border opacity-50'}`}>
              <div className="w-6 h-6 rounded" style={{ backgroundColor: BLOCK_COLORS[recipe.result] }} />
              <div className="flex-1">
                <p className="text-xs font-heading text-foreground">{recipe.name} ×{recipe.amount}</p>
                <p className="text-[9px] font-body text-muted-foreground">
                  {recipe.ingredients.map(i => `${BLOCK_NAMES[i.block]} ×${i.count}`).join(' + ')}
                </p>
              </div>
              <button
                disabled={!possible}
                onClick={() => onCraft(recipe)}
                className={`px-2 py-1 rounded text-xs font-heading ${possible ? 'bg-accent text-accent-foreground hover:opacity-80' : 'bg-muted text-muted-foreground'}`}
              >
                CRAFT
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}