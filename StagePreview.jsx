import React, { useEffect, useRef, useState } from 'react';
import { MATERIALS, drawMaterialOverlay, drawMaterialStroke } from './materials.js';
import { HAZARD_TYPES, OBJECT_TYPES } from './stageHazards.js';
import { drawStageBackground } from './stageBackgrounds.js';
import { directionVector, normalizeMotion, sampleMotion } from './StageMotionRuntime.js';

const W = 1280, H = 720;

function drawScene(ctx, stage, now, playing) {
  ctx.clearRect(0, 0, W, H);
  drawStageBackground(ctx, W, H, Math.floor(now / 16), stage?.backdrop || 'splitcity', null, null);

  const data = stage || {};
  const cam = data.stageCamera || {};
  const camMotion = cam.motion;
  let camX = 0, camY = 0;
  if (playing && camMotion) {
    const sample = sampleMotion(camMotion, now, data.__previewStart || now, data.__cameraState || {});
    data.__cameraState = sample.state; camX = sample.x; camY = sample.y;
  }
  const zoom = Math.max(0.5, Number(cam.zoom || 1));
  ctx.save();
  ctx.translate(W / 2 + camX, H / 2 + camY);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
  const started = data.__previewStart || now;
  const drawMove = (entity, baseX, baseY) => {
    if (!playing || !entity?.motion) return { x: baseX, y: baseY };
    const stateKey = entity.__previewMotionKey || `${entity.type || 'entity'}:${baseX}:${baseY}`;
    entity.__previewMotionKey = stateKey;
    const m = normalizeMotion(entity.motion);
    if (!m) return { x: baseX, y: baseY };
    const sampled = sampleMotion(m, now, started, entity.__previewMotionState || {});
    entity.__previewMotionState = sampled.state;
    return { x: baseX + sampled.x, y: baseY + sampled.y };
  };

  (data.platforms || []).forEach(p => {
    if (p?._freehandSegment) return;
    const pos = drawMove(p, p.x, p.y);
    const mat = MATERIALS.find(m => m.id === (p.material || 'normal')) || MATERIALS[0];
    ctx.fillStyle = mat.color || '#777';
    ctx.fillRect(pos.x, pos.y, p.w, p.h);
    try { drawMaterialOverlay(ctx, { ...p, x: pos.x, y: pos.y }, 0); } catch {}
    if (p.destroyable) { ctx.strokeStyle = '#ff8844'; ctx.strokeRect(pos.x, pos.y, p.w, p.h); }
  });
  (data.freehandStrokes || []).forEach((stroke, idx) => {
    try {
      let rendered = stroke;
      const rawPoints = Array.isArray(stroke?.points) ? stroke.points : [];
      const points = safePreviewPoints(rawPoints, 3000);
      if (!points.length) return;
      if (playing && stroke?.motion) {
        const m = normalizeMotion(stroke.motion);
        const sampled = m ? sampleMotion(m, now, started, stroke.__previewMotionState || {}) : { x: 0, y: 0, state: {} };
        stroke.__previewMotionState = sampled.state;
        rendered = { ...stroke, points: points.map(pt => ({ x: pt.x + sampled.x, y: pt.y + sampled.y })) };
      } else {
        rendered = { ...stroke, points };
      }
      drawMaterialStroke(ctx, rendered, Math.floor(now / 16));
    } catch {}
  });
  (data.hazards || []).forEach(h => {
    const pos = drawMove(h, h.x, h.y);
    const def = HAZARD_TYPES.find(t => t.id === h.type) || HAZARD_TYPES[0];
    ctx.globalAlpha = .65; ctx.fillStyle = def.color || '#f44'; ctx.fillRect(pos.x, pos.y, h.w || 50, h.h || 40); ctx.globalAlpha = 1;
  });
  (data.objects || []).forEach((o, idx) => {
    const def = OBJECT_TYPES.find(t => t.id === o.type) || OBJECT_TYPES[0];
    const pos = drawMove(o, o.x, o.y);
    ctx.fillStyle = def.color || '#fff'; ctx.beginPath(); ctx.arc(pos.x, pos.y, (def.size || 24) / 2, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate((o._previewRot || 0)); ctx.strokeStyle = '#ffffff88'; ctx.strokeRect(-(def.size||24)/2, -(def.size||24)/2, def.size||24, def.size||24); ctx.restore();
  });

  const kp = data.killPerimeter;
  if (kp?.enabled !== false) {
    const pm = kp?.motions || {};
    const lo = pm.left ? sampleMotion(pm.left, now, started, kp.__l || {}).x : 0;
    const ro = pm.right ? sampleMotion(pm.right, now, started, kp.__r || {}).x : 0;
    const to = pm.top ? sampleMotion(pm.top, now, started, kp.__t || {}).y : 0;
    const bo = pm.bottom ? sampleMotion(pm.bottom, now, started, kp.__b || {}).y : 0;
    ctx.strokeStyle = 'rgba(255,70,70,.7)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    const left = (kp?.left ?? -500) + lo, right = (kp?.right ?? 1780) + ro;
    const top = (kp?.top ?? -600) + to, bottom = (kp?.bottom ?? 1170) + bo;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.setLineDash([]);
  }
  (data.spawnPoints || []).forEach((sp, i) => {
    ctx.save(); ctx.globalAlpha = .75; ctx.strokeStyle = sp.color || (i === 0 ? '#f44' : '#48f');
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sp.x - 14, sp.y); ctx.lineTo(sp.x + 14, sp.y); ctx.moveTo(sp.x, sp.y - 14); ctx.lineTo(sp.x, sp.y + 14); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(`P${i+1}`, sp.x + 8, sp.y - 8); ctx.restore();
  });
  ctx.restore();
}

function safePreviewPoints(points, maxPoints = 3000) {
  const clean=[];
  for (const p of Array.isArray(points) ? points : []) {
    const x=Number(p?.x), y=Number(p?.y);
    if (Number.isFinite(x) && Number.isFinite(y)) clean.push({x,y});
  }
  if (clean.length <= maxPoints) return clean;
  const out=[], step=(clean.length-1)/(maxPoints-1);
  for(let i=0;i<maxPoints;i++) out.push(clean[Math.round(i*step)]);
  return out;
}


export default function StagePreview({ stage, onClose, onEdit, onTool, tools = [] }) {
  const canvasRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const stageRef = useRef(JSON.parse(JSON.stringify(stage || {})));
  useEffect(() => { stageRef.current = JSON.parse(JSON.stringify(stage || {})); }, [stage]);
  useEffect(() => {
    let raf;
    const loop = (t) => {
      if (!stageRef.current.__previewStart) stageRef.current.__previewStart = t;
      if (canvasRef.current) drawScene(canvasRef.current.getContext('2d'), stageRef.current, t, playing);
      setTick(v => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return <div className="fixed inset-0 z-[100] bg-black flex flex-col">
    <div className="absolute top-3 left-3 z-20 rounded-lg bg-black/70 px-3 py-2 text-xs text-white font-heading border border-white/20">STAGE PREVIEW {playing ? '• PLAYING' : '• PAUSED'}</div>
    <canvas ref={canvasRef} width={W} height={H} className="w-full h-full object-contain bg-black" />
    <div className="absolute bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border p-2 flex gap-2 items-center overflow-x-auto">
      <button onClick={() => setPlaying(v => !v)} className="px-4 py-2 rounded bg-accent text-accent-foreground font-heading text-xs">{playing ? 'PAUSE' : 'PLAY STAGE'}</button>
      <button onClick={() => { stageRef.current.__previewStart = performance.now(); setPlaying(false); }} className="px-3 py-2 rounded bg-secondary text-secondary-foreground font-heading text-xs">RESET PREVIEW</button>
      {tools.map(t => <button key={t.id} onClick={() => onTool?.(t.id)} className="px-3 py-2 rounded bg-secondary text-secondary-foreground font-heading text-xs">{t.label}</button>)}
      <button onClick={onEdit} className="px-3 py-2 rounded bg-primary text-primary-foreground font-heading text-xs">EDIT THIS STAGE</button>
      <button onClick={onClose} className="ml-auto px-3 py-2 rounded bg-destructive text-destructive-foreground font-heading text-xs">CLOSE</button>
    </div>
  </div>;
}
