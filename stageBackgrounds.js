// Stage backgrounds — fully procedural, drawn with canvas primitives.
// Overhauled to a rich, layered pixel-art style: sky gradients, volumetric
// clouds, atmospheric-perspective mountain ranges, detailed mid-ground
// (hills with winding roads + statues, forests, crystals, lava, etc.),
// foreground structures (waterfront houses on piers, neon city blocks),
// and layered 3-tone animated water. No images — all drawn from code.

function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${a})`;
}
function srand(s) { const x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function mixHex(h1, h2, t) {
  const p = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(h1), [r2,g2,b2] = p(h2);
  const r = Math.round(lerp(r1,r2,t)), g = Math.round(lerp(g1,g2,t)), b = Math.round(lerp(b1,b2,t));
  return `rgb(${r},${g},${b})`;
}

// ── Per-stage palette + motif ──
const STAGE_THEMES = {
  splitcity:        { skyTop: '#0a0820', skyBottom: '#1a1040', sil: '#0a1030', accent: '#6a4aff', weather: 'clear',  motif: 'city',    neon: true, water: false },
  basic:            { skyTop: '#0a0820', skyBottom: '#1a1040', sil: '#0a1030', accent: '#6a4aff', weather: 'clear',  motif: 'city',    neon: true, water: false },
  silvermansion:    { skyTop: '#0c0a18', skyBottom: '#1a1830', sil: '#08080f', accent: '#88aacc', weather: 'fog',    motif: 'mansion' },
  controllerforest: { skyTop: '#0a1a10', skyBottom: '#102818', sil: '#071505', accent: '#2a8a3a', weather: 'fog',    motif: 'forest' },
  traininggrounds:  { skyTop: '#1a1605', skyBottom: '#2a2410', sil: '#3a3000', accent: '#FFD700', weather: 'clear',  motif: 'grid' },
  voidplane:        { skyTop: '#0a0518', skyBottom: '#180a30', sil: '#1a0a30', accent: '#8833cc', weather: 'fog',    motif: 'void' },
  neonspire:        { skyTop: '#0a0a1a', skyBottom: '#1a0a2a', sil: '#12042a', accent: '#ff44ff', weather: 'rain',   motif: 'city',    neon: true },
  sunsetridge:      { skyTop: '#2a0a10', skyBottom: '#ff6644', sil: '#1a0810', accent: '#ff8844', weather: 'clear',  motif: 'mountains' },
  frozenlake:       { skyTop: '#0a1a2a', skyBottom: '#1a3a5a', sil: '#0a2a3a', accent: '#66aaee', weather: 'snow',   motif: 'ice',    water: true },
  lavafalls:        { skyTop: '#1a0505', skyBottom: '#3a0a05', sil: '#2a0805', accent: '#ff6600', weather: 'embers', motif: 'lava' },
  crystalcavern:    { skyTop: '#0a0518', skyBottom: '#1a0a30', sil: '#150a30', accent: '#aa44ff', weather: 'clear',  motif: 'crystals' },
  skysanctuary:     { skyTop: '#0a1a2a', skyBottom: '#2a4a6a', sil: '#1a3a5a', accent: '#88ccff', weather: 'clear',  motif: 'clouds' },
  underworld:       { skyTop: '#1a0510', skyBottom: '#3a0a18', sil: '#2a0510', accent: '#ff2266', weather: 'embers', motif: 'lava' },
  auroraborealis:   { skyTop: '#050a1a', skyBottom: '#0a2a3a', sil: '#0a1a2a', accent: '#44ffaa', weather: 'aurora', motif: 'ice',    water: true },
  goldentemple:     { skyTop: '#1a1205', skyBottom: '#3a2a10', sil: '#2a1a05', accent: '#ffdd44', weather: 'clear',  motif: 'mountains' },
  stormpeak:        { skyTop: '#1a1a22', skyBottom: '#2a2a3a', sil: '#15151f', accent: '#555577', weather: 'storm',  motif: 'mountains' },
  toxicmarsh:       { skyTop: '#0a1a10', skyBottom: '#1a2a18', sil: '#081a08', accent: '#88ff44', weather: 'fog',    motif: 'forest' },
  cosmicvoid:       { skyTop: '#050518', skyBottom: '#0a0a30', sil: '#0a0a25', accent: '#7744ff', weather: 'clear',  motif: 'void' },
  emberforge:       { skyTop: '#1a0805', skyBottom: '#2a1208', sil: '#1a0805', accent: '#ff8833', weather: 'embers', motif: 'lava' },
  tidalreef:        { skyTop: '#0a1a2a', skyBottom: '#1a3a4a', sil: '#0a2a3a', accent: '#44ccff', weather: 'clear',  motif: 'coastal', water: true },
  shadowrealm:      { skyTop: '#08051a', skyBottom: '#180a2a', sil: '#0a0518', accent: '#9944cc', weather: 'fog',    motif: 'void' },
  dawnbreak:        { skyTop: '#2a1a30', skyBottom: '#ffcc88', sil: '#1a1530', accent: '#ffcc88', weather: 'clear',  motif: 'grid' },
  midnighttower:    { skyTop: '#05051a', skyBottom: '#0a0a2a', sil: '#050518', accent: '#4466ff', weather: 'clear',  motif: 'city',    neon: true },
  junglecanopy:     { skyTop: '#0a1a08', skyBottom: '#1a2a10', sil: '#051505', accent: '#44aa44', weather: 'fog',    motif: 'forest' },
  desertoasis:      { skyTop: '#2a1a05', skyBottom: '#ffcc44', sil: '#2a1a05', accent: '#ffcc44', weather: 'clear',  motif: 'mountains' },
  icepalace:        { skyTop: '#0a1a2a', skyBottom: '#1a3a5a', sil: '#0a1a3a', accent: '#3377cc', weather: 'snow',   motif: 'mansion' },
  volcanocrater:    { skyTop: '#1a0505', skyBottom: '#3a0a05', sil: '#1a0505', accent: '#ff3300', weather: 'embers', motif: 'lava' },
  starlightmeadow:  { skyTop: '#0a0a1a', skyBottom: '#1a1a3a', sil: '#0a1530', accent: '#ffdd88', weather: 'clear',  motif: 'ice' },
  thunderdome:      { skyTop: '#0a0a15', skyBottom: '#15151f', sil: '#0a0a12', accent: '#ffdd00', weather: 'storm',  motif: 'arena' },
  rainbowbridge:    { skyTop: '#1a0a2a', skyBottom: '#3a1a4a', sil: '#2a0a3a', accent: '#ff66ff', weather: 'clear',  motif: 'clouds' },
  coralreef:        { skyTop: '#0a1a2a', skyBottom: '#2a3a5a', sil: '#1a2a3a', accent: '#ff77aa', weather: 'clear',  motif: 'coastal', water: true },
  obsidianfield:    { skyTop: '#0a0a18', skyBottom: '#1a1a28', sil: '#08081a', accent: '#554488', weather: 'fog',    motif: 'mountains' },
  solflare:         { skyTop: '#2a1a05', skyBottom: '#ffdd00', sil: '#2a1a05', accent: '#ffdd00', weather: 'clear',  motif: 'mountains' },
  mintgardens:      { skyTop: '#0a2a18', skyBottom: '#1a3a28', sil: '#082018', accent: '#66ffaa', weather: 'clear',  motif: 'forest' },
  cobaltmines:      { skyTop: '#050a1a', skyBottom: '#0a1a30', sil: '#050a1a', accent: '#4499ff', weather: 'fog',    motif: 'crystals' },
  crimsonarena:     { skyTop: '#1a0508', skyBottom: '#3a0a10', sil: '#1a0508', accent: '#ff3344', weather: 'clear',  motif: 'arena' },
  phoenixroost:     { skyTop: '#1a0a05', skyBottom: '#3a1a08', sil: '#1a0805', accent: '#ffaa44', weather: 'embers', motif: 'lava' },
  nebulareach:      { skyTop: '#05051a', skyBottom: '#1a0a3a', sil: '#0a0520', accent: '#7744ff', weather: 'clear',  motif: 'void' },
  emeraldcove:      { skyTop: '#0a1a18', skyBottom: '#1a3a30', sil: '#0a2a20', accent: '#33ff88', weather: 'clear',  motif: 'coastal', water: true },
  grandarena:       { skyTop: '#0a1a2a', skyBottom: '#2a3a5a', sil: '#1a2a3a', accent: '#6688cc', weather: 'clear',  motif: 'arena' },
  skycitadel:       { skyTop: '#0a1a2a', skyBottom: '#2a4a6a', sil: '#1a3a5a', accent: '#88ddff', weather: 'clear',  motif: 'clouds' },
  colossalcoliseum: { skyTop: '#1a1208', skyBottom: '#3a2a18', sil: '#2a1a10', accent: '#cc8866', weather: 'clear',  motif: 'arena' },
  infiniteexpanse:  { skyTop: '#05051a', skyBottom: '#0a0a2a', sil: '#05051a', accent: '#5566aa', weather: 'fog',    motif: 'void' },
  opalcave:         { skyTop: '#1a0a2a', skyBottom: '#2a1a4a', sil: '#150a30', accent: '#77ddbb', weather: 'clear',  motif: 'crystals' },
  // ── 20 NEW STAGES ──
  g1_thunder_peak:  { skyTop: '#1a1a00', skyBottom: '#3a3a10', sil: '#2a2a10', accent: '#FFD700', weather: 'storm',  motif: 'mountains' },
  g1_inferno_realm: { skyTop: '#1a0500', skyBottom: '#440a00', sil: '#2a0805', accent: '#FF6600', weather: 'embers', motif: 'lava' },
  g1_ocean_depth:   { skyTop: '#001030', skyBottom: '#003366', sil: '#002050', accent: '#00CCFF', weather: 'clear',  motif: 'coastal', water: true },
  g1_verdant_grove: { skyTop: '#0a2005', skyBottom: '#1a4008', sil: '#051505', accent: '#88DD44', weather: 'fog',    motif: 'forest' },
  g1_glacier_realm: { skyTop: '#0a1a3a', skyBottom: '#2255AA', sil: '#0a2a3a', accent: '#AAEEFF', weather: 'snow',   motif: 'ice', water: true },
  g5_golden_arena:  { skyTop: '#1a1505', skyBottom: '#3a3010', sil: '#2a2008', accent: '#FFD700', weather: 'clear',  motif: 'arena' },
  g5_tidal_sanctum: { skyTop: '#001530', skyBottom: '#004466', sil: '#003355', accent: '#4488FF', weather: 'clear',  motif: 'coastal', water: true },
  g5_shadow_dojo:   { skyTop: '#05000a', skyBottom: '#15001a', sil: '#0a0518', accent: '#9944CC', weather: 'fog',    motif: 'void' },
  g5_portal_nexus:  { skyTop: '#1a0a00', skyBottom: '#3a2000', sil: '#2a1505', accent: '#FF8800', weather: 'clear',  motif: 'void' },
  g5_mountain_keep: { skyTop: '#0a1a08', skyBottom: '#1a2a10', sil: '#071505', accent: '#44AA44', weather: 'fog',    motif: 'mountains' },
  g5_mind_palace:   { skyTop: '#1a0a1a', skyBottom: '#3a1a3a', sil: '#2a1030', accent: '#FF66AA', weather: 'clear',  motif: 'void' },
  dawn_battleground:{ skyTop: '#1a1005', skyBottom: '#3a2a10', sil: '#2a1a08', accent: '#FFDD44', weather: 'clear',  motif: 'mountains' },
  shogun_castle:    { skyTop: '#1a0a05', skyBottom: '#3a1a10', sil: '#1a0805', accent: '#AA3322', weather: 'clear',  motif: 'mansion' },
  iron_forge_town:  { skyTop: '#0a0a10', skyBottom: '#1a1a20', sil: '#08081a', accent: '#888888', weather: 'fog',    motif: 'city' },
  rift_valley:      { skyTop: '#05000a', skyBottom: '#1a0030', sil: '#0a0518', accent: '#AA44FF', weather: 'fog',    motif: 'void' },
  blood_arena:      { skyTop: '#1a0005', skyBottom: '#330011', sil: '#1a0008', accent: '#CC0033', weather: 'embers', motif: 'arena' },
  resonance_lab:    { skyTop: '#050a15', skyBottom: '#0a1525', sil: '#08081a', accent: '#4499FF', weather: 'clear',  motif: 'city', neon: true },
  harvest_stronghold:{ skyTop: '#0a0005', skyBottom: '#220011', sil: '#1a0008', accent: '#8B0000', weather: 'embers', motif: 'mansion' },
  crystal_library:  { skyTop: '#050518', skyBottom: '#151530', sil: '#0a0a20', accent: '#7788CC', weather: 'clear',  motif: 'crystals' },
  element6_source:  { skyTop: '#050510', skyBottom: '#101030', sil: '#0a0a20', accent: '#FFFFFF', weather: 'clear',  motif: 'void' },
};

// ── Sky ──
function drawSky(ctx, w, h, pal) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// ── Stars ──
function drawStars(ctx, w, h, frame, count, color, maxBright) {
  for (let i = 0; i < count; i++) {
    const sx = (i * 137) % w;
    const sy = (i * 79) % (h * 0.6);
    const tw = 0.4 + Math.sin(frame * 0.04 + i) * 0.2;
    ctx.fillStyle = hexToRgba(color, (maxBright || 0.5) * tw);
    ctx.beginPath(); ctx.arc(sx, sy, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Volumetric clouds (soft, rounded, buttery off-white with blue shadows) ──
// Clouds are randomized per match: a seed re-rolls whenever drawClouds hasn't
// been called for >2s (i.e. between matches), so every match gets a different
// cloud layout while staying stable during a single match.
let _cloudSeed = Math.random() * 100000;
let _lastCloudCall = 0;
function cloudRng(i) { return srand(i + _cloudSeed); }
function drawClouds(ctx, w, h, frame, pal, density = 6, opacity = 0.10) {
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  if (now - _lastCloudCall > 2000) _cloudSeed = Math.random() * 100000;
  _lastCloudCall = now;
  const hi = '#f9fff0', sh = '#d5e8e8';
  for (let i = 0; i < density; i++) {
    const cx = ((i * 220 + cloudRng(i) * 180 + frame * 0.12) % (w + 300)) - 150;
    const cy = h * 0.10 + cloudRng(i) * h * 0.30;
    const scale = 0.8 + cloudRng(i + 7) * 0.7;
    ctx.save();
    ctx.globalAlpha = opacity * (0.7 + cloudRng(i + 3) * 0.5);
    // shadow blobs
    ctx.fillStyle = sh;
    for (let b = 0; b < 5; b++) {
      const bx = cx + (b - 2) * 26 * scale;
      const by = cy + 8 * scale + Math.sin(b) * 3;
      ctx.beginPath(); ctx.ellipse(bx, by, 30 * scale, 16 * scale, 0, 0, Math.PI * 2); ctx.fill();
    }
    // highlight blobs
    ctx.fillStyle = hi;
    for (let b = 0; b < 5; b++) {
      const bx = cx + (b - 2) * 26 * scale;
      const by = cy + Math.sin(b) * 3;
      ctx.beginPath(); ctx.ellipse(bx, by, 28 * scale, 15 * scale, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ── Distant mountain range (atmospheric perspective — pale, muted) ──
function drawDistantMountains(ctx, w, h, pal, tint) {
  const base = tint || mixHex(pal.skyBottom, '#7fb865', 0.35);
  ctx.fillStyle = hexToRgba(base, 0.55);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  for (let x = 0; x <= w; x += 40) {
    const peak = h * 0.62 - (40 + Math.sin(x * 0.012) * 30 + srand(x * 0.01) * 25);
    ctx.lineTo(x, peak);
  }
  ctx.lineTo(w, h * 0.62); ctx.closePath(); ctx.fill();
  // snow caps on tallest
  ctx.fillStyle = hexToRgba('#ffffff', 0.18);
  for (let x = 20; x < w; x += 120) {
    const peak = h * 0.62 - (40 + Math.sin(x * 0.012) * 30 + srand(x * 0.01) * 25);
    if (peak < h * 0.62 - 55) {
      ctx.beginPath();
      ctx.moveTo(x, peak); ctx.lineTo(x - 14, peak + 18); ctx.lineTo(x + 14, peak + 18); ctx.closePath(); ctx.fill();
    }
  }
}

// ── Layered animated water (3-tone waves) ──
function drawWater(ctx, w, h, frame, pal) {
  const crest = mixHex(pal.accent, '#74b4e2', 0.6);
  const mid = mixHex(pal.accent, '#3c7cb8', 0.5);
  const base = mixHex(pal.sil, '#2a4e8a', 0.5);
  const waterTop = h * 0.62;
  // base fill
  const g = ctx.createLinearGradient(0, waterTop, 0, h);
  g.addColorStop(0, mid); g.addColorStop(1, base);
  ctx.fillStyle = g; ctx.fillRect(0, waterTop, w, h - waterTop);
  // 4 repeating wave bands
  for (let band = 0; band < 4; band++) {
    const by = waterTop + band * (h - waterTop) / 4;
    const amp = 6 + band * 3;
    const tone = band === 0 ? crest : band === 1 ? mid : band === 2 ? mixHex(mid, base, 0.5) : base;
    ctx.fillStyle = hexToRgba(tone, 0.55 - band * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, by);
    for (let x = 0; x <= w; x += 12) {
      const wy = by + Math.sin(x * 0.018 + frame * 0.05 + band * 1.3) * amp;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(w, by + amp + 8); ctx.lineTo(0, by + amp + 8); ctx.closePath(); ctx.fill();
    // crest highlight line
    ctx.strokeStyle = hexToRgba(band === 0 ? '#ffffff' : crest, 0.35 - band * 0.06);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 12) {
      const wy = by + Math.sin(x * 0.018 + frame * 0.05 + band * 1.3) * amp;
      x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
}

// ── Waterfront houses on wooden piers (foreground) ──
function drawPierHouses(ctx, w, h, frame, pal, side) {
  const waterTop = h * 0.62;
  const houseColors = ['#e8c46a', '#d97757', '#c44a4a', '#e0a23c', '#b8556a', '#d9b04a'];
  const dir = side === 'left' ? 1 : -1;
  const baseX = side === 'left' ? 40 : w - 40;
  const count = 4;
  for (let i = 0; i < count; i++) {
    const hx = baseX + dir * i * 60;
    const hy = waterTop - 6;
    // pier posts
    ctx.fillStyle = '#5a3a22';
    for (let p = 0; p < 3; p++) {
      ctx.fillRect(hx + p * 16 - 2, hy, 4, 30);
    }
    // pier deck
    ctx.fillStyle = '#7a5230'; ctx.fillRect(hx - 6, hy - 3, 52, 6);
    // house body
    const hc = houseColors[(i + (side === 'left' ? 0 : 2)) % houseColors.length];
    ctx.fillStyle = hc; ctx.fillRect(hx, hy - 34, 44, 32);
    // roof
    ctx.fillStyle = mixHex(hc, '#000000', 0.35);
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 34); ctx.lineTo(hx + 22, hy - 50); ctx.lineTo(hx + 48, hy - 34); ctx.closePath(); ctx.fill();
    // window
    ctx.fillStyle = hexToRgba('#ffeeaa', 0.85);
    ctx.fillRect(hx + 8, hy - 26, 10, 10);
    ctx.fillRect(hx + 26, hy - 26, 10, 10);
    // door
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(hx + 18, hy - 16, 8, 14);
  }
}

// ── Hill with winding road + statue (mid-ground) ──
function drawHillWithStatue(ctx, w, h, frame, pal, side) {
  const waterTop = h * 0.62;
  const dir = side === 'left' ? 1 : -1;
  const baseX = side === 'left' ? 0 : w;
  // hill
  ctx.fillStyle = mixHex('#7fb865', pal.sil, 0.25);
  ctx.beginPath();
  ctx.moveTo(baseX, waterTop);
  ctx.quadraticCurveTo(baseX + dir * 120, waterTop - 40, baseX + dir * 180, waterTop - 110);
  ctx.quadraticCurveTo(baseX + dir * 240, waterTop - 40, baseX + dir * 300, waterTop);
  ctx.closePath(); ctx.fill();
  // winding road (pale gray)
  ctx.strokeStyle = '#c8c0b0'; ctx.lineWidth = 5; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(baseX + dir * 30, waterTop - 4);
  for (let s = 1; s <= 8; s++) {
    const t = s / 8;
    const rx = baseX + dir * (30 + t * 210);
    const ry = waterTop - 4 - t * 100 + Math.sin(t * Math.PI * 3) * 14;
    ctx.lineTo(rx, ry);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  // statue at peak (gray stone sea creature)
  const peakX = baseX + dir * 220, peakY = waterTop - 104;
  ctx.fillStyle = '#8c9fa1';
  // base
  ctx.fillRect(peakX - 14, peakY - 4, 28, 8);
  // body
  ctx.beginPath(); ctx.ellipse(peakX, peakY - 18, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.beginPath(); ctx.arc(peakX + dir * 10, peakY - 24, 8, 0, Math.PI * 2); ctx.fill();
  // fin
  ctx.beginPath(); ctx.moveTo(peakX - dir * 6, peakY - 28); ctx.lineTo(peakX - dir * 16, peakY - 40); ctx.lineTo(peakX - dir * 2, peakY - 30); ctx.fill();
  ctx.fillStyle = hexToRgba('#ffffff', 0.2); ctx.fillRect(peakX - 14, peakY - 4, 28, 2);
}

// ── MOTIF: coastal (the attached reference style) ──
function motifCoastal(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 30, '#ffffff', 0.25);
  drawClouds(ctx, w, h, frame, pal, 7, 0.12);
  drawDistantMountains(ctx, w, h, pal, mixHex(pal.skyBottom, '#7fd9d8', 0.4));
  drawHillWithStatue(ctx, w, h, frame, pal, 'left');
  drawHillWithStatue(ctx, w, h, frame, pal, 'right');
  drawWater(ctx, w, h, frame, pal);
  drawPierHouses(ctx, w, h, frame, pal, 'left');
  drawPierHouses(ctx, w, h, frame, pal, 'right');
}

// ── MOTIF: city (detailed neon skyline with reflections) ──
function motifCity(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 60, '#ffffff', 0.45);
  drawClouds(ctx, w, h, frame, pal, 4, 0.06);
  const count = Math.ceil(w / 80);
  for (let i = 0; i < count; i++) {
    const bw = 46 + Math.floor(srand(i + 1) * 50);
    const bh = 140 + Math.floor(srand(i + 2) * 200);
    const x = i * 80 + srand(i + 3) * 16;
    // building body with vertical gradient
    const g = ctx.createLinearGradient(x, h - bh, x, h);
    g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.15));
    g.addColorStop(1, pal.sil);
    ctx.fillStyle = g; ctx.fillRect(x, h - bh, bw, bh);
    // neon edge
    ctx.strokeStyle = hexToRgba(pal.accent, 0.35); ctx.lineWidth = 1;
    ctx.strokeRect(x, h - bh, bw, bh);
    // windows
    for (let wy = h - bh + 14; wy < h - 14; wy += 20) {
      for (let wx = x + 7; wx < x + bw - 7; wx += 14) {
        if (srand(wx * wy + i) > 0.4) {
          const lit = srand(wx + wy) > 0.5;
          ctx.fillStyle = pal.neon
            ? (lit ? hexToRgba('#FFD700', 0.6) : hexToRgba(pal.accent, 0.55))
            : hexToRgba('#4466FF', 0.4);
          ctx.fillRect(wx, wy, 7, 9);
        }
      }
    }
    // antenna + beacon
    if (srand(i + 9) > 0.6) {
      ctx.strokeStyle = pal.sil; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + bw / 2, h - bh); ctx.lineTo(x + bw / 2, h - bh - 24); ctx.stroke();
      const blink = (Math.sin(frame * 0.1 + i) > 0) ? '#FF4444' : '#440000';
      ctx.fillStyle = blink; ctx.beginPath(); ctx.arc(x + bw / 2, h - bh - 26, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ── MOTIF: mansion ──
function motifMansion(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 70, '#ddddff', 0.4);
  drawClouds(ctx, w, h, frame, pal, 4, 0.08);
  // moon
  ctx.fillStyle = '#DDDDEE'; ctx.shadowColor = '#DDDDEE'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(w * 0.78, 80, 30, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  const mw = 280, mh = 220, mx = w / 2 - mw / 2;
  // main hall
  const g = ctx.createLinearGradient(mx, h - mh, mx, h);
  g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.2)); g.addColorStop(1, pal.sil);
  ctx.fillStyle = g; ctx.fillRect(mx, h - mh, mw, mh);
  // wings
  ctx.fillStyle = pal.sil;
  ctx.fillRect(mx - 34, h - mh - 60, 54, mh + 60);
  ctx.fillRect(mx + mw - 20, h - mh - 60, 54, mh + 60);
  // roofs
  ctx.fillStyle = mixHex(pal.sil, '#000000', 0.4);
  ctx.beginPath(); ctx.moveTo(mx - 34, h - mh - 60); ctx.lineTo(mx - 7, h - mh - 104); ctx.lineTo(mx + 20, h - mh - 60); ctx.fill();
  ctx.beginPath(); ctx.moveTo(mx + mw - 20, h - mh - 60); ctx.lineTo(mx + mw + 7, h - mh - 104); ctx.lineTo(mx + mw + 34, h - mh - 60); ctx.fill();
  // glowing windows
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = hexToRgba(pal.accent, 0.5);
    ctx.fillRect(mx + 30 + i * 58, h - mh + 44, 26, 34);
    ctx.fillStyle = hexToRgba('#ffffff', 0.2);
    ctx.fillRect(mx + 30 + i * 58, h - mh + 44, 26, 4);
  }
  // gate
  ctx.strokeStyle = mixHex(pal.sil, '#000000', 0.3); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(mx + mw / 2 - 16, h); ctx.lineTo(mx + mw / 2 - 16, h - 40);
  ctx.moveTo(mx + mw / 2 + 16, h); ctx.lineTo(mx + mw / 2 + 16, h - 40); ctx.stroke();
}

// ── MOTIF: forest (layered canopy + spores) ──
function motifForest(ctx, w, h, frame, pal) {
  drawClouds(ctx, w, h, frame, pal, 3, 0.05);
  // back layer trees (pale, atmospheric)
  for (let i = 0; i < Math.ceil(w / 50); i++) {
    const tx = i * 50 + srand(i) * 18;
    const th = 100 + Math.floor(srand(i + 5) * 100);
    ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.2), 0.6);
    ctx.fillRect(tx + 14, h - th, 8, th);
    ctx.beginPath(); ctx.arc(tx + 18, h - th - 22, 28, 0, Math.PI * 2); ctx.fill();
  }
  // front layer (dark, detailed)
  for (let i = 0; i < Math.ceil(w / 75); i++) {
    const tx = i * 75 + 30 + srand(i + 9) * 14;
    const th = 140 + Math.floor(srand(i + 11) * 90);
    const g = ctx.createLinearGradient(tx, h - th, tx, h);
    g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.15)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g; ctx.fillRect(tx + 18, h - th, 11, th);
    // layered canopy
    ctx.fillStyle = pal.sil;
    ctx.beginPath(); ctx.arc(tx + 23, h - th - 30, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 8, h - th - 18, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 40, h - th - 20, 24, 0, Math.PI * 2); ctx.fill();
  }
  // floating spores
  for (let i = 0; i < 22; i++) {
    const fx = (i * 53 + frame * 0.3) % w;
    const fy = (i * 37 + Math.sin(frame * 0.02 + i) * 18) % h;
    ctx.fillStyle = hexToRgba(pal.accent, 0.35);
    ctx.beginPath(); ctx.arc(fx, fy, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
  }
}

// ── MOTIF: mountains (detailed peaks + snow + road) ──
function motifMountains(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 40, '#ffffff', 0.35);
  drawClouds(ctx, w, h, frame, pal, 5, 0.10);
  // back peaks (pale)
  ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.2), 0.6);
  for (let i = 0; i < 6; i++) {
    const px = i * (w / 5) - 40;
    ctx.beginPath(); ctx.moveTo(px, h); ctx.lineTo(px + 120, h - 240 - srand(i) * 70); ctx.lineTo(px + 240, h); ctx.fill();
  }
  // front peaks (dark, with snow caps)
  for (let i = 0; i < 7; i++) {
    const px = i * (w / 6) - 60;
    const ph = 170 + srand(i + 3) * 90;
    const g = ctx.createLinearGradient(px, h - ph, px, h);
    g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.15)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px, h); ctx.lineTo(px + 110, h - ph); ctx.lineTo(px + 220, h); ctx.fill();
    // snow cap
    ctx.fillStyle = hexToRgba('#ffffff', 0.7);
    ctx.beginPath(); ctx.moveTo(px + 110, h - ph); ctx.lineTo(px + 86, h - ph + 30); ctx.lineTo(px + 134, h - ph + 30); ctx.fill();
  }
}

// ── MOTIF: ice (snow mounds + crystal shards + aurora hints) ──
function motifIce(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 55, '#ffffff', 0.4);
  drawClouds(ctx, w, h, frame, pal, 4, 0.08);
  // snow mounds
  for (let i = 0; i < 5; i++) {
    const mx = i * (w / 4) - 60;
    const g = ctx.createLinearGradient(mx, h, mx, h - 70);
    g.addColorStop(0, mixHex(pal.sil, '#ffffff', 0.3)); g.addColorStop(1, hexToRgba(pal.sil, 0.7));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(mx, h, 190, 75, 0, Math.PI, 0); ctx.fill();
  }
  // crystal shards
  for (let i = 0; i < 9; i++) {
    const cx = i * (w / 8) + 40;
    const ch = 70 + srand(i) * 60;
    const g = ctx.createLinearGradient(cx, h - 60, cx, h - 60 - ch);
    g.addColorStop(0, hexToRgba(pal.accent, 0.5)); g.addColorStop(1, hexToRgba('#ffffff', 0.3));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx, h - 60); ctx.lineTo(cx - 13, h - 60 + ch); ctx.lineTo(cx + 13, h - 60 + ch); ctx.fill();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.4); ctx.lineWidth = 1; ctx.stroke();
  }
}

// ── MOTIF: lava (glow + rock cones + lava cracks) ──
function motifLava(ctx, w, h, frame, pal) {
  // ambient glow
  const glow = ctx.createLinearGradient(0, h * 0.45, 0, h);
  glow.addColorStop(0, 'transparent'); glow.addColorStop(1, hexToRgba(pal.accent, 0.4));
  ctx.fillStyle = glow; ctx.fillRect(0, h * 0.45, w, h * 0.55);
  drawClouds(ctx, w, h, frame, pal, 3, 0.05);
  // dark rock cones
  for (let i = 0; i < 6; i++) {
    const px = i * (w / 5) - 40;
    const g = ctx.createLinearGradient(px, h - 170, px, h);
    g.addColorStop(0, mixHex(pal.sil, '#000000', 0.2)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px, h); ctx.lineTo(px + 90, h - 160 - srand(i) * 60); ctx.lineTo(px + 180, h); ctx.fill();
  }
  // lava cracks (pulsing)
  const pulse = 0.5 + Math.sin(frame * 0.08) * 0.2;
  ctx.strokeStyle = hexToRgba(pal.accent, 0.7 * pulse); ctx.lineWidth = 2.5; ctx.shadowColor = pal.accent; ctx.shadowBlur = 10;
  for (let i = 0; i < 6; i++) {
    const cx = i * (w / 5) + 30;
    ctx.beginPath(); ctx.moveTo(cx, h - 20); ctx.lineTo(cx + 12, h - 60); ctx.lineTo(cx - 8, h - 110); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ── MOTIF: crystals (refracted shards) ──
function motifCrystals(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 35, pal.accent, 0.3);
  for (let i = 0; i < 10; i++) {
    const cx = i * (w / 9) + 40;
    const ch = 90 + srand(i) * 100;
    const cw = 22 + srand(i + 2) * 20;
    const g = ctx.createLinearGradient(cx, h - ch, cx, h);
    g.addColorStop(0, hexToRgba('#ffffff', 0.4)); g.addColorStop(0.5, hexToRgba(pal.accent, 0.5)); g.addColorStop(1, hexToRgba(pal.accent, 0.2));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx, h - ch); ctx.lineTo(cx - cw, h); ctx.lineTo(cx + cw, h); ctx.fill();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.35); ctx.lineWidth = 1; ctx.stroke();
    // facet line
    ctx.strokeStyle = hexToRgba('#ffffff', 0.5); ctx.beginPath(); ctx.moveTo(cx, h - ch); ctx.lineTo(cx, h); ctx.stroke();
  }
}

// ── MOTIF: clouds (floating islands) ──
function motifClouds(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 45, '#ffffff', 0.35);
  drawClouds(ctx, w, h, frame, pal, 8, 0.14);
  // floating islands
  for (let i = 0; i < 5; i++) {
    const ix = (i * (w / 4) + frame * 0.08) % (w + 200) - 100;
    const iy = h * 0.25 + srand(i) * h * 0.3;
    ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.15), 0.7);
    ctx.beginPath(); ctx.ellipse(ix, iy, 75, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.sil;
    ctx.beginPath(); ctx.ellipse(ix, iy, 42, 14, 0, 0, Math.PI * 2); ctx.fill();
    // waterfall drip
    ctx.strokeStyle = hexToRgba(pal.accent, 0.3); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ix, iy + 10); ctx.lineTo(ix, iy + 40 + Math.sin(frame * 0.1 + i) * 6); ctx.stroke();
  }
}

// ── MOTIF: void (nebula clouds + drifting orbs) ──
function motifVoid(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 80, pal.accent, 0.45);
  for (let i = 0; i < 6; i++) {
    const vx = (i * 170 + frame * 0.08 * (i % 2 === 0 ? 1 : -1)) % (w + 200) - 100;
    const vy = h * (0.2 + i * 0.12);
    const grad = ctx.createRadialGradient(vx, vy, 5, vx, vy, 120);
    grad.addColorStop(0, hexToRgba(pal.accent, 0.22)); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(vx, vy, 130, 65, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// ── MOTIF: grid (retro sun + perspective grid + banners) ──
function motifGrid(ctx, w, h, frame, pal) {
  // sun
  const sg = ctx.createRadialGradient(w * 0.2, 80, 5, w * 0.2, 80, 60);
  sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.5, pal.accent); sg.addColorStop(1, 'transparent');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(w * 0.2, 80, 50, 0, Math.PI * 2); ctx.fill();
  // sun bands
  ctx.fillStyle = pal.skyBottom;
  for (let b = 0; b < 4; b++) ctx.fillRect(w * 0.2 - 50, 70 + b * 8, 100, 3);
  // perspective grid
  ctx.strokeStyle = hexToRgba(pal.sil, 0.55); ctx.lineWidth = 1;
  const horizon = h * 0.55;
  for (let gx = -w; gx < w * 2; gx += 50) {
    ctx.beginPath(); ctx.moveTo(gx, h); ctx.lineTo(w / 2 + (gx - w / 2) * 0.15, horizon); ctx.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const gy = horizon + i * i * 2.5;
    if (gy > h) break;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }
  // banners
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = hexToRgba(pal.accent, 0.35);
    ctx.fillRect(i * 220 + 80, 0, 14, 60 + Math.sin(frame * 0.05 + i) * 8);
  }
}

// ── MOTIF: arena (tiered stands + pillars) ──
function motifArena(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 35, '#ffffff', 0.3);
  drawClouds(ctx, w, h, frame, pal, 3, 0.06);
  // tiered stands
  for (let i = 0; i < 4; i++) {
    const sy = h - 40 - i * 55;
    const g = ctx.createLinearGradient(0, sy, 0, sy + 45);
    g.addColorStop(0, hexToRgba(pal.sil, 0.4 + i * 0.12)); g.addColorStop(1, hexToRgba(pal.sil, 0.6 + i * 0.1));
    ctx.fillStyle = g; ctx.fillRect(0, sy, w, 45);
    ctx.strokeStyle = hexToRgba(pal.accent, 0.25); ctx.lineWidth = 1; ctx.strokeRect(0, sy, w, 45);
    // crowd dots
    ctx.fillStyle = hexToRgba(pal.accent, 0.4);
    for (let c = 0; c < 40; c++) {
      ctx.beginPath(); ctx.arc(c * (w / 40) + srand(c + i) * 8, sy + 12 + srand(c) * 20, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // pillars
  for (let i = 0; i < 6; i++) {
    const px = i * (w / 5) + 20;
    const g = ctx.createLinearGradient(px, h * 0.2, px, h * 0.7);
    g.addColorStop(0, mixHex(pal.sil, '#ffffff', 0.15)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g; ctx.fillRect(px, h * 0.2, 32, h * 0.5);
    // capital
    ctx.fillRect(px - 4, h * 0.2, 40, 8);
  }
}

const MOTIFS = {
  coastal: motifCoastal, city: motifCity, mansion: motifMansion, forest: motifForest,
  mountains: motifMountains, ice: motifIce, lava: motifLava, crystals: motifCrystals,
  clouds: motifClouds, water: motifCoastal, void: motifVoid, grid: motifGrid, arena: motifArena,
};

// ── Atmospheric light rays (god rays) ──
function drawLightRays(ctx, w, h, frame, pal) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const rayCount = 4;
  for (let i = 0; i < rayCount; i++) {
    const rx = (i / rayCount) * w + Math.sin(frame * 0.01 + i) * 30;
    const grad = ctx.createLinearGradient(rx, 0, rx + 60, h * 0.7);
    grad.addColorStop(0, hexToRgba(pal.accent, 0.06));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(rx - 30, 0);
    ctx.lineTo(rx + 30, 0);
    ctx.lineTo(rx + 80, h * 0.7);
    ctx.lineTo(rx + 20, h * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ── Floating dust motes (atmospheric depth particles) ──
function drawDustMotes(ctx, w, h, frame, pal) {
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const dx = ((i * 83 + frame * 0.12) % (w + 40)) - 20;
    const dy = h * 0.2 + (i * 47) % (h * 0.6) + Math.sin(frame * 0.02 + i) * 12;
    const alpha = 0.15 + Math.sin(frame * 0.03 + i * 0.5) * 0.08;
    ctx.fillStyle = hexToRgba(pal.accent, alpha);
    ctx.beginPath();
    ctx.arc(dx, dy, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Foreground silhouette layer (dark shapes for depth) ──
function drawForegroundSilhouette(ctx, w, h, frame, pal) {
  ctx.save();
  ctx.fillStyle = hexToRgba(pal.sil, 0.5);
  // Left foreground mound
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - 40);
  ctx.quadraticCurveTo(40, h - 60, 80, h - 50);
  ctx.quadraticCurveTo(120, h - 40, 160, h - 55);
  ctx.quadraticCurveTo(200, h - 70, 240, h - 45);
  ctx.lineTo(260, h);
  ctx.closePath();
  ctx.fill();
  // Right foreground mound
  ctx.beginPath();
  ctx.moveTo(w, h);
  ctx.lineTo(w, h - 35);
  ctx.quadraticCurveTo(w - 50, h - 55, w - 100, h - 45);
  ctx.quadraticCurveTo(w - 150, h - 35, w - 200, h - 50);
  ctx.quadraticCurveTo(w - 250, h - 65, w - 280, h - 40);
  ctx.lineTo(w - 300, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Depth vignette (darkens edges for better character contrast) ──
function drawDepthVignette(ctx, w, h, pal) {
  ctx.save();
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.75);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, hexToRgba(pal.sil, 0.35));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ── MAIN ──
export function drawStageBackground(ctx, w, h, frame, mapId, mapData, eventColor) {
  const isEventStage = mapId && mapId.startsWith && mapId.startsWith('event_stage_');
  let pal;
  if (isEventStage) {
    pal = { skyTop: '#0a0518', skyBottom: '#1a0a30', sil: '#150a30', accent: eventColor || '#7744ff', weather: 'clear', motif: 'void' };
  } else {
    pal = STAGE_THEMES[mapId] || STAGE_THEMES.splitcity;
  }

  // Background layer — sky gradient
  drawSky(ctx, w, h, pal);

  // Midground layer — themed motif (buildings, scenery, structures)
  const motif = MOTIFS[pal.motif] || motifCity;
  motif(ctx, w, h, frame, pal);

  // Atmospheric depth — light rays and dust motes
  drawLightRays(ctx, w, h, frame, pal);
  drawDustMotes(ctx, w, h, frame, pal);

  // Weather overlay (rain, snow, fog, embers, etc.)
  drawWeather(ctx, w, h, frame, pal.weather, pal.accent);

  // Floor ambient glow — accent-colored light rising from the bottom
  const accent = (mapData && mapData.accentColor) || pal.accent;
  const floorGrad = ctx.createLinearGradient(0, h - 90, 0, h);
  floorGrad.addColorStop(0, 'transparent');
  floorGrad.addColorStop(1, hexToRgba(accent, 0.12));
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h - 90, w, 90);

  // Foreground depth — dark silhouette shapes at the bottom edges
  drawForegroundSilhouette(ctx, w, h, frame, pal);

  // Depth vignette — darkens screen edges for better character/platform contrast
  drawDepthVignette(ctx, w, h, pal);
}

// ── Weather (animated, drawn over the backdrop) ──
function drawWeather(ctx, w, h, frame, weather, accentHex) {
  switch (weather) {
    case 'rain': {
      ctx.strokeStyle = 'rgba(150,180,220,0.28)'; ctx.lineWidth = 1;
      for (let i = 0; i < 60; i++) {
        const rx = ((i * 47 + frame * 8) % (w + 50)) - 25;
        const ry = ((i * 83 + frame * 12) % h);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke();
      }
      break;
    }
    case 'snow': {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 50; i++) {
        const sx = ((i * 67 + frame * 0.5 + Math.sin(frame * 0.02 + i) * 10) % (w + 40)) - 20;
        const sy = ((i * 53 + frame * 0.8) % h);
        ctx.beginPath(); ctx.arc(sx, sy, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'fog': {
      ctx.fillStyle = hexToRgba(accentHex, 0.05);
      for (let i = 0; i < 5; i++) {
        const fx = (i * w / 5 + frame * 0.01) % (w + 200) - 100;
        ctx.beginPath(); ctx.ellipse(fx, h * 0.4 + i * 30, 170, 38, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'aurora': {
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.globalAlpha = 0.14 + Math.sin(frame * 0.02 + i) * 0.04;
        ctx.strokeStyle = i % 2 === 0 ? '#44FFAA' : '#88DDFF';
        ctx.lineWidth = 28 + Math.sin(frame * 0.03 + i) * 8;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 20) {
          const ay = h * 0.12 + i * 25 + Math.sin(x * 0.006 + frame * 0.02 + i) * 25;
          x === 0 ? ctx.moveTo(x, ay) : ctx.lineTo(x, ay);
        }
        ctx.stroke(); ctx.restore();
      }
      break;
    }
    case 'storm': {
      ctx.strokeStyle = 'rgba(150,160,200,0.3)'; ctx.lineWidth = 1;
      for (let i = 0; i < 70; i++) {
        const rx = ((i * 41 + frame * 10) % (w + 50)) - 25;
        const ry = ((i * 79 + frame * 14) % h);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 14); ctx.stroke();
      }
      if (Math.random() > 0.98) {
        ctx.fillStyle = 'rgba(255,255,220,0.15)'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffff66'; ctx.lineWidth = 2; ctx.shadowColor = '#ffff66'; ctx.shadowBlur = 15;
        ctx.beginPath();
        let lx = Math.random() * w; ctx.moveTo(lx, 0);
        for (let ly = 0; ly < h * 0.5; ly += 25) ctx.lineTo(lx + (Math.random() - 0.5) * 35, ly);
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      break;
    }
    case 'embers': {
      const glow = ctx.createLinearGradient(0, h * 0.4, 0, h * 0.8);
      glow.addColorStop(0, 'transparent'); glow.addColorStop(1, hexToRgba(accentHex, 0.12));
      ctx.fillStyle = glow; ctx.fillRect(0, h * 0.4, w, h * 0.4);
      for (let i = 0; i < 25; i++) {
        const ex = (i * 57 + frame * 0.06 + Math.sin(i) * 20) % w;
        const ey = h - ((i * 43 + frame * 0.3) % (h * 0.6));
        ctx.fillStyle = hexToRgba(accentHex, 0.4);
        ctx.beginPath(); ctx.arc(ex, ey, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
  }
}