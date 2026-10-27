import React, { useEffect, useMemo, useState } from 'react';

export const MATCH_MODE_TILES = [
  'Fight', 'Ranked', 'Unranked Fight', 'Tournament', 'Grand Circuit', 'The Table',
  'Battle Royale', 'Custom Rooms', 'Party', 'LAN Play', 'Soccer', 'Volleyball',
  'Parkour', 'Rock Climbing', 'CTF', 'Dodgeball', 'Ziplining', 'Banger',
  'Soccer Ranked', 'Soccer Online', 'Volleyball 2v2 Online',
  'Volleyball 1v1 Ranked', 'Dodgeball Ranked', 'Dodgeball Online', 'Banger 3v3 Online',
];

const FIGHT_VARIANTS = ['Regular', 'Timed', 'HP Battle', 'Super', 'Sudden Death', 'Bot Ranked', 'Coin', 'Split City Brawl', 'Challenge', 'Low Gravity', 'Bot Battle', '2v2', 'Shapeshift'];
const ONLINE_OR_RANKED = new Set(['Ranked', 'Unranked Fight', 'Tournament', 'Grand Circuit', 'The Table', 'Battle Royale', 'Custom Rooms', 'Party', 'LAN Play', 'Soccer Ranked', 'Soccer Online', 'Volleyball 2v2 Online', 'Volleyball 1v1 Ranked', 'Dodgeball Ranked', 'Dodgeball Online', 'Banger 3v3 Online']);

const lockedCount = (mode, variant) => {
  if (mode === 'Fight') return variant === '2v2' ? 4 : 2;
  if (mode === 'Volleyball 2v2 Online') return 4;
  if (mode === 'Banger 3v3 Online') return 6;
  if (ONLINE_OR_RANKED.has(mode)) return 2;
  return null;
};

function normalizeSlots(slots, count) {
  return Array.from({ length: count }, (_, i) => slots?.[i] || { kind: i === 0 ? 'player' : 'cpu', control: i === 0 ? 'Keyboard · WASD' : 'Keyboard · Arrows' });
}

export default function MatchSettingsOverlay({ open, onClose, config, onChange }) {
  const [controllers, setControllers] = useState([]);
  useEffect(() => {
    const update = () => setControllers(Array.from(navigator.getGamepads?.() || []).filter(Boolean).map(g => `Controller ${g.index + 1} · ${g.id.slice(0, 34)}`));
    update(); window.addEventListener('gamepadconnected', update); window.addEventListener('gamepaddisconnected', update);
    return () => { window.removeEventListener('gamepadconnected', update); window.removeEventListener('gamepaddisconnected', update); };
  }, []);
  const locked = ONLINE_OR_RANKED.has(config.mode);
  const slotConfigurable = config.mode === 'Fight' && !locked && !['Bot Ranked','Challenge','Bot Battle'].includes(config.fightVariant);
  const fixed = lockedCount(config.mode, config.fightVariant);
  const count = fixed || Math.max(1, Math.min(8, Number(config.slotCount) || 2));
  const slots = useMemo(() => normalizeSlots(config.slots, count), [config.slots, count]);
  const controls = ['Keyboard · WASD', 'Keyboard · Arrows', ...(config.customControls || []).filter(Boolean).map(c => `Custom keyboard · ${c.name || 'Custom'}`), ...controllers];
  const update = patch => onChange({ ...config, ...patch });
  const changeCount = value => { const n = Number(value); update({ slotCount: n, slots: normalizeSlots(slots, n), handicaps: Array.from({ length: n }, (_, i) => config.handicaps?.[i] || { damageDealt: 100, damageTaken: 100, knockback: 100, movementSpeed: 100, jumpHeight: 100 }) }); };
  const localOnly = config.mode === 'Fight' && !locked;
  const updateHandicap = (index, key, value) => { const next = Array.from({ length: count }, (_, i) => ({ damageDealt: 100, damageTaken: 100, knockback: 100, movementSpeed: 100, jumpHeight: 100, ...(config.handicaps?.[i] || {}) })); next[index] = { ...next[index], [key]: Number(value) }; update({ handicaps: next }); };
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3" role="dialog" aria-modal="true" aria-label="Match settings">
    <section className="w-full max-w-4xl max-h-[90dvh] overflow-y-auto rounded-xl border-2 border-primary bg-card p-4 shadow-2xl">
      <header className="flex items-center justify-between gap-3 mb-3"><div><p className="font-heading text-lg text-foreground">MATCH SETTINGS</p><p className="text-xs text-muted-foreground">Configure local matches here. Ranked and online queues keep their server rules locked.</p></div><button onClick={onClose} className="px-3 py-1 rounded bg-secondary text-secondary-foreground font-heading">CLOSE</button></header>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {MATCH_MODE_TILES.map(mode => <button key={mode} onClick={() => { const nextCount = lockedCount(mode, mode === 'Fight' ? config.fightVariant : 'Regular') || 2; update({ mode, slotCount: nextCount, slots: normalizeSlots(slots, nextCount), handicaps: Array.from({ length: nextCount }, (_, i) => config.handicaps?.[i] || { damageDealt: 100, damageTaken: 100, knockback: 100, movementSpeed: 100, jumpHeight: 100 }) }); }} className={`min-w-[126px] px-3 py-2 rounded-lg border text-left text-xs font-heading ${config.mode === mode ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary/40 text-secondary-foreground'}`}>{mode}</button>)}
      </div>
      {config.mode === 'Fight' && <label className="block mb-3 text-sm font-heading">SELECT GAME MODE <select value={config.fightVariant} onChange={e => update({ fightVariant: e.target.value, slotCount: lockedCount(config.mode, e.target.value) || config.slotCount })} className="ml-2 rounded bg-secondary px-2 py-1 text-secondary-foreground">{FIGHT_VARIANTS.map(v => <option key={v}>{v}</option>)}</select></label>}
      <div className="rounded-lg border border-border overflow-hidden mb-3"><div className="grid grid-cols-[minmax(120px,1fr)_90px_100px_minmax(150px,1fr)] gap-2 bg-muted/60 px-3 py-2 text-[10px] font-heading text-muted-foreground"><span>CHARACTER</span><span>ORDER</span><span>TYPE</span><span>CONTROLS</span></div>
        {slots.map((slot, index) => <div key={index} className="grid grid-cols-[minmax(120px,1fr)_90px_100px_minmax(150px,1fr)] items-center gap-2 px-3 py-2 border-t border-border text-xs"><span className="truncate" title={config.characterNames?.[index] || `Character ${index + 1}`}>{config.characterNames?.[index] || `Character ${index + 1}`}</span><span>P{index + 1}</span><button disabled={!slotConfigurable || index === 0 || (config.mode === 'Fight' && config.fightVariant === '2v2' && index === 3)} onClick={() => { const next = [...slots]; const nextKind = slot.kind === 'cpu' ? 'player' : 'cpu'; next[index] = { ...next[index], kind: nextKind }; if (config.mode === 'Fight' && config.fightVariant === '2v2' && nextKind === 'player' && (index === 1 || index === 2)) { const other = index === 1 ? 2 : 1; next[other] = { ...next[other], kind: 'cpu' }; } update({ slots: next }); }} className="rounded bg-secondary px-2 py-1 text-secondary-foreground disabled:opacity-50">{slot.kind === 'cpu' ? 'CPU' : 'PLAYER'}</button><select disabled={!slotConfigurable || slot.kind === 'cpu' || config.fightVariant === '2v2'} value={slot.control} onChange={e => { const next = [...slots]; next[index] = { ...next[index], control: e.target.value }; update({ slots: next }); }} className="rounded bg-secondary px-2 py-1 text-secondary-foreground disabled:opacity-50">{controls.map(c => <option key={c}>{c}</option>)}</select></div>)}
      </div>
      <div className="relative inline-flex items-center gap-2 rounded-lg border border-border p-3">
        <label className="font-heading text-sm">NUMBER OF CHARACTERS <select disabled={Boolean(fixed) || locked || !slotConfigurable} value={count} onChange={e => changeCount(e.target.value)} className="ml-2 rounded bg-secondary px-2 py-1 text-secondary-foreground disabled:opacity-50">{Array.from({ length: 8 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        {(fixed || locked) && <span className="rounded bg-black/45 px-2 py-1 text-xs text-muted-foreground">LOCKED · {fixed || count} players</span>}
      </div>
      {localOnly && <div className="mt-4 rounded-lg border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-heading text-sm">LOCAL CHARACTER HANDICAPS</p><p className="text-xs text-muted-foreground">Only applies to offline/local fights. Damage, knockback, movement speed and jump height are per-player multipliers; 100% is base.</p></div><label className="flex items-center gap-2 text-xs font-heading"><input type="checkbox" checked={Boolean(config.handicapsEnabled)} onChange={e => update({ handicapsEnabled: e.target.checked, ...(e.target.checked ? {} : { handicaps: Array.from({ length: count }, () => ({ damageDealt: 100, damageTaken: 100, knockback: 100, movementSpeed: 100, jumpHeight: 100 })) }) })}/> ENABLE HANDICAPS</label></div>{config.handicapsEnabled && <div className="mt-3 space-y-3">{slots.map((slot, i) => { const h = { damageDealt: 100, damageTaken: 100, knockback: 100, movementSpeed: 100, jumpHeight: 100, ...(config.handicaps?.[i] || {}) }; return <div key={i} className="rounded border border-border/70 p-2"><p className="mb-2 text-xs font-heading">{slot.kind === 'cpu' ? `CPU ${i + 1}` : `PLAYER ${i + 1}`} · {config.characterNames?.[i] || `CHARACTER ${i + 1}`}</p>{[['damageDealt','DAMAGE DEALT'],['damageTaken','DAMAGE TAKEN'],['knockback','KNOCKBACK'],['movementSpeed','MOVEMENT SPEED'],['jumpHeight','JUMP HEIGHT']].map(([key,label]) => <label key={key} className="grid grid-cols-[110px_1fr_48px] items-center gap-2 py-1 text-[11px]"><span>{label}</span><input type="range" min="0" max="300" step="5" value={h[key]} onChange={e => updateHandicap(i,key,e.target.value)}/><span className="text-right tabular-nums">{h[key]}%</span></label>)}</div>; })}<button onClick={() => update({ handicaps: Array.from({ length: count }, () => ({ damageDealt: 100, damageTaken: 100, knockback: 100, movementSpeed: 100, jumpHeight: 100 })) })} className="rounded bg-secondary px-3 py-1.5 text-xs">RESET ALL TO BASE (100%)</button></div>}</div>}
      {localOnly && config.fightVariant !== '2v2' && <div className="mt-3 rounded-lg border border-border p-3"><p className="font-heading text-sm">LOCAL MATCH RULES</p><p className="mt-1 text-xs text-muted-foreground">These rules apply only to this offline match and never modify online matchmaking.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs">STOCKS PER FIGHTER<select value={config.localRules?.stocks ?? 3} onChange={e => update({ localRules: { stocks: Number(e.target.value), ...(config.localRules || {}) } })} className="mt-1 w-full rounded bg-secondary px-2 py-2 text-secondary-foreground">{[1,2,3,4,5,7,9].map(n => <option key={n} value={n}>{n} stocks</option>)}</select></label><label className="text-xs">MATCH TIMER<select value={config.localRules?.matchTime ?? 240} onChange={e => update({ localRules: { ...(config.localRules || {}), matchTime: Number(e.target.value) } })} className="mt-1 w-full rounded bg-secondary px-2 py-2 text-secondary-foreground">{[[60,'1 minute'],[120,'2 minutes'],[180,'3 minutes'],[240,'4 minutes'],[300,'5 minutes'],[480,'8 minutes'],[0,'Unlimited']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>{[['gravity','GRAVITY'],['jumpHeight','JUMP HEIGHT'],['movementSpeed','MOVEMENT SPEED']].map(([key,label]) => <label key={key} className="text-xs"><span>{label} · {config.localRules?.[key] ?? 100}%</span><input type="range" min="50" max="150" step="5" value={config.localRules?.[key] ?? 100} onChange={e => update({ localRules: { ...(config.localRules || {}), [key]: Number(e.target.value) } })} className="mt-1 w-full"/></label>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{[['infiniteJumps','INFINITE JUMPS'],['infiniteStocks','INFINITE STOCKS'],['infiniteHP','INFINITE HP'],['infinitePower','INFINITE POWER']].map(([key,label]) => <label key={key} className="flex items-center gap-2 rounded bg-secondary/40 p-2 text-xs"><input type="checkbox" checked={Boolean(config.localRules?.[key])} onChange={e => update({ localRules: { ...(config.localRules || {}), [key]: e.target.checked } })}/>{label}</label>)}</div></div>}
      {config.fightVariant === 'Shapeshift' && <p className="mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs text-foreground">Shapeshift keeps each player’s three-character lineup together on that player’s podium. Choose a player above, then assign that player’s lineup in the roster.</p>}
      {locked && <p className="mt-3 text-xs text-muted-foreground">Online, ranked, and party participants, controls, and counts are controlled by their lobby and cannot be changed here.</p>}
      {!locked && config.mode !== 'Fight' && <p className="mt-3 text-xs text-muted-foreground">This mode opens its own lobby and character selection. Fighter slots, local handicaps, and local match rules are only editable for offline Fight variants.</p>}
    </section>
  </div>;
}
