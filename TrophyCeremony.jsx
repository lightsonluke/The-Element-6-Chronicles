import React, { useRef, useEffect, useState } from 'react';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// 10-second trophy-lifting ceremony shown to the tournament champion.
export default function TrophyCeremony({ champion, onDone, duration = 10 }) {
  const canvasRef = useRef(null);
  const remainingRef = useRef(duration);
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => { remainingRef.current = remaining; }, [remaining]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  useEffect(() => {
    if (remaining === 0) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    try { sfx.cheer(); } catch {}
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 800, H = 500;
    let raf;
    const start = performance.now();
    const confetti = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * -H,
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
      vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4,
      color: ['#FFD700', '#FF4444', '#4488FF', '#AA44FF', '#22C55E', '#FF88AA'][Math.floor(Math.random() * 6)],
    }));
    const color = champion?.color || '#FFD700';

    const draw = (now) => {
      const t = (now - start) / 1000;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a0b3a'); g.addColorStop(0.6, '#2a1158'); g.addColorStop(1, '#0a0418');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // spotlights
      for (let i = 0; i < 3; i++) {
        const sx = W / 2 + (i - 1) * 180;
        const lg = ctx.createLinearGradient(sx, 0, sx, H);
        lg.addColorStop(0, 'rgba(255,255,200,0.10)'); lg.addColorStop(1, 'transparent');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(sx - 60, 0); ctx.lineTo(sx + 60, 0); ctx.lineTo(sx + 180, H); ctx.lineTo(sx - 180, H); ctx.closePath(); ctx.fill();
      }

      // podium
      const px = W / 2, py = H - 60;
      ctx.fillStyle = '#3a2a66'; ctx.fillRect(px - 90, py - 10, 180, 30);
      ctx.fillStyle = '#5a3aa0'; ctx.fillRect(px - 60, py - 40, 120, 30);

      // bounce + trophy raise
      const bounce = Math.sin(t * 3) * 6;
      const cx = px, cy = py - 40 + bounce;
      const raise = Math.min(1, t / 1.5);
      const trophyY = cy - 110 + (1 - raise) * 70;

      // confetti
      confetti.forEach(c => {
        c.x += c.vx; c.y += c.vy; c.rot += c.vr;
        if (c.y > H) { c.y = -10; c.x = Math.random() * W; }
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.fillStyle = c.color; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      });

      // stickman (arms raised)
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - 14, cy); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + 14, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 70); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy - 82, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - 62); ctx.lineTo(cx - 20, cy - 95); ctx.moveTo(cx, cy - 62); ctx.lineTo(cx + 20, cy - 95); ctx.stroke();

      // gold trophy
      const tx = cx, ty = trophyY;
      ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx - 22, ty - 20); ctx.lineTo(tx - 16, ty + 10); ctx.lineTo(tx + 16, ty + 10); ctx.lineTo(tx + 22, ty - 20); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(tx - 22, ty - 12, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + 22, ty - 12); ctx.arc(tx + 22, ty - 12, 8, Math.PI / 2, -Math.PI / 2); ctx.stroke();
      ctx.fillStyle = '#FFD700'; ctx.fillRect(tx - 4, ty + 10, 8, 10); ctx.fillRect(tx - 16, ty + 20, 32, 6);

      // banner
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 28, W, 74);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 40px Orbitron'; ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 18;
      ctx.fillText('CHAMPION!', W / 2, 70);
      ctx.shadowBlur = 0;
      ctx.fillStyle = color; ctx.font = 'bold 22px Orbitron';
      ctx.fillText((champion?.name || '').toUpperCase(), W / 2, 96);

      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'right';
      ctx.fillText(Math.max(0, remainingRef.current) + 's', W - 12, 24);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-3xl">
      <canvas ref={canvasRef} width={800} height={500}
        className="rounded-xl border-2 border-accent shadow-2xl w-full"
        style={{ maxWidth: '800px', aspectRatio: '8 / 5', height: 'auto' }} />
      <button onClick={onDone} className="px-5 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">SKIP <GameIcon emoji="→" size={14} /></button>
    </div>
  );
}