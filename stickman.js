// stickman.js — one procedural stickman rig shared by every fighter.
//
// Everything is drawn as flat 2D shapes on the existing articulated stickman rig.
// The base proportions stay stable while per-character hair, garments, shoes,
// blunt stump hands, and movement accents provide individual silhouettes.
//
// Pipeline:  solvePose()  ->  joint positions (already mirrored + scaled)
//            paintStickman() draws those joints
//            getLimbPose() in renderer.js reads the same joints for cosmetics
//
// Limbs are two-bone IK chains, so knees/elbows always bend the right way and
// feet stay planted while running.  "near" = the lead limb in the guard stance
// (screen-right when facing right), "far" = the rear limb.
import { getCharacterVisualStyle } from './characterVisuals.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const frac = (v) => v - Math.floor(v);

export const BASE_SCALE = 36;

// Proportions, in units of s (s = 36 * scale).  Standing height ≈ 70 px after BODY_K.
const P = {
  headR: 0.26, neckToHead: 0.27,
  thigh: 0.58, shin: 0.60,
  upper: 0.30, fore: 0.28,
  torso: 0.44,
  stand: 1.12,
  // limb radii (tapered: thick at the joint nearest the body)
  rThigh: 0.185, rKnee: 0.152, rFoot: 0.128,
  rShoulder: 0.152, rElbow: 0.130, rHandArm: 0.118, rHand: 0.142,
  rHip: 0.195, rChest: 0.172,
};

// Hurtbox that matches the new silhouette (world px at scale 1, relative to f.x / f.y = feet).
// Overall body size. Every pose is authored at full size, then the skeleton is scaled by BODY_K
// (limb thickness is NOT scaled), which makes the fighter shorter and stockier without changing any pose.
export const BODY_K = 0.92;
export const FIGHTER_HURTBOX = { w: 30, h: 70, centerY: -35 };

// Run cadence: a relaxed jog. The leg cycle is NOT locked to ground speed any more (that made
// fast characters flicker like a flash); it eases between a slow and a fast cadence instead.
const RUN_SLOW = TAU / 46;   // radians / frame at the lowest running speed  (~46 frames per stride)
const RUN_FAST = TAU / 30;   // radians / frame at top running speed         (~30 frames per stride)
const RUN_NOMEM = 0.15;      // fallback cadence when no animation memo is supplied

// ─── Pose vector layout ─────────────────────────────────────────────────────
// Every animation layer is a flat array so layers can be blended component-wise.
const LEAN = 0, HIP = 1, FNX = 2, FNY = 3, FFX = 4, FFY = 5, HNX = 6, HNY = 7, HFX = 8, HFY = 9, HEAD = 10;
const N = 11;
//  LEAN  torso lean (rad, + = forward)           HIP   hip height (y, negative = up)
//  F*    foot target (x rel. hip, y world: 0 = ground)   N=near/lead  F=far/rear
//  H*    hand target relative to the shoulder            HEAD  extra head tilt

const mix = (a, b, t) => { if (t <= 0) return a; const o = new Array(N); for (let i = 0; i < N; i++) o[i] = lerp(a[i], b[i], t); return o; };

// ─── Two-bone IK ────────────────────────────────────────────────────────────
// side = +1 puts the middle joint on the (-dy, dx) side of the chord (natural elbow),
// side = -1 on the opposite side (natural knee).
function ik(px, py, tx, ty, l1, l2, side) {
  const dx = tx - px, dy = ty - py;
  const d = Math.hypot(dx, dy) || 1e-6;
  const dc = clamp(d, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.9995);
  const ux = dx / d, uy = dy / d;
  const a = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return {
    mid: [px + ux * a - uy * side * h, py + uy * a + ux * side * h],
    end: [px + ux * dc, py + uy * dc],
  };
}

// ─── Base locomotion layers ────────────────────────────────────────────────
function idleV(frame) {
  // Relaxed stance: upright, feet about shoulder-width, arms hanging loose, slow breathing and a
  // gentle weight shift. Nothing here looks like a wind-up for a sprint.
  const br = Math.sin(frame * 0.045), sh = Math.sin(frame * 0.021 + 0.8);
  return [0.025 + 0.006 * br, -P.stand + 0.012 * br,
    0.15 + 0.012 * sh, 0, -0.15 + 0.012 * sh, 0,
    0.11 + 0.012 * sh, 0.52 - 0.012 * br, -0.07 - 0.012 * sh, 0.53 - 0.012 * br,
    0.02 * sh];
}

function legFoot(c, amp) {
  const D = 0.46, rf = 0.40 * amp, rb = 0.44 * amp, lift = 0.52 * amp;
  if (c < D) return [lerp(rf, -rb, c / D), 0];                 // stance: foot glued to ground
  const t = (c - D) / (1 - D);                                  // swing: heel kick, knee drive
  return [lerp(-rb, rf, sstep(t)), -lift * Math.sin(Math.PI * Math.pow(t, 0.8))];
}

function runV(u, amp) {
  const fn = legFoot(frac(u), amp), ff = legFoot(frac(u + 0.5), amp);
  const hip = -1.09 + 0.032 * amp * Math.cos(2 * TAU * (u - 0.23));   // bounce, lowest mid-stance
  const A = 1.25 * amp, cs = Math.cos(TAU * u - 0.3);
  const arm = (th) => {                                             // forward-flexed elbow, pumping
    const bend = 1.30 + 0.15 * (th / (A || 1));
    const ex = Math.sin(th) * P.upper, ey = Math.cos(th) * P.upper;
    return [ex + Math.sin(th + bend) * P.fore, ey + Math.cos(th + bend) * P.fore];
  };
  const hn = arm(-A * cs), hf = arm(A * cs);
  return [0.24 * amp + 0.04 + 0.025 * Math.sin(2 * TAU * u), hip,
    fn[0], fn[1], ff[0], ff[1], hn[0], hn[1], hf[0], hf[1], 0.10 * amp];
}

// ── Jump: takeoff stretch → rising drive → apex tuck → falling reach ──────────
//          LEAN   HIP    FNX    FNY    FFX    FFY    HNX    HNY    HFX    HFY    HEAD
const AIR_STRETCH = [-0.03, -1.15,  0.07,  0.00, -0.12,  0.00,  0.20, -0.50, -0.06, -0.54, -0.06];
const AIR_RISE    = [ 0.08, -1.08,  0.30, -0.34, -0.36, -0.10,  0.22, -0.52, -0.30, -0.24, -0.04];
const AIR_APEX    = [ 0.14, -0.96,  0.36, -0.58, -0.08, -0.54,  0.42, -0.10, -0.38, -0.14,  0.05];
const AIR_FALL    = [ 0.00, -1.10,  0.22,  0.00, -0.26, -0.06,  0.36, -0.44, -0.38, -0.36, -0.04];
function airV(j, airT, launched, vxRel) {
  let V = j < 0 ? mix(AIR_APEX, AIR_RISE, -j) : mix(AIR_APEX, AIR_FALL, j);
  if (launched) {                                         // leaving the ground: body fully extended
    const tk = (1 - sstep(airT / 9)) * (1 - sstep((j + 0.15) / 0.5));
    V = mix(V, AIR_STRETCH, tk);
  }
  V = V.slice();
  V[LEAN] += clamp(vxRel, -6, 6) * 0.010;                // lean into the direction of travel
  return V;
}

const CROUCH_V = [0.16, -0.70, 0.46, 0, -0.36, 0, 0.30, 0.14, 0.18, 0.22, 0];

// ── Stun: dazed wobble (stands, knees buckled, head lolling, arms limp) ──
function stunV(t) {
  const ph = t * 0.10, a = Math.sin(ph), b = Math.sin(ph * 0.5 + 1.1), c = Math.sin(ph + 1.3);
  return [0.10 + 0.15 * a, -1.00 + 0.012 * Math.sin(ph * 2), 0.25 + 0.04 * b, 0, -0.25 - 0.04 * b, -0.07 * Math.max(0, a),
    0.12 + 0.13 * a, 0.50, -0.06 + 0.13 * c, 0.52, 0.22 + 0.18 * a];
}

// ── Knockback: one reaction per direction, blended by the real launch vector ──
// PEAK = the instant of impact, HOLD = the settled pose while still flying.
// (x is forward-relative: + = toward where the fighter is facing)
const KB = {
  // knocked BACKWARD (hit from the front): chest out, head snapped back, legs thrown out in front,
  // arms flung up and back
  back: {
    peak: [-0.62, -0.90, 0.58, -0.30, 0.34, -0.14, -0.10, -0.54, -0.34, -0.46, -0.45],
    hold: [-0.46, -0.92, 0.52, -0.26, 0.28, -0.12, -0.04, -0.50, -0.28, -0.44, -0.32],
  },
  // knocked FORWARD (hit from behind): pitched over, head up and forward, legs kicked out behind,
  // arms thrown forward to catch the fall
  fwd: {
    peak: [0.62, -0.94, -0.38, -0.34, -0.56, -0.16, 0.50, 0.10, 0.36, 0.30, 0.40],
    hold: [0.48, -0.96, -0.30, -0.30, -0.50, -0.14, 0.46, 0.14, 0.32, 0.30, 0.30],
  },
  // launched UP: body stretched tall, back arched, arms straight overhead, legs hanging limp
  up: {
    peak: [-0.22, -1.12, 0.10, 0.00, -0.12, 0.00, 0.16, -0.56, -0.18, -0.56, -0.38],
    hold: [-0.12, -1.06, 0.26, -0.20, -0.14, -0.26, 0.24, -0.50, -0.26, -0.50, -0.24],
  },
  // spiked DOWN: folded over the hit, legs whipped up behind, arms up shielding the head
  down: {
    peak: [0.66, -0.84, -0.46, -0.72, -0.62, -0.60, 0.32, -0.44, 0.18, -0.48, 0.40],
    hold: [0.56, -0.88, -0.38, -0.64, -0.54, -0.52, 0.30, -0.44, 0.18, -0.46, 0.34],
  },
};
// Feet planted and skidding when the hit doesn't lift the fighter off the ground
const SKID = { back: [0.46, -0.18], fwd: [0.52, -0.10] };

function hitV(rx, ry, mag, t, grounded, hitSide = 0) {
  const nx = rx / (mag || 1), ny = ry / (mag || 1);       // unit launch direction (forward-relative, up = +)
  const wt = {
    back: Math.pow(Math.max(0, -nx), 2), fwd: Math.pow(Math.max(0, nx), 2),
    up: Math.pow(Math.max(0, ny), 2), down: Math.pow(Math.max(0, -ny), 2),
  };
  const sum = wt.back + wt.fwd + wt.up + wt.down || 1;
  const impact = 0.35 + 0.65 * Math.exp(-t / 9);            // snap hard, then settle into the pose
  const I = clamp(0.75 + mag / 10, 0.75, 1.25);
  const out = new Array(N).fill(0);
  for (const k in wt) {
    const p = mix(KB[k].hold, KB[k].peak, impact), w = wt[k] / sum;
    for (let i = 0; i < N; i++) out[i] += p[i] * w;
  }
  out[LEAN] *= I; out[HEAD] *= I;
  // A separate side-impact reaction: a hit landing on the back twists the
  // shoulders away from the impact and tucks the arms in protectively. The
  // sign is supplied by the hit source when available; otherwise the existing
  // launch-vector reaction remains the backward-compatible fallback.
  if (Math.abs(hitSide) > 0.01 && Math.abs(nx) > 0.18) {
    const side = Math.sign(hitSide);
    const sideWeight = clamp(Math.abs(hitSide), 0, 1) * (0.35 + 0.65 * Math.exp(-t / 10));
    out[LEAN] += side * 0.16 * sideWeight;
    out[HEAD] += side * 0.24 * sideWeight;
    out[HNX] += side * 0.22 * sideWeight;
    out[HFX] += side * 0.14 * sideWeight;
    out[HNY] = lerp(out[HNY], 0.22, 0.30 * sideWeight);
    out[HFY] = lerp(out[HFY], 0.28, 0.30 * sideWeight);
  }
  if (grounded && ny < 0.65) {                              // stagger / skid instead of flying
    const gw = clamp((wt.back + wt.fwd) / sum, 0, 1);
    const sk = wt.fwd > wt.back ? SKID.fwd : SKID.back;
    out[FNX] = lerp(out[FNX], sk[0], gw); out[FNY] = lerp(out[FNY], 0, gw);
    out[FFX] = lerp(out[FFX], sk[1], gw); out[FFY] = lerp(out[FFY], 0, gw);
    out[HIP] += 0.05 * gw;
  }
  return out;
}

// ── Dash: ground burst + 4-direction air dash ───────────────────────────────
//          LEAN   HIP    FNX    FNY    FFX    FFY    HNX    HNY    HFX    HFY    HEAD
const DASH_GROUND = [
  [0.00, [0.26, -0.86, 0.34,  0.00, -0.34,  0.00,  0.28,  0.22,  0.06,  0.30,  0.06]],  // coil
  [0.18, [0.58, -0.96, 0.66, -0.28, -0.68, -0.08, -0.42,  0.30, -0.52,  0.12,  0.10]],  // drive, lead knee up
  [0.50, [0.54, -0.96, 0.56, -0.05, -0.70, -0.32, -0.46,  0.26, -0.50,  0.16,  0.10]],  // stride, trailing heel up
  [0.78, [0.30, -0.98, 0.58,  0.00, -0.30,  0.00, -0.06,  0.34, -0.20,  0.38,  0.04]],  // brake, lead foot out
  [1.00, [0.06, -1.04, 0.30,  0.00, -0.22,  0.00,  0.12,  0.50, -0.06,  0.52,  0.00]],  // settle
];

// Air dash: the whole body lines up with the dash direction. (ux,uy) = unit direction, screen space,
// x forward / y down.  Legs trail behind, arms sweep back for sideways dashes and lead for up/down.
function airDashV(ux, uy, p) {
  const lam = Math.atan2(ux, -uy);
  const vert = sstep((Math.abs(uy) - 0.45) / 0.45);          // 0 = sideways, 1 = straight up / down
  const px = -uy, py = ux;                                    // perpendicular to the dash direction
  const hipY = -1.0;
  const wob = Math.sin(p * Math.PI * 3) * 0.05;               // slight scissor of the legs in flight
  const L1 = 1.04, L2 = 0.80;
  const foot = (L, side) => [-ux * L + px * (side + wob), hipY - uy * L + py * (side + wob)];
  const fn = foot(L1, 0.10), ff = foot(L2, -0.16);
  const A = lerp(-1, 1, vert), la = 0.52;                     // -1 = arms trail, +1 = arms lead
  const hn = [ux * A * la + px * 0.10, uy * A * la + py * 0.10];
  const hf = [ux * A * la * 0.92 - px * 0.12, uy * A * la * 0.92 - py * 0.12];
  return [lam, hipY, fn[0], fn[1], ff[0], ff[1], hn[0], hn[1], hf[0], hf[1], lam * 0.42];
}

// ── Wall slide: pressed to the wall, hands gripping high, legs dangling, slow friction shudder ──
function wallV(frame) {
  const sl = Math.sin(frame * 0.55), sl2 = Math.sin(frame * 0.55 + 1.6);
  return [-0.10, -1.10,
    0.07, -0.02, -0.30, -0.10,
    0.35, -0.54 + 0.012 * sl, 0.34, -0.26 + 0.012 * sl2,
    0.10];
}

// ─── Attack layer ───────────────────────────────────────────────────────────
function keyframes(p, frames) {
  p = clamp(p, 0, 1);
  for (let i = 1; i < frames.length; i++) {
    if (p <= frames[i][0]) {
      const a = frames[i - 1], b = frames[i];
      const t = sstep((p - a[0]) / Math.max(1e-6, b[0] - a[0]));
      return a[1].map((v, k) => lerp(v, b[1][k], t));
    }
  }
  return frames[frames.length - 1][1].slice();
}

const GUARD = [0.07, -1.05, 0.40, 0, -0.26, 0, 0.42, 0.02, 0.26, 0.02, 0];

function attackKind(a) {
  if (a.isSuper) return 'super';
  const st = a.sigType, ty = a.type;
  if (st === 'down' || st === 'downNormal' || ty === 'downNormal') return (a.isNormal || st === 'downNormal') ? 'lowkick' : 'slam';
  if (st === 'aerial' || ty === 'aerialNormal') return a.isNormal ? 'airkick' : 'up';
  if (st === 'up') return 'up';
  return 'side';
}

function attackV(a, frame, h) {
  const kind = attackKind(a);
  const p = Math.max(0, Number(a.progress) || 0);
  if (a.holding || a.state === 'attackHold') {                // charging a heavy: coil back
    const hp = clamp(Number(a.holdProgress) || 0, 0, 1);
    const tr = Math.sin(frame * 1.3) * 0.006 * hp;
    return { v: [-0.14 - 0.06 * hp, -0.92 - 0.05 * hp + tr, 0.34, 0, -0.42, 0, -0.05, 0.14, 0.26, 0.0, 0.1], w: 1, legs: true };
  }
  let w = sstep(p / 0.10) * (1 - sstep((p - 0.86) / 0.14));
  switch (kind) {
    case 'super': {
      const q = frame * 0.55, sn = Math.sin(q);
      return { v: [0.22 + 0.04 * Math.sin(q * 0.5), -0.94 + 0.012 * sn, 0.55, 0, -0.42, 0,
        0.36 + 0.17 * sn, 0.02 - 0.05 * sn, 0.36 - 0.17 * sn, 0.02 + 0.05 * sn, 0.1],
        w: sstep(p / 0.08) * (1 - sstep((p - 0.9) / 0.1)) || (a.progress == null ? 1 : 0), legs: true };
    }
    case 'up':
      return { v: keyframes(p, [[0, GUARD],
        [0.22, [-0.04, -0.78, 0.34, 0, -0.30, 0, 0.20, 0.22, 0.22, 0.05, 0]],
        [0.42, [0.02, -1.07, 0.24, -0.10, -0.14, -0.06, 0.12, -0.60, 0.18, -0.04, -0.1]],
        [0.66, [0.02, -1.07, 0.24, -0.10, -0.14, -0.06, 0.12, -0.60, 0.18, -0.04, -0.1]],
        [1, GUARD]]), w, legs: true };
    case 'lowkick':
      return { v: keyframes(p, [[0, GUARD],
        [0.25, [-0.06, -0.96, 0.22, -0.42, -0.30, 0, 0.34, -0.14, -0.26, 0.26, 0]],
        [0.42, [-0.20, -0.88, 0.84, -0.05, -0.34, 0, 0.30, -0.20, -0.38, 0.10, 0]],
        [0.64, [-0.20, -0.88, 0.82, -0.05, -0.34, 0, 0.30, -0.20, -0.38, 0.10, 0]],
        [1, GUARD]]), w, legs: true };
    case 'slam':
      return { v: keyframes(p, [[0, GUARD],
        [0.22, [-0.10, -0.90, 0.30, 0, -0.30, 0, 0.12, -0.40, 0.12, -0.38, 0]],
        [0.42, [0.38, -0.72, 0.62, 0, -0.46, 0, 0.30, 0.42, 0.26, 0.44, 0.1]],
        [0.66, [0.38, -0.72, 0.62, 0, -0.46, 0, 0.30, 0.42, 0.26, 0.44, 0.1]],
        [1, GUARD]]), w, legs: true };
    case 'airkick':
      return { v: keyframes(p, [[0, GUARD],
        [0.22, [-0.02, -1.0, 0.25, -0.42, -0.25, -0.20, 0.32, -0.18, -0.34, -0.05, 0]],
        [0.42, [-0.22, -1.0, 0.86, -0.40, -0.30, -0.18, 0.30, -0.20, -0.38, -0.05, 0]],
        [0.66, [-0.22, -1.0, 0.86, -0.40, -0.30, -0.18, 0.30, -0.20, -0.38, -0.05, 0]],
        [1, GUARD]]), w, legs: true };
    default: // 'side' punch / jab / heavy
      return { v: keyframes(p, [[0, GUARD],
        [0.20, [-0.10 * h, -0.98, 0.30, 0, -0.40, 0, 0.02, 0.12, 0.26, 0.0, 0.1]],
        [0.38, [0.34 * h, -0.95, 0.62, 0, -0.44, 0, 0.62, -0.04, 0.20, 0.04, 0.1]],
        [0.58, [0.30 * h, -0.96, 0.60, 0, -0.44, 0, 0.60, -0.03, 0.22, 0.04, 0.1]],
        [1, GUARD]]), w, legs: true };
  }
}

// ─── Solver ─────────────────────────────────────────────────────────────────
// o: { s, frame, state, facing, motion:{vx,vy,grounded,memo}, emoteVars, attack, gen1 }
export function solvePose(o) {
  const s = o.s, frame = o.frame || 0, state = o.state || 'idle';
  let facing = o.facing < 0 ? -1 : 1;
  const motion = o.motion || null, memo = motion?.memo || null;
  const vx = Number(motion?.vx) || 0, vy = Number(motion?.vy) || 0;
  const grounded = motion && motion.grounded !== undefined ? !!motion.grounded : state !== 'jumping';
  const attackState = state === 'attacking' || state === 'attackHold' || state === 'superAttack';
  const ev = o.emoteVars || null;
  const visualStyle = getCharacterVisualStyle(o.charData);
  const dashTimer = Number(motion?.dashTimer) || 0;
  const dashDir = motion?.dashDir || null;               // world-space {x,y}, y < 0 = up
  const wallSide = Number(motion?.wallSide) || 0;        // fighter.js convention: -1 = wall on the right, +1 = on the left
  const tDash = dashTimer > 0 && dashDir && (dashDir.x || dashDir.y) ? 1 : 0;
  const tWall = motion?.wallSlide && wallSide && !grounded && !attackState && !ev && !tDash ? 1 : 0;
  if (tWall) facing = -wallSide;                         // turn to face the wall you are gripping

  // Layer targets
  const tRun = state === 'moving' && grounded && !tDash ? 1 : 0;
  const tAir = grounded ? 0 : 1;
  const tHit = state === 'hitstun' ? 1 : 0;
  const tCr = state === 'crouching' ? 1 : 0;

  let wRun = tRun, wAir = tAir, wHit = tHit, wCr = tCr, dip = 0, runPh = frame * RUN_NOMEM;
  let wDash = tDash, wWall = tWall, dashP = 0, dashAir = !grounded;
  let airT = 99, launched = false;
  let kbx = vx * facing, kby = -vy, kbm = Math.hypot(vx, vy), hitT = 8, hitSide = Number(motion?.hitSide) || 0;
  if (memo) {
    if (memo.lastFrame !== frame) {                    // advance exactly once per sim frame (pause-safe)
      memo.lastFrame = frame;
      const first = memo.wRun === undefined;
      memo.wRun = first ? tRun : lerp(memo.wRun, tRun, 0.18);   // slower blend = smoother idle <-> run
      memo.wAir = first ? tAir : lerp(memo.wAir, tAir, 0.40);
      memo.wHit = first ? tHit : lerp(memo.wHit, tHit, 0.50);
      memo.wCr = first ? tCr : lerp(memo.wCr, tCr, 0.35);
      memo.wDash = first ? tDash : lerp(memo.wDash, tDash, tDash ? 0.55 : 0.30);
      memo.wWall = first ? tWall : lerp(memo.wWall, tWall, tWall ? 0.35 : 0.30);
      if (tDash) {                                       // dash progress from the game's own countdown timer
        if (dashTimer > (memo.prevDash || 0)) { memo.dashMax = dashTimer; memo.dashAir = !grounded; }
        memo.dashP = clamp(1 - dashTimer / (memo.dashMax || dashTimer), 0, 1);
      }
      memo.prevDash = dashTimer;
      if (memo.prevAir && !tAir) memo.dip = 1;         // landing squash
      memo.dip = (memo.dip || 0) * 0.88;
      // run cadence: eased toward a speed-dependent rate, capped so it never "flashes"
      if (tRun) {
        const sp = motion.vx === undefined ? 4 : Math.abs(vx);
        const target = lerp(RUN_SLOW, RUN_FAST, clamp((sp - 1.2) / 4.5, 0, 1));
        memo.rate = lerp(memo.rate || RUN_SLOW, target, 0.08);
        memo.run = (memo.run || 0) + memo.rate;
      }
      // jump phase: frames since leaving the ground; a sudden upward kick (double jump) restarts it
      if (tAir) {
        if (!memo.prevAir) { memo.airT = 0; memo.launched = vy < -3; }
        else {
          memo.airT = (memo.airT || 0) + 1;
          if (vy < (memo.prevVy ?? vy) - 4) { memo.airT = 0; memo.launched = true; }
        }
      } else { memo.airT = 99; memo.launched = false; }
      memo.prevAir = !!tAir; memo.prevVy = vy;
      // knockback: remember the launch direction at the moment of impact
      if (tHit) {
        const m = Math.hypot(vx, vy);
        const jump = Math.hypot(vx - (memo.pvx || 0), vy - (memo.pvy || 0));   // gravity/friction change slowly; a new hit changes v abruptly
        if (!memo.inHit || jump > 2.5) { memo.kbx = vx * facing; memo.kby = -vy; memo.kbm = m; memo.hitT = 0; memo.hitSide = Number(motion?.hitSide) || 0; }
        else memo.hitT = (memo.hitT || 0) + 1;
        memo.inHit = true;
      } else { memo.inHit = false; memo.kbm = 0; }
      memo.pvx = vx; memo.pvy = vy;
    }
    wRun = memo.wRun; wAir = memo.wAir; wHit = memo.wHit; wCr = memo.wCr; dip = memo.dip || 0;
    wDash = memo.wDash; wWall = memo.wWall; dashP = memo.dashP || 0; dashAir = !!memo.dashAir;
    runPh = memo.run || 0; airT = memo.airT ?? 99; launched = !!memo.launched;
    if (memo.inHit) { kbx = memo.kbx; kby = memo.kby; kbm = memo.kbm; hitT = memo.hitT || 0; hitSide = Number(memo.hitSide) || 0; }
  }

  if (!memo && tDash) { const mx = grounded ? 13 : 15; dashP = clamp(1 - dashTimer / mx, 0, 1); }
  const amp = motion && motion.vx !== undefined ? lerp(0.70, 1, clamp((Math.abs(vx) - 1) / 4, 0, 1)) : 1;

  // Base pose = idle blended with run / air / crouch / hit
  let V = idleV(frame);
  if (wRun > 0.001) V = mix(V, runV(runPh / TAU, amp), wRun);
  if (wAir > 0.001) V = mix(V, airV(clamp(vy / 12, -1, 1), airT, launched, vx * facing), wAir);
  if (wCr > 0.001) V = mix(V, CROUCH_V, wCr);
  if (wHit > 0.001) {
    // tiny launch speed = frozen / shocked / dazed → wobble; otherwise a directional knockback pose
    const stunW = 1 - sstep((kbm - 0.8) / 1.4);
    let H = hitV(kbx, kby, Math.max(kbm, 1e-3), hitT, grounded, hitSide);
    if (stunW > 0.001) H = mix(H, stunV(memo ? hitT : frame), stunW);
    V = mix(V, H, wHit);
  }
  if (dip > 0.01) { V = V.slice(); V[HIP] += dip * 0.17; V[LEAN] += dip * 0.12; V[FNX] += dip * 0.06; V[FFX] -= dip * 0.06; }

  // Dash layer
  let dashEnv = 0, dux = 1, duy = 0;
  if (wDash > 0.001 && dashDir) {
    const dxr = (Number(dashDir.x) || 0) * facing, dyr = Number(dashDir.y) || 0;
    const dl = Math.hypot(dxr, dyr) || 1;
    dux = dxr / dl; duy = dyr / dl;
    if (dashAir) {
      dashEnv = sstep(dashP / 0.12) * (1 - sstep((dashP - 0.78) / 0.22));
      V = mix(V, airDashV(dux, duy, dashP), clamp(wDash * dashEnv, 0, 1));
    } else {
      dashEnv = sstep(dashP / 0.2) * (1 - sstep((dashP - 0.85) / 0.15));
      V = mix(V, keyframes(dashP, DASH_GROUND), wDash);
    }
  }
  // Wall-slide layer
  if (wWall > 0.001) V = mix(V, wallV(frame), wWall);

  // Attack layer (skipped while an emote plays)
  if (!ev && attackState && o.attack) {
    const a = o.attack;
    const hv = a.isHeavy ? 1.25 : 1;
    const at = attackV({ ...a, state }, frame, hv);
    let aw = clamp(at.w, 0, 1);
    if (memo) { memo.aw = lerp(memo.aw || 0, aw, 0.6); aw = memo.aw; }
    if (aw > 0.001) {
      const m = at.v.slice();
      if (!at.legs) for (const i of [FNX, FNY, FFX, FFY]) m[i] = V[i];
      V = mix(V, m, aw);
    }
  } else if (memo) memo.aw = 0;

  // Authored per-character attack pose (Gen I) only nudges lean/bob so every character
  // keeps the identical limb design.
  const g1 = o.gen1;
  if (g1 && attackState) {
    V = V.slice();
    V[LEAN] += (g1.lean || 0) * facing;
    V[HIP] += (g1.bob || 0) / s;
  }

  // Emotes: neutral standing base + the emote's own angle offsets (screen-space → local)
  let emoteArms = null, emoteLegs = null;
  if (ev) {
    V = V.slice();
    V[LEAN] = (ev.lean || 0) * facing + 0.02;
    V[HIP] = -P.stand + (ev.bob || 0) / s;
    V[FNX] = 0.20; V[FNY] = 0; V[FFX] = -0.20; V[FFY] = 0; V[HEAD] = 0;
    const nearScreenR = facing > 0;                    // near/lead limb is screen-right when facing right
    const armAng = (side) => {
      const sg = side === 'L' ? -1 : 1;
      const sw = side === 'L' ? (ev.armSwingL || 0) + (ev.punchArmL || 0) : (ev.armSwingR || 0) + (ev.punchArmR || 0);
      return (sg * 0.34 + sw) * facing;
    };
    const nearA = armAng(nearScreenR ? 'R' : 'L'), farA = armAng(nearScreenR ? 'L' : 'R');
    emoteArms = [nearA, farA];
    const ls = ev.legSwing || 0;
    const lift = (d) => -Math.max(0, d - 0.2) * 0.6;
    V[FNX] = 0.20 + Math.sin(-ls) * 1.0; V[FNY] = lift(-ls);
    V[FFX] = -0.20 + Math.sin(ls) * 1.0;  V[FFY] = lift(ls);
    const over = (a) => [-Math.sin(a) * facing * 1.0, Math.cos(a) * 1.0];
    if (ev.legLOver != null) { const t = over(ev.legLOver), idx = nearScreenR ? [FFX, FFY] : [FNX, FNY]; V[idx[0]] = t[0]; V[idx[1]] = V[HIP] + t[1]; }
    if (ev.legROver != null) { const t = over(ev.legROver), idx = nearScreenR ? [FNX, FNY] : [FFX, FFY]; V[idx[0]] = t[0]; V[idx[1]] = V[HIP] + t[1]; }
  }

  // Character-specific pose language is a rendering layer only. It adjusts the
  // drawn limbs and torso, never the fighter position, timing, hurtbox, or physics.
  if (!ev && !attackState) {
    const [runLean, armAccent, dashLean, jumpOpen, wallReach] = visualStyle.motion;
    if (wRun > 0.001) {
      const beat = Math.sin(runPh * TAU);
      V[LEAN] += runLean * wRun;
      V[HNX] += beat * armAccent * wRun;
      V[HFX] -= beat * armAccent * 0.82 * wRun;
    }
    if (wDash > 0.001) {
      V[LEAN] += dashLean * wDash;
      V[HFX] -= dashLean * 0.45 * wDash;
    }
    if (wWall > 0.001) {
      V[HNX] += wallReach * wWall;
      V[HNY] -= wallReach * 0.35 * wWall;
    }
    if (wAir > 0.001) {
      V[HNX] += jumpOpen * wAir;
      V[HFX] -= jumpOpen * 0.72 * wAir;
      V[FNX] += jumpOpen * 0.20 * wAir;
    }
  }

  // ── Joints (local space: facing right, y down, origin = feet) ──
  const lam = V[LEAN];
  const hip = [0, V[HIP]];
  const sh = [Math.sin(lam) * P.torso, hip[1] - Math.cos(lam) * P.torso];
  const shN = [sh[0] + 0.035, sh[1]], shF = [sh[0] - 0.025, sh[1]];
  const hpN = [0.025, hip[1]], hpF = [-0.025, hip[1]];

  const armTarget = (shoulder, hx, hy, ang) => {
    if (ang == null) return [shoulder[0] + hx, shoulder[1] + hy];
    const L = (P.upper + P.fore) * 0.965;              // relaxed, slightly bent emote arm
    return [shoulder[0] + Math.sin(ang) * L, shoulder[1] + Math.cos(ang) * L];
  };
  const tN = armTarget(shN, V[HNX], V[HNY], emoteArms ? emoteArms[0] : null);
  const tF = armTarget(shF, V[HFX], V[HFY], emoteArms ? emoteArms[1] : null);

  const armN = ik(shN[0], shN[1], tN[0], tN[1], P.upper, P.fore, 1);
  const armF = ik(shF[0], shF[1], tF[0], tF[1], P.upper, P.fore, 1);
  const legN = ik(hpN[0], hpN[1], V[FNX], V[FNY], P.thigh, P.shin, -1);
  const legF = ik(hpF[0], hpF[1], V[FFX], V[FFY], P.thigh, P.shin, -1);

  const dir = lam * 0.55 + V[HEAD];
  const head = [sh[0] + Math.sin(dir) * P.neckToHead, sh[1] - Math.cos(dir) * P.neckToHead];
  const arch = 0.004;
  const torsoMid = [(hip[0] + sh[0]) / 2 - Math.cos(lam) * arch, (hip[1] + sh[1]) / 2 - Math.sin(lam) * arch];

  const T = (p) => [p[0] * facing * s * BODY_K, p[1] * s * BODY_K];   // mirror + scale to px
  const joints = {
    s, facing, lean: lam * facing,
    hip: T(hip), shoulder: T(sh), torsoMid: T(torsoMid), head: T(head), headR: P.headR * s,
    wall: wWall > 0.5 ? facing : 0,
    ghosts: (dashEnv * wDash > 0.08) ? [0.30, 0.60].map((k, i) => ({
      x: -dux * facing * k * s, y: -duy * k * s, a: (i ? 0.10 : 0.20) * clamp(dashEnv * wDash, 0, 1) * (dashAir ? 1 : 0.9),
    })) : null,
    near: { shoulder: T(shN), elbow: T(armN.mid), hand: T(armN.end), hip: T(hpN), knee: T(legN.mid), foot: T(legN.end) },
    far: { shoulder: T(shF), elbow: T(armF.mid), hand: T(armF.end), hip: T(hpF), knee: T(legF.mid), foot: T(legF.end) },
    r: {
      thigh: P.rThigh * s, knee: P.rKnee * s, foot: P.rFoot * s,
      shoulder: P.rShoulder * s, elbow: P.rElbow * s, handArm: P.rHandArm * s, hand: P.rHand * s,
      hip: P.rHip * s, chest: P.rChest * s,
    },
  };
  return joints;
}

// ─── Painter ────────────────────────────────────────────────────────────────
function capsule(ctx, ax, ay, ar, bx, by, br) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  ctx.beginPath();
  if (d < 1e-3 || d <= Math.abs(ar - br)) { ctx.arc(d < 1e-3 || ar >= br ? ax : bx, d < 1e-3 || ar >= br ? ay : by, Math.max(ar, br), 0, TAU); ctx.fill(); return; }
  const ang = Math.atan2(dy, dx);
  const off = Math.acos(clamp((ar - br) / d, -1, 1));
  ctx.arc(ax, ay, ar, ang + off, ang - off + TAU, false);
  ctx.arc(bx, by, br, ang - off, ang + off, false);
  ctx.closePath();
  ctx.fill();
}

function disc(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

function parseColor(color) {
  const str = String(color || '');
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str);
  if (m) { let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(str);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
const rgbStr = (c) => `rgb(${c.map(v => clamp(Math.round(v), 0, 255)).join(',')})`;

export function shade(color, amt) {
  const c = parseColor(color);
  return c ? rgbStr(c.map(v => v + amt)) : color;
}

// Arms get their own colour so they read clearly against the torso: a lighter tint of the body
// colour (or a deeper one when the body is already very light). The rear arm is a touch dimmer than
// the front arm, and both stay well away from the darker rear-leg shade.
function armColors(color) {
  const c = parseColor(color);
  if (!c) return [color, color];
  const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const tint = lum < 185
    ? (k) => c.map(v => v + (255 - v) * k)                  // blend toward white
    : (k) => c.map(v => v * (1 - k * 0.8));                 // very light body: go deeper instead
  return [rgbStr(tint(0.45)), rgbStr(tint(0.30))];
}

function paintStumpHand(ctx, L, r) {
  // Blunt, rounded hand ends by design. No fingers, nails, or glove digits.
  const dx = L.hand[0] - L.elbow[0], dy = L.hand[1] - L.elbow[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const cx = L.hand[0] + ux * r.hand * 0.10;
  const cy = L.hand[1] + uy * r.hand * 0.10;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r.hand * 0.92, r.hand * 0.76, Math.atan2(dy, dx), 0, TAU);
  ctx.fill();
  // A short cuff seam separates the forearm from the stump without implying digits.
  ctx.strokeStyle = shade(ctx.fillStyle, -22);
  ctx.lineWidth = Math.max(0.8, r.hand * 0.15);
  ctx.beginPath();
  const px = -uy * r.hand * 0.48, py = ux * r.hand * 0.48;
  ctx.moveTo(L.hand[0] - ux * r.hand * 0.30 + px, L.hand[1] - uy * r.hand * 0.30 + py);
  ctx.lineTo(L.hand[0] - ux * r.hand * 0.30 - px, L.hand[1] - uy * r.hand * 0.30 - py);
  ctx.stroke();
}

function paintLimbSet(ctx, L, r, legColor, armColor, armBehindLeg = false) {
  // On the far side, paint the arm first so the rear leg stays visibly in front of it.
  const drawArm = () => {
    ctx.fillStyle = armColor;
    capsule(ctx, L.shoulder[0], L.shoulder[1], r.shoulder, L.elbow[0], L.elbow[1], r.elbow);
    capsule(ctx, L.elbow[0], L.elbow[1], r.elbow, L.hand[0], L.hand[1], r.handArm);
    paintStumpHand(ctx, L, r);
  };
  const drawLeg = () => {
    ctx.fillStyle = legColor;
    capsule(ctx, L.hip[0], L.hip[1], r.hip, L.knee[0], L.knee[1], r.knee);
    capsule(ctx, L.knee[0], L.knee[1], r.knee, L.foot[0], L.foot[1], r.foot);
  };
  if (armBehindLeg) { drawArm(); drawLeg(); }
  else { drawLeg(); drawArm(); }
}

function paintBody(ctx, J, color) {
  const r = J.r;
  const far = shade(color, -22);
  const [armNear, armFar] = armColors(color);

  // Far (rear) limbs: darker legs, dimmer arm
  paintLimbSet(ctx, J.far, r, far, armFar, true);

  // Torso: a tapered spine from pelvis to neck
  ctx.fillStyle = color;
  const a = J.hip, m = J.torsoMid, b = J.shoulder;
  let px = a[0], py = a[1], pr = r.hip;
  for (let i = 1; i <= 8; i++) {
    const t = i / 8, u = 1 - t;
    const x = u * u * a[0] + 2 * u * t * (2 * m[0] - (a[0] + b[0]) / 2) + t * t * b[0];
    const y = u * u * a[1] + 2 * u * t * (2 * m[1] - (a[1] + b[1]) / 2) + t * t * b[1];
    const rr = lerp(r.hip, r.chest, t);
    capsule(ctx, px, py, pr, x, y, rr);
    px = x; py = y; pr = rr;
  }
  disc(ctx, J.head[0], J.head[1], J.headR);

  // Near (lead) limbs
  paintLimbSet(ctx, J.near, r, color, armNear);
}

export function paintStickman(ctx, J, color, charData = null, frame = 0) {
  paintCharacter(ctx, J, color, charData, frame);
}

function polygon(ctx, points, fill, stroke = '#17191E', lineWidth = 1) {
  if (!points || points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function strokePath(ctx, points, color, width = 1, close = false) {
  if (!points || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  if (close) ctx.closePath();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function drawBackPanels(ctx, J, style, frame) {
  if (style.cape < 0.28 && style.hem < 0.62) return;
  const h = J.hip, f = J.facing, sway = Math.sin(frame * 0.13 + style.motion[2]) * (2 + style.cape * 2);
  const length = 7 + style.cape * 14 + Math.max(0, style.hem - 0.6) * 8;
  const width = 3.5 + style.flare * 4;
  const start = [h[0] - f * J.r.hip * 0.42, h[1] - 1.5];
  const edge = [start[0] - f * (width + sway * 0.24), start[1] + length * 0.18];
  const tip1 = [start[0] - f * (length * 0.52), start[1] + length + sway];
  const tip2 = [start[0] + f * (width * 0.45), start[1] + length * 0.82 + sway * 0.72];
  polygon(ctx, [start, edge, tip1, tip2, [start[0] + f * 1.5, start[1] + 3]], shade(style.cloth, -12), '#17191E', 1.0);
  if (style.cape > 0.55) {
    polygon(ctx, [start, [start[0] - f * 1.3, start[1] + 2], [tip1[0] + f * 2.8, tip1[1] - 2], [tip2[0] + f * 2.2, tip2[1] - 3]], style.trim, '#17191E', 0.8);
  }
}

function drawLegClothes(ctx, J, L, style, isFar = false) {
  const r = J.r;
  const trouser = isFar ? shade(style.cloth, -12) : style.cloth;
  const short = /Short|short|splitShort|kneeShort|skirt|pleat|scallop/i.test(style.lower);
  const wide = /wide|hak|loose|poncho|uneven|patched/i.test(style.lower);
  const topRadius = r.thigh * (wide ? 0.79 : 0.70);
  const kneeRadius = r.knee * (wide ? 0.76 : 0.66);
  const shinRadius = r.knee * 0.52;
  ctx.fillStyle = trouser;
  capsule(ctx, L.hip[0], L.hip[1], topRadius, L.knee[0], L.knee[1], kneeRadius);
  if (!short) capsule(ctx, L.knee[0], L.knee[1], kneeRadius, L.foot[0], L.foot[1], shinRadius);
  // Narrow seam/panel, inset from the silhouette so the joint outline stays clear.
  const seam = style.trim;
  const priorAlpha = ctx.globalAlpha;
  ctx.strokeStyle = seam; ctx.globalAlpha = priorAlpha * 0.68; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(L.hip[0], L.hip[1] + 2); ctx.lineTo(L.knee[0], L.knee[1] - 1); ctx.stroke();
  if (!short) { ctx.beginPath(); ctx.moveTo(L.knee[0], L.knee[1] + 1); ctx.lineTo(L.foot[0], L.foot[1] - 2); ctx.stroke(); }
  ctx.globalAlpha = priorAlpha;
  if (/reinforced|patch|kneePad|cargo|cargoSlim/i.test(style.lower)) {
    ctx.fillStyle = style.trim;
    ctx.fillRect(L.knee[0] - 2.1, L.knee[1] - 1.2, 4.2, 2.4);
    ctx.strokeStyle = shade(style.trim, -25); ctx.lineWidth = 0.65; ctx.strokeRect(L.knee[0] - 2.1, L.knee[1] - 1.2, 4.2, 2.4);
  }
}

function drawShoe(ctx, J, foot, style) {
  const variant = style.shoe || '';
  const scale = /oversize|broad|chunk|work|rough|platform/i.test(variant) ? 1.22 : /sleek|narrow|point|quiet|flat|low/i.test(variant) ? 0.86 : 1;
  const len = J.r.foot * 2.6 * scale, height = J.r.foot * 1.12 * scale, facing = J.facing;
  const x = foot[0] + facing * J.r.foot * 0.08, y = foot[1] - height * 0.33;
  ctx.save(); ctx.translate(x, y); ctx.scale(facing, 1);
  ctx.beginPath();
  ctx.moveTo(-len * 0.42, -height * 0.58);
  ctx.lineTo(len * 0.20, -height * 0.62);
  ctx.quadraticCurveTo(len * 0.44, -height * 0.56, len * 0.50, -height * 0.08);
  ctx.quadraticCurveTo(len * 0.52, height * 0.22, len * 0.28, height * 0.30);
  ctx.lineTo(-len * 0.40, height * 0.30);
  ctx.quadraticCurveTo(-len * 0.54, height * 0.18, -len * 0.46, -height * 0.12);
  ctx.closePath();
  ctx.fillStyle = shade(style.cloth, -7); ctx.fill();
  ctx.strokeStyle = '#17191E'; ctx.lineWidth = 1.05; ctx.stroke();
  ctx.strokeStyle = style.trim; ctx.lineWidth = Math.max(1, height * 0.19);
  ctx.beginPath(); ctx.moveTo(-len * 0.42, height * 0.22); ctx.lineTo(len * 0.37, height * 0.22); ctx.stroke();
  ctx.strokeStyle = shade(style.trim, 25); ctx.lineWidth = 0.8;
  if (/lace|court|sprint|high|trainer/i.test(variant)) {
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-len * 0.13, -height * (0.27 - i * 0.14)); ctx.lineTo(len * 0.12, -height * (0.22 - i * 0.14)); ctx.stroke(); }
  } else if (/split|fork|wave|trail|sole/i.test(variant)) {
    ctx.beginPath(); ctx.moveTo(len * 0.12, height * 0.18); ctx.lineTo(len * 0.27, height * 0.08); ctx.lineTo(len * 0.38, height * 0.18); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-len * 0.20, -height * 0.20); ctx.lineTo(len * 0.14, -height * 0.22); ctx.stroke();
  }
  if (/high|boot|calf|winter|raised|wrapped/i.test(variant)) {
    ctx.strokeStyle = style.trim; ctx.lineWidth = Math.max(1, height * 0.16);
    ctx.beginPath(); ctx.moveTo(-len * 0.25, -height * 0.53); ctx.lineTo(len * 0.10, -height * 0.51); ctx.stroke();
  }
  ctx.restore();
}

function drawSleeves(ctx, J, style) {
  // Vest and sleeveless cuts keep exposed body color. Other tops have short
  // fitted sleeves that stop before the elbow pivot so the rig stays readable.
  if (/storm|fieldVest|streamer|sleeveless|grappler|heavySport|formalLongVest|geometricVest|longVest|combatVest/i.test(style.cut)) return;
  for (const L of [J.far, J.near]) {
    const ex = L.shoulder[0] + (L.elbow[0] - L.shoulder[0]) * 0.72;
    const ey = L.shoulder[1] + (L.elbow[1] - L.shoulder[1]) * 0.72;
    ctx.fillStyle = style.cloth;
    capsule(ctx, L.shoulder[0], L.shoulder[1], J.r.shoulder * 0.78, ex, ey, J.r.elbow * 0.72);
    const dx = L.elbow[0] - L.shoulder[0], dy = L.elbow[1] - L.shoulder[1], d = Math.hypot(dx, dy) || 1;
    const px = -dy / d * J.r.elbow * 0.62, py = dx / d * J.r.elbow * 0.62;
    strokePath(ctx, [[ex + px, ey + py], [ex - px, ey - py]], style.trim, 0.8);
  }
}

function drawTorsoClothes(ctx, J, style, frame) {
  const a = J.shoulder, b = J.hip, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, downX = dx / len, downY = dy / len;
  const top = J.r.chest * 1.42, bottom = J.r.hip * (1.35 + style.flare * 0.30);
  const hem = 2 + style.hem * 9;
  const bX = b[0] + downX * hem, bY = b[1] + downY * hem;
  const front = [a[0] + nx * top, a[1] + ny * top];
  const back = [a[0] - nx * top, a[1] - ny * top];
  const lowFront = [bX + nx * bottom, bY + ny * bottom];
  const lowBack = [bX - nx * bottom, bY - ny * bottom];
  polygon(ctx, [front, back, lowBack, lowFront], style.cloth, '#17191E', 1.1);

  // A separate inset panel gives each jacket, tunic, robe, or vest its own cut.
  const open = /open|coat|robe|cloak|rain|cardigan|mantle|stage|duelist|cape|poncho|vest/i.test(style.cut);
  if (open) {
    const midX = (a[0] + bX) * 0.5, midY = (a[1] + bY) * 0.5;
    polygon(ctx, [[midX - nx * top * 0.22, midY - ny * top * 0.22], [midX + nx * top * 0.22, midY + ny * top * 0.22], [bX + nx * bottom * 0.16, bY + ny * bottom * 0.16], [bX - nx * bottom * 0.16, bY - ny * bottom * 0.16]], shade(style.cloth, -20), null);
    strokePath(ctx, [front, [midX + nx * 1.1, midY + ny * 1.1], lowFront], style.trim, 1.1);
    strokePath(ctx, [back, [midX - nx * 1.1, midY - ny * 1.1], lowBack], style.trim, 0.85);
  } else {
    const seamX = a[0] + downX * len * 0.28, seamY = a[1] + downY * len * 0.28;
    strokePath(ctx, [[seamX + nx * 1.4, seamY + ny * 1.4], [bX + nx * 1.4, bY + ny * 1.4]], style.trim, 0.9);
  }

  // Hem geometry: asymmetric or flared silhouettes are drawn from each character's own override.
  const f = J.facing, sway = Math.sin(frame * 0.12 + style.motion[1]) * style.cape * 2.2;
  if (style.flare > 0.42 || style.hem > 0.62) {
    const extension = 3 + style.hem * 5;
    const trailingX = bX - f * (4 + style.flare * 5) + sway;
    const trailingY = bY + extension;
    polygon(ctx, [lowBack, [bX - f * 2, bY + 1], [trailingX, trailingY], [bX + nx * bottom * 0.1, bY + extension * 0.82]], shade(style.cloth, -10), '#17191E', 0.9);
    if (Math.abs(style.asym) > 0.15) {
      const sideX = bX + f * style.asym * (4 + style.flare * 3);
      polygon(ctx, [lowFront, [bX + f * style.asym * 2, bY + 1], [sideX, trailingY * 0.94], [bX + nx * bottom * 0.48, bY + extension * 0.7]], shade(style.cloth, 8), '#17191E', 0.8);
    }
  }

  // Compact collar, shoulder and waist construction, kept clear of the head joint.
  const collarH = /storm|ice|martial|single|vial|formal|ceremonial|high|geometric|rain|grave|tunic/i.test(style.cut) ? 3.8 : 2.2;
  polygon(ctx, [[a[0] - nx * top * 0.58, a[1] - ny * top * 0.58], [a[0] + nx * top * 0.58, a[1] + ny * top * 0.58], [a[0] + nx * 1.1, a[1] + ny * 1.1 - collarH], [a[0] - nx * 1.1, a[1] - ny * 1.1 - collarH]], shade(style.cloth, 17), '#17191E', 0.8);
  ctx.strokeStyle = style.trim; ctx.lineWidth = 1.25;
  ctx.beginPath(); ctx.moveTo(b[0] - nx * bottom * 0.92, b[1] - ny * bottom * 0.92); ctx.lineTo(b[0] + nx * bottom * 0.92, b[1] + ny * bottom * 0.92); ctx.stroke();
  ctx.fillStyle = style.trim; ctx.beginPath(); ctx.arc(b[0], b[1], Math.max(1, J.r.hip * 0.25), 0, TAU); ctx.fill();
}

function drawSleeveDetails(ctx, J, style) {
  const wrap = /wrap|band|guard|cuff|conduct|ring|plate|bracelet|sleeve|tool|scale/i.test(style.prop);
  if (!wrap) return;
  for (const L of [J.far, J.near]) {
    const dx = L.hand[0] - L.elbow[0], dy = L.hand[1] - L.elbow[1], d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d, px = -uy * J.r.handArm * 0.76, py = ux * J.r.handArm * 0.76;
    const cx = L.hand[0] - ux * J.r.hand * 0.72, cy = L.hand[1] - uy * J.r.hand * 0.72;
    strokePath(ctx, [[cx + px, cy + py], [cx - px, cy - py]], style.trim, Math.max(1.3, J.r.handArm * 0.48));
  }
}

function drawSignatureProp(ctx, J, style) {
  const p = style.prop || '';
  const f = J.facing, h = J.hip, mid = J.torsoMid, head = J.head;
  const headProp = /Seal|Pin|Crest|Clip|Stud|Crown|Thorn|Feather|Star|Fox/i.test(p);
  const strap = /Pouch|Satchel|Case|Spool|Strap|Radio|Bag|Document/i.test(p);
  if (strap) {
    strokePath(ctx, [[J.shoulder[0] - f * 2.5, J.shoulder[1] - 1], [h[0] + f * 3.8, h[1] - 2]], style.trim, Math.max(1.3, J.r.chest * 0.22));
    const bx = h[0] - f * (J.r.hip * 1.25), by = h[1] - 1;
    polygon(ctx, [[bx - 2.8, by - 2.4], [bx + 2.2, by - 2.1], [bx + 2.8, by + 2.4], [bx - 2.2, by + 2.2]], shade(style.cloth, 20), '#17191E', 0.85);
  }
  if (headProp) {
    const x = head[0] + f * J.headR * 0.48, y = head[1] - J.headR * 0.68;
    polygon(ctx, [[x, y - 2.2], [x + f * 1.8, y], [x, y + 2.2], [x - f * 1.8, y]], style.trim, '#17191E', 0.75);
  }
  if (/Pendant|Charm|Token|Medallion|Brooch|Core|Hourglass|Drop|Glass|Prayer|Bead|Bell/i.test(p)) {
    const x = mid[0] + f * 1.2, y = mid[1] + 2.5;
    ctx.fillStyle = style.trim; ctx.strokeStyle = '#17191E'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (/Hourglass/i.test(p)) { ctx.moveTo(x - 2, y - 2.4); ctx.lineTo(x + 2, y - 2.4); ctx.lineTo(x, y); ctx.lineTo(x + 2, y + 2.4); ctx.lineTo(x - 2, y + 2.4); ctx.lineTo(x, y); }
    else { ctx.moveTo(x, y - 2.5); ctx.lineTo(x + 2.1, y); ctx.lineTo(x, y + 2.5); ctx.lineTo(x - 2.1, y); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
  }
  if (/Star|Round|Badge|Token|Core|Ring|Patch|Charm|Brooch|Crest|Pin|Fox|Mask|Mirror/i.test(p)) {
    const x = mid[0] + f * 3, y = mid[1] - 1;
    ctx.beginPath(); ctx.arc(x, y, 2.05, 0, TAU); ctx.fillStyle = style.trim; ctx.fill();
    ctx.strokeStyle = '#17191E'; ctx.lineWidth = 0.7; ctx.stroke();
  }
  if (/Vial|Conductor|Control|Token|Tool|Clock|Watch|Device|Compass|Loop|Thread/i.test(p)) {
    const x = h[0] - f * (J.r.hip * 1.18), y = h[1] + 1;
    ctx.fillStyle = style.trim; ctx.fillRect(x - 2, y - 2.6, 4, 5.2);
    ctx.strokeStyle = '#17191E'; ctx.lineWidth = 0.7; ctx.strokeRect(x - 2, y - 2.6, 4, 5.2);
    ctx.fillStyle = shade(style.trim, 35); ctx.fillRect(x - 1, y - 1.6, 2, 1.1);
  }
  if (/Ring|Halo|Gravity|Broken|Fox|Control|Iron/i.test(p)) {
    const x = h[0] - f * (J.r.hip * 1.7), y = h[1] - 3;
    ctx.beginPath(); ctx.ellipse(x, y, 3.3, 2.0, -0.35, 0, TAU); ctx.strokeStyle = style.trim; ctx.lineWidth = 1.2; ctx.stroke();
  }
}

function drawHairBack(ctx, J, style, frame) {
  const hair = style.hair, long = /Braid|Pony|Tail|Lock|Tendril|Tuft|Wisps|Willow/i.test(hair);
  if (!long && !/Bun|Pair|Fox|shadowTendrils|paleLock/i.test(hair)) return;
  const r = J.headR, h = J.head, f = J.facing, sway = Math.sin(frame * 0.09 + style.motion[1]) * (hair.includes('Braid') ? 1.7 : 1.0);
  ctx.save(); ctx.translate(h[0], h[1]); ctx.scale(f, 1);
  const dark = shade(style.hairColor, -16);
  if (/Braid|Pony|Tail|Lock|Tuft|Willow/i.test(hair)) {
    const endX = -r * (hair.includes('Twin') || hair.includes('Pair') ? 1.55 : 1.24);
    const endY = r * (hair.includes('Low') || hair.includes('Rear') || hair.includes('Willow') ? 1.35 : 0.90) + sway;
    ctx.beginPath(); ctx.moveTo(-r * 0.70, -r * 0.10); ctx.quadraticCurveTo(-r * 1.35, r * 0.15 + sway * 0.25, endX, endY);
    ctx.strokeStyle = '#171519'; ctx.lineWidth = r * 0.58; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.70, -r * 0.10); ctx.quadraticCurveTo(-r * 1.35, r * 0.15 + sway * 0.25, endX, endY);
    ctx.strokeStyle = style.hairColor; ctx.lineWidth = r * 0.42; ctx.stroke();
    if (/Braid/i.test(hair)) {
      for (let i = 1; i <= 4; i++) {
        const t = i / 5, bx = -r * 0.72 - r * 0.58 * t, by = r * (0.05 + t * 1.0) + sway * t;
        ctx.beginPath(); ctx.ellipse(bx, by, r * 0.26, r * 0.17, -0.42, 0, TAU); ctx.fillStyle = i % 2 ? dark : style.hairColor; ctx.fill();
        ctx.strokeStyle = '#171519'; ctx.lineWidth = 0.6; ctx.stroke();
      }
    }
  }
  if (/Bun|Knot|Pair|Fox/i.test(hair)) {
    const count = /Twin|Pair|Fox/i.test(hair) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const x = -r * (0.72 + i * 0.23), y = -r * (i ? 0.54 : 0.72);
      ctx.beginPath(); ctx.arc(x, y, r * (count === 2 ? 0.36 : 0.42), 0, TAU); ctx.fillStyle = style.hairColor; ctx.fill(); ctx.strokeStyle = '#171519'; ctx.lineWidth = 0.9; ctx.stroke();
    }
  }
  if (/Tendrils|shadow/i.test(hair)) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-r * 0.35, -r * (0.45 + i * 0.18));
      ctx.quadraticCurveTo(-r * (1.2 + i * 0.14), -r * (0.7 - i * 0.2), -r * (1.35 + i * 0.18), r * (0.3 + i * 0.38) + sway);
      ctx.strokeStyle = i === 1 ? style.trim : dark; ctx.lineWidth = r * 0.20; ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHairFront(ctx, J, style, charData) {
  const r = J.headR, h = J.head, f = J.facing, hair = style.hair;
  ctx.save(); ctx.translate(h[0], h[1]); ctx.scale(f, 1);
  const main = style.hairColor, edge = '#171519';
  const cap = [
    [-r * 0.98, r * 0.22], [-r * 1.00, -r * 0.24], [-r * 0.78, -r * 0.72],
    [-r * 0.36, -r * 0.99], [r * 0.12, -r * 0.97], [r * 0.56, -r * 0.76],
    [r * 0.88, -r * 0.37], [r * 0.72, -r * 0.19], [r * 0.30, -r * 0.30],
    [-r * 0.12, -r * 0.25], [-r * 0.48, -r * 0.08],
  ];
  polygon(ctx, cap, main, edge, 1.25);
  if (/Spike|Quiff|Crest|Crown|Storm|Thorn|Feather|Flame|Broad|Messy|Bristle|Fade/i.test(hair)) {
    const count = /storm|thorn|Feather|flame|broad|spike|Crest|Quiff/i.test(hair) ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const x = -r * (0.48 - i * 0.45), y = -r * (0.82 - (i % 2) * 0.08), peak = -r * (1.42 + (i % 2) * 0.12);
      polygon(ctx, [[x - r * 0.34, y], [x + r * 0.28, y + r * 0.10], [x + r * 0.06, peak]], main, edge, 0.9);
    }
  } else if (/Curl|Round|Bob|Puff|Curls|Bun|Loop|Willow/i.test(hair)) {
    for (const [x, y, rr] of [[-0.54, -0.84, 0.31], [-0.08, -1.03, 0.32], [0.38, -0.81, 0.30]]) {
      ctx.beginPath(); ctx.arc(r * x, r * y, r * rr, Math.PI, TAU); ctx.fillStyle = main; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 0.7; ctx.stroke();
    }
  }
  if (/Bob|Curtain|Fringe|Part|Cropped|Single|Undercut|Sweep|Center|Streak|Wolf|Layer|Shag|Pale|Long|Braid|Tied|Slick|Asym|Pony|Knot|Crop|Cut|Curls|Crown|Crest|Quiff|Hood|Bun|Puff|Lock|Top|Fade/i.test(hair)) {
    const fringeX = /Curtain|Asym|Side|Fringe|Storm|Quiff|Spike|Thorn/i.test(hair) ? r * 0.62 : r * 0.34;
    polygon(ctx, [[-r * 0.48, -r * 0.44], [r * 0.14, -r * 0.62], [fringeX, -r * 0.30], [r * 0.22, -r * 0.20], [-r * 0.12, -r * 0.29]], shade(main, -10), edge, 0.8);
  }
  // Fine, restrained highlight follows the hair mass; it never recolors the body.
  strokePath(ctx, [[-r * 0.60, -r * 0.72], [-r * 0.24, -r * 0.90], [r * 0.15, -r * 0.85]], shade(style.trim, 8), Math.max(0.7, r * 0.10));
  if (charData?.whiteEyes) {
    strokePath(ctx, [[r * 0.40, r * 0.07], [r * 0.68, r * 0.06]], '#F5F2E8', 1.3);
  } else {
    ctx.beginPath(); ctx.ellipse(r * 0.48, r * 0.09, r * 0.12, r * 0.075, 0, 0, TAU); ctx.fillStyle = '#201B20'; ctx.fill();
  }
  ctx.restore();
}

function paintCharacter(ctx, J, color, charData, frame) {
  const style = getCharacterVisualStyle(charData);
  const paint = () => {
    drawBackPanels(ctx, J, style, frame);
    drawHairBack(ctx, J, style, frame);
    paintBody(ctx, J, color);
    drawLegClothes(ctx, J, J.far, style, true);
    drawLegClothes(ctx, J, J.near, style, false);
    drawShoe(ctx, J, J.far.foot, style);
    drawShoe(ctx, J, J.near.foot, style);
    drawSleeves(ctx, J, style);
    drawTorsoClothes(ctx, J, style, frame);
    drawSleeveDetails(ctx, J, style);
    drawSignatureProp(ctx, J, style);
    drawHairFront(ctx, J, style, charData);
  };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (J.ghosts) {
    for (let i = J.ghosts.length - 1; i >= 0; i--) {
      const g = J.ghosts[i]; ctx.save(); ctx.globalAlpha *= g.a; ctx.translate(g.x, g.y); paint(); ctx.restore();
    }
  }
  paint();
  ctx.restore();
}
