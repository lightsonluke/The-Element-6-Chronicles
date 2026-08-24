import React, { useState, useRef, useEffect } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { LORE_CHAPTERS } from './lore.js';
import { drawStickman, drawAttackEffect, drawSuperEffect } from './renderer.js';
import { music } from './music.js';
import { ALL_CHARS, getRosterForEra, ERAS, ERA_MAP } from './allCharacters.js';
import { getMasteryProgress, getMasteryRankForChar, MASTERY_REWARDS } from './mastery.js';
import { getNameColor } from './charSelectHelpers.js';
import GameIcon from "./GameIcon.jsx";

// Backdrop themes per character
function getBackdrop(char, ctx, w, h, frame) {
  const c = char.color;
  const sc = char.secondaryColor || c;

  // Radial gradient backdrop
  const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.8);
  grad.addColorStop(0, c + '33');
  grad.addColorStop(0.5, c + '11');
  grad.addColorStop(1, '#04020a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Animated energy rings
  for (let r = 1; r <= 4; r++) {
    const radius = 30 + r * 22 + Math.sin(frame * 0.04 + r) * 6;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.42, radius, 0, Math.PI * 2);
    ctx.strokeStyle = c + Math.floor((0.08 + r * 0.04) * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Floating particles of character color
  for (let i = 0; i < 14; i++) {
    const px = w / 2 + Math.cos(frame * 0.015 * (i % 3 + 1) + i * 0.9) * (50 + i * 8);
    const py = h * 0.42 + Math.sin(frame * 0.02 * (i % 2 + 1) + i * 1.1) * (30 + i * 5);
    const alpha = 0.3 + Math.sin(frame * 0.05 + i) * 0.2;
    ctx.fillStyle = c + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(px, py, 2 + Math.sin(frame * 0.03 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Power-specific backdrops
  const id = char.id;
  if (id === 'yellow') {
    // Speed lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + frame * 0.06;
      const len = 40 + Math.random() * 20;
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.42);
      ctx.lineTo(w / 2 + Math.cos(angle) * len, h * 0.42 + Math.sin(angle) * len);
      ctx.strokeStyle = '#FFD70044';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (id === 'blue') {
    // Water ripples
    for (let r2 = 1; r2 <= 3; r2++) {
      const rr = ((frame * 1.5 + r2 * 30) % 80);
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.42, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(68,136,255,${0.4 - rr / 200})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (id === 'black') {
    // Lightning bolts
    for (let i = 0; i < 3; i++) {
      if (Math.floor(frame / 8 + i * 3) % 3 === 0) {
        ctx.strokeStyle = '#FFFF44CC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const bx = 40 + i * 60;
        ctx.moveTo(bx, 10);
        for (let seg = 0; seg < 5; seg++) {
          ctx.lineTo(bx + (Math.random() - 0.5) * 20, 10 + seg * 20);
        }
        ctx.stroke();
      }
    }
  } else if (id === 'purple') {
    // Shadow clones ghost effect
    for (let g = 1; g <= 2; g++) {
      ctx.globalAlpha = 0.15;
      drawStickman(ctx, w / 2 + g * 18, h * 0.42, c, -1, frame - g * 6, 2, false, 'idle', char);
      ctx.globalAlpha = 1;
    }
  } else if (id === 'green') {
    // Stone pillars
    for (let i = 0; i < 3; i++) {
      const ph = 20 + Math.sin(frame * 0.05 + i * 1.5) * 10;
      ctx.fillStyle = '#44AA4466';
      ctx.fillRect(20 + i * 60, h * 0.42 - ph, 14, ph);
    }
  } else if (id === 'orange') {
    // Portal rings
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse(30 + i * (w - 60), h * 0.42, 18, 28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF8800AA';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else if (id === 'indigo') {
    // Gravity warping
    ctx.save();
    ctx.translate(w / 2, h * 0.42);
    for (let i = 0; i < 5; i++) {
      const rr2 = 20 + i * 15;
      ctx.beginPath();
      ctx.arc(0, 0, rr2 + Math.sin(frame * 0.03 + i) * 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#4B008255';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }
}

// Draw power showcase animation for a character
function drawPowerShowcase(ctx, char, frame, w, h) {
  const x = w / 2;
  const y = h * 0.66;
  const scale = 2.2;

  // Draw the character
  drawStickman(ctx, x, y, char.color, 1, frame, scale, char.isSpirit, 'idle', char);

  // Animated power effect based on character
  const p = (frame % 80) / 80;
  const id = char.id;

  ctx.save();

  if (id === 'yellow') {
    // Speed aura
    const grd = ctx.createRadialGradient(x, y - 30, 0, x, y - 30, 50 + Math.sin(frame * 0.1) * 10);
    grd.addColorStop(0, '#FFD70044');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(x, y - 30, 40 + Math.sin(frame * 0.1) * 5, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    // Motion blur streaks
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 20 - i * 12, y - 10 - i * 8);
      ctx.lineTo(x - 50 - i * 12, y - 10 - i * 8);
      ctx.strokeStyle = `rgba(255,215,0,${0.4 - i * 0.07})`;
      ctx.lineWidth = 2 - i * 0.3;
      ctx.stroke();
    }
  } else if (id === 'blue') {
    // Water orb orbiting
    const angle = frame * 0.06;
    const ox = x + Math.cos(angle) * 45;
    const oy = (y - 30) + Math.sin(angle) * 20;
    ctx.fillStyle = '#4488FFBB';
    ctx.shadowColor = '#4488FF';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ox, oy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (id === 'purple') {
    // Shadow slash arc
    if (frame % 40 < 15) {
      ctx.beginPath();
      ctx.arc(x + 20, y - 25, 40, -0.5, 0.8);
      ctx.strokeStyle = '#9944CCAA';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#9944CC';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  } else if (id === 'orange') {
    // Portal ring
    ctx.beginPath();
    ctx.ellipse(x + 50, y - 20, 22, 32, 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF8800CC';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#FF8800';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (id === 'green') {
    // Rising stone pillar under feet
    const ph2 = Math.abs(Math.sin(frame * 0.07)) * 30;
    ctx.fillStyle = '#44AA4488';
    ctx.fillRect(x - 12, y - ph2, 24, ph2);
  } else if (id === 'pink') {
    // TK aura objects
    for (let i = 0; i < 4; i++) {
      const ang2 = frame * 0.05 + i * (Math.PI / 2);
      const ox2 = x + Math.cos(ang2) * 55;
      const oy2 = (y - 30) + Math.sin(ang2) * 25;
      ctx.fillStyle = '#FF66AAAA';
      ctx.shadowColor = '#FF66AA';
      ctx.shadowBlur = 10;
      ctx.fillRect(ox2 - 6, oy2 - 6, 12, 12);
      ctx.shadowBlur = 0;
    }
  } else if (id === 'black') {
    // Lightning channeling
    if (frame % 12 < 6) {
      for (let bolt = 0; bolt < 2; bolt++) {
        ctx.beginPath();
        ctx.moveTo(x + (bolt === 0 ? -30 : 30), y - 80);
        for (let s2 = 0; s2 < 4; s2++) {
          ctx.lineTo(x + (bolt === 0 ? -30 : 30) + (Math.random() - 0.5) * 16, y - 80 + s2 * 22);
        }
        ctx.strokeStyle = '#FFFF44EE';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFFF44';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  } else if (id === 'indigo') {
    // Gravity distortion rings
    for (let r3 = 0; r3 < 3; r3++) {
      const rr3 = 20 + r3 * 18 + Math.sin(frame * 0.07 + r3) * 5;
      ctx.beginPath();
      ctx.arc(x, y - 30, rr3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(75,0,130,${0.5 - r3 * 0.12})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (id === 'red') {
    // Fire burst
    const fr2 = (frame % 30) / 30;
    const grd2 = ctx.createRadialGradient(x, y - 30, 5, x, y - 30, 40 * fr2 + 10);
    grd2.addColorStop(0, '#FF3333CC');
    grd2.addColorStop(1, 'transparent');
    ctx.fillStyle = grd2;
    ctx.beginPath();
    ctx.arc(x, y - 30, 40 * fr2 + 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'white') {
    // Flight trail
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(x - 10 - i * 10, y - 30 - i * 6, 5 - i * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(238,238,238,${0.5 - i * 0.07})`;
      ctx.fill();
    }
  } else if (id === 'silver') {
    // Metal hardening — chrome sheen
    ctx.globalAlpha = 0.3;
    const sheen = ctx.createLinearGradient(x - 20, y - 70, x + 20, y);
    sheen.addColorStop(0, '#FFFFFF');
    sheen.addColorStop(0.5, '#C0C0C088');
    sheen.addColorStop(1, 'transparent');
    ctx.fillStyle = sheen;
    ctx.fillRect(x - 20, y - 70, 40, 70);
    ctx.globalAlpha = 1;
  } else {
    // Generic power glow
    const grd3 = ctx.createRadialGradient(x, y - 30, 0, x, y - 30, 45 + Math.sin(frame * 0.07) * 8);
    grd3.addColorStop(0, char.color + '55');
    grd3.addColorStop(1, 'transparent');
    ctx.fillStyle = grd3;
    ctx.beginPath();
    ctx.arc(x, y - 30, 45 + Math.sin(frame * 0.07) * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function HeroCodex({ onBack, progress }) {
  const [tab, setTab] = useState('g5');
  const [selected, setSelected] = useState(null);
  const [loreChapter, setLoreChapter] = useState(0);
  const previewRef = useRef(null);

  const moveStats = progress?.moveStats || {};
  const charMastery = progress?.charMastery || {};

  const eraTabs = [...ERAS];
  const items = getRosterForEra(tab);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  useEffect(() => {
    if (!selected) return;
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let running = true;
    const W = 220, H = 220;
    const loop = () => {
      if (!running) return;
      frame++;
      ctx.clearRect(0, 0, W, H);
      // Dark base
      ctx.fillStyle = '#04020a';
      ctx.fillRect(0, 0, W, H);
      // Backdrop
      getBackdrop(selected, ctx, W, H, frame);
      // Ground line
      ctx.strokeStyle = selected.color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, H * 0.66 + 2);
      ctx.lineTo(W - 20, H * 0.66 + 2);
      ctx.stroke();
      // Character with power showcase
      drawPowerShowcase(ctx, selected, frame, W, H);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [selected, tab]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-heading text-foreground tracking-wider">HERO CODEX</h2>

      <div className="flex gap-1.5 mb-2 flex-wrap items-center">
        {eraTabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelected(null); }}
            className="px-3 py-1.5 rounded font-heading text-[10px] uppercase border-2 transition"
            style={tab === t.id ? {
              backgroundColor: t.accent, borderColor: t.accent, color: '#fff',
              boxShadow: `0 0 10px ${t.accent}66`,
            } : { backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {t.short}
          </button>
        ))}
        <button onClick={onBack} className="px-3 py-1.5 bg-muted text-muted-foreground rounded font-heading text-sm hover:opacity-80 ml-auto">
          <GameIcon emoji="←" size={14} /> BACK
        </button>
      </div>

      {tab === 'lore' ? (
        <div className="w-full max-w-3xl">
          <div className="flex gap-1 flex-wrap mb-4">
            {LORE_CHAPTERS.map((ch, i) => (
              <button
                key={i}
                onClick={() => setLoreChapter(i)}
                className={`px-3 py-1 rounded text-xs font-heading ${
                  loreChapter === i ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="bg-card rounded-xl p-6 border border-border max-h-[400px] overflow-y-auto">
            <h3 className="font-heading text-lg text-accent mb-3">{LORE_CHAPTERS[loreChapter].title}</h3>
            <p className="font-body text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {LORE_CHAPTERS[loreChapter].content}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 w-full">
          {/* Character list */}
          <div className="grid grid-cols-4 gap-1.5 w-72 max-h-[440px] overflow-y-auto p-1">
            {items.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`flex flex-col items-center p-2 rounded-lg border transition hover:scale-105 ${
                  selected?.id === c.id ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}88` }} />
                <span className="text-[8px] font-heading mt-1 text-center leading-tight" style={{ color: getNameColor(c) }}>{c.name}</span>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="flex-1 rounded-xl p-5 border border-border overflow-hidden relative"
              style={{ background: `linear-gradient(135deg, ${selected.color}0a 0%, #04020a 60%)` }}>
              <div className="flex gap-4">
                {/* Power showcase canvas */}
                <div className="flex-shrink-0">
                  <canvas ref={previewRef} width={220} height={220}
                    className="rounded-xl border-2 flex-shrink-0"
                    style={{ borderColor: selected.color + '66' }}
                  />
                  <p className="text-[9px] text-center font-body mt-1" style={{ color: selected.color }}>
                    POWER SHOWCASE
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-xl" style={{ color: getNameColor(selected), textShadow: `0 0 12px ${selected.color}88` }}>
                    {selected.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mb-2">{selected.title}</p>
                  {selected.fullName && selected.fullName !== selected.name && (
                    <p className="text-xs text-muted-foreground/80 font-body mb-2">Full Name: <span className="text-foreground/90 font-heading">{selected.fullName}</span></p>
                  )}
                  <p className="text-xs text-foreground/70 font-body mb-3 leading-relaxed">{selected.lore}</p>

                  {selected.weapon && (
                    <div className="flex gap-3 mb-3 text-[10px] font-body">
                      <span className="text-muted-foreground">Weapon: <span className="text-foreground">{selected.weapon}</span></span>
                      <span className="text-muted-foreground">Power: <span className="text-foreground">{selected.power}</span></span>
                    </div>
                  )}

                  {selected.heavyAttack && (
                    <div className="mb-3 rounded-lg p-2 border" style={{ borderColor: selected.color + '44', backgroundColor: selected.color + '0a' }}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-heading text-accent px-1 rounded bg-accent/20">HEAVY</span>
                        <span className="text-[11px] font-heading text-foreground">{selected.heavyAttack.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground font-body">{selected.heavyAttack.desc}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] text-destructive font-heading">DMG:{selected.heavyAttack.damage}</span>
                        <span className="text-[8px] text-primary font-heading">RNG:{selected.heavyAttack.range}</span>
                      </div>
                    </div>
                  )}

                  {selected.stats && (
                    <div className="mb-3">
                      <h4 className="font-heading text-xs text-muted-foreground mb-1.5">STATS</h4>
                      {['speed', 'power', 'defense', 'control', 'utility'].filter(s => selected.stats[s] !== undefined).map((stat) => {
                        const val = selected.stats[stat];
                        return (
                        <div key={stat} className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-body text-muted-foreground w-14 capitalize">{stat}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${val * 10}%`, backgroundColor: selected.color, boxShadow: `0 0 4px ${selected.color}` }} />
                          </div>
                          <span className="text-[9px] font-heading w-4 tabular-nums">{val}</span>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hero Mastery rank + progress bar */}
                  <MasteryBar mastery={getMasteryProgress(charMastery, selected.id)} />
                  {/* Mastery rewards (badges + skin tints) */}
                  <MasteryRewardsList charId={selected.id} charMastery={charMastery} />
                </div>
              </div>

              {/* Moves */}
              <div className="mt-3">
                <h4 className="font-heading text-xs text-muted-foreground mb-2">SIGNATURE MOVES</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selected.signatures && Object.entries(selected.signatures).map(([dir, sig]) => (
                    <div key={dir} className="bg-muted/30 rounded-lg p-2 border border-border/50">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-heading uppercase px-1 rounded" style={{ color: selected.color, backgroundColor: selected.color + '22' }}>{dir}</span>
                        <span className="text-[10px] font-heading text-foreground ml-1">{sig.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground font-body mt-0.5">{sig.desc}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] text-destructive font-heading">DMG:{sig.damage}</span>
                        <span className="text-[8px] text-primary font-heading">RNG:{sig.range}</span>
                      </div>
                    </div>
                  ))}
                  {selected.superMove && (
                    <div className="rounded-lg p-2 border col-span-2" style={{ borderColor: selected.color + '55', backgroundColor: selected.color + '11' }}>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-heading text-accent"><GameIcon emoji="⚡" size={14} /> SUPER</span>
                        <span className="text-[10px] font-heading text-foreground ml-1">{selected.superMove.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground font-body">{selected.superMove.desc}</p>
                      <span className="text-[8px] text-destructive font-heading">DMG:{selected.superMove.damage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Move usage stats */}
              <div className="mt-3">
                <h4 className="font-heading text-xs text-muted-foreground mb-2">MOVE USAGE (LIFETIME)</h4>
                <MoveUsageGrid moveStats={moveStats[selected.id] || {}} color={selected.color} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-body">
              Select a character to view details & power showcase
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MOVE_LABELS = {
  heavy: 'Side Heavy', downHeavy: 'Down Heavy', groundPound: 'Ground Pound',
  recovery: 'Recovery', aerial: 'Aerial', sigSide: 'Sig (Side)', sigUp: 'Sig (Up)',
  sigDown: 'Sig (Down)', super: 'Super Move', power: 'Power', normal: 'Normal',
};

// Mastery rank badge + progress bar toward next rank
function MasteryBar({ mastery }) {
  const { rank, nextRank, score, progress, wins, playtime } = mastery;
  const mins = Math.floor((playtime || 0) / 60);
  return (
    <div className="mb-3 rounded-lg p-2 border" style={{ borderColor: rank.color + '55', backgroundColor: rank.color + '0a' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-heading text-muted-foreground">MASTERY</span>
        <span className="text-[11px] font-heading" style={{ color: rank.color }}>{rank.icon} {rank.name}</span>
        {nextRank ? (
          <span className="text-[8px] text-muted-foreground ml-auto">{score}/{nextRank.minScore} → {nextRank.icon} {nextRank.name}</span>
        ) : (
          <span className="text-[8px] text-accent ml-auto">MAX RANK</span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, backgroundColor: rank.color, boxShadow: `0 0 6px ${rank.color}` }} />
      </div>
      <div className="flex gap-3 mt-1 text-[8px] font-body text-muted-foreground">
        <span>{wins} wins</span>
        <span>{mins}m played</span>
        <span className="ml-auto">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}

// Mastery rewards list — shows badges + skin tints unlocked per rank
function MasteryRewardsList({ charId, charMastery }) {
  const rank = getMasteryRankForChar(charMastery, charId);
  return (
    <div className="mb-3">
      <h4 className="font-heading text-xs text-muted-foreground mb-1.5">MASTERY REWARDS</h4>
      <div className="flex flex-wrap gap-1.5">
        {MASTERY_REWARDS.map(r => {
          const unlocked = rank.id >= r.rankId;
          return (
            <div key={r.rankId} className={`flex items-center gap-1 rounded-lg px-2 py-1 border ${unlocked ? 'border-border' : 'border-border opacity-40'}`}
              style={unlocked ? { boxShadow: `0 0 6px ${r.skinTint}33` } : {}}>
              <span className="text-sm" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{r.badgeIcon}</span>
              <div>
                <p className="text-[8px] font-heading" style={{ color: unlocked ? r.skinTint : '#666' }}>{r.badgeName}</p>
                <p className="text-[7px] text-muted-foreground">{unlocked ? 'Unlocked' : `Rank ${r.rankId}`}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MoveUsageGrid({ moveStats, color }) {
  const entries = Object.entries(MOVE_LABELS);
  const hasAny = entries.some(([k]) => (moveStats[k] || 0) > 0);
  if (!hasAny) return <p className="text-[10px] text-muted-foreground font-body">No moves used yet — fight to build your stats!</p>;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {entries.map(([key, label]) => {
        const v = moveStats[key] || 0;
        return (
          <div key={key} className="bg-muted/30 rounded-lg px-2 py-1 border border-border/50 flex items-center justify-between">
            <span className="text-[9px] font-body text-muted-foreground">{label}</span>
            <span className="text-[10px] font-heading tabular-nums" style={{ color: v > 0 ? color : '#666' }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}