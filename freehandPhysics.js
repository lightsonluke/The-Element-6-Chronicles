// Safe collision geometry for Stage Editor freehand strokes.
// Freehand strokes are represented as continuous capsules/line segments,
// never as hundreds of tiny square platforms. This keeps slopes smooth and
// prevents malformed saved stroke data from crashing the match renderer.

export function sanitizeFreehandStrokes(strokes) {
  if (!Array.isArray(strokes)) return [];
  return strokes.map((stroke) => {
    let points = Array.isArray(stroke?.points)
      ? stroke.points
          .filter(p => Number.isFinite(Number(p?.x)) && Number.isFinite(Number(p?.y)))
          .map(p => ({ x: Number(p.x), y: Number(p.y) }))
      : [];
    // Keep very long mouse/touch strokes bounded. This preserves the shape while
    // preventing huge saved collision arrays and canvas path workloads.
    if (points.length > 4096) {
      const step = (points.length - 1) / 4095;
      const sampled = [];
      for (let i = 0; i < 4096; i++) sampled.push(points[Math.round(i * step)]);
      points = sampled;
    }
    return {
      ...stroke,
      points,
      diameter: Math.max(4, Number(stroke?.diameter) || 36),
      material: stroke?.material || 'normal',
      motion: stroke?.motion || stroke?.move || null,
    };
  }).filter(stroke => stroke.points.length > 0);
}

export function buildFreehandCollisionSegments(strokes) {
  const out = [];
  for (const stroke of sanitizeFreehandStrokes(strokes)) {
    const pts = stroke.points;
    const radius = stroke.diameter / 2;
    if (pts.length === 1) {
      const p = pts[0];
      out.push({
        x: p.x - radius,
        y: p.y - radius,
        w: radius * 2,
        h: radius * 2,
        x1: p.x, y1: p.y, x2: p.x, y2: p.y,
        radius,
        material: stroke.material,
        _freehandSegment: true,
        _freehandStroke: true,
        _freehandPoint: true,
        collision: true,
        itemCollision: true,
        ...(stroke.motion ? { move: { ...stroke.motion }, motion: { ...stroke.motion } } : {}),
      });
      continue;
    }

    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.001) continue;
      out.push({
        x: Math.min(a.x, b.x) - radius,
        y: Math.min(a.y, b.y) - radius,
        w: Math.abs(dx) + radius * 2,
        h: Math.abs(dy) + radius * 2,
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        radius,
        material: stroke.material,
        _freehandSegment: true,
        _freehandStroke: true,
        _freehandSlope: true,
        collision: true,
        itemCollision: true,
        ...(stroke.motion ? { move: { ...stroke.motion }, motion: { ...stroke.motion } } : {}),
      });
    }
  }
  return out;
}

export function freehandSurfaceAtX(segment, x) {
  const x1 = Number(segment?.x1), y1 = Number(segment?.y1);
  const x2 = Number(segment?.x2), y2 = Number(segment?.y2);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
  const minX = Math.min(x1, x2) - (Number(segment.radius) || 0);
  const maxX = Math.max(x1, x2) + (Number(segment.radius) || 0);
  if (x < minX || x > maxX) return null;
  const dx = x2 - x1;
  const t = Math.abs(dx) < 0.001 ? 0 : Math.max(0, Math.min(1, (x - x1) / dx));
  return y1 + (y2 - y1) * t;
}

export function freehandSlope(segment) {
  const dx = Number(segment?.x2) - Number(segment?.x1);
  const dy = Number(segment?.y2) - Number(segment?.y1);
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < 0.001) return 0;
  return dy / dx;
}
