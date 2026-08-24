import db from './localBackend';

import React, { useState, useRef, useEffect, useCallback } from 'react';

import { sfx } from './sfx.js';
import { music } from './music.js';
import SoundButton from './SoundButton.jsx';
import { MAX_CUSTOM_CHARS } from './characterNumber.js';
import GameIcon from "./GameIcon.jsx";

const W = 240, H = 300;
const FILL = 'fill', ERASE = 'erase';

// Body part regions — laid out as a clean stick figure
const PARTS = [
  { id: 'head', name: 'Head', x: 95, y: 30, w: 50, h: 50 },
  { id: 'torso', name: 'Torso', x: 85, y: 85, w: 70, h: 65 },
  { id: 'armL', name: 'Left Arm', x: 60, y: 90, w: 25, h: 60 },
  { id: 'armR', name: 'Right Arm', x: 155, y: 90, w: 25, h: 60 },
  { id: 'legL', name: 'Left Leg', x: 95, y: 155, w: 25, h: 65 },
  { id: 'legR', name: 'Right Leg', x: 120, y: 155, w: 25, h: 65 },
];

const COLORS = [
  '#FF4D4D','#FF2222','#CC0000','#FF6600','#FF8800','#FFAA00',
  '#FFD700','#FFFF00','#CCEE00','#88DD00','#44AA44','#22BB22',
  '#00CC66','#00FFAA','#00FFFF','#00AAFF','#4488FF','#2244CC',
  '#6600FF','#9944CC','#CC44CC','#FF44FF','#FF66AA','#FF99BB',
  '#FFFFFF','#DDDDDD','#AAAAAA','#888888','#555555','#333333',
  '#111111','#000000','#DC143C','#BB88DD','#FFBB33','#44DDFF',
];

const STAT_MAX = 35;

// 6 elemental power types for custom characters
const ELEMENT_POWERS = [
  {
    id: 'grass',
    name: 'Grass',
    emoji: '🌿',
    desc: 'Shoots a vine straight forward — deals damage and knockback.',
    color: '#44CC44',
    power_effect: { type: 'homing_projectile', name: 'Vine Shot', duration: 0, cooldown: 14, damage: 18, knockback: 1.2, color: '#44CC44', projectileType: 'energy' },
  },
  {
    id: 'electric',
    name: 'Electric',
    emoji: '⚡',
    desc: 'Shoots a lightning bolt forward — deals damage and knockback.',
    color: '#FFDD00',
    power_effect: { type: 'homing_projectile', name: 'Lightning Bolt', duration: 0, cooldown: 13, damage: 20, knockback: 1.3, color: '#FFDD00', projectileType: 'electric' },
  },
  {
    id: 'ice',
    name: 'Ice',
    emoji: '❄️',
    desc: 'Shoots ice forward — deals damage and knockback.',
    color: '#88DDFF',
    power_effect: { type: 'homing_projectile', name: 'Ice Shard', duration: 0, cooldown: 14, damage: 18, knockback: 1.2, color: '#88DDFF', projectileType: 'energy' },
  },
  {
    id: 'water',
    name: 'Water',
    emoji: '💧',
    desc: 'Shoots water forward — deals damage and knockback.',
    color: '#4488FF',
    power_effect: { type: 'homing_projectile', name: 'Water Blast', duration: 0, cooldown: 14, damage: 17, knockback: 1.2, color: '#4488FF', projectileType: 'energy' },
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    desc: 'Shoots fire forward — deals damage and knockback.',
    color: '#FF4422',
    power_effect: { type: 'homing_projectile', name: 'Fireball', duration: 0, cooldown: 13, damage: 22, knockback: 1.3, color: '#FF4422', projectileType: 'fireball' },
  },
  {
    id: 'wind',
    name: 'Wind',
    emoji: '🌪️',
    desc: 'Shoots wind forward — no damage but massive knockback.',
    color: '#AADDFF',
    power_effect: { type: 'homing_projectile', name: 'Wind Blast', duration: 0, cooldown: 12, damage: 0, knockback: 2.5, color: '#AADDFF', projectileType: 'energy' },
  },
];

export default function CharacterCreator({ onBack, onSave, onDelete, progress }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [view, setView] = useState('create'); // 'create' | 'list' | 'locked'
  const [myChars, setMyChars] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [slotLimit, setSlotLimit] = useState(progress?.customCharSlots || 3);
  const [hasPurchase, setHasPurchase] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [tool, setTool] = useState(FILL);

  const [color, setColor] = useState('#FF4D4D');
  const [name, setName] = useState('');
  const [stats, setStats] = useState({ power: 6, speed: 6, defense: 6, utility: 6, control: 6 });
  const [selectedElement, setSelectedElement] = useState('fire');
  const [partColors, setPartColors] = useState({
    head: '#FF4D4D', torso: '#FF4D4D', armL: '#FF4D4D', armR: '#FF4D4D', legL: '#333333', legR: '#333333',
  });

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  // Check if user has made any purchase or donation
  useEffect(() => {
    const check = async () => {
      try {
        const me = await db.auth.me();
        const hasPack = (progress?.ownedPacks || []).length > 0;
        const purchases = await db.entities.Purchase.filter({ user_id: me.id, status: 'paid' });
        setHasPurchase(hasPack || purchases.length > 0);
      } catch { setHasPurchase(false); }
      setCheckingPurchase(false);
    };
    check();
  }, [progress]);

  const totalStats = Object.values(stats).reduce((a, b) => a + b, 0);

  const drawChar = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f0c1a'; ctx.fillRect(0, 0, W, H);
    PARTS.forEach(p => {
      const c = partColors[p.id] || color;
      ctx.shadowColor = c; ctx.shadowBlur = 18;
      ctx.fillStyle = c;
      if (p.id === 'head') {
        ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 8); ctx.fill();
      }
      ctx.shadowBlur = 0;
    });
    const head = PARTS[0];
    const cx = head.x + head.w / 2;
    const cy = head.y + head.h / 2;
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath(); ctx.ellipse(cx - 9, cy, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 9, cy, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  }, [partColors, color]);

  useEffect(() => { drawChar(); }, [drawChar]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const handleDown = (e) => {
    const pos = getCanvasPos(e); if (!pos) return;
    const part = PARTS.find(p => pos.x >= p.x && pos.x <= p.x + p.w && pos.y >= p.y && pos.y <= p.y + p.h);
    if (!part) return;
    sfx.click();
    if (tool === ERASE) setPartColors(prev => ({ ...prev, [part.id]: '#FFFFFF' }));
    else setPartColors(prev => ({ ...prev, [part.id]: color }));
    drawingRef.current = true;
  };

  const drawAt = (pos) => {
    const part = PARTS.find(p => pos.x >= p.x && pos.x <= p.x + p.w && pos.y >= p.y && pos.y <= p.y + p.h);
    if (!part) return;
    if (tool === ERASE) setPartColors(prev => ({ ...prev, [part.id]: '#FFFFFF' }));
    else setPartColors(prev => ({ ...prev, [part.id]: color }));
  };

  const handleMove = (e) => { if (!drawingRef.current) return; drawAt(getCanvasPos(e)); };
  const handleUp = () => { drawingRef.current = false; };

  const adjustStat = (key, delta) => {
    sfx.click();
    setStats(prev => {
      const newVal = Math.max(1, Math.min(10, prev[key] + delta));
      const newTotal = totalStats - prev[key] + newVal;
      if (newTotal > STAT_MAX) return prev;
      return { ...prev, [key]: newVal };
    });
  };

  const loadMyChars = useCallback(async () => {
    try {
      const me = await db.auth.me();
      const chars = await db.entities.CustomCharacter.filter({ owner_user_id: me.id });
      setMyChars(chars.sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || '')));
      const hasUltimate = (progress?.ownedPacks || []).includes('ultimate_pack');
      const hasSlotPack = (progress?.ownedPacks || []).includes('custom_char_slots');
      let slots = progress?.customCharSlots || 3;
      if (hasUltimate) slots = MAX_CUSTOM_CHARS;
      if (hasSlotPack) slots = MAX_CUSTOM_CHARS;
      setSlotLimit(slots);
    } catch {}
  }, [progress]);

  useEffect(() => { loadMyChars(); }, [loadMyChars]);

  const resetEditor = () => {
    setEditingId(null); setName(''); setStats({ power: 6, speed: 6, defense: 6, utility: 6, control: 6 });
    setSelectedElement('fire'); setColor('#FF4D4D');
    setPartColors({ head: '#FF4D4D', torso: '#FF4D4D', armL: '#FF4D4D', armR: '#FF4D4D', legL: '#333333', legR: '#333333' });
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setName(c.name || '');
    setStats(c.stats || { power: 6, speed: 6, defense: 6, utility: 6, control: 6 });
    const ap = c.appearance || {};
    setColor(ap.torso || c.color || '#FF4D4D');
    setPartColors({
      head: ap.head || c.color || '#FF4D4D', torso: ap.torso || c.color || '#FF4D4D',
      armL: ap.armL || c.color || '#FF4D4D', armR: ap.armR || c.color || '#FF4D4D',
      legL: ap.legL || c.secondary_color || '#333333', legR: ap.legR || c.secondary_color || '#333333',
    });
    // Try to restore selected element from saved power_effect projectileType
    const savedPe = c.power_effect;
    if (savedPe) {
      const match = ELEMENT_POWERS.find(ep =>
        ep.power_effect.color === savedPe.color || ep.power_effect.name === savedPe.name
      );
      if (match) setSelectedElement(match.id);
    }
    setView('create');
    sfx.click();
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    sfx.click();
    try {
      await db.entities.CustomCharacter.delete(c.id);
      onDelete?.(c.id);
      sfx.warning();
      loadMyChars();
    } catch { sfx.warning(); }
  };

  const handleSave = async () => {
    if (!name.trim()) { sfx.warning(); return; }
    if (!editingId && myChars.length >= slotLimit) {
      sfx.warning();
      alert(`Slot Limit Reached!\n\nYou can create up to ${slotLimit} custom character${slotLimit > 1 ? 's' : ''}.\n\nPurchase additional slots in the Shop to create more (up to ${MAX_CUSTOM_CHARS} total).`);
      return;
    }
    sfx.purchaseSuccess();
    const el = ELEMENT_POWERS.find(e => e.id === selectedElement) || ELEMENT_POWERS[4]; // default fire
    const charColor = partColors.torso || color;
    // Build abilities with defaults colored to match the character
    const abilities = {
      heavyAttack: { name: 'Heavy Strike', desc: 'A powerful strike', damage: 22, range: 170, duration: 22, color: charColor, type: 'dash', knockback: 1.3 },
      signatures: {
        side: { name: 'Side Strike', desc: 'A forward strike', damage: 18, range: 180, duration: 20, color: charColor, type: 'dash' },
        up:   { name: 'Rising Strike', desc: 'An upward strike', damage: 15, range: 120, duration: 18, color: charColor, type: 'launch' },
        down: { name: 'Ground Strike', desc: 'A downward strike', damage: 20, range: 150, duration: 22, color: charColor, type: 'groundSlam' },
      },
      superMove: { name: 'Ultimate Move', desc: 'A devastating ultimate', damage: 45, duration: 55, color: charColor },
    };
    const data = {
      name: name.trim(),
      title: `The ${el.name}`,
      color: charColor,
      secondary_color: partColors.legL || '#333333',
      power_name: el.power_effect.name,
      stats,
      appearance: partColors,
      abilities,
      power_effect: { ...el.power_effect },
      lore: `A custom fighter wielding the power of ${el.name}.`,
    };
    try {
      const me = await db.auth.me();
      if (editingId) {
        await db.entities.CustomCharacter.update(editingId, data);
      } else {
        const saved = await db.entities.CustomCharacter.create({ ...data, owner_user_id: me.id, is_custom: true });
        onSave?.(saved.id);
      }
      sfx.purchaseSuccess();
      await loadMyChars();
      setView('list');
    } catch { sfx.warning(); }
  };

  // ── LOADING / LOCKED GATE ──
  if (checkingPurchase) {
    return <div className="text-center py-20"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  if (!hasPurchase) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center gap-5 text-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">CHARACTER CREATOR</h2>
        <div className="bg-card border-2 border-accent/50 rounded-xl p-8 flex flex-col items-center gap-4">
          <div className="text-5xl"><GameIcon emoji="🔒" size={14} /></div>
          <p className="font-heading text-lg text-foreground">Purchase Required</p>
          <p className="text-sm text-muted-foreground font-body">The Character Creator requires at least one purchase or donation to unlock. Visit the Shop to get started!</p>
          <p className="text-xs text-accent font-body">Any pack purchase or donation unlocks this feature permanently.</p>
        </div>
        <button onClick={onBack} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
    );
  }

  // ── LIST VIEW ──
  if (view === 'list') {
    return (
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="📋" size={14} /> MY CHARACTERS</h2>
          <div className="flex gap-2 items-center">
            <SoundButton onClick={() => {
              if (myChars.length >= slotLimit) { sfx.warning(); alert(`Slot limit reached (${myChars.length}/${slotLimit}). Purchase more slots in the Shop.`); return; }
              resetEditor(); setView('create');
            }} sound="click" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm">+ CREATE NEW</SoundButton>
            <span className="text-[10px] font-heading text-muted-foreground">{myChars.length}/{slotLimit} SLOTS</span>
            <SoundButton onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</SoundButton>
          </div>
        </div>
        {myChars.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground font-body">You haven't created any characters yet.</p>
            <SoundButton onClick={() => { resetEditor(); setView('create'); }} sound="click" className="mt-4 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm"><GameIcon emoji="🎨" size={14} /> CREATE YOUR FIRST</SoundButton>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {myChars.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full mb-1" style={{ backgroundColor: c.color, boxShadow: `0 0 12px ${c.color}` }} />
                <p className="font-heading text-sm text-foreground text-center">{c.name}</p>
                <p className="text-[9px] text-muted-foreground">{c.title}</p>
                <div className="flex gap-1 mt-2 w-full">
                  <SoundButton onClick={() => handleEdit(c)} sound="click" className="flex-1 px-2 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]"><GameIcon emoji="✏" size={14} /> EDIT</SoundButton>
                  <SoundButton onClick={() => handleDelete(c)} className="flex-1 px-2 py-1.5 bg-destructive/50 text-destructive-foreground rounded font-heading text-[10px]"><GameIcon emoji="🗑" size={14} /> DELETE</SoundButton>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[9px] text-muted-foreground text-center">Custom characters are banned in Ranked, Online, and Tournaments. Usable in all other modes.</p>
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ──
  const selectedEl = ELEMENT_POWERS.find(e => e.id === selectedElement) || ELEMENT_POWERS[4];

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">{editingId ? <><GameIcon emoji="✏" size={14} /> EDIT CHARACTER</> : <><GameIcon emoji="🎨" size={14} /> CREATE CHARACTER</>}</h2>
        <div className="flex gap-2">
          <SoundButton onClick={() => setView('list')} sound="click" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="📋" size={14} /> SEE CHARACTERS</SoundButton>
          <SoundButton onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</SoundButton>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Appearance Editor */}
        <div className="flex-1 bg-card border border-border rounded-xl p-4">
          <h3 className="font-heading text-sm text-primary mb-2">APPEARANCE</h3>
          <canvas ref={canvasRef} width={W} height={H}
            onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}
            className="rounded-lg w-full" style={{ maxWidth: W, touchAction: 'none' }} />
          <div className="flex gap-2 mt-2">
            <SoundButton onClick={() => setTool(FILL)} sound="click" className={`px-3 py-1.5 rounded font-heading text-xs ${tool === FILL ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}><GameIcon emoji="🪣" size={14} /> FILL</SoundButton>
            <SoundButton onClick={() => setTool(ERASE)} sound="click" className={`px-3 py-1.5 rounded font-heading text-xs ${tool === ERASE ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}><GameIcon emoji="🧹" size={14} /> ERASE (<GameIcon emoji="→" size={14} /> white)</SoundButton>
          </div>
          <div className="grid grid-cols-9 gap-1 mt-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => { sfx.click(); setColor(c); setTool(FILL); }}
                className={`w-6 h-6 rounded border-2 ${color === c ? 'border-white scale-110' : 'border-border'}`}
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 8px ${c}` : 'none' }} />
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-2 text-center">Click a body part to fill it. Erase turns it white.</p>
        </div>

        {/* Character Info + Element Power */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-2">CHARACTER INFO</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Character name"
              className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded font-body text-sm mb-3" maxLength={20} />
            <p className="text-[10px] text-muted-foreground mb-1">Distribute stat points ({totalStats}/{STAT_MAX} used)</p>
            <div className="space-y-1">
              {Object.entries(stats).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs font-heading text-foreground w-16 capitalize">{key}</span>
                  <button onClick={() => adjustStat(key, -1)} className="w-6 h-6 bg-secondary rounded text-xs">-</button>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${(val / 10) * 100}%` }} />
                  </div>
                  <span className="text-xs font-heading text-foreground w-5 text-center">{val}</span>
                  <button onClick={() => adjustStat(key, 1)} className="w-6 h-6 bg-secondary rounded text-xs">+</button>
                </div>
              ))}
            </div>
          </div>

          {/* Element Power Picker */}
          <div className="bg-card border border-accent/40 rounded-xl p-4">
            <h3 className="font-heading text-sm text-accent mb-2"><GameIcon emoji="⚡" size={14} /> CHOOSE YOUR POWER ELEMENT</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {ELEMENT_POWERS.map(el => (
                <button key={el.id} onClick={() => { sfx.click(); setSelectedElement(el.id); }}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 transition ${selectedElement === el.id ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'}`}>
                  <span className="text-lg">{el.emoji}</span>
                  <span className="text-[10px] font-heading" style={{ color: el.color }}>{el.name}</span>
                </button>
              ))}
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <p className="text-[10px] font-heading text-accent">{selectedEl.emoji} {selectedEl.name} — {selectedEl.power_effect.name}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{selectedEl.desc}</p>
              {selectedEl.power_effect.damage > 0
                ? <p className="text-[9px] text-foreground/70 mt-1">DMG: {selectedEl.power_effect.damage} · KB: {selectedEl.power_effect.knockback}x · CD: {selectedEl.power_effect.cooldown}s</p>
                : <p className="text-[9px] text-foreground/70 mt-1">DMG: 0 · KB: {selectedEl.power_effect.knockback}x (massive!) · CD: {selectedEl.power_effect.cooldown}s</p>
              }
            </div>
          </div>

          <SoundButton onClick={handleSave} sound="success" disabled={!name.trim()}
            className={`py-3 rounded-lg font-heading text-lg ${name.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {editingId ? <><GameIcon emoji="💾" size={14} /> SAVE CHANGES</> : <><GameIcon emoji="💾" size={14} /> SAVE CHARACTER</>}
          </SoundButton>
        </div>
      </div>
    </div>
  );
}