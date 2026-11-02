import React from 'react';
import { GAME_MODES } from './PlatformFighter.jsx';
import GameIcon from './GameIcon.jsx';

const MODE_MARKS = {
  regular: '⚔', time: '◷', sudden: '✦', ranked: '♛', coin: '◆', brawl: '✹',
  challenge: '⬡', botbattle: '◎', lowgravity: '↟', tournament: '♜',
  grandcircuit: '✧', team: '◈', shapeshift: '⟳',
};

function ModeTile({ mode, onPick, index, featured = false }) {
  return (
    <button
      key={mode.id}
      onClick={() => onPick(mode.id)}
      className={`e6-mode-tile group ${featured ? 'e6-mode-tile-featured' : ''}`}
      aria-label={`Select ${mode.name}: ${mode.desc}`}
    >
      <span className="e6-mode-tile-mark" aria-hidden="true">{MODE_MARKS[mode.id] || '✧'}</span>
      <span className="e6-mode-tile-content">
        <span className="e6-mode-tile-kicker">MODE {String(index + 1).padStart(2, '0')}</span>
        <span className="e6-mode-tile-title">{mode.name}</span>
        <span className="e6-mode-tile-description">{mode.desc}</span>
      </span>
      <span className="e6-mode-tile-action">SELECT <span aria-hidden="true">→</span></span>
    </button>
  );
}

export default function ModeSelect({ onPick, onBack }) {
  const standardModes = GAME_MODES.filter(m => !['custom', 'hp', 'shapeshift'].includes(m.id));
  const featuredModes = [
    { id: 'tournament', name: 'Tournament', desc: 'Single-elimination bracket against AI opponents.' },
    { id: 'grandcircuit', name: 'The Grand Circuit', desc: '32-player elimination. 2 stocks, 500% KO, reduced knockback.' },
    { id: 'team', name: '2v2 Teams', desc: 'Team battle with a CPU teammate against two CPU opponents.' },
    { id: 'shapeshift', name: 'Shapeshift', desc: 'Pick three fighters and morph mid-fight. Stocks and damage persist; supers are disabled.' },
  ];

  return (
    <main className="e6-mode-browser w-full max-w-5xl flex flex-col gap-6">
      <header className="e6-mode-browser-header">
        <div>
          <p className="e6-screen-eyebrow">ELEMENT 6 · FIGHT PLAYLIST</p>
          <h2 className="text-3xl font-heading text-accent tracking-wider">CHOOSE YOUR ARENA</h2>
          <p className="text-sm text-muted-foreground font-body mt-2">Pick a ruleset. Your fighter selection comes next.</p>
        </div>
        <button onClick={onBack} className="e6-back-button"><GameIcon emoji="←" size={16} /> BACK</button>
      </header>

      <section aria-labelledby="standard-modes-title" className="e6-mode-section">
        <div className="e6-mode-section-heading">
          <div><p className="e6-screen-eyebrow">QUICK PLAY</p><h3 id="standard-modes-title">Standard modes</h3></div>
          <span>{standardModes.length} RULESETS</span>
        </div>
        <div className="e6-mode-grid">
          {standardModes.map((mode, index) => <ModeTile key={mode.id} mode={mode} index={index} onPick={onPick} />)}
        </div>
      </section>

      <section aria-labelledby="special-modes-title" className="e6-mode-section e6-mode-section-featured">
        <div className="e6-mode-section-heading">
          <div><p className="e6-screen-eyebrow">BRACKETS · SQUADS · SPECIAL RULES</p><h3 id="special-modes-title">Featured playlists</h3></div>
          <span>EVENT PLAY</span>
        </div>
        <div className="e6-mode-grid e6-mode-grid-featured">
          {featuredModes.map((mode, index) => <ModeTile key={mode.id} mode={mode} index={index} onPick={onPick} featured />)}
        </div>
      </section>
    </main>
  );
}
