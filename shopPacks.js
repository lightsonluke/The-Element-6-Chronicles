// PAID TAB ONLY. The rest of the shop remains token-based and unchanged.
// Prices are cents. Payment fulfillment must be performed by your server/webhook.
export const PAID_PACKS = [
  { id:'accessory_random_10', name:'10 RANDOM Accessories', price:499, emoji:'🎲', desc:'10 random accessories.', grants:{ type:'random_accessories', count:10 }, color:'#a86bff' },
  { id:'emote_random_3', name:'3 RANDOM Emotes', price:499, emoji:'🎭', desc:'3 random emotes.', grants:{ type:'random_emotes', count:3 }, color:'#38d6d0' },
  { id:'emote_random_6', name:'6 RANDOM Emotes', price:799, emoji:'🎭', desc:'6 random emotes.', grants:{ type:'random_emotes', count:6 }, color:'#38d6d0' },
  { id:'emote_random_10', name:'10 RANDOM Emotes', price:999, emoji:'🎭', desc:'10 random emotes.', grants:{ type:'random_emotes', count:10 }, color:'#38d6d0' },
  { id:'shikigami_random_5', name:'5 RANDOM Shikigami', price:499, emoji:'✦', desc:'5 random shikigami.', grants:{ type:'random_shikigami', count:5 }, color:'#f08ad9' },
  { id:'profile_random_5', name:'5 RANDOM Profile Items', price:499, emoji:'▣', desc:'5 random titles, icons, or banners.', grants:{ type:'random_profile', count:5 }, color:'#68a8ff' },
  { id:'premium_battle_pass', name:'Premium Battle Pass', price:799, emoji:'★', desc:'Unlock the Premium Battle Pass reward track.', grants:{ type:'battle_pass' }, color:'#ffd34d' },
  { id:'tokens_5000', name:'5,000 Tokens', price:199, emoji:'◆', desc:'5,000 Element 6 Tokens.', grants:{ type:'tokens', amount:5000 }, color:'#f6d449' },
  { id:'tokens_15000', name:'15,000 Tokens', price:499, emoji:'◆', desc:'15,000 Element 6 Tokens.', grants:{ type:'tokens', amount:15000 }, color:'#ffa928' },
  { id:'tokens_50000', name:'50,000 Tokens', price:999, emoji:'◆', desc:'50,000 Element 6 Tokens.', grants:{ type:'tokens', amount:50000 }, color:'#ff7a28' },
  { id:'tokens_100000', name:'100,000 Tokens', price:1999, emoji:'◆', desc:'100,000 Element 6 Tokens.', grants:{ type:'tokens', amount:100000 }, color:'#ff4b54' },
  { id:'supporter_pack', name:'Supporter Pack', price:499, emoji:'💜', desc:'Exclusive title, profile banner, and 5,000 Tokens.', grants:{ type:'supporter', tokens:5000 }, color:'#bf8cff' },
  { id:'founder_pack', name:'Founder Pack', price:999, emoji:'👑', desc:'Exclusive accessory, title, profile icon, and 15,000 Tokens.', grants:{ type:'founder', tokens:15000 }, color:'#ffd34d' },
  { id:'ultimate_supporter_pack', name:'Ultimate Supporter Pack', price:2499, emoji:'✨', desc:'Exclusive cosmetics, 100,000 Tokens, and +10 Custom Character Slots.', grants:{ type:'ultimate_supporter', tokens:100000, customCharSlots:10 }, color:'#ff84cf' },
  { id:'custom_slots_2', name:'+2 Custom Character Slots', price:199, emoji:'✚', desc:'Add 2 Custom Character Slots.', grants:{ type:'custom_char_slots', count:2 }, color:'#63d2ff' },
  { id:'custom_slots_5', name:'+5 Custom Character Slots', price:399, emoji:'✚', desc:'Add 5 Custom Character Slots.', grants:{ type:'custom_char_slots', count:5 }, color:'#63d2ff' },
  { id:'custom_slots_10', name:'+10 Custom Character Slots', price:699, emoji:'✚', desc:'Add 10 Custom Character Slots.', grants:{ type:'custom_char_slots', count:10 }, color:'#63d2ff' },
];

export const SUBSCRIPTIONS = [];
export const getPackById = id => PAID_PACKS.find(pack => pack.id === id);
export function applyPackGrant(progress, packId) {
  const pack = getPackById(packId); if (!pack) return { ...progress };
  const next = { ...progress, ownedPacks:[...new Set([...(progress.ownedPacks || []), packId])] };
  if (pack.grants.type === 'tokens') next.coins = (next.coins || 0) + pack.grants.amount;
  return next;
}
