// Emote slot management — handles equipped emote slots for different player counts.
// 
// Single player / online: 10 slots (keys 1-0)
// 2-player local co-op: 5 slots each (P2: keys 1-5, P1: keys 6-0)
//
// equippedEmotes is stored in UserProgress/settings as:
//   { emoteSlots: ['fistbump', 'wave', 'laugh', ...], emoteSlotsP2: [...] }
// or per-character if we want character-specific emote loadouts.

import { getEmoteById } from './emotes.js';

// Number keys for each player configuration
export const SOLO_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
export const COOP_P2_KEYS = ['1', '2', '3', '4', '5'];
export const COOP_P1_KEYS = ['6', '7', '8', '9', '0'];

// Get the key list for a given player and mode
export function getEmoteKeys(playerId, mode) {
  // mode: 'solo' | 'coop' | 'online'
  if (mode === 'coop') {
    return playerId === 2 ? COOP_P2_KEYS : COOP_P1_KEYS;
  }
  return SOLO_KEYS; // solo and online both get full 1-0
}

// Get the equipped emote IDs for a player
// equippedEmotes: { emoteSlots: [...], emoteSlotsP2: [...] }
export function getEquippedEmoteSlots(equippedEmotes, playerId = 1) {
  if (!equippedEmotes) return [];
  if (playerId === 2) return equippedEmotes.emoteSlotsP2 || [];
  return equippedEmotes.emoteSlots || [];
}

// Get the emote object for a specific key press
export function getEmoteForKey(key, equippedEmotes, playerId, mode) {
  const keys = getEmoteKeys(playerId, mode);
  const slotIndex = keys.indexOf(key);
  if (slotIndex < 0) return null;
  const slots = getEquippedEmoteSlots(equippedEmotes, playerId);
  const emoteId = slots[slotIndex];
  if (!emoteId) return null;
  return getEmoteById(emoteId);
}

// Set an emote in a specific slot
export function setEmoteSlot(equippedEmotes, playerId, slotIndex, emoteId) {
  const key = playerId === 2 ? 'emoteSlotsP2' : 'emoteSlots';
  const slots = [...(equippedEmotes?.[key] || [])];
  // Extend array if needed
  while (slots.length <= slotIndex) slots.push(null);
  slots[slotIndex] = emoteId;
  return { ...equippedEmotes, [key]: slots };
}

// Get the max number of slots for a mode
export function getMaxSlots(mode) {
  return mode === 'coop' ? 5 : 10;
}

// Check if a player owns an emote
export function ownsEmote(ownedEmotes, emoteId) {
  if (!ownedEmotes) return false;
  // Free emotes (price 0) are always owned
  const emote = getEmoteById(emoteId);
  if (emote && emote.price === 0) return true;
  return Array.isArray(ownedEmotes) ? ownedEmotes.includes(emoteId) : !!ownedEmotes[emoteId];
}

// ── Victory emote — played automatically on the victory screen ──
export function getVictoryEmote(equippedEmotes) {
  return equippedEmotes?.victoryEmote || null;
}

export function setVictoryEmote(equippedEmotes, emoteId) {
  return { ...equippedEmotes, victoryEmote: emoteId };
}