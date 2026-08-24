import React, { useEffect, useRef, useState } from 'react';
import { drawStickman } from './renderer.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, drawAccessory, isBehindAccessory } from './cosmetics.js';
import { getCrossoverColor } from './crossovers.js';
import { STAGE_MAPS } from './renderer.js';
import { ALL_CHARS_MAP } from './allCharacters.js';

export default function LoadingScreen({ p1Char, p2Char, mapId, gameMode, equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, equippedCrossovers = {}, onComplete }) {
  const [progress, setProgress] = useState(0);
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const FALLBACK_CHAR = { name: 'Fighter', color: '#7744FF', title: '', isSpirit: false, stats: { power: 6, speed: 6, defense: 6, utility: 6, control: 6 } };
  const char1 = customCharsData[p1Char] || ALL_CHARS_MAP[p1Char] || FALLBACK_CHAR;
  const char2 = customCharsData[p2Char] || ALL_CHARS_MAP[p2Char] || FALLBACK_CHAR;
  const mapObj = STAGE_MAPS.find(m => m.id === mapId);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => onComplete?.(), 300);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    let frame = 0, running = true;

    const drawCard = (canvas, char, isP1) => {
      if (!canvas || !char) return;
      const ctx = canvas.getContext('2d');
      const W = 200, H = 320;

      const render = () => {
        if (!running) return;
        frame++;
        ctx.clearRect(0, 0, W, H);

        // Card background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0b16');
        grad.addColorStop(0.5, '#14172a');
        grad.addColorStop(1, '#0a0b16');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Border glow
        ctx.strokeStyle = char.color + '88';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, W - 4, H - 4);

        // Emblem top
        ctx.save();
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = char.color + '22';
        ctx.beginPath();
        ctx.arc(W / 2, 35, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = char.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, 35, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Character art — crossover color takes priority over skin, which takes priority over default
        const crossoverColors = getCrossoverColor(char.id, equippedCrossovers);
        const renderColor = crossoverColors ? crossoverColors.primary : (getCharRenderColor(char.id, equippedSkins) || char.color);
        const skinParts = getSkinParts(char.id, equippedSkins);
        const acc = getAccessory(equippedAccessories[char.id]);

        ctx.save();
        // Behind layer
        skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, W / 2, 240, p.type, p.color, frame, 2.8, char.id));
        if (acc && isBehindAccessory(acc.type)) {
          const accColor = renderColor !== char.color && acc.type === 'soccer_kit' ? renderColor : acc.color;
          drawAccessory(ctx, W / 2, 240, acc.type, accColor, frame, 2.8, char.id);
        }
        // Character
        ctx.shadowColor = renderColor;
        ctx.shadowBlur = 10;
        drawStickman(ctx, W / 2, 240, renderColor, isP1 ? 1 : -1, frame, 2.8, char.isSpirit, 'idle', char);
        ctx.shadowBlur = 0;
        // Front layer
        skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, W / 2, 240, p.type, p.color, frame, 2.8, char.id));
        if (acc && !isBehindAccessory(acc.type)) {
          const accColor = renderColor !== char.color && acc.type === 'soccer_kit' ? renderColor : acc.color;
          drawAccessory(ctx, W / 2, 240, acc.type, accColor, frame, 2.8, char.id);
        }
        ctx.restore();

        // Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 10;
        ctx.fillText(char.name.toUpperCase(), W / 2, 70);
        ctx.shadowBlur = 0;

        // Title
        ctx.fillStyle = char.color + 'CC';
        ctx.font = '10px Rajdhani, sans-serif';
        ctx.fillText(char.title || '', W / 2, 84);

        // P1/P2 label
        ctx.fillStyle = isP1 ? '#FF4444' : '#4444FF';
        ctx.font = 'bold 14px Orbitron';
        ctx.fillText(gameMode === 'botbattle' ? (isP1 ? 'CPU 1' : 'CPU 2') : (isP1 ? 'P1' : 'CPU'), W / 2, 14);

        // Weapon + Power
        ctx.fillStyle = '#888899';
        ctx.font = '9px Rajdhani';
        ctx.textAlign = 'left';
        ctx.fillText(`Weapon: ${char.weapon || '—'}`, 12, 290);
        ctx.fillText(`Power: ${char.power || '—'}`, 12, 302);

        // Stat bars
        if (char.stats) {
          const stats = Object.entries(char.stats);
          stats.forEach(([stat, val], i) => {
            const sx = 12, sy = 200 + i * 8;
            ctx.fillStyle = '#333344';
            ctx.fillRect(sx, sy, 80, 4);
            ctx.fillStyle = char.color;
            ctx.fillRect(sx, sy, 80 * (val / 10), 4);
            ctx.fillStyle = '#667788';
            ctx.font = '6px Orbitron';
            ctx.fillText(stat.toUpperCase(), sx + 84, sy + 4);
          });
        }

        // Bottom banner
        ctx.fillStyle = char.color;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 50, H);
        ctx.lineTo(W / 2, H - 15);
        ctx.lineTo(W / 2 + 50, H);
        ctx.closePath();
        ctx.fill();

        requestAnimationFrame(render);
      };
      render();
    };

    drawCard(canvas1Ref.current, char1, true);
    drawCard(canvas2Ref.current, char2, false);

    return () => { running = false; };
  }, [char1, char2, equippedAccessories, equippedSkins]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at top, #1a1535 0%, #0a0820 50%, #050310 100%)' }}>

      {/* Loading banner */}
      <div className="absolute top-0 left-0 right-0 bg-card/90 border-b border-border py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4">
          <span className="font-heading text-sm text-foreground">
            {mapObj?.name || mapId || 'BATTLE'} {gameMode && gameMode !== 'regular' ? `• ${gameMode.toUpperCase()}` : ''}
          </span>
          <span className="font-heading text-sm text-accent animate-pulse">Loading... {Math.floor(progress)}%</span>
        </div>
        <div className="max-w-4xl mx-auto px-4 mt-1">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* VS cards */}
      <div className="flex items-stretch gap-6 mt-12">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-heading tracking-wider" style={{ color: char1.color, textShadow: `0 0 12px ${char1.color}88` }}>{char1.name.toUpperCase()}</span>
          <span className="text-xs font-heading tracking-wider text-muted-foreground">FIGHTER 1</span>
          <canvas ref={canvas1Ref} width={200} height={320}
            className="rounded-xl border-2 shadow-2xl"
            style={{ borderColor: char1.color + '66', boxShadow: `0 0 25px ${char1.color}33` }} />
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-px h-20 bg-border"></div>
          <span className="text-4xl font-heading text-destructive animate-pulse my-2"
            style={{ textShadow: '0 0 20px #FF4444' }}>VS</span>
          <div className="w-px h-20 bg-border"></div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-heading tracking-wider" style={{ color: char2.color, textShadow: `0 0 12px ${char2.color}88` }}>{char2.name.toUpperCase()}</span>
          <span className="text-xs font-heading tracking-wider text-muted-foreground">FIGHTER 2</span>
          <canvas ref={canvas2Ref} width={200} height={320}
            className="rounded-xl border-2 shadow-2xl"
            style={{ borderColor: char2.color + '66', boxShadow: `0 0 25px ${char2.color}33` }} />
        </div>
      </div>

      {/* Tip */}
      <div className="absolute bottom-8 max-w-md text-center">
        <p className="text-[10px] font-body text-muted-foreground">
          {gameMode === 'brawl'
            ? 'Brawl Mode: Only light attacks allowed. Use powers and supers wisely!'
            : 'Tip: Build up your super meter by landing hits, then unleash your super move!'}
        </p>
      </div>
    </div>
  );
}