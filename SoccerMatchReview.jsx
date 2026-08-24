import React, { useState, useEffect } from 'react';

export function calculateSoccerXP(s, won) {
  if (!s) return 10;
  return 10 + (won ? 15 : 0) + (s.goals || 0) * 3 + (s.saves || 0) * 5 + (s.shotsOnTarget || 0) * 1 + Math.floor((s.possession || 0) / 600);
}

export default function SoccerMatchReview({ stats, p1Name, p2Name, p1Color, p2Color, p1Won, onContinue, onRematch }) {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowStats(true), 300);
    return () => clearTimeout(t);
  }, []);

  const s1 = stats?.p1 || { shots: 0, shotsOnTarget: 0, goals: 0, misses: 0, saves: 0, possession: 0 };
  const s2 = stats?.p2 || { shots: 0, shotsOnTarget: 0, goals: 0, misses: 0, saves: 0, possession: 0 };
  const totalPoss = (s1.possession || 0) + (s2.possession || 0) || 1;
  const p1Poss = Math.round((s1.possession / totalPoss) * 100);
  const p2Poss = 100 - p1Poss;

  const decided = p1Won === true || p1Won === false;
  const winnerColor = !decided ? '#FFD700' : p1Won ? p1Color : p2Color;
  const winnerLabel = !decided ? 'DRAW' : p1Won ? p1Name : p2Name;

  const rows = [
    { label: '⚽ Goals', p1: s1.goals || 0, p2: s2.goals || 0 },
    { label: '🎯 Shots', p1: s1.shots || 0, p2: s2.shots || 0 },
    { label: '✓ On Target', p1: s1.shotsOnTarget || 0, p2: s2.shotsOnTarget || 0 },
    { label: '✗ Misses', p1: s1.misses || 0, p2: s2.misses || 0 },
    { label: '🧤 Saves', p1: s1.saves || 0, p2: s2.saves || 0 },
    { label: '⏱ Possession', p1: `${p1Poss}%`, p2: `${p2Poss}%` },
  ];

  const p1XP = calculateSoccerXP(s1, p1Won === true);
  const p2XP = calculateSoccerXP(s2, p1Won === false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at top, #14172a 0%, #0a0b16 50%, #050310 100%)' }}>
      <div className="w-full max-w-2xl flex flex-col gap-4 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-heading text-accent tracking-wider">FULL TIME</h2>
          {decided && <p className="text-2xl font-heading mt-2" style={{ color: winnerColor }}>{winnerLabel} WINS!</p>}
        </div>

        {/* Stats table */}
        <div className="bg-card/80 border border-border rounded-xl p-4 overflow-hidden" style={{ opacity: showStats ? 1 : 0, transition: 'opacity 0.5s' }}>
          <div className="grid grid-cols-3 gap-2 mb-3 pb-2 border-b border-border">
            <div className="text-center">
              <p className="font-heading text-sm" style={{ color: p1Color }}>{p1Name}</p>
              <p className="text-[8px] font-heading text-muted-foreground">+{p1XP} XP</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-heading text-muted-foreground">STAT</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-sm" style={{ color: p2Color }}>{p2Name}</p>
              <p className="text-[8px] font-heading text-muted-foreground">+{p2XP} XP</p>
            </div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
              <div className="text-center font-heading text-lg" style={{ color: p1Color }}>{r.p1}</div>
              <div className="text-center text-[10px] font-body text-muted-foreground flex items-center justify-center">{r.label}</div>
              <div className="text-center font-heading text-lg" style={{ color: p2Color }}>{r.p2}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          {onRematch && <button onClick={onRematch} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading hover:opacity-80">REMATCH</button>}
          <button onClick={onContinue} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-90">CONTINUE</button>
        </div>
      </div>
    </div>
  );
}