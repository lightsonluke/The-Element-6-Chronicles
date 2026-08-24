// Cosmetic accessories — decoration only, NO gameplay effect.
// Bought with Element 6 tokens (coins). Equipped per character.
// Some accessories are exclusive to a specific character (exclusiveTo field).
// drawAccessory renders a visual flourish on a stickman at screen (x,y) baseline.

import { getCharNumber, getCharName } from './characterNumber.js';
import { getEventAccessory, getEventBattlePassAccessory } from './events.js';
import { getLimbPose } from './renderer.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { EXTRA_JERSEYS } from './sportsJerseys.js';
import { UNIVERSAL_ACCESSORIES } from './universalAccessories.js';

export const ACCESSORIES = [
  // ── Generic auras ──
  { id: 'aura_gold',    name: 'Golden Aura',      price: 50,  type: 'aura',     color: '#FFD700' },
  { id: 'aura_cyan',    name: 'Cyan Aura',        price: 50,  type: 'aura',     color: '#00FFFF' },
  { id: 'aura_magenta', name: 'Magenta Aura',     price: 50,  type: 'aura',     color: '#FF00FF' },
  { id: 'aura_rainbow', name: 'Rainbow Aura',     price: 200, type: 'rainbow',  color: '#FFFFFF' },
  { id: 'aura_dark',    name: 'Shadow Aura',      price: 80,  type: 'aura',     color: '#220033' },
  { id: 'aura_white',   name: 'Holy Aura',        price: 90,  type: 'aura',     color: '#FFFFFF' },

  // ── Generic effects ──
  { id: 'shadow',       name: 'Shadow Trail',     price: 80,  type: 'shadow',   color: '#660066' },
  { id: 'sparkles',     name: 'Sparkles',         price: 60,  type: 'sparkles', color: '#FFFF88' },
  { id: 'crown',        name: 'Champion Crown',   price: 120, type: 'crown',    color: '#FFD700' },
  { id: 'wings',        name: 'Spirit Wings',     price: 200, type: 'wings',    color: '#FFFFFF' },
  { id: 'halo',         name: 'Angel Halo',       price: 150, type: 'halo',     color: '#FFEEAA' },
  { id: 'horns',        name: 'Demon Horns',      price: 130, type: 'horns',    color: '#AA2222' },
  { id: 'cape',         name: 'Hero Cape',        price: 110, type: 'cape',     color: '#4466FF' },
  { id: 'scarf',        name: 'Mystic Scarf',     price: 90,  type: 'scarf',    color: '#FF8800' },
  { id: 'flower',       name: 'Flower Crown',     price: 70,  type: 'flower',   color: '#FF66AA' },
  { id: 'comet',        name: 'Comet Trail',      price: 140, type: 'comet',    color: '#FFAA22' },
  { id: 'bubble',       name: 'Energy Bubble',    price: 160, type: 'bubble',   color: '#88CCFF' },
  { id: 'crystals',     name: 'Crystal Shards',   price: 120, type: 'crystals', color: '#AAEEFF' },
  { id: 'lightning',    name: 'Lightning Bolt',   price: 130, type: 'lightning',color: '#FFFF44' },
  { id: 'star',         name: 'Shining Star',     price: 100, type: 'star',     color: '#FFDD44' },
  { id: 'mist',         name: 'Mystic Mist',      price: 80,  type: 'mist',     color: '#AA88FF' },

  // ── Character-exclusive (lore-based) ──
  { id: 'puppet_strings', name: "Puppet Strings",  price: 300, type: 'puppet',   color: '#CC8844', exclusiveTo: 'controller' },
  { id: 'clock',          name: "Copper's Clock",  price: 250, type: 'clock',    color: '#CC7733', exclusiveTo: 'copper' },
  { id: 'inferno',        name: "Eternal Flame",   price: 280, type: 'flame',    color: '#FF3322', exclusiveTo: 'red' },
  { id: 'beam_aura',      name: "Element 6 Beam",  price: 320, type: 'beam',     color: '#FF2222', exclusiveTo: 'crimson' },
  { id: 'grav_rings',     name: "Gravity Rings",   price: 260, type: 'grav',     color: '#4B0082', exclusiveTo: 'indigo' },
  { id: 'phantom',        name: "Phantom Phase",   price: 270, type: 'phantom',  color: '#44DDAA', exclusiveTo: 'emerald' },
  { id: 'clone_echo',     name: "Clone Echo",      price: 250, type: 'clone',    color: '#CCAA77', exclusiveTo: 'amber' },
  { id: 'blindfold',      name: "Sixth Sense",     price: 240, type: 'blindfold',color: '#FFEECC', exclusiveTo: 'pearl' },
  { id: 'metal',          name: "Living Metal",    price: 260, type: 'metal',    color: '#C0C0C0', exclusiveTo: 'silver' },
  { id: 'thunder_crown',  name: "Thunder Crown",   price: 300, type: 'thunder',  color: '#FFFF44', exclusiveTo: 'black' },
  { id: 'speed_trail',    name: "Speed Trail",     price: 230, type: 'speed',    color: '#FFD700', exclusiveTo: 'yellow' },
  { id: 'water_orbs',     name: "Tidal Orbs",      price: 220, type: 'water',    color: '#4488FF', exclusiveTo: 'blue' },
  { id: 'stone_pillar',   name: "Stone Mantle",   price: 210, type: 'stone',    color: '#44AA44', exclusiveTo: 'green' },
  { id: 'tk_debris',      name: "Telekinetic Debris", price: 230, type: 'tk',     color: '#FF66AA', exclusiveTo: 'pink' },
  { id: 'spirit_echo',     name: "Spirit Echo",    price: 240, type: 'spirit',    color: '#8844AA', exclusiveTo: 'scarlet' },
  { id: 'adhesive',       name: "Adhesive Web",   price: 220, type: 'web',      color: '#FF77CC', exclusiveTo: 'magenta' },
  { id: 'light_wings',    name: "Light Wings",    price: 280, type: 'lwings',    color: '#EEEEEE', exclusiveTo: 'white' },
  { id: 'portal_glow',    name: "Portal Glow",    price: 230, type: 'portal',    color: '#FF8800', exclusiveTo: 'orange' },

  // ── Soccer Kits (character-exclusive) ── one per character, wearable in any battle
  { id: 'jersey_yellow',     name: 'Yellow Soccer Kit',     price: 150, type: 'soccer_kit', color: '#FFD700', exclusiveTo: 'yellow' },
  { id: 'jersey_blue',       name: 'Blue Soccer Kit',       price: 150, type: 'soccer_kit', color: '#4488FF', exclusiveTo: 'blue' },
  { id: 'jersey_purple',     name: 'Purple Soccer Kit',     price: 150, type: 'soccer_kit', color: '#9944CC', exclusiveTo: 'purple' },
  { id: 'jersey_orange',     name: 'Orange Soccer Kit',     price: 150, type: 'soccer_kit', color: '#FF8800', exclusiveTo: 'orange' },
  { id: 'jersey_green',      name: 'Green Soccer Kit',      price: 150, type: 'soccer_kit', color: '#44AA44', exclusiveTo: 'green' },
  { id: 'jersey_pink',       name: 'Pink Soccer Kit',       price: 150, type: 'soccer_kit', color: '#FF66AA', exclusiveTo: 'pink' },
  { id: 'jersey_grey',       name: 'Grey Soccer Kit',       price: 150, type: 'soccer_kit', color: '#888888', exclusiveTo: 'grey' },
  { id: 'jersey_turquoise',  name: 'Turquoise Soccer Kit',  price: 150, type: 'soccer_kit', color: '#44CCAA', exclusiveTo: 'turquoise' },
  { id: 'jersey_olive',      name: 'Olive Soccer Kit',      price: 150, type: 'soccer_kit', color: '#808000', exclusiveTo: 'olive' },
  { id: 'jersey_copper',     name: 'Copper Soccer Kit',     price: 150, type: 'soccer_kit', color: '#CC7744', exclusiveTo: 'copper' },
  { id: 'jersey_emerald',    name: 'Emerald Soccer Kit',    price: 150, type: 'soccer_kit', color: '#33CC66', exclusiveTo: 'emerald' },
  { id: 'jersey_pearl',      name: 'Pearl Soccer Kit',      price: 150, type: 'soccer_kit', color: '#EEEEDD', exclusiveTo: 'pearl' },
  { id: 'jersey_red',        name: 'Red Soccer Kit',        price: 150, type: 'soccer_kit', color: '#FF3333', exclusiveTo: 'red' },
  { id: 'jersey_lavender',   name: 'Lavender Soccer Kit',   price: 150, type: 'soccer_kit', color: '#BB88DD', exclusiveTo: 'lavender' },
  { id: 'jersey_amber',     name: 'Amber Soccer Kit',      price: 150, type: 'soccer_kit', color: '#FFBB33', exclusiveTo: 'amber' },
  { id: 'jersey_black',      name: 'Black Soccer Kit',      price: 150, type: 'soccer_kit', color: '#333333', exclusiveTo: 'black' },
  { id: 'jersey_magenta',    name: 'Magenta Soccer Kit',    price: 150, type: 'soccer_kit', color: '#FF44AA', exclusiveTo: 'magenta' },
  { id: 'jersey_indigo',    name: 'Indigo Soccer Kit',     price: 150, type: 'soccer_kit', color: '#4B0082', exclusiveTo: 'indigo' },
  { id: 'jersey_maroon',    name: 'Maroon Soccer Kit',     price: 150, type: 'soccer_kit', color: '#800000', exclusiveTo: 'maroon' },
  { id: 'jersey_crimson',   name: 'Crimson Soccer Kit',    price: 150, type: 'soccer_kit', color: '#DC143C', exclusiveTo: 'crimson' },
  { id: 'jersey_scarlet',   name: 'Scarlet Soccer Kit',    price: 150, type: 'soccer_kit', color: '#FF2400', exclusiveTo: 'scarlet' },
  { id: 'jersey_white',    name: 'White Soccer Kit',       price: 150, type: 'soccer_kit', color: '#EEEEEE', exclusiveTo: 'white' },
  { id: 'jersey_silver',   name: 'Silver Soccer Kit',      price: 150, type: 'soccer_kit', color: '#C0C0C0', exclusiveTo: 'silver' },
  // Villains
  { id: 'jersey_corpent',    name: 'Corpent Soccer Kit',    price: 150, type: 'soccer_kit', color: '#775533', exclusiveTo: 'corpent' },
  { id: 'jersey_magneto',    name: 'Magneto Soccer Kit',    price: 150, type: 'soccer_kit', color: '#AAAAAA', exclusiveTo: 'magneto' },
  { id: 'jersey_willow',     name: 'Willow Soccer Kit',     price: 150, type: 'soccer_kit', color: '#448833', exclusiveTo: 'willow' },
  { id: 'jersey_cable',      name: 'Cable Soccer Kit',      price: 150, type: 'soccer_kit', color: '#4488CC', exclusiveTo: 'cable' },
  { id: 'jersey_snodvor',    name: 'Snodvor Soccer Kit',    price: 150, type: 'soccer_kit', color: '#AADDFF', exclusiveTo: 'snodvor' },
  { id: 'jersey_kirsten',    name: 'Kirsten Soccer Kit',    price: 150, type: 'soccer_kit', color: '#FF4400', exclusiveTo: 'kirsten' },
  { id: 'jersey_volt',       name: 'Volt Soccer Kit',       price: 150, type: 'soccer_kit', color: '#CCAA00', exclusiveTo: 'volt' },
  { id: 'jersey_temple',     name: 'Temple Soccer Kit',     price: 150, type: 'soccer_kit', color: '#AA6633', exclusiveTo: 'temple' },
  { id: 'jersey_nightmare',  name: 'Nightmare Soccer Kit',  price: 150, type: 'soccer_kit', color: '#442266', exclusiveTo: 'nightmare' },
  { id: 'jersey_hazel',      name: 'Hazel Soccer Kit',      price: 150, type: 'soccer_kit', color: '#2D5A1B', exclusiveTo: 'hazel' },
  { id: 'jersey_whami',      name: 'Whami Soccer Kit',       price: 150, type: 'soccer_kit', color: '#F5DEB3', exclusiveTo: 'whami' },
  { id: 'jersey_controller', name: 'Controller Soccer Kit', price: 150, type: 'soccer_kit', color: '#1A1A6A', exclusiveTo: 'controller' },
  { id: 'jersey_evil',       name: 'Evil Soccer Kit',        price: 150, type: 'soccer_kit', color: '#7700AA', exclusiveTo: 'evil' },
  // Guardians
  { id: 'jersey_life',       name: 'Life Soccer Kit',        price: 150, type: 'soccer_kit', color: '#44FF44', exclusiveTo: 'life' },
  { id: 'jersey_death',      name: 'Death Soccer Kit',       price: 150, type: 'soccer_kit', color: '#AAAAAA', exclusiveTo: 'death' },
  { id: 'jersey_mercy',      name: 'Mercy Soccer Kit',        price: 150, type: 'soccer_kit', color: '#FF99DD', exclusiveTo: 'mercy' },
  ];

  // Auto-generate exclusive accessories for every character (headband, gloves, shoes, cape)
  // Each character gets at least 5 exclusive accessories total (jersey + 4 here + any lore items)
  const _ALL_CHARS_FOR_ACC = [...HEROES, ...VILLAINS, ...GUARDIANS];
  _ALL_CHARS_FOR_ACC.forEach(c => {
  ACCESSORIES.push(
   { id: `acc_${c.id}_headband`, name: `${c.name} Headband`, price: 80, type: 'headband', color: c.color, exclusiveTo: c.id },
   { id: `acc_${c.id}_gloves`, name: `${c.name} Gloves`, price: 80, type: 'gloves', color: c.color, exclusiveTo: c.id },
   { id: `acc_${c.id}_shoes`, name: `${c.name} Shoes`, price: 80, type: 'shoes', color: c.color, exclusiveTo: c.id },
   { id: `acc_${c.id}_cape`, name: `${c.name} Cape`, price: 100, type: 'cape', color: c.color, exclusiveTo: c.id },
   { id: `vkit_${c.id}`, name: `${c.name} Volleyball Kit`, price: 150, type: 'volleyball_kit', color: c.color, exclusiveTo: c.id },
    { id: `bkit_${c.id}`, name: `${c.name} Baseball Kit`, price: 150, type: 'baseball_kit', color: c.color, exclusiveTo: c.id },
   );
   });

   // Basketball, Tennis, and Track jerseys for every character
   EXTRA_JERSEYS.forEach(j => ACCESSORIES.push(j));

   // Universal accessories (former skin-unique parts) — available to ALL characters
   UNIVERSAL_ACCESSORIES.forEach(a => ACCESSORIES.push(a));

  // Price bump — all shop items cost 50 more tokens
  ACCESSORIES.forEach(a => { if (a.price > 0) a.price += 50; });

  export function getAccessory(id) {
  const acc = ACCESSORIES.find(a => a.id === id);
  if (acc) return acc;
  return getEventAccessory(id) || getEventBattlePassAccessory(id);
}

// Returns accessories available for a given character.
// ALL accessories are available to EVERY character (gens 1–5) — the exclusiveTo
// field is now ignored for shop availability.
export function accessoriesFor(charId) {
  return ACCESSORIES;
}

// Returns the list of equipped accessories for a character as accessory objects.
// Supports the new array format (up to 4) and the legacy single-string format.
export function getEquippedAccessories(equippedAccessories, charId) {
  const val = equippedAccessories?.[charId];
  if (!val) return [];
  if (Array.isArray(val)) return val.map(id => getAccessory(id)).filter(Boolean);
  const acc = getAccessory(val);
  return acc ? [acc] : [];
}

// Returns the array of equipped accessory IDs for a character.
export function getEquippedAccessoryIds(equippedAccessories, charId) {
  const val = equippedAccessories?.[charId];
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

// Draws all equipped accessories for one layer ('behind' or front).
export function drawEquippedAccessoriesLayer(ctx, x, y, accessories, char, frame, scale, state, facing, powerActive, behind, emote = null) {
  for (const acc of accessories) {
    if (!acc) continue;
    if (isBehindAccessory(acc.type) === behind) {
      drawAccessory(ctx, x, y, acc.type, resolveAccColor(acc, char), frame, scale, char?.id || '', state, facing, powerActive, emote);
    }
  }
}

// Resolves the render color for an accessory on a given character.
// Universal accessories use colorMode ('main' | 'accent') → character's main or
// secondary color. Accessories without colorMode keep their fixed color.
export function resolveAccColor(acc, char) {
  if (!acc) return null;
  if (acc.colorMode && char) {
    return acc.colorMode === 'accent' ? (char.secondaryColor || char.color) : char.color;
  }
  return acc.color;
}

// Draws a full soccer kit (jersey + shorts) on a stickman at (x, y) baseline.
// Jersey shows H.O.C., character name, and character number. Shorts match color + number.
// Jersey + shorts now track the character's actual animated limbs (bob, lean, arm + leg swing).
export function drawSoccerKit(ctx, x, y, color, charId, frame = 0, scale = 1, state = 'idle', facing = 1, powerActive = null, emote = null) {
  const pose = getLimbPose(frame, state, facing, scale, powerActive, emote);
  const s = pose.s;
  const charNum = getCharNumber(charId);
  const charName = getCharName(charId);
  const numStr = charNum != null ? String(charNum) : '6';
  const nameStr = (charName || 'H.O.C.').slice(0, 8).toUpperCase();

  const torsoTopY = pose.torsoTopY;
  const hipY = pose.hipY;
  const jW = s * 0.72;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(pose.lean);

  // ── Jersey (torso) ──
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-jW / 2, torsoTopY, jW, hipY - torsoTopY, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-jW / 2, torsoTopY, jW, 2);
  ctx.fillRect(-jW / 2, torsoTopY, 3, hipY - torsoTopY);
  ctx.fillRect(jW / 2 - 3, torsoTopY, 3, hipY - torsoTopY);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${Math.max(5, Math.floor(s * 0.17))}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('H.O.C.', 0, torsoTopY + s * 0.22);
  ctx.font = `${Math.max(4, Math.floor(s * 0.12))}px Rajdhani, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(nameStr, 0, torsoTopY + s * 0.36);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.max(7, Math.floor(s * 0.34))}px Orbitron, sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 2;
  ctx.fillText(numStr, 0, torsoTopY + s * 0.68);
  ctx.shadowBlur = 0;

  // ── Sleeves ── attached at shoulders, rotate with the arm swing
  const drawSleeve = (sx, sy, angle) => {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-s * 0.12, 0, s * 0.24, s * 0.22, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-s * 0.12, 0, s * 0.24, 2);
    ctx.restore();
  };
  drawSleeve(pose.shoulders.left.x, pose.shoulders.left.y, pose.armAngleL);
  drawSleeve(pose.shoulders.right.x, pose.shoulders.right.y, pose.armAngleR);

  // ── Shorts ── split L/R, each leg swings with the thigh
  const drawShort = (hx, hy, angle) => {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-s * 0.14, 0, s * 0.28, s * 0.22, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-s * 0.14, 0, 2, s * 0.22);
    ctx.fillRect(s * 0.12, 0, 2, s * 0.22);
    ctx.restore();
  };
  drawShort(pose.hips.left.x, pose.hips.left.y, pose.legAngleL);
  drawShort(pose.hips.right.x, pose.hips.right.y, pose.legAngleR);

  ctx.restore();
}

export function drawAccessory(ctx, x, y, type, color, frame = 0, scale = 1, charId = '', state = 'idle', facing = 1, powerActive = null, emote = null) {
  if (!type) return;
  // colorMode (universal) accessories have no fixed color; callers that don't
  // resolve against a character pass undefined here. Default to a neutral
  // shade so gradient stops like `color + '88'` never produce "undefined88".
  if (!color) color = '#CCCCCC';
  const t = frame * 0.05;
  const pose = getLimbPose(frame, state, facing, scale, powerActive, emote);
  const s = pose.s;
  // Body part positions — now follow the actual animated limbs (bob/lean/swing)
  const headR = pose.headR;
  const headY = y + pose.head.y;
  const headTopY = headY - headR;
  const torsoTopY = y + pose.torsoTopY;
  const torsoCY = y + pose.torsoCY;
  const hipY = y + pose.hipY;
  const shoulderY = y + pose.shoulderY;
  const feetY = y + pose.feetY;
  // Limb endpoints — accessories attach here so they raise/move with arms & legs
  const handL = { x: x + pose.hands.left.x, y: y + pose.hands.left.y };
  const handR = { x: x + pose.hands.right.x, y: y + pose.hands.right.y };
  const footL = { x: x + pose.feet.left.x, y: y + pose.feet.left.y };
  const footR = { x: x + pose.feet.right.x, y: y + pose.feet.right.y };
  const kneeL = { x: x + pose.knees.left.x, y: y + pose.knees.left.y };
  const kneeR = { x: x + pose.knees.right.x, y: y + pose.knees.right.y };
  const shoulderL = { x: x + pose.shoulders.left.x, y: y + pose.shoulders.left.y };
  const shoulderR = { x: x + pose.shoulders.right.x, y: y + pose.shoulders.right.y };
  const elbowL = { x: x + pose.elbows.left.x, y: y + pose.elbows.left.y };
  const elbowR = { x: x + pose.elbows.right.x, y: y + pose.elbows.right.y };

  // ── Skin custom part types (unique to skins, not in shop) ──
  if (type === 'headband') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.9;
    const bw = s * 0.6;
    ctx.fillRect(x - bw / 2, headY - s * 0.06, bw, s * 0.08);
    ctx.fillStyle = color + 'AA';
    ctx.fillRect(x - bw / 2 - s * 0.04, headY - s * 0.08, s * 0.06, s * 0.12);
    ctx.restore();
  } else if (type === 'baton') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(x + s * 0.28, torsoCY); ctx.lineTo(x + s * 0.55, torsoCY - s * 0.2); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + s * 0.55, torsoCY - s * 0.2, s * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'shoes') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.roundRect(footL.x - s * 0.1, footL.y - s * 0.04, s * 0.2, s * 0.1, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(footR.x - s * 0.1, footR.y - s * 0.04, s * 0.2, s * 0.1, 3); ctx.fill();
    ctx.restore();
  } else if (type === 'flippers') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.ellipse(footL.x, footL.y - s * 0.02, s * 0.16, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(footR.x, footR.y - s * 0.02, s * 0.16, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'sunglasses' || type === 'visor' || type === 'visors' || type === 'laser_visors') {
    // Sunglasses — replaces old visors with cool shades
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.shadowColor = color; ctx.shadowBlur = 4;
    // Left lens
    ctx.beginPath(); ctx.roundRect(x - s * 0.28, headY - s * 0.03, s * 0.2, s * 0.12, 3); ctx.fill();
    // Right lens
    ctx.beginPath(); ctx.roundRect(x + s * 0.08, headY - s * 0.03, s * 0.2, s * 0.12, 3); ctx.fill();
    // Bridge
    ctx.fillRect(x - s * 0.08, headY - s * 0.01, s * 0.16, s * 0.04);
    // Highlight on lenses
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(x - s * 0.25, headY - s * 0.02, s * 0.06, s * 0.04, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + s * 0.11, headY - s * 0.02, s * 0.06, s * 0.04, 2); ctx.fill();
    ctx.restore();
  } else if (type === 'goggles') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(x - s * 0.14, headY, s * 0.12, s * 0.1, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + s * 0.14, headY, s * 0.12, s * 0.1, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.02, headY); ctx.lineTo(x + s * 0.02, headY); ctx.stroke();
    ctx.restore();
  } else if (type === 'gloves') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(handL.x, handL.y, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(handR.x, handR.y, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'mask') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.65;
    const mw = s * 0.5;
    ctx.beginPath(); ctx.roundRect(x - mw / 2, headY - s * 0.06, mw, s * 0.2, 4); ctx.fill();
    ctx.fillStyle = color + '66';
    ctx.beginPath(); ctx.arc(x - s * 0.11, headY + s * 0.03, s * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.11, headY + s * 0.03, s * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'helmet') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(x, headY, headR + s * 0.06, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - headR - s * 0.06, headY - s * 0.02, s * 0.06, s * 0.14);
    ctx.fillRect(x + headR, headY - s * 0.02, s * 0.06, s * 0.14);
    ctx.restore();
  } else if (type === 'pauldrons') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.ellipse(shoulderL.x, shoulderL.y, s * 0.16, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(shoulderR.x, shoulderR.y, s * 0.16, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'armguards') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.roundRect(elbowL.x - s * 0.05, elbowL.y - s * 0.09, s * 0.1, s * 0.18, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(elbowR.x - s * 0.05, elbowR.y - s * 0.09, s * 0.1, s * 0.18, 3); ctx.fill();
    ctx.restore();
  } else if (type === 'kneepads') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.ellipse(kneeL.x, kneeL.y, s * 0.1, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(kneeR.x, kneeR.y, s * 0.1, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'belt') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.9;
    ctx.fillRect(x - s * 0.3, hipY - s * 0.04, s * 0.6, s * 0.08);
    ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(x, hipY, s * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'backpack') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.roundRect(x - s * 0.22, torsoCY - s * 0.1, s * 0.44, s * 0.5, 6); ctx.fill();
    ctx.restore();
  } else if (type === 'cape_long') {
    ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = color;
    const sway = Math.sin(frame * 0.06) * s * 0.14;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, shoulderY); ctx.lineTo(x + s * 0.2, shoulderY);
    ctx.lineTo(x + s * 0.32 + sway, feetY + s * 0.05); ctx.lineTo(x - s * 0.32 + sway, feetY + s * 0.05); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (type === 'scarf_long') {
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = color;
    const sway = Math.sin(frame * 0.07) * s * 0.12;
    ctx.beginPath(); ctx.ellipse(x, torsoTopY + s * 0.06, s * 0.35, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + s * 0.12, torsoTopY + s * 0.06, s * 0.12, s * 0.55 + sway);
    ctx.restore();
  } else if (type === 'weapon_back') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(x - s * 0.2, shoulderY); ctx.lineTo(x - s * 0.35, feetY - s * 0.1); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x - s * 0.2, shoulderY, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'crown_jewel') {
    ctx.fillStyle = color;
    const cs = s * 0.24;
    ctx.beginPath();
    ctx.moveTo(x - cs, headTopY); ctx.lineTo(x - cs, headTopY - cs); ctx.lineTo(x - cs * 0.5, headTopY - cs * 0.5);
    ctx.lineTo(x, headTopY - cs); ctx.lineTo(x + cs * 0.5, headTopY - cs * 0.5); ctx.lineTo(x + cs, headTopY - cs);
    ctx.lineTo(x + cs, headTopY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, headTopY - cs * 0.6, s * 0.05, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'graveyard_crown') {
    ctx.save();
    ctx.fillStyle = '#330000';
    const gcs = s * 0.24;
    ctx.beginPath();
    ctx.moveTo(x - gcs, headTopY); ctx.lineTo(x - gcs, headTopY - gcs); ctx.lineTo(x - gcs * 0.5, headTopY - gcs * 0.5);
    ctx.lineTo(x, headTopY - gcs); ctx.lineTo(x + gcs * 0.5, headTopY - gcs * 0.5); ctx.lineTo(x + gcs, headTopY - gcs);
    ctx.lineTo(x + gcs, headTopY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#DC143C'; ctx.shadowColor = '#DC143C'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(x, headTopY - gcs * 0.4, gcs * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'halo_ring') {
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.ellipse(x, headTopY - s * 0.08, s * 0.48, s * 0.15, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'horns_spike') {
    ctx.fillStyle = color;
    const hs = s * 0.4;
    ctx.beginPath(); ctx.moveTo(x - hs * 0.15, headTopY + s * 0.02); ctx.lineTo(x - hs * 0.45, headTopY - hs * 0.6); ctx.lineTo(x - hs * 0.05, headTopY + s * 0.02); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + hs * 0.15, headTopY + s * 0.02); ctx.lineTo(x + hs * 0.45, headTopY - hs * 0.6); ctx.lineTo(x + hs * 0.05, headTopY + s * 0.02); ctx.fill();
  } else if (type === 'wings_energy') {
    ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
    const flap = Math.sin(frame * 0.08) * 0.18;
    ctx.beginPath(); ctx.ellipse(x - s * 0.42, torsoCY, s * 0.3, s * 0.48, 0.4 + flap, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.42, torsoCY, s * 0.3, s * 0.48, -0.4 - flap, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'claw_gauntlets') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.roundRect(handL.x - s * 0.09, handL.y - s * 0.09, s * 0.18, s * 0.18, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(handR.x - s * 0.09, handR.y - s * 0.09, s * 0.18, s * 0.18, 3); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(handL.x - s * 0.06 + i * s * 0.06, handL.y + s * 0.09); ctx.lineTo(handL.x - s * 0.06 + i * s * 0.06, handL.y + s * 0.17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(handR.x - s * 0.06 + i * s * 0.06, handR.y + s * 0.09); ctx.lineTo(handR.x - s * 0.06 + i * s * 0.06, handR.y + s * 0.17); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'rocket_boots') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.roundRect(footL.x - s * 0.1, footL.y - s * 0.1, s * 0.2, s * 0.14, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(footR.x - s * 0.1, footR.y - s * 0.1, s * 0.2, s * 0.14, 3); ctx.fill();
    if (Math.floor(frame / 3) % 2 === 0) {
      ctx.fillStyle = '#FF4422'; ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(footL.x, footL.y + s * 0.04, s * 0.06, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(footR.x, footR.y + s * 0.04, s * 0.06, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  } else if (type === 'gravity_boots') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.roundRect(footL.x - s * 0.1, footL.y - s * 0.08, s * 0.2, s * 0.12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(footR.x - s * 0.1, footR.y - s * 0.08, s * 0.2, s * 0.12, 3); ctx.fill();
    ctx.globalAlpha = 0.4 + Math.sin(frame * 0.1) * 0.2;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    for (let r = 0; r < 2; r++) {
      ctx.beginPath(); ctx.ellipse(x, feetY - s * 0.04, s * (0.3 + r * 0.12), s * (0.08 + r * 0.04), 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'time_dial') {
    ctx.save();
    const cx = x + s * 0.42, cy = torsoCY - s * 0.1;
    const cr = s * 0.17;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#332211'; ctx.beginPath(); ctx.arc(cx, cy, cr * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
    const ha = frame * 0.04;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * cr * 0.6, cy + Math.sin(ha) * cr * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha * 0.2) * cr * 0.4, cy + Math.sin(ha * 0.2) * cr * 0.4); ctx.stroke();
    ctx.restore();
  } else if (type === 'shadow_cloak') {
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = color;
    const sway = Math.sin(frame * 0.05) * s * 0.08;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.28, shoulderY - s * 0.05); ctx.lineTo(x + s * 0.28, shoulderY - s * 0.05);
    ctx.lineTo(x + s * 0.36 + sway, feetY); ctx.lineTo(x - s * 0.36 + sway, feetY); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (type === 'ice_crystals') {
    for (let i = 0; i < 5; i++) {
      const a = t + i * 1.26;
      const sx = x + Math.cos(a) * s * 0.5, sy = torsoCY + Math.sin(a) * s * 0.35;
      ctx.fillStyle = color; ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy - s * 0.12); ctx.lineTo(sx + s * 0.07, sy); ctx.lineTo(sx, sy + s * 0.12); ctx.lineTo(sx - s * 0.07, sy); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (type === 'flame_crown') {
    ctx.save(); ctx.globalAlpha = 0.7;
    for (let i = 0; i < 5; i++) {
      const fx = x + (i - 2) * s * 0.12;
      const fh = s * 0.22 + Math.sin(frame * 0.2 + i) * s * 0.1;
      ctx.fillStyle = i % 2 === 0 ? color : '#FFAA22';
      ctx.beginPath();
      ctx.moveTo(fx, headTopY); ctx.quadraticCurveTo(fx + s * 0.06, headTopY - fh / 2, fx, headTopY - fh);
      ctx.quadraticCurveTo(fx - s * 0.06, headTopY - fh / 2, fx, headTopY); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'vine_bracers') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.roundRect(elbowL.x - s * 0.05, elbowL.y - s * 0.1, s * 0.1, s * 0.2, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(elbowR.x - s * 0.05, elbowR.y - s * 0.1, s * 0.1, s * 0.2, 3); ctx.fill();
    ctx.strokeStyle = '#448833'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(elbowL.x, elbowL.y); ctx.lineTo(elbowL.x + s * 0.04, elbowL.y + s * 0.18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(elbowR.x, elbowR.y); ctx.lineTo(elbowR.x + s * 0.04, elbowR.y + s * 0.18); ctx.stroke();
    ctx.restore();
  } else if (type === 'sonic_rings') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const rr = s * 0.4 + i * s * 0.15 + Math.sin(frame * 0.1 + i) * s * 0.06;
      ctx.globalAlpha = 0.3 - i * 0.08;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, torsoCY, rr, rr * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'mind_halo') {
    ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(frame * 0.1) * 0.15;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, headY, headR + s * 0.15, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'web_spinner') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame * 0.02;
      ctx.beginPath(); ctx.moveTo(x, torsoCY); ctx.lineTo(x + Math.cos(a) * s * 0.5, torsoCY + Math.sin(a) * s * 0.33); ctx.stroke();
    }
    for (let r = 1; r <= 2; r++) {
      ctx.beginPath(); ctx.ellipse(x, torsoCY, r * s * 0.18, r * s * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'void_tendrils') {
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const a = t + i * 1.57;
      const len = s * 0.4 + Math.sin(frame * 0.08 + i) * s * 0.1;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, torsoCY);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5, torsoCY + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, torsoCY + Math.sin(a) * len); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'soul_chains') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const yOff = i * s * 0.12 - s * 0.2;
      ctx.beginPath(); ctx.ellipse(x, torsoCY + yOff, s * 0.22, s * 0.05, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'angel_feathers') {
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const a = frame * 0.03 + i * 1.05;
      const fx = x + Math.cos(a) * s * 0.55, fy = torsoCY + Math.sin(a) * s * 0.4;
      ctx.beginPath(); ctx.ellipse(fx, fy, s * 0.04, s * 0.08, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'chrome_armor') {
    ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1;
    const g = ctx.createLinearGradient(x - s * 0.35, torsoCY, x + s * 0.35, feetY);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, color + '88'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(x - s * 0.35, torsoCY - s * 0.05, s * 0.7, s * 0.7);
    ctx.restore();
  } else if (type === 'venom_drip') {
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const dx = x + (i - 1.5) * s * 0.15;
      const drip = (frame * 0.5 + i * 10) % (s * 0.5);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(dx, torsoCY + drip, s * 0.03, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'blindfold') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    const bw = s * 0.56;
    ctx.fillRect(x - bw / 2, headY - s * 0.03, bw, s * 0.11);
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - bw / 2, headY + s * 0.03); ctx.lineTo(x - s * 0.44, headY + s * 0.14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + bw / 2, headY + s * 0.03); ctx.lineTo(x + s * 0.44, headY + s * 0.14); ctx.stroke();
    ctx.restore();
  } else if (type === 'clone_echo') {
    ctx.save();
    for (let i = 1; i <= 2; i++) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x - i * s * 0.44, torsoCY, s * 0.22, s * 0.56, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'energy_spikes') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 10;
    for (let i = 0; i < 7; i++) {
      const a = t + i * (Math.PI * 2 / 7);
      const len = s * 0.4 + Math.sin(frame * 0.15 + i) * s * 0.1;
      const cx = x + Math.cos(a) * s * 0.18, cy = torsoCY + Math.sin(a) * s * 0.12;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * len, cy + Math.sin(a) * len, s * 0.04, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'orbiting_orbs') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const a = frame * 0.04 + i * (Math.PI / 2);
      const ox = x + Math.cos(a) * s * 0.7, oy = torsoCY + Math.sin(a) * s * 0.5;
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(ox, oy, s * 0.08, 0, Math.PI * 2); ctx.fill();
      const a2 = a - 0.3;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(x + Math.cos(a2) * s * 0.7, torsoCY + Math.sin(a2) * s * 0.5); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'rising_souls') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const sx = x + Math.sin(i * 2.3 + frame * 0.02) * s * 0.3;
      const sy = feetY - ((frame * 0.8 + i * 40) % (s * 1.6));
      const alpha = Math.max(0, 0.6 - (feetY - sy) / (s * 1.6) * 0.6);
      ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(sx, sy, s * 0.1, s * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'crystal_burst') {
    ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
    for (let side = -1; side <= 1; side += 2) {
      const cx = x + side * s * 0.3, cy = shoulderY + s * 0.05;
      const sz = s * 0.22;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + side * sz * 0.4, cy - sz); ctx.lineTo(cx + side * sz * 0.8, cy - sz * 0.3);
      ctx.lineTo(cx + side * sz, cy + sz * 0.2); ctx.lineTo(cx, cy + sz * 0.3); ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'rune_circle') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 14;
    const rr = s * 0.55 + Math.sin(frame * 0.08) * s * 0.05;
    ctx.beginPath(); ctx.ellipse(x, feetY - s * 0.02, rr, rr * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const a = i * (Math.PI / 3) + frame * 0.03;
      const rx = x + Math.cos(a) * rr, ry = feetY - s * 0.02 + Math.sin(a) * rr * 0.2;
      ctx.beginPath(); ctx.arc(rx, ry, s * 0.03, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'flame_aura') {
    ctx.save(); ctx.globalAlpha = 0.6;
    for (let i = 0; i < 8; i++) {
      const fx = x + (i - 3.5) * s * 0.12;
      const fh = s * 0.5 + Math.sin(frame * 0.2 + i) * s * 0.2;
      ctx.fillStyle = i % 2 === 0 ? color : '#FFAA44';
      ctx.beginPath();
      ctx.moveTo(fx, feetY); ctx.quadraticCurveTo(fx + s * 0.08, feetY - fh / 2, fx, feetY - fh);
      ctx.quadraticCurveTo(fx - s * 0.08, feetY - fh / 2, fx, feetY); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'void_rift') {
    ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(frame * 0.06) * 0.15;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, torsoCY - s * 0.3); ctx.quadraticCurveTo(x - s * 0.7, torsoCY, x - s * 0.3, torsoCY + s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.2, torsoCY, x + s * 0.3, torsoCY - s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.7, torsoCY, x + s * 0.5, torsoCY + s * 0.3);
    ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'lightning_crown') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.shadowColor = color; ctx.shadowBlur = 10;
    if (Math.floor(frame / 3) % 2 === 0) {
      for (let i = -2; i <= 2; i++) {
        const lx = x + i * s * 0.12;
        ctx.beginPath();
        ctx.moveTo(lx, headTopY - s * 0.05);
        ctx.lineTo(lx + s * 0.06, headTopY - s * 0.22);
        ctx.lineTo(lx - s * 0.02, headTopY - s * 0.28);
        ctx.lineTo(lx + s * 0.04, headTopY - s * 0.4);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'cosmic_swirl') {
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const a = i * 0.6 + frame * 0.04;
      const r = s * 0.2 + i * s * 0.06;
      const sx = x + Math.cos(a) * r, sy = torsoCY + Math.sin(a) * r * 0.5;
      ctx.fillStyle = color; ctx.globalAlpha = 0.5 - i * 0.04;
      ctx.beginPath(); ctx.arc(sx, sy, s * 0.04, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'petal_storm') {
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const a = frame * 0.04 + i * 0.8;
      const r = s * 0.3 + i * s * 0.05;
      const px = x + Math.cos(a) * r, py = torsoCY + Math.sin(a * 1.5) * s * 0.4;
      ctx.fillStyle = color; ctx.globalAlpha = 0.6;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.06, s * 0.03, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'ice_spikes') {
    ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.globalAlpha = 0.8;
    for (let i = 0; i < 5; i++) {
      const sx = x + (i - 2) * s * 0.12;
      const sh = s * 0.3 + Math.sin(frame * 0.1 + i) * s * 0.05;
      ctx.beginPath();
      ctx.moveTo(sx, torsoTopY + s * 0.1); ctx.lineTo(sx + s * 0.06, torsoTopY + s * 0.1 - sh * 0.4);
      ctx.lineTo(sx + s * 0.03, torsoTopY + s * 0.1 - sh); ctx.lineTo(sx - s * 0.03, torsoTopY + s * 0.1 - sh * 0.4);
      ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'shadow_tentacles') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; ctx.shadowColor = color; ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i++) {
      const a = t + i * 1.26;
      const len = s * 0.5 + Math.sin(frame * 0.1 + i) * s * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, feetY - s * 0.05);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.6, feetY - s * 0.3 + Math.sin(a) * s * 0.2, x + Math.cos(a) * len, feetY - s * 0.5);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'phantom_echoes') {
    ctx.save();
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = 0.15 - i * 0.03;
      ctx.fillStyle = color;
      const off = i * s * 0.15 * Math.sin(frame * 0.05 + i);
      ctx.beginPath(); ctx.ellipse(x + off, torsoCY, s * 0.22, s * 0.56, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + off, headY, headR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'energy_wings') {
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16;
    const flap = Math.sin(frame * 0.08) * 0.2;
    ctx.beginPath(); ctx.ellipse(x - s * 0.5, torsoCY, s * 0.35, s * 0.55, 0.5 + flap, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.5, torsoCY, s * 0.35, s * 0.55, -0.5 - flap, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
      const fa = 0.3 + i * 0.2 + flap;
      ctx.beginPath(); ctx.moveTo(x - s * 0.3, torsoCY - s * 0.1);
      ctx.lineTo(x - s * 0.3 - Math.cos(fa) * s * 0.3, torsoCY - s * 0.1 - Math.sin(fa) * s * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.3, torsoCY - s * 0.1);
      ctx.lineTo(x + s * 0.3 + Math.cos(fa) * s * 0.3, torsoCY - s * 0.1 - Math.sin(fa) * s * 0.3); ctx.stroke();
      ctx.globalAlpha = 0.85;
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'fire_ring') {
    ctx.save();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + frame * 0.05;
      const rr = s * 0.55 + Math.sin(frame * 0.1 + i) * s * 0.05;
      const fx = x + Math.cos(a) * rr, fy = feetY + Math.sin(a) * rr * 0.2;
      const fh = s * 0.15 + Math.sin(frame * 0.2 + i) * s * 0.05;
      ctx.fillStyle = i % 2 === 0 ? color : '#FFAA44'; ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + s * 0.04, fy - fh / 2, fx, fy - fh);
      ctx.quadraticCurveTo(fx - s * 0.04, fy - fh / 2, fx, fy); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'star_shower') {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const sx = x + Math.cos(i * 1.1 + frame * 0.03) * s * 0.6;
      const sy = headTopY - s * 0.3 + ((frame * 0.5 + i * 30) % (s * 1.2));
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.globalAlpha = 0.7;
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a2 = (j / 5) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? s * 0.06 : s * 0.025;
        if (j === 0) ctx.moveTo(sx + Math.cos(a2) * r, sy + Math.sin(a2) * r);
        else ctx.lineTo(sx + Math.cos(a2) * r, sy + Math.sin(a2) * r);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'snow_crown') {
    ctx.save();
    ctx.fillStyle = color;
    const cs = s * 0.24;
    ctx.beginPath();
    ctx.moveTo(x - cs, headTopY); ctx.lineTo(x - cs, headTopY - cs); ctx.lineTo(x - cs * 0.5, headTopY - cs * 0.5);
    ctx.lineTo(x, headTopY - cs); ctx.lineTo(x + cs * 0.5, headTopY - cs * 0.5); ctx.lineTo(x + cs, headTopY - cs);
    ctx.lineTo(x + cs, headTopY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9944CC'; ctx.shadowColor = '#9944CC'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(x, headTopY - cs * 0.55, s * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'snow_dots') {
    ctx.save();
    ctx.fillStyle = color; ctx.globalAlpha = 0.75;
    const dotR = s * 0.035;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * headR, headY + Math.sin(a) * headR, dotR, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      const ty = torsoTopY + (i + 1) * (hipY - torsoTopY) / 4;
      ctx.beginPath(); ctx.arc(x - s * 0.2, ty, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + s * 0.2, ty, dotR, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 1; i <= 2; i++) {
      const t = i / 3;
      ctx.beginPath(); ctx.arc(shoulderL.x + (handL.x - shoulderL.x) * t, shoulderL.y + (handL.y - shoulderL.y) * t, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(shoulderR.x + (handR.x - shoulderR.x) * t, shoulderR.y + (handR.y - shoulderR.y) * t, dotR, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 1; i <= 2; i++) {
      const t = i / 3;
      ctx.beginPath(); ctx.arc(x + (footL.x - x) * t, hipY + (footL.y - hipY) * t, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (footR.x - x) * t, hipY + (footR.y - hipY) * t, dotR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'headphones') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, headY, headR + s * 0.08, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - headR - s * 0.14, headY - s * 0.05, s * 0.14, s * 0.18, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + headR, headY - s * 0.05, s * 0.14, s * 0.18, 3); ctx.fill();
    ctx.restore();
  } else if (type === 'soccer_kit' || type === 'jersey') {
    drawSoccerKit(ctx, x, y, color, charId, frame, scale);
  } else if (type === 'volleyball_kit') {
    drawSoccerKit(ctx, x, y, color, charId, frame, scale);
    // Diagonal white stripe over the jersey torso (volleyball signature look)
    const jW = s * 0.72;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pose.lean);
    ctx.beginPath(); ctx.rect(-jW / 2, pose.torsoTopY, jW, pose.hipY - pose.torsoTopY); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    const stripH = (pose.hipY - pose.torsoTopY) * 0.12;
    ctx.beginPath();
    ctx.moveTo(-jW / 2 - s * 0.05, pose.torsoTopY + (pose.hipY - pose.torsoTopY) * 0.35);
    ctx.lineTo(jW / 2 + s * 0.05, pose.torsoTopY + (pose.hipY - pose.torsoTopY) * 0.20);
    ctx.lineTo(jW / 2 + s * 0.05, pose.torsoTopY + (pose.hipY - pose.torsoTopY) * 0.20 + stripH);
    ctx.lineTo(-jW / 2 - s * 0.05, pose.torsoTopY + (pose.hipY - pose.torsoTopY) * 0.35 + stripH);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (type === 'baseball_kit') {
    drawSoccerKit(ctx, x, y, color, charId, frame, scale);
    // Baseball: long WHITE pants regardless of shirt color — covers from hip to ankle
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pose.lean);
    const pantW = s * 0.26;
    // Left pant leg follows left thigh/calf
    ctx.save(); ctx.translate(pose.hips.left.x, pose.hips.left.y); ctx.rotate(pose.legAngleL);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-pantW / 2, 0, pantW, s * 0.52, 4); ctx.fill();
    ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-pantW / 2, 0, pantW, s * 0.52, 4); ctx.stroke();
    // Belt line
    ctx.fillStyle = color; ctx.fillRect(-pantW / 2, 0, pantW, s * 0.06);
    // Stirrup sock stripe at the ankle
    ctx.fillStyle = color; ctx.fillRect(-pantW / 2, s * 0.4, pantW, s * 0.06);
    ctx.restore();
    // Right pant leg follows right thigh/calf
    ctx.save(); ctx.translate(pose.hips.right.x, pose.hips.right.y); ctx.rotate(pose.legAngleR);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-pantW / 2, 0, pantW, s * 0.52, 4); ctx.fill();
    ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-pantW / 2, 0, pantW, s * 0.52, 4); ctx.stroke();
    ctx.fillStyle = color; ctx.fillRect(-pantW / 2, 0, pantW, s * 0.06);
    ctx.fillStyle = color; ctx.fillRect(-pantW / 2, s * 0.4, pantW, s * 0.06);
    ctx.restore();
    // Pinstripes on jersey torso (baseball signature)
    const jW2 = s * 0.72;
    ctx.beginPath(); ctx.rect(-jW2 / 2, pose.torsoTopY, jW2, pose.hipY - pose.torsoTopY); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    for (let bx = -jW2 / 2; bx < jW2 / 2; bx += s * 0.14) {
      ctx.beginPath(); ctx.moveTo(bx, pose.torsoTopY); ctx.lineTo(bx + s * 0.05, pose.hipY); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'basketball_kit') {
    drawSoccerKit(ctx, x, y, color, charId, frame, scale);
    // Basketball: tank-top look — colored torso with side trim + shorts
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean);
    const jW = s * 0.72;
    // Tank straps (narrower shoulders)
    ctx.fillStyle = color;
    ctx.fillRect(-jW * 0.3, pose.torsoTopY, jW * 0.1, s * 0.1);
    ctx.fillRect(jW * 0.2, pose.torsoTopY, jW * 0.1, s * 0.1);
    // Number badge on shorts
    ctx.restore();
  } else if (type === 'tennis_kit') {
    drawSoccerKit(ctx, x, y, color, charId, frame, scale);
    // Tennis: white polo with colored collar + shorts
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean);
    const jW = s * 0.72;
    // Collar V
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-jW * 0.15, pose.torsoTopY); ctx.lineTo(0, pose.torsoTopY + s * 0.1); ctx.lineTo(jW * 0.15, pose.torsoTopY); ctx.closePath(); ctx.fill();
    // Button placket
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, pose.torsoTopY); ctx.lineTo(0, pose.torsoTopY + s * 0.15); ctx.stroke();
    ctx.restore();
  } else if (type === 'track_kit') {
    drawSoccerKit(ctx, x, y, color, charId, frame, scale);
    // Track: singlet (sleeveless tank) + side stripe
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean);
    const jW = s * 0.72;
    // Side stripe
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-jW / 2, pose.torsoTopY + s * 0.05, s * 0.05, pose.hipY - pose.torsoTopY - s * 0.05);
    ctx.fillRect(jW / 2 - s * 0.05, pose.torsoTopY + s * 0.05, s * 0.05, pose.hipY - pose.torsoTopY - s * 0.05);
    ctx.restore();
  } else if (type === 'aura') {
    ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(frame * 0.1) * 0.1;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, feetY - 2, s * 0.6, s * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, headY, s * 0.5, s * 0.16, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } else if (type === 'rainbow') {
    const hue = (frame * 2) % 360;
    ctx.save(); ctx.globalAlpha = 0.45;
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `hsl(${(hue + i * 40) % 360}, 80%, 60%)`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, feetY - 2, s * 0.6 - i * 2, s * 0.22 - i, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'crown') {
    ctx.fillStyle = color;
    const cs = s * 0.22;
    ctx.beginPath();
    ctx.moveTo(x - cs, headTopY); ctx.lineTo(x - cs, headTopY - cs); ctx.lineTo(x - cs * 0.5, headTopY - cs * 0.5);
    ctx.lineTo(x, headTopY - cs); ctx.lineTo(x + cs * 0.5, headTopY - cs * 0.5); ctx.lineTo(x + cs, headTopY - cs);
    ctx.lineTo(x + cs, headTopY); ctx.closePath(); ctx.fill();
  } else if (type === 'halo') {
    ctx.save(); ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(x, headTopY - s * 0.06, s * 0.45, s * 0.14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } else if (type === 'horns') {
    ctx.fillStyle = color;
    const hs = s * 0.36;
    ctx.beginPath(); ctx.moveTo(x - hs * 0.15, headTopY + s * 0.02); ctx.lineTo(x - hs * 0.4, headTopY - hs * 0.5); ctx.lineTo(x - hs * 0.05, headTopY + s * 0.02); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + hs * 0.15, headTopY + s * 0.02); ctx.lineTo(x + hs * 0.4, headTopY - hs * 0.5); ctx.lineTo(x + hs * 0.05, headTopY + s * 0.02); ctx.fill();
  } else if (type === 'wings' || type === 'lwings') {
    ctx.save(); ctx.globalAlpha = type === 'lwings' ? 0.85 : 0.7; ctx.fillStyle = color;
    const flap = Math.sin(frame * 0.08) * 0.15;
    ctx.beginPath(); ctx.ellipse(x - s * 0.39, torsoCY, s * 0.28, s * 0.44, 0.4 + flap, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.39, torsoCY, s * 0.28, s * 0.44, -0.4 - flap, 0, Math.PI * 2); ctx.fill();
    if (type === 'lwings') { ctx.shadowColor = color; ctx.shadowBlur = 10; }
    ctx.restore();
  } else if (type === 'shadow') {
    ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, feetY - 2, s * 0.67, s * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  } else if (type === 'mist') {
    ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(frame * 0.06) * 0.1; ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      const mx = x + Math.cos(t + i * 1.5) * s * 0.44;
      const my = torsoCY + Math.sin(t + i * 1.5) * s * 0.33;
      ctx.beginPath(); ctx.arc(mx, my, s * 0.22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'sparkles') {
    for (let i = 0; i < 3; i++) {
      const a = frame * 0.05 + i * 2.1;
      const sx = x + Math.cos(a) * s * 0.5, sy = headY + s * 0.22 + Math.sin(a) * s * 0.22;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx, sy, s * 0.056, 0, Math.PI * 2); ctx.fill();
    }
  } else if (type === 'cape') {
    ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = color;
    const sway = Math.sin(frame * 0.06) * s * 0.11;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.17, shoulderY); ctx.lineTo(x + s * 0.17, shoulderY);
    ctx.lineTo(x + s * 0.28 + sway, feetY); ctx.lineTo(x - s * 0.28 + sway, feetY); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (type === 'scarf') {
    ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = color;
    const sway = Math.sin(frame * 0.07) * s * 0.08;
    ctx.beginPath(); ctx.ellipse(x, torsoTopY + s * 0.06, s * 0.33, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + s * 0.11, torsoTopY + s * 0.06, s * 0.11, s * 0.44 + sway);
    ctx.restore();
  } else if (type === 'flower') {
    // Flower crown — above the head
    for (let i = 0; i < 5; i++) {
      const fx = x + (i - 2) * s * 0.12;
      const fy = headTopY - s * 0.08 + Math.abs(i - 2) * s * 0.02;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(fx, fy, s * 0.07, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#FFDD00'; ctx.beginPath(); ctx.arc(x, headTopY - s * 0.08, s * 0.055, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'comet') {
    for (let i = 0; i < 6; i++) {
      const sx = x - s * 0.22 - i * s * 0.22, sy = torsoCY - i * s * 0.083;
      ctx.globalAlpha = 0.5 - i * 0.07;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx, sy, Math.max(1, s * 0.11 - i * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (type === 'bubble') {
    ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(frame * 0.08) * 0.08;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, torsoCY, s * 0.72, s * 0.94, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } else if (type === 'crystals') {
    for (let i = 0; i < 4; i++) {
      const a = t + i * 1.6;
      const sx = x + Math.cos(a) * s * 0.56, sy = torsoCY + Math.sin(a) * s * 0.39;
      ctx.fillStyle = color; ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(sx, sy - s * 0.14); ctx.lineTo(sx + s * 0.083, sy); ctx.lineTo(sx, sy + s * 0.14); ctx.lineTo(sx - s * 0.083, sy); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (type === 'lightning') {
    if (Math.floor(frame / 6) % 2 === 0) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.05, headTopY);
      ctx.lineTo(x - s * 0.17, headTopY - s * 0.22);
      ctx.lineTo(x + s * 0.05, headTopY - s * 0.22);
      ctx.lineTo(x - s * 0.1, headTopY - s * 0.44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.05, headTopY);
      ctx.lineTo(x + s * 0.17, headTopY - s * 0.22);
      ctx.lineTo(x - s * 0.05, headTopY - s * 0.22);
      ctx.lineTo(x + s * 0.1, headTopY - s * 0.44);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  } else if (type === 'star') {
    ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
    const sx2 = x + Math.cos(t) * s * 0.44, sy2 = headY + s * 0.11 + Math.sin(t) * s * 0.17;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? s * 0.14 : s * 0.056;
      ctx.lineTo(sx2 + Math.cos(a) * r, sy2 + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (type === 'puppet') {
    ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = color; ctx.lineWidth = 1;
    const sw = Math.sin(frame * 0.04) * s * 0.056;
    const barY = headTopY - s * 0.5;
    ctx.beginPath(); ctx.moveTo(x - s * 0.39, barY); ctx.lineTo(x + s * 0.39, barY); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, barY); ctx.lineTo(x + sw, headY);
    ctx.moveTo(x - s * 0.28, barY); ctx.lineTo(x - s * 0.33 + sw, shoulderY);
    ctx.moveTo(x + s * 0.28, barY); ctx.lineTo(x + s * 0.33 + sw, shoulderY);
    ctx.moveTo(x - s * 0.17, barY); ctx.lineTo(x - s * 0.22 + sw, feetY);
    ctx.moveTo(x + s * 0.17, barY); ctx.lineTo(x + s * 0.22 + sw, feetY);
    ctx.stroke(); ctx.restore();
  } else if (type === 'clock') {
    ctx.save();
    const cx = x + s * 0.44, cy = headY + s * 0.17;
    const cr = s * 0.19;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#223322'; ctx.beginPath(); ctx.arc(cx, cy, cr * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
    const ha = frame * 0.03;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * cr * 0.57, cy + Math.sin(ha) * cr * 0.57); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha * 0.2) * cr * 0.43, cy + Math.sin(ha * 0.2) * cr * 0.43); ctx.stroke();
    ctx.restore();
  } else if (type === 'flame') {
    ctx.save(); ctx.globalAlpha = 0.6;
    for (let i = 0; i < 5; i++) {
      const fx = x + (i - 2) * s * 0.17;
      const fh = s * 0.39 + Math.sin(frame * 0.2 + i) * s * 0.17;
      ctx.fillStyle = i % 2 === 0 ? '#FF4422' : '#FFAA22';
      ctx.beginPath();
      ctx.moveTo(fx, torsoCY - s * 0.11);
      ctx.quadraticCurveTo(fx + s * 0.11, torsoCY - fh / 2, fx, torsoCY - fh);
      ctx.quadraticCurveTo(fx - s * 0.11, torsoCY - fh / 2, fx, torsoCY - s * 0.11);
      ctx.fill();
    }
    ctx.restore();
  } else if (type === 'beam') {
    ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(frame * 0.12) * 0.15;
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(x, torsoCY, s * 0.78, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'grav') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const rr = s * 0.5 + i * s * 0.17 + Math.sin(frame * 0.06 + i) * s * 0.083;
      ctx.globalAlpha = 0.5 - i * 0.12;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.ellipse(x, torsoCY, rr, rr * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
  } else if (type === 'phantom') {
    ctx.save(); ctx.globalAlpha = 0.3;
    for (let i = 1; i <= 2; i++) {
      ctx.fillStyle = color; ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.arc(x - i * s * 0.28, torsoCY, s * 0.39, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'clone') {
    ctx.save();
    for (let i = 1; i <= 2; i++) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x - i * s * 0.44, torsoCY, s * 0.22, s * 0.56, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (type === 'blindfold') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    const bw = s * 0.56;
    ctx.fillRect(x - bw / 2, headY - s * 0.03, bw, s * 0.11);
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - bw / 2, headY + s * 0.03); ctx.lineTo(x - s * 0.44, headY + s * 0.14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + bw / 2, headY + s * 0.03); ctx.lineTo(x + s * 0.44, headY + s * 0.14); ctx.stroke();
    ctx.restore();
  } else if (type === 'metal') {
    ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(frame * 0.1) * 0.1;
    const g = ctx.createLinearGradient(x - s * 0.39, torsoCY, x + s * 0.39, feetY);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, color + '88'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(x - s * 0.39, torsoCY, s * 0.78, s * 0.78);
    ctx.restore();
  } else if (type === 'thunder') {
    ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
    const ts = s * 0.22;
    ctx.beginPath();
    ctx.moveTo(x - ts, headTopY); ctx.lineTo(x - ts * 0.5, headTopY - ts * 0.67); ctx.lineTo(x, headTopY - ts * 0.22);
    ctx.lineTo(x + ts * 0.5, headTopY - ts * 0.89); ctx.lineTo(x + ts, headTopY); ctx.closePath(); ctx.fill();
    if (Math.floor(frame / 4) % 3 === 0) {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a = frame * 0.1 + i * 2.1;
        ctx.beginPath(); ctx.moveTo(x, headTopY - ts * 0.44);
        ctx.lineTo(x + Math.cos(a) * s * 0.44, headTopY - ts * 0.44 + Math.sin(a) * s * 0.33); ctx.stroke();
      }
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'speed') {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.4 - i * 0.07;
      ctx.strokeStyle = color; ctx.lineWidth = 3 - i * 0.4;
      ctx.beginPath(); ctx.moveTo(x - s * 0.33 - i * s * 0.22, torsoCY - i * s * 0.11); ctx.lineTo(x - s * 0.11 - i * s * 0.22, torsoCY - i * s * 0.11); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'water') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = frame * 0.04 + i * 2.1;
      const ox = x + Math.cos(a) * s * 0.5, oy = torsoCY + Math.sin(a) * s * 0.28;
      ctx.fillStyle = color; ctx.globalAlpha = 0.7; ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(ox, oy, s * 0.11, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'stone') {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.33, shoulderY - s * 0.11); ctx.lineTo(x - s * 0.44, hipY - s * 0.06); ctx.lineTo(x - s * 0.33, feetY);
    ctx.moveTo(x + s * 0.33, shoulderY - s * 0.11); ctx.lineTo(x + s * 0.44, hipY - s * 0.06); ctx.lineTo(x + s * 0.33, feetY);
    ctx.fill(); ctx.restore();
  } else if (type === 'tk') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const a = frame * 0.05 + i * (Math.PI / 2);
      const ox = x + Math.cos(a) * s * 0.56, oy = torsoCY - s * 0.17 + Math.sin(a * 2) * s * 0.22;
      ctx.fillStyle = color; ctx.globalAlpha = 0.8; ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(a);
      ctx.fillRect(-s * 0.11, -s * 0.11, s * 0.22, s * 0.22); ctx.restore();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'spirit') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const sy = torsoCY - ((frame * 0.5 + i * 20) % (s * 1.1));
      ctx.globalAlpha = 0.4 - i * 0.1;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x + (i - 1) * s * 0.17, sy, s * 0.14, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  } else if (type === 'web') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + frame * 0.02;
      ctx.beginPath(); ctx.moveTo(x, torsoCY); ctx.lineTo(x + Math.cos(a) * s * 0.61, torsoCY + Math.sin(a) * s * 0.39); ctx.stroke();
    }
    for (let r = 1; r <= 2; r++) {
      ctx.beginPath(); ctx.ellipse(x, torsoCY, r * s * 0.22, r * s * 0.14, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'portal') {
    ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    const pr = s * 0.39 + Math.sin(frame * 0.1) * s * 0.083;
    ctx.beginPath(); ctx.ellipse(x + s * 0.5, torsoCY, pr, pr * 1.4, 0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'checkered_haori') {
    // Black & white checkered haori — worn around torso + arms, down to the knees
    ctx.save();
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean); ctx.translate(-x, -y);
    const kneeY = hipY + (feetY - hipY) * 0.5;
    const bodyW = s * 0.52;
    const drawChecks = (px, py, pw, ph) => {
      const sq = s * 0.12;
      for (let cx = px; cx < px + pw; cx += sq) {
        for (let cy = py; cy < py + ph; cy += sq) {
          const on = (Math.floor((cx - px) / sq) + Math.floor((cy - py) / sq)) % 2 === 0;
          ctx.fillStyle = on ? '#111111' : color;
          ctx.fillRect(cx, cy, Math.min(sq, px + pw - cx), Math.min(sq, py + ph - cy));
        }
      }
    };
    // Left front panel
    ctx.save(); ctx.beginPath(); ctx.rect(x - bodyW / 2, torsoTopY, bodyW / 2 - 2, kneeY - torsoTopY); ctx.clip();
    drawChecks(x - bodyW / 2, torsoTopY, bodyW / 2 - 2, kneeY - torsoTopY); ctx.restore();
    // Right front panel
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, torsoTopY, bodyW / 2 - 2, kneeY - torsoTopY); ctx.clip();
    drawChecks(x + 2, torsoTopY, bodyW / 2 - 2, kneeY - torsoTopY); ctx.restore();
    // Collar + hem trim
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - bodyW / 2, torsoTopY); ctx.lineTo(x - 2, torsoTopY + 4); ctx.lineTo(x + 2, torsoTopY + 4); ctx.lineTo(x + bodyW / 2, torsoTopY); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - bodyW / 2, torsoTopY, bodyW, kneeY - torsoTopY); ctx.stroke();
    // Sleeves — loose tubes from shoulders following arm swing
    const drawSleeve = (sh, ang) => {
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(ang);
      const slen = s * 0.46, sw = s * 0.2;
      ctx.beginPath();
      ctx.moveTo(-sw / 2, 0); ctx.lineTo(sw / 2, 0); ctx.lineTo(sw / 2 - 5, slen); ctx.lineTo(-sw / 2 + 5, slen); ctx.closePath();
      ctx.save(); ctx.clip();
      const sq = s * 0.12;
      for (let cx = -sw / 2; cx < sw / 2; cx += sq) {
        for (let cy = 0; cy < slen; cy += sq) {
          const on = (Math.floor((cx + sw / 2) / sq) + Math.floor(cy / sq)) % 2 === 0;
          ctx.fillStyle = on ? '#111111' : color;
          ctx.fillRect(cx, cy, Math.min(sq, sw / 2 - cx), Math.min(sq, slen - cy));
        }
      }
      ctx.restore();
      ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-sw / 2, 0); ctx.lineTo(sw / 2, 0); ctx.lineTo(sw / 2 - 5, slen); ctx.lineTo(-sw / 2 + 5, slen); ctx.closePath(); ctx.stroke();
      ctx.restore();
    };
    drawSleeve(shoulderL, pose.armAngleL);
    drawSleeve(shoulderR, pose.armAngleR);
    ctx.restore();
    ctx.restore();
  } else if (type === 'slayer_shoes') {
    // Black ankle-high shoes
    ctx.save(); ctx.fillStyle = '#111111'; ctx.globalAlpha = 0.92;
    ctx.beginPath(); ctx.roundRect(footL.x - s * 0.11, footL.y - s * 0.07, s * 0.22, s * 0.13, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(footR.x - s * 0.11, footR.y - s * 0.07, s * 0.22, s * 0.13, 3); ctx.fill();
    ctx.strokeStyle = '#444444'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(footL.x - s * 0.1, footL.y - s * 0.03); ctx.lineTo(footL.x + s * 0.1, footL.y - s * 0.03); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(footR.x - s * 0.1, footR.y - s * 0.03); ctx.lineTo(footR.x + s * 0.1, footR.y - s * 0.03); ctx.stroke();
    ctx.restore();
  } else if (type === 'angel_halo') {
    // Bright glowing angel halo with small rays
    ctx.save(); ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 16;
    const hy = headTopY - s * 0.12;
    ctx.beginPath(); ctx.ellipse(x, hy, s * 0.42, s * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + frame * 0.01;
      const rx = x + Math.cos(a) * s * 0.42, ry = hy + Math.sin(a) * s * 0.12;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(a) * s * 0.07, ry + Math.sin(a) * s * 0.07); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
  } else if (type === 'slayer_scars') {
    // Really thin scars on exposed skin (face + forearms)
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.85; ctx.lineCap = 'round';
    const scar = (sx, sy, ang, len) => { ctx.beginPath(); ctx.moveTo(sx - Math.cos(ang) * len, sy - Math.sin(ang) * len); ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len); ctx.stroke(); };
    scar(x - s * 0.1, headY + s * 0.02, 0.5, s * 0.09);
    scar(handL.x, handL.y - s * 0.2, 1.2, s * 0.07);
    scar(handR.x - s * 0.04, handR.y - s * 0.16, 1.0, s * 0.06);
    scar(elbowR.x + s * 0.03, elbowR.y, 1.1, s * 0.05);
    ctx.restore();
  } else if (type === 'katana') {
    // Sheathed katana worn at the hip — curved scabbard, guard, wrapped handle
    ctx.save();
    ctx.translate(x - s * 0.05, hipY + s * 0.06);
    ctx.rotate(-0.5);
    const bladeLen = s * 0.95;
    // Scabbard (curved)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(bladeLen * 0.5, -bladeLen * 0.1, bladeLen, -bladeLen * 0.16); ctx.stroke();
    // Handle
    ctx.strokeStyle = '#221100'; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.05); ctx.lineTo(0, 0); ctx.stroke();
    // Tsuba (guard)
    ctx.fillStyle = color; ctx.fillRect(-s * 0.035, -s * 0.07, s * 0.04, s * 0.14);
    // Handle wrapping
    ctx.strokeStyle = '#553311'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath(); ctx.moveTo(-s * 0.2 + t * s * 0.2, s * 0.05 - t * s * 0.05); ctx.lineTo(-s * 0.2 + t * s * 0.2 + s * 0.02, s * 0.05 - t * s * 0.05 - s * 0.02); ctx.stroke();
    }
    // Pommel
    ctx.fillStyle = '#442211'; ctx.beginPath(); ctx.arc(-s * 0.2, s * 0.05, s * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'kimono') {
    // Traditional kimono — full robe from shoulders to mid-shin with V-neck collar + obi belt
    ctx.save();
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean); ctx.translate(-x, -y);
    const kW = s * 0.56;
    const kBottom = hipY + (feetY - hipY) * 0.55;
    ctx.fillStyle = color; ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(x - kW / 2, torsoTopY); ctx.lineTo(x + kW / 2, torsoTopY);
    ctx.lineTo(x + kW / 2 + s * 0.06, kBottom); ctx.lineTo(x - kW / 2 - s * 0.06, kBottom);
    ctx.closePath(); ctx.fill();
    // White undercollar (V-neck)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(x - kW / 2, torsoTopY); ctx.lineTo(x - s * 0.03, torsoTopY + s * 0.22);
    ctx.lineTo(x + s * 0.03, torsoTopY + s * 0.22); ctx.lineTo(x + kW / 2, torsoTopY);
    ctx.closePath(); ctx.fill();
    // Left front panel overlap
    ctx.fillStyle = color; ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(x - kW / 2, torsoTopY); ctx.lineTo(x - s * 0.03, torsoTopY + s * 0.22);
    ctx.lineTo(x - s * 0.03, kBottom); ctx.lineTo(x - kW / 2 - s * 0.06, kBottom);
    ctx.closePath(); ctx.fill();
    // Obi (belt)
    const obiY = torsoTopY + (hipY - torsoTopY) * 0.55;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - kW / 2 - s * 0.02, obiY, kW + s * 0.04, s * 0.11);
    ctx.fillStyle = color; ctx.fillRect(x - kW / 2 - s * 0.02, obiY, kW + s * 0.04, s * 0.04);
    // Obi knot
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - s * 0.08, obiY - s * 0.02, s * 0.16, s * 0.15);
    ctx.restore(); ctx.restore();
  } else if (type === 'yukata') {
    // Summer yukata — lighter, simpler robe to the knees
    ctx.save();
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean); ctx.translate(-x, -y);
    const yW = s * 0.5;
    const yBottom = hipY + (feetY - hipY) * 0.4;
    ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - yW / 2, torsoTopY); ctx.lineTo(x + yW / 2, torsoTopY);
    ctx.lineTo(x + yW / 2 + s * 0.04, yBottom); ctx.lineTo(x - yW / 2 - s * 0.04, yBottom);
    ctx.closePath(); ctx.fill();
    // Simple V-neck line
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - yW / 2, torsoTopY); ctx.lineTo(x, torsoTopY + s * 0.18); ctx.lineTo(x + yW / 2, torsoTopY); ctx.stroke();
    // Simple belt
    const beltY = torsoTopY + (hipY - torsoTopY) * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - yW / 2 - s * 0.02, beltY, yW + s * 0.04, s * 0.08);
    ctx.restore(); ctx.restore();
  } else if (type === 'haori') {
    // Plain haori — open hip-length jacket with sleeves
    ctx.save();
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean); ctx.translate(-x, -y);
    const hW = s * 0.5;
    const hBottom = hipY + s * 0.05;
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    // Left panel
    ctx.beginPath();
    ctx.moveTo(x - hW / 2, torsoTopY); ctx.lineTo(x - s * 0.04, torsoTopY + s * 0.05);
    ctx.lineTo(x - s * 0.04, hBottom); ctx.lineTo(x - hW / 2 - s * 0.03, hBottom);
    ctx.closePath(); ctx.fill();
    // Right panel
    ctx.beginPath();
    ctx.moveTo(x + hW / 2, torsoTopY); ctx.lineTo(x + s * 0.04, torsoTopY + s * 0.05);
    ctx.lineTo(x + s * 0.04, hBottom); ctx.lineTo(x + hW / 2 + s * 0.03, hBottom);
    ctx.closePath(); ctx.fill();
    // Collar trim
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - hW / 2, torsoTopY); ctx.lineTo(x - s * 0.04, torsoTopY + s * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + hW / 2, torsoTopY); ctx.lineTo(x + s * 0.04, torsoTopY + s * 0.05); ctx.stroke();
    // Sleeves
    const drawHaoriSleeve = (sh, ang) => {
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(ang);
      ctx.fillStyle = color; ctx.globalAlpha = 0.8;
      const slen = s * 0.38, sw = s * 0.18;
      ctx.beginPath();
      ctx.moveTo(-sw / 2, 0); ctx.lineTo(sw / 2, 0); ctx.lineTo(sw / 2 - 3, slen); ctx.lineTo(-sw / 2 + 3, slen);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    };
    drawHaoriSleeve(shoulderL, pose.armAngleL);
    drawHaoriSleeve(shoulderR, pose.armAngleR);
    ctx.restore(); ctx.restore();
  } else if (type === 'hakama') {
    // Wide pleated pants from waist to ankles
    ctx.save();
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean); ctx.translate(-x, -y);
    const hW = s * 0.56;
    const hBottom = feetY - s * 0.02;
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x - hW / 2, hipY - s * 0.04); ctx.lineTo(x + hW / 2, hipY - s * 0.04);
    ctx.lineTo(x + hW / 2 + s * 0.1, hBottom); ctx.lineTo(x - hW / 2 - s * 0.1, hBottom);
    ctx.closePath(); ctx.fill();
    // Pleat lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const px = x + i * s * 0.1;
      ctx.beginPath(); ctx.moveTo(px, hipY - s * 0.04); ctx.lineTo(px + i * s * 0.02, hBottom); ctx.stroke();
    }
    // Waist tie
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - hW / 2 - s * 0.02, hipY - s * 0.06, hW + s * 0.04, s * 0.06);
    ctx.restore(); ctx.restore();
  } else if (type === 'samurai_armor') {
    // Samurai armor — chest plate with lacing + kusazuri skirt + shoulder guards
    ctx.save();
    ctx.save(); ctx.translate(x, y); ctx.rotate(pose.lean); ctx.translate(-x, -y);
    const aW = s * 0.48;
    ctx.fillStyle = color; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.roundRect(x - aW / 2, torsoTopY + s * 0.02, aW, (hipY - torsoTopY) * 0.7, 4); ctx.fill();
    // Lacing lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const ly = torsoTopY + s * 0.02 + i * ((hipY - torsoTopY) * 0.7 / 4);
      ctx.beginPath(); ctx.moveTo(x - aW / 2, ly); ctx.lineTo(x + aW / 2, ly); ctx.stroke();
    }
    // Kusazuri (waist plates)
    ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    const kusY = hipY - s * 0.02;
    for (let i = 0; i < 5; i++) {
      const px = x - aW / 2 + i * (aW / 4);
      ctx.beginPath();
      ctx.moveTo(px, kusY); ctx.lineTo(px + aW / 5 - 2, kusY);
      ctx.lineTo(px + aW / 5 - 4, kusY + s * 0.25); ctx.lineTo(px + 2, kusY + s * 0.25);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore(); ctx.restore();
    // Shoulder guards (pauldrons)
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(shoulderL.x, shoulderL.y, s * 0.16, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(shoulderR.x, shoulderR.y, s * 0.16, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'oni_mask_red' || type === 'oni_mask_blue') {
    // Oni demon mask — red or blue, with horns, fangs, angry eyes
    const maskColor = type === 'oni_mask_red' ? '#CC2222' : '#2244CC';
    ctx.save();
    ctx.fillStyle = maskColor; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(x, headY + s * 0.02, s * 0.2, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    // Horns
    ctx.beginPath(); ctx.moveTo(x - s * 0.16, headY - s * 0.1); ctx.lineTo(x - s * 0.22, headY - s * 0.28); ctx.lineTo(x - s * 0.1, headY - s * 0.14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.16, headY - s * 0.1); ctx.lineTo(x + s * 0.22, headY - s * 0.28); ctx.lineTo(x + s * 0.1, headY - s * 0.14); ctx.closePath(); ctx.fill();
    // Eyes
    ctx.fillStyle = '#FFFFEE';
    ctx.beginPath(); ctx.ellipse(x - s * 0.08, headY - s * 0.02, s * 0.05, s * 0.035, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.08, headY - s * 0.02, s * 0.05, s * 0.035, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - s * 0.08, headY - s * 0.02, s * 0.02, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.08, headY - s * 0.02, s * 0.02, 0, Math.PI * 2); ctx.fill();
    // Mouth + fangs
    ctx.fillStyle = '#220000';
    ctx.beginPath(); ctx.ellipse(x, headY + s * 0.12, s * 0.08, s * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFEE';
    ctx.beginPath(); ctx.moveTo(x - s * 0.05, headY + s * 0.1); ctx.lineTo(x - s * 0.03, headY + s * 0.16); ctx.lineTo(x - s * 0.02, headY + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.05, headY + s * 0.1); ctx.lineTo(x + s * 0.03, headY + s * 0.16); ctx.lineTo(x + s * 0.02, headY + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (type === 'oni_mask_hannya') {
    // Hannya mask — white face with golden horns and red mouth
    ctx.save();
    ctx.fillStyle = '#F5F0E0'; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(x, headY + s * 0.02, s * 0.2, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    // Golden horns
    ctx.fillStyle = '#DDBB33';
    ctx.beginPath(); ctx.moveTo(x - s * 0.14, headY - s * 0.1); ctx.lineTo(x - s * 0.28, headY - s * 0.32); ctx.lineTo(x - s * 0.2, headY - s * 0.28); ctx.lineTo(x - s * 0.08, headY - s * 0.14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.14, headY - s * 0.1); ctx.lineTo(x + s * 0.28, headY - s * 0.32); ctx.lineTo(x + s * 0.2, headY - s * 0.28); ctx.lineTo(x + s * 0.08, headY - s * 0.14); ctx.closePath(); ctx.fill();
    // Angry eyes
    ctx.fillStyle = '#DD2222';
    ctx.beginPath(); ctx.ellipse(x - s * 0.08, headY - s * 0.02, s * 0.05, s * 0.03, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.08, headY - s * 0.02, s * 0.05, s * 0.03, 0.3, 0, Math.PI * 2); ctx.fill();
    // Red mouth
    ctx.fillStyle = '#CC1122';
    ctx.beginPath(); ctx.ellipse(x, headY + s * 0.13, s * 0.09, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    // Fangs
    ctx.fillStyle = '#FFFFEE';
    ctx.beginPath(); ctx.moveTo(x - s * 0.06, headY + s * 0.1); ctx.lineTo(x - s * 0.04, headY + s * 0.18); ctx.lineTo(x - s * 0.02, headY + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.06, headY + s * 0.1); ctx.lineTo(x + s * 0.04, headY + s * 0.18); ctx.lineTo(x + s * 0.02, headY + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (type === 'kitsune_mask') {
    // Kitsune fox mask — white face with red markings
    ctx.save();
    ctx.fillStyle = '#F8F0E8'; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(x, headY + s * 0.02, s * 0.19, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    // Pointed ears
    ctx.beginPath(); ctx.moveTo(x - s * 0.16, headY - s * 0.1); ctx.lineTo(x - s * 0.2, headY - s * 0.26); ctx.lineTo(x - s * 0.08, headY - s * 0.14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.16, headY - s * 0.1); ctx.lineTo(x + s * 0.2, headY - s * 0.26); ctx.lineTo(x + s * 0.08, headY - s * 0.14); ctx.closePath(); ctx.fill();
    // Red eye markings
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(x - s * 0.08, headY - s * 0.01, s * 0.05, s * 0.04, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.08, headY - s * 0.01, s * 0.05, s * 0.04, 0.2, 0, Math.PI * 2); ctx.fill();
    // Black nose
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(x, headY + s * 0.1, s * 0.03, s * 0.025, 0, 0, Math.PI * 2); ctx.fill();
    // Red eyebrow lines
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(x - s * 0.14, headY - s * 0.06); ctx.lineTo(x - s * 0.05, headY - s * 0.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.14, headY - s * 0.06); ctx.lineTo(x + s * 0.05, headY - s * 0.04); ctx.stroke();
    ctx.restore();
  } else if (type === 'geta') {
    // Wooden sandals with teeth and fabric straps
    ctx.save();
    const drawGeta = (foot) => {
      ctx.fillStyle = '#8B6914'; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.roundRect(foot.x - s * 0.12, foot.y - s * 0.02, s * 0.24, s * 0.06, 2); ctx.fill();
      ctx.fillStyle = '#6B4914';
      ctx.fillRect(foot.x - s * 0.08, foot.y + s * 0.04, s * 0.04, s * 0.06);
      ctx.fillRect(foot.x + s * 0.04, foot.y + s * 0.04, s * 0.04, s * 0.06);
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(foot.x - s * 0.1, foot.y - s * 0.02); ctx.lineTo(foot.x - s * 0.02, foot.y - s * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(foot.x + s * 0.1, foot.y - s * 0.02); ctx.lineTo(foot.x + s * 0.02, foot.y - s * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(foot.x - s * 0.02, foot.y - s * 0.1); ctx.lineTo(foot.x + s * 0.02, foot.y - s * 0.1); ctx.stroke();
    };
    drawGeta(footL); drawGeta(footR);
    ctx.restore();
  } else if (type === 'hachimaki') {
    // Traditional headband with rising sun accent
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.9;
    const bw = s * 0.5;
    ctx.fillRect(x - bw / 2, headY - s * 0.08, bw, s * 0.07);
    // Knot + tail at back
    ctx.beginPath(); ctx.arc(x - bw / 2 - s * 0.02, headY - s * 0.05, s * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - bw / 2 - s * 0.06, headY - s * 0.05, s * 0.04, s * 0.14);
    ctx.fillRect(x - bw / 2 - s * 0.02, headY - s * 0.05, s * 0.04, s * 0.12);
    // Rising sun circle
    ctx.fillStyle = '#DD2222'; ctx.beginPath(); ctx.arc(x, headY - s * 0.045, s * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'wagasa') {
    // Japanese paper umbrella held in the right hand
    ctx.save();
    const ux = handR.x + s * 0.1, uy = handR.y - s * 0.5;
    ctx.strokeStyle = '#5C3A1A'; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(handR.x, handR.y); ctx.lineTo(ux, uy); ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(ux, uy, s * 0.35, Math.PI, 0); ctx.lineTo(ux, uy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + Math.cos(a) * s * 0.35, uy + Math.sin(a) * s * 0.35); ctx.stroke();
    }
    ctx.fillStyle = '#5C3A1A'; ctx.beginPath(); ctx.arc(ux, uy - s * 0.02, s * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (type === 'sensu') {
    // Folding fan held in the left hand
    ctx.save();
    ctx.translate(handL.x - s * 0.05, handL.y);
    ctx.rotate(-0.5);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85;
    const fanLen = s * 0.35;
    for (let i = 0; i <= 6; i++) {
      const a = -0.5 + (i / 6) * 1.0;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * fanLen, Math.sin(a) * fanLen); ctx.stroke();
    }
    ctx.fillStyle = color; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let i = 0; i <= 6; i++) {
      const a = -0.5 + (i / 6) * 1.0;
      ctx.lineTo(Math.cos(a) * fanLen, Math.sin(a) * fanLen);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, 0, s * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

const BEHIND_TYPES = new Set([
  'wings', 'lwings', 'wings_energy', 'energy_wings',
  'cape', 'cape_long', 'shadow_cloak',
  'aura', 'mist', 'bubble', 'beam', 'grav', 'shadow',
  'crystals', 'ice_crystals',
  'sparkles', 'star', 'comet',
  'sonic_rings', 'web_spinner', 'void_tendrils', 'soul_chains',
  'angel_feathers', 'phantom_echoes', 'clone_echo', 'phantom', 'clone',
  'water', 'cosmic_swirl', 'petal_storm',
  'rising_souls', 'flame_aura', 'fire_ring',
  'shadow_tentacles', 'void_rift',
  'speed', 'rune_circle', 'flame',
  'orbiting_orbs', 'energy_spikes', 'star_shower',
]);

export function isBehindAccessory(type) {
  return BEHIND_TYPES.has(type);
}

// Price overhaul — add a zero to every accessory price
ACCESSORIES.forEach(a => { if (a.price > 0) a.price *= 10; });