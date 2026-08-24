import React from 'react';
import GameIcon from "./GameIcon.jsx";

// Post-match summary shown after every tournament match (played, watched,
// simulated, sim-rest, or end-now): final score + goal timeline.
export default function TournamentMatchSummary({ homeChar, awayChar, homeScore, awayScore, goalLog = [], subtitle, humanHome, humanAway, onContinue }) {
  const sorted = [...goalLog].sort((a, b) => (a.second || 0) - (b.second || 0));
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      <h2 className="text-2xl font-heading text-accent tracking-wider">FULL TIME</h2>
      {subtitle && <p className="text-sm text-muted-foreground font-heading">{subtitle}</p>}
      <div className="flex items-center gap-6 bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full" style={{ backgroundColor: homeChar?.color }} />
          <span className="font-heading text-xs">{homeChar?.name}</span>
          {humanHome && <span className="text-[8px] text-accent"><GameIcon emoji="★" size={14} /></span>}
        </div>
        <span className="text-5xl font-heading text-accent">{homeScore} - {awayScore}</span>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full" style={{ backgroundColor: awayChar?.color }} />
          <span className="font-heading text-xs">{awayChar?.name}</span>
          {humanAway && <span className="text-[8px] text-accent"><GameIcon emoji="★" size={14} /></span>}
        </div>
      </div>
      <div className="w-full max-w-md">
        <p className="text-xs font-heading text-muted-foreground mb-2 text-center">GOAL TIMELINE</p>
        <div className="bg-card border border-border rounded-lg p-3 max-h-56 overflow-y-auto">
          {sorted.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No goals scored</p>}
          {sorted.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-0.5">
              <span className="font-heading text-accent w-12">{g.second}'</span>
              <span style={{ color: g.team === 'home' ? homeChar?.color : awayChar?.color }}><GameIcon emoji="●" size={14} /></span>
              <span className="font-body">{g.team === 'home' ? homeChar?.name : awayChar?.name} scored</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onContinue} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">CONTINUE <GameIcon emoji="→" size={14} /></button>
    </div>
  );
}