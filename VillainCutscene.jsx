import React, { useRef, useEffect, useState } from 'react';
import { VILLAINS } from './villains.js';
import { drawStickman } from './renderer.js';

const CUTSCENE_TEXTS = {
  corpent: { lines: ['A shadow falls over Split City.', 'Corpent, the Hammer Brute, blocks your path.', 'His venom drips onto the cobblestones...'], mood: '#775533' },
  magneto: { lines: ['Magnetic fields distort the air.', 'Magneto rises, metal debris orbiting him.', 'You feel the pull of his power...'], mood: '#AAAAAA' },
  willow: { lines: ['The trees whisper your name.', 'Willow, the Forest Witch, emerges from the roots.', 'Her vines coil hungrily...'], mood: '#448833' },
  cable: { lines: ['Electricity arcs across the sky.', 'Cable descends on a bolt of lightning.', 'The grid hums with his power...'], mood: '#4488CC' },
  snodvor: { lines: ['A bitter cold freezes the ground.', 'Snodvor, the Frost Tyrant, materializes.', 'Ice crystallizes around him...'], mood: '#AADDFF' },
  kirsten: { lines: ['Heat shimmers the horizon.', 'Kirsten, the Inferno, walks through flames.', 'The air itself seems to burn...'], mood: '#FF4400' },
  volt: { lines: ['A deafening screech splits the air.', 'Volt, the Sound Terror, appears.', 'Sound waves distort reality...'], mood: '#CCAA00' },
  temple: { lines: ['The ground trembles beneath your feet.', 'Temple, the Unmaker, rises from rubble.', 'Everything he touches falls apart...'], mood: '#AA6633' },
  nightmare: { lines: ['Darkness swallows the light.', 'Nightmare, the Fear Lord, emerges from shadow.', 'Your worst fears take shape...'], mood: '#442266' },
  hazel: { lines: ['Thorns pierce through stone.', 'Hazel, the Thorn Queen, reveals herself.', 'Her garden of suffering blooms...'], mood: '#2D5A1B' },
  whami: { lines: ['Bubbles and sparks fill the air.', 'Whami, the Chaos Witch, giggles madly.', 'Her brew is unpredictable...'], mood: '#F5DEB3' },
  controller: { lines: ['Reality bends and warps.', 'The Controller descends, eyes glowing with power.', '"You are all mine to command," he whispers...'], mood: '#1A1A6A' },
  evil: { lines: ['The void tears open above you.', 'Evil, the Ancient One, emerges from the rift.', 'This is the final battle...'], mood: '#AA00CC' },
};

export default function VillainCutscene({ villainId, onContinue, onSkip }) {
  const canvasRef = useRef(null);
  const [lineIdx, setLineIdx] = useState(0);
  const villain = VILLAINS.find(v => v.id === villainId);
  const scene = CUTSCENE_TEXTS[villainId] || { lines: ['A villain approaches...', 'Prepare for battle!'], mood: '#FF4444' };

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
      grad.addColorStop(0, scene.mood + '44');
      grad.addColorStop(1, '#050208');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Particles
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137 + frame * 0.5) % W;
        const sy = (i * 79 + frame * 0.3) % H;
        ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(frame * 0.05 + i) * 0.08})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }

      // Villain silhouette
      if (villain) {
        ctx.globalAlpha = 0.3 + Math.sin(frame * 0.03) * 0.1;
        drawStickman(ctx, W / 2, H * 0.65, villain.color, -1, frame, 2.5, villain.isSpirit, 'idle', villain);
        ctx.globalAlpha = 1;
      }

      // Lightning effect
      if (frame % 80 < 5) {
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(W * 0.3, 0);
        for (let s = 0; s < 8; s++) ctx.lineTo(W * 0.3 + (Math.random()-0.5)*40, s * H / 8);
        ctx.stroke(); ctx.globalAlpha = 1;
      }

      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [villainId]);

  useEffect(() => {
    if (lineIdx >= scene.lines.length) return;
    const t = setTimeout(() => setLineIdx(i => Math.min(i + 1, scene.lines.length)), 2200);
    return () => clearTimeout(t);
  }, [lineIdx]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 rounded-lg">
      <canvas ref={canvasRef} width={800} height={400} className="rounded-xl border-2 border-border" style={{ maxWidth: '95%' }} />
      <div className="mt-6 text-center px-8 max-w-2xl">
        {villain && (
          <h2 className="text-3xl font-heading mb-2" style={{ color: villain.color, textShadow: `0 0 20px ${villain.color}` }}>
            {villain.name}
          </h2>
        )}
        {villain && <p className="text-sm font-body text-muted-foreground mb-4">{villain.title}</p>}
        <p className="text-lg font-body text-foreground min-h-[2em] transition-opacity">
          {lineIdx < scene.lines.length ? scene.lines[lineIdx] : scene.lines[scene.lines.length - 1]}
        </p>
      </div>
      <div className="flex gap-4 mt-6">
        <button onClick={onSkip} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80">
          SKIP
        </button>
        {lineIdx >= scene.lines.length - 1 && (
          <button onClick={onContinue} className="px-8 py-3 bg-destructive text-destructive-foreground rounded-lg font-heading text-lg hover:opacity-90 animate-pulse">
            FIGHT!
          </button>
        )}
      </div>
      <div className="flex gap-1 mt-2">
        {scene.lines.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i <= lineIdx ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  );
}