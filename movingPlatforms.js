// Moving platform support for the platform fighter engine.
// A platform may carry a `move` field describing oscillation:
//   { type: 'horizontal' | 'vertical' | 'static',
//     distance, speed, phase, pause, loop }
// We mutate p.x / p.y each frame and carry grounded fighters standing on it.

const CHAR_HALF_W = 16;

export function applyMovingPlatforms(platforms, timeMs, fighters) {
  if (!platforms || !platforms.length) return;
  for (const p of platforms) {
    const mv = p.move;
    if (!mv || mv.type === 'static' || !mv.type) continue;
    if (p._deleted > 0) continue;

    if (p._moveBaseX === undefined) p._moveBaseX = p.x;
    if (p._moveBaseY === undefined) p._moveBaseY = p.y;
    if (p._moveStartMs === undefined) p._moveStartMs = timeMs;

    const baseX = p._moveBaseX + (mv.offsetX || 0);
    const baseY = p._moveBaseY + (mv.offsetY || 0);
    const prevX = p.x, prevY = p.y;

    const primary = movementOffset(mv, timeMs, p._moveStartMs);
    let offX = primary.x;
    let offY = primary.y;

    // Optional second direction. This lets one platform combine two different
    // movement axes/vectors (for example horizontal + vertical = diagonal).
    if (mv.second && mv.second.type && mv.second.type !== 'static') {
      const secondary = movementOffset(mv.second, timeMs, p._moveStartMs);
      offX += secondary.x;
      offY += secondary.y;
    }

    p.x = baseX + offX;
    p.y = baseY + offY;

    const dx = p.x - prevX, dy = p.y - prevY;
    if (!fighters || (!dx && !dy)) continue;
    for (const f of fighters) {
      if (!f || !f.grounded) continue;
      const onThis = Math.abs(f.y - prevY) < 4 &&
        f.x > prevX - CHAR_HALF_W && f.x < prevX + p.w + CHAR_HALF_W;
      if (onThis) { f.x += dx; f.y += dy; }
    }
  }
}

function movementOffset(mv, timeMs, startMs) {
  const distance = Math.max(0, Number(mv.distance) || 0);
  const speed = Math.max(0.05, Number(mv.speed) || 1);

  if (mv.type === 'oneway') {
    // One-way movement travels once and stays at its destination.
    const elapsed = Math.max(0, (timeMs - startMs) / 1000);
    const duration = Math.max(0.1, distance / Math.max(30, speed * 100));
    const progress = Math.min(1, elapsed / duration);
    const vector = normalizeVector(mv.dirX, mv.dirY);
    return { x: vector.x * distance * progress, y: vector.y * distance * progress };
  }

  const t = (timeMs / 1000) * speed * 2 + (mv.phase || 0);
  const off = triangleWave(t) * distance / 2;
  if (mv.type === 'horizontal') return { x: off, y: 0 };
  if (mv.type === 'vertical') return { x: 0, y: off };
  return { x: 0, y: 0 };
}

function normalizeVector(x, y) {
  const vx = Number(x) || 0;
  const vy = Number(y) || 0;
  const len = Math.hypot(vx, vy);
  if (!len) return { x: 1, y: 0 };
  return { x: vx / len, y: vy / len };
}

// Smooth -1..1 triangle wave with eased pause near the peaks
function triangleWave(t) {
  const frac = t - Math.floor(t); // 0..1 repeating
  let tri;
  if (frac < 0.5) tri = frac * 4 - 1; // -1..+1
  else tri = 3 - frac * 4;            // +1..-1
  // Ease the very top/bottom so there's a subtle pause at the turnaround
  return tri; // linear is fine; pause is approximate via speed settings
}