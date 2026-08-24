// Projectile rendering — extracted from fighter.js for maintainability
import { drawWhip } from './whipRenderer.js';
import { drawGenProjectiles } from './genProjectileRenderer.js';

export function drawProjectiles(ctx, fighter) {
  if (!fighter.projectiles) return;
  fighter.projectiles.forEach(p => {
    if (!p || p.x == null) return;
    ctx.save();
    if (p.type === 'fireball') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFAA00'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'electric') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 30);
        ctx.stroke();
      }
    } else if (p.type === 'energy_ball') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FF4444'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'energy') {
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    } else if (p.type === 'stone_drop') {
      ctx.fillStyle = p.color; ctx.strokeStyle = '#554433'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 6); ctx.fill(); ctx.stroke();
    } else if (p.type === 'demon') {
      // Demon — horned, winged, swooping creature
      const s = p.size;
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.shadowColor = p.color; ctx.shadowBlur = 22;
      // Wings (flapping)
      const flap = Math.sin(p.wing) * 0.5;
      ctx.fillStyle = '#660011';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.2);
      ctx.quadraticCurveTo(-s * 1.4, -s * 0.5 - flap * s, -s * 1.6, s * 0.2);
      ctx.quadraticCurveTo(-s * 0.8, 0, 0, s * 0.1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.2);
      ctx.quadraticCurveTo(s * 1.4, -s * 0.5 - flap * s, s * 1.6, s * 0.2);
      ctx.quadraticCurveTo(s * 0.8, 0, 0, s * 0.1); ctx.fill();
      // Body
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      // Horns
      ctx.strokeStyle = '#220000'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.25, -s * 0.5); ctx.lineTo(-s * 0.45, -s * 0.95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.25, -s * 0.5); ctx.lineTo(s * 0.45, -s * 0.95); ctx.stroke();
      // Glowing eyes
      ctx.fillStyle = '#FFFF00'; ctx.shadowColor = '#FFFF00'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.1, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.1, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (p.type === 'hammer') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
      ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      // Handle
      ctx.strokeStyle = '#5C4033'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, 22); ctx.stroke();
      // Head
      ctx.fillStyle = p.color; ctx.strokeStyle = '#3A2A1A'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-22, -32, 44, 22, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#D4C0A0'; ctx.beginPath(); ctx.arc(0, -21, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (p.type === 'potion') {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      // Conical flask
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.moveTo(-4, -18); ctx.lineTo(4, -18); ctx.lineTo(16, 14); ctx.lineTo(-16, 14); ctx.closePath(); ctx.fill();
      // Neck
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(-5, -26, 10, 10);
      // Cork
      ctx.fillStyle = '#884422'; ctx.fillRect(-6, -30, 12, 6);
      // Bubble shine
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(-5, 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (p.type === 'whip') {
      drawWhip(ctx, p);
    } else if (p.type === 'lightning_bolt') {
      if (p.warning > 0) {
        // Warning circle on the ground — telegraph so it's dodgeable
        const flash = 0.35 + Math.sin(p.warning * 0.45) * 0.35;
        ctx.strokeStyle = `rgba(255,255,68,${flash})`;
        ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY, 42, 13, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(255,255,100,${flash * 0.35})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.targetX, 0); ctx.lineTo(p.targetX, p.targetY); ctx.stroke();
      } else {
        // Lightning bolt visual — jagged bolt from top to target
        ctx.strokeStyle = '#FFFF44'; ctx.lineWidth = 7;
        ctx.shadowColor = '#FFFF44'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.moveTo(p.targetX, 0);
        let y = 0;
        while (y < p.targetY) {
          y += 28;
          ctx.lineTo(p.targetX + (Math.random() - 0.5) * 22, y);
        }
        ctx.stroke();
        // Impact flash on the ground
        ctx.fillStyle = 'rgba(255,255,100,0.35)';
        ctx.beginPath(); ctx.ellipse(p.targetX, p.targetY, 45, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (p.type === 'beam') {
      // Crimson beam with white accent core, firing straight forward
      const len = 240;
      const bx = p.facing > 0 ? p.x - len : p.x;
      const pulse = 0.7 + Math.sin(p.life * 0.5) * 0.3;
      ctx.shadowColor = p.color; ctx.shadowBlur = 22;
      ctx.fillStyle = p.color; ctx.globalAlpha = pulse;
      ctx.beginPath(); ctx.roundRect(bx, p.y - 11, len, 22, 8); ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      // White accent core
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.roundRect(bx, p.y - 4, len, 8, 4); ctx.fill();
      // Leading edge glow
      ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.type === 'spawn_platform') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.5; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 6); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF'; ctx.globalAlpha = 0.4; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 6); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (p.type === 'iron_wall') {
      ctx.fillStyle = p.color; ctx.strokeStyle = '#444444'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#666677'; ctx.lineWidth = 1;
      for (let ry = p.y + 12; ry < p.y + p.h - 4; ry += 14) { ctx.beginPath(); ctx.moveTo(p.x + 2, ry); ctx.lineTo(p.x + p.w - 2, ry); ctx.stroke(); }
    } else if (p.type === 'stage_slice') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.facing * 0.3);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 14; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(-50, -40); ctx.lineTo(50, 0); ctx.lineTo(-50, 40); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    } else if (p.type === 'sonar_pulse') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.globalAlpha = Math.max(0.1, p.life / 50);
      ctx.shadowColor = p.color; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    } else if (p.type === 'glue') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(p.target.x, p.target.y - 30, 30, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#DDAADD';
      for (let i = 0; i < 5; i++) { const a = p.life * 0.1 + i; ctx.beginPath(); ctx.arc(p.target.x + Math.cos(a) * 22, p.target.y - 30 + Math.sin(a) * 18, 4, 0, Math.PI * 2); ctx.fill(); }
    } else if (p.type === 'vines') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + p.life * 0.05; ctx.beginPath(); ctx.moveTo(p.target.x, p.target.y - 50); ctx.quadraticCurveTo(p.target.x + Math.cos(a) * 30, p.target.y - 30, p.target.x + Math.cos(a) * 20, p.target.y - 10); ctx.stroke(); }
      ctx.fillStyle = '#66BB44'; ctx.beginPath(); ctx.arc(p.target.x, p.target.y - 50, 8, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'ice_block') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.7; ctx.shadowColor = '#AAEEFF'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(p.target.x - 24, p.target.y - 70, 48, 70, 6); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(p.target.x - 24, p.target.y - 70, 48, 70, 6); ctx.stroke();
    } else if (p.type === 'bubble') {
      if (!p.ringOnly) { ctx.fillStyle = p.color; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.target.x, p.target.y - 35, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = p.color; ctx.lineWidth = p.ringOnly ? 5 : 3; ctx.shadowColor = p.color; ctx.shadowBlur = p.ringOnly ? 16 : 0; ctx.beginPath(); ctx.arc(p.target.x, p.target.y - 35, 34, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      if (!p.ringOnly) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(p.target.x - 10, p.target.y - 45, 6, 0, Math.PI * 2); ctx.fill(); }
    } else if (p.type === 'marionette') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const tx = p.target.x + (i - 1.5) * 10; ctx.beginPath(); ctx.moveTo(p.target.x, p.target.y - 90); ctx.lineTo(tx, p.target.y - 30 + i * 12); ctx.stroke(); }
    } else if (p.type === 'shadow_drain') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(p.target.x, p.target.y - 30, 28, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = p.life * 0.2 + i; ctx.beginPath(); ctx.moveTo(p.target.x + Math.cos(a) * 28, p.target.y - 30 + Math.sin(a) * 28); ctx.lineTo(p.target.x + Math.cos(a) * 14, p.target.y - 30 + Math.sin(a) * 14); ctx.stroke(); }
    } else if (p.type === 'poison_cloud') {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.4;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + p.life * 0.1; ctx.beginPath(); ctx.arc(p.target.x + Math.cos(a) * 22, p.target.y - 30 + Math.sin(a) * 14, 16, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    } else if (p.type === 'mimic_aura') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(p.target.x, p.target.y - 30, 32 + Math.sin(p.life * 0.2) * 6, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    } else if (p.type === 'elementor_runner') {
      // Small running stick-figure hollow with random color
      ctx.save(); ctx.translate(p.x, p.y - 30);
      ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const legSwing = Math.sin(p.runFrame) * 8;
      // Head
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, -18, 6, 0, Math.PI * 2); ctx.fill();
      // Body
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 5); ctx.stroke();
      // Arms (swinging)
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-legSwing * 0.7, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(legSwing * 0.7, -2); ctx.stroke();
      // Legs (running)
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-legSwing, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(legSwing, 15); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });
  // Render Gen 1-4 unique power projectiles
  drawGenProjectiles(ctx, fighter);
}