// Daily Quests — reset every 24h, track fight-related metrics, reward with chests.
// Chests give coins or random cosmetics/kill FX.

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { ACCESSORIES } from './cosmetics.js';
import { KILL_FX } from './killFX.js';
import { SKINS } from './skins.js';

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Daily quest pool.
// The rotation intentionally mixes hard, medium, and occasional easier objectives.
// Progress is recorded from authoritative match results so the same match cannot
// be counted differently by the quest UI.
const QUEST_POOL = [
  // HARD
  { id: 'signature_kos', category: 'hard', title: 'Signature Finishers', desc: 'Score {n} KOs with signature attacks.', stat: 'signatureKOs', targets: [5] },
  { id: 'ground_pound_kos', category: 'hard', title: 'Grounded No More', desc: 'Score {n} KOs with Ground Pound attacks.', stat: 'groundPoundKOs', targets: [5] },
  { id: 'emote_then_move', category: 'hard', title: 'Style Then Strike', desc: 'Emote before moving {n} times in matches.', stat: 'emoteBeforeMove', targets: [5] },

  // MEDIUM
  { id: 'win_fights', category: 'medium', title: 'Take the Win', desc: 'Win {n} matches.', stat: 'wins', targets: [3] },
  { id: 'land_heavies', category: 'medium', title: 'Heavy Hitter', desc: 'Land {n} heavy attacks.', stat: 'heavies', targets: [8] },
  { id: 'use_powers', category: 'medium', title: 'Power Up', desc: 'Activate your power {n} times.', stat: 'powers', targets: [6] },
  { id: 'use_supers', category: 'medium', title: 'Unleash', desc: 'Use your super move {n} times.', stat: 'supers', targets: [2] },
  { id: 'travel', category: 'medium', title: 'Road Warrior', desc: 'Travel {n} meters in matches.', stat: 'distance', targets: [350] },

  // OCCASIONAL EASIER OBJECTIVES
  { id: 'land_signatures', category: 'easy', title: 'Signature Practice', desc: 'Land {n} signature attacks.', stat: 'sigs', targets: [5] },
  { id: 'play_matches', category: 'easy', title: 'Step Into Battle', desc: 'Complete {n} match.', stat: 'matches', targets: [1] },
  { id: 'use_power', category: 'easy', title: 'Spark Up', desc: 'Activate your power {n} time.', stat: 'powers', targets: [2] },
];

export const CHEST_TYPES = [
  { id: 'bronze', name: 'Bronze Quest', color: '#CD7F32', minCoins: 150, maxCoins: 150, cosmeticChance: 0 },
  { id: 'silver', name: 'Silver Quest', color: '#C0C0C0', minCoins: 175, maxCoins: 175, cosmeticChance: 0.22 },
  { id: 'gold', name: 'Gold Quest', color: '#FFD700', minCoins: 200, maxCoins: 200, cosmeticChance: 0.35 },
];

// Deterministic daily rotation: one hard, one medium, and one flexible slot.
// This keeps the pool varied while still guaranteeing a challenging objective.
export function generateDailyQuests(seed) {
  const rng = mulberry(hashString(seed));
  const byCategory = category => QUEST_POOL.filter(q => q.category === category);

  const pick = (pool, used) => {
    const available = pool.filter(q => !used.has(q.id));
    if (!available.length) return null;
    return available[Math.floor(rng() * available.length)];
  };

  const used = new Set();
  const picks = [];

  const hard = pick(byCategory('hard'), used);
  if (hard) { used.add(hard.id); picks.push(hard); }

  const medium = pick(byCategory('medium'), used);
  if (medium) { used.add(medium.id); picks.push(medium); }

  // 70% medium, 30% easy for the third slot. A second hard is never forced.
  const flexPool = rng() < 0.3 ? byCategory('easy') : byCategory('medium');
  const flex = pick(flexPool, used) || pick(byCategory('easy'), used) || pick(byCategory('medium'), used);
  if (flex) { used.add(flex.id); picks.push(flex); }

  return picks.map((q, i) => ({
    id: `daily_${q.id}`,
    title: q.title,
    desc: q.desc.replace('{n}', q.targets[0]),
    stat: q.stat,
    target: q.targets[0],
    chestReward: CHEST_TYPES[Math.min(i, CHEST_TYPES.length - 1)].id,
    category: q.category,
  }));
}

// Open a chest — returns the reward
export function openChest(chestId, ownedItems = []) {
  const chest = CHEST_TYPES.find(c => c.id === chestId) || CHEST_TYPES[0];
  const rng = Math.random();
  const coins = Math.floor(rng * (chest.maxCoins - chest.minCoins + 1)) + chest.minCoins;

  // Silver/gold bonus: the game picks the reward itself.  The player never
  // chooses a cosmetic from the browser/client request.
  if (Math.random() < chest.cosmeticChance) {
    // Pick from accessories or kill FX not already owned. Skins are excluded.
    const availableAccs = ACCESSORIES.filter(a => !a.id.startsWith('jersey_') && !ownedItems.includes(a.id));
    const availableKillFX = KILL_FX.filter(k => k.price > 0 && !ownedItems.includes(k.id));

    const allAvail = [
      ...availableAccs.map(a => ({ type: 'accessory', id: a.id, name: a.name })),
      ...availableKillFX.map(k => ({ type: 'killfx', id: k.id, name: k.name })),
    ];

    if (allAvail.length > 0) {
      const pick = allAvail[Math.floor(Math.random() * allAvail.length)];
      return { coins, cosmetic: pick, chest };
    }
  }

  return { coins, cosmetic: null, chest };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Get today's date key (resets daily)
export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Check if daily quests need reset
export function needsDailyReset(lastDateKey) {
  return lastDateKey !== getTodayKey();
}
