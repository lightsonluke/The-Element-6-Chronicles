import db from './localBackend';

import React, { useRef, useState, useEffect, useCallback } from 'react';

import { ALL_CHARS } from './sports.js';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { readGamepadInput } from './controllerProfiles.js';
import RockClimbLeaderboard, { fmtTime } from './RockClimbLeaderboard.jsx';
import RockClimbing2P from './RockClimbing2P.jsx';
import { applyElement } from './elements.js';
import ElementSelect from './ElementSelect.jsx';
import GameIcon from "./GameIcon.jsx";

// ── Canvas / world ──
const W = 900, H = 720;
const MW = 700;                 // mountain face width
const MARGIN = (W - MW) / 2;
const SUMMIT_HEIGHT = 7200;     // finite climb — summit at y = -SUMMIT_HEIGHT
const PLAYER_SCREEN_Y = H * 0.6;
const GRAV = 0.42;              // smoother, slightly lower gravity
const PW = 9, PH = 42;

// ── Directional launch system ──
// While hanging, an arrow oscillates above the climber's head. Pressing Jump
// launches them in the exact direction the arrow points — no left/right steering.
const AIM_SWEEP = 1.43;         // max angle from vertical (rad) ≈ 82°
const AIM_BASE_SPEED = 0.022;   // oscillation rad/frame (very slow, ~4.8s sweep at base)

// Hold types — real climbing hold shapes, each with a distinct color.
const HOLD_TYPES = {
  large:    { r: 20, color: '#e8a868', gripDrain: 0.35, label: 'Jug',    shape: 'jug' },
  medium:   { r: 15, color: '#c89058', gripDrain: 0.65, label: 'Edge',   shape: 'edge' },
  small:    { r: 11, color: '#9a8a6a', gripDrain: 1.0,  label: 'Crimp',  shape: 'crimp' },
  tiny:     { r: 9,  color: '#6a6a6a', gripDrain: 1.5,  label: 'Crimp',  shape: 'crimp' },
  slippery: { r: 14, color: '#5ab8c8', gripDrain: 1.6,  label: 'Sloper', shape: 'sloper', slip: true },
  cracked:  { r: 14, color: '#c87060', gripDrain: 0.85, label: 'Crack',  shape: 'crack', crack: true },
  ice:      { r: 13, color: '#a8d8f0', gripDrain: 2.0,  label: 'Ice',    shape: 'ice', slip: true },
  mossy:    { r: 16, color: '#6a9a40', gripDrain: 0.55, label: 'Sloper', shape: 'sloper' },
  breakable:{ r: 14, color: '#e0a040', gripDrain: 0.8,  label: 'Flake',  shape: 'flake', breaks: true },
};

const ENV_NAMES = ['Rocky Cliffs', 'Forest Mountain', 'Waterfall Cliffs', 'Ancient Ruins', 'Snowy Peaks', 'Crystal Cavern', 'Floating Cliffs', 'Summit Temple', 'Rock Wall'];

// 9 tracks — MUCH harder. Holds are spread far apart vertically & horizontally,
// forcing big side-to-side launches and jumps over rock walls. Gaps/spread/walls
// all scale with difficulty. The aim arrow oscillates faster on harder tracks.
const TRACKS = [
  { id: 0, name: 'Beginner Cliff',   diff: 1, summit: 3600,    gapMin: 140, gapMax: 190, gapGrow: 60,  spread: 190, rockChance: 0,      windChance: 0,      wallChance: 0,    aimSpeed: 0.85, env: 0 },
  { id: 1, name: 'Forest Ascent',    diff: 2, summit: 4200,    gapMin: 155, gapMax: 210, gapGrow: 70,  spread: 220, rockChance: 0.0008, windChance: 0,      wallChance: 0.12, aimSpeed: 0.95, env: 1 },
  { id: 2, name: 'Waterfall Cliffs', diff: 3, summit: 4800,    gapMin: 170, gapMax: 230, gapGrow: 80,  spread: 250, rockChance: 0.0015, windChance: 0,      wallChance: 0.20, aimSpeed: 1.05, env: 2 },
  { id: 3, name: 'Ancient Ruins',    diff: 4, summit: 5400,    gapMin: 180, gapMax: 245, gapGrow: 90,  spread: 280, rockChance: 0.0025, windChance: 0.0008, wallChance: 0.28, aimSpeed: 1.15, env: 3 },
  { id: 4, name: 'Snowy Peaks',      diff: 5, summit: 6000,    gapMin: 190, gapMax: 260, gapGrow: 95,  spread: 300, rockChance: 0.0035, windChance: 0.0015, wallChance: 0.34, aimSpeed: 1.25, env: 4 },
  { id: 5, name: 'Crystal Cavern',   diff: 6, summit: 6400,    gapMin: 200, gapMax: 275, gapGrow: 100, spread: 320, rockChance: 0.0045, windChance: 0.002,  wallChance: 0.40, aimSpeed: 1.35, env: 5 },
  { id: 6, name: 'Floating Cliffs',   diff: 7, summit: 6800,    gapMin: 210, gapMax: 285, gapGrow: 105, spread: 340, rockChance: 0.0055, windChance: 0.0025, wallChance: 0.45, aimSpeed: 1.45, env: 6 },
  { id: 7, name: 'Summit Temple',     diff: 8, summit: 7200,    gapMin: 215, gapMax: 295, gapGrow: 110, spread: 360, rockChance: 0.007,  windChance: 0.003,  wallChance: 0.50, aimSpeed: 1.55, env: 7 },
  { id: 8, name: 'Rock Wall',         diff: 9, summit: Infinity, gapMin: 180, gapMax: 250, gapGrow: 90,  spread: 300, rockChance: 0,      windChance: 0,      wallChance: 0.30, aimSpeed: 1.30, env: 8, endless: true },
];

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resolveChar(id, customCharsData) {
  if (customCharsData && customCharsData[id]) return customCharsData[id];
  return ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
}

function deriveStats(char, element) {
  const s = applyElement(char?.stats || {}, element);
  return {
    launchPower: 15.5 + (s.power || 5) * 0.55,   // launch speed in the aim direction
    gripMax: 240 + (s.utility || 5) * 32,
    gripRegen: 1.8 + (s.utility || 5) * 0.4,
    aimAssist: (s.control || 5) * 0.03,            // control stat nudges aim toward nearest hold at launch — 0.15 at ctl 5, 0.30 at ctl 10
  };
}

function envFor(progress) {
  const i = Math.min(7, Math.floor(progress * 8));
  return { idx: i, name: ENV_NAMES[i], progress };
}

// ── Strategic route generator ──
// Holds are spread far apart. Every few holds the route forces a big cross-wall
// (side-to-side) launch. Rock walls are placed as obstacles you must launch
// over or around. The route is finite (ends at the summit).
function ensureGenerated(state) {
  while (state.genTop > state.player.y - 900) addRouteSegment(state);
  const cullY = state.player.y + 300;
  state.holds = state.holds.filter(h => h.y < cullY);
  state.platforms = state.platforms.filter(p => p.y < cullY || p === state._spawnPlatform);
  state.walls = state.walls.filter(w => w.y + w.h < cullY);
}

function addRouteSegment(state) {
  const track = state.track || TRACKS[0];
  const progress = state.track?.endless ? clamp(-state.genTop / 6000, 0, 1) : clamp(-state.genTop / track.summit, 0, 1);

  // big vertical gap — scales hard with difficulty & height
  const vGap = track.gapMin + Math.random() * (track.gapMax - track.gapMin) + progress * track.gapGrow;
  const lastHold = state.holds[state.holds.length - 1];
  const prevX = lastHold ? lastHold.baseX : MW / 2;

  // Every 4th hold: force a big side-to-side cross-wall launch
  let hShift;
  if (state.routeStep > 0 && state.routeStep % 4 === 0) {
    const targetSide = prevX < MW / 2 ? 1 : -1;
    hShift = targetSide * rand(track.spread * 0.75, track.spread * 1.15);
  } else {
    hShift = (Math.random() - 0.5) * 2 * track.spread * (0.6 + progress * 0.4);
  }
  const nx = clamp(prevX + hShift, 40, MW - 40);
  const ny = state.genTop - vGap;

  const type = pickHoldType(progress, track.env);
  const hold = { x: nx, y: ny, type, baseX: nx, baseY: ny, phase: Math.random() * 6.28, broken: false, crumbling: false, crumbleT: 0 };
  if (HOLD_TYPES[type].move) { hold.moveAxis = 'x'; hold.moveRange = rand(20, 45); hold.moveSpeed = rand(0.02, 0.04); }
  state.holds.push(hold);
  state.genTop = ny;
  state.routeStep++;

  // Rock wall obstacle — a protruding outcrop that blocks a direct line, forcing
  // you to launch over or around it. Placed off to one side of the new hold so a
  // viable route always exists.
  if (progress > 0.12 && Math.random() < track.wallChance) {
    const ww = rand(38, 78);
    const wh = rand(70, 140);
    const side = Math.random() < 0.5 ? -1 : 1;
    const wx = clamp(nx + side * rand(70, 130) - ww / 2, 4, MW - ww - 4);
    const wy = ny + rand(10, 70);
    state.walls.push({ x: wx, y: wy, w: ww, h: wh });
  }

  // Branch hold — alternative route (appears mid+ difficulty)
  if (progress > 0.18 && Math.random() < 0.30) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const bx = clamp(nx + dir * rand(80, 140), 38, MW - 38);
    const by = ny + rand(-18, 22);
    const bType = pickHoldType(progress, track.env);
    const bh = { x: bx, y: by, type: bType, baseX: bx, baseY: by, phase: Math.random() * 6.28, broken: false, crumbling: false, crumbleT: 0 };
    if (HOLD_TYPES[bType].move) { bh.moveAxis = 'x'; bh.moveRange = rand(20, 45); bh.moveSpeed = rand(0.02, 0.04); }
    state.holds.push(bh);
  }

  // Rest platform every ~9 route steps
  if (state.routeStep % 9 === 0) {
    const pw = rand(85, 130);
    const px = clamp(nx - pw / 2 + rand(-30, 30), 16, MW - pw - 16);
    const py = ny + rand(-25, 25);
    state.platforms.push({ x: px, y: py, w: pw, h: 16 });
    state.holds.push({ x: px + 6, y: py, type: 'large', baseX: px + 6, baseY: py, phase: 0, broken: false, crumbling: false, crumbleT: 0, ledge: true });
    state.holds.push({ x: px + pw - 6, y: py, type: 'large', baseX: px + pw - 6, baseY: py, phase: 0, broken: false, crumbling: false, crumbleT: 0, ledge: true });
  }

  // Checkpoint every ~16 route steps
  if (state.routeStep % 16 === 0) {
    const recentPlat = state.platforms[state.platforms.length - 1];
    let cp;
    if (recentPlat && Math.abs(recentPlat.y - ny) < 80) cp = { x: recentPlat.x + recentPlat.w / 2, y: recentPlat.y, w: recentPlat.w };
    else {
      const pw2 = 90, px2 = clamp(nx - pw2 / 2, 20, MW - pw2 - 20);
      cp = { x: px2 + pw2 / 2, y: ny, w: pw2 };
      state.platforms.push({ x: px2, y: ny, w: pw2, h: 16 });
    }
    state.checkpoints.push({ x: cp.x, y: cp.y, w: cp.w, active: false });
  }
}

function pickHoldType(d, envIdx) {
  const r = Math.random();
  if (envIdx === 4 && r < 0.3) return 'ice';
  if (envIdx === 5 && r < 0.28) return 'ice';
  if (envIdx === 1 && r < 0.22) return 'mossy';
  if (envIdx === 3 && r < 0.18) return 'mossy';
  if (d < 0.12) {
    if (r < 0.55) return 'large';
    if (r < 0.9) return 'medium';
    return 'small';
  }
  if (d < 0.35) {
    if (r < 0.2) return 'large';
    if (r < 0.55) return 'medium';
    if (r < 0.78) return 'small';
    if (r < 0.9) return 'slippery';
    return 'mossy';
  }
  if (d < 0.65) {
    if (r < 0.1) return 'large';
    if (r < 0.38) return 'medium';
    if (r < 0.62) return 'small';
    if (r < 0.78) return 'slippery';
    if (r < 0.9) return 'cracked';
    return 'breakable';
  }
  if (r < 0.05) return 'large';
  if (r < 0.25) return 'medium';
  if (r < 0.55) return 'small';
  if (r < 0.72) return 'tiny';
  if (r < 0.86) return 'slippery';
  if (r < 0.95) return 'cracked';
  return 'breakable';
}

export default function RockClimbing({ onExit, onAward, unlockedIds = ['yellow'], equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, sfxVolume = 70, musicVolume = 50, settings = {}, charLevels = {} }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('select');
  const [charId, setCharId] = useState(unlockedIds[0] || 'yellow');
  const [trackId, setTrackId] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [mode2P, setMode2P] = useState(false);
  const [selElement, setSelElement] = useState('basic');
  const [result, setResult] = useState(null);
  const stRef = useRef(null);
  const keysRef = useRef({});
  const edgeRef = useRef({ jump: false, down: false });
  const gpPrevRef = useRef({});

  const charPool = (unlockedIds.length ? unlockedIds : ['yellow']).map(id => ({ id, char: resolveChar(id, customCharsData) }));

  const initRun = useCallback((id, tid) => {
    const char = resolveChar(id, customCharsData);
    const ds = deriveStats(char, selElement);
    const track = TRACKS[tid] || TRACKS[0];
    stRef.current = {
      track,
      player: { x: MW / 2, y: -40, vx: 0, vy: 0, state: 'air', hold: null, facing: 1, frame: 0, grip: ds.gripMax, coyote: 0, dead: false, grabCooldown: 0, aim: 0, aimPhase: 0, grabAnim: 0, dropAnim: 0, steer: false },
      holds: [], platforms: [], checkpoints: [], walls: [],
      genTop: -80, routeStep: 0,
      stats: ds,
      time: 0, startMs: Date.now(),
      bestMs: parseInt(localStorage.getItem('element6_rockclimb_best_' + (tid || 0)) || '0', 10) || 0,
      over: false, finished: false,
      cpUsed: 0, usedCheckpoint: false,
      rocks: [], windT: 0, windDir: 0, windForce: 0, windActive: false, windWarn: 0,
      particles: [], shake: 0, chalkDust: [],
      lavaY: 500, lavaSpeed: 0.2,
      camY: undefined,
    };
    stRef.current.platforms.push({ x: MW / 2 - 75, y: 0, w: 150, h: 24 });
    stRef.current.checkpoints.push({ x: MW / 2, y: 0, w: 150, active: true });
    stRef.current._spawn = { x: MW / 2, y: 0 };
    stRef.current._spawnPlatform = stRef.current.platforms[0];
    ensureGenerated(stRef.current);
  }, [customCharsData, selElement]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    if (phase === 'play') music.play('rockclimb');
    return () => { if (phase === 'play') music.stop(); };
  }, [phase, musicVolume, sfxVolume]);

  useEffect(() => {
    if (phase !== 'play') return;
    window.__el6GameplayActive = true;
    return () => { window.__el6GameplayActive = false; };
  }, [phase]);

  // ── Input ──
  useEffect(() => {
    if (phase !== 'play') return;
    const isJump = k => k === ' ' || k === 'arrowup' || k === 'w';
    const isDown = k => k === 'arrowdown' || k === 's';
    const kd = e => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'p') { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); return; }
      if (['F5', 'F12'].includes(e.key)) return;
      if (isJump(k) && !keysRef.current[k]) edgeRef.current.jump = true;
      if (isDown(k) && !keysRef.current[k]) edgeRef.current.down = true;
      keysRef.current[k] = true;
      e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [phase, onExit]);

  // ── Loop ──
  useEffect(() => {
    if (phase !== 'play') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, last = performance.now();
    const loop = (now) => {
      const s = stRef.current; if (!s) { raf = requestAnimationFrame(loop); return; }
      if (pausedRef.current) { raf = requestAnimationFrame(loop); return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const gp = settings.controllerEnabled !== false ? readGamepadInput(0) : null;
      if (gp) {
        if (gp.sig && !gpPrevRef.current.sig) edgeRef.current.jump = true;
        if (gp.down && !gpPrevRef.current.down) edgeRef.current.down = true;
      }
      gpPrevRef.current = gp ? { sig: gp.sig, down: gp.down } : {};

      update(s, dt, {
        jump: edgeRef.current.jump, down: edgeRef.current.down,
        leftHeld: keysRef.current['arrowleft'] || keysRef.current['a'] || (gp && gp.left),
        rightHeld: keysRef.current['arrowright'] || keysRef.current['d'] || (gp && gp.right),
      });
      edgeRef.current.jump = edgeRef.current.down = false;
      draw(ctx, s, charId, customCharsData, equippedSkins, equippedAccessories);
      if (s.over) { finishRun(s); setPhase('over'); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, charId, customCharsData, equippedSkins, equippedAccessories, settings.controllerEnabled]);

  function update(s, dt, input) {
    const p = s.player;
    if (s.over) return;
    s.time = Date.now() - s.startMs;
    p.frame++;
    const progress = s.track?.endless ? clamp(-p.y / 6000, 0, 1) : clamp(-p.y / (s.track?.summit || SUMMIT_HEIGHT), 0, 1);
    ensureGenerated(s);

    // ── rising lava (Rock Wall / endless) ──
    if (s.track?.endless) {
      s.lavaSpeed = Math.min(s.lavaSpeed + 0.0004, 1.5);
      s.lavaY -= s.lavaSpeed;
      if (p.y >= s.lavaY) { s.over = true; sfx.gameOverRun(); return; }
    }

    // ── moving holds ──
    for (const h of s.holds) {
      if (h.broken) continue;
      const ht = HOLD_TYPES[h.type] || HOLD_TYPES.medium;
      if (ht.move && h.moveAxis) {
        h.phase += h.moveSpeed;
        h.x = h.baseX + Math.sin(h.phase) * h.moveRange;
      }
    }
    // ── breakable / cracked crumbling while grabbed ──
    if (p.hold) {
      const ht = HOLD_TYPES[p.hold.type] || HOLD_TYPES.medium;
      if (ht.breaks && !p.hold.crumbling) { p.hold.crumbling = true; p.hold.crumbleT = 36; sfx.rockBreak(); }
      if (ht.crack && !p.hold.crumbling && Math.random() < 0.004) { p.hold.crumbling = true; p.hold.crumbleT = 60; }
    }
    for (const h of s.holds) {
      if (h.crumbling && !h.broken) { h.crumbleT--; if (h.crumbleT <= 0) { h.broken = true; if (p.hold === h) { releaseHold(s, false); sfx.rockBreak(); s.shake = 8; } } }
    }

    // ── falling rocks (obstacle) ──
    if (s.track && Math.random() < s.track.rockChance * (1 + progress * 2)) {
      s.rocks.push({ x: rand(20, MW - 20), y: p.y - rand(500, 800), vy: 0, r: rand(9, 15), rot: 0 });
    }
    s.rocks = s.rocks.filter(rk => {
      rk.vy += 0.22; rk.y += rk.vy; rk.rot += 0.1;
      if (Math.abs(rk.x - p.x) < 16 && Math.abs(rk.y - p.y) < 28) {
        sfx.rockBreak(); s.shake = 12;
        if (p.state === 'climbing') releaseHold(s, false);
        p.vx = (p.x < rk.x ? -1 : 1) * 4.5; p.vy = -3; p.state = 'air'; p.steer = true;
        return false;
      }
      return rk.y < p.y + 700;
    });

    // ── wind gusts (obstacle) ──
    if (s.track && s.track.windChance > 0) {
      if (!s.windActive && Math.random() < s.track.windChance * (0.5 + progress)) {
        s.windActive = true; s.windT = 0; s.windDur = rand(80, 160);
        s.windDir = Math.random() < 0.5 ? -1 : 1; s.windForce = 0.05 + progress * 0.045;
        s.windWarn = 55; sfx.wind();
      }
      if (s.windActive) {
        s.windWarn = Math.max(0, s.windWarn - 1);
        if (s.windWarn <= 0) {
          s.windT++;
          if (p.state === 'air') p.vx += s.windDir * s.windForce * 2;
          else if (p.state === 'climbing') {
            const ht = HOLD_TYPES[p.hold?.type];
            if (ht?.slip && Math.random() < 0.018) { releaseHold(s, false); p.vx = s.windDir * 2.5; p.vy = -1.5; p.state = 'air'; }
          }
          if (s.windT > s.windDur) s.windActive = false;
        }
      }
    }

    // ── grip drain while holding ──
    if (p.state === 'climbing' && p.hold) {
      const ht = HOLD_TYPES[p.hold.type] || HOLD_TYPES.medium;
      p.grip -= ht.gripDrain;
      if (ht.slip) p.y += 0.3;
      if (p.grip <= 0) { releaseHold(s, false); p.grabCooldown = 12; sfx.hit(); p.vy = 2; p.state = 'air'; p.steer = true; return; }
    }

    // animate grab/drop timers
    if (p.grabAnim > 0) p.grabAnim--;
    if (p.dropAnim > 0) p.dropAnim--;
    if (p.grabCooldown > 0) p.grabCooldown--;

    // ── aim oscillation while hanging or resting ──
    if (p.state === 'climbing' || p.state === 'ledge') {
      const speed = AIM_BASE_SPEED * (s.track?.aimSpeed || 1) * (1 + progress * 0.4);
      p.aimPhase = (p.aimPhase || 0) + speed;
      p.aim = AIM_SWEEP * Math.sin(p.aimPhase);
    }

    // ── state machine ──
    if (p.state === 'climbing' && p.hold) {
      if (input.jump) {
        // LAUNCH in the exact direction the aim arrow points
        // Aim assist: nudge aim toward nearest hold above (scales with Control stat, max 30% at ctl 10)
        let a = p.aim || 0;
        const assist = s.stats.aimAssist || 0;
        if (assist > 0 && s.holds) {
          let nearest = null, nearestDist = Infinity;
          for (const h of s.holds) {
            if (h.y >= p.y) continue;
            const dist = Math.hypot(h.x - p.x, h.y - p.y);
            if (dist < nearestDist) { nearestDist = dist; nearest = h; }
          }
          if (nearest) {
            const targetAngle = Math.atan2(nearest.x - p.x, -(nearest.y - p.y));
            a = a + (targetAngle - a) * assist;
          }
        }
        const power = s.stats.launchPower;
        releaseHold(s, true);
        p.grabCooldown = 10;
        p.vx = power * Math.sin(a);
        p.vy = -power * Math.cos(a);
        p.facing = a < 0 ? -1 : 1;
        p.state = 'air'; p.coyote = 0; p.steer = false;
        sfx.jump(); spawnChalk(s, p.x, p.y);
      } else if (input.down) {
        releaseHold(s, false);
        p.grabCooldown = 12; p.vy = 1.5; p.state = 'air'; p.steer = true; sfx.grab();
      }
    } else if (p.state === 'ledge') {
      p.grip = Math.min(s.stats.gripMax, p.grip + s.stats.gripRegen);
      if (input.jump) {
        // Aim assist: nudge aim toward nearest hold above (scales with Control stat, max 30% at ctl 10)
        let a = p.aim || 0;
        const assist = s.stats.aimAssist || 0;
        if (assist > 0 && s.holds) {
          let nearest = null, nearestDist = Infinity;
          for (const h of s.holds) {
            if (h.y >= p.y) continue;
            const dist = Math.hypot(h.x - p.x, h.y - p.y);
            if (dist < nearestDist) { nearestDist = dist; nearest = h; }
          }
          if (nearest) {
            const targetAngle = Math.atan2(nearest.x - p.x, -(nearest.y - p.y));
            a = a + (targetAngle - a) * assist;
          }
        }
        const power = s.stats.launchPower;
        p.vy = -power * Math.cos(a);
        p.vx = power * Math.sin(a);
        p.facing = a < 0 ? -1 : 1;
        p.state = 'air'; p.coyote = 0; p.ledgePlatform = null; p.steer = false;
        sfx.jump(); spawnChalk(s, p.x, p.y);
      }
    } else {
      // AIR — committed to the launch direction, UNLESS you dropped (then you can steer left/right while falling).
      if (p.coyote > 0) p.coyote--;
      p.vy = Math.min(p.vy + GRAV, 16);
      if (p.steer) {
        const sp = 4.5;
        if (input.leftHeld) { p.vx = Math.max(p.vx - 0.5, -sp); p.facing = -1; }
        else if (input.rightHeld) { p.vx = Math.min(p.vx + 0.5, sp); p.facing = 1; }
        else p.vx *= 0.94;
      } else {
        p.vx *= 0.995; // very light air drag
      }
      const dist = Math.max(Math.abs(p.vx), Math.abs(p.vy));
      const steps = Math.max(1, Math.ceil(dist / 7));
      for (let i = 0; i < steps && p.state === 'air'; i++) {
        p.x += p.vx / steps;
        p.y += p.vy / steps;
        p.x = clamp(p.x, 4, MW - 4);

        // wall collision — bounce off and fall
        for (const w of s.walls) {
          if (p.x > w.x - 4 && p.x < w.x + w.w + 4 && p.y > w.y && p.y < w.y + w.h) {
            sfx.rockBreak(); s.shake = 10; spawnDust(s, p.x, p.y, p.vx < 0 ? 1 : -1);
            p.vx *= -0.25; p.vy = Math.max(p.vy, 3);
            break;
          }
        }
        if (p.state !== 'air') break;

        // auto-grab holds when overlapping
        if (p.grabCooldown <= 0) {
          for (const h of s.holds) {
            if (h.broken) continue;
            const ht = HOLD_TYPES[h.type] || HOLD_TYPES.medium;
            if (Math.hypot(h.x - p.x, h.y - (p.y - PH * 0.5)) < ht.r + 18) { latchHold(s, h); break; }
          }
        }
        if (p.state !== 'air') break;

        // land on platforms (stand on top)
        if (p.vy > 0) {
          for (const pl of s.platforms) {
            if (p.x + PW > pl.x && p.x - PW < pl.x + pl.w && p.y >= pl.y && p.y <= pl.y + 14) {
              p.y = pl.y; p.vy = 0; p.state = 'ledge'; p.ledgePlatform = pl;
              p.grip = Math.min(s.stats.gripMax, p.grip + s.stats.gripRegen * 6);
              sfx.land(); spawnChalk(s, p.x, p.y);
              for (const cp of s.checkpoints) {
                if (!cp.active && Math.abs(cp.y - pl.y) < 30 && p.x > cp.x - cp.w / 2 && p.x < cp.x + cp.w / 2) {
                  cp.active = true; s._spawn = { x: cp.x, y: cp.y }; s._spawnPlatform = pl; s.cpUsed++; s.usedCheckpoint = true; sfx.checkpoint();
                }
              }
              break;
            }
          }
        }
      }
    }

    // ── summit reached ──
    if (p.y <= -(s.track?.summit || SUMMIT_HEIGHT)) { s.finished = true; s.over = true; sfx.summit(); return; }

    // ── fall death ──
    if (p.y > s._spawn.y + 700 || (p.state === 'air' && p.y > s._spawn.y + 200 && p.vy > 0 && s._spawn.y !== 0 && p.y > s._spawn.y + 140)) {
      s.over = true; sfx.gameOverRun();
    }

    // particles
    for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--; }
    s.particles = s.particles.filter(pt => pt.life > 0);
    for (const cd of s.chalkDust) { cd.x += cd.vx; cd.y += cd.vy; cd.vy += 0.05; cd.life--; }
    s.chalkDust = s.chalkDust.filter(cd => cd.life > 0);
    if (s.shake > 0) s.shake *= 0.85;

    // ── smoother camera (eased follow) ──
    const targetCamY = p.y - PLAYER_SCREEN_Y;
    if (s.camY === undefined) s.camY = targetCamY;
    s.camY += (targetCamY - s.camY) * 0.14;
  }

  function latchHold(s, h) {
    const p = s.player;
    p.hold = h; p.state = 'climbing'; p.vx = 0; p.vy = 0;
    p.x = h.x; p.y = h.y + PH * 0.5;
    p.grip = s.stats.gripMax; // grip fully regens the instant you grab a new hold
    p.grabAnim = 12; p.aimPhase = Math.random() * 6.28; p.aim = 0;
    sfx.grab(); spawnChalk(s, h.x, h.y);
    s.shake = Math.max(s.shake, 3);
  }
  function releaseHold(s, isJump) {
    const p = s.player;
    if (!isJump) p.dropAnim = 10; // small drop animation only when letting go, not when launching
    p.hold = null; p.state = 'air'; p.coyote = 0;
  }
  function spawnChalk(s, x, y) {
    for (let i = 0; i < 7; i++) s.chalkDust.push({ x, y, vx: rand(-1.8, 1.8), vy: rand(-2.2, -0.3), life: rand(12, 24) });
  }
  function spawnDust(s, x, y, dir) {
    for (let i = 0; i < 6; i++) s.particles.push({ x, y, vx: dir * rand(0.5, 2.8), vy: rand(-2.5, -0.5), life: rand(10, 20), color: '#ccc' });
  }

  async function finishRun(s) {
    const time = s.time;
    const isRecord = s.finished && (s.bestMs === 0 || time < s.bestMs);
    if (s.finished && isRecord) { localStorage.setItem('element6_rockclimb_best_' + (s.track?.id ?? 0), String(Math.floor(time))); s.bestMs = Math.floor(time); sfx.personalBest(); }
    let rank = null, saved = false;
    if (s.finished) {
      try {
        const me = await db.auth.me().catch(() => null);
        if (me) {
          const char = resolveChar(charId, customCharsData);
          const uname = me.full_name || me.email || 'Climber';
          const existing = await db.entities.RockClimbScore.filter({ user_id: me.id });
          if (existing && existing.length) {
            const best = existing.reduce((a, b) => ((a.time_ms || 0) <= (b.time_ms || 0) ? a : b));
            if (Math.floor(time) < (best.time_ms || Infinity)) {
              await db.entities.RockClimbScore.update(best.id, { time_ms: Math.floor(time), user_name: uname, char_id: charId, char_name: char?.name || charId, checkpoints_used: s.cpUsed, no_checkpoint_run: !s.usedCheckpoint });
            }
            for (const e of existing) if (e.id !== best.id) await db.entities.RockClimbScore.delete(e.id).catch(() => {});
          } else {
            await db.entities.RockClimbScore.create({ user_id: me.id, user_name: uname, char_id: charId, char_name: char?.name || charId, time_ms: Math.floor(time), checkpoints_used: s.cpUsed, no_checkpoint_run: !s.usedCheckpoint });
          }
          saved = true;
          const all = await db.entities.RockClimbScore.list('-created_date', 200);
          const sorted = [...(all || [])].sort((a, b) => (a.time_ms || 0) - (b.time_ms || 0));
          rank = sorted.findIndex(e => e.user_id === me.id) + 1;
          if (rank <= 0) rank = sorted.length;
        }
      } catch { saved = false; }
    }
    setResult({ finished: s.finished, time: Math.floor(time), best: s.bestMs, rank, isRecord, saved, cpUsed: s.cpUsed, noCP: !s.usedCheckpoint });
    onAward?.({ sport: 'rockclimb', p1Won: s.finished, p1CharId: charId, stats: { time_ms: Math.floor(time), finished: s.finished }, tournamentWon: s.finished });
  }

  const startRun = (id) => { setCharId(id); initRun(id, trackId); setResult(null); setPaused(false); pausedRef.current = false; setPhase('play'); sfx.click(); };

  if (mode2P) {
    return (
      <RockClimbing2P
        onExit={() => setMode2P(false)}
        onAward={onAward}
        unlockedIds={unlockedIds}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings}
        charLevels={charLevels}
      />
    );
  }

  // ── Character select ──
  if (phase === 'select') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🧗" size={14} /> ROCK CLIMBING</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1 max-w-xl">Scale a massive mountain with a timing-based launch system. An arrow oscillates above your head while you hang — press Jump to launch exactly where it points. Time it right to chain holds; mistime it and you fall. Routes are brutal — big gaps, side-to-side leaps, and walls you must launch over.</p>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> SPORTS</button>
        </div>
        <div className="w-full flex gap-2 justify-center">
          <button onClick={() => { setPhase('lb'); sfx.click(); }} className="px-4 py-1.5 bg-primary/20 border border-primary text-primary rounded-lg font-heading text-xs hover:bg-primary hover:text-primary-foreground"><GameIcon emoji="🏆" size={14} /> LEADERBOARD</button>
          <button onClick={() => { setMode2P(true); sfx.click(); }} className="px-4 py-1.5 bg-accent/20 border border-accent text-accent rounded-lg font-heading text-xs hover:bg-accent hover:text-accent-foreground"><GameIcon emoji="👥" size={14} /> 2P COUCH SPLIT</button>
        </div>
        <p className="text-[11px] font-heading text-muted-foreground tracking-wider mt-2">SELECT TRACK</p>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 w-full">
          {TRACKS.map(t => (
            <button key={t.id} onClick={() => { setTrackId(t.id); sfx.click(); }}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition hover:scale-[1.05] ${trackId === t.id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
              <span className="font-heading text-lg text-accent">{t.endless ? '∞' : t.diff}</span>
              <span className="font-heading text-[7px] tracking-wider text-center leading-tight">{t.name.toUpperCase()}</span>
              {t.endless && <span className="font-heading text-[6px] tracking-wider text-destructive animate-pulse">INFINITE</span>}
            </button>
          ))}
        </div>
        <p className="text-[11px] font-heading text-muted-foreground tracking-wider mt-2">CHOOSE YOUR CLIMBER</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
          {charPool.map(({ id, char }) => {
            const stats = char?.stats || {};
            return (
            <button key={id} onClick={() => { setCharId(id); sfx.characterSelect(); }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition hover:scale-[1.04] ${charId === id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
              <span className="w-8 h-8 rounded-full" style={{ background: char?.color || '#888' }} />
              <span className="font-heading text-[10px] tracking-wider" style={{ color: char?.color }}>{(char?.name || id).toUpperCase().slice(0, 8)}</span>
              <span className="text-[7px] text-muted-foreground font-body text-center leading-tight">PWR {stats.power ?? 5} · SPD {stats.speed ?? 5} · DEF {stats.defense ?? 5} · UTL {stats.utility ?? 5} · CTL {stats.control ?? 5}</span>
            </button>
            );
          })}
        </div>
        {charId && (
          <ElementSelect charId={charId} currentElement={selElement} onSelect={(el) => { setSelElement(el); sfx.click(); }} charLevels={charLevels} label="ELEMENT (affects climb stats)" />
        )}
        <button onClick={() => startRun(charId)} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90 animate-pulse"><GameIcon emoji="▶" size={14} /> START CLIMB</button>
        <div className="text-[10px] text-muted-foreground font-body text-center max-w-xl mt-1">
          <p className="font-heading text-foreground/80 mb-1">CONTROLS</p>
          <p><span className="text-accent font-bold"><GameIcon emoji="↑" size={14} /> / W / SPACE</span> Launch in the direction the arrow points (time it!)</p>
          <p><span className="text-accent font-bold"><GameIcon emoji="↓" size={14} /> / S</span> Let go of the hold (drop)</p>
          <p className="mt-1">The oscillating arrow above your head sets your launch direction — press Jump at the right moment to fly to the next hold. You can only steer left/right while falling after dropping; launches are committed. Chain launches to climb fast. Power <GameIcon emoji="→" size={14} /> launch force · Utility <GameIcon emoji="→" size={14} /> grip. Reach the summit!</p>
        </div>
      </div>
    );
  }

  if (phase === 'lb') return <RockClimbLeaderboard onBack={() => setPhase('select')} customCharsData={customCharsData} />;

  // ── Game over / summit ──
  if (phase === 'over' && result) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <h2 className={`text-3xl font-heading tracking-wider ${result.finished ? 'text-accent' : 'text-destructive'}`}>{result.finished ? <><GameIcon emoji="⛰️" size={14} /> SUMMIT REACHED!</> : 'YOU FELL!'}</h2>
        <p className="text-sm text-muted-foreground font-body">{result.finished ? 'You conquered the mountain!' : 'You slipped and fell — try again!'}</p>
        <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-3 items-center">
          {result.isRecord && <p className="font-heading text-accent text-lg animate-pulse"><GameIcon emoji="⭐" size={14} /> NEW PERSONAL RECORD! <GameIcon emoji="⭐" size={14} /></p>}
          {result.noCP && result.finished && <p className="font-heading text-primary text-sm"><GameIcon emoji="🏅" size={14} /> NO-CHECKPOINT RUN!</p>}
          <div className="text-center">
            <p className="text-[11px] font-heading text-muted-foreground tracking-wider">COMPLETION TIME</p>
            <p className="text-4xl font-heading text-primary">{fmtTime(result.time)}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-[10px] font-heading text-muted-foreground">PERSONAL BEST</p><p className="text-lg font-heading text-accent">{result.best ? fmtTime(result.best) : '—'}</p></div>
            <div><p className="text-[10px] font-heading text-muted-foreground">WORLD RANK</p><p className="text-lg font-heading text-accent">{result.rank ? '#' + result.rank : '—'}</p></div>
            <div><p className="text-[10px] font-heading text-muted-foreground">CHECKPOINTS</p><p className="text-lg font-heading text-accent">{result.cpUsed}</p></div>
          </div>
          {!result.saved && result.finished && <p className="text-[9px] text-muted-foreground font-body">Sign in to save your time to the global leaderboard.</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => startRun(charId)} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="↻" size={14} /> CLIMB AGAIN</button>
          <button onClick={() => { setPhase('lb'); sfx.click(); }} className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="🏆" size={14} /> LEADERBOARD</button>
          <button onClick={onExit} className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">SPORTS</button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={onExit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Quit</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause</button>
        <span className="text-[10px] text-muted-foreground font-body"><GameIcon emoji="↑" size={14} />/W/SPACE: Launch (time the arrow!) · <GameIcon emoji="↓" size={14} />/S: Let go · <GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} />/AD: Steer while falling · ESC/P: Pause</span>
      </div>
      {paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg gap-4 z-10">
          <h2 className="text-3xl font-heading text-accent">PAUSED</h2>
          <div className="flex gap-2">
            <button onClick={() => { pausedRef.current = false; setPaused(false); }} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="▶" size={14} /> RESUME</button>
            <button onClick={onExit} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">QUIT TO MENU</button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: W + 'px', height: 'auto', aspectRatio: `${W} / ${H}`, background: '#0e1a14' }} />
    </div>
  );
}

// ── Rendering ──
function draw(ctx, s, charId, customCharsData, skins, accs) {
  const p = s.player;
  const camY = s.camY ?? (p.y - PLAYER_SCREEN_Y);
  const progress = s.track?.endless ? clamp(-p.y / 6000, 0, 1) : clamp(-p.y / (s.track?.summit || SUMMIT_HEIGHT), 0, 1);
  const env = { idx: s.track?.env ?? 0, name: ENV_NAMES[s.track?.env ?? 0], progress };
  const shakeX = s.shake ? (Math.random() - 0.5) * s.shake : 0;
  const shakeY = s.shake ? (Math.random() - 0.5) * s.shake : 0;

  drawBackground(ctx, camY, env, progress, s);

  ctx.save();
  ctx.translate(MARGIN + shakeX, -camY + shakeY);

  drawCliffFace(ctx, -40, camY - 100, 40, H + 200, env, 'left', s);
  drawCliffFace(ctx, MW, camY - 100, 40, H + 200, env, 'right', s);

  for (const w of s.walls) drawWall(ctx, w, env);
  for (const pl of s.platforms) drawPlatform(ctx, pl, env);
  for (const cp of s.checkpoints) drawCheckpoint(ctx, cp);
  for (const h of s.holds) drawHold(ctx, h, s.player, env);
  for (const rk of s.rocks) drawRock(ctx, rk);
  for (const cd of s.chalkDust) { ctx.globalAlpha = Math.max(0, cd.life / 24) * 0.4; ctx.fillStyle = '#f0eedd'; ctx.beginPath(); ctx.arc(cd.x, cd.y, 2, 0, Math.PI * 2); ctx.fill(); }
  for (const pt of s.particles) { ctx.globalAlpha = Math.max(0, pt.life / 20) * 0.5; ctx.fillStyle = pt.color || '#ccc'; ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;

  if (s.track?.endless) drawLava(ctx, s);

  drawPlayer(ctx, s, charId, customCharsData, skins, accs);
  drawAimArrow(ctx, p);

  ctx.restore();

  drawHUD(ctx, s, env, progress, camY);

  if (s.windActive && s.windWarn > 0) {
    ctx.fillStyle = `rgba(255,200,80,${0.1 + 0.1 * Math.sin(Date.now() * 0.02)})`; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('<GameIcon emoji="⚠" size={14} /> WIND GUST INCOMING', W / 2, 60);
  } else if (s.windActive) {
    ctx.fillStyle = `rgba(120,180,220,${0.05 + 0.05 * Math.sin(Date.now() * 0.02)})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(200,220,255,0.2)'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const wy = (i * 80 + s.player.frame * 4) % H; ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(W, wy + s.windDir * 20); ctx.stroke(); }
  }
}

const ENV_PALETTES = [
  { sky1: '#2a1a10', sky2: '#4a3020', cliff: '#5a4030', cliff2: '#3a2820', rock: '#6a5040', hold: '#9a8060', plat: '#7a6048', accent: '#8a6a40' },
  { sky1: '#10180a', sky2: '#1c3010', cliff: '#2a3a18', cliff2: '#1a2810', rock: '#3a4a28', hold: '#6a8a40', plat: '#4a5a30', accent: '#5a7a30' },
  { sky1: '#082030', sky2: '#0a3a4a', cliff: '#1a3a4a', cliff2: '#0a2a3a', rock: '#2a5060', hold: '#5aa0c0', plat: '#3a6070', accent: '#4a90b0' },
  { sky1: '#2a2618', sky2: '#403828', cliff: '#4a4030', cliff2: '#322820', rock: '#5a4a38', hold: '#9a8a60', plat: '#6a5a40', accent: '#8a7a50' },
  { sky1: '#162232', sky2: '#2a4050', cliff: '#4a5a6a', cliff2: '#3a4a5a', rock: '#5a6a78', hold: '#c0d0e0', plat: '#6a7a8a', accent: '#8a9aaa' },
  { sky1: '#180a2a', sky2: '#2a1840', cliff: '#2a1840', cliff2: '#1a0a30', rock: '#3a2050', hold: '#9a6acc', plat: '#4a2a6a', accent: '#6a4a8a' },
  { sky1: '#0a0a1a', sky2: '#1a1a2a', cliff: '#2a2a3a', cliff2: '#1a1a28', rock: '#3a3a4a', hold: '#8a8aaa', plat: '#4a4a5a', accent: '#5a5a7a' },
  { sky1: '#2a2410', sky2: '#40381a', cliff: '#4a3a20', cliff2: '#322818', rock: '#5a4a28', hold: '#d8c060', plat: '#6a5a30', accent: '#8a7a40' },
  { sky1: '#4a4a54', sky2: '#6e6e7a', cliff: '#7a7a86', cliff2: '#56565e', rock: '#8a8a96', hold: '#aaaab4', plat: '#6a6a74', accent: '#9a9aa6' },
];

function drawBackground(ctx, camY, env, progress, s) {
  const pal = ENV_PALETTES[env.idx] || ENV_PALETTES[0];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.sky2); g.addColorStop(1, pal.sky1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = pal.cliff2;
  for (let i = 0; i < 6; i++) {
    const px = (i * 260 - (camY * 0.025) % 260) - 130;
    const peakH = 340 + (i % 3) * 90;
    ctx.beginPath(); ctx.moveTo(px, H); ctx.lineTo(px + 130, H - peakH); ctx.lineTo(px + 260, H); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = pal.cliff;
  for (let i = 0; i < 7; i++) {
    const px = (i * 220 - (camY * 0.05) % 220) - 110;
    const peakH = 250 + (i % 3) * 80;
    ctx.beginPath(); ctx.moveTo(px, H); ctx.lineTo(px + 110, H - peakH); ctx.lineTo(px + 220, H); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = pal.rock;
  for (let i = 0; i < 8; i++) {
    const px = (i * 180 - (camY * 0.08) % 180) - 90;
    const peakH = 170 + (i % 3) * 60;
    ctx.beginPath(); ctx.moveTo(px, H); ctx.lineTo(px + 90, H - peakH); ctx.lineTo(px + 180, H); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const fogG = ctx.createLinearGradient(0, H * 0.3, 0, H);
  fogG.addColorStop(0, 'rgba(0,0,0,0)');
  fogG.addColorStop(1, `rgba(0,0,0,0.25)`);
  ctx.fillStyle = fogG; ctx.fillRect(0, 0, W, H);

  if (env.idx === 2) {
    ctx.fillStyle = 'rgba(150,220,255,0.15)';
    for (let i = 0; i < 3; i++) { const wx = 100 + i * 220; for (let j = 0; j < 20; j++) { const wy = (j * 30 + s.player.frame * 2) % H; ctx.fillRect(wx + Math.sin(wy * 0.1) * 3, wy, 14, 24); } }
  } else if (env.idx === 4) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 50; i++) { const sx = (i * 47 - camY * 0.08 + s.player.frame * 0.4) % W; const sy = (i * 29 + s.player.frame * 1.5) % H; ctx.beginPath(); ctx.arc(sx < 0 ? sx + W : sx, sy, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (env.idx === 5) {
    for (let i = 0; i < 24; i++) { const cx = (i * 53) % W; const cy = (i * 37 - camY * 0.15) % H; ctx.fillStyle = `rgba(200,150,255,${0.3 + 0.2 * Math.sin(s.player.frame * 0.05 + i)})`; ctx.beginPath(); ctx.arc(cx, cy < 0 ? cy + H : cy, 2.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (env.idx === 1) {
    for (let i = 0; i < 18; i++) { const fx = (i * 67 + Math.sin(s.player.frame * 0.03 + i) * 20) % W; const fy = (i * 43 + s.player.frame * 0.3) % H; ctx.fillStyle = `rgba(180,255,120,${0.3 + 0.2 * Math.sin(s.player.frame * 0.08 + i)})`; ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (env.idx === 7) {
    ctx.fillStyle = `rgba(255,220,120,${0.08 + 0.04 * Math.sin(s.player.frame * 0.04)})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,230,150,0.08)'; ctx.lineWidth = 30;
    for (let i = 0; i < 5; i++) { const a = i * 0.4 + s.player.frame * 0.001; ctx.beginPath(); ctx.moveTo(W / 2, -50); ctx.lineTo(W / 2 + Math.cos(a) * 400, -50 + Math.sin(a) * 400); ctx.stroke(); }
  } else if (env.idx === 6) {
    ctx.fillStyle = 'rgba(60,60,90,0.4)';
    for (let i = 0; i < 4; i++) { const ix = (i * 180 - camY * 0.12) % (W + 200) - 100; const iy = 80 + (i % 2) * 120; ctx.beginPath(); ctx.ellipse(ix, iy, 40, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(ix - 30, iy, 60, 30); }
  }
}

function drawCliffFace(ctx, x, y, w, h, env, side, s) {
  const pal = ENV_PALETTES[env.idx] || ENV_PALETTES[0];
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, side === 'left' ? pal.cliff2 : pal.cliff);
  g.addColorStop(0.5, pal.rock);
  g.addColorStop(1, side === 'left' ? pal.cliff : pal.cliff2);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let sy = y + 8; sy < y + h; sy += 24) ctx.fillRect(x, sy, w, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) { const cx = x + (i * w / 4) + 4; ctx.beginPath(); ctx.moveTo(cx, y); for (let cy = 0; cy < h; cy += 20) ctx.lineTo(cx + Math.sin(cy * 0.1 + i) * 3, y + cy); ctx.stroke(); }
  if (env.idx === 1 || env.idx === 3) {
    ctx.fillStyle = `rgba(60,100,40,0.4)`;
    for (let i = 0; i < 8; i++) { const my = y + (i * 70) % h; ctx.beginPath(); ctx.ellipse(x + w * 0.5, my, w * 0.4, 8, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (env.idx === 4) {
    ctx.fillStyle = 'rgba(200,230,255,0.6)';
    for (let i = 0; i < 6; i++) { const ix = x + (i * 8) % w; const il = 10 + (i % 3) * 6; ctx.beginPath(); ctx.moveTo(ix, y); ctx.lineTo(ix + 3, y + il); ctx.lineTo(ix + 6, y); ctx.closePath(); ctx.fill(); }
  }
  if (env.idx === 5) {
    ctx.fillStyle = 'rgba(180,120,220,0.5)';
    for (let i = 0; i < 5; i++) { const cx = x + (i * 10) % w; const cy = y + (i * 40) % h; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 4, cy - 12); ctx.lineTo(cx + 8, cy); ctx.closePath(); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(side === 'left' ? x + w - 2 : x, y, 2, h);
}

function drawPlatform(ctx, pl, env) {
  const pal = ENV_PALETTES[env.idx] || ENV_PALETTES[0];
  ctx.fillStyle = pal.plat; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(pl.x, pl.y, pl.w, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(pl.x, pl.y + pl.h - 3, pl.w, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(pl.x, pl.y + pl.h, pl.w, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let bx = pl.x + 8; bx < pl.x + pl.w - 4; bx += 20) { ctx.beginPath(); ctx.arc(bx, pl.y + 7, 2, 0, Math.PI * 2); ctx.fill(); }
  if (env.idx === 1 || env.idx === 3) {
    ctx.fillStyle = '#5a8a30';
    for (let gx = pl.x + 4; gx < pl.x + pl.w - 2; gx += 6) { ctx.fillRect(gx, pl.y - 2, 2, 3); ctx.fillRect(gx + 1, pl.y - 3, 1, 2); }
  }
  if (env.idx === 4) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(pl.x, pl.y - 2, pl.w, 3); }
}

function drawCheckpoint(ctx, cp) {
  ctx.fillStyle = '#444'; ctx.fillRect(cp.x - 1.5, cp.y - 46, 3, 46);
  ctx.fillStyle = cp.active ? '#44ff66' : '#666';
  ctx.beginPath(); ctx.moveTo(cp.x + 1.5, cp.y - 46);
  if (cp.active) { ctx.lineTo(cp.x + 24, cp.y - 40); ctx.lineTo(cp.x + 1.5, cp.y - 32); }
  else { ctx.lineTo(cp.x + 18, cp.y - 40); ctx.lineTo(cp.x + 1.5, cp.y - 32); }
  ctx.closePath(); ctx.fill();
  if (cp.active) { ctx.shadowColor = '#44ff66'; ctx.shadowBlur = 10; ctx.fillRect(cp.x - 1.5, cp.y - 46, 3, 46); ctx.shadowBlur = 0; }
  ctx.fillStyle = cp.active ? 'rgba(68,255,102,0.3)' : 'rgba(100,100,100,0.2)';
  ctx.beginPath(); ctx.ellipse(cp.x, cp.y, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
}

// Rock wall obstacle — a protruding outcrop you must launch over or around.
function drawWall(ctx, w, env) {
  const pal = ENV_PALETTES[env.idx] || ENV_PALETTES[0];
  const g = ctx.createLinearGradient(w.x, 0, w.x + w.w, 0);
  g.addColorStop(0, darken(pal.rock, 22)); g.addColorStop(0.5, pal.rock); g.addColorStop(1, darken(pal.rock, 32));
  ctx.fillStyle = g; ctx.fillRect(w.x, w.y, w.w, w.h);
  // lit top edge
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(w.x, w.y, w.w, 3);
  // dark base
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
  // strata
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let sy = w.y + 8; sy < w.y + w.h; sy += 18) ctx.fillRect(w.x, sy, w.w, 2);
  // vertical cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) { const cx = w.x + (i + 1) * w.w / 4; ctx.beginPath(); ctx.moveTo(cx, w.y + 4); for (let cy = 0; cy < w.h; cy += 16) ctx.lineTo(cx + Math.sin(cy * 0.2 + i) * 2, w.y + cy); ctx.stroke(); }
  // warning chevrons
  ctx.fillStyle = 'rgba(255,180,40,0.5)';
  for (let cx = w.x + 6; cx < w.x + w.w - 6; cx += 14) { ctx.beginPath(); ctx.moveTo(cx, w.y + 6); ctx.lineTo(cx + 5, w.y + 12); ctx.lineTo(cx - 5, w.y + 12); ctx.closePath(); ctx.fill(); }
}

function drawHold(ctx, h, player, env) {
  if (h.broken) return;
  const ht = HOLD_TYPES[h.type] || HOLD_TYPES.medium;
  const held = player.hold === h;
  const crumbleMax = h.type === 'breakable' ? 36 : 60;
  const crumble = h.crumbling ? Math.min(1, (crumbleMax - h.crumbleT) / crumbleMax) : 0;
  ctx.globalAlpha = 1 - crumble * 0.5;
  const r = ht.r;
  const col = ht.color;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(h.x, h.y + r * 0.7, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(h.x, h.y);
  const shape = ht.shape || 'edge';

  if (shape === 'jug') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, lighten(col, 35)); grad.addColorStop(0.6, col); grad.addColorStop(1, darken(col, 28));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(col, 42);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.12, r * 0.6, r * 0.3, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.3, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (shape === 'edge') {
    const grad = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5);
    grad.addColorStop(0, lighten(col, 25)); grad.addColorStop(1, darken(col, 25));
    ctx.fillStyle = grad;
    ctx.fillRect(-r * 1.1, -r * 0.35, r * 2.2, r * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-r * 1.1, -r * 0.35, r * 2.2, 3);
    ctx.fillStyle = darken(col, 35);
    ctx.fillRect(-r * 1.1, r * 0.2, r * 2.2, r * 0.15);
  } else if (shape === 'crimp') {
    const grad = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
    grad.addColorStop(0, lighten(col, 20)); grad.addColorStop(1, darken(col, 20));
    ctx.fillStyle = grad;
    ctx.fillRect(-r, -r * 0.3, r * 2, r * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-r, -r * 0.3, r * 2, 2);
  } else if (shape === 'sloper') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.5, 1, 0, 0, r);
    grad.addColorStop(0, lighten(col, 40)); grad.addColorStop(0.7, col); grad.addColorStop(1, darken(col, 20));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.4, r * 0.4, r * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (shape === 'crack') {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, lighten(col, 25)); grad.addColorStop(1, darken(col, 25));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
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

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.arc(0, r * 0.1, 1.8, 0, Math.PI * 2); ctx.fill();

  if (h.crumbling) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.3, -r * 0.5); ctx.lineTo(r * 0.7, r * 0.3); ctx.stroke();
  }

  ctx.restore();

  if (held) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(h.x, h.y, r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }

  if (ht.slip) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.2 * Math.sin(Date.now() * 0.005 + h.x)})`;
    ctx.beginPath(); ctx.arc(h.x + r * 0.2, h.y - r * 0.1, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawRock(ctx, rk) {
  ctx.save(); ctx.translate(rk.x, rk.y); ctx.rotate(rk.rot);
  ctx.fillStyle = '#6a5a4a';
  ctx.beginPath();
  ctx.moveTo(-rk.r, 0); ctx.lineTo(-rk.r * 0.5, -rk.r); ctx.lineTo(rk.r * 0.6, -rk.r * 0.8); ctx.lineTo(rk.r, 0); ctx.lineTo(rk.r * 0.4, rk.r * 0.7); ctx.lineTo(-rk.r * 0.6, rk.r * 0.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(-rk.r * 0.3, -rk.r * 0.3, rk.r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(rk.r * 0.3, rk.r * 0.3, rk.r * 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawLava(ctx, s) {
  const ly = s.lavaY;
  const t = s.player.frame;
  const surfacePts = [];
  for (let x = -140; x <= MW + 280; x += 6) {
    const wave = Math.sin(x * 0.04 + t * 0.08) * 6 + Math.sin(x * 0.09 + t * 0.13) * 3 + Math.sin(x * 0.02 - t * 0.05) * 4;
    surfacePts.push({ x, y: ly + wave });
  }
  const g = ctx.createLinearGradient(0, ly - 10, 0, ly + 320);
  g.addColorStop(0, '#ffdd44'); g.addColorStop(0.2, '#ffaa22'); g.addColorStop(0.5, '#ff5511'); g.addColorStop(1, '#aa1100');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-140, ly + 6000);
  for (const p of surfacePts) ctx.lineTo(p.x, p.y);
  ctx.lineTo(MW + 280, ly + 6000);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = `rgba(255,220,110,${0.7 + 0.2 * Math.sin(t * 0.1)})`; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(surfacePts[0].x, surfacePts[0].y); for (const p of surfacePts) ctx.lineTo(p.x, p.y); ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,200,${0.5 + 0.2 * Math.sin(t * 0.15)})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(surfacePts[0].x, surfacePts[0].y); for (const p of surfacePts) ctx.lineTo(p.x, p.y); ctx.stroke();
  ctx.fillStyle = `rgba(255,245,170,${0.6 + 0.2 * Math.sin(t * 0.08)})`;
  for (const p of surfacePts) { if (p.y < ly - 2) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill(); } }
  for (let i = 0; i < 18; i++) {
    const bx = -120 + ((i * 79 + t * 0.6) % (MW + 240));
    const by = ly + 10 + Math.sin(t * 0.06 + i) * 5 + (i % 5) * 14;
    const br = 1.5 + (i % 3) * 0.9;
    ctx.fillStyle = 'rgba(255,220,120,0.75)'; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,210,0.6)'; ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.4, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 12; i++) {
    const ex = -100 + ((i * 67 + t * 0.4) % (MW + 200));
    const rise = (t * 0.9 + i * 27) % 90;
    const ey = ly - rise;
    ctx.fillStyle = `rgba(255,170,50,${0.7 * (1 - rise / 90)})`; ctx.beginPath(); ctx.arc(ex, ey, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
  }
  const hg = ctx.createLinearGradient(0, ly - 50, 0, ly);
  hg.addColorStop(0, 'rgba(255,100,30,0)'); hg.addColorStop(1, `rgba(255,120,40,${0.18 + 0.06 * Math.sin(t * 0.07)})`);
  ctx.fillStyle = hg; ctx.fillRect(-140, ly - 50, MW + 280, 50);
}

function drawPlayer(ctx, s, charId, customCharsData, skins, accs) {
  const p = s.player;
  const char = resolveChar(charId, customCharsData);
  let state = 'idle';
  if (p.state === 'climbing') state = 'jumping';
  else if (p.state === 'air') state = 'jumping';
  else if (p.state === 'ledge' && (p.vx > 0.3 || p.vx < -0.3)) state = 'moving';
  // grab animation — quick pull-up bob right after latching
  let yOff = 0;
  if (p.grabAnim > 0) { const t = 1 - p.grabAnim / 12; yOff = Math.sin(t * Math.PI) * 3; }
  // drop animation — brief downward stretch right after letting go
  let yStretch = 0;
  if (p.dropAnim > 0) { const t = 1 - p.dropAnim / 10; yStretch = Math.sin(t * Math.PI) * 4; }
  drawSportChar(ctx, p.x, p.y + yOff + yStretch, char, {
    facing: p.facing, frame: p.frame, scale: 0.92, jersey: false, sport: 'climb', state,
    equippedSkins: skins, equippedAccessories: accs,
  });
  // grab ring pulse at the hold
  if (p.grabAnim > 0 && p.hold) {
    const t = 1 - p.grabAnim / 12;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.6;
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.hold.x, p.hold.y, 8 + t * 18, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

// Oscillating aim arrow above the climber's head — shows the launch direction.
function drawAimArrow(ctx, p) {
  if (p.state !== 'climbing' && p.state !== 'ledge') return;
  const a = p.aim || 0;
  const cx = p.x;
  const cy = p.y - PH - 16;
  const dx = Math.sin(a), dy = -Math.cos(a);
  ctx.save();
  // faint sweep arc showing the full range
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 52, -AIM_SWEEP - Math.PI / 2, AIM_SWEEP - Math.PI / 2); ctx.stroke();
  // tick marks at sweep extremes
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  for (const ext of [-AIM_SWEEP, AIM_SWEEP]) {
    const tx = cx + Math.sin(ext) * 52, ty = cy - Math.cos(ext) * 52;
    ctx.beginPath(); ctx.moveTo(cx + Math.sin(ext) * 44, cy - Math.cos(ext) * 44); ctx.lineTo(tx, ty); ctx.stroke();
  }
  // the arrow itself at the current aim angle (longer + thicker)
  const L = 66;
  const ax = cx + dx * L, ay = cy + dy * L;
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
  // arrowhead
  ctx.fillStyle = '#FFD700';
  const perpX = -dy, perpY = dx;
  ctx.beginPath();
  ctx.moveTo(ax + dx * 11, ay + dy * 11);
  ctx.lineTo(ax - dx * 3 + perpX * 9, ay - dy * 3 + perpY * 9);
  ctx.lineTo(ax - dx * 3 - perpX * 9, ay - dy * 3 - perpY * 9);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // pivot dot
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHUD(ctx, s, env, progress, camY) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, 40);
  ctx.textAlign = 'left'; ctx.font = 'bold 18px Orbitron';
  ctx.fillStyle = '#88ff88'; ctx.fillText(fmtTime(s.time), 16, 28);
  ctx.font = 'bold 12px Orbitron'; ctx.fillStyle = '#FFD700';
  ctx.fillText(`BEST ${s.bestMs ? fmtTime(s.bestMs) : '—'}`, 150, 28);
  ctx.fillStyle = '#66ccff'; ctx.fillText(`CP ${s.cpUsed}`, 270, 28);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 11px Orbitron';
  ctx.fillText(`${env.name.toUpperCase()}`, W - 16, 20);
  if (s.track?.endless) {
    const lavaGap = Math.max(0, Math.floor((s.player.y - s.lavaY) / 10));
    ctx.fillStyle = '#ff6633'; ctx.font = 'bold 13px Orbitron';
    ctx.fillText(`🌋 LAVA ${lavaGap}m BELOW`, W - 16, 44);
  } else {
    const barW = 160, barX = W - barW - 16, barY = 26;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX, barY, barW, 8);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, '#44ff88'); barGrad.addColorStop(1, '#FFD700');
    ctx.fillStyle = barGrad; ctx.fillRect(barX, barY, barW * progress, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(progress * 100)}%`, W - 16, 46);
  }
  // grip meter
  const p = s.player;
  if (p.state === 'climbing') {
    const gW = 130, gX = W / 2 - gW / 2, gY = H - 22;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(gX - 2, gY - 2, gW + 4, 12);
    const pct = Math.max(0, p.grip / s.stats.gripMax);
    ctx.fillStyle = pct > 0.5 ? '#44ff88' : pct > 0.25 ? '#ffcc44' : '#ff4444';
    ctx.fillRect(gX, gY, gW * pct, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('GRIP', W / 2, gY - 6);
  }
}

// color helpers
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lighten(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}
function darken(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
}