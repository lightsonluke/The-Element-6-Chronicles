// ── Relationship system for World Mode ──
// Family, Friends, Romance, Children, Personality traits, ranks, activities, decay.
// Designed as a side system — never forced into the main story.

import { HEROES } from './heroes.js';

// ── Personality traits ──
export const PERSONALITY_TRAITS = {
  friendly: { label: 'Friendly', talkBoost: 2, likes: ['talk', 'help', 'sport'], dislikes: [] },
  shy: { label: 'Shy', talkBoost: 1, likes: ['help', 'gift', 'visit'], dislikes: ['crowd'] },
  funny: { label: 'Funny', talkBoost: 2, likes: ['talk', 'sport'], dislikes: [] },
  serious: { label: 'Serious', talkBoost: 1, likes: ['work', 'train'], dislikes: ['joke'] },
  competitive: { label: 'Competitive', talkBoost: 1, likes: ['sport', 'train'], dislikes: ['lose'] },
  lazy: { label: 'Lazy', talkBoost: 1, likes: ['rest', 'visit'], dislikes: ['train', 'work'] },
  helpful: { label: 'Helpful', talkBoost: 2, likes: ['help', 'quest'], dislikes: [] },
  adventurous: { label: 'Adventurous', talkBoost: 2, likes: ['explore', 'sport'], dislikes: ['rest'] },
  kind: { label: 'Kind', talkBoost: 2, likes: ['help', 'gift'], dislikes: [] },
  stern: { label: 'Stern', talkBoost: 1, likes: ['work'], dislikes: ['joke'] },
};

export function getTraitLabel(t) { return PERSONALITY_TRAITS[t]?.label || t; }

// ── Relationship categories ──
export const REL_CATEGORY = { family: 'family', friend: 'friend', romance: 'romance', child: 'child', hero: 'hero' };

// ── Friendship ranks ──
export const FRIEND_RANKS = [
  { min: 0, key: 'stranger', label: 'Stranger', emoji: '👤' },
  { min: 5, key: 'familiar', label: 'Familiar', emoji: '🤝' },
  { min: 20, key: 'acquaintance', label: 'Acquaintance', emoji: '🙂' },
  { min: 40, key: 'friend', label: 'Friend', emoji: '😊' },
  { min: 60, key: 'close', label: 'Close Friend', emoji: '😄' },
  { min: 80, key: 'best', label: 'Best Friend', emoji: '🤗' },
];

export function getFriendRank(v) {
  let r = FRIEND_RANKS[0];
  for (const f of FRIEND_RANKS) if (v >= f.min) r = f;
  return r;
}

// ── Romance stages ──
export const ROMANCE_STAGES = [
  { key: 'none', label: 'Stranger', min: 0, emoji: '💬' },
  { key: 'interested', label: 'Interested', min: 40, emoji: '❤' },
  { key: 'dating', label: 'Dating', min: 55, emoji: '💕' },
  { key: 'engaged', label: 'Engaged', min: 75, emoji: '💍' },
  { key: 'married', label: 'Married', min: 90, emoji: '👰' },
];

export function getRomanceStage(v) {
  let s = ROMANCE_STAGES[0];
  for (const r of ROMANCE_STAGES) if (v >= r.min) s = r;
  return s;
}

// Backward-compatible label used across the app
export function getRelationshipLabel(v) {
  return getFriendRank(v).label;
}

// ── Family members per hero (where appropriate) ──
const F = (id, name, relation, color, x, z, personality, traits, occupation) =>
  ({ id, name, relation, color, x, z, personality, traits, occupation, category: REL_CATEGORY.family, relationship: 70, quest: false });

export const FAMILY = {
  yellow: [
    F('fam_y_mom', 'Lily (Mom)', 'Mother', '#ffcc88', -38, 14, 'kind', ['kind', 'friendly'], 'Homemaker'),
    F('fam_y_dad', 'Marcus (Dad)', 'Father', '#ddaa66', -44, 12, 'helpful', ['helpful'], 'Engineer'),
    F('fam_y_sis', 'Mia (Sister)', 'Sister', '#ffaadd', -36, 18, 'funny', ['funny'], 'Student'),
  ],
  purple: [
    F('fam_p_mom', 'Viola (Mom)', 'Mother', '#bb88ff', -38, 14, 'kind', ['kind'], 'Musician'),
    F('fam_p_dad', 'Maestro (Dad)', 'Father', '#8855cc', -44, 12, 'serious', ['serious'], 'Composer'),
  ],
  black: [
    F('fam_b_master', 'Thunder Master', 'Guardian', '#334466', 118, -58, 'stern', ['stern', 'helpful'], 'Monk'),
  ],
  silver: [
    F('fam_s_graves', 'Steward Graves', 'Guardian', '#aaaacc', -56, 24, 'serious', ['serious'], 'Butler'),
  ],
  cable: [
    F('fam_c_mom', 'Dana (Mom)', 'Mother', '#77ccdd', -38, 14, 'kind', ['kind'], 'Technician'),
  ],
  pearl: [
    F('fam_p_reef', 'Captain Reef', 'Guardian', '#88ccdd', -100, 22, 'adventurous', ['adventurous'], 'Sailor'),
  ],
  temple: [
    F('fam_t_elder', 'Elder Stone', 'Guardian', '#ccbb99', -112, -32, 'stern', ['stern'], 'Elder'),
  ],
  _default: [
    F('fam_d_mom', 'Mom', 'Mother', '#ffcc88', -38, 14, 'kind', ['kind'], 'Homemaker'),
    F('fam_d_dad', 'Dad', 'Father', '#ddaa66', -44, 12, 'helpful', ['helpful'], 'Worker'),
  ],
};

export function getFamily(charId) { return FAMILY[charId] || FAMILY._default; }

// ── Romance-able NPCs (adults, optional) ──
export const ROMANCE_NPCS = [
  { id: 'rom_aria', name: 'Aria', color: '#ff77aa', x: -30, z: 20, personality: 'friendly', traits: ['friendly', 'kind'], occupation: 'Florist', category: REL_CATEGORY.romance, relationship: 25, quest: true, age: 'adult' },
  { id: 'rom_kai', name: 'Kai', color: '#55ccff', x: 30, z: 20, personality: 'adventurous', traits: ['adventurous'], occupation: 'Lifeguard', category: REL_CATEGORY.romance, relationship: 25, quest: false, age: 'adult' },
  { id: 'rom_nova', name: 'Nova', color: '#aa88ff', x: 24, z: -20, personality: 'shy', traits: ['shy', 'kind'], occupation: 'Artist', category: REL_CATEGORY.romance, relationship: 20, quest: true, age: 'adult' },
];

// ── Hero NPCs: other playable heroes appear in the world when you're not them ──
export const HERO_NPC_DEFS = [
  { heroId: 'yellow', name: 'Yellow', color: '#FFD700', x: 48, z: 64, occupation: 'Speed Hero', personality: 'competitive', traits: ['competitive', 'friendly'], category: REL_CATEGORY.hero, relationship: 40, quest: true },
  { heroId: 'silver', name: 'Silver', color: '#C0C0C0', x: -54, z: 22, occupation: 'Heir', personality: 'serious', traits: ['serious'], category: REL_CATEGORY.hero, relationship: 35, quest: true },
  { heroId: 'pearl', name: 'Pearl', color: '#FFE4E1', x: -100, z: 20, occupation: 'Sailor', personality: 'adventurous', traits: ['adventurous', 'kind'], category: REL_CATEGORY.hero, relationship: 35, quest: true },
  { heroId: 'temple', name: 'Temple', color: '#D2B48C', x: -112, z: -32, occupation: 'Monk', personality: 'serious', traits: ['serious', 'helpful'], category: REL_CATEGORY.hero, relationship: 30, quest: true },
  { heroId: 'black', name: 'Black', color: '#4a4a5a', x: 118, z: -58, occupation: 'Thunder Monk', personality: 'stern', traits: ['stern', 'competitive'], category: REL_CATEGORY.hero, relationship: 30, quest: true },
  { heroId: 'cable', name: 'Cable', color: '#66ccff', x: 40, z: 20, occupation: 'Tinkerer', personality: 'helpful', traits: ['helpful', 'funny'], category: REL_CATEGORY.hero, relationship: 35, quest: true },
  { heroId: 'purple', name: 'Purple', color: '#a066ff', x: -14, z: 30, occupation: 'Musician', personality: 'funny', traits: ['funny', 'kind'], category: REL_CATEGORY.hero, relationship: 35, quest: true },
];

export function getHeroNpcs(playCharId) {
  return HERO_NPC_DEFS.filter(h => h.heroId !== playCharId);
}

// Merge base WORLD_NPCS + family + romance + hero NPCs for a given character
export function buildWorldNpcList(baseNpcs, charId) {
  const fam = getFamily(charId);
  const heroes = getHeroNpcs(charId);
  return [
    ...baseNpcs.map(n => ({ ...n, category: n.category || REL_CATEGORY.friend, traits: n.traits || [n.personality] })),
    ...fam,
    ...ROMANCE_NPCS,
    ...heroes,
  ];
}

// ── Activities that grow relationships ──
export const ACTIVITIES = [
  { id: 'talk', label: 'Talk', gain: 2, tokenCost: 0 },
  { id: 'help', label: 'Help Out', gain: 3, tokenCost: 0 },
  { id: 'sport', label: 'Play Sport', gain: 4, tokenCost: 0 },
  { id: 'gift', label: 'Give Gift', gain: 6, tokenCost: 10 },
  { id: 'visit', label: 'Visit Home', gain: 3, tokenCost: 0 },
  { id: 'quest', label: 'Complete Quest', gain: 8, tokenCost: 0 },
  { id: 'meal', label: 'Share a Meal', gain: 4, tokenCost: 5 },
];

export function activityGain(activityId, traits = []) {
  const act = ACTIVITIES.find(a => a.id === activityId);
  if (!act) return 2;
  let g = act.gain;
  traits.forEach(t => {
    const tr = PERSONALITY_TRAITS[t];
    if (tr && tr.likes.includes(activityId)) g += 1;
    if (tr && tr.dislikes.includes(activityId)) g -= 1;
  });
  return Math.max(1, g);
}

// ── Relationship decay (consequences for neglect) ──
export function decayAmount(lastInteractTs, now = Date.now()) {
  const days = (now - (lastInteractTs || now)) / 86400000;
  if (days < 3) return 0;
  return Math.floor((days - 3) * 1.5);
}

export function applyDecayAll(relationships, lastInteract, now = Date.now()) {
  const out = { ...relationships };
  let changed = false;
  Object.keys(out).forEach(id => {
    const dec = decayAmount(lastInteract?.[id], now);
    if (dec > 0) {
      out[id] = Math.max(0, (out[id] || 0) - dec);
      if (dec > 0) changed = true;
    }
  });
  return { relationships: out, changed };
}

// ── Children ──
export const CHILD_STAGES = ['baby', 'toddler', 'kid', 'teen'];

export function childStageFromAge(ageYears) {
  if (ageYears < 2) return 'baby';
  if (ageYears < 5) return 'toddler';
  if (ageYears < 12) return 'kid';
  return 'teen';
}

export function createChild(parentA, parentB) {
  const a = parentA?.name || 'A';
  const b = parentB?.name || 'B';
  const names = ['Leo', 'Mia', 'Zoe', 'Max', 'Luna', 'Kai', 'Nova', 'Iris'];
  return {
    id: 'child_' + Date.now(),
    name: names[Math.floor(Math.random() * names.length)],
    age: 0,
    bornAt: Date.now(),
    personality: (parentA?.personality) || 'friendly',
    traits: [parentA?.personality || 'friendly', parentB?.personality || 'kind'],
  };
}

// ── Romance gating ──
export function canFlirt(v) { return v >= 30; }
export function canDate(v) { return v >= 55; }
export function canPropose(v) { return v >= 75; }
export function canMarry(v) { return v >= 90; }

// ── Per-NPC relationship record helpers ──
export function makeRelRecord(base = 30) {
  return { value: base, category: REL_CATEGORY.friend, lastInteract: Date.now(), romanceStage: 'none', marriedTo: null };
}