// brObjects.js — Battle Royale ONLY: interactive physics objects.
// Players do NOT pick these up. Instead: player attacks object → object receives
// knockback → object moves through environment → object can hit players/objects.
// Types: heavy, light, bouncing, breakable, sliding, large, boomerang.

import { BR_PLATFORMS, BR_W, BR_H, resolvePlacement } from './battleRoyaleMap.js';

const GRAVITY = 0.42;

const OBJECT_TYPES = {
  heavy:    { mass: 3.0, friction: 0.92, bounce: 0.15, damage: 18, knockback: 14, size: 36, color: '#8B7355', breakThreshold: 999 },
  light:    { mass: 0.8, friction: 0.88, bounce: 0.35, damage: 8,  knockback: 8,  size: 24, color: '#88CCFF', breakThreshold: 999 },
  bouncing: { mass: 1.0, friction: 0.96, bounce: 0.7,  damage: 10, knockback: 10, size: 28, color: '#FF88CC', breakThreshold: 999 },
  breakable:{ mass: 1.2, friction: 0.90, bounce: 0.2,  damage: 12, knockback: 9,  size: 30, color: '#FFDD88', breakThreshold: 3 },
  sliding:  { mass: 1.5, friction: 0.98, bounce: 0.1,  damage: 14, knockback: 12, size: 32, color: '#88DDAA', breakThreshold: 999 },
  large:    { mass: 4.0, friction: 0.94, bounce: 0.1,  damage: 25, knockback: 18, size: 48, color: '#AA6644', breakThreshold: 999 },
  boomerang:{ mass: 0.5, friction: 1.0,  bounce: 0,    damage: 12, knockback: 10, size: 26, color: '#FFAA00', breakThreshold: 999 },
};

// Build objects at fixed positions across the arena.
export function buildObjects() {
  const objects = [];
  const defs = [
    { type: 'heavy',     x: 2500, y: 7260 },
    { type: 'light',     x: 4000, y: 7360 },
    { type: 'bouncing',  x: 5500, y: 7360 },
    { type: 'breakable', x: 7000, y: 7360 },
    { type: 'sliding',    x: 8500, y: 7360 },
    { type: 'large',      x: 10000, y: 7260 },
    { type: 'boomerang',  x: 12000, y: 7260 },
    { type: 'heavy',     x: 14000, y: 7260 },
    { type: 'light',     x: 15500, y: 7360 },
    { type: 'bouncing',  x: 17000, y: 7360 },
    { type: 'breakable', x: 18500, y: 7360 },
    { type: 'sliding',    x: 20000, y: 7360 },
    { type: 'large',      x: 3000, y: 6560 },
    { type: 'boomerang',  x: 6000, y: 5860 },
    { type: 'heavy',     x: 9000, y: 6560 },
    { type: 'light',     x: 12000, y: 5160 },
    { type: 'bouncing',  x: 15000, y: 6560 },
    { type: 'breakable', x: 18000, y: 5160 },
    { type: 'sliding',    x: 5000, y: 5160 },
    { type: 'large',      x: 8000, y: 4760 },
    { type: 'boomerang',  x: 11000, y: 4060 },
    { type: 'heavy',     x: 14000, y: 4760 },
    { type: 'light',     x: 17000, y: 4060 },
    { type: 'bouncing',  x: 3500, y: 5160 },
    { type: 'breakable', x: 6500, y: 4060 },
    { type: 'sliding',    x: 9500, y: 3360 },
    { type: 'large',      x: 12500, y: 2960 },
    { type: 'boomerang',  x: 15500, y: 3360 },
    { type: 'heavy',     x: 4500, y: 2960 },
    { type: 'light',     x: 7500, y: 1660 },
  ];

  for (const d of defs) {
    const props = OBJECT_TYPES[d.type];
    const adj = resolvePlacement(d.x, d.y, props.size, props.size);
    const ox = adj.x, oy = adj.y;
    objects.push({
      type: d.type,
      x: ox, y: oy,
      vx: 0, vy: 0,
      w: props.size, h: props.size,
      mass: props.mass,
      friction: props.friction,
      bounce: props.bounce,
      damage: props.damage,
      knockback: props.knockback,
      color: props.color,
      breakThreshold: props.breakThreshold,
      hitCount: 0,
      grounded: false,
      _originX: ox, _originY: oy,
      _phase: 'idle', // boomerang: idle → out → return → idle
      _phaseTimer: 0,
      _hitIds: {}, // per-fighter hit cooldown
      _rot: 0,
    });
  }
  return objects;
}

// Update all objects each frame. Handles physics, platform collision,
// fighter collision, and object-vs-object collision.
export function updateObjects(objects, fighters, platforms, dt) {
  for (const obj of objects) {
    // Clear hit IDs periodically (allow re-hit after cooldown)
    if (!obj._hitClearTimer) obj._hitClearTimer = 0;
    obj._hitClearTimer++;
    if (obj._hitClearTimer > 20) {
      obj._hitIds = {};
      obj._hitClearTimer = 0;
    }

    // Boomerang phase logic
    if (obj.type === 'boomerang') {
      if (obj._phase === 'out') {
        obj._phaseTimer--;
        if (obj._phaseTimer <= 0) {
          obj._phase = 'return';
          obj._phaseTimer = 120; // return takes ~2 seconds
        }
      } else if (obj._phase === 'return') {
        // Curve back toward origin
        const dx = obj._originX - obj.x;
        const dy = obj._originY - obj.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        obj.vx += (dx / d) * 0.8;
        obj.vy += (dy / d) * 0.8;
        obj._phaseTimer--;
        if (d < 40 || obj._phaseTimer <= 0) {
          obj._phase = 'idle';
          obj.vx = 0; obj.vy = 0;
          obj.x = obj._originX; obj.y = obj._originY;
        }
      } else if (obj._phase === 'idle') {
        // Slowly decel if somehow moving
        obj.vx *= 0.8; obj.vy *= 0.8;
      }
    }

    // Physics (boomerang in 'out' or 'return' uses reduced gravity)
    const useGravity = obj.type === 'boomerang' ? (obj._phase === 'idle' ? 1 : 0.1) : 1;
    obj.vy += GRAVITY * useGravity;
    obj.vx *= obj.friction;

    // Clamp speeds
    if (Math.abs(obj.vx) > 30) obj.vx = Math.sign(obj.vx) * 30;
    if (obj.vy > 20) obj.vy = 20;

    obj.x += obj.vx;
    obj.y += obj.vy;
    obj._rot += obj.vx * 0.02;

    // Platform collision (land on top of platforms)
    obj.grounded = false;
    for (const p of platforms) {
      if (p._deleted) continue;
      if (obj.x > p.x - obj.w / 2 && obj.x < p.x + p.w + obj.w / 2) {
        // Land on top
        if (obj.vy >= 0 && obj.y >= p.y - obj.h / 2 - 2 && obj.y < p.y + obj.h / 2) {
          obj.y = p.y - obj.h / 2;
          if (obj.vy > 4 && obj.bounce > 0) {
            obj.vy = -obj.vy * obj.bounce;
          } else {
            obj.vy = 0;
            obj.grounded = true;
          }
        }
      }
    }

    // Off-map cleanup
    if (obj.y > BR_H + 500 || obj.x < -500 || obj.x > BR_W + 500) {
      // Respawn at origin
      obj.x = obj._originX; obj.y = obj._originY;
      obj.vx = 0; obj.vy = 0;
      obj._phase = 'idle';
    }

    // Fighter collision — object hits a fighter
    if (Math.abs(obj.vx) > 1.5 || Math.abs(obj.vy) > 2 || (obj.type === 'boomerang' && obj._phase !== 'idle')) {
      for (const f of fighters) {
        if (f._eliminated || f.stocks <= 0) continue;
        if (f.invincible > 0) continue;
        const fid = f.playerIndex;
        if (obj._hitIds[fid]) continue;
        const hit = Math.abs(f.x - obj.x) < obj.w / 2 + 25 && Math.abs((f.y - 30) - obj.y) < obj.h / 2 + 30;
        if (hit) {
          f.damage += obj.damage;
          f.hitstun = 16;
          f.state = 'hitstun';
          f.vy = -obj.knockback * 0.6;
          f.vx = Math.sign(obj.vx || (f.x - obj.x)) * obj.knockback;
          f.grounded = false;
          obj._hitIds[fid] = true;
          // Breakable objects take damage from hitting fighters
          if (obj.type === 'breakable') {
            obj.hitCount++;
            if (obj.hitCount >= obj.breakThreshold) {
              obj._broken = true;
            }
          }
          // Bouncing objects bounce off fighters
          if (obj.type === 'bouncing') {
            obj.vy = -Math.abs(obj.vy) * 0.6;
            obj.vx *= -0.5;
          }
        }
      }
    }

    // Object-vs-object collision (simple)
    for (const o2 of objects) {
      if (o2 === obj || o2._broken) continue;
      const dx = obj.x - o2.x, dy = obj.y - o2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (obj.w + o2.w) / 2;
      if (dist < minDist && dist > 0) {
        // Push apart
        const push = (minDist - dist) / 2;
        const nx = dx / dist, ny = dy / dist;
        obj.x += nx * push; obj.y += ny * push;
        o2.x -= nx * push; o2.y -= ny * push;
        // Transfer some velocity (lighter object moves more)
        const totalMass = obj.mass + o2.mass;
        obj.vx = (obj.vx * (obj.mass - o2.mass) + 2 * o2.mass * o2.vx) / totalMass * 0.7;
        o2.vx = (o2.vx * (o2.mass - obj.mass) + 2 * obj.mass * obj.vx) / totalMass * 0.7;
      }
    }
  }

  // Remove broken objects
  for (let i = objects.length - 1; i >= 0; i--) {
    if (objects[i]._broken) {
      // Respawn after a delay instead of permanent removal
      objects[i]._broken = false;
      objects[i].hitCount = 0;
      objects[i].x = objects[i]._originX;
      objects[i].y = objects[i]._originY;
      objects[i].vx = 0; objects[i].vy = 0;
      objects[i]._phase = 'idle';
    }
  }
}

// Apply knockback to an object when a fighter's attack hits it.
// Called from the engine after hit detection.
export function applyAttackToObject(fighter, obj) {
  const ad = fighter.attackData;
  if (!ad) return;
  const power = ad.isSuper ? 28 : ad.isHeavy ? 20 : ad.isNormal ? 8 : 14; // sigs = 14
  const dir = fighter.facing || 1;
  const st = ad.sigType;

  // Boomerang: attack sends it flying outward, then it returns
  if (obj.type === 'boomerang' && obj._phase === 'idle') {
    obj._phase = 'out';
    obj._phaseTimer = 90; // ~1.5 seconds outward
    obj.vx = dir * 22;
    obj.vy = -4;
    obj._hitIds = {};
    return;
  }

  // Other objects: apply knockback based on attack direction
  if (st === 'up' || st === 'aerial') {
    obj.vy = -power * 1.2;
    obj.vx += dir * power * 0.3;
  } else if (st === 'down' || st === 'downNormal') {
    obj.vy = power * 0.5;
    obj.vx += dir * power * 0.5;
  } else {
    obj.vx = dir * power;
    obj.vy = -power * 0.4;
  }

  // Breakable objects take damage from attacks
  if (obj.type === 'breakable') {
    obj.hitCount += ad.isSuper ? 2 : ad.isHeavy ? 1 : 0;
    if (obj.hitCount >= obj.breakThreshold) obj._broken = true;
  }

  // Bouncing objects get extra bounce
  if (obj.type === 'bouncing') {
    obj.vy = -Math.abs(obj.vy) * 1.3;
  }

  obj._hitIds = {}; // allow re-hit after being struck
}

// Check if a fighter's attack hits any objects (called after fighter hit detection).
export function processObjectHits(fighters, objects) {
  for (const a of fighters) {
    if (a._eliminated || a.stocks <= 0) continue;
    const ad = a.attackData;
    if (!ad || ad.hitApplied) continue;
    const p = ad.progress || 0;
    if (p < 0.08 || p > 0.85) continue;

    // Build attack hitbox
    const baseRange = (ad.range || 80) * (a.rangeBoost || 1);
    const facing = a.facing;
    const st = ad.sigType;
    let hbW, hbH, hbCX, hbCY;
    if (st === 'up' || st === 'aerial') {
      hbW = 70; hbH = baseRange; hbCX = a.x; hbCY = a.y - baseRange / 2 - 10;
    } else if (st === 'down' || st === 'downNormal') {
      hbW = 70; hbH = baseRange; hbCX = a.x; hbCY = a.y + baseRange / 2 - 20;
    } else if (st === 'heavy') {
      hbW = baseRange * 1.1; hbH = 80; hbCX = a.x + facing * (hbW / 2 - 10); hbCY = a.y - 30;
    } else {
      hbW = baseRange; hbH = 60; hbCX = a.x + facing * (hbW / 2 - 10); hbCY = a.y - 30;
    }

    for (const obj of objects) {
      if (obj._broken) continue;
      const overlap = (hbCX - hbW / 2) < (obj.x + obj.w / 2) &&
                      (hbCX + hbW / 2) > (obj.x - obj.w / 2) &&
                      (hbCY - hbH / 2) < (obj.y + obj.h / 2) &&
                      (hbCY + hbH / 2) > (obj.y - obj.h / 2);
      if (overlap) {
        applyAttackToObject(a, obj);
      }
    }
  }
}

// Find the nearest object that can be hit toward an enemy (for bot AI).
export function nearestObjectToHit(objects, fighter, target, maxDist = 400) {
  let best = null, bd = maxDist;
  for (const obj of objects) {
    if (obj._broken) continue;
    // Object must be between fighter and target, or near the fighter
    const d = Math.abs(obj.x - fighter.x) + Math.abs(obj.y - fighter.y) * 0.5;
    if (d > maxDist) continue;
    // Check if hitting it toward the target makes sense
    const dirToTarget = Math.sign(target.x - fighter.x) || 1;
    const objDir = Math.sign(obj.x - fighter.x) || 1;
    if (dirToTarget === objDir || d < 80) {
      if (d < bd) { bd = d; best = obj; }
    }
  }
  return best;
}

// Find the boomerang and predict its outward/return path (for bot AI).
export function getBoomerangInfo(objects) {
  const boomerangs = objects.filter(o => o.type === 'boomerang' && !o._broken);
  return boomerangs.map(b => ({
    obj: b,
    phase: b._phase,
    originX: b._originX, originY: b._originY,
    x: b.x, y: b.y,
    vx: b.vx, vy: b.vy,
  }));
}

// Serialize objects for network sync.
export function serializeObjects(objects) {
  return objects.filter(o => !o._broken).map(o => ({
    t: o.type[0], // first letter as type code
    x: Math.round(o.x), y: Math.round(o.y),
    vx: Math.round(o.vx * 10) / 10, vy: Math.round(o.vy * 10) / 10,
    r: Math.round(o._rot * 10) / 10,
    p: o._phase === 'out' ? 1 : o._phase === 'return' ? 2 : 0,
  }));
}