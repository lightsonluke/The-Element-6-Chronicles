// Events system — 100 rotating events, each lasting 2 months.
// All event names end in "of Color".
// Each event has exclusive skins (same name+color per character), cosmetics, kill FX, gear, and accessories
// available through the event battle pass. Event items do NOT appear in the shop.

import { ALL_CHARS } from './allCharacters.js';
import { EMOTES } from './emotes.js';

const ALL = ALL_CHARS;

// Event themes — each defines a prefix word, color, and cosmetic part types
const EVENT_THEMES = [
  { prefix: 'Blooming', color: '#FF66BB', parts: ['flower', 'vine_bracers', 'halo_ring'], accType: 'flower', accColor: '#FF66BB', killFx: 'firework_burst', rarity: 'epic' },
  { prefix: 'Frozen', color: '#88CCFF', parts: ['ice_crystals', 'headband', 'goggles'], accType: 'crystals', accColor: '#AAEEFF', killFx: 'shatter', rarity: 'epic', stars: ['blue', 'white'] },
  { prefix: 'Burning', color: '#FF4422', parts: ['flame_crown', 'pauldrons', 'cape_long'], accType: 'flame', accColor: '#FF4422', killFx: 'golden_blast', rarity: 'legendary' },
  { prefix: 'Shadow', color: '#9966CC', parts: ['shadow_cloak', 'mask', 'gloves'], accType: 'shadow', accColor: '#660066', killFx: 'void_implosion', rarity: 'epic' },
  { prefix: 'Thunder', color: '#FFDD44', parts: ['crown_jewel', 'pauldrons', 'thunder'], accType: 'lightning', accColor: '#FFFF44', killFx: 'lightning_strike', rarity: 'legendary' },
  { prefix: 'Verdant', color: '#44CC44', parts: ['vine_bracers', 'halo_ring', 'shoes'], accType: 'mist', accColor: '#448833', killFx: 'soul_release', rarity: 'rare' },
  { prefix: 'Crimson', color: '#DC143C', parts: ['horns_spike', 'cape_long', 'claw_gauntlets'], accType: 'horns', accColor: '#AA2222', killFx: 'shockwave', rarity: 'legendary' },
  { prefix: 'Azure', color: '#4488FF', parts: ['goggles', 'armguards', 'shoes'], accType: 'bubble', accColor: '#88CCFF', killFx: 'shockwave', rarity: 'rare' },
  { prefix: 'Golden', color: '#FFD700', parts: ['crown_jewel', 'cape_long', 'halo_ring'], accType: 'crown', accColor: '#FFD700', killFx: 'golden_blast', rarity: 'legendary' },
  { prefix: 'Phantom', color: '#33CC66', parts: ['shadow_cloak', 'claw_gauntlets', 'shoes'], accType: 'mist', accColor: '#33CC66', killFx: 'soul_release', rarity: 'epic' },
  { prefix: 'Frost', color: '#AADDFF', parts: ['ice_crystals', 'helmet', 'gloves'], accType: 'crystals', accColor: '#AADDFF', killFx: 'shatter', rarity: 'rare' },
  { prefix: 'Ember', color: '#FF6622', parts: ['flame_crown', 'gloves', 'shoes'], accType: 'comet', accColor: '#FFAA22', killFx: 'golden_blast', rarity: 'epic' },
  { prefix: 'Storm', color: '#6644AA', parts: ['crown_jewel', 'pauldrons', 'cape_long'], accType: 'lightning', accColor: '#9966FF', killFx: 'lightning_strike', rarity: 'epic' },
  { prefix: 'Twilight', color: '#9944CC', parts: ['shadow_cloak', 'sunglasses', 'gloves'], accType: 'mist', accColor: '#9944CC', killFx: 'void_implosion', rarity: 'epic', stars: ['purple', 'black'] },
  { prefix: 'Dawn', color: '#FFAA44', parts: ['halo_ring', 'wings_energy', 'angel_feathers'], accType: 'star', accColor: '#FFDD44', killFx: 'soul_release', rarity: 'legendary' },
  { prefix: 'Dusk', color: '#4466AA', parts: ['shadow_cloak', 'mask', 'shoes'], accType: 'shadow', accColor: '#334466', killFx: 'void_implosion', rarity: 'rare' },
  { prefix: 'Radiant', color: '#FFEEAA', parts: ['halo_ring', 'wings_energy', 'crown_jewel'], accType: 'halo', accColor: '#FFEEAA', killFx: 'golden_blast', rarity: 'legendary' },
  { prefix: 'Toxic', color: '#88DD22', parts: ['venom_drip', 'mask', 'gloves'], accType: 'sparkles', accColor: '#88DD22', killFx: 'firework_burst', rarity: 'epic' },
  { prefix: 'Molten', color: '#FF5500', parts: ['flame_crown', 'pauldrons', 'claw_gauntlets'], accType: 'comet', accColor: '#FF5500', killFx: 'golden_blast', rarity: 'legendary' },
  { prefix: 'Glacial', color: '#66BBDD', parts: ['ice_crystals', 'headband', 'armguards'], accType: 'crystals', accColor: '#66BBDD', killFx: 'shatter', rarity: 'epic', stars: ['blue', 'silver'] },
  { prefix: 'Spectral', color: '#AABBFF', parts: ['shadow_cloak', 'soul_chains', 'halo_ring'], accType: 'mist', accColor: '#AABBFF', killFx: 'soul_release', rarity: 'epic' },
  { prefix: 'Infernal', color: '#DD2222', parts: ['horns_spike', 'flame_crown', 'cape_long'], accType: 'horns', accColor: '#DD2222', killFx: 'shockwave', rarity: 'legendary' },
  { prefix: 'Celestial', color: '#DDDDFF', parts: ['wings_energy', 'halo_ring', 'angel_feathers'], accType: 'star', accColor: '#FFFFFF', killFx: 'soul_release', rarity: 'legendary' },
  { prefix: 'Verdant', color: '#55AA55', parts: ['vine_bracers', 'crown_jewel', 'shoes'], accType: 'flower', accColor: '#55AA55', killFx: 'soul_release', rarity: 'rare' },
  { prefix: 'Neon', color: '#00FFAA', parts: ['sunglasses', 'gloves', 'shoes'], accType: 'sparkles', accColor: '#00FFAA', killFx: 'firework_burst', rarity: 'epic', stars: ['yellow', 'magenta'] },
  { prefix: 'Obsidian', color: '#332244', parts: ['shadow_cloak', 'horns_spike', 'claw_gauntlets'], accType: 'shadow', accColor: '#553366', killFx: 'void_implosion', rarity: 'legendary' },
  { prefix: 'Amber', color: '#FFBB33', parts: ['flame_crown', 'cape_long', 'gloves'], accType: 'comet', accColor: '#FFBB33', killFx: 'golden_blast', rarity: 'epic' },
  { prefix: 'Silken', color: '#FFDDEE', parts: ['scarf_long', 'cape_long', 'gloves'], accType: 'sparkles', accColor: '#FFDDEE', killFx: 'firework_burst', rarity: 'rare' },
  { prefix: 'Runic', color: '#7788CC', parts: ['crown_jewel', 'pauldrons', 'belt'], accType: 'lightning', accColor: '#7788CC', killFx: 'lightning_strike', rarity: 'epic' },
  { prefix: 'Mythic', color: '#AA44FF', parts: ['mind_halo', 'wings_energy', 'halo_ring'], accType: 'mist', accColor: '#AA44FF', killFx: 'void_implosion', rarity: 'legendary' },
  { prefix: 'Pristine', color: '#EEEEFF', parts: ['halo_ring', 'wings_energy', 'angel_feathers'], accType: 'halo', accColor: '#FFFFFF', killFx: 'soul_release', rarity: 'epic' },
  { prefix: 'Cursed', color: '#660033', parts: ['horns_spike', 'shadow_cloak', 'soul_chains'], accType: 'shadow', accColor: '#660033', killFx: 'void_implosion', rarity: 'legendary' },
  { prefix: 'Blessed', color: '#FFEEAA', parts: ['halo_ring', 'wings_energy', 'crown_jewel'], accType: 'halo', accColor: '#FFEEAA', killFx: 'golden_blast', rarity: 'legendary' },
  { prefix: 'Wicked', color: '#AA2266', parts: ['horns_spike', 'claw_gauntlets', 'cape_long'], accType: 'horns', accColor: '#AA2266', killFx: 'shockwave', rarity: 'epic' },
  { prefix: 'Sacred', color: '#FFDD88', parts: ['halo_ring', 'angel_feathers', 'crown_jewel'], accType: 'star', accColor: '#FFDD88', killFx: 'soul_release', rarity: 'legendary' },
  { prefix: 'Vile', color: '#557722', parts: ['venom_drip', 'mask', 'vine_bracers'], accType: 'sparkles', accColor: '#88DD22', killFx: 'firework_burst', rarity: 'epic' },
  { prefix: 'Noble', color: '#CC8844', parts: ['crown_jewel', 'cape_long', 'pauldrons'], accType: 'crown', accColor: '#CC8844', killFx: 'golden_blast', rarity: 'epic' },
  { prefix: 'Wild', color: '#448844', parts: ['claw_gauntlets', 'vine_bracers', 'mask'], accType: 'mist', accColor: '#448844', killFx: 'shockwave', rarity: 'rare' },
  { prefix: 'Cosmic', color: '#6644CC', parts: ['mind_halo', 'wings_energy', 'sunglasses'], accType: 'star', accColor: '#9966FF', killFx: 'void_implosion', rarity: 'legendary', stars: ['purple', 'white'] },
  { prefix: 'Abyssal', color: '#223366', parts: ['shadow_cloak', 'void_tendrils', 'soul_chains'], accType: 'shadow', accColor: '#334477', killFx: 'void_implosion', rarity: 'legendary' },
  { prefix: 'Solar', color: '#FFAA00', parts: ['flame_crown', 'crown_jewel', 'wings_energy'], accType: 'comet', accColor: '#FFAA00', killFx: 'golden_blast', rarity: 'legendary' },
  { prefix: 'Lunar', color: '#AABBDD', parts: ['halo_ring', 'shadow_cloak', 'sunglasses'], accType: 'mist', accColor: '#AABBDD', killFx: 'soul_release', rarity: 'epic', stars: ['silver', 'white'] },
  { prefix: 'Plasma', color: '#FF44CC', parts: ['sunglasses', 'gloves', 'shoes'], accType: 'sparkles', accColor: '#FF44CC', killFx: 'firework_burst', rarity: 'epic', stars: ['pink', 'magenta'] },
  { prefix: 'Coral', color: '#FF7755', parts: ['flower', 'vine_bracers', 'goggles'], accType: 'bubble', accColor: '#FF7755', killFx: 'firework_burst', rarity: 'rare' },
  { prefix: 'Jade', color: '#44AA88', parts: ['vine_bracers', 'mask', 'shoes'], accType: 'mist', accColor: '#44AA88', killFx: 'soul_release', rarity: 'rare' },
  { prefix: 'Onyx', color: '#222233', parts: ['shadow_cloak', 'horns_spike', 'mask'], accType: 'shadow', accColor: '#333344', killFx: 'void_implosion', rarity: 'legendary' },
  { prefix: 'Pearl', color: '#EEEEFF', parts: ['halo_ring', 'wings_energy', 'angel_feathers'], accType: 'halo', accColor: '#FFFFFF', killFx: 'soul_release', rarity: 'epic' },
  { prefix: 'Ruby', color: '#E0115F', parts: ['crown_jewel', 'cape_long', 'claw_gauntlets'], accType: 'crown', accColor: '#E0115F', killFx: 'shockwave', rarity: 'legendary' },
  { prefix: 'Sapphire', color: '#0F52BA', parts: ['headband', 'armguards', 'shoes'], accType: 'bubble', accColor: '#0F52BA', killFx: 'shockwave', rarity: 'epic', stars: ['blue', 'indigo'] },
  { prefix: 'Emerald', color: '#50C878', parts: ['vine_bracers', 'halo_ring', 'claw_gauntlets'], accType: 'mist', accColor: '#50C878', killFx: 'soul_release', rarity: 'epic' },
];

// Dramatic effect pool — each character gets a unique effect from this list
const DRAMATIC_EFFECTS = [
  'energy_spikes', 'orbiting_orbs', 'rising_souls', 'crystal_burst',
  'rune_circle', 'flame_aura', 'void_rift', 'lightning_crown',
  'cosmic_swirl', 'petal_storm', 'ice_spikes', 'shadow_tentacles',
  'phantom_echoes', 'fire_ring', 'energy_wings', 'star_shower',
];

// Generate unique custom parts for each character's event skin.
// Each character gets a different rotated subset of theme parts + a unique dramatic effect.
// Star skins get extra dramatic effects — things coming out of them.
function generateEventParts(theme, charIndex, isStar) {
  const baseParts = [...theme.parts];
  const rotated = [];
  for (let i = 0; i < baseParts.length; i++) {
    rotated.push(baseParts[(i + charIndex) % baseParts.length]);
  }
  const dramaticEffect = DRAMATIC_EFFECTS[charIndex % DRAMATIC_EFFECTS.length];
  const parts = rotated.slice(0, 2).map(p => ({ type: p, color: theme.color }));
  parts.push({ type: dramaticEffect, color: theme.color });
  if (isStar) {
    parts.push({ type: DRAMATIC_EFFECTS[(charIndex + 4) % DRAMATIC_EFFECTS.length], color: theme.color });
    parts.push({ type: DRAMATIC_EFFECTS[(charIndex + 8) % DRAMATIC_EFFECTS.length], color: theme.color });
    parts.push({ type: 'energy_wings', color: theme.color });
    parts.push({ type: 'crown', color: theme.color });
  }
  return parts;
}

// Generate 100 events by cycling through themes with variations
function generateEvents() {
  const events = [];
  for (let i = 0; i < 100; i++) {
    const theme = EVENT_THEMES[i % EVENT_THEMES.length];
    const variant = Math.floor(i / EVENT_THEMES.length);
    const suffix = variant > 0 ? ` ${variant + 1}` : '';
    const name = `${theme.prefix} of Color${suffix}`;
    const startDate = new Date(2024, (i * 2) % 12, 1);
    const endDate = new Date(2024, ((i * 2) % 12) + 2, 0);

    // Pick 2 star characters for this event — use theme.stars or pick by color proximity
    let starIds = theme.stars;
    if (!starIds || starIds.length < 2) {
      // Fallback: pick 2 characters whose color is closest to the event color
      const sorted = [...ALL].sort((a, b) => colorDist(b.color, theme.color) - colorDist(a.color, theme.color));
      starIds = [sorted[0].id, sorted[1].id];
    }
    const starChars = starIds.map(id => ALL.find(c => c.id === id)).filter(Boolean);

    // Generate event skins for ALL characters
    const skins = ALL.map((char, ci) => ({
      id: `event_skin_${i}_${char.id}`,
      eventId: `event_${i}`,
      charId: char.id,
      name: `${theme.prefix} ${char.name}`,
      color: theme.color,
      customParts: generateEventParts(theme, ci, false),
      rarity: theme.rarity,
      isEvent: true,
    }));

    // Special star character skins — extra rare, unique parts
    const starSkins = starChars.map((char) => {
      const charIndex = ALL.findIndex(c => c.id === char.id);
      return {
        id: `event_star_skin_${i}_${char.id}`,
        eventId: `event_${i}`,
        charId: char.id,
        name: `${theme.prefix} ${char.name} ★ STAR`,
        color: theme.color,
        customParts: generateEventParts(theme, charIndex, true),
        rarity: 'legendary',
        isEvent: true,
        isStar: true,
      };
    });

    // Generate event accessory, kill FX, gear
    const eventAccessory = {
      id: `event_acc_${i}`,
      eventId: `event_${i}`,
      name: `${theme.prefix} Aura`,
      type: theme.accType,
      color: theme.accColor,
      isEvent: true,
    };

    const eventKillFX = {
      id: `event_killfx_${i}`,
      eventId: `event_${i}`,
      name: `${theme.prefix} KO`,
      baseFxId: theme.killFx,
      isEvent: true,
    };

    // Event stage — unique platform layout per event
    const eventStage = {
      id: `event_stage_${i}`,
      name: `${theme.prefix} Arena`,
      color: theme.color,
      bgStyle: theme.prefix.toLowerCase(),
      platforms: generateEventStagePlatforms(i),
    };

    // ── Generate cool multi-colored accessories for the battle pass ──
    const MULTI_PAL = ['#FF4444', '#FF8844', '#FFDD44', '#44FF44', '#44FFAA', '#44DDFF', '#4488FF', '#AA44FF', '#FF44AA', '#FF44DD'];
    const MULTI_ACC_TYPES = ['aura', 'crown', 'wings', 'halo', 'horns', 'cape', 'scarf', 'comet', 'bubble', 'crystals', 'lightning', 'star', 'mist', 'sparkles', 'flame_aura', 'energy_wings', 'orbiting_orbs', 'rune_circle', 'cosmic_swirl', 'petal_storm'];
    const STAR_ACC_TYPES = ['energy_wings', 'fire_ring', 'cosmic_swirl', 'rune_circle', 'lightning_crown', 'star_shower', 'flame_aura', 'orbiting_orbs'];
    const bpAccessories = [];
    for (let a = 0; a < 30; a++) {
      const aType = MULTI_ACC_TYPES[(a + i) % MULTI_ACC_TYPES.length];
      const c1 = MULTI_PAL[a % MULTI_PAL.length];
      bpAccessories.push({
        id: `event_bp_acc_${i}_${a}`, eventId: `event_${i}`,
        name: `${theme.prefix} ${aType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        type: aType, color: c1, isEvent: true,
      });
    }
    const starBpAccessories = STAR_ACC_TYPES.map((t, si) => ({
      id: `event_bp_star_${i}_${si}`, eventId: `event_${i}`,
      name: `${theme.prefix} ${t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ★`,
      type: t, color: theme.color, isEvent: true, isStar: true,
    }));

    // ── 2 character unlock tiers (VERY RARE — 1-2 per 50 tiers) ──
    // Each gives a random character from ALL gens 1–5. Over many events you can
    // eventually unlock every character, but each individual drop is very rare.
    const charUnlockTiers = [47, 49];
    const unlockOrder = [...ALL].sort((a, b) => ((a.id.charCodeAt(0) * 31 + i) % 97) - ((b.id.charCodeAt(0) * 31 + i) % 97));

    // ── 3 emote unlock tiers (RARE — 2-3 per 50 tiers) ──
    // Each gives a random emote. Emotes are rare but more common than characters.
    const emoteUnlockTiers = [13, 29, 43];
    const emoteOrder = [...EMOTES].sort((a, b) => ((a.id.charCodeAt(0) * 37 + i * 13) % 89) - ((b.id.charCodeAt(0) * 37 + i * 13) % 89));

    // ── 50-TIER BATTLE PASS ──
    const battlePass = [];
    for (let tier = 1; tier <= 50; tier++) {
      let reward;
      if (tier === 50) {
        // Ultimate: grants every event accessory
        reward = { type: 'allaccessories', items: bpAccessories, name: `${theme.prefix} All-Accessory Pack ★`, rarity: 'legendary' };
      } else if (tier === 10 || tier === 20 || tier === 30 || tier === 40) {
        // Milestone: star accessory (extra special multi-colored)
        const starIdx = (tier / 10 - 1) % starBpAccessories.length;
        reward = { type: 'accessory', item: starBpAccessories[starIdx], isStar: true };
      } else if (charUnlockTiers.includes(tier)) {
        // Character unlock (VERY RARE)
        const ci = charUnlockTiers.indexOf(tier) % unlockOrder.length;
        reward = { type: 'character', charId: unlockOrder[ci].id, name: unlockOrder[ci].name };
      } else if (emoteUnlockTiers.includes(tier)) {
        // Emote unlock (RARE)
        const ei = emoteUnlockTiers.indexOf(tier) % emoteOrder.length;
        reward = { type: 'emote', emoteId: emoteOrder[ei].id, name: emoteOrder[ei].name };
      } else if (tier % 10 === 5) {
        // Every 5th tier (except milestones): kill FX
        reward = { type: 'killfx', item: eventKillFX };
      } else if (tier % 5 === 0) {
        // Other multiples of 5: tokens (big)
        reward = { type: 'tokens', amount: 50 + tier * 5 };
      } else if (tier % 3 === 0) {
        // Every 3rd tier: tokens
        reward = { type: 'tokens', amount: 25 + tier * 2 };
      } else {
        // Other tiers: multi-colored accessory
        const ai = (tier * 2 + i) % bpAccessories.length;
        reward = { type: 'accessory', item: bpAccessories[ai] };
      }
      battlePass.push({ tier, ...reward });
    }

    events.push({
      id: `event_${i}`,
      index: i,
      name,
      theme: theme.prefix,
      color: theme.color,
      starCharIds: starIds,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      skins: [...skins, ...starSkins],
      accessory: eventAccessory,
      killFX: eventKillFX,
      eventStage,
      battlePass,
    });
  }
  return events;
}

// Color distance helper — picks characters whose color is closest to the event color
function colorDist(hex1, hex2) {
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  return 255 * 3 - (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2));
}

// Generate unique platform layouts per event
function generateEventStagePlatforms(eventIndex) {
  const seed = eventIndex * 137;
  const layouts = [
    [{ x: 40, y: 620, w: 1200, h: 48 }, { x: 120, y: 440, w: 360, h: 20 }, { x: 800, y: 440, w: 360, h: 20 }, { x: 460, y: 270, w: 360, h: 20 }],
    [{ x: 40, y: 620, w: 1200, h: 48 }, { x: 200, y: 480, w: 200, h: 20 }, { x: 880, y: 480, w: 200, h: 20 }, { x: 540, y: 350, w: 200, h: 20 }, { x: 100, y: 320, w: 160, h: 18 }, { x: 1020, y: 320, w: 160, h: 18 }],
    [{ x: 40, y: 620, w: 1200, h: 48 }, { x: 80, y: 500, w: 240, h: 18 }, { x: 960, y: 500, w: 240, h: 18 }, { x: 400, y: 400, w: 200, h: 18 }, { x: 680, y: 400, w: 200, h: 18 }, { x: 540, y: 280, w: 200, h: 18 }],
    [{ x: 40, y: 620, w: 1200, h: 48 }, { x: 180, y: 460, w: 300, h: 18 }, { x: 800, y: 460, w: 300, h: 18 }, { x: 480, y: 300, w: 320, h: 18 }, { x: 300, y: 380, w: 160, h: 14 }, { x: 820, y: 380, w: 160, h: 14 }],
    [{ x: 40, y: 620, w: 1200, h: 48 }, { x: 100, y: 460, w: 280, h: 18 }, { x: 900, y: 460, w: 280, h: 18 }, { x: 500, y: 300, w: 280, h: 18 }, { x: 300, y: 400, w: 160, h: 18 }, { x: 820, y: 400, w: 160, h: 18 }],
  ];
  return layouts[eventIndex % layouts.length];
}

export const EVENTS = generateEvents();

// Resolve any event battle pass accessory by ID (multi-colored + star
// accessories granted by battle pass tiers). These aren't in event.accessory,
// so getAccessory falls back to this map to make claimed loot equippable.
const _BP_ACC_MAP = new Map();
for (const ev of EVENTS) {
  for (const bp of ev.battlePass || []) {
    if (bp.type === 'accessory' && bp.item) _BP_ACC_MAP.set(bp.item.id, bp.item);
    if (bp.type === 'allaccessories' && bp.items) bp.items.forEach(a => _BP_ACC_MAP.set(a.id, a));
  }
}
export function getEventBattlePassAccessory(id) { return _BP_ACC_MAP.get(id) || null; }

// Get the active event for a given date (2-month windows)
export function getActiveEvent(date = new Date()) {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  // Each event lasts 2 months — index = month/2 + (year-2024)*6
  const eventIndex = (Math.floor(month / 2) + (year - 2024) * 6) % 100;
  return EVENTS[eventIndex];
}

export function getEventById(id) {
  return EVENTS.find(e => e.id === id);
}

// Get the next upcoming event and the date it starts.
// Events last 2 months each; the next one begins at the start of the
// next 2-month window (first day of the month, 2 months after this window's start).
export function getNextEvent(date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const eventIndex = (Math.floor(month / 2) + (year - 2024) * 6) % 100;
  const nextIndex = (eventIndex + 1) % 100;
  const nextEvent = EVENTS[nextIndex];
  // Start of current 2-month window
  const currentStartMonth = Math.floor(month / 2) * 2;
  // Next window starts 2 months later
  let nextStartMonth = currentStartMonth + 2;
  let nextStartYear = year;
  if (nextStartMonth > 11) { nextStartMonth -= 12; nextStartYear += 1; }
  const startDate = new Date(nextStartYear, nextStartMonth, 1, 0, 0, 0, 0);
  return { event: nextEvent, startDate };
}

// Get event skins for a character
export function getEventSkinsForChar(charId, eventId) {
  const event = getEventById(eventId);
  if (!event) return [];
  return event.skins.filter(s => s.charId === charId || s.isAllChar);
}

// Check if a skin ID is an event skin
export function isEventSkin(skinId) {
  return skinId && skinId.startsWith('event_skin_');
}

// Get event skin by ID
export function getEventSkin(skinId) {
  for (const event of EVENTS) {
    const skin = event.skins.find(s => s.id === skinId);
    if (skin) return skin;
  }
  return null;
}

// Get event accessory by ID
export function getEventAccessory(id) {
  for (const event of EVENTS) {
    if (event.accessory.id === id) return event.accessory;
  }
  return null;
}

// Get event kill FX by ID
export function getEventKillFX(id) {
  for (const event of EVENTS) {
    if (event.killFX.id === id) return event.killFX;
  }
  return null;
}