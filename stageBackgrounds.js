// Stage backgrounds — fully procedural, drawn with canvas primitives.
// V2: significantly denser detail pass across every motif — more layers,
// more texture strokes, richer atmosphere — while staying 100% code-drawn.
// No text, no character/person silhouettes anywhere in the scenery.

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
  // ── 20 stages ──
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
  g.addColorStop(0.55, mixHex(pal.skyTop, pal.skyBottom, 0.5));
  g.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // subtle horizon haze band — adds a painted-matte feel like reference art
  const haze = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.68);
  haze.addColorStop(0, 'transparent');
  haze.addColorStop(1, hexToRgba(mixHex(pal.skyBottom, '#ffffff', 0.3), 0.18));
  ctx.fillStyle = haze; ctx.fillRect(0, h * 0.5, w, h * 0.18);
}

// ── Stars ──
function drawStars(ctx, w, h, frame, count, color, maxBright) {
  for (let i = 0; i < count; i++) {
    const sx = (i * 137) % w;
    const sy = (i * 79) % (h * 0.6);
    const tw = 0.4 + Math.sin(frame * 0.04 + i) * 0.2;
    const r = 0.8 + (i % 3) * 0.4;
    ctx.fillStyle = hexToRgba(color, (maxBright || 0.5) * tw);
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    if (i % 9 === 0) {
      // occasional bright star with a tiny cross glint
      ctx.strokeStyle = hexToRgba(color, (maxBright || 0.5) * tw * 0.6);
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(sx - r * 2.5, sy); ctx.lineTo(sx + r * 2.5, sy);
      ctx.moveTo(sx, sy - r * 2.5); ctx.lineTo(sx, sy + r * 2.5); ctx.stroke();
    }
  }
}

// ── Volumetric clouds (soft, rounded, buttery off-white with blue shadows) ──
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
    ctx.fillStyle = sh;
    for (let b = 0; b < 6; b++) {
      const bx = cx + (b - 2.5) * 24 * scale;
      const by = cy + 8 * scale + Math.sin(b) * 3;
      ctx.beginPath(); ctx.ellipse(bx, by, 30 * scale, 16 * scale, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = hi;
    for (let b = 0; b < 6; b++) {
      const bx = cx + (b - 2.5) * 24 * scale;
      const by = cy + Math.sin(b) * 3;
      ctx.beginPath(); ctx.ellipse(bx, by, 28 * scale, 15 * scale, 0, 0, Math.PI * 2); ctx.fill();
    }
    // top-lit rim highlight for volume
    ctx.fillStyle = hexToRgba('#ffffff', 0.5);
    ctx.beginPath(); ctx.ellipse(cx, cy - 8 * scale, 40 * scale, 9 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── Distant mountain range (atmospheric perspective, layered ridgelines) ──
function drawDistantMountains(ctx, w, h, pal, tint) {
  // far-far pale ridge
  const far = mixHex(tint || pal.skyBottom, '#ffffff', 0.35);
  ctx.fillStyle = hexToRgba(far, 0.35);
  ctx.beginPath(); ctx.moveTo(0, h * 0.58);
  for (let x = 0; x <= w; x += 46) {
    ctx.lineTo(x, h * 0.58 - (24 + Math.sin(x * 0.008 + 4) * 18 + srand(x * 0.02 + 9) * 14));
  }
  ctx.lineTo(w, h * 0.58); ctx.closePath(); ctx.fill();

  const base = tint || mixHex(pal.skyBottom, '#7fb865', 0.35);
  ctx.fillStyle = hexToRgba(base, 0.55);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  for (let x = 0; x <= w; x += 40) {
    const peak = h * 0.62 - (40 + Math.sin(x * 0.012) * 30 + srand(x * 0.01) * 25);
    ctx.lineTo(x, peak);
  }
  ctx.lineTo(w, h * 0.62); ctx.closePath(); ctx.fill();
  // ridge texture strokes (rock striations)
  ctx.strokeStyle = hexToRgba('#000000', 0.06); ctx.lineWidth = 1;
  for (let x = 10; x < w; x += 30) {
    const peak = h * 0.62 - (40 + Math.sin(x * 0.012) * 30 + srand(x * 0.01) * 25);
    ctx.beginPath(); ctx.moveTo(x, peak + 6); ctx.lineTo(x + 10, h * 0.62); ctx.stroke();
  }
  // snow caps on tallest
  ctx.fillStyle = hexToRgba('#ffffff', 0.22);
  for (let x = 20; x < w; x += 120) {
    const peak = h * 0.62 - (40 + Math.sin(x * 0.012) * 30 + srand(x * 0.01) * 25);
    if (peak < h * 0.62 - 55) {
      ctx.beginPath();
      ctx.moveTo(x, peak); ctx.lineTo(x - 14, peak + 18); ctx.lineTo(x + 14, peak + 18); ctx.closePath(); ctx.fill();
    }
  }
}

// ── Thin waterfall ribbon cutting through distant cliffs (reusable) ──
function drawWaterfallRibbon(ctx, x, topY, bottomY, width, frame, tone) {
  ctx.save();
  const g = ctx.createLinearGradient(x, topY, x, bottomY);
  g.addColorStop(0, hexToRgba(tone, 0.05));
  g.addColorStop(0.5, hexToRgba('#ffffff', 0.55));
  g.addColorStop(1, hexToRgba(tone, 0.35));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, topY);
  for (let y = topY; y <= bottomY; y += 10) {
    const jitter = Math.sin(y * 0.3 + frame * 0.2) * 1.4;
    ctx.lineTo(x - width / 2 + jitter, y);
  }
  ctx.lineTo(x + width / 2, bottomY);
  for (let y = bottomY; y >= topY; y -= 10) {
    const jitter = Math.sin(y * 0.3 + frame * 0.2 + 2) * 1.4;
    ctx.lineTo(x + width / 2 + jitter, y);
  }
  ctx.closePath(); ctx.fill();
  // mist pool at base
  ctx.fillStyle = hexToRgba('#ffffff', 0.18);
  ctx.beginPath(); ctx.ellipse(x, bottomY, width * 1.6, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Layered animated water (3-tone waves) ──
function drawWater(ctx, w, h, frame, pal) {
  const crest = mixHex(pal.accent, '#74b4e2', 0.6);
  const mid = mixHex(pal.accent, '#3c7cb8', 0.5);
  const base = mixHex(pal.sil, '#2a4e8a', 0.5);
  const waterTop = h * 0.62;
  const g = ctx.createLinearGradient(0, waterTop, 0, h);
  g.addColorStop(0, mid); g.addColorStop(1, base);
  ctx.fillStyle = g; ctx.fillRect(0, waterTop, w, h - waterTop);
  for (let band = 0; band < 5; band++) {
    const by = waterTop + band * (h - waterTop) / 5;
    const amp = 5 + band * 2.6;
    const tone = band === 0 ? crest : band === 1 ? mid : band === 2 ? mixHex(mid, base, 0.4) : band === 3 ? mixHex(mid, base, 0.7) : base;
    ctx.fillStyle = hexToRgba(tone, 0.5 - band * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, by);
    for (let x = 0; x <= w; x += 10) {
      const wy = by + Math.sin(x * 0.02 + frame * 0.05 + band * 1.3) * amp;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(w, by + amp + 8); ctx.lineTo(0, by + amp + 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hexToRgba(band === 0 ? '#ffffff' : crest, 0.3 - band * 0.04);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const wy = by + Math.sin(x * 0.02 + frame * 0.05 + band * 1.3) * amp;
      x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  // shimmering light glints on the surface
  for (let i = 0; i < 24; i++) {
    const gx = (i * 61 + frame * 0.6) % w;
    const gy = waterTop + 10 + (i * 17) % (h - waterTop - 20);
    const tw = 0.3 + Math.sin(frame * 0.1 + i) * 0.3;
    if (tw > 0.35) {
      ctx.fillStyle = hexToRgba('#ffffff', tw * 0.4);
      ctx.fillRect(gx, gy, 6, 1.4);
    }
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
    ctx.fillStyle = '#3a2414';
    for (let p = 0; p < 3; p++) {
      ctx.fillRect(hx + p * 16 - 2, hy, 4, 32);
      ctx.fillRect(hx + p * 16 - 2, hy + 30, 4, 3); // waterline brace
    }
    ctx.fillStyle = '#7a5230'; ctx.fillRect(hx - 6, hy - 3, 52, 6);
    ctx.strokeStyle = hexToRgba('#4a2a14', 0.5); ctx.lineWidth = 1;
    for (let pl = 0; pl < 5; pl++) { ctx.beginPath(); ctx.moveTo(hx - 4 + pl * 10, hy - 3); ctx.lineTo(hx - 4 + pl * 10, hy + 3); ctx.stroke(); }
    const hc = houseColors[(i + (side === 'left' ? 0 : 2)) % houseColors.length];
    ctx.fillStyle = hc; ctx.fillRect(hx, hy - 34, 44, 32);
    ctx.fillStyle = hexToRgba('#000000', 0.12); ctx.fillRect(hx, hy - 34, 44, 8); // eave shadow
    ctx.fillStyle = mixHex(hc, '#000000', 0.35);
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 34); ctx.lineTo(hx + 22, hy - 50); ctx.lineTo(hx + 48, hy - 34); ctx.closePath(); ctx.fill();
    // roof ridge highlight
    ctx.strokeStyle = hexToRgba('#ffffff', 0.25); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx + 22, hy - 50); ctx.lineTo(hx + 22, hy - 46); ctx.stroke();
    ctx.fillStyle = hexToRgba('#ffeeaa', 0.85);
    ctx.fillRect(hx + 8, hy - 26, 10, 10);
    ctx.fillRect(hx + 26, hy - 26, 10, 10);
    ctx.strokeStyle = hexToRgba('#4a2a18', 0.6); ctx.lineWidth = 1;
    ctx.strokeRect(hx + 8, hy - 26, 10, 10); ctx.strokeRect(hx + 26, hy - 26, 10, 10);
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(hx + 18, hy - 16, 8, 14);
    // window reflection glow on water
    ctx.fillStyle = hexToRgba('#ffeeaa', 0.12);
    ctx.fillRect(hx + 6, hy + 4, 34, 3);
  }
}

// ── Hill with winding road + statue (mid-ground) ──
function drawHillWithStatue(ctx, w, h, frame, pal, side) {
  const waterTop = h * 0.62;
  const dir = side === 'left' ? 1 : -1;
  const baseX = side === 'left' ? 0 : w;
  ctx.fillStyle = mixHex('#7fb865', pal.sil, 0.25);
  ctx.beginPath();
  ctx.moveTo(baseX, waterTop);
  ctx.quadraticCurveTo(baseX + dir * 120, waterTop - 40, baseX + dir * 180, waterTop - 110);
  ctx.quadraticCurveTo(baseX + dir * 240, waterTop - 40, baseX + dir * 300, waterTop);
  ctx.closePath(); ctx.fill();
  // tree dots scattered on hill for texture
  ctx.fillStyle = hexToRgba(mixHex('#4f8a3a', pal.sil, 0.2), 0.7);
  for (let t = 0; t < 14; t++) {
    const tx = baseX + dir * (20 + srand(t) * 260);
    const ty = waterTop - 10 - srand(t + 5) * 90;
    if (ty < waterTop - 8) { ctx.beginPath(); ctx.arc(tx, ty, 5 + srand(t + 2) * 4, 0, Math.PI * 2); ctx.fill(); }
  }
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
  const peakX = baseX + dir * 220, peakY = waterTop - 104;
  ctx.fillStyle = '#8c9fa1';
  ctx.fillRect(peakX - 14, peakY - 4, 28, 8);
  ctx.beginPath(); ctx.ellipse(peakX, peakY - 18, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(peakX + dir * 10, peakY - 24, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(peakX - dir * 6, peakY - 28); ctx.lineTo(peakX - dir * 16, peakY - 40); ctx.lineTo(peakX - dir * 2, peakY - 30); ctx.fill();
  ctx.fillStyle = hexToRgba('#ffffff', 0.2); ctx.fillRect(peakX - 14, peakY - 4, 28, 2);
  // weathering cracks on statue
  ctx.strokeStyle = hexToRgba('#000000', 0.15); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(peakX - 4, peakY - 30); ctx.lineTo(peakX - 2, peakY - 12); ctx.stroke();
}

// ── Small stone gate silhouette in the far distance (purely architectural motif) ──
function drawFarGate(ctx, w, h, pal, cx, baseY, scale) {
  ctx.save();
  ctx.fillStyle = hexToRgba(mixHex(pal.sil, '#8a3a2a', 0.4), 0.6);
  const legW = 6 * scale, legH = 46 * scale, spread = 34 * scale;
  ctx.fillRect(cx - spread, baseY - legH, legW, legH);
  ctx.fillRect(cx + spread - legW, baseY - legH, legW, legH);
  ctx.fillRect(cx - spread - 6 * scale, baseY - legH - 10 * scale, spread * 2 + 12 * scale, 8 * scale);
  ctx.fillRect(cx - spread - 12 * scale, baseY - legH - 22 * scale, spread * 2 + 24 * scale, 7 * scale);
  ctx.restore();
}

// ── MOTIF: coastal ──
function motifCoastal(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 30, '#ffffff', 0.25);
  drawClouds(ctx, w, h, frame, pal, 8, 0.13);
  drawDistantMountains(ctx, w, h, pal, mixHex(pal.skyBottom, '#7fd9d8', 0.4));
  drawFarGate(ctx, w, h, pal, w * 0.5, h * 0.615, 0.7);
  drawHillWithStatue(ctx, w, h, frame, pal, 'left');
  drawHillWithStatue(ctx, w, h, frame, pal, 'right');
  drawWater(ctx, w, h, frame, pal);
  drawPierHouses(ctx, w, h, frame, pal, 'left');
  drawPierHouses(ctx, w, h, frame, pal, 'right');
  // gulls
  ctx.strokeStyle = hexToRgba('#ffffff', 0.4); ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const gx = (i * 210 + frame * 0.4) % w, gy = h * 0.18 + srand(i) * h * 0.12;
    ctx.beginPath(); ctx.moveTo(gx - 6, gy); ctx.quadraticCurveTo(gx, gy - 4, gx + 6, gy);
    ctx.moveTo(gx + 6, gy); ctx.quadraticCurveTo(gx + 12, gy - 4, gx + 18, gy); ctx.stroke();
  }
}

// ── MOTIF: city (dense neon skyline) ──
function motifCity(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 60, '#ffffff', 0.45);
  drawClouds(ctx, w, h, frame, pal, 5, 0.07);
  // far hazy skyline layer
  ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.1), 0.35);
  for (let i = 0; i < Math.ceil(w / 60); i++) {
    const bw = 30 + srand(i + 50) * 30, bh = 90 + srand(i + 51) * 140, x = i * 60;
    ctx.fillRect(x, h - bh, bw, bh);
  }
  const count = Math.ceil(w / 78);
  for (let i = 0; i < count; i++) {
    const bw = 46 + Math.floor(srand(i + 1) * 50);
    const bh = 150 + Math.floor(srand(i + 2) * 220);
    const x = i * 78 + srand(i + 3) * 16;
    const g = ctx.createLinearGradient(x, h - bh, x, h);
    g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.2));
    g.addColorStop(1, pal.sil);
    ctx.fillStyle = g; ctx.fillRect(x, h - bh, bw, bh);
    // rooftop cap detail (varied silhouette, not flat boxes)
    ctx.fillStyle = pal.sil;
    const capType = Math.floor(srand(i + 40) * 3);
    if (capType === 0) { ctx.fillRect(x + bw * 0.3, h - bh - 18, bw * 0.4, 18); }
    else if (capType === 1) { ctx.beginPath(); ctx.moveTo(x, h - bh); ctx.lineTo(x + bw / 2, h - bh - 22); ctx.lineTo(x + bw, h - bh); ctx.fill(); }
    else { ctx.fillRect(x + 4, h - bh - 10, bw - 8, 10); ctx.fillRect(x + bw * 0.4, h - bh - 24, bw * 0.2, 14); }
    ctx.strokeStyle = hexToRgba(pal.accent, 0.4); ctx.lineWidth = 1;
    ctx.strokeRect(x, h - bh, bw, bh);
    for (let wy = h - bh + 14; wy < h - 14; wy += 18) {
      for (let wx = x + 7; wx < x + bw - 7; wx += 13) {
        if (srand(wx * wy + i) > 0.4) {
          const lit = srand(wx + wy) > 0.5;
          ctx.fillStyle = pal.neon
            ? (lit ? hexToRgba('#FFD700', 0.6) : hexToRgba(pal.accent, 0.55))
            : hexToRgba('#4466FF', 0.4);
          ctx.fillRect(wx, wy, 6.5, 8.5);
        }
      }
    }
    // vertical neon accent strip on some towers
    if (srand(i + 21) > 0.55) {
      ctx.fillStyle = hexToRgba(pal.accent, 0.5 + Math.sin(frame * 0.06 + i) * 0.15);
      ctx.fillRect(x + bw * 0.5 - 1.5, h - bh + 6, 3, bh - 12);
    }
    if (srand(i + 9) > 0.6) {
      ctx.strokeStyle = pal.sil; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + bw / 2, h - bh); ctx.lineTo(x + bw / 2, h - bh - 24); ctx.stroke();
      const blink = (Math.sin(frame * 0.1 + i) > 0) ? '#FF4444' : '#440000';
      ctx.fillStyle = blink; ctx.beginPath(); ctx.arc(x + bw / 2, h - bh - 26, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  // holographic ring signage shapes (no text, just glowing geometric ads)
  for (let i = 0; i < 3; i++) {
    const rx = (i * w / 3) + w / 6, ry = h * 0.3 + srand(i + 60) * h * 0.15;
    ctx.strokeStyle = hexToRgba(pal.accent, 0.3 + Math.sin(frame * 0.05 + i) * 0.1);
    ctx.lineWidth = 3;
    ctx.strokeRect(rx - 20, ry - 12, 40, 24);
    ctx.beginPath(); ctx.arc(rx, ry, 8, 0, Math.PI * 2); ctx.stroke();
  }
  // volumetric light beams from streets below
  for (let i = 0; i < 3; i++) {
    const bx = (i * w / 3) + w / 6;
    const g = ctx.createLinearGradient(bx, h * 0.4, bx, h);
    g.addColorStop(0, hexToRgba(pal.accent, 0.14)); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(bx - 40, h); ctx.lineTo(bx - 6, h * 0.4); ctx.lineTo(bx + 6, h * 0.4); ctx.lineTo(bx + 40, h); ctx.fill();
  }
}

// ── MOTIF: mansion ──
function motifMansion(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 70, '#ddddff', 0.4);
  drawClouds(ctx, w, h, frame, pal, 5, 0.09);
  ctx.fillStyle = '#DDDDEE'; ctx.shadowColor = '#DDDDEE'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(w * 0.78, 80, 30, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  // craters
  ctx.fillStyle = hexToRgba('#aaaacc', 0.4);
  ctx.beginPath(); ctx.arc(w * 0.78 - 8, 74, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.78 + 10, 88, 5, 0, Math.PI * 2); ctx.fill();
  drawDistantMountains(ctx, w, h, pal, mixHex(pal.sil, '#334455', 0.3));
  const mw = 300, mh = 230, mx = w / 2 - mw / 2;
  const g = ctx.createLinearGradient(mx, h - mh, mx, h);
  g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.22)); g.addColorStop(1, pal.sil);
  ctx.fillStyle = g; ctx.fillRect(mx, h - mh, mw, mh);
  // stone block texture lines
  ctx.strokeStyle = hexToRgba('#000000', 0.1); ctx.lineWidth = 1;
  for (let r = 0; r < 8; r++) { ctx.beginPath(); ctx.moveTo(mx, h - mh + r * 28); ctx.lineTo(mx + mw, h - mh + r * 28); ctx.stroke(); }
  ctx.fillStyle = pal.sil;
  ctx.fillRect(mx - 36, h - mh - 64, 56, mh + 64);
  ctx.fillRect(mx + mw - 20, h - mh - 64, 56, mh + 64);
  // corner turret finials
  ctx.fillStyle = mixHex(pal.sil, '#000000', 0.4);
  ctx.beginPath(); ctx.moveTo(mx - 36, h - mh - 64); ctx.lineTo(mx - 8, h - mh - 110); ctx.lineTo(mx + 20, h - mh - 64); ctx.fill();
  ctx.beginPath(); ctx.moveTo(mx + mw - 20, h - mh - 64); ctx.lineTo(mx + mw + 8, h - mh - 110); ctx.lineTo(mx + mw + 36, h - mh - 64); ctx.fill();
  ctx.beginPath(); ctx.arc(mx - 8, h - mh - 112, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(mx + mw + 8, h - mh - 112, 4, 0, Math.PI * 2); ctx.fill();
  // main roof + spire
  ctx.beginPath(); ctx.moveTo(mx - 10, h - mh); ctx.lineTo(mx + mw / 2, h - mh - 70); ctx.lineTo(mx + mw + 10, h - mh); ctx.fill();
  ctx.strokeStyle = hexToRgba('#000000', 0.15); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx + mw / 2, h - mh - 70); ctx.lineTo(mx + mw / 2, h - mh); ctx.stroke();
  // glowing windows w/ frame + arch top
  for (let i = 0; i < 4; i++) {
    const wx = mx + 34 + i * 58;
    ctx.fillStyle = hexToRgba(pal.accent, 0.55);
    ctx.beginPath();
    ctx.moveTo(wx, h - mh + 60); ctx.lineTo(wx, h - mh + 46);
    ctx.quadraticCurveTo(wx + 13, h - mh + 36, wx + 26, h - mh + 46);
    ctx.lineTo(wx + 26, h - mh + 60); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hexToRgba('#000000', 0.2); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = hexToRgba('#ffffff', 0.25);
    ctx.fillRect(wx, h - mh + 44, 26, 3);
  }
  // ivy / vine texture at base
  ctx.strokeStyle = hexToRgba('#2a4a2a', 0.4); ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const vx = mx + 20 + i * 55;
    ctx.beginPath(); ctx.moveTo(vx, h); 
    for (let s = 1; s <= 4; s++) ctx.lineTo(vx + Math.sin(s) * 8, h - s * 14);
    ctx.stroke();
  }
  ctx.strokeStyle = mixHex(pal.sil, '#000000', 0.3); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(mx + mw / 2 - 16, h); ctx.lineTo(mx + mw / 2 - 16, h - 40);
  ctx.moveTo(mx + mw / 2 + 16, h); ctx.lineTo(mx + mw / 2 + 16, h - 40); ctx.stroke();
}

// ── MOTIF: forest (layered canopy + mist + spores) ──
function motifForest(ctx, w, h, frame, pal) {
  drawClouds(ctx, w, h, frame, pal, 4, 0.05);
  // far mist bands between tree layers
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = hexToRgba(mixHex(pal.sil, '#ffffff', 0.4), 0.06);
    ctx.fillRect(0, h * (0.45 + i * 0.1), w, 30);
  }
  for (let i = 0; i < Math.ceil(w / 46); i++) {
    const tx = i * 46 + srand(i) * 18;
    const th = 100 + Math.floor(srand(i + 5) * 100);
    ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.2), 0.55);
    ctx.fillRect(tx + 14, h - th, 7, th);
    ctx.beginPath(); ctx.arc(tx + 17, h - th - 22, 27, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < Math.ceil(w / 70); i++) {
    const tx = i * 70 + 30 + srand(i + 9) * 14;
    const th = 145 + Math.floor(srand(i + 11) * 95);
    const g = ctx.createLinearGradient(tx, h - th, tx, h);
    g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.18)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g; ctx.fillRect(tx + 18, h - th, 11, th);
    // bark texture
    ctx.strokeStyle = hexToRgba('#000000', 0.15); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx + 21, h - th + 10); ctx.lineTo(tx + 21, h - 10); ctx.stroke();
    ctx.fillStyle = pal.sil;
    ctx.beginPath(); ctx.arc(tx + 23, h - th - 30, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 6, h - th - 16, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 42, h - th - 18, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 23, h - th - 52, 20, 0, Math.PI * 2); ctx.fill();
    // canopy rim light
    ctx.fillStyle = hexToRgba(pal.accent, 0.18);
    ctx.beginPath(); ctx.arc(tx + 15, h - th - 40, 30, Math.PI * 1.1, Math.PI * 1.6); ctx.fill();
  }
  // undergrowth silhouettes at base
  ctx.fillStyle = hexToRgba(pal.sil, 0.6);
  for (let i = 0; i < Math.ceil(w / 30); i++) {
    const fx = i * 30 + srand(i + 80) * 10;
    ctx.beginPath(); ctx.moveTo(fx, h); ctx.lineTo(fx + 4, h - 14 - srand(i) * 12); ctx.lineTo(fx + 9, h); ctx.fill();
  }
  for (let i = 0; i < 22; i++) {
    const fx = (i * 53 + frame * 0.3) % w;
    const fy = (i * 37 + Math.sin(frame * 0.02 + i) * 18) % h;
    ctx.fillStyle = hexToRgba(pal.accent, 0.35);
    ctx.beginPath(); ctx.arc(fx, fy, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
  }
}

// ── MOTIF: mountains (peaks + snow + waterfall + road) ──
function motifMountains(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 40, '#ffffff', 0.35);
  drawClouds(ctx, w, h, frame, pal, 6, 0.11);
  ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.2), 0.6);
  for (let i = 0; i < 6; i++) {
    const px = i * (w / 5) - 40;
    ctx.beginPath(); ctx.moveTo(px, h); ctx.lineTo(px + 120, h - 240 - srand(i) * 70); ctx.lineTo(px + 240, h); ctx.fill();
  }
  for (let i = 0; i < 7; i++) {
    const px = i * (w / 6) - 60;
    const ph = 170 + srand(i + 3) * 90;
    const g = ctx.createLinearGradient(px, h - ph, px, h);
    g.addColorStop(0, mixHex(pal.sil, pal.accent, 0.15)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px, h); ctx.lineTo(px + 110, h - ph); ctx.lineTo(px + 220, h); ctx.fill();
    // rock striation shading
    ctx.strokeStyle = hexToRgba('#000000', 0.08); ctx.lineWidth = 1;
    for (let s = 0; s < 4; s++) {
      ctx.beginPath(); ctx.moveTo(px + 40 + s * 20, h); ctx.lineTo(px + 90 + s * 8, h - ph * 0.5); ctx.stroke();
    }
    ctx.fillStyle = hexToRgba('#ffffff', 0.7);
    ctx.beginPath(); ctx.moveTo(px + 110, h - ph); ctx.lineTo(px + 86, h - ph + 30); ctx.lineTo(px + 134, h - ph + 30); ctx.fill();
    if (i === 3) drawWaterfallRibbon(ctx, px + 110, h - ph + 26, h - 30, 9, frame, pal.accent);
  }
}

// ── MOTIF: ice (snow mounds + crystal shards + ground glints) ──
function motifIce(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 55, '#ffffff', 0.4);
  drawClouds(ctx, w, h, frame, pal, 5, 0.09);
  for (let i = 0; i < 5; i++) {
    const mx = i * (w / 4) - 60;
    const g = ctx.createLinearGradient(mx, h, mx, h - 70);
    g.addColorStop(0, mixHex(pal.sil, '#ffffff', 0.3)); g.addColorStop(1, hexToRgba(pal.sil, 0.7));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(mx, h, 190, 75, 0, Math.PI, 0); ctx.fill();
    // sparkle glints across the snow
    for (let s = 0; s < 6; s++) {
      const sx = mx - 140 + srand(i * 10 + s) * 280, sy = h - 8 - srand(s + i) * 40;
      if (Math.sin(frame * 0.08 + s + i) > 0.6) {
        ctx.fillStyle = hexToRgba('#ffffff', 0.7);
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
  }
  for (let i = 0; i < 9; i++) {
    const cx = i * (w / 8) + 40;
    const ch = 70 + srand(i) * 60;
    const g = ctx.createLinearGradient(cx, h - 60, cx, h - 60 - ch);
    g.addColorStop(0, hexToRgba(pal.accent, 0.5)); g.addColorStop(1, hexToRgba('#ffffff', 0.3));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx, h - 60); ctx.lineTo(cx - 13, h - 60 + ch); ctx.lineTo(cx + 13, h - 60 + ch); ctx.fill();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.4); ctx.lineWidth = 1; ctx.stroke();
    // internal facet lines for a cut-gem look
    ctx.strokeStyle = hexToRgba('#ffffff', 0.3);
    ctx.beginPath(); ctx.moveTo(cx, h - 60); ctx.lineTo(cx - 5, h - 60 + ch * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, h - 60); ctx.lineTo(cx + 5, h - 60 + ch * 0.6); ctx.stroke();
  }
}

// ── MOTIF: lava (glow + rock cones + cracks + drips) ──
function motifLava(ctx, w, h, frame, pal) {
  const glow = ctx.createLinearGradient(0, h * 0.45, 0, h);
  glow.addColorStop(0, 'transparent'); glow.addColorStop(1, hexToRgba(pal.accent, 0.4));
  ctx.fillStyle = glow; ctx.fillRect(0, h * 0.45, w, h * 0.55);
  drawClouds(ctx, w, h, frame, pal, 3, 0.05);
  for (let i = 0; i < 6; i++) {
    const px = i * (w / 5) - 40;
    const g = ctx.createLinearGradient(px, h - 170, px, h);
    g.addColorStop(0, mixHex(pal.sil, '#000000', 0.2)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px, h); ctx.lineTo(px + 90, h - 160 - srand(i) * 60); ctx.lineTo(px + 180, h); ctx.fill();
    ctx.strokeStyle = hexToRgba('#000000', 0.2); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 60, h); ctx.lineTo(px + 85, h - 100); ctx.stroke();
  }
  const pulse = 0.5 + Math.sin(frame * 0.08) * 0.2;
  ctx.strokeStyle = hexToRgba(pal.accent, 0.7 * pulse); ctx.lineWidth = 2.5; ctx.shadowColor = pal.accent; ctx.shadowBlur = 10;
  for (let i = 0; i < 6; i++) {
    const cx = i * (w / 5) + 30;
    ctx.beginPath(); ctx.moveTo(cx, h - 20); ctx.lineTo(cx + 12, h - 60); ctx.lineTo(cx - 8, h - 110); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // slow drifting embers rising
  for (let i = 0; i < 16; i++) {
    const ex = (i * 71 + Math.sin(i) * 30) % w;
    const ey = h - ((i * 53 + frame * 0.5) % (h * 0.7));
    ctx.fillStyle = hexToRgba('#ffcc66', 0.5);
    ctx.beginPath(); ctx.arc(ex, ey, 1.2, 0, Math.PI * 2); ctx.fill();
  }
}

// ── MOTIF: crystals (refracted shards + clustered geodes) ──
function motifCrystals(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 35, pal.accent, 0.3);
  // background haze glow cluster
  for (let i = 0; i < 3; i++) {
    const gx = (i * w / 3) + w / 6;
    const grad = ctx.createRadialGradient(gx, h * 0.5, 10, gx, h * 0.5, 160);
    grad.addColorStop(0, hexToRgba(pal.accent, 0.12)); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < 12; i++) {
    const cx = i * (w / 11) + 30;
    const ch = 80 + srand(i) * 110;
    const cw = 18 + srand(i + 2) * 22;
    const g = ctx.createLinearGradient(cx, h - ch, cx, h);
    g.addColorStop(0, hexToRgba('#ffffff', 0.4)); g.addColorStop(0.5, hexToRgba(pal.accent, 0.5)); g.addColorStop(1, hexToRgba(pal.accent, 0.2));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx, h - ch); ctx.lineTo(cx - cw, h); ctx.lineTo(cx + cw, h); ctx.fill();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.35); ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.5); ctx.beginPath(); ctx.moveTo(cx, h - ch); ctx.lineTo(cx, h); ctx.stroke();
    // small companion shards clustered at base
    for (let s = 0; s < 2; s++) {
      const sx = cx + (s === 0 ? -cw * 1.3 : cw * 1.3), sh = ch * 0.35;
      ctx.fillStyle = hexToRgba(pal.accent, 0.3);
      ctx.beginPath(); ctx.moveTo(sx, h - sh); ctx.lineTo(sx - 6, h); ctx.lineTo(sx + 6, h); ctx.fill();
    }
  }
}

// ── MOTIF: clouds (floating islands with rooted structure + chains) ──
function motifClouds(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 45, '#ffffff', 0.35);
  drawClouds(ctx, w, h, frame, pal, 9, 0.15);
  for (let i = 0; i < 5; i++) {
    const ix = (i * (w / 4) + frame * 0.08) % (w + 220) - 110;
    const iy = h * 0.22 + srand(i) * h * 0.32;
    // rocky underside (jagged, not just an ellipse)
    ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.1), 0.75);
    ctx.beginPath();
    ctx.moveTo(ix - 42, iy);
    ctx.lineTo(ix - 20, iy + 26); ctx.lineTo(ix, iy + 14); ctx.lineTo(ix + 24, iy + 30); ctx.lineTo(ix + 42, iy);
    ctx.closePath(); ctx.fill();
    // cloud base under island
    ctx.fillStyle = hexToRgba(mixHex(pal.sil, pal.accent, 0.15), 0.7);
    ctx.beginPath(); ctx.ellipse(ix, iy, 76, 20, 0, 0, Math.PI * 2); ctx.fill();
    // island top plateau
    ctx.fillStyle = pal.sil;
    ctx.beginPath(); ctx.ellipse(ix, iy - 4, 42, 14, 0, 0, Math.PI * 2); ctx.fill();
    // small foliage tuft on top
    ctx.fillStyle = hexToRgba('#4a8a4a', 0.5);
    ctx.beginPath(); ctx.arc(ix - 10, iy - 12, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ix + 8, iy - 10, 6, 0, Math.PI * 2); ctx.fill();
    // hanging chain fragment (small ruin detail, like reference)
    if (srand(i + 30) > 0.5) {
      ctx.strokeStyle = hexToRgba('#888888', 0.3); ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let s = 0; s < 5; s++) ctx.lineTo(ix + 20, iy + 20 + s * 6 + Math.sin(frame * 0.05 + s) * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = hexToRgba(pal.accent, 0.3); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ix, iy + 16); ctx.lineTo(ix, iy + 44 + Math.sin(frame * 0.1 + i) * 6); ctx.stroke();
  }
}

// ── MOTIF: void (nebula clouds + drifting orbs + shard debris) ──
function motifVoid(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 80, pal.accent, 0.45);
  for (let i = 0; i < 6; i++) {
    const vx = (i * 170 + frame * 0.08 * (i % 2 === 0 ? 1 : -1)) % (w + 200) - 100;
    const vy = h * (0.2 + i * 0.12);
    const grad = ctx.createRadialGradient(vx, vy, 5, vx, vy, 120);
    grad.addColorStop(0, hexToRgba(pal.accent, 0.22)); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(vx, vy, 130, 65, 0, 0, Math.PI * 2); ctx.fill();
  }
  // drifting broken shard fragments (debris, no characters)
  for (let i = 0; i < 8; i++) {
    const dx = (i * 210 + frame * 0.15) % (w + 100) - 50;
    const dy = h * 0.3 + Math.sin(frame * 0.02 + i * 2) * 40 + srand(i) * h * 0.35;
    const sz = 6 + srand(i + 4) * 10;
    ctx.save(); ctx.translate(dx, dy); ctx.rotate(frame * 0.01 + i);
    ctx.fillStyle = hexToRgba(pal.accent, 0.3);
    ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.7, sz * 0.5); ctx.lineTo(-sz * 0.6, sz * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ── MOTIF: grid (retro sun + perspective grid + banners) ──
function motifGrid(ctx, w, h, frame, pal) {
  const sg = ctx.createRadialGradient(w * 0.2, 80, 5, w * 0.2, 80, 60);
  sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.5, pal.accent); sg.addColorStop(1, 'transparent');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(w * 0.2, 80, 50, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pal.skyBottom;
  for (let b = 0; b < 4; b++) ctx.fillRect(w * 0.2 - 50, 70 + b * 8, 100, 3);
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
  // distant low silhouette skyline above horizon for depth
  ctx.fillStyle = hexToRgba(pal.sil, 0.5);
  for (let i = 0; i < 10; i++) {
    const bx = i * (w / 9), bh = 20 + srand(i) * 34;
    ctx.fillRect(bx, horizon - bh, w / 12, bh);
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = hexToRgba(pal.accent, 0.35);
    ctx.fillRect(i * 220 + 80, 0, 14, 60 + Math.sin(frame * 0.05 + i) * 8);
  }
}

// ── MOTIF: arena (tiered stands + pillars + banners + torches) ──
function motifArena(ctx, w, h, frame, pal) {
  drawStars(ctx, w, h, frame, 35, '#ffffff', 0.3);
  drawClouds(ctx, w, h, frame, pal, 4, 0.07);
  for (let i = 0; i < 4; i++) {
    const sy = h - 40 - i * 55;
    const g = ctx.createLinearGradient(0, sy, 0, sy + 45);
    g.addColorStop(0, hexToRgba(pal.sil, 0.4 + i * 0.12)); g.addColorStop(1, hexToRgba(pal.sil, 0.6 + i * 0.1));
    ctx.fillStyle = g; ctx.fillRect(0, sy, w, 45);
    ctx.strokeStyle = hexToRgba(pal.accent, 0.25); ctx.lineWidth = 1; ctx.strokeRect(0, sy, w, 45);
    // arch supports beneath each tier
    ctx.strokeStyle = hexToRgba('#000000', 0.15); ctx.lineWidth = 1;
    for (let a = 0; a < 14; a++) {
      const ax = a * (w / 14) + 10;
      ctx.beginPath(); ctx.arc(ax, sy + 45, 12, Math.PI, 0); ctx.stroke();
    }
    ctx.fillStyle = hexToRgba(pal.accent, 0.4);
    for (let c = 0; c < 40; c++) {
      ctx.beginPath(); ctx.arc(c * (w / 40) + srand(c + i) * 8, sy + 12 + srand(c) * 20, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (let i = 0; i < 6; i++) {
    const px = i * (w / 5) + 20;
    const g = ctx.createLinearGradient(px, h * 0.2, px, h * 0.7);
    g.addColorStop(0, mixHex(pal.sil, '#ffffff', 0.15)); g.addColorStop(1, pal.sil);
    ctx.fillStyle = g; ctx.fillRect(px, h * 0.2, 32, h * 0.5);
    ctx.fillRect(px - 4, h * 0.2, 40, 8);
    ctx.fillRect(px - 2, h * 0.7 - 4, 36, 8); // base plinth
    // flame torch atop each pillar
    const flick = 0.7 + Math.sin(frame * 0.2 + i) * 0.2;
    ctx.fillStyle = hexToRgba('#ffaa33', flick);
    ctx.beginPath(); ctx.moveTo(px + 16, h * 0.2 - 8); ctx.quadraticCurveTo(px + 24, h * 0.2 - 20, px + 16, h * 0.2 - 30); ctx.quadraticCurveTo(px + 8, h * 0.2 - 20, px + 16, h * 0.2 - 8); ctx.fill();
  }
  // triangular pennant banners hung between pillars
  for (let i = 0; i < 5; i++) {
    const bx = i * (w / 5) + 52;
    ctx.fillStyle = hexToRgba(pal.accent, 0.4);
    ctx.beginPath(); ctx.moveTo(bx, h * 0.22); ctx.lineTo(bx + 26, h * 0.22); ctx.lineTo(bx + 13, h * 0.34 + Math.sin(frame * 0.03 + i) * 3); ctx.fill();
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
  const rayCount = 5;
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

// ── Floating dust motes ──
function drawDustMotes(ctx, w, h, frame, pal) {
  ctx.save();
  for (let i = 0; i < 22; i++) {
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

// ── Foreground silhouette layer ──
function drawForegroundSilhouette(ctx, w, h, frame, pal) {
  ctx.save();
  ctx.fillStyle = hexToRgba(pal.sil, 0.5);
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - 40);
  ctx.quadraticCurveTo(40, h - 60, 80, h - 50);
  ctx.quadraticCurveTo(120, h - 40, 160, h - 55);
  ctx.quadraticCurveTo(200, h - 70, 240, h - 45);
  ctx.lineTo(260, h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w, h);
  ctx.lineTo(w, h - 35);
  ctx.quadraticCurveTo(w - 50, h - 55, w - 100, h - 45);
  ctx.quadraticCurveTo(w - 150, h - 35, w - 200, h - 50);
  ctx.quadraticCurveTo(w - 250, h - 65, w - 280, h - 40);
  ctx.lineTo(w - 300, h);
  ctx.closePath();
  ctx.fill();
  // texture speckle on the mounds for grit
  ctx.fillStyle = hexToRgba('#000000', 0.15);
  for (let i = 0; i < 10; i++) {
    ctx.beginPath(); ctx.arc(srand(i) * 260, h - 20 - srand(i + 4) * 20, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w - srand(i + 8) * 280, h - 20 - srand(i + 9) * 20, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ── Depth vignette ──
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

  drawSky(ctx, w, h, pal);

  const motif = MOTIFS[pal.motif] || motifCity;
  motif(ctx, w, h, frame, pal);

  drawLightRays(ctx, w, h, frame, pal);
  drawDustMotes(ctx, w, h, frame, pal);

  drawWeather(ctx, w, h, frame, pal.weather, pal.accent);

  const accent = (mapData && mapData.accentColor) || pal.accent;
  const floorGrad = ctx.createLinearGradient(0, h - 90, 0, h);
  floorGrad.addColorStop(0, 'transparent');
  floorGrad.addColorStop(1, hexToRgba(accent, 0.12));
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h - 90, w, 90);

  drawForegroundSilhouette(ctx, w, h, frame, pal);
  drawDepthVignette(ctx, w, h, pal);
}

// ── Weather ──
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
