// Professional renderer — Brawlhalla quality

import { drawCharAttack, drawCharSuper, drawCharPowerAura } from './charAttackAnims.js';
import { drawStageBackground } from './stageBackgrounds.js';
import { getMaterial } from './materials.js';
import { getEmotePoseVars } from './emotePose.js';

// ─── STAGE MAPS ─────────────────────────────────────────────────────────────
export const STAGE_MAPS = [
  { id: 'splitcity',    name: 'Split City',         skyTop: '#0a0a2e', skyBot: '#1a1250', groundColor: '#2a3a6a', accentColor: '#4466FF' },
  { id: 'basic',        name: 'Basic',              skyTop: '#0a0a2e', skyBot: '#1a1250', groundColor: '#2a3a6a', accentColor: '#4466FF' },
  { id: 'silvermansion', name: "Silver's Mansion",  skyTop: '#0d0d1a', skyBot: '#1a1a2a', groundColor: '#3a3a4a', accentColor: '#C0C0C0' },
  { id: 'controllerforest', name: 'Controller Forest', skyTop: '#020d05', skyBot: '#05200a', groundColor: '#1a3a1a', accentColor: '#0A0A2A' },
  { id: 'traininggrounds', name: 'Training Grounds',  skyTop: '#1a1200', skyBot: '#2a2000', groundColor: '#4a3a1a', accentColor: '#FFD700' },
  { id: 'voidplane',    name: 'The Void',           skyTop: '#050005', skyBot: '#110011', groundColor: '#1a001a', accentColor: '#7700AA' },
  // ── 30 NEW STAGES ──
  { id: 'neonspire',    name: 'Neon Spire',         skyTop: '#0a0020', skyBot: '#1a0040', groundColor: '#2a0a50', accentColor: '#FF00FF' },
  { id: 'sunsetridge',  name: 'Sunset Ridge',       skyTop: '#2a0a30', skyBot: '#FF4466', groundColor: '#AA3344', accentColor: '#FFAA44' },
  { id: 'frozenlake',   name: 'Frozen Lake',        skyTop: '#0a1a3a', skyBot: '#3366AA', groundColor: '#5588CC', accentColor: '#88DDFF' },
  { id: 'lavafalls',    name: 'Lava Falls',          skyTop: '#1a0500', skyBot: '#440011', groundColor: '#661100', accentColor: '#FF5500' },
  { id: 'crystalcavern', name: 'Crystal Cavern',    skyTop: '#0a0a25', skyBot: '#220055', groundColor: '#330066', accentColor: '#AA44FF' },
  { id: 'skysanctuary', name: 'Sky Sanctuary',       skyTop: '#001133', skyBot: '#3366CC', groundColor: '#4488DD', accentColor: '#AAEEFF' },
  { id: 'underworld',   name: 'Underworld Gate',    skyTop: '#0a0005', skyBot: '#220011', groundColor: '#330022', accentColor: '#FF2266' },
  { id: 'auroraborealis', name: 'Aurora Borealis',  skyTop: '#000510', skyBot: '#003322', groundColor: '#114433', accentColor: '#44FFAA' },
  { id: 'goldentemple', name: 'Golden Temple',      skyTop: '#2a1a00', skyBot: '#554400', groundColor: '#665500', accentColor: '#FFDD44' },
  { id: 'stormpeak',    name: 'Storm Peak',          skyTop: '#0a0a15', skyBot: '#222244', groundColor: '#333355', accentColor: '#FFFF44' },
  { id: 'toxicmarsh',   name: 'Toxic Marsh',        skyTop: '#0a2000', skyBot: '#114400', groundColor: '#225511', accentColor: '#88FF44' },
  { id: 'cosmicvoid',   name: 'Cosmic Void',         skyTop: '#000005', skyBot: '#100020', groundColor: '#200040', accentColor: '#7744FF' },
  { id: 'emberforge',   name: 'Ember Forge',         skyTop: '#1a0500', skyBot: '#330800', groundColor: '#441100', accentColor: '#FF6600' },
  { id: 'tidalreef',    name: 'Tidal Reef',          skyTop: '#001530', skyBot: '#004466', groundColor: '#006688', accentColor: '#44CCFF' },
  { id: 'shadowrealm',  name: 'Shadow Realm',       skyTop: '#050008', skyBot: '#150020', groundColor: '#250030', accentColor: '#9944CC' },
  { id: 'dawnbreak',    name: 'Dawn Break',          skyTop: '#1a1040', skyBot: '#FF8866', groundColor: '#CC6655', accentColor: '#FFCC88' },
  { id: 'midnighttower', name: 'Midnight Tower',    skyTop: '#000010', skyBot: '#000033', groundColor: '#111144', accentColor: '#4466FF' },
  { id: 'junglecanopy', name: 'Jungle Canopy',       skyTop: '#0a2000', skyBot: '#1a4000', groundColor: '#225500', accentColor: '#66DD44' },
  { id: 'desertoasis',  name: 'Desert Oasis',        skyTop: '#2a1a00', skyBot: '#CCAA44', groundColor: '#DDCC66', accentColor: '#FFEE88' },
  { id: 'icepalace',    name: 'Ice Palace',          skyTop: '#0a0a30', skyBot: '#2255AA', groundColor: '#3377CC', accentColor: '#AAEEFF' },
  { id: 'volcanocrater', name: 'Volcano Crater',     skyTop: '#1a0500', skyBot: '#FF3300', groundColor: '#661100', accentColor: '#FFAA22' },
  { id: 'starlightmeadow', name: 'Starlight Meadow', skyTop: '#0a0a25', skyBot: '#1a2a55', groundColor: '#2a3a66', accentColor: '#FFDD88' },
  { id: 'thunderdome',  name: 'Thunderdome',         skyTop: '#0a0a15', skyBot: '#222233', groundColor: '#333344', accentColor: '#FFFF66' },
  { id: 'rainbowbridge', name: 'Rainbow Bridge',     skyTop: '#1a0a30', skyBot: '#330055', groundColor: '#440066', accentColor: '#FF66FF' },
  { id: 'coralreef',    name: 'Coral Reef',          skyTop: '#001525', skyBot: '#005577', groundColor: '#007799', accentColor: '#FF77AA' },
  { id: 'obsidianfield', name: 'Obsidian Field',     skyTop: '#050008', skyBot: '#1a0020', groundColor: '#2a0030', accentColor: '#AA44FF' },
  { id: 'solflare',     name: 'Solar Flare',         skyTop: '#2a1500', skyBot: '#FF6600', groundColor: '#CC4400', accentColor: '#FFDD00' },
  { id: 'mintgardens',  name: 'Mint Gardens',        skyTop: '#0a2a15', skyBot: '#1a5533', groundColor: '#226644', accentColor: '#66FFAA' },
  { id: 'cobaltmines',  name: 'Cobalt Mines',        skyTop: '#000a20', skyBot: '#002255', groundColor: '#003377', accentColor: '#4499FF' },
  { id: 'crimsonarena', name: 'Crimson Arena',       skyTop: '#1a0005', skyBot: '#440011', groundColor: '#661122', accentColor: '#FF3344' },
  { id: 'phoenixroost', name: 'Phoenix Roost',       skyTop: '#2a0a00', skyBot: '#FF4400', groundColor: '#AA3300', accentColor: '#FFAA44' },
  { id: 'nebulareach',  name: 'Nebula Reach',         skyTop: '#050010', skyBot: '#200040', groundColor: '#330055', accentColor: '#7744FF' },
  { id: 'emeraldcove',  name: 'Emerald Cove',         skyTop: '#0a2a15', skyBot: '#115533', groundColor: '#226644', accentColor: '#33FF88' },
  // ── 4 LARGE MAPS (for 4+ player custom battles) ──
  { id: 'grandarena',      name: 'Grand Arena',         skyTop: '#0a0a1e', skyBot: '#1a1a3e', groundColor: '#2a2a5a', accentColor: '#FFD700' },
  { id: 'skycitadel',      name: 'Sky Citadel',         skyTop: '#001530', skyBot: '#3366BB', groundColor: '#4488CC', accentColor: '#AAEEFF' },
  { id: 'colossalcoliseum', name: 'Colossal Coliseum', skyTop: '#1a0005', skyBot: '#660022', groundColor: '#881133', accentColor: '#FFAA44' },
  { id: 'infiniteexpanse',  name: 'Infinite Expanse',   skyTop: '#000510', skyBot: '#100030', groundColor: '#200050', accentColor: '#8844FF' },
  { id: 'opalcave',         name: 'Opal Cave',          skyTop: '#1a0a2a', skyBot: '#2a1a4a', groundColor: '#3a2a5a', accentColor: '#77ddbb' },
  // ── 20 NEW STAGES: Gen 1 heroes, Gen 5 heroes, lore locations ──
  { id: 'g1_thunder_peak',  name: "Thunder's Peak",     skyTop: '#1a1a00', skyBot: '#3a3a10', groundColor: '#4a4a20', accentColor: '#FFD700' },
  { id: 'g1_inferno_realm', name: 'Inferno Realm',      skyTop: '#1a0500', skyBot: '#440a00', groundColor: '#661500', accentColor: '#FF6600' },
  { id: 'g1_ocean_depth',   name: 'Ocean Depths',       skyTop: '#001030', skyBot: '#003366', groundColor: '#004488', accentColor: '#00CCFF' },
  { id: 'g1_verdant_grove', name: 'Verdant Grove',      skyTop: '#0a2005', skyBot: '#1a4008', groundColor: '#225500', accentColor: '#88DD44' },
  { id: 'g1_glacier_realm', name: 'Glacier Realm',      skyTop: '#0a1a3a', skyBot: '#2255AA', groundColor: '#3377CC', accentColor: '#AAEEFF' },
  { id: 'g5_golden_arena', name: 'Golden Arena',        skyTop: '#1a1505', skyBot: '#3a3010', groundColor: '#4a4015', accentColor: '#FFD700' },
  { id: 'g5_tidal_sanctum', name: 'Tidal Sanctum',      skyTop: '#001530', skyBot: '#004466', groundColor: '#006688', accentColor: '#4488FF' },
  { id: 'g5_shadow_dojo',   name: 'Shadow Dojo',        skyTop: '#05000a', skyBot: '#15001a', groundColor: '#250030', accentColor: '#9944CC' },
  { id: 'g5_portal_nexus',  name: 'Portal Nexus',       skyTop: '#1a0a00', skyBot: '#3a2000', groundColor: '#4a3010', accentColor: '#FF8800' },
  { id: 'g5_mountain_keep', name: 'Mountain Keep',      skyTop: '#0a1a08', skyBot: '#1a2a10', groundColor: '#2a3a15', accentColor: '#44AA44' },
  { id: 'g5_mind_palace',   name: 'Mind Palace',        skyTop: '#1a0a1a', skyBot: '#3a1a3a', groundColor: '#4a2a4a', accentColor: '#FF66AA' },
  { id: 'dawn_battleground', name: 'Dawn Battleground',  skyTop: '#1a1005', skyBot: '#3a2a10', groundColor: '#4a3a15', accentColor: '#FFDD44' },
  { id: 'shogun_castle',    name: "Shogun's Castle",     skyTop: '#1a0a05', skyBot: '#3a1a10', groundColor: '#4a2a15', accentColor: '#AA3322' },
  { id: 'iron_forge_town',  name: 'Iron Forge Town',     skyTop: '#0a0a10', skyBot: '#1a1a20', groundColor: '#2a2a30', accentColor: '#888888' },
  { id: 'rift_valley',      name: 'Rift Valley',         skyTop: '#05000a', skyBot: '#1a0030', groundColor: '#250040', accentColor: '#AA44FF' },
  { id: 'blood_arena',      name: 'Blood Arena',         skyTop: '#1a0005', skyBot: '#330011', groundColor: '#440022', accentColor: '#CC0033' },
  { id: 'resonance_lab',    name: 'Resonance Lab',       skyTop: '#050a15', skyBot: '#0a1525', groundColor: '#152035', accentColor: '#4499FF' },
  { id: 'harvest_stronghold', name: 'Harvest Stronghold', skyTop: '#0a0005', skyBot: '#220011', groundColor: '#330022', accentColor: '#8B0000' },
  { id: 'crystal_library',  name: 'Crystal Library',    skyTop: '#050518', skyBot: '#151530', groundColor: '#252545', accentColor: '#7788CC' },
  { id: 'element6_source',  name: 'Element 6 Source',   skyTop: '#050510', skyBot: '#101030', groundColor: '#202040', accentColor: '#FFFFFF' },
];

// ─── Character rendering ────────────────────────────────────────────────────

export function drawStickman(ctx, x, y, color, facing, frame, scale = 1, isSpirit = false, state = 'idle', charData = null, powerActive = null, noWeapon = false, powerAuraColor = null, emote = null) {
  // Growth power = visually larger; shrink powers = visually smaller
  if (powerActive === 'range_boost') scale *= 1.35;
  const s = 36 * scale; // BIGGER characters
  ctx.save();
  ctx.translate(x, y);

  if (isSpirit) {
    drawSpirit(ctx, s, frame, color, charData);
  } else {
    drawBrawlhalla(ctx, s, frame, color, state, facing, charData, powerActive, noWeapon, emote);
  }

  if (powerActive) {
    drawPowerAura(ctx, s, frame, powerAuraColor || color, powerActive, charData);
  }

  ctx.restore();
}

function drawPowerAura(ctx, s, frame, color, powerActive, charData) {
  ctx.save();
  // Gen 1-4: per-character power-button aura (themed to the character's `pb` config)
  if (charData && charData.id && drawCharPowerAura(ctx, s, frame, color, charData.id)) {
    ctx.restore();
    return;
  }
  switch (powerActive) {
    case 'stat_boost':
      ctx.globalAlpha = 0.25 + Math.sin(frame * 0.15) * 0.12;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowColor = color; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.85 + Math.sin(frame * 0.1) * 4, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) { const ang = (i/6)*Math.PI*2 + frame*0.06; ctx.globalAlpha = 0.3; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Math.cos(ang)*s*0.5, -s*0.8+Math.sin(ang)*s*0.5); ctx.lineTo(Math.cos(ang)*s*1.3, -s*0.8+Math.sin(ang)*s*1.3); ctx.stroke(); }
      break;
    case 'invincible':
      ctx.globalAlpha = 0.2; for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.12 - i * 0.03; ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(-i*6, -s*0.8, s*0.35, s*0.55, 0, 0, Math.PI*2); ctx.fill(); }
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(0, -s*0.8, s*0.9, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      break;
    case 'shield':
      ctx.globalAlpha = 0.25 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.95, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) { const ang = (i/8)*Math.PI*2; ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.moveTo(Math.cos(ang)*s*0.9, -s*0.8+Math.sin(ang)*s*0.9); ctx.lineTo(Math.cos(ang)*s*0.7, -s*0.8+Math.sin(ang)*s*0.7); ctx.stroke(); }
      break;
    case 'flight':
      for (let i = 0; i < 6; i++) { ctx.globalAlpha = (0.4 - i * 0.05) * (0.5 + Math.sin(frame * 0.2 + i) * 0.3); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15 + i * 6, -s * 0.3); ctx.quadraticCurveTo(-20 + i * 6, -s * 0.5, -25 + i * 6, -s * 0.8); ctx.stroke(); }
      break;
    case 'dot':
      for (let i = 0; i < 8; i++) { ctx.globalAlpha = 0.15 + Math.sin(frame * 0.1 + i) * 0.08; ctx.fillStyle = '#440044'; ctx.beginPath(); ctx.arc(Math.sin(frame * 0.05 + i) * 18, -s * 0.4 - i * 6, 3 + i * 0.5, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'slow':
      // Blue gets a water bubble around them
      if (charData?.id === 'blue') {
        ctx.globalAlpha = 0.25 + Math.sin(frame * 0.1) * 0.08;
        ctx.strokeStyle = '#4488FF'; ctx.lineWidth = 3; ctx.shadowColor = '#4488FF'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.95 + Math.sin(frame * 0.08) * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(68,136,255,0.12)'; ctx.fill();
      }
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#88CCFF'; ctx.lineWidth = 1;
      for (let r = 0; r < 3; r++) { ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * (0.6 + r * 0.25) + Math.sin(frame * 0.1 + r) * 3, 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]);
      break;
    case 'spawn_clone':
      // Draw a faded clone standing nearby with Amber nametag
      ctx.save();
      ctx.translate(-50, 0);
      ctx.globalAlpha = 0.35 + Math.sin(frame * 0.08) * 0.1;
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(0, -s * 1.7, s * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-s * 0.26, -s * 1.35, s * 0.52, s * 0.72, 5); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.shadowBlur = 3;
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(charData?.name || 'Amber', 0, -s * 2.1);
      ctx.restore();
      break;
    case 'range_boost':
      ctx.globalAlpha = 0.15 + Math.sin(frame * 0.1) * 0.08; ctx.strokeStyle = color; ctx.lineWidth = 2;
      for (let r = 0; r < 2; r++) { ctx.beginPath(); ctx.arc(0, -s * 0.8, s * (0.9 + r * 0.15) + Math.sin(frame * 0.08 + r) * 4, 0, Math.PI * 2); ctx.stroke(); }
      break;
    case 'charge_attack':
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.3) * 0.2; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 22;
      for (let i = 0; i < 8; i++) { const ang = (i/8)*Math.PI*2 + frame*0.12; ctx.beginPath(); ctx.arc(Math.cos(ang)*s*0.6, -s*0.8+Math.sin(ang)*s*0.6, 3, 0, Math.PI*2); ctx.fill(); }
      break;
    case 'homing':
      ctx.globalAlpha = 0.3; ctx.strokeStyle = '#FF4444'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.7 + Math.sin(frame * 0.2) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.8); ctx.lineTo(-s * 0.5, -s * 0.8); ctx.moveTo(s * 0.5, -s * 0.8); ctx.lineTo(s * 0.8, -s * 0.8); ctx.stroke();
      break;
    case 'freeze':
      ctx.globalAlpha = 0.15; ctx.fillStyle = '#AAEEFF'; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.8, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.2; ctx.strokeStyle = '#AAEEFF'; ctx.beginPath(); ctx.moveTo(Math.cos(i*Math.PI/2)*s*0.3, -s*0.8+Math.sin(i*Math.PI/2)*s*0.3); ctx.lineTo(Math.cos(i*Math.PI/2)*s*0.8, -s*0.8+Math.sin(i*Math.PI/2)*s*0.8); ctx.stroke(); }
      break;
    case 'infinite_jumps':
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = (0.5 - i * 0.08) * (0.6 + Math.sin(frame * 0.2 + i) * 0.3); ctx.strokeStyle = '#88EEFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.3 + i * s * 0.15, -s * 0.2 - i * s * 0.15); ctx.lineTo(-s * 0.3 + i * s * 0.15, -s * 1.0 - i * s * 0.15); ctx.stroke(); const ay = -s * 0.2 - i * s * 0.15; ctx.beginPath(); ctx.moveTo(-s * 0.3 + i * s * 0.15 - 4, ay + 5); ctx.lineTo(-s * 0.3 + i * s * 0.15, ay); ctx.lineTo(-s * 0.3 + i * s * 0.15 + 4, ay + 5); ctx.stroke(); }
      break;
    case 'heal':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.15) * 0.12; ctx.strokeStyle = '#44FF66'; ctx.lineWidth = 2.5; ctx.shadowColor = '#44FF66'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) { const y = -s * 0.2 - ((frame * 0.5 + i * s * 0.3) % (s * 1.5)); ctx.globalAlpha = 0.4; ctx.fillStyle = '#44FF66'; ctx.beginPath(); ctx.arc(Math.sin(frame * 0.05 + i) * s * 0.4, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#44FF66'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, -s * 1.1); ctx.lineTo(3, -s * 1.1); ctx.moveTo(0, -s * 1.1 - 3); ctx.lineTo(0, -s * 1.1 + 3); ctx.stroke();
      break;
    case 'lightning_strike':
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.4) * 0.2; ctx.strokeStyle = '#FFFF44'; ctx.lineWidth = 2; ctx.shadowColor = '#FFFF44'; ctx.shadowBlur = 20;
      for (let i = 0; i < 4; i++) { const x = (i - 1.5) * s * 0.3; ctx.beginPath(); ctx.moveTo(x, -s * 1.4); for (let j = 0; j < 4; j++) { ctx.lineTo(x + Math.sin(frame * 0.2 + j + i) * 6, -s * 1.4 + j * s * 0.3); } ctx.stroke(); }
      break;
    case 'beam':
      ctx.globalAlpha = 0.5 + Math.sin(frame * 0.3) * 0.2; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.8, 5 + Math.sin(frame * 0.2) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.ellipse(s * 0.5, -s * 0.8, s * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'reverse':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = '#AA44FF'; ctx.lineWidth = 2; ctx.shadowColor = '#AA44FF'; ctx.shadowBlur = 12;
      for (let r = 0; r < 2; r++) { ctx.beginPath(); for (let a = 0; a < Math.PI * 1.5; a += 0.1) { const rad = s * (0.5 + r * 0.2) + Math.sin(a * 3 + frame * 0.08) * 3; const x = Math.cos(a + frame * 0.04 + r) * rad; const y = -s * 0.8 + Math.sin(a + frame * 0.04 + r) * rad; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      break;
    case 'dash_slash':
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.3) * 0.2; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 15;
      for (let i = 0; i < 4; i++) { const off = (frame * 4 + i * s * 0.3) % (s * 1.5); ctx.globalAlpha = 0.5 - i * 0.1; ctx.beginPath(); ctx.moveTo(-s * 0.8 + off, -s * 0.8); ctx.lineTo(-s * 0.5 + off, -s * 0.8); ctx.stroke(); }
      break;
    case 'earth_drop':
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#886633'; ctx.shadowColor = '#886633'; ctx.shadowBlur = 8;
      for (let i = 0; i < 5; i++) { const x = (i - 2) * s * 0.25; const y = -s * 1.5 - ((frame * 0.3 + i * s * 0.4) % (s * 1.2)); ctx.beginPath(); ctx.arc(x, y, 4 + i % 2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'homing_projectile':
      ctx.globalAlpha = 0.4; ctx.strokeStyle = '#FF3333'; ctx.lineWidth = 1.5; ctx.shadowColor = '#FF3333'; ctx.shadowBlur = 10;
      const hr = s * 0.7 + Math.sin(frame * 0.15) * 3; ctx.beginPath(); ctx.arc(0, -s * 0.8, hr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hr, -s * 0.8); ctx.lineTo(-hr + 6, -s * 0.8); ctx.moveTo(hr, -s * 0.8); ctx.lineTo(hr - 6, -s * 0.8); ctx.moveTo(0, -s * 0.8 - hr); ctx.lineTo(0, -s * 0.8 - hr + 6); ctx.moveTo(0, -s * 0.8 + hr); ctx.lineTo(0, -s * 0.8 + hr - 6); ctx.stroke();
      break;
    case 'energy_ball':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.2) * 0.15; ctx.fillStyle = '#800000'; ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.4 + Math.sin(frame * 0.1) * 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.5, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'gravity_flip':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = '#6644AA'; ctx.lineWidth = 2; ctx.shadowColor = '#6644AA'; ctx.shadowBlur = 14;
      for (let i = 0; i < 4; i++) { const y = -s * 0.8 + Math.sin(frame * 0.08 + i) * s * 0.3; ctx.globalAlpha = 0.3 - i * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.3, y); ctx.lineTo(0, y - s * 0.15); ctx.lineTo(s * 0.3, y); ctx.stroke(); }
      break;
    case 'demon_strike':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.15) * 0.1; ctx.fillStyle = '#FF2400'; ctx.shadowColor = '#FF2400'; ctx.shadowBlur = 18;
      for (let i = 0; i < 2; i++) { const side = i === 0 ? -1 : 1; ctx.beginPath(); ctx.moveTo(side * s * 0.2, -s * 1.0); ctx.quadraticCurveTo(side * s * 0.8, -s * 1.3, side * s * 0.6, -s * 0.6); ctx.quadraticCurveTo(side * s * 0.5, -s * 0.9, side * s * 0.2, -s * 1.0); ctx.fill(); }
      break;
    case 'whip_stun':
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.3) * 0.2; ctx.strokeStyle = '#44DDFF'; ctx.lineWidth = 2; ctx.shadowColor = '#44DDFF'; ctx.shadowBlur = 16;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 1.2); for (let j = 0; j < 5; j++) { ctx.lineTo(-s * 0.5 + Math.sin(frame * 0.2 + j + i) * 8 + j * s * 0.2, -s * 1.2 + j * s * 0.2); } ctx.stroke(); }
      break;
    case 'platform_delete':
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#886633'; ctx.strokeStyle = '#AA8855'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const x = (i - 2.5) * s * 0.2; const y = -s * 0.1 + ((frame * 0.4 + i * s * 0.3) % (s * 0.8)); ctx.globalAlpha = 0.5 - (y / (s * 0.8)) * 0.4; ctx.fillRect(x - 3, y, 6, 4); }
      break;
    case 'gambit':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.2) * 0.15; ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12;
      for (let i = 0; i < 5; i++) { const ang = frame * 0.05 + i * Math.PI * 0.4; const x = Math.cos(ang) * s * 0.6; const y = -s * 0.8 + Math.sin(ang) * s * 0.6; ctx.beginPath(); ctx.arc(x, y, 2 + Math.sin(frame * 0.1 + i) * 1.5, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'copy_move':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(-s * 0.5, -s * 0.8, s * 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-s * 0.5, -s * 0.8, s * 0.25, 0, Math.PI * 2); ctx.fill();
      break;
    case 'add_damage':
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.2) * 0.15; ctx.fillStyle = '#FF4444'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center'; ctx.shadowColor = '#FF4444'; ctx.shadowBlur = 10;
      for (let i = 0; i < 3; i++) { const y = -s * 1.0 - ((frame * 0.3 + i * s * 0.4) % (s * 1.2)); ctx.globalAlpha = 0.6 - (y / (-s * 2.2)) * 0.4; ctx.fillText('+' + (10 + i * 20), Math.sin(frame * 0.05 + i) * s * 0.2, y); }
      break;
    case 'pull_all':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.15) * 0.1; ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 2; ctx.shadowColor = '#FF6600'; ctx.shadowBlur = 12;
      for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2; const r = s * (1.0 - ((frame * 0.02 + i * 0.15) % 1) * 0.6); ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r, -s * 0.8 + Math.sin(ang) * r); ctx.lineTo(Math.cos(ang) * (r - s * 0.15), -s * 0.8 + Math.sin(ang) * (r - s * 0.15)); ctx.stroke(); }
      break;
    case 'hammer_throw':
      ctx.globalAlpha = 0.4; ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 2; ctx.shadowColor = '#8B7355'; ctx.shadowBlur = 10;
      const spin = frame * 0.2; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.5, spin, spin + Math.PI * 0.3); ctx.stroke();
      ctx.fillStyle = '#8B7355'; ctx.beginPath(); ctx.arc(Math.cos(spin) * s * 0.5, -s * 0.8 + Math.sin(spin) * s * 0.5, 4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'potion_throw':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.15) * 0.1; ctx.fillStyle = '#88FF44'; ctx.strokeStyle = '#88FF44'; ctx.lineWidth = 1.5; ctx.shadowColor = '#88FF44'; ctx.shadowBlur = 12;
      for (let i = 0; i < 4; i++) { const x = Math.sin(frame * 0.06 + i) * s * 0.3; const y = -s * 0.8 + Math.cos(frame * 0.06 + i) * s * 0.3; ctx.beginPath(); ctx.arc(x, y, 2 + i, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'spawn_platform':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.08; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.roundRect(-s * 0.5, -s * 0.05, s, s * 0.12, 4); ctx.stroke();
      ctx.globalAlpha = 0.15; ctx.fillStyle = color; ctx.fillRect(-s * 0.5, -s * 0.05, s, s * 0.12);
      break;
    case 'spawn_walls':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.08; ctx.strokeStyle = '#888888'; ctx.lineWidth = 2.5; ctx.shadowColor = '#888888'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(-s * 0.9, -s * 0.8, s * 0.15, s * 0.8, 3); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(s * 0.75, -s * 0.8, s * 0.15, s * 0.8, 3); ctx.stroke();
      ctx.globalAlpha = 0.1; ctx.fillStyle = '#888888'; ctx.fillRect(-s * 0.9, -s * 0.8, s * 0.15, s * 0.8); ctx.fillRect(s * 0.75, -s * 0.8, s * 0.15, s * 0.8);
      break;
    case 'transform':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.12) * 0.12; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 16;
      for (let r = 0; r < 3; r++) { ctx.globalAlpha = 0.2 - r * 0.05; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * (0.5 + r * 0.2) + Math.sin(frame * 0.1 + r) * 3, 0, Math.PI * 2); ctx.stroke(); }
      for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2 + frame * 0.08; ctx.globalAlpha = 0.4; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(Math.cos(ang) * s * 0.6, -s * 0.8 + Math.sin(ang) * s * 0.6, 1.5, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'glue_trap':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.08) * 0.1; ctx.fillStyle = '#AA66CC'; ctx.strokeStyle = '#AA66CC'; ctx.lineWidth = 2; ctx.shadowColor = '#AA66CC'; ctx.shadowBlur = 12;
      for (let i = 0; i < 5; i++) { const x = (i - 2) * s * 0.2; const y = -s * 0.1 + Math.sin(frame * 0.05 + i) * 3; ctx.beginPath(); ctx.ellipse(x, y, 5, 8, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'vine_snare':
      ctx.globalAlpha = 0.35 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = '#448833'; ctx.lineWidth = 3; ctx.shadowColor = '#448833'; ctx.shadowBlur = 10;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.1 + i * s * 0.2); for (let j = 0; j < 6; j++) { ctx.lineTo(-s * 0.3 + Math.sin(frame * 0.08 + j + i) * 8 + j * s * 0.1, -s * 0.1 + i * s * 0.2 - j * s * 0.1); } ctx.stroke(); }
      break;
    case 'stage_slice':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.2) * 0.15; ctx.strokeStyle = '#DDBB88'; ctx.lineWidth = 3; ctx.shadowColor = '#DDBB88'; ctx.shadowBlur = 14;
      const sweep = (frame * 0.05) % 1; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.7, sweep * Math.PI - Math.PI * 0.3, sweep * Math.PI + Math.PI * 0.3); ctx.stroke();
      break;
    case 'shadow_drain':
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.12) * 0.1; ctx.strokeStyle = '#553377'; ctx.lineWidth = 2; ctx.shadowColor = '#553377'; ctx.shadowBlur = 15;
      for (let i = 0; i < 5; i++) { const ang = (i / 5) * Math.PI * 2 + frame * 0.04; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * s * 0.9, -s * 0.8 + Math.sin(ang) * s * 0.9); for (let j = 0; j < 4; j++) { ctx.lineTo(Math.cos(ang) * (s * 0.9 - j * s * 0.2) + Math.sin(frame * 0.1 + j) * 4, -s * 0.8 + Math.sin(ang) * (s * 0.9 - j * s * 0.2)); } ctx.stroke(); }
      break;
    case 'marionette':
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.1) * 0.1; ctx.strokeStyle = '#1A1A6A'; ctx.lineWidth = 1.5; ctx.shadowColor = '#1A1A6A'; ctx.shadowBlur = 8;
      for (let i = 0; i < 4; i++) { const x = (i - 1.5) * s * 0.25; ctx.beginPath(); ctx.moveTo(x, -s * 1.8); ctx.lineTo(x + Math.sin(frame * 0.05 + i) * 5, -s * 0.8); ctx.stroke(); }
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#1A1A6A'; ctx.beginPath(); ctx.rect(-s * 0.5, -s * 1.9, s, s * 0.1); ctx.fill();
      break;
    case 'bubble_trap':
      ctx.globalAlpha = 0.2 + Math.sin(frame * 0.1) * 0.08; ctx.strokeStyle = '#3399FF'; ctx.lineWidth = 2.5; ctx.shadowColor = '#3399FF'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.95 + Math.sin(frame * 0.08) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.1; ctx.fillStyle = '#3399FF'; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.95, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(Math.sin(frame * 0.05 + i) * s * 0.4, -s * 0.8 + Math.cos(frame * 0.05 + i) * s * 0.4, 3 + i, 0, Math.PI * 2); ctx.stroke(); }
      break;
    case 'deep_freeze':
      ctx.globalAlpha = 0.25 + Math.sin(frame * 0.08) * 0.08; ctx.fillStyle = '#AAEEFF'; ctx.strokeStyle = '#AAEEFF'; ctx.lineWidth = 2; ctx.shadowColor = '#AAEEFF'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.roundRect(-s * 0.4, -s * 1.3, s * 0.8, s * 1.2, 6); ctx.fill();
      ctx.globalAlpha = 0.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.4 + i * s * 0.2, -s * 1.3); ctx.lineTo(-s * 0.4 + i * s * 0.2 + 5, -s * 0.1); ctx.stroke(); }
      break;
    case 'poison_cloud':
      ctx.globalAlpha = 0.25 + Math.sin(frame * 0.1) * 0.08; ctx.fillStyle = '#66CC44'; ctx.strokeStyle = '#66CC44'; ctx.lineWidth = 1.5; ctx.shadowColor = '#66CC44'; ctx.shadowBlur = 14;
      for (let i = 0; i < 8; i++) { const x = Math.sin(frame * 0.04 + i) * s * 0.5; const y = -s * 0.8 + Math.cos(frame * 0.04 + i) * s * 0.5; const r = 4 + Math.sin(frame * 0.1 + i) * 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'sonar_pulse':
      ctx.globalAlpha = 0.3; ctx.strokeStyle = '#EEEEDD'; ctx.lineWidth = 2; ctx.shadowColor = '#EEEEDD'; ctx.shadowBlur = 10;
      for (let r = 0; r < 3; r++) { const rad = ((frame * 0.03 + r * 0.33) % 1) * s * 0.9; ctx.globalAlpha = 0.4 - (rad / (s * 0.9)) * 0.35; ctx.beginPath(); ctx.arc(0, -s * 0.8, rad, 0, Math.PI * 2); ctx.stroke(); }
      break;
    case 'elementor_call':
      const elemColors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'];
      for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2 + frame * 0.06; const r = s * 0.7 + Math.sin(frame * 0.1 + i) * 5; ctx.globalAlpha = 0.4 + Math.sin(frame * 0.15 + i) * 0.2; ctx.fillStyle = elemColors[i]; ctx.shadowColor = elemColors[i]; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(Math.cos(ang) * r, -s * 0.8 + Math.sin(ang) * r, 3, 0, Math.PI * 2); ctx.fill(); }
      break;
    default:
      ctx.globalAlpha = 0.15 + Math.sin(frame * 0.1) * 0.08; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.85, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
}

// Shade a hex color darker or lighter
function shadeColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

function drawWeapon(ctx, weapon, color, facing, limbW) {
  const w = (weapon || '').toLowerCase();
  ctx.save();

  if (w.includes('orb') || w.includes('potion') || w.includes('portal') || w.includes('flask')) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(facing * 8, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(facing * 8 - 2, -2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (w.includes('hammer') || w.includes('mace')) {
    ctx.strokeStyle = '#8B5E2B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * 20, 0);
    ctx.stroke();
    ctx.fillStyle = '#777';
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.roundRect(facing * 16, -11, 18, 22, 4);
    ctx.fill();
    ctx.strokeStyle = color + '88';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (w.includes('axe')) {
    ctx.strokeStyle = '#8B5E2B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * 22, 0);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(facing * 20, -14);
    ctx.lineTo(facing * 35, -10);
    ctx.lineTo(facing * 35, 10);
    ctx.lineTo(facing * 20, 14);
    ctx.closePath();
    ctx.fill();
  } else if (w.includes('sword') || w.includes('blade') || w.includes('katana') || w.includes('dagger')) {
    const bladeLen = w.includes('dagger') ? 16 : 32;
    ctx.fillStyle = '#D8D8D8';
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(facing * bladeLen, -2);
    ctx.lineTo(facing * (bladeLen + 6), 0);
    ctx.lineTo(facing * bladeLen, 2);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8B5E2B';
    ctx.shadowBlur = 0;
    ctx.fillRect(-2, -6, 4, 12);
  } else if (w.includes('spear') || w.includes('trident') || w.includes('halberd')) {
    ctx.strokeStyle = '#8B5E2B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * 38, 0);
    ctx.stroke();
    if (w.includes('trident')) {
      ctx.strokeStyle = '#BBB';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(facing * 38, 0);
        ctx.lineTo(facing * 50, i * 8);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#BBB';
      ctx.beginPath();
      ctx.moveTo(facing * 38, -5);
      ctx.lineTo(facing * 48, 0);
      ctx.lineTo(facing * 38, 5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (w.includes('scythe')) {
    ctx.strokeStyle = '#8B5E2B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * 38, 0);
    ctx.stroke();
    ctx.strokeStyle = '#D8D8D8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(facing * 38, 0);
    ctx.quadraticCurveTo(facing * 55, -5, facing * 48, -22);
    ctx.stroke();
  } else if (w.includes('bow')) {
    ctx.strokeStyle = '#8B5E2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(facing * 12, 0, 16, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(facing * 5, -13);
    ctx.lineTo(facing * 5, 13);
    ctx.stroke();
  } else if (w.includes('shield')) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(facing * 3, -15, 18, 30, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (w.includes('staff') || w.includes('scepter')) {
    ctx.strokeStyle = '#8B5E2B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * 6, -34);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(facing * 6, -34, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (w.includes('whip') || w.includes('chain') || w.includes('vine')) {
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(facing * 15, -10, facing * 32, 6);
    ctx.stroke();
  } else if (w.includes('cannon')) {
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.roundRect(facing * 2, -7, 20, 14, 3);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(facing * 22, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (w.includes('gauntlet')) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(facing * 2, -5, 14, 10, 3);
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(facing * 6, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Returns animated limb positions/angles (relative to baseline 0,0) so cosmetics
// can attach to actual moving arms/legs instead of static body coords.
export function getLimbPose(frame, state = 'idle', facing = 1, scale = 1, powerActive, emote) {
  if (powerActive === 'range_boost') scale *= 1.35;
  const s = 36 * scale;
  let bob = 0, legSwing = 0, armSwingL = 0, armSwingR = 0, lean = 0;
  let punchArmL = 0, punchArmR = 0;
  let legLOver = null, legROver = null; // independent leg angle overrides (from emotes)
  if (emote) {
    const ev = getEmotePoseVars(emote.id, emote.progress, facing);
    if (ev) {
      bob = ev.bob; lean = ev.lean; armSwingL = ev.armSwingL; armSwingR = ev.armSwingR;
      legSwing = ev.legSwing; punchArmL = ev.punchArmL; punchArmR = ev.punchArmR;
      legLOver = ev.legLOver; legROver = ev.legROver;
    }
  } else if (state === 'idle') { bob = 0; armSwingL = 0; armSwingR = 0; }
  else if (state === 'moving') {
    const t = frame * 0.18;
    bob = Math.abs(Math.sin(t)) * -3;
    legSwing = Math.sin(t) * 0.65;
    armSwingL = Math.sin(t) * 0.55;
    armSwingR = -Math.sin(t) * 0.55;
    lean = facing * 0.12;
  } else if (state === 'jumping') { bob = -6; legSwing = -0.4; armSwingL = -0.7; armSwingR = 0.7; }
  else if (state === 'attacking') {
    lean = facing * 0.22;
    punchArmL = facing > 0 ? -1.4 : 0.2;
    punchArmR = facing > 0 ? 0.2 : 1.4;
    legSwing = 0.25;
  } else if (state === 'superAttack') {
    const t = frame * 0.22;
    lean = Math.sin(t) * 0.3;
    punchArmL = Math.sin(t) * 1.5;
    punchArmR = Math.cos(t) * 1.5;
    legSwing = Math.cos(t) * 0.6;
  } else if (state === 'hitstun') { bob = 3; lean = -facing * 0.3; armSwingL = 0.6; armSwingR = -0.4; legSwing = -0.3; }

  const headR = s * 0.34;
  const headCY = -s * 1.7 + bob;
  const torsoW = s * 0.52;
  const torsoH = s * 0.72;
  const torsoX = -torsoW / 2;
  const torsoY = headCY + headR + s * 0.05;
  const hipY = torsoY + torsoH;
  const armLen = s * 0.52;
  const legLen = s * 0.58;
  const hipLX = torsoX + torsoW * 0.25;
  const hipRX = torsoX + torsoW * 0.75;
  const shoulderLX = torsoX;
  const shoulderRX = torsoX + torsoW;
  const shoulderY = torsoY + torsoH * 0.1;
  const finalArmL = armSwingL + punchArmL;
  const finalArmR = armSwingR + punchArmR;

  const rot = (px, py, a) => [px * Math.cos(a) - py * Math.sin(a), px * Math.sin(a) + py * Math.cos(a)];
  const leanPt = (lx, ly) => rot(lx, ly, lean);

  const legAngleL = legLOver !== null ? legLOver : -legSwing;
  const legAngleR = legROver !== null ? legROver : legSwing;
  const footLocalL = rot(0, legLen, legAngleL);
  const footLocalR = rot(0, legLen, legAngleR);
  const footL = leanPt(hipLX + footLocalL[0], hipY + footLocalL[1]);
  const footR = leanPt(hipRX + footLocalR[0], hipY + footLocalR[1]);
  const kneeL = leanPt(hipLX + footLocalL[0] * 0.5, hipY + footLocalL[1] * 0.5);
  const kneeR = leanPt(hipRX + footLocalR[0] * 0.5, hipY + footLocalR[1] * 0.5);

  const handLocalL = rot(0, armLen, -0.28 + finalArmL);
  const handLocalR = rot(0, armLen, 0.28 + finalArmR);
  const handL = leanPt(shoulderLX + handLocalL[0], shoulderY + handLocalL[1]);
  const handR = leanPt(shoulderRX + handLocalR[0], shoulderY + handLocalR[1]);
  const elbowL = leanPt(shoulderLX + handLocalL[0] * 0.5, shoulderY + handLocalL[1] * 0.5);
  const elbowR = leanPt(shoulderRX + handLocalR[0] * 0.5, shoulderY + handLocalR[1] * 0.5);

  const head = leanPt(0, headCY);
  const shL = leanPt(shoulderLX, shoulderY);
  const shR = leanPt(shoulderRX, shoulderY);
  const hipLP = leanPt(hipLX, hipY);
  const hipRP = leanPt(hipRX, hipY);
  const torsoTop = leanPt(0, torsoY);
  const torsoC = leanPt(0, torsoY + torsoH / 2);

  return {
    s, headR, lean, torsoW,
    head: { x: head[0], y: head[1] },
    torsoTopY: torsoTop[1], torsoCY: torsoC[1],
    hipY: leanPt(0, hipY)[1], shoulderY: leanPt(0, shoulderY)[1], feetY: 0,
    shoulders: { left: { x: shL[0], y: shL[1] }, right: { x: shR[0], y: shR[1] } },
    hips: { left: { x: hipLP[0], y: hipLP[1] }, right: { x: hipRP[0], y: hipRP[1] } },
    hands: { left: { x: handL[0], y: handL[1] }, right: { x: handR[0], y: handR[1] } },
    feet: { left: { x: footL[0], y: footL[1] }, right: { x: footR[0], y: footR[1] } },
    knees: { left: { x: kneeL[0], y: kneeL[1] }, right: { x: kneeR[0], y: kneeR[1] } },
    elbows: { left: { x: elbowL[0], y: elbowL[1] }, right: { x: elbowR[0], y: elbowR[1] } },
    armAngleL: -0.28 + finalArmL, armAngleR: 0.28 + finalArmR,
    legAngleL: legLOver !== null ? legLOver : -legSwing, legAngleR: legROver !== null ? legROver : legSwing,
  };
}

function drawBrawlhalla(ctx, s, frame, color, state, facing, charData, powerActive, noWeapon = false, emote = null) {
  // Yellow turns white when enhanced (power active)
  if (powerActive && charData?.id === 'yellow' && powerActive === 'stat_boost') {
    color = '#FFFFFF';
  }
  // Custom characters support per-part appearance colors
  const ap = charData?.appearance;
  const torsoColor = ap?.torso || color;
  const armColor = ap?.armL ? ap.armL : shadeColor(torsoColor, -45);
  const legColor = ap?.legL ? ap.legL : shadeColor(torsoColor, -25);
  const headColor = ap?.head || torsoColor;
  const hasWhiteEyes = charData?.whiteEyes || false;

  let bob = 0, legSwing = 0, armSwingL = 0, armSwingR = 0, lean = 0;
  let punchArmL = 0, punchArmR = 0; // for punch animations
  let legLOver = null, legROver = null; // independent leg angle overrides (emotes)

  if (emote) {
    const ev = getEmotePoseVars(emote.id, emote.progress, facing);
    if (ev) {
      bob = ev.bob; lean = ev.lean; armSwingL = ev.armSwingL; armSwingR = ev.armSwingR;
      legSwing = ev.legSwing; punchArmL = ev.punchArmL; punchArmR = ev.punchArmR;
      legLOver = ev.legLOver; legROver = ev.legROver;
    }
  } else if (state === 'idle') {
    // Characters stand still — no bobbing
    bob = 0;
    armSwingL = 0;
    armSwingR = 0;
  } else if (state === 'moving') {
    const t = frame * 0.18;
    bob = Math.abs(Math.sin(t)) * -3;
    legSwing = Math.sin(t) * 0.65;
    armSwingL = Math.sin(t) * 0.55;
    armSwingR = -Math.sin(t) * 0.55;
    lean = facing * 0.12;
  } else if (state === 'jumping') {
    bob = -6;
    legSwing = -0.4;
    armSwingL = -0.7;
    armSwingR = 0.7;
  } else if (state === 'attacking') {
    lean = facing * 0.22;
    // Punch pose — one arm swings forward hard
    punchArmL = facing > 0 ? -1.4 : 0.2;
    punchArmR = facing > 0 ? 0.2 : 1.4;
    legSwing = 0.25;
  } else if (state === 'superAttack') {
    const t = frame * 0.22;
    lean = Math.sin(t) * 0.3;
    punchArmL = Math.sin(t) * 1.5;
    punchArmR = Math.cos(t) * 1.5;
    legSwing = Math.cos(t) * 0.6;
  } else if (state === 'hitstun') {
    // Simple limp — no dance
    bob = 3;
    lean = -facing * 0.3;
    armSwingL = 0.6;
    armSwingR = -0.4;
    legSwing = -0.3;
  } else if (state === 'crouching') {
    // Crouching — lower body, arms tucked
    bob = 10;
    legSwing = 0;
    armSwingL = 0.3;
    armSwingR = -0.3;
    lean = 0;
  }

  ctx.save();
  ctx.rotate(lean);

  const headR = s * 0.34;
  const headCY = -s * 1.7 + bob;
  const torsoW = s * 0.52;
  const torsoH = s * 0.72;
  const torsoX = -torsoW / 2;
  const torsoY = headCY + headR + s * 0.05;
  const hipY = torsoY + torsoH;
  const limbW = s * 0.24;
  const armLen = s * 0.52;
  const legLen = s * 0.58;

  ctx.shadowColor = torsoColor;
  ctx.shadowBlur = 12;

  // ── Legs (drawn behind torso) ──
  const hipLX = torsoX + torsoW * 0.25;
  const hipRX = torsoX + torsoW * 0.75;
  const legColorR = ap?.legR || legColor;

  ctx.save();
  ctx.translate(hipLX, hipY);
  ctx.rotate(legLOver !== null ? legLOver : -legSwing);
  ctx.fillStyle = legColor;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.roundRect(-limbW / 2, 0, limbW, legLen, limbW / 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(hipRX, hipY);
  ctx.rotate(legROver !== null ? legROver : legSwing);
  ctx.fillStyle = legColorR;
  ctx.beginPath();
  ctx.roundRect(-limbW / 2, 0, limbW, legLen, limbW / 2);
  ctx.fill();
  ctx.restore();

  // ── Torso ──
  ctx.shadowColor = torsoColor;
  ctx.shadowBlur = 12;
  ctx.fillStyle = torsoColor;
  ctx.beginPath();
  ctx.roundRect(torsoX, torsoY, torsoW, torsoH, 5);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.roundRect(torsoX + 2, torsoY + 2, torsoW - 4, torsoH * 0.38, 4);
  ctx.fill();

  // ── Arms (different shade, drawn over torso) ──
  const shoulderLX = torsoX;
  const shoulderRX = torsoX + torsoW;
  const shoulderY = torsoY + torsoH * 0.1;
  const finalArmL = armSwingL + punchArmL;
  const finalArmR = armSwingR + punchArmR;
  const armColorR = ap?.armR || armColor;

  ctx.shadowColor = armColor;
  ctx.shadowBlur = 6;

  ctx.save();
  ctx.translate(shoulderLX, shoulderY);
  ctx.rotate(-0.28 + finalArmL);
  ctx.fillStyle = armColor;
  ctx.beginPath();
  ctx.roundRect(-limbW / 2, 0, limbW, armLen, limbW / 2);
  ctx.fill();
  // Fist/hand circle at end
  ctx.fillStyle = armColor;
  ctx.beginPath();
  ctx.arc(0, armLen, limbW * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(shoulderRX, shoulderY);
  ctx.rotate(0.28 + finalArmR);
  ctx.fillStyle = armColorR;
  ctx.beginPath();
  ctx.roundRect(-limbW / 2, 0, limbW, armLen, limbW / 2);
  ctx.fill();
  ctx.fillStyle = armColorR;
  ctx.beginPath();
  ctx.arc(0, armLen, limbW * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Weapons removed from the game
  ctx.restore();

  // ── Head ──
  ctx.shadowColor = headColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(0, headCY, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(-headR * 0.22, headCY - headR * 0.28, headR * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  if (hasWhiteEyes) {
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(-headR * 0.3, headCY - headR * 0.05, headR * 0.22, headR * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.3, headCY - headR * 0.05, headR * 0.22, headR * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(-headR * 0.3, headCY - headR * 0.05, headR * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headR * 0.3, headCY - headR * 0.05, headR * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(-headR * 0.25, headCY - headR * 0.1, headR * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headR * 0.35, headCY - headR * 0.1, headR * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSpirit(ctx, s, frame, color, charData) {
  const waveX = Math.sin(frame * 0.04) * 5;
  const waveY = Math.sin(frame * 0.06) * 3;
  const hasWhiteEyes = charData?.whiteEyes || false;
  ctx.globalAlpha = 0.8 + Math.sin(frame * 0.05) * 0.1;

  const aura = ctx.createRadialGradient(waveX, -s * 0.5 + waveY, 2, waveX, -s * 0.4 + waveY, s * 1.5);
  aura.addColorStop(0, color + 'AA');
  aura.addColorStop(0.4, color + '33');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(waveX, -s * 0.4 + waveY, s, s * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color + '99';
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.ellipse(waveX, -s * 0.45 + waveY, s * 0.5, s * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeColor = hasWhiteEyes ? '#FFFFFF' : '#FF00FF';
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 14;
  const eyeY = -s * 0.72 + waveY;
  ctx.beginPath();
  ctx.ellipse(waveX - 8, eyeY, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(waveX + 8, eyeY, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  for (let i = 0; i < 5; i++) {
    const tx = waveX + (i - 2) * 9;
    const tw = Math.sin(frame * 0.05 + i * 1.2) * 12;
    ctx.strokeStyle = color + '55';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, s * 0.1 + waveY);
    ctx.bezierCurveTo(tx + tw, s * 0.4 + waveY, tx - tw, s * 0.7 + waveY, tx + tw * 0.5, s + waveY);
    ctx.stroke();
  }
  // Floating spirit orbs around guardian
  for (let i = 0; i < 3; i++) {
    const angle = frame * 0.03 + i * (Math.PI * 2 / 3);
    const ox = waveX + Math.cos(angle) * s * 0.8;
    const oy = -s * 0.5 + waveY + Math.sin(angle) * s * 0.5;
    ctx.globalAlpha = 0.7 + Math.sin(frame * 0.05 + i) * 0.2;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ox, oy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(ox - 1.5, oy - 1.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ─── Double jump particles (+ ground puffs) ──────────────────────────────────
export function drawDoubleJumpParticles(ctx, particles, cameraOffX = 0, cameraOffY = 0) {
  particles.forEach(p => {
    const t = 1 - p.life / p.maxLife;
    ctx.save();
    if (p.isGroundPuff) {
      // Soft white/grey cloud puff — ellipse that expands and fades
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(p.x + cameraOffX, p.y + cameraOffY, (6 + t * 10) * (1 - t * 0.3), (4 + t * 5), 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Double jump — colored spark
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x + cameraOffX, p.y + cameraOffY, 5 * (1 - t * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

// ─── Super Move Name Flash ───────────────────────────────────────────────────
export function drawSuperFlash(ctx, canvasW, canvasH, name, color, progress) {
  if (progress > 0.45) return; // only show during first half
  const t = progress / 0.45;
  const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Screen tint
  ctx.fillStyle = color + '22';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Name text
  ctx.textAlign = 'center';
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 38px Orbitron, sans-serif`;
  ctx.fillText(name?.toUpperCase() || 'SUPER', canvasW / 2, canvasH / 2 - 10);

  ctx.fillStyle = color;
  ctx.font = `bold 16px Orbitron, sans-serif`;
  ctx.fillText('SUPER MOVE', canvasW / 2, canvasH / 2 + 18);

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Sig glow ring (makes sigs more visible) ─────────────────────────────────
function drawSigGlowRing(ctx, x, y, color, size = 40) {
  const grad = ctx.createRadialGradient(x, y, 5, x, y, size);
  grad.addColorStop(0, color + 'AA');
  grad.addColorStop(0.5, color + '44');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Attack Effects ─────────────────────────────────────────────────────────

export function drawAttackEffect(ctx, x, y, attack, progress, facing, color, isNormal = false, charId = '', power = null, powerActive = null) {
  ctx.save();

  // For normal attacks — draw a clean kick/punch, NO circles
  if (isNormal || attack.isNormal) {
    drawNormalAttack(ctx, x, y, attack, progress, facing, color);
    // Emi's sword still swings even on normal attacks
    if (charId === 'g3_emi' && powerActive === 'gen_sword_in_hand') {
      drawEmiSwordSwing(ctx, x, y, attack, progress, facing);
    }
    ctx.restore();
    return;
  }

  // Subtle glow for heavy attacks — small, not a giant ball
  if (attack.isHeavy) {
    ctx.globalAlpha = (1 - progress) * 0.3;
    drawSigGlowRing(ctx, x, y - 15, color, 35 + progress * 10);
    ctx.globalAlpha = 1;
  }

  // Very subtle sig glow — not a dominant ball
  ctx.globalAlpha = (1 - progress) * 0.2;
  drawSigGlowRing(ctx, x, y - 15, color, attack.isHeavy ? 30 + progress * 10 : 25 + progress * 8);
  ctx.globalAlpha = Math.max(0, 1 - progress * 1.2);

  const p = progress;

  // UNIQUE per-character animation — every heavy/sig is visually distinct
  const attackKey = attack.sigType || (attack.isHeavy ? 'heavy' : 'side');

  // Scale up sigs and down sigs by 30% for more visual presence
  const isUpOrDownSig = (attack.sigType === 'up' || attack.sigType === 'aerial' ||
                         attack.sigType === 'down' || attack.sigType === 'downNormal') && !attack.isNormal;
  if (isUpOrDownSig) {
    ctx.save();
    ctx.translate(x, y - 15);
    ctx.scale(1.3, 1.3);
    ctx.translate(-x, -(y - 15));
    drawCharAttack(ctx, x, y, color, p, facing, attack, charId, attackKey, power);
    ctx.restore();
  } else {
    drawCharAttack(ctx, x, y, color, p, facing, attack, charId, attackKey, power);
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Emi's Blood Sword — sword swing incorporated into every sig/heavy attack
  if (charId === 'g3_emi' && powerActive === 'gen_sword_in_hand') {
    drawEmiSwordSwing(ctx, x, y, attack, progress, facing);
  }

  ctx.restore();
}

// Emi's sword swing — draws a sword that sweeps through the attack direction
function drawEmiSwordSwing(ctx, x, y, attack, progress, facing) {
  const p = progress;
  const alpha = Math.sin(p * Math.PI);
  if (alpha <= 0) return;

  const swordColor = '#CC1133';
  const cx = x;
  const cy = y - 35;
  const len = attack.isHeavy ? 78 : 62;

  // Sweep angle from wind-up to strike based on attack direction
  const st = attack.sigType;
  let angStart, angEnd;
  if (st === 'up' || st === 'aerial') {
    angStart = facing > 0 ? 0.4 : Math.PI - 0.4;
    angEnd = -Math.PI / 2;
  } else if (st === 'down' || st === 'downNormal') {
    angStart = facing > 0 ? -0.4 : Math.PI + 0.4;
    angEnd = Math.PI / 2;
  } else {
    angStart = facing > 0 ? -Math.PI / 3 : Math.PI + Math.PI / 3;
    angEnd = facing > 0 ? Math.PI / 6 : Math.PI - Math.PI / 6;
  }
  const ang = angStart + (angEnd - angStart) * p;

  // Red slash trail — arc showing the sweep path
  ctx.save();
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = swordColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.shadowColor = swordColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, len, angStart, ang, (angEnd - angStart) > 0);
  ctx.stroke();
  ctx.restore();

  // Sword blade at current swing angle
  ctx.save();
  ctx.globalAlpha = alpha * 0.95;
  ctx.translate(cx, cy);
  ctx.rotate(ang + Math.PI / 2);
  ctx.shadowColor = swordColor;
  ctx.shadowBlur = 12;
  // Blade
  ctx.fillStyle = '#DDDDDD';
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-2.5, -len, 5, len - 6, 2);
  ctx.fill(); ctx.stroke();
  // Edge highlight
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.globalAlpha = alpha * 0.5;
  ctx.beginPath();
  ctx.moveTo(-1, -len + 2);
  ctx.lineTo(-1, -6);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.95;
  // Crossguard
  ctx.fillStyle = '#AA8833';
  ctx.fillRect(-8, -6, 16, 4);
  // Handle
  ctx.fillStyle = '#553311';
  ctx.fillRect(-2.5, -2, 5, 10);
  // Pommel
  ctx.fillStyle = '#AA8833';
  ctx.beginPath();
  ctx.arc(0, 10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Clean punch/kick animation — NO circles, just limb extension
function drawNormalAttack(ctx, x, y, attack, progress, facing, color) {
  const armColor = shadeColor(color, -45);
  const p = progress;
  const alpha = Math.sin(p * Math.PI); // in-out fade

  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = armColor;

  const s = 36; // base scale
  const limbW = s * 0.24;
  const armLen = s * 0.52;

  if (attack.sigType === 'down' || attack.type === 'downNormal') {
    // Downward kick
    const kickExt = p * 40;
    ctx.save();
    ctx.translate(x + facing * 8, -30 + kickExt * 0.5);
    ctx.rotate(facing * (0.8 + p * 0.4));
    ctx.beginPath();
    ctx.roundRect(-limbW / 2, 0, limbW, armLen + kickExt, limbW / 2);
    ctx.fill();
    ctx.restore();
  } else if (attack.sigType === 'aerial' || attack.type === 'aerialNormal') {
    // Aerial kick — leg extends outward
    const kickExt = p * 35;
    ctx.save();
    ctx.translate(x + facing * 6, -24);
    ctx.rotate(facing * (-0.3 - p * 0.8));
    ctx.beginPath();
    ctx.roundRect(-limbW / 2, 0, limbW, armLen + kickExt, limbW / 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Side punch — arm extends forward
    const punchExt = p * 42;
    ctx.save();
    ctx.translate(x + facing * (18 + punchExt * 0.4), -38);
    ctx.rotate(facing === 1 ? -0.2 : 0.2);
    ctx.beginPath();
    ctx.roundRect(-limbW / 2, 0, limbW, armLen * 0.7 + punchExt * 0.6, limbW / 2);
    ctx.fill();
    // Fist
    ctx.fillStyle = armColor;
    ctx.beginPath();
    ctx.arc(0, armLen * 0.7 + punchExt * 0.6, limbW * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawSuperEffect(ctx, x, y, color, progress, charName = '', charId = '') {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 35;

  // Local flash around the player (NOT full-screen)
  if (progress < 0.1) {
    ctx.globalAlpha = (0.1 - progress) / 0.1 * 0.5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 18, 120, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Universal super-move hitbox ring (same for every character) ──
  // A detailed ring in the character's color that indicates the super's
  // area of effect. Pulses outward and fades as the super progresses.
  const ringR = 180;
  const ringAlpha = Math.max(0, 1 - progress * 1.1);
  ctx.save();
  ctx.globalAlpha = ringAlpha * 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(x, y - 18, ringR, 0, Math.PI * 2);
  ctx.stroke();
  // Inner accent ring
  ctx.globalAlpha = ringAlpha * 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 18, ringR - 12, 0, Math.PI * 2);
  ctx.stroke();
  // Tick marks around the ring for detail
  ctx.globalAlpha = ringAlpha * 0.7;
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + progress * 2;
    const r1 = ringR - 6, r2 = ringR + 6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * r1, y - 18 + Math.sin(ang) * r1);
    ctx.lineTo(x + Math.cos(ang) * r2, y - 18 + Math.sin(ang) * r2);
    ctx.stroke();
  }
  // Expanding pulse ring
  const pulseR = ringR * (0.4 + progress * 0.8);
  ctx.globalAlpha = ringAlpha * 0.3 * (1 - progress);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y - 18, pulseR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Clip + scale: supers stay around the player, not the whole screen
  ctx.beginPath();
  ctx.arc(x, y - 18, 220, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y - 18);
  ctx.scale(0.35, 0.35);
  ctx.translate(-x, -(y - 18));

  // Route to per-character super animation (data-driven theme system)
  drawCharSuper(ctx, x, y, color, progress, charId);

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Yellow — Sonic Overdrive: speed rings erupting outward, horizontal lightning streaks
function drawSuper_Yellow(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Speed lines from center
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const len = 80 + p * 180;
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = i % 3 === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * 20, y - 18 + Math.sin(angle) * 20);
    ctx.lineTo(x + Math.cos(angle) * len, y - 18 + Math.sin(angle) * len);
    ctx.stroke();
  }
  // Concentric rings
  for (let r = 0; r < 4; r++) {
    const rr = (50 + r * 55) * p;
    ctx.globalAlpha = alpha * (0.6 - r * 0.12);
    ctx.strokeStyle = r === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 3 - r * 0.5;
    ctx.beginPath();
    ctx.arc(x, y - 18, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Blue — Tsunami: giant water arc waves sweeping across
function drawSuper_Blue(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let w2 = 0; w2 < 5; w2++) {
    const phase = (p - w2 * 0.08);
    if (phase < 0) continue;
    const waveX = x + phase * 260;
    ctx.globalAlpha = alpha * (0.7 - w2 * 0.1);
    ctx.strokeStyle = w2 === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 5 - w2;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.04) {
      const wx = waveX - 120 + t * 240;
      const wy = y - 30 + Math.sin(t * Math.PI * 3 + phase * 8) * 30;
      t === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  // Giant rising water column
  const colH = p * 200;
  const grad = ctx.createLinearGradient(x, y, x, y - colH);
  grad.addColorStop(0, color + 'CC');
  grad.addColorStop(1, '#AADDFF00');
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = grad;
  ctx.fillRect(x - 18, y - colH, 36, colH);
}

// Purple — Shadow Barrage: shadow clones slash from multiple angles
function drawSuper_Purple(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // 5 shadow slashes from different directions
  for (let i = 0; i < 5; i++) {
    const phase = p - i * 0.1;
    if (phase < 0) continue;
    const angle = (i / 5) * Math.PI * 2;
    const sx = x + Math.cos(angle) * 60;
    const sy = y - 18 + Math.sin(angle) * 40;
    ctx.globalAlpha = alpha * (1 - i * 0.12) * 0.8;
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : color;
    ctx.lineWidth = 4 - i * 0.5;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(angle + 1) * 50, sy - Math.sin(angle + 1) * 50);
    ctx.lineTo(sx + Math.cos(angle + 1) * 50, sy + Math.sin(angle + 1) * 50);
    ctx.stroke();
  }
  // Center dark burst
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillStyle = '#220033';
  ctx.beginPath();
  ctx.arc(x, y - 18, p * 80, 0, Math.PI * 2);
  ctx.fill();
}

// Orange — Rift Storm: rotating portals flinging energy bolts
function drawSuper_Orange(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Two portals spinning around center
  for (let portal = 0; portal < 2; portal++) {
    const angle = portal * Math.PI + p * Math.PI * 4;
    const px = x + Math.cos(angle) * (60 + p * 80);
    const py = y - 18 + Math.sin(angle) * 35;
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = portal === 0 ? color : '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(px, py, 18, 28, angle, 0, Math.PI * 2);
    ctx.stroke();
    // Bolt from portal to center
    ctx.globalAlpha = alpha * 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y - 18);
    ctx.stroke();
  }
  // Central explosion ring
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4 * alpha;
  ctx.beginPath();
  ctx.arc(x, y - 18, p * 150, 0, Math.PI * 2);
  ctx.stroke();
}

// Green — Seismic Surge: stone pillars erupt from ground in sequence
function drawSuper_Green(ctx, x, y, color, p) {
  const alpha = 1 - p;
  for (let i = 0; i < 7; i++) {
    const phase = p - i * 0.07;
    if (phase < 0) continue;
    const px = x - 180 + i * 60;
    const ph = Math.min(phase * 250, 140);
    const grad = ctx.createLinearGradient(px, y, px, y - ph);
    grad.addColorStop(0, color + 'FF');
    grad.addColorStop(1, color + '33');
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = grad;
    ctx.fillRect(px - 10, y - ph, 20, ph);
    // Cap
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillRect(px - 12, y - ph - 4, 24, 6);
  }
}

// Pink — Telekinetic Maelstrom: objects spiral inward then explode
function drawSuper_Pink(ctx, x, y, color, p) {
  const alpha = 1 - p;
  const count = 12;
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2;
    const angle = baseAngle + p * Math.PI * 4;
    const dist = p < 0.5 ? 140 * (1 - p * 2) : (p - 0.5) * 280;
    const ox = x + Math.cos(angle) * dist;
    const oy = y - 18 + Math.sin(angle) * dist * 0.55;
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.rect(ox - 6, oy - 6, 12, 12);
    ctx.fill();
  }
  if (p > 0.45 && p < 0.6) {
    // Central explosion
    ctx.globalAlpha = (1 - Math.abs(p - 0.52) / 0.08) * 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y - 18, 80, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Black — Lightning Convergence: bolts from all corners converge then blast
function drawSuper_Black(ctx, x, y, color, p) {
  const alpha = 1 - p;
  const corners = [[-480,-280],[480,-280],[-480,280],[480,280]];
  corners.forEach(([cx, cy], i) => {
    if (p < i * 0.08) return;
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = i % 2 === 0 ? '#FFFF00' : '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#FFFF00';
    ctx.beginPath();
    ctx.moveTo(x + cx, y + cy);
    // Zigzag lightning to center
    const steps = 6;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const lx = x + cx * (1 - t) + (Math.random() - 0.5) * 30;
      const ly = y + cy * (1 - t) + (Math.random() - 0.5) * 20;
      ctx.lineTo(lx, ly);
    }
    ctx.lineTo(x, y - 18);
    ctx.stroke();
  });
  // Center flash
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = '#FFFF00';
  ctx.shadowColor = '#FFFF00';
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(x, y - 18, 20 + p * 60, 0, Math.PI * 2);
  ctx.fill();
}

// Indigo — Gravity Collapse: everything gets sucked in then violently repelled
function drawSuper_Indigo(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Gravity well — concentric rings compressing
  for (let r = 0; r < 5; r++) {
    const rr = (150 - r * 20) * (p < 0.5 ? 1 - p * 1.6 + r * 0.1 : (p - 0.5) * 2.5);
    if (rr < 0) continue;
    ctx.globalAlpha = alpha * (0.5 - r * 0.08);
    ctx.strokeStyle = r % 2 === 0 ? color : '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(x, y - 18, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Central void core
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = '#000000';
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(x, y - 18, 15 * (1 - p * 0.5), 0, Math.PI * 2);
  ctx.fill();
}

// Red — Inferno Nova: fire explosion growing from center
function drawSuper_Red(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Core fireball
  const coreR = p * 120;
  const grad = ctx.createRadialGradient(x, y - 18, 5, x, y - 18, coreR);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, '#FF6600');
  grad.addColorStop(0.7, color + '88');
  grad.addColorStop(1, color + '00');
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y - 18, coreR, 0, Math.PI * 2);
  ctx.fill();
  // Fire tongues
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + p * 2;
    const len = coreR * (0.6 + Math.sin(p * 20 + i) * 0.4);
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = i % 3 === 0 ? '#FFFFFF' : '#FF4400';
    ctx.lineWidth = 4 * (1 - p);
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.cos(angle) * len, y - 18 + Math.sin(angle) * len);
    ctx.stroke();
  }
}

// White — Heaven's Descent: wings of light spread + holy beam from above
function drawSuper_White(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Light beam from above
  const beamH = 400 * Math.min(p * 3, 1);
  const bgrad = ctx.createLinearGradient(x, y - beamH, x, y);
  bgrad.addColorStop(0, '#FFFFFF00');
  bgrad.addColorStop(0.5, '#FFFFFFBB');
  bgrad.addColorStop(1, color + '88');
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = bgrad;
  ctx.fillRect(x - 22, y - beamH, 44, beamH);
  // Wings
  for (let side = -1; side <= 1; side += 2) {
    const wingSpan = p * 200;
    ctx.globalAlpha = alpha * 0.65;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    for (let feather = 0; feather < 5; feather++) {
      const fa = (feather / 5) * Math.PI * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 30);
      ctx.quadraticCurveTo(
        x + side * wingSpan * 0.5,
        y - 30 - feather * 20,
        x + side * (wingSpan * 0.6 + feather * 20),
        y - 30 + Math.sin(fa) * 30
      );
      ctx.stroke();
    }
  }
}

// Silver — Foresight: time rewind ripple / chrome mirror effect
function drawSuper_Silver(ctx, x, y, color, p) {
  const alpha = 1 - p;
  // Chrome ripples
  for (let r = 0; r < 6; r++) {
    const rr = (30 + r * 35) * p;
    ctx.globalAlpha = alpha * (0.55 - r * 0.07);
    ctx.strokeStyle = r % 2 === 0 ? '#C0C0C0' : '#FFFFFF';
    ctx.lineWidth = 3 - r * 0.3;
    ctx.beginPath();
    ctx.arc(x, y - 18, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Mirror shards
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + p * 3;
    const dist = 60 + p * 100;
    const sx = x + Math.cos(angle) * dist;
    const sy = y - 18 + Math.sin(angle) * dist * 0.6;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#C0C0C0' : '#FFFFFF';
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle + p * 5);
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(6, 6); ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Generic fallback
function drawSuper_Default(ctx, x, y, color, p) {
  const alpha = 1 - p;
  const r1 = 260 * p;
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5 * alpha;
  ctx.beginPath();
  ctx.arc(x, y - 18, r1, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + p * 5;
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = i % 2 === 0 ? color : '#FFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * r1 * 0.42, y - 18 + Math.sin(angle) * r1 * 0.42);
    ctx.lineTo(x + Math.cos(angle) * r1 * 0.92, y - 18 + Math.sin(angle) * r1 * 0.92);
    ctx.stroke();
  }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

export function drawHealthBar(ctx, x, y, damage, maxDamage, color, name, stocks, crossoverName, powerPercent = 0, superPercent = 0, side = 'left', compact = false, hideStocks = false) {
  if (hideStocks) return; // hide stock boxes = hide the entire panel including background
  const scale = compact ? 0.7 : 1;
  const barHeight = 10 * scale;
  const stockR = 5 * scale;
  const stockGap = 14 * scale;
  const numStocks = Math.max(stocks, 3);
  const stockSpan = (numStocks - 1) * stockGap;
  const pbW = 50 * scale, pbH = 7 * scale, gap = 6 * scale;
  const totalW = pbW + gap + stockSpan + gap + pbW;
  const barWidth = totalW;
  const bx = side === 'left' ? x : x - totalW;

  const panelH = compact ? barHeight + 14 + pbH * 2 + stockR * 2 + 14 : barHeight + 50;
  ctx.fillStyle = 'rgba(8,8,18,0.88)';
  ctx.beginPath();
  ctx.roundRect(bx - 8, y - 24, totalW + 16, panelH, 9);
  ctx.fill();
  ctx.strokeStyle = color + '55';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Name
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 7;
  ctx.font = `bold ${12 * scale}px Orbitron, sans-serif`;
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  ctx.fillText(name.toUpperCase(), side === 'left' ? bx : bx + totalW, y - 10);
  ctx.shadowBlur = 0;
  if (crossoverName) {
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${8 * scale}px Orbitron, sans-serif`;
    ctx.fillText(crossoverName.toUpperCase(), side === 'left' ? bx : bx + totalW, y - 22);
  }

  // Damage bar
  const dmgX = side === 'left' ? bx : bx + totalW - barWidth;
  ctx.fillStyle = '#111122';
  ctx.beginPath(); ctx.roundRect(dmgX, y, barWidth, barHeight, 4); ctx.fill();
  const dmgPercent = Math.min(damage / maxDamage, 1);
  const dmgColor = dmgPercent < 0.3 ? '#44FF88' : dmgPercent < 0.6 ? '#FFFF44' : dmgPercent < 0.85 ? '#FF8844' : '#FF2222';
  const barGrad = ctx.createLinearGradient(dmgX, y, dmgX, y + barHeight);
  barGrad.addColorStop(0, dmgColor); barGrad.addColorStop(1, dmgColor + 'AA');
  ctx.fillStyle = barGrad;
  ctx.beginPath(); ctx.roundRect(dmgX, y, barWidth * dmgPercent, barHeight, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.roundRect(dmgX, y, barWidth * dmgPercent, barHeight * 0.38, 4); ctx.fill();

  // Damage % (skip in compact mode to avoid overlapping the bars above stocks)
  if (!compact) {
    ctx.fillStyle = '#FFF';
    ctx.shadowColor = dmgColor; ctx.shadowBlur = 10;
    ctx.font = `bold ${(16 + dmgPercent * 6) * scale}px Orbitron, sans-serif`;
    ctx.fillText(`${Math.floor(damage)}%`, side === 'left' ? dmgX : dmgX + barWidth, y + barHeight + 16 * scale);
    ctx.shadowBlur = 0;
  }

  // Stocks at the bottom
  const stockY = compact ? y + barHeight + 6 + pbH * 2 + 10 : y + barHeight + 34;
  const stockCenterX = bx + pbW + gap + stockSpan / 2;
  if (!hideStocks) {
  for (let i = 0; i < numStocks; i++) {
    const sx = stockCenterX - stockSpan / 2 + i * stockGap;
    if (i < stocks) {
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(sx, stockY, stockR, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(sx, stockY, stockR - 1, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
  }

  // Power & Super bars — with PWR/SUP labels, working charge animation
  const drawPB = (px, py, w, pct, col, label) => {
    ctx.fillStyle = '#111122'; ctx.beginPath(); ctx.roundRect(px, py, w, pbH, 3); ctx.fill();
    if (pct > 0) { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath(); ctx.roundRect(px, py, w * Math.min(pct, 1), pbH, 3); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 5px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText(label, px + w / 2, py + pbH * 0.8); ctx.textAlign = side === 'left' ? 'left' : 'right';
  };
  if (compact) {
    // >2 players: bars ABOVE stocks, full width so each stock fits without overlap
    drawPB(bx, y + barHeight + 6, totalW, powerPercent, '#44AAFF', 'PWR');
    drawPB(bx, y + barHeight + 6 + pbH + 3, totalW, superPercent, '#FFD700', 'SUP');
  } else {
    const pwrX = side === 'left' ? bx : bx + totalW - pbW;
    drawPB(pwrX, stockY - pbH / 2, pbW, powerPercent, '#44AAFF', 'PWR');
    const supX = side === 'left' ? bx + pbW + gap + stockSpan + gap : bx;
    drawPB(supX, stockY - pbH / 2, pbW, superPercent, '#FFD700', 'SUP');
  }
}

export function drawTimer(ctx, canvasWidth, seconds) {
  const urgent = seconds < 30;
  ctx.save();
  ctx.shadowColor = urgent ? '#FF4444' : '#FFFFFF';
  ctx.shadowBlur = urgent ? 18 : 6;
  ctx.fillStyle = urgent ? '#FF6666' : '#FFFFFF';
  ctx.font = `bold 32px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, canvasWidth / 2, 40);
  ctx.restore();
}

// ─── Stage / Environment ────────────────────────────────────────────────────

export function drawPlatforms(ctx, platforms, frame = 0, mapId = 'splitcity') {
  const map = STAGE_MAPS.find(m => m.id === mapId) || STAGE_MAPS[0];
  const accent = map.accentColor;
  const ground = map.groundColor;

  platforms.forEach((p, idx) => {
    const isMain = p.h >= 18;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(p.x + 5, p.y + 8, p.w, p.h, 6);
    ctx.fill();

    const mat = p.material && p.material !== 'normal' ? getMaterial(p.material) : null;
    const baseColor = mat ? mat.color : ground;
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    if (isMain) {
      grad.addColorStop(0, baseColor);
      grad.addColorStop(0.5, baseColor + 'CC');
      grad.addColorStop(1, baseColor + '88');
    } else {
      grad.addColorStop(0, baseColor + 'EE');
      grad.addColorStop(1, baseColor + 'BB');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, isMain ? 4 : 7);
    ctx.fill();

    ctx.strokeStyle = (mat ? mat.color : accent) + 'AA';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top edge glow
    const topGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
    topGrad.addColorStop(0, 'transparent');
    topGrad.addColorStop(0.3, (mat ? mat.color : accent) + '66');
    topGrad.addColorStop(0.7, (mat ? mat.color : accent) + '66');
    topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(p.x + 2, p.y, p.w - 4, 2);

    // Animated rune on main stage
    if (isMain) {
      ctx.globalAlpha = 0.1 + Math.sin(frame * 0.025 + idx) * 0.04;
      ctx.fillStyle = mat ? mat.color : accent;
      const spacing = 65;
      const count = Math.floor(p.w / spacing);
      for (let i = 0; i < count; i++) {
        const rx = p.x + spacing * (i + 0.5);
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⬡', rx, p.y + p.h * 0.68);
      }
      ctx.globalAlpha = 1;
    }
  });
}

export function drawBackground(ctx, w, h, frame = 0, mapId = 'splitcity', eventColor) {
  const map = STAGE_MAPS.find(m => m.id === mapId) || STAGE_MAPS[0];
  drawStageBackground(ctx, w, h, frame, mapId, map, eventColor);
}

function drawSplitCityBg(ctx, w, h, frame, map) {
  // City buildings
  const buildings = [
    { x: 20, bw: 80, bh: 180 }, { x: 120, bw: 60, bh: 140 },
    { x: 200, bw: 100, bh: 220 }, { x: 320, bw: 55, bh: 160 },
    { x: 420, bw: 90, bh: 200 }, { x: 540, bw: 70, bh: 170 },
    { x: 630, bw: 110, bh: 240 }, { x: 760, bw: 60, bh: 150 },
  ];
  buildings.forEach(b => {
    ctx.fillStyle = '#0a1030';
    ctx.fillRect(b.x, h - b.bh, b.bw, b.bh);
    ctx.strokeStyle = '#1a2850';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, h - b.bh, b.bw, b.bh);
    // Windows
    for (let wy = h - b.bh + 10; wy < h - 10; wy += 20) {
      for (let wx = b.x + 8; wx < b.x + b.bw - 8; wx += 16) {
        if (Math.random() > 0.3) {
          ctx.fillStyle = Math.random() > 0.5 ? '#FFD70055' : '#4466FF44';
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
  });
  // Stars
  for (let i = 0; i < 70; i++) {
    const sx = ((i * 137 + frame * 0.04) % w);
    const sy = (i * 79) % (h * 0.6);
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Split city energy crack in sky
  ctx.strokeStyle = map.accentColor + '33';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.lineTo(w * 0.5 + 20, h * 0.6);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawMansionBg(ctx, w, h, frame, map) {
  // Mansion silhouette
  ctx.fillStyle = '#08080f';
  const mx = w / 2 - 120, mw = 240, mh = 200;
  ctx.fillRect(mx, h - mh, mw, mh);
  // Towers
  ctx.fillRect(mx - 30, h - mh - 60, 50, mh + 60);
  ctx.fillRect(mx + mw - 20, h - mh - 60, 50, mh + 60);
  // Moon
  ctx.fillStyle = '#DDDDEE';
  ctx.shadowColor = '#AAAACC';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(w * 0.75, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Stars
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 113 + frame * 0.03) % w);
    const sy = (i * 61) % (h * 0.55);
    ctx.fillStyle = 'rgba(220,220,255,0.35)';
    ctx.beginPath();
    ctx.arc(sx, sy, 0.7 + (i % 3) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawForestBg(ctx, w, h, frame, map) {
  // Dark trees
  for (let i = 0; i < 12; i++) {
    const tx = (i * 70 + 20) % w;
    const th = 100 + (i * 37) % 80;
    ctx.fillStyle = '#071505';
    ctx.fillRect(tx + 18, h - th, 10, th);
    ctx.fillStyle = '#0d2a08';
    ctx.beginPath();
    ctx.arc(tx + 23, h - th - 25, 28, 0, Math.PI * 2);
    ctx.fill();
  }
  // Creepy glow
  ctx.fillStyle = '#0A0A2A33';
  for (let i = 0; i < 3; i++) {
    const nx = (i * 260 + frame * 0.04 * (i + 1)) % (w + 200) - 100;
    const grad = ctx.createRadialGradient(nx, h * 0.5, 5, nx, h * 0.5, 120);
    grad.addColorStop(0, '#0A0A2A44');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(nx, h * 0.5, 140, 70, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrainingBg(ctx, w, h, frame, map) {
  // Training grid
  ctx.strokeStyle = '#3a3000';
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx < w; gx += 50) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += 50) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }
  // Sun
  const sunX = w * 0.2, sunY = 60;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Banners
  for (let i = 0; i < 4; i++) {
    const bx = i * 220 + 80;
    ctx.fillStyle = '#FFD70044';
    ctx.fillRect(bx, 0, 14, 60 + Math.sin(frame * 0.05 + i) * 8);
  }
}

function drawVoidBg(ctx, w, h, frame, map) {
  // Void swirls
  for (let i = 0; i < 5; i++) {
    const vx = (i * 170 + frame * 0.08 * (i % 2 === 0 ? 1 : -1)) % (w + 200) - 100;
    const vy = h * (0.2 + i * 0.12);
    const grad = ctx.createRadialGradient(vx, vy, 5, vx, vy, 100);
    grad.addColorStop(0, '#7700AA22');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(vx, vy, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stars / void particles
  for (let i = 0; i < 50; i++) {
    const sx = ((i * 177 + frame * 0.06) % w);
    const sy = (i * 97) % h;
    ctx.fillStyle = i % 5 === 0 ? '#CC00FF55' : 'rgba(180,100,255,0.3)';
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Hit Effect / Sparks ────────────────────────────────────────────────────

export function drawHitSparks(ctx, x, y, color, frame, spawnFrame) {
  const age = frame - spawnFrame;
  if (age > 22) return false;
  const t = age / 22;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 35 * t;
    ctx.fillStyle = i % 2 === 0 ? color : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist * 0.65, 4.5 * (1 - t), 0, Math.PI * 2);
    ctx.fill();
  }
  // Star burst center
  ctx.fillStyle = '#FFF';
  ctx.globalAlpha = (1 - t) * 0.7;
  ctx.beginPath();
  ctx.arc(x, y, 7 * (1 - t), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  return true;
}