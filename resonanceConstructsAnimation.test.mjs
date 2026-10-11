import assert from 'node:assert/strict';
import { drawAttackEffect, drawConstructWeapon } from './renderer.js';
import { RESONANCE_MOVE_PROFILES } from './resonanceConstructs.js';

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
  const moves = [
    ['sideSignature','side'], ['upSignature','up'], ['downSignature','down'],
    ['recovery','recovery'], ['sideHeavy','sideHeavy'], ['upHeavy','upHeavy'], ['downHeavy','downHeavy'],
  ];
  for (const [resonanceMoveKey, sigType] of moves) {
    assert.ok(RESONANCE_MOVE_PROFILES[resonanceMoveKey], `missing move profile: ${resonanceMoveKey}`);
    for (const progress of [-1.4, 0, .18, .42, .64, .86, 1]) {
      drawAttackEffect(ctx, 320, 240, {
        resonanceFamily: family, resonanceShape: family, characterVariation: .024,
        resonanceMoveKey, resonanceAnimation: RESONANCE_MOVE_PROFILES[resonanceMoveKey], progress: Math.max(0, Math.min(1, progress)), range: 150, sigType,
        isHeavy: resonanceMoveKey.endsWith('Heavy'), isNormal: false,
      }, progress, 1, '#62eaff', false, 'animation-test', null, null);
      drawConstructWeapon(ctx, { resonanceActive: true, resonanceConstruct: family, char: { resonanceFamily: family }, x: 320, y: 240, facing: 1, frame: 12, attackTimer: 10, attackData: { resonanceMoveKey, resonanceAnimation: RESONANCE_MOVE_PROFILES[resonanceMoveKey], progress: Math.max(0, Math.min(1, progress)) } }, 1);
    }
  }
}
assert.equal(families.length, 30);
console.log('Resonance construct draw smoke test passed for all 30 weapon families × 7 attack slots × 7 timing samples.');
