// Down Heavy choreographies. Envelope: ground rectangle 140x45 centred on the feet (x[-70,70], y[-45,0])
// plus a shockwave that extends 70px further each side (thinner, second pulse).
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const END = (p = GUARD) => [K(2.4, p, 'io'), K(3, GUARD, 'io')];
export const fxDH = (cx = 0, o = {}) => [
  { k: 'gnd', cx, side: 0, L: [26, 70], h: [26, 45], u: [0, 0.6], ease: 'out' },
  { k: 'gnd', cx, side: 0, L: [60, 140], h: [12, 24], u: [0.4, 1], ease: 'out' },
  ...(o.up ? [{ k: 'col', cx, w: [30, 60], y0: 0, y1: -o.up, u: [0, 0.8], ease: 'out' }] : []),
];
const LOWP = (extra = {}) => P({ lean: 44, hip: -0.58, nf: [0.45, 0], ff: [-0.5, 0], nh: { a: -55, l: 0.5 }, fh: { a: -45, l: 0.5 }, ...extra });

export const DH = {
  'dh.backheel': { keys: [K(0, GUARD), K(0.7, P({ lean: -26, hip: -1.0, nf: [0.2, 0], ff: { a: 25, l: 1.0 }, nh: { a: 40, l: 0.5 }, fh: { a: 100, l: 0.5 }, head: -8 }), 'in'),
      K(1, P({ lean: 22, hip: -0.82, nf: [0.35, 0], ff: [-0.9, 0], nh: { a: 20, l: 0.5 }, fh: { a: -40, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 26, hip: -0.8, ff: [-0.95, 0] }), 'lin'), ...END()],
    fx: [{ k: 'blade', a: 'ff', len: [6, 40], r: [12, 16], u: [0, 0.6], ease: 'out' }, ...fxDH(-6)], tell: [-34, 0] },
  'dh.kneeland': { keys: [K(0, GUARD), K(0.5, LOWP(), 'in'),
      K(0.82, P({ lean: 8, hip: -1.2, dy: -0.6, dx: 0.5, nf: { a: -30, l: 1.0 }, ff: { a: -55, l: 1.0 }, nh: { a: -30, l: 0.5 }, fh: { a: 20, l: 0.5 } }), 'out'),
      K(1, P({ lean: 40, hip: -0.55, nf: [0.55, 0], ff: [-0.35, -0.02], nh: { a: -80, l: 0.58 }, fh: { a: 190, l: 0.4 } }), 'snap'), K(1.7, P({ lean: 42, hip: -0.52, nh: { a: -84, l: 0.58 } }), 'lin'), ...END(P({ lean: 14, hip: -0.9 }))],
    fx: [{ k: 'orb', from: 'nh', to: [14, -6], r: [10, 14], u: [0, 0.4], ease: 'out' }, ...fxDH(8)], drive: [{ at: [0.5, 0.95], vx: 3.2 }] },
  'dh.skid': { keys: [K(0, GUARD), K(0.6, P({ lean: 56, hip: -0.8, nf: { a: 25, l: 1.0 }, ff: [-0.8, 0], nh: { a: -10, l: 0.58 }, fh: { a: 5, l: 0.58 } }), 'in'),
      K(1, P({ lean: 86, hip: -0.62, dy: 0.1, nf: [-0.7, -0.08], ff: [-1.0, -0.04], nh: { a: -8, l: 0.58 }, fh: { a: 6, l: 0.58 } }), 'snap'), K(1.7, P({ lean: 88, hip: -0.6, dy: 0.12, nf: [-0.8, -0.05], ff: [-1.05, -0.03] }), 'lin'), ...END(P({ lean: 30, hip: -0.8 }))],
    fx: [{ k: 'blade', a: 'nh', abs: true, ang: 0, len: [8, 60], r: [14, 20], u: [0, 0.6], ease: 'out' }, ...fxDH(6)], drive: [{ at: [0.5, 1.8], vx: 5.4 }] },
  'dh.shroll': { keys: [K(0, GUARD), K(0.6, P({ lean: -8, hip: -0.62, dx: -0.2, nf: [0.1, 0], ff: [-0.7, 0], nh: { a: 20, l: 0.4 }, fh: { a: 150, l: 0.5 } }), 'in'),
      K(1, P({ lean: 112, hip: -0.62, rot: 46, dy: 0.05, nf: { a: 150, l: 1.0 }, ff: { a: 170, l: 1.0 }, nh: { a: -40, l: 0.4 }, fh: { a: -30, l: 0.4 } }), 'snap'), K(1.7, P({ lean: 130, hip: -0.55, rot: 70, dy: 0.1, nf: { a: 170, l: 1.0 }, ff: { a: 190, l: 1.0 } }), 'lin'), ...END(P({ lean: 30, hip: -0.8 }))],
    fx: [{ k: 'orb', from: 'sh', to: [26, -10], r: [18, 24], u: [0, 0.7], ease: 'out' }, ...fxDH(8)], drive: [{ at: [0.6, 1.6], vx: 4.4 }] },
  'dh.flip': { keys: [K(0, GUARD), K(0.55, P({ lean: 44, hip: -0.7, nh: { a: -40, l: 0.58 }, fh: { a: -34, l: 0.58 }, nf: [0.5, 0], ff: [-0.45, 0] }), 'out'), K(0.85, P({ lean: 24, hip: -1.0, dy: -0.12, nh: { a: 70, l: 0.5 }, fh: { a: 80, l: 0.5 } }), 'io'),
      K(1, P({ lean: 62, hip: -0.8, rot: 20, nh: { a: -76, l: 0.58 }, fh: { a: -70, l: 0.58 }, nf: [0.45, 0], ff: [-0.5, 0] }), 'snap'), K(1.7, P({ lean: 66, hip: -0.78, rot: 24, nh: { a: -84, l: 0.58 } }), 'lin'), ...END()],
    fx: [{ k: 'orb', from: 'hands', to: [34, -6], via: [26, -90], r: [14, 20], u: [0, 0.7], ease: 'in' }, ...fxDH(24)] },
  'dh.palms': { keys: [K(0, GUARD), K(0.6, P({ lean: 62, hip: -0.74, nh: { a: -72, l: 0.58 }, fh: { a: -72, l: 0.58 }, nf: [0.3, 0], ff: [-0.4, 0] }), 'in'),
      K(1, P({ lean: 84, hip: -1.05, nh: { a: -86, l: 0.58 }, fh: { a: -86, l: 0.58 }, nf: [-1.0, -0.6], ff: [-0.8, -0.3] }), 'snap'), K(1.6, P({ lean: 84, hip: -1.05, nf: [-1.05, -0.7], ff: [-0.9, -0.22] }), 'lin'), ...END(P({ lean: 40, hip: -0.8 }))],
    fx: [{ k: 'blade', a: 'nf', len: [6, 40], r: [12, 16], u: [0, 0.5], ease: 'out' }, ...fxDH(8)] },
  'dh.fist': { keys: [K(0, GUARD), K(0.7, P({ lean: -4, hip: -1.08, nh: { a: 118, l: 0.58 }, fh: { a: 150, l: 0.5 }, nf: [0.35, 0], ff: [-0.35, 0] }), 'in'),
      K(1, P({ lean: 46, hip: -0.62, nh: { a: -80, l: 0.58 }, fh: { a: 190, l: 0.45 }, nf: [0.5, 0], ff: [-0.45, 0] }), 'snap'), K(1.7, P({ lean: 48, hip: -0.6, nh: { a: -84, l: 0.58 } }), 'lin'), ...END()],
    fx: [{ k: 'orb', from: 'nh', to: [20, -6], r: [10, 14], u: [0, 0.4], ease: 'out' }, ...fxDH(16)] },
  'dh.arcd': { keys: [K(0, GUARD), K(0.7, P({ lean: 30, hip: -0.7, nh: { a: -110, l: 0.58 }, fh: { a: 190, l: 0.5 }, nf: [0.5, 0], ff: [-0.5, 0] }), 'in'),
      K(1, P({ lean: 46, hip: -0.62, nh: { a: -30, l: 0.58 }, fh: { a: 190, l: 0.45 }, nf: [0.55, 0], ff: [-0.5, 0] }), 'snap'), K(1.7, P({ lean: 50, hip: -0.6, nh: { a: 6, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'arc', c: 'sh', R: [30, 40], a0: -150, a1: -4, tail: 100, r: [10, 15], u: [0, 1], ease: 'out' }, ...fxDH(6)] },
  'dh.toes': { keys: [K(0, GUARD), K(0.65, P({ lean: -2, hip: -1.25, dy: -0.14, nf: [0.2, -0.16], ff: [-0.18, -0.16], nh: { a: 120, l: 0.58 }, fh: { a: 100, l: 0.58 } }), 'out'),
      K(1, P({ lean: 22, hip: -0.62, nf: [0.38, 0], ff: [-0.38, 0], nh: { a: -50, l: 0.58 }, fh: { a: -40, l: 0.58 } }), 'snap'), K(1.7, P({ lean: 26, hip: -0.6, nh: { a: -60, l: 0.58 }, fh: { a: -50, l: 0.58 } }), 'lin'), ...END()],
    fx: [{ k: 'blade', a: 'nf', abs: true, ang: 90, len: [4, 34], r: [12, 16], u: [0, 0.5], ease: 'out' }, ...fxDH(0)] },
  'dh.sweepd': { keys: [K(0, GUARD), K(0.65, P({ lean: -10, hip: -0.95, nf: [-0.7, 0], ff: [0.2, 0], nh: { a: 150, l: 0.5 }, fh: { a: 30, l: 0.5 } }), 'in'),
      K(1, P({ lean: 34, hip: -0.62, nf: [1.0, -0.06], ff: [-0.5, 0], nh: { a: 190, l: 0.5 }, fh: { a: 60, l: 0.5 } }), 'snap'), K(1.7, P({ lean: 38, hip: -0.6, nf: [1.08, -0.04] }), 'lin'), ...END()],
    fx: [{ k: 'blade', a: 'nf', len: [6, 44], r: [12, 16], u: [0, 0.7], ease: 'out' }, ...fxDH(8)], drive: [{ at: [0.6, 1.2], vx: 2.4 }] },
  'dh.jumpheel': { keys: [K(0, GUARD), K(0.4, P({ lean: 10, hip: -0.85, nf: [0.35, 0], ff: [-0.35, 0] }), 'in'),
      K(0.8, P({ lean: 10, hip: -1.3, dy: -0.8, dx: 0.7, nf: { a: 30, l: 1.0 }, ff: { a: 10, l: 1.0 }, nh: { a: 70, l: 0.5 }, fh: { a: 120, l: 0.5 } }), 'out'),
      K(1, P({ lean: -26, hip: -0.8, dy: -0.1, dx: 0.35, nf: [0.2, 0], ff: [-0.95, -0.12], nh: { a: 100, l: 0.5 }, fh: { a: 40, l: 0.5 } }), 'snap'), K(1.7, P({ lean: -30, hip: -0.78, dx: 0.3, ff: [-1.0, -0.06] }), 'lin'), ...END()],
    fx: [{ k: 'blade', a: 'ff', len: [6, 40], r: [12, 16], u: [0, 0.6], ease: 'out' }, ...fxDH(-4)], drive: [{ at: [0.4, 0.9], vx: 3.4, vy: -3 }] },
  'dh.still': { keys: [K(0, GUARD), K(0.3, P({ lean: 0, hip: -1.0, nh: { a: 60, l: 0.5 }, fh: { a: 70, l: 0.5 } }), 'out'), K(0.9, P({ lean: 0, hip: -1.0, nh: { a: 60, l: 0.5 }, fh: { a: 70, l: 0.5 } }), 'lin'),
      K(1, P({ lean: 40, hip: -0.62, nh: { a: -70, l: 0.58 }, fh: { a: -70, l: 0.58 }, nf: [0.45, 0], ff: [-0.45, 0] }), 'snap'), K(1.7, P({ lean: 44, hip: -0.6, nh: { a: -78, l: 0.58 }, fh: { a: -78, l: 0.58 } }), 'lin'), ...END()],
    fx: [{ k: 'ring', c: [0, -4], R: [30, 84], box: [150, 36], sy: 0.22, u: [0, 0.7], ease: 'out' }, ...fxDH(0).slice(1)] },
};
