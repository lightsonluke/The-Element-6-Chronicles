// Whip projectile rendering — fire whip (Fire Hero) and electric whip (Cable)
// The hitbox is handled by the engine; this only draws the visual.

export function drawWhip(ctx, p) {
  const tipX = p.x + p.facing * p.reach;
  ctx.save();

  if (p.fireMode) {
    // ── Flame Whip: bright core + organic flickering flames + drifting embers ──
    const animT = (32 - p.life) * 0.5;

    // Outer glow flames (deep red) — broadest, drawn first
    ctx.shadowColor = '#FF4500'; ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(220,20,60,0.45)';
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const fx = p.x + (tipX - p.x) * t;
      const flick = Math.sin(animT * 3 + i * 1.7) * 14 + Math.sin(animT * 7 + i) * 8;
      const h = 24 + Math.sin(animT * 4 + i * 2.3) * 13;
      if (i === 0) ctx.moveTo(fx, p.y - h + flick); else ctx.lineTo(fx, p.y - h + flick);
    }
    for (let i = 18; i >= 0; i--) {
      const t = i / 18;
      const fx = p.x + (tipX - p.x) * t;
      const flick = Math.sin(animT * 3 + i * 1.7 + 1) * 14 + Math.sin(animT * 7 + i + 2) * 8;
      const h = 24 + Math.sin(animT * 4 + i * 2.3 + 1) * 13;
      ctx.lineTo(fx, p.y + h + flick);
    }
    ctx.closePath(); ctx.fill();

    // Mid flames (orange) — tighter, brighter
    ctx.fillStyle = 'rgba(255,140,0,0.65)'; ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const fx = p.x + (tipX - p.x) * t;
      const flick = Math.sin(animT * 4 + i * 2.1) * 9 + Math.sin(animT * 9 + i) * 5;
      const h = 15 + Math.sin(animT * 5 + i * 3) * 7;
      if (i === 0) ctx.moveTo(fx, p.y - h + flick); else ctx.lineTo(fx, p.y - h + flick);
    }
    for (let i = 18; i >= 0; i--) {
      const t = i / 18;
      const fx = p.x + (tipX - p.x) * t;
      const flick = Math.sin(animT * 4 + i * 2.1 + 1) * 9 + Math.sin(animT * 9 + i + 2) * 5;
      const h = 15 + Math.sin(animT * 5 + i * 3 + 1) * 7;
      ctx.lineTo(fx, p.y + h + flick);
    }
    ctx.closePath(); ctx.fill();

    // Bright core line (white-yellow) — fixed horizontal axis, the hitbox line
    ctx.strokeStyle = '#FFFFE0'; ctx.lineWidth = 5; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tipX, p.y); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tipX, p.y); ctx.stroke();

    // Embers — small glowing particles drifting upward
    if (!p.embers) p.embers = [];
    if (p.life % 2 === 0) p.embers.push({ x: p.x + Math.random() * (tipX - p.x), y: p.y + (Math.random() - 0.5) * 16, vy: -1 - Math.random() * 2, life: 18, maxLife: 18 });
    p.embers = p.embers.filter(e => { e.life--; e.y += e.vy; e.x += (Math.random() - 0.5) * 0.6; return e.life > 0; });
    p.embers.forEach(e => {
      const a = e.life / e.maxLife;
      ctx.fillStyle = `rgba(255,${100 + Math.floor(e.life * 8)},0,${a})`;
      ctx.shadowColor = '#FF8C00'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(e.x, e.y, 1.5 + a * 2.5, 0, Math.PI * 2); ctx.fill();
    });

    // Fire sparks from stunned victims (replaces electric bolts)
    (p.bolts || []).forEach(b => {
      ctx.fillStyle = '#FF4500'; ctx.shadowColor = '#FF4500'; ctx.shadowBlur = 10;
      for (let i = 0; i < 5; i++) {
        const ex = b.x + (Math.random() - 0.5) * 32;
        const ey = b.y - Math.random() * 48;
        ctx.beginPath(); ctx.arc(ex, ey, 1.5 + Math.random() * 2.5, 0, Math.PI * 2); ctx.fill();
      }
    });
  } else {
    // ── Electric whip (Cable) — original jagged cracking design ──
    ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.shadowColor = p.color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    const segs = 6;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const wx = p.x + (tipX - p.x) * t + (Math.random() - 0.5) * 14;
      const wy = p.y + (Math.random() - 0.5) * 18;
      ctx.lineTo(wx, wy);
    }
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(tipX, p.y, 6, 0, Math.PI * 2); ctx.fill();
    (p.bolts || []).forEach(b => {
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + (Math.random() - 0.5) * 36, b.y + (Math.random() - 0.5) * 50);
        ctx.stroke();
      }
    });
  }

  ctx.restore();
}