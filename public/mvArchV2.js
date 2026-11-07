// mvArchV2.js — physical-contact move library + per-character move definitions (Generation I first).
//
// Design rules this file enforces (from the attack-overhaul spec):
//  * the ONLY collision shapes are small capsules welded to the striking limb / weapon edge / shoulder
//    (fist, foot, knee, elbow, shin, palm, weapon).  No `col`, `gnd`, `zone`, `ring` or big `orb` elements are
//    used for damage.  Power effects (flame wrap, water sleeve, ...) are cosmetic and painted by mvArtPhys.js.
//  * every move has an authored pose track (keys), its own timing (fr), its own hit class (`hit`) incl. hitstun.
//  * multi-phase moves declare `stages`; each stage can hit a target exactly once (engine: hitStageIds).
//  * counters only strike if an attack actually lands inside the brace window (`counter`).
//  * recoveries have no hit shapes and travel toward the stage (`toStage`).
import { P, GUARD } from './mvCore.js';
import { KB } from './mvKB.js';

const K = (at, p, e) => ({ at, p, e });
const END = (p = GUARD, t = 2.35) => [K(t, p, 'io'), K(3, GUARD, 'io')];
const AIR = (o = {}) => P({ lean: 6, hip: -1.1, nf: { a: -50, l: 1.0 }, ff: { a: -70, l: 1.0 }, nh: { a: 40, l: 0.5 }, fh: { a: 140, l: 0.5 }, ...o });

// ── hit classes ──────────────────────────────────────────────────────────────
// a = airborne launch angle, g = grounded launch angle (deg, 0 = horizontal away), hs = base hitstun frames.
// bkb/kbg come from the slot's calibrated class unless overridden, so kill percents stay balanced.
const H = (slot, o = {}) => ({ ...(KB[slot] || KB.sh), hs: 10, ...o });
const LIGHT = { bkb: 1.4, kbg: 0.004, g: 4, a: 6, hs: 8 };          // interrupt-level first contact of a two-hit move

// ── element builders (all hit shapes are short capsules around ONE body part) ────────
const hb = (a, look, o = {}) => ({ k: 'blade', a, abs: o.abs, ang: o.ang || 0, len: o.len || [3, 7], r: o.r || [10, 11], from: o.from || 0,
  u: o.u || [0, 1], ease: 'lin', st: o.st || 0, look, when: o.when, wlen: o.wlen, wstyle: o.wstyle, hit: o.hit });
const fist = (a = 'nh', o = {}) => hb(a, 'fist', { len: [3, 7], r: [10, 11], ...o });
const palm = (a = 'nh', o = {}) => hb(a, 'palm', { len: [4, 13], r: [9, 11], ...o });
const foot = (a = 'nf', o = {}) => hb(a, 'foot', { len: [3, 8], r: [11, 12], ...o });
const shin = (a = 'nf', o = {}) => hb(a, 'shin', { from: -22, len: [22, 26], r: [8, 9], ...o });
const knee = (o = {}) => hb('nk', 'knee', { len: [2, 6], r: [12, 13], ...o });
const elbow = (a = 'ne', o = {}) => hb(a, 'elbow', { len: [3, 8], r: [12, 13], ...o });
const shoulder = (o = {}) => hb('sh', 'shoulder', { abs: true, ang: 0, from: -4, len: [12, 16], r: [15, 17], ...o });
const forearm = (a = 'nh', o = {}) => hb(a, 'fist', { from: -16, len: [18, 20], r: [9, 10], ...o });
// held weapon: visible prop (wlen) is drawn by the painter; only the edge/tip capsule collides.
const weapon = (a = 'nh', o = {}) => { const w = o.wlen || 40; return hb(a, 'weapon', { from: Math.round(w * 0.36), len: [Math.round(w * 0.57), Math.round(w * 0.6)], r: [4, 5], ...o, wlen: w }); };
const weaponTip = (a = 'nh', o = {}) => { const w = o.wlen || 40; return hb(a, 'weapon', { from: Math.round(w * 0.6), len: [Math.round(w * 0.34), Math.round(w * 0.37)], r: [4, 5], ...o, wlen: w }); };
const trail = (a = 'nf', o = {}) => hb(a, 'trail', { len: [4, 6], r: [4, 5], hit: false, ...o });   // cosmetic only
const stg = (...w) => w.map((x, i) => ({ w: x, kb: i === w.length - 1 ? 'final' : 'stagger' }));

// ══════════════════════ TEMPLATES (parameterised so each character's version differs) ══════════════════════
const T = {};

// lead-hand jab (light interrupt) then rear-hand cross (the real hit)
T.jabCross = (o = {}) => {
  const L = o.lean ?? 16, step = o.step ?? 0.55, hook = o.hit || {};
  return { phys: true, keys: [K(0, GUARD),
    K(0.6, P({ lean: 10, hip: -0.98, nf: [step - 0.05, 0], ff: [-0.35, 0], nh: { a: 12, l: 0.3 }, fh: { a: 22, l: 0.3 } }), 'in'),
    K(1, P({ lean: L, hip: -0.98, nf: [step, 0], ff: [-0.35, 0], nh: { a: 3, l: 0.58 }, fh: { a: 26, l: 0.3 } }), 'snap'),
    K(1.28, P({ lean: L - 2, hip: -0.98, nf: [step, 0], ff: [-0.36, 0], nh: { a: 24, l: 0.3 }, fh: { a: 22, l: 0.3 } }), 'out'),
    K(1.55, P({ lean: L + 12, hip: -0.95, rot: 8, nf: [step + 0.06, 0], ff: [-0.42, 0], nh: { a: 28, l: 0.3 }, fh: { a: 2, l: 0.58 } }), 'snap'),
    K(1.85, P({ lean: L + 14, hip: -0.95, rot: 9, nf: [step + 0.06, 0], ff: [-0.42, 0], fh: { a: 0, l: 0.58 } }), 'lin'), ...END()],
    stages: [{ w: 0.2, kb: 'stagger', hit: LIGHT }, { w: 0.8, kb: 'final', hit: hook }],
    fx: [fist('nh', { u: [0, 0.3], st: 0 }), fist('fh', { u: [0.44, 0.82], st: 1, r: [11, 12] })], drive: [{ at: [0.4, 1.1], vx: o.drive ?? 2.2 }] };
};

// shoulders dip, one knee drives straight up, other leg folds back
T.kneeRise = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.6, P({ lean: 26, hip: -0.7, nf: [0.35, 0], ff: [-0.4, 0], nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 } }), 'in'),
  K(1, P({ lean: 2, hip: -1.16, dy: -0.3, nf: [0.58, -0.58], ff: [-0.5, -0.02], nh: { a: 70, l: 0.4 }, fh: { a: 50, l: 0.4 } }), 'snap'),
  K(1.6, P({ lean: -2, hip: -1.18, dy: -0.38, nf: [0.62, -0.62], ff: [-0.5, -0.02], nh: { a: 80, l: 0.4 } }), 'out'), ...END()],
  fx: [knee({ u: [0, 0.85] })], drive: [{ at: [0.5, 1.1], vx: o.drive ?? 1.2 }] });

// whole-body turn, the elbow is the only striking part and only on the front half of the turn
T.elbowSpin = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.6, P({ lean: -8, hip: -0.95, rot: -18, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: 168, l: 0.35 }, fh: { a: 150, l: 0.4 } }), 'in'),
  K(1, P({ lean: 24, hip: -0.92, rot: 20, nf: [0.55, 0], ff: [-0.35, 0], nh: { a: 22, l: 0.26 }, fh: { a: 30, l: 0.4 } }), 'snap'),
  K(1.5, P({ lean: 30, hip: -0.92, rot: 32, nf: [0.58, 0], ff: [-0.35, 0], nh: { a: 4, l: 0.24 }, fh: { a: 30, l: 0.4 } }), 'out'), ...END()],
  fx: [elbow('ne', { u: [0.05, 0.62] })], drive: [{ at: [0.6, 1.2], vx: o.drive ?? 1.4 }] });

// pivot on the planted foot, chamber, snap one heel straight forward
T.heelKick = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.6, P({ lean: -12, hip: -1.0, nf: { a: 40, l: 0.7 }, ff: [-0.2, 0], nh: { a: 100, l: 0.4 }, fh: { a: 60, l: 0.4 } }), 'in'),
  K(1, P({ lean: -14, hip: -1.0, nf: { a: o.ang ?? 8, l: 1.17 }, ff: [-0.2, 0], nh: { a: 110, l: 0.4 }, fh: { a: 60, l: 0.4 } }), 'snap'),
  K(1.5, P({ lean: -16, hip: -1.0, nf: { a: o.ang ?? 8, l: 1.17 }, ff: [-0.22, 0], nh: { a: 110, l: 0.4 } }), 'out'), ...END()],
  fx: [foot('nf', { u: [0, 0.7] })], drive: [{ at: [0.6, 1.1], vx: o.drive ?? 0.8 }] });

// draw the palm to the chest, thrust it out with a torso extension
T.palm = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.55, P({ lean: -6, hip: -0.98, nf: [0.3, 0], ff: [-0.45, 0], nh: { a: 140, l: 0.22 }, fh: { a: 30, l: 0.3 } }), 'in'),
  K(1, P({ lean: o.lean ?? 30, hip: -0.92, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: 3, l: 0.58 }, fh: { a: 40, l: 0.3 } }), 'snap'),
  K(1.6, P({ lean: (o.lean ?? 30) + 4, hip: -0.92, nf: [0.62, 0], ff: [-0.5, 0], nh: { a: 2, l: 0.58 } }), 'out'), ...END()],
  fx: [palm('nh', { u: [0, 0.7] })], drive: [{ at: [0.5, 1.1], vx: o.drive ?? 1.6 }] });

// weight on the back foot, hips turn, short curved hook
T.hook = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.65, P({ lean: -12, hip: -0.95, rot: -14, nf: [0.2, 0], ff: [-0.55, 0], nh: { a: 165, l: 0.5 }, fh: { a: 30, l: 0.3 } }), 'in'),
  K(0.85, P({ lean: 4, hip: -0.95, rot: 0, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: 85, l: 0.58 }, fh: { a: 30, l: 0.3 } }), 'io'),
  K(1, P({ lean: 18, hip: -0.95, rot: 16, nf: [0.5, 0], ff: [-0.4, 0], nh: { a: 12, l: 0.58 }, fh: { a: 40, l: 0.3 } }), 'snap'),
  K(1.5, P({ lean: 22, hip: -0.95, rot: 22, nh: { a: 26, l: 0.58 } }), 'out'), ...END()],
  fx: [fist('nh', { u: [0.05, 0.62] })], drive: [{ at: [0.6, 1.1], vx: o.drive ?? 1.2 }] });

// looks like a committed punch, pulls back, snaps a backfist over the top (only the final arc is active)
T.backfist = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.35, P({ lean: 22, hip: -0.95, nf: [0.5, 0], ff: [-0.35, 0], nh: { a: 4, l: 0.58 }, fh: { a: 30, l: 0.3 } }), 'out'),
  K(0.7, P({ lean: 8, hip: -0.98, nf: [0.4, 0], ff: [-0.35, 0], nh: { a: 40, l: 0.3 }, fh: { a: 30, l: 0.3 } }), 'in'),
  K(0.92, P({ lean: 4, hip: -0.98, rot: -8, nh: { a: 112, l: 0.5 }, fh: { a: 30, l: 0.3 }, nf: [0.4, 0], ff: [-0.35, 0] }), 'io'),
  K(1, P({ lean: 20, hip: -0.97, rot: 12, nh: { a: 10, l: 0.58 }, fh: { a: 36, l: 0.3 }, nf: [0.5, 0], ff: [-0.38, 0] }), 'snap'),
  K(1.45, P({ lean: 24, hip: -0.97, rot: 14, nh: { a: -8, l: 0.58 } }), 'out'), ...END()],
  fx: [fist('nh', { u: [0, 0.6] })], drive: [{ at: [0.2, 0.9], vx: o.drive ?? 1.4 }] });

// drop low, one hand planted, lead shin skims the floor
T.sweepLow = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.55, P({ lean: 48, hip: -0.62, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -75, l: 0.5 }, fh: { a: -40, l: 0.4 } }), 'in'),
  K(1, P({ lean: 56, hip: -0.6, nf: [1.02, -0.03], ff: [-0.55, 0], nh: { a: -82, l: 0.55 }, fh: { a: -60, l: 0.4 } }), 'snap'),
  K(1.6, P({ lean: 58, hip: -0.6, nf: [1.08, -0.03], ff: [-0.55, 0], nh: { a: -82, l: 0.55 } }), 'lin'), ...END(P({ lean: 24, hip: -0.85 }))],
  fx: [shin('nf', { u: [0, 0.85] })], drive: [{ at: [0.5, 1.2], vx: o.drive ?? 1.8 }] });

// chin tucked, one short driving step, shoulder is the only contact
T.shoulder = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.55, P({ lean: 34, hip: -0.8, nf: [0.55, 0], ff: [-0.55, 0], nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 }, head: 6 }), 'in'),
  K(1, P({ lean: 50, hip: -0.78, dx: 0.2, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: -40, l: 0.4 }, fh: { a: -30, l: 0.4 }, head: 6 }), 'snap'),
  K(1.6, P({ lean: 54, hip: -0.78, dx: 0.26, nf: [0.7, 0], ff: [-0.5, 0] }), 'lin'), ...END()],
  fx: [shoulder({ u: [0, 0.85] })], drive: [{ at: [0.45, 1.2], vx: o.drive ?? 3.2 }] });

// weapon raised over the shoulder, committed overhead chop; only the blade head is live
T.chop = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.65, P({ lean: -12, hip: -1.0, nf: [0.35, 0], ff: [-0.4, 0], nh: { a: 128, l: 0.58 }, fh: { a: 120, l: 0.58 } }), 'in'),
  K(0.92, P({ lean: -16, hip: -1.02, nf: [0.4, 0], ff: [-0.42, 0], nh: { a: 136, l: 0.58 }, fh: { a: 128, l: 0.58 } }), 'lin'),
  K(1, P({ lean: 14, hip: -0.95, nf: [0.55, 0], ff: [-0.45, 0], nh: { a: 70, l: 0.58 }, fh: { a: 60, l: 0.5 } }), 'snap'),
  K(1.3, P({ lean: 34, hip: -0.9, nf: [0.62, 0], ff: [-0.5, 0], nh: { a: -14, l: 0.58 }, fh: { a: -8, l: 0.52 } }), 'snap'),
  K(1.7, P({ lean: 38, hip: -0.9, nh: { a: -20, l: 0.58 }, fh: { a: -14, l: 0.52 } }), 'out'), ...END()],
  fx: [weapon('nh', { u: [0, 0.8], wlen: o.wlen, wstyle: o.wstyle })], drive: [{ at: [0.8, 1.4], vx: o.drive ?? 2.0 }] });

// weapon drawn tight to the torso, short committed lunge ending in a straight thrust; only the tip collides
T.thrust = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.6, P({ lean: 8, hip: -0.98, nf: [0.3, 0], ff: [-0.5, 0], nh: { a: -10, l: 0.25 }, fh: { a: -5, l: 0.3 } }), 'in'),
  K(0.95, P({ lean: 12, hip: -0.98, nf: [0.35, 0], ff: [-0.52, 0], nh: { a: -8, l: 0.22 }, fh: { a: -5, l: 0.3 } }), 'lin'),
  K(1, P({ lean: 34, hip: -0.88, nf: [0.75, 0], ff: [-0.5, 0], nh: { a: 2, l: 0.58 }, fh: { a: 8, l: 0.5 } }), 'snap'),
  K(1.6, P({ lean: 38, hip: -0.88, nf: [0.8, 0], ff: [-0.5, 0], nh: { a: 1, l: 0.58 } }), 'lin'), ...END()],
  fx: [weaponTip('nh', { u: [0, 0.8], wlen: o.wlen, wstyle: o.wstyle })], drive: [{ at: [0.85, 1.5], vx: o.drive ?? 5.0 }] });

// reach to the weapon at the hip and draw in one continuous cutting motion across the front
T.drawCut = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.6, P({ lean: 6, hip: -0.95, nf: [0.45, 0], ff: [-0.45, 0], nh: { a: 175, l: 0.3 }, fh: { a: 20, l: 0.3 } }), 'in'),
  K(1, P({ lean: 24, hip: -0.9, rot: 6, nf: [0.55, 0], ff: [-0.45, 0], nh: { a: 40, l: 0.58 }, fh: { a: 20, l: 0.3 } }), 'snap'),
  K(1.45, P({ lean: 30, hip: -0.9, rot: 12, nh: { a: -32, l: 0.56 }, fh: { a: 20, l: 0.3 } }), 'out'),
  K(1.8, P({ lean: 22, hip: -0.9, nh: { a: -50, l: 0.5 } }), 'lin'), ...END()],
  fx: [weapon('nh', { u: [0, 0.75], wlen: o.wlen, wstyle: o.wstyle })], drive: [{ at: [0.8, 1.3], vx: o.drive ?? 1.6 }] });

// dash through for a light clip, plant, REVERSE and land a separate rear strike (own hitbox + own hit token)
T.switchUp = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.5, P({ lean: 30, hip: -0.85, nf: [0.7, 0], ff: [-0.6, 0], nh: { a: 10, l: 0.4 }, fh: { a: 40, l: 0.3 } }), 'in'),
  K(1, P({ lean: 36, hip: -0.88, nf: [0.8, 0], ff: [-0.6, 0], nh: { a: 2, l: 0.58 }, fh: { a: 40, l: 0.3 } }), 'snap'),
  K(1.3, P({ lean: -10, hip: -0.95, rot: -16, nf: [0.3, 0], ff: [-0.7, 0], nh: { a: 150, l: 0.4 }, fh: { a: 120, l: 0.4 } }), 'io'),
  K(1.6, P({ lean: 38, hip: -0.98, rot: 14, nf: [0.35, 0], ff: { a: 176, l: 1.17 }, nh: { a: 20, l: 0.4 }, fh: { a: 30, l: 0.4 } }), 'snap'),
  K(1.9, P({ lean: 40, hip: -0.98, rot: 16, nf: [0.35, 0], ff: { a: 178, l: 1.17 } }), 'lin'), ...END()],
  stages: [{ w: 0.2, kb: 'stagger', hit: LIGHT }, { w: 0.8, kb: 'final', hit: { ...(o.hit || {}), rear: true } }],
  fx: [fist('nh', { u: [0, 0.2], st: 0 }), shin('ff', { u: [0.56, 0.88], st: 1 })],
  drive: [{ at: [0.4, 1.1], vx: 5.6 }, { at: [1.2, 1.75], vx: -3.0 }] });

// brace: only an attack that lands during the window triggers the answer; otherwise it just relaxes
T.counter = (o = {}) => {
  const BR = P({ lean: -6, hip: -0.95, nf: [0.3, 0], ff: [-0.45, 0], nh: { a: 55, l: 0.4 }, fh: { a: 70, l: 0.4 } });
  return { phys: true, counter: { from: 3 }, keys: [K(0, GUARD), K(0.4, BR, 'out'), K(0.98, BR, 'lin'),
    K(1, P({ lean: 26, hip: -0.9, rot: 12, nf: [0.6, 0], ff: [-0.45, 0], nh: { a: 12, l: 0.26 }, fh: { a: 40, l: 0.4 } }), 'snap'),
    K(1.5, P({ lean: 30, hip: -0.9, rot: 16, nf: [0.6, 0], ff: [-0.45, 0], nh: { a: 6, l: 0.26 } }), 'lin'),
    K(2, P({ lean: -2, hip: -0.97, nf: [0.35, 0], ff: [-0.4, 0], nh: { a: 55, l: 0.4 }, fh: { a: 70, l: 0.4 } }), 'out'), ...END()],
    fx: [o.palm ? palm('nh', { u: [0, 0.7], when: 'counter' }) : elbow('ne', { u: [0, 0.7], when: 'counter' })],
    drive: [{ at: [1, 1.5], vx: 4.6 }] };   // the answer steps in so it actually reaches the staggered attacker
};

// load weight into the rear leg / shoulder for a visible beat, then one direct blow
T.load = (o = {}) => {
  const pose = o.limb === 'foot' ? { nf: { a: 8, l: 1.17 }, ff: [-0.2, 0], lean: -12 } : { nf: [0.7, 0], ff: [-0.55, 0], lean: 36 };
  const strike = o.limb === 'shoulder' ? { nh: { a: -40, l: 0.4 }, fh: { a: -30, l: 0.4 } } : { nh: { a: 3, l: 0.58 }, fh: { a: 36, l: 0.3 } };
  return { phys: true, keys: [K(0, GUARD),
    K(0.5, P({ lean: -20, hip: -0.84, nf: [0.22, 0], ff: [-0.72, 0], nh: { a: 150, l: 0.4 }, fh: { a: 140, l: 0.4 } }), 'in'),
    K(0.62, P({ lean: -22, hip: -0.8, nf: [0.2, 0], ff: [-0.74, 0], nh: { a: 152, l: 0.4 }, fh: { a: 142, l: 0.4 } }), 'lin'),
    K(0.97, P({ lean: -24, hip: -0.78, nf: [0.2, 0], ff: [-0.76, 0], nh: { a: 154, l: 0.4 }, fh: { a: 142, l: 0.4 } }), 'lin'),
    K(1, P({ hip: -0.9, ...pose, ...strike }), 'snap'),
    K(1.6, P({ hip: -0.9, ...pose, ...strike, lean: (pose.lean || 30) + 4 }), 'lin'), ...END()],
    fx: [o.limb === 'foot' ? foot('nf', { u: [0, 0.7] }) : o.limb === 'shoulder' ? shoulder({ u: [0, 0.8] }) : o.limb === 'palm' ? palm('nh', { u: [0, 0.7] }) : fist('nh', { u: [0, 0.7], r: [12, 13] })],
    drive: [{ at: [0.7, 1.25], vx: o.drive ?? 2.6 }] };
};

// slide a shin through the ankles, then (after a gap) rise with a forearm: two separate hit phases
T.sweepRise = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.55, P({ lean: 48, hip: -0.62, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -75, l: 0.5 }, fh: { a: -40, l: 0.4 } }), 'in'),
  K(1, P({ lean: 54, hip: -0.6, nf: [1.0, -0.03], ff: [-0.5, 0], nh: { a: -82, l: 0.55 }, fh: { a: -60, l: 0.4 } }), 'snap'),
  K(1.3, P({ lean: 30, hip: -0.8, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 } }), 'io'),
  K(1.6, P({ lean: -2, hip: -1.12, dy: -0.22, nf: [0.35, 0], ff: [-0.4, 0], nh: { a: 82, l: 0.58 }, fh: { a: 60, l: 0.4 } }), 'snap'),
  K(1.9, P({ lean: -6, hip: -1.12, dy: -0.26, nh: { a: 90, l: 0.58 } }), 'lin'), ...END()],
  stages: [{ w: 0.4, kb: 'stagger', hit: o.hit0 || {} }, { w: 0.6, kb: 'final', hit: o.hit1 || {} }],
  fx: [shin('nf', { u: [0, 0.22], st: 0 }), forearm('nh', { u: [0.55, 0.92], st: 1 })], drive: [{ at: [0.5, 1.15], vx: o.drive ?? 3.0 }] });

// tuck, hop, angle down toward the point beneath, open into a one-foot landing kick (foot is live only at the end)
T.diveKick = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.45, P({ lean: 24, hip: -0.8, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: -20, l: 0.35 }, fh: { a: -10, l: 0.35 } }), 'in'),
  K(0.8, P({ lean: 34, hip: -1.2, dy: -0.5, nf: { a: 55, l: 0.6 }, ff: { a: 62, l: 0.6 }, nh: { a: -10, l: 0.35 }, fh: { a: 0, l: 0.35 } }), 'out'),
  K(1, P({ lean: 30, hip: -1.1, dy: -0.28, dx: 0.35, nf: { a: -34, l: 1.17 }, ff: { a: 30, l: 0.55 }, nh: { a: 70, l: 0.4 }, fh: { a: 50, l: 0.4 } }), 'snap'),
  K(1.6, P({ lean: 28, hip: -1.1, dy: -0.2, dx: 0.4, nf: { a: -40, l: 1.17 }, ff: { a: 30, l: 0.55 } }), 'lin'), ...END()],
  fx: [foot('nf', { u: [0, 0.9], r: [12, 13] })],
  drive: [{ at: [0.4, 0.55], vx: 2.6, vy: -6 }, { at: [0.82, 1.7], vx: 5.4 }, { at: [0.9, 1.2], vy: 6.5 }] });

// ── ground pound: its own dive animation, hit belongs ONLY to the named striking part (dive + landing) ──
T.gp = (o) => {
  const dive = o.dive, land = o.land, rec = o.rec || land;
  return { phys: true, gp: true,
    keys: [K(0, AIR()), K(0.55, o.start, 'in'), K(1, o.mid, 'snap'), K(1.5, dive, 'out'), K(1.98, dive, 'lin'), K(2, land, 'snap'), K(2.4, rec, 'out'), K(3, GUARD, 'io')],
    fx: [o.limb({ when: 'dive', st: 0 }), o.limb({ when: 'land', st: 1 })], drive: o.drive || [] };
};

// ── recovery: readable setup, bounded diagonal travel toward the stage, never an attack ──
T.rc = (o) => ({ phys: true, toStage: true,
  keys: [K(0, AIR()), K(0.5, o.setup, 'in'), K(0.95, o.setup, 'lin'), K(1, o.go, 'snap'), K(1.7, o.go2 || o.go, 'out'), ...END(AIR())],
  fx: [trail(o.trailA || 'nf', { u: [0, 1] })], drive: [{ at: [1, 1.75], vx: o.vx, vy: o.vy, toStage: true }], rcLook: o.look });

// ── super: sharp feint → reposition (no hit) → ONE bounded finishing contact ──
T.super = (o) => ({ phys: true,
  keys: [K(0, GUARD), K(0.25, o.feint, 'out'), K(0.5, o.feint2 || o.feint, 'io'), K(0.82, o.reposition, 'io'), K(0.97, o.wind, 'in'),
    K(1, o.finish, 'snap'), K(1.45, o.finish2 || o.finish, 'lin'), ...END(o.end || GUARD, 2.4)],
  stages: [{ w: 1, kb: 'final', hit: o.hit || {} }], fx: [o.limb({ u: [0, 0.7], st: 0 })],
  drive: [{ at: [0.2, 0.5], vx: o.fv ?? -1.4 }, { at: [0.5, 0.95], vx: o.rv ?? 3.6 }, ...(o.drive || [])] });

// ══════════════════════ GENERATION I: exact slot assignments from the attack spec ══════════════════════
const M = (name, fr, def, dmg) => ({ name, fr, def, dmg });
const SIG = (slot, o) => H(slot, { kbg: o.kbg ?? KB[slot].kbg * 0.8, ...o });

// shared pose sets for gp / rc / super finishes (each character gets its own variant below)
const G1 = {
  g1_thunder: {
    us: M('Lightning Rising Tap', [6, 8, 14], { ...T.jabCross({ lean: 14, hit: SIG('us', { a: 12, g: 12, hs: 11 }) }), name: 'Lightning Rising Tap' }, 5),
    ds: M('Lightning Low Catch', [8, 5, 20], { ...T.sweepLow({ drive: 1.6 }), hit: SIG('ds', { a: 22, g: 12, hs: 12 }) }, 4),
    ss: M('Lightning Step Strike', [6, 4, 16], { ...T.heelKick({ ang: 6, drive: 1.0 }), hit: SIG('ss', { a: 10, g: 14, hs: 11 }) }, 5),
    uh: M('Lightning Ascending Break', [15, 5, 30], { ...T.chop({}), hit: H('uh', { a: 78, g: 80, contact: true, hs: 18 }) }),
    dh: M('Lightning Floor Punisher', [12, 9, 28], { ...T.switchUp({ hit: H('dh', { a: 34, g: 28, hs: 18 }) }), hit: H('dh', { a: 34, g: 28, hs: 18 }) }),
    sh: M('Lightning Forward Commit', [16, 5, 34], { ...T.thrust({ drive: 5.4 }), hit: H('sh', { a: 14, g: 15, hs: 18 }) }),
    gp: M('Lightning Falling Contact', [5, 2, 18], T.gp({
      start: AIR({ lean: 30, hip: -1.0, nf: { a: 30, l: 0.7 }, ff: { a: 40, l: 0.7 }, nh: { a: 40, l: 0.5 }, fh: { a: 60, l: 0.5 } }),
      mid: AIR({ lean: 62, hip: -1.1, nf: { a: 150, l: 1.0 }, ff: { a: 160, l: 1.0 }, nh: { a: -20, l: 0.58 }, fh: { a: -10, l: 0.5 } }),
      dive: P({ lean: 82, hip: -1.15, dy: -0.1, nf: { a: 170, l: 1.0 }, ff: { a: 178, l: 1.0 }, nh: { a: -35, l: 0.58 }, fh: { a: -20, l: 0.5 } }),
      land: P({ lean: 54, hip: -0.62, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -50, l: 0.58 }, fh: { a: 20, l: 0.4 } }),
      limb: (o) => fist('nh', { r: [12, 13], ...o }) })),
    rc: M('Lightning Return Step', [8, 20, 16], T.rc({ vx: 5.6, vy: -6.4, trailA: 'nf',
      setup: AIR({ lean: 30, hip: -0.95, nf: { a: 30, l: 0.8 }, ff: { a: -30, l: 1.0 }, nh: { a: 20, l: 0.5 }, fh: { a: 60, l: 0.5 } }),
      go: AIR({ lean: 48, hip: -1.0, rot: 18, nf: { a: 10, l: 1.1 }, ff: { a: -20, l: 1.0 }, nh: { a: 5, l: 0.58 }, fh: { a: 30, l: 0.5 } }) })),
    sp: M('Lightning Signature Finish', [30, 7, 32], T.super({ limb: (o) => fist('fh', { r: [14, 15], ...o }), hit: H('sp', { a: 34, g: 30, bkb: 11, kbg: 0.1387, hs: 24 }),
      feint: P({ lean: 14, hip: -0.98, nf: [0.5, 0], ff: [-0.35, 0], nh: { a: 3, l: 0.5 }, fh: { a: 30, l: 0.3 } }),
      reposition: P({ lean: 34, hip: -0.8, nf: [0.8, 0], ff: [-0.6, 0], nh: { a: 20, l: 0.3 }, fh: { a: 120, l: 0.4 } }),
      wind: P({ lean: -22, hip: -0.84, nf: [0.3, 0], ff: [-0.72, 0], nh: { a: 40, l: 0.3 }, fh: { a: 165, l: 0.45 } }),
      finish: P({ lean: 40, hip: -0.88, rot: 12, nf: [0.75, 0], ff: [-0.55, 0], nh: { a: 40, l: 0.3 }, fh: { a: 2, l: 0.58 } }) })),
  },
  g1_fire: {
    us: M('Fire Rising Tap', [6, 5, 14], { ...T.kneeRise({}), hit: SIG('us', { a: 82, g: 70, hs: 11 }) }, 5),
    ds: M('Fire Low Catch', [8, 5, 18], { ...T.shoulder({ drive: 2.8 }), hit: SIG('ds', { a: 16, g: 14, hs: 12, kbg: 0.1 }) }, 5),
    ss: M('Fire Step Strike', [6, 5, 16], { ...T.elbowSpin({}), hit: SIG('ss', { a: 24, g: 22, hs: 11 }) }, 5),
    uh: M('Fire Ascending Break', [14, 9, 30], { ...T.switchUp({ hit: H('uh', { a: 52, g: 52, hs: 18 }) }), hit: H('uh', { a: 52, g: 52, hs: 18 }) }),
    dh: M('Fire Floor Punisher', [14, 6, 30], { ...T.counter({}), hit: H('dh', { a: 36, g: 30, hs: 20 }) }),
    sh: M('Fire Forward Commit', [14, 10, 34], { ...T.diveKick({}), hit: H('sh', { a: 30, g: 22, hs: 18 }) }),
    gp: M('Fire Falling Contact', [5, 2, 18], T.gp({
      start: AIR({ lean: 20, hip: -1.05, nf: { a: 50, l: 0.6 }, ff: { a: 60, l: 0.6 } }),
      mid: AIR({ lean: 30, hip: -1.1, nf: { a: -20, l: 1.1 }, ff: { a: 30, l: 0.6 }, nh: { a: 70, l: 0.4 }, fh: { a: 40, l: 0.4 } }),
      dive: P({ lean: 34, hip: -1.1, nf: { a: -48, l: 1.17 }, ff: { a: 20, l: 0.6 }, nh: { a: 60, l: 0.4 }, fh: { a: 30, l: 0.4 } }),
      land: P({ lean: 52, hip: -0.6, nf: [1.0, -0.03], ff: [-0.5, 0], nh: { a: -78, l: 0.55 }, fh: { a: -50, l: 0.4 } }),
      rec: P({ lean: 0, hip: -1.1, dy: -0.2, nf: { a: 70, l: 0.62 }, ff: [-0.4, 0], nh: { a: 80, l: 0.4 }, fh: { a: 60, l: 0.4 } }),
      limb: (o) => shin('nf', o) })),
    rc: M('Fire Return Step', [8, 20, 16], T.rc({ vx: 4.2, vy: -8.6, trailA: 'nf',
      setup: AIR({ lean: 18, hip: -0.9, nf: { a: 30, l: 0.7 }, ff: { a: 50, l: 0.7 }, nh: { a: -20, l: 0.4 }, fh: { a: -10, l: 0.4 } }),
      go: AIR({ lean: 20, hip: -1.15, dy: -0.2, nf: { a: 40, l: 1.17 }, ff: { a: -40, l: 1.0 }, nh: { a: 100, l: 0.5 }, fh: { a: 60, l: 0.5 } }) })),
    sp: M('Fire Signature Finish', [30, 7, 32], T.super({ limb: (o) => knee({ ...o, r: [13, 14] }), hit: H('sp', { a: 74, g: 66, bkb: 11, kbg: 0.1387, hs: 24 }),
      feint: P({ lean: 40, hip: -0.7, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 } }),
      reposition: P({ lean: 30, hip: -0.82, nf: [0.7, 0], ff: [-0.6, 0], nh: { a: 20, l: 0.4 }, fh: { a: 30, l: 0.4 } }),
      wind: P({ lean: 40, hip: -0.62, nf: [0.4, 0], ff: [-0.45, 0], nh: { a: -40, l: 0.4 }, fh: { a: -30, l: 0.4 } }),
      finish: P({ lean: 2, hip: -1.18, dy: -0.34, nf: { a: 78, l: 0.62 }, ff: [-0.5, 0], nh: { a: 80, l: 0.4 }, fh: { a: 50, l: 0.4 } }) })),
  },
  g1_water: {
    us: M('Water Rising Tap', [6, 4, 15], { ...T.heelKick({ ang: 12, drive: 1.4 }), hit: SIG('us', { a: 14, g: 14, hs: 11 }) }, 5),
    ds: M('Water Low Catch', [9, 4, 18], { ...T.backfist({}), hit: SIG('ds', { a: 20, g: 14, hs: 12 }) }, 4),
    ss: M('Water Step Strike', [7, 5, 17], { ...T.palm({ lean: 28 }), hit: SIG('ss', { a: 10, g: 12, hs: 14 }) }, 5),
    uh: M('Water Ascending Break', [14, 6, 30], { ...T.counter({ palm: true }), hit: H('uh', { a: 34, g: 30, hs: 20 }) }),
    dh: M('Water Floor Punisher', [16, 5, 32], { ...T.load({ limb: 'fist', drive: 2.4 }), hit: H('dh', { a: 28, g: 24, hs: 18 }) }),
    sh: M('Water Forward Commit', [13, 11, 32], { ...T.sweepRise({ hit0: H('sh', { a: 8, g: 10, hs: 14, kbg: 0.08 }), hit1: H('sh', { a: 76, g: 70, hs: 18 }) }), hit: H('sh', { a: 76, g: 70, hs: 18 }) }),
    gp: M('Water Falling Contact', [5, 2, 18], T.gp({
      start: AIR({ lean: 14, hip: -1.05, nh: { a: 30, l: 0.4 }, fh: { a: 60, l: 0.4 } }),
      mid: AIR({ lean: 30, hip: -1.08, nf: { a: -60, l: 1.0 }, ff: { a: -80, l: 1.0 }, nh: { a: 5, l: 0.58 }, fh: { a: 40, l: 0.3 } }),
      dive: P({ lean: 40, hip: -1.1, nf: { a: -75, l: 1.1 }, ff: { a: -85, l: 1.1 }, nh: { a: -60, l: 0.58 }, fh: { a: 20, l: 0.3 } }),
      land: P({ lean: 34, hip: -0.9, nf: [0.65, 0], ff: [-0.5, 0], nh: { a: 28, l: 0.3 }, fh: { a: 2, l: 0.58 } }),
      limb: (o) => (o.when === 'dive' ? fist('nh', o) : fist('fh', o)) })),
    rc: M('Water Return Step', [8, 20, 16], T.rc({ vx: 6.2, vy: -5.0, trailA: 'nf',
      setup: AIR({ lean: 44, hip: -0.8, nf: [0.6, 0.1], ff: [-0.5, 0.1], nh: { a: -30, l: 0.5 }, fh: { a: 140, l: 0.5 } }),
      go: AIR({ lean: 52, hip: -0.85, nf: [0.7, 0.05], ff: [-0.55, 0.05], nh: { a: 20, l: 0.58 }, fh: { a: 150, l: 0.58 } }) })),
    sp: M('Water Signature Finish', [30, 7, 32], T.super({ limb: (o) => shoulder({ ...o, r: [16, 17] }), hit: H('sp', { a: 22, g: 20, bkb: 11, kbg: 0.1387, hs: 24 }),
      feint: P({ lean: -4, hip: -0.98, nf: [0.35, 0], ff: [-0.4, 0], nh: { a: 100, l: 0.4 }, fh: { a: 80, l: 0.4 } }),
      reposition: P({ lean: 40, hip: -0.7, nf: [0.9, 0], ff: [-0.6, 0], nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 } }),
      wind: P({ lean: 44, hip: -0.74, nf: [0.6, 0], ff: [-0.55, 0], nh: { a: -35, l: 0.4 }, fh: { a: -25, l: 0.4 } }),
      finish: P({ lean: 56, hip: -0.76, dx: 0.24, nf: [0.75, 0], ff: [-0.5, 0], nh: { a: -42, l: 0.4 }, fh: { a: -32, l: 0.4 }, head: 6 }) })),
  },
  g1_grass: {
    us: M('Grass Rising Tap', [6, 5, 15], { ...T.elbowSpin({ drive: 1.0 }), hit: SIG('us', { a: 30, g: 26, hs: 11 }) }, 5),
    ds: M('Grass Low Catch', [8, 5, 20], { ...T.drawCut({}), hit: SIG('ds', { a: 24, g: 20, hs: 12 }) }, 5),
    ss: M('Grass Step Strike', [6, 8, 15], { ...T.jabCross({ lean: 12, step: 0.5, hit: SIG('ss', { a: 12, g: 12, hs: 11 }) }) }, 5),
    uh: M('Grass Ascending Break', [17, 5, 32], { ...T.load({ limb: 'fist', drive: 2.0 }), hit: H('uh', { a: 66, g: 62, hs: 18 }) }),
    dh: M('Grass Floor Punisher', [13, 5, 32], { ...T.kneeRise({ drive: 1.8 }), hit: H('dh', { a: 84, g: 76, hs: 18 }) }),
    sh: M('Grass Forward Commit', [15, 10, 34], { ...T.jabCross({ lean: 22, step: 0.7, drive: 2.2, hit: H('sh', { a: 14, g: 14, hs: 18 }) }) }),
    gp: M('Grass Falling Contact', [5, 2, 18], T.gp({
      start: AIR({ lean: 16, hip: -1.05, nf: { a: 20, l: 0.8 }, ff: { a: -20, l: 0.9 } }),
      mid: AIR({ lean: 34, hip: -1.1, nf: { a: 0, l: 1.1 }, ff: { a: -60, l: 1.0 }, nh: { a: -20, l: 0.4 }, fh: { a: 0, l: 0.4 } }),
      dive: P({ lean: 46, hip: -1.05, nf: { a: -30, l: 1.17 }, ff: { a: -70, l: 1.0 }, nh: { a: -30, l: 0.4 }, fh: { a: -10, l: 0.4 } }),
      land: P({ lean: 54, hip: -0.6, nf: [1.05, -0.03], ff: [-0.55, 0], nh: { a: -82, l: 0.55 }, fh: { a: -60, l: 0.4 } }),
      limb: (o) => shin('nf', o) })),
    rc: M('Grass Return Step', [10, 22, 16], T.rc({ vx: 2.4, vy: -10.2, trailA: 'nf',
      setup: AIR({ lean: 36, hip: -0.62, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: -50, l: 0.5 }, fh: { a: -40, l: 0.5 } }),
      go: AIR({ lean: -4, hip: -1.3, dy: -0.4, nf: { a: -90, l: 1.17 }, ff: { a: -100, l: 1.17 }, nh: { a: 100, l: 0.58 }, fh: { a: 80, l: 0.58 } }) })),
    sp: M('Grass Signature Finish', [30, 7, 32], T.super({ limb: (o) => palm('nh', { ...o, r: [11, 12] }), hit: H('sp', { a: 18, g: 18, bkb: 11, kbg: 0.1387, hs: 24 }),
      feint: P({ lean: 20, hip: -0.9, nf: [0.5, 0], ff: [-0.4, 0], nh: { a: 10, l: 0.5 }, fh: { a: 40, l: 0.3 } }),
      reposition: P({ lean: 40, hip: -0.7, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: -50, l: 0.5 }, fh: { a: -40, l: 0.4 } }),
      wind: P({ lean: -8, hip: -0.98, nf: [0.3, 0], ff: [-0.45, 0], nh: { a: 140, l: 0.22 }, fh: { a: 30, l: 0.3 } }),
      finish: P({ lean: 34, hip: -0.9, nf: [0.65, 0], ff: [-0.5, 0], nh: { a: 3, l: 0.58 }, fh: { a: 40, l: 0.3 } }) })),
  },
  g1_ice: {
    us: M('Ice Rising Tap', [6, 4, 14], { ...T.palm({ lean: 22, drive: 2.4 }), hit: SIG('us', { a: 12, g: 12, hs: 13 }) }, 5),
    ds: M('Ice Low Catch', [8, 5, 18], { ...T.hook({}), hit: SIG('ds', { a: 18, g: 16, hs: 12 }) }, 4),
    ss: M('Ice Step Strike', [6, 5, 16], { ...T.kneeRise({ drive: 2.6 }), hit: SIG('ss', { a: 80, g: 68, hs: 11 }) }, 5),
    uh: M('Ice Ascending Break', [15, 6, 32], { ...T.kneeRise({ drive: 3.4 }), hit: H('uh', { a: 84, g: 76, hs: 18 }) }),
    dh: M('Ice Floor Punisher', [13, 7, 30], { ...T.shoulder({ drive: 4.0 }), hit: H('dh', { a: 12, g: 14, hs: 20, kbg: 0.1709 }) }),
    sh: M('Ice Forward Commit', [15, 8, 34], { ...T.sweepLow({ drive: 3.4 }), hit: H('sh', { a: 10, g: 12, hs: 17 }) }),
    gp: M('Ice Falling Contact', [5, 2, 18], T.gp({
      start: AIR({ lean: 20, hip: -1.05 }),
      mid: AIR({ lean: 30, hip: -1.05, nh: { a: 30, l: 0.3 }, fh: { a: 60, l: 0.3 }, nf: { a: -50, l: 1.0 }, ff: { a: -70, l: 1.0 } }),
      dive: P({ lean: 44, hip: -1.1, rot: 16, nh: { a: -70, l: 0.3 }, fh: { a: 40, l: 0.3 }, nf: { a: -70, l: 1.0 }, ff: { a: -80, l: 1.0 } }),
      land: P({ lean: 36, hip: -0.85, rot: 20, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: 20, l: 0.26 }, fh: { a: 40, l: 0.3 } }),
      limb: (o) => elbow('ne', { ...o, r: [12, 13] }) })),
    rc: M('Ice Return Step', [8, 20, 16], T.rc({ vx: 5.2, vy: -6.8, trailA: 'nf',
      setup: AIR({ lean: 40, hip: -0.85, nf: [0.7, 0], ff: [-0.55, 0], nh: { a: -30, l: 0.5 }, fh: { a: 140, l: 0.5 } }),
      go: AIR({ lean: 34, hip: -1.0, nf: { a: 20, l: 1.1 }, ff: { a: -50, l: 1.0 }, nh: { a: 60, l: 0.5 }, fh: { a: 120, l: 0.5 } }) })),
    sp: M('Ice Signature Finish', [30, 7, 32], T.super({ limb: (o) => fist('nh', { ...o, len: [4, 14], r: [10, 11] }), hit: H('sp', { a: 20, g: 18, bkb: 11, kbg: 0.1387, hs: 24 }),
      feint: P({ lean: 12, hip: -0.95, nf: [0.5, 0], ff: [-0.35, 0], nh: { a: 40, l: 0.4 }, fh: { a: 30, l: 0.3 } }),
      reposition: P({ lean: 44, hip: -0.8, nf: [0.9, 0], ff: [-0.55, 0], nh: { a: -10, l: 0.4 }, fh: { a: 40, l: 0.3 } }),
      wind: P({ lean: 14, hip: -0.95, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: -10, l: 0.2 }, fh: { a: 30, l: 0.3 } }),
      finish: P({ lean: 34, hip: -0.9, nf: [0.75, 0], ff: [-0.5, 0], nh: { a: 2, l: 0.58 }, fh: { a: 40, l: 0.3 } }) })),
  },
};

// ── registry consumed by mvBuild / Codex ──
export const V2MOVES = G1;
export const MOVE_NAMES = Object.fromEntries(Object.entries(G1).map(([c, s]) => [c, Object.fromEntries(Object.entries(s).map(([k, m]) => [k, m.name]))]));

export { T, K, END, AIR, H, LIGHT, SIG, hb, fist, palm, foot, shin, knee, elbow, shoulder, forearm, weapon, weaponTip, trail, G1 };
