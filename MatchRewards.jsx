import db from q{./localBackend};

import React, { useState, useEffect } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getCharLevelData, xpForLevel, MAX_LEVEL } from './elements.js';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// XP per difficulty — harder bots give more XP, player battles give most
export const DIFFICULTY_XP = {
  newcomer: 10, beginner: 15, easy: 20, amateur: 25, regular: 35,
  pro: 50, hard: 70, insane: 90, honored: 120,
};

export function calculateBattleXP(difficulty, won, isPlayerVsPlayer) {
  let baseXP = DIFFICULTY_XP[difficulty] || 35;
  if (isPlayerVsPlayer) baseXP = 80; // player vs player gives most XP
  if (!won) baseXP = Math.floor(baseXP * 0.3); // loss gives 30%
  return baseXP;
}

export default function MatchRewards({
  charId, p2CharId, result, difficulty, gameMode, isPlayerVsPlayer, currentLevelData, coinsEarned,
  totalXP, matchCount, onContinue, onBack,
}) {
  const [showXP, setShowXP] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showLevel, setShowLevel] = useState(false);

  const char = ALL.find(c => c.id === charId);
  const won = result?.p1Won === true;
  const isDraw = result?.p1Won === null;
  const singleXP = calculateBattleXP(difficulty, won || isDraw, isPlayerVsPlayer);
  const isAccumulated = matchCount && matchCount > 1;
  const xpGained = isAccumulated ? (totalXP || 0) : singleXP;

  const oldLevel = currentLevelData?.level || 1;
  const oldXP = currentLevelData?.xp || 0;
  const xpNeeded = xpForLevel(oldLevel);
  let newXP = oldXP + xpGained;
  let newLevel = oldLevel;
  let leveledUp = false;

  while (newLevel < MAX_LEVEL && newXP >= xpForLevel(newLevel)) {