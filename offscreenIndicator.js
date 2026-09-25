// Screen-edge locator for fighters that are outside the current camera view.
export function drawOffscreenIndicator(ctx, {
  x, y, color = '#FFFFFF', cameraX = 0, cameraY = 0, zoom = 1,
  width, height, radius = 18, margin = 30,
}) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !width || !height) return;
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const sx = width / 2 + (x - width / 2 - (Number(cameraX) || 0)) * z;
  const sy = height / 2 + (y - height / 2 - (Number(cameraY) || 0)) * z;
  const dx = sx - width / 2;
  const dy = sy - height / 2;
  const halfW = width / 2 - margin;
  const halfH = height / 2 - margin;
  if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) return;

  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const edge = Math.min(halfW / Math.max(Math.abs(ux), 0.0001), halfH / Math.max(Math.abs(uy), 0.0001));
  const cx = width / 2 + ux * Math.min(edge, Math.hypot(halfW, halfH));
  const cy = height / 2 + uy * Math.min(edge, Math.hypot(halfW, halfH));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(uy, ux));
  ctx.lineWidth = 3;
  ctx.strokeStyle = color || '#FFFFFF';
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.shadowColor = color || '#FFFFFF';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color || '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(radius * 0.52, 0);
  ctx.lineTo(-radius * 0.22, -radius * 0.38);
  ctx.lineTo(-radius * 0.22, radius * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
