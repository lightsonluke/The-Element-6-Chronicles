// mvArchV2g2.js — Generation II (Renji, Kaito, Hana, Daigo, Suzu, Mai, Osamu, Yui, Ibuki, Nishikawa, Itto, Twin Foxes, Utsuro).
// Same rules as mvArchV2.js: every collision shape is a small capsule on the striking part, effects are cosmetic,
// multi-phase moves declare stages, counters answer only after a real hit, recoveries travel toward the stage.
import { P, GUARD } from './mvCore.js';
import { KB } from './mvKB.js';
import { T, K, END, AIR, H, SIG, hb, fist, palm, foot, shin, knee, elbow, shoulder, forearm, weapon, weaponTip, trail } from './mvArchV2.js';

// ── strike bundles: finishing pose + the ONE body part that collides ──
const STR = {
  fist: { pose: { lean: 34, hip: -0.9, nf: [0.65, 0], ff: [-0.5, 0], nh: { a: 3, l: 0.58 }, fh: { a: 36, l: 0.3 } }, fx: (o) => fist('nh', { r: [11, 12], ...o }) },
  cross: { pose: { lean: 36, hip: -0.92, rot: 8, nf: [0.65, 0], ff: [-0.45, 0], nh: { a: 28, l: 0.3 }, fh: { a: 2, l: 0.58 } }, fx: (o) => fist('fh', { r: [11, 12], ...o }) },
  palm: { pose: { lean: 30, hip: -0.92, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: 3, l: 0.58 }, fh: { a: 40, l: 0.3 } }, fx: (o) => palm('nh', o) },
  elbow: { pose: { lean: 28, hip: -0.92, rot: 24, nf: [0.58, 0], ff: [-0.35, 0], nh: { a: 6, l: 0.24 }, fh: { a: 30, l: 0.4 } }, fx: (o) => elbow('ne', o) },
  knee: { pose: { lean: 2, hip: -1.17, dy: -0.34, nf: [0.6, -0.6], ff: [-0.5, -0.02], nh: { a: 75, l: 0.4 }, fh: { a: 50, l: 0.4 } }, fx: (o) => knee(o) },
  heel: { pose: { lean: -14, hip: -1.0, nf: { a: 8, l: 1.17 }, ff: [-0.2, 0], nh: { a: 110, l: 0.4 }, fh: { a: 60, l: 0.4 } }, fx: (o) => foot('nf', o) },
  shoulder: { pose: { lean: 52, hip: -0.78, dx: 0.22, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: -40, l: 0.4 }, fh: { a: -30, l: 0.4 } }, fx: (o) => shoulder(o) },
  hook: { pose: { lean: 20, hip: -0.95, rot: 18, nf: [0.5, 0], ff: [-0.4, 0], nh: { a: 14, l: 0.58 }, fh: { a: 40, l: 0.3 } }, fx: (o) => fist('nh', o) },
  backfist: { pose: { lean: 20, hip: -0.97, rot: 12, nf: [0.5, 0], ff: [-0.38, 0], nh: { a: -6, l: 0.58 }, fh: { a: 36, l: 0.3 } }, fx: (o) => fist('nh', o) },
  shin: { pose: { lean: 56, hip: -0.6, nf: [1.05, -0.03], ff: [-0.55, 0], nh: { a: -82, l: 0.55 }, fh: { a: -60, l: 0.4 } }, fx: (o) => shin('nf', o) },
  round: { pose: { lean: 20, hip: -1.0, rot: 30, nf: { a: 6, l: 1.17 }, ff: [-0.3, 0], nh: { a: 150, l: 0.4 }, fh: { a: 100, l: 0.4 } }, fx: (o) => foot('nf', o) },
  weapon: { pose: { lean: 30, hip: -0.9, nf: [0.65, 0], ff: [-0.5, 0], nh: { a: 2, l: 0.58 }, fh: { a: 8, l: 0.5 } }, fx: (o, w) => weapon('nh', { ...o, ...w }) },
  chop: { pose: { lean: 34, hip: -0.9, nf: [0.62, 0], ff: [-0.5, 0], nh: { a: -14, l: 0.58 }, fh: { a: -8, l: 0.52 } }, fx: (o, w) => weapon('nh', { ...o, ...w }) },
  throw: { pose: { lean: 30, rot: 34, hip: -0.9, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -30, l: 0.5 }, fh: { a: -20, l: 0.5 } }, fx: (o) => palm('nh', { ...o, r: [11, 12] }) },
};

// ── three more templates ──
// whole-body turn, ONE boot arc at waist height
T.spin = (o = {}) => ({ phys: true, keys: [K(0, GUARD),
  K(0.6, P({ lean: -10, hip: -0.98, rot: -30, nf: [0.2, 0], ff: [-0.5, 0], nh: { a: 150, l: 0.4 }, fh: { a: 120, l: 0.4 } }), 'in'),
  K(1, P({ lean: 18, hip: -1.0, rot: 30, nf: { a: 6, l: 1.17 }, ff: [-0.3, 0], nh: { a: 150, l: 0.4 }, fh: { a: 100, l: 0.4 } }), 'snap'),
  K(1.5, P({ lean: 22, hip: -1.0, rot: 60, nf: { a: 4, l: 1.17 }, ff: [-0.3, 0], nh: { a: 150, l: 0.4 } }), 'out'), ...END()],
  fx: [foot('nf', { u: [0.05, 0.62], r: [12, 13] })], drive: [{ at: [0.7, 1.3], vx: o.drive ?? 1.8 }] });
// half-step back (harmless), let the approach pass, dart forward into ONE strike
T.retreatReturn = (o = {}) => { const S = STR[o.limb || 'fist'];
  return { phys: true, keys: [K(0, GUARD),
    K(0.4, P({ lean: -14, hip: -0.95, nf: [0.1, 0], ff: [-0.62, 0], nh: { a: 40, l: 0.4 }, fh: { a: 50, l: 0.4 } }), 'out'),
    K(0.92, P({ lean: -16, hip: -0.96, nf: [0.1, 0], ff: [-0.64, 0], nh: { a: 50, l: 0.4 }, fh: { a: 60, l: 0.4 } }), 'lin'),
    K(1, P({ hip: -0.9, ...S.pose }), 'snap'), K(1.6, P({ hip: -0.9, ...S.pose, lean: (S.pose.lean || 30) + 3 }), 'lin'), ...END()],
    fx: [S.fx({ u: [0, 0.75] }, { wlen: o.wlen, wstyle: o.wstyle })], drive: [{ at: [0.15, 0.85], vx: -3.4 }, { at: [0.85, 1.5], vx: o.drive ?? 5.4 }] }; };
// close-range catch, pivot over the hip, toss.  (A brief palm-contact check on the hands; no lingering grab box.)
T.throw = (o = {}) => ({ phys: true, grab: { at: 2.4 }, keys: [K(0, GUARD),
  K(0.5, P({ lean: 18, hip: -0.95, nf: [0.5, 0], ff: [-0.4, 0], nh: { a: 6, l: 0.5 }, fh: { a: 16, l: 0.5 } }), 'out'),
  K(1, P({ lean: 14, hip: -0.92, nf: [0.55, 0], ff: [-0.4, 0], nh: { a: 22, l: 0.5 }, fh: { a: 28, l: 0.5 } }), 'snap'),
  K(1.5, P({ lean: 14, hip: -0.92, nf: [0.55, 0], ff: [-0.4, 0], nh: { a: 22, l: 0.5 }, fh: { a: 28, l: 0.5 } }), 'lin'),
  K(2.0, P({ lean: 24, hip: -0.9, rot: 30, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -30, l: 0.5 }, fh: { a: -20, l: 0.5 } }), 'io'),
  K(2.4, P({ lean: 32, hip: -0.9, rot: 52, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -50, l: 0.5 }, fh: { a: -40, l: 0.5 } }), 'out'), K(3, GUARD, 'io')],
  fx: [palm('nh', { u: [0, 0.45], r: [11, 12] }), palm('fh', { u: [0, 0.45], r: [11, 12] })], drive: [{ at: [0.6, 1.1], vx: o.drive ?? 2.2 }] });

// ── per-slot hit shaping (angle = along the strike, hs = base hitstun) ──
const ANG = { jabCross: { a: 12 }, kneeRise: { a: 80, g: 70 }, elbowSpin: { a: 26, g: 22 }, heelKick: { a: 10, g: 12 }, palm: { a: 10, g: 12, hs: 14 }, hook: { a: 18, g: 16 },
  backfist: { a: 20, g: 14 }, sweepLow: { a: 14, g: 12 }, shoulder: { a: 14, g: 14 }, chop: { a: 78, g: 76, contact: true }, thrust: { a: 14, g: 14 }, drawCut: { a: 24, g: 20 },
  switchUp: { a: 34, g: 28 }, counter: { a: 34, g: 30, hs: 20 }, load: { a: 28, g: 24 }, sweepRise: { a: 76, g: 70 }, diveKick: { a: 30, g: 22 }, throw: { a: 42, g: 38, hs: 22 },
  retreatReturn: { a: 20, g: 18 }, spin: { a: 16, g: 16 } };
const FRS = { jabCross: { sig: [6, 8, 14], heavy: [15, 10, 34] }, switchUp: { heavy: [12, 9, 28] }, sweepRise: { heavy: [13, 11, 32] }, counter: { heavy: [14, 6, 30] }, load: { heavy: [16, 5, 32] },
  thrust: { sig: [8, 4, 18], heavy: [15, 5, 34] }, diveKick: { heavy: [14, 10, 34] }, throw: { heavy: [12, 5, 40] }, retreatReturn: { sig: [8, 4, 18], heavy: [14, 6, 30] }, spin: { sig: [8, 4, 18], heavy: [15, 6, 34] },
  sweepLow: { sig: [8, 5, 20], heavy: [14, 6, 32] }, drawCut: { sig: [8, 5, 20], heavy: [14, 6, 32] }, backfist: { sig: [9, 4, 18], heavy: [14, 5, 32] }, chop: { sig: [8, 5, 18], heavy: [15, 5, 32] },
  shoulder: { sig: [7, 5, 18], heavy: [13, 7, 30] }, hook: { sig: [7, 4, 16], heavy: [14, 5, 30] } };
const WPN = { kaito: { wlen: 52, wstyle: 'katana' }, mai: { wlen: 28, wstyle: 'dagger' }, hana: { wlen: 46, wstyle: 'staff' }, ibuki: { wlen: 42, wstyle: 'staff' }, yui: { wlen: 38, wstyle: 'staff' }, daigo: { wlen: 36, wstyle: 'staff' }, utsuro: { wlen: 40, wstyle: 'staff' }, nishikawa: { wlen: 34, wstyle: 'staff' }, renji: { wlen: 44, wstyle: 'staff' } };

function mk(who, spd, slot, tpl, name, o = {}) {
  const sig = slot === 'us' || slot === 'ds' || slot === 'ss', an = ANG[tpl] || {}, w = WPN[who] || {};
  const hit = sig ? SIG(slot, { a: an.a, g: an.g ?? an.a, hs: an.hs ?? 11, ...o.hit }) : H(slot, { a: an.a, g: an.g ?? an.a, hs: an.hs ?? 18, contact: an.contact, ...o.hit });
  const hit0 = { ...hit, a: 8, g: 10, hs: 14, kbg: (hit.kbg || 0.1) * 0.5 };
  const def = T[tpl]({ ...w, hit, hit0, hit1: { ...hit, a: 76, g: 70 }, ...o });
  const fr = ((FRS[tpl] || {})[sig ? 'sig' : 'heavy'] || (sig ? [6, 5, 15] : [14, 6, 30])).slice();
  fr[0] = Math.max(4, Math.round(fr[0] * spd)); fr[2] = Math.round(fr[2] * (0.5 + spd / 2));
  return { name, fr, def: { ...def, hit }, dmgMul: sig ? 0.55 : undefined };
}

// ── ground pound: its own dive animation; hit belongs only to the named striking part ──
const A = AIR;
const GPK = {
  draw: { start: A({ lean: 10, nh: { a: 175, l: 0.3 } }), mid: A({ lean: 30, nh: { a: 70, l: 0.58 } }), dive: P({ lean: 52, hip: -1.1, rot: 10, nh: { a: -45, l: 0.58 }, fh: { a: 20, l: 0.3 } }), land: P({ lean: 30, hip: -0.9, nh: { a: -50, l: 0.55 } }), limb: (o, w) => weapon('nh', { ...o, ...w }) },
  chop: { start: A({ lean: -6, nh: { a: 130, l: 0.58 }, fh: { a: 120, l: 0.58 } }), mid: A({ lean: -10, nh: { a: 140, l: 0.58 }, fh: { a: 130, l: 0.58 } }), dive: P({ lean: 48, hip: -1.1, nh: { a: -40, l: 0.58 }, fh: { a: -30, l: 0.52 } }), land: P({ lean: 36, hip: -0.88, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: -48, l: 0.58 }, fh: { a: -40, l: 0.5 } }), limb: (o, w) => weapon('nh', { ...o, ...w }) },
  round: { start: A({ lean: -8, rot: -30, nf: { a: 30, l: 0.8 } }), mid: A({ lean: 30, rot: 100, nf: { a: 10, l: 1.17 } }), dive: P({ lean: 50, hip: -1.1, rot: 200, nf: { a: -25, l: 1.17 }, ff: { a: -60, l: 1 } }), land: P({ lean: 24, hip: -0.95, rot: 30, nf: { a: 6, l: 1.17 }, ff: [-0.3, 0] }), limb: (o) => foot('nf', o) },
  hook: { start: A({ lean: 10, nh: { a: 160, l: 0.5 } }), mid: A({ lean: 30, rot: 20, nh: { a: 90, l: 0.58 } }), dive: P({ lean: 44, hip: -1.1, rot: 16, nh: { a: -30, l: 0.58 } }), land: P({ lean: 30, hip: -0.92, rot: 20, nf: [0.5, 0], ff: [-0.4, 0], nh: { a: 14, l: 0.58 } }), limb: (o) => fist('nh', o) },
  heel: { start: A({ lean: -4, nf: { a: 40, l: 0.7 } }), mid: A({ lean: 6, nf: { a: -30, l: 1.1 } }), dive: P({ lean: 8, hip: -1.1, nf: { a: -82, l: 1.17 }, ff: { a: -60, l: 0.9 } }), land: P({ lean: 20, hip: -0.9, nf: [0.6, 0], ff: [-0.4, 0] }), limb: (o) => foot('nf', o) },
  back: { start: A({ lean: 10, nh: { a: 100, l: 0.5 } }), mid: A({ lean: 20, rot: -8, nh: { a: 112, l: 0.5 } }), dive: P({ lean: 34, hip: -1.1, nh: { a: 20, l: 0.58 } }), land: P({ lean: 22, hip: -0.95, rot: 12, nf: [0.5, 0], ff: [-0.38, 0], nh: { a: -6, l: 0.58 } }), limb: (o) => fist('nh', o) },
  knee: { start: A({ lean: 10, nf: [0.3, 0] }), mid: A({ lean: 16, nf: [0.5, -0.5] }), dive: P({ lean: 12, hip: -1.15, nf: [0.6, -0.62], ff: [-0.4, 0] }), land: P({ lean: 4, hip: -1.1, dy: -0.2, nf: [0.62, -0.62], ff: [-0.5, 0] }), limb: (o) => knee(o) },
  shoulder: { start: A({ lean: 30 }), mid: A({ lean: 60, nh: { a: -40, l: 0.4 } }), dive: P({ lean: 78, hip: -1.1, nh: { a: -60, l: 0.4 }, fh: { a: -50, l: 0.4 } }), land: P({ lean: 56, hip: -0.78, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: -40, l: 0.4 } }), limb: (o) => shoulder(o) },
  throw: { start: A({ lean: 20, nh: { a: 20, l: 0.5 }, fh: { a: 30, l: 0.5 } }), mid: A({ lean: 40, nh: { a: -10, l: 0.58 }, fh: { a: 0, l: 0.58 } }), dive: P({ lean: 56, hip: -1.1, nh: { a: -40, l: 0.58 }, fh: { a: -30, l: 0.58 } }), land: P({ lean: 30, rot: 34, hip: -0.9, nh: { a: -30, l: 0.5 }, fh: { a: -20, l: 0.5 } }), limb: (o) => palm('nh', { ...o, r: [11, 12] }) },
  retreat: { start: A({ lean: -20 }), mid: A({ lean: -24, nf: { a: 60, l: 0.7 } }), dive: P({ lean: 30, hip: -1.1, nf: { a: -30, l: 1 }, ff: { a: -60, l: 1 }, nh: { a: 20, l: 0.3 }, fh: { a: 10, l: 0.3 } }), land: P({ lean: 28, hip: -0.92, rot: 24, nf: [0.58, 0], ff: [-0.35, 0], nh: { a: 6, l: 0.24 } }), limb: (o) => elbow('ne', o), drive: [{ at: [0.5, 1], vx: -2 }, { at: [1.05, 1.6], vx: 3 }] },
  pair: { start: A({ lean: 20, nh: { a: 30, l: 0.5 } }), mid: A({ lean: 34, nh: { a: 5, l: 0.58 }, nf: { a: -40, l: 1 } }), dive: P({ lean: 40, hip: -1.1, nh: { a: -50, l: 0.58 }, nf: { a: -60, l: 1.1 }, ff: { a: -80, l: 1 } }), land: P({ lean: 24, hip: -0.95, rot: 14, nf: [0.35, 0], ff: { a: 176, l: 1.17 }, nh: { a: 20, l: 0.4 } }), limb: (o) => (o.when === 'dive' ? fist('nh', o) : shin('ff', o)) },
  counter: { start: A({ lean: -8, nh: { a: 55, l: 0.4 }, fh: { a: 70, l: 0.4 } }), mid: A({ lean: -8, nh: { a: 55, l: 0.4 }, fh: { a: 70, l: 0.4 } }), dive: P({ lean: 6, hip: -1.1, nh: { a: 55, l: 0.4 }, fh: { a: 70, l: 0.4 }, nf: { a: -70, l: 1 }, ff: { a: -80, l: 1 } }), land: P({ lean: 28, hip: -0.9, rot: 14, nf: [0.6, 0], ff: [-0.45, 0], nh: { a: 10, l: 0.26 } }), limb: (o) => elbow('ne', o) },
  jab: { start: A({ lean: 14, nh: { a: 30, l: 0.4 } }), mid: A({ lean: 30, nh: { a: 5, l: 0.58 } }), dive: P({ lean: 40, hip: -1.1, nh: { a: -60, l: 0.58 }, nf: { a: -75, l: 1.1 }, ff: { a: -85, l: 1.1 } }), land: P({ lean: 34, hip: -0.9, nf: [0.65, 0], ff: [-0.5, 0], nh: { a: 28, l: 0.3 }, fh: { a: 2, l: 0.58 } }), limb: (o) => (o.when === 'dive' ? fist('nh', o) : fist('fh', o)) },
  trip: { start: A({ lean: 20, nf: { a: 50, l: 0.6 } }), mid: A({ lean: 30, nf: { a: -20, l: 1.1 } }), dive: P({ lean: 34, hip: -1.1, nf: { a: -48, l: 1.17 } }), land: P({ lean: 52, hip: -0.6, nf: [1.0, -0.03], ff: [-0.5, 0], nh: { a: -78, l: 0.55 } }), limb: (o) => shin('nf', o) },
};
const gp = (kind, who) => ({ name: null, fr: [5, 2, kind === 'throw' ? 30 : 18], def: { ...T.gp({ ...GPK[kind], limb: (o) => GPK[kind].limb(o, WPN[who] || {}) }), ...(kind === 'throw' ? { grab: { at: 2.38 } } : {}) } });

// ── recovery presets ──
const RCP = {
  reach: { setup: A({ lean: 20, hip: -1.0, nh: { a: 55, l: 0.58 }, fh: { a: 30, l: 0.4 }, nf: { a: -60, l: 1 }, ff: { a: -80, l: 1 } }), go: A({ lean: 34, hip: -0.95, rot: 14, nh: { a: 48, l: 0.58 }, nf: { a: 10, l: 1.1 }, ff: { a: -40, l: 1 } }) },
  draw: { setup: A({ lean: 10, hip: -0.95, nh: { a: 175, l: 0.3 }, fh: { a: 20, l: 0.3 } }), go: A({ lean: 40, hip: -0.95, rot: 12, nh: { a: 20, l: 0.58 }, nf: { a: 20, l: 1.1 }, ff: { a: -30, l: 1 } }) },
  tuck: { setup: A({ lean: 30, hip: -0.9, nf: { a: 50, l: 0.6 }, ff: { a: 60, l: 0.6 } }), go: A({ lean: 60, hip: -0.9, rot: 60, nf: { a: 50, l: 0.6 }, ff: { a: 60, l: 0.6 }, nh: { a: -10, l: 0.3 } }) },
  spring: { setup: A({ lean: 36, hip: -0.62, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: -50, l: 0.5 }, fh: { a: -40, l: 0.5 } }), go: A({ lean: -4, hip: -1.3, dy: -0.4, nf: { a: -90, l: 1.17 }, ff: { a: -100, l: 1.17 }, nh: { a: 100, l: 0.58 }, fh: { a: 80, l: 0.58 } }) },
  blink: { setup: A({ lean: 44, hip: -0.8, nf: [0.6, 0.1], ff: [-0.5, 0.1], nh: { a: -30, l: 0.5 }, fh: { a: 140, l: 0.5 } }), go: A({ lean: -4, hip: -1.2, dy: -0.4, nf: { a: -70, l: 1.1 }, ff: { a: -100, l: 1.1 }, nh: { a: 80, l: 0.58 } }) },
};
const rc = (preset, vx, vy) => ({ fr: [9, 20, 16], def: T.rc({ ...RCP[preset], vx, vy, trailA: 'nf' }) });

// ── supers: feint → reposition (no hit) → ONE bounded finishing contact ──
const SFH = { fist: 20, cross: 20, palm: 14, elbow: 28, knee: 74, heel: 12, shoulder: 22, hook: 18, backfist: 20, shin: 14, round: 16, weapon: 24, chop: 76, throw: 40 };
const FEINT = P({ lean: 14, hip: -0.98, nf: [0.5, 0], ff: [-0.35, 0], nh: { a: 3, l: 0.5 }, fh: { a: 30, l: 0.3 } });
const REPO = P({ lean: 34, hip: -0.82, nf: [0.8, 0], ff: [-0.6, 0], nh: { a: 20, l: 0.3 }, fh: { a: 60, l: 0.4 } });
const WIND = { shin: P({ lean: 44, hip: -0.64, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -70, l: 0.5 }, fh: { a: -40, l: 0.4 } }), knee: P({ lean: 40, hip: -0.62, nf: [0.4, 0], ff: [-0.45, 0], nh: { a: -40, l: 0.4 }, fh: { a: -30, l: 0.4 } }),
  chop: P({ lean: -12, hip: -1.0, nf: [0.35, 0], ff: [-0.4, 0], nh: { a: 130, l: 0.58 }, fh: { a: 122, l: 0.58 } }), weapon: P({ lean: 6, hip: -0.95, nf: [0.45, 0], ff: [-0.45, 0], nh: { a: 175, l: 0.3 }, fh: { a: 20, l: 0.3 } }),
  shoulder: P({ lean: 40, hip: -0.74, nf: [0.6, 0], ff: [-0.55, 0], nh: { a: -35, l: 0.4 }, fh: { a: -25, l: 0.4 } }), palm: P({ lean: -8, hip: -0.98, nf: [0.3, 0], ff: [-0.45, 0], nh: { a: 140, l: 0.22 }, fh: { a: 30, l: 0.3 } }) };
const sp = (who, kind, o = {}) => { const S = STR[kind], w = WPN[who] || {};
  return { fr: [30, 7, 32], def: { ...(kind === 'throw' ? { grab: { at: 1.5 } } : {}), ...T.super({ limb: (x) => S.fx(x, w), hit: H('sp', { a: SFH[kind], g: SFH[kind], bkb: 11, kbg: 0.1387, hs: 24, contact: kind === 'chop' }),
    feint: FEINT, reposition: REPO, wind: WIND[kind] || WIND.palm, finish: P({ hip: -0.9, ...S.pose }), ...(kind === 'throw' ? { finish2: P({ lean: 34, hip: -0.9, rot: 52, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -50, l: 0.5 }, fh: { a: -40, l: 0.5 } }) } : {}), ...o }) } }; };

const nm = (n, x) => ({ ...x, name: n });
const MV = (who, spd, slot, tpl, name, o) => nm(name, mk(who, spd, slot, tpl, name, o));

// ══════════════════════ GEN II REGISTRY ══════════════════════
const G2 = {
  g2_renji: { // IRON: limbs shaped into plated weapons — physical all the way
    us: MV('renji', 1.08, 'us', 'jabCross', 'IRON Rising Tap', { lean: 14 }), ds: MV('renji', 1.08, 'ds', 'sweepLow', 'IRON Low Catch'), ss: MV('renji', 1.08, 'ss', 'heelKick', 'IRON Step Strike', { ang: 8 }),
    uh: MV('renji', 1.08, 'uh', 'shoulder', 'IRON Ascending Break', { drive: 3.6 }), dh: MV('renji', 1.08, 'dh', 'palm', 'IRON Floor Punisher', { lean: 34, drive: 2.0 }), sh: MV('renji', 1.08, 'sh', 'elbowSpin', 'IRON Forward Commit', { drive: 2.0 }),
    gp: nm('IRON Falling Contact', gp('draw', 'renji')), rc: nm('IRON Return Step', rc('reach', 5.0, -7.0)), sp: nm('IRON Signature Finish', sp('renji', 'heel', { limb: (x) => foot('nf', { ...x, r: [12, 13] }), finish: P({ hip: -1.1, lean: 30, dy: -0.28, dx: 0.35, nf: { a: -34, l: 1.17 }, ff: { a: 30, l: 0.55 }, nh: { a: 70, l: 0.4 } }), wind: P({ lean: 30, hip: -1.2, dy: -0.5, nf: { a: 55, l: 0.6 }, ff: { a: 62, l: 0.6 } }), drive: [{ at: [0.8, 1.2], vx: 4, vy: -5 }, { at: [1, 1.3], vy: 6 }] })) },
  g2_kaito: { // EMBER: katana
    us: MV('kaito', 1, 'us', 'kneeRise', 'EMBER Rising Tap'), ds: MV('kaito', 1, 'ds', 'shoulder', 'EMBER Low Catch', { drive: 2.8 }), ss: MV('kaito', 1, 'ss', 'elbowSpin', 'EMBER Step Strike'),
    uh: MV('kaito', 1, 'uh', 'palm', 'EMBER Ascending Break', { lean: 34 }), dh: MV('kaito', 1, 'dh', 'thrust', 'EMBER Floor Punisher', { drive: 5.2 }), sh: MV('kaito', 1, 'sh', 'drawCut', 'EMBER Forward Commit'),
    gp: nm('EMBER Falling Contact', gp('retreat', 'kaito')), rc: nm('EMBER Return Step', rc('draw', 5.2, -6.2)), sp: nm('EMBER Signature Finish', sp('kaito', 'shin')) },
  g2_hana: { // TIDE
    us: MV('hana', 1, 'us', 'heelKick', 'TIDE Rising Tap', { ang: 12 }), ds: MV('hana', 1, 'ds', 'backfist', 'TIDE Low Catch'), ss: MV('hana', 1, 'ss', 'palm', 'TIDE Step Strike', { lean: 28 }),
    uh: MV('hana', 1, 'uh', 'thrust', 'TIDE Ascending Break', { drive: 4.6 }), dh: MV('hana', 1, 'dh', 'diveKick', 'TIDE Floor Punisher'), sh: MV('hana', 1, 'sh', 'retreatReturn', 'TIDE Forward Commit', { limb: 'fist' }),
    gp: nm('TIDE Falling Contact', gp('throw', 'hana')), rc: nm('TIDE Return Step', rc('tuck', 4.2, -8.0)), sp: nm('TIDE Signature Finish', sp('hana', 'cross')) },
  g2_daigo: { // STONE: heavy bruiser, slow startup
    us: MV('daigo', 1.1, 'us', 'elbowSpin', 'STONE Rising Tap', { drive: 1.0 }), ds: MV('daigo', 1.1, 'ds', 'drawCut', 'STONE Low Catch'), ss: MV('daigo', 1.1, 'ss', 'jabCross', 'STONE Step Strike', { lean: 12, step: 0.5 }),
    uh: MV('daigo', 1.1, 'uh', 'diveKick', 'STONE Ascending Break'), dh: MV('daigo', 1.1, 'dh', 'sweepRise', 'STONE Floor Punisher'), sh: MV('daigo', 1.1, 'sh', 'throw', 'STONE Forward Commit', { drive: 1.8 }),
    gp: nm('STONE Falling Contact', gp('round', 'daigo')), rc: nm('STONE Return Step', rc('spring', 3.0, -9.2)), sp: nm('STONE Signature Finish', sp('daigo', 'shin')) },
  g2_suzu: { // GALE: fastest kit
    us: MV('suzu', 0.85, 'us', 'palm', 'GALE Rising Tap', { lean: 22, drive: 2.6 }), ds: MV('suzu', 0.85, 'ds', 'hook', 'GALE Low Catch'), ss: MV('suzu', 0.85, 'ss', 'kneeRise', 'GALE Step Strike', { drive: 2.4 }),
    uh: MV('suzu', 0.85, 'uh', 'sweepRise', 'GALE Ascending Break', { drive: 3.6 }), dh: MV('suzu', 0.85, 'dh', 'jabCross', 'GALE Floor Punisher', { lean: 18, step: 0.6, drive: 3.0 }), sh: MV('suzu', 0.85, 'sh', 'spin', 'GALE Forward Commit', { drive: 2.6 }),
    gp: nm('GALE Falling Contact', gp('hook', 'suzu')), rc: nm('GALE Return Step', rc('reach', 6.0, -7.0)), sp: nm('GALE Signature Finish', sp('suzu', 'elbow')) },
  g2_mai: { // DUSK: shadow-step, kunai
    us: MV('mai', 0.9, 'us', 'jabCross', 'DUSK Rising Tap', { lean: 12, step: 0.5 }), ds: MV('mai', 0.9, 'ds', 'sweepLow', 'DUSK Low Catch'), ss: MV('mai', 0.9, 'ss', 'heelKick', 'DUSK Step Strike', { ang: 4 }),
    uh: MV('mai', 0.9, 'uh', 'jabCross', 'DUSK Ascending Break', { lean: 22, step: 0.65, drive: 3.2 }), dh: MV('mai', 0.9, 'dh', 'sweepLow', 'DUSK Floor Punisher', { drive: 3.0 }), sh: MV('mai', 0.9, 'sh', 'hook', 'DUSK Forward Commit', { drive: 2.0 }),
    gp: nm('DUSK Falling Contact', gp('heel', 'mai')), rc: nm('DUSK Return Step', rc('blink', 6.4, -5.2)), sp: nm('DUSK Signature Finish', sp('mai', 'weapon')) },
  g2_osamu: { // ECHO: contact vibration only
    us: MV('osamu', 1, 'us', 'kneeRise', 'ECHO Rising Tap'), ds: MV('osamu', 1, 'ds', 'shoulder', 'ECHO Low Catch', { drive: 2.6 }), ss: MV('osamu', 1, 'ss', 'elbowSpin', 'ECHO Step Strike', { drive: 1.8 }),
    uh: MV('osamu', 1, 'uh', 'sweepLow', 'ECHO Ascending Break', { drive: 2.4 }), dh: MV('osamu', 1, 'dh', 'elbowSpin', 'ECHO Floor Punisher', { drive: 2.6 }), sh: MV('osamu', 1, 'sh', 'heelKick', 'ECHO Forward Commit', { ang: 8, drive: 1.6 }),
    gp: nm('ECHO Falling Contact', gp('back', 'osamu')), rc: nm('ECHO Return Step', rc('tuck', 3.6, -7.0)), sp: nm('ECHO Signature Finish', sp('osamu', 'fist', { fv: -3.4, rv: 5.6 })) },
  g2_yui: { // STARLIGHT
    us: MV('yui', 0.95, 'us', 'heelKick', 'STARLIGHT Rising Tap', { ang: 10 }), ds: MV('yui', 0.95, 'ds', 'backfist', 'STARLIGHT Low Catch'), ss: MV('yui', 0.95, 'ss', 'palm', 'STARLIGHT Step Strike', { lean: 26 }),
    uh: MV('yui', 0.95, 'uh', 'elbowSpin', 'STARLIGHT Ascending Break', { drive: 2.0 }), dh: MV('yui', 0.95, 'dh', 'drawCut', 'STARLIGHT Floor Punisher'), sh: MV('yui', 0.95, 'sh', 'backfist', 'STARLIGHT Forward Commit', { drive: 2.2 }),
    gp: nm('STARLIGHT Falling Contact', gp('chop', 'yui')), rc: nm('STARLIGHT Return Step', rc('spring', 3.8, -8.4)), sp: nm('STARLIGHT Signature Finish', sp('yui', 'throw')) },
  g2_ibuki: { // LIFE DRAIN: monk
    us: MV('ibuki', 1.05, 'us', 'elbowSpin', 'IBUKI Rising Tap'), ds: MV('ibuki', 1.05, 'ds', 'drawCut', 'IBUKI Low Catch'), ss: MV('ibuki', 1.05, 'ss', 'jabCross', 'IBUKI Step Strike', { lean: 12, step: 0.52 }),
    uh: MV('ibuki', 1.05, 'uh', 'drawCut', 'IBUKI Ascending Break', { drive: 2.4 }), dh: MV('ibuki', 1.05, 'dh', 'retreatReturn', 'IBUKI Floor Punisher', { limb: 'palm', drive: 5.0 }), sh: MV('ibuki', 1.05, 'sh', 'chop', 'IBUKI Forward Commit'),
    gp: nm('IBUKI Falling Contact', gp('pair', 'ibuki')), rc: nm('IBUKI Return Step', rc('blink', 5.4, -6.0)), sp: nm('IBUKI Signature Finish', sp('ibuki', 'round')) },
  g2_nishikawa: { // LIVING THREAD
    us: MV('nishikawa', 1, 'us', 'palm', 'LIVING THREAD Rising Tap', { lean: 24 }), ds: MV('nishikawa', 1, 'ds', 'hook', 'LIVING THREAD Low Catch'), ss: MV('nishikawa', 1, 'ss', 'kneeRise', 'LIVING THREAD Step Strike', { drive: 2.0 }),
    uh: MV('nishikawa', 1, 'uh', 'retreatReturn', 'LIVING THREAD Ascending Break', { limb: 'fist', drive: 5.0 }), dh: MV('nishikawa', 1, 'dh', 'throw', 'LIVING THREAD Floor Punisher', { drive: 2.6 }), sh: MV('nishikawa', 1, 'sh', 'switchUp', 'LIVING THREAD Forward Commit'),
    gp: nm('LIVING THREAD Falling Contact', gp('counter', 'nishikawa')), rc: nm('LIVING THREAD Return Step', rc('reach', 3.8, -8.6)), sp: nm('LIVING THREAD Signature Finish', sp('nishikawa', 'hook')) },
  g2_twinfoxes: { // FOXFIRE
    us: MV('twin', 0.9, 'us', 'kneeRise', 'FOXFIRE Rising Tap'), ds: MV('twin', 0.9, 'ds', 'shoulder', 'FOXFIRE Low Catch', { drive: 2.8 }), ss: MV('twin', 0.9, 'ss', 'elbowSpin', 'FOXFIRE Step Strike'),
    uh: MV('twin', 0.9, 'uh', 'spin', 'FOXFIRE Ascending Break', { drive: 2.2 }), dh: MV('twin', 0.9, 'dh', 'hook', 'FOXFIRE Floor Punisher'), sh: MV('twin', 0.9, 'sh', 'load', 'FOXFIRE Forward Commit', { limb: 'fist', drive: 3.0 }),
    gp: nm('FOXFIRE Falling Contact', gp('knee', 'twin')), rc: nm('FOXFIRE Return Step', rc('tuck', 4.4, -8.0)), sp: nm('FOXFIRE Signature Finish', sp('twin', 'backfist')) },
  g2_utsuro: { // ELEMENTOR CALL
    us: MV('utsuro', 1, 'us', 'heelKick', 'ELEMENTOR CALL Rising Tap', { ang: 10 }), ds: MV('utsuro', 1, 'ds', 'backfist', 'ELEMENTOR CALL Low Catch'), ss: MV('utsuro', 1, 'ss', 'palm', 'ELEMENTOR CALL Step Strike', { lean: 26 }),
    uh: MV('utsuro', 1, 'uh', 'hook', 'ELEMENTOR CALL Ascending Break', { drive: 1.6 }), dh: MV('utsuro', 1, 'dh', 'heelKick', 'ELEMENTOR CALL Floor Punisher', { ang: 6, drive: 1.4 }), sh: MV('utsuro', 1, 'sh', 'kneeRise', 'ELEMENTOR CALL Forward Commit', { drive: 3.0 }),
    gp: nm('ELEMENTOR CALL Falling Contact', gp('shoulder', 'utsuro')), rc: nm('ELEMENTOR CALL Return Step', rc('spring', 3.2, -9.0)), sp: nm('ELEMENTOR CALL Signature Finish', sp('utsuro', 'chop')) },
};

// ══════════════════════ ITTŌ: every move is a katana technique (disciplined, heavy, committed) ══════════════════════
const KT = { wlen: 54, wstyle: 'katana' };
const kat = (o = {}) => weapon('nh', { ...KT, ...o }), katTip = (o = {}) => weaponTip('nh', { ...KT, ...o });
const GRD = (o = {}) => P({ lean: 8, hip: -0.95, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: -25, l: 0.4 }, fh: { a: -15, l: 0.3 }, ...o });
const itto = {
  us: { name: 'Rising Draw', fr: [8, 7, 18], dmgMul: 0.55, def: { phys: true, hit: SIG('us', { a: 76, g: 70, hs: 11 }), keys: [K(0, GUARD), K(0.6, GRD({ lean: 10, nh: { a: -30, l: 0.3 } }), 'in'),
    K(1, P({ lean: 6, hip: -1.05, dy: -0.06, nf: [0.45, 0], ff: [-0.4, 0], nh: { a: 22, l: 0.58 }, fh: { a: 30, l: 0.3 } }), 'snap'), K(1.35, P({ lean: 0, hip: -1.1, dy: -0.12, nh: { a: 62, l: 0.58 } }), 'out'), K(1.7, P({ lean: -6, hip: -1.12, dy: -0.2, nh: { a: 98, l: 0.58 } }), 'out'), ...END()],
    fx: [kat({ u: [0, 0.9] })], drive: [{ at: [0.6, 1.2], vx: 1.6 }] } },
  ds: { name: 'Scabbard Trip', fr: [9, 9, 20], dmgMul: 0.55, def: { phys: true, hit: SIG('ds', { a: 12, g: 12, hs: 11 }),
    keys: [K(0, GUARD), K(0.6, P({ lean: 28, hip: -0.8, nf: [0.7, 0], ff: [-0.55, 0], nh: { a: -50, l: 0.5 }, fh: { a: -30, l: 0.3 } }), 'in'),
      K(1, P({ lean: 36, hip: -0.7, nf: [0.8, 0], ff: [-0.6, 0], nh: { a: -62, l: 0.58 }, fh: { a: -30, l: 0.3 } }), 'snap'), K(1.3, P({ lean: 30, hip: -0.8, nf: [0.7, 0], ff: [-0.55, 0], nh: { a: -20, l: 0.5 }, fh: { a: -20, l: 0.3 } }), 'io'),
      K(1.62, P({ lean: 30, hip: -0.85, nf: [0.7, 0], ff: [-0.55, 0], nh: { a: 0, l: 0.58 }, fh: { a: 10, l: 0.3 } }), 'snap'), K(1.9, P({ lean: 32, hip: -0.85, nh: { a: 2, l: 0.58 } }), 'lin'), ...END()],
    stages: [{ w: 0.45, kb: 'stagger', hit: { ...SIG('ds', { a: 8, g: 10, hs: 10, kbg: 0.05 }) } }, { w: 0.55, kb: 'final', hit: SIG('ds', { a: 12, g: 12, hs: 11 }) }],
    fx: [hb('nh', 'weapon', { from: 18, len: [16, 17], r: [5, 6], wlen: 40, wstyle: 'scabbard', u: [0, 0.3], st: 0 }), katTip({ u: [0.55, 0.9], st: 1, r: [4, 5] })], drive: [{ at: [0.4, 1.0], vx: 3.0 }] } },
  ss: { name: 'Cross-Step Cut', fr: [8, 5, 18], dmgMul: 0.55, def: { phys: true, hit: SIG('ss', { a: 14, g: 14, hs: 11, rear: true }),
    keys: [K(0, GUARD), K(0.5, P({ lean: 20, hip: -0.9, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: -10, l: 0.3 }, fh: { a: 20, l: 0.3 } }), 'in'),
      K(1, P({ lean: 30, hip: -0.88, nf: [0.8, 0], ff: [-0.6, 0], nh: { a: 150, l: 0.58 }, fh: { a: 140, l: 0.3 } }), 'snap'), K(1.5, P({ lean: 32, hip: -0.88, nh: { a: 166, l: 0.58 } }), 'out'), ...END()],
    fx: [kat({ u: [0, 0.7] })], drive: [{ at: [0.3, 1.2], vx: 3.8 }] } },
  uh: { name: 'Heaven Splitter', fr: [17, 6, 34], def: { phys: true, hit: H('uh', { a: 84, g: 78, hs: 18, contact: true }),
    keys: [K(0, GUARD), K(0.6, GRD({ lean: 6, hip: -0.88 }), 'in'), K(0.97, GRD({ lean: 6, hip: -0.88 }), 'lin'),
      K(1, P({ lean: -4, hip: -1.1, dy: -0.15, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: 88, l: 0.58 }, fh: { a: 92, l: 0.58 } }), 'snap'), K(1.7, P({ lean: -6, hip: -1.12, dy: -0.2, nh: { a: 92, l: 0.58 }, fh: { a: 94, l: 0.58 } }), 'lin'), ...END()],
    fx: [katTip({ u: [0, 0.8] })], drive: [{ at: [0.8, 1.3], vx: 1.0 }] } },
  dh: { name: 'Four-Corner Sever', fr: [14, 12, 32], def: { phys: true, hit: H('dh', { a: 12, g: 12, hs: 17 }),
    keys: [K(0, GUARD), K(0.55, P({ lean: 40, hip: -0.65, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -30, l: 0.58 }, fh: { a: -20, l: 0.5 } }), 'in'),
      K(1, P({ lean: 50, hip: -0.62, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: -8, l: 0.58 }, fh: { a: -12, l: 0.5 } }), 'snap'), K(1.3, P({ lean: 32, hip: -0.7, rot: -14, nf: [0.4, 0], ff: [-0.6, 0], nh: { a: -35, l: 0.5 }, fh: { a: -30, l: 0.5 } }), 'io'),
      K(1.6, P({ lean: 48, hip: -0.62, rot: 12, nf: [0.6, 0], ff: [-0.55, 0], nh: { a: 20, l: 0.58 }, fh: { a: 10, l: 0.5 } }), 'snap'), K(1.9, P({ lean: 50, hip: -0.62, rot: 14, nh: { a: 6, l: 0.58 } }), 'lin'), ...END(P({ lean: 24, hip: -0.85 }))],
    stages: [{ w: 0.42, kb: 'stagger', hit: H('dh', { a: 10, g: 12, hs: 14, kbg: 0.09 }) }, { w: 0.58, kb: 'final', hit: H('dh', { a: 14, g: 14, hs: 18 }) }],
    fx: [kat({ u: [0, 0.26], st: 0 }), kat({ u: [0.5, 0.86], st: 1 })], drive: [{ at: [0.5, 1.0], vx: 2.2 }, { at: [1.3, 1.7], vx: 1.6 }] } },
  sh: { name: 'Unsheathed Advance', fr: [16, 5, 36], def: { ...T.thrust({ drive: 6.2, ...KT }), hit: H('sh', { a: 12, g: 12, hs: 18 }) } },
  gp: { name: 'Falling Blade Pin', fr: [5, 2, 20], def: T.gp({ start: A({ lean: 20, nh: { a: 100, l: 0.58 }, fh: { a: 110, l: 0.5 } }), mid: A({ lean: 10, nh: { a: 40, l: 0.58 }, fh: { a: 50, l: 0.5 } }),
    dive: P({ lean: 14, hip: -1.1, nh: { a: -88, l: 0.58 }, fh: { a: -88, l: 0.5 }, nf: { a: -70, l: 1 }, ff: { a: -80, l: 1 } }), land: P({ lean: 50, hip: -0.65, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -70, l: 0.5 }, fh: { a: -60, l: 0.5 } }),
    limb: (o) => katTip(o) }) },
  rc: { name: 'Sheath Vault', fr: [10, 20, 16], def: { ...T.rc({ vx: 4.4, vy: -8.2, trailA: 'nf', setup: A({ lean: 30, hip: -0.9, nh: { a: -60, l: 0.5 }, fh: { a: -50, l: 0.4 }, nf: [0.5, -0.1], ff: [-0.4, -0.1] }),
    go: A({ lean: 10, hip: -1.2, dy: -0.3, nf: { a: 40, l: 1.1 }, ff: { a: 20, l: 1.1 }, nh: { a: 20, l: 0.58 }, fh: { a: 30, l: 0.4 } }), go2: A({ lean: 30, hip: -1.1, dy: -0.4, nh: { a: -20, l: 0.58 }, nf: { a: 20, l: 1.1 }, ff: { a: 10, l: 1.1 } }) }),
    fx: [trail('nf', { u: [0, 1] }), katTip({ u: [0.72, 1], st: 0, r: [4, 5] })], hit: H('rc', { a: 50, g: 50, hs: 9 }) }, dmg: 4 },
  sp: { name: 'Final Form: Empty Horizon', fr: [34, 8, 34], def: T.super({ limb: (x) => kat({ ...x, r: [4, 5] }), hit: H('sp', { a: 6, g: 8, bkb: 11, kbg: 0.1387, hs: 26 }),
    feint: P({ lean: 24, hip: -0.8, nf: [0.5, 0], ff: [-0.6, 0], nh: { a: -20, l: 0.5 }, fh: { a: -10, l: 0.4 } }), feint2: P({ lean: 26, hip: -0.78, nf: [0.5, 0], ff: [-0.6, 0], nh: { a: -22, l: 0.5 }, fh: { a: -12, l: 0.4 } }),
    reposition: P({ lean: 26, hip: -0.78, nf: [0.5, 0], ff: [-0.6, 0], nh: { a: -22, l: 0.5 }, fh: { a: -12, l: 0.4 } }), wind: P({ lean: 30, hip: -0.76, nf: [0.55, 0], ff: [-0.6, 0], nh: { a: -10, l: 0.5 }, fh: { a: 0, l: 0.4 } }),
    finish: P({ lean: 42, hip: -0.8, nf: [0.85, 0], ff: [-0.6, 0], nh: { a: 0, l: 0.58 }, fh: { a: 6, l: 0.5 } }), finish2: P({ lean: 40, hip: -0.9, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: -30, l: 0.5 }, fh: { a: -20, l: 0.4 } }),
    fv: 0, rv: 0, drive: [{ at: [0.85, 1.7], vx: 9.0 }] }) },
};
G2.g2_itto = itto;

export { G2 };

export { STR, mk, MV, nm, gp, rc, sp, GPK, WPN, RCP, WIND, FEINT, REPO, A };
