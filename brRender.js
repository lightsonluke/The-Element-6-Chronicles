// brRender.js — rendering helpers for destructible platforms, movement items,
// environmental hazards, and interactive objects.
//
// Visual design: polished, stylized 2D platform-fighter look. Each hazard has a
// unique visual identity with clear gameplay-readable warnings, activation effects,
// active/inactive states, and localized effects that match the game's glow style.

// ── Destructible platforms ──
export function drawDestructiblePlatforms(ctx, sections, frameCount) {
  for (const s of sections) {
    if (!s._deleted) {
      const g = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      g.addColorStop(0, '#2e3e6e');
      g.addColorStop(0.5, '#2a3a6a');
      g.addColorStop(1, '#1e2e5e');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#4466FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 4);
      ctx.fill();
      ctx.stroke();
      // Top edge glow
      ctx.fillStyle = 'rgba(100,140,255,0.3)';
      ctx.fillRect(s.x, s.y, s.w, 2);
      // Section divider lines (subtle)
      if (s._si > 0) {
        ctx.strokeStyle = 'rgba(68,102,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.h);
        ctx.stroke();
      }
    } else {
      const alpha = s._fallAlpha != null ? s._fallAlpha : 1;
      if (alpha > 0) {
        ctx.save();
        const cx = s.x + s.w / 2 + (s._xOff || 0);
        const cy = s.y + s.h / 2 + (s._fallY || 0);
        ctx.translate(cx, cy);
        ctx.rotate(s._fallRot || 0);
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = '#2a3a6a';
        ctx.strokeStyle = '#4466FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-s.w / 2, -s.h / 2, s.w, s.h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = '#FF6644';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-s.w * 0.3, -s.h / 2);
        ctx.lineTo(-s.w * 0.1, 0);
        ctx.lineTo(s.w * 0.2, s.h / 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ── Movement items ──
export function drawMovementItems(ctx, items, frameCount) {
  for (const it of items) {
    if (it.type === 'launch_pad') {
      ctx.save();
      const pulse = it.cooldown > 0 ? 0.3 : 0.6 + Math.sin(frameCount * 0.1) * 0.2;
      // Base plate
      ctx.fillStyle = '#332200';
      ctx.beginPath();
      ctx.roundRect(it.x - it.w / 2, it.y, it.w, it.h, 4);
      ctx.fill();
      // Spring coils
      ctx.strokeStyle = `rgba(255,170,0,${pulse})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 6;
      for (let sx = -it.w / 2 + 6; sx < it.w / 2 - 4; sx += 8) {
        ctx.beginPath();
        ctx.moveTo(it.x + sx, it.y + 4);
        ctx.lineTo(it.x + sx + 2, it.y + it.h - 4);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Arrow up
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(it.x, it.y - 8);
      ctx.lineTo(it.x - 10, it.y + 2);
      ctx.lineTo(it.x + 10, it.y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FFAA00';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    } else if (it.type === 'air_dash_pad') {
      ctx.save();
      const pulse = it.cooldown > 0 ? 0.3 : 0.6 + Math.sin(frameCount * 0.1) * 0.2;
      ctx.fillStyle = '#001530';
      ctx.beginPath();
      ctx.roundRect(it.x - it.w / 2, it.y, it.w, it.h, 4);
      ctx.fill();
      ctx.fillStyle = `rgba(0,200,255,${pulse})`;
      ctx.strokeStyle = '#00AAFF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00AAFF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(it.x - it.w / 2 + 2, it.y + 2, it.w - 4, it.h - 4, 3);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(it.x - 10, it.y + 6); ctx.lineTo(it.x - 4, it.y); ctx.lineTo(it.x - 4, it.y + 12); ctx.closePath();
      ctx.moveTo(it.x + 4, it.y + 6); ctx.lineTo(it.x + 10, it.y); ctx.lineTo(it.x + 10, it.y + 12); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

// ── Environmental hazards ── (polished redesign)
export function drawHazards(ctx, hazards, frameCount) {
  // ── Water Pool: animated water with ripples, reflections, splashes, pool boundary ──
  for (const w of hazards.water) {
    ctx.save();
    // Pool body — translucent layered water
    const g = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
    g.addColorStop(0, 'rgba(60,140,220,0.35)');
    g.addColorStop(0.5, 'rgba(40,100,180,0.3)');
    g.addColorStop(1, 'rgba(20,60,140,0.45)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(w.x, w.y, w.w, w.h, 6);
    ctx.fill();
    // Pool boundary — clear edge
    ctx.strokeStyle = 'rgba(80,160,240,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(w.x, w.y, w.w, w.h, 6);
    ctx.stroke();
    // Animated surface ripples
    ctx.strokeStyle = 'rgba(140,210,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w.w; x += 4) {
      const yOff = Math.sin((frameCount * 0.06 + x * 0.04) * 1) * 3;
      if (x === 0) ctx.moveTo(w.x + x, w.y + yOff);
      else ctx.lineTo(w.x + x, w.y + yOff);
    }
    ctx.stroke();
    // Second ripple layer
    ctx.strokeStyle = 'rgba(100,180,240,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w.w; x += 4) {
      const yOff = Math.sin((frameCount * 0.04 + x * 0.03 + 20) * 1) * 2;
      if (x === 0) ctx.moveTo(w.x + x, w.y + 4 + yOff);
      else ctx.lineTo(w.x + x, w.y + 4 + yOff);
    }
    ctx.stroke();
    // Depth ripples
    ctx.strokeStyle = 'rgba(80,150,220,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ry = w.y + w.h * (0.25 + i * 0.22);
      ctx.beginPath();
      for (let x = 0; x <= w.w; x += 6) {
        const off = Math.sin((frameCount * 0.03 + x * 0.02 + i * 40) * 1) * 1.5;
        if (x === 0) ctx.moveTo(w.x + x, ry + off);
        else ctx.lineTo(w.x + x, ry + off);
      }
      ctx.stroke();
    }
    // Bubble particles
    for (let i = 0; i < 5; i++) {
      const bx = w.x + ((i * 47 + frameCount * 0.2) % w.w);
      const by = w.y + w.h - ((frameCount * 0.3 + i * 14) % w.h);
      const r = 1.5 + (i % 2);
      ctx.fillStyle = `rgba(180,220,255,${0.3 * (1 - (w.h - (by - w.y)) / w.h)})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Reflection highlight
    ctx.fillStyle = 'rgba(200,230,255,0.12)';
    ctx.fillRect(w.x + 4, w.y + 2, w.w - 8, 3);
    ctx.restore();
  }

  // ── Fire Zone: glowing heated floor with flames/embers and danger boundary ──
  for (const f of hazards.fire) {
    ctx.save();
    // Danger boundary — glowing red floor area
    const dangerPulse = 0.3 + Math.sin(frameCount * 0.1) * 0.15;
    ctx.fillStyle = `rgba(255,60,20,${dangerPulse * 0.3})`;
    ctx.beginPath();
    ctx.roundRect(f.x, f.y, f.w, f.h, 4);
    ctx.fill();
    // Danger boundary line
    ctx.strokeStyle = `rgba(255,80,30,${0.5 + dangerPulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FF4400';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(f.x, f.y, f.w, f.h, 4);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Heated floor glow
    const floorGlow = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
    floorGlow.addColorStop(0, `rgba(255,100,30,${0.4 * dangerPulse})`);
    floorGlow.addColorStop(1, 'rgba(200,40,10,0.2)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    // Flames — layered animated fire tongues
    const flicker = 0.7 + Math.sin(frameCount * 0.2 + f.x * 0.01) * 0.3;
    for (let i = 0; i < f.w; i += 12) {
      const fh = 18 + Math.sin(frameCount * 0.15 + i * 0.1) * 10;
      const fx = f.x + i;
      // Outer flame (orange)
      ctx.fillStyle = `rgba(255,100,20,${0.5 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(fx, f.y);
      ctx.quadraticCurveTo(fx + 6, f.y - fh * 0.6, fx + 6, f.y - fh);
      ctx.quadraticCurveTo(fx + 6, f.y - fh * 0.6, fx + 12, f.y);
      ctx.fill();
      // Inner flame (yellow)
      ctx.fillStyle = `rgba(255,200,60,${0.6 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(fx + 3, f.y);
      ctx.quadraticCurveTo(fx + 6, f.y - fh * 0.4, fx + 6, f.y - fh * 0.7);
      ctx.quadraticCurveTo(fx + 6, f.y - fh * 0.4, fx + 9, f.y);
      ctx.fill();
    }
    // Rising embers
    for (let i = 0; i < 4; i++) {
      const ex = f.x + ((i * 31 + frameCount * 0.4) % f.w);
      const ey = f.y - ((frameCount * 0.4 + i * 15) % 40);
      const alpha = 0.5 * (1 - (f.y - ey) / 40);
      ctx.fillStyle = `rgba(255,160,40,${alpha})`;
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Electric Zone: energized area with animated electricity and flashes ──
  for (const e of hazards.electric) {
    ctx.save();
    const active = e.pulseTimer < 60;
    // Zone boundary
    ctx.strokeStyle = active ? `rgba(100,200,255,${0.4 + Math.sin(frameCount * 0.2) * 0.2})` : 'rgba(100,200,255,0.15)';
    ctx.lineWidth = active ? 2 : 1;
    ctx.setLineDash(active ? [6, 4] : [3, 6]);
    ctx.beginPath();
    ctx.roundRect(e.x, e.y - 10, e.w, e.h + 10, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    if (active) {
      // Energy field glow
      ctx.fillStyle = 'rgba(100,200,255,0.08)';
      ctx.fillRect(e.x, e.y - 10, e.w, e.h + 10);
      // Animated electricity arcs
      ctx.strokeStyle = '#88DDFF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#44AAFF';
      ctx.shadowBlur = 12;
      for (let arc = 0; arc < 3; arc++) {
        ctx.beginPath();
        for (let i = 0; i < e.w; i += 8) {
          const j = (Math.random() - 0.5) * 16;
          const yBase = e.y + (arc - 1) * 8;
          if (i === 0) ctx.moveTo(e.x + i, yBase + j);
          else ctx.lineTo(e.x + i, yBase + j);
        }
        ctx.stroke();
      }
      // Vertical discharge sparks
      for (let i = 0; i < 4; i++) {
        const sx = e.x + ((i * 27 + frameCount * 0.5) % e.w);
        ctx.beginPath();
        ctx.moveTo(sx, e.y);
        for (let sy = 0; sy < e.h; sy += 6) {
          ctx.lineTo(sx + (Math.random() - 0.5) * 8, e.y + sy);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Flash highlights
      if (Math.sin(frameCount * 0.3) > 0.7) {
        ctx.fillStyle = 'rgba(200,230,255,0.15)';
        ctx.fillRect(e.x, e.y - 10, e.w, e.h + 10);
      }
    } else {
      // Inactive — subtle warning indicators
      ctx.fillStyle = 'rgba(100,200,255,0.05)';
      ctx.fillRect(e.x, e.y - 10, e.w, e.h + 10);
      // Charging indicator
      const charge = e.pulseTimer / 60;
      ctx.fillStyle = `rgba(100,200,255,${0.2 + charge * 0.2})`;
      ctx.fillRect(e.x, e.y - 12, e.w * (1 - charge), 2);
    }
    ctx.restore();
  }

  // ── Moving Saw: detailed stylized mechanical saw with rotation and movement path ──
  for (const m of hazards.moving) {
    const axis = m.axis || 'horizontal';
    // Travel path indicator
    ctx.save();
    ctx.strokeStyle = 'rgba(255,170,0,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    if (axis === 'vertical') {
      ctx.moveTo(m.x + m.w / 2, m.startY);
      ctx.lineTo(m.x + m.w / 2, m.startY + m.range);
    } else {
      ctx.moveTo(m.startX, m.y + m.h / 2);
      ctx.lineTo(m.startX + m.range, m.y + m.h / 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // Path endpoint markers
    ctx.fillStyle = 'rgba(255,170,0,0.3)';
    if (axis === 'vertical') {
      ctx.beginPath(); ctx.arc(m.x + m.w / 2, m.startY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(m.x + m.w / 2, m.startY + m.range, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(m.startX, m.y + m.h / 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(m.startX + m.range, m.y + m.h / 2, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Saw blade
    ctx.save();
    ctx.translate(m.x, m.y);
    const rotSpeed = 0.15 * m.dir;
    ctx.rotate(frameCount * rotSpeed);
    if (m.type === 'saw') {
      // Outer blade with teeth
      const r = m.w / 2;
      ctx.fillStyle = '#999';
      ctx.strokeStyle = '#CCC';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF6600';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const teeth = 10;
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a2) * r * 0.7, Math.sin(a2) * r * 0.7);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Inner hub
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#AAA';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Center bolt
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      // Metallic highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Spoke details
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15);
        ctx.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.stroke();
      }
    } else if (m.type === 'spike') {
      ctx.fillStyle = '#AA4444';
      ctx.strokeStyle = '#FF6666';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * m.w / 2, Math.sin(a) * m.h / 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // ── Portal: glowing dimensional ring with swirling energy ──
  for (const p of (hazards.portals || [])) {
    // Faint link line between paired portals
    ctx.save();
    ctx.strokeStyle = 'rgba(170,68,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(p.a.x + p.a.w / 2, p.a.y + p.a.h / 2);
    ctx.lineTo(p.b.x + p.b.w / 2, p.b.y + p.b.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    for (const portal of [p.a, p.b]) {
      ctx.save();
      ctx.translate(portal.x + portal.w / 2, portal.y + portal.h / 2);
      const r = portal.w / 2;
      const swirl = frameCount * 0.06;
      // Outer glow
      ctx.shadowColor = '#AA44FF';
      ctx.shadowBlur = 15;
      // Multiple swirling rings
      for (let ring = 0; ring < 3; ring++) {
        ctx.strokeStyle = `rgba(170,68,255,${0.7 - ring * 0.15})`;
        ctx.lineWidth = 3 - ring;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.15) {
          const rr = r * (0.5 + ring * 0.18) + Math.sin(a * 4 + swirl + ring) * 3;
          const x = Math.cos(a + swirl * (ring % 2 ? -1 : 1)) * rr;
          const y = Math.sin(a + swirl * (ring % 2 ? -1 : 1)) * rr;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Swirling energy center
      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
      cg.addColorStop(0, 'rgba(200,100,255,0.5)');
      cg.addColorStop(0.5, 'rgba(150,60,220,0.3)');
      cg.addColorStop(1, 'rgba(100,40,180,0.1)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      // Bright center point
      ctx.fillStyle = `rgba(255,200,255,${0.4 + Math.sin(frameCount * 0.1) * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Orbiting particles
      for (let i = 0; i < 4; i++) {
        const a = swirl * 2 + (i / 4) * Math.PI * 2;
        const px = Math.cos(a) * r * 0.7;
        const py = Math.sin(a) * r * 0.7;
        ctx.fillStyle = `rgba(200,150,255,${0.5 + Math.sin(frameCount * 0.1 + i) * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── Catapult: stylized mechanical launcher with launching motion ──
  for (const c of (hazards.catapults || [])) {
    ctx.save();
    const cx = c.x + c.w / 2, cy = c.y;
    const isActive = !!c.active;
    const isCooldown = c.cooldown > 0;
    // Base platform
    ctx.fillStyle = isCooldown ? '#3a2030' : '#4a2540';
    ctx.strokeStyle = isCooldown ? '#664455' : '#FF4488';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(c.x, c.y - c.h / 2, c.w, c.h, 6);
    ctx.fill();
    ctx.stroke();
    // Mechanical details — side rails
    ctx.strokeStyle = isCooldown ? '#553355' : '#AA6688';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y - c.h / 2 + 4);
    ctx.lineTo(c.x + 4, c.y + c.h / 2 - 4);
    ctx.moveTo(c.x + c.w - 4, c.y - c.h / 2 + 4);
    ctx.lineTo(c.x + c.w - 4, c.y + c.h / 2 - 4);
    ctx.stroke();
    // Direction arrow (supports left / right / up)
    const dir = c.dir || 'right';
    const arrowColor = isCooldown ? '#884466' : isActive ? '#FFFF88' : '#FFD700';
    ctx.fillStyle = arrowColor;
    ctx.shadowColor = arrowColor;
    ctx.shadowBlur = isActive ? 10 : 4;
    ctx.beginPath();
    if (dir === 'up') {
      ctx.moveTo(cx, cy - 20); ctx.lineTo(cx - 9, cy - 6); ctx.lineTo(cx + 9, cy - 6); ctx.closePath();
    } else if (dir === 'left') {
      ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 2, cy - 9); ctx.lineTo(cx - 2, cy + 9); ctx.closePath();
    } else {
      ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + 2, cy - 9); ctx.lineTo(cx + 2, cy + 9); ctx.closePath();
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    // Charge glow when a fighter is loaded
    if (isActive) {
      const glow = 0.4 + Math.sin(frameCount * 0.4) * 0.3;
      // Expanding charge rings
      for (let ring = 0; ring < 3; ring++) {
        const ringR = c.w * 0.3 + ring * 6 + Math.sin(frameCount * 0.2 + ring) * 3;
        ctx.strokeStyle = `rgba(255,255,150,${glow * (0.4 - ring * 0.1)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Core glow
      ctx.fillStyle = `rgba(255,255,200,${glow * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy, c.w * 0.25, 0, Math.PI * 2);
      ctx.fill();
      // Spark particles
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + frameCount * 0.1;
        const sr = c.w * 0.3;
        ctx.fillStyle = `rgba(255,240,150,${glow})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * sr, cy + Math.sin(a) * sr, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Cooldown indicator
    if (isCooldown) {
      const cdPct = 1 - c.cooldown / 60;
      ctx.fillStyle = 'rgba(100,60,80,0.5)';
      ctx.fillRect(c.x, c.y + c.h / 2 - 3, c.w * cdPct, 3);
    }
    ctx.restore();
  }

  // ── Wind: visible swirling air currents, particles, and directional indicators ──
  for (const w of (hazards.wind || [])) {
    ctx.save();
    // Zone boundary — subtle
    ctx.strokeStyle = 'rgba(150,255,230,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.roundRect(w.x, w.y, w.w, w.h, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    // Translucent wind fill
    ctx.fillStyle = 'rgba(150,255,230,0.06)';
    ctx.beginPath();
    ctx.roundRect(w.x, w.y, w.w, w.h, 4);
    ctx.fill();
    const dir = w.dir || 'right';
    // Swirling air current streaks
    ctx.strokeStyle = 'rgba(180,255,240,0.5)';
    ctx.lineWidth = 2;
    const rows = 6;
    for (let i = 0; i < rows; i++) {
      const t = (frameCount * 2.5 + i * 18) % 70;
      const alpha = 0.6 * Math.sin((t / 70) * Math.PI);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      if (dir === 'right' || dir === 'left') {
        const y = w.y + 14 + i * ((w.h - 28) / (rows - 1));
        const sx = dir === 'right' ? w.x + (t / 70) * w.w : w.x + w.w - (t / 70) * w.w;
        const dx = dir === 'right' ? 22 : -22;
        // Wavy streak
        ctx.moveTo(sx, y);
        ctx.quadraticCurveTo(sx + dx * 0.5, y - 3, sx + dx, y);
        ctx.stroke();
      } else {
        const x = w.x + 14 + i * ((w.w - 28) / (rows - 1));
        const sy = dir === 'down' ? w.y + (t / 70) * w.h : w.y + w.h - (t / 70) * w.h;
        const dy = dir === 'down' ? 22 : -22;
        ctx.moveTo(x, sy);
        ctx.quadraticCurveTo(x - 3, sy + dy * 0.5, x, sy + dy);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    // Floating dust/leaf particles
    for (let i = 0; i < 6; i++) {
      const px = w.x + ((i * 37 + frameCount * (dir === 'right' ? 0.5 : dir === 'left' ? -0.5 : 0)) % w.w);
      const py = w.y + ((i * 53 + frameCount * (dir === 'down' ? 0.4 : dir === 'up' ? -0.4 : 0.2)) % w.h);
      const sway = Math.sin(frameCount * 0.05 + i) * 3;
      ctx.fillStyle = `rgba(200,255,240,${0.3 + Math.sin(frameCount * 0.08 + i) * 0.15})`;
      ctx.beginPath();
      ctx.arc(px + sway, py, 1.5 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
    // Directional arrow indicator
    const arrowPulse = 0.5 + Math.sin(frameCount * 0.1) * 0.2;
    ctx.fillStyle = `rgba(220,255,250,${arrowPulse})`;
    ctx.font = 'bold 22px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#88FFEE';
    ctx.shadowBlur = 6;
    const arrow = dir === 'right' ? '→' : dir === 'left' ? '←' : dir === 'up' ? '↑' : '↓';
    ctx.fillText(arrow, w.x + w.w / 2, w.y + w.h / 2 + 8);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Falling rocks ──
  for (const zone of hazards.rocks) {
    for (const r of zone.activeRocks) {
      if (r.warning > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.3) * 0.2;
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.ellipse(r.x, 7700, r.size, r.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Warning ring
        ctx.strokeStyle = `rgba(255,100,100,${0.5 + Math.sin(frameCount * 0.3) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, 7700, r.size * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        // Rock body with gradient
        const g = ctx.createRadialGradient(r.x - r.size * 0.3, r.y - r.size * 0.3, 2, r.x, r.y, r.size);
        g.addColorStop(0, '#998877');
        g.addColorStop(1, '#554433');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#443322';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Crack details
        ctx.strokeStyle = '#332211';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r.x - r.size * 0.5, r.y - r.size * 0.3);
        ctx.lineTo(r.x + r.size * 0.3, r.y + r.size * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r.x + r.size * 0.2, r.y - r.size * 0.4);
        ctx.lineTo(r.x - r.size * 0.1, r.y + r.size * 0.3);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ── Interactive objects ── (polished redesign)
export function drawObjects(ctx, objects, frameCount) {
  for (const obj of objects) {
    if (obj._broken) continue;
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj._rot || 0);
    const size = obj.w;

    if (obj.type === 'ball') {
      const g = ctx.createRadialGradient(-size*0.2,-size*0.25,2,0,0,size/2);
      g.addColorStop(0,'#FF7777'); g.addColorStop(0.45,'#E53935'); g.addColorStop(1,'#9E1B1B');
      ctx.fillStyle=g; ctx.strokeStyle='#5C0F0F'; ctx.lineWidth=3;
      ctx.shadowColor='#FF3333'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(0,0,size/2,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.38)'; ctx.beginPath(); ctx.arc(-size*.18,-size*.2,size*.12,0,Math.PI*2); ctx.fill();
    }

    else if (obj.type === 'heavy') {
      // Heavy crate — dark wood with metal bands
      const g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
      g.addColorStop(0, '#9a8060');
      g.addColorStop(1, '#6a5040');
      ctx.fillStyle = g;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 3);
      ctx.fill();
      ctx.stroke();
      // Metal band
      ctx.fillStyle = 'rgba(100,100,100,0.6)';
      ctx.fillRect(-size / 2, -2, size, 4);
      ctx.strokeStyle = 'rgba(150,150,150,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-size / 2, -2, size, 4);
      // Corner rivets
      ctx.fillStyle = 'rgba(180,180,180,0.6)';
      for (const [rx, ry] of [[-size/2+4,-size/2+4],[size/2-4,-size/2+4],[-size/2+4,size/2-4],[size/2-4,size/2-4]]) {
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Wood grain
      ctx.strokeStyle = 'rgba(60,40,20,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-size / 2 + 4, -size / 4);
      ctx.lineTo(size / 2 - 4, -size / 4);
      ctx.stroke();
    }

    else if (obj.type === 'light') {
      // Light orb — glowing energy ball
      const g = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 2, 0, 0, size / 2);
      g.addColorStop(0, '#BBE0FF');
      g.addColorStop(0.5, '#88CCFF');
      g.addColorStop(1, '#4488CC');
      ctx.fillStyle = g;
      ctx.strokeStyle = 'rgba(100,180,255,0.6)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#88CCFF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Inner glow
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-size * 0.15, -size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Pulsing energy ring
      const pulse = 0.3 + Math.sin(frameCount * 0.1) * 0.15;
      ctx.strokeStyle = `rgba(150,200,255,${pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    else if (obj.type === 'bouncing') {
      // Bouncing ball — rubber with shine
      const g = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 2, 0, 0, size / 2);
      g.addColorStop(0, '#FFAADD');
      g.addColorStop(1, '#CC4488');
      ctx.fillStyle = g;
      ctx.strokeStyle = 'rgba(180,40,100,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Shine highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.2, -size * 0.2, size * 0.15, size * 0.1, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Bounce indicator — small spring marks
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0.3, 0.6);
      ctx.stroke();
    }

    else if (obj.type === 'breakable') {
      // Breakable crate — cracked wood
      const g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
      g.addColorStop(0, '#FFE8A0');
      g.addColorStop(1, '#CCAA60');
      ctx.fillStyle = g;
      ctx.strokeStyle = 'rgba(100,70,30,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 3);
      ctx.fill();
      ctx.stroke();
      // Crack lines (decorative — not actually breakable in stage editor)
      ctx.strokeStyle = 'rgba(80,50,20,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size / 3, -size / 2);
      ctx.lineTo(-size / 6, 0);
      ctx.lineTo(0, size / 4);
      ctx.moveTo(size / 4, -size / 3);
      ctx.lineTo(size / 3, size / 3);
      ctx.stroke();
      // Damage indicators based on hit count
      if (obj.hitCount > 0) {
        ctx.strokeStyle = 'rgba(60,30,10,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 4, -size / 4);
        ctx.lineTo(size / 4, size / 2 - 4);
        ctx.stroke();
      }
    }

    else if (obj.type === 'boomerang') {
      // Boomerang — stylized V-shape with glow when active
      ctx.fillStyle = obj.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.shadowColor = obj._phase !== 'idle' ? '#FFAA00' : 'transparent';
      ctx.shadowBlur = obj._phase !== 'idle' ? 12 : 0;
      ctx.beginPath();
      ctx.moveTo(-size / 2, -size / 4);
      ctx.lineTo(0, -size / 2);
      ctx.lineTo(size / 4, -size / 4);
      ctx.lineTo(size / 8, 0);
      ctx.lineTo(size / 2, size / 4);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(-size / 4, size / 4);
      ctx.lineTo(-size / 8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Active glow trail
      if (obj._phase !== 'idle') {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFAA00';
        ctx.shadowBlur = 10;
        ctx.stroke();
        // Motion trail
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.shadowBlur = 0;
      // Center detail
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}