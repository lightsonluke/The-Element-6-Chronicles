// Maps each villain to the stage that best fits their lore for story battles
import { STAGE_MAPS } from './renderer.js';

const VILLAIN_STAGE_MAP = {
  corpent:        'splitcity',
  magneto:        'silvermansion',
  willow:         'controllerforest',
  cable:          'splitcity',
  snodvor:        'silvermansion',
  kirsten:        'traininggrounds',
  volt:           'splitcity',
  temple:         'voidplane',
  nightmare:      'voidplane',
  hazel:          'controllerforest',
  whami:          'silvermansion',
  controller:     'voidplane',
  evil:           'voidplane',
};

// Platform layouts per stage for story battles
export const STORY_STAGE_PLATFORMS = {
  splitcity: [
    { x: 20,  y: 480, w: 920, h: 42 },
    { x: 80,  y: 340, w: 280, h: 18 },
    { x: 600, y: 340, w: 280, h: 18 },
    { x: 340, y: 200, w: 280, h: 18 },
  ],
  silvermansion: [
    { x: 20,  y: 480, w: 920, h: 42 },
    { x: 60,  y: 330, w: 220, h: 18 },
    { x: 680, y: 330, w: 220, h: 18 },
    { x: 360, y: 190, w: 280, h: 18 },
    { x: 430, y: 340, w: 140, h: 18 },
  ],
  controllerforest: [
    { x: 20,  y: 480, w: 920, h: 42 },
    { x: 80,  y: 360, w: 220, h: 18 },
    { x: 660, y: 360, w: 220, h: 18 },
    { x: 390, y: 230, w: 220, h: 18 },
    { x: 260, y: 310, w: 160, h: 18 },
    { x: 540, y: 310, w: 160, h: 18 },
  ],
  traininggrounds: [
    { x: 20,  y: 480, w: 920, h: 42 },
    { x: 100, y: 350, w: 280, h: 18 },
    { x: 580, y: 350, w: 280, h: 18 },
    { x: 340, y: 210, w: 280, h: 18 },
  ],
  voidplane: [
    { x: 20,  y: 480, w: 920, h: 42 },
    { x: 50,  y: 310, w: 200, h: 18 },
    { x: 710, y: 310, w: 200, h: 18 },
    { x: 360, y: 180, w: 280, h: 18 },
    { x: 300, y: 360, w: 380, h: 18 },
  ],
};

export function getVillainStage(villainId) {
  const id = VILLAIN_STAGE_MAP[villainId] || 'traininggrounds';
  return { id, platforms: STORY_STAGE_PLATFORMS[id] || STORY_STAGE_PLATFORMS.traininggrounds, map: STAGE_MAPS.find(m => m.id === id) || STAGE_MAPS[0] };
}