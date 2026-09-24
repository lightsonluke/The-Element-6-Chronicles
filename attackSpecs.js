// Description-driven attack specifications for the documented Generation I-V roster.
// The character data is the source of truth; this module turns its hitbox/knockback
// metadata into concrete, frame-by-frame collision geometry.

import { OLD_GEN_CHARS } from './eras.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { DOWN_HEAVIES } from './downHeavies.js';

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
  if (!char && !attackData.hitboxProfile && !attackData.type) return null;

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
  if (p === 'down') return { x: f * 0.18, y: 1 };
  if (p === 'radial') return radialVector(attacker, defender);
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
