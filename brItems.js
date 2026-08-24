// brItems.js — Battle Royale ONLY: movement items (Launch Pads & Air-Dash Pads).
// These are environmental traversal tools placed on platforms across the arena.
// Launch Pads: bounce a player upward+forward for escape/chase/recovery.
// Air-Dash Pads: launch the player in the direction they approached from.

import { BR_PLATFORMS, BR_W } from './battleRoyaleMap.js';

// Build movement items at fixed positions on platforms across the arena.
export function buildMovementItems() {
  const items = [];
  // Launch Pads — placed on mid-tier platforms spread across the arena
  const launchSpots = [
    { pi: 14, off: 0.3 }, { pi: 15, off: 0.7 }, { pi: 20, off: 0.5 },
    { pi: 25, off: 0.3 }, { pi: 26, off: 0.7 }, { pi: 30, off: 0.5 },
    { pi: 35, off: 0.3 }, { pi: 36, off: 0.7 }, { pi: 40, off: 0.5 },
    { pi: 45, off: 0.3 }, { pi: 50, off: 0.7 }, { pi: 55, off: 0.5 },
    { pi: 60, off: 0.3 }, { pi: 65, off: 0.7 },
  ];
  for (const spot of launchSpots) {
    const p = BR_PLATFORMS[spot.pi];
    if (!p) continue;
    items.push({
      type: 'launch_pad',
      x: p.x + p.w * spot.off,
      y: p.y - 8,
      w: 50, h: 12,
      cooldown: 0,
      _activatedBy: null,
      _activateTimer: 0,
    });
  }
  // Air-Dash Pads — placed on platforms, often near gaps
  const dashSpots = [
    { pi: 16, off: 0.2 }, { pi: 16, off: 0.8 }, { pi: 22, off: 0.5 },
    { pi: 28, off: 0.2 }, { pi: 28, off: 0.8 }, { pi: 33, off: 0.5 },
    { pi: 38, off: 0.2 }, { pi: 38, off: 0.8 }, { pi: 43, off: 0.5 },
    { pi: 48, off: 0.2 }, { pi: 48, off: 0.8 }, { pi: 53, off: 0.5 },
    { pi: 58, off: 0.2 }, { pi: 58, off: 0.8 },
  ];
  for (const spot of dashSpots) {
    const p = BR_PLATFORMS[spot.pi];
    if (!p) continue;
    items.push({
      type: 'air_dash_pad',
      x: p.x + p.w * spot.off,
      y: p.y - 8,
      w: 50, h: 12,
      cooldown: 0,
      _activatedBy: null,
      _activateTimer: 0,
      _lastApproachDir: 0,
    });
  }
  return items;
}

// Update movement items each frame. Checks fighter contact and applies launches.
export function updateMovementItems(items, fighters, dt) {
  for (const item of items) {
    if (item.cooldown > 0) item.cooldown--;
    if (item._activateTimer > 0) item._activateTimer--;

    for (const f of fighters) {
      if (f._eliminated || f.stocks <= 0) continue;
      if (!f.grounded) continue;
      const dx = f.x - item.x;
      const dy = f.y - (item.y + item.h);
      if (Math.abs(dx) < item.w / 2 + 20 && Math.abs(dy) < 14) {
        // Fighter is on the pad
        if (item.cooldown > 0) continue;

        if (item.type === 'launch_pad') {
          // Launch upward + in the direction the fighter is facing/moving
          const dir = f.vx !== 0 ? Math.sign(f.vx) : (f.facing || 1);
          f.vy = -22; // strong upward launch
          f.vx = dir * 14;
          f.grounded = false;
          f.jumps = f.maxJumps; // give jumps back so they can recover after
          item.cooldown = 40;
          item._activatedBy = f.playerIndex;
          item._activateTimer = 20;
        } else if (item.type === 'air_dash_pad') {
          // Launch in the direction of approach (opposite of current facing
          // since they walked onto it from that side)
          let dir;
          if (Math.abs(f.vx) > 0.5) {
            dir = Math.sign(f.vx); // moving direction
          } else {
            // Standing still — use facing as approach direction
            dir = f.facing || 1;
          }
          f.vx = dir * 20;
          f.vy = -10;
          f.grounded = false;
          f.jumps = f.maxJumps;
          item.cooldown = 40;
          item._activatedBy = f.playerIndex;
          item._activateTimer = 20;
          item._lastApproachDir = dir;
        }
      }
    }
  }
}

// Serialize items for network sync.
export function serializeItems(items) {
  return items.map(it => ({
    t: it.type === 'launch_pad' ? 0 : 1,
    x: Math.round(it.x), y: Math.round(it.y),
    cd: it.cooldown, at: it._activateTimer,
  }));
}

// Check if a position is on a movement item (for bot AI).
export function itemAt(items, x, y) {
  for (const it of items) {
    if (Math.abs(x - it.x) < it.w / 2 + 20 && Math.abs(y - (it.y + it.h)) < 14) return it;
  }
  return null;
}

// Find the nearest useful launch pad for a given purpose (escape/chase/recover).
export function nearestLaunchPad(items, x, y, maxDist = 600) {
  let best = null, bd = maxDist;
  for (const it of items) {
    if (it.type !== 'launch_pad' || it.cooldown > 0) continue;
    const d = Math.abs(it.x - x) + Math.abs(it.y - y) * 0.5;
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

// Find the nearest air-dash pad and the direction it would launch the bot.
export function nearestDashPad(items, x, y, approachDir, maxDist = 500) {
  let best = null, bd = maxDist;
  for (const it of items) {
    if (it.type !== 'air_dash_pad' || it.cooldown > 0) continue;
    const d = Math.abs(it.x - x) + Math.abs(it.y - y) * 0.5;
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}