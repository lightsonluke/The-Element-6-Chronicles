import React, { useRef, useEffect, useState } from 'react';
import { drawCourt } from './VolleyballGame.jsx';
import { drawSportChar } from './sportDraw.jsx';
import { ALL_CHARS, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { applyElement } from './elements.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getKeybinds } from './keybinds.js';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import GameIcon from "./GameIcon.jsx";

// ── Banger — Element 6 Original ──
// 3v3 elimination sport on the volleyball court (camera widened so all six stay
// visible). A ball drops at the net; whichever side it falls to starts. The
// closest teammate runs behind the ball and an arrow oscillates 60°-120°
// (90° = straight up). Press Signature to chip the ball in the arrow's
// direction. If your chip strikes an opponent before the floor, press Power to
// call BANGER! and eliminate them. Net rises each BANGER. Last team standing wins.
const COURT_W = 1100, COURT_H = 660;
const CW = 1320, CH = 660, OFFSET_X = (CW - COURT_W) / 2; // wider camera
const FLOOR = 540, NET_X = 550, COURT_LEFT = 40, COURT_RIGHT = 1060;
const GRAV = 0.34;
const SIDE_MID = { 1: (COURT_LEFT + NET_X) / 2, 2: (NET_X + COURT_RIGHT) / 2 };
const BASE_X = {
  1: [COURT_LEFT + 90, (COURT_LEFT + NET_X) / 2, NET_X - 110],
  2: [NET_X + 110, (NET_X + COURT_RIGHT) / 2, COURT_RIGHT - 90],
};
const DIFF_MUL = { newcomer: 0.5, beginner: 0.6, easy: 0.7, amateur: 0.8, regular: 0.9, pro: 1.0, hard: 1.12, insane: 1.25, honored: 1.4 };

const charFor = (id, element, custom) => {
  const c = (custom && custom[id]) || ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
  if (element && element !== 'basic') return { ...c, stats: applyElement(c.stats || {}, element) };
  return c;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function deriveStats(char) {
  const s = char?.stats || {};
  return {
    launchPower: 10.5 + (s.power || 5) * 0.75, // banger — stronger hits
    reachSpeed: 2.6 + (s.speed || 5) * 0.28,
    returnSpeed: 2.2 + (s.speed || 5) * 0.24,
    perfectWindow: 0.10 + (s.utility || 5) * 0.022,
    spread: Math.max(0.01, 0.14 - (s.control || 5) * 0.018),
    stunReduce: (s.defense || 5) * 0.05,
  };
}
function mkPlayer(side, slot) {
  return { side, slot, baseX: BASE_X[side][slot], x: BASE_X[side][slot], y: FLOOR, frame: 0, dead: false, hitT: 0 };
}

export default function BangerGame({
  p1Chars, p2Chars, p1IsCPU = false, p2IsCPU = true, difficulty = 'regular',
  matchSettings = {}, onResult, onQuit, p1Elements = [], p2Elements = [],
  equippedSkins = {}, equippedAccessories = {}, sfxVolume = 70, musicVolume = 50, settings = {},
  customCharsData = {}, lanConnection = null, lanRole = null, localScheme = null,
  remoteState = null, onStateExport = null, isOnlineHost = false,
}) {
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const stRef = useRef(null);
  const keysRef = useRef({});
  const gpPrev = useRef({});
  const paid = useRef(false);
  const remoteKeysProc = useRef(false);
  const kb = getKeybinds(settings);
  const remoteStateRef = useRef(null);
  const onStateExportRef = useRef(null);
  useEffect(() => { remoteStateRef.current = remoteState; }, [remoteState]);
  useEffect(() => { onStateExportRef.current = onStateExport; }, [onStateExport]);

  const startNet = matchSettings.startNet ?? 480;
  const maxNet = matchSettings.maxNet ?? 330;
  const ballSpeed = matchSettings.ballSpeed ?? 1.0;
  const musicTrack = matchSettings.music ?? 'arena';
  const weather = matchSettings.weather ?? 'clear';

  // Merge bot cosmetics for CPU characters — bots get random accessories every match
  const botAccsRef = useRef(null);
  if (!botAccsRef.current) {
    const botCharIds = [];
    if (p1IsCPU) p1Chars.forEach(id => botCharIds.push(id));
    if (p2IsCPU) p2Chars.forEach(id => botCharIds.push(id));
    botAccsRef.current = botCharIds.length > 0
      ? mergeBotCosmetics(equippedAccessories, {}, botCharIds).equippedAccessories
      : equippedAccessories;
  }
  const mergedAccessories = botAccsRef.current;

  if (!stRef.current) {
    stRef.current = {
      frame: 0, phase: 'drop', weatherT: 0,
      t1: p1Chars.map((_, i) => mkPlayer(1, i)),
      t2: p2Chars.map((_, i) => mkPlayer(2, i)),
      active1: 0, active2: 0, aimSide: 0,
      ball: { x: NET_X, y: 80, vx: 0, vy: 0, alive: false, stuckSide: 0, lastSide: 0, trail: [], spin: 0, bangerWindow: 0, bangerTarget: null, bangerBy: 0 },
      netTopY: startNet, netWobble: 0, shake: 0,
      bangerAnim: 0, bangerName: '', elimFlash: 0,
      aimPhase: 0, cpuBangerT: 0,
      winner: 0, done: false, hits: 0,
    };
  }

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 700); return () => clearTimeout(t); }
    setStarted(true);
    // first drop
    startDrop(stRef.current, 0);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    music.play(musicTrack === 'chill' ? 'menu' : musicTrack === 'epic' ? 'tournament' : 'fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume, musicTrack]);

  useEffect(() => { window.__el6GameplayActive = true; return () => { window.__el6GameplayActive = false; }; }, []);

  const sigKeys = (side) => {
    if (side === 1) { const ks = [kb.p1.sig.toLowerCase()]; if (p2IsCPU) ks.push(kb.p2.sig.toLowerCase()); return ks; }
    return [kb.p2.sig.toLowerCase()];
  };
  const powKeys = (side) => {
    if (side === 1) { const ks = [kb.p1.power.toLowerCase()]; if (p2IsCPU) ks.push(kb.p2.power.toLowerCase()); return ks; }
    return [kb.p2.power.toLowerCase()];
  };

  useEffect(() => {
    const resolveKey = (key) => {
      if (!lanConnection || remoteKeysProc.current) return key;
      const scheme = localScheme || (lanRole === 'host' ? 'p1' : 'p2');
      const toScheme = lanRole === 'host' ? 'p2' : 'p1';
      const fromBinds = scheme === 'p1' ? kb.p1 : kb.p2;
      const toBinds = toScheme === 'p1' ? kb.p1 : kb.p2;
      const lk = key.toLowerCase();
      for (const act of ['left', 'right', 'up', 'down', 'jump', 'sig', 'power', 'superMove', 'heavy']) {
        if (fromBinds[act]?.toLowerCase() === lk) return toBinds[act] || key;
      }
      return key;
    };
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === 'escape') { onQuit?.(); return; }
      if (e.key === 'F5' || e.key === 'F12') return;
      if (lanConnection && !remoteKeysProc.current) {
        const rk = resolveKey(e.key);
        lanConnection.sendMessage({ type: 'key', key: rk, down: true });
      }
      const s = stRef.current;
      if (s.phase === 'aim' && !p1IsCPU && s.aimSide === 1 && sigKeys(1).includes(k)) { strike(1); e.preventDefault(); }
      else if (s.phase === 'aim' && !p2IsCPU && s.aimSide === 2 && sigKeys(2).includes(k)) { strike(2); e.preventDefault(); }
      if (s.ball.bangerWindow > 0) {
        if (!p1IsCPU && s.ball.bangerBy === 1 && powKeys(1).includes(k)) { callBanger(); e.preventDefault(); }
        else if (!p2IsCPU && s.ball.bangerBy === 2 && powKeys(2).includes(k)) { callBanger(); e.preventDefault(); }
      }
    };
    const ku = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
      if (lanConnection && !remoteKeysProc.current) {
        const rk = resolveKey(e.key);
        lanConnection.sendMessage({ type: 'key', key: rk, down: false });
      }
    };
    if (lanConnection) {
      lanConnection.onMessage((msg) => {
        if (msg?.type === 'key') {
          remoteKeysProc.current = true;
          const k = msg.key.toLowerCase();
          if (msg.down) keysRef.current[k] = true; else keysRef.current[k] = false;
          const s = stRef.current;
          if (msg.down && s.phase === 'aim' && s.aimSide === (lanRole === 'host' ? 2 : 1)) {
            const side = lanRole === 'host' ? 2 : 1;
            if (sigKeys(side).includes(k)) strike(side);
          }
          if (msg.down && s.ball.bangerWindow > 0 && s.ball.bangerBy === (lanRole === 'host' ? 2 : 1)) {
            const side = lanRole === 'host' ? 2 : 1;
            if (powKeys(side).includes(k)) callBanger();
          }
          setTimeout(() => { remoteKeysProc.current = false; }, 0);
        }
      });
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    // eslint-disable-next-line
  }, [p1IsCPU, p2IsCPU, lanConnection, lanRole, localScheme]);

  useEffect(() => {
    if (!started) return;
    let raf;
    const poll = () => {
      raf = requestAnimationFrame(poll);
      if (settings.controllerEnabled === false) return;
      const s = stRef.current;
      for (const slot of [0, 1]) {
        const gp = readGamepadInput(slot);
        if (!gp) { gpPrev.current[slot] = {}; continue; }
        const prev = gpPrev.current[slot] || {};
        const side = (p2IsCPU && slot === 1) ? 1 : (slot === 0 ? 1 : 2);
        const cpu = side === 1 ? p1IsCPU : p2IsCPU;
        if (s.phase === 'aim' && s.aimSide === side && !cpu && gp.sig && !prev.sig) strike(side);
        if (s.ball.bangerWindow > 0 && s.ball.bangerBy === side && !cpu && gp.power && !prev.power) callBanger();
        gpPrev.current[slot] = { sig: gp.sig, power: gp.power };
      }
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [started, p1IsCPU, p2IsCPU, settings.controllerEnabled]);

  useEffect(() => {
    if (!started) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (remoteStateRef.current) {
        stRef.current = remoteStateRef.current;
        draw(ctx, stRef.current);
      } else {
        const s = stRef.current;
        s.frame++;
        if (!s.done) step(s);
        if (onStateExportRef.current) onStateExportRef.current(s);
        draw(ctx, s);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [started]);

  function teamArr(side) { return side === 1 ? stRef.current.t1 : stRef.current.t2; }
  function alivePlayers(side) { return teamArr(side).filter(p => !p.dead); }
  function closestAlive(side, x) {
    const al = alivePlayers(side); let best = al[0], bd = Infinity;
    for (const p of al) { const d = Math.abs(p.x - x); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  const dirOf = (side) => (side === 1 ? 1 : -1);
  const curAngle = (s) => Math.sin(s.aimPhase) * (Math.PI / 6); // -30°..+30° from vertical (+ = toward net)
  function charAt(side, slot) { return charFor((side === 1 ? p1Chars : p2Chars)[slot], (side === 1 ? p1Elements : p2Elements)[slot], customCharsData); }
  function dsFor(side, slot) { return deriveStats(charAt(side, slot)); }

  function step(s) {
    s.weatherT++;
    if (s.netWobble > 0) s.netWobble *= 0.9;
    if (s.shake > 0) s.shake *= 0.85;
    if (s.bangerAnim > 0) s.bangerAnim--;
    if (s.elimFlash > 0) s.elimFlash--;
    for (const p of [...s.t1, ...s.t2]) { p.frame++; if (p.hitT > 0) p.hitT--; }
    if (s.phase === 'aim') s.aimPhase += 0.05;
    if (s.cpuBangerT > 0) { s.cpuBangerT--; if (s.cpuBangerT === 0 && s.ball.bangerWindow > 0) callBanger(); }

    if (s.phase === 'drop') {
      const b = s.ball;
      if (!b.alive) { b.alive = true; b.x = NET_X + (s.dropNudge || 0); b.y = s.netTopY - 30; b.vx = (s.dropNudge || 0) * 0.03; b.vy = 1.6; b.trail = []; b.lastSide = 0; b.bangerWindow = 0; }
      b.vy += GRAV * 0.6; b.x += b.vx; b.y += b.vy;
      if (b.y >= FLOOR - 8) { b.y = FLOOR - 8; const side = b.x < NET_X ? 1 : 2; b.stuckSide = side; b.alive = true; s.phase = 'roll'; b.vx = side === 1 ? -3 - Math.random() * 2 : 3 + Math.random() * 2; b.vy = 0; b.spin = side === 1 ? -0.3 : 0.3; }
      return;
    }
    // ball hits the floor then rolls toward a side; whichever side it lands = that team's serve
    if (s.phase === 'roll') {
      const b = s.ball;
      b.vy += GRAV * 0.2; b.x += b.vx; b.y = FLOOR - 8; b.vx *= 0.995; b.spin += b.vx * 0.05;
      // reached the far wall of that half — the ball settles there, then moves to the middle of that half
      const mid = SIDE_MID[b.stuckSide];
      const edge = b.stuckSide === 1 ? COURT_LEFT : COURT_RIGHT;
      const atEdge = b.stuckSide === 1 ? b.x <= edge + 6 : b.x >= edge - 6;
      const stopped = Math.abs(b.vx) < 0.15;
      if (atEdge || stopped) {
        // snap to the middle of whichever half the ball landed on
        b.x = mid; b.y = FLOOR - 8; b.vx = 0; b.vy = 0; b.alive = true; b.spin = 0;
        s.phase = 'aim'; activateHitter(s, b.stuckSide);
      }
      return;
    }
    if (s.phase === 'aim') {
      const b = s.ball; const side = b.stuckSide; const dir = dirOf(side);
      const team = teamArr(side); const hitter = team[s['active' + side]];
      if (hitter && !hitter.dead) {
        const target = b.x - dir * 48;
        const sp = dsFor(side, hitter.slot).reachSpeed;
        if (hitter.x < target - 3) hitter.x = Math.min(target, hitter.x + sp);
        else if (hitter.x > target + 3) hitter.x = Math.max(target, hitter.x - sp);
        hitter.y = FLOOR;
        const cpu = side === 1 ? p1IsCPU : p2IsCPU;
        if (cpu) {
          const a = curAngle(s); const D = DIFF_MUL[difficulty] || 1;
          const ds = dsFor(side, hitter.slot);
          const q = (a + Math.PI / 6) / (Math.PI / 3);
          const isPerfect = q > (1 - ds.perfectWindow);
          if (difficulty === 'honored') { if (isPerfect) strike(side); }
          else if (a > Math.PI / 9 && Math.random() < 0.1 + D * 0.18) strike(side);
        }
      }
      returnToBase(s, side, true);
      returnToBase(s, side === 1 ? 2 : 1, false);
      return;
    }
    if (s.phase === 'flight') {
      const b = s.ball;
      b.vy += GRAV; b.x += b.vx; b.y += b.vy; b.spin += b.vx * 0.05;
      b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 10) b.trail.shift();
      // net collision (swept)
      const prevX = b.x - b.vx, prevY = b.y - b.vy;
      const crossed = (prevX < NET_X && b.x >= NET_X) || (prevX > NET_X && b.x <= NET_X);
      if (crossed) {
        const t = Math.abs(b.x - prevX) > 0.001 ? (NET_X - prevX) / (b.x - prevX) : 0;
        const yAt = prevY + (b.y - prevY) * t;
        if (yAt + 8 > s.netTopY) {
          const fromLeft = prevX < NET_X;
          b.x = NET_X + (fromLeft ? -14 : 14);
          b.vx = (fromLeft ? -1 : 1) * Math.abs(b.vx) * 0.4;
          b.vy = Math.abs(b.vy) * 0.3 + 1;
          s.netWobble = 10; sfx.hit();
        }
      }
      if (b.x <= COURT_LEFT) { b.x = COURT_LEFT; b.vx = Math.abs(b.vx) * 0.5; }
      if (b.x >= COURT_RIGHT) { b.x = COURT_RIGHT; b.vx = -Math.abs(b.vx) * 0.5; }
      // banger window countdown
      if (b.bangerWindow > 0) { b.bangerWindow--; if (b.bangerWindow === 0) b.bangerTarget = null; }
      else {
        // opponent collision (strike)
        const defSide = b.lastSide === 1 ? 2 : 1;
        for (const p of alivePlayers(defSide)) {
          if (Math.abs(b.x - p.x) < 22 && Math.abs(b.y - (p.y - 38)) < 48) {
            b.bangerWindow = 34; b.bangerTarget = { side: defSide, slot: p.slot }; b.bangerBy = b.lastSide;
            const def = dsFor(defSide, p.slot);
            p.hitT = Math.max(6, Math.round(16 - def.stunReduce * 12));
            b.vx *= 0.5; b.vy = Math.min(b.vy, -1.2);
            s.hits++; sfx.hit();
            const cpu = b.lastSide === 1 ? p1IsCPU : p2IsCPU;
            if (cpu) {
              const D = DIFF_MUL[difficulty] || 1;
              if (difficulty === 'honored') s.cpuBangerT = 1;
              else if (Math.random() < 0.35 + D * 0.5) s.cpuBangerT = Math.round(8 + Math.random() * 14);
            }
            break;
          }
        }
      }
      // floor (no bounce) — stops where it lands
      if (b.y >= FLOOR - 8) {
        b.y = FLOOR - 8; b.vy = 0; b.vx = 0; b.alive = false; b.bangerWindow = 0; b.bangerTarget = null;
        const landSide = b.x < NET_X ? 1 : 2;
        if (landSide === b.lastSide) {
          // fault — other team gets the next drop
          startDrop(s, landSide === 1 ? 2 : 1);
        } else {
          // possession change — opposing team gains possession; ball stops where it lands (no roll)
          b.stuckSide = landSide; b.alive = true; b.vx = 0; b.vy = 0;
          s.phase = 'aim'; activateHitter(s, landSide);
        }
      }
      returnToBase(s, 1, false); returnToBase(s, 2, false);
      return;
    }
  }

  function activateHitter(s, side) {
    const p = closestAlive(side, s.ball.x);
    if (!p) return;
    s['active' + side] = p.slot; s.aimSide = side; s.aimPhase = Math.random() * 6.28;
  }
  function returnToBase(s, side, skipActive) {
    const team = teamArr(side);
    for (const p of team) {
      if (p.dead) continue;
      if (skipActive && s.phase === 'aim' && s.aimSide === side && p.slot === s['active' + side]) continue;
      const sp = dsFor(side, p.slot).returnSpeed;
      if (p.x < p.baseX - 3) p.x = Math.min(p.baseX, p.x + sp);
      else if (p.x > p.baseX + 3) p.x = Math.max(p.baseX, p.x - sp);
      p.y = FLOOR;
    }
  }

  function strike(side) {
    const s = stRef.current;
    if (s.phase !== 'aim' || s.aimSide !== side) return;
    const team = teamArr(side); const hitter = team[s['active' + side]];
    if (!hitter || hitter.dead) return;
    const ds = dsFor(side, hitter.slot);
    const a = curAngle(s);
    const q = (a + Math.PI / 6) / (Math.PI / 3); // 0..1 (0 = back, 1 = max forward over net)
    const perfect = q > (1 - ds.perfectWindow);
    const power = ds.launchPower * (0.6 + 0.4 * q) * ballSpeed * (perfect ? 1.1 : 1);
    const spread = perfect ? 0 : ds.spread * (1 - q);
    const aa = a + (Math.random() - 0.5) * 2 * spread;
    const dir = dirOf(side);
    const b = s.ball;
    b.alive = true; b.lastSide = side; b.bangerWindow = 0; b.bangerTarget = null;
    b.x = hitter.x + dir * 14; b.y = hitter.y - 50;
    b.vx = dir * Math.sin(aa) * power * 1.45;
    b.vy = -Math.cos(aa) * power * 1.40;
    b.trail = []; b.spin = 0;
    s.phase = 'flight';
    sfx.power(); s.shake = 6;
  }

  function callBanger() {
    const s = stRef.current; const b = s.ball;
    if (b.bangerWindow <= 0 || !b.bangerTarget) return;
    const { side, slot } = b.bangerTarget;
    const team = teamArr(side); const victim = team[slot];
    if (!victim || victim.dead) { b.bangerWindow = 0; b.bangerTarget = null; return; }
    victim.dead = true; victim.hitT = 0;
    b.bangerWindow = 0; b.bangerTarget = null; b.alive = false; b.trail = [];
    s.netTopY = Math.max(maxNet, s.netTopY - 80);
    s.bangerAnim = 70; s.bangerName = charAt(side, slot).name;
    s.shake = 26; s.elimFlash = 40; s.cpuBangerT = 0;
    sfx.superActivate(); sfx.cheer();
    if (alivePlayers(1).length === 0) { s.winner = 2; s.done = true; finishMatch(); return; }
    if (alivePlayers(2).length === 0) { s.winner = 1; s.done = true; finishMatch(); return; }
    startDrop(s, side); // team that lost a member gets the next drop
  }

  function startDrop(s, toSide) {
    s.ball.alive = false; s.ball.bangerWindow = 0; s.ball.bangerTarget = null; s.ball.trail = [];
    s.phase = 'drop'; s.dropNudge = toSide === 1 ? -0.5 : (toSide === 2 ? 0.5 : (Math.random() < 0.5 ? -0.5 : 0.5));
  }

  function finishMatch() {
    if (paid.current) return; paid.current = true;
    const s = stRef.current;
    setTimeout(() => onResult?.({
      p1Won: s.winner === 1, winner: s.winner,
      elims: { 1: 3 - alivePlayers(1).length, 2: 3 - alivePlayers(2).length },
      hits: s.hits,
    }), 1500);
  }

  // ── draw ──
  function draw(ctx, s) {
    ctx.save();
    ctx.fillStyle = '#080d1a'; ctx.fillRect(0, 0, CW, CH);
    ctx.translate(OFFSET_X, 0);
    if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    drawCourt(ctx);
    drawNetBanger(ctx, s.netTopY, s.netWobble);
    drawWeather(ctx, s);
    drawTeam(ctx, s, 1, p1Chars, p1Elements, TEAM_COLOR_P1);
    drawTeam(ctx, s, 2, p2Chars, p2Elements, TEAM_COLOR_P2);
    drawBall(ctx, s);
    if (s.phase === 'aim') drawAimArrow(ctx, s);
    ctx.restore();
    drawHUD(ctx, s);
    if (s.bangerAnim > 0) {
      const a = s.bangerAnim / 70;
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 2); ctx.textAlign = 'center';
      ctx.fillStyle = '#FF3355'; ctx.font = `bold ${80 + (1 - a) * 40}px Orbitron, sans-serif`;
      ctx.shadowColor = '#FF3355'; ctx.shadowBlur = 30;
      ctx.fillText('BANGER!', CW / 2, CH / 2);
      if (s.bangerName) { ctx.font = 'bold 22px Orbitron'; ctx.fillStyle = '#fff'; ctx.fillText(s.bangerName.toUpperCase() + ' ELIMINATED', CW / 2, CH / 2 + 50); }
      ctx.restore();
    }
    if (s.elimFlash > 0) { ctx.fillStyle = `rgba(255,60,80,${s.elimFlash / 40 * 0.3})`; ctx.fillRect(0, 0, CW, CH); }
    if (!started || countdown > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign = 'center'; ctx.fillStyle = '#FFD700'; ctx.font = 'bold 100px Orbitron';
      ctx.fillText(countdown > 0 ? String(countdown) : 'GO!', CW / 2, CH / 2 + 30);
    }
  }

  function drawNetBanger(ctx, topY, wobble) {
    const wob = Math.sin(Date.now() * 0.02) * wobble * 0.3;
    ctx.fillStyle = '#222'; ctx.fillRect(NET_X - 8, topY - 10, 4, FLOOR - topY + 12); ctx.fillRect(NET_X + 4, topY - 10, 4, FLOOR - topY + 12);
    ctx.fillStyle = '#fff'; ctx.fillRect(NET_X - 8, topY - 6, 16, 6);
    ctx.fillStyle = '#DD2233'; ctx.fillRect(NET_X - 8, topY, 16, 2);
    ctx.strokeStyle = 'rgba(245,245,255,0.5)'; ctx.lineWidth = 0.6;
    for (let x = NET_X - 6; x <= NET_X + 6; x += 3) { ctx.beginPath(); ctx.moveTo(x + wob, topY); ctx.lineTo(x, FLOOR); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(245,245,255,0.3)';
    for (let y = topY + 8; y < FLOOR; y += 12) { ctx.beginPath(); ctx.moveTo(NET_X - 6, y); ctx.lineTo(NET_X + 6, y); ctx.stroke(); }
  }

  function drawWeather(ctx, s) {
    if (weather === 'rain') { ctx.strokeStyle = 'rgba(150,180,255,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = (i * 23 + s.weatherT * 4) % COURT_W; const y = (i * 47 + s.weatherT * 12) % CH; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    else if (weather === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 60; i++) { const x = (i * 31 + Math.sin(s.weatherT * 0.05 + i) * 12) % COURT_W; const y = (i * 41 + s.weatherT * 2) % CH; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); } }
  }

  function drawTeam(ctx, s, side, ids, els, color) {
    const team = teamArr(side); const active = s['active' + side];
    team.forEach((p) => {
      if (p.dead) {
        ctx.save(); ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#1a1a22'; ctx.fillRect(p.baseX - 14, FLOOR - 56, 28, 56);
        ctx.strokeStyle = '#FF3355'; ctx.lineWidth = 2; ctx.strokeRect(p.baseX - 14, FLOOR - 56, 28, 56);
        ctx.fillStyle = '#FF3355'; ctx.font = 'bold 20px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('✖', p.baseX, FLOOR - 24);
        ctx.restore(); return;
      }
      const ch = charAt(side, p.slot);
      let pose = 'idle'; if (Math.abs(p.x - p.baseX) > 4) pose = 'moving'; if (p.hitT > 0) pose = 'hurt';
      drawSportChar(ctx, p.x, p.y, ch, { facing: side === 1 ? 1 : -1, frame: p.frame, scale: 1.0, jersey: true, sport: 'volleyball', teamColor: color, state: pose, equippedSkins, equippedAccessories: mergedAccessories });
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(p.x - 40, p.y - 96, 80, 14);
      ctx.fillStyle = (s.phase === 'aim' && s.aimSide === side && p.slot === active) ? '#FFD700' : ch.color;
      ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(ch.name.toUpperCase().slice(0, 10), p.x, p.y - 86);
    });
  }

  function drawBall(ctx, s) {
    const b = s.ball;
    if (s.phase === 'aim' || s.phase === 'roll') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x, FLOOR - 4, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    if (s.phase === 'roll') {
      ctx.fillStyle = '#FFEECC'; ctx.shadowColor = '#FFCC66'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(b.x, FLOOR - 8, 9, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.save(); ctx.translate(b.x, FLOOR - 8); ctx.rotate(b.spin); ctx.strokeStyle = '#DDA044'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 7, i * 2.094, i * 2.094 + 1.05); ctx.stroke(); } ctx.restore();
      return;
    }
    if (!b.alive && s.phase !== 'drop' && s.phase !== 'flight' && s.phase !== 'roll' && s.phase !== 'aim') return;
    for (let i = 0; i < b.trail.length; i++) { const t = b.trail[i]; ctx.globalAlpha = (i / b.trail.length) * 0.3; ctx.fillStyle = '#FFEECC'; ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFEECC'; ctx.shadowColor = '#FFCC66'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin); ctx.strokeStyle = '#DDA044'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 7, i * 2.094, i * 2.094 + 1.05); ctx.stroke(); } ctx.restore();
    if (b.bangerWindow > 0) {
      ctx.fillStyle = '#FF3355'; ctx.font = 'bold 18px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText('PRESS POWER — BANGER!', NET_X, 120);
      const w = b.bangerWindow / 34; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(NET_X - 60, 126, 120, 8);
      ctx.fillStyle = '#FF3355'; ctx.fillRect(NET_X - 60, 126, 120 * w, 8);
    }
  }

  function drawAimArrow(ctx, s) {
    const side = s.aimSide; const team = teamArr(side); const hitter = team[s['active' + side]];
    if (!hitter) return;
    const a = curAngle(s); const dir = dirOf(side);
    const cx = hitter.x, cy = hitter.y - 80;
    const dx = dir * Math.sin(a), dy = -Math.cos(a);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 44, -Math.PI / 2 - Math.PI / 6, -Math.PI / 2 + Math.PI / 6); ctx.stroke();
    const L = 60; const ax = cx + dx * L, ay = cy + dy * L;
    const q = (a + Math.PI / 6) / (Math.PI / 3);
    const col = q > 0.85 ? '#44FF88' : q > 0.5 ? '#FFD700' : '#FF8844';
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
    const perpX = -dy, perpY = dx;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(ax + dx * 10, ay + dy * 10); ctx.lineTo(ax - dx * 3 + perpX * 8, ay - dy * 3 + perpY * 8); ctx.lineTo(ax - dx * 3 - perpX * 8, ay - dy * 3 - perpY * 8); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawHUD(ctx, s) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CW, 32);
    const a1 = alivePlayers(1).length, a2 = alivePlayers(2).length;
    ctx.textAlign = 'left'; ctx.fillStyle = TEAM_COLOR_P1; ctx.font = 'bold 16px Orbitron'; ctx.fillText(`BLUE ${a1}/3`, 14, 23);
    ctx.textAlign = 'right'; ctx.fillStyle = TEAM_COLOR_P2; ctx.fillText(`${a2}/3 RED`, CW - 14, 23);
    ctx.textAlign = 'center'; ctx.fillStyle = '#FF4D6D'; ctx.font = 'bold 10px Orbitron'; ctx.fillText('💥 BANGER — ELEMENT 6 ORIGINAL', CW / 2, 19);
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px Orbitron';
    const hint = p2IsCPU ? 'P1:  , (or V) STRIKE   ·   . (or C) BANGER   ·   time the arrow (60°-120°)' : 'P1: , Strike  . Banger    |    P2: V Strike  C Banger';
    ctx.fillText(hint, 14, CH - 10);
  }

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <button onClick={onQuit} className="self-start px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Quit</button>
      <canvas ref={canvasRef} width={CW} height={CH} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: CW + 'px', height: 'auto', aspectRatio: `${CW} / ${CH}`, background: '#080d1a' }} />
    </div>
  );
}