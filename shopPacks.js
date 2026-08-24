// Paid shop packs — real-money purchases processed through online checkout.
// Each pack grants cosmetics/characters only (never gameplay advantages).
// Add new packs here; the online checkout backend + shop UI pick them up automatically.

export const PAID_PACKS = [
  {
    id: 'all_characters',
    name: 'All Characters Pack',
    price: 1500, // cents = $15.00
    emoji: '👥',
    desc: 'Unlock every playable character instantly. Does NOT include skins, accessories, kits, or cosmetics.',
    grants: { type: 'characters', all: true },
    color: '#4488ff',
  },
  {
    id: 'all_cosmetics',
    name: 'Cosmetics Pack',
    price: 1000, // $10.00
    emoji: '🎨',
    desc: 'Unlock every cosmetic in the game: all Skins, Accessories, Kits, Sports Jerseys, KO FX, Victory Animations, Profile Banners, and Profile Icons.',
    grants: { type: 'cosmetics', all: true },
    color: '#aa44ff',
  },
  {
    id: 'all_titles',
    name: 'All Profile Titles Pack',
    price: 500, // $5.00
    emoji: '🏷️',
    desc: 'Unlock every Profile Title — including all future titles added later. Display your title above your username in-game.',
    grants: { type: 'titles', all: true },
    color: '#ffaa00',
  },
  {
    id: 'ultimate_pack',
    name: 'Ultimate Pack',
    price: 2500, // $25.00
    emoji: '👑',
    desc: 'Everything in one pack — ALL characters, ALL cosmetics (skins, accessories, kill FX), ALL profile titles, AND 7 extra Custom Character slots (10 total). Best value!',
    grants: { type: 'ultimate', all: true, customCharSlots: 7 },
    color: '#FFD700',
  },
  {
    id: 'custom_char_slots',
    name: 'Custom Character Slots',
    price: 500, // $5.00
    emoji: '🎨',
    desc: 'Unlock 7 additional Custom Character slots (from 3 to 10). Create up to 10 unique fighters!',
    grants: { type: 'custom_char_slots', count: 7 },
    color: '#FF8844',
  },
  // ── Token bundles — in-game currency bought with real money ──
  {
    id: 'tokens_small',
    name: 'Pocket of Tokens',
    price: 200, // $2.00
    emoji: '◆',
    desc: '500 Element 6 Tokens — enough for a few emotes or accessories.',
    grants: { type: 'tokens', amount: 500 },
    color: '#FFD700',
  },
  {
    id: 'tokens_medium',
    name: 'Bag of Tokens',
    price: 500, // $5.00
    emoji: '◆',
    desc: '1,500 Element 6 Tokens — best bang for your buck! Buy characters, skins, and emotes.',
    grants: { type: 'tokens', amount: 1500 },
    color: '#FFAA00',
  },
  {
    id: 'tokens_large',
    name: 'Chest of Tokens',
    price: 1000, // $10.00
    emoji: '◆',
    desc: '3,500 Element 6 Tokens — load up on everything the shop has to offer.',
    grants: { type: 'tokens', amount: 3500 },
    color: '#FF8800',
  },
  {
    id: 'tokens_mega',
    name: 'Vault of Tokens',
    price: 2000, // $20.00
    emoji: '◆',
    desc: '8,000 Element 6 Tokens — the ultimate bundle for collectors. Save 20% vs. small packs!',
    grants: { type: 'tokens', amount: 8000 },
    color: '#FF6600',
  },
];

export const SUBSCRIPTIONS = [
  {
    id: 'battle_pass_plus',
    name: 'Battle Pass+',
    price: 200, // $2.00/month
    emoji: '⭐',
    desc: 'Every Battle Pass is automatically completed and every reward instantly unlocked. You still earn XP normally.',
    color: '#ffdd44',
  },
];

export const getPackById = (id) => PAID_PACKS.find(p => p.id === id);

// Apply a granted pack to the player's progress object.
// Returns a NEW progress object (does not mutate). Caller persists it.
export function applyPackGrant(progress, packId, allCharacters, allCosmetics) {
  const next = { ...progress };
  next.ownedPacks = [...new Set([...(next.ownedPacks || []), packId])];
  const pack = getPackById(packId);
  if (!pack) return next;

  if (pack.grants.type === 'characters' && pack.grants.all) {
    next.unlockedIds = [...new Set([...(next.unlockedIds || []), ...allCharacters.map(c => c.id)])];
  } else if (pack.grants.type === 'cosmetics' && pack.grants.all) {
    // Grant every cosmetic id from the provided catalogs
    allCosmetics.forEach(cat => {
      if (cat.key === 'skins') next.ownedSkins = [...new Set([...(next.ownedSkins || []), ...cat.items.map(i => i.id)])];
      else if (cat.key === 'accessories') next.ownedAccessories = [...new Set([...(next.ownedAccessories || []), ...cat.items.map(i => i.id)])];
      else if (cat.key === 'killfx') next.ownedKillFX = [...new Set([...(next.ownedKillFX || []), ...cat.items.map(i => i.id)])];
      else if (cat.key === 'titles') next.ownedTitles = [...new Set([...(next.ownedTitles || []), ...cat.items.map(i => i.id)])];
    });
  } else if (pack.grants.type === 'titles' && pack.grants.all) {
    // ownedPacks already has 'all_titles' — ownsTitle() checks that.
    // Also explicitly grant current titles for non-pack checks.
    // (Future titles auto-unlock via the pack check.)
  } else if (pack.grants.type === 'tokens') {
    next.coins = (next.coins || 0) + (pack.grants.amount || 0);
  }
  return next;
}