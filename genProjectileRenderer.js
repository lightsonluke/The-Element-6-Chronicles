// genProjectileRenderer.js — Renders all Gen 1-4 unique power projectiles.
// Called from projectileRenderer.js's drawProjectiles function.

export function drawGenProjectiles(ctx, fighter) {
  if (!fighter.genProjectiles) return;
  fighter.genProjectiles.forEach(p => {
    if (!p || p.x == null && p.targetX == null) return;
    ctx.save();

    // ── GEN 1 ──
    if (p.type === 'gen_lightning_call') {
      if (p.warning > 0) {
        const pulse = 1 + Math.sin(p.warning * 0.3) * 0.3;
        ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
        ctx.shadowColor = p.color; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY + 5, 30 * pulse, 12 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.3; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY + 5, 25 * pulse, 10 * pulse, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = p.color; ctx.lineWidth = 6; ctx.shadowColor = p.color; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.moveTo(p.targetX + 5, -50);
        ctx.lineTo(p.targetX - 8, p.targetY - 40); ctx.lineTo(p.targetX + 6, p.targetY - 20);
        ctx.lineTo(p.targetX - 4, p.targetY); ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY + 5, 40, 16, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    else if (p.type === 'gen_flame_burst') {
      if (!p.exploded) {
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFCC00'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
        for (let i = 1; i < 4; i++) {
          ctx.globalAlpha = 0.4 / i;
          ctx.beginPath(); ctx.arc(p.x - p.vx * i * 0.5, p.y, 12 - i * 2, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.globalAlpha = 1 - p.explosionR / p.maxExplosionR;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.explosionR);
        grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, '#FFCC00'); grad.addColorStop(0.7, p.color); grad.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, p.explosionR, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_water_whip') {
      const tipX = p.x + p.facing * p.reach;
      ctx.strokeStyle = p.color; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      const midX = p.x + p.facing * p.reach * 0.5;
      const midY = p.y - 15 + Math.sin(p.life * 0.5) * 8;
      ctx.quadraticCurveTo(midX, midY, tipX, p.y);
      ctx.stroke();
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(tipX, p.y, 6, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.type === 'gen_vine_strike') {
      if (p.delay > 0) { ctx.restore(); return; }
      ctx.strokeStyle = p.color; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - p.height); ctx.stroke();
      ctx.fillStyle = '#226622';
      for (let i = 0; i < 3; i++) {
        const ty = p.y - p.height * (0.3 + i * 0.25);
        const side = i % 2 === 0 ? -1 : 1;
        ctx.beginPath(); ctx.ellipse(p.x + side * 12, ty, 8, 4, side * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_ice_wall') {
      const melt = p.melting ? p.life / 60 : 1;
      const h = p.h * melt;
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.85 * melt;
      ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - h, p.w, h, 8); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5 * melt;
      ctx.beginPath(); ctx.moveTo(p.x - 10, p.y - h * 0.7); ctx.lineTo(p.x + 5, p.y - h * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + 8, p.y - h * 0.8); ctx.lineTo(p.x - 3, p.y - h * 0.4); ctx.stroke();
      ctx.fillStyle = '#DDF5FF'; ctx.globalAlpha = 0.6 * melt;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(p.x + (Math.random() - 0.5) * p.w, p.y - h * Math.random(), 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ── GEN 2 ──
    else if (p.type === 'gen_iron_clamp') {
      if (p.active) {
        ctx.strokeStyle = p.color; ctx.lineWidth = 5; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        const r = p.radius;
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY - 30, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY - 30, r * 0.4, r, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.targetX - r, p.targetY - 30, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.targetX + r, p.targetY - 30, 5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY - 20, 30, 12, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    else if (p.type === 'gen_ember_shot') {
      if (!p.burst) {
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFAA00'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.globalAlpha = 1 - p.burstR / 50;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.burstR);
        grad.addColorStop(0, '#FFCC00'); grad.addColorStop(0.5, p.color); grad.addColorStop(1, 'rgba(255,68,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, p.burstR, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_flame_patch') {
      ctx.globalAlpha = 0.6 * (p.life / 120);
      ctx.fillStyle = '#FF4400'; ctx.shadowColor = '#FF6600'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 25, 8, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const fx = p.x + (Math.random() - 0.5) * 30;
        const fy = p.y - Math.random() * 15;
        ctx.globalAlpha = 0.4 * (p.life / 120);
        ctx.fillStyle = '#FFAA00'; ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_water_push') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.7; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(p.x - 40, p.y - 20, 80, 40, 20); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(p.x - 30, p.y - 10); ctx.quadraticCurveTo(p.x, p.y - 20, p.x + 30, p.y - 10); ctx.stroke();
    }
    else if (p.type === 'gen_stone_pillar') {
      ctx.fillStyle = p.color; ctx.strokeStyle = '#665544'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(p.targetX - 18, p.y - p.height, 36, p.height, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#554433'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.targetX - 8, p.y - p.height * 0.7); ctx.lineTo(p.targetX + 5, p.y - p.height * 0.3); ctx.stroke();
    }
    else if (p.type === 'gen_gust_push') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.globalAlpha = 0.7;
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 12;
        ctx.beginPath(); ctx.moveTo(p.x - 30, p.y + off);
        ctx.quadraticCurveTo(p.x, p.y + off - 5, p.x + 30, p.y + off); ctx.stroke();
      }
    }
    else if (p.type === 'gen_shadow_hand') {
      // Detailed hand rendering
      if (p.phase === 'appear') {
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.8; ctx.shadowColor = p.color; ctx.shadowBlur = 20;
        // Palm
        ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill();
        // Fingers (5 elongated shapes radiating upward)
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI / 2 + (i - 2) * 0.35;
          const fx = p.x + Math.cos(ang) * 14;
          const fy = p.y + Math.sin(ang) * 14;
          ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang + Math.PI / 2);
          ctx.beginPath(); ctx.roundRect(-3, -18, 6, 18, 3); ctx.fill();
          ctx.restore();
        }
        // Wrist
        ctx.beginPath(); ctx.roundRect(p.x - 8, p.y + 10, 16, 14, 4); ctx.fill();
      } else if (p.phase === 'sink') {
        ctx.globalAlpha = Math.max(0, 1 + p.phaseTimer / 15) * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.fill();
      } else if (p.phase === 'emerge' && p.emergeX) {
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.85; ctx.shadowColor = p.color; ctx.shadowBlur = 25;
        // Emerging hand from ground
        ctx.beginPath(); ctx.arc(p.emergeX, p.emergeY - 30, 18, 0, Math.PI * 2); ctx.fill();
        // Fingers spread for slash
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI / 2 + (i - 2) * 0.4;
          const fx = p.emergeX + Math.cos(ang) * 16;
          const fy = p.emergeY - 30 + Math.sin(ang) * 16;
          ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang + Math.PI / 2);
          ctx.beginPath(); ctx.roundRect(-3, -20, 6, 20, 3); ctx.fill();
          ctx.restore();
        }
        // Slash marks
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(p.emergeX - 20, p.emergeY - 50); ctx.lineTo(p.emergeX + 20, p.emergeY - 10); ctx.stroke();
      }
    }
    else if (p.type === 'gen_resonance_lock') {
      // Expanding ring around fighter
      ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.globalAlpha = 0.7; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, Math.max(5, p.r), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.2; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, Math.max(5, p.r), 0, Math.PI * 2); ctx.fill();
      // Inner pulse rings
      ctx.globalAlpha = 0.4; ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath(); ctx.arc(p.x, p.y - 30, Math.max(5, p.r * (0.5 + i * 0.2)), 0, Math.PI * 2); ctx.stroke();
      }
    }
    else if (p.type === 'gen_star_shot') {
      // Star shape shooting forward
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 16 : 7;
        const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      // Inner glow
      ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Trail
      ctx.globalAlpha = 0.3; ctx.fillStyle = p.color;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.arc(p.x - p.vx * i * 0.3, p.y, 10 - i * 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_life_steal_aura') {
      // Visible life-steal field around fighter
      const pulse = 0.5 + Math.sin(fighter.frame * 0.1) * 0.2;
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.4 * pulse; ctx.shadowColor = p.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, p.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.12 * pulse; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, p.r, 0, Math.PI * 2); ctx.fill();
      // Draining particles
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 6; i++) {
        const ang = (fighter.frame * 0.05 + i * Math.PI / 3) % (Math.PI * 2);
        const px = p.x + Math.cos(ang) * p.r * 0.8;
        const py = p.y - 30 + Math.sin(ang) * p.r * 0.8;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ── GEN 3 ──
    else if (p.type === 'gen_scatter_gust') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.6; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      for (let i = 0; i < 6; i++) {
        const sx = p.x + (Math.random() - 0.5) * 40;
        const sy = p.y + (Math.random() - 0.5) * 40;
        ctx.beginPath(); ctx.arc(sx, sy, 4 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_bone_spike') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
      ctx.fillStyle = p.color; ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 1;
      ctx.shadowColor = p.color; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(4, 0); ctx.lineTo(0, 15); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    else if (p.type === 'gen_mirror_pane') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.4; ctx.shadowColor = p.color; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 4); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - p.h / 2); ctx.lineTo(p.x, p.y + p.h / 2); ctx.stroke();
      if (p.redirectUsed) { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#FFCC00'; ctx.lineWidth = 3; ctx.strokeRect(p.x - p.w / 2 - 2, p.y - p.h / 2 - 2, p.w + 4, p.h + 4); }
    }
    else if (p.type === 'gen_glass_wall') {
      // Solid glass wall
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.5; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h, p.w, p.h, 4); ctx.fill();
      // Glass shine lines
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(p.x - p.w / 2 + 4, p.y - p.h * 0.8); ctx.lineTo(p.x + p.w / 2 - 4, p.y - p.h * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - p.w / 2 + 4, p.y - p.h * 0.4); ctx.lineTo(p.x + p.w / 2 - 4, p.y - p.h * 0.2); ctx.stroke();
      // Border
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.strokeRect(p.x - p.w / 2, p.y - p.h, p.w, p.h);
    }
    else if (p.type === 'gen_venom_spit') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#44AA22'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.4; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x - p.vx * 0.3, p.y + 3, 5, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.type === 'gen_thorn_vine') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.shadowColor = p.color; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - p.height); ctx.stroke();
      ctx.fillStyle = '#226622';
      for (let i = 0; i < 3; i++) {
        const ty = p.y - p.height * (0.25 + i * 0.25);
        const side = i % 2 === 0 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(p.x, ty); ctx.lineTo(p.x + side * 10, ty - 5); ctx.lineTo(p.x, ty - 4); ctx.fill();
      }
    }
    else if (p.type === 'gen_ash_flash') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.6; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      for (let i = 0; i < 5; i++) {
        const sx = p.x + (Math.random() - 0.5) * 50;
        const sy = p.y + (Math.random() - 0.5) * 50;
        ctx.beginPath(); ctx.arc(sx, sy, 5 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_mist_ambush') {
      // Mist cloud at fixed position
      const alpha = p.phase === 'form' ? 0.2 + (1 - p.phaseTimer / 20) * 0.3 : 0.4;
      ctx.fillStyle = p.color; ctx.globalAlpha = alpha; ctx.shadowColor = p.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(p.targetX, p.targetY - 30, 40, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath(); ctx.arc(p.targetX + (Math.random() - 0.5) * 60, p.targetY - 30 + (Math.random() - 0.5) * 40, 22, 0, Math.PI * 2); ctx.fill();
      }
      // Strike flash when active
      if (p.phase === 'active') {
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.3 + Math.sin(fighter.frame * 0.3) * 0.2;
        ctx.beginPath(); ctx.arc(p.targetX, p.targetY - 30, 50, 0, Math.PI * 2); ctx.stroke();
      }
    }
    else if (p.type === 'gen_cinder_snap') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 15; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
      for (let i = 1; i < 3; i++) {
        ctx.globalAlpha = 0.3 / i;
        ctx.beginPath(); ctx.arc(p.x - p.vx * i * 0.3, p.y, 8 - i * 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_extraction_tech') {
      // Tech device in fighter's hand
      const sx = p.x + p.facing * 18;
      const sy = p.y - 35;
      ctx.save(); ctx.translate(sx, sy);
      ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      // Device body
      ctx.fillStyle = '#334455'; ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-8, -6, 16, 12, 3); ctx.fill(); ctx.stroke();
      // Screen
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.7 + Math.sin(fighter.frame * 0.3) * 0.2;
      ctx.fillRect(-5, -4, 10, 6);
      ctx.globalAlpha = 1;
      // Antenna
      ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, -12); ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, -13, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ── GEN 4 ──
    else if (p.type === 'gen_barrier_drive') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.5; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 8); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(p.x - p.w / 2, p.y - p.h / 2 + i * p.h / 3); ctx.lineTo(p.x + p.w / 2, p.y - p.h / 2 + i * p.h / 3); ctx.stroke();
      }
    }
    else if (p.type === 'gen_solid_barrier') {
      // Solid climbable barrier
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.7; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h, p.w, p.h, 6); ctx.fill();
      // Energy panel lines
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.globalAlpha = 0.4;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(p.x - p.w / 2 + 3, p.y - p.h * (i / 4));
        ctx.lineTo(p.x + p.w / 2 - 3, p.y - p.h * (i / 4)); ctx.stroke();
      }
      // Top edge highlight
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(p.x - p.w / 2, p.y - p.h); ctx.lineTo(p.x + p.w / 2, p.y - p.h); ctx.stroke();
      // Border
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
      ctx.strokeRect(p.x - p.w / 2, p.y - p.h, p.w, p.h);
    }
    else if (p.type === 'gen_wind_carry') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      for (let i = 0; i < 4; i++) {
        const off = (i - 1.5) * 10;
        ctx.beginPath(); ctx.moveTo(p.x - 20, p.y + off);
        ctx.quadraticCurveTo(p.x + 10, p.y + off - 6, p.x + 35, p.y + off); ctx.stroke();
      }
    }
    else if (p.type === 'gen_shadow_shift') {
      const t = p.timer / p.maxTimer;
      // Trail markers
      if (p.trail) {
        p.trail.forEach(tr => {
          ctx.fillStyle = p.color; ctx.globalAlpha = tr.alpha * 0.5;
          ctx.beginPath(); ctx.ellipse(tr.x, tr.y, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
        });
      }
      // Entry shadow marker
      ctx.fillStyle = p.color; ctx.globalAlpha = t * 0.6;
      ctx.beginPath(); ctx.ellipse(p.fromX, p.fromY, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Exit shadow marker
      ctx.globalAlpha = (1 - t) * 0.6 + 0.3;
      ctx.beginPath(); ctx.ellipse(p.exitX, p.exitY, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Connection line
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = t * 0.3;
      ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(p.fromX, p.fromY); ctx.lineTo(p.exitX, p.exitY); ctx.stroke(); ctx.setLineDash([]);
    }
    else if (p.type === 'gen_fire_wave') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.7; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(p.x - p.facing * 30, p.y);
      ctx.quadraticCurveTo(p.x, p.y - p.waveH, p.x + p.facing * 30, p.y);
      ctx.lineTo(p.x + p.facing * 30, p.y + 5);
      ctx.lineTo(p.x - p.facing * 30, p.y + 5);
      ctx.fill();
      ctx.fillStyle = '#FFCC00'; ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(p.x + (i - 1) * 15, p.y - p.waveH * 0.5, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (p.type === 'gen_tremor_sense') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.5; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, p.r, p.r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.2; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, p.r, p.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.type === 'gen_resonance_scan') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.15; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.type === 'gen_resonance_beacon') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(p.x - 12, p.y - 20, 24, 20, 4); ctx.fill();
      ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 20); ctx.lineTo(p.x, p.y - 32); ctx.stroke();
      const pulseR = (300 - p.life) % 60;
      if (pulseR < 30) {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.4 * (1 - pulseR / 30);
        ctx.beginPath(); ctx.arc(p.x, p.y - 10, pulseR + 10, 0, Math.PI * 2); ctx.stroke();
      }
    }
    else if (p.type === 'gen_protect_wall') {
      // Protective wall from ground
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.8; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h, p.w, p.h, 4); ctx.fill();
      ctx.strokeStyle = '#665544'; ctx.lineWidth = 2;
      ctx.strokeRect(p.x - p.w / 2, p.y - p.h, p.w, p.h);
      // Cracks
      ctx.strokeStyle = '#554433'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(p.x - 6, p.y - p.h * 0.7); ctx.lineTo(p.x + 4, p.y - p.h * 0.3); ctx.stroke();
    }
    else if (p.type === 'gen_bomb') {
      if (!p.exploded) {
        // Bomb body
        ctx.fillStyle = '#334455'; ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Fuse spark
        const fuseFlick = p.fuse < 30 ? 1 + Math.sin(p.fuse * 0.5) * 0.3 : 1;
        ctx.fillStyle = '#FF6600'; ctx.shadowColor = '#FF6600'; ctx.shadowBlur = 10 * fuseFlick;
        ctx.beginPath(); ctx.arc(p.x, p.y - 18, 4 * fuseFlick, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFDD00'; ctx.beginPath(); ctx.arc(p.x, p.y - 18, 2 * fuseFlick, 0, Math.PI * 2); ctx.fill();
        // Blinking light when fuse is low
        if (p.fuse < 30 && Math.floor(p.fuse / 5) % 2 === 0) {
          ctx.fillStyle = '#FF0000'; ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Explosion
        ctx.globalAlpha = 1 - p.explosionR / p.maxExplosionR;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.explosionR);
        grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.3, '#FFCC00'); grad.addColorStop(0.6, p.color); grad.addColorStop(1, 'rgba(100,170,255,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, p.explosionR, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();
  });
}