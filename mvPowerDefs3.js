// mvPowerDefs3.js — power abilities, Generation V (39: heroes of color, villains, Guardians).
import * as K from './mvPowerKit.js';
import { grapple, swapMarker, returnMarker } from './mvPowerFam.js';
const fc = K.face;
const projArrays = (f) => [f.projectiles, f.genProjectiles].filter(Boolean);
const buff = (f, t, fn, undo, extra = {}) => { if (f._pwBuff) return false; fn(f); f._pwBuff = { t, undo, ...extra }; return true; };
const ring = (c, x, y, style, grow = 3, life = 10, r = 8) => K.spawn(c, { k: 'ring', style, x, y, r, grow, life });
const nearestOpp = (c, f, rng) => c.opps.filter((t) => Math.abs(t.x - f.x) < rng && Math.abs(t.y - f.y) < 80).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0];
// orbiting pieces helper (Pink debris / Magneto fragments)
const orbit = (c, S, n, rad, style, spd) => { S.pieces = []; for (let i = 0; i < n; i++) S.pieces.push(K.spawn(c, { k: 'orb', style, x: c.f.x, y: c.f.y - 35, r: 6, life: 9999, hold: true, ang: i * (Math.PI * 2 / n) })); S.rad = rad; S.spd = spd; };
const orbitTick = (c, S) => { const f = c.f; S.pieces.forEach((p) => { if (p.life <= 0) return; p.ang += S.spd; const t = Math.min(1, (c.pw.t) / 14); p.x = f.x + Math.cos(p.ang) * S.rad * t; p.y = f.y - 35 + Math.sin(p.ang) * S.rad * 0.6 * t; }); };
const launchPieces = (c, S, vx, vy, d, hs) => { const f = c.f; S.pieces.forEach((p) => { if (p.life <= 0) return; p.life = 0; K.proj(c, { style: p.style, x: p.x, y: p.y, vx, vy, r: 7, life: 40, d, kx: 4, ky: -3, hs }); }); };

export const DEFS3 = {
  yellow: { name: 'Enhance', cd: 600,                                          // exactly 3 s, no second press, no refresh
    press(c) { const f = c.f; const ok = buff(f, 180, (g) => { g._pwB = { s: g.speedBoost, d: g.damageBoost, k: g.knockbackTakenMul }; g.speedBoost = (g.speedBoost || 1) * 1.25; g.damageBoost = (g.damageBoost || 1) * 1.2; g.knockbackTakenMul = (g.knockbackTakenMul || 1) * 0.88; },
        (g) => { g.speedBoost = g._pwB.s; g.damageBoost = g._pwB.d; g.knockbackTakenMul = g._pwB.k; }, { outline: '#ffd83d' }); if (!ok) return false; ring(c, f.x, f.y - 35, 'light', 3, 12, 10); K.end(c); return true; } },

  blue: { name: 'Tide Wheel', cd: 540, second: true,                           // wheel rolls along the ground, pushes foes, can be ridden; second press freezes it into an ice platform
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.x = f.x + S.d * 34; S.y = f.y; S.rid = false;
      S.w = K.spawn(c, { k: 'orb', style: 'wheel', x: S.x, y: S.y - 20, r: 22, life: 120, hold: false }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.ice) { if (S.ice.life <= 1) K.end(c); return; } if (S.w.life <= 1) { K.end(c); return; }
      const nx = S.x + S.d * 6, gy = K.groundY(c, nx, S.y - 20, 40); if (gy == null || K.ray(c, S.x, S.y - 20, S.d > 0 ? 0 : Math.PI, 26, true)) { S.w.life = 0; K.end(c); return; } S.x = nx; S.y = gy; S.w.x = S.x; S.w.y = S.y - 22;
      for (const t of c.opps) if (K.bodyHit(t, S.x, S.y - 22, 26)) { t.x += S.d * 3; t.vx = S.d * 5; }                                        // pushes, never traps
      if (!S.rid && f.vy >= 0 && Math.abs(f.x - S.x) < 26 && f.y >= S.y - 52 && f.y <= S.y - 30) S.rid = true;
      if (S.rid) { f.x = S.x; f.y = S.y - 44; f.vy = 0; f.vx = 0; f.grounded = true; if (c.jump) { S.rid = false; f.vy = -9; } } },
    second(c) { const f = c.f, S = c.S; if (!S.w || S.w.life <= 0 || S.ice) return; S.w.life = 0; S.ice = K.addSolid(c, { x: S.x - 36, y: S.y - 16, w: 72, h: 14, life: 90, keep: true, style: 'ice' }); if (S.rid) { f.y = S.y - 16; f.vy = 0; S.rid = false; } ring(c, S.x, S.y - 20, 'ice'); } },

  purple: { name: 'Smoke Ascent', cd: 600,                                     // dissolve, reappear 0.6 s later ~4.5 heights higher; cannot attack in between, cannot leave the stage
    press(c) { const f = c.f, S = c.S; S.t = 0; S.x = f.x; S.y0 = f.y; f._pwHide = true; K.lock(c, 36); K.spawn(c, { k: 'ring', style: 'smoke', x: f.x, y: f.y - 35, r: 10, grow: 2, life: 18, cloud: true }); return true; },
    tick(c) { const f = c.f, S = c.S; S.t++; if (S.t < 36) { K.lock(c, 1); f.vx = 0; f.vy = 0; f.grounded = false; f.x = S.x; f.y = S.y0; f._pwHide = true; return; }
      if (S.t === 36) { let dy = 315; while (dy > 0 && !(K.free(c, S.x, S.y0 - dy) && K.pathClear(c, S.x, S.y0, S.x, S.y0 - dy) && S.y0 - dy > 110)) dy -= 20; f.x = S.x; f.y = S.y0 - dy; f.vx = 0; f.vy = 0; f._pwHide = false; K.lock(c, 10); K.spawn(c, { k: 'ring', style: 'smoke', x: f.x, y: f.y - 35, r: 10, grow: 2, life: 18, cloud: true }); }
      if (S.t > 46) K.end(c); } },

  orange: { name: 'Portal Skip', cd: 480, second: true,                         // portal flies diagonally up and hangs 3 s; second press teleports to it (cancelled if hit during the wind-up)
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d; S.x = f.x + d * 20; S.y = f.y - 50; S.mv = 0;
      S.p = K.spawn(c, { k: 'marker', style: 'portal', x: S.x, y: S.y, life: 180, r: 20, tag: 'pt' }); S.p.update = (cc, e) => { if (S.mv < 26) { const nx = S.x + d * 6.6, ny = S.y - 4.6; if (!K.ray(cc, S.x, S.y, Math.atan2(-4.6, d * 6.6), 10, true) && nx > 24 && nx < cc.W - 24 && ny > 60) { S.x = nx; S.y = ny; S.mv++; } else S.mv = 99; } e.x = S.x; e.y = S.y; }; ring(c, f.x, f.y - 35, 'portal'); return true; },
    onHit(c) { if (c.S.tp > 0) { c.S.tp = 0; K.end(c, 300); } },
    tick(c) { const f = c.f, S = c.S; if (S.tp > 0) { S.tp--; K.lock(c, 1); f.vx = 0; if (S.tp === 0) { const gx = S.x, gy = S.y + 36; if (K.teleport(c, f, gx, gy)) { ring(c, f.x, f.y - 35, 'portal'); } S.p.life = 0; K.end(c); } return; } if (S.p.life <= 1) K.end(c); },
    second(c) { const S = c.S; if (!S.p || S.p.life <= 0 || S.tp > 0) return; if (!K.free(c, S.x, S.y + 36) || !K.pathClear(c, c.f.x, c.f.y, S.x, S.y + 36)) { K.end(c, 240); return; } S.tp = 8; K.lock(c, 8); } },

  green: { name: 'Mountain Step', cd: 540, second: true,                         // raise a slab (0.5 s), hop on it, or press again to tilt + slide it; breaks after 3 s or a heavy hit
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.gy = f.y; S.x = f.x + S.d * 54 - 30; S.t = 0; S.sl = false;
      S.s = K.addSolid(c, { x: S.x, y: S.gy, w: 60, h: 1, life: 9999, persist: true, solid: true, style: 'stone' }); K.lock(c, 6); return true; },
    tick(c) { const f = c.f, S = c.S, s = S.s; S.t++; const u = Math.min(1, S.t / 30); s.h = Math.max(1, 70 * u); s.y = S.gy - s.h;
      if (S.sl && S.sl > 0) { S.sl--; const nx = s.x + S.d * 3.3; if (!K.ray(c, S.d > 0 ? nx + s.w : nx, s.y + 30, S.d > 0 ? 0 : Math.PI, 4, true) && nx > 10 && nx + s.w < c.W - 10) { s.x = nx; for (const t of c.opps) if (K.rectHit(t, s.x, s.y, s.w, s.h)) t.x += S.d * 4; } }
      const ad = K.struckBy(c, s.x + s.w / 2, s.y + s.h / 2, 34); if ((ad && K.isHeavyAtk(ad)) || S.t > 180) { K.dropSolid(f, s); K.end(c); } },
    second(c) { const S = c.S; if (S.t < 30 || S.sl) return; S.sl = 12; } },

  pink: { name: 'Psychic Orbit', cd: 480, second: true,                          // up to 3 debris orbit 4 s; power again throws them; JUMP sends them straight down and cushions the landing
    press(c) { const S = c.S; orbit(c, S, 3, 36, 'debris', 0.13); return true; },
    tick(c) { const f = c.f, S = c.S; orbitTick(c, S); if (S.cush > 0) { S.cush--; f.vy = Math.min(f.vy, 1.8); }
      if (c.jump && !f.grounded && !S.thrown) { S.thrown = true; S.pieces.forEach((p) => { if (p.life <= 0) return; p.life = 0; K.proj(c, { style: 'debris', x: p.x, y: p.y, vx: 0.5, vy: 9, r: 7, life: 36, d: 3.5, kx: 1, ky: 6, hs: 10 }); }); S.cush = 18; }
      if (c.pw.t > 240 || (!S.pieces.some((p) => p.life > 0) && !c.pw.ents.some((e) => e.proj))) K.end(c); },
    second(c) { const S = c.S, f = c.f; if (S.thrown || !S.pieces.some((p) => p.life > 0)) return; S.thrown = true; launchPieces(c, S, fc(f) * 9, 0, 3.5, 10); } },

  grey: { name: 'Fortress Fold', cd: 540, second: true,                          // two angled walls form a V; step inside and fold them inward to launch forward — foes caught between are pushed OUT
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.cx = f.x + S.d * 58; S.gy = f.y; S.t = 0; S.fold = 0;
      S.a = K.spawn(c, { k: 'rect', style: 'wall', x: S.cx - 30, y: S.gy - 80, w: 12, h: 80, life: 9999, hold: true, tilt: 0.25 }); S.b = K.spawn(c, { k: 'rect', style: 'wall', x: S.cx + 18, y: S.gy - 80, w: 12, h: 80, life: 9999, hold: true, tilt: -0.25 }); return true; },
    tick(c) { const f = c.f, S = c.S; S.t++; if (S.fold > 0) { S.fold--; const u = 1 - S.fold / 12; S.a.x = S.cx - 30 + 24 * u; S.b.x = S.cx + 18 - 24 * u;
        for (const t of c.opps) if (Math.abs(t.y - S.gy) < 70 && t.x > S.cx - 34 && t.x < S.cx + 34) { t.x += (t.x >= S.cx ? 1 : -1) * 4.5; t.vx = (t.x >= S.cx ? 1 : -1) * 4; }       // pushed out, not trapped
        if (S.go) { K.lock(c, 1); K.setMove(f, S.d * 9, f.vy); } if (S.fold === 0) { S.a.life = 0; S.b.life = 0; K.end(c); } return; }
      if (S.t > 150) { S.a.life = 0; S.b.life = 0; K.end(c); } },
    second(c) { const S = c.S, f = c.f; if (S.fold > 0) return; S.fold = 12; S.go = Math.abs(f.x - S.cx) < 26 && Math.abs(f.y - S.gy) < 20; } },

  turquoise: { name: 'Predator Morph', cd: 600, second: true,                    // 2.5 s beast form: faster, clings to walls (drains the form), leaps away; second press ends it with ONE claw swipe
    press(c) { const f = c.f, S = c.S; S.left = 150; f._pwB = { s: f.speedBoost }; f.speedBoost = (f.speedBoost || 1) * 1.3; f._pwFx = { beast: true }; ring(c, f.x, f.y - 35, 'morph'); return true; },
    onEnd(c) { },
    tick(c) { const f = c.f, S = c.S; const d = fc(f), w = !f.grounded && K.ray(c, f.x, f.y - 35, d > 0 ? 0 : Math.PI, 14, true); S.left -= w ? 2.5 : 1;
      if (w) { f.vy = Math.min(f.vy, 0.7); f.vx = 0; S.cling = true; if (c.jump) { f.vx = -d * 7.5; f.vy = -9; f.facing = -d; } } else S.cling = false;
      c.f._pwFx = { beast: true, cling: !!w };
      if (S.left <= 0) { f.speedBoost = f._pwB.s; K.end(c); } },
    second(c) { const f = c.f, S = c.S, d = fc(f); f.speedBoost = f._pwB.s; K.spawn(c, { k: 'arc', style: 'claw', x: f.x, y: f.y - 36, dir: d, r: 34, life: 8 });
      for (const t of c.opps) if (K.rectHit(t, d > 0 ? f.x : f.x - 46, f.y - 60, 46, 60)) K.hit(f, t, { d: 6, kx: d * 6, ky: -3, hs: 14 }); K.end(c); } },

  olive: (() => { const G = grapple({ name: "Giant's Reach", cd: 540, ang: 30, len: 150, startup: 8, mode: 'auto', second: 'release', speed: 7, edgeOnly: true, style: 'arm', flySpeed: 20 });
    return { ...G, press(c) { const f = c.f, d = fc(f); const t = nearestOpp(c, f, 64); if (t && (t.x - f.x) * d > 0) { K.hit(f, t, { d: 6, kx: d * 8, ky: -3, hs: 14 }); K.spawn(c, { k: 'arc', style: 'arm', x: f.x, y: f.y - 40, dir: d, r: 40, life: 8 }); K.end(c, 360); return true; } return G.press(c); } }; })(),

  copper: returnMarker({ name: 'Borrowed Second', cd: 480, dash: 0, window: 72, style: 'clock', needGround: false, struck: false }),

  emerald: { name: 'Phase Stitch', cd: 480,                                      // phase through ONE nearby surface (fails safely if too thick / blocked); route outline shows 0.3 s first
    press(c) { const f = c.f, S = c.S, d = fc(f); let dest = null;
      const w = K.ray(c, f.x, f.y - 30, d > 0 ? 0 : Math.PI, 70, false);
      if (w && w.rect.h > 20 || (w && w.rect._forceSolid)) { const r = w.rect, th = r.w; if (th <= 150) { const ex = d > 0 ? r.x + r.w + 20 : r.x - 20; const gy = K.groundY(c, ex, r.y - 20, 700); if (gy != null && K.onStage(c, ex, gy) && K.free(c, ex, gy)) dest = [ex, f.y > gy ? gy : gy]; } }
      if (!dest && f.grounded && c.inputs.down) { for (const r of K.rects(c)) if (r.h <= 20 && f.x > r.x && f.x < r.x + r.w && Math.abs(f.y - r.y) < 6) { const gy = K.groundY(c, f.x, r.y + r.h + 30, 700); if (gy != null && K.free(c, f.x, gy)) dest = [f.x, gy]; } }
      if (!dest) return false; S.dest = dest; S.t = 0; K.lock(c, 18); S.line = K.spawn(c, { k: 'line', style: 'phase', x1: f.x, y1: f.y - 30, x2: dest[0], y2: dest[1] - 30, life: 18 }); return true; },
    onHit(c) { c.S.cancel = true; },
    tick(c) { const f = c.f, S = c.S; S.t++; if (S.cancel) { f._pwHide = false; K.end(c, 300); return; } K.lock(c, 1); f.vx = 0;
      if (S.t === 18) { f._pwHide = true; f.x = S.dest[0]; f.y = S.dest[1]; f.vx = 0; f.vy = 0; ring(c, f.x, f.y - 30, 'phase'); }
      if (S.t === 20) { f._pwHide = false; K.end(c); } } },

  pearl: { name: 'Sonar Bounce', cd: 480,                                        // arrow bounces off the nearest surface ONCE; each impact pings & reveals foes; the second impact is a small shockwave
    press(c) { const f = c.f, S = c.S, d = fc(f); S.bounced = false; S.shock = false;
      const burst = (cc, x, y, big) => { ring(cc, x, y, 'sound', 4, 12); for (const t of cc.opps) { if (Math.abs(t.x - x) < 140 && Math.abs(t.y - y) < 120) t._pwRevealed = 70; if (big && K.bodyHit(t, x, y, 50)) K.hit(cc.f, t, { d: 3, kx: (t.x >= x ? 1 : -1) * 6, ky: -3, hs: 10 }); } };
      K.proj(c, { style: 'arrow', x: f.x + d * 18, y: f.y - 38, vx: d * 11, r: 8, life: 40, bounce: 1, onHit: (cc, e, t) => { K.hit(cc.f, t, { d: S.bounced ? 3 : 5, kx: Math.sign(e.vx) * 5, ky: -2, hs: 10 }); e.life = 0; },
        onBounce: (cc, e) => { S.bounced = true; burst(cc, e.x, e.y, false); }, onWall: (cc, e) => { burst(cc, e.x, e.y, S.bounced); S.shock = true; } }); return true; },
    tick(c) { if (!c.pw.ents.some((e) => e.proj)) K.end(c); } },

  red: { name: 'Inferno Uppercut', cd: 540,                                      // upward spinning slash; a hit lifts Red, a miss fizzles with recovery; never resets jumps
    press(c) { const S = c.S; S.t = 0; K.lock(c, 10); return true; },
    tick(c) { const f = c.f, S = c.S, d = fc(f); S.t++; if (S.t <= 10) { f.vx = 0; return; }
      if (S.t <= 18 && !S.hit) { K.lock(c, 1); const hx = f.x + d * 26, hy = f.y - 58; K.spawn(c, { k: 'arc', style: 'flame', x: f.x, y: f.y - 40, dir: d, r: 40, life: 3, up: true });
        for (const t of c.opps) if (K.bodyHit(t, hx, hy, 32)) { K.hit(f, t, { d: 9, kx: d * 3, ky: -10, hs: 20 }); S.hit = true; f.vy = -9; f.grounded = false; } }
      else if (!S.hit && S.t <= 34) { K.lock(c, 1); } else K.end(c); } },

  lavender: { name: 'Solid-Air Staircase', cd: 30,                              // two short-lived air steps; a new pair needs the old one gone and (in the air) is limited per airtime
    press(c) { const f = c.f, d = fc(f); if ((f._pwSolids || []).some((s) => s.style === 'air')) return false; if (!f.grounded && (f._pwAirPairs || 0) >= 2) return false;
      const mk = (x, y) => K.addSolid(c, { x: x - 22, y, w: 44, h: 10, life: 66, keep: true, style: 'air' }); const x1 = f.x + d * 40, y1 = f.y - 48, x2 = f.x + d * 88, y2 = f.y - 100;
      if (!K.onStage(c, x1, y1) || !K.onStage(c, x2, y2)) return false; mk(x1, y1); mk(x2, y2); if (!f.grounded) f._pwAirPairs = (f._pwAirPairs || 0) + 1; K.end(c); return true; } },

  amber: swapMarker({ name: 'Legion Switch', cd: 420, dash: 90, dashFrames: 6, window: 120, style: 'clone', clone: true }),

  black: { name: 'Thunder Rod', cd: 540, second: true,                           // rod sticks to a platform; 0.7 s later lightning strikes it; before that you may dash to it ONCE
    press(c) { const f = c.f, S = c.S, d = fc(f); S.stuck = false; S.dashed = false; S.strike = -1;
      S.rod = K.proj(c, { style: 'rod', x: f.x + d * 20, y: f.y - 46, vx: d * 8.5, vy: -2.5, g: 0.28, r: 7, life: 36, harmless: true, stick: true, hold: false,
        onStick: (cc, e, w) => { S.stuck = true; S.rx = e.x; S.ry = e.y; e.life = 9999; e.hold = true; S.strike = 42; }, onWall: () => { } }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.dash > 0) { S.dash--; K.lock(c, 1); K.dashStep(c, f, S.dx, S.dy); K.spawn(c, { k: 'trail', style: 'bolt', x: f.x, y: f.y - 35, life: 8, w: 16 }); if (S.dash === 0) { f.vx = 0; f.vy = 0; } }
      if (S.stuck && S.strike > 0 && --S.strike === 0) { K.spawn(c, { k: 'ring', style: 'bolt', x: S.rx, y: S.ry, r: 10, grow: 4, life: 10 }); K.spawn(c, { k: 'rect', style: 'bolt', x: S.rx - 5, y: S.ry - 160, w: 10, h: 160, life: 6 });
        for (const t of c.opps) if (K.bodyHit(t, S.rx, S.ry, 38) || K.rectHit(t, S.rx - 12, S.ry - 160, 24, 160)) K.hit(f, t, { d: 8, kx: (t.x >= S.rx ? 1 : -1) * 4, ky: -7, hs: 16 }); S.rod.life = 0; K.end(c); }
      if (!S.stuck && S.rod.life <= 0) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (!S.stuck || S.dashed || S.strike <= 0) return; const tx = S.rx - fc(f) * 24, ty = S.ry + 8; if (!K.free(c, tx, ty) || !K.pathClear(c, f.x, f.y, tx, ty)) return; S.dashed = true; S.dash = 8; S.dx = (tx - f.x) / 8; S.dy = (ty - f.y) / 8; } },

  magenta: { ...grapple({ name: 'Glue Swing', cd: 540, ang: 36, len: 240, startup: 8, mode: 'swing', second: 'release', speed: 8, oppHit: 'slow', style: 'glue', maxSwing: 90 }) },

  indigo: { name: 'Gravity Sling', cd: 540,                                     // orb bends nearby movement for 1 s; JUMP to sling around it (launch set by your position) — never auto-drags anyone offstage
    press(c) { const f = c.f, S = c.S; S.ox = f.x + fc(f) * 80; S.oy = f.y - 92; S.o = K.spawn(c, { k: 'orb', style: 'gravity', x: S.ox, y: S.oy, r: 16, life: 60, hold: false }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.o.life <= 1 && !S.sl) { K.end(c); return; }
      for (const t of c.opps.concat([f])) { const dx = S.ox - t.x, dy = S.oy - (t.y - 35), L = Math.hypot(dx, dy); if (L < 130 && L > 12 && (t === f || (t.x > 90 && t.x < c.W - 90 && K.groundY(c, t.x, t.y - 20, 300) != null))) { t.vx += dx / L * 0.12; t.vy += dy / L * 0.12; } }
      if (c.jump && !S.sl && Math.hypot(S.ox - f.x, S.oy - (f.y - 35)) < 170) { S.sl = true; const dx = S.ox - f.x, dy = S.oy - (f.y - 35), L = Math.hypot(dx, dy) || 1; const tx = -dy / L * fc(f), ty = dx / L * fc(f); f.vx = (tx + dx / L * 0.5) * 9.5; f.vy = (ty + dy / L * 0.5) * 9.5 - 2; f.grounded = false; S.o.life = 0; ring(c, S.ox, S.oy, 'gravity'); K.end(c); } } },

  maroon: { name: 'Energy Capacitor', cd: 480, second: true,                     // HOLD to charge (slows you) and release to fire forward; pressing again while charging fires DOWN with a small upward recoil
    press(c) { const S = c.S, f = c.f; S.ch = 0; S.held = true; S.fired = false; S.o = K.spawn(c, { k: 'orb', style: 'energy', x: f.x, y: f.y - 40, r: 6, life: 9999, hold: true }); return true; },
    tick(c) { const f = c.f, S = c.S, d = fc(f); if (S.fired) { if (!c.pw.ents.some((e) => e.proj)) K.end(c); return; }
      S.ch = Math.min(90, S.ch + 1); f.vx *= 0.55; S.o.x = f.x + d * 24; S.o.y = f.y - 42; S.o.r = 6 + S.ch / 7;
      if ((!c.held && S.ch > 3) || S.ch >= 90) S.shoot(c, 'fwd'); },
    second(c) { const S = c.S; if (!S.fired && S.ch > 2) S.shoot(c, 'down'); },
    init(S) { S.shoot = (c, dir) => { const f = c.f, d = fc(f); S.fired = true; S.o.life = 0; const r = 8 + S.ch / 9, dmg = 4 + S.ch / 14;
        if (dir === 'fwd') K.proj(c, { style: 'energy', x: f.x + d * 26, y: f.y - 42, vx: d * 9, r, life: 70, d: dmg, kx: 6, ky: -3, hs: 14 });
        else { K.proj(c, { style: 'energy', x: f.x + d * 8, y: f.y - 10, vx: d * 1.5, vy: 9, r, life: 40, d: dmg, kx: 2, ky: 7, hs: 14 }); f.vy = -6.2; f.grounded = false; } }; } },

  crimson: { name: 'Element 6 Rift', cd: 420,                                     // rift in front: Crimson's NEXT energy attack enters it and exits a second opening at a different angle
    press(c) { const f = c.f, S = c.S, d = fc(f); S.x1 = f.x + d * 50; S.y1 = f.y - 38; S.x2 = f.x + d * 140; S.y2 = f.y - 82; S.used = false; S.d = d;
      if (!K.onStage(c, S.x2, S.y2 + 40) || K.ray(c, S.x1, S.y1, Math.atan2(S.y2 - S.y1, S.x2 - S.x1), 110, true)) { S.x2 = f.x + d * 100; S.y2 = f.y - 38; }
      S.r1 = K.spawn(c, { k: 'ring', style: 'rift', x: S.x1, y: S.y1, r: 18, life: 90, oval: true, thin: true }); S.r2 = K.spawn(c, { k: 'ring', style: 'rift', x: S.x2, y: S.y2, r: 18, life: 90, oval: true, thin: true }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.used || S.r1.life <= 1) { if (S.used) { S.r1.life = 0; S.r2.life = 0; } K.end(c); return; }
      for (const arr of projArrays(f)) for (const p of arr) { if (!p || p.life <= 0 || p._rift || Math.abs(p.x - S.x1) > 20 || Math.abs(p.y - S.y1) > 34) continue; const sp = Math.hypot(p.vx || 0, p.vy || 0) || 8;
        p.life = 0; const q = { ...p, _rift: true, x: S.x2, y: S.y2, life: 40, vx: S.d * sp * 0.82, vy: -sp * 0.57 }; arr.push(q); S.used = true; ring(c, S.x2, S.y2, 'rift'); break; } } },

  scarlet: { name: 'Spectral Hand', cd: 480, second: true,                         // hand rises from below a nearby platform after a clear warning; a second press redirects it to another point
    press(c) { const f = c.f, S = c.S, d = fc(f); const x = f.x + d * 100, gy = K.groundY(c, x, f.y - 30, 250); if (gy == null || !K.onStage(c, x, gy)) return false; S.d = d; S.x = x; S.gy = gy; S.w = 22; S.ph = 'warn'; S.red = false;
      S.warn = K.spawn(c, { k: 'rect', style: 'warn', x: x - 18, y: gy - 4, w: 36, h: 4, life: 9999, hold: true }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (S.ph === 'warn') { S.warn.x = S.x - 18; S.warn.y = S.gy - 4; if (--S.w <= 0) { S.ph = 'rise'; S.t = 0; S.warn.life = 0; S.hand = K.spawn(c, { k: 'rect', style: 'hand', x: S.x - 17, y: S.gy - 62, w: 34, h: 62, life: 16 });
          for (const t of c.opps) if (K.rectHit(t, S.x - 19, S.gy - 64, 38, 66)) K.hit(f, t, { d: 6, kx: 0, ky: -8, hs: 14 }); } return; }
      if (S.ph === 'rise' && ++S.t > 18) K.end(c); },
    second(c) { const S = c.S; if (S.ph !== 'warn' || S.red) return; const nx = S.x + S.d * 90, gy = K.groundY(c, nx, S.gy - 40, 250); if (gy == null || !K.onStage(c, nx, gy)) return; S.red = true; S.x = nx; S.gy = gy; S.w = 20; } },

  white: { name: 'Featherfall Glide', cd: 540,                                    // angle down to speed up, up to slow the fall — no extra jumps, no invulnerability, never gains altitude; jump ends it with a burst
    press(c) { const f = c.f, S = c.S; S.y0 = f.y; S.t = 0; if (f.grounded) { f.vy = -3.5; f.grounded = false; } return true; },
    tick(c) { const f = c.f, S = c.S, d = fc(f); S.t++; const i = c.inputs; f._pwFx = { wings: true };
      const dir = i.left ? -1 : i.right ? 1 : d; f.facing = dir; const down = i.down, up = i.up;
      f.vx = dir * (down ? 6.6 : up ? 3.6 : 4.8); f.vy = down ? Math.min(5.2, f.vy + 0.3) : up ? 0.5 : 1.3; if (f.y < S.y0 - 6) f.y = S.y0 - 6;
      if ((c.jump && S.t > 3) || S.t > 120 || f.grounded) { f.vx = dir * 7; f.vy = Math.max(f.vy, 0); K.end(c); } } },

  silver: { name: 'Living Alloy', cd: 540, second: true,                           // metallic anchor ≤1 s (resists knockback, can't walk); second press releases a short forward slide
    press(c) { const f = c.f, S = c.S; S.t = 0; buff(f, 60, (g) => { g._pwB2 = g.knockbackTakenMul; g.knockbackTakenMul = (g.knockbackTakenMul || 1) * 0.15; }, (g) => { g.knockbackTakenMul = g._pwB2; }, { metal: true }); f._pwFx = { metal: true }; return true; },
    tick(c) { const f = c.f, S = c.S, d = fc(f); S.t++;
      if (S.slide > 0) { S.slide--; K.lock(c, 1); const b = K.ray(c, f.x, f.y - 30, d > 0 ? 0 : Math.PI, 18, true); if (!b) K.dashStep(c, f, d * 8.5, 0); else f.vx = 0;
        if (!S.h) for (const t of c.opps) if (K.bodyHit(t, f.x + d * 18, f.y - 35, 22)) { S.h = true; K.hit(f, t, { d: 5, kx: d * 6, ky: -3, hs: 12 }); } if (S.slide === 0) { f.vx = 0; if (!S.h) K.lock(c, 16); S.rec = 16; } return; }
      if (S.rec > 0) { if (--S.rec === 0) K.end(c); return; }
      c.inputs.left = c.inputs.right = false; f.vx *= 0.5; f._pwFx = { metal: true }; if (S.t >= 60) { K.end(c); } },
    second(c) { const S = c.S, f = c.f; if (S.slide > 0 || S.rec > 0) return; if (f._pwBuff && f._pwBuff.metal) { f._pwBuff.t = 1; } S.slide = 14; } },

  // ───────────── VILLAINS ─────────────
  corpent: { name: "Venom King's Gambit", cd: 600, second: true,                  // two daggers land; second press sends a cobra between them leaving a poisonous path (you can jump it; Corpent crosses safely)
    press(c) { const f = c.f, S = c.S, d = fc(f); const xs = [f.x + d * 90, f.x + d * 210]; S.pts = []; for (const x of xs) { const gy = K.groundY(c, x, f.y - 30, 250); if (gy == null || !K.onStage(c, x, gy)) return false; S.pts.push([x, gy]); }
      S.d1 = K.spawn(c, { k: 'marker', style: 'dagger', x: S.pts[0][0], y: S.pts[0][1] - 6, life: 180, r: 8 }); S.d2 = K.spawn(c, { k: 'marker', style: 'dagger', x: S.pts[1][0], y: S.pts[1][1] - 6, life: 180, r: 8 }); S.cob = false; return true; },
    tick(c) { const f = c.f, S = c.S; if (S.cob) { S.t++; if (S.t < 22) { const u = S.t / 22; S.cx = S.pts[0][0] + (S.pts[1][0] - S.pts[0][0]) * u; S.cy = S.pts[0][1] + (S.pts[1][1] - S.pts[0][1]) * u; }
        const lo = Math.min(S.pts[0][0], S.pts[1][0]) - 10, hi = Math.max(S.pts[0][0], S.pts[1][0]) + 10;
        for (const t of c.opps) if (t.grounded && t.x > lo && t.x < hi && !(t._pwDot && t._pwDot.t > 10) && !S.poisoned[K.pid(t)]) { S.poisoned[K.pid(t)] = 1; t._pwDot = { t: 120, rate: 0.1, left: 12 }; }
        if (S.t > 90) K.end(c); return; }
      if (!S.d1 || S.d1.life <= 1) K.end(c); },
    second(c) { const S = c.S; if (S.cob || !S.d1 || S.d1.life <= 0) return; S.cob = true; S.t = 0; S.poisoned = {}; S.d1.life = 90; S.d2.life = 90; S.cobra = K.spawn(c, { k: 'crack', style: 'cobra', pts: [[S.pts[0][0], S.pts[0][1]], [S.pts[1][0], S.pts[1][1]]], life: 90, wide: 6 }); } },

  magneto: { name: 'Iron Orbit', cd: 540, second: true,                           // 6 fragments orbit; deflect up to 3 small projectiles (not melee); power again launches the rest forward
    press(c) { const S = c.S; orbit(c, S, 6, 40, 'iron', 0.16); S.def = 0; return true; },
    tick(c) { const f = c.f, S = c.S; orbitTick(c, S);
      if (!S.thrown && S.def < 3) for (const o of c.opps) for (const arr of projArrays(o)) for (const p of arr) { if (!p || p.life <= 0 || p._def || p.super || p.heavy || Math.hypot(p.x - f.x, p.y - (f.y - 35)) > 48) continue; const pc = S.pieces.find((q) => q.life > 0); if (!pc) break; p._def = true; p.vx = -(p.vx || 0); p.vy = -(p.vy || 0); p.owner = f; pc.life = 0; S.def++; ring(c, p.x, p.y, 'iron', 3, 8); }
      if (c.pw.t > 120 || (S.thrown && !c.pw.ents.some((e) => e.proj)) || !S.pieces.some((p) => p.life > 0) && !c.pw.ents.some((e) => e.proj)) K.end(c); },
    second(c) { const S = c.S, f = c.f; if (S.thrown) return; S.thrown = true; launchPieces(c, S, fc(f) * 10, 0, 3.3, 10); } },

  willow: { name: 'Heartwood Reclamation', cd: 600, second: true,                 // seed → root (clear growth warning); power again: roots erupt in a fan + a brief raised platform (cannot seal anyone in)
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.x = f.x + fc(f) * 30; S.gy = f.y; S.t = 0; S.d = fc(f);
      S.seed = K.spawn(c, { k: 'marker', style: 'seed', x: S.x, y: S.gy, life: 150, r: 14, tag: 'seed' }); return true; },
    tick(c) { const S = c.S; S.t++; if (S.t === 30) S.seed.style = 'root'; if (S.seed.life <= 1 && !S.erupt) K.end(c); if (S.erupt && ++S.et > 22) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (S.erupt || S.t < 30) return; S.erupt = true; S.et = 0; S.seed.life = 0;
      for (let i = 0; i < 5; i++) { const a = (-70 + i * 35) * Math.PI / 180; K.spawn(c, { k: 'line', style: 'root', x1: S.x, y1: S.gy, x2: S.x + Math.sin(a) * 80 * S.d + 0, y2: S.gy - Math.cos(a) * 70, life: 20, wide: 5 }); }
      for (const t of c.opps) if (Math.hypot(t.x - S.x, (t.y - 30) - (S.gy - 30)) < 76 && t.y < S.gy + 20) K.hit(f, t, { d: 10, kx: (t.x >= S.x ? 1 : -1) * 4, ky: -8, hs: 16 });
      K.addSolid(c, { x: S.x - 28, y: S.gy - 38, w: 56, h: 10, life: 120, keep: true, style: 'root' }); } },

  cable: { name: 'Circuit Hijack', cd: 480, second: true,                         // node redirects the next eligible projectile back toward its sender; second press detonates it instead; destructible
    press(c) { const f = c.f, S = c.S, d = fc(f); const x = f.x + d * 100, gy = K.groundY(c, x, f.y - 30, 250); if (gy == null || !K.onStage(c, x, gy)) return false; S.x = x; S.y = gy - 14; S.used = false;
      S.n = K.spawn(c, { k: 'marker', style: 'node', x, y: S.y, life: 120, r: 14, tag: 'node' }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.n.life <= 1) { K.end(c); return; } if (K.struckBy(c, S.x, S.y, 14)) { S.n.life = 0; K.end(c, 300); return; }
      if (!S.used) for (const o of c.opps) for (const arr of projArrays(o)) for (const p of arr) { if (!p || p.life <= 0 || p._hj || p.super || p.heavy || Math.hypot(p.x - S.x, p.y - S.y) > 52) continue; const sp = Math.hypot(p.vx || 0, p.vy || 0) || 7, dx = o.x - p.x, dy = (o.y - 35) - p.y, L = Math.hypot(dx, dy) || 1; p.vx = dx / L * sp; p.vy = dy / L * sp; p._hj = true; p.owner = f; S.used = true; ring(c, S.x, S.y, 'bolt'); S.n.life = 20; break; } },
    second(c) { const f = c.f, S = c.S; if (!S.n || S.n.life <= 0) return; S.n.life = 0; ring(c, S.x, S.y, 'bolt', 4, 10); for (const t of c.opps) if (K.bodyHit(t, S.x, S.y, 44)) K.hit(f, t, { d: 5, kx: (t.x >= S.x ? 1 : -1) * 5, ky: -4, hs: 12 }); K.end(c); } },

  snodvor: { name: 'Permafrost Lock', cd: 540, second: true,                       // shard makes a frost patch (foes slide but steer); power again → short ice pillar, no stun-lock
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d; S.x = f.x + d * 20; S.y = f.y - 40; S.land = false;
      S.sh = K.proj(c, { style: 'ice', x: S.x, y: S.y, vx: d * 8, vy: 3.2, r: 8, life: 40, harmless: true, onWall: () => { }, hold: false }); S.sh.update = (cc, e) => { const gy = K.groundY(cc, e.x, e.y - 8, 60); if (!S.land && gy != null && e.y >= gy - 4) { S.land = true; S.px = e.x; S.py = gy; e.life = 0; S.p = K.spawn(cc, { k: 'rect', style: 'frost', x: S.px - 60, y: S.py - 4, w: 120, h: 4, life: 150 }); } }; return true; },
    tick(c) { const f = c.f, S = c.S; if (S.p && S.p.life > 0) { for (const t of c.opps) if (t.grounded && Math.abs(t.x - S.px) < 62 && Math.abs(t.y - S.py) < 12) t.vx += S.d * 0.3; }
      if (S.pil && --S.pt <= 0) K.end(c); if (!S.land && S.sh.life <= 0) K.end(c); if (S.p && S.p.life <= 1 && !S.pil) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (!S.land || S.pil || !S.p || S.p.life <= 0) return; S.pil = true; S.pt = 12; S.p.life = 0; K.spawn(c, { k: 'rect', style: 'ice', x: S.px - 20, y: S.py - 90, w: 40, h: 90, life: 12 });
      for (const t of c.opps) if (K.rectHit(t, S.px - 22, S.py - 92, 44, 94)) K.hit(f, t, { d: 8, kx: (t.x >= S.px ? 1 : -1) * 2, ky: -10, hs: 16 }); } },

  kirsten: { name: 'Phoenix Brand', cd: 540, second: true,                         // flame bird leaves a brand on the surface it reaches; second press sweeps a phoenix flame across the brand (no tracking, once per target)
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d;
      const mark = (cc, e) => { if (S.bx != null) return; S.bx = e.x; const gy = K.groundY(cc, e.x, e.y - 20, 300); S.by = gy ?? e.y; S.br = K.spawn(cc, { k: 'marker', style: 'brand', x: S.bx, y: S.by - 6, life: 120, r: 16, tag: 'brand' }); };
      K.proj(c, { style: 'bird', x: f.x + d * 20, y: f.y - 40, vx: d * 7, r: 11, life: 34, onHit: (cc, e, t) => { K.hit(cc.f, t, { d: 4, kx: d * 4, ky: -3, hs: 10 }); mark(cc, e); e.life = 0; }, onWall: mark, onEnd: (cc, e) => mark(cc, e) }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.sw > 0) { S.sw--; const u = 1 - S.sw / 18, x = S.bx - 50 + 100 * u * S.d + (S.d < 0 ? 100 : 0) * 0; const cx = S.bx + (u - 0.5) * 100 * S.d; for (const t of c.opps) if (!S.sh[K.pid(t)] && K.bodyHit(t, cx, S.by - 30, 34)) { S.sh[K.pid(t)] = 1; K.hit(f, t, { d: 9, kx: S.d * 3, ky: -8, hs: 16 }); } if (S.sw === 0) K.end(c); return; }
      if (S.bx == null) { if (c.pw.t > 60) K.end(c); return; } if (S.br && S.br.life <= 1) K.end(c); },
    second(c) { const S = c.S; if (S.bx == null || S.sw > 0 || !S.br || S.br.life <= 0) return; S.sw = 18; S.sh = {}; K.spawn(c, { k: 'arc', style: 'flame', x: S.bx, y: S.by - 30, dir: S.d, r: 56, life: 18, wide: true }); } },

  volt: { name: 'Harmonic Break', cd: 480, second: true,                          // three expanding rings; power again collapses them into one concentrated burst; each foe can take damage only once per use
    press(c) { const f = c.f, S = c.S; S.hits = {}; S.rings = [-18, -40, -62].map((dy) => K.spawn(c, { k: 'ring', style: 'sound', x: f.x, y: f.y + dy, r: 8, life: 48, thin: true, grow: 1.7, dy })); S.col = false; return true; },
    tick(c) { const f = c.f, S = c.S; for (const r of S.rings) if (r.life > 0) { r.x = f.x; r.y = f.y + r.dy;
        for (const t of c.opps) { if (!S.hits[K.pid(t)] && Math.abs(Math.hypot(t.x - r.x, (t.y - 35) - r.y) - r.r) < 16) { S.hits[K.pid(t)] = 1; K.hit(f, t, { d: 4, kx: (t.x >= f.x ? 1 : -1) * 4, ky: -3, hs: 10 }); }
          for (const arr of projArrays(t)) for (const p of arr) if (p && p.life > 0 && !p.super && !p.heavy && Math.abs(Math.hypot(p.x - r.x, p.y - r.y) - r.r) < 14) p.life = 0; } }
      if (S.col) { if (--S.cw === 0) { ring(c, f.x, f.y - 35, 'sound', 5, 12, 20); for (const t of c.opps) if (K.bodyHit(t, f.x, f.y - 35, 56) && !S.hits[K.pid(t)]) { S.hits[K.pid(t)] = 1; K.hit(f, t, { d: 8, kx: (t.x >= f.x ? 1 : -1) * 6, ky: -4, hs: 14 }); } K.end(c); } return; }
      if (!S.rings.some((r) => r.life > 0)) K.end(c); },
    second(c) { const S = c.S; if (S.col) return; S.col = true; S.cw = 12; S.rings.forEach((r) => (r.life = 0)); K.spawn(c, { k: 'ring', style: 'sound', x: c.f.x, y: c.f.y - 35, r: 50, grow: -3.5, life: 12, thin: true }); K.lock(c, 6); } },

  temple: { name: 'Ruin Reversal', cd: 540, second: true,                         // broken stone arch: brief cover (blocks projectiles, never traps); power again shatters it into a forward fan
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.x = f.x + S.d * 56; S.gy = f.y; S.a = K.spawn(c, { k: 'rect', style: 'arch', x: S.x - 34, y: S.gy - 74, w: 68, h: 74, life: 120 }); return true; },
    tick(c) { const S = c.S; if (S.a.life <= 1) { K.end(c); return; } for (const o of c.opps) for (const arr of projArrays(o)) for (const p of arr) if (p && p.life > 0 && !p.super && p.x > S.x - 34 && p.x < S.x + 34 && p.y > S.gy - 74 && p.y < S.gy) p.life = 0; },
    second(c) { const S = c.S; if (!S.a || S.a.life <= 0) return; S.a.life = 0; [-26, -13, 0, 13, 26].forEach((a) => { const r = a * Math.PI / 180; K.proj(c, { style: 'stone', x: S.x + S.d * 20, y: S.gy - 40, vx: Math.cos(r) * 8 * S.d, vy: Math.sin(r) * 8 - 1, r: 7, life: 26, d: 4, kx: 4, ky: -3, hs: 10 }); }); K.end(c, 540); } },

  nightmare: { name: 'Dream Fracture', cd: 540, second: true,                       // two silhouettes (one real, with a clear cue); power again sends the real one through with ONE shadow slash
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d; S.real = (f.frame || 0) % 2; S.xs = [f.x + d * 60, f.x + d * 120]; for (const x of S.xs) if (!K.free(c, x, f.y)) return false; S.sil = S.xs.map((x, i) => K.spawn(c, { k: 'clone', style: 'dream', x, y: f.y, facing: d, life: 120, r: 18, cue: i === S.real })); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.dash > 0) { S.dash--; const r = S.sil[S.real]; const nx = r.x + S.d * 10; if (K.free(c, nx, f.y) && !K.ray(c, r.x, f.y - 35, S.d > 0 ? 0 : Math.PI, 14, true)) r.x = nx; K.spawn(c, { k: 'trail', style: 'dream', x: r.x, y: f.y - 35, life: 8, w: 18 });
        if (!S.h) for (const t of c.opps) if (K.bodyHit(t, r.x + S.d * 14, f.y - 35, 24)) { S.h = true; K.hit(f, t, { d: 8, kx: S.d * 8, ky: -4, hs: 16 }); K.spawn(c, { k: 'arc', style: 'dream', x: r.x, y: f.y - 36, dir: S.d, r: 38, life: 8 }); }
        if (S.dash === 0) { r.life = 0; K.end(c); } return; } if (S.sil[0].life <= 1) K.end(c); },
    second(c) { const S = c.S; if (S.dash > 0 || S.sil[S.real].life <= 0) return; S.sil[1 - S.real].life = 0; S.dash = 12; } },

  hazel: { name: 'Webline Slingshot', cd: 540, second: true,                       // web between two valid surfaces: jump to sling forward along it; power again snaps it into a fan of sticky strands
    press(c) { const f = c.f, S = c.S, d = fc(f); const a = K.ray(c, f.x + d * 30, f.y - 20, Math.PI / 2, 120, false); const b = K.ray(c, f.x + d * 30, f.y - 50, d > 0 ? -0.5 : Math.PI + 0.5, 270, false);
      if (!a || !b) return false; S.ax = a.x; S.ay = a.y; S.bx = b.x; S.by = b.y; S.d = d; S.w = K.spawn(c, { k: 'line', style: 'web', x1: S.ax, y1: S.ay, x2: S.bx, y2: S.by, life: 120, wide: 3 }); return true; },
    onHit(c) { if (c.S.w) c.S.w.life = 0; K.end(c, 300); },
    tick(c) { const f = c.f, S = c.S; if (S.sling > 0) { S.sling--; K.lock(c, 1); K.setMove(f, S.sx, S.sy); if (S.sling === 0) { f.vx = S.sx * 0.5; f.vy = S.sy * 0.4; K.end(c); } return; } if (S.w.life <= 1) { K.end(c); return; }
      if (c.jump && Math.abs(f.x - S.ax) < 70 && Math.abs(f.y - S.ay) < 80 && !S.snapped) { const dx = S.bx - f.x, dy = (S.by + 40) - f.y, L = Math.hypot(dx, dy) || 1; S.sx = dx / L * 11; S.sy = dy / L * 11; S.sling = Math.min(18, Math.ceil(L / 11)); S.w.life = 14; f.grounded = false; } },
    second(c) { const f = c.f, S = c.S; if (S.snapped || S.sling > 0) return; S.snapped = true; S.w.life = 0; const mx = (S.ax + S.bx) / 2, my = (S.ay + S.by) / 2;
      [-0.25, -0.08, 0.08, 0.25].forEach((a) => { const base = S.d > 0 ? 0 : Math.PI; K.proj(c, { style: 'web', x: mx, y: my, vx: Math.cos(base + a) * 8, vy: Math.sin(base + a) * 8, r: 6, life: 30, d: 2, hitStyle: 'slow', onHit: (cc, e, t) => { K.hit(cc.f, t, { d: 2, kx: 0, ky: 0, slow: 80, slowMul: 0.5 }); e.life = 0; } }); }); K.end(c, 540); } },

  whami: { name: 'Elixir Overdrive', cd: 600, second: true,                          // exactly 3 s of one fixed boost (no stacking); power again splashes the remaining elixir and ends the buff
    press(c) { const f = c.f; const ok = buff(f, 180, (g) => { g._pwB3 = g.speedBoost; g.speedBoost = (g.speedBoost || 1) * 1.3; }, (g) => { g.speedBoost = g._pwB3; }, { aura: '#c28a32' }); if (!ok) return false; ring(c, f.x, f.y - 35, 'potion'); c.S.t = 0; return true; },
    tick(c) { if (++c.S.t >= 180) K.end(c); },
    second(c) { const f = c.f, d = fc(f); if (f._pwBuff) { f._pwBuff.t = 1; } ring(c, f.x + d * 30, f.y - 35, 'potion', 4, 10, 14); for (const t of c.opps) if (K.rectHit(t, d > 0 ? f.x : f.x - 56, f.y - 70, 56, 70)) K.hit(f, t, { d: 5, kx: d * 3, ky: -2, slow: 40, slowMul: 0.6, hs: 10 }); K.end(c); } },

  controller: { name: 'Puppet Dominion', cd: 480, second: true,                       // three strings tug foes (never full control); power again snaps them into a converging strike
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d; S.tx = f.x + d * 150; S.ty = f.y - 30; S.ls = [-0.2, 0, 0.2].map((a) => { const ang = (d > 0 ? 0 : Math.PI) + a * d; const w = K.ray(c, f.x, f.y - 40, ang, 200, true); const L = w ? w.t : 200; return K.spawn(c, { k: 'line', style: 'string', x1: f.x, y1: f.y - 40, x2: f.x + Math.cos(ang) * L, y2: f.y - 40 + Math.sin(ang) * L, life: 60, wide: 2 }); });
      for (const t of c.opps) for (const l of S.ls) { const dx = l.x2 - l.x1, dy = l.y2 - l.y1, L2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((t.x - l.x1) * dx + ((t.y - 35) - l.y1) * dy) / L2)); if ((l.x1 + dx * u - t.x) ** 2 + (l.y1 + dy * u - (t.y - 35)) ** 2 < 26 * 26 && !S.tug) { S.tug = true; const nx = t.x - d * 6; if (nx > 40 && nx < c.W - 40) { t.vx = -d * 6; t.vy = -2; } } } return true; },
    onHit(c) { c.S.ls.forEach((l) => (l.life = 0)); K.end(c, 300); },
    tick(c) { const f = c.f, S = c.S; S.ls.forEach((l) => { l.x1 = f.x; l.y1 = f.y - 40; }); if (S.sn > 0 && --S.sn === 0) { ring(c, S.tx, S.ty, 'string', 4, 10, 14); for (const t of c.opps) if (K.bodyHit(t, S.tx, S.ty, 40)) K.hit(f, t, { d: 7, kx: (t.x >= S.tx ? 1 : -1) * 4, ky: -5, hs: 14 }); K.end(c); } if (c.pw.t > 70 && !S.sn) K.end(c); },
    second(c) { const S = c.S; if (S.sn || c.pw.t > 60) return; S.sn = 8; S.ls.forEach((l) => { l.x2 = S.tx; l.y2 = S.ty; l.life = 10; }); } },

  evil: { name: 'Void Singularity', cd: 600, second: true,                            // sphere gently pulls foes (never offstage, no repeated ticks); power again collapses it after a visible 0.3 s warning
    press(c) { const f = c.f, S = c.S, d = fc(f); S.x = f.x + d * 110; S.y = f.y - 42; S.pull = {}; S.o = K.spawn(c, { k: 'orb', style: 'void', x: S.x, y: S.y, r: 14, life: 120, hold: false }); S.col = 0; return true; },
    tick(c) { const f = c.f, S = c.S; S.o.r = 14 + (c.pw.t > 60 ? 4 : 0) + (S.col ? 8 : 0);
      if (S.col > 0) { if (--S.col === 0) { ring(c, S.x, S.y, 'void', 5, 12, 20); S.o.life = 0; for (const t of c.opps) if (K.bodyHit(t, S.x, S.y, 70)) K.hit(f, t, { d: 12, kx: (t.x >= S.x ? 1 : -1) * 6, ky: -6, hs: 18 }); K.end(c); } return; }
      for (const t of c.opps) { const dx = S.x - t.x, dy = S.y - (t.y - 35), L = Math.hypot(dx, dy); const used = S.pull[K.pid(t)] || 0; if (L < 130 && L > 14 && used < 70 && t.x > 90 && t.x < c.W - 90 && K.groundY(c, t.x, t.y - 20, 300) != null) { const px = dx / L * 0.13; t.vx += px; t.vy += dy / L * 0.05; S.pull[K.pid(t)] = used + Math.abs(px) * 10; } }
      if (S.o.life <= 1) K.end(c); },
    second(c) { const S = c.S; if (S.col || !S.o || S.o.life <= 0) return; S.col = 18; ring(c, S.x, S.y, 'void', -3, 18, 70); } },

  // ───────────── GUARDIANS ─────────────
  life: { name: 'Worldroot Recall', cd: 600, second: true,                            // seed → roots make a platform; power again calls them back in a bloom that shoves foes away and shields nearby allies
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.x = f.x; S.gy = f.y; const x0 = Math.max(10, S.x - 55), x1 = Math.min(c.W - 10, S.x + 55);
      S.p = K.addSolid(c, { x: x0, y: S.gy - 4, w: x1 - x0, h: 12, life: 150, style: 'root' }); K.spawn(c, { k: 'marker', style: 'seed', x: S.x, y: S.gy, life: 20, r: 12 }); return true; },
    tick(c) { const S = c.S; if (S.bl && --S.bl <= 0) K.end(c); if (!S.bl && S.p.life <= 1) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (S.bl) return; S.bl = 14; K.dropSolid(f, S.p); ring(c, S.x, S.gy - 30, 'life', 4, 14, 20); for (const t of c.opps) if (Math.hypot(t.x - S.x, t.y - S.gy) < 90) K.hit(f, t, { d: 6, kx: (t.x >= S.x ? 1 : -1) * 8, ky: -4, hs: 12 });
      (f._allies || []).forEach((a) => Math.hypot(a.x - S.x, a.y - S.gy) < 110 && K.shield(a, 0.15, 120)); } },

  death: { name: 'The Final Interval', cd: 600, second: true,                          // grey sphere slowly draws foes in; power again collapses it into a ring of silence that cancels WEAK attacks and pushes away (heavies still work)
    press(c) { const f = c.f, S = c.S, d = fc(f); S.x = f.x + d * 100; S.y = f.y - 42; S.pull = {}; S.o = K.spawn(c, { k: 'orb', style: 'death', x: S.x, y: S.y, r: 16, life: 120, hold: false }); S.col = 0; S.ringR = 0; return true; },
    tick(c) { const f = c.f, S = c.S;
      if (S.col) { S.ringR += 6; const rr = S.ringR; for (const t of c.opps) { const dist = Math.hypot(t.x - S.x, (t.y - 35) - S.y); if (dist < rr + 14 && !S.pull['h' + K.pid(t)]) { S.pull['h' + K.pid(t)] = 1; K.hit(f, t, { d: 10, kx: (t.x >= S.x ? 1 : -1) * 7, ky: -4, hs: 14 }); }
          if (dist < rr + 20 && t.attackData && !K.isHeavyAtk(t.attackData) && !t.attackData.isNormalPower) { t.attackData = null; t.attackTimer = 0; t.attackHold = null; } } if (S.ringR >= 110) K.end(c); return; }
      for (const t of c.opps) { const dx = S.x - t.x, L = Math.hypot(dx, S.y - (t.y - 35)); const used = S.pull[K.pid(t)] || 0; if (L < 120 && L > 16 && used < 60 && t.x > 90 && t.x < c.W - 90 && K.groundY(c, t.x, t.y - 20, 300) != null) { const px = dx / L * 0.09; t.vx += px; S.pull[K.pid(t)] = used + Math.abs(px) * 10; } }
      if (S.o.life <= 1) K.end(c); },
    second(c) { const S = c.S; if (S.col || !S.o || S.o.life <= 0) return; S.col = true; S.o.life = 0; ring(c, S.x, S.y, 'death', 6, 20, 16); } },

  mercy: { name: 'Equilibrium Bloom', cd: 600, second: true,                           // floating ring protects allies inside; power again collapses it into a balanced wave (no invulnerability, no stacking)
    press(c) { const f = c.f, S = c.S; S.x = f.x + fc(f) * 30; S.y = f.y - 46; S.r = K.spawn(c, { k: 'ring', style: 'mercy', x: S.x, y: S.y, r: 70, life: 180, thin: true }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.bl && --S.bl <= 0) K.end(c); if (!S.bl) { S.r.x = S.x = f.x + fc(f) * 30; S.r.y = S.y = f.y - 46; (f._allies || []).forEach((a) => Math.hypot(a.x - S.x, a.y - S.y) < 72 && K.shield(a, 0.1, 15)); if (S.r.life <= 1) K.end(c); } },
    second(c) { const f = c.f, S = c.S; if (S.bl) return; S.bl = 12; S.r.life = 0; ring(c, S.x, S.y, 'mercy', 6, 12, 40); for (const t of c.opps) if (Math.hypot(t.x - S.x, (t.y - 35) - S.y) < 92) K.hit(f, t, { d: 5, kx: (t.x >= S.x ? 1 : -1) * 7, ky: -3, hs: 10 });
      (f._allies || []).forEach((a) => Math.hypot(a.x - S.x, a.y - S.y) < 100 && K.shield(a, 0.15, 120)); } },
};
// ability-private init hooks (Maroon's shoot closure is created per activation)
for (const k of Object.keys(DEFS3)) { const d = DEFS3[k]; if (d.init) { const p = d.press; d.press = function (c) { d.init(c.S); return p(c); }; } }
