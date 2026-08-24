// Shared material definitions and rendering — used by both StageEditor and PlatformFighter
// to ensure materials look and act identically in the editor and in real battles.
//
// Visual design: polished, stylized 2D platform-fighter look. Each material has a
// unique, recognizable visual identity. Non-solid materials (water, lava, cloud,
// acid, tar, quicksand, antigravity) visually communicate their non-solid nature.
// No breakable physics, no collision changes — visuals only.

export const MATERIALS = [
  { id: 'normal', name: 'Normal', color: '#445588' },
  { id: 'ice', name: 'Ice', color: '#88DDFF' },
  { id: 'lava', name: 'Lava', color: '#FF5522' },
  { id: 'quicksand', name: 'Quicksand', color: '#CCA866' },
  { id: 'water', name: 'Water', color: '#4488CC' },
  { id: 'bounce', name: 'Bounce', color: '#FF44AA' },
  { id: 'cloud', name: 'Cloud', color: '#EEEEFF' },
  { id: 'spike', name: 'Spike', color: '#AA3344' },
  { id: 'conveyor', name: 'Conveyor', color: '#FFAA22' },
  { id: 'acid', name: 'Acid', color: '#88FF44' },
  { id: 'metal', name: 'Metal', color: '#AAAAAA' },
  { id: 'glass', name: 'Glass', color: '#AAEEFF' },
  { id: 'wood', name: 'Wood', color: '#885533' },
  { id: 'grass', name: 'Grass', color: '#44AA55' },
  { id: 'rubber', name: 'Rubber', color: '#FF66AA' },
  { id: 'crystal', name: 'Crystal', color: '#CC44FF' },
  { id: 'sand', name: 'Sand', color: '#DDCC88' },
  { id: 'snow', name: 'Snow', color: '#FFFFFF' },
  { id: 'tar', name: 'Tar', color: '#221111' },
  { id: 'neon', name: 'Neon', color: '#00FFAA' },
  { id: 'gold', name: 'Gold', color: '#FFDD00' },
  { id: 'diamond', name: 'Diamond', color: '#B0E0FF' },
  { id: 'plasma', name: 'Plasma', color: '#FF00FF' },
  { id: 'solar', name: 'Solar', color: '#FFAA00' },
  { id: 'azure', name: 'Azure', color: '#0088FF' },
  { id: 'rose', name: 'Rose', color: '#FF44AA' },
  { id: 'lime', name: 'Lime', color: '#88FF00' },
  { id: 'antigravity', name: 'Anti-Grav', color: '#CC66FF' },
];

// Materials that are NOT solid — fighters and objects pass through them
export const NON_SOLID_MATERIALS = ['water', 'lava', 'cloud', 'acid', 'tar', 'quicksand', 'antigravity'];

export function getMaterial(id) {
  return MATERIALS.find(m => m.id === (id || 'normal')) || MATERIALS[0];
}

// ── Helper: rounded rect ──
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ── Helper: wave line along the top of a platform ──
function drawWaveTop(ctx, p, frame, freq, amp, color, lw = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let wx = 0; wx <= p.w; wx += 3) {
    const wy = p.y + Math.sin((wx + frame * freq) * 0.05) * amp;
    if (wx === 0) ctx.moveTo(p.x + wx, wy);
    else ctx.lineTo(p.x + wx, wy);
  }
  ctx.stroke();
}

// Draws material-specific overlays on top of an already-rendered platform.
// Call after drawPlatforms (in battle) or after the base gradient fill (in editor).
export function drawMaterialOverlay(ctx, p, frame = 0) {
  const mat = getMaterial(p.material);
  if (mat.id === 'normal') return;

  const { x, y, w, h } = p;
  ctx.save();

  // ── Each material gets a unique, detailed visual treatment ──

  if (mat.id === 'ice') {
    // Translucent blue ice with frosty edges and internal reflections
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(180,230,255,0.55)');
    g.addColorStop(0.5, 'rgba(120,200,255,0.35)');
    g.addColorStop(1, 'rgba(80,160,220,0.45)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Frosty top edge
    ctx.fillStyle = 'rgba(220,245,255,0.6)';
    ctx.fillRect(x, y, w, 3);
    // Internal reflection lines
    ctx.strokeStyle = 'rgba(200,240,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.25 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x + 8, ly);
      ctx.lineTo(x + w - 8, ly - 2);
      ctx.stroke();
    }
    // Sparkle particles
    for (let i = 0; i < 4; i++) {
      const sx = x + ((i * 37 + frame * 0.3) % w);
      const sy = y + 4 + (i % 2) * 4;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(frame * 0.08 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Crisp outline
    ctx.strokeStyle = 'rgba(200,240,255,0.5)';
    ctx.lineWidth = 1;
    rr(ctx, x, y, w, h, 4); ctx.stroke();
  }

  else if (mat.id === 'lava') {
    // Molten lava — matches the Rock Climbing lava style: glowing gradient,
    // flowing surface waves, rising bubbles, embers, and heat haze. NON-SOLID.
    const glow = 0.4 + Math.sin(frame * 0.08 + x * 0.01) * 0.2;
    // Molten body gradient — yellow → orange → red → dark red (like rock climbing)
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(255,221,68,${0.85 + glow * 0.1})`);
    g.addColorStop(0.2, `rgba(255,170,34,${0.85})`);
    g.addColorStop(0.5, `rgba(255,85,17,${0.85})`);
    g.addColorStop(1, `rgba(170,17,0,${0.9})`);
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Flowing surface waves — bright glowing top edge
    ctx.strokeStyle = `rgba(255,220,110,${0.7 + 0.2 * Math.sin(frame * 0.1)})`;
    ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let wx = 0; wx <= w; wx += 4) {
      const wave = Math.sin((x + wx) * 0.04 + frame * 0.08) * 3 + Math.sin((x + wx) * 0.09 + frame * 0.13) * 2;
      if (wx === 0) ctx.moveTo(x + wx, y + wave); else ctx.lineTo(x + wx, y + wave);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,200,${0.5 + 0.2 * Math.sin(frame * 0.15)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let wx = 0; wx <= w; wx += 4) {
      const wave = Math.sin((x + wx) * 0.04 + frame * 0.08) * 3 + Math.sin((x + wx) * 0.09 + frame * 0.13) * 2;
      if (wx === 0) ctx.moveTo(x + wx, y + wave); else ctx.lineTo(x + wx, y + wave);
    }
    ctx.stroke();
    // Rising bubbles inside the lava
    for (let i = 0; i < 6; i++) {
      const bx = x + ((i * 79 + frame * 0.6) % w);
      const by = y + h - ((frame * 0.3 + i * 14) % h);
      const br = 1.5 + (i % 3) * 0.8;
      ctx.fillStyle = `rgba(255,220,120,${0.7 + glow * 0.2})`;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,210,0.6)`;
      ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    // Rising ember particles above the surface
    for (let i = 0; i < 4; i++) {
      const ex = x + ((i * 53 + frame * 0.5) % w);
      const rise = (frame * 0.9 + i * 27) % 40;
      const ey = y - rise;
      ctx.fillStyle = `rgba(255,170,50,${0.7 * (1 - rise / 40)})`;
      ctx.beginPath(); ctx.arc(ex, ey, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
    // Heat haze above the surface
    const hg = ctx.createLinearGradient(x, y - 12, x, y);
    hg.addColorStop(0, 'rgba(255,100,30,0)');
    hg.addColorStop(1, `rgba(255,120,40,${0.18 + 0.06 * Math.sin(frame * 0.07)})`);
    ctx.fillStyle = hg; ctx.fillRect(x, y - 12, w, 12);
  }

  else if (mat.id === 'quicksand') {
    // Sandy surface with flowing grain movement — NON-SOLID visual
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(200,170,100,0.5)');
    g.addColorStop(1, 'rgba(160,130,70,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Flowing grain patterns
    ctx.strokeStyle = 'rgba(220,190,130,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const ly = y + h * (0.15 + i * 0.18);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 4) {
        const off = Math.sin((wx + frame * 1.5 + i * 30) * 0.04) * 2;
        if (wx === 0) ctx.moveTo(x + wx, ly + off);
        else ctx.lineTo(x + wx, ly + off);
      }
      ctx.stroke();
    }
    // Swirling depression in center
    const cx = x + w / 2, cy = y + h / 2;
    const swirl = frame * 0.04;
    ctx.strokeStyle = 'rgba(180,150,90,0.5)';
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.15) {
        const rad = (8 + r * 6) + Math.sin(a * 3 + swirl) * 2;
        const px = cx + Math.cos(a + swirl) * rad;
        const py = cy + Math.sin(a + swirl) * rad * 0.4;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  else if (mat.id === 'water') {
    // Fluid translucent surface — NON-SOLID visual
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(80,160,240,0.35)');
    g.addColorStop(0.5, 'rgba(50,120,200,0.25)');
    g.addColorStop(1, 'rgba(30,80,160,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Animated water surface waves
    drawWaveTop(ctx, p, frame, 2, 3, 'rgba(150,220,255,0.7)', 2);
    drawWaveTop(ctx, p, frame + 10, 1.5, 2, 'rgba(100,180,240,0.4)', 1);
    // Subtle depth ripples
    ctx.strokeStyle = 'rgba(120,190,250,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ry = y + h * (0.3 + i * 0.25);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 6) {
        const off = Math.sin((wx + frame * 1.2 + i * 40) * 0.03) * 1.5;
        if (wx === 0) ctx.moveTo(x + wx, ry + off);
        else ctx.lineTo(x + wx, ry + off);
      }
      ctx.stroke();
    }
    // Bubble particles
    for (let i = 0; i < 4; i++) {
      const bx = x + ((i * 47 + frame * 0.2) % w);
      const by = y + h - ((frame * 0.3 + i * 15) % h);
      ctx.fillStyle = `rgba(200,230,255,${0.3 * (1 - (h - (by - y)) / h)})`;
      ctx.beginPath();
      ctx.arc(bx, by, 1.5 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (mat.id === 'bounce') {
    // Energetic springy surface with glowing bounce indicators
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,100,200,0.5)');
    g.addColorStop(1, 'rgba(200,60,160,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Spring coils pattern
    ctx.strokeStyle = 'rgba(255,150,220,0.6)';
    ctx.lineWidth = 2;
    const bounce = Math.sin(frame * 0.1) * 1.5;
    for (let sx = x + 10; sx < x + w - 10; sx += 20) {
      ctx.beginPath();
      for (let cy = y + 4; cy < y + h - 2; cy += 4) {
        const coilX = sx + Math.sin((cy + frame * 2) * 0.3) * 3 + bounce;
        if (cy === y + 4) ctx.moveTo(coilX, cy);
        else ctx.lineTo(coilX, cy);
      }
      ctx.stroke();
    }
    // Glowing top edge
    const glow = 0.5 + Math.sin(frame * 0.1) * 0.2;
    ctx.fillStyle = `rgba(255,200,240,${glow})`;
    ctx.shadowColor = '#FF44AA';
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y - 1, w, 3);
    ctx.shadowBlur = 0;
    // Up-arrow indicators
    ctx.fillStyle = `rgba(255,255,255,${0.4 + glow * 0.3})`;
    ctx.font = 'bold 10px Orbitron';
    ctx.textAlign = 'center';
    for (let ax = x + 20; ax < x + w; ax += 40) {
      ctx.fillText('▲', ax, y + h - 4);
    }
  }

  else if (mat.id === 'cloud') {
    // Soft layered cloud platform — NON-SOLID visual
    ctx.globalAlpha = 0.75;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.5, 'rgba(220,230,245,0.5)');
    g.addColorStop(1, 'rgba(200,215,235,0.3)');
    ctx.fillStyle = g;
    // Soft cloud-like top edge (bumpy)
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + 6);
    for (let bx = 0; bx <= w; bx += 18) {
      const bump = 6 + Math.sin((bx + frame * 0.5) * 0.05) * 3;
      ctx.quadraticCurveTo(x + bx + 9, y - bump, x + bx + 18, y + 6);
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    // Soft inner highlights
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 4, y + 8, w - 8, 4);
    // Wispy edges
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const wy = y + h * (0.4 + i * 0.2);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 8) {
        const off = Math.sin((wx + frame * 0.8 + i * 20) * 0.03) * 2;
        if (wx === 0) ctx.moveTo(x + wx, wy + off);
        else ctx.lineTo(x + wx, wy + off);
      }
      ctx.stroke();
    }
  }

  else if (mat.id === 'spike') {
    // Dangerous metallic/crystalline spikes with warning highlights
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(180,50,60,0.5)');
    g.addColorStop(1, 'rgba(120,30,40,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Metallic spikes
    const spikeColor = '#CC4455';
    const highlight = '#FF6677';
    for (let sx = x; sx < x + w; sx += 14) {
      const sh = 10 + Math.sin(sx * 0.1) * 2;
      // Spike body
      ctx.fillStyle = spikeColor;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + 7, y - sh);
      ctx.lineTo(sx + 14, y);
      ctx.fill();
      // Highlight edge
      ctx.strokeStyle = highlight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 2, y - 1);
      ctx.lineTo(sx + 7, y - sh + 1);
      ctx.stroke();
    }
    // Warning glow
    const warn = 0.3 + Math.sin(frame * 0.15) * 0.15;
    ctx.fillStyle = `rgba(255,80,80,${warn})`;
    ctx.fillRect(x, y - 2, w, 2);
    ctx.shadowColor = '#FF4444';
    ctx.shadowBlur = 6;
    ctx.fillRect(x, y - 2, w, 1);
    ctx.shadowBlur = 0;
  }

  else if (mat.id === 'conveyor') {
    // Mechanical platform with visible moving belt sections
    const dir = p.conveyorDir || 1;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(80,60,30,0.6)');
    g.addColorStop(1, 'rgba(50,40,20,0.7)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Belt segments
    const off = dir > 0 ? (frame * 2) % 24 : (24 - (frame * 2) % 24);
    ctx.fillStyle = 'rgba(255,180,40,0.5)';
    for (let sx = x - 24 + off; sx < x + w; sx += 24) {
      ctx.fillRect(sx, y + 3, 12, 4);
    }
    // Belt rollers at edges
    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (const rx of [x + 6, x + w - 6]) {
      ctx.beginPath();
      ctx.arc(rx, y + 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Direction arrows
    ctx.fillStyle = 'rgba(255,255,200,0.6)';
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    for (let ax = x + 30; ax < x + w - 20; ax += 50) {
      ctx.fillText(dir > 0 ? '▶' : '◀', ax, y + h - 3);
    }
    // Metal seam lines
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + h - 6);
    ctx.lineTo(x + w, y + h - 6);
    ctx.stroke();
  }

  else if (mat.id === 'acid') {
    // Glowing corrosive liquid with bubbles/fumes — NON-SOLID visual
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(120,255,60,0.4)');
    g.addColorStop(0.5, 'rgba(80,220,40,0.3)');
    g.addColorStop(1, 'rgba(50,160,20,0.5)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Corrosive surface waves
    drawWaveTop(ctx, p, frame, 2, 3, 'rgba(180,255,100,0.7)', 2);
    // Bubble particles
    for (let i = 0; i < 5; i++) {
      const bx = x + ((i * 41 + frame * 0.3) % w);
      const by = y + h - ((frame * 0.4 + i * 12) % h);
      const r = 2 + (i % 2);
      ctx.fillStyle = `rgba(200,255,120,${0.4 * (1 - (h - (by - y)) / h)})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Toxic fume haze
    ctx.fillStyle = 'rgba(100,255,40,0.08)';
    for (let i = 0; i < 3; i++) {
      const fx = x + ((i * 80 + frame * 0.15) % w);
      ctx.beginPath();
      ctx.ellipse(fx, y - 8 - Math.sin(frame * 0.05 + i) * 4, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glow
    ctx.shadowColor = '#88FF44';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(136,255,68,0.4)';
    ctx.lineWidth = 1;
    rr(ctx, x, y, w, h, 4); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  else if (mat.id === 'metal') {
    // Dark futuristic metal with panels, seams, and subtle reflections
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(160,170,180,0.5)');
    g.addColorStop(0.5, 'rgba(100,110,120,0.4)');
    g.addColorStop(1, 'rgba(70,80,90,0.5)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Panel divisions
    ctx.strokeStyle = 'rgba(80,90,100,0.5)';
    ctx.lineWidth = 1;
    const panelW = 40;
    for (let px = x + panelW; px < x + w; px += panelW) {
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
      ctx.stroke();
    }
    // Rivets at panel corners
    ctx.fillStyle = 'rgba(180,190,200,0.5)';
    for (let px = x + 8; px < x + w; px += panelW) {
      ctx.beginPath();
      ctx.arc(px, y + 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, y + h - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Top highlight strip
    ctx.fillStyle = 'rgba(200,210,220,0.4)';
    ctx.fillRect(x, y, w, 2);
    // Subtle moving reflection
    const refX = x + ((frame * 0.5) % (w + 40)) - 20;
    const refGrad = ctx.createLinearGradient(refX - 10, y, refX + 10, y);
    refGrad.addColorStop(0, 'transparent');
    refGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    refGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = refGrad;
    ctx.fillRect(refX - 10, y, 20, h);
  }

  else if (mat.id === 'glass') {
    // Translucent glass with edges, reflections, and highlights
    ctx.globalAlpha = 0.45;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(170,230,255,0.5)');
    g.addColorStop(0.5, 'rgba(120,200,240,0.3)');
    g.addColorStop(1, 'rgba(90,170,220,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    ctx.globalAlpha = 1;
    // Edge highlights
    ctx.strokeStyle = 'rgba(200,240,255,0.6)';
    ctx.lineWidth = 1.5;
    rr(ctx, x, y, w, h, 4); ctx.stroke();
    // Diagonal reflection streak
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.save();
    ctx.beginPath();
    rr(ctx, x, y, w, h, 4);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y);
    ctx.lineTo(x + w * 0.4, y);
    ctx.lineTo(x + w * 0.1, y + h);
    ctx.lineTo(x - w * 0.1, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Corner highlights
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 3, y + 3, 8, 2);
    // Decorative crack lines (purely visual, not breakable)
    ctx.strokeStyle = 'rgba(200,230,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y);
    ctx.lineTo(x + w * 0.35, y + h * 0.4);
    ctx.lineTo(x + w * 0.28, y + h * 0.6);
    ctx.stroke();
  }

  else if (mat.id === 'wood') {
    // Stylized wooden boards with grain and connected planks
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(140,100,60,0.5)');
    g.addColorStop(1, 'rgba(100,70,40,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Plank divisions
    ctx.strokeStyle = 'rgba(60,40,20,0.5)';
    ctx.lineWidth = 1;
    const plankW = 45;
    for (let px = x + plankW; px < x + w; px += plankW) {
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
      ctx.stroke();
    }
    // Wood grain lines
    ctx.strokeStyle = 'rgba(160,120,70,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const gy = y + h * (0.2 + i * 0.3);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 6) {
        const off = Math.sin(wx * 0.05 + i * 2) * 1;
        if (wx === 0) ctx.moveTo(x + wx, gy + off);
        else ctx.lineTo(x + wx, gy + off);
      }
      ctx.stroke();
    }
    // Nail dots at plank intersections
    ctx.fillStyle = 'rgba(80,60,30,0.6)';
    for (let px = x + 8; px < x + w; px += plankW) {
      ctx.beginPath();
      ctx.arc(px, y + 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Top edge highlight
    ctx.fillStyle = 'rgba(180,140,80,0.3)';
    ctx.fillRect(x, y, w, 2);
  }

  else if (mat.id === 'grass') {
    // Grassy surface with soil underneath and vegetation details
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(70,180,80,0.5)');
    g.addColorStop(0.3, 'rgba(50,140,55,0.5)');
    g.addColorStop(0.3, 'rgba(100,70,40,0.5)');
    g.addColorStop(1, 'rgba(70,50,30,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Grass blades on top
    ctx.strokeStyle = 'rgba(90,200,90,0.6)';
    ctx.lineWidth = 1.5;
    for (let gx = x + 3; gx < x + w; gx += 6) {
      const sway = Math.sin((gx + frame * 0.5) * 0.05) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + sway, y - 5);
      ctx.stroke();
    }
    // Soil texture dots
    ctx.fillStyle = 'rgba(60,40,20,0.4)';
    for (let i = 0; i < 8; i++) {
      const dx = x + ((i * 37) % w);
      const dy = y + h * 0.5 + (i % 3) * 4;
      ctx.beginPath();
      ctx.arc(dx, dy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Top edge highlight
    ctx.fillStyle = 'rgba(120,220,100,0.3)';
    ctx.fillRect(x, y, w, 2);
  }

  else if (mat.id === 'rubber') {
    // Thick dark rubber with subtle shine and compression effects
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(200,80,140,0.5)');
    g.addColorStop(1, 'rgba(140,50,100,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Rubber texture bumps
    ctx.fillStyle = 'rgba(255,150,200,0.2)';
    for (let bx = x + 6; bx < x + w; bx += 12) {
      ctx.beginPath();
      ctx.arc(bx, y + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Shine highlight
    const shine = 0.2 + Math.sin(frame * 0.05) * 0.05;
    ctx.fillStyle = `rgba(255,200,230,${shine})`;
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
    // Compression lines (decorative)
    ctx.strokeStyle = 'rgba(180,60,120,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.3 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x + 4, ly);
      ctx.lineTo(x + w - 4, ly);
      ctx.stroke();
    }
  }

  else if (mat.id === 'crystal') {
    // Glowing faceted crystal material
    const pulse = 0.3 + Math.sin(frame * 0.08 + x * 0.01) * 0.15;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(180,80,255,${0.4 + pulse * 0.2})`);
    g.addColorStop(0.5, 'rgba(140,50,220,0.3)');
    g.addColorStop(1, 'rgba(100,30,180,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Facet lines
    ctx.strokeStyle = 'rgba(220,180,255,0.5)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#CC44FF';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 4; i++) {
      const fx = x + (i + 0.5) * (w / 4);
      ctx.beginPath();
      ctx.moveTo(fx, y);
      ctx.lineTo(fx - 8, y + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx, y);
      ctx.lineTo(fx + 8, y + h);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Glow edge
    ctx.fillStyle = `rgba(200,150,255,${pulse * 0.5})`;
    ctx.fillRect(x, y, w, 2);
    // Sparkle
    for (let i = 0; i < 3; i++) {
      const sx = x + ((i * 43 + frame * 0.2) % w);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(frame * 0.1 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, y + 4 + (i % 2) * 4, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (mat.id === 'sand') {
    // Layered sandy surface with subtle grain
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(220,200,140,0.5)');
    g.addColorStop(1, 'rgba(180,160,100,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Sand layers
    ctx.strokeStyle = 'rgba(200,180,120,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ly = y + h * (0.15 + i * 0.22);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 5) {
        const off = Math.sin(wx * 0.03 + i * 3) * 1;
        if (wx === 0) ctx.moveTo(x + wx, ly + off);
        else ctx.lineTo(x + wx, ly + off);
      }
      ctx.stroke();
    }
    // Grain dots
    ctx.fillStyle = 'rgba(160,140,90,0.4)';
    for (let i = 0; i < 12; i++) {
      const dx = x + ((i * 31) % w);
      const dy = y + 4 + ((i * 17) % (h - 8));
      ctx.beginPath();
      ctx.arc(dx, dy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (mat.id === 'snow') {
    // Soft snow with icy/frosted edges
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(220,235,250,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Frosted top edge
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x, y, w, 3);
    // Snow sparkle
    for (let i = 0; i < 5; i++) {
      const sx = x + ((i * 41 + frame * 0.15) % w);
      const sy = y + 4 + (i % 3) * 3;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(frame * 0.06 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Icy blue undertone
    ctx.fillStyle = 'rgba(200,220,250,0.15)';
    ctx.fillRect(x, y + h - 4, w, 4);
  }

  else if (mat.id === 'tar') {
    // Thick black glossy tar with subtle movement and reflections — NON-SOLID visual
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(30,20,25,0.7)');
    g.addColorStop(1, 'rgba(15,10,15,0.8)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Sticky surface waves
    drawWaveTop(ctx, p, frame, 1, 2, 'rgba(60,40,45,0.6)', 2);
    // Bubble formations
    for (let i = 0; i < 4; i++) {
      const bx = x + ((i * 53 + frame * 0.1) % w);
      const by = y + h - ((frame * 0.15 + i * 18) % h);
      const r = 2 + Math.sin(frame * 0.05 + i) * 1;
      ctx.fillStyle = `rgba(50,35,40,${0.4 * (1 - (h - (by - y)) / h)})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glossy highlight reflection
    ctx.fillStyle = 'rgba(80,60,65,0.15)';
    ctx.fillRect(x + 4, y + 2, w - 8, 2);
    // Sticky drip effect at edges
    ctx.fillStyle = 'rgba(25,15,20,0.5)';
    for (let dx = x + 10; dx < x + w; dx += 30) {
      const drip = Math.sin(frame * 0.03 + dx * 0.1) * 2;
      ctx.beginPath();
      ctx.arc(dx, y + h + 2 + drip, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (mat.id === 'neon') {
    // Futuristic glowing material with animated energy lines
    const pulse = 0.4 + Math.sin(frame * 0.1 + x * 0.02) * 0.2;
    ctx.fillStyle = `rgba(0,255,170,${0.25 + pulse * 0.15})`;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Animated energy lines
    ctx.strokeStyle = `rgba(0,255,170,${0.6 + pulse * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00FFAA';
    ctx.shadowBlur = 10;
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.2 + i * 0.3);
      const off = (frame * 2 + i * 60) % (w + 40) - 20;
      ctx.beginPath();
      ctx.moveTo(x + off, ly);
      ctx.lineTo(x + off + 30, ly);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Grid pattern
    ctx.strokeStyle = 'rgba(0,255,170,0.15)';
    ctx.lineWidth = 0.5;
    for (let gx = x; gx < x + w; gx += 12) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    // Bright edge
    ctx.fillStyle = `rgba(180,255,220,${pulse * 0.6})`;
    ctx.fillRect(x, y, w, 2);
  }

  else if (mat.id === 'gold') {
    // Polished stylized gold with bright highlights
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,230,80,0.5)');
    g.addColorStop(0.5, 'rgba(220,180,30,0.5)');
    g.addColorStop(1, 'rgba(180,140,20,0.6)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Bright highlight
    ctx.fillStyle = 'rgba(255,250,200,0.5)';
    ctx.fillRect(x, y, w, 3);
    // Engraved pattern
    ctx.strokeStyle = 'rgba(255,240,150,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.25 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x + 6, ly);
      ctx.lineTo(x + w - 6, ly);
      ctx.stroke();
    }
    // Shine spots
    const shine = 0.3 + Math.sin(frame * 0.05) * 0.1;
    ctx.fillStyle = `rgba(255,255,220,${shine})`;
    ctx.fillRect(x + w * 0.3, y + 2, w * 0.15, 2);
    // Edge glow
    ctx.shadowColor = '#FFDD00';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = 'rgba(255,221,0,0.4)';
    ctx.lineWidth = 1;
    rr(ctx, x, y, w, h, 4); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  else if (mat.id === 'diamond') {
    // Faceted translucent gemstone material
    ctx.globalAlpha = 0.55;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(200,240,255,0.5)');
    g.addColorStop(0.5, 'rgba(150,210,250,0.3)');
    g.addColorStop(1, 'rgba(100,170,230,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    ctx.globalAlpha = 1;
    // Facet lines — diamond pattern
    ctx.strokeStyle = 'rgba(220,240,255,0.5)';
    ctx.lineWidth = 1;
    ctx.save();
    ctx.beginPath();
    rr(ctx, x, y, w, h, 4);
    ctx.clip();
    const cx = x + w / 2, cy = y + h / 2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(cx, y);
    ctx.lineTo(x + w, cy);
    ctx.lineTo(cx, y + h);
    ctx.closePath();
    ctx.stroke();
    // Internal facets
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y + h);
    ctx.moveTo(x, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();
    ctx.restore();
    // Sparkle
    const sparkle = 0.4 + Math.sin(frame * 0.08) * 0.2;
    ctx.fillStyle = `rgba(255,255,255,${sparkle})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    // Edge highlight
    ctx.strokeStyle = 'rgba(220,240,255,0.6)';
    ctx.lineWidth = 1;
    rr(ctx, x, y, w, h, 4); ctx.stroke();
  }

  else if (mat.id === 'plasma') {
    // Unstable glowing energy surface
    const pulse = 0.3 + Math.sin(frame * 0.12 + x * 0.02) * 0.2;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(255,80,255,${0.4 + pulse * 0.2})`);
    g.addColorStop(0.5, 'rgba(200,40,200,0.3)');
    g.addColorStop(1, 'rgba(150,20,180,0.4)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Energy arcs
    ctx.strokeStyle = `rgba(255,150,255,${0.5 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const ay = y + h * (0.2 + i * 0.3);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 4) {
        const off = Math.sin((wx + frame * 3 + i * 40) * 0.05) * 3;
        if (wx === 0) ctx.moveTo(x + wx, ay + off);
        else ctx.lineTo(x + wx, ay + off);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Crackling particles
    for (let i = 0; i < 4; i++) {
      const px = x + ((i * 47 + frame * 0.4) % w);
      const py = y + 4 + (i % 2) * 4;
      ctx.fillStyle = `rgba(255,200,255,${0.5 + Math.sin(frame * 0.2 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (mat.id === 'solar') {
    // Extremely bright golden/orange energy with controlled glow
    const glow = 0.4 + Math.sin(frame * 0.08 + x * 0.01) * 0.2;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(255,220,100,${0.4 + glow * 0.2})`);
    g.addColorStop(0.5, 'rgba(255,170,30,0.4)');
    g.addColorStop(1, 'rgba(220,120,10,0.5)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Radiating energy lines
    ctx.strokeStyle = `rgba(255,240,150,${0.4 + glow * 0.2})`;
    ctx.lineWidth = 1;
    ctx.shadowColor = '#FFAA00';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 4; i++) {
      const ly = y + h * (0.15 + i * 0.25);
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 5) {
        const off = Math.sin((wx + frame * 2 + i * 30) * 0.04) * 2;
        if (wx === 0) ctx.moveTo(x + wx, ly + off);
        else ctx.lineTo(x + wx, ly + off);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Bright top edge
    ctx.fillStyle = `rgba(255,255,200,${glow * 0.6})`;
    ctx.fillRect(x, y, w, 3);
    // Solar flare particles
    for (let i = 0; i < 3; i++) {
      const fx = x + ((i * 57 + frame * 0.3) % w);
      ctx.fillStyle = `rgba(255,240,150,${0.4 + Math.sin(frame * 0.1 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(fx, y + 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (mat.id === 'azure') {
    // Deep blue magical/energy material
    const pulse = 0.3 + Math.sin(frame * 0.06 + x * 0.01) * 0.15;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(50,150,255,${0.4 + pulse * 0.2})`);
    g.addColorStop(0.5, 'rgba(20,100,220,0.3)');
    g.addColorStop(1, 'rgba(10,60,180,0.5)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Magical runes
    ctx.strokeStyle = `rgba(100,180,255,${0.3 + pulse * 0.2})`;
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0088FF';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 3; i++) {
      const rx = x + (i + 0.5) * (w / 3);
      const ry = y + h / 2;
      const r = 6;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - r, ry);
      ctx.lineTo(rx + r, ry);
      ctx.moveTo(rx, ry - r);
      ctx.lineTo(rx, ry + r);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Energy flow
    ctx.strokeStyle = `rgba(150,210,255,${pulse * 0.4})`;
    ctx.lineWidth = 1;
    drawWaveTop(ctx, p, frame, 1.5, 2, `rgba(150,210,255,${pulse * 0.4})`, 1);
  }

  else if (mat.id === 'rose') {
    // Pink/red glowing material
    const pulse = 0.3 + Math.sin(frame * 0.08 + x * 0.01) * 0.15;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(255,100,170,${0.4 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(200,50,120,0.5)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Glowing top
    ctx.fillStyle = `rgba(255,180,210,${pulse * 0.5})`;
    ctx.shadowColor = '#FF44AA';
    ctx.shadowBlur = 6;
    ctx.fillRect(x, y, w, 2);
    ctx.shadowBlur = 0;
    // Petal-like patterns
    ctx.strokeStyle = `rgba(255,150,200,${0.3 + pulse * 0.15})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const px = x + (i + 0.5) * (w / 3);
      const py = y + h / 2;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  else if (mat.id === 'lime') {
    // Bright green energetic material
    const pulse = 0.3 + Math.sin(frame * 0.1 + x * 0.01) * 0.15;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(136,255,50,${0.35 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(80,200,20,0.5)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Energy streaks
    ctx.strokeStyle = `rgba(180,255,80,${0.4 + pulse * 0.2})`;
    ctx.lineWidth = 1;
    ctx.shadowColor = '#88FF00';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.2 + i * 0.3);
      const off = (frame * 1.5 + i * 50) % (w + 30) - 15;
      ctx.beginPath();
      ctx.moveTo(x + off, ly);
      ctx.lineTo(x + off + 20, ly);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Bright top
    ctx.fillStyle = `rgba(200,255,120,${pulse * 0.5})`;
    ctx.fillRect(x, y, w, 2);
  }

  else if (mat.id === 'antigravity') {
    // Strange floating/futuristic material with distortion effects — NON-SOLID visual
    ctx.globalAlpha = 0.4;
    const pulse = 0.2 + Math.sin(frame * 0.06 + x * 0.01) * 0.15;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(180,120,255,${0.3 + pulse * 0.2})`);
    g.addColorStop(0.5, 'rgba(140,80,220,0.2)');
    g.addColorStop(1, 'rgba(100,50,180,0.3)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, 4); ctx.fill();
    // Distortion waves
    ctx.strokeStyle = `rgba(200,150,255,${pulse * 0.5})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const oy = y + (h / 5) * (i + 1) + Math.sin(frame * 0.05 + i) * 3;
      ctx.beginPath();
      for (let wx = 0; wx <= w; wx += 4) {
        const off = Math.sin((wx + frame * 1.5 + i * 30) * 0.04) * 2;
        if (wx === 0) ctx.moveTo(x + wx, oy + off);
        else ctx.lineTo(x + wx, oy + off);
      }
      ctx.stroke();
    }
    // Up-arrows indicating reversed gravity
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = `rgba(255,200,255,${0.4 + pulse * 0.2})`;
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    for (let ax = x + 20; ax < x + w; ax += 50) {
      ctx.fillText('↑', ax, y + h - 6);
    }
    // Floating particles
    for (let i = 0; i < 4; i++) {
      const px = x + ((i * 47 + frame * 0.1) % w);
      const py = y + h - ((frame * 0.2 + i * 15) % h);
      ctx.fillStyle = `rgba(220,180,255,${0.3 * (1 - (py - y) / h)})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}