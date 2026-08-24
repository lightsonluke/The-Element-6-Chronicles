// Grand Circuit match — box-stage fight with Split City backdrop.
// 2 stocks, 85% reduced knockback, 500% damage = KO, 6-minute timer, harder super buildup.

import React, { useRef, useEffect, useState } from 'react';
import { ALL_CHARS_MAP } from './allCharacters.js';
import { createFighter, updateFighter, updateProjectiles, checkHit, applyHit, updateAI, loseStock } from './fighter.js';
import { drawStickman, drawAttackEffect, drawSuperEffect, drawHitSparks, drawDoubleJumpParticles } from './renderer.js';
import { drawProjectiles } from './projectileRenderer.js';
import { drawStageBackground } from './stageBackgrounds.js';
import { applyElement } from './elements.js';
import { getKeybinds, getSchemeKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getEquippedAccessories, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { getEmoteForKey } from './emoteSlots.js';
import { getCharRenderColor } from './skins.js';
import { drawShikigamiFollower } from './shikigami.js';
import { music, GRAND_CIRCUIT_TRACKS, GRAND_CIRCUIT_FINAL_TRACK } from './music.js';
import { sfx } from './sfx.js';
import GameIcon from './GameIcon.jsx';

const W = 1280, H = 720;
const BOX_PLATFORMS = [
  { x: 0, y: 690, w: 1280, h: 30 },
  { x: 0, y: 0, w: 30, h: 720 },
  { x: 1250, y: 0, w: 30, h: 720 },
  { x: 0, y: 0, w: 1280, h: 30 },
];
const STOCKS = 2;
const KO_DAMAGE = 500;
const KNOCKBACK_REDUCTION = 0.65; // keep Grand Circuit knockback unchanged (compensates for global 0.15 scale)
const TIME_LIMIT = 360; // 6 minutes
const SUPER_MAX = 400; // 4x harder super buildup
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function hexToRgba(hex, a) {
  if (!hex || !hex.startsWith('#')) return `rgba(100,100,200,${a})`;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const mergeGp = (kb, gp) => gp ? {
  left: kb.left || gp.left, right: kb.right || gp.right,
  jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
  sig: kb.sig || gp.sig, power: kb.power || gp.power,
  superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
} : kb;

// ── Big custom HUD for Grand Circuit ──
function drawGCHUD(ctx, f1, f2, c1, c2, col1, col2, matchTime, hideStocks) {
  const pad = 14;
  const boxW = 440;
  const boxH = 96;

  // ── P1 (left) ──
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, pad, pad, boxW, boxH, 10); ctx.fill();
  ctx.strokeStyle = col1; ctx.lineWidth = 3; ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = col1;
  ctx.font = 'bold 24px Orbitron, sans-serif';
  ctx.fillText(c1.name.toUpperCase(), pad + 14, pad + 32);

  // P1 stocks
  if (!hideStocks) {
  for (let i = 0; i < f1.stocks; i++) {
    ctx.fillStyle = col1;
    ctx.shadowColor = col1; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(pad + 22 + i * 26, pad + 60, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }
  }

  // P1 damage
  const d1 = Math.floor(f1.damage);
  const dc1 = d1 > 350 ? '#FF4444' : d1 > 200 ? '#FFAA44' : '#FFFFFF';
  ctx.fillStyle = dc1;
  ctx.font = 'bold 36px Rajdhani, sans-serif';
  ctx.fillText(d1 + '%', pad + 130, pad + 68);

  // P1 super bar
  const sbX = pad + 220, sbY = pad + 52, sbW = 200, sbH = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, sbX, sbY, sbW, sbH, 4); ctx.fill();
  const sp1 = Math.min(1, f1.superMeter / f1.maxSuper);
  ctx.fillStyle = sp1 >= 1 ? '#FFDD44' : '#9966FF';
  if (sp1 >= 1) { ctx.shadowColor = '#FFDD44'; ctx.shadowBlur = 12; }
  roundRect(ctx, sbX, sbY, sbW * sp1, sbH, 4); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  roundRect(ctx, sbX, sbY, sbW, sbH, 4); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Rajdhani, sans-serif';
  ctx.fillText('SUPER', sbX + 2, sbY - 4);

  // P1 power bar
  const pbX = pad + 220, pbY = pad + 76, pbW = 200, pbH = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, pbX, pbY, pbW, pbH, 3); ctx.fill();
  const pwrReady1 = f1.powerCooldown <= 0;
  const pwrPct1 = pwrReady1 ? 1 : 1 - f1.powerCooldown / (f1._maxPowerCooldown || 300);
  ctx.fillStyle = pwrReady1 ? '#44FF66' : '#666688';
  roundRect(ctx, pbX, pbY, pbW * pwrPct1, pbH, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  roundRect(ctx, pbX, pbY, pbW, pbH, 3); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Rajdhani, sans-serif';
  ctx.fillText('POWER', pbX + 2, pbY - 3);

  // ── P2 (right, mirrored) ──
  const p2X = W - pad - boxW;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, p2X, pad, boxW, boxH, 10); ctx.fill();
  ctx.strokeStyle = col2; ctx.lineWidth = 3; ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = col2;
  ctx.font = 'bold 24px Orbitron, sans-serif';
  ctx.fillText(c2.name.toUpperCase(), p2X + boxW - 14, pad + 32);

  // P2 stocks (right-aligned)
  if (!hideStocks) {
  for (let i = 0; i < f2.stocks; i++) {
    ctx.fillStyle = col2;
    ctx.shadowColor = col2; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(p2X + boxW - 22 - i * 26, pad + 60, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }
  }

  // P2 damage
  const d2 = Math.floor(f2.damage);
  const dc2 = d2 > 350 ? '#FF4444' : d2 > 200 ? '#FFAA44' : '#FFFFFF';
  ctx.fillStyle = dc2;
  ctx.font = 'bold 36px Rajdhani, sans-serif';
  ctx.fillText(d2 + '%', p2X + boxW - 130, pad + 68);

  // P2 super bar (fills from right)
  const sb2X = p2X + 20, sb2Y = pad + 52, sb2W = 200, sb2H = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, sb2X, sb2Y, sb2W, sb2H, 4); ctx.fill();
  const sp2 = Math.min(1, f2.superMeter / f2.maxSuper);
  ctx.fillStyle = sp2 >= 1 ? '#FFDD44' : '#9966FF';
  if (sp2 >= 1) { ctx.shadowColor = '#FFDD44'; ctx.shadowBlur = 12; }
  roundRect(ctx, sb2X + sb2W * (1 - sp2), sb2Y, sb2W * sp2, sb2H, 4); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  roundRect(ctx, sb2X, sb2Y, sb2W, sb2H, 4); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Rajdhani, sans-serif';
  ctx.fillText('SUPER', sb2X + sb2W - 2, sb2Y - 4);

  // P2 power bar
  const pb2X = p2X + 20, pb2Y = pad + 76, pb2W = 200, pb2H = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, pb2X, pb2Y, pb2W, pb2H, 3); ctx.fill();
  const pwrReady2 = f2.powerCooldown <= 0;
  const pwrPct2 = pwrReady2 ? 1 : 1 - f2.powerCooldown / (f2._maxPowerCooldown || 300);
  ctx.fillStyle = pwrReady2 ? '#44FF66' : '#666688';
  roundRect(ctx, pb2X + pb2W * (1 - pwrPct2), pb2Y, pb2W * pwrPct2, pb2H, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  roundRect(ctx, pb2X, pb2Y, pb2W, pb2H, 3); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Rajdhani, sans-serif';
  ctx.fillText('POWER', pb2X + pb2W - 2, pb2Y - 3);

  // ── Timer (center) ──
  const mins = Math.floor(Math.max(0, matchTime) / 60);
  const secs = Math.floor(Math.max(0, matchTime) % 60);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, W / 2 - 55, pad, 110, 54, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = matchTime < 30 ? '#FF4444' : '#fff';
  ctx.font = 'bold 30px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W / 2, pad + 38);
}

export default function GCMatch({ p1Char, p2Char, p1IsHuman, p2IsHuman, p1Scheme, p2Scheme, cpuDifficulty = 'regular', settings = {}, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, p1Element = 'basic', p2Element = 'basic', sfxVolume = 70, musicVolume = 50, isFinalMatch = false, onEnd, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  // Generate bot cosmetics for non-human players (cached for entire match)
  const botCharIds = [];
  if (!p1IsHuman) botCharIds.push(p1Char);
  if (!p2IsHuman) botCharIds.push(p2Char);
  const mergedAccsRef = useRef(null);
  if (!mergedAccsRef.current) {
    mergedAccsRef.current = botCharIds.length > 0
      ? mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIds)
      : { equippedAccessories: {}, equippedShikigami: {} };
  }
  const allAccessories = { ...equippedAccessories, ...mergedAccsRef.current.equippedAccessories };
  const equippedShikigamiRef = useRef({ ...equippedShikigami, ...mergedAccsRef.current.equippedShikigami });
  equippedShikigamiRef.current = { ...equippedShikigami, ...mergedAccsRef.current.equippedShikigami };

  const c1 = ALL_CHARS_MAP[p1Char] || ALL_CHARS_MAP['yellow'];
  const c2 = ALL_CHARS_MAP[p2Char] || ALL_CHARS_MAP['purple'];
  const col1 = c1.color || '#FFD700';
  const col2 = c2.color || '#9933FF';

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    // Grand Circuit uses a curated track pool; Final match always uses the Final track
    const trackUrl = isFinalMatch
      ? GRAND_CIRCUIT_FINAL_TRACK
      : GRAND_CIRCUIT_TRACKS[Math.floor(Math.random() * GRAND_CIRCUIT_TRACKS.length)];
    music.playTrack(trackUrl);
    return () => music.stop();
  }, [musicVolume, sfxVolume, isFinalMatch]);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 800); return () => clearTimeout(t); }
    setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const kb = getKeybinds(settings);
    const p1Binds = p1IsHuman ? getSchemeKeybinds(settings, p1Scheme) : kb.p1;
    const p2Binds = p2IsHuman ? getSchemeKeybinds(settings, p2Scheme) : kb.p2;

    const stats1 = applyElement(c1.stats, p1Element);
    const stats2 = applyElement(c2.stats, p2Element);
    const f1 = createFighter({ ...c1, stats: stats1 }, 400, 600, 1);
    f1.gameMode = 'brawl'; f1._isBR = true; f1.stocks = STOCKS;
    f1.knockbackMul = KNOCKBACK_REDUCTION;
    f1.maxSuper = SUPER_MAX; f1.superMeter = 0;
    f1.respawnPoint = { x: 400, y: 600 };
    f1._gcNoRetreat = true; // Grand Circuit bots never run away
    f1._gcNoBlast = true; // Grand Circuit: never lose stock from blast zone
    const f2 = createFighter({ ...c2, stats: stats2 }, 880, 600, -1);
    f2.gameMode = 'brawl'; f2._isBR = true; f2.stocks = STOCKS;
    f2.knockbackMul = KNOCKBACK_REDUCTION;
    f2.maxSuper = SUPER_MAX; f2.superMeter = 0;
    f2.respawnPoint = { x: 880, y: 600 };
    f2._gcNoRetreat = true; // Grand Circuit bots never run away
    f2._gcNoBlast = true; // Grand Circuit: never lose stock from blast zone
    f1._allOpponents = [f2]; f2._allOpponents = [f1];

    const keys = {};
    const kd = e => {
      keys[e.key] = true; keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { pausedRef.current = !pausedRef.current; setPaused(v => !v); }
      // Emotes — number keys 1-0
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const _emoteMode = (p1IsHuman && p2IsHuman) ? 'coop' : 'solo';
        if (_emoteMode === 'coop' && ['1','2','3','4','5'].includes(e.key)) {
          const emote = getEmoteForKey(e.key, equippedEmotes, 2, 'coop');
          if (emote && f2.grounded && !f2.emote) f2.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0 };
        } else {
          const emote = getEmoteForKey(e.key, equippedEmotes, 1, _emoteMode);
          if (emote && f1.grounded && !f1.emote) f1.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0 };
        }
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let frame = 0;
    let matchTime = TIME_LIMIT;
    let finished = false;

    const loop = (now) => {
      if (finished) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      frame++;

      if (!pausedRef.current) {
        matchTime -= dt;

        // Track max power cooldown for bar rendering
        if (f1.powerCooldown > (f1._maxPowerCooldown || 0)) f1._maxPowerCooldown = f1.powerCooldown;
        if (f2.powerCooldown > (f2._maxPowerCooldown || 0)) f2._maxPowerCooldown = f2.powerCooldown;

        const gp1 = settings?.controllerEnabled !== false ? readGamepadInput(0) : null;
        let rawP1 = p1IsHuman ? mergeGp(readPlayerInput(keys, p1Binds), gp1) : updateAI(f1, f2, cpuDifficulty, BOX_PLATFORMS);
        const gp2 = settings?.controllerEnabled !== false ? readGamepadInput(1) : null;
        let rawP2 = p2IsHuman ? mergeGp(readPlayerInput(keys, p2Binds), gp2) : updateAI(f2, f1, cpuDifficulty, BOX_PLATFORMS);
        // Emote movement lock — if emote active, force no input
        if (f1.emote && f1.emote.timer > 0) rawP1 = NO_INPUT;
        if (f2.emote && f2.emote.timer > 0) rawP2 = NO_INPUT;

        updateFighter(f1, rawP1, BOX_PLATFORMS, W, H, f2);
        updateFighter(f2, rawP2, BOX_PLATFORMS, W, H, f1);
        // Update emote timers — cancel if airborne, decrement timer, update progress
        [f1, f2].forEach(f => {
          if (f.emote && f.emote.timer > 0) {
            if (!f.grounded) { f.emote = null; }
            else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) f.emote = null; }
          }
        });
        // Arena escape prevention — only triggers when a fighter has truly tunneled
        // THROUGH a wall (beyond the platform bounds), not when standing on the floor.
        // Floor top is at y=690; a fighter standing there is at y=690, which is < 720,
        // so this check leaves normal gameplay untouched.
        for (const f of [f1, f2]) {
          if (f.x < 30) { f.x = 35; if (f.vx < 0) f.vx = 0; }
          if (f.x > W - 30) { f.x = W - 35; if (f.vx > 0) f.vx = 0; }
          if (f.y < 30) { f.y = 85; if (f.vy < 0) f.vy = 0; }
          if (f.y > H) { f.y = 690; f.vy = 0; f.grounded = true; f.jumps = f.maxJumps; }
        }
        updateProjectiles(f1, f2);
        updateProjectiles(f2, f1);

        for (const [a, d] of [[f1, f2], [f2, f1]]) {
          if (!a.attackData || a.attackData.hitApplied) continue;
          const p = a.attackData.progress || 0;
          if (p < 0.08 || p > 0.85) continue;
          if (checkHit(a, d)) {
            applyHit(a, d);
            if (a.attackData.isSuper) sfx.superImpact(); else if (a.attackData.isHeavy) sfx.heavyHit(); else sfx.hit();
          }
        }

        for (const f of [f1, f2]) {
          if (f.damage >= KO_DAMAGE && f.stocks > 0 && !f._pendingDeath) f._pendingDeath = true;
          if (f._pendingDeath && f.stocks > 0) {
            f._pendingDeath = false;
            f.respawnPoint = { x: f.x, y: f.y };
            loseStock(f, W, H);
          }
        }

        if (matchTime <= 0) {
          finished = true;
          let winner;
          if (f1.stocks > f2.stocks) winner = p1Char;
          else if (f2.stocks > f1.stocks) winner = p2Char;
          else if (f1.damage < f2.damage) winner = p1Char;
          else if (f2.damage < f1.damage) winner = p2Char;
          else winner = Math.random() < 0.5 ? p1Char : p2Char;
          setTimeout(() => onEnd?.(winner), 100);
          return;
        }

        if (f1.stocks <= 0 || f2.stocks <= 0) {
          finished = true;
          const winner = f1.stocks > 0 ? p1Char : p2Char;
          setTimeout(() => onEnd?.(winner), 200);
          return;
        }
      }

      // ── Render — clear fully each frame to prevent smear ──
      ctx.clearRect(0, 0, W, H);

      // Split City backdrop (opaque — this is what you see)
      drawStageBackground(ctx, W, H, frame, 'splitcity');

      // Very transparent character-colored tint (barely visible)
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, hexToRgba(col1, 0.04));
      grad.addColorStop(0.5, hexToRgba(col1, 0.01));
      grad.addColorStop(0.5, hexToRgba(col2, 0.01));
      grad.addColorStop(1, hexToRgba(col2, 0.04));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Thin border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      const drawF = (f, charData, isP1) => {
        const skinColor = isP1 ? getCharRenderColor(charData?.id, equippedSkins) : null;
        const col = skinColor || charData?.color || '#FFD700';
        const accs = getEquippedAccessories(allAccessories, charData?.id);
        const flashing = f.invincible > 0 && Math.floor((f.frame || 0) / 4) % 2 === 0;

        if (!flashing) {
          ctx.save(); ctx.globalAlpha = 0.2;
          ctx.fillStyle = col; ctx.beginPath();
          ctx.ellipse(f.x, f.y + 3, 32, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
        if (!flashing) accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, resolveAccColor(a, charData), f.frame || 0, 1, charData?.id, f.state, f.facing, f.powerActive));
        if (!flashing) drawStickman(ctx, f.x, f.y, col, f.facing, f.frame || 0, 1, charData?.isSpirit, f.state, charData, f.powerActive, false, null, f.emote);
        if (!flashing) accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, resolveAccColor(a, charData), f.frame || 0, 1, charData?.id, f.state, f.facing, f.powerActive));
        drawShikigamiFollower(ctx, f, equippedShikigamiRef.current?.[charData?.id], f.frame || 0, 1);

        if (f.attackData && (f.state === 'attacking' || f.state === 'superAttack')) {
          if (f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, col, f.attackData.progress, charData?.superMove?.name, charData?.id);
          else drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || col, f.attackData.isNormal, charData?.id, charData?.power, f.powerActive);
        }
        if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame || 0, he.spawnFrame));
        drawProjectiles(ctx, f);

        // Sig/heavy cooldown bars under fighter
        if (f.sigCooldown > 0) { const cdPct = 1 - f.sigCooldown / 28; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 10, 40, 4, 2); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 10, 40 * cdPct, 4, 2); ctx.fill(); }
        if (f.heavyCooldown > 0) { const cdPct = 1 - f.heavyCooldown / 32; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 16, 40, 3, 2); ctx.fill(); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 16, 40 * cdPct, 3, 2); ctx.fill(); }
      };
      drawF(f1, c1, true);
      drawF(f2, c2, false);

      drawGCHUD(ctx, f1, f2, c1, c2, col1, col2, matchTime, settings?.hideStockBoxes);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted]);

  return (
    <div className="relative flex flex-col items-center w-full">
      <div className="flex justify-between w-full max-w-[1280px] mb-1">
        <button onClick={() => onEnd?.(p2Char)} className="px-3 py-1 bg-destructive/80 text-destructive-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Forfeit</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause (ESC)</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        className="border-2 border-border rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }} />
      {countdown > 0 && !settings?.hideCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg" style={{ maxWidth: '1280px' }}>
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !countdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg" style={{ maxWidth: '1280px' }}>
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl font-heading text-accent">PAUSED</span>
            <div className="flex gap-2">
              <button onClick={() => { pausedRef.current = false; setPaused(false); }} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm">RESUME</button>
              <button onClick={() => onEnd?.(p2Char)} className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg font-heading text-sm">FORFEIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}