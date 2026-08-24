import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ERAS, ERA_MAP, OLD_GEN_CHARS, OLD_GEN_MAP, getEraRoster, randomEra, randomCharFromEra, randomCharFromAllEras } from './eras.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import EraSelector from './EraSelector.jsx';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const DIFFICULTIES = ['Easy', 'Normal', 'Hard', 'Expert'];
const STAT_KEYS = ['speed', 'power', 'defense', 'utility', 'control'];

function getCharColor(c) {
  if (c.splitColor) return `linear-gradient(135deg, ${c.color} 50%, ${c.secondaryColor} 50%)`;
  return c.color || '#888';
}
function totalStats(c) {
  const s = c.stats || {};
  return (s.speed||0)+(s.power||0)+(s.defense||0)+(s.utility||0)+(s.control||0);
}

export default function EraCharacterSelect({
  onBack, onStart, unlockedIds = [], favoriteId, gameMode = 'regular',
  charLevels = {}, equippedElements = {}, onEquipElement,
  customCharsData = {}, maxPlayers = 2, isCPUOnly = false,
}) {
  const [eraP1, setEraP1] = useState('g1');
  const [eraP2, setEraP2] = useState('g5');
  const [p1, setP1] = useState('g1_thunder');
  const [p2, setP2] = useState('yellow');
  const [selecting, setSelecting] = useState(1); // which player is selecting
  const [p2Mode, setP2Mode] = useState('cpu');
  const [difficulty, setDifficulty] = useState('Normal');
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState('');
  const gridRef = useRef(null);

  const allG5 = useMemo(() => [...HEROES, ...VILLAINS, ...GUARDIANS], []);

  const rosterFor = (eraId) => {
    if (eraId === 'all') {
      return [...OLD_GEN_CHARS, ...allG5];
    }
    if (eraId === 'g5') return allG5;
    return OLD_GEN_CHARS.filter(c => c.era === eraId);
  };

  const currentEra = selecting === 1 ? eraP1 : eraP2;
  const currentRoster = useMemo(() => {
    let roster = rosterFor(currentEra);
    if (search.trim()) {
      const q = search.toLowerCase();
      roster = roster.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.powerTitle || c.power || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q)
      );
    }
    return roster;
  }, [currentEra, search, allG5]);

  const hoveredChar = hovered ? (OLD_GEN_MAP[hovered] || allG5.find(c => c.id === hovered)) : null;
  const p1Char = OLD_GEN_MAP[p1] || allG5.find(c => c.id === p1) || allG5[0];
  const p2Char = OLD_GEN_MAP[p2] || allG5.find(c => c.id === p2) || allG5[1];

  const handleSelect = (charId) => {
    sfx.click();
    if (selecting === 1) setP1(charId);
    else setP2(charId);
  };

  const handleStart = () => {
    sfx.purchaseSuccess();
    onStart?.({
      p1, p2, p1Era: eraP1, p2Era: eraP2,
      isCPU: p2Mode === 'cpu', difficulty: difficulty.toLowerCase(),
    });
  };

  const handleRandomEra = () => {
    const e = randomEra();
    if (selecting === 1) { setEraP1(e); const c = randomCharFromEra(e, allG5); if (c) setP1(c.id); }
    else { setEraP2(e); const c = randomCharFromEra(e, allG5); if (c) setP2(c.id); }
    sfx.click();
  };

  const handleRandomChar = () => {
    if (currentEra === 'all') {
      const c = randomCharFromAllEras(allG5);
      if (c) handleSelect(c.id);
    } else {
      const c = randomCharFromEra(currentEra, allG5);
      if (c) handleSelect(c.id);
    }
    sfx.click();
  };

  // Era-themed background
  const eraInfo = ERA_MAP[currentEra] || ERA_MAP['g5'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/80 border-b-2 border-border">
        <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Back</button>
        <div className="flex items-center gap-3">
          <span className="font-heading text-sm text-accent">{gameMode.toUpperCase()}</span>
          <span className="text-[10px] text-muted-foreground">{p2Mode === 'cpu' ? '1P vs CPU' : '1P vs 2P'}</span>
          <span className="text-[10px] text-muted-foreground">Stock: 3</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="⚙" size={14} /> Settings</button>
        </div>
      </div>

      {/* ── PLAYER SELECTOR TABS ── */}
      <div className="flex gap-2 px-4 py-2 bg-muted/30 border-b border-border">
        <button
          onClick={() => { setSelecting(1); sfx.click(); }}
          className={`px-4 py-1.5 rounded-lg font-heading text-xs transition ${selecting === 1 ? 'bg-primary text-primary-foreground scale-105' : 'bg-card text-muted-foreground hover:text-foreground'}`}
        >PLAYER 1{p1Char ? ` — ${p1Char.name}` : ''}</button>
        {!isCPUOnly && (
          <button
            onClick={() => { setSelecting(2); sfx.click(); }}
            className={`px-4 py-1.5 rounded-lg font-heading text-xs transition ${selecting === 2 ? 'bg-primary text-primary-foreground scale-105' : 'bg-card text-muted-foreground hover:text-foreground'}`}
          >PLAYER 2{p2Char ? ` — ${p2Char.name}` : ''}</button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[9px] font-heading text-muted-foreground">P2:</span>
          <button onClick={() => { setP2Mode(p2Mode === 'cpu' ? 'player' : 'cpu'); sfx.click(); }}
            className={`px-2 py-0.5 rounded text-[9px] font-heading ${p2Mode === 'cpu' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {p2Mode === 'cpu' ? 'CPU' : 'HUMAN'}
          </button>
          {p2Mode === 'cpu' && (
            <select value={difficulty} onChange={e => { setDifficulty(e.target.value); sfx.click(); }}
              className="bg-card border border-border rounded px-2 py-0.5 text-[9px] font-heading text-foreground">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── ERA SELECTOR + SEARCH ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-card/40 border-b border-border flex-wrap">
        <EraSelector
          selectedEra={selecting === 1 ? eraP1 : eraP2}
          onSelect={(eraId) => {
            if (selecting === 1) setEraP1(eraId);
            else setEraP2(eraId);
            sfx.click();
          }}
        />
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={handleRandomEra} className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[9px] hover:opacity-80"><GameIcon emoji="🎲" size={14} /> RANDOM ERA</button>
          <button onClick={handleRandomChar} className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[9px] hover:opacity-80"><GameIcon emoji="🎲" size={14} /> RANDOM CHAR</button>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search characters..."
          className="px-2 py-1 bg-muted/40 border border-border rounded text-[10px] font-body text-foreground w-40"
        />
      </div>

      {/* ── CHARACTER GRID ── */}
      <div className="flex-1 overflow-hidden flex flex-col px-4 py-2">
        <div
          ref={gridRef}
          className="flex-1 overflow-y-auto grid gap-2 p-2 rounded-lg"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
            maxHeight: 'calc(100vh - 420px)',
          }}
        >
          {currentRoster.map(c => {
            const isSel = (selecting === 1 ? p1 : p2) === c.id;
            const isHovered = hovered === c.id;
            const eraLabel = c.era ? (ERA_MAP[c.era]?.short || 'G5') : 'G5';
            const eraColor = c.era ? (ERA_MAP[c.era]?.accent || '#888') : '#9944CC';
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                  isSel ? 'border-accent scale-105 shadow-lg' : isHovered ? 'border-primary/50 scale-102' : 'border-border'
                }`}
              >
                <div className="w-full aspect-square flex items-center justify-center" style={{ background: getCharColor(c) }}>
                  <span className="text-white font-heading text-[8px] text-center px-1 drop-shadow-lg">{(c.name || c.id).slice(0, 10)}</span>
                </div>
                <div className="absolute top-0 left-0 px-1 rounded-br bg-black/60">
                  <span className="text-[6px] font-heading" style={{ color: eraColor }}>{eraLabel}</span>
                </div>
                {isSel && (
                  <div className="absolute bottom-0 right-0 px-1 rounded-tl bg-accent text-accent-foreground">
                    <span className="text-[6px] font-heading">P{selecting}</span>
                  </div>
                )}
              </button>
            );
          })}
          {currentRoster.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground text-xs">No characters found.</div>
          )}
        </div>
      </div>

      {/* ── BOTTOM CHARACTER DISPLAY / PEDESTALS ── */}
      <div className="flex gap-3 px-4 py-3 bg-card/80 border-t-2 border-border">
        {/* Player 1 pedestal */}
        <PlayerPedestal char={p1Char} playerNum={1} eraInfo={p1Char?.era ? ERA_MAP[p1Char.era] : ERA_MAP['g5']} />
        {/* Hovered character info panel */}
        {hoveredChar && (
          <CharInfoPanel char={hoveredChar} eraInfo={hoveredChar?.era ? ERA_MAP[hoveredChar.era] : ERA_MAP['g5']} />
        )}
        {/* Player 2 pedestal */}
        <PlayerPedestal char={p2Char} playerNum={2} eraInfo={p2Char?.era ? ERA_MAP[p2Char.era] : ERA_MAP['g5']} />
      </div>

      {/* ── START BUTTON ── */}
      <div className="flex justify-center pb-3">
        <button
          onClick={handleStart}
          className="px-8 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm shadow-xl hover:scale-105 transition"
        >
          <GameIcon emoji="⚔" size={14} /> START BATTLE
        </button>
      </div>
    </div>
  );
}

function PlayerPedestal({ char, playerNum, eraInfo }) {
  if (!char) return null;
  const stats = char.stats || {};
  return (
    <div className="flex-1 min-w-[180px] bg-muted/30 border-2 border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded font-heading text-[8px]">P{playerNum}</span>
        <div className="w-10 h-10 rounded-full border-2 border-border" style={{ background: getCharColor(char) }} />
        <div>
          <p className="font-heading text-xs text-foreground">{char.name}</p>
          <p className="text-[8px] text-muted-foreground">{char.powerTitle || char.power}</p>
        </div>
      </div>
      <p className="text-[7px] font-heading mb-1" style={{ color: eraInfo?.accent }}>{eraInfo?.name}</p>
      <div className="grid grid-cols-1 gap-0.5">
        {STAT_KEYS.map(k => (
          <div key={k} className="flex items-center gap-1">
            <span className="text-[7px] font-heading text-muted-foreground w-12 uppercase">{k}</span>
            <div className="flex-1 h-1.5 bg-muted rounded">
              <div className="h-full rounded" style={{ width: `${((stats[k]||0)/10)*100}%`, background: eraInfo?.accent || '#888' }} />
            </div>
            <span className="text-[7px] font-heading text-foreground w-4 text-right">{stats[k]||0}</span>
          </div>
        ))}
      </div>
      <p className="text-[7px] font-heading text-accent mt-1">TOTAL: {totalStats(char)}</p>
    </div>
  );
}

function CharInfoPanel({ char, eraInfo }) {
  if (!char) return null;
  const stats = char.stats || {};
  const desc = char.powerDescription || char.lore || '';
  return (
    <div className="flex-[2] min-w-[200px] bg-card border-2 border-accent rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full border-2 border-border" style={{ background: getCharColor(char) }} />
        <div>
          <p className="font-heading text-sm text-accent">{char.name}</p>
          <p className="text-[8px] text-muted-foreground">{char.title}</p>
        </div>
      </div>
      <p className="text-[7px] font-heading mb-1" style={{ color: eraInfo?.accent }}>{eraInfo?.name} — {eraInfo?.subtitle}</p>
      <p className="text-[8px] font-heading text-primary mb-0.5">POWER: {char.powerTitle || char.power}</p>
      <p className="text-[8px] font-body text-foreground mb-1 line-clamp-2">{desc.slice(0, 120)}{desc.length > 120 ? '...' : ''}</p>
      <div className="grid grid-cols-1 gap-0.5">
        {STAT_KEYS.map(k => (
          <div key={k} className="flex items-center gap-1">
            <span className="text-[7px] font-heading text-muted-foreground w-12 uppercase">{k}</span>
            <div className="flex-1 h-1.5 bg-muted rounded">
              <div className="h-full rounded" style={{ width: `${((stats[k]||0)/10)*100}%`, background: eraInfo?.accent || '#888' }} />
            </div>
            <span className="text-[7px] font-heading text-foreground w-4 text-right">{stats[k]||0}</span>
          </div>
        ))}
      </div>
      <p className="text-[7px] font-heading text-accent mt-1">TOTAL: {totalStats(char)}</p>
    </div>
  );
}