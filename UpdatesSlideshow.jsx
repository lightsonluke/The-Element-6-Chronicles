import React, { useState, useEffect } from 'react';
import { sfx } from './sfx.js';
import { UPDATES } from './updates.js';

export default function UpdatesSlideshow() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % UPDATES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const next = () => { sfx.click(); setIdx(i => (i + 1) % UPDATES.length); };
  const prev = () => { sfx.click(); setIdx(i => (i - 1 + UPDATES.length) % UPDATES.length); };
  const u = UPDATES[idx];

  return (
    <div className="w-full" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <p className="font-heading text-xs text-accent mb-1.5 text-center tracking-wider">UPDATES</p>
      <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-xl" style={{ aspectRatio: '4/3' }}>
        <div
          key={u.id}
          className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500"
          style={{ background: `linear-gradient(135deg, ${u.color}cc, ${u.color2})` }}
        >
          <span className="text-6xl mb-2 drop-shadow-lg">{u.emoji}</span>
          <h3 className="font-heading text-base text-white text-center px-4 drop-shadow">{u.title}</h3>
          <p className="text-[10px] font-body text-white/70 text-center px-4 mt-0.5">{u.date}</p>
        </div>
        <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70 transition text-sm">‹</button>
        <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70 transition text-sm">›</button>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {UPDATES.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition ${i === idx ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-body text-center mt-3 px-3 leading-snug">{u.caption}</p>
    </div>
  );
}