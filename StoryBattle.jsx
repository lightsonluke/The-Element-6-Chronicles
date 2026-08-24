import React, { useRef, useEffect, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { POWER_EFFECTS } from './powerEffects.js';
import {
  createFighter, updateFighter, checkHit, applyHit, updateAI
} from './fighter.js';
import {
  drawStickman, drawAttackEffect, drawSuperEffect,
  drawHealthBar, drawTimer, drawPlatforms, drawBackground,
  drawHitSparks, drawSuperFlash
} from './renderer.js';
import { getVillainStage, STORY_STAGE_PLATFORMS } from './storyStages.js';
import { music } from './music.js';
import { getAccessory, getEquippedAccessories, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { drawShikigamiFollower } from './shikigami.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { getEmoteForKey } from './emoteSlots.js';
import GameIcon from "./GameIcon.jsx";

const W = 960, H = 560;

export default function StoryBattle({ heroId, villainId, enemyIds, allyIds, stageId, difficulty = 'hard', battleTitle, onEnd, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, settings = {}, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const [result, setResult] = useState(null);
  // All non-hero fighters (villains, enemies, allies) are CPU — give them random cosmetics
  const botCharIds = [villainId, ...(enemyIds || []), ...(allyIds || [])].filter(Boolean);
  const { equippedAccessories: mergedAccessories, equippedShikigami: mergedShikigami } = mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIds);
  const botAccessoriesRef = useRef(mergedAccessories);
  botAccessoriesRef.current = mergedAccessories;
  const equippedShikigamiRef = useRef(mergedShikigami);
  equippedShikigamiRef.current = mergedShikigami;

  const isMulti = !!(enemyIds && enemyIds.length > 0);
  const getCharData = (id) => HEROES.find(h => h.id === id) || VILLAINS.find(v => v.id === id) || GUARDIANS.find(g => g.id === id);

  useEffect(() => {
    music.play('fight');
    return () => music.stop();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hero = getCharData(heroId);
    if (!hero) return;

    // ── Stage setup ──
    let mapId, platforms;
    if (isMulti) {
      const sid = stageId || 'voidplane';
      mapId = sid;
      platforms = STORY_STAGE_PLATFORMS[sid] || STORY_STAGE_PLATFORMS.voidplane;
    } else {
      const villain = getCharData(villainId);
      if (!villain) return;
      const stage = getVillainStage(villainId);
      mapId = stage.id;
      platforms = stage.platforms;
    }
    const spawnY = platforms[0].y;

    // ── Create player team ──
    const playerTeam = [];
    const f1 = createFighter(hero, 180, spawnY, 1);
    f1.grounded = true;
    f1.team = 'player';
    playerTeam.push(f1);

    // Allies (for 4v2 — guardians join the player)
    (allyIds || []).forEach((aid, i) => {
      const aChar = getCharData(aid);
      if (!aChar) return;
      const af = createFighter(aChar, 260 + i * 65, spawnY, 1);
      af.grounded = true;
      af.isAI = true;
      af.cpuDifficulty = difficulty;
      af.team = 'player';
      af.stocks = 2;
      playerTeam.push(af);
    });

    // ── Create enemy team ──
    // Story-mode secret: Evil gets boosted stats (all 10s) for the final boss battle
    const enemyTeam = [];
    if (isMulti) {
      enemyIds.forEach((eid, i) => {
        let eChar = getCharData(eid);
        if (!eChar) return;
        if (eChar.id === 'evil') eChar = { ...eChar, stats: { power: 10, speed: 10, defense: 10, utility: 10, control: 10 } };
        const ef = createFighter(eChar, 780 - i * 65, spawnY, -1);
        ef.grounded = true;
        ef.isAI = true;
        ef.cpuDifficulty = difficulty;
        ef.team = 'enemy';
        ef.stocks = eChar.isFinalBoss ? 4 : 2;
        enemyTeam.push(ef);
      });
    } else {
      let villain = getCharData(villainId);
      // Story-mode secret: Evil gets boosted stats (all 10s) for the final boss battle
      if (villain && villain.id === 'evil') villain = { ...villain, stats: { power: 10, speed: 10, defense: 10, utility: 10, control: 10 } };
      const f2 = createFighter(villain, 780, spawnY, -1);
      f2.grounded = true;
      f2.isAI = true;
      f2.cpuDifficulty = difficulty;
      f2.team = 'enemy';
      f2.stocks = villain.isFinalBoss ? 5 : villain.encounterOrder >= 10 ? 4 : 3;
      enemyTeam.push(f2);
    }

    // Snapshot starting stocks so the HUD renders the full rack (story's
    // villain/multi-battle stock model differs from the engine default of 3).
    [...playerTeam, ...enemyTeam].forEach(f => { f.maxStocks = f.stocks; });

    // Set _allOpponents on every fighter so multi-target powers (pull_all, gravity_flip, etc.)
    // work correctly in story battles — matching the normal fight engine behavior.
    const allFighters = [...playerTeam, ...enemyTeam];
    allFighters.forEach(f => {
      f._allOpponents = allFighters.filter(o => o.team !== f.team && o.stocks > 0);
    });
    // Refresh _allOpponents each frame to account for stocks changes (handled in the loop below).

    const findNearestEnemy = (fighter) => {
      const enemies = fighter.team === 'enemy' ? playerTeam : enemyTeam;
      const living = enemies.filter(f => f.stocks > 0);
      if (living.length === 0) return enemies[0];
      let nearest = living[0], minD = Infinity;
      for (const e of living) {
        const d = Math.abs(e.x - fighter.x) + Math.abs(e.y - fighter.y);
        if (d < minD) { minD = d; nearest = e; }
      }
      return nearest;
    };

    let timer = 150;
    let lastTime = performance.now();
    let camX = 0, camY = 0, camZoom = 1, shakeX = 0, shakeY = 0, shakeMag = 0;
    let superFlash = null;
    gameRef.current = { playerTeam, enemyTeam, timer, running: true };

    const handleKey = (e, down) => {
      keysRef.current[e.key] = down;
      keysRef.current[e.key.toLowerCase()] = down;
      // Emotes — number keys 1-0 (solo mode, player is f1)
      if (down && ['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const emote = getEmoteForKey(e.key, equippedEmotes, 1, 'solo');
        if (emote && f1.grounded && !f1.emote) f1.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0 };
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const kd = e => handleKey(e, true);
    const ku = e => handleKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const loop = (now) => {
      if (!gameRef.current?.running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      gameRef.current.timer -= dt;

      const { playerTeam: pTeam, enemyTeam: eTeam } = gameRef.current;
      const playerAlive = pTeam.some(f => f.stocks > 0);
      const enemyAlive = eTeam.some(f => f.stocks > 0);

      if (gameRef.current.timer <= 0 || !playerAlive || !enemyAlive) {
        gameRef.current.running = false;
        // If timer runs out, the team with more total stocks wins
        let win;
        if (!playerAlive) win = false;
        else if (!enemyAlive) win = true;
        else {
          const pStocks = pTeam.reduce((s, f) => s + Math.max(0, f.stocks), 0);
          const eStocks = eTeam.reduce((s, f) => s + Math.max(0, f.stocks), 0);
          win = pStocks >= eStocks;
        }
        setResult(win ? 'win' : 'lose');
        return;
      }

      const k = keysRef.current;

      // Refresh _allOpponents each frame so multi-target powers track stock changes
      const allLive = [...pTeam, ...eTeam];
      allLive.forEach(f => {
        f._allOpponents = allLive.filter(o => o.team !== f.team && o.stocks > 0);
      });

      // ── Update all fighters ──
      pTeam.forEach((fighter, i) => {
        if (fighter.stocks <= 0) return;
        let inputs;
        if (i === 0) {
          inputs = {
            left: k['ArrowLeft'], right: k['ArrowRight'],
            jump: k['ArrowUp'], up: k['ArrowUp'], down: k['ArrowDown'],
            sig: k[','], power: k['.'], superMove: k['/'], heavy: k['l'],
          };
          // Emote movement lock — if emote active, force no input
          if (fighter.emote && fighter.emote.timer > 0) inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
        } else {
          const target = findNearestEnemy(fighter);
          inputs = updateAI(fighter, target, difficulty, platforms);
        }
        const target = findNearestEnemy(fighter);
        updateFighter(fighter, inputs, platforms, W, H, target);
      });
      eTeam.forEach(fighter => {
        if (fighter.stocks <= 0) return;
        const target = findNearestEnemy(fighter);
        const inputs = updateAI(fighter, target, difficulty, platforms);
        updateFighter(fighter, inputs, platforms, W, H, target);
      });

      // ── Update emote timers — cancel if airborne, decrement timer, update progress ──
      [...pTeam, ...eTeam].forEach(f => {
        if (f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) f.emote = null; }
        }
      });

      // ── Super flash detection ──
      [...pTeam, ...eTeam].forEach(f => {
        const isSuper = f.state === 'superAttack';
        if (f._wasSuper !== isSuper) {
          if (isSuper) {
            superFlash = { name: f.char.superMove?.name, color: f.char.color, progress: 0 };
            shakeMag = 18;
          }
          f._wasSuper = isSuper;
        }
      });

      // ── Hit detection across teams ──
      pTeam.forEach(attacker => {
        if (attacker.stocks <= 0 || !attacker.attackData || attacker.attackData.hitApplied) return;
        eTeam.forEach(defender => {
          if (defender.stocks <= 0) return;
          if (checkHit(attacker, defender)) { applyHit(attacker, defender); shakeMag = Math.max(shakeMag, 7); }
        });
      });
      eTeam.forEach(attacker => {
        if (attacker.stocks <= 0 || !attacker.attackData || attacker.attackData.hitApplied) return;
        pTeam.forEach(defender => {
          if (defender.stocks <= 0) return;
          if (checkHit(attacker, defender)) { applyHit(attacker, defender); shakeMag = Math.max(shakeMag, 7); }
        });
      });

      // ── Dynamic camera ──
      const living = [...pTeam, ...eTeam].filter(f => f.stocks > 0);
      if (living.length > 0) {
        if (isMulti) {
          // Multi: center on all living fighters, zoom out to fit
          let minX = Infinity, maxX = -Infinity, sumY = 0;
          living.forEach(f => {
            minX = Math.min(minX, f.x);
            maxX = Math.max(maxX, f.x);
            sumY += f.y;
          });
          const midX = (minX + maxX) / 2;
          const midY = sumY / living.length - 40;
          const spread = maxX - minX;
          const targetZoom = Math.max(0.62, Math.min(1.0, 1.0 - spread / 1600));
          camZoom += (targetZoom - camZoom) * 0.05;
          const targetCamX = (midX - W / 2) * (1 - camZoom) * 0.35;
          const targetCamY = (midY - H / 2) * (1 - camZoom) * 0.35;
          camX += (targetCamX - camX) * 0.07;
          camY += (targetCamY - camY) * 0.07;
        } else {
          // 1v1: existing camera logic
          const fdx = Math.abs(eTeam[0].x - pTeam[0].x);
          const fdy = Math.abs(eTeam[0].y - pTeam[0].y);
          const targetZoom = Math.max(0.82, Math.min(1.0, 1.0 - fdx / 1200 - fdy / 1000));
          camZoom += (targetZoom - camZoom) * 0.05;
          const midX = (pTeam[0].x + eTeam[0].x) / 2;
          const midY = ((pTeam[0].y + eTeam[0].y) / 2) - 60;
          const targetCamX = (midX - W / 2) * (1 - camZoom) * 0.35;
          const targetCamY = (midY - H / 2) * (1 - camZoom) * 0.35;
          camX += (targetCamX - camX) * 0.07;
          camY += (targetCamY - camY) * 0.07;
        }
      }
      if (shakeMag > 0.3) {
        shakeX = (Math.random() - 0.5) * shakeMag;
        shakeY = (Math.random() - 0.5) * shakeMag;
        shakeMag *= 0.72;
      } else { shakeX = 0; shakeY = 0; shakeMag = 0; }

      // ── Render with camera ──
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.restore();

      ctx.save();
      ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-W / 2 - camX, -H / 2 - camY);

      drawBackground(ctx, W, H, f1.frame, mapId);
      drawPlatforms(ctx, platforms, f1.frame, mapId);

      [...pTeam, ...eTeam].forEach(f => {
        if (f.stocks <= 0) return;
        const flashing = f.invincible > 0 && Math.floor(f.frame / 4) % 2 === 0;
        const renderColor = getCharRenderColor(f.char.id, equippedSkins) || f.char.color;
        if (!flashing) {
          const skinParts = getSkinParts(f.char.id, equippedSkins);
          const accs = getEquippedAccessories(botAccessoriesRef.current, f.char.id);
          const skinColor = getCharRenderColor(f.char.id, equippedSkins);
          skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1.05, f.char.id, f.state, f.facing, f.powerActive));
          accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, 1.05, f.char.id, f.state, f.facing, f.powerActive));
        }
        drawShikigamiFollower(ctx, f, equippedShikigamiRef.current?.[f.char.id], f.frame, 1.05);
        if (!flashing) drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame, 1.05, f.char.isSpirit, f.state, f.char, f.powerActive, false, null, f.emote);
        if (!flashing) {
          const skinParts = getSkinParts(f.char.id, equippedSkins);
          const accs = getEquippedAccessories(botAccessoriesRef.current, f.char.id);
          const skinColor = getCharRenderColor(f.char.id, equippedSkins);
          skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, 1.05, f.char.id, f.state, f.facing, f.powerActive));
          accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, 1.05, f.char.id, f.state, f.facing, f.powerActive));
        }
        if (f.attackData && f.state === 'attacking') {
          drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || renderColor, f.attackData.isNormal, f.char.id, f.char.power, f.powerActive);
        }
        if (f.attackData && f.state === 'superAttack') {
          drawSuperEffect(ctx, f.x, f.y, renderColor, f.attackData.progress, f.char.superMove?.name, f.char.id);
        }
        if (f.hitEffects) {
          f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame, he.spawnFrame));
        }
      });
      ctx.restore();

      drawTimer(ctx, W, gameRef.current.timer);

      // Super flash overlay
      if (superFlash) {
        superFlash.progress += dt * 0.55;
        drawSuperFlash(ctx, W, H, superFlash.name, superFlash.color, superFlash.progress);
        if (superFlash.progress >= 1) superFlash = null;
      }

      // ── HUD ──
      if (isMulti) {
        drawMultiHUD(ctx, pTeam, eTeam, W, H, battleTitle, settings?.hideStockBoxes);
      } else {
        drawSoloHUD(ctx, pTeam[0], eTeam[0], W, H, settings?.hideStockBoxes);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      if (gameRef.current) gameRef.current.running = false;
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [heroId, villainId, isMulti, enemyIds?.join(','), allyIds?.join(','), stageId, difficulty]);

  // Suppress controller menu-nav during the active battle so the A button doesn't
  // accidentally click Retreat; re-enable when the battle ends so CONTINUE is clickable.
  useEffect(() => {
    window.__el6GameplayActive = !result;
    return () => { window.__el6GameplayActive = false; };
  }, [result]);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex justify-between items-center w-full px-1">
        <button
          onClick={() => { if (gameRef.current) gameRef.current.running = false; onEnd(false); }}
          className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"
        ><GameIcon emoji="←" size={14} /> Retreat (forfeit)</button>
        {battleTitle && <span className="text-[10px] font-heading text-accent tracking-wider">{battleTitle}</span>}
        <span className="text-[10px] text-muted-foreground font-body">Arrows · , sig · ,+ '↑' recovery · . power · l side heavy · l+ '↓' down/pound · / super</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="border-2 border-destructive/50 rounded-lg shadow-2xl" style={{ maxWidth: '100%' }} />
      {result && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg gap-4">
          <span className={`text-4xl font-heading ${result === 'win' ? 'text-accent' : 'text-destructive'}`}>
            {result === 'win' ? 'VICTORY!' : 'DEFEATED'}
          </span>
          <button
            onClick={() => onEnd(result === 'win')}
            className="px-6 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80"
          >
            CONTINUE
          </button>
        </div>
      )}
    </div>
  );
}

// ── 1v1 HUD (unchanged from original) ─────────────────────────────────────────
function drawSoloHUD(ctx, f1, f2, W, H, hideStocks) {
  const hero = f1.char, villain = f2.char;
  if (!hideStocks) {
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(0, H - 68, W, 68);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 68);
    ctx.lineTo(W, H - 68);
    ctx.stroke();
  }

  drawHealthBar(ctx, 220, H - 58, f1.damage, 200, hero.color, hero.name, f1.stocks, null, 0, 0, 'left', false, hideStocks);
  drawHealthBar(ctx, W - 220, H - 58, f2.damage, 200, villain.color, villain.name, f2.stocks, null, 0, 0, 'left', false, hideStocks);

  drawPowerBar(ctx, f1, 40, H - 22, 100, 6);
  drawPowerBar(ctx, f2, W - 140, H - 22, 100, 6);
  drawSuperMeter(ctx, f1, 40, H - 10);
  drawSuperMeter(ctx, f2, W - 140, H - 10);

  ctx.fillStyle = villain.color;
  ctx.font = 'bold 14px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText(`${villain.name} — ${villain.title}`, W / 2, H - 54);
}

// ── Multi-fighter HUD ─────────────────────────────────────────────────────────
function drawMultiHUD(ctx, pTeam, eTeam, W, H, battleTitle, hideStocks) {
  if (!hideStocks) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, H - 72, W, 72);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 72);
    ctx.lineTo(W, H - 72);
    ctx.stroke();
  }

  // Player team (left)
  const pBarW = Math.min(130, (W * 0.40) / Math.max(pTeam.length, 1));
  pTeam.forEach((f, i) => {
    drawCompactBar(ctx, 8 + i * (pBarW + 4), H - 62, pBarW, f, false, hideStocks);
  });

  // Enemy team (right, reversed so first enemy is rightmost)
  const eBarW = Math.min(130, (W * 0.40) / Math.max(eTeam.length, 1));
  eTeam.forEach((f, i) => {
    const x = W - 8 - (i + 1) * (eBarW + 4);
    drawCompactBar(ctx, x, H - 62, eBarW, f, true, hideStocks);
  });

  // Player power + super bars
  drawPowerBar(ctx, pTeam[0], 40, H - 22, 100, 6);
  drawSuperMeter(ctx, pTeam[0], 40, H - 10);

  // Battle title at top center
  if (battleTitle) {
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 13px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(battleTitle, W / 2, H - 50);
    ctx.shadowBlur = 0;
  }
}

function drawCompactBar(ctx, x, y, w, fighter, isEnemy, hideStocks) {
  if (hideStocks) return; // hide stock boxes = hide the entire compact bar including background
  const h = 10;
  ctx.fillStyle = 'rgba(8,8,18,0.88)';
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 13, w + 6, h + 32, 5);
  ctx.fill();
  ctx.strokeStyle = (fighter.char.color || '#888') + '44';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#111122';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3);
  ctx.fill();

  const dmgPct = Math.min(fighter.damage / 200, 1);
  const dmgColor = dmgPct < 0.3 ? '#44FF88' : dmgPct < 0.6 ? '#FFFF44' : dmgPct < 0.85 ? '#FF8844' : '#FF2222';
  ctx.fillStyle = dmgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w * dmgPct, h, 3);
  ctx.fill();

  // Name
  ctx.fillStyle = fighter.char.color || '#FFF';
  ctx.font = 'bold 8px Orbitron';
  ctx.textAlign = isEnemy ? 'right' : 'left';
  ctx.fillText(fighter.char.name.toUpperCase(), isEnemy ? x + w : x, y - 4);

  // Damage %
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 10px Orbitron';
  ctx.fillText(`${Math.floor(fighter.damage)}%`, isEnemy ? x + w : x, y + h + 11);

  // Stock dots — render one per starting stock (reconciled with story's villain-stocks)
  if (!hideStocks) {
  const totalStocks = Math.min(fighter.maxStocks || 3, 8);
  for (let i = 0; i < totalStocks; i++) {
    const sx = isEnemy ? x + w - 5 - i * 7 : x + 5 + i * 7;
    const sy = y + h + 20;
    if (i < fighter.stocks) {
      ctx.fillStyle = fighter.char.color || '#FFF';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  }
}

function drawPowerBar(ctx, fighter, bx, by, w, h) {
  const effect = fighter.char ? POWER_EFFECTS[fighter.char.id] : null;
  if (!effect) return;
  const maxCD = effect.cooldown * 60;
  ctx.fillStyle = '#111122';
  ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill();
  if (fighter.powerActive && fighter.powerTimer > 0) {
    const pulse = 0.5 + Math.sin(fighter.frame * 0.2) * 0.3;
    ctx.fillStyle = fighter.char.color;
    ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 6px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(effect.name.toUpperCase().slice(0, 8), bx + w / 2, by - h / 2 + 2);
  } else if (fighter.powerCooldown <= 0) {
    ctx.fillStyle = '#44FF88';
    ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.font = 'bold 6px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('POWER', bx + w / 2, by - h / 2 + 2);
  } else {
    const pct = 1 - fighter.powerCooldown / maxCD;
    ctx.fillStyle = '#44FF88';
    ctx.beginPath(); ctx.roundRect(bx, by - h, w * pct, h, 3); ctx.fill();
  }
}

function drawSuperMeter(ctx, fighter, bx, by) {
  const w = 100, h = 6;
  const pct = fighter.superMeter / fighter.maxSuper;
  ctx.fillStyle = '#111122';
  ctx.beginPath(); ctx.roundRect(bx, by - h, w, h, 3); ctx.fill();
  if (pct >= 1) {
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
    ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('SUPER!', bx + w / 2, by - h - 4);
  }
  ctx.fillStyle = pct >= 1 ? '#FFD700' : fighter.char.color;
  ctx.beginPath(); ctx.roundRect(bx, by - h, w * pct, h, 3); ctx.fill();
  ctx.shadowBlur = 0;
}