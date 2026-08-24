import React from 'react';
import GameIcon from "./GameIcon.jsx";

// Two-half symmetric 16-team knockout bracket (left 8 / right 8 meeting at a
// central final). Each team is a pill; every played match shows its score.
// Black-on-white layout matching the supplied bracket reference image.
const PW = 100, PH = 28;
const X = { r16L: 5, qfL: 150, sfL: 295, leadL: 430, final: 540, leadR: 650, sfR: 785, qfR: 930, r16R: 1075 };
const RIGHT = { r16L: 105, qfL: 250, sfL: 395, leadL: 530, final: 640, leadR: 750, sfR: 885, qfR: 1030, r16R: 1175 };
const Y_R16 = [20, 100, 180, 260, 340, 420, 500, 580];
const Y_QF = [60, 220, 380, 540];
const Y_SF = [140, 460];
const Y_MID = 300;

function roundName(r) { return r === 'r16' ? 'ROUND OF 16' : r === 'qf' ? 'QUARTER FINAL' : r === 'sf' ? 'SEMI FINAL' : r === 'final' ? 'FINAL' : ''; }

export default function KnockoutBracket({ rounds = {}, currentRound, currentMatchIdx, charById, humanIds }) {
  const r16 = rounds.r16 || [];
  const qf = rounds.qf || [];
  const sf = rounds.sf || [];
  const fin = rounds.final || [];

  const leftFinalist = fin[0]?.home ?? (sf[0]?.played ? (sf[0].homeScore > sf[0].awayScore ? sf[0].home : sf[0].away) : null);
  const rightFinalist = fin[0]?.away ?? (sf[1]?.played ? (sf[1].homeScore > sf[1].awayScore ? sf[1].home : sf[1].away) : null);
  const champ = fin[0]?.played ? (fin[0].homeScore > fin[0].awayScore ? fin[0].home : fin[0].away) : null;

  const isCurrent = (round, matchIdx) => round === currentRound && matchIdx === currentMatchIdx;

  const Pill = ({ x, y, charId, score, won, human, current, champion: isChamp }) => {
    const c = charId ? charById(charId) : null;
    const name = c ? (c.name.length > 9 ? c.name.slice(0, 9) : c.name) : 'TBD';
    const color = c ? c.color : '#9ca3af';
    return (
      <g>
        <rect x={x} y={y - 14} width={PW} height={PH} rx={14} fill={isChamp ? '#fde68a' : 'white'} stroke={current ? '#f59e0b' : '#000'} strokeWidth={current ? 3 : 2} />
        <circle cx={x + 11} cy={y} r={4.5} fill={color} stroke="#000" strokeWidth={0.5} />
        {human && <text x={x + 19} y={y + 4} fontSize={9} fill="#f59e0b"><GameIcon emoji="★" size={14} /></text>}
        <text x={x + (human ? 27 : 20)} y={y + 4} fontSize={8.5} fontFamily="Orbitron, sans-serif" fill="#111" fontWeight={won ? 700 : 400}>{name}</text>
        {score != null && <text x={x + PW - 7} y={y + 4} fontSize={10} fontFamily="Orbitron, sans-serif" fill="#000" fontWeight={700} textAnchor="end">{score}</text>}
      </g>
    );
  };

  // connector between a pair of source pills (y1,y2) and a single target pill (ty)
  const Conn = ({ srcX, y1, y2, tgtX, ty, midX }) => (
    <g stroke="#6b7aa0" strokeWidth={2} fill="none">
      <line x1={srcX} y1={y1} x2={midX} y2={y1} />
      <line x1={srcX} y1={y2} x2={midX} y2={y2} />
      <line x1={midX} y1={y1} x2={midX} y2={y2} />
      <line x1={midX} y1={ty} x2={tgtX} y2={ty} />
    </g>
  );

  // match <GameIcon emoji="→" size={14} /> pill helpers
  const mp = (m, home) => ({
    charId: home ? m?.home : m?.away,
    score: m?.played ? (home ? m.homeScore : m.awayScore) : null,
    won: m?.played ? (home ? m.homeScore > m.awayScore : m.awayScore > m.homeScore) : false,
    human: (home ? m?.home : m?.away) ? humanIds?.has(home ? m.home : m.away) : false,
  });

  return (
    <div className="rounded-lg p-2 overflow-x-auto bg-background">
      <svg viewBox="0 0 1180 600" style={{ width: '100%', minWidth: 720, height: 'auto' }}>
        <defs>
          <linearGradient id="brkbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2240" />
            <stop offset="1" stopColor="#0a0f1e" />
          </linearGradient>
        </defs>
        <rect width="1180" height="600" fill="url(#brkbg)" />
        {/* ── connectors ── */}
        {/* left: r16 -> qf */}
        {[0, 1, 2, 3].map(j => (
          <Conn key={`c-r16l-${j}`} srcX={RIGHT.r16L} y1={Y_R16[2 * j]} y2={Y_R16[2 * j + 1]} tgtX={X.qfL} ty={Y_QF[j]} midX={127} />
        ))}
        {/* left: qf -> sf */}
        {[0, 1].map(k => (
          <Conn key={`c-qfl-${k}`} srcX={RIGHT.qfL} y1={Y_QF[2 * k]} y2={Y_QF[2 * k + 1]} tgtX={X.sfL} ty={Y_SF[k]} midX={272} />
        ))}
        {/* left: sf -> lead */}
        <Conn srcX={RIGHT.sfL} y1={Y_SF[0]} y2={Y_SF[1]} tgtX={X.leadL} ty={Y_MID} midX={412} />
        {/* left: lead -> final */}
        <line x1={RIGHT.leadL} y1={Y_MID} x2={X.final} y2={Y_MID} stroke="#6b7aa0" strokeWidth={2} />
        {/* right: lead -> final */}
        <line x1={X.leadR} y1={Y_MID} x2={RIGHT.final} y2={Y_MID} stroke="#6b7aa0" strokeWidth={2} />
        {/* right: sf -> lead */}
        <Conn srcX={X.sfR} y1={Y_SF[0]} y2={Y_SF[1]} tgtX={RIGHT.leadR} ty={Y_MID} midX={767} />
        {/* right: qf -> sf */}
        {[0, 1].map(k => (
          <Conn key={`c-qfr-${k}`} srcX={X.qfR} y1={Y_QF[2 * k]} y2={Y_QF[2 * k + 1]} tgtX={RIGHT.sfR} ty={Y_SF[k]} midX={907} />
        ))}
        {/* right: r16 -> qf */}
        {[0, 1, 2, 3].map(j => (
          <Conn key={`c-r16r-${j}`} srcX={X.r16R} y1={Y_R16[2 * j]} y2={Y_R16[2 * j + 1]} tgtX={RIGHT.qfR} ty={Y_QF[j]} midX={1052} />
        ))}

        {/* ── pills ── */}
        {/* r16 left (matches 0-3) */}
        {[0, 1, 2, 3].map(j => (
          <g key={`r16l-${j}`}>
            <Pill x={X.r16L} y={Y_R16[2 * j]} {...mp(r16[j], true)} current={isCurrent('r16', j)} />
            <Pill x={X.r16L} y={Y_R16[2 * j + 1]} {...mp(r16[j], false)} current={isCurrent('r16', j)} />
          </g>
        ))}
        {/* qf left (matches 0-1) */}
        {[0, 1].map(j => (
          <g key={`qfl-${j}`}>
            <Pill x={X.qfL} y={Y_QF[2 * j]} {...mp(qf[j], true)} current={isCurrent('qf', j)} />
            <Pill x={X.qfL} y={Y_QF[2 * j + 1]} {...mp(qf[j], false)} current={isCurrent('qf', j)} />
          </g>
        ))}
        {/* sf left (match 0) */}
        <Pill x={X.sfL} y={Y_SF[0]} {...mp(sf[0], true)} current={isCurrent('sf', 0)} />
        <Pill x={X.sfL} y={Y_SF[1]} {...mp(sf[0], false)} current={isCurrent('sf', 0)} />
        {/* lead left */}
        <Pill x={X.leadL} y={Y_MID} charId={leftFinalist} human={leftFinalist ? humanIds?.has(leftFinalist) : false} score={fin[0]?.played ? fin[0].homeScore : null} won={fin[0]?.played ? fin[0].homeScore > fin[0].awayScore : false} />
        {/* final (champion) */}
        <Pill x={X.final} y={Y_MID} charId={champ} champion current={isCurrent('final', 0)} human={champ ? humanIds?.has(champ) : false} />
        {/* lead right */}
        <Pill x={X.leadR} y={Y_MID} charId={rightFinalist} human={rightFinalist ? humanIds?.has(rightFinalist) : false} score={fin[0]?.played ? fin[0].awayScore : null} won={fin[0]?.played ? fin[0].awayScore > fin[0].homeScore : false} />
        {/* sf right (match 1) */}
        <Pill x={X.sfR} y={Y_SF[0]} {...mp(sf[1], true)} current={isCurrent('sf', 1)} />
        <Pill x={X.sfR} y={Y_SF[1]} {...mp(sf[1], false)} current={isCurrent('sf', 1)} />
        {/* qf right (matches 2-3) */}
        {[2, 3].map((j, idx) => (
          <g key={`qfr-${j}`}>
            <Pill x={X.qfR} y={Y_QF[2 * idx]} {...mp(qf[j], true)} current={isCurrent('qf', j)} />
            <Pill x={X.qfR} y={Y_QF[2 * idx + 1]} {...mp(qf[j], false)} current={isCurrent('qf', j)} />
          </g>
        ))}
        {/* r16 right (matches 4-7) */}
        {[4, 5, 6, 7].map((j, idx) => (
          <g key={`r16r-${j}`}>
            <Pill x={X.r16R} y={Y_R16[2 * idx]} {...mp(r16[j], true)} current={isCurrent('r16', j)} />
            <Pill x={X.r16R} y={Y_R16[2 * idx + 1]} {...mp(r16[j], false)} current={isCurrent('r16', j)} />
          </g>
        ))}

        {/* round labels */}
        <text x={X.r16L + PW / 2} y={612} fontSize={8} fontFamily="Orbitron, sans-serif" fill="#8899bb" textAnchor="middle">{roundName('r16')}</text>
        <text x={X.final + PW / 2} y={612} fontSize={8} fontFamily="Orbitron, sans-serif" fill="#8899bb" textAnchor="middle">{roundName('final')}</text>
        <text x={X.r16R + PW / 2} y={612} fontSize={8} fontFamily="Orbitron, sans-serif" fill="#8899bb" textAnchor="middle">{roundName('r16')}</text>
      </svg>
    </div>
  );
}