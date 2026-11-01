// Recovery Attack choreographies — their own move (not Up Signature). Aerial: lifts the fighter.
// Envelope: 85x85 around the fighter, then 65x100 above during the lift.
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const AIR = (o = {}) => P({ lean: 6, hip: -1.1, nf: { a: -50, l: 1.0 }, ff: { a: -70, l: 1.0 }, nh: { a: 40, l: 0.5 }, fh: { a: 140, l: 0.5 }, ...o });
const END = (p = AIR()) => [K(2.4, p, 'io'), K(3, GUARD, 'io')];
// hit volumes: body-wrapping burst first, lift column second
export const fxRC = (o = {}) => [
  { k: 'ring', c: [0, -40], R: [30, 44], box: [85, 85], sy: 1, u: [0, 0.55], ease: 'out' },
  { k: 'col', cx: 0, w: [50, 65], y0: -40, y1: -140, u: [0.4, 1], ease: 'out' },
  ...(o.extra || []),
];
export const RC = {
  'rc.marker': { keys: [K(0, AIR()), K(0.5, AIR({ lean: -8, nh: { a: 30, l: 0.58 }, fh: { a: 150, l: 0.5 } }), 'out'), K(0.9, AIR({ lean: -14, hip: -0.95, nf: { a: -20, l: 0.9 }, ff: { a: -40, l: 0.9 } }), 'in'),
      K(1, AIR({ lean: 34, hip: -1.15, dy: -0.2, dx: 0.3, nh: { a: 20, l: 0.58 }, fh: { a: 190, l: 0.5 }, nf: { a: -20, l: 1.1 }, ff: { a: -60, l: 1.1 } }), 'snap'), K(1.7, AIR({ lean: 16, dy: -0.5, dx: 0.3 }), 'out'), ...END()],
    fx: fxRC({ extra: [{ k: 'orb', from: [40, -62], to: [40, -62], r: [10, 10], u: [0, 1], hit: false }] }), drive: [{ at: [1, 1.4], vy: -9, vx: 3 }], tell: [40, -62] },
  'rc.spring': { keys: [K(0, AIR()), K(0.7, AIR({ lean: 30, hip: -0.55, nf: { a: 10, l: 0.7 }, ff: { a: 30, l: 0.7 }, nh: { a: -50, l: 0.5 }, fh: { a: -40, l: 0.5 } }), 'in'),
      K(1, AIR({ lean: -4, hip: -1.3, dy: -0.4, nf: { a: -90, l: 1.17 }, ff: { a: -100, l: 1.17 }, nh: { a: 100, l: 0.58 }, fh: { a: 80, l: 0.58 } }), 'snap'), K(1.7, AIR({ lean: -6, dy: -0.7, nh: { a: 110, l: 0.58 }, fh: { a: 70, l: 0.58 } }), 'out'), ...END()],
    fx: fxRC(), drive: [{ at: [1, 1.5], vy: -12 }] },
  'rc.roll': { keys: [K(0, AIR()), K(0.6, AIR({ lean: 20, hip: -0.8, nf: { a: 10, l: 0.7 }, ff: { a: 30, l: 0.7 }, nh: { a: -20, l: 0.4 }, fh: { a: -10, l: 0.4 } }), 'in'),
      K(1, AIR({ lean: 60, hip: -0.8, rot: -130, nf: { a: 30, l: 0.7 }, ff: { a: 40, l: 0.7 }, nh: { a: -30, l: 0.4 }, fh: { a: -20, l: 0.4 } }), 'snap'), K(1.7, AIR({ lean: 60, hip: -0.8, rot: -310, dy: -0.3, nf: { a: 30, l: 0.7 }, ff: { a: 40, l: 0.7 } }), 'lin'), K(2.3, AIR({ rot: -360 }), 'out'), K(3, GUARD, 'io')],
    fx: fxRC(), drive: [{ at: [1, 1.5], vy: -9.5, vx: 2.4 }] },
  'rc.tether': { keys: [K(0, AIR()), K(0.5, AIR({ lean: -6, nh: { a: 80, l: 0.58 }, fh: { a: 90, l: 0.58 } }), 'out'),
      K(1, AIR({ lean: -22, hip: -1.0, rot: 34, nh: { a: 88, l: 0.58 }, fh: { a: 92, l: 0.58 }, nf: { a: -30, l: 1.0 }, ff: { a: -10, l: 1.0 } }), 'snap'),
      K(1.7, AIR({ lean: 20, hip: -1.0, rot: -40, dy: -0.3, nh: { a: 88, l: 0.58 }, fh: { a: 92, l: 0.58 }, nf: { a: 10, l: 1.0 }, ff: { a: -20, l: 1.0 } }), 'io'), ...END()],
    fx: fxRC({ extra: [{ k: 'blade', a: 'nh', abs: true, ang: -90, len: [30, 70], r: [3, 4], u: [0, 1], hit: false }] }), drive: [{ at: [1, 1.6], vy: -8.4, vx: 1.6 }] },
  'rc.ledge': { keys: [K(0, AIR()), K(0.5, AIR({ lean: 14, nh: { a: 38, l: 0.58 }, fh: { a: 120, l: 0.5 } }), 'out'),
      K(1, AIR({ lean: 38, hip: -1.1, dx: 0.4, rot: 14, nh: { a: 30, l: 0.58 }, fh: { a: 170, l: 0.5 }, nf: { a: -20, l: 1.1 }, ff: { a: -70, l: 1.1 } }), 'snap'), K(1.7, AIR({ lean: 18, dy: -0.5, dx: 0.5, nh: { a: 60, l: 0.58 } }), 'out'), ...END()],
    fx: fxRC({ extra: [{ k: 'blade', a: 'nh', abs: true, ang: -30, len: [20, 80], r: [3, 4], u: [0, 0.7], hit: false }] }), drive: [{ at: [1, 1.5], vy: -9, vx: 3.4 }] },
  'rc.cork': { keys: [K(0, AIR()), K(0.5, AIR({ lean: 12, nf: { a: -30, l: 1.0 }, ff: { a: -80, l: 1.0 } }), 'in'),
      K(1, AIR({ lean: -6, rot: -40, dy: -0.2, nf: { a: 30, l: 1.1 }, ff: { a: -110, l: 1.1 }, nh: { a: 120, l: 0.58 }, fh: { a: 20, l: 0.58 } }), 'snap'),
      K(1.5, AIR({ lean: 6, rot: 40, dy: -0.4, nf: { a: -110, l: 1.1 }, ff: { a: 30, l: 1.1 }, nh: { a: 20, l: 0.58 }, fh: { a: 120, l: 0.58 } }), 'io'),
      K(1.85, AIR({ lean: -6, rot: -30, dy: -0.55, nf: { a: 30, l: 1.1 }, ff: { a: -110, l: 1.1 } }), 'io'), ...END()],
    fx: fxRC(), drive: [{ at: [1, 1.9], vy: -9.6 }] },
  'rc.burst': { keys: [K(0, AIR()), K(0.5, AIR({ lean: 4, hip: -1.0, nf: { a: -85, l: 1.1 }, ff: { a: -95, l: 1.1 }, nh: { a: -30, l: 0.5 }, fh: { a: -40, l: 0.5 } }), 'in'),
      K(1, AIR({ lean: 22, hip: -1.1, dy: -0.2, nf: { a: -85, l: 1.17 }, ff: { a: -100, l: 1.17 }, nh: { a: -20, l: 0.58 }, fh: { a: -30, l: 0.58 } }), 'snap'), K(1.7, AIR({ lean: 30, dy: -0.4, dx: 0.3 }), 'out'), ...END()],
    fx: fxRC({ extra: [{ k: 'orb', from: [0, 14], to: [8, 24], r: [18, 12], u: [0, 1], hit: false }] }), drive: [{ at: [1, 1.5], vy: -8.6, vx: 3.2 }] },
  'rc.foot': { keys: [K(0, AIR()), K(0.5, P({ lean: 22, hip: -0.7, nf: [0.4, 0], ff: [-0.4, 0], nh: { a: -30, l: 0.5 }, fh: { a: -20, l: 0.5 } }), 'in'),
      K(1, P({ lean: -2, hip: -1.25, dy: -0.4, nf: { a: -80, l: 1.17 }, ff: { a: -100, l: 1.17 }, nh: { a: 100, l: 0.58 }, fh: { a: 80, l: 0.58 } }), 'snap'), K(1.7, AIR({ lean: 0, dy: -0.7 }), 'out'), ...END()],
    fx: fxRC({ extra: [{ k: 'gnd', cx: 0, side: 0, L: [30, 30], h: [5, 5], u: [0, 0.45], hit: false, lift: -4 }] }), drive: [{ at: [1, 1.5], vy: -11 }], tell: [0, 4] },
  'rc.column': { keys: [K(0, AIR()), K(0.5, AIR({ lean: 0, hip: -1.0, nf: { a: -85, l: 1.1 }, ff: { a: -95, l: 1.1 }, nh: { a: 20, l: 0.5 }, fh: { a: 160, l: 0.5 } }), 'out'),
      K(1, AIR({ lean: 0, hip: -1.05, dy: -0.15, nf: { a: -85, l: 1.1 }, ff: { a: -95, l: 1.1 }, nh: { a: 30, l: 0.58 }, fh: { a: 150, l: 0.58 } }), 'snap'), K(1.7, AIR({ lean: 6, dy: -0.4, nh: { a: 20, l: 0.58 }, fh: { a: 160, l: 0.58 } }), 'out'), ...END()],
    fx: fxRC({ extra: [{ k: 'col', cx: 0, w: [20, 26], y0: 90, y1: -6, u: [0, 1], hit: false }] }), drive: [{ at: [1, 1.7], vy: -8.4 }] },
  'rc.sideup': { keys: [K(0, AIR()), K(0.45, AIR({ lean: 52, hip: -0.95, nf: { a: -30, l: 1.1 }, ff: { a: -50, l: 1.1 }, nh: { a: -10, l: 0.58 }, fh: { a: 10, l: 0.58 } }), 'out'),
      K(1, AIR({ lean: 30, hip: -1.1, dy: -0.2, dx: 0.4, nh: { a: 70, l: 0.58 }, fh: { a: 100, l: 0.58 }, nf: { a: -60, l: 1.1 }, ff: { a: -90, l: 1.1 } }), 'snap'), K(1.7, AIR({ lean: 2, dy: -0.5, dx: 0.3, nh: { a: 100, l: 0.58 } }), 'out'), ...END()],
    fx: fxRC(), drive: [{ at: [0.4, 1], vx: 5.6 }, { at: [1, 1.6], vy: -9.6 }] },
  'rc.blink': { keys: [K(0, AIR()), K(0.5, AIR({ lean: 20, hip: -0.7, nf: { a: 10, l: 0.7 }, ff: { a: 20, l: 0.7 }, nh: { a: -40, l: 0.4 }, fh: { a: -40, l: 0.4 } }), 'in'),
      K(1, AIR({ lean: -4, hip: -1.2, dy: -0.4, nf: { a: -70, l: 1.1 }, ff: { a: -100, l: 1.1 }, nh: { a: 80, l: 0.58 }, fh: { a: 100, l: 0.58 } }), 'snap'), K(1.7, AIR({ lean: -4, dy: -0.5 }), 'out'), ...END()],
    fx: fxRC({ extra: [{ k: 'ring', c: [0, -40], R: [8, 30], u: [0, 0.6], hit: false }] }), drive: [{ at: [1, 1.1], tpy: -62 }, { at: [1.1, 1.8], vy: -6 }], ghost: [0.55, 1.0] },
  'rc.current': { keys: [K(0, AIR()), K(0.5, AIR({ lean: 18, nh: { a: 20, l: 0.5 }, fh: { a: 30, l: 0.5 } }), 'out'),
      K(1, AIR({ lean: 74, hip: -1.05, rot: 18, dy: -0.15, nf: { a: 190, l: 1.17 }, ff: { a: 200, l: 1.17 }, nh: { a: 200, l: 0.58 }, fh: { a: 205, l: 0.58 } }), 'snap'), K(1.7, AIR({ lean: 70, rot: 24, dy: -0.4, nf: { a: 195, l: 1.17 }, ff: { a: 205, l: 1.17 }, nh: { a: 200, l: 0.58 }, fh: { a: 205, l: 0.58 } }), 'out'), ...END()],
    fx: fxRC(), drive: [{ at: [1, 1.6], vy: -8.6, vx: 4 }] },
};
