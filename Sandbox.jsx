import React, { useState, useRef } from 'react';
import PlatformFighter from './PlatformFighter.jsx';
import CustomBattle from './CustomBattle.jsx';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { STAGE_LIST as BUILTIN_STAGES } from './stages.js';
import { defaultMods, CPU_BEHAVIORS, WEATHER_OPTIONS } from './matchMods.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { OLD_GEN_CHARS, ERAS } from './eras.js';
import EraTabBar from './EraTabBar.jsx';
import GameIcon from "./GameIcon.jsx";

const OLD_GEN_NORMALIZED = OLD_GEN_CHARS.map(c => ({ ...c, power: c.power || c.powerTitle, isGuardian: false, isOldGen: true, era: c.era }));
const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS, ...OLD_GEN_NORMALIZED];
const ERA_LABELS = Object.fromEntries(ERAS.map(e => [e.id, e.name]));
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

function getRosterForEra(eraId) {
  if (eraId === 'all') return ALL;
  if (eraId === 'g5') return [...HEROES, ...VILLAINS, ...GUARDIANS];
  return OLD_GEN_NORMALIZED.filter(c => c.era === eraId);
}

// Sandbox — completely offline. No XP, tokens, or unlocks. Pure testing & fun.
// Player-slot UI like Custom Rooms — add/remove bots, per-bot difficulty.
export default function Sandbox({ progress, customCharsData = {}, onBack }) {
  const [phase, setPhase] = useState('config');
  const [players, setPlayers] = useState([
    { char: progress?.favoriteId || 'yellow', era: 'g5', type: 'human', difficulty: 'regular' },
    { char: 'red', era: 'g5', type: 'bot', difficulty: 'regular' },
  ]);
  const [customStages] = useState(progress?.customStages || []);
  const [stageKey, setStageKey] = useState('splitcity');
  const [mods, setMods] = useState(() => {
    try { const s = localStorage.getItem('el6_sandbox_profile'); return s ? { ...defaultMods(), ...JSON.parse(s) } : defaultMods(); } catch { return defaultMods(); }
  });
  const [stockCount, setStockCount] = useState(() => {
    try { return parseInt(localStorage.getItem('el6_sandbox_stocks') || '3', 10) || 3; } catch { return 3; }
  });
  const fightKeyRef = useRef(0);
  const [fightKey, setFightKey] = useState(0);

  const saveMods = (m) => { setMods(m); try { localStorage.setItem('el6_sandbox_profile', JSON.stringify(m)); } catch {} };

  const getCharData = (id) => customCharsData[id] || ALL.find(c => c.id === id) || HEROES[0];

  const startMatch = () => { sfx.matchFound(); setFightKey(k => k + 1); setPhase('fight'); };

  const resolveStage = () => {
    if (stageKey.startsWith('custom_')) {
      const idx = parseInt(stageKey.split('_')[1], 10);
      const st = customStages[idx];
      return { map: 'custom', customPlatforms: st?.platforms, customSpawnPoints: st?.spawnPoints, customHazards: st?.hazards, customObjects: st?.objects };
    }
    return { map: stageKey, customPlatforms: null, customSpawnPoints: null, customHazards: null, customObjects: null };
  };
  const stage = resolveStage();

  const setPlayerChar = (i, charId) => setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, char: charId } : p));
  const setPlayerEra = (i, era) => setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, era } : p));
  const setPlayerDifficulty = (i, diff) => setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, difficulty: diff } : p));
  const setPlayerType = (i, type) => setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, type } : p));
  const addPlayer = () => {
    if (players.length >= 8) return;
    const used = new Set(players.map(p => p.char));
    const pool = ALL.filter(c => !used.has(c.id));
    const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ALL[0];
    setPlayers([...players, { char: pick.id, era: 'g5', type: 'bot', difficulty: 'regular' }]);
    sfx.click();
  };
  const removePlayer = (i) => { if (i === 0) return; setPlayers(players.filter((_, idx) => idx !== i)); sfx.click(); };

  if (phase === 'fight') {
    const p1 = players[0];
    const p2 = players[1] || { char: 'red', type: 'bot', difficulty: 'regular' };

    // 3+ players: use CustomBattle engine (supports up to 8 fighters)
    if (players.length > 2) {
      const numHumans = players.filter(p => p.type === 'human').length;
      const customStageIdx = stageKey.startsWith('custom_') ? parseInt(stageKey.split('_')[1], 10) : null;
      return (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          <CustomBattle
            onBack={() => setPhase('config')}
            unlockedIds={progress?.unlockedIds}
            favoriteId={p1.char}
            equippedAccessories={progress?.equippedAccessories || {}}
            equippedSkins={progress?.equippedSkins || {}}
            musicVolume={progress?.settings?.musicVolume ?? 50}
            sfxVolume={progress?.settings?.sfxVolume ?? 70}
            customStages={customStages}
            settings={progress?.settings || {}}
            customCharsData={customCharsData}
            sandboxConfig={{
              players: players.map(p => ({ char: p.char, difficulty: p.difficulty || 'regular', type: p.type })),
              numHumans,
              mapId: stage.map === 'custom' ? 'splitcity' : stage.map,
              customStageIdx: stage.map === 'custom' ? customStageIdx : null,
              matchTime: mods.timeLimit > 0 ? mods.timeLimit : 0,
              customHazards: stage.customHazards,
              customObjects: stage.customObjects,
            }}
          />
        </div>
      );
    }

    // 2 players: use PlatformFighter with all sandbox mods
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <PlatformFighter key={fightKey}
          p1Char={p1.char} p2Char={p2.char} p2IsCPU={p2.type === 'bot'}
          dummy={p2.type === 'dummy'}
          selectedMap={stage.map} customPlatforms={stage.customPlatforms} customSpawnPoints={stage.customSpawnPoints} customHazards={stage.customHazards} customObjects={stage.customObjects}
          cpuDifficulty={p2.difficulty}
          gameMode={mods.gameMode || 'regular'}
          infiniteSuper={!!mods.infiniteSuper}
          matchTime={mods.timeLimit > 0 ? mods.timeLimit : 0}
          mods={mods}
          stockCount={stockCount}
          musicVolume={progress?.settings?.musicVolume ?? 50} sfxVolume={progress?.settings?.sfxVolume ?? 70}
          settings={progress?.settings || {}}
          equippedAccessories={progress?.equippedAccessories || {}}
          equippedSkins={progress?.equippedSkins || {}}
          killFXId="none"
          customCharsData={customCharsData}
          onEnd={() => setPhase('config')}
          onAward={() => {}}
        />
      </div>
    );
  }

  const CharGrid = ({ value, onChange, era, setEra }) => (
    <div className="flex flex-col gap-1.5">
      <EraTabBar selectedEra={era} onEraChange={setEra} onRandom={(id) => { if (id) onChange(id); }} compact />
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded-lg bg-card/60">
        {getRosterForEra(era).map(c => {
          const sel = value === c.id;
          return (
            <button key={c.id} onClick={() => { onChange(c.id); sfx.click(); }} title={`${c.name}${c.era && c.era !== 'g5' ? ` (${ERA_LABELS[c.era]})` : ''}`}
              className={`w-7 h-7 rounded-md border-2 flex items-center justify-center text-[10px] font-bold ${sel ? 'border-accent scale-105' : 'border-transparent'}`}
              style={c.splitColor ? { background: `linear-gradient(135deg, ${c.color} 50%, ${c.secondaryColor} 50%)` } : { background: c.color || '#888' }}>
              {c.name?.[0] || '?'}
            </button>
          );
        })}
      </div>
    </div>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <button onClick={() => { onChange(!checked); sfx.click(); }} className={`px-2 py-1.5 rounded font-heading text-[10px] border-2 ${checked ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground border-border'}`}>
      {checked ? '✓ ' : ''}{label}
    </button>
  );

  return (
    <div className="w-full max-w-5xl flex flex-col gap-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🛠" size={14} /> SANDBOX</h2>
        <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <p className="text-[10px] text-muted-foreground font-body bg-card border border-border rounded-lg px-3 py-2">Sandbox is offline. No XP, tokens, unlocks, or achievements are awarded. Press P / Esc in-match to pause.</p>

      {/* Player Slots — like Custom Rooms */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex justify-between items-center mb-2">
          <p className="font-heading text-xs text-primary">PLAYERS ({players.length}/8)</p>
          {players.length < 8 && (
            <button onClick={addPlayer} className="px-3 py-1 bg-primary/30 border border-dashed border-primary rounded font-heading text-[10px] text-primary hover:opacity-80">+ ADD BOT</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {players.map((p, i) => {
            const cd = getCharData(p.char);
            return (
              <div key={i} className={`flex flex-col gap-1.5 p-2 rounded-lg border ${i === 0 ? 'border-accent bg-accent/10' : 'border-border'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: cd.color, boxShadow: `0 0 6px ${cd.color}88` }} />
                  <span className="text-xs font-heading">{i === 0 ? 'YOU (P1)' : `BOT ${i}`}</span>
                  {i > 0 && (
                    <button onClick={() => removePlayer(i)} className="ml-auto text-[10px] text-destructive hover:opacity-70"><GameIcon emoji="✕" size={14} /></button>
                  )}
                </div>
                <CharGrid value={p.char} onChange={(id) => setPlayerChar(i, id)} era={p.era} setEra={(e) => setPlayerEra(i, e)} />
                {i > 0 && (
                  <div className="flex gap-1.5 items-center">
                    <select value={p.type} onChange={e => setPlayerType(i, e.target.value)} className="text-[10px] bg-secondary text-secondary-foreground rounded px-1 py-0.5 border border-border font-heading">
                      {i === 1 && <option value="human">Human (WASD)</option>}
                      <option value="bot">CPU Bot</option>
                      <option value="dummy">Dummy</option>
                    </select>
                    {p.type === 'bot' && (
                      <select value={p.difficulty} onChange={e => setPlayerDifficulty(i, e.target.value)} className="text-[10px] bg-secondary text-secondary-foreground rounded px-1 py-0.5 border border-border font-heading">
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {players.length > 2 && (
          <p className="text-[9px] text-muted-foreground mt-1.5 font-body">Note: Sandbox currently supports 2 players in-match (first two slots). For 3+ players, use Custom Battle.</p>
        )}
      </div>

      {/* Stage selection */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
        <p className="font-heading text-xs text-primary">STAGE</p>
        <select value={stageKey} onChange={e => { setStageKey(e.target.value); sfx.click(); }} className="bg-secondary text-secondary-foreground rounded px-2 py-1.5 text-xs font-heading w-full">
          <optgroup label="Built-in">
            {BUILTIN_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </optgroup>
          {customStages.length > 0 && <optgroup label="Custom">
            {customStages.map((s, i) => <option key={i} value={`custom_${i}`}>{s.emoji || '🎨'} {s.name || 'Custom'}</option>)}
          </optgroup>}
        </select>
      </div>

      {/* Match Settings */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
        <p className="font-heading text-xs text-primary">MATCH SETTINGS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
          <label className="flex items-center gap-2"><span className="font-heading text-muted-foreground">TIME</span>
            <input type="number" min={0} max={999} value={mods.timeLimit} onChange={e => saveMods({ ...mods, timeLimit: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-secondary-foreground rounded px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-2"><span className="font-heading text-muted-foreground">STOCKS</span>
            <input type="number" min={1} max={99} value={stockCount} onChange={e => { const v = Math.max(1, parseInt(e.target.value) || 3); setStockCount(v); try { localStorage.setItem('el6_sandbox_stocks', String(v)); } catch {} }} className="w-16 bg-secondary text-secondary-foreground rounded px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-2"><span className="font-heading text-muted-foreground">CPU BEHAVIOR</span>
            <select value={mods.cpuBehavior} onChange={e => saveMods({ ...mods, cpuBehavior: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
              {CPU_BEHAVIORS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2"><span className="font-heading text-muted-foreground">WEATHER</span>
            <select value={mods.weather} onChange={e => saveMods({ ...mods, weather: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
              {WEATHER_OPTIONS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2"><span className="font-heading text-muted-foreground">MUSIC</span>
            <select value={mods.music} onChange={e => saveMods({ ...mods, music: e.target.value })} className="bg-secondary text-secondary-foreground rounded px-1 py-0.5">
              <option value="menu">Menu</option><option value="fight">Fight</option><option value="soccer">Sports</option>
            </select>
          </label>
        </div>
        <div className="flex gap-1.5 flex-wrap mt-1">
          <Toggle label="Infinite Super" checked={!!mods.infiniteSuper} onChange={v => saveMods({ ...mods, infiniteSuper: v })} />
          <Toggle label="Infinite Power" checked={!!mods.infinitePower} onChange={v => saveMods({ ...mods, infinitePower: v })} />
          <Toggle label="Infinite Jumps" checked={!!mods.infiniteJumps} onChange={v => saveMods({ ...mods, infiniteJumps: v })} />
          <Toggle label="Infinite Stocks" checked={!!mods.infiniteStocks} onChange={v => saveMods({ ...mods, infiniteStocks: v })} />
          <Toggle label="Infinite HP" checked={!!mods.infiniteHP} onChange={v => saveMods({ ...mods, infiniteHP: v })} />
          <Toggle label="Stage Hazards" checked={!!mods.stageHazards} onChange={v => saveMods({ ...mods, stageHazards: v })} />
          <Toggle label="Hazard Zones" checked={!!mods.brHazards} onChange={v => saveMods({ ...mods, brHazards: v })} />
          <Toggle label="Knockback Items" checked={!!mods.brItems} onChange={v => saveMods({ ...mods, brItems: v })} />
          <Toggle label="Friendly Fire" checked={!!mods.friendlyFire} onChange={v => saveMods({ ...mods, friendlyFire: v })} />
          <Toggle label="Items" checked={!!mods.items} onChange={v => saveMods({ ...mods, items: v })} />
          <Toggle label="Freeze AI" checked={!!mods.freezeAI} onChange={v => saveMods({ ...mods, freezeAI: v })} />
          <Toggle label="Hitbox Overlay" checked={!!mods.showHitboxes} onChange={v => saveMods({ ...mods, showHitboxes: v })} />
          <Toggle label="Hurtbox Overlay" checked={!!mods.showHurtboxes} onChange={v => saveMods({ ...mods, showHurtboxes: v })} />
          <Toggle label="Frame Data" checked={!!mods.showFrameData} onChange={v => saveMods({ ...mods, showFrameData: v })} />
          <Toggle label="Combo Counter" checked={!!mods.comboCounter} onChange={v => saveMods({ ...mods, comboCounter: v })} />
          <Toggle label="Damage Counter" checked={!!mods.damageCounter} onChange={v => saveMods({ ...mods, damageCounter: v })} />
          <Toggle label="Upside Down" checked={!!mods.upsideDown} onChange={v => saveMods({ ...mods, upsideDown: v })} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">DMG%</span><input type="range" min={0.25} max={4} step={0.25} value={mods.damageMultiplier} onChange={e => saveMods({ ...mods, damageMultiplier: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.damageMultiplier}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">GRAV</span><input type="range" min={0.25} max={3} step={0.25} value={mods.gravity} onChange={e => saveMods({ ...mods, gravity: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.gravity}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">JUMP</span><input type="range" min={0.5} max={2.5} step={0.25} value={mods.jumpHeight} onChange={e => saveMods({ ...mods, jumpHeight: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.jumpHeight}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">SPEED</span><input type="range" min={0.25} max={3} step={0.25} value={mods.movementSpeed} onChange={e => saveMods({ ...mods, movementSpeed: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.movementSpeed}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">SUPER RATE</span><input type="range" min={0.25} max={4} step={0.25} value={mods.superChargeRate} onChange={e => saveMods({ ...mods, superChargeRate: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.superChargeRate}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">POWER CD</span><input type="range" min={0.25} max={4} step={0.25} value={mods.powerCooldownRate} onChange={e => saveMods({ ...mods, powerCooldownRate: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.powerCooldownRate}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">SLOW-MO</span><input type="range" min={0.1} max={2} step={0.1} value={mods.slowMotion} onChange={e => saveMods({ ...mods, slowMotion: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.slowMotion}x</span></label>
          <label className="flex items-center gap-1"><span className="font-heading text-muted-foreground">RESPAWN</span><input type="range" min={0.5} max={5} step={0.5} value={mods.respawnTime} onChange={e => saveMods({ ...mods, respawnTime: parseFloat(e.target.value) })} className="w-full" /><span className="w-8">{mods.respawnTime}s</span></label>
        </div>
        <p className="text-[9px] text-muted-foreground">All modifiers are saved to your profile and take effect immediately in every match.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={startMatch} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-heading text-base hover:opacity-80"><GameIcon emoji="▶" size={14} /> START MATCH</button>
        <button onClick={() => setMods(defaultMods())} className="px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-heading text-xs">RESET MODS</button>
      </div>
    </div>
  );
}