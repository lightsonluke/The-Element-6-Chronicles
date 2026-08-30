import db from './localBackend';

// Battle Royale engine — host-authoritative online mode reusing the existing
// fighter engine, INSANE bot AI, renderer, and netCore sync primitives.
//
// Host simulates EVERY fighter (local + remote real players + bots), the
// shrinking zone, loot, and eliminations, then broadcasts the full state.
// Guests only send their inputs and render the authoritative state, so every
// client sees identical outcomes (positions, variable jump heights, damage,
// eliminations, zone). Bots are driven by the same insane AI as normal play.

import React, { useRef, useEffect, useState } from 'react';

import { ALL_CHARS } from './allCharacters.js';
import { createFighter, updateFighter, updateProjectiles, updateAI, checkHit, applyHit, loseStock, drawProjectiles, platformNavigate } from './fighter.js';
import { drawStickman, drawAttackEffect, drawSuperEffect, drawHitSparks, drawDoubleJumpParticles, drawBackground } from './renderer.js';
import { getEquippedAccessories, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { drawShikigamiFollower } from './shikigami.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { getEmoteForKey } from './emoteSlots.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { applyElement } from './elements.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { SeqNum, ConnectionState } from './netCore.js';
import { BR_W, BR_H, BR_PLATFORMS, BR_SPAWNS, BR_ZONE, buildInitialLoot, applyLootToFighter, BR_LOOT_TYPES } from './battleRoyaleMap.js';
import { serializeDestructible } from './brDestructible.js';
import { buildMovementItems, updateMovementItems, serializeItems } from './brItems.js';
import { buildHazards, updateHazards, serializeHazards } from './brHazards.js';
import { buildObjects, updateObjects, processObjectHits, serializeObjects } from './brObjects.js';
import { updateBRAI } from './brBotAI.js';
import { drawDestructiblePlatforms, drawMovementItems, drawHazards, drawObjects } from './brRender.js';
import PauseMenu from './PauseMenu.jsx';
import GameIcon from './GameIcon.jsx';

const ALL = ALL_CHARS;
const getChar = (id) => ALL.find(c => c.id === id) || ALL[0];

const VIEW_W = 1280, VIEW_H = 720;
const SYNC_INTERVAL = 50;      // host state broadcast frames (~1.2/sec) — stays under entity write rate limits
const INPUT_SEND_INTERVAL = 30; // guest input send frames (~2/sec) — sent unconditionally so host always has fresh inputs
const DISCONNECT_TIMEOUT = 12000;
const RECONNECT_WINDOW = 20000; // grace period before a dropped peer ends the match
const RATE_LIMIT_PAUSE = 1500;  // ms to pause writes after a rate-limit error (was 4000 — too long, killed sync)

const mergeGp = (kb, gp) => gp ? {
  left: kb.left || gp.left, right: kb.right || gp.right,
  jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
  sig: kb.sig || gp.sig, power: kb.power || gp.power,
  superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
} : kb;
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

export default function BattleRoyaleEngine({ matchId, role, myUserId, myChar, myElement, players, sfxVolume = 70, musicVolume = 50, settings = {}, matchSettings = {}, onEnd, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null); // { name, charId, placement, eliminations, duration, realCount, botCount }
  const [iAmEliminated, setIAmEliminated] = useState(false);
  const [myPlacement, setMyPlacement] = useState(null);
  const [hud, setHud] = useState({ alive: 0, time: 0, zonePhase: 0, outside: false, damage: 0, super: 0 });
  const equippedShikigamiRef = useRef(equippedShikigami);
  equippedShikigamiRef.current = equippedShikigami;
  // Generate random cosmetics for bot fighters
  const botCharIdsBR = (players || []).filter(p => p.is_bot).map(p => p.char_id).filter(Boolean);
  const brMerged = mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIdsBR);
  const brAccessoriesRef = useRef(brMerged.equippedAccessories);
  brAccessoriesRef.current = brMerged.equippedAccessories;
  equippedShikigamiRef.current = brMerged.equippedShikigami;
  const [paused, setPaused] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const pausedRef = useRef(false);
  const spectateIdxRef = useRef(0);
  const iAmEliminatedRef = useRef(false);

  const isHost = role === 'host';
  const botDifficulty = matchSettings?.botDifficulty || 'honored';

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  // Mark match active when the fight starts (host owns lifecycle).
  useEffect(() => {
    if (isHost) { try { db.entities.BattleRoyaleMatch.update(matchId, { status: 'playing' }).catch(() => {}); } catch {} }
  }, [matchId, isHost]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const kb = getKeybinds(settings);
    // ── Build fighter roster — BOTH host and guest build identical rosters
    // using deterministic BR_SPAWNS so positions match across clients.
    const roster = players.map((p, i) => {
      const cd = getChar(p.char_id);
      const sp = BR_SPAWNS[i % BR_SPAWNS.length];
      return { idx: i, player: p, charData: cd, spawn: { x: sp.x, y: sp.y, facing: sp.facing || 1 } };
    });

    // ── Host: authoritative simulation state ──
    let fighters = [];
    let zone = {
      leftX: BR_ZONE.leftStart,
      rightX: BR_ZONE.rightStart,
    };
    let loot = buildInitialLoot();
    // ── BR environment: destructible platforms, movement items, hazards, objects ──
    // Both host and guest build the destructible sections array (same reference
    // used throughout) so guests can render falling chunks. Host owns the live
    // items/hazards/objects; guests render from the broadcast state.
    // BR platforms are now solid (non-destructible) — use them directly.
    const brSections = BR_PLATFORMS;
    // Both host and guest build the full BR environment (each runs the sim locally)
    let brItems = buildMovementItems();
    let brHazards = buildHazards();
    let brObjects = buildObjects();
    let tick = 0;
    let matchTime = 0;
    let finished = false;
    let lastInputSent = 0;
    let rateLimitedUntil = 0;
    const checkRate = (e) => { if (String(e?.message || e).match(/rate/i)) rateLimitedUntil = Date.now() + RATE_LIMIT_PAUSE; };
    const eliminations = {}; // idx -> count

    // Reconnection tracker: host watches for guest inputs; guest watches for host state.
    const conn = new ConnectionState({
      timeout: DISCONNECT_TIMEOUT,
      reconnectWindow: RECONNECT_WINDOW,
      onTimeout: () => setReconnecting(true),
      onReconnect: () => setReconnecting(false),
    });
    let placementCounter = players.length;

    // Both host and guest build the full fighter roster and run the simulation
    // locally — the host is just a figurehead who clicks "start". If the host
    // disconnects, every client continues seamlessly on their own simulation.
    fighters = roster.map(({ idx, player, charData, spawn }) => {
      const stats = applyElement(charData.stats, player.element || 'basic');
      const f = createFighter({ ...charData, stats }, spawn.x, spawn.y, spawn.facing);
      f.gameMode = 'brawl';
      f._isBR = true;
      f.stocks = 1;
      f.playerIndex = idx;
      f._isBot = !!player.is_bot;
      f._userId = player.user_id;
      f._name = player.username || (player.is_bot ? 'BOT' : 'Player');
      f._eliminated = false;
      f._placement = null;
      f._accessories = player.is_bot ? [] : (player.accessories || []);
      f.grounded = true;
      return f;
    });

    // ── Match state subscription: both clients listen for match-finished signal ──
    let remoteState = null;

    // Both host and guest run the full simulation locally — no prediction needed.
    const myIdx = players.findIndex(p => p.user_id === myUserId);

    // ── Entity subscription: host reads guest_inputs; guest reads match_state ──
    let latestMatch = null;
    const unsub = db.entities.BattleRoyaleMatch.subscribe((ev) => {
      if (!ev?.data || ev.data.id !== matchId) return;
      latestMatch = ev.data;
      if (ev.data.guest_inputs && Object.keys(ev.data.guest_inputs).length > 0) conn.heartbeat();
      if (ev.data.status === 'finished' && !finished) {
        finished = true;
        setWinner(ev.data.winner ? { name: ev.data.winner, charId: null, ...ev.data.match_state?.result } : { name: '—' });
      }
    });
    const poll = setInterval(async () => {
      try {
        const m = await db.entities.BattleRoyaleMatch.get(matchId);
        if (!m) return;
        latestMatch = m;
        if (m.guest_inputs && Object.keys(m.guest_inputs).length > 0) conn.heartbeat();
        if (m.status === 'finished' && !finished) {
          finished = true;
          setWinner(m.match_state?.result || { name: m.winner || '—' });
        }
      } catch {}
    }, 1000);

    // ── Input ──
    const keys = {};
    const kd = e => {
      keys[e.key] = true; keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { pausedRef.current = !pausedRef.current; setPaused(v => !v); }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') spectateIdxRef.current = spectateIdxRef.current + 1;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') spectateIdxRef.current = Math.max(0, spectateIdxRef.current - 1);
      // Emotes — number keys 1-0 (solo mode, local player only)
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const me = fighters.find(f => f._userId === myUserId);
        const emote = getEmoteForKey(e.key, equippedEmotes, 1, 'solo');
        if (emote && me && me.grounded && !me.emote) me.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0 };
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const finish = (result) => {
      if (finished) return;
      finished = true;
      // The end screen needs a complete, deterministic elimination board —
      // winner first, then the exact order every fighter was eliminated.
      const standings = fighters.map(fighter => ({
        placement: fighter._eliminated ? (fighter._placement || players.length) : 1,
        username: fighter._name,
        characterId: fighter.char?.id || null,
        isBot: !!fighter._isBot,
        kills: eliminations[fighter.playerIndex] || 0,
      })).sort((a, b) => a.placement - b.placement || b.kills - a.kills || a.username.localeCompare(b.username));
      const finalResult = { ...result, standings };
      setWinner(finalResult);
      // Both clients can finalize the match — host is a figurehead
      try { db.entities.BattleRoyaleMatch.update(matchId, { status: 'finished', winner: finalResult.name, match_state: { ...(latestMatch?.match_state || {}), result: finalResult } }).catch(() => {}); } catch {}
    };

    const sendGuestInput = (input) => {
      if (Date.now() < rateLimitedUntil) return;
      try { db.entities.BattleRoyaleMatch.update(matchId, { guest_inputs: { ...(latestMatch?.guest_inputs || {}), [myUserId]: { ...input, _tick: tick } } }).catch(checkRate); } catch {}
    };

    // ── Helpers: alive list, nearest opponent, zone update ──
    const aliveList = () => fighters.filter(f => !f._eliminated && f.stocks > 0);
    const nearestOpponent = (f) => {
      let best = null, bd = Infinity;
      for (const o of fighters) {
        if (o === f || o._eliminated || o.stocks <= 0) continue;
        const d = Math.abs(o.x - f.x) + Math.abs(o.y - f.y);
        if (d < bd) { bd = d; best = o; }
      }
      return best;
    };
    const updateZone = (dt) => {
      // Walls crush inward continuously over crushDuration seconds (very slow, automatic)
      const t = Math.min(1, matchTime / BR_ZONE.crushDuration);
      zone.leftX = BR_ZONE.leftStart + (BR_ZONE.leftEnd - BR_ZONE.leftStart) * t;
      zone.rightX = BR_ZONE.rightStart + (BR_ZONE.rightEnd - BR_ZONE.rightStart) * t;
    };
    const inZone = (f) => f.x >= zone.leftX && f.x <= zone.rightX;

    // ── HOST SIM STEP ──
    const hostStep = (dt, input) => {
      tick++; matchTime += dt;
      updateZone(dt);

      // set _allOpponents for powers/projectiles + pre-compute nearest opponent
      // in one O(n²) pass so we don't call nearestOpponent() (O(n)) per fighter
      const alive = aliveList();
      const nearestMap = {};
      for (const f of fighters) {
        f._allOpponents = alive.filter(o => o !== f);
        if (f._eliminated || f.stocks <= 0) continue;
        let best = null, bd = Infinity;
        for (const o of fighters) {
          if (o === f || o._eliminated || o.stocks <= 0) continue;
          const d = Math.abs(o.x - f.x) + Math.abs(o.y - f.y);
          if (d < bd) { bd = d; best = o; }
        }
        nearestMap[f.playerIndex] = best;
      }
      // BR environment context shared with the bot AI
      const brEnv = { sections: brSections, items: brItems, hazards: brHazards, objects: brObjects };

      // drive each fighter
      for (const f of fighters) {
        if (f._eliminated || f.stocks <= 0) continue;
        let inp;
        if (f._isBot) {
          // Environment-aware BR bot AI — handles target selection, platform
          // destruction, hazards, items, and objects internally.
          inp = updateBRAI(f, alive, brSections, brEnv, botDifficulty, dt);
          // Zone awareness: proactively avoid the zone edge, and fully override
          // inputs when outside the safe zone to get back to center.
          {
            const zoneCenterX = (zone.leftX + zone.rightX) / 2;
            const distToLeftEdge = f.x - zone.leftX;
            const distToRightEdge = zone.rightX - f.x;
            const zoneMargin = 500;
            if (!inZone(f)) {
              // Outside zone — full override to navigate back to center
              const nav = platformNavigate(f, { x: zoneCenterX, y: f.y }, brSections);
              inp = { ...inp, left: nav.left, right: nav.right, jump: nav.jump, up: false, down: nav.down, sig: false, power: false, superMove: false, heavy: false };
            } else if (distToLeftEdge < zoneMargin || distToRightEdge < zoneMargin) {
              // Near zone edge — bias movement toward center but keep attacking
              const nav = platformNavigate(f, { x: zoneCenterX, y: f.y }, brSections);
              inp = { ...inp, left: f.x > zoneCenterX + 30, right: f.x < zoneCenterX - 30, jump: inp.jump || nav.jump, down: inp.down || nav.down };
            }
          }
        } else if (f._userId === myUserId) {
          inp = (f.emote && f.emote.timer > 0) ? NO_INPUT : input; // host local player — emote lock
        } else {
          // remote real player — use their latest sent inputs
          const gi = latestMatch?.guest_inputs?.[f._userId];
          if (gi) f._lastInputTick = gi._tick || 0;
          inp = gi ? { left: !!gi.left, right: !!gi.right, jump: !!gi.jump, up: !!gi.up, down: !!gi.down, sig: !!gi.sig, power: !!gi.power, superMove: !!gi.superMove, heavy: !!gi.heavy } : { ...NO_INPUT };
        }
        const _nearest = nearestMap[f.playerIndex] || null;
        updateFighter(f, inp, brSections, BR_W, BR_H, _nearest);
        updateProjectiles(f, _nearest);

        // zone damage (damage-percentage mode — 300% = death)
        if (!inZone(f) && f.invincible <= 0) {
          f.damage += BR_ZONE.damagePerSec * dt;
        }
        // elimination (300% KO handled by fighter.js updateFighter for brawl mode)
        if (f._pendingDeath && f.stocks > 0) {
          f._pendingDeath = false;
          loseStock(f, BR_W, BR_H);
        }
        if (f.stocks <= 0 && !f._eliminated) {
          f._eliminated = true;
          f._placement = placementCounter--;
          // attribute elimination to last attacker
          const killer = f._lastHitBy;
          if (killer && killer.playerIndex != null) eliminations[killer.playerIndex] = (eliminations[killer.playerIndex] || 0) + 1;
        }
      }

      // ── Update emote timers — cancel if airborne, decrement timer, update progress ──
      for (const f of fighters) {
        if (f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) f.emote = null; }
        }
      }

      // ── Hit detection: attacker vs all alive others (multi-hit via hitIds) ──
      for (const a of fighters) {
        if (a._eliminated || a.stocks <= 0 || !a.attackData) continue;
        const p = a.attackData.progress || 0;
        if (p < 0.08 || p > 0.85) continue;
        if (a.attackData.hitApplied) continue;
        for (const d of fighters) {
          if (d === a || d._eliminated || d.stocks <= 0) continue;
          if (a.attackData.hitIds && a.attackData.hitIds[d.playerIndex]) continue;
          if (checkHit(a, d)) {
            applyHit(a, d);
            a.attackData.hitApplied = false; // allow hitting other opponents
            a.attackData.hitIds = { ...(a.attackData.hitIds || {}), [d.playerIndex]: true };
            if (a.attackData.isSuper) sfx.superImpact(); else if (a.attackData.isHeavy) sfx.heavyHit(); else sfx.hit();
          }
        }
      }

      // ── BR environment updates: run at half rate to reduce CPU load ──
      // (hazards, items, and objects change slowly — every other frame is enough)
      if (frameCount % 3 === 0) {
        updateMovementItems(brItems, fighters, dt);
        updateHazards(brHazards, fighters, dt, matchTime);
        updateObjects(brObjects, fighters, brSections, dt);
        processObjectHits(fighters, brObjects);
      }

      // ── Loot collection ──
      for (const f of fighters) {
        if (f._eliminated || f.stocks <= 0) continue;
        for (const l of loot) {
          if (l.taken) continue;
          if (Math.abs(f.x - l.x) < 34 && Math.abs((f.y - 30) - l.y) < 40) {
            l.taken = true;
            applyLootToFighter(f, l.type);
            sfx.coin();
          }
        }
      }

      // ── Win check ── (reuse cached alive list — avoids another O(n) scan)
      if (alive.length <= 1 && !finished) {
        const champ = alive[0] || null;
        const realCount = players.filter(p => !p.is_bot).length;
        const botCount = players.filter(p => p.is_bot).length;
        finish({
          name: champ ? champ._name : 'NO ONE',
          charId: champ ? champ.char?.id : null,
          placement: 1,
          eliminations: champ ? (eliminations[champ.playerIndex] || 0) : 0,
          duration: Math.round(matchTime),
          realCount, botCount,
          botDifficulty,
          });
      }
    };

    // ── Broadcast (host) ──
    const broadcast = () => {
      if (Date.now() < rateLimitedUntil) return;
      const state = {
        tick, time: matchTime,
        fighters: fighters.map(f => ({
          idx: f.playerIndex, charId: f.char?.id, name: f._name, isBot: !!f._isBot,
          x: f.x, y: f.y, vx: f.vx, vy: f.vy, facing: f.facing, frame: f.frame,
          state: f.state, grounded: f.grounded,           damage: f.damage, hp: f.hp, stocks: f.stocks,
          superMeter: f.superMeter, powerActive: f.powerActive, invincible: f.invincible,
          eliminated: !!f._eliminated, placement: f._placement,
          inputTick: f._lastInputTick || 0,
          accs: f._accessories || [],
          attackData: f.attackData ? { type: f.attackData.type, progress: f.attackData.progress, sigType: f.attackData.sigType, isNormal: f.attackData.isNormal, isHeavy: f.attackData.isHeavy, isSuper: f.attackData.isSuper, color: f.attackData.color, name: f.attackData.name, range: f.attackData.range } : null,
          projectiles: (f.projectiles || []).map(p => ({ type: p.type, x: p.x, y: p.y, vx: p.vx, vy: p.vy, life: p.life, facing: p.facing, color: p.color, size: p.size, spin: p.spin, wing: p.wing, w: p.w, h: p.h, targetX: p.targetX, targetY: p.targetY, warning: p.warning, target: p.target ? { x: p.target.x, y: p.target.y } : null, r: p.r, runFrame: p.runFrame, ringOnly: p.ringOnly })),
          portalEffect: f._portalEffect ? { fromX: f._portalEffect.fromX, fromY: f._portalEffect.fromY, toX: f._portalEffect.toX, toY: f._portalEffect.toY, timer: f._portalEffect.timer, maxTimer: f._portalEffect.maxTimer } : null,
          dashSlash: f._dashSlashEffect ? { fromX: f._dashSlashEffect.fromX, toX: f._dashSlashEffect.toX, y: f._dashSlashEffect.y, facing: f._dashSlashEffect.facing, timer: f._dashSlashEffect.timer, maxTimer: f._dashSlashEffect.maxTimer } : null,
        })),
        zone: { leftX: zone.leftX, rightX: zone.rightX },
        loot: loot.map(l => ({ id: l.id, type: l.type, x: l.x, y: l.y, taken: l.taken })),
        ...(frameCount <= 1 || frameCount % 200 === 0 ? {
          brSections: serializeDestructible(brSections),
          brItems: serializeItems(brItems),
          brHazards: serializeHazards(brHazards),
          brObjects: serializeObjects(brObjects),
        } : {}),
        alive: aliveList().length,
        time: matchTime,
      };
      try { db.entities.BattleRoyaleMatch.update(matchId, { match_state: state }).catch(checkRate); } catch {}
    };

    // ── Render ──
    const drawFighter = (f, charData, isLocal) => {
      const flashing = f.invincible > 0 && Math.floor((f.frame || 0) / 4) % 2 === 0;
      if (f.doubleJumpParticles) drawDoubleJumpParticles(ctx, f.doubleJumpParticles);
      // shadow
      if (!flashing) {
        ctx.save(); ctx.globalAlpha = 0.2 + Math.sin((f.frame||0) * 0.07) * 0.05;
        ctx.fillStyle = charData?.color || '#FFD700'; ctx.beginPath();
        ctx.ellipse(f.x, f.y + 3, 32, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      // accessories — local player uses prop; remote real players use broadcasted accs; bots get random cosmetics
      const isRealPlayer = !f._isBot;
      const accs = isLocal
        ? getEquippedAccessories(equippedAccessories, charData?.id)
        : (isRealPlayer ? (f._accessories || f.accs || []) : getEquippedAccessories(brAccessoriesRef.current, charData?.id));
      const skinColor = isLocal ? getCharRenderColor(charData?.id, equippedSkins) : null;
      const col = skinColor || charData?.color || '#FFD700';
      // behind accessories
      if (!flashing) {
        accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, resolveAccColor(a, charData), f.frame || 0, 1, charData?.id, f.state, f.facing, f.powerActive));
      }
      // clone (power effect)
      if (f._clone && !flashing) {
        ctx.save(); ctx.globalAlpha = 0.5;
        drawStickman(ctx, f._clone.x, f._clone.y, col, f._clone.facing || f.facing, f._clone.frame, 1, charData?.isSpirit, 'idle', charData, null);
        ctx.globalAlpha = 0.6; ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(charData?.name || 'Clone', f._clone.x, f._clone.y - 72);
        ctx.restore();
      }
      if (!flashing) drawStickman(ctx, f.x, f.y, col, f.facing, f.frame || 0, 1, charData?.isSpirit, f.state, charData, f.powerActive, false, null, f.emote);
      // front accessories
      if (!flashing) {
        accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, charData), f.frame || 0, 1, charData?.id, f.state, f.facing, f.powerActive));
      }
      drawShikigamiFollower(ctx, f, equippedShikigamiRef.current?.[charData?.id], f.frame || 0, 1);
      if (f.attackData && f.state === 'attacking') drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || col, f.attackData.isNormal, charData?.id, charData?.power, f.powerActive);
      if (f.attackData && f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, col, f.attackData.progress, charData?.superMove?.name, charData?.id);
      if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame || 0, he.spawnFrame));
      // power projectiles
      drawProjectiles(ctx, f);
      // portal effect (power)
      if (f._portalEffect && f._portalEffect.timer > 0) {
        const pe = f._portalEffect; const t = pe.timer / pe.maxTimer;
        const drawPortal = (x, y, alpha) => {
          ctx.save(); ctx.globalAlpha = alpha;
          for (let i = 0; i < 3; i++) {
            const r = 18 + i * 7 + Math.sin((f.frame||0) * 0.3 + i) * 3;
            ctx.strokeStyle = `rgba(255,136,0,${alpha * (0.8 - i * 0.2)})`;
            ctx.lineWidth = 3 - i; ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.65, (f.frame||0) * 0.1 + i, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.fillStyle = `rgba(255,200,100,${alpha * 0.25})`;
          ctx.beginPath(); ctx.ellipse(x, y, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0; ctx.restore();
        };
        drawPortal(pe.fromX, pe.fromY, t); drawPortal(pe.toX, pe.toY, t);
      }
      // dash slash effect (power)
      if (f._dashSlashEffect && f._dashSlashEffect.timer > 0) {
        const ds = f._dashSlashEffect; const t = ds.timer / ds.maxTimer;
        ctx.save();
        ctx.globalAlpha = t * 0.7; ctx.strokeStyle = col; ctx.lineWidth = 6 * t;
        ctx.shadowColor = col; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(ds.fromX, ds.y); ctx.lineTo(ds.toX, ds.y); ctx.stroke();
        ctx.globalAlpha = t; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
        ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(ds.toX, ds.y, 35, ds.facing > 0 ? -Math.PI * 0.7 : Math.PI * 0.3, ds.facing > 0 ? Math.PI * 0.3 : Math.PI * 1.3);
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();
      }
      // Health bar above the head (500% = death)
      if (!flashing) {
        const dmgPct = Math.min(1, (f.damage || 0) / 500);
        const barW = 48, barH = 6;
        const barX = f.x - barW / 2, barY = f.y - 100;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = dmgPct < 0.5 ? '#44DD66' : dmgPct < 0.8 ? '#FFAA22' : '#FF4444';
        ctx.fillRect(barX, barY, barW * dmgPct, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
      }
      // character name + username + bot tag (respects nametag setting; above health bar)
      if (!flashing && settings.showNametags !== false) {
        // Character name above the username
        ctx.fillStyle = isLocal ? 'rgba(255,215,0,0.8)' : 'rgba(255,255,255,0.6)';
        ctx.font = '9px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText((charData?.name || '?').slice(0, 16), f.x, f.y - 126);
        // Username
        ctx.fillStyle = isLocal ? '#FFD700' : 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText((f._name || '?').slice(0, 14), f.x, f.y - 114);
        if (f.isBot || f._isBot) { ctx.fillStyle = '#88CCFF'; ctx.font = '8px Orbitron'; ctx.fillText('BOT', f.x, f.y - 138); }
      }
    };

    let lastTime = performance.now();
    let frameCount = 0;
    let lastSentInput = null;

    const loop = (now) => {
      if (finished) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      frameCount++;

      // Host is a figurehead — game continues even if host disconnects.
      // Both clients run the full simulation locally, so no reconnection needed.

      // ── Local input (zeroed while paused — soft pause: game continues, you stand still) ──
      const gp = settings?.controllerEnabled !== false ? readGamepadInput(0) : null;
      const rawInput = mergeGp(readPlayerInput(keys, kb.p1), gp);
      const input = pausedRef.current ? { ...NO_INPUT } : rawInput;

      // Both host and guest run the full simulation locally.
      // Both send inputs so other clients can see their moves.
      if (frameCount % INPUT_SEND_INTERVAL === 0) {
        const snap = { left: input.left, right: input.right, jump: input.jump, up: input.up, down: input.down, sig: input.sig, power: input.power, superMove: input.superMove, heavy: input.heavy };
        sendGuestInput(snap);
      }
      hostStep(dt, input);
      if (isHost && (frameCount === 1 || frameCount % SYNC_INTERVAL === 0)) broadcast();

      // ── Determine the state to render ──
      // Both host and guest render from local fighters (each runs the full sim).
      const me = fighters.find(f => f._userId === myUserId);
      const localFighter = (me && !me._eliminated) ? me : null;

      // ── Spectating: if local eliminated, follow an alive fighter ──
      let target;
      if (localFighter) target = localFighter;
      else {
        // pick an alive fighter to spectate
        const pool = fighters.filter(f => !f._eliminated && f.stocks > 0);
        if (pool.length > 0) {
          spectateIdxRef.current = Math.min(spectateIdxRef.current, pool.length - 1);
          target = pool[spectateIdxRef.current % pool.length];
        }
      }
      if (!target) target = { x: BR_W / 2, y: BR_H / 2, frame: 0 };

      // mark eliminated for local (for HUD/spectator UI)
      {
        const me = fighters.find(f => f._userId === myUserId);
        if (me && me._eliminated && !iAmEliminatedRef.current) { iAmEliminatedRef.current = true; setIAmEliminated(true); setMyPlacement(me._placement); }
      }

      // ── Camera ──
      const camX = Math.max(0, Math.min(target.x - VIEW_W / 2, BR_W - VIEW_W));
      const camY = Math.max(0, Math.min(target.y - VIEW_H / 2, BR_H - VIEW_H));

      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      // background — Split City skyline
      drawBackground(ctx, VIEW_W, VIEW_H, frameCount, 'splitcity');

      ctx.save();
      ctx.translate(-camX, -camY);

      // platforms — destructible sections (host owns live state; guests render from sync)
      drawDestructiblePlatforms(ctx, brSections, frameCount);

      // ── BR environment: movement items, hazards, interactive objects ──
      const _items = brItems;
      const _hazards = brHazards;
      const _objects = brObjects;
      drawMovementItems(ctx, _items, frameCount);
      drawObjects(ctx, _objects, frameCount);
      drawHazards(ctx, _hazards, frameCount);

      // zone overlay (red outside the crushing walls)
      const z = zone;
      ctx.save();
      ctx.fillStyle = 'rgba(255,40,40,0.16)';
      // left red zone (from camera left edge to left wall)
      const leftRedEnd = Math.min(z.leftX, camX + VIEW_W);
      if (leftRedEnd > camX) ctx.fillRect(camX, camY, leftRedEnd - camX, VIEW_H);
      // right red zone (from right wall to camera right edge)
      const rightRedStart = Math.max(z.rightX, camX);
      if (rightRedStart < camX + VIEW_W) ctx.fillRect(rightRedStart, camY, camX + VIEW_W - rightRedStart, VIEW_H);
      ctx.restore();
      // wall borders
      ctx.strokeStyle = 'rgba(255,80,80,0.9)'; ctx.lineWidth = 6; ctx.setLineDash([14, 10]);
      if (z.leftX > camX && z.leftX < camX + VIEW_W) { ctx.beginPath(); ctx.moveTo(z.leftX, camY); ctx.lineTo(z.leftX, camY + VIEW_H); ctx.stroke(); }
      if (z.rightX > camX && z.rightX < camX + VIEW_W) { ctx.beginPath(); ctx.moveTo(z.rightX, camY); ctx.lineTo(z.rightX, camY + VIEW_H); ctx.stroke(); }
      ctx.setLineDash([]);

      // loot
      const lootList = loot;
      for (const l of lootList) {
        if (l.taken) continue;
        const def = BR_LOOT_TYPES.find(t => t.type === l.type) || BR_LOOT_TYPES[0];
        ctx.fillStyle = def.color; ctx.shadowColor = def.color; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(l.x, l.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(def.label, l.x, l.y - 18);
      }

      // fighters — both host and guest render from local simulation
      for (const f of fighters) {
        if (f._eliminated && f.stocks <= 0) continue;
        if (f.x < camX - 100 || f.x > camX + VIEW_W + 100 || f.y < camY - 150 || f.y > camY + VIEW_H + 150) continue;
        drawFighter(f, f.char, f._userId === myUserId);
      }

      ctx.restore();

      // ── Final-fight arrow: when only 2 remain, point toward the other fighter ──
      const aliveForArrow = aliveList().length;
      if (aliveForArrow <= 2 && target) {
        const other = fighters.find(f => !f._eliminated && f.stocks > 0 && f._userId !== myUserId);
        if (other && other.x !== undefined) {
          const osx = other.x - camX, osy = other.y - camY;
          const onScreen = osx > 60 && osx < VIEW_W - 60 && osy > 60 && osy < VIEW_H - 60;
          if (!onScreen) {
            const cx = VIEW_W / 2, cy = VIEW_H / 2;
            const ang = Math.atan2(osy - cy, osx - cx);
            const margin = 70;
            const ex = Math.max(margin, Math.min(VIEW_W - margin, cx + Math.cos(ang) * (VIEW_W / 2 - margin)));
            const ey = Math.max(margin, Math.min(VIEW_H - margin, cy + Math.sin(ang) * (VIEW_H / 2 - margin)));
            ctx.save();
            ctx.translate(ex, ey); ctx.rotate(ang);
            ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-14, -16); ctx.lineTo(-6, 0); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
            ctx.fillText('FINAL FIGHT', ex, ey - 26);
          }
        }
      }

      // ── HUD (screen space) ──
      const aliveCount = aliveList().length;
      const myFighter = fighters.find(f => f._userId === myUserId);
      const myDmg = myFighter?.damage ?? 0;
      const mySuper = myFighter?.superMeter ?? 0;
      const outside = target ? (target.x < z.leftX || target.x > z.rightX) : false;
      if (frameCount % 6 === 0) setHud({ alive: aliveCount, time: Math.round(matchTime), zonePhase: 0, outside, damage: myDmg, super: mySuper });

      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VIEW_W, 44);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px Orbitron'; ctx.textAlign = 'left';
      ctx.fillText(`PLAYERS REMAINING: ${aliveCount}`, 16, 30);
      ctx.fillStyle = '#fff'; ctx.font = '12px Orbitron'; ctx.textAlign = 'right';
      const mm = Math.floor(matchTime / 60), ss = Math.floor(matchTime % 60);
      ctx.fillText(`${mm}:${ss.toString().padStart(2, '0')}`, VIEW_W - 16, 26);
      ctx.fillStyle = outside ? '#FF4444' : '#44FF88'; ctx.font = '10px Orbitron';
      ctx.fillText(outside ? '⚠ OUTSIDE ZONE' : 'IN ZONE', VIEW_W - 16, 40);

      // local damage % bar bottom (500% = death)
      const myDmgPct = Math.min(1, myDmg / 500);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, VIEW_H - 54, 320, 54);
      ctx.fillStyle = myDmgPct < 0.5 ? '#44DD66' : myDmgPct < 0.8 ? '#FFAA22' : '#FF4444';
      ctx.fillRect(12, VIEW_H - 44, 296 * myDmgPct, 18);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(12, VIEW_H - 44, 296, 18);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'left';
      ctx.fillText(`DMG ${Math.round(myDmg)}%`, 18, VIEW_H - 30);
      // super meter
      ctx.fillStyle = '#333'; ctx.fillRect(12, VIEW_H - 22, 296, 10);
      ctx.fillStyle = '#CC66FF'; ctx.fillRect(12, VIEW_H - 22, 296 * Math.min(1, mySuper / 100), 10);

      // zone phase indicator
      ctx.fillStyle = 'rgba(255,80,80,0.9)'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(`ZONE CRUSHING`, VIEW_W / 2, 30);

      // ── Minimap (top-right corner — whole map + only my position dot) ──
      const MM_W = 160, MM_H = Math.round(MM_W * (BR_H / BR_W));
      const MM_X = VIEW_W - MM_W - 8, MM_Y = 50;
      const mmScale = MM_W / BR_W;
      ctx.save();
      ctx.beginPath(); ctx.rect(MM_X, MM_Y, MM_W, MM_H); ctx.clip();
      ctx.fillStyle = 'rgba(10,15,30,0.85)'; ctx.fillRect(MM_X, MM_Y, MM_W, MM_H);
      // Draw destructible sections (skip deleted/broken ones)
      ctx.fillStyle = 'rgba(68,102,255,0.35)';
      for (const s of brSections) { if (!s._deleted) ctx.fillRect(MM_X + s.x * mmScale, MM_Y + s.y * mmScale, Math.max(1, s.w * mmScale), Math.max(1, s.h * mmScale)); }
      // Draw hazard zones on minimap
      const _mmHazards = brHazards;
      for (const fh of _mmHazards.fire) { ctx.fillStyle = 'rgba(255,80,20,0.6)'; ctx.fillRect(MM_X + fh.x * mmScale, MM_Y + fh.y * mmScale, Math.max(2, fh.w * mmScale), Math.max(2, fh.h * mmScale)); }
      for (const eh of _mmHazards.electric) { ctx.fillStyle = 'rgba(100,200,255,0.6)'; ctx.fillRect(MM_X + eh.x * mmScale, MM_Y + eh.y * mmScale, Math.max(2, eh.w * mmScale), Math.max(2, eh.h * mmScale)); }
      for (const wh of _mmHazards.water) { ctx.fillStyle = 'rgba(50,120,200,0.5)'; ctx.fillRect(MM_X + wh.x * mmScale, MM_Y + wh.y * mmScale, Math.max(2, wh.w * mmScale), Math.max(2, wh.h * mmScale)); }
      for (const mh of _mmHazards.moving) { ctx.fillStyle = '#FFAA00'; ctx.beginPath(); ctx.arc(MM_X + mh.x * mmScale, MM_Y + mh.y * mmScale, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,40,40,0.08)';
      ctx.fillRect(MM_X, MM_Y, z.leftX * mmScale, MM_H);
      ctx.fillRect(MM_X + z.rightX * mmScale, MM_Y, MM_W - z.rightX * mmScale, MM_H);
      ctx.strokeStyle = 'rgba(255,80,80,0.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(MM_X + z.leftX * mmScale, MM_Y); ctx.lineTo(MM_X + z.leftX * mmScale, MM_Y + MM_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(MM_X + z.rightX * mmScale, MM_Y); ctx.lineTo(MM_X + z.rightX * mmScale, MM_Y + MM_H); ctx.stroke();
      let myPos = null;
      { const me = fighters.find(f => f._userId === myUserId); if (me && !me._eliminated) myPos = { x: me.x, y: me.y }; }
      if (myPos) { ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(MM_X + myPos.x * mmScale, MM_Y + myPos.y * mmScale, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(MM_X, MM_Y, MM_W, MM_H);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      unsub && unsub();
      clearInterval(poll);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted, matchId, isHost, myUserId]);

  iAmEliminatedRef.current = iAmEliminated;

  const handleQuit = () => {
    try { db.entities.BattleRoyaleMatch.update(matchId, { status: 'finished', winner: '—' }).catch(() => {}); } catch {}
    onEnd?.({ won: false, disconnected: true });
  };

  if (winner) {
    const won = !winner.disconnected && winner.name === (players.find(p => p.user_id === myUserId)?.username);
    return (
      <div className="el6-match-viewport relative flex flex-col items-center w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-lg gap-4 py-10">
          <span className="text-6xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
            {winner.disconnected ? 'CONNECTION LOST' : won ? 'VICTORY!' : 'MATCH OVER'}
          </span>
          {!winner.disconnected && <p className="text-2xl font-heading text-accent">{winner.name} — #{winner.placement || 1}</p>}
          <div className="bg-card border border-border rounded-lg p-4 text-sm font-body text-foreground flex flex-col gap-1 min-w-[260px]">
            <p>Eliminations: <span className="text-accent font-heading">{winner.eliminations ?? 0}</span></p>
            <p>Duration: <span className="font-heading">{Math.floor((winner.duration || 0) / 60)}m {(winner.duration || 0) % 60}s</span></p>
            <p>Real Players: <span className="font-heading">{winner.realCount ?? 0}</span></p>
            <p>Bots: <span className="font-heading">{winner.botCount ?? 0}</span></p>
            {myPlacement && <p className="text-primary">Your Placement: <span className="font-heading">#{myPlacement}</span></p>}
          </div>
          <div className="w-full max-w-2xl max-h-[42vh] overflow-y-auto rounded-lg border border-border bg-card/90">
            <div className="sticky top-0 grid grid-cols-[60px_1fr_90px] gap-2 bg-secondary px-3 py-2 text-[10px] font-heading z-10"><span>PLACE</span><span>FIGHTER</span><span className="text-right">KILLS</span></div>
            {(winner.standings || []).map(row => <div key={`${row.placement}-${row.username}`} className="grid grid-cols-[60px_1fr_90px] gap-2 border-t border-border/60 px-3 py-1.5 text-xs font-body"><span className="font-heading text-accent">#{row.placement}</span><span className="truncate">{row.username}{row.isBot ? ' (BOT)' : ''}</span><span className="text-right font-heading">{row.kills}</span></div>)}
          </div>
          <button onClick={() => onEnd?.({ won, placement: myPlacement, realCount: winner.realCount, botCount: winner.botCount, botDifficulty: winner.botDifficulty, eliminations: winner.eliminations, charId: myChar })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 text-lg">CONTINUE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="el6-match-viewport relative flex flex-col items-center w-full">
      <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H}
        className="el6-match-canvas" />
      {countdown > 0 && !settings?.hideCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {iAmEliminated && !winner && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-card border-2 border-accent rounded-lg px-4 py-2 shadow-2xl text-center z-10">
          <p className="font-heading text-accent text-sm">SPECTATING — ELIMINATED #{myPlacement}</p>
          <p className="text-[10px] text-muted-foreground font-body">Use ← → or A / D to switch players</p>
        </div>
      )}
      <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="el6-match-pause-button px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs">PAUSE (ESC)</button>
      {paused && !winner && <div className="el6-pause-overlay-layer"><PauseMenu online onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={handleQuit} /></div>}
      {reconnecting && !winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-2xl font-heading text-accent animate-pulse">RECONNECTING…</span>
            <span className="text-[10px] text-muted-foreground font-body">Connection unstable — simulation continues locally.</span>
          </div>
        </div>
      )}
    </div>
  );
}
