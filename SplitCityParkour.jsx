import db from './localBackend';
import { submitWorldScore } from './worldLeaderboards.js';

import React, { useRef, useState, useEffect, useCallback } from 'react';

import { ALL_CHARS } from './sports.js';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { readGamepadInput } from './controllerProfiles.js';
import ParkourLeaderboard from './ParkourLeaderboard.jsx';
import { applyElement, getCharLevelData } from './elements.js';
import ElementSelect from './ElementSelect.jsx';
import GameIcon from "./GameIcon.jsx";

// ── Canvas / physics constants ──
const W = 1100, H = 620;
const GRAV = 0.55;
const PW = 11, PH = 46;            // player half-width, full height (feet<GameIcon emoji="→" size={14} />head)
const CLIMB_SPEED = 2.6;
const PLAYER_SCREEN_X = 330;
const FALL_DEATH_Y = 1000;
const DIST_SCALE = 8;              // world px <GameIcon emoji="→" size={14} /> meters

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resolveChar(id, customCharsData) {
  if (customCharsData && customCharsData[id]) return customCharsData[id];
  return ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
}

// Movement derived from: speed (run), utility (jump), power (wall jump), control (climb stamina).
function deriveStats(char, element) {
  const s = applyElement(char?.stats || {}, element);
  return {
    runSpeed: 3.7 + (s.speed || 5) * 0.15,
    jumpV: -(11 + (s.utility || 5) * 0.42),
    wjVX: 7.5 + (s.power || 5) * 0.28,
    wjVY: -(8.5 + (s.power || 5) * 0.32),
    climbStaminaMax: 55 + (s.control || 5) * 11,
    climbStaminaDrain: 1.0,
    climbStaminaRegen: 1.8,
  };
}

// ── Procedural section generators. Each returns { plats, endX } ──
function genRooftop(x, d) {
  const w = Math.max(150, rand(240, 380) - d * 90);
  const y = rand(430, 500);
  const decor = [];
  if (Math.random() < 0.55) {
    const kinds = ['vent', 'ac', 'tower'];
    decor.push({ kind: kinds[Math.floor(Math.random() * kinds.length)], dx: rand(30, w - 50) });
  }
  const gap = Math.min(205, rand(85, 135) + d * 85);
  return { plats: [{ type: 'roof', x, y, w, h: 24, decor }], endX: x + w + gap };
}

function genFloating(x, d) {
  const count = 3 + Math.floor(d * 4);
  let cx = x;
  const plats = [];
  let lastY = rand(360, 470);
  for (let i = 0; i < count; i++) {
    const pw = Math.max(50, rand(75, 120) - d * 35);
    const y = clamp(lastY + rand(-70, 70), 320, 500);
    let move = null;
    if (Math.random() < 0.2 + d * 0.5) {
      move = Math.random() < 0.5
        ? { axis: 'x', range: rand(30, 80), speed: rand(0.02, 0.05) }
        : { axis: 'y', range: rand(20, 60), speed: rand(0.02, 0.05) };
    }
    const breakable = d > 0.4 && Math.random() < 0.22;
    plats.push({ type: 'float', x: cx, y, w: pw, h: 14, move, breakable, baseX: cx, baseY: y, phase: Math.random() * 6.28, crumbling: false, crumbleT: 0, broken: false });
    cx += pw + Math.min(180, rand(75, 110) + d * 45);
    lastY = y;
  }
  return { plats, endX: cx + rand(70, 100) };
}

// A very tall building with a gap before it. The player must jump to reach it,
// then wall-climb the facade (all building walls are climbable) up to the
// rooftop at the top, where they land and continue running.
function genClimbTower(x, d) {
  const bw = Math.max(70, rand(80, 120) - d * 20);
  const height = 280 + d * 260;
  const baseY = H; // facade extends to the bottom of the screen
  const topY = clamp(180 + rand(-30, 30) - d * 40, 120, 320);
  const gap = Math.min(140, rand(70, 95) + d * 30); // jump gap before the building
  const bX = x + gap;
  const decor = [];
  if (Math.random() < 0.5) decor.push({ kind: 'tower', dx: rand(20, bw - 30) });
  const plats = [
    { type: 'roof', x: bX, y: topY, w: bw, h: 24, decor },          // rooftop at the top
    { type: 'float', x: bX + bw + 20, y: topY, w: 140, h: 14, move: null, baseX: bX + bw + 20, baseY: topY, phase: 0, crumbling: false, broken: false },
  ];
  return { plats, endX: bX + bw + 20 + 140 + rand(80, 120) };
}

// Wall-jump corridor: player falls into a shaft between two hanging walls and
// chains wall jumps to ascend. Walls leave a bottom gap so the player lands on
// a shaft floor, then jumps up into the wall range to wall-jump.
function genWallShaft(x, d) {
  const shaftW = rand(108, 134);
  const WALL_TOP = rand(250, 300);
  const WALL_BOT = WALL_TOP + rand(180, 250);
  const PIT_Y = WALL_BOT + 64;
  const LX = x + 60;
  const RX = LX + shaftW;
  const entryW = (LX + 30) - x;
  const exitW = shaftW + 60 + 140;
  const plats = [
    { type: 'roof', x, y: WALL_TOP - 60, w: entryW, h: 24, decor: [] },           // entry platform (above)
    { type: 'wall', x: LX, y: WALL_TOP, w: 20, h: WALL_BOT - WALL_TOP, climbable: false },
    { type: 'wall', x: RX, y: WALL_TOP, w: 20, h: WALL_BOT - WALL_TOP, climbable: false },
    { type: 'roof', x: LX - 10, y: PIT_Y, w: shaftW + 40, h: 24, decor: [{ kind: 'pit', dx: 0 }] }, // shaft floor
    { type: 'float', x: LX - 20, y: WALL_TOP - 14, w: exitW, h: 14, move: null, baseX: LX - 20, baseY: WALL_TOP - 14, phase: 0, crumbling: false, broken: false },
  ];
  return { plats, endX: (LX - 20 + exitW) + rand(80, 120) };
}

// Wall-jump corridor: two thin non-climbable buildings. Drop into the shaft
// from the entry ledge, wall-jump back and forth to ascend, exit at the top.
function genWallJumpCorridor(x, d) {
  const gap = clamp(rand(98, 116) - d * 5, 88, 116);
  const bw = 24;
  const WALL_TOP = clamp(rand(195, 250) - d * 15, 130, 250);
  const WALL_BOT = WALL_TOP + rand(210, 280);
  const PIT_Y = WALL_BOT + 56;
  const LX = x + 60;
  const RX = LX + gap;
  const entryW = (LX + bw) - x;
  const exitW = gap + bw * 2 + 56 + 130;
  const plats = [
    { type: 'roof', x, y: WALL_TOP - 58, w: entryW, h: 24, decor: [] },
    { type: 'wall', x: LX, y: WALL_TOP, w: bw, h: WALL_BOT - WALL_TOP, climbable: false },
    { type: 'wall', x: RX, y: WALL_TOP, w: bw, h: WALL_BOT - WALL_TOP, climbable: false },
    { type: 'roof', x: LX - 8, y: PIT_Y, w: gap + bw * 2 + 16, h: 24, decor: [{ kind: 'pit', dx: 0 }] },
    { type: 'float', x: LX - 24, y: WALL_TOP - 10, w: exitW, h: 14, move: null, baseX: LX - 24, baseY: WALL_TOP - 10, phase: 0, crumbling: false, broken: false },
  ];
  return { plats, endX: (LX - 24 + exitW) + rand(80, 120) };
}

function pickSection(d) {
  const r = Math.random();
  // Walls (tower/shaft/corridor) appear earlier so wall-climb and wall-jump are always possible.
  if (d < 0.12) { if (r < 0.66) return 'roof'; if (r < 0.88) return 'float'; if (r < 0.96) return 'tower'; return 'corridor'; }
  if (d < 0.35) { if (r < 0.34) return 'roof'; if (r < 0.62) return 'float'; if (r < 0.8) return 'tower'; if (r < 0.92) return 'shaft'; return 'corridor'; }
  if (d < 0.65) { if (r < 0.16) return 'roof'; if (r < 0.44) return 'float'; if (r < 0.68) return 'tower'; if (r < 0.86) return 'shaft'; return 'corridor'; }
  if (r < 0.1) return 'roof'; if (r < 0.36) return 'float'; if (r < 0.62) return 'tower'; if (r < 0.84) return 'shaft'; return 'corridor';
}

function genSection(type, x, d) {
  if (type === 'roof') return genRooftop(x, d);
  if (type === 'float') return genFloating(x, d);
  if (type === 'tower') return genClimbTower(x, d);
  if (type === 'corridor') return genWallJumpCorridor(x, d);
  return genWallShaft(x, d);
}

function ensureGenerated(state) {
  const d = clamp(Math.floor(state.player.x / DIST_SCALE) / 4000, 0, 1);
  while (state.genX < state.player.x + 1600) {
    const type = pickSection(d);
    const { plats, endX } = genSection(type, state.genX, d);
    for (const p of plats) state.platforms.push(p);
    state.genX = endX;
  }
  // cull behind
  const camX = state.player.x - PLAYER_SCREEN_X;
  state.platforms = state.platforms.filter(p => p.x + (p.w || 20) > camX - 300);
}

// ── Day/night from the real-world clock ──
function dayFactor() {
  // Always night in Split City Parkour.
  return 0;
}

export default function SplitCityParkour({ onExit, onAward, unlockedIds = ['yellow'], equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, sfxVolume = 70, musicVolume = 50, settings = {}, charLevels = {} }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('select'); // select | play | over | lb
  const [charId, setCharId] = useState(unlockedIds[0] || 'yellow');
  const [selElement, setSelElement] = useState('basic');
  const [result, setResult] = useState(null);
  const stRef = useRef(null);
  const keysRef = useRef({});
  const jumpEdgeRef = useRef(false);
  const gpPrevRef = useRef({});

  const charPool = (unlockedIds.length ? unlockedIds : ['yellow']).map(id => ({ id, char: resolveChar(id, customCharsData) }));

  const initRun = useCallback((id) => {
    const char = resolveChar(id, customCharsData);
    const ds = deriveStats(char, selElement);
    stRef.current = {
      player: { x: 80, y: 460, vx: ds.runSpeed, vy: 0, grounded: true, onWall: null, climbing: false, climbWall: null, wallJumpLock: 0, facing: 1, frame: 0, alive: true, onPlatform: null, climbStamina: ds.climbStaminaMax },
      platforms: [{ type: 'roof', x: 0, y: 460, w: 360, h: 24, decor: [{ kind: 'start', dx: 120 }] }],
      genX: 360,
      wallX: -480,
      stats: ds,
      distance: 0,
      best: parseInt(localStorage.getItem('element6_parkour_best') || '0', 10) || 0,
      rank: null,
      over: false,
      dust: [],
    };
    ensureGenerated(stRef.current);
  }, [customCharsData, selElement]);

  // ── Audio ──
  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    if (phase === 'play') music.play('parkour');
    return () => { if (phase === 'play') music.stop(); };
  }, [phase, musicVolume, sfxVolume]);

  // Suppress controller menu-nav during the run.
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
      if (k === 'escape') { onExit?.(); return; }
      if (['F5', 'F12'].includes(e.key)) return;
      if (isJump(k) && !keysRef.current[k]) jumpEdgeRef.current = true;
      keysRef.current[k] = true;
      e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [phase, onExit]);

  // ── Game loop ──
  useEffect(() => {
    if (phase !== 'play') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const loop = () => {
      const s = stRef.current; if (!s) { raf = requestAnimationFrame(loop); return; }
      // gamepad
      const gp = settings.controllerEnabled !== false ? readGamepadInput(0) : null;
      if (gp) {
        if (gp.sig && !gpPrevRef.current.sig) jumpEdgeRef.current = true;
      }
      gpPrevRef.current = gp ? { sig: gp.sig } : {};

      update(s, {
        jumpPressed: jumpEdgeRef.current,
        upHeld: keysRef.current['arrowup'] || keysRef.current['w'] || (gp && gp.up),
        downHeld: keysRef.current['arrowdown'] || keysRef.current['s'] || (gp && gp.down),
        rightHeld: keysRef.current['arrowright'] || keysRef.current['d'] || (gp && gp.right),
        leftHeld: keysRef.current['arrowleft'] || keysRef.current['a'] || (gp && gp.left),
      });
      jumpEdgeRef.current = false;
      draw(ctx, s, charId, customCharsData, equippedSkins, equippedAccessories);
      if (s.over) { setResult({ distance: s.distance, best: s.best, rank: null, isRecord: false, saved: false, cause: s.cause }); setPhase('over'); endRun(s); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, charId, customCharsData, equippedSkins, equippedAccessories, settings.controllerEnabled]);

  function update(s, input) {
    const p = s.player;
    if (s.over) return;
    s.player.frame++;
    const d = clamp(Math.floor(p.x / DIST_SCALE) / 4000, 0, 1);

    // ── Chase wall ──
    // Wall max speed stays a bit below the player's run speed and ramps up slowly.
    const wallSpeed = s.stats.runSpeed * (0.5 + d * 0.4);
    s.wallX += wallSpeed;
    if (s.wallX >= p.x - 8) { die(s, 'wall'); return; }

    // ── Moving platforms ──
    for (const pl of s.platforms) {
      if (pl.type !== 'float' || !pl.move || pl.broken) continue;
      pl.phase += pl.move.speed;
      const oldX = pl.x, oldY = pl.y;
      if (pl.move.axis === 'x') pl.x = pl.baseX + Math.sin(pl.phase) * pl.move.range;
      else pl.y = pl.baseY + Math.sin(pl.phase) * pl.move.range;
      pl._dx = pl.x - oldX; pl._dy = pl.y - oldY;
    }
    // breakable crumble
    for (const pl of s.platforms) {
      if (pl.crumbling && !pl.broken) { pl.crumbleT--; if (pl.crumbleT <= 0) { pl.broken = true; sfx.collapse(); } }
    }

    const wasGrounded = p.grounded;
    const stoodOn = p.onPlatform;

    // stamina: drains while climbing, regens otherwise
    if (p.climbing) {
      p.climbStamina = Math.max(0, p.climbStamina - s.stats.climbStaminaDrain);
      if (p.climbStamina <= 0) {
        // exhausted — fall off
        p.climbing = false; p.climbWall = null; p.grounded = false; p.vy = 2; sfx.hit();
      }
    } else {
      p.climbStamina = Math.min(s.stats.climbStaminaMax, p.climbStamina + s.stats.climbStaminaRegen);
    }

    if (p.climbing) {
      const w = p.climbWall;
      // auto-ascend — walking into a wall climbs it automatically; hold DOWN to descend
      if (input.downHeld) p.y += CLIMB_SPEED;
      else { p.y -= CLIMB_SPEED; if (Math.random() < 0.15) sfx.wallClimb(); }
      // building walls extend to the ground; wall-type segments are bounded
      if (w.type === 'wall') p.y = clamp(p.y, w.y + 6, w.y + w.h - 6);
      else p.y = clamp(p.y, w.y + 6, H - 6);
      if (input.jumpPressed) {
        const dir = (p.x < w.x + w.w / 2) ? -1 : 1; // away from wall
        p.vx = dir * s.stats.wjVX; p.vy = s.stats.wjVY; p.climbing = false; p.climbWall = null; p.wallJumpLock = 10; p.grounded = false;
        spawnDust(s, p.x, p.y, -dir); sfx.wallJump();
      } else if (p.y <= w.y + 6) {
        // reached the top — hop up onto the rooftop
        p.climbing = false; p.climbWall = null; p.vx = s.stats.runSpeed * 0.5; p.vy = -2; p.grounded = false; p.wallJumpLock = 6;
      } else if (input.downHeld && p.y >= H - 8) {
        p.climbing = false; p.climbWall = null; p.grounded = true; p.vx = 0;
      }
    } else {
      p.grounded = false;
      p.onPlatform = null;
      // follow moving platform we stood on
      if (wasGrounded && stoodOn && !stoodOn.broken) {
        if (p.x + PW > stoodOn.x && p.x - PW < stoodOn.x + stoodOn.w) {
          p.y = stoodOn.y; p.grounded = true; p.vy = 0; p.onPlatform = stoodOn;
          p.x += stoodOn._dx || 0;
        }
      }
      // gravity
      if (!p.grounded) p.vy = Math.min(p.vy + GRAV, 16);
      // horizontal — no auto-run; must hold D / → to run
      if (p.grounded) {
        if (input.rightHeld) p.vx = s.stats.runSpeed;
        else if (input.leftHeld) p.vx = -s.stats.runSpeed * 0.65;
        else p.vx *= 0.75;
        if (p.vx > 0.3) p.facing = 1; else if (p.vx < -0.3) p.facing = -1;
      } else if (p.onWall && p.wallJumpLock <= 0) { p.vx = 0; if (p.vy > 0) p.vy *= 0.4; }
      else {
        // air: accelerate toward input, but DRAG when no key held so you stop
        if (input.rightHeld) p.vx = Math.min(p.vx + 0.45, s.stats.runSpeed);
        else if (input.leftHeld) p.vx = Math.max(p.vx - 0.45, -s.stats.runSpeed * 0.65);
        else p.vx *= 0.82; // air drag — letting go stops you
      }

      const prevFeetY = p.y;
      p.x += p.vx;
      p.y += p.vy;

      // head bonk — hitting the underside of a platform pushes you back down
      if (p.vy < 0) {
        for (const pl of s.platforms) {
          if (pl.type !== 'roof' && pl.type !== 'float') continue;
          if (pl.broken) continue;
          const headY = p.y - PH;
          if (p.x + PW > pl.x && p.x - PW < pl.x + pl.w && headY <= pl.y + pl.h && headY >= pl.y - 6) {
            p.y = pl.y + pl.h + PH; p.vy = 3; sfx.hit(); break;
          }
        }
      }

      // wall contact — wall-type segments AND building sides (roof platforms)
      p.onWall = null;
      if (p.wallJumpLock <= 0 && !p.grounded) {
        // wall-type segments
        for (const w of s.platforms) {
          if (w.type !== 'wall') continue;
          if (p.x + PW > w.x && p.x - PW < w.x + w.w && p.y > w.y && p.y - PH < w.y + w.h) {
            const side = (p.x < w.x + w.w / 2) ? 'right' : 'left'; // wall on right / left
            p.onWall = side;
            p.x = side === 'right' ? w.x - PW : w.x + w.w + PW;
            if (p.vy > 0 && Math.random() < 0.3) spawnDust(s, p.x, p.y, side === 'right' ? -1 : 1);
            // climbable walls (ladders) auto-climb; non-climbable walls are for wall-jumping
            if (w.climbable && p.climbStamina > 0) {
              p.climbing = true; p.climbWall = w; p.vx = 0; p.vy = 0;
            }
            break;
          }
        }
        // building sides (roof platforms) — collide with the facade below rooftop level
        if (!p.climbing) {
          for (const b of s.platforms) {
            if (b.type !== 'roof') continue;
            // only count as a wall if player is below the rooftop surface (in the facade)
            if (p.y < b.y - 2) continue; // only skip wall if feet clearly above rooftop surface
            // left edge
            if (p.x + PW > b.x && p.x < b.x && p.y > b.y) {
              p.onWall = 'right'; p.x = b.x - PW;
              if (p.climbStamina > 0) { p.climbing = true; p.climbWall = b; p.vx = 0; p.vy = 0; }
              break;
            }
            // right edge
            if (p.x - PW < b.x + b.w && p.x > b.x + b.w && p.y > b.y) {
              p.onWall = 'left'; p.x = b.x + b.w + PW;
              if (p.climbStamina > 0) { p.climbing = true; p.climbWall = b; p.vx = 0; p.vy = 0; }
              break;
            }
          }
        }
      }
      if (p.wallJumpLock > 0) p.wallJumpLock--;

      // platform landing (one-way)
      if (p.vy > 0) {
        for (const pl of s.platforms) {
          if (pl.type !== 'roof' && pl.type !== 'float') continue;
          if (pl.broken) continue;
          if (p.x + PW > pl.x && p.x - PW < pl.x + pl.w && prevFeetY <= pl.y + 4 && p.y >= pl.y) {
            p.y = pl.y; p.vy = 0; p.grounded = true; p.onPlatform = pl; p.climbing = false;
            p.facing = 1;
            if (pl.breakable && !pl.crumbling) { pl.crumbling = true; pl.crumbleT = 38; sfx.collapse(); }
            else if (Math.abs(p.vy) === 0 && prevFeetY > pl.y + 2) sfx.land();
            break;
          }
        }
      }

      // jump / wall-jump
      if (input.jumpPressed && !p.climbing) {
        if (p.grounded) { p.vy = s.stats.jumpV; p.grounded = false; p.onPlatform = null; sfx.jump(); }
        else if (p.onWall) {
          const dir = p.onWall === 'left' ? 1 : -1; // launch away from wall
          p.vx = dir * s.stats.wjVX; p.vy = s.stats.wjVY; p.onWall = null; p.wallJumpLock = 10;
          spawnDust(s, p.x, p.y, -dir); sfx.wallJump();
        }
      }
    }

    if (p.x > s.bestX || s.bestX === undefined) s.bestX = p.x;
    s.distance = Math.floor(p.x / DIST_SCALE);
    ensureGenerated(s);
    // dust
    for (const d2 of s.dust) { d2.x += d2.vx; d2.y += d2.vy; d2.vy += 0.2; d2.life--; }
    s.dust = s.dust.filter(d2 => d2.life > 0);

    if (p.y > FALL_DEATH_Y) die(s, 'fall');
  }

  function spawnDust(s, x, y, dir) {
    for (let i = 0; i < 5; i++) s.dust.push({ x, y, vx: dir * rand(0.5, 2.5) + rand(-1, 1), vy: rand(-2.5, -0.5), life: rand(10, 20) });
  }

  function die(s, cause) {
    s.over = true; s.player.alive = false; s.cause = cause; sfx.gameOverRun();
    keysRef.current = {}; jumpEdgeRef.current = false; // instantly clear all inputs on lose
  }

  async function endRun(s) {
    const dist = s.distance;
    const isRecord = dist > s.best;
    if (isRecord) { localStorage.setItem('element6_parkour_best', String(dist)); s.best = dist; sfx.personalBest(); }
    let rank = null, saved = false;
    try {
      const me = await db.auth.me().catch(() => null);
      if (me) {
        const char = resolveChar(charId, customCharsData);
        const uname = me.full_name || me.email || 'Runner';
        // One entry per player — replace if beaten, delete duplicates
        const existing = await db.entities.ParkourScore.filter({ user_id: me.id });
        if (existing && existing.length) {
          const best = existing.reduce((a, b) => ((a.distance || 0) >= (b.distance || 0) ? a : b));
          if (dist > (best.distance || 0)) {
            await db.entities.ParkourScore.update(best.id, { distance: dist, user_name: uname, char_id: charId, char_name: char?.name || charId });
          }
          for (const e of existing) if (e.id !== best.id) await db.entities.ParkourScore.delete(e.id).catch(() => {});
        } else {
          await db.entities.ParkourScore.create({ user_id: me.id, user_name: uname, char_id: charId, char_name: char?.name || charId, distance: dist });
        }
        saved = true;
        const higher = await db.entities.ParkourScore.filter({ distance: { $gte: dist } });
        rank = (higher?.length || 1);
      }
    } catch { saved = false; }
    try {
      const remote = await submitWorldScore('parkour', dist, { char_id: charId, cause: s.cause || 'fall' });
      saved = true; rank = remote.rank || rank;
    } catch { /* Local score display remains available while offline. */ }
    setResult({ distance: dist, best: s.best, rank, isRecord, saved, cause: s.cause });
    onAward?.({ sport: 'parkour', p1Won: true, p1CharId: charId, stats: {}, tournamentWon: false });
  }

  const startRun = (id) => { setCharId(id); initRun(id); setResult(null); keysRef.current = {}; jumpEdgeRef.current = false; setPhase('play'); sfx.click(); };

  // ── Character select ──
  if (phase === 'select') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🏃" size={14} /> SPLIT CITY PARKOUR</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1 max-w-xl">Race across the rooftops of Split City in an endless parkour challenge. Master wall jumps, climb towering buildings, outrun the advancing wall, and compete for the highest distance on the global leaderboard.</p>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> SPORTS</button>
        </div>
        <div className="w-full flex gap-2 justify-center">
          <button onClick={() => { setPhase('lb'); sfx.click(); }} className="px-4 py-1.5 bg-primary/20 border border-primary text-primary rounded-lg font-heading text-xs hover:bg-primary hover:text-primary-foreground"><GameIcon emoji="🏆" size={14} /> LEADERBOARD</button>
        </div>
        <p className="text-[11px] font-heading text-muted-foreground tracking-wider mt-2">CHOOSE YOUR RUNNER</p>
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
          <ElementSelect charId={charId} currentElement={selElement} onSelect={(el) => { setSelElement(el); sfx.click(); }} charLevels={charLevels} label="ELEMENT (affects run stats)" />
        )}
        <button onClick={() => startRun(charId)} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90 animate-pulse"><GameIcon emoji="▶" size={14} /> START RUN</button>
        <div className="text-[10px] text-muted-foreground font-body text-center max-w-xl mt-1">
          <p className="font-heading text-foreground/80 mb-1">CONTROLS</p>
          <p><span className="text-accent font-bold">D / <GameIcon emoji="→" size={14} /></span> Run forward · <span className="text-accent font-bold">A / <GameIcon emoji="←" size={14} /></span> Run back</p>
          <p><span className="text-accent font-bold">SPACE / <GameIcon emoji="↑" size={14} /> / W</span> Jump · Wall-Jump off any wall</p>
          <p>Walk into any building side to auto-climb it · <span className="text-accent font-bold"><GameIcon emoji="↓" size={14} />/S</span> climb down · <span className="text-accent font-bold">SPACE</span> wall-jump off</p>
          <p className="mt-1">Speed <GameIcon emoji="→" size={14} /> run · Utility <GameIcon emoji="→" size={14} /> jump · Power <GameIcon emoji="→" size={14} /> wall-jump · Control <GameIcon emoji="→" size={14} /> climb stamina. No double jump.</p>
        </div>
      </div>
    );
  }

  if (phase === 'lb') return <ParkourLeaderboard onBack={() => setPhase('select')} customCharsData={customCharsData} />;

  // ── Game over ──
  if (phase === 'over' && result) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <h2 className="text-3xl font-heading text-destructive tracking-wider">YOU FELL!</h2>
        <p className="text-sm text-muted-foreground font-body">{result.cause === 'wall' ? 'The advancing wall caught you!' : 'You slipped and fell from the rooftops!'}</p>
        <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-3 items-center">
          {result.isRecord && <p className="font-heading text-accent text-lg animate-pulse"><GameIcon emoji="⭐" size={14} /> NEW PERSONAL RECORD! <GameIcon emoji="⭐" size={14} /></p>}
          <div className="text-center">
            <p className="text-[11px] font-heading text-muted-foreground tracking-wider">DISTANCE</p>
            <p className="text-5xl font-heading text-primary">{result.distance}<span className="text-2xl">m</span></p>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-[10px] font-heading text-muted-foreground">PERSONAL BEST</p><p className="text-xl font-heading text-accent">{result.best}m</p></div>
            <div><p className="text-[10px] font-heading text-muted-foreground">GLOBAL RANK</p><p className="text-xl font-heading text-accent">{result.rank ? '#' + result.rank : '—'}</p></div>
          </div>
          {!result.saved && <p className="text-[9px] text-muted-foreground font-body">Sign in to save your score to the global leaderboard.</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => startRun(charId)} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="↻" size={14} /> RETRY</button>
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
        <span className="text-[10px] text-muted-foreground font-body">D/<GameIcon emoji="→" size={14} />: Run · SPACE: Jump/Wall-Jump · Walk into wall to climb · ESC: Quit</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="el6-match-canvas"
        style={{ width: '100%', maxWidth: W + 'px', height: 'auto', aspectRatio: `${W} / ${H}`, background: '#0a1228' }} />
    </div>
  );
}

// ── Rendering ──
function draw(ctx, s, charId, customCharsData, skins, accs) {
  const p = s.player;
  const camX = p.x - PLAYER_SCREEN_X;
  const day = dayFactor();
  drawBackground(ctx, camX, day, s);
  ctx.save();
  ctx.translate(-camX, 0);
  drawPlatforms(ctx, s, camX, day);
  drawDust(ctx, s);
  drawPlayer(ctx, s, charId, customCharsData, skins, accs);
  ctx.restore();
  drawWall(ctx, s, camX, day);
  drawHUD(ctx, s);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawBackground(ctx, camX, day, s) {
  // Sky gradient (day ↔ night)
  const top = [lerp(10, 120, day), lerp(16, 180, day), lerp(40, 235, day)];
  const bot = [lerp(20, 175, day), lerp(24, 200, day), lerp(50, 230, day)];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`);
  g.addColorStop(1, `rgb(${bot[0]},${bot[1]},${bot[2]})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Sun / moon
  const sunY = lerp(420, 80, day);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = day > 0.4 ? '#FFE89A' : '#DDE3F2';
  ctx.beginPath(); ctx.arc(W - 160, sunY, 34, 0, Math.PI * 2); ctx.fill();
  if (day < 0.4) { ctx.fillStyle = '#2a3458'; ctx.beginPath(); ctx.arc(W - 148, sunY - 8, 30, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;

  // Clouds (extremely slow parallax)
  ctx.fillStyle = `rgba(255,255,255,${0.18 + day * 0.2})`;
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 320 - camX * 0.015) % (W + 300)) - 120;
    const cy = 60 + (i % 3) * 40;
    cloud(ctx, cx, cy, 60 + (i % 2) * 30);
  }

  // Far skyline (extremely slow parallax — barely drifts)
  const farOff = -camX * 0.03;
  drawSkyline(ctx, farOff, day, 0.45, 320, 470, 70, 120);
  // Mid skyline (very slow parallax)
  drawSkyline(ctx, -camX * 0.06, day, 0.65, 260, 520, 90, 150);

  // Traffic below (tiny lights, very slow)
  ctx.fillStyle = day < 0.5 ? '#FFDD55' : '#FFAA33';
  for (let i = 0; i < 12; i++) {
    const tx = ((i * 130 - camX * 0.08 + s.player.frame * 0.3) % (W + 200)) - 100;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(tx, H - 14, 8, 3);
  }
  ctx.globalAlpha = 1;

  // Birds
  for (let i = 0; i < 4; i++) {
    const bx = ((i * 280 - camX * 0.1 + s.player.frame * 0.2) % (W + 200)) - 100;
    const by = 120 + (i % 2) * 50 + Math.sin(s.player.frame * 0.05 + i) * 8;
    ctx.strokeStyle = `rgba(40,40,60,${0.5})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + 4, by - 4, bx + 8, by); ctx.quadraticCurveTo(bx + 12, by - 4, bx + 16, by); ctx.stroke();
  }
}

function cloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.5, y + 4, r * 0.5, 0, Math.PI * 2);
  ctx.arc(x - r * 0.5, y + 6, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyline(ctx, off, day, alpha, minH, maxH, minW, maxW) {
  let x = -((off % 160) + 160);
  const baseY = H;
  while (x < W + 100) {
    const seed = Math.floor((x - off) / 1);
    const hgt = minH + (Math.abs(Math.sin(seed * 1.7)) * (maxH - minH));
    const wdt = minW + (Math.abs(Math.sin(seed * 2.3)) * (maxW - minW));
    const bColor = day > 0.5
      ? `rgba(${50 + (seed % 30)},${60 + (seed % 25)},${80 + (seed % 30)},${alpha})`
      : `rgba(${20 + (seed % 15)},${26 + (seed % 12)},${46 + (seed % 15)},${alpha})`;
    ctx.fillStyle = bColor;
    ctx.fillRect(x, baseY - hgt, wdt, hgt);
    // windows
    ctx.fillStyle = day < 0.55 ? `rgba(255,220,120,${alpha * 0.8})` : `rgba(120,150,190,${alpha * 0.4})`;
    for (let wy = baseY - hgt + 16; wy < baseY - 10; wy += 18) {
      for (let wx = x + 8; wx < x + wdt - 8; wx += 16) {
        if ((Math.sin(wx * 3.1 + wy * 1.7) > 0.1)) ctx.fillRect(wx, wy, 6, 9);
      }
    }
    // rooftop cap
    ctx.fillStyle = day > 0.5 ? `rgba(70,78,96,${alpha})` : `rgba(34,42,60,${alpha})`;
    ctx.fillRect(x - 2, baseY - hgt, wdt + 4, 4);
    // rooftop detail: water tower w/ legs / antenna w/ blinking light / billboard
    const dt = Math.abs(Math.sin(seed * 5.1));
    if (dt > 0.75) {
      const twx = x + wdt * 0.3;
      ctx.fillStyle = `rgba(60,50,40,${alpha})`;
      ctx.fillRect(twx - 1, baseY - hgt - 22, 16, 16);
      ctx.beginPath(); ctx.arc(twx + 7, baseY - hgt - 22, 9, Math.PI, 0); ctx.fill();
      ctx.fillStyle = `rgba(40,32,24,${alpha})`;
      ctx.fillRect(twx, baseY - hgt - 6, 2, 8); ctx.fillRect(twx + 12, baseY - hgt - 6, 2, 8);
    } else if (dt > 0.4) {
      const ax = x + wdt * 0.5;
      ctx.strokeStyle = `rgba(50,50,60,${alpha})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, baseY - hgt); ctx.lineTo(ax, baseY - hgt - 30); ctx.stroke();
      const blink = (0.5 + 0.5 * Math.sin(seed * 7 + Date.now() * 0.005));
      ctx.fillStyle = `rgba(255,60,60,${blink * alpha})`;
      ctx.beginPath(); ctx.arc(ax, baseY - hgt - 30, 3, 0, Math.PI * 2); ctx.fill();
    } else if (dt > 0.2) {
      const bx = x + wdt * 0.2;
      ctx.fillStyle = `rgba(30,30,40,${alpha})`; ctx.fillRect(bx, baseY - hgt - 16, wdt * 0.6, 12);
      ctx.fillStyle = `rgba(255,200,80,${alpha * 0.6})`; ctx.fillRect(bx + 2, baseY - hgt - 14, wdt * 0.6 - 4, 8);
      ctx.fillStyle = `rgba(20,20,30,${alpha})`; ctx.fillRect(bx + wdt * 0.3, baseY - hgt - 4, 2, 4);
    }
    x += wdt + 8;
  }
}

function drawPlatforms(ctx, s, camX, day) {
  for (const pl of s.platforms) {
    if (pl.type === 'roof') {
      const onScreen = pl.x + pl.w > camX - 50 && pl.x < camX + W + 50;
      if (!onScreen) continue;
      // building facade
      const bGrad = ctx.createLinearGradient(0, pl.y, 0, H);
      bGrad.addColorStop(0, day > 0.5 ? '#3a4258' : '#1a2238');
      bGrad.addColorStop(1, day > 0.5 ? '#252b3a' : '#0e1422');
      ctx.fillStyle = bGrad; ctx.fillRect(pl.x, pl.y, pl.w, H - pl.y);
      // facade columns
      ctx.fillStyle = `rgba(0,0,0,${day > 0.5 ? 0.08 : 0.18})`;
      for (let cx = pl.x + 24; cx < pl.x + pl.w - 16; cx += 36) ctx.fillRect(cx, pl.y + pl.h, 3, H - pl.y);
      // rooftop surface
      ctx.fillStyle = day > 0.5 ? '#5a6070' : '#2a3040'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(pl.x, pl.y, pl.w, 3);
      // rooftop tiles
      ctx.fillStyle = `rgba(0,0,0,${day > 0.5 ? 0.12 : 0.25})`;
      for (let tx = pl.x + 6; tx < pl.x + pl.w - 4; tx += 22) ctx.fillRect(tx, pl.y + 4, 1, pl.h - 6);
      // front railing
      ctx.fillStyle = `rgba(80,86,100,${day > 0.5 ? 0.9 : 0.7})`; ctx.fillRect(pl.x, pl.y - 6, pl.w, 3);
      for (let rx = pl.x + 4; rx < pl.x + pl.w - 4; rx += 16) ctx.fillRect(rx, pl.y - 6, 2, 6);
      // windows
      ctx.fillStyle = day < 0.55 ? 'rgba(255,215,120,0.55)' : 'rgba(120,150,190,0.25)';
      for (let wy = pl.y + 34; wy < H - 14; wy += 22)
        for (let wx = pl.x + 10; wx < pl.x + pl.w - 10; wx += 18)
          if (Math.sin(wx * 2.7 + wy * 1.3) > 0) ctx.fillRect(wx, wy, 7, 10);
      // decor
      (pl.decor || []).forEach(d => drawDecor(ctx, pl, d));
    } else if (pl.type === 'float') {
      if (pl.broken) continue;
      const crumble = pl.crumbling ? Math.min(1, (38 - pl.crumbleT) / 38) : 0;
      ctx.globalAlpha = 1 - crumble * 0.7;
      const col = pl.breakable ? '#C04040' : (pl.move ? '#66E0FF' : '#AABBCC');
      ctx.fillStyle = col; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(pl.x, pl.y, pl.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(pl.x, pl.y + pl.h - 3, pl.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      for (let bx = pl.x + 6; bx < pl.x + pl.w - 4; bx += 14) ctx.fillRect(bx, pl.y + 5, 2, 2);
      if (pl.crumbling) {
        ctx.strokeStyle = 'rgba(20,0,0,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pl.x + pl.w * 0.3, pl.y); ctx.lineTo(pl.x + pl.w * 0.5, pl.y + pl.h * 0.6); ctx.lineTo(pl.x + pl.w * 0.7, pl.y + pl.h);
        ctx.moveTo(pl.x + pl.w * 0.1, pl.y + pl.h); ctx.lineTo(pl.x + pl.w * 0.4, pl.y + pl.h * 0.4);
        ctx.stroke();
      }
      if (pl.move) { ctx.strokeStyle = col; ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.strokeRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4); ctx.setLineDash([]); ctx.globalAlpha = 1 - crumble * 0.7; }
      ctx.globalAlpha = 1;
    } else if (pl.type === 'wall') {
      const col = pl.climbable ? '#7a5a3a' : '#556070';
      ctx.fillStyle = col; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
      if (pl.climbable) {
        // ladder rungs
        ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 2;
        for (let ry = pl.y + 10; ry < pl.y + pl.h - 6; ry += 16) {
          ctx.beginPath(); ctx.moveTo(pl.x + 4, ry); ctx.lineTo(pl.x + pl.w - 4, ry); ctx.stroke();
        }
      }
    }
  }
}

function drawDecor(ctx, pl, d) {
  const x = pl.x + d.dx, y = pl.y;
  if (d.kind === 'vent') {
    ctx.fillStyle = '#444'; ctx.fillRect(x, y - 14, 18, 14); ctx.fillStyle = '#222'; ctx.fillRect(x + 3, y - 11, 12, 8);
  } else if (d.kind === 'ac') {
    ctx.fillStyle = '#666'; ctx.fillRect(x, y - 12, 22, 12); ctx.fillStyle = '#444'; ctx.fillRect(x + 2, y - 10, 18, 4);
  } else if (d.kind === 'tower') {
    ctx.fillStyle = '#3a3026'; ctx.fillRect(x, y - 30, 16, 30); ctx.fillStyle = '#2a2016'; ctx.beginPath(); ctx.arc(x + 8, y - 32, 10, 0, Math.PI * 2); ctx.fill();
  } else if (d.kind === 'start') {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('GO →', x, y - 8);
  }
}

function drawDust(ctx, s) {
  for (const d of s.dust) {
    ctx.globalAlpha = Math.max(0, d.life / 20) * 0.5;
    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx, s, charId, customCharsData, skins, accs) {
  const p = s.player;
  const char = resolveChar(charId, customCharsData);
  let state = 'idle';
  let facing = p.facing;
  if (p.climbing) {
    state = 'jumping';
    if (p.climbWall) facing = (p.x < p.climbWall.x + p.climbWall.w / 2) ? -1 : 1;
  } else if (!p.grounded) {
    state = 'jumping';
  } else if (Math.abs(p.vx) > 0.3) {
    state = 'moving'; // walking animation for both forward AND backward
  }
  drawSportChar(ctx, p.x, p.y, char, {
    facing, frame: p.frame, scale: 1.0, jersey: false, sport: 'parkour', state,
    equippedSkins: skins, equippedAccessories: accs,
  });
}

function drawWall(ctx, s, camX, day) {
  const screenX = s.wallX - camX;
  if (screenX > PLAYER_SCREEN_X + 4) return; // not yet visible
  // wall of doom encroaching from the left
  const g = ctx.createLinearGradient(screenX - 120, 0, screenX, 0);
  g.addColorStop(0, 'rgba(120,20,20,0)');
  g.addColorStop(0.7, 'rgba(140,30,30,0.5)');
  g.addColorStop(1, 'rgba(60,0,0,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, screenX + 4, H);
  ctx.fillStyle = '#3a0a0a'; ctx.fillRect(screenX - 6, 0, 8, H);
  ctx.fillStyle = '#ff4444'; ctx.fillRect(screenX, 0, 3, H);
  // jagged top edge
  ctx.fillStyle = '#5a1010';
  for (let y = 0; y < H; y += 24) ctx.fillRect(screenX - 14, y, 12, 12);
}

function drawHUD(ctx, s) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, 40);
  ctx.textAlign = 'left'; ctx.font = 'bold 20px Orbitron';
  ctx.fillStyle = '#66E0FF'; ctx.fillText(`${s.distance}m`, 16, 28);
  ctx.font = 'bold 12px Orbitron'; ctx.fillStyle = '#FFD700';
  ctx.fillText(`BEST ${s.best}m`, 130, 28);
  if (s.rank) { ctx.fillStyle = '#FFAA44'; ctx.fillText(`RANK #${s.rank}`, 250, 28); }
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 12px Orbitron';
  ctx.fillText('SPLIT CITY PARKOUR', W - 16, 28);
  // wall warning
  const screenX = s.wallX - (s.player.x - PLAYER_SCREEN_X);
  if (screenX > -200 && screenX < PLAYER_SCREEN_X) {
    ctx.textAlign = 'left'; ctx.fillStyle = '#ff4444'; ctx.font = 'bold 11px Orbitron';
    ctx.fillText('⚠ THE WALL IS CLOSE — KEEP MOVING!', 16, 54);
  }
  // climb stamina bar (always show when climbing or recently drained)
  const p = s.player;
  if (p.climbing) {
    const gW = 130, gX = W / 2 - gW / 2, gY = H - 22;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(gX - 2, gY - 2, gW + 4, 12);
    const pct = Math.max(0, p.climbStamina / s.stats.climbStaminaMax);
    ctx.fillStyle = pct > 0.5 ? '#44ff88' : pct > 0.25 ? '#ffcc44' : '#ff4444';
    ctx.fillRect(gX, gY, gW * pct, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('CLIMB STAMINA', W / 2, gY - 6);
  }
}
