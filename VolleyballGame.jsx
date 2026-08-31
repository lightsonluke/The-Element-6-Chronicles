import React, { useRef, useEffect, useState } from 'react';
import PauseMenu from './PauseMenu.jsx';
import { drawSportChar } from './sportDraw.jsx';
import { ALL_CHARS, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { applyElement } from './elements.js';
import { readGamepadInput } from './controllerProfiles.js';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { mergeBotCosmetics } from './botCosmetics.js';

const charFor = (id, element) => { const c = ALL_CHARS.find(c => c.id === id); if (!c) return null; if (element && element !== 'basic') return { ...c, stats: applyElement(c.stats || {}, element) }; return c; };

const W = 1100, H = 660;
const FLOOR = 540;
const NET_X = W / 2;
const NET_TOP = 380; // taller net — more vertical play space
const NET_HALF_W = 6;
const COURT_LEFT = 40;
const COURT_RIGHT = W - 40;
const WIN_POINTS = 11;
const GRAV = 0.34;
const MAX_TEAM_HITS = 5;
const ATTACK_L = NET_X - 130;
const ATTACK_R = NET_X + 130;
const BACK_X = { 1: 100, 2: W - 100 };
const MID_X = { 1: 300, 2: W - 300 };
const ROOF_Y = -400;       // roof way above the screen — ball has huge vertical room
const CEILING = ROOF_Y;   // ball bounces off the roof (off-screen)
const HIT_R = 100;        // hit radius for bump/set/spike/dive — does not cross the net

const DIFF_MUL = { newcomer: 0.55, beginner: 0.65, easy: 0.75, amateur: 0.85, regular: 1, pro: 1.1, hard: 1.25, insane: 1.4, honored: 1.6 };

function newPlayer(x) { return { x, base: x, y: FLOOR, vx: 0, vy: 0, jump: 0, onGround: true, doubleJumped: false, prevUp: false, actionState: 'idle', actionTimer: 0, diveCD: 0, diving: false, diveDir: 0, diveTimer: 0 }; }
function newPlayerStats() { return { spikes: 0, sets: 0, bumps: 0, digs: 0, receives: 0, points: 0, assists: 0 }; }
function addStat(s, side, slot, field, n = 1) { const k = `${side}-${slot}`; if (s.playerStats[k]) s.playerStats[k][field] += n; }

export default function VolleyballGame({ p1Chars, p2Chars, p2IsCPU, difficulty, onResult, onQuit, p1Jersey = true, p2Jersey = true, musicVolume = 50, sfxVolume = 70, p1Elements = [], p2Elements = [], equippedSkins = {}, equippedAccessories = {}, settings = {}, lanConnection = null, lanRole = null, localScheme = null, remoteState = null, onStateExport = null, isOnlineHost = false }) {
  const is1v1 = p1Chars.length === 1;
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const keysRef = useRef({});
  const gpRef = useRef({ 0: {}, 1: {} }); // gamepad state per slot
  const gpPrevRef = useRef({ 0: {}, 1: {} }); // previous gamepad state for edge detection
  const st = useRef(null);
  const remoteKeysProc = useRef(false);
  const remoteStateRef = useRef(null);
  const onStateExportRef = useRef(null);

  // Merge bot cosmetics for CPU characters — bots get random accessories every match
  const botAccsRef = useRef(null);
  if (!botAccsRef.current) {
    const botCharIds = [];
    if (p2IsCPU) p2Chars.forEach(id => botCharIds.push(id));
    // Teammate bot on team 1 (2v2) — gets bot cosmetics if player hasn't equipped any
    if (!is1v1 && p1Chars[1]) botCharIds.push(p1Chars[1]);
    botAccsRef.current = botCharIds.length > 0
      ? mergeBotCosmetics(equippedAccessories, {}, botCharIds).equippedAccessories
      : equippedAccessories;
  }
  const mergedAccessories = botAccsRef.current;
  useEffect(() => { remoteStateRef.current = remoteState; }, [remoteState]);
  useEffect(() => { onStateExportRef.current = onStateExport; }, [onStateExport]);

  // Initialize state once
  if (!st.current) {
    st.current = {
      s1: 0, s2: 0, frame: 0, done: false, shake: 0,
      phase: 'serve', countdownNum: 0, phaseTimer: 0,
      pointFlash: 0, flashColor: '#FFD700', flashMsg: '', flashReason: '',
      suddenDeath: false,
      serverSide: 1, serverSlot1: 0, serverSlot2: 0,
      serveTossed: false, tossTimer: 0, serveFirstCross: false, servingTeamLocked: 0, serveReturned: false,
      t1: is1v1 ? [newPlayer(BACK_X[1])] : [newPlayer(BACK_X[1]), newPlayer(MID_X[1])],
      t2: is1v1 ? [newPlayer(BACK_X[2])] : [newPlayer(BACK_X[2]), newPlayer(MID_X[2])],
      active1: 0, active2: 0,
      ball: { x: 0, y: 0, vx: 0, vy: 0, alive: false, last: 1, spike: false, setter: null, isSet: false, trail: [], spin: 0, lastTouchKey: null, consecTouches: 0, teamHits: 0, lastHitTeam: 0 },
      sSpikes: 0, sDigs: 0, sAces: 0, p1Spikes: 0, p1Digs: 0, p2Spikes: 0, p2Digs: 0, p1Bumps: 0, p1Sets: 0, p2Bumps: 0, p2Sets: 0,
      playerStats: { '1-0': newPlayerStats(), '1-1': newPlayerStats(), '2-0': newPlayerStats(), '2-1': newPlayerStats() },
    };
  }

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 800); return () => clearTimeout(t); }
    setStarted(true);
    resetPositions(st.current, is1v1);
    setupServe(st.current);
  }, [countdown]);

  // Music
  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  // Input + actions
  useEffect(() => {
    if (!started) return;
    const tryHit = (side, type) => {
      const s = st.current;
      // Serve: two-step — first press tosses up, second press hits over
      if (type === 'serve') {
        if (s.phase !== 'serve' || s.serverSide !== side) return;
        if (!s.serveTossed) {
          s.serveTossed = true;
          s.ball.alive = true;
          s.ball.vx = 0; s.ball.vy = -8;
          s.ball.spike = false; s.ball.trail = []; s.ball.spin = 0;
          s.ball.lastTouchKey = null; s.ball.consecTouches = 0;
          s.tossTimer = 90;
          sfx.hit();
        } else {
          const slot = side === 1 ? s.serverSlot1 : s.serverSlot2;
          const team = side === 1 ? s.t1 : s.t2;
          const p = team[slot];
          const dx = Math.abs(s.ball.x - p.x), dy = Math.abs(s.ball.y - (p.y - 40));
          if (dx > 90 || dy > 140) return;
          const dir = side === 1 ? 1 : -1;
          s.ball.vx = dir * 10; s.ball.vy = -15; // stronger serve — goes farther
          s.ball.last = side; s.ball.spike = false; s.ball.setter = side; s.ball.isSet = false;
          s.ball.lastTouchKey = `${side}-${slot}`; s.ball.consecTouches = 1;
          s.phase = 'rally'; s.serveTossed = false; s.serveFirstCross = false;
          s.servingTeamLocked = side; // serving team can't hit again until ball returns to their half
          if (!is1v1) { if (side === 1) s.serverSlot1 = (s.serverSlot1 + 1) % 2; else s.serverSlot2 = (s.serverSlot2 + 1) % 2; }
          p.actionState = 'bump'; p.actionTimer = 15;
          sfx.power();
        }
        return;
      }
      // Switch works in any phase (rally or serve) — super move button
      const ak = side === 1 ? 'active1' : 'active2';
      const teamKey = side === 1 ? 't1' : 't2';
      const team = s[teamKey];
      if (type === 'switch') {
        if (is1v1) return;
        s[ak] = (s[ak] + 1) % team.length; sfx.hit();
        return;
      }
      if (s.phase !== 'rally') return;
      // After serve, the serving team can't hit again until the ball comes back to their half
      if (s.servingTeamLocked === side) return;
      // Only a bump can return a serve — any other input is ignored
      if (s.serveFirstCross && !s.serveReturned && type !== 'bump') return;
      const p = team[s[ak]];
      const b = s.ball;
      if (!b.alive) return;

      // Foul: non-server teammate touches before ball crosses net for first time
      if (!s.serveFirstCross && s.serverSide === side) {
        const serverSlot = side === 1 ? s.serverSlot1 : s.serverSlot2;
        if (s[ak] !== serverSlot) {
          score(s, side === 1 ? 2 : 1, is1v1, p1Chars, p2Chars, 'Illegal touch before serve crossed');
          return;
        }
      }

      // Can only hit if ball is on your side
      const onMySide = side === 1 ? b.x < NET_X : b.x > NET_X;
      if (!onMySide) return;
      if (Math.hypot(b.x - p.x, b.y - (p.y - 40)) > HIT_R) return;
      const touchKey = `${side}-${s[ak]}`;
      const isSame = touchKey === b.lastTouchKey;
      if (isSame && b.consecTouches >= 2) return;

      // Can't block a spike with another spike
      if (type === 'spike' && b.spike && b.last !== side) return;

      const charId = side === 1 ? p1Chars[s[ak]] : p2Chars[s[ak]];
      const c = charFor(charId, (side === 1 ? p1Elements : p2Elements)?.[s[ak]]);
      const dir = side === 1 ? 1 : -1;
      recordHit(s, side, s[ak], type, b);
      if (type === 'bump') {
        const ctrl = c?.stats?.control || 5;
        b.vx = dir * (7 + ctrl * 0.15); b.vy = -15;
        b.last = side; b.spike = false; b.setter = side; b.isSet = false;
        p.actionState = 'bump'; p.actionTimer = 15;
        sfx.hit();
      } else if (type === 'set') {
        // Sets go way high but won't hit the roof
        b.vx = dir * 1.5; b.vy = -18;
        b.last = side; b.setter = side; b.spike = false; b.isSet = true;
        p.actionState = 'set'; p.actionTimer = 15;
        sfx.power();
      } else if (type === 'spike') {
        if (p.jump <= 0) return;
        const power = c?.stats?.power || 5;
        b.vx = dir * (10 + power * 0.3); b.vy = 2;
        b.last = side; b.spike = true; b.setter = null; b.isSet = false;
        p.actionState = 'spike'; p.actionTimer = 15;
        (b.last === 1 ? s.p1Spikes++ : s.p2Spikes++); s.shake = 14;
        sfx.superActivate();
      }
      b.lastTouchKey = touchKey;
      b.consecTouches = isSame ? b.consecTouches + 1 : 1;
      registerTeamHit(s, side);
    };

    const tryDive = (side) => {
      const s = st.current;
      if (s.phase !== 'rally' && s.phase !== 'serve') return;
      if (s.servingTeamLocked === side) return;
      const ak = side === 1 ? 'active1' : 'active2';
      const teamKey = side === 1 ? 't1' : 't2';
      const p = s[teamKey][s[ak]];
      if (!p || p.diveCD > 0 || p.diving || !p.onGround) return;
      const leftKey = side === 1 ? 'arrowleft' : 'a';
      const rightKey = side === 1 ? 'arrowright' : 'd';
      const gp = gpRef.current[side === 1 ? 0 : 1] || {};
      let dir = 0;
      if (keysRef.current[leftKey] || gp.left) dir = -1;
      else if (keysRef.current[rightKey] || gp.right) dir = 1;
      if (dir === 0) return;
      p.diving = true; p.diveDir = dir; p.diveTimer = 22; p.diveCD = 600;
      p.actionState = 'bump'; p.actionTimer = 22;
      sfx.hit();
    };

    // Per-device scheme: translate local keys to the role's native scheme before processing/relaying
    const VB_P1_TO_P2 = { 'arrowleft': 'a', 'arrowright': 'd', 'arrowup': 'w', ',': 'x', '.': 'c', '/': 'v', 'l': 'f' };
    const VB_P2_TO_P1 = { 'a': 'arrowleft', 'd': 'arrowright', 'w': 'arrowup', 'x': ',', 'c': '.', 'v': '/', 'f': 'l' };
    const resolveKey = (key) => {
      if (!lanConnection || remoteKeysProc.current) return key;
      const scheme = localScheme || (lanRole === 'host' ? 'p1' : 'p2');
      const toScheme = lanRole === 'host' ? 'p1' : 'p2';
      if (scheme === toScheme) return key;
      const kl = key.toLowerCase();
      if (scheme === 'p1' && toScheme === 'p2') return VB_P1_TO_P2[kl] || key;
      if (scheme === 'p2' && toScheme === 'p1') return VB_P2_TO_P1[kl] || key;
      return key;
    };
    const kd = e => {
      const rk = resolveKey(e.key);
      const k = rk.toLowerCase(); keysRef.current[k] = true;
      if (lanConnection && !remoteKeysProc.current) lanConnection.sendMessage({ type: 'key', key: rk, down: true });
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { e.preventDefault(); pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); return; }
      if (['F5','F12'].includes(e.key)) return;
      // Switch works in ANY phase (serve or rally) — handle FIRST so it's never blocked
      if (k === '/' && !is1v1) { tryHit(1, 'switch'); e.preventDefault(); return; }
      if (!p2IsCPU && !is1v1 && k === 'v') { tryHit(2, 'switch'); e.preventDefault(); return; }
      if (p2IsCPU && !is1v1 && k === 'v') { tryHit(1, 'switch'); e.preventDefault(); return; }
      // P1: , = serve/bump, . = set/spike (air)
      if (k === ',' && st.current.phase === 'serve' && (p2IsCPU || st.current.serverSide === 1)) {
        tryHit(1, 'serve'); e.preventDefault(); return;
      }
      if (k === ',') tryHit(1, 'bump');
      else if (k === '.') { const p = st.current.t1[st.current.active1]; tryHit(1, p.jump > 0 ? 'spike' : 'set'); }
      if (p2IsCPU) {
        if (k === 'x' && st.current.phase === 'serve' && st.current.serverSide === 1) { tryHit(1, 'serve'); e.preventDefault(); return; }
        if (k === 'x') tryHit(1, 'bump');
        else if (k === 'c') { const p = st.current.t1[st.current.active1]; tryHit(1, p.jump > 0 ? 'spike' : 'set'); }
        if (k === 'f') tryDive(1);
      }
      // P2: X = serve/bump, C = set/spike (air)
      if (!p2IsCPU) {
        if (k === 'x' && st.current.phase === 'serve' && st.current.serverSide === 2) { tryHit(2, 'serve'); e.preventDefault(); return; }
        if (k === 'x') tryHit(2, 'bump');
        else if (k === 'c') { const p = st.current.t2[st.current.active2]; tryHit(2, p.jump > 0 ? 'spike' : 'set'); }
        if (k === 'f') tryDive(2);
      }
      if (k === 'l') tryDive(1);
      e.preventDefault();
    };
    const ku = e => { const rk = resolveKey(e.key); keysRef.current[rk.toLowerCase()] = false; if (lanConnection && !remoteKeysProc.current) lanConnection.sendMessage({ type: 'key', key: rk, down: false }); };
    if (lanConnection) {
      lanConnection.onMessage((msg) => {
        if (!msg || msg.type !== 'key') return;
        remoteKeysProc.current = true;
        if (msg.down) kd({ key: msg.key, preventDefault() {} }); else ku({ key: msg.key });
        remoteKeysProc.current = false;
      });
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    // Gamepad polling — merge movement into gpRef, edge-detect action buttons
    const gpEnabled = settings?.controllerEnabled !== false;
    let gpRaf;
    const pollGamepad = () => {
      if (gpEnabled) {
        for (const slot of [0, 1]) {
          const gp = readGamepadInput(slot);
          gpRef.current[slot] = gp || {};
          if (gp) {
            const prev = gpPrevRef.current[slot] || {};
            // P1 = slot 0, P2 = slot 1 (or alt controls when vs CPU)
            const side = (p2IsCPU && slot === 1) ? 1 : (slot === 0 ? 1 : 2);
            // Bump/serve (sig button = light attack)
            if (gp.sig && !prev.sig) {
              if (st.current.phase === 'serve' && (p2IsCPU || st.current.serverSide === side)) tryHit(side, 'serve');
              else tryHit(side, 'bump');
            }
            // Set/spike (heavy button) — spike if airborne, else set
            if (gp.heavy && !prev.heavy) {
              const p = st.current[side === 1 ? 't1' : 't2'][st.current[side === 1 ? 'active1' : 'active2']];
              tryHit(side, p.jump > 0 ? 'spike' : 'set');
            }
            // Switch (power button) — only in 2v2
            if (gp.power && !prev.power && !is1v1) tryHit(side, 'switch');
            // Dive (super button) + direction
            if (gp.superMove && !prev.superMove) tryDive(side);
          }
          gpPrevRef.current[slot] = gp ? { sig: gp.sig, heavy: gp.heavy, power: gp.power, superMove: gp.superMove } : {};
        }
      }
      gpRaf = requestAnimationFrame(pollGamepad);
    };
    if (gpEnabled) gpRaf = requestAnimationFrame(pollGamepad);

    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); if (gpRaf) cancelAnimationFrame(gpRaf); };
  }, [started, p2IsCPU, p1Chars, p2Chars, onQuit, is1v1, settings?.controllerEnabled]);

  // Game loop
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf; let last = performance.now();
    const loop = (now) => {
      last = now;
      if (remoteStateRef.current) {
        st.current = remoteStateRef.current;
        draw(ctx, st.current, p1Chars, p2Chars, p1Jersey, p2Jersey, p2IsCPU, is1v1, equippedSkins, mergedAccessories);
        raf = requestAnimationFrame(loop);
        return;
      }
      const s = st.current;
      if (pausedRef.current) {
        draw(ctx, s, p1Chars, p2Chars, p1Jersey, p2Jersey, p2IsCPU, is1v1, equippedSkins, mergedAccessories);
        raf = requestAnimationFrame(loop);
        return;
      }
      s.frame++;

      if (s.phase === 'countdown') {
        s.phaseTimer--;
        if (s.phaseTimer <= 0) {
          s.countdownNum--;
          if (s.countdownNum <= 0) { resetPositions(s, is1v1); setupServe(s); }
          else { s.phaseTimer = 50; }
        }
      }

      if (s.phase === 'serve') {
        const slot = s.serverSide === 1 ? s.serverSlot1 : s.serverSlot2;
        const t = s.serverSide === 1 ? s.t1[slot] : s.t2[slot];
        if (!s.serveTossed) {
          s.ball.x = t.x + (s.serverSide === 1 ? 25 : -25);
          s.ball.y = t.y - 60;
          s.ball.vx = 0; s.ball.vy = 0;
        }
        // CPU auto-serve: toss up, wait ~0.5s, bump over
        if (p2IsCPU && s.serverSide === 2) {
          s.phaseTimer = (s.phaseTimer || 0) + 1;
          if (!s.serveTossed && s.phaseTimer > 40) {
            s.serveTossed = true; s.ball.alive = true;
            s.ball.vx = 0; s.ball.vy = -7;
            s.ball.trail = []; s.ball.spin = 0; s.ball.lastTouchKey = null; s.ball.consecTouches = 0;
            s.tossTimer = 90; s.phaseTimer = 0; sfx.hit();
          } else if (s.serveTossed && s.phaseTimer > 30) {
            const dir = -1;
            s.ball.vx = dir * 8; s.ball.vy = -14; // stronger bump serve
            s.ball.last = 2; s.ball.spike = false; s.ball.setter = 2; s.ball.isSet = false;
            s.ball.lastTouchKey = `2-${slot}`; s.ball.consecTouches = 1;
            s.phase = 'rally'; s.serveTossed = false; s.serveFirstCross = false;
            s.servingTeamLocked = 2;
            if (!is1v1) s.serverSlot2 = (s.serverSlot2 + 1) % 2;
            t.actionState = 'bump'; t.actionTimer = 15;
            s.phaseTimer = 0; sfx.hit();
          }
        }
      }

      // Ball physics
      const ballActive = (s.phase === 'rally' || (s.phase === 'serve' && s.serveTossed)) && s.ball.alive;
      if (ballActive) {
        const prevX = s.ball.x;
        const prevY = s.ball.y;
        s.ball.vy += GRAV;
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;
        s.ball.vx *= 0.997;
        s.ball.spin += s.ball.vx * 0.03;
        const sp = Math.hypot(s.ball.vx, s.ball.vy);
        if (sp > 4) { s.ball.trail.push({ x: s.ball.x, y: s.ball.y }); if (s.ball.trail.length > 8) s.ball.trail.shift(); }
        else if (s.ball.trail.length) s.ball.trail.shift();
        if (s.ball.y < CEILING) { s.ball.y = CEILING; s.ball.vy = Math.abs(s.ball.vy) * 0.4; }
        // Ball bounces off back walls (dotted lines) — stays in play
        if (s.ball.x <= COURT_LEFT) { s.ball.x = COURT_LEFT; s.ball.vx = Math.abs(s.ball.vx) * 0.55; sfx.hit(); }
        if (s.ball.x >= COURT_RIGHT) { s.ball.x = COURT_RIGHT; s.ball.vx = -Math.abs(s.ball.vx) * 0.55; sfx.hit(); }
        // Track first cross + reset team hit counter whenever ball crosses to the other half
        if ((prevX < NET_X && s.ball.x >= NET_X) || (prevX > NET_X && s.ball.x <= NET_X)) {
          if (!s.serveFirstCross) s.serveFirstCross = true;
          s.ball.teamHits = 0; s.ball.lastHitTeam = 0;
        }
        // Net collision — swept check prevents the ball from tunneling
        // through the net at high speed. We detect the crossing using the
        // previous x position and interpolate the ball's y at the exact
        // moment it crossed the net plane, so even the fastest spike can't
        // skip past the collision zone in a single frame.
        const crossedNet = (prevX < NET_X && s.ball.x >= NET_X) || (prevX > NET_X && s.ball.x <= NET_X);
        if (crossedNet) {
          const t = Math.abs(s.ball.x - prevX) > 0.001 ? (NET_X - prevX) / (s.ball.x - prevX) : 0;
          const yAtCross = prevY + (s.ball.y - prevY) * t;
          if (yAtCross + 9 > NET_TOP) {
            const fromLeft = prevX < NET_X;
            s.ball.x = NET_X + (fromLeft ? -(NET_HALF_W + 5) : (NET_HALF_W + 5));
            s.ball.vx = (fromLeft ? -1 : 1) * Math.abs(s.ball.vx) * 0.45;
            s.ball.vy = Math.abs(s.ball.vy) * 0.4 + 1;
            sfx.hit();
          }
        } else if (Math.abs(s.ball.x - NET_X) < NET_HALF_W + 5 && s.ball.y + 9 > NET_TOP) {
          // Slow ball resting in the net zone — bounce it back
          const fromLeft = s.ball.x < NET_X;
          s.ball.x = NET_X + (fromLeft ? -(NET_HALF_W + 5) : (NET_HALF_W + 5));
          s.ball.vx = (fromLeft ? -1 : 1) * Math.abs(s.ball.vx) * 0.45;
          s.ball.vy = Math.abs(s.ball.vy) * 0.4 + 1;
          sfx.hit();
        }
        if (s.serveTossed) {
          s.tossTimer--;
          if (s.tossTimer <= 0) {
            const slot = s.serverSide === 1 ? s.serverSlot1 : s.serverSlot2;
            const dir = s.serverSide === 1 ? 1 : -1;
            s.ball.vx = dir * 8; s.ball.vy = -14;
            s.ball.last = s.serverSide; s.ball.spike = false; s.ball.setter = s.serverSide; s.ball.isSet = false;
            s.ball.lastTouchKey = `${s.serverSide}-${slot}`; s.ball.consecTouches = 1;
            s.phase = 'rally'; s.serveTossed = false; s.serveFirstCross = false;
            s.servingTeamLocked = s.serverSide;
            sfx.hit();
          }
        }
        // Clear serving team lock when ball returns to their half
        if (s.servingTeamLocked > 0) {
          const lockSide = s.servingTeamLocked;
          const ballOnLockSide = lockSide === 1 ? s.ball.x < NET_X : s.ball.x > NET_X;
          if (ballOnLockSide && !s.serveFirstCross) {
            // ball hasn't crossed yet — still locked
          }
          // Unlock when ball crosses back to the serving team's side after having been on the other side
          if (s.serveFirstCross && ballOnLockSide) {
            s.servingTeamLocked = 0;
          }
        }
        // Ball-player collision (bounce off characters, no player-player collision)
        collideBallPlayers(s, p1Chars, p2Chars);
        if (s.phase === 'rally') {
          if (s.ball.y + 10 >= FLOOR) { const r = s.ball.spike ? 'Spike hit the floor!' : 'Ball hit the floor!'; score(s, s.ball.x < NET_X ? 2 : 1, is1v1, p1Chars, p2Chars, r); }
        }
      }

      if (s.phase === 'point') {
        s.phaseTimer--;
        if (s.phaseTimer <= 0) {
          if (s.s1 >= WIN_POINTS && s.s1 - s.s2 >= 2) { s.done = true; s.phase = 'done'; setTimeout(() => onResult?.({ p1Won: true, stats: { spikes: s.p1Spikes + s.p2Spikes, digs: s.p1Digs + s.p2Digs, aces: 0, p2Points: s.s2 }, p1Stats: { spikes: s.p1Spikes, digs: s.p1Digs, points: s.s1 }, p2Stats: { spikes: s.p2Spikes, digs: s.p2Digs, points: s.s2 }, p1CharStats: buildCharStats(s, 1, p1Chars, p1Elements), p2CharStats: buildCharStats(s, 2, p2Chars, p2Elements) }), 1500); }
          else if (s.s2 >= WIN_POINTS && s.s2 - s.s1 >= 2) { s.done = true; s.phase = 'done'; setTimeout(() => onResult?.({ p1Won: false, stats: { spikes: s.p1Spikes + s.p2Spikes, digs: s.p1Digs + s.p2Digs, aces: 0, p2Points: s.s2 }, p1Stats: { spikes: s.p1Spikes, digs: s.p1Digs, points: s.s1 }, p2Stats: { spikes: s.p2Spikes, digs: s.p2Digs, points: s.s2 }, p1CharStats: buildCharStats(s, 1, p1Chars, p1Elements), p2CharStats: buildCharStats(s, 2, p2Chars, p2Elements) }), 1500); }
          else {
            s.suddenDeath = (s.s1 >= WIN_POINTS - 1 && s.s2 >= WIN_POINTS - 1 && Math.abs(s.s1 - s.s2) < 2);
            s.phase = 'countdown'; s.countdownNum = 3; s.phaseTimer = 50;
          }
        }
      }

      // Movement
      const canMove = (s.phase === 'rally' || s.phase === 'serve');
      const p1Main = s.t1[s.active1];
      const gp1 = gpRef.current[0] || {};
      const gp2 = gpRef.current[1] || {};
      const p1Left = keysRef.current['arrowleft'] || gp1.left || (p2IsCPU && (keysRef.current['a'] || gp2.left));
      const p1Right = keysRef.current['arrowright'] || gp1.right || (p2IsCPU && (keysRef.current['d'] || gp2.right));
      const p1Up = keysRef.current['arrowup'] || gp1.up || (p2IsCPU && (keysRef.current['w'] || gp2.up));
      const p1Frozen = s.phase === 'serve' && s.serverSide === 1 && !s.serveTossed && s.active1 === s.serverSlot1;
      if (p1Main.diving) updateDive(s, p1Main, 1, p1Chars, is1v1);
      else if (p1Frozen) moveFrozen(p1Main, p1Up);
      else if (canMove) movePlayer(p1Main, p1Left, p1Right, p1Up, 4.5, true);
      else idlePlayer(p1Main);

      // Process P1 teammate bot dive before AI logic
      if (!is1v1) {
        const p1Bot = s.t1[1 - s.active1];
        if (p1Bot && p1Bot.diving) updateDive(s, p1Bot, 1, p1Chars, is1v1);
        teammateBot(s, 1, s.active1, p1Chars);
      }

      if (p2IsCPU) {
        // Process CPU team dives before AI logic
        s.t2.forEach((p) => { if (p && p.diving) updateDive(s, p, 2, p2Chars, is1v1); });
        cpuTeam(s, difficulty, is1v1);
      } else {
        const p2Main = s.t2[s.active2];
        const p2Frozen = s.phase === 'serve' && s.serverSide === 2 && !s.serveTossed && s.active2 === s.serverSlot2;
        if (p2Main.diving) updateDive(s, p2Main, 2, p2Chars, is1v1);
        else if (p2Frozen) moveFrozen(p2Main, keysRef.current['w'] || gp2.up);
        else if (canMove) movePlayer(p2Main, keysRef.current['a'] || gp2.left, keysRef.current['d'] || gp2.right, keysRef.current['w'] || gp2.up, 4.5, false);
        else idlePlayer(p2Main);
        // Process P2 teammate bot dive before AI logic
        if (!is1v1) {
          const p2Bot = s.t2[1 - s.active2];
          if (p2Bot && p2Bot.diving) updateDive(s, p2Bot, 2, p2Chars, is1v1);
          teammateBot(s, 2, s.active2, p2Chars);
        }
      }

      [s.t1[0], s.t1[1], s.t2[0], s.t2[1]].forEach(p => {
        if (!p) return;
        if (p.actionTimer > 0) { p.actionTimer--; if (p.actionTimer <= 0 && !p.diving) p.actionState = 'idle'; }
        if (p.diveCD > 0) p.diveCD--;
      });

      if (s.pointFlash > 0) s.pointFlash--;
      if (s.shake > 0) s.shake *= 0.85;

      if (onStateExportRef.current) onStateExportRef.current(s);
      draw(ctx, s, p1Chars, p2Chars, p1Jersey, p2Jersey, p2IsCPU, is1v1, equippedSkins, mergedAccessories);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, p1Chars, p2Chars, p2IsCPU, difficulty, p1Jersey, p2Jersey, onResult, is1v1, equippedSkins, equippedAccessories]);

  function movePlayer(p, left, right, up, sp, leftSide) {
    if (left) p.vx = Math.max(p.vx - sp * 0.5, -sp);
    else if (right) p.vx = Math.min(p.vx + sp * 0.5, sp);
    else { p.vx *= 0.7; if (Math.abs(p.vx) < 0.1) p.vx = 0; }
    p.x += p.vx;
    if (leftSide) p.x = Math.max(COURT_LEFT, Math.min(NET_X - 16, p.x));
    else p.x = Math.max(NET_X + 16, Math.min(COURT_RIGHT, p.x));
    const upPressed = up && !p.prevUp;
    if (upPressed && p.onGround) { p.vy = -15; p.onGround = false; p.jump = 30; p.doubleJumped = false; }
    else if (upPressed && !p.onGround && !p.doubleJumped) { p.vy = -4.5; p.doubleJumped = true; p.jump = 15; }
    p.prevUp = up;
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;
  }
  function moveFrozen(p, up) {
    p.vx = 0;
    const upPressed = up && !p.prevUp;
    if (upPressed && p.onGround) { p.vy = -15; p.onGround = false; p.jump = 30; p.doubleJumped = false; }
    else if (upPressed && !p.onGround && !p.doubleJumped) { p.vy = -4.5; p.doubleJumped = true; p.jump = 15; }
    p.prevUp = up;
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;
  }
  function idlePlayer(p) {
    if (!p) return;
    p.vx *= 0.7;
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;
  }

  // Dive — character launches horizontally to dig the ball, 10s cooldown
  function updateDive(s, p, side, chars, is1v1) {
    p.diveTimer--;
    // Dive movement — fast horizontal slide, stays at ground level
    p.vx = p.diveDir * 10;
    p.x += p.vx;
    const lo = side === 1 ? COURT_LEFT : NET_X + 16;
    const hi = side === 1 ? NET_X - 16 : COURT_RIGHT;
    p.x = Math.max(lo, Math.min(hi, p.x));
    p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false;
    // Try to dig the ball — extended reach during dive
    const b = s.ball;
    if (b.alive && s.phase === 'rally' && s.servingTeamLocked !== side) {
      const onMySide = side === 1 ? b.x < NET_X : b.x > NET_X;
      if (onMySide && !(s.serveFirstCross && !s.serveReturned)) {
        if (Math.hypot(b.x - p.x, b.y - (p.y - 20)) <= HIT_R) {
          const teamArr = side === 1 ? s.t1 : s.t2;
          const slot = teamArr.indexOf(p);
          const touchKey = `${side}-${slot}`;
          const isSame = touchKey === b.lastTouchKey;
          if (!(isSame && b.consecTouches >= 2)) {
            const dir = side === 1 ? 1 : -1;
            const c = charFor(chars[slot], (side === 1 ? p1Elements : p2Elements)?.[slot]);
            const ctrl = c?.stats?.control || 5;
            recordHit(s, side, slot, 'dig', b);
            b.vx = dir * (7 + ctrl * 0.15); b.vy = -14;
            b.last = side; b.spike = false; b.setter = side; b.isSet = false;
            b.lastTouchKey = touchKey;
            b.consecTouches = isSame ? b.consecTouches + 1 : 1;
            if (side === 1) s.p1Digs++; else s.p2Digs++; s.shake = 10;
            p.actionState = 'bump'; p.actionTimer = 15;
            sfx.power();
            registerTeamHit(s, side);
          }
        }
      }
    }
    if (p.diveTimer <= 0) { p.diving = false; p.vx = 0; p.actionState = 'idle'; }
  }

  // Ball bounces off characters — only the CLOSEST player is processed each frame
  // so the ball can't oscillate (freeze) when two players overlap it. Players
  // mid-action (bump/set/spike) are skipped so a just-hit ball flies free.
  function collideBallPlayers(s, p1Chars, p2Chars) {
    const b = s.ball;
    if (!b.alive) return;
    const allPlayers = [];
    s.t1.forEach((p, i) => { if (p) allPlayers.push({ p, side: 1, i }); });
    s.t2.forEach((p, i) => { if (p) allPlayers.push({ p, side: 2, i }); });
    let closest = null, closestDist = Infinity;
    for (const { p } of allPlayers) {
      if (p.diving) continue;
      if (p.actionTimer > 0 && (p.actionState === 'bump' || p.actionState === 'spike' || p.actionState === 'set')) continue;
      const cx = p.x, cy = p.y - 35;
      const dx = b.x - cx, dy = b.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < closestDist) { closestDist = dist; closest = { cx, cy, dx, dy, dist }; }
    }
    if (closest && closest.dist < 22 && closest.dist > 0.1) {
      const { cx, cy, dx, dy, dist } = closest;
      const nx = dx / dist, ny = dy / dist;
      b.x = cx + nx * 22;
      b.y = cy + ny * 22;
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx = (b.vx - 2 * dot * nx) * 0.5;
        b.vy = (b.vy - 2 * dot * ny) * 0.5;
        b.vx += nx * 1.5;
        b.vy += ny * 1.5;
        sfx.hit();
      }
    }
  }

  // Teammate bot — auto-serves for the player, spikes sets, receives grounded,
  // keeps distance to maximize court coverage, and dives for far balls.
  function teammateBot(s, side, activeSlot, chars) {
    const team = side === 1 ? s.t1 : s.t2;
    const p = team[1 - activeSlot];
    if (!p) return;
    const b = s.ball;
    const teammate = team[activeSlot];
    const botSlot = 1 - activeSlot;
    const serverSlot = side === 1 ? s.serverSlot1 : s.serverSlot2;
    const lo = side === 1 ? COURT_LEFT : NET_X + 16;
    const hi = side === 1 ? NET_X - 16 : COURT_RIGHT;

    // If already diving, the dive is processed in the main loop — skip AI
    if (p.diving) return;

    // SERVE PHASE: if the bot is the server (player switched away), auto-serve
    if (s.phase === 'serve' && s.serverSide === side && botSlot === serverSlot) {
      s.phaseTimer = (s.phaseTimer || 0) + 1;
      if (!s.serveTossed && s.phaseTimer > 40) {
        s.serveTossed = true; s.ball.alive = true;
        s.ball.vx = 0; s.ball.vy = -7;
        s.ball.trail = []; s.ball.spin = 0; s.ball.lastTouchKey = null; s.ball.consecTouches = 0;
        s.tossTimer = 90; s.phaseTimer = 0; sfx.hit();
      } else if (s.serveTossed && s.phaseTimer > 30) {
        const dir = side === 1 ? 1 : -1;
        s.ball.vx = dir * 8; s.ball.vy = -14;
        s.ball.last = side; s.ball.spike = false; s.ball.setter = side; s.ball.isSet = false;
        s.ball.lastTouchKey = `${side}-${serverSlot}`; s.ball.consecTouches = 1;
        s.phase = 'rally'; s.serveTossed = false; s.serveFirstCross = false;
        s.servingTeamLocked = side;
        if (side === 1) s.serverSlot1 = (s.serverSlot1 + 1) % 2; else s.serverSlot2 = (s.serverSlot2 + 1) % 2;
        p.actionState = 'bump'; p.actionTimer = 15;
        s.phaseTimer = 0; sfx.hit();
      }
      p.vx = 0; idlePlayer(p); return; // server stays put
    }

    if (s.phase !== 'rally' || !b.alive) { maintainSpacing(p, teammate, lo, hi); return; }
    if (!s.serveFirstCross && s.serverSide === side) { maintainSpacing(p, teammate, lo, hi); return; }
    if (s.servingTeamLocked === side) { maintainSpacing(p, teammate, lo, hi); return; }
    const onMySide = side === 1 ? b.x < NET_X : b.x > NET_X;
    if (!onMySide) { maintainSpacing(p, teammate, lo, hi); return; }

    // Defer to the active player: if they're within 30 units of the ball, back off
    const active = team[activeSlot];
    if (Math.hypot(b.x - active.x, b.y - (active.y - 40)) < 30) { maintainSpacing(p, teammate, lo, hi); return; }

    const mateReceiving = Math.abs(b.x - teammate.x) < 75 && Math.abs(b.y - (teammate.y - 40)) < 170 && b.last !== side;

    // SPIKE MODE: active player set the ball up for us — run to the ball, jump, and spike
    const ballWasSet = b.isSet && b.last === side && !b.spike && b.y < FLOOR - 60 && b.vy > -4;
    if (ballWasSet && !mateReceiving) {
      let spikeX = b.x;
      if (b.vy > 0) {
        const tToSpike = (NET_TOP - b.y) / Math.max(0.1, b.vy);
        spikeX = b.x + b.vx * tToSpike * 0.5;
      }
      const clampedSpike = side === 1
        ? Math.max(COURT_LEFT + 15, Math.min(NET_X - 20, spikeX))
        : Math.max(NET_X + 20, Math.min(COURT_RIGHT - 15, spikeX));
      if (p.x < clampedSpike - 6) p.vx = Math.min(p.vx + 0.6, 5.5);
      else if (p.x > clampedSpike + 6) p.vx = Math.max(p.vx - 0.6, -5.5);
      else p.vx *= 0.7;
      p.x += p.vx;
      p.x = Math.max(lo, Math.min(hi, p.x));
      if (p.onGround && Math.abs(b.x - p.x) < 45 && b.y < NET_TOP + 30 && b.y > NET_TOP - 80) {
        p.vy = -15; p.onGround = false; p.jump = 30; p.doubleJumped = false;
      } else if (!p.onGround && !p.doubleJumped && b.y < p.y - 50 && Math.abs(b.x - p.x) < 50) {
        p.vy = -4.5; p.doubleJumped = true; p.jump = 15;
      }
      if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
      else if (p.jump > 0) p.jump--;
      if (!p.onGround && Math.hypot(b.x - p.x, b.y - (p.y - 40)) <= HIT_R) {
        const touchKey = `${side}-${botSlot}`;
        const isSame = touchKey === b.lastTouchKey;
        if (!(isSame && b.consecTouches >= 2)) {
          const c = charFor(chars[botSlot], (side === 1 ? p1Elements : p2Elements)?.[botSlot]);
          const dir = side === 1 ? 1 : -1;
          const power = c?.stats?.power || 5;
          b.vx = dir * (10 + power * 0.3); b.vy = 2;
          b.last = side; b.spike = true; b.setter = null; b.isSet = false;
          p.actionState = 'spike'; p.actionTimer = 15;
          (b.last === 1 ? s.p1Spikes++ : s.p2Spikes++); s.shake = 14; sfx.superActivate();
          b.lastTouchKey = touchKey;
          b.consecTouches = isSame ? b.consecTouches + 1 : 1;
        }
      }
      return;
    }

    // DIVE CHECK: if ball is too far to reach by running, dive for it
    if (p.onGround && !p.diving && p.diveCD <= 0 && b.vy > 0 && !mateReceiving) {
      const tToFloor = (FLOOR - b.y) / Math.max(0.1, b.vy);
      const landingX = b.x + b.vx * tToFloor * 0.85;
      const distToLanding = landingX - p.x;
      const canReach = Math.abs(distToLanding) < 4 * tToFloor * 0.8;
      if (!canReach && Math.abs(distToLanding) < 170 && tToFloor < 28 && tToFloor > 3) {
        p.diving = true; p.diveDir = distToLanding > 0 ? 1 : -1; p.diveTimer = 22; p.diveCD = 600;
        p.actionState = 'bump'; p.actionTimer = 22; sfx.hit();
      }
    }

    // RECEIVE MODE: ball is incoming — move to receive, stay grounded
    let predictX = b.x;
    if (b.vy > 0) {
      const tToFloor = (FLOOR - b.y) / Math.max(0.1, b.vy);
      predictX = b.x + b.vx * tToFloor * 0.8;
    }
    const clampedTarget = side === 1
      ? Math.max(COURT_LEFT + 15, Math.min(NET_X - 25, predictX))
      : Math.max(NET_X + 25, Math.min(COURT_RIGHT - 15, predictX));
    if (Math.abs(p.x - clampedTarget) > 8) {
      if (p.x < clampedTarget) p.vx = Math.min(p.vx + 0.45, 4);
      else p.vx = Math.max(p.vx - 0.45, -4);
    } else p.vx *= 0.7;
    p.x += p.vx;
    p.x = Math.max(lo, Math.min(hi, p.x));
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;
    // Bump or set when close (grounded only) — not if teammate is already receiving
    if (p.onGround && !mateReceiving && Math.hypot(b.x - p.x, b.y - (p.y - 40)) <= HIT_R) {
      const touchKey = `${side}-${botSlot}`;
      const isSame = touchKey === b.lastTouchKey;
      if (isSame && b.consecTouches >= 2) return;
      if (b.spike && b.last !== side) return;
      const dir = side === 1 ? 1 : -1;
      const distToNet = Math.abs(b.x - NET_X);
      const isActiveNearNet = Math.abs(team[activeSlot].x - NET_X) < 180;
      const teamLosing = side === 1 ? s.s1 < s.s2 : s.s2 < s.s1;
      let tmType = 'bump';
      if (b.spike || b.y < FLOOR - 100) tmType = 'bump';
      else if (distToNet > 120 && isActiveNearNet && !(teamLosing && Math.random() < 0.5)) tmType = 'set';
      if (s.serveFirstCross && !s.serveReturned) tmType = 'bump';
      recordHit(s, side, botSlot, tmType, b);
      if (b.spike || b.y < FLOOR - 100) {
        // Receive a spike — bump it up toward the active player
        const activeX = team[activeSlot].x;
        const bumpDir = activeX > p.x ? 1 : -1;
        b.vx = bumpDir * Math.min(5, Math.abs(activeX - p.x) * 0.02 + 2); b.vy = -16;
        b.last = side; b.spike = false; b.setter = side; b.isSet = false;
        p.actionState = 'bump'; p.actionTimer = 15; sfx.hit();
      } else if (distToNet > 120 && isActiveNearNet) {
        // Set up toward the active player near the net for a spike
        const activeX = team[activeSlot].x;
        const setDir = activeX > p.x ? 1 : -1;
        b.vx = setDir * 1.5; b.vy = -14;
        b.last = side; b.setter = side; b.spike = false; b.isSet = true;
        p.actionState = 'set'; p.actionTimer = 15; sfx.power();
      } else {
        // Just bump it over — lower arc, farther travel
        b.vx = dir * 6; b.vy = -13;
        b.last = side; b.spike = false; b.setter = side; b.isSet = false;
        p.actionState = 'bump'; p.actionTimer = 15; sfx.hit();
      }
      b.lastTouchKey = touchKey;
      b.consecTouches = isSame ? b.consecTouches + 1 : 1;
      registerTeamHit(s, side);
    }
  }

  // Maintain court spacing — bot mirrors teammate position to maximize coverage
  function maintainSpacing(p, teammate, lo, hi) {
    const courtMid = (lo + hi) / 2;
    let target = courtMid + (courtMid - teammate.x) * 0.5;
    target = Math.max(lo + 20, Math.min(hi - 20, target));
    const minDist = 140;
    if (Math.abs(target - teammate.x) < minDist) {
      target = teammate.x + (teammate.x < courtMid ? minDist : -minDist);
      target = Math.max(lo + 20, Math.min(hi - 20, target));
    }
    if (p.x < target - 6) p.vx = Math.min(p.vx + 0.35, 3.5);
    else if (p.x > target + 6) p.vx = Math.max(p.vx - 0.35, -3.5);
    else p.vx *= 0.7;
    p.x += p.vx;
    p.x = Math.max(lo, Math.min(hi, p.x));
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;
  }

  // CPU team — plays as a real team: receives serves/spikes, sets near the net,
  // steps aside for the attacker, and dives for far balls.
  function cpuTeam(s, diff, is1v1) {
    const mult = DIFF_MUL[diff] || 1;
    const b = s.ball; const team = s.t2;
    const lo = NET_X + 16, hi = COURT_RIGHT;

    // Idle everyone when not in rally or ball is on opponent's side
    if (s.phase !== 'rally' || !b.alive) {
      if (is1v1) idlePlayer(team[0]);
      else { maintainSpacing(team[0], team[1], lo, hi); maintainSpacing(team[1], team[0], lo, hi); }
      return;
    }
    if (!s.serveFirstCross && s.serverSide === 2) {
      if (is1v1) idlePlayer(team[0]);
      else { maintainSpacing(team[0], team[1], lo, hi); maintainSpacing(team[1], team[0], lo, hi); }
      return;
    }
    if (s.servingTeamLocked === 2) {
      if (is1v1) idlePlayer(team[0]);
      else { maintainSpacing(team[0], team[1], lo, hi); maintainSpacing(team[1], team[0], lo, hi); }
      return;
    }
    const onMySide = b.x > NET_X;
    if (!onMySide) {
      // 1v1: hold the middle of own half so we can reach both directions
      if (is1v1) { const t = (NET_X + COURT_RIGHT) / 2; moveTo(team[0], t, mult * 0.6); }
      else { maintainSpacing(team[0], team[1], lo, hi); maintainSpacing(team[1], team[0], lo, hi); }
      return;
    }

    // ── 1v1: set then bump over (2-touch combo), dive for far balls ──
    if (is1v1) {
      const p = team[0];

      // Dive for far balls
      tryCpuDive(s, p, 0, lo, hi, mult);

      const target = Math.max(lo, Math.min(hi, b.x));
      if (p.x < target - 6) p.vx = Math.min(p.vx + 0.5 * mult, 4 * mult);
      else if (p.x > target + 6) p.vx = Math.max(p.vx - 0.5 * mult, -4 * mult);
      else p.vx *= 0.7;
      p.x += p.vx; p.x = Math.max(lo, Math.min(hi, p.x));
      // Offline opponent bots intentionally use only bump returns. This keeps
      // their behavior readable and makes every offline volleyball mode follow
      // the same rule.
      const ballSetUp = false;
      if (p.onGround && ballSetUp && Math.abs(b.x - p.x) < 50) { p.vy = -15; p.onGround = false; p.jump = 30; }
      if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
      else if (p.jump > 0) p.jump--;
      if (p.diving) return; // dive handles its own hit
      if (Math.hypot(b.x - p.x, b.y - (p.y - 40)) <= HIT_R) {
        const touchKey = '2-0';
        const isSame = touchKey === b.lastTouchKey;
        if (isSame && b.consecTouches >= 2) return;
        if (b.spike && b.last !== 2) return;
        const c = charFor(p2Chars[0], p2Elements?.[0]);
        const ballHighAboveNet = b.y < NET_TOP - 20;
        const ballNearNet = Math.abs(b.x - NET_X) < 150;
        // 1v1: only set if the CPU set it themselves and will bump it after.
        // If the CPU already set (isSet, last=2), the NEXT touch must be a bump over.
        const cpuAlreadySet = b.isSet && b.last === 2 && b.setter === 2;
        if (false && !p.onGround && ballHighAboveNet && ballNearNet) {
          // Spike in the air (rare in 1v1 — only if ball is perfectly set near net)
          recordHit(s, 2, 0, 'spike', b);
          const Hvel = 10 + (c?.stats?.power || 5) * 0.3;
          b.vx = -Hvel; b.vy = 2; b.last = 2; b.spike = true; b.setter = null; b.isSet = false;
          p.actionState = 'spike'; p.actionTimer = 15;
          (b.last === 1 ? s.p1Spikes++ : s.p2Spikes++); s.shake = 14; sfx.superActivate();
        } else if (cpuAlreadySet) {
          // CPU set earlier — now bump it over
          recordHit(s, 2, 0, 'bump', b);
          b.vx = -5; b.vy = -16; b.last = 2; b.setter = 2; b.spike = false; b.isSet = false;
          p.actionState = 'bump'; p.actionTimer = 15; sfx.hit();
        } else if (false && !(s.serveFirstCross && !s.serveReturned) && p.onGround && b.y < FLOOR - 130 && Math.abs(b.x - NET_X) > 100 && Math.random() < (s.s2 < s.s1 ? 0.2 : 0.35) * mult) {
          // Set the ball up — will bump it over when it comes down
          recordHit(s, 2, 0, 'set', b);
          b.vx = 1.5; b.vy = -14; b.last = 2; b.setter = 2; b.spike = false; b.isSet = true;
          p.actionState = 'set'; p.actionTimer = 15; sfx.power();
        } else if (p.onGround) {
          // Bump it over — lower arc, farther travel
          recordHit(s, 2, 0, 'bump', b);
          b.vx = -7; b.vy = -13; b.last = 2; b.setter = 2; b.spike = false; b.isSet = false;
          p.actionState = 'bump'; p.actionTimer = 15; sfx.hit();
        } else { return; }
        b.lastTouchKey = touchKey;
        b.consecTouches = isSame ? b.consecTouches + 1 : 1;
      }
      return;
    }

    // ── 2v2: handler chases the ball, supporter maintains spacing ──
    const ballSet = false;
    let predictX = b.x;
    if (b.vy > 0) { const t = (FLOOR - b.y) / Math.max(0.1, b.vy); predictX = b.x + b.vx * t * 0.8; }
    const refX = ballSet ? b.x : predictX;
    const handler = Math.abs(team[0].x - refX) <= Math.abs(team[1].x - refX) ? 0 : 1;
    s.active2 = handler; // visual indicator
    cpuBotIndividual(s, handler, 1 - handler, mult, p2Chars, true);
    cpuBotIndividual(s, 1 - handler, handler, mult, p2Chars, false);
  }

  // Controls a single CPU bot — the HANDLER chases and plays the ball; the
  // SUPPORTER maintains spacing but can still spike a set or dive in emergencies.
  function cpuBotIndividual(s, botIdx, mateIdx, mult, chars, isHandler = true) {
    const team = s.t2;
    const p = team[botIdx];
    const teammate = team[mateIdx];
    if (!p) return;
    const b = s.ball;
    const lo = NET_X + 16, hi = COURT_RIGHT;

    if (p.diving) return; // dive is processed in the main loop

    // Not in play or ball on opponent's side → maintain spacing
    if (s.phase !== 'rally' || !b.alive) { maintainSpacing(p, teammate, lo, hi); return; }
    if (!s.serveFirstCross && s.serverSide === 2) { maintainSpacing(p, teammate, lo, hi); return; }
    if (s.servingTeamLocked === 2) { maintainSpacing(p, teammate, lo, hi); return; }
    const onMySide = b.x > NET_X;
    if (!onMySide) { maintainSpacing(p, teammate, lo, hi); return; }

    const myDist = Math.abs(b.x - p.x);
    const mateDist = Math.abs(b.x - teammate.x);
    const mateReceiving = mateDist < 75 && Math.abs(b.y - (teammate.y - 40)) < 170 && b.last !== 2;

    // SPIKE MODE: ball is set by our team — the closer bot goes to spike
    const ballWasSet = false;
    if (ballWasSet && !mateReceiving && myDist <= mateDist) {
      let spikeX = b.x;
      if (b.vy > 0) {
        const tToSpike = (NET_TOP - b.y) / Math.max(0.1, b.vy);
        spikeX = b.x + b.vx * tToSpike * 0.5;
      }
      const clampedSpike = Math.max(NET_X + 20, Math.min(COURT_RIGHT - 15, spikeX));
      if (p.x < clampedSpike - 6) p.vx = Math.min(p.vx + 0.6 * mult, 5.5);
      else if (p.x > clampedSpike + 6) p.vx = Math.max(p.vx - 0.6 * mult, -5.5);
      else p.vx *= 0.7;
      p.x += p.vx; p.x = Math.max(lo, Math.min(hi, p.x));
      if (p.onGround && Math.abs(b.x - p.x) < 45 && b.y < NET_TOP + 30 && b.y > NET_TOP - 80) {
        p.vy = -15; p.onGround = false; p.jump = 30; p.doubleJumped = false;
      } else if (!p.onGround && !p.doubleJumped && b.y < p.y - 50 && Math.abs(b.x - p.x) < 50) {
        p.vy = -4.5; p.doubleJumped = true; p.jump = 15;
      }
      if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
      else if (p.jump > 0) p.jump--;
      if (!p.onGround && Math.hypot(b.x - p.x, b.y - (p.y - 40)) <= HIT_R) {
        const touchKey = `2-${botIdx}`;
        const isSame = touchKey === b.lastTouchKey;
        if (!(isSame && b.consecTouches >= 2)) {
          const c = charFor(chars[botIdx], p2Elements?.[botIdx]);
          const Hvel = 10 + (c?.stats?.power || 5) * 0.3;
          b.vx = -Hvel; b.vy = 2; b.last = 2; b.spike = true; b.setter = null; b.isSet = false;
          p.actionState = 'spike'; p.actionTimer = 15;
          (b.last === 1 ? s.p1Spikes++ : s.p2Spikes++); s.shake = 14; sfx.superActivate();
          b.lastTouchKey = touchKey;
          b.consecTouches = isSame ? b.consecTouches + 1 : 1;
        }
      }
      return;
    }

    // DIVE CHECK: ball too far to reach by running → dive for it (last resort)
    if (p.onGround && !p.diving && p.diveCD <= 0 && b.vy > 0 && !mateReceiving) {
      const tToFloor = (FLOOR - b.y) / Math.max(0.1, b.vy);
      const landingX = b.x + b.vx * tToFloor * 0.85;
      const distToLanding = landingX - p.x;
      const canReach = Math.abs(distToLanding) < 4.5 * mult * tToFloor * 1.0;
      if (!canReach && Math.abs(distToLanding) < 170 && tToFloor < 28 && tToFloor > 3) {
        p.diving = true; p.diveDir = distToLanding > 0 ? 1 : -1; p.diveTimer = 22; p.diveCD = 600;
        p.actionState = 'bump'; p.actionTimer = 22; sfx.hit();
      }
    }

    // RECEIVE MODE: if not the handler, hold spacing — don't chase the ball.
    // Only the handler moves to receive; the supporter waits for a set to spike.
    if (!isHandler) { maintainSpacing(p, teammate, lo, hi); return; }

    // If teammate is clearly closer to the ball, maintain spacing
    if (mateDist < myDist - 30) { maintainSpacing(p, teammate, lo, hi); return; }

    // Move to predicted landing spot
    let predictX = b.x;
    if (b.vy > 0) {
      const tToFloor = (FLOOR - b.y) / Math.max(0.1, b.vy);
      predictX = b.x + b.vx * tToFloor * 0.8;
    }
    const clampedTarget = Math.max(NET_X + 25, Math.min(COURT_RIGHT - 15, predictX));
    if (Math.abs(p.x - clampedTarget) > 8) {
      if (p.x < clampedTarget) p.vx = Math.min(p.vx + 0.5 * mult, 4 * mult);
      else p.vx = Math.max(p.vx - 0.5 * mult, -4 * mult);
    } else p.vx *= 0.7;
    p.x += p.vx; p.x = Math.max(lo, Math.min(hi, p.x));
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;

    // Hit when close — bump up for spikes, set near net, otherwise bump over
    if (p.onGround && !mateReceiving && Math.hypot(b.x - p.x, b.y - (p.y - 40)) <= HIT_R) {
      const touchKey = `2-${botIdx}`;
      const isSame = touchKey === b.lastTouchKey;
      if (isSame && b.consecTouches >= 2) return;
      if (b.spike && b.last !== 2) return;
      const distToNet = Math.abs(b.x - NET_X);
      const losing = s.s2 < s.s1;
      const setChance = 0;
      const ciWillSet = false;
      recordHit(s, 2, botIdx, ciWillSet ? 'set' : 'bump', b);
      if (b.spike || b.y < FLOOR - 100) {
        // Receive a spike — bump it up toward the teammate
        const mateX = teammate.x;
        const bumpDir = mateX > p.x ? 1 : -1;
        b.vx = bumpDir * Math.min(5, Math.abs(mateX - p.x) * 0.02 + 2); b.vy = -16;
        b.last = 2; b.spike = false; b.setter = 2; b.isSet = false;
        p.actionState = 'bump'; p.actionTimer = 15; sfx.hit();
      } else if (ciWillSet) {
        // Set near the net so teammate can come and spike
        const mateX = teammate.x;
        const setDir = mateX > p.x ? 1 : -1;
        b.vx = setDir * 1.5; b.vy = -14;
        b.last = 2; b.setter = 2; b.spike = false; b.isSet = true;
        p.actionState = 'set'; p.actionTimer = 15; sfx.power();
      } else {
        // Too far from net — just bump it over (lower arc, farther)
        b.vx = -7; b.vy = -13; b.last = 2; b.setter = 2; b.spike = false; b.isSet = false;
        p.actionState = 'bump'; p.actionTimer = 15; sfx.hit();
      }
      b.lastTouchKey = touchKey;
      b.consecTouches = isSame ? b.consecTouches + 1 : 1;
      registerTeamHit(s, 2);
    }
  }

  // CPU dive — triggers when the ball is too far to reach by running
  function tryCpuDive(s, p, slot, lo, hi, mult) {
    const b = s.ball;
    if (p.diving || p.diveCD > 0 || !p.onGround) return;
    if (!b.alive || b.vy <= 0) return;
    const tToFloor = (FLOOR - b.y) / Math.max(0.1, b.vy);
    const landingX = b.x + b.vx * tToFloor * 0.85;
    const distToLanding = landingX - p.x;
    const canReach = Math.abs(distToLanding) < 4.5 * mult * tToFloor * 1.0;
    if (!canReach && Math.abs(distToLanding) < 170 && tToFloor < 28 && tToFloor > 3) {
      p.diving = true; p.diveDir = distToLanding > 0 ? 1 : -1; p.diveTimer = 22; p.diveCD = 600;
      p.actionState = 'bump'; p.actionTimer = 22; sfx.hit();
    }
  }

  // Simple move helper for CPU idle positioning
  function moveTo(p, target, speed) {
    if (p.x < target - 6) p.vx = Math.min(p.vx + 0.35, speed);
    else if (p.x > target + 6) p.vx = Math.max(p.vx - 0.35, -speed);
    else p.vx *= 0.7;
    p.x += p.vx;
    if (!p.onGround) { p.vy += 0.5; p.y += p.vy; if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; p.jump = 0; p.doubleJumped = false; } }
    else if (p.jump > 0) p.jump--;
  }

  // Records a per-character stat for a hit. Called BEFORE the ball is
  // modified so incoming-spike "receive" detection works. Also tracks the
  // setter slot so a following spike credits an assist.
  function recordHit(s, side, slot, type, b) {
    const receiving = (type === 'bump' || type === 'dig') && !!b.spike && b.last !== side;
    if (type === 'bump') { addStat(s, side, slot, 'bumps'); if (receiving) addStat(s, side, slot, 'receives'); }
    else if (type === 'dig') { addStat(s, side, slot, 'digs'); if (receiving) addStat(s, side, slot, 'receives'); }
    else if (type === 'set') { addStat(s, side, slot, 'sets'); b.setterSlot = `${side}-${slot}`; }
    else if (type === 'spike') {
      addStat(s, side, slot, 'spikes');
      if (b.setterSlot && b.setterSlot.startsWith(`${side}-`) && b.setterSlot !== `${side}-${slot}`) {
        const setterSlot = parseInt(b.setterSlot.split('-')[1], 10);
        addStat(s, side, setterSlot, 'assists');
      }
      b.setterSlot = null;
    }
  }

  // Builds the per-character stat cards consumed by VolleyballMatchReview.
  function buildCharStats(s, side, chars, elements) {
    return chars.map((id, i) => {
      const c = charFor(id, elements?.[i]);
      const ps = s.playerStats[`${side}-${i}`] || newPlayerStats();
      return { name: c?.name || `P${side}`, color: c?.color, points: ps.points, assists: ps.assists, sets: ps.sets, spikes: ps.spikes, bumps: ps.bumps, receives: ps.receives, digs: ps.digs };
    });
  }

  // Tracks consecutive hits by the same team. Exceeding MAX_TEAM_HITS
  // awards the point to the opposing team (violation).
  function registerTeamHit(s, side) {
    const b = s.ball;
    if (s.serveFirstCross && !s.serveReturned) s.serveReturned = true;
    if (b.lastHitTeam === side) {
      b.teamHits = (b.teamHits || 0) + 1;
    } else {
      b.lastHitTeam = side;
      b.teamHits = 1;
    }
    if (b.teamHits > MAX_TEAM_HITS) {
      // Violation — other team gets the point
      score(s, side === 1 ? 2 : 1, true, null, null, 'Too many team hits!');
    }
  }

  function score(s, who, is1v1, p1Chars, p2Chars, reason = '') {
    if (!s.ball.alive) return;
    s.ball.alive = false;
    // Credit the point to the last toucher on the scoring side
    if (s.ball.lastTouchKey) {
      const [tSide, tSlot] = s.ball.lastTouchKey.split('-').map(Number);
      if (tSide === who) addStat(s, tSide, tSlot, 'points');
    }
    if (who === 1) s.s1++; else s.s2++;
    s.flashColor = who === 1 ? TEAM_COLOR_P1 : TEAM_COLOR_P2;
    if (is1v1) {
      const arr = who === 1 ? p1Chars : p2Chars;
      const name = (arr && arr[0] && charFor(arr[0])?.name) ? charFor(arr[0]).name.toUpperCase() : `P${who}`;
      s.flashMsg = `${name} POINT!`;
    } else {
      s.flashMsg = who === 1 ? 'BLUE TEAM POINT!' : 'RED TEAM POINT!';
    }
    s.flashReason = reason;
    s.pointFlash = 80;
    s.phase = 'point'; s.phaseTimer = 80;
    s.serverSide = who;
    sfx.coin();
    sfx.cheer();
  }

  function resetPositions(s, is1v1) {
    [1, 2].forEach(side => {
      const team = side === 1 ? s.t1 : s.t2;
      const slot = side === 1 ? s.serverSlot1 : s.serverSlot2;
      if (is1v1) {
        team[0].x = BACK_X[side]; team[0].y = FLOOR; team[0].vx = 0; team[0].vy = 0; team[0].onGround = true; team[0].jump = 0;
        team[0].actionState = 'idle'; team[0].actionTimer = 0; team[0].diving = false; team[0].diveTimer = 0;
      } else {
        team.forEach((p, i) => {
          p.x = i === slot ? BACK_X[side] : MID_X[side];
          p.y = FLOOR; p.vx = 0; p.vy = 0; p.onGround = true; p.jump = 0;
          p.actionState = 'idle'; p.actionTimer = 0; p.diving = false; p.diveTimer = 0;
        });
      }
    });
  }

  function setupServe(s) {
    const side = s.serverSide;
    const slot = side === 1 ? s.serverSlot1 : s.serverSlot2;
    s['active' + side] = slot;
    s.ball.alive = false;
    s.ball.spike = false; s.ball.isSet = false; s.ball.trail = []; s.ball.spin = 0;
    s.ball.lastTouchKey = null; s.ball.consecTouches = 0;
    s.ball.teamHits = 0; s.ball.lastHitTeam = 0;
    s.serveTossed = false; s.tossTimer = 0; s.serveFirstCross = false; s.servingTeamLocked = 0; s.serveReturned = false;
    s.phase = 'serve'; s.phaseTimer = 0;
  }

  // Suppress controller menu-nav for the entire match so the controller can't
  // pause or leave — only the mouse/trackpad (or keyboard Esc) can.
  useEffect(() => {
    window.__el6GameplayActive = true;
    return () => { window.__el6GameplayActive = false; };
  }, []);

  return (
    <div className="el6-match-viewport relative flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center px-2 py-1">
        <button onClick={onQuit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> QUIT</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">{paused ? '▶ RESUME' : '⏸ PAUSE (ESC)'}</button>
      </div>
      {paused && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 rounded-lg"><PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={onQuit} /></div>}
      <canvas ref={canvasRef} width={W} height={H} className="el6-match-canvas" />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg pointer-events-none">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
    </div>
  );
}

function draw(ctx, s, p1Chars, p2Chars, j1, j2, p2IsCPU, is1v1, equippedSkins, equippedAccessories) {
  const sx = (Math.random() - 0.5) * s.shake;
  const sy = (Math.random() - 0.5) * s.shake;
  ctx.save();
  ctx.translate(sx, sy);

  drawCourt(ctx);

  drawNet(ctx);

  // Ball
  if (s.ball.alive || s.phase === 'serve') {
    if (s.ball.trail.length > 0) {
      for (let i = 0; i < s.ball.trail.length; i++) {
        const t = s.ball.trail[i];
        ctx.globalAlpha = (i / s.ball.trail.length) * 0.3;
        ctx.fillStyle = '#FFEECC';
        ctx.beginPath(); ctx.arc(t.x, t.y, 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#FFEECC'; ctx.shadowColor = '#FFCC66'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save(); ctx.translate(s.ball.x, s.ball.y); ctx.rotate(s.ball.spin);
    ctx.strokeStyle = '#DDA044'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 7, i * (Math.PI * 2 / 3), i * (Math.PI * 2 / 3) + Math.PI * 0.4); ctx.stroke(); }
    ctx.restore();
    if (s.ball.spike) { ctx.strokeStyle = 'rgba(255,80,80,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 14, 0, Math.PI * 2); ctx.stroke(); }
  }

  drawTeamPlayer(ctx, s, s.t1, s.active1, p1Chars, j1, TEAM_COLOR_P1, 1, equippedSkins, equippedAccessories);
  drawTeamPlayer(ctx, s, s.t2, s.active2, p2Chars, j2, TEAM_COLOR_P2, 2, equippedSkins, equippedAccessories);

  // Controls bar — simpler, spaced out
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, 30);
  ctx.font = 'bold 11px Orbitron';
  ctx.textAlign = 'left'; ctx.fillStyle = TEAM_COLOR_P1;
  ctx.fillText('P1: ←→ Move  ↑ Jump  , Bump  . Set/Spike  / Switch(Super)  L+Dir Dive', 14, 20);
  if (p2IsCPU) {
    ctx.fillStyle = '#FF3333'; ctx.font = 'bold 10px Orbitron';
    ctx.fillText('ALTERNATE CONTROLS: W/A/S/D Move  X Bump  C Set/Spike  V Switch  F+Dir Dive', 14, 44);
  }
  if (!p2IsCPU) {
    ctx.textAlign = 'right'; ctx.fillStyle = TEAM_COLOR_P2;
    ctx.fillText('Dive F+Dir  Switch V  Set/Spike C  Bump X  Jump W  Move A/D :P2', W - 14, 20);
  }

  // Score HUD
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(W / 2 - 110, 36, 220, 50);
  ctx.textAlign = 'center';
  ctx.fillStyle = TEAM_COLOR_P1; ctx.font = 'bold 24px Orbitron'; ctx.fillText(s.s1, W / 2 - 48, 72);
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px Orbitron'; ctx.fillText(':', W / 2, 68);
  ctx.fillStyle = TEAM_COLOR_P2; ctx.font = 'bold 24px Orbitron'; ctx.fillText(s.s2, W / 2 + 48, 72);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = 'bold 8px Orbitron';
  ctx.fillText(s.suddenDeath ? 'DEUCE — WIN BY 2' : `FIRST TO ${WIN_POINTS}`, W / 2, 50);

  // Serve prompt
  if (s.phase === 'serve') {
    const side = s.serverSide;
    const slot = side === 1 ? s.serverSlot1 : s.serverSlot2;
    const name = (side === 1 ? p1Chars : p2Chars)[slot];
    const charName = charFor(name)?.name || `P${side}`;
    const key = (side === 1 || p2IsCPU) ? ',' : 'X';
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(W / 2 - 200, H / 2 - 20, 400, 40);
    ctx.fillStyle = side === 1 ? TEAM_COLOR_P1 : TEAM_COLOR_P2;
    ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
    if (!s.serveTossed) ctx.fillText(`${charName} — PRESS ${key} TO TOSS UP`, W / 2, H / 2 + 6);
    else ctx.fillText(`${charName} — PRESS ${key} TO SERVE!`, W / 2, H / 2 + 6);
  }

  if (s.phase === 'countdown' && s.countdownNum > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 90px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
    ctx.fillText(String(s.countdownNum), W / 2, H / 2 + 30);
    ctx.shadowBlur = 0;
  }

  if (s.pointFlash > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.4, s.pointFlash / 160)})`;
    ctx.fillRect(0, H / 2 - 50, W, 100);
    ctx.fillStyle = s.flashColor; ctx.font = 'bold 38px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = s.flashColor; ctx.shadowBlur = 20;
    ctx.fillText(s.flashMsg, W / 2, H / 2 + 4);
    ctx.shadowBlur = 0;
    if (s.flashReason) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '12px Rajdhani';
      ctx.fillText(s.flashReason, W / 2, H / 2 + 30);
    }
  }

  ctx.restore();
}

export function drawCourt(ctx) {
  // Arena background — deep blue with spotlight glow
  const grad = ctx.createRadialGradient(W / 2, 300, 100, W / 2, 300, 700);
  grad.addColorStop(0, '#2a3a5e'); grad.addColorStop(0.5, '#1a2540'); grad.addColorStop(1, '#080d1a');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Tiered bleachers
  for (let row = 0; row < 6; row++) {
    const y = 35 + row * 20;
    ctx.fillStyle = `rgba(45,55,85,${0.6 - row * 0.05})`;
    ctx.fillRect(15, y, W - 30, 16);
    // Seat backs
    ctx.fillStyle = `rgba(70,80,115,${0.3 - row * 0.03})`;
    for (let x = 22; x < W - 22; x += 22) { ctx.fillRect(x, y + 2, 16, 11); }
  }

  // Crowd specks — colorful dots in the stands
  for (let i = 0; i < 120; i++) {
    const x = 20 + (i * 47) % (W - 40);
    const y = 42 + (i * 13) % 100;
    ctx.fillStyle = ['#FF6644', '#4488FF', '#FFD700', '#44FF88', '#FF44AA', '#AA66FF'][i % 6];
    ctx.globalAlpha = 0.2;
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Advertising boards behind the court (professional touch)
  const adY = 165;
  ctx.fillStyle = '#111'; ctx.fillRect(15, adY, W - 30, 26);
  const adColors = ['#3577E8', '#E04646', '#FFD700', '#44AA44', '#AA66FF', '#FF8800'];
  const adSegW = (W - 30) / adColors.length;
  adColors.forEach((c, i) => {
    ctx.fillStyle = c; ctx.globalAlpha = 0.5;
    ctx.fillRect(15 + i * adSegW + 2, adY + 3, adSegW - 4, 20);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(['ELEMENT', 'VOLLEY', 'PRO', 'LEAGUE', 'CHAMP', 'ARENA'][i], 15 + i * adSegW + adSegW / 2, adY + 16);
  });

  // Court surface — professional glossy sport floor
  const floorGrad = ctx.createLinearGradient(0, FLOOR - 5, 0, H);
  floorGrad.addColorStop(0, '#e0b876'); floorGrad.addColorStop(0.5, '#c89a58'); floorGrad.addColorStop(1, '#a87a3a');
  ctx.fillStyle = floorGrad; ctx.fillRect(COURT_LEFT, FLOOR, COURT_RIGHT - COURT_LEFT, H - FLOOR);

  // Floor gloss highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(COURT_LEFT, FLOOR, COURT_RIGHT - COURT_LEFT, 15);

  // Floor plank lines
  ctx.strokeStyle = 'rgba(120,85,45,0.35)'; ctx.lineWidth = 1;
  for (let x = COURT_LEFT + 22; x < COURT_RIGHT; x += 44) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, H); ctx.stroke();
  }

  // Team-colored floor tints
  ctx.fillStyle = 'rgba(53,119,232,0.12)'; ctx.fillRect(COURT_LEFT, FLOOR, NET_X - COURT_LEFT, H - FLOOR);
  ctx.fillStyle = 'rgba(224,70,70,0.12)'; ctx.fillRect(NET_X, FLOOR, COURT_RIGHT - NET_X, H - FLOOR);

  // Court boundary lines (white, prominent, professional)
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(COURT_LEFT, FLOOR); ctx.lineTo(COURT_LEFT, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(COURT_RIGHT, FLOOR); ctx.lineTo(COURT_RIGHT, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(COURT_LEFT, FLOOR); ctx.lineTo(COURT_RIGHT, FLOOR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(COURT_LEFT, H - 4); ctx.lineTo(COURT_RIGHT, H - 4); ctx.stroke();

  // Center line under net
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(NET_X, FLOOR); ctx.lineTo(NET_X, H - 4); ctx.stroke();

  // Attack lines (3m from net)
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ATTACK_L, FLOOR); ctx.lineTo(ATTACK_L, H - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ATTACK_R, FLOOR); ctx.lineTo(ATTACK_R, H - 4); ctx.stroke();

  // Service zone arcs (professional court marking)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(COURT_LEFT, FLOOR + 50, 40, -Math.PI / 2, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(COURT_RIGHT, FLOOR + 50, 40, Math.PI, -Math.PI / 2); ctx.stroke();

  // Center circle on floor
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(NET_X, FLOOR, 50, 0, Math.PI); ctx.stroke();

  // Arena roof is now far above the screen (ROOF_Y < 0) — no visible beam;
  // the dotted boundary walls extend all the way up to meet it.

  // Dotted out-of-bounds at the BACK — left = blue team, right = red team
  // Raised to meet the roof so the ball bounces along the full wall height
  ctx.lineWidth = 2.5; ctx.setLineDash([12, 10]);
  ctx.shadowBlur = 5;
  ctx.strokeStyle = TEAM_COLOR_P1; ctx.shadowColor = TEAM_COLOR_P1;
  ctx.beginPath(); ctx.moveTo(COURT_LEFT, ROOF_Y); ctx.lineTo(COURT_LEFT, FLOOR); ctx.stroke();
  ctx.strokeStyle = TEAM_COLOR_P2; ctx.shadowColor = TEAM_COLOR_P2;
  ctx.beginPath(); ctx.moveTo(COURT_RIGHT, ROOF_Y); ctx.lineTo(COURT_RIGHT, FLOOR); ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur = 0;

  // Free zone labels
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
  ctx.fillText('BLUE', (COURT_LEFT + NET_X) / 2, FLOOR + 90);
  ctx.fillText('RED', (NET_X + COURT_RIGHT) / 2, FLOOR + 90);
}

function drawNet(ctx) {
  // Net poles
  ctx.fillStyle = '#222';
  ctx.fillRect(NET_X - NET_HALF_W - 4, NET_TOP - 12, 4, FLOOR - NET_TOP + 14);
  ctx.fillRect(NET_X + NET_HALF_W, NET_TOP - 12, 4, FLOOR - NET_TOP + 14);

  // Top white band
  ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 4;
  ctx.fillRect(NET_X - NET_HALF_W - 2, NET_TOP - 6, (NET_HALF_W + 2) * 2, 6);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#DD2233'; ctx.fillRect(NET_X - NET_HALF_W - 2, NET_TOP, (NET_HALF_W + 2) * 2, 2);

  // Mesh
  ctx.strokeStyle = 'rgba(245,245,255,0.55)'; ctx.lineWidth = 0.6;
  for (let x = NET_X - NET_HALF_W; x <= NET_X + NET_HALF_W; x += 3) { ctx.beginPath(); ctx.moveTo(x, NET_TOP); ctx.lineTo(x, FLOOR); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(245,245,255,0.35)';
  for (let y = NET_TOP + 8; y < FLOOR; y += 12) { ctx.beginPath(); ctx.moveTo(NET_X - NET_HALF_W, y); ctx.lineTo(NET_X + NET_HALF_W, y); ctx.stroke(); }
}

function drawTeamPlayer(ctx, s, team, active, ids, jersey, teamColor, side, equippedSkins, equippedAccessories) {
  team.forEach((p, i) => {
    if (!p) return;
    const charObj = charFor(ids[i]);
    if (!charObj) return;
    const isActive = i === active;
    let pose = 'idle';
    if (!p.onGround) pose = 'jumping';
    else if (p.actionState === 'bump' || p.actionState === 'spike' || p.actionState === 'set') pose = 'attacking';
    else if (Math.abs(p.vx) > 0.3) pose = 'moving';
    drawSportChar(ctx, p.x, p.y, charObj, {
      facing: side === 1 ? 1 : -1,
      frame: s.frame, scale: 1.05,
      jersey, sport: 'volleyball', teamColor,
      state: pose,
      equippedSkins, equippedAccessories,
    });
    if (p.actionState === 'set' && p.actionTimer > 0) {
      ctx.save(); ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y - 75, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    }
    const ny = p.y - 90;
    // Dive cooldown bar (above nametag)
    const dBarW = 52, dBarH = 4;
    const dBarX = p.x - dBarW / 2, dBarY = ny - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(dBarX - 1, dBarY - 1, dBarW + 2, dBarH + 2);
    const divePct = p.diveCD > 0 ? (1 - p.diveCD / 600) : 1;
    ctx.fillStyle = divePct >= 1 ? '#44FF88' : '#FFAA44';
    if (divePct >= 1) { ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 5; }
    ctx.fillRect(dBarX, dBarY, dBarW * divePct, dBarH);
    ctx.shadowBlur = 0;
    if (divePct >= 1) {
      ctx.fillStyle = '#44FF88'; ctx.font = 'bold 6px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText('DIVE', p.x, dBarY - 2);
    }
    if (p.diving) {
      ctx.strokeStyle = '#44FF88'; ctx.lineWidth = 2; ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 8;
      ctx.strokeRect(dBarX - 2, dBarY - 2, dBarW + 4, dBarH + 4);
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(p.x - 44, ny - 12, 88, 16);
    if (isActive) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('▶', p.x - 30, ny + 1); }
    ctx.fillStyle = isActive ? '#FFD700' : charObj.color;
    ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = isActive ? '#FFD700' : charObj.color; ctx.shadowBlur = 5;
    ctx.fillText(charObj.name.toUpperCase().slice(0, 11), p.x, ny + 1);
    ctx.shadowBlur = 0;
  });
}
