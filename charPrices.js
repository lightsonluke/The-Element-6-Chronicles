import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { OLD_GEN_CHARS, ERA_MAP } from './eras.js';

// The 6 original Gen 5 heroes — cheapest tier
const CHEAP_HEROES = new Set(['yellow', 'blue', 'purple', 'orange', 'green', 'pink']);

const OLD_GEN_MAP = Object.fromEntries(OLD_GEN_CHARS.map(c => [c.id, c]));

export function charPrice(charId) {
  // The 6 main heroes — 1000 tokens
  if (CHEAP_HEROES.has(charId)) return 1000;
  // Guardians (including Evil) — 6000 tokens
  if (charId === 'evil' || GUARDIANS.some(g => g.id === charId)) return 6000;
  // Bosses — 5500 tokens
  if (charCategory(charId) === 'BOSS') return 5500;
  // Villains — 5200 tokens
  if (charCategory(charId) === 'VILLAIN') return 5200;
  // All other heroes — 5000 tokens
  return 5000;
}

export function charCategory(charId) {
  if (charId === 'evil') return 'BOSS';
  if (GUARDIANS.some(g => g.id === charId)) return 'GUARDIAN';
  if (VILLAINS.some(v => v.id === charId)) return 'VILLAIN';
  if (HEROES.some(h => h.id === charId)) return 'HERO';
  // Old-gen categories
  const og = OLD_GEN_MAP[charId];
  if (og) {
    if (og.role === 'Hero') return 'HERO';
    if (og.role === 'Major Villain') return 'BOSS';
    return 'VILLAIN';
  }
  return 'HERO';
}

export function charEra(charId) {
  if (OLD_GEN_MAP[charId]) return OLD_GEN_MAP[charId].era;
  return 'g5';
}

export const CATEGORY_COLORS = {
  HERO: '#44FF88',
  VILLAIN: '#FF6644',
  GUARDIAN: '#FFD700',
  BOSS: '#FF0044',
};