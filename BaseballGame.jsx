import React, { useRef, useEffect, useState } from 'react';
import { drawSportChar } from './sportDraw.jsx';
import { ALL_CHARS, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { applyElement } from './elements.js';
import { readGamepadInput } from './controllerProfiles.js';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { drawMinimap, drawOnDeck } from './baseballOverlay.jsx';
import GameIcon from "./GameIcon.jsx";

const charFor = (id, element) => {
  const c = ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
  if (!c) return null;
  if (element && element !== 'basic') return { ...c, stats: applyElement(c.stats || {}, element) };
  return c;
};

// ── Canvas ──
const W = 1100, H = 620;
const GROUND = 478;

// ── At-bat view (bigger characters + strike zone) ──
const PITCHER_X = 940;
const BATTER_X = 170;
const PLATE_X = 190;
const STRIKE_LEFT = PLATE_X - 44;
const STRIKE_RIGHT = PLATE_X + 44;
const STRIKE_TOP = GROUND - 112;
const STRIKE_BOT = GROUND - 14;
const SWING_WINDOW = 85;
const ATBAT_CHAR_SCALE = 1.4;
const BAT_HAND_Y = GROUND - 38; // bat at hand level, not head

// ── Birds-eye diamond (zoomed out via FIELD_SCALE) ──
const HOME = { x: 550, y: 540 };
const BASE1 = { x: 765, y: 390 };
const BASE2 = { x: 550, y: 245 };
const BASE3 = { x: 335, y: 390 };
const MOUND = { x: 550, y: 390 };
const BASES = [HOME, BASE1, BASE2, BASE3];
const DEEP_OUTFIELD = { x: 550, y: 95 };
const INFIELD_POS = { x: 550, y: 315 };
const FIELD_LEFT = 55, FIELD_RIGHT = 1045, FIELD_TOP = 45, FIELD_BOT = 585;
const WALL_RADIUS = 450;
const BASE_HALF = 15; // bigger bases (was 10)
const FIELD_SCALE = 0.48; // zoom out the field view (more zoomed out)

const INNINGS = 3;
const DIFF_MUL = { newcomer: 0.5, beginner: 0.6, easy: 0.7, amateur: 0.8, regular: 1, pro: 1.15, hard: 1.3, insane: 1.45, honored: 1.6 };

export default function BaseballGame({ p1Chars, p2Chars, p2IsCPU, difficulty, onResult, onQuit, p1Jersey = true, p2Jersey = true, musicVolume = 50, sfxVolume = 70, p1Elements = [], p2Elements = [], equippedSkins = {}, equippedAccessories = {}, p1TeamColor = TEAM_COLOR_P1, p2TeamColor = TEAM_COLOR_P2, settings = {}, lanConnection = null, lanRole = null, localScheme = null, remoteState = null, onStateExport = null, isOnlineHost = false }) {
  const canvasRef = useRef(null);
  // Merge bot cosmetics — bots get random accessories every match
  const _botIds = [];
  if (p2IsCPU) p2Chars.forEach(id => _botIds.push(id));
  const { equippedAccessories: mergedAccessories } = mergeBotCosmetics(equippedAccessories, {}, _botIds);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const keysRef = useRef({});
  const gpRef = useRef({ 0: {}, 1: {} });
  const gpPrevRef = useRef({ 0: {}, 1: {} });
  const st = useRef(null);
  const remoteKeysProc = useRef(false);
  const remoteStateRef = useRef(null);
  const onStateExportRef = useRef(null);
  useEffect(() => { remoteStateRef.current = remoteState; }, [remoteState]);
  useEffect(() => { onStateExportRef.current = onStateExport; }, [onStateExport]);

  if (!st.current) st.current = newGame();

  function newGame() {
    return {
      frame: 0, done: false, p2IsCPU,
      batting: 2, outs: 0, inning: 1, half: 1,
      ballCount: 0, strikeCount: 0, foulCount: 0, batterDone: false,
      runsP1: 0, runsP2: 0, inningRuns: 0,
      batterIdx: 0, bases: [null, null, null],
      phase: 'pitch', phaseTimer: 0,
      ball: { x: PITCHER_X, y: GROUND - 40, vx: 0, vy: 0, alive: false, curve: 0, curveDir: 'none', trail: [] },
      pitched: false, swung: false, swingResult: null, swingTimer: 0, swingPower: 0,
      fieldBall: { x: HOME.x, y: HOME.y, vx: 0, vy: 0, alive: false, heldBy: null, thrown: false, z: 0, vz: 0, bounced: false },
      fielders: [], controlledFielder: 0, nextFielder: 1,
      runners: [], runSpam: { sig: 0, power: 0 },
      message: '', msgT: 0, cheerTimer: 0, homerunFlash: 0,
      homerunLap: false, flyOut: false, playResolved: false, returningBall: false, returnThrowCd: 0,
      statsP1: { runs: 0, hits: 0, strikeouts: 0, pitched: 0 },
      statsP2: { runs: 0, hits: 0, strikeouts: 0, pitched: 0 },
      cpuPitchCd: 0, cpuBatCd: 0, cpuFieldCd: 0, cpuRunCd: 0,
      p1TeamColor, p2TeamColor,
      };
  }

  function setupFielders(s) {
    s.fielders = [
      { x: MOUND.x, y: MOUND.y, baseX: MOUND.x, baseY: MOUND.y, charIdx: 0, role: 'pitcher', moving: false, lastX: MOUND.x, lastY: MOUND.y },
      { x: INFIELD_POS.x, y: INFIELD_POS.y, baseX: INFIELD_POS.x, baseY: INFIELD_POS.y, charIdx: 1, role: 'infield', moving: false, lastX: INFIELD_POS.x, lastY: INFIELD_POS.y },
      { x: DEEP_OUTFIELD.x, y: DEEP_OUTFIELD.y, baseX: DEEP_OUTFIELD.x, baseY: DEEP_OUTFIELD.y, charIdx: 2, role: 'outfield', moving: false, lastX: DEEP_OUTFIELD.x, lastY: DEEP_OUTFIELD.y },
    ];
    s.controlledFielder = 0; s.nextFielder = 1;
  }

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 800); return () => clearTimeout(t); }
    setStarted(true); setupFielders(st.current);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  // ── Input ──
  useEffect(() => {
    if (!started) return;
    const getPitcherChar = (s) => {
      const def = s.batting === 2 ? p1Chars : p2Chars;
      const el = s.batting === 2 ? p1Elements : p2Elements;
      return charFor(def[0], el?.[0]);
    };
    const getBatterChar = (s) => {
      const bat = s.batting === 2 ? p2Chars : p1Chars;
      const el = s.batting === 2 ? p2Elements : p1Elements;
      return charFor(bat[s.batterIdx], el?.[s.batterIdx]);
    };

    const doPitch = (side) => {
      const s = st.current;
      if (s.phase !== 'pitch') return;
      const defenseSide = s.batting === 2 ? 1 : 2; // the side that is NOT batting
      if (side !== defenseSide) return; // wrong side trying to pitch
      if (defenseSide === 2 && p2IsCPU) return; // CPU auto-pitches in update loop
      const pitcher = getPitcherChar(s);
      const power = pitcher?.stats?.power || 5;
      const baseSpeed = -(9 + power * 0.35);
      s.ball.alive = true; s.ball.x = PITCHER_X; s.ball.y = GROUND - 52;
      s.ball.vx = baseSpeed; s.ball.vy = 0; s.ball.curve = 0; s.ball.curveDir = 'none'; s.ball.trail = [];
      s.ball.everInZone = false;
      s.pitched = true; s.swung = false; s.swingResult = null; s.swingTimer = 0;
      s.phase = 'pitched'; s.phaseTimer = 0; s.cpuBatCd = 0;
      sfx.power();
    };

    const doSwing = () => {
      const s = st.current;
      if (s.phase !== 'pitched' || s.swung) return;
      s.swung = true; s.swingTimer = 18; sfx.hit();
      const batter = getBatterChar(s);
      const utility = batter?.stats?.utility || 5;
      const power = batter?.stats?.power || 5;
      const inBox = s.ball.x >= STRIKE_LEFT && s.ball.x <= STRIKE_RIGHT &&
                    s.ball.y >= STRIKE_TOP && s.ball.y <= STRIKE_BOT;
      if (!inBox) {
        const off = Math.abs(s.ball.x - PLATE_X);
        if (off > SWING_WINDOW) { resolveSwing(s, 'strike'); return; }
        resolveSwing(s, 'foul'); return;
      }
      // Physics-based hit — no predetermined type
      const cx = (STRIKE_LEFT + STRIKE_RIGHT) / 2;
      const cy = (STRIKE_TOP + STRIKE_BOT) / 2;
      const centered = 1 - Math.max(Math.abs(s.ball.x - cx) / 44, Math.abs(s.ball.y - cy) / 49);
      const quality = centered * (0.6 + utility * 0.08);
      const hitPower = quality * (0.5 + power * 0.1);
      s.swingPower = hitPower;
      if (quality < 0.15) { resolveSwing(s, 'foul'); return; }
      // Launch the ball — physics will determine the result
      s[`${s.batting === 1 ? 'statsP1' : 'statsP2'}`].hits++;
      startFielding(s, hitPower);
    };

    const doBunt = () => {
      const s = st.current;
      if (s.phase !== 'pitched' || s.swung) return;
      const inBox = s.ball.x >= STRIKE_LEFT && s.ball.x <= STRIKE_RIGHT &&
                    s.ball.y >= STRIKE_TOP && s.ball.y <= STRIKE_BOT;
      if (!inBox) {
        const off = Math.abs(s.ball.x - PLATE_X);
        if (off > SWING_WINDOW) { resolveSwing(s, 'strike'); return; }
        resolveSwing(s, 'foul'); return;
      }
      s.swung = true; s.swingTimer = 12; sfx.hit();
      s[`${s.batting === 1 ? 'statsP1' : 'statsP2'}`].hits++;
      startFielding(s, 0.05, true);
    };

    const doThrow = () => {
      const s = st.current;
      if (s.phase !== 'fielding') return;
      if (!s.fieldBall.alive || s.fieldBall.heldBy !== s.controlledFielder) return;
      let target = s.fielders[s.nextFielder];
      if (!target) return;
      // Ensure next fielder is different from controlled fielder — auto-fix if needed
      if (s.nextFielder === s.controlledFielder) {
        for (let i = 0; i < s.fielders.length; i++) {
          if (i !== s.controlledFielder) { s.nextFielder = i; break; }
        }
        if (s.nextFielder === s.controlledFielder) return;
        target = s.fielders[s.nextFielder];
      }
      const thrower = charFor(
        (s.batting === 2 ? p1Chars : p2Chars)[s.fielders[s.controlledFielder].charIdx],
        (s.batting === 2 ? p1Elements : p2Elements)?.[s.fielders[s.controlledFielder].charIdx]
      );
      const power = thrower?.stats?.power || 5;
      const dx = target.x - s.fieldBall.x, dy = target.y - s.fieldBall.y;
      const dist = Math.hypot(dx, dy);
      const speed = 6 + power * 0.6;
      s.fieldBall.vx = (dx / dist) * speed;
      s.fieldBall.vy = (dy / dist) * speed;
      s.fieldBall.vz = 3.0;
      s.fieldBall.heldBy = null; s.fieldBall.thrown = true; s.fieldBall.trail = [];
      sfx.hit();
    };

    const cycleNext = () => {
      const s = st.current;
      if (s.phase !== 'fielding') return;
      s.nextFielder = (s.nextFielder + 1) % s.fielders.length;
      if (s.nextFielder === s.controlledFielder) s.nextFielder = (s.nextFielder + 1) % s.fielders.length;
      sfx.hit();
    };

    const switchControl = () => {
      const s = st.current;
      if (s.phase !== 'fielding') return;
      s.controlledFielder = s.nextFielder;
      s.nextFielder = (s.controlledFielder + 1) % s.fielders.length;
      sfx.power();
    };

    const runAdvance = () => {
      const s = st.current;
      if (s.phase !== 'fielding' || s.homerunLap) return;
      s.runSpam.sig++;
      // Boost existing runners
      s.runners.forEach(r => { if (!r.retreating && !r.atBase) r.runBoost = Math.min((r.runBoost || 0) + 0.5, 3); });
      // Wake up runners standing at a base
      s.runners.forEach(r => { if (r.atBase) { r.atBase = false; r.targetBase = Math.floor(r.baseProgress) + 1; r.runBoost = 1; } });
      // Wake up base runners still in s.bases
      for (let i = 0; i < 3; i++) {
        if (s.bases[i] !== null) {
          const charIdx = s.bases[i]; s.bases[i] = null;
          s.runners.push({ charIdx, baseProgress: i + 1, targetBase: i + 2, atBase: false, retreating: false, runBoost: 1, speed: 0 });
        }
      }
    };
    const runRetreat = () => {
      const s = st.current;
      if (s.phase !== 'fielding' || s.homerunLap) return;
      s.runSpam.power++;
      s.runners.forEach(r => { if (!r.atBase && r.targetBase > 0) r.retreating = true; });
    };

    // Per-device scheme: translate local keys to the role's native scheme before processing/relaying
    const BB_P1_TO_P2 = { 'arrowleft': 'a', 'arrowright': 'd', 'arrowup': 'w', 'arrowdown': 's', ',': 'v', '.': 'c', '/': 'x', ' ': 'v' };
    const BB_P2_TO_P1 = { 'a': 'arrowleft', 'd': 'arrowright', 'w': 'arrowup', 's': 'arrowdown', 'v': ',', 'c': '.', 'x': '/' };
    const resolveKey = (key) => {
      if (!lanConnection || remoteKeysProc.current) return key;
      const scheme = localScheme || (lanRole === 'host' ? 'p1' : 'p2');
      const toScheme = lanRole === 'host' ? 'p1' : 'p2';
      if (scheme === toScheme) return key;
      const kl = key.toLowerCase();
      if (scheme === 'p1' && toScheme === 'p2') return BB_P1_TO_P2[kl] || key;
      if (scheme === 'p2' && toScheme === 'p1') return BB_P2_TO_P1[kl] || key;
      return key;
    };
    const kd = e => {
      const rk = resolveKey(e.key);
      const k = rk.toLowerCase(); keysRef.current[k] = true;
      if (lanConnection && !remoteKeysProc.current) lanConnection.sendMessage({ type: 'key', key: rk, down: true });
      if (e.key === 'Escape') { if (started && !lanConnection && !remoteState && !onStateExport) setPaused(v => !v); else if (started) onQuit?.(); e.preventDefault(); return; }
      if (pausedRef.current) { e.preventDefault(); return; }
      if (['F5', 'F12'].includes(e.key)) return;
      const s = st.current;
      const humanBatting = s.batting === 1;  // P1 bats when batting===1
      const humanFielding = s.batting === 2; // P1 fields when batting===2

      // P1: , = pitch/swing/throw/switch (context-dependent), . = bunt / cycleNext / runRetreat
      if (k === ',' && humanFielding && s.phase === 'pitch') { doPitch(1); e.preventDefault(); return; }
      if (k === ',' && humanBatting && s.phase === 'pitched') { doSwing(); e.preventDefault(); return; }
      if (k === ',' && humanFielding && s.phase === 'fielding') {
        if (s.fieldBall.heldBy === s.controlledFielder) doThrow();
        e.preventDefault(); return;
      }
      if (k === '/' && humanFielding && s.phase === 'fielding') { switchControl(); e.preventDefault(); return; }
      if (k === ',' && humanBatting && s.phase === 'fielding') { runAdvance(); e.preventDefault(); return; }
      if (k === '.' && humanBatting && s.phase === 'pitched') { doBunt(); e.preventDefault(); return; }
      if (k === '.' && humanFielding && s.phase === 'fielding') { cycleNext(); e.preventDefault(); return; }
      if (k === '.' && humanBatting && s.phase === 'fielding') { runRetreat(); e.preventDefault(); return; }
      if (k === ' ' && humanBatting && s.phase === 'pitched') { doSwing(); e.preventDefault(); return; }

      // P2 controls (human when not CPU): v = pitch/swing/throw/switch, c = bunt / cycleNext / runRetreat
      if (!p2IsCPU) {
        const p2Batting = s.batting === 2;
        const p2Fielding = s.batting === 1;
        if (k === 'v' && p2Fielding && s.phase === 'pitch') { doPitch(2); e.preventDefault(); return; }
        if (k === 'v' && p2Batting && s.phase === 'pitched') { doSwing(); e.preventDefault(); return; }
        if (k === 'v' && p2Fielding && s.phase === 'fielding') {
          if (s.fieldBall.heldBy === s.controlledFielder) doThrow();
          e.preventDefault(); return;
        }
        if (k === 'x' && p2Fielding && s.phase === 'fielding') { switchControl(); e.preventDefault(); return; }
        if (k === 'v' && p2Batting && s.phase === 'fielding') { runAdvance(); e.preventDefault(); return; }
        if (k === 'c' && p2Batting && s.phase === 'pitched') { doBunt(); e.preventDefault(); return; }
        if (k === 'c' && p2Fielding && s.phase === 'fielding') { cycleNext(); e.preventDefault(); return; }
        if (k === 'c' && p2Batting && s.phase === 'fielding') { runRetreat(); e.preventDefault(); return; }
      }
      e.preventDefault();
    };
    const ku = e => { const rk = resolveKey(e.key); keysRef.current[rk.toLowerCase()] = false; if (lanConnection && !remoteKeysProc.current) lanConnection.sendMessage({ type: 'key', key: rk, down: false }); };
    if (lanConnection) {
      lanConnection.onMessage((msg) => {
        if (!msg) return;
        if (msg.type === 'key') {
          remoteKeysProc.current = true;
          if (msg.down) kd({ key: msg.key, preventDefault() {} }); else ku({ key: msg.key });
          remoteKeysProc.current = false;
        } else if (msg.type === 'hit') {
          const s = st.current;
          if (s && s.fieldBall) {
            s.fieldBall.x = msg.x; s.fieldBall.y = msg.y; s.fieldBall.vx = msg.vx; s.fieldBall.vy = msg.vy; s.fieldBall.vz = msg.vz; s.fieldBall.hitPower = msg.hitPower;
            s.fieldBall.bounced = false; s.fieldBall.thrown = false; s.fieldBall.trail = [];
          }
        }
      });
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    // Gamepad polling — merge movement into gpRef, edge-detect action buttons.
    // Mapping: sig (light) → pitch/swing/throw/runAdvance (the "," / "v" action),
    //          heavy → bunt/cycleNext/runRetreat (the "." / "c" action),
    //          power → switchControl (the "/" / "x" action).
    const gpEnabled = settings?.controllerEnabled !== false;
    let gpRaf;
    const pollGamepad = () => {
      if (gpEnabled) {
        for (const slot of [0, 1]) {
          const gp = readGamepadInput(slot);
          gpRef.current[slot] = gp || {};
          if (gp) {
            const prev = gpPrevRef.current[slot] || {};
            // P1 = slot 0, P2 = slot 1 (slot 1 acts as P1 alt when vs CPU)
            const side = (p2IsCPU && slot === 1) ? 1 : (slot === 0 ? 1 : 2);
            const s = st.current;
            const humanBatting = s.batting === 1;
            const humanFielding = s.batting === 2;
            const p1Active = side === 1;
            const p2Active = side === 2 && !p2IsCPU;
            // sig → pitch/swing/throw/runAdvance (context-dependent, matches "," / "v")
            if (gp.sig && !prev.sig) {
              if (p1Active) {
                if (humanFielding && s.phase === 'pitch') doPitch(1);
                else if (humanBatting && s.phase === 'pitched') doSwing();
                else if (humanFielding && s.phase === 'fielding') { if (s.fieldBall.heldBy === s.controlledFielder) doThrow(); }
                else if (humanBatting && s.phase === 'fielding') runAdvance();
              } else if (p2Active) {
                const p2Batting = s.batting === 2;
                const p2Fielding = s.batting === 1;
                if (p2Fielding && s.phase === 'pitch') doPitch(2);
                else if (p2Batting && s.phase === 'pitched') doSwing();
                else if (p2Fielding && s.phase === 'fielding') { if (s.fieldBall.heldBy === s.controlledFielder) doThrow(); }
                else if (p2Batting && s.phase === 'fielding') runAdvance();
              }
            }
            // heavy → bunt/cycleNext/runRetreat (matches "." / "c")
            if (gp.heavy && !prev.heavy) {
              if (p1Active) {
                if (humanBatting && s.phase === 'pitched') doBunt();
                else if (humanFielding && s.phase === 'fielding') cycleNext();
                else if (humanBatting && s.phase === 'fielding') runRetreat();
              } else if (p2Active) {
                const p2Batting = s.batting === 2;
                const p2Fielding = s.batting === 1;
                if (p2Batting && s.phase === 'pitched') doBunt();
                else if (p2Fielding && s.phase === 'fielding') cycleNext();
                else if (p2Batting && s.phase === 'fielding') runRetreat();
              }
            }
            // power → switchControl (matches "/" / "x")
            if (gp.power && !prev.power) {
              if (p1Active && humanFielding && s.phase === 'fielding') switchControl();
              else if (p2Active && s.batting === 1 && s.phase === 'fielding') switchControl();
            }
          }
          gpPrevRef.current[slot] = gp ? { sig: gp.sig, heavy: gp.heavy, power: gp.power } : {};
        }
      }
      gpRaf = requestAnimationFrame(pollGamepad);
    };
    if (gpEnabled) gpRaf = requestAnimationFrame(pollGamepad);

    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); if (gpRaf) cancelAnimationFrame(gpRaf); };
  }, [started, p2IsCPU, p1Chars, p2Chars, p1Elements, p2Elements, onQuit, settings?.controllerEnabled]);

  // ── Game loop ──
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const loop = () => {
      if (remoteStateRef.current) {
        st.current = remoteStateRef.current;
        draw(ctx, st.current, p1Chars, p2Chars, p1Jersey, p2Jersey, p1Elements, p2Elements, equippedSkins, mergedAccessories);
        raf = requestAnimationFrame(loop);
        return;
      }
      const s = st.current;
      if (pausedRef.current) { draw(ctx, s, p1Chars, p2Chars, p1Jersey, p2Jersey, p1Elements, p2Elements, equippedSkins, mergedAccessories); raf = requestAnimationFrame(loop); return; }
      s.frame++;
      const dt = 1/60;
      const mult = DIFF_MUL[difficulty] || 1;
      update(s, dt, mult);
      if (onStateExportRef.current) onStateExportRef.current(s);
      draw(ctx, s, p1Chars, p2Chars, p1Jersey, p2Jersey, p1Elements, p2Elements, equippedSkins, mergedAccessories);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, p1Chars, p2Chars, p1Jersey, p2Jersey, p1Elements, p2Elements, difficulty, equippedSkins, equippedAccessories, paused, lanConnection, remoteState, onStateExport]);

  // ── Update ──
  function update(s, dt, mult) {
    if (s.msgT > 0) s.msgT--;
    if (s.cheerTimer > 0) s.cheerTimer--;
    if (s.homerunFlash > 0) s.homerunFlash--;
    if (s.swingTimer > 0) s.swingTimer--;
    if (s.done) return;

    // CPU auto-pitch (when P1 is batting and P2 is CPU)
    if (s.phase === 'pitch' && s.batting === 1 && p2IsCPU) {
      s.cpuPitchCd += dt;
      if (s.cpuPitchCd > 0.9) { s.cpuPitchCd = 0; cpuPitch(s, mult); }
    }

    if (s.phase === 'pitched') {
      const gp1 = gpRef.current[0] || {};
      const gp2 = gpRef.current[1] || {};
      // Mid-flight curve from held keys (P1 pitching when P2 bats)
      if (s.batting === 2) {
        if (keysRef.current['arrowdown'] || gp1.down) s.ball.curveDir = 'down';
        else if (keysRef.current['arrowup'] || gp1.up) s.ball.curveDir = 'up';
        else if (keysRef.current['arrowleft'] || gp1.left) s.ball.curveDir = 'fast';
        else if (keysRef.current['arrowright'] || gp1.right) s.ball.curveDir = 'slow';
      }
      // P2 human pitching curve (when P1 bats and P2 is human)
      if (s.batting === 1 && !p2IsCPU) {
        if (keysRef.current['s'] || gp2.down) s.ball.curveDir = 'down';
        else if (keysRef.current['w'] || gp2.up) s.ball.curveDir = 'up';
        else if (keysRef.current['a'] || gp2.left) s.ball.curveDir = 'fast';
        else if (keysRef.current['d'] || gp2.right) s.ball.curveDir = 'slow';
      }
      // Stronger curves — harder to hit squarely
      if (s.ball.curveDir === 'down') s.ball.vy += 0.09;
      else if (s.ball.curveDir === 'up') s.ball.vy -= 0.08;
      else if (s.ball.curveDir === 'fast') s.ball.vx *= 1.007;
      else if (s.ball.curveDir === 'slow') s.ball.vx *= 0.993;
      s.ball.x += s.ball.vx; s.ball.y += s.ball.vy;
      s.ball.trail.push({ x: s.ball.x, y: s.ball.y });
      if (s.ball.trail.length > 10) s.ball.trail.shift();
      s.phaseTimer++;

      // Track if ball ever entered the strike zone during the pitch
      if (s.ball.x >= STRIKE_LEFT && s.ball.x <= STRIKE_RIGHT &&
          s.ball.y >= STRIKE_TOP && s.ball.y <= STRIKE_BOT) {
        s.ball.everInZone = true;
      }

      // Ball past batter → called strike (was in zone) or ball (never in zone)
      if (s.ball.x < PLATE_X - SWING_WINDOW - 30) {
        if (!s.swung) {
          resolveSwing(s, s.ball.everInZone ? 'strike' : 'ball');
        }
      }
      // CPU batter: count awareness — 2 strikes = protect (expand zone), 3 balls = selective (shrink zone)
      if (s.batting === 2 && p2IsCPU && !s.swung) {
        const twoStrikes = s.strikeCount >= 2;
        const threeBalls = s.ballCount >= 3;
        const expand = twoStrikes ? 12 : 0;
        const shrink = threeBalls ? 10 : 0;
        const inBox = s.ball.x >= STRIKE_LEFT - expand + shrink && s.ball.x <= STRIKE_RIGHT + expand - shrink &&
                      s.ball.y >= STRIKE_TOP - expand + shrink && s.ball.y <= STRIKE_BOT + expand - shrink;
        if (inBox) {
          s.cpuBatCd += dt;
          if (s.cpuBatCd > (twoStrikes ? 0.02 : 0.04)) { s.cpuBatCd = 0; cpuBat(s, mult); }
        }
      }
    }

    if (s.phase === 'fielding') { updateFielding(s, dt, mult); }
    if (s.phase === 'resolve') { s.phaseTimer -= dt; if (s.phaseTimer <= 0) afterResolve(s); }
    if (s.phase === 'change') { s.phaseTimer -= dt; if (s.phaseTimer <= 0) finishChangeSides(s); }
  }

  function cpuPitch(s, mult) {
    const pitcherChars = s.batting === 1 ? p2Chars : p1Chars;
    const pitcherEls = s.batting === 1 ? p2Elements : p1Elements;
    const pitcher = charFor(pitcherChars[0], pitcherEls?.[0]);
    const power = pitcher?.stats?.power || 5;
    const baseSpeed = -(9 + power * 0.35) * (0.9 + mult * 0.1);
    s.ball.alive = true; s.ball.x = PITCHER_X; s.ball.y = GROUND - 52;
    s.ball.vx = baseSpeed; s.ball.vy = 0; s.ball.trail = [];
    s.ball.everInZone = false;
    const curves = ['none', 'none', 'down', 'up', 'fast', 'slow'];
    s.ball.curveDir = curves[Math.floor(Math.random() * curves.length)];
    s.pitched = true; s.swung = false; s.swingResult = null; s.swingTimer = 0;
    s.phase = 'pitched'; s.phaseTimer = 0; s.cpuBatCd = 0;
    sfx.power();
  }

  function cpuBat(s, mult) {
    s.swung = true; s.swingTimer = 18; sfx.hit();
    const batterChars = s.batting === 2 ? p2Chars : p1Chars;
    const batterEls = s.batting === 2 ? p2Elements : p1Elements;
    const batter = charFor(batterChars[s.batterIdx], batterEls?.[s.batterIdx]);
    const utility = batter?.stats?.utility || 5;
    const power = batter?.stats?.power || 5;
    // Ball is in the box (checked before calling)
    const cx = (STRIKE_LEFT + STRIKE_RIGHT) / 2;
    const cy = (STRIKE_TOP + STRIKE_BOT) / 2;
    const centered = 1 - Math.max(Math.abs(s.ball.x - cx) / 44, Math.abs(s.ball.y - cy) / 49);
    // Quality with difficulty scaling + random variance (sometimes great, sometimes poor)
    const variance = (Math.random() - 0.5) * 0.15;
    const quality = Math.max(0.18, Math.min(1, centered * (0.6 + mult * 0.4) * (0.7 + utility * 0.06) + variance));
    const hitPower = quality * (0.5 + power * 0.1);
    s.swingPower = hitPower;
    if (quality < 0.15) { resolveSwing(s, 'foul'); return; }
    s[`${s.batting === 1 ? 'statsP1' : 'statsP2'}`].hits++;
    startFielding(s, hitPower);
  }

  function resolveSwing(s, result) {
    s.swingResult = result;
    const battingTeam = s.batting === 1 ? 'statsP1' : 'statsP2';
    if (result === 'strike') {
      s.strikeCount++;
      if (s.strikeCount >= 3) {
        s.outs++; s[battingTeam].strikeouts++;
        s.batterDone = true;
        s.message = 'STRIKE THREE! OUT'; s.msgT = 90;
        s.phase = 'resolve'; s.phaseTimer = 1.5;
      } else {
        s.batterDone = false;
        s.message = 'STRIKE ' + s.strikeCount; s.msgT = 50;
        s.phase = 'resolve'; s.phaseTimer = 0.8;
      }
      return;
    }
    if (result === 'ball') {
      s.ballCount++;
      if (s.ballCount >= 4) {
        walkBatter(s);
        s.message = 'WALK!'; s.msgT = 90;
        s.phase = 'resolve'; s.phaseTimer = 1.5;
      } else {
        s.batterDone = false;
        s.message = 'BALL ' + s.ballCount; s.msgT = 50;
        s.phase = 'resolve'; s.phaseTimer = 0.8;
      }
      return;
    }
    if (result === 'foul') {
      s.foulCount++;
      if (s.foulCount >= 3) {
        s.outs++;
        s.batterDone = true;
        s.message = 'FOUL OUT!'; s.msgT = 90;
        s.phase = 'resolve'; s.phaseTimer = 1.5;
      } else {
        s.batterDone = false;
        s.message = 'FOUL ' + s.foulCount; s.msgT = 60;
        s.phase = 'resolve'; s.phaseTimer = 1.0;
      }
      return;
    }
  }

  function walkBatter(s) {
    s.batterDone = true;
    // Forced advance — runner on 3rd scores if bases loaded
    if (s.bases[2] !== null && s.bases[1] !== null && s.bases[0] !== null) {
      scoreRuns(s, 1);
    }
    if (s.bases[1] !== null && s.bases[0] !== null) s.bases[2] = s.bases[1];
    if (s.bases[0] !== null) s.bases[1] = s.bases[0];
    s.bases[0] = s.batterIdx;
  }

  // Physics-based hit — no predetermined type. Ball trajectory is based on
  // hitPower and character stats. Only the batter becomes a runner; base
  // runners stay on their bases until the player advances them.
  function startFielding(s, hitPower, bunt = false) {
    setupFielders(s);
    s.batterDone = true;
    s.fieldBall = { x: HOME.x, y: HOME.y, vx: 0, vy: 0, alive: true, heldBy: null, thrown: false, z: 0, vz: 0, bounced: false, trail: [] };
    // Trajectory: bunts send the ball a very short distance; normal hits scale with hitPower
    const angle = bunt
      ? -Math.PI / 2 + (Math.random() - 0.5) * 0.8
      : -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = bunt ? 1.2 : (2 + hitPower * 4.5);
    const arc = bunt ? 0.4 : (0.5 + hitPower * 6);
    s.fieldBall.vx = Math.cos(angle) * speed;
    s.fieldBall.vy = Math.sin(angle) * speed;
    s.fieldBall.vz = arc;
    s.fieldBall.hitPower = bunt ? 0.05 : hitPower;
    if (lanConnection) {
      const _iAmBatting = (lanRole === 'host' && s.batting === 1) || (lanRole === 'guest' && s.batting === 2);
      if (_iAmBatting) lanConnection.sendMessage({ type: 'hit', x: s.fieldBall.x, y: s.fieldBall.y, vx: s.fieldBall.vx, vy: s.fieldBall.vy, vz: s.fieldBall.vz, hitPower: s.fieldBall.hitPower });
    }

    // Batter becomes a runner; forced advances push all base runners forward.
    // Bunts give the batter an immediate speed burst so they can beat the throw.
    const newRunners = [{ charIdx: s.batterIdx, baseProgress: 0, targetBase: 1, atBase: false, retreating: false, runBoost: bunt ? 3 : 0, speed: 0 }];
    for (let i = 0; i < 3; i++) {
      if (s.bases[i] !== null) {
        newRunners.push({ charIdx: s.bases[i], baseProgress: i + 1, targetBase: i + 2, atBase: false, retreating: false, runBoost: 0, speed: 0 });
        s.bases[i] = null;
      }
    }
    s.runners = newRunners;
    s.phase = 'fielding'; s.phaseTimer = 0;
    s.controlledFielder = 0; s.nextFielder = 1;
    s.homerunLap = false; s.flyOut = false; s.playResolved = false; s.returningBall = false; s.returnThrowCd = 0; s._returnTimer = 0;
    sfx.superActivate();
  }

  function updateFielding(s, dt, mult) {
    // ── Home run lap: runners auto-advance around all bases ──
    if (s.homerunLap) {
      const batChars = s.batting === 2 ? p2Chars : p1Chars;
      const batEls = s.batting === 2 ? p2Elements : p1Elements;
      s.runners.forEach(r => {
        const c = charFor(batChars[r.charIdx], batEls?.[r.charIdx]);
        const baseSpeed = 0.008 + (c?.stats?.speed || 5) * 0.0015;
        r.baseProgress += baseSpeed;
        if (r.baseProgress >= 4) { scoreRuns(s, 1); r.reached = true; }
      });
      s.runners = s.runners.filter(r => !r.reached);
      if (s.runners.length === 0) {
        s.phase = 'resolve'; s.phaseTimer = 1.5;
      }
      // Move fielders back toward base positions during lap
      s.fielders.forEach(f => {
        const dx = f.baseX - f.x, dy = f.baseY - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 2) { f.x += (dx / dist) * 2; f.y += (dy / dist) * 2; f.moving = true; }
        else f.moving = false;
      });
      return;
    }

    // ── Ball physics ──
    if (s.fieldBall.alive && s.fieldBall.heldBy === null) {
      s.fieldBall.x += s.fieldBall.vx;
      s.fieldBall.y += s.fieldBall.vy;
      s.fieldBall.z += s.fieldBall.vz;
      s.fieldBall.vz -= 0.12;
      if (s.fieldBall.z < 0) s.fieldBall.z = 0;
      s.fieldBall.vx *= 0.988; s.fieldBall.vy *= 0.988;
      s.fieldBall.trail.push({ x: s.fieldBall.x, y: s.fieldBall.y, z: s.fieldBall.z }); if (s.fieldBall.trail.length > 8) s.fieldBall.trail.shift();
      // Ball lands (first bounce)
      if (s.fieldBall.z <= 0 && !s.fieldBall.bounced && s.fieldBall.vz <= 0) {
        s.fieldBall.bounced = true; s.fieldBall.vz = 0;
        if (Math.hypot(s.fieldBall.vx, s.fieldBall.vy) < 0.6) { s.fieldBall.vx = 0; s.fieldBall.vy = 0; }
      }
      // Ball goes out of bounds ONLY for a home run — any ball past the wall
      const distFromMound = Math.hypot(s.fieldBall.x - MOUND.x, s.fieldBall.y - MOUND.y);
      if (distFromMound > WALL_RADIUS) {
        startHomerunLap(s);
        return;
      }
      // Fielder catch — fly out if caught in the air (before bouncing)
      if (s.fieldBall.z < 55 && s.fieldBall.z > 0 || (s.fieldBall.bounced && s.fieldBall.z < 10)) {
        for (let i = 0; i < s.fielders.length; i++) {
          const f = s.fielders[i];
          if (Math.hypot(f.x - s.fieldBall.x, f.y - s.fieldBall.y) < 30) {
            s.fieldBall.heldBy = i; s.fieldBall.vx = 0; s.fieldBall.vy = 0; s.fieldBall.z = 12; s.fieldBall.trail = [];
            sfx.coin();
            // Fly out: ball caught in the air before bouncing (only on the initial hit, not throws between fielders)
            if (!s.fieldBall.bounced && !s.fieldBall.thrown) {
              s.outs++;
              s.runners = s.runners.filter(r => r.charIdx !== s.batterIdx); // remove batter
              s.runners.forEach(r => { if (!r.atBase) r.retreating = true; }); // other runners retreat
              s.message = 'FLY OUT!'; s.msgT = 90; sfx.hit();
              s.flyOut = true; s.playResolved = true; s.returningBall = true;
            }
            break;
          }
        }
      }
    }

    // ── Move controlled fielder + walking animation ──
    const humanFielding = s.batting === 2;
    const gp1f = gpRef.current[0] || {};
    const gp2f = gpRef.current[1] || {};
    if (humanFielding) {
      const f = s.fielders[s.controlledFielder];
      if (f) {
        const sp = 1.5 + (charFor((s.batting === 2 ? p1Chars : p2Chars)[f.charIdx], (s.batting === 2 ? p1Elements : p2Elements)?.[f.charIdx])?.stats?.speed || 5) * 0.18;
        if (keysRef.current['arrowleft'] || gp1f.left) f.x -= sp;
        if (keysRef.current['arrowright'] || gp1f.right) f.x += sp;
        if (keysRef.current['arrowup'] || gp1f.up) f.y -= sp;
        if (keysRef.current['arrowdown'] || gp1f.down) f.y += sp;
        f.x = Math.max(FIELD_LEFT, Math.min(FIELD_RIGHT, f.x));
        f.y = Math.max(FIELD_TOP, Math.min(FIELD_BOT, f.y));
      }
    } else if (!p2IsCPU) {
      const f = s.fielders[s.controlledFielder];
      if (f) {
        const sp = 1.5 + (charFor((s.batting === 1 ? p2Chars : p1Chars)[f.charIdx], (s.batting === 1 ? p2Elements : p1Elements)?.[f.charIdx])?.stats?.speed || 5) * 0.18;
        if (keysRef.current['a'] || gp2f.left) f.x -= sp;
        if (keysRef.current['d'] || gp2f.right) f.x += sp;
        if (keysRef.current['w'] || gp2f.up) f.y -= sp;
        if (keysRef.current['s'] || gp2f.down) f.y += sp;
        f.x = Math.max(FIELD_LEFT, Math.min(FIELD_RIGHT, f.x));
        f.y = Math.max(FIELD_TOP, Math.min(FIELD_BOT, f.y));
      }
    } else { cpuField(s, mult); }

    // Track fielder movement for walking animation
    s.fielders.forEach(f => {
      f.moving = Math.hypot(f.x - f.lastX, f.y - f.lastY) > 0.5;
      f.lastX = f.x; f.lastY = f.y;
    });

    if (s.fieldBall.heldBy !== null) {
      const f = s.fielders[s.fieldBall.heldBy];
      s.fieldBall.x = f.x; s.fieldBall.y = f.y; s.fieldBall.z = 12;
    }

    // ── Move runners ──
    const batChars = s.batting === 2 ? p2Chars : p1Chars;
    const batEls = s.batting === 2 ? p2Elements : p1Elements;
    s.runners.forEach(r => {
      if (r.atBase) return; // stay at base
      const c = charFor(batChars[r.charIdx], batEls?.[r.charIdx]);
      const baseSpeed = 0.005 + (c?.stats?.speed || 5) * 0.001;
      const boost = (r.runBoost || 0) * 0.0012;
      r.runBoost = Math.max(0, (r.runBoost || 0) - 0.03);
      const dir = r.retreating ? -1 : 1;
      r.baseProgress += dir * (baseSpeed + boost);
      r.speed = dir * (baseSpeed + boost);
      // Reached target base going forward
      if (!r.retreating && r.baseProgress >= r.targetBase) {
        r.baseProgress = r.targetBase;
        const baseIdx = r.targetBase;
        const basePos = BASES[baseIdx];
        // Force out check
        for (let i = 0; i < s.fielders.length; i++) {
          if (s.fieldBall.heldBy === i && Math.hypot(s.fielders[i].x - basePos.x, s.fielders[i].y - basePos.y) < 30) {
            outRunner(s, r, 'FORCED OUT AT ' + baseIdx + '!'); return;
          }
        }
        if (r.targetBase >= 4) { scoreRuns(s, 1); r.reached = true; }
        else {
          // Force any runner already at this base to advance (chain reaction)
          s.runners.forEach(o => {
            if (o !== r && o.atBase && Math.floor(o.baseProgress) === r.targetBase) {
              o.atBase = false; o.targetBase = r.targetBase + 1; o.runBoost = 1;
            }
          });
          r.atBase = true; // safe — stay at this base
        }
      }
      // Retreat: reached previous base
      if (r.retreating && r.baseProgress <= (r.targetBase - 1)) {
        r.baseProgress = r.targetBase - 1; r.retreating = false;
        r.targetBase = r.targetBase - 1;
        r.atBase = true; // back at base
        if (r.targetBase <= 0) r.reached = true;
      }
    });

    // Tag out: fielder holding ball overlaps a runner (runners are always the
    // batting team; fielders are the fielding team — can't tag a teammate)
    if (s.fieldBall.heldBy !== null && !s.flyOut) {
      const f = s.fielders[s.fieldBall.heldBy];
      s.runners.forEach(r => {
        if (r.reached || r.atBase) return;
        const rp = runnerWorldPos(r);
        if (Math.hypot(f.x - rp.x, f.y - rp.y) < 18) outRunner(s, r, 'TAGGED OUT!');
      });
    }

    s.runners = s.runners.filter(r => !r.reached);

    // ── Check if play is resolved ──
    if (!s.playResolved) {
      const allDone = s.runners.every(r => r.atBase || r.reached);
      // Resolve when everyone is safe OR no runners remain (e.g., all scored) —
      // fixes the "home plate freeze" when every runner reaches home and the
      // ball is still loose in the outfield.
      if (allDone || s.runners.length === 0) {
        s.playResolved = true; s.returningBall = true;
      }
    }

    // ── Return ball to pitcher: play doesn't end until pitcher has ball on mound ──
    if (s.playResolved && s.returningBall) {
      s._returnTimer = (s._returnTimer || 0) + dt;
      // Safety timeout: force ball to pitcher after 5s to prevent softlock
      if (s._returnTimer > 5) {
        s.fieldBall.heldBy = 0; s.fieldBall.vx = 0; s.fieldBall.vy = 0; s.fieldBall.z = 12;
        s.phase = 'resolve'; s.phaseTimer = 0.5; s.message = 'PLAY'; s.msgT = 60;
      }
      // Store safe runners back in bases (only once) and CLEAR s.runners to
      // prevent the duplication glitch where a runner still in s.runners is
      // also drawn from s.bases after the play ends.
      if (s.runners.length > 0) {
        const newBases = [...s.bases];
        const stillRunning = [];
        s.runners.forEach(r => {
          if (r.atBase && r.targetBase >= 1 && r.targetBase <= 3) newBases[r.targetBase - 1] = r.charIdx;
          else stillRunning.push(r);
        });
        s.bases = newBases;
        s.runners = stillRunning;
        if (stillRunning.length > 0) { s.playResolved = false; s.returningBall = false; }
      }

      if (s.fieldBall.heldBy === null) {
        // Ball in air — if it's on the ground, nearest fielder picks it up
        if (s.fieldBall.bounced && s.fieldBall.z <= 0) {
          let closest = 0, closestD = Infinity;
          for (let i = 0; i < s.fielders.length; i++) {
            const d = Math.hypot(s.fielders[i].x - s.fieldBall.x, s.fielders[i].y - s.fieldBall.y);
            if (d < closestD) { closestD = d; closest = i; }
          }
          if (closestD < 25) {
            s.fieldBall.heldBy = closest; s.fieldBall.vx = 0; s.fieldBall.vy = 0; s.fieldBall.z = 12; sfx.coin();
          } else {
            const f = s.fielders[closest];
            const dx = s.fieldBall.x - f.x, dy = s.fieldBall.y - f.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 2) { f.x += (dx / dist) * 2.5; f.y += (dy / dist) * 2.5; }
          }
        }
      } else if (s.fieldBall.heldBy !== 0) {
        // Non-pitcher has ball — auto-throw to pitcher after short delay
        s.returnThrowCd += dt;
        if (s.returnThrowCd > 0.4) {
          s.returnThrowCd = 0;
          const pitcher = s.fielders[0];
          const dx = pitcher.x - s.fieldBall.x, dy = pitcher.y - s.fieldBall.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            const speed = 6;
            s.fieldBall.vx = (dx / dist) * speed; s.fieldBall.vy = (dy / dist) * speed;
            s.fieldBall.vz = 3.0; s.fieldBall.heldBy = null; s.fieldBall.thrown = true; sfx.hit();
          } else {
            s.fieldBall.heldBy = 0; // close enough, just give to pitcher
          }
        }
      } else {
        // Pitcher has the ball <GameIcon emoji="→" size={14} /> play ends immediately (no auto-walk back to mound)
        s.phase = 'resolve'; s.phaseTimer = 0.5;
        s.message = 'PLAY'; s.msgT = 60;
      }
    }

    // CPU base running
    if (p2IsCPU && s.batting === 2 && !s.homerunLap) cpuRun(s, dt, mult);
  }

  function startHomerunLap(s) {
    s.homerunLap = true; s.fieldBall.alive = false;
    s.cheerTimer = 180; s.homerunFlash = 120;
    s.message = 'HOME RUN SCORED!'; s.msgT = 200; sfx.cheer();
    // All runners (including batter) auto-advance around all bases
    // First, wake up any base runners
    for (let i = 0; i < 3; i++) {
      if (s.bases[i] !== null) {
        s.runners.push({ charIdx: s.bases[i], baseProgress: i + 1, targetBase: 4, atBase: false, retreating: false, runBoost: 0, speed: 0 });
        s.bases[i] = null;
      }
    }
    // Set all runners to target home (base 4) and auto-advance
    s.runners.forEach(r => { r.atBase = false; r.targetBase = 4; r.retreating = false; });
  }

  function cpuField(s, mult) {
    if (s.playResolved && s.returningBall) return;
    if (!s.fieldBall.alive || s.fieldBall.heldBy !== null) {
      if (s.fieldBall.heldBy !== null) {
        // Chase the nearest moving runner to tag them out
        const holder = s.fielders[s.fieldBall.heldBy];
        const movingRunners = s.runners.filter(r => !r.atBase && !r.reached);
        if (movingRunners.length > 0) {
          let closestR = null, closestD = Infinity;
          for (const r of movingRunners) {
            const rp = runnerWorldPos(r);
            const d = Math.hypot(holder.x - rp.x, holder.y - rp.y);
            if (d < closestD) { closestD = d; closestR = r; }
          }
          if (closestR && closestD > 16) {
            const rp = runnerWorldPos(closestR);
            const dx = rp.x - holder.x, dy = rp.y - holder.y;
            const dist = Math.hypot(dx, dy);
            const sp = 1.8 + mult * 0.6;
            holder.x += (dx / dist) * sp;
            holder.y += (dy / dist) * sp;
          }
        }
        s.cpuFieldCd += 1/60;
        if (s.cpuFieldCd > 0.6) { s.cpuFieldCd = 0; cpuThrowDecision(s, mult); }
      }
      return;
    }
    // Predict where the ball will land and move the closest fielder there
    let targetX = s.fieldBall.x, targetY = s.fieldBall.y;
    if (s.fieldBall.z > 0 && s.fieldBall.vz < 0) {
      const tToLand = s.fieldBall.z / Math.max(0.12, Math.abs(s.fieldBall.vz));
      targetX = s.fieldBall.x + s.fieldBall.vx * tToLand;
      targetY = s.fieldBall.y + s.fieldBall.vy * tToLand;
    }
    let closest = 0, closestD = Infinity;
    for (let i = 0; i < s.fielders.length; i++) {
      const d = Math.hypot(s.fielders[i].x - targetX, s.fielders[i].y - targetY);
      if (d < closestD) { closestD = d; closest = i; }
    }
    s.controlledFielder = closest;
    const f = s.fielders[closest];
    const dx = targetX - f.x, dy = targetY - f.y;
    const dist = Math.hypot(dx, dy);
    const sp = (1.8 + mult * 0.6);
    if (dist > 2) { f.x += (dx / dist) * sp; f.y += (dy / dist) * sp; }
  }

  function cpuThrowDecision(s, mult) {
    if (s.runners.length === 0 || s.playResolved) { s.playResolved = true; s.returningBall = true; return; }
    // All runners safe at bases <GameIcon emoji="→" size={14} /> return ball to pitcher
    const allSafe = s.runners.every(r => r.atBase);
    if (allSafe) { s.playResolved = true; s.returningBall = true; return; }
    // Find the lead runner (not at base, not reached)
    const movingRunners = s.runners.filter(r => !r.atBase && !r.reached);
    if (movingRunners.length === 0) { s.playResolved = true; s.returningBall = true; return; }
    const leadRunner = movingRunners.reduce((a, b) => a.baseProgress > b.baseProgress ? a : b);
    if (leadRunner.baseProgress >= 4) { scoreRuns(s, 1); leadRunner.reached = true; s.playResolved = true; s.returningBall = true; return; }
    // Throw to the fielder closest to the lead runner (excluding holder) so they can chase
    const rp = runnerWorldPos(leadRunner);
    let closest = -1, closestD = Infinity;
    for (let i = 0; i < s.fielders.length; i++) {
      if (i === s.fieldBall.heldBy) continue;
      const d = Math.hypot(s.fielders[i].x - rp.x, s.fielders[i].y - rp.y);
      if (d < closestD) { closestD = d; closest = i; }
    }
    if (closest === -1) { s.playResolved = true; s.returningBall = true; return; }
    const target = s.fielders[closest];
    const holder = s.fielders[s.fieldBall.heldBy];
    const thrower = charFor((s.batting === 1 ? p2Chars : p1Chars)[holder.charIdx], (s.batting === 1 ? p2Elements : p1Elements)?.[holder.charIdx]);
    const power = thrower?.stats?.power || 5;
    const dx = target.x - s.fieldBall.x, dy = target.y - s.fieldBall.y;
    const dist = Math.hypot(dx, dy);
    const speed = 6 + power * 0.6;
    s.fieldBall.vx = (dx / dist) * speed; s.fieldBall.vy = (dy / dist) * speed;
    s.fieldBall.vz = 3.0; s.fieldBall.heldBy = null; s.fieldBall.thrown = true;
    s.nextFielder = closest; sfx.hit();
  }

  function cpuRun(s, dt, mult) {
    s.cpuRunCd += dt;
    if (s.cpuRunCd > 0.3) {
      s.cpuRunCd = 0;
      // Situational awareness: 2 outs <GameIcon emoji="→" size={14} /> run aggressively; loose ball <GameIcon emoji="→" size={14} /> run sooner
      const twoOuts = s.outs >= 2;
      const ballHeld = s.fieldBall.heldBy !== null;
      const advanceThreshold = twoOuts ? 100 : 150;
      const looseBallBonus = !ballHeld ? 100 : 999;
      // Wake up base runners in s.bases if the ball is far from their base
      for (let i = 0; i < 3; i++) {
        if (s.bases[i] !== null) {
          const basePos = BASES[i + 1];
          const ballDist = Math.hypot(s.fieldBall.x - basePos.x, s.fieldBall.y - basePos.y);
          if (ballDist > advanceThreshold || ballDist > looseBallBonus) {
            const charIdx = s.bases[i]; s.bases[i] = null;
            s.runners.push({ charIdx, baseProgress: i + 1, targetBase: i + 2, atBase: false, retreating: false, runBoost: 2, speed: 0 });
          }
        }
      }
      // Manage active runners — advance from bases when ball is far
      s.runners.forEach(r => {
        if (r.reached) return;
        if (r.atBase) {
          // If the ball is far from this base, start running to the next base
          const baseIdx = Math.floor(r.baseProgress);
          const basePos = BASES[Math.min(3, baseIdx)];
          const ballDist = Math.hypot(s.fieldBall.x - basePos.x, s.fieldBall.y - basePos.y);
          if (ballDist > advanceThreshold || ballDist > looseBallBonus) {
            r.atBase = false;
            r.targetBase = baseIdx + 1;
            r.runBoost = 2;
            r.retreating = false;
          }
          return;
        }
        const basePos = BASES[Math.min(3, r.targetBase)];
        const ballDist = Math.hypot(s.fieldBall.x - basePos.x, s.fieldBall.y - basePos.y);
        if (ballDist > 120 || r.baseProgress > r.targetBase - 0.3) {
          r.runBoost = Math.min((r.runBoost || 0) + 0.8, 3);
          r.retreating = false;
        } else if (ballDist < (twoOuts ? 35 : 50) && r.baseProgress < r.targetBase - 0.3) {
          r.retreating = true;
        }
      });
    }
  }

  function outRunner(s, r, msg) {
    s.outs++; s.runners = s.runners.filter(x => x !== r);
    s.message = msg; s.msgT = 90; sfx.hit();
    if (s.outs >= 3) { s.playResolved = true; s.returningBall = true; }
  }

  function scoreRuns(s, n) {
    s.inningRuns += n;
    if (s.batting === 1) s.runsP1 += n; else s.runsP2 += n;
    s.message = n > 1 ? n + ' RUNS SCORED!' : 'HOME RUN SCORED!'; s.msgT = 130;
    sfx.coin(); sfx.cheer(); s.cheerTimer = 180;
  }

  function pickNextBatter(s) {
    const isOnBase = (idx) => s.bases.some(b => b === idx) || s.runners.some(r => r.charIdx === idx && !r.reached && r.atBase);
    let next = (s.batterIdx + 1) % 3;
    for (let i = 0; i < 3; i++) {
      if (!isOnBase(next)) return next;
      next = (next + 1) % 3;
    }
    // All on bases — last batter bats again, remove from base
    const last = s.batterIdx;
    for (let i = 0; i < 3; i++) if (s.bases[i] === last) s.bases[i] = null;
    s.runners = s.runners.filter(r => r.charIdx !== last);
    return last;
  }

  function afterResolve(s) {
    if (s.outs >= 3) { changeSides(s); return; }
    if (s.batterDone) {
      s.batterIdx = pickNextBatter(s);
      s.ballCount = 0; s.strikeCount = 0; s.foulCount = 0; s.batterDone = false;
      s.message = 'NEXT BATTER UP'; s.msgT = 60;
    }
    s.phase = 'pitch'; s.pitched = false; s.swung = false; s.swingTimer = 0;
    s.ball.alive = false; s.ball.x = PITCHER_X; s.ball.y = GROUND - 40; s.ball.trail = [];
    s.cpuPitchCd = 0;
  }

  function changeSides(s) {
    const battingTeam = s.batting === 1 ? 'statsP1' : 'statsP2';
    s[battingTeam].runs += s.inningRuns;
    s.inningRuns = 0; s.outs = 0; s.bases = [null, null, null]; s.runners = [];
    s.ballCount = 0; s.strikeCount = 0; s.foulCount = 0; s.batterDone = false;
    s.batterIdx = 0; s.batting = s.batting === 1 ? 2 : 1; s.half++;
    if (s.half > INNINGS * 2) { endGame(s); return; }
    s.message = 'SIDES SWITCH'; s.msgT = 120;
    s.phase = 'change'; s.phaseTimer = 1.5;
  }

  function finishChangeSides(s) {
    setupFielders(s);
    s.phase = 'pitch'; s.pitched = false; s.swung = false;
    s.ball.alive = false; s.ball.trail = [];
    s.cpuPitchCd = 0;
    s.message = (s.batting === 1 ? 'P1' : 'P2') + ' BATTING'; s.msgT = 90;
  }

  function endGame(s) {
    s.done = true; s.phase = 'over';
    const p1Won = s.runsP1 > s.runsP2;
    setTimeout(() => onResult?.({
      p1Won,
      stats: { runs: s.runsP1, hits: s.statsP1.hits, strikeouts: s.statsP2.strikeouts, p2Runs: s.runsP2 },
      p1Stats: { runs: s.runsP1, hits: s.statsP1.hits, strikeouts: s.statsP1.strikeouts },
      p2Stats: { runs: s.runsP2, hits: s.statsP2.hits, strikeouts: s.statsP2.strikeouts },
    }), 600);
  }

  // Suppress controller menu-nav for the entire match so the controller can't
  // pause or leave — only the mouse/trackpad (or keyboard Esc) can.
  useEffect(() => {
    window.__el6GameplayActive = true;
    return () => { window.__el6GameplayActive = false; };
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="w-full flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-body text-white/80 px-2">
          <button onClick={onQuit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Quit</button>
          {started && !lanConnection && !remoteState && !onStateExport && <button onClick={() => setPaused(v => !v)} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs">{paused ? '▶ RESUME' : '⏸ PAUSE (ESC)'}</button>}
          <span className="font-heading text-accent ml-1">P1:</span>
          <span><span className="text-accent font-bold">,</span> Pitch/Swing/Throw</span>
          <span><span className="text-accent font-bold">/</span> Switch</span>
          <span><span className="text-accent font-bold">.</span> Bunt/Cycle/Retreat</span>
          <span><GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} /><GameIcon emoji="↑" size={14} /><GameIcon emoji="↓" size={14} /> Move</span>
        </div>
        {!p2IsCPU && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-body text-white/80 px-2">
            <span className="font-heading" style={{ color: TEAM_COLOR_P2 }}>P2:</span>
            <span><span className="font-bold" style={{ color: TEAM_COLOR_P2 }}>V</span> Pitch/Swing/Throw</span>
            <span><span className="font-bold" style={{ color: TEAM_COLOR_P2 }}>X</span> Switch</span>
            <span><span className="font-bold" style={{ color: TEAM_COLOR_P2 }}>C</span> Bunt/Cycle/Retreat</span>
            <span><span className="font-bold" style={{ color: TEAM_COLOR_P2 }}>WASD</span> Move</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: W + 'px', height: 'auto', aspectRatio: `${W} / ${H}`, background: '#1a3a2a' }} />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg pointer-events-none">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !lanConnection && !remoteState && !onStateExport && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 rounded-lg">
        <div className="bg-card border border-border rounded-2xl p-7 w-[360px] text-center shadow-2xl">
          <h2 className="text-3xl font-heading text-accent mb-5">PAUSED</h2>
          <div className="flex justify-center gap-3"><button onClick={() => setPaused(false)} className="px-7 py-3 bg-primary text-primary-foreground rounded-lg font-heading">RESUME</button><button onClick={onQuit} className="px-7 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading">QUIT</button></div>
        </div>
      </div>}
    </div>
  );
}

function runnerWorldPos(r) {
  const from = Math.floor(r.baseProgress);
  const to = Math.ceil(r.baseProgress);
  const t = r.baseProgress - from;
  const a = BASES[Math.max(0, Math.min(3, from))];
  const b = BASES[to >= 4 ? 0 : Math.max(0, Math.min(3, to))]; // base 4 = HOME
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ── Drawing ──
function draw(ctx, s, p1Chars, p2Chars, j1, j2, p1Els, p2Els, equippedSkins, equippedAccessories) {
  ctx.clearRect(0, 0, W, H);
  if (s.phase === 'fielding' || s.phase === 'resolve') {
    drawFieldView(ctx, s, p1Chars, p2Chars, j1, j2, p1Els, p2Els, equippedSkins, equippedAccessories);
  } else {
    drawAtBatView(ctx, s, p1Chars, p2Chars, j1, j2, p1Els, p2Els, equippedSkins, equippedAccessories);
    drawOnDeck(ctx, s, p1Chars, p2Chars, p1Els, p2Els, j1, j2, equippedSkins, equippedAccessories);
  }
  drawMinimap(ctx, s, p1Chars, p2Chars);
  drawHUD(ctx, s, p1Chars, p2Chars);
}

// ── At-bat view ──
function drawAtBatView(ctx, s, c1, c2, j1, j2, p1Els, p2Els, skins, accs) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#0a1530'); sky.addColorStop(0.5, '#1a2848'); sky.addColorStop(1, '#2a3a5a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = '#0d1830'; ctx.fillRect(0, 0, W, GROUND - 50);

  for (let tier = 0; tier < 3; tier++) {
    const tierY = 40 + tier * 110, tierH = 100;
    ctx.fillStyle = `rgba(${20 + tier * 10},${28 + tier * 8},${50 + tier * 10},0.9)`;
    ctx.fillRect(0, tierY, W, tierH);
    for (let row = 0; row < 8; row++) {
      const ry = tierY + 10 + row * 11;
      ctx.fillStyle = `rgba(${40 + tier * 15},${50 + tier * 12},${80 + tier * 15},${0.25 + row * 0.03})`;
      ctx.fillRect(0, ry, W, 8);
    }
    for (let x = 60; x < W; x += 180) { ctx.fillStyle = 'rgba(80,90,120,0.3)'; ctx.fillRect(x, tierY, 3, tierH); }
  }
  for (let i = 0; i < 200; i++) {
    const x = (i * 47) % W, y = 50 + (i * 13) % 320;
    ctx.fillStyle = ['#FF6644', '#4488FF', '#FFD700', '#44FF88', '#FF44AA', '#AA66FF', '#FF8844'][i % 7];
    ctx.globalAlpha = 0.2 + Math.sin(s.frame * 0.05 + i) * 0.08;
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const drawLightTower = (x) => {
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x - 5, 0, 10, 45);
    ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x - 18, 0, 36, 30);
    for (let lx = 0; lx < 4; lx++) {
      ctx.fillStyle = '#FFFFCC'; ctx.shadowColor = '#FFFFAA'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x - 12 + lx * 8, 10, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  };
  drawLightTower(120); drawLightTower(W - 120);

  // Scoreboard
  const sbX = W / 2 - 90, sbY = 60, sbW = 180, sbH = 50;
  ctx.fillStyle = '#050a18'; ctx.fillRect(sbX, sbY, sbW, sbH);
  ctx.strokeStyle = '#334466'; ctx.lineWidth = 2; ctx.strokeRect(sbX, sbY, sbW, sbH);
  ctx.fillStyle = '#00FF44'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
  ctx.shadowColor = '#00FF44'; ctx.shadowBlur = 6;
  ctx.fillText(`${s.runsP1} - ${s.runsP2}`, W / 2, sbY + 22);
  ctx.font = 'bold 7px Orbitron'; ctx.fillStyle = '#44AA66';
  ctx.fillText(`INN ${Math.ceil(s.half / 2)}  ${s.outs} OUT`, W / 2, sbY + 38);
  ctx.shadowBlur = 0;

  const flagColors = ['#E04646', '#3577E8', '#FFD700', '#44AA44'];
  for (let x = 20; x < W - 20; x += 36) {
    ctx.fillStyle = flagColors[Math.floor(x / 36) % 4];
    ctx.beginPath(); ctx.moveTo(x, 370); ctx.lineTo(x + 30, 370); ctx.lineTo(x + 15, 385); ctx.closePath(); ctx.fill();
  }

  // Field
  const fieldGrad = ctx.createLinearGradient(0, GROUND, 0, H);
  fieldGrad.addColorStop(0, '#3a7a3a'); fieldGrad.addColorStop(1, '#2a5a2a');
  ctx.fillStyle = fieldGrad; ctx.fillRect(0, GROUND, W, H - GROUND);
  for (let x = 0; x < W; x += 50) {
    ctx.fillStyle = (Math.floor(x / 50) % 2 === 0) ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(x, GROUND, 50, H - GROUND);
  }
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(PLATE_X, GROUND); ctx.lineTo(0, GROUND + 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PLATE_X, GROUND); ctx.lineTo(W, GROUND + 100); ctx.stroke();
  ctx.globalAlpha = 1;

  // Pitcher's mound
  ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.ellipse(PITCHER_X, GROUND + 8, 42, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aa8a5a'; ctx.beginPath(); ctx.ellipse(PITCHER_X, GROUND + 6, 38, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(PITCHER_X - 7, GROUND + 3, 14, 3);

  // Home plate
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PLATE_X, GROUND - 8); ctx.lineTo(PLATE_X - 18, GROUND); ctx.lineTo(PLATE_X - 18, GROUND + 10);
  ctx.lineTo(PLATE_X + 18, GROUND + 10); ctx.lineTo(PLATE_X + 18, GROUND); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Batter's box
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(PLATE_X - 44, GROUND - 116, 22, 110);
  ctx.strokeRect(PLATE_X + 22, GROUND - 116, 22, 110);

  // Strike zone box — YELLOW when ball is in it
  const ballInBox = s.ball.alive && s.ball.x >= STRIKE_LEFT && s.ball.x <= STRIKE_RIGHT &&
                    s.ball.y >= STRIKE_TOP && s.ball.y <= STRIKE_BOT;
  const boxColor = ballInBox ? '#FFDD00' : 'rgba(255,255,255,0.25)';
  ctx.strokeStyle = boxColor; ctx.lineWidth = ballInBox ? 4 : 2;
  if (ballInBox) { ctx.shadowColor = '#FFDD00'; ctx.shadowBlur = 18; }
  ctx.strokeRect(STRIKE_LEFT, STRIKE_TOP, STRIKE_RIGHT - STRIKE_LEFT, STRIKE_BOT - STRIKE_TOP);
  ctx.shadowBlur = 0;
  ctx.fillStyle = ballInBox ? '#FFDD00' : 'rgba(255,255,255,0.2)';
  ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
  ctx.fillText('STRIKE ZONE', (STRIKE_LEFT + STRIKE_RIGHT) / 2, STRIKE_TOP - 6);

  // Characters (bigger scale)
  const battingChars = s.batting === 2 ? c2 : c1;
  const battingEls = s.batting === 2 ? p2Els : p1Els;
  const pitchingChars = s.batting === 2 ? c1 : c2;
  const pitchingEls = s.batting === 2 ? p1Els : p2Els;
  const batterChar = charFor(battingChars[s.batterIdx], battingEls?.[s.batterIdx]);
  const pitcherChar = charFor(pitchingChars[0], pitchingEls?.[0]);
  const batColor = s.batting === 2 ? (s.p2TeamColor || TEAM_COLOR_P2) : (s.p1TeamColor || TEAM_COLOR_P1);
  const pitchColor = s.batting === 2 ? (s.p1TeamColor || TEAM_COLOR_P1) : (s.p2TeamColor || TEAM_COLOR_P2);

  drawSportChar(ctx, PITCHER_X, GROUND, pitcherChar, {
    facing: -1, frame: s.frame, scale: ATBAT_CHAR_SCALE, jersey: s.batting === 2 ? j1 : j2, sport: 'baseball', state: 'attacking', teamColor: pitchColor,
    equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
  });
  const batterState = s.swingTimer > 0 ? 'attacking' : 'idle';
  drawSportChar(ctx, BATTER_X, GROUND, batterChar, {
    facing: 1, frame: s.frame, scale: ATBAT_CHAR_SCALE, jersey: s.batting === 2 ? j2 : j1, sport: 'baseball', state: batterState, teamColor: batColor,
    equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
  });

  // Bat — full swing animation with motion arc trail
  ctx.save();
  ctx.strokeStyle = '#c8904a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  if (s.swingTimer > 0) {
    const swingProgress = 1 - (s.swingTimer / 18);
    const angle = -1.6 + swingProgress * 4.2;
    // Motion arc trail (faded bat path)
    ctx.strokeStyle = `rgba(200,144,74,${0.2 * (1 - swingProgress)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(BATTER_X + 8, BAT_HAND_Y, 48, -1.6, angle); ctx.stroke();
    // Bat
    ctx.strokeStyle = '#c8904a'; ctx.lineWidth = 5;
    ctx.translate(BATTER_X + 8, BAT_HAND_Y);
    ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(50, 0); ctx.stroke();
    ctx.fillStyle = '#3a2a14'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.translate(BATTER_X + 8, BAT_HAND_Y);
    ctx.rotate(-0.4);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(42, 0); ctx.stroke();
    ctx.fillStyle = '#3a2a14'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Ball with trail
  if (s.ball.alive) {
    s.ball.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / s.ball.trail.length) * 0.4;
      ctx.fillStyle = '#FFEECC'; ctx.beginPath(); ctx.arc(t.x, t.y, 5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#CC3333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.ball.x - 2, s.ball.y, 5, -0.5, Math.PI + 0.5); ctx.stroke();
  }

  // ── Timing indicator: shows when ball enters hitting zone ──
  if (s.phase === 'pitched') {
    const barY = H - 22;
    const barL = BATTER_X + 60, barR = PITCHER_X - 60;
    const barW = barR - barL;
    // Track background
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barL - 4, barY - 10, barW + 8, 20);
    ctx.fillStyle = 'rgba(40,40,60,0.8)'; ctx.fillRect(barL, barY - 6, barW, 12);
    // Strike zone on bar
    const zoneL = barL + ((STRIKE_LEFT - 100) / (PITCHER_X - 100)) * barW;
    const zoneR = barL + ((STRIKE_RIGHT - 100) / (PITCHER_X - 100)) * barW;
    ctx.fillStyle = ballInBox ? '#44FF88' : 'rgba(255,221,0,0.35)';
    if (ballInBox) { ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 10; }
    ctx.fillRect(zoneL, barY - 6, zoneR - zoneL, 12);
    ctx.shadowBlur = 0;
    // Ball position marker
    if (s.ball.alive) {
      const markerX = barL + ((s.ball.x - 100) / (PITCHER_X - 100)) * barW;
      ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(markerX, barY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Label
    ctx.fillStyle = ballInBox ? '#44FF88' : 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(ballInBox ? '◄ SWING NOW! ►' : 'TIMING', (zoneL + zoneR) / 2, barY - 12);
  }

  // Pitch prompt
  if (s.phase === 'pitch') {
    const p1Pitching = s.batting === 2;
    const p2Pitching = s.batting === 1 && !s.p2IsCPU;
    ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(W / 2 - 250, H / 2 - 28, 500, 56);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Orbitron'; ctx.textAlign = 'center';
    if (p1Pitching) {
      ctx.fillText('PRESS , TO PITCH', W / 2, H / 2 - 5);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 10px Orbitron';
      ctx.fillText('Hold arrows DURING flight for tiny curve: <GameIcon emoji="↑" size={14} />/<GameIcon emoji="↓" size={14} />/<GameIcon emoji="←" size={14} />/<GameIcon emoji="→" size={14} />', W / 2, H / 2 + 14);
    } else if (p2Pitching) {
      ctx.fillText('P2: PRESS X TO PITCH', W / 2, H / 2 - 5);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 10px Orbitron';
      ctx.fillText('Hold W/A/S/D DURING flight for tiny curve', W / 2, H / 2 + 14);
    } else {
      ctx.fillText('CPU PITCHING...', W / 2, H / 2 + 5);
    }
  }

  // Swing prompt
  if (s.phase === 'pitched' && !s.swung) {
    if (ballInBox) {
      ctx.fillStyle = '#44FF88'; ctx.font = 'bold 18px Orbitron'; ctx.textAlign = 'center';
      ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 14;
      const key = s.batting === 1 ? ',' : (s.p2IsCPU ? ',' : 'X');
      ctx.fillText('SWING! PRESS ' + key, W / 2, 115);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(255,200,100,0.5)'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText('Wait for yellow zone...', W / 2, 115);
    }
  }

  if (s.phase === 'pitched' && s.ball.curveDir !== 'none') {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'left';
    ctx.fillText('CURVE: ' + s.ball.curveDir.toUpperCase(), 20, 130);
  }
}

// ── Birds-eye field view (zoomed out) ──
function drawFieldView(ctx, s, c1, c2, j1, j2, p1Els, p2Els, skins, accs) {
  ctx.fillStyle = '#0d1830'; ctx.fillRect(0, 0, W, H);

  // Stadium stands (outside the zoom)
  for (let tier = 0; tier < 3; tier++) {
    ctx.fillStyle = `rgba(${25 + tier * 10},${32 + tier * 8},${55 + tier * 10},0.85)`;
    ctx.fillRect(0, tier * 18, W, 16);
  }
  for (let i = 0; i < 150; i++) {
    const x = (i * 53) % W, y = (i * 7) % 50;
    ctx.fillStyle = ['#FF6644', '#4488FF', '#FFD700', '#44FF88'][i % 4];
    ctx.globalAlpha = 0.15 + Math.sin(s.frame * 0.05 + i) * 0.05;
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Zoom out: scale the field content ──
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(FIELD_SCALE, FIELD_SCALE);
  ctx.translate(-W / 2, -H / 2);

  const cx = MOUND.x, cy = MOUND.y;
  // Outfield — solid green with subtle mowing stripes for texture
  ctx.fillStyle = '#2e7a3e'; ctx.fillRect(0, 45, W, FIELD_BOT - 45);
  for (let y = 45; y < FIELD_BOT; y += 26) {
    ctx.fillStyle = (Math.floor(y / 26) % 2 === 0) ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, y, W, 26);
  }
  // Foul lines — white lines from home plate through 1st and 3rd, extending outward
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  const f1 = { x: HOME.x + (BASE1.x - HOME.x) * 3.0, y: HOME.y + (BASE1.y - HOME.y) * 3.0 };
  const f3 = { x: HOME.x + (BASE3.x - HOME.x) * 3.0, y: HOME.y + (BASE3.y - HOME.y) * 3.0 };
  ctx.beginPath(); ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(f1.x, f1.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(f3.x, f3.y); ctx.stroke();

  // Infield dirt
  ctx.fillStyle = '#b89a6a'; ctx.beginPath();
  ctx.ellipse(cx, MOUND.y + 35, 230, 185, 0, 0, Math.PI * 2); ctx.fill();
  // Base paths
  ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 16; ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(BASE1.x, BASE1.y);
  ctx.lineTo(BASE2.x, BASE2.y); ctx.lineTo(BASE3.x, BASE3.y); ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Grass infield
  ctx.fillStyle = '#3a7a3a';
  ctx.beginPath();
  ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(BASE1.x, BASE1.y);
  ctx.lineTo(BASE2.x, BASE2.y); ctx.lineTo(BASE3.x, BASE3.y); ctx.closePath();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, W, H); ctx.restore();

  // Pitcher's mound
  ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.arc(MOUND.x, MOUND.y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aa8a5a'; ctx.beginPath(); ctx.arc(MOUND.x, MOUND.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(MOUND.x - 7, MOUND.y - 2, 14, 4);

  // Bases — bigger
  const drawBase = (pos, occupied, label) => {
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = occupied ? '#FFD700' : '#FFFFFF';
    ctx.fillRect(-BASE_HALF, -BASE_HALF, BASE_HALF * 2, BASE_HALF * 2);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(-BASE_HALF, -BASE_HALF, BASE_HALF * 2, BASE_HALF * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-BASE_HALF, -BASE_HALF, BASE_HALF * 2, 5);
    ctx.restore();
    if (label) { ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center'; ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.fillText(label, pos.x, pos.y - 20); ctx.shadowBlur = 0; }
  };
  // Home plate (pentagon, bigger)
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(HOME.x, HOME.y - 16); ctx.lineTo(HOME.x - 14, HOME.y - 4);
  ctx.lineTo(HOME.x - 14, HOME.y + 10); ctx.lineTo(HOME.x + 14, HOME.y + 10);
  ctx.lineTo(HOME.x + 14, HOME.y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.fillText('HOME', HOME.x, HOME.y + 28); ctx.shadowBlur = 0;
  drawBase(BASE1, !!s.bases[0], '1B');
  drawBase(BASE2, !!s.bases[1], '2B');
  drawBase(BASE3, !!s.bases[2], '3B');

  // Dugouts
  const drawDugout = (x, y) => {
    ctx.fillStyle = '#2a3a4a'; ctx.fillRect(x - 25, y - 8, 50, 16);
    ctx.fillStyle = '#1a2a3a'; ctx.fillRect(x - 25, y - 8, 50, 4);
  };
  drawDugout(BASE1.x + 35, BASE1.y + 30);
  drawDugout(BASE3.x - 35, BASE3.y + 30);

  // ── Base runners standing on bases (not yet running) ──
  const batChars = s.batting === 2 ? c2 : c1;
  const batEls = s.batting === 2 ? p2Els : p1Els;
  const batColor = s.batting === 2 ? (s.p2TeamColor || TEAM_COLOR_P2) : (s.p1TeamColor || TEAM_COLOR_P1);
  s.bases.forEach((charIdx, i) => {
    if (charIdx === null) return;
    const rc = charFor(batChars[charIdx], batEls?.[charIdx]);
    if (!rc) return;
    const pos = BASES[i + 1];
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(pos.x, pos.y + 3, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    drawSportChar(ctx, pos.x, pos.y, rc, {
      facing: 1, frame: s.frame, scale: 0.7, jersey: s.batting === 2 ? j2 : j1, sport: 'baseball', state: 'idle', teamColor: batColor,
      equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
    });
  });

  // Fielders (with walking animation when moving)
  const defChars = s.batting === 2 ? c1 : c2;
  const defEls = s.batting === 2 ? p1Els : p2Els;
  const defColor = s.batting === 2 ? (s.p1TeamColor || TEAM_COLOR_P1) : (s.p2TeamColor || TEAM_COLOR_P2);
  s.fielders.forEach((f, i) => {
    const fc = charFor(defChars[f.charIdx], defEls?.[f.charIdx]);
    if (!fc) return;
    const isControlled = i === s.controlledFielder;
    const isNext = i === s.nextFielder;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 3, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (isControlled) {
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(f.x, f.y - 22, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (isNext && !isControlled) {
      ctx.strokeStyle = '#44FF88'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(f.x, f.y - 22, 27, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    drawSportChar(ctx, f.x, f.y, fc, {
      facing: 1, frame: s.frame, scale: 0.75, jersey: s.batting === 2 ? j1 : j2, sport: 'baseball', state: f.moving ? 'moving' : 'idle', teamColor: defColor,
      equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
    });
    ctx.fillStyle = isControlled ? '#FFD700' : 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 7px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
    ctx.fillText(fc.name.toUpperCase().slice(0, 8), f.x, f.y - 52); ctx.shadowBlur = 0;
    ctx.fillStyle = isControlled ? '#FFD700' : 'rgba(255,255,255,0.4)';
    ctx.font = '6px Orbitron';
    ctx.fillText(['PITCHER', 'INFIELD', 'OUTFIELD'][i], f.x, f.y - 44);
  });

  // Runners (moving)
  s.runners.forEach(r => {
    const rc = charFor(batChars[r.charIdx], batEls?.[r.charIdx]);
    if (!rc) return;
    const pos = runnerWorldPos(r);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(pos.x, pos.y + 3, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
    drawSportChar(ctx, pos.x, pos.y, rc, {
      facing: 1, frame: s.frame, scale: 0.7, jersey: s.batting === 2 ? j2 : j1, sport: 'baseball', state: 'moving', teamColor: batColor,
      equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
    });
    if (r.runBoost > 1) {
      ctx.strokeStyle = '#44FF88'; ctx.lineWidth = 1.5; ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(pos.x, pos.y - 15, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });

  // Ball trail (throw animation)
  if (s.fieldBall.alive && s.fieldBall.trail && s.fieldBall.trail.length > 0) {
    for (let i = 0; i < s.fieldBall.trail.length; i++) {
      const t = s.fieldBall.trail[i];
      ctx.globalAlpha = (i / s.fieldBall.trail.length) * 0.35;
      ctx.fillStyle = '#FFEECC';
      ctx.beginPath(); ctx.arc(t.x, t.y - (t.z || 0), 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Ball with shadow
  if (s.fieldBall.alive) {
    const shadowScale = 1 - Math.min(s.fieldBall.z / 60, 0.6);
    ctx.fillStyle = `rgba(0,0,0,${0.3 * shadowScale})`;
    ctx.beginPath(); ctx.ellipse(s.fieldBall.x, s.fieldBall.y, 8 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();
    const ballY = s.fieldBall.y - s.fieldBall.z;
    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(s.fieldBall.x, ballY, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#CC3333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.fieldBall.x - 2, ballY, 4, -0.5, Math.PI + 0.5); ctx.stroke();
    if (Math.hypot(s.fieldBall.vx, s.fieldBall.vy) > 1.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.fieldBall.x, ballY);
      ctx.lineTo(s.fieldBall.x - s.fieldBall.vx * 4, ballY - s.fieldBall.vz * 4); ctx.stroke();
    }
  }

  if (s.homerunFlash > 0) {
    ctx.fillStyle = `rgba(255,215,0,${s.homerunFlash / 400})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore(); // end zoom

  // Control guide (outside zoom)
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, 24);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'left';
  const humanFielding = s.batting === 2;
  if (s.homerunLap) {
    ctx.fillText('HOME RUN! Watch them run...', 10, 16);
  } else if (s.playResolved) {
    ctx.fillText('Returning ball to pitcher...', 10, 16);
  } else if (humanFielding) {
    ctx.fillText('FIELDING: Arrows=Move  ,=Throw  .=Cycle Next  /=Switch (Super)', 10, 16);
  } else {
    ctx.fillText('BATTING: ,=Swing  spam ,=Run Forward  .=Run Back', 10, 16);
  }
}

function drawHUD(ctx, s, c1, c2) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(W / 2 - 140, 28, 280, 54);
  ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - 140, 28, 280, 54);
  ctx.textAlign = 'center';
  ctx.fillStyle = s.p1TeamColor || TEAM_COLOR_P1; ctx.font = 'bold 24px Orbitron'; ctx.fillText(s.runsP1, W / 2 - 52, 60);
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 20px Orbitron'; ctx.fillText('-', W / 2, 56);
  ctx.fillStyle = s.p2TeamColor || TEAM_COLOR_P2; ctx.font = 'bold 24px Orbitron'; ctx.fillText(s.runsP2, W / 2 + 52, 60);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 8px Orbitron';
  ctx.fillText(`INNING ${Math.ceil(s.half / 2)} · ${s.outs} OUT · ${s.batting === 1 ? 'P1' : 'P2'} BAT`, W / 2, 40);
  if (s.phase === 'pitch' || s.phase === 'pitched') {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 7px Orbitron';
    ctx.fillText(`${s.ballCount} BALLS · ${s.strikeCount} STRIKES · ${s.foulCount} FOULS`, W / 2, 76);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '7px Orbitron'; ctx.textAlign = 'left';
  ctx.fillText(`P1: P:${charFor(c1[0])?.name || '?'} I:${charFor(c1[1])?.name || '?'} O:${charFor(c1[2])?.name || '?'}`, 10, 74);
  ctx.textAlign = 'right';
  ctx.fillText(`P2: P:${charFor(c2[0])?.name || '?'} I:${charFor(c2[1])?.name || '?'} O:${charFor(c2[2])?.name || '?'}`, W - 10, 74);
  // Cheering confetti + crowd flicker whenever a run scores (cheerTimer active)
  if (s.cheerTimer > 0) {
    const intensity = s.cheerTimer / 180;
    for (let i = 0; i < 80; i++) {
      const x = (i * 73) % W;
      const y = 30 + ((i * 47 + s.frame * (2 + intensity * 4)) % 240);
      const colors = ['#FFD700', '#FF6644', '#4488FF', '#44FF88', '#FF44AA', '#AA66FF'];
      ctx.fillStyle = colors[i % 6];
      ctx.globalAlpha = 0.4 + Math.sin(s.frame * 0.2 + i) * 0.3;
      ctx.beginPath(); ctx.arc(x, y, 2 + intensity * 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (s.message && s.msgT > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.85, s.msgT / 80)})`;
    ctx.fillRect(0, H / 2 - 48, W, 96);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 34px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 22;
    ctx.fillText(s.message, W / 2, H / 2 + 8);
    ctx.shadowBlur = 0;
  }
}