import React from 'react';
import { GAME_MODES } from './PlatformFighter.jsx';
import GameIcon from "./GameIcon.jsx";

export default function ModeSelect({ onPick, onBack }) {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">SELECT GAME MODE</h2>
          <p className="text-xs text-muted-foreground font-body">Choose how you want to fight, then pick your fighters.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GAME_MODES.filter(m => !['custom', 'hp', 'shapeshift'].includes(m.id)).map(m => (
          <button key={m.id} onClick={() => onPick(m.id)}
            className="text-left bg-card border border-border rounded-xl p-4 hover:border-accent hover:bg-accent/5 transition group">
            <p className="font-heading text-base text-foreground group-hover:text-accent">{m.name}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{m.desc}</p>
          </button>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <p className="font-heading text-sm text-primary mb-2">TOURNAMENTS &amp; TEAMS</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={() => onPick('tournament')}
            className="text-left bg-card border border-border rounded-xl p-4 hover:border-accent hover:bg-accent/5 transition group">
            <p className="font-heading text-base text-foreground group-hover:text-accent">Tournament</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Single-elimination bracket against AI opponents.</p>
          </button>
          <button onClick={() => onPick('grandcircuit')}
            className="text-left bg-card border-2 border-accent/40 rounded-xl p-4 hover:border-accent hover:bg-accent/10 transition group">
            <p className="font-heading text-base text-foreground group-hover:text-accent">The Grand Circuit</p>
            <p className="text-xs text-muted-foreground font-body mt-1">32-player single-elimination tournament. 2 stocks, 500% KO, reduced knockback.</p>
          </button>
          <button onClick={() => onPick('team')}
            className="text-left bg-card border border-border rounded-xl p-4 hover:border-accent hover:bg-accent/5 transition group">
            <p className="font-heading text-base text-foreground group-hover:text-accent">2v2 Teams</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Team battle with a CPU teammate vs 2 CPUs.</p>
          </button>
          <button onClick={() => onPick('shapeshift')}
            className="text-left bg-card border-2 border-primary/40 rounded-xl p-4 hover:border-primary hover:bg-primary/10 transition group">
            <p className="font-heading text-base text-foreground group-hover:text-primary">Shapeshift</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Pick 3 fighters — press SUPER to morph mid-fight. Stocks & damage persist, supers disabled.</p>
          </button>
        </div>
      </div>

    </div>
  );
}