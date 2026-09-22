// Safe freehand geometry helpers. Keeps strokes visually continuous while
// bounding point/collision work so malformed or extremely long strokes cannot
// lock up the editor or a match.

export const MAX_FREEHAND_POINTS = 512;
export const MAX_FREEHAND_COLLISION_SEGMENTS = 1200;

export function sanitizeFreehandPoints(points, maxPoints = MAX_FREEHAND_POINTS) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const clean = [];
  for (const p of points) {
    const x = Number(p?.x), y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const q = { x, y };
    const last = clean[clean.length - 1];
    if (!last || q.x !== last.x || q.y !== last.y) clean.push(q);
  }
  if (clean.length <= maxPoints) return clean;
  const out = new Array(maxPoints);
  out[0] = clean[0];
  out[maxPoints - 1] = clean[clean.length - 1];
  const span = clean.length - 1;
  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * span);
    out[i] = clean[idx];
  }
  return out;
}

export function sanitizeFreehandStroke(stroke, maxPoints = MAX_FREEHAND_POINTS) {
  if (!stroke || typeof stroke !== 'object') return null;
  const points = sanitizeFreehandPoints(stroke.points, maxPoints);
  if (!points.length) return null;
  return {
    material: stroke.material || 'normal',
    diameter: Math.max(4, Math.min(300, Number(stroke.diameter) || 36)),
    points,
    ...(stroke.motion ? { motion: stroke.motion } : {}),
  };
}

export function buildFreehandCollisionPlatforms(strokes = [], maxSegments = MAX_FREEHAND_COLLISION_SEGMENTS) {
  const safeStrokes = (Array.isArray(strokes) ? strokes : [])
    .map(s => sanitizeFreehandStroke(s))
    .filter(Boolean);
  if (!safeStrokes.length || maxSegments <= 0) return [];

  const weights = safeStrokes.map(s => Math.max(1, s.points.length - 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const allocations = weights.map(w => Math.max(1, Math.floor((w / totalWeight) * maxSegments)));
  let allocated = allocations.reduce((a, b) => a + b, 0);
  for (let i = 0; allocated < maxSegments; i = (i + 1) % allocations.length) {
    allocations[i]++;
    allocated++;
  }

  const out = [];
  for (let s = 0; s < safeStrokes.length; s++) {
    const stroke = safeStrokes[s];
    const pts = sanitizeFreehandPoints(stroke.points, allocations[s] + 1);
    const radius = Math.max(2, stroke.diameter / 2);
    if (pts.length === 1) {
      const p = pts[0];
      out.push({
        x: p.x - radius, y: p.y - radius, w: radius * 2, h: radius * 2,
        material: stroke.material, _freehandSegment: true, _freehandStroke: true,
        _freehandPoint: true, collision: true, itemCollision: true,
        ...(stroke.motion ? { move: { ...stroke.motion }, motion: { ...stroke.motion } } : {}),
      });
      continue;
    }
    for (let i = 1; i < pts.length && out.length < maxSegments; i++) {
      const a = pts[i - 1], b = pts[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.hypot(dx, dy) < 0.001) continue;
      out.push({
        x: Math.min(a.x, b.x) - radius,
        y: Math.min(a.y, b.y) - radius,
        w: Math.abs(dx) + radius * 2,
        h: Math.abs(dy) + radius * 2,
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        radius, material: stroke.material,
        _freehandSegment: true, _freehandStroke: true, _freehandSlope: true,
        collision: true, itemCollision: true,
        ...(stroke.motion ? { move: { ...stroke.motion }, motion: { ...stroke.motion } } : {}),
      });
    }
  }
  return out;
}
