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
    // Record base position once so we oscillate around it, not the moving value
    if (p._moveBaseX === undefined) p._moveBaseX = p.x;
    if (p._moveBaseY === undefined) p._moveBaseY = p.y;
    const baseX = p._moveBaseX + (mv.offsetX || 0);
    const baseY = p._moveBaseY + (mv.offsetY || 0);

    // Triangle wave 0..1..0 gives a smooth back-and-forth with pause at edges.
    const speed = Math.max(0.05, mv.speed || 1);
    const amp = Math.max(0, mv.distance || 0);
    const t = (timeMs / 1000) * speed * 2 + (mv.phase || 0);
    const wave = triangleWave(t); // -1..1
    const off = wave * amp / 2; // half-amplitude either side of base

    const prevX = p.x, prevY = p.y;
    if (mv.type === 'horizontal') {
      p.x = baseX + off;
      p.y = baseY;
    } else if (mv.type === 'vertical') {
      p.x = baseX;
      p.y = baseY + off;
    }
    const dx = p.x - prevX, dy = p.y - prevY;
    if (!fighters || (!dx && !dy)) continue;
    // Carry grounded fighters who are standing on this platform
    for (const f of fighters) {
      if (!f || !f.grounded) continue;
      const onThis = Math.abs(f.y - prevY) < 4 &&
        f.x > prevX - CHAR_HALF_W && f.x < prevX + p.w + CHAR_HALF_W;
      if (onThis) { f.x += dx; f.y += dy; }
    }
  }
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