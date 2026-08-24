import React, { useState, useMemo } from 'react';
import { ALL_CHARS, ALL_CHARS_MAP } from './allCharacters.js';
import { ERA_OPTIONS, ALIGNMENTS, getPowerName, filterCharacters, sortByEra } from './charSelectHelpers.js';
import { getCharLevelData, getUnlockedElements, ELEMENTS } from './elements.js';
import { SHIKIGAMI } from './shikigami.js';
import { ACCESSORIES, getEquippedAccessoryIds } from './cosmetics.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

/**
 * LANShapeshiftSelect — pick 3 fighters for LAN Shapeshift mode.
 * Each player picks all 3 manually (no auto-fill). Supports accessory,
 * Shikigami, skin, and element selection per character slot.
 */
export default function LANShapeshiftSelect({
  title = 'PICK YOUR SHAPESHIFT TEAM',
  startLabel = 'CREATE ROOM →',
  unlockedIds = ['yellow'],
  favoriteId,
  equippedSkins = {},
  equippedAccessories = {},
  ownedAccessories = [],
  onEquipAccessory,
  charLevels = {},
  equippedElements = {},
  onEquipElement,
  equippedShikigami = {},
  ownedShikigami = [],
  onStart,
  onBack,
}) {
  const unlockedSet = new Set(unlockedIds);
  const [team, setTeam] = useState(() => {
    const first = (favoriteId && unlockedSet.has(favoriteId)) ? favoriteId : 'yellow';
    return [first, null, null];
  });
  const [activeSlot, setActiveSlot] = useState(1);
  const [era, setEra] = useState('all');
  const [alignment, setAlignment] = useState('all');
  const [search, setSearch] = useState('');

  const allChars = useMemo(() => sortByEra([...ALL_CHARS]), []);
  const filtered = useMemo(() => {
    let result = filterCharacters(allChars, { era, alignment });
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || getPowerName(c).toLowerCase().includes(q));
    }
    return result;
  }, [allChars, era, alignment, search]);

  const activeCharId = team[activeSlot];
  const activeChar = activeCharId ? ALL_CHARS_MAP[activeCharId] : null;

  const handlePick = (id) => {
    if (!unlockedSet.has(id)) return;
    sfx.click();
    setTeam(prev => { const n = [...prev]; n[activeSlot] = id; return n; });
    // Auto-advance to next empty slot
    for (let i = 1; i <= 3; i++) {
      const idx = (activeSlot + i) % 3;
      if (!team[idx]) { setActiveSlot(idx); return; }
    }
  };

  const clearSlot = (i) => {
    setTeam(prev => { const n = [...prev]; n[i] = null; return n; });
    setActiveSlot(i);
  };

  const teamReady = team.every(id => id);

  const handleStart = () => {
    if (!teamReady) { sfx.warning(); return; }
    sfx.click();
    onStart(team);
  };

  // Element selection for active slot
  const activeElementId = activeCharId ? (activeChar.isCrossover ? activeChar.baseCharId : activeCharId) : null;
  const currentElement = activeElementId ? (equippedElements?.[activeElementId] || 'basic') : 'basic';
  const levelData = activeElementId ? getCharLevelData({ charLevels }, activeElementId) : null;
  const unlockedElems = levelData ? getUnlockedElements(levelData.level) : [];

  // Accessory selection for active slot
  const equippedAccIds = activeCharId ? getEquippedAccessoryIds(equippedAccessories, activeCharId) : [];
  const ownedAccs = useMemo(() => ACCESSORIES.filter(a => (ownedAccessories || []).includes(a.id)), [ownedAccessories]);
  const shownAccs = ownedAccs.filter(a => !a.exclusiveTo || a.exclusiveTo === activeCharId);

  // Shikigami for active slot
  const currentShikigami = activeCharId ? (equippedShikigami?.[activeCharId] || null) : null;
  const ownedShiks = SHIKIGAMI.filter(s => (ownedShikigami || []).includes(s.id));

  return (
    <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading text-foreground tracking-wider">{title}</h2>
        <button onClick={onBack} className="px-3 py-1.5 bg-muted text-muted-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      {/* Team slots */}
      <div className="flex gap-2 justify-center bg-card/50 border border-border rounded-lg p-2">
        {team.map((id, i) => {
          const char = id ? ALL_CHARS_MAP[id] : null;
          const isActive = activeSlot === i;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-heading text-muted-foreground">FIGHTER #{i + 1}</span>
              <button
                onClick={() => setActiveSlot(i)}
                className={`relative rounded-lg border-2 p-1 flex flex-col items-center transition w-16 h-20 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
                style={{ borderColor: isActive ? '#FFD700' : char ? char.color || 'var(--border)' : 'var(--border)', backgroundColor: isActive ? 'rgba(255,215,0,0.12)' : 'transparent' }}
              >
                {char ? (
                  <>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: char.color, boxShadow: `0 0 6px ${char.color}55` }}>
                      <span className="font-heading text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{(char.name || '?')[0]}</span>
                    </div>
                    <span className="text-[7px] font-heading text-foreground leading-tight text-center px-0.5 truncate w-full">{char.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); clearSlot(i); }} className="absolute -top-1 -right-1 text-[8px] text-muted-foreground hover:text-destructive bg-card rounded-full w-4 h-4 flex items-center justify-center border border-border"><GameIcon emoji="✕" size={14} /></button>
                  </>
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
                    <span className="text-lg text-muted-foreground/40">+</span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 bg-card/60 border border-border rounded-lg p-1.5">
        <select value={era} onChange={e => setEra(e.target.value)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-[10px] font-heading border border-border">
          {ERA_OPTIONS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
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

      {/* Main: grid + side panel */}
      <div className="flex gap-2">
        <div className="flex-1 bg-card/40 border border-border rounded-lg p-1.5">
          <div className="grid gap-1 overflow-y-auto max-h-[200px] p-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))' }}>
            {filtered.map(c => {
              const locked = !unlockedSet.has(c.id) && !c.isCustom;
              const selected = team.includes(c.id);
              const initial = (c.name || '?')[0] || '?';
              const circleStyle = c.splitColor
                ? { background: `linear-gradient(135deg, ${c.color} 50%, ${c.secondaryColor} 50%)` }
                : { backgroundColor: c.color || '#888' };
              return (
                <button key={c.id} disabled={locked} onClick={() => handlePick(c.id)}
                  className={`relative flex flex-col items-center rounded-md border-2 transition ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                  style={{ borderColor: selected ? '#FFD700' : 'transparent', backgroundColor: selected ? 'rgba(255,215,0,0.12)' : 'transparent', padding: '2px 1px' }}>
                  {locked && <span className="absolute top-0 right-0.5 text-[6px] leading-none opacity-60"><GameIcon emoji="🔒" size={14} /></span>}
                  <div className="rounded-full flex items-center justify-center" style={{ ...circleStyle, width: 30, height: 30, boxShadow: locked ? 'none' : `0 0 5px ${c.color}55` }}>
                    <span className="font-heading text-[11px] font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{initial}</span>
                  </div>
                  <span className="text-[6px] font-heading text-foreground leading-none truncate" style={{ maxWidth: 42 }}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel: element + accessory + shikigami for active slot */}
        <div className="w-[180px] flex-shrink-0 flex flex-col gap-2">
          {activeChar ? (
            <>
              <div className="bg-card border rounded-lg p-2" style={{ borderColor: activeChar.color + '44' }}>
                <p className="font-heading text-xs" style={{ color: activeChar.color }}>{activeChar.name}</p>
                <p className="text-[8px] text-muted-foreground italic">"{activeChar.title}"</p>
                {/* Element selection */}
                {unlockedElems.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-[7px] font-heading text-muted-foreground mb-0.5">ELEMENT (Lv {levelData.level})</p>
                    <div className="flex gap-1 flex-wrap">
                      {unlockedElems.map(el => (
                        <button key={el.id} onClick={() => onEquipElement?.(activeElementId, el.id)}
                          className="px-1.5 py-0.5 rounded text-[8px] font-heading text-white"
                          style={{ backgroundColor: currentElement === el.id ? (el.color || '#666') : 'rgba(128,128,128,0.3)' }}>
                          {el.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accessories */}
              {shownAccs.length > 0 && onEquipAccessory && (
                <div className="bg-card/50 border border-border rounded-lg p-1.5">
                  <p className="text-[9px] font-heading text-accent mb-1"><GameIcon emoji="🎩" size={14} /> ACCESSORIES ({equippedAccIds.length}/4)</p>
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
                    {shownAccs.map(a => {
                      const equipped = equippedAccIds.includes(a.id);
                      return (
                        <button key={a.id} onClick={() => onEquipAccessory(activeCharId, a.id)} title={a.name}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 border ${equipped ? 'border-accent bg-accent/20' : 'border-border'}`}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                          <span className="text-[7px] font-heading text-foreground">{a.name}</span>
                          {equipped && <span className="text-[7px] text-accent"><GameIcon emoji="✓" size={14} /></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shikigami */}
              {ownedShiks.length > 0 && (
                <div className="bg-card/50 border border-border rounded-lg p-1.5">
                  <p className="text-[9px] font-heading text-accent mb-1">🪶 SHIKIGAMI</p>
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
                    <button onClick={() => { /* shikigami equip is match-temporary in UCS; for LAN we use equipped */ }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-heading border-2 ${!currentShikigami ? 'border-accent bg-accent/20' : 'border-border bg-secondary text-secondary-foreground'}`}>NONE</button>
                    {ownedShiks.map(s => (
                      <span key={s.id} title={s.name}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-heading border-2 ${currentShikigami === s.id ? 'border-accent bg-accent/20' : 'border-border bg-secondary text-secondary-foreground'}`}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[7px] text-muted-foreground mt-0.5">Equipped from loadout</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card border border-border rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Pick a character for slot {activeSlot + 1}</p>
            </div>
          )}
        </div>
      </div>

      {/* Start button */}
      <div className="flex flex-col gap-1 items-center">
        <button onClick={handleStart} disabled={!teamReady}
          className={`px-8 py-2.5 rounded-lg font-heading text-base transition shadow-lg ${teamReady ? 'bg-accent text-accent-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
          {teamReady ? startLabel : 'FILL ALL 3 SLOTS'}
        </button>
      </div>
    </div>
  );
}