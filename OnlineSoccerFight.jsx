import db from './localBackend';

import React, { useRef, useEffect, useState } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { createFighter, updateFighter } from './fighter.js';
import { drawStickman, drawAttackEffect, drawPlatforms, drawBackground, drawDoubleJumpParticles } from './renderer.js';
import { drawSoccerKit, getAccessory, isBehindAccessory, drawAccessory, getEquippedAccessories, resolveAccColor } from './cosmetics.js';
import { drawShikigamiFollower } from './shikigami.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getEmoteForKey } from './emoteSlots.js';
import { drawEmote } from './emotes.js';

const mergeGp = (kb, gp) => gp ? {
  left: kb.left || gp.left, right: kb.right || gp.right,
  jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
  sig: kb.sig || gp.sig, power: kb.power || gp.power,
  superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
} : kb;
import { music } from './music.js';
import { sfx } from './sfx.js';
import PauseMenu from './PauseMenu.jsx';
import { SnapshotBuffer, ConnectionState, SeqNum, NetDiagnostics } from './netCore.js';

const W = 1280, H = 720;
const WALL_TOP = 200, WALL_GAP_TOP = 480, WALL_GAP_BOT = 620;
const WALL_INNER_L = 40, WALL_INNER_R = 1240;
const BACK_WALL_L = 5, BACK_WALL_R = 1275;
const GOAL_LINE_L = 20, GOAL_LINE_R = 1260;
const GOAL_TOP = WALL_GAP_TOP, GOAL_BOT = WALL_GAP_BOT;
const WIN_GOALS = 10;
const TEAM_LEFT_COLOR = '#4488FF', TEAM_RIGHT_COLOR = '#AA44FF';
const SOCCER_PLATFORMS = [
  { x: 40, y: 620, w: 1200, h: 48 },
  { x: 20, y: WALL_TOP, w: 20, h: WALL_GAP_TOP - WALL_TOP },
  { x: 1240, y: WALL_TOP, w: 20, h: WALL_GAP_TOP - WALL_TOP },
];
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const getCharData = (id) => ALL.find(c => c.id === id);

export default function OnlineSoccerFight({ matchId, role, myChar, oppChar, myLoadout, oppLoadout, sfxVolume = 70, musicVolume = 50, settings = {}, onEnd, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showDiag, setShowDiag] = useState(false);
  const finishedRef = useRef(false);
  const isHost = role === 'host';
  const myCharData = getCharData(myChar);
  const oppCharData = getCharData(oppChar) || myCharData;

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('soccer');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    try { db.entities.OnlineMatch.update(matchId, { status: 'active' }); } catch {}
  }, [matchId]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const kb = getKeybinds(settings);

    let f1, f2, ball;
    if (isHost) {
      f1 = createFighter(myCharData, 300, 572, 1);
      f2 = createFighter(oppCharData, 980, 572, -1);
      f1.grounded = true; f2.grounded = true;
      f1.gameMode = 'soccer'; f2.gameMode = 'soccer';
      f1.team = 1; f2.team = 2;
      ball = { x: 640, y: 300, vx: 0, vy: 0, r: 12, lastTouch: null, lastTeam: null, damage: 1, trail: [] };
    } else {
      f1 = { x: 300, y: 572, vx: 0, vy: 0, facing: 1, frame: 0, state: 'idle', grounded: true, powerActive: false, attackData: null };
      f2 = { x: 980, y: 572, vx: 0, vy: 0, facing: -1, frame: 0, state: 'idle', grounded: true, powerActive: false, attackData: null };
      ball = { x: 640, y: 300, vx: 0, vy: 0, r: 12, damage: 1, trail: [] };
    }

    let remoteState = null;
    let guestInput = NO_INPUT;
    let lastLocalInput = null;
    let lastSentInput = null;
    let lastSentState = null;
    let lastStateTick = -1;
    let resetCountdown = 0;
    let suddenDeath = false;
    let score = { p1: 0, p2: 0 };
    let timer = 180;
    let goalFlash = null;
    let lastStateSeen = Date.now();
    let rateLimitedUntil = 0;
    const checkRateLimit = (e) => { if (String(e?.message || e).match(/rate/i)) rateLimitedUntil = Date.now() + 3000; };

    // netCore primitives — snapshot interpolation, connection health, diagnostics
    const snapBuffer = new SnapshotBuffer(20);
    const conn = new ConnectionState({
      timeout: 8000,
      reconnectWindow: 12000,
      onTimeout: () => {},
      onReconnect: () => { lastStateSeen = Date.now(); },
    });
    const diag = new NetDiagnostics();
    diag.roomId = matchId;
    diag.playerNetId = isHost ? 'host' : 'guest';
    let netTick = 0;

    const unsub = db.entities.OnlineMatch.subscribe((ev) => {
      if (!ev?.data || ev.data.id !== matchId) return;
      const m = ev.data;
      if (isHost) {
        if (m.guest_state) { guestInput = m.guest_state; conn.heartbeat(); }
      } else {
        if (m.host_state) {
          // Reject stale snapshots via SeqNum tick
          const tick = m.host_state._tick || 0;
          if (SeqNum.is_newer(tick, lastStateTick)) {
            lastStateTick = tick;
            remoteState = m.host_state;
            lastStateSeen = Date.now();
            conn.heartbeat();
            diag.recordSnapshot(tick, Date.now() - (m.host_state._ts || Date.now()));
            snapBuffer.add(tick, m.host_state);
          }
        }
      }
      if (m.status === 'finished' && !finishedRef.current) {
        finishedRef.current = true;
        const w = m.winner;
        setWinner(w === role ? ((isHost ? m.guest_hit : m.host_hit)?.forfeit ? 'me_disconnect' : 'me') : (w && w !== 'none' ? 'opp' : 'disconnect'));
      }
    });

    const poll = setInterval(async () => {
      try {
        const m = await db.entities.OnlineMatch.get(matchId);
        if (!m) return;
        if (isHost) { if (m.guest_state) { guestInput = m.guest_state; conn.heartbeat(); } }
        else {
          if (m.host_state) {
            const tick = m.host_state._tick || 0;
            if (SeqNum.is_newer(tick, lastStateTick)) {
              lastStateTick = tick;
              remoteState = m.host_state;
              lastStateSeen = Date.now();
              conn.heartbeat();
              snapBuffer.add(tick, m.host_state);
            }
          }
        }
        if (m.status === 'finished' && !finishedRef.current) {
          finishedRef.current = true;
          const w = m.winner;
          setWinner(w === role ? ((isHost ? m.guest_hit : m.host_hit)?.forfeit ? 'me_disconnect' : 'me') : (w && w !== 'none' ? 'opp' : 'disconnect'));
        }
      } catch {}
    }, 2000);

    const finish = (iWon) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setWinner(iWon ? 'me' : 'opp');
      try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: iWon ? role : (isHost ? 'guest' : 'host') }); } catch {}
    };

    const scoreGoal = (scorer) => {
      score = { ...score, [`p${scorer}`]: score[`p${scorer}`] + 1 };
      const scorerName = scorer === 1 ? (isHost ? myCharData?.name : oppCharData?.name) : (isHost ? oppCharData?.name : myCharData?.name);
      goalFlash = `GOAL! ${scorerName} scores!`;
      sfx.coin();
      setTimeout(() => { if (goalFlash === `GOAL! ${scorerName} scores!`) goalFlash = null; }, 2000);
      ball.x = 640; ball.y = 300; ball.vx = 0; ball.vy = 0; ball.damage = 1; ball.lastTeam = null; ball.lastTouch = null; ball.trail = [];
      f1.x = 300; f1.y = 572; f1.vx = 0; f1.vy = 0; f1.facing = 1;
      f2.x = 980; f2.y = 572; f2.vx = 0; f2.vy = 0; f2.facing = -1;
      resetCountdown = 3;
      if (suddenDeath) { finish(scorer === 1); return; }
      if (score.p1 >= WIN_GOALS) finish(true);
      else if (score.p2 >= WIN_GOALS) finish(false);
    };

    const sendState = () => {
      if (!isHost) return;
      if (Date.now() < rateLimitedUntil) return;
      netTick++;
      const snap = {
        _tick: netTick,
        _ts: Date.now(),
        f1: { x: f1.x, y: f1.y, vx: f1.vx, vy: f1.vy, facing: f1.facing, frame: f1.frame, state: f1.state, grounded: f1.grounded, powerActive: f1.powerActive, attackData: f1.attackData ? { type: f1.attackData.type, progress: f1.attackData.progress, name: f1.attackData.name, color: f1.attackData.color, isNormal: f1.attackData.isNormal, sigType: f1.attackData.sigType, damage: f1.attackData.damage, range: f1.attackData.range } : null },
        f2: { x: f2.x, y: f2.y, vx: f2.vx, vy: f2.vy, facing: f2.facing, frame: f2.frame, state: f2.state, grounded: f2.grounded, powerActive: f2.powerActive, attackData: f2.attackData ? { type: f2.attackData.type, progress: f2.attackData.progress, name: f2.attackData.name, color: f2.attackData.color, isNormal: f2.attackData.isNormal, sigType: f2.attackData.sigType, damage: f2.attackData.damage, range: f2.attackData.range } : null },
        ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, damage: ball.damage },
        score, timer: Math.ceil(timer / 2), goalFlash, resetCountdown: Math.max(0, Math.ceil(resetCountdown)), suddenDeath, _input: lastLocalInput,
      };
      const changed = !lastSentState || lastSentState.score.p1 !== snap.score.p1 || lastSentState.score.p2 !== snap.score.p2 || lastSentState.timer !== snap.timer || lastSentState.goalFlash !== snap.goalFlash || lastSentState.resetCountdown !== snap.resetCountdown || lastSentState.suddenDeath !== snap.suddenDeath || Math.abs(snap.ball.x - lastSentState.ball.x) > 3 || Math.abs(snap.ball.y - lastSentState.ball.y) > 3 || Math.abs(snap.f1.x - lastSentState.f1.x) > 3 || Math.abs(snap.f2.x - lastSentState.f2.x) > 3;
      if (changed) {
        lastSentState = snap;
        diag.currentTick = netTick;
        try { db.entities.OnlineMatch.update(matchId, { host_state: snap }).catch(checkRateLimit); } catch {}
      }
    };

    const sendInput = () => {
      if (isHost) return;
      if (Date.now() < rateLimitedUntil) return;
      const input = mergeGp(readPlayerInput(keys, kb.p1), settings?.controllerEnabled !== false ? readGamepadInput(0) : null);
      lastLocalInput = input;
      const changed = !lastSentInput || Object.keys(input).some(k => input[k] !== lastSentInput[k]);
      if (changed) {
        lastSentInput = { ...input };
        try { db.entities.OnlineMatch.update(matchId, { guest_state: input }).catch(checkRateLimit); } catch {}
      }
    };

    const keys = {};
    const kd = e => {
      keys[e.key] = true; keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { pausedRef.current = !pausedRef.current; setPaused(v => !v); }
      if (e.key === 'F3') { setShowDiag(v => !v); e.preventDefault(); return; }
      // Emotes
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const myFighter = isHost ? f1 : f2;
        const emote = getEmoteForKey(e.key, equippedEmotes, 1, 'solo');
        if (emote && myFighter && myFighter.grounded && !myFighter.emote) {
          myFighter.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        }
      }
      if (!['F5','F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let frameCount = 0;
    let shakeMag = 0;
    let prevGpStart = false;

    const loop = (now) => {
      if (finishedRef.current) return;
      const _gp = settings?.controllerEnabled !== false ? readGamepadInput(0) : null;
      // Controller cannot pause — use mouse/trackpad or keyboard Esc/P to pause.
      prevGpStart = !!_gp?.start;
      if (pausedRef.current) { lastTime = now; requestAnimationFrame(loop); return; }
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      frameCount++;

      if (!isHost && Date.now() - lastStateSeen > 20000 && remoteState) {
        finishedRef.current = true; setWinner('me_disconnect'); return;
      }
      // Check connection health via ConnectionState
      if (!isHost && remoteState && !conn.isAlive()) {
        finishedRef.current = true; setWinner('me_disconnect'); return;
      }

      if (isHost) {
        if (resetCountdown > 0) { resetCountdown -= dt; }
        else if (!suddenDeath) { timer -= dt; }

        if (resetCountdown <= 0) {
          const rawP1 = mergeGp(readPlayerInput(keys, kb.p1), settings?.controllerEnabled !== false ? readGamepadInput(0) : null);
          lastLocalInput = rawP1;
          const p1In = { ...rawP1, superMove: false, heavy: false };
          const p2In = { ...guestInput, superMove: false, heavy: false };

          updateFighter(f1, p1In, SOCCER_PLATFORMS, W, H, f2);
          updateFighter(f2, p2In, SOCCER_PLATFORMS, W, H, f1);

          if (f1.x < WALL_INNER_L + 5) f1.x = WALL_INNER_L + 5;
          if (f1.x > WALL_INNER_R - 5) f1.x = WALL_INNER_R - 5;
          if (f2.x < WALL_INNER_L + 5) f2.x = WALL_INNER_L + 5;
          if (f2.x > WALL_INNER_R - 5) f2.x = WALL_INNER_R - 5;

          const allInputs = [rawP1, guestInput];
          [f1, f2].forEach((f, idx) => {
            if (f._soccerPowerActivated) {
              f._soccerPowerActivated = false;
              const dx = ball.x - f.x;
              const front = Math.sign(dx) === f.facing || Math.abs(dx) < 16;
              const near = Math.abs(dx) < 140 && Math.abs(ball.y - (f.y - 40)) < 90;
              if (front && near) {
                const low = allInputs[idx]?.down ?? false;
                ball.damage = 3.0; ball.lastTeam = f.team; ball.lastTouch = f;
                ball.vx = f.facing * 28 * (f.statPowerMul || 1) + f.vx * 0.3;
                ball.vy = low ? 6 : -14;
                shakeMag = Math.max(shakeMag, 12); sfx.power();
              }
            }
          });

          ball.prevX = ball.x; ball.vy += 0.35; ball.x += ball.vx; ball.y += ball.vy;
          ball.vx *= 0.992; ball.vy *= 0.996;
          const bsp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          if (bsp > 6) { ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 8) ball.trail.shift(); }
          else if (ball.trail.length) ball.trail.shift();

          if (ball.y + ball.r >= 620) { ball.y = 620 - ball.r; ball.vy = -ball.vy * 0.6; ball.vx *= 0.85; }
          if (ball.y - ball.r < WALL_GAP_TOP && ball.y + ball.r > WALL_TOP) {
            if (ball.x - ball.r < WALL_INNER_L) { ball.x = WALL_INNER_L + ball.r; ball.vx = Math.abs(ball.vx) * 0.6; }
            if (ball.x + ball.r > WALL_INNER_R) { ball.x = WALL_INNER_R - ball.r; ball.vx = -Math.abs(ball.vx) * 0.6; }
          }
          if (ball.y < 200) { ball.y = 200; ball.vy = Math.abs(ball.vy) * 0.3; }

          if (ball.y > GOAL_TOP && ball.y < GOAL_BOT) {
            if (ball.x <= GOAL_LINE_L || (ball.prevX > GOAL_LINE_L && ball.x < GOAL_LINE_L + ball.r)) {
              if (ball.lastTeam === 1) { ball.x = GOAL_LINE_L + ball.r + 5; ball.vx = Math.abs(ball.vx) * 0.3 + 6; }
              else { scoreGoal(2); }
            } else if (ball.x >= GOAL_LINE_R || (ball.prevX < GOAL_LINE_R && ball.x > GOAL_LINE_R - ball.r)) {
              if (ball.lastTeam === 2) { ball.x = GOAL_LINE_R - ball.r - 5; ball.vx = -Math.abs(ball.vx) * 0.3 - 6; }
              else { scoreGoal(1); }
            }
            if (ball.x - ball.r < BACK_WALL_L) { ball.x = BACK_WALL_L + ball.r; ball.vx = Math.abs(ball.vx) * 0.3 + 3; }
            if (ball.x + ball.r > BACK_WALL_R) { ball.x = BACK_WALL_R - ball.r; ball.vx = -Math.abs(ball.vx) * 0.3 - 3; }
          }

          [f1, f2].forEach((f) => {
            const dx = ball.x - f.x, dy = ball.y - (f.y - 30);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 46) {
              ball.lastTeam = f.team; ball.lastTouch = f;
              const force = (8 + Math.abs(f.vx) * 0.5) * ball.damage * (f.statPowerMul || 1);
              ball.vx = (dx / dist) * force + f.vx * 0.8; ball.vy = (dy / dist) * force - 3;
              shakeMag = Math.max(shakeMag, 3);
            }
          });

          [f1, f2].forEach((f, idx) => {
            if (f.attackData && f.attackData.progress > 0.1 && f.attackData.progress < 0.85 && !f.attackData._ballHit) {
              const dx = ball.x - f.x, dy = ball.y - (f.y - 30);
              const dist = Math.sqrt(dx * dx + dy * dy);
              const front = Math.sign(dx) === f.facing || Math.abs(dx) < 16;
              if (dist < 140 && front) {
                f.attackData._ballHit = true;
                ball.damage = Math.min(ball.damage + 0.1, 3); ball.lastTeam = f.team; ball.lastTouch = f;
                const basePower = f.attackData.damage * 0.8 * (f.statPowerMul || 1);
                const power = basePower * ball.damage;
                ball.vx = f.facing * power + f.vx * 0.5;
                ball.vy = allInputs[idx]?.down ? Math.abs(power) * 0.25 + 3 : -Math.abs(power) * 0.6 - 4;
                shakeMag = Math.max(shakeMag, 6); sfx.hit();
              }
            }
          });

          if (timer <= 0 && !suddenDeath) {
            if (score.p1 > score.p2) finish(true);
            else if (score.p2 > score.p1) finish(false);
            else { suddenDeath = true; resetCountdown = 3; }
          }
        }

        if (frameCount % 6 === 0) sendState();

      } else {
        if (frameCount % 6 === 0) sendInput();
        // Use interpolated state from snapshot buffer when available
        const interpState = snapBuffer.getInterpolated(2);
        const stateSource = interpState || remoteState;
        if (stateSource) {
          const elapsed = Math.min((Date.now() - lastStateSeen) / 1000, 0.4);
          const f1px = stateSource.f1.x + (stateSource.f1.vx || 0) * elapsed;
          const f1py = stateSource.f1.y + (stateSource.f1.vy || 0) * elapsed;
          const f2px = stateSource.f2.x + (stateSource.f2.vx || 0) * elapsed;
          const f2py = stateSource.f2.y + (stateSource.f2.vy || 0) * elapsed;
          f1.x += (f1px - f1.x) * 0.3; f1.y += (f1py - f1.y) * 0.3;
          f1.facing = stateSource.f1.facing; f1.frame = stateSource.f1.frame; f1.state = stateSource.f1.state;
          f1.powerActive = stateSource.f1.powerActive; f1.attackData = stateSource.f1.attackData;
          f2.x += (f2px - f2.x) * 0.3; f2.y += (f2py - f2.y) * 0.3;
          f2.facing = stateSource.f2.facing; f2.frame = stateSource.f2.frame; f2.state = stateSource.f2.state;
          f2.powerActive = stateSource.f2.powerActive; f2.attackData = stateSource.f2.attackData;
          const bpx = stateSource.ball.x + (stateSource.ball.vx || 0) * elapsed;
          const bpy = stateSource.ball.y + (stateSource.ball.vy || 0) * elapsed;
          ball.x += (bpx - ball.x) * 0.4; ball.y += (bpy - ball.y) * 0.4;
          ball.damage = stateSource.ball.damage;
          score = stateSource.score; timer = stateSource.timer; goalFlash = stateSource.goalFlash;
          resetCountdown = stateSource.resetCountdown || 0; suddenDeath = stateSource.suddenDeath || false;
        }
      }

      // Update emote timers (both host and guest)
      [f1, f2].forEach(f => {
        if (f && f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) { if (f.emote.key && keys[f.emote.key]) { f.emote.timer = f.emote.maxTimer; } else { f.emote = null; } } }
        }
      });

      const renderTimer = isHost ? Math.ceil(timer / 2) : timer;
      let shakeX = 0, shakeY = 0;
      if (shakeMag > 0.3) { shakeX = (Math.random() - 0.5) * shakeMag; shakeY = (Math.random() - 0.5) * shakeMag; shakeMag *= 0.72; }

      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx, W, H, frameCount, 'splitcity');
      ctx.save(); ctx.translate(shakeX, shakeY);
      drawPlatforms(ctx, SOCCER_PLATFORMS, frameCount, 'splitcity');

      ctx.fillStyle = 'rgba(68,136,255,0.1)'; ctx.fillRect(BACK_WALL_L, GOAL_TOP, GOAL_LINE_L - BACK_WALL_L, GOAL_BOT - GOAL_TOP);
      ctx.fillStyle = TEAM_LEFT_COLOR; ctx.fillRect(GOAL_LINE_L, GOAL_TOP, 5, GOAL_BOT - GOAL_TOP);
      ctx.fillStyle = 'rgba(170,68,255,0.1)'; ctx.fillRect(GOAL_LINE_R, GOAL_TOP, BACK_WALL_R - GOAL_LINE_R, GOAL_BOT - GOAL_TOP);
      ctx.fillStyle = TEAM_RIGHT_COLOR; ctx.fillRect(GOAL_LINE_R, GOAL_TOP, 5, GOAL_BOT - GOAL_TOP);

      const drawSoccerFighter = (f, charData, loadout) => {
        drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
        const renderColor = getCharRenderColor(charData.id, loadout?.equippedSkins) || charData.color;
        const skinParts = getSkinParts(charData.id, loadout?.equippedSkins);
        const accs = getEquippedAccessories(loadout?.equippedAccessories || {}, charData.id);
        const skinColor = getCharRenderColor(charData.id, loadout?.equippedSkins);
        skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive));
        accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, charData), f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive));
        drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame || 0, 1, charData.isSpirit, f.state || 'idle', charData, f.powerActive, true, null, f.emote);
        drawSoccerKit(ctx, f.x, f.y, renderColor, charData.id, f.frame || 0, 1, f.state || 'idle', f.facing, f.powerActive);
        skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive));
        accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, charData), f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive));
        drawShikigamiFollower(ctx, f, loadout?.equippedShikigami?.[charData.id], f.frame || 0, 1);
        if (f.attackData && f.state === 'attacking') drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || charData.color, f.attackData.isNormal, charData.id, charData.power, f.powerActive);
        ctx.save(); ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(f.x - 40, f.y - 84, 80, 18, 4); ctx.fill();
        ctx.fillStyle = renderColor; ctx.fillText(charData.name, f.x, f.y - 70); ctx.restore();
      };

      const f1Char = isHost ? myCharData : oppCharData;
      const f1Loadout = isHost ? myLoadout : oppLoadout;
      const f2Char = isHost ? oppCharData : myCharData;
      const f2Loadout = isHost ? oppLoadout : myLoadout;
      drawSoccerFighter(f1, f1Char, f1Loadout);
      drawSoccerFighter(f2, f2Char, f2Loadout);
      // Emote labels
      if (f1.emote) drawEmote(ctx, f1.x, f1.y, f1.emote.id, f1.emote.timer, f1.emote.maxTimer, f1.frame || 0);
      if (f2.emote) drawEmote(ctx, f2.x, f2.y, f2.emote.id, f2.emote.timer, f2.emote.maxTimer, f2.frame || 0);

      if (ball.trail && ball.trail.length > 1) {
        for (let i = 0; i < ball.trail.length; i++) {
          ctx.globalAlpha = (i / ball.trail.length) * 0.4; ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(ball.trail[i].x, ball.trail[i].y, ball.r * (0.4 + 0.6 * (i / ball.trail.length)), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.save(); ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (ball.damage > 1.05) {
        ctx.fillStyle = `rgba(255,${Math.floor(200 - ball.damage * 40)},0,0.8)`;
        ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('x' + ball.damage.toFixed(1), ball.x, ball.y - ball.r - 4);
      }
      ctx.restore(); ctx.restore();

      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(W / 2 - 145, 6, 290, 58);
      ctx.textAlign = 'right'; ctx.fillStyle = TEAM_LEFT_COLOR; ctx.font = 'bold 10px Orbitron';
      ctx.fillText(f1Char.name.toUpperCase().slice(0, 18), W / 2 - 16, 19);
      ctx.textAlign = 'left'; ctx.fillStyle = TEAM_RIGHT_COLOR;
      ctx.fillText(f2Char.name.toUpperCase().slice(0, 18), W / 2 + 16, 19);
      ctx.textAlign = 'center'; ctx.fillStyle = TEAM_LEFT_COLOR; ctx.font = 'bold 22px Orbitron';
      ctx.fillText(score.p1, W / 2 - 50, 46);
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px Orbitron'; ctx.fillText(':', W / 2, 44);
      ctx.fillStyle = TEAM_RIGHT_COLOR; ctx.font = 'bold 22px Orbitron';
      ctx.fillText(score.p2, W / 2 + 50, 46);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px Orbitron';
      ctx.fillText(`FIRST TO ${WIN_GOALS}`, W / 2, 59);

      if (suddenDeath && resetCountdown <= 0) {
        ctx.fillStyle = 'rgba(180,20,20,0.85)'; ctx.fillRect(W / 2 - 75, 70, 150, 22);
        ctx.fillStyle = '#FF4444'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('SUDDEN DEATH', W / 2, 87);
      } else if (resetCountdown <= 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(W / 2 - 50, 70, 100, 22);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(renderTimer + 's', W / 2, 87);
      }

      if (goalFlash) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H / 2 - 40, W, 80);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 48px Orbitron'; ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.fillText(goalFlash, W / 2, H / 2 + 15); ctx.shadowBlur = 0;
      }

      if (resetCountdown > 0) {
        const num = Math.max(1, Math.ceil(resetCountdown));
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, H - 160, W, 120);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 70px Orbitron'; ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.fillText(String(num), W / 2, H - 80); ctx.shadowBlur = 0;
      }

      if (!isHost && !remoteState) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 28px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('Waiting for host to start...', W / 2, H / 2);
      }

      // Reconnecting overlay
      if (!isHost && conn.isReconnecting) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 24px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('RECONNECTING…', W / 2, H / 2);
      }

      // Network diagnostics overlay (F3 to toggle)
      if (showDiag) {
        diag.currentTick = netTick;
        const stats = diag.getStats();
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(W - 220, 10, 210, 100);
        ctx.fillStyle = '#00FF88'; ctx.font = '10px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`TICK: ${stats.currentTick} (recv: ${stats.lastReceivedTick})`, W - 210, 28);
        ctx.fillText(`SNAP AGE: ${stats.snapshotAge}ms`, W - 210, 42);
        ctx.fillText(`SNAPS: ${snapBuffer.size}`, W - 210, 56);
        ctx.fillText(`CONN: ${conn.isAlive() ? 'alive' : 'dead'}`, W - 210, 70);
        ctx.fillText(`ROLE: ${stats.playerNetId}`, W - 210, 84);
        ctx.fillText(`DROPPED: ${stats.droppedUpdates}`, W - 210, 98);
      }

      lastTime = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      unsub && unsub();
      clearInterval(poll);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted, matchId, isHost, myChar, oppChar]);

  const handleQuit = () => {
    const forfeit = isHost ? { host_hit: { forfeit: true } } : { guest_hit: { forfeit: true } };
    try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: isHost ? 'guest' : 'host', ...forfeit }); } catch {}
    onEnd?.({ won: false, disconnected: true, mode: 'soccer' });
  };

  // Suppress controller menu-nav while an online match is actively running;
  // re-enable when paused or finished so the player can click with the controller.
  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  if (winner) {
    const won = winner === 'me' || winner === 'me_disconnect';
    return (
      <div className="el6-match-viewport relative flex flex-col items-center gap-2 w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg gap-5">
          <span className="text-5xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
            {winner === 'me_disconnect' || winner === 'disconnect' ? 'OTHER PLAYER DISCONNECTED' : won ? 'YOU WIN!' : 'YOU LOSE'}
          </span>
          {won && (winner === 'me_disconnect' || winner === 'disconnect') && <span className="text-3xl font-heading text-accent">YOU WIN!</span>}
          <button onClick={() => onEnd?.({ won, mode: 'soccer' })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">CONTINUE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="el6-match-viewport relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        <button onClick={handleQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">Forfeit</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="el6-match-pause-button px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">Pause (ESC)</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        className="border-2 border-border rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }}
      />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !winner && <div className="el6-pause-overlay-layer"><PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={handleQuit} /></div>}
    </div>
  );
}