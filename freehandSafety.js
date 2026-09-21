// Freehand stage safety helpers.
// Keeps very large editor strokes from turning into enormous render/collision workloads.

export function sanitizeFreehandPoints(points, maxPoints = 2500) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const valid = [];
  for (const p of points) {
    const x = Number(p?.x), y = Number(p?.y);
    if (Number.isFinite(x) && Number.isFinite(y)) valid.push({ x, y });
  }
  if (valid.length <= maxPoints) return valid;
  const out = new Array(maxPoints);
  const last = valid.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(last, Math.round((i * last) / (maxPoints - 1)));
    out[i] = valid[idx];
  }
  return out;
}

export function sanitizeFreehandStroke(stroke, maxPoints = 2500) {
  if (!stroke || typeof stroke !== 'object') return null;
  const points = sanitizeFreehandPoints(stroke.points, maxPoints);
  if (!points.length) return null;
  const diameter = Math.max(4, Math.min(180, Number(stroke.diameter) || 36));
  return { ...stroke, points, diameter };
}

export function sanitizeFreehandStrokes(strokes, maxPoints = 2500) {
  if (!Array.isArray(strokes)) return [];
  const out = [];
  for (const stroke of strokes) {
    const safe = sanitizeFreehandStroke(stroke, maxPoints);
    if (safe) out.push(safe);
  }
  return out;
}

export function sanitizeFreehandPlatforms(platforms, maxSegments = 4000) {
  if (!Array.isArray(platforms)) return [];
  const freehand = [];
  const normal = [];
  for (const p of platforms) {
    if (p?._freehandSegment) freehand.push(p);
    else normal.push(p);
  }
  if (freehand.length <= maxSegments) return [...normal, ...freehand];
  const kept = new Array(maxSegments);
  const last = freehand.length - 1;
  for (let i = 0; i < maxSegments; i++) {
    kept[i] = freehand[Math.min(last, Math.round((i * last) / (maxSegments - 1)))];
  }
  return [...normal, ...kept];
}
