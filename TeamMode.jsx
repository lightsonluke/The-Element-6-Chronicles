import React, { useState, useEffect, useRef } from 'react';
import { ALL_CHARS } from './allCharacters.js';
import { createFighter, updateFighter, checkHit, applyHit, updateAI, updateProjectiles, drawProjectiles, loseStock } from './fighter.js';
import { getKeybinds, readPlayerInput, readSinglePlayerInput } from './keybinds.js';
import { drawStickman, drawAttackEffect, drawSuperEffect, drawHealthBar, drawPlatforms, drawBackground, drawHitSparks, drawDoubleJumpParticles, drawSuperFlash } from './renderer.js';
import { POWER_EFFECTS, getPowerEffect } from './powerEffects.js';
import { withCustomChars } from './characterNumber.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, getEquippedAccessories, isBehindAccessory, drawAccessory, resolveAccColor } from './cosmetics.js';
import { drawShikigamiFollower } from './shikigami.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { getEmoteForKey } from './emoteSlots.js';
import { useClipRecorder } from '../../hooks/useClipRecorder';
import PauseMenu from './PauseMenu';
import CharStats from './CharStats';
import ElementSelect from './ElementSelect';
import { applyElement } from './elements.js';
import GameIcon from "./GameIcon.jsx";

const W = 1280, H = 720;

const TEAM_PLATFORMS = [
  { x: 40, y: 620, w: 1200, h: 48 },
  { x: 100, y: 440, w: 300, h: 20 },
  { x: 880, y: 440, w: 300, h: 20 },
  { x: 460, y: 280, w: 360, h: 20 },
];

const TEAM_COLORS = { 1: '#FF4444', 2: '#4444FF' };
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];

const FORMATS = [
  { id: 'pp_cc', label: 'P+P vs C+C' },
  { id: 'pc_pc', label: 'P+C vs P+C' },
  { id: 'pc_cc', label: 'P+C vs C+C' },
];

const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

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

export default function TeamMode({ onBack, onEnd, unlockedIds, favoriteId, musicVolume, sfxVolume = 70, matchTime = 240, settings = {}, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, charLevels = {}, equippedElements = {}, onEquipElement, customCharsData = {}, customNumberMap = {}, equippedEmotes = {} }) {
  const [phase, setPhase] = useState('select');
  const [p1, setP1] = useState(favoriteId || 'yellow');
  const [p1b, setP1b] = useState('blue');
  const [p2, setP2] = useState('red');
  const [p2b, setP2b] = useState('green');
  const [cpuDifficulty, setCpuDifficulty] = useState(settings?.defaultCPUDifficulty || 'regular');
  const [teamDamage, setTeamDamage] = useState(true);
  const [showTriangles, setShowTriangles] = useState(true);
  const [teamFormat, setTeamFormat] = useState('pc_cc');
  const [p1Element, setP1Element] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [p1bElement, setP1bElement] = useState('basic');
  const [p2Element, setP2Element] = useState('basic');
  const [rematchNonce, setRematchNonce] = useState(0);

  useEffect(() => { setP1Element(equippedElements?.[p1] || 'basic'); }, [p1]);
  useEffect(() => { setP1bElement(equippedElements?.[p1b] || 'basic'); }, [p1b]);
  useEffect(() => { setP2Element(equippedElements?.[p2] || 'basic'); }, [p2]);

  const unlockedSet = new Set(unlockedIds || ['yellow']);
  const ALL = withCustomChars(ALL_CHARS, customCharsData, customNumberMap);

  const getLabel = (team, fighter) => {
    if (team === 1 && fighter === 1) return 'P1';
    if (team === 1 && fighter === 2) return teamFormat === 'pp_cc' ? 'P2' : 'CPU';
    if (team === 2 && fighter === 1) return teamFormat === 'pc_pc' ? 'P2' : 'CPU';
    return 'CPU';
  };

  const randomChar = (exclude = []) => {
    const pool = ALL.filter(c => unlockedSet.has(c.id) && !exclude.includes(c.id));
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : ALL[0].id;
  };

  if (phase === 'select') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-2xl font-heading text-accent tracking-wider">2v2 TEAM BATTLE</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        {/* Team format selector */}
        <div className="flex gap-2 items-center bg-card border border-border rounded-xl px-4 py-2">
          <span className="text-xs font-heading text-muted-foreground">FORMAT:</span>
          {FORMATS.map(f => (
            <button key={f.id} onClick={() => setTeamFormat(f.id)}
              className={`px-3 py-1 rounded font-heading text-xs ${teamFormat === f.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-8 items-start justify-center w-full">
          {/* Team 1 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-heading" style={{ color: TEAM_COLORS[1] }}>TEAM RED</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground">Fighter 1 ({getLabel(1, 1)})</p>
              <button onClick={() => setP1(randomChar([p1b, p2, p2b]))} className="text-[10px] px-1.5 py-0.5 bg-primary/40 text-primary-foreground rounded hover:opacity-80">RAND</button>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto p-1 border-2 rounded" style={{ borderColor: TEAM_COLORS[1] + '44' }}>
              {ALL.map(c => (
                <button key={c.id} onClick={() => setP1(c.id)} disabled={!unlockedSet.has(c.id)}
                  className={`flex flex-col items-center p-1 rounded border-2 ${p1 === c.id ? 'border-accent' : 'border-transparent'} ${!unlockedSet.has(c.id) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[7px] font-heading">{c.name.slice(0,5)}</span>
                </button>
              ))}
            </div>
            <CharStats char={ALL.find(c => c.id === p1)} element={p1Element} />
            <ElementSelect charId={p1} currentElement={p1Element} onSelect={setP1Element} charLevels={charLevels} label="P1 ELEMENT" />
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground">Fighter 2 ({getLabel(1, 2)})</p>
              <button onClick={() => setP1b(randomChar([p1, p2, p2b]))} className="text-[10px] px-1.5 py-0.5 bg-primary/40 text-primary-foreground rounded hover:opacity-80">RAND</button>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto p-1 border-2 rounded" style={{ borderColor: TEAM_COLORS[1] + '44' }}>
              {ALL.map(c => (
                <button key={c.id} onClick={() => setP1b(c.id)} disabled={!unlockedSet.has(c.id)}
                  className={`flex flex-col items-center p-1 rounded border-2 ${p1b === c.id ? 'border-accent' : 'border-transparent'} ${!unlockedSet.has(c.id) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[7px] font-heading">{c.name.slice(0,5)}</span>
                </button>
              ))}
            </div>
            {teamFormat === 'pp_cc' && (
              <>
                <CharStats char={ALL.find(c => c.id === p1b)} element={p1bElement} />
                <ElementSelect charId={p1b} currentElement={p1bElement} onSelect={setP1bElement} charLevels={charLevels} label="P2 ELEMENT" />
              </>
            )}
          </div>

          <span className="text-2xl font-heading text-destructive mt-8">VS</span>

          {/* Team 2 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-heading" style={{ color: TEAM_COLORS[2] }}>TEAM BLUE</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground">Fighter 1 ({getLabel(2, 1)})</p>
              <button onClick={() => setP2(randomChar([p1, p1b, p2b]))} className="text-[10px] px-1.5 py-0.5 bg-primary/40 text-primary-foreground rounded hover:opacity-80">RAND</button>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto p-1 border-2 rounded" style={{ borderColor: TEAM_COLORS[2] + '44' }}>
              {ALL.map(c => (
                <button key={c.id} onClick={() => setP2(c.id)} disabled={!unlockedSet.has(c.id)}
                  className={`flex flex-col items-center p-1 rounded border-2 ${p2 === c.id ? 'border-accent' : 'border-transparent'} ${!unlockedSet.has(c.id) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[7px] font-heading">{c.name.slice(0,5)}</span>
                </button>
              ))}
            </div>
            {teamFormat === 'pc_pc' && (
              <>
                <CharStats char={ALL.find(c => c.id === p2)} element={p2Element} />
                <ElementSelect charId={p2} currentElement={p2Element} onSelect={setP2Element} charLevels={charLevels} label="P2 ELEMENT" />
              </>
            )}
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground">Fighter 2 ({getLabel(2, 2)})</p>
              <button onClick={() => setP2b(randomChar([p1, p1b, p2]))} className="text-[10px] px-1.5 py-0.5 bg-primary/40 text-primary-foreground rounded hover:opacity-80">RAND</button>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto p-1 border-2 rounded" style={{ borderColor: TEAM_COLORS[2] + '44' }}>
              {ALL.map(c => (
                <button key={c.id} onClick={() => setP2b(c.id)} disabled={!unlockedSet.has(c.id)}
                  className={`flex flex-col items-center p-1 rounded border-2 ${p2b === c.id ? 'border-accent' : 'border-transparent'} ${!unlockedSet.has(c.id) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[7px] font-heading">{c.name.slice(0,5)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex gap-4 items-center bg-card border border-border rounded-xl px-4 py-2">
          <label className="flex items-center gap-2 text-xs font-body">
            <input type="checkbox" checked={teamDamage} onChange={e => setTeamDamage(e.target.checked)} />
            Team Damage
          </label>
          <label className="flex items-center gap-2 text-xs font-body">
            <input type="checkbox" checked={showTriangles} onChange={e => setShowTriangles(e.target.checked)} />
            Team Triangles
          </label>
          <select value={cpuDifficulty} onChange={e => setCpuDifficulty(e.target.value)}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body">
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <button onClick={() => setPhase('fight')}
          className="px-10 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg">
          START 2v2 BATTLE
        </button>
      </div>
    );
  }

  return (
    <TeamFight
      key={rematchNonce}
      p1={p1} p1b={p1b} p2={p2} p2b={p2b}
      cpuDifficulty={cpuDifficulty} teamDamage={teamDamage} showTriangles={showTriangles}
      teamFormat={teamFormat}
      onEnd={onEnd} onRematch={() => setRematchNonce(n => n + 1)} musicVolume={musicVolume} sfxVolume={sfxVolume}
      matchTime={matchTime} settings={settings}
      equippedAccessories={equippedAccessories} equippedSkins={equippedSkins} equippedShikigami={equippedShikigami}
      p1Element={p1Element}
      p1bElement={p1bElement}
      p2Element={p2Element}
      customCharsData={customCharsData} customNumberMap={customNumberMap}
      equippedEmotes={equippedEmotes}
    />
  );
}

function TeamFight({ p1, p1b, p2, p2b, cpuDifficulty, teamDamage, showTriangles, teamFormat, onEnd, onRematch, musicVolume, sfxVolume = 70, matchTime = 240, settings = {}, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, p1Element = 'basic', p1bElement = 'basic', p2Element = 'basic', customCharsData = {}, customNumberMap = {}, equippedEmotes = {} }) {
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

  const ALL = withCustomChars(ALL_CHARS, customCharsData, customNumberMap);
  const getCharData = (id) => ALL.find(c => c.id === id);

  // Determine which fighters are bots based on team format
  const botCharIds = [p1b, p2, p2b].filter((id, i) => {
    if (i === 0) return teamFormat !== 'pp_cc'; // p1b is CPU unless pp_cc
    if (i === 1) return teamFormat !== 'pc_pc'; // p2 is CPU unless pc_pc
    return true; // p2b always CPU
  });
  const { equippedAccessories: mergedAccessories, equippedShikigami: mergedShikigami } = mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIds);
  const botAccessoriesRef = useRef(mergedAccessories);
  botAccessoriesRef.current = mergedAccessories;
  const botShikigamiRef = useRef(mergedShikigami);
  botShikigamiRef.current = mergedShikigami;

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume);
    sfx.setVolume(sfxVolume);
    music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const c1 = getCharData(p1), c2 = getCharData(p1b), c3 = getCharData(p2), c4 = getCharData(p2b);
    const spawnY = TEAM_PLATFORMS[0].y;

    const f1 = createFighter({ ...c1, stats: applyElement(c1.stats || {}, p1Element) }, 250, spawnY, 1);
    const f2 = createFighter({ ...c2, stats: applyElement(c2.stats || {}, teamFormat === 'pp_cc' ? p1bElement : 'basic') }, 350, spawnY, 1);
    const f3 = createFighter({ ...c3, stats: applyElement(c3.stats || {}, teamFormat === 'pc_pc' ? p2Element : 'basic') }, 1030, spawnY, -1);
    const f4 = createFighter(c4, 930, spawnY, -1);
    f1.grounded = true; f2.grounded = true; f3.grounded = true; f4.grounded = true;

    f1.team = 1; f2.team = 1; f3.team = 2; f4.team = 2;
    f1.partner = f2; f2.partner = f1; f3.partner = f4; f4.partner = f3;

    // Set AI flags based on team format
    f2.isAI = teamFormat !== 'pp_cc';
    f3.isAI = teamFormat !== 'pc_pc';
    f4.isAI = true;
    f2.cpuDifficulty = cpuDifficulty;
    f3.cpuDifficulty = cpuDifficulty;
    f4.cpuDifficulty = cpuDifficulty;

    gameRef.current = { f1, f2, f3, f4, running: true, timer: matchTime > 0 ? matchTime : 99999 };

    const finish = (winningTeam) => {
      if (!gameRef.current) return;
      gameRef.current.running = false;
      setWinTeam(winningTeam);
      setWinner(winningTeam === 1 ? 'Team Red' : 'Team Blue');
      onEnd?.({ p1Won: winningTeam === 1, team: winningTeam });
    };

    const kd = e => {
      keysRef.current[e.key] = true;
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        pausedRef.current = !pausedRef.current; setPaused(v => !v);
      }
      // Emotes — number keys 1-0
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const _twoHumans = teamFormat === 'pp_cc';
        const _emoteMode = _twoHumans ? 'coop' : 'solo';
        if (_emoteMode === 'coop' && ['1','2','3','4','5'].includes(e.key)) {
          const emote = getEmoteForKey(e.key, equippedEmotes, 2, 'coop');
          if (emote && f2.grounded && !f2.emote) f2.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        } else {
          const emote = getEmoteForKey(e.key, equippedEmotes, 1, _emoteMode);
          if (emote && f1.grounded && !f1.emote) f1.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        }
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let shakeMag = 0;
    let killFeed = [];
    let prevStocks = [f1.stocks, f2.stocks, f3.stocks, f4.stocks];
    const fighters = [f1, f2, f3, f4];

    const loop = (now) => {
      if (!gameRef.current?.running) return;
      if (pausedRef.current) { requestAnimationFrame(loop); return; }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      gameRef.current.timer -= dt;

      // Check win condition
      const team1Alive = f1.stocks > 0 || f2.stocks > 0;
      const team2Alive = f3.stocks > 0 || f4.stocks > 0;
      if (!team1Alive || !team2Alive || gameRef.current.timer <= 0) {
        const t1Stocks = f1.stocks + f2.stocks;
        const t2Stocks = f3.stocks + f4.stocks;
        if (t1Stocks === t2Stocks) {
          f1.stocks = 1; f2.stocks = 1; f3.stocks = 1; f4.stocks = 1;
          f1.damage = 300; f2.damage = 300; f3.damage = 300; f4.damage = 300;
          gameRef.current.timer = 120;
        } else {
          finish(t1Stocks > t2Stocks ? 1 : 2);
          return;
        }
      }

      const k = keysRef.current;

      // Determine player-controlled fighters based on team format
      let p1Fighter = null, p2Fighter = null;
      if (teamFormat === 'pp_cc') {
        p1Fighter = f1.stocks > 0 ? f1 : (f2.stocks > 0 ? f2 : null);
        p2Fighter = (f1.stocks > 0 && f2.stocks > 0) ? f2 : null;
      } else if (teamFormat === 'pc_pc') {
        p1Fighter = f1.stocks > 0 ? f1 : null;
        p2Fighter = f3.stocks > 0 ? f3 : null;
      } else {
        p1Fighter = f1.stocks > 0 ? f1 : null;
      }

      // P1 input — single human gets both control schemes
      const singleHuman = !p2Fighter;
      const _kb = getKeybinds(settings);
      let p1In = p1Fighter ? (singleHuman ? readSinglePlayerInput(k, _kb.p1, _kb.p2) : readPlayerInput(k, _kb.p1)) : NO_INPUT;

      // P2 input
      let p2In = p2Fighter ? readPlayerInput(k, _kb.p2) : NO_INPUT;

      // Emote movement lock — if emote active, force no input
      if (p1Fighter && p1Fighter.emote && p1Fighter.emote.timer > 0) p1In = NO_INPUT;
      if (p2Fighter && p2Fighter.emote && p2Fighter.emote.timer > 0) p2In = NO_INPUT;

      // Helper: find first alive enemy
      const firstEnemy = (team) => team === 1 ? [f3, f4].find(f => f.stocks > 0) : [f1, f2].find(f => f.stocks > 0);

      // Set all opponents for power targeting
      fighters.forEach(f => {
        f._allOpponents = fighters.filter(o => o.team !== f.team && o.stocks > 0);
      });

      // Apply P1 input
      if (p1Fighter) {
        const opp = firstEnemy(p1Fighter.team);
        updateFighter(p1Fighter, p1In, TEAM_PLATFORMS, W, H, opp);
      }
      // Apply P2 input
      if (p2Fighter) {
        const opp = firstEnemy(p2Fighter.team);
        updateFighter(p2Fighter, p2In, TEAM_PLATFORMS, W, H, opp);
      }

      // AI for remaining alive fighters
      const updated = new Set();
      if (p1Fighter) updated.add(p1Fighter);
      if (p2Fighter) updated.add(p2Fighter);
      fighters.forEach(f => {
        if (f.stocks <= 0 || updated.has(f)) return;
        const opp = firstEnemy(f.team);
        if (!opp) return;
        updateFighter(f, updateAI(f, opp, cpuDifficulty, TEAM_PLATFORMS, 1 + ((settings.aiAggression ?? 50) - 50) / 100, settings.botPersonality || 'balanced'), TEAM_PLATFORMS, W, H, opp);
      });

      // Update power projectiles
      fighters.forEach(f => {
        const opp = firstEnemy(f.team);
        if (opp) updateProjectiles(f, opp);
      });

      // Update emote timers — cancel if airborne, decrement timer, update progress
      fighters.forEach(f => {
        if (f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) { if (f.emote.key && keysRef.current[f.emote.key]) { f.emote.timer = f.emote.maxTimer; } else { f.emote = null; } } }
        }
      });

      // Hit detection
      // Teammates never attack each other — only cross-team pairs
      const pairs = [
        [f1, f3], [f1, f4], [f2, f3], [f2, f4],
        [f3, f1], [f3, f2], [f4, f1], [f4, f2],
      ];

      pairs.forEach(([atk, def]) => {
        if (atk.stocks <= 0 || def.stocks <= 0) return;
        if (checkHit(atk, def)) {
          const _isSuper = atk.state === 'superAttack';
          const _isHeavy = atk.attackData && atk.attackData.isHeavy;
          applyHit(atk, def);
          if (_isSuper) { shakeMag = Math.max(shakeMag, 20); sfx.superImpact(); }
          else if (_isHeavy) { shakeMag = Math.max(shakeMag, 10); sfx.heavyHit(); }
          else { shakeMag = Math.max(shakeMag, 6); sfx.hit(); }
        }
      });

      // 700+ damage instant death + kill feed
      fighters.forEach((f, i) => {
        if (f._pendingDeath && f.stocks > 0) { f._pendingDeath = false; loseStock(f, W, H); }
        if (prevStocks[i] !== f.stocks && f._lastHitBy && f._lastHitBy.stocks > 0) {
          killFeed.push({ killer: f._lastHitBy.char.name, victim: f.char.name, timer: 180 });
        }
      });
      prevStocks = fighters.map(f => f.stocks);

      // Render — dynamic camera (zoom in a little for 2v2)
      const aliveFs = fighters.filter(f => f.stocks > 0);
      let camZoom = 0.90, camX = 0, camY = 0;
      if (aliveFs.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        aliveFs.forEach(f => { minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); minY = Math.min(minY, f.y); maxY = Math.max(maxY, f.y); });
        const spreadX = (maxX - minX) + 300;
        const spreadY = (maxY - minY) + 300;
        const fitZoom = Math.min(W / Math.max(spreadX, 400), H / Math.max(spreadY, 300));
        camZoom = Math.max(0.70, Math.min(0.95, fitZoom));
        const zoomMul = settings.cameraZoom === 'close' ? 1.1 : settings.cameraZoom === 'far' ? 0.85 : 1.0;
        const _stageZoom = settings.stageZoom != null ? settings.stageZoom : 1.0;
        camZoom *= zoomMul * _stageZoom;
        camX = ((minX + maxX) / 2 - W / 2) * (1 - camZoom);
        camY = ((minY + maxY) / 2 - 50 - H / 2) * (1 - camZoom);
      }

      let shakeX = 0, shakeY = 0;
      if (!(settings.reducedMotion || settings.screenShake === false) && shakeMag > 0.3) { shakeX = (Math.random() - 0.5) * shakeMag; shakeY = (Math.random() - 0.5) * shakeMag; shakeMag *= 0.72; }

      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx, W, H, f1.frame, 'splitcity');

      ctx.save();
      ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-W / 2 - camX, -H / 2 - camY);

      drawPlatforms(ctx, TEAM_PLATFORMS, f1.frame, 'splitcity');

      fighters.forEach(f => {
        if (f.stocks <= 0) return;
        const flashing = f.invincible > 0 && Math.floor(f.frame / 4) % 2 === 0;
        if (!flashing) {
          if (showTriangles) {
            ctx.save();
            ctx.fillStyle = TEAM_COLORS[f.team];
            ctx.shadowColor = TEAM_COLORS[f.team]; ctx.shadowBlur = 6;
            const tx = f.x, ty = f.y - 90;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 8); ctx.lineTo(tx - 6, ty + 4); ctx.lineTo(tx + 6, ty + 4); ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
          }

          drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
          const renderColor = getCharRenderColor(f.char.id, equippedSkins) || f.char.color;
          const skinParts = getSkinParts(f.char.id, equippedSkins);
          const accs = getEquippedAccessories(botAccessoriesRef.current, f.char.id);
          const skinColor = getCharRenderColor(f.char.id, equippedSkins);
          skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1, f.char.id, f.state, f.facing, f.powerActive));
          accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, 1, f.char.id, f.state, f.facing, f.powerActive));
          drawShikigamiFollower(ctx, f, botShikigamiRef.current?.[f.char.id], f.frame, 1);
          drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame, 1, f.char.isSpirit, f.state, f.char, f.powerActive, false, null, f.emote);
          skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1, f.char.id, f.state, f.facing, f.powerActive));
          accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, 1, f.char.id, f.state, f.facing, f.powerActive));
          if (f.attackData && f.state === 'attacking') drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || f.char.color, f.attackData.isNormal, f.char.id, f.char.power, f.powerActive);
          if (f.attackData && f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, f.char.color, f.attackData.progress, f.char.superMove?.name, f.char.id);
          if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame, he.spawnFrame));
        }
      });
      fighters.forEach(f => { if (f.stocks > 0) drawProjectiles(ctx, f); });

      ctx.restore();

      // HUD — team stock counts (background hidden when stock boxes are hidden)
      if (!settings?.hideStockBoxes) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, H - 80, W, 80);
      }

      const t1Stocks = f1.stocks + f2.stocks;
      const t2Stocks = f3.stocks + f4.stocks;

      ctx.fillStyle = TEAM_COLORS[1]; ctx.font = 'bold 18px Orbitron'; ctx.textAlign = 'left';
      ctx.fillText(`TEAM RED  ${t1Stocks}`, 40, H - 50);
      ctx.textAlign = 'right'; ctx.fillStyle = TEAM_COLORS[2];
      ctx.fillText(`${t2Stocks}  TEAM BLUE`, W - 40, H - 50);

      drawHealthBar(ctx, 280, H - 66, f1.damage, 200, c1.color, c1.name, f1.stocks, null, 0, 0, 'left', false, settings?.hideStockBoxes);
      drawHealthBar(ctx, 540, H - 66, f2.damage, 200, c2.color, c2.name, f2.stocks, null, 0, 0, 'left', false, settings?.hideStockBoxes);
      drawHealthBar(ctx, W - 540, H - 66, f3.damage, 200, c3.color, c3.name, f3.stocks, null, 0, 0, 'left', false, settings?.hideStockBoxes);
      drawHealthBar(ctx, W - 280, H - 66, f4.damage, 200, c4.color, c4.name, f4.stocks, null, 0, 0, 'left', false, settings?.hideStockBoxes);

      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(matchTime === 0 ? '∞' : `${Math.ceil(gameRef.current.timer)}s`, W / 2, H - 50);

      // Power & Super bars for P1
      if (f1.stocks > 0) {
        drawPowerBar(ctx, f1, 200, H - 20, 80, 5);
        drawSuperMeter(ctx, f1, 200, H - 10, 80, 5);
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

    return () => {
      if (gameRef.current) gameRef.current.running = false;
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted, p1, p1b, p2, p2b, cpuDifficulty, teamDamage, showTriangles, teamFormat]);

  const finishQuit = () => {
    if (gameRef.current) { gameRef.current.running = false; onEnd?.({ p1Won: false, team: 2 }); }
  };

  // Suppress controller menu-nav while a match is actively running; re-enable
  // when paused or finished so the player can click buttons with the controller.
  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        <button onClick={finishQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Menu</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">Pause (ESC)</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        className="border-2 border-border rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }}
      />
      {countdown > 0 && !settings?.hideCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !winner && <PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={finishQuit} />}
      {(() => {
        const winNames = winTeam === 1 ? [getCharData(p1)?.name, getCharData(p1b)?.name] : winTeam === 2 ? [getCharData(p2)?.name, getCharData(p2b)?.name] : [];
        return winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/78 rounded-lg gap-4">
            <span className="text-5xl font-heading drop-shadow-lg" style={{ color: winner === 'Team Red' ? TEAM_COLORS[1] : TEAM_COLORS[2] }}>{winner} WON!</span>
            {winNames.length > 0 && (
              <div className="flex flex-col items-center gap-1 mb-1">
                {winNames.map((n, i) => <span key={i} className="text-xl font-heading text-foreground/90">{n}</span>)}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => onRematch?.()} className="px-6 py-3 bg-secondary text-secondary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">REMATCH</button>
              <button onClick={() => onEnd?.({ p1Won: winner === 'Team Red', team: winner === 'Team Red' ? 1 : 2 })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">BACK TO MENU</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}