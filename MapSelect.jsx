import React, { useState, useRef, useEffect } from 'react';
import { STAGE_MAPS, drawStickman } from './renderer.js';
import { ALL_CHARS_MAP } from './allCharacters.js';
import GameIcon from "./GameIcon.jsx";

export default function MapSelect({ onPick, onBack, p1Id, p2Id, customCharsData = {}, customStages = [], customStageMetas = [], eventStage = null }) {
  const previewRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const c = previewRef.current; if (!c) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const c1 = customCharsData[p1Id] || ALL_CHARS_MAP[p1Id];
    const c2 = customCharsData[p2Id] || ALL_CHARS_MAP[p2Id];
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, 300, 120);
      const g = ctx.createLinearGradient(0, 0, 0, 120);
      g.addColorStop(0, '#0a0820'); g.addColorStop(1, '#12163a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 300, 120);
      ctx.fillStyle = '#334066'; ctx.fillRect(0, 90, 300, 12);
      if (c1) drawStickman(ctx, 90, 90, c1.color, 1, f, 1.1, c1.isSpirit, 'idle', c1);
      ctx.fillStyle = '#FF4444'; ctx.font = 'bold 16px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText('VS', 150, 70);
      if (c2) drawStickman(ctx, 210, 90, c2.color, -1, f, 1.1, c2.isSpirit, 'idle', c2);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [p1Id, p2Id]);

  const q = query.trim().toLowerCase();
  const filteredMaps = STAGE_MAPS.filter(m => !q || m.name.toLowerCase().includes(q));
  const filteredCustom = customStages.map((s, i) => ({ s, i, meta: customStageMetas[i] || {} }))
    .filter(({ s, i, meta }) => !q || (meta.name || `Custom Stage ${i + 1}`).toLowerCase().includes(q));

  const pickRandomMap = () => {
    const pool = STAGE_MAPS.filter(m => !q || m.name.toLowerCase().includes(q));
    if (pool.length > 0) onPick(pool[Math.floor(Math.random() * pool.length)].id);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">SELECT MAP</h2>
          <p className="text-xs text-muted-foreground font-body">Pick your battlefield.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search stages…" maxLength={28}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-body w-36" />
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>
      </div>

      <canvas ref={previewRef} width={300} height={120} className="rounded-xl border border-border w-full max-w-sm mx-auto" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button onClick={pickRandomMap}
          className="bg-card border-2 border-accent rounded-xl p-4 hover:opacity-80 transition flex flex-col items-center gap-2 col-span-2 md:col-span-3"
          style={{ borderColor: '#FFD700', background: 'linear-gradient(135deg, #FFD70015 0%, #0a0b16 50%)' }}>
          <div className="w-full h-16 rounded-lg relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #FFD70055, #04020a)' }}>
            <span className="text-3xl font-heading text-accent" style={{ textShadow: '0 0 20px #FFD700' }}>🎲 RANDOM</span>
          </div>
          <p className="font-heading text-sm text-accent">Random Stage</p>
          <span className="text-[8px] text-muted-foreground font-body">Picks a random non-custom stage</span>
        </button>
        {eventStage && (
          <button key={eventStage.id} onClick={() => onPick(eventStage.id)}
            className="bg-card border-2 rounded-xl p-4 hover:opacity-80 transition flex flex-col items-center gap-2 col-span-2 md:col-span-3"
            style={{ borderColor: eventStage.color, background: `linear-gradient(135deg, ${eventStage.color}15 0%, #0a0b16 50%)` }}>
            <div className="w-full h-20 rounded-lg relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${eventStage.color}55, #04020a)` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-heading text-white" style={{ textShadow: `0 0 20px ${eventStage.color}` }}><GameIcon emoji="★" size={14} /> EVENT STAGE <GameIcon emoji="★" size={14} /></span>
              </div>
            </div>
            <p className="font-heading text-sm" style={{ color: eventStage.color }}>{eventStage.name}</p>
            <span className="text-[8px] text-muted-foreground font-body">Only available during this event!</span>
          </button>
        )}
        {filteredMaps.map(m => (
          <button key={m.id} onClick={() => onPick(m.id)}
            className="bg-card border-2 rounded-xl p-4 hover:border-accent transition flex flex-col items-center gap-2"
            style={{ borderColor: m.accentColor + '44' }}>
            <div className="w-full h-16 rounded-lg relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${m.accentColor}55, #04020a)` }}>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded" style={{ backgroundColor: m.groundColor + '99' }} />
              <div className="absolute bottom-3 left-3 w-8 h-1.5 rounded" style={{ backgroundColor: m.groundColor + 'CC' }} />
              <div className="absolute bottom-3 right-3 w-8 h-1.5 rounded" style={{ backgroundColor: m.groundColor + 'CC' }} />
              <div className="absolute bottom-0 w-full h-2.5" style={{ backgroundColor: m.groundColor }} />
            </div>
            <p className="font-heading text-sm" style={{ color: m.accentColor }}>{m.name}</p>
          </button>
        ))}
        {filteredCustom.map(({ s, i, meta }) => {
          return (
          <button key={`custom_${i}`} onClick={() => onPick(`custom_${i}`)}
            className="bg-card border-2 border-primary rounded-xl p-4 hover:opacity-80 transition flex flex-col items-center gap-2">
            <div className="w-full h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">{meta.emoji || <GameIcon emoji="🛠️" size={14} />}</span>
            </div>
            <p className="font-heading text-sm text-primary">{meta.name || `Custom Stage ${i + 1}`}</p>
          </button>
          );
        })}
      </div>
    </div>
  );
}