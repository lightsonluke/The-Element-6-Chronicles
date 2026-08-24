// brHazards.js — Battle Royale ONLY: environmental hazards.
// Falling rocks, water, fire zones (slowly spreading), electrified areas,
// and moving hazards. Each behaves differently and can be used strategically
// via knockback to push opponents into danger.

import { BR_PLATFORMS, BR_W, BR_H, resolvePlacement } from './battleRoyaleMap.js';

const GRAVITY = 0.42;

// Build all hazard systems at match start.
export function buildHazards() {
  const hazards = {
    rocks: [],       // falling rock spawners + active falling rocks
    water: [],       // water pools
    fire: [],        // fire zones (spread slowly)
    electric: [],    // electrified areas
    moving: [],      // moving hazards along paths
  };

  // ── Falling rock zones — areas where rocks periodically fall ──
  const rockZones = [
    { x: 2000, w: 1500, y: 0, interval: 360, timer: 120 },
    { x: 6000, w: 2000, y: 0, interval: 420, timer: 200 },
    { x: 11000, w: 1500, y: 0, interval: 360, timer: 60 },
    { x: 16000, w: 2000, y: 0, interval: 420, timer: 280 },
    { x: 20000, w: 1500, y: 0, interval: 360, timer: 140 },
  ];
  for (const z of rockZones) {
    hazards.rocks.push({ ...z, activeRocks: [] });
  }

  // ── Water pools — slow movement, affect physics ──
  const waterPools = [
    { x: 3500, y: 7700, w: 1200, h: 100 },
    { x: 9000, y: 7700, w: 1000, h: 100 },
    { x: 15000, y: 7700, w: 1200, h: 100 },
    { x: 19000, y: 7700, w: 1000, h: 100 },
  ];
  for (const w of waterPools) {
    const adj = resolvePlacement(w.x + w.w / 2, w.y, w.w, w.h);
    hazards.water.push({ ...w, y: adj.y });
  }

  // ── Fire zones — deal damage, spread VERY slowly ──
  const fireZones = [
    { x: 2500, y: 7300, w: 300, h: 40, spreadTimer: 0, maxSpread: 3, spreadRadius: 150 },
    { x: 8000, y: 6600, w: 300, h: 40, spreadTimer: 0, maxSpread: 3, spreadRadius: 150 },
    { x: 13000, y: 7300, w: 300, h: 40, spreadTimer: 0, maxSpread: 3, spreadRadius: 150 },
    { x: 18000, y: 6600, w: 300, h: 40, spreadTimer: 0, maxSpread: 3, spreadRadius: 150 },
    { x: 10000, y: 5900, w: 250, h: 40, spreadTimer: 0, maxSpread: 2, spreadRadius: 120 },
    { x: 16000, y: 5200, w: 250, h: 40, spreadTimer: 0, maxSpread: 2, spreadRadius: 120 },
  ];
  for (const f of fireZones) {
    const adj = resolvePlacement(f.x + f.w / 2, f.y, f.w, f.h);
    hazards.fire.push({ ...f, y: adj.y, originalX: f.x, originalW: f.w });
  }

  // ── Electrified areas — damage + stun ──
  const electricZones = [
    { x: 4500, y: 6600, w: 400, h: 40, damage: 0.8, stun: 10 },
    { x: 14000, y: 6600, w: 400, h: 40, damage: 0.8, stun: 10 },
    { x: 7000, y: 5200, w: 350, h: 40, damage: 0.8, stun: 10 },
    { x: 17000, y: 4100, w: 350, h: 40, damage: 0.8, stun: 10 },
  ];
  for (const e of electricZones) {
    const adj = resolvePlacement(e.x + e.w / 2, e.y, e.w, e.h);
    hazards.electric.push({ ...e, y: adj.y, pulseTimer: 0 });
  }

  // ── Moving hazards — travel along paths, damage on contact ──
  const movingDefs = [
    { x: 3000, y: 6200, w: 60, h: 60, vx: 3, range: 2000, dir: 1, type: 'saw' },
    { x: 9000, y: 5400, w: 60, h: 60, vx: -3, range: 2000, dir: -1, type: 'saw' },
    { x: 15000, y: 4600, w: 60, h: 60, vx: 3, range: 2000, dir: 1, type: 'saw' },
    { x: 6000, y: 3400, w: 60, h: 60, vx: -3, range: 1800, dir: -1, type: 'spike' },
    { x: 18000, y: 3000, w: 60, h: 60, vx: 3, range: 1800, dir: 1, type: 'spike' },
  ];
  for (const m of movingDefs) {
    const adj = resolvePlacement(m.x + m.w / 2, m.y, m.w, m.h);
    hazards.moving.push({ ...m, y: adj.y, startX: m.x, damage: 1.5, knockback: 10 });
  }

  return hazards;
}

// Update all hazards each frame. Returns nothing; mutates hazards in place.
export function updateHazards(hazards, fighters, dt, matchTime) {
  // ── Falling rocks ──
  for (const zone of hazards.rocks) {
    zone.timer--;
    if (zone.timer <= 0) {
      zone.timer = zone.interval + Math.floor(Math.random() * 120);
      // Spawn 1-2 rocks at random x within the zone
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const rx = zone.x + Math.random() * zone.w;
        zone.activeRocks.push({
          x: rx, y: zone.y, vy: 0, warning: 60, size: 24 + Math.random() * 16,
          landed: false, life: 600,
        });
      }
    }
    // Update active rocks
    for (const r of zone.activeRocks) {
      if (r.warning > 0) {
        r.warning--;
        // Warning phase — show shadow at landing spot, rock is still up high
        r.y = -50;
      } else {
        // Falling phase
        r.vy += GRAVITY * 2;
        r.y += r.vy;
      }
      r.life--;
      // Check fighter hits (only after warning)
      if (r.warning <= 0) {
        for (const f of fighters) {
          if (f._eliminated || f.stocks <= 0) continue;
          if (f.invincible > 0) continue;
          if (Math.abs(f.x - r.x) < r.size + 20 && Math.abs((f.y - 30) - r.y) < r.size + 30) {
            f.damage += 15;
            f.hitstun = 20;
            f.state = 'hitstun';
            f.vy = -8;
            f.vx = Math.sign(f.x - r.x) * 10 || 8;
            f.grounded = false;
            r.landed = true; // rock breaks on impact
          }
        }
        // Rock lands on a platform
        for (const p of BR_PLATFORMS) {
          if (p._deleted) continue;
          if (r.x > p.x && r.x < p.x + p.w && r.y >= p.y - r.size && r.y < p.y + p.h) {
            r.landed = true;
            r.y = p.y;
          }
        }
      }
    }
    zone.activeRocks = zone.activeRocks.filter(r => !r.landed && r.life > 0 && r.y < BR_H + 200);
  }

  // ── Water — slow movement, no damage but affects physics ──
  for (const w of hazards.water) {
    for (const f of fighters) {
      if (f._eliminated || f.stocks <= 0) continue;
      const inWater = f.x > w.x && f.x < w.x + w.w && f.y > w.y - 20 && f.y < w.y + w.h;
      if (inWater) {
        f.vx *= 0.85; // water resistance
        f.vy *= 0.7;
        f._inWater = true;
        // Slow fall in water
        if (f.vy > 3) f.vy = 3;
      }
    }
  }

  // ── Fire — damage + VERY slow spreading ──
  for (const f of hazards.fire) {
    // Damage fighters in fire
    for (const fighter of fighters) {
      if (fighter._eliminated || fighter.stocks <= 0) continue;
      if (fighter.invincible > 0) continue;
      const inFire = fighter.x > f.x && fighter.x < f.x + f.w &&
                     Math.abs(fighter.y - f.y) < 50;
      if (inFire && fighter.grounded) {
        fighter.damage += 0.8; // damage per frame while in fire
        fighter.hitstun = Math.max(fighter.hitstun, 5);
      }
    }
    // Spread VERY slowly — every ~20 seconds, spread to one nearby platform
    f.spreadTimer--;
    if (f.spreadTimer <= 0 && f.maxSpread > 0) {
      f.spreadTimer = 1200; // 20 seconds at 60fps — VERY slow
      // Find a nearby platform to spread to
      let best = null, bd = f.spreadRadius;
      for (const p of BR_PLATFORMS) {
        if (p._deleted) continue;
        if (p.y >= 7700) continue; // don't spread to ground
        // Check not already on fire
        const alreadyFire = hazards.fire.some(ff => Math.abs(ff.x - p.x) < 20 && Math.abs(ff.y - p.y) < 20);
        if (alreadyFire) continue;
        const dx = Math.abs((p.x + p.w / 2) - (f.x + f.w / 2));
        const dy = Math.abs(p.y - f.y);
        if (dx < bd && dy < 120 && dy > 10) {
          bd = dx;
          best = p;
        }
      }
      if (best) {
        const fx = best.x + best.w * 0.3;
        const fy = best.y - 40; // sit on top of the platform
        hazards.fire.push({
          x: fx, y: fy, w: 200, h: 40,
          spreadTimer: 0, maxSpread: f.maxSpread - 1, spreadRadius: f.spreadRadius,
          originalX: fx, originalW: 200,
        });
        f.maxSpread--;
      }
    }
  }

  // ── Electric — damage + stun, pulses ──
  for (const e of hazards.electric) {
    e.pulseTimer = (e.pulseTimer + 1) % 120;
    const active = e.pulseTimer < 60; // active half the time
    if (!active) continue;
    for (const f of fighters) {
      if (f._eliminated || f.stocks <= 0) continue;
      if (f.invincible > 0) continue;
      const inElectric = f.x > e.x && f.x < e.x + e.w &&
                         Math.abs(f.y - e.y) < 50;
      if (inElectric && f.grounded) {
        f.damage += e.damage;
        f.hitstun = Math.max(f.hitstun || 0, e.stun);
        f.vx *= 0.5; // electric slows movement
      }
    }
  }

  // ── Moving hazards — travel along paths, damage on contact ──
  for (const m of hazards.moving) {
    m.x += m.vx;
    if (m.x > m.startX + m.range || m.x < m.startX) {
      m.vx *= -1;
      m.dir *= -1;
    }
    for (const f of fighters) {
      if (f._eliminated || f.stocks <= 0) continue;
      if (f.invincible > 0) continue;
      const hit = Math.abs(f.x - m.x) < m.w / 2 + 25 && Math.abs((f.y - 30) - m.y) < m.h / 2 + 30;
      if (hit) {
        f.damage += m.damage;
        f.hitstun = 18;
        f.state = 'hitstun';
        f.vy = -10;
        f.vx = m.dir * m.knockback;
        f.grounded = false;
      }
    }
  }
}

// Check if a position is in a hazard (for bot AI).
export function isPositionInHazard(hazards, x, y) {
  // Fire
  for (const f of hazards.fire) {
    if (x > f.x && x < f.x + f.w && Math.abs(y - f.y) < 50) return { type: 'fire', hazard: f };
  }
  // Electric
  for (const e of hazards.electric) {
    if (e.pulseTimer < 60 && x > e.x && x < e.x + e.w && Math.abs(y - e.y) < 50) return { type: 'electric', hazard: e };
  }
  // Water
  for (const w of hazards.water) {
    if (x > w.x && x < w.x + w.w && y > w.y - 20 && y < w.y + w.h) return { type: 'water', hazard: w };
  }
  // Moving
  for (const m of hazards.moving) {
    if (Math.abs(x - m.x) < m.w / 2 + 25 && Math.abs((y - 30) - m.y) < m.h / 2 + 30) return { type: 'moving', hazard: m };
  }
  return null;
}

// Check if a falling rock is about to land near a position (for bot AI).
export function rockLandingNear(hazards, x, y, warnFrames = 60) {
  for (const zone of hazards.rocks) {
    for (const r of zone.activeRocks) {
      if (r.warning > 0 && r.warning <= warnFrames && Math.abs(r.x - x) < r.size + 60) {
        return r;
      }
    }
  }
  return null;
}

// Find the nearest hazard to a target position (for bot AI — knock enemy into it).
export function nearestHazardToTarget(hazards, tx, ty, maxDist = 400) {
  let best = null, bd = maxDist;
  for (const f of hazards.fire) {
    const cx = f.x + f.w / 2;
    const d = Math.abs(cx - tx) + Math.abs(f.y - ty) * 0.5;
    if (d < bd) { bd = d; best = { type: 'fire', x: cx, y: f.y, hazard: f }; }
  }
  for (const e of hazards.electric) {
    if (e.pulseTimer >= 60) continue;
    const cx = e.x + e.w / 2;
    const d = Math.abs(cx - tx) + Math.abs(e.y - ty) * 0.5;
    if (d < bd) { bd = d; best = { type: 'electric', x: cx, y: e.y, hazard: e }; }
  }
  for (const m of hazards.moving) {
    const d = Math.abs(m.x - tx) + Math.abs(m.y - ty) * 0.5;
    if (d < bd) { bd = d; best = { type: 'moving', x: m.x, y: m.y, hazard: m }; }
  }
  return best;
}

// Serialize hazards for network sync.
export function serializeHazards(hazards) {
  return {
    rocks: hazards.rocks.flatMap(z => z.activeRocks.map(r => ({
      x: Math.round(r.x), y: Math.round(r.y), w: r.warning, s: Math.round(r.size),
    }))),
    fire: hazards.fire.map(f => ({ x: Math.round(f.x), y: Math.round(f.y), w: Math.round(f.w) })),
    electric: hazards.electric.map(e => ({ x: Math.round(e.x), y: Math.round(e.y), w: Math.round(e.w), p: e.pulseTimer })),
    moving: hazards.moving.map(m => ({ x: Math.round(m.x), y: Math.round(m.y), t: m.type })),
    water: hazards.water.map(w => ({ x: Math.round(w.x), y: Math.round(w.y), w: Math.round(w.w) })),
  };
}