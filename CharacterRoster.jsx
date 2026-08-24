import React, { useState, useMemo } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { crossoversForChar } from './crossovers.js';
import { sfx } from './sfx.js';
import { ERA_OPTIONS, ALIGNMENTS, getAlignment, getEraAccent, getPowerName, filterCharacters, sortByEra } from './charSelectHelpers.js';
import GameIcon from "./GameIcon.jsx";

// Compact initial-circle tile for the roster grid
function InitialTile({ char, selected, locked, isP1, isP2, onClick, onHover, onLeave, favorite, hasCrossovers, onCrossoverClick }) {
  const border = selected ? (isP1 ? '#FFD700' : isP2 ? '#9944CC' : '') : '';
  const initial = (char.name || '?')[0] || '?';
  const circleStyle = char.splitColor
    ? { background: `linear-gradient(135deg, ${char.color} 50%, ${char.secondaryColor} 50%)` }
    : { backgroundColor: char.color || '#888' };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={locked}
      className={`relative flex flex-col items-center rounded-lg border-2 transition hover:scale-105 ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ borderColor: border || 'var(--border)', backgroundColor: selected ? (isP1 ? 'rgba(255,215,0,0.12)' : 'rgba(153,68,204,0.12)') : 'transparent' }}
    >
      {hasCrossovers && !locked && (
        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center z-10" onClick={(e) => { e.stopPropagation(); onCrossoverClick?.(); }}>
          <span className="text-[6px] text-accent-foreground font-bold"><GameIcon emoji="🔀" size={14} /></span>
        </div>
      )}
      {favorite && !locked && (
        <span className="absolute top-0.5 left-0.5 text-[8px] text-accent z-10"><GameIcon emoji="★" size={14} /></span>
      )}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mt-1"
        style={{ ...circleStyle, boxShadow: locked ? 'none' : `0 0 8px ${char.color}55`, opacity: locked ? 0.5 : 1 }}
      >
        <span className="font-heading text-sm font-bold" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{initial}</span>
      </div>
      <span className="text-[7px] font-heading text-foreground leading-tight text-center px-0.5 pb-1 max-w-[64px] truncate">{char.name}</span>
    </button>
  );
}

// Era dropdown selector
function EraDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = ERA_OPTIONS.find(e => e.id === value) || ERA_OPTIONS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-3 py-1.5 bg-card border-2 rounded-lg font-heading text-xs" style={{ borderColor: current.accent + '66' }}>
        <span className="text-[9px] text-muted-foreground">ERA</span>
        <span style={{ color: current.accent }}>{current.name.toUpperCase()}</span>
        <span className="text-[8px] text-muted-foreground"><GameIcon emoji="▼" size={14} /></span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-card border-2 border-border rounded-lg shadow-2xl min-w-[180px]">
            {ERA_OPTIONS.map(e => (
              <button key={e.id} onClick={() => { onChange(e.id); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-muted/50 font-heading text-xs flex items-center gap-2"
                style={{ color: value === e.id ? e.accent : 'inherit' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.accent }} />
                {e.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Filter pill group
function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-heading text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => (
          <button key={o.id} onClick={() => { sfx.click(); onChange(o.id); }}
            className="px-2 py-0.5 rounded text-[9px] font-heading transition"
            style={value === o.id ? { backgroundColor: o.color || 'var(--primary)', color: '#fff' } : { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CharacterRoster({
  selectedIds = [],
  lockedIds = [],
  onSelect,
  onHoverChar,
  favoriteId,
  ownedCrossovers = [],
  onCrossoverClick,
  customChars = [],
  maxPlayers = 2,
}) {
  const [era, setEra] = useState('all');
  const [alignment, setAlignment] = useState('all');
  const [search, setSearch] = useState('');

  const allChars = useMemo(() => sortByEra([...ALL_CHARS, ...customChars]), [customChars]);

  const filtered = useMemo(() => {
    let result = filterCharacters(allChars, { era, alignment });
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || getPowerName(c).toLowerCase().includes(q));
    }
    return result;
  }, [allChars, era, alignment, search]);

  const lockedSet = new Set(lockedIds);

  return (
    <div className="flex flex-col gap-2">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card/60 border border-border rounded-xl p-2">
        <EraDropdown value={era} onChange={setEra} />
        <div className="h-6 w-px bg-border" />
        <FilterGroup label="ALIGNMENT" options={ALIGNMENTS} value={alignment} onChange={setAlignment} />
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body w-32"
        />
      </div>

      {/* Character grid */}
      <div className="bg-card/40 border border-border rounded-xl p-2">
        <div className="text-[9px] font-heading text-muted-foreground mb-1">
          {filtered.length} characters {era !== 'all' && `· ${ERA_OPTIONS.find(e => e.id === era)?.name}`}
        </div>
        <div className="grid gap-1.5 overflow-y-auto max-h-[280px] p-1"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
          {filtered.map(c => {
            const selected = selectedIds.includes(c.id);
            const isP1 = selectedIds[0] === c.id;
            const isP2 = selectedIds[1] === c.id;
            const locked = lockedSet.has(c.id) && !c.isCustom;
            const hasCX = crossoversForChar(c.id).length > 0;
            return (
              <InitialTile
                key={c.id}
                char={c}
                selected={selected}
                isP1={isP1}
                isP2={isP2}
                locked={locked}
                favorite={c.id === favoriteId}
                hasCrossovers={hasCX}
                onClick={() => !locked && onSelect(c.id)}
                onHover={() => onHoverChar?.(c.id)}
                onLeave={() => onHoverChar?.(null)}
                onCrossoverClick={() => onCrossoverClick?.(c.id)}
              />
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-xs text-muted-foreground py-8">No characters match these filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}