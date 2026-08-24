// Grand Circuit VS Scene — diagonal standoff before matches and defeat screen.
// Uses the actual in-game character renderer (drawStickman) at large scale.

import React, { useRef, useEffect } from 'react';
import { ALL_CHARS_MAP } from './allCharacters.js';
import { drawStickman } from './renderer.js';
import { drawStageBackground } from './stageBackgrounds.js';

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return { r: 100, g: 100, b: 200 };
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex, a) { const c = hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }

const W = 1280, H = 720;

export default function GCVersusScene({ p1Char, p2Char, mode = 'versus', winner = null, onContinue, autoAdvance = true }) {
  const canvasRef = useRef(null);
  const c1 = ALL_CHARS_MAP[p1Char] || ALL_CHARS_MAP['yellow'];
  const c2 = ALL_CHARS_MAP[p2Char] || ALL_CHARS_MAP['purple'];
  const col1 = c1.color || '#FFD700';
  const col2 = c2.color || '#9933FF';

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Split City backdrop
      drawStageBackground(ctx, W, H, frame, 'splitcity');

      // Diagonal split — left half = col1 tint, right half = col2 tint
      const splitX = W / 2;
      const grad1 = ctx.createLinearGradient(0, 0, splitX, H);
      grad1.addColorStop(0, rgba(col1, mode === 'defeat' && winner === p2Char ? 0.08 : 0.22));
      grad1.addColorStop(1, rgba(col1, mode === 'defeat' && winner === p2Char ? 0.03 : 0.08));
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(splitX, 0); ctx.lineTo(splitX + 100, H); ctx.lineTo(0, H);
      ctx.closePath(); ctx.fill();

      const grad2 = ctx.createLinearGradient(splitX, 0, W, H);
      grad2.addColorStop(0, rgba(col2, mode === 'defeat' && winner === p1Char ? 0.03 : 0.08));
      grad2.addColorStop(1, rgba(col2, mode === 'defeat' && winner === p1Char ? 0.08 : 0.22));
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(splitX + 100, H);
      ctx.closePath(); ctx.fill();

      // Diagonal split line
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(splitX, 0); ctx.lineTo(splitX + 100, H);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Characters — actual in-game stickman at large scale ──
      const p1Scale = mode === 'defeat' && winner === p1Char ? 5.0 : mode === 'defeat' && winner === p2Char ? 3.0 : 4.0;
      const p2Scale = mode === 'defeat' && winner === p2Char ? 5.0 : mode === 'defeat' && winner === p1Char ? 3.0 : 4.0;
      const p1Alpha = mode === 'defeat' && winner === p2Char ? 0.3 : 1;
      const p2Alpha = mode === 'defeat' && winner === p1Char ? 0.3 : 1;

      // P1 glow
      ctx.save();
      ctx.globalAlpha = p1Alpha * 0.5;
      const glow1 = ctx.createRadialGradient(280, 480, 20, 280, 480, 200);
      glow1.addColorStop(0, rgba(col1, 0.35));
      glow1.addColorStop(1, rgba(col1, 0));
      ctx.fillStyle = glow1;
      ctx.beginPath(); ctx.arc(280, 480, 200, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // P1 character
      ctx.save();
      ctx.globalAlpha = p1Alpha;
      drawStickman(ctx, 280, 580, col1, 1, frame, p1Scale, c1?.isSpirit, 'idle', c1, null);
      ctx.restore();

      // P2 glow
      ctx.save();
      ctx.globalAlpha = p2Alpha * 0.5;
      const glow2 = ctx.createRadialGradient(1000, 480, 20, 1000, 480, 200);
      glow2.addColorStop(0, rgba(col2, 0.35));
      glow2.addColorStop(1, rgba(col2, 0));
      ctx.fillStyle = glow2;
      ctx.beginPath(); ctx.arc(1000, 480, 200, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // P2 character
      ctx.save();
      ctx.globalAlpha = p2Alpha;
      drawStickman(ctx, 1000, 580, col2, -1, frame, p2Scale, c2?.isSpirit, 'idle', c2, null);
      ctx.restore();

      // VS / DEFEAT text
      ctx.textAlign = 'center';
      if (mode === 'defeat') {
        const wc = winner === p1Char ? col1 : col2;
        const wName = (winner === p1Char ? c1 : c2).name;
        ctx.shadowColor = wc; ctx.shadowBlur = 30;
        ctx.fillStyle = wc;
        ctx.font = 'bold 64px Orbitron, sans-serif';
        ctx.fillText('DEFEAT', W / 2, 100);
        ctx.font = 'bold 28px Orbitron, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(wName.toUpperCase() + ' WINS', W / 2, 140);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowColor = '#FF4444'; ctx.shadowBlur = 25;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 80px Orbitron, sans-serif';
        ctx.fillText('VS', W / 2, H / 2 + 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = col1; ctx.shadowColor = col1; ctx.shadowBlur = 15;
        ctx.font = 'bold 32px Orbitron, sans-serif';
        ctx.fillText(c1.name.toUpperCase(), 280, 660);
        ctx.fillStyle = col2; ctx.shadowColor = col2;
        ctx.fillText(c2.name.toUpperCase(), 1000, 660);
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(render);
    };
    render();

    if (autoAdvance && mode === 'versus') {
      const t = setTimeout(() => onContinue?.(), 2500);
      return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative flex flex-col items-center w-full">
      <canvas ref={canvasRef} width={W} height={H}
        className="border-2 border-border rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }} />
      {mode === 'defeat' && (
        <button onClick={onContinue} className="mt-3 px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">CONTINUE</button>
      )}
      {mode === 'versus' && autoAdvance && (
        <p className="mt-2 text-sm text-muted-foreground font-body animate-pulse">Loading match...</p>
      )}
    </div>
  );
}