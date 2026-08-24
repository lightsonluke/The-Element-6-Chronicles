import React, { useState, useEffect } from 'react';
import { calculateSportXP } from './sports.js';
import GameIcon from "./GameIcon.jsx";

// Per-character post-match review. Each character gets a stat card showing
// points, assists, sets, spikes, bumps and receives. XP is computed from the
// team's aggregate spikes/digs and shown per side.
export default function VolleyballMatchReview({ p1Name, p2Name, p1Color, p2Color, p1Won, p1CharStats = [], p2CharStats = [], onContinue, onRematch }) {
  const [showStats, setShowStats] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowStats(true), 200); return () => clearTimeout(t); }, []);

  const teamTotals = (arr) => arr.reduce((a, c) => ({
    spikes: a.spikes + (c.spikes || 0), digs: a.digs + (c.digs || 0),
    sets: a.sets + (c.sets || 0), bumps: a.bumps + (c.bumps || 0),
  }), { spikes: 0, digs: 0, sets: 0, bumps: 0 });

  const t1 = teamTotals(p1CharStats);
  const t2 = teamTotals(p2CharStats);
  const p1XP = calculateSportXP('volleyball', { spikes: t1.spikes, digs: t1.digs, aces: 0 }, p1Won === true);
  const p2XP = calculateSportXP('volleyball', { spikes: t2.spikes, digs: t2.digs, aces: 0 }, p1Won === false);

  const decided = p1Won === true || p1Won === false;
  const winnerColor = !decided ? '#FFD700' : p1Won ? p1Color : p2Color;
  const winnerLabel = !decided ? 'DRAW' : p1Won ? p1Name : p2Name;

  const STAT_ROWS = [
    { key: 'points',   label: '🏆 Points' },
    { key: 'spikes',   label: '💥 Spikes' },
    { key: 'assists',  label: '🤝 Assists' },
    { key: 'sets',     label: '✋ Sets' },
    { key: 'bumps',    label: '🤲 Bumps' },
    { key: 'receives', label: '🛡 Receives' },
    { key: 'digs',     label: '🤿 Digs' },
  ];

  const CharCard = ({ c, color }) => {
    if (!c) return null;
    return (
      <div className="rounded-lg border border-border bg-background/50 p-2">
        <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-border/60">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || color, boxShadow: `0 0 6px ${(c.color || color)}aa` }} />
          <span className="font-heading text-xs tracking-wider truncate" style={{ color: c.color || color }}>{(c.name || '?').toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {STAT_ROWS.map(r => (
            <div key={r.key} className="flex items-center justify-between text-[10px] font-body">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-heading text-foreground">{c[r.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at top, #14172a 0%, #0a0b16 50%, #050310 100%)' }}>
      <div className="w-full max-w-3xl flex flex-col gap-4 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-heading text-accent tracking-wider">MATCH OVER</h2>
          {decided && <p className="text-2xl font-heading mt-2" style={{ color: winnerColor }}>{winnerLabel} WINS!</p>}
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ opacity: showStats ? 1 : 0, transition: 'opacity 0.5s' }}>
          {/* P1 team */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-sm tracking-wider" style={{ color: p1Color }}>{p1Name}</span>
              <span className="text-[9px] font-heading text-muted-foreground">+{p1XP} XP</span>
            </div>
            {p1CharStats.map((c, i) => <CharCard key={i} c={c} color={p1Color} />)}
          </div>
          {/* P2 team */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-sm tracking-wider" style={{ color: p2Color }}>{p2Name}</span>
              <span className="text-[9px] font-heading text-muted-foreground">+{p2XP} XP</span>
            </div>
            {p2CharStats.map((c, i) => <CharCard key={i} c={c} color={p2Color} />)}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {onRematch && <button onClick={onRematch} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading hover:opacity-80">REMATCH</button>}
          <button onClick={onContinue} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-90">CONTINUE</button>
        </div>
      </div>
    </div>
  );
}