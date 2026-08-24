import React, { useRef, useEffect, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { drawStickman } from './renderer.js';

const SCENES = [
  {
    title: 'THE WAR COUNCIL',
    mood: '#7700AA',
    lines: [
      'The three guardians stand before you, wounded but resolute.',
      'Life speaks softly: "You fight with the strength of a true hero."',
      'Death nods gravely: "Evil has retreated to the void. We must finish this... together."',
      'Mercy gazes into the darkness: "But first, we must find where Evil hides."',
    ],
    chars: ['life', 'death', 'mercy'],
  },
  {
    title: 'INTO THE VOID',
    mood: '#330066',
    lines: [
      'You journey through the torn rift into a realm of pure darkness.',
      'The void shifts and writhes. Evil\'s presence is everywhere... and nowhere.',
      'Life reaches out with her senses: "I cannot pinpoint Evil... but something stirs ahead."',
      'Death draws his blade: "We are close. Stay alert."',
    ],
    chars: ['life', 'death', 'mercy'],
  },
  {
    title: 'THE DISCOVERY',
    mood: '#AA00CC',
    lines: [
      'Mercy points into the gloom: "There! Two figures..."',
      'Evil and the Controller stand side by side — their powers merged and amplified.',
      'The Controller laughs: "You think defeating me once was enough? I am eternal."',
      'Evil turns, eyes burning with ancient malice: "Welcome to your end, heroes."',
      'The final battle begins!',
    ],
    chars: ['evil', 'controller'],
  },
];

export default function RiftCutscene({ heroId, onComplete, onSkip }) {
  const canvasRef = useRef(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  const scene = SCENES[sceneIdx];
  const hero = HEROES.find(h => h.id === heroId) || HEROES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0, running = true;
    const loop = () => {
      if (!running) return;
      frame++;
      const W = 800, H = 400;
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 400);
      grad.addColorStop(0, scene.mood + '55');
      grad.addColorStop(1, '#050208');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Floating void particles
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137 + frame * 0.4) % W;
        const sy = (i * 79 + frame * 0.2) % H;
        ctx.fillStyle = `rgba(170,0,204,${0.08 + Math.sin(frame * 0.04 + i) * 0.08})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }

      // Hero on the left
      ctx.globalAlpha = 0.85;
      drawStickman(ctx, W * 0.2, H * 0.62, hero.color, 1, frame, 1.8, false, 'idle', hero);
      ctx.globalAlpha = 1;

      // Scene characters on the right
      const chars = scene.chars.map(id => GUARDIANS.find(g => g.id === id) || VILLAINS.find(v => v.id === id)).filter(Boolean);
      chars.forEach((c, i) => {
        const cx = W * 0.65 + i * 70;
        const cy = H * 0.62;
        ctx.globalAlpha = 0.3 + Math.sin(frame * 0.03 + i) * 0.12;
        drawStickman(ctx, cx, cy, c.color, -1, frame + i * 10, 1.8, c.isSpirit, 'idle', c);
        ctx.globalAlpha = 1;
      });

      // Rift lightning
      if (frame % 90 < 4) {
        ctx.strokeStyle = '#CC00FF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(W * 0.5, 0);
        for (let s = 0; s < 10; s++) ctx.lineTo(W * 0.5 + (Math.random() - 0.5) * 50, s * H / 10);
        ctx.stroke(); ctx.globalAlpha = 1;
      }

      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [sceneIdx, heroId]);

  // Auto-advance lines
  useEffect(() => {
    if (lineIdx >= scene.lines.length) return;
    const t = setTimeout(() => setLineIdx(i => i + 1), 2400);
    return () => clearTimeout(t);
  }, [lineIdx, sceneIdx]);

  // Auto-advance to next scene when all lines are done (except last scene)
  useEffect(() => {
    if (lineIdx >= scene.lines.length && sceneIdx < SCENES.length - 1) {
      const t = setTimeout(() => { setSceneIdx(i => i + 1); setLineIdx(0); }, 1500);
      return () => clearTimeout(t);
    }
  }, [lineIdx, sceneIdx]);

  const isLastScene = sceneIdx === SCENES.length - 1;
  const allLinesShown = lineIdx >= scene.lines.length;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95 rounded-lg">
      <canvas ref={canvasRef} width={800} height={400} className="rounded-xl border-2 border-purple-600" style={{ maxWidth: '95%', boxShadow: '0 0 30px rgba(150,50,200,0.4)' }} />

      <h2 className="mt-4 text-xl font-heading text-purple-400 tracking-widest" style={{ textShadow: '0 0 15px rgba(150,50,200,0.6)' }}>
        {scene.title}
      </h2>

      <div className="mt-3 text-center px-8 max-w-2xl min-h-[3em]">
        <p className="text-base font-body text-foreground transition-opacity">
          {lineIdx < scene.lines.length ? scene.lines[lineIdx] : scene.lines[scene.lines.length - 1]}
        </p>
      </div>

      <div className="flex gap-4 mt-5">
        <button onClick={onSkip} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">
          SKIP ALL
        </button>
        {!isLastScene && lineIdx < scene.lines.length && (
          <button onClick={() => { setLineIdx(scene.lines.length); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">
            SKIP SCENE
          </button>
        )}
        {isLastScene && allLinesShown && (
          <button onClick={onComplete} className="px-8 py-3 bg-purple-600 text-white rounded-lg font-heading text-lg hover:opacity-90 animate-pulse" style={{ boxShadow: '0 0 20px rgba(150,50,200,0.4)' }}>
            FIGHT!
          </button>
        )}
      </div>

      {/* Scene + line progress dots */}
      <div className="flex gap-1 mt-3">
        {SCENES.map((_, si) => (
          <div key={si} className="flex gap-0.5">
            {SCENES[si].lines.map((_, li) => (
              <div key={li} className={`w-1.5 h-1.5 rounded-full ${si < sceneIdx || (si === sceneIdx && li <= lineIdx) ? 'bg-purple-400' : 'bg-muted'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}