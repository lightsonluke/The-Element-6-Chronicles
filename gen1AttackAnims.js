// Hand-authored Generation I move visuals.  These are deliberately local attack
// effects: the art follows the same active hitbox geometry rather than changing
// stage state or spawning environmental objects.

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t * t * (3 - 2 * t);
const alpha = p => Math.sin(clamp(p) * Math.PI);

function glow(ctx, color, blur = 18) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function boltPath(ctx, x, y, len, width, facing, wobble = 0) {
  const s = facing;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * len * 0.25, y - width * 0.42 + wobble);
  ctx.lineTo(x + s * len * 0.12, y + width * 0.04);
  ctx.lineTo(x + s * len * 0.55, y - width * 0.15);
  ctx.lineTo(x + s * len * 0.40, y + width * 0.42);
  ctx.lineTo(x + s * len, y + width * 0.08);
  ctx.lineTo(x + s * len * 0.64, y - width * 0.68);
  ctx.lineTo(x + s * len * 0.78, y - width * 0.88);
  ctx.lineTo(x, y);
}
function fillBolt(ctx, x, y, len, width, facing, color, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 20);
  boltPath(ctx, x, y, len, width, facing); ctx.fill();
  ctx.globalAlpha = a * 0.95; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
function flame(ctx, x, y, r, color, a = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; glow(ctx, color, 16);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.8, -r * 0.15, r * 0.15, r); ctx.quadraticCurveTo(-r * 0.85, r * 0.35, 0, -r); ctx.fill();
  ctx.fillStyle = '#FFF4C4'; ctx.globalAlpha = a * 0.7; ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.quadraticCurveTo(r * 0.35, 0, 0, r * 0.55); ctx.quadraticCurveTo(-r * 0.35, 0, 0, -r * 0.55); ctx.fill();
  ctx.restore();
}
function waterStroke(ctx, points, color, width, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; glow(ctx, color, 14);
  ctx.beginPath(); points.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  ctx.globalAlpha = a * 0.55; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1.5, width * 0.18); ctx.stroke(); ctx.restore();
}
function leaf(ctx, x, y, r, ang, color, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 10);
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.8, -r * 0.15, 0, r); ctx.quadraticCurveTo(-r * 0.8, -r * 0.15, 0, -r); ctx.fill(); ctx.restore();
}
function shard(ctx, x, y, r, ang, color, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 12);
  ctx.beginPath(); ctx.moveTo(0, -r * 1.25); ctx.lineTo(r * 0.42, r); ctx.lineTo(-r * 0.38, r * 0.65); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
}

function thunder(ctx, x, y, p, f, move) {
  const a = alpha(p); const c = '#FFFF44'; const cy = y - 56;
  if (move === 'us') {
    const ang = -Math.PI / 2 + ease(p) * TAU;
    const r = 78;
    ctx.save(); ctx.globalAlpha = a * 0.75; ctx.strokeStyle = c; ctx.lineWidth = 3; glow(ctx, c, 22);
    ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.stroke();
    const px = x + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(px, py, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
    ctx.restore();
  } else if (move === 'upHeavy') {
    for (const dx of [-58, 0, 58]) fillBolt(ctx, x + f * 28 + dx, y - 8, 20, 160, f, c, a * 0.85);
  } else if (move === 'ds') {
    const r = 48 * ease(p); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = 6; glow(ctx, c, 20);
    ctx.beginPath(); ctx.arc(x, y - 24, r, Math.PI, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 8; i++) { const ang = Math.PI + (i / 7) * Math.PI; fillBolt(ctx, x + Math.cos(ang) * r * 0.7, y - 24 + Math.sin(ang) * r * 0.7, 18, 12, Math.cos(ang) >= 0 ? 1 : -1, c, a * 0.65); }
  } else if (move === 'ss' || move === 'sh') {
    const len = move === 'sh' ? 88 : 56; fillBolt(ctx, x + f * 14, y - 42, len * ease(p), move === 'sh' ? 28 : 18, f, c, a);
  } else if (move === 'dh') {
    const ang = -Math.PI / 2 + ease(p) * TAU; const r = 92; const bx = x + Math.cos(ang) * r; const by = cy + Math.sin(ang) * r * 0.62;
    ctx.save(); ctx.globalAlpha = a * 0.45; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.fillStyle = c; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(bx, by, 13, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = a * (0.35 - i * 0.06); ctx.beginPath(); ctx.arc(bx - Math.cos(ang) * i * 12, by - Math.sin(ang) * i * 8, 8 - i, 0, TAU); ctx.fill(); }
  }
}

function fire(ctx, x, y, p, f, move) {
  const a = alpha(p); const c = '#FF6600';
  if (move === 'us') {
    const ang = -Math.PI / 2 + p * Math.PI * 0.65; const r = 52 + p * 14;
    ctx.save(); ctx.translate(x + f * 10, y - 48); ctx.rotate(ang); ctx.strokeStyle = c; ctx.lineWidth = 10; glow(ctx, c, 22); ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 1.3); ctx.stroke(); ctx.restore();
    flame(ctx, x + f * 38, y - 100 * p - 28, 17, c, a);
  } else if (move === 'upHeavy') {
    ctx.save(); ctx.translate(x, y - 78); ctx.rotate(p * Math.PI * 2); ctx.strokeStyle = c; ctx.lineWidth = 18; glow(ctx,c,24); ctx.beginPath(); ctx.arc(0,0,70,0,TAU); ctx.stroke(); ctx.restore();
  } else if (move === 'ds') {
    flame(ctx, x, y - 7, 25 * ease(p), c, a, 0); for (let i = 0; i < 4; i++) flame(ctx, x + (i - 1.5) * 12, y - 20 - Math.abs(i - 1.5) * 4, 12, c, a * 0.7, (i - 1.5) * 0.3);
  } else if (move === 'ss' || move === 'sh') {
    const len = move === 'sh' ? 82 : 48; ctx.save(); ctx.translate(x + f * 20, y - 40); ctx.rotate(f * (-0.35 + p * 1.1)); flame(ctx, 0, 0, move === 'sh' ? 28 : 19, c, a); ctx.restore();
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = move === 'sh' ? 16 : 9; ctx.globalAlpha = a * 0.7; glow(ctx, c, 18); ctx.beginPath(); ctx.arc(x + f * 18, y - 40, len, f > 0 ? -1.2 : 1.2, f > 0 ? 0.65 : 2.5, f < 0); ctx.stroke(); ctx.restore();
  } else if (move === 'dh') {
    ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.globalAlpha = a * 0.8; glow(ctx, c, 16);
    for (let i = 0; i < 5; i++) { const dx = (i - 2) * 36 * ease(p); ctx.beginPath(); ctx.moveTo(x + f * 4, y - 2); ctx.lineTo(x + f * dx, y + 4); ctx.lineTo(x + f * (dx + 8), y - 28); ctx.stroke(); flame(ctx, x + f * (dx + 8), y - 28, 15, c, a); }
  }
}

function water(ctx, x, y, p, f, move) {
  const a = alpha(p); const c = '#3399CC';
  if (move === 'us') { const ang = -Math.PI / 2 + p * Math.PI * 0.7; const r = 52; waterStroke(ctx, [[x + f * 10, y - 40], [x + f * 22 + Math.cos(ang) * r, y - 62 + Math.sin(ang) * r], [x + f * 32, y - 112]], c, 12, a); }
  else if (move === 'upHeavy') { const pts=[]; for(let i=0;i<24;i++){const t=i/23; const ang=t*TAU+p*1.8; pts.push([x+Math.cos(ang)*55,y-60+Math.sin(ang)*95]);} waterStroke(ctx,pts,c,14,a); }
  else if (move === 'ds') { waterStroke(ctx, [[x - 18, y - 8], [x - 42, y - 36 * p], [x - 22, y - 58 * p]], c, 12, a); waterStroke(ctx, [[x + 18, y - 8], [x + 42, y - 36 * p], [x + 22, y - 58 * p]], c, 12, a); }
  else if (move === 'ss' || move === 'sh') { const len = move === 'sh' ? 95 : 65; const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([x + f * (12 + len * t), y - 40 - Math.sin(t * Math.PI) * (move === 'sh' ? 28 : 18)]); } waterStroke(ctx, pts, c, move === 'sh' ? 18 : 9, a); }
  else if (move === 'dh') { const bx = x + f * (65 - p * 120); const by = y - 45 + p * 50; ctx.fillStyle = c; ctx.globalAlpha = a * 0.75; glow(ctx, c, 16); ctx.beginPath(); ctx.arc(bx, by, 28, 0, TAU); ctx.fill(); for (let i = 0; i < 9; i++) waterStroke(ctx, [[bx, by], [bx + Math.cos(i) * 32, by - 45 * p + Math.sin(i) * 24]], c, 5, a * 0.55); }
}

function grass(ctx, x, y, p, f, move) {
  const a = alpha(p); const c = '#44AA44';
  if (move === 'us') { const cx = x; const cy = y - 78; for (let i = 0; i < 3; i++) leaf(ctx, cx, cy, 28, i * TAU / 3 + p * TAU, c, a); ctx.fillStyle = '#DDBB55'; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fill(); }
  else if (move === 'upHeavy') { const r=72; for(let i=0;i<8;i++){const ang=i*TAU/8; leaf(ctx,x+Math.cos(ang)*r,y-70+Math.sin(ang)*r*0.6,26,ang,c,a);} }
  else if (move === 'ds') { for (const sx of [-1, 1]) { ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x + sx * 16, y); ctx.quadraticCurveTo(x + sx * 40, y - 28, x + sx * 10, y - 52 * p); ctx.stroke(); for (let i = 0; i < 3; i++) leaf(ctx, x + sx * (22 + i * 8), y - 20 - i * 8, 7, sx * 0.6, c, a); } }
  else if (move === 'ss') { ctx.fillStyle = '#8B6B3F'; ctx.globalAlpha = a; ctx.fillRect(x + f * 10, y - 46, f * 58, 12); }
  else if (move === 'sh') { ctx.save(); ctx.translate(x + f * 16, y - 44); ctx.rotate(f * (p * 0.8 - 0.4)); ctx.fillStyle = '#8B6B3F'; ctx.fillRect(-8, -70, 16, 100); for (let i = 0; i < 5; i++) leaf(ctx, 0, -60 + i * 25, 10, i, c, a * 0.6); ctx.restore(); }
  else if (move === 'dh') { ctx.strokeStyle = c; ctx.lineWidth = 10; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x - f * 25, y - 90); ctx.quadraticCurveTo(x + f * 70, y - 25, x + f * 10, y + 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + f * 10, y + 10); ctx.quadraticCurveTo(x - f * 40, y - 20, x - f * 10, y - 55); ctx.stroke(); }
}

function ice(ctx, x, y, p, f, move) {
  const a = alpha(p); const c = '#AAEEFF';
  if (move === 'us') { const sx = x + f * 18 * p, sy = y - 50 - 100 * p; shard(ctx, sx, sy, 24, p * 6, c, a); }
  else if (move === 'upHeavy') { for(let i=0;i<3;i++){const ang=-Math.PI/2+i*TAU/3+p*0.7; shard(ctx,x+Math.cos(ang)*70,y-70+Math.sin(ang)*70,28,ang,c,a);} }
  else if (move === 'ds') { ctx.save(); ctx.globalAlpha = a * 0.65; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y - 4, 48, 12, 0, 0, TAU); ctx.stroke(); ctx.restore(); for (let i = 0; i < 7; i++) shard(ctx, x + f * (18 + i * 7) * p, y - 20 - Math.sin(i) * 20, 11, i, c, a * 0.8); }
  else if (move === 'ss') { ctx.save(); ctx.translate(x + f * 20, y - 42); ctx.rotate(f * p * TAU); ctx.strokeStyle = c; ctx.lineWidth = 15; glow(ctx, c, 14); ctx.beginPath(); ctx.arc(0, 0, 38, -1.2, 1.2); ctx.stroke(); ctx.restore(); }
  else if (move === 'sh') { ctx.save(); ctx.translate(x + f * 20, y - 40); ctx.rotate(f * p * Math.PI); ctx.fillStyle = c; glow(ctx, c, 18); ctx.fillRect(-12, -65, 24, 110); ctx.restore(); if (p > 0.72) for (let i = 0; i < 8; i++) shard(ctx, x + f * 55 + i * 8, y - 40, 8, i, c, (1 - p) * 2); }
  else if (move === 'dh') { const bx = x + f * (80 - p * 160); ctx.fillStyle = c; ctx.globalAlpha = a * 0.8; glow(ctx, c, 18); ctx.fillRect(bx - 38, y - 16, 76, 32); if (p > 0.68) for (let i = 0; i < 2; i++) shard(ctx, bx + f * (i ? 36 : -36), y - 25, 20, (i ? 1 : -1) * 0.7, c, a); }
}

export function drawGen1Attack(ctx, x, y, color, p, facing, charId, move) {
  const m = String(move || 'ss');
  ctx.save();
  if (charId === 'g1_thunder') thunder(ctx, x, y, p, facing, m);
  else if (charId === 'g1_fire') fire(ctx, x, y, p, facing, m);
  else if (charId === 'g1_water') water(ctx, x, y, p, facing, m);
  else if (charId === 'g1_grass') grass(ctx, x, y, p, facing, m);
  else if (charId === 'g1_ice') ice(ctx, x, y, p, facing, m);
  ctx.restore();
}

export function drawGen1Super(ctx, x, y, p, facing, charId) {
  const a = alpha(p); const f = facing || 1;
  ctx.save();
  if (charId === 'g1_thunder') {
    const boltX = x; const top = -20; const impactY = y - 10 + p * 10;
    fillBolt(ctx, boltX - f * 35, top, 70, 34, f, '#FFFF44', a * 0.9);
    ctx.strokeStyle = '#FFFF44'; ctx.lineWidth = 18; ctx.globalAlpha = a * 0.75; glow(ctx, '#FFFF44', 30);
    ctx.beginPath(); ctx.moveTo(boltX, top); ctx.lineTo(boltX, impactY); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y - 8, 22 + p * 8, 0, TAU); ctx.fill();
  } else if (charId === 'g1_fire') {
    const r = 24 + p * 54; ctx.fillStyle = '#FF6600'; ctx.globalAlpha = a * 0.85; glow(ctx, '#FF6600', 30); ctx.beginPath(); ctx.arc(x + f * 70, y - 42, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFF2A8'; ctx.globalAlpha = a * 0.65; ctx.beginPath(); ctx.arc(x + f * 70, y - 42, r * 0.45, 0, TAU); ctx.fill();
  } else if (charId === 'g1_water') {
    const r = 42 + p * 72; ctx.strokeStyle = '#3399CC'; ctx.lineWidth = 16; ctx.globalAlpha = a * 0.9; glow(ctx, '#3399CC', 26); ctx.beginPath(); ctx.arc(x, y - 44, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.globalAlpha = a * 0.6; ctx.stroke();
  } else if (charId === 'g1_grass') {
    const r = 42 + p * 72; for (let i = 0; i < 10; i++) { const ang = i * TAU / 10 + p * 2; const px = x + Math.cos(ang) * r, py = y - 44 + Math.sin(ang) * r * 0.62; leaf(ctx, px, py, 22, ang, '#44AA44', a * 0.9); }
  } else if (charId === 'g1_ice') {
    const cx = x + f * 48, cy = y - 48; for (let i = 0; i < 16; i++) { const ang = i * TAU / 16 + p * 0.5; const rr = 26 + p * 58; shard(ctx, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.8, 14, ang, '#AAEEFF', a); }
  }
  ctx.restore();
}
