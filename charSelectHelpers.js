// Shared helpers for the redesigned character selection screens.

import { ALL_CHARS, ERA_MAP, ERAS } from './allCharacters.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';

// ── Alignment mapping ──
// Two categories only: Heroes and Non Heroes (villains, antiheroes, antivillains, rogues, guardians).
export const ALIGNMENTS = [
  { id: 'all', label: 'All' },
  { id: 'Heroes', label: 'Heroes' },
  { id: 'Non Heroes', label: 'Non Heroes' },
];

const ROLE_TO_ALIGNMENT = {
  Hero: 'Heroes',
  Villain: 'Non Heroes',
  'Major Villain': 'Non Heroes',
  Antivillain: 'Non Heroes',
  Antagonist: 'Non Heroes',
  Guardian: 'Non Heroes',
};

export function getAlignment(char) {
  if (char.role) return ROLE_TO_ALIGNMENT[char.role] || 'Non Heroes';
  // Gen V chars don't have `role` — infer from source array
  if (HEROES.some(h => h.id === char.id)) return 'Heroes';
  return 'Non Heroes';
}

// ── Era helpers ──
export const ERA_OPTIONS = [
  { id: 'all', name: 'All Eras', short: 'ALL', accent: '#FFFFFF' },
  ...ERAS.map(e => ({ id: e.id, name: e.name, short: e.short, accent: e.accent })),
  { id: 'custom', name: 'Custom', short: 'CUSTOM', accent: '#FF66AA' },
];

export function getEraLabel(char) {
  if (char.isCustom) return 'Custom';
  const era = char.era || 'g5';
  return ERA_MAP[era]?.name || 'Heroes of Color';
}

export function getEraShort(char) {
  if (char.isCustom) return 'CUSTOM';
  const era = char.era || 'g5';
  return ERA_MAP[era]?.short || 'G5';
}

export function getEraAccent(char) {
  if (char.isCustom) return '#FF66AA';
  const era = char.era || 'g5';
  return ERA_MAP[era]?.accent || '#9944CC';
}

// ── Element / power helpers ──
export function getPowerName(char) {
  return char.power || char.powerTitle || 'Unknown';
}

// ── Stat helpers ──
export const STAT_KEYS = ['speed', 'power', 'defense', 'control', 'utility'];

export function getStatTotal(stats) {
  if (!stats) return 0;
  return STAT_KEYS.reduce((sum, k) => sum + (stats[k] || 0), 0);
}

// ── Real name extraction ──
export function getRealName(char) {
  if (char.realName) return char.realName;
  return null;
}

// ── Name color ──
// Certain dark characters render their name text in white for readability.
const WHITE_NAME_IDS = new Set([
  'black', 'g2_nishikawa', 'g2_utsuro', 'g3_souta', 'g3_masaru', 'g4_onyx', 'g4_graphite', 'controller',
]);
export function getNameColor(char) {
  if (!char) return '#FFFFFF';
  if (WHITE_NAME_IDS.has(char.id)) return '#FFFFFF';
  return char.color || '#FFFFFF';
}

// ── Generation ordering (g1 → g2 → g3 → g4 → g5) ──
const ERA_ORDER = { g1: 0, g2: 1, g3: 2, g4: 3, g5: 4 };

export function sortByEra(chars) {
  return [...chars].sort((a, b) => {
    const ea = ERA_ORDER[a.era || 'g5'] ?? 5;
    const eb = ERA_ORDER[b.era || 'g5'] ?? 5;
    return ea - eb;
  });
}

// ── Filtering ──
export function filterCharacters(chars, { era, alignment }) {
  return chars.filter(c => {
    if (era === 'custom') {
      if (!c.isCustom) return false;
    } else if (era !== 'all' && (c.era || 'g5') !== era) {
      return false;
    }
    if (alignment !== 'all' && getAlignment(c) !== alignment) return false;
    return true;
  });
}