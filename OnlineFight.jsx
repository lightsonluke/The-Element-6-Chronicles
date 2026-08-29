import db from './localBackend';

import React, { useRef, useEffect, useState } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { createFighter, updateFighter, checkHit, applyHit, loseStock } from './fighter.js';
import { drawStickman, drawAttackEffect, drawSuperEffect, drawHealthBar, drawPlatforms, drawBackground, drawHitSparks, drawDoubleJumpParticles } from './renderer.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, isBehindAccessory, drawAccessory, resolveAccColor, getEquippedAccessories } from './cosmetics.js';
import { drawShikigamiFollower } from './shikigami.js';
import { getEmoteForKey } from './emoteSlots.js';
import { music } from './music.js';
import { applyElement } from './elements.js';
import { sfx } from './sfx.js';
import PauseMenu from './PauseMenu.jsx';
import { useClipRecorder } from './useClipRecorder.js';
import { SeqNum, SnapshotBuffer, ConnectionState, NetDiagnostics, serializeFighter, applyRemoteHit } from './netCore.js';
import GameIcon from "./GameIcon.jsx";

const mergeGp = (kb, gp) => gp ? {
  left: kb.left || gp.left, right: kb.right || gp.right,
  jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
  sig: kb.sig || gp.sig, power: kb.power || gp.power,
  superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
} : kb;

const W = 1280, H = 720;
const PLATFORMS = [
  { x: 40, y: 620, w: 1200, h: 48 },
  { x: 120, y: 440, w: 360, h: 20 },
  { x: 800, y: 440, w: 360, h: 20 },
  { x: 460, y: 270, w: 360, h: 20 },
];
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const getCharData = (id) => ALL.find(c => c.id === id);

const SYNC_INTERVAL = 15;      // frames between state sends (~250ms at 60fps) — stays under entity write limits
const SNAPSHOT_DELAY = 2;       // interpolation delay in ticks
const DISCONNECT_TIMEOUT = 10000;
const RECONNECT_WINDOW = 15000;

export default function OnlineFight({ matchId, role, mode, myChar, oppChar, myLoadout, oppLoadout, myElo, oppElo, sfxVolume = 70, musicVolume = 50, settings = {}, onEnd, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [winner, setWinner] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [connected, setConnected] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  useClipRecorder(canvasRef);

  const isHost = role === 'host';
  const myCharData = getCharData(myChar);
  const oppCharData = getCharData(oppChar) || myCharData;
  const myElement = myLoadout?.element || 'basic';
  const oppElement = oppLoadout?.element || 'basic';

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    try { db.entities.OnlineMatch.update(matchId, { status: 'active' }).catch(() => {}); } catch {}
  }, [matchId]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const spawnX = isHost ? 300 : 980;
    const spawnFace = isHost ? 1 : -1;
    const oppSpawnX = isHost ? 980 : 300;
    const oppSpawnFace = isHost ? -1 : 1;

    // ═══════════════════════════════════════════════════════════════════════
    // STATE-SYNC MODEL — each player is authoritative for their OWN fighter.
    // Both simulate their own fighter locally (responsive controls, exact
    // variable jump height, powers, etc.) and broadcast the FULL state every
    // SYNC_INTERVAL frames. The opponent renders the received state via
    // interpolation — no re-simulation, so every stat/feature appears exactly
    // as the owner performed it. Each player also detects their OWN attacks
    // landing against the opponent's reported state and sends a hit event;
    // the receiver applies the damage/knockback (attacker-authoritative hits).
    // ═══════════════════════════════════════════════════════════════════════

    const diag = new NetDiagnostics();
    diag.roomId = matchId;
    diag.playerNetId = isHost ? 'host' : 'guest';
    diag.connectionState = 'connected';

    const conn = new ConnectionState({
      timeout: DISCONNECT_TIMEOUT,
      reconnectWindow: RECONNECT_WINDOW,
      onTimeout: () => setReconnecting(true),
      onReconnect: () => { setReconnecting(false); setConnected(true); },
    });

    const snapBuffer = new SnapshotBuffer(30);

    // Local fighter — authoritative for self. Variable jump height enabled.
    const localF = createFighter({ ...myCharData, stats: applyElement(myCharData.stats, myElement) }, spawnX, 572, spawnFace);
    localF.grounded = true;

    // Remote render state (interpolated from the opponent's snapshots)
    const remote = {
      x: oppSpawnX, y: 572, vx: 0, vy: 0, facing: oppSpawnFace,
      frame: 0, state: 'idle', grounded: true, damage: 0, stocks: 3,
      attackData: null, superMeter: 0, powerActive: false, invincible: 0, charId: oppChar,
    };

    let tick = 0;
    let lastAppliedHitSeq = 0;
    let myHitSeq = 0;
    let finishedFlag = false;
    let rateLimitedUntil = 0;
    const checkRateLimit = (e) => { if (String(e?.message || e).match(/rate/i)) rateLimitedUntil = Date.now() + 2000; };

    // ── Subscribe to entity updates (real-time push) ──
    const unsub = db.entities.OnlineMatch.subscribe((ev) => {
      if (!ev?.data || ev.data.id !== matchId) return;
      conn.heartbeat();

      // Read opponent's authoritative state into the snapshot buffer
      const oppState = isHost ? ev.data.guest_state : ev.data.host_state;
      if (oppState && oppState._tick !== undefined) {
        const added = snapBuffer.add(oppState._tick, oppState, Date.now());
        if (added) diag.recordSnapshot(oppState._tick, Date.now() - (oppState._time || Date.now()));
      }

      // Apply incoming hit event from the opponent (their attack hit me)
      const inHit = isHost ? ev.data.guest_hit : ev.data.host_hit;
      if (inHit) {
        if (inHit.forfeit) {
          if (!finishedFlag) { finishedFlag = true; setWinner('me'); }
        } else if (inHit.seq !== undefined && SeqNum.is_newer(inHit.seq, lastAppliedHitSeq)) {
          lastAppliedHitSeq = inHit.seq;
          applyRemoteHit(localF, inHit);
          sfx.hit();
        }
      }

      if (ev.data.status === 'finished' && !finishedFlag) {
        finishedFlag = true;
        const w = ev.data.winner;
        if (w === role) setWinner('me');
        else if (w && w !== 'none') setWinner('opp');
        else setWinner('disconnect');
      }
    });

    // Poll fallback (in case subscriptions miss updates)
    const poll = setInterval(async () => {
      try {
        const m = await db.entities.OnlineMatch.get(matchId);
        if (!m) return;
        conn.heartbeat();

        const oppState = isHost ? m.guest_state : m.host_state;
        if (oppState && oppState._tick !== undefined) snapBuffer.add(oppState._tick, oppState, Date.now());

        const inHit = isHost ? m.guest_hit : m.host_hit;
        if (inHit) {
          if (inHit.forfeit) {
            if (!finishedFlag) { finishedFlag = true; setWinner('me'); }
          } else if (inHit.seq !== undefined && SeqNum.is_newer(inHit.seq, lastAppliedHitSeq)) {
            lastAppliedHitSeq = inHit.seq;
            applyRemoteHit(localF, inHit);
            sfx.hit();
          }
        }

        if (m.status === 'finished' && !finishedFlag) {
          finishedFlag = true;
          const w = m.winner;
          setWinner(w === role ? 'me' : (w && w !== 'none' ? 'opp' : 'disconnect'));
        }
      } catch {}
    }, 2000);

    const finish = (iWon) => {
      if (finishedFlag) return;
      finishedFlag = true;
      setWinner(iWon ? 'me' : 'opp');
      try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: iWon ? role : (isHost ? 'guest' : 'host') }).catch(() => {}); } catch {}
    };

    // ── Send my authoritative full state ──
    const sendMyState = () => {
      if (Date.now() < rateLimitedUntil) return;
      const state = { _tick: tick, _time: Date.now(), ...serializeFighter(localF, myChar), emote: localF.emote ? { id: localF.emote.id, progress: localF.emote.progress, timer: localF.emote.timer, maxTimer: localF.emote.maxTimer } : null };
      const patch = isHost ? { host_state: state } : { guest_state: state };
      try { db.entities.OnlineMatch.update(matchId, patch).catch(checkRateLimit); } catch {}
    };

    // ── Send a hit event (my attack landed on the opponent) ──
    const sendHit = (dmg, kx, ky, stun, color) => {
      if (Date.now() < rateLimitedUntil) return;
      myHitSeq = (myHitSeq + 1) & 0xFFFF;
      const payload = { seq: myHitSeq, dmg, kx, ky, stun, color };
      const patch = isHost ? { host_hit: payload } : { guest_hit: payload };
      try { db.entities.OnlineMatch.update(matchId, patch).catch(checkRateLimit); } catch {}
    };

    const keys = {};
    const kd = e => {
      keys[e.key] = true; keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { pausedRef.current = !pausedRef.current; setPaused(v => !v); }
      if (e.key === 'F3') { setShowDiag(v => !v); }
      // Emotes — number keys 1-0 (solo/online mode, local player)
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const emote = getEmoteForKey(e.key, equippedEmotes, 1, 'online');
        if (emote && localF.grounded && !localF.emote) localF.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let shakeMag = 0;
    let frameCount = 0;
    const kb = getKeybinds(settings);

    const loop = (now) => {
      if (finishedFlag) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      frameCount++;
      tick++;
      diag.currentTick = tick;

      // ── Connection check with reconnection window ──
      if (!conn.isAlive()) {
        setConnected(false);
        finishedFlag = true;
        setWinner(isHost ? 'me' : 'disconnect');
        try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: role }).catch(() => {}); } catch {}
        return;
      }
      if (conn.isReconnecting) setReconnecting(true);

      // ── Read local input (zeroed while paused — soft pause: game continues, you stand still) ──
      const _gpEnabled = settings?.controllerEnabled !== false;
      const gp1 = _gpEnabled ? readGamepadInput(0) : null;
      let input = pausedRef.current ? NO_INPUT : mergeGp(readPlayerInput(keys, kb.p1), gp1);
      // Emote movement lock — if emote active, force no input
      if (localF.emote && localF.emote.timer > 0) input = NO_INPUT;

      // ── Update my own fighter (authoritative for self) ──
      updateFighter(localF, input, PLATFORMS, W, H, { ...remote, char: oppCharData });
      // Update emote timer — cancel if airborne, decrement timer, update progress
      if (localF.emote && localF.emote.timer > 0) {
        if (!localF.grounded) { localF.emote = null; }
        else { localF.emote.timer--; localF.emote.progress = 1 - localF.emote.timer / localF.emote.maxTimer; if (localF.emote.timer <= 0) { if (localF.emote.key && keys[localF.emote.key]) { localF.emote.timer = localF.emote.maxTimer; } else { localF.emote = null; } } }
      }
      // Blast zone / death — handled locally; stocks are broadcast in my state
      if (localF._pendingDeath && localF.stocks > 0) { localF._pendingDeath = false; loseStock(localF, W, H); }
      if (localF.x < -150 || localF.x > W + 150 || localF.y > H + 200) {
        loseStock(localF, W, H); localF.x = spawnX; localF.y = 100; localF.vx = 0; localF.vy = 0; localF.invincible = 90;
      }

      // ── My hit detection: my attack vs the opponent's latest reported state ──
      const latestSnap = snapBuffer.getLatest();
      if (localF.attackData && !localF.attackData.hitApplied && localF.attackData.progress > 0.08 && localF.attackData.progress < 0.85) {
        const oppFighter = latestSnap && latestSnap.state;
        if (oppFighter) {
          // Build a defender shadow from the opponent's reported state so damage
          // is reduced by the defender's real defense/shield.
          const shadow = { ...oppFighter, hitEffects: [], maxSuper: oppFighter.maxSuper || 100 };
          if (checkHit(localF, shadow)) {
            const before = shadow.damage;
            applyHit(localF, shadow); // mutates localF (superMeter, hitApplied) + shadow
            const dmg = shadow.damage - before;
            sendHit(dmg, shadow.vx, shadow.vy, shadow.hitstun || 18, localF.char.color);
            shakeMag = Math.max(shakeMag, localF.attackData.isSuper ? 20 : localF.attackData.isHeavy ? 10 : 6);
            if (localF.attackData.isSuper) sfx.superImpact(); else if (localF.attackData.isHeavy) sfx.heavyHit(); else sfx.hit();
          }
        }
      }

      // ── Win/lose checks (each player tracks own stocks; opponent's from state) ──
      if (localF.stocks <= 0) { finish(false); return; }
      if (latestSnap && latestSnap.state && latestSnap.state.stocks !== undefined && latestSnap.state.stocks <= 0) { finish(true); return; }

      // ── Interpolate remote (opponent) fighter from snapshot buffer ──
      const interpState = snapBuffer.getInterpolated(SNAPSHOT_DELAY);
      if (interpState) {
        const targetX = interpState.x + (interpState.vx || 0) * 0.05;
        const targetY = interpState.y + (interpState.vy || 0) * 0.05;
        if (Math.abs(targetX - remote.x) > 100 || Math.abs(targetY - remote.y) > 100) {
          remote.x = targetX; remote.y = targetY;
        } else {
          remote.x += (targetX - remote.x) * 0.4;
          remote.y += (targetY - remote.y) * 0.4;
        }
        remote.facing = interpState.facing; remote.frame = interpState.frame; remote.state = interpState.state;
        remote.grounded = interpState.grounded; remote.damage = interpState.damage; remote.stocks = interpState.stocks;
        remote.superMeter = interpState.superMeter; remote.powerActive = interpState.powerActive;
        remote.invincible = interpState.invincible; remote.attackData = interpState.attackData;
        remote.charId = interpState.charId || oppChar;
        remote.emote = interpState.emote || null;
      }

      // Send my authoritative state at regular interval
      if (frameCount % SYNC_INTERVAL === 0) sendMyState();

      // ═══════════════════════════════════════════════════════════════════
      // RENDER (shared)
      // ═══════════════════════════════════════════════════════════════════
      let shakeX = 0, shakeY = 0;
      if (shakeMag > 0.3) { shakeX = (Math.random() - 0.5) * shakeMag; shakeY = (Math.random() - 0.5) * shakeMag; shakeMag *= 0.72; }

      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx, W, H, localF.frame, 'splitcity');
      ctx.save();
      ctx.translate(shakeX, shakeY);
      drawPlatforms(ctx, PLATFORMS, localF.frame, 'splitcity');

      const drawFighter = (f, charData, loadout, isLocal) => {
        const flashing = f.invincible > 0 && Math.floor(f.frame / 4) % 2 === 0;
        if (flashing) return;
        drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
        const renderColor = getCharRenderColor(charData.id, loadout?.equippedSkins) || charData.color;
        const skinParts = getSkinParts(charData.id, loadout?.equippedSkins);
        const accs = getEquippedAccessories(loadout?.equippedAccessories || {}, charData.id);
        const skinColor = getCharRenderColor(charData.id, loadout?.equippedSkins);
        skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1, charData.id, f.state, f.facing, f.powerActive));
        accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, charData), f.frame, 1, charData.id, f.state, f.facing, f.powerActive));
        drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame, 1, charData.isSpirit, f.state, charData, f.powerActive, false, null, f.emote);
        skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1, charData.id, f.state, f.facing, f.powerActive));
        accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, charData), f.frame, 1, charData.id, f.state, f.facing, f.powerActive));
        drawShikigamiFollower(ctx, f, loadout?.equippedShikigami?.[charData.id], f.frame, 1);
        if (f.attackData && f.state === 'attacking') drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || charData.color, f.attackData.isNormal, charData.id, charData.power, f.powerActive);
        if (f.attackData && f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, charData.color, f.attackData.progress, charData.superMove?.name, charData.id);
        if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame, he.spawnFrame));
      };

      drawFighter(remote, oppCharData, oppLoadout, false);
      drawFighter(localF, myCharData, myLoadout, true);

      ctx.restore();

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, H - 80, W, 80);
      drawHealthBar(ctx, 40, H - 66, localF.damage, 280, myCharData.color, isHost ? `${myCharData.name} (YOU)` : myCharData.name, localF.stocks);
      drawHealthBar(ctx, W - 320, H - 66, remote.damage || 0, 280, oppCharData.color, isHost ? oppCharData.name : `${oppCharData.name} (YOU)`, remote.stocks);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(mode === 'ranked' ? 'ONLINE RANKED' : mode === 'soccer' ? 'ONLINE SOCCER' : 'ONLINE UNRANKED', W / 2, H - 50);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Orbitron';
      ctx.fillText(`ELO ${myElo || 1000} vs ${oppElo || 1000}`, W / 2, H - 36);

      // Reconnecting overlay
      if (conn.isReconnecting) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 24px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('RECONNECTING…', W / 2, H / 2);
      }

      // Network diagnostics overlay (F3 to toggle)
      if (showDiag) {
        const stats = diag.getStats();
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(W - 220, 10, 210, 120);
        ctx.fillStyle = '#00FF88'; ctx.font = '10px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`PING: ${stats.ping}ms`, W - 210, 28);
        ctx.fillText(`TICK: ${stats.currentTick} (recv: ${stats.lastReceivedTick})`, W - 210, 42);
        ctx.fillText(`SNAP AGE: ${stats.snapshotAge}ms`, W - 210, 56);
        ctx.fillText(`RECONCILES: ${stats.reconciliationCount}`, W - 210, 70);
        ctx.fillText(`MAX CORRECT: ${stats.maxReconciliationMag}px`, W - 210, 84);
        ctx.fillText(`DROPPED: ${stats.droppedUpdates}`, W - 210, 98);
        ctx.fillText(`CONN: ${stats.connectionState}`, W - 210, 112);
        ctx.fillText(`ROLE: ${stats.playerNetId}`, W - 210, 126);
      }

      if (snapBuffer.size === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 28px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('Waiting for opponent to connect…', W / 2, H / 2);
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
    try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: isHost ? 'guest' : 'host', ...forfeit }).catch(() => {}); } catch {}
    onEnd?.({ won: false, disconnected: true, mode });
  };

  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  if (winner) {
    const won = winner === 'me' || winner === 'me_disconnect';
    return (
      <div className="relative flex flex-col items-center gap-2 w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg gap-5">
          <span className="text-5xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
            {winner === 'me_disconnect' || winner === 'disconnect' ? 'OTHER PLAYER DISCONNECTED' : won ? 'YOU WIN!' : 'YOU LOSE'}
          </span>
          {won && (winner === 'me_disconnect' || winner === 'disconnect') && <span className="text-3xl font-heading text-accent">YOU WIN!</span>}
          <div className="flex gap-3">
            <button onClick={() => onEnd?.({ won, mode })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">CONTINUE</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        <button onClick={handleQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Forfeit</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause (ESC)</button>
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
      {paused && !winner && <PauseMenu online onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={handleQuit} />}
      {reconnecting && !winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-3xl font-heading text-accent animate-pulse">RECONNECTING…</span>
        </div>
      )}
    </div>
  );
}
