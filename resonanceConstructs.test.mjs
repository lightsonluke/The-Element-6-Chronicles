import assert from 'node:assert/strict';
import {
  CONSTRUCTS, getConstructForCharacter, makeConstructCharacter,
  activateConstruct, deactivateConstruct, updateResonanceMatch,
  tryActivateResonanceConstruct, consumeConstructSuperInput, getConstructMoveProfile,
} from './resonanceConstructs.js';

assert.equal(Object.keys(CONSTRUCTS).length, 30, 'all 30 construct families should exist');

const moveKeys=['sideSignature','upSignature','downSignature','recovery','sideHeavy','upHeavy','downHeavy'];
const familyModes=new Set();
for (const spec of Object.values(CONSTRUCTS)) {
  for (const key of moveKeys) {
    const profile=getConstructMoveProfile(spec.family,key);
    assert.ok(profile.familyMode, `${spec.family}/${key} has authored choreography`);
    assert.ok(profile.arc>0 && profile.extension>0, `${spec.family}/${key} has valid motion values`);
    familyModes.add(profile.familyMode);
  }
}
assert.ok(familyModes.size>=20, 'weapon families use distinct physical choreography modes');
const roster = [
  { id: 'g1_fire', name: 'Fire Hero', color: '#f60', signatures: { side: { damage: 16 }, up: { damage: 14 }, down: { damage: 18 } }, heavyAttack: { damage: 20, knockback: 1.2 } },
  { id: 'custom_roster_member', name: 'Unlisted Character', color: '#abc', signatures: {}, heavyAttack: { damage: 18, knockback: 1.1 } },
];
for (const char of roster) {
  const first = getConstructForCharacter(char);
  assert.ok(CONSTRUCTS[first], `${char.name} has an assigned construct`);
  assert.equal(getConstructForCharacter(char), first, 'assignment is deterministic');
  const alt = makeConstructCharacter(char, 'test');
  assert.equal(alt._resonanceConstruct, first);
  assert.ok(alt.signatures.side.resonanceFamily);
  assert.ok(alt.heavyAttack.resonanceFamily);
  assert.ok(alt.upHeavy.resonanceFamily);
  assert.ok(alt.downHeavy.resonanceFamily);
  assert.ok(alt.recoveryAttack.resonanceFamily);
  assert.ok(alt.aerialAttack.resonanceFamily);
  assert.ok(alt.powerAttack.resonanceFamily);
  assert.equal(alt.heavyAttack.damage, char.heavyAttack.damage, 'construct does not multiply heavy damage');
  const f = { id: 'test', char, x: 100, y: 100, vx: 4, vy: -3, stocks: 3 };
  assert.equal(activateConstruct(f), true);
  assert.equal(f.resonanceActive, true);
  assert.equal(f.vx, 4); assert.equal(f.vy, -3);
  assert.equal(deactivateConstruct(f), true);
  assert.equal(f.char, char);
  assert.equal(f.resonanceActive, false);
}
const match = { frame: 0, orb: { x: 100, y: 100, age: 0, pulse: 0 }, spawnWait: null };
const fighter = { id: 'orb-test', char: roster[0], x: 100, y: 128, stocks: 3 };
const input = { sig: true };
assert.equal(tryActivateResonanceConstruct(match, fighter, input), true, 'Signature activates in range');
assert.equal(match.orb, null, 'successful activation consumes orb');
assert.equal(input.sig, false, 'activation consumes Signature input');
const next = { frame: 0, orb: null, spawnWait: 1 };
updateResonanceMatch(next, [{ stocks: 3, x: 100, y: 100 }], [], [{ x: 100, y: 300, width: 300 }], 1280, 720, 1/60);
assert.ok(next.orb, 'orb spawns when no living fighter has an active construct');
const superFighter = { id: 'dismiss-test', char: roster[0], x: 0, y: 0, stocks: 2, superMeter: 42, maxSuper: 100 };
activateConstruct(superFighter);
const superInput = { superMove: true };
assert.equal(consumeConstructSuperInput(superFighter, superInput), true, 'SUPER dismisses active construct');
assert.equal(superFighter.resonanceActive, false, 'construct is removed');
assert.equal(superInput.superMove, false, 'SUPER is consumed before super activation');
assert.equal(superFighter.superMeter, 42, 'dismissal leaves meter progress untouched');
console.log('Resonance Constructs tests passed.');
