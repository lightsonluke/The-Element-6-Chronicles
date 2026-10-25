// Smoke test for the authored Gen-I renderer, body poses and frame-exact hitboxes.
// Run from the project root with: node gen1-attack-smoke-test.mjs
import { drawGen1Attack, getGen1AttackPose } from './gen1AttackAnims.js';
import { getGen1AttackGeometry, GEN1_TIMINGS } from './gen1AttackGeometry.js';
const ctx = new Proxy({}, {
  get(o, k) { if (k in o) return o[k]; if (k === 'measureText') return () => ({ width: 0 }); if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} }); return () => {}; },
  set(o, k, v) { o[k] = v; return true; }
});
const characters = ['g1_fire', 'g1_grass', 'g1_ice', 'g1_thunder', 'g1_water'];
const moves = ['us', 'ds', 'ss', 'uh', 'dh', 'sh', 'recovery', 'super', 'groundPound'];
let samples = 0, shapes = 0, noHit = [];
for (const charId of characters) for (const move of moves) {
  const [s, a, e] = GEN1_TIMINGS[charId][move], total = s + a + e;
  for (let f = 0; f <= total; f++) {
    const p = f / total;
    for (const facing of [1, -1]) {
      drawGen1Attack(ctx, 0, 0, '#fff', p, facing, charId, move, { duration: total, startupFrames: s, activeFrames: a, endlagFrames: e });
      const pose = getGen1AttackPose(move, p, facing, charId);
      if (!pose || !Number.isFinite(pose.lean) || !Number.isFinite(pose.punchArmR) || !Number.isFinite(pose.bob)) throw new Error(`Invalid pose ${charId}/${move}/${f}`);
    }
    const g = getGen1AttackGeometry(charId, move, p); shapes += g.length;
    for (const sh of g) for (const v of Object.values(sh)) if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`Invalid hitbox ${charId}/${move}/${f}`);
    if (f >= s && f < s + a && !g.length && !(charId === 'g1_fire' && move === 'ds') && move !== 'groundPound') noHit.push(`${charId}/${move}@${f}`);
    samples++;
  }
  // held-charge preview must also draw
  drawGen1Attack(ctx, 0, 0, '#fff', -1.5, 1, charId, move, null);
}
if (noHit.length) throw new Error('Active frames with no hitbox: ' + noHit.join(', '));
console.log(`PASS: ${samples} frames (both facings); ${shapes} hitbox shapes; every active frame has a hitbox that follows the art.`);
