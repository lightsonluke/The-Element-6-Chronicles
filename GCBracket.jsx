// Grand Circuit 32-slot bracket — symmetric layout matching the reference image.
// Left side: 16 → 8 → 4 → 2 → 1 (left finalist)
// Right side: 16 → 8 → 4 → 2 → 1 (right finalist)
// Center: 2 finalist boxes (the final match)

import React, { useState } from 'react';

const BW = 110;   // box width
const BH = 26;    // box height
const H = 660;    // bracket height
const COL_W = 155; // column width (box + connector)
const PAD_Y = 30;

function yPositions(count) {
  const spacing = H / count;
  return Array.from({ length: count }, (_, i) => PAD_Y + i * spacing + spacing / 2);
}
function xPos(col) { return 10 + col * COL_W; }

function getSlotInfo(col, idx, slots, results) {
  if (col === 0) return { charId: slots[idx], round: 0, match: Math.floor(idx / 2), slotIdx: idx % 2 };
  if (col === 9) return { charId: slots[idx + 16], round: 0, match: Math.floor((idx + 16) / 2), slotIdx: (idx + 16) % 2 };
  if (col === 1) return { charId: results[0]?.[idx], round: 1, match: Math.floor(idx / 2), slotIdx: idx % 2 };
  if (col === 8) return { charId: results[0]?.[idx + 8], round: 1, match: Math.floor((idx + 8) / 2), slotIdx: (idx + 8) % 2 };
  if (col === 2) return { charId: results[1]?.[idx], round: 2, match: Math.floor(idx / 2), slotIdx: idx % 2 };
  if (col === 7) return { charId: results[1]?.[idx + 4], round: 2, match: Math.floor((idx + 4) / 2), slotIdx: (idx + 4) % 2 };
  if (col === 3) return { charId: results[2]?.[idx], round: 3, match: idx, slotIdx: 0 };
  if (col === 6) return { charId: results[2]?.[idx + 2], round: 3, match: idx + 1, slotIdx: 0 };
  if (col === 4) return { charId: results[3]?.[0], round: 4, match: 0, slotIdx: 0 };
  if (col === 5) return { charId: results[3]?.[1], round: 4, match: 0, slotIdx: 1 };
  return { charId: null };
}

const COLS = [
  { col: 0, count: 16, label: 'R32' },
  { col: 1, count: 8, label: 'R16' },
  { col: 2, count: 4, label: 'QF' },
  { col: 3, count: 2, label: 'SF' },
  { col: 4, count: 1, label: 'F' },
  { col: 5, count: 1, label: 'F' },
  { col: 6, count: 2, label: 'SF' },
  { col: 7, count: 4, label: 'QF' },
  { col: 8, count: 8, label: 'R16' },
  { col: 9, count: 16, label: 'R32' },
];

const TOTAL_W = 10 * COL_W + 20;

export default function GCBracket({ slots, results, humanIds, charById, onSwap, draggable = false, glowMatch = null, compact = false }) {
  const [dragSrc, setDragSrc] = useState(null);
  const [dragHover, setDragHover] = useState(null);

  const scale = compact ? 0.65 : 1;
  const renderedW = TOTAL_W * scale;

  const connectors = [];
  for (let c = 0; c < 4; c++) {
    const leftCol = COLS[c];
    const rightCol = COLS[c + 1];
    const leftYs = yPositions(leftCol.count);
    const rightYs = yPositions(rightCol.count);
    const leftX = xPos(leftCol.col) + BW;
    const rightX = xPos(rightCol.col);
    const midX = (leftX + rightX) / 2;
    for (let i = 0; i < rightCol.count; i++) {
      const ry = rightYs[i];
      const ly1 = leftYs[i * 2];
      const ly2 = leftYs[i * 2 + 1];
      connectors.push({ x1: leftX, y1: ly1, x2: midX, y2: ly1 });
      connectors.push({ x1: leftX, y1: ly2, x2: midX, y2: ly2 });
      connectors.push({ x1: midX, y1: ly1, x2: midX, y2: ly2 });
      connectors.push({ x1: midX, y1: ry, x2: rightX, y2: ry });
    }
  }
  for (let c = 5; c < 9; c++) {
    const leftCol = COLS[c];
    const rightCol = COLS[c + 1];
    const leftYs = yPositions(leftCol.count);
    const rightYs = yPositions(rightCol.count);
    const leftX = xPos(leftCol.col) + BW;
    const rightX = xPos(rightCol.col);
    const midX = (leftX + rightX) / 2;
    for (let i = 0; i < rightCol.count; i++) {
      const ry = rightYs[i];
      const ly1 = leftYs[i * 2];
      const ly2 = leftYs[i * 2 + 1];
      connectors.push({ x1: leftX, y1: ly1, x2: midX, y2: ly1 });
      connectors.push({ x1: leftX, y1: ly2, x2: midX, y2: ly2 });
      connectors.push({ x1: midX, y1: ly1, x2: midX, y2: ly2 });
      connectors.push({ x1: midX, y1: ry, x2: rightX, y2: ry });
    }
  }
  const fy = yPositions(1)[0];
  connectors.push({ x1: xPos(4) + BW, y1: fy, x2: xPos(4) + BW + 30, y2: fy });
  connectors.push({ x1: xPos(5), y1: fy, x2: xPos(5) - 30, y2: fy });

  const isGlowing = (round, match) => {
    if (!glowMatch) return false;
    return glowMatch.round === round && glowMatch.match === match;
  };

  const renderBox = (col, idx) => {
    const info = getSlotInfo(col, idx, slots, results);
    const c = info.charId ? charById(info.charId) : null;
    const isHuman = info.charId && humanIds.has(info.charId);
    const isWinner = info.charId && results[info.round]?.[info.match] === info.charId;
    const isPlayed = info.round !== undefined && results[info.round]?.[info.match] !== undefined;
    const glowing = isGlowing(info.round, info.match);
    const isDraggable = draggable && (col === 0 || col === 9);
    const boxKey = `${col}-${idx}`;
    const isDragHover = dragHover === boxKey && dragSrc && dragSrc !== boxKey;
    const isDragging = dragSrc === boxKey;

    // Double-click swaps with the character across the bracket (col 0 ↔ col 9)
    const handleDoubleClick = () => {
      if (!draggable) return;
      if (col === 0) onSwap?.(idx, idx + 16);
      else if (col === 9) onSwap?.(idx + 16, idx);
    };

    return (
      <div
        key={boxKey}
        draggable={isDraggable}
        onDragStart={() => isDraggable && setDragSrc(boxKey)}
        onDragEnd={() => { setDragSrc(null); setDragHover(null); }}
        onDragOver={(e) => { if (isDraggable && dragSrc) { e.preventDefault(); setDragHover(boxKey); } }}
        onDrop={(e) => {
          e.preventDefault();
          if (isDraggable && dragSrc && dragSrc !== boxKey) {
            const srcParts = dragSrc.split('-');
            const srcCol = parseInt(srcParts[0], 10);
            const srcIdx = parseInt(srcParts[1], 10);
            const srcSlot = srcCol === 0 ? srcIdx : srcIdx + 16;
            const dstSlot = col === 0 ? idx : idx + 16;
            onSwap?.(srcSlot, dstSlot);
          }
          setDragSrc(null); setDragHover(null);
        }}
        onDoubleClick={handleDoubleClick}
        className={`absolute flex items-center gap-1 rounded border-2 transition-all ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
          glowing ? 'border-accent bg-accent/20 shadow-lg animate-pulse' :
          isWinner ? 'border-green-500/60 bg-green-500/10' :
          isPlayed && !isWinner ? 'border-border/40 opacity-40' :
          isDragHover ? 'border-yellow-400 bg-yellow-400/20 ring-2 ring-yellow-400' :
          isDragging ? 'opacity-40' :
          'border-border bg-card/80'
        }`}
        title={isDraggable ? 'Drag to swap, or double-click to swap across' : ''}
        style={{
          left: xPos(col) * scale,
          top: (yPositions(COLS.find(co => co.col === col).count)[idx] - BH / 2) * scale,
          width: BW * scale,
          height: BH * scale,
        }}
      >
        {c ? (
          <>
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color, boxShadow: `0 0 4px ${c.color}88` }} />
            {isHuman && <span className="shrink-0" style={{ color: c.color, fontSize: 8 }}>★</span>}
            <span className="text-[7px] font-heading truncate flex-1 text-foreground">{c.name.slice(0, 10)}</span>
            {isWinner && <span className="shrink-0 text-green-500" style={{ fontSize: 8 }}>✓</span>}
          </>
        ) : (
          <span className="text-[7px] text-muted-foreground pl-2">?</span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="relative" style={{ width: renderedW, height: (H + PAD_Y * 2) * scale }}>
        <svg className="absolute inset-0" width={renderedW} height={(H + PAD_Y * 2) * scale} style={{ pointerEvents: 'none' }}>
          {connectors.map((c, i) => (
            <line key={i}
              x1={c.x1 * scale} y1={c.y1 * scale}
              x2={c.x2 * scale} y2={c.y2 * scale}
              stroke="rgba(150,150,180,0.4)" strokeWidth={1.5 * scale} />
          ))}
        </svg>
        {COLS.map(({ col, label }) => (
          <div key={col} className="absolute text-[7px] font-heading text-muted-foreground text-center"
            style={{ left: xPos(col) * scale, top: 0, width: BW * scale }}>
            {label}
          </div>
        ))}
        {COLS.map(({ col, count }) =>
          Array.from({ length: count }, (_, idx) => renderBox(col, idx))
        )}
        {results[4]?.[0] && (
          <div className="absolute text-center" style={{ left: (xPos(4) + BW + 10) * scale, top: (yPositions(1)[0] - 20) * scale, width: 60 * scale }}>
            <span className="text-lg">🏆</span>
            <p className="text-[7px] font-heading text-accent">{charById(results[4][0])?.name?.slice(0, 8)}</p>
          </div>
        )}
      </div>
    </div>
  );
}