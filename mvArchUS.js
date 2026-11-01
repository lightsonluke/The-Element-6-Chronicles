// Up Signature choreographies. Envelope: vertical rectangle 70x95 above the head
// (local px x[-35,35] y[-150,-55]).  Every move: authored poses + effects anchored to the limb.
import { P, GUARD } from './mvCore.js';

const K = (at, p, e) => ({ at, p, e });
const END = (p = GUARD) => [K(2.35, p, 'io'), K(3, GUARD, 'io')];

// limb-anchored rising blade + force wake filling the spec rectangle above the head
export const fxUp = (a, o = {}) => [
  { k: 'blade', a, ang: o.ang || 0, abs: o.abs, len: o.len || [10, 78], r: o.r || [10, 14], u: [0, 1], ease: 'out', bend: o.bend },
  { k: 'col', cx: o.cx ?? 6, w: o.w || [26, 62], y0: -58, y1: o.top ?? -148, u: [o.wakeFrom ?? 0.15, 1], ease: 'out', tilt: o.tilt || 0, slide: !!o.slide, spin: o.spin },
];

export const US = {
  // leans back to bait, springs forward into a rising heel kick
  'us.bait': {
    keys: [K(0, GUARD), K(0.6, P({ lean: -22, hip: -0.98, nf: [0.22, 0], ff: [-0.5, 0], nh: { a: 30, l: 0.5 }, fh: { a: 10, l: 0.45 }, head: -6 }), 'in'),
      K(1, P({ lean: 2, hip: -1.0, nf: { a: 80, l: 1.17 }, ff: [-0.18, 0], nh: { a: 150, l: 0.5 }, fh: { a: -40, l: 0.45 } }), 'snap'),
      K(1.7, P({ lean: -8, hip: -1.0, nf: { a: 104, l: 1.17 }, ff: [-0.1, 0], nh: { a: 165, l: 0.55 }, fh: { a: -60, l: 0.4 } }), 'out'), ...END(P({ lean: 4, nf: [0.4, 0] }))],
    fx: fxUp('nf', { cx: 4 }) },
  // runner's stance then shoots up a sharp diagonal
  'us.runner': {
    keys: [K(0, GUARD), K(0.7, P({ lean: 40, hip: -0.78, nf: { a: 28, l: 0.85 }, ff: [-0.66, 0], nh: { a: -25, l: 0.5 }, fh: { a: 205, l: 0.55 } }), 'in'),
      K(1, P({ lean: 26, hip: -1.05, dy: -0.28, nf: { a: 70, l: 0.9 }, ff: [-0.7, -0.2], nh: { a: 78, l: 0.58 }, fh: { a: 190, l: 0.5 } }), 'snap'),
      K(1.8, P({ lean: 14, hip: -1.05, dy: -0.34, nf: { a: 82, l: 0.95 }, ff: [-0.6, -0.1], nh: { a: 92, l: 0.58 }, fh: { a: 200, l: 0.4 } }), 'out'), ...END()],
    fx: fxUp('nh', { cx: 10, tilt: 14, ang: -6 }), drive: [{ at: [0.6, 1.2], vx: 3.2 }] },
  // short arc around the target, rising backfist from the blind side
  'us.arcback': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 22, hip: -0.9, nf: { a: 15, l: 1.0 }, ff: [-0.55, 0], nh: { a: -10, l: 0.5 }, fh: { a: 190, l: 0.5 } }), 'in'),
      K(1, P({ lean: -6, hip: -1.0, dx: -0.15, nf: [0.1, 0], ff: [-0.3, 0], nh: { a: 100, l: 0.58 }, fh: { a: -50, l: 0.4 }, head: 8 }), 'snap'),
      K(1.7, P({ lean: -14, hip: -1.0, dx: -0.2, nf: [0.1, 0], ff: [-0.3, 0], nh: { a: 128, l: 0.58 }, fh: { a: -70, l: 0.4 } }), 'out'), ...END()],
    fx: [{ k: 'arc', c: [-4, -48], R: [44, 52], a0: -20, a1: 120, tail: 90, r: [10, 14], u: [0, 1], ease: 'out' }, ...fxUp('nh', { len: [6, 50], cx: -4 }).slice(1)], drive: [{ at: [0, 1], vx: 2.4 }] },
  // weight onto one hand, scissor-kick upward from a handstand
  'us.handst': {
    keys: [K(0, GUARD), K(0.7, P({ lean: 62, hip: -0.8, nf: { a: 20, l: 1.0 }, ff: [-0.5, 0], nh: { a: -80, l: 0.58 }, fh: { a: 20, l: 0.4 } }), 'in'),
      K(1, P({ lean: 160, hip: -1.25, dy: 0.1, nf: { a: 66, l: 1.17 }, ff: { a: 118, l: 1.17 }, nh: { a: -90, l: 0.58 }, fh: { a: -60, l: 0.3 } }), 'snap'),
      K(1.7, P({ lean: 170, hip: -1.25, dy: 0.1, nf: { a: 108, l: 1.17 }, ff: { a: 70, l: 1.17 }, nh: { a: -90, l: 0.58 }, fh: { a: -70, l: 0.3 } }), 'io'),
      K(2.2, P({ lean: 40, hip: -0.9, nf: [0.4, 0], ff: [-0.3, 0] }), 'io'), K(3, GUARD, 'io')],
    fx: [{ k: 'blade', a: 'nf', len: [10, 70], r: [9, 13], u: [0, 0.55], ease: 'out' }, { k: 'blade', a: 'ff', len: [10, 70], r: [9, 13], u: [0.35, 1], ease: 'out' },
      { k: 'col', cx: 4, w: [30, 64], y0: -56, y1: -148, u: [0.2, 1], ease: 'out' }] },
  // two quick sidesteps then a vaulting shoulder check
  'us.sidestep': {
    keys: [K(0, GUARD), K(0.3, P({ lean: 10, nf: [0.1, -0.05], ff: [0.35, 0] }), 'io'), K(0.62, P({ lean: 10, nf: [0.4, 0], ff: [-0.2, -0.06] }), 'io'),
      K(0.85, P({ lean: 28, hip: -0.82, nf: { a: 40, l: 0.8 }, ff: [-0.5, 0], nh: { a: -20, l: 0.5 }, fh: { a: 190, l: 0.5 } }), 'in'),
      K(1, P({ lean: 12, hip: -1.08, dy: -0.22, nf: { a: 64, l: 0.9 }, ff: [-0.4, -0.12], nh: { a: 88, l: 0.56 }, fh: { a: 175, l: 0.45 } }), 'snap'),
      K(1.7, P({ lean: 4, hip: -1.08, dy: -0.28, nf: { a: 78, l: 0.95 }, ff: [-0.3, -0.05], nh: { a: 96, l: 0.58 }, fh: { a: 180, l: 0.4 } }), 'out'), ...END()],
    fx: fxUp('nh', { cx: 8, ang: -4 }), drive: [{ at: [0, 0.8], vx: 2 }] },
  // slips behind a low guard and springs up with a compact double-knee
  'us.knee': {
    keys: [K(0, GUARD), K(0.65, P({ lean: 24, hip: -0.68, nf: { a: 10, l: 0.85 }, ff: [-0.4, 0], nh: { a: -10, l: 0.4 }, fh: { a: 20, l: 0.4 } }), 'in'),
      K(1, P({ lean: 2, hip: -1.2, dy: -0.34, nf: { a: 78, l: 0.62 }, ff: { a: 70, l: 0.62 }, nh: { a: 60, l: 0.4 }, fh: { a: 100, l: 0.4 } }), 'snap'),
      K(1.7, P({ lean: -2, hip: -1.2, dy: -0.4, nf: { a: 84, l: 0.62 }, ff: { a: 80, l: 0.62 }, nh: { a: 50, l: 0.4 }, fh: { a: 110, l: 0.4 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'nk', to: (e, sc) => [10 * sc, -92 * sc], r: [12, 16], u: [0, 1], ease: 'out' }, { k: 'col', cx: 4, w: [34, 64], y0: -60, y1: -146, u: [0.1, 1], ease: 'out' }], drive: [] },
  // crouches, rolls under the target, elbow whipped upward on the exit
  'us.rollelb': {
    keys: [K(0, GUARD), K(0.4, P({ lean: 48, hip: -0.62, nf: [0.3, 0], ff: [-0.2, 0], nh: { a: -50, l: 0.4 }, fh: { a: -40, l: 0.4 } }), 'in'),
      K(0.8, P({ lean: 110, hip: -0.7, rot: 30, nf: { a: 150, l: 0.9 }, ff: { a: 180, l: 0.9 }, nh: { a: -30, l: 0.3 }, fh: { a: -20, l: 0.3 } }), 'io'),
      K(1, P({ lean: 12, hip: -1.0, nf: [0.2, 0], ff: [-0.3, 0], nh: { a: 105, l: 0.34 }, fh: { a: 60, l: 0.34 } }), 'snap'),
      K(1.7, P({ lean: 0, hip: -1.02, nf: [0.2, 0], ff: [-0.3, 0], nh: { a: 118, l: 0.4 }, fh: { a: 70, l: 0.34 } }), 'out'), ...END()],
    fx: fxUp('ne', { len: [14, 72], r: [11, 15], cx: 6 }), drive: [{ at: [0.2, 0.9], vx: 3 }] },
  // jumps past the target, twists in midair, backward kick
  'us.jumpback': {
    keys: [K(0, GUARD), K(0.6, P({ lean: 18, hip: -0.85, nf: { a: 20, l: 0.9 }, ff: [-0.5, 0], nh: { a: 20, l: 0.5 }, fh: { a: 180, l: 0.5 } }), 'in'),
      K(1, P({ lean: -40, hip: -1.15, dy: -0.4, rot: -28, nf: { a: 75, l: 1.17 }, ff: { a: 20, l: 1.0 }, nh: { a: 130, l: 0.58 }, fh: { a: 30, l: 0.4 } }), 'snap'),
      K(1.7, P({ lean: -52, hip: -1.15, dy: -0.46, rot: -34, nf: { a: 100, l: 1.17 }, ff: { a: 10, l: 1.0 }, nh: { a: 140, l: 0.58 }, fh: { a: 20, l: 0.4 } }), 'out'), ...END()],
    fx: fxUp('nf', { cx: -2 }), drive: [{ at: [0.6, 1.4], vx: -1.4, vy: -2.4 }] },
  // lunges forward first, then redirects into a steep diagonal upper-body strike
  'us.lunge': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 44, hip: -0.72, nf: { a: 34, l: 0.95 }, ff: [-0.75, 0], nh: { a: 0, l: 0.58 }, fh: { a: 200, l: 0.5 } }), 'in'),
      K(1, P({ lean: 8, hip: -1.05, nf: [0.35, 0], ff: [-0.3, 0], nh: { a: 76, l: 0.58 }, fh: { a: 200, l: 0.45 } }), 'snap'),
      K(1.7, P({ lean: -4, hip: -1.08, dy: -0.12, nf: [0.3, 0], ff: [-0.3, -0.02], nh: { a: 100, l: 0.58 }, fh: { a: 205, l: 0.4 } }), 'out'), ...END()],
    fx: fxUp('nh', { cx: 10, tilt: 18, ang: 0 }), drive: [{ at: [0, 0.9], vx: 4.2 }] },
  // draws the target close with a brief pull, then releases through an upward burst
  'us.pull': {
    keys: [K(0, GUARD), K(0.45, P({ lean: 8, nh: { a: 10, l: 0.58 }, fh: { a: 30, l: 0.58 } }), 'out'),
      K(0.8, P({ lean: 14, hip: -0.9, nh: { a: -5, l: 0.3 }, fh: { a: 10, l: 0.3 }, nf: [0.35, 0], ff: [-0.3, 0] }), 'in'),
      K(1, P({ lean: -4, hip: -1.08, dy: -0.1, nh: { a: 88, l: 0.58 }, fh: { a: 98, l: 0.58 }, nf: [0.3, 0], ff: [-0.3, 0] }), 'snap'),
      K(1.7, P({ lean: -8, hip: -1.08, dy: -0.12, nh: { a: 92, l: 0.58 }, fh: { a: 90, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'hands', to: [6, -118], r: [14, 20], u: [0, 1], ease: 'out' }, { k: 'col', cx: 2, w: [40, 68], y0: -58, y1: -148, u: [0.1, 1], ease: 'out' }] },
  // plants one foot, pivots under the opponent, corkscrew rising knee
  'us.cork': {
    keys: [K(0, GUARD), K(0.6, P({ lean: 28, hip: -0.84, nf: [0.35, 0], ff: [-0.55, 0], nh: { a: -15, l: 0.5 }, fh: { a: 170, l: 0.5 } }), 'in'),
      K(1, P({ lean: -4, hip: -1.12, dy: -0.28, rot: 8, nf: { a: 82, l: 0.7 }, ff: [-0.05, 0], nh: { a: 120, l: 0.5 }, fh: { a: 40, l: 0.5 } }), 'snap'),
      K(1.7, P({ lean: -6, hip: -1.12, dy: -0.34, rot: 18, nf: { a: 88, l: 0.72 }, ff: [-0.05, 0], nh: { a: 140, l: 0.5 }, fh: { a: 30, l: 0.5 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'nk', to: (e, sc) => [8 * sc + Math.sin(e * 9) * 10 * sc, -62 * sc - e * 70 * sc], r: [12, 15], u: [0, 1], ease: 'out' }, { k: 'col', cx: 6, w: [30, 62], y0: -58, y1: -148, u: [0.1, 1], ease: 'out', spin: 1 }] },
  // short feint, hops over the target's head, descending-to-rising spin clips them
  'us.hop': {
    keys: [K(0, GUARD), K(0.4, P({ lean: 14, hip: -0.9, nf: [0.3, 0], ff: [-0.3, 0] }), 'in'),
      K(0.8, P({ lean: -10, hip: -1.25, dy: -0.5, nf: { a: 30, l: 0.9 }, ff: { a: 5, l: 0.9 }, nh: { a: 70, l: 0.5 }, fh: { a: 120, l: 0.5 } }), 'out'),
      K(1, P({ lean: -34, hip: -1.2, dy: -0.52, rot: -50, nf: { a: 74, l: 1.1 }, ff: { a: 18, l: 0.9 }, nh: { a: 130, l: 0.58 }, fh: { a: 40, l: 0.5 } }), 'snap'),
      K(1.7, P({ lean: -50, hip: -1.2, dy: -0.5, rot: -80, nf: { a: 100, l: 1.1 }, ff: { a: 40, l: 0.9 }, nh: { a: 150, l: 0.58 }, fh: { a: 50, l: 0.5 } }), 'out'), K(2.4, P({ lean: 10, hip: -0.9, nf: [0.3, 0], ff: [-0.3, 0] }), 'io'), K(3, GUARD, 'io')],
    fx: [{ k: 'arc', c: [2, -62], R: [36, 46], a0: 20, a1: 160, tail: 100, r: [10, 14], u: [0, 1], ease: 'out' }, { k: 'col', cx: 0, w: [30, 64], y0: -60, y1: -148, u: [0.1, 1], ease: 'out' }], drive: [{ at: [0.3, 1], vx: 1.6, vy: -2 }] },
};
