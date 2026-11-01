// mvCore.js — shared foundation of the Element 6 move engine.
//
// ONE source of truth per move:  frame -> authored pose -> solved joints -> effect geometry.
// The renderer paints the body from the same pose, the art is painted from the same geometry,
// and collision tests that same geometry. Nothing is approximated from `range` any more.
import { solvePose, BASE_SCALE } from './stickman.js';

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

// ── easing ────────────────────────────────────────────────────────────────
export const EASE = {
  lin: (t) => t,
  io: sstep,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  snap: (t) => 1 - Math.pow(1 - t, 3),
  back: (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

// ── pose authoring ────────────────────────────────────────────────────────
// Pose vector layout (identical to stickman.js):
//   [LEAN, HIP, FNX, FNY, FFX, FFY, HNX, HNY, HFX, HFY, HEAD]
// Authoring is in degrees / limb polar form so choreography reads like a drawing:
//   lean: torso lean (deg, + forward)      hip: hip height (s units, -1.05 = standing)
//   nf/ff: near/far foot  -> {a, l} angle from the hip (0 = forward, 90 = up, -90 = down) + length
//                            or [x, y] raw (x fwd of hip, y world: 0 = ground)
//   nh/fh: near/far hand  -> {a, l} angle from the shoulder (0 = fwd, 90 = up, 180 = back) + length
//                            or [x, y] raw relative to the shoulder
//   head: head tilt (deg)  rot: whole-body rotation about the hip (deg, + = tip forward)
//   dx, dy: root offset in s units
const GUARD_V = [0.07, -1.05, 0.40, 0, -0.26, 0, 0.42, 0.02, 0.26, 0.02, 0];
function footVec(f, hip, def) {
  if (!f) return def;
  if (Array.isArray(f)) return [f[0], f[1]];
  const a = f.a * D2R; return [Math.cos(a) * f.l, hip - Math.sin(a) * f.l];
}
function handVec(h, def) {
  if (!h) return def;
  if (Array.isArray(h)) return [h[0], h[1]];
  const a = h.a * D2R; return [Math.cos(a) * h.l, -Math.sin(a) * h.l];
}
export function P(o = {}) {
  const hip = o.hip ?? GUARD_V[1];
  const nf = footVec(o.nf, hip, [GUARD_V[2], GUARD_V[3]]);
  const ff = footVec(o.ff, hip, [GUARD_V[4], GUARD_V[5]]);
  const nh = handVec(o.nh, [GUARD_V[6], GUARD_V[7]]);
  const fh = handVec(o.fh, [GUARD_V[8], GUARD_V[9]]);
  return {
    v: [(o.lean ?? 4) * D2R, hip, nf[0], nf[1], ff[0], ff[1], nh[0], nh[1], fh[0], fh[1], (o.head ?? 0) * D2R],
    rot: (o.rot ?? 0) * D2R, dx: o.dx ?? 0, dy: o.dy ?? 0,
  };
}
export const GUARD = P({});

function mixPose(a, b, t) {
  const v = new Array(11);
  for (let i = 0; i < 11; i++) v[i] = lerp(a.v[i], b.v[i], t);
  return { v, rot: lerp(a.rot, b.rot, t), dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t) };
}

// Keys are placed in PHASE coordinates:   0 = move start, 1 = first active frame,
// 2 = first endlag frame, 3 = move end.  `e` is the easing used to ARRIVE at that key.
export function sampleKeys(keys, pc) {
  if (pc <= keys[0].at) return keys[0].p;
  for (let i = 1; i < keys.length; i++) {
    if (pc <= keys[i].at) {
      const a = keys[i - 1], b = keys[i];
      const t = clamp((pc - a.at) / Math.max(1e-6, b.at - a.at));
      return mixPose(a.p, b.p, (EASE[b.e || 'io'] || EASE.io)(t));
    }
  }
  return keys[keys.length - 1].p;
}

// frame -> phase coordinate (fractional frames allowed)
export function phaseCoord(t, fr) {
  const [s, a, e] = fr;
  if (t < s) return clamp(t / Math.max(1, s), 0, 1);
  if (t < s + a) return 1 + (t - s) / Math.max(1, a);
  return 2 + clamp((t - s - a) / Math.max(1, e), 0, 1);
}

// ── shared joint solver ───────────────────────────────────────────────────
// Local space: origin = feet, facing right (+x), y down. Mirrored by the caller.
const jointCache = new Map();
export function solveLocal(pose, scale = 1) {
  const key = pose.v.join(',') + '|' + pose.rot.toFixed(4) + '|' + pose.dx.toFixed(3) + '|' + pose.dy.toFixed(3) + '|' + scale;
  let J = jointCache.get(key);
  if (J) return J;
  J = solvePose({ s: BASE_SCALE * scale, frame: 0, state: 'attacking', facing: 1, motion: null, emoteVars: null,
    attack: null, gen1: null, choreo: { v: pose.v, rot: pose.rot, dx: pose.dx, dy: pose.dy, blend: 1 } });
  if (jointCache.size > 4000) jointCache.clear();
  jointCache.set(key, J);
  return J;
}

// Named anchors resolved from solved joints (all local px, facing right)
export function anchor(J, name) {
  switch (name) {
    case 'nh': return J.near.hand; case 'fh': return J.far.hand;
    case 'nf': return J.near.foot; case 'ff': return J.far.foot;
    case 'ne': return J.near.elbow; case 'fe': return J.far.elbow;
    case 'nk': return J.near.knee; case 'fk': return J.far.knee;
    case 'sh': return J.shoulder; case 'hip': return J.hip; case 'head': return J.head;
    case 'body': return [(J.hip[0] + J.shoulder[0]) / 2, (J.hip[1] + J.shoulder[1]) / 2];
    case 'feet': return [(J.near.foot[0] + J.far.foot[0]) / 2, Math.max(J.near.foot[1], J.far.foot[1])];
    case 'hands': return [(J.near.hand[0] + J.far.hand[0]) / 2, (J.near.hand[1] + J.far.hand[1]) / 2];
    default: return [0, -35];
  }
}
// direction of the limb that ends at the anchor (from its mid joint), in radians (screen, y down)
export function limbAngle(J, name) {
  const pairs = { nh: [J.near.elbow, J.near.hand], fh: [J.far.elbow, J.far.hand], nf: [J.near.knee, J.near.foot],
    ff: [J.far.knee, J.far.foot], ne: [J.near.shoulder, J.near.elbow], nk: [J.near.hip, J.near.knee] };
  const p = pairs[name]; if (!p) return 0;
  return Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
}

// ── deterministic noise (no Math.random in art/collision: replays & rollback stay identical) ──
export function hash(n) { n = Math.imul(n ^ (n >>> 15), 2246822507); n = Math.imul(n ^ (n >>> 13), 3266489909); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
export function rnd(seed, i = 0) { return hash((seed * 374761393 + i * 668265263) | 0); }

// ── shape helpers (same shapes hitboxIntersectsBody understands) ──
export const capsule = (x1, y1, x2, y2, r) => ({ shape: 'capsule', x1, y1, x2, y2, r });
export const box = (x, y, w, h) => ({ shape: 'box', x, y, w, h });       // centre x,y
export const circle = (x, y, r) => ({ shape: 'circle', x, y, r });
