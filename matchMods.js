// Shared match-modifier defaults used by Sandbox and Creator Mode.
// These describe in-sandbox / campaign overrides that the fight engine reads
// to alter gameplay instantly without restarting.

export const DEFAULT_MODS = {
  stocks: 3,
  timeLimit: 240,
  cpuCount: 1,
  cpuDifficulty: 'regular',
  cpuBehavior: 'balanced', // balanced | aggressive | defensive | stationary
  damageMultiplier: 1,
  gravity: 1,
  jumpHeight: 1,
  movementSpeed: 1,
  superChargeRate: 1,
  powerCooldownRate: 1,
  infiniteJumps: false,
  infiniteStocks: false,
  infiniteHP: false,
  infiniteSuper: false,
  infinitePower: false,
  respawnTime: 1,
  stageHazards: false,
  brHazards: false,
  brItems: false,
  friendlyFire: false,
  items: false,
  showHitboxes: false,
  showHurtboxes: false,
  showFrameData: false,
  comboCounter: true,
  damageCounter: true,
  slowMotion: 1, // 1 = normal, <1 slower, >1 faster
  upsideDown: false, // Sandbox: flips the stage (floor becomes ceiling)
  freezeAI: false,
  weather: 'clear', // clear | rain | snow | fog | storm
  music: 'menu',
};

export const CPU_COUNT_MAX = 8;

export const CPU_BEHAVIORS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'defensive', label: 'Defensive' },
  { id: 'stationary', label: 'Stationary' },
];

export const CPU_DIFFICULTIES = [
  { id: 'newcomer', label: 'Newcomer' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'easy', label: 'Easy' },
  { id: 'amateur', label: 'Amateur' },
  { id: 'regular', label: 'Regular' },
  { id: 'pro', label: 'Pro' },
  { id: 'hard', label: 'Hard' },
  { id: 'insane', label: 'Insane' },
  { id: 'honored', label: 'Honored' },
];

export const WEATHER_OPTIONS = [
  { id: 'clear', label: 'Clear' },
  { id: 'rain', label: 'Rain' },
  { id: 'snow', label: 'Snow' },
  { id: 'fog', label: 'Fog' },
  { id: 'storm', label: 'Storm' },
];

// Win-condition presets used by Creator Mode campaigns.
export const WIN_CONDITIONS = [
  { id: 'ko', label: 'KO the opponent (default)', desc: 'Win by depleting opponent stocks.' },
  { id: 'survive', label: 'Survive for a set time', desc: 'Stay alive until the timer runs out.' },
  { id: 'defeat_many', label: 'Defeat multiple enemies', desc: 'KO a wave of enemies in sequence.' },
  { id: 'no_stock_lost', label: 'Win without losing a stock', desc: 'Perfect the battle.' },
  { id: 'reach_score', label: 'Reach a KO score', desc: 'First to the target KOs wins.' },
];

export function defaultMods() {
  return JSON.parse(JSON.stringify(DEFAULT_MODS));
}

// Light merge so partial overrides fill in defaults
export function withMods(mods) {
  return { ...DEFAULT_MODS, ...(mods || {}) };
}