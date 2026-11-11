// mvArchV2g5.js — Generation V (39 characters incl. the villain roster and the Guardians).
// Purple is an all-katana iaijutsu fighter (agile shadow footwork); every other kit follows the spec's slot assignments.
import { P, GUARD } from './mvCore.js';
import { T, K, END, AIR, H, SIG, hb, fist, weapon, weaponTip, trail } from './mvArchV2.js';
import { WPN, A } from './mvArchV2g2.js';
import { kit } from './mvArchV2g3.js';

Object.assign(WPN, { red: { wlen: 48, wstyle: 'katana' }, snodvor: { wlen: 34, wstyle: 'dagger' }, corpent: { wlen: 30, wstyle: 'dagger' }, hazel: { wlen: 30, wstyle: 'dagger' } });

// ══════════════ PURPLE: every move is a katana technique ══════════════
const KT = { wlen: 50, wstyle: 'katana' };
const kat = (o = {}) => weapon('nh', { ...KT, ...o }), katTip = (o = {}) => weaponTip('nh', { ...KT, ...o });
const purple = {
  us: { name: 'Silent Crescent', fr: [5, 6, 14], dmgMul: 0.55, def: { phys: true, hit: SIG('us', { a: 66, g: 62, hs: 11 }),
    keys: [K(0, GUARD), K(0.55, P({ lean: 22, hip: -0.72, nf: [0.45, 0], ff: [-0.45, 0], nh: { a: -35, l: 0.3 }, fh: { a: -10, l: 0.3 } }), 'in'),
      K(1, P({ lean: 8, hip: -0.95, nf: [0.5, 0], ff: [-0.4, 0], nh: { a: 25, l: 0.58 }, fh: { a: 20, l: 0.3 } }), 'snap'), K(1.3, P({ lean: 2, hip: -1.0, nh: { a: 70, l: 0.58 } }), 'out'),
      K(1.65, P({ lean: 6, hip: -0.98, nh: { a: 40, l: 0.4 }, fh: { a: 20, l: 0.3 } }), 'io'), ...END()], fx: [kat({ u: [0, 0.85] })], drive: [{ at: [0.6, 1.2], vx: 1.4 }] } },
  ds: { name: 'Low Shadow Sweep', fr: [8, 6, 20], dmgMul: 0.55, def: { phys: true, hit: SIG('ds', { a: 8, g: 8, hs: 12 }),
    keys: [K(0, GUARD), K(0.5, P({ lean: 52, hip: -0.62, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -60, l: 0.5 }, fh: { a: -82, l: 0.5 } }), 'in'),
      K(1, P({ lean: 58, hip: -0.6, nf: [0.55, 0], ff: [-0.55, 0], nh: { a: -14, l: 0.58 }, fh: { a: -82, l: 0.5 } }), 'snap'), K(1.5, P({ lean: 60, hip: -0.6, nh: { a: -4, l: 0.58 }, fh: { a: -82, l: 0.5 } }), 'lin'), ...END(P({ lean: 24, hip: -0.85 }))],
    fx: [kat({ u: [0, 0.85] })], drive: [{ at: [0.5, 1.2], vx: 1.6 }] } },
  ss: { name: 'Shadow-Step Iai', fr: [8, 5, 18], dmgMul: 0.55, def: { ...T.retreatReturn({ limb: 'weapon', drive: 6.2, ...KT }), hit: SIG('ss', { a: 12, g: 12, hs: 11 }) } },
  uh: { name: 'Rising Dragon Cut', fr: [14, 8, 30], def: { phys: true, hit: H('uh', { a: 72, g: 70, hs: 18, contact: true }),
    keys: [K(0, GUARD), K(0.6, P({ lean: 18, hip: -0.8, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -30, l: 0.3 }, fh: { a: 0, l: 0.3 } }), 'in'),
      K(1, P({ lean: 14, hip: -0.95, rot: 8, nf: [0.55, 0], ff: [-0.4, 0], nh: { a: 10, l: 0.58 }, fh: { a: 20, l: 0.3 } }), 'snap'), K(1.35, P({ lean: 2, hip: -1.08, rot: -6, nh: { a: 55, l: 0.58 } }), 'out'),
      K(1.7, P({ lean: -4, hip: -1.12, dy: -0.18, nh: { a: 92, l: 0.58 } }), 'out'), ...END()], fx: [kat({ u: [0, 0.9] })], drive: [{ at: [0.6, 1.3], vx: 2.0 }] } },
  dh: { name: 'Sheathed Thunder', fr: [16, 4, 30], def: { phys: true, hit: H('dh', { a: 12, g: 12, hs: 17 }),
    keys: [K(0, GUARD), K(0.55, P({ lean: 10, hip: -0.88, nf: [0.45, 0], ff: [-0.45, 0], nh: { a: 170, l: 0.3 }, fh: { a: 20, l: 0.3 } }), 'in'), K(0.97, P({ lean: 12, hip: -0.84, nf: [0.45, 0], ff: [-0.45, 0], nh: { a: 172, l: 0.3 }, fh: { a: 20, l: 0.3 } }), 'lin'),
      K(1, P({ lean: 28, hip: -0.8, rot: 8, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: -28, l: 0.58 }, fh: { a: 10, l: 0.3 } }), 'snap'), K(1.5, P({ lean: 30, hip: -0.8, rot: 10, nh: { a: -32, l: 0.58 } }), 'lin'), ...END()],
    fx: [kat({ u: [0, 0.8] })], drive: [{ at: [0.8, 1.3], vx: 1.0 }] } },
  sh: { name: 'Eightfold Pursuit', fr: [15, 5, 32], def: { phys: true, hit: H('sh', { a: 16, g: 16, hs: 18, rear: true }),   // dashes cross the target; only the final cut collides (it comes from behind)
    keys: [K(0, GUARD), K(0.3, P({ lean: 42, hip: -0.8, nf: [0.8, 0], ff: [-0.6, 0], nh: { a: -10, l: 0.4 }, fh: { a: 20, l: 0.3 } }), 'out'), K(0.62, P({ lean: -4, hip: -0.9, rot: -10, nf: [0.5, 0], ff: [-0.6, 0], nh: { a: 150, l: 0.4 }, fh: { a: 120, l: 0.3 } }), 'io'),
      K(0.95, P({ lean: 20, hip: -0.9, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: 165, l: 0.3 }, fh: { a: 140, l: 0.3 } }), 'in'), K(1, P({ lean: 34, hip: -0.9, rot: 12, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: 158, l: 0.58 }, fh: { a: 140, l: 0.3 } }), 'snap'),
      K(1.5, P({ lean: 36, hip: -0.9, rot: 14, nh: { a: 168, l: 0.58 } }), 'out'), ...END()], fx: [kat({ u: [0, 0.75] })], drive: [{ at: [0.15, 0.5], vx: 7.0 }, { at: [0.52, 0.95], vx: 6.0 }] } },
  gp: { name: 'Falling Moon Sever', fr: [5, 2, 18], def: T.gp({ start: A({ lean: 10, nh: { a: 100, l: 0.5 } }), mid: A({ lean: 20, nh: { a: 20, l: 0.58 }, nf: { a: 50, l: 0.6 } }),
    dive: P({ lean: 36, hip: -1.1, rot: 20, nh: { a: -62, l: 0.58 }, fh: { a: -60, l: 0.5 }, nf: { a: 20, l: 0.6 }, ff: { a: -60, l: 0.9 } }), land: P({ lean: 46, hip: -0.66, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -60, l: 0.5 }, fh: { a: -50, l: 0.5 } }), limb: (o) => katTip(o) }) },
  rc: { name: 'Ninja Wall-Step', fr: [9, 20, 16], dmg: 2, def: { ...T.rc({ vx: 5.0, vy: -7.6, trailA: 'nf', setup: A({ lean: 30, hip: -0.95, nh: { a: 50, l: 0.58 }, fh: { a: 20, l: 0.3 }, nf: { a: -50, l: 1 }, ff: { a: -70, l: 1 } }),
    go: A({ lean: 44, hip: -0.95, rot: 14, nh: { a: 40, l: 0.58 }, nf: { a: 15, l: 1.1 }, ff: { a: -40, l: 1 } }) }), fx: [trail('nf', { u: [0, 1] }), hb('nf', 'foot', { len: [3, 8], r: [9, 10], u: [0.85, 1], st: 0 })], hit: H('rc', { a: 40, g: 40, hs: 7 }) } },
  sp: (() => {
    const cuts = [{ a: 8, lean: 30, rot: 6 }, { a: 70, lean: 20 }, { a: -35, lean: 36, hip: -0.7 }, { a: 25, lean: 28, rot: 14 }, { a: -18, lean: 34, rot: -6 }, { a: 92, lean: 10 }, { a: -48, lean: 40, hip: -0.68 }, { a: 40, lean: 26, rot: 10 }, { a: 2, lean: 42, hip: -0.85 }];
    const keys = [K(0, GUARD), K(0.4, P({ lean: 34, hip: -0.72, nf: [0.6, 0], ff: [-0.55, 0], nh: { a: 175, l: 0.3 }, fh: { a: 20, l: 0.3 } }), 'in'), K(0.97, P({ lean: 36, hip: -0.72, nf: [0.6, 0], ff: [-0.55, 0], nh: { a: 176, l: 0.3 }, fh: { a: 20, l: 0.3 } }), 'lin')];
    cuts.forEach((c, i) => keys.push(K(1 + (i + 0.4) / 9, P({ lean: c.lean, hip: c.hip ?? -0.88, rot: c.rot ?? 0, nf: [i === 8 ? 0.85 : 0.6, 0], ff: [-0.55, 0], nh: { a: c.a, l: 0.58 }, fh: { a: c.a * 0.4, l: 0.3 } }), 'snap')));
    keys.push(K(2.1, P({ lean: 30, hip: -0.85, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: -60, l: 0.3 }, fh: { a: -20, l: 0.3 } }), 'io'), K(3, GUARD, 'io'));
    const stages = cuts.map((_, i) => ({ w: i === 8 ? 0.4 : 0.075, kb: i === 8 ? 'final' : 'stagger', hit: i === 8 ? H('sp', { a: 20, g: 20, bkb: 11, kbg: 0.1387, hs: 24 }) : { bkb: 2.5, kbg: 0.01, a: 24, g: 24, hs: 9 } }));
    return { name: 'One Breath, Nine Cuts', fr: [34, 27, 36], def: { phys: true, keys, stages, fx: cuts.map((_, i) => kat({ u: [i / 9, (i + 1) / 9], st: i, ...(i === 8 ? { from: 8, len: [40, 44] } : {}) })), drive: [{ at: [1, 1.9], vx: 0.8 }] } };
  })(),
};

const G5 = { purple };
const Z = (who, spd, label, d) => { G5[who] = kit(who, spd, label, d); };
const J = (l = 12, s = 0.52) => ['jabCross', { lean: l, step: s }];
const JH = ['jabCross', { lean: 22, step: 0.7, drive: 2.2 }];
const PM = (l = 24) => ['palm', { lean: l }];
const HL = (a = 8) => ['heelKick', { ang: a }];
Z('yellow', 1, 'Enhance', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: HL(), dh: 'backfist', sh: ['shoulder', { drive: 3.4 }], gp: 'palm', rc: ['spring', 3.6, -8.6], sp: 'pair' });
Z('blue', 1, 'H2O', { us: PM(), ds: 'hook', ss: 'kneeRise', uh: 'backfist', dh: 'chop', sh: PM(34), gp: 'thrust', rc: ['draw', 5.6, -6.0], sp: 'counter' });
Z('orange', 0.95, 'Portalmaking', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: 'switchUp', dh: 'counter', sh: 'diveKick', gp: 'trip', rc: ['blink', 5.8, -6.4], sp: 'risingknee' });
Z('green', 1.1, 'Earthbending', { us: HL(10), ds: 'backfist', ss: PM(26), uh: ['counter', { palm: true }], dh: ['load', { limb: 'fist', drive: 2.2 }], sh: 'sweepRise', gp: 'jab', rc: ['spring', 3.2, -9.4], sp: 'shoulder' });
Z('pink', 0.95, 'Mind Control', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: ['load', { limb: 'fist', drive: 2.2 }], dh: ['kneeRise', { drive: 1.8 }], sh: JH, gp: 'sweep', rc: ['tuck', 3.8, -8.0], sp: 'palm' });
Z('grey', 1.1, 'Walls', { us: PM(), ds: 'hook', ss: 'kneeRise', uh: ['kneeRise', { drive: 3.2 }], dh: ['shoulder', { drive: 3.8 }], sh: ['sweepLow', { drive: 3.4 }], gp: 'elbowturn', rc: ['draw', 4.8, -7.0], sp: 'thrust' });
Z('turquoise', 0.9, 'Shapeshift', { us: J(), ds: 'sweepLow', ss: HL(), uh: ['shoulder', { drive: 3.4 }], dh: ['palm', { lean: 34, drive: 2.0 }], sh: ['elbowSpin', { drive: 2.0 }], gp: 'draw', rc: ['reach', 4.4, -8.0], sp: 'dive' });
Z('olive', 1.1, 'Growth', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: PM(34), dh: ['thrust', { drive: 5.4 }], sh: 'drawCut', gp: 'retreat', rc: ['reach', 4.0, -8.6], sp: 'lowtrip' });
Z('copper', 1, 'Time', { us: HL(), ds: 'backfist', ss: PM(28), uh: ['thrust', { drive: 4.8 }], dh: 'diveKick', sh: ['retreatReturn', { limb: 'palm' }], gp: 'throw', rc: ['blink', 4.2, -6.6], sp: 'jabcross' });
Z('emerald', 0.95, 'Phase', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: 'diveKick', dh: 'sweepRise', sh: ['throw', { drive: 1.8 }], gp: 'round', rc: ['blink', 3.8, -8.2], sp: 'sweep' });
Z('pearl', 1, 'Echo Location', { us: PM(), ds: 'hook', ss: 'kneeRise', uh: ['sweepRise', { drive: 3.6 }], dh: ['jabCross', { lean: 18, step: 0.6, drive: 3.0 }], sh: ['spin', { drive: 2.6 }], gp: 'hook', rc: ['tuck', 4.4, -7.2], sp: 'elbow' });
Z('red', 1, 'Fire', { us: J(), ds: 'sweepLow', ss: HL(4), uh: ['jabCross', { lean: 22, step: 0.65, drive: 3.2 }], dh: ['sweepLow', { drive: 3.0 }], sh: ['hook', { drive: 2.0 }], gp: 'heel', rc: ['draw', 4.2, -8.6], sp: 'draw' });
Z('lavender', 0.95, 'Air Solidification', { us: 'kneeRise', ds: ['shoulder', { drive: 2.6 }], ss: 'elbowSpin', uh: ['sweepLow', { drive: 2.4 }], dh: ['elbowSpin', { drive: 2.6 }], sh: ['heelKick', { ang: 8, drive: 1.6 }], gp: 'back', rc: ['spring', 3.8, -8.8], sp: 'retreat' });
Z('amber', 0.9, 'Clone', { us: HL(10), ds: 'backfist', ss: PM(26), uh: ['elbowSpin', { drive: 2.0 }], dh: 'drawCut', sh: ['backfist', { drive: 2.2 }], gp: 'chop', rc: ['tuck', 4.6, -7.8], sp: 'catch' });
Z('black', 0.95, 'Thunder', { us: 'elbowSpin', ds: 'drawCut', ss: J(12, 0.52), uh: ['drawCut', { drive: 2.4 }], dh: ['retreatReturn', { limb: 'palm', drive: 5.0 }], sh: 'chop', gp: 'pair', rc: ['reach', 5.0, -7.4], sp: 'roundhouse' });
Z('magenta', 1, 'Glue', { us: PM(), ds: 'hook', ss: ['kneeRise', { drive: 2.0 }], uh: ['retreatReturn', { limb: 'fist', drive: 5.0 }], dh: ['throw', { drive: 2.6 }], sh: 'switchUp', gp: 'counter', rc: ['reach', 4.2, -8.0], sp: 'hook' });
Z('indigo', 1, 'Gravity', { us: J(13, 0.55), ds: 'sweepLow', ss: HL(6), uh: ['throw', { drive: 2.2 }], dh: ['spin', { drive: 2.0 }], sh: ['counter', {}], gp: 'charged', rc: ['tuck', 5.4, -7.0], sp: 'heel' });
Z('maroon', 1.05, 'Energy', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: ['spin', { drive: 2.2 }], dh: 'hook', sh: ['load', { limb: 'fist', drive: 3.0 }], gp: 'risingknee', rc: ['spring', 3.0, -9.2], sp: 'backfist' });
Z('crimson', 0.95, 'Element 6', { us: HL(10), ds: 'backfist', ss: PM(26), uh: ['hook', { drive: 1.6 }], dh: ['heelKick', { ang: 6, drive: 1.4 }], sh: ['kneeRise', { drive: 3.0 }], gp: 'shoulder', rc: ['blink', 5.2, -6.6], sp: 'chop' });
Z('scarlet', 0.95, 'Necromancy', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: HL(), dh: 'backfist', sh: ['shoulder', { drive: 3.4 }], gp: 'palm', rc: ['reach', 3.6, -8.4], sp: 'pair' });
Z('white', 0.85, 'Flight', { us: PM(), ds: 'hook', ss: 'kneeRise', uh: 'backfist', dh: 'chop', sh: PM(34), gp: 'thrust', rc: ['draw', 6.0, -5.0], sp: 'counter' });
Z('silver', 1.1, 'Hardened', { us: J(13, 0.55), ds: 'sweepLow', ss: HL(6), uh: 'chop', dh: 'switchUp', sh: ['thrust', { drive: 5.2 }], gp: 'dive', rc: ['draw', 5.6, -5.8], sp: 'charged' });
Z('corpent', 1.05, 'Hammer Slam', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: 'switchUp', dh: 'counter', sh: 'diveKick', gp: 'trip', rc: ['spring', 3.6, -8.6], sp: 'risingknee' });
Z('magneto', 1.05, 'Metal Pull', { us: HL(10), ds: 'backfist', ss: PM(26), uh: ['counter', { palm: true }], dh: ['load', { limb: 'fist', drive: 2.2 }], sh: 'sweepRise', gp: 'jab', rc: ['tuck', 3.8, -8.0], sp: 'shoulder' });
Z('willow', 1, 'Forest', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: ['load', { limb: 'fist', drive: 2.2 }], dh: ['kneeRise', { drive: 1.8 }], sh: JH, gp: 'sweep', rc: ['spring', 3.2, -9.4], sp: 'palm' });
Z('cable', 0.95, 'Electricity', { us: PM(), ds: 'hook', ss: 'kneeRise', uh: ['kneeRise', { drive: 3.2 }], dh: ['shoulder', { drive: 3.8 }], sh: ['sweepLow', { drive: 3.4 }], gp: 'elbowturn', rc: ['reach', 5.0, -7.6], sp: 'thrust' });
Z('snodvor', 1.05, 'Freeze', { us: J(), ds: 'sweepLow', ss: HL(), uh: ['shoulder', { drive: 3.4 }], dh: ['palm', { lean: 34, drive: 2.0 }], sh: ['elbowSpin', { drive: 2.0 }], gp: 'draw', rc: ['spring', 3.0, -9.6], sp: 'dive' });
Z('kirsten', 0.95, 'Ignite', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: PM(34), dh: ['thrust', { drive: 5.4 }], sh: 'drawCut', gp: 'retreat', rc: ['draw', 4.4, -8.4], sp: 'lowtrip' });
Z('volt', 0.95, 'Soundwaves', { us: HL(), ds: 'backfist', ss: PM(28), uh: ['thrust', { drive: 4.8 }], dh: 'diveKick', sh: ['retreatReturn', { limb: 'palm' }], gp: 'throw', rc: ['tuck', 3.6, -8.4], sp: 'jabcross' });
Z('temple', 1.1, 'Dismantle', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: 'diveKick', dh: 'sweepRise', sh: ['throw', { drive: 1.8 }], gp: 'round', rc: ['spring', 3.4, -9.0], sp: 'sweep' });
Z('nightmare', 0.95, 'Nightmare', { us: PM(), ds: 'hook', ss: 'kneeRise', uh: ['sweepRise', { drive: 3.6 }], dh: ['jabCross', { lean: 18, step: 0.6, drive: 3.0 }], sh: ['spin', { drive: 2.6 }], gp: 'hook', rc: ['blink', 5.4, -6.0], sp: 'elbow' });
Z('hazel', 0.9, 'Poison', { us: J(), ds: 'sweepLow', ss: HL(4), uh: ['jabCross', { lean: 22, step: 0.65, drive: 3.2 }], dh: ['sweepLow', { drive: 3.0 }], sh: ['hook', { drive: 2.0 }], gp: 'heel', rc: ['reach', 4.8, -7.8], sp: 'draw' });
Z('whami', 1, 'Alchemy', { us: 'kneeRise', ds: ['shoulder', { drive: 2.6 }], ss: 'elbowSpin', uh: ['sweepLow', { drive: 2.4 }], dh: ['elbowSpin', { drive: 2.6 }], sh: ['heelKick', { ang: 8, drive: 1.6 }], gp: 'back', rc: ['tuck', 3.4, -8.0], sp: 'retreat' });
Z('controller', 1, 'Control', { us: HL(10), ds: 'backfist', ss: PM(26), uh: ['elbowSpin', { drive: 2.0 }], dh: 'drawCut', sh: ['backfist', { drive: 2.2 }], gp: 'chop', rc: ['reach', 3.6, -8.8], sp: 'catch' });
Z('evil', 1, 'Erasure', { us: 'elbowSpin', ds: 'drawCut', ss: J(), uh: ['drawCut', { drive: 2.4 }], dh: ['retreatReturn', { limb: 'palm', drive: 5.0 }], sh: 'chop', gp: 'pair', rc: ['blink', 5.0, -6.4], sp: 'roundhouse' });
Z('life', 1, 'Second Chance', { us: PM(), ds: 'hook', ss: ['kneeRise', { drive: 2.0 }], uh: ['retreatReturn', { limb: 'fist', drive: 5.0 }], dh: ['throw', { drive: 2.6 }], sh: 'switchUp', gp: 'counter', rc: ['spring', 3.0, -9.4], sp: 'hook' });
Z('death', 1.05, 'Gambit', { us: J(13, 0.55), ds: 'sweepLow', ss: HL(6), uh: ['throw', { drive: 2.2 }], dh: ['spin', { drive: 2.0 }], sh: ['counter', {}], gp: 'charged', rc: ['blink', 4.6, -6.8], sp: 'heel' });
Z('mercy', 1, 'Healing', { us: 'kneeRise', ds: ['shoulder', { drive: 2.6 }], ss: 'elbowSpin', uh: ['spin', { drive: 2.2 }], dh: 'hook', sh: ['load', { limb: 'fist', drive: 3.0 }], gp: 'risingknee', rc: ['tuck', 3.6, -8.2], sp: 'backfist' });

export { G5 };
