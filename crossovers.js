// Crossovers — thematic event-based skins that transform character visuals and attack colors.
// Each crossover overrides the character's primary color, secondary color, and attack effect color.
// Crossovers are earned through Battle Pass events or purchased in the Shop.

// Price overhaul — all crossovers get a zero added to their price (done at end of file)
const _CROSSOVER_PRICE_MULT = 10;
export const CROSSOVERS = [
  // ── DUSK EVENT (3 characters, Backrooms-themed) ──
  {
    id: 'crossover_pearl_lifeform',
    charId: 'pearl',
    name: 'The Lifeform',
    origin: 'The Backrooms',
    event: 'Dusk',
    desc: 'A sickly, fluorescent entity that flickers between dimensions. Born from the endless yellow halls.',
    colorMap: { primary: '#C9C200', secondary: '#8A8500', attack: '#000000', aura: '#AAAA00' },
    price: 500,
    rarity: 'legendary',
  },
  {
    id: 'crossover_evil_entity',
    charId: 'evil',
    name: 'The Entity',
    origin: 'The Backrooms',
    event: 'Dusk',
    desc: 'A pitch-black silhouette with glowing white eyes that stalks the endless halls of the Backrooms.',
    colorMap: { primary: '#1A1A1A', secondary: '#0A0A0A', attack: '#000000', aura: '#444444' },
    price: 500,
    rarity: 'legendary',
  },
  {
    id: 'crossover_blue_wanderer',
    charId: 'blue',
    name: 'The Wanderer',
    origin: 'The Backrooms',
    event: 'Dusk',
    desc: 'A lost traveler drifting through the Backrooms, leaving a haunting after-image with every step.',
    colorMap: { primary: '#2A3A5A', secondary: '#1A2A4A', attack: '#000000', aura: '#5577AA' },
    price: 500,
    rarity: 'legendary',
  },
  // ── NEON EVENT (3 characters, Cyberpunk-themed) ──
  {
    id: 'crossover_yellow_netrunner',
    charId: 'yellow',
    name: 'NetRunner',
    origin: 'Future Noir (Cyberpunk)',
    event: 'Neon',
    desc: 'Matte black armor with glowing circuit-board lines in cyan and magenta. Dash attacks leave a digital glitch trail.',
    colorMap: { primary: '#0A0A0A', secondary: '#1A1A2A', attack: '#000000', aura: '#FF00FF' },
    price: 500,
    rarity: 'legendary',
  },
  {
    id: 'crossover_purple_viruscode',
    charId: 'purple',
    name: 'Virus-Code',
    origin: 'Synthwave Legend (Retro Digital)',
    event: 'Neon',
    desc: 'Deep violet with neon grid-pattern overlays. Signature attacks create ASCII-character spark effects.',
    colorMap: { primary: '#3A0050', secondary: '#2A0040', attack: '#000000', aura: '#AA00FF' },
    price: 500,
    rarity: 'legendary',
  },
  {
    id: 'crossover_orange_chromesoldier',
    charId: 'orange',
    name: 'Chrome-Soldier',
    origin: 'High-Tech Dystopia (Mechanical Combat)',
    event: 'Neon',
    desc: 'Polished metallic chrome with glowing orange energy joints. Power effects resemble overheating hydraulic vents.',
    colorMap: { primary: '#C0C0C0', secondary: '#888888', attack: '#000000', aura: '#FFAA00' },
    price: 500,
    rarity: 'legendary',
  },
  // ── POWER PEOPLE CROSSOVER EVENT (3 guest characters from "Power People") ──
  {
    id: 'crossover_cable_waterhero',
    charId: 'cable',
    name: 'The Water Hero',
    origin: 'Power People',
    event: 'Power People',
    desc: 'A flowing warrior who commands water. Her power chills foes green; her strikes crash in ocean blue.',
    colorMap: { primary: '#2f8fb8', secondary: '#1f5e7a', attack: '#44cc44', aura: '#3aaacc', sig: '#2f8fb8', heavy: '#44cc44', super: '#2f8fb8', power: '#44cc44' },
    price: 500,
    rarity: 'legendary',
  },
  {
    id: 'crossover_nightmare_soulprotector',
    charId: 'nightmare',
    name: 'The Soul Protector',
    origin: 'Power People',
    event: 'Power People',
    desc: 'A guardian of spirits wrapped in vermillion. Her light-blue signatures shield the fallen.',
    colorMap: { primary: '#E03422', secondary: '#A02414', attack: '#E03422', aura: '#E03422', sig: '#BFEEFF', heavy: '#E03422', super: '#E03422', power: '#E03422' },
    price: 500,
    rarity: 'legendary',
  },
  {
    id: 'crossover_crimson_kingoffire',
    charId: 'crimson',
    name: 'The King of Fire',
    origin: 'Power People',
    event: 'Power People',
    desc: 'A blazing monarch crowned in living flame. Orange signatures, crimson fury — his super burns red and orange.',
    colorMap: { primary: '#DD2233', secondary: '#991122', attack: '#DD2233', aura: '#FF5500', sig: '#FF7722', heavy: '#DD2233', super: '#FF4422', power: '#DD2233' },
    customParts: [{ type: 'flame_crown', color: '#FF6600' }],
    price: 500,
    rarity: 'legendary',
  },
];

// Returns the custom visual parts for a character's equipped crossover (e.g.
// The King of Fire's auto-granted crown of fire), or [] if none.
export function getCrossoverParts(charId, equippedCrossovers = {}) {
  const direct = getCrossover(charId);
  if (direct) return direct.customParts || [];
  const crossoverId = equippedCrossovers[charId];
  if (!crossoverId) return [];
  const cx = getCrossover(crossoverId);
  return (cx && cx.customParts) || [];
}

// Returns a per-move color override (sig/heavy/super/power) for a character's
// equipped crossover, or null. Falls back to the shared 'attack' color.
export function getCrossoverMoveColor(charId, equippedCrossovers = {}, move) {
  const direct = getCrossover(charId);
  if (direct && direct.colorMap) return direct.colorMap[move] || direct.colorMap.attack || null;
  const crossoverId = equippedCrossovers[charId];
  if (!crossoverId) return null;
  const cx = getCrossover(crossoverId);
  if (!cx || !cx.colorMap) return null;
  return cx.colorMap[move] || cx.colorMap.attack || null;
}

export function getCrossover(id) {
  return CROSSOVERS.find(c => c.id === id);
}

export function crossoversForChar(charId) {
  return CROSSOVERS.filter(c => c.charId === charId);
}

// Price bump — all shop crossovers cost 50 more tokens
CROSSOVERS.forEach(c => { if (c.price > 0) c.price += 50; });

// Returns the crossover color override for a character, or null if no crossover equipped
export function getCrossoverColor(charId, equippedCrossovers = {}) {
  // If charId is itself a crossover character, return its colors directly
  const direct = getCrossover(charId);
  if (direct) return direct.colorMap;
  const crossoverId = equippedCrossovers[charId];
  if (!crossoverId) return null;
  const cx = getCrossover(crossoverId);
  return cx ? cx.colorMap : null;
}

// Returns the attack color override for a character's crossover, or null
export function getCrossoverAttackColor(charId, equippedCrossovers = {}) {
  const direct = getCrossover(charId);
  if (direct) return direct.colorMap.attack;
  const crossoverId = equippedCrossovers[charId];
  if (!crossoverId) return null;
  const cx = getCrossover(crossoverId);
  return cx ? cx.colorMap.attack : null;
}

// Returns the aura color override for a character's crossover, or null
export function getCrossoverAuraColor(charId, equippedCrossovers = {}) {
  const direct = getCrossover(charId);
  if (direct) return direct.colorMap.aura;
  const crossoverId = equippedCrossovers[charId];
  if (!crossoverId) return null;
  const cx = getCrossover(crossoverId);
  return cx ? cx.colorMap.aura : null;
}

// Price overhaul — add a zero to every crossover price
CROSSOVERS.forEach(c => { c.price *= _CROSSOVER_PRICE_MULT; });