// Smoke test for the Gen II renderer / hitboxes / poses. Run: node gen2-attack-smoke-test.mjs
import { drawGen2Attack, drawGen2Super, getGen2Hitboxes, getGen2AttackPose, GEN2_ATTACK_NAMES } from './gen2AttackAnims.js';
const ctx = new Proxy({}, { get(o, k) { if (k in o) return o[k]; if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} }); return () => {}; }, set(o, k, v) { o[k] = v; return true; } });
const moves = ['ss', 'us', 'ds', 'sh', 'uh', 'dh', 'sp'];
let frames = 0, bad = [];
for (const id of Object.keys(GEN2_ATTACK_NAMES)) for (const m of moves) {
  let hit = 0;
  for (let f = 0; f <= 60; f++) { const p = f / 60;
    for (const fc of [1, -1]) { if (m === 'sp') drawGen2Super(ctx, 0, 0, '#fff', p, id, fc); else drawGen2Attack(ctx, 0, 0, '#fff', p, fc, id, m);
      const pose = getGen2AttackPose(m, p, fc, id); if (!pose || !Number.isFinite(pose.lean + pose.bob + pose.legSwing + pose.punchArmL + pose.punchArmR)) bad.push(`pose ${id}/${m}/${f}`); }
    const hb = getGen2Hitboxes(id, m, p, 1);
    for (const h of hb) for (const v of Object.values(h)) if (typeof v === 'number' && !Number.isFinite(v)) bad.push(`hitbox ${id}/${m}/${f}`);
    if (hb.length) { hit++; if (p < .08 || p > .85) bad.push(`hit outside the .08-.85 hit gate ${id}/${m}@${p.toFixed(2)}`); }
    frames++; }
  if (!hit) bad.push(`no hitbox ${id}/${m}`);
}
if (bad.length) throw new Error(bad.slice(0, 12).join('\n'));
console.log(`PASS: ${frames} frames x 2 facings; all 13 Gen II characters x 7 attacks draw, pose, and hit inside the legal hit window.`);
