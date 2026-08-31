import { getCharacterNametag, drawOnlineNameTag, drawOfflineNameTag } from './inGameNametags.js';
import React, { useRef, useEffect, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { ALL_CHARS_MAP } from './allCharacters.js';
import { POWER_EFFECTS, getPowerEffect } from './powerEffects.js';
import { createFighter, updateFighter, checkHit, applyHit, updateAI, CPU_DIFFICULTY, updateProjectiles, drawProjectiles, loseStock } from './fighter.js';
import {
  drawStickman, drawAttackEffect, drawSuperEffect,
  drawHealthBar, drawTimer, drawPlatforms, drawBackground,
  drawHitSparks, drawDoubleJumpParticles, drawSuperFlash,
  STAGE_MAPS,
} from './renderer.js';
import PauseMenu from './PauseMenu';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { getKeybinds, readPlayerInput, readSinglePlayerInput, getSchemeKeybinds, getSoloKeybinds } from './keybinds.js';
import { useClipRecorder } from './useClipRecorder.js';
import { drawMaterialOverlay } from './materials.js';
import { getAccessory, drawAccessory, isBehindAccessory, resolveAccColor, getEquippedAccessories } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getCrossoverColor, getCrossoverAttackColor, getCrossover, getCrossoverParts } from './crossovers.js';
import { drawKillFX } from './killFX.js';
import { drawShikigamiFollower } from './shikigami.js';
import { applyElement } from './elements.js';
import { EMOTES, getEmoteById, getEmoteProgress, drawEmote } from './emotes.js';
import { getEmoteForKey } from './emoteSlots.js';
import { getActiveEvent } from './events.js';
import { applyStageMaterials } from './stageMaterials.js';
import { applyMovingPlatforms } from './movingPlatforms.js';
import { buildSandboxHazards, updateSandboxHazards, buildSandboxObjects, updateSandboxObjects, processSandboxObjectHits, drawHazards as drawSBHazards, drawObjects as drawSBObjects } from './sandboxHazards.js';
import { buildHazardsFromStage, buildObjectsFromStage } from './stageHazards.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { readGamepadInput } from './controllerProfiles.js';
import GameIcon from "./GameIcon.jsx";

// Bigger stages — 1280x720 internal resolution (canvas scales to fill the screen via CSS)
const W = 1280;
const H = 720;

const MAP_PLATFORMS = {
  splitcity: [
    { x: 40,   y: 620, w: 1200, h: 48 },
    { x: 120,  y: 440, w: 360,  h: 20 },
    { x: 800,  y: 440, w: 360,  h: 20 },
    { x: 460,  y: 270, w: 360,  h: 20 },
  ],
  // Basic — Split City backdrop with a single flat normal-material platform
  basic: [
    { x: 40, y: 620, w: 1200, h: 48 },
  ],
  silvermansion: [
    { x: 40,   y: 620, w: 1200, h: 48 },
    { x: 100, y: 440, w: 300,  h: 20 },
    { x: 880, y: 440, w: 300,  h: 20 },
    { x: 480, y: 260, w: 320,  h: 20 },
    { x: 570, y: 440, w: 140,  h: 20 },
  ],
  controllerforest: [
    { x: 40,   y: 620, w: 1200, h: 48 },
    { x: 120, y: 480, w: 300,  h: 20 },
    { x: 860, y: 480, w: 300,  h: 20 },
    { x: 500, y: 320, w: 280,  h: 20 },
    { x: 340, y: 420, w: 200,  h: 20 },
    { x: 740, y: 420, w: 200,  h: 20 },
  ],
  traininggrounds: [
    { x: 40,   y: 620, w: 1200, h: 48 },
    { x: 140, y: 460, w: 360,  h: 20 },
    { x: 780, y: 460, w: 360,  h: 20 },
    { x: 460, y: 280, w: 360,  h: 20 },
  ],
  voidplane: [
    { x: 40,   y: 620, w: 1200, h: 48 },
    { x: 80,  y: 420, w: 280,  h: 20 },
    { x: 920, y: 420, w: 280,  h: 20 },
    { x: 480, y: 260, w: 320,  h: 20 },
    { x: 400, y: 480, w: 480,  h: 20 },
  ],
  // ── 30 NEW STAGE LAYOUTS ──
  neonspire: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 460, w: 280, h: 18 },
    { x: 900, y: 460, w: 280, h: 18 },
    { x: 500, y: 300, w: 280, h: 18 },
    { x: 300, y: 400, w: 160, h: 18 },
    { x: 820, y: 400, w: 160, h: 18 },
  ],
  sunsetridge: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 480, w: 200, h: 20 },
    { x: 880, y: 480, w: 200, h: 20 },
    { x: 540, y: 350, w: 200, h: 20 },
    { x: 100, y: 320, w: 160, h: 18 },
    { x: 1020, y: 320, w: 160, h: 18 },
  ],
  frozenlake: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 440, w: 320, h: 18 },
    { x: 810, y: 440, w: 320, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
  ],
  lavafalls: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 200, h: 18 },
    { x: 980, y: 500, w: 200, h: 18 },
    { x: 400, y: 400, w: 200, h: 18 },
    { x: 680, y: 400, w: 200, h: 18 },
    { x: 540, y: 260, w: 200, h: 18 },
  ],
  crystalcavern: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 80, y: 460, w: 240, h: 18 },
    { x: 960, y: 460, w: 240, h: 18 },
    { x: 420, y: 380, w: 200, h: 18 },
    { x: 660, y: 380, w: 200, h: 18 },
    { x: 520, y: 240, w: 240, h: 18 },
  ],
  skysanctuary: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 460, w: 360, h: 18 },
    { x: 720, y: 460, w: 360, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
  ],
  underworld: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 500, w: 240, h: 18 },
    { x: 920, y: 500, w: 240, h: 18 },
    { x: 400, y: 400, w: 160, h: 18 },
    { x: 720, y: 400, w: 160, h: 18 },
    { x: 520, y: 280, w: 240, h: 18 },
  ],
  auroraborealis: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 440, w: 300, h: 18 },
    { x: 800, y: 440, w: 300, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 200, w: 200, h: 14 },
    { x: 780, y: 200, w: 200, h: 14 },
  ],
  goldentemple: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 480, w: 280, h: 20 },
    { x: 900, y: 480, w: 280, h: 20 },
    { x: 440, y: 360, w: 400, h: 20 },
    { x: 540, y: 220, w: 200, h: 18 },
  ],
  stormpeak: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 500, w: 200, h: 18 },
    { x: 880, y: 500, w: 200, h: 18 },
    { x: 420, y: 400, w: 200, h: 18 },
    { x: 660, y: 400, w: 200, h: 18 },
    { x: 540, y: 260, w: 200, h: 18 },
  ],
  toxicmarsh: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 480, w: 320, h: 18 },
    { x: 810, y: 480, w: 320, h: 18 },
    { x: 480, y: 340, w: 320, h: 18 },
  ],
  cosmicvoid: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 200, h: 18 },
    { x: 980, y: 500, w: 200, h: 18 },
    { x: 380, y: 420, w: 200, h: 18 },
    { x: 700, y: 420, w: 200, h: 18 },
    { x: 520, y: 280, w: 240, h: 18 },
  ],
  emberforge: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 460, w: 280, h: 18 },
    { x: 820, y: 460, w: 280, h: 18 },
    { x: 480, y: 320, w: 320, h: 18 },
  ],
  tidalreef: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 440, w: 300, h: 18 },
    { x: 860, y: 440, w: 300, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
    { x: 300, y: 360, w: 160, h: 14 },
    { x: 820, y: 360, w: 160, h: 14 },
  ],
  shadowrealm: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 80, y: 500, w: 240, h: 18 },
    { x: 960, y: 500, w: 240, h: 18 },
    { x: 400, y: 380, w: 200, h: 18 },
    { x: 680, y: 380, w: 200, h: 18 },
    { x: 540, y: 240, w: 200, h: 18 },
  ],
  dawnbreak: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 480, w: 360, h: 18 },
    { x: 720, y: 480, w: 360, h: 18 },
    { x: 480, y: 320, w: 320, h: 18 },
  ],
  midnighttower: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 520, w: 200, h: 18 },
    { x: 980, y: 520, w: 200, h: 18 },
    { x: 350, y: 420, w: 200, h: 18 },
    { x: 730, y: 420, w: 200, h: 18 },
    { x: 500, y: 300, w: 280, h: 18 },
    { x: 540, y: 180, w: 200, h: 14 },
  ],
  junglecanopy: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 460, w: 280, h: 18 },
    { x: 880, y: 460, w: 280, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 200, w: 200, h: 14 },
    { x: 780, y: 200, w: 200, h: 14 },
  ],
  desertoasis: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 460, w: 320, h: 18 },
    { x: 780, y: 460, w: 320, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
  ],
  icepalace: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 480, w: 260, h: 18 },
    { x: 920, y: 480, w: 260, h: 18 },
    { x: 420, y: 360, w: 200, h: 18 },
    { x: 660, y: 360, w: 200, h: 18 },
    { x: 540, y: 220, w: 200, h: 18 },
  ],
  volcanocrater: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 500, w: 200, h: 18 },
    { x: 880, y: 500, w: 200, h: 18 },
    { x: 440, y: 380, w: 400, h: 18 },
    { x: 540, y: 240, w: 200, h: 18 },
  ],
  starlightmeadow: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 440, w: 300, h: 18 },
    { x: 810, y: 440, w: 300, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
    { x: 300, y: 340, w: 160, h: 14 },
    { x: 820, y: 340, w: 160, h: 14 },
  ],
  thunderdome: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 220, h: 18 },
    { x: 960, y: 500, w: 220, h: 18 },
    { x: 380, y: 400, w: 200, h: 18 },
    { x: 700, y: 400, w: 200, h: 18 },
    { x: 520, y: 260, w: 240, h: 18 },
  ],
  rainbowbridge: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 480, w: 320, h: 18 },
    { x: 760, y: 480, w: 320, h: 18 },
    { x: 480, y: 320, w: 320, h: 18 },
    { x: 300, y: 200, w: 200, h: 14 },
    { x: 780, y: 200, w: 200, h: 14 },
  ],
  coralreef: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 460, w: 280, h: 18 },
    { x: 880, y: 460, w: 280, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
  ],
  obsidianfield: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 80, y: 480, w: 240, h: 18 },
    { x: 960, y: 480, w: 240, h: 18 },
    { x: 400, y: 380, w: 200, h: 18 },
    { x: 680, y: 380, w: 200, h: 18 },
    { x: 540, y: 240, w: 200, h: 18 },
  ],
  solflare: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 460, w: 300, h: 18 },
    { x: 800, y: 460, w: 300, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
  ],
  mintgardens: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 460, w: 320, h: 18 },
    { x: 810, y: 460, w: 320, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 380, w: 160, h: 14 },
    { x: 820, y: 380, w: 160, h: 14 },
  ],
  cobaltmines: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 240, h: 18 },
    { x: 940, y: 500, w: 240, h: 18 },
    { x: 380, y: 400, w: 200, h: 18 },
    { x: 700, y: 400, w: 200, h: 18 },
    { x: 540, y: 260, w: 200, h: 18 },
  ],
  crimsonarena: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 460, w: 360, h: 18 },
    { x: 720, y: 460, w: 360, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
  ],
  phoenixroost: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 480, w: 280, h: 18 },
    { x: 880, y: 480, w: 280, h: 18 },
    { x: 440, y: 360, w: 400, h: 18 },
    { x: 540, y: 220, w: 200, h: 18 },
  ],
  nebulareach: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 440, w: 300, h: 18 },
    { x: 800, y: 440, w: 300, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
    { x: 300, y: 360, w: 160, h: 14 },
    { x: 820, y: 360, w: 160, h: 14 },
  ],
  emeraldcove: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 460, w: 300, h: 18 },
    { x: 810, y: 460, w: 300, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
  ],
  // ── 4 LARGE MAPS (wider platforms, built for 4+ players) ──
  grandarena: [
    { x: -50, y: 620, w: 1380, h: 48 },
    { x: 50, y: 440, w: 380, h: 22 },
    { x: 850, y: 440, w: 380, h: 22 },
    { x: 430, y: 280, w: 420, h: 22 },
    { x: -50, y: 440, w: 200, h: 18 },
    { x: 1130, y: 440, w: 200, h: 18 },
  ],
  skycitadel: [
    { x: -50, y: 620, w: 1380, h: 48 },
    { x: 100, y: 480, w: 300, h: 20 },
    { x: 500, y: 480, w: 280, h: 20 },
    { x: 880, y: 480, w: 300, h: 20 },
    { x: 250, y: 340, w: 280, h: 20 },
    { x: 750, y: 340, w: 280, h: 20 },
    { x: 490, y: 200, w: 300, h: 20 },
  ],
  colossalcoliseum: [
    { x: -100, y: 620, w: 1480, h: 48 },
    { x: 80, y: 460, w: 240, h: 20 },
    { x: 400, y: 400, w: 200, h: 20 },
    { x: 680, y: 400, w: 200, h: 20 },
    { x: 960, y: 460, w: 240, h: 20 },
    { x: 220, y: 280, w: 200, h: 18 },
    { x: 860, y: 280, w: 200, h: 18 },
    { x: 520, y: 220, w: 240, h: 18 },
  ],
  infiniteexpanse: [
    { x: -100, y: 620, w: 1480, h: 48 },
    { x: 50, y: 500, w: 200, h: 18 },
    { x: 350, y: 420, w: 200, h: 18 },
    { x: 700, y: 420, w: 200, h: 18 },
    { x: 1030, y: 500, w: 200, h: 18 },
    { x: 200, y: 300, w: 180, h: 16 },
    { x: 550, y: 280, w: 180, h: 16 },
    { x: 900, y: 300, w: 180, h: 16 },
    { x: 380, y: 180, w: 200, h: 14 },
    { x: 700, y: 180, w: 200, h: 14 },
  ],
  // ── Opal Cave (Power People crossover stage) ──
  // A wide box of normal material with a smaller diamond box sitting exactly on
  // top of it (touching), plus one floating metal platform that slowly rises and
  // falls. Cave-style crystal backdrop.
  opalcave: [
    { x: 120, y: 520, w: 1040, h: 100 },                                       // normal box (wide main floor)
    { x: 400, y: 440, w: 480, h: 80 },                                         // diamond box, smaller, touching normal box on top
    { x: 540, y: 280, w: 200, h: 18, move: { type: 'vertical', distance: 160, speed: 0.25 } }, // floating metal platform — slow up/down
  ],
  // ── 20 NEW STAGES: Gen 1 heroes, Gen 5 heroes, lore locations ──
  g1_thunder_peak: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 460, w: 280, h: 18 },
    { x: 850, y: 460, w: 280, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 380, w: 160, h: 14 },
    { x: 820, y: 380, w: 160, h: 14 },
  ],
  g1_inferno_realm: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 220, h: 18 },
    { x: 960, y: 500, w: 220, h: 18 },
    { x: 400, y: 400, w: 200, h: 18 },
    { x: 680, y: 400, w: 200, h: 18 },
    { x: 520, y: 260, w: 240, h: 18 },
  ],
  g1_ocean_depth: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 440, w: 320, h: 18 },
    { x: 780, y: 440, w: 320, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
    { x: 300, y: 360, w: 160, h: 14 },
    { x: 820, y: 360, w: 160, h: 14 },
  ],
  g1_verdant_grove: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 480, w: 300, h: 18 },
    { x: 860, y: 480, w: 300, h: 18 },
    { x: 480, y: 320, w: 320, h: 18 },
    { x: 300, y: 200, w: 200, h: 14 },
    { x: 780, y: 200, w: 200, h: 14 },
  ],
  g1_glacier_realm: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 480, w: 260, h: 18 },
    { x: 920, y: 480, w: 260, h: 18 },
    { x: 420, y: 360, w: 200, h: 18 },
    { x: 660, y: 360, w: 200, h: 18 },
    { x: 540, y: 220, w: 200, h: 18 },
  ],
  g5_golden_arena: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 460, w: 360, h: 20 },
    { x: 720, y: 460, w: 360, h: 20 },
    { x: 480, y: 300, w: 320, h: 20 },
    { x: 540, y: 180, w: 200, h: 16 },
  ],
  g5_tidal_sanctum: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 460, w: 300, h: 18 },
    { x: 830, y: 460, w: 300, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 380, w: 160, h: 14 },
    { x: 820, y: 380, w: 160, h: 14 },
  ],
  g5_shadow_dojo: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 80, y: 500, w: 240, h: 18 },
    { x: 960, y: 500, w: 240, h: 18 },
    { x: 400, y: 380, w: 200, h: 18 },
    { x: 680, y: 380, w: 200, h: 18 },
    { x: 540, y: 240, w: 200, h: 18 },
  ],
  g5_portal_nexus: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 480, w: 320, h: 18 },
    { x: 760, y: 480, w: 320, h: 18 },
    { x: 480, y: 320, w: 320, h: 18 },
    { x: 300, y: 200, w: 200, h: 14 },
    { x: 780, y: 200, w: 200, h: 14 },
  ],
  g5_mountain_keep: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 240, h: 18 },
    { x: 940, y: 500, w: 240, h: 18 },
    { x: 380, y: 400, w: 200, h: 18 },
    { x: 700, y: 400, w: 200, h: 18 },
    { x: 540, y: 260, w: 200, h: 18 },
  ],
  g5_mind_palace: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 440, w: 300, h: 18 },
    { x: 800, y: 440, w: 300, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
    { x: 300, y: 360, w: 160, h: 14 },
    { x: 820, y: 360, w: 160, h: 14 },
  ],
  dawn_battleground: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 460, w: 280, h: 18 },
    { x: 880, y: 460, w: 280, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 540, y: 180, w: 200, h: 14 },
  ],
  shogun_castle: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 480, w: 280, h: 20 },
    { x: 900, y: 480, w: 280, h: 20 },
    { x: 440, y: 360, w: 400, h: 20 },
    { x: 540, y: 220, w: 200, h: 18 },
  ],
  iron_forge_town: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 460, w: 320, h: 18 },
    { x: 810, y: 460, w: 320, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 380, w: 160, h: 14 },
    { x: 820, y: 380, w: 160, h: 14 },
  ],
  rift_valley: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 80, y: 420, w: 280, h: 18 },
    { x: 920, y: 420, w: 280, h: 18 },
    { x: 480, y: 260, w: 320, h: 18 },
    { x: 400, y: 480, w: 480, h: 18 },
  ],
  blood_arena: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 200, y: 460, w: 360, h: 20 },
    { x: 720, y: 460, w: 360, h: 20 },
    { x: 480, y: 300, w: 320, h: 20 },
  ],
  resonance_lab: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 100, y: 500, w: 220, h: 18 },
    { x: 960, y: 500, w: 220, h: 18 },
    { x: 380, y: 400, w: 200, h: 18 },
    { x: 700, y: 400, w: 200, h: 18 },
    { x: 520, y: 260, w: 240, h: 18 },
  ],
  harvest_stronghold: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 120, y: 480, w: 280, h: 18 },
    { x: 880, y: 480, w: 280, h: 18 },
    { x: 440, y: 360, w: 400, h: 18 },
    { x: 540, y: 220, w: 200, h: 18 },
  ],
  crystal_library: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 180, y: 440, w: 300, h: 18 },
    { x: 800, y: 440, w: 300, h: 18 },
    { x: 480, y: 280, w: 320, h: 18 },
    { x: 300, y: 360, w: 160, h: 14 },
    { x: 820, y: 360, w: 160, h: 14 },
  ],
  element6_source: [
    { x: 40, y: 620, w: 1200, h: 48 },
    { x: 150, y: 460, w: 300, h: 18 },
    { x: 810, y: 460, w: 300, h: 18 },
    { x: 480, y: 300, w: 320, h: 18 },
    { x: 300, y: 200, w: 200, h: 14 },
    { x: 780, y: 200, w: 200, h: 14 },
  ],
};

const GAME_MODES = [
  { id: 'regular',  name: 'Regular Battle', desc: 'Classic — rack up damage %, launch foes off-stage.' },
  { id: 'time',     name: 'Time Battle',   desc: 'Most stocks when the timer ends wins. Ties go to sudden death!' },
  { id: 'hp',       name: 'HP Battle',     desc: 'Each fighter has 450 HP — drain it to take a stock.' },
  { id: 'superonly',name: 'Super Only',    desc: 'Only super moves deal damage. Meter auto-charges over time!' },
  { id: 'sudden',   name: 'Sudden Death',  desc: '1 stock, 600% damage — one hit kills.' },
  { id: 'ranked',   name: 'Bot Ranked',    desc: 'Competitive CPU scaled to your rating. Win for ELO and Element 6 tokens.' },
  { id: 'coin',     name: 'Coin Battle',   desc: 'Every hit drops coins! Pick them up — but getting hit loses coins. High risk, high reward.' },
  { id: 'brawl',    name: 'Split City Brawl', desc: 'Street Fighter style — enlarged fighters, HP brawl with powers on the streets of Split City.' },
  { id: 'challenge',name: 'The Challenge', desc: 'Face an Honored bot for a massive payout. Win or lose — no retreat.' },
  { id: 'botbattle',name: 'Bot Battle',    desc: 'Watch two CPU bots fight each other. No payout — pure spectacle.' },
  { id: 'lowgravity',name: 'Low Gravity',  desc: 'Floaty physics — reduced gravity makes for longer jumps and epic aerial combat.' },
  { id: 'shapeshift', name: 'Shapeshift',   desc: 'Team of 3 fighters! Press SUPER to morph into the next character — stocks & damage persist, supers disabled.' },
  { id: 'custom',   name: 'Custom Battle', desc: 'Up to 8 fighters! Mix humans and CPUs, pick any stage, set per-bot difficulty.' },
];

export { GAME_MODES, MAP_PLATFORMS };

// Combo training: extract the move type from a fighter's attackData for combo tracking
function getComboMoveType(attackData) {
  if (!attackData) return null;
  if (attackData.isSuper) return 'super';
  if (attackData.isGroundPound) return 'groundPound';
  if (attackData.isRecovery) return 'recovery';
  const st = attackData.sigType;
  if (st === 'aerial') return 'aerial';
  if (st === 'side') return 'sigSide';
  if (st === 'up') return 'sigUp';
  if (st === 'down') return 'sigDown';
  if (st === 'heavy') return 'heavy';
  if (st === 'downHeavy') return 'downHeavy';
  return null;
}

export default function PlatformFighter({
  p1Char, p2Char, p2IsCPU, onEnd, onAward, onRematch, selectedMap, cpuDifficulty = 'regular',
  gameMode = 'regular', dummy = false, dummyAutoRecover = false, customPlatforms = null, customSpawnPoints = null, musicVolume = 50, sfxVolume = 70,
  equippedAccessories = {}, equippedSkins = {}, killFXId = 'none',
  p1Element = 'basic', p2Element = 'basic', infiniteSuper = false, lanConnection = null, lanRole = null,
  matchTime = 240, settings = {}, localScheme = null,
  p1Username = null, p1Title = null,
  customCharsData = {},
  equippedCrossovers = {},
  equippedShikigami = {},
  mods = null,
  comboMode = false,
  onMove = null,
  customHazards = null,
  customObjects = null,
  stockCount = 0,
  equippedEmotes = {},
  shapeshiftMode = false,
  p1Team = null,
  p2Team = null,
}) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const remoteInputRef = useRef(null);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const lastResultAwardedRef = useRef(false); // guards against double-paying the same match (rematch vs exit)
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  useClipRecorder(canvasRef);

  // Generate random cosmetics for bot fighter
  const botCharIds = p2IsCPU && p2Char ? [p2Char] : [];
  const { equippedAccessories: _mergedAccs, equippedShikigami: _mergedShik } = mergeBotCosmetics(equippedAccessories, equippedShikigami, botCharIds);
  const botAccessoriesRef = useRef(_mergedAccs);
  botAccessoriesRef.current = _mergedAccs;
  const botShikigamiRef = useRef(_mergedShik);
  botShikigamiRef.current = _mergedShik;

  const mapId = customPlatforms ? 'custom' : (selectedMap || 'splitcity');
  const activeEvent = getActiveEvent();
  // Event stage support — use event stage platforms
  let eventPlatforms = null;
  if (!customPlatforms && mapId === activeEvent?.eventStage?.id) {
    eventPlatforms = activeEvent.eventStage.platforms;
  }
  const platforms = (() => {
    let p = customPlatforms || eventPlatforms || applyStageMaterials(MAP_PLATFORMS[mapId] || MAP_PLATFORMS.splitcity, mapId);
    // Sandbox: "Upside Down" — flip the stage so the floor becomes the ceiling.
    // Gravity & jumps stay normal, so all existing collision/landing logic works
    // unchanged; fighters simply stand on the (now top) platforms and fall "down".
    if (mods?.upsideDown && !customPlatforms) p = p.map(pl => ({ ...pl, y: H - pl.y - pl.h, _moveBaseY: undefined }));
    return p;
  })();

  const getCharData = (id) => customCharsData[id] || ALL_CHARS_MAP[id] || HEROES[0];

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume);
    sfx.setVolume(sfxVolume);
    music.play(gameMode === 'soccer' || gameMode === 'soccertournament' ? 'soccer' : 'fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume, gameMode]);

  // LAN: receive remote player's parsed input (their per-device scheme already applied on sender)
  useEffect(() => {
    if (!lanConnection) return;
    lanConnection.onMessage((msg) => {
      if (msg && msg.type === 'input' && msg.input) remoteInputRef.current = msg.input;
    });
  }, [lanConnection]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const char1Base = getCharData(p1Char);
    const char2Base = getCharData(p2Char);
    if (!char1Base || !char2Base) { console.error('Missing char data for', p1Char, p2Char); return; }
    // Ensure required fields exist to prevent engine crashes
    const safeChar = (c) => ({
      ...c,
      heavyAttack: c.heavyAttack || { name: 'Heavy Strike', damage: 20, knockback: 1.3, range: 170, duration: 22, color: c.color || '#FF6600', type: 'dash', desc: 'A powerful strike.' },
      signatures: c.signatures || {
        side: { name: 'Side Strike', damage: 16, knockback: 1.0, range: 180, duration: 20, color: c.color || '#FF6600', type: 'dash', desc: 'A slashing strike.' },
        up:   { name: 'Rising Strike', damage: 14, knockback: 1.2, range: 120, duration: 18, color: c.color || '#FF6600', type: 'launch', desc: 'An upward strike.' },
        down: { name: 'Ground Slam', damage: 18, knockback: 1.1, range: 150, duration: 22, color: c.color || '#FF6600', type: 'groundSlam', desc: 'A downward strike.' },
      },
      superMove: c.superMove || { name: 'Ultimate', damage: 42, duration: 50, color: c.color || '#FF6600', desc: 'A devastating ultimate.' },
      stats: c.stats || { power: 6, speed: 6, defense: 6, utility: 6, control: 6 },
    });
    const char1 = { ...safeChar(char1Base), stats: applyElement(char1Base.stats || {}, p1Element), shikigamiId: botShikigamiRef.current?.[char1Base?.baseCharId || p1Char] };
    const char2 = { ...safeChar(char2Base), stats: applyElement(char2Base.stats || {}, p2Element), shikigamiId: botShikigamiRef.current?.[char2Base?.baseCharId || p2Char] };

    const defaultSpawnY = platforms[0]?.y ?? 620;
    const p1Spawn = customSpawnPoints && customSpawnPoints[0] ? { x: customSpawnPoints[0].x, y: customSpawnPoints[0].y } : { x: 280, y: defaultSpawnY };
    const p2Spawn = customSpawnPoints && customSpawnPoints[1] ? { x: customSpawnPoints[1].x, y: customSpawnPoints[1].y } : { x: 1000, y: defaultSpawnY };
    const f1 = createFighter(char1, p1Spawn.x, p1Spawn.y, 1);
    const f2 = createFighter(char2, p2Spawn.x, p2Spawn.y, -1);
    if (customSpawnPoints && customSpawnPoints[0]) f1.respawnPoint = { x: customSpawnPoints[0].x, y: customSpawnPoints[0].y };
    if (customSpawnPoints && customSpawnPoints[1]) f2.respawnPoint = { x: customSpawnPoints[1].x, y: customSpawnPoints[1].y };
    f1.grounded = true; f2.grounded = true;
    // Shapeshift mode: store 3-character teams, start at index 0
    if (shapeshiftMode) {
      f1.shapeshiftTeam = (p1Team && p1Team.length >= 3) ? p1Team.slice(0, 3) : [p1Char, p1Char, p1Char];
      f2.shapeshiftTeam = (p2Team && p2Team.length >= 3) ? p2Team.slice(0, 3) : [p2Char, p2Char, p2Char];
      f1.shapeshiftIndex = 0; f2.shapeshiftIndex = 0;
      f1.shapeshiftCooldown = 0; f2.shapeshiftCooldown = 0;
    }
    f2.isAI = p2IsCPU && !dummy;
    f2.cpuDifficulty = cpuDifficulty;
    if (gameMode === 'botbattle') { f1.isAI = true; f1.cpuDifficulty = cpuDifficulty; }
    if (gameMode === 'challenge') { f2.cpuDifficulty = 'honored'; f2.isAI = true; }
    f1.gameMode = gameMode; f2.gameMode = gameMode;
    if (gameMode === 'lowgravity') { f1.lowGravity = true; f2.lowGravity = true; }
    if (gameMode === 'sudden') {
      f1.stocks = 1; f2.stocks = 1; f1.damage = 600; f2.damage = 600;
    }
    if (stockCount && stockCount > 0 && gameMode !== 'sudden') {
      f1.stocks = stockCount; f2.stocks = stockCount;
    }
    if (gameMode === 'hp' || gameMode === 'brawl') { f1.hp = 450; f2.hp = 450; }

    let timer = gameMode === 'sudden' ? 240 : (matchTime > 0 ? matchTime : (gameMode === 'time' ? 180 : 240));
    if (gameMode === 'time' && matchTime > 0) timer = matchTime;
    if (matchTime === 0 && gameMode !== 'sudden') timer = 99999;
    if (comboMode) { timer = 99999; f1.stocks = 999; f2.stocks = 999; }
    let lastTime = performance.now();
    // Normalized sandbox mods — applied every frame to alter physics/combat
    const M = mods ? { damageMultiplier: 1, gravity: 1, jumpHeight: 1, movementSpeed: 1, superChargeRate: 1, powerCooldownRate: 1, slowMotion: 1, respawnTime: 1, infiniteJumps: false, infiniteStocks: false, infiniteHP: false, infinitePower: false, freezeAI: false, cpuBehavior: 'balanced', ...mods } : null;
    let superFlash1 = null, superFlash2 = null;
    let camX = 0, camY = 0, camZoom = 0.85, shakeX = 0, shakeY = 0, shakeMag = 0;
    const stats = { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0 };
    const p2Stats = { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0 };
    let prevPowerTimer1 = 0, prevSuper1 = false, lastHeavyRef = null;
    let prevSuper2 = false, lastHeavyRef2 = null, prevPowerTimer2 = 0;
    let prevAttackRef1 = null; // combo mode: track P1's previous attack for move detection
let prevJumps1 = 2, prevDownAir1 = false; // combo mode: track jumps and fastfalls
    let coins = []; // {x, y, vx, vy, life}
    let coinsCollected1 = 0, coinsCollected2 = 0;
    let hitstop = 0, superImpactFlash = 0;
    let prevF1Grounded = true, prevF2Grounded = true, prevF2Power = 0;
    let prevStocks1 = f1.stocks, prevStocks2 = f2.stocks;
    let prevGpStart = false;
  let killFeed = [];
    let killFxEffects = []; // { x, y, color, progress, fxId }
    // Emote state is stored on each fighter: f.emote = { id, timer, maxTimer, progress }
  // Set by the keydown handler, updated each frame in the game loop.
    // Sandbox hazard zones + knockback items — prefer stage-placed, else auto-generate from toggles
    let sbHazards = (customHazards && customHazards.length > 0) ? buildHazardsFromStage(customHazards) : ((mods?.brHazards) ? buildSandboxHazards(platforms, W, H) : null);
    let sbObjects = (customObjects && customObjects.length > 0) ? buildObjectsFromStage(customObjects) : ((mods?.brItems) ? buildSandboxObjects(platforms) : null);
    let combo1 = { count: 0, timer: 0, displayTimer: 0 }; // P1's combo on P2
    let combo2 = { count: 0, timer: 0, displayTimer: 0 }; // P2's combo on P1

    gameRef.current = { f1, f2, timer, running: true, superFlash1, superFlash2, camX, camY, camZoom, shakeX, shakeY, shakeMag };

    const finish = (p1Won) => {
      if (!gameRef.current) return;
      gameRef.current.running = false;
      const f1Cur = gameRef.current.f1, f2Cur = gameRef.current.f2;
      const wName = p1Won === null ? 'Draw' : p1Won ? (f1Cur?.char?.name || char1.name) : (f2Cur?.char?.name || char2.name);
      gameRef.current.result = { winner: wName, p1Won, stats: { ...stats, distance: Math.floor(stats.distance / 12), coins: coinsCollected1 }, p2Stats: { ...p2Stats, distance: Math.floor(p2Stats.distance / 12) }, moveStats: f1 ? { ...f1.moveStats } : {}, p2Char };
      lastResultAwardedRef.current = false; // a fresh finished match is ready to be paid out
      setWinner(wName);
    };

    const kd = e => {
      keysRef.current[e.key] = true;
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        pausedRef.current = !pausedRef.current; setPaused(v => !v);
      }
      // Emotes — number keys 1-0, not in botbattle
      // Solo/Online: keys 1-0 → P1's 10 emote slots
      // Co-op: keys 1-5 → P2's 5 emote slots, keys 6-0 → P1's 5 emote slots
      if (gameMode !== 'botbattle' && ['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const _emoteMode = lanConnection ? 'online' : (!p2IsCPU && !dummy) ? 'coop' : 'solo';
        if (_emoteMode === 'coop' && ['1','2','3','4','5'].includes(e.key)) {
          const emote = getEmoteForKey(e.key, equippedEmotes, 2, 'coop');
          if (emote && f2.grounded && !f2.emote) f2.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        } else {
          const _key = _emoteMode === 'coop' && ['6','7','8','9','0'].includes(e.key) ? e.key : e.key;
          const emote = getEmoteForKey(e.key, equippedEmotes, 1, _emoteMode);
          if (emote && f1.grounded && !f1.emote) f1.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
        }
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    // Keep the match running when focus leaves the window — do NOT auto-pause on blur.
    // Screen Wake Lock keeps the display/computer awake while the match is active.
    let wakeLock = null;
    const requestWakeLock = async () => { try { if (navigator.wakeLock?.request) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} };
    const releaseWakeLock = () => { if (wakeLock) { wakeLock.release?.().catch(() => {}); wakeLock = null; } };
    const onWakeVis = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    requestWakeLock();
    document.addEventListener('visibilitychange', onWakeVis);

    const loop = (now) => {
      if (!gameRef.current?.running) return;
      // Soft pause: in LAN/online play the game continues while you stand still behind the overlay
      if (pausedRef.current && !lanConnection) { requestAnimationFrame(loop); return; }

      const dt = Math.min((now - lastTime) / 1000, 0.05) * (M?.slowMotion || 1);
      lastTime = now;
      const { f1, f2 } = gameRef.current;
      gameRef.current.timer -= dt;

      if (gameRef.current.timer <= 0 || f1.stocks <= 0 || f2.stocks <= 0) {
        let p1Won = null;
        if (f1.stocks <= 0 && f2.stocks <= 0) p1Won = null;
        else if (f1.stocks <= 0) p1Won = false;
        else if (f2.stocks <= 0) p1Won = true;
        else if (f1.stocks !== f2.stocks) p1Won = f1.stocks > f2.stocks;
        // A timed fight is decided by stocks first, then the lower damage
        // percentage.  Only an exact tie is a draw.
        else if (gameRef.current.timer <= 0) {
          p1Won = f1.damage < f2.damage ? true : f2.damage < f1.damage ? false : null;
        } else p1Won = null;
        // Coin battle: winner is whoever has more coins
        if (gameMode === 'coin') {
          p1Won = coinsCollected1 > coinsCollected2 ? true : coinsCollected2 > coinsCollected1 ? false : null;
        }
        // Stock KOs use sudden death. A genuine 0:00 tie is a draw.
        if (p1Won === null && !gameRef.current._suddenDeath) {
          if (gameRef.current.timer <= 0) { finish(null); return; }
          gameRef.current._suddenDeath = true;
          f1.stocks = 1; f2.stocks = 1; f1.damage = 600; f2.damage = 600;
          if (gameMode === 'hp' || gameMode === 'brawl') { f1.hp = 450; f2.hp = 450; }
          gameRef.current.timer = 120;
          return;
        }
        finish(p1Won);
        return;
      }

      const k = keysRef.current;
      const _kb = getKeybinds(settings);
      const _soloKb = getSoloKeybinds(settings);
      // Gamepad input (Bluetooth + wired) — merged with keyboard so both work
      const _gpEnabled = settings?.controllerEnabled !== false;
      const gp1 = _gpEnabled ? readGamepadInput(0) : null;
      const gp2 = _gpEnabled ? readGamepadInput(1) : null;
      // Controller cannot pause — use mouse/trackpad or keyboard Esc/P to pause.
      prevGpStart = !!gp1?.start;
      const mergeGp = (kb, gp) => gp ? {
        left: kb.left || gp.left, right: kb.right || gp.right,
        jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
        sig: kb.sig || gp.sig, power: kb.power || gp.power,
        superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
      } : kb;
      let p1In, p2In;
      if (lanConnection) {
        // Each device reads its own chosen scheme; remote input arrives already parsed
        const scheme = localScheme || (lanRole === 'host' ? 'p1' : 'p2');
        const localBinds = getSchemeKeybinds(settings, scheme);
        const localRaw = pausedRef.current ? { left:false, right:false, jump:false, up:false, down:false, sig:false, power:false, superMove:false, heavy:false } : readPlayerInput(k, localBinds);
        const remoteRaw = remoteInputRef.current || { left:false, right:false, jump:false, up:false, down:false, sig:false, power:false, superMove:false, heavy:false };
        if (lanRole === 'host') {
          p1In = localRaw;
          p2In = p2IsCPU ? updateAI(f2, f1, cpuDifficulty, platforms, 1 + ((settings.aiAggression ?? 50) - 50) / 100) : remoteRaw;
        } else {
          p1In = remoteRaw;
          p2In = localRaw;
        }
        lanConnection.sendMessage({ type: 'input', input: localRaw });
      } else {
        const soloPlay = p2IsCPU || dummy; // only one human player (P1)
        p1In = gameMode === 'botbattle'
          ? updateAI(f1, f2, cpuDifficulty, platforms, 1 + ((settings.aiAggression ?? 50) - 50) / 100)
          : mergeGp(soloPlay && _soloKb ? readPlayerInput(k, _soloKb)
             : soloPlay ? readSinglePlayerInput(k, _kb.p1, _kb.p2)
             : readPlayerInput(k, _kb.p1), gp1);
        p2In = dummy ? (() => {
          const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
          if (!dummyAutoRecover) return NO_INPUT;
          // Auto-recover dummy: stays completely still while safely grounded on the
          // main platform. It ONLY triggers recovery movement once it has been knocked
          // off (no longer grounded) — i.e. once it reaches/beyond the platform edge.
          if (f2.grounded) return NO_INPUT;
          const inp = { ...NO_INPUT };
          const cx = W / 2;
          const dx = cx - f2.x;
          // Move toward center
          if (dx > 40) inp.right = true;
          else if (dx < -40) inp.left = true;
          // Jump when falling
          if (f2.y > 420) inp.jump = true;
          // Recovery attack (sig+up) when deep off-stage
          if (f2.y > 460 && f2.recoveryCooldown <= 0) { inp.up = true; inp.sig = true; }
          return inp;
        })()
          : (p2IsCPU ? (M?.freezeAI ? { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false } : updateAI(f2, f1, cpuDifficulty, platforms, 1 + ((settings.aiAggression ?? 50) - 50) / 100)) : mergeGp(readPlayerInput(k, _kb.p2), gp2));
      }

      // Brawl mode: only light attacks (sig) allowed
      if (gameMode === 'brawl') {
        p1In.power = false; p1In.superMove = false; p1In.heavy = false;
        p2In.power = false; p2In.superMove = false; p2In.heavy = false;
      }

      // Emote movement lock — if emote active, force no input (no move, attack, jump, etc.)
      const _NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
      if (f1.emote && f1.emote.timer > 0) p1In = _NO_INPUT;
      if (f2.emote && f2.emote.timer > 0) p2In = _NO_INPUT;

      // ── Shapeshift mode: super button → switch character; supers disabled ──
      if (shapeshiftMode) {
        const _p1Super = p1In.superMove;
        const _p2Super = p2In.superMove;
        p1In.superMove = false; p2In.superMove = false; // never allow supers
        const switchFighter = (f, superPressed, isAI) => {
          if (f.shapeshiftCooldown > 0) { f.shapeshiftCooldown--; return; }
          let wantSwitch = false;
          if (isAI) {
            // AI switches every ~6-9 seconds or when damage is high
            f._aiSwitchTimer = (f._aiSwitchTimer || 0) + 1;
            if (f._aiSwitchTimer > (360 + Math.random() * 180) || f.damage > 120) { f._aiSwitchTimer = 0; wantSwitch = true; }
          } else if (superPressed) {
            wantSwitch = true;
          }
          if (wantSwitch && f.shapeshiftTeam.length > 1) {
            f.shapeshiftIndex = (f.shapeshiftIndex + 1) % f.shapeshiftTeam.length;
            const newCharId = f.shapeshiftTeam[f.shapeshiftIndex];
            const newChar = { ...safeChar(getCharData(newCharId)) };
            newChar.stats = applyElement(newChar.stats || {}, f.char._element || 'basic');
            // Preserve stocks, damage, position, velocity, facing, stocks, state
            const saved = { stocks: f.stocks, damage: f.damage, x: f.x, y: f.y, vx: f.vx, vy: f.vy, facing: f.facing, grounded: f.grounded, jumps: f.jumps, maxJumps: f.maxJumps, superMeter: f.superMeter, state: 'idle', frame: f.frame, recoveryCooldown: f.recoveryCooldown, attackData: null, attackTimer: 0, powerActive: false, powerTimer: 0, powerCooldown: f.powerCooldown };
            Object.assign(f, { char: newChar, ...saved });
            // Fully expire any active power ability (mirrors natural power-expiry resets)
            f._dash = null;
            f.speedBoost = 1; f.damageBoost = 1; f.rangeBoost = 1; f.shieldAmount = 0;
            f.knockbackMul = 1; f.knockbackReduction = 0; f._healPerTick = 0;
            f.speedMul = undefined; f.dodgeChance = undefined; f.reviveChance = 0;
            f.canFly = false;
            f._stolenPowerColor = null; f._stolenPowerCharId = null; f._stolenPowerName = null;
            f.dotTargets = null; f.dotDamage = 0;
            f.gravityInverted = false;
            f.projectiles = []; f.genProjectiles = [];
            f.hitEffects = [];
            f._clone = null;
            f._portalEffect = null;
            f._dashSlashEffect = null;
            f.shapeshiftCooldown = 30; // 0.5s cooldown
            f._shapeshiftFlash = 30;
            sfx.superActivate();
          }
        };
        switchFighter(f1, _p1Super, f1.isAI);
        switchFighter(f2, _p2Super, f2.isAI);
      }

      const f1WasSuper = f1.state === 'superAttack';
      prevPowerTimer1 = f1.powerTimer;
      prevSuper1 = f1.state === 'superAttack';

      if (hitstop > 0) { hitstop--; } else {
      applyMovingPlatforms(platforms, now, [f1, f2]);
      updateFighter(f1, p1In, platforms, W, H, f2);
      updateFighter(f2, p2In, platforms, W, H, f1);
      // Update emote timers — cancel if airborne, decrement timer, update progress
      [f1, f2].forEach(f => {
        if (f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) { if (f.emote.key && keysRef.current[f.emote.key]) { f.emote.timer = f.emote.maxTimer; } else { f.emote = null; } } }
        }
      });
      // High Five — requires shikigami; cancel if none equipped
      [f1, f2].forEach(f => {
        if (f.emote?.id === 'highfive' && !f.emote._checked) {
          const hasShikigami = f.char?.shikigamiId || botShikigamiRef.current?.[f.char?.id];
          if (!hasShikigami) f.emote = null;
          else f.emote._checked = true;
        }
      });
      // Fist Bump sync — if both have fistbump, are close, and facing each other
      if (f1.emote?.id === 'fistbump' && f2.emote?.id === 'fistbump' && !f1.emote._synced) {
        const dx = f2.x - f1.x;
        const dist = Math.abs(dx);
        const facingEachOther = (dx > 0 && f1.facing > 0 && f2.facing < 0) || (dx < 0 && f1.facing < 0 && f2.facing > 0);
        if (dist < 120 && facingEachOther) {
          f1.emote._synced = true; f2.emote._synced = true;
          const maxT = Math.max(f1.emote.timer, f2.emote.timer);
          f1.emote.timer = maxT; f2.emote.timer = maxT;
          f1.emote.maxTimer = maxT; f2.emote.maxTimer = maxT;
          sfx.hit();
        }
      }
      // Sandbox hazard zones + knockback items
      if (sbHazards) updateSandboxHazards(sbHazards, [f1, f2], dt);
      if (sbObjects) { updateSandboxObjects(sbObjects, [f1, f2], platforms, dt, W, H, sbHazards); processSandboxObjectHits([f1, f2], sbObjects, platforms); }

      // ── Sandbox physics mods ──
      if (M) {
        f1._sandboxMods = M; f2._sandboxMods = M;
        // Gravity multiplier — add/remove extra vertical velocity
        if (M.gravity !== 1) { const extra = 0.6 * (M.gravity - 1); f1.vy += extra; f2.vy += extra; }
        // Movement speed — scale horizontal velocity when input is active
        if (M.movementSpeed !== 1) {
          if (p1In.left || p1In.right) f1.vx *= M.movementSpeed;
          if (p2In.left || p2In.right) f2.vx *= M.movementSpeed;
        }
        // Jump height — scale upward velocity the frame a fighter leaves the ground
        if (M.jumpHeight !== 1) {
          if (prevF1Grounded && !f1.grounded && f1.vy < 0) f1.vy *= M.jumpHeight;
          if (prevF2Grounded && !f2.grounded && f2.vy < 0) f2.vy *= M.jumpHeight;
        }
        // Infinite jumps — reset jump count each frame so every jump is a ground jump
        if (M.infiniteJumps) { f1.jumps = f1.maxJumps; f2.jumps = f2.maxJumps; }
        // Infinite HP — keep HP full in hp/brawl modes; in regular mode prevent 700% KO death
        if (M.infiniteHP) {
          if (gameMode === 'hp' || gameMode === 'brawl') { f1.hp = 450; f2.hp = 450; }
          else { f1._pendingDeath = false; f2._pendingDeath = false; if (f1.damage > 650) f1.damage = 650; if (f2.damage > 650) f2.damage = 650; }
        }
        // Infinite power — power always ready and never disabled
        if (M.infinitePower) { f1.powerCooldown = 0; f2.powerCooldown = 0; f1.powerDisabled = 0; f2.powerDisabled = 0; }
        // Infinite stocks
        if (M.infiniteStocks) { f1.stocks = Math.max(f1.stocks, 3); f2.stocks = Math.max(f2.stocks, 3); }
        // Super charge rate
        if (M.superChargeRate !== 1) {
          f1.superMeter = Math.min(f1.maxSuper, f1.superMeter * M.superChargeRate);
          f2.superMeter = Math.min(f2.maxSuper, f2.superMeter * M.superChargeRate);
        }
        // Power cooldown rate — faster cooldown = lower timer
        if (M.powerCooldownRate !== 1) {
          if (f1.powerTimer > 0) f1.powerTimer = Math.max(0, f1.powerTimer / M.powerCooldownRate);
          if (f2.powerTimer > 0) f2.powerTimer = Math.max(0, f2.powerTimer / M.powerCooldownRate);
        }
      }

      // Infinite Super (sandbox mod + tutorial): keep super meter always full for both fighters
      if (infiniteSuper) { f1.superMeter = f1.maxSuper; f2.superMeter = f2.maxSuper; }

      // ── Combo Training Mode: infinite resources + move detection ──
      if (comboMode) {
        f1.stocks = 999; f2.stocks = 999;
        f1.powerCooldown = 0; f1.powerTimer = 0;
        f1.superMeter = f1.maxSuper;
        // Detect new attacks by P1 and report to the combo tracker
        if (onMoveRef.current) {
          if (f1.attackData && f1.attackData !== prevAttackRef1) {
            const mt = getComboMoveType(f1.attackData);
            if (mt) onMoveRef.current(mt);
            prevAttackRef1 = f1.attackData;
          }
          if (!f1.attackData) prevAttackRef1 = null;
          if (prevPowerTimer1 <= 0 && f1.powerTimer > 0) onMoveRef.current('power');
          // Jump detection — jumps count decreased
          if (f1.jumps < prevJumps1) onMoveRef.current('jump');
          prevJumps1 = f1.jumps;
          // Fastfall detection — down pressed while airborne (edge detected)
          const downAir = p1In.down && !f1.grounded;
          if (downAir && !prevDownAir1) onMoveRef.current('fastfall');
          prevDownAir1 = downAir;
        }
      }

      // Combo timer countdown
      if (combo1.timer > 0) { combo1.timer--; if (combo1.timer <= 0) { combo1.count = 0; } }
      if (combo2.timer > 0) { combo2.timer--; if (combo2.timer <= 0) { combo2.count = 0; } }
      if (combo1.displayTimer > 0) combo1.displayTimer--;
      if (combo2.displayTimer > 0) combo2.displayTimer--;

      // Update power projectiles and platform deletion
      updateProjectiles(f1, f2);
      updateProjectiles(f2, f1);
      [f1, f2].forEach(ff => {
        if (ff._platformsToDelete > 0) {
          ff._platformsToDelete--;
          const avail = platforms.filter(p => !p._deleted || p._deleted <= 0);
          if (avail.length > 0) { avail[Math.floor(Math.random() * avail.length)]._deleted = 600; }
        }
      });
      platforms.forEach(p => { if (p._deleted > 0) p._deleted--; });

      // SFX: jump, KO detection
      if (prevF1Grounded && !f1.grounded && f1.vy < -2) sfx.jump();
      if (prevF2Grounded && !f2.grounded && f2.vy < -2) sfx.jump();
      if (prevStocks1 !== f1.stocks || prevStocks2 !== f2.stocks) {
        sfx.ko();
        if (prevStocks1 !== f1.stocks) { if (f1._lastHitBy === f2) { p2Stats.kills++; stats.deaths++; } }
        if (prevStocks2 !== f2.stocks) { if (f2._lastHitBy === f1) { stats.kills++; p2Stats.deaths++; } }
        if (prevStocks1 !== f1.stocks && f1._lastHitBy && f1._lastHitBy.stocks > 0) killFeed.push({ killer: f1._lastHitBy.char.name, victim: f1.char.name, timer: 180 });
        if (prevStocks2 !== f2.stocks && f2._lastHitBy && f2._lastHitBy.stocks > 0) killFeed.push({ killer: f2._lastHitBy.char.name, victim: f2.char.name, timer: 180 });
        if (killFXId && killFXId !== 'none') {
          const clampKO = (fx, fy) => ({
            x: Math.max(30, Math.min(W - 30, fx)),
            y: Math.max(30, Math.min(H - 30, fy)),
          });
          if (prevStocks1 !== f1.stocks) { const p = clampKO(f1._deathX ?? f1.x, f1._deathY ?? f1.y); killFxEffects.push({ x: p.x, y: p.y, color: char1.color, progress: 0, fxId: killFXId, frame: f1.frame }); }
          if (prevStocks2 !== f2.stocks) { const p = clampKO(f2._deathX ?? f2.x, f2._deathY ?? f2.y); killFxEffects.push({ x: p.x, y: p.y, color: char2.color, progress: 0, fxId: killFXId, frame: f2.frame }); }
        }
      }
      prevF1Grounded = f1.grounded; prevF2Grounded = f2.grounded;
      prevStocks1 = f1.stocks; prevStocks2 = f2.stocks;

      // Super-only mode: super meter slowly charges even when doing nothing
      if (gameMode === 'superonly') {
        f1.superMeter = Math.min(f1.maxSuper, f1.superMeter + 0.35);
        f2.superMeter = Math.min(f2.maxSuper, f2.superMeter + 0.35);
      }

      // Stats tracking for P1
      stats.distance += Math.abs(f1.vx);
      if (!prevSuper1 && f1.state === 'superAttack') stats.supers++;
      if (prevPowerTimer1 <= 0 && f1.powerTimer > 0) { stats.powers++; sfx.power(); }
      if (prevF2Power <= 0 && f2.powerTimer > 0) sfx.power();
      prevF2Power = f2.powerTimer;
      if (f1.attackData && f1.attackData.isHeavy && f1.attackData !== lastHeavyRef) { stats.heavies++; lastHeavyRef = f1.attackData; }
      if (!f1.attackData) lastHeavyRef = null;
      // Stats tracking for P2
      p2Stats.distance += Math.abs(f2.vx);
      if (!prevSuper2 && f2.state === 'superAttack') p2Stats.supers++;
      prevSuper2 = f2.state === 'superAttack';
      if (prevPowerTimer2 <= 0 && f2.powerTimer > 0) p2Stats.powers++;
      prevPowerTimer2 = f2.powerTimer;
      if (f2.attackData && f2.attackData.isHeavy && f2.attackData !== lastHeavyRef2) { p2Stats.heavies++; lastHeavyRef2 = f2.attackData; }
      if (!f2.attackData) lastHeavyRef2 = null;

      if (!f1WasSuper && f1.state === 'superAttack') { gameRef.current.superFlash1 = { name: char1.superMove?.name, color: char1.color, progress: 0 }; shakeMag = 18; sfx.superActivate(); }
      if (gameRef.current.superFlash2 === null && f2.state === 'superAttack' && !gameRef.current._f2super) {
        gameRef.current.superFlash2 = { name: char2.superMove?.name, color: char2.color, progress: 0 }; shakeMag = 18; sfx.superActivate();
      }
      gameRef.current._f2super = f2.state === 'superAttack';

      // ── Super move clash: if both supers active and close, massive clash ──
      if (f1.state === 'superAttack' && f2.state === 'superAttack' && !gameRef.current._clashed) {
        const dx = f2.x - f1.x, dy = f2.y - f1.y;
        if (Math.sqrt(dx * dx + dy * dy) < 280) {
          gameRef.current._clashed = true;
          shakeMag = 30; hitstop = 18; superImpactFlash = 1.0; sfx.superImpact();
          f1.damage += 35; f2.damage += 35;
          f1.hitstun = 40; f2.hitstun = 40;
          f1.state = 'hitstun'; f2.state = 'hitstun';
          f1.vx = -Math.sign(dx || 1) * 30 * 0.65; f2.vx = Math.sign(dx || 1) * 30 * 0.65;
          f1.vy = -18 * 0.65; f2.vy = -18 * 0.65;
          f1.grounded = false; f2.grounded = false;
          f1.attackData = null; f2.attackData = null;
          f1.attackTimer = 0; f2.attackTimer = 0;
        }
      }

      if (checkHit(f1, f2)) {
        const _isSuper1 = f1.state === 'superAttack';
        const _isHeavy1 = f1.attackData && f1.attackData.isHeavy;
        stats.hits++; if (_isSuper1) stats.superHits++; if (_isHeavy1) stats.heavyHits++;
        const _f2DmgBefore = f2.damage;
        applyHit(f1, f2);
        if (M && M.damageMultiplier !== 1) f2.damage = _f2DmgBefore + (f2.damage - _f2DmgBefore) * M.damageMultiplier;
        if (_isSuper1) { hitstop = 14; superImpactFlash = 1.0; shakeMag = 28; sfx.superImpact(); }
        else if (_isHeavy1) { hitstop = 5; shakeMag = Math.max(shakeMag, 12); sfx.heavyHit(); }
        else { shakeMag = Math.max(shakeMag, 7); sfx.hit(); }
        // Combo tracking
        combo1.count++; combo1.timer = 90; combo1.displayTimer = 120;
        // Coin Battle: drop 1 token at a random platform location on the stage
        if (gameMode === 'coin') {
          const pl = platforms[Math.floor(Math.random() * platforms.length)];
          if (pl) coins.push({ x: pl.x + Math.random() * pl.w, y: pl.y - 60, vx: 0, vy: 0, life: 600, value: 1 + Math.floor(Math.random() * 3) });
        }
      }
      if (checkHit(f2, f1)) {
        const _isSuper2 = f2.state === 'superAttack';
        const _isHeavy2 = f2.attackData && f2.attackData.isHeavy;
        p2Stats.hits++; if (_isSuper2) p2Stats.superHits++; if (_isHeavy2) p2Stats.heavyHits++;
        const _f1DmgBefore = f1.damage;
        applyHit(f2, f1);
        if (M && M.damageMultiplier !== 1) f1.damage = _f1DmgBefore + (f1.damage - _f1DmgBefore) * M.damageMultiplier;
        if (_isSuper2) { hitstop = 14; superImpactFlash = 1.0; shakeMag = 28; sfx.superImpact(); }
        else if (_isHeavy2) { hitstop = 5; shakeMag = Math.max(shakeMag, 12); sfx.heavyHit(); }
        else { shakeMag = Math.max(shakeMag, 7); sfx.hit(); }
        // Combo tracking
        combo2.count++; combo2.timer = 90; combo2.displayTimer = 120;
        // Coin Battle: drop 1 token at a random platform location on the stage
        if (gameMode === 'coin') {
          const pl = platforms[Math.floor(Math.random() * platforms.length)];
          if (pl) coins.push({ x: pl.x + Math.random() * pl.w, y: pl.y - 60, vx: 0, vy: 0, life: 600, value: 1 + Math.floor(Math.random() * 3) });
        }
      }

      // ── Destroyable platforms: break when hit by an attack hitbox ──
      const checkDestroyableHits = (attacker) => {
        if (!attacker.attackData || attacker.attackData.hitApplied) return;
        if (attacker.state !== 'attacking' && attacker.state !== 'superAttack') return;
        const ap = attacker.attackData.progress;
        if (ap < 0.08 || ap > 0.85) return;
        const baseRange = (attacker.attackData.range || 80) * (attacker.rangeBoost || 1);
        const facing = attacker.facing;
        const st = attacker.attackData.sigType;
        let hbW, hbH, hbCX, hbCY;
        if (st === 'up' || st === 'aerial') {
          hbW = 70; hbH = baseRange;
          hbCX = attacker.x; hbCY = attacker.y - baseRange / 2 - 10;
        } else if (st === 'down' || st === 'downNormal' || st === 'downHeavy') {
          hbW = 70; hbH = baseRange;
          hbCX = attacker.x; hbCY = attacker.y + baseRange / 2 - 20;
        } else if (st === 'heavy') {
          hbW = baseRange * 1.1; hbH = 80;
          hbCX = attacker.x + facing * (hbW / 2 - 10); hbCY = attacker.y - 30;
        } else if (st === 'super') {
          hbW = 240; hbH = 240; hbCX = attacker.x; hbCY = attacker.y - 30;
        } else {
          hbW = baseRange; hbH = 60;
          hbCX = attacker.x + facing * (hbW / 2 - 10); hbCY = attacker.y - 30;
        }
        for (const pl of platforms) {
          if (!pl.destroyable || pl._deleted > 0) continue;
          if ((hbCX - hbW / 2) < (pl.x + pl.w) &&
              (hbCX + hbW / 2) > pl.x &&
              (hbCY - hbH / 2) < (pl.y + pl.h) &&
              (hbCY + hbH / 2) > pl.y) {
            pl._deleted = 600; // breaks for 10 seconds, then regenerates
            sfx.hit();
            shakeMag = Math.max(shakeMag, 10);
          }
        }
      };
      checkDestroyableHits(f1);
      checkDestroyableHits(f2);

      // 700+ damage instant death
      [f1, f2].forEach(f => {
        if (f._pendingDeath && f.stocks > 0) {
          f._pendingDeath = false;
          loseStock(f, W, H);
          if (f._lastHitBy) killFeed.push({ killer: f._lastHitBy.char.name, victim: f.char.name, timer: 180 });
        }
      });

      // Coin physics + pickup
      if (gameMode === 'coin') {
        coins = coins.filter(c => {
          c.vy += 0.5; c.x += c.vx; c.y += c.vy; c.life--;
          // land on platforms
          for (const p of platforms) {
            if (c.vy >= 0 && c.x > p.x && c.x < p.x + p.w && c.y >= p.y && c.y <= p.y + 12) { c.y = p.y; c.vy = 0; c.vx *= 0.7; }
          }
          // pickup by f1
          if (Math.abs(c.x - f1.x) < 30 && Math.abs(c.y - f1.y) < 40) { coinsCollected1 += (c.value || 1); sfx.coin(); return false; }
          // pickup by f2
          if (Math.abs(c.x - f2.x) < 30 && Math.abs(c.y - f2.y) < 40) { coinsCollected2 += (c.value || 1); sfx.coin(); return false; }
          return c.life > 0 && c.x > -100 && c.x < W + 100 && c.y < H + 100;
        });
      }
      }

      // Dynamic camera — ZOOM IN for 1v1 (closer than before)
      const g = gameRef.current;
      const fdx = Math.abs(f2.x - f1.x), fdy = Math.abs(f2.y - f1.y);
      const zoomMul = settings.cameraZoom === 'close' ? 1.15 : settings.cameraZoom === 'far' ? 0.85 : 1.0;
      const stageZoom = settings.stageZoom != null ? settings.stageZoom : 1.0;
      let targetZoom = Math.max(0.60, Math.min(0.95, 0.95 - fdx / 1200 - fdy / 1000));
      const spreadX = fdx + 280;
      const spreadY = fdy + 280;
      const fitZoomX = W / Math.max(spreadX, 200);
      const fitZoomY = H / Math.max(spreadY, 200);
      const fitZoom = Math.min(fitZoomX, fitZoomY);
      targetZoom = Math.min(targetZoom, Math.max(0.50, fitZoom));
      targetZoom *= zoomMul * stageZoom;
      g.camZoom += (targetZoom - g.camZoom) * 0.05;
      if (hitstop > 0) g.camZoom += 0.015;
      const midX = (f1.x + f2.x) / 2;
      const midY = ((f1.y + f2.y) / 2) - 70;
      const targetCamX = (midX - W / 2) * (1 - g.camZoom) * 0.35;
      const targetCamY = (midY - H / 2) * (1 - g.camZoom) * 0.35;
      g.camX += (targetCamX - g.camX) * 0.07;
      g.camY += (targetCamY - g.camY) * 0.07;
      if (settings.reducedMotion || settings.screenShake === false) { g.shakeX = 0; g.shakeY = 0; g.shakeMag = 0; shakeMag = 0; }
      else { g.shakeMag = Math.max(g.shakeMag, shakeMag); if (g.shakeMag > 0.3) { g.shakeX = (Math.random() - 0.5) * g.shakeMag; g.shakeY = (Math.random() - 0.5) * g.shakeMag; g.shakeMag *= 0.72; shakeMag = g.shakeMag; } else { g.shakeX = 0; g.shakeY = 0; g.shakeMag = 0; shakeMag = 0; } }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.restore();

      // Backdrop fills the full canvas in screen space (no camera transform) so it never leaves gaps
      drawBackground(ctx, W, H, f1.frame, mapId, activeEvent?.color);
      drawModeTint(ctx, W, H, gameMode);

      if (superImpactFlash > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255,255,255,${superImpactFlash * 0.5})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        superImpactFlash = Math.max(0, superImpactFlash - dt * 4);
      }

      ctx.save();
      ctx.translate(W / 2 + g.shakeX, H / 2 + g.shakeY);
      ctx.scale(g.camZoom, g.camZoom);
      ctx.translate(-W / 2 - g.camX, -H / 2 - g.camY);

      drawPlatforms(ctx, platforms, f1.frame, mapId);
      // Sandbox hazard zones + knockback items
      if (sbHazards) drawSBHazards(ctx, sbHazards, f1.frame);
      if (sbObjects) drawSBObjects(ctx, sbObjects, f1.frame);
      // KO blast zone indicators — red dotted lines (toggleable)
      if (settings.showBlastZones !== false) {
      ctx.save();
      ctx.strokeStyle = '#FF3333'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]);
      ctx.globalAlpha = 0.5 + Math.sin(f1.frame * 0.06) * 0.15;
      ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 8;
      const _largeMaps = new Set(['grandarena', 'skycitadel', 'colossalcoliseum', 'infiniteexpanse']);
      const _isLarge = _largeMaps.has(mapId);
      const BLAST_L = _isLarge ? -800 : -500, BLAST_R = _isLarge ? W + 800 : W + 500, BLAST_T = _isLarge ? -800 : -600, BLAST_B = _isLarge ? H + 600 : H + 450;
      ctx.beginPath(); ctx.moveTo(BLAST_L, BLAST_T); ctx.lineTo(BLAST_R, BLAST_T); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BLAST_L, BLAST_B); ctx.lineTo(BLAST_R, BLAST_B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BLAST_L, BLAST_T); ctx.lineTo(BLAST_L, BLAST_B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BLAST_R, BLAST_T); ctx.lineTo(BLAST_R, BLAST_B); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();
      }

      platforms.forEach(p => drawMaterialOverlay(ctx, p, f1.frame));
      // Visual indicator for erased platforms
      platforms.forEach(p => {
        if (p._deleted > 0) {
          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(f1.frame * 0.3) * 0.3;
          ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 3;
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.restore();
        }
      });

      const drawFighter = (f, slot) => {
        const effId = f.char.baseCharId || f.char.id;
        const renderChar = f.char.baseCharId ? { ...f.char, id: f.char.baseCharId } : f.char;
        const flashing = f.invincible > 0 && Math.floor(f.frame / 4) % 2 === 0;
        const crossoverColors = getCrossoverColor(f.char.id, equippedCrossovers);
        const renderColor = crossoverColors ? crossoverColors.primary : (getCharRenderColor(effId, equippedSkins) || f.char.color);
        if (!flashing) {
          ctx.save(); ctx.globalAlpha = 0.2 + Math.sin(f.frame * 0.07) * 0.05;
          ctx.fillStyle = renderColor; ctx.beginPath();
          ctx.ellipse(f.x, f.y + 3, 32, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
        const fScale = gameMode === 'brawl' ? 1.6 : 1;
        // Amber's Mirror Clone — translucent copy beside the fighter
        if (f._clone && !flashing) {
          ctx.save(); ctx.globalAlpha = 0.5;
          drawStickman(ctx, f._clone.x, f._clone.y, renderColor, f._clone.facing || f.facing, f._clone.frame, fScale, renderChar.isSpirit, 'idle', renderChar, null);
          ctx.globalAlpha = 0.6; ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
          drawOfflineNameTag(ctx, f._clone.x, f._clone.y - 72 * fScale, f.char);
          ctx.restore();
        }
        if (!flashing) {
          const skinParts = getSkinParts(effId, equippedSkins);
          const accs = getEquippedAccessories(botAccessoriesRef.current, effId);
          const skinColor = getCharRenderColor(effId, equippedSkins);
          // Behind layer (wings, capes, auras, orbiting effects)
          skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, fScale, effId, f.state, f.facing, f.powerActive, f.emote));
          accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, fScale, effId, f.state, f.facing, f.powerActive, f.emote));
        }
        // Shikigami — purely cosmetic floating companion (behind + above the fighter)
        drawShikigamiFollower(ctx, f, botShikigamiRef.current?.[effId], f.frame, fScale);
        if (!flashing) drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame, fScale, renderChar.isSpirit, f.state, renderChar, f.powerActive, false, f._stolenPowerColor, f.emote);
        if (!flashing) {
          const skinParts = getSkinParts(effId, equippedSkins);
          const accs = getEquippedAccessories(botAccessoriesRef.current, effId);
          const skinColor = getCharRenderColor(effId, equippedSkins);
          // Front layer (crowns, horns, headgear, gear)
          skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, fScale, effId, f.state, f.facing, f.powerActive, f.emote));
          accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, fScale, effId, f.state, f.facing, f.powerActive, f.emote));
          // Crossover custom parts (e.g. The King of Fire's crown of fire)
          getCrossoverParts(f.char.id, equippedCrossovers).filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, fScale, effId, f.state, f.facing, f.powerActive, f.emote));
        }
        if (f.attackData && f.state === 'attacking') {
          // Per-move crossover colors: signatures vs heavy attacks
          const moveColor = f.attackData.isHeavy ? crossoverColors?.heavy : crossoverColors?.sig;
          const crossoverAttackColor = getCrossoverAttackColor(f.char.id, equippedCrossovers);
          drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, moveColor || crossoverAttackColor || f.attackData.color || renderColor, f.attackData.isNormal, effId, f.char.power, f.powerActive);
        }
        if (f.attackData && f.state === 'superAttack') drawSuperEffect(ctx, f.x, f.y, crossoverColors?.super || renderColor, f.attackData.progress, f.char.superMove?.name, effId);
        if (f.hitEffects) f.hitEffects = f.hitEffects.filter(he => drawHitSparks(ctx, he.x, he.y, he.color, f.frame, he.spawnFrame));
        // Nametag (toggleable)
        if (settings.showNametags !== false) {
        const charLabel = gameMode === 'botbattle' ? `CPU ${slot}` : f.char.name;
        const equippedCx = equippedCrossovers[f.char.id] ? getCrossover(equippedCrossovers[f.char.id]) : null;
        const cxName = equippedCx ? equippedCx.name : null;
        ctx.save(); ctx.font = 'bold 12px Orbitron, sans-serif'; ctx.textAlign = 'center';
        const nw = ctx.measureText(charLabel).width + 16;
        const boxH = cxName ? 30 : 18;
        const boxY = cxName ? f.y - 94 : f.y - 84;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(f.x - nw / 2, boxY, nw, boxH, 4); ctx.fill();
        ctx.fillStyle = f.char.color; ctx.shadowColor = f.char.color; ctx.shadowBlur = 7;
        ctx.fillText(charLabel, f.x, cxName ? f.y - 80 : f.y - 70); ctx.shadowBlur = 0;
        if (cxName) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 7px Orbitron, sans-serif'; ctx.fillText(cxName.toUpperCase(), f.x, f.y - 70); }
        ctx.restore();
        }
        if (f.sigCooldown > 0) { const cdPct = 1 - f.sigCooldown / 28; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 10, 40, 4, 2); ctx.fill(); ctx.fillStyle = f.char.color; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 10, 40 * cdPct, 4, 2); ctx.fill(); }
        if (f.heavyCooldown > 0) { const cdPct = 1 - f.heavyCooldown / 32; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 16, 40, 3, 2); ctx.fill(); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.roundRect(f.x - 20, f.y + 16, 40 * cdPct, 3, 2); ctx.fill(); }
      };

      drawFighter(f1, 1); drawFighter(f2, 2);
      // Shapeshift switch flash effect
      [f1, f2].forEach(f => {
        if (f._shapeshiftFlash > 0) {
          ctx.save();
          ctx.globalAlpha = (f._shapeshiftFlash / 30) * 0.6;
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
          ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 20;
          ctx.beginPath(); ctx.arc(f.x, f.y - 30, 40 + (30 - f._shapeshiftFlash), 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
          f._shapeshiftFlash--;
        }
      });
      // Darken duplicate characters (same char + skin + accessories)
      {
        const _p1Sk = equippedSkins?.[p1Char] || null, _p2Sk = equippedSkins?.[p2Char] || null;
        const _p1Ac = botAccessoriesRef.current?.[p1Char] || null, _p2Ac = botAccessoriesRef.current?.[p2Char] || null;
        if (p1Char === p2Char && _p1Sk === _p2Sk && _p1Ac === _p2Ac) {
          ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(f2.x, f2.y - 30, 32, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }

      // Combo display
      const drawCombo = (combo, target, color) => {
        if (combo.count < 2 || combo.displayTimer <= 0) return;
        const alpha = Math.min(1, combo.displayTimer / 60);
        const scale = 1 + Math.max(0, (combo.displayTimer - 60) / 60) * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.floor(20 * scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = combo.count >= 5 ? '#FFD700' : color;
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
        ctx.fillText(`${combo.count} COMBO!`, target.x, target.y - 100);
        if (combo.count >= 5) {
          ctx.font = `bold ${Math.floor(12 * scale)}px Orbitron`;
          ctx.fillText('RACKING UP!', target.x, target.y - 120);
        }
        ctx.shadowBlur = 0; ctx.restore();
      };
      if (settings.comboCounter !== false) { drawCombo(combo1, f2, char1.color); drawCombo(combo2, f1, char2.color); }

      // Draw emote name labels (only in non-botbattle modes)
      if (gameMode !== 'botbattle') {
        [f1, f2].forEach(f => {
          if (f.emote) drawEmote(ctx, f.x, f.y, f.emote.id, f.emote.timer, f.emote.maxTimer, f.frame);
        });
      }

      // Draw power projectiles
      drawProjectiles(ctx, f1);
      drawProjectiles(ctx, f2);

      // Draw portal effect (Orange's Portalmaking)
      [f1, f2].forEach(f => {
        if (f._portalEffect && f._portalEffect.timer > 0) {
          const pe = f._portalEffect; const t = pe.timer / pe.maxTimer;
          const drawPortal = (x, y, alpha) => {
            ctx.save(); ctx.globalAlpha = alpha;
            for (let i = 0; i < 3; i++) {
              const r = 18 + i * 7 + Math.sin(f.frame * 0.3 + i) * 3;
              ctx.strokeStyle = `rgba(255,136,0,${alpha * (0.8 - i * 0.2)})`;
              ctx.lineWidth = 3 - i; ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 15;
              ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.65, f.frame * 0.1 + i, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.fillStyle = `rgba(255,200,100,${alpha * 0.25})`;
            ctx.beginPath(); ctx.ellipse(x, y, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0; ctx.restore();
          };
          drawPortal(pe.fromX, pe.fromY, t); drawPortal(pe.toX, pe.toY, t);
          pe.timer--;
        }
      });

      // Draw dash slash effect (Purple's Ninja)
      [f1, f2].forEach(f => {
        if (f._dashSlashEffect && f._dashSlashEffect.timer > 0) {
          const ds = f._dashSlashEffect; const t = ds.timer / ds.maxTimer;
          ctx.save();
          ctx.globalAlpha = t * 0.7; ctx.strokeStyle = f.char.color; ctx.lineWidth = 6 * t;
          ctx.shadowColor = f.char.color; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.moveTo(ds.fromX, ds.y); ctx.lineTo(ds.toX, ds.y); ctx.stroke();
          ctx.globalAlpha = t; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
          ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(ds.toX, ds.y, 35, ds.facing > 0 ? -Math.PI * 0.7 : Math.PI * 0.3, ds.facing > 0 ? Math.PI * 0.3 : Math.PI * 1.3);
          ctx.stroke();
          ctx.shadowBlur = 0; ctx.restore();
          ds.timer--;
        }
      });

      // Draw kill FX
      killFxEffects = killFxEffects.filter(kfx => {
        kfx.progress += dt * 1.2;
        return drawKillFX(ctx, kfx.x, kfx.y, kfx.fxId, kfx.progress, kfx.color, kfx.frame);
      });

      // Draw tokens in coin battle mode — larger, glowing, with value number
      if (gameMode === 'coin') {
        coins.forEach(c => {
          ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#FFAA00'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#553300'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
          ctx.fillText('◆', c.x, c.y + 3);
        });
      }
      ctx.restore();

      drawTimer(ctx, W, gameRef.current.timer);

      // Top-right: profile title + username (always visible)
      if (!settings.hideTopUsername && (p1Username || p1Title)) {
        ctx.save();
        ctx.textAlign = 'right';
        const ux = W - 16;
        let uy = 22;
        if (p1Title) {
          ctx.font = 'bold 12px Orbitron, sans-serif';
          ctx.fillStyle = '#FFD700';
          ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6;
          ctx.fillText(p1Title.toUpperCase(), ux, uy);
          ctx.shadowBlur = 0;
          uy += 18;
        }
        if (p1Username) {
          ctx.font = 'bold 14px Orbitron, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#000000'; ctx.shadowBlur = 4;
          ctx.fillText(p1Username, ux, uy);
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }

      if (gameRef.current.superFlash1) { const sf = gameRef.current.superFlash1; sf.progress += dt * 0.55; drawSuperFlash(ctx, W, H, sf.name, sf.color, sf.progress); if (sf.progress >= 1) gameRef.current.superFlash1 = null; }
      if (gameRef.current.superFlash2) { const sf = gameRef.current.superFlash2; sf.progress += dt * 0.55; drawSuperFlash(ctx, W, H, sf.name, sf.color, sf.progress); if (sf.progress >= 1) gameRef.current.superFlash2 = null; }

      // Bottom HUD — background bar hidden when stock boxes are hidden
      if (!settings.hideStockBoxes) {
        ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.fillRect(0, H - 80, W, 80);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, H - 80); ctx.lineTo(W, H - 80); ctx.stroke();
      }

      if (gameMode === 'brawl') {
        drawHpBar(ctx, W / 2 - 130, H - 66, f1.hp, f1.char.color, f1.char.name, f1.stocks);
        drawHpBar(ctx, W / 2 + 130, H - 66, f2.hp, f2.char.color, f2.char.name, f2.stocks);
      } else if (gameMode === 'hp') {
        drawHpBar(ctx, 280, H - 66, f1.hp, f1.char.color, f1.char.name, f1.stocks);
        drawHpBar(ctx, W - 280, H - 66, f2.hp, f2.char.color, f2.char.name, f2.stocks);
      } else {
        const p1Label = gameMode === 'botbattle' ? 'CPU 1' : f1.char.name;
        const p2Label = gameMode === 'botbattle' ? 'CPU 2' : f2.char.name;
        const p1Cx = equippedCrossovers[f1.char.id] ? getCrossover(equippedCrossovers[f1.char.id]) : null;
        const p2Cx = equippedCrossovers[f2.char.id] ? getCrossover(equippedCrossovers[f2.char.id]) : null;
        const p1Eff = getPowerEffect(f1.char.baseCharId || f1.char.id, f1.char);
        const p2Eff = getPowerEffect(f2.char.baseCharId || f2.char.id, f2.char);
        const p1Pwr = f1.powerCooldown <= 0 ? 1 : (1 - f1.powerCooldown / ((p1Eff?.cooldown || 5) * 60));
        const p2Pwr = f2.powerCooldown <= 0 ? 1 : (1 - f2.powerCooldown / ((p2Eff?.cooldown || 5) * 60));
        drawHealthBar(ctx, 30, H - 66, f1.damage, 240, f1.char.color, p1Label, f1.stocks, p1Cx?.name, p1Pwr, f1.superMeter / f1.maxSuper, 'left', false, settings.hideStockBoxes);
        drawHealthBar(ctx, W - 30, H - 66, f2.damage, 240, f2.char.color, p2Label, f2.stocks, p2Cx?.name, p2Pwr, f2.superMeter / f2.maxSuper, 'right', false, settings.hideStockBoxes);
      }

      if (!settings.hideStageAndMode) {
      const mapObj = STAGE_MAPS.find(m => m.id === mapId);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '11px Orbitron, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(mapId === 'custom' ? 'CUSTOM STAGE' : (mapObj?.name || ''), W / 2, H - 64);
      const modeObj = GAME_MODES.find(m => m.id === gameMode);
      ctx.fillStyle = 'rgba(255,215,0,0.5)'; ctx.font = '9px Orbitron'; ctx.fillText(modeObj?.name || '', W / 2, H - 50);
      }
      // FPS counter
      if (settings.showFPS) { ctx.fillStyle = 'rgba(0,255,0,0.6)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.fillText(`${Math.round(1 / Math.max(dt, 0.001))} FPS`, 10, 14); }

      // Shapeshift mode — team roster indicator (bottom center)
      if (shapeshiftMode) {
        const drawTeamIndicator = (f, x, align) => {
          if (!f.shapeshiftTeam) return;
          ctx.save(); ctx.textAlign = align;
          ctx.font = 'bold 8px Orbitron'; ctx.fillStyle = 'rgba(255,215,0,0.7)';
          ctx.fillText('SHAPESHIFT', x, H - 106);
          const totalW = f.shapeshiftTeam.length * 22;
          let startX = align === 'left' ? x : x - totalW;
          f.shapeshiftTeam.forEach((cid, i) => {
            const cd = getCharData(cid);
            const isActive = i === f.shapeshiftIndex;
            const cx = startX + i * 22;
            if (isActive) {
              ctx.fillStyle = cd.color || '#888';
              ctx.beginPath(); ctx.arc(cx + 10, H - 92, 8, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.stroke();
            } else {
              ctx.fillStyle = '#555555';
              ctx.beginPath(); ctx.arc(cx + 10, H - 92, 6, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = '#333333'; ctx.lineWidth = 1; ctx.stroke();
            }
          });
          ctx.restore();
        };
        drawTeamIndicator(f1, 30, 'left');
        drawTeamIndicator(f2, W - 30, 'right');
      }

      // Coin Battle — token totals displayed above each player's stock box
      if (gameMode === 'coin') {
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'left';
        ctx.shadowColor = '#000000'; ctx.shadowBlur = 4;
        ctx.fillText(`◆ ${coinsCollected1}`, 30, H - 92);
        ctx.textAlign = 'right';
        ctx.fillText(`◆ ${coinsCollected2}`, W - 30, H - 92);
        ctx.shadowBlur = 0;
      }

      // Kill feed
      killFeed = killFeed.filter(kf => {
        kf.timer--;
        if (kf.timer <= 0) return false;
        const alpha = Math.min(1, kf.timer / 60);
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        const text = `${kf.killer} killed ${kf.victim}`;
        const tw = ctx.measureText(text).width;
        const kY = gameMode === 'coin' ? 50 : 10;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - tw / 2 - 12, kY, tw + 24, 26);
        ctx.fillStyle = '#FFD700'; ctx.fillText(text, W / 2, kY + 18);
        ctx.restore();
        return true;
      });

      lastTime = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      if (gameRef.current) gameRef.current.running = false;
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      document.removeEventListener('visibilitychange', onWakeVis);
      releaseWakeLock();
    };
  }, [gameStarted, p1Char, p2Char, p2IsCPU, mapId, cpuDifficulty, gameMode, dummy]);

  // Suppress controller menu-nav while a match is actively running; re-enable
  // when paused or finished so the player can click buttons with the controller.
  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  return (
    <div className="el6-match-viewport relative flex flex-col items-center w-full">
      <canvas
        ref={canvasRef} width={W} height={H}
        className="el6-match-canvas"
      />
      {countdown > 0 && !settings.hideCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="absolute top-3 right-3 z-10 px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs">PAUSE (ESC)</button>
      {paused && !winner && <PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={gameMode === 'challenge' ? () => { pausedRef.current = false; setPaused(false); } : finishQuit} />}
      {winner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/78 rounded-lg gap-5">
          <span className="text-5xl font-heading text-accent drop-shadow-lg">{winner === 'Draw' ? 'DRAW!' : `${winner} WINS!`}</span>
          <div className="flex gap-3">
            <button onClick={() => { if (gameRef.current?.result && !lastResultAwardedRef.current) { onAward?.(gameRef.current.result); lastResultAwardedRef.current = true; } setWinner(null); setCountdown(3); setGameStarted(false); }} className="px-6 py-3 bg-secondary text-secondary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">REMATCH</button>
            <button onClick={() => { const base = gameRef.current?.result || { winner: null, p1Won: null, stats: { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0 }, p2Stats: { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0 } }; onEnd?.(base); }} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">BACK TO MENU</button>
          </div>
        </div>
      )}
    </div>
  );

  function finishQuit() {
    if (gameRef.current) {
      gameRef.current.running = false;
      const base = { winner: null, p1Won: null, stats: { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0 }, p2Stats: { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0 } };
      onEnd?.(base);
    }
  }
}

function drawHpBar(ctx, x, y, hp, color, name, stocks) {
  const max = 150; const w = 200; const pct = Math.max(0, hp) / max;
  const bx = x - w / 2;
  ctx.fillStyle = '#111122'; ctx.beginPath(); ctx.roundRect(bx, y, w, 14, 4); ctx.fill();
  const c = pct > 0.5 ? '#44FF88' : pct > 0.25 ? '#FFCC44' : '#FF4444';
  ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(bx, y, w * pct, 14, 4); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 10px Rajdhani'; ctx.textAlign = 'left';
  ctx.fillText(`${name}  HP ${Math.ceil(Math.max(0, hp))}`, bx + 4, y + 10);
  ctx.textAlign = 'right';   ctx.fillText('x' + Math.max(0, stocks), bx + w - 4, y + 10);
}

const MODE_TINTS = {
  regular: null, time: 'rgba(40,80,200,0.10)', hp: 'rgba(40,180,80,0.10)',
  superonly: 'rgba(255,200,40,0.12)', sudden: 'rgba(220,40,40,0.14)',
  ranked: 'rgba(150,40,220,0.12)',
};

function drawModeTint(ctx, w, h, mode) {
  const t = MODE_TINTS[mode];
  if (!t) return;
  ctx.fillStyle = t; ctx.fillRect(0, 0, w, h);
  if (mode) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'right';
    ctx.fillText(mode.toUpperCase(), w - 10, 60);
  }
}
