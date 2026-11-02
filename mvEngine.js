// mvEngine.js — runtime glue between the move engine and the fighter simulation / renderer.
//   mvTick       once per attacking frame: frame counter, phases (ground-pound dive/landing), drive, stage, timers
//   mvHitShapes  world-space collision shapes for the CURRENT frame  (identical geometry to the art)
//   mvCheck      hit test (non-super moves consume their hitbox on first contact; supers hit once per stage)
//   mvChoreo     pose override for the renderer
import { buildMove, hasRoster } from './mvBuild.js';
import { evalMove } from './mvMove.js';
import { phaseCoord, clamp, GUARD } from './mvCore.js';
import { setSlotAverages, computeLaunch } from './mvKB.js';
import { ROSTER } from './mvRoster.js';

let _avgDone = false;
function ensureAverages() {
  if (_avgDone) return; _avgDone = true;
  const sum = {}, cnt = {};
  for (const c of Object.values(ROSTER)) for (const [k, v] of Object.entries(c.moves)) { sum[k] = (sum[k] || 0) + v.dmg; cnt[k] = (cnt[k] || 0) + 1; }
  const avg = {}; for (const k of Object.keys(sum)) avg[k] = sum[k] / cnt[k];
  setSlotAverages(avg);
}

export function charKey(fighter) {
  const c = fighter && fighter.char; if (!c) return null;
  if (hasRoster(c.id)) return c.id;
  if (c.baseCharId && hasRoster(c.baseCharId)) return c.baseCharId;
  return null;
}

// Which move slot is this attackData?  null => not an engine move (plain normals, powers, ...)
export function slotOf(ad) {
  if (!ad || ad.isNormal || ad.isPower) return null;
  if (ad.isSuper || ad.sigType === 'super') return 'sp';
  if (ad.isGroundPound || ad.type === 'groundPound') return 'gp';
  if (ad.isRecovery || ad.type === 'recovery') return 'rc';
  const st = ad.sigType || 'side';
  if (ad.isHeavy) return (st === 'upHeavy' || st === 'upheavy' || st === 'aerialHeavy' || st === 'aerial' || ad.isAerialHeavy || (st === 'up' && ad.isHeavy)) ? 'uh' : (st === 'downHeavy' || st === 'down') ? 'dh' : 'sh';
  if (st === 'up' || st === 'aerial' || st === 'upSignature') return 'us';
  if (st === 'down' || st === 'downNormal' || st === 'downSignature') return 'ds';
  if (st === 'side' || st === 'sideSignature') return 'ss';
  return null;
}

function init(fighter, ad) {
  ensureAverages();
  const key = charKey(fighter); if (!key) return false;
  const slot = slotOf(ad); if (!slot) return false;
  // Purple's original Shadow Dash, Smoke Drop, and Rising Shadow stay on the
  // legacy character data and animation path; his other moves use the Move Engine.
  if ((fighter.char?.id === 'purple' || fighter.char?.baseCharId === 'purple') &&
      !fighter.resonanceActive && ['us', 'sh', 'dh'].includes(slot)) return false;
  const m = buildMove(key, slot); if (!m) return false;
  const [s, a, e] = m.fr;
  ad._mv = { m, f: -1, phase: 'run', diveF: 0, landed: false, dive: false, curStage: 0, did: {}, ghost: 0, ox: fighter.x, oy: fighter.y, total: s + a + e, sc: fighter.renderScale || 1 };
  ad.name = ad.name && !ad.mvKeepName ? ad.name : ad.name;
  ad.damage = m.dmg; ad._mvBaseDmg = m.dmg;
  ad.duration = s + a + e; ad.progress = 0;
  ad.range = Math.max(ad.range || 0, m.slot === 'sp' ? (m.reach === 'L' ? 700 : 260) : 140);
  ad.mvSlot = slot;
  if (slot === 'sp') { ad.multiHitStages = true; ad._mvMulti = true; }
  ad.isGroundPound = slot === 'gp'; ad.isRecovery = slot === 'rc';
  fighter.attackTimer = s + a + e;
  if (slot === 'rc') { fighter.vy = Math.max(fighter.vy, -1); }
  return true;
}

export function mvActive(fighter) { const ad = fighter && fighter.attackData; return !!(ad && ad._mv); }

// returns true when the engine owns this attack frame
export function mvTick(fighter) {
  const ad = fighter.attackData; if (!ad) return false;
  if (ad.holding || ad.type === 'attackHold') return false;
  if (ad._mv === undefined) { if (!init(fighter, ad)) ad._mv = false; }
  const S = ad._mv; if (!S) return false;
  const m = S.m, [s, a, e] = m.fr, face = fighter.facing || 1;
  S.f += 1;
  if (m.gp) {
    if (S.phase === 'run' && S.f >= s) { S.phase = fighter.grounded ? 'land' : 'dive'; if (S.phase === 'dive') { S.dive = true; fighter.vy = 15; } else { S.landed = true; } S.f = s; }
    if (S.phase === 'run') { fighter.vy = Math.min(fighter.vy, 1.2) * 0.5; fighter.vx *= 0.82; }
    else if (S.phase === 'dive') {
      S.f = s; S.diveF += 1; fighter.vy = Math.max(fighter.vy, 15); if (S.diveF > 1) S.dive = true;
      const g = m.drive.find((d) => d.vx !== undefined); if (g) fighter.vx = face * g.vx * (S.diveF < 2 ? 0.5 : 1);
      if (fighter.grounded && S.diveF > 1) { S.phase = 'land'; S.landed = true; S.dive = false; S.f = s; fighter.vx = 0; }
    }
    S.pc = S.phase === 'run' ? clamp(S.f / Math.max(1, s)) : S.phase === 'dive' ? 1 + Math.min(0.98, S.diveF / 10) : 2 + clamp((S.f - s) / Math.max(1, a + e));
    S.st = { dive: S.phase === 'dive', landed: S.landed, pc: S.pc };
    if (S.phase === 'dive') fighter.attackTimer = (a + e) + 2;                      // timer is frozen while the dive is held
  } else {
    S.pc = phaseCoord(S.f, m.fr); S.st = null;
    for (let i = 0; i < m.drive.length; i++) {
      const d = m.drive[i]; if (S.pc < d.at[0] || S.pc >= d.at[1]) continue;
      if (d.vx !== undefined) fighter.vx = face * d.vx * (fighter.grounded ? 1.14 : 1);
      if (d.vy !== undefined && !S.did[i]) { S.did[i] = 1; fighter.vy = m.slot === 'rc' ? Math.max(-14, d.vy * 1.25) : d.vy; fighter.grounded = false; }
      if (d.tpy !== undefined && !S.did['t' + i]) { S.did['t' + i] = 1; fighter.y += d.tpy; fighter.vy = 0; }
    }
    if (m.slot === 'sp' && m.tp && !S.did.tp && S.pc >= m.tp.at) { S.did.tp = 1; fighter.x += face * (m.tp.dx || 0); }
    fighter.attackTimer = Math.max(1, S.total - S.f);
  }
  S.ghost = m.ghost && S.pc >= m.ghost[0] && S.pc < m.ghost[1] ? 1 : 0;
  // supers: which stage is live right now (time based, so one hit per stage per target)
  if (m.slot === 'sp') { const u = clamp((S.f - s + 1) / a); let cs = 0; for (const el of m.fx) { const w = el.u || [0, 1]; if (u >= w[0] - 1e-6 && u <= w[1] + 1e-6) cs = Math.max(cs, el.st || 0); } S.curStage = cs; }
  ad.progress = clamp(S.f / S.total); ad.duration = S.total;
  S.cache = null;
  return true;
}

// current frame: local result + world shapes
function frameResult(fighter) {
  const S = fighter.attackData._mv; if (S.cache) return S.cache;
  const m = S.m, t = S.m.gp ? m.fr[0] : S.f;
  const res = evalMove(m, t, S.sc, S.st);
  S.cache = res; return res;
}
export function mvLocalResult(fighter) { return frameResult(fighter); }

function toWorld(fighter, sh) {
  const f = fighter.facing || 1, X = fighter.x, Y = fighter.y;
  switch (sh.shape) {
    case 'capsule': return { shape: 'capsule', x1: X + f * sh.x1, y1: Y + sh.y1, x2: X + f * sh.x2, y2: Y + sh.y2, r: sh.r, st: sh.st };
    case 'circle': return { shape: 'circle', x: X + f * sh.x, y: Y + sh.y, r: sh.r, st: sh.st };
    case 'box': return { shape: 'box', x: X + f * sh.x, y: Y + sh.y, w: sh.w, h: sh.h, st: sh.st };
    case 'polygon': return { shape: 'polygon', points: sh.points.map((p) => [X + f * p[0], Y + p[1]]), st: sh.st };
  }
  return null;
}
export function mvHitShapes(fighter) {
  const ad = fighter.attackData; if (!ad || !ad._mv) return [];
  const S = ad._mv, m = S.m, [s, a] = m.fr;
  if (S.f < s || S.f >= s + a) return [];
  let shapes = frameResult(fighter).shapes;
  if (m.slot === 'sp') shapes = shapes.filter((sh) => (sh.st || 0) === S.curStage);
  return shapes.map((sh) => toWorld(fighter, sh)).filter(Boolean);
}

// ---- pose override for the renderer ----
export function mvChoreo(fighter, attackData) {
  const ad = attackData || fighter.attackData; if (!ad || !ad._mv) return null;
  const S = ad._mv, m = S.m, p = S.m.gp ? S.pc : phaseCoord(Math.max(0, S.f), m.fr);
  const res = evalMove(m, m.gp ? m.fr[0] : Math.max(0, S.f), S.sc, m.gp ? S.st : null);
  const ease = S.f < 3 && !m.gp ? clamp((S.f + 1) / 3) : 1;                       // eases in from locomotion over the first 3 frames only
  return { v: res.pose.v, rot: res.pose.rot, dx: res.pose.dx, dy: res.pose.dy, blend: ease, ghost: S.ghost };
}
export { hasRoster };

// damage share of the stage currently landing (supers only; every other move deals its full baseline once)
export function mvStageShare(attacker) {
  const S = attacker.attackData && attacker.attackData._mv; if (!S) return 1;
  const st = S.m.stages; if (!st || S.m.slot !== 'sp') return 1;
  const tot = st.reduce((a, b) => a + b.w, 0) || 1;
  return (st[Math.min(st.length - 1, S.curStage | 0)].w || 0) / tot;
}
export function mvLaunchFor(attacker, defender) {
  const S = attacker.attackData._mv;
  return computeLaunch(attacker, defender, S.m, S.curStage | 0, !!S.landed);
}

// ---- rendering entry points (called from renderer.drawStickman) ----
import { paintViz, paintSuperBack, paintSuperFront } from './mvArt.js';
function geomTime(S) { const m = S.m, [s, a] = m.fr; if (m.gp) return { tg: s, tArt: S.landed ? s + (S.f - s) : (S.dive ? s : S.f) }; return { tg: S.f >= s ? Math.min(S.f, s + a - 1) : Math.max(0, S.f), tArt: S.f }; }
export function mvPaintBack(ctx, facing, ad) {
  const S = ad && ad._mv; if (!S || S.m.slot !== 'sp') return;
  ctx.save(); ctx.scale(facing || 1, 1); paintSuperBack(ctx, S.m, S.f); ctx.restore();
}
export function mvPaintFront(ctx, facing, ad) {
  const S = ad && ad._mv; if (!S) return;
  const m = S.m, { tg, tArt } = geomTime(S);
  const res = evalMove(m, tg, S.sc, S.st), now = evalMove(m, m.gp ? m.fr[0] : Math.max(0, S.f), S.sc, m.gp ? S.st : null);
  ctx.save(); ctx.scale(facing || 1, 1);
  paintViz(ctx, res.viz, m, tArt, { anchorPt: now.J.near.hand, dive: S.dive, landed: S.landed });
  if (m.slot === 'sp') paintSuperFront(ctx, m, S.f, { stage: S.curStage });
  ctx.restore();
}
export function mvGhost(ad) { return ad && ad._mv ? ad._mv.ghost : 0; }
