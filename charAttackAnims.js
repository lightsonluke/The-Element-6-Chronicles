// charAttackAnims.js — Entry point for per-character attack animations.
// Looks up each character's unique config from charAttackConfigs.js,
// then dispatches to the appropriate shape or super renderer.

import { CHAR_ATTACKS, getFallbackConfig } from './charAttackConfigs.js';
import { drawJab, drawSlash, drawWhip, drawLaunch, drawGround, drawSlam, drawCharge, drawRadial, drawBeam, drawIllusion, drawPortal, drawBarrier, drawDrain, drawLineBurst, drawLineArc, drawArcAround } from './attackShapes.js';
import { drawSuper } from './attackSupers.js';
import { drawUniqueSuper } from './uniqueSupers.js';
import { PARTICLES } from './charAttackParticles.js';

const SUPER_W = 1200, SUPER_H = 700;

// ── Get the config for a character, or derive a fallback ──
function getConfig(charId, power, color) {
  if (CHAR_ATTACKS[charId]) return CHAR_ATTACKS[charId];
  return getFallbackConfig(power, color);
}

// ── Map attack data to config key (ss/us/ds/sh/dh) ──
function getAttackKey(attack, attackKey) {
  const st = attack.sigType || attackKey || 'side';
  if (attack.isHeavy) {
    if (st === 'downHeavy' || st === 'down' || attack.isGroundPound) return 'dh';
    return 'sh';
  }
  if (st === 'up' || st === 'aerial' || attack.isRecovery) return 'us';
  if (st === 'down' || st === 'downNormal') return 'ds';
  return 'ss';
}

// ── Main entry: draw sig/heavy attack with per-character config ──
export function drawCharAttack(ctx, x, y, color, p, facing, attack, charId, attackKey, power) {
  const config = getConfig(charId, power, color);
  if (!config) return;

  const key = getAttackKey(attack, attackKey);
  const cfg = config[key];
  if (!cfg) return;

  const shapeType = cfg[0];
  const isHeavy = attack.isHeavy || false;

  // Opening flash
  if (p < 0.12) {
    ctx.globalAlpha = (0.12 - p) / 0.12 * 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 18, 30 + p * 12, 0, Math.PI * 2); ctx.fill();
  }

  // Dispatch to shape renderer
  switch (shapeType) {
    case 'jab': drawJab(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'slash': drawSlash(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'whip': drawWhip(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'launch': drawLaunch(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'ground': drawGround(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'slam': drawSlam(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'charge': drawCharge(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'radial': drawRadial(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'beam': drawBeam(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'illusion': drawIllusion(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'portal': drawPortal(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'barrier': drawBarrier(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'drain': drawDrain(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'lineBurst': drawLineBurst(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'lineArc': drawLineArc(ctx, x, y, p, facing, cfg, isHeavy); break;
    case 'arcAround': drawArcAround(ctx, x, y, p, facing, cfg, isHeavy); break;
    default: drawJab(ctx, x, y, p, facing, cfg, isHeavy); break;
  }

  ctx.shadowBlur = 0;
}

// ── Main entry: draw super with per-character config ──
export function drawCharSuper(ctx, x, y, color, p, charId) {
  const config = getConfig(charId, '', color);
  if (!config || !config.sp) {
    // Fallback: generic burst
    drawSuper(ctx, x, y, p, ['burst', color || '#AA44FF', 'glow', 1.5]);
    ctx.shadowBlur = 0;
    return;
  }

  // ── Hand-crafted unique supers: route directly to the per-character animation ──
  if (config.sp[0] === 'unique') {
    drawUniqueSuper(ctx, x, y, p, config.sp[1] || color, charId, SUPER_W, SUPER_H);
    ctx.shadowBlur = 0;
    return;
  }

  drawSuper(ctx, x, y, p, config.sp);
  ctx.shadowBlur = 0;
}

// ── Per-character POWER BUTTON aura (Gen 1-4) ──
// While a power is active, characters with a `pb` config display a unique
// continuous aura themed to their power button ability — replacing the
// generic effect-type aura. Draws in LOCAL space (feet at 0,0, chest ~ -s*0.8),
// so it works in every game mode (called from drawPowerAura in renderer.js).
// Returns true if it rendered (caller should skip the generic aura).
export function drawCharPowerAura(ctx, s, frame, color, charId) {
  const config = CHAR_ATTACKS[charId];
  const pb = config && config.pb;
  if (!pb) return false;
  const [, pName, pcol, sizeMul, effect] = pb;
  const particle = PARTICLES[pName] || PARTICLES.glow;
  const col = pcol || color;
  const sz = (sizeMul || 1);
  const chestY = -s * 0.8;
  const pulse = 0.5 + Math.sin(frame * 0.15) * 0.5;

  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 14;

  // Pulsing ring at chest
  ctx.globalAlpha = 0.18 + pulse * 0.14;
  ctx.strokeStyle = col; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, chestY, s * 0.95 + Math.sin(frame * 0.1) * 4, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.10 + pulse * 0.08;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, chestY, s * 1.15, 0, Math.PI * 2); ctx.stroke();

  // Orbiting themed particles
  const N = 8;
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + frame * 0.06;
    const r = s * 1.0 + Math.sin(frame * 0.12 + i) * 6;
    const px = Math.cos(ang) * r, py = chestY + Math.sin(ang) * r * 0.55;
    ctx.globalAlpha = 0.45 + Math.sin(frame * 0.1 + i) * 0.2;
    particle(ctx, px, py, 5 * sz, col, (frame % 60) / 60, i);
  }

  // Effect-specific flair so each power reads distinctly
  const e = effect;
  if (e === 'crackle' || e === 'chain') {
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5 + pulse * 0.3;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame * 0.2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.5, chestY + Math.sin(a) * s * 0.4);
      ctx.lineTo(Math.cos(a) * s * 1.2, chestY + Math.sin(a) * s * 0.9 + (Math.random() - 0.5) * 10); ctx.stroke();
    }
  } else if (e === 'wreath' || e === 'ember' || e === 'flame') {
    for (let i = 0; i < 7; i++) {
      const t = (i + frame * 0.02) % 1;
      const fx = Math.sin(i * 2 + frame * 0.05) * s * 0.6;
      const fy = chestY - t * s * 1.1;
      ctx.globalAlpha = (1 - t) * 0.5;
      particle(ctx, fx, fy, 6 * sz * (1 - t * 0.4), i % 2 ? col : '#FFAA44', t, i);
    }
  } else if (e === 'freeze' || e === 'frost') {
    ctx.fillStyle = col; ctx.globalAlpha = 0.3 + pulse * 0.2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + frame * 0.04;
      const r = s * 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, chestY + Math.sin(a) * r * 0.5);
      ctx.lineTo(Math.cos(a) * (r + 14), chestY + Math.sin(a) * (r + 14) * 0.5);
      ctx.lineTo(Math.cos(a + 0.2) * r, chestY + Math.sin(a + 0.2) * r * 0.5);
      ctx.fill();
    }
  } else if (e === 'drain' || e === 'venom' || e === 'siphon') {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.4 + pulse * 0.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame * 0.1;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 1.1, chestY + Math.sin(a) * s * 0.7);
      ctx.quadraticCurveTo(Math.cos(a) * s * 0.4, chestY + Math.sin(a) * s * 0.2, 0, chestY); ctx.stroke();
    }
  } else if (e === 'glow' || e === 'light' || e === 'warm' || e === 'heat' || e === 'heal') {
    const grad = ctx.createRadialGradient(0, chestY, 4, 0, chestY, s * 1.3);
    grad.addColorStop(0, col); grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.25 + pulse * 0.15; ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, chestY, s * 1.3, 0, Math.PI * 2); ctx.fill();
  } else if (e === 'iron' || e === 'metal' || e === 'barrier' || e === 'bind' || e === 'adhesive') {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.35 + pulse * 0.15;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + frame * 0.03;
      ctx.beginPath(); ctx.ellipse(0, chestY, s * (0.8 + i * 0.12), s * (0.4 + i * 0.06), a, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (e === 'push' || e === 'ring' || e === 'shove' || e === 'gust' || e === 'wind' || e === 'downdraft') {
    for (let r = 0; r < 3; r++) {
      const rp = ((frame * 0.02 + r * 0.33) % 1);
      ctx.globalAlpha = (1 - rp) * 0.4; ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, chestY, s * (0.6 + rp * 0.9), 0, Math.PI * 2); ctx.stroke();
    }
  } else if (e === 'yank' || e === 'tendril' || e === 'vine' || e === 'thorn') {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.4 + pulse * 0.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame * 0.08;
      ctx.beginPath(); ctx.moveTo(0, chestY);
      ctx.quadraticCurveTo(Math.cos(a) * s * 0.7, chestY + Math.sin(a) * s * 0.4 + Math.sin(frame * 0.1 + i) * 8, Math.cos(a) * s * 1.2, chestY + Math.sin(a) * s * 0.7); ctx.stroke();
    }
  } else if (e === 'resonant' || e === 'resonance' || e === 'echo' || e === 'pulse' || e === 'sense') {
    for (let r = 0; r < 3; r++) {
      const rp = ((frame * 0.025 + r * 0.33) % 1);
      ctx.globalAlpha = (1 - rp) * 0.35; ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, chestY, s * (0.5 + rp * 1.0), s * (0.25 + rp * 0.5), 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (e === 'wild' || e === 'reckless' || e === 'clumsy' || e === 'unpolished' || e === 'unstable' || e === 'overcharge') {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = s * (0.6 + Math.random() * 0.7);
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      particle(ctx, Math.cos(a) * r, chestY + Math.sin(a) * r * 0.6, 4 * sz, col, Math.random(), i);
    }
  } else if (e === 'phase' || e === 'step' || e === 'swap' || e === 'teleport') {
    ctx.globalAlpha = 0.25 + pulse * 0.15; ctx.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(-s * 0.5 + i * s * 0.33, chestY, 8, 22, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e === 'blast' || e === 'pillar' || e === 'spike' || e === 'spikes') {
    ctx.fillStyle = col; ctx.globalAlpha = 0.4 + pulse * 0.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame * 0.05;
      const r = s * 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, chestY + Math.sin(a) * r * 0.5);
      ctx.lineTo(Math.cos(a) * (r + 16), chestY + Math.sin(a) * (r + 16) * 0.5);
      ctx.lineTo(Math.cos(a + 0.25) * r, chestY + Math.sin(a + 0.25) * r * 0.5);
      ctx.fill();
    }
  }

  ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
  return true;
}