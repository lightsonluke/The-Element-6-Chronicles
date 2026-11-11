// mvPowerKit.js — shared helpers for the power-ability engine (no imports from fighter.js: keeps the graph acyclic).
// Everything is deterministic (no Math.random) so replays / online simulation stay in sync.
import { mvHitShapes } from './mvEngine.js';

export const BODY_W = 16, BODY_H = 70;
const NO_SOLID = ['water', 'lava', 'cloud', 'acid', 'tar', 'antigravity'];
let UID = 1;
export const uid = () => UID++;

// ── world queries ────────────────────────────────────────────────────────────
export const rects = (c) => c.platforms.filter((p) => p && !p._freehandSlope && !(p._deleted > 0) && !NO_SOLID.includes(p.material || 'normal'));
export const isThick = (p) => p._forceSolid || p.h > 20;
// slab ray/rect test → distance or null
function rayRect(ox, oy, dx, dy, len, r) {
  let tmin = 0, tmax = len; const d = [dx, dy], o = [ox, oy], mn = [r.x, r.y], mx = [r.x + r.w, r.y + r.h];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < mn[i] || o[i] > mx[i]) return null; }
    else { let t1 = (mn[i] - o[i]) / d[i], t2 = (mx[i] - o[i]) / d[i]; if (t1 > t2) { const t = t1; t1 = t2; t2 = t; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return null; }
  }
  return tmin;
}
// nearest solid hit along a ray: { t, x, y, rect } or null.  `thickOnly` ignores one-way platforms.
export function ray(c, ox, oy, ang, len, thickOnly = false) {
  const dx = Math.cos(ang), dy = Math.sin(ang); let best = null;
  for (const r of rects(c)) {
    if (thickOnly && !isThick(r)) continue;
    const t = rayRect(ox, oy, dx, dy, len, r); if (t == null) continue;
    if (!best || t < best.t) best = { t, x: ox + dx * t, y: oy + dy * t, rect: r };
  }
  return best;
}
// top surface directly below (x, y0)
export function groundY(c, x, y0, maxDrop = 600) {
  let best = null;
  for (const r of rects(c)) if (x >= r.x && x <= r.x + r.w && r.y >= y0 - 6 && r.y <= y0 + maxDrop && (best == null || r.y < best)) best = r.y;
  return best;
}
export const onStage = (c, x, y) => x > -40 && x < c.W + 40 && y > 30 && y < c.H + 20;
// is a standing body at (x, y=feet) clear of thick solids and on the stage?
export function free(c, x, y) {
  if (!onStage(c, x, y)) return false;
  for (const r of rects(c)) if (isThick(r) && x + BODY_W > r.x && x - BODY_W < r.x + r.w && y - 2 > r.y && y - BODY_H < r.y + r.h) return false;
  return true;
}
// path between two points is not blocked by thick solids
export function pathClear(c, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 1) return true;
  return !ray(c, x0, y0 - 35, Math.atan2(dy, dx), L, true);
}
export function teleport(c, f, x, y) {
  if (!free(c, x, y) || !pathClear(c, f.x, f.y, x, y)) return false;
  f.x = x; f.y = y; f.vx = 0; f.vy = 0; return true;
}

// ── fighters / hits ──────────────────────────────────────────────────────────
export const alive = (t) => t && t.stocks > 0 && t.state !== 'dead' && t.state !== 'respawning';
export const bodyHit = (t, cx, cy, r) => { const nx = Math.max(t.x - BODY_W, Math.min(cx, t.x + BODY_W)), ny = Math.max(t.y - BODY_H, Math.min(cy, t.y)); return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r; };
export const rectHit = (t, x, y, w, h) => t.x + BODY_W > x && t.x - BODY_W < x + w && t.y > y && t.y - BODY_H < y + h;
export const pid = (t) => (t._pwid || (t._pwid = uid()));
// apply a power hit.  o: { d dmg, kx ky launch, hs hitstun (0/undefined = push only) }
export function hit(f, t, o) {
  if (!alive(t) || t.invincible > 0) return false;
  const red = (t.shieldAmount || 0) + (t.statDefenseReduction || 0);
  const d = (o.d || 0) * (f.statPowerMul || 1) * (f.damageBoost || 1) * Math.max(0.1, 1 - red);
  if (d > 0) { if (f.gameMode === 'hp') t.hp = Math.max(0, (t.hp ?? 150) - d); else t.damage = (t.damage || 0) + d; }
  t._lastHitBy = f;
  const kd = (1 + (t.damage || 0) * 0.004) * (t.knockbackTakenMul || 1) * (f.knockbackMul || 1);
  t.vx = (o.kx || 0) * kd; t.vy = (o.ky || 0) * kd;
  if (o.hs) { t.trapped = false; t.slowTimer = 0; t.hitstun = Math.max(t.hitstun || 0, o.hs); t.state = 'hitstun'; t.attackData = null; t.attackHold = null; t.attackTimer = 0; t.grounded = false; }
  if (o.slow) { t.slowTimer = o.slow; t.speedMul = o.slowMul || 0.55; }
  t.hitEffects = t.hitEffects || []; t.hitEffects.push({ x: t.x, y: t.y - 30, color: f.char.color, spawnFrame: t.frame });
  return true;
}
export const opps = (c) => c.opps;
// did an opponent's attack land on (circle)?  returns the attackData or null
export function struckBy(c, cx, cy, r) {
  for (const o of c.opps) {
    if (!alive(o) || !o.attackData || !o.attackData._mv) continue;
    for (const sh of mvHitShapes(o)) {
      if (sh.shape === 'circle' && (sh.x - cx) ** 2 + (sh.y - cy) ** 2 <= (sh.r + r) ** 2) return o.attackData;
      if (sh.shape === 'capsule') { // point-to-segment distance
        const vx = sh.x2 - sh.x1, vy = sh.y2 - sh.y1, L2 = vx * vx + vy * vy || 1; const u = Math.max(0, Math.min(1, ((cx - sh.x1) * vx + (cy - sh.y1) * vy) / L2));
        if ((sh.x1 + vx * u - cx) ** 2 + (sh.y1 + vy * u - cy) ** 2 <= (sh.r + r) ** 2) return o.attackData;
      }
      if (sh.shape === 'box' && Math.abs(cx - sh.x) <= sh.w / 2 + r && Math.abs(cy - sh.y) <= sh.h / 2 + r) return o.attackData;
    }
  }
  return null;
}
export const isHeavyAtk = (ad) => !!(ad && (ad.isHeavy || ad.isSuper));

// ── entities & ability lifecycle ─────────────────────────────────────────────
export function spawn(c, ent) { ent.id = uid(); ent.hit = ent.hit || {}; if (ent.life == null) ent.life = 60; c.pw.ents.push(ent); return ent; }
export const find = (c, k) => c.pw.ents.find((e) => e.k === k || e.tag === k);
export function end(c, cd) { c.f._pwEnd = cd == null ? c.def.cd : cd; }           // engine finishes the ability after this tick
export function lock(c, n) { c.pw.lock = Math.max(c.pw.lock, n); }
export function addSolid(c, r) { const f = c.f; f._pwSolids = f._pwSolids || []; r.id = uid(); r.owner = f; r.life = r.life ?? 120; f._pwSolids.push(r); return r; }
export function dropSolid(f, r) { if (f._pwSolids) f._pwSolids = f._pwSolids.filter((s) => s !== r); }
// projectile owned by the ability.  Moves, collides with thick geometry (never passes through walls), hits each opponent once.
export function proj(c, o) {
  return spawn(c, { k: 'orb', proj: true, vx: 0, vy: 0, g: 0, r: 10, life: 60, d: 0, hitStyle: o.hitStyle || 'launch', ...o });
}
export const dirTo = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const face = (f) => f.facing || 1;
// fighter lock (inputs cleared by the engine while pw.lock > 0)
export function setMove(f, vx, vy) { f.vx = vx; if (vy != null) f.vy = vy; }
// exact positional dash step (physics friction can't shorten it); stops against thick solids / the stage edge
export function dashStep(c, f, dx, dy = 0) { const nx = f.x + dx, ny = f.y + dy; if (free(c, nx, ny)) { f.x = nx; f.y = ny; } f.vx = 0; f.vy = 0; }
export function standing(f) { return !!f.grounded; }
// give shield to a fighter for n frames (capped, never stacks)
export function shield(t, amt, frames) { t._pwShield = { amt, t: frames }; t.shieldAmount = Math.max(t.shieldAmount || 0, amt); }
// status effects processed for EVERY fighter each frame (poison, reveal, shields, hide)
export function statusTick(f) {
  if (f._pwDot) { const d = f._pwDot; if (d.t > 0 && d.left > 0) { const dmg = Math.min(d.rate, d.left); d.left -= dmg; d.t--; if (f.gameMode === 'hp') f.hp = Math.max(0, (f.hp ?? 150) - dmg); else f.damage = (f.damage || 0) + dmg; } else f._pwDot = null; }
  if (f._pwRevealed > 0) f._pwRevealed--;
  if (f._pwShield) { if (--f._pwShield.t <= 0) { f.shieldAmount = Math.max(0, (f.shieldAmount || 0) - f._pwShield.amt); f._pwShield = null; } }
  if (f._pwBuff) { const b = f._pwBuff; if (--b.t <= 0) { b.undo(f); f._pwBuff = null; } }
}
export function clearAbility(f) {
  if (f._pw) { for (const e of f._pw.ents) if (e.onEnd) e.onEnd(f); }
  f._pw = null; f._pwSolids = (f._pwSolids || []).filter((s) => s.keep); f._pwHide = false; f._pwFx = null; f._pwOutline = null;
}
