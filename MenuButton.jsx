import React from 'react';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Rounded parallelogram button split diagonally — half primary, half accent.
// Rimmed with dark blue (dark mode) or light purple (light mode).
export default function MenuButton({ label, onClick, disabled, notifCount, isDark, hasSubItems, expanded, onToggleExpand }) {
  const rim = isDark ? '#1a1a4e' : '#c4a8ff';

  return (
    <button
      onClick={() => {
        if (disabled) return;
        sfx.click();
        if (hasSubItems) onToggleExpand();
        else onClick();
      }}
      disabled={disabled}
      className="relative w-full transition-transform duration-150 hover:scale-[1.03] active:scale-95"
      style={{ transform: 'skewX(-12deg)', pointerEvents: disabled ? 'none' : 'auto', cursor: disabled ? 'default' : 'pointer' }}
    >
      <div
        className="rounded-xl overflow-hidden border-2"
        style={{
          borderColor: rim,
          background: disabled
            ? 'hsl(var(--muted))'
            : 'linear-gradient(125deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 48%, hsl(var(--accent)) 52%, hsl(var(--accent)) 100%)',
          boxShadow: disabled ? 'none' : `0 0 10px ${rim}55`,
        }}
      >
        <div className="px-5 py-3.5 flex items-center justify-center gap-1.5" style={{ transform: 'skewX(12deg)' }}>
          <span className={`font-heading text-sm tracking-wider ${disabled ? 'text-muted-foreground' : 'text-white'}`}>
            {label}
          </span>
          {hasSubItems && (
            <span className="text-[8px] text-white/70">{expanded ? <GameIcon emoji="▼" size={14} /> : <GameIcon emoji="▶" size={14} />}</span>
          )}
          {notifCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[9px] font-heading rounded-full px-1.5 min-w-[18px] text-center leading-tight">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}