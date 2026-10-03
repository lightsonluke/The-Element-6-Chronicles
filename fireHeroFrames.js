// Fire Hero exact raster frame player.
// The frame images are direct pixel crops from the supplied Fire Hero
// frame-by-frame sheet. No re-drawing or vector approximation is used.
import upUrl from './assets/fire_sheets/up.png';
import downUrl from './assets/fire_sheets/down.png';
import sideUrl from './assets/fire_sheets/side.png';
import upHeavyUrl from './assets/fire_sheets/upheavy.png';
import downHeavyUrl from './assets/fire_sheets/downheavy.png';
import sideHeavyUrl from './assets/fire_sheets/sideheavy.png';
import superUrl from './assets/fire_sheets/super.png';

const SOURCES = {
  us: { url: upUrl, count: 4 },
  ds: { url: downUrl, count: 4 },
  ss: { url: sideUrl, count: 4 },
  uh: { url: upHeavyUrl, count: 4 },
  dh: { url: downHeavyUrl, count: 6 },
  sh: { url: sideHeavyUrl, count: 4 },
  super: { url: superUrl, count: 7 },
};

const images = {};
for (const [key, spec] of Object.entries(SOURCES)) {
  const img = new Image();
  img.src = spec.url;
  images[key] = img;
}

const framesFor = key => SOURCES[key]?.count || 4;

// Each reference frame is held for exactly 3 game frames.
export function fireReferenceFrame(moveKey, progress) {
  const count = framesFor(moveKey);
  const total = count * 3;
  const p = Math.max(0, Math.min(0.999999, Number(progress) || 0));
  const gameFrame = Math.min(total - 1, Math.floor(p * total));
  return Math.min(count - 1, Math.floor(gameFrame / 3));
}

export function fireHoldFrame(moveKey) {
  // Hold the first committed attack design. This is intentionally not a new
  // visual: it is a frozen frame copied directly from the reference attack.
  return Math.min(1, framesFor(moveKey) - 1);
}

export function drawExactFireFrame(ctx, x, y, facing, moveKey, progress, hold = false, holdProgress = 0) {
  const spec = SOURCES[moveKey] || SOURCES.ss;
  const img = images[moveKey] || images.ss;
  if (!img?.complete || !img.naturalWidth) return false;

  const cells = spec.count;
  const cellW = img.naturalWidth / cells;
  const cellH = img.naturalHeight;
  const index = hold ? fireHoldFrame(moveKey) : fireReferenceFrame(moveKey, progress);

  ctx.save();
  ctx.translate(x, y);
  if ((facing || 1) < 0) ctx.scale(-1, 1);

  // The sheet cells were packed around the fighter's feet. Drawing the whole
  // cell preserves every source pixel without resizing or re-interpolating it.
  // A hold is simply the exact reference frame held on screen; its alpha is
  // the only charge-state change.
  ctx.globalAlpha = hold ? (0.45 + Math.max(0, Math.min(1, holdProgress)) * 0.55) : 1;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    index * cellW, 0, cellW, cellH,
    -cellW / 2, -(cellH - 4), cellW, cellH,
  );
  ctx.restore();
  return true;
}

export const FIRE_REFERENCE_FRAME_COUNTS = Object.fromEntries(
  Object.entries(SOURCES).map(([k, v]) => [k, v.count]),
);
