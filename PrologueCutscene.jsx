import React, { useState, useEffect, useRef } from 'react';
import GameIcon from "./GameIcon.jsx";

const SCENES = [
  { text: 'Before the universe expanded...', bg: '#000000', fade: true },
  { text: 'There were Four.', bg: '#111111', fade: true },
  { text: 'LIFE — Expansion. Growth. Possibility.', bg: '#112211', color: '#88FF88', spirits: ['life'] },
  { text: 'MERCY — Restraint. Compassion. Forgiveness.', bg: '#111122', color: '#8888FF', spirits: ['life', 'mercy'] },
  { text: 'DEATH — Closure. Endings. Necessary silence.', bg: '#1a1a1a', color: '#AAAAAA', spirits: ['life', 'mercy', 'death'] },
  { text: 'And then — EVIL. Opposition. The pressure against existence.', bg: '#1a0011', color: '#FF44FF', spirits: ['life', 'mercy', 'death', 'evil'] },
  { text: '"Why must anything exist at all?"', bg: '#0a0011', color: '#CC00CC', emphasis: true },
  { text: 'Evil compresses. He condenses. He pulls inward.', bg: '#110000', color: '#FF2222', shake: true },
  { text: 'Life splinters. Mercy fractures. Death cracks.', bg: '#220000', color: '#FF4444', shake: true, flash: true },
  { text: 'Their fragments scatter across the forming universe...', bg: '#000022', color: '#4466FF', particles: true },
  { text: 'Into stars. Into planets. Into blood.', bg: '#001133', color: '#6688FF', particles: true },
  { text: 'A broken echo. A new force. ELEMENT 6.', bg: '#110033', color: '#AA44FF', glow: true },
  { text: 'And when humanity grows intelligent enough—', bg: '#0a0a1a', fade: true },
  { text: 'The awakenings begin.', bg: '#000000', color: '#FFD700', glow: true, final: true },
];

export default function PrologueCutscene({ onComplete, onBack }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [skip, setSkip] = useState(false);
  const canvasRef = useRef(null);

  const scene = SCENES[sceneIdx];

  useEffect(() => {
    setOpacity(0);
    const fadeIn = setTimeout(() => setOpacity(1), 100);
    const advance = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        if (sceneIdx < SCENES.length - 1) {
          setSceneIdx(s => s + 1);
        } else {
          onComplete();
        }
      }, 600);
    }, 3500);

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(advance);
    };
  }, [sceneIdx]);

  // Canvas animation for spirit/particle scenes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let running = true;

    const spiritColors = {
      life: '#44FF44',
      mercy: '#4488FF',
      death: '#AAAAAA',
      evil: '#FF00FF',
    };

    const particles = [];
    if (scene.particles) {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * 800,
          y: Math.random() * 500,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          color: ['#FF4444', '#44FF44', '#4488FF', '#FFDD44'][Math.floor(Math.random() * 4)],
        });
      }
    }

    const loop = () => {
      if (!running) return;
      frame++;
      ctx.clearRect(0, 0, 800, 500);

      // Draw spirits
      if (scene.spirits) {
        scene.spirits.forEach((s, i) => {
          const angle = (frame * 0.02) + (i * Math.PI * 2) / scene.spirits.length;
          const cx = 400 + Math.cos(angle) * 120;
          const cy = 250 + Math.sin(angle) * 60;
          const col = spiritColors[s];

          if (s === 'evil') {
            // Evil is darker, pulsing
            ctx.shadowColor = col;
            ctx.shadowBlur = 20 + Math.sin(frame * 0.1) * 10;
            ctx.fillStyle = col;
            ctx.beginPath();
            const wobble = Math.sin(frame * 0.05) * 5;
            ctx.ellipse(cx + wobble, cy, 25, 35, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(cx + wobble - 6, cy - 8, 3, 0, Math.PI * 2);
            ctx.arc(cx + wobble + 6, cy - 8, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.shadowColor = col;
            ctx.shadowBlur = 15;
            ctx.fillStyle = col + '88';
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        });
      }

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 800;
        if (p.x > 800) p.x = 0;
        if (p.y < 0) p.y = 500;
        if (p.y > 500) p.y = 0;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Flash effect
      if (scene.flash && frame % 30 < 3) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(0, 0, 800, 500);
      }

      // Glow center effect
      if (scene.glow) {
        const grad = ctx.createRadialGradient(400, 250, 10, 400, 250, 200);
        const glowCol = scene.color || '#FFD700';
        grad.addColorStop(0, glowCol + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 500);
      }

      requestAnimationFrame(loop);
    };

    loop();
    return () => { running = false; };
  }, [sceneIdx]);

  return (
    <div
      className="relative w-[800px] h-[500px] overflow-hidden rounded-xl border-2 border-border cursor-pointer select-none"
      style={{ backgroundColor: scene.bg }}
      onClick={() => {
        if (sceneIdx < SCENES.length - 1) setSceneIdx(s => s + 1);
        else onComplete();
      }}
    >
      <canvas ref={canvasRef} width={800} height={500} className="absolute inset-0" />

      <div
        className={`absolute inset-0 flex items-center justify-center p-12 transition-opacity duration-500 ${scene.shake ? 'animate-pulse' : ''}`}
        style={{ opacity }}
      >
        <p
          className={`text-center font-heading leading-relaxed ${scene.emphasis ? 'text-3xl italic' : scene.final ? 'text-4xl' : 'text-xl'}`}
          style={{ color: scene.color || '#FFFFFF', textShadow: `0 0 20px ${scene.color || '#FFFFFF'}44` }}
        >
          {scene.text}
        </p>
      </div>

      <div className="absolute bottom-4 right-4 text-muted-foreground text-xs font-body">
        Click to continue • {sceneIdx + 1}/{SCENES.length}
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        {onBack && (
          <button
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            className="text-muted-foreground hover:text-foreground text-xs font-body px-3 py-1 rounded border border-border/50"
          ><GameIcon emoji="←" size={14} /> Menu</button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="text-muted-foreground hover:text-foreground text-xs font-body px-3 py-1 rounded border border-border/50"
        >SKIP</button>
      </div>
    </div>
  );
}