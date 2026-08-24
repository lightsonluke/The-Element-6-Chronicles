import React, { useRef, useEffect, useState } from 'react';
import { drawStickman } from './renderer.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { sfx } from './sfx.js';
import { getEmoteById } from './emotes.js';

// Dedicated victory screen — shows the winning character with a unique animation.
// If a victoryEmote is equipped, the character performs that emote instead of bouncing.
export default function WinScreen({ charId, customCharsData = {}, victoryEmote, onContinue }) {
  const canvasRef = useRef(null);
  const [showBtn, setShowBtn] = useState(false);

  const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
  const char = charId?.startsWith('custom_')
    ? customCharsData[charId]
    : ALL.find(c => c.id === charId);
  const name = char?.name || 'CHAMPION';
  const color = char?.color || '#FFD700';
  const emoteDef = victoryEmote ? getEmoteById(victoryEmote) : null;

  useEffect(() => { sfx.battlePassReward(); }, []);
  useEffect(() => { const t = setTimeout(() => setShowBtn(true), 2500); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 600, H = 400;
    let frame = 0;
    let raf;
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: H + Math.random() * 100,
      vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 4,
      size: 2 + Math.random() * 4, color: ['#FFD700', '#FF44AA', '#4488FF', '#44FF88', color][Math.floor(Math.random() * 5)],
      life: 1,
    }));

    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      // Background gradient
      const bg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 300);
      bg.addColorStop(0, color + '22');
      bg.addColorStop(0.5, '#0a0820');
      bg.addColorStop(1, '#02010a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Rainbow victory rings
      for (let r = 0; r < 5; r++) {
        const rad = 40 + r * 35 + Math.sin(frame * 0.04 + r) * 8;
        ctx.strokeStyle = `hsl(${(frame * 2 + r * 60) % 360}, 80%, 60%)`;
        ctx.globalAlpha = 0.15 + r * 0.03;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 + 20, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Spotlight beam
      const beam = ctx.createLinearGradient(W / 2, 0, W / 2, H);
      beam.addColorStop(0, color + '33');
      beam.addColorStop(1, 'transparent');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60, 0); ctx.lineTo(W / 2 + 60, 0);
      ctx.lineTo(W / 2 + 120, H); ctx.lineTo(W / 2 - 120, H);
      ctx.closePath();
      ctx.fill();

      // Character — victory emote or bouncing celebration
      if (emoteDef) {
        // Loop the emote continuously
        const emoteProgress = ((frame % emoteDef.duration) / emoteDef.duration);
        const emote = { id: emoteDef.id, progress: emoteProgress, timer: emoteDef.duration, maxTimer: emoteDef.duration };
        ctx.save();
        ctx.translate(W / 2, H / 2 + 40);
        ctx.scale(1.8, 1.8);
        ctx.shadowColor = color;
        ctx.shadowBlur = 25;
        drawStickman(ctx, 0, 0, color, 1, frame, 1.0, char?.isSpirit, 'idle', char, null, false, null, emote);
        ctx.restore();
      } else {
        // Default bouncing celebration
        const bounce = Math.abs(Math.sin(frame * 0.06)) * 25;
        const spin = Math.sin(frame * 0.03) * 0.15;
        ctx.save();
        ctx.translate(W / 2, H / 2 + 40 - bounce);
        ctx.rotate(spin);
        ctx.scale(1.8, 1.8);
        ctx.shadowColor = color;
        ctx.shadowBlur = 25;
        drawStickman(ctx, 0, 0, color, 1, frame, 1.0, char?.isSpirit, 'idle', char);
        ctx.restore();
      }

      // Particles (confetti)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.005;
        if (p.life <= 0 || p.y < -20) { p.x = Math.random() * W; p.y = H + 20; p.vy = -2 - Math.random() * 4; p.life = 1; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // "VICTORY!" text
      ctx.save();
      ctx.font = `bold ${36 + Math.sin(frame * 0.08) * 4}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillText('VICTORY!', W / 2, 50);
      ctx.restore();

      // Character name
      ctx.save();
      ctx.font = 'bold 24px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillText(name, W / 2, H - 30);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [color, name, char, emoteDef]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95">
      <canvas ref={canvasRef} width={600} height={400} className="max-w-full max-h-[80vh] rounded-xl" />
      {showBtn && (
        <button onClick={onContinue}
          className="mt-4 px-10 py-3 bg-accent text-accent-foreground rounded-xl font-heading text-lg tracking-wider hover:scale-105 transition animate-pulse">
          CONTINUE
        </button>
      )}
    </div>
  );
}