// botNavigation.js — platform-aware navigation + dynamic targeting for bots.
// Uses the SAME movement physics constants as fighter.js so jump reachability
// predictions match what a real character can actually do.
//
// Responsibilities:
//   • selectTarget  — pick the closest REACHABLE opponent, with a short lock
//   • navigateToward — route the bot across platforms to reach a target,
//                      choosing jump timing, double-jumps, and launch points
//   • platformNavigate — thin wrapper used by the Battle Royale zone code
//
// Everything is O(n) per frame with a cached platform graph that is only
// rebuilt when the stage geometry changes — no per-frame pathfinding.

// Physics constants — MUST stay in sync with fighter.js. Kept local to avoid a
// circular import (fighter.js imports this module, so this module can't import
// constants from fighter before they're initialized).
const GRAVITY = 0.42;
const JUMP_FORCE = 14.5;          // upward speed (magnitude)
const DOUBLE_JUMP_FORCE = 12.5;
const AIR_SPEED = 3.4;
const MAX_FALL_SPEED = 15;

// Single full-jump peak height (feet displacement) = v²/(2g)
export const MAX_JUMP_UP = Math.round((JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY));      // ~250
// Full jump + double jump combined peak
export const MAX_DOUBLE_UP = Math.round(MAX_JUMP_UP + (DOUBLE_JUMP_FORCE * DOUBLE_JUMP_FORCE) / (2 * GRAVITY)); // ~436

const PASS_THROUGH = ['water', 'lava', 'cloud', 'acid', 'tar'];
const SOLID = (p) => p && !PASS_THROUGH.includes(p.material || 'normal') && !(p._deleted > 0);
const UNSAFE_MATS = ['lava', 'quicksand', 'spike', 'acid', 'tar', 'snow', 'water'];

// ── Geometry helpers ────────────────────────────────────────────────────────
const pCx = (p) => p.x + p.w / 2;

// Platform an entity stands on (or the closest solid one directly below it).
function platformBelow(ent, platforms) {
  let best = null, bestD = Infinity;
  for (const p of platforms) {
    if (!SOLID(p)) continue;
    if (ent.x < p.x - 16 || ent.x > p.x + p.w + 16) continue;
    const d = p.y - ent.y; // positive = platform top is below the feet
    if (d > -8 && d < bestD) { bestD = d; best = p; }
  }
  return best;
}

// Candidate launch Xs on platform A for jumping toward B.
function launchCandidates(A, B) {
  const out = [];
  out.push(A.x + 12, A.x + A.w - 12, pCx(A));
  // Points just outside B's span, if they still sit on A — lets the bot
  // clear B's underside by rising beside it before drifting over the top.
  if (B.x - 44 > A.x + 4 && B.x - 44 < A.x + A.w - 4) out.push(B.x - 44);
  if (B.x + B.w + 44 > A.x + 4 && B.x + B.w + 44 < A.x + A.w - 4) out.push(B.x + B.w + 44);
  return out;
}

// Simulate a ground-jump arc from (lx, launchY) drifting toward B and check
// whether the trajectory lands on B's top. Mirrors the engine's physics:
//   vy += GRAVITY each frame, clamp fall, x += airspeed*dir each frame,
//   variable jump (cut), double-jump at first-jump apex.
// Conservative airspeed (AIR_SPEED*0.9) so bots only commit to jumps they
// can actually make after acceleration.
function simulateJump(lx, launchY, B, useDouble, jumpCutFrame) {
  let x = lx, y = launchY, prevY = y;
  let vy = -JUMP_FORCE;           // initial ground jump — negative = upward (y increases downward)
  let jumpsLeft = useDouble ? 2 : 1;
  let jumped2 = false;
  let jumpCutApplied = false;
  const isThin = B.h < 18;        // thin platforms pass through from below — no underside bonk
  const dirX = pCx(B) > lx ? 1 : -1;
  const avx = dirX * AIR_SPEED * 0.9;

  for (let t = 0; t < 180; t++) {
    // Variable jump height: cut velocity when the button is released (short hop).
    // Matches fighter.js: vy *= 0.55 when jump released while ascending.
    if (jumpCutFrame != null && !jumpCutApplied && t >= jumpCutFrame && vy < 0) {
      vy *= 0.55;
      jumpCutApplied = true;
    }
    vy += GRAVITY;
    if (vy > MAX_FALL_SPEED) vy = MAX_FALL_SPEED;
    if (vy < -MAX_FALL_SPEED) vy = -MAX_FALL_SPEED;
    prevY = y;
    x += avx;
    y += vy;

    // Double jump at the apex of the first jump, if needed and available
    if (useDouble && !jumped2 && jumpsLeft > 1 && vy >= 0) {
      vy = -DOUBLE_JUMP_FORCE;
      jumped2 = true;
      jumpsLeft--;
      continue;
    }

    // Underside bonk: rising head entered B's body from below while under B's span.
    // Only for thick platforms — thin ones are pass-through from below.
    if (!isThin && vy < 0 && prevY - 55 >= B.y + B.h && (y - 55) < B.y + B.h &&
        x > B.x - 6 && x < B.x + B.w + 6) {
      return { ok: false, bonk: true };
    }
    // Landing: descending feet cross B's top while within B's horizontal span
    if (vy >= 0 && prevY <= B.y + 2 && y >= B.y && x > B.x + 2 && x < B.x + B.w - 2) {
      return { ok: true, doubleUsed: jumped2 };
    }
  }
  return { ok: false };
}

function canJump(A, B) {
  if (A === B) return { ok: true };
  if (B.y >= A.y - 5) return null; // B isn't above A — not a climb
  // Try multiple jump heights: short hop (tap) first for nearby platforms, then
  // medium, then full jump (hold) for higher platforms. This picks the shortest
  // jump that successfully lands, so bots don't overshoot nearby platforms.
  const cutFrames = [1, 3, null];
  for (const lx of launchCandidates(A, B)) {
    for (const useDouble of [false, true]) {
      for (const cutFrame of cutFrames) {
        const r = simulateJump(lx, A.y, B, useDouble, cutFrame);
        if (r.ok) return { ok: true, launchX: lx, doubleNeeded: r.doubleUsed, jumpCutFrame: cutFrame };
      }
    }
  }
  return null;
}

function canDrop(A, B) {
  if (A === B) return { ok: true };
  if (B.y <= A.y + 10) return null; // B isn't clearly lower
  const dropHeight = B.y - A.y;
  // Allow wider gaps for taller drops — the bot drifts horizontally while falling.
  // Base 90px + up to 180px extra for large drops (more air time = more drift).
  const maxGap = 90 + Math.min(dropHeight * 0.3, 180);
  const gap = Math.abs(pCx(A) - pCx(B)) - (A.w + B.w) / 2;
  if (gap > maxGap) return null;
  return { ok: true };
}

// ── Platform graph (cached per stage geometry) ──────────────────────────────
const graphCache = new Map();
function solidCount(platforms) {
  let n = 0; for (const p of platforms) if (SOLID(p)) n++;
  return n;
}

function buildGraph(platforms) {
  const sol = platforms.filter(SOLID);
  const adj = new Map();
  for (const p of sol) adj.set(p, []);
  for (let i = 0; i < sol.length; i++) {
    for (let j = 0; j < sol.length; j++) {
      if (i === j) continue;
      const A = sol[i], B = sol[j];
      const dx = Math.abs(pCx(A) - pCx(B));
      if (dx > 1100) continue;
      const dy = B.y - A.y;
      if (dy < -MAX_DOUBLE_UP - 40 || dy > 700) continue;
      let edge = canJump(A, B);
      if (!edge) edge = canDrop(A, B);
      if (edge) {
        const cost = dx + Math.max(0, A.y - B.y) * 2 + Math.max(0, B.y - A.y) * 0.4;
        // Store the launch point that canJump PROVED reaches B, so route-following
        // jumps from a working spot instead of a geometric guess that may be
        // too far to actually land (the multi-hop climb bug).
        adj.get(A).push({ to: B, cost, launchX: edge.launchX != null ? edge.launchX : null, doubleNeeded: !!edge.doubleNeeded, jumpCutFrame: edge.jumpCutFrame != null ? edge.jumpCutFrame : null });
      }
    }
  }
  return { adj, solCount: sol.length };
}

function getGraph(platforms) {
  const sc = solidCount(platforms);
  let g = graphCache.get(platforms);
  if (g && g.solCount === sc) return g;
  g = buildGraph(platforms);
  graphCache.set(platforms, g);
  return g;
}

// Look up the cached graph edge from platform A to platform B (if any).
function edgeBetween(A, B, platforms) {
  const adj = getGraph(platforms).adj;
  for (const e of (adj.get(A) || [])) if (e.to === B) return e;
  return null;
}

// BFS shortest platform path from start platform to goal platform.
function findRoute(start, goal, platforms) {
  if (!start || !goal || start === goal) return [goal].filter(Boolean);
  const g = getGraph(platforms);
  const adj = g.adj;
  const prev = new Map();
  const dist = new Map();
  const queue = [start];
  dist.set(start, 0);
  while (queue.length) {
    let u = queue[0], ui = 0;
    for (let k = 1; k < queue.length; k++) {
      if ((dist.get(queue[k]) || 0) < (dist.get(u) || 0)) { u = queue[k]; ui = k; }
    }
    queue.splice(ui, 1);
    if (u === goal) break;
    for (const e of (adj.get(u) || [])) {
      const nd = (dist.get(u) || 0) + e.cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, u);
        if (!queue.includes(e.to)) queue.push(e.to);
      }
    }
  }
  if (!prev.has(goal) && start !== goal) return null;
  const path = [];
  let cur = goal;
  while (cur && cur !== start) { path.unshift(cur); cur = prev.get(cur); }
  if (!cur) return null;
  return path;
}

// ── Per-fighter nav state ───────────────────────────────────────────────────
function navState(fighter) {
  if (!fighter._navSt) fighter._navSt = { route: null, wpIdx: 0, stuck: 0, lastPos: null, targetRef: null, targetLock: 0, doubleUsed: false, holdJump: false, releasedForDouble: false };
  return fighter._navSt;
}

export function resetBotNav(fighter) {
  fighter._navSt = { route: null, wpIdx: 0, stuck: 0, lastPos: null, targetRef: null, targetLock: 0, doubleUsed: false, holdJump: false, releasedForDouble: false };
}

// ── Dynamic target selection ────────────────────────────────────────────────
export function selectTarget(fighter, opponents, platforms) {
  if (!opponents || opponents.length === 0) return null;
  const st = navState(fighter);
  // Keep the locked target if it's still valid
  if (st.targetRef && st.targetLock > 0) {
    const cur = opponents.find(o => o === st.targetRef);
    if (cur && cur.stocks > 0 && !cur._eliminated) { st.targetLock--; return cur; }
    st.targetRef = null; st.targetLock = 0;
  }

  let best = null, bestScore = Infinity;
  for (const o of opponents) {
    if (!o || o === fighter || o.stocks <= 0 || o._eliminated) continue;
    const dx = o.x - fighter.x, dy = o.y - fighter.y;
    const rawDist = Math.abs(dx) + Math.abs(dy) * 0.6;
    // Reachability estimate: same platform/level = cheap; otherwise route cost.
    const myP = platformBelow(fighter, platforms);
    const oP = platformBelow(o, platforms);
    let reachCost = 0;
    if (myP && oP && myP !== oP && Math.abs(myP.y - oP.y) > 40) {
      const route = findRoute(myP, oP, platforms);
      reachCost = route ? route.length * 120 : 1600; // unreachable → heavy penalty
    }
    const score = rawDist + reachCost - (o.damage || 0) * 1.5; // prefer weaker/reachable
    if (score < bestScore) { bestScore = score; best = o; }
  }
  if (best) { st.targetRef = best; st.targetLock = 50; }
  return best;
}

// ── Stuck detection ─────────────────────────────────────────────────────────
function updateStuck(fighter, st) {
  if (!st.lastPos || st.lastFrame == null) { st.lastPos = { x: fighter.x, y: fighter.y }; st.lastFrame = fighter.frame || 0; }
  // Sample roughly every ~30 real frames (fighter.frame is the engine tick).
  if ((fighter.frame || 0) - st.lastFrame >= 30) {
    const moved = Math.hypot(fighter.x - st.lastPos.x, fighter.y - st.lastPos.y);
    if (moved < 18) st.stuck = (st.stuck || 0) + 1;
    else st.stuck = Math.max(0, (st.stuck || 0) - 1);
    st.lastPos = { x: fighter.x, y: fighter.y };
    st.lastFrame = fighter.frame || 0;
  }
}

function applyStuck(inputs, fighter, st, dx) {
  const s = st.stuck || 0;
  if (s >= 3) {
    // Bust out: invalidate route + lock, then try a fresh approach.
    st.route = null; st.wpIdx = 0; st.targetRef = null; st.targetLock = 0;
    st.stuck = 0;
    const blocked = fighter.grounded && Math.abs(fighter.vx) < 0.4 && (inputs.left || inputs.right);
    if (blocked) {
      // Push the opposite way briefly to escape the wall, then a fresh route forms next frame.
      if (dx >= 0) { inputs.left = true; inputs.right = false; }
      else { inputs.left = false; inputs.right = true; }
    }
    if (fighter.grounded && fighter.jumps > 0) inputs.jump = true;
  }
  return inputs;
}

// ── Main per-frame navigation toward a target ───────────────────────────────
// Returns { left, right, jump, up, down } — combat decisions are layered on top
// by updateAI.
export function navigateToward(fighter, target, platforms) {
  const st = navState(fighter);
  if (fighter.grounded) {
    st.doubleUsed = false;
    st.lastGroundedY = fighter.y;
  }

  updateStuck(fighter, st);

  const dx = target.x - fighter.x;
  const dy = target.y - fighter.y;
  const inputs = { left: false, right: false, jump: false, up: false, down: false };

  // Standing on a dangerous material → jump out of it (handled by updateAI's
  // hazard block normally, but guarantee movement here too).
  if (fighter.grounded && UNSAFE_MATS.includes(fighter.platformMaterial)) {
    inputs.jump = true;
    const safe = nearestSafeCenter(fighter, platforms);
    if (safe != null) { inputs.left = fighter.x > safe + 15; inputs.right = fighter.x < safe - 15; }
    return applyStuck(inputs, fighter, st, dx);
  }

  const myPlat = platformBelow(fighter, platforms);
  const tgtPlat = platformBelow(target, platforms);

  // Same platform, no platform info, or basically the same level & close → approach directly.
  const sameLevel = myPlat && tgtPlat && Math.abs(myPlat.y - tgtPlat.y) < 40;
  if (!myPlat || !tgtPlat || myPlat === tgtPlat || (sameLevel && Math.abs(dx) < 420)) {
    if (Math.abs(dx) > 6) { inputs.left = dx < 0; inputs.right = dx > 0; }
    // Target slightly above but reachable by a single hop on the same platform
    if (dy < -50 && dy > -(MAX_JUMP_UP + 10) && fighter.grounded && Math.abs(dx) < 120) {
      inputs.jump = true; inputs.left = dx < 0; inputs.right = dx > 0;
    }
    // Gap jump on the same tier (no ground ahead at this height)
    if (sameLevel && fighter.grounded) {
      const dir = dx > 0 ? 1 : (dx < 0 ? -1 : (fighter.facing || 1));
      if (dir !== 0 && gapAhead(fighter, dir, platforms, myPlat)) { inputs.jump = true; }
    }
    if (dy > 60 && !fighter.grounded) inputs.down = true;
    return applyStuck(inputs, fighter, st, dx);
  }

  // Different platform → build/follow a route.
  if (!st.route || st.routeTarget !== tgtPlat) {
    st.route = findRoute(myPlat, tgtPlat, platforms);
    st.routeTarget = tgtPlat;
    st.wpIdx = 0;
  }
  const route = st.route;
  const wp = route && route[st.wpIdx];
  if (!wp) {
    // No route found — head toward target directly and try again later.
    if (Math.abs(dx) > 6) { inputs.left = dx < 0; inputs.right = dx > 0; }
    if (dy < -60 && fighter.grounded) inputs.jump = true;
    if (dy > 60 && !fighter.grounded) inputs.down = true;
    return applyStuck(inputs, fighter, st, dx);
  }

  // Already standing on the current waypoint → advance to the next one.
  if (fighter.grounded && myPlat === wp) {
    st.wpIdx++;
    if (st.wpIdx >= route.length) { st.route = null; st.routeTarget = null; }
    return navigateToward(fighter, target, platforms);
  }

  const wdx = pCx(wp) - fighter.x;
  const wdy = wp.y - fighter.y; // negative = waypoint is above

  if (Math.abs(wdx) > 8) { inputs.left = wdx < 0; inputs.right = wdx > 0; }

  if (wdy < -40) {
    // Waypoint above — get to a good launch position, then jump.
    // Prefer the launch point that canJump PROVED reaches the waypoint (stored
    // in the graph edge); fall back to the geometric bestLaunchX guess only if
    // no validated launch exists (e.g. drop-formed edge).
    const _edge = edgeBetween(myPlat, wp, platforms);
    const launchX = (_edge && _edge.launchX != null) ? _edge.launchX : bestLaunchX(myPlat, wp);
    const atLaunch = Math.abs(fighter.x - launchX) < 32;
    const wantShortHop = _edge && _edge.jumpCutFrame === 1;
    const needDouble = _edge && _edge.doubleNeeded;
    if (fighter.grounded) {
      if (atLaunch) {
        // Initiate jump. holdJump=true → hold button for full jump height;
        // holdJump=false → tap button for short hop (cut height for nearby platforms).
        inputs.jump = true;
        st.holdJump = !wantShortHop;
        st.doubleUsed = false;
        st.releasedForDouble = false;
        inputs.left = wdx < 0; inputs.right = wdx > 0;
      } else {
        inputs.left = launchX < fighter.x - 6;
        inputs.right = launchX > fighter.x + 6;
      }
    } else {
      // Airborne — control jump height and double jump timing.
      const atApex = fighter.vy >= -2;
      if (needDouble && !st.doubleUsed && atApex) {
        // Need double jump at apex. If holding jump, release for 1 frame to
        // clear jumpHeld, then press next frame for the double jump.
        if (st.holdJump && !st.releasedForDouble) {
          inputs.jump = false;
          st.releasedForDouble = true;
        } else {
          inputs.jump = true;
          st.doubleUsed = true;
          st.holdJump = true;
          st.releasedForDouble = false;
        }
      } else if (st.holdJump && fighter.vy < 0) {
        // Full jump: hold jump while ascending to prevent the height cut.
        inputs.jump = true;
      } else if (fighter.jumps > 0 && (-wdy) > 50 && fighter.vy >= 0) {
        inputs.jump = true;
      }
      // Stop holding once we start falling (apex reached, no more cut to prevent).
      if (fighter.vy >= 0 && !st.releasedForDouble) st.holdJump = false;
    }
  } else if (wdy > 50) {
    // Waypoint below — walk toward the waypoint horizontally so the bot
    // naturally walks off the platform edge and falls toward it, then drift
    // left/right while airborne to land on the lower platform.
    if (fighter.grounded) {
      if (Math.abs(wdx) > 8) { inputs.left = wdx < 0; inputs.right = wdx > 0; }
      else {
        // Waypoint directly below — walk toward the nearest edge to drop off
        const distL = fighter.x - (myPlat ? myPlat.x : 0);
        const distR = (myPlat ? myPlat.x + myPlat.w : 0) - fighter.x;
        if (distL < distR) { inputs.left = true; } else { inputs.right = true; }
      }
    }
    if (!fighter.grounded) {
      inputs.down = true;
      if (Math.abs(wdx) > 8) { inputs.left = wdx < 0; inputs.right = wdx > 0; }
    }
  }

  return applyStuck(inputs, fighter, st, dx);
}

// Best launch point on the bot's current platform for jumping toward an
// above waypoint — prefers an edge OUTSIDE the waypoint's horizontal span so
// the bot rises beside it and lands on top instead of bonking the underside.
function bestLaunchX(myPlat, wp) {
  const myL = myPlat.x, myR = myPlat.x + myPlat.w;
  const wpL = wp.x, wpR = wp.x + wp.w;
  const leftOutside = myL < wpL - 20 ? myL + 12 : null;
  const rightOutside = myR > wpR + 20 ? myR - 12 : null;
  if (leftOutside != null && rightOutside != null) {
    const tCx = (wpL + wpR) / 2;
    return Math.abs(leftOutside - tCx) < Math.abs(rightOutside - tCx) ? leftOutside : rightOutside;
  }
  if (rightOutside != null) return rightOutside;
  if (leftOutside != null) return leftOutside;
  // Fully under the waypoint — pick the nearest edge so we can clear out.
  const tCx = (wpL + wpR) / 2;
  return Math.abs(myL + 12 - tCx) < Math.abs(myR - 12 - tCx) ? myL + 12 : myR - 12;
}

// Is there a gap (no solid ground at this tier) just ahead in `dir`?
function gapAhead(fighter, dir, platforms, myPlat) {
  const aheadX = fighter.x + dir * 56;
  for (const p of platforms) {
    if (!SOLID(p)) continue;
    if (aheadX < p.x - 16 || aheadX > p.x + p.w + 16) continue;
    if (Math.abs(p.y - myPlat.y) < 60) return false;
  }
  return true;
}

function nearestSafeCenter(fighter, platforms) {
  let safeX = null, d = Infinity;
  for (const p of platforms) {
    if (!SOLID(p)) continue;
    if (UNSAFE_MATS.includes(p.material || 'normal')) continue;
    const c = pCx(p);
    const dd = Math.abs(c - fighter.x);
    if (dd < d) { d = dd; safeX = c; }
  }
  return safeX;
}

// ── Compat wrapper for the Battle Royale zone-collapse code ──────────────────
export function platformNavigate(fighter, target, platforms) {
  return navigateToward(fighter, target, platforms);
}