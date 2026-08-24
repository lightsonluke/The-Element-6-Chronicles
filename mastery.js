// Hero Mastery System — tracks playtime and match wins per character.
// Ranks are earned by a combined mastery score from playtime + wins.

export const MASTERY_RANKS = [
  { id: 0, name: 'Unranked',  icon: '',     color: '#888888',  minScore: 0    },
  { id: 1, name: 'Bronze',     icon: '🥉',   color: '#CD7F32',  minScore: 50   },
  { id: 2, name: 'Silver',     icon: '🥈',   color: '#C0C0C0',  minScore: 150  },
  { id: 3, name: 'Gold',       icon: '🥇',   color: '#FFD700',  minScore: 350  },
  { id: 4, name: 'Platinum',   icon: '💎',   color: '#E5E4E2',  minScore: 700  },
  { id: 5, name: 'Diamond',    icon: '🔷',   color: '#4FC3F7',  minScore: 1200 },
  { id: 6, name: 'Master',     icon: '👑',   color: '#FF44FF',  minScore: 2000 },
];

// Score = playtimeMinutes * 1 + wins * 10
export function getMasteryScore(entry) {
  if (!entry) return 0;
  const mins = Math.floor((entry.playtime || 0) / 60);
  const wins = entry.wins || 0;
  return mins + wins * 10;
}

export function getMasteryRank(entry) {
  const score = getMasteryScore(entry);
  let rank = MASTERY_RANKS[0];
  for (const r of MASTERY_RANKS) {
    if (score >= r.minScore) rank = r;
  }
  return rank;
}

export function getMasteryForChar(masteryMap, charId) {
  if (!masteryMap || !charId) return null;
  return masteryMap[charId] || null;
}

export function getMasteryRankForChar(masteryMap, charId) {
  return getMasteryRank(getMasteryForChar(masteryMap, charId));
}

// Returns full progress info for a character's mastery: current rank, next rank,
// score, and fractional progress (0-1) toward the next rank.
export function getMasteryProgress(masteryMap, charId) {
  const entry = getMasteryForChar(masteryMap, charId);
  const score = getMasteryScore(entry);
  const rank = getMasteryRank(entry);
  const nextRank = MASTERY_RANKS.find(r => r.minScore > score) || null;
  const prevMin = rank.minScore;
  const nextMin = nextRank ? nextRank.minScore : prevMin;
  const progress = nextRank ? Math.min(1, Math.max(0, (score - prevMin) / (nextMin - prevMin))) : 1;
  return { score, rank, nextRank, progress, playtime: entry?.playtime || 0, wins: entry?.wins || 0 };
}

// Record a win for a character
export function recordMasteryWin(masteryMap, charId) {
  if (!charId) return masteryMap || {};
  const m = { ...(masteryMap || {}) };
  const entry = { ...(m[charId] || { playtime: 0, wins: 0 }) };
  entry.wins = (entry.wins || 0) + 1;
  m[charId] = entry;
  return m;
}

// Record playtime (seconds) for a character
export function recordMasteryPlaytime(masteryMap, charId, seconds) {
  if (!charId || seconds <= 0) return masteryMap || {};
  const m = { ...(masteryMap || {}) };
  const entry = { ...(m[charId] || { playtime: 0, wins: 0 }) };
  entry.playtime = (entry.playtime || 0) + seconds;
  m[charId] = entry;
  return m;
}

// ── Mastery Rewards ──
// Each rank unlocks a unique badge + a skin tint color for that hero.
// The skin tint is equipped as a "skin" (id: mastery_<charId>_<rankId>) and
// recolors the character in-game.
export const MASTERY_REWARDS = [
  { rankId: 1, badgeName: 'Bronze Initiate',   badgeIcon: '🥉', skinTint: '#CD7F32' },
  { rankId: 2, badgeName: 'Silver Adept',      badgeIcon: '🥈', skinTint: '#C0C0C0' },
  { rankId: 3, badgeName: 'Gold Veteran',      badgeIcon: '🥇', skinTint: '#FFD700' },
  { rankId: 4, badgeName: 'Platinum Champion',  badgeIcon: '💎', skinTint: '#A8D8C8' },
  { rankId: 5, badgeName: 'Diamond Legend',    badgeIcon: '🔷', skinTint: '#4FC3F7' },
  { rankId: 6, badgeName: 'Master Paragon',    badgeIcon: '👑', skinTint: '#FF44FF' },
];

// Returns all rewards unlocked for a character based on their current mastery rank
export function getUnlockedMasteryRewards(masteryMap, charId) {
  const rank = getMasteryRankForChar(masteryMap, charId);
  return MASTERY_REWARDS.filter(r => r.rankId <= rank.id);
}

// Returns the mastery skin tint options unlocked for a character
export function getMasterySkinTints(masteryMap, charId) {
  return getUnlockedMasteryRewards(masteryMap, charId).map(r => ({
    id: `mastery_${charId}_${r.rankId}`,
    name: `${r.badgeName} Tint`,
    color: r.skinTint,
    badgeIcon: r.badgeIcon,
    badgeName: r.badgeName,
    rankId: r.rankId,
  }));
}

// Check whether a specific mastery skin tint is unlocked for a character
export function isMasterySkinTintUnlocked(masteryMap, charId, rankId) {
  const rank = getMasteryRankForChar(masteryMap, charId);
  return rank.id >= rankId;
}