// Elements — Brawlhalla-style stat swap stances for a single battle.
// Each element gives +1 to one stat and -1 to another (except Basic which does nothing).
// Elements unlock at specific character levels. Only one element active per battle.
// Stats boosted above their base value glow white in the UI.
//
// Control stat: faster attack recovery + more hitstun applied to enemies
// Utility stat: faster movement, higher jumps, longer mining range

export const ELEMENTS = [
  { id: 'basic', name: 'Basic', unlockLevel: 1, plus: null, minus: null, desc: 'No stat changes — keeps base stats', color: '#AAAAAA' },
  { id: 'speed', name: 'Speed', unlockLevel: 3, plus: 'speed', minus: 'defense', desc: '+1 Speed, -1 Defense', color: '#FFD700' },
  { id: 'power', name: 'Power', unlockLevel: 5, plus: 'power', minus: 'control', desc: '+1 Power, -1 Control', color: '#FF4444' },
  { id: 'defense', name: 'Defense', unlockLevel: 8, plus: 'defense', minus: 'speed', desc: '+1 Defense, -1 Speed', color: '#4488FF' },
  { id: 'control', name: 'Control', unlockLevel: 12, plus: 'control', minus: 'power', desc: '+1 Control, -1 Power', color: '#AA44FF' },
  { id: 'utility', name: 'Utility', unlockLevel: 15, plus: 'utility', minus: 'defense', desc: '+1 Utility, -1 Defense', color: '#00FFAA' },
  { id: 'reversal', name: 'Reversal', unlockLevel: 18, plus: null, minus: null, desc: 'Swap Speed↔Power, Control↔Utility', color: '#FF44FF', custom: 'reversal' },
  { id: 'testing', name: 'Testing', unlockLevel: 20, plus: null, minus: null, desc: '-2 to all stats', color: '#666666', custom: 'testing' },
];

export const MAX_LEVEL = 20;

export function getCharLevelData(progress, charId) {
  return progress?.charLevels?.[charId] || { level: 1, xp: 0 };
}

export function xpForLevel(level) { return 80 + level * 40; }

export function getUnlockedElements(level) {
  return ELEMENTS.filter(e => (level || 1) >= e.unlockLevel);
}

export function isElementUnlocked(level, elementId) {
  const el = ELEMENTS.find(e => e.id === elementId);
  return el ? (level || 1) >= el.unlockLevel : false;
}

// Apply element modifications to base stats for a single battle
export function applyElement(baseStats, elementId) {
  const el = ELEMENTS.find(e => e.id === elementId);
  if (!el) return { ...baseStats };
  const result = { ...baseStats };
  if (el.custom === 'testing') {
    ['power', 'speed', 'defense', 'utility', 'control'].forEach(s => {
      result[s] = Math.max(1, (result[s] || 5) - 2);
    });
    return result;
  }
  if (el.custom === 'reversal') {
    const sp = result.speed, pw = result.power, ct = result.control, ut = result.utility;
    result.speed = pw; result.power = sp;
    result.control = ut; result.utility = ct;
    return result;
  }
  if (!el.plus) return result;
  result[el.plus] = (result[el.plus] || 5) + 1;
  result[el.minus] = Math.max(1, (result[el.minus] || 5) - 1);
  return result;
}

// Check if a stat is boosted above its base value (for white glow)
export function isStatBoosted(baseStats, modifiedStats, statName) {
  return (modifiedStats[statName] || 0) > (baseStats[statName] || 0);
}