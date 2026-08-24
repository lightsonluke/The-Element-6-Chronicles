// attackShapes.js — Shape renderer functions for per-character attack animations.
// Each function draws a unique visual based on the config: [type, particle, color, size, effect]

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

// ── JAB — forward thrust (fist, punch, touch, push) ──
export function drawJab(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const reach = (isHeavy ? 90 : 65) * sz * Math.min(p * 2.5, 1);
  const fx = x + facing * reach;
  const fy = y - 22;
  const fr = (isHeavy ? 16 : 12) * sz * (1 - p * 0.3);

  // Base shape — effect-dependent (NOT always a ball)
  ctx.globalAlpha = a * 0.85;
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = 10;

  if (effect === 'trail' || effect === 'speed') {
    // Speed — horizontal streak, not a ball
    ctx.beginPath(); ctx.ellipse(fx, fy, fr * 1.6, fr * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a * 0.3;
    for (let i = 1; i <= 3; i++) ctx.beginPath(), ctx.ellipse(fx - facing * i * 12, fy, fr * 1.2, fr * 0.35, 0, 0, Math.PI * 2), ctx.fill();
  } else if (effect === 'crackle' || effect === 'chain' || effect === 'lightningJab') {
    // Lightning — small core with bolts (no big ball)
    ctx.beginPath(); ctx.arc(fx, fy, fr * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + p * 8;
      ctx.beginPath(); ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(ang) * fr * 1.8, fy + Math.sin(ang) * fr * 1.8); ctx.stroke();
    }
  } else if (effect === 'portal' || effect === 'portalStrike') {
    // Portal — ring, not filled ball
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.7;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(fx, fy, fr * (1 + r * 0.3), fr * (1.3 + r * 0.3), p * Math.PI, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'phase') {
    // Phase — ghostly outline, not solid
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.35;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.ellipse(fx, fy - i * 5, fr * 0.7, fr * 1.2, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'push' || effect === 'ring' || effect === 'gravityPush') {
    // Force push — expanding ring, not a ball
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.globalAlpha = a * 0.6;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.arc(fx, fy, fr * (0.5 + r * 0.5) * Math.min(p * 2.5, 1.3), 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'glow' || effect === 'light' || effect === 'warm' || effect === 'heat') {
    // Glow — soft radial gradient, no hard ball
    const grad = ctx.createRadialGradient(fx, fy, 1, fx, fy, fr * 2.2);
    grad.addColorStop(0, color); grad.addColorStop(0.5, color + '80'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.arc(fx, fy, fr * 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'freeze') {
    // Freeze — ice shard, not a ball
    ctx.beginPath();
    ctx.moveTo(fx, fy - fr * 1.2); ctx.lineTo(fx + fr * 0.6, fy);
    ctx.lineTo(fx, fy + fr * 1.2); ctx.lineTo(fx - fr * 0.6, fy);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.4; ctx.stroke();
  } else if (effect === 'drain' || effect === 'venom') {
    // Drain — small core with trailing wisps back to user
    ctx.beginPath(); ctx.arc(fx, fy, fr * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx - facing * 15, fy + Math.sin(p * 8 + i * 2) * 12, x, y - 22); ctx.stroke();
    }
  } else if (effect === 'wreath' || effect === 'ember' || effect === 'flame') {
    // Flame — small core with flickering particles
    ctx.beginPath(); ctx.arc(fx, fy, fr * 0.55, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + p * 8;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, fx + Math.cos(ang) * fr * 1.3, fy + Math.sin(ang) * fr * 1.3, fr * 0.4, color, p, i);
    }
  } else if (effect === 'iron' || effect === 'metal' || effect === 'barrier') {
    // Metal — angular block, not round
    ctx.fillStyle = shade(color, 20);
    ctx.beginPath(); ctx.roundRect(fx - fr * 0.9, fy - fr * 0.7, fr * 1.8, fr * 1.4, 3); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.3; ctx.stroke();
  } else if (effect === 'bind' || effect === 'adhesive') {
    // Bind — crosshatch pattern, not a ball
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.6;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(fx - fr, fy + i * 5); ctx.lineTo(fx + fr, fy + i * 5 + Math.sin(p * 10 + i) * 3); ctx.stroke();
    }
  } else if (effect === 'hammer' || effect === 'club') {
    // Hammer — rectangular head
    ctx.fillStyle = shade(color, -30);
    ctx.beginPath(); ctx.roundRect(fx - fr * 1.2, fy - fr * 0.8, fr * 2.4, fr * 1.6, 4); ctx.fill();
  } else if (effect === 'clone' || effect === 'mimic' || effect === 'shift') {
    // Clone — translucent shifting rings
    ctx.globalAlpha = a * 0.3; ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.arc(fx, fy, fr * (0.8 + r * 0.35) * (1 + Math.sin(p * 6 + r) * 0.1), 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'shrink' || effect === 'grow' || effect === 'giant') {
    // Size — pulsing ring showing scale change
    const scaleMul = effect === 'giant' ? 1.5 : effect === 'grow' ? 1.2 : 0.7;
    ctx.globalAlpha = a * 0.3; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx, fy, fr * scaleMul * 1.5 * (1 + Math.sin(p * 8) * 0.1), 0, Math.PI * 2); ctx.stroke();
  } else {
    // Default — elongated thrust (NOT a perfect ball)
    ctx.beginPath(); ctx.ellipse(fx, fy, fr * 1.2, fr * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Effect-specific overlays (effects that need extra detail beyond the base)
  if (effect === 'crackle') {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.8;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p * 5;
      ctx.beginPath(); ctx.moveTo(fx, fy);
      const len = fr * 2 * (1 + Math.sin(p * 10 + i) * 0.3);
      ctx.lineTo(fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
      ctx.stroke();
    }
  } else if (effect === 'wreath' || effect === 'ember') {
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + p * 8;
      ctx.globalAlpha = a * 0.6;
      particle(ctx, fx + Math.cos(ang) * fr * 1.4, fy + Math.sin(ang) * fr * 1.4, fr * 0.45, color, p, i);
    }
  } else if (effect === 'spike' || effect === 'syringe') {
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.85;
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI - Math.PI / 2 + facing * 0.3;
      ctx.beginPath();
      ctx.moveTo(fx + Math.cos(ang) * fr, fy + Math.sin(ang) * fr);
      ctx.lineTo(fx + Math.cos(ang) * fr * 2.5, fy + Math.sin(ang) * fr * 2.5);
      ctx.lineTo(fx + Math.cos(ang + 0.3) * fr, fy + Math.sin(ang + 0.3) * fr);
      ctx.fill();
    }
  } else if (effect === 'freeze') {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, fx + Math.cos(ang) * fr * 1.2, fy + Math.sin(ang) * fr * 1.2, fr * 0.5, color, p, i);
    }
  } else if (effect === 'drain' || effect === 'venom') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(fx, fy);
      const wob = Math.sin(p * 8 + i * 2) * 10;
      ctx.quadraticCurveTo(fx - facing * 20, fy + wob, x, y - 22);
      ctx.stroke();
    }
  } else if (effect === 'portal') {
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.5;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(fx, fy, fr * (1 + r * 0.3), fr * (1.5 + r * 0.3), p * Math.PI, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'clone') {
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = color;
    for (let i = 0; i < 2; i++) {
      const off = (i + 1) * 20 * (1 - p);
      ctx.beginPath(); ctx.ellipse(fx - facing * off, fy, fr * 0.5, fr * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'trail' || effect === 'speed') {
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      ctx.globalAlpha = a * (1 - t) * 0.4;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x + facing * reach * t, fy, fr * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'ring' || effect === 'push') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.arc(fx, fy, fr * (1 + r * 0.5) * Math.min(p * 2, 1), 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'iron' || effect === 'metal' || effect === 'barrier') {
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.4;
    ctx.beginPath(); ctx.arc(fx, fy, fr * 1.1, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = shade(color, 40); ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.arc(fx - fr * 0.3, fy - fr * 0.3, fr * 0.3, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'phase') {
    ctx.globalAlpha = a * 0.35;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(fx, fy - i * 4, fr * 0.6, fr * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'glow' || effect === 'light' || effect === 'warm' || effect === 'heat') {
    ctx.globalAlpha = a * 0.3;
    const grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, fr * 2.5);
    grad.addColorStop(0, color); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(fx, fy, fr * 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'bind' || effect === 'adhesive') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(fx - fr, fy + (i - 2) * 4);
      ctx.lineTo(fx + fr, fy + (i - 2) * 4 + Math.sin(p * 10 + i) * 3); ctx.stroke();
    }
  } else if (effect === 'chain' || effect === 'crackle') {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(fx, fy);
      const tx = fx + facing * fr * 1.5 + (Math.random() - 0.5) * 20;
      const ty = fy + (Math.random() - 0.5) * 20;
      ctx.lineTo(tx, ty); ctx.stroke();
    }
  } else if (effect === 'hammer' || effect === 'club') {
    ctx.fillStyle = shade(color, -30); ctx.globalAlpha = a * 0.8;
    ctx.beginPath(); ctx.roundRect(fx - fr * 1.2, fy - fr * 0.8, fr * 2.4, fr * 1.6, 4); ctx.fill();
  } else if (effect === 'cane') {
    ctx.strokeStyle = shade(color, -40); ctx.lineWidth = 3; ctx.globalAlpha = a * 0.8;
    ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(fx, fy, fr * 0.8, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'haymaker' || effect === 'reckless' || effect === 'wild') {
    ctx.globalAlpha = a * 0.4;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p * 3;
      particle(ctx, fx + Math.cos(ang) * fr * 1.5, fy + Math.sin(ang) * fr * 1.5, fr * 0.6, color, p, i);
    }
  } else if (effect === 'mimic' || effect === 'stolen' || effect === 'shift') {
    ctx.globalAlpha = a * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.arc(fx, fy, fr * (1 + r * 0.4), 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'shrink' || effect === 'grow' || effect === 'giant') {
    const scaleMul = effect === 'giant' ? 1.5 : effect === 'grow' ? 1.2 : 0.7;
    ctx.globalAlpha = a * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx, fy, fr * scaleMul * 1.5, 0, Math.PI * 2); ctx.stroke();
  }

  // Particle trail (all jabs)
  const count = isHeavy ? 12 : 8;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const tx = x + facing * reach * t;
    const ty = y - 22 + Math.sin(t * Math.PI * 2 + p * 8) * (isHeavy ? 8 : 5);
    const psz = (isHeavy ? 7 : 5) * sz * (1 - t * 0.5) * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - t * 0.5) * 0.6;
    if (psz > 0.5) particle(ctx, tx, ty, psz, color, p, i);
  }

  // Opening flash
  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + facing * 15, y - 22, isHeavy ? 25 : 18, 0, Math.PI * 2); ctx.fill();
  }
}

// ── SLASH — arc-shaped cut (sword, blade, glass) ──
export function drawSlash(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const range = (isHeavy ? 100 : 75) * sz;
  const arcSpread = Math.min(p * 2.5, 1) * Math.PI * 0.7;

  // Main arc
  ctx.strokeStyle = color; ctx.lineWidth = isHeavy ? 5 : 3;
  ctx.shadowColor = color; ctx.shadowBlur = 15;
  ctx.globalAlpha = a * 0.85;
  ctx.beginPath();
  const cx = x + facing * 20;
  const cy = y - 25;
  ctx.arc(cx, cy, range, facing > 0 ? -arcSpread : Math.PI + arcSpread, facing > 0 ? arcSpread : Math.PI - arcSpread, facing < 0);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Effect-specific
  if (effect === 'shard' || effect === 'shatter' || effect === 'shards') {
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * arcSpread * 2 - arcSpread;
      const dist = range * (0.5 + Math.random() * 0.5);
      const sx = cx + Math.cos(facing > 0 ? ang : Math.PI - ang) * dist;
      const sy = cy + Math.sin(facing > 0 ? ang : Math.PI - ang) * dist;
      ctx.globalAlpha = a * 0.6;
      particle(ctx, sx, sy, 6 * sz, color, p, i);
    }
  } else if (effect === 'blade' || effect === 'lunge' || effect === 'overhead') {
    // Sharp blade trail
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, range * 0.85, facing > 0 ? -arcSpread : Math.PI + arcSpread, facing > 0 ? arcSpread : Math.PI - arcSpread, facing < 0);
    ctx.stroke();
  } else if (effect === 'frost' || effect === 'freeze') {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * arcSpread * 2 - arcSpread;
      const dist = range * 0.7;
      const sx = cx + Math.cos(facing > 0 ? ang : Math.PI - ang) * dist;
      const sy = cy + Math.sin(facing > 0 ? ang : Math.PI - ang) * dist;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, sx, sy, 7 * sz, color, p, i);
    }
  } else if (effect === 'gust' || effect === 'wind') {
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, range * (0.6 + i * 0.15), facing > 0 ? -arcSpread : Math.PI + arcSpread, facing > 0 ? arcSpread : Math.PI - arcSpread, facing < 0);
      ctx.stroke();
    }
  } else if (effect === 'club' || effect === 'hammer') {
    // Heavy blunt arc
    ctx.lineWidth = isHeavy ? 8 : 6; ctx.globalAlpha = a * 0.7;
    ctx.strokeStyle = shade(color, -40);
    ctx.beginPath();
    ctx.arc(cx, cy, range * 0.8, facing > 0 ? -arcSpread : Math.PI + arcSpread, facing > 0 ? arcSpread : Math.PI - arcSpread, facing < 0);
    ctx.stroke();
  } else if (effect === 'wrench') {
    ctx.strokeStyle = shade(color, -30); ctx.lineWidth = 4; ctx.globalAlpha = a * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y - 15); ctx.lineTo(x + facing * range * 0.8, y - 30);
    ctx.stroke();
  } else if (effect === 'sweep') {
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = a * 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, range * 1.2, facing > 0 ? -arcSpread * 1.5 : Math.PI + arcSpread * 1.5, facing > 0 ? arcSpread * 1.5 : Math.PI - arcSpread * 1.5, facing < 0);
    ctx.stroke();
  }

  // Particle trail along arc
  const pcount = isHeavy ? 14 : 10;
  for (let i = 0; i < pcount; i++) {
    const t = i / pcount;
    const ang = -arcSpread + t * arcSpread * 2;
    const dist = range * (0.6 + Math.sin(t * Math.PI) * 0.3);
    const sx = cx + Math.cos(facing > 0 ? ang : Math.PI - ang) * dist;
    const sy = cy + Math.sin(facing > 0 ? ang : Math.PI - ang) * dist;
    const psz = (isHeavy ? 6 : 4) * sz * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - Math.abs(t - 0.5) * 1.5) * 0.6;
    if (psz > 0.5) particle(ctx, sx, sy, psz, color, p, i);
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx, cy, isHeavy ? 22 : 16, 0, Math.PI * 2); ctx.fill();
  }
}

// ── WHIP — extending lash (vine, thread, water, shadow) ──
export function drawWhip(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const reach = (isHeavy ? 130 : 100) * sz * Math.min(p * 2.5, 1);
  const tipX = x + facing * reach;
  const tipY = y - 22 + Math.sin(p * Math.PI * 3) * 15;

  // Whip line
  ctx.strokeStyle = color; ctx.lineWidth = isHeavy ? 4 : 2.5;
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.globalAlpha = a * 0.85;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  const midX = x + facing * reach * 0.5;
  const midY = y - 22 + Math.sin(p * Math.PI * 2) * 25 * (effect === 'snap' ? 2 : 1);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Tip burst
  ctx.fillStyle = color; ctx.globalAlpha = a * 0.7;
  ctx.beginPath(); ctx.arc(tipX, tipY, (isHeavy ? 8 : 6) * sz, 0, Math.PI * 2); ctx.fill();

  // Effect-specific
  if (effect === 'vine' || effect === 'thorn' || effect === 'roots') {
    // Thorny segments along the whip
    for (let i = 0; i < 6; i++) {
      const t = (i + 1) / 7;
      const wx = x + facing * reach * t;
      const wy = y - 22 + Math.sin(t * Math.PI * 2 + p * 5) * 15;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, wx, wy, 5 * sz, color, p, i);
      // Thorns
      ctx.strokeStyle = shade(color, -30); ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.4;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + facing * 8, wy - 8); ctx.stroke();
    }
  } else if (effect === 'thread' || effect === 'net' || effect === 'bind') {
    // Thread lines
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(x, y - 22 + (i - 1) * 6);
      ctx.quadraticCurveTo(midX, midY + (i - 1) * 8, tipX, tipY + (i - 1) * 4); ctx.stroke();
    }
  } else if (effect === 'wave' || effect === 'water') {
    // Water droplets along the whip
    for (let i = 0; i < 8; i++) {
      const t = (i + 1) / 9;
      const wx = x + facing * reach * t;
      const wy = y - 22 + Math.sin(t * Math.PI * 3 + p * 6) * 12;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, wx, wy, 5 * sz, color, p, i);
    }
  } else if (effect === 'tendril' || effect === 'hollow' || effect === 'drain') {
    // Dark tendril with drain wisps
    for (let i = 0; i < 6; i++) {
      const t = (i + 1) / 7;
      const wx = x + facing * reach * t;
      const wy = y - 22 + Math.sin(t * Math.PI * 2 + p * 4) * 10;
      ctx.globalAlpha = a * 0.4;
      particle(ctx, wx, wy, 6 * sz, color, p, i);
    }
  } else if (effect === 'snap') {
    // Sharp snap effect at tip
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.6;
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(ang) * 15, tipY + Math.sin(ang) * 15); ctx.stroke();
    }
  } else if (effect === 'yank') {
    // Pulling lines
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo(tipX - facing * 30, tipY + (i - 2) * 10, x, y - 22); ctx.stroke();
    }
  }

  // Generic particles
  for (let i = 0; i < (isHeavy ? 10 : 7); i++) {
    const t = (i + 1) / (isHeavy ? 11 : 8);
    const wx = x + facing * reach * t;
    const wy = y - 22 + Math.sin(t * Math.PI * 2 + p * 6) * 12;
    const psz = 4 * sz * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - t * 0.3) * 0.5;
    if (psz > 0.5) particle(ctx, wx, wy, psz, color, p, i);
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + facing * 10, y - 22, 15, 0, Math.PI * 2); ctx.fill();
  }
}

// ── LAUNCH — upward boost (pillar, spout, gust, coil) ──
export function drawLaunch(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const height = (isHeavy ? 130 : 100) * sz * Math.min(p * 2.5, 1);

  // Main column
  ctx.globalAlpha = a * 0.5;
  const grad = ctx.createLinearGradient(x, y, x, y - height);
  grad.addColorStop(0, color + 'AA');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x - (isHeavy ? 16 : 11) * sz, y - height, (isHeavy ? 32 : 22) * sz, height);

  // Effect-specific column shape
  if (effect === 'coil' || effect === 'crackle') {
    // Lightning coil wrapping
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const cy = y - height * t;
      const cx = x + Math.sin(t * Math.PI * 4 + p * 6) * 12 * sz;
      if (i === 0) { ctx.beginPath(); ctx.moveTo(cx, cy); }
      else { ctx.lineTo(cx, cy); }
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  } else if (effect === 'burst' || effect === 'boost' || effect === 'explosive' || effect === 'detonate') {
    // Burst underneath
    ctx.globalAlpha = a * 0.6;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      particle(ctx, x + Math.cos(ang) * 15, y + Math.sin(ang) * 5, 8 * sz, color, p, i);
    }
  } else if (effect === 'spout' || effect === 'wave' || effect === 'tide') {
    // Water spout — widening at top
    ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 12 * sz, y);
    ctx.quadraticCurveTo(x - 20 * sz, y - height * 0.5, x - 25 * sz, y - height);
    ctx.lineTo(x + 25 * sz, y - height);
    ctx.quadraticCurveTo(x + 20 * sz, y - height * 0.5, x + 12 * sz, y);
    ctx.fill();
  } else if (effect === 'gust' || effect === 'wind' || effect === 'current' || effect === 'downdraft') {
    // Wind streaks
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 5; i++) {
      const off = (i - 2) * 8;
      ctx.beginPath(); ctx.moveTo(x + off, y);
      ctx.quadraticCurveTo(x + off + Math.sin(p * 5 + i) * 15, y - height * 0.5, x + off, y - height); ctx.stroke();
    }
  } else if (effect === 'vine' || effect === 'roots') {
    // Vine growing up
    ctx.strokeStyle = color; ctx.lineWidth = 3 * sz; ctx.globalAlpha = a * 0.7;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const vx = x + Math.sin(t * Math.PI * 3 + p * 4) * 15 * sz;
      const vy = y - height * t;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
    // Leaves
    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / 6;
      const vx = x + Math.sin(t * Math.PI * 3 + p * 4) * 15 * sz;
      const vy = y - height * t;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, vx, vy, 6 * sz, color, p, i);
    }
  } else if (effect === 'pillar' || effect === 'column') {
    // Solid stone/ice pillar
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.6;
    ctx.fillRect(x - 14 * sz, y - height, 28 * sz, height);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.3;
    ctx.strokeRect(x - 14 * sz, y - height, 28 * sz, height);
  } else if (effect === 'platform' || effect === 'plate') {
    // Barrier/metal platform
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.6;
    ctx.fillRect(x - 20 * sz, y - height * 0.8, 40 * sz, 8 * sz);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.4;
    ctx.strokeRect(x - 20 * sz, y - height * 0.8, 40 * sz, 8 * sz);
  } else if (effect === 'step' || effect === 'teleport' || effect === 'dissolve' || effect === 'swap') {
    // Shadow step / teleport — fading silhouette
    ctx.globalAlpha = a * 0.35;
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * Math.PI * 3 + p * 4) * 8, y - height * t, 10 * sz * (1 - t * 0.3), 18 * sz * (1 - t * 0.3), 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'fly' || effect === 'float' || effect === 'hover') {
    // Flying — wing-like streaks
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath(); ctx.moveTo(x, y - height * 0.5);
      ctx.quadraticCurveTo(x + side * 30 * sz, y - height * 0.7, x + side * 40 * sz, y - height * 0.4); ctx.stroke();
    }
  } else if (effect === 'wisps' || effect === 'siphon') {
    // Siphoning wisps rising
    for (let i = 0; i < 8; i++) {
      const t = (i + p * 2) % 1;
      const wx = x + Math.sin(t * Math.PI * 4 + i) * 12 * sz;
      const wy = y - height * t;
      ctx.globalAlpha = a * (1 - t) * 0.5;
      particle(ctx, wx, wy, 5 * sz * (1 - t * 0.5), color, p, i);
    }
  } else if (effect === 'yank') {
    // Thread yanking upward
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + (i - 1.5) * 8, y - height); ctx.stroke();
    }
  } else if (effect === 'rocket') {
    // Rocket boost — fire trail
    ctx.fillStyle = '#FFAA33'; ctx.globalAlpha = a * 0.6;
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      ctx.beginPath(); ctx.arc(x + (Math.random() - 0.5) * 10, y - height * t, 6 * sz * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'inject' || effect === 'overcharge' || effect === 'stolen') {
    // Energy injection
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.6;
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - height); ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (effect === 'starlight' || effect === 'heal' || effect === 'light' || effect === 'glow') {
    // Glowing particles rising
    for (let i = 0; i < 10; i++) {
      const t = (i + p * 3) % 1;
      const wx = x + Math.sin(t * Math.PI * 3 + i * 2) * 10 * sz;
      const wy = y - height * t;
      ctx.globalAlpha = a * (1 - t) * 0.6;
      particle(ctx, wx, wy, 4 * sz, color, p, i);
    }
  } else if (effect === 'echo' || effect === 'resonance' || effect === 'resonant' || effect === 'pulse') {
    // Echo rings
    for (let r = 0; r < 4; r++) {
      const rp = (p + r * 0.2) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.4;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y - height * rp, 15 * sz * rp, 25 * sz * rp, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'fear' || effect === 'dread') {
    // Dark fear wisps
    for (let i = 0; i < 8; i++) {
      const t = (i + p) % 1;
      ctx.globalAlpha = a * (1 - t) * 0.4;
      particle(ctx, x + Math.sin(t * Math.PI * 5 + i) * 15 * sz, y - height * t, 6 * sz, color, p, i);
    }
  } else if (effect === 'phase') {
    // Phasing — translucent
    ctx.globalAlpha = a * 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(x - 12 * sz, y - height, 24 * sz, height);
  } else if (effect === 'frost') {
    // Frost spreading up
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      ctx.globalAlpha = a * (1 - t) * 0.5;
      particle(ctx, x + Math.sin(t * Math.PI * 3) * 10 * sz, y - height * t, 5 * sz, color, p, i);
    }
  } else if (effect === 'plume' || effect === 'cloud' || effect === 'mist' || effect === 'ash' || effect === 'dust' || effect === 'cloak') {
    // Cloud/mist/ash plume
    for (let i = 0; i < 10; i++) {
      const t = (i + p * 2) % 1;
      const wx = x + Math.sin(t * Math.PI * 2 + i) * 18 * sz;
      const wy = y - height * t;
      ctx.globalAlpha = a * (1 - t) * 0.4;
      particle(ctx, wx, wy, 8 * sz * (1 - t * 0.3), color, p, i);
    }
  } else if (effect === 'spurs' || effect === 'spikes') {
    // Bone/metal spurs
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const sx = x + (i - 2) * 6 * sz;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + (i - 2) * 3, y - height * (0.5 + t * 0.3));
      ctx.lineTo(sx + 4, y);
      ctx.fill();
    }
  } else if (effect === 'adhesive' || effect === 'bind') {
    // Binding lines pulling up
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x + (i - 2) * 6, y);
      ctx.quadraticCurveTo(x + (i - 2) * 12, y - height * 0.5, x + (i - 2) * 4, y - height); ctx.stroke();
    }
  } else if (effect === 'lift' || effect === 'ring' || effect === 'gravity' || effect === 'well') {
    // Gravity lift — rings
    for (let r = 0; r < 4; r++) {
      const rp = (p + r * 0.25) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.4;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y - height * rp, 20 * sz * rp, 8 * sz, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'redirect' || effect === 'condense' || effect === 'expand' || effect === 'close' || effect === 'calm' || effect === 'restrain' || effect === 'silence') {
    // Energy manipulation
    for (let r = 0; r < 3; r++) {
      const rp = (p + r * 0.3) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.4;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - height * 0.5, 15 * sz * rp, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Generic particles in column
  const pcount = isHeavy ? 14 : 10;
  for (let i = 0; i < pcount; i++) {
    const t = i / pcount;
    const py = y - height * t;
    const px = x + Math.sin(t * Math.PI * 3 + p * 6) * (isHeavy ? 10 : 7) * sz;
    const psz = (isHeavy ? 9 : 6) * sz * (1 - t * 0.3) * (1 - p * 0.2);
    ctx.globalAlpha = a * (1 - t * 0.3) * 0.5;
    if (psz > 0.5) particle(ctx, px, py, psz, color, p, i);
  }

  if (p < 0.12) {
    ctx.globalAlpha = (0.12 - p) / 0.12 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 15, isHeavy ? 22 : 16, 0, Math.PI * 2); ctx.fill();
  }
}

// ── GROUND — effect spreading on the ground ──
export function drawGround(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const radius = (isHeavy ? 90 : 65) * sz * Math.min(p * 1.8, 1);

  if (effect === 'ripple' || effect === 'ring' || effect === 'pulse' || effect === 'echo' || effect === 'resonance' || effect === 'sense' || effect === 'calm' || effect === 'close' || effect === 'dread' || effect === 'corrupt' || effect === 'silence' || effect === 'restrain' || effect === 'heal' || effect === 'warm' || effect === 'glow' || effect === 'growth') {
    // Expanding ring/ripple
    for (let r = 0; r < 3; r++) {
      const rp = (p + r * 0.2) % 1;
      const rr = radius * rp;
      ctx.globalAlpha = a * (1 - rp) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'fissure' || effect === 'crack' || effect === 'tremor') {
    // Ground cracks
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        const t = s / 5;
        const fx = x + Math.cos(ang) * radius * t + (Math.random() - 0.5) * 8;
        const fy = y + Math.sin(ang) * radius * t * 0.3 + (Math.random() - 0.5) * 4;
        ctx.lineTo(fx, fy);
      }
      ctx.stroke();
    }
  } else if (effect === 'roots' || effect === 'thorns' || effect === 'vine') {
    // Roots bursting up
    ctx.strokeStyle = color; ctx.lineWidth = 3 * sz; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const rx = x + Math.cos(ang) * radius * 0.5;
      const ry = y + Math.sin(ang) * radius * 0.2;
      ctx.beginPath(); ctx.moveTo(rx, y);
      ctx.quadraticCurveTo(rx + Math.sin(p * 5 + i) * 10, ry - 30 * sz, rx, ry - 50 * sz); ctx.stroke();
      ctx.globalAlpha = a * 0.5;
      particle(ctx, rx, ry - 50 * sz, 6 * sz, color, p, i);
    }
  } else if (effect === 'spikes' || effect === 'spurs' || effect === 'iron' || effect === 'metal' || effect === 'barrier' || effect === 'construct') {
    // Spikes/constructs protruding
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.8;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const sx = x + Math.cos(ang) * radius * 0.4;
      const sy = y + Math.sin(ang) * radius * 0.15;
      ctx.beginPath();
      ctx.moveTo(sx - 5 * sz, y);
      ctx.lineTo(sx, y - 35 * sz * Math.min(p * 2, 1));
      ctx.lineTo(sx + 5 * sz, y);
      ctx.fill();
    }
  } else if (effect === 'pool' || effect === 'venom' || effect === 'poison' || effect === 'reactive' || effect === 'vial' || effect === 'potion') {
    // Pool forming
    ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, radius * 0.8, radius * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * radius * 0.5, y + Math.sin(ang) * radius * 0.15, 5 * sz, color, p, i);
    }
  } else if (effect === 'wave' || effect === 'tide' || effect === 'water') {
    // Wave rolling out
    ctx.globalAlpha = a * 0.5;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    for (let r = 0; r < 3; r++) {
      const rr = radius * (0.3 + r * 0.3);
      ctx.beginPath();
      for (let a2 = 0; a2 < Math.PI * 2; a2 += 0.1) {
        const wx = x + Math.cos(a2) * rr;
        const wy = y + Math.sin(a2) * rr * 0.25 + Math.sin(a2 * 5 + p * 8) * 3;
        if (a2 === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }
  } else if (effect === 'frost' || effect === 'freeze') {
    // Frost spreading
    ctx.globalAlpha = a * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * radius * 0.6, y + Math.sin(ang) * radius * 0.2, 6 * sz, color, p, i);
    }
  } else if (effect === 'pillar' || effect === 'column' || effect === 'sand' || effect === 'ash' || effect === 'ember' || effect === 'flame' || effect === 'detonate' || effect === 'blast') {
    // Small pillar/burst
    const ph = 30 * sz * Math.min(p * 2, 1);
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.6;
    ctx.fillRect(x - 12 * sz, y - ph, 24 * sz, ph);
    for (let i = 0; i < 8; i++) {
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + (Math.random() - 0.5) * 20, y - ph - Math.random() * 15, 5 * sz, color, p, i);
    }
  } else if (effect === 'cloud' || effect === 'mist' || effect === 'cloak' || effect === 'dissolve' || effect === 'hollow' || effect === 'dust' || effect === 'dismantle') {
    // Cloud/mist on ground
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const dist = radius * (0.3 + Math.random() * 0.5);
      ctx.globalAlpha = a * 0.4;
      particle(ctx, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist * 0.25, 8 * sz, color, p, i);
    }
  } else if (effect === 'gust' || effect === 'downdraft' || effect === 'wind' || effect === 'air') {
    // Wind on ground
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang) * radius * 0.5, y - 10, x + Math.cos(ang) * radius, y); ctx.stroke();
    }
  } else if (effect === 'portal') {
    // Portal opening
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.6;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(x, y, radius * 0.5 * (1 + r * 0.2), radius * 0.2 * (1 + r * 0.2), p * Math.PI, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'gadget') {
    // Sparking gadget
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.6;
    ctx.fillRect(x - 8, y - 8, 16, 8);
    ctx.strokeStyle = '#FFFF44'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x, y - 4);
      ctx.lineTo(x + (Math.random() - 0.5) * 20, y - 4 - Math.random() * 15); ctx.stroke();
    }
  } else if (effect === 'decoy' || effect === 'clone') {
    // Decoy/clone on ground
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y - 20, 12, 30, 0, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'shards' || effect === 'shatter') {
    // Glass shards on ground
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const dist = radius * 0.5;
      const sx = x + Math.cos(ang) * dist;
      const sy = y + Math.sin(ang) * dist * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy - 15); ctx.lineTo(sx - 4, sy - 15); ctx.fill();
    }
  } else if (effect === 'drain' || effect === 'siphon' || effect === 'absorb' || effect === 'redirect' || effect === 'stolen') {
    // Draining energy from ground
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * radius * 0.6, y + Math.sin(ang) * radius * 0.2);
      ctx.quadraticCurveTo(x + Math.cos(ang) * radius * 0.3, y - 15, x, y - 20); ctx.stroke();
    }
  } else if (effect === 'bind' || effect === 'adhesive') {
    // Binding on ground
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x - radius * 0.5 + i * radius * 0.2, y);
      ctx.lineTo(x - radius * 0.5 + i * radius * 0.2, y - 5); ctx.stroke();
    }
  } else if (effect === 'gravity' || effect === 'well' || effect === 'ring' || effect === 'shrink' || effect === 'grow') {
    // Gravity/size distortion
    for (let r = 0; r < 3; r++) {
      const rp = (p + r * 0.3) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.4;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, radius * rp, radius * rp * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Generic ground particles
  const pcount = isHeavy ? 16 : 12;
  for (let i = 0; i < pcount; i++) {
    const ang = (i / pcount) * Math.PI * 2;
    const dist = radius * (0.2 + 0.8 * Math.min(p * 1.5, 1));
    const px = x + Math.cos(ang) * dist;
    const py = y + Math.sin(ang) * dist * 0.25;
    const psz = (isHeavy ? 8 : 5) * sz * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - Math.abs(dist / radius - 0.5)) * 0.5;
    if (psz > 0.5) particle(ctx, px, py, psz, color, p, i);
  }

  // Ground line
  ctx.globalAlpha = a * 0.3;
  ctx.strokeStyle = color; ctx.lineWidth = isHeavy ? 3 : 2;
  ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
}

// ── SLAM — downward heavy hit ──
export function drawSlam(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const radius = (isHeavy ? 110 : 80) * sz * Math.min(p * 1.8, 1);

  // Impact ring
  ctx.globalAlpha = a * 0.5;
  ctx.strokeStyle = color; ctx.lineWidth = isHeavy ? 4 : 3;
  ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.3, 0, 0, Math.PI * 2); ctx.stroke();

  if (effect === 'fissure' || effect === 'crack') {
    // Ground fissures
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        const t = s / 5;
        const fx = x + Math.cos(ang) * radius * t + (Math.random() - 0.5) * 10;
        const fy = y + Math.sin(ang) * radius * t * 0.3 + (Math.random() - 0.5) * 5;
        ctx.lineTo(fx, fy);
      }
      ctx.stroke();
    }
  } else if (effect === 'ring' || effect === 'wave' || effect === 'spread' || effect === 'scatter' || effect === 'erupt' || effect === 'burst' || effect === 'detonate') {
    // Expanding ring/wave
    for (let r = 0; r < 3; r++) {
      const rp = (p + r * 0.2) % 1;
      const rr = radius * rp;
      ctx.globalAlpha = a * (1 - rp) * 0.6;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'freeze' || effect === 'frost') {
    // Freezing ground
    ctx.globalAlpha = a * 0.3;
    ctx.fillStyle = color + '40';
    ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * radius * 0.6, y + Math.sin(ang) * radius * 0.2, 7 * sz, color, p, i);
    }
  } else if (effect === 'tree' || effect === 'roots' || effect === 'vine' || effect === 'thorn') {
    // Tree/roots erupting
    ctx.strokeStyle = color; ctx.lineWidth = 4 * sz; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const rx = x + Math.cos(ang) * radius * 0.4;
      ctx.beginPath(); ctx.moveTo(rx, y);
      ctx.quadraticCurveTo(rx + Math.sin(p * 5 + i) * 15, y - 40 * sz, rx, y - 70 * sz * Math.min(p * 2, 1)); ctx.stroke();
      ctx.globalAlpha = a * 0.5;
      particle(ctx, rx, y - 70 * sz * Math.min(p * 2, 1), 8 * sz, color, p, i);
    }
  } else if (effect === 'net' || effect === 'bind' || effect === 'thread' || effect === 'adhesive') {
    // Net/threads spreading
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * radius, y + Math.sin(ang) * radius * 0.3); ctx.stroke();
    }
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(x, y, radius * (0.3 + r * 0.25), radius * (0.3 + r * 0.25) * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'dome' || effect === 'barrier' || effect === 'construct' || effect === 'platform') {
    // Dome/construct
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.25;
    ctx.beginPath(); ctx.arc(x, y - 20, radius * 0.7, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.arc(x, y - 20, radius * 0.7, Math.PI, 0); ctx.stroke();
  } else if (effect === 'iron' || effect === 'metal' || effect === 'spikes') {
    // Metal spikes
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.8;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const sx = x + Math.cos(ang) * radius * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx - 6 * sz, y);
      ctx.lineTo(sx, y - 40 * sz * Math.min(p * 2, 1));
      ctx.lineTo(sx + 6 * sz, y);
      ctx.fill();
    }
  } else if (effect === 'shockwave' || effect === 'wind' || effect === 'concussive') {
    // Shockwave
    for (let r = 0; r < 4; r++) {
      const rp = (p + r * 0.15) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 4 - r;
      ctx.beginPath(); ctx.ellipse(x, y, radius * rp, radius * rp * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'precise' || effect === 'focus' || effect === 'target' || effect === 'sense') {
    // Precise focused burst
    ctx.globalAlpha = a * 0.6;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y - 15, 20 * sz * Math.min(p * 2, 1), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.4;
    ctx.beginPath(); ctx.arc(x, y - 15, 25 * sz, 0, Math.PI * 2); ctx.stroke();
  } else if (effect === 'drain' || effect === 'hollow' || effect === 'siphon') {
    // Draining ground
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * radius * 0.7, y + Math.sin(ang) * radius * 0.2);
      ctx.quadraticCurveTo(x + Math.cos(ang) * radius * 0.3, y - 15, x, y - 25); ctx.stroke();
    }
  } else if (effect === 'echo' || effect === 'resonance' || effect === 'resonant' || effect === 'sound' || effect === 'starlight' || effect === 'glow' || effect === 'spirit' || effect === 'light' || effect === 'warm' || effect === 'heat') {
    // Echoing/sound/glow burst
    for (let r = 0; r < 4; r++) {
      const rp = (p + r * 0.2) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 15, radius * 0.6 * rp, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'mist' || effect === 'cloud' || effect === 'ash' || effect === 'dust' || effect === 'dismantle') {
    // Cloud/dust burst
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const dist = radius * (0.3 + Math.random() * 0.5);
      ctx.globalAlpha = a * 0.4;
      particle(ctx, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist * 0.25, 8 * sz, color, p, i);
    }
  } else if (effect === 'venom' || effect === 'poison' || effect === 'potion' || effect === 'reactive') {
    // Venom/poison burst
    ctx.globalAlpha = a * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, radius * 0.8, radius * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * radius * 0.5, y + Math.sin(ang) * radius * 0.15, 6 * sz, color, p, i);
    }
  } else if (effect === 'release' || effect === 'redirect' || effect === 'multiply' || effect === 'ring' || effect === 'crush' || effect === 'well') {
    // Energy release/gravity well
    for (let r = 0; r < 4; r++) {
      const rp = (p + r * 0.2) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 3 - r * 0.5;
      ctx.beginPath(); ctx.ellipse(x, y, radius * rp, radius * rp * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'corrupt' || effect === 'dread' || effect === 'silence' || effect === 'close' || effect === 'calm' || effect === 'restrain' || effect === 'silence') {
    // Dark/closing effect
    ctx.globalAlpha = a * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'hammer' || effect === 'mech' || effect === 'club') {
    // Hammer/mech slam
    ctx.fillStyle = shade(color, -30); ctx.globalAlpha = a * 0.7;
    ctx.beginPath(); ctx.roundRect(x - 20 * sz, y - 15, 40 * sz, 12, 4); ctx.fill();
  } else if (effect === 'overhead' || effect === 'stab') {
    // Overhead/stab — vertical line
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = a * 0.7;
    ctx.beginPath(); ctx.moveTo(x, y - 50); ctx.lineTo(x, y); ctx.stroke();
  } else if (effect === 'shatter' || effect === 'shards') {
    // Shattering
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const dist = radius * 0.5 * Math.min(p * 2, 1);
      const sx = x + Math.cos(ang) * dist;
      const sy = y + Math.sin(ang) * dist * 0.3;
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy - 12); ctx.lineTo(sx - 5, sy - 12); ctx.fill();
    }
  } else if (effect === 'trail' || effect === 'speed' || effect === 'fly' || effect === 'dive') {
    // Speed/flying slam
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y - 20);
      ctx.lineTo(x + Math.cos(ang) * radius, y + Math.sin(ang) * radius * 0.3); ctx.stroke();
    }
  } else if (effect === 'phase' || effect === 'shift' || effect === 'mimic' || effect === 'clone' || effect === 'swap') {
    // Phase/shift/clone
    ctx.globalAlpha = a * 0.3;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x + (i - 2) * 15, y - 20, 8, 25, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'giant' || effect === 'grow' || effect === 'shrink') {
    // Size effect
    const scale = effect === 'giant' ? 1.5 : effect === 'grow' ? 1.2 : 0.7;
    ctx.globalAlpha = a * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y, radius * scale, radius * scale * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (effect === 'fear' || effect === 'dread' || effect === 'nightmare') {
    // Fear/dread
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      ctx.globalAlpha = a * 0.4;
      particle(ctx, x + Math.cos(ang) * radius * 0.5, y + Math.sin(ang) * radius * 0.15, 7 * sz, color, p, i);
    }
  } else if (effect === 'crackle' || effect === 'chain' || effect === 'lightning') {
    // Lightning crackle
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x, y - 15);
      for (let s = 0; s < 4; s++) {
        const t = s / 4;
        ctx.lineTo(x + Math.cos(ang) * radius * t + (Math.random() - 0.5) * 15, y - 15 + Math.sin(ang) * radius * t * 0.3);
      }
      ctx.stroke();
    }
  } else if (effect === 'unstable' || effect === 'unpolished' || effect === 'small' || effect === 'clumsy' || effect === 'reckless' || effect === 'wild' || effect === 'overcharge' || effect === 'unstable') {
    // Unstable/wild burst
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = radius * Math.random();
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist * 0.3, 6 * sz, color, p, i);
    }
  }

  // Effect-specific slam particles (NOT generic circles — each effect is unique)
  const pcount = isHeavy ? 14 : 10;
  if (effect === 'push' || effect === 'burst' || effect === 'shove') {
    // Push burst — directional spray outward
    for (let i = 0; i < pcount; i++) {
      const ang = (i / pcount) * Math.PI * 2;
      const dist = radius * (0.3 + 0.7 * Math.min(p * 2, 1));
      ctx.globalAlpha = a * (1 - p) * 0.5;
      particle(ctx, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist * 0.2, (isHeavy ? 7 : 5) * sz, color, p, i);
    }
  } else if (effect === 'crackle' || effect === 'chain') {
    // Already drawn above — skip generic particles
  } else {
    // Subtle themed particles for other effects
    for (let i = 0; i < pcount; i++) {
      const ang = (i / pcount) * Math.PI * 2;
      const dist = radius * (0.2 + 0.6 * Math.min(p * 1.5, 1));
      ctx.globalAlpha = a * (1 - Math.abs(dist / radius - 0.5)) * 0.3;
      particle(ctx, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist * 0.2, (isHeavy ? 6 : 4) * sz * (1 - p * 0.3), color, p, i);
    }
  }

  // Impact flash — small, effect-colored (NOT a big white circle)
  if (p < 0.15 && p > 0.03) {
    ctx.globalAlpha = (1 - Math.abs(p - 0.09) / 0.06) * 0.25;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y - 12, isHeavy ? 25 : 18, 0, Math.PI * 2); ctx.fill();
  }
}

// ── CHARGE — dashing forward attack ──
export function drawCharge(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const reach = (isHeavy ? 120 : 90) * sz * Math.min(p * 2.5, 1);
  const dashX = x + facing * reach;

  // Dash trail
  ctx.globalAlpha = a * 0.4;
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const tx = x + facing * reach * t;
    ctx.globalAlpha = a * (1 - t) * 0.3;
    ctx.beginPath(); ctx.ellipse(tx, y - 22, 10 * sz * (1 - t * 0.3), 25 * sz * (1 - t * 0.3), 0, 0, Math.PI * 2); ctx.fill();
  }

  // Dash front — effect-dependent (NOT always a ball)
  ctx.shadowColor = color; ctx.shadowBlur = 10;

  if (effect === 'trail' || effect === 'speed') {
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(dashX, y - 22, (isHeavy ? 22 : 16) * sz, (isHeavy ? 8 : 6) * sz, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 5; i++) {
      const off = (i - 2) * 8;
      ctx.beginPath(); ctx.moveTo(x + facing * 10, y - 22 + off);
      ctx.lineTo(dashX, y - 22 + off + Math.sin(p * 10 + i) * 3); ctx.stroke();
    }
  } else if (effect === 'wall' || effect === 'fist' || effect === 'shove' || effect === 'shoulder') {
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.7;
    ctx.beginPath(); ctx.roundRect(dashX - facing * 20, y - 35, 40 * sz, 30, 5); ctx.fill();
  } else if (effect === 'discharge' || effect === 'crackle' || effect === 'chain') {
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(dashX, y - 22, (isHeavy ? 8 : 6) * sz, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(dashX, y - 22);
      ctx.lineTo(dashX + facing * 20 + (Math.random() - 0.5) * 15, y - 22 + (Math.random() - 0.5) * 20); ctx.stroke();
    }
  } else if (effect === 'freeze') {
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(dashX, y - 22 - (isHeavy ? 18 : 14) * sz);
    ctx.lineTo(dashX + (isHeavy ? 10 : 8) * sz, y - 22);
    ctx.lineTo(dashX, y - 22 + (isHeavy ? 18 : 14) * sz);
    ctx.lineTo(dashX - (isHeavy ? 10 : 8) * sz, y - 22);
    ctx.closePath(); ctx.fill();
  } else if (effect === 'dash' || effect === 'lunge' || effect === 'dive') {
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(dashX, y - 22); ctx.stroke();
  } else if (effect === 'iron' || effect === 'metal' || effect === 'barrier') {
    ctx.fillStyle = shade(color, 30); ctx.globalAlpha = a * 0.7;
    ctx.beginPath(); ctx.roundRect(dashX - facing * 15, y - 35, 30 * sz, 28, 4); ctx.fill();
  } else if (effect === 'grasp' || effect === 'drain') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(dashX, y - 22);
      ctx.quadraticCurveTo(dashX - facing * 20, y - 22 + (i - 2) * 8, x, y - 22); ctx.stroke();
    }
  } else if (effect === 'phase') {
    ctx.globalAlpha = a * 0.3;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x + facing * reach * (i / 5), y - 22, 8, 20, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (effect === 'portal') {
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.5;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.ellipse(dashX, y - 22, 15 * sz * (1 + r * 0.2), 20 * sz * (1 + r * 0.2), 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'grow' || effect === 'giant') {
    const scale = effect === 'giant' ? 1.5 : 1.2;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.4;
    ctx.beginPath(); ctx.arc(dashX, y - 22, 16 * sz * scale, 0, Math.PI * 2); ctx.stroke();
  } else if (effect === 'shockwave' || effect === 'wind' || effect === 'gust') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(dashX, y - 22, 15 * sz * (1 + i * 0.3), 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'hammer' || effect === 'club' || effect === 'reckless' || effect === 'wild') {
    ctx.fillStyle = shade(color, -30); ctx.globalAlpha = a * 0.7;
    ctx.beginPath(); ctx.roundRect(dashX - 18 * sz, y - 32, 36 * sz, 20, 4); ctx.fill();
  } else {
    // Default — elongated thrust, NOT a ball
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(dashX, y - 22, (isHeavy ? 18 : 14) * sz, (isHeavy ? 7 : 5) * sz, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Particles
  for (let i = 0; i < (isHeavy ? 14 : 10); i++) {
    const t = i / (isHeavy ? 14 : 10);
    const tx = x + facing * reach * t;
    const ty = y - 22 + Math.sin(t * Math.PI * 2 + p * 8) * (isHeavy ? 8 : 5);
    const psz = (isHeavy ? 7 : 5) * sz * (1 - t * 0.4) * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - t * 0.3) * 0.5;
    if (psz > 0.5) particle(ctx, tx, ty, psz, color, p, i);
  }

  // Small colored flash at dash start (NOT a big white ball)
  if (p < 0.12) {
    ctx.globalAlpha = (0.12 - p) / 0.12 * 0.25;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + facing * 10, y - 22, isHeavy ? 16 : 12, 0, Math.PI * 2); ctx.fill();
  }
}

// ── LINE BURST — white line that fades, with colored dots bursting from it (Purple's sidesig)
export function drawLineBurst(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const reach = (isHeavy ? 120 : 90) * sz;
  const lineLen = reach * Math.min(p * 2.5, 1);

  // White line — horizontal, fading out
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = isHeavy ? 4 : 3;
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = a * 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + facing * lineLen, y - 22);
  ctx.stroke();

  // White line afterglow — thinner, brighter core
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = a * 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + facing * lineLen, y - 22);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Many purple dots bursting from the line
  const dotCount = isHeavy ? 24 : 16;
  for (let i = 0; i < dotCount; i++) {
    const t = (i + p * 3) % 1;
    const dotX = x + facing * lineLen * t + Math.sin(i * 2.7 + p * 5) * 15 * sz;
    const dotY = y - 22 + Math.sin(i * 3.1 + p * 4) * 25 * sz * (1 - t * 0.3);
    const dotR = (isHeavy ? 5 : 4) * sz * (1 - t * 0.5) * a;
    if (dotR > 0.5) {
      ctx.globalAlpha = a * (1 - t * 0.6) * 0.8;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Smaller trailing dots along the line
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const dotX = x + facing * lineLen * t;
    const dotY = y - 22 + Math.cos(t * Math.PI * 3 + p * 6) * 4;
    ctx.globalAlpha = a * (1 - t) * 0.5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.5 * sz * (1 - t * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ── RADIAL — expanding burst/ring (push, pulse, orb) ──
export function drawRadial(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const radius = (isHeavy ? 100 : 75) * sz * Math.min(p * 2, 1);

  // Expanding ring
  ctx.globalAlpha = a * 0.6;
  ctx.strokeStyle = color; ctx.lineWidth = isHeavy ? 4 : 3;
  ctx.beginPath(); ctx.arc(x, y - 22, radius, 0, Math.PI * 2); ctx.stroke();

  if (effect === 'wave' || effect === 'pulse' || effect === 'resonance' || effect === 'resonant' || effect === 'echo') {
    for (let r = 0; r < 3; r++) {
      const rp = (p + r * 0.2) % 1;
      ctx.globalAlpha = a * (1 - rp) * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 22, radius * rp, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (effect === 'push' || effect === 'shove') {
    // Pushing wave
    ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y - 22, radius * 0.7, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'spike' || effect === 'spikes') {
    // Spikes radiating
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.7;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * radius * 0.3, y - 22 + Math.sin(ang) * radius * 0.3);
      ctx.lineTo(x + Math.cos(ang) * radius, y - 22 + Math.sin(ang) * radius); ctx.stroke();
    }
  } else if (effect === 'ring' || effect === 'orb') {
    // Orb/ring
    ctx.fillStyle = color; ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.arc(x, y - 22, radius * 0.3, 0, Math.PI * 2); ctx.fill();
  } else if (effect === 'potion' || effect === 'reactive') {
    // Potion splash
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      ctx.globalAlpha = a * 0.5;
      particle(ctx, x + Math.cos(ang) * radius * 0.6, y - 22 + Math.sin(ang) * radius * 0.6, 6 * sz, color, p, i);
    }
  }

  // Particles
  for (let i = 0; i < (isHeavy ? 16 : 12); i++) {
    const ang = (i / (isHeavy ? 16 : 12)) * Math.PI * 2;
    const dist = radius * Math.min(p * 2, 1);
    const px = x + Math.cos(ang) * dist;
    const py = y - 22 + Math.sin(ang) * dist;
    const psz = (isHeavy ? 7 : 5) * sz * (1 - p * 0.3);
    ctx.globalAlpha = a * 0.5;
    if (psz > 0.5) particle(ctx, px, py, psz, color, p, i);
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 22, isHeavy ? 25 : 18, 0, Math.PI * 2); ctx.fill();
  }
}

// ── BEAM — focused energy beam ──
export function drawBeam(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul] = cfg;
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const length = (isHeavy ? 200 : 150) * sz * Math.min(p * 3, 1);
  const width = (isHeavy ? 12 : 8) * sz;

  ctx.globalAlpha = a * 0.7;
  const grad = ctx.createLinearGradient(x, y - 22, x + facing * length, y - 22);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y - 22 - width / 2, facing * length, width);

  // Core
  ctx.globalAlpha = a * 0.9;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y - 22 - width / 4, facing * length, width / 2);

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 22, isHeavy ? 25 : 18, 0, Math.PI * 2); ctx.fill();
  }
}

// ── ILLUSION — duplicate/clone ──
export function drawIllusion(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, , color, sizeMul, effect] = cfg;
  const a = 1 - p;
  const sz = (sizeMul || 1);

  // Main clone
  ctx.globalAlpha = a * 0.4;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x + facing * 30 * Math.min(p * 2, 1), y - 22, 12 * sz, 30 * sz, 0, 0, Math.PI * 2); ctx.fill();

  // Extra clones
  for (let i = 0; i < 3; i++) {
    const off = (i + 1) * 25 * (1 - p * 0.5);
    ctx.globalAlpha = a * 0.25 * (1 - i * 0.2);
    ctx.beginPath(); ctx.ellipse(x + facing * (30 + off) * Math.min(p * 2, 1), y - 22 + (i - 1) * 10, 10 * sz, 25 * sz, 0, 0, Math.PI * 2); ctx.fill();
  }

  if (effect === 'lash' || effect === 'dash') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.4;
    ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + facing * 60 * Math.min(p * 2, 1), y - 22); ctx.stroke();
  } else if (effect === 'mirror') {
    ctx.globalAlpha = a * 0.3;
    ctx.beginPath(); ctx.ellipse(x - facing * 30 * Math.min(p * 2, 1), y - 22, 12 * sz, 30 * sz, 0, 0, Math.PI * 2); ctx.fill();
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + facing * 15, y - 22, 15, 0, Math.PI * 2); ctx.fill();
  }
}

// ── PORTAL — rift opening ──
export function drawPortal(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, particleName, color, sizeMul, effect] = cfg;
  const particle = getP(particleName);
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const portalX = x + facing * 40 * Math.min(p * 2, 1);
  const radius = (isHeavy ? 30 : 22) * sz;

  // Portal ellipse
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.7;
  ctx.shadowColor = color; ctx.shadowBlur = 15;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath(); ctx.ellipse(portalX, y - 22, radius * (1 + r * 0.2), radius * 1.5 * (1 + r * 0.2), p * Math.PI, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Portal interior
  ctx.globalAlpha = a * 0.3;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(portalX, y - 22, radius, radius * 1.5, 0, 0, Math.PI * 2); ctx.fill();

  if (effect === 'strike') {
    // Strike from portal
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.6;
    ctx.beginPath(); ctx.moveTo(portalX, y - 22); ctx.lineTo(x + facing * 80, y - 22); ctx.stroke();
  }

  // Particles
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + p * 5;
    ctx.globalAlpha = a * 0.5;
    particle(ctx, portalX + Math.cos(ang) * radius * 1.2, y - 22 + Math.sin(ang) * radius * 1.5, 5 * sz, color, p, i);
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(portalX, y - 22, 15, 0, Math.PI * 2); ctx.fill();
  }
}

// ── BARRIER — wall/dome construct ──
export function drawBarrier(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, , color, sizeMul, effect] = cfg;
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const size = (isHeavy ? 50 : 35) * sz * Math.min(p * 2, 1);

  if (effect === 'dome') {
    ctx.globalAlpha = a * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y - 10, size, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.arc(x, y - 10, size, Math.PI, 0); ctx.stroke();
  } else if (effect === 'wall' || effect === 'barrier') {
    ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = color;
    ctx.fillRect(x - size, y - 50 * sz, size * 2, 50 * sz);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.3;
    ctx.strokeRect(x - size, y - 50 * sz, size * 2, 50 * sz);
  } else {
    // Default barrier
    ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + facing * 20, y - 22, size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.6;
    ctx.beginPath(); ctx.arc(x + facing * 20, y - 22, size, 0, Math.PI * 2); ctx.stroke();
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + facing * 20, y - 22, 15, 0, Math.PI * 2); ctx.fill();
  }
}

// ── DRAIN — siphoning thread ──
export function drawDrain(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, , color, sizeMul, effect] = cfg;
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const reach = (isHeavy ? 100 : 75) * sz * Math.min(p * 2.5, 1);
  const targetX = x + facing * reach;

  // Siphoning threads
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.6;
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(targetX, y - 22 + (i - 2) * 6);
    ctx.quadraticCurveTo(x + facing * reach * 0.5, y - 22 + Math.sin(p * 8 + i) * 15, x, y - 22); ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Drain particles flowing back
  for (let i = 0; i < 8; i++) {
    const t = (i + p * 3) % 1;
    const dx = targetX - facing * reach * t;
    const dy = y - 22 + Math.sin(t * Math.PI * 3 + i) * 8;
    ctx.globalAlpha = a * (1 - t) * 0.6;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(dx, dy, 3 * sz * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
  }

  if (effect === 'thread' || effect === 'wisps') {
    ctx.globalAlpha = a * 0.3;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(targetX, y - 22 - i * 5, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + facing * 15, y - 22, 15, 0, Math.PI * 2); ctx.fill();
  }
}

// ── LINE ARC — line extends outward, then an arc blooms from the line's end (Purple side sig) ──
export function drawLineArc(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, , color, sizeMul] = cfg;
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const reach = (isHeavy ? 130 : 110) * sz;
  const lineLen = reach * Math.min(p * 2.5, 1);
  const tipX = x + facing * lineLen;
  const fy = y - 22;

  // Phase 1: line extends outward
  ctx.strokeStyle = color;
  ctx.lineWidth = isHeavy ? 5 : 4;
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.globalAlpha = a * 0.9;
  ctx.beginPath();
  ctx.moveTo(x, fy);
  ctx.lineTo(tipX, fy);
  ctx.stroke();
  // Bright core
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = a * 0.6;
  ctx.beginPath();
  ctx.moveTo(x, fy);
  ctx.lineTo(tipX, fy);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Phase 2: arc blooms from the line's tip (starts at p ~0.3)
  const arcP = Math.max(0, (p - 0.3) / 0.7);
  if (arcP > 0) {
    const arcR = (isHeavy ? 55 : 45) * sz * arcP;
    const arcSweep = Math.PI * 1.4 * arcP;
    ctx.globalAlpha = a * 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = isHeavy ? 5 : 4;
    ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(tipX, fy, arcR, -Math.PI / 2 - arcSweep / 2, -Math.PI / 2 + arcSweep / 2);
    ctx.stroke();
    // Inner accent arc
    ctx.globalAlpha = a * 0.5;
    ctx.strokeStyle = '#CC66FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tipX, fy, arcR * 0.7, -Math.PI / 2 - arcSweep / 2, -Math.PI / 2 + arcSweep / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Spark particles along the arc
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const ang = -Math.PI / 2 - arcSweep / 2 + arcSweep * t;
      const sx = tipX + Math.cos(ang) * arcR;
      const sy = fy + Math.sin(ang) * arcR;
      ctx.globalAlpha = a * (1 - t) * 0.7;
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : color;
      ctx.beginPath(); ctx.arc(sx, sy, 2.5 * sz * (1 - arcP * 0.5), 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ── ARC AROUND — a half arc sweeps in front of the character (Purple heavy) ──
export function drawArcAround(ctx, x, y, p, facing, cfg, isHeavy) {
  const [, , color, sizeMul] = cfg;
  const a = 1 - p;
  const sz = (sizeMul || 1);
  const radius = (isHeavy ? 120 : 95) * sz * 0.8; // 20% smaller
  const fy = y - 22;

  // Half arc in the facing direction (front only, not a full circle)
  const sweep = Math.min(p * 2.2, 1) * Math.PI; // half circle
  const startAng = -Math.PI / 2; // always start at top
  const endAng = startAng + facing * sweep; // facing right: clockwise to bottom; facing left: counterclockwise to bottom through left
  const anticw = facing < 0;

  ctx.globalAlpha = a * 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = isHeavy ? 6 : 5;
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(x, fy, radius, startAng, endAng, anticw);
  ctx.stroke();

  // Inner trailing arc (lighter, offset)
  ctx.globalAlpha = a * 0.5;
  ctx.strokeStyle = '#CC66FF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, fy, radius * 0.82, startAng, endAng, anticw);
  ctx.stroke();

  // Outer glow arc
  ctx.globalAlpha = a * 0.3;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, fy, radius * 1.12, startAng, endAng, anticw);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Leading edge spark
  const leadAng = endAng;
  const lx = x + Math.cos(leadAng) * radius;
  const ly = fy + Math.sin(leadAng) * radius;
  ctx.globalAlpha = a * 0.9;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(lx, ly, 5 * sz * (1 - p * 0.4), 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Trailing particles
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const ang = startAng + facing * sweep * (1 - t * 0.3);
    const px = x + Math.cos(ang) * radius;
    const py = fy + Math.sin(ang) * radius;
    ctx.globalAlpha = a * (1 - t) * 0.5;
    ctx.fillStyle = i % 2 === 0 ? color : '#CC66FF';
    ctx.beginPath(); ctx.arc(px, py, 3 * sz * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
  }
}