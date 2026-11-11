// mvPower.js — the power-button ability engine.  One authored ability per character (see mvPowerDefs*.js).
//   * the engine owns the power button for every character that has a def (first press / second press / hold)
//   * abilities keep their own state in f._pw ({ d: private data, ents: drawable entities, lock })
//   * temporary terrain lives in f._pwSolids and is read by fighter.js collision (walls/platforms are real solids)
//   * every hit goes through kit.hit() (respects invincibility, shields, hp/damage modes)
import * as K from './mvPowerKit.js';
import { DEFS1 } from './mvPowerDefs1.js';
import { DEFS2 } from './mvPowerDefs2.js';
import { DEFS3 } from './mvPowerDefs3.js';

export const ABILITIES = { ...DEFS1, ...DEFS2, ...DEFS3 };
const keyOf = (f) => (f.char && (f.char.baseCharId && ABILITIES[f.char.baseCharId] ? f.char.baseCharId : f.char.id));
export const mvPowerHas = (f) => !!(f && f.char && ABILITIES[keyOf(f)]);
export const mvPowerName = (f) => (mvPowerHas(f) ? ABILITIES[keyOf(f)].name : null);

function allSolids(f, platforms) {
  const out = platforms.slice();
  const add = (g) => { if (g && g._pwSolids) for (const s of g._pwSolids) out.push({ x: s.x, y: s.y, w: s.w, h: s.h, material: 'normal', _forceSolid: !!s.solid }); };
  add(f); if (f._allOpponents) f._allOpponents.forEach(add);
  return out;
}
function moveProj(c, e) {
  const px = e.x, py = e.y; e.x += e.vx; e.y += e.vy; e.vy += e.g || 0;
  const L = Math.hypot(e.x - px, e.y - py);
  if (L > 0.01) {
    const w = K.ray(c, px, py, Math.atan2(e.y - py, e.x - px), L + (e.r || 0) * 0.5, true);
    if (w) {
      e.x = w.x - Math.cos(Math.atan2(e.y - py, e.x - px)) * 1.5; e.y = w.y - Math.sin(Math.atan2(e.y - py, e.x - px)) * 1.5;
      if (e.bounce > 0) { e.bounce--; if (Math.abs(w.rect.x - w.x) < 1.5 || Math.abs(w.rect.x + w.rect.w - w.x) < 1.5) e.vx = -e.vx; else e.vy = -e.vy; if (e.onBounce) e.onBounce(c, e, w); }
      else if (e.stick) { e.stuck = true; e.vx = 0; e.vy = 0; e.g = 0; if (e.onStick) e.onStick(c, e, w); }
      else { e.life = 0; if (e.onWall) e.onWall(c, e, w); }
    }
  }
  if (e.harmless || e.life <= 0) return;
  for (const o of c.opps) {
    if (!K.alive(o) || e.hit[K.pid(o)] || !K.bodyHit(o, e.x, e.y, e.r)) continue;
    e.hit[K.pid(o)] = 1;
    if (e.onHit) e.onHit(c, e, o);
    else K.hit(c.f, o, { d: e.d, kx: Math.sign(e.vx || c.f.facing || 1) * (e.kx ?? 5), ky: e.ky ?? -3, hs: e.hs ?? 12 });
    if (!e.pierce) { e.life = 0; break; }
  }
}
function updateEnts(c) {
  const pw = c.pw;
  for (const e of pw.ents) {
    if (e.proj && !e.stuck) moveProj(c, e);
    if (e.update) e.update(c, e);
    if (e.life != null && !e.hold) e.life--;
  }
  for (const e of pw.ents) if (e.life <= 0 && e.onEnd) { e.onEnd(c, e); e.onEnd = null; }
  pw.ents = pw.ents.filter((e) => e.life > 0);
}

export function mvPowerTick(f, inputs, platforms, W, H, opponent) {
  K.statusTick(f);
  if (f._pwSolids && f._pwSolids.length) f._pwSolids = f._pwSolids.filter((s) => s.persist || --s.life > 0);
  const key = keyOf(f), def = ABILITIES[key];
  const press = (!!inputs.power && !f._pwPrevPower) || !!f._pwForcePress, held = !!inputs.power; f._pwForcePress = false; f._pwPrevPower = held;
  if (!def) return;
  inputs.power = false;                                                   // the engine owns the power button for this character
  if (!K.alive(f)) { if (f._pw) K.clearAbility(f); return; }
  const oppList = (f._allOpponents && f._allOpponents.length ? f._allOpponents : [opponent]).filter(K.alive);
  const c = { f, def, inputs, press, held, platforms: allSolids(f, platforms), W, H, opps: oppList, pw: f._pw, S: f._pw ? f._pw.d : null };
  const jumpEdge = !!inputs.jump && !f._pwPrevJump; f._pwPrevJump = !!inputs.jump; c.jump = jumpEdge;
  if (!f._pw) {
    if (press && f.powerCooldown <= 0 && !(f.powerDisabled > 0) && f.state !== 'hitstun' && f.state !== 'captured' && !f.attackData && !f.attackHold) {
      f._pw = { id: key, t: 0, d: {}, ents: [], lock: 0 }; c.pw = f._pw; c.S = f._pw.d;
      const ok = def.press(c);
      if (ok === false) K.clearAbility(f);
      else { f.powerCooldown = 99999; f._maxPowerCooldown = def.cd; }
    }
  } else {
    c.pw.t++;
    if (f.state === 'hitstun' && def.onHit) def.onHit(c);
    if (press && def.second && !f._pwEnd) def.second(c);
    if (def.tick && f._pw && !f._pwEnd) def.tick(c);
    if (f._pw) updateEnts(c);
  }
  if (f._pw && f._pw.lock > 0) {                                           // locked: ability fully controls the body this frame
    inputs.left = inputs.right = inputs.up = inputs.down = inputs.jump = false; inputs.sig = inputs.heavy = inputs.superMove = inputs.dash = false;
    f._pw.lock--;
  }
  if (f._pwEnd != null) {
    const flying = f._pw && f._pw.ents.some((e) => e.proj && e.life > 0 && !e.harmless);       // ability is over, but shots it fired keep flying
    if (!flying) { const cd = f._pwEnd; f._pwEnd = null; K.clearAbility(f); f.powerCooldown = cd; f._maxPowerCooldown = cd; }
  }
}
// bots / external callers
export function mvPowerPressExternal(f, opponent) {
  if (!mvPowerHas(f)) return false;
  f._pwForcePress = true; return true;
}
export function mvPowerReset(f) { K.clearAbility(f); f._pwDot = null; f._pwRevealed = 0; f._pwBuff && f._pwBuff.undo(f); f._pwBuff = null; if (f._pwShield) { f.shieldAmount = Math.max(0, (f.shieldAmount || 0) - f._pwShield.amt); f._pwShield = null; } f._pwSolids = []; }
