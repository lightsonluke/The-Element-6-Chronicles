// World Systems — simulation data & logic for World Mode only.
// Completely separate from all other game modes. No ending states here.

export const SHOP_OPEN_HOUR = 6;     // 6 AM
export const SHOP_CLOSE_HOUR = 22;   // 10 PM

export function isShopOpen(date = new Date()) {
  const t = date.getHours() + date.getMinutes() / 60;
  return t >= SHOP_OPEN_HOUR && t < SHOP_CLOSE_HOUR;
}

// ── Seasons (based on real Northern-Hemisphere months) ──
export const SEASONS = [
  { id: 'winter', name: 'Winter', months: [12, 1, 2], grass: 0xbfd8c8, sky: 0x9fb8d6 },
  { id: 'spring', name: 'Spring', months: [3, 4, 5], grass: 0x7ad65a, sky: 0x9fd6ff },
  { id: 'summer', name: 'Summer', months: [6, 7, 8], grass: 0x52c23a, sky: 0x6fb0ff },
  { id: 'fall', name: 'Fall', months: [9, 10, 11], grass: 0xd49a3a, sky: 0xc9a06a },
];

export function getSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  return SEASONS.find(s => s.months.includes(m)) || SEASONS[2];
}

// ── Holiday / seasonal decorations (active across a range, not one day) ──
export function getActiveDecorations(date = new Date()) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const deco = [];
  if (m === 12) deco.push('christmas', 'menorah');
  if (m === 10) deco.push('pumpkins');
  if (m === 11) deco.push('thanksgiving');
  if (m === 2) deco.push('hearts');
  if (m === 3) deco.push('clovers');
  if (m === 7) deco.push('fireworks');
  if (m === 1 && d <= 4) deco.push('newyear');
  return deco;
}

export function getActiveHoliday(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 12 && d === 25) return 'Christmas';
  if (m === 1 && d === 1) return "New Year's Day";
  if (m === 10 && d === 31) return 'Halloween';
  if (m === 2 && d === 14) return "Valentine's Day";
  if (m === 7 && d === 4) return 'Independence Day';
  if (m === 11 && d >= 22 && d <= 28) return 'Thanksgiving';
  return null;
}

// ── Weather ──
export const WEATHER_TYPES = ['clear', 'cloudy', 'rain', 'snow', 'fog'];

export function rollWeather(seasonId, rng = Math.random) {
  const r = rng();
  if (seasonId === 'winter') return r < 0.4 ? 'snow' : r < 0.6 ? 'cloudy' : 'clear';
  if (seasonId === 'spring') return r < 0.35 ? 'rain' : r < 0.55 ? 'cloudy' : 'clear';
  if (seasonId === 'summer') return r < 0.12 ? 'rain' : r < 0.28 ? 'cloudy' : 'clear';
  if (seasonId === 'fall') return r < 0.28 ? 'rain' : r < 0.5 ? 'fog' : 'clear';
  return 'clear';
}

// ── NPC day/night schedule ──
export function isNight(date = new Date()) {
  const h = date.getHours();
  return h < 7 || h >= 21;
}
export function isDay(date = new Date()) { return !isNight(date); }

// ── Jobs + interviews ──
export const JOBS = [
  { id: 'police', name: 'Police Officer', pay: 20, stat: 'defense' },
  { id: 'chef', name: 'Chef', pay: 15, stat: 'utility' },
  { id: 'athlete', name: 'Athlete', pay: 18, stat: 'speed' },
  { id: 'medic', name: 'Medic', pay: 17, stat: 'hp' },
  { id: 'builder', name: 'Builder', pay: 16, stat: 'power' },
  { id: 'teacher', name: 'Teacher', pay: 14, stat: 'control' },
];
export function interviewOutcome(rng = Math.random) { return rng() > 0.4; } // ~60% pass

// ── Pets ──
export const PETS = [
  { id: 'dog', name: 'Dog', price: 120, color: '#c98a4a' },
  { id: 'cat', name: 'Cat', price: 100, color: '#888888' },
  { id: 'bird', name: 'Bird', price: 80, color: '#44ccff' },
  { id: 'rabbit', name: 'Rabbit', price: 90, color: '#f0e0d0' },
];

// ── Hidden collectibles (Element Shards) ──
export const COLLECTIBLES = [
  { id: 'shard_red', name: 'Red Element Shard', color: '#ff4444', value: 5 },
  { id: 'shard_blue', name: 'Blue Element Shard', color: '#4488ff', value: 5 },
  { id: 'shard_green', name: 'Green Element Shard', color: '#44dd44', value: 5 },
  { id: 'shard_gold', name: 'Gold Element Shard', color: '#ffd700', value: 15 },
];

// ── Clothing ──
export const CLOTHING = [
  { id: 'cap', name: 'Cap', price: 25, color: '#ff5555' },
  { id: 'jacket', name: 'Jacket', price: 45, color: '#4477cc' },
  { id: 'mask', name: 'Face Mask', price: 15, color: '#cccccc' },
];

// ── Default world-systems save slice (merged into a world save) ──
export function createWorldSystemsSave() {
  return {
    job: null,
    interviewed: false,
    pets: [],
    activePet: null,
    clothing: [],
    equippedClothing: null,
    sick: false,
    hideSickPlayers: false,
    collectedShards: [],
    openedChests: [],
    ownedHouses: [],
    homeId: null,
    weather: 'clear',
    lastWeatherRoll: 0,
  };
}