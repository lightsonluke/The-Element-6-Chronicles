// mvArt.js — paints a move from the SAME geometry the hitboxes use (`viz` from mvMove.evalFx).
// Every effect is a shaded volume (glow + gradient body + bright core + element detail), never a bare stroke.
// The painted body fills the hit volume; detail (sparks, tongues, shards) is decoration around it.
import { hash, TAU, clamp, lerp } from './mvCore.js';
import { rgba, mixHex, lighten, darken, nz, nzs, resample, bodyEdges, fillEdges, alongGradient, ptAt, skinOf, clamp01 } from './mvArtLib.js';

const FADE = 7;                         // frames the finished effect lingers (visual only)
const norm = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };

// ── interpolate widths onto resampled points ──
function wsAt(ws, n) { const o = []; for (let i = 0; i <= n; i++) { const f = (i / n) * (ws.length - 1), j = Math.min(ws.length - 2, Math.floor(f)), u = f - j; o.push(ws.length < 2 ? ws[0] : ws[j] + (ws[j + 1] - ws[j]) * u); } return o; }

function tailFill(ctx, pts, S, a0 = 0.0, a1 = 1.0) {
  const p0 = pts[0], p1 = pts[pts.length - 1];
  return alongGradient(ctx, p0, p1, [[0, rgba(S.pal[0], a0)], [0.35, rgba(S.pal[1], a1 * 0.8)], [1, rgba(S.pal[1], a1)]]);
}

// ═══════════ FAMILY PAINTERS: ribbon(ctx, pts, ws, S) ═══════════
const FAM = {
  flame(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f;
    const lay = (k, col, a, blur) => {
      const w = W.map((v, i) => v * k * (0.82 + 0.38 * nz(S.seed + f, i)) * (o.wisp ? 0.8 : 1));
      const { L, R } = bodyEdges(P, w); ctx.save(); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = blur;
      fillEdges(ctx, L, R, alongGradient(ctx, P[0], P[n], [[0, rgba(col, 0)], [0.3, rgba(col, a * 0.7)], [1, rgba(col, a)]])); ctx.restore();
    };
    lay(1.16, S.pal[0], 0.5, 18 * S.big); lay(1.0, S.pal[0], 0.9, 6); lay(0.7, S.pal[1], 0.95, 0); lay(0.36, S.pal[2], 1, 0);
    const N = bodyEdges(P, W).N;
    for (let i = 1; i <= n; i++) {                       // flame tongues licking off the body
      const up = N[i][1] < 0 ? 1 : -1, len = W[i] * (o.small ? 0.3 : 0.5) * (0.4 + nz(S.seed + f, i + 40)), base = W[i] * 0.34;
      const x = P[i][0] + N[i][0] * up * W[i] * 0.42, y = P[i][1] + N[i][1] * up * W[i] * 0.42;
      const tx = x + N[i][0] * up * len + nzs(S.seed + f, i) * 4, ty = y + N[i][1] * up * len - len * 0.25;
      ctx.fillStyle = rgba(i % 2 ? S.pal[1] : S.pal[0], 0.85); ctx.beginPath(); ctx.moveTo(x - base * 0.6, y); ctx.quadraticCurveTo(x, y - len * 0.3, tx, ty); ctx.quadraticCurveTo(x + base * 0.2, y - len * 0.2, x + base * 0.6, y); ctx.fill();
      if (o.cold && i % 3 === 0) { ctx.fillStyle = rgba(S.pal[3], 0.8); ctx.beginPath(); ctx.arc(tx, ty, 2.2, 0, TAU); ctx.fill(); }
    }
    for (let i = 0; i < 9; i++) { const q = ptAt(P, nz(S.seed, i + 90)); const rise = ((f * 1.6 + i * 7) % 26); ctx.fillStyle = rgba(S.pal[2], 0.9 - rise / 30); ctx.beginPath(); ctx.arc(q[0] + nzs(S.seed, i) * W[n] * 0.4, q[1] - rise - 2, 1 + nz(S.seed, i + 5) * 1.6, 0, TAU); ctx.fill(); }
  },
  crystal(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, al = o.clear ? 0.62 : 0.92;
    const wj = W.map((v, i) => v * (0.86 + 0.28 * ((i % 2) ? 1 : 0.4)));
    const { L, R, N } = bodyEdges(P, wj);
    ctx.save(); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 16 * S.big;
    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.moveTo(L[i][0], L[i][1]); ctx.lineTo(L[i + 1][0], L[i + 1][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.closePath();
      ctx.fillStyle = rgba(i % 2 ? S.pal[1] : lighten(S.pal[0], 0.35), al * (0.35 + 0.65 * i / n)); ctx.fill();
      ctx.beginPath(); ctx.moveTo(R[i][0], R[i][1]); ctx.lineTo(R[i + 1][0], R[i + 1][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.closePath();
      ctx.fillStyle = rgba(i % 2 ? S.pal[0] : darken(S.pal[0], 0.2), al * (0.35 + 0.65 * i / n)); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = rgba('#ffffff', 0.85); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); L.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R[0][0], R[0][1]); R.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke();
    ctx.strokeStyle = rgba(S.pal[2], 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); P.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke();
    for (let i = 1; i <= n; i++) for (const sd of [-1, 1]) {                    // shards erupting from the edges
      const len = wj[i] * (0.18 + 0.4 * nz(S.seed, i * 3 + (sd > 0 ? 1 : 0))), bx = P[i][0] + N[i][0] * sd * wj[i] * 0.5, by = P[i][1] + N[i][1] * sd * wj[i] * 0.5;
      const tx = bx + N[i][0] * sd * len + (P[Math.min(n, i + 1)][0] - P[i][0]) * 0.5, ty = by + N[i][1] * sd * len + (P[Math.min(n, i + 1)][1] - P[i][1]) * 0.5;
      ctx.fillStyle = rgba(o.bone ? '#f4efe0' : lighten(S.pal[1], 0.5), 0.9); ctx.strokeStyle = rgba('#ffffff', 0.8); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(bx - N[i][1] * 3, by + N[i][0] * 3); ctx.lineTo(tx, ty); ctx.lineTo(bx + N[i][1] * 3, by - N[i][0] * 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (o.hex) { ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = 1; for (let i = 1; i < n; i += 2) { const r = wj[i] * 0.3; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.lineTo(P[i][0] + Math.cos(a) * r, P[i][1] + Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); } }
    for (let i = 0; i < 4; i++) { const q = ptAt(P, nz(S.seed, i + 7)), r = 3 + 3 * nz(S.seed + S.f, i); sparkle(ctx, q[0], q[1], r, '#ffffff'); }
  },
  bolt(ctx, P, W, S) {
    const n = P.length - 1, f = S.f;
    // translucent charged body so the hit volume is visible
    const { L, R } = bodyEdges(P, W.map((w) => w * 0.9)); fillEdges(ctx, L, R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0)], [1, rgba(S.pal[0], 0.32)]]));
    const path = (amp, seed) => { const out = [P[0]]; for (let i = 1; i < n; i++) { const nx = bodyEdges(P, W).N[i]; const j = nzs(seed + f, i) * amp; out.push([P[i][0] + nx[0] * j, P[i][1] + nx[1] * j]); } out.push(P[n]); return out; };
    const draw = (pp, lw, col, blur) => { ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowColor = S.pal[0]; ctx.shadowBlur = blur; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pp.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore(); };
    const wMax = Math.max(...W);
    for (let b = 0; b < 3; b++) { const pp = path(wMax * 0.42, S.seed + b * 17); draw(pp, 7 - b * 1.5, rgba(S.pal[0], 0.55), 20); draw(pp, 3.6 - b * 0.6, rgba(S.pal[1], 0.95), 8); draw(pp, 1.7, '#ffffff', 0); }
    for (let k = 0; k < 4; k++) {                                              // forks
      const i = 1 + Math.floor(nz(S.seed + f, k + 20) * Math.max(1, n - 2)), q = P[i], dir = (k % 2 ? 1 : -1) * wMax * (0.7 + nz(S.seed + f, k)), fp = [q];
      for (let j = 1; j <= 4; j++) fp.push([q[0] + (j * dir) / 4 * 0.9 + nzs(S.seed + f, k * 9 + j) * 5, q[1] + (j * dir) / 4 * (nz(S.seed, k) - 0.4) * 1.4 + nzs(S.seed + f, k * 9 + j + 3) * 5]);
      draw(fp, 2.4, rgba(S.pal[1], 0.9), 8); draw(fp, 1, '#ffffff', 0);
    }
    const t = P[n]; ctx.fillStyle = rgba('#ffffff', 0.95); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(t[0], t[1], 3.4 + nz(S.seed + f, 3) * 2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  },
  liquid(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f;
    const w = W.map((v, i) => v * (1 + 0.11 * Math.sin(i * 1.3 + f * 0.45) + (o.blob ? 0.12 * Math.sin(i * 2.6 + f * 0.3) : 0)));
    const { L, R, N } = bodyEdges(P, w);
    ctx.save(); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 14 * S.big;
    fillEdges(ctx, L, R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0.0)], [0.25, rgba(S.pal[0], 0.7)], [1, rgba(S.pal[1], 0.9)]])); ctx.restore();
    // depth: darker belly, bright specular streak on the upper side
    const inner = bodyEdges(P, w.map((v) => v * 0.55)); fillEdges(ctx, inner.L, inner.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[3], 0)], [1, rgba(S.pal[3], 0.28)]]));
    const hl = P.map((p, i) => [p[0] + (N[i][1] < 0 ? N[i][0] : -N[i][0]) * w[i] * 0.24, p[1] + (N[i][1] < 0 ? N[i][1] : -N[i][1]) * w[i] * 0.24]);
    ctx.strokeStyle = rgba(S.pal[2], 0.75); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); hl.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.strokeStyle = rgba(S.pal[2], 0.8); ctx.lineWidth = 1.1; ctx.beginPath(); L.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    for (let i = 1; i <= n; i += 2) { const r = w[i] * 0.16 + 1; ctx.strokeStyle = rgba(S.pal[2], 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(L[i][0], L[i][1], r, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { const q = ptAt(P, 0.5 + 0.5 * nz(S.seed, i)); const off = ((f * 1.3 + i * 5) % 18); ctx.fillStyle = rgba(S.pal[1], 0.85 - off / 24); ctx.beginPath(); ctx.arc(q[0] + nzs(S.seed, i + 3) * w[n] * 0.5, q[1] + nzs(S.seed, i + 9) * w[n] * 0.5 + (o.drip ? off * 0.8 : -off * 0.4), 1.3 + nz(S.seed, i + 4) * 2, 0, TAU); ctx.fill(); }
    if (o.string) { ctx.strokeStyle = rgba(S.pal[1], 0.8); ctx.lineWidth = 1.6; for (let k = 0; k < 4; k++) { const a = ptAt(P, k / 4), b = ptAt(P, 0.5 + k / 8); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 8 + 4 * Math.sin(f * 0.4 + k), b[0], b[1]); ctx.stroke(); } }
    if (o.bubbles) for (let i = 0; i < 6; i++) { const q = ptAt(P, nz(S.seed, i + 30)); ctx.strokeStyle = rgba(S.pal[3], 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q[0], q[1] - ((f + i * 4) % 16), 2 + nz(S.seed, i) * 3, 0, TAU); ctx.stroke(); }
  },
  vine(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f, { N } = bodyEdges(P, W);
    const body = bodyEdges(P, W.map((v) => v * 0.8)); fillEdges(ctx, body.L, body.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0)], [1, rgba(S.pal[0], 0.28)]]));
    for (let strand = 0; strand < 2; strand++) {
      const ph = strand * Math.PI, pts = P.map((p, i) => { const off = Math.sin(i * 0.95 + f * 0.18 + ph) * W[i] * 0.28; return [p[0] + N[i][0] * off, p[1] + N[i][1] * off]; });
      ctx.save(); ctx.shadowColor = S.pal[1]; ctx.shadowBlur = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(S.pal[0], 0.95); ctx.lineWidth = Math.max(3, W[n] * 0.2); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.strokeStyle = rgba(S.pal[1], 0.9); ctx.lineWidth = Math.max(1.5, W[n] * 0.09); ctx.stroke(); ctx.restore();
      for (let i = 1; i <= n; i += 2) {
        const sd = (i + strand) % 2 ? 1 : -1, x = pts[i][0], y = pts[i][1], a = Math.atan2(N[i][1] * sd, N[i][0] * sd), L = W[i] * (0.28 + 0.2 * nz(S.seed, i));
        if (o.thorn) { ctx.fillStyle = rgba(S.pal[3], 0.95); ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + Math.cos(a) * L * 1.1, y + Math.sin(a) * L * 1.1); ctx.lineTo(x + 2, y); ctx.fill(); }
        else { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = rgba(S.pal[1], 0.95); ctx.strokeStyle = rgba(S.pal[2], 0.8); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(L * 0.6, 0, L, L * 0.45, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
      }
    }
    const t = P[n];
    if (o.petal) for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + f * 0.05; ctx.fillStyle = rgba(k % 2 ? S.pal[2] : S.pal[3], 0.9); ctx.beginPath(); ctx.ellipse(t[0] + Math.cos(a) * 7, t[1] + Math.sin(a) * 7, 5, 2.6, a, 0, TAU); ctx.fill(); }
    if (o.swell) for (let i = 2; i <= n; i += 3) { ctx.strokeStyle = rgba(S.pal[1], 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P[i][0], P[i][1], W[i] * 0.55, 0, TAU); ctx.stroke(); }
  },
  rock(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f;
    const body = bodyEdges(P, W.map((v) => v * 0.75)); fillEdges(ctx, body.L, body.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0)], [1, rgba(S.pal[0], 0.34)]]));
    for (let i = 0; i <= n; i++) {
      const r = W[i] * (o.grain ? 0.14 : 0.36) * (0.7 + 0.6 * nz(S.seed, i)), x = P[i][0] + nzs(S.seed, i + 20) * W[i] * 0.22, y = P[i][1] + nzs(S.seed, i + 40) * W[i] * 0.22, k = 6 + (i % 2), rot = nz(S.seed, i + 60) * TAU, al = 0.35 + 0.65 * i / n;
      if (o.spear) { const a = Math.atan2(P[Math.min(n, i + 1)][1] - P[Math.max(0, i - 1)][1], P[Math.min(n, i + 1)][0] - P[Math.max(0, i - 1)][0]); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = rgba(S.pal[1], al); ctx.strokeStyle = rgba('#ffffff', 0.8 * al); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r * 2.4, 0); ctx.lineTo(-r, r * 0.8); ctx.lineTo(-r * 0.5, 0); ctx.lineTo(-r, -r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); continue; }
      const poly = []; for (let q = 0; q < k; q++) { const a = rot + q * TAU / k, rr = r * (o.plate ? 1 : 0.75 + 0.5 * nz(S.seed, i * 11 + q)); poly.push([x + Math.cos(a) * rr * (o.plate ? 1.3 : 1), y + Math.sin(a) * rr]); }
      ctx.beginPath(); poly.forEach((p, q) => (q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fillStyle = rgba(S.pal[0], al); ctx.fill();
      ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (let q = 1; q <= Math.ceil(k / 2); q++) ctx.lineTo(poly[q][0], poly[q][1]); ctx.lineTo(x, y); ctx.closePath(); ctx.fillStyle = rgba(S.pal[1], al * 0.95); ctx.fill();
      ctx.strokeStyle = rgba(S.pal[3], 0.8 * al); ctx.lineWidth = 1; ctx.beginPath(); poly.forEach((p, q) => (q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
      if (o.plate && i % 2 === 0) { ctx.fillStyle = rgba('#ffffff', 0.9); ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill(); }
    }
    for (let i = 0; i < 14; i++) { const q = ptAt(P, nz(S.seed, i + 100)), a = nz(S.seed + f, i) * TAU, d = (f * 2.2 + i * 6) % 24; ctx.fillStyle = rgba(o.flake ? S.pal[3] : S.pal[1], 0.75 - d / 34); ctx.beginPath(); ctx.arc(q[0] + Math.cos(a) * d * 0.7, q[1] + Math.sin(a) * d * 0.7 - d * 0.2, o.grain ? 1 : 1.5, 0, TAU); ctx.fill(); }
    if (o.spark) { ctx.strokeStyle = rgba(S.pal[3], 0.9); ctx.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const q = ptAt(P, nz(S.seed, i + 5)), a = nz(S.seed + f, i) * TAU; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + Math.cos(a) * 9, q[1] + Math.sin(a) * 9); ctx.stroke(); } }
  },
  streak(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f, { N } = bodyEdges(P, W);
    const body = bodyEdges(P, W.map((v) => v * 0.9)); fillEdges(ctx, body.L, body.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0)], [1, rgba(S.pal[0], o.soft ? 0.4 : 0.3)]]));
    const lines = o.plasma ? 3 : 7;
    for (let k = 0; k < lines; k++) {
      const fo = lines === 1 ? 0 : (k / (lines - 1) - 0.5), ph = k * 1.7;
      const pts = P.map((p, i) => { const o2 = fo * W[i] * 0.95 + (o.spiral ? Math.sin(i * 0.8 + f * 0.3 + ph) * W[i] * 0.3 : Math.sin(i * 0.5 + f * 0.22 + ph) * W[i] * 0.06); return [p[0] + N[i][0] * o2, p[1] + N[i][1] * o2]; });
      ctx.save(); ctx.lineCap = 'round'; ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 8;
      for (let i = 1; i <= n; i++) { const a = 0.2 + 0.7 * i / n; ctx.strokeStyle = rgba(k % 2 ? S.pal[1] : S.pal[2], a); ctx.lineWidth = Math.max(1, (o.plasma ? 0.4 : 0.14) * W[i] * (1 - Math.abs(fo) * 0.6)); ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
      ctx.restore();
    }
    if (o.rings || o.wave || o.portal) for (let i = 1; i <= n; i += (o.portal ? 5 : 2)) { const a = Math.atan2(P[Math.min(n, i + 1)][1] - P[Math.max(0, i - 1)][1], P[Math.min(n, i + 1)][0] - P[Math.max(0, i - 1)][0]); ctx.save(); ctx.translate(P[i][0], P[i][1]); ctx.rotate(a); ctx.strokeStyle = rgba(o.portal ? (i % 2 ? S.pal[3] : S.pal[1]) : S.pal[1], 0.4 + 0.5 * i / n); ctx.lineWidth = o.portal ? 3 : 1.8; ctx.beginPath(); ctx.ellipse(0, 0, o.wave ? W[i] * 0.15 + 3 : W[i] * 0.2, W[i] * (o.wave ? 0.5 : 0.52), 0, o.wave ? -1.1 : 0, o.wave ? 1.1 : TAU); ctx.stroke(); ctx.restore(); }
    if (o.ticks) for (let i = 1; i <= n; i += 2) { const a = Math.atan2(N[i][1], N[i][0]); ctx.strokeStyle = rgba(S.pal[2], 0.8); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(P[i][0] - N[i][0] * W[i] * 0.5, P[i][1] - N[i][1] * W[i] * 0.5); ctx.lineTo(P[i][0] + N[i][0] * W[i] * 0.5, P[i][1] + N[i][1] * W[i] * 0.5); ctx.stroke(); }
    if (o.soft) for (let i = 0; i <= n; i++) { const r = W[i] * (0.5 + 0.3 * nz(S.seed, i)); const g = ctx.createRadialGradient(P[i][0], P[i][1], 0, P[i][0], P[i][1], r); g.addColorStop(0, rgba(S.pal[1], 0.5)); g.addColorStop(1, rgba(S.pal[1], 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P[i][0], P[i][1], r, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 7; i++) { const q = ptAt(P, nz(S.seed, i + 50)), d = (f * 2 + i * 5) % 20; ctx.fillStyle = rgba(S.pal[2], 0.8 - d / 26); ctx.beginPath(); ctx.arc(q[0] + nzs(S.seed, i) * W[n] * 0.5, q[1] + nzs(S.seed, i + 8) * W[n] * 0.5, 1.4, 0, TAU); ctx.fill(); }
  },
  smoke(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f;
    for (let i = 0; i <= n; i++) {
      const r = W[i] * (0.55 + 0.3 * nz(S.seed + f, i)) , cx = P[i][0] + nzs(S.seed + f, i + 9) * W[i] * 0.18, cy = P[i][1] + nzs(S.seed + f, i + 19) * W[i] * 0.18, al = 0.25 + 0.6 * i / n;
      const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r); g.addColorStop(0, rgba(S.pal[3], 0.85 * al)); g.addColorStop(0.65, rgba(S.pal[0], 0.7 * al)); g.addColorStop(1, rgba(S.pal[0], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(S.pal[1], 0.55 * al); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, -2.4 + i, -0.7 + i); ctx.stroke();
    }
    const { N } = bodyEdges(P, W);
    for (let k = 0; k < 5; k++) { const i = 1 + (k * 3) % Math.max(1, n), sd = k % 2 ? 1 : -1; ctx.strokeStyle = rgba(S.pal[1], 0.65); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.bezierCurveTo(P[i][0] + N[i][0] * sd * W[i] * 0.6, P[i][1] + N[i][1] * sd * W[i] * 0.6, P[i][0] + N[i][0] * sd * W[i] * 0.9 + 8 * Math.sin(f * 0.2 + k), P[i][1] + N[i][1] * sd * W[i] * 0.9 - 10, P[i][0] + N[i][0] * sd * W[i] * 1.0 + 14, P[i][1] + N[i][1] * sd * W[i] * 1.0 - 18); ctx.stroke(); }
    if (o.crack) { ctx.strokeStyle = rgba(S.pal[2], 0.9); ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const q = ptAt(P, nz(S.seed, k + 3)); ctx.beginPath(); ctx.moveTo(q[0], q[1]); for (let j = 1; j < 5; j++) ctx.lineTo(q[0] + nzs(S.seed, k * 7 + j) * 14 * j * 0.5, q[1] + nzs(S.seed, k * 7 + j + 2) * 14 * j * 0.5); ctx.stroke(); } }
    if (o.stars) for (let i = 0; i < 6; i++) { const q = ptAt(P, nz(S.seed, i + 60)); sparkle(ctx, q[0] + nzs(S.seed, i) * W[n] * 0.4, q[1] + nzs(S.seed, i + 7) * W[n] * 0.4, 2 + 3 * nz(S.seed + f, i), '#ffffff'); }
    if (o.lens) for (let i = 2; i <= n; i += 3) { ctx.strokeStyle = rgba(S.pal[1], 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(P[i][0], P[i][1], W[i] * 0.55, W[i] * 0.25, 0, 0, TAU); ctx.stroke(); }
  },
  beam(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f;
    ctx.save(); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 26 * S.big;
    const a = bodyEdges(P, W.map((v) => v * 1.2)); fillEdges(ctx, a.L, a.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0)], [1, rgba(S.pal[0], 0.5)]]));
    const b = bodyEdges(P, W); fillEdges(ctx, b.L, b.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[1], 0)], [0.4, rgba(S.pal[1], 0.75)], [1, rgba(S.pal[2], 0.95)]]));
    const c = bodyEdges(P, W.map((v) => v * 0.34)); fillEdges(ctx, c.L, c.R, rgba('#ffffff', 0.95)); ctx.restore();
    if (o.rings) for (let i = 1; i <= n; i += 3) { const nx = bodyEdges(P, W).N[i]; ctx.strokeStyle = rgba(S.pal[3], 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P[i][0] + nx[0] * W[i] * 0.7, P[i][1] + nx[1] * W[i] * 0.7); ctx.quadraticCurveTo(P[i][0] + (P[Math.min(n, i + 1)][0] - P[i][0]) * 2, P[i][1] + (P[Math.min(n, i + 1)][1] - P[i][1]) * 2, P[i][0] - nx[0] * W[i] * 0.7, P[i][1] - nx[1] * W[i] * 0.7); ctx.stroke(); }
    const t = P[n]; ctx.strokeStyle = rgba(S.pal[2], 0.8); ctx.lineWidth = 1.4;
    for (let k = 0; k < 10; k++) { const ang = k * TAU / 10 + f * 0.06, l = W[n] * (0.6 + 0.8 * nz(S.seed + f, k)); ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[0] + Math.cos(ang) * l, t[1] + Math.sin(ang) * l); ctx.stroke(); }
    for (let i = 0; i < 4; i++) { const q = ptAt(P, nz(S.seed, i + 11)); sparkle(ctx, q[0], q[1] + nzs(S.seed, i) * W[n] * 0.3, 3 + 4 * nz(S.seed + f, i), '#ffffff'); }
  },
  slash(ctx, P, W, S) {
    const n = P.length - 1, o = S.o, f = S.f;
    const g = bodyEdges(P, W); ctx.save(); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 14 * S.big;
    fillEdges(ctx, g.L, g.R, alongGradient(ctx, P[0], P[n], [[0, rgba(S.pal[0], 0)], [0.5, rgba(S.pal[0], 0.5)], [1, rgba(S.pal[1], 0.92)]])); ctx.restore();
    const c = bodyEdges(P, W.map((v) => v * 0.32)); fillEdges(ctx, c.L, c.R, alongGradient(ctx, P[0], P[n], [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,1)']]));
    ctx.strokeStyle = rgba('#ffffff', 0.95); ctx.lineWidth = 1.6; ctx.beginPath(); g.L.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    if (o.thread) for (let k = 0; k < 6; k++) { const fo = k / 5 - 0.5; ctx.strokeStyle = rgba(S.pal[1], 0.8); ctx.lineWidth = 1; ctx.beginPath(); P.forEach((p, i) => { const x = p[0] + g.N[i][0] * fo * W[i], y = p[1] + g.N[i][1] * fo * W[i]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); if (k % 2 === 0) { const q = ptAt(P, 0.3 + 0.1 * k); ctx.fillStyle = rgba('#ffffff', 0.9); ctx.beginPath(); ctx.arc(q[0] + g.N[Math.floor(n * 0.5)][0] * fo * W[Math.floor(n * 0.5)], q[1] + g.N[Math.floor(n * 0.5)][1] * fo * W[Math.floor(n * 0.5)], 2, 0, TAU); ctx.fill(); } }
    if (o.ghost) for (let k = 1; k <= 3; k++) { ctx.globalAlpha *= 0.5; ctx.fillStyle = rgba(S.pal[1], 0.25); ctx.beginPath(); ctx.ellipse(P[n][0] - k * 10, P[n][1], W[n] * 0.5, W[n] * 0.5, 0, 0, TAU); ctx.fill(); ctx.globalAlpha /= 0.5; }
  },
};

export function sparkle(ctx, x, y, r, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r); ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r); ctx.fill(); ctx.restore();
}

// ═══════════ IMPACT / ANTICIPATION ═══════════
export function burst(ctx, x, y, power, S) {
  const spikes = 9, R = 12 + power * 22, r0 = R * 0.28;
  ctx.save(); ctx.translate(x, y); ctx.shadowColor = S.pal[0]; ctx.shadowBlur = 20;
  ctx.fillStyle = rgba(S.pal[0], 0.55 * power + 0.2); ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = (i / (spikes * 2)) * TAU + S.seed * 0.01, rr = i % 2 ? r0 : R * (0.7 + 0.5 * nz(S.seed, i)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.fillStyle = rgba(S.pal[1], 0.85); ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = (i / (spikes * 2)) * TAU + 0.2, rr = i % 2 ? r0 * 0.6 : R * 0.5 * (0.7 + 0.5 * nz(S.seed, i + 30)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, R * 0.2, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(S.pal[2], 0.7 * power); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0, TAU); ctx.stroke(); ctx.restore();
}
function charge(ctx, x, y, k, S) {   // anticipation: element gathers into the limb during startup
  const R = 22 * (1 - k * 0.5) + 6;
  const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, rgba(S.pal[2], 0.9 * k)); g.addColorStop(0.5, rgba(S.pal[1], 0.5 * k)); g.addColorStop(1, rgba(S.pal[0], 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  for (let i = 0; i < 7; i++) { const a = nz(S.seed, i) * TAU, d = R * (1.7 - 1.3 * ((k * 1.2 + i * 0.13) % 1)); ctx.fillStyle = rgba(S.pal[1], 0.8 * k); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.6, 0, TAU); ctx.fill(); }
}

// ═══════════ VIZ → RIBBONS ═══════════
function ribbonOf(v) {
  switch (v.k) {
    case 'blade': { const s = v.segs[v.segs.length - 1]; if (!s) return null; const r = s.r; return { pts: [[s.x1, s.y1], [(s.x1 * 0.4 + s.x2 * 0.6), (s.y1 * 0.4 + s.y2 * 0.6)], [s.x2, s.y2]], ws: [r * 1.5, r * 2, r * 2], tipX: s.x2, tipY: s.y2 }; }
    case 'arc': { const w = v.pts.map((_, i, a) => v.r * 2 * (0.45 + 0.55 * i / (a.length - 1))); return { pts: v.pts, ws: w, tipX: v.pts[v.pts.length - 1][0], tipY: v.pts[v.pts.length - 1][1] }; }
    case 'col': { const sh = (v.yB - v.yT) * Math.tan(v.tilt || 0); return { pts: [[v.cx, v.yB], [v.cx + sh * 0.5, (v.yB + v.yT) / 2], [v.cx + sh, v.yT]], ws: [v.w, v.w, v.w * 0.92], tipX: v.cx + sh, tipY: v.yT }; }
    case 'gnd': return v.x1 - v.x0 > 1 ? { pts: [[v.x0, -v.h / 2 - v.lift], [(v.x0 + v.x1) / 2, -v.h / 2 - v.lift], [v.x1, -v.h / 2 - v.lift]], ws: [v.h, v.h, v.h], tipX: v.x1, tipY: -v.h / 2 } : null;
    case 'zone': return { pts: [[v.x0, (v.y0 + v.y1) / 2], [v.x1, (v.y0 + v.y1) / 2]], ws: [v.y1 - v.y0, v.y1 - v.y0], tipX: v.x1, tipY: (v.y0 + v.y1) / 2 };
    case 'ring': {
      if (v.bw) return { pts: [[v.x - v.bw / 2, v.y], [v.x + v.bw / 2, v.y]], ws: [v.bh, v.bh], tipX: v.x + v.bw / 2, tipY: v.y };
      const N = 28, pts = [], R = Math.max(2, v.R); for (let i = 0; i <= N; i++) { const a = (i / N) * TAU; pts.push([v.x + Math.cos(a) * R, v.y + Math.sin(a) * R * (v.sy || 1)]); }
      return { pts, ws: new Array(N + 1).fill(Math.max(6, R * 0.34)), ring: true, tipX: v.x + R, tipY: v.y };
    }
    case 'orb': { const tr = v.trail.map((p) => [p[0], p[1]]); if (tr.length < 2) return null; const r = v.r; return { pts: tr, ws: tr.map((_, i) => r * 2 * (0.35 + 0.65 * i / (tr.length - 1))), tipX: v.x, tipY: v.y, orb: true, r }; }
    case 'poly': return v.pts.length > 2 ? { poly: v.pts, tipX: v.pts[0][0], tipY: v.pts[0][1] } : null;
  }
  return null;
}

// ═══════════ PUBLIC ═══════════
// ctx is already translated to the fighter's feet and mirrored for facing (local coords).
//   viz: evalFx(m, tGeom).viz     t: the real frame (>= s+a  =>  fading afterglow)
export function paintViz(ctx, viz, m, t, o = {}) {
  const [s, a] = m.fr, last = s + a - 1, age = t - last;
  if (age > FADE || t < s - 14) return;
  const sk = skinOf(m.skin, m.col), seedBase = (hash(m.id.length * 977 + m.id.charCodeAt(m.id.length - 1) * 131 + m.charId.length * 7) * 4096) | 0;
  const S = { pal: sk.pal, o: sk, f: Math.floor(t), seed: seedBase + (m.slot === 'sp' ? 77 : 0), big: m.slot === 'sp' ? 1.5 : 1, col: m.col };
  const fade = age > 0 ? 1 - age / FADE : 1;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const order = { gnd: 0, zone: 1, col: 2, ring: 3, arc: 4, blade: 5, orb: 6, poly: 7 };
  const list = viz.slice().sort((x, y) => order[x.k] - order[y.k]);
  const painter = FAM[sk.fam] || FAM.streak;
  for (const v of list) {
    if (v.el && v.el.when === 'dive' && !o.dive) continue;
    if (v.el && v.el.when === 'land' && !o.landed) continue;
    if (v.eu <= 0.001 && t < s) continue;
    const R = ribbonOf(v); if (!R) continue;
    const solid = v.el && v.el.hit === false;
    ctx.save(); ctx.globalAlpha = clamp(fade * (solid ? 0.8 : 1) * (0.5 + 0.5 * Math.min(1, v.eu * 2.2)), 0, 1);
    if (R.poly) { ctx.fillStyle = rgba(S.pal[1], 0.7); ctx.beginPath(); R.poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); }
    else {
      const N = R.ring ? R.pts.length - 1 : Math.max(8, Math.min(22, Math.round(Math.hypot(R.pts[R.pts.length - 1][0] - R.pts[0][0], R.pts[R.pts.length - 1][1] - R.pts[0][1]) / 7)));
      const P = R.ring ? R.pts : resample(R.pts, N), W = wsAt(R.ws, N);
      if (R.ring) { const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, Math.max(2, v.R)); g.addColorStop(0, rgba(S.pal[2], 0.28)); g.addColorStop(0.7, rgba(S.pal[1], 0.2)); g.addColorStop(1, rgba(S.pal[0], 0.05)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(v.x, v.y, Math.max(2, v.R), Math.max(2, v.R) * (v.sy || 1), 0, 0, TAU); ctx.fill(); }
      painter(ctx, P, W, { ...S, f: S.f + (v.i || 0) * 3 });
      if (R.orb) { const ob = [[v.x - 0.01, v.y], [v.x + 0.01, v.y]]; painter(ctx, resample(ob, 2), [R.r * 2.2, R.r * 2.2, R.r * 2.2], { ...S, f: S.f + 5 }); }
    }
    ctx.restore();
    if (v.live && !solid && t <= last + 0.5 && v.eu > 0) { ctx.save(); ctx.globalAlpha = clamp(1 - (t - s) / Math.max(2, a * 0.9), 0.0, 1); burst(ctx, R.tipX, R.tipY, 0.5 + 0.5 * (m.slot === 'sp' ? 1 : 0.7), S); ctx.restore(); }
  }
  // anticipation charge at the striking anchor + telegraph marker
  if (t < s && m.fx[0]) {
    const k = clamp(1 - (s - t) / Math.max(3, s * 0.75));
    if (k > 0.05 && o.anchorPt) charge(ctx, o.anchorPt[0], o.anchorPt[1], k, S);
    if (m.tell && k > 0.1) { ctx.save(); ctx.strokeStyle = rgba(S.pal[1], 0.4 + 0.5 * k); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(m.tell[0], m.tell[1], 18, 8, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }
  ctx.restore();
}

// ═══════════ SUPER SCENES ═══════════
// Three acts, all deterministic:  buildup (aura, rising element, rotating rings, ground glow)  →
// stage flashes + radial speed lines + shock rings  →  finale (huge burst, debris, afterglow).
// `paintSuperBack` is drawn BEFORE the body (darkening + aura behind the fighter), `paintSuperFront` after.
function superStyle(m, t) {
  const sk = skinOf(m.skin, m.col); const [s, a] = m.fr;
  return { sk, pal: sk.pal, o: sk, seed: ((m.charId.length * 131 + m.charId.charCodeAt(m.charId.length - 1) * 17) | 0) + 500, f: Math.floor(t), big: 1.6, s, a, act: t < s ? 0 : t < s + a ? 1 : 2, k: t < s ? clamp(t / s) : 1 };
}
export function paintSuperBack(ctx, m, t) {
  const S = superStyle(m, t), [s, a, e] = m.fr; const T = s + a + e;
  if (t > T - 6 && S.act === 2) return;
  const darkIn = clamp(t / (s * 0.55)), darkOut = S.act === 2 ? 1 - clamp((t - s - a) / (e * 0.7)) : 1, dk = darkIn * darkOut;
  ctx.save();
  // spotlight darkening around the whole action (drawn behind the fighter)
  const g = ctx.createRadialGradient(60, -50, 40, 60, -50, 760); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, rgba(darken(S.pal[3], 0.55), 0.55 * dk));
  ctx.fillStyle = g; ctx.fillRect(-900, -760, 2400, 1000);
  // ground glow ellipse
  const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 90 + 40 * S.k); gl.addColorStop(0, rgba(S.pal[1], 0.65 * dk)); gl.addColorStop(1, rgba(S.pal[0], 0));
  ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0, 2, 90 + 40 * S.k, 16 + 6 * S.k, 0, 0, TAU); ctx.fill();
  // buildup: rotating rings + rising element column behind the body
  if (S.act < 2) for (let i = 0; i < 3; i++) {
    const r = 26 + i * 16 + 6 * Math.sin(t * 0.3 + i), ang = t * (0.09 + i * 0.03) * (i % 2 ? -1 : 1);
    ctx.save(); ctx.translate(0, -36); ctx.scale(1, 0.34); ctx.rotate(ang); ctx.strokeStyle = rgba(S.pal[i % 2 ? 1 : 0], (0.25 + 0.5 * S.k) * dk); ctx.lineWidth = 2.5 + i; ctx.setLineDash([10 + i * 4, 8]); ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
export function paintSuperFront(ctx, m, t, o = {}) {
  const S = superStyle(m, t), [s, a, e] = m.fr; const T = s + a + e;
  const painter = FAM[S.sk.fam] || FAM.streak;
  ctx.save(); ctx.lineCap = 'round';
  const aura = (k) => {                                                      // element column rising around the fighter
    for (let i = 0; i < 5; i++) {
      const x = -26 + i * 13 + nzs(S.seed, i) * 4, h = 60 + 70 * k * (0.6 + 0.4 * nz(S.seed + S.f, i));
      const P = [[x, 4], [x + nzs(S.seed + S.f, i + 9) * 6, -h * 0.5], [x + nzs(S.seed + S.f, i + 19) * 8, -h]];
      ctx.save(); ctx.globalAlpha = 0.55 * k; painter(ctx, resample(P, 8), wsAt([9, 12, 4], 8), { ...S, f: S.f + i * 5 }); ctx.restore();
    }
  };
  if (S.act === 0) {
    aura(S.k);
    if (S.k > 0.55) {                                                       // converging energy streaks (the "gathering" tell)
      for (let i = 0; i < 14; i++) { const a0 = nz(S.seed, i) * TAU, d = 140 * (1 - ((S.k - 0.55) * 2.2 + i * 0.07) % 1), x = Math.cos(a0) * d, y = -40 + Math.sin(a0) * d * 0.7;
        ctx.strokeStyle = rgba(S.pal[1], 0.8 * (S.k - 0.5)); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 0.86, -40 + (y + 40) * 0.86); ctx.stroke(); }
    }
    if (m.tell && S.k > 0.4) { ctx.strokeStyle = rgba(S.pal[1], 0.75); ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.ellipse(m.tell[0], m.tell[1], 22 + 10 * Math.sin(t * 0.5), 12, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (m.marks) for (const q of m.marks) if (S.k > 0.2) { ctx.strokeStyle = rgba(S.pal[2], 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q[0], q[1], 7 + 3 * Math.sin(t * 0.4 + q[0]), 0, TAU); ctx.stroke(); }
  } else if (S.act === 1) {
    aura(0.8);
    const u = clamp((t - s + 1) / a), stage = o.stage | 0, nS = (m.stages || [1]).length, sub = (u * nS) % 1;
    // radial speed lines + flash at the start of each stage
    const cx = 60 + stage * 24, cy = -52;
    for (let i = 0; i < 22; i++) { const ang = i * TAU / 22 + nz(S.seed, i) * 0.2, r0 = 40 + 50 * nz(S.seed + S.f, i), r1 = r0 + 90 + 150 * (1 - sub);
      ctx.strokeStyle = rgba(i % 3 ? S.pal[1] : '#ffffff', 0.55 * (1 - sub) + 0.15); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 * 0.7); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1 * 0.7); ctx.stroke(); }
    if (sub < 0.35) { const k = 1 - sub / 0.35; ctx.strokeStyle = rgba('#ffffff', 0.8 * k); ctx.lineWidth = 5 * k + 1; ctx.beginPath(); ctx.ellipse(cx, cy, 30 + 120 * (1 - k), (30 + 120 * (1 - k)) * 0.7, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = rgba(S.pal[0], 0.7 * k); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 20 + 150 * (1 - k), (20 + 150 * (1 - k)) * 0.7, 0, 0, TAU); ctx.stroke(); }
    if (stage === nS - 1) { const k = Math.max(0, 1 - sub * 1.4); ctx.fillStyle = rgba('#ffffff', 0.28 * k); ctx.fillRect(-900, -700, 2400, 900); burst(ctx, cx + 70, cy, 1.0 * k + 0.2, { ...S, seed: S.seed + 3 }); }
  } else {
    const age = t - (s + a - 1);                                            // finale afterglow: shock rings + falling debris
    if (age < 14) {
      for (let r = 0; r < 3; r++) { const k = clamp(age / 14 - r * 0.12); if (k <= 0) continue; ctx.strokeStyle = rgba(r ? S.pal[1] : '#ffffff', 0.7 * (1 - k)); ctx.lineWidth = 7 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(130, -4, 40 + 330 * k, (40 + 330 * k) * 0.16, 0, 0, TAU); ctx.stroke(); }
      for (let i = 0; i < 26; i++) { const k = clamp(age / 14), bx = 60 + nzs(S.seed, i) * 200, by = -30 - nz(S.seed, i + 30) * 110, fall = k * k * 90; ctx.fillStyle = rgba(i % 2 ? S.pal[1] : S.pal[0], 0.9 * (1 - k)); ctx.save(); ctx.translate(bx + nzs(S.seed, i + 60) * 30 * k, by + fall - 60 * (1 - k)); ctx.rotate(k * 6 * nzs(S.seed, i)); ctx.fillRect(-3, -2, 6, 4); ctx.restore(); }
    }
  }
  ctx.restore();
}
