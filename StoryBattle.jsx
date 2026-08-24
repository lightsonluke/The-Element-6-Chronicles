import db from q{./localBackend};

import React, { useRef, useEffect, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { POWER_EFFECTS } from './powerEffects.js';
import {
  createFighter, updateFighter, checkHit, applyHit, updateAI
} from './fighter.js';
import {
  drawStickman, drawAttackEffect, drawSuperEffect,
  drawHealthBar, drawTimer, drawPlatforms, drawBackground,
  drawHitSparks, drawSuperFlash
} from './renderer.js';
import { getVillainStage, STORY_STAGE_PLATFORMS } from './storyStages.js';
import { music } from './music.js';
import { getAccessory, getEquippedAccessories, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { drawShikigamiFollower } from './shikigami.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { getEmoteForKey } from './emoteSlots.js';
import GameIcon from "./GameIcon.jsx";

const W = 960, H = 560;

export default function StoryBattle({ heroId, villainId, enemyIds, allyIds, stageId, difficulty = 'hard', battleTitle, onEnd, equippedAccessories = {}, equippedSkins = {}, equippedShikigami = {}, settings = {}, equippedEmotes = {} }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const [result, setResult] = useState(null);
  // All non-hero fighters (villains, enemies, allies) are CPU — give them random cosmetics
  const botCharIds = [villainId, ...(enemyIds || []), ...(allyIds || [])].filter(Boolean);
  const { equippedAccessories: mergedAccessories, equippedShikigami: mergedShikigami } = mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIds);
  const botAccessoriesRef = useRef(mergedAccessories);
  botAccessoriesRef.current = mergedAccessories;
  const equippedShikigamiRef = useRef(mergedShikigami);
  equippedShikigamiRef.current = mergedShikigami;

  const isMulti = !!(enemyIds && enemyIds.length > 0);
  const getCharData = (id) => HEROES.find(h => h.id === id) || VILLAINS.find(v => v.id === id) || GUARDIANS.find(g => g.id === id);

  useEffect(() => {
    music.play('fight');
    return () => music.stop();
  }, []);

  useEffect(() => {