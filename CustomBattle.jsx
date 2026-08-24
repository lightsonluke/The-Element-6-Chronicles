import React, { useState, useEffect, useRef } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { createFighter, updateFighter, checkHit, applyHit, updateAI, updateProjectiles, drawProjectiles, loseStock } from './fighter.js';
import { getKeybinds, readPlayerInput, readSinglePlayerInput } from './keybinds.js';
import { POWER_EFFECTS, getPowerEffect } from './powerEffects.js';
import {
  drawStickman, drawAttackEffect, drawSuperEffect, drawHealthBar,
  drawTimer, drawPlatforms, drawBackground, drawHitSparks,
  drawDoubleJumpParticles, drawSuperFlash, STAGE_MAPS,
} from './renderer.js';
import { MAP_PLATFORMS } from './PlatformFighter.jsx';
import { applyStageMaterials } from './stageMaterials.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, isBehindAccessory, drawAccessory, resolveAccColor } from './cosmetics.js';
import { drawShikigamiFollower } from './shikigami.js';
import { useClipRecorder } from './useClipRecorder.js';
import PauseMenu from './PauseMenu.jsx';
import CharStats from './CharStats.jsx';
import ElementSelect from './ElementSelect.jsx';
import { applyElement } from './elements.js';
import { withCustomChars } from './characterNumber.js';
import { buildHazardsFromStage, buildObjectsFromStage, updateSandboxHazards, updateSandboxObjects, processSandboxObjectHits, drawHazards as drawSBHazards, drawObjects as drawSBObjects } from './stageHazards.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { getEmoteForKey } from './emoteSlots.js';
import { getEmoteById } from './emotes.js';
import GameIcon from "./GameIcon.jsx";

const W = 1280, H = 720;
const MAX_PLAYERS = 8;
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

const BASE_ALL = ALL_CHARS;

const PLAYER_COLORS = ['#FF4444', '#4488FF', '#44FF88', '#FFAA44', '#FF44FF', '#44FFFF', '#FFFF44', '#AA66FF'];
const TEAM_COLORS_CUSTOM = ['#FF4444', '#4444FF', '#44FF44', '#AA44FF'];
const TEAM_NAMES = ['RED', 'BLUE', 'GREEN', 'PURPLE'];

const LARGE_MAPS = new Set(['grandarena', 'skycitadel', 'colossalcoliseum', 'infiniteexpanse']);

function drawPowerBar(ctx, fighter, bx, by, w = 100, h = 6) {
  const effect = fighter.char ? getPowerEffect(fighter.char.id, fighter.char) : null;
  if (!effect) return;
  const maxCD = effect.cooldown * 60;
  ctx.fillStyle = '#111122'; ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill();
  if (fighter.powerActive && fighter.powerTimer > 0) {
    const pulse = 0.5 + Math.sin(fighter.frame * 0.2) * 0.3;
    ctx.fillStyle = fighter.char.color; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill(); ctx.globalAlpha = 1;
  } else if (fighter.powerCooldown <= 0) {
    ctx.fillStyle = '#44FF88'; ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill(); ctx.shadowBlur = 0;
  } else {
    const pct = 1 - fighter.powerCooldown / maxCD;
    ctx.fillStyle = '#44FF88'; ctx.beginPath(); ctx.roundRect(bx, by - h, w * pct, h, 3); ctx.fill();
  }
}

function drawSuperMeter(ctx, fighter, bx, by, w = 100, h = 8) {
  const pct = fighter.superMeter / fighter.maxSuper;
  ctx.fillStyle = '#111122'; ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 4); ctx.fill();
  if (pct >= 1) {
    const pulse = 0.7 + Math.sin(fighter.frame * 0.2) * 0.3;
    ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8 * pulse;
    ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 4); ctx.fill(); ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = fighter.char.color;
    ctx.beginPath(); ctx.roundRect(bx, by - h, w * pct, h, 4); ctx.fill();
  }
}

export default function CustomBattle({ onBack, unlockedIds, favoriteId, equippedAccessories = {}, equippedSkins = {}, musicVolume = 50, sfxVolume = 70, customStages = [], settings = {}, charLevels = {}, equippedElements = {}, onEquipElement, customCharsData = {}, customNumberMap = {}, sandboxConfig = null, equippedShikigami = {}, equippedEmotes = {} }) {
  const [phase, setPhase] = useState(sandboxConfig ? 'fight' : 'setup');
  const [numPlayers, setNumPlayers] = useState(sandboxConfig?.players?.length || 4);
  const [numHumans, setNumHumans] = useState(sandboxConfig?.numHumans ?? 1);
  const [selectedMap, setSelectedMap] = useState(sandboxConfig?.mapId || 'splitcity');
  const [useCustomStage, setUseCustomStage] = useState(sandboxConfig?.customStageIdx ?? null); // index or null
  const [elements, setElements] = useState(() => {
    if (sandboxConfig) return Array.from({ length: MAX_PLAYERS }, () => 'basic');
    return Array.from({ length: MAX_PLAYERS }, (_, i) => i === 0 ? (equippedElements?.[favoriteId || 'yellow'] || 'basic') : 'basic');
  });
  const [rematchNonce, setRematchNonce] = useState(0);
  const [teamBattle, setTeamBattle] = useState(false);
  const [teamAssignments, setTeamAssignments] = useState(() => Array.from({ length: MAX_PLAYERS }, (_, i) => i % 2));
  const [teamDamage, setTeamDamage] = useState(true);
  const [matchTime, setMatchTime] = useState(sandboxConfig?.matchTime ?? settings.matchTime ?? 240);
  const unlockedSet = new Set(unlockedIds || ['yellow']);
  const defaultDiff = settings.defaultCPUDifficulty || 'regular';
  const ALL = withCustomChars(BASE_ALL, customCharsData, customNumberMap);
  const getCharData = (id) => ALL.find(c => c.id === id);
  const selectableAll = ALL.filter(c => c.id !== 'evil');

  const [fighters, setFighters] = useState(() => {
    if (sandboxConfig?.players) {
      const arr = [];
      for (let i = 0; i < MAX_PLAYERS; i++) {
        if (i < sandboxConfig.players.length) {
          arr.push({ charId: sandboxConfig.players[i].char, difficulty: sandboxConfig.players[i].difficulty || 'regular' });
        } else {
          arr.push({ charId: 'yellow', difficulty: 'regular' });
        }
      }
      return arr;
    }
    const pool = selectableAll.length > 0 ? selectableAll : ALL.filter(c => c.id !== 'evil');
    const used = new Set();
    const chars = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const available = pool.filter(c => !used.has(c.id));
      const pick = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[0];
      used.add(pick.id);
      chars.push({ charId: pick.id, difficulty: defaultDiff });
    }
    return chars;
  });

  const setFighterChar = (idx, charId) => {
    setFighters(prev => prev.map((f, i) => i === idx ? { ...f, charId } : f));
    setElements(prev => prev.map((e, i) => i === idx ? (equippedElements?.[charId] || 'basic') : e));
  };
  const setFighterDiff = (idx, difficulty) => setFighters(prev => prev.map((f, i) => i === idx ? { ...f, difficulty } : f));
  const randomChar = (exclude = []) => {
    const pool = selectableAll.filter(c => !exclude.includes(c.id));
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : (selectableAll[0] || ALL[0]).id;
  };

  // Build combined stage list: standard + 4 large + custom
  const standardMaps = STAGE_MAPS;
  const largeMapEntries = STAGE_MAPS.filter(m => LARGE_MAPS.has(m.id));
  const regularMapEntries = STAGE_MAPS.filter(m => !LARGE_MAPS.has(m.id));

  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-5xl max-h-[85vh] overflow-y-auto pr-1">
        <div className="flex justify-between items-center w-full sticky top-0 z-10 bg-background/80 backdrop-blur py-2">
          <h2 className="text-2xl font-heading text-accent tracking-wider">CUSTOM BATTLE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        <div className="flex gap-4 items-center bg-card border border-border rounded-xl px-5 py-3 w-full flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-heading text-muted-foreground">FIGHTERS:</span>
            <input type="range" min="2" max={MAX_PLAYERS} value={numPlayers} onChange={e => { const n = parseInt(e.target.value); setNumPlayers(n); if (numHumans > n) setNumHumans(n); }} className="w-32 accent-primary" />
            <span className="font-heading text-accent text-lg w-8">{numPlayers}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-heading text-muted-foreground">HUMANS:</span>
            <input type="range" min="0" max={Math.min(2, numPlayers)} value={numHumans} onChange={e => setNumHumans(parseInt(e.target.value))} className="w-24 accent-primary" />
            <span className="font-heading text-primary text-lg w-8">{numHumans}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-heading text-muted-foreground">TIME:</span>
            <select value={matchTime} onChange={e => setMatchTime(parseInt(e.target.value))} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value={0}>Infinite</option><option value={60}>1:00</option><option value={120}>2:00</option><option value={180}>3:00</option><option value={240}>4:00</option><option value={300}>5:00</option>
            </select>
          </div>
        </div>

        {/* Team Battle toggle */}
        <div className="flex gap-4 items-center bg-card border border-border rounded-xl px-5 py-3 w-full flex-wrap">
          <label className="flex items-center gap-2 text-xs font-heading">
            <input type="checkbox" checked={teamBattle} onChange={e => setTeamBattle(e.target.checked)} />
            TEAM BATTLE
          </label>
          {teamBattle && (
            <>
              <label className="flex items-center gap-2 text-xs font-body">
                <input type="checkbox" checked={teamDamage} onChange={e => setTeamDamage(e.target.checked)} />
                Team Damage
              </label>
              <div className="flex gap-2 flex-wrap">
                {fighters.slice(0, numPlayers).map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-[10px] font-heading" style={{ color: PLAYER_COLORS[idx] }}>P{idx+1}</span>
                    <select value={teamAssignments[idx]} onChange={e => setTeamAssignments(prev => prev.map((t, i) => i === idx ? parseInt(e.target.value) : t))}
                      className="px-1 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-body">
                      {TEAM_NAMES.map((name, ti) => <option key={ti} value={ti}>{name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {fighters.slice(0, numPlayers).map((f, idx) => {
            const isHuman = idx < numHumans;
            const charData = getCharData(f.charId);
            return (
              <div key={idx} className="flex flex-col gap-2 bg-card border-2 rounded-xl p-3" style={{ borderColor: PLAYER_COLORS[idx] + '66' }}>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs" style={{ color: PLAYER_COLORS[idx] }}>P{idx + 1} {isHuman ? '👤 HUMAN' : '🤖 CPU'}</span>
                  <button onClick={() => setFighterChar(idx, randomChar(fighters.slice(0, numPlayers).filter((_, j) => j !== idx).map(x => x.charId)))} className="text-xs px-2 py-0.5 bg-primary/30 rounded hover:opacity-80"><GameIcon emoji="🎲" size={14} /></button>
                </div>
                <div className="w-10 h-10 rounded-full mx-auto" style={{ backgroundColor: charData?.color || '#888' }} />
                <p className="text-center text-[10px] font-heading truncate">{charData?.name || '—'}</p>
                <div className="grid grid-cols-4 gap-0.5 max-h-24 overflow-y-auto p-1 border rounded bg-background/40">
                  {selectableAll.map(c => (
                    <button key={c.id} onClick={() => setFighterChar(idx, c.id)} className={`flex flex-col items-center p-0.5 rounded ${f.charId === c.id ? 'bg-accent/30 ring-1 ring-accent' : 'hover:bg-muted/40'}`}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-muted-foreground text-center">All characters available.</p>
                {!isHuman && (
                  <select value={f.difficulty} onChange={e => setFighterDiff(idx, e.target.value)} className="px-1 py-1 bg-secondary text-secondary-foreground rounded text-[10px] font-body">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                {isHuman && <CharStats char={charData} element={elements[idx]} />}
                {isHuman && <ElementSelect charId={f.charId} currentElement={elements[idx]} onSelect={(el) => setElements(prev => prev.map((e, i) => i === idx ? el : e))} charLevels={charLevels} label={`P${idx + 1} ELEMENT`} />}
              </div>
            );
          })}
        </div>

        {/* Custom stages */}
        {customStages.length > 0 && (
          <div className="w-full">
            <p className="text-xs font-heading text-muted-foreground mb-2">CUSTOM STAGES:</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setUseCustomStage(null)} className={`px-3 py-2 rounded-lg font-heading text-[10px] ${useCustomStage === null ? 'bg-accent text-accent-foreground' : 'bg-secondary/60 hover:opacity-80'}`}>Use Built-in Map</button>
              {customStages.map((s, i) => (
                <button key={i} onClick={() => setUseCustomStage(i)} className={`px-3 py-2 rounded-lg font-heading text-[10px] ${useCustomStage === i ? 'bg-accent text-accent-foreground' : 'bg-secondary/60 hover:opacity-80'}`}>{s.emoji || <GameIcon emoji="🎨" size={14} />} {s.name || `Custom ${i + 1}`}</button>
              ))}
            </div>
          </div>
        )}

        {/* Stage select */}
        {useCustomStage === null && (
          <div className="w-full">
            <button onClick={() => { const pool = regularMapEntries.length > 0 ? regularMapEntries : STAGE_MAPS; setSelectedMap(pool[Math.floor(Math.random() * pool.length)].id); }}
              className="w-full mb-3 bg-card border-2 border-accent rounded-xl p-3 hover:opacity-80 transition flex items-center justify-center gap-3"
              style={{ borderColor: '#FFD700', background: 'linear-gradient(135deg, #FFD70015 0%, #0a0b16 50%)' }}>
              <span className="text-2xl">🎲</span>
              <span className="font-heading text-sm text-accent">RANDOM STAGE</span>
              <span className="text-[8px] text-muted-foreground font-body">— picks a random non-custom stage</span>
            </button>
            <p className="text-xs font-heading text-muted-foreground mb-1">LARGE MAPS (for 4+ players):</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              {largeMapEntries.map(map => (
                <button key={map.id} onClick={() => setSelectedMap(map.id)} className={`px-2 py-2 rounded-lg font-heading text-[10px] text-center transition ${selectedMap === map.id ? 'bg-accent text-accent-foreground scale-105' : 'bg-primary/15 text-primary hover:opacity-80'}`}>{map.name}</button>
              ))}
            </div>
            <p className="text-xs font-heading text-muted-foreground mb-1">STANDARD MAPS:</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1 max-h-36 overflow-y-auto p-1 border border-border rounded-xl bg-card/50">
              {regularMapEntries.map(map => (
                <button key={map.id} onClick={() => setSelectedMap(map.id)} className={`px-2 py-2 rounded-lg font-heading text-[10px] text-center transition ${selectedMap === map.id ? 'bg-accent text-accent-foreground scale-105' : 'bg-secondary/60 text-secondary-foreground hover:opacity-80'}`}>{map.name}</button>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setPhase('fight')} className="px-10 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg sticky bottom-0">START CUSTOM BATTLE</button>
      </div>
    );
  }

  // Determine platforms and mapId
  let customPlatforms = null;
  let customSpawnPoints = null;
  let customHazards = null;
  let customObjects = null;
  let resolvedMapId = selectedMap;
  if (useCustomStage !== null && customStages[useCustomStage]) {
    customPlatforms = applyStageMaterials(customStages[useCustomStage].platforms || customStages[useCustomStage], 'custom');
    customSpawnPoints = customStages[useCustomStage].spawnPoints || null;
    customHazards = sandboxConfig?.customHazards ?? customStages[useCustomStage].hazards ?? null;
    customObjects = sandboxConfig?.customObjects ?? customStages[useCustomStage].objects ?? null;
    resolvedMapId = 'custom';
  }

  const activeFighters = fighters.slice(0, numPlayers).map((f, i) => ({ ...f, isHuman: sandboxConfig ? (sandboxConfig.players[i]?.type === 'human') : (i < numHumans) }));

  return (
    <CustomFight
      key={rematchNonce}
      fighters={activeFighters} mapId={resolvedMapId} customPlatforms={customPlatforms}
      customSpawnPoints={customSpawnPoints} customHazards={customHazards} customObjects={customObjects}
      matchTime={matchTime} onEnd={() => { onBack(); }} onRematch={() => setRematchNonce(n => n + 1)}
      musicVolume={musicVolume} sfxVolume={sfxVolume}
      equippedAccessories={equippedAccessories} equippedSkins={equippedSkins} equippedShikigami={equippedShikigami}
      teamBattle={teamBattle} teamAssignments={teamAssignments} teamDamage={teamDamage}
      settings={settings} elements={elements}
      customCharsData={customCharsData} customNumberMap={customNumberMap}
      equippedEmotes={equippedEmotes}
    />
  );
}

function CustomFight({ fighters, mapId, customPlatforms, customSpawnPoints = null, customHazards = null, customObjects = null, matchTime = 240, onEnd, onRematch, musicVolume, sfxVolume = 70, equippedAccessories, equippedSkins, equippedShikigami = {}, settings = {}, teamBattle = false, teamAssignments = [], teamDamage = true, elements = [], customCharsData = {}, customNumberMap = {}, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [winner, setWinner] = useState(null);
  const [winTeam, setWinTeam] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  useClipRecorder(canvasRef);
  const equippedShikigamiRef = useRef(equippedShikigami);
  equippedShikigamiRef.current = equippedShikigami;

  // Generate random cosmetics for bot fighters
  const botCharIds = fighters.filter(f => !f.isHuman).map(f => f.charId);
  const { equippedAccessories: mergedAccessories, equippedShikigami: mergedShikigami } = mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIds);
  const equippedAccessoriesRef = useRef(mergedAccessories);
  equippedAccessoriesRef.current = mergedAccessories;
  equippedShikigamiRef.current = mergedShikigami;

  const platforms = customPlatforms || applyStageMaterials(MAP_PLATFORMS[mapId] || MAP_PLATFORMS.splitcity, mapId);
  const isLarge = LARGE_MAPS.has(mapId);
  const mapObj = STAGE_MAPS.find(m => m.id === mapId);
  const ALL = withCustomChars(BASE_ALL, customCharsData, customNumberMap);
  const getCharData = (id) => ALL.find(c => c.id === id);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const defaultSpawnY = platforms[0]?.y ?? 620;
    const fallbackSpawnXs = fighters.map((_, i) => {
      const n = fighters.length;
      const spread = Math.min(1100, n * 140);
      const startX = W / 2 - spread / 2;
      return startX + (n > 1 ? (spread / (n - 1)) * i : 0);
    });

    const gameFighters = fighters.map((f, i) => {
      const charData = getCharData(f.charId); if (!charData) return null;
      const modifiedChar = f.isHuman ? { ...charData, stats: applyElement(charData.stats || {}, elements[i] || 'basic'), shikigamiId: equippedShikigami?.[f.charId] } : charData;
      const pin = customSpawnPoints && customSpawnPoints[i];
      const sx = pin ? pin.x : (fallbackSpawnXs[i] || (200 + i * 120));
      const sy = pin ? pin.y : defaultSpawnY;
      const fighter = createFighter(modifiedChar, sx, sy, i % 2 === 0 ? 1 : -1);
      if (pin) fighter.respawnPoint = { x: pin.x, y: pin.y };
      fighter.grounded = true;
      fighter.isAI = !f.isHuman;
      fighter.cpuDifficulty = f.difficulty || 'regular';
      fighter.playerIndex = i;
      return fighter;
    }).filter(Boolean);

    if (gameFighters.length === 0) return;

    const initTimer = matchTime > 0 ? matchTime : 99999;
    gameRef.current = { fighters: gameFighters, running: true, timer: initTimer, camX: 0, camY: 0, camZoom: 0.75 };

    const finish = (winnerIdx) => {
      if (!gameRef.current) return;
      gameRef.current.running = false;
      let wName;
      if (teamBattle && winnerIdx >= 0) {
        wName = `${TEAM_NAMES[teamAssignments[winnerIdx] % 4]} TEAM`;
      } else {
        wName = winnerIdx === null || winnerIdx < 0 ? 'Draw' : gameFighters[winnerIdx].char.name;
      }
      gameRef.current.result = { winner: wName };
      setWinTeam(teamBattle && winnerIdx >= 0 ? teamAssignments[winnerIdx] % 4 : null);
      setWinner(wName);
    };

    const kd = e => {
      keysRef.current[e.key] = true; keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { pausedRef.current = !pausedRef.current; setPaused(v => !v); }
      // Emotes — number keys 1-0
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const _numHumans = fighters.filter(f => f.isHuman).length;
        const _emoteMode = _numHumans >= 2 ? 'coop' : 'solo';
        if (_emoteMode === 'coop' && ['1','2','3','4','5'].includes(e.key)) {
          const emote = getEmoteForKey(e.key, equippedEmotes, 2, 'coop');
          const f = gameFighters[1];
          if (emote && f && f.grounded && !f.emote) f.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        } else {
          const emote = getEmoteForKey(e.key, equippedEmotes, 1, _emoteMode);
          const f = gameFighters[0];
          if (emote && f && f.grounded && !f.emote) f.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        }
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let shakeMag = 0;
    let superFlashes = [];
    let killFeed = [];
    let prevStocks = gameFighters.map(f => f.stocks);
    // Stage-placed hazard zones + knockback items
    let sbHazards = (customHazards && customHazards.length > 0) ? buildHazardsFromStage(customHazards) : null;
    let sbObjects = (customObjects && customObjects.length > 0) ? buildObjectsFromStage(customObjects) : null;

    const loop = (now) => {
      if (!gameRef.current?.running) return;
      if (pausedRef.current) { requestAnimationFrame(loop); return; }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      gameRef.current.timer -= dt;
      const fs = gameFighters;

      const _aliveList = fs.filter(f => f.stocks > 0);
      const aliveCount = _aliveList.length;
      const aliveTeams = teamBattle ? new Set(_aliveList.map(f => teamAssignments[f.playerIndex])) : null;
      if (aliveCount <= 1 || (teamBattle && aliveTeams.size <= 1) || (matchTime > 0 && gameRef.current.timer <= 0)) {
        if (teamBattle) {
          if (aliveTeams.size <= 1) {
            const winnerTeam = aliveTeams.size === 1 ? [...aliveTeams][0] : -1;
            finish(winnerTeam >= 0 ? fs.findIndex(f => f.stocks > 0 && teamAssignments[f.playerIndex] === winnerTeam) : -1);
          } else if (matchTime > 0 && gameRef.current.timer <= 0) {
            const teamStocks = {};
            fs.forEach(f => { const t = teamAssignments[f.playerIndex]; teamStocks[t] = (teamStocks[t] || 0) + f.stocks; });
            const maxStocks = Math.max(...Object.values(teamStocks));
            const winningTeam = Object.keys(teamStocks).find(t => teamStocks[t] === maxStocks);
            finish(fs.findIndex(f => teamAssignments[f.playerIndex] == winningTeam));
          } else {
            fs.forEach(f => { if (f.stocks > 0) { f.stocks = 1; f.damage = 300; } else { f.stocks = 0; } });
            gameRef.current.timer = 120;
          }
        } else {
          if (aliveCount === 1) { finish(fs.findIndex(f => f.stocks > 0)); }
          else {
            fs.forEach(f => { if (f.stocks > 0) { f.stocks = 1; f.damage = 300; } else { f.stocks = 0; } });
            if (fs.filter(f => f.stocks > 0).length <= 1) { finish(fs.findIndex(f => f.stocks > 0)); }
            else { gameRef.current.timer = 120; }
          }
        }
        if (!gameRef.current.running) return;
      }

      const k = keysRef.current;
      const singleHuman = fighters.filter(f => f.isHuman).length === 1;
      const _kb = getKeybinds(settings);
      const p1In = singleHuman ? readSinglePlayerInput(k, _kb.p1, _kb.p2) : readPlayerInput(k, _kb.p1);
      const p2In = readPlayerInput(k, _kb.p2);

      fs.forEach((f, i) => {
        if (f.stocks <= 0) return;
        let input;
        if (i === 0 && fighters[0].isHuman) input = p1In;
        else if (i === 1 && fighters[1].isHuman && fighters.length > 1) input = p2In;
        else {
          let nearest = null, minDist = Infinity;
          fs.forEach(other => {
            if (other === f || other.stocks <= 0) return;
            if (teamBattle && teamAssignments[other.playerIndex] === teamAssignments[f.playerIndex]) return;
            const d = Math.abs(other.x - f.x) + Math.abs(other.y - f.y);
            if (d < minDist) { minDist = d; nearest = other; }
          });
          input = nearest ? updateAI(f, nearest, f.cpuDifficulty, platforms, 1 + ((settings.aiAggression ?? 50) - 50) / 100, settings.botPersonality || 'balanced') : NO_INPUT;
        }
        const wasSuper = f.state === 'superAttack';
        const _isEnemy = (o) => o !== f && o.stocks > 0 && (!teamBattle || teamAssignments[o.playerIndex] !== teamAssignments[f.playerIndex]);
        f._allOpponents = fs.filter(_isEnemy);
        const _nearestEnemy = fs.find(_isEnemy);
        if (f.emote && f.emote.timer > 0) input = NO_INPUT;
        updateFighter(f, input, platforms, W, H, _nearestEnemy);
        updateProjectiles(f, _nearestEnemy);
        if (!wasSuper && f.state === 'superAttack') { superFlashes.push({ name: f.char.superMove?.name, color: f.char.color, progress: 0 }); shakeMag = Math.max(shakeMag, 18); sfx.superActivate(); }
      });

      // Update emote timers — cancel if airborne, decrement timer, update progress
      fs.forEach(f => {
        if (f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) { if (f.emote.key && keysRef.current[f.emote.key]) { f.emote.timer = f.emote.maxTimer; } else { f.emote = null; } } }
        }
      });

      for (let i = 0; i < fs.length; i++) {
        for (let j = 0; j < fs.length; j++) {
          if (i === j) continue;
          const atk = fs[i], def = fs[j];
          if (atk.stocks <= 0 || def.stocks <= 0) continue;
          if (teamBattle && teamAssignments[atk.playerIndex] === teamAssignments[def.playerIndex]) continue;
          if (checkHit(atk, def)) {
            const _isSuper = atk.state === 'superAttack';
            const _isHeavy = atk.attackData && atk.attackData.isHeavy;
            applyHit(atk, def);
            if (_isSuper) { shakeMag = Math.max(shakeMag, 22); sfx.superImpact(); }
            else if (_isHeavy) { shakeMag = Math.max(shakeMag, 12); sfx.heavyHit(); }
            else { shakeMag = Math.max(shakeMag, 7); sfx.hit(); }
          }
        }
      }

      // 700+ damage instant death + kill feed
      fs.forEach((f, i) => {
        if (f._pendingDeath && f.stocks > 0) { f._pendingDeath = false; loseStock(f, W, H); }
        if (prevStocks[i] !== f.stocks && f._lastHitBy && f._lastHitBy.stocks > 0) {
          killFeed.push({ killer: f._lastHitBy.char.name, victim: f.char.name, timer: 180 });
        }
      });
      prevStocks = fs.map(f => f.stocks);

      // Stage-placed hazard zones + knockback items
      if (sbHazards) updateSandboxHazards(sbHazards, fs, dt);
      if (sbObjects) { updateSandboxObjects(sbObjects, fs, platforms, dt, W, H); processSandboxObjectHits(fs, sbObjects, platforms); }

      // Platform deletion (Evil's Erasure) — removes any platform, even the last
      fs.forEach(ff => {
        if (ff._platformsToDelete > 0) {
          ff._platformsToDelete--;
          const avail = platforms.filter(p => !p._deleted || p._deleted <= 0);
          if (avail.length > 0) { avail[Math.floor(Math.random() * avail.length)]._deleted = 600; }
        }
      });
      platforms.forEach(p => { if (p._deleted > 0) p._deleted--; });

      // Dynamic camera — more zoomed out than normal fights, accommodates many fighters
      const aliveFs = fs.filter(f => f.stocks > 0);
      if (aliveFs.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        aliveFs.forEach(f => { minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); minY = Math.min(minY, f.y); maxY = Math.max(maxY, f.y); });
        const spreadX = (maxX - minX) + 280;
        const spreadY = (maxY - minY) + 280;
        const fitZoom = Math.min(W / Math.max(spreadX, 300), H / Math.max(spreadY, 250));
        let targetZoom = Math.max(isLarge ? 0.40 : 0.45, Math.min(0.90, fitZoom));
        const g = gameRef.current;
        g.camZoom += (targetZoom - g.camZoom) * 0.05;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2 - 50;
        const targetCamX = (midX - W / 2) * (1 - g.camZoom);
        const targetCamY = (midY - H / 2) * (1 - g.camZoom);
        g.camX += (targetCamX - g.camX) * 0.08;
        g.camY += (targetCamY - g.camY) * 0.08;
      }

      let shakeX = 0, shakeY = 0;
      if (shakeMag > 0.3) { shakeX = (Math.random() - 0.5) * shakeMag; shakeY = (Math.random() - 0.5) * shakeMag; shakeMag *= 0.72; }

      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.restore();
      drawBackground(ctx, W, H, fs[0].frame, mapId);

      const g = gameRef.current;
      ctx.save();
      ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
      ctx.scale(g.camZoom, g.camZoom);
      ctx.translate(-W / 2 - g.camX, -H / 2 - g.camY);

      drawPlatforms(ctx, platforms, fs[0].frame, mapId);
      // Stage-placed hazard zones + knockback items
      if (sbHazards) drawSBHazards(ctx, sbHazards, fs[0].frame);
      if (sbObjects) drawSBObjects(ctx, sbObjects, fs[0].frame);

      // KO blast zone indicators — larger for big maps
      ctx.save();
      ctx.strokeStyle = '#FF3333'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]);
      ctx.globalAlpha = 0.5 + Math.sin(fs[0].frame * 0.06) * 0.15;
      ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 8;
      const BLAST_L = isLarge ? -800 : -500, BLAST_R = isLarge ? W + 800 : W + 500, BLAST_T = isLarge ? -800 : -600, BLAST_B = isLarge ? H + 600 : H + 450;
      ctx.beginPath(); ctx.moveTo(BLAST_L, BLAST_T); ctx.lineTo(BLAST_R, BLAST_T); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BLAST_L, BLAST_B); ctx.lineTo(BLAST_R, BLAST_B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BLAST_L, BLAST_T); ctx.lineTo(BLAST_L, BLAST_B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BLAST_R, BLAST_T); ctx.lineTo(BLAST_R, BLAST_B); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();

      fs.forEach((f, i) => {
        if (f.stocks <= 0) return;
        const flashing = f.invincible > 0 && Math.floor(f.frame / 4) % 2 === 0;
        if (flashing) return;
        ctx.save();
        const triColor = teamBattle ? TEAM_COLORS_CUSTOM[teamAssignments[i] % 4] : PLAYER_COLORS[i];
        ctx.fillStyle = triColor; ctx.shadowColor = triColor; ctx.shadowBlur = 6;
        const tx = f.x, ty = f.y - 90;
        ctx.beginPath(); ctx.moveTo(tx, ty - 8); ctx.lineTo(tx - 6, ty + 4); ctx.lineTo(tx + 6, ty + 4); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
        drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
        if (f._clone) { ctx.save(); ctx.globalAlpha = 0.5; drawStickman(ctx, f._clone.x, f._clone.y, getCharRenderColor(f.char.id, equippedSkins) || f.char.color, f._clone.facing || f.facing, f._clone.frame, 1, f.char.isSpirit, 'idle', f.char, null); ctx.globalAlpha = 0.6; ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(f.char.name, f._clone.x, f._clone.y - 72); ctx.restore(); }
        const renderColor = getCharRenderColor(f.char.id, equippedSkins) || f.char.color;
        const skinParts = getSkinParts(f.char.id, equippedSkins);
        const acc = getAccessory(equippedAccessoriesRef.current[f.char.id]);
        const skinColor = getCharRenderColor(f.char.id, equippedSkins);
        const accColor = skinColor && acc?.type === 'soccer_kit' ? skinColor : resolveAccColor(acc, f.char);
        skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1, f.char.id, f.state, f.facing, f.powerActive));
        if (acc && isBehindAccessory(acc.type)) drawAccessory(ctx, f.x, f.y, acc.type, accColor, f.frame, 1, f.char.id, f.state, f.facing, f.powerActive);
        drawShikigamiFollower(ctx, f, equippedShikigamiRef.current?.[f.char.id], f.frame, 1);
        drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame, 1, f.char.isSpirit, f.state, f.char, f.powerActive, false, null, f.emote);
        skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1, f.char.id, f.state, f.facing, f.powerActive));
        if (acc && !isBehindAccessory(acc.type)) drawAccessory(ctx, f.x, f.y, acc.type, accColor, f.frame, 1, f.char.id, f.state, f.facing, f.powerActive);
        if (f.attackData && f.state === 'attacking') drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || f.char.color, f.attackData.isNormal, f.char.id, f.char.power, f.powerActive);
        if (f.attackData && f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, f.char.color, f.attackData.progress, f.char.superMove?.name, f.char.id);
        if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame, he.spawnFrame));
      });
      fs.forEach(f => { if (f.stocks > 0) drawProjectiles(ctx, f); });
      ctx.restore();

      if (matchTime > 0) drawTimer(ctx, W, gameRef.current.timer);

      superFlashes = superFlashes.filter(sf => { sf.progress += dt * 0.55; drawSuperFlash(ctx, W, H, sf.name, sf.color, sf.progress); return sf.progress < 1; });

      // HUD (background hidden when stock boxes are hidden)
      const hudHeight = fs.length <= 4 ? 80 : 110;
      if (!settings?.hideStockBoxes) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, H - hudHeight, W, hudHeight);
      }
      const barW = fs.length <= 4 ? 150 : 120;
      const totalBarW = fs.length * (barW + 8);
      const startX = (W - totalBarW) / 2;
      fs.forEach((f, i) => {
        const bx = startX + i * (barW + 8);
        const by = H - hudHeight + (i % 2 === 0 ? 8 : (hudHeight > 80 ? 35 : 30));
        drawHealthBar(ctx, bx + barW / 2, by, f.damage, 240, f.char.color, `P${i + 1} ${f.char.name}`, f.stocks, null, 0, 0, 'left', false, settings?.hideStockBoxes);
      });

      // Power & Super bars for P1
      if (fs[0] && fs[0].stocks > 0) {
        drawPowerBar(ctx, fs[0], startX, H - 20, 80, 5);
        drawSuperMeter(ctx, fs[0], startX + 90, H - 20, 80, 5);
      }

      // Kill feed
      killFeed = killFeed.filter(kf => {
        kf.timer--;
        if (kf.timer <= 0) return false;
        const alpha = Math.min(1, kf.timer / 60);
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        const text = `${kf.killer} killed ${kf.victim}`;
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - tw / 2 - 12, 10, tw + 24, 26);
        ctx.fillStyle = '#FFD700'; ctx.fillText(text, W / 2, 28);
        ctx.restore();
        return true;
      });

      lastTime = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => { if (gameRef.current) gameRef.current.running = false; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [gameStarted, mapId, customPlatforms]);

  const finishQuit = () => { if (gameRef.current) { gameRef.current.running = false; onEnd?.(); } };

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        <button onClick={finishQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Menu</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause (ESC)</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="border-2 border-border rounded-lg shadow-2xl w-full" style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }} />
      {countdown > 0 && !settings?.hideCountdown && (<div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg"><span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span></div>)}
      {paused && !winner && <PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={finishQuit} />}
      {winner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/78 rounded-lg gap-4">
          <span className="text-5xl font-heading text-accent drop-shadow-lg">{winner === 'Draw' ? 'DRAW!' : `${winner} WON!`}</span>
          {teamBattle && winTeam != null && (
            <div className="flex flex-col items-center gap-1 mb-1">
              {fighters.filter((f, i) => teamAssignments[i] === winTeam).map((f, i) => (
                <span key={i} className="text-xl font-heading text-foreground/90">{getCharData(f.charId)?.name}</span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => onRematch?.()} className="px-6 py-3 bg-secondary text-secondary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">REMATCH</button>
            <button onClick={() => onEnd?.()} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">BACK TO MENU</button>
          </div>
        </div>
      )}
    </div>
  );
}