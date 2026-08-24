// Additional unique supermove animations for characters not covered in renderer.js
// Each function draws a unique animation at (x, y) with progress 0→1

// Turquoise — Apex Evolution: beast claw marks ripping across
export function drawSuper_Turquoise(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 5; i++) {
    const phase = p - i * 0.12;
    if (phase < 0) continue;
    const cx = x - 120 + i * 60;
    const cy = y - 18 + Math.sin(phase * 6) * 20;
    ctx.globalAlpha = alpha * (0.8 - i * 0.1);
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 5 - i * 0.5;
    ctx.shadowBlur = 15;
    for (let c = 0; c < 3; c++) {
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 25 + c * 8);
      ctx.quadraticCurveTo(cx, cy + 10 - c * 5, cx + 30, cy - 25 + c * 8);
      ctx.stroke();
    }
  }
}

// Olive — Colossal Growth: expanding rings growing outward
export function drawSuper_Olive(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let r = 0; r < 6; r++) {
    const rr = (40 + r * 40) * p * (1 + r * 0.15);
    ctx.globalAlpha = alpha * (0.6 - r * 0.08);
    ctx.strokeStyle = r % 2 === 0 ? color : '#AAAA44';
    ctx.lineWidth = 4 - r * 0.4;
    ctx.beginPath();
    ctx.ellipse(x, y - 18, rr, rr * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Growing pillar
  const ph = p * 180;
  const grad = ctx.createLinearGradient(x, y, x, y - ph);
  grad.addColorStop(0, color + 'FF');
  grad.addColorStop(1, color + '00');
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = grad;
  ctx.fillRect(x - 25, y - ph, 50, ph);
}

// Copper — Time Fracture: clock hands spinning, time shards
export function drawSuper_Copper(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Clock face
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 18, 60 + p * 40, 0, Math.PI * 2); ctx.stroke();
  // Spinning hands
  for (let h = 0; h < 3; h++) {
    const ang = p * Math.PI * (3 + h) + h * 2.1;
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = h === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(ang) * (50 + p * 50), y - 18 + Math.sin(ang) * (50 + p * 50));
    ctx.stroke();
  }
  // Time shards
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + p * 2;
    const dist = 40 + p * 120;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = i % 2 === 0 ? color : '#FFDDBB';
    ctx.save();
    ctx.translate(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 8); ctx.lineTo(-5, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// Emerald — Ghost Realm: phasing afterimages dissolving
export function drawSuper_Emerald(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 6; i++) {
    const phase = p - i * 0.1;
    if (phase < 0) continue;
    ctx.globalAlpha = alpha * (0.5 - i * 0.07);
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x - i * 20 + phase * 40, y - 18, 25, 50, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Ghostly wisps
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + p * 3;
    const r = 30 + p * 100;
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y - 18 + Math.sin(a) * r, 4 + p * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Pearl — Symphony of Echoes: sound waves rippling outward
export function drawSuper_Pearl(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let r = 0; r < 8; r++) {
    const rr = (20 + r * 30) * p;
    ctx.globalAlpha = alpha * (0.5 - r * 0.05);
    ctx.strokeStyle = r % 2 === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 3 - r * 0.2;
    ctx.beginPath();
    ctx.arc(x, y - 18, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Sound frequency bars
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const barH = 20 + Math.sin(p * 20 + i) * 30 + p * 40;
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 60, y - 18 + Math.sin(a) * 60);
    ctx.lineTo(x + Math.cos(a) * (60 + barH), y - 18 + Math.sin(a) * (60 + barH));
    ctx.stroke();
  }
}

// Lavender — Crystal Atmosphere: floating solid-air blades
export function drawSuper_Lavender(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + p * 2;
    const dist = 50 + p * 130;
    const sx = x + Math.cos(a) * dist;
    const sy = y - 18 + Math.sin(a) * dist * 0.6;
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : color;
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(a + p * 5);
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(4, 0); ctx.lineTo(0, 14); ctx.lineTo(-4, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Air crystal platform
  ctx.globalAlpha = alpha * 0.3;
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y - 18, 80 + p * 60, 30, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Amber — Clone Army: multiple stickman silhouettes rushing
export function drawSuper_Amber(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 8; i++) {
    const phase = p - i * 0.08;
    if (phase < 0) continue;
    const sx = x - 180 + i * 50 + phase * 80;
    ctx.globalAlpha = alpha * (0.6 - i * 0.05);
    ctx.fillStyle = i === 0 ? '#FFFFFF' : color;
    // Stickman silhouette
    ctx.beginPath(); ctx.arc(sx, y - 40, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 3, y - 32, 6, 24);
    ctx.beginPath();
    ctx.moveTo(sx - 8, y - 8); ctx.lineTo(sx + 8, y - 8); ctx.lineTo(sx, y + 6);
    ctx.closePath(); ctx.fill();
  }
}

// Magenta — World Adhesive: sticky goo splattering
export function drawSuper_Magenta(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Goo splatter
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const dist = p * 140 + Math.sin(i) * 20;
    const r = 10 + Math.sin(p * 10 + i) * 8;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : color;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sticky strands
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * 60, y - 18 + Math.sin(a) * 40,
      x + Math.cos(a) * 120 * p, y - 18 + Math.sin(a) * 80 * p
    );
    ctx.stroke();
  }
}

// Maroon — Infinite Reactor: energy orb growing and blasting
export function drawSuper_Maroon(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Growing energy orb
  const orbR = 20 + p * 80;
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, orbR);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, color + '00');
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, orbR, 0, Math.PI * 2); ctx.fill();
  // Energy beam
  if (p > 0.3) {
    const beamLen = (p - 0.3) * 300;
    ctx.globalAlpha = alpha * 0.7;
    const bgrad = ctx.createLinearGradient(x, y - 18, x + beamLen, y - 18);
    bgrad.addColorStop(0, '#FFFFFF'); bgrad.addColorStop(1, color + '00');
    ctx.fillStyle = bgrad;
    ctx.fillRect(x, y - 28, beamLen, 20);
  }
}

// Crimson — Endless Arsenal: floating weapons launching
export function drawSuper_Crimson(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + p * 3;
    const dist = 40 + p * 120;
    const sx = x + Math.cos(a) * dist;
    const sy = y - 18 + Math.sin(a) * dist * 0.6;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : color;
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(a + p * 8);
    // Mini blade shape
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(3, 0); ctx.lineTo(0, 10); ctx.lineTo(-3, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Central energy burst
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = color; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(x, y - 18, 30 + p * 40, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

// Scarlet — Army of the Fallen: spectral warriors charging
export function drawSuper_Scarlet(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 6; i++) {
    const phase = p - i * 0.1;
    if (phase < 0) continue;
    const sx = x - 150 + i * 55;
    ctx.globalAlpha = alpha * (0.5 - i * 0.05);
    ctx.fillStyle = i === 0 ? '#FFFFFF' : color;
    // Ghost warrior silhouette
    ctx.beginPath(); ctx.arc(sx, y - 35, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 2, y - 28, 4, 20);
    // Scythe
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 5, y - 28); ctx.quadraticCurveTo(sx + 15, y - 35, sx + 12, y - 45);
    ctx.stroke();
  }
  // Soul ground eruption
  ctx.globalAlpha = alpha * 0.4;
  for (let i = 0; i < 8; i++) {
    const sx = x + (i - 4) * 30;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(sx, y - 10 - Math.sin(p * 10 + i) * 20, 6, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Grey — Citadel: walls rising and collapsing
export function drawSuper_Grey(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Rising walls
  for (let side = -1; side <= 1; side += 2) {
    const wallH = p < 0.5 ? p * 200 : (1 - p) * 200;
    const wx = x + side * 80;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = color;
    ctx.fillRect(wx - 12, y - wallH, 24, wallH);
    // Wall highlights
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillRect(wx - 12, y - wallH, 4, wallH);
  }
  // Debris
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + p * 2;
    const dist = p * 120;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = i % 2 === 0 ? '#888888' : '#AAAAAA';
    ctx.save();
    ctx.translate(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist);
    ctx.rotate(a + p * 5);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

// Corpent — Serpent Strike: coiling snake energy
export function drawSuper_Corpent(ctx, x, y, color, p) {
  const alpha = 1 - p;
  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 15;
  ctx.beginPath();
  for (let t = 0; t <= 1; t += 0.02) {
    const px = x + (t - 0.5) * 300;
    const py = y - 18 + Math.sin(t * Math.PI * 4 + p * 8) * 50 * (1 - t * 0.3);
    t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Snake head
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(x + 150 * p, y - 18, 12, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

// Magneto — Magnetic Storm: metal shards spiraling
export function drawSuper_Magneto(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + p * 4;
    const dist = 40 + p * 140;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#AAAAAA';
    ctx.save();
    ctx.translate(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist * 0.6);
    ctx.rotate(a);
    ctx.fillRect(-8, -3, 16, 6);
    ctx.restore();
  }
  // Magnetic field lines
  for (let r = 0; r < 3; r++) {
    ctx.globalAlpha = alpha * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - 18, (60 + r * 40) * p, (40 + r * 25) * p, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Willow — Forest Entangle: roots erupting from ground
export function drawSuper_Willow(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 7; i++) {
    const phase = p - i * 0.08;
    if (phase < 0) continue;
    const sx = x - 120 + i * 40;
    const rh = phase * 150;
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.quadraticCurveTo(sx + 15, y - rh * 0.5, sx + 10, y - rh);
    ctx.stroke();
    // Branches
    ctx.lineWidth = 3;
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.moveTo(sx + 10, y - rh * (0.3 + b * 0.2));
      ctx.lineTo(sx + 10 + (b % 2 === 0 ? 20 : -20), y - rh * (0.4 + b * 0.2));
      ctx.stroke();
    }
  }
}

// Cable — Cyber Barrage: data streams and code
export function drawSuper_Cable(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Data streams
  for (let i = 0; i < 8; i++) {
    const sx = x - 100 + i * 28;
    ctx.globalAlpha = alpha * (0.5 + Math.sin(p * 10 + i) * 0.3);
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : color;
    ctx.font = '10px monospace';
    for (let j = 0; j < 8; j++) {
      const ch = '01ABCF'[(i + j) % 6];
      const cy = y - 60 + j * 12 + (p * 100) % 12;
      ctx.fillText(ch, sx, cy);
    }
  }
  // Cyber beam
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(x, y - 18); ctx.lineTo(x + p * 200, y - 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// Snodvor — Ice Age: freezing blast spreading
export function drawSuper_Snodvor(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Ice crystals spreading
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const dist = p * 150;
    const sx = x + Math.cos(a) * dist;
    const sy = y - 18 + Math.sin(a) * dist * 0.5;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : color;
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(a);
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const ja = (j / 6) * Math.PI * 2;
      const r = j % 2 === 0 ? 10 : 4;
      if (j === 0) ctx.moveTo(Math.cos(ja) * r, Math.sin(ja) * r);
      else ctx.lineTo(Math.cos(ja) * r, Math.sin(ja) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Frozen ground
  ctx.globalAlpha = alpha * 0.3;
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y - 5, p * 200, p * 40, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Kirsten — Firestorm: volcanic eruption
export function drawSuper_Kirsten(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Eruption column
  const colH = p * 200;
  const grad = ctx.createLinearGradient(x, y, x, y - colH);
  grad.addColorStop(0, color + 'FF');
  grad.addColorStop(0.5, '#FF6600');
  grad.addColorStop(1, '#FF660000');
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = grad;
  ctx.fillRect(x - 20, y - colH, 40, colH);
  // Lava droplets
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
    const dist = p * 140 + Math.sin(i + p * 10) * 30;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : '#FF4400';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist, 5 + p * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Volt — Thunderstorm: lightning barrage from sky
export function drawSuper_Volt(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 6; i++) {
    if (p < i * 0.1) continue;
    const sx = x - 100 + i * 40;
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : '#FFDD00';
    ctx.lineWidth = 3; ctx.shadowColor = '#FFDD00'; ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(sx, y - 250);
    let cy = y - 250;
    while (cy < y - 18) {
      cy += 15 + Math.random() * 20;
      ctx.lineTo(sx + (Math.random() - 0.5) * 30, Math.min(cy, y - 18));
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// Temple — Earthquake: ground cracking
export function drawSuper_Temple(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 8; i++) {
    const sx = x - 140 + i * 40;
    ctx.globalAlpha = alpha * (0.6 + Math.sin(p * 15 + i) * 0.3);
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, y - 5);
    ctx.lineTo(sx + 15, y - 5 - p * 30);
    ctx.lineTo(sx + 5, y - 5 - p * 50);
    ctx.lineTo(sx + 20, y - 5 - p * 70);
    ctx.stroke();
  }
  // Shockwave
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = color; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y - 5, p * 200, p * 30, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Nightmare — Dream Devour: dark tentacles and eyes
export function drawSuper_Nightmare(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const len = 40 + p * 120;
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : '#440066';
    ctx.lineWidth = 6; ctx.shadowColor = '#660066'; ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * len * 0.5, y - 18 + Math.sin(a) * len * 0.5 - 30,
      x + Math.cos(a) * len, y - 18 + Math.sin(a) * len
    );
    ctx.stroke();
  }
  // Eyes
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + p * 2;
    const dist = 50 + p * 80;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// Hazel — Toxic Bloom: poisonous flowers and spores
export function drawSuper_Hazel(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dist = 30 + p * 120;
    const sx = x + Math.cos(a) * dist;
    const sy = y - 18 + Math.sin(a) * dist * 0.6;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = i % 2 === 0 ? '#88DD22' : color;
    // Flower petals
    for (let pt = 0; pt < 5; pt++) {
      const pa = (pt / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(sx + Math.cos(pa) * 6, sy + Math.sin(pa) * 6, 5, 3, pa, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Spore cloud
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#88DD22';
  ctx.beginPath(); ctx.arc(x, y - 18, p * 100, 0, Math.PI * 2); ctx.fill();
}

// Whami — Potion Explosion: bubbling cauldron blast
export function drawSuper_Whami(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Bubbling potion
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * Math.PI * 2 + p * 2;
    const dist = p * 130 + Math.sin(i + p * 8) * 20;
    const r = 6 + Math.sin(p * 10 + i) * 6;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : color;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cauldron shockwave
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = color; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y - 18, p * 120, 0, Math.PI * 2);
  ctx.stroke();
}

// Controller — Mind Control: puppet strings and gears
export function drawSuper_Controller(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Puppet strings
  for (let i = 0; i < 6; i++) {
    const sx = x - 60 + i * 24;
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, y - 200 * p);
    ctx.lineTo(sx + Math.sin(p * 5 + i) * 10, y - 18);
    ctx.stroke();
  }
  // Gears
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + p * 3;
    const dist = 50 + p * 80;
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.save();
    ctx.translate(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist);
    ctx.rotate(p * 5);
    for (let t = 0; t < 8; t++) {
      const ta = (t / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * 10, Math.sin(ta) * 10);
      ctx.lineTo(Math.cos(ta) * 14, Math.sin(ta) * 14);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

// Evil — Ultimate Darkness: void consuming everything
export function drawSuper_Evil(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Growing void
  const voidR = p * 200;
  const grad = ctx.createRadialGradient(x, y - 18, 10, x, y - 18, voidR);
  grad.addColorStop(0, '#000000');
  grad.addColorStop(0.5, '#440044');
  grad.addColorStop(1, '#44004400');
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - 18, voidR, 0, Math.PI * 2); ctx.fill();
  // Dark tendrils
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + p * 2;
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = '#7700AA'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * 80, y - 18 + Math.sin(a) * 80 - 20,
      x + Math.cos(a) * 160 * p, y - 18 + Math.sin(a) * 160 * p
    );
    ctx.stroke();
  }
}

// Life — Genesis: radiant life energy blooming
export function drawSuper_Life(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Healing bloom
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const dist = 20 + p * 120;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : '#44FF88';
    ctx.save();
    ctx.translate(x + Math.cos(a) * dist, y - 18 + Math.sin(a) * dist);
    ctx.rotate(a + p * 3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Radiant center
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#44FF88'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(x, y - 18, 30 + p * 30, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

// Death — Requiem: spectral reapers and soul harvest
export function drawSuper_Death(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + p * 2;
    const dist = 40 + p * 130;
    const sx = x + Math.cos(a) * dist;
    const sy = y - 18 + Math.sin(a) * dist * 0.5;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = i === 0 ? '#FFFFFF' : '#888888';
    // Reaper silhouette
    ctx.beginPath(); ctx.arc(sx, sy - 10, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 2, sy - 4, 4, 16);
    // Scythe
    ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy - 4); ctx.quadraticCurveTo(sx + 12, sy - 10, sx + 10, sy - 18);
    ctx.stroke();
  }
  // Soul harvest
  for (let i = 0; i < 10; i++) {
    const sx = x + (i - 5) * 25;
    const sy = y - 10 - ((p * 80 + i * 20) % 80);
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = '#AAAAAA';
    ctx.beginPath(); ctx.ellipse(sx, sy, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// Mercy — Divine Judgment: holy light pillars
export function drawSuper_Mercy(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 5; i++) {
    const sx = x - 80 + i * 40;
    const ph = p * 180;
    const grad = ctx.createLinearGradient(sx, y, sx, y - ph);
    grad.addColorStop(0, '#FF99DD00');
    grad.addColorStop(0.5, '#FF99DDBB');
    grad.addColorStop(1, '#FFFFFF');
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 10, y - ph, 20, ph);
    // Light glow
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = '#FF99DD';
    ctx.beginPath(); ctx.arc(sx, y - ph, 12, 0, Math.PI * 2); ctx.fill();
  }
  // Central burst
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#FF99DD'; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.arc(x, y - 18, 25 + p * 35, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}