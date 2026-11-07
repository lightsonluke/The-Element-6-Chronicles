import { buildMove, SLOTS } from './mvBuild.js';
import { evalMove, activeBounds } from './mvMove.js';
import { computeLaunch, KB } from './mvKB.js';
import { V2MOVES } from './mvMoves.js';
let bad = 0; const rows = [];
for (const id of Object.keys(V2MOVES)) for (const sl of SLOTS) {
  const m = buildMove(id, sl); if (!m) { console.log('MISSING', id, sl); bad++; continue; }
  if (!m.phys) { console.log('NOT PHYS', id, sl); bad++; }
  const [s, a, e] = m.fr; let nan = false, activeFrames = 0; const stagesSeen = new Set(); let maxR = 0, maxExt = 0;
  for (let f = 0; f < m.total; f++) {
    let st = null;
    if (m.gp) st = f < s ? { dive: false, landed: false, pc: f / s } : { dive: false, landed: true, pc: 2 + (f - s) / (a + e) };
    else if (m.counter) st = { countered: true, pc: null };
    const r = evalMove(m, m.gp ? Math.min(f, s) : f, 1, st);
    if (/null|NaN/.test(JSON.stringify(r.pose.v))) nan = true;
    for (const sh of r.shapes) {
      if (/null|NaN/.test(JSON.stringify(sh))) nan = true;
      if (f >= s && f < s + a) { stagesSeen.add(sh.st || 0); if (sh.shape === 'capsule') { maxR = Math.max(maxR, sh.r); maxExt = Math.max(maxExt, Math.hypot(sh.x2 - sh.x1, sh.y2 - sh.y1)); } else maxR = Math.max(maxR, 99); }
    }
    if (f >= s && f < s + a && r.shapes.length) activeFrames++;
  }
  const isRc = sl === 'rc';
  if (nan) { console.log('NAN', id, sl); bad++; }
  if (isRc && activeFrames && id !== 'g2_itto' && id !== 'purple') { console.log('RC HAS HITBOX', id); bad++; }
  if (!isRc && !m.gp && activeFrames < 1) { console.log('NO ACTIVE SHAPES', id, sl); bad++; }
  if (m.stages && !isRc) for (let i = 0; i < m.stages.length; i++) if (!stagesSeen.has(i)) { console.log('STAGE NEVER LIVE', id, sl, i); bad++; }
  const b = (!m.gp && !isRc) ? activeBounds(m) : null;
  rows.push([id.padEnd(10), sl, m.fr.join('/'), 'dmg', m.dmg, 'r', maxR, 'ext', Math.round(maxExt), b ? `bbox ${Math.round(b.w)}x${Math.round(b.h)}` : '', m.stages ? 'stages ' + m.stages.length : '', m.counter ? 'COUNTER' : '']);
}
rows.forEach((r) => console.log(r.join(' ')));
console.log('problems', bad);
// hitstun / launch sanity
const att = { x: 0, facing: 1, y: 0 }, def = { x: 50, y: 0, grounded: true, damage: 60, char: { stats: { defense: 5 } } };
for (const id of Object.keys(V2MOVES)) for (const sl of ['us', 'ds', 'ss', 'uh', 'dh', 'sh', 'sp']) { const m = buildMove(id, sl); const n = m.stages ? m.stages.length : 1; const out = []; for (let i = 0; i < n; i++) { const L = computeLaunch(att, def, m, i, false, null); out.push(`v=${L.v0.toFixed(1)} vx=${L.vx.toFixed(1)} vy=${L.vy.toFixed(1)} hs=${L.hitstun}`); } console.log(id, sl, out.join(' | ')); }
