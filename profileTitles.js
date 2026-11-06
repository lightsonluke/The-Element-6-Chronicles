// Profile Titles — cosmetic-only, displayed above the username on the HUD.
// Adding a new title here automatically makes it available. Players who own
// the "All Profile Titles Pack" automatically own every title, including
// future ones added to this list (checked via ownedPacks in progress).

import { BATTLE_PASSES_2027, HOLIDAY_EVENTS_2027 } from './season2027.js';

const ORIGINAL_PROFILE_TITLES = [
  { id: 'founder',  name: 'Founder',  rarity: 'legendary' },
  { id: 'hero',     name: 'Hero',     rarity: 'rare' },
  { id: 'villain',  name: 'Villain',  rarity: 'rare' },
  { id: 'guardian', name: 'Guardian', rarity: 'rare' },
  { id: 'legend',   name: 'Legend',   rarity: 'epic' },
  { id: 'champion', name: 'Champion', rarity: 'epic' },
  { id: 'mvp',      name: 'MVP',      rarity: 'epic' },
  { id: 'veteran',  name: 'Veteran',  rarity: 'rare' },
  { id: 'collector',name: 'Collector',rarity: 'epic' },
];

const EVENT_PROFILE_TITLES = [...BATTLE_PASSES_2027, ...HOLIDAY_EVENTS_2027]
  .flatMap(event => event.rewards
    .filter(reward => reward.type === 'title')
    .map(reward => ({ id: reward.titleId, name: reward.name, rarity: 'legendary', eventId: event.id })));

export const PROFILE_TITLES = [...ORIGINAL_PROFILE_TITLES, ...EVENT_PROFILE_TITLES];

export const getTitleById = (id) => PROFILE_TITLES.find(t => t.id === id);

export const RARITY_COLORS = {
  common: '#aaaaaa',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00',
};

export function getTitleColor(id) {
  const t = getTitleById(id);
  return t ? (RARITY_COLORS[t.rarity] || RARITY_COLORS.common) : RARITY_COLORS.common;
}

// Does the player own this title? Owns-all-pack covers every current + future title.
export function ownsTitle(titleId, progress) {
  if (!titleId) return false;
  const ownedPacks = progress?.ownedPacks || [];
  if (ownedPacks.includes('all_titles')) return true;
  const owned = progress?.ownedTitles || [];
  return owned.includes(titleId);
}

export function getAvailableTitles(progress) {
  return PROFILE_TITLES.filter(t => ownsTitle(t.id, progress));
}
