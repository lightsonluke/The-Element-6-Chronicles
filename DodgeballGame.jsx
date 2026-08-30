import React, { useRef, useEffect, useState } from 'react';
import { MatchPauseButtonPortal } from './PauseLayerPortal.jsx';
import { ALL_CHARS, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { applyElement } from './elements.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import GameIcon from "./GameIcon.jsx";

// ── Dodgeball court (2D side-view, eye-level) ──
const W = 1100, H = 600;
const FLOOR = 524, CEIL = 48, LEFT = 44, RIGHT = 1056, CENTER = 550;
const P1_MIN = LEFT + 36, P1_MAX = CENTER - 30;
const P2_MIN = CENTER + 30, P2_MAX = RIGHT - 36;
const BALL_R = 13;
const GRAV = 0.9;
const P_W = 32, P_H = 96;
const BALL_COUNT = 10;
const DIFF_MUL = { newcomer: 0.45, beginner: 0.55, easy: 0.65, amateur: 0.75, regular: 0.9, pro: 1.0, hard: 1.12, insane: 1.25, honored: 1.4 };

const charFor = (id, element, custom) => {
  const c = (custom && custom[id]) || ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
  if (element && element !== 'basic') return { ...c, stats: applyElement(c.stats || {}, element) };
  return c;
};

function deriveStats(char, ms) {
  const s = char.stats || {};
  const base = ms?.superCooldown ?? 60;
  return {
    move: 3.0 + (s.speed || 5) * 0.26,        // walk (while carrying)
    run: 5.4 + (s.speed || 5) * 0.42,         // run (empty-handed)
    jump: 12.4 + (s.utility || 5) * 0.5,      // jump velocity
    fastFall: 1.4 + (s.speed || 5) * 0.16,    // extra downward accel
    throwPower: (15.5 + (s.power || 5) * 1.85) * (ms?.ballSpeed || 1),
    superPower: (26.4 + (s.power || 5) * 1.95) * (ms?.ballSpeed || 1),
    superCd: Math.max(50, base - (s.control || 5) * 1.0), // seconds; Control lowers to 50 min
    stun: Math.max(10, 28 - (s.defense || 5) * 1.5),      // frames of hit stun
  };
}

function spawnBall(sidePrefer) {
  const x = sidePrefer === 1 ? LEFT + 70 + Math.random() * (CENTER - LEFT - 140)
    : CENTER + 70 + Math.random() * (RIGHT - CENTER - 140);
  return { x, y: FLOOR - BALL_R, vx: (Math.random() - 0.5) * 2, vy: 0, heldBy: null, lastThrower: 0, hitCd: 0, spin: Math.random() * 6.28, trail: [], _dodged: false };
}

function mkPlayer(char, side, ms) {
  const x = side === 1 ? P1_MIN + 140 : P2_MAX - 140;
  return {
    char, side, x, y: FLOOR, vx: 0, vy: 0, onGround: true, facing: side === 1 ? 1 : -1,
    holding: null, ds: deriveStats(char, ms), superTimer: 0, stun: 0,
    frame: 0, aiThrow: 0, aiPickup: 0, dodgeFlash: 0,
  };
}

function newMatch(p1Char, p2Char, ms) {
  const balls = [];
  for (let i = 0; i < BALL_COUNT; i++) balls.push(spawnBall(i < 5 ? 1 : 2));
  return {
    frame: 0, over: false, winner: 0,
    p1: mkPlayer(p1Char, 1, ms), p2: mkPlayer(p2Char, 2, ms),
    balls, score: [0, 0], deuceActive: false, deuceAnnounce: 0,
    shake: 0, hitFlash: [0, 0], rallyT: 0,
    stats: [{ throws: 0, hits: 0, superThrows: 0, dodges: 0 }, { throws: 0, hits: 0, superThrows: 0, dodges: 0 }],
  };
}

export default function DodgeballGame({
  p1Chars, p2Chars, p1IsCPU = false, p2IsCPU = true, difficulty = 'regular',
  onResult, onQuit, p1Elements = [], p2Elements = [],
  equippedAccessories = {}, equippedSkins = {}, sfxVolume = 70, musicVolume = 50,
  settings = {}, matchSettings, customCharsData = {}, p1TeamColor = TEAM_COLOR_P1, p2TeamColor = TEAM_COLOR_P2,
  lanConnection = null, lanRole = null, localScheme = null,
  remoteState = null, onStateExport = null, isOnlineHost = false, onlineLocalOnly = false,
}) {
  const canvasRef = useRef(null);
  // Merge bot cosmetics — bots get random accessories every match
  const _botIds = [];
  if (p2IsCPU) p2Chars.forEach(id => _botIds.push(id));
  if (p1IsCPU) p1Chars.forEach(id => _botIds.push(id));
  const { equippedAccessories: mergedAccessories } = mergeBotCosmetics(equippedAccessories, {}, _botIds);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const keysRef = useRef({});
  const stRef = useRef(null);
  const paidRef = useRef(false);
  const prevRef = useRef({ 1: {}, 2: {} });
  const remoteKeysProc = useRef(false);
  const kb = getKeybinds(settings);
  const remoteStateRef = useRef(null);
  const onStateExportRef = useRef(null);
  useEffect(() => { remoteStateRef.current = remoteState; }, [remoteState]);
  useEffect(() => { onStateExportRef.current = onStateExport; }, [onStateExport]);

  if (!stRef.current) stRef.current = newMatch(charFor(p1Chars[0], p1Elements[0], customCharsData), charFor(p2Chars[0], p2Elements[0], customCharsData), matchSettings);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 750); return () => clearTimeout(t); }
    setStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    const track = matchSettings?.music === 'chill' ? 'menu' : matchSettings?.music === 'epic' ? 'tournament' : 'fight';
    try { music.play(track); } catch {}
    return () => music.stop();
  }, [musicVolume, sfxVolume, matchSettings?.music]);

  useEffect(() => {
    const resolveKey = (key) => {
      if (!lanConnection || remoteKeysProc.current) return key;
      const scheme = localScheme || (lanRole === 'host' ? 'p1' : 'p2');
      const toScheme = lanRole === 'host' ? 'p2' : 'p1';
      const fromBinds = scheme === 'p1' ? kb.p1 : kb.p2;
      const toBinds = toScheme === 'p1' ? kb.p1 : kb.p2;
      const lk = key.length === 1 ? key.toLowerCase() : key;
      for (const act of ['left', 'right', 'up', 'down', 'jump', 'sig', 'power', 'superMove', 'heavy']) {
        if (fromBinds[act]?.toLowerCase() === lk) return toBinds[act] || key;
      }
      return key;
    };
    const kd = (e) => {
      keysRef.current[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true;
      if (e.key === 'Escape') setPaused(p => !p);
      if (lanConnection && !remoteKeysProc.current) {
        const rk = resolveKey(e.key);
        lanConnection.sendMessage({ type: 'key', key: rk, down: true });
      }
    };
    const ku = (e) => {
      keysRef.current[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
      if (lanConnection && !remoteKeysProc.current) {
        const rk = resolveKey(e.key);
        lanConnection.sendMessage({ type: 'key', key: rk, down: false });
      }
    };
    if (lanConnection) {
      lanConnection.onMessage((msg) => {
        if (msg?.type === 'key') {
          remoteKeysProc.current = true;
          const k = msg.key.length === 1 ? msg.key.toLowerCase() : msg.key;
          if (msg.down) keysRef.current[k] = true; else keysRef.current[k] = false;
          setTimeout(() => { remoteKeysProc.current = false; }, 0);
        }
      });
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    // eslint-disable-next-line
  }, [lanConnection, lanRole, localScheme]);

  // ── read human input for a side ──
  const readHuman = (side) => {
    const binds = side === 1 ? kb.p1 : kb.p2;
    const k = readPlayerInput(keysRef.current, binds);
    // Each online browser reads only its own controller (slot 0). The remote
    // player's controls are supplied through the match transport instead.
    const localSide = lanRole === 'guest' ? 2 : 1;
    const gp = onlineLocalOnly && side !== localSide ? {} : (readGamepadInput(onlineLocalOnly ? 0 : side - 1) || {});
    let left = k.left || gp.left, right = k.right || gp.right,
      up = k.up || gp.up || gp.jump, down = k.down || gp.down,
      sig = k.sig || gp.sig, superMove = k.superMove || gp.superMove, power = k.power || gp.power;
    // single-player (one human vs CPU): let the lone human use EITHER control scheme
    const alt = (side === 1 && p2IsCPU) ? kb.p2 : (side === 2 && p1IsCPU) ? kb.p1 : null;
    if (alt) {
      const a = readPlayerInput(keysRef.current, alt);
      left = left || a.left; right = right || a.right; up = up || a.up; down = down || a.down;
      sig = sig || a.sig; superMove = superMove || a.superMove; power = power || a.power;
    }
    return { left, right, up, down, sig, superMove, power };
  };

  const withEdges = (raw, side) => {
    const prev = prevRef.current[side] || {};
    const e = (k) => !!raw[k] && !prev[k];
    const out = { ...raw, upEdge: e('up'), sigEdge: e('sig'), superEdge: e('superMove'), powerEdge: e('power') };
    prevRef.current[side] = { up: raw.up, sig: raw.sig, superMove: raw.superMove, power: raw.power };
    return out;
  };

  // ── CPU AI ──
  const cpuInput = (p, opp, s, side) => {
    const D = DIFF_MUL[difficulty] || 1;
    const r = { left: false, right: false, up: false, down: false, sig: false, superMove: false, power: false };
    // dodge an incoming airborne throw aimed at us
    const incoming = s.balls.find(b => b.heldBy === null && b.lastThrower !== side && b.lastThrower !== 0 &&
      Math.abs(b.vx) > 2 && ((side === 1 && b.vx < 0) || (side === 2 && b.vx > 0)) &&
      Math.abs(b.x - p.x) < 300 && b.hitCd < 8);
    if (incoming) {
      const predY = b => b.y + b.vy * 10;
      const py = predY(incoming);
      if (py < p.y - P_H * 0.55) { r.up = p.onGround && Math.random() < 0.5 + D * 0.4; r.right = side === 2; r.left = side === 1; }
      else if (py > p.y - P_H * 0.18) { r.down = !p.onGround && Math.random() < 0.5 + D * 0.4; r.up = p.onGround && Math.random() < 0.3; }
      else { r[side === 1 ? 'left' : 'right'] = Math.random() < 0.6; }
      return r;
    }
    if (p.stun > 0) return r;
    if (!p.holding) {
      const free = s.balls.filter(b => b.heldBy === null);
      const own = free.filter(b => (side === 1 ? b.x < CENTER : b.x > CENTER));
      const tgt = (own.length ? own : free).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      if (tgt) {
        if (tgt.x < p.x - 6) r.left = true; else if (tgt.x > p.x + 6) r.right = true;
        const close = Math.hypot(tgt.x - p.x, tgt.y - (p.y - P_H * 0.5)) < 52;
        if (close && Math.random() < 0.25 + D * 0.5) r.power = true;
      } else { r[side === 1 ? 'left' : 'right'] = Math.random() < 0.3; }
    } else {
      const edge = side === 1 ? P1_MAX - 24 : P2_MIN + 24;
      if (p.x < edge - 12) r.right = true; else if (p.x > edge + 12) r.left = true;
      const aligned = Math.abs(p.x - edge) < 70;
      p.aiThrow = (p.aiThrow || 0) + 1;
      const willThrow = p.aiThrow > (40 + (1 - D) * 50) && Math.random() < 0.4 + D * 0.5;
      if (willThrow) {
        r.sig = true;
        const oppUp = opp.y < p.y - P_H * 0.4;
        const oppDown = opp.y > p.y - 20;
        if (oppUp) r.up = Math.random() < 0.6;
        else if (oppDown && Math.random() < 0.3) r.down = true;
        // inaccuracy: random misaim at low difficulty
        if (Math.random() < (1 - D) * 0.5) { r.up = Math.random() < 0.5; r.down = !r.up && Math.random() < 0.5; }
        p.aiThrow = 0;
      }
      if (p.superTimer <= 0 && Math.random() < 0.006 + D * 0.012) { r.superMove = true; r.up = opp.y < p.y - P_H * 0.4; r.down = opp.y > p.y - 20 && Math.random() < 0.3; }
    }
    if (Math.random() < 0.004 * (1 - D) && p.onGround) r.up = true;
    return r;
  };

  // ── main loop ──
  useEffect(() => {
    if (!started) return;
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (remoteStateRef.current) {
        stRef.current = remoteStateRef.current;
        draw();
        return;
      }
      const s = stRef.current;
      if (paused || s.over) { draw(); return; }
      const in1 = withEdges(p1IsCPU ? cpuInput(s.p1, s.p2, s, 1) : readHuman(1), 1);
      const in2 = withEdges(p2IsCPU ? cpuInput(s.p2, s.p1, s, 2) : readHuman(2), 2);
      step(s, in1, in2);
      if (onStateExportRef.current) onStateExportRef.current(s);
      if (s.over && !paidRef.current) {
        paidRef.current = true;
        const agg = {
          hits: s.stats[0].hits + s.stats[1].hits,
          throws: s.stats[0].throws + s.stats[1].throws,
          superThrows: s.stats[0].superThrows + s.stats[1].superThrows,
          dodges: s.stats[0].dodges + s.stats[1].dodges,
        };
        sfx.matchVictory();
        setTimeout(() => onResult({ p1Won: s.winner === 1, stats: agg, p1Stats: s.stats[0], p2Stats: s.stats[1] }), 900);
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [started, paused, p1IsCPU, p2IsCPU, difficulty]);

  // ── simulation step ──
  function step(s, in1, in2) {
    s.frame++;
    const ms = matchSettings;
    const wind = ms?.weather === 'wind' ? Math.sin(s.frame * 0.02) * 0.05 : 0;
    updatePlayer(s, s.p1, in1, 1, wind);
    updatePlayer(s, s.p2, in2, 2, wind);
    for (const b of s.balls) updateBall(b, s, wind);
    if (s.balls.length < BALL_COUNT) s.balls.push(spawnBall(s.balls.length < 5 ? 1 : 2)); // invariant: always 10
    checkWin(s, ms);
    if (s.shake > 0) s.shake--;
    if (s.hitFlash[0] > 0) s.hitFlash[0]--;
    if (s.hitFlash[1] > 0) s.hitFlash[1]--;
    if (s.deuceAnnounce > 0) s.deuceAnnounce--;
    s.rallyT++;
  }

  function updatePlayer(s, p, inp, side, wind) {
    const opp = side === 1 ? s.p2 : s.p1;
    p.facing = opp.x > p.x ? 1 : -1;
    if (p.dodgeFlash > 0) p.dodgeFlash--;
    if (p.stun > 0) { p.stun--; p.vy += GRAV; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; } p.frame++; return; }
    // horizontal
    let move = 0; if (inp.left) move -= 1; if (inp.right) move += 1;
    const spd = p.holding ? p.ds.move : p.ds.run;
    p.vx = move * spd;
    const lo = side === 1 ? P1_MIN : P2_MIN, hi = side === 1 ? P1_MAX : P2_MAX;
    p.x += p.vx; if (p.x < lo) p.x = lo; if (p.x > hi) p.x = hi;
    // jump
    if (inp.upEdge && p.onGround) { p.vy = -p.ds.jump; p.onGround = false; sfx.jump(); }
    // fast fall
    if (!p.onGround && inp.down) p.vy += p.ds.fastFall;
    p.vy += GRAV; p.y += p.vy;
    if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; }
    if (p.y < CEIL + P_H) { p.y = CEIL + P_H; if (p.vy < 0) p.vy = 0; }
    // pickup (Power button while touching a free ball — only one ball at a time)
    if (inp.powerEdge && !p.holding) {
      let best = null, bd = 52;
      for (const b of s.balls) {
        if (b.heldBy !== null) continue;
        const d = Math.hypot(b.x - p.x, b.y - (p.y - P_H * 0.5));
        if (d < bd) { bd = d; best = b; }
      }
      if (best) { best.heldBy = side; best.lastThrower = 0; best.vx = 0; best.vy = 0; p.holding = best; sfx.grab(); }
    }
    // throw: Signature = normal, SuperMove = super; vertical = up/down/neutral
    if (inp.sigEdge && p.holding) throwBall(s, p, inp, side, false);
    if (inp.superEdge && p.holding && p.superTimer <= 0) { throwBall(s, p, inp, side, true); p.superTimer = p.ds.superCd * 60; sfx.superActivate(); }
    if (p.superTimer > 0) p.superTimer--;
    // carry
    if (p.holding) { p.holding.x = p.x + p.facing * (P_W * 0.7); p.holding.y = p.y - P_H * 0.55; p.holding.spin += 0.15; }
    p.frame++;
  }

  function throwBall(s, p, inp, side, isSuper) {
    const b = p.holding; if (!b) return;
    p.holding = null; b.heldBy = null; b.lastThrower = side; b.hitCd = 10;
    s.stats[side - 1].throws++; if (isSuper) s.stats[side - 1].superThrows++;
    const dir = inp.up ? 1 : inp.down ? -1 : 0; // 1 high, 0 straight, -1 low
    const speed = isSuper ? p.ds.superPower : p.ds.throwPower;
    const toward = side === 1 ? 1 : -1;
    b.vx = toward * speed;
    b.vy = dir === 1 ? -(isSuper ? 11.5 : 9.2) : dir === -1 ? (isSuper ? 7.0 : 5.4) : 0;
    b.trail = []; b._dodged = false;
    sfx.power();
  }

  function updateBall(b, s, wind) {
    if (b.heldBy !== null) return;
    if (b.hitCd > 0) b.hitCd--;
    b.vy += GRAV * 0.72;
    b.vx += wind;
    const w = matchSettings?.weather;
    if (w === 'rain' || w === 'snow') b.vx *= 0.996;
    b.x += b.vx; b.y += b.vy; b.spin += b.vx * 0.06;
    // boundary bounces
    if (b.y >= FLOOR - BALL_R) { b.y = FLOOR - BALL_R; b.vy *= -0.52; b.vx *= 0.86; if (Math.abs(b.vy) < 1.1) b.vy = 0; b.lastThrower = 0; }
    if (b.y <= CEIL + BALL_R) { b.y = CEIL + BALL_R; b.vy *= -0.6; }
    if (b.x <= LEFT + BALL_R) { b.x = LEFT + BALL_R; b.vx *= -0.7; }
    if (b.x >= RIGHT - BALL_R) { b.x = RIGHT - BALL_R; b.vx *= -0.7; }
    if (b.y >= FLOOR - BALL_R - 1) { b.vx *= 0.985; if (Math.abs(b.vx) < 0.05) b.vx = 0; }
    // trail
    if (Math.abs(b.vx) > 4 || Math.abs(b.vy) > 4) { b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 8) b.trail.shift(); }
    else b.trail = [];
    // hit detection — only a fast, thrown ball scores
    if (b.hitCd === 0 && b.lastThrower !== 0 && Math.abs(b.vx) > 1.8) {
      const vs = b.lastThrower === 1 ? 2 : 1;
      const vic = b.lastThrower === 1 ? s.p2 : s.p1;
      if (vic.stun <= 0 &&
        b.x > vic.x - P_W / 2 - BALL_R && b.x < vic.x + P_W / 2 + BALL_R &&
        b.y > vic.y - P_H - BALL_R && b.y < vic.y + BALL_R) {
        scorePoint(s, b.lastThrower);
        vic.stun = vic.ds.stun; s.hitFlash[vs - 1] = 18; s.shake = 14; sfx.hit();
        b.lastThrower = 0; b.vx *= 0.2; b.vy = Math.abs(b.vy) * 0.3 + 1; b.hitCd = 40;
      } else if (!b._dodged) {
        const inX = b.x > vic.x - P_W / 2 - BALL_R - 6 && b.x < vic.x + P_W / 2 + BALL_R + 6;
        const inY = b.y > vic.y - P_H - BALL_R && b.y < vic.y + BALL_R;
        if (inX && !inY) { b._dodged = true; s.stats[vs - 1].dodges++; }
      }
    }
  }

  function scorePoint(s, side) {
    s.score[side - 1]++;
    s.stats[side - 1].hits++;
    const limit = matchSettings?.scoreLimit || 10;
    if (s.score[0] === limit - 1 && s.score[1] === limit - 1 && !s.deuceActive) {
      s.deuceActive = true; s.deuceAnnounce = 150; sfx.notification();
    }
    s.rallyT = 0;
  }

  function checkWin(s, ms) {
    const limit = ms?.scoreLimit || 10;
    const a = s.score[0], b = s.score[1];
    if (s.deuceActive) {
      if ((a >= limit || b >= limit) && Math.abs(a - b) >= 2) { s.over = true; s.winner = a > b ? 1 : 2; }
    } else {
      if (a >= limit) { s.over = true; s.winner = 1; }
      else if (b >= limit) { s.over = true; s.winner = 2; }
    }
  }

  // ── rendering ──
  function draw() {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); const s = stRef.current; const ms = matchSettings;
    ctx.save();
    if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    // arena background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1430'); g.addColorStop(0.5, '#241a3a'); g.addColorStop(1, '#15102a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawBleachers(ctx);
    // walls
    ctx.fillStyle = p1TeamColor + '55'; ctx.fillRect(LEFT - 8, CEIL, 8, FLOOR - CEIL);
    ctx.fillStyle = p2TeamColor + '55'; ctx.fillRect(RIGHT, CEIL, 8, FLOOR - CEIL);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(LEFT, CEIL, RIGHT - LEFT, FLOOR - CEIL);
    // floor
    const fg = ctx.createLinearGradient(0, FLOOR, 0, H); fg.addColorStop(0, '#6a5a3a'); fg.addColorStop(1, '#3a3018');
    ctx.fillStyle = fg; ctx.fillRect(LEFT, FLOOR, RIGHT - LEFT, H - FLOOR);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(LEFT, FLOOR, RIGHT - LEFT, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let x = LEFT; x < RIGHT; x += 40) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x + 20, H); ctx.stroke(); }
    // center line (dashed) + circle
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(CENTER, CEIL); ctx.lineTo(CENTER, FLOOR); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CENTER, FLOOR - 60, 44, 0, Math.PI * 2); ctx.stroke();
    // weather
    drawWeather(ctx, s, ms?.weather);
    // free balls (under players)
    for (const b of s.balls) if (b.heldBy === null) drawBall(ctx, b);
    // players
    drawPlayerFig(ctx, s.p1, 1, s);
    drawPlayerFig(ctx, s.p2, 2, s);
    // held balls (in front, in hand)
    for (const b of s.balls) if (b.heldBy !== null) drawBall(ctx, b);
    ctx.restore();
    // HUD (no shake)
    drawHUD(ctx, s, ms);
    // deuce / countdown overlays
    if (s.deuceAnnounce > 0) {
      const a = Math.min(1, s.deuceAnnounce / 30);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.fillStyle = '#FF4444'; ctx.font = 'bold 64px Orbitron, sans-serif';
      ctx.shadowColor = '#FF4444'; ctx.shadowBlur = 24;
      ctx.fillText('DEUCE!', W / 2, H / 2 - 30); ctx.restore();
    }
    if (!started || countdown > 0) {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#FFD700'; ctx.font = 'bold 120px Orbitron, sans-serif';
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 30;
      ctx.fillText(countdown > 0 ? String(countdown) : 'GO!', W / 2, H / 2 + 40); ctx.restore();
    }
    if (paused) {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 36px Orbitron, sans-serif';
      ctx.fillText('PAUSED', W / 2, H / 2 - 10);
      ctx.font = '16px Rajdhani, sans-serif'; ctx.fillStyle = '#ccc';
      ctx.fillText('Press ESC to resume · Quit to leave', W / 2, H / 2 + 24); ctx.restore();
    }
  }

  function drawBleachers(ctx) {
    const tiers = 9;
    const tierH = (FLOOR - CEIL) / tiers;
    const t = Date.now() * 0.002;
    const drawSide = (x0, span, color) => {
      for (let i = 0; i < tiers; i++) {
        const inset = i * 7;
        const ww = span - inset;
        const y = CEIL + i * tierH;
        ctx.fillStyle = i % 2 ? '#2a2336' : '#211c30';
        ctx.fillRect(x0, y, ww, tierH);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x0, y, ww, 2);
        const headY = y + tierH * 0.62;
        for (let hx = x0 + 14; hx < x0 + ww - 8; hx += 13) {
          const bob = Math.sin(t + hx * 0.3 + i) * 1.2;
          const shade = (i + Math.floor(hx)) % 3;
          ctx.fillStyle = shade === 0 ? color + 'cc' : shade === 1 ? '#caa05a' : '#8fa6c8';
          ctx.beginPath(); ctx.arc(hx, headY + bob, 3.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
    drawSide(0, CENTER - 6, p1TeamColor);
    drawSide(CENTER + 6, CENTER - 6, p2TeamColor);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, CEIL, W, 6);
  }

  function drawWeather(ctx, s, w) {
    if (!w || w === 'clear') return;
    const t = s.frame;
    if (w === 'rain') { ctx.strokeStyle = 'rgba(150,180,255,0.4)'; ctx.lineWidth = 1; for (let i = 0; i < 80; i++) { const x = (i * 23 + t * 4) % W; const y = (i * 47 + t * 12) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    else if (w === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 70; i++) { const x = (i * 31 + Math.sin(t * 0.05 + i) * 12) % W; const y = (i * 41 + t * 2) % H; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); } }
    else if (w === 'wind') { ctx.strokeStyle = 'rgba(180,220,255,0.25)'; ctx.lineWidth = 1.5; for (let i = 0; i < 30; i++) { const y = 60 + i * 18; const x = (i * 80 + t * 8) % (W + 120) - 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y); ctx.stroke(); } }
    else if (w === 'fog') { ctx.fillStyle = 'rgba(200,200,210,0.12)'; ctx.fillRect(0, 0, W, H); }
  }

  function drawBall(ctx, b) {
    // trail
    for (let i = 0; i < b.trail.length; i++) { const t = b.trail[i]; ctx.globalAlpha = (i / b.trail.length) * 0.3; ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(t.x, t.y, BALL_R * 0.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // shadow on floor (only for free balls)
    if (b.heldBy === null) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x, FLOOR - 2, BALL_R * 0.9, BALL_R * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    const grad = ctx.createRadialGradient(b.x - 4, b.y - 4, 1, b.x, b.y, BALL_R);
    grad.addColorStop(0, '#ff8888'); grad.addColorStop(0.6, '#e83838'); grad.addColorStop(1, '#a01818');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    // seam
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, BALL_R - 1, -1, 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-BALL_R + 1, 0); ctx.lineTo(BALL_R - 1, 0); ctx.stroke(); ctx.restore();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x - 4, b.y - 4, BALL_R * 0.3, 0, Math.PI * 2); ctx.fill();
  }

  function drawPlayerFig(ctx, p, side, s) {
    const char = p.char;
    let state = 'idle';
    if (!p.onGround) state = 'jumping';
    else if (Math.abs(p.vx) > 0.5) state = 'moving';
    let stretch = 0;
    if (p.stun > 0) { stretch = Math.sin(s.frame * 0.4) * 3; state = 'hurt'; }
    const sf = 1.05;
    drawSportChar(ctx, p.x, p.y + stretch, char, {
      facing: p.facing, frame: p.frame, scale: sf, jersey: true, sport: 'dodgeball', state,
      teamColor: side === 1 ? p1TeamColor : p2TeamColor, equippedSkins, mergedAccessories, noWeapon: true,
    });
    // stun stars
    if (p.stun > 0) {
      ctx.fillStyle = '#FFD700'; ctx.font = '12px Orbitron';
      for (let i = 0; i < 3; i++) { const a = s.frame * 0.2 + i * 2; ctx.fillText('★', p.x - 12 + Math.cos(a) * 14, p.y - P_H - 8 + Math.sin(a) * 6); }
    }
    // hit flash
    if (s.hitFlash[side - 1] > 0) {
      ctx.globalAlpha = s.hitFlash[side - 1] / 18 * 0.5; ctx.fillStyle = '#fff';
      ctx.fillRect(p.x - P_W / 2 - 2, p.y - P_H - 2, P_W + 4, P_H + 4); ctx.globalAlpha = 1;
    }
    // nametag + super cd bar
    ctx.textAlign = 'center'; ctx.font = 'bold 11px Orbitron';
    ctx.fillStyle = side === 1 ? p1TeamColor : p2TeamColor;
    ctx.fillText(char.name, p.x, p.y - P_H - 16);
    const barW = 44, bx = p.x - barW / 2, by = p.y - P_H - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 1, by - 1, barW + 2, 5);
    const ready = p.ds.superCd * 60;
    const pct = 1 - Math.min(1, p.superTimer / ready);
    ctx.fillStyle = pct >= 1 ? '#FFD700' : pct > 0.5 ? '#aaccff' : '#ff7744';
    ctx.fillRect(bx, by, barW * pct, 3);
  }

  function drawHUD(ctx, s, ms) {
    // scoreboard
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(W / 2 - 150, 8, 300, 46);
    ctx.textAlign = 'center'; ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.fillStyle = p1TeamColor; ctx.fillText(String(s.score[0]), W / 2 - 56, 44);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Orbitron'; ctx.fillText('—', W / 2, 40);
    ctx.fillStyle = p2TeamColor; ctx.font = 'bold 36px Orbitron'; ctx.fillText(String(s.score[1]), W / 2 + 56, 44);
    ctx.font = 'bold 9px Orbitron'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`FIRST TO ${ms?.scoreLimit || 10}`, W / 2, 18);
    if (s.deuceActive) {
      ctx.fillStyle = '#FF4444'; ctx.font = 'bold 12px Orbitron';
      ctx.fillText('WIN BY 2', W / 2, 60);
    }
    // super labels
    ctx.textAlign = 'left'; ctx.font = 'bold 10px Orbitron';
    ctx.fillStyle = s.p1.superTimer <= 0 ? '#FFD700' : '#888';
    ctx.fillText(`P1 SUPER ${s.p1.superTimer <= 0 ? 'READY' : Math.ceil(s.p1.superTimer / 60) + 's'}`, 14, H - 14);
    ctx.textAlign = 'right'; ctx.fillStyle = s.p2.superTimer <= 0 ? '#FFD700' : '#888';
    ctx.fillText(`${s.p2.superTimer <= 0 ? 'READY' : Math.ceil(s.p2.superTimer / 60) + 's'} SUPER P2`, W - 14, H - 14);
    // balls remaining
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 9px Orbitron';
    ctx.fillText(`🟡 ${s.balls.filter(b => b.heldBy === null).length} BALLS IN PLAY`, W / 2, H - 14);
  }

  return (
    <div className="el6-match-viewport flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between items-center w-full max-w-[1100px]">
        <div className="flex gap-2 items-center">
          <span className="font-heading text-xs px-2 py-1 rounded" style={{ background: p1TeamColor + '33', color: p1TeamColor }}>
            {p1IsCPU ? 'CPU' : 'P1'}: {stRef.current.p1.char.name}
          </span>
          <span className="font-heading text-xs px-2 py-1 rounded" style={{ background: p2TeamColor + '33', color: p2TeamColor }}>
            {p2IsCPU ? 'CPU' : 'P2'}: {stRef.current.p2.char.name}
          </span>
        </div>
        <div className="flex gap-2">
          <MatchPauseButtonPortal><button onClick={() => setPaused(p => !p)} className="el6-match-pause-button px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs">{paused ? '▶ RESUME' : '⏸ PAUSE'}</button></MatchPauseButtonPortal>
          <button onClick={onQuit} className="px-3 py-1 bg-destructive text-destructive-foreground rounded font-heading text-xs">QUIT</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: W + 'px', aspectRatio: `${W} / ${H}`, height: 'auto', background: '#15102a' }} />
      <p className="text-[10px] text-muted-foreground font-body text-center">
        P1: <GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} /> move · <GameIcon emoji="↑" size={14} /> jump · <GameIcon emoji="↓" size={14} /> fast-fall · <b>(.) power</b> pickup · <b>(,) sig</b> throw (<GameIcon emoji="↑" size={14} />/<GameIcon emoji="↓" size={14} />/neutral = high/low/straight) · <b>(/) super</b> · P2: WASD+v+c+x
      </p>
    </div>
  );
}
