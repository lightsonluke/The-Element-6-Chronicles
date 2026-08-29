// Daily Quests — reset every 24h, track fight-related metrics, reward with chests.
// Chests give coins or random cosmetics/kill FX.

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { ACCESSORIES } from './cosmetics.js';
import { KILL_FX } from './killFX.js';
import { SKINS } from './skins.js';

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Quest pool — each generates a random target + reward
const QUEST_POOL = [
  { id: 'win_fights',   title: 'Win Fights',       desc: 'Win {n} fights in any mode.',          stat: 'wins',    targets: [2, 3, 5] },
  { id: 'land_sigs',    title: 'Signature Moves',  desc: 'Land {n} signature attacks.',         stat: 'sigs',    targets: [10, 15, 20] },
  { id: 'land_heavies', title: 'Heavy Hits',       desc: 'Land {n} heavy attacks.',             stat: 'heavies', targets: [5, 8, 12] },
  { id: 'use_powers',   title: 'Power Up',          desc: 'Activate your power {n} times.',      stat: 'powers',  targets: [3, 5, 8] },
  { id: 'use_supers',   title: 'Super Moves',      desc: 'Use your super move {n} times.',      stat: 'supers',  targets: [1, 2, 3] },
  { id: 'travel',       title: 'Road Warrior',     desc: 'Travel {n} meters in fights.',        stat: 'distance',targets: [200, 400, 600] },
];

export const CHEST_TYPES = [
  { id: 'bronze', name: 'Bronze Quest', color: '#CD7F32', minCoins: 150, maxCoins: 150, cosmeticChance: 0 },
  { id: 'silver', name: 'Silver Quest', color: '#C0C0C0', minCoins: 175, maxCoins: 175, cosmeticChance: 0.22 },
  { id: 'gold', name: 'Gold Quest', color: '#FFD700', minCoins: 200, maxCoins: 200, cosmeticChance: 0.35 },
];

// Generate 3 daily quests based on a seed (date string)
export function generateDailyQuests(seed) {
  const rng = mulberry(hashString(seed));
  const pool = [...QUEST_POOL].sort(() => rng() - 0.5);
  return pool.slice(0, 3).map((q, i) => {
    // Bronze, silver, and gold always step up in difficulty.
    const targetIdx = Math.min(i, q.targets.length - 1);
    const target = q.targets[targetIdx];
    const reward = CHEST_TYPES[Math.min(i, CHEST_TYPES.length - 1)];
    return {
      id: `daily_${q.id}`,
      title: q.title,
      desc: q.desc.replace('{n}', target),
      stat: q.stat,
      target,
      chestReward: reward.id,
    };
  });
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
