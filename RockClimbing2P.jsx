import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ALL_CHARS } from './sports.js';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { readGamepadInput } from './controllerProfiles.js';
import { applyElement } from './elements.js';
import { fmtTime } from './RockClimbLeaderboard.jsx';
import ElementSelect from './ElementSelect.jsx';
import GameIcon from "./GameIcon.jsx";

// ── 2-Player Couch Split-Screen Rock Climbing ──
// Mechanically IDENTICAL to single-player: directional launch system (oscillating
// aim arrow + timed jump, no left/right), widely spaced holds, walls to launch
// over, grip drain, breakable/cracked/ice/slippery holds, rest platforms +
// checkpoints. Split-screen is STACKED vertically (top/bottom) so each climber's
// view keeps its proper proportions — just smaller, never squished. First to the
// summit wins; fall and you lose.
const VW = 900, VH = 720;
const MW = 700;
const MARGIN = (VW - MW) / 2;
const SUMMIT_HEIGHT = 6000;
const PLAYER_SCREEN_Y = VH * 0.6;
const GRAV = 0.42;
const PW = 9, PH = 42;

// Directional launch system
const AIM_SWEEP = 1.43;
const AIM_BASE_SPEED = 0.022;

const HOLD_TYPES = {
  large:    { r: 20, color: '#e8a868', gripDrain: 0.35, shape: 'jug' },
  medium:   { r: 15, color: '#c89058', gripDrain: 0.65, shape: 'edge' },
  small:    { r: 11, color: '#9a8a6a', gripDrain: 1.0,  shape: 'crimp' },
  tiny:     { r: 9,  color: '#6a6a6a', gripDrain: 1.5,  shape: 'crimp' },
  slippery: { r: 14, color: '#5ab8c8', gripDrain: 1.6,  shape: 'sloper', slip: true },
  cracked:  { r: 14, color: '#c87060', gripDrain: 0.85, shape: 'crack', crack: true },
  ice:      { r: 13, color: '#a8d8f0', gripDrain: 2.0,  shape: 'ice', slip: true },
  mossy:    { r: 16, color: '#6a9a40', gripDrain: 0.55, shape: 'sloper' },
  breakable:{ r: 14, color: '#e0a040', gripDrain: 0.8,  shape: 'flake', breaks: true },
};

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resolveChar(id, customCharsData) {
  if (customCharsData && customCharsData[id]) return customCharsData[id];
  return ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
}

function deriveStats(char, element) {
  const s = applyElement(char?.stats || {}, element);
  return {
    launchPower: 15.5 + (s.power || 5) * 0.55,
    gripMax: 240 + (s.utility || 5) * 32,
    gripRegen: 1.8 + (s.utility || 5) * 0.4,
  };
}

function pickHoldType(d) {
  const r = Math.random();
  if (d < 0.25) { if (r < 0.55) return 'large'; if (r < 0.9) return 'medium'; return 'small'; }
  if (d < 0.55) { if (r < 0.2) return 'large'; if (r < 0.55) return 'medium'; if (r < 0.78) return 'small'; if (r < 0.9) return 'slippery'; return 'cracked'; }
  if (r < 0.05) return 'large'; if (r < 0.25) return 'medium'; if (r < 0.55) return 'small'; if (r < 0.72) return 'tiny'; if (r < 0.86) return 'slippery'; if (r < 0.95) return 'cracked'; return 'breakable';
}

// Both climbers share the SAME route — full parity with single-player spacing.
function addRouteSegment(state) {
  const progress = clamp(-state.genTop / SUMMIT_HEIGHT, 0, 1);
  const vGap = 150 + Math.random() * 70 + progress * 80;
  const lastHold = state.holds[state.holds.length - 1];
  const prevX = lastHold ? lastHold.baseX : MW / 2;
  let hShift;
  if (state.routeStep > 0 && state.routeStep % 4 === 0) {
    const targetSide = prevX < MW / 2 ? 1 : -1;
    hShift = targetSide * rand(200 * 0.75, 200 * 1.15);
  } else {
    hShift = (Math.random() - 0.5) * 2 * 220 * (0.6 + progress * 0.4);
  }
  const nx = clamp(prevX + hShift, 40, MW - 40);
  const ny = state.genTop - vGap;
  const type = pickHoldType(progress);
  state.holds.push({ x: nx, y: ny, type, baseX: nx, baseY: ny, phase: Math.random() * 6.28, broken: false, crumbling: false, crumbleT: 0 });
  state.genTop = ny;
  state.routeStep++;
  // wall obstacle
  if (progress > 0.12 && Math.random() < 0.25) {
    const ww = rand(38, 78), wh = rand(70, 140);
    const side = Math.random() < 0.5 ? -1 : 1;
    const wx = clamp(nx + side * rand(70, 130) - ww / 2, 4, MW - ww - 4);
    state.walls.push({ x: wx, y: ny + rand(10, 70), w: ww, h: wh });
  }
  if (progress > 0.18 && Math.random() < 0.3) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const bx = clamp(nx + dir * rand(80, 140), 38, MW - 38);
    state.holds.push({ x: bx, y: ny + rand(-18, 22), type: pickHoldType(progress), baseX: bx, baseY: ny, phase: Math.random() * 6.28, broken: false, crumbling: false, crumbleT: 0 });
  }
  if (state.routeStep % 9 === 0) {
    const pw = rand(110, 160), px = clamp(nx - pw / 2, 16, MW - pw - 16);
    state.platforms.push({ x: px, y: ny, w: pw, h: 16 });
  }
  if (state.routeStep % 16 === 0) {
    const recent = state.platforms[state.platforms.length - 1];
    let cp;
    if (recent && Math.abs(recent.y - ny) < 80) cp = { x: recent.x + recent.w / 2, y: recent.y, w: recent.w };
    else {
      const pw2 = 100, px2 = clamp(nx - pw2 / 2, 20, MW - pw2 - 20);
      state.platforms.push({ x: px2, y: ny, w: pw2, h: 16 });
      cp = { x: px2 + pw2 / 2, y: ny, w: pw2 };
    }
    state.checkpoints.push({ x: cp.x, y: cp.y, w: cp.w });
  }
}

function ensureGenerated(state) {
  while (state.genTop > Math.min(state.players[0].y, state.players[1].y) - 900) addRouteSegment(state);
  const cullY = Math.max(state.players[0].y, state.players[1].y) + 400;
  state.holds = state.holds.filter(h => h.y < cullY);
  state.platforms = state.platforms.filter(p => p.y < cullY);
  state.walls = state.walls.filter(w => w.y + w.h < cullY);
}

export default function RockClimbing2P({ onExit, onAward, unlockedIds = ['yellow'], equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, sfxVolume = 70, musicVolume = 50, settings = {}, charLevels = {} }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('select');
  const [p1Char, setP1Char] = useState(unlockedIds[0] || 'yellow');
  const [p2Char, setP2Char] = useState(unlockedIds[1] || unlockedIds[0] || 'yellow');
  const [p1El, setP1El] = useState('basic');
  const [p2El, setP2El] = useState('basic');
  const [result, setResult] = useState(null);
  const stRef = useRef(null);
  const keysRef = useRef({});
  const edge1Ref = useRef({ jump: false, down: false });
  const edge2Ref = useRef({ jump: false, down: false });
  const gpPrevRef = useRef({});

  const charPool = (unlockedIds.length ? unlockedIds : ['yellow']).map(id => ({ id, char: resolveChar(id, customCharsData) }));

  const initRun = useCallback((c1, c2) => {
    const ds1 = deriveStats(resolveChar(c1, customCharsData), p1El);
    const ds2 = deriveStats(resolveChar(c2, customCharsData), p2El);
    const mk = (ds, x) => ({ x, y: -40, vx: 0, vy: 0, state: 'air', hold: null, facing: 1, frame: 0, grip: ds.gripMax, coyote: 0, stats: ds, finished: false, grabCooldown: 0, aim: 0, aimPhase: 0, grabAnim: 0, dropAnim: 0, camY: undefined, steer: false });
    stRef.current = {
      players: [mk(ds1, MW / 2 - 30), mk(ds2, MW / 2 + 30)],
      holds: [], platforms: [], checkpoints: [], walls: [],
      genTop: -80, routeStep: 0,
      time: 0, startMs: Date.now(),
      over: false, winner: null,
      shake: [0, 0], chalkDust: [], particles: [],
      _spawn: { y: 0 },
    };
    stRef.current.platforms.push({ x: MW / 2 - 75, y: 0, w: 150, h: 24 });
    ensureGenerated(stRef.current);
  }, [customCharsData, p1El, p2El]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    if (phase === 'play') music.play('rockclimb');
    return () => { if (phase === 'play') music.stop(); };
  }, [phase, musicVolume, sfxVolume]);

  useEffect(() => { if (phase !== 'play') return; window.__el6GameplayActive = true; return () => { window.__el6GameplayActive = false; }; }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    const kd = e => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'p') { onExit?.(); return; }
      if (['F5', 'F12'].includes(e.key)) return;
      if (k === 'arrowup' && !keysRef.current[k]) edge1Ref.current.jump = true;
      if (k === 'arrowdown' && !keysRef.current[k]) edge1Ref.current.down = true;
      if (k === 'w' && !keysRef.current[k]) edge2Ref.current.jump = true;
      if (k === 's' && !keysRef.current[k]) edge2Ref.current.down = true;
      keysRef.current[k] = true;
      e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [phase, onExit]);

  useEffect(() => {
    if (phase !== 'play') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, last = performance.now();
    const loop = (now) => {
      const s = stRef.current; if (!s) { raf = requestAnimationFrame(loop); return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const gp1 = settings.controllerEnabled !== false ? readGamepadInput(0) : null;
      const gp2 = settings.controllerEnabled !== false ? readGamepadInput(1) : null;
      if (gp1) { if (gp1.sig && !gpPrevRef.current.g1s) edge1Ref.current.jump = true; if (gp1.down && !gpPrevRef.current.g1d) edge1Ref.current.down = true; }
      if (gp2) { if (gp2.sig && !gpPrevRef.current.g2s) edge2Ref.current.jump = true; if (gp2.down && !gpPrevRef.current.g2d) edge2Ref.current.down = true; }
      gpPrevRef.current = { g1s: gp1?.sig, g1d: gp1?.down, g2s: gp2?.sig, g2d: gp2?.down };

      updatePlayer(s, s.players[0], { jump: edge1Ref.current.jump, down: edge1Ref.current.down, leftHeld: keysRef.current['arrowleft'], rightHeld: keysRef.current['arrowright'] }, 0, 1);
      updatePlayer(s, s.players[1], { jump: edge2Ref.current.jump, down: edge2Ref.current.down, leftHeld: keysRef.current['a'], rightHeld: keysRef.current['d'] }, 1, 0);
      edge1Ref.current.jump = edge1Ref.current.down = false;
      edge2Ref.current.jump = edge2Ref.current.down = false;

      s.time = Date.now() - s.startMs;
      for (const cd of s.chalkDust) { cd.x += cd.vx; cd.y += cd.vy; cd.vy += 0.05; cd.life--; }
      s.chalkDust = s.chalkDust.filter(cd => cd.life > 0);
      if (s.particles) { for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--; } s.particles = s.particles.filter(pt => pt.life > 0); }
      if (s.shake[0] > 0) s.shake[0] *= 0.85;
      if (s.shake[1] > 0) s.shake[1] *= 0.85;
      if (s.over) { finishRun(s); setPhase('over'); return; }
      draw(ctx, s, [p1Char, p2Char], customCharsData, equippedSkins, equippedAccessories);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, p1Char, p2Char, customCharsData, equippedSkins, equippedAccessories, settings.controllerEnabled]);

  function updatePlayer(s, p, input, idx, otherIdx) {
    if (s.over) return;
    p.frame++;
    const progress = clamp(-p.y / SUMMIT_HEIGHT, 0, 1);
    ensureGenerated(s);

    // breakable crumbling
    if (p.hold) {
      const ht = HOLD_TYPES[p.hold.type] || HOLD_TYPES.medium;
      if (ht.breaks && !p.hold.crumbling) { p.hold.crumbling = true; p.hold.crumbleT = 36; sfx.rockBreak(); }
    }
    for (const h of s.holds) {
      if (h.crumbling && !h.broken) { h.crumbleT--; if (h.crumbleT <= 0) { h.broken = true; if (p.hold === h) { releaseHold(s, p, false); sfx.rockBreak(); s.shake[idx] = 8; } } }
    }

    if (p.state === 'climbing' && p.hold) {
      const ht = HOLD_TYPES[p.hold.type] || HOLD_TYPES.medium;
      p.grip -= ht.gripDrain;
      if (ht.slip) p.y += 0.3;
      if (p.grip <= 0) { releaseHold(s, p, false); p.grabCooldown = 12; sfx.hit(); p.vy = 2; p.state = 'air'; p.steer = true; return; }
    }

    if (p.grabAnim > 0) p.grabAnim--;
    if (p.dropAnim > 0) p.dropAnim--;
    if (p.grabCooldown > 0) p.grabCooldown--;

    // aim oscillation while hanging or resting
    if (p.state === 'climbing' || p.state === 'ledge') {
      const speed = AIM_BASE_SPEED * 1.1 * (1 + progress * 0.4);
      p.aimPhase = (p.aimPhase || 0) + speed;
      p.aim = AIM_SWEEP * Math.sin(p.aimPhase);
    }

    if (p.state === 'climbing' && p.hold) {
      if (input.jump) {
        const a = p.aim || 0;
        const power = p.stats.launchPower;
        releaseHold(s, p, true);
        p.grabCooldown = 10;
        p.vx = power * Math.sin(a);
        p.vy = -power * Math.cos(a);
        p.facing = a < 0 ? -1 : 1;
        p.state = 'air'; p.coyote = 0; p.steer = false; sfx.jump(); spawnChalk(s, p.x, p.y);
      } else if (input.down) {
        releaseHold(s, p, false); p.grabCooldown = 12; p.vy = 1.5; p.state = 'air'; p.steer = true; sfx.grab();
      }
    } else if (p.state === 'ledge') {
      p.grip = Math.min(p.stats.gripMax, p.grip + p.stats.gripRegen);
      if (input.jump) {
        const a = p.aim || 0;
        const power = p.stats.launchPower;
        p.vy = -power * Math.cos(a);
        p.vx = power * Math.sin(a);
        p.facing = a < 0 ? -1 : 1;
        p.state = 'air'; p.coyote = 0; p.ledgePlatform = null; p.steer = false; sfx.jump(); spawnChalk(s, p.x, p.y);
      }
    } else {
      if (p.coyote > 0) p.coyote--;
      p.vy = Math.min(p.vy + GRAV, 16);
      if (p.steer) {
        const sp = 4.5;
        if (input.leftHeld) { p.vx = Math.max(p.vx - 0.5, -sp); p.facing = -1; }
        else if (input.rightHeld) { p.vx = Math.min(p.vx + 0.5, sp); p.facing = 1; }
        else p.vx *= 0.94;
      } else {
        p.vx *= 0.995;
      }
      const dist = Math.max(Math.abs(p.vx), Math.abs(p.vy));
      const steps = Math.max(1, Math.ceil(dist / 7));
      for (let i = 0; i < steps && p.state === 'air'; i++) {
        p.x += p.vx / steps; p.y += p.vy / steps;
        p.x = clamp(p.x, 4, MW - 4);
        for (const w of s.walls) {
          if (p.x > w.x - 4 && p.x < w.x + w.w + 4 && p.y > w.y && p.y < w.y + w.h) {
            sfx.rockBreak(); s.shake[idx] = 10; spawnDust(s, p.x, p.y, p.vx < 0 ? 1 : -1);
            p.vx *= -0.25; p.vy = Math.max(p.vy, 3); break;
          }
        }
        if (p.state !== 'air') break;
        if (p.grabCooldown <= 0) {
          for (const h of s.holds) {
            if (h.broken) continue;
            const ht = HOLD_TYPES[h.type] || HOLD_TYPES.medium;
            if (Math.hypot(h.x - p.x, h.y - (p.y - PH * 0.5)) < ht.r + 18) { latchHold(s, p, h); break; }
          }
        }
        if (p.state !== 'air') break;
        if (p.vy > 0) {
          for (const pl of s.platforms) {
            if (p.x + PW > pl.x && p.x - PW < pl.x + pl.w && p.y >= pl.y && p.y <= pl.y + 14) {
              p.y = pl.y; p.vy = 0; p.state = 'ledge'; p.ledgePlatform = pl;
              p.grip = Math.min(p.stats.gripMax, p.grip + p.stats.gripRegen * 6);
              sfx.land(); spawnChalk(s, p.x, p.y); break;
            }
          }
        }
      }
    }

    // summit — this climber wins the race
    if (p.y <= -SUMMIT_HEIGHT) { p.finished = true; s.over = true; s.winner = idx; sfx.summit(); return; }
    // falling past the holds ends YOUR run — the other climber wins
    if (p.y > s._spawn.y + 700) { s.over = true; s.winner = otherIdx; sfx.gameOverRun(); return; }

    // smoother camera per player
    const targetCamY = p.y - PLAYER_SCREEN_Y;
    if (p.camY === undefined) p.camY = targetCamY;
    p.camY += (targetCamY - p.camY) * 0.14;
  }

  function latchHold(s, p, h) { p.hold = h; p.state = 'climbing'; p.vx = 0; p.vy = 0; p.grip = p.stats.gripMax; p.x = h.x; p.y = h.y + PH * 0.5; p.grabAnim = 12; p.aimPhase = Math.random() * 6.28; p.aim = 0; sfx.grab(); spawnChalk(s, h.x, h.y); s.shake[0] = Math.max(s.shake[0], 3); }
  function releaseHold(s, p, isJump) { if (!isJump) p.dropAnim = 10; p.hold = null; p.state = 'air'; p.coyote = 0; }
  function spawnChalk(s, x, y) { for (let i = 0; i < 7; i++) s.chalkDust.push({ x, y, vx: rand(-1.8, 1.8), vy: rand(-2.2, -0.3), life: rand(12, 24) }); }
  function spawnDust(s, x, y, dir) { if (!s.particles) s.particles = []; for (let i = 0; i < 6; i++) s.particles.push({ x, y, vx: dir * rand(0.5, 2.8), vy: rand(-2.5, -0.5), life: rand(10, 20), color: '#ccc' }); }

  function finishRun(s) {
    setResult({ winner: s.winner, time: Math.floor(s.time), winnerChar: s.winner === 0 ? p1Char : p2Char });
    onAward?.({ sport: 'rockclimb2p', p1Won: s.winner === 0, stats: { time_ms: Math.floor(s.time) }, tournamentWon: false });
  }

  const startRun = () => { initRun(p1Char, p2Char); setResult(null); keysRef.current = {}; setPhase('play'); sfx.click(); };

  if (phase === 'select') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🧗" size={14} /> 2P COUCH CLIMB</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1 max-w-xl">Two climbers race up the SAME mountain with the directional launch system — time the oscillating arrow to fly hold-to-hold. Split-screen is side-by-side so each view stays properly proportioned, just smaller. Fall and you lose; first to the summit wins!</p>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          {['P1', 'P2'].map((label, pi) => {
            const charId = pi === 0 ? p1Char : p2Char;
            const setChar = pi === 0 ? setP1Char : setP2Char;
            const setEl = pi === 0 ? setP1El : setP2El;
            const el = pi === 0 ? p1El : p2El;
            const color = pi === 0 ? '#3577E8' : '#E04646';
            return (
              <div key={label} className="rounded-xl border-2 p-3 flex flex-col gap-2" style={{ borderColor: color }}>
                <p className="font-heading text-sm tracking-wider text-center" style={{ color }}>{label} — {label === 'P1' ? 'Arrows' : 'WASD'}</p>
                <div className="grid grid-cols-4 gap-1 max-h-[180px] overflow-y-auto">
                  {charPool.map(({ id, char }) => (
                    <button key={id} onClick={() => { setChar(id); sfx.characterSelect(); }}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded border-2 transition hover:scale-[1.05] ${charId === id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                      <span className="w-6 h-6 rounded-full" style={{ background: char?.color || '#888' }} />
                      <span className="font-heading text-[7px] tracking-wider text-center leading-tight">{(char?.name || id).toUpperCase().slice(0, 6)}</span>
                    </button>
                  ))}
                </div>
                <ElementSelect charId={charId} currentElement={el} onSelect={setEl} charLevels={charLevels} label="ELEMENT" />
              </div>
            );
          })}
        </div>

        <button onClick={startRun} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90 animate-pulse"><GameIcon emoji="▶" size={14} /> START RACE</button>
        <div className="text-[10px] text-muted-foreground font-body text-center">
          <p><span className="text-accent font-bold">P1: <GameIcon emoji="↑" size={14} /></span> Launch (time the arrow!) · <span className="text-accent font-bold"><GameIcon emoji="↓" size={14} /></span> Let go · <span className="text-accent font-bold"><GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} /></span> Steer while falling</p>
          <p><span className="text-accent font-bold">P2: W</span> Launch (time the arrow!) · <span className="text-accent font-bold">S</span> Let go · <span className="text-accent font-bold">A/D</span> Steer while falling</p>
          <p className="mt-1">The arrow above your head sets your launch direction. You can only steer left/right while falling after dropping. Same holds, grip, walls & fall-death as single player.</p>
        </div>
      </div>
    );
  }

  if (phase === 'over' && result) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <h2 className="text-3xl font-heading text-accent tracking-wider"><GameIcon emoji="🏁" size={14} /> RACE OVER!</h2>
        <p className="text-lg font-heading" style={{ color: result.winner === 0 ? '#3577E8' : '#E04646' }}>
          {result.winner === 0 ? '<GameIcon emoji="🔵" size={14} /> P1 WINS!' : '<GameIcon emoji="🔴" size={14} /> P2 WINS!'}
        </p>
        <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-2 items-center">
          <p className="text-[11px] font-heading text-muted-foreground tracking-wider">TIME</p>
          <p className="text-4xl font-heading text-primary">{fmtTime(result.time)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={startRun} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="↻" size={14} /> RACE AGAIN</button>
          <button onClick={onExit} className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">BACK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={onExit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Quit</button>
        <span className="text-[10px] text-muted-foreground font-body">P1: <GameIcon emoji="↑" size={14} />/<GameIcon emoji="↓" size={14} />/<GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} /> · P2: W/S/A/D · ESC: Quit — time the arrow to launch!</span>
      </div>
      {/* Side-by-side split-screen: two 900×720 viewports, left & right.
          The whole canvas scales down to fit the width, so each view keeps its
          proper proportions (smaller, never squished). */}
      <canvas ref={canvasRef} width={VW * 2} height={VH} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: VW * 2 + 'px', aspectRatio: `${VW * 2} / ${VH}`, height: 'auto', background: '#0e1a14' }} />
    </div>
  );
}

// ── Side-by-side split-screen rendering — two 900×720 viewports (left & right) ──
function draw(ctx, s, charIds, customCharsData, skins, accs) {
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
  drawViewport(ctx, s, 0, charIds[0], customCharsData, skins, accs, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.rect(VW, 0, VW, VH); ctx.clip();
  drawViewport(ctx, s, 1, charIds[1], customCharsData, skins, accs, VW, 0);
  ctx.restore();
  // divider
  ctx.fillStyle = '#FFD700'; ctx.fillRect(VW - 2, 0, 4, VH);
}

function drawViewport(ctx, s, idx, charId, customCharsData, skins, accs, ox, oy) {
  const p = s.players[idx];
  const camY = p.camY ?? (p.y - PLAYER_SCREEN_Y);
  const progress = clamp(-p.y / SUMMIT_HEIGHT, 0, 1);
  const shakeX = s.shake[idx] ? (Math.random() - 0.5) * s.shake[idx] : 0;
  const shakeY = s.shake[idx] ? (Math.random() - 0.5) * s.shake[idx] : 0;

  const pal = { sky1: '#1a0a2a', sky2: '#3a1a4a', cliff: '#3a2a5a', accent: '#77ddbb' };
  const g = ctx.createLinearGradient(ox, oy, ox, oy + VH);
  g.addColorStop(0, pal.sky2); g.addColorStop(1, pal.sky1);
  ctx.fillStyle = g; ctx.fillRect(ox, oy, VW, VH);
  ctx.globalAlpha = 0.3; ctx.fillStyle = pal.cliff;
  for (let i = 0; i < 6; i++) {
    const px = ox + ((i * 260 - camY * 0.03) % 260) - 130;
    const ph = 240 + (i % 3) * 80;
    ctx.beginPath(); ctx.moveTo(px, oy + VH); ctx.lineTo(px + 130, oy + VH - ph); ctx.lineTo(px + 260, oy + VH); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 14; i++) {
    const cx = ox + (i * 73) % VW;
    const cy = oy + ((i * 41 - camY * 0.12) % VH + VH) % VH;
    ctx.fillStyle = `rgba(119,221,187,${0.25 + 0.15 * Math.sin(p.frame * 0.04 + i)})`;
    ctx.beginPath(); ctx.arc(cx, cy, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }

  ctx.save();
  ctx.translate(ox + MARGIN + shakeX, oy - camY + shakeY);

  for (const side of ['left', 'right']) {
    const cx = side === 'left' ? -40 : MW;
    const cg = ctx.createLinearGradient(cx, 0, cx + 40, 0);
    cg.addColorStop(0, '#1a0a1a'); cg.addColorStop(0.5, '#2a1a3a'); cg.addColorStop(1, '#1a0a1a');
    ctx.fillStyle = cg; ctx.fillRect(cx, camY - 100, 40, VH + 200);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) { const lx = cx + i * 9 + 4; ctx.beginPath(); ctx.moveTo(lx, camY - 100); for (let y = 0; y < VH + 200; y += 20) ctx.lineTo(lx + Math.sin(y * 0.1 + i) * 3, camY - 100 + y); ctx.stroke(); }
  }

  // walls
  for (const w of s.walls) {
    const wg = ctx.createLinearGradient(w.x, 0, w.x + w.w, 0);
    wg.addColorStop(0, '#2a1a3a'); wg.addColorStop(0.5, '#3a2a4a'); wg.addColorStop(1, '#2a1a3a');
    ctx.fillStyle = wg; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(w.x, w.y, w.w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
    ctx.fillStyle = 'rgba(255,180,40,0.5)';
    for (let cx = w.x + 6; cx < w.x + w.w - 6; cx += 14) { ctx.beginPath(); ctx.moveTo(cx, w.y + 6); ctx.lineTo(cx + 5, w.y + 12); ctx.lineTo(cx - 5, w.y + 12); ctx.closePath(); ctx.fill(); }
  }
  for (const pl of s.platforms) {
    ctx.fillStyle = '#5a4838'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(pl.x, pl.y, pl.w, 3);
  }
  for (const cp of s.checkpoints) {
    ctx.fillStyle = '#444'; ctx.fillRect(cp.x - 1.5, cp.y - 46, 3, 46);
    ctx.fillStyle = '#44ff66'; ctx.beginPath(); ctx.moveTo(cp.x + 1.5, cp.y - 46); ctx.lineTo(cp.x + 24, cp.y - 40); ctx.lineTo(cp.x + 1.5, cp.y - 32); ctx.closePath(); ctx.fill();
  }
  for (const h of s.holds) drawHold(ctx, h, p);
  for (const cd of s.chalkDust) { ctx.globalAlpha = Math.max(0, cd.life / 24) * 0.4; ctx.fillStyle = '#f0eedd'; ctx.beginPath(); ctx.arc(cd.x, cd.y, 2, 0, Math.PI * 2); ctx.fill(); }
  if (s.particles) for (const pt of s.particles) { ctx.globalAlpha = Math.max(0, pt.life / 20) * 0.5; ctx.fillStyle = pt.color || '#ccc'; ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;

  // player with grab/drop anims
  const char = resolveChar(charId, customCharsData);
  let state = 'idle';
  if (p.state === 'climbing' || p.state === 'air') state = 'jumping';
  let yOff = 0, yStretch = 0;
  if (p.grabAnim > 0) { const t = 1 - p.grabAnim / 12; yOff = Math.sin(t * Math.PI) * 3; }
  if (p.dropAnim > 0) { const t = 1 - p.dropAnim / 10; yStretch = Math.sin(t * Math.PI) * 4; }
  drawSportChar(ctx, p.x, p.y + yOff + yStretch, char, { facing: p.facing, frame: p.frame, scale: 0.92, jersey: false, sport: 'climb', state, equippedSkins: skins, equippedAccessories: accs });
  if (p.grabAnim > 0 && p.hold) {
    const t = 1 - p.grabAnim / 12;
    ctx.save(); ctx.globalAlpha = (1 - t) * 0.6; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.hold.x, p.hold.y, 8 + t * 18, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  // aim arrow
  if (p.state === 'climbing' || p.state === 'ledge') {
    const a = p.aim || 0;
    const acx = p.x, acy = p.y - PH - 16;
    const dx = Math.sin(a), dy = -Math.cos(a);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(acx, acy, 52, -AIM_SWEEP - Math.PI / 2, AIM_SWEEP - Math.PI / 2); ctx.stroke();
    const L = 66, ax = acx + dx * L, ay = acy + dy * L;
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(acx, acy); ctx.lineTo(ax, ay); ctx.stroke();
    const perpX = -dy, perpY = dx;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.moveTo(ax + dx * 11, ay + dy * 11); ctx.lineTo(ax - dx * 3 + perpX * 9, ay - dy * 3 + perpY * 9); ctx.lineTo(ax - dx * 3 - perpX * 9, ay - dy * 3 - perpY * 9); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(acx, acy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(ox, oy, VW, 38);
  ctx.textAlign = 'left'; ctx.font = 'bold 16px Orbitron';
  ctx.fillStyle = idx === 0 ? '#3577E8' : '#E04646';
  ctx.fillText(`P${idx + 1}`, ox + 12, oy + 26);
  ctx.fillStyle = '#88ff88'; ctx.fillText(fmtTime(s.time), ox + 50, oy + 26);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 10px Orbitron';
  ctx.fillText('ROCK WALL', ox + VW - 12, oy + 18);
  const barW = 140, barX = ox + VW - barW - 12, barY = oy + 24;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX, barY, barW, 7);
  const bg = ctx.createLinearGradient(barX, 0, barX + barW, 0); bg.addColorStop(0, '#44ff88'); bg.addColorStop(1, '#FFD700');
  ctx.fillStyle = bg; ctx.fillRect(barX, barY, barW * progress, 7);
  if (p.state === 'climbing') {
    const gW = 110, gX = ox + VW / 2 - gW / 2, gY = oy + VH - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(gX - 2, gY - 2, gW + 4, 10);
    const pct = Math.max(0, p.grip / p.stats.gripMax);
    ctx.fillStyle = pct > 0.5 ? '#44ff88' : pct > 0.25 ? '#ffcc44' : '#ff4444';
    ctx.fillRect(gX, gY, gW * pct, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('GRIP', ox + VW / 2, gY - 6);
  }
}

function drawHold(ctx, h, player) {
  if (h.broken) return;
  const ht = HOLD_TYPES[h.type] || HOLD_TYPES.medium;
  const held = player.hold === h;
  const crumbleMax = h.type === 'breakable' ? 36 : 60;
  const crumble = h.crumbling ? Math.min(1, (crumbleMax - h.crumbleT) / crumbleMax) : 0;
  ctx.globalAlpha = 1 - crumble * 0.5;
  const r = ht.r, col = ht.color;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(h.x, h.y + r * 0.7, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save(); ctx.translate(h.x, h.y);
  const shape = ht.shape || 'edge';
  if (shape === 'jug') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, lighten(col, 35)); grad.addColorStop(0.6, col); grad.addColorStop(1, darken(col, 28));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(col, 42); ctx.beginPath(); ctx.ellipse(0, -r * 0.12, r * 0.6, r * 0.3, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.3, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (shape === 'edge') {
    const grad = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5);
    grad.addColorStop(0, lighten(col, 25)); grad.addColorStop(1, darken(col, 25));
    ctx.fillStyle = grad; ctx.fillRect(-r * 1.1, -r * 0.35, r * 2.2, r * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-r * 1.1, -r * 0.35, r * 2.2, 3);
    ctx.fillStyle = darken(col, 35); ctx.fillRect(-r * 1.1, r * 0.2, r * 2.2, r * 0.15);
  } else if (shape === 'crimp') {
    const grad = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
    grad.addColorStop(0, lighten(col, 20)); grad.addColorStop(1, darken(col, 20));
    ctx.fillStyle = grad; ctx.fillRect(-r, -r * 0.3, r * 2, r * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-r, -r * 0.3, r * 2, 2);
  } else if (shape === 'sloper') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.5, 1, 0, 0, r);
    grad.addColorStop(0, lighten(col, 40)); grad.addColorStop(0.7, col); grad.addColorStop(1, darken(col, 20));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.4, r * 0.4, r * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (shape === 'crack') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, lighten(col, 25)); grad.addColorStop(1, darken(col, 25));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a0808'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.1); ctx.lineTo(r * 0.1, -r * 0.3); ctx.lineTo(r * 0.5, r * 0.2); ctx.stroke();
  } else if (shape === 'ice') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, col); grad.addColorStop(1, darken(col, 30));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, -r * 0.2); ctx.lineTo(r * 0.6, r * 0.7); ctx.lineTo(-r * 0.7, r * 0.6); ctx.lineTo(-r * 0.9, -r * 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.2, r * 0.2); ctx.moveTo(r * 0.8, -r * 0.2); ctx.lineTo(-r * 0.2, r * 0.2); ctx.stroke();
  } else if (shape === 'flake') {
    const grad = ctx.createLinearGradient(-r, 0, r, 0);
    grad.addColorStop(0, lighten(col, 20)); grad.addColorStop(1, darken(col, 25));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(-r * 1.1, -r * 0.5); ctx.lineTo(r * 0.9, -r * 0.3); ctx.lineTo(r * 1.1, r * 0.4); ctx.lineTo(-r * 0.9, r * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.moveTo(-r * 1.1, -r * 0.5); ctx.lineTo(r * 0.9, -r * 0.3); ctx.lineTo(r * 0.85, -r * 0.15); ctx.lineTo(-r * 1.05, -r * 0.35); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(0, r * 0.1, 1.8, 0, Math.PI * 2); ctx.fill();
  if (h.crumbling) { ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.3, -r * 0.5); ctx.lineTo(r * 0.7, r * 0.3); ctx.stroke(); }
  ctx.restore();

  if (held) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(h.x, h.y, r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  if (ht.slip) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.2 * Math.sin(Date.now() * 0.005 + h.x)})`; ctx.beginPath(); ctx.arc(h.x + r * 0.2, h.y - r * 0.1, 1.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
}

function hexToRgb(hex) { const h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function lighten(hex, amt) { const [r, g, b] = hexToRgb(hex); return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`; }
function darken(hex, amt) { const [r, g, b] = hexToRgb(hex); return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`; }