// mvPowerArt.js — draws power-ability entities (world space) and fighter overlays.  Cosmetic only; nothing here affects the sim.
const TAU = Math.PI * 2;
const STY = { // per style: [main, accent]
  bolt: ['#ffe94a', '#fffbd0'], flame: ['#ff6a1a', '#ffd25a'], ember: ['#ff7a30', '#ffe0a0'], water: ['#3fa0e8', '#cdf1ff'], mirror: ['#9fdcff', '#ffffff'], ice: ['#8fdcff', '#ffffff'], frost: ['#b8ecff', '#ffffff'],
  seed: ['#5cbf48', '#e6ffc8'], plant: ['#3da83c', '#b6f07a'], vine: ['#2f8f2f', '#9be063'], stone: ['#a08462', '#e6d3b0'], sand: ['#d9b66a', '#fff1c4'], bone: ['#e8e4d0', '#ffffff'], wind: ['#7fe8d8', '#e8fffb'], thread: ['#c070ff', '#f0d0ff'],
  string: ['#d89cff', '#ffffff'], chain: ['#9aa6b4', '#e8eef4'], anchor: ['#aab4c0', '#ffffff'], hook: ['#c8d0d8', '#ffffff'], shadow: ['#6a48a8', '#cdb6f4'], mist: ['#b9c7d6', '#ffffff'], sound: ['#ffb84a', '#fff0c0'], star: ['#fff2a8', '#ffffff'],
  light: ['#ffd83d', '#ffffff'], void: ['#6a2fa8', '#d7a8ff'], foxfire: ['#ff9a3a', '#6ad9ff'], blood: ['#c0243a', '#ff9aa6'], venom: ['#8fd14f', '#e6ffb0'], shell: ['#7fb83f', '#d8f59a'], ash: ['#8a8a8a', '#e0e0e0'], rift: ['#d83a5a', '#ffd0d8'],
  barrier: ['#3d6dff', '#cfe0ff'], magnet: ['#e04a4a', '#fff0f0'], magnet2: ['#4a6ae0', '#f0f4ff'], ring: ['#ff4a6a', '#ffe0e8'], potion: ['#c99410', '#f7e08a'], smoke: ['#9a9a9a', '#e8e8e8'], portal: ['#ff8800', '#3a7aff'], wheel: ['#3fa0e8', '#e8faff'],
  debris: ['#8a7a68', '#d8c8b0'], wall: ['#8a8a9a', '#d8d8e8'], morph: ['#2fbf9a', '#ffffff'], arm: ['#a8b030', '#fffbb0'], clock: ['#cc7744', '#fff0e0'], phase: ['#33cc66', '#d0ffe0'], arrow: ['#eeeedd', '#ffffff'], rod: ['#7a8cff', '#ffffaa'],
  glue: ['#ff44aa', '#ffd0ee'], gravity: ['#6a22b8', '#e0c8ff'], energy: ['#ff5a5a', '#ffd0a0'], hand: ['#8a7aa8', '#e8e0f4'], metal: ['#aab4c0', '#ffffff'], dagger: ['#9aa0a8', '#ffffff'], iron: ['#9a9a9a', '#e0e0e0'], root: ['#6a8a2a', '#c0e070'],
  node: ['#4a90ff', '#e0f0ff'], bird: ['#ff6a24', '#ffd890'], brand: ['#ff5a2a', '#ffd070'], dream: ['#a66cff', '#f0e0ff'], web: ['#e8e8f0', '#ffffff'], arch: ['#8a7a60', '#d8c8a8'], death: ['#6b5b8a', '#e0d8f0'], mercy: ['#ffa6d0', '#ffffff'], life: ['#38d27a', '#d0ffe0'],
  claw: ['#2fbf9a', '#ffffff'], blade: ['#cfd9e0', '#ffffff'], standard: ['#d8b25a', '#fff0b0'], prism: ['#bfefff', '#ffffff'], cobra: ['#4f9f1a', '#e0ff90'], warn: ['#ff3a3a', '#ffd0d0'], air: ['#bb88dd', '#ffffff'], sound2: ['#ffb84a', '#fff0c0'], bonefan: ['#e8e4d0', '#fff'],
};
const col = (st, own) => STY[st] || [own || '#ffffff', '#ffffff'];
const a01 = (e) => Math.max(0, Math.min(1, e.life != null && e.life < 14 ? e.life / 14 : 1));
function drawEnt(ctx, e, f, frame, drawStickman) {
  const [m, ac] = col(e.style, f.char && f.char.color); ctx.save(); ctx.globalAlpha = a01(e); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (e.k) {
    case 'marker': { const r = e.r || 16, p = 1 + Math.sin(frame * 0.2) * 0.08; ctx.strokeStyle = m; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x, e.y - r * 0.6, r * p, 0, TAU); ctx.stroke(); ctx.fillStyle = ac; ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.arc(e.x, e.y - r * 0.6, r * 0.38, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x - r, e.y); ctx.lineTo(e.x + r, e.y); ctx.stroke(); break; }
    case 'orb': { const r = e.r || 10; ctx.fillStyle = m; ctx.globalAlpha *= 0.85; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill(); ctx.fillStyle = ac; ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.45, 0, TAU); ctx.fill(); ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(e.x, e.y, r + 2, 0, TAU); ctx.stroke(); break; }
    case 'ring': { if (e.grow) e.r += e.grow; const r = Math.max(1, e.r || 10); ctx.strokeStyle = m; ctx.lineWidth = e.thin ? 1.6 : 3; ctx.beginPath(); if (e.oval) ctx.ellipse(e.x, e.y, r * 0.5, r, 0, 0, TAU); else ctx.arc(e.x, e.y, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = ac; ctx.lineWidth = 1; ctx.stroke(); break; }
    case 'rect': { ctx.fillStyle = m; ctx.globalAlpha *= e.style === 'warn' ? 0.35 + 0.35 * Math.sin(frame * 0.5) ** 2 : e.style === 'barrier' || e.style === 'mirror' ? 0.45 : 0.8; ctx.save(); if (e.tilt) { ctx.translate(e.x + e.w / 2, e.y + e.h); ctx.rotate(e.tilt); ctx.fillRect(-e.w / 2, -e.h, e.w, e.h); ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.strokeRect(-e.w / 2, -e.h, e.w, e.h); } else { ctx.fillRect(e.x, e.y, e.w, e.h); ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.strokeRect(e.x, e.y, e.w, e.h); } ctx.restore(); break; }
    case 'line': { ctx.strokeStyle = m; ctx.lineWidth = e.wide || 2; ctx.beginPath(); ctx.moveTo(e.x1, e.y1);
      if (e.style === 'wind' || e.style === 'thread' || e.style === 'string' || e.style === 'blood') { const n = 8; for (let i = 1; i <= n; i++) { const u = i / n, wv = Math.sin(u * 14 - frame * 0.4) * 3 * (1 - Math.abs(u - 0.5) * 1.2); ctx.lineTo(e.x1 + (e.x2 - e.x1) * u + wv * (e.y2 - e.y1) * 0.02, e.y1 + (e.y2 - e.y1) * u + wv); } } else ctx.lineTo(e.x2, e.y2);
      ctx.stroke(); ctx.strokeStyle = ac; ctx.lineWidth = Math.max(1, (e.wide || 2) * 0.35); ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); break; }
    case 'crack': { const p = e.pts || []; if (p.length < 2) break; ctx.strokeStyle = m; ctx.lineWidth = e.wide || 5; ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1] - 3 + (i % 2) * 2) : ctx.moveTo(q[0], q[1] - 3))); ctx.stroke(); ctx.strokeStyle = ac; ctx.lineWidth = 1.6; ctx.stroke(); break; }
    case 'arc': { const r = e.r || 36, d = e.dir || 1; ctx.strokeStyle = m; ctx.lineWidth = e.thin ? 2 : 5; ctx.beginPath(); ctx.arc(e.x, e.y, r, d > 0 ? -1.3 : Math.PI - 0.5 - (e.up ? 0.8 : 0), d > 0 ? 0.6 + (e.up ? -0.5 : 0) : Math.PI + 1.3, d < 0); ctx.stroke(); ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.stroke(); break; }
    case 'trail': { ctx.fillStyle = m; ctx.globalAlpha *= 0.4 * (e.life / 14 > 1 ? 1 : e.life / 14); const w = e.w || 20; ctx.beginPath(); ctx.ellipse(e.x, e.y, w / 2, w / 4, 0, 0, TAU); ctx.fill(); break; }
    case 'clone': { ctx.globalAlpha *= e.cue ? 0.85 : 0.5; if (drawStickman) { try { drawStickman(ctx, e.x, e.y, m, e.facing || 1, frame, 1, false, 'idle', f.char, null); } catch (er) { /* fall through to silhouette */ } }
      ctx.strokeStyle = e.cue ? ac : m; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 34, 13, 36, 0, 0, TAU); ctx.stroke(); break; }
    default: break;
  }
  ctx.restore();
}
export function paintPower(ctx, f, frame, drawStickman) {
  const pw = f._pw;
  if (f._pwSolids) for (const s of f._pwSolids) { const [m, ac] = col(s.style, f.char && f.char.color); ctx.save(); ctx.fillStyle = m; ctx.globalAlpha = Math.min(1, (s.life || 20) / 14) * 0.85; ctx.fillRect(s.x, s.y, s.w, s.h); ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.strokeRect(s.x, s.y, s.w, s.h); ctx.restore(); }
  if (pw) for (const e of pw.ents) drawEnt(ctx, e, f, frame, drawStickman);
}
// fighter overlays (outline for buffs, wings for White, metal for Silver, reveal outline for sensed opponents)
export function paintPowerOverlay(ctx, f, frame) {
  const b = f._pwBuff, fx = f._pwFx, rev = f._pwRevealed > 0; if (!b && !fx && !rev) return;
  ctx.save(); ctx.lineWidth = 2.5; const cx = f.x, cy = f.y - 36;
  if (b && (b.outline || b.aura || b.metal)) { ctx.strokeStyle = b.outline || b.aura || '#c0c8d0'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(frame * 0.4); ctx.beginPath(); ctx.ellipse(cx, cy, 20, 42, 0, 0, TAU); ctx.stroke(); }
  if (fx && fx.wings) { ctx.strokeStyle = '#ffffff'; ctx.fillStyle = 'rgba(255,255,255,0.45)'; const d = f.facing || 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx - d * 4, cy - 8); ctx.quadraticCurveTo(cx - d * 34, cy - 30 + s * 16, cx - d * 44, cy - 6 + s * 22); ctx.lineTo(cx - d * 4, cy + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
  if (fx && fx.beast) { ctx.strokeStyle = '#2fbf9a'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, 26, 30, 0, 0, TAU); ctx.stroke(); }
  if (rev) { ctx.strokeStyle = '#ffd36a'; ctx.globalAlpha = 0.8; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(cx, cy, 22, 44, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
