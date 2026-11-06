import GameCanvasPortal from './GameCanvasPortal.jsx';
// Grand Circuit match — box-stage fight with Split City backdrop.
// 2 stocks, 85% reduced knockback, 500% damage = KO, 6-minute timer, harder super buildup.

import React, { useRef, useEffect, useState } from 'react';
import { MatchPausePortal, MatchPauseButtonPortal } from './PauseLayerPortal.jsx';
import { ALL_CHARS_MAP } from './allCharacters.js';
import { createFighter, updateFighter, updateProjectiles, checkHit, applyHit, updateAI, loseStock } from './fighter.js';
import { drawStickman, drawAttackEffect, drawSuperEffect, drawHitSparks, drawDoubleJumpParticles, drawPlayerStatusIndicator, drawCompactPlayerMeters } from './renderer.js';
import { updateResonanceMatch, drawResonanceOrb, drawResonanceRangeGlow, getConstructAttackGeometry, drawConstructWeapon } from './resonanceConstructs.js';
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
import { music } from './music.js';
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

// Compact player-and-match HUD for Grand Circuit.
function drawGCHUD(ctx, f1, f2, c1, c2, matchTime) {
  drawPlayerStatusIndicator(ctx, { x: W - 246, y: 42, playerNumber: 1, color: c1.color, name: c1.name, fighter: f1, stocks: f1.stocks, damage: f1.damage });
  drawPlayerStatusIndicator(ctx, { x: W - 246, y: 96, playerNumber: 2, color: c2.color, name: c2.name, fighter: f2, stocks: f2.stocks, damage: f2.damage });
  const mins = Math.floor(Math.max(0, matchTime) / 60);
  const secs = Math.floor(Math.max(0, matchTime) % 60);
  ctx.save();
  ctx.fillStyle = matchTime < 30 ? '#FF6666' : '#FFFFFF';
  ctx.font = 'bold 24px Orbitron, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W - 18, 32);
  ctx.restore();
}

export default function GCMatch({ p1Char, p2Char, p1IsHuman, p2IsHuman, p1Scheme, p2Scheme, cpuDifficulty = 'regular', settings = {}, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, p1Element = 'basic', p2Element = 'basic', sfxVolume = 70, musicVolume = 50, isFinalMatch = false, onEnd, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  useEffect(() => {
    window.__el6GameplayActive = true;
    window.__el6GameplayCaptureActive = gameStarted;
    return () => { window.__el6GameplayActive = false; window.__el6GameplayCaptureActive = false; };
  }, [gameStarted]);
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
    music.setMatchSeed(`grand-circuit-${isFinalMatch ? 'final' : Date.now()}-${p1Char}-${p2Char}`);
    music.play('grandcircuit');
    return () => { music.clearMatchSeed(); music.stop(); };
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
    if (!p1IsHuman) f1._gcBot = true;
    if (!p2IsHuman) f2._gcBot = true;
    const resonanceMatch = { frame: 0, orb: null, spawnWait: 150 + Math.random()*120 };

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
        if (f1.emote && f1.emote.timer > 0) rawP1 = { ...NO_INPUT };
        if (f2.emote && f2.emote.timer > 0) rawP2 = { ...NO_INPUT };

        // Grand Circuit uses the same Resonance orb/construct combat rules as other fight modes.
        updateResonanceMatch(resonanceMatch, [f1,f2], [rawP1,rawP2], BOX_PLATFORMS, W, H, dt);
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
      if (resonanceMatch.orb) drawResonanceOrb(ctx, resonanceMatch.orb, resonanceMatch.frame);
      for (const f of [f1,f2]) if (resonanceMatch.orb) drawResonanceRangeGlow(ctx,f,resonanceMatch.orb,resonanceMatch.frame);

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
        if (!flashing) accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, resolveAccColor(a, charData), f.frame || 0, 1, charData?.id, f.state, f.facing, f.powerActive, f.emote));
        if (!flashing) drawStickman(ctx, f.x, f.y, col, f.facing, f.frame || 0, 1, (f.resonanceActive ? f.char : charData)?.isSpirit, f.state, f.resonanceActive ? f.char : charData, f.powerActive, false, null, f.emote, f.attackData);
        if (!flashing && f.resonanceActive) { try { drawConstructWeapon(ctx,f,1); } catch (error) { console.error('[Grand Circuit Resonance] Weapon render failed safely:',error); } }
        // Attack hitboxes remain invisible during normal play; no red guide/outline is drawn.
        if (!flashing) accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, resolveAccColor(a, charData), f.frame || 0, 1, charData?.id, f.state, f.facing, f.powerActive, f.emote));
        drawShikigamiFollower(ctx, f, equippedShikigamiRef.current?.[charData?.id], f.frame || 0, 1);

        if (f.attackData && (f.state === 'attacking' || f.state === 'attackHold' || f.state === 'superAttack')) {
          if (f.state === 'superAttack' && !f.resonanceActive) drawSuperEffect(ctx, f.x, f.y, col, f.attackData.progress, charData?.superMove?.name, charData?.id);
          else drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.holding ? (-1 - Math.max(0, Math.min(1, f.attackData.holdProgress || 0))) : f.attackData.progress, f.facing, f.attackData.color || col, f.attackData.isNormal, charData?.id, charData?.power, f.powerActive);
        }
        if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame || 0, he.spawnFrame));
        drawProjectiles(ctx, f);

      };
      drawF(f1, c1, true);
      drawF(f2, c2, false);

      drawGCHUD(ctx, f1, f2, c1, c2, matchTime);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted]);

  return (
    <div className="el6-match-viewport relative flex flex-col items-center w-full">
      <div className="flex justify-between w-full max-w-[1280px] mb-1">
        <button onClick={() => onEnd?.(p2Char)} className="px-3 py-1 bg-destructive/80 text-destructive-foreground rounded font-body text-xs hover:opacity-80"><GameIcon icon="info" size={14} /> Forfeit</button>
        <MatchPauseButtonPortal>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="el6-controller-pause-trigger el6-match-pause-button px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"> Pause (ESC)</button>
        </MatchPauseButtonPortal>
      </div>
      <GameCanvasPortal>
        <canvas ref={canvasRef} width={W} height={H} data-e6-game-canvas="true"
                className="el6-match-canvas el6-fight-canvas border-2 border-border rounded-lg shadow-2xl w-full"
                style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }} />
      </GameCanvasPortal>
      {countdown > 0 && !settings?.hideCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg" style={{ maxWidth: '1280px' }}>
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !countdown && (
        <MatchPausePortal>
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl font-heading text-accent">PAUSED</span>
              <div className="flex gap-2">
                <button onClick={() => { pausedRef.current = false; setPaused(false); }} className="el6-controller-pause-trigger px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm">RESUME</button>
                <button onClick={() => onEnd?.(p2Char)} className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg font-heading text-sm">FORFEIT</button>
              </div>
            </div>
          </div>
        </MatchPausePortal>
      )}
    </div>
  );
}
