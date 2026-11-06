// Kill FX — global animated effects played on every KO.
// Bought once in the shop (NOT per character). Toggleable in Settings.
// Each kill FX renders a unique canvas animation at the defeated fighter's position.

import { getEventKillFX, getEventById } from './events.js';
import { BATTLE_PASSES_2027, HOLIDAY_EVENTS_2027 } from './season2027.js';

export const KILL_FX = [
  { id: 'none', name: 'None', price: 0, desc: 'No kill effect.' },
  { id: 'shockwave', name: 'Shockwave', price: 120, desc: 'An explosive ring blasts outward on every KO.' },
  { id: 'lightning_strike', name: 'Lightning Strike', price: 200, desc: 'A bolt of lightning crashes down on the defeated.' },
  { id: 'firework_burst', name: 'Firework Burst', price: 250, desc: 'A colorful firework explosion celebrates the kill.' },
  { id: 'void_implosion', name: 'Void Implosion', price: 350, desc: 'The victim collapses into a dark singularity.' },
  { id: 'shatter', name: 'Crystal Shatter', price: 300, desc: 'The defeated fighter shatters into crystal shards.' },
  { id: 'golden_blast', name: 'Golden Blast', price: 400, desc: 'A radiant golden explosion with rays of light.' },
  { id: 'soul_release', name: 'Soul Release', price: 500, desc: 'A ghostly soul rises from the defeated as ethereal particles scatter.' },
  // ── 20 NEW KILL FX ──
  { id: 'black_hole', name: 'Black Hole', price: 450, desc: 'A dark vortex devours everything nearby.' },
  { id: 'ice_shatter', name: 'Ice Shatter', price: 300, desc: 'The victim freezes and shatters into frosty shards.' },
  { id: 'fire_storm', name: 'Fire Storm', price: 350, desc: 'Swirling flames erupt skyward.' },
  { id: 'confetti_burst', name: 'Confetti Burst', price: 200, desc: 'A festive confetti explosion of colored paper.' },
  { id: 'lightning_storm', name: 'Lightning Storm', price: 400, desc: 'A barrage of lightning bolts strike the victim.' },
  { id: 'poison_burst', name: 'Toxic Burst', price: 300, desc: 'A green toxic cloud bursts outward.' },
  { id: 'angel_ascend', name: 'Angel Ascend', price: 500, desc: 'Wings of light carry the soul heavenward.' },
  { id: 'demon_rift', name: 'Demon Rift', price: 450, desc: 'A fiery crack tears open beneath the victim.' },
  { id: 'star_collapse', name: 'Star Collapse', price: 400, desc: 'Stars implode into a brilliant point of light.' },
  { id: 'water_geyser', name: 'Water Geyser', price: 280, desc: 'A towering geyser erupts upward.' },
  { id: 'pixel_explosion', name: 'Pixel Explosion', price: 250, desc: 'The victim bursts into pixelated blocks.' },
  { id: 'rose_bloom', name: 'Rose Bloom', price: 320, desc: 'A storm of rose petals blooms outward.' },
  { id: 'thunder_clap', name: 'Thunder Clap', price: 350, desc: 'A deafening shockwave with crackling sparks.' },
  { id: 'glitch_dissolve', name: 'Glitch Dissolve', price: 280, desc: 'The victim dissolves into glitchy squares.' },
  { id: 'rainbow_nova', name: 'Rainbow Nova', price: 400, desc: 'Expanding rainbow rings radiate outward.' },
  { id: 'shadow_erupt', name: 'Shadow Erupt', price: 380, desc: 'Dark tendrils erupt from the defeated.' },
  { id: 'meteor_strike', name: 'Meteor Strike', price: 420, desc: 'A flaming meteor crashes down on the victim.' },
  { id: 'time_freeze', name: 'Time Freeze', price: 360, desc: 'A clock shatters as time freezes over the KO.' },
  { id: 'cosmic_burst', name: 'Cosmic Burst', price: 480, desc: 'A spiral galaxy bursts into being and fades.' },
  { id: 'cherry_blossom', name: 'Cherry Blossom', price: 260, desc: 'Gentle cherry blossom petals drift over the KO.' },
];

const SEASONAL_FX_COLORS = {
  'frost-found-2027':'#91DFFF','yokai-rising-2027':'#B874FF','petal-metal-2027':'#FF78B6',
  'six-oclock-2027':'#FFC451','out-of-this-element-2027':'#8E7AFF','sixth-eclipse-2027':'#F04F63',
  'new-year-2027':'#E8C66E','new-year-2028':'#E8C66E','love-at-first-fight':'#F080A5',
  'luck-of-the-sixth':'#54A66B','egg-stinction-event':'#F4C27E','elemental-prank':'#FF835A',
  'planet-of-the-elements':'#76A65B','trick-or-beatdown':'#B47CF1','living-chronicles':'#E58A43',
  'thanks-for-the-elements':'#D9A441','winter-wonderland':'#90DAFF',
};
const SEASONAL_FX_BASE = [
  'ice_shatter','void_implosion','firework_burst','golden_blast','star_collapse','black_hole',
  'confetti_burst','lightning_strike','soul_release','shatter','fire_storm','angel_ascend',
];
const HOLIDAY_FX_STYLES = Object.freeze({
  'midnight-fireworks': 'fireworks',
  'cupid-s-arrow': 'heart-arrow',
  'pot-of-gold': 'gold-coins',
  eggsplosion: 'egg-shells',
  'cartoon-bonk': 'bonk',
  'nature-bloom': 'bloom',
  'ghostly-vanish': 'ghost',
  'marigold-spirit': 'marigold',
  'golden-harvest': 'harvest',
  'frosty-burst': 'frost-burst',
  blizzard: 'blizzard',
});

function drawHolidayKillFX(ctx, x, y, style, progress, color, frame) {
  if (!style || progress >= 1) return false;
  const t = Math.max(0, progress);
  const fade = 1 - t;
  const pulse = 1 + Math.sin(frame * 0.24) * 0.04;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 * fade;
  const burst = (cx, cy, radius, rays, inner = 0.42) => {
    ctx.beginPath();
    for (let i = 0; i < rays; i++) {
      const a = i * Math.PI * 2 / rays;
      const r1 = radius * inner;
      const r2 = radius * (i % 2 ? 0.84 : 1);
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    }
    ctx.lineWidth = Math.max(1.5, radius * 0.035);
    ctx.stroke();
  };
  const petalFlower = (cx, cy, radius, count, rotation = 0) => {
    for (let i = 0; i < count; i++) {
      const a = rotation + i * Math.PI * 2 / count;
      const px = cx + Math.cos(a) * radius * 0.4;
      const py = cy + Math.sin(a) * radius * 0.4;
      ctx.beginPath();
      ctx.ellipse(px, py, radius * 0.19, radius * 0.36, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE8A3';
    ctx.fill();
  };
  const ring = (cx, cy, radius, width = 3) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const radius = (22 + t * 94) * pulse;

  if (style === 'fireworks') {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
      const cx = x + Math.cos(a) * t * 46;
      const cy = y + Math.sin(a) * t * 34;
      ctx.strokeStyle = i === 1 ? '#FFD778' : color;
      burst(cx, cy, radius * (0.68 + i * 0.08), 12, 0.16);
      ring(cx, cy, radius * 0.52, 1.5);
    }
  } else if (style === 'heart-arrow') {
    const rise = t * 42;
    ctx.strokeStyle = '#FFE4EB';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 52 + t * 35, y + 20 - rise); ctx.lineTo(x + 42 + t * 35, y - 20 - rise); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8 + t * 35, y - 35 - rise);
    ctx.bezierCurveTo(x - 18 + t * 35, y - 62 - rise, x - 42 + t * 35, y - 27 - rise, x + 8 + t * 35, y + 5 - rise);
    ctx.bezierCurveTo(x + 58 + t * 35, y - 28 - rise, x + 35 + t * 35, y - 62 - rise, x + 8 + t * 35, y - 35 - rise);
    ctx.fillStyle = color; ctx.fill();
    burst(x + 42 + t * 35, y - 20 - rise, 13, 4, 0.2);
  } else if (style === 'gold-coins') {
    ctx.strokeStyle = '#FFD778';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x, y + 12, radius * (0.78 + i * 0.13), Math.PI * 1.08, Math.PI * 1.92);
      ctx.lineWidth = 4 - i * 0.7;
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + i * Math.PI / 7;
      const cx = x + Math.cos(a) * radius * 0.8;
      const cy = y + 12 + Math.sin(a) * radius * 0.56 - t * 16;
      ctx.beginPath(); ctx.arc(cx, cy, 4 + (i % 3), 0, Math.PI * 2); ctx.fillStyle = i % 2 ? '#FFF0A6' : '#F8BE38'; ctx.fill();
    }
  } else if (style === 'egg-shells') {
    const pastel = ['#FFD5E4', '#FFF0A8', '#BCEFFF', '#C9F0C4'];
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10 + frame * 0.018;
      const distance = t * (48 + (i % 3) * 15);
      const cx = x + Math.cos(a) * distance;
      const cy = y + Math.sin(a) * distance - 10 * t;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + t);
      ctx.fillStyle = pastel[i % pastel.length];
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, -3); ctx.lineTo(3, 7); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    burst(x, y, radius * 0.62, 8, 0.24);
  } else if (style === 'bonk') {
    burst(x, y, radius, 12, 0.32);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + frame * 0.015;
      const cx = x + Math.cos(a) * radius * 0.62;
      const cy = y + Math.sin(a) * radius * 0.62;
      ctx.fillStyle = i % 2 ? '#FFF1A8' : '#FFFFFF';
      ctx.beginPath(); ctx.arc(cx, cy, 3 + fade * 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === 'bloom' || style === 'marigold') {
    const count = style === 'marigold' ? 12 : 8;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(frame * 0.012 + i * 0.4);
      ctx.globalAlpha *= 1 - i * 0.22;
      petalFlower(0, 0, radius * (0.58 + i * 0.19), count, i * 0.16);
      ctx.restore();
    }
    if (style === 'bloom') {
      ctx.strokeStyle = '#D8F2A8';
      ctx.beginPath(); ctx.moveTo(x, y + 34 * fade); ctx.quadraticCurveTo(x - 20, y + 6, x + 10, y - 22); ctx.stroke();
    }
  } else if (style === 'ghost') {
    ctx.strokeStyle = '#D8F7FF';
    ring(x, y - t * 28, radius, 3);
    ring(x, y - t * 28, radius * 0.62, 2);
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7 + frame * 0.02;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * radius * 0.75, y + Math.sin(a) * radius * 0.5, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === 'harvest') {
    for (let i = 0; i < 9; i++) {
      const a = i * Math.PI * 2 / 9 + frame * 0.015;
      const cx = x + Math.cos(a) * radius * 0.58;
      const cy = y + Math.sin(a) * radius * 0.5;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? '#FFD77A' : '#E6A744'; ctx.fill();
      ctx.strokeStyle = '#FFF1BA'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
      ctx.restore();
    }
    burst(x, y, radius * 0.52, 8, 0.3);
  } else if (style === 'frost-burst') {
    ctx.strokeStyle = '#E3FBFF';
    burst(x, y, radius, 8, 0.12);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + Math.PI / 6;
      const cx = x + Math.cos(a) * radius * 0.54;
      const cy = y + Math.sin(a) * radius * 0.54;
      ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke();
    }
  } else if (style === 'blizzard') {
    ctx.strokeStyle = '#E2FAFF';
    for (let i = 0; i < 5; i++) {
      const a = frame * 0.017 + i * Math.PI * 2 / 5;
      const cx = x + Math.cos(a) * radius * 0.56;
      const cy = y + Math.sin(a) * radius * 0.44;
      ring(cx, cy, 4 + fade * 3, 1.5);
    }
    ring(x, y, radius * 0.82, 2);
  } else return false;

  ctx.restore();
  return true;
}

const seasonalFxRewards = [...BATTLE_PASSES_2027, ...HOLIDAY_EVENTS_2027].flatMap(event => event.rewards
  .filter(reward => reward.type === 'ko')
  .map((reward, index) => ({ event, reward, index, holidayStyle: event.kind === 'holiday' ? HOLIDAY_FX_STYLES[reward.name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')] : null })));
KILL_FX.push(...seasonalFxRewards.filter(({ reward }) => !KILL_FX.some(fx => fx.id === reward.id)).map(({ event, reward, index }) => ({
  id: reward.id,
  name: reward.name,
  desc: `${event.kind === 'holiday' ? 'Holiday event' : 'Battle Pass'} reward from ${event.name}.`,
  price: 0,
  baseFxId: SEASONAL_FX_BASE[index % SEASONAL_FX_BASE.length],
  color: SEASONAL_FX_COLORS[event.id] || '#C69CFF',
  seasonal: true,
  eventId: event.id,
  holidayStyle: event.kind === 'holiday' ? HOLIDAY_FX_STYLES[reward.name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')] || null : null,
})));

// Price bump — all shop kill FX cost 50 more tokens
KILL_FX.forEach(k => { if (k.price > 0) k.price += 50; });
// Price overhaul — add a zero to every kill FX price
KILL_FX.forEach(k => { if (k.price > 0) k.price *= 10; });

export function getKillFX(id) {
  const fx = KILL_FX.find(k => k.id === id);
  if (fx) return fx;
  return getEventKillFX(id);
}

// Renders a kill FX animation at (x, y) with the given progress (0→1) and color.
// Returns true while the animation is still playing, false when done.
export function drawKillFX(ctx, x, y, fxId, progress, color, frame) {
  if (!fxId || fxId === 'none') return false;
  let isEventFx = false;
  let eventColor = color;
  const seasonalFx = getKillFX(fxId);
  if (seasonalFx?.seasonal) {
    eventColor = seasonalFx.color;
    if (seasonalFx.holidayStyle) return drawHolidayKillFX(ctx, x, y, seasonalFx.holidayStyle, progress, eventColor, frame || 0);
    fxId = seasonalFx.baseFxId;
  }
  if (fxId.startsWith('event_killfx_')) {
    const eventFx = getEventKillFX(fxId);
    if (eventFx) {
      isEventFx = true;
      const evt = getEventById(eventFx.eventId);
      if (evt) eventColor = evt.color;
      fxId = eventFx.baseFxId;
    }
  }
  if (seasonalFx?.seasonal) color = eventColor;
  const t = progress;
  if (t >= 1) return false;

  ctx.save();

  if (fxId === 'shockwave') {
    const r1 = t * 280, r2 = t * 200, r3 = t * 340;
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = color || '#FFFFFF'; ctx.lineWidth = 12 * (1 - t * 0.3);
    ctx.shadowColor = color || '#FFFFFF'; ctx.shadowBlur = 35;
    ctx.beginPath(); ctx.arc(x, y, r1, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 8 * (1 - t * 0.3); ctx.beginPath(); ctx.arc(x, y, r2, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 4 * (1 - t * 0.5); ctx.globalAlpha = (1 - t) * 0.5;
    ctx.beginPath(); ctx.arc(x, y, r3, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; const pr = t * 220; ctx.globalAlpha = 1 - t; ctx.fillStyle = color || '#FFF'; ctx.shadowColor = color || '#FFF'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x + Math.cos(a) * pr, y + Math.sin(a) * pr, 9 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill(); }
  } else if (fxId === 'lightning_strike') {
    ctx.globalAlpha = Math.max(0, 1 - t * 1.2); ctx.strokeStyle = '#FFFF44'; ctx.lineWidth = 10; ctx.shadowColor = '#FFFF44'; ctx.shadowBlur = 40;
    ctx.beginPath(); let cy = 0; ctx.moveTo(x, cy);
    while (cy < y) { cy += 20 + Math.random() * 25; ctx.lineTo(x + (Math.random() - 0.5) * 60, Math.min(cy, y)); }
    ctx.stroke();
    ctx.lineWidth = 5; ctx.globalAlpha = Math.max(0, (1 - t * 1.5) * 0.6);
    for (let b = 0; b < 3; b++) { const ox = (b - 1) * 40; ctx.beginPath(); ctx.moveTo(x + ox, 0); let cy2 = 0; while (cy2 < y) { cy2 += 15 + Math.random() * 20; ctx.lineTo(x + ox + (Math.random() - 0.5) * 50, Math.min(cy2, y)); } ctx.stroke(); }
    ctx.globalAlpha = Math.max(0, 0.7 - t); ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFF44'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(x, y, 90 * (1 - t), 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'firework_burst') {
    const colors = ['#FF4444', '#FFAA44', '#FFDD44', '#44FF44', '#44AAFF', '#AA44FF', '#FF44AA'];
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; const dist = t * 260; const fade = 1 - t; ctx.globalAlpha = fade; ctx.fillStyle = colors[i % colors.length]; ctx.shadowColor = colors[i % colors.length]; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 10 * fade, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ctx.globalAlpha = (1 - t) * 0.5; ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 4 * (1 - t); ctx.shadowColor = colors[i % colors.length]; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * t * 100, y + Math.sin(a) * t * 100); ctx.lineTo(x + Math.cos(a) * t * 260, y + Math.sin(a) * t * 260); ctx.stroke(); }
    ctx.globalAlpha = Math.max(0, 0.6 - t * 0.8); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 70 * (1 - t), 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'void_implosion') {
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + t * Math.PI * 3; const r = 180 * (1 - t); ctx.fillStyle = '#1a0033'; ctx.shadowColor = '#6600AA'; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 12 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = (1 - t) * 0.4; ctx.strokeStyle = '#6600AA'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 160 * (1 - t), 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = t < 0.5 ? t * 2 : (1 - t) * 2; ctx.fillStyle = '#000000'; ctx.shadowColor = '#440066'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(x, y, 50 * ctx.globalAlpha, 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'shatter') {
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; const dist = t * 240; const rot = t * Math.PI * 3 + i; ctx.globalAlpha = 1 - t; ctx.fillStyle = (color || '#AAEEFF'); ctx.shadowColor = (color || '#AAEEFF'); ctx.shadowBlur = 15; ctx.save(); ctx.translate(x + Math.cos(a) * dist, y + Math.sin(a) * dist); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(10, 0); ctx.lineTo(0, 16); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
  } else if (fxId === 'golden_blast') {
    ctx.globalAlpha = 1 - t; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 7; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 35;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const r1 = 30 + t * 80, r2 = 60 + t * 220; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); ctx.stroke(); }
    ctx.globalAlpha = (1 - t) * 0.4; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 200 * t, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = Math.max(0, 0.8 - t); ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(x, y, 80 * (1 - t * 0.4), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = Math.max(0, 0.5 - t); ctx.beginPath(); ctx.arc(x, y, 45 * (1 - t), 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'soul_release') {
    const soulY = y - t * 120; ctx.globalAlpha = 1 - t; ctx.fillStyle = 'rgba(200,220,255,0.7)'; ctx.shadowColor = '#88AAFF'; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(x, soulY, 24 * (1 - t * 0.2), 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 16, soulY); ctx.quadraticCurveTo(x, soulY + 40, x, soulY + 70); ctx.quadraticCurveTo(x + 16, soulY + 40, x + 16, soulY); ctx.fill();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + frame * 0.05; const r = 50 + t * 110; ctx.globalAlpha = (1 - t) * 0.7; ctx.fillStyle = '#AACCFF'; ctx.shadowColor = '#88AAFF'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 6 * (1 - t), 0, Math.PI * 2); ctx.fill(); }
  } else if (fxId === 'black_hole') {
    // Dark vortex spiraling inward + accretion ring
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 - t * Math.PI * 4; const r = 200 * (1 - t) + 20; ctx.fillStyle = '#220033'; ctx.shadowColor = '#8800CC'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 10 * (1 - t * 0.4), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 0.6 * (1 - t); ctx.strokeStyle = '#CC44FF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 160 * (1 - t), 50 * (1 - t), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = t < 0.6 ? t * 1.7 : (1 - t) * 2.5; ctx.fillStyle = '#000000'; ctx.shadowColor = '#6600AA'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(x, y, 55 * ctx.globalAlpha, 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'ice_shatter') {
    // Freeze flash + frost shards
    ctx.globalAlpha = Math.max(0, 0.7 - t); ctx.fillStyle = 'rgba(170,238,255,0.4)'; ctx.beginPath(); ctx.arc(x, y, 90 * (1 - t), 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const dist = t * 220; ctx.globalAlpha = 1 - t; ctx.fillStyle = '#AAEEFF'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.shadowColor = '#88CCFF'; ctx.shadowBlur = 12; ctx.save(); ctx.translate(x + Math.cos(a) * dist, y + Math.sin(a) * dist); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.globalAlpha = (1 - t) * 0.3; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 60 + t * 40, 0, Math.PI * 2); ctx.stroke();
  } else if (fxId === 'fire_storm') {
    // Swirling flames erupting upward
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 14; i++) { const a = i * 0.6 + frame * 0.05; const fx = x + Math.cos(a) * (40 + t * 120); const fy = y - t * 160 + Math.sin(a) * 30; const fh = 30 + t * 80; ctx.fillStyle = i % 2 === 0 ? '#FF4422' : '#FFAA22'; ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + 10, fy - fh / 2, fx, fy - fh); ctx.quadraticCurveTo(fx - 10, fy - fh / 2, fx, fy); ctx.fill(); }
    ctx.globalAlpha = Math.max(0, 0.6 - t); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 50 * (1 - t), 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'confetti_burst') {
    const colors = ['#FF4444', '#FFAA44', '#FFDD44', '#44FF44', '#44AAFF', '#AA44FF', '#FF44AA', '#44FFFF'];
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; const dist = t * 250; ctx.globalAlpha = 1 - t; ctx.fillStyle = colors[i % colors.length]; ctx.save(); ctx.translate(x + Math.cos(a) * dist, y + Math.sin(a) * dist + t * 60); ctx.rotate(a + t * 4); ctx.fillRect(-4, -6, 8, 12); ctx.restore(); }
  } else if (fxId === 'lightning_storm') {
    // Multiple bolts from all directions converging
    ctx.globalAlpha = Math.max(0, 1 - t * 1.3); ctx.strokeStyle = '#AAEEFF'; ctx.lineWidth = 6; ctx.shadowColor = '#66AAFF'; ctx.shadowBlur = 25;
    for (let b = 0; b < 6; b++) { const a = (b / 6) * Math.PI * 2; const sx = x + Math.cos(a) * 300, sy = y + Math.sin(a) * 300; ctx.beginPath(); ctx.moveTo(sx, sy); let cx = sx, cy = sy; for (let s = 0; s < 8; s++) { cx += (x - cx) * 0.2 + (Math.random() - 0.5) * 30; cy += (y - cy) * 0.2 + (Math.random() - 0.5) * 30; ctx.lineTo(cx, cy); } ctx.stroke(); }
    ctx.globalAlpha = Math.max(0, 0.7 - t); ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#66AAFF'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(x, y, 70 * (1 - t), 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'poison_burst') {
    // Green toxic cloud expanding
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + t * Math.PI; const r = t * 200 + Math.sin(i) * 20; ctx.fillStyle = i % 2 === 0 ? '#66CC44' : '#88DD66'; ctx.shadowColor = '#44AA22'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 18 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = (1 - t) * 0.4; ctx.strokeStyle = '#66CC44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 180 * t, 0, Math.PI * 2); ctx.stroke();
  } else if (fxId === 'angel_ascend') {
    // Wings of light + rising beam
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = 'rgba(255,255,220,0.5)'; ctx.shadowColor = '#FFEEDD'; ctx.shadowBlur = 25;
    const ay = y - t * 140;
    const flap = Math.sin(frame * 0.1) * 0.2;
    ctx.beginPath(); ctx.ellipse(ay ? x - 50 : x - 50, ay, 45, 70, 0.4 + flap, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 50, ay, 45, 70, -0.4 - flap, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, ay, 20 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,238,221,0.4)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ay); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.globalAlpha = (1 - t) * 0.5; ctx.fillStyle = '#FFEEDD'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * t * 120, ay + Math.sin(a) * t * 60, 4, 0, Math.PI * 2); ctx.fill(); }
  } else if (fxId === 'demon_rift') {
    // Fiery crack tearing open
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#FF3300'; ctx.lineWidth = 8; ctx.shadowColor = '#FF6600'; ctx.shadowBlur = 25;
    const w = t * 260;
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.3, y - 20); ctx.lineTo(x, y); ctx.lineTo(x + w * 0.3, y - 18); ctx.lineTo(x + w, y); ctx.lineTo(x + w * 0.4, y + 14); ctx.lineTo(x, y + 8); ctx.lineTo(x - w * 0.4, y + 12); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,80,0,0.5)'; ctx.fill();
    for (let i = 0; i < 10; i++) { const fx = x + (Math.random() - 0.5) * w * 1.5; const fh = 40 + Math.sin(frame * 0.2 + i) * 20; ctx.fillStyle = i % 2 === 0 ? '#FF4400' : '#FFAA22'; ctx.beginPath(); ctx.moveTo(fx, y); ctx.quadraticCurveTo(fx + 8, y - fh / 2, fx, y - fh); ctx.quadraticCurveTo(fx - 8, y - fh / 2, fx, y); ctx.fill(); }
  } else if (fxId === 'star_collapse') {
    // Stars spiraling inward then brilliant flash
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 14; i++) { const a = i * 0.5 - t * Math.PI * 3; const r = 200 * (1 - t); ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#88AAFF'; ctx.shadowBlur = 12; const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r; ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.beginPath(); for (let j = 0; j < 5; j++) { const aa = (j / 5) * Math.PI * 2 - Math.PI / 2; const rr = j % 2 === 0 ? 8 : 3; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = t < 0.5 ? t * 2 : (1 - t) * 2; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(x, y, 60 * ctx.globalAlpha, 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'water_geyser') {
    // Towering upward water burst
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = 'rgba(80,180,255,0.6)'; ctx.shadowColor = '#44AAFF'; ctx.shadowBlur = 18;
    const gh = t * 260;
    ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.quadraticCurveTo(x, y - gh / 2, x - 10, y - gh); ctx.quadraticCurveTo(x + 10, y - gh / 2, x + 30, y); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 14; i++) { const dx = (Math.random() - 0.5) * 50; const dy = -t * 220 + Math.random() * 40; ctx.fillStyle = '#88CCFF'; ctx.beginPath(); ctx.arc(x + dx, y + dy, 6 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill(); }
  } else if (fxId === 'pixel_explosion') {
    // Pixelated blocks flying out
    const colors = ['#FF4444', '#FFDD44', '#44FF44', '#4488FF', '#AA44FF'];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const dist = t * 230; ctx.globalAlpha = 1 - t; ctx.fillStyle = colors[i % colors.length]; ctx.save(); ctx.translate(x + Math.cos(a) * dist, y + Math.sin(a) * dist); ctx.rotate(t * 3 + i); ctx.fillRect(-6, -6, 12, 12); ctx.restore(); }
  } else if (fxId === 'rose_bloom') {
    // Rose petals burst + bloom
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const dist = t * 220; ctx.fillStyle = i % 2 === 0 ? '#CC2244' : '#FF6688'; ctx.save(); ctx.translate(x + Math.cos(a) * dist, y + Math.sin(a) * dist + t * 40); ctx.rotate(a + t * 3); ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = Math.max(0, 0.6 - t); ctx.fillStyle = '#CC2244'; ctx.shadowColor = '#FF4466'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(x, y, 50 * (1 - t), 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'thunder_clap') {
    // Big shockwave + crackling sparks
    ctx.globalAlpha = 1 - t; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10; ctx.shadowColor = '#FFEE88'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(x, y, t * 260, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, t * 180, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.strokeStyle = '#FFEE88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * t * 200, y + Math.sin(a) * t * 200); ctx.lineTo(x + Math.cos(a) * (t * 200 + 40), y + Math.sin(a) * (t * 200 + 40)); ctx.stroke(); }
  } else if (fxId === 'glitch_dissolve') {
    // Glitchy squares scattering
    const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0044', '#00FF44'];
    for (let i = 0; i < 20; i++) { const a = Math.random() * Math.PI * 2; const dist = t * 200 + Math.random() * 60; ctx.globalAlpha = 1 - t; ctx.fillStyle = colors[i % colors.length]; const sz = 6 + Math.random() * 10; ctx.fillRect(x + Math.cos(a) * dist - sz / 2, y + Math.sin(a) * dist - sz / 2, sz, sz); }
    ctx.globalAlpha = Math.max(0, 0.5 - t); ctx.fillStyle = '#FF00FF'; ctx.fillRect(x - 40, y - 40, 80 * (1 - t), 4); ctx.fillRect(x - 40, y + 36, 80 * (1 - t), 4);
  } else if (fxId === 'rainbow_nova') {
    // Expanding rainbow rings
    for (let i = 0; i < 6; i++) { const hue = (frame * 4 + i * 60) % 360; ctx.globalAlpha = (1 - t) * (1 - i * 0.1); ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`; ctx.lineWidth = 6 - i; ctx.shadowColor = `hsl(${hue}, 90%, 60%)`; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(x, y, t * (180 + i * 30), 0, Math.PI * 2); ctx.stroke(); }
  } else if (fxId === 'shadow_erupt') {
    // Dark tendrils erupting upward
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.3; const len = t * 200 + Math.sin(frame * 0.1 + i) * 20; ctx.strokeStyle = '#330055'; ctx.lineWidth = 6; ctx.shadowColor = '#6600AA'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (Math.random() - 0.5) * 40, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke(); }
    ctx.globalAlpha = t < 0.5 ? t * 2 : (1 - t) * 2; ctx.fillStyle = '#000000'; ctx.shadowColor = '#6600AA'; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(x, y, 40 * ctx.globalAlpha, 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'meteor_strike') {
    // Meteor crashing down with fiery trail
    ctx.globalAlpha = 1 - t;
    const my = y - (1 - t) * 300;
    ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 8; ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(x - 60, my - 200); ctx.lineTo(x, my); ctx.stroke();
    ctx.fillStyle = '#FF4400'; ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(x, my, 22 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFAA44'; ctx.beginPath(); ctx.arc(x, my, 12 * (1 - t * 0.3), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = (1 - t) * 0.5; ctx.fillStyle = 'rgba(255,120,0,0.4)'; ctx.beginPath(); ctx.arc(x, y, 100 * t, 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'time_freeze') {
    // Clock face shattering
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#AAEEFF'; ctx.lineWidth = 4; ctx.shadowColor = '#66CCFF'; ctx.shadowBlur = 20;
    const cr = 60 * (1 - t * 0.5);
    ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * cr, y + Math.sin(a) * cr); ctx.lineTo(x + Math.cos(a) * (cr - 8), y + Math.sin(a) * (cr - 8)); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - cr * 0.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cr * 0.4, y); ctx.stroke();
    // Shards flying out
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const dist = t * 200; ctx.fillStyle = '#AAEEFF'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 5 * (1 - t), 0, Math.PI * 2); ctx.fill(); }
  } else if (fxId === 'cosmic_burst') {
    // Spiral galaxy
    ctx.globalAlpha = 1 - t;
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 18; i++) { const a = i * 0.4 + arm * Math.PI + t * Math.PI * 2; const r = i * 12 * (1 - t * 0.3); ctx.fillStyle = arm === 0 ? '#FF66CC' : '#66AAFF'; ctx.shadowColor = '#AA44FF'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 5 * (1 - t), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = t < 0.5 ? t * 2 : (1 - t) * 2; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#AA44FF'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(x, y, 35 * ctx.globalAlpha, 0, Math.PI * 2); ctx.fill();
  } else if (fxId === 'cherry_blossom') {
    // Gentle drifting petals
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + frame * 0.02; const dist = t * 180; const drift = Math.sin(frame * 0.05 + i) * 20; ctx.globalAlpha = 1 - t; ctx.fillStyle = i % 2 === 0 ? '#FFCCEE' : '#FFAADD'; ctx.save(); ctx.translate(x + Math.cos(a) * dist + drift, y + Math.sin(a) * dist + t * 80); ctx.rotate(a + t * 2); ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  }

  // Event FX: unique event-themed burst on top of base effect
  if (isEventFx) {
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + t * Math.PI * 3;
      const r = t * 200 + Math.sin(frame * 0.1 + i) * 15;
      ctx.fillStyle = eventColor; ctx.shadowColor = eventColor; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 5 * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = (1 - t) * 0.5;
    ctx.strokeStyle = eventColor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, t * 250, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
  return true;
}
