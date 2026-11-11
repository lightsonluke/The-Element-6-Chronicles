// mvMove.js — evaluates one move at one frame.
//
//   pose(frame)  ->  solved joints (shared stickman rig)
//   effect elements are ANCHORED TO THOSE JOINTS and swept through sub-frame samples
//   the SAME geometry is returned twice:  `shapes` (collision)  and  `viz` (art).
//
// That is the whole fix for "hitbox does not match the animation": there is no second
// description of where the attack is.
import { sampleKeys, phaseCoord, solveLocal, anchor, limbAngle, clamp, lerp, EASE, D2R, capsule, box, circle, GUARD } from './mvCore.js';

export const SUBS = [-1, -0.75, -0.5, -0.25, 0];

// Per-evaluation context. Ground pounds (and any move with a held phase) pass an explicit phase coordinate.
const CTX = { pc: null, st: null };
export function poseAt(m, t) {
  return sampleKeys(m.keys, CTX.pc != null ? CTX.pc : phaseCoord(t, m.fr));
}
export function jointsAt(m, t, scale = 1) {
  return solveLocal(poseAt(m, t), scale);
}

// 0 at the instant before the first active frame, 1 on the last active frame
export function uAt(m, t) { return clamp((t - m.fr[0] + 1) / m.fr[1], 0, 1); }

const ease = (name, t) => (EASE[name] || EASE.out)(clamp(t));
const A = (v) => (Array.isArray(v) ? v : [v, v]);
const mix2 = (v, e) => lerp(A(v)[0], A(v)[1], e);

function resolvePoint(m, spec, t, sc) {
  // spec: anchor name | [x,y]
  if (Array.isArray(spec)) return [spec[0] * sc, spec[1] * sc];
  return anchor(jointsAt(m, t, sc), spec);
}

// ---- element evaluators -------------------------------------------------------------
// Each returns { shapes:[...], viz:{...}|null } for time t (fractional ok). `live` = element
// is inside its own active window (only live elements collide).
function evalBlade(m, el, t, sc, late) {
  const win = el.u || [0, 1];
  const shapes = [], segs = [];
  const u = uAt(m, t);
  for (const d of SUBS) {
    const tt = t + d - late;
    const uu = uAt(m, tt + late);
    const eu = clamp((uu - win[0]) / Math.max(1e-6, win[1] - win[0]));
    if (uu <= win[0] - 1e-6 && d !== 0) continue;
    const J = jointsAt(m, tt, sc);
    const P0 = anchor(J, el.a);
    let th = el.abs ? el.ang * D2R : limbAngle(J, el.a) + (el.ang || 0) * D2R;
    if (el.flipY) th = -th;
    const ee = ease(el.ease || 'out', eu);
    const L = mix2(el.len, ee) * sc, r = mix2(el.r, ee) * sc, f0 = (el.from || 0) * sc;
    // optional bend: tip curves by `bend` degrees over the length
    const bend = (el.bend || 0) * D2R;
    const c = Math.cos(th), s = Math.sin(th);
    const bx = P0[0] + c * f0, by = P0[1] + s * f0;
    if (!bend) {
      const tx = bx + c * L, ty = by + s * L;
      segs.push({ x1: bx, y1: by, x2: tx, y2: ty, r, eu });
      if (L > 1) shapes.push(capsule(bx, by, tx, ty, r));
    } else {
      let px = bx, py = by, ang = th; const n = 3;
      for (let i = 0; i < n; i++) {
        ang += bend / n; const nx = px + Math.cos(ang) * L / n, ny = py + Math.sin(ang) * L / n;
        segs.push({ x1: px, y1: py, x2: nx, y2: ny, r: r * (1 - i * 0.15), eu });
        if (L > 1) shapes.push(capsule(px, py, nx, ny, r * (1 - i * 0.15)));
        px = nx; py = ny;
      }
    }
  }
  const eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  return { shapes, viz: { k: 'blade', segs, eu, th: segs.length ? Math.atan2(segs[segs.length - 1].y2 - segs[segs.length - 1].y1, segs[segs.length - 1].x2 - segs[segs.length - 1].x1) : 0 } };
}

function evalArc(m, el, t, sc, late) {
  const win = el.u || [0, 1];
  const u = uAt(m, t - late), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const ee = ease(el.ease || 'io', eu);
  const J = jointsAt(m, t - late, sc);
  const C = resolvePoint(m, el.c || 'body', t - late, sc);
  const R = mix2(el.R, ee) * sc, r = mix2(el.r, ee) * sc;
  const dir = Math.sign(el.a1 - el.a0) || 1;
  const lead = lerp(el.a0, el.a1, ee), tail = lead - dir * (el.tail || 60);
  const tailC = dir > 0 ? Math.max(tail, el.a0 - 0) : Math.min(tail, el.a0 + 0);
  const shapes = [], pts = [];
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const a = lerp(tail, lead, i / N) * D2R;           // 0 = forward, + = up
    pts.push([C[0] + Math.cos(a) * R, C[1] - Math.sin(a) * R]);
  }
  if (u >= win[0] - 1e-6 && u <= 1.0001) for (let i = 0; i < N; i++) shapes.push(capsule(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r));
  return { shapes, viz: { k: 'arc', pts, r, eu, lead, tail, C, R } };
}

function evalCol(m, el, t, sc) {
  const win = el.u || [0, 1];
  const u = uAt(m, t), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const ee = ease(el.ease || 'out', eu);
  const cx = (el.cx || 0) * sc, w = mix2(el.w, ee) * sc, y0 = el.y0 * sc, y1 = el.y1 * sc;
  const top = lerp(y0, y1, ee);
  const bot = el.slide ? lerp(y0, lerp(y0, y1, 0.55), ee) : y0;
  const tilt = (el.tilt || 0) * D2R, tn = Math.tan(tilt);
  const yT = Math.min(top, bot), yB = Math.max(top, bot), h = yB - yT;
  const shapes = [];
  if (u >= win[0] - 1e-6 && h > 1) {
    if (!tilt) shapes.push(box(cx, (yT + yB) / 2, w, h));
    else {
      const sx = (yB - yT) * tn;
      shapes.push({ shape: 'polygon', points: [[cx - w / 2, yB], [cx + w / 2, yB], [cx + w / 2 + sx, yT], [cx - w / 2 + sx, yT]] });
    }
  }
  return { shapes, viz: { k: 'col', cx, w, yT, yB, tilt, eu, spin: el.spin || 0 } };
}

function evalGnd(m, el, t, sc) {
  const win = el.u || [0, 1];
  const u = uAt(m, t), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const ee = ease(el.ease || 'out', eu);
  const cx = (el.cx || 0) * sc, h = mix2(el.h, ee) * sc;
  const Lf = (el.side >= 0 ? mix2(el.L, ee) : 0) * sc, Lb = (el.side <= 0 ? mix2(el.L, ee) : 0) * sc;
  const x0 = cx - Lb, x1 = cx + Lf;
  const shapes = [];
  if (u >= win[0] - 1e-6 && x1 - x0 > 1) shapes.push(box((x0 + x1) / 2, -h / 2 - (el.lift || 0) * sc, x1 - x0, h));
  return { shapes, viz: { k: 'gnd', x0, x1, h, eu, lift: (el.lift || 0) * sc } };
}

function evalOrb(m, el, t, sc, late) {
  const win = el.u || [0, 1];
  const shapes = [], trail = [];
  const J0 = jointsAt(m, t - late, sc);
  const u = uAt(m, t - late), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  let cur = null, rr = 0;
  for (const d of SUBS) {
    const tt = t + d - late, uu = uAt(m, tt + late);
    const e = clamp((uu - win[0]) / Math.max(1e-6, win[1] - win[0]));
    const ee = ease(el.ease || 'io', e);
    const from = el.from ? resolvePoint(m, el.from, tt, sc) : [0, -35 * sc];
    let to;
    if (typeof el.to === 'function') to = el.to(ee, sc, from);
    else to = [el.to[0] * sc, el.to[1] * sc];
    // `via` bends the path (quadratic bezier control point)
    let x, y;
    if (el.via) { const v = [el.via[0] * sc, el.via[1] * sc]; x = (1 - ee) * (1 - ee) * from[0] + 2 * (1 - ee) * ee * v[0] + ee * ee * to[0]; y = (1 - ee) * (1 - ee) * from[1] + 2 * (1 - ee) * ee * v[1] + ee * ee * to[1]; }
    else if (typeof el.to === 'function') { x = to[0]; y = to[1]; }
    else { x = lerp(from[0], to[0], ee); y = lerp(from[1], to[1], ee); }
    rr = mix2(el.r, ee) * sc;
    trail.push([x, y, rr]);
    cur = [x, y];
  }
  if (u >= win[0] - 1e-6 && cur) {
    for (let i = 1; i < trail.length; i++) shapes.push(capsule(trail[i - 1][0], trail[i - 1][1], trail[i][0], trail[i][1], trail[i][2]));
    shapes.push(circle(cur[0], cur[1], rr));
  }
  return { shapes, viz: { k: 'orb', trail, x: cur ? cur[0] : 0, y: cur ? cur[1] : 0, r: rr, eu } };
}

function evalRing(m, el, t, sc, late) {
  const win = el.u || [0, 1];
  const u = uAt(m, t - late), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const ee = ease(el.ease || 'out', eu);
  const C = resolvePoint(m, el.c || [0, -35], t - late, sc);
  const R = mix2(el.R, ee) * sc;
  const shapes = [];
  if (u >= win[0] - 1e-6 && R > 1) {
    if (el.box) shapes.push(box(C[0], C[1], el.box[0] * sc * (0.4 + 0.6 * ee), el.box[1] * sc)); else shapes.push(circle(C[0], C[1], R));
  }
  return { shapes, viz: { k: 'ring', x: C[0], y: C[1], R, sy: el.sy || 1, eu, bw: el.box ? el.box[0] * sc : 0, bh: el.box ? el.box[1] * sc : 0 } };
}

function evalZone(m, el, t, sc) {
  const win = el.u || [0, 1];
  const u = uAt(m, t), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const ee = ease(el.ease || 'out', eu);
  let [x0, y0, x1, y1] = el.box.map((v) => v * sc);
  if (el.reveal === 'x') x1 = lerp(x0, x1, ee);
  if (el.reveal === 'x-') x0 = lerp(x1, x0, ee);
  if (el.reveal === 'y') y0 = lerp(y1, y0, ee);
  const shapes = [];
  if (u >= win[0] - 1e-6 && x1 - x0 > 1 && y1 - y0 > 1) shapes.push(box((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0));
  return { shapes, viz: { k: 'zone', x0, y0, x1, y1, eu } };
}

function evalPoly(m, el, t, sc) {
  const win = el.u || [0, 1];
  const u = uAt(m, t), eu = clamp((u - win[0]) / Math.max(1e-6, win[1] - win[0]));
  const pts = el.pts(ease(el.ease || 'out', eu), sc, jointsAt(m, t, sc));
  const shapes = u >= win[0] - 1e-6 && pts && pts.length >= 3 ? [{ shape: 'polygon', points: pts }] : [];
  return { shapes, viz: { k: 'poly', pts: pts || [], eu } };
}

const EVAL = { blade: evalBlade, arc: evalArc, col: evalCol, gnd: evalGnd, orb: evalOrb, ring: evalRing, zone: evalZone, poly: evalPoly };

// ---- public ---------------------------------------------------------------------------
// Returns every element's current geometry. `live` elements (hit:true and inside their u-window
// during the active frames) contribute collision shapes.
export function evalFx(m, t, sc = 1) {
  const [s, a] = m.fr;
  const inActive = t >= s && t < s + a;
  const late = (m.mods && m.mods[1] === '2') ? 1.2 : 0;
  const out = { shapes: [], viz: [] };
  for (let i = 0; i < m.fx.length; i++) {
    const el = m.fx[i];
    const fn = EVAL[el.k]; if (!fn) continue;
    const win = el.u || [0, 1];
    const u = uAt(m, t);
    const r = fn(m, el, t, sc, el.noLate ? 0 : late);
    const stt = CTX.st;
    const gated = !el.when || (stt && ((el.when === 'dive' && stt.dive) || (el.when === 'land' && stt.landed) || (el.when === 'counter' && stt.countered)));
    const live = gated && inActive && el.hit !== false && u > win[0] - 1e-6 && (u <= win[1] + 1 / Math.max(1, a) + 1e-6);
    const st = el.st || 0;
    if (live) for (const sh of r.shapes) { sh.st = st; sh.el = i; out.shapes.push(sh); }
    if (r.viz) { r.viz.i = i; r.viz.el = el; r.viz.st = st; r.viz.live = live; out.viz.push(r.viz); }
  }
  return out;
}

// Pose / joints / fx in one call (what the engine & the test sheets use)
export function evalMove(m, t, sc = 1, st = null) {
  CTX.pc = st && st.pc != null ? st.pc : null; CTX.st = st;
  try {
    const pose = poseAt(m, t);
    const J = solveLocal(pose, sc);
    const fx = evalFx(m, t, sc);
    return { pose, J, shapes: fx.shapes, viz: fx.viz };
  } finally { CTX.pc = null; CTX.st = null; }
}

// bounding box of the union of all collision shapes over the whole active window (local coords)
export function activeBounds(m, sc = 1) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const grow = (x, y, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  for (let f = m.fr[0]; f < m.fr[0] + m.fr[1]; f++) {
    for (const sh of evalFx(m, f, sc).shapes) {
      if (sh.shape === 'capsule') { grow(sh.x1, sh.y1, sh.r); grow(sh.x2, sh.y2, sh.r); }
      else if (sh.shape === 'circle') grow(sh.x, sh.y, sh.r);
      else if (sh.shape === 'box') { grow(sh.x - sh.w / 2, sh.y - sh.h / 2); grow(sh.x + sh.w / 2, sh.y + sh.h / 2); }
      else if (sh.shape === 'polygon') sh.points.forEach((p) => grow(p[0], p[1]));
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

export { GUARD };
