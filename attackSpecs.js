// Description-driven attack specifications for the documented Generation I-V roster.
// The character data is the source of truth; this module turns its hitbox/knockback
// metadata into concrete, frame-by-frame collision geometry.

import { OLD_GEN_CHARS } from './eras.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { DOWN_HEAVIES } from './downHeavies.js';


// Generation I overhaul: the collision geometry is authored from the move
// descriptions rather than the old generic rectangles.  Each entry describes
// only the visible attack shape that should be hittable.
const GEN1_MOVE_SPECS = {
  g1_thunder: {
    us:{name:'Lightning Circle',shape:'orbitPoint',range:92,knockback:'upContact',duration:28,damage:16,description:'A single dot follows the moving beginning of a lightning circle above the hero.'},
    upHeavy:{name:'Rising Lightning Trio',shape:'threeBolts',range:190,knockback:'upContact',duration:24,damage:23},
    ds:{name:'Lightning Dome',shape:'smallDome',range:58,knockback:'radialContact',duration:22,damage:17,description:'Two charged hands form a compact lightning dome.'},
    ss:{name:'Lightning Bolt',shape:'forwardBolt',range:82,knockback:'forwardContact',duration:14,damage:15,description:'A short zigzag lightning bolt travels forward.'},
    sh:{name:'Large Lightning Bolt',shape:'forwardBoltHeavy',range:105,knockback:'forwardContact',duration:18,damage:23,description:'A larger zigzag lightning bolt travels forward.'},
    dh:{name:'Orbiting Lightning Ball',shape:'orbitBall',range:100,knockback:'forwardContact',duration:24,damage:22,description:'Only the current position of the orbiting lightning ball is active.'},
    super:{name:'Thunder Strike',shape:'bottomBolt',range:90,knockback:'radialUp',duration:42,damage:38,description:'A giant bolt falls onto the hero X coordinate; only its bottom section hits.'},
  },
  g1_fire: {
    us:{name:'Flaming Hook',shape:'hook',range:88,knockback:'upContact',duration:20,damage:16},
    upHeavy:{name:'Spinning Fire Wheel',shape:'fireWheel',range:120,knockback:'upContact',duration:24,damage:24},
    ds:{name:'Ember Stamp',shape:'stampFlames',range:52,knockback:'radialContact',duration:18,damage:15},
    ss:{name:'Flaming Elbow',shape:'elbow',range:62,knockback:'forwardContact',duration:14,damage:15},
    sh:{name:'Flaming Gauntlet',shape:'gauntlet',range:105,knockback:'forwardContact',duration:20,damage:24},
    dh:{name:'Burning Cracks',shape:'cracks',range:120,knockback:'radialContact',duration:26,damage:21},
    super:{name:'Fireball Detonation',shape:'explosion',range:150,knockback:'radialContact',duration:42,damage:40},
  },
  g1_water: {
    us:{name:'Water Ring',shape:'waterRing',range:84,knockback:'velocity',duration:20,damage:15},
    upHeavy:{name:'Spiral Water Ribbon',shape:'waterRibbon',range:145,knockback:'upContact',duration:25,damage:24},
    ds:{name:'Twin Splashes',shape:'twinSplashes',range:70,knockback:'forwardContact',duration:18,damage:16},
    ss:{name:'Water Whip Tip',shape:'whipTip',range:90,knockback:'forwardContact',duration:15,damage:15},
    sh:{name:'Water Crescent',shape:'crescent',range:118,knockback:'forwardContact',duration:22,damage:24},
    dh:{name:'Bouncing Water Sphere',shape:'waterBounce',range:96,knockback:'radialContact',duration:24,damage:21},
    super:{name:'Collapse Ring',shape:'collapseRing',range:150,knockback:'radialContact',duration:42,damage:38},
  },
  g1_grass: {
    us:{name:'Leaf Propeller',shape:'propellerLeaves',range:64,knockback:'up',duration:18,damage:15},
    upHeavy:{name:'Petal Bloom',shape:'flowerPetals',range:120,knockback:'upContact',duration:26,damage:24},
    ds:{name:'Thorn Snap',shape:'thornTips',range:72,knockback:'inward',duration:18,damage:14},
    ss:{name:'Wooden Branch Jab',shape:'branchEnd',range:86,knockback:'forwardContact',duration:14,damage:15},
    sh:{name:'Petal Flower',shape:'flowerPetals',range:105,knockback:'radialContact',duration:24,damage:24},
    dh:{name:'Returning Vine',shape:'vineTwoHits',range:118,knockback:'forwardContact',duration:25,damage:21},
    super:{name:'Flower Snap',shape:'flowerSnap',range:145,knockback:'radialContact',duration:42,damage:39},
  },
  g1_ice: {
    us:{name:'Throwing Ice Shard',shape:'throwingShard',range:105,knockback:'velocity',duration:20,damage:16},
    upHeavy:{name:'Tri-Shard Burst',shape:'shardBurst',range:130,knockback:'velocity',duration:24,damage:24},
    ds:{name:'Shattered Ice Plate',shape:'plateShards',range:88,knockback:'radialContact',duration:22,damage:17},
    ss:{name:'Ice Forearm Blade',shape:'forearmBlade',range:72,knockback:'forwardContact',duration:16,damage:16},
    sh:{name:'Ice Hammer',shape:'hammerArc',range:112,knockback:'forwardContact',duration:24,damage:25},
    dh:{name:'Sliding Ice Block',shape:'iceBlock',range:128,knockback:'forwardContact',duration:24,damage:22},
    super:{name:'Crystal Explosion',shape:'crystalShards',range:155,knockback:'radialContact',duration:42,damage:40},
  },
};

const CHAR_MAP = new Map([
  ...[...OLD_GEN_CHARS, ...HEROES, ...VILLAINS, ...GUARDIANS].map(c => [c.id, c]),
]);

function normalizeProfile(value, fallback = 'forward') {
  const v = String(value || '').toLowerCase();
  return v || fallback;
}

function moveFromKey(char, key) {
  if (!char) return null;
  const k = String(key || '').toLowerCase();
  if (k === 'super' || k === 'sp') return char.superMove || null;
  if (k === 'side' || k === 'sidesignature' || k === 'ss') return char.signatures?.side || null;
  if (k === 'up' || k === 'upsignature' || k === 'us') return char.signatures?.up || null;
  if (k === 'down' || k === 'downsignature' || k === 'ds') return char.signatures?.down || null;
  if (k === 'heavy' || k === 'sideheavy' || k === 'sh') return char.heavyAttack || null;
  if (k === 'downheavy' || k === 'dh') return char.downHeavy || char.down_heavy || DOWN_HEAVIES[char.id] || null;
  return null;
}

function inferKind(data) {
  if (data?.isSuper || data?.sigType === 'super') return 'super';
  if (data?.isHeavy || data?.sigType === 'heavy' || data?.sigType === 'downHeavy') return 'heavy';
  return 'signature';
}

function buildSpec(charId, data, moveKey = '') {
  if (!data) return null;
  const kind = inferKind(data);
  const description = String(data.desc || data.description || '').trim();
  const shape = normalizeProfile(data.hitboxProfile || data.type, 'forward');
  const knockback = normalizeProfile(data.knockbackProfile || data.knockbackType, 'forward');
  return {
    charId,
    kind,
    moveKey,
    name: data.name || moveKey,
    description,
    color: data.color,
    shape,
    knockback,
    range: Number(data.range) || 100,
    duration: Number(data.duration) || (kind === 'super' ? 26 : kind === 'heavy' ? 13 : 10),
    damage: Number(data.damage) || 0,
  };
}

export function getAttackSpec(charId, moveKey) {
  const char = CHAR_MAP.get(charId);
  if (!char) return null;
  const data = moveFromKey(char, moveKey);
  return buildSpec(charId, data, moveKey);
}

export function getAttackSpecForData(charId, attackData) {
  if (!attackData) return null;
  const char = CHAR_MAP.get(charId);
  if (!char && !GEN1_MOVE_SPECS[charId]) return null;

  const rawMove = attackData.sigType;
  const overrideKey = attackData.isSuper ? 'super' : attackData.isHeavy ? (rawMove === 'downHeavy' ? 'dh' : rawMove === 'upHeavy' ? 'upHeavy' : 'sh') : (rawMove === 'up' ? 'us' : rawMove === 'down' || rawMove === 'downNormal' ? 'ds' : rawMove === 'side' || rawMove === 'normal' ? 'ss' : rawMove || 'ss');
  const override = GEN1_MOVE_SPECS[charId]?.[overrideKey];
  if (override) return { charId, kind: attackData.isSuper ? 'super' : attackData.isHeavy ? 'heavy' : 'signature', moveKey: overrideKey, color: attackData.color, ...override };

  // Attack objects created by fighter.js already carry the exact move metadata.
  // Prefer that object so custom names/descriptions and patched data stay intact.
  if (attackData.hitboxProfile || attackData.knockbackProfile || attackData.desc) {
    return buildSpec(charId, attackData, attackData.name || attackData.sigType || 'attack');
  }

  let key = attackData.sigType || '';
  if (attackData.isSuper) key = 'super';
  else if (attackData.isHeavy) key = attackData.sigType === 'downHeavy' ? 'downHeavy' : 'heavy';
  return getAttackSpec(charId, key);
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function activeProgress(fighter) {
  const p = clamp01(fighter?.attackData?.progress ?? 0);
  // A quick active window in the middle of the attack. The visual and collision
  // remain synchronized, while the attack still feels instantaneous.
  return clamp01((p - 0.12) / 0.68);
}

export function getActiveSpecHitboxes(attacker) {
  const data = attacker?.attackData;
  if (!data) return [];
  const spec = data.spec || getAttackSpecForData(attacker.char?.id, data);
  if (!spec) return [];

  const p = activeProgress(attacker);
  if (p <= 0 || p >= 1) return [];

  const f = attacker.facing || 1;
  const x = attacker.x;
  const y = attacker.y - 34;
  const r = Math.max(26, Math.min(90, spec.range * 0.46));
  const reach = Math.max(48, Math.min(170, spec.range));
  const t = p;
  const out = [];

  const addCircle = (cx, cy, cr) => out.push({ shape: 'circle', x: cx, y: cy, r: cr });
  const addBox = (cx, cy, w, h) => out.push({ shape: 'box', x: cx, y: cy, w, h });
  const addCapsule = (x1, y1, x2, y2, cr) => out.push({ shape: 'capsule', x1, y1, x2, y2, r: cr });

  switch (spec.shape) {
    case 'orbitPoint': {
      const a = -Math.PI / 2 + t * Math.PI * 2; const rr = 76;
      addCircle(x + Math.cos(a) * rr, y - 24 + Math.sin(a) * rr * 0.58, 9); break;
    }
    case 'smallDome': {
      const rr = 44; for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; addCircle(x + Math.cos(a) * rr, y - 20 + Math.sin(a) * rr * 0.62, 10); } break;
    }
    case 'forwardBolt':
    case 'forwardBoltHeavy': {
      const len = spec.shape === 'forwardBoltHeavy' ? 100 : 70; const cur = len * (0.35 + t * 0.65);
      addCapsule(x + f * 12, y - 12, x + f * cur, y - 12, spec.shape === 'forwardBoltHeavy' ? 13 : 10); break;
    }
    case 'orbitBall': {
      const a = -Math.PI / 2 + t * Math.PI * 2; const rr = 88; addCircle(x + Math.cos(a) * rr, y - 22 + Math.sin(a) * rr * 0.62, 13); break;
    }
    case 'bottomBolt': {
      addCapsule(x - 9, attacker.y - 72, x + 9, attacker.y - 6, 14); break;
    }
    case 'threeBolts': { for (const dx of [-58,0,58]) addCapsule(x + f * 28 + dx, y + 10, x + f * 28 + dx, y - 160, 10); break; }
    case 'fireWheel': { const rr = 70; for (let i=0;i<12;i++){const a=i/12*Math.PI*2+t*1.2; addCircle(x+Math.cos(a)*rr,y-86+Math.sin(a)*rr,10);} break; }
    case 'waterRibbon': { for(let i=0;i<10;i++){const a=i/10*Math.PI*2+t*1.8; addCircle(x+Math.cos(a)*55,y-65+Math.sin(a)*95,10);} break; }
    case 'shardBurst': { for(let i=0;i<3;i++){const a=-Math.PI/2+i*2*Math.PI/3+t*0.6; addCapsule(x,y-70,x+Math.cos(a)*95,y-70+Math.sin(a)*95,11);} break; }
    case 'hook': {
      const ang = -0.9 + t * 2.1; const rr = 56; addCapsule(x + f * 8, y - 30, x + f * (8 + Math.cos(ang) * rr), y - 30 + Math.sin(ang) * rr, 12); break;
    }
    case 'stampFlames': {
      for (let i = 0; i < 4; i++) addCircle(x + (i - 1.5) * 12, attacker.y - 20 - Math.abs(i - 1.5) * 3, 10); break;
    }
    case 'elbow': { addCapsule(x + f * 8, y - 34, x + f * (30 + t * 32), y - 34, 14); break; }
    case 'gauntlet': { addCapsule(x + f * 12, y - 36, x + f * (30 + t * 76), y - 36, 18); break; }
    case 'cracks': { for (let i = 0; i < 5; i++) { const dx = (i - 2) * 30 * t; addCircle(x + f * dx, attacker.y - 28 - (i % 2) * 5, 12); } break; }
    case 'explosion': { if (t < 0.55) break; addCircle(x + f * 72, y - 38, 68 + (t - 0.55) * 20); break; }
    case 'waterRing': { const a = -Math.PI / 2 + t * Math.PI * 0.9; const rr = 58; addCircle(x + f * 10 + Math.cos(a) * rr, y - 44 + Math.sin(a) * rr, 13); break; }
    case 'twinSplashes': { addCircle(x - 38, y - 38 - 26 * t, 12); addCircle(x + 38, y - 38 - 26 * t, 12); break; }
    case 'whipTip': { addCircle(x + f * (28 + t * 72), y - 38 - Math.sin(t * Math.PI) * 28, 11); break; }
    case 'crescent': { const rr = 82; for (let i = 0; i < 7; i++) { const a = (-0.9 + i * 0.3) * f; addCircle(x + f * 20 + Math.cos(a) * rr, y - 40 + Math.sin(a) * rr, 12); } break; }
    case 'waterBounce': { const bx = x + f * (70 - t * 140); const by = y - 46 + Math.max(0, t - 0.45) * 90; addCircle(bx, by, 22); if (t > 0.65) for (let i = 0; i < 7; i++) addCircle(x + f * (70 - 140 * t) + (i - 3) * 10, y - 45 - (t - 0.65) * 80, 9); break; }
    case 'collapseRing': { if (t < 0.48) break; const rr = 32 + (t - 0.48) / 0.52 * 100; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; addCircle(x + Math.cos(a) * rr, y - 40 + Math.sin(a) * rr * 0.72, 10); } break; }
    case 'propellerLeaves': { const cy = y - 82; for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + t * Math.PI * 2; addCircle(x + Math.cos(a) * 28, cy + Math.sin(a) * 28, 11); } break; }
    case 'thornTips': { addCircle(x - 34 + t * 34, y - 28, 9); addCircle(x + 34 - t * 34, y - 28, 9); break; }
    case 'branchEnd': { addCircle(x + f * (34 + t * 48), y - 40, 13); break; }
    case 'flowerPetals': { const rr = 68; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; addCircle(x + Math.cos(a) * rr, y - 52 + Math.sin(a) * rr * 0.72, 14); } break; }
    case 'vineTwoHits': { const q = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45; const bx = t < 0.55 ? x + f * q * 85 : x + f * (85 - q * 85); addCircle(bx, y - 34 + (t < 0.55 ? q * 45 : (1 - q) * 20), 13); break; }
    case 'flowerSnap': { if (t < 0.42) break; const rr = Math.max(20, 120 - ((t - 0.42) / 0.58) * 105); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; addCircle(x + Math.cos(a) * rr, y - 45 + Math.sin(a) * rr * 0.72, 13); } break; }
    case 'throwingShard': { addCapsule(x + f * 18, y - 76, x + f * (35 + t * 55), y - 120 - t * 45, 11); break; }
    case 'plateShards': { for (let i = 0; i < 6; i++) { const a = Math.PI * 1.05 + (i / 5) * Math.PI * 0.9; addCircle(x + Math.cos(a) * 55 * t, y - 20 + Math.sin(a) * 40 * t, 11); } break; }
    case 'forearmBlade': { const a = -1.1 + t * 2.2; addCapsule(x + f * 10, y - 35, x + f * (10 + Math.cos(a) * 58), y - 35 + Math.sin(a) * 58, 12); break; }
    case 'hammerArc': { const a = -1.0 + t * 2.0; const rr = 72; addCircle(x + f * 20 + Math.cos(a) * rr, y - 38 + Math.sin(a) * rr, 20); break; }
    case 'iceBlock': { const bx = x + f * (25 + t * 100); addBox(bx, attacker.y - 14, 58, 34); if (t > 0.68) { addCircle(bx + f * 30, attacker.y - 35, 12); addCircle(bx - f * 30, attacker.y - 5, 12); } break; }
    case 'crystalShards': { if (t < 0.55) break; const rr = 34 + ((t - 0.55) / 0.45) * 82; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; addCircle(x + f * 42 + Math.cos(a) * rr, y - 42 + Math.sin(a) * rr * 0.78, 11); } break; }
    case 'moving': {
      const a = -Math.PI * 0.75 + t * Math.PI * 2;
      addCircle(x + Math.cos(a) * r, y - 18 + Math.sin(a) * r * 0.72, Math.max(13, r * 0.22));
      break;
    }
    case 'point': {
      const a = spec.knockback === 'up' ? -Math.PI / 2 : 0;
      const px = x + f * Math.cos(a) * Math.min(reach * 0.65, 78);
      const py = y + Math.sin(a) * Math.min(reach * 0.65, 78);
      addCircle(px, py, Math.max(18, r * 0.48));
      break;
    }
    case 'vertical': {
      addCapsule(x, y + 10, x, y - Math.min(reach, 150), Math.max(17, r * 0.28));
      break;
    }
    case 'ground': {
      addBox(x + f * Math.min(34, reach * 0.28), attacker.y + 2, Math.min(reach, 130), 34);
      break;
    }
    case 'bottom': {
      addBox(x, attacker.y - Math.min(55, reach * 0.45), Math.min(76, r * 1.1), Math.min(110, reach));
      break;
    }
    case 'line': {
      addCapsule(x, y, x + f * reach, y, Math.max(14, r * 0.18));
      break;
    }
    case 'multi': {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const spread = (i - 1) * 0.42;
        const a = spread + (spec.knockback === 'up' ? -Math.PI / 2 : 0);
        addCircle(x + f * Math.cos(a) * reach * (0.42 + t * 0.35), y + Math.sin(a) * reach * (0.42 + t * 0.35), Math.max(13, r * 0.24));
      }
      break;
    }
    case 'radial': {
      // Ring hitbox, represented by several small overlapping circles so the
      // collision follows the actual circumference rather than filling the disk.
      const ring = Math.max(38, r * (0.65 + t * 0.35));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        addCircle(x + Math.cos(a) * ring, y + Math.sin(a) * ring * 0.72, Math.max(11, r * 0.18));
      }
      break;
    }
    case 'forward':
    default: {
      const start = 28;
      const end = Math.min(reach, 165);
      const cur = start + (end - start) * t;
      addCapsule(x + f * start, y, x + f * cur, y, Math.max(16, r * 0.23));
      break;
    }
  }

  return out;
}

function radialVector(attacker, defender) {
  const dx = defender.x - attacker.x;
  const dy = (defender.y - 34) - (attacker.y - 34);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function specKnockbackVector(attacker, defender, profile) {
  const p = String(profile || 'forward').toLowerCase();
  const f = attacker.facing || 1;
  if (p === 'up') return { x: f * 0.18, y: -1 };
  if (p === 'upcontact') {
    const dx = defender.x - attacker.x;
    return { x: Math.max(-0.55, Math.min(0.55, dx / 90)), y: -1 };
  }
  if (p === 'radial' || p === 'radialcontact') return radialVector(attacker, defender);
  if (p === 'inward') {
    const dx = attacker.x - defender.x; const dy = (attacker.y - 34) - (defender.y - 34); const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }
  if (p === 'forwardcontact') {
    const dy = ((defender.y - 34) - (attacker.y - 34)) / 90;
    return { x: f, y: Math.max(-0.75, Math.min(0.35, dy)) };
  }
  if (p === 'radialup') {
    const dx = defender.x - attacker.x; return { x: Math.max(-0.8, Math.min(0.8, dx / 100)), y: -1 };
  }
  if (p === 'velocity') {
    const vx = attacker.vx || f;
    const vy = attacker.vy || 0;
    const len = Math.hypot(vx, vy) || 1;
    return { x: vx / len, y: vy / len };
  }
  return { x: f, y: -0.38 };
}

export function describeAttackSpec(spec) {
  return spec?.description || '';
}
