import assert from 'node:assert/strict';
import { getConstructMoveProfile, getConstructAssignments, RESONANCE_MOVE_PROFILES } from './resonanceConstructs.js';

const sevenMoves = ['sideSignature','upSignature','downSignature','recovery','sideHeavy','upHeavy','downHeavy'];
const authoredCharacters = ['Fire Hero','Water Hero','Grass Hero','Ice Hero','Thunder Hero','Life','Mercy','Death'];
for (const character of authoredCharacters) {
  const family = ({'Fire Hero':'greatblade','Water Hero':'trident','Grass Hero':'shards','Ice Hero':'spear','Thunder Hero':'cannons','Life':'core','Mercy':'shield','Death':'scythe'})[character];
  for (const move of sevenMoves) {
    const p = getConstructMoveProfile(family, move, character);
    assert.ok(p.motion, `${character}/${move}: missing motion`);
    assert.ok(p.familyMode, `${character}/${move}: missing family mode`);
    assert.ok(p.impact, `${character}/${move}: missing impact profile`);
    assert.ok(Number.isFinite(p.arc) && Number.isFinite(p.extension), `${character}/${move}: invalid trajectory`);
  }
}
for (const [character, construct] of Object.entries(getConstructAssignments())) {
  assert.ok(character && construct, 'empty assignment');
}
for (const move of sevenMoves) assert.ok(RESONANCE_MOVE_PROFILES[move], `missing generic fallback ${move}`);
console.log(`Construct profile audit passed: ${authoredCharacters.length} explicitly authored characters × 7 move slots; ${Object.keys(getConstructAssignments()).length} fixed assignments; all 7 fallback slots present.`);
