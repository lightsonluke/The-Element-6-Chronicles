// Shared Generation-I attack silhouettes.
//
// Coordinates are fighter-local (origin at the feet/centre), facing RIGHT. The renderer
// (gen1AttackAnims.js) and the collision system (attackSpecs.js) both read this file every
// frame, so the artwork for Grass / Ice / Water is literally drawn on top of the hitbox
// shapes. For Fire / Thunder the shapes below re-derive the exact positions used by their
// existing art, so the hitbox sits on the visible flame / bolt on every active frame.
//
// Shape types are only 'capsule' and 'circle' (both unambiguous). Shapes flagged
// visualOnly are artwork-only (wind-up / recovery) and never hurt anyone.
const TAU = Math.PI * 2;

// Frame data [startup, active, endlag] straight from the move list.
export const GEN1_TIMINGS = {
  g1_fire:    { us:[10,2,13], ds:[11,4,27], ss:[4,5,17],  uh:[14,5,38], dh:[14,4,27], sh:[17,7,37], recovery:[5,4,25], super:[30,15,48], groundPound:[15,6,31] },
  g1_grass:   { us:[8,2,22],  ds:[10,5,23], ss:[10,2,18], uh:[18,4,29], dh:[20,5,41], sh:[15,6,40], recovery:[5,3,20], super:[31,9,62],  groundPound:[8,5,19] },
  g1_ice:     { us:[9,2,22],  ds:[14,7,15], ss:[9,2,9],   uh:[15,7,26], dh:[18,3,41], sh:[18,7,38], recovery:[7,3,27], super:[31,17,51], groundPound:[16,6,27] },
  g1_thunder: { us:[5,5,10],  ds:[6,7,24],  ss:[4,3,13],  uh:[12,3,32], dh:[23,3,27], sh:[21,4,38], recovery:[4,5,15], super:[27,18,57], groundPound:[5,2,14] },
  g1_water:   { us:[9,2,13],  ds:[7,3,26],  ss:[7,4,9],   uh:[21,5,30], dh:[26,3,36], sh:[21,4,32], recovery:[9,4,19], super:[28,10,65], groundPound:[10,2,29] }
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const cap = (x1, y1, x2, y2, r, kind = 'hit', extra) => ({ shape: 'capsule', x1, y1, x2, y2, r, kind, ...extra });
const cir = (x, y, r, kind = 'hit', extra) => ({ shape: 'circle', x, y, r, kind, ...extra });
const V = { visualOnly: true };

export function gen1MoveKey(charId, d) {
  if (d?.isGroundPound || d?.type === 'groundPound') return 'groundPound';
  if (d?.isRecovery || d?.type === 'recovery' || d?.recoveryAnimationKey) return 'recovery';
  if (d?.isSuper || d?.sigType === 'super') return 'super';
  if (d?.isHeavy) {
    if (['downHeavy', 'down', 'dh'].includes(d.sigType)) return 'dh';
    if (['upHeavy', 'upheavy', 'uh'].includes(d.sigType)) return 'uh';
    return 'sh';
  }
  if (['up', 'upSignature', 'us'].includes(d?.sigType)) return 'us';
  if (['down', 'downSignature', 'downNormal', 'ds'].includes(d?.sigType)) return 'ds';
  return 'ss';
}

export const gen1Frames = (charId, move) => GEN1_TIMINGS[charId]?.[move] || [8, 3, 18];

// Phase helper. e = elapsed frames. w / a / r = wind-up, active and recovery progress (0..1).
// `active` is exactly the window in which fighter/attackSpecs allow a hit.
export function gen1Phase(charId, move, p) {
  const [S, A, E] = gen1Frames(charId, move), T = S + A + E, q = clamp(p);
  const e = Math.round(q * T * 1e6) / 1e6;
  return { q, e, S, A, E, T, w: clamp(e / S), a: clamp((e - S) / A), r: clamp((e - S - A) / E), active: e >= S && e < S + A };
}

// Ground pound has two hit windows: the dive, then the landing shockwave. Used by attackSpecs.
export function gen1GroundPoundWindows(charId) {
  const [S, A, E] = gen1Frames(charId, 'groundPound'), T = S + A + E;
  const dl = Math.max(1, Math.floor(A * .45));
  const ls = Math.max(S + dl + 1, Math.ceil(T * .585));
  return { direct: [S, S + dl], landing: [ls, ls + Math.max(1, A - dl)], T };
}

// ───────────────────────────────────────────────────────────────────────────
// FIRE — positions copied from fireAttack() in gen1AttackAnims.js (frame based).
function fireGeo(move, P) {
  const { e, S, A, T } = P, out = [], c = clamp((e - S) / A);
  const inAct = e >= S && e < S + A;
  if (move === 'us') {
    // The thrown burning rock IS the attack; hit follows the rock and its flame tail.
    let rx, ry;
    if (e < S * .62) { const u = ease(e / Math.max(1, S * .62)); rx = 26 - 5 * u; ry = -54 + 4 * u; }
    else if (e < S + A + 8) { const t = ease(clamp((e - S * .62) / Math.max(1, T - S * .62))); rx = 26 + t * 72; ry = -54 - t * 74 + t * t * 38; }
    else { rx = 98; ry = -90; }
    if (inAct) out.push(cap(rx - 13, ry + 6, rx, ry, 14, 'rock'), cir(rx, ry, 19, 'rock'));
  } else if (move === 'ds') {
    if (e >= S && e < S + 2) { const t = (e - S) / 2, sp = 22 + 12 * t; out.push(cap(24 - sp, -2, 24 + sp, -2, 8, 'crack'), cir(24, -2, 16 + 6 * t, 'burst')); }
    else if (e >= S + 8 && e < S + 10) { const t = (e - S - 8) / 2, sp = 40 + 18 * t; out.push(cap(24 - sp, -2, 24 + sp, -2, 9, 'crack'), cir(24, -2, 26 + 8 * t, 'burst')); }
  } else if (move === 'ss') {
    if (inAct) {
      const hx = 22 + 53 * ease(c), hy = -22 - 39 * Math.sin(c * Math.PI * .82);
      out.push(cap(21, -24, hx * .62, hy * .72, 9, 'slash'), cap(hx * .62, hy * .72, hx, hy, 11, 'slash'), cir(hx, hy, 14 + 5 * Math.sin(c * Math.PI), 'blob'));
    }
  } else if (move === 'uh') {
    if (inAct) {
      const cx = 10 + 12 * c, cy = -78 - 25 * c;
      out.push(cap(-10, -54, cx - 8, cy + 7, 10, 'trail'), cap(cx - 24, cy, cx + 24, cy, 15, 'ring'), cir(cx, cy, 20, 'blob'));
    }
  } else if (move === 'dh') {
    if (inAct) { const sp = 30 + 45 * c; out.push(cap(20 - sp, -2, 20 + sp, -2, 10, 'crack'), cir(20, -1, 14 + 8 * c, 'blob')); }
  } else if (move === 'sh') {
    if (inAct) {
      const hx = 48, hy = -45, tx = hx + 20 + 48 * ease(c);
      out.push(cap(hx - 5, hy, tx, hy - 4, 10, 'slash'), cir(tx, hy - 4, 14 + 8 * Math.sin(c * Math.PI), 'blob'));
    }
  } else if (move === 'recovery') {
    if (inAct) out.push(cap(-2, -42, 34, -42, 14, 'ring'), cir(18, -42, 12, 'blob'), cir(20, -70, 14 + 8 * c, 'ring'));
  } else if (move === 'groundPound') {
    const w = gen1GroundPoundWindows('g1_fire');
    if (e < S + A) {
      if (e >= w.direct[0] && e < w.direct[1]) { const t = (e - S) / A; out.push(cir(0, -25 + 18 * t, 22 + 10 * t, 'ring'), cir(0, -25 + 18 * t, 13 + 5 * t, 'blob')); }
    } else if (e >= w.landing[0] && e < w.landing[1]) {
      const r = 20 + 60 * ease(clamp((e - S - A) / Math.max(1, T - S - A)));
      out.push(cap(-r, -3, r, -3, 9, 'crack'), cir(0, -3, 14, 'burst'));
    }
  } else if (move === 'super') {
    if (inAct) {
      const q = P.q, launch = ease((q - .375) / .10), travel = clamp((q - .375) / .20);
      if (q < .375) {
        for (const lane of [-1, 1]) { const yL = -58 + lane * (42 - 28 * launch); out.push(cap(26, yL, 96 + launch * 34, yL, 11, 'lane')); }
      } else {
        const cx = 40 + travel * 1080, r = 18 + travel * 12;
        out.push(cap(cx - 70, -58, cx, -58, 11, 'lane'), cir(cx, -58, r + 4, 'blob'));
      }
    }
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────────
// THUNDER — positions copied from the thunder* draw functions (progress based).
function thunderGeo(move, P) {
  const { q, e, S, A } = P, out = [];
  const inAct = e >= S && e < S + A;
  if (!inAct && move !== 'groundPound') return out;
  if (move === 'us') {
    // Only the orbiting dot is dangerous; the lightning ring is decoration.
    const frame = 1 + q * 11;
    if (frame >= 1.75) {
      const orbitT = clamp((frame - 2) / 6), th = -Math.PI / 2 + ease(orbitT) * TAU;
      const dx = Math.cos(th) * 86, dy = -112 + Math.sin(th) * 34;
      out.push(cir(dx, dy, 15, 'dot'));
      const t0 = ease(clamp(orbitT - .08)), th0 = -Math.PI / 2 + t0 * TAU;
      out.push(cap(Math.cos(th0) * 86, -112 + Math.sin(th0) * 34, dx, dy, 9, 'dot'));
    }
  } else if (move === 'ds') {
    if (q <= .28) out.push(cir(-22, -45, 11, 'ball'), cir(22, -45, 11, 'ball'));
    else {
      const r = 18 + ease(q) * 35; let px = null, py = null;
      for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI, x = Math.cos(a) * r, y = -24 + Math.sin(a) * r; if (px !== null) out.push(cap(px, py, x, y, 8, 'arc')); px = x; py = y; }
    }
  } else if (move === 'ss' || move === 'sh') {
    const heavy = move === 'sh', len = heavy ? 100 : 68, h = heavy ? 34 : 24, tr = len * easeOut(q);
    const tipX = 24 + tr, tipY = -50 + Math.sin(q * TAU) * h * .16;
    out.push(cap(24, -50, tipX, tipY, heavy ? 12 : 9, 'bolt'), cir(tipX, tipY, heavy ? 14 : 10, 'bolt'));
  } else if (move === 'uh') {
    const top = -38 - easeOut(q) * 150;
    for (const dx of [24, 82, 140]) out.push(cap(dx + 10, top + 80, dx + 10, top - 8, 10, 'column'));
  } else if (move === 'dh') {
    const ang = -Math.PI / 2 + easeOut(q) * TAU, bx = 20 + Math.cos(ang) * 94, by = -72 + Math.sin(ang) * 94 * .6;
    out.push(cir(bx, by, 16, 'orb'), cap(bx - Math.cos(ang) * 60, by - Math.sin(ang) * 35, bx, by, 8, 'orb'));
  } else if (move === 'recovery') {
    const crouch = ease(q / .24), rise = ease((q - .24) / .42), sx = Math.sin(q * TAU) * 9, sy = -8 - 68 * rise;
    out.push(cap(-20 + 12 * crouch, -25 + 10 * crouch, sx, sy, 12, 'bolt'), cir(sx + 6, sy - 14, 15, 'bolt'));
  } else if (move === 'groundPound') {
    const w = gen1GroundPoundWindows('g1_thunder');
    if (e >= w.direct[0] && e < w.direct[1]) {
      const dive = ease(q / .58), sx = 12 + 34 * dive, sy = -18 - 76 * dive;
      out.push(cap(12 + sx * .45, -20 - 38 * dive, sx - 4, sy - 10, 10, 'bolt'), cir(sx, sy, 17, 'bolt'));
    } else if (e >= w.landing[0] && e < w.landing[1]) {
      const land = ease((q - .58) / .19), r1 = 18 + 70 * land;
      out.push(cap(-r1, -4, r1, -4, 8, 'ring'));
    }
  } else if (move === 'super') {
    // Six orbiting discharges around the fighter (they converge only after the active window).
    const route = ease((q - .18) / .48), converge = ease((q - .62) / .20);
    const cx = 35 + route * 210, cy = -62 - 10 * Math.sin(route * Math.PI);
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU + q * 1.2, r = 32 + route * 95;
      const sx = Math.cos(ang) * r * .55, sy = -52 + Math.sin(ang) * r * .34;
      out.push(cir(lerp(sx, cx, converge), lerp(sy, cy, converge), 15, 'bolt'));
    }
    if (q < .3) out.push(cap(-18, -52, 18, -52 - 8 * ease(q / .25), 12, 'gather'));
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────────
// GRASS / ICE / WATER — brand-new silhouettes. Everything here is drawn by the renderer.
// Every kind: spine = the limb/vine/blade that hurts, head = its tip, floor = ground zone,
// pulse2 = weaker second wave, trap = standing hazard, orb/bloom/impact/burst = contact bursts,
// sweep = invisible hit-only capsule that closes the gap between two frames of a very fast tip.
function grassGeo(move, P) {
  const { e, S, A, T, w, a, q } = P, o = [];
  const ea = easeOut(a);
  if (move === 'us') {
    // Two quick sidesteps (sprouts), then a vault with a shoulder check; growth only on the contact line.
    o.push(cir(-18, -3, 7 * ease((w - .15) / .3), 'sprout', V), cir(-5, -3, 7 * ease((w - .55) / .3), 'sprout', V));
    o.push(cir(6, -48, 4 + 6 * w, 'bud', V));
    const tx = 10 + 8 * ea, ty = -64 - 48 * ea, px = 10 + 8 * easeOut(Math.max(0, a - .5)), py = -64 - 48 * easeOut(Math.max(0, a - .5));
    o.push(cap(8, -46, tx, ty, 15, 'spine'), cir(tx, ty, 18, 'head'), cap(px, py, tx, ty, 14, 'sweep'));
    o.push(cap(-20, -6, -20 + 14 * a, -6 - 70 * ea, 9, 'trail', V));
  } else if (move === 'ds') {
    const d1 = 14 + 58 * ea, d2 = 14 + 104 * ea;
    o.push(cap(8, -6, 8 + 22 * w, -7, 5, 'coil', V));
    o.push(cap(12, -7, d1, -9, 10, 'spine'), cir(d1, -9, 13, 'head'), cap(d1, -8, d2, -6, 6, 'pulse2'), cir(d2, -6, 8, 'head'));
  } else if (move === 'ss') {
    const sh = [8, -48], el = [28, -44 - 4 * Math.sin(a * Math.PI)], tx = 34 + 66 * ea, ty = -46 + 8 * a;
    o.push(cir(26, -40, 4 + 6 * w * (1 - a), 'pod', V));
    o.push(cap(sh[0], sh[1], el[0], el[1], 8, 'spine'), cap(el[0], el[1], tx, ty, 11, 'spine'), cir(tx, ty, 15, 'head'));
    o.push(cap(34 + 66 * easeOut(Math.max(0, a - .5)), -46 + 4 * a, tx, ty, 12, 'sweep'));
  } else if (move === 'uh') {
    for (let i = 0; i < 4; i++) { const t = i / 3; o.push(cir(-20 + 70 * t, -8 - 124 * Math.sin(t * Math.PI * .85), 5, 'mark', V)); }
    const d = ease(a / .5), rb = ease((a - .5) / .5), hx = lerp(26, 38, d) - 16 * rb, hy = -134 + 84 * d - 76 * rb;
    const pd = ease(Math.max(0, a - .3) / .5), pr = ease((Math.max(0, a - .3) - .5) / .5);
    o.push(cap(8, -58, hx, hy, 13, 'spine'), cir(hx, hy, 19, 'head'), cap(lerp(26, 38, pd) - 16 * pr, -134 + 84 * pd - 76 * pr, hx, hy, 14, 'sweep'));
  } else if (move === 'dh') {
    o.push(cir(24, -4, 3 + 5 * w, 'seed', V));
    const late = ease((a - .15) / .85), s = 18 + 54 * late;
    o.push(cir(18, -8, 16 * ease(a * 5), 'impact'));
    o.push(cap(16, -8, 16 + s, -10, 10, 'floor'), cap(16, -8, 16 - s * .78, -8, 8, 'floor'));
  } else if (move === 'sh') {
    const rx = 34 + 102 * ea, ry = -26 - 26 * ease(a);
    o.push(cap(-34 + 28 * w, -6, -6 + 12 * w, -8, 6, 'slide', V));
    o.push(cap(12, -34, rx, ry, 15, 'spine'), cir(rx, ry, 19, 'head'), cap(34 + 102 * easeOut(Math.max(0, a - .4)), -26 - 26 * ease(Math.max(0, a - .4)), rx, ry, 15, 'sweep'));
  } else if (move === 'recovery') {
    const th = Math.PI + a * Math.PI / 2, tx = Math.cos(th) * 40, ty = -46 + Math.sin(th) * 36, lf = ease((a - .35) / .65);
    o.push(cir(0, -44, 34, 'burst'), cap(0, -46, tx, ty, 13, 'spine'), cir(tx, ty, 19, 'head'));
    if (lf > 0) { const ux = 8 * lf, uy = -62 - 34 * lf; o.push(cap(0, -50, ux, uy, 16, 'spine2'), cir(ux, uy, 18, 'head')); }
  } else if (move === 'groundPound') {
    const W = gen1GroundPoundWindows('g1_grass'), land = easeOut((e - (W.landing[0] - 1)) / 14);
    if (e < W.landing[0] - 1) {
      const u = ease(e / (W.landing[0] - 1)), tx = 12 + 36 * u, ty = -56 + 46 * u;
      o.push(cap(4, -58, tx, ty, 14, 'spine'), cir(tx, ty, 17, 'head'));
    } else {
      const r1 = 18 + 64 * land, r2 = 26 + 84 * land;
      o.push(cap(10, -4, r1, -9, 8, 'floor'), cap(-10, -4, -r1 * .75, -7, 7, 'floor'), cap(r1 * .8, -7, r2, -10, 5, 'pulse2'), cap(-r1 * .6, -6, -r2 * .75, -8, 4.5, 'pulse2'));
      o.push(cir(0, -6, 12 * (1 - land * .5), 'impact'));
    }
  } else if (move === 'super') {
    // Corridor of three thorn traps that erupt in order, then a vine-lance dash that curves around the body.
    for (let i = 0; i < 3; i++) {
      const t = ease((q - .06 - i * .06) / .09), tx = 86 + i * 112;
      if (t > .02) o.push(cap(tx, -2, tx, -2 - 72 * t, 9, 'trap'), cir(tx, -4 - 72 * t, 12 * t, 'head'));
    }
    const dash = ease((q - .304) / .088), sx = 18 + 330 * dash, sy = -50 - 26 * Math.sin(dash * Math.PI) + 10 * dash;
    const fin = ease((dash - .7) / .3);
    if (q > .22) {
      o.push(cap(18, -48, sx, sy, 12, 'spine'), cir(sx, sy, 15, 'head'));
      const dp = ease((q - .304) / .088 - .35);
      o.push(cap(18 + 330 * dp, -50 - 26 * Math.sin(dp * Math.PI) + 10 * dp, sx, sy, 14, 'sweep'));
    } else o.push(cir(24, -50, 6 + 12 * ease((q - .1) / .12), 'bud', V));
    if (dash > .7) o.push(cir(sx, sy, 18 + 18 * fin, 'bloom'));
    else if (q > .392) o.push(cir(18 + 330, -40, 34, 'bloom', V));
  }
  return o;
}

function iceGeo(move, P) {
  const { e, S, A, T, w, a, q } = P, o = [];
  const ea = easeOut(a);
  if (move === 'us') {
    // Feint, hop over the head, then a descending-to-rising spin that clips with a curved blade.
    for (let i = 0; i < 5; i++) { const t = i / 4; o.push(cir(-6 + 54 * t * w, -30 - 84 * Math.sin(t * Math.PI * .92) * w, 4, 'trail', V)); }
    const tip = k => { const th = Math.PI * lerp(.35, -.85, ease(k)); return [10 + Math.cos(th) * 48, -62 + Math.sin(th) * 50]; };
    const t1 = tip(a), t0 = tip(Math.max(0, a - .5));
    o.push(cap(10, -62, t1[0], t1[1], 13, 'spine'), cir(t1[0], t1[1], 17, 'head'), cap(t0[0], t0[1], t1[0], t1[1], 12, 'sweep'));
  } else if (move === 'ds') {
    const th = a * TAU * 1.25, R = 58;
    const L = k => [9 + Math.cos(k) * R, -9 + Math.sin(k) * R * .2];
    const p1 = L(th), p2 = L(th + Math.PI), q1 = L(th - .5), q2 = L(th + Math.PI - .5);
    o.push(cap(9, -9, p1[0], p1[1], 7, 'spine'), cap(9, -9, p2[0], p2[1], 7, 'spine'), cir(p1[0], p1[1], 9, 'head'), cir(p2[0], p2[1], 9, 'head'));
    o.push(cap(q1[0], q1[1], p1[0], p1[1], 8, 'sweep'), cap(q2[0], q2[1], p2[0], p2[1], 8, 'sweep'));
    o.push(cir(9, -6, 7 + 5 * w, 'pivot', V));
  } else if (move === 'ss') {
    const j = ease((w - .35) / .3) * (1 - ease((w - .75) / .25));
    o.push(cap(18, -42, 18 + 36 * j, -42, 6, 'jab', V));
    const tx = 30 + 82 * ea;
    o.push(cap(18, -42, tx, -43 - 3 * a, 8, 'spine'), cir(tx, -43 - 3 * a, 11, 'head'), cap(30 + 82 * easeOut(Math.max(0, a - .5)), -42, tx, -43, 9, 'sweep'));
  } else if (move === 'uh') {
    for (let i = 0; i < 3; i++) { const an = w * TAU * 1.5 + i * TAU / 3; o.push(cir(Math.cos(an) * 26, -62 + Math.sin(an) * 30, 7, 'orbit', V)); }
    const late = ease((a - .45) / .55), tx = 10 + 14 * a, ty = -84 - 62 * ea;
    o.push(cap(8, -60, tx, ty, 15, 'spine'), cir(tx, ty, 18, 'head'));
    if (late > 0) o.push(cir(tx, ty, 8 + 18 * late, 'bloom'));
  } else if (move === 'dh') {
    o.push(cir(14, -6, 3 + 6 * w, 'seed', V));
    const s = 14 + 62 * ea;
    o.push(cir(14, -7, 14 * ease(a * 4), 'impact'), cap(14, -6, 14 + s, -7, 9, 'floor'), cap(14, -6, 14 - s * .95, -7, 9, 'floor'));
  } else if (move === 'sh') {
    const raise = ease(w), r0 = [lerp(14, 6, raise), lerp(-66, -112, raise)], tip = [lerp(6, 138, ea), lerp(-112, -54, ea)];
    if (e < S) o.push(cap(4, -60, r0[0], r0[1], 12, 'spine', V), cir(r0[0], r0[1], 8 + 12 * w, 'head', V));
    else {
      const t0 = [lerp(6, 138, easeOut(Math.max(0, a - .5))), lerp(-112, -54, easeOut(Math.max(0, a - .5)))];
      o.push(cap(4, -60, tip[0], tip[1], 14, 'spine'), cir(tip[0], tip[1], 21, 'head'), cap(t0[0], t0[1], tip[0], tip[1], 15, 'sweep'));
    }
  } else if (move === 'recovery') {
    const M = [30, -72], k = ease(a), hx = lerp(-6, M[0], k), hy = lerp(-44, M[1], k);
    o.push(cir(M[0], M[1], 6 + 10 * ease(w * 1.4), 'marker', V));
    o.push(cir(0, -44, 28, 'burst'), cap(-6, -44, hx, hy, 15, 'spine'), cir(hx, hy, 22, 'head'));
  } else if (move === 'groundPound') {
    const W = gen1GroundPoundWindows('g1_ice'), land = easeOut((e - (W.landing[0] - 1)) / 14);
    if (e < W.landing[0] - 1) {
      const u = ease(e / (W.landing[0] - 1)), tx = 10 + 44 * Math.sin(u * Math.PI * .8), ty = -66 + 52 * u;
      o.push(cap(2, -52, tx, ty, 13, 'spine'), cir(tx, ty, 16, 'head'));
    } else {
      const r1 = 18 + 64 * land, r2 = 26 + 84 * land;
      o.push(cap(-r1, -4, r1, -4, 7, 'floor'), cap(-r2, -7, r2, -7, 4.5, 'pulse2'), cir(0, -6, 12, 'impact'));
    }
  } else if (move === 'super') {
    // A frost orb flies out on a rising arc, bends back under the stage, then returns for a close finisher.
    const orb = k => { if (k < .5) { const u = ease(k / .5); return [30 + 260 * u, -58 - 40 * Math.sin(u * Math.PI)]; } const v = ease((k - .5) / .5); return [290 - 220 * v, -58 + 18 * Math.sin(v * Math.PI)]; };
    const cur = orb(a), prev = orb(Math.max(0, a - .1)), fin = ease((a - .85) / .15);
    if (e < S) o.push(cir(30, -58, 6 + 16 * w, 'orb', V));
    else {
      o.push(cir(cur[0], cur[1], 22, 'orb'), cap(prev[0], prev[1], cur[0], cur[1], 13, 'trail'));
      if (fin > 0) o.push(cir(70, -52, 24 + 30 * fin, 'bloom'));
    }
  }
  return o;
}

function waterGeo(move, P) {
  const { e, S, A, T, w, a, q } = P, o = [];
  const ea = easeOut(a);
  if (move === 'us') {
    const run = [[44, -6], [30, -14], [10, -18], [-10, -14], [-24, -6]];
    for (let i = 0; i < 4; i++) if (w > i / 4) o.push(cap(run[i][0], run[i][1], run[i + 1][0], run[i + 1][1], 5, 'run', V));
    const hand = k => [-22 + 42 * easeOut(k), -40 - 68 * easeOut(k) - 14 * Math.sin(k * Math.PI)];
    const h1 = hand(a), h0 = hand(Math.max(0, a - .5));
    o.push(cap(-4, -56, h1[0], h1[1], 12, 'spine'), cir(h1[0], h1[1], 15, 'head'), cap(h0[0], h0[1], h1[0], h1[1], 13, 'sweep'));
  } else if (move === 'ds') {
    const T0 = 58;
    o.push(cir(T0, -3, 4 + 14 * ease(w), 'marker', V));
    const top = -8 - 56 * ea;
    o.push(cap(T0 - 22, -6, T0 + 22, -6, 10, 'floor'), cap(T0, -6, T0, top, 14, 'spine'), cir(T0, top, 17, 'head'));
  } else if (move === 'ss') {
    o.push(cir(108, -44, 4 + 7 * ease(w), 'marker', V));
    const tx = 28 + 82 * ea;
    o.push(cap(24, -44, tx, -44, 7, 'spine'), cir(tx, -44, 9, 'head'), cap(28 + 82 * easeOut(Math.max(0, a - .5)), -44, tx, -44, 8, 'sweep'));
  } else if (move === 'uh') {
    o.push(cir(38, -54, 4 + 8 * w, 'grip', V));
    const tp = k => { const th = -k * Math.PI * .8; return [4 + Math.cos(th) * 54, -82 + Math.sin(th) * 54 - 18 * k]; };
    const t1 = tp(ea), t0 = tp(Math.max(0, ea - .3));
    o.push(cap(4, -82, t1[0], t1[1], 16, 'spine'), cir(t1[0], t1[1], 19, 'head'), cap(t0[0], t0[1], t1[0], t1[1], 15, 'sweep'));
  } else if (move === 'dh') {
    if (e < S) { for (let i = 0; i < 5; i++) { const t = i / 4; o.push(cir(-6 + 30 * t * w, -4 - 38 * Math.sin(t * Math.PI) * Math.sin(w * Math.PI), 4, 'trail', V)); } }
    const s1 = 16 + 66 * ea, s2 = 12 + 40 * ea;
    o.push(cir(24, -8, 17 * ease(a * 4), 'impact'), cap(24, -7, 24 + s1, -8, 10, 'floor'), cap(24, -7, 24 - s2, -7, 7, 'floor'));
  } else if (move === 'sh') {
    o.push(cap(-30 + 26 * w, -22, -6 + 10 * w, -26, 6, 'trail', V));
    const C = [10, -52], tp = k => { const th = lerp(-.5, .45, easeOut(k)); return [C[0] + Math.cos(th) * 104 * .85, C[1] + Math.sin(th) * 104 * .5]; };
    const t1 = tp(a), t0 = tp(Math.max(0, a - .4));
    o.push(cap(C[0] + 18, C[1], t1[0], t1[1], 17, 'spine'), cir(t1[0], t1[1], 21, 'head'), cap(t0[0], t0[1], t1[0], t1[1], 18, 'sweep'));
  } else if (move === 'recovery') {
    const ball = k => [lerp(-14, 34, ease(k)), -40 - 6 * Math.sin(k * Math.PI) - 32 * ease((k - .5) / .5)];
    const b = ball(a), b0 = ball(Math.max(0, a - .5));
    o.push(cir(0, -44, 26, 'burst'), cir(b[0], b[1], 26, 'orb'), cap(b0[0], b0[1], b[0], b[1], 20, 'sweep'));
  } else if (move === 'groundPound') {
    const W = gen1GroundPoundWindows('g1_water'), land = easeOut((e - (W.landing[0] - 1)) / 14);
    if (e < W.landing[0] - 1) {
      const ang = e * .9, bx = 9 * Math.cos(ang), by = -40 + 6 * Math.sin(ang) - 6 * ease(e / (W.landing[0] - 1));
      o.push(cir(bx, by, 27, 'orb'), cap(0, -58, bx, by, 14, 'spine', V));
    } else {
      const r1 = 18 + 64 * land, r2 = 26 + 84 * land;
      o.push(cap(0, -4, r1, -9, 9, 'floor'), cap(0, -4, -r1 * .72, -7, 7, 'floor'), cap(r1 * .8, -8, r2, -10, 5, 'pulse2'), cap(-r1 * .6, -6, -r2 * .7, -8, 4, 'pulse2'), cir(0, -8, 12 * (1 - land * .5), 'impact'));
    }
  } else if (move === 'super') {
    // Three tide-marks are planted, then cashed in one after another, then a pressure surge sweeps through.
    const mx = i => 54 + 78 * i;
    for (let i = 0; i < 3; i++) {
      const t = ease((w - .1 - .22 * i) / .25);
      if (t < .01) continue;
      const burst = e >= S ? ease((a - i * .16) / .26) : 0;
      o.push(cir(lerp(24, mx(i), t), -52 - 14 * Math.sin(t * Math.PI), 8 + 22 * burst, e >= S ? 'mark' : 'markIdle', e >= S ? undefined : V));
    }
    if (a > .5) { const sx = 24 + 300 * ease((a - .5) / .5); o.push(cap(24, -48, sx, -48, 19, 'spine'), cir(sx, -48, 27, 'head'), cap(24 + 300 * ease((a - .7) / .5), -48, sx, -48, 20, 'sweep')); }
  }
  return o;
}

// Fade rules shared by artwork: shapes fade in during wind-up and out during recovery.
function finishNew(shapes, P, move, charId) {
  let inWin = P.active;
  if (move === 'groundPound') { const W = gen1GroundPoundWindows(charId); inWin = (P.e >= W.direct[0] && P.e < W.direct[1]) || (P.e >= W.landing[0] && P.e < W.landing[1]); }
  const al = P.e < P.S ? .35 + .65 * P.w : (P.r > 0 ? 1 - ease(P.r * 1.05) : 1);
  for (const s of shapes) {
    if (!inWin || s.kind === 'markIdle') s.visualOnly = true;
    s.al = s.al ?? al;
  }
  return shapes;
}

export function getGen1AttackGeometry(charId, move, p = 0) {
  const P = gen1Phase(charId, move, p);
  if (charId === 'g1_fire') return fireGeo(move, P);
  if (charId === 'g1_thunder') return thunderGeo(move, P);
  const raw = charId === 'g1_grass' ? grassGeo(move, P) : charId === 'g1_ice' ? iceGeo(move, P) : waterGeo(move, P);
  return finishNew(raw, P, move, charId);
}
