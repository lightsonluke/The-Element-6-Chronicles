import React, { useState, useMemo } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { ERA_OPTIONS, ALIGNMENTS, getPowerName, filterCharacters, sortByEra } from './charSelectHelpers.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

function TeamSlot({ char, index, active, filled, onClick, onClear, label, accent }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-heading text-muted-foreground">{label} #{index + 1}</span>
      <button
        onClick={onClick}
        className={`relative rounded-lg border-2 p-1 flex flex-col items-center transition w-16 h-20 ${active ? 'scale-105' : 'hover:scale-105'}`}
        style={{ borderColor: active ? accent : filled ? char?.color || 'var(--border)' : 'var(--border)', backgroundColor: active ? `${accent}22` : 'transparent' }}
      >
        {filled ? (
          <>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: char.color, boxShadow: `0 0 6px ${char.color}55` }}>
              <span className="font-heading text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{(char.name || '?')[0]}</span>
            </div>
            <span className="text-[7px] font-heading text-foreground leading-tight text-center px-0.5 truncate w-full">{char.name}</span>
            <span className="text-[6px] text-muted-foreground leading-none truncate w-full text-center">{getPowerName(char)}</span>
            <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute -top-1 -right-1 text-[8px] text-muted-foreground hover:text-destructive bg-card rounded-full w-4 h-4 flex items-center justify-center border border-border"><GameIcon emoji="✕" size={14} /></button>
          </>
        ) : (
          <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
            <span className="text-lg text-muted-foreground/40">+</span>
          </div>
        )}
      </button>
    </div>
  );
}

export default function ShapeshiftSelect({
  onStart, onBack,
  unlockedIds = ['yellow'], favoriteId,
  defaultCPUDifficulty = 'regular',
  customCharsData = {},
  ownedCrossovers = [],
}) {
  const allChars = useMemo(() => sortByEra([...ALL_CHARS, ...Object.values(customCharsData || {})]), [customCharsData]);
  const unlockedSet = new Set([...unlockedIds, ...ownedCrossovers]);

  const [p1Team, setP1Team] = useState([favoriteId && unlockedSet.has(favoriteId) ? favoriteId : 'yellow', null, null]);
  const [p2Team, setP2Team] = useState([null, null, null]);
  const [activeSlot, setActiveSlot] = useState({ player: 1, index: 1 }); // which slot we're filling
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [cpuDifficulty, setCpuDifficulty] = useState(defaultCPUDifficulty);
  const [p1Element, setP1Element] = useState('basic');
  const [p2Element, setP2Element] = useState('basic');

  const [era, setEra] = useState('all');
  const [alignment, setAlignment] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = filterCharacters(allChars, { era, alignment });
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || getPowerName(c).toLowerCase().includes(q));
    }
    return result;
  }, [allChars, era, alignment, search]);

  const getChar = (id) => allChars.find(c => c.id === id);

  const handlePickChar = (id) => {
    if (!unlockedSet.has(id)) return;
    sfx.click();
    const { player, index } = activeSlot;
    if (player === 1) {
      setP1Team(prev => { const n = [...prev]; n[index] = id; return n; });
    } else {
      setP2Team(prev => { const n = [...prev]; n[index] = id; return n; });
    }
    // Auto-advance to next empty slot
    advanceSlot(player, index);
  };

  const advanceSlot = (player, justFilled) => {
    const team = player === 1 ? p1Team : p2Team;
    // Find next empty slot in same team
    for (let i = 1; i <= 3; i++) {
      const idx = (justFilled + i) % 3;
      if (!team[idx]) { setActiveSlot({ player, index: idx }); return; }
    }
    // All filled — switch to other player's first empty slot
    const otherTeam = player === 1 ? p2Team : p1Team;
    const otherPlayer = player === 1 ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      if (!otherTeam[i]) { setActiveSlot({ player: otherPlayer, index: i }); return; }
    }
  };

  const clearSlot = (player, index) => {
    if (player === 1) setP1Team(prev => { const n = [...prev]; n[index] = null; return n; });
    else setP2Team(prev => { const n = [...prev]; n[index] = null; return n; });
    setActiveSlot({ player, index });
  };

  const randomFill = (player) => {
    const pool = allChars.filter(c => unlockedSet.has(c.id) && c.id !== 'evil' && c.baseCharId !== 'evil');
    if (pool.length === 0) return;
    const shuffle = [...pool].sort(() => Math.random() - 0.5);
    // If pool is smaller than 3, repeat from the pool so all slots are unlocked
    const pick = (i) => shuffle[i % shuffle.length].id;
    const team = [pick(0), pick(1), pick(2)];
    if (player === 1) setP1Team(team);
    else setP2Team(team);
  };

  const p1Ready = p1Team.every(id => id);
  const p2Ready = p2Team.every(id => id);

  const handleStart = () => {
    if (!p1Ready || !p2Ready) return;
    sfx.click();
    onStart(p1Team, p2Team, p2IsCPU, cpuDifficulty, p1Element, p2Element);
  };

  return (
    <div className="w-full max-w-5xl flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-primary tracking-wider">SHAPESHIFT MODE</h2>
          <p className="text-xs text-muted-foreground font-body">Pick 3 fighters per team. Press SUPER in-game to morph — stocks & damage persist, supers disabled.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      {/* Team panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* P1 Team */}
        <div className="bg-card border-2 rounded-xl p-3" style={{ borderColor: activeSlot.player === 1 ? '#FFD700' : 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading text-sm text-accent">PLAYER 1 TEAM</span>
            <button onClick={() => randomFill(1)} className="text-[10px] px-2 py-0.5 bg-primary/30 rounded font-heading hover:bg-primary/50">RANDOM</button>
          </div>
          <div className="flex gap-2 justify-center">
            {p1Team.map((id, i) => (
              <TeamSlot key={i} char={getChar(id)} index={i} filled={!!id}
                active={activeSlot.player === 1 && activeSlot.index === i}
                accent="#FFD700" label="FIGHTER"
                onClick={() => setActiveSlot({ player: 1, index: i })}
                onClear={() => clearSlot(1, i)} />
            ))}
          </div>
        </div>

        {/* P2 Team */}
        <div className="bg-card border-2 rounded-xl p-3" style={{ borderColor: activeSlot.player === 2 ? '#9944CC' : 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading text-sm" style={{ color: '#9944CC' }}>PLAYER 2 TEAM</span>
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-1 text-[10px] font-heading text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={p2IsCPU} onChange={e => setP2IsCPU(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
                CPU
              </label>
              <button onClick={() => randomFill(2)} className="text-[10px] px-2 py-0.5 bg-primary/30 rounded font-heading hover:bg-primary/50">RANDOM</button>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            {p2Team.map((id, i) => (
              <TeamSlot key={i} char={getChar(id)} index={i} filled={!!id}
                active={activeSlot.player === 2 && activeSlot.index === i}
                accent="#9944CC" label="FIGHTER"
                onClick={() => setActiveSlot({ player: 2, index: i })}
                onClear={() => clearSlot(2, i)} />
            ))}
          </div>
          {p2IsCPU && (
            <div className="flex items-center gap-2 mt-2 justify-center">
              <span className="text-[10px] font-heading text-muted-foreground">CPU:</span>
              <select value={cpuDifficulty} onChange={e => setCpuDifficulty(e.target.value)} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-heading border border-border">
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card/60 border border-border rounded-xl p-2">
        <select value={era} onChange={e => setEra(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-[10px] font-heading border border-border">
          {ERA_OPTIONS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={alignment} onChange={e => setAlignment(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-[10px] font-heading border border-border">
          {ALIGNMENTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body w-32" />
        <div className="flex-1" />
        <span className="text-[10px] font-heading text-muted-foreground">
          Filling: <span style={{ color: activeSlot.player === 1 ? '#FFD700' : '#9944CC' }}>P{activeSlot.player} SLOT {activeSlot.index + 1}</span>
        </span>
      </div>

      {/* Character grid */}
      <div className="bg-card/40 border border-border rounded-xl p-2">
        <div className="grid gap-1.5 overflow-y-auto max-h-[260px] p-1"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))' }}>
          {filtered.map(c => {
            const locked = !unlockedSet.has(c.id) && !c.isCustom;
            const selectedP1 = p1Team.includes(c.id);
            const selectedP2 = p2Team.includes(c.id);
            const initial = (c.name || '?')[0] || '?';
            const circleStyle = c.splitColor
              ? { background: `linear-gradient(135deg, ${c.color} 50%, ${c.secondaryColor} 50%)` }
              : { backgroundColor: c.color || '#888' };
            return (
              <button key={c.id} disabled={locked} onClick={() => handlePickChar(c.id)}
                className={`relative flex flex-col items-center rounded-md border-2 transition ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                style={{ borderColor: selectedP1 ? '#FFD700' : selectedP2 ? '#9944CC' : 'transparent', backgroundColor: selectedP1 ? 'rgba(255,215,0,0.12)' : selectedP2 ? 'rgba(153,68,204,0.12)' : 'transparent', padding: '2px 1px' }}>
                {c.id === favoriteId && !locked && <span className="absolute top-0 left-0.5 text-[7px] text-accent leading-none"><GameIcon emoji="★" size={14} /></span>}
                {locked && <span className="absolute top-0 right-0.5 text-[6px] leading-none opacity-60"><GameIcon emoji="🔒" size={14} /></span>}
                <div className="rounded-full flex items-center justify-center" style={{ ...circleStyle, width: 28, height: 28, boxShadow: locked ? 'none' : `0 0 5px ${c.color}55` }}>
                  <span className="font-heading text-[10px] font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{initial}</span>
                </div>
                <span className="text-[6px] font-heading text-foreground leading-none truncate" style={{ maxWidth: 52 }}>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button onClick={handleStart} disabled={!p1Ready || !p2Ready}
          className={`px-10 py-3 rounded-lg font-heading text-lg transition ${p1Ready && p2Ready ? 'bg-primary text-primary-foreground hover:opacity-80 shadow-lg' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}>
          {p1Ready && p2Ready ? '▶ START SHAPESHIFT' : 'FILL ALL 6 SLOTS'}
        </button>
      </div>
    </div>
  );
}