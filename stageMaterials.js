// Material assignments per stage — each stage uses different materials
// to make them visually and mechanically distinct.
// Array index = platform index in MAP_PLATFORMS.

// Invisible physics pieces trace the supplied crystal island's underside.
// They are intentionally skipped by the renderer and keep the lower crevices
// and corner silhouette solid rather than using one oversized rectangle.
export const SPLIT_CITY_HULL_COLLIDERS = Object.freeze([
  { x: 177, y: 590, w: 55, h: 15, _forceSolid: true, _artCollisionOnly: true },
  { x: 205, y: 605, w: 65, h: 36, _forceSolid: true, _artCollisionOnly: true },
  { x: 248, y: 635, w: 82, h: 58, _forceSolid: true, _artCollisionOnly: true },
  { x: 305, y: 680, w: 92, h: 48, _forceSolid: true, _artCollisionOnly: true },
  { x: 375, y: 705, w: 115, h: 38, _forceSolid: true, _artCollisionOnly: true },
  { x: 465, y: 720, w: 105, h: 25, _forceSolid: true, _artCollisionOnly: true },
  { x: 550, y: 704, w: 110, h: 42, _forceSolid: true, _artCollisionOnly: true },
  { x: 640, y: 720, w: 105, h: 25, _forceSolid: true, _artCollisionOnly: true },
  { x: 725, y: 700, w: 115, h: 43, _forceSolid: true, _artCollisionOnly: true },
  { x: 820, y: 665, w: 105, h: 63, _forceSolid: true, _artCollisionOnly: true },
  { x: 900, y: 625, w: 95, h: 72, _forceSolid: true, _artCollisionOnly: true },
  { x: 970, y: 595, w: 80, h: 48, _forceSolid: true, _artCollisionOnly: true },
  { x: 1028, y: 590, w: 74, h: 16, _forceSolid: true, _artCollisionOnly: true },
]);

export const STAGE_MATERIALS = {
  // Split City uses its supplied image as the platform material. No generic
  // metal/normal overlay is permitted on top of the painted island.
  splitcity:        ['split_city_joined'],
  basic:            ['normal'],
  silvermansion:    ['metal', 'glass', 'glass', 'metal', 'glass'],
  controllerforest: ['grass', 'wood', 'wood', 'wood', 'wood', 'wood'],
  traininggrounds:  ['normal', 'wood', 'wood', 'normal'],
  voidplane:        ['crystal', 'crystal', 'crystal', 'crystal', 'crystal'],
  neonspire:        ['neon', 'neon', 'bounce', 'neon', 'bounce', 'neon'],
  sunsetridge:      ['wood', 'wood', 'wood', 'gold', 'gold', 'gold'],
  frozenlake:       ['ice', 'ice', 'glass', 'glass'],
  lavafalls:        ['metal', 'metal', 'metal', 'lava', 'lava', 'metal'],
  crystalcavern:    ['crystal', 'crystal', 'crystal', 'crystal', 'crystal', 'crystal'],
  skysanctuary:     ['snow', 'bounce', 'bounce', 'cloud'],
  underworld:       ['normal', 'spike', 'spike', 'normal', 'normal', 'normal'],
  auroraborealis:   ['ice', 'ice', 'ice', 'ice', 'diamond', 'diamond'],
  goldentemple:     ['gold', 'gold', 'gold', 'gold', 'gold'],
  stormpeak:        ['metal', 'metal', 'metal', 'metal', 'metal', 'metal'],
  toxicmarsh:       ['acid', 'quicksand', 'quicksand', 'quicksand'],
  cosmicvoid:       ['plasma', 'plasma', 'plasma', 'plasma', 'plasma', 'plasma'],
  emberforge:       ['metal', 'lava', 'lava', 'metal'],
  tidalreef:        ['azure', 'water', 'water', 'azure', 'ice', 'ice'],
  shadowrealm:      ['normal', 'normal', 'normal', 'tar', 'tar', 'tar'],
  dawnbreak:        ['solar', 'solar', 'solar', 'solar'],
  midnighttower:    ['metal', 'metal', 'metal', 'metal', 'metal', 'metal', 'metal'],
  junglecanopy:     ['wood', 'wood', 'wood', 'wood', 'grass', 'grass'],
  desertoasis:      ['sand', 'sand', 'sand', 'sand'],
  icepalace:        ['azure', 'ice', 'ice', 'ice', 'ice', 'diamond'],
  volcanocrater:    ['metal', 'metal', 'metal', 'lava', 'lava'],
  starlightmeadow:  ['grass', 'grass', 'grass', 'grass', 'diamond', 'diamond'],
  thunderdome:       ['metal', 'conveyor', 'conveyor', 'conveyor', 'conveyor', 'metal'],
  rainbowbridge:    ['neon', 'neon', 'neon', 'neon', 'crystal', 'crystal'],
  coralreef:        ['azure', 'azure', 'azure', 'water'],
  obsidianfield:    ['plasma', 'plasma', 'plasma', 'plasma', 'tar', 'tar'],
  solflare:         ['solar', 'solar', 'solar', 'solar'],
  mintgardens:      ['grass', 'grass', 'grass', 'grass', 'lime', 'lime'],
  cobaltmines:      ['metal', 'metal', 'metal', 'metal', 'metal', 'azure'],
  crimsonarena:     ['normal', 'normal', 'normal', 'normal'],
  phoenixroost:     ['gold', 'gold', 'lava', 'lava', 'gold'],
  nebulareach:      ['plasma', 'plasma', 'plasma', 'plasma', 'crystal', 'crystal'],
  emeraldcove:      ['grass', 'grass', 'grass', 'crystal'],
  grandarena:        ['metal', 'normal', 'normal', 'normal', 'normal', 'normal'],
  skycitadel:        ['snow', 'normal', 'cloud', 'bounce', 'cloud', 'normal', 'cloud'],
  colossalcoliseum: ['metal', 'normal', 'normal', 'normal', 'normal', 'metal', 'metal', 'metal'],
  infiniteexpanse:  ['crystal', 'normal', 'normal', 'normal', 'normal', 'crystal', 'crystal', 'crystal', 'crystal', 'crystal'],
  opalcave:         ['normal', 'diamond', 'metal'],
};

// Apply materials to a stage's platforms based on the material assignment.
// Returns a NEW array — does not mutate the original MAP_PLATFORMS.
export function applyStageMaterials(platforms, mapId) {
  const mats = STAGE_MATERIALS[mapId];
  if (!mats) return platforms;
  return platforms.map((p, i) => {
    const mat = mats[i] || 'normal';
    const result = { ...p, material: mat };
    if (mat === 'conveyor') {
      result.conveyorDir = p.x + p.w / 2 < 640 ? 1 : -1;
    }
    return result;
  });
}
