import { ALL_CHARS, ALL_CHARS_MAP } from './allCharacters.js';

const ELEMENT_RULES = [
  ['time', /time|clock|chrono|temporal/],
  ['space', /portal|space|rift|dimension|teleport/],
  ['lightning', /lightning|thunder|electric|volt|storm/],
  ['fire', /fire|flame|ember|inferno|phoenix|lava/],
  ['frost', /ice|frost|glacier|snow|winter/],
  ['water', /water|tide|ocean|wave|rain|flood/],
  ['plant', /plant|grass|vine|nature|growth|bloom|forest/],
  ['wind', /wind|gale|air|cyclone|gust|speed/],
  ['earth', /earth|stone|rock|sand|mountain|quake|bone/],
  ['metal', /metal|iron|steel|copper|chrome|magnet/],
  ['shadow', /shadow|dark|void|phantom|nightmare|stealth/],
  ['spirit', /spirit|soul|ghost|echo|life|death/],
  ['light', /light|sun|star|holy|healing|mercy/],
  ['mind', /mind|telekin|psychic|puppet|control/],
];

const SIGILS = {
  time: 'dial', space: 'portal', lightning: 'bolt', fire: 'flame', frost: 'flake',
  water: 'wave', plant: 'leaf', wind: 'spiral', earth: 'mountain', metal: 'crest',
  shadow: 'crescent', spirit: 'orb', light: 'star', mind: 'diamond', force: 'ring',
};

function stableHash(value = '') {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function resolveElement(character) {
  const source = [character?.powerTitle, character?.power, character?.powerDescription,
    character?.weapon, character?.title, character?.lore].filter(Boolean).join(' ').toLowerCase();
  return ELEMENT_RULES.find(([, pattern]) => pattern.test(source))?.[0] || 'force';
}

function resolveTemperament(character) {
  const source = [character?.name, character?.title, character?.lore, character?.powerDescription]
    .filter(Boolean).join(' ').toLowerCase();
  if (/calm|precise|patient|measured|reserved|quiet/.test(source)) return 'calm';
  if (/mischiev|trickster|playful|clever|witty/.test(source)) return 'playful';
  if (/aggress|fierce|relentless|ruthless|ferocious|bold/.test(source)) return 'bold';
  if (/guardian|protect|defend|steadfast|shield/.test(source)) return 'steady';
  const speed = Number(character?.stats?.speed) || 0;
  return speed >= 8 ? 'swift' : 'balanced';
}

function buildPresentation(character) {
  const id = String(character?.id || 'unknown');
  const hash = stableHash(id);
  const era = /^g([1-5])_/.exec(id)?.[1] || String(character?.era || 'g5').replace('g', '');
  const element = resolveElement(character);
  const weapon = String(character?.weapon || '');
  const weaponSource = `${weapon} ${character?.powerTitle || ''} ${character?.power || ''}`.toLowerCase();
  const weaponFamily = /bow|rifle|gun|projectile|blaster|shuriken/.test(weaponSource) ? 'ranged' :
    /spear|lance|polearm|staff|whip|chain/.test(weaponSource) ? 'reach' :
    /sword|blade|katana|saber|dagger/.test(weaponSource) ? 'blade' :
    /shield|guard|armor/.test(weaponSource) ? 'guard' :
    /fist|gauntlet|claw|punch/.test(weaponSource) ? 'brawler' : 'flow';
  const generation = Math.max(1, Math.min(5, Number(era) || 5));
  const eraAccents = { 1: '#C6A45A', 2: '#D05249', 3: '#B7A98B', 4: '#76A9DF', 5: '#F1D77A' };
  return Object.freeze({
    id,
    generation,
    element,
    temperament: resolveTemperament(character),
    sigil: SIGILS[element] || SIGILS.force,
    primary: character?.color || '#B9C7D8',
    secondary: character?.secondaryColor || character?.color || '#FFFFFF',
    eraAccent: eraAccents[generation],
    phase: (hash % 997) / 997,
    flourish: 0.78 + ((hash >>> 8) % 45) / 100,
    speed: Math.max(0.82, Math.min(1.22, (Number(character?.stats?.speed) || 6) / 7)),
    weapon,
    weaponFamily,
  });
}

const PRESENTATIONS = Object.fromEntries(ALL_CHARS.map(character => [character.id, buildPresentation(character)]));

/** Derive a stable cosmetic identity from each roster character's canon data. */
export function getCharacterPresentation(characterOrId) {
  if (!characterOrId) return buildPresentation({ id: 'unknown' });
  if (typeof characterOrId === 'string') {
    return PRESENTATIONS[characterOrId] || buildPresentation(ALL_CHARS_MAP[characterOrId] || { id: characterOrId });
  }
  const known = PRESENTATIONS[characterOrId.id];
  if (known && characterOrId.power === ALL_CHARS_MAP[characterOrId.id]?.power &&
      characterOrId.color === ALL_CHARS_MAP[characterOrId.id]?.color) return known;
  return buildPresentation({ ...ALL_CHARS_MAP[characterOrId.id], ...characterOrId });
}
