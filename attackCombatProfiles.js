// Shared combat geometry for the Element 6 character attack system.
// The renderer and fighter simulation both use the same character config so
// an attack's visible shape and its actual hit area stay aligned.
import { CHAR_ATTACKS, getFallbackConfig } from './charAttackConfigs.js';

function keyFor(attack) {
  const st = attack?.sigType || 'side';
  if (attack?.isHeavy) return (st === 'downHeavy' || st === 'down' || attack.isGroundPound) ? 'dh' : 'sh';
  if (st === 'up' || st === 'aerial' || attack?.isRecovery) return 'us';
  if (st === 'down' || st === 'downNormal') return 'ds';
  return 'ss';
}

function cfgFor(fighter, attack) {
  const id = fighter?.char?.id;
  const baseId = fighter?.char?.baseCharId;
  const cfg = CHAR_ATTACKS[id] || (baseId && CHAR_ATTACKS[baseId]) || getFallbackConfig(fighter?.char?.power, fighter?.char?.color);
  return cfg?.[keyFor(attack)] || null;
}

export function getAttackCombatProfile(fighter, attack) {
  const cfg = cfgFor(fighter, attack);
  const shape = cfg?.[0] || 'jab';
  const mul = Math.max(0.55, Number(cfg?.[3]) || 1);
  const range = Math.max(35, Number(attack?.range) || 90) * mul * (fighter?.rangeBoost || 1);
  const p = Math.max(0, Math.min(1, Number(attack?.progress) || 0));
  const facing = fighter?.facing || 1;
  const x = fighter?.x || 0;
  const y = (fighter?.y || 0) - 30;
  const forward = Math.max(18, range * 0.55);

  // A compact geometric description.  Hit testing is done against the
  // defender's body box below; no full-range generic AABB is used.
  if (shape === 'radial' || shape === 'drain') {
    const radius = Math.max(24, range * (attack?.isHeavy ? 0.58 : 0.42));
    return { kind: 'circle', cx: x, cy: y, r: radius, knockX: 0, knockY: -0.15 };
  }
  if (shape === 'launch') {
    const h = Math.max(65, range * 1.05);
    return { kind: 'rect', cx: x + facing * 4, cy: y - h * 0.48, w: Math.max(34, range * 0.42), h, knockX: facing * 0.15, knockY: -1 };
  }
  if (shape === 'ground' || shape === 'slam') {
    const h = Math.max(35, range * 0.42);
    const cy = (fighter?.y || 0) - h * 0.15;
    return { kind: 'rect', cx: x + facing * (attack?.isHeavy ? range * 0.15 : range * 0.04), cy, w: Math.max(45, range * 0.9), h, knockX: facing * 0.35, knockY: -0.35 };
  }
  if (shape === 'beam' || shape === 'lineBurst' || shape === 'lineArc' || shape === 'whip') {
    const len = Math.max(45, range * (shape === 'beam' ? 0.95 : 0.8));
    const startX = x + facing * 15;
    const endX = startX + facing * len;
    return { kind: 'capsule', x1: startX, y1: y, x2: endX, y2: y + (shape === 'lineArc' ? Math.sin(p * Math.PI) * -25 : 0), r: Math.max(8, attack?.isHeavy ? 15 * mul : 10 * mul), knockX: facing, knockY: shape === 'lineArc' ? -0.2 : 0 };
  }
  if (shape === 'arcAround') {
    const radius = Math.max(45, range * 0.52);
    const ang = (attack?.sigType === 'up' ? -Math.PI / 2 : attack?.sigType === 'down' ? Math.PI / 2 : 0) + facing * (p * Math.PI * 1.25 - Math.PI * 0.65);
    return { kind: 'circlePoint', cx: x + Math.cos(ang) * radius, cy: y + Math.sin(ang) * radius, r: Math.max(16, 22 * mul), knockX: Math.cos(ang), knockY: Math.sin(ang) };
  }
  if (shape === 'portal' || shape === 'barrier' || shape === 'illusion') {
    const w = Math.max(42, range * 0.65);
    const h = Math.max(44, attack?.isHeavy ? 75 * mul : 58 * mul);
    return { kind: 'rect', cx: x + facing * (w * 0.55), cy: y, w, h, knockX: facing, knockY: -0.15 };
  }
  if (shape === 'charge') {
    const w = Math.max(48, range * 0.8);
    return { kind: 'capsule', x1: x + facing * 10, y1: y, x2: x + facing * w, y2: y, r: Math.max(15, 23 * mul), knockX: facing, knockY: -0.15 };
  }
  // slash / jab and all unknown shapes: a compact limb-shaped hitbox.
  const w = Math.max(42, range * (attack?.isHeavy ? 0.78 : 0.58));
  const h = Math.max(34, attack?.isHeavy ? 72 * mul : 52 * mul);
  return { kind: 'rect', cx: x + facing * (w * 0.5), cy: y, w, h, knockX: facing, knockY: -0.2 };
}

function bodyBox(defender) {
  return { x: defender.x - 16, y: defender.y - 72, w: 32, h: 72 };
}

function rectCircleOverlap(box, cx, cy, r) {
  const nx = Math.max(box.x, Math.min(cx, box.x + box.w));
  const ny = Math.max(box.y, Math.min(cy, box.y + box.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

function segmentDistanceSquared(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (!len2) return (px - x1) ** 2 + (py - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  const qx = x1 + t * dx, qy = y1 + t * dy;
  return (px - qx) ** 2 + (py - qy) ** 2;
}

export function attackHitsDefender(fighter, defender, attack) {
  const h = getAttackCombatProfile(fighter, attack);
  const b = bodyBox(defender);
  if (h.kind === 'circle' || h.kind === 'circlePoint') return rectCircleOverlap(b, h.cx, h.cy, h.r);
  if (h.kind === 'capsule') {
    const samples = 5;
    for (let i = 0; i <= samples; i++) {
      const px = b.x + b.w * (i / samples);
      for (let j = 0; j <= samples; j++) {
        const py = b.y + b.h * (j / samples);
        if (segmentDistanceSquared(px, py, h.x1, h.y1, h.x2, h.y2) <= h.r * h.r) return true;
      }
    }
    return false;
  }
  return h.cx - h.w / 2 < b.x + b.w && h.cx + h.w / 2 > b.x && h.cy - h.h / 2 < b.y + b.h && h.cy + h.h / 2 > b.y;
}

export function getAttackKnockbackDirection(fighter, defender, attack) {
  const h = getAttackCombatProfile(fighter, attack);
  if (h.kind === 'circle' || h.kind === 'circlePoint') {
    const dx = defender.x - (h.cx || fighter.x);
    const dy = (defender.y - 35) - (h.cy || fighter.y - 30);
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }
  const kx = h.knockX || fighter.facing || 1;
  const ky = h.knockY || 0;
  const len = Math.hypot(kx, ky) || 1;
  return { x: kx / len, y: ky / len };
}

export function scaledAttackDamage(fighter, attack, kind = 'normal') {
  const power = Math.max(1, Math.min(10, Number(fighter?.char?.stats?.power) || 5));
  const heavyBase = 8 + power * 1.9;
  if (kind === 'heavy') return heavyBase;
  if (kind === 'signature') return heavyBase * 0.46;
  if (kind === 'super') return heavyBase * 1.85;
  return 6 + power * 0.65;
}
