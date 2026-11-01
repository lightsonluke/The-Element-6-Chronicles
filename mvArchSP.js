// Super Move choreographies. Three acts: (1) buildup + tell, (2) multi-stage hit sequence (each stage can hit
// each opponent once -> supers are the only moves that multi-hit), (3) a decisive final stage that launches.
// `stages` gives each stage's damage weight and knockback class (pull | stagger | final); the final stage is last.
// Reach 'A' = large area (~260x180 zone). Reach 'L' = long-range lane across most of the stage.
import { P, GUARD } from './mvCore.js';
const K = (at, p, e) => ({ at, p, e });
const POW = (o = {}) => P({ lean: -6, hip: -0.96, nf: [0.45, 0], ff: [-0.5, 0], nh: { a: 70, l: 0.36 }, fh: { a: 104, l: 0.36 }, ...o });
const THR = (o = {}) => P({ lean: 30, hip: -0.9, nf: [0.7, 0], ff: [-0.55, 0], nh: { a: 4, l: 0.58 }, fh: { a: 18, l: 0.58 }, ...o });
const UPR = (o = {}) => P({ lean: -8, hip: -1.12, dy: -0.18, nf: [0.35, 0], ff: [-0.35, -0.05], nh: { a: 92, l: 0.58 }, fh: { a: 88, l: 0.58 }, ...o });
const SMASH = (o = {}) => P({ lean: 42, hip: -0.7, nf: [0.55, 0], ff: [-0.5, 0], nh: { a: -70, l: 0.58 }, fh: { a: -64, l: 0.58 }, ...o });
const END = (p = THR()) => [K(2.45, p, 'io'), K(3, GUARD, 'io')];
const win = (i, n, pad = 0.02) => [Math.max(0, i / n - pad), Math.min(1, (i + 1) / n + pad)];
const W = (info) => (info.reach === 'L' ? 760 : 260);
const stg = (...w) => w.map((x, i) => ({ w: x, kb: i === w.length - 1 ? 'final' : (i === 0 ? 'pull' : 'stagger') }));

export const SP = {
  // moving threat that bends around the stage geometry, returns for a close-range finisher
  'sp.bend': (info) => { const Wd = W(info), far = Wd * 0.72; return {
    keys: [K(0, GUARD), K(0.5, POW(), 'out'), K(0.9, POW({ lean: -14, nh: { a: 60, l: 0.5 }, fh: { a: 120, l: 0.5 } }), 'in'), K(1, THR({ nh: { a: 20, l: 0.58 }, fh: { a: 30, l: 0.58 } }), 'snap'),
      K(1.5, THR({ lean: 26, nh: { a: 30, l: 0.58 } }), 'out'), K(1.85, POW({ lean: 6, nh: { a: 10, l: 0.5 }, fh: { a: 20, l: 0.5 } }), 'io'), ...END()],
    stages: stg(0.3, 0.25, 0.45),
    fx: [{ k: 'orb', from: 'hands', to: [far, -92], via: [far * 0.35, -250], r: [26, 34], u: [0, 0.42], st: 0, ease: 'io' },
      { k: 'orb', from: [far, -92], to: [46, -52], via: [far * 0.5, 40], r: [34, 30], u: [0.4, 0.8], st: 1, ease: 'io' },
      { k: 'ring', c: [60, -56], R: [30, 120], u: [0.78, 1], st: 2, ease: 'out' }] }; },
  // deceptive stillness; small attacks trace a route and converge into one strike
  'sp.route': (info) => { const Wd = W(info), cx = info.reach === 'L' ? 330 : 130; return {
    keys: [K(0, GUARD), K(0.3, GUARD, 'lin'), K(0.8, GUARD, 'lin'), K(0.95, POW({ lean: 0 }), 'out'), K(1, THR({ nh: { a: 10, l: 0.58 } }), 'snap'), K(1.6, UPR(), 'out'), K(1.9, SMASH({ lean: 30 }), 'out'), ...END()],
    stages: stg(0.12, 0.12, 0.12, 0.64),
    fx: [{ k: 'orb', from: [cx * 0.1, -170], to: [cx, -62], via: [cx * 0.7, -170], r: [14, 18], u: [0, 0.3], st: 0, ease: 'io' },
      { k: 'orb', from: [cx * 1.9, -150], to: [cx, -62], via: [cx * 1.5, -40], r: [14, 18], u: [0.2, 0.5], st: 1, ease: 'io' },
      { k: 'orb', from: [cx * 0.2, -10], to: [cx, -62], via: [cx * 0.9, 40], r: [14, 18], u: [0.4, 0.7], st: 2, ease: 'io' },
      { k: 'ring', c: [cx, -62], R: [16, info.reach === 'L' ? 150 : 108], u: [0.68, 1], st: 3, ease: 'out' }] }; },
  // marks the opponent through a fast exchange, then cashes in every mark in a staggered sequence
  'sp.mark': (info) => { const m1 = [64, -66], m2 = [96, -30], m3 = [118, -92], m4 = [150, -56]; return {
    keys: [K(0, GUARD), K(0.5, THR({ nh: { a: 6, l: 0.58 } }), 'snap'), K(0.65, THR({ nh: { a: 30, l: 0.4 }, fh: { a: 10, l: 0.58 } }), 'snap'), K(0.8, THR({ nh: { a: -20, l: 0.58 } }), 'snap'), K(0.95, POW(), 'io'),
      K(1.2, UPR({ nh: { a: 70, l: 0.58 }, fh: { a: 110, l: 0.58 } }), 'out'), K(1.6, THR({ nh: { a: 20, l: 0.58 } }), 'out'), K(1.9, SMASH({ lean: 34 }), 'out'), ...END()],
    stages: stg(0.14, 0.14, 0.14, 0.14, 0.44),
    marks: [m1, m2, m3, m4],
    fx: [{ k: 'ring', c: m1, R: [12, 42], u: win(0, 5), st: 0 }, { k: 'ring', c: m2, R: [12, 42], u: win(1, 5), st: 1 }, { k: 'ring', c: m3, R: [12, 42], u: win(2, 5), st: 2 },
      { k: 'ring', c: m4, R: [12, 46], u: win(3, 5), st: 3 }, { k: 'ring', c: [112, -66], R: [24, info.reach === 'L' ? 150 : 116], u: win(4, 5), st: 4 }] }; },
  // temporary arena hazard that forces movement, then intercepts the escape route
  'sp.hazard': (info) => { const L = info.reach === 'L' ? 560 : 250; return {
    keys: [K(0, GUARD), K(0.5, SMASH({ lean: 50, hip: -0.62 }), 'in'), K(0.9, SMASH({ lean: 60, hip: -0.55 }), 'lin'), K(1, THR({ lean: 36 }), 'snap'), K(1.5, THR({ lean: 42, hip: -0.8 }), 'out'), K(1.85, UPR({ lean: 20 }), 'out'), ...END()],
    stages: stg(0.4, 0.6),
    fx: [{ k: 'gnd', cx: L * 0.5, side: 0, L: [20, L * 0.5], h: [30, 70], u: [0, 0.55], st: 0, ease: 'out' }, { k: 'col', cx: L * 0.5, w: [40, L * 0.5], y0: 0, y1: -140, u: [0.05, 0.55], st: 0, ease: 'out' },
      { k: 'blade', a: 'nh', abs: true, ang: -4, len: [20, L], r: [28, 40], u: [0.55, 1], st: 1, ease: 'out' }] }; },
  // rushes through three distinct angles, each pass redirects the next hit
  'sp.three': (info) => { const L = info.reach === 'L' ? 520 : 230; return {
    keys: [K(0, GUARD), K(0.6, POW({ lean: 20 }), 'in'), K(1, THR({ lean: 38, nh: { a: -16, l: 0.58 } }), 'snap'), K(1.33, THR({ lean: 20, hip: -1.0, dy: -0.2, nh: { a: 46, l: 0.58 } }), 'snap'), K(1.66, SMASH({ lean: 44, nh: { a: -56, l: 0.58 } }), 'snap'), K(1.95, THR({ lean: 30 }), 'out'), ...END()],
    stages: stg(0.2, 0.25, 0.55),
    fx: [{ k: 'blade', a: 'nh', abs: true, ang: -14, len: [30, L], r: [22, 30], u: [0, 0.34], st: 0, ease: 'out' }, { k: 'blade', a: 'nh', abs: true, ang: 40, len: [30, L], r: [22, 30], u: [0.33, 0.67], st: 1, ease: 'out' },
      { k: 'blade', a: 'nh', abs: true, ang: -62, len: [30, L * 0.9], r: [26, 36], u: [0.66, 1], st: 2, ease: 'out' }], drive: [{ at: [0.8, 1.9], vx: info.reach === 'L' ? 4.6 : 3 }] }; },
  // forces a brief choice between two lanes, then punishes whichever lane is committed to
  'sp.lanes': (info) => { const L = info.reach === 'L' ? 700 : 250; return {
    keys: [K(0, GUARD), K(0.5, POW({ nh: { a: 40, l: 0.5 }, fh: { a: -30, l: 0.5 } }), 'out'), K(0.9, POW(), 'lin'), K(1, THR({ nh: { a: 40, l: 0.58 } }), 'snap'), K(1.45, SMASH({ lean: 38, nh: { a: -50, l: 0.58 } }), 'snap'), K(1.8, THR({ nh: { a: 10, l: 0.58 } }), 'out'), ...END()],
    stages: stg(0.25, 0.25, 0.5),
    fx: [{ k: 'zone', box: [20, -150, L, -86], reveal: 'x', u: [0, 0.4], st: 0 }, { k: 'zone', box: [20, -46, L, 0], reveal: 'x', u: [0.38, 0.72], st: 1 },
      { k: 'ring', c: [L * 0.5, -70], R: [20, info.reach === 'L' ? 130 : 112], u: [0.7, 1], st: 2, ease: 'out' }] }; },
  // decoy movements fill the space while the real attack builds off-screen, then snaps in
  'sp.decoy': (info) => { const L = info.reach === 'L' ? 700 : 260; return {
    keys: [K(0, GUARD), K(0.3, POW({ dx: -0.3 }), 'out'), K(0.55, THR({ dx: 0.4 }), 'io'), K(0.8, POW({ dx: -0.2 }), 'io'), K(1, THR({ lean: 36, nh: { a: 6, l: 0.58 } }), 'snap'), K(1.6, THR({ lean: 42 }), 'out'), ...END()],
    stages: stg(0.22, 0.78),
    decoys: [[-40, 0], [60, 0], [130, 0]],
    fx: [{ k: 'zone', box: [20, -170, L * 0.5, 0], reveal: 'x', u: [0, 0.35], st: 0 }, { k: 'zone', box: [20, -180, L, 0], reveal: 'x-', u: [0.3, 1], st: 1 }] }; },
  // builds power through a sequence of precise body strikes, ending in a decisive launch
  'sp.strikes': (info) => { const big = info.reach === 'L' ? 560 : 140; return {
    keys: [K(0, GUARD), K(0.6, POW(), 'in'), K(1, THR({ nh: { a: 8, l: 0.58 } }), 'snap'), K(1.18, THR({ nh: { a: -12, l: 0.58 }, fh: { a: 40, l: 0.4 } }), 'snap'), K(1.36, THR({ nh: { a: 20, l: 0.58 }, fh: { a: 6, l: 0.58 } }), 'snap'), K(1.54, SMASH({ lean: 36, nh: { a: -30, l: 0.58 } }), 'snap'), K(1.72, UPR(), 'snap'), K(1.9, UPR({ dy: -0.32, nh: { a: 100, l: 0.58 } }), 'out'), ...END()],
    stages: stg(0.1, 0.1, 0.12, 0.12, 0.56),
    fx: [{ k: 'ring', c: [52, -58], R: [10, 40], u: win(0, 5), st: 0 }, { k: 'ring', c: [56, -40], R: [10, 40], u: win(1, 5), st: 1 }, { k: 'ring', c: [56, -70], R: [10, 42], u: win(2, 5), st: 2 },
      { k: 'ring', c: [54, -30], R: [10, 44], u: win(3, 5), st: 3 }, { k: 'col', cx: 40, w: [60, 120], y0: -20, y1: -180, u: win(4, 5, 0), st: 4, ease: 'out' }, ...(info.reach === 'L' ? [{ k: 'blade', a: 'nh', abs: true, ang: -30, len: [30, big], r: [26, 36], u: [0.8, 1], st: 4 }] : [])] }; },
  // draws the opponent into a close-range grapple, spins them through a dramatic arc, releases at the climax
  'sp.grapple': (info) => { const far = info.reach === 'L' ? 560 : 210; return {
    keys: [K(0, GUARD), K(0.5, THR({ nh: { a: 6, l: 0.58 }, fh: { a: 14, l: 0.58 } }), 'out'), K(0.9, THR({ lean: 20, hip: -0.9, nh: { a: 0, l: 0.3 }, fh: { a: 10, l: 0.3 } }), 'in'), K(1, UPR({ lean: -10, nh: { a: 100, l: 0.4 }, fh: { a: 90, l: 0.4 } }), 'snap'),
      K(1.35, P({ lean: 20, hip: -0.95, rot: -40, nh: { a: 150, l: 0.5 }, fh: { a: 140, l: 0.5 } }), 'lin'), K(1.7, P({ lean: 20, hip: -0.95, rot: 40, nh: { a: 30, l: 0.5 }, fh: { a: 20, l: 0.5 } }), 'lin'), K(1.92, THR({ lean: 38, nh: { a: 8, l: 0.58 }, fh: { a: 20, l: 0.58 } }), 'snap'), ...END()],
    stages: stg(0.18, 0.3, 0.52),
    fx: [{ k: 'ring', c: [60, -48], R: [90, 26], u: [0, 0.3], st: 0, ease: 'in' }, { k: 'arc', c: [0, -50], R: [52, 62], a0: 180, a1: -180, tail: 220, r: [20, 26], u: [0.28, 0.7], st: 1, ease: 'lin' },
      { k: 'orb', from: [34, -64], to: [far, -52], via: [far * 0.4, -120], r: [30, 38], u: [0.68, 1], st: 2, ease: 'out' }] }; },
  // briefly slows the action, repositions, releases a multi-angle burst when motion resumes
  'sp.slow': (info) => { const R = info.reach === 'L' ? 380 : 150; return {
    keys: [K(0, GUARD), K(0.4, POW({ nh: { a: 90, l: 0.3 }, fh: { a: 90, l: 0.3 } }), 'out'), K(0.9, POW({ nh: { a: 90, l: 0.3 }, fh: { a: 90, l: 0.3 } }), 'lin'), K(1, P({ lean: 0, hip: -1.1, nh: { a: 40, l: 0.58 }, fh: { a: 140, l: 0.58 }, nf: { a: 25, l: 1.1 }, ff: { a: 155, l: 1.1 }, dy: -0.2 }), 'snap'), K(1.6, P({ lean: 0, hip: -1.1, dy: -0.3, nh: { a: 30, l: 0.58 }, fh: { a: 150, l: 0.58 }, nf: { a: 20, l: 1.1 }, ff: { a: 160, l: 1.1 } }), 'out'), ...END(POW())],
    stages: stg(0.3, 0.7),
    fx: [{ k: 'ring', c: [0, -60], R: [16, 70], u: [0, 0.3], st: 0, ease: 'out' }, ...[-10, 28, 62, -44, 96, -78].map((ang, i) => ({ k: 'blade', a: 'body', abs: true, ang: -ang, len: [10, R], r: [14, 24], u: [0.3, 1], st: 1, ease: 'out', from: 20 }))], tp: { at: 1, dx: 40 } }; },
  // corridor of hazards that activate in order, then dashes through with a final hit
  'sp.corridor': (info) => { const n = info.reach === 'L' ? 7 : 5, step = info.reach === 'L' ? 90 : 48, x0 = 52; const els = []; for (let i = 0; i < n; i++) els.push({ k: 'col', cx: x0 + i * step, w: [30, 46], y0: 0, y1: -100 - (i % 2) * 30, u: [(i / n) * 0.55, (i / n) * 0.55 + 0.25], st: 0, ease: 'out' });
    return {
    keys: [K(0, GUARD), K(0.5, SMASH({ lean: 40 }), 'in'), K(0.9, SMASH({ lean: 50 }), 'lin'), K(1, THR({ lean: 36 }), 'snap'), K(1.5, THR({ lean: 44, hip: -0.82, nh: { a: 10, l: 0.58 } }), 'out'), K(1.9, THR({ lean: 30 }), 'out'), ...END()],
    stages: stg(0.45, 0.55),
    fx: [...els, { k: 'blade', a: 'nh', abs: true, ang: -6, len: [30, x0 + n * step], r: [26, 38], u: [0.6, 1], st: 1, ease: 'out' }], drive: [{ at: [1.4, 1.95], vx: 5.2 }] }; },
  // pulls scattered energy into one compact point and detonates outward after a conspicuous warning beat
  'sp.point': (info) => { const c = info.reach === 'L' ? [200, -70] : [130, -72], R = info.reach === 'L' ? 190 : 130; return {
    keys: [K(0, GUARD), K(0.4, POW({ nh: { a: 40, l: 0.58 }, fh: { a: 140, l: 0.58 } }), 'out'), K(0.9, POW({ lean: -12, nh: { a: 20, l: 0.4 }, fh: { a: 30, l: 0.4 } }), 'in'), K(1, THR({ nh: { a: 6, l: 0.58 }, fh: { a: 12, l: 0.58 } }), 'snap'), K(1.6, THR({ lean: 34 }), 'out'), ...END()],
    stages: stg(0.25, 0.75),
    fx: [{ k: 'ring', c, R: [R * 0.3, R * 0.9], u: [0, 0.3], st: 0, ease: 'out' }, { k: 'ring', c, R: [R * 0.5, R * 1.35], box: [R * 2.1, 180], u: [0.28, 1], st: 1, ease: 'out' }], tell: c }; },
};
