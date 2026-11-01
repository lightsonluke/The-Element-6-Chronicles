// mvArtLib.js — colour math, ribbon geometry and the element "skin" table for the move art.
// Everything is deterministic (no Math.random) so replays / rollback netcode stay identical.
import { hash, TAU } from './mvCore.js';

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export function hexRgb(h) {
  if (!h || h[0] !== '#') return [255, 255, 255];
  let s = h.slice(1); if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgba = (h, a = 1) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${clamp01(a).toFixed(3)})`; };
export function mixHex(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
export const lighten = (h, t) => mixHex(h, '#ffffff', t);
export const darken = (h, t) => mixHex(h, '#000000', t);
export const nz = (seed, i) => hash((seed * 2654435761 + i * 40503) | 0);          // 0..1
export const nzs = (seed, i) => nz(seed, i) * 2 - 1;                               // -1..1

// ── ribbon geometry ───────────────────────────────────────────────────────
export function resample(pts, n) {
  if (pts.length < 2) return pts.slice();
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1] || 1, out = [];
  let j = 1;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * L;
    while (j < d.length - 1 && d[j] < t) j++;
    const a = pts[j - 1], b = pts[j], seg = d[j] - d[j - 1] || 1, u = (t - d[j - 1]) / seg;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
export function normalsOf(pts) {
  const N = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    N.push([-dy / l, dx / l]);
  }
  return N;
}
export function bodyEdges(pts, ws) {
  const N = normalsOf(pts), L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const h = (ws[i] || 0) / 2;
    L.push([pts[i][0] + N[i][0] * h, pts[i][1] + N[i][1] * h]);
    R.push([pts[i][0] - N[i][0] * h, pts[i][1] - N[i][1] * h]);
  }
  return { L, R, N };
}
export function fillEdges(ctx, L, R, fill) {
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
export function alongGradient(ctx, p0, p1, stops) {
  const g = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
  for (const [t, c] of stops) g.addColorStop(clamp01(t), c);
  return g;
}
export const ptAt = (pts, t) => { const f = clamp01(t) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; };

// ── skins ─────────────────────────────────────────────────────────────────
// fam = painter family; pal = [outer, mid, core, accent]
const SK = (fam, outer, mid, core, acc, o = {}) => ({ fam, pal: [outer, mid, core, acc], ...o });
export const SKINS = {
  fire: SK('flame', '#ff3d00', '#ff9a1a', '#fff3b0', '#ffcf40'),
  ember: SK('flame', '#ff5a24', '#ffa347', '#ffe8c0', '#ffcf40', { small: 1 }),
  fox: SK('flame', '#ff8a2a', '#ffd36a', '#fffbe6', '#6ad9ff', { cold: 1 }),
  spirit: SK('flame', '#c01800', '#ff7a6a', '#ffffff', '#ffd0d0', { wisp: 1 }),
  ice: SK('crystal', '#6fd0ff', '#bff0ff', '#ffffff', '#e8fbff'),
  glass: SK('crystal', '#8fdcff', '#d8f6ff', '#ffffff', '#ffffff', { clear: 1 }),
  airsolid: SK('crystal', '#b58cff', '#e8d8ff', '#ffffff', '#ffffff', { clear: 1 }),
  barrier: SK('crystal', '#3d6dff', '#9bb8ff', '#ffffff', '#cfe0ff', { hex: 1 }),
  bone: SK('crystal', '#cfc6a8', '#f1ecdc', '#ffffff', '#8a8268', { bone: 1 }),
  thunder: SK('bolt', '#ffd400', '#fff59a', '#ffffff', '#7fc8ff'),
  water: SK('liquid', '#2f8fe8', '#6cc4ff', '#e8faff', '#ffffff'),
  venom: SK('liquid', '#4f9f1a', '#a6e840', '#f3ffbf', '#2f6a0a', { drip: 1 }),
  blood: SK('liquid', '#9a0019', '#e0203f', '#ffc0c8', '#4a0010', { pulse: 1 }),
  potion: SK('liquid', '#c99410', '#f7d36a', '#fff7d0', '#8a5cff', { bubbles: 1 }),
  glue: SK('liquid', '#e0308e', '#ff8cd0', '#ffe0f2', '#a01868', { string: 1 }),
  morph: SK('liquid', '#2fbf9a', '#8ff0d8', '#ffffff', '#1a8a6a', { blob: 1 }),
  plant: SK('vine', '#2f9a3a', '#86d84e', '#e8ffc8', '#2a7a2a'),
  thorn: SK('vine', '#2d6a1b', '#7ab648', '#e0ffc0', '#6b4a22', { thorn: 1 }),
  life: SK('vine', '#38d27a', '#a8ffcf', '#ffffff', '#ffe27a', { petal: 1 }),
  growth: SK('vine', '#8a9400', '#d4de3a', '#fffbb0', '#5c6200', { swell: 1 }),
  stone: SK('rock', '#7a5a38', '#c2a173', '#efe0c4', '#4a3420'),
  sand: SK('rock', '#c9a24c', '#f2d58f', '#fff3cf', '#a7843c', { grain: 1 }),
  metal: SK('rock', '#8f9aa8', '#dfe6ee', '#ffffff', '#5a6470', { plate: 1 }),
  ash: SK('rock', '#6a6a6a', '#b8b8b8', '#f0f0f0', '#ff8a3a', { flake: 1 }),
  shatter: SK('rock', '#aa6633', '#d19060', '#ffe0c0', '#6a3a1a', { frag: 1 }),
  construct: SK('rock', '#c8102e', '#ff5a7a', '#ffd0d8', '#6a0a1c', { spear: 1 }),
  extract: SK('rock', '#b01a30', '#ff7a3a', '#ffe0a0', '#ffd34a', { spark: 1 }),
  wind: SK('streak', '#7fe8d8', '#d7fff8', '#ffffff', '#52c8b8'),
  mist: SK('streak', '#9fb0c4', '#dbe4ee', '#ffffff', '#7a8da4', { soft: 1 }),
  force: SK('streak', '#9a78ff', '#d5c4ff', '#ffffff', '#6a4fb3', { spiral: 1 }),
  psychic: SK('streak', '#ff4f9a', '#ffa6cf', '#ffffff', '#b0307a', { rings: 1 }),
  energy: SK('streak', '#ff5a5a', '#ffb0a0', '#ffffff', '#ffdd88', { plasma: 1, tint: 1 }),
  phase: SK('streak', '#2fc060', '#8ff0b0', '#ffffff', '#1a8a44', { ghost: 1 }),
  sound: SK('streak', '#ffb84a', '#fff0c0', '#ffffff', '#ff8a1a', { wave: 1 }),
  time: SK('streak', '#c4693a', '#f0b080', '#fff0e0', '#8a4a22', { ticks: 1 }),
  space: SK('streak', '#ff8800', '#ffc060', '#fff0d0', '#3a7aff', { portal: 1 }),
  gravity: SK('smoke', '#3a0072', '#8a4fd6', '#e0c8ff', '#1a0030', { lens: 1 }),
  shadow: SK('smoke', '#4a2c78', '#8a6ac0', '#dccff5', '#12061e'),
  void: SK('smoke', '#1a0630', '#7a3fb0', '#d7a8ff', '#000000', { crack: 1 }),
  dream: SK('smoke', '#8a54e8', '#d0aaff', '#ffffff', '#3a1a6a', { stars: 1 }),
  death: SK('smoke', '#5a4a7a', '#a99cc4', '#ece6f6', '#1e1630', { wisp: 1 }),
  drain: SK('smoke', '#aebcc2', '#e6eef0', '#ffffff', '#506870', { inward: 1 }),
  light: SK('beam', '#ffc82a', '#fff0a0', '#ffffff', '#ffb02e'),
  mercy: SK('beam', '#f0d8ff', '#ffd0ec', '#ffffff', '#ff99dd', { soft: 1 }),
  command: SK('beam', '#c9a040', '#ffe9a8', '#ffffff', '#8a6a20', { rings: 1 }),
  blade: SK('slash', '#cfd9e0', '#ffffff', '#ffffff', '#8aa0b0'),
  thread: SK('slash', '#c070ff', '#f0c8ff', '#ffffff', '#8a3fc0', { thread: 1 }),
  clone: SK('slash', '#ffbb33', '#ffe08a', '#ffffff', '#c98a10', { ghost: 1, tint: 1 }),
};
export function skinOf(name, col) {
  const s = SKINS[name] || SKINS.energy;
  if (!s.tint || !col) return s;
  return { ...s, pal: [mixHex(s.pal[0], col, 0.75), mixHex(s.pal[1], col, 0.4), s.pal[2], mixHex(s.pal[3], col, 0.5)] };
}
export { TAU };
