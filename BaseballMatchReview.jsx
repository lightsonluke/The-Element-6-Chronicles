import React, { useState, useEffect } from 'react';
import { calculateSportXP } from './sports.js';

// Per-team post-match review for baseball. Shows runs, hits, and strikeouts
// for each side plus a per-character breakdown.
export default function BaseballMatchReview({ p1Name, p2Name, p1Color, p2Color, p1Won, p1Stats = {}, p2Stats = {}, onContinue, onRematch }) {
  const [showStats, setShowStats] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowStats(true), 200); return () => clearTimeout(t); }, []);

  const p1XP = calculateSportXP('baseball', { runs: p1Stats.runs || 0, hits: p1Stats.hits || 0, strikeouts: p1Stats.strikeouts || 0 }, p1Won === true);
  const p2XP = calculateSportXP('baseball', { runs: p2Stats.runs || 0, hits: p2Stats.hits || 0, strikeouts: p2Stats.strikeouts || 0 }, p1Won === false);

  const decided = p1Won === true || p1Won === false;
  const winnerColor = !decided ? '#FFD700' : p1Won ? p1Color : p2Color;
  const winnerLabel = !decided ? 'DRAW' : p1Won ? p1Name : p2Name;

  const StatRow = ({ label, val, color }) => (
    <div className="flex items-center justify-between text-[10px] font-body py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-heading" style={{ color }}>{val}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at top, #1a3a2a 0%, #0a1a1a 50%, #050a10 100%)' }}>
      <div className="w-full max-w-2xl flex flex-col gap-4 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-heading text-accent tracking-wider">BASEBALL — FINAL</h2>
          {decided && <p className="text-2xl font-heading mt-2" style={{ color: winnerColor }}>{winnerLabel} WINS!</p>}
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ opacity: showStats ? 1 : 0, transition: 'opacity 0.5s' }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-sm tracking-wider" style={{ color: p1Color }}>{p1Name}</span>
              <span className="text-[9px] font-heading text-muted-foreground">+{p1XP} XP</span>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <StatRow label="🏆 Runs" val={p1Stats.runs || 0} color={p1Color} />
              <StatRow label="💥 Hits" val={p1Stats.hits || 0} color={p1Color} />
              <StatRow label="🎯 Strikeouts (pitched)" val={p1Stats.strikeouts || 0} color={p1Color} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-sm tracking-wider" style={{ color: p2Color }}>{p2Name}</span>
              <span className="text-[9px] font-heading text-muted-foreground">+{p2XP} XP</span>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <StatRow label="🏆 Runs" val={p2Stats.runs || 0} color={p2Color} />
              <StatRow label="💥 Hits" val={p2Stats.hits || 0} color={p2Color} />
              <StatRow label="🎯 Strikeouts (pitched)" val={p2Stats.strikeouts || 0} color={p2Color} />
            </div>
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