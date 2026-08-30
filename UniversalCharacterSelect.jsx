import db from './localBackend';

import React, { useState, useEffect, useMemo } from 'react';

import { ALL_CHARS, ALL_CHARS_MAP } from './allCharacters.js';
import { getCharLevelData, getUnlockedElements, applyElement, ELEMENTS } from './elements.js';
import { CROSSOVERS, crossoversForChar } from './crossovers.js';
import { SHIKIGAMI } from './shikigami.js';
import { ACCESSORIES, getEquippedAccessoryIds } from './cosmetics.js';
import { sfx } from './sfx.js';
import { ERA_OPTIONS, ALIGNMENTS, getAlignment, getEraAccent, getEraLabel, getPowerName, filterCharacters, sortByEra, STAT_KEYS, getStatTotal, getRealName, getNameColor } from './charSelectHelpers.js';
import CharacterPedestal from './CharacterPedestal.jsx';
import { getMasteryRankForChar, getMasteryProgress } from './mastery.js';
import GameIcon from "./GameIcon.jsx";

const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

// Compact initial-circle tile
function Tile({ char, selected, isP1, isP2, locked, favorite, equippedCX, masteryRank, onClick, onHover, onLeave, onContextMenu }) {
  const border = selected ? (isP1 ? '#FFD700' : '#9944CC') : '';
  const initial = (char.name || '?')[0] || '?';
  const circleStyle = char.splitColor
    ? { background: `linear-gradient(135deg, ${char.color} 50%, ${char.secondaryColor} 50%)` }
    : { backgroundColor: char.color || '#888' };
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="relative flex flex-col items-center rounded-md border-2 transition hover:scale-105"
      style={{
        borderColor: border || (locked ? 'var(--border)' : 'transparent'),
        backgroundColor: selected ? (isP1 ? 'rgba(255,215,0,0.12)' : 'rgba(153,68,204,0.12)') : 'transparent',
        opacity: locked ? 0.45 : 1,
        padding: '2px 1px',
      }}
      title={locked ? `${char.name} (locked)` : `${char.name} (right-click to favorite)`}
    >
      {favorite && !locked && <span className="absolute top-0 left-0.5 text-[7px] text-accent leading-none" style={{ filter: 'drop-shadow(0 0 3px #FFD700)' }}><GameIcon emoji="★" size={14} /></span>}
      {equippedCX && !locked && <span className="absolute top-0 right-0.5 text-[6px] leading-none"><GameIcon emoji="🔀" size={14} /></span>}
      {locked && <span className="absolute top-0 right-0.5 text-[6px] leading-none opacity-60"><GameIcon emoji="🔒" size={14} /></span>}
      {masteryRank && masteryRank.id > 0 && !locked && (
        <span className="absolute bottom-0.5 right-0 text-[8px] leading-none" style={{ filter: `drop-shadow(0 0 2px ${masteryRank.color})` }} title={`${masteryRank.name} Mastery`}>
          {masteryRank.icon}
        </span>
      )}
      <div className="rounded-full flex items-center justify-center" style={{ ...circleStyle, width: 30, height: 30, boxShadow: locked ? 'none' : `0 0 5px ${char.color}55` }}>
        <span className="font-heading text-[11px] font-bold" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{initial}</span>
      </div>
      <span className="text-[6px] font-heading text-foreground leading-none truncate" style={{ maxWidth: 42 }}>{char.name}</span>
    </button>
  );
}

// Era dropdown
function EraDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = ERA_OPTIONS.find(e => e.id === value) || ERA_OPTIONS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 px-2 py-1 bg-card border rounded font-heading text-[10px]" style={{ borderColor: current.accent + '66' }}>
        <span style={{ color: current.accent }}>{current.short}</span>
        <span className="text-[7px] text-muted-foreground"><GameIcon emoji="▼" size={14} /></span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-0.5 z-50 bg-card border-2 border-border rounded-lg shadow-2xl min-w-[160px]">
            {ERA_OPTIONS.map(e => (
              <button key={e.id} onClick={() => { onChange(e.id); setOpen(false); }}
                className="w-full text-left px-2 py-1 hover:bg-muted/50 font-heading text-[10px] flex items-center gap-1.5"
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

// Stat popup for hovered/locked chars
function StatPopup({ char, locked, charMastery }) {
  if (!char) return null;
  const eraAccent = getEraAccent(char);
  const statTotal = getStatTotal(char.stats || {});
  return (
    <div className="bg-card border rounded-lg p-2 shadow-xl" style={{ borderColor: eraAccent + '44' }}>
      <p className="font-heading text-xs leading-tight" style={{ color: getNameColor(char) }}>{char.name}</p>
      {getRealName(char) && <p className="text-[8px] text-muted-foreground">{getRealName(char)}</p>}
      <p className="text-[7px] text-muted-foreground italic mb-1">"{char.title}"</p>
      <div className="flex gap-2 text-[7px] font-heading mb-1">
        <span style={{ color: eraAccent }}>{getEraLabel(char)}</span>
        <span className="text-foreground">{getAlignment(char)}</span>
        <span style={{ color: char.color }}>{getPowerName(char)}</span>
      </div>
      <div className="space-y-0.5">
        {STAT_KEYS.map(stat => {
          const val = char.stats?.[stat] || 0;
          return (
            <div key={stat} className="flex items-center gap-1">
              <span className="text-[6px] font-heading text-muted-foreground w-10 uppercase">{stat}</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: char.color }} />
              </div>
              <span className="text-[6px] font-heading w-3 text-right text-foreground">{val}</span>
            </div>
          );
        })}
        <div className="flex justify-between border-t border-border pt-0.5">
          <span className="text-[6px] font-heading text-muted-foreground">TOTAL</span>
          <span className="text-[7px] font-heading text-accent">{statTotal}/35</span>
        </div>
      </div>
      {locked && <p className="text-[7px] text-destructive font-heading mt-1 text-center"><GameIcon emoji="🔒" size={14} /> LOCKED — unlock in Shop</p>}
      {/* Mastery rank + progress bar */}
      {!locked && charMastery && char.id && (() => {
        const mp = getMasteryProgress(charMastery, char.id);
        if (mp.rank.id === 0 && mp.score === 0) return null;
        return (
          <div className="mt-1.5 pt-1 border-t border-border">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[7px] font-heading" style={{ color: mp.rank.color }}>{mp.rank.icon} {mp.rank.name}</span>
              {mp.nextRank && <span className="text-[6px] text-muted-foreground ml-auto">{mp.score}/{mp.nextRank.minScore}</span>}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${mp.progress * 100}%`, backgroundColor: mp.rank.color }} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Crossover section
function CrossoverSection({ ownedCrossovers, equippedCrossovers, onEquipCrossover, selectedCharId }) {
  const [tab, setTab] = useState('all');
  const [expanded, setExpanded] = useState(false);

  // Group crossovers by character
  const allCX = useMemo(() => CROSSOVERS, []);
  const owned = allCX.filter(cx => (ownedCrossovers || []).includes(cx.id));
  if (owned.length === 0) return null;

  // "all" shows all owned crossovers; per-char shows crossovers for the selected character
  const shown = tab === 'all' ? owned : crossoversForChar(selectedCharId).filter(cx => (ownedCrossovers || []).includes(cx.id));

  return (
    <div className="bg-card/50 border border-border rounded-lg p-1.5">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => setExpanded(e => !e)} className="text-[9px] font-heading text-accent"><GameIcon emoji="🔀" size={14} /> CROSSOVERS {expanded ? <GameIcon emoji="▼" size={14} /> : <GameIcon emoji="▶" size={14} />}</button>
        <div className="flex gap-1">
          <button onClick={() => setTab('all')} className={`px-1.5 py-0.5 rounded text-[8px] font-heading ${tab === 'all' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>ALL</button>
          <button onClick={() => setTab('char')} className={`px-1.5 py-0.5 rounded text-[8px] font-heading ${tab === 'char' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>THIS CHAR</button>
        </div>
        {expanded && <span className="text-[7px] text-muted-foreground ml-auto">{shown.length} owned</span>}
      </div>
      {expanded && (
        <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
          {shown.length === 0 && tab === 'char' && <span className="text-[7px] text-muted-foreground">No crossovers for this character.</span>}
          {shown.map(cx => {
            const equipped = equippedCrossovers?.[cx.charId] === cx.id;
            const cxChar = ALL_CHARS.find(c => c.id === cx.charId);
            return (
              <button key={cx.id} onClick={() => onEquipCrossover?.(cx.charId, equipped ? null : cx.id)}
                className={`flex items-center gap-1 rounded px-1 py-0.5 border ${equipped ? 'border-accent bg-accent/20' : 'border-border'}`}
                title={`${cx.name} (${cxChar?.name})`}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cx.colorMap.primary }} />
                <span className="text-[7px] font-heading text-foreground">{cx.name}</span>
                {equipped && <span className="text-[7px] text-accent"><GameIcon emoji="✓" size={14} /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Accessory equip section — shows ONLY owned accessories for the selected character.
// Toggle to equip/unequip; up to 4 may be equipped at once (enforced in Game.jsx).
function AccessorySection({ ownedAccessories, equippedAccessories, onEquipAccessory, selectedCharId }) {
  const [expanded, setExpanded] = useState(false);
  const owned = useMemo(() => ACCESSORIES.filter(a => (ownedAccessories || []).includes(a.id)), [ownedAccessories]);
  if (owned.length === 0 || !onEquipAccessory || !selectedCharId) return null;
  const equippedIds = getEquippedAccessoryIds(equippedAccessories, selectedCharId);
  // Show owned accessories that are either generic or exclusive to this character
  const shown = owned.filter(a => !a.exclusiveTo || a.exclusiveTo === selectedCharId);
  if (shown.length === 0) return null;
  return (
    <div className="bg-card/50 border border-border rounded-lg p-1.5">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => setExpanded(e => !e)} className="text-[9px] font-heading text-accent"><GameIcon emoji="🎩" size={14} /> ACCESSORIES {expanded ? <GameIcon emoji="▼" size={14} /> : <GameIcon emoji="▶" size={14} />}</button>
        <span className="text-[7px] text-muted-foreground ml-auto">{equippedIds.length}/4 equipped · {shown.length} owned</span>
      </div>
      {expanded && (
        <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto">
          {shown.map(a => {
            const equipped = equippedIds.includes(a.id);
            return (
              <button key={a.id} onClick={() => onEquipAccessory(selectedCharId, a.id)} title={a.name}
                className={`flex items-center gap-1 rounded px-1 py-0.5 border ${equipped ? 'border-accent bg-accent/20' : 'border-border'}`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="text-[7px] font-heading text-foreground">{a.name}</span>
                {equipped && <span className="text-[7px] text-accent"><GameIcon emoji="✓" size={14} /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * UniversalCharacterSelect — the single character-select screen used across ALL game modes.
 *
 * Props:
 *  - title, modeLabel, startLabel
 *  - unlockedIds, favoriteId, customCharsData, customNumberMap
 *  - equippedSkins, equippedAccessories, charLevels, equippedElements, onEquipElement
 *  - ownedCrossovers, equippedCrossovers, onEquipCrossover
 *  - playerCount: 1 (single pick) or 2 (P1 + P2)
 *  - allowCPU: show VS CPU / VS PLAYER toggle (playerCount=2)
 *  - cpuOnly: force P2 = CPU (ranked)
 *  - defaultCPUDifficulty
 *  - onStart(p1, p2, p2IsCPU, difficulty, p1Element, p2Element)
 *  - onBack
 *  - extraControls: JSX for mode-specific controls (shown at bottom)
 *  - hidePedestals: skip pedestal row (for compact modes)
 */
export default function UniversalCharacterSelect({
  title = 'SELECT FIGHTERS',
  modeLabel = '',
  startLabel = 'START',
  unlockedIds = ['yellow'],
  favoriteId,
  customCharsData = {},
  equippedSkins = {},
  equippedAccessories = {},
  ownedAccessories = [],
  onEquipAccessory,
  charLevels = {},
  equippedElements = {},
  onEquipElement,
  ownedCrossovers = [],
  equippedCrossovers = {},
  onEquipCrossover,
  ownedShikigami = [],
  equippedShikigami = {},
  playerCount = 2,
  allowCPU = true,
  cpuOnly = false,
  rankedRandom = false,
  defaultCPUDifficulty = 'regular',
  onStart,
  onBack,
  extraControls,
  hidePedestals = false,
  banCustomChars = false,
  charMastery = {},
  allowLocked = false,
  teamMode = false,
}) {
  const unlockedSet = new Set(unlockedIds);

  const [customChars, setCustomChars] = useState([]);
  const [era, setEra] = useState('all');
  const [alignment, setAlignment] = useState('all');
  const [search, setSearch] = useState('');

  // Permanent favorites — up to 5, most recent first. Right-click to toggle.
  // Stored in localStorage so they persist across sessions without threading through parents.
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('element6_favorite_ids') || '[]'); } catch { return []; }
  });
  const toggleFavorite = (charId, e) => {
    if (e) e.preventDefault();
    setFavoriteIds(prev => {
      let next;
      if (prev.includes(charId)) {
        next = prev.filter(id => id !== charId);
      } else {
        next = [charId, ...prev].slice(0, 5); // max 5, most recent first
      }
      try { localStorage.setItem('element6_favorite_ids', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  // picks[0] = P1, picks[1] = P2, picks[2+] = additional players (sports modes)
  const [picks, setPicks] = useState(() => {
    const first = (favoriteId && unlockedSet.has(favoriteId)) ? favoriteId : 'yellow';
    const init = [first];
    for (let i = 1; i < playerCount; i++) {
      const pool = ALL_CHARS.filter(c => c.id !== 'evil' && !init.includes(c.id));
      init.push(pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : 'blue');
    }
    return init;
  });
  const [elements, setElements] = useState(() => {
    const p0Char = ALL_CHARS_MAP[picks[0]];
    const p0ElemId = p0Char?.isCrossover ? p0Char.baseCharId : picks[0];
    const els = [equippedElements?.[p0ElemId] || 'basic'];
    for (let i = 1; i < playerCount; i++) els.push('basic');
    return els;
  });
  // Match-temporary Shikigami selections (per player slot). Initialized from the
  // permanent equipped loadout; changes here apply ONLY to this match and never
  // overwrite the Equip-tab loadout.
  const [shikigami, setShikigami] = useState(() => picks.map(p => equippedShikigami?.[p] || null));
  useEffect(() => {
    setShikigami(picks.map(p => equippedShikigami?.[p] || null));
  }, [picks, equippedShikigami]);
  const [selecting, setSelecting] = useState(1);
  const [p2IsCPU, setP2IsCPU] = useState(true);
  const [difficulty, setDifficulty] = useState(defaultCPUDifficulty);
  const [hoveredId, setHoveredId] = useState(null);

  // Backward-compatible aliases
  const p1 = picks[0];
  const p2 = picks[1];
  const p1Element = elements[0];
  const p2Element = elements[1];

  // Load custom characters (unless banned for this mode)
  useEffect(() => {
    if (banCustomChars) { setCustomChars([]); return; }
    db.auth.me().then(async (me) => {
      const chars = await db.entities.CustomCharacter.filter({ owner_user_id: me.id });
      setCustomChars(chars.map(c => ({
        id: `custom_${c.id}`, name: c.name, color: c.color || '#FF6600',
        title: c.title || 'Custom', isSpirit: false, isCustom: true,
        stats: c.stats || { power: 5, speed: 5, defense: 5, utility: 5, control: 5 },
        power: c.power_name || 'Custom Power',
      })));
    }).catch(() => {});
  }, [banCustomChars]);

  const ALL_DISPLAY = useMemo(() => {
    const sorted = sortByEra([...ALL_CHARS, ...customChars]);
    // Favorites (most recent first) go to the top, then the single favoriteId
    if (favoriteIds.length === 0 && !favoriteId) return sorted;
    const favs = [];
    for (const fid of favoriteIds) {
      const c = sorted.find(c => c.id === fid);
      if (c) favs.push(c);
    }
    if (favoriteId && !favoriteIds.includes(favoriteId)) {
      const fav = sorted.find(c => c.id === favoriteId);
      if (fav) favs.unshift(fav);
    }
    if (favs.length === 0) return sorted;
    const favSet = new Set(favs.map(c => c.id));
    return [...favs, ...sorted.filter(c => !favSet.has(c.id))];
  }, [customChars, favoriteId, favoriteIds]);

  // When P2 is CPU, randomize
  useEffect(() => {
    if (playerCount === 2 && p2IsCPU) {
      const pool = ALL_CHARS.filter(c => c.id !== p1 && c.id !== favoriteId && c.id !== 'evil');
      if (pool.length > 0) setPicks(prev => { const next = [...prev]; next[1] = pool[Math.floor(Math.random() * pool.length)].id; return next; });
    }
  }, [p2IsCPU]);

  useEffect(() => {
    const p1Char = ALL_CHARS_MAP[p1];
    const elemId = p1Char?.isCrossover ? p1Char.baseCharId : p1;
    setElements(prev => { const next = [...prev]; next[0] = equippedElements?.[elemId] || 'basic'; return next; });
  }, [p1, equippedElements]);
  useEffect(() => {
    const p2Char = ALL_CHARS_MAP[p2];
    const elemId = p2Char?.isCrossover ? p2Char.baseCharId : p2;
    setElements(prev => {
      const next = [...prev];
      if (playerCount === 2 && !p2IsCPU) next[1] = equippedElements?.[elemId] || 'basic';
      else next[1] = 'basic';
      return next;
    });
  }, [p2, p2IsCPU, equippedElements, playerCount]);

  if (cpuOnly && !p2IsCPU) setP2IsCPU(true);

  const filtered = useMemo(() => {
    let result = filterCharacters(ALL_DISPLAY, { era, alignment });
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || getPowerName(c).toLowerCase().includes(q));
    }
    return result;
  }, [ALL_DISPLAY, era, alignment, search]);

  const p1Char = ALL_DISPLAY.find(c => c.id === p1);
  const p2Char = ALL_DISPLAY.find(c => c.id === p2);
  const hoveredChar = hoveredId ? ALL_DISPLAY.find(c => c.id === hoveredId) : null;

  const handleSelect = (charId) => {
    sfx.click();
    if (playerCount === 1 || rankedRandom) { setPicks(prev => { const next = [...prev]; next[0] = charId; return next; }); return; }
    setPicks(prev => { const next = [...prev]; next[selecting - 1] = charId; return next; });
  };

  const handleEquipElement = (elId) => {
    const idx = selecting - 1;
    setElements(prev => { const next = [...prev]; next[idx] = elId; return next; });
    const pickChar = ALL_CHARS_MAP[picks[idx]];
    const equipId = pickChar?.isCrossover ? pickChar.baseCharId : picks[idx];
    onEquipElement?.(equipId, elId);
  };

  // Validation: can't start if selected char is locked (training mode allows all)
  const p1Locked = !allowLocked && !unlockedSet.has(p1) && !p1Char?.isCustom;
  // CPU/bot slots are never blocked by the human account's unlock inventory.
  // Only an actual human-controlled selection can fail the unlock check.
  const p2Locked = !allowLocked && playerCount === 2 && !p2IsCPU && !unlockedSet.has(p2) && !p2Char?.isCustom;
  const canStart = !p1Locked && !p2Locked;

  const handleStart = () => {
    if (!canStart) { sfx.warning(); return; }
    sfx.matchFound();
    // Build the match-temporary Shikigami override map (only non-null choices).
    const shikigamiOverride = {};
    picks.forEach((p, i) => { if (shikigami[i]) shikigamiOverride[p] = shikigami[i]; });
    // Pass all picks; extra picks (P3+) are appended after the standard 6 args.
    // Shikigami override map is always the final argument.
    onStart?.(p1, p2, playerCount >= 2 ? p2IsCPU : true, difficulty, p1Element, p2Element, ...picks.slice(2), shikigamiOverride);
  };
  const handlePickShikigami = (id) => {
    const idx = (playerCount === 1 || rankedRandom) ? 0 : selecting - 1;
    setShikigami(prev => { const next = [...prev]; next[idx] = id; return next; });
    sfx.click();
  };

  const selectedIds = playerCount === 1 || rankedRandom ? [p1] : picks.slice(0, playerCount);

  return (
    <div className="flex flex-col gap-2 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading text-foreground tracking-wider">{title}</h2>
        <div className="flex gap-2 items-center">
          {playerCount === 2 && allowCPU && !cpuOnly && (
            <>
              <button onClick={() => setP2IsCPU(false)} className={`px-2 py-1 rounded font-heading text-[10px] ${!p2IsCPU ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>VS P2</button>
              <button onClick={() => setP2IsCPU(true)} className={`px-2 py-1 rounded font-heading text-[10px] ${p2IsCPU ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>VS CPU</button>
            </>
          )}
          {p2IsCPU && playerCount === 2 && !rankedRandom && (
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-1.5 py-1 bg-secondary text-secondary-foreground rounded text-[10px] font-body">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
            </select>
          )}
          {rankedRandom && <span className="text-[9px] text-muted-foreground"><GameIcon emoji="🔒" size={14} /> P2: Random</span>}
          <button onClick={onBack} className="px-2 py-1 bg-muted text-muted-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      {/* Player selector toggle */}
      {playerCount >= 2 && !rankedRandom && (
        <div className="flex gap-1.5 items-center flex-wrap">
          {Array.from({ length: playerCount }).map((_, i) => (
            <button key={i} onClick={() => setSelecting(i + 1)} className={`px-2.5 py-1 rounded font-heading text-[10px] ${selecting === i + 1 ? (i === 0 ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground') : 'bg-secondary text-secondary-foreground'}`}>
              {i === 0 ? 'P1' : i === 1 ? (p2IsCPU ? 'CPU' : 'P2') : `P${i + 1}`}
            </button>
          ))}
          <button onClick={() => {
            const pool = ALL_CHARS.filter(c => unlockedSet.has(c.id));
            if (pool.length === 0) return;
            const random = pool[Math.floor(Math.random() * pool.length)].id;
            sfx.click();
            setPicks(prev => { const next = [...prev]; next[selecting - 1] = random; return next; });
          }} className="px-2 py-1 rounded font-heading text-[10px] bg-primary/40 text-primary-foreground"><GameIcon emoji="🎲" size={14} /> RANDOM</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 bg-card/60 border border-border rounded-lg p-1.5">
        <EraDropdown value={era} onChange={setEra} />
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-0.5">
          {ALIGNMENTS.map(a => (
            <button key={a.id} onClick={() => { sfx.click(); setAlignment(a.id); }}
              className="px-1.5 py-0.5 rounded text-[8px] font-heading"
              style={alignment === a.id ? { backgroundColor: 'var(--primary)', color: '#fff' } : { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-body w-24" />
      </div>

      {/* Main: grid + stat popup */}
      <div className="flex gap-2">
        <div className="flex-1 bg-card/40 border border-border rounded-lg p-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <div className="text-[8px] font-heading text-muted-foreground">{filtered.length} characters</div>
            <div className="text-[7px] font-heading text-accent"><GameIcon emoji="★" size={14} /> {favoriteIds.length}/5 FAVORITES (right-click)</div>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))' }}>
            {filtered.map(c => {
              const selected = selectedIds.includes(c.id);
              const locked = !allowLocked && !unlockedSet.has(c.id) && !c.isCustom;
              const hasCX = crossoversForChar(c.id).length > 0 && (ownedCrossovers || []).some(id => crossoversForChar(c.id).find(cx => cx.id === id));
              return (
                <Tile key={c.id} char={c}
                  selected={selected}
                  isP1={selectedIds[0] === c.id}
                  isP2={selectedIds[1] === c.id}
                  locked={locked}
                  favorite={favoriteIds.includes(c.id) || c.id === favoriteId}
                  equippedCX={equippedCrossovers?.[c.id]}
                  masteryRank={getMasteryRankForChar(charMastery, c.id)}
                  onClick={() => handleSelect(c.id)}
                  onHover={() => setHoveredId(c.id)}
                  onLeave={() => setHoveredId(null)}
                  onContextMenu={(e) => toggleFavorite(c.id, e)}
                />
              );
            })}
            {filtered.length === 0 && <div className="col-span-full text-center text-[10px] text-muted-foreground py-4">No characters match.</div>}
          </div>
        </div>
        {/* Stat popup (replaces the old right panel — compact, only on hover) */}
        <div className="w-[170px] flex-shrink-0">
          <StatPopup char={hoveredChar || (selecting === 1 ? p1Char : p2Char)} locked={hoveredChar ? (!allowLocked && !unlockedSet.has(hoveredChar.id) && !hoveredChar.isCustom) : false} charMastery={charMastery} />
        </div>
      </div>

      <AccessorySection
        ownedAccessories={ownedAccessories}
        equippedAccessories={equippedAccessories}
        onEquipAccessory={onEquipAccessory}
        selectedCharId={picks[selecting - 1]}
      />

      {/* Shikigami section (match-temporary) */}
      {ownedShikigami.length > 0 && (
        <div className="bg-card/50 border border-border rounded-lg p-1.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-heading text-accent">🪶 SHIKIGAMI (this match)</span>
            <span className="text-[7px] text-muted-foreground ml-auto">P{selecting}: {shikigami[(playerCount === 1 || rankedRandom) ? 0 : selecting - 1] || 'none'}</span>
          </div>
          <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
            <button onClick={() => handlePickShikigami(null)} className={`px-1.5 py-0.5 rounded text-[8px] font-heading border-2 ${!shikigami[(playerCount === 1 || rankedRandom) ? 0 : selecting - 1] ? 'border-accent bg-accent/20' : 'border-border bg-secondary text-secondary-foreground'}`}>NONE</button>
            {SHIKIGAMI.filter(s => ownedShikigami.includes(s.id)).map(s => {
              const cur = shikigami[(playerCount === 1 || rankedRandom) ? 0 : selecting - 1];
              return (
                <button key={s.id} onClick={() => handlePickShikigami(s.id)} title={s.name}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-heading border-2 ${cur === s.id ? 'border-accent bg-accent/20' : 'border-border bg-secondary text-secondary-foreground'}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pedestals */}
      {!hidePedestals && (
        <div className="flex gap-2 justify-center items-end pt-1 border-t border-border flex-wrap">
          {teamMode && playerCount > 2 ? (
            <>
              {/* Team 1: picks[0], picks[2], picks[4], ... */}
              <div className="flex gap-1.5 items-end">
                <span className="text-[8px] font-heading text-primary pb-8 self-center">TEAM 1</span>
                {picks.filter((_, i) => i % 2 === 0).map((pickId, ti) => {
                  const playerNum = ti * 2 + 1;
                  const pickChar = ALL_DISPLAY.find(c => c.id === pickId);
                  return (
                    <CharacterPedestal key={playerNum} char={pickChar} playerId={playerNum} isActive={selecting === playerNum}
                      element={elements[playerNum - 1] || 'basic'}
                      onEquipElement={handleEquipElement} charLevels={charLevels} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} compact />
                  );
                })}
              </div>
              <span className="text-xl font-heading text-destructive pb-8">VS</span>
              {/* Team 2: picks[1], picks[3], picks[5], ... */}
              <div className="flex gap-1.5 items-end">
                {picks.filter((_, i) => i % 2 === 1).map((pickId, ti) => {
                  const playerNum = ti * 2 + 2;
                  const pickChar = ALL_DISPLAY.find(c => c.id === pickId);
                  return (
                    <CharacterPedestal key={playerNum} char={pickChar} playerId={playerNum} isActive={selecting === playerNum}
                      element={elements[playerNum - 1] || 'basic'}
                      onEquipElement={handleEquipElement} charLevels={charLevels} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} compact />
                  );
                })}
                <span className="text-[8px] font-heading text-destructive pb-8 self-center">TEAM 2</span>
              </div>
            </>
          ) : (
            <>
              <CharacterPedestal char={p1Char} playerId={1} isActive={selecting === 1} element={p1Element}
                onEquipElement={handleEquipElement} charLevels={charLevels} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} shikigamiId={shikigami[0]} compact />
              {playerCount >= 2 && (
                <>
                  <span className="text-xl font-heading text-destructive pb-8">VS</span>
                  {rankedRandom ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-2 min-w-[120px] h-[180px]">
                      <div className="text-2xl text-muted-foreground mb-1">?</div>
                      <p className="text-[8px] font-heading text-muted-foreground">P2 RANDOM</p>
                    </div>
                  ) : (
                    <CharacterPedestal char={p2Char} playerId={2} isActive={selecting === 2} isCPU={p2IsCPU} element={p2Element}
                      onEquipElement={handleEquipElement} charLevels={charLevels} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} shikigamiId={shikigami[1]} compact />
                  )}
                </>
              )}
              {/* Additional players (P3+) for sport modes with 3+ player selection */}
              {playerCount > 2 && picks.slice(2).map((pickId, i) => {
                const playerNum = i + 3;
                const pickChar = ALL_DISPLAY.find(c => c.id === pickId);
                return (
                  <React.Fragment key={playerNum}>
                    <span className="text-lg font-heading text-muted-foreground pb-8">+</span>
                    <CharacterPedestal char={pickChar} playerId={playerNum} isActive={selecting === playerNum} element={elements[i + 2] || 'basic'}
                      onEquipElement={handleEquipElement} charLevels={charLevels} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} shikigamiId={shikigami[i + 2]} compact />
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Extra controls (mode-specific) */}
      {extraControls}

      {/* Start button */}
      <div className="flex flex-col gap-1 items-center">
        {modeLabel && <p className="text-[9px] font-heading text-accent">{modeLabel}</p>}
        {p1Locked && <p className="text-[9px] text-destructive font-heading"><GameIcon emoji="⚠" size={14} /> P1 character is locked — unlock in Shop to use</p>}
        {p2Locked && <p className="text-[9px] text-destructive font-heading"><GameIcon emoji="⚠" size={14} /> P2 character is locked — unlock in Shop to use</p>}
        <button onClick={handleStart} disabled={!canStart}
          className={`px-8 py-2.5 rounded-lg font-heading text-base transition shadow-lg ${canStart ? 'bg-accent text-accent-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
          {startLabel}
        </button>
      </div>
    </div>
  );
}