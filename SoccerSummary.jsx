import React from 'react';

export default function SoccerSummary({ result, score, teamMode, p1Name, p2Name, onContinue, onRematch }) {
  const p1Won = result?.p1Won;
  const blue = score?.p1 ?? 0;
  const purple = score?.p2 ?? 0;
  const decided = p1Won === true || p1Won === false;
  const winnerLabel = !decided ? 'DRAW' : (p1Won ? (teamMode ? 'TEAM BLUE' : (p1Name || 'BLUE')) : (teamMode ? 'TEAM PURPLE' : (p2Name || 'PURPLE')));
  const winnerColor = !decided ? '#FFD700' : (p1Won ? '#4488FF' : '#AA44FF');

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-5 bg-card border border-border rounded-2xl p-8">
      <h2 className="text-2xl font-heading text-accent tracking-wider">FULL TIME</h2>
      <div className="text-4xl font-heading text-center" style={{ color: winnerColor }}>
        {winnerLabel}{decided ? ' WINS!' : ''}
      </div>
      <div className="flex items-center gap-8 my-2">
        <div className="flex flex-col items-center">
          <span className="text-xs font-heading" style={{ color: '#4488FF' }}>{teamMode ? 'TEAM BLUE' : 'BLUE'}</span>
          <span className="text-6xl font-heading" style={{ color: '#4488FF' }}>{blue}</span>
        </div>
        <span className="text-3xl font-heading text-muted-foreground">—</span>
        <div className="flex flex-col items-center">
          <span className="text-xs font-heading" style={{ color: '#AA44FF' }}>{teamMode ? 'TEAM PURPLE' : 'PURPLE'}</span>
          <span className="text-6xl font-heading" style={{ color: '#AA44FF' }}>{purple}</span>
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={onRematch} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading hover:opacity-80">REMATCH</button>
        <button onClick={onContinue} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading hover:opacity-90">CONTINUE</button>
      </div>
    </div>
  );
}