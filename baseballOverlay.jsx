import { drawSportChar } from './sportDraw.jsx';
import { ALL_CHARS, TEAM_COLOR_P1, TEAM_COLOR_P2 } from './sports.js';
import { applyElement } from './elements.js';

const W = 1100;

const charFor = (id, element) => {
  const c = ALL_CHARS.find(c => c.id === id);
  if (!c) return null;
  if (element && element !== 'basic') return { ...c, stats: applyElement(c.stats || {}, element) };
  return c;
};

// Field constants (mirrored from BaseballGame for minimap mapping)
const MOUND = { x: 550, y: 390 };
const WALL_RADIUS = 450;

// ── Minimap: small diamond on the left side showing every player position. ──
// Dots use the CHARACTER's own color (not team color) so you can tell who's
// who at a glance. Updates in real-time, every frame.
export function drawMinimap(ctx, s, p1Chars, p2Chars) {
  const mx = 15, my = 92;
  const mw = 138, mh = 138;
  // Background panel
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(mx, my, mw, mh);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center';
  ctx.fillText('FIELD MAP', mx + mw / 2, my + 11);

  const defChars = s.batting === 2 ? p1Chars : p2Chars;
  const batChars = s.batting === 2 ? p2Chars : p1Chars;

  const cx = mx + mw / 2, cy = my + mh / 2 + 8;
  const r = 42;
  const mHome = { x: cx, y: cy + r };
  const mBase1 = { x: cx + r, y: cy };
  const mBase2 = { x: cx, y: cy - r };
  const mBase3 = { x: cx - r, y: cy };
  const mMound = { x: cx, y: cy };
  const mBases = [mHome, mBase1, mBase2, mBase3];

  // Infield dirt backdrop
  ctx.fillStyle = 'rgba(184,154,106,0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.3, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();

  // Base paths
  ctx.strokeStyle = 'rgba(200,168,120,0.7)'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(mHome.x, mHome.y); ctx.lineTo(mBase1.x, mBase1.y);
  ctx.lineTo(mBase2.x, mBase2.y); ctx.lineTo(mBase3.x, mBase3.y); ctx.closePath();
  ctx.stroke();

  // Mound
  ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.arc(mMound.x, mMound.y, 5, 0, Math.PI * 2); ctx.fill();

  // Bases
  const drawMiniBase = (pos, label, occupied) => {
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = occupied ? '#FFD700' : '#FFFFFF';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 7px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 2;
    ctx.fillText(label, pos.x, pos.y + 11); ctx.shadowBlur = 0;
  };
  drawMiniBase(mHome, 'H', false);
  drawMiniBase(mBase1, '1', !!s.bases[0]);
  drawMiniBase(mBase2, '2', !!s.bases[1]);
  drawMiniBase(mBase3, '3', !!s.bases[2]);

  // Fielders (including pitcher) — colored circles using CHARACTER color
  if (s.fielders && s.fielders.length > 0) {
    s.fielders.forEach((f, i) => {
      const fc = charFor(defChars[f.charIdx]);
      const clr = fc?.color || '#FFFFFF';
      const fx = cx + ((f.x - MOUND.x) / WALL_RADIUS) * r * 0.85;
      const fy = cy + ((f.y - MOUND.y) / WALL_RADIUS) * r * 0.85;
      // Pitcher has a slightly larger dot with a white ring
      ctx.fillStyle = clr;
      ctx.beginPath(); ctx.arc(fx, fy, i === 0 ? 5.5 : 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = i === 0 ? 1.5 : 1; ctx.stroke();
      // Controlled fielder: gold ring
      if (i === s.controlledFielder) {
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI * 2); ctx.stroke();
      }
      // Next fielder (dotted circle target): green dashed ring
      if (i === s.nextFielder && i !== s.controlledFielder) {
        ctx.strokeStyle = '#44FF88'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  // Current batter at home plate (at-bat view only)
  if (s.phase !== 'fielding' && s.phase !== 'resolve') {
    const bc = charFor(batChars[s.batterIdx]);
    const clr = bc?.color || '#FFFFFF';
    ctx.fillStyle = clr; ctx.beginPath(); ctx.arc(mHome.x, mHome.y - 6, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 6px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 2;
    ctx.fillText('B', mHome.x, mHome.y - 12); ctx.shadowBlur = 0;
  }

  // Runners on bases (standing) — character colors
  s.bases.forEach((charIdx, i) => {
    if (charIdx === null) return;
    const rc = charFor(batChars[charIdx]);
    const clr = rc?.color || '#FFFFFF';
    const pos = mBases[i + 1];
    ctx.fillStyle = clr; ctx.beginPath(); ctx.arc(pos.x, pos.y - 4, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.8; ctx.stroke();
  });

  // Active runners (in motion) — character colors
  s.runners.forEach(r => {
    const rc = charFor(batChars[r.charIdx]);
    const clr = rc?.color || '#FFFFFF';
    const from = Math.floor(r.baseProgress);
    const to = Math.ceil(r.baseProgress);
    const t = r.baseProgress - from;
    const a = mBases[Math.max(0, Math.min(3, from))];
    const b = mBases[to >= 4 ? 0 : Math.max(0, Math.min(3, to))];
    const rx = a.x + (b.x - a.x) * t;
    const ry = a.y + (b.y - a.y) * t;
    ctx.fillStyle = clr; ctx.beginPath(); ctx.arc(rx, ry, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.8; ctx.stroke();
    // Speed-boost indicator
    if (r.runBoost > 1) {
      ctx.strokeStyle = '#44FF88'; ctx.lineWidth = 1; ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(rx, ry, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });

  // Field ball position (white dot with glow)
  if (s.fieldBall.alive && s.fieldBall.heldBy === null) {
    const fx = cx + ((s.fieldBall.x - MOUND.x) / WALL_RADIUS) * r * 0.85;
    const fy = cy + ((s.fieldBall.y - MOUND.y) / WALL_RADIUS) * r * 0.85;
    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ── On-deck panel: right side showing next two batters ──
export function drawOnDeck(ctx, s, p1Chars, p2Chars, p1Els, p2Els, j1, j2, skins, accs) {
  const battingChars = s.batting === 2 ? p2Chars : p1Chars;
  const battingEls = s.batting === 2 ? p2Els : p1Els;
  const batColor = s.batting === 2 ? (s.p2TeamColor || TEAM_COLOR_P2) : (s.p1TeamColor || TEAM_COLOR_P1);
  const jersey = s.batting === 2 ? j2 : j1;

  const px = W - 100, py = 150;
  const pw = 95, ph = 180;

  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
  ctx.fillText('ON DECK', px + pw / 2, py + 12);

  const onDeck = (s.batterIdx + 1) % 3;
  const onDeck2 = (s.batterIdx + 2) % 3;

  const odChar = charFor(battingChars[onDeck], battingEls?.[onDeck]);
  if (odChar) {
    drawSportChar(ctx, px + pw / 2, py + 50, odChar, {
      facing: 1, frame: s.frame, scale: 0.55, jersey, sport: 'baseball', state: 'idle', teamColor: batColor,
      equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
    });
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 7px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(odChar.name.toUpperCase().slice(0, 8), px + pw / 2, py + 75);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 8, py + 88); ctx.lineTo(px + pw - 8, py + 88); ctx.stroke();

  const od2Char = charFor(battingChars[onDeck2], battingEls?.[onDeck2]);
  if (od2Char) {
    drawSportChar(ctx, px + pw / 2, py + 120, od2Char, {
      facing: 1, frame: s.frame, scale: 0.42, jersey, sport: 'baseball', state: 'idle', teamColor: batColor,
      equippedSkins: skins, equippedAccessories: accs, noWeapon: true,
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 6px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(od2Char.name.toUpperCase().slice(0, 8), px + pw / 2, py + 138);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '5px Orbitron'; ctx.textAlign = 'center';
  ctx.fillText('UP AFTER', px + pw / 2, py + 150);
}