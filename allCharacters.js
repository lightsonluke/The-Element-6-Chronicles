// ═══════════════════════════════════════════════════════════════
// UNIFIED CHARACTER REGISTRY
// Merges Generation V (existing) + Generations I-IV (old-gen era chars)
// into a single normalized roster used across the ENTIRE game.
// ═══════════════════════════════════════════════════════════════

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { OLD_GEN_CHARS, ERA_MAP, ERAS } from './eras.js';
import { CROSSOVERS } from './crossovers.js';

// Parse a character's raw name into a short display name and a full name.
// G4 heroes: "Cobalt — Kenji Aoyama" → display "Cobalt", full "Kenji Aoyama"
// G2/G3: "Renji Kurogane" → display "Renji", full "Renji Kurogane"
// Nickname: "Nishikawa the Puppeteer" → display "The Puppeteer", full "Nishikawa"
// "Hollow Monk — Ibuki" → display "Hollow Monk", full "Ibuki"
export function parseCharName(name) {
  if (!name) return { displayName: '', fullName: '' };
  if (name.startsWith('The ') || name.startsWith('Lord ')) return { displayName: name, fullName: name };
  if (name.includes(' — ')) {
    const [display, full] = name.split(' — ');
    return { displayName: display.trim(), fullName: full.trim() };
  }
  const theMatch = name.match(/^(\w+)\s+the\s+(.+)$/i);
  if (theMatch) return { displayName: 'The ' + theMatch[2], fullName: theMatch[1] };
  const parts = name.split(' ');
  if (parts.length >= 2) return { displayName: parts[0], fullName: name };
  return { displayName: name, fullName: name };
}

// Normalize old-gen chars so they have the same field names as Gen V chars.
// Old-gen uses `powerTitle`; Gen V uses `power`. Add `power` alias.
// Also parse the name into a short display name + full name.
function normalizeOldGen(c) {
  const { displayName, fullName } = parseCharName(c.name);
  return {
    ...c,
    name: displayName,
    fullName,
    power: c.power || c.powerTitle || 'Unknown',
    powerTitle: c.powerTitle || c.power || 'Unknown',
    isGuardian: false,
    isOldGen: true,
  };
}

const OLD_GEN_NORMALIZED = OLD_GEN_CHARS.map(normalizeOldGen);
const OLD_GEN_MAP = Object.fromEntries(OLD_GEN_NORMALIZED.map(c => [c.id, c]));

// Mark Gen V chars with era g5
const G5_CHARS = [...HEROES, ...VILLAINS, ...GUARDIANS].map(c => ({ ...c, era: c.era || 'g5' }));

// Crossover characters — each crossover becomes a standalone playable character
// derived from its base character, with the crossover's colors and name.
const BASE_CHARS = [...G5_CHARS, ...OLD_GEN_NORMALIZED];
const BASE_CHARS_MAP = Object.fromEntries(BASE_CHARS.map(c => [c.id, c]));
const CROSSOVER_CHARS = CROSSOVERS.map(cx => {
  const base = BASE_CHARS_MAP[cx.charId];
  if (!base) return null;
  return {
    ...base,
    id: cx.id,
    name: cx.name,
    color: cx.colorMap.primary,
    secondaryColor: cx.colorMap.secondary,
    baseCharId: cx.charId,
    isCrossover: true,
    crossoverId: cx.id,
    title: cx.origin,
    era: base.era || 'g5',
  };
}).filter(Boolean);

// The master roster — every playable character in the game.
export const ALL_CHARS = [...BASE_CHARS, ...CROSSOVER_CHARS];

export const ALL_CHARS_MAP = Object.fromEntries(ALL_CHARS.map(c => [c.id, c]));

// ── Era helpers ──
export function getRosterForEra(eraId) {
  if (eraId === 'all') return ALL_CHARS;
  if (eraId === 'g5') return G5_CHARS;
  return OLD_GEN_NORMALIZED.filter(c => c.era === eraId);
}

export function getEraForCharId(id) {
  if (OLD_GEN_MAP[id]) return ERA_MAP[OLD_GEN_MAP[id].era];
  return ERA_MAP['g5'];
}

export function getCharByIdUniversal(id) {
  return ALL_CHARS_MAP[id] || null;
}

export { ERAS, ERA_MAP };

// Random helpers
export function randomCharFromEra(eraId) {
  const roster = getRosterForEra(eraId);
  return roster.length ? roster[Math.floor(Math.random() * roster.length)] : null;
}

export function randomCharAllEras() {
  return ALL_CHARS.length ? ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)] : null;
}

// Search across all characters
export function searchAllCharsUniversal(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return ALL_CHARS.filter(c =>
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.fullName && c.fullName.toLowerCase().includes(q)) ||
    (c.power && c.power.toLowerCase().includes(q)) ||
    (c.title && c.title.toLowerCase().includes(q)) ||
    (c.powerTitle && c.powerTitle.toLowerCase().includes(q))
  );
}