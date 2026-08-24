import React from 'react';
import GameIcon from "./GameIcon.jsx";

const KO_ROUND_NAMES = { r16: 'ROUND OF 16', qf: 'QUARTER FINAL', sf: 'SEMI FINAL', final: 'FINAL' };
const KO_ROUND_ORDER = ['r16', 'qf', 'sf', 'final'];
const KO_ROUND_COUNTS = { r16: 8, qf: 4, sf: 2, final: 1 };

// Shows all played and upcoming matches in order:
//   - Group stage matches with scores (played) or "vs" (upcoming)
//   - Knockout rounds (R16, QF, SF, Final) with participants or "TBD" until decided
export default function FixturesModal({ matches, knockoutStage, charById, humanIds, onClose }) {
  const rounds = knockoutStage?.rounds || {};
  const koRounds = KO_ROUND_ORDER.map(key => {
    const roundMatches = rounds[key] || [];
    if (roundMatches.length === 0) {
      return { key, name: KO_ROUND_NAMES[key], matches: Array.from({ length: KO_ROUND_COUNTS[key] }, () => null) };
    }
    return { key, name: KO_ROUND_NAMES[key], matches: roundMatches };
  });

  const renderMatchRow = (m, label, idx) => {
    const homeChar = m ? charById(m.home) : null;
    const awayChar = m ? charById(m.away) : null;
    const homeIsHuman = m && humanIds.has(m.home);
    const awayIsHuman = m && humanIds.has(m.away);
    const played = m && m.played;
    return (
      <div key={`${label}-${idx}`} className="flex items-center gap-2 py-1 px-2 rounded text-[10px] bg-card/50 mb-0.5">
        <span className="text-muted-foreground w-20 shrink-0 text-[9px]">{label}</span>
        <div className="flex items-center gap-1 flex-1 justify-end">
          {homeChar ? (
            <>
              <span className="font-heading truncate max-w-[80px]" style={{ color: homeChar.color }}>{homeChar.name}</span>
              {homeIsHuman && <span className="text-accent"><GameIcon emoji="★" size={14} /></span>}
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: homeChar.color }} />
            </>
          ) : (
            <span className="text-muted-foreground italic">TBD</span>
          )}
        </div>
        <span className="font-heading text-accent w-14 text-center shrink-0">
          {played ? `${m.homeScore}-${m.awayScore}` : 'vs'}
        </span>
        <div className="flex items-center gap-1 flex-1">
          {awayChar ? (
            <>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: awayChar.color }} />
              {awayIsHuman && <span className="text-accent"><GameIcon emoji="★" size={14} /></span>}
              <span className="font-heading truncate max-w-[80px]" style={{ color: awayChar.color }}>{awayChar.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground italic">TBD</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-background border border-border rounded-xl p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-sm text-accent">FIXTURES</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>
        {/* Group Stage */}
        <p className="text-xs font-heading text-accent mb-1">GROUP STAGE</p>
        <div className="mb-3">
          {matches.map((m, i) => renderMatchRow(m, `${m.groupName} R${m.round + 1}`, i))}
        </div>
        {/* Knockout */}
        <p className="text-xs font-heading text-accent mb-1">KNOCKOUT STAGE</p>
        <div>
          {koRounds.map(koRound => (
            <div key={koRound.key} className="mb-2">
              <p className="text-[10px] font-heading text-muted-foreground mb-1">{koRound.name}</p>
              {koRound.matches.map((m, i) => renderMatchRow(m, `${koRound.key.toUpperCase()} ${i + 1}`, i))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}