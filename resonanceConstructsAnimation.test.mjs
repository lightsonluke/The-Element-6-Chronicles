import assert from 'node:assert/strict';
import { drawAttackEffect } from './renderer.js';

const noop = () => {};
const gradient = { addColorStop: noop };
const ctx = new Proxy({}, {
  get(target, key) {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    if (key in target) return target[key];
    return noop;
  },
  set(target, key, value) { target[key] = value; return true; },
});

const families = [
  'blade','dual','katana','scythe','rapier','crescent','hammer','greatblade','axe','maul',
  'flail','spear','halberd','staff','trident','bow','cannons','blasters','disc','projector',
  'whip','tether','rings','greaves','core','claws','shield','tonfas','shards','bastion',
];
for (const family of families) {
  for (const progress of [-1.4, 0, .18, .42, .64, .86, 1]) {
    drawAttackEffect(ctx, 320, 240, {
      resonanceFamily: family, resonanceShape: family, characterVariation: .024,
      range: 150, sigType: progress < 0 ? 'up' : (progress < .3 ? 'side' : progress < .65 ? 'up' : 'down'),
      isHeavy: family === 'greatblade', isNormal: family === 'blasters',
    }, progress, 1, '#62eaff', false, 'animation-test', null, null);
  }
}
assert.equal(families.length, 30);
console.log('Resonance construct animation render smoke test passed for all 30 families and 7 animation phases.');
