import React from 'react';
import GameIcon from "./GameIcon.jsx";

const CONTROLS = [
  { section: 'PLAYER 1', color: '#FFD700', items: [
    { key: '← →', action: 'Move' },
    { key: <GameIcon emoji="↑" size={14} />, action: 'Jump / Double Jump' },
    { key: <GameIcon emoji="↓" size={14} />, action: 'Fast Fall' },
    { key: ', (comma)', action: 'Signature Attack' },
    { key: ', + ↑ (air)', action: 'Recovery Attack' },
    { key: '. (period)', action: 'Activate Power' },
    { key: 'L', action: 'Side Heavy Attack' },
    { key: 'L + ↓', action: 'Down Heavy / Ground Pound' },
    { key: '/ (slash)', action: 'Super Move' },
    { key: 'Esc / P', action: 'Pause' },
    ]},
    { section: 'PLAYER 2', color: '#44AAFF', items: [
    { key: 'A D', action: 'Move' },
    { key: 'W', action: 'Jump / Double Jump' },
    { key: 'S', action: 'Fast Fall' },
    { key: 'V', action: 'Signature Attack' },
    { key: 'V + ↑ (air)', action: 'Recovery Attack' },
    { key: 'C', action: 'Activate Power' },
    { key: 'G', action: 'Side Heavy Attack' },
    { key: 'G + ↓', action: 'Down Heavy / Ground Pound' },
    { key: 'X', action: 'Super Move' },
    { key: 'Esc / P', action: 'Pause' },
    ]},
];

export default function PauseMenu({ onResume, onQuit, tournamentMode = false, onSimRest, onEndNow }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg z-20 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-8 w-[520px] shadow-2xl">
        <h2 className="text-3xl font-heading text-center text-foreground mb-1 tracking-widest">PAUSED</h2>
        <div className="w-24 h-0.5 bg-primary mx-auto mb-6 rounded" />

        <div className="grid grid-cols-2 gap-6 mb-6">
          {CONTROLS.map(group => (
            <div key={group.section}>
              <h3 className="font-heading text-sm tracking-wider mb-3" style={{ color: group.color }}>
                {group.section}
              </h3>
              <div className="space-y-1.5">
                {group.items.map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span className="bg-secondary text-secondary-foreground font-body text-xs px-2 py-0.5 rounded min-w-[80px] text-center">
                      {item.key}
                    </span>
                    <span className="text-muted-foreground font-body text-xs">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={onResume}
            className="px-8 py-3 bg-primary text-primary-foreground font-heading text-sm rounded-lg hover:opacity-90 transition tracking-wider"
          >
            RESUME
          </button>
          {tournamentMode ? (
            <>
              <button
                onClick={onSimRest}
                className="px-6 py-3 bg-primary/70 text-primary-foreground font-heading text-sm rounded-lg hover:opacity-90 transition tracking-wider"
              >
                SIM REST OF GAME
              </button>
              <button
                onClick={onEndNow}
                className="px-6 py-3 bg-destructive text-destructive-foreground font-heading text-sm rounded-lg hover:opacity-90 transition tracking-wider"
              >
                END GAME NOW
              </button>
              </>
              ) : (
                <button
                  onClick={onQuit}
                  className="px-8 py-3 bg-secondary text-secondary-foreground font-heading text-sm rounded-lg hover:opacity-80 transition tracking-wider"
                >
                  QUIT
                </button>
              )}
        </div>
      </div>
    </div>
  );
}