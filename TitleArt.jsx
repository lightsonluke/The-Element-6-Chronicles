import React, { useRef, useEffect } from 'react';
import { drawStickman } from './renderer.js';

// Battle-pass-style title art — space background, Element 6 logo, character showcase.
export default function TitleArt() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 420, H = 280;
    let frame = 0;
    let raf;

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.7,
      size: Math.random() * 1.8 + 0.4, twinkle: Math.random() * Math.PI * 2
    }));

    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Space background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1a0e2e');
      bg.addColorStop(0.5, '#120b22');
      bg.addColorStop(1, '#0a0515');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        ctx.globalAlpha = 0.3 + Math.sin(frame * 0.03 + s.twinkle) * 0.35;
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1;

      // Wide floor platform
      const floorY = H - 35;
      const fGrad = ctx.createLinearGradient(0, floorY, 0, H);
      fGrad.addColorStop(0, '#2e3b5e');
      fGrad.addColorStop(1, '#1a2040');
      ctx.fillStyle = fGrad;
      ctx.beginPath(); ctx.roundRect(15, floorY, W - 30, 35, 6); ctx.fill();
      ctx.strokeStyle = '#3e4b7e'; ctx.lineWidth = 1.5; ctx.stroke();

      // Thin suspended platform
      const platY = floorY - 12;
      ctx.fillStyle = '#2e3b5e';
      ctx.beginPath(); ctx.roundRect(50, platY, W - 100, 5, 2); ctx.fill();
      ctx.strokeStyle = '#3e4b7e88'; ctx.lineWidth = 1; ctx.stroke();

      // Left character (blue)
      const b1 = Math.abs(Math.sin(frame * 0.05)) * 4;
      ctx.save();
      ctx.translate(110, floorY - 28 - b1);
      ctx.scale(1.15, 1.15);
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 12;
      drawStickman(ctx, 0, 0, '#0088ff', 1, frame, 1.0, false, 'idle');
      ctx.restore();

      // Right character (turquoise)
      const b2 = Math.abs(Math.sin(frame * 0.05 + 1.2)) * 4;
      ctx.save();
      ctx.translate(310, floorY - 28 - b2);
      ctx.scale(1.15, 1.15);
      ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 12;
      drawStickman(ctx, 0, 0, '#00ccaa', 1, frame, 1.0, false, 'idle');
      ctx.restore();

      // Star/spark in center
      const cx = W / 2, cy = floorY - 55;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(frame * 0.03);
      const pulse = 0.5 + Math.sin(frame * 0.1) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 15;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 14 : 6;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();

      // Character name labels
      ctx.font = 'bold 9px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
      ctx.fillText('★ Cable', 110, floorY + 22);
      ctx.fillText('★ Turquoise', 310, floorY + 22);
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <h1 className="font-heading text-4xl md:text-5xl font-bold text-white tracking-wider"
        style={{ textShadow: '0 0 25px rgba(119,68,255,0.6), 0 0 10px rgba(255,255,255,0.3)' }}>
        element6
      </h1>
      <h2 className="font-heading text-xl md:text-2xl tracking-[0.2em] mt-1"
        style={{ color: '#c090ff', textShadow: '0 0 18px rgba(192,144,255,0.5)' }}>
        CHRONICLES
      </h2>
      <div className="my-3 w-16 h-16 rounded-full flex items-center justify-center relative"
        style={{ background: 'radial-gradient(circle, rgba(119,68,255,0.35), rgba(119,68,255,0.08))', border: '2px solid #7744FF', boxShadow: '0 0 30px rgba(119,68,255,0.5), inset 0 0 15px rgba(119,68,255,0.3)' }}>
        <span className="font-heading text-3xl font-bold" style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.6)' }}>6</span>
      </div>
      <canvas ref={canvasRef} width={420} height={280} className="rounded-xl" style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
}