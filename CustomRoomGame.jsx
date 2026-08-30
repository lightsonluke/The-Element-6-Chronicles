import db from './localBackend';

import React, { useRef, useEffect, useState } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { createFighter, updateFighter, checkHit, applyHit, updateAI, updateProjectiles, loseStock, CPU_DIFFICULTY } from './fighter.js';
import { drawStickman, drawAttackEffect, drawSuperEffect, drawHealthBar, drawPlatforms, drawBackground, drawHitSparks, drawDoubleJumpParticles } from './renderer.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, isBehindAccessory, drawAccessory } from './cosmetics.js';
import { applyElement } from './elements.js';
import { getEmoteForKey } from './emoteSlots.js';
import { drawEmote } from './emotes.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import PauseMenu from './PauseMenu.jsx';
import { useClipRecorder } from './useClipRecorder.js';
import { SeqNum, SnapshotBuffer, ConnectionState, NetDiagnostics, serializeFighter, reconcileFighter } from './netCore.js';
import GameIcon from "./GameIcon.jsx";

// Merge gamepad input with keyboard so both work simultaneously
const mergeGp = (kb, gp) => gp ? {
  left: kb.left || gp.left, right: kb.right || gp.right,
  jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
  sig: kb.sig || gp.sig, power: kb.power || gp.power,
  superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
} : kb;

const W = 1280, H = 720;
const DEFAULT_PLATFORMS = [
  { x: 40, y: 620, w: 1200, h: 48 },
  { x: 120, y: 440, w: 360, h: 20 },
  { x: 800, y: 440, w: 360, h: 20 },
  { x: 460, y: 270, w: 360, h: 20 },
];
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const getCharData = (id) => ALL.find(c => c.id === id);
const SPAWN_X = [280, 1000, 500, 780, 200, 1080, 640, 400];
const SPAWN_FACE = [1, -1, 1, -1, 1, -1, 1, -1];

export default function CustomRoomGame({ room, isHost, myUserId, sfxVolume = 70, musicVolume = 50, settings = {}, onEnd, myElement = 'basic', lanConnection = null, lanRole = null, localScheme = null, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [connected, setConnected] = useState(true);
  const [showDiag, setShowDiag] = useState(false);
  useClipRecorder(canvasRef);
  const finishedRef = useRef(false);
  const remoteInputRef = useRef(null);

  const players = room?.players ? (Array.isArray(room.players) ? room.players : Object.values(room.players)) : [];
  const platforms = (room?.stage_platforms && Array.isArray(room.stage_platforms) && room.stage_platforms.length)
    ? room.stage_platforms : DEFAULT_PLATFORMS;
  const spawnPoints = (room?.stage_spawn_points && Array.isArray(room.stage_spawn_points) && room.stage_spawn_points.length)
    ? room.stage_spawn_points : null;

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const kb = getKeybinds(settings);

    // Create fighters from player slots
    const fighters = players.map((p, i) => {
      const cd = getCharData(p.char) || getCharData('yellow');
      const isMe = p.user_id === myUserId;
      const modifiedCd = isMe ? { ...cd, stats: applyElement(cd.stats || {}, myElement) } : cd;
      const pin = spawnPoints && spawnPoints[i];
      const sx = pin ? pin.x : SPAWN_X[i % 8];
      const sy = pin ? pin.y : (platforms[0]?.y ?? 620);
      const f = createFighter(modifiedCd, sx, sy, SPAWN_FACE[i % 8]);
      if (pin) f.respawnPoint = { x: pin.x, y: pin.y };
      f.grounded = true;
      f.isAI = p.is_bot;
      f.cpuDifficulty = p.difficulty || 'regular';
      f.playerSlot = i;
      f.playerName = p.name || cd.name;
      f.userId = p.user_id || null;
      f.loadout = p.loadout || {};
      f.team = i; // free-for-all
      return f;
    }).filter(f => f);

    // Shared state
    let guestInputs = {}; // cached from room record
    let remoteState = null; // for guests: latest game_state from host
    let lastStateSeen = Date.now();
    let rateLimitedUntil = 0;
    const checkRateLimit = (e) => { if (String(e?.message || e).match(/rate/i)) rateLimitedUntil = Date.now() + 3000; };
    let guestRenderFighters = null;
    let lastSentInput = null; // for change detection
    let lastLocalInput = null;

    // ── Networking core ──
    const diag = new NetDiagnostics();
    diag.roomId = room.id;
    diag.playerNetId = isHost ? 'host' : 'guest';
    diag.connectionState = 'connected';
    const snapBuffer = new SnapshotBuffer(30);
    let netTick = 0;
    const conn = new ConnectionState({
      timeout: 10000,
      reconnectWindow: 15000,
      onTimeout: () => {},
      onReconnect: () => {},
    });

    // LAN mode: WebRTC data channel for state/input sync (no cloud DB polling)
    // Cloud mode: subscribe + poll CustomRoom entity
    let unsub = null;
    let poll = null;
    if (lanConnection) {
      lanConnection.onMessage((msg) => {
        if (!msg) return;
        if (isHost && msg.type === 'input') {
          remoteInputRef.current = msg.input;
          conn.heartbeat();
        } else if (!isHost && msg.type === 'state') {
          if (msg.state?._tick !== undefined) {
            snapBuffer.add(msg.state._tick, msg.state, Date.now());
            diag.recordSnapshot(msg.state._tick, Date.now() - (msg.state._time || Date.now()));
          }
          remoteState = msg.state;
          lastStateSeen = Date.now();
          conn.heartbeat();
        }
      });
    } else {
    unsub = db.entities.CustomRoom.subscribe((ev) => {
      if (!ev?.data || ev.data.id !== room.id) return;
      const r = ev.data;
      conn.heartbeat();
      if (isHost) {
        guestInputs = r.guest_inputs || {};
      } else {
          if (r.game_state?._tick !== undefined) {
            snapBuffer.add(r.game_state._tick, r.game_state, Date.now());
            diag.recordSnapshot(r.game_state._tick, Date.now() - (r.game_state._time || Date.now()));
          }
          if (r.game_state) { remoteState = r.game_state; lastStateSeen = Date.now(); }
          if (r.guest_inputs) guestInputs = r.guest_inputs;
        }
        if (r.status === 'closed' && !finishedRef.current) {
          finishedRef.current = true; setWinner(r.winner && r.winner !== 'none' ? r.winner : 'me_disconnect');
        }
      });
      poll = setInterval(async () => {
        try {
          const r = await db.entities.CustomRoom.get(room.id);
          if (!r) return;
          conn.heartbeat();
          if (isHost) {
            guestInputs = r.guest_inputs || {};
          } else {
            if (r.game_state?._tick !== undefined) {
              snapBuffer.add(r.game_state._tick, r.game_state, Date.now());
            }
            if (r.game_state) { remoteState = r.game_state; lastStateSeen = Date.now(); }
          }
          if (r.status === 'closed' && !finishedRef.current) {
            finishedRef.current = true; setWinner(r.winner && r.winner !== 'none' ? r.winner : 'me_disconnect');
          }
        } catch {}
      }, 2000);
    }

    const keys = {};
    const kd = e => {
      keys[e.key] = true; keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { pausedRef.current = !pausedRef.current; setPaused(v => !v); }
      if (e.key === 'F3') { setShowDiag(v => !v); }
      // Emotes
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const myFighter = isHost ? (fighters[0] || null) : localFighter;
        const emote = getEmoteForKey(e.key, equippedEmotes, 1, 'solo');
        if (emote && myFighter && myFighter.grounded && !myFighter.emote) {
          myFighter.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        }
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let shakeMag = 0;
    let frameCount = 0;
    let timer = 180;
    let camX = 0, camY = 0, camZoom = 0.75;
    let prevGpStart = false;
    const _gpEnabled = settings?.controllerEnabled !== false;

    const sendInput = () => {
      const gp1 = _gpEnabled ? readGamepadInput(0) : null;
      if (lanConnection) {
        const scheme = localScheme || 'p2';
        const input = pausedRef.current ? NO_INPUT : mergeGp(readPlayerInput(keys, kb[scheme]), gp1);
        lastLocalInput = input;
        lanConnection.sendMessage({ type: 'input', input });
        return;
      }
      if (Date.now() < rateLimitedUntil) return;
      const input = pausedRef.current ? NO_INPUT : mergeGp(readPlayerInput(keys, kb.p1), gp1);
      lastLocalInput = input;
      // Only write if input changed since last send (reduces API calls)
      const changed = !lastSentInput || Object.keys(input).some(k => input[k] !== lastSentInput[k]);
      if (changed) {
        lastSentInput = { ...input };
        guestInputs[myUserId] = input;
        try { db.entities.CustomRoom.update(room.id, { guest_inputs: { ...guestInputs } }).catch(checkRateLimit); } catch {}
      }
    };

    const sendState = () => {
      if (!lanConnection && Date.now() < rateLimitedUntil) return;
      netTick = (netTick + 1) & 0xFFFF;
      const snap = {
        _tick: netTick,
        _time: Date.now(),
        fighters: fighters.map(f => ({
          x: Math.round(f.x * 10) / 10, y: Math.round(f.y * 10) / 10,
          vx: Math.round(f.vx * 10) / 10, vy: Math.round(f.vy * 10) / 10,
          facing: f.facing, frame: f.frame,
          state: f.state, grounded: f.grounded, damage: f.damage, stocks: f.stocks,
          superMeter: f.superMeter, powerActive: f.powerActive, invincible: f.invincible,
          charId: f.char.id, playerName: f.playerName, attackData: f.attackData ? {
            type: f.attackData.type, progress: f.attackData.progress, name: f.attackData.name,
            color: f.attackData.color, isNormal: f.attackData.isNormal, isHeavy: f.attackData.isHeavy,
            isSuper: f.attackData.isSuper, sigType: f.attackData.sigType, damage: f.attackData.damage,
            range: f.attackData.range,
          } : null,
        })),
        timer: Math.ceil(timer),
        frame: frameCount, _input: lastLocalInput,
      };
      if (lanConnection) {
        lanConnection.sendMessage({ type: 'state', state: snap });
      } else {
        try { db.entities.CustomRoom.update(room.id, { game_state: snap }).catch(checkRateLimit); } catch {}
      }
    };

    const finish = (winnerName) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setWinner(winnerName || 'DRAW');
      if (isHost) {
        try { db.entities.CustomRoom.update(room.id, { status: 'closed', winner: winnerName || 'draw' }); } catch {}
      }
    };

    // ── GUEST: create a local fighter for responsive prediction ──
    let localFighter = null;
    let myPlayerIdx = -1;
    if (!isHost) {
      myPlayerIdx = players.findIndex(p => p.user_id === myUserId);
      if (myPlayerIdx >= 0) {
        const myPlayer = players[myPlayerIdx];
        const cd = getCharData(myPlayer.char) || getCharData('yellow');
        const modifiedCd = { ...cd, stats: applyElement(cd.stats || {}, myElement) };
        const pin = spawnPoints && spawnPoints[myPlayerIdx];
        const sx = pin ? pin.x : SPAWN_X[myPlayerIdx % 8];
        const sy = pin ? pin.y : (platforms[0]?.y ?? 620);
        localFighter = createFighter(modifiedCd, sx, sy, SPAWN_FACE[myPlayerIdx % 8]);
        if (pin) localFighter.respawnPoint = { x: pin.x, y: pin.y };
        localFighter.grounded = true;
        localFighter.fullJump = true;
      }
    }

    const loop = (now) => {
      if (finishedRef.current) return;
      if (lanConnection && lanConnection.stalledRef?.current) { lastTime = now; requestAnimationFrame(loop); return; }
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      frameCount++;

      // Connection check with reconnection window
      if (conn.wasConnected && !conn.isAlive()) {
        setConnected(false); finishedRef.current = true; setWinner('me_disconnect'); return;
      }

      if (isHost) {
        // ── HOST: run full simulation ──
        timer -= dt;

        const gp1Host = _gpEnabled ? readGamepadInput(0) : null;
        // Controller cannot pause — use mouse/trackpad or keyboard Esc/P to pause.
        prevGpStart = !!gp1Host?.start;

        // Determine inputs for each fighter
        const inputs = fighters.map((f, i) => {
          if (f.isAI) {
            const target = fighters.find(o => o !== f && o.stocks > 0) || fighters[0];
            return updateAI(f, target, f.cpuDifficulty, platforms, 1);
          }
          if (i === 0) {
            // Host's own fighter — local input (zeroed while paused: soft pause)
            const scheme = localScheme || 'p1';
            const localIn = pausedRef.current ? NO_INPUT : mergeGp(readPlayerInput(keys, kb[scheme]), gp1Host);
            lastLocalInput = localIn;
            return localIn;
          }
          // Remote human guest — read from WebRTC or cloud DB
          if (lanConnection && remoteInputRef.current) {
            return remoteInputRef.current;
          }
          const gi = guestInputs[f.userId];
          return gi || NO_INPUT;
        });

        // Update fighters
        fighters.forEach((f, i) => {
          updateFighter(f, inputs[i], platforms, W, H, fighters.find(o => o !== f) || fighters[0]);
          updateProjectiles(f, fighters.find(o => o !== f) || fighters[0]);
        });
        // Update emote timers
        fighters.forEach(f => {
          if (f.emote && f.emote.timer > 0) {
            if (!f.grounded) { f.emote = null; }
            else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) { if (f.emote.key && keys[f.emote.key]) { f.emote.timer = f.emote.maxTimer; } else { f.emote = null; } } }
          }
        });

        // Hit detection — all pairs
        for (let i = 0; i < fighters.length; i++) {
          for (let j = 0; j < fighters.length; j++) {
            if (i === j) continue;
            const a = fighters[i], b = fighters[j];
            if (a.stocks <= 0 || b.stocks <= 0) continue;
            if (checkHit(a, b)) {
              const isSuper = a.state === 'superAttack';
              const isHeavy = a.attackData && a.attackData.isHeavy;
              applyHit(a, b);
              if (isSuper) { shakeMag = Math.max(shakeMag, 28); sfx.superImpact(); }
              else if (isHeavy) { shakeMag = Math.max(shakeMag, 12); sfx.heavyHit(); }
              else { shakeMag = Math.max(shakeMag, 7); sfx.hit(); }
            }
          }
        }

        // Stock loss
        fighters.forEach(f => {
          if (f._pendingDeath && f.stocks > 0) { f._pendingDeath = false; loseStock(f, W, H); }
          if (f.x < -150 || f.x > W + 150 || f.y > H + 200) {
            if (f.stocks > 0) loseStock(f, W, H);
            const rp = f.respawnPoint;
            f.x = rp ? rp.x : SPAWN_X[f.playerSlot % 8]; f.y = rp ? rp.y : 100; f.vx = 0; f.vy = 0; f.invincible = 90;
          }
        });

        // Win condition
        const alive = fighters.filter(f => f.stocks > 0);
        if (timer <= 0 || alive.length <= 1) {
          let best = alive[0];
          for (const f of alive) { if (f.stocks > (best?.stocks || 0)) best = f; }
          finish(best ? best.playerName : null);
          return;
        }

        if (lanConnection) {
          if (frameCount % 3 === 0) sendState();
        } else {
          if (frameCount % 6 === 0) sendState();
        }

      } else {
        // ── GUEST: send input + local prediction ──
        if (lanConnection) {
          if (frameCount % 3 === 0) sendInput();
        } else {
          if (frameCount % 6 === 0) sendInput();
        }

        // Local prediction for responsive controls — simulate own fighter locally
        // then reconcile with host's authoritative state during render.
        if (localFighter && localFighter.stocks > 0) {
          const gp1G = _gpEnabled ? readGamepadInput(0) : null;
          const scheme = localScheme || 'p2';
          const input = pausedRef.current ? NO_INPUT : mergeGp(readPlayerInput(keys, kb[scheme]), gp1G);
          updateFighter(localFighter, input, platforms, W, H, null);
          // Guest does NOT make authoritative death decisions — just reset position
          if (localFighter._pendingDeath) localFighter._pendingDeath = false;
          if (localFighter.x < -150 || localFighter.x > W + 150 || localFighter.y > H + 200) {
            const rp = localFighter.respawnPoint;
            localFighter.x = rp ? rp.x : SPAWN_X[myPlayerIdx % 8];
            localFighter.y = rp ? rp.y : 100;
            localFighter.vx = 0; localFighter.vy = 0; localFighter.invincible = 90;
          }
        }
        // Update emote timer for guest's local fighter
        if (localFighter && localFighter.emote && localFighter.emote.timer > 0) {
          if (!localFighter.grounded) localFighter.emote = null;
          else { localFighter.emote.timer--; localFighter.emote.progress = 1 - localFighter.emote.timer / localFighter.emote.maxTimer; if (localFighter.emote.timer <= 0) { if (localFighter.emote.key && keys[localFighter.emote.key]) { localFighter.emote.timer = localFighter.emote.maxTimer; } else { localFighter.emote = null; } } }
        }
      }

      // ── RENDER (both host and guest) ──
      let renderFighters;
      let stateSource = null;
      if (isHost) {
        renderFighters = fighters;
      } else {
        // Use interpolated state from snapshot buffer when available
        const interpState = snapBuffer.getInterpolated(2);
        stateSource = interpState || remoteState;
        if (stateSource?.fighters) {
          if (!guestRenderFighters || guestRenderFighters.length !== stateSource.fighters.length) {
            guestRenderFighters = stateSource.fighters.map(f => ({ ...f }));
          } else {
            const elapsed = Math.min((Date.now() - lastStateSeen) / 1000, 0.4);
            for (let i = 0; i < guestRenderFighters.length; i++) {
              const rf = guestRenderFighters[i];
              const sf = stateSource.fighters[i];
              if (!sf) continue;
              const predX = sf.x + (sf.vx || 0) * elapsed;
              const predY = sf.y + (sf.vy || 0) * elapsed;
              // Snap if too far (prevents walk-back / teleport effect)
              if (Math.abs(predX - rf.x) > 80 || Math.abs(predY - rf.y) > 80) {
                rf.x = predX; rf.y = predY;
              } else {
                rf.x += (predX - rf.x) * 0.5;
                rf.y += (predY - rf.y) * 0.5;
              }
              rf.facing = sf.facing; rf.frame = sf.frame; rf.state = sf.state;
              rf.damage = sf.damage; rf.stocks = sf.stocks; rf.superMeter = sf.superMeter;
              rf.powerActive = sf.powerActive; rf.invincible = sf.invincible;
              rf.charId = sf.charId; rf.playerName = sf.playerName; rf.attackData = sf.attackData;
            }
          }
        }
        renderFighters = guestRenderFighters || [];
        // Reconcile local prediction with authoritative state
        if (localFighter && stateSource?.fighters && stateSource.fighters[myPlayerIdx]) {
          const authF = stateSource.fighters[myPlayerIdx];
          reconcileFighter(localFighter, authF, { snapThreshold: 120, lerpRate: 0.3 });
          // Override the guest's slot with the local fighter for responsive rendering
          if (guestRenderFighters && guestRenderFighters[myPlayerIdx]) {
            guestRenderFighters[myPlayerIdx] = {
              ...guestRenderFighters[myPlayerIdx],
              x: localFighter.x, y: localFighter.y,
              vx: localFighter.vx, vy: localFighter.vy,
              facing: localFighter.facing, frame: localFighter.frame,
              state: localFighter.state, damage: localFighter.damage,
              stocks: localFighter.stocks, superMeter: localFighter.superMeter,
              powerActive: localFighter.powerActive, invincible: localFighter.invincible,
              attackData: localFighter.attackData ? {
                type: localFighter.attackData.type, progress: localFighter.attackData.progress,
                name: localFighter.attackData.name, color: localFighter.attackData.color,
                isNormal: localFighter.attackData.isNormal, isHeavy: localFighter.attackData.isHeavy,
                isSuper: localFighter.attackData.isSuper, sigType: localFighter.attackData.sigType,
                damage: localFighter.attackData.damage, range: localFighter.attackData.range,
              } : null,
              emote: localFighter.emote,
            };
          }
        }
      }

      // Camera: zoom to fit all alive fighters
      const aliveF = renderFighters.filter(f => (isHost ? f.stocks > 0 : (f.stocks ?? 0) > 0));
      if (aliveF.length > 0) {
        let minX = W, maxX = 0, minY = H, maxY = 0;
        aliveF.forEach(f => {
          minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x);
          minY = Math.min(minY, f.y); maxY = Math.max(maxY, f.y);
        });
        const spreadX = Math.max(maxX - minX + 300, 300);
        const spreadY = Math.max(maxY - minY + 300, 300);
        const fitZoom = Math.min(W / spreadX, H / spreadY);
        let targetZoom = Math.min(0.85, Math.max(0.45, fitZoom));
        camZoom += (targetZoom - camZoom) * 0.05;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        camX += ((midX - W / 2) * (1 - camZoom) * 0.3 - camX) * 0.07;
        camY += ((midY - H / 2) * (1 - camZoom) * 0.3 - camY) * 0.07;
      }

      let shakeX = 0, shakeY = 0;
      if (shakeMag > 0.3) { shakeX = (Math.random() - 0.5) * shakeMag; shakeY = (Math.random() - 0.5) * shakeMag; shakeMag *= 0.72; }

      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx, W, H, frameCount, 'splitcity');
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-W / 2 + camX + shakeX, -H / 2 + camY + shakeY);

      drawPlatforms(ctx, platforms, frameCount, 'splitcity');

      // Draw fighters
      renderFighters.forEach((f, i) => {
        if (!isHost && !remoteState) return;
        const charData = isHost ? f.char : getCharData(f.charId);
        if (!charData) return;
        const stocks = isHost ? f.stocks : (f.stocks ?? 0);
        if (stocks <= 0) return;
        const flashing = (f.invincible || 0) > 0 && Math.floor((f.frame || 0) / 4) % 2 === 0;
        if (flashing) return;
        const loadout = isHost ? f.loadout : (players[i]?.loadout || {});
        const renderColor = getCharRenderColor(charData.id, loadout?.equippedSkins) || charData.color;
        const skinParts = getSkinParts(charData.id, loadout?.equippedSkins);
        const acc = getAccessory(loadout?.equippedAccessories?.[charData.id]);
        const skinColor = getCharRenderColor(charData.id, loadout?.equippedSkins);
        const accColor = skinColor && acc?.type === 'soccer_kit' ? skinColor : acc?.color;
        skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive));
        if (acc && isBehindAccessory(acc.type)) drawAccessory(ctx, f.x, f.y, acc.type, accColor, f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive);
        drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame || 0, 1, charData.isSpirit, f.state || 'idle', charData, f.powerActive, false, null, f.emote);
        skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive));
        if (acc && !isBehindAccessory(acc.type)) drawAccessory(ctx, f.x, f.y, acc.type, accColor, f.frame || 0, 1, charData.id, f.state || 'idle', f.facing, f.powerActive);
        if (f.attackData && (f.state === 'attacking' || f.state === 'superAttack')) {
          if (f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, charData.color, f.attackData.progress, charData.superMove?.name, charData.id);
          else drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || charData.color, f.attackData.isNormal, charData.id, charData.power, f.powerActive);
        }
        // Nametag
        ctx.save();
        ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(f.x - 35, f.y - 78, 70, 14, 3); ctx.fill();
        ctx.fillStyle = renderColor; ctx.fillText(f.playerName || charData.name, f.x, f.y - 67);
        ctx.restore();
      });

      ctx.restore();

      // HUD — fighter stock/damage bars
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, 10 + renderFighters.filter(f => (isHost ? f.stocks > 0 : (f.stocks ?? 0) > 0)).length * 22);
      renderFighters.forEach((f, i) => {
        const charData = isHost ? f.char : getCharData(f.charId);
        if (!charData) return;
        const stocks = isHost ? f.stocks : (f.stocks ?? 0);
        if (stocks <= 0) return;
        const y = 4 + i * 22;
        const w = Math.min(180, W / Math.max(renderFighters.length, 1) - 8);
        const x = 8 + i * (w + 4);
        const loadout = isHost ? f.loadout : (players[i]?.loadout || {});
        const color = getCharRenderColor(charData.id, loadout?.equippedSkins) || charData.color;
        drawHealthBar(ctx, x, y, isHost ? f.damage : (f.damage || 0), w, color, f.playerName || charData.name, stocks);
      });

      // Emote labels
      renderFighters.forEach(f => {
        if (f.emote) drawEmote(ctx, f.x, f.y, f.emote.id, f.emote.timer, f.emote.maxTimer, f.frame || 0);
      });

      // Timer
      if (isHost) {
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(timer)}s`, W / 2, 18);
      } else if (stateSource) {
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(`${stateSource.timer || 0}s`, W / 2, 18);
      }

      if (!isHost && !remoteState) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 28px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('Waiting for host to start…', W / 2, H / 2);
      }

      // Reconnecting overlay
      if (conn.isReconnecting) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 24px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('RECONNECTING…', W / 2, H / 2);
      }

      // Network diagnostics overlay (F3 to toggle)
      if (showDiag) {
        diag.currentTick = frameCount;
        const stats = diag.getStats();
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(W - 220, 10, 210, 110);
        ctx.fillStyle = '#00FF88'; ctx.font = '10px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`TICK: ${stats.currentTick} (recv: ${stats.lastReceivedTick})`, W - 210, 28);
        ctx.fillText(`SNAP AGE: ${stats.snapshotAge}ms`, W - 210, 42);
        ctx.fillText(`SNAPS: ${snapBuffer.size}`, W - 210, 56);
        ctx.fillText(`RECONCILES: ${stats.reconciliationCount}`, W - 210, 70);
        ctx.fillText(`DROPPED: ${stats.droppedUpdates}`, W - 210, 84);
        ctx.fillText(`CONN: ${conn.isAlive() ? 'alive' : 'dead'}`, W - 210, 98);
        ctx.fillText(`ROLE: ${stats.playerNetId}`, W - 210, 112);
      }

      lastTime = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      if (unsub) unsub();
      if (poll) clearInterval(poll);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted, room.id, isHost, myUserId, lanConnection]);

  const handleQuit = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (isHost) { try { db.entities.CustomRoom.update(room.id, { status: 'closed' }); } catch {} }
    onEnd?.({ disconnected: true });
  };

  // Suppress controller menu-nav while a match is actively running so the
  // gamepad drives the fighter; re-enable it when paused or the match ends so
  // the player can click Leave / Pause-menu buttons with the controller.
  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  if (winner) {
    const won = winner === 'me_disconnect';
    const handleRematch = async () => {
      if (isHost) { try { await db.entities.CustomRoom.update(room.id, { game_state: {}, guest_inputs: {}, winner: 'none' }); } catch {} }
      finishedRef.current = false; setWinner(null); setCountdown(3); setGameStarted(false);
    };
    return (
      <div className="el6-match-viewport relative flex flex-col items-center gap-2 w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg gap-5">
          <span className="text-5xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
            {won ? 'OTHER PLAYER DISCONNECTED' : `${winner} WINS!`}
          </span>
          {won && <span className="text-3xl font-heading text-accent">YOU WIN!</span>}
          <div className="flex gap-3">
            {!won && isHost && <button onClick={handleRematch} className="px-6 py-3 bg-secondary text-secondary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">REMATCH</button>}
            <button onClick={() => onEnd?.({ winner })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">CONTINUE</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="el6-match-viewport relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        <button onClick={handleQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Leave</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="el6-match-pause-button px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause (ESC)</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        className="el6-match-canvas"
        style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }}
      />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !winner && <div className="el6-pause-overlay-layer"><PauseMenu online={!!lanConnection} onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={handleQuit} /></div>}
      {lanConnection && lanConnection.stalled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg z-50">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-2xl font-heading text-accent">RECONNECTING…</span>
        </div>
      )}
    </div>
  );
}
