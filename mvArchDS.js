// Down Signature choreographies. Envelope: ground zone 120x35 centred on the feet (x[-60,60], y[-35,0]).
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const END = (p = GUARD) => [K(2.3, p, 'io'), K(3, GUARD, 'io')];
const G = (cx, side, L, h, u, o = {}) => ({ k: 'gnd', cx, side, L, h, u: u || [0, 1], ease: 'out', ...o });

export const DS = {
  // spins on one heel, sweeps both legs in a tight circle
  'ds.spin': {
    keys: [K(0, GUARD), K(0.6, P({ lean: 34, hip: -0.62, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: 150, l: 0.5 }, fh: { a: 20, l: 0.5 } }), 'in'),
      K(1, P({ lean: 40, hip: -0.55, nf: [1.05, -0.05], ff: [-1.0, -0.05], nh: { a: 100, l: 0.58 }, fh: { a: -80, l: 0.58 } }), 'snap'),
      K(1.55, P({ lean: 40, hip: -0.55, nf: [-0.95, -0.05], ff: [1.0, -0.05], nh: { a: -80, l: 0.58 }, fh: { a: 100, l: 0.58 } }), 'lin'), ...END(P({ lean: 20, hip: -0.8, nf: [0.4, 0], ff: [-0.3, 0] }))],
    fx: [{ k: 'blade', a: 'nf', len: [8, 42], r: [10, 13], u: [0, 0.55], ease: 'out' }, { k: 'blade', a: 'ff', len: [8, 42], r: [10, 13], u: [0.4, 1], ease: 'out' }, G(0, 0, [34, 60], [26, 35], [0, 1])] },
  // tiny backward hop, then a low flick through the space the opponent follows into
  'ds.hopflick': {
    keys: [K(0, GUARD), K(0.5, P({ lean: -10, hip: -1.18, dy: -0.26, dx: -0.35, nf: { a: -40, l: 1.0 }, ff: { a: -50, l: 1.0 }, nh: { a: 40, l: 0.5 }, fh: { a: 90, l: 0.5 } }), 'out'),
      K(1, P({ lean: 30, hip: -0.8, nf: [1.0, -0.04], ff: [-0.45, 0], nh: { a: -30, l: 0.58 }, fh: { a: 200, l: 0.5 } }), 'snap'), K(1.6, P({ lean: 34, hip: -0.78, nf: [1.05, -0.04], ff: [-0.45, 0], nh: { a: -30, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'blade', a: 'nf', len: [8, 48], r: [10, 13], u: [0, 1], ease: 'out' }, G(14, 1, [34, 60], [22, 35], [0, 1])], drive: [{ at: [0, 0.6], vx: -2 }] },
  // taps the ground; the hazard erupts after he has stepped away
  'ds.tap': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 40, hip: -0.62, nh: { a: -60, l: 0.58 }, fh: { a: -20, l: 0.4 }, nf: [0.4, 0], ff: [-0.3, 0] }), 'in'),
      K(0.85, P({ lean: 12, hip: -0.9, dx: -0.45, nh: { a: -30, l: 0.4 }, fh: { a: 10, l: 0.4 }, nf: [0.1, 0], ff: [-0.7, 0] }), 'out'),
      K(1, P({ lean: 8, hip: -1.0, dx: -0.5, nf: [0.1, 0], ff: [-0.7, 0], nh: { a: 20, l: 0.5 }, fh: { a: 40, l: 0.4 } }), 'out'), K(1.6, P({ lean: 6, hip: -1.0, dx: -0.5 }), 'lin'), ...END()],
    fx: [G(40, 0, [14, 28], [14, 35], [0, 1]), { k: 'col', cx: 40, w: [30, 50], y0: 0, y1: -34, u: [0, 1], ease: 'out' }], tell: [40, 0] },
  // ducks beneath the opponent and rakes a short strike across their landing point
  'ds.rake': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 44, hip: -0.52, nf: [0.5, 0], ff: [-0.5, 0], nh: { a: -10, l: 0.5 }, fh: { a: 190, l: 0.5 } }), 'in'),
      K(1, P({ lean: 48, hip: -0.5, nf: [0.6, 0], ff: [-0.5, 0], nh: { a: -22, l: 0.58 }, fh: { a: 190, l: 0.4 } }), 'snap'), K(1.6, P({ lean: 50, hip: -0.5, nf: [0.6, 0], nh: { a: -35, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'blade', a: 'nh', len: [8, 56], r: [10, 13], u: [0, 1], ease: 'out' }, G(24, 1, [30, 60], [22, 35], [0.1, 1])] },
  // stamps once, hops back, a delayed second hit triggers in the first spot
  'ds.stamp': {
    keys: [K(0, GUARD), K(0.45, P({ lean: 6, nf: { a: 55, l: 0.9 }, ff: [-0.25, 0], nh: { a: 30, l: 0.5 }, fh: { a: 70, l: 0.4 } }), 'in'),
      K(0.75, P({ lean: 10, hip: -0.95, nf: [0.55, 0], ff: [-0.3, 0] }), 'snap'),
      K(1, P({ lean: -6, hip: -1.2, dy: -0.34, dx: -0.4, nf: { a: -40, l: 1.0 }, ff: { a: -60, l: 1.0 }, nh: { a: 60, l: 0.5 }, fh: { a: 100, l: 0.5 } }), 'out'),
      K(1.7, P({ lean: 8, hip: -1.0, dx: -0.45, nf: [0.2, 0], ff: [-0.55, 0] }), 'in'), ...END()],
    fx: [G(34, 0, [14, 22], [12, 24], [0, 0.45]), G(34, 0, [26, 60], [20, 35], [0.5, 1]), { k: 'col', cx: 34, w: [30, 54], y0: 0, y1: -32, u: [0.5, 1], ease: 'out' }], drive: [{ at: [0.9, 1.5], vx: -2.4 }], tell: [34, 0] },
  // plants both hands down and kicks backward in a low, split-legged burst
  'ds.handkick': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 60, hip: -0.7, nh: { a: -70, l: 0.58 }, fh: { a: -70, l: 0.58 }, nf: [0.3, 0], ff: [-0.4, 0] }), 'in'),
      K(1, P({ lean: 82, hip: -1.0, dy: 0.05, nh: { a: -85, l: 0.58 }, fh: { a: -85, l: 0.58 }, nf: [-1.0, -0.5], ff: [-0.75, -0.2] }), 'snap'),
      K(1.6, P({ lean: 82, hip: -1.0, nh: { a: -85, l: 0.58 }, fh: { a: -85, l: 0.58 }, nf: [-1.05, -0.62], ff: [-0.9, -0.12] }), 'out'), ...END(P({ lean: 40, hip: -0.8 }))],
    fx: [{ k: 'blade', a: 'nf', len: [8, 46], r: [11, 14], u: [0, 1], ease: 'out' }, G(-8, 0, [34, 60], [22, 35], [0.1, 1])] },
  // catches the wrist, turns under the arm, short throw downward
  'ds.wrist': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 14, nh: { a: 15, l: 0.58 }, fh: { a: 28, l: 0.58 }, nf: [0.45, 0], ff: [-0.25, 0] }), 'out'),
      K(0.85, P({ lean: 28, hip: -0.88, rot: 10, nh: { a: 40, l: 0.5 }, fh: { a: 50, l: 0.5 }, nf: [0.4, 0], ff: [-0.4, 0] }), 'io'),
      K(1, P({ lean: 44, hip: -0.78, rot: 20, nh: { a: -48, l: 0.5 }, fh: { a: -40, l: 0.5 }, nf: [0.4, 0], ff: [-0.5, 0] }), 'snap'), K(1.6, P({ lean: 46, hip: -0.78, rot: 22, nh: { a: -62, l: 0.5 }, fh: { a: -55, l: 0.5 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'hands', to: [34, -8], r: [12, 16], u: [0, 1], ease: 'in' }, G(26, 1, [28, 58], [22, 35], [0.2, 1])] },
  // slides forward on one knee and clips the opponent's shins
  'ds.kneeslide': {
    keys: [K(0, GUARD), K(0.5, P({ lean: 22, hip: -0.8, nf: [0.55, 0], ff: [-0.5, 0], nh: { a: 20, l: 0.5 }, fh: { a: 190, l: 0.5 } }), 'in'),
      K(1, P({ lean: 24, hip: -0.45, nf: [1.0, -0.04], ff: [-0.35, -0.02], nh: { a: 30, l: 0.5 }, fh: { a: 180, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 26, hip: -0.42, nf: [1.05, -0.04], ff: [-0.3, -0.02] }), 'lin'), ...END(P({ lean: 14, hip: -0.8 }))],
    fx: [{ k: 'blade', a: 'nf', len: [8, 44], r: [10, 13], u: [0, 1], ease: 'out' }, G(16, 1, [34, 60], [22, 35], [0, 1])], drive: [{ at: [0.4, 1.8], vx: 4.2 }] },
  // leans sideways, whips a heel across the floor in a sudden low arc
  'ds.heel': {
    keys: [K(0, GUARD), K(0.6, P({ lean: -18, hip: -0.9, nf: [-0.6, -0.25], ff: [0.1, 0], nh: { a: 150, l: 0.5 }, fh: { a: 30, l: 0.5 } }), 'in'),
      K(1, P({ lean: 34, hip: -0.8, nf: [0.95, -0.06], ff: [-0.4, 0], nh: { a: 190, l: 0.55 }, fh: { a: 60, l: 0.5 } }), 'snap'), K(1.6, P({ lean: 38, hip: -0.8, nf: [1.05, -0.04], ff: [-0.4, 0] }), 'out'), ...END()],
    fx: [{ k: 'arc', c: [0, -6], R: [42, 56], a0: -160, a1: -20, tail: 90, r: [8, 12], u: [0, 1], ease: 'out' }, G(8, 0, [34, 60], [20, 35], [0.1, 1])] },
  // steps across the stance, bumps them off balance with a sharp hip check
  'ds.hip': {
    keys: [K(0, GUARD), K(0.55, P({ lean: -12, hip: -1.0, dx: -0.1, nf: [0.7, 0], ff: [-0.4, 0], nh: { a: 40, l: 0.5 }, fh: { a: 140, l: 0.5 } }), 'in'),
      K(1, P({ lean: -2, hip: -0.95, dx: 0.35, nf: [0.65, 0], ff: [-0.05, 0], nh: { a: 70, l: 0.5 }, fh: { a: 120, l: 0.5 } }), 'snap'), K(1.6, P({ lean: 4, hip: -0.95, dx: 0.42 }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'hip', to: (e, sc) => [26 * sc, -26 * sc], r: [14, 18], u: [0, 1], ease: 'out' }, G(14, 0, [34, 60], [22, 35], [0, 1])], drive: [{ at: [0.5, 1.2], vx: 2 }] },
  // hooks an ankle behind the opponent's heel and twists away into a low sweep
  'ds.ankle': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 10, hip: -0.85, nf: [0.95, -0.04], ff: [-0.35, 0], nh: { a: 180, l: 0.5 }, fh: { a: 20, l: 0.5 } }), 'out'),
      K(1, P({ lean: -14, hip: -0.8, rot: -10, nf: [-0.1, -0.05], ff: [-0.35, 0], nh: { a: 190, l: 0.5 }, fh: { a: 30, l: 0.5 } }), 'snap'), K(1.6, P({ lean: -18, hip: -0.8, nf: [-0.55, -0.05] }), 'out'), ...END()],
    fx: [{ k: 'blade', a: 'nf', len: [8, 44], r: [10, 13], u: [0, 1], ease: 'out' }, G(6, 0, [34, 60], [22, 35], [0.1, 1])] },
  // drops to one knee and drives a palm into the floor, a narrow pulse beneath nearby feet
  'ds.palm': {
    keys: [K(0, GUARD), K(0.55, P({ lean: 30, hip: -0.8, nh: { a: 30, l: 0.5 }, nf: [0.4, 0], ff: [-0.3, 0] }), 'in'),
      K(1, P({ lean: 42, hip: -0.52, nh: { a: -70, l: 0.58 }, fh: { a: 190, l: 0.45 }, nf: [0.5, 0], ff: [-0.3, 0] }), 'snap'), K(1.6, P({ lean: 44, hip: -0.5, nh: { a: -74, l: 0.58 } }), 'lin'), ...END()],
    fx: [{ k: 'orb', from: 'nh', to: [20, -4], r: [8, 12], u: [0, 0.4], ease: 'out' }, G(14, 0, [20, 60], [18, 35], [0.1, 1])] },
};
