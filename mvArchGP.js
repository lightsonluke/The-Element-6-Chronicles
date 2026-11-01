// Ground Pound choreographies — their own move (not Down Heavy). Phases (see mvEngine):
//   0..1  startup in the air   1..2  DIVE (held until the fighter lands)   2..3  landing shockwave + endlag
// Envelope: downward rectangle 75x110 while falling; landing shockwave 150x30.
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const AIR = (o = {}) => P({ lean: 6, hip: -1.1, nf: { a: -50, l: 1.0 }, ff: { a: -70, l: 1.0 }, nh: { a: 40, l: 0.5 }, fh: { a: 140, l: 0.5 }, ...o });
const LAND = (o = {}) => P({ lean: 40, hip: -0.55, nf: [0.5, 0], ff: [-0.45, 0], nh: { a: -60, l: 0.5 }, fh: { a: -50, l: 0.5 }, ...o });
const DIVE = (o = {}) => P({ lean: 4, hip: -1.2, dy: -0.2, nf: { a: -90, l: 1.17 }, ff: { a: -92, l: 1.17 }, nh: { a: 90, l: 0.5 }, fh: { a: 100, l: 0.5 }, ...o });
export const fxGP = (o = {}) => [
  { k: 'zone', box: [-37, -30, 37, 95], u: [0, 1], when: 'dive', ease: 'lin', st: 0 },
  { k: 'gnd', cx: o.cx ?? 0, side: o.side ?? 0, L: [40, 75], h: [18, 30], u: [0, 1], when: 'land', ease: 'out', st: 1 },
  ...(o.extra || []),
];
const mk = (start, mid, dive, land, rec, o = {}) => ({
  gp: true,
  keys: [K(0, AIR()), K(0.55, start, 'in'), K(1, mid, 'snap'), K(1.5, dive, 'out'), K(1.98, dive, 'lin'),
    K(2, land, 'snap'), K(2.4, rec || land, 'out'), K(3, GUARD, 'io')],
  fx: fxGP(o), drive: o.drive || [],
});
export const GP = {
  'gp.past': mk(AIR({ lean: 36, hip: -1.15, dx: 0.6, nf: { a: -20, l: 1.0 }, ff: { a: -50, l: 1.0 }, nh: { a: 20, l: 0.58 }, fh: { a: 30, l: 0.5 } }), AIR({ lean: 58, hip: -1.1, dx: 0.8, rot: 30 }), DIVE({ lean: 14, rot: 8, dx: 0.3 }), LAND(), null, { drive: [{ at: [0.4, 1], vx: 4 }, { at: [1, 1.5], vx: -2 }] }),
  'gp.head': mk(AIR({ lean: 80, hip: -1.2, dy: -0.2, nf: { a: 110, l: 1.0 }, ff: { a: 130, l: 1.0 }, nh: { a: -20, l: 0.58 }, fh: { a: -10, l: 0.58 } }), AIR({ lean: 170, hip: -1.3, nf: { a: 100, l: 1.1 }, ff: { a: 115, l: 1.1 }, nh: { a: -80, l: 0.58 }, fh: { a: -70, l: 0.58 } }), P({ lean: 175, hip: -1.3, dy: -0.1, nf: { a: 92, l: 1.17 }, ff: { a: 98, l: 1.17 }, nh: { a: -90, l: 0.58 }, fh: { a: -84, l: 0.58 } }), LAND({ lean: 100, hip: -0.6, rot: 20, nh: { a: -10, l: 0.4 } })),
  'gp.tuck': mk(AIR({ lean: 40, hip: -0.9, nf: { a: 50, l: 0.6 }, ff: { a: 60, l: 0.6 }, nh: { a: -10, l: 0.3 }, fh: { a: 0, l: 0.3 } }), AIR({ lean: 80, hip: -0.9, rot: 80, nf: { a: 50, l: 0.6 }, ff: { a: 60, l: 0.6 }, nh: { a: -10, l: 0.3 }, fh: { a: 0, l: 0.3 } }), AIR({ lean: 80, hip: -0.9, rot: 260, nf: { a: 50, l: 0.6 }, ff: { a: 60, l: 0.6 }, nh: { a: -10, l: 0.3 }, fh: { a: 0, l: 0.3 } }), LAND({ rot: 0 })),
  'gp.seat': mk(AIR({ lean: -10, hip: -0.8, nf: { a: 10, l: 0.9 }, ff: { a: 20, l: 0.9 }, nh: { a: 30, l: 0.5 }, fh: { a: 80, l: 0.5 } }), AIR({ lean: -20, hip: -0.7, nf: { a: 25, l: 0.95 }, ff: { a: 30, l: 0.95 } }), AIR({ lean: -24, hip: -0.7, nf: { a: 30, l: 1.0 }, ff: { a: 35, l: 1.0 }, nh: { a: 40, l: 0.5 } }), P({ lean: -14, hip: -0.34, nf: [0.7, -0.05], ff: [0.6, -0.12], nh: { a: -30, l: 0.5 }, fh: { a: -20, l: 0.5 } }), P({ lean: 50, hip: -0.45, rot: 40, nf: [0.4, 0], ff: [-0.2, 0] })),
  'gp.stall': mk(AIR({ lean: 0, hip: -1.1, nh: { a: 40, l: 0.58 }, fh: { a: 140, l: 0.58 }, nf: { a: -50, l: 1.0 }, ff: { a: -130, l: 1.0 } }), AIR({ lean: 0, hip: -1.1, dy: -0.1, nh: { a: 40, l: 0.58 }, fh: { a: 140, l: 0.58 } }), DIVE({ nh: { a: -80, l: 0.58 }, fh: { a: -90, l: 0.5 } }), LAND({ lean: 30, nh: { a: -90, l: 0.58 } })),
  'gp.grab': mk(AIR({ lean: 100, hip: -1.15, nf: { a: 150, l: 1.0 }, ff: { a: 160, l: 1.0 }, nh: { a: -70, l: 0.58 }, fh: { a: -60, l: 0.58 } }), AIR({ lean: 130, hip: -1.2, nf: { a: 120, l: 1.1 }, ff: { a: 130, l: 1.1 }, nh: { a: -88, l: 0.58 }, fh: { a: -80, l: 0.58 } }), P({ lean: 40, hip: -1.1, rot: 40, nf: { a: 120, l: 1.1 }, ff: { a: 130, l: 1.1 }, nh: { a: -90, l: 0.58 }, fh: { a: -86, l: 0.58 } }), LAND({ lean: 70, nh: { a: -90, l: 0.58 }, fh: { a: -90, l: 0.58 } })),
  'gp.spread': mk(AIR({ lean: 0, hip: -1.2, dy: -0.15, nf: { a: 28, l: 1.17 }, ff: { a: 152, l: 1.17 }, nh: { a: 38, l: 0.58 }, fh: { a: 142, l: 0.58 } }), AIR({ lean: 0, hip: -1.2, dy: -0.2, nf: { a: 20, l: 1.17 }, ff: { a: 160, l: 1.17 }, nh: { a: 30, l: 0.58 }, fh: { a: 150, l: 0.58 } }), DIVE({ dy: -0.1 }), LAND()),
  'gp.sideheel': mk(AIR({ lean: 20, hip: -1.1, rot: 20, nf: { a: 20, l: 1.1 }, ff: { a: -90, l: 1.0 }, nh: { a: 60, l: 0.5 }, fh: { a: 160, l: 0.5 } }), AIR({ lean: 6, hip: -1.15, rot: 60, nf: { a: -60, l: 1.17 }, ff: { a: -30, l: 1.0 }, nh: { a: 50, l: 0.5 }, fh: { a: 150, l: 0.5 } }), DIVE({ rot: 20, nf: { a: -92, l: 1.17 }, ff: { a: -40, l: 0.9 } }), LAND({ lean: 20 })),
  'gp.feet': mk(AIR({ lean: -20, hip: -1.1, rot: -40, nf: { a: 40, l: 1.0 }, ff: { a: 20, l: 1.0 }, nh: { a: 100, l: 0.5 }, fh: { a: 60, l: 0.5 } }), AIR({ lean: -10, hip: -1.1, rot: -200, nf: { a: 60, l: 1.1 }, ff: { a: 30, l: 1.0 } }), DIVE({ rot: -360, lean: 0 }), LAND()),
  'gp.diag': mk(AIR({ lean: 50, hip: -1.1, dx: 0.4, rot: 28, nf: { a: -30, l: 1.1 }, ff: { a: -80, l: 1.1 }, nh: { a: 20, l: 0.58 }, fh: { a: 10, l: 0.58 } }), AIR({ lean: 60, hip: -1.1, dx: 0.6, rot: 40 }), DIVE({ lean: 62, rot: 36, nf: { a: -50, l: 1.17 }, ff: { a: -70, l: 1.17 } }), LAND({ lean: 50, nf: [0.9, -0.02] }), null, { side: 1, cx: 0, drive: [{ at: [1, 1.6], vx: 5.6 }] }),
  'gp.drop': mk(AIR({ lean: 4, hip: -1.1 }), AIR({ lean: 0, hip: -1.15, dy: -0.1, nh: { a: 90, l: 0.5 }, fh: { a: 100, l: 0.5 } }), DIVE({ nh: { a: 100, l: 0.4 }, fh: { a: 80, l: 0.4 } }), LAND({ nh: { a: -50, l: 0.58 } }), null, { side: 1, cx: 10 }),
  'gp.heeldn': mk(AIR({ lean: 16, hip: -1.1, nf: { a: 20, l: 1.0 }, ff: { a: -60, l: 0.7 }, nh: { a: 40, l: 0.5 }, fh: { a: 140, l: 0.5 } }), AIR({ lean: 20, hip: -1.15, rot: 24, nf: { a: -70, l: 1.17 }, ff: { a: 20, l: 0.7 } }), DIVE({ rot: 22, nf: { a: -82, l: 1.17 }, ff: { a: 40, l: 0.7 } }), LAND({ lean: 30, nf: [0.7, 0] }), P({ lean: 34, hip: -0.7, nf: [0.9, 0], ff: [-0.4, 0] }), { side: 1, cx: 0 }),
};
