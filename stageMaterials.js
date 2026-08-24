// Material assignments per stage — each stage uses different materials
// to make them visually and mechanically distinct.
// Array index = platform index in MAP_PLATFORMS.

export const STAGE_MATERIALS = {
  splitcity:        ['metal', 'normal', 'normal', 'normal'],
  basic:            ['normal'],
  silvermansion:    ['metal', 'glass', 'glass', 'metal', 'glass'],
  controllerforest: ['grass', 'wood', 'wood', 'wood', 'wood', 'wood'],
  traininggrounds:  ['normal', 'wood', 'wood', 'normal'],
  voidplane:        ['crystal', 'crystal', 'crystal', 'crystal', 'crystal'],
  neonspire:        ['neon', 'neon', 'bounce', 'neon', 'bounce', 'neon'],
  sunsetridge:      ['wood', 'wood', 'wood', 'gold', 'gold', 'gold'],
  frozenlake:       ['ice', 'ice', 'ice', 'ice'],
  lavafalls:        ['lava', 'lava', 'metal', 'metal', 'metal', 'lava'],
  crystalcavern:    ['crystal', 'crystal', 'crystal', 'crystal', 'crystal', 'crystal'],
  skysanctuary:     ['cloud', 'bounce', 'cloud', 'bounce'],
  underworld:       ['spike', 'spike', 'normal', 'normal', 'normal', 'spike'],
  auroraborealis:   ['ice', 'ice', 'ice', 'ice', 'diamond', 'diamond'],
  goldentemple:     ['gold', 'gold', 'gold', 'gold', 'gold'],
  stormpeak:        ['metal', 'metal', 'metal', 'metal', 'metal', 'metal'],
  toxicmarsh:       ['acid', 'quicksand', 'quicksand', 'quicksand'],
  cosmicvoid:       ['plasma', 'plasma', 'plasma', 'plasma', 'plasma', 'plasma'],
  emberforge:       ['lava', 'lava', 'lava', 'lava'],
  tidalreef:        ['water', 'water', 'water', 'water', 'ice', 'ice'],
  shadowrealm:      ['tar', 'tar', 'tar', 'tar', 'tar', 'tar'],
  dawnbreak:        ['solar', 'solar', 'solar', 'solar'],
  midnighttower:    ['metal', 'metal', 'metal', 'metal', 'metal', 'metal', 'metal'],
  junglecanopy:     ['wood', 'wood', 'wood', 'wood', 'grass', 'grass'],
  desertoasis:      ['sand', 'sand', 'sand', 'sand'],
  icepalace:        ['ice', 'ice', 'ice', 'ice', 'ice', 'diamond'],
  volcanocrater:    ['lava', 'lava', 'lava', 'lava', 'lava'],
  starlightmeadow:  ['grass', 'grass', 'grass', 'grass', 'diamond', 'diamond'],
  thunderdome:       ['metal', 'conveyor', 'conveyor', 'conveyor', 'conveyor', 'metal'],
  rainbowbridge:    ['neon', 'neon', 'neon', 'neon', 'crystal', 'crystal'],
  coralreef:        ['water', 'water', 'water', 'water'],
  obsidianfield:    ['tar', 'tar', 'tar', 'tar', 'tar', 'tar'],
  solflare:         ['solar', 'solar', 'solar', 'solar'],
  mintgardens:      ['grass', 'grass', 'grass', 'grass', 'lime', 'lime'],
  cobaltmines:      ['metal', 'metal', 'metal', 'metal', 'metal', 'azure'],
  crimsonarena:     ['normal', 'normal', 'normal', 'normal'],
  phoenixroost:     ['lava', 'lava', 'lava', 'lava', 'gold'],
  nebulareach:      ['plasma', 'plasma', 'plasma', 'plasma', 'crystal', 'crystal'],
  emeraldcove:      ['grass', 'grass', 'grass', 'crystal'],
  grandarena:        ['metal', 'normal', 'normal', 'normal', 'normal', 'normal'],
  skycitadel:        ['cloud', 'bounce', 'cloud', 'bounce', 'cloud', 'bounce', 'cloud'],
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