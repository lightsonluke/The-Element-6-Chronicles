// Shikigami — purely cosmetic floating companions. NO gameplay effect.
// Each Shikigami has a draw(ctx, x, y, frame, scale) function that paints a
// small (~1.5× head-size) spirit at the follower's smoothed position.
// drawShikigamiFollower handles the smooth follow + idle bob and caches its
// per-fighter trail state on fighter._shikigamiState.
//
// Renderers use gradient shading, layered body parts, secondary motion
// (tail wag, wing flap, ear twitch), and ambient particles for depth.

const GLOW = (ctx, x, y, r, color, a = 0.5) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
// Radial-shaded ellipse: a soft 3D-ish body fill with a highlight offset toward the light.
const SHADE = (ctx, x, y, rx, ry, rot, base, hi) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, rx * 0.1, 0, 0, Math.max(rx, ry));
  g.addColorStop(0, hi || base);
  g.addColorStop(0.55, base);
  g.addColorStop(1, base);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
const ELL = (ctx, x, y, rx, ry, rot, color) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
const CIR = (ctx, x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const RING = (ctx, x, y, r, color, w = 2) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); };
// Eye with pupil + glint for a more "alive" look.
const EYE = (ctx, x, y, r, iris, pupil = '#000000') => {
  CIR(ctx, x, y, r, '#FFFFFF');
  CIR(ctx, x, y, r * 0.62, iris);
  CIR(ctx, x + r * 0.12, y - r * 0.18, r * 0.28, pupil);
  ctx.save(); ctx.globalAlpha = 0.85; CIR(ctx, x - r * 0.22, y - r * 0.3, r * 0.2, '#FFFFFF'); ctx.restore();
};
// Triangle ear with inner shading.
const EAR = (ctx, x, y, s, color, inner) => {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 4 * s, y); ctx.lineTo(x, y - 7 * s); ctx.lineTo(x + 4 * s, y + 1 * s); ctx.fill();
  if (inner) { ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(x - 1.6 * s, y - 0.5 * s); ctx.lineTo(x, y - 5 * s); ctx.lineTo(x + 1.6 * s, y + 0.5 * s); ctx.fill(); }
};
// A small drifting particle that orbits with frame-based phase.
const ORB = (ctx, cx, cy, frame, radius, i, speed, r, color, phase = 0) => {
  const a = frame * speed + i * 2.1 + phase;
  CIR(ctx, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.7, r, color);
};

export const SHIKIGAMI = [
  { id: 'kitsune', name: 'Kitsune', desc: 'White fox spirit with red markings and two glowing tails.', price: 220, color: '#FFFFFF', accent: '#FF3322', draw: drawKitsune },
  { id: 'kuro', name: 'Kuro', desc: 'Tiny black wolf with faint purple eyes and smoky fur.', price: 200, color: '#1A1A22', accent: '#AA66FF', draw: drawKuro },
  { id: 'tora', name: 'Tora', desc: 'Orange tiger spirit with dark stripes and a glowing tail.', price: 210, color: '#FF8800', accent: '#221100', draw: drawTora },
  { id: 'rai', name: 'Rai', desc: 'Thunderbird with dark feathers and electric sparks.', price: 230, color: '#332244', accent: '#FFFF44', draw: drawRai },
  { id: 'kaze', name: 'Kaze', desc: 'Pale-blue bird surrounded by swirling wind.', price: 180, color: '#AADDFF', accent: '#FFFFFF', draw: drawKaze },
  { id: 'hana', name: 'Hana', desc: 'Spirit deer with flower markings and blossoms on its antlers.', price: 200, color: '#FFDDEE', accent: '#FF66AA', draw: drawHana },
  { id: 'yuki', name: 'Yuki', desc: 'White rabbit with icy-blue markings and snow particles.', price: 190, color: '#FFFFFF', accent: '#88CCFF', draw: drawYuki },
  { id: 'mizu', name: 'Mizu', desc: 'Translucent blue koi spirit that swims through the air.', price: 210, color: '#4488FF', accent: '#AAEEFF', draw: drawMizu },
  { id: 'hi', name: 'Hi', desc: 'Red salamander surrounded by a subtle flame aura.', price: 200, color: '#FF4422', accent: '#FFAA22', draw: drawHi },
  { id: 'tsuki', name: 'Tsuki', desc: 'Silver rabbit with a crescent-moon marking and soft glow.', price: 220, color: '#CCCCCC', accent: '#DDEEFF', draw: drawTsuki },
  { id: 'sora', name: 'Sora', desc: 'White crane with faint blue patterns on its wings.', price: 200, color: '#FFFFFF', accent: '#88AAFF', draw: drawSora },
  { id: 'kumo', name: 'Kumo', desc: 'Gray spider with a tiny floating web beneath it.', price: 170, color: '#888888', accent: '#DDDDDD', draw: drawKumo },
  { id: 'kage', name: 'Kage', desc: 'Shadow cat with smoky body that fades at the edges.', price: 190, color: '#222233', accent: '#000000', draw: drawKage },
  { id: 'akuma', name: 'Akuma', desc: 'Red oni spirit with two miniature horns.', price: 210, color: '#DD2222', accent: '#FFAA22', draw: drawAkuma },
  { id: 'koi', name: 'Koi', desc: 'Red-and-white koi spirit with golden fins.', price: 200, color: '#FF3344', accent: '#FFD700', draw: drawKoi },
  { id: 'mori', name: 'Mori', desc: 'Round wooden forest spirit with leaves on its head.', price: 180, color: '#8B5A2B', accent: '#44AA44', draw: drawMori },
  { id: 'ishi', name: 'Ishi', desc: 'Stone turtle with glowing cracks across its shell.', price: 190, color: '#777766', accent: '#FFCC44', draw: drawIshi },
  { id: 'hoshi', name: 'Hoshi', desc: 'Star-shaped spirit with a golden glow and orbiting particles.', price: 220, color: '#FFDD44', accent: '#FFFFFF', draw: drawHoshi },
  { id: 'nami', name: 'Nami', desc: 'Water serpent made from translucent blue water.', price: 210, color: '#44AAFF', accent: '#AAEEFF', draw: drawNami },
  { id: 'kaminari', name: 'Kaminari', desc: 'Electric fox with yellow markings and sparks at its paws.', price: 230, color: '#FFCC22', accent: '#FFFF66', draw: drawKaminari },
  { id: 'tsubaki', name: 'Tsubaki', desc: 'Deep-red spirit bird with camellia flowers around it.', price: 200, color: '#CC1133', accent: '#FF6688', draw: drawTsubaki },
  { id: 'kumoji', name: 'Kumoji', desc: 'Cloud-like spirit with a cute face and trailing wisps.', price: 180, color: '#EEF2FF', accent: '#CCD0FF', draw: drawKumoji },
  { id: 'hebi', name: 'Hebi', desc: 'White-and-gold serpent that slowly coils while floating.', price: 210, color: '#FFF8DD', accent: '#FFD700', draw: drawHebi },
  { id: 'tanuki', name: 'Tanuki', desc: 'Brown tanuki spirit with a striped tail and a leaf on its head.', price: 190, color: '#885533', accent: '#66AA44', draw: drawTanuki },
  { id: 'karasu', name: 'Karasu', desc: 'Black crow spirit with blue-purple feather highlights.', price: 200, color: '#111118', accent: '#6644AA', draw: drawKarasu },
  { id: 'ryuu', name: 'Ryuu', desc: 'Eastern dragon with dark green scales, horns, and a smoke trail.', price: 260, color: '#226644', accent: '#88FFAA', draw: drawRyuu },
  { id: 'cho', name: 'Cho', desc: 'Glowing butterfly spirit with translucent purple wings.', price: 190, color: '#AA55FF', accent: '#FFCCFF', draw: drawCho },
  { id: 'sakura', name: 'Sakura', desc: 'Pink fox spirit surrounded by falling cherry-blossom petals.', price: 210, color: '#FFAADD', accent: '#FF77BB', draw: drawSakura },
  { id: 'hotaru', name: 'Hotaru', desc: 'Firefly spirit with a glowing yellow-green body and light particles.', price: 200, color: '#CCFF44', accent: '#FFFFAA', draw: drawHotaru },
  { id: 'shiro', name: 'Shiro', desc: 'Completely white wolf spirit with a faint silver aura and blue eyes.', price: 240, color: '#FFFFFF', accent: '#AABBFF', draw: drawShiro },
];

// All Shikigami cost the same price
SHIKIGAMI.forEach(s => { s.price = 2000; });

const SHIKIGAMI_MAP = Object.fromEntries(SHIKIGAMI.map(s => [s.id, s]));
export const getShikigami = (id) => SHIKIGAMI_MAP[id] || null;

// Each Shikigami grants +0.5 to one stat in combat (silently — not reflected in
// the stats screen). The shop description tells the player which stat it boosts.
const SHIKIGAMI_STATS = {
  kitsune: 'power', kuro: 'defense', tora: 'power', rai: 'speed', kaze: 'speed',
  hana: 'utility', yuki: 'defense', mizu: 'control', hi: 'power', tsuki: 'control',
  sora: 'speed', kumo: 'utility', kage: 'power', akuma: 'power', koi: 'control',
  mori: 'defense', ishi: 'defense', hoshi: 'utility', nami: 'control', kaminari: 'speed',
  tsubaki: 'power', kumoji: 'utility', hebi: 'control', tanuki: 'utility', karasu: 'speed',
  ryuu: 'power', cho: 'speed', sakura: 'utility', hotaru: 'utility', shiro: 'defense',
};
export const getShikigamiStat = (id) => SHIKIGAMI_STATS[id] || null;
// Apply the +0.5 Shikigami stat bonus to a stats object (returns a new object).
export function applyShikigamiStat(stats, shikigamiId) {
  if (!shikigamiId || !SHIKIGAMI_STATS[shikigamiId]) return stats;
  const stat = SHIKIGAMI_STATS[shikigamiId];
  return { ...stats, [stat]: (stats[stat] || 5) + 0.5 };
}

// ── Per-design draw functions ── each paints centered at (x, y), ~40px tall.
function drawKitsune(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 18 * s, '#FFEECC', 0.4);
  // two tails with gradient + sway
  ctx.save(); ctx.translate(x - 6 * s, y + 8 * s + bob);
  for (let i = 0; i < 2; i++) { const a = (i ? 1 : -1) + Math.sin(f * 0.04 + i) * 0.3; ctx.save(); ctx.rotate(a); SHADE(ctx, 0, 9 * s, 4 * s, 12 * s, 0, '#FFFFFF', '#FFF6E0'); ctx.restore(); } ctx.restore();
  SHADE(ctx, x, y + bob, 11 * s, 9 * s, 0, '#FFFFFF', '#FFF6E0'); // body
  SHADE(ctx, x, y - 8 * s + bob, 8 * s, 7.5 * s, 0, '#FFFFFF', '#FFF6E0'); // head
  // red cheek markings
  ctx.save(); ctx.globalAlpha = 0.7; ELL(ctx, x - 5 * s, y - 6 * s + bob, 2 * s, 1.2 * s, 0.3, '#FF3322'); ELL(ctx, x + 5 * s, y - 6 * s + bob, 2 * s, 1.2 * s, -0.3, '#FF3322'); ctx.restore();
  EYE(ctx, x - 3 * s, y - 9 * s + bob, 1.8 * s, '#FF3322'); EYE(ctx, x + 3 * s, y - 9 * s + bob, 1.8 * s, '#FF3322');
  ctx.fillStyle = '#FF3322'; ctx.beginPath(); ctx.moveTo(x, y - 5 * s + bob); ctx.lineTo(x - 2 * s, y - 3 * s + bob); ctx.lineTo(x + 2 * s, y - 3 * s + bob); ctx.fill();
  EAR(ctx, x - 6 * s, y - 13 * s + bob, s, '#FFFFFF', '#FFDDEE'); EAR(ctx, x + 6 * s, y - 13 * s + bob, s, '#FFFFFF', '#FFDDEE');
  // orbiting embers
  for (let i = 0; i < 3; i++) ORB(ctx, x, y + bob, f, 15 * s, i, 0.06, 1.1 * s, '#FF8844');
}
function drawKuro(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#7744AA', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#1A1A22', '#332244');
  SHADE(ctx, x, y - 8 * s + bob, 7 * s, 6.5 * s, 0, '#1A1A22', '#2A2A3A');
  // smoky tail with wisps
  ctx.save(); ctx.globalAlpha = 0.65; ELL(ctx, x - 9 * s, y + 6 * s + bob, 5 * s, 10 * s, 0.4, '#1A1A22'); ctx.restore();
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = 0.3; CIR(ctx, x - 11 * s - i * 2 * s + Math.sin(f * 0.05 + i) * 2, y + 10 * s + bob + i * 3, (3 - i * 0.6) * s, '#332244'); ctx.restore(); }
  EYE(ctx, x - 3 * s, y - 9 * s + bob, 1.6 * s, '#AA66FF'); EYE(ctx, x + 3 * s, y - 9 * s + bob, 1.6 * s, '#AA66FF');
  EAR(ctx, x - 6 * s, y - 13 * s + bob, s, '#1A1A22', '#332244'); EAR(ctx, x + 6 * s, y - 13 * s + bob, s, '#1A1A22', '#332244');
}
function drawTora(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#FF8800', 0.35);
  ctx.save(); ctx.globalAlpha = 0.75; SHADE(ctx, x - 10 * s, y + 4 * s + bob, 4 * s, 11 * s, 0.5, '#FFCC44', '#FFEEBB'); ctx.restore();
  SHADE(ctx, x, y + 2 * s + bob, 11 * s, 8.5 * s, 0, '#FF8800', '#FFAA44');
  SHADE(ctx, x, y - 8 * s + bob, 7 * s, 6.5 * s, 0, '#FF8800', '#FFAA44');
  // dark stripes
  ctx.strokeStyle = '#221100'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
  [0, 1, 2].forEach(i => { const yy = y - 12 * s + i * 4 * s + bob; ctx.beginPath(); ctx.moveTo(x - 6 * s, yy); ctx.lineTo(x - 2 * s, yy); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 2 * s + bob); ctx.lineTo(x - 3 * s, y - 1 * s + bob); ctx.stroke();
  EYE(ctx, x - 3 * s, y - 9 * s + bob, 1.7 * s, '#220000'); EYE(ctx, x + 3 * s, y - 9 * s + bob, 1.7 * s, '#220000');
  ctx.fillStyle = '#221100'; ctx.beginPath(); ctx.moveTo(x, y - 5 * s + bob); ctx.lineTo(x - 2 * s, y - 3 * s + bob); ctx.lineTo(x + 2 * s, y - 3 * s + bob); ctx.fill();
  EAR(ctx, x - 6 * s, y - 13 * s + bob, s, '#FF8800', '#221100'); EAR(ctx, x + 6 * s, y - 13 * s + bob, s, '#FF8800', '#221100');
}
function drawRai(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.08) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFFF44', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 7.5 * s, 0, '#332244', '#4A3A66');
  const wf = Math.sin(f * 0.15) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.5 + wf); SHADE(ctx, 0, 0, 6 * s, 11 * s, 0, '#332244', '#4A3A66'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.5 - wf); SHADE(ctx, 0, 0, 6 * s, 11 * s, 0, '#332244', '#4A3A66'); ctx.restore();
  SHADE(ctx, x, y - 8 * s + bob, 6 * s, 5.5 * s, 0, '#332244', '#4A3A66');
  // beak
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 6 * s + bob); ctx.lineTo(x - 2 * s, y - 4 * s + bob); ctx.lineTo(x + 2 * s, y - 4 * s + bob); ctx.fill();
  EYE(ctx, x - 2.5 * s, y - 9 * s + bob, 1.5 * s, '#FFFF44'); EYE(ctx, x + 2.5 * s, y - 9 * s + bob, 1.5 * s, '#FFFF44');
  // electric sparks — jagged mini bolts
  ctx.strokeStyle = '#FFFF66'; ctx.lineWidth = 1.2 * s; ctx.globalAlpha = 0.8;
  for (let i = 0; i < 3; i++) { const a = f * 0.1 + i * 2.1; const sx = x + Math.cos(a) * 13 * s, sy = y + Math.sin(a) * 9 * s + bob; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 3 * s, sy - 4 * s); ctx.lineTo(sx - 1 * s, sy - 5 * s); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function drawKaze(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  // swirling wind arcs
  ctx.save(); ctx.strokeStyle = '#AADDFF'; ctx.lineWidth = 1.8 * s; ctx.globalAlpha = 0.55; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const r = (10 + i * 5) * s + Math.sin(f * 0.05 + i) * 2; ctx.beginPath(); ctx.arc(x, y + bob, r, f * 0.04 + i, f * 0.04 + i + 1.6); ctx.stroke(); }
  ctx.restore();
  SHADE(ctx, x, y + 2 * s + bob, 8 * s, 7 * s, 0, '#AADDFF', '#DDEEFF');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#AADDFF', '#DDEEFF');
  const wf = Math.sin(f * 0.12) * 0.3;
  ctx.save(); ctx.translate(x - 6 * s, y + bob); ctx.rotate(-0.5 + wf); SHADE(ctx, 0, 0, 5 * s, 9 * s, 0, '#BBE0FF', '#FFFFFF'); ctx.restore();
  ctx.save(); ctx.translate(x + 6 * s, y + bob); ctx.rotate(0.5 - wf); SHADE(ctx, 0, 0, 5 * s, 9 * s, 0, '#BBE0FF', '#FFFFFF'); ctx.restore();
  EYE(ctx, x - 2.5 * s, y - 8 * s + bob, 1.4 * s, '#224466'); EYE(ctx, x + 2.5 * s, y - 8 * s + bob, 1.4 * s, '#224466');
  // drifting breeze motes
  for (let i = 0; i < 4; i++) ORB(ctx, x, y + bob, f, 16 * s, i, 0.05, 1 * s, '#DDEEFF', i);
}
function drawHana(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#FF66AA', 0.3);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 7 * s, 0, '#FFDDEE', '#FFEEF5');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFDDEE', '#FFEEF5');
  // antlers with blossoms
  ctx.strokeStyle = '#AA6655'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 12 * s + bob); ctx.quadraticCurveTo(x - 7 * s, y - 16 * s + bob, x - 8 * s, y - 19 * s + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4 * s, y - 12 * s + bob); ctx.quadraticCurveTo(x + 7 * s, y - 16 * s + bob, x + 8 * s, y - 19 * s + bob); ctx.stroke();
  [0, 1].forEach(i => { CIR(ctx, x - 8 * s + i * 2 * s, y - 19 * s + bob, 2.2 * s, '#FF99CC'); CIR(ctx, x - 8 * s + i * 2 * s, y - 19 * s + bob, 1 * s, '#FFDDEE'); CIR(ctx, x + 8 * s - i * 2 * s, y - 19 * s + bob, 2.2 * s, '#FF99CC'); CIR(ctx, x + 8 * s - i * 2 * s, y - 19 * s + bob, 1 * s, '#FFDDEE'); });
  // flower cheek marks
  ctx.save(); ctx.globalAlpha = 0.8; ELL(ctx, x - 4 * s, y - 6 * s + bob, 1.6 * s, 1 * s, 0.3, '#FF66AA'); ELL(ctx, x + 4 * s, y - 6 * s + bob, 1.6 * s, 1 * s, -0.3, '#FF66AA'); ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#FF66AA'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#FF66AA');
  // falling petals
  for (let i = 0; i < 4; i++) { const a = f * 0.02 + i * 1.6; const px = x + Math.cos(a) * 14 * s; const py = y + ((f * 0.4 + i * 24) % 20 - 10) * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ELL(ctx, 0, 0, 2 * s, 1.2 * s, 0, '#FFCCEE'); ctx.restore(); }
}
function drawYuki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#88CCFF', 0.35);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 8 * s, 0, '#FFFFFF', '#EEF6FF');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFFFFF', '#EEF6FF');
  // ears with icy inner
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 3 * s, y - 16 * s + bob); ctx.lineTo(x - 1 * s, y - 11 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 11 * s + bob); ctx.lineTo(x + 3 * s, y - 16 * s + bob); ctx.lineTo(x + 1 * s, y - 11 * s + bob); ctx.fill();
  ctx.fillStyle = '#88CCFF'; ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 11.5 * s + bob); ctx.lineTo(x - 3 * s, y - 14.5 * s + bob); ctx.lineTo(x - 2 * s, y - 11.5 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 4 * s, y - 11.5 * s + bob); ctx.lineTo(x + 3 * s, y - 14.5 * s + bob); ctx.lineTo(x + 2 * s, y - 11.5 * s + bob); ctx.fill();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#88CCFF'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#88CCFF');
  // snowflake particles
  for (let i = 0; i < 5; i++) { const a = f * 0.03 + i * 1.25; const px = x + Math.cos(a) * 13 * s; const py = y + Math.sin(a) * 10 * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a * 2); ctx.strokeStyle = '#DDEEFF'; ctx.lineWidth = 0.8 * s; for (let j = 0; j < 3; j++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-1.5 * s, 0); ctx.lineTo(1.5 * s, 0); ctx.stroke(); } ctx.restore(); }
}
function drawMizu(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 3 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#4488FF', 0.35);
  ctx.save(); ctx.globalAlpha = 0.75;
  SHADE(ctx, x, y + bob, 12 * s, 7 * s, Math.sin(f * 0.04) * 0.2, '#4488FF', '#88BBFF');
  // tail fin with wave
  ctx.save(); ctx.translate(x - 11 * s, y + bob); ctx.rotate(Math.sin(f * 0.08) * 0.4); SHADE(ctx, 0, 0, 4 * s, 8 * s, 0, '#AAEEFF', '#FFFFFF'); ctx.restore();
  ctx.restore();
  SHADE(ctx, x + 7 * s, y - 2 * s + bob, 5 * s, 4.5 * s, 0, '#4488FF', '#88BBFF');
  EYE(ctx, x + 5 * s, y - 3 * s + bob, 1.4 * s, '#FFFFFF', '#224488');
  // dorsal fin
  ctx.save(); ctx.globalAlpha = 0.65; ELL(ctx, x, y - 7 * s + bob, 4 * s, 3 * s, 0.3, '#AAEEFF'); ctx.restore();
  // water droplets
  for (let i = 0; i < 3; i++) ORB(ctx, x, y + bob, f, 15 * s, i, 0.07, 1 * s, '#AAEEFF', i * 0.5);
}
function drawHi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#FF4422', 0.4);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 6.5 * s, 0, '#FF4422', '#FF7755');
  SHADE(ctx, x + 6 * s, y + bob, 5 * s, 4.5 * s, 0, '#FF4422', '#FF7755');
  // flame aura — layered flickering tongues
  ctx.save(); ctx.globalAlpha = 0.55;
  for (let i = 0; i < 4; i++) { const h = (9 + Math.sin(f * 0.12 + i) * 4) * s; const fx = x - 8 * s + i * 5 * s; ctx.fillStyle = i % 2 ? '#FFAA22' : '#FF6622'; ctx.beginPath(); ctx.moveTo(fx, y + 8 * s + bob); ctx.quadraticCurveTo(fx + 2 * s, y + 8 * s - h * 0.6 + bob, fx, y + 8 * s - h + bob); ctx.quadraticCurveTo(fx - 2 * s, y + 8 * s - h * 0.6 + bob, fx, y + 8 * s + bob); ctx.fill(); }
  ctx.restore();
  EYE(ctx, x + 4 * s, y - 1 * s + bob, 1.4 * s, '#FFFF88'); EYE(ctx, x + 8 * s, y - 1 * s + bob, 1.4 * s, '#FFFF88');
  // ember sparks
  for (let i = 0; i < 3; i++) { const py = y + 12 * s + bob - ((f * 0.5 + i * 20) % 24) * s; CIR(ctx, x - 6 * s + i * 6 * s, py, 1 * s, '#FFCC44'); }
}
function drawTsuki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#DDEEFF', 0.45);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 8 * s, 0, '#CCCCCC', '#EEEEEE');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#CCCCCC', '#EEEEEE');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 3 * s, y - 16 * s + bob); ctx.lineTo(x - 1 * s, y - 11 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 11 * s + bob); ctx.lineTo(x + 3 * s, y - 16 * s + bob); ctx.lineTo(x + 1 * s, y - 11 * s + bob); ctx.fill();
  // crescent moon marking on forehead
  ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#DDEEFF'; ctx.beginPath(); ctx.arc(x, y - 7 * s + bob, 3.5 * s, 0.4, Math.PI * 1.4); ctx.fill(); ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.4 * s, '#88AAFF'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.4 * s, '#88AAFF');
  // twinkling stars
  for (let i = 0; i < 3; i++) { const a = f * 0.04 + i * 2; const px = x + Math.cos(a) * 15 * s, py = y + Math.sin(a) * 11 * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.rotate(Math.PI / 2); ctx.moveTo(0, 0); ctx.lineTo(1.2 * s, 0); } ctx.lineWidth = 0.8 * s; ctx.strokeStyle = '#FFFFFF'; for (let j = 0; j < 4; j++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1.4 * s, 0); ctx.stroke(); } ctx.restore(); }
}
function drawSora(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFFFFF', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 7 * s, 0, '#FFFFFF', '#EEF6FF');
  const wf = Math.sin(f * 0.1) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.4 + wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#FFFFFF', '#DDEEFF'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.4 - wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#FFFFFF', '#DDEEFF'); ctx.restore();
  // blue wing feather patterns
  ctx.strokeStyle = '#88AAFF'; ctx.lineWidth = 1 * s; ctx.globalAlpha = 0.6; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x - 5 * s, y + bob + i * 3 * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 9 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x + 5 * s, y + bob + i * 3 * s); ctx.stroke(); }
  ctx.globalAlpha = 1;
  SHADE(ctx, x, y - 8 * s + bob, 5 * s, 4.5 * s, 0, '#FFFFFF', '#EEF6FF');
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s + bob); ctx.lineTo(x - 2 * s, y - 5 * s + bob); ctx.lineTo(x + 2 * s, y - 5 * s + bob); ctx.fill();
  EYE(ctx, x - 2 * s, y - 9 * s + bob, 1.3 * s, '#224466'); EYE(ctx, x + 2 * s, y - 9 * s + bob, 1.3 * s, '#224466');
}
function drawKumo(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  SHADE(ctx, x, y + bob, 10 * s, 7 * s, 0, '#888888', '#AAAAAA');
  SHADE(ctx, x, y - 7 * s + bob, 5 * s, 4.5 * s, 0, '#999999', '#BBBBBB');
  // legs with little feet
  ctx.strokeStyle = '#888888'; ctx.lineWidth = 1.3 * s; ctx.lineCap = 'round';
  [0, 1, 2, 3].forEach(i => { const lx = x - 7 * s + i * 5 * s; ctx.beginPath(); ctx.moveTo(lx, y + 5 * s + bob); ctx.lineTo(lx + Math.sin(f * 0.05 + i) * 2 * s, y + 11 * s + bob); ctx.stroke(); CIR(ctx, lx + Math.sin(f * 0.05 + i) * 2 * s, y + 11 * s + bob, 1.2 * s, '#777777'); });
  EYE(ctx, x - 2 * s, y - 8 * s + bob, 1.4 * s, '#FF4444'); EYE(ctx, x + 2 * s, y - 8 * s + bob, 1.4 * s, '#FF4444');
  // floating web beneath
  ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 0.8 * s;
  const wy = y + 14 * s + bob;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x - 9 * s + i * 4.5 * s, wy + 6 * s); ctx.stroke(); }
  for (let r = 3; r <= 9; r += 3) { ctx.beginPath(); ctx.ellipse(x, wy + 2 * s, r * s, r * 0.4 * s, 0, 0, Math.PI); ctx.stroke(); }
  ctx.restore();
}
function drawKage(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#000000', 0.35);
  ctx.save(); ctx.globalAlpha = 0.75;
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 7 * s, 0, '#222233', '#332244'); SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#222233', '#332244');
  // smoky fading edges
  for (let i = 0; i < 6; i++) { const a = f * 0.03 + i * 1.05; CIR(ctx, x + Math.cos(a) * 13 * s, y + Math.sin(a) * 10 * s + bob, 2.2 * s, '#111122'); }
  ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.6 * s, '#FFAA00'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.6 * s, '#FFAA00');
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#222233', '#111122'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#222233', '#111122');
}
function drawAkuma(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#DD2222', 0.35);
  SHADE(ctx, x, y + 3 * s + bob, 9 * s, 8 * s, 0, '#DD2222', '#FF5555');
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#DD2222', '#FF5555');
  // horns with gradient
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 7 * s, y - 16 * s + bob); ctx.lineTo(x - 3 * s, y - 12 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 11 * s + bob); ctx.lineTo(x + 7 * s, y - 16 * s + bob); ctx.lineTo(x + 3 * s, y - 12 * s + bob); ctx.fill();
  ctx.fillStyle = '#FFDD66'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 11 * s + bob); ctx.lineTo(x - 6 * s, y - 14 * s + bob); ctx.lineTo(x - 4 * s, y - 12 * s + bob); ctx.fill();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.6 * s, '#FFFF44'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.6 * s, '#FFFF44');
  // mischievous mouth with fangs
  ctx.strokeStyle = '#660000'; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.arc(x, y - 4 * s + bob, 2.2 * s, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - 1.5 * s, y - 2.5 * s + bob); ctx.lineTo(x - 0.8 * s, y - 1.5 * s + bob); ctx.lineTo(x - 0.3 * s, y - 2.5 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 1.5 * s, y - 2.5 * s + bob); ctx.lineTo(x + 0.8 * s, y - 1.5 * s + bob); ctx.lineTo(x + 0.3 * s, y - 2.5 * s + bob); ctx.fill();
}
function drawKoi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 3 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFD700', 0.3);
  ctx.save(); ctx.globalAlpha = 0.9;
  SHADE(ctx, x, y + bob, 12 * s, 7 * s, Math.sin(f * 0.04) * 0.2, '#FF3344', '#FF6688');
  // white patch
  ctx.save(); ctx.globalAlpha = 0.85; ELL(ctx, x - 2 * s, y - 2 * s + bob, 4 * s, 4 * s, 0, '#FFFFFF'); ctx.restore();
  // black spots
  CIR(ctx, x - 4 * s, y + bob, 1.4 * s, '#220000'); CIR(ctx, x + 3 * s, y - 1 * s + bob, 1.2 * s, '#220000');
  ctx.restore();
  // golden fins with wave
  ctx.save(); ctx.translate(x - 11 * s, y + bob); ctx.rotate(Math.sin(f * 0.08) * 0.4); SHADE(ctx, 0, 0, 4 * s, 7 * s, 0, '#FFD700', '#FFEEBB'); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.75; ELL(ctx, x, y - 7 * s + bob, 4 * s, 3 * s, 0.3, '#FFD700'); ctx.restore();
  SHADE(ctx, x + 7 * s, y - 1 * s + bob, 5 * s, 4.5 * s, 0, '#FF3344', '#FF6688');
  EYE(ctx, x + 5 * s, y - 2 * s + bob, 1.5 * s, '#000000', '#000000');
  // whiskers
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.7 * s; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(x + 10 * s, y + bob); ctx.quadraticCurveTo(x + 14 * s, y - 2 * s + bob, x + 16 * s, y + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 10 * s, y + 2 * s + bob); ctx.quadraticCurveTo(x + 14 * s, y + 4 * s + bob, x + 16 * s, y + 3 * s + bob); ctx.stroke();
  ctx.globalAlpha = 1;
}
function drawMori(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 14 * s, '#44AA44', 0.25);
  SHADE(ctx, x, y + bob, 10 * s, 9 * s, 0, '#8B5A2B', '#A9703A');
  SHADE(ctx, x, y - 9 * s + bob, 6 * s, 5.5 * s, 0, '#8B5A2B', '#A9703A');
  // wood grain rings
  ctx.strokeStyle = '#6B4520'; ctx.lineWidth = 0.8 * s; ctx.globalAlpha = 0.5;
  for (let r = 3; r <= 8; r += 2.5) RING(ctx, x, y + bob, r * s, '#6B4520', 0.8 * s);
  ctx.globalAlpha = 1;
  // leaves on head
  [0, 1, 2].forEach(i => { ctx.save(); ctx.translate(x - 5 * s + i * 5 * s, y - 14 * s + bob); ctx.rotate(i - 1 + Math.sin(f * 0.04 + i) * 0.15); SHADE(ctx, 0, 0, 3 * s, 2 * s, 0, '#44AA44', '#66BB66'); ctx.restore(); });
  EYE(ctx, x - 3 * s, y - 10 * s + bob, 1.4 * s, '#222200'); EYE(ctx, x + 3 * s, y - 10 * s + bob, 1.4 * s, '#222200');
  // little smile
  ctx.strokeStyle = '#6B4520'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.arc(x, y - 8 * s + bob, 1.5 * s, 0.2, Math.PI - 0.2); ctx.stroke();
}
function drawIshi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.04) * 1.5 * s;
  SHADE(ctx, x, y + 2 * s + bob, 11 * s, 8 * s, 0, '#777766', '#999988');
  // shell hexagon plates
  ctx.strokeStyle = '#555544'; ctx.lineWidth = 0.8 * s; ctx.globalAlpha = 0.5;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const hx = x + i * 4 * s, hy = y + 2 * s + j * 3 * s + bob; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const px = hx + Math.cos(a) * 2 * s, py = hy + Math.sin(a) * 2 * s; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke(); }
  ctx.globalAlpha = 1;
  SHADE(ctx, x, y - 7 * s + bob, 5 * s, 4.5 * s, 0, '#999988', '#BBBBCA');
  // glowing cracks
  ctx.strokeStyle = '#FFCC44'; ctx.lineWidth = 1.3 * s; ctx.globalAlpha = 0.7 + Math.sin(f * 0.1) * 0.25; ctx.shadowColor = '#FFCC44'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.moveTo(x - 8 * s, y + bob); ctx.lineTo(x - 2 * s, y + 4 * s + bob); ctx.lineTo(x + 5 * s, y - 1 * s + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8 * s, y + 3 * s + bob); ctx.lineTo(x + 2 * s, y - 3 * s + bob); ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  EYE(ctx, x - 2 * s, y - 8 * s + bob, 1.4 * s, '#FFCC44'); EYE(ctx, x + 2 * s, y - 8 * s + bob, 1.4 * s, '#FFCC44');
  // legs
  ctx.strokeStyle = '#999988'; ctx.lineWidth = 1.4 * s; ctx.lineCap = 'round';
  [0, 1, 2, 3].forEach(i => { const lx = x - 8 * s + i * 5 * s; ctx.beginPath(); ctx.moveTo(lx, y + 8 * s + bob); ctx.lineTo(lx + Math.sin(f * 0.03 + i) * 1.5 * s, y + 12 * s + bob); ctx.stroke(); });
}
function drawHoshi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#FFDD44', 0.45);
  // 5-point star with gradient
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(f * 0.02);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 12 * s); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#FFDD44'); g.addColorStop(1, '#FFAA22');
  ctx.fillStyle = g; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const r = (i % 2 ? 4 : 11) * s; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const px = Math.cos(a) * r, py = Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fill();
  ctx.restore();
  // orbiting particles with trails
  for (let i = 0; i < 5; i++) { const a = f * 0.06 + i * 1.26; const px = x + Math.cos(a) * 15 * s, py = y + Math.sin(a) * 15 * s + bob; CIR(ctx, px, py, 1.5 * s, '#FFFFFF'); ctx.save(); ctx.globalAlpha = 0.4; CIR(ctx, px, py, 2.5 * s, '#FFDD44'); ctx.restore(); }
  CIR(ctx, x, y + bob, 2 * s, '#FFFFFF');
}
function drawNami(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 3 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#44AAFF', 0.35);
  ctx.save(); ctx.globalAlpha = 0.8;
  // serpent body curve with gradient stroke
  const g = ctx.createLinearGradient(x - 12 * s, y, x + 12 * s, y); g.addColorStop(0, '#44AAFF'); g.addColorStop(0.5, '#88CCFF'); g.addColorStop(1, '#44AAFF');
  ctx.strokeStyle = g; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y + 6 * s + bob);
  ctx.quadraticCurveTo(x - 6 * s, y - 6 * s + bob + Math.sin(f * 0.06) * 3 * s, x, y + 2 * s + bob);
  ctx.quadraticCurveTo(x + 6 * s, y + 10 * s + bob - Math.sin(f * 0.06) * 3 * s, x + 12 * s, y - 2 * s + bob);
  ctx.stroke();
  // fin along the back
  ctx.strokeStyle = '#AAEEFF'; ctx.lineWidth = 2 * s; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 2 * s + bob); ctx.lineTo(x - 4 * s, y - 6 * s + bob); ctx.lineTo(x - 2 * s, y - 2 * s + bob); ctx.stroke();
  ctx.restore();
  SHADE(ctx, x + 12 * s, y - 2 * s + bob, 5 * s, 4.5 * s, 0, '#44AAFF', '#88CCFF');
  EYE(ctx, x + 10 * s, y - 3 * s + bob, 1.4 * s, '#FFFFFF', '#224488');
  // water droplets
  for (let i = 0; i < 3; i++) ORB(ctx, x, y + bob, f, 16 * s, i, 0.08, 1.1 * s, '#AAEEFF', i);
}
function drawKaminari(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFFF66', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#FFCC22', '#FFE066');
  // tail with sway
  ctx.save(); ctx.translate(x - 9 * s, y + 5 * s + bob); ctx.rotate(Math.sin(f * 0.05) * 0.3); SHADE(ctx, 0, 0, 4 * s, 9 * s, 0, '#FFCC22', '#FFE066'); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFCC22', '#FFE066');
  // yellow lightning marking on forehead
  ctx.strokeStyle = '#FFFF66'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round'; ctx.shadowColor = '#FFFF66'; ctx.shadowBlur = 3;
  ctx.beginPath(); ctx.moveTo(x - 2 * s, y - 10 * s + bob); ctx.lineTo(x, y - 7 * s + bob); ctx.lineTo(x - 1.5 * s, y - 5 * s + bob); ctx.lineTo(x + 1 * s, y - 3 * s + bob); ctx.stroke();
  ctx.shadowBlur = 0;
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#FFCC22', '#FFE066'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#FFCC22', '#FFE066');
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#222200'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#222200');
  // sparks at paws
  for (let i = 0; i < 3; i++) { const px = x - 6 * s + i * 6 * s; const py = y + 9 * s + bob + Math.sin(f * 0.2 + i) * 2; ctx.strokeStyle = '#FFFF88'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2 * s, py - 3 * s); ctx.lineTo(px - 1 * s, py - 4 * s); ctx.stroke(); CIR(ctx, px, py, 1.1 * s, '#FFFF88'); }
}
function drawTsubaki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#CC1133', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 7 * s, 0, '#CC1133', '#EE4455');
  const wf = Math.sin(f * 0.1) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.4 + wf); SHADE(ctx, 0, 0, 5 * s, 10 * s, 0, '#CC1133', '#EE4455'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.4 - wf); SHADE(ctx, 0, 0, 5 * s, 10 * s, 0, '#CC1133', '#EE4455'); ctx.restore();
  // feather lines
  ctx.strokeStyle = '#880022'; ctx.lineWidth = 0.7 * s; ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x - 3 * s, y + bob + i * 3 * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 7 * s, y - 4 * s + bob + i * 3 * s); ctx.lineTo(x + 3 * s, y + bob + i * 3 * s); ctx.stroke(); }
  ctx.globalAlpha = 1;
  SHADE(ctx, x, y - 8 * s + bob, 5 * s, 4.5 * s, 0, '#CC1133', '#EE4455');
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s + bob); ctx.lineTo(x - 2 * s, y - 5 * s + bob); ctx.lineTo(x + 2 * s, y - 5 * s + bob); ctx.fill();
  EYE(ctx, x - 2 * s, y - 9 * s + bob, 1.3 * s, '#FFCC44'); EYE(ctx, x + 2 * s, y - 9 * s + bob, 1.3 * s, '#FFCC44');
  // camellia flowers with petals
  [0, 1].forEach(i => { const fx = x - 9 * s + i * 18 * s; const fy = y + 4 * s + bob; for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; ELL(ctx, fx + Math.cos(a) * 2 * s, fy + Math.sin(a) * 2 * s, 1.8 * s, 1.2 * s, a, '#FF6688'); } CIR(ctx, fx, fy, 1.2 * s, '#FFAA00'); });
}
function drawKumoji(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#CCD0FF', 0.35);
  // cloud body (puffs) with soft shading
  const puff = (px, py, r) => { const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.4, r * 0.1, px, py, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#EEF2FF'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); };
  puff(x - 6 * s, y + 2 * s + bob, 7 * s); puff(x + 6 * s, y + 2 * s + bob, 7 * s); puff(x, y - 1 * s + bob, 9 * s);
  // face
  EYE(ctx, x - 3 * s, y - 1 * s + bob, 1.5 * s, '#334466'); EYE(ctx, x + 3 * s, y - 1 * s + bob, 1.5 * s, '#334466');
  ctx.strokeStyle = '#334466'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(x, y + 2 * s + bob, 2 * s, 0, Math.PI); ctx.stroke();
  // trailing wisps
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#CCD0FF';
  for (let i = 0; i < 3; i++) { const wy = y + 8 * s + i * 4 * s + bob; CIR(ctx, x - 4 * s + i * 2 * s + Math.sin(f * 0.05 + i) * 2 * s, wy, 3 * s - i * 0.6 * s, '#CCD0FF'); }
  ctx.restore();
}
function drawHebi(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 16 * s, '#FFD700', 0.3);
  ctx.save(); ctx.globalAlpha = 0.9;
  // coiling body with gradient
  const g = ctx.createLinearGradient(x - 12 * s, y, x + 12 * s, y); g.addColorStop(0, '#FFF8DD'); g.addColorStop(0.5, '#FFFFFF'); g.addColorStop(1, '#FFF8DD');
  ctx.strokeStyle = g; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y + 6 * s + bob);
  ctx.quadraticCurveTo(x - 4 * s, y - 8 * s + bob, x + 4 * s, y + 2 * s + bob + Math.sin(f * 0.04) * 3 * s);
  ctx.quadraticCurveTo(x + 10 * s, y + 8 * s + bob, x + 12 * s, y - 4 * s + bob);
  ctx.stroke();
  // gold stripe overlay
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5 * s; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y + 5 * s + bob); ctx.quadraticCurveTo(x - 3 * s, y - 6 * s + bob, x + 4 * s, y + bob); ctx.stroke();
  ctx.restore();
  SHADE(ctx, x + 12 * s, y - 4 * s + bob, 5 * s, 4.5 * s, 0, '#FFF8DD', '#FFFFFF');
  // forked tongue
  ctx.strokeStyle = '#FF6688'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 4 * s + bob); ctx.lineTo(x + 19 * s, y - 5 * s + bob); ctx.moveTo(x + 16 * s, y - 4 * s + bob); ctx.lineTo(x + 19 * s, y - 3 * s + bob); ctx.stroke();
  EYE(ctx, x + 10 * s, y - 5 * s + bob, 1.4 * s, '#FFD700', '#AA7700');
}
function drawTanuki(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 14 * s, '#66AA44', 0.25);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#885533', '#A9703A');
  // striped tail
  ctx.save(); ctx.translate(x - 10 * s, y + 5 * s + bob); ctx.rotate(Math.sin(f * 0.05) * 0.3); SHADE(ctx, 0, 0, 4 * s, 8 * s, 0, '#885533', '#A9703A'); ctx.fillStyle = '#A07744'; ctx.fillRect(-2 * s, -7 * s, 4 * s, 2 * s); ctx.fillRect(-2 * s, -1 * s, 4 * s, 2 * s); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#885533', '#A9703A');
  // leaf on head
  ctx.save(); ctx.translate(x, y - 14 * s + bob); ctx.rotate(0.3 + Math.sin(f * 0.04) * 0.1); const lg = ctx.createLinearGradient(-3 * s, 0, 3 * s, 0); lg.addColorStop(0, '#88BB66'); lg.addColorStop(1, '#44AA44'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(0, 0, 3 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#885533', '#A9703A'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#885533', '#A9703A');
  // mask-like face marking
  ctx.save(); ctx.globalAlpha = 0.5; ELL(ctx, x, y - 4 * s + bob, 4 * s, 3 * s, 0, '#DDCCAA'); ctx.restore();
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#221100'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#221100');
}
function drawKarasu(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.07) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#6644AA', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 9 * s, 8 * s, 0, '#111118', '#332244');
  const wf = Math.sin(f * 0.12) * 0.4;
  ctx.save(); ctx.translate(x - 7 * s, y + bob); ctx.rotate(-0.4 + wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#111118', '#332244'); ctx.restore();
  ctx.save(); ctx.translate(x + 7 * s, y + bob); ctx.rotate(0.4 - wf); SHADE(ctx, 0, 0, 5 * s, 11 * s, 0, '#111118', '#332244'); ctx.restore();
  // blue-purple feather highlights
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#6644AA';
  ctx.beginPath(); ctx.ellipse(x - 7 * s, y + bob, 3 * s, 8 * s, -0.4 + wf, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7 * s, y + bob, 3 * s, 8 * s, 0.4 - wf, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  SHADE(ctx, x, y - 8 * s + bob, 5 * s, 4.5 * s, 0, '#111118', '#332244');
  ctx.fillStyle = '#FFAA22'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s + bob); ctx.lineTo(x - 2.5 * s, y - 4 * s + bob); ctx.lineTo(x + 2.5 * s, y - 4 * s + bob); ctx.fill();
  EYE(ctx, x - 2 * s, y - 9 * s + bob, 1.4 * s, '#FFCC44'); EYE(ctx, x + 2 * s, y - 9 * s + bob, 1.4 * s, '#FFCC44');
}
function drawRyuu(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#226644', 0.35);
  ctx.save(); ctx.globalAlpha = 0.92;
  // serpent body with scale gradient
  const g = ctx.createLinearGradient(x - 12 * s, y, x + 12 * s, y); g.addColorStop(0, '#226644'); g.addColorStop(0.5, '#339966'); g.addColorStop(1, '#226644');
  ctx.strokeStyle = g; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y + 6 * s + bob);
  ctx.quadraticCurveTo(x - 4 * s, y - 6 * s + bob, x + 2 * s, y + 2 * s + bob + Math.sin(f * 0.05) * 3 * s);
  ctx.quadraticCurveTo(x + 8 * s, y + 8 * s + bob, x + 12 * s, y - 2 * s + bob);
  ctx.stroke();
  // scale highlight ridges
  ctx.strokeStyle = '#88FFAA'; ctx.lineWidth = 1 * s; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y + 5 * s + bob); ctx.quadraticCurveTo(x - 3 * s, y - 5 * s + bob, x + 2 * s, y + bob); ctx.stroke();
  ctx.restore();
  SHADE(ctx, x + 12 * s, y - 2 * s + bob, 6 * s, 5.5 * s, 0, '#226644', '#339966');
  // horns
  ctx.fillStyle = '#88FFAA'; ctx.beginPath(); ctx.moveTo(x + 10 * s, y - 7 * s + bob); ctx.lineTo(x + 8 * s, y - 12 * s + bob); ctx.lineTo(x + 12 * s, y - 8 * s + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 14 * s, y - 7 * s + bob); ctx.lineTo(x + 16 * s, y - 12 * s + bob); ctx.lineTo(x + 13 * s, y - 8 * s + bob); ctx.fill();
  // whiskers
  ctx.strokeStyle = '#88FFAA'; ctx.lineWidth = 0.8 * s; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(x + 16 * s, y + bob); ctx.quadraticCurveTo(x + 20 * s, y - 2 * s + bob, x + 22 * s, y + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 16 * s, y + 2 * s + bob); ctx.quadraticCurveTo(x + 20 * s, y + 4 * s + bob, x + 22 * s, y + 3 * s + bob); ctx.stroke();
  ctx.globalAlpha = 1;
  EYE(ctx, x + 10 * s, y - 3 * s + bob, 1.5 * s, '#FFCC44'); EYE(ctx, x + 14 * s, y - 3 * s + bob, 1.5 * s, '#FFCC44');
  // smoke trail
  ctx.save(); ctx.globalAlpha = 0.3; for (let i = 0; i < 3; i++) CIR(ctx, x - 14 * s - i * 4 * s, y + 8 * s + bob - i * 2 * s, (3 - i * 0.5) * s, '#88FFAA'); ctx.restore();
}
function drawCho(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.08) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#AA55FF', 0.35);
  const wf = Math.sin(f * 0.15) * 0.5;
  // wings with gradient + vein lines
  const wing = (sx) => { ctx.save(); ctx.globalAlpha = 0.75; ctx.translate(x + sx * 6 * s, y + bob); ctx.rotate(-0.3 * sx + wf * sx); const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 9 * s); g.addColorStop(0, '#CC88FF'); g.addColorStop(1, '#8833CC'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 7 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#6622AA'; ctx.lineWidth = 0.6 * s; ctx.globalAlpha = 0.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * 6 * s, (i - 1) * 5 * s); ctx.stroke(); } ctx.restore(); };
  wing(-1); wing(1);
  SHADE(ctx, x, y + bob, 2.5 * s, 7 * s, 0, '#8833CC', '#AA55FF');
  SHADE(ctx, x, y - 6 * s + bob, 2.5 * s, 2.3 * s, 0, '#8833CC', '#AA55FF');
  // antennae with glowing tips
  ctx.strokeStyle = '#8833CC'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(x - 1 * s, y - 8 * s + bob); ctx.lineTo(x - 3 * s, y - 12 * s + bob); ctx.moveTo(x + 1 * s, y - 8 * s + bob); ctx.lineTo(x + 3 * s, y - 12 * s + bob); ctx.stroke();
  CIR(ctx, x - 3 * s, y - 12 * s + bob, 1.2 * s, '#FFCCFF'); CIR(ctx, x + 3 * s, y - 12 * s + bob, 1.2 * s, '#FFCCFF');
  EYE(ctx, x - 1.5 * s, y - 7 * s + bob, 1.1 * s, '#FFFFFF', '#000000'); EYE(ctx, x + 1.5 * s, y - 7 * s + bob, 1.1 * s, '#FFFFFF', '#000000');
}
function drawSakura(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 15 * s, '#FF77BB', 0.3);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#FFAADD', '#FFCCDD');
  ctx.save(); ctx.translate(x - 9 * s, y + 5 * s + bob); ctx.rotate(Math.sin(f * 0.05) * 0.3); SHADE(ctx, 0, 0, 4 * s, 9 * s, 0, '#FFAADD', '#FFCCDD'); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFAADD', '#FFCCDD');
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#FFAADD', '#FFCCDD'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#FFAADD', '#FFCCDD');
  // blossom mark on forehead
  for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5 - Math.PI / 2; ELL(ctx, x + Math.cos(a) * 2 * s, y - 9 * s + bob + Math.sin(a) * 2 * s, 1.2 * s, 0.8 * s, a, '#FFFFFF'); }
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.5 * s, '#AA3366'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.5 * s, '#AA3366');
  // falling petals
  for (let i = 0; i < 6; i++) { const a = f * 0.02 + i * 1.05; const px = x + Math.cos(a) * 15 * s; const py = y + ((f * 0.5 + i * 26) % 26 - 13) * s + bob; ctx.save(); ctx.translate(px, py); ctx.rotate(a + f * 0.05); ELL(ctx, 0, 0, 2 * s, 1.3 * s, 0, '#FFCCEE'); ctx.restore(); }
}
function drawHotaru(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.06) * 2 * s;
  const glow = 0.45 + Math.sin(f * 0.12) * 0.3;
  GLOW(ctx, x, y + bob, 18 * s, '#CCFF44', glow);
  SHADE(ctx, x, y + 2 * s + bob, 4 * s, 8 * s, 0, '#886622', '#AA8844');
  SHADE(ctx, x, y - 7 * s + bob, 3.5 * s, 3.2 * s, 0, '#886622', '#AA8844');
  // glowing abdomen
  const ag = ctx.createRadialGradient(x, y + 6 * s + bob, 1, x, y + 6 * s + bob, 6 * s); ag.addColorStop(0, '#FFFFAA'); ag.addColorStop(0.5, '#CCFF44'); ag.addColorStop(1, 'rgba(136,255,68,0)');
  ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(x, y + 6 * s + bob, 5 * s, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.6; CIR(ctx, x, y + 6 * s + bob, 7 * s, '#FFFFAA'); ctx.restore();
  EYE(ctx, x - 2 * s, y - 8 * s + bob, 1.2 * s, '#222200'); EYE(ctx, x + 2 * s, y - 8 * s + bob, 1.2 * s, '#222200');
  // wings (delicate)
  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.6 * s;
  ctx.beginPath(); ctx.ellipse(x - 4 * s, y + bob, 4 * s, 2 * s, -0.3, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 4 * s, y + bob, 4 * s, 2 * s, 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  // light particles
  for (let i = 0; i < 5; i++) { const a = f * 0.05 + i * 1.26; const px = x + Math.cos(a) * 13 * s, py = y + Math.sin(a) * 10 * s + bob; ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(f * 0.1 + i) * 0.4; CIR(ctx, px, py, 1.2 * s, '#FFFFAA'); ctx.restore(); }
}
function drawShiro(ctx, x, y, f, s = 1) {
  const bob = Math.sin(f * 0.05) * 2 * s;
  GLOW(ctx, x, y + bob, 17 * s, '#AABBFF', 0.35);
  SHADE(ctx, x, y + 2 * s + bob, 10 * s, 8 * s, 0, '#FFFFFF', '#EEF2FF');
  ctx.save(); ctx.globalAlpha = 0.6; SHADE(ctx, x - 9 * s, y + 5 * s + bob, 4 * s, 9 * s, 0.3, '#FFFFFF', '#EEF2FF'); ctx.restore();
  SHADE(ctx, x, y - 7 * s + bob, 6 * s, 5.5 * s, 0, '#FFFFFF', '#EEF2FF');
  EAR(ctx, x - 6 * s, y - 12 * s + bob, s, '#FFFFFF', '#DDEEFF'); EAR(ctx, x + 6 * s, y - 12 * s + bob, s, '#FFFFFF', '#DDEEFF');
  EYE(ctx, x - 3 * s, y - 8 * s + bob, 1.6 * s, '#AABBFF'); EYE(ctx, x + 3 * s, y - 8 * s + bob, 1.6 * s, '#AABBFF');
  // nose
  ctx.fillStyle = '#8899CC'; ctx.beginPath(); ctx.ellipse(x, y - 5 * s + bob, 1.2 * s, 0.8 * s, 0, 0, Math.PI * 2); ctx.fill();
  // silver aura sparkles
  for (let i = 0; i < 4; i++) { const a = f * 0.04 + i * 1.6; const px = x + Math.cos(a) * 15 * s, py = y + Math.sin(a) * 11 * s + bob; ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(f * 0.08 + i) * 0.4; CIR(ctx, px, py, 1.1 * s, '#CCDDEE'); ctx.restore(); }
}

// ── Follower: smooth follow + idle bob. Purely visual, no gameplay state. ──
// Caches the smoothed position on fighter._shikigamiState so it persists
// across frames. Draws the shikigami behind & slightly above the fighter.
export function drawShikigamiFollower(ctx, fighter, shikigamiId, frame, scale = 1) {
  const def = shikigamiId ? getShikigami(shikigamiId) : null;
  if (!def || !fighter) return;
  if (!fighter._shikigamiState) fighter._shikigamiState = { x: fighter.x, y: fighter.y - 78 };
  const st = fighter._shikigamiState;
  // Target: behind (opposite of facing) and above the head
  const tx = fighter.x - (fighter.facing || 1) * 44;
  const ty = fighter.y - 80;
  st.x += (tx - st.x) * 0.12;
  st.y += (ty - st.y) * 0.12;
  def.draw(ctx, st.x, st.y, frame, scale);
}

// Resolve the equipped shikigami id for a fighter's character, allowing a
// per-match override map to take precedence over the permanent loadout.
export function resolveShikigami(charId, equippedShikigami = {}, matchOverride = {}) {
  if (matchOverride && matchOverride[charId]) return matchOverride[charId];
  return equippedShikigami?.[charId] || null;
}