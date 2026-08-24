import React, { useRef, useEffect, useState } from 'react';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';

// Energetic pre-match intro animation: the participating characters burst in
// from the sides with motion trails, speed lines and sparkles over a dark
// stadium crowd — styled after the attached "action poster" reference.
// `participants` = [{ char, side (1|2), teamColor }]
// Plays once, then calls onDone.
const W = 900, H = 506;

export default function PrematchAnimation({ participants, sport = 'volleyball', title, onDone, sfxVolume = 70, musicVolume = 50 }) {
  const canvasRef = useRef(null);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    sfx.setVolume(sfxVolume); music.setVolume(musicVolume);
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf; const start = performance.now();
    const DURATION = 3200;

    // Layout: split participants by side; arrange along bottom with stagger.
    const left = participants.filter(p => p.side === 1);
    const right = participants.filter(p => p.side === 2);
    const place = (arr, side) => arr.map((p, i) => {
      const n = arr.length;
      const spacing = n <= 2 ? 130 : 100;
      const startX = side === 1 ? 120 + (n > 1 ? 30 : 0) : W - 120 - (n > 1 ? 30 : 0);
      return {
        ...p,
        tx: side === 1 ? startX + i * spacing : startX - i * spacing,
        ty: H - 90,
        fromX: side === 1 ? -160 - i * 90 : W + 160 + i * 90,
        facing: side === 1 ? 1 : -1,
      };
    });
    const chars = [...place(left, 1), ...place(right, 2)];

    // Sparkles
    const sparks = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.7,
      r: 1 + Math.random() * 2.5, sp: 0.3 + Math.random() * 0.8,
      hue: ['#66E0FF', '#FF66CC', '#FFFFFF', '#FFE08A'][Math.floor(Math.random() * 4)],
      ph: Math.random() * Math.PI * 2,
    }));
    // Speed lines
    const lines = Array.from({ length: 16 }, () => ({
      y: Math.random() * H, len: 120 + Math.random() * 220,
      sp: 6 + Math.random() * 10, x: Math.random() * W, a: 0.15 + Math.random() * 0.3,
    }));

    sfx.superActivate();

    const draw = (now) => {
      const t = (now - start) / 1000;
      const p = Math.min(t / (DURATION / 1000), 1);
      ctx.clearRect(0, 0, W, H);

      // ── Stadium background ──
      const bg = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, 640);
      bg.addColorStop(0, '#2a2150'); bg.addColorStop(0.5, '#151634'); bg.addColorStop(1, '#06070f');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Crowd specks
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 140; i++) {
        const x = (i * 53) % W, y = 40 + (i * 17) % 150;
        ctx.fillStyle = ['#FF6644', '#4488FF', '#FFD700', '#44FF88', '#FF44AA', '#AA66FF'][i % 6];
        ctx.globalAlpha = 0.12 + Math.sin(t * 3 + i) * 0.05;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Bleacher rows
      for (let row = 0; row < 5; row++) {
        ctx.fillStyle = `rgba(45,48,90,${0.5 - row * 0.06})`;
        ctx.fillRect(0, 36 + row * 22, W, 18);
      }

      // Glow behind center
      const glow = ctx.createRadialGradient(W / 2, H * 0.5, 20, W / 2, H * 0.5, 320);
      glow.addColorStop(0, `rgba(120,180,255,${0.25 * (1 - Math.abs(p - 0.5) * 2)})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      // ── Speed lines ──
      lines.forEach(l => {
        l.x -= l.sp;
        if (l.x < -l.len) l.x = W;
        ctx.strokeStyle = `rgba(255,255,255,${l.a * (p < 0.5 ? p * 2 : 1)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len, l.y); ctx.stroke();
      });

      // ── Sparkles ──
      sparks.forEach(s => {
        s.ph += s.sp * 0.1;
        const a = 0.4 + Math.sin(s.ph) * 0.4;
        ctx.globalAlpha = Math.max(0, a) * (p < 0.85 ? 1 : (1 - (p - 0.85) / 0.15));
        ctx.fillStyle = s.hue;
        ctx.shadowColor = s.hue; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;

      // ── Characters slide in (ease-out over first 0.9s) ──
      const slideP = Math.min(t / 0.9, 1);
      const ease = 1 - Math.pow(1 - slideP, 3);
      chars.forEach((c, i) => {
        const x = c.fromX + (c.tx - c.fromX) * ease;
        const y = c.ty;
        const bob = slideP >= 1 ? Math.sin(t * 6 + i) * 2 : 0;
        drawSportChar(ctx, x, y + bob, c.char, {
          facing: c.facing, frame: Math.floor(t * 24), scale: 1.15,
          state: slideP < 1 ? 'moving' : 'attacking', jersey: true, sport, teamColor: c.teamColor,
        });
      });

      // ── Center emblem / VS ──
      if (slideP >= 0.7) {
        const ep = Math.min((t - 0.7) / 0.4, 1);
        ctx.save();
        ctx.globalAlpha = ep;
        ctx.textAlign = 'center';
        const emblem = sport === 'volleyball' ? '🏐' : sport === 'baseball' ? '⚾' : '⚽';
        ctx.font = 'bold 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.fillText(emblem, W / 2, H / 2 - 10);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 30px Orbitron';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('VS', W / 2, H / 2 + 26);
        if (title) {
          ctx.font = 'bold 14px Orbitron';
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText(title, W / 2, 44);
        }
        ctx.restore();
      }

      // ── Fade out at end ──
      if (p > 0.88) {
        const fo = (p - 0.88) / 0.12;
        ctx.fillStyle = `rgba(6,7,15,${fo})`; ctx.fillRect(0, 0, W, H);
      }

      if (t < DURATION / 1000) raf = requestAnimationFrame(draw);
      else { setFade(0); setTimeout(() => onDone?.(), 120); }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black" style={{ opacity: fade, transition: 'opacity 0.12s' }}>
      <canvas ref={canvasRef} width={W} height={H}
        className="rounded-lg shadow-2xl"
        style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}`, height: 'auto' }} />
    </div>
  );
}