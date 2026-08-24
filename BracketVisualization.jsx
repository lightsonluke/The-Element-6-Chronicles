import React from 'react';
import GameIcon from "./GameIcon.jsx";

// Renders a tournament bracket.
// Two modes:
//   1. Tree bracket (16-slot single-elim) — pass `slots` (16 char IDs) + `results` + `currentRound`
//   2. Linear bracket (sequential rounds) — pass `participants` + `results` + `currentIdx`
//
// Props for tree mode:
//   slots: [charId] — 16 entries
//   results: { round: { match: winnerId } }
//   currentRound: int (0-3) — only rounds <= currentRound are revealed
//   playerSlot: int (always 0)
//   allChars: [{ id, name, color }]
//
// Props for linear mode:
//   participants: [{ id, name, color }]
//   results: [bool|null] — per-match result
//   currentIdx: int — which match is active
//   hideFuture: bool — if true, hide opponents beyond currentIdx

export default function BracketVisualization(props) {
  if (props.slots && props.slots.length === 16) {
    return <TreeBracket {...props} />;
  }
  if (props.slots && props.slots.length === 8) {
    return <EightSlotBracket {...props} />;
  }
  return <LinearBracket {...props} />;
}

// ── 8-slot single-elimination bracket (soccer tournament) ──
function EightSlotBracket({ slots, results = {}, currentRound = 0, playerSlot = 0, allChars = [] }) {
  if (!slots || slots.length < 8) return null;

  const getChar = (id) => id ? allChars.find(c => c.id === id) : null;

  const getMatchParticipants = (round, match) => {
    if (round === 0) return [slots[match * 2], slots[match * 2 + 1]];
    if (round === 1) return [results[0]?.[match * 2], results[0]?.[match * 2 + 1]];
    if (round === 2) return [results[1]?.[0], results[1]?.[1]];
    return [null, null];
  };

  const getWinner = (round, match) => results[round]?.[match];
  const isRevealed = (round) => round <= currentRound;

  const renderSlot = (charId, round, match, slotIdx) => {
    const c = getChar(charId);
    const winner = getWinner(round, match);
    const isWinner = winner === charId;
    const hasResult = winner !== undefined;
    const revealed = isRevealed(round);
    const isPlayer = charId && slots[playerSlot] === charId;

    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 transition ${
        isWinner ? 'bg-green-600/20' : hasResult ? 'opacity-40' : ''
      } ${!revealed ? 'opacity-30' : ''}`}>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
          backgroundColor: revealed ? (c?.color || '#333') : '#333',
          boxShadow: revealed && c ? `0 0 4px ${c.color}88` : 'none',
        }} />
        <span className={`text-[8px] font-heading truncate ${isPlayer ? 'text-accent font-bold' : 'text-foreground'}`}>
          {revealed ? (c?.name || '?') : '?'}
        </span>
        {isWinner && <span className="text-[7px] text-green-500 flex-shrink-0"><GameIcon emoji="✓" size={14} /></span>}
      </div>
    );
  };

  const renderMatchup = (round, match, isPlayerMatch) => {
    const [p1Id, p2Id] = getMatchParticipants(round, match);
    const winner = getWinner(round, match);
    const revealed = isRevealed(round);
    const isCurrent = round === currentRound;
    const hasResult = winner !== undefined;

    return (
      <div className={`flex flex-col border-2 rounded-lg overflow-hidden transition my-1 ${
        isPlayerMatch && isCurrent && !hasResult ? 'border-accent shadow-lg bg-accent/5' : 'border-border'
      }`} style={{ minWidth: '90px' }}>
        {renderSlot(p1Id, round, match, 0)}
        <div className="border-t border-border/50" />
        {renderSlot(p2Id, round, match, 1)}
      </div>
    );
  };

  const colHeight = { height: '240px' };
  const allDone = results[2]?.[0] !== undefined;

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto pb-2 justify-center">
      {/* Left R1: matches 0-1 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">ROUND 1</div>
        <div>{renderMatchup(0, 0, true)}</div>
        <div>{renderMatchup(0, 1, false)}</div>
      </div>

      {/* Left SF: match 0 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">SEMIFINAL</div>
        <div>{renderMatchup(1, 0, true)}</div>
      </div>

      {/* Center: Final */}
      <div className="flex flex-col justify-center flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-accent text-center mb-1">FINAL</div>
        <div>{renderMatchup(2, 0, true)}</div>
        {allDone && (
          <div className="text-center mt-2">
            <span className="text-lg"><GameIcon emoji="🏆" size={14} /></span>
            <p className="text-[8px] font-heading text-accent">{getChar(results[2][0])?.name}</p>
          </div>
        )}
      </div>

      {/* Right SF: match 1 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">SEMIFINAL</div>
        <div>{renderMatchup(1, 1, false)}</div>
      </div>

      {/* Right R1: matches 2-3 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">ROUND 1</div>
        <div>{renderMatchup(0, 2, false)}</div>
        <div>{renderMatchup(0, 3, false)}</div>
      </div>
    </div>
  );
}

// ── Linear bracket (soccer, etc.) ──
function LinearBracket({ participants, results = [], currentIdx = 0, playerChar = null, hideFuture = false }) {
  if (!participants || participants.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max justify-center">
        {/* Player on the left */}
        <div className="flex flex-col items-center gap-1 pr-4">
          <div className={`w-10 h-10 rounded-full border-2 ${playerChar ? 'border-accent' : 'border-border'} flex items-center justify-center`}>
            <span className="text-[8px] font-heading text-accent">YOU</span>
          </div>
        </div>

        {/* Rounds */}
        {participants.map((opp, i) => {
          const won = results[i] === true;
          const lost = results[i] === false;
          const isCurrent = i === currentIdx;
          const isPast = i < currentIdx;
          const isFuture = i > currentIdx;
          const hidden = hideFuture && isFuture;

          return (
            <React.Fragment key={i}>
              {/* Connector line */}
              <div className="flex items-center">
                <div className={`h-0.5 w-6 ${isPast ? 'bg-green-500' : isCurrent ? 'bg-accent' : 'bg-border'}`} />
              </div>

              {/* Matchup box */}
              <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition min-w-[70px]
                ${isCurrent ? 'border-accent bg-accent/10 scale-105 shadow-lg' : ''}
                ${won ? 'border-green-600 bg-green-600/5' : ''}
                ${lost ? 'border-destructive bg-destructive/5 opacity-50' : ''}
                ${hidden ? 'border-border opacity-40' : ''}
                ${isPast && won ? 'opacity-70' : ''}
              `}>
                <div className="text-[8px] font-heading text-muted-foreground">R{i + 1}</div>
                {hidden ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-heading text-muted-foreground">?</span>
                    </div>
                    <span className="text-[7px] font-heading text-muted-foreground">???</span>
                    <span className="text-[8px] text-muted-foreground">—</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full" style={{
                      backgroundColor: opp?.color || '#555',
                      boxShadow: isCurrent ? `0 0 10px ${opp?.color}88` : 'none',
                    }} />
                    <span className="text-[7px] font-heading text-foreground text-center leading-tight max-w-[60px] truncate">
                      {opp?.name || '?'}
                    </span>
                    {won && <span className="text-[9px] text-green-500 font-bold"><GameIcon emoji="✓" size={14} /></span>}
                    {lost && <span className="text-[9px] text-destructive font-bold"><GameIcon emoji="✗" size={14} /></span>}
                    {isCurrent && <span className="text-[8px] text-accent font-bold animate-pulse">NEXT</span>}
                  </>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Trophy at the end */}
        <div className="flex items-center">
          <div className={`h-0.5 w-6 ${results.every(r => r === true) ? 'bg-accent' : 'bg-border'}`} />
          <div className={`text-2xl ${results.every(r => r === true) ? 'opacity-100' : 'opacity-30'}`}><GameIcon emoji="🏆" size={14} /></div>
        </div>
      </div>
    </div>
  );
}

// ── Tree bracket (16-slot single-elimination) ──
function TreeBracket({ slots, results = {}, currentRound = 0, playerSlot = 0, allChars = [] }) {
  if (!slots || slots.length < 16) return null;

  const getChar = (id) => id ? allChars.find(c => c.id === id) : null;

  // Get participants for a match in a given round
  const getParticipants = (round, match) => {
    if (round === 0) return [slots[match * 2], slots[match * 2 + 1]];
    if (round === 1) return [results[0]?.[match * 2], results[0]?.[match * 2 + 1]];
    if (round === 2) return [results[1]?.[match * 2], results[1]?.[match * 2 + 1]];
    if (round === 3) return [results[2]?.[0], results[2]?.[1]];
    return [null, null];
  };

  const getWinner = (round, match) => results[round]?.[match];
  const isRevealed = (round) => round <= currentRound;

  const renderSlot = (charId, round, match, slot) => {
    const c = getChar(charId);
    const winner = getWinner(round, match);
    const isWinner = winner === charId;
    const hasResult = winner !== undefined;
    const revealed = isRevealed(round);
    const isPlayer = charId && slots[playerSlot] === charId;

    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 transition ${
        isWinner ? 'bg-green-600/20' : hasResult ? 'opacity-40' : ''
      } ${!revealed ? 'opacity-30' : ''}`}>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
          backgroundColor: revealed ? (c?.color || '#333') : '#333',
          boxShadow: revealed && c ? `0 0 4px ${c.color}88` : 'none',
        }} />
        <span className={`text-[8px] font-heading truncate ${isPlayer ? 'text-accent font-bold' : 'text-foreground'}`}>
          {revealed ? (c?.name || '?') : '?'}
        </span>
        {isWinner && <span className="text-[7px] text-green-500 flex-shrink-0"><GameIcon emoji="✓" size={14} /></span>}
      </div>
    );
  };

  const renderMatchup = (round, match, isPlayerMatch) => {
    const [p1Id, p2Id] = getParticipants(round, match);
    const winner = getWinner(round, match);
    const revealed = isRevealed(round);
    const isCurrent = round === currentRound;
    const hasResult = winner !== undefined;

    return (
      <div className={`flex flex-col border-2 rounded-lg overflow-hidden transition my-1 ${
        isPlayerMatch && isCurrent && !hasResult ? 'border-accent shadow-lg bg-accent/5' : 'border-border'
      }`} style={{ minWidth: '90px' }}>
        {renderSlot(p1Id, round, match, 0)}
        <div className="border-t border-border/50" />
        {renderSlot(p2Id, round, match, 1)}
      </div>
    );
  };

  const colHeight = { height: '320px' };

  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
      {/* Left R1: matches 0-3 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">R1</div>
        {[0, 1, 2, 3].map(m => (
          <div key={m}>{renderMatchup(0, m, m === 0)}</div>
        ))}
      </div>

      {/* Left QF: matches 0-1 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">QF</div>
        {[0, 1].map(m => (
          <div key={m}>{renderMatchup(1, m, m === 0)}</div>
        ))}
      </div>

      {/* Left SF: match 0 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">SF</div>
        <div>{renderMatchup(2, 0, true)}</div>
      </div>

      {/* Center: Final */}
      <div className="flex flex-col justify-center flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-accent text-center mb-1">FINAL</div>
        <div>{renderMatchup(3, 0, true)}</div>
        {results[3]?.[0] && (
          <div className="text-center mt-2">
            <span className="text-lg"><GameIcon emoji="🏆" size={14} /></span>
            <p className="text-[8px] font-heading text-accent">{getChar(results[3][0])?.name}</p>
          </div>
        )}
      </div>

      {/* Right SF: match 1 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">SF</div>
        <div>{renderMatchup(2, 1, false)}</div>
      </div>

      {/* Right QF: matches 2-3 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">QF</div>
        {[2, 3].map(m => (
          <div key={m}>{renderMatchup(1, m, false)}</div>
        ))}
      </div>

      {/* Right R1: matches 4-7 */}
      <div className="flex flex-col justify-around flex-shrink-0" style={colHeight}>
        <div className="text-[7px] font-heading text-muted-foreground text-center mb-1">R1</div>
        {[4, 5, 6, 7].map(m => (
          <div key={m}>{renderMatchup(0, m, false)}</div>
        ))}
      </div>
    </div>
  );
}