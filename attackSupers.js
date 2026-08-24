// attackSupers.js — Per-character super move animations.
// Each super is unique and stage-wide, parameterized by the super config.
//
// Super categories: fromSky | sweep | engulf | multiStrike | combo | burst | construct | unique
// Config format: [category, color, particleType, ...params]

import { PARTICLES } from './charAttackParticles.js';

function getP(name) { return PARTICLES[name] || PARTICLES.glow; }
function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

const W = 1200, H = 700;

// ── FROM SKY — strike from above (lightning, blizzard, concussive) ──
export function drawFromSky(ctx, x, y, p, cfg) {
  const [cat, color, particleName, boltCount] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.5;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  const count = boltCount || 1;
  for (let b = 0; b < count; b++) {
    const phase = p - b * 0.08;
    if (phase < 0 || phase > 1) continue;
    const bx = x + (b - (count - 1) / 2) * 80;
    const by = y - 18;

    // Warning indicator
    if (phase < 0.3) {
      ctx.globalAlpha = (0.3 - phase) / 0.3 * 0.3;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Lightning bolt from sky
    if (phase >= 0.3 && phase < 0.8) {
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = b % 2 === 0 ? color : '#FFFFFF';
      ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.moveTo(bx, 0);
      const steps = 8;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const lx = bx + (Math.random() - 0.5) * 30;
        const ly = by * t;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke(); ctx.shadowBlur = 0;

      // Impact burst
      if (phase < 0.5) {
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(bx, by, 30 * (1 - (phase - 0.3) / 0.2), 0, Math.PI * 2); ctx.fill();
      }
    }

    // Residual particles
    if (phase > 0.5) {
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const dist = 40 * (phase - 0.5) * 4;
        ctx.globalAlpha = a * (1 - (phase - 0.5) * 2) * 0.6;
        particle(ctx, bx + Math.cos(ang) * dist, by + Math.sin(ang) * dist * 0.5, 8, color, phase, i);
      }
    }
  }

  // Expanding rings
  for (let r = 0; r < 4; r++) {
    const rp = p - r * 0.15;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.4;
    ctx.strokeStyle = r === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, (60 + r * 80) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── SWEEP — horizontal sweep across stage (firestorm, tidal wall, sandstorm) ──
export function drawSweep(ctx, x, y, p, cfg) {
  const [cat, color, particleName, height, direction] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sweepH = height || 300;
  const dir = direction || 1;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.4;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  // Sweeping wall
  for (let w = 0; w < 5; w++) {
    const phase = p - w * 0.06;
    if (phase < 0 || phase > 1) continue;
    const sweepX = phase * W * dir;
    const wallH = sweepH * Math.min(phase * 2, 1);

    // Wall gradient
    ctx.globalAlpha = a * (0.6 - w * 0.08) * (1 - phase * 0.5);
    const grad = ctx.createLinearGradient(sweepX - 60, y, sweepX + 60, y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, color + 'AA');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(sweepX - 60, y - wallH, 120, wallH);

    // Wall particles
    for (let i = 0; i < 12; i++) {
      const fx = sweepX - 50 + i * 10;
      const fy = y - wallH * (0.2 + Math.sin(i * 0.5 + phase * 8) * 0.3);
      ctx.globalAlpha = a * (0.7 - w * 0.1) * (1 - phase);
      particle(ctx, fx, fy, 12 * (1 - phase * 0.4), color, phase, i + w * 10);
    }
  }

  // Ground sweep
  ctx.globalAlpha = a * 0.3;
  ctx.fillStyle = color;
  const groundSweep = p * W * dir;
  ctx.fillRect(0, y - 10, groundSweep, 10);

  // Expanding rings
  for (let r = 0; r < 3; r++) {
    const rp = p - r * 0.2;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, (50 + r * 60) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── ENGULF — full-screen effect (freeze, drain, cyclone, overgrowth, etc.) ──
export function drawEngulf(ctx, x, y, p, cfg) {
  const [cat, color, particleName, effectType] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.5;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  if (effectType === 'freeze' || effectType === 'freezeBurst' || effectType === 'blizzard') {
    // Flash-freeze / blizzard — crystalline particles across screen
    for (let i = 0; i < 40; i++) {
      const sx = (i * 31 + Math.sin(i * 3) * 80) % W;
      const sy = (i * 19) % 500 + 50;
      ctx.globalAlpha = a * (1 - p * 0.4) * 0.6;
      particle(ctx, sx, sy, 14 * (1 - p * 0.3), color, p, i);
    }
    // Freeze sweep
    ctx.globalAlpha = a * 0.2;
    ctx.fillStyle = color + '40';
    ctx.fillRect(0, 0, W * Math.min(p * 1.5, 1), H);
    // Ice crystals on ground
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.4;
    for (let i = 0; i < 20; i++) {
      const ix = (i * 60) % W;
      ctx.beginPath();
      ctx.moveTo(ix, y); ctx.lineTo(ix + 5, y - 20); ctx.lineTo(ix + 10, y); ctx.fill();
    }
  } else if (effectType === 'drainPulse' || effectType === 'drainField') {
    // Drain pulse — dark wisps converging then expanding
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const dist = p < 0.5 ? 200 * (1 - p * 2) : (p - 0.5) * 400;
      const dx = x + Math.cos(ang) * dist;
      const dy = y - 18 + Math.sin(ang) * dist * 0.5;
      ctx.globalAlpha = a * 0.6;
      particle(ctx, dx, dy, 10, color, p, i);
    }
    // Healing glow on caster
    ctx.globalAlpha = a * 0.3;
    ctx.fillStyle = '#44FF66';
    ctx.beginPath(); ctx.arc(x, y - 18, 40 * Math.sin(p * Math.PI), 0, Math.PI * 2); ctx.fill();
  } else if (effectType === 'toxicCloud') {
    // Toxic cloud lingering
    for (let i = 0; i < 20; i++) {
      const sx = (i * 61 + Math.sin(p * 3 + i) * 50) % W;
      const sy = (i * 37) % 400 + 100;
      ctx.globalAlpha = a * 0.4;
      particle(ctx, sx, sy, 15 * (1 - p * 0.3), color, p, i);
    }
  } else if (effectType === 'threadBind' || effectType === 'stageBind') {
    // Threads binding the stage
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 12; i++) {
      const sx = (i * 100) % W;
      ctx.beginPath(); ctx.moveTo(sx, 0);
      ctx.quadraticCurveTo(sx + 50, H / 2, sx, H); ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const sy = (i * 90) % H;
      ctx.beginPath(); ctx.moveTo(0, sy);
      ctx.quadraticCurveTo(W / 2, sy + 50, W, sy); ctx.stroke();
    }
  } else if (effectType === 'nightmareHaze') {
    // Nightmare haze — dark fog
    for (let i = 0; i < 25; i++) {
      const sx = (i * 49 + Math.sin(p * 2 + i) * 60) % W;
      const sy = (i * 29) % 500 + 50;
      ctx.globalAlpha = a * 0.4;
      particle(ctx, sx, sy, 18 * (1 - p * 0.3), color, p, i);
    }
    // Fear tendrils
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 10; i++) {
      const sx = (i * 120) % W;
      ctx.beginPath(); ctx.moveTo(sx, H);
      for (let s = 0; s < 5; s++) {
        ctx.lineTo(sx + Math.sin(s + p * 5 + i) * 30, H - s * 80);
      }
      ctx.stroke();
    }
  } else if (effectType === 'dustPulse') {
    // Aging to dust — everything crumbles
    for (let i = 0; i < 30; i++) {
      const sx = (i * 41) % W;
      const sy = (i * 23) % 500 + 50;
      ctx.globalAlpha = a * (1 - p * 0.5) * 0.5;
      particle(ctx, sx, sy, 10 * (1 - p * 0.3), color, p, i);
    }
    // Crumbling effect
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.3;
    for (let i = 0; i < 15; i++) {
      const sx = (i * 80) % W;
      ctx.fillRect(sx, y - 30 - (p * 100), 40, 5);
    }
  } else if (effectType === 'closurePulse' || effectType === 'restraintPulse') {
    // Closing/restraint pulse — calming wave
    for (let r = 0; r < 5; r++) {
      const rp = (p + r * 0.15) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.4;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y - 18, 300 * rp, 0, Math.PI * 2); ctx.stroke();
    }
    // Soft particles
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      const dist = 200 * p;
      ctx.globalAlpha = a * 0.4;
      particle(ctx, x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 8, color, p, i);
    }
  } else if (effectType === 'cyclone') {
    // Cyclone — swirling wind
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let r = 0; r < 8; r++) {
      const ang = p * 5 + r * 0.5;
      ctx.beginPath();
      for (let t = 0; t < 1; t += 0.05) {
        const radius = 50 + t * 250;
        const cx = x + Math.cos(ang + t * 6) * radius;
        const cy = y - 18 + Math.sin(ang + t * 6) * radius * 0.4;
        if (t === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  } else if (effectType === 'tremor') {
    // Earthquake tremor
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.6;
    for (let i = 0; i < 8; i++) {
      const sx = (i * 150) % W;
      ctx.beginPath(); ctx.moveTo(sx, y);
      for (let s = 0; s < 5; s++) {
        ctx.lineTo(sx + (s - 2) * 30 + Math.sin(p * 10 + s) * 15, y + Math.sin(s + p * 8) * 10);
      }
      ctx.stroke();
    }
    // Cracks
    for (let i = 0; i < 10; i++) {
      const sx = (i * 120) % W;
      ctx.beginPath(); ctx.moveTo(sx, y);
      ctx.lineTo(sx + (Math.random() - 0.5) * 40, y - 60 * p); ctx.stroke();
    }
  } else if (effectType === 'heatBurst' || effectType === 'radiant') {
    // Radiant heat/light burst
    ctx.globalAlpha = a * 0.3;
    const grad = ctx.createRadialGradient(x, y - 18, 10, x, y - 18, 400);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y - 18, 400, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      ctx.globalAlpha = a * 0.6;
      particle(ctx, x + Math.cos(ang) * 200 * p, y - 18 + Math.sin(ang) * 200 * p * 0.5, 10, color, p, i);
    }
  } else if (effectType === 'resonant' || effectType === 'pulseReveal' || effectType === 'sonicPulse') {
    // Resonant/sonic pulse — concentric rings
    for (let r = 0; r < 6; r++) {
      const rp = (p + r * 0.12) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y - 18, 350 * rp, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effectType === 'chainLightning') {
    // Chain lightning between points
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.7;
    ctx.shadowColor = color; ctx.shadowBlur = 20;
    for (let i = 0; i < 8; i++) {
      const sx = (i * 150 + 50) % W;
      const sy = (i * 80) % 400 + 100;
      ctx.beginPath(); ctx.moveTo(x, y - 18);
      const steps = 5;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        ctx.lineTo(x + (sx - x) * t + (Math.random() - 0.5) * 30, y - 18 + (sy - (y - 18)) * t + (Math.random() - 0.5) * 20);
      }
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  } else if (effectType === 'gravitySpike' || effectType === 'compression') {
    // Gravity/compression — everything pulled inward
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const dist = p < 0.5 ? 300 * (1 - p * 2) : (p - 0.5) * 600;
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 18, Math.abs(dist), 0, Math.PI * 2); ctx.stroke();
    }
    // Central void
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = '#000000';
    ctx.shadowColor = color; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(x, y - 18, 20 * (1 - p * 0.5), 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (effectType === 'growthBurst') {
    // Growth burst — plants spreading
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = a * 0.7;
    for (let v = 0; v < 10; v++) {
      const startX = (v * 120) % W;
      ctx.beginPath(); ctx.moveTo(startX, H);
      for (let s = 0; s < 12; s++) {
        const t = s / 12;
        const vx = startX + Math.sin(t * Math.PI * 3 + v) * 50 * p;
        const vy = H - t * 400 * p;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) {
      ctx.globalAlpha = a * 0.5;
      particle(ctx, (i * 60) % W, (i * 40) % 300 + 100, 10, color, p, i);
    }
  } else if (effectType === 'spiritDrain') {
    // Spirit drain — lingering energy
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      const dist = 200 * p;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 8, color, p, i);
    }
    // Draining wisps
    for (let i = 0; i < 10; i++) {
      const t = (i + p * 3) % 1;
      ctx.globalAlpha = a * (1 - t) * 0.4;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x + Math.sin(t * Math.PI * 4 + i) * 100, y - 18 - t * 200, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (effectType === 'glassStorm') {
    // Glass shard storm
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 25; i++) {
      const sx = (i * 49 + Math.sin(i * 3) * 80) % W;
      const sy = (i * 23) % 500 + 50;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(i + p * 5);
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.fill();
      ctx.restore();
    }
  } else {
    // Generic engulf — particle storm
    for (let i = 0; i < 35; i++) {
      const seed = i * 7.3;
      const sx = (seed * 137) % W;
      const sy = ((seed * 89) % 450) + 50;
      const phase = (p + i * 0.04) % 1;
      const sz = 9 * (1 - phase * 0.5) * (0.5 + Math.sin(seed) * 0.5);
      ctx.globalAlpha = a * (1 - phase) * 0.6;
      if (sz > 0.5) particle(ctx, sx, sy, sz, color, phase, i);
    }
  }

  // Expanding rings (all engulfs)
  for (let r = 0; r < 4; r++) {
    const rp = p - r * 0.15;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.4;
    ctx.strokeStyle = r === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, (60 + r * 80) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── MULTI-STRIKE — multiple strikes from different angles ──
export function drawMultiStrike(ctx, x, y, p, cfg) {
  const [cat, color, particleName, count, shape] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const num = count || 6;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.4;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  for (let i = 0; i < num; i++) {
    const phase = p - i * 0.08;
    if (phase < 0 || phase > 1) continue;

    if (shape === 'shadow' || shape === 'mist') {
      // Shadow/mist strikes from random angles
      const ang = (i / num) * Math.PI * 2 + Math.sin(i * 7) * 0.5;
      const dist = 80 + Math.sin(phase * Math.PI) * 150;
      const sx = x + Math.cos(ang) * dist;
      const sy = y - 18 + Math.sin(ang) * dist * 0.5;
      ctx.globalAlpha = a * (1 - phase) * 0.8;
      ctx.strokeStyle = i % 2 === 0 ? color : '#FFFFFF';
      ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(sx - Math.cos(ang + 1) * 45, sy - Math.sin(ang + 1) * 45);
      ctx.lineTo(sx + Math.cos(ang + 1) * 45, sy + Math.sin(ang + 1) * 45);
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (shape === 'teleport') {
      // Teleport strikes — appear at random points
      const sx = x + (Math.sin(i * 13) * 200);
      const sy = y - 18 + (Math.cos(i * 17) * 100);
      // Portal effect
      ctx.globalAlpha = a * (1 - phase) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, 15, 20, 0, 0, Math.PI * 2); ctx.stroke();
      // Strike
      ctx.globalAlpha = a * (1 - phase) * 0.7;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx - 30, sy); ctx.lineTo(sx + 30, sy); ctx.stroke();
    } else if (shape === 'fly') {
      // Flying strikes from multiple angles
      const ang = (i / num) * Math.PI * 2;
      const dist = 100 + phase * 200;
      const sx = x + Math.cos(ang) * dist;
      const sy = y - 18 + Math.sin(ang) * dist * 0.4;
      ctx.globalAlpha = a * (1 - phase) * 0.7;
      ctx.strokeStyle = i % 2 === 0 ? color : '#FFFFFF';
      ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(sx - Math.cos(ang) * 40, sy - Math.sin(ang) * 40);
      ctx.lineTo(sx + Math.cos(ang) * 40, sy + Math.sin(ang) * 40);
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (shape === 'flurry') {
      // Flurry of cuts
      const sx = x + (Math.sin(i * 11) * 200);
      const sy = y - 18 + (Math.cos(i * 13) * 120);
      ctx.globalAlpha = a * (1 - phase) * 0.8;
      ctx.strokeStyle = i % 2 === 0 ? color : '#FFFFFF';
      ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 18;
      const ang2 = i * 0.7 + p * 3;
      ctx.beginPath();
      ctx.moveTo(sx - Math.cos(ang2) * 50, sy - Math.sin(ang2) * 50);
      ctx.lineTo(sx + Math.cos(ang2) * 50, sy + Math.sin(ang2) * 50);
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (shape === 'portal') {
      // Portal strikes
      const sx = (i * 200 + 100) % W;
      const sy = (i * 150 + 100) % 400 + 100;
      ctx.globalAlpha = a * (1 - phase) * 0.6;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(sx, sy, 20, 25, p * Math.PI, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = a * (1 - phase) * 0.5;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx - 25, sy); ctx.lineTo(sx + 25, sy); ctx.stroke();
    } else {
      // Generic multi-strike
      const ang = (i / num) * Math.PI * 2;
      const dist = 100 + Math.sin(phase * Math.PI) * 150;
      const sx = x + Math.cos(ang) * dist;
      const sy = y - 18 + Math.sin(ang) * dist * 0.5;
      ctx.globalAlpha = a * (1 - phase) * 0.7;
      ctx.strokeStyle = i % 2 === 0 ? color : '#FFFFFF';
      ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(sx - Math.cos(ang + 1) * 40, sy - Math.sin(ang + 1) * 40);
      ctx.lineTo(sx + Math.cos(ang + 1) * 40, sy + Math.sin(ang + 1) * 40);
      ctx.stroke(); ctx.shadowBlur = 0;
    }

    // Particles at strike point
    const ang = (i / num) * Math.PI * 2;
    const dist = 100 + Math.sin(phase * Math.PI) * 150;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.5;
    for (let j = 0; j < 5; j++) {
      ctx.globalAlpha = a * (1 - phase) * 0.5;
      particle(ctx, sx + (Math.random() - 0.5) * 30, sy + (Math.random() - 0.5) * 20, 6, color, phase, j);
    }
  }

  // Center burst
  ctx.globalAlpha = a * 0.4;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 80, 0, Math.PI * 2); ctx.fill();
}

// ── COMBO — rapid combo sequence ──
export function drawCombo(ctx, x, y, p, cfg) {
  const [cat, color, particleName, count, speed] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const num = count || 8;
  const spd = speed || 1.5;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.4;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  // Rapid strikes
  for (let i = 0; i < num; i++) {
    const phase = (p * spd + i / num) % 1;
    const ang = (i / num) * Math.PI * 2 + p * spd;
    const dist = 60 + Math.sin(phase * Math.PI) * 120;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.4;

    // Strike line
    ctx.globalAlpha = a * Math.sin(phase * Math.PI) * 0.7;
    ctx.strokeStyle = i % 2 === 0 ? color : '#FFFFFF';
    ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(ang) * 30, sy - Math.sin(ang) * 30);
    ctx.lineTo(sx + Math.cos(ang) * 30, sy + Math.sin(ang) * 30);
    ctx.stroke(); ctx.shadowBlur = 0;

    // Impact particles
    for (let j = 0; j < 4; j++) {
      ctx.globalAlpha = a * Math.sin(phase * Math.PI) * 0.5;
      particle(ctx, sx + (Math.random() - 0.5) * 20, sy + (Math.random() - 0.5) * 15, 5, color, phase, j);
    }
  }

  // Speed lines
  if (spd > 2) {
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.3;
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 30, y - 18 + Math.sin(ang) * 20);
      ctx.lineTo(x + Math.cos(ang) * 200, y - 18 + Math.sin(ang) * 150); ctx.stroke();
    }
  }

  // Expanding rings
  for (let r = 0; r < 3; r++) {
    const rp = p - r * 0.2;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.4;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, (40 + r * 50) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── BURST — big explosion from fighter ──
export function drawBurst(ctx, x, y, p, cfg) {
  const [cat, color, particleName, sizeMul] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = sizeMul || 1.5;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.6;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  // Core fireball
  const coreR = 120 * sz * p;
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, coreR);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, color);
  grad.addColorStop(0.7, color + '88');
  grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.85;
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, coreR, 0, Math.PI * 2); ctx.fill();

  // Fire tongues / rays
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + p * 2;
    const len = coreR * (0.6 + Math.sin(p * 20 + i) * 0.4);
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = i % 3 === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4 * (1 - p);
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * len, y - 18 + Math.sin(ang) * len); ctx.stroke();
  }

  // Particles
  for (let i = 0; i < 25; i++) {
    const ang = (i / 25) * Math.PI * 2 + p * 3;
    const dist = coreR * (0.5 + Math.random() * 0.5);
    ctx.globalAlpha = a * 0.6;
    particle(ctx, x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.6, 10 * (1 - p * 0.5), color, p, i);
  }

  // Shockwave ring
  for (let r = 0; r < 3; r++) {
    const rp = p - r * 0.15;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.5;
    ctx.strokeStyle = r === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 5 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, (80 + r * 60) * rp * sz, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── CONSTRUCT — building something (barrier, wall, cage, maze) ──
export function drawConstruct(ctx, x, y, p, cfg) {
  const [cat, color, particleName, shape] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.4;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  if (shape === 'barrier' || shape === 'barrierSlam') {
    // Stone/metal barrier rising then slamming
    const riseH = p < 0.5 ? p * 2 * 200 : 200;
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = color;
    ctx.fillRect(x - 80, y - riseH, 160, 20);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.4;
    ctx.strokeRect(x - 80, y - riseH, 160, 20);
    // Slam down
    if (p > 0.5) {
      const slamY = y - 200 + (p - 0.5) * 400;
      ctx.globalAlpha = a * 0.7;
      ctx.fillStyle = color;
      ctx.fillRect(x - 80, slamY, 160, 20);
      // Impact
      if (p > 0.85) {
        ctx.globalAlpha = a * 0.5;
        for (let i = 0; i < 10; i++) {
          particle(ctx, x + (i - 5) * 20, y, 8, color, p, i);
        }
      }
    }
  } else if (shape === 'stoneWall') {
    // Stone wall rising then collapsing
    const wallH = Math.min(p * 2, 1) * 150;
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = color;
    ctx.fillRect(x - 60, y - wallH, 120, wallH);
    // Collapse
    if (p > 0.5) {
      for (let i = 0; i < 8; i++) {
        const fallY = y - wallH + (p - 0.5) * 300;
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = shade(color, -20);
        ctx.fillRect(x - 60 + i * 15, fallY, 12, 12);
      }
    }
  } else if (shape === 'barrierWall') {
    // Barrier wall then shatter
    const wallH = Math.min(p * 2, 1) * 120;
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(x - 70, y - wallH, 140, wallH);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    ctx.strokeRect(x - 70, y - wallH, 140, wallH);
    // Shatter
    if (p > 0.5) {
      for (let i = 0; i < 10; i++) {
        const sx = x - 60 + i * 12;
        const sy = y - wallH * 0.5 + (p - 0.5) * 200;
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = color;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(i + p * 5);
        ctx.fillRect(-5, -5, 10, 10); ctx.restore();
      }
    }
  } else if (shape === 'boneCage') {
    // Bone cage around target
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const r = 80 * Math.min(p * 2, 1);
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * r, y);
      ctx.lineTo(x + Math.cos(ang) * r, y - 120 * Math.min(p * 2, 1)); ctx.stroke();
    }
    // Ribs
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(x, y - 40 - r * 30, 80 * Math.min(p * 2, 1), 15, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (shape === 'airMaze') {
    // Air platform maze
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 6; i++) {
      const sx = x - 150 + i * 60;
      const sy = y - 50 - Math.sin(i + p * 3) * 80;
      ctx.beginPath(); ctx.roundRect(sx, sy, 50, 8, 4); ctx.stroke();
    }
    // Collapse
    if (p > 0.6) {
      for (let i = 0; i < 6; i++) {
        const sx = x - 150 + i * 60;
        const sy = y - 50 + (p - 0.6) * 300;
        ctx.globalAlpha = a * 0.4;
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, 50, 8);
      }
    }
  } else if (shape === 'giantSlam') {
    // Size manipulation — shrink battlefield, grow back with slam
    if (p < 0.3) {
      // Shrink effect
      ctx.globalAlpha = a * 0.3;
      ctx.strokeStyle = color; ctx.lineWidth = 4;
      for (let r = 0; r < 4; r++) {
        ctx.beginPath(); ctx.arc(x, y - 18, 200 * (1 - p / 0.3 * 0.5 + r * 0.1), 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      // Grow + slam
      const growR = (p - 0.3) / 0.7 * 200;
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y - 18, growR, 0, Math.PI * 2); ctx.fill();
      // Slam particles
      if (p > 0.7) {
        for (let i = 0; i < 15; i++) {
          const ang = (i / 15) * Math.PI * 2;
          ctx.globalAlpha = a * 0.6;
          particle(ctx, x + Math.cos(ang) * growR, y - 18 + Math.sin(ang) * growR * 0.5, 10, color, p, i);
        }
      }
    }
  } else if (shape === 'tkSlam') {
    // Telekinetic — objects spiral then slam
    for (let i = 0; i < 12; i++) {
      const baseAng = (i / 12) * Math.PI * 2;
      const ang = baseAng + p * Math.PI * 4;
      const dist = p < 0.5 ? 140 * (1 - p * 2) : (p - 0.5) * 280;
      const ox = x + Math.cos(ang) * dist;
      const oy = y - 18 + Math.sin(ang) * dist * 0.55;
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : color;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.rect(ox - 6, oy - 6, 12, 12); ctx.fill();
    }
    // Slam flash
    if (p > 0.45 && p < 0.6) {
      ctx.globalAlpha = (1 - Math.abs(p - 0.52) / 0.08) * 0.8;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(x, y - 18, 80, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Generic construct
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(x - 50, y - 100 * Math.min(p * 2, 1), 100, 100 * Math.min(p * 2, 1));
  }

  // Expanding rings
  for (let r = 0; r < 3; r++) {
    const rp = p - r * 0.2;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, (50 + r * 60) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── UNIQUE — special supers with custom handling ──
export function drawUnique(ctx, x, y, p, cfg) {
  const [cat, color, particleName, uniqueType] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;

  // Screen flash
  if (p < 0.1) {
    ctx.globalAlpha = (0.1 - p) / 0.1 * 0.5;
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  if (uniqueType === 'overgrowth' || uniqueType === 'thornOvergrowth' || uniqueType === 'rootOvergrowth' || uniqueType === 'poisonOvergrowth') {
    // Overgrowth — vines/roots engulfing the stage
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = a * 0.7;
    for (let v = 0; v < 8; v++) {
      const phase = p - v * 0.05;
      if (phase < 0 || phase > 1) continue;
      ctx.globalAlpha = a * (1 - phase) * 0.7;
      const startX = (v * 150) % W;
      ctx.beginPath(); ctx.moveTo(startX, H);
      for (let s = 0; s < 15; s++) {
        const t = s / 15;
        const vx = startX + Math.sin(t * Math.PI * 3 + v) * 60 * phase;
        const vy = H - t * 500 * phase;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
    // Thorns/leaves
    for (let i = 0; i < 20; i++) {
      ctx.globalAlpha = a * 0.5;
      particle(ctx, (i * 60 + Math.sin(i) * 40) % W, (i * 35) % 400 + 100, 8, color, p, i);
    }
    if (uniqueType === 'poisonOvergrowth') {
      // Poison clouds
      for (let i = 0; i < 12; i++) {
        ctx.globalAlpha = a * 0.3;
        particle(ctx, (i * 100) % W, (i * 50) % 300 + 100, 15, color, p, i);
      }
    }
  } else if (uniqueType === 'freezeWall') {
    // Rising water wall that freezes mid-attack
    const wallH = p * 350;
    ctx.globalAlpha = a * 0.4;
    const grad = ctx.createLinearGradient(0, y, 0, y - wallH);
    grad.addColorStop(0, color + 'AA');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - wallH, W, wallH);
    // Water particles
    for (let i = 0; i < 18; i++) {
      const wx = (i * 67 + p * 300) % W;
      ctx.globalAlpha = a * 0.6;
      particle(ctx, wx, y - wallH * (0.3 + Math.sin(i) * 0.3), 11, color, p, i);
    }
    // Freezing effect
    if (p > 0.4) {
      ctx.globalAlpha = a * 0.3;
      ctx.fillStyle = '#AAEEFF';
      ctx.fillRect(0, y - wallH, W, wallH * 0.3);
      // Ice crystals
      ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = a * 0.5;
      for (let i = 0; i < 20; i++) {
        const ix = (i * 60) % W;
        ctx.beginPath();
        ctx.moveTo(ix, y - wallH); ctx.lineTo(ix + 5, y - wallH - 20); ctx.lineTo(ix + 10, y - wallH); ctx.fill();
      }
    }
  } else if (uniqueType === 'unstablePotion') {
    // Unstable potion — reacts differently
    const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'];
    for (let i = 0; i < 20; i++) {
      const c = colors[i % colors.length];
      const sx = x + Math.cos(i * 0.7 + p * 3) * (50 + p * 200);
      const sy = y - 18 + Math.sin(i * 0.5 + p * 2) * (30 + p * 150);
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(sx, sy, 8 * (1 - p * 0.3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // Central flask
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y - 18, 20, 25, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // Generic unique — particle storm
    for (let i = 0; i < 35; i++) {
      const seed = i * 7.3;
      const sx = (seed * 137) % W;
      const sy = ((seed * 89) % 450) + 50;
      const phase = (p + i * 0.04) % 1;
      const sz = 9 * (1 - phase * 0.5) * (0.5 + Math.sin(seed) * 0.5);
      ctx.globalAlpha = a * (1 - phase) * 0.6;
      if (sz > 0.5) particle(ctx, sx, sy, sz, color, phase, i);
    }
  }

  // Expanding rings
  for (let r = 0; r < 4; r++) {
    const rp = p - r * 0.15;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.4;
    ctx.strokeStyle = r === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, (60 + r * 80) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── Main dispatcher ──
export function drawSuper(ctx, x, y, p, cfg) {
  const cat = cfg[0];
  switch (cat) {
    case 'fromSky': drawFromSky(ctx, x, y, p, cfg); break;
    case 'sweep': drawSweep(ctx, x, y, p, cfg); break;
    case 'engulf': drawEngulf(ctx, x, y, p, cfg); break;
    case 'multiStrike': drawMultiStrike(ctx, x, y, p, cfg); break;
    case 'combo': drawCombo(ctx, x, y, p, cfg); break;
    case 'burst': drawBurst(ctx, x, y, p, cfg); break;
    case 'construct': drawConstruct(ctx, x, y, p, cfg); break;
    case 'unique': drawUnique(ctx, x, y, p, cfg); break;
    default: drawBurst(ctx, x, y, p, ['burst', cfg[1] || '#AA44FF', 'glow', 1.5]); break;
  }
}