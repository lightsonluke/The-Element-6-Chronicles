// mvArchV2g3.js — Generation III (Takeshi, Aiko, Haru, Chiyo, Emi, Nozomi, Masaru, Ryo, Souta, Ogata, Kanenobu)
//                 and Generation IV (Cobalt, Cyan, Onyx, Gold, Vermilion, Umber, Graphite, Daichi, Renko).
// Built from the same physical-move library; slot assignments follow the attack spec exactly.
import { P } from './mvCore.js';
import { T, H, fist, palm, shin, hb } from './mvArchV2.js';
import { STR, MV, nm, gp, rc, sp, GPK, WPN, A, WIND, FEINT, REPO } from './mvArchV2g2.js';

STR.thrust = { pose: { lean: 36, hip: -0.9, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: 2, l: 0.58 }, fh: { a: 30, l: 0.3 } }, fx: (o) => fist('nh', { ...o, len: [4, 14], r: [10, 11] }) };
STR.rear = { pose: { lean: 38, hip: -0.98, rot: 14, nf: [0.35, 0], ff: { a: 176, l: 1.17 }, nh: { a: 20, l: 0.4 }, fh: { a: 30, l: 0.4 } }, fx: (o) => shin('ff', o) };
// ground-pound kinds the earlier generations didn't need
Object.assign(GPK, {
  palm: { start: A({ lean: 14, nh: { a: 40, l: 0.4 } }), mid: A({ lean: 30, nh: { a: 10, l: 0.58 } }), dive: P({ lean: 44, hip: -1.1, nh: { a: -55, l: 0.58 }, nf: { a: -70, l: 1.05 }, ff: { a: -80, l: 1 } }), land: P({ lean: 30, hip: -0.92, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: 3, l: 0.58 } }), limb: (o) => palm('nh', o) },
  thrust: { start: A({ lean: 10, nh: { a: -10, l: 0.3 } }), mid: A({ lean: 30, nh: { a: 2, l: 0.58 } }), dive: P({ lean: 50, hip: -1.1, nh: { a: -40, l: 0.58 }, nf: { a: -65, l: 1.05 }, ff: { a: -80, l: 1 } }), land: P({ lean: 36, hip: -0.9, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: 2, l: 0.58 } }), limb: (o) => fist('nh', { ...o, len: [4, 14] }) },
  charged: { start: A({ lean: -12, fh: { a: 150, l: 0.4 } }), mid: A({ lean: -20, fh: { a: 165, l: 0.45 }, nh: { a: 40, l: 0.3 } }), dive: P({ lean: 60, hip: -1.1, fh: { a: -40, l: 0.58 }, nh: { a: 40, l: 0.3 }, nf: { a: -75, l: 1.05 }, ff: { a: -85, l: 1 } }), land: P({ lean: 40, hip: -0.88, rot: 12, nf: [0.75, 0], ff: [-0.55, 0], nh: { a: 40, l: 0.3 }, fh: { a: 2, l: 0.58 } }), limb: (o) => fist('fh', { ...o, r: [13, 14] }) },
  dive: { start: A({ lean: 30, hip: -1.0, nf: { a: 30, l: 0.7 }, ff: { a: 40, l: 0.7 } }), mid: A({ lean: 62, nf: { a: 150, l: 1 }, ff: { a: 160, l: 1 }, nh: { a: -20, l: 0.58 } }), dive: P({ lean: 82, hip: -1.15, nf: { a: 170, l: 1 }, ff: { a: 178, l: 1 }, nh: { a: -35, l: 0.58 } }), land: P({ lean: 54, hip: -0.62, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -50, l: 0.58 } }), limb: (o) => fist('nh', { ...o, r: [12, 13] }) },
  elbowturn: { start: A({ lean: 20 }), mid: A({ lean: 30, nh: { a: 30, l: 0.3 } }), dive: P({ lean: 44, hip: -1.1, rot: 16, nh: { a: -70, l: 0.3 }, nf: { a: -70, l: 1 }, ff: { a: -80, l: 1 } }), land: P({ lean: 36, hip: -0.85, rot: 20, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: 20, l: 0.26 } }), limb: (o) => hb('ne', 'elbow', { len: [3, 8], r: [12, 13], ...o }) },
});
GPK.sweep = GPK.trip; GPK.risingknee = GPK.knee;
Object.assign(WPN, { takeshi: { wlen: 36, wstyle: 'staff' }, aiko: { wlen: 34, wstyle: 'staff' }, haru: { wlen: 44, wstyle: 'staff' }, nozomi: { wlen: 32, wstyle: 'dagger' }, ryo: { wlen: 30, wstyle: 'dagger' },
  souta: { wlen: 40, wstyle: 'staff' }, ogata: { wlen: 48, wstyle: 'staff' }, kanenobu: { wlen: 52, wstyle: 'staff' }, gold: { wlen: 40, wstyle: 'staff' }, vermilion: { wlen: 42, wstyle: 'staff' }, cyan: { wlen: 30, wstyle: 'dagger' }, renko: { wlen: 40, wstyle: 'staff' } });

const SUF = { us: 'Rising Tap', ds: 'Low Catch', ss: 'Step Strike', uh: 'Ascending Break', dh: 'Floor Punisher', sh: 'Forward Commit', gp: 'Falling Contact', rc: 'Return Step', sp: 'Signature Finish' };
// super kinds: aliases onto the strike bundles + a few special finishes
const SPK = { jabcross: 'cross', lowtrip: 'shin', sweep: 'shin', risingknee: 'knee', catch: 'throw', roundhouse: 'round', draw: 'weapon', charged: 'cross', retreat: 'fist', counter: 'elbow' };
const BRACE = P({ lean: -6, hip: -0.95, nf: [0.3, 0], ff: [-0.45, 0], nh: { a: 55, l: 0.4 }, fh: { a: 70, l: 0.4 } });
function spx(who, kind, o = {}) {
  if (kind === 'dive') return sp(who, 'heel', { limb: (x) => hb('nf', 'foot', { len: [3, 8], r: [12, 13], ...x }), finish: P({ hip: -1.1, lean: 30, dy: -0.28, dx: 0.35, nf: { a: -34, l: 1.17 }, ff: { a: 30, l: 0.55 }, nh: { a: 70, l: 0.4 } }), wind: P({ lean: 30, hip: -1.2, dy: -0.5, nf: { a: 55, l: 0.6 }, ff: { a: 62, l: 0.6 } }), drive: [{ at: [0.8, 1.2], vx: 4, vy: -5 }, { at: [1, 1.3], vy: 6 }] });
  if (kind === 'pair') { const s = sp(who, 'fist', { limb: (x) => shin('ff', { ...x, u: [0.1, 0.8] }), finish: P({ hip: -0.98, ...STR.rear.pose }), wind: P({ lean: -10, hip: -0.95, rot: -16, nf: [0.3, 0], ff: [-0.7, 0], nh: { a: 150, l: 0.4 }, fh: { a: 120, l: 0.4 } }), fv: 0, rv: 5.6, drive: [{ at: [1.15, 1.6], vx: -3 }] }); s.def.stages[0].hit = { ...s.def.stages[0].hit, rear: true, a: 24, g: 22 }; return s; }
  if (kind === 'counter') return sp(who, 'elbow', { feint: BRACE, feint2: BRACE, wind: BRACE, ...o });
  if (kind === 'charged') return sp(who, 'cross', { wind: P({ lean: -22, hip: -0.84, nf: [0.3, 0], ff: [-0.72, 0], nh: { a: 40, l: 0.3 }, fh: { a: 165, l: 0.45 } }), ...o });
  if (kind === 'retreat') return sp(who, 'fist', { fv: -3.4, rv: 5.6, ...o });
  return sp(who, SPK[kind] || kind, o);
}
function kit(who, spd, label, d) {
  const out = {};
  for (const sl of ['us', 'ds', 'ss', 'uh', 'dh', 'sh']) { const [tpl, o] = [].concat(d[sl]); out[sl] = MV(who, spd, sl, tpl, `${label} ${SUF[sl]}`, o || {}); }
  out.gp = nm(`${label} ${SUF.gp}`, gp(d.gp, who));
  const [pr, vx, vy] = d.rc; out.rc = nm(`${label} ${SUF.rc}`, rc(pr, vx, vy));
  const [sk, so] = [].concat(d.sp); out.sp = nm(`${label} ${SUF.sp}`, spx(who, sk, so || {}));
  return out;
}

export const G3 = {
  g3_takeshi: kit('takeshi', 1, 'Sand', { us: 'elbowSpin', ds: 'drawCut', ss: ['jabCross', { lean: 12, step: 0.52 }], uh: ['heelKick', { ang: 8, drive: 1.6 }], dh: 'backfist', sh: ['shoulder', { drive: 3.4 }], gp: 'palm', rc: ['spring', 3.4, -8.6], sp: 'pair' }),
  g3_aiko: kit('aiko', 1, 'Bone', { us: ['palm', { lean: 24 }], ds: 'hook', ss: 'kneeRise', uh: 'backfist', dh: 'chop', sh: ['palm', { lean: 34, drive: 2.6 }], gp: 'thrust', rc: ['spring', 4.6, -7.8], sp: 'counter' }),
  g3_haru: kit('haru', 0.95, 'Glass', { us: ['jabCross', { lean: 13 }], ds: 'sweepLow', ss: ['heelKick', { ang: 6 }], uh: 'chop', dh: 'switchUp', sh: ['thrust', { drive: 5.2 }], gp: 'dive', rc: ['blink', 5.8, -5.6], sp: 'charged' }),
  g3_chiyo: kit('chiyo', 0.95, 'Venom', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: 'switchUp', dh: 'counter', sh: 'diveKick', gp: 'trip', rc: ['tuck', 4.0, -8.2], sp: 'risingknee' }),
  g3_emi: kit('emi', 0.9, 'Blood-Sensing', { us: ['heelKick', { ang: 10 }], ds: 'backfist', ss: ['palm', { lean: 26 }], uh: ['counter', { palm: true }], dh: ['load', { limb: 'foot', drive: 2.0 }], sh: 'sweepRise', gp: 'jab', rc: ['reach', 4.2, -8.0], sp: 'shoulder' }),
  g3_nozomi: kit('nozomi', 1, 'Thorned Vines', { us: ['elbowSpin', { drive: 1.0 }], ds: 'drawCut', ss: ['jabCross', { lean: 12, step: 0.5 }], uh: ['load', { limb: 'fist', drive: 2.2 }], dh: ['kneeRise', { drive: 1.8 }], sh: ['jabCross', { lean: 22, step: 0.7, drive: 2.2 }], gp: 'sweep', rc: ['spring', 4.4, -8.0], sp: 'palm' }),
  g3_masaru: kit('masaru', 1.05, 'Ash', { us: ['palm', { lean: 24 }], ds: 'hook', ss: 'kneeRise', uh: ['kneeRise', { drive: 3.2 }], dh: ['shoulder', { drive: 3.8 }], sh: ['sweepLow', { drive: 3.4 }], gp: 'elbowturn', rc: ['blink', 5.0, -6.2], sp: 'thrust' }),
  g3_ryo: kit('ryo', 0.9, 'Mist', { us: ['jabCross', { lean: 12, step: 0.5 }], ds: 'sweepLow', ss: ['heelKick', { ang: 4 }], uh: ['shoulder', { drive: 3.4 }], dh: ['palm', { lean: 34, drive: 2.0 }], sh: ['elbowSpin', { drive: 2.0 }], gp: 'draw', rc: ['blink', 6.2, -5.4], sp: 'dive' }),
  g3_souta: kit('souta', 0.95, 'Ash', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: ['palm', { lean: 34 }], dh: ['thrust', { drive: 5.4 }], sh: 'drawCut', gp: 'retreat', rc: ['draw', 5.6, -7.0], sp: 'lowtrip' }),
  g3_ogata: kit('ogata', 1.08, 'Extraction Tech', { us: ['heelKick', { ang: 8 }], ds: 'backfist', ss: ['palm', { lean: 28 }], uh: ['thrust', { drive: 4.8 }], dh: 'diveKick', sh: ['retreatReturn', { limb: 'palm' }], gp: 'throw', rc: ['reach', 4.0, -8.0], sp: 'jabcross' }),
  g3_kanenobu: kit('kanenobu', 1.1, 'Political Influence', { us: ['elbowSpin', { drive: 1.0 }], ds: 'drawCut', ss: ['jabCross', { lean: 12, step: 0.5 }], uh: 'diveKick', dh: 'sweepRise', sh: ['throw', { drive: 1.8 }], gp: 'round', rc: ['reach', 3.6, -8.4], sp: 'sweep' }),
};
export const G4 = {
  g4_cobalt: kit('cobalt', 1.1, 'Barrier Constructs', { us: ['palm', { lean: 24 }], ds: 'hook', ss: 'kneeRise', uh: 'sweepRise', dh: ['jabCross', { lean: 18, step: 0.6, drive: 3.0 }], sh: ['spin', { drive: 2.6 }], gp: 'hook', rc: ['draw', 4.8, -7.2], sp: 'elbow' }),
  g4_cyan: kit('cyan', 0.85, 'Wind', { us: ['jabCross', { lean: 12, step: 0.5 }], ds: 'sweepLow', ss: ['heelKick', { ang: 4 }], uh: ['jabCross', { lean: 22, step: 0.65, drive: 3.2 }], dh: ['sweepLow', { drive: 3.0 }], sh: ['hook', { drive: 2.0 }], gp: 'heel', rc: ['reach', 6.2, -7.2], sp: 'draw' }),
  g4_onyx: kit('onyx', 0.9, 'Shadow', { us: 'kneeRise', ds: ['shoulder', { drive: 2.6 }], ss: 'elbowSpin', uh: ['sweepLow', { drive: 2.4 }], dh: ['elbowSpin', { drive: 2.6 }], sh: ['heelKick', { ang: 8, drive: 1.6 }], gp: 'back', rc: ['blink', 5.8, -6.0], sp: 'retreat' }),
  g4_gold: kit('gold', 1, 'Restoration', { us: ['heelKick', { ang: 10 }], ds: 'backfist', ss: ['palm', { lean: 26 }], uh: ['elbowSpin', { drive: 2.0 }], dh: 'drawCut', sh: ['backfist', { drive: 2.2 }], gp: 'chop', rc: ['tuck', 3.8, -8.4], sp: 'catch' }),
  g4_vermilion: kit('vermilion', 0.95, 'Fire', { us: ['elbowSpin', { drive: 1.0 }], ds: 'drawCut', ss: ['jabCross', { lean: 12, step: 0.52 }], uh: ['drawCut', { drive: 2.4 }], dh: ['retreatReturn', { limb: 'palm', drive: 5.0 }], sh: 'chop', gp: 'pair', rc: ['draw', 5.2, -6.6], sp: 'roundhouse' }),
  g4_umber: kit('umber', 1.1, 'Tremor-Sense', { us: ['palm', { lean: 24 }], ds: 'hook', ss: ['kneeRise', { drive: 2.0 }], uh: ['retreatReturn', { limb: 'fist', drive: 5.0 }], dh: ['throw', { drive: 2.6 }], sh: 'switchUp', gp: 'counter', rc: ['spring', 3.4, -9.0], sp: 'hook' }),
  g4_graphite: kit('graphite', 1, 'Resonance Analysis', { us: ['jabCross', { lean: 13 }], ds: 'sweepLow', ss: ['heelKick', { ang: 6 }], uh: ['throw', { drive: 2.2 }], dh: ['spin', { drive: 2.0 }], sh: ['counter', {}], gp: 'charged', rc: ['draw', 5.4, -6.6], sp: 'heel' }),
  g4_daichi: kit('daichi', 1.05, 'Resonance Technology', { us: 'kneeRise', ds: ['shoulder', { drive: 2.8 }], ss: 'elbowSpin', uh: ['spin', { drive: 2.2 }], dh: 'hook', sh: ['load', { limb: 'fist', drive: 3.0 }], gp: 'risingknee', rc: ['reach', 4.4, -8.0], sp: 'backfist' }),
  g4_renko: kit('renko', 0.9, 'Extraction Technology', { us: ['heelKick', { ang: 10 }], ds: 'backfist', ss: ['palm', { lean: 26 }], uh: ['hook', { drive: 1.6 }], dh: ['heelKick', { ang: 6, drive: 1.4 }], sh: ['kneeRise', { drive: 3.0 }], gp: 'shoulder', rc: ['tuck', 4.2, -8.0], sp: 'chop' }),
};

export { kit, spx, SUF };
