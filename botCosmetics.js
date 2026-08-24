// Bot Cosmetics — generates random accessories + shikigami for bot fighters.
// Called at match start to give every bot a random loadout (doesn't require ownership).
// Rules:
// - Bots can wear ANY accessory (not just their own exclusive ones), including non-jersey items
// - At most 1 kit/jersey type accessory per bot
// - MAX 2 accessories total (not including shikigami)
// - 1 shikigami
// - Cosmetics are cached per charId so they don't change mid-match

import { ACCESSORIES } from './cosmetics.js';
import { SHIKIGAMI } from './shikigami.js';
import { ALL_CHARS_MAP } from './allCharacters.js';

// Kit/jersey types that count toward the "1 kit" limit
const KIT_TYPES = new Set(['soccer_kit', 'volleyball_kit', 'baseball_kit', 'basketball_kit', 'tennis_kit', 'track_kit']);

function pickRandom(arr, n) {
  const pool = [...arr];
  const result = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// Generate a random set of 2 accessory ids + 1 shikigami id for a bot.
// Bots can wear ANY accessory (not just their own exclusive ones).
// At most 1 kit/jersey type accessory. Max 2 accessories total.
export function randomBotCosmeticsForChar(charId) {
  const char = ALL_CHARS_MAP[charId];
  if (!char) return { accessories: [], shikigami: null };

  // All accessories available to this character:
  // - Exclusive to this character (their own color)
  // - Generic accessories (no exclusiveTo set)
  const ownAccs = ACCESSORIES.filter(a => !a.exclusiveTo || a.exclusiveTo === charId);

  // Split into kits and non-kits
  const kits = ownAccs.filter(a => KIT_TYPES.has(a.type));
  const nonKits = ownAccs.filter(a => !KIT_TYPES.has(a.type));

  const result = [];

  // Pick at most 1 kit (50% chance to include a kit)
  if (kits.length > 0 && Math.random() < 0.5) {
    result.push(kits[Math.floor(Math.random() * kits.length)].id);
  }

  // Fill remaining slots with non-kit accessories (up to 2 total)
  const remaining = 2 - result.length;
  const pickedNonKits = pickRandom(nonKits, remaining);
  result.push(...pickedNonKits.map(a => a.id));

  // If we still need more and haven't used a kit yet, add one
  while (result.length < 2 && kits.length > 0 && !result.some(id => kits.some(k => k.id === id))) {
    result.push(kits[Math.floor(Math.random() * kits.length)].id);
  }

  const shikigami = SHIKIGAMI[Math.floor(Math.random() * SHIKIGAMI.length)]?.id || null;
  return { accessories: result.slice(0, 2), shikigami };
}

// Legacy export — generates random cosmetics for a random character.
// Prefer randomBotCosmeticsForChar for character-specific cosmetics.
export function randomBotCosmetics() {
  const charIds = Object.keys(ALL_CHARS_MAP);
  const randomCharId = charIds[Math.floor(Math.random() * charIds.length)];
  return randomBotCosmeticsForChar(randomCharId);
}

// Module-level cache — keeps bot cosmetics stable for the entire match.
// Once a charId's cosmetics are generated, they persist until cleared.
const botCosmeticCache = new Map();

// Merge player-equipped cosmetics with random bot cosmetics.
// Returns { equippedAccessories, equippedShikigami } maps that include
// random entries for every bot character id in botCharIds.
// IMPORTANT: Results are cached per-charId so they don't change mid-match.
export function mergeBotCosmetics(playerAccessories, playerShikigami, botCharIds) {
  const equippedAccessories = { ...(playerAccessories || {}) };
  const equippedShikigami = { ...(playerShikigami || {}) };
  for (const charId of botCharIds) {
    if (!charId) continue;
    // Only generate once per charId — keeps cosmetics stable for the entire match
    if (!botCosmeticCache.has(charId)) {
      botCosmeticCache.set(charId, randomBotCosmeticsForChar(charId));
    }
    const bot = botCosmeticCache.get(charId);
    if (!equippedAccessories[charId] || (Array.isArray(equippedAccessories[charId]) && equippedAccessories[charId].length === 0)) {
      equippedAccessories[charId] = bot.accessories;
    }
    if (!equippedShikigami[charId]) {
      equippedShikigami[charId] = bot.shikigami;
    }
  }
  return { equippedAccessories, equippedShikigami };
}

// Clear the bot cosmetic cache (call when a match ends or a new match starts)
export function clearBotCosmeticCache() {
  botCosmeticCache.clear();
}