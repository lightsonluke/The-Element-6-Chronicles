// Generation I hand-authored attack animation system.
// IMPORTANT: every directional attack is authored facing RIGHT and mirrored
// with the canvas transform. This guarantees left/right are literal flips of
// the same move instead of two different animations.

const TAU = Math.PI * 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const easeOut = v => 1 - Math.pow(1 - clamp01(v), 3);
const alpha = p => Math.sin(clamp01(p) * Math.PI);

function glow(ctx, color, blur = 18) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function strokePath(ctx, pts, color, width, a = 1, dash = null) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  glow(ctx, color, Math.max(8, width * 2.2));
  ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  ctx.restore();
}
function fillPoly(ctx, pts, color, a = 1, stroke = '#FFFFFF') {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 16); ctx.beginPath();
  pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
  if (stroke) { ctx.globalAlpha = a * 0.9; ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
}
function dot(ctx, x, y, r, color, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 20); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}
function lineBolt(ctx, x, y, len, h, color, a = 1) {
  const pts = [[x, y], [x + len * .23, y - h * .45], [x + len * .14, y - h * .02], [x + len * .52, y - h * .22], [x + len * .42, y + h * .38], [x + len * .82, y + h * .02], [x + len * .62, y - h * .55], [x + len, y - h * .18]];
  fillPoly(ctx, pts, color, a, '#FFFFFF');
}
function flame(ctx, x, y, r, color, a = 1, angle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = a; glow(ctx, color, 18); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .8, -r * .1, r * .2, r); ctx.quadraticCurveTo(-r * .85, r * .35, 0, -r); ctx.fill();
  ctx.globalAlpha = a * .7; ctx.fillStyle = '#FFF4C4'; ctx.beginPath(); ctx.moveTo(0, -r * .55); ctx.quadraticCurveTo(r * .32, 0, 0, r * .52); ctx.quadraticCurveTo(-r * .32, 0, 0, -r * .55); ctx.fill();
  ctx.restore();
}
function waterStroke(ctx, pts, color, width, a = 1) {
  strokePath(ctx, pts, color, width, a);
  strokePath(ctx, pts, '#FFFFFF', Math.max(1.5, width * .16), a * .55);
}
function leaf(ctx, x, y, rx, ry, angle, color, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 10);
  ctx.beginPath(); ctx.moveTo(0, -ry); ctx.quadraticCurveTo(rx, -ry * .15, 0, ry); ctx.quadraticCurveTo(-rx, -ry * .15, 0, -ry); ctx.fill(); ctx.restore();
}
function shard(ctx, x, y, w, h, angle, color, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 14);
  ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(w, h * .55); ctx.lineTo(-w * .55, h * .35); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
}
function particles(ctx, x, y, color, p, count, radius, spread = TAU) {
  for (let i = 0; i < count; i++) {
    const a = i / count * spread + p * 5;
    const r = radius * (.4 + ((i * 17) % 11) / 11);
    dot(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * .65, 1.4 + (i % 3), color, .35 * (1 - p));
  }
}

// Thunder Up Signature — deliberately follows the supplied 12-frame reference:
// 1 startup, 2 circle begins, 3-8 moving dot around the ring, 9 launch, 10
// circle continues, 11 near-end, 12 recovery. The hitbox is NOT the circle.
// It is only the moving dot at the beginning of the circular path.
function thunderUp(ctx, x, y, p) {
  const c = '#FFFF44';
  const frame = clamp01(p) * 12;
  const cy = y - 112;
  const rx = 86, ry = 34;
  const start = -Math.PI / 2;
  let theta = start;
  if (frame >= 2) theta = start + ease(Math.min(1, (frame - 2) / 7.2)) * TAU;
  const dotX = x + Math.cos(theta) * rx;
  const dotY = cy + Math.sin(theta) * ry;

  ctx.save();
  if (frame < 1.2) {
    ctx.globalAlpha = .35 + frame * .3;
    ctx.strokeStyle = c; ctx.lineWidth = 2; glow(ctx, c, 14);
    ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, TAU); ctx.stroke();
  }
  if (frame >= 1.0) {
    const trace = Math.min(1, (frame - 1) / 8.2);
    ctx.globalAlpha = .3 + alpha(p) * .55;
    ctx.strokeStyle = c; ctx.lineWidth = 3; glow(ctx, c, 22);
    ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, TAU * trace); ctx.stroke();
    // six small electrical breaks around the circle make the path visibly alive
    for (let i = 0; i < 6; i++) {
      const a = start + (i / 6) * TAU + p * .08;
      const px = x + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
      const qx = x + Math.cos(a + .08) * (rx + 5), qy = cy + Math.sin(a + .08) * (ry + 2);
      strokePath(ctx, [[px, py], [qx, qy]], c, 1.5, .45 * alpha(p));
    }
    dot(ctx, dotX, dotY, frame < 2 ? 5 : 8, '#FFFFFF', .98);
    dot(ctx, dotX, dotY, 5, c, 1);
  }
  if (frame >= 7.8 && frame < 11.4) {
    const q = easeOut((frame - 7.8) / 3.6);
    // Upward launch trail under the fighter. The circle remains visible while it finishes.
    for (let i = 0; i < 7; i++) {
      const yy = y - 30 - q * (45 + i * 18);
      strokePath(ctx, [[x - 13 + i * 4, y - 5], [x - 8 + i * 2, yy]], c, 2.2, (.45 - i * .045) * (1 - q * .25));
    }
    dot(ctx, x, y - 48 - q * 80, 4, '#FFFFFF', .75);
  }
  if (frame >= 10.4) particles(ctx, x, cy, c, p, 16, 100);
  ctx.restore();
}

function thunderDown(ctx, x, y, p) {
  const c = '#FFFF44'; const q = ease(p); const r = 18 + q * 35;
  // Two charged balls in the hands.
  dot(ctx, x - 22, y - 45, 7 + q * 3, '#FFFFFF', .85); dot(ctx, x + 22, y - 45, 7 + q * 3, '#FFFFFF', .85);
  dot(ctx, x - 22, y - 45, 4 + q * 2, c); dot(ctx, x + 22, y - 45, 4 + q * 2, c);
  if (p > .28) {
    ctx.save(); ctx.globalAlpha = alpha(p); ctx.strokeStyle = c; ctx.lineWidth = 5; glow(ctx, c, 20);
    ctx.beginPath(); ctx.arc(x, y - 24, r, Math.PI, TAU); ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI + i / 9 * Math.PI;
      const px = x + Math.cos(a) * r, py = y - 24 + Math.sin(a) * r;
      lineBolt(ctx, px, py, 11, 9, c, .75 * alpha(p));
    }
    ctx.restore();
  }
}

function thunderSide(ctx, x, y, p, heavy) {
  const c = '#FFFF44'; const len = heavy ? 100 : 68; const h = heavy ? 34 : 24; const q = easeOut(p);
  if (p < .25) {
    strokePath(ctx, [[x + 7, y - 52], [x + 25 + q * 12, y - 45]], c, heavy ? 5 : 3, alpha(p));
  }
  lineBolt(ctx, x + 24, y - 50, len * q, h, c, alpha(p));
  for (let i = 0; i < (heavy ? 7 : 4); i++) dot(ctx, x + 25 + len * q * (i / Math.max(1, heavy ? 6 : 3)), y - 50 + Math.sin(i * 2.4) * 5, 1.5, c, .35 * alpha(p));
}

function thunderUpHeavy(ctx, x, y, p) {
  const c = '#FFFF44'; const q = easeOut(p);
  for (const dx of [24, 82, 140]) {
    const top = y - 38 - q * 150;
    lineBolt(ctx, x + dx, top, 22, 42, c, alpha(p));
    for (let i = 0; i < 3; i++) dot(ctx, x + dx + 8 + Math.sin(i + p * 8) * 4, top + i * 38, 2, c, .5 * alpha(p));
  }
}

function thunderDownHeavy(ctx, x, y, p) {
  const c = '#FFFF44'; const q = easeOut(p); const a = alpha(p); const ang = -Math.PI / 2 + q * TAU; const r = 94;
  ctx.save(); ctx.globalAlpha = .3 * a; ctx.strokeStyle = c; ctx.setLineDash([6, 7]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 20, y - 72, r, 0, TAU); ctx.stroke(); ctx.restore();
  const bx = x + 20 + Math.cos(ang) * r, by = y - 72 + Math.sin(ang) * r * .6;
  dot(ctx, bx, by, 13, c, a);
  for (let i = 1; i <= 5; i++) dot(ctx, bx - Math.cos(ang) * i * 12, by - Math.sin(ang) * i * 7, Math.max(2, 8 - i), c, a * (.5 - i * .07));
}

function thunderSuper(ctx, x, y, p) {
  const c = '#FFFF44'; const a = alpha(p); const q = easeOut(p);
  // Giant bolt falls on the fighter's X. Only the bottom impact section is the hit.
  const top = y - 470 + q * 120;
  const impact = y - 8;
  lineBolt(ctx, x - 44, top, 88, 70, c, a * .85);
  strokePath(ctx, [[x - 5, top + 45], [x + 7, top + 100], [x - 10, top + 155], [x + 8, top + 215], [x - 4, impact]], c, 16, a * .8);
  if (p > .52) {
    ctx.save(); ctx.globalAlpha = a * .8; ctx.fillStyle = '#FFFFFF'; glow(ctx, c, 28); ctx.beginPath(); ctx.ellipse(x, impact, 46 + (p - .52) * 40, 12 + (p - .52) * 16, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
}

function fireAttack(ctx, x, y, p, move) {
  const c = '#FF6600'; const a = alpha(p); const q = easeOut(p);
  if (move === 'us') {
    const hookR = 52 + q * 14; const ang = -1.2 + q * 2.1;
    ctx.save(); ctx.translate(x + 18, y - 48); ctx.rotate(ang); strokePath(ctx, [[0, hookR], [hookR * .5, 0], [hookR * .85, -hookR * .65]], c, 12, a); flame(ctx, hookR * .82, -hookR * .62, 14, c, a); ctx.restore();
  } else if (move === 'ds') {
    if (p < .35) { strokePath(ctx, [[x - 18, y - 8], [x - 26, y + 2]], c, 8, a); }
    for (let i = 0; i < 4; i++) flame(ctx, x + (i - 1.5) * 13, y - 9 - Math.abs(i - 1.5) * 4, 12 + q * 5, c, a * .8);
  } else if (move === 'ss') {
    ctx.save(); ctx.translate(x + 20, y - 42); ctx.rotate(-.25 + q * .9); flame(ctx, 0, 0, 22, c, a); strokePath(ctx, [[0, 3], [26, 3]], c, 9, a * .7); ctx.restore();
  } else if (move === 'upHeavy') {
    ctx.save(); ctx.translate(x, y - 92); ctx.rotate(q * TAU); ctx.strokeStyle = c; ctx.lineWidth = 15; glow(ctx, c, 24); ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) flame(ctx, Math.cos(i / 8 * TAU) * 70, Math.sin(i / 8 * TAU) * 70, 12, c, a * .7, i / 8 * TAU); ctx.restore();
  } else if (move === 'dh') {
    for (let i = 0; i < 5; i++) { const t = i / 4; const dx = (t - .5) * 120 * q; strokePath(ctx, [[x, y - 4], [x + dx * .6, y + 5], [x + dx, y - 34]], c, 7, a * .8); flame(ctx, x + dx, y - 34, 14, c, a); }
  } else if (move === 'sh') {
    ctx.save(); ctx.translate(x + 28, y - 42); ctx.rotate(-.8 + q * 1.7); flame(ctx, 42, 0, 28, c, a); strokePath(ctx, [[-8, 0], [50, 0]], c, 18, a * .65); ctx.restore();
  }
}

function fireSuper(ctx, x, y, p) {
  const c = '#FF6600'; const a = alpha(p); const q = easeOut(p); const cx = x + 78;
  if (p < .45) {
    flame(ctx, x - 18, y - 58, 24, c, a * .65, -.3); flame(ctx, x + 18, y - 58, 24, c, a * .65, .3);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#FFF2A8'; glow(ctx, c, 28); ctx.beginPath(); ctx.arc(x + 12, y - 58, 18 + p * 18, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (p > .28) {
    const r = 18 + Math.min(1, (p - .28) / .2) * 24;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c; glow(ctx, c, 30); ctx.beginPath(); ctx.arc(cx, y - 48, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFF4C4'; ctx.globalAlpha = a * .8; ctx.beginPath(); ctx.arc(cx, y - 48, r * .42, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (p > .48) {
    const e = easeOut((p - .48) / .34); const r = 16 + e * 68;
    ctx.save(); ctx.globalAlpha = a * (1 - e * .35); ctx.strokeStyle = c; ctx.lineWidth = 8; glow(ctx, c, 30); ctx.beginPath(); ctx.arc(cx, y - 48, r, 0, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU; strokePath(ctx, [[cx + Math.cos(ang) * r, y - 48 + Math.sin(ang) * r], [cx + Math.cos(ang) * (r + 22 * e), y - 48 + Math.sin(ang) * (r + 22 * e)]], c, 4, a * .65); }
  }
}

function waterAttack(ctx, x, y, p, move) {
  const c = '#3399CC'; const a = alpha(p); const q = easeOut(p);
  if (move === 'us') {
    const ang = -Math.PI / 2 + q * 1.25; const r = 48; const cx = x + 12 + Math.cos(ang) * r, cy = y - 54 + Math.sin(ang) * r;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 11; glow(ctx, c, 16); ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.stroke(); ctx.restore();
    waterStroke(ctx, [[x + 8, y - 42], [cx, cy], [x + 24, y - 112]], c, 6, a * .55);
  } else if (move === 'ds') {
    waterStroke(ctx, [[x - 16, y - 8], [x - 42, y - 34 * q], [x - 25, y - 70 * q]], c, 12, a);
    waterStroke(ctx, [[x + 16, y - 8], [x + 42, y - 34 * q], [x + 25, y - 70 * q]], c, 12, a);
  } else if (move === 'ss') {
    const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([x + 16 + 72 * q * t, y - 42 - Math.sin(t * Math.PI) * 26]); } waterStroke(ctx, pts, c, 9, a);
    dot(ctx, x + 16 + 72 * q, y - 42, 8, '#FFFFFF', a); dot(ctx, x + 16 + 72 * q, y - 42, 5, c, a);
  } else if (move === 'upHeavy') {
    const pts = []; for (let i = 0; i < 28; i++) { const t = i / 27; const ang = t * TAU + q * 1.9; pts.push([x + Math.cos(ang) * 54, y - 64 + Math.sin(ang) * 92]); } waterStroke(ctx, pts, c, 13, a);
    for (let i = 0; i < 8; i++) dot(ctx, x + 54 * Math.cos(i / 8 * TAU), y - 64 + 92 * Math.sin(i / 8 * TAU), 3, '#FFFFFF', a * .5);
  } else if (move === 'dh') {
    const bx = x + 70 - q * 140; const by = y - 46 + Math.max(0, q - .45) * 90; ctx.save(); ctx.fillStyle = c; ctx.globalAlpha = a * .8; glow(ctx, c, 16); ctx.beginPath(); ctx.arc(bx, by, 28, 0, TAU); ctx.fill(); ctx.restore();
    if (q > .65) for (let i = 0; i < 10; i++) waterStroke(ctx, [[bx, by], [bx + (i - 4.5) * 12, by - 70 * (q - .65)]], c, 4, a * .7);
  } else if (move === 'sh') {
    ctx.save(); ctx.translate(x + 20, y - 48); ctx.rotate(q * .9); ctx.strokeStyle = c; ctx.lineWidth = 18; glow(ctx, c, 22); ctx.beginPath(); ctx.arc(0, 0, 78, -.85, .85); ctx.stroke(); ctx.restore();
  }
}

function waterSuper(ctx, x, y, p) {
  const c = '#3399CC'; const a = alpha(p);
  if (p < .58) {
    const r = 35 + p * 70; ctx.save(); ctx.globalAlpha = a * .85; ctx.strokeStyle = c; ctx.lineWidth = 14; glow(ctx, c, 24); ctx.beginPath(); ctx.arc(x, y - 52, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (p > .45) {
    const q = easeOut((p - .45) / .55); const r = 12 + q * 108; for (let i = 0; i < 18; i++) { const ang = i / 18 * TAU; const rr = r + Math.sin(i * 4 + p * 10) * 6; waterStroke(ctx, [[x + Math.cos(ang) * (rr - 16), y - 52 + Math.sin(ang) * (rr - 16) * .7], [x + Math.cos(ang) * rr, y - 52 + Math.sin(ang) * rr * .7]], c, 8, a * .75); }
  }
}

function grassAttack(ctx, x, y, p, move) {
  const c = '#44AA44'; const wood = '#8B6B3F'; const a = alpha(p); const q = easeOut(p);
  if (move === 'us') {
    const cy = y - 112; for (let i = 0; i < 3; i++) leaf(ctx, x, cy, 13, 34, i * TAU / 3 + q * TAU, c, a); dot(ctx, x, cy, 7, '#DDBB55', a);
  } else if (move === 'ds') {
    for (const sx of [-1, 1]) { const ex = x + sx * (38 - q * 24); strokePath(ctx, [[x + sx * 14, y - 2], [x + sx * 44, y - 24], [ex, y - 42]], c, 7, a); for (let i = 0; i < 3; i++) leaf(ctx, ex + sx * i * 7, y - 42 - i * 5, 5, 11, sx * .7, c, a * .8); }
  } else if (move === 'ss') {
    ctx.save(); ctx.translate(x + 12, y - 44); ctx.rotate(-.05); ctx.fillStyle = wood; ctx.globalAlpha = a; glow(ctx, wood, 8); ctx.fillRect(0, -6, 70 * q, 12); for (let i = 0; i < 4; i++) leaf(ctx, 18 + i * 15, -2, 4, 9, i * .5, c, a * .6); ctx.restore();
  } else if (move === 'upHeavy') {
    const r = 76 * q; ctx.save(); ctx.translate(x, y - 16); ctx.strokeStyle = c; ctx.lineWidth = 9; glow(ctx, c, 18); ctx.beginPath(); ctx.ellipse(0, 0, r, r * .55, 0, Math.PI, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU; leaf(ctx, x + Math.cos(ang) * r, y - 48 + Math.sin(ang) * r * .55, 12, 28, ang, c, a); }
  } else if (move === 'dh') {
    const q2 = Math.min(1, p * 1.4); strokePath(ctx, [[x - 35, y - 105], [x + 25, y - 30], [x + 12, y + 4]], c, 11, a); strokePath(ctx, [[x + 12, y + 4], [x - 24, y - 26], [x - 10, y - 66]], c, 10, a); for (let i = 0; i < 7; i++) leaf(ctx, x - 25 + i * 7 * q2, y - 30 + i * 2, 5, 12, i * .8, c, a * .6); }
  else if (move === 'sh') {
    ctx.save(); ctx.translate(x + 24, y - 48); ctx.rotate(-.12 + q * .55); ctx.fillStyle = wood; ctx.globalAlpha = a; glow(ctx, wood, 10); ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(108 * q, 0); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    if (p > .55) for (let i = 0; i < 3; i++) { const ang = (-.22 + i * .22); const bx = x + 75 * q; const by = y - 48; strokePath(ctx, [[bx, by], [bx + Math.cos(ang) * 48, by + Math.sin(ang) * 48]], wood, 8, a * .9); }
  }
}

function grassSuper(ctx, x, y, p) {
  const c = '#44AA44'; const a = alpha(p);
  const r = 35 + Math.min(1, p * 1.25) * 95;
  for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + p * .7; leaf(ctx, x + Math.cos(ang) * r, y - 48 + Math.sin(ang) * r * .65, 16, 38, ang, c, a * .85); }
  if (p > .45) { const q = easeOut((p - .45) / .55); const rr = r * (1 - q); for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU; strokePath(ctx, [[x + Math.cos(ang) * r, y - 48 + Math.sin(ang) * r * .65], [x + Math.cos(ang) * rr, y - 48 + Math.sin(ang) * rr * .65]], c, 9, a); } }
}

function iceAttack(ctx, x, y, p, move) {
  const c = '#AAEEFF'; const a = alpha(p); const q = easeOut(p);
  if (move === 'us') {
    const sx = x + 22 * q, sy = y - 62 - 100 * q; shard(ctx, sx, sy, 12, 30, q * 6, c, a); strokePath(ctx, [[x + 8, y - 46], [sx, sy]], c, 5, a * .45);
  } else if (move === 'ds') {
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.globalAlpha = a * .8; glow(ctx, c, 14); ctx.beginPath(); ctx.ellipse(x, y - 8, 48, 12, 0, 0, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 7; i++) { const ang = Math.PI * 1.05 + i / 6 * Math.PI * .9; shard(ctx, x + Math.cos(ang) * 52 * q, y - 18 + Math.sin(ang) * 35 * q, 9, 22, ang, c, a); }
  } else if (move === 'ss') {
    ctx.save(); ctx.translate(x + 20, y - 45); ctx.rotate(q * TAU); ctx.strokeStyle = c; ctx.lineWidth = 15; glow(ctx, c, 18); ctx.beginPath(); ctx.arc(0, 0, 38, -1.15, 1.15); ctx.stroke(); ctx.restore();
  } else if (move === 'upHeavy') {
    for (let i = 0; i < 3; i++) { const ang = -Math.PI / 2 + i * TAU / 3 + q * .7; const sx = x + Math.cos(ang) * 76 * q; const sy = y - 70 + Math.sin(ang) * 76 * q; shard(ctx, sx, sy, 16, 42, ang, c, a); }
  } else if (move === 'dh') {
    const bx = x + 28 + q * 104; ctx.save(); ctx.fillStyle = c; ctx.globalAlpha = a; glow(ctx, c, 16); ctx.fillRect(bx - 34, y - 18, 68, 34); ctx.restore(); if (p > .7) { shard(ctx, bx + 38, y - 30, 14, 28, -.6, c, a); shard(ctx, bx - 38, y - 6, 14, 28, .6, c, a); }
  } else if (move === 'sh') {
    ctx.save(); ctx.translate(x + 22, y - 42); ctx.rotate(-1 + q * 2); ctx.fillStyle = c; glow(ctx, c, 20); ctx.fillRect(-13, -58, 26, 108); ctx.restore(); if (p > .72) for (let i = 0; i < 7; i++) shard(ctx, x + 78 + i * 8, y - 42 + Math.sin(i) * 8, 6, 16, i, c, a * .8); }
}

function iceSuper(ctx, x, y, p) {
  const c = '#AAEEFF'; const a = alpha(p); const q = easeOut(p); const cx = x + 52, cy = y - 54;
  if (p < .62) {
    const r = 30 + p * 26; ctx.save(); ctx.globalAlpha = a * .85; ctx.fillStyle = c; glow(ctx, c, 24); ctx.beginPath(); ctx.moveTo(cx, cy - 100); ctx.lineTo(cx + 42, cy - 22); ctx.lineTo(cx + 30, cy + 70); ctx.lineTo(cx - 18, cy + 45); ctx.lineTo(cx - 44, cy - 24); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (p > .38) {
    const e = easeOut((p - .38) / .62); const count = 16;
    for (let i = 0; i < count; i++) { const ang = i / count * TAU; const rr = 24 + e * 110; shard(ctx, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * .72, 10, 28, ang, c, a); }
  }
}

export function drawGen1Attack(ctx, x, y, color, p, facing, charId, move) {
  // Author everything in right-facing local space, then mirror it for left.
  ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1);
  const localY = 0;
  if (charId === 'g1_thunder') {
    if (move === 'us') thunderUp(ctx, 0, localY, p);
    else if (move === 'ds') thunderDown(ctx, 0, localY, p);
    else if (move === 'ss') thunderSide(ctx, 0, localY, p, false);
    else if (move === 'sh') thunderSide(ctx, 0, localY, p, true);
    else if (move === 'upHeavy') thunderUpHeavy(ctx, 0, localY, p);
    else if (move === 'dh') thunderDownHeavy(ctx, 0, localY, p);
  } else if (charId === 'g1_fire') fireAttack(ctx, 0, localY, p, move);
  else if (charId === 'g1_water') waterAttack(ctx, 0, localY, p, move);
  else if (charId === 'g1_grass') grassAttack(ctx, 0, localY, p, move);
  else if (charId === 'g1_ice') iceAttack(ctx, 0, localY, p, move);
  ctx.restore();
}

export function drawGen1Super(ctx, x, y, p, facing, charId) {
  ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1);
  if (charId === 'g1_thunder') thunderSuper(ctx, 0, 0, p);
  else if (charId === 'g1_fire') fireSuper(ctx, 0, 0, p);
  else if (charId === 'g1_water') waterSuper(ctx, 0, 0, p);
  else if (charId === 'g1_grass') grassSuper(ctx, 0, 0, p);
  else if (charId === 'g1_ice') iceSuper(ctx, 0, 0, p);
  ctx.restore();
}
