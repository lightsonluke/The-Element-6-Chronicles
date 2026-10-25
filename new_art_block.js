// ═════════════════════════════════════════════════════════════════════════════
// GRASS / ICE / WATER — layered, painted artwork.
// Every piece below is drawn ON the shapes returned by getGen1AttackGeometry(), which are the very
// same shapes attackSpecs.js uses as hitboxes. So the vine / blade / water-jet you see is the hitbox.
// No shadowBlur is used (it is the main cause of canvas lag); depth comes from gradients and layering.
// Everything is deterministic (no Math.random) so cost never grows over time.
// ═════════════════════════════════════════════════════════════════════════════
const gradL = (ctx, x1, y1, x2, y2, stops) => {
  const g = ctx.createLinearGradient && ctx.createLinearGradient(x1, y1, x2, y2);
  if (!g || !g.addColorStop) return stops[0][1];
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
const gradR = (ctx, x, y, r0, r1, stops) => {
  const g = ctx.createRadialGradient && ctx.createRadialGradient(x, y, r0, x, y, r1);
  if (!g || !g.addColorStop) return stops[0][1];
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
function ribbonPts(x1, y1, x2, y2, bend, N) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const cx = (x1 + x2) / 2 + nx * bend, cy = (y1 + y2) / 2 + ny * bend, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, iu = 1 - u, x = iu * iu * x1 + 2 * iu * u * cx + u * u * x2, y = iu * iu * y1 + 2 * iu * u * cy + u * u * y2;
    const tx = 2 * iu * (cx - x1) + 2 * u * (x2 - cx), ty = 2 * iu * (cy - y1) + 2 * u * (y2 - cy), tl = Math.hypot(tx, ty) || 1;
    pts.push({ x, y, nx: -ty / tl, ny: tx / tl, tx: tx / tl, ty: ty / tl, u });
  }
  return pts;
}
function fillRibbon(ctx, pts, wFn, fill) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) { const p = pts[i], w = wFn(p.u); i ? ctx.lineTo(p.x + p.nx * w, p.y + p.ny * w) : ctx.moveTo(p.x + p.nx * w, p.y + p.ny * w); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i], w = wFn(p.u); ctx.lineTo(p.x - p.nx * w, p.y - p.ny * w); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function strokeEdge(ctx, pts, wFn, side, color, lw) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < pts.length; i++) { const p = pts[i], w = wFn(p.u) * side; i ? ctx.lineTo(p.x + p.nx * w, p.y + p.ny * w) : ctx.moveTo(p.x + p.nx * w, p.y + p.ny * w); }
  ctx.stroke();
}
function flashStar(ctx, x, y, r, al) {
  if (al <= .02) return;
  ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate(i * Math.PI / 4 + .2); ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r * .16); ctx.lineTo(r, 0); ctx.lineTo(0, r * .16); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

// ── GRASS: bark vines, thorns, leaves, blooms ────────────────────────────────
function gLeaf(ctx, x, y, len, rot, al, c1 = '#3b9e1a', c2 = '#a4f04c') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al;
  ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .45, -len * .4, len, 0); ctx.quadraticCurveTo(len * .45, len * .4, 0, 0); ctx.fill();
  ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .45, -len * .4, len, 0); ctx.quadraticCurveTo(len * .5, -len * .04, 0, 0); ctx.fill();
  ctx.strokeStyle = '#1d5e10'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .92, 0); ctx.stroke();
  ctx.restore();
}
function gVine(ctx, x1, y1, x2, y2, w, al, t = 0, opt = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1); if (len < 2 || al <= .01) return;
  const pts = ribbonPts(x1, y1, x2, y2, Math.sin(t * 2.4) * len * .06 + len * .09 * (opt.bend ?? 1), Math.max(5, Math.min(11, Math.ceil(len / 11))));
  const wf = u => Math.max(1.2, w * (1 - .68 * u));
  ctx.save(); ctx.globalAlpha = al;
  fillRibbon(ctx, pts, u => wf(u) + 1.4, '#15370e');
  fillRibbon(ctx, pts, wf, gradL(ctx, x1, y1, x2, y2, [[0, '#2b6a19'], [.55, '#55b526'], [1, '#b2f553']]));
  strokeEdge(ctx, pts, wf, -.38, 'rgba(236,255,176,.6)', Math.max(1, w * .2));
  strokeEdge(ctx, pts, wf, .6, 'rgba(18,60,12,.55)', Math.max(1, w * .16));
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], side = i % 2 ? 1 : -1, ww = wf(p.u);
    if (opt.thorns !== false && i % 2 === 0) {
      ctx.fillStyle = '#f1f9c4'; ctx.beginPath();
      ctx.moveTo(p.x + p.nx * ww * side - p.tx * 2.5, p.y + p.ny * ww * side - p.ty * 2.5);
      ctx.lineTo(p.x + p.nx * (ww + 5.5) * side + p.tx * 3, p.y + p.ny * (ww + 5.5) * side + p.ty * 3);
      ctx.lineTo(p.x + p.nx * ww * side + p.tx * 2.5, p.y + p.ny * ww * side + p.ty * 2.5); ctx.fill();
    }
    if (i % 3 === 1 && p.u < .92) gLeaf(ctx, p.x + p.nx * ww * side, p.y + p.ny * ww * side, (opt.leaf ?? 8) * (1 - .3 * p.u), Math.atan2(side * p.ny + p.tx * .7, side * p.nx + p.ty * .7 * -1), .95);
  }
  ctx.restore();
}
function gBloom(ctx, x, y, r, open, al, rot = 0) {
  if (al <= .01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al;
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2 + .4); ctx.fillStyle = '#2f8a18'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * .3, -r * .35, r * 1.05, 0); ctx.quadraticCurveTo(r * .3, r * .35, 0, 0); ctx.fill(); ctx.restore(); }
  const n = 7, pl = r * (.45 + .65 * open);
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.rotate(i / n * Math.PI * 2);
    ctx.fillStyle = gradL(ctx, 0, 0, pl, 0, [[0, '#ffe2f1'], [.6, '#ff8ccd'], [1, '#e0489f']]);
    const wd = pl * .36 * (.35 + open); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(pl * .5, -wd, pl, 0); ctx.quadraticCurveTo(pl * .5, wd, 0, 0); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = gradR(ctx, 0, 0, 0, r * .4, [[0, '#fffbc4'], [1, '#e8b81c']]); ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, TAU); ctx.fill();
  ctx.restore();
}
function gSpikes(ctx, x1, y1, x2, y2, hMax, al, t, sprigs = true) {
  const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.min(9, Math.floor(len / 15)));
  ctx.save(); ctx.globalAlpha = al;
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, x = lerp(x1, x2, u), y = lerp(y1, y2, u), h = hMax * (.55 + .45 * Math.sin(i * 2.3 + 1)) * (1 - .3 * u), lean = Math.sin(i * 1.7) * 3;
    ctx.fillStyle = gradL(ctx, x, y, x, y - h, [[0, '#2a5d15'], [1, '#8fe03e']]);
    ctx.beginPath(); ctx.moveTo(x - 4.5, y); ctx.quadraticCurveTo(x - 2 + lean, y - h * .6, x + lean, y - h); ctx.quadraticCurveTo(x + 2 + lean, y - h * .6, x + 4.5, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,255,190,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 1, y - 1); ctx.quadraticCurveTo(x - 1 + lean, y - h * .55, x + lean, y - h + 1); ctx.stroke();
    if (sprigs && i % 2 === 0) gLeaf(ctx, x, y - h * .45, 8, -1.1 + (i % 4) * .5, .9);
  }
  ctx.restore();
}
function gOrbSeed(ctx, x, y, r, al) {
  ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = gradR(ctx, x - r * .3, y - r * .3, 0, r, [[0, '#d6ff7a'], [.6, '#58b827'], [1, '#235f13']]);
  ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, TAU); ctx.fill(); ctx.restore();
}
function gLeafRing(ctx, x, y, r, al, rot, n = 8) {
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rot; gLeaf(ctx, x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .5, a, al * .9); }
}
function drawGrassShape(ctx, s, P, t) {
  const al = s.al ?? 1, r = s.r;
  switch (s.kind) {
    case 'spine': case 'spine2': gVine(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.0, al, t, { leaf: 9 }); break;
    case 'pulse2': gVine(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.1, al * .85, t + 1, { thorns: false, leaf: 6 }); break;
    case 'trap': gVine(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.15, al, t, { leaf: 8, bend: .4 }); break;
    case 'floor': gVine(ctx, s.x1, s.y1, s.x2, s.y2, r * .55, al * .9, t, { thorns: false, bend: .25 }); gSpikes(ctx, s.x1, s.y1, s.x2, s.y2, r * 2.4, al, t); break;
    case 'head': { const open = P.e >= P.S ? ease(P.a * 1.3) : 0; gBloom(ctx, s.x, s.y, r * .9, open, al, t * .4); if (P.active && P.a < .4) flashStar(ctx, s.x, s.y, r * 1.5, (.4 - P.a) * 2); break; }
    case 'bloom': gLeafRing(ctx, s.x, s.y, s.r * 1.1, al, t * .5, 10); gBloom(ctx, s.x, s.y, s.r * .75, 1, al, t * .3); break;
    case 'impact': gLeafRing(ctx, s.x, s.y, s.r * 1.3 + 8, al, t, 7); flashStar(ctx, s.x, s.y, s.r * 1.3, al * .8); break;
    case 'burst': gLeafRing(ctx, s.x, s.y, s.r * 1.25, al * .8, -t * .7, 9); break;
    case 'sprout': if (s.r > 1) { gVine(ctx, s.x, s.y, s.x + 1, s.y - s.r * 2.2, 1.8, al, 0, { thorns: false, bend: 0 }); gLeaf(ctx, s.x, s.y - s.r * 1.3, s.r * 1.5, -2.4, al); gLeaf(ctx, s.x, s.y - s.r * 1.5, s.r * 1.5, -.7, al); } break;
    case 'bud': case 'pod': case 'seed': gOrbSeed(ctx, s.x, s.y, s.r, al); break;
    case 'mark': gLeaf(ctx, s.x, s.y, 9, t * .6 + s.x * .03, al * .55); break;
    case 'coil': case 'slide': gVine(ctx, s.x1, s.y1, s.x2, s.y2, s.r * .9, al * .85, t, { thorns: false, bend: 1.2 }); break;
    case 'trail': { const n = 4; for (let i = 0; i < n; i++) { const u = (i + .5) / n; gLeaf(ctx, lerp(s.x1, s.x2, u), lerp(s.y1, s.y2, u), 9 - i, Math.atan2(s.y2 - s.y1, s.x2 - s.x1) + Math.PI + (i % 2 ? .5 : -.5), al * (.35 + .5 * u)); } break; }
    default: break;
  }
}

// ── ICE: faceted crystal, frost blades, snowflakes ───────────────────────────
function iCrystal(ctx, x, y, len, wid, rot, al) {
  if (al <= .01 || len < 1) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al;
  const P6 = [[len, 0], [len * .55, -wid], [-len * .2, -wid * .7], [-len * .35, 0], [-len * .2, wid * .7], [len * .55, wid]];
  ctx.fillStyle = gradL(ctx, 0, -wid, 0, wid, [[0, '#f4feff'], [.5, '#a2e8ff'], [1, '#3ea8e8']]);
  ctx.beginPath(); P6.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(20,90,190,.28)'; ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len * .55, wid); ctx.lineTo(-len * .2, wid * .7); ctx.lineTo(-len * .35, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(-len * .35, 0); ctx.moveTo(len * .55, -wid); ctx.lineTo(-len * .2, 0); ctx.stroke();
  ctx.strokeStyle = '#e9fbff'; ctx.lineWidth = 1.2; ctx.beginPath(); P6.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
  ctx.restore();
}
function iBlade(ctx, x1, y1, x2, y2, w, al, t = 0) {
  const len = Math.hypot(x2 - x1, y2 - y1); if (len < 2 || al <= .01) return;
  const pts = ribbonPts(x1, y1, x2, y2, len * .06, 7), wf = u => w * (1 - .9 * Math.pow(u, 1.3)) + .4;
  ctx.save(); ctx.globalAlpha = al;
  fillRibbon(ctx, pts, u => wf(u) + 1.6, 'rgba(24,88,170,.65)');
  // two-tone facets: lit half and shadow half meeting at a bright ridge
  ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const p = pts[i]; i ? ctx.lineTo(p.x - p.nx * wf(p.u), p.y - p.ny * wf(p.u)) : ctx.moveTo(p.x - p.nx * wf(p.u), p.y - p.ny * wf(p.u)); }
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); ctx.fillStyle = gradL(ctx, x1, y1, x2, y2, [[0, '#8fdcff'], [1, '#f6ffff']]); ctx.fill();
  ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const p = pts[i]; i ? ctx.lineTo(p.x + p.nx * wf(p.u), p.y + p.ny * wf(p.u)) : ctx.moveTo(p.x + p.nx * wf(p.u), p.y + p.ny * wf(p.u)); }
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); ctx.fillStyle = gradL(ctx, x1, y1, x2, y2, [[0, '#2c8fe0'], [1, '#79d4ff']]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  for (const u of [.28, .5, .72]) { const p = pts[Math.round(u * (pts.length - 1))], side = u > .4 && u < .6 ? -1 : 1, ang = Math.atan2(p.ny * side + p.tx * .8, p.nx * side + p.ty * .8 * -1); iCrystal(ctx, p.x + p.nx * wf(p.u) * side, p.y + p.ny * wf(p.u) * side, 9 + w * .35, 3 + w * .12, Math.atan2(p.ny * side, p.nx * side) - .5 * side, al * .95); }
  ctx.restore();
}
function iSnow(ctx, x, y, r, rot, al) {
  if (al <= .01 || r < 2) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al; ctx.lineCap = 'round';
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass ? '#FFFFFF' : '#56bff5'; ctx.lineWidth = pass ? 1.2 : 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = Math.cos(a), s = Math.sin(a); ctx.moveTo(0, 0); ctx.lineTo(c * r, s * r); for (const k of [.45, .72]) { const bx = c * r * k, by = s * r * k, bl = r * (.34 - .12 * k); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + .75) * bl, by + Math.sin(a + .75) * bl); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - .75) * bl, by + Math.sin(a - .75) * bl); } }
    ctx.stroke();
  }
  ctx.restore();
}
function iOrb(ctx, x, y, r, al, rot) {
  if (al <= .01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al;
  ctx.fillStyle = gradR(ctx, -r * .25, -r * .3, 0, r * 1.05, [[0, '#ffffff'], [.4, '#a2e8ff'], [1, '#2f8fe0']]);
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(-Math.cos(a) * r * .3, -Math.sin(a) * r * .3); ctx.lineTo(Math.cos(a + 1.57) * r * .6, Math.sin(a + 1.57) * r * .6); } ctx.stroke();
  ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke();
  ctx.restore();
}
function iFrost(ctx, x1, y1, x2, y2, r, al, t) {
  const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(3, Math.min(11, Math.floor(len / 13)));
  ctx.save(); ctx.globalAlpha = al * .75; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(150,225,255,.55)'; ctx.lineWidth = r * 1.6; ctx.beginPath(); ctx.moveTo(x1, y1 + 1); ctx.lineTo(x2, y2 + 1); ctx.stroke();
  ctx.strokeStyle = 'rgba(245,255,255,.9)'; ctx.lineWidth = Math.max(1, r * .4); ctx.beginPath(); ctx.moveTo(x1, y1 - 1); ctx.lineTo(x2, y2 - 1); ctx.stroke(); ctx.restore();
  for (let i = 0; i < n; i++) { const u = (i + .5) / n, h = r * (1.6 + 1.3 * Math.abs(Math.sin(i * 2.2 + 1))) * (1 - .25 * u); iCrystal(ctx, lerp(x1, x2, u), lerp(y1, y2, u), h, Math.max(2.5, r * .38), -Math.PI / 2 + Math.sin(i * 1.9) * .35, al); }
}
function iShardRing(ctx, x, y, r, al, rot, n = 8) { for (let i = 0; i < n; i++) { const a = i / n * TAU + rot; iCrystal(ctx, x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .5, r * .13, a, al * .9); } }
function drawIceShape(ctx, s, P, t) {
  const al = s.al ?? 1, r = s.r;
  switch (s.kind) {
    case 'spine': iBlade(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.05, al, t); break;
    case 'jab': iBlade(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.1, al * .55, t); break;
    case 'pulse2': iFrost(ctx, s.x1, s.y1, s.x2, s.y2, r * .9, al * .8, t); break;
    case 'floor': iFrost(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.0, al, t); break;
    case 'head': iShardRing(ctx, s.x, s.y, r * 1.35, al, t * .3, 6); iSnow(ctx, s.x, s.y, r * .62, t * .5, al); if (P.active && P.a < .4) flashStar(ctx, s.x, s.y, r * 1.5, (.4 - P.a) * 2); break;
    case 'orb': iOrb(ctx, s.x, s.y, r, al, t * .4); iSnow(ctx, s.x, s.y, r * .55, -t * .6, al * .8); break;
    case 'bloom': iShardRing(ctx, s.x, s.y, r * 1.5, al, t * .2, 10); iSnow(ctx, s.x, s.y, r * .85, t * .3, al); break;
    case 'impact': iShardRing(ctx, s.x, s.y, r * 1.8 + 6, al, 0, 8); flashStar(ctx, s.x, s.y, r * 1.4, al * .8); break;
    case 'burst': iShardRing(ctx, s.x, s.y, r * 1.5, al * .75, t * .3, 8); break;
    case 'marker': iSnow(ctx, s.x, s.y, r * 1.6, t * .25, al); ctx.save(); ctx.globalAlpha = al * .6; ctx.strokeStyle = '#b8f0ff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.2, 0, TAU); ctx.stroke(); ctx.restore(); break;
    case 'orbit': iCrystal(ctx, s.x, s.y, 10, 3.5, Math.atan2(s.y + 62, s.x) + Math.PI / 2, al); break;
    case 'trail': if (s.r) { iCrystal(ctx, s.x, s.y, 6, 2.4, t + s.x * .05, al * .7); } else { const n = 3; for (let i = 0; i < n; i++) { const u = (i + .5) / n; iCrystal(ctx, lerp(s.x1, s.x2, u), lerp(s.y1, s.y2, u), 9, 3, Math.atan2(s.y2 - s.y1, s.x2 - s.x1) + Math.PI, al * (.3 + .4 * u)); } } break;
    case 'pivot': case 'seed': iSnow(ctx, s.x, s.y, s.r * 1.1, t * .3, al * .8); break;
    default: break;
  }
}

// ── WATER: layered, translucent ribbons, spheres, ripples, wave crests ───────
function wDrop(ctx, x, y, r, rot, al) {
  if (al <= .01 || r < .6) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al; ctx.fillStyle = gradR(ctx, -r * .2, -r * .2, 0, r * 1.2, [[0, '#f2ffff'], [.5, '#59d0ff'], [1, '#1479d4']]);
  ctx.beginPath(); ctx.moveTo(r * 1.8, 0); ctx.quadraticCurveTo(r * .5, -r * 1.1, -r * .6, -r * .1); ctx.quadraticCurveTo(-r * .9, r * .6, -r * .1, r * .9); ctx.quadraticCurveTo(r * .9, r * 1, r * 1.8, 0); ctx.fill(); ctx.restore();
}
function wRibbon(ctx, x1, y1, x2, y2, w, al, t = 0) {
  const len = Math.hypot(x2 - x1, y2 - y1); if (len < 2 || al <= .01) return;
  const pts = ribbonPts(x1, y1, x2, y2, Math.sin(t * 2.1) * len * .08 + len * .06, Math.max(5, Math.min(11, Math.ceil(len / 10))));
  const wf = u => Math.max(1.3, w * (1 - .6 * u) * (1 + .08 * Math.sin(u * 9 + t * 3)));
  ctx.save(); ctx.globalAlpha = al * .5; fillRibbon(ctx, pts, u => wf(u) * 1.35 + 1, 'rgba(60,170,255,.5)');
  ctx.globalAlpha = al; fillRibbon(ctx, pts, wf, gradL(ctx, x1, y1, x2, y2, [[0, 'rgba(14,104,214,.92)'], [.6, 'rgba(48,176,255,.9)'], [1, 'rgba(160,238,255,.92)']]));
  strokeEdge(ctx, pts, wf, -.45, 'rgba(255,255,255,.75)', Math.max(1, w * .16));
  strokeEdge(ctx, pts, wf, .7, 'rgba(10,70,170,.5)', Math.max(1, w * .14));
  for (let i = 2; i < pts.length - 1; i += 3) { const p = pts[i], side = i % 2 ? 1 : -1; wDrop(ctx, p.x + p.nx * wf(p.u) * 1.5 * side, p.y + p.ny * wf(p.u) * 1.5 * side, 1.7 + w * .08, Math.atan2(p.ny * side, p.nx * side), al * .8); }
  ctx.restore();
}
function wOrb(ctx, x, y, r, al, t = 0) {
  if (al <= .01 || r < 1) return;
  ctx.save(); ctx.globalAlpha = al * .45; ctx.fillStyle = 'rgba(70,180,255,.5)'; ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, TAU); ctx.fill();
  ctx.globalAlpha = al; ctx.fillStyle = gradR(ctx, x - r * .3, y - r * .35, 0, r * 1.05, [[0, '#f4ffff'], [.35, '#76deff'], [.8, '#1b8fe2'], [1, '#0c5cb8']]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(214,250,255,.85)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, r * .98, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(x - r * .32, y - r * .42, r * .26, r * .14, -.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(190,240,255,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r * .62, t * 2, t * 2 + 2.4); ctx.stroke();
  for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * 2.1; wDrop(ctx, x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.2, 1.9 + r * .06, a + 1.57, al * .8); }
  ctx.restore();
}
function wRing(ctx, x, y, rx, ry, al, t) {
  if (al <= .01) return;
  ctx.save(); ctx.globalAlpha = al; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(140,230,255,.9)'; ctx.setLineDash([10, 5]); ctx.lineDashOffset = -t * 12; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = al * .55; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, rx * .72, ry * .72, 0, 0, TAU); ctx.stroke(); ctx.restore();
}
function wWave(ctx, x1, y1, x2, y2, r, al, t) {
  const dir = x2 >= x1 ? 1 : -1, len = Math.abs(x2 - x1); if (len < 3 || al <= .01) return;
  const h = r * 2.3, base = Math.max(y1, y2) + 1, xs = x1, xe = x2;
  ctx.save(); ctx.globalAlpha = al * .92;
  ctx.fillStyle = gradL(ctx, 0, base - h, 0, base, [[0, 'rgba(176,242,255,.95)'], [.5, 'rgba(50,170,250,.9)'], [1, 'rgba(12,100,205,.85)']]);
  ctx.beginPath(); ctx.moveTo(xs, base);
  ctx.quadraticCurveTo(lerp(xs, xe, .45), base - h * .35, lerp(xs, xe, .82), base - h * .85);
  ctx.quadraticCurveTo(xe + dir * 3, base - h * 1.15, xe + dir * 1, base - h * .6);
  ctx.quadraticCurveTo(lerp(xs, xe, .9), base - h * .25, xe, base); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lerp(xs, xe, .1), base - h * .12); ctx.quadraticCurveTo(lerp(xs, xe, .5), base - h * .5, lerp(xs, xe, .84), base - h * .9); ctx.stroke();
  for (let i = 0; i < 4; i++) { const u = .35 + i * .18; wDrop(ctx, lerp(xs, xe, u), base - h * (.5 + .25 * Math.sin(u * 3)) - 3 - (i % 2) * 4, 1.8, -1.2 * dir, al * .85); }
  ctx.restore();
}
function wSplash(ctx, x, y, r, al) {
  for (let i = 0; i < 7; i++) { const a = -Math.PI + (i + .5) / 7 * Math.PI; wDrop(ctx, x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .7, 2.4 + (i % 3) * .6, a, al * .9); }
}
function drawWaterShape(ctx, s, P, t) {
  const al = s.al ?? 1, r = s.r;
  switch (s.kind) {
    case 'spine': wRibbon(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.0, al, t); break;
    case 'pulse2': wRibbon(ctx, s.x1, s.y1, s.x2, s.y2, r * 1.2, al * .8, t + 1); break;
    case 'floor': wWave(ctx, s.x1, s.y1, s.x2, s.y2, r, al, t); break;
    case 'head': wOrb(ctx, s.x, s.y, r * .92, al, t); if (P.active && P.a < .4) flashStar(ctx, s.x, s.y, r * 1.5, (.4 - P.a) * 2); break;
    case 'orb': wOrb(ctx, s.x, s.y, r, al, t); wRing(ctx, s.x, s.y, r * 1.3, r * .7, al * .6, t); break;
    case 'mark': wOrb(ctx, s.x, s.y, s.r, al, t); wRing(ctx, s.x, s.y, s.r * 1.4, s.r * .8, al * .7, t); break;
    case 'markIdle': wOrb(ctx, s.x, s.y, s.r, al * .8, t); break;
    case 'marker': wRing(ctx, s.x, s.y + 2, s.r * 1.7, s.r * .6, al, t); wDrop(ctx, s.x, s.y - s.r * .8, 2 + s.r * .12, -1.57, al); break;
    case 'impact': wSplash(ctx, s.x, s.y, s.r * 1.5 + 8, al); wRing(ctx, s.x, s.y + 3, s.r * 1.6, s.r * .5, al * .8, t); flashStar(ctx, s.x, s.y, s.r * 1.2, al * .7); break;
    case 'burst': wRing(ctx, s.x, s.y, s.r * 1.2, s.r * .9, al * .75, t); wRing(ctx, s.x, s.y, s.r * .8, s.r * .6, al * .5, -t); break;
    case 'grip': wOrb(ctx, s.x, s.y, s.r, al * .8, t); break;
    case 'trail': case 'run': if (s.shape === 'capsule') wRibbon(ctx, s.x1, s.y1, s.x2, s.y2, Math.max(2.2, s.r * .9), al * .7, t); else wDrop(ctx, s.x, s.y, s.r * .8, -.4, al * .7); break;
    default: break;
  }
}

const HERO_DRAW = { g1_grass: drawGrassShape, g1_ice: drawIceShape, g1_water: drawWaterShape };
const PASS1 = new Set(['floor', 'pulse2', 'trap', 'trail', 'slide', 'run', 'jab', 'coil', 'marker', 'mark', 'markIdle']);
const PASS2 = new Set(['spine', 'spine2']);
function renderHeroShapes(ctx, charId, shapes, P) {
  const draw = HERO_DRAW[charId]; if (!draw) return;
  const t = P.e * .28;
  ctx.save();
  try {
    for (const s of shapes) if (PASS1.has(s.kind)) draw(ctx, s, P, t);
    for (const s of shapes) if (PASS2.has(s.kind)) draw(ctx, s, P, t);
    for (const s of shapes) if (!PASS1.has(s.kind) && !PASS2.has(s.kind) && s.kind !== 'sweep') draw(ctx, s, P, t);
  } finally { ctx.restore(); }
}
const MOVE_ALIAS = { heavy: 'sh', upHeavy: 'uh', downHeavy: 'dh' };
const HOLD_AT = { us: [22, -92], uh: [18, -112], ds: [26, -8], dh: [26, -8], ss: [40, -44], sh: [32, -60], recovery: [10, -48], groundPound: [0, -50], super: [24, -56] };
function heroHold(ctx, charId, move, charge) {
  const [x, y] = HOLD_AT[move] || [30, -50], r = 5 + charge * 9, al = .45 + charge * .45, t = charge * 4;
  ctx.save();
  if (charId === 'g1_grass') { gBloom(ctx, x, y, r, charge * .8, al, t); }
  else if (charId === 'g1_ice') { iCrystal(ctx, x, y, r * 1.6, r * .5, -Math.PI / 2, al); iSnow(ctx, x, y, r * 1.3, t * .4, al * .8); }
  else { wOrb(ctx, x, y, r, al, t); wRing(ctx, x, y + r * .6, r * 1.8, r * .6, al * .7, t); }
  ctx.restore();
}
function drawNewHeroAttack(ctx, charId, rawMove, p) {
  const move = MOVE_ALIAS[rawMove] || rawMove;
  if (p < 0) { heroHold(ctx, charId, move, holdCharge(p)); return; }
  const P = gen1Phase(charId, move, p), shapes = getGen1AttackGeometry(charId, move, p);
  renderHeroShapes(ctx, charId, shapes, P);
}

// ── Body choreography for Grass / Ice / Water. Phases come from the real frame data
//    (w = wind-up, a = active, r = recovery) so the limbs hit exactly when the hitbox appears.
function gen1HeroBodyPose(charId, move, q, facing) {
  const P = gen1Phase(charId, move, q), w = P.w, a = P.a, r = P.r, ea = easeOut(a), sa = Math.sin(a * Math.PI);
  const grass = charId === 'g1_grass', ice = charId === 'g1_ice';
  const lead = facing >= 0 ? 'R' : 'L';
  let punchArmL = 0, punchArmR = 0, legSwing = 0, lean = 0, bob = 0;
  const L = v => { if (lead === 'R') punchArmR = v; else punchArmL = -v; };
  const O = v => { if (lead === 'R') punchArmL = v; else punchArmR = -v; };
  const f = facing, rr = 1 - ease(r);                       // fades everything back to neutral while recovering
  const inW = P.e < P.S, act = P.e >= P.S && P.e < P.S + P.A;
  if (grass) {
    if (move === 'us') { const st = Math.sin(w * TAU * 2); legSwing = (.6 * st * (1 - a) + .5 * ea) * rr; bob = (3 * Math.abs(st) * (1 - a) - 17 * ea) * rr; lean = f * (-.14 * w * (1 - a) + .3 * ea) * rr; L((-.35 * w - 1.25 * ea) * rr); O((.55 * w + .45 * ea) * rr); }
    else if (move === 'ds') { const hop = Math.sin(Math.min(1, w) * Math.PI); bob = (-9 * hop + 7 * ea) * rr; lean = f * (-.24 * hop + .26 * ea) * rr; legSwing = (-.4 * hop + .45 * ea) * rr; L((.15 * w + .55 * ea) * rr); O((.4 * hop) * rr); }
    else if (move === 'ss') { const fe = Math.sin(w * Math.PI); lean = f * (.16 * fe - .1 * w * (1 - fe) + .46 * ea) * rr; bob = (3 * fe - 5 * ea) * rr; legSwing = (-.25 * w + .55 * ea) * rr; L((-.9 * w - .9 * ea) * rr); O((.5 + .4 * ea) * rr * (w > .2 ? 1 : 0)); }
    else if (move === 'uh') { const crouch = Math.sin(Math.min(1, w) * Math.PI * .5); const jump = ease((w - .45) / .55); bob = (6 * crouch * (1 - jump) - 24 * jump + (inW ? 0 : -6 * Math.sin(a * Math.PI * .5)) + 20 * ease(a * .7) * (1 - ease((a - .55) / .45) * .9)) * rr; lean = f * (.2 * w - .4 * ea) * rr; legSwing = (.8 * w - 1.15 * ea) * rr; L((-.5 * w - 1.6 * ea) * rr); O((-.4 * w - .9 * ea) * rr); }
    else if (move === 'dh') { bob = (2 * w + 9 * ease(a * 3)) * rr; lean = f * (.05 * w + .18 * ea) * rr; legSwing = .1 * ea * rr; punchArmL = (-.4 * w - .9 * ea) * rr; punchArmR = punchArmL; }
    else if (move === 'sh') { const slide = Math.sin(Math.min(1, w) * Math.PI * .5); bob = (11 * slide * (1 - ea) - 4 * ea) * rr; lean = f * (.5 * slide * (1 - a) + .1 * ea) * rr; legSwing = (-.8 * slide + .45 * ea) * rr; L((-.2 * slide - .5 * ea) * rr); O((.9 * ea + .3 * slide) * rr); }
    else if (move === 'recovery') { lean = f * (-.38 * w * (1 - a) + .22 * ea) * rr; bob = (-16 * ea) * rr; legSwing = (.8 * Math.sin(w * Math.PI) - .3 * ea) * rr; L((-.5 * w - 1.7 * ea) * rr); O((.5 * w - 1.3 * ea) * rr); }
    else if (move === 'groundPound') { const dive = ease(Math.min(1, P.e / Math.max(1, P.T * .58))); lean = f * (.2 + .55 * dive - .4 * ease((P.e - P.T * .58) / 5)) ; bob = 14 * dive - 12 * ease((P.e - P.T * .58) / 6); legSwing = .9 * dive - .4 * ease((P.e - P.T * .58) / 6); punchArmL = -.8 - .2 * dive; punchArmR = punchArmL; }
    else if (move === 'super') { const g = ease(q / .3); lean = f * (.1 * g + .4 * ease(a) - .35 * ease(r * 2)); bob = (-6 * g - 4 * ea + 3 * r) ; legSwing = .5 * Math.sin(q * TAU * 2) * (1 - a); punchArmL = -1.2 * g - .6 * ea - .5 * ease(r * 2); punchArmR = -1.2 * g - .3 * ea; }
  } else if (ice) {
    if (move === 'us') { const hop = Math.sin(ease(w) * Math.PI); bob = (-22 * hop * (inW ? 1 : 0) + (inW ? 0 : -10 * Math.sin((1 - ea) * Math.PI * .5) )) * rr; lean = f * (-.12 * w * (1 - hop) + .12 * hop + .2 * ea) * rr; legSwing = (.4 * hop + 1.05 * ea) * rr; L((-.3 * w - .9 * ea) * rr); O((.8 * hop - .5 * ea) * rr); }
    else if (move === 'ds') { const sp = Math.sin(a * TAU * 1.25); lean = f * (.08 * w + .18 * sp) * rr; bob = (4 * w + 2 * Math.abs(sp)) * rr; legSwing = (Math.sin(a * TAU * 1.25 * 2) * .95 * (act ? 1 : 0) + .3 * w) * rr; punchArmL = (.7 * w + .5 * ea) * rr; punchArmR = punchArmL; }
    else if (move === 'ss') { const j = ease((w - .35) / .3) * (1 - ease((w - .75) / .25)); lean = f * (-.1 * w + .1 * j + .46 * ea) * rr; legSwing = (-.15 * j + .35 * ea) * rr; L((-.1 - 1.55 * j - 1.9 * ea) * rr); O((.4 + .3 * ea) * rr); }
    else if (move === 'uh') { const sp = Math.sin(w * TAU * 1.5); lean = f * (.25 * sp * (1 - ease(a)) - .2 * ea) * rr; bob = (4 * w - 5 * (1 - w) * 0 - 28 * ea) * rr; legSwing = (.4 * sp - .55 * ea) * rr; L((.3 * w * (1 - ea) - 2.5 * ea) * rr); O((.3 * w * (1 - ea) - 2.3 * ea) * rr); }
    else if (move === 'dh') { bob = (2 * w + 7 * ease(a * 3)) * rr; lean = f * (.04 * w + .22 * ea) * rr; legSwing = .1 * ea * rr; punchArmL = (-.5 * w - .7 * ea) * rr; punchArmR = punchArmL; }
    else if (move === 'sh') { const rs = ease(w); lean = f * (-.34 * rs * (1 - ea) + .56 * ea) * rr; bob = (-6 * rs * (1 - ea) + 5 * ea) * rr; legSwing = (-.4 * rs + .6 * ea) * rr; L((-2.9 * rs * (1 - ea) - 1.5 * ea) * rr); O((-2.5 * rs * (1 - ea) + .9 * ea) * rr); }
    else if (move === 'recovery') { lean = f * (.3 * w * (1 - a) - .2 * ea) * rr; bob = (-5 * w - 14 * ea) * rr; legSwing = (.5 * Math.sin(q * TAU) + .3 * ea) * rr; L((-1.4 * ease(w * 1.6) - .8 * ea) * rr); O((.5 * w - 1.2 * ea) * rr); }
    else if (move === 'groundPound') { const dive = ease(Math.min(1, P.e / Math.max(1, P.T * .58))); lean = f * (.08 + .5 * Math.sin(dive * Math.PI * .8) + .2 * dive); bob = 14 * dive - 10 * ease((P.e - P.T * .58) / 6); legSwing = .25 * dive - .6 * ease((P.e - P.T * .58) / 6); L(-.4 - .8 * dive); O(-.5 - .5 * dive); }
    else if (move === 'super') { const g = ease(q / .3); lean = f * (.1 * g + .15 * ea - .3 * ease(r * 2)); bob = -6 * g + 4 * ease(r * 2); legSwing = .4 * Math.sin(q * TAU * 1.5); L(-.7 * g - 1.5 * ea); O(-.9 * g - .3 * ea + .8 * ease(r * 2)); }
  } else { // water
    if (move === 'us') { const run = Math.sin(w * TAU * 3); legSwing = (.9 * run * (1 - a) + .3 * ea) * rr; bob = (2 * Math.abs(run) * (1 - a) - 14 * ea) * rr; lean = f * (.22 * w * (1 - a) - .26 * ea) * rr; L((-.3 * w + .9 * (1 - ea) * a * 0 - 2.2 * ea) * rr); O((.7 * w * (1 - a) + .6 * ea) * rr); punchArmL += 0; }
    else if (move === 'ds') { const tap = ease(Math.min(1, w * 1.4)); bob = (9 * tap * (1 - ea) - 8 * ea) * rr; lean = f * (.22 * tap * (1 - ea) - .3 * ea) * rr; legSwing = (-.2 * tap + .5 * ea) * rr; L((.5 * tap - .1 * ea) * rr); O((.2 * tap) * rr); }
    else if (move === 'ss') { lean = f * (-.14 * w * (1 - a) + .36 * ea) * rr; bob = (3 * w - 2 * ea) * rr; legSwing = (-.3 * w + .3 * ea) * rr; L((-.3 * w - 1.6 * ea - .4 * w * (1 - a)) * rr); O((.6 * ea) * rr); }
    else if (move === 'uh') { lean = f * (.1 * w - .42 * ea) * rr; bob = (4 * w - 24 * ea) * rr; legSwing = (.2 * w - .6 * ea) * rr; L((-1.35 * ease(w) - 1.2 * ea) * rr); O((-1.2 * ease(w) - 1.3 * ea) * rr); }
    else if (move === 'dh') { const lp = Math.sin(Math.min(1, w) * Math.PI); bob = (-18 * lp * (inW ? 1 : 0) + 13 * ease(a * 3)) * rr; lean = f * (.12 * lp + .22 * ea) * rr; legSwing = (.9 * ease(a * 3) + .4 * lp) * rr; L((-.5 * lp - .4 * ea) * rr); O((-.3 * lp + .5 * ea) * rr); }
    else if (move === 'sh') { const st = ease(w); lean = f * (-.34 * st * (1 - ea) + .52 * ea) * rr; bob = (3 * st - 3 * ea) * rr; legSwing = (.9 * Math.sin(w * Math.PI) - .1 + .5 * ea) * rr; L((-.4 * st - 1.8 * ea) * rr); O((.7 * ea - .3 * st) * rr); }
    else if (move === 'recovery') { const roll = Math.sin(q * TAU * 1.3); lean = f * (.34 * roll - .1 * ea) * rr; bob = (-15 * ea - 4 * Math.abs(roll)) * rr; legSwing = .85 * roll * rr; L((-.7 * Math.abs(roll) - .5 * ea) * rr); O((.6 * roll) * rr); }
    else if (move === 'groundPound') { const dive = ease(Math.min(1, P.e / Math.max(1, P.T * .58))); lean = f * (.18 + .38 * Math.sin(q * TAU * 2.3)); bob = 14 * dive - 11 * ease((P.e - P.T * .58) / 6); legSwing = .7 * Math.sin(q * TAU * 2.3); L(-.7 - .3 * dive); O(-.6 - .3 * dive); }
    else if (move === 'super') { const g = ease(q / .26), ex = Math.sin(q * TAU * 3) * (1 - ease(a)); lean = f * (.16 * ex + .06 * g - .38 * ease(a) * (1 - ease(r * 2))); bob = -4 * g - 6 * ea; legSwing = .6 * Math.sin(q * TAU * 2); L((-.6 - .8 * Math.max(0, ex)) * (1 - ease(r * 2)) - 1.0 * ea); O(-.5 + .8 * Math.max(0, -ex) - .6 * ea); }
  }
  return { punchArmL, punchArmR, legSwing, lean, bob };
}
