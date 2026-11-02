// mvBuild.js — builds (and caches) the runtime Move object for a character + slot.
import { ROSTER } from './mvRoster.js';
import { ARCH } from './mvArch.js';

const cache = new Map();
export const SLOTS = ['us', 'ds', 'ss', 'uh', 'dh', 'sh', 'rc', 'sp', 'gp'];
export function hasRoster(charId) { return !!ROSTER[charId]; }

export function buildMove(charId, slot) {
  const key = charId + '.' + slot;
  let m = cache.get(key);
  if (m) return m;
  const rc = ROSTER[charId]; if (!rc) return null;
  const rec = rc.moves[slot]; if (!rec) return null;
  // Keep authored startup and active frames. Shorten only recovery so attacks
  // retain their original timing but become actionable sooner afterward.
  const [authoredStartup, active, authoredEndlag] = rec.fr;
  const startup = authoredStartup;
  const endlagMul = slot === 'sp' ? 0.50 : ['uh', 'dh', 'sh'].includes(slot) ? 0.62 : 0.68;
  const endlag = Math.min(authoredEndlag, Math.max(2, Math.floor(authoredEndlag * endlagMul)));
  const fr = [startup, active, endlag];
  let def = ARCH[rec.arch];
  if (typeof def === 'function') def = def({ fr, skin: rc.skin, mods: rec.mods, charId, reach: rc.reach });
  if (!def) { console.warn('[mv] missing archetype', rec.arch); return null; }
  // envelope caps: keep each move inside the volume your design doc specifies for its slot
  const CAP = { ss: { len: 76, r: 22 }, sh: { len: 100, r: 25, arcR: 0.8 }, uh: { len: 84 }, us: { len: 66 } }[slot];
  const fx = CAP ? def.fx.map((el) => {
    if (el.k === 'blade') { const L = Array.isArray(el.len) ? el.len.slice() : [el.len, el.len]; const r = Array.isArray(el.r) ? el.r.slice() : [el.r, el.r];
      return { ...el, len: [Math.min(L[0], CAP.len), Math.min(L[1], CAP.len)], r: CAP.r ? [Math.min(r[0], CAP.r), Math.min(r[1], CAP.r)] : r }; }
    if (el.k === 'arc' && CAP.arcR) return { ...el, R: (Array.isArray(el.R) ? el.R : [el.R, el.R]).map((v) => v * CAP.arcR) };
    if (el.k === 'col' && (slot === 'uh')) return { ...el, y1: Math.max(el.y1, -160) };
    return el; }) : def.fx;
  m = { id: key, charId, slot, arch: rec.arch, fr, dmg: rec.dmg, mods: rec.mods, skin: rc.skin, col: rc.col, reach: rc.reach, name: rc.name,
    keys: def.keys, fx, drive: def.drive || [], stages: def.stages || null, gp: !!def.gp, tell: def.tell || null, marks: def.marks || null, decoys: def.decoys || null, ghost: def.ghost || null, tp: def.tp || null, total: fr[0] + fr[1] + fr[2], def };
  cache.set(key, m);
  return m;
}
