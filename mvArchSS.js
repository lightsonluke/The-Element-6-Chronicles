// Side Signature choreographies. Envelope: forward rectangle 95x55 starting at the attacking hand/foot/effect.
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const END = (p = GUARD) => [K(2.3, p, 'io'), K(3, GUARD, 'io')];
// a forward force-wave riding the striking limb (≈ 95 x 55)
export const fxFwd = (a, o = {}) => [{ k: 'blade', a, ang: o.ang || 0, abs: o.abs, len: o.len || [14, 88], r: o.r || [16, 26], u: o.u || [0, 1], ease: 'out', bend: o.bend, from: o.from || 0 }];

export const SS = {
  // plants in place and lashes a narrow attack straight ahead
  'ss.lash': {
    keys: [K(0, GUARD), K(0.7, P({ lean: -4, nh: { a: 10, l: 0.35 }, fh: { a: 190, l: 0.5 } }), 'in'), K(1, P({ lean: 14, nh: { a: 3, l: 0.58 }, fh: { a: 190, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 18, nh: { a: 2, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('nh', { abs: true, ang: 0, len: [10, 86], r: [14, 22] }) },
  // shoulder feint, forearm check, then pivots into a body-level strike
  'ss.feint': {
    keys: [K(0, GUARD), K(0.35, P({ lean: 18, nf: [0.5, 0], nh: { a: 40, l: 0.45 }, fh: { a: 140, l: 0.5 } }), 'out'), K(0.7, P({ lean: 6, nh: { a: 70, l: 0.4 }, fh: { a: 100, l: 0.45 } }), 'io'),
      K(1, P({ lean: 24, hip: -0.95, rot: 10, nf: [0.6, 0], ff: [-0.4, 0], nh: { a: -4, l: 0.58 }, fh: { a: 30, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 28, hip: -0.95, nh: { a: -8, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('nh', { abs: true, ang: -4 }), drive: [{ at: [0, 1], vx: 2 }] },
  // slides past and snaps a back-elbow into them from the opposite side
  'ss.elbow': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 22, hip: -0.8, nf: [0.7, 0], ff: [-0.5, 0], nh: { a: 20, l: 0.5 }, fh: { a: 170, l: 0.5 } }), 'in'),
      K(1, P({ lean: -16, hip: -0.9, dx: 0.4, rot: -6, nf: [0.2, 0], ff: [-0.6, 0], nh: { a: 190, l: 0.36 }, fh: { a: 40, l: 0.4 } }), 'snap'), K(1.7, P({ lean: -20, hip: -0.9, dx: 0.5, nh: { a: 195, l: 0.4 } }), 'out'), ...END()],
    fx: fxFwd('ne', { abs: true, ang: 180, len: [10, 80], r: [14, 22] }).map((e) => ({ ...e, flipY: false })), drive: [{ at: [0, 1], vx: 3.6 }] },
  // fakes a retreat, then darts back with a long-reaching thrust
  'ss.retreat': {
    keys: [K(0, GUARD), K(0.5, P({ lean: -16, hip: -0.95, dx: -0.3, nf: [0.1, 0], ff: [-0.6, 0], nh: { a: 40, l: 0.4 }, fh: { a: 150, l: 0.5 } }), 'out'),
      K(1, P({ lean: 34, hip: -0.9, dx: 0.3, nf: [0.85, 0], ff: [-0.55, 0], nh: { a: 6, l: 0.58 }, fh: { a: 180, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 38, hip: -0.9, dx: 0.36, nh: { a: 4, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('nh', { abs: true, ang: 2, len: [10, 90], r: [12, 18] }), drive: [{ at: [0, 0.5], vx: -2.4 }, { at: [0.55, 1.2], vx: 5 }] },
  // vaults over a low attack, lands with a heel-first cross-body kick
  'ss.vault': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 16, hip: -1.15, dy: -0.4, nf: { a: 20, l: 0.9 }, ff: { a: 0, l: 0.9 }, nh: { a: 40, l: 0.5 }, fh: { a: 100, l: 0.5 } }), 'out'),
      K(1, P({ lean: -8, hip: -1.0, dy: -0.14, nf: { a: 8, l: 1.17 }, ff: [-0.25, 0], nh: { a: 150, l: 0.5 }, fh: { a: 80, l: 0.45 } }), 'snap'), K(1.7, P({ lean: -10, hip: -1.0, dy: -0.06, nf: { a: 2, l: 1.17 }, ff: [-0.2, 0] }), 'out'), ...END()],
    fx: fxFwd('nf', { len: [10, 84], r: [14, 22] }), drive: [{ at: [0, 1], vx: 3 }] },
  // bursts forward in a low sprint and rises into a short-range rising shoulder
  'ss.sprint': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 40, hip: -0.8, nf: { a: 40, l: 0.9 }, ff: [-0.7, 0], nh: { a: -30, l: 0.5 }, fh: { a: 200, l: 0.5 } }), 'in'),
      K(1, P({ lean: 22, hip: -1.0, dy: -0.1, nf: [0.4, 0], ff: [-0.5, -0.1], nh: { a: 30, l: 0.55 }, fh: { a: 180, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 16, hip: -1.05, dy: -0.14, nh: { a: 44, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('sh', { abs: true, ang: -6, len: [10, 84], r: [16, 24] }), drive: [{ at: [0, 1.1], vx: 4.6 }] },
  // catches the target's momentum and redirects it with a compact hip toss
  'ss.hiptoss': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 10, nh: { a: 25, l: 0.58 }, fh: { a: 40, l: 0.58 }, nf: [0.45, 0], ff: [-0.3, 0] }), 'out'),
      K(1, P({ lean: 34, hip: -0.9, rot: 14, dx: 0.1, nh: { a: -10, l: 0.5 }, fh: { a: 10, l: 0.5 }, nf: [0.4, 0], ff: [-0.55, 0] }), 'snap'), K(1.7, P({ lean: 40, hip: -0.9, rot: 18, nh: { a: -20, l: 0.5 }, fh: { a: -4, l: 0.5 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'hands', to: [74, -44], via: [30, -92], r: [16, 22], u: [0, 1], ease: 'out' }] },
  // rolls forward beneath the guard and pops up with a close-range strike
  'ss.rollpop': {
    keys: [K(0, GUARD), K(0.4, P({ lean: 70, hip: -0.55, nf: [0.2, 0], ff: [-0.2, 0], nh: { a: -60, l: 0.5 }, fh: { a: -50, l: 0.5 } }), 'in'),
      K(0.8, P({ lean: 140, hip: -0.7, rot: 40, nf: { a: 120, l: 0.9 }, ff: { a: 110, l: 0.9 } }), 'io'),
      K(1, P({ lean: 14, hip: -1.0, nf: [0.5, 0], ff: [-0.3, 0], nh: { a: 20, l: 0.58 }, fh: { a: 190, l: 0.4 } }), 'snap'), K(1.7, P({ lean: 22, nh: { a: 10, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('nh', { abs: true, ang: 6, len: [10, 80], r: [16, 24] }), drive: [{ at: [0, 0.9], vx: 3.4 }] },
  // two quick body shots, then a shove that creates space
  'ss.twoshot': {
    keys: [K(0, GUARD), K(0.3, P({ lean: 16, nf: [0.55, 0], nh: { a: 6, l: 0.58 }, fh: { a: 190, l: 0.5 } }), 'snap'), K(0.55, P({ lean: 12, nh: { a: 30, l: 0.3 }, fh: { a: 8, l: 0.58 } }), 'snap'),
      K(1, P({ lean: 22, hip: -0.98, nf: [0.6, 0], nh: { a: 6, l: 0.58 }, fh: { a: 8, l: 0.58 } }), 'snap'), K(1.7, P({ lean: 26, nh: { a: 4, l: 0.58 }, fh: { a: 10, l: 0.58 } }), 'out'), ...END()],
    fx: [...fxFwd('hands', { abs: true, ang: 0, len: [10, 90], r: [14, 24] })], drive: [{ at: [0, 1], vx: 1.8 }] },
  // hooks the target at the waist, half-spin, releases them forward
  'ss.waist': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 28, hip: -0.9, nh: { a: 0, l: 0.58 }, fh: { a: 10, l: 0.58 }, nf: [0.5, 0], ff: [-0.4, 0] }), 'out'),
      K(0.85, P({ lean: 34, hip: -0.9, rot: 28, nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 } }), 'io'),
      K(1, P({ lean: 22, hip: -0.95, rot: -6, nh: { a: 10, l: 0.58 }, fh: { a: 0, l: 0.58 }, nf: [0.4, 0], ff: [-0.5, 0] }), 'snap'), K(1.7, P({ lean: 28, nh: { a: 6, l: 0.58 }, fh: { a: 2, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'hands', to: [84, -42], via: [28, -60], r: [16, 22], u: [0, 1], ease: 'out' }] },
  // sudden stop-start dash; the second burst carries the hitbox
  'ss.stopgo': {
    keys: [K(0, GUARD), K(0.3, P({ lean: 30, hip: -0.88, nf: [0.7, 0], ff: [-0.6, 0], nh: { a: 0, l: 0.4 }, fh: { a: 190, l: 0.4 } }), 'out'), K(0.6, P({ lean: 6, nf: [0.35, 0], ff: [-0.25, 0] }), 'in'),
      K(1, P({ lean: 40, hip: -0.82, nf: [0.85, 0], ff: [-0.75, -0.04], nh: { a: 2, l: 0.58 }, fh: { a: 195, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 44, hip: -0.82, nh: { a: 0, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('nh', { abs: true, ang: 0, len: [10, 90], r: [14, 22] }), drive: [{ at: [0, 0.3], vx: 3.4 }, { at: [0.62, 1.4], vx: 6 }] },
  // a jab that deliberately misses, then a longer-reaching second beat
  'ss.miss': {
    keys: [K(0, GUARD), K(0.3, P({ lean: 10, nh: { a: 4, l: 0.5 } }), 'snap'), K(0.6, P({ lean: 2, nh: { a: 30, l: 0.3 }, fh: { a: 190, l: 0.5 } }), 'io'),
      K(1, P({ lean: 34, hip: -0.9, nf: [0.75, 0], ff: [-0.55, 0], nh: { a: 2, l: 0.58 }, fh: { a: 195, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 38, nh: { a: 0, l: 0.58 } }), 'out'), ...END()],
    fx: fxFwd('nh', { abs: true, ang: 0, len: [10, 92], r: [14, 22] }), drive: [{ at: [0.5, 1.2], vx: 3.2 }] },
};
