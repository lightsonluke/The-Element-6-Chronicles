// Battle Royale arena — a MASSIVE multi-tier map built on the existing
// platform/physics system. Reuses the same platform shape the fighter
// engine already collides with, so movement & combat feel identical to the
// normal fighting modes. Way wider and taller than before so up to 50
// fighters can spread out, loot, and hunt each other down across Split City.

// Horizontal scale factor — every platform is doubled in length so the arena
// is WAY bigger and supports up to 50 fighters.
const SCALE_X = 2;

export const BR_W = 12000 * SCALE_X; // 24000
export const BR_H = 8000;

// Raw platform definitions (x,y,w,h) at the original 12000-wide scale; the
// exported BR_PLATFORMS below scales x and w by SCALE_X so platforms are
// twice as long and spread across the full 24000-wide arena.
const RAW_PLATFORMS = [
  // Ground — full width
  { x: 0, y: 7800, w: 12000, h: 200 },
  // Lower pits / side ledges
  { x: 1125, y: 7300, w: 975, h: 40 },
  { x: 9900, y: 7300, w: 975, h: 40 },
  { x: 4125, y: 7400, w: 1125, h: 40 },
  { x: 6750, y: 7400, w: 1125, h: 40 },
  // Intermediate ground-level steps
  { x: 2625, y: 7350, w: 750, h: 40 },
  { x: 8625, y: 7350, w: 750, h: 40 },
  { x: 5250, y: 7450, w: 750, h: 40 },
  // ── Between lower pits (7300) and mid tier (6600) ──
  { x: 2250, y: 6950, w: 1000, h: 40 },
  { x: 8750, y: 6950, w: 1000, h: 40 },
  { x: 3750, y: 7000, w: 1000, h: 40 },
  { x: 7250, y: 7000, w: 1000, h: 40 },
  { x: 5500, y: 6950, w: 1000, h: 40 },
  // Mid tier
  { x: 562, y: 6600, w: 1687, h: 40 },
  { x: 9750, y: 6600, w: 1687, h: 40 },
  { x: 4687, y: 6500, w: 2625, h: 40 },
  // ── Between mid tier (6600) and floating connectors (5900) ──
  { x: 1500, y: 6150, w: 900, h: 40 },
  { x: 9600, y: 6150, w: 900, h: 40 },
  { x: 3750, y: 6200, w: 900, h: 40 },
  { x: 7350, y: 6200, w: 900, h: 40 },
  { x: 5500, y: 6100, w: 1000, h: 40 },
  // Floating connectors
  { x: 2812, y: 5900, w: 1125, h: 40 },
  { x: 8062, y: 5900, w: 1125, h: 40 },
  { x: 5437, y: 5600, w: 1125, h: 40 },
  // ── Between floating connectors (5600) and high tier (5200) ──
  { x: 750, y: 5400, w: 800, h: 40 },
  { x: 10450, y: 5400, w: 800, h: 40 },
  { x: 3000, y: 5350, w: 900, h: 40 },
  { x: 8100, y: 5350, w: 900, h: 40 },
  { x: 5500, y: 5300, w: 900, h: 40 },
  // High tier
  { x: 1312, y: 5200, w: 1875, h: 40 },
  { x: 8812, y: 5200, w: 1875, h: 40 },
  { x: 5062, y: 4800, w: 1875, h: 40 },
  // ── Between high tier (4800) and upper traversals (4100) ──
  { x: 1500, y: 4500, w: 900, h: 40 },
  { x: 9600, y: 4500, w: 900, h: 40 },
  { x: 3750, y: 4450, w: 900, h: 40 },
  { x: 7350, y: 4450, w: 900, h: 40 },
  { x: 5500, y: 4400, w: 900, h: 40 },
  { x: 2250, y: 4600, w: 800, h: 40 },
  { x: 8950, y: 4600, w: 800, h: 40 },
  // Upper traversals
  { x: 3562, y: 4100, w: 1312, h: 40 },
  { x: 7125, y: 4100, w: 1312, h: 40 },
  { x: 5250, y: 3700, w: 1500, h: 40 },
  // ── Between upper traversals (3700) and top perches (3000) ──
  { x: 750, y: 3500, w: 800, h: 40 },
  { x: 10450, y: 3500, w: 800, h: 40 },
  { x: 2250, y: 3400, w: 900, h: 40 },
  { x: 8850, y: 3400, w: 900, h: 40 },
  { x: 5500, y: 3350, w: 900, h: 40 },
  // Top perches
  { x: 1875, y: 3000, w: 1312, h: 40 },
  { x: 8812, y: 3000, w: 1312, h: 40 },
  { x: 5062, y: 2500, w: 1875, h: 40 },
  // ── Between top perches (2500) and upper top (1700) ──
  { x: 2250, y: 2100, w: 800, h: 40 },
  { x: 8950, y: 2100, w: 800, h: 40 },
  { x: 5500, y: 2050, w: 900, h: 40 },
  { x: 3750, y: 2200, w: 800, h: 40 },
  { x: 7450, y: 2200, w: 800, h: 40 },
  // Upper top
  { x: 3375, y: 1700, w: 1125, h: 40 },
  { x: 7500, y: 1700, w: 1125, h: 40 },
  // ── Between upper top (1700) and very top (1100) ──
  { x: 2250, y: 1400, w: 700, h: 40 },
  { x: 9050, y: 1400, w: 700, h: 40 },
  { x: 4200, y: 1450, w: 700, h: 40 },
  { x: 7100, y: 1450, w: 700, h: 40 },
  // Very top
  { x: 5437, y: 1100, w: 1125, h: 40 },
  { x: 4200, y: 800, w: 700, h: 40 },
  { x: 7100, y: 800, w: 700, h: 40 },
  // ── 20 MORE filler platforms across remaining big gaps ──
  { x: 3500, y: 7550, w: 700, h: 40 },
  { x: 7800, y: 7550, w: 700, h: 40 },
  { x: 600, y: 6300, w: 800, h: 40 },
  { x: 10600, y: 6300, w: 800, h: 40 },
  { x: 6000, y: 6300, w: 900, h: 40 },
  { x: 2250, y: 5000, w: 800, h: 40 },
  { x: 8950, y: 5000, w: 800, h: 40 },
  { x: 6000, y: 5000, w: 800, h: 40 },
  { x: 1500, y: 3900, w: 800, h: 40 },
  { x: 9700, y: 3900, w: 800, h: 40 },
  { x: 6000, y: 3900, w: 800, h: 40 },
  { x: 750, y: 2750, w: 800, h: 40 },
  { x: 10450, y: 2750, w: 800, h: 40 },
  { x: 3750, y: 2750, w: 800, h: 40 },
  { x: 7450, y: 2750, w: 800, h: 40 },
  { x: 6000, y: 2750, w: 900, h: 40 },
  { x: 2250, y: 1900, w: 700, h: 40 },
  { x: 9050, y: 1900, w: 700, h: 40 },
  { x: 6000, y: 1850, w: 800, h: 40 },
  { x: 3000, y: 550, w: 700, h: 40 },
  { x: 8300, y: 550, w: 700, h: 40 },
];

// Platforms scaled to the doubled arena width.
export const BR_PLATFORMS = RAW_PLATFORMS.map(p => ({
  ...p,
  x: p.x * SCALE_X,
  w: p.w * SCALE_X,
}));

// Raw spawn points at the original 12000-wide scale (30 base + 20 extra = 50).
const RAW_SPAWNS = [
  { x: 750, y: 6400, facing: 1 },
  { x: 11250, y: 6400, facing: -1 },
  { x: 5812, y: 6300, facing: 1 },
  { x: 1687, y: 5000, facing: 1 },
  { x: 10312, y: 5000, facing: -1 },
  { x: 6000, y: 4600, facing: 1 },
  { x: 3937, y: 5700, facing: 1 },
  { x: 8062, y: 5700, facing: -1 },
  { x: 3000, y: 7200, facing: 1 },
  { x: 9000, y: 7200, facing: -1 },
  { x: 6000, y: 2300, facing: 1 },
  { x: 4687, y: 7200, facing: 1 },
  { x: 2250, y: 6400, facing: 1 },
  { x: 9750, y: 6400, facing: -1 },
  { x: 1500, y: 7200, facing: 1 },
  { x: 10500, y: 7200, facing: -1 },
  { x: 3750, y: 5700, facing: 1 },
  { x: 8250, y: 5700, facing: -1 },
  { x: 6000, y: 3700, facing: 1 },
  { x: 5250, y: 7200, facing: 1 },
  { x: 600, y: 6400, facing: 1 },
  { x: 11400, y: 6400, facing: -1 },
  { x: 4500, y: 4600, facing: 1 },
  { x: 7500, y: 4600, facing: -1 },
  { x: 1200, y: 2900, facing: 1 },
  { x: 10800, y: 2900, facing: -1 },
  { x: 6000, y: 900, facing: 1 },
  { x: 3000, y: 6900, facing: 1 },
  { x: 9000, y: 6900, facing: -1 },
  { x: 6000, y: 5200, facing: 1 },
  // ── 20 more spawns to support up to 50 fighters ──
  { x: 1875, y: 3000, facing: 1 },
  { x: 10125, y: 3000, facing: -1 },
  { x: 5062, y: 2500, facing: 1 },
  { x: 3375, y: 1700, facing: 1 },
  { x: 8625, y: 1700, facing: -1 },
  { x: 5437, y: 1100, facing: 1 },
  { x: 4200, y: 800, facing: 1 },
  { x: 7100, y: 800, facing: -1 },
  { x: 562, y: 6600, facing: 1 },
  { x: 11437, y: 6600, facing: -1 },
  { x: 4687, y: 6500, facing: 1 },
  { x: 2812, y: 5900, facing: 1 },
  { x: 9187, y: 5900, facing: -1 },
  { x: 1312, y: 5200, facing: 1 },
  { x: 10687, y: 5200, facing: -1 },
  { x: 3562, y: 4100, facing: 1 },
  { x: 8437, y: 4100, facing: -1 },
  { x: 5250, y: 3700, facing: 1 },
  { x: 750, y: 5400, facing: 1 },
  { x: 11250, y: 5400, facing: -1 },
];

// Spawn points spread around the arena so players never start beside each other.
export const BR_SPAWNS = RAW_SPAWNS.map(s => ({ ...s, x: s.x * SCALE_X }));

// Shrinking zone — TWO WALLS crushing inward from the left and right edges
// until the safe area is gone. The walls crush VERY slowly and automatically
// (not configurable). damagePerSec applied outside the safe area (left of
// leftX or right of rightX).
export const BR_ZONE = {
  leftStart: 0,
  rightStart: BR_W,            // 24000
  leftEnd: BR_W / 2,           // 12000 — walls meet at center, zone closes completely
  rightEnd: BR_W / 2,          // 12000
  crushDuration: 420,          // 7 minutes — slower crush for the bigger arena
  damagePerSec: 12.5,          // 2.5x the original 5 — zone is much deadlier
};

// Loot / power-up pickups. Temporary buffs — characters & abilities stay primary.
export const BR_LOOT_TYPES = [
  { type: 'heal', color: '#44FF66', label: 'HEAL', desc: '+60 HP' },
  { type: 'speed', color: '#44CCFF', label: 'SPEED', desc: '+Speed 10s' },
  { type: 'damage', color: '#FF6644', label: 'POWER', desc: '+Damage 10s' },
  { type: 'shield', color: '#FFDD44', label: 'SHIELD', desc: '50% resist 10s' },
  { type: 'super', color: '#CC66FF', label: 'SUPER', desc: 'Max super meter' },
];

// Fixed loot spawn spots on platforms (spread across the arena) — scaled to
// the doubled width. Extra spots added so the bigger arena stays well-stocked.
const RAW_LOOT_SPOTS = [
  { x: 1406, y: 6510, type: 'heal' },
  { x: 10593, y: 6510, type: 'shield' },
  { x: 6000, y: 6410, type: 'damage' },
  { x: 2062, y: 5060, type: 'speed' },
  { x: 9937, y: 5060, type: 'super' },
  { x: 6000, y: 4710, type: 'heal' },
  { x: 3375, y: 5810, type: 'damage' },
  { x: 8625, y: 5810, type: 'speed' },
  { x: 2531, y: 7210, type: 'shield' },
  { x: 9468, y: 7210, type: 'heal' },
  { x: 4218, y: 4010, type: 'damage' },
  { x: 7781, y: 4010, type: 'speed' },
  { x: 5812, y: 3610, type: 'super' },
  { x: 2531, y: 2910, type: 'shield' },
  { x: 9468, y: 2910, type: 'heal' },
  { x: 5812, y: 2410, type: 'damage' },
  { x: 3937, y: 1610, type: 'speed' },
  { x: 8062, y: 1610, type: 'shield' },
  { x: 6000, y: 1010, type: 'super' },
  { x: 4875, y: 7210, type: 'heal' },
  // Extra loot spread across the doubled-width arena
  { x: 1500, y: 7210, type: 'speed' },
  { x: 10500, y: 7210, type: 'damage' },
  { x: 3000, y: 5310, type: 'heal' },
  { x: 9000, y: 5310, type: 'shield' },
  { x: 4500, y: 4110, type: 'super' },
  { x: 7500, y: 4110, type: 'heal' },
  { x: 1875, y: 2910, type: 'damage' },
  { x: 10125, y: 2910, type: 'speed' },
  { x: 5062, y: 2410, type: 'shield' },
  { x: 3375, y: 1610, type: 'heal' },
  { x: 8625, y: 1610, type: 'super' },
];

export const BR_LOOT_SPOTS = RAW_LOOT_SPOTS.map(s => ({ ...s, x: s.x * SCALE_X }));

// Rare loot: only ~38% of spots actually spawn loot each match (random).
// Host builds the authoritative loot list; guests render from broadcast state.
// Adjust a placement so it sits on top of a platform instead of inside it.
// If the rect (cx-w/2 .. cx+w/2, y .. y+h) overlaps a platform body, y is
// snapped to p.y - h so the entity rests on the surface.
export function resolvePlacement(x, y, w, h, platforms = BR_PLATFORMS) {
  for (const p of platforms) {
    if (p._deleted) continue;
    const left = x - w / 2, right = x + w / 2, bottom = y + h;
    if (right > p.x && left < p.x + p.w && bottom > p.y && y < p.y + p.h) {
      return { x, y: p.y - h };
    }
  }
  return { x, y };
}

export function buildInitialLoot() {
  return BR_LOOT_SPOTS
    .map((s, i) => {
      const adj = resolvePlacement(s.x, s.y, 24, 24);
      return { id: i, x: adj.x, y: adj.y, type: s.type, taken: false };
    })
    .filter(() => Math.random() < 0.72);
}

export function applyLootToFighter(f, type) {
  switch (type) {
    case 'heal': f.damage = Math.max(0, (f.damage || 0) - 50); break;
    case 'speed': f.speedBoost = 1.5; f.powerTimer = Math.max(f.powerTimer || 0, 600); f.powerActive = f.powerActive || 'stat_boost'; break;
    case 'damage': f.damageBoost = 1.6; f.powerTimer = Math.max(f.powerTimer || 0, 600); f.powerActive = f.powerActive || 'stat_boost'; break;
    case 'shield': f.shieldAmount = 0.5; f.powerTimer = Math.max(f.powerTimer || 0, 600); f.powerActive = f.powerActive || 'shield'; break;
    case 'super': f.superMeter = f.maxSuper || 100; break;
  }
}