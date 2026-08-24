// Skins have been REMOVED from the game. All unique skin parts are now universal
// accessories (see universalAccessories.js / cosmetics.js) available to every
// character. This module keeps its exported function names so existing imports
// don't break, but every lookup now returns null / empty — skins no longer
// render and can no longer be equipped.

import { MASTERY_REWARDS } from './mastery.js';

export const RARITY_COLORS = {
  common: '#AAAAAA',
  rare: '#4488FF',
  epic: '#AA44FF',
  legendary: '#FFD700',
};

// No shop / event skins exist anymore.
export const SKINS = [];

export function getSkin(id) {
  // Mastery tint skins (id format: mastery_<charId>_<rankId>) are progression
  // rewards, not shop skins — keep them working so the mastery system still
  // recolors a mastered character.
  if (id && id.startsWith('mastery_')) {
    const parts = id.split('_');
    const rankId = parseInt(parts[parts.length - 1], 10);
    const charId = parts.slice(1, -1).join('_');
    const reward = MASTERY_REWARDS.find(r => r.rankId === rankId);
    if (reward) {
      return { id, charId, name: `${reward.badgeName} Tint`, color: reward.skinTint, customParts: [], price: 0, rarity: 'legendary', isMastery: true };
    }
  }
  return null;
}

export function shopSkinsForChar(charId) {
  return [];
}

export function skinsForChar(charId, ownedSkins = null) {
  return [];
}

// Returns the color to use for rendering a character, considering equipped skin.
// Only mastery tints still apply; everything else returns null (use default color).
export function getCharRenderColor(charId, equippedSkins = {}) {
  const skinId = equippedSkins[charId];
  if (!skinId) return null;
  const sk = getSkin(skinId);
  return sk ? sk.color : null;
}

// Returns all custom parts for a character's equipped skin (always empty now).
export function getSkinParts(charId, equippedSkins = {}) {
  return [];
}

// Backwards compat — returns first part as an accessory-like object.
export function getSkinAccessory(charId, equippedSkins = {}) {
  return null;
}