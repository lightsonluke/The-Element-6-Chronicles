import React, { useEffect, useMemo, useState } from 'react';

export const MATCH_MODE_TILES = [
  'Fight', 'Ranked', 'Unranked Fight', 'Tournament', 'Grand Circuit', 'The Table',
  'Battle Royale', 'Custom Rooms', 'Party', 'LAN Play', 'Soccer', 'Volleyball',
  'Parkour', 'Rock Climbing', 'CTF', 'Dodgeball', 'Ziplining', 'Banger',
  'Soccer Ranked', 'Soccer Online', 'Volleyball 2v2 Online',
  'Volleyball 1v1 Ranked', 'Dodgeball Ranked', 'Dodgeball Online', 'Banger 3v3 Online',
];

const FIGHT_VARIANTS = ['Regular', 'Timed', 'Super', 'Sudden Death', 'Bot Ranked', 'Coin', 'Split City Brawl', 'Challenge', 'Low Gravity', '2v2', 'Shapeshift'];
const ONLINE_OR_RANKED = new Set(['Ranked', 'Unranked Fight', 'Soccer Ranked', 'Soccer Online', 'Volleyball 2v2 Online', 'Volleyball 1v1 Ranked', 'Dodgeball Ranked', 'Dodgeball Online', 'Banger 3v3 Online']);

const lockedCount = (mode, variant) => {
  if (variant === '2v2') return 4;
  if (variant === 'Bot Ranked' || variant === 'Split City Brawl') return 2;
  if (mode === 'Volleyball 2v2 Online') return 4;
  if (mode === 'Banger 3v3 Online') return 6;
  if (['Ranked', 'Unranked Fight', 'Soccer Ranked', 'Soccer Online', 'Volleyball 1v1 Ranked', 'Dodgeball Ranked', 'Dodgeball Online'].includes(mode)) return 2;
  return null;
};

function normalizeSlots(slots, count) {
  return Array.from({ length: count }, (_, i) => slots?.[i] || { kind: i === 0 ? 'player' : 'cpu', control: i === 0 ? 'Keyboard · WASD' : 'Keyboard · Arrows' });
}

export default function MatchSettingsOverlay({ open, onClose, config, onChange }) {
  const [controllers, setControllers] = useState([]);
  useEffect(() => {
    const update = () => setControllers(Array.from(navigator.getGamepads?.() || []).filter(Boolean).map((g, i) => `Controller ${i + 1} · ${g.id.slice(0, 34)}`));
    update(); window.addEventListener('gamepadconnected', update); window.addEventListener('gamepaddisconnected', update);
    return () => { window.removeEventListener('gamepadconnected', update); window.removeEventListener('gamepaddisconnected', update); };
  }, []);
  const locked = ONLINE_OR_RANKED.has(config.mode);
  const fixed = lockedCount(config.mode, config.fightVariant);
  const count = fixed || Math.max(1, Math.min(8, Number(config.slotCount) || 2));
  const slots = useMemo(() => normalizeSlots(config.slots, count), [config.slots, count]);
  const controls = ['Keyboard · WASD', 'Keyboard · Arrows', 'Custom keyboard', ...controllers];
  const update = patch => onChange({ ...config, ...patch });
  const changeCount = value => update({ slotCount: Number(value), slots: normalizeSlots(slots, Number(value)) });
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3" role="dialog" aria-modal="true" aria-label="Match settings">
    <section className="w-full max-w-4xl max-h-[90dvh] overflow-y-auto rounded-xl border-2 border-primary bg-card p-4 shadow-2xl">
      <header className="flex items-center justify-between gap-3 mb-3"><div><p className="font-heading text-lg text-foreground">MATCH SETTINGS</p><p className="text-xs text-muted-foreground">Configure local matches here. Ranked and online queues keep their server rules locked.</p></div><button onClick={onClose} className="px-3 py-1 rounded bg-secondary text-secondary-foreground font-heading">CLOSE</button></header>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {MATCH_MODE_TILES.map(mode => <button key={mode} onClick={() => update({ mode, slotCount: lockedCount(mode, config.fightVariant) || config.slotCount })} className={`min-w-[126px] px-3 py-2 rounded-lg border text-left text-xs font-heading ${config.mode === mode ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary/40 text-secondary-foreground'}`}>{mode}</button>)}
      </div>
      {config.mode === 'Fight' && <label className="block mb-3 text-sm font-heading">SELECT GAME MODE <select value={config.fightVariant} onChange={e => update({ fightVariant: e.target.value, slotCount: lockedCount(config.mode, e.target.value) || config.slotCount })} className="ml-2 rounded bg-secondary px-2 py-1 text-secondary-foreground">{FIGHT_VARIANTS.map(v => <option key={v}>{v}</option>)}</select></label>}
      <div className="rounded-lg border border-border overflow-hidden mb-3"><div className="grid grid-cols-[minmax(120px,1fr)_90px_100px_minmax(150px,1fr)] gap-2 bg-muted/60 px-3 py-2 text-[10px] font-heading text-muted-foreground"><span>CHARACTER</span><span>ORDER</span><span>TYPE</span><span>CONTROLS</span></div>
        {slots.map((slot, index) => <div key={index} className="grid grid-cols-[minmax(120px,1fr)_90px_100px_minmax(150px,1fr)] items-center gap-2 px-3 py-2 border-t border-border text-xs"><span>Character {index + 1}</span><span>P{index + 1}</span><button disabled={locked || index === 0} onClick={() => { const next = [...slots]; next[index] = { ...next[index], kind: slot.kind === 'cpu' ? 'player' : 'cpu' }; update({ slots: next }); }} className="rounded bg-secondary px-2 py-1 text-secondary-foreground disabled:opacity-50">{slot.kind === 'cpu' ? 'CPU' : 'PLAYER'}</button><select disabled={locked || slot.kind === 'cpu'} value={slot.control} onChange={e => { const next = [...slots]; next[index] = { ...next[index], control: e.target.value }; update({ slots: next }); }} className="rounded bg-secondary px-2 py-1 text-secondary-foreground disabled:opacity-50">{controls.map(c => <option key={c}>{c}</option>)}</select></div>)}
      </div>
      <div className="relative inline-flex items-center gap-2 rounded-lg border border-border p-3">
        <label className="font-heading text-sm">NUMBER OF CHARACTERS <select disabled={Boolean(fixed) || locked} value={count} onChange={e => changeCount(e.target.value)} className="ml-2 rounded bg-secondary px-2 py-1 text-secondary-foreground disabled:opacity-50">{Array.from({ length: 8 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        {(fixed || locked) && <span className="rounded bg-black/45 px-2 py-1 text-xs text-muted-foreground">LOCKED · {fixed || count} players</span>}
      </div>
      {config.fightVariant === 'Shapeshift' && <p className="mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs text-foreground">Shapeshift keeps each player’s three-character lineup together on that player’s podium. Choose a player above, then assign that player’s lineup in the roster.</p>}
      {locked && <p className="mt-3 text-xs text-muted-foreground">Online and ranked participants, controls, and counts are controlled by matchmaking and cannot be changed here.</p>}
    </section>
  </div>;
}
