// uniqueSupers.js — Hand-crafted unique super animations for ALL 77 characters.
// Each character has a distinct, visually unique super move animation.
// Functions take (ctx, x, y, p, color, W, H) where p is progress 0→1.

// ── GEN 5 HEROES ─────────────────────────────────────────────────────────────

function sup_yellow(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Speed lines radiating
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2 + p * 3;
    const len = 60 + p * 220;
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = i % 4 === 0 ? '#FFFFFF' : c;
    ctx.lineWidth = i % 4 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * 20, y - 18 + Math.sin(ang) * 20);
    ctx.lineTo(x + Math.cos(ang) * len, y - 18 + Math.sin(ang) * len);
    ctx.stroke();
  }
  // Golden burst core
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, 80 + p * 120);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.4, c); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.5; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, 80 + p * 120, 0, Math.PI * 2); ctx.fill();
  // Concentric speed rings
  for (let r = 0; r < 5; r++) {
    const rp = p - r * 0.12; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.08); ctx.strokeStyle = r === 0 ? '#FFF' : c;
    ctx.lineWidth = 3 - r * 0.4;
    ctx.beginPath(); ctx.arc(x, y - 18, (40 + r * 50) * rp, 0, Math.PI * 2); ctx.stroke();
  }
}

function sup_blue(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Rising tsunami waves
  for (let w = 0; w < 6; w++) {
    const phase = p - w * 0.08; if (phase < 0) continue;
    ctx.globalAlpha = a * (0.7 - w * 0.08);
    ctx.strokeStyle = w === 0 ? '#FFFFFF' : c; ctx.lineWidth = 5 - w;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.03) {
      const wx = x - 200 + t * 400;
      const wy = y - 30 + Math.sin(t * Math.PI * 4 + phase * 10) * (40 + phase * 60);
      t === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  // Water column rising
  const colH = p * 250;
  const grad = ctx.createLinearGradient(x, y, x, y - colH);
  grad.addColorStop(0, c + 'CC'); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.4; ctx.fillStyle = grad;
  ctx.fillRect(x - 25, y - colH, 50, colH);
  // Ice crystals at top
  if (p > 0.4) {
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#AAEEFF';
    for (let i = 0; i < 15; i++) {
      const ix = x - 100 + i * 14;
      const iy = y - colH + Math.sin(i + p * 5) * 10;
      ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix + 4, iy - 12); ctx.lineTo(ix + 8, iy); ctx.fill();
    }
  }
}

function sup_purple(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Shadow clones slashing from multiple angles
  for (let i = 0; i < 8; i++) {
    const phase = p - i * 0.08; if (phase < 0 || phase > 0.8) continue;
    const ang = (i / 8) * Math.PI * 2 + p * 2;
    const dist = 80 + Math.sin(phase * Math.PI) * 100;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.5;
    ctx.globalAlpha = a * (1 - phase) * 0.8;
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : c; ctx.lineWidth = 4;
    ctx.shadowColor = c; ctx.shadowBlur = 15;
    const slashAng = ang + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(slashAng) * 45, sy - Math.sin(slashAng) * 45);
    ctx.lineTo(sx + Math.cos(slashAng) * 45, sy + Math.sin(slashAng) * 45);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // Dark void core
  ctx.globalAlpha = a * 0.4; ctx.fillStyle = '#220033';
  ctx.beginPath(); ctx.arc(x, y - 18, p * 70, 0, Math.PI * 2); ctx.fill();
}

function sup_orange(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Portals opening and striking
  for (let i = 0; i < 10; i++) {
    const phase = p - i * 0.06; if (phase < 0 || phase > 0.9) continue;
    const sx = x + Math.sin(i * 11) * 200;
    const sy = y - 18 + Math.cos(i * 13) * 120;
    ctx.globalAlpha = a * (1 - phase) * 0.6;
    ctx.strokeStyle = c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(sx, sy, 18, 24, p * Math.PI, 0, Math.PI * 2); ctx.stroke();
    // Strike from portal
    ctx.globalAlpha = a * (1 - phase) * 0.5;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx - 25, sy); ctx.lineTo(sx + 25, sy); ctx.stroke();
  }
  // Central portal burst
  ctx.globalAlpha = a * 0.5; ctx.strokeStyle = c; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(x, y - 18, 25, 35, 0, 0, Math.PI * 2); ctx.stroke();
}

function sup_green(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Stone titan rising from ground
  const titanH = Math.min(p * 2, 1) * 200;
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = c;
  ctx.fillRect(x - 50, y - titanH, 100, titanH);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.3;
  ctx.strokeRect(x - 50, y - titanH, 100, titanH);
  // Stone fists punching outward
  if (p > 0.4) {
    for (const side of [-1, 1]) {
      const fistX = x + side * (80 + (p - 0.4) * 200);
      ctx.globalAlpha = a * 0.7; ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(fistX, y - titanH * 0.5, 30, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Cracks
  ctx.globalAlpha = a * 0.4; ctx.strokeStyle = '#443322'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo(x - 50 + i * 20, y - titanH);
    ctx.lineTo(x - 50 + i * 20 + Math.sin(i) * 15, y); ctx.stroke();
  }
}

function sup_pink(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Objects spiraling inward then exploding
  for (let i = 0; i < 14; i++) {
    const baseAng = (i / 14) * Math.PI * 2;
    const ang = baseAng + p * Math.PI * 4;
    const dist = p < 0.5 ? 150 * (1 - p * 2) : (p - 0.5) * 300;
    const ox = x + Math.cos(ang) * dist;
    const oy = y - 18 + Math.sin(ang) * dist * 0.55;
    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : c; ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang + p * 5);
    ctx.fillRect(-7, -7, 14, 14); ctx.restore();
  }
  ctx.shadowBlur = 0;
  // Slam flash
  if (p > 0.45 && p < 0.6) {
    ctx.globalAlpha = (1 - Math.abs(p - 0.52) / 0.08) * 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 18, 90, 0, Math.PI * 2); ctx.fill();
  }
}

function sup_grey(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Barrier fortress rising
  const fortH = Math.min(p * 2, 1) * 180;
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = c;
  ctx.fillRect(x - 80, y - fortH, 160, fortH);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.4;
  ctx.strokeRect(x - 80, y - fortH, 160, fortH);
  // Barrier panels extending outward
  for (let i = 0; i < 5; i++) {
    const panelY = y - fortH + i * 36;
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = c;
    ctx.fillRect(x - 120, panelY, 40, 8);
    ctx.fillRect(x + 80, panelY, 40, 8);
  }
  // Shatter at end
  if (p > 0.6) {
    for (let i = 0; i < 12; i++) {
      const sx = x - 60 + i * 10;
      const sy = y - fortH * 0.5 + (p - 0.6) * 250;
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(i + p * 5);
      ctx.fillRect(-5, -5, 10, 10); ctx.restore();
    }
  }
}

function sup_turquoise(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Shifting form multi-hit
  for (let i = 0; i < 12; i++) {
    const phase = p - i * 0.05; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 12) * Math.PI * 2;
    const dist = 60 + Math.sin(phase * Math.PI) * 120;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.5;
    // Shifting silhouette
    ctx.globalAlpha = a * (1 - phase) * 0.7;
    ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF';
    ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(sx, sy, 12, 20, ang + p * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_olive(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  if (p < 0.3) {
    // Shrink effect
    ctx.globalAlpha = a * 0.3; ctx.strokeStyle = c; ctx.lineWidth = 4;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath(); ctx.arc(x, y - 18, 200 * (1 - p / 0.3 * 0.5 + r * 0.1), 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    // Grow + slam
    const growR = (p - 0.3) / 0.7 * 200;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x, y - 18, growR, 0, Math.PI * 2); ctx.fill();
    if (p > 0.7) {
      for (let i = 0; i < 15; i++) {
        const ang = (i / 15) * Math.PI * 2;
        ctx.globalAlpha = a * 0.6;
        ctx.beginPath(); ctx.arc(x + Math.cos(ang) * growR, y - 18 + Math.sin(ang) * growR * 0.5, 10, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function sup_copper(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Freeze everything in radius
  const freezeR = p * 250;
  ctx.globalAlpha = a * 0.2; ctx.fillStyle = '#AAEEFF';
  ctx.beginPath(); ctx.arc(x, y - 18, freezeR, 0, Math.PI * 2); ctx.fill();
  // Ice crystals radiating
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const r = freezeR * (0.3 + (i % 3) * 0.2);
    const cx = x + Math.cos(ang) * r;
    const cy = y - 18 + Math.sin(ang) * r * 0.6;
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#AAEEFF';
    ctx.shadowColor = '#AAEEFF'; ctx.shadowBlur = 10;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;
}

function sup_emerald(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Phasing through reality — ghost copies
  for (let i = 0; i < 8; i++) {
    const phase = p - i * 0.06; if (phase < 0 || phase > 0.9) continue;
    const ox = x + Math.sin(i * 7 + p * 5) * 80;
    const oy = y - 18 + Math.cos(i * 5 + p * 3) * 50;
    ctx.globalAlpha = a * (1 - phase) * 0.4;
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(ox, oy, 25, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Phase rift lines
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = a * 0.4;
    ctx.strokeStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * (50 + p * 150), y - 18 + Math.sin(ang) * (50 + p * 150));
    ctx.stroke();
  }
}

function sup_pearl(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Sonic pulse rings expanding
  for (let r = 0; r < 6; r++) {
    const rp = p - r * 0.1; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.07); ctx.strokeStyle = r % 2 === 0 ? c : '#FFFFFF';
    ctx.lineWidth = 3 - r * 0.3;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 300, 0, Math.PI * 2); ctx.stroke();
  }
  // Sound wave particles
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2;
    const dist = p * 250 + Math.sin(i + p * 10) * 20;
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.6, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_red(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Energy orb volley
  for (let i = 0; i < 16; i++) {
    const phase = p - i * 0.04; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 16) * Math.PI * 2;
    const dist = 40 + phase * 250;
    const ox = x + Math.cos(ang) * dist;
    const oy = y - 18 + Math.sin(ang) * dist * 0.5;
    ctx.globalAlpha = a * (1 - phase) * 0.8;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : c;
    ctx.shadowColor = c; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(ox, oy, 8 + Math.sin(phase * 10) * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_lavender(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Sky citadel — floating platforms
  for (let i = 0; i < 8; i++) {
    const sx = x - 180 + i * 50;
    const sy = y - 60 - Math.sin(i + p * 3) * 80;
    ctx.globalAlpha = a * 0.5; ctx.strokeStyle = c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(sx, sy, 45, 8, 4); ctx.stroke();
    ctx.globalAlpha = a * 0.2; ctx.fillStyle = c; ctx.fillRect(sx, sy, 45, 8);
  }
  // Collapse
  if (p > 0.5) {
    for (let i = 0; i < 8; i++) {
      const sx = x - 180 + i * 50;
      const sy = y - 60 + (p - 0.5) * 300;
      ctx.globalAlpha = a * 0.4; ctx.fillStyle = c;
      ctx.fillRect(sx, sy, 45, 8);
    }
  }
}

function sup_amber(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Mirror army — clone silhouettes striking
  for (let i = 0; i < 12; i++) {
    const phase = p - i * 0.05; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 12) * Math.PI * 2;
    const dist = 60 + Math.sin(phase * Math.PI) * 120;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.5;
    ctx.globalAlpha = a * (1 - phase) * 0.5;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(sx, sy - 15, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(sx - 5, sy - 8, 10, 18, 3); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_black(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Lightning convergence from corners
  const corners = [[-W/2,-H/2],[W/2,-H/2],[-W/2,H/2],[W/2,H/2]];
  corners.forEach(([cx, cy], i) => {
    if (p < i * 0.08) return;
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = i % 2 === 0 ? '#FFFF44' : '#FFFFFF';
    ctx.lineWidth = 3; ctx.shadowColor = '#FFFF44'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(x + cx, y + cy);
    for (let s = 1; s <= 6; s++) {
      const t = s / 6;
      ctx.lineTo(x + cx * (1-t) + (Math.random()-0.5)*30, y + cy * (1-t) + (Math.random()-0.5)*20);
    }
    ctx.lineTo(x, y - 18); ctx.stroke();
  });
  // Center flash
  ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#FFFF44'; ctx.shadowColor = '#FFFF44'; ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(x, y - 18, 20 + p * 60, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function sup_magenta(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Binding adhesive strands across stage
  ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.shadowColor = c; ctx.shadowBlur = 10;
  for (let i = 0; i < 10; i++) {
    const sy = y - 200 + i * 40;
    ctx.globalAlpha = a * (0.4 + Math.sin(i + p * 5) * 0.2);
    ctx.beginPath(); ctx.moveTo(0, sy);
    for (let sx = 0; sx <= W; sx += 20) {
      ctx.lineTo(sx, sy + Math.sin(sx * 0.02 + i + p * 3) * 15);
    }
    ctx.stroke();
  }
  // Adhesive blobs
  for (let i = 0; i < 15; i++) {
    const bx = (i * 80) % W;
    const by = (i * 50) % 300 + 100;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(bx, by, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_indigo(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Gravity collapse — concentric rings compressing then exploding
  for (let r = 0; r < 6; r++) {
    const rr = (160 - r * 20) * (p < 0.5 ? 1 - p * 1.6 + r * 0.1 : (p - 0.5) * 2.5);
    if (rr < 0) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.07);
    ctx.strokeStyle = r % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(x, y - 18, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Void core
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#000000'; ctx.shadowColor = c; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.arc(x, y - 18, 15 * (1 - p * 0.5), 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function sup_maroon(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Absorb all energy then release
  if (p < 0.5) {
    // Inward drain
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const dist = 250 * (1 - p * 2);
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 6, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Release burst
    const burstR = (p - 0.5) * 2 * 200;
    const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, burstR);
    grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, c); grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y - 18, burstR, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_crimson(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Massive detonation
  const coreR = p * 180;
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, coreR);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.2, '#FF6600'); grad.addColorStop(0.6, c); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.85; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, coreR, 0, Math.PI * 2); ctx.fill();
  // Fire tongues
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + p * 2;
    const len = coreR * (0.6 + Math.sin(p * 20 + i) * 0.4);
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = i % 3 === 0 ? '#FFFFFF' : '#FF4400'; ctx.lineWidth = 4 * (1 - p);
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * len, y - 18 + Math.sin(ang) * len); ctx.stroke();
  }
}

function sup_scarlet(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Spirit drain — ghostly wisps converging
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2 + p * 3;
    const dist = p < 0.6 ? 200 * (1 - p * 1.5) : (p - 0.6) * 300;
    const ox = x + Math.cos(ang) * dist;
    const oy = y - 18 + Math.sin(ang) * dist * 0.5;
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(ox, oy, 6, 12, ang, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Spirit core
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 60, 0, Math.PI * 2); ctx.fill();
}

function sup_white(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Heaven's descent — light beam from above
  const beamH = 400 * Math.min(p * 3, 1);
  const grad = ctx.createLinearGradient(x, y - beamH, x, y);
  grad.addColorStop(0, 'transparent'); grad.addColorStop(0.5, '#FFFFFFBB'); grad.addColorStop(1, c + '88');
  ctx.globalAlpha = a * 0.7; ctx.fillStyle = grad;
  ctx.fillRect(x - 25, y - beamH, 50, beamH);
  // Wings of light
  for (const side of [-1, 1]) {
    const wingSpan = p * 200;
    ctx.globalAlpha = a * 0.5; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    for (let f = 0; f < 5; f++) {
      ctx.beginPath(); ctx.moveTo(x, y - 30);
      ctx.quadraticCurveTo(x + side * wingSpan * 0.5, y - 30 - f * 20, x + side * (wingSpan * 0.6 + f * 20), y - 30 + Math.sin(f) * 30);
      ctx.stroke();
    }
  }
}

function sup_silver(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Foresight — chrome ripples and mirror shards
  for (let r = 0; r < 6; r++) {
    const rr = (30 + r * 35) * p;
    ctx.globalAlpha = a * (0.55 - r * 0.07);
    ctx.strokeStyle = r % 2 === 0 ? '#C0C0C0' : '#FFFFFF'; ctx.lineWidth = 3 - r * 0.3;
    ctx.beginPath(); ctx.arc(x, y - 18, rr, 0, Math.PI * 2); ctx.stroke();
  }
  // Mirror shards
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + p * 3;
    const dist = 60 + p * 120;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.6;
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#C0C0C0' : '#FFFFFF';
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang + p * 5);
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ── GEN 5 VILLAINS ───────────────────────────────────────────────────────────

function sup_corpent(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Venom hammer combo sweeps
  for (let i = 0; i < 10; i++) {
    const phase = p - i * 0.06; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 10) * Math.PI * 2;
    const sx = x + Math.cos(ang) * (40 + phase * 150);
    const sy = y - 18 + Math.sin(ang) * (40 + phase * 100) * 0.5;
    ctx.globalAlpha = a * (1 - phase) * 0.7;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang + phase * 5);
    ctx.fillRect(-12, -12, 24, 24); ctx.restore();
    // Venom splash
    ctx.globalAlpha = a * (1 - phase) * 0.3; ctx.fillStyle = '#88DD44';
    ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_magneto(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Metal barrage — shards flying from all directions
  for (let i = 0; i < 18; i++) {
    const phase = p - i * 0.03; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 18) * Math.PI * 2;
    const dist = 250 - phase * 200;
    const sx = x + Math.cos(ang) * dist;
    const sy = y - 18 + Math.sin(ang) * dist * 0.5;
    ctx.globalAlpha = a * (1 - phase) * 0.8;
    ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF';
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang + p * 8);
    ctx.fillRect(-3, -15, 6, 30); ctx.restore();
  }
  // Magnetic core
  ctx.globalAlpha = a * 0.4; ctx.strokeStyle = c; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 80, 0, Math.PI * 2); ctx.stroke();
}

function sup_willow(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Root overgrowth — vines engulfing stage
  ctx.strokeStyle = c; ctx.lineWidth = 4;
  for (let v = 0; v < 10; v++) {
    const phase = p - v * 0.04; if (phase < 0 || phase > 1) continue;
    ctx.globalAlpha = a * (1 - phase) * 0.7;
    const startX = (v * 130) % W;
    ctx.beginPath(); ctx.moveTo(startX, H);
    for (let s = 0; s < 15; s++) {
      const t = s / 15;
      const vx = startX + Math.sin(t * Math.PI * 3 + v) * 60 * phase;
      const vy = H - t * 500 * phase;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }
  // Thorns
  for (let i = 0; i < 25; i++) {
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc((i * 55 + Math.sin(i) * 40) % W, (i * 30) % 400 + 100, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function sup_cable(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Chain lightning between points
  const points = [];
  for (let i = 0; i < 8; i++) {
    points.push({ x: x + Math.sin(i * 11) * 200, y: y - 18 + Math.cos(i * 13) * 120 });
  }
  points.push({ x, y: y - 18 });
  for (let i = 0; i < points.length - 1; i++) {
    if (p < i * 0.08) continue;
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 3;
    ctx.shadowColor = c; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y);
    for (let s = 1; s <= 5; s++) {
      const t = s / 5;
      ctx.lineTo(points[i].x + (points[i+1].x - points[i].x) * t + (Math.random()-0.5)*20,
                 points[i].y + (points[i+1].y - points[i].y) * t + (Math.random()-0.5)*15);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_snodvor(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Blizzard — snow and ice filling screen
  ctx.globalAlpha = a * 0.2; ctx.fillStyle = '#AAEEFF';
  ctx.fillRect(0, 0, W, H);
  // Snow particles
  for (let i = 0; i < 50; i++) {
    const sx = (i * 47 + p * 200) % W;
    const sy = (i * 73 + p * 300) % H;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(sx, sy, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
  // Ice spikes from ground
  for (let i = 0; i < 15; i++) {
    const ix = (i * 90) % W;
    const ih = Math.min(p * 2, 1) * 120;
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(ix, H); ctx.lineTo(ix + 10, H - ih); ctx.lineTo(ix + 20, H); ctx.fill();
  }
}

function sup_kirsten(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Elegant flame waltz — sweeping fire arcs
  for (let w = 0; w < 5; w++) {
    const phase = p - w * 0.1; if (phase < 0) continue;
    ctx.globalAlpha = a * (0.7 - w * 0.1);
    ctx.strokeStyle = w === 0 ? '#FFFFFF' : c; ctx.lineWidth = 5 - w;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.03) {
      const wx = x - 200 + t * 400;
      const wy = y - 30 + Math.sin(t * Math.PI * 5 + phase * 8 + w) * (30 + phase * 50);
      t === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  // Flame petals
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * p * 150, y - 18 + Math.sin(ang) * p * 100, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_volt(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Concussive lightning blast from sky
  if (p < 0.15) {
    ctx.globalAlpha = (0.15 - p) / 0.15 * 0.5; ctx.fillStyle = c; ctx.fillRect(0, 0, W, H);
  }
  // Lightning bolt from top
  ctx.globalAlpha = a * 0.9; ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.shadowColor = c; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.moveTo(x, 0);
  for (let s = 1; s <= 8; s++) {
    ctx.lineTo(x + (Math.random()-0.5)*40, s * (y - 18) / 8);
  }
  ctx.stroke();
  // Concussive shockwave
  for (let r = 0; r < 4; r++) {
    const rp = p - r * 0.12; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.1); ctx.strokeStyle = r === 0 ? '#FFFFFF' : c; ctx.lineWidth = 4 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 200, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_temple(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Dust pulse — everything ages to dust
  for (let i = 0; i < 30; i++) {
    const ang = (i / 30) * Math.PI * 2;
    const dist = p * 250 + Math.sin(i * 7) * 30;
    const ox = x + Math.cos(ang) * dist;
    const oy = y - 18 + Math.sin(ang) * dist * 0.5;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(ox, oy, 4 + (i % 4), 0, Math.PI * 2); ctx.fill();
  }
  // Cracking effect
  ctx.globalAlpha = a * 0.4; ctx.strokeStyle = c; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    for (let s = 1; s <= 5; s++) {
      ctx.lineTo(x + Math.cos(ang) * s * 40 + (Math.random()-0.5)*20, y - 18 + Math.sin(ang) * s * 40);
    }
    ctx.stroke();
  }
}

function sup_nightmare(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Nightmare haze — dark tendrils and fear
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = c; ctx.fillRect(0, 0, W, H);
  // Tendrils
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = a * 0.6; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.shadowColor = c; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    for (let s = 1; s <= 8; s++) {
      const t = s / 8;
      ctx.lineTo(x + Math.cos(ang + Math.sin(t * 5 + i)) * t * 200, y - 18 + Math.sin(ang + Math.sin(t * 5 + i)) * t * 120);
    }
    ctx.stroke();
  }
  // Fear eyes
  for (let i = 0; i < 6; i++) {
    const ex = x + Math.sin(i * 7 + p * 3) * 150;
    const ey = y - 18 + Math.cos(i * 5 + p * 2) * 80;
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#FF0000'; ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.ellipse(ex, ey, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_hazel(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Poison overgrowth — thorned vines + poison clouds
  ctx.strokeStyle = c; ctx.lineWidth = 4;
  for (let v = 0; v < 8; v++) {
    const phase = p - v * 0.05; if (phase < 0 || phase > 1) continue;
    ctx.globalAlpha = a * (1 - phase) * 0.7;
    const startX = (v * 150) % W;
    ctx.beginPath(); ctx.moveTo(startX, H);
    for (let s = 0; s < 15; s++) {
      const t = s / 15;
      ctx.lineTo(startX + Math.sin(t * Math.PI * 3 + v) * 60 * phase, H - t * 500 * phase);
    }
    ctx.stroke();
  }
  // Poison clouds
  for (let i = 0; i < 15; i++) {
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#88DD44';
    ctx.beginPath(); ctx.arc((i * 90) % W, (i * 50) % 300 + 100, 15 + Math.sin(i + p * 5) * 5, 0, Math.PI * 2); ctx.fill();
  }
}

function sup_whami(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Unstable potion — random colored splashes
  const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'];
  for (let i = 0; i < 25; i++) {
    const col = colors[i % colors.length];
    const sx = x + Math.cos(i * 0.7 + p * 3) * (50 + p * 220);
    const sy = y - 18 + Math.sin(i * 0.5 + p * 2) * (30 + p * 150);
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(sx, sy, 8 * (1 - p * 0.3), 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Central flask
  ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
  ctx.beginPath(); ctx.ellipse(x, y - 18, 20, 25, 0, 0, Math.PI * 2); ctx.fill();
}

// ── COSMIC TIER ──────────────────────────────────────────────────────────────

function sup_controller(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Absorb and multiply — energy converges then bursts outward multiplied
  if (p < 0.4) {
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const dist = 250 * (1 - p / 0.4);
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 5, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    const burstR = (p - 0.4) / 0.6 * 250;
    for (let r = 0; r < 5; r++) {
      ctx.globalAlpha = a * (0.5 - r * 0.08); ctx.strokeStyle = r === 0 ? '#FFFFFF' : c; ctx.lineWidth = 4 - r;
      ctx.beginPath(); ctx.arc(x, y - 18, burstR + r * 30, 0, Math.PI * 2); ctx.stroke();
    }
    // Multiplied particles
    for (let i = 0; i < 30; i++) {
      const ang = (i / 30) * Math.PI * 2 + p * 5;
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF';
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * burstR, y - 18 + Math.sin(ang) * burstR * 0.5, 6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

function sup_evil(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Compression — stage compresses inward then releases
  if (p < 0.5) {
    const compressR = 250 * (1 - p * 1.8);
    ctx.globalAlpha = a * 0.5; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.shadowColor = c; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(x, y - 18, compressR, 0, Math.PI * 2); ctx.stroke();
    // Inward particles
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + p * 3;
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * compressR, y - 18 + Math.sin(ang) * compressR * 0.5, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Release
    const releaseR = (p - 0.5) * 2 * 200;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 25;
    ctx.beginPath(); ctx.arc(x, y - 18, releaseR, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, releaseR, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_life(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Growth burst — light and life expanding
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, p * 250);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, c); grad.addColorStop(0.7, c + '66'); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 250, 0, Math.PI * 2); ctx.fill();
  // Flower petals
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + p * 2;
    const dist = p * 200;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF';
    ctx.save(); ctx.translate(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5);
    ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // Healing motes rising
  for (let i = 0; i < 12; i++) {
    const mx = x + Math.sin(i * 7 + p * 3) * 100;
    const my = y - p * 200 - i * 15;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_death(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Closure pulse — silence and endings
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
  // Closing rings
  for (let r = 0; r < 5; r++) {
    const rp = p - r * 0.1; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.08); ctx.strokeStyle = r === 0 ? '#FFFFFF' : c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 200, 0, Math.PI * 2); ctx.stroke();
  }
  // Silent void
  ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#000000'; ctx.shadowColor = c; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 60, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function sup_mercy(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Restraint pulse — soft calming waves
  for (let r = 0; r < 6; r++) {
    const rp = p - r * 0.08; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.4 - r * 0.05); ctx.strokeStyle = r % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 3 - r * 0.3;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 280, 0, Math.PI * 2); ctx.stroke();
  }
  // Gentle motes
  for (let i = 0; i < 15; i++) {
    const ang = (i / 15) * Math.PI * 2 + p * 1.5;
    const dist = p * 200;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ── OLD GEN — GENERATION I ───────────────────────────────────────────────────

function sup_g1_thunder(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Storm call — lightning storm from sky
  for (let i = 0; i < 8; i++) {
    if (p < i * 0.06) continue;
    const sx = x + (i - 4) * 60;
    ctx.globalAlpha = a * 0.8; ctx.strokeStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 3; ctx.shadowColor = c; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(sx, 0);
    for (let s = 1; s <= 6; s++) ctx.lineTo(sx + (Math.random()-0.5)*30, s * (y-18)/6);
    ctx.lineTo(sx, y - 18); ctx.stroke();
  }
  // Thunder rings
  for (let r = 0; r < 3; r++) {
    const rp = p - r * 0.15; if (rp < 0) continue;
    ctx.globalAlpha = a * 0.4; ctx.strokeStyle = c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 150, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_g1_fire(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Inferno sweep — fire sweeping across
  for (let w = 0; w < 4; w++) {
    const phase = p - w * 0.1; if (phase < 0) continue;
    ctx.globalAlpha = a * (0.7 - w * 0.1);
    ctx.strokeStyle = w === 0 ? '#FFFFFF' : c; ctx.lineWidth = 6 - w;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.03) {
      const wx = x - 200 + t * 400;
      const wy = y - 30 + Math.sin(t * Math.PI * 4 + phase * 6) * (40 + phase * 50);
      t === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  // Fire particles
  for (let i = 0; i < 20; i++) {
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = i % 2 === 0 ? c : '#FF8800'; ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x - 150 + i * 15, y - 30 + Math.sin(i + p * 5) * 40, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_g1_water(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Tidal wave
  const waveH = Math.min(p * 2, 1) * 200;
  ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let wx = 0; wx <= W; wx += 15) {
    ctx.lineTo(wx, H - waveH + Math.sin(wx * 0.02 + p * 5) * 30);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // Wave crest foam
  ctx.globalAlpha = a * 0.6; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let wx = 0; wx <= W; wx += 15) {
    const wy = H - waveH + Math.sin(wx * 0.02 + p * 5) * 30;
    wx === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
  }
  ctx.stroke();
  // Water spout at center
  ctx.globalAlpha = a * 0.4; ctx.fillStyle = c;
  ctx.fillRect(x - 20, y - 250, 40, 250);
}

function sup_g1_grass(ctx, x, y, p, c, W, H) {
  sup_willow(ctx, x, y, p, c, W, H); // reuse overgrowth
}

function sup_g1_ice(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Glacial wall rising
  const wallH = Math.min(p * 2, 1) * 250;
  ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
  ctx.fillRect(x - 100, y - wallH, 200, wallH);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.4;
  ctx.strokeRect(x - 100, y - wallH, 200, wallH);
  // Ice crystals on wall
  for (let i = 0; i < 12; i++) {
    const ix = x - 80 + i * 15;
    const ih = 20 + Math.sin(i) * 10;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.moveTo(ix, y - wallH); ctx.lineTo(ix + 5, y - wallH - ih); ctx.lineTo(ix + 10, y - wallH); ctx.fill();
  }
  // Shatter
  if (p > 0.6) {
    for (let i = 0; i < 15; i++) {
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
      ctx.save(); ctx.translate(x - 80 + i * 12, y - wallH * 0.5 + (p-0.6) * 250); ctx.rotate(i + p * 5);
      ctx.fillRect(-5, -5, 10, 10); ctx.restore();
    }
  }
}

// ── OLD GEN — GENERATION II ──────────────────────────────────────────────────

function sup_g2_renji(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Iron bastion — fortress rising then slamming
  const fortH = Math.min(p * 2, 1) * 180;
  ctx.globalAlpha = a * 0.7; ctx.fillStyle = c;
  ctx.fillRect(x - 70, y - fortH, 140, fortH);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.4;
  ctx.strokeRect(x - 70, y - fortH, 140, fortH);
  // Iron plates
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = c;
    ctx.fillRect(x - 70, y - fortH + i * 45, 140, 4);
  }
  // Slam
  if (p > 0.5) {
    const slamY = y - 180 + (p - 0.5) * 360;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = c;
    ctx.fillRect(x - 70, slamY, 140, 20);
  }
}

function sup_g2_kaito(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Ember barrage — fireballs flying
  for (let i = 0; i < 14; i++) {
    const phase = p - i * 0.04; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 14) * Math.PI * 2;
    const dist = 30 + phase * 250;
    ctx.globalAlpha = a * (1 - phase) * 0.8;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : c; ctx.shadowColor = c; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 10, 0, Math.PI * 2); ctx.fill();
    // Fire trail
    ctx.globalAlpha = a * (1 - phase) * 0.3; ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5);
    ctx.lineTo(x + Math.cos(ang) * (dist - 30), y - 18 + Math.sin(ang) * (dist - 30) * 0.5); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_g2_hana(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Whirlpool — spinning water vortex
  for (let r = 0; r < 8; r++) {
    const rp = p - r * 0.06; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.05); ctx.strokeStyle = r === 0 ? '#FFFFFF' : c; ctx.lineWidth = 4 - r * 0.3;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.05) {
      const ang = t * Math.PI * 4 + rp * 5 + r;
      const rad = rp * 200 * t;
      const wx = x + Math.cos(ang) * rad;
      const wy = y - 18 + Math.sin(ang) * rad * 0.5;
      t === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  // Water core
  ctx.globalAlpha = a * 0.4; ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 50, 0, Math.PI * 2); ctx.fill();
}

function sup_g2_daigo(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Boulder hurl — giant rock flying
  const rockR = 40 + p * 60;
  ctx.globalAlpha = a * 0.7; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(x, y - 18, rockR, 0, Math.PI * 2); ctx.fill();
  // Rock fragments
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + p * 3;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = c;
    ctx.save(); ctx.translate(x + Math.cos(ang) * rockR, y - 18 + Math.sin(ang) * rockR * 0.5); ctx.rotate(ang);
    ctx.fillRect(-8, -8, 16, 16); ctx.restore();
  }
  // Impact rings
  for (let r = 0; r < 3; r++) {
    const rp = p - r * 0.15; if (rp < 0) continue;
    ctx.globalAlpha = a * 0.4; ctx.strokeStyle = c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 200, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_g2_suzu(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Gale storm — wind cyclone
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2 + p * 5;
    const dist = p * 200 + Math.sin(i) * 30;
    ctx.globalAlpha = a * 0.5; ctx.strokeStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5);
    ctx.lineTo(x + Math.cos(ang + 0.3) * (dist + 30), y - 18 + Math.sin(ang + 0.3) * (dist + 30) * 0.5);
    ctx.stroke();
  }
  // Cyclone core
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 80, 0, Math.PI * 2); ctx.fill();
}

function sup_g2_mai(ctx, x, y, p, c, W, H) {
  sup_purple(ctx, x, y, p, c, W, H); // shadow dance = shadow clones
}

function sup_g2_osamu(ctx, x, y, p, c, W, H) {
  sup_pearl(ctx, x, y, p, c, W, H); // resonant echo = sonic pulse
}

function sup_g2_yui(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Starlight burst — radiant light explosion
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, p * 250);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, c); grad.addColorStop(0.7, c + '66'); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 250, 0, Math.PI * 2); ctx.fill();
  // Star rays
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = a * 0.7; ctx.strokeStyle = i % 2 === 0 ? '#FFFFFF' : c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * p * 200, y - 18 + Math.sin(ang) * p * 200); ctx.stroke();
  }
  // Star sparkles
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + p * 3;
    const dist = p * 180;
    ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function sup_g2_ibuki(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Soul siphon — dark drain field
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + p * 2;
    const dist = p < 0.6 ? 200 * (1 - p * 1.5) : (p - 0.6) * 300;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 5, 10, ang, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Dark core
  ctx.globalAlpha = a * 0.4; ctx.fillStyle = '#220033';
  ctx.beginPath(); ctx.arc(x, y - 18, p * 50, 0, Math.PI * 2); ctx.fill();
}

function sup_g2_nishikawa(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Puppet bind — threads everywhere
  ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.shadowColor = c; ctx.shadowBlur = 8;
  for (let i = 0; i < 12; i++) {
    const sy = y - 200 + i * 35;
    ctx.globalAlpha = a * (0.4 + Math.sin(i + p * 4) * 0.2);
    ctx.beginPath(); ctx.moveTo(0, sy);
    for (let sx = 0; sx <= W; sx += 20) ctx.lineTo(sx, sy + Math.sin(sx * 0.02 + i + p * 3) * 15);
    ctx.stroke();
  }
  // Marionette cross
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = c;
  ctx.fillRect(x - 40, y - 250, 80, 6);
  ctx.fillRect(x - 3, y - 250, 6, 250);
  ctx.shadowBlur = 0;
}

function sup_g2_itto(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Blade flurry — rapid cuts everywhere
  for (let i = 0; i < 14; i++) {
    const phase = p - i * 0.04; if (phase < 0 || phase > 0.9) continue;
    const sx = x + Math.sin(i * 11) * 200;
    const sy = y - 18 + Math.cos(i * 13) * 120;
    ctx.globalAlpha = a * (1 - phase) * 0.8;
    ctx.strokeStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 4; ctx.shadowColor = c; ctx.shadowBlur = 15;
    const ang2 = i * 0.7 + p * 3;
    ctx.beginPath(); ctx.moveTo(sx - Math.cos(ang2) * 50, sy - Math.sin(ang2) * 50);
    ctx.lineTo(sx + Math.cos(ang2) * 50, sy + Math.sin(ang2) * 50); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function sup_g2_twinfoxes(ctx, x, y, p, c, W, H) {
  sup_amber(ctx, x, y, p, c, W, H); // illusion flood = clone army
}

function sup_g2_utsuro(ctx, x, y, p, c, W, H) {
  sup_g2_ibuki(ctx, x, y, p, c, W, H); // drain field = soul siphon
}

// ── OLD GEN — GENERATION III ─────────────────────────────────────────────────

function sup_g3_takeshi(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Sandstorm
  ctx.globalAlpha = a * 0.2; ctx.fillStyle = c; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    const sx = (i * 47 + p * 300) % W;
    const sy = (i * 73 + p * 200) % H;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = i % 2 === 0 ? c : '#DDBB88';
    ctx.beginPath(); ctx.arc(sx, sy, 3 + (i % 4), 0, Math.PI * 2); ctx.fill();
  }
  // Sand pillars
  for (let i = 0; i < 6; i++) {
    const px = x - 150 + i * 60;
    const ph = Math.min(p * 2, 1) * 150;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
    ctx.fillRect(px - 8, y - ph, 16, ph);
  }
}

function sup_g3_aiko(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Bone cage
  ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.globalAlpha = a * 0.7;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const r = 80 * Math.min(p * 2, 1);
    ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * r, y);
    ctx.lineTo(x + Math.cos(ang) * r, y - 120 * Math.min(p * 2, 1)); ctx.stroke();
  }
  for (let r = 0; r < 3; r++) {
    ctx.beginPath(); ctx.ellipse(x, y - 40 - r * 30, 80 * Math.min(p * 2, 1), 15, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

function sup_g3_haru(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Glass storm — crystal shards flying
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + p * 3;
    const dist = p * 200;
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF';
    ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.save(); ctx.translate(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5); ctx.rotate(ang + p * 5);
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  // Glass shatter lines
  ctx.globalAlpha = a * 0.3; ctx.strokeStyle = c; ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * p * 200, y - 18 + Math.sin(ang) * p * 200); ctx.stroke();
  }
}

function sup_g3_chiyo(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Toxic cloud
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 250, 0, Math.PI * 2); ctx.fill();
  // Toxic particles
  for (let i = 0; i < 25; i++) {
    const ang = (i / 25) * Math.PI * 2 + p * 2;
    const dist = p * 200 + Math.sin(i + p * 5) * 30;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = i % 2 === 0 ? c : '#88DD44';
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 8 + Math.sin(i) * 3, 0, Math.PI * 2); ctx.fill();
  }
}

function sup_g3_emi(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Sanguine mend — blood heal/burst
  for (let i = 0; i < 15; i++) {
    const ang = (i / 15) * Math.PI * 2 + p * 2;
    const dist = p * 180;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Healing cross
  ctx.globalAlpha = a * 0.5; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.shadowColor = c; ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.moveTo(x - 30, y - 18); ctx.lineTo(x + 30, y - 18);
  ctx.moveTo(x, y - 48); ctx.lineTo(x, y + 12); ctx.stroke();
  ctx.shadowBlur = 0;
}

function sup_g3_nozomi(ctx, x, y, p, c, W, H) {
  sup_willow(ctx, x, y, p, c, W, H); // thorn overgrowth
}

function sup_g3_masaru(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Ash burst
  const coreR = p * 150;
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, coreR);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, c); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.7; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, coreR, 0, Math.PI * 2); ctx.fill();
  // Ash particles
  for (let i = 0; i < 25; i++) {
    const ang = (i / 25) * Math.PI * 2 + p * 3;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = i % 2 === 0 ? c : '#999999';
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * coreR, y - 18 + Math.sin(ang) * coreR * 0.5, 4 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
}

function sup_g3_ryo(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Mist veil — cloud multi-strike
  ctx.globalAlpha = a * 0.3; ctx.fillStyle = c; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) {
    const phase = p - i * 0.06; if (phase < 0 || phase > 0.9) continue;
    const sx = x + Math.sin(i * 11) * 180;
    const sy = y - 18 + Math.cos(i * 13) * 100;
    ctx.globalAlpha = a * (1 - phase) * 0.6;
    ctx.strokeStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx - 30, sy); ctx.lineTo(sx + 30, sy); ctx.stroke();
  }
}

function sup_g3_souta(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Clumsy burst — small unpolished explosion
  const coreR = p * 120;
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, coreR);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, c); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, coreR, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = a * 0.4; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * coreR * 0.7, y - 18 + Math.sin(ang) * coreR * 0.5, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function sup_g3_ogata(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Overcharge — chemical combo
  for (let i = 0; i < 10; i++) {
    const phase = p - i * 0.05; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 10) * Math.PI * 2;
    const dist = 30 + phase * 200;
    ctx.globalAlpha = a * (1 - phase) * 0.7;
    ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF'; ctx.shadowColor = c; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Chemical vials
  ctx.globalAlpha = a * 0.4; ctx.fillStyle = c;
  ctx.beginPath(); ctx.ellipse(x, y - 18, 15, 20, 0, 0, Math.PI * 2); ctx.fill();
}

function sup_g3_kanenobu(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Golden construct — metal building
  const buildH = Math.min(p * 2, 1) * 180;
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = c;
  ctx.fillRect(x - 60, y - buildH, 120, buildH);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.4;
  ctx.strokeRect(x - 60, y - buildH, 120, buildH);
  // Golden gears
  for (let i = 0; i < 5; i++) {
    const gx = x - 40 + i * 20;
    const gy = y - buildH * 0.5;
    ctx.globalAlpha = a * 0.5; ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, gy, 10, 0, Math.PI * 2); ctx.stroke();
  }
}

// ── OLD GEN — GENERATION IV ──────────────────────────────────────────────────

function sup_g4_cobalt(ctx, x, y, p, c, W, H) {
  sup_g2_renji(ctx, x, y, p, c, W, H); // barrier slam = iron bastion
}

function sup_g4_cyan(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Cyclone
  for (let r = 0; r < 6; r++) {
    const rp = p - r * 0.08; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.06); ctx.strokeStyle = r === 0 ? '#FFFFFF' : c; ctx.lineWidth = 4 - r * 0.3;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.05) {
      const ang = t * Math.PI * 4 + rp * 5 + r;
      const rad = rp * 200 * t;
      const wx = x + Math.cos(ang) * rad;
      const wy = y - 18 + Math.sin(ang) * rad * 0.5;
      t === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
}

function sup_g4_onyx(ctx, x, y, p, c, W, H) {
  sup_g2_mai(ctx, x, y, p, c, W, H); // shadow strike = shadow dance
}

function sup_g4_gold(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Heat burst — golden light explosion
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, p * 200);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, c); grad.addColorStop(0.7, c + '66'); grad.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 200, 0, Math.PI * 2); ctx.fill();
  // Heat rays
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = a * 0.6; ctx.strokeStyle = i % 2 === 0 ? '#FFFFFF' : c; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * p * 180, y - 18 + Math.sin(ang) * p * 180); ctx.stroke();
  }
}

function sup_g4_vermilion(ctx, x, y, p, c, W, H) {
  sup_crimson(ctx, x, y, p, c, W, H); // eruption = massive detonation
}

function sup_g4_umber(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Tremor — earth shaking
  for (let r = 0; r < 5; r++) {
    const rp = p - r * 0.1; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.5 - r * 0.08); ctx.strokeStyle = r === 0 ? '#FFFFFF' : c; ctx.lineWidth = 4 - r;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 220, 0, Math.PI * 2); ctx.stroke();
  }
  // Rock pillars
  for (let i = 0; i < 8; i++) {
    const px = x - 140 + i * 40;
    const ph = Math.min(p * 2, 1) * 100;
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = c;
    ctx.fillRect(px - 8, y - ph, 16, ph);
  }
}

function sup_g4_graphite(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Pulse reveal — magnetic pulse
  for (let r = 0; r < 6; r++) {
    const rp = p - r * 0.08; if (rp < 0 || rp > 1) continue;
    ctx.globalAlpha = a * (0.4 - r * 0.05); ctx.strokeStyle = r % 2 === 0 ? c : '#FFFFFF'; ctx.lineWidth = 3 - r * 0.3;
    ctx.beginPath(); ctx.arc(x, y - 18, rp * 280, 0, Math.PI * 2); ctx.stroke();
  }
  // Magnetic particles
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + p * 3;
    const dist = p * 200;
    ctx.globalAlpha = a * 0.5; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 4, 0, Math.PI * 2); ctx.fill();
  }
}

function sup_g4_daichi(ctx, x, y, p, c, W, H) {
  const a = 1 - p;
  // Mech barrage — mechanical combo
  for (let i = 0; i < 12; i++) {
    const phase = p - i * 0.04; if (phase < 0 || phase > 0.9) continue;
    const ang = (i / 12) * Math.PI * 2;
    const dist = 40 + phase * 200;
    ctx.globalAlpha = a * (1 - phase) * 0.7;
    ctx.fillStyle = i % 2 === 0 ? c : '#FFFFFF';
    ctx.save(); ctx.translate(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5); ctx.rotate(ang + phase * 5);
    ctx.fillRect(-8, -8, 16, 16); ctx.restore();
  }
  // Mech core
  ctx.globalAlpha = a * 0.4; ctx.strokeStyle = c; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 18, p * 60, 0, Math.PI * 2); ctx.stroke();
}

function sup_g4_renko(ctx, x, y, p, c, W, H) {
  sup_g2_ibuki(ctx, x, y, p, c, W, H); // vitality siphon = soul siphon
}

// ── DISPATCHER ───────────────────────────────────────────────────────────────

const UNIQUE_SUPERS = {
  // Gen 5 Heroes
  yellow: sup_yellow, blue: sup_blue, purple: sup_purple, orange: sup_orange,
  green: sup_green, pink: sup_pink, grey: sup_grey, turquoise: sup_turquoise,
  olive: sup_olive, copper: sup_copper, emerald: sup_emerald, pearl: sup_pearl,
  red: sup_red, lavender: sup_lavender, amber: sup_amber, black: sup_black,
  magenta: sup_magenta, indigo: sup_indigo, maroon: sup_maroon, crimson: sup_crimson,
  scarlet: sup_scarlet, white: sup_white, silver: sup_silver,
  // Gen 5 Villains
  corpent: sup_corpent, magneto: sup_magneto, willow: sup_willow, cable: sup_cable,
  snodvor: sup_snodvor, kirsten: sup_kirsten, volt: sup_volt, temple: sup_temple,
  nightmare: sup_nightmare, hazel: sup_hazel, whami: sup_whami,
  // Cosmic
  controller: sup_controller, evil: sup_evil, life: sup_life, death: sup_death, mercy: sup_mercy,
  // Gen 1
  g1_thunder: sup_g1_thunder, g1_fire: sup_g1_fire, g1_water: sup_g1_water,
  g1_grass: sup_g1_grass, g1_ice: sup_g1_ice,
  // Gen 2
  g2_renji: sup_g2_renji, g2_kaito: sup_g2_kaito, g2_hana: sup_g2_hana,
  g2_daigo: sup_g2_daigo, g2_suzu: sup_g2_suzu, g2_mai: sup_g2_mai,
  g2_osamu: sup_g2_osamu, g2_yui: sup_g2_yui, g2_ibuki: sup_g2_ibuki,
  g2_nishikawa: sup_g2_nishikawa, g2_itto: sup_g2_itto,
  g2_twinfoxes: sup_g2_twinfoxes, g2_utsuro: sup_g2_utsuro,
  // Gen 3
  g3_takeshi: sup_g3_takeshi, g3_aiko: sup_g3_aiko, g3_haru: sup_g3_haru,
  g3_chiyo: sup_g3_chiyo, g3_emi: sup_g3_emi, g3_nozomi: sup_g3_nozomi,
  g3_masaru: sup_g3_masaru, g3_ryo: sup_g3_ryo, g3_souta: sup_g3_souta,
  g3_ogata: sup_g3_ogata, g3_kanenobu: sup_g3_kanenobu,
  // Gen 4
  g4_cobalt: sup_g4_cobalt, g4_cyan: sup_g4_cyan, g4_onyx: sup_g4_onyx,
  g4_gold: sup_g4_gold, g4_vermilion: sup_g4_vermilion, g4_umber: sup_g4_umber,
  g4_graphite: sup_g4_graphite, g4_daichi: sup_g4_daichi, g4_renko: sup_g4_renko,
};

export function drawUniqueSuper(ctx, x, y, p, color, charId, W, H) {
  const fn = UNIQUE_SUPERS[charId];
  if (fn) {
    fn(ctx, x, y, p, color, W, H);
  } else {
    // Generic fallback — particle burst
    const a = 1 - p;
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2 + p * 3;
      const dist = p * 200;
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = i % 2 === 0 ? color : '#FFFFFF';
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y - 18 + Math.sin(ang) * dist * 0.5, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}