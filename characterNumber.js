import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';

// Heroes: number 1..N in unlock order
// Villains + Guardians: countdown from 99 (Life=99, Death=98, Mercy=97, Evil=96, Controller=95, ...)
const VILLAIN_GUARDIAN_ORDER = [
  'life', 'death', 'mercy',          // 99, 98, 97
  'evil', 'controller', 'whami', 'hazel', 'nightmare', 'temple',
  'volt', 'kirsten', 'snodvor', 'cable', 'willow', 'magneto', 'corpent',
];

const NUMBER_MAP = {};
HEROES.forEach((h, i) => { NUMBER_MAP[h.id] = i + 1; });
VILLAIN_GUARDIAN_ORDER.forEach((id, i) => { NUMBER_MAP[id] = 99 - i; });

// Override specific character numbers (duplicate #19 is intentional)
NUMBER_MAP['crimson'] = 19;
NUMBER_MAP['scarlet'] = 20;
NUMBER_MAP['white'] = 21;
NUMBER_MAP['silver'] = 22;

// Custom characters use numbers 30–40, assigned in CREATION ORDER.
// When a custom character is deleted, the remaining ones re-index to fill the
// gap (because the numbering is recomputed from the creation-date-sorted list).
const CUSTOM_CHAR_NUMBERS = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40];

// Build a { custom_<id>: number } map from an array of custom character records
// (or customCharsData map values). Sorted by created_date ascending = creation order.
export function buildCustomNumberMap(customChars) {
  if (!customChars) return {};
  const list = Array.isArray(customChars) ? customChars : Object.values(customChars);
  const sorted = [...list].sort((a, b) => {
    const da = a.created_date || a._created || '';
    const db = b.created_date || b._created || '';
    return String(da).localeCompare(String(db));
  });
  const map = {};
  sorted.forEach((c, i) => {
    const id = c.id && String(c.id).startsWith('custom_') ? c.id : `custom_${c.id}`;
    map[id] = CUSTOM_CHAR_NUMBERS[i] ?? null;
  });
  return map;
}

// Return a base character list with the user's custom characters appended at the
// end, sorted by their assigned number (i.e. creation order).
export function withCustomChars(baseList, customCharsData = {}, customNumberMap = {}) {
  const customs = Object.values(customCharsData)
    .filter(c => c && c.isCustom)
    .sort((a, b) => (customNumberMap[a.id] ?? 99) - (customNumberMap[b.id] ?? 99));
  return [...baseList, ...customs];
}

export function getCharNumber(charId, customNumberMap = {}) {
  // Custom characters: look up the precomputed creation-order number
  if (charId && charId.startsWith('custom_')) {
    return customNumberMap[charId] ?? null;
  }
  return NUMBER_MAP[charId] ?? null;
}

export function getCharName(charId) {
  const c = HEROES.find(h => h.id === charId)
    || VILLAINS.find(v => v.id === charId)
    || GUARDIANS.find(g => g.id === charId);
  return c?.name || '';
}

// Custom character slot limits
export const MAX_CUSTOM_CHARS = 10;
export const FREE_CUSTOM_SLOTS = 3;