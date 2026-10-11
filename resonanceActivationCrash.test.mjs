import assert from 'node:assert/strict';
import { activateConstruct, deactivateConstruct, tryActivateResonanceConstruct } from './resonanceConstructs.js';

const char = {
  id: 'fire_hero', name: 'Fire Hero', color: '#f60',
  signatures: {
    side: { name: 'Side', damage: 12, range: 120, duration: 20, type: 'dash' },
    up: { name: 'Up', damage: 12, range: 120, duration: 20, type: 'launch' },
    down: { name: 'Down', damage: 12, range: 120, duration: 20, type: 'groundSlam' },
  },
  heavyAttack: { name: 'Heavy', damage: 16, range: 140, duration: 25, type: 'dash' },
  lightAttack: { name: 'Light', damage: 8, range: 90, duration: 12, type: 'dash' },
};
const fighter = { id: 'p1', char, x: 100, y: 100, stocks: 3, hp: 450 };
const match = { orb: { x: 100, y: 72, targetY: 72, age: 1, pulse: 0 }, spawnWait: null };
const input = { sig: true, superMove: false };
assert.equal(tryActivateResonanceConstruct(match, fighter, input), true);
assert.equal(fighter.resonanceActive, true);
assert.ok(fighter.char.resonanceFamily, 'construct family must be present on the live character');
assert.equal(match.orb, null);
assert.equal(input.sig, false);
assert.equal(deactivateConstruct(fighter), true);
assert.equal(fighter.char, char);
console.log('Construct orb activation/deactivation regression test passed.');
