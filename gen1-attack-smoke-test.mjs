// Lightweight smoke test for the authored Gen-I renderer and local hitbox geometry.
// Run from the project root with: node gen1-attack-smoke-test.mjs
import { drawGen1Attack, getGen1AttackPose } from './gen1AttackAnims.js';
import { getGen1AttackGeometry, GEN1_TIMINGS } from './gen1AttackGeometry.js';
const ctx = new Proxy({}, {
  get(o, k) { if (k in o) return o[k]; if (k === 'measureText') return () => ({ width: 0 }); return () => {}; },
  set(o, k, v) { o[k] = v; return true; }
});
const characters = ['g1_fire', 'g1_grass', 'g1_ice', 'g1_thunder', 'g1_water'];
const moves = ['us', 'ds', 'ss', 'uh', 'dh', 'sh', 'recovery', 'super', 'groundPound'];
const progressPoints = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1];
let samples = 0, hitboxShapes = 0;
for (const charId of characters) for (const move of moves) for (const progress of progressPoints) {
  drawGen1Attack(ctx, 0, 0, '#fff', progress, 1, charId, move, { duration: 100, startupFrames: 10, activeFrames: 10, endlagFrames: 80 });
  const pose = getGen1AttackPose(move, progress, 1, charId);
  if (!pose || !Number.isFinite(pose.lean)) throw new Error(`Invalid pose: ${charId}/${move}/${progress}`);
  const shapes = getGen1AttackGeometry(charId, move, progress);
  hitboxShapes += shapes.length;
  for (const shape of shapes) for (const value of Object.values(shape)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`Invalid hitbox: ${charId}/${move}/${progress}`);
  }
  samples++;
}
if (Object.keys(GEN1_TIMINGS).length !== 5) throw new Error('Expected timing profiles for all five Gen-I heroes.');
console.log(`PASS: ${samples} animation/geometry samples; ${hitboxShapes} finite hitbox shapes; 5 hero timing profiles.`);
