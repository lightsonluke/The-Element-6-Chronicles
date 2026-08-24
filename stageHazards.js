// stageHazards.js — shared helpers for placing hazard zones and knockback
// items in the Stage Editor, and building them for gameplay use.
// Reuses the same data shapes as sandboxHazards.js so PlatformFighter can
// consume them directly without conversion.

import { drawHazards, drawObjects } from './brRender.js';
import { updateSandboxHazards, updateSandboxObjects, processSandboxObjectHits } from './sandboxHazards.js';

export { updateSandboxHazards, updateSandboxObjects, processSandboxObjectHits };

// ── Hazard types ──
export const HAZARD_TYPES = [
  { id: 'fire',    name: 'Fire Zone',    color: '#FF6600', icon: '🔥', defaultW: 80,  defaultH: 40 },
  { id: 'electric',name: 'Electric Zone', color: '#66CCFF', icon: '⚡', defaultW: 100, defaultH: 40 },
  { id: 'moving',  name: 'Moving Saw',   color: '#FFAA00', icon: '⚙',  defaultW: 44,  defaultH: 44 },
  { id: 'water',   name: 'Water Pool',   color: '#3388CC', icon: '💧', defaultW: 200, defaultH: 60 },
  { id: 'portal',   name: 'Portal',      color: '#AA44FF', icon: '🌀', defaultW: 50,  defaultH: 50 },
  { id: 'catapult', name: 'Catapult',     color: '#FF4488', icon: '🚀', defaultW: 64,  defaultH: 40 },
  { id: 'wind',     name: 'Wind',         color: '#88FFEE', icon: '💨', defaultW: 120, defaultH: 120 },
];

// ── Knockback object types ──
export const OBJECT_TYPES = [
  { id: 'heavy',     name: 'Heavy',     color: '#8B7355', icon: '🟫', size: 32 },
  { id: 'light',     name: 'Light',     color: '#88CCFF', icon: '🔵', size: 22 },
  { id: 'bouncing',  name: 'Bouncing',  color: '#FF88CC', icon: '🩷', size: 26 },
  { id: 'breakable', name: 'Breakable', color: '#FFDD88', icon: '🟡', size: 28 },
  { id: 'boomerang', name: 'Boomerang', color: '#FFAA00', icon: '🪃', size: 24 },
];

// Full object property table (mirrors sandboxHazards OBJECT_TYPES)
const OBJ_PROPS = {
  heavy:     { mass: 3.0, friction: 0.92, bounce: 0.15, damage: 18, knockback: 14, size: 32, color: '#8B7355', breakThreshold: 999 },
  light:     { mass: 0.8, friction: 0.88, bounce: 0.35, damage: 8,  knockback: 8,  size: 22, color: '#88CCFF', breakThreshold: 999 },
  bouncing:  { mass: 1.0, friction: 0.96, bounce: 0.7,  damage: 10, knockback: 10, size: 26, color: '#FF88CC', breakThreshold: 999 },
  breakable: { mass: 1.2, friction: 0.90, bounce: 0.2,  damage: 12, knockback: 9,  size: 28, color: '#FFDD88', breakThreshold: 3 },
  boomerang: { mass: 0.5, friction: 1.0,  bounce: 0,    damage: 12, knockback: 10, size: 24, color: '#FFAA00', breakThreshold: 999 },
};

// Build a hazard object for the editor (full gameplay-ready shape).
export function makeHazard(type, x, y, opts = {}) {
  const def = HAZARD_TYPES.find(t => t.id === type) || HAZARD_TYPES[0];
  const w = opts.w || def.defaultW, h = opts.h || def.defaultH;
  if (type === 'fire')    return { type, x, y, w, h, spreadTimer: 0, maxSpread: 0, spreadRadius: 0, originalX: x, originalW: w };
  if (type === 'electric')return { type, x, y, w, h, damage: 0.8, stun: 10, pulseTimer: 0 };
  if (type === 'moving')  {
    const axis = opts.axis || 'horizontal';
    const speed = opts.speed || 2.5;
    const range = opts.range || 200;
    return { type, x, y, w, h, axis, speed, range, dir: 1, type2: 'saw', startX: x, startY: y, damage: 1.5, knockback: 10, vx: axis === 'horizontal' ? speed : 0, vy: axis === 'vertical' ? speed : 0 };
  }
  if (type === 'water')   return { type, x, y, w, h };
  if (type === 'portal')  return { type, x, y, w, h, pair: opts.pair ?? -1 };
  if (type === 'catapult')return { type, x, y, w, h, dir: opts.dir || 'right', charge: 0, cooldown: 0, active: null };
  if (type === 'wind')    return { type, x, y, w, h, dir: opts.dir || 'right', strength: opts.strength || 3 };
  return { type, x, y, w, h };
}

// Build a knockback object for the editor (full gameplay-ready shape).
export function makeObject(type, x, y) {
  const props = OBJ_PROPS[type] || OBJ_PROPS.heavy;
  return {
    type, x, y, vx: 0, vy: 0,
    w: props.size, h: props.size, mass: props.mass, friction: props.friction,
    bounce: props.bounce, damage: props.damage, knockback: props.knockback,
    color: props.color, breakThreshold: props.breakThreshold, hitCount: 0,
    grounded: false, _originX: x, _originY: y, _phase: 'idle', _phaseTimer: 0,
    _hitIds: {}, _hitClearTimer: 0, _rot: 0,
  };
}

// Convert editor hazards (flat list with `type` field) into the grouped
// structure PlatformFighter expects: { fire:[], electric:[], moving:[], water:[], portals:[], catapults:[] }.
export function buildHazardsFromStage(stageHazards) {
  const grouped = { fire: [], electric: [], moving: [], water: [], portals: [], catapults: [], wind: [], rocks: [] };
  if (!stageHazards) return grouped;
  // Portals: auto-pair by order (0&1, 2&3, …). Each pair gets a shared pairId.
  const portalList = [];
  for (const h of stageHazards) {
    if (h.type === 'fire') grouped.fire.push({ x: h.x, y: h.y, w: h.w, h: h.h, spreadTimer: 0, maxSpread: 0, spreadRadius: 0, originalX: h.x, originalW: h.w, ...(h.move ? { move: { ...h.move } } : {}) });
    else if (h.type === 'electric') grouped.electric.push({ x: h.x, y: h.y, w: h.w, h: h.h, damage: 0.8, stun: 10, pulseTimer: 0, ...(h.move ? { move: { ...h.move } } : {}) });
    else if (h.type === 'moving') {
      const axis = h.axis || 'horizontal';
      const speed = h.speed || 2.5;
      const range = h.range || 200;
      grouped.moving.push({ x: h.x, y: h.y, w: h.w, h: h.h, axis, speed, range, vx: axis === 'horizontal' ? speed : 0, vy: axis === 'vertical' ? speed : 0, dir: 1, type: 'saw', startX: h.x, startY: h.y, damage: 1.5, knockback: 10 });
    }
    else if (h.type === 'water') grouped.water.push({ x: h.x, y: h.y, w: h.w, h: h.h, ...(h.move ? { move: { ...h.move } } : {}) });
    else if (h.type === 'portal') portalList.push({ x: h.x, y: h.y, w: h.w, h: h.h });
    else if (h.type === 'catapult') grouped.catapults.push({ x: h.x, y: h.y, w: h.w, h: h.h, dir: h.dir || 'right', charge: 0, cooldown: 0, active: null, ...(h.move ? { move: { ...h.move } } : {}) });
    else if (h.type === 'wind') grouped.wind.push({ x: h.x, y: h.y, w: h.w, h: h.h, dir: h.dir || 'right', strength: h.strength || 3, ...(h.move ? { move: { ...h.move } } : {}) });
  }
  // Pair portals sequentially
  for (let i = 0; i < portalList.length; i += 2) {
    if (portalList[i + 1]) {
      grouped.portals.push({ a: portalList[i], b: portalList[i + 1], cooldown: 0 });
    }
  }
  return grouped;
}

// Convert editor objects (flat list) into the full gameplay shape.
export function buildObjectsFromStage(stageObjects) {
  if (!stageObjects) return [];
  return stageObjects.map(o => {
    const props = OBJ_PROPS[o.type] || OBJ_PROPS.heavy;
    return {
      type: o.type, x: o.x, y: o.y, vx: 0, vy: 0,
      w: props.size, h: props.size, mass: props.mass, friction: props.friction,
      bounce: props.bounce, damage: props.damage, knockback: props.knockback,
      color: props.color, breakThreshold: props.breakThreshold, hitCount: 0,
      grounded: false, _originX: o.x, _originY: o.y, _phase: 'idle', _phaseTimer: 0,
      _hitIds: {}, _hitClearTimer: 0, _rot: 0,
    };
  });
}

export { drawHazards, drawObjects };