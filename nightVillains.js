// Nighttime side villains — spawn during night in story mode world
// Each has unique color, power, and drawType for unique rendering

export const NIGHT_VILLAINS = [
  { id: 'shade', name: 'Shade', color: '#1a1a2e', secondaryColor: '#3a3a5e', power: 'Shadow Step', powerDesc: 'Teleports a short distance, leaves a clone', hp: 30, speed: 1.2, dmg: 6, range: 40, cooldown: 180, drawType: 'shadow' },
  { id: 'ember', name: 'Ember', color: '#FF4400', secondaryColor: '#FF8844', power: 'Burning Touch', powerDesc: 'Melee ignites, burn DoT', hp: 35, speed: 1.0, dmg: 5, range: 40, cooldown: 0, drawType: 'flame' },
  { id: 'frostbite', name: 'Frostbite', color: '#88CCFF', secondaryColor: '#AADDFF', power: 'Ice Trail', powerDesc: 'Slippery trail behind him', hp: 30, speed: 0.9, dmg: 4, range: 40, cooldown: 0, drawType: 'ice' },
  { id: 'static', name: 'Static', color: '#FFFF44', secondaryColor: '#FFFFAA', power: 'Static Charge', powerDesc: 'Shocks nearby players', hp: 28, speed: 1.0, dmg: 5, range: 60, cooldown: 120, drawType: 'electric' },
  { id: 'viper', name: 'Viper', color: '#44AA44', secondaryColor: '#66CC66', power: 'Venom', powerDesc: 'Throws poison daggers', hp: 25, speed: 1.1, dmg: 4, range: 120, cooldown: 90, drawType: 'poison', ranged: true },
  { id: 'rift', name: 'Rift', color: '#8844FF', secondaryColor: '#AA66FF', power: 'Mini Portal', powerDesc: 'Shoots from random angles', hp: 32, speed: 0.8, dmg: 6, range: 150, cooldown: 100, drawType: 'portal', ranged: true },
  { id: 'boulder', name: 'Boulder', color: '#886644', secondaryColor: '#AA8855', power: 'Heavy Armor', powerDesc: 'Reduced knockback, very slow', hp: 60, speed: 0.4, dmg: 8, range: 45, cooldown: 0, drawType: 'rock', armor: true },
  { id: 'whisper', name: 'Whisper', color: '#444466', secondaryColor: '#6666AA', power: 'Fear', powerDesc: 'Darkens screen briefly', hp: 28, speed: 1.3, dmg: 4, range: 50, cooldown: 200, drawType: 'ghost' },
  { id: 'thorn', name: 'Thorn', color: '#226622', secondaryColor: '#448844', power: 'Nature Trap', powerDesc: 'Vines briefly root you', hp: 35, speed: 0.7, dmg: 5, range: 80, cooldown: 150, drawType: 'vine' },
  { id: 'echo', name: 'Echo', color: '#CC88FF', secondaryColor: '#DDAaff', power: 'Sound Burst', powerDesc: 'Circular wave pushes you back', hp: 30, speed: 0.9, dmg: 6, range: 70, cooldown: 100, drawType: 'sonic' },
  { id: 'nova', name: 'Nova', color: '#FFFFCC', secondaryColor: '#FFFFFF', power: 'Flash', powerDesc: 'Bright pulse blinds briefly', hp: 25, speed: 1.1, dmg: 5, range: 60, cooldown: 160, drawType: 'light' },
  { id: 'rust', name: 'Rust', color: '#AA5533', secondaryColor: '#CC7744', power: 'Corrosion', powerDesc: 'Weakens your attack', hp: 33, speed: 0.8, dmg: 5, range: 50, cooldown: 180, drawType: 'rust' },
  { id: 'phantom', name: 'Phantom', color: '#332255', secondaryColor: '#554477', power: 'Intangible', powerDesc: 'Untouchable for 1 second', hp: 28, speed: 1.0, dmg: 6, range: 45, cooldown: 140, drawType: 'phantom', intangible: true },
  { id: 'spike', name: 'Spike', color: '#AA88FF', secondaryColor: '#CCAAFF', power: 'Crystal Growth', powerDesc: 'Summons crystal spikes', hp: 35, speed: 0.6, dmg: 7, range: 90, cooldown: 130, drawType: 'crystal' },
  { id: 'pulse', name: 'Pulse', color: '#44FFCC', secondaryColor: '#66FFDD', power: 'Energy Ring', powerDesc: 'Expanding ring pushes away', hp: 30, speed: 0.8, dmg: 6, range: 80, cooldown: 110, drawType: 'pulse' },
  { id: 'mist', name: 'Mist', color: '#AAAAAA', secondaryColor: '#CCCCCC', power: 'Fog Cloud', powerDesc: 'Reduces visibility', hp: 28, speed: 0.7, dmg: 4, range: 60, cooldown: 200, drawType: 'fog' },
  { id: 'magnetar', name: 'Magnetar', color: '#FF6644', secondaryColor: '#FF8866', power: 'Pull', powerDesc: 'Pulls you toward before attacking', hp: 35, speed: 0.7, dmg: 7, range: 100, cooldown: 120, drawType: 'magnet' },
  { id: 'scorch', name: 'Scorch', color: '#FF2200', secondaryColor: '#FF6633', power: 'Lava Splash', powerDesc: 'Blobs of molten rock', hp: 38, speed: 0.6, dmg: 8, range: 110, cooldown: 90, drawType: 'lava', ranged: true },
  { id: 'hollow', name: 'Hollow', color: '#6633AA', secondaryColor: '#8855CC', power: 'Soul Drain', powerDesc: 'Heals on attack', hp: 32, speed: 1.0, dmg: 5, range: 45, cooldown: 0, drawType: 'soul', lifesteal: true },
  { id: 'mimic', name: 'Mimic', color: '#FFAA22', secondaryColor: '#FFCC55', power: 'Copycat', powerDesc: 'Copies a signature attack', hp: 30, speed: 1.0, dmg: 6, range: 50, cooldown: 100, drawType: 'mimic' },
];

export const RARE_NIGHT_VILLAINS = [
  { id: 'eclipse', name: 'Eclipse', color: '#110022', secondaryColor: '#330055', power: 'Moon Curse', powerDesc: 'Darkens screen, slows everyone', hp: 70, speed: 0.6, dmg: 10, range: 80, cooldown: 150, drawType: 'eclipse', isRare: true, dropsRare: true },
  { id: 'revenant', name: 'Revenant', color: '#446644', secondaryColor: '#668866', power: 'Resurrection', powerDesc: 'Comes back once with half HP', hp: 55, speed: 0.8, dmg: 9, range: 50, cooldown: 0, drawType: 'revenant', isRare: true, resurrect: true },
  { id: 'glitch', name: 'Glitch', color: '#00FF00', secondaryColor: '#0088FF', power: 'Corruption', powerDesc: 'Flickers, teleports, double attacks', hp: 45, speed: 1.5, dmg: 8, range: 60, cooldown: 60, drawType: 'glitch', isRare: true, erratic: true },
  { id: 'bloodmoon', name: 'Bloodmoon', color: '#CC0000', secondaryColor: '#FF3300', power: 'Frenzy', powerDesc: 'Gains attack speed on hit', hp: 80, speed: 0.9, dmg: 10, range: 55, cooldown: 50, drawType: 'bloodmoon', isRare: true, frenzy: true },
  { id: 'specter_king', name: 'Specter King', color: '#5500AA', secondaryColor: '#AA00FF', power: 'Haunting Presence', powerDesc: 'Summons Shades, mini-boss', hp: 120, speed: 0.5, dmg: 14, range: 100, cooldown: 200, drawType: 'specter_king', isRare: true, isMiniboss: true, summons: true },
];

export function getNightVillainById(id) {
  return [...NIGHT_VILLAINS, ...RARE_NIGHT_VILLAINS].find(v => v.id === id);
}

// Determine night level: L1 (70%), L2 (29%), Blood Moon (1%)
export function rollNightLevel(rng = Math.random) {
  const r = rng();
  if (r < 0.01) return 3; // Blood Moon
  if (r < 0.30) return 2; // Rare spawns possible
  return 1; // Common only
}