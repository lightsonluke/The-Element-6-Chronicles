import db from './localBackend';
import { submitWorldScore } from './worldLeaderboards.js';

import React, { useRef, useState, useEffect, useCallback } from 'react';

import { ALL_CHARS } from './sports.js';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { readGamepadInput } from './controllerProfiles.js';
import { applyElement } from './elements.js';
import ElementSelect from './ElementSelect.jsx';
import ZiplineLeaderboard from './ZiplineLeaderboard.jsx';
import GameIcon from "./GameIcon.jsx";

// ── Ziplining: single-player endless lane-survival ──
// Three parallel ziplines through a forest. The player auto-advances forever;
// Up/Down switch cables. Collide with any obstacle and the run ends.
// Character stats & Element do NOT affect gameplay — every character rides
// identically. Player rankings are by longest distance on the global board.
const W = 1100, H = 620;
const LANES = [205, 335, 465];            // top, middle, bottom cables
const PLAYER_X = 320;
const PW = 16, PH = 56;
const HANG_OFF = 24;                       // player hangs this far below the cable
const DIST_SCALE = 12;                     // world px <GameIcon emoji="→" size={14} /> meters

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resolveChar(id, customCharsData) {
  if (customCharsData && customCharsData[id]) return customCharsData[id];
  return ALL_CHARS.find(c => c.id === id) || ALL_CHARS[0];
}
// Stats are surfaced in the UI for consistency but never read in gameplay.
function statBlock(char) {
  const s = char?.stats || {};
  return { power: s.power ?? 5, speed: s.speed ?? 5, defense: s.defense ?? 5, utility: s.utility ?? 5, control: s.control ?? 5 };
}

const OBSTACLES = [
  { id: 'branch', w: 74, h: 30, color: '#6a4322' },
  { id: 'vine',   w: 22, h: 120, color: '#3a5a2a' },
  { id: 'bird',   w: 42, h: 26, color: '#caa05a' },
  { id: 'rock',   w: 48, h: 44, color: '#7a6a5a' },
  { id: 'broken', w: 96, h: 14, color: '#1e1e2e' },
  { id: 'log',    w: 88, h: 24, color: '#7a5232' },
  { id: 'house',  w: 84, h: 74, color: '#5a3a22' },
  { id: 'lantern',w: 28, h: 44, color: '#ffcc44' },
  { id: 'beehive',w: 42, h: 38, color: '#d8a040' },
  { id: 'leaf',   w: 74, h: 52, color: '#4a8a3a' },
  { id: 'plat',   w: 72, h: 18, color: '#6a4a2a' },
  { id: 'cliff',  w: 60, h: 96, color: '#6a5a4a' },
  { id: 'bridge', w: 110, h: 20, color: '#8a6a3a' },
];

export default function Ziplining({ onExit, onAward, unlockedIds = ['yellow'], equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, sfxVolume = 70, musicVolume = 50, settings = {}, charLevels = {}, equippedElements = {}, onEquipElement }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('select');
  const [charId, setCharId] = useState(unlockedIds[0] || 'yellow');
  const [selElement, setSelElement] = useState('basic');
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const stRef = useRef(null);
  const keysRef = useRef({});
  const edgeRef = useRef({ up: false, down: false });
  const gpPrevRef = useRef({});
  const paidRef = useRef(false);

  const charPool = (unlockedIds.length ? unlockedIds : ['yellow']).map(id => ({ id, char: resolveChar(id, customCharsData) }));

  const initRun = useCallback((id) => {
    const char = resolveChar(id, customCharsData);
    stRef.current = {
      char,
      lane: 1, y: LANES[1] + HANG_OFF, fromY: LANES[1] + HANG_OFF, switchT: 0,
      scrollX: 0, speed: 5.0,
      obstacles: [], spawnCd: 96,
      leaves: [], birds: [], windP: [],
      frame: 0, animT: 0, startMs: Date.now(),
      over: false, shakeT: 0,
      best: parseInt(localStorage.getItem('element6_zipline_best') || '0', 10) || 0,
    };
    for (let i = 0; i < 26; i++) stRef.current.leaves.push({ x: rand(0, W), y: rand(0, H), vx: rand(-1.6, -0.4), vy: rand(0.1, 0.7), s: rand(2.5, 5.5), rot: rand(0, 6.28), vr: rand(-0.05, 0.05) });
    for (let i = 0; i < 6; i++) stRef.current.birds.push({ x: rand(W, W + 600), y: rand(40, 200), vx: rand(-2.2, -1.0), phase: rand(0, 6.28) });
    for (let i = 0; i < 34; i++) stRef.current.windP.push({ x: rand(0, W), y: rand(0, H), vx: rand(-7, -3), len: rand(14, 44), a: rand(0.05, 0.22) });
  }, [customCharsData]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    if (phase === 'play') music.play('menu');
    return () => { if (phase === 'play') music.stop(); };
  }, [phase, musicVolume, sfxVolume]);

  useEffect(() => {
    if (phase !== 'play') return;
    window.__el6GameplayActive = true;
    return () => { window.__el6GameplayActive = false; };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    const kd = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'p') { setPaused(p => !p); return; }
      if ((k === 'arrowup' || k === 'w') && !keysRef.current[k]) edgeRef.current.up = true;
      if ((k === 'arrowdown' || k === 's') && !keysRef.current[k]) edgeRef.current.down = true;
      keysRef.current[k] = true;
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
    };
    const ku = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = stRef.current;
      if (paused || s.over) { draw(ctx, s); return; }
      const gp = settings.controllerEnabled !== false ? readGamepadInput(0) : null;
      if (gp) {
        if (gp.up && !gpPrevRef.current.up) edgeRef.current.up = true;
        if (gp.down && !gpPrevRef.current.down) edgeRef.current.down = true;
      }
      gpPrevRef.current = { up: gp?.up, down: gp?.down };
      update(s, { upEdge: edgeRef.current.up, downEdge: edgeRef.current.down });
      edgeRef.current.up = edgeRef.current.down = false;
      draw(ctx, s);
      if (s.over && !paidRef.current) { paidRef.current = true; finishRun(s); setPhase('over'); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, settings.controllerEnabled]);

  function switchLane(s, dir) {
    const nl = clamp(s.lane + dir, 0, 2);
    if (nl === s.lane) return;
    s.fromY = s.y; s.lane = nl; s.switchT = 13; sfx.jump();
  }

  function update(s, inp) {
    s.frame++; s.animT++;
    s.scrollX += s.speed;
    const dist = Math.floor(s.scrollX / DIST_SCALE);
    const diff = clamp(dist / 2400, 0, 1);
    s.speed = Math.min(13.5, 5.0 + diff * 7.5 + 0.018 * Math.min(60, s.frame / 60));
    if (inp.upEdge) switchLane(s, -1);
    if (inp.downEdge) switchLane(s, 1);
    if (s.switchT > 0) {
      s.switchT--;
      const p = 1 - s.switchT / 13;
      const ease = p * p * (3 - 2 * p);
      const target = LANES[s.lane] + HANG_OFF;
      s.y = s.fromY + (target - s.fromY) * ease - Math.sin(p * Math.PI) * 12;
    } else {
      s.y = LANES[s.lane] + HANG_OFF;
    }
    s.spawnCd--;
    if (s.spawnCd <= 0) { spawnPattern(s, diff); s.spawnCd = Math.max(30, 82 - diff * 48) + Math.floor(rand(0, 16)); }
    for (const o of s.obstacles) {
      o.x -= s.speed;
      if (o.swing !== undefined) o.swing += 0.07;
      if (!o.passed && o.x + o.w / 2 < PLAYER_X - PW) { o.passed = true; }
      if (!o.deadDone && o.lane === s.lane && Math.abs(o.x - PLAYER_X) < o.w / 2 + PW - 2) {
        s.over = true; s.shakeT = 20; o.deadDone = true; sfx.hit();
      }
    }
    s.obstacles = s.obstacles.filter(o => o.x > -180);
    for (const l of s.leaves) { l.x += l.vx - s.speed * 0.45; l.y += l.vy; l.rot += l.vr; if (l.x < -10) { l.x = W + 10; l.y = rand(0, H); } }
    for (const b of s.birds) { b.x += b.vx; b.phase += 0.3; if (b.x < -40) { b.x = W + rand(0, 800); b.y = rand(40, 220); } }
    for (const w of s.windP) { w.x += w.vx - s.speed * 0.3; if (w.x < -50) { w.x = W + 20; w.y = rand(0, H); } }
    if (s.shakeT > 0) s.shakeT--;
  }

  function spawnPattern(s, d) {
    const x = W + 70;
    const two = Math.random() < 0.22 + d * 0.45;
    const blocked = [];
    if (two) {
      const free = Math.floor(rand(0, 3));
      for (let i = 0; i < 3; i++) if (i !== free) blocked.push(i);
    } else {
      blocked.push(Math.floor(rand(0, 3)));
      if (d > 0.3 && Math.random() < 0.5) {
        const others = [0, 1, 2].filter(i => i !== blocked[0]);
        const lane2 = others[Math.floor(rand(0, others.length))];
        const t2 = OBSTACLES[Math.floor(rand(0, OBSTACLES.length))];
        s.obstacles.push(mkObs(x + 250 + rand(0, 60), lane2, t2));
      }
    }
    for (const lane of blocked) {
      const t = OBSTACLES[Math.floor(rand(0, OBSTACLES.length))];
      s.obstacles.push(mkObs(x + rand(-8, 8), lane, t));
    }
  }
  function mkObs(x, lane, t) {
    return { x, lane, type: t.id, w: t.w, h: t.h, color: t.color, passed: false, deadDone: false, swing: t.id === 'log' ? 0 : undefined, seed: rand(0, 100) };
  }

  async function finishRun(s) {
    const distance = Math.floor(s.scrollX / DIST_SCALE);
    const time = Math.floor((Date.now() - s.startMs) / 1000);
    const newBest = distance > s.best;
    if (newBest) { localStorage.setItem('element6_zipline_best', String(distance)); s.best = distance; sfx.personalBest(); }
    let rank = null, saved = false, globalBest = 0;
    try {
      const me = await db.auth.me().catch(() => null);
      if (me) {
        const char = resolveChar(charId, customCharsData);
        const uname = me.full_name || me.email || 'Zipper';
        const existing = await db.entities.ZiplineScore.filter({ user_id: me.id });
        if (existing && existing.length) {
          const bestRec = existing.reduce((a, b) => ((a.distance || 0) >= (b.distance || 0) ? a : b));
          if (distance > (bestRec.distance || 0)) {
            await db.entities.ZiplineScore.update(bestRec.id, { distance, time_ms: time, user_name: uname, char_id: charId, char_name: char?.name || charId });
          }
        } else {
          await db.entities.ZiplineScore.create({ user_id: me.id, user_name: uname, char_id: charId, char_name: char?.name || charId, distance, time_ms: time });
        }
        saved = true;
        const all = await db.entities.ZiplineScore.list('-distance', 200);
        const sorted = [...(all || [])].sort((a, b) => (b.distance || 0) - (a.distance || 0));
        globalBest = sorted[0]?.distance || 0;
        rank = sorted.findIndex(e => e.user_id === me.id) + 1;
        if (rank <= 0) rank = sorted.length;
      }
    } catch { saved = false; }
    try {
      const remote = await submitWorldScore('zipline', distance, { char_id: charId, time_ms: time });
      saved = true; rank = remote.rank || rank;
    } catch { /* Preserve local result when an account is offline. */ }
    setResult({ distance, time, best: s.best, newBest, rank, saved, globalBest });
    onAward?.({ sport: 'zipline', p1Won: false, stats: { distance, time }, p1CharId: charId, tournamentWon: false });
  }

  const startRun = (id) => { setCharId(id); initRun(id); setResult(null); setPaused(false); paidRef.current = false; setPhase('play'); sfx.click(); };

  // ── Character select ──
  if (phase === 'select') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🪢" size={14} /> ZIPLINING</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1 max-w-xl">Ride three forest ziplines forever — auto-advancing, no stopping. Tap Up/Down to switch cables and dodge an endless array of forest obstacles. The longer you survive, the higher you climb on the global leaderboard. Stats & Elements are cosmetic only here — every character rides the same!</p>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> SPORTS</button>
        </div>
        <button onClick={() => { setPhase('lb'); sfx.click(); }} className="px-4 py-1.5 bg-primary/20 border border-primary text-primary rounded-lg font-heading text-xs hover:bg-primary hover:text-primary-foreground"><GameIcon emoji="🏆" size={14} /> LEADERBOARD</button>
        <p className="text-[11px] font-heading text-muted-foreground tracking-wider mt-1">CHOOSE YOUR RIDER</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
          {charPool.map(({ id, char }) => {
            const st = statBlock(char);
            return (
              <button key={id} onClick={() => { setCharId(id); sfx.characterSelect(); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition hover:scale-[1.04] ${charId === id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                <span className="w-8 h-8 rounded-full" style={{ background: char?.color || '#888' }} />
                <span className="font-heading text-[10px] tracking-wider" style={{ color: char?.color }}>{(char?.name || id).toUpperCase().slice(0, 8)}</span>
                <span className="text-[7px] text-muted-foreground font-body text-center leading-tight">PWR {st.power} · SPD {st.speed} · DEF {st.defense} · UTL {st.utility} · CTL {st.control}</span>
              </button>
            );
          })}
        </div>
        {charId && (
          <ElementSelect charId={charId} currentElement={selElement} onSelect={(el) => { setSelElement(el); sfx.click(); }} charLevels={charLevels} label="ELEMENT (cosmetic only)" />
        )}
        <button onClick={() => startRun(charId)} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90 animate-pulse"><GameIcon emoji="▶" size={14} /> START RUN</button>
        <div className="text-[10px] text-muted-foreground font-body text-center max-w-xl">
          <p className="font-heading text-foreground/80 mb-1">CONTROLS</p>
          <p><span className="text-accent font-bold"><GameIcon emoji="↑" size={14} /> / W</span> Zipline up &nbsp;·&nbsp; <span className="text-accent font-bold"><GameIcon emoji="↓" size={14} /> / S</span> Zipline down &nbsp;·&nbsp; ESC to pause</p>
          <p className="mt-1">You can't stop, slow, or steer — only switch cables. Tap Up/Down to dodge obstacles, chain switches fluidly, and survive as long as you can!</p>
        </div>
      </div>
    );
  }

  if (phase === 'lb') return <ZiplineLeaderboard onBack={() => setPhase('select')} customCharsData={customCharsData} />;

  if (phase === 'over' && result) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <h2 className="text-3xl font-heading tracking-wider text-destructive"><GameIcon emoji="💨" size={14} /> RUN OVER!</h2>
        <p className="text-sm text-muted-foreground font-body">You slammed into an obstacle!</p>
        <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-3 items-center">
          {result.newBest && <p className="font-heading text-accent text-lg animate-pulse"><GameIcon emoji="⭐" size={14} /> NEW PERSONAL BEST! <GameIcon emoji="⭐" size={14} /></p>}
          <div className="flex gap-8 text-center">
            <div><p className="text-[10px] font-heading text-muted-foreground tracking-wider">DISTANCE</p><p className="text-4xl font-heading text-primary">{result.distance}m</p></div>
            <div><p className="text-[10px] font-heading text-muted-foreground tracking-wider">TIME</p><p className="text-4xl font-heading text-accent">{result.time}s</p></div>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-[10px] font-heading text-muted-foreground">PERSONAL BEST</p><p className="text-lg font-heading text-accent">{result.best}m</p></div>
            <div><p className="text-[10px] font-heading text-muted-foreground">WORLD BEST</p><p className="text-lg font-heading text-primary">{result.globalBest || '—'}m</p></div>
            <div><p className="text-[10px] font-heading text-muted-foreground">WORLD RANK</p><p className="text-lg font-heading text-accent">{result.rank ? '#' + result.rank : '—'}</p></div>
          </div>
          {!result.saved && <p className="text-[9px] text-muted-foreground font-body">Sign in to save your distance to the global leaderboard.</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => startRun(charId)} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="↻" size={14} /> RETRY</button>
          <button onClick={() => { setPhase('lb'); sfx.click(); }} className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="🏆" size={14} /> LEADERBOARD</button>
          <button onClick={onExit} className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">SPORTS</button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={onExit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Quit</button>
        <span className="text-[10px] text-muted-foreground font-body"><GameIcon emoji="↑" size={14} />/W: Zipline up · <GameIcon emoji="↓" size={14} />/S: Zipline down · ESC: Pause — survive as long as you can!</span>
        <button onClick={() => setPaused(p => !p)} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80">{paused ? <GameIcon emoji="▶" size={14} /> : <GameIcon emoji="⏸" size={14} />}</button>
      </div>
      {paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg gap-4 z-10">
          <h2 className="text-3xl font-heading text-accent">PAUSED</h2>
          <div className="flex gap-2">
            <button onClick={() => setPaused(false)} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="▶" size={14} /> RESUME</button>
            <button onClick={onExit} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">QUIT TO MENU</button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: W + 'px', height: 'auto', aspectRatio: `${W} / ${H}`, background: '#8fc69a' }} />
    </div>
  );

  // ───────── Rendering ─────────
  function draw(ctx, s) {
    ctx.save();
    if (s.shakeT > 0) ctx.translate((Math.random() - 0.5) * s.shakeT, (Math.random() - 0.5) * s.shakeT);
    drawBackground(ctx, s);
    drawCables(ctx, s);
    drawObstacles(ctx, s);
    drawCharacter(ctx, s);
    drawAmbient(ctx, s);
    ctx.restore();
    drawHUD(ctx, s);
    if (s.over) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#FF5050'; ctx.font = 'bold 64px Orbitron, sans-serif';
      ctx.shadowColor = '#FF5050'; ctx.shadowBlur = 24; ctx.fillText('CRASH!', W / 2, H / 2); ctx.shadowBlur = 0;
    }
  }

  function drawBackground(ctx, s) {
    const scroll = s.scrollX;
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#a8e0f0'); g.addColorStop(0.4, '#cfe8c0'); g.addColorStop(1, '#e8f4d0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sun + rays
    const sunX = W * 0.78, sunY = 110;
    ctx.fillStyle = 'rgba(255,244,200,0.9)'; ctx.beginPath(); ctx.arc(sunX, sunY, 42, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff8c0';
    for (let i = 0; i < 10; i++) { const a = i * 0.628 + s.animT * 0.002; ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(sunX + Math.cos(a) * 900, sunY + Math.sin(a) * 900); ctx.lineWidth = 26; ctx.strokeStyle = '#fff8c0'; ctx.stroke(); }
    ctx.restore();
    // far mountains
    ctx.fillStyle = 'rgba(120,150,180,0.5)';
    for (let i = 0; i < 5; i++) { const px = ((i * 280 - (scroll * 0.08) % 280) + W) % (W + 280) - 140; ctx.beginPath(); ctx.moveTo(px, 320); ctx.lineTo(px + 140, 140); ctx.lineTo(px + 280, 320); ctx.closePath(); ctx.fill(); }
    // mid hill trees
    ctx.fillStyle = 'rgba(70,120,70,0.55)';
    for (let i = 0; i < 7; i++) { const px = ((i * 200 - (scroll * 0.18) % 200) + W) % (W + 200) - 100; ctx.beginPath(); ctx.moveTo(px, 360); ctx.lineTo(px + 100, 200); ctx.lineTo(px + 200, 360); ctx.closePath(); ctx.fill(); }
    // far pine forest
    ctx.fillStyle = 'rgba(40,90,50,0.7)';
    for (let i = 0; i < 18; i++) { const px = ((i * 90 - (scroll * 0.32) % 90) + W) % (W + 90) - 45; pine(ctx, px, 360 + (i % 3) * 14, 70 + (i % 4) * 14); }
    // mid broadleaf trees
    ctx.fillStyle = 'rgba(35,80,40,0.85)';
    for (let i = 0; i < 12; i++) { const px = ((i * 150 - (scroll * 0.5) % 150) + W) % (W + 150) - 75; broad(ctx, px, 400 + (i % 2) * 24, 96 + (i % 3) * 16); }
    // near pine / undergrowth
    ctx.fillStyle = 'rgba(30,70,38,0.92)';
    for (let i = 0; i < 22; i++) { const px = ((i * 80 - (scroll * 0.78) % 80) + W) % (W + 80) - 40; pine(ctx, px, 470 + (i % 2) * 10, 120 + (i % 5) * 12); }
    // river shimmer
    ctx.fillStyle = 'rgba(140,200,230,0.45)'; ctx.fillRect(0, 540, W, 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const rx = ((i * 90 - (scroll * 0.7) % 90) + W) % W; ctx.beginPath(); ctx.moveTo(rx, 548); ctx.lineTo(rx + 18, 552); ctx.stroke(); }
    // ground
    ctx.fillStyle = '#3a6a32'; ctx.fillRect(0, 566, W, H - 566);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 566, W, 3);
  }

  function drawCables(ctx, s) {
    const sway = Math.sin(s.animT * 0.04);
    for (let i = 0; i < 3; i++) {
      const baseY = LANES[i];
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) {
        const yy = baseY + Math.sin(x * 0.02 + s.animT * 0.05 + i) * 3 + (x / W) * 18; // slight downward slope
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      // sheen
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x <= W; x += 20) { const yy = baseY + Math.sin(x * 0.02 + s.animT * 0.05 + i) * 3 + (x / W) * 18 - 2; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke();
      // support posts at intervals
      ctx.fillStyle = '#5a3a1a';
      for (let px = ((-s.scrollX * 0.6) % 220 + W) % (W + 220) - 110; px < W + 40; px += 220) {
        ctx.fillRect(px - 3, baseY - 30, 6, 30);
      }
    }
    // harness attachment to current cable
    const cableYNow = LANES[s.lane] + Math.sin(PLAYER_X * 0.02 + s.animT * 0.05 + s.lane) * 3 + (PLAYER_X / W) * 18;
    ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PLAYER_X, cableYNow); ctx.lineTo(PLAYER_X, s.y - PH * 0.42 + sway * 1); ctx.stroke();
    ctx.fillStyle = '#bbb'; ctx.fillRect(PLAYER_X - 7, cableYNow - 4, 14, 6);
  }

  function drawCharacter(ctx, s) {
    const char = s.char;
    const sway = Math.sin(s.animT * 0.04);
    let state = 'idle';
    if (s.switchT > 0) state = 'jumping';
    // speed trail
    ctx.save(); ctx.globalAlpha = 0.25;
    for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(255,255,255,${0.12 - i * 0.03})`; ctx.beginPath(); ctx.ellipse(PLAYER_X - i * 14, s.y, PW - i, PH * 0.4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // clothing flap (rotate-ish via small x jitter)
    drawSportChar(ctx, PLAYER_X + sway * 0.6, s.y, char, {
      facing: 1, frame: s.frame, scale: 0.95, jersey: false, sport: 'climb', state,
      equippedSkins, equippedAccessories,
    });
  }

  function drawObstacles(ctx, s) {
    for (const o of s.obstacles) {
      const cy = LANES[o.lane];
      const ox = o.x;
      ctx.save();
      ctx.translate(ox, cy);
      const t = o.type;
      if (t === 'branch') { ctx.fillStyle = o.color; ctx.fillRect(-o.w / 2, -6, o.w, 12); ctx.fillStyle = '#3a4a20'; for (let i = -2; i <= 2; i++) { ctx.fillRect(i * 14, -6, 2, 22); } }
      else if (t === 'vine') { ctx.strokeStyle = o.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -H); ctx.quadraticCurveTo(Math.sin(s.animT * 0.05 + o.seed) * 14, -40, 0, o.h / 2); ctx.stroke(); ctx.fillStyle = '#5a8a4a'; ctx.beginPath(); ctx.ellipse(0, o.h / 2, 8, 14, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (t === 'bird') { const f = Math.sin(s.animT * 0.3 + o.seed); ctx.fillStyle = o.color; ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-20, -8 - f * 4); ctx.moveTo(8, -2); ctx.lineTo(20, -8 - f * 4); ctx.stroke(); }
      else if (t === 'rock') { ctx.fillStyle = o.color; ctx.beginPath(); ctx.moveTo(-o.w / 2, o.h / 2); ctx.lineTo(-o.w / 4, -o.h / 2); ctx.lineTo(o.w / 4, -o.h / 2); ctx.lineTo(o.w / 2, o.h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(-6, -8, 6, 0, Math.PI * 2); ctx.fill(); }
      else if (t === 'broken') { ctx.strokeStyle = '#1e1e2e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-o.w / 2, 0); ctx.lineTo(-8, -4); ctx.moveTo(8, 4); ctx.lineTo(o.w / 2, 0); ctx.stroke(); ctx.fillStyle = '#ffcc44'; ctx.fillRect(-o.w / 2 - 4, -3, 6, 6); ctx.fillRect(o.w / 2 - 2, -3, 6, 6); }
      else if (t === 'log') { const sw = Math.sin(o.swing) * 8; ctx.save(); ctx.translate(0, -38); ctx.rotate(Math.sin(o.swing) * 0.3); ctx.fillStyle = o.color; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-o.w / 2, 0, o.h / 2, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(o.w / 2, 0, o.h / 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      else if (t === 'house') { ctx.fillStyle = o.color; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); ctx.moveTo(-o.w / 2 - 4, -o.h / 2); ctx.lineTo(0, -o.h / 2 - 18); ctx.lineTo(o.w / 2 + 4, -o.h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-8, -o.h / 2 + 24, 16, o.h - 30); }
      else if (t === 'lantern') { ctx.fillStyle = o.color; ctx.beginPath(); ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -H); ctx.stroke(); ctx.fillStyle = 'rgba(255,240,150,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); }
      else if (t === 'beehive') { ctx.fillStyle = o.color; ctx.beginPath(); ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#6a4a1a'; ctx.lineWidth = 2; for (let r = -16; r < 18; r += 8) { ctx.beginPath(); ctx.moveTo(-18, r); ctx.lineTo(18, r); ctx.stroke(); } ctx.fillStyle = '#ffcc44'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-22 + i * 22, -28, 2, 0, Math.PI * 2); ctx.fill(); } }
      else if (t === 'leaf') { ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = o.color; ctx.beginPath(); ctx.ellipse(0, 0, o.w / 2, o.h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-o.w / 2, 0); ctx.lineTo(o.w / 2, 0); ctx.stroke(); ctx.restore(); }
      else if (t === 'plat') { ctx.fillStyle = o.color; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); ctx.strokeStyle = '#caa05a'; ctx.lineWidth = 2; ctx.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h); }
      else if (t === 'cliff') { ctx.fillStyle = o.color; ctx.beginPath(); ctx.moveTo(-o.w / 2, o.h / 2); ctx.lineTo(-o.w / 2 + 8, -o.h / 2); ctx.lineTo(o.w / 2, -o.h / 2 + 6); ctx.lineTo(o.w / 2, o.h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-o.w / 2 + 4, -o.h / 2 + 10, o.w - 8, 4); }
      else if (t === 'bridge') { ctx.fillStyle = o.color; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let bx = -o.w / 2; bx < o.w / 2; bx += 12) { ctx.beginPath(); ctx.moveTo(bx, -o.h / 2); ctx.lineTo(bx, o.h / 2); ctx.stroke(); } }
      ctx.restore();
    }
  }

  function drawAmbient(ctx, s) {
    // wind streaks
    for (const w of s.windP) { ctx.strokeStyle = `rgba(255,255,255,${w.a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + w.len, w.y); ctx.stroke(); }
    // leaves blowing
    for (const l of s.leaves) { ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.fillStyle = `rgba(${90 + Math.floor(l.s) * 10},140,60,0.8)`; ctx.beginPath(); ctx.ellipse(0, 0, l.s, l.s * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    // birds
    for (const b of s.birds) { const f = Math.sin(b.phase); ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x - 14, b.y - 5 - f * 3); ctx.moveTo(b.x + 8, b.y); ctx.lineTo(b.x + 14, b.y - 5 - f * 3); ctx.stroke(); }
    // butterflies
    for (let i = 0; i < 4; i++) { const bx = (s.animT * 1.2 + i * 230) % (W + 80) - 40; const by = 180 + i * 80 + Math.sin(s.animT * 0.08 + i) * 30; ctx.fillStyle = ['#ffcc66', '#ff88aa', '#88ddff', '#bb88ff'][i]; ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill(); }
  }

  function drawHUD(ctx, s) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, 42);
    ctx.textAlign = 'left'; ctx.font = 'bold 20px Orbitron';
    ctx.fillStyle = '#88ff88'; ctx.fillText(`${Math.floor(s.scrollX / DIST_SCALE)}m`, 16, 28);
    ctx.font = 'bold 13px Orbitron'; ctx.fillStyle = '#FFD700';
    ctx.fillText(`BEST ${s.best}m`, 120, 28);
    ctx.fillStyle = '#66ccff'; ctx.fillText(`${Math.floor((Date.now() - s.startMs) / 1000)}s`, 230, 28);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 11px Orbitron';
    ctx.fillText(`SPEED ${s.speed.toFixed(1)}`, W - 16, 28);
    // intensity tint as distance grows
    const diff = clamp(Math.floor(s.scrollX / DIST_SCALE) / 2400, 0, 1);
    if (diff > 0.08) { ctx.fillStyle = `rgba(255,40,40,${diff * 0.10})`; ctx.fillRect(0, 0, W, H); }
    // lane indicator
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(W / 2 - 60, H - 30, 120, 22);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(['TOP', 'MID', 'BOT'][s.lane], W / 2, H - 13);
  }
}

function pine(ctx, x, baseY, h) {
  ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x - h * 0.32, baseY - h * 0.5); ctx.lineTo(x, baseY - h * 0.7); ctx.lineTo(x + h * 0.32, baseY - h * 0.5); ctx.closePath(); ctx.fill();
}
function broad(ctx, x, baseY, h) {
  ctx.beginPath(); ctx.arc(x, baseY - h * 0.5, h * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 3, baseY - h * 0.5, 6, h * 0.5);
}
