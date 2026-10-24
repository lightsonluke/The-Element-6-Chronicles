// stickman.js — one procedural stickman rig shared by every fighter.
//
// Everything is drawn from code (no sprite images). The proportions come from the
// reference red stickman: small round head, long thin tapered limbs, bulb hands,
// a staggered guard stance with the lead fist up and the rear arm hanging.
//
// Pipeline:  solvePose()  ->  joint positions (already mirrored + scaled)
//            paintStickman() draws those joints
//            getLimbPose() in renderer.js reads the same joints for cosmetics
//
// Limbs are two-bone IK chains, so knees/elbows always bend the right way and
// feet stay planted while running.  "near" = the lead limb in the guard stance
// (screen-right when facing right), "far" = the rear limb.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const frac = (v) => v - Math.floor(v);

export const BASE_SCALE = 36;

// Proportions, in units of s (s = 36 * scale).  Standing height ≈ 2.09 s ≈ 75 px.
const P = {
  headR: 0.26, neckToHead: 0.27,
  thigh: 0.58, shin: 0.60,
  upper: 0.30, fore: 0.28,
  torso: 0.44,
  stand: 1.12,
  // limb radii (tapered: thick at the joint nearest the body)
  rThigh: 0.150, rKnee: 0.124, rFoot: 0.106,
  rShoulder: 0.124, rElbow: 0.106, rHandArm: 0.096, rHand: 0.118,
  rHip: 0.158, rChest: 0.140,
};

// Hurtbox that matches the new silhouette (world px at scale 1, relative to f.x / f.y = feet).
export const FIGHTER_HURTBOX = { w: 32, h: 75, centerY: -37.5 };

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

function hitV(rx, ry, mag, t, grounded) {
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
  if (grounded && ny < 0.65) {                              // stagger / skid instead of flying
    const gw = clamp((wt.back + wt.fwd) / sum, 0, 1);
    const sk = wt.fwd > wt.back ? SKID.fwd : SKID.back;
    out[FNX] = lerp(out[FNX], sk[0], gw); out[FNY] = lerp(out[FNY], 0, gw);
    out[FFX] = lerp(out[FFX], sk[1], gw); out[FFY] = lerp(out[FFY], 0, gw);
    out[HIP] += 0.05 * gw;
  }
  return out;
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
  const facing = o.facing < 0 ? -1 : 1;
  const motion = o.motion || null, memo = motion?.memo || null;
  const vx = Number(motion?.vx) || 0, vy = Number(motion?.vy) || 0;
  const grounded = motion && motion.grounded !== undefined ? !!motion.grounded : state !== 'jumping';
  const attackState = state === 'attacking' || state === 'attackHold' || state === 'superAttack';
  const ev = o.emoteVars || null;

  // Layer targets
  const tRun = state === 'moving' && grounded ? 1 : 0;
  const tAir = grounded ? 0 : 1;
  const tHit = state === 'hitstun' ? 1 : 0;
  const tCr = state === 'crouching' ? 1 : 0;

  let wRun = tRun, wAir = tAir, wHit = tHit, wCr = tCr, dip = 0, runPh = frame * RUN_NOMEM;
  let airT = 99, launched = false;
  let kbx = vx * facing, kby = -vy, kbm = Math.hypot(vx, vy), hitT = 8;
  if (memo) {
    if (memo.lastFrame !== frame) {                    // advance exactly once per sim frame (pause-safe)
      memo.lastFrame = frame;
      const first = memo.wRun === undefined;
      memo.wRun = first ? tRun : lerp(memo.wRun, tRun, 0.18);   // slower blend = smoother idle <-> run
      memo.wAir = first ? tAir : lerp(memo.wAir, tAir, 0.40);
      memo.wHit = first ? tHit : lerp(memo.wHit, tHit, 0.50);
      memo.wCr = first ? tCr : lerp(memo.wCr, tCr, 0.35);
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
        if (!memo.inHit || jump > 2.5) { memo.kbx = vx * facing; memo.kby = -vy; memo.kbm = m; memo.hitT = 0; }
        else memo.hitT = (memo.hitT || 0) + 1;
        memo.inHit = true;
      } else { memo.inHit = false; memo.kbm = 0; }
      memo.pvx = vx; memo.pvy = vy;
    }
    wRun = memo.wRun; wAir = memo.wAir; wHit = memo.wHit; wCr = memo.wCr; dip = memo.dip || 0;
    runPh = memo.run || 0; airT = memo.airT ?? 99; launched = !!memo.launched;
    if (memo.inHit) { kbx = memo.kbx; kby = memo.kby; kbm = memo.kbm; hitT = memo.hitT || 0; }
  }

  const amp = motion && motion.vx !== undefined ? lerp(0.70, 1, clamp((Math.abs(vx) - 1) / 4, 0, 1)) : 1;

  // Base pose = idle blended with run / air / crouch / hit
  let V = idleV(frame);
  if (wRun > 0.001) V = mix(V, runV(runPh / TAU, amp), wRun);
  if (wAir > 0.001) V = mix(V, airV(clamp(vy / 12, -1, 1), airT, launched, vx * facing), wAir);
  if (wCr > 0.001) V = mix(V, CROUCH_V, wCr);
  if (wHit > 0.001) {
    // tiny launch speed = frozen / shocked / dazed → wobble; otherwise a directional knockback pose
    const stunW = 1 - sstep((kbm - 0.8) / 1.4);
    let H = hitV(kbx, kby, Math.max(kbm, 1e-3), hitT, grounded);
    if (stunW > 0.001) H = mix(H, stunV(memo ? hitT : frame), stunW);
    V = mix(V, H, wHit);
  }
  if (dip > 0.01) { V = V.slice(); V[HIP] += dip * 0.17; V[LEAN] += dip * 0.12; V[FNX] += dip * 0.06; V[FFX] -= dip * 0.06; }

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

  const T = (p) => [p[0] * facing * s, p[1] * s];       // mirror + scale to px
  const joints = {
    s, facing, lean: lam * facing,
    hip: T(hip), shoulder: T(sh), torsoMid: T(torsoMid), head: T(head), headR: P.headR * s,
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

export function shade(color, amt) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color || ''));
  if (!m) return color;
  let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const f = (v) => clamp(Math.round(v + amt), 0, 255);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function paintLimbSet(ctx, L, r) {
  // leg
  capsule(ctx, L.hip[0], L.hip[1], r.hip, L.knee[0], L.knee[1], r.knee);
  capsule(ctx, L.knee[0], L.knee[1], r.knee, L.foot[0], L.foot[1], r.foot);
  // arm
  capsule(ctx, L.shoulder[0], L.shoulder[1], r.shoulder, L.elbow[0], L.elbow[1], r.elbow);
  capsule(ctx, L.elbow[0], L.elbow[1], r.elbow, L.hand[0], L.hand[1], r.handArm);
  disc(ctx, L.hand[0], L.hand[1], r.hand);
}

export function paintStickman(ctx, J, color) {
  const r = J.r;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const far = shade(color, -22);

  // Far (rear) limbs sit slightly darker so overlapping poses stay readable
  ctx.fillStyle = far;
  paintLimbSet(ctx, J.far, r);

  // Torso: a gently arched, tapered spine from pelvis to neck
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
  // Head
  disc(ctx, J.head[0], J.head[1], J.headR);

  // Near (lead) limbs
  ctx.fillStyle = color;
  paintLimbSet(ctx, J.near, r);
  ctx.restore();
}
