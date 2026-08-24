import React from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

function formatPlaytime(sec) {
  sec = sec || 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AchievementsPanel({ progress }) {
  const stats = progress?.stats || {};
  const moveStats = progress?.moveStats || {};
  const trophies = progress?.trophies || { fight: 0, sport: 0 };

  const totalWins = Object.values(stats.wins || {}).reduce((a, b) => a + (b || 0), 0);
  const playtime = progress?.playtimeSeconds || 0;

  // Unique signature moves performed per hero (distinct move keys with > 0 usage)
  const sigMovesPerHero = ALL.map(c => {
    const ms = moveStats[c.id] || {};
    const unique = Object.entries(ms).filter(([, v]) => v > 0).length;
    return { id: c.id, name: c.name, color: c.color, unique };
  }).filter(x => x.unique > 0).sort((a, b) => b.unique - a.unique);
  const totalUniqueSigs = sigMovesPerHero.reduce((a, x) => a + x.unique, 0);

  const cards = [
    { label: 'TOTAL WINS', value: totalWins, color: 'text-accent' },
    { label: 'TOTAL PLAYTIME', value: formatPlaytime(playtime), color: 'text-primary' },
    { label: 'FIGHT TROPHIES', value: trophies.fight || 0, color: 'text-accent' },
    { label: 'SPORT TROPHIES', value: trophies.sport || 0, color: 'text-primary' },
    { label: 'UNIQUE MOVES PERFORMED', value: totalUniqueSigs, color: 'text-accent' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-heading text-muted-foreground mb-1">{c.label}</p>
            <p className={`font-heading text-2xl ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="font-heading text-xs text-muted-foreground mb-3">UNIQUE SIGNATURE MOVES PERFORMED BY EACH HERO</h4>
        {sigMovesPerHero.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">No moves tracked yet — play some matches!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sigMovesPerHero.map(h => (
              <div key={h.id} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border border-border/50">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: h.color, boxShadow: `0 0 6px ${h.color}88` }} />
                <span className="text-[10px] font-heading text-foreground flex-1 truncate">{h.name}</span>
                <span className="text-[10px] font-heading text-accent">{h.unique}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}