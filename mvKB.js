// mvKB.js — knockback that makes sense.
//   launch speed  v0 = (BKB + KBG * damageAfterHit) * weight * slot balance (px / frame, Smash-style growth)
//   direction     authored angle per move class, mirrored away from the attacker; grounded / airborne variants
//   physics       linear deceleration during hitstun (fighter.js patch) => low damage = small push,
//                 high damage = launched across the stage.
// This pass reduces launch speed to support closer follow-ups: signature/recovery launches by 10%,
// super launches by 8%, and heavy/ground-pound launches by 20%. The prior calibration targets
// remain useful as a reference, but are intentionally less lethal after this balance adjustment.
export const FRIC = 0.45;                         // px/frame^2 deceleration while in hitstun
export const KB = {
  us:      { bkb: 6,  kbg: 0.1268, g: 80, a: 90 },       // steep launch / vertical pop
  ds:      { bkb: 5,  kbg: 0.1071, g: 42, a: -50 },      // trip-pop / spike down then out
  ss:      { bkb: 6,  kbg: 0.0916, g: 26, a: 22 },       // shove / shallow outward
  uh:      { bkb: 9,  kbg: 0.1696, g: 84, a: 62 },       // high vertical / diagonal up-away
  dh:      { bkb: 9,  kbg: 0.1709, g: 32, a: -75 },      // strong horizontal pop / meteor
  sh:      { bkb: 10, kbg: 0.2053, g: 30, a: 40 },       // outward blast / diagonal away
  rc:      { bkb: 5,  kbg: 0.0832, g: 72, a: 58 },       // pops up / modest lift
  gpdive:  { bkb: 9,  kbg: 0.118,  g: 30, a: -78 },      // meteor
  gpland:  { bkb: 7,  kbg: 0.0855, g: 24, a: -60 },      // sideways / down-out
  spPull:  { bkb: 3,  kbg: 0.015,  g: 8,  a: 8, pull: 1 },
  spStag:  { bkb: 3.5, kbg: 0.02,  g: 14, a: 14 },
  spFinal: { bkb: 11, kbg: 0.1387, g: 40, a: 40 },
};
export const NONLETHAL = new Set(['g3_kanenobu.ds', 'g4_gold.ds', 'g4_graphite.ds', 'life.ds', 'mercy.ds']);
const AVG = {};                                       // average damage per slot, filled lazily from the roster

export function classFor(m, stageIdx, landed) {
  if (m.slot === 'sp') {
    const st = m.stages && m.stages[stageIdx]; const k = st ? st.kb : 'final';
    return k === 'pull' ? KB.spPull : k === 'stagger' ? KB.spStag : KB.spFinal;
  }
  if (m.slot === 'gp') return landed ? KB.gpland : KB.gpdive;
  return KB[m.slot] || KB.sh;
}
export function setSlotAverages(avg) { Object.assign(AVG, avg); }

// returns { vx, vy, hitstun }.  attacker/defender are fighters; dmgAfter = defender.damage after this hit.
export function computeLaunch(attacker, defender, m, stageIdx, landed) {
  const c = classFor(m, stageIdx, landed);
  const grounded = !!defender.grounded;
  let ang = grounded ? c.g : c.a;
  const away = Math.sign(defender.x - attacker.x) || attacker.facing || 1;
  const dir = c.pull ? -away : away;
  const D = Math.max(0, defender.damage || 0);
  const avg = AVG[m.slot] || m.dmg;
  const dmgMul = Math.max(0.85, Math.min(1.2, 1 + 0.012 * (m.dmg - avg)));       // harder-hitting versions of a move launch a little harder
  const defStat = Number(defender.char?.stats?.defense) || 5;
  const weight = Math.max(0.82, Math.min(1.15, 1 - (defStat - 5) * 0.025));
  const slotMul = ['uh', 'dh', 'sh', 'gp'].includes(m.slot) ? 0.80 : m.slot === 'sp' ? 0.92 : 0.90;
  let v0 = (c.bkb + c.kbg * D * dmgMul) * weight * (defender.knockbackTakenMul || 1) * (attacker.knockbackMul || 1) * slotMul;
  if (NONLETHAL.has(m.id)) v0 = Math.min(v0, 17);
  let meteor = ang < -45;
  if (grounded && ang < 0) { ang = 52; v0 *= 0.7; meteor = false; }               // spikes bounce grounded targets
  if (grounded && ang >= 0 && ang < 16) ang = 16;                                 // always leave the floor
  const r = ang * Math.PI / 180;
  let vx = dir * Math.cos(r) * v0, vy = -Math.sin(r) * v0;
  if (grounded && vy > -3.5) vy = -3.5;
  let hitstun = Math.round(8 + v0 * (meteor ? 1.65 : 1.1));
  if (c.pull) hitstun = 12;
  hitstun = Math.max(c.pull ? 8 : 10, Math.min(50, hitstun));
  return { vx, vy, hitstun, v0, meteor };
}
