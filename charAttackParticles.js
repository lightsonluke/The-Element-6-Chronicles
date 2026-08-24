// charAttackParticles.js — Theme particle renderers + motion patterns
// for the data-driven per-character attack animation system.

function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// ── Particle renderers — one per visual family ──
// Each takes (ctx, px, py, sz, color, p, variant) and draws a single particle.
// The caller manages globalAlpha; renderers may multiply it for inner detail.

export const PARTICLES = {
  // Flame — flickering fire, warm colors
  flame: (ctx, px, py, sz, c, p, v) => {
    const flick = 0.7 + Math.sin(p * 18 + v * 3.7) * 0.3;
    ctx.fillStyle = [c, '#FF6600', '#FFAA00', '#FFDD44'][v % 4];
    ctx.beginPath(); ctx.arc(px, py, sz * flick, 0, Math.PI * 2); ctx.fill();
  },

  // Liquid — water/venom/blood droplet
  liquid: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(px, py, sz * 0.7, sz, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha *= 0.25;
    ctx.beginPath(); ctx.arc(px - sz * 0.3, py - sz * 0.3, sz * 0.25, 0, Math.PI * 2); ctx.fill();
  },

  // Crystal — ice/glass shard
  crystal: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(px, py - sz); ctx.lineTo(px + sz * 0.6, py);
    ctx.lineTo(px, py + sz); ctx.lineTo(px - sz * 0.6, py);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha *= 0.4;
    ctx.stroke();
  },

  // Bolt — lightning jagged line
  bolt: (ctx, px, py, sz, c, p, v) => {
    ctx.strokeStyle = v % 2 ? c : '#FFFF44'; ctx.lineWidth = 2;
    ctx.shadowColor = c; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(px - sz, py);
    for (let s = 1; s <= 4; s++) ctx.lineTo(px - sz + s * sz * 0.5, py + (Math.sin(s * 3 + v * 2) * sz * 0.6));
    ctx.stroke(); ctx.shadowBlur = 0;
  },

  // Streak — wind/speed/flight curved line
  streak: (ctx, px, py, sz, c, p, v) => {
    ctx.strokeStyle = v % 2 ? c : '#FFFFFF'; ctx.lineWidth = sz * 0.35;
    ctx.beginPath(); ctx.moveTo(px - sz * 2, py);
    ctx.quadraticCurveTo(px, py - sz * 0.6, px + sz * 2, py); ctx.stroke();
  },

  // Rock — stone/sand/bone/glass solid chunk
  rock: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = v % 2 ? c : shade(c, -50);
    ctx.beginPath(); ctx.rect(px - sz * 0.7, py - sz * 0.7, sz * 1.4, sz * 1.4); ctx.fill();
  },

  // Plant — vine/growth curved segment
  plant: (ctx, px, py, sz, c, p, v) => {
    ctx.strokeStyle = c; ctx.lineWidth = sz * 0.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, py + sz);
    ctx.quadraticCurveTo(px + sz * 0.5 * (v % 2 ? 1 : -1), py, px, py - sz); ctx.stroke();
  },

  // Cloud — mist/nightmare translucent cloud
  cloud: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c; ctx.globalAlpha *= 0.5;
    ctx.beginPath(); ctx.arc(px, py, sz * 1.3, 0, Math.PI * 2); ctx.fill();
  },

  // Spark — starlight/spirit/resonance/sound glowing dot
  spark: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = sz;
    ctx.beginPath(); ctx.arc(px, py, sz * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  },

  // Dark — shadow/drain/corruption/silence dark wisp
  dark: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = v % 2 ? c : '#1a0a2a'; ctx.globalAlpha *= 0.7;
    ctx.beginPath(); ctx.ellipse(px, py, sz, sz * 1.5, 0, 0, Math.PI * 2); ctx.fill();
  },

  // Thread — thread/binding thin line
  thread: (ctx, px, py, sz, c, p, v) => {
    ctx.strokeStyle = c; ctx.lineWidth = sz * 0.2;
    ctx.beginPath(); ctx.moveTo(px - sz, py);
    ctx.lineTo(px + sz, py + (v % 2 ? sz * 0.4 : -sz * 0.4)); ctx.stroke();
  },

  // Clone — illusion/duplication translucent silhouette
  clone: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c; ctx.globalAlpha *= 0.35;
    ctx.beginPath(); ctx.ellipse(px, py, sz * 0.5, sz, 0, 0, Math.PI * 2); ctx.fill();
  },

  // Metal — iron/barrier/construct/gadget metallic shape
  metal: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = v % 2 ? c : '#E0E0E0';
    ctx.beginPath(); ctx.rect(px - sz * 0.6, py - sz * 0.6, sz * 1.2, sz * 1.2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.globalAlpha *= 0.3;
    ctx.stroke();
  },

  // Slash — blade arc
  slash: (ctx, px, py, sz, c, p, v) => {
    ctx.strokeStyle = v % 2 ? c : '#FFFFFF'; ctx.lineWidth = sz * 0.3;
    ctx.beginPath(); ctx.arc(px, py, sz, -0.6, 0.6); ctx.stroke();
  },

  // Ring — portal/gravity/size ellipse outline
  ring: (ctx, px, py, sz, c, p, v) => {
    ctx.strokeStyle = c; ctx.lineWidth = sz * 0.2;
    ctx.beginPath(); ctx.ellipse(px, py, sz, sz * 1.5, 0, 0, Math.PI * 2); ctx.stroke();
  },

  // Glow — energy/telekinesis/control glowing orb
  glow: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = sz * 1.5;
    ctx.beginPath(); ctx.arc(px, py, sz * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  },

  // Phase — phasing ghostly wisp
  phase: (ctx, px, py, sz, c, p, v) => {
    ctx.fillStyle = c; ctx.globalAlpha *= 0.3;
    ctx.beginPath(); ctx.ellipse(px, py - v * 3, sz * 0.6, sz * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  },
};

// ── Motion patterns — place particles based on direction and weight ──

export function motionSide(ctx, x, y, p, facing, range, particle, color, isHeavy) {
  const a = 1 - p;
  const count = isHeavy ? 14 : 10;
  const reach = range * (isHeavy ? 1.3 : 1) * Math.min(p * 2, 1);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const dist = reach * t + 8;
    const px = x + facing * dist;
    const py = y - 18 + Math.sin(t * Math.PI * 2 + p * 8) * (isHeavy ? 12 : 8);
    const sz = (isHeavy ? 11 : 7) * (1 - t * 0.4) * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - t * 0.4);
    if (sz > 0.5) particle(ctx, px, py, sz, color, p, i);
  }
  if (p < 0.25) {
    ctx.globalAlpha = (0.25 - p) / 0.25 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + facing * reach * 0.4, y - 18, isHeavy ? 25 : 18, 0, Math.PI * 2); ctx.fill();
  }
}

export function motionUp(ctx, x, y, p, facing, range, particle, color, isHeavy) {
  const a = 1 - p;
  const height = range * (isHeavy ? 1.3 : 1) * Math.min(p * 2, 1);
  const count = isHeavy ? 12 : 10;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const py = y - height * t;
    const px = x + Math.sin(t * Math.PI * 3 + p * 6) * (isHeavy ? 10 : 7);
    const sz = (isHeavy ? 10 : 7) * (1 - t * 0.3) * (1 - p * 0.2);
    ctx.globalAlpha = a * (1 - t * 0.3);
    if (sz > 0.5) particle(ctx, px, py, sz, color, p, i);
  }
  ctx.globalAlpha = a * 0.25;
  const grad = ctx.createLinearGradient(x, y, x, y - height);
  grad.addColorStop(0, color + '80');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x - (isHeavy ? 16 : 10), y - height, isHeavy ? 32 : 20, height);
}

export function motionDown(ctx, x, y, p, facing, range, particle, color, isHeavy) {
  const a = 1 - p;
  const radius = range * (isHeavy ? 1.2 : 1) * Math.min(p * 1.5, 1);
  const count = isHeavy ? 16 : 12;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const dist = radius * (0.2 + 0.8 * Math.min(p * 1.5, 1));
    const px = x + Math.cos(ang) * dist;
    const py = y + Math.sin(ang) * dist * 0.25;
    const sz = (isHeavy ? 9 : 6) * (1 - p * 0.3);
    ctx.globalAlpha = a * (1 - Math.abs(dist / radius - 0.5));
    if (sz > 0.5) particle(ctx, px, py, sz, color, p, i);
  }
  ctx.globalAlpha = a * 0.4;
  ctx.strokeStyle = color; ctx.lineWidth = isHeavy ? 3 : 2;
  ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
  if (isHeavy && p > 0.2 && p < 0.5) {
    ctx.globalAlpha = (1 - Math.abs(p - 0.35) / 0.15) * 0.3;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 10, 40, 0, Math.PI * 2); ctx.fill();
  }
}

export function motionSuper(ctx, x, y, p, particle, color, theme) {
  const a = 1 - p;
  // Screen flash at start
  if (p < 0.12) {
    ctx.globalAlpha = (0.12 - p) / 0.12 * 0.5;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 1200, 700);
  }

  // Theme-specific stage-wide effect
  const fam = theme;
  if (fam === 'fire' || fam === 'ash' || fam === 'explosive') {
    // Sweeping firestorm — horizontal sweep
    for (let w = 0; w < 5; w++) {
      const phase = p - w * 0.08;
      if (phase < 0 || phase > 1) continue;
      const sweepX = phase * 1200;
      for (let i = 0; i < 10; i++) {
        const fx = sweepX - 80 + i * 16;
        const fy = 80 + Math.sin(i * 0.7 + phase * 8) * 250 + 200;
        ctx.globalAlpha = a * (0.7 - w * 0.1) * (1 - phase);
        particle(ctx, fx, fy, 13 * (1 - phase * 0.4), color, phase, i + w * 10);
      }
    }
  } else if (fam === 'water' || fam === 'venom' || fam === 'blood' || fam === 'potion' || fam === 'serum') {
    // Rising tidal wall that sweeps across
    const wallH = p * 350;
    ctx.globalAlpha = a * 0.4;
    const grad = ctx.createLinearGradient(0, y, 0, y - wallH);
    grad.addColorStop(0, color + 'AA');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - wallH, 1200, wallH);
    for (let i = 0; i < 18; i++) {
      const wx = (i * 67 + p * 300) % 1200;
      ctx.globalAlpha = a * 0.6;
      particle(ctx, wx, y - wallH * (0.3 + Math.sin(i) * 0.3), 11, color, p, i);
    }
  } else if (fam === 'ice' || fam === 'blizzard' || fam === 'glass') {
    // Flash-freeze — crystalline particles + freeze sweep
    for (let i = 0; i < 30; i++) {
      const sx = (i * 41 + Math.sin(i * 3) * 80) % 1200;
      const sy = (i * 19) % 450 + 50;
      ctx.globalAlpha = a * (1 - p * 0.5) * 0.6;
      particle(ctx, sx, sy, 13 * (1 - p * 0.3), color, p, i);
    }
    ctx.globalAlpha = a * 0.2;
    ctx.fillStyle = color + '30';
    ctx.fillRect(0, 0, 1200 * Math.min(p * 1.5, 1), 700);
  } else if (fam === 'shadow' || fam === 'drain' || fam === 'nightmare' || fam === 'corruption' || fam === 'silence') {
    // Multiple dark strikes from different angles
    for (let i = 0; i < 8; i++) {
      const phase = p - i * 0.08;
      if (phase < 0 || phase > 1) continue;
      const ang = (i / 8) * Math.PI * 2;
      const dist = 120 + Math.sin(phase * Math.PI) * 180;
      const sx = x + Math.cos(ang) * dist;
      const sy = y - 18 + Math.sin(ang) * dist * 0.6;
      ctx.globalAlpha = a * (1 - phase) * 0.8;
      ctx.strokeStyle = i % 2 ? color : '#FFFFFF';
      ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(sx - Math.cos(ang + 1) * 45, sy - Math.sin(ang + 1) * 45);
      ctx.lineTo(sx + Math.cos(ang + 1) * 45, sy + Math.sin(ang + 1) * 45);
      ctx.stroke(); ctx.shadowBlur = 0;
    }
  } else if (fam === 'vines' || fam === 'growth') {
    // Overgrowth — vines spreading across the stage
    for (let v = 0; v < 6; v++) {
      const phase = p - v * 0.06;
      if (phase < 0 || phase > 1) continue;
      ctx.globalAlpha = a * (1 - phase) * 0.7;
      ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      const startX = (v * 200) % 1200;
      ctx.moveTo(startX, 650);
      for (let s = 0; s < 12; s++) {
        const t = s / 12;
        const vx = startX + Math.sin(t * Math.PI * 3 + v) * 60 * phase;
        const vy = 650 - t * 500 * phase;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
  } else if (fam === 'illusion' || fam === 'duplication') {
    // Flood the stage with duplicate silhouettes
    for (let i = 0; i < 12; i++) {
      const phase = (p + i * 0.08) % 1;
      const sx = (i * 97 + Math.sin(i * 5) * 100) % 1100 + 50;
      const sy = (i * 53 % 400) + 100;
      ctx.globalAlpha = a * (1 - phase) * 0.4;
      particle(ctx, sx, sy, 18, color, phase, i);
    }
  } else {
    // Generic stage-wide particle storm
    for (let i = 0; i < 35; i++) {
      const seed = i * 7.3;
      const sx = (seed * 137) % 1200;
      const sy = ((seed * 89) % 450) + 50;
      const phase = (p + i * 0.04) % 1;
      const sz = 9 * (1 - phase * 0.5) * (0.5 + Math.sin(seed) * 0.5);
      ctx.globalAlpha = a * (1 - phase) * 0.6;
      if (sz > 0.5) particle(ctx, sx, sy, sz, color, phase, i);
    }
  }

  // Expanding rings (all themes)
  for (let r = 0; r < 4; r++) {
    const rp = p - r * 0.15;
    if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = (1 - rp) * 0.4;
    ctx.strokeStyle = r === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, (60 + r * 80) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}