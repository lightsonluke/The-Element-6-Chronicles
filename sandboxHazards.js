// sandboxHazards.js — scaled-down BR hazards and knockback objects for Sandbox mode.
// Reuses rendering from brRender.js but with simplified build/update logic for
// regular-sized stages (1280×720). Keeps BR environment systems isolated.

import { drawHazards, drawObjects } from './brRender.js';

const GRAVITY = 0.42;

const OBJECT_TYPES = {
  heavy:    { mass: 3.0, friction: 0.92, bounce: 0.15, damage: 18, knockback: 14, size: 32, color: '#8B7355', breakThreshold: 999 },
  light:    { mass: 0.8, friction: 0.88, bounce: 0.35, damage: 8,  knockback: 8,  size: 22, color: '#88CCFF', breakThreshold: 999 },
  bouncing: { mass: 1.0, friction: 0.96, bounce: 0.7,  damage: 10, knockback: 10, size: 26, color: '#FF88CC', breakThreshold: 999 },
  breakable:{ mass: 1.2, friction: 0.90, bounce: 0.2,  damage: 12, knockback: 9,  size: 28, color: '#FFDD88', breakThreshold: 3 },
  boomerang:{ mass: 0.5, friction: 1.0,  bounce: 0,    damage: 12, knockback: 10, size: 24, color: '#FFAA00', breakThreshold: 999 },
};

// Build hazards placed on the stage's platforms.
export function buildSandboxHazards(platforms, W, H) {
  const hazards = { rocks: [], water: [], fire: [], electric: [], moving: [], wind: [] };
  const solidPlats = platforms.filter(p => !p._deleted && p.w > 150);
  if (solidPlats.length === 0) return hazards;

  // Fire zones on 2 random platforms
  const firePlats = [...solidPlats].sort(() => Math.random() - 0.5).slice(0, Math.min(2, solidPlats.length));
  for (const p of firePlats) {
    hazards.fire.push({ x: p.x + p.w * 0.3, y: p.y, w: 80, h: 40, spreadTimer: 0, maxSpread: 0, spreadRadius: 0, originalX: p.x, originalW: 80 });
  }

  // Electric zone on 1 platform
  const elecPlat = solidPlats[Math.floor(Math.random() * solidPlats.length)];
  if (elecPlat) {
    hazards.electric.push({ x: elecPlat.x + elecPlat.w * 0.5 - 50, y: elecPlat.y, w: 100, h: 40, damage: 0.8, stun: 10, pulseTimer: 0 });
  }

  // Moving saw on the widest platform
  const widest = solidPlats.reduce((a, b) => a.w > b.w ? a : b, solidPlats[0]);
  if (widest && widest.w > 400) {
    const sx = widest.x + 80;
    hazards.moving.push({ x: sx, y: widest.y - 45, w: 44, h: 44, vx: 2.5, range: widest.w - 160, dir: 1, type: 'saw', startX: sx, damage: 1.5, knockback: 10 });
  }

  // Water at the bottom of the stage
  hazards.water.push({ x: 0, y: H - 20, w: W, h: 80 });

  return hazards;
}

// Move a hazard that has a `move` config (generic motion for fire/electric/water/wind/catapult).
function moveHazard(h) {
  const m = h.move;
  if (!m) return;
  const ax = m.axis || 'horizontal';
  const spd = m.speed || 2.5;
  const rng = m.range || 200;
  const sx = m.startX ?? h.x;
  const sy = m.startY ?? h.y;
  if (m.dir == null) m.dir = 1;
  if (ax === 'vertical') {
    h.y += spd * m.dir;
    if (h.y > sy + rng) { m.dir = -1; h.y = sy + rng; }
    else if (h.y < sy) { m.dir = 1; h.y = sy; }
  } else {
    h.x += spd * m.dir;
    if (h.x > sx + rng) { m.dir = -1; h.x = sx + rng; }
    else if (h.x < sx) { m.dir = 1; h.x = sx; }
  }
}

// Update sandbox hazards each frame.
export function updateSandboxHazards(hazards, fighters, dt) {
  // Generic motion for hazards with a `move` config
  for (const h of hazards.fire) if (h.move) moveHazard(h);
  for (const h of hazards.electric) if (h.move) moveHazard(h);
  for (const h of hazards.water) if (h.move) moveHazard(h);
  for (const h of (hazards.wind || [])) if (h.move) moveHazard(h);
  for (const h of (hazards.catapults || [])) if (h.move) moveHazard(h);
  // Fire — damage fighters standing in it
  for (const f of hazards.fire) {
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0 || fighter.invincible > 0) continue;
      if (fighter.x > f.x && fighter.x < f.x + f.w && Math.abs(fighter.y - f.y) < 50 && fighter.grounded) {
        fighter.damage += 0.8;
        fighter.hitstun = Math.max(fighter.hitstun || 0, 5);
      }
    }
  }

  // Electric — damage + stun, pulses
  for (const e of hazards.electric) {
    e.pulseTimer = (e.pulseTimer + 1) % 120;
    if (e.pulseTimer >= 60) continue;
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0 || fighter.invincible > 0) continue;
      if (fighter.x > e.x && fighter.x < e.x + e.w && Math.abs(fighter.y - e.y) < 50 && fighter.grounded) {
        fighter.damage += e.damage;
        fighter.hitstun = Math.max(fighter.hitstun || 0, e.stun);
        fighter.vx *= 0.5;
      }
    }
  }

  // Moving hazards — support horizontal & vertical motion
  for (const m of hazards.moving) {
    const axis = m.axis || 'horizontal';
    if (axis === 'vertical') {
      m.y += m.vy;
      if (m.y > m.startY + m.range || m.y < m.startY) { m.vy *= -1; m.dir *= -1; }
    } else {
      m.x += m.vx;
      if (m.x > m.startX + m.range || m.x < m.startX) { m.vx *= -1; m.dir *= -1; }
    }
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0 || fighter.invincible > 0) continue;
      if (Math.abs(fighter.x - m.x) < m.w / 2 + 25 && Math.abs((fighter.y - 30) - m.y) < m.h / 2 + 30) {
        fighter.damage += m.damage;
        fighter.hitstun = 18;
        fighter.state = 'hitstun';
        fighter.vy = -10;
        fighter.vx = m.dir * m.knockback;
        fighter.grounded = false;
      }
    }
  }

  // Portals — teleport fighters from one portal to its linked pair
  for (const p of (hazards.portals || [])) {
    if (p.cooldown > 0) { p.cooldown--; continue; }
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0) continue;
      // Portal A
      if (Math.abs(fighter.x - p.a.x) < p.a.w / 2 && Math.abs((fighter.y - 30) - p.a.y) < p.a.h / 2 + 20) {
        fighter.x = p.b.x; fighter.y = p.b.y;
        fighter.vx = 0; fighter.vy = 0;
        fighter.invincible = Math.max(fighter.invincible || 0, 20);
        p.cooldown = 60; // 1 second at 60fps
        break;
      }
      // Portal B
      if (Math.abs(fighter.x - p.b.x) < p.b.w / 2 && Math.abs((fighter.y - 30) - p.b.y) < p.b.h / 2 + 20) {
        fighter.x = p.a.x; fighter.y = p.a.y;
        fighter.vx = 0; fighter.vy = 0;
        fighter.invincible = Math.max(fighter.invincible || 0, 20);
        p.cooldown = 60; // 1 second at 60fps
        break;
      }
    }
  }

  // Catapults — touch → suck in (lock) → charge → launch forward
  for (const c of (hazards.catapults || [])) {
    if (c.cooldown > 0) { c.cooldown--; }
    if (c.active) {
      c.charge++;
      const f = c.active;
      if (f && f.stocks > 0) {
        // Lock fighter into the catapult
        f.x = c.x + c.w / 2;
        f.y = c.y;
        f.vx = 0; f.vy = 0;
        f.state = 'hitstun'; f.hitstun = 2;
        f.grounded = true;
        if (c.charge >= 25) {
          // LAUNCH — in the catapult's configured direction (left / right / up)
          const cdir = c.dir || 'right';
          if (cdir === 'up') { f.vx = 0; f.vy = -60; }
          else if (cdir === 'left') { f.vx = -52; f.vy = -12; }
          else { f.vx = 52; f.vy = -12; }
          f.grounded = false;
          f.invincible = Math.max(f.invincible || 0, 15);
          f.state = 'jumping';
          f.hitstun = 0;
          c.active = null;
          c.charge = 0;
          c.cooldown = 60;
        }
      } else {
        c.active = null; c.charge = 0;
      }
      continue;
    }
    // Look for a fighter touching the catapult to suck in
    if (c.cooldown > 0) continue;
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0 || fighter.invincible > 0) continue;
      if (Math.abs(fighter.x - (c.x + c.w / 2)) < c.w / 2 + 18 && Math.abs((fighter.y - 30) - c.y) < c.h / 2 + 25) {
        c.active = fighter;
        c.charge = 0;
        break;
      }
    }
  }

  // Wind — push fighters inside the zone in the wind's direction
  for (const w of (hazards.wind || [])) {
    const dir = w.dir || 'right';
    const str = w.strength || 3;
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0) continue;
      if (fighter.x > w.x && fighter.x < w.x + w.w && fighter.y > w.y && fighter.y < w.y + w.h) {
        if (dir === 'left') fighter.vx -= str;
        else if (dir === 'right') fighter.vx += str;
        else if (dir === 'up') fighter.vy -= str;
        else if (dir === 'down') fighter.vy += str;
      }
    }
  }

  // Water — slow movement
  for (const w of hazards.water) {
    for (const fighter of fighters) {
      if (!fighter || fighter.stocks <= 0) continue;
      if (fighter.x > w.x && fighter.x < w.x + w.w && fighter.y > w.y - 20 && fighter.y < w.y + w.h) {
        fighter.vx *= 0.85;
        fighter.vy *= 0.7;
        if (fighter.vy > 3) fighter.vy = 3;
      }
    }
  }
}

// Build knockback objects on the stage's platforms.
export function buildSandboxObjects(platforms) {
  const objects = [];
  const solidPlats = platforms.filter(p => !p._deleted && p.w > 150);
  if (solidPlats.length === 0) return objects;

  const types = ['heavy', 'light', 'bouncing', 'boomerang'];
  const count = Math.min(4, solidPlats.length);
  for (let i = 0; i < count; i++) {
    const p = solidPlats[i % solidPlats.length];
    const type = types[i % types.length];
    const props = OBJECT_TYPES[type];
    const ox = p.x + p.w * (0.25 + (i % 3) * 0.25);
    const oy = p.y - props.size - 5;
    objects.push({
      type, x: ox, y: oy, vx: 0, vy: 0,
      w: props.size, h: props.size, mass: props.mass, friction: props.friction,
      bounce: props.bounce, damage: props.damage, knockback: props.knockback,
      color: props.color, breakThreshold: props.breakThreshold, hitCount: 0,
      grounded: false, _originX: ox, _originY: oy, _phase: 'idle', _phaseTimer: 0,
      _hitIds: {}, _hitClearTimer: 0, _rot: 0,
    });
  }
  return objects;
}

// Update sandbox objects each frame (simplified from brObjects).
export function updateSandboxObjects(objects, fighters, platforms, dt, W, H, hazards) {
  for (const obj of objects) {
    if (obj._broken) continue;
    if (!obj._hitClearTimer) obj._hitClearTimer = 0;
    obj._hitClearTimer++;
    if (obj._hitClearTimer > 20) { obj._hitIds = {}; obj._hitClearTimer = 0; }

    // Boomerang phase logic
    if (obj.type === 'boomerang') {
      if (obj._phase === 'out') {
        obj._phaseTimer--;
        if (obj._phaseTimer <= 0) { obj._phase = 'return'; obj._phaseTimer = 120; }
      } else if (obj._phase === 'return') {
        const dx = obj._originX - obj.x, dy = obj._originY - obj.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        obj.vx += (dx / d) * 0.8; obj.vy += (dy / d) * 0.8;
        obj._phaseTimer--;
        if (d < 40 || obj._phaseTimer <= 0) {
          obj._phase = 'idle'; obj.vx = 0; obj.vy = 0;
          obj.x = obj._originX; obj.y = obj._originY;
        }
      } else { obj.vx *= 0.8; obj.vy *= 0.8; }
    }

    const useGravity = obj.type === 'boomerang' ? (obj._phase === 'idle' ? 1 : 0.1) : 1;
    obj.vy += GRAVITY * useGravity;
    // Anti-gravity material — reverse gravity for objects inside the field
    for (const p of platforms) {
      if (p._deleted || p.material !== 'antigravity') continue;
      if (obj.x > p.x && obj.x < p.x + p.w && obj.y > p.y && obj.y < p.y + p.h) {
        obj.vy -= GRAVITY * 2 * useGravity;
        if (obj.vy < -4) obj.vy = -4;
        obj.vx *= 0.96;
        break;
      }
    }
    // Wind hazard — push objects inside the zone
    for (const w of (hazards?.wind || [])) {
      if (obj.x > w.x && obj.x < w.x + w.w && obj.y > w.y && obj.y < w.y + w.h) {
        const str = w.strength || 3;
        if (w.dir === 'left') obj.vx -= str;
        else if (w.dir === 'right') obj.vx += str;
        else if (w.dir === 'up') obj.vy -= str;
        else if (w.dir === 'down') obj.vy += str;
      }
    }
    obj.vx *= obj.friction;
    if (Math.abs(obj.vx) > 30) obj.vx = Math.sign(obj.vx) * 30;
    if (obj.vy > 20) obj.vy = 20;
    obj.x += obj.vx; obj.y += obj.vy;
    obj._rot += obj.vx * 0.02;

    // Platform collision — top (landing), bottom (underside), and side walls
    obj.grounded = false;
    for (const p of platforms) {
      if (p._deleted) continue;
      if (p.material === 'antigravity') continue; // pass-through field
      const hw = obj.w / 2, hh = obj.h / 2;
      const inX = obj.x > p.x - hw && obj.x < p.x + p.w + hw;
      // Top collision (landing)
      if (inX && obj.vy >= 0 && obj.y >= p.y - hh - 2 && obj.y < p.y + p.h / 2) {
        obj.y = p.y - hh;
        if (obj.vy > 4 && obj.bounce > 0) obj.vy = -obj.vy * obj.bounce;
        else { obj.vy = 0; obj.grounded = true; }
        continue;
      }
      // Bottom collision (underside) — moving up into the platform
      if (inX && obj.vy < 0 && obj.y - hh < p.y + p.h && obj.y - hh > p.y) {
        obj.y = p.y + p.h + hh;
        obj.vy = Math.abs(obj.vy) * (obj.bounce > 0 ? obj.bounce : 0.2);
        continue;
      }
      // Side walls — when roughly level with the platform
      if (obj.y + hh > p.y + 2 && obj.y - hh < p.y + p.h - 2) {
        if (obj.vx > 0 && obj.x + hw > p.x && obj.x + hw < p.x + 24 && obj.x < p.x) {
          obj.x = p.x - hw; obj.vx = -obj.vx * (obj.bounce > 0 ? obj.bounce : 0.3);
        } else if (obj.vx < 0 && obj.x - hw < p.x + p.w && obj.x - hw > p.x + p.w - 24 && obj.x > p.x + p.w) {
          obj.x = p.x + p.w + hw; obj.vx = -obj.vx * (obj.bounce > 0 ? obj.bounce : 0.3);
        }
      }
    }

    // Object-vs-object collision — prevent overlap, allow stacking
    for (const other of objects) {
      if (other === obj || other._broken) continue;
      const dx = other.x - obj.x, dy = other.y - obj.y;
      const minDistX = (obj.w + other.w) / 2;
      const minDistY = (obj.h + other.h) / 2;
      if (Math.abs(dx) >= minDistX || Math.abs(dy) >= minDistY) continue;
      const overlapX = minDistX - Math.abs(dx);
      const overlapY = minDistY - Math.abs(dy);
      if (overlapX < overlapY) {
        // Horizontal push apart
        const push = overlapX / 2;
        if (dx > 0) { obj.x -= push; other.x += push; }
        else { obj.x += push; other.x -= push; }
        const tmp = obj.vx; obj.vx = other.vx * 0.5; other.vx = tmp * 0.5;
      } else {
        // Vertical push apart (stacking)
        const push = overlapY / 2;
        if (dy > 0) {
          obj.y -= push; other.y += push;
          if (obj.vy > 0) obj.vy = 0; obj.grounded = true;
          if (other.vy < 0) other.vy = 0;
        } else {
          obj.y += push; other.y -= push;
          if (other.vy > 0) other.vy = 0; other.grounded = true;
          if (obj.vy < 0) obj.vy = 0;
        }
      }
    }

    // Off-map cleanup
    if (obj.y > H + 300 || obj.x < -300 || obj.x > W + 300) {
      obj.x = obj._originX; obj.y = obj._originY; obj.vx = 0; obj.vy = 0; obj._phase = 'idle';
    }

    // Fighter collision
    if (Math.abs(obj.vx) > 1.5 || Math.abs(obj.vy) > 2 || (obj.type === 'boomerang' && obj._phase !== 'idle')) {
      for (const f of fighters) {
        if (!f || f.stocks <= 0 || f.invincible > 0) continue;
        const fid = f === fighters[0] ? 0 : 1;
        if (obj._hitIds[fid]) continue;
        if (Math.abs(f.x - obj.x) < obj.w / 2 + 25 && Math.abs((f.y - 30) - obj.y) < obj.h / 2 + 30) {
          f.damage += obj.damage;
          f.hitstun = 16; f.state = 'hitstun';
          f.vy = -obj.knockback * 0.6;
          f.vx = Math.sign(obj.vx || (f.x - obj.x)) * obj.knockback;
          f.grounded = false;
          obj._hitIds[fid] = true;
          if (obj.type === 'breakable') { obj.hitCount++; if (obj.hitCount >= obj.breakThreshold) obj._broken = true; }
          if (obj.type === 'bouncing') { obj.vy = -Math.abs(obj.vy) * 0.6; obj.vx *= -0.5; }
        }
      }
    }
  }

  // Respawn broken objects
  for (const obj of objects) {
    if (obj._broken) {
      obj._broken = false; obj.hitCount = 0;
      obj.x = obj._originX; obj.y = obj._originY;
      obj.vx = 0; obj.vy = 0; obj._phase = 'idle';
    }
  }
}

const _PASS_THROUGH_MATS = ['water','lava','cloud','acid','tar','antigravity'];
// Liang-Barsky segment vs AABB intersection
function _segIntersectsRect(x1, y1, x2, y2, rx1, ry1, rx2, ry2) {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rx1, rx2 - x1, y1 - ry1, ry2 - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else {
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
  }
  return t0 <= t1;
}
// Returns true if a solid wall platform sits between (ax,ay) and (ox,oy)
function _blockedByPlatform(ax, ay, ox, oy, platforms) {
  if (!platforms) return false;
  for (const p of platforms) {
    if (p._deleted) continue;
    const mat = p.material || 'normal';
    if (_PASS_THROUGH_MATS.includes(mat)) continue;
    if (p.h < 18) continue; // thin platforms aren't walls
    if (_segIntersectsRect(ax, ay, ox, oy, p.x, p.y, p.x + p.w, p.y + p.h)) return true;
  }
  return false;
}

// Apply knockback to an object when a fighter's attack hits it.
// `platforms` (optional) enables a line-of-sight check so attacks can't hit
// objects through solid walls/platforms.
export function processSandboxObjectHits(fighters, objects, platforms) {
  for (const a of fighters) {
    if (!a || a.stocks <= 0) continue;
    const ad = a.attackData;
    if (!ad || ad.hitApplied) continue;
    const p = ad.progress || 0;
    if (p < 0.08 || p > 0.85) continue;

    const baseRange = (ad.range || 80) * (a.rangeBoost || 1);
    const facing = a.facing;
    const st = ad.sigType;
    let hbW, hbH, hbCX, hbCY;
    if (st === 'up' || st === 'aerial') { hbW = 70; hbH = baseRange; hbCX = a.x; hbCY = a.y - baseRange / 2 - 10; }
    else if (st === 'down' || st === 'downNormal') { hbW = 70; hbH = baseRange; hbCX = a.x; hbCY = a.y + baseRange / 2 - 20; }
    else if (st === 'heavy') { hbW = baseRange * 1.1; hbH = 80; hbCX = a.x + facing * (hbW / 2 - 10); hbCY = a.y - 30; }
    else { hbW = baseRange; hbH = 60; hbCX = a.x + facing * (hbW / 2 - 10); hbCY = a.y - 30; }

    for (const obj of objects) {
      if (obj._broken) continue;
      const overlap = (hbCX - hbW / 2) < (obj.x + obj.w / 2) && (hbCX + hbW / 2) > (obj.x - obj.w / 2) &&
                      (hbCY - hbH / 2) < (obj.y + obj.h / 2) && (hbCY + hbH / 2) > (obj.y - obj.h / 2);
      if (!overlap) continue;
      // Line-of-sight: don't hit objects through solid walls
      if (_blockedByPlatform(a.x, a.y - 30, obj.x, obj.y, platforms)) continue;
      const power = ad.isSuper ? 24 : ad.isHeavy ? 18 : ad.isNormal ? 7 : 12;
      const dir = facing || 1;
      if (obj.type === 'boomerang' && obj._phase === 'idle') {
        obj._phase = 'out'; obj._phaseTimer = 90; obj.vx = dir * 20; obj.vy = -4; obj._hitIds = {};
      } else {
        if (st === 'up' || st === 'aerial') { obj.vy = -power * 1.2; obj.vx += dir * power * 0.3; }
        else if (st === 'down' || st === 'downNormal') { obj.vy = power * 0.5; obj.vx += dir * power * 0.5; }
        else { obj.vx = dir * power; obj.vy = -power * 0.4; }
        if (obj.type === 'bouncing') obj.vy = -Math.abs(obj.vy) * 1.3;
        obj._hitIds = {};
      }
    }
  }
}

export { drawHazards, drawObjects };