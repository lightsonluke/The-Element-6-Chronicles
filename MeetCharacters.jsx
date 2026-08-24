import React, { useState, useRef, useEffect } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { LORE_CHAPTERS } from './lore.js';
import { drawStickman } from './renderer.js';
import { music } from './music.js';
import { withCustomChars, getCharNumber } from './characterNumber.js';
import { ALL_CHARS, getRosterForEra, ERAS } from './allCharacters.js';
import PowerInfoCard from './PowerInfoCard.jsx';
import AchievementsPanel from './AchievementsPanel.jsx';
import GameIcon from "./GameIcon.jsx";

const BASE_ALL = ALL_CHARS;

export default function MeetCharacters({ onBack, favoriteId, onSetFavorite, progress, customCharsData = {}, customNumberMap = {} }) {
  const [category, setCategory] = useState('g5');
  const [selected, setSelected] = useState(HEROES[0]);
  const canvasRef = useRef(null);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const ALL = withCustomChars(BASE_ALL, customCharsData, customNumberMap);
  const customChars = Object.values(customCharsData).filter(c => c && c.isCustom).sort((a, b) => (getCharNumber(a.id, customNumberMap) ?? 99) - (getCharNumber(b.id, customNumberMap) ?? 99));
  const catTabs = [
    ...ERAS,
    { id: 'custom', name: 'Custom', short: 'CUSTOM', accent: '#FF66AA' },
    { id: 'achievements', name: 'Achievements', short: <GameIcon emoji="🏆" size={14} />, accent: '#FFD700' },
  ];
  const items = category === 'custom' ? customChars : category === 'achievements' ? [] : getRosterForEra(category);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    const ctx = canvas.getContext('2d');
    let frame = 0, running = true;
    const W = 280, H = 280;

    const loop = () => {
      if (!running) return;
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Backdrop gradient
      const grad = ctx.createRadialGradient(W / 2, H * 0.5, 10, W / 2, H * 0.5, W * 0.8);
      grad.addColorStop(0, selected.color + '33');
      grad.addColorStop(0.5, selected.color + '11');
      grad.addColorStop(1, '#04020a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Animated energy rings
      for (let r = 1; r <= 5; r++) {
        const radius = 25 + r * 20 + Math.sin(frame * 0.04 + r) * 5;
        ctx.beginPath();
        ctx.arc(W / 2, H * 0.45, radius, 0, Math.PI * 2);
        ctx.strokeStyle = selected.color + Math.floor((0.06 + r * 0.03) * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Floating particles
      for (let i = 0; i < 16; i++) {
        const px = W / 2 + Math.cos(frame * 0.015 * (i % 3 + 1) + i * 0.9) * (40 + i * 6);
        const py = H * 0.45 + Math.sin(frame * 0.02 * (i % 2 + 1) + i * 1.1) * (25 + i * 4);
        const alpha = 0.3 + Math.sin(frame * 0.05 + i) * 0.2;
        ctx.fillStyle = selected.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.sin(frame * 0.03 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground line
      ctx.strokeStyle = selected.color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, H * 0.72 + 2); ctx.lineTo(W - 20, H * 0.72 + 2); ctx.stroke();

      // Character
      drawStickman(ctx, W / 2, H * 0.72, selected.color, 1, frame, 2.2, selected.isSpirit, 'idle', selected);

      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [selected]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center w-full">
        <div>
          <h2 className="text-2xl font-heading text-foreground tracking-wider">MEET THE CHARACTERS</h2>
          <p className="text-xs text-muted-foreground font-body">Legends of the Element 6 — heroes, villains, and cosmic guardians</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center">
        {catTabs.map(t => (
          <button key={t.id} onClick={() => { setCategory(t.id); if (t.id === 'achievements') return; setSelected((t.id === 'custom' ? customChars : getRosterForEra(t.id))[0] || HEROES[0]); }}
            className="px-3 py-1.5 rounded font-heading text-[10px] uppercase border-2 transition"
            style={category === t.id ? {
              backgroundColor: t.accent, borderColor: t.accent, color: '#fff',
              boxShadow: `0 0 10px ${t.accent}66`,
            } : { backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            {t.short}
          </button>
        ))}
      </div>

      {category === 'achievements' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-heading text-accent tracking-wider">ACHIEVEMENTS</h2>
            <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
          </div>
          <AchievementsPanel progress={progress} />
        </div>
      )}

      {category !== 'achievements' && (
      <div className="flex gap-4 w-full">
        {/* Character list */}
        <div className="grid grid-cols-4 gap-1.5 w-64 max-h-[440px] overflow-y-auto p-1">
          {items.length === 0 && category === 'custom' && (
            <p className="col-span-4 text-center text-xs text-muted-foreground font-body p-4">No custom characters yet. Create one in the Character Creator!</p>
          )}
          {items.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`flex flex-col items-center p-2 rounded-lg border transition hover:scale-105 ${selected?.id === c.id ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'}`}>
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 10px ${c.color}88` }} />
              <span className="text-[8px] font-heading text-foreground mt-1 text-center leading-tight">{c.id === favoriteId ? '★ ' : ''}{c.name}</span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 rounded-xl p-5 border border-border overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${selected.color}0a 0%, #04020a 60%)` }}>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <canvas ref={canvasRef} width={280} height={280}
                  className="rounded-xl border-2"
                  style={{ borderColor: selected.color + '66' }}
                />
                <p className="text-[9px] text-center font-body mt-1" style={{ color: selected.color }}>CHARACTER PREVIEW</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading text-2xl" style={{ color: selected.color, textShadow: `0 0 15px ${selected.color}88` }}>
                    {selected.name}
                  </h3>
                  <button onClick={() => onSetFavorite?.(selected.id)}
                    className={`px-3 py-1 rounded font-heading text-xs ${selected.id === favoriteId ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}>
                    {selected.id === favoriteId ? '★ FAVORITE' : '☆ SET FAVORITE'}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground font-body mb-3 italic">"{selected.title}"</p>
                {selected.fullName && selected.fullName !== selected.name && (
                  <p className="text-xs text-muted-foreground/80 font-body mb-3">Full Name: <span className="text-foreground/90 font-heading">{selected.fullName}</span></p>
                )}

                {/* Lore — full text */}
                <div className="bg-muted/20 rounded-lg p-3 border border-border/50 mb-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-foreground/80 font-body leading-relaxed">{selected.lore || (selected.isCustom ? 'A mysterious custom creation — their story is yet to be written.' : 'No lore available.')}</p>
                </div>

                {selected.weapon && (
                  <div className="flex gap-4 mb-3 text-xs font-body">
                    <div className="bg-muted/30 rounded px-3 py-1.5 border border-border/50">
                      <span className="text-muted-foreground">Weapon: </span>
                      <span className="text-foreground font-heading">{selected.weapon}</span>
                    </div>
                    <div className="bg-muted/30 rounded px-3 py-1.5 border border-border/50">
                      <span className="text-muted-foreground">Power: </span>
                      <span className="text-foreground font-heading">{selected.power}</span>
                    </div>
                  </div>
                )}

                {/* Stats */}
                {selected.stats && (
                  <div>
                    {['speed', 'power', 'defense', 'control', 'utility'].filter(s => selected.stats[s] !== undefined).map((stat) => {
                      const val = selected.stats[stat];
                      return (
                      <div key={stat} className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-body text-muted-foreground w-16 capitalize">{stat}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${val * 10}%`, backgroundColor: selected.color, boxShadow: `0 0 4px ${selected.color}` }} />
                        </div>
                        <span className="text-[10px] font-heading w-4 tabular-nums">{val}</span>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Moves */}
            <div className="mt-3">
              <h4 className="font-heading text-xs text-muted-foreground mb-2">SIGNATURE MOVES</h4>
              <div className="grid grid-cols-2 gap-2">
                {selected.signatures && Object.entries(selected.signatures).map(([dir, sig]) => (
                  <div key={dir} className="bg-muted/30 rounded-lg p-2 border border-border/50">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-heading uppercase px-1 rounded" style={{ color: selected.color, backgroundColor: selected.color + '22' }}>{dir}</span>
                      <span className="text-[10px] font-heading text-foreground ml-1">{sig.name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-body mt-0.5">{sig.desc}</p>
                  </div>
                ))}
                {selected.superMove && (
                  <div className="rounded-lg p-2 border col-span-2" style={{ borderColor: selected.color + '55', backgroundColor: selected.color + '11' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-heading text-accent"><GameIcon emoji="⚡" size={14} /> SUPER MOVE</span>
                      <span className="text-[10px] font-heading text-foreground ml-1">{selected.superMove.name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-body">{selected.superMove.desc}</p>
                  </div>
                )}
                {selected.heavyAttack && (
                  <div className="rounded-lg p-2 border col-span-2" style={{ borderColor: selected.color + '44', backgroundColor: selected.color + '0a' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-heading text-accent"><GameIcon emoji="💥" size={14} /> HEAVY</span>
                      <span className="text-[10px] font-heading text-foreground ml-1">{selected.heavyAttack.name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-body">{selected.heavyAttack.desc}</p>
                  </div>
                )}
              </div>

              {/* Power info */}
              <div className="mt-3">
                <PowerInfoCard char={selected} />
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}