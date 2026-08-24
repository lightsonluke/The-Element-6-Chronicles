// Sports jerseys — every sport has its own jersey for every character.
// Soccer/Volleyball/Baseball kits already exist in cosmetics.js.
// Basketball, Tennis, and Track have been removed from the game.

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';

const ALL_CHARS = [...HEROES, ...VILLAINS, ...GUARDIANS];

// No extra jerseys needed — basketball/tennis/track removed.
export const EXTRA_JERSEYS = [];

export const SPORT_TYPES = ['soccer_kit', 'volleyball_kit', 'baseball_kit'];

export const SPORT_LABELS = {
  soccer_kit: 'SOCCER',
  volleyball_kit: 'VOLLEYBALL',
  baseball_kit: 'BASEBALL',
};