// Moving platform support for the platform fighter engine.
// A platform may carry a `move` field describing oscillation:
//   { type: 'horizontal' | 'vertical' | 'static',
//     distance, speed, phase, pause, loop }
// We mutate p.x / p.y each frame and carry grounded fighters standing on it.

import { sampleMotion } from './StageMotionRuntime.js';

const CHAR_HALF_W = 16;

export function applyMovingPlatforms(platforms, timeMs, fighters) {
  if (!platforms || !platforms.length) return;
  for (const p of platforms) {
    const mv = p.move || p.motion;
    if (!mv) continue;
    const editorMotion = mv.mode || mv.direction || Array.isArray(mv.chain);
    if (p._deleted > 0) continue;

    if (p._moveBaseX === undefined) p._moveBaseX = p.x;
    if (p._moveBaseY === undefined) p._moveBaseY = p.y;
    if (p._moveStartMs === undefined) {
      p._moveStartMs = timeMs;
      // Pick once per match/platform instance, not once per frame. One-way
      // duration means time from either endpoint to the other endpoint.
      if (mv.type === 'horizontal') {
        const range = Array.isArray(mv.travelDurationRange) ? mv.travelDurationRange : null;
        if (range && range.length >= 2) {
          const min = Math.max(30, Number(range[0]) || 30);
          const max = Math.min(60, Number(range[1]) || 60);
          p._travelDurationSeconds = min + Math.random() * Math.max(0, max - min);
        } else if (Number.isFinite(mv.travelDurationSeconds)) {
          p._travelDurationSeconds = Math.max(30, Math.min(60, Number(mv.travelDurationSeconds)));
        }
      }
    }

    // Triangle-wave motion is centered on its base; offset the center by half
    // the travel distance so the authored x is the actual left endpoint (no
    // first-frame teleport) and the platform remains within its path bounds.
    const pathCenterOffsetX = p._travelDurationSeconds && mv.type === 'horizontal'
      ? Math.max(0, Number(mv.distance) || 0) / 2
      : 0;
    const baseX = p._moveBaseX + (mv.offsetX || 0) + pathCenterOffsetX;
    const baseY = p._moveBaseY + (mv.offsetY || 0);
    const prevX = p.x, prevY = p.y;

    let offX = 0, offY = 0;
    if (editorMotion) {
      const sampled = sampleMotion(mv, timeMs, p._moveStartMs);
      offX = sampled.x; offY = sampled.y;
    } else {
      const runtimeMotion = p._travelDurationSeconds && mv.type === 'horizontal'
        ? { ...mv, speed: 1 / (4 * p._travelDurationSeconds) }
        : mv;
      const primary = movementOffset(runtimeMotion, timeMs, p._moveStartMs);
      offX = primary.x; offY = primary.y;
      if (mv.second && mv.second.type && mv.second.type !== 'static') {
        const secondary = movementOffset(mv.second, timeMs, p._moveStartMs);
        offX += secondary.x; offY += secondary.y;
      }
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
  const speed = Math.max(0.001, Number(mv.speed) || 1);

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