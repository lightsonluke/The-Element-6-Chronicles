// Up Heavy choreographies. Envelope: vertical rectangle 90x125 from torso to above the head (x[-45,45] y[-165,-40]).
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const END = (p = GUARD) => [K(2.4, p, 'io'), K(3, GUARD, 'io')];
const fxU = (a, o = {}) => [
  { k: 'blade', a, ang: o.ang || 0, abs: o.abs, len: o.len || [14, 96], r: o.r || [13, 19], u: [0, 1], ease: 'out', bend: o.bend },
  { k: 'col', cx: o.cx ?? 6, w: o.w || [36, 84], y0: -42, y1: o.top ?? -162, u: [o.wake ?? 0.1, 1], ease: 'out', tilt: o.tilt || 0, spin: o.spin },
];
const LOW = P({ lean: 40, hip: -0.55, nf: [0.4, 0], ff: [-0.5, 0], nh: { a: -55, l: 0.5 }, fh: { a: -45, l: 0.5 } });

export const UH = {
  'uh.shoulder': { keys: [K(0, GUARD), K(0.7, P({ lean: 46, hip: -0.52, nf: [0.45, 0], ff: [-0.6, 0], nh: { a: -40, l: 0.45 }, fh: { a: 200, l: 0.5 } }), 'in'),
      K(1, P({ lean: 6, hip: -1.15, dy: -0.3, nf: [0.4, -0.1], ff: [-0.5, -0.2], nh: { a: 84, l: 0.5 }, fh: { a: 170, l: 0.45 }, head: -6 }), 'snap'),
      K(1.7, P({ lean: -6, hip: -1.15, dy: -0.4, nf: [0.35, -0.2], ff: [-0.45, -0.3], nh: { a: 96, l: 0.5 }, fh: { a: 175, l: 0.4 } }), 'out'), ...END()],
    fx: fxU('nh', { cx: 8, ang: 0 }), drive: [{ at: [0.5, 1.1], vx: 2.6 }] },
  'uh.clinch': { keys: [K(0, GUARD), K(0.5, P({ lean: 20, hip: -0.9, nh: { a: 6, l: 0.58 }, fh: { a: 16, l: 0.58 }, nf: [0.5, 0], ff: [-0.4, 0] }), 'out'),
      K(0.85, P({ lean: 30, hip: -0.8, nh: { a: -10, l: 0.4 }, fh: { a: 0, l: 0.4 }, nf: [0.45, 0], ff: [-0.55, 0] }), 'io'),
      K(1, P({ lean: -28, hip: -1.0, nh: { a: 112, l: 0.55 }, fh: { a: 96, l: 0.55 }, nf: [0.45, 0], ff: [-0.3, 0] }), 'snap'), K(1.7, P({ lean: -34, hip: -1.0, nh: { a: 120, l: 0.58 }, fh: { a: 104, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'orb', from: 'hands', to: [14, -150], via: [-6, -96], r: [20, 28], u: [0, 1], ease: 'out' }, { k: 'col', cx: 6, w: [44, 84], y0: -42, y1: -160, u: [0.1, 1], ease: 'out' }] },
  'uh.backfist': { keys: [K(0, GUARD), K(0.65, P({ lean: 24, hip: -0.8, nh: { a: -62, l: 0.58 }, fh: { a: 190, l: 0.5 }, nf: [0.5, 0], ff: [-0.5, 0] }), 'in'),
      K(1, P({ lean: 0, hip: -1.05, nh: { a: 70, l: 0.58 }, fh: { a: 190, l: 0.4 }, nf: [0.35, 0], ff: [-0.35, 0] }), 'snap'), K(1.7, P({ lean: -8, hip: -1.05, nh: { a: 118, l: 0.58 }, fh: { a: 200, l: 0.4 } }), 'out'), ...END()],
    fx: [{ k: 'arc', c: 'sh', R: [30, 44], a0: -70, a1: 130, tail: 120, r: [14, 20], u: [0, 1], ease: 'out' }, ...fxU('nh', { len: [10, 60] }).slice(1)] },
  'uh.heeldrop': { keys: [K(0, GUARD), K(0.5, P({ lean: 16, hip: -0.85, nf: [0.35, 0], ff: [-0.4, 0] }), 'in'),
      K(0.85, P({ lean: -10, hip: -1.3, dy: -0.7, dx: 0.5, nf: { a: 78, l: 1.17 }, ff: { a: 40, l: 1.0 }, nh: { a: 120, l: 0.5 }, fh: { a: 60, l: 0.5 } }), 'out'),
      K(1, P({ lean: 24, hip: -1.25, dy: -0.5, dx: 0.5, rot: 60, nf: { a: -50, l: 1.17 }, ff: { a: 10, l: 1.0 }, nh: { a: 20, l: 0.5 }, fh: { a: 60, l: 0.5 } }), 'snap'),
      K(1.7, P({ lean: -14, hip: -1.25, dy: -0.8, dx: 0.3, rot: -10, nf: { a: 100, l: 1.17 }, ff: { a: 70, l: 1.0 }, nh: { a: 140, l: 0.5 }, fh: { a: 90, l: 0.5 } }), 'out'), ...END(P({ lean: 10 }))],
    fx: [{ k: 'blade', a: 'nf', len: [10, 86], r: [14, 20], u: [0, 0.5], ease: 'out' }, ...fxU('nf', { len: [10, 80], cx: 10, wake: 0.3 }).map((e, i) => (i ? { ...e, u: [0.45, 1] } : { ...e, u: [0.35, 1] }))], drive: [{ at: [0.4, 1.0], vx: 2.6, vy: -1.6 }] },
  'uh.upper': { keys: [K(0, GUARD), K(0.65, LOW, 'in'),
      K(1, P({ lean: -2, hip: -1.1, dy: -0.18, nf: [0.35, 0], ff: [-0.35, 0], nh: { a: 82, l: 0.58 }, fh: { a: 90, l: 0.58 } }), 'snap'), K(1.7, P({ lean: -10, hip: -1.12, dy: -0.26, nh: { a: 96, l: 0.58 }, fh: { a: 104, l: 0.58 } }), 'out'), ...END()],
    fx: fxU('hands', { ang: 0, abs: true, cx: 8 }).map((e) => (e.k === 'blade' ? { ...e, ang: -90 } : e)) },
  'uh.scythe': { keys: [K(0, GUARD), K(0.6, P({ lean: 76, hip: -0.7, nh: { a: -75, l: 0.58 }, fh: { a: 20, l: 0.4 }, nf: [0.2, 0], ff: [-0.5, 0] }), 'in'),
      K(1, P({ lean: 128, hip: -1.2, rot: 20, dy: 0.1, nh: { a: -88, l: 0.58 }, fh: { a: -40, l: 0.3 }, nf: { a: 30, l: 1.17 }, ff: { a: 5, l: 1.1 } }), 'snap'),
      K(1.7, P({ lean: 168, hip: -1.25, dy: 0.12, nh: { a: -90, l: 0.58 }, fh: { a: -60, l: 0.3 }, nf: { a: 110, l: 1.17 }, ff: { a: 90, l: 1.1 } }), 'out'),
      K(2.3, P({ lean: 40, hip: -0.9, nf: [0.4, 0], ff: [-0.3, 0] }), 'io'), K(3, GUARD, 'io')],
    fx: [{ k: 'arc', c: 'hip', R: [32, 40], a0: -20, a1: 150, tail: 120, r: [14, 20], u: [0, 1], ease: 'out' }, { k: 'col', cx: 4, w: [40, 84], y0: -42, y1: -160, u: [0.2, 1], ease: 'out' }] },
  'uh.feintup': { keys: [K(0, GUARD), K(0.35, P({ lean: 44, hip: -0.62, nh: { a: -72, l: 0.58 }, fh: { a: -30, l: 0.4 }, nf: [0.45, 0], ff: [-0.4, 0] }), 'out'), K(0.65, P({ lean: 54, hip: -0.55, nh: { a: -78, l: 0.58 }, nf: [0.5, 0], ff: [-0.5, 0] }), 'io'),
      K(1, P({ lean: -4, hip: -1.12, dy: -0.2, nh: { a: 88, l: 0.58 }, fh: { a: 170, l: 0.4 }, nf: [0.35, 0], ff: [-0.3, -0.05] }), 'snap'), K(1.7, P({ lean: -10, hip: -1.12, dy: -0.28, nh: { a: 98, l: 0.58 } }), 'out'), ...END()],
    fx: fxU('nh', { cx: 6, ang: 0 }) },
  'uh.leap': { keys: [K(0, GUARD), K(0.6, P({ lean: 22, hip: -0.62, nh: { a: -40, l: 0.5 }, fh: { a: -40, l: 0.5 }, nf: [0.4, 0], ff: [-0.4, 0] }), 'in'),
      K(1, P({ lean: 0, hip: -1.3, dy: -0.75, nf: { a: 28, l: 1.17 }, ff: { a: 152, l: 1.17 }, nh: { a: 70, l: 0.58 }, fh: { a: 110, l: 0.58 } }), 'snap'), K(1.7, P({ lean: 0, hip: -1.3, dy: -0.85, nf: { a: 18, l: 1.17 }, ff: { a: 162, l: 1.17 } }), 'out'), ...END(P({ dy: -0.2 }))],
    fx: [{ k: 'blade', a: 'nf', len: [10, 56], r: [12, 16], u: [0, 1], ease: 'out' }, { k: 'blade', a: 'ff', len: [10, 56], r: [12, 16], u: [0, 1], ease: 'out' }, { k: 'col', cx: 0, w: [50, 88], y0: -48, y1: -160, u: [0.1, 1], ease: 'out' }], drive: [{ at: [0.6, 1.3], vy: -3 }] },
  'uh.spinout': { keys: [K(0, GUARD), K(0.4, P({ lean: 12, hip: -0.9, nh: { a: -20, l: 0.2 }, fh: { a: -10, l: 0.2 }, nf: [0.3, 0], ff: [-0.3, 0] }), 'in'), K(0.75, P({ lean: -20, hip: -0.85, rot: -40, nh: { a: 200, l: 0.2 }, fh: { a: 190, l: 0.2 }, nf: [0.2, 0], ff: [-0.2, 0] }), 'io'),
      K(1, P({ lean: 4, hip: -1.12, dy: -0.2, nh: { a: 108, l: 0.58 }, fh: { a: 70, l: 0.58 }, nf: [0.3, -0.05], ff: [-0.3, -0.1] }), 'snap'), K(1.7, P({ lean: -2, hip: -1.12, dy: -0.26, nh: { a: 118, l: 0.58 }, fh: { a: 62, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'arc', c: [0, -58], R: [26, 52], a0: 10, a1: 170, tail: 140, r: [13, 18], u: [0, 1], ease: 'out' }, { k: 'col', cx: 0, w: [40, 86], y0: -42, y1: -160, u: [0.2, 1], ease: 'out', spin: 1 }] },
  'uh.roll': { keys: [K(0, GUARD), K(0.4, P({ lean: 16, nh: { a: 190, l: 0.58 }, fh: { a: 20, l: 0.5 } }), 'out'), K(0.75, P({ lean: 22, hip: -0.9, nh: { a: 230, l: 0.58 }, fh: { a: 30, l: 0.5 }, head: 8 }), 'io'),
      K(1, P({ lean: -2, hip: -1.08, dy: -0.14, nh: { a: 92, l: 0.58 }, fh: { a: 170, l: 0.4 }, nf: [0.35, 0], ff: [-0.35, 0] }), 'snap'), K(1.7, P({ lean: -6, hip: -1.1, dy: -0.2, nh: { a: 100, l: 0.58 } }), 'out'), ...END()],
    fx: fxU('nh', { r: [10, 15], w: [34, 72], cx: 6 }) },
  'uh.line': { keys: [K(0, GUARD), K(0.4, P({ lean: 4, nh: { a: 14, l: 0.58 }, fh: { a: 170, l: 0.5 } }), 'out'), K(0.8, P({ lean: 0, hip: -1.05, nh: { a: 78, l: 0.58 }, fh: { a: 170, l: 0.5 } }), 'io'),
      K(1, P({ lean: -6, hip: -1.1, dy: -0.12, nh: { a: 90, l: 0.58 }, fh: { a: 170, l: 0.45 }, nf: [0.35, 0], ff: [-0.3, 0] }), 'snap'), K(1.7, P({ lean: -10, hip: -1.1, dy: -0.18, nh: { a: 96, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'blade', a: 'nh', abs: true, ang: -90, len: [10, 112], r: [8, 12], u: [0, 1], ease: 'out' }, { k: 'col', cx: 6, w: [36, 60], y0: -42, y1: -164, u: [0.1, 1], ease: 'out' }], tell: [8, -150] },
  'uh.pullup': { keys: [K(0, GUARD), K(0.4, P({ lean: 10, nh: { a: 6, l: 0.58 }, fh: { a: 14, l: 0.58 } }), 'out'), K(0.8, P({ lean: 18, hip: -0.82, nh: { a: -30, l: 0.3 }, fh: { a: -20, l: 0.3 }, nf: [0.4, 0], ff: [-0.4, 0] }), 'in'),
      K(1, P({ lean: -4, hip: -1.1, dy: -0.18, nh: { a: 86, l: 0.58 }, fh: { a: 94, l: 0.58 }, nf: [0.3, 0], ff: [-0.3, 0] }), 'snap'), K(1.7, P({ lean: -8, hip: -1.1, dy: -0.24, nh: { a: 92, l: 0.58 }, fh: { a: 92, l: 0.58 } }), 'out'), ...END()],
    fx: [{ k: 'ring', c: [0, -48], R: [70, 20], u: [0, 0.35], ease: 'in', hit: false }, { k: 'blade', a: 'hands', abs: true, ang: -90, len: [10, 100], r: [14, 20], u: [0, 1], ease: 'out' }, { k: 'col', cx: 0, w: [50, 88], y0: -42, y1: -162, u: [0.15, 1], ease: 'out' }] },
};
