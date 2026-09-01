import React, { useRef, useEffect } from 'react';
import { MATERIALS, drawMaterialOverlay } from './materials.js';
import { getBackdrop } from './stageBackdrops.js';

// Reusable stage thumbnail — renders platforms onto a small canvas matching the
// editor's preview style. `stage` = { platforms, backdrop }.
export default function StagePreview({ stage, w = 240, h = 135, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    renderThumbnail(ctx, stage, w, h);
  }, [stage, w, h]);
  return <canvas ref={ref} width={w} height={h} className={`rounded-lg border border-border ${className}`} style={{ aspectRatio: '16 / 9' }} />;
}

export function renderThumbnail(ctx, stage, w, h) {
  const platforms = stage?.platforms || (Array.isArray(stage) ? stage : []);
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  const bd = getBackdrop(stage?.backdrop || 'city');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, bd.colors[0]); g.addColorStop(1, bd.colors[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const sx = w / 1280, sy = h / 720;
  platforms.forEach(p => {
    const mat = MATERIALS.find(m => m.id === (p.material || 'normal')) || MATERIALS[0];
    ctx.fillStyle = mat.color;
    ctx.fillRect(p.x * sx, p.y * sy, p.w * sx, Math.max(2, p.h * sy));
    drawMaterialOverlay(ctx, { ...p, x: p.x * sx, y: p.y * sy, w: p.w * sx, h: Math.max(2, p.h * sy) }, 0);
    // moving-platform path hint
    if (p.move && p.move.type !== 'static' && p.move.distance) {
      const d = p.move.distance * sx;
      ctx.strokeStyle = 'rgba(255,215,0,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      if (p.move.type === 'horizontal') { ctx.moveTo((p.x - d / 2) * sx, (p.y + p.h / 2) * sy); ctx.lineTo((p.x + p.w + d / 2) * sx, (p.y + p.h / 2) * sy); }
      else if (p.move.type === 'vertical') { ctx.moveTo((p.x + p.w / 2) * sx, (p.y - d / 2) * sy); ctx.lineTo((p.x + p.w / 2) * sx, (p.y + p.h + d / 2) * sy); }
      else if (p.move.type === 'oneway') { const vx = p.move.dirX || 1, vy = p.move.dirY || 0; ctx.moveTo((p.x + p.w / 2) * sx, (p.y + p.h / 2) * sy); ctx.lineTo((p.x + p.w / 2 + vx * p.move.distance) * sx, (p.y + p.h / 2 + vy * p.move.distance) * sy); }
      ctx.stroke(); ctx.setLineDash([]);
      if (p.move.second?.distance) {
        const vx = p.move.second.dirX || 1, vy = p.move.second.dirY || 0;
        ctx.beginPath(); ctx.moveTo((p.x + p.w / 2) * sx, (p.y + p.h / 2) * sy); ctx.lineTo((p.x + p.w / 2 + vx * p.move.second.distance) * sx, (p.y + p.h / 2 + vy * p.move.second.distance) * sy); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  });
}