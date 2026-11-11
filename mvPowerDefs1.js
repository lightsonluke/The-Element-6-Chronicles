// mvPowerDefs1.js — power abilities, Generation I and II (18).  Mechanics follow the ability design document.
import * as K from './mvPowerKit.js';
import { grapple, swapMarker, returnMarker } from './mvPowerFam.js';
const fc = K.face;
const MARK = (c, x, y, style, life, extra = {}) => K.spawn(c, { k: 'marker', style, x, y, life, r: 20, ...extra });

export const DEFS1 = {
  // ───────────── GEN I ─────────────
  g1_thunder: { name: 'Lightning Relay', cd: 480, second: true,           // mark → optional dash along it; opponent touching the mark triggers a small hit and removes it
    press(c) { const f = c.f, S = c.S, x = f.x + fc(f) * 130, gy = K.groundY(c, x, f.y - 30, 200);
      if (gy == null || !K.onStage(c, x, gy) || x < 0 || x > c.W) return false;                       // cannot be placed offstage
      S.mk = MARK(c, x, gy, 'bolt', 120, { tag: 'mk' }); S.mx = x; S.my = gy; return true; },
    onHit(c) { if (!c.S.dash) K.end(c, 300); },
    second(c) { const S = c.S; if (!S.mk || S.mk.life <= 0 || S.wind != null || S.dash) return; S.wind = 6; K.lock(c, 6); },
    tick(c) { const f = c.f, S = c.S;
      if (S.mk && S.mk.life > 0 && !S.dash) for (const t of c.opps) if (Math.abs(t.x - S.mx) < 26 && Math.abs(t.y - S.my) < 40) { K.hit(f, t, { d: 5, kx: (t.x >= S.mx ? 1 : -1) * 3, ky: -5, hs: 14 }); S.mk.life = 0; K.end(c, 360); return; }
      if (S.wind != null && S.wind > 0) { S.wind--; K.lock(c, 1); if (f.state === 'hitstun') { K.end(c, 300); return; } if (S.wind === 0) { S.dash = 8; S.dx = (S.mx - f.x) / 8; } }
      if (S.dash > 0) { S.dash--; K.lock(c, 1); K.dashStep(c, f, S.dx, 0); K.spawn(c, { k: 'ring', style: 'bolt', x: f.x, y: f.y - 35, r: 4, grow: 3, life: 6 }); if (S.dash === 0) { if (S.mk) S.mk.life = 0; f.vx = 0; K.end(c); } }
      if (!S.dash && S.wind == null && (!S.mk || S.mk.life <= 0)) K.end(c); } },

  g1_fire: { name: 'Phoenix Kickback', cd: 540,                              // diagonal flame kick; hit = impact, miss = brief slower fall
    press(c) { const S = c.S, f = c.f; S.up = c.inputs.down ? -1 : 1; S.t = 0; S.hit = false; K.lock(c, 5); return true; },
    tick(c) { const f = c.f, S = c.S, d = fc(f); S.t++;
      if (S.t <= 5) { return; }
      if (S.t <= 19 && !S.hit) { K.lock(c, 1); f.grounded = false; K.dashStep(c, f, d * 8.5, -S.up * 5.6);
        const hx = f.x + d * 30, hy = f.y - 30 - S.up * 8;
        K.spawn(c, { k: 'orb', style: 'flame', x: hx, y: hy, r: 8, life: 4 });
        for (const t of c.opps) if (K.bodyHit(t, hx, hy, 17)) { K.hit(c.f, t, { d: 7, kx: d * 6, ky: -S.up * 4 - 2, hs: 16 }); S.hit = true; K.spawn(c, { k: 'ring', style: 'flame', x: hx, y: hy, r: 8, grow: 3, life: 8 }); f.vx *= 0.3; f.vy = Math.min(f.vy, -3); break; } }
      else if (!S.hit && S.t <= 49) { f.vy = Math.min(f.vy, 2.4); if (S.t === 20) K.lock(c, 16); }                 // miss: brief air-control, no new attack
      else K.end(c); } },

  g1_water: { name: 'Tide Surf', cd: 480,                                      // moving water platform you can ride, angle down, or jump off
    press(c) { const f = c.f, S = c.S; S.dir = fc(f); S.t = 0; S.turn = 0;
      S.p = K.addSolid(c, { x: f.x - 42, y: f.y + 2, w: 84, h: 12, life: 9999, persist: true, style: 'water' }); S.vy = 0; return true; },
    tick(c) { const f = c.f, S = c.S, p = S.p; S.t++;
      const want = c.inputs.left ? -1 : c.inputs.right ? 1 : 0;
      if (want && want !== S.dir) { if (++S.turn > 18) { S.dir = want; S.turn = 0; } } else S.turn = 0;           // turning around is not instantaneous
      const sp = S.turn > 0 ? 1.5 : 5.2; S.vy = c.inputs.down ? 2.2 : 0;
      const nx = p.x + S.dir * sp, ny = p.y + S.vy; const ahead = K.ray(c, S.dir > 0 ? nx + p.w : nx, ny - 20, S.dir > 0 ? 0 : Math.PI, 6, true);
      if (!ahead && nx > -30 && nx + p.w < c.W + 30) { p.x = nx; p.y = ny; }
      const riding = Math.abs(f.x - (p.x + p.w / 2)) < p.w / 2 + 4 && f.y >= p.y - 14 && f.y <= p.y + 22 && f.vy >= -1;
      if (riding) { f.y = p.y; f.vy = 0; f.grounded = true; f.x += (p.x + p.w / 2 + 0 - f.x) * 0.15 + S.dir * 0; f.x += S.dir * sp * 0.0; f.x = f.x + (S.dir * sp); }
      c.f._pwFx = { wave: true };
      for (const t of c.opps) if (K.rectHit(t, S.dir > 0 ? p.x + p.w - 14 : p.x - 6, p.y - 60, 20, 60)) { t.vx = S.dir * 7; t.vy = Math.min(t.vy, -2); t.x += S.dir * 3; }      // leading wave pushes aside, never traps
      K.spawn(c, { k: 'trail', style: 'water', x: p.x + p.w / 2, y: p.y + 4, life: 10, w: p.w });
      if ((c.jump && riding) || S.t > 90 || (!riding && S.t > 8)) { if (c.jump) f.vy = -9; K.dropSolid(f, p); K.end(c); } } },

  g1_grass: { name: 'Seedling Spring', cd: 540,                               // seed → plant (launches you, or tosses an opponent standing on it)
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.x = f.x; S.y = f.y; S.grow = 42;
      S.seed = K.spawn(c, { k: 'marker', style: 'seed', x: S.x, y: S.y, life: 9999, hold: true, r: 14, tag: 'seed' }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (S.seed && S.grow > 0) { if (K.struckBy(c, S.x, S.y - 8, 14)) { S.seed.life = 0; K.end(c, 300); return; } if (--S.grow === 0) { S.seed.life = 0; S.plant = K.spawn(c, { k: 'marker', style: 'plant', x: S.x, y: S.y, life: 40, r: 22, tag: 'plant' }); S.pl = 0;
          const near = c.opps.filter((t) => Math.abs(t.x - S.x) < 30 && Math.abs(t.y - S.y) < 20);
          if (near.length) near.forEach((t) => K.hit(f, t, { d: 3, kx: (t.x >= S.x ? 1 : -1) * 8, ky: -8, hs: 16 }));
          if (Math.abs(f.x - S.x) < 30 && Math.abs(f.y - S.y) < 24) { f.vy = -13; f.grounded = false; } } }
      if (S.plant) { if (--S.plant.life <= 0) K.end(c); } } },

  g1_ice: { name: 'Glacier Skate', cd: 540,                                  // frozen strip → fast slide; opponents on it slide but keep steering
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.t = 0; S.x0 = f.x; S.dir = fc(f); K.lock(c, 10); return true; },
    onHit(c) { if (c.S.t < 10) K.end(c, 300); },
    tick(c) { const f = c.f, S = c.S, d = S.dir; S.t++;
      if (S.t === 10) { const L = 220, gx = d > 0 ? f.x : f.x - L; S.strip = K.spawn(c, { k: 'rect', style: 'ice', x: gx, y: f.y - 3, w: L, h: 5, life: 130 }); S.sx = gx; S.sw = L; }
      if (S.t > 10 && S.t <= 38) { K.lock(c, 1); const b = K.ray(c, f.x, f.y - 30, d > 0 ? 0 : Math.PI, 14, true); if (!b && K.onStage(c, f.x + d * 8, f.y)) K.dashStep(c, f, d * 8, 0); else f.vx = 0; }
      if (S.t === 39) { if (c.inputs.jump || f.vx !== 0) { f.vy = -9; f.vx = d * 5.5; f.grounded = false; } }                // kicks up a ramp to jump away
      if (S.strip) for (const t of c.opps) if (t.grounded && t.x > S.sx && t.x < S.sx + S.sw && Math.abs(t.y - f.y) < 12 && S.t < 120) t.vx += d * 0.35;
      if (S.t > 40 && (!S.strip || S.strip.life <= 1)) K.end(c); } },

  // ───────────── GEN II ─────────────
  g2_renji: { ...grapple({ name: 'Iron Anchor', cd: 540, ang: 18, len: 250, startup: 8, mode: 'auto', second: 'retract', speed: 9, style: 'chain', retractHit: 8 }) },

  g2_kaito: { name: 'Ember Afterimage', cd: 480,                              // dash leaves a flame silhouette that repeats the slash 0.5 s later
    press(c) { const f = c.f, S = c.S; S.x0 = f.x; S.y0 = f.y; S.d = fc(f); S.dl = 8; S.t = 0;
      S.sil = K.spawn(c, { k: 'clone', style: 'flame', x: f.x, y: f.y, facing: S.d, life: 9999, hold: true, r: 18 }); return true; },
    tick(c) { const f = c.f, S = c.S; S.t++;
      if (S.dl > 0) { S.dl--; K.lock(c, 1); const b = K.ray(c, f.x, f.y - 35, S.d > 0 ? 0 : Math.PI, 28, true); if (!b) K.dashStep(c, f, S.d * 13, 0); else f.vx = 0; if (S.dl === 0) f.vx = S.d * 2; }
      if (S.t === 30) { const sx = S.x0 + S.d * 34; S.slash = true; K.spawn(c, { k: 'arc', style: 'flame', x: S.x0, y: S.y0 - 38, dir: S.d, r: 38, life: 7 });
        for (const t of c.opps) if (K.bodyHit(t, sx, S.y0 - 36, 30)) K.hit(f, t, { d: 6, kx: S.d * 6, ky: -3, hs: 14 }); S.sil.life = 8; S.sil.hold = false; }
      if (S.t > 40) K.end(c); } },

  g2_hana: { name: 'Water Mirror', cd: 420, second: true,                    // reflects ONE projectile at a shallow angle; otherwise a second press bursts it forward as a wave
    press(c) { const f = c.f, S = c.S; S.mx = f.x + fc(f) * 42; S.my = f.y; S.d = fc(f);
      S.m = K.spawn(c, { k: 'rect', style: 'mirror', x: S.mx - 3, y: S.my - 64, w: 6, h: 64, life: 180 }); return true; },
    tick(c) { const S = c.S, f = c.f; if (!S.m || S.m.life <= 1) { if (!S.wave) K.end(c); }
      if (S.m && S.m.life > 0) for (const o of c.opps) for (const arr of [o.projectiles, o.genProjectiles, o._pw && o._pw.ents]) { if (!arr) continue;
        for (const p of arr) { if (!p || p._mirrored || p.life <= 0 || p.super || p.isSuper || p.heavy) continue; const px = p.x, py = p.y;
          if (Math.abs(px - S.mx) < 14 && py > S.my - 72 && py < S.my + 8 && (p.vx !== undefined)) { p._mirrored = true; p.vx = -p.vx * 0.9; p.vy = -Math.abs(p.vx) * 0.22; p.owner = f; p.reflectedBy = f; S.m.life = 0;
            K.spawn(c, { k: 'ring', style: 'water', x: S.mx, y: S.my - 32, r: 6, grow: 3, life: 10 }); K.end(c); return; } } } },
    second(c) { const S = c.S, f = c.f; if (!S.m || S.m.life <= 0 || S.wave) return; S.m.life = 0; S.wave = true;
      K.proj(c, { style: 'water', x: S.mx, y: S.my - 30, vx: S.d * 6, r: 20, life: 50, d: 6, kx: 5, ky: -2, hs: 12, pierce: true, onEnd: () => K.end(c) }); } },

  g2_daigo: { name: 'Faultline Step', cd: 540,                                // crack races along connected ground; at an edge it rises into a stone step; passing under a foe bumps them
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.x = f.x; S.y = f.y; S.d = fc(f); S.pts = [[f.x, f.y]]; S.dist = 0; S.done = false; K.lock(c, 6);
      S.crack = K.spawn(c, { k: 'crack', style: 'stone', pts: S.pts, life: 120 }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (!S.done && c.pw.t > 6) { for (let i = 0; i < 2 && !S.done; i++) { const nx = S.x + S.d * 4.5, gy = K.groundY(c, nx, S.y - 14, 30);
          if (gy == null || Math.abs(gy - S.y) > 14 || K.ray(c, S.x, S.y - 14, S.d > 0 ? 0 : Math.PI, 8, true)) {
            S.done = true; if (gy == null && K.onStage(c, S.x, S.y)) { S.step = K.addSolid(c, { x: S.x - 4 + (S.d > 0 ? 0 : -50), y: S.y - 36, w: 58, h: 14, life: 150, keep: true, style: 'stone' }); K.spawn(c, { k: 'ring', style: 'stone', x: S.x, y: S.y - 20, r: 6, grow: 3, life: 10 }); } break; }
          S.x = nx; S.y = gy; S.dist += 4.5; S.pts.push([S.x, S.y]);
          for (const t of c.opps) if (!S.crack.hit[K.pid(t)] && t.grounded && Math.abs(t.x - S.x) < 20 && Math.abs(t.y - S.y) < 16) { S.crack.hit[K.pid(t)] = 1; K.hit(f, t, { d: 2, kx: 0, ky: -6.5, hs: 9 }); }
          if (S.dist >= 260) S.done = true; } }
      if (c.pw.t > 140 || (S.done && c.pw.t > 60 && !S.step)) K.end(c); } },

  g2_suzu: { ...grapple({ name: 'Wind Thread', cd: 540, ang: 22, len: 260, startup: 12, mode: 'zip', second: 'zip', speed: 11, style: 'wind' }) },
  g2_mai: swapMarker({ name: 'Shadow Swap', cd: 420, dash: 90, dashFrames: 6, window: 120, style: 'shadow' }),

  g2_osamu: { name: 'Echo Return', cd: 420,                                   // pulse out (reveals), pulse back (ring interrupts ONE projectile or weak attack)
    press(c) { const f = c.f, S = c.S; S.d = fc(f); S.x = f.x + S.d * 20; S.y = f.y - 38; S.ox = S.x; S.ph = 'out'; S.used = false;
      S.p = K.spawn(c, { k: 'orb', style: 'sound', x: S.x, y: S.y, r: 14, life: 9999, hold: true }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (S.ph === 'out') { S.x += S.d * 7; S.p.x = S.x; for (const t of c.opps) if (Math.abs(t.x - S.x) < 120 && Math.abs(t.y - f.y) < 100) t._pwRevealed = 60;
        for (const t of c.opps) if (!S.p.hit[K.pid(t)] && K.bodyHit(t, S.x, S.y, 14)) { S.p.hit[K.pid(t)] = 1; K.hit(f, t, { d: 2, kx: S.d * 2, ky: -1, hs: 6 }); }
        if (Math.abs(S.x - S.ox) > 150 || K.ray(c, S.x - S.d * 7, S.y, S.d > 0 ? 0 : Math.PI, 8, true)) { S.ph = 'back'; S.p.style = 'sound'; S.ring = K.spawn(c, { k: 'ring', style: 'sound', x: S.x, y: S.y, r: 24, life: 9999, hold: true, thin: true }); } }
      else { S.x -= S.d * 7; S.p.x = S.x; if (S.ring) { S.ring.x = S.x; }
        if (!S.used) { for (const o of c.opps) { for (const arr of [o.projectiles, o.genProjectiles]) if (arr) for (const p of arr) if (p && p.life > 0 && !p.super && !p.heavy && Math.abs(p.x - S.x) < 30 && Math.abs(p.y - S.y) < 40) { p.life = 0; S.used = true; break; }
            if (!S.used && o.attackData && !K.isHeavyAtk(o.attackData) && Math.abs(o.x - S.x) < 34 && Math.abs(o.y - f.y) < 60) { o.attackData = null; o.attackTimer = 0; o.state = 'hitstun'; o.hitstun = 10; S.used = true; }
            if (S.used) { K.spawn(c, { k: 'ring', style: 'sound', x: S.x, y: S.y, r: 10, grow: 4, life: 10 }); break; } } }
        if (Math.abs(S.x - f.x) < 24 || Math.abs(S.x - S.ox) < 8) { if (S.ring) S.ring.life = 0; S.p.life = 0; K.end(c); } } } },

  g2_yui: { name: 'Starlight Beacon', cd: 480, second: true,                 // beacon shields nearby allies; second press: dash to it and give a final pulse
    press(c) { const f = c.f, S = c.S; S.bx = f.x + fc(f) * 70; S.by = f.y - 40; const gy = K.groundY(c, S.bx, S.by, 400); if (gy == null || !K.onStage(c, S.bx, S.by)) return false;
      S.b = K.spawn(c, { k: 'marker', style: 'star', x: S.bx, y: S.by, life: 180, r: 20, tag: 'bc' }); return true; },
    tick(c) { const S = c.S, f = c.f;
      if (S.dash > 0) { S.dash--; K.lock(c, 1); K.dashStep(c, f, S.dx, S.dy); if (S.dash === 0) { f.vx = 0; f.vy = 0; K.spawn(c, { k: 'ring', style: 'star', x: f.x, y: f.y - 35, r: 8, grow: 4, life: 12 }); (f._allies || []).forEach((a) => Math.hypot(a.x - f.x, a.y - f.y) < 110 && K.shield(a, 0.12, 120)); K.end(c); } return; }
      if (!S.b || S.b.life <= 0) { K.end(c); return; }
      if (K.struckBy(c, S.bx, S.by, 20)) { S.b.life = 0; K.end(c, 300); return; }
      (f._allies || []).forEach((a) => Math.hypot(a.x - S.bx, a.y - S.by) < 90 && K.shield(a, 0.1, 20)); },
    second(c) { const S = c.S, f = c.f; if (!S.b || S.b.life <= 0 || S.dash > 0) return; if (!K.free(c, S.bx, S.by + 40) || !K.pathClear(c, f.x, f.y, S.bx, S.by + 40)) return; S.dash = 9; S.dx = (S.bx - f.x) / 9; S.dy = (S.by + 40 - f.y) / 9; S.b.life = 0; } },

  g2_ibuki: { name: 'Hollow Exchange', cd: 480, second: true,                 // two orbs; second press swaps with the far one; bursts can heal Ibuki (capped, once)
    press(c) { const f = c.f, S = c.S, d = fc(f); let tx = f.x + d * 150; for (const o of c.opps) if (Math.abs(o.x - tx) < 40) tx += d * 50;
      const gy = K.groundY(c, tx, f.y - 40, 300); if (gy == null || !K.onStage(c, tx, gy)) return false; S.ax = f.x; S.ay = f.y - 30; S.bx = tx; S.by = gy - 30; S.heal = 0;
      S.a = K.spawn(c, { k: 'orb', style: 'void', x: S.ax, y: S.ay, r: 16, life: 150, hold: false, tag: 'A' }); S.b = K.spawn(c, { k: 'orb', style: 'void', x: S.bx, y: S.by, r: 16, life: 150, tag: 'B' }); return true; },
    tick(c) { const f = c.f, S = c.S; let any = false;
      for (const o of [S.a, S.b]) { if (!o || o.life <= 0) continue; any = true; const who = c.opps.find((t) => K.bodyHit(t, o.x, o.y, 16)) || (c.pw.t > 8 && K.bodyHit(f, o.x, o.y, 16) && o === S.b ? f : null);
        if (who) { o.life = 0; K.spawn(c, { k: 'ring', style: 'void', x: o.x, y: o.y, r: 8, grow: 3, life: 10 });
          if (Math.hypot(f.x - o.x, f.y - o.y) < 120 && S.heal < 6) { const h = Math.min(4, 6 - S.heal); S.heal += h; if (f.gameMode === 'hp') f.hp = Math.min(150, (f.hp ?? 150) + h); else f.damage = Math.max(0, (f.damage || 0) - h); } } }
      if (!any || c.pw.t > 160) K.end(c); },
    second(c) { const S = c.S, f = c.f; if (!S.b || S.b.life <= 0) return; if (K.teleport(c, f, S.bx, S.by + 30)) { K.spawn(c, { k: 'ring', style: 'void', x: f.x, y: f.y - 35, r: 8, grow: 4, life: 10 }); S.b.life = 0; } } },

  g2_nishikawa: { ...grapple({ name: 'Marionette Line', cd: 540, ang: 26, len: 240, startup: 10, mode: 'swing', second: 'pull', speed: 8.5, oppHit: 'tug', style: 'string', maxSwing: 130 }) },

  g2_itto: { name: 'Severing Dash', cd: 600,                                 // visible still draw pose, then ONE dash-cut through a single opponent or projectile
    press(c) { const S = c.S; S.t = 0; K.lock(c, 24); S.d = fc(c.f); return true; },
    onHit(c) { if (c.S.t < 24) K.end(c, 300); },
    tick(c) { const f = c.f, S = c.S; S.t++;
      if (S.t < 24) { K.lock(c, 1); f.vx = 0; return; }
      if (S.t === 24) { S.dl = 7; S.cut = false; S.x0 = f.x; }
      if (S.dl > 0) { S.dl--; K.lock(c, 1); const b = K.ray(c, f.x, f.y - 35, S.d > 0 ? 0 : Math.PI, 20, true); if (!b) K.dashStep(c, f, S.d * 15, 0); else f.vx = 0;
        if (!S.cut) { const hx = f.x + S.d * 20, hy = f.y - 35;
          for (const o of c.opps) { for (const arr of [o.projectiles, o.genProjectiles]) if (arr && !S.cut) for (const p of arr) if (p && p.life > 0 && Math.abs(p.x - hx) < 36 && Math.abs(p.y - hy) < 40) { p.life = 0; S.cut = true; break; }
            if (!S.cut && K.bodyHit(o, hx, hy, 24)) { K.hit(f, o, { d: 14, kx: S.d * 11, ky: -4, hs: 24 }); S.cut = true; } }
          if (S.cut) K.spawn(c, { k: 'arc', style: 'blade', x: f.x, y: f.y - 38, dir: S.d, r: 40, life: 8 }); }
        if (S.dl === 0) { f.vx = 0; K.end(c); } } } },

  g2_twinfoxes: { name: 'Foxfire Relay', cd: 480, second: true,              // orb out; second press swaps with the visible orb location, orb bursts once
    press(c) { const f = c.f, S = c.S; S.d = fc(f);
      S.orb = K.proj(c, { style: 'foxfire', x: f.x + S.d * 24, y: f.y - 38, vx: S.d * 8, r: 12, life: 28, d: 5, kx: 4, ky: -3, hs: 10, onWall: (cc, e) => { }, onHit: (cc, e, t) => { K.hit(cc.f, t, { d: 5, kx: S.d * 4, ky: -3, hs: 10 }); S.dealt = true; e.life = 0; } }); S.orb.onEnd = () => { S.ox = S.orb.x; S.oy = S.orb.y; S.landed = true; };
      S.fox = K.spawn(c, { k: 'clone', style: 'foxfire', x: f.x + S.d * 24, y: f.y, facing: S.d, life: 28, r: 14, ghostOnly: true }); S.fox.update = (cc, e) => { e.x = S.orb.x; e.y = c.f.y; }; return true; },
    tick(c) { const S = c.S; if (S.orb.life <= 0 && !S.burst && S.landed) { S.burst = true; K.spawn(c, { k: 'ring', style: 'foxfire', x: S.ox, y: S.oy, r: 8, grow: 3, life: 10 }); }
      if (c.pw.t > 60) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (!S.orb || S.orb.life <= 0) return; const ox = S.orb.x, oy = f.y; if (K.teleport(c, f, ox, K.groundY(c, ox, f.y - 40, 300) ?? oy)) {
        K.spawn(c, { k: 'ring', style: 'foxfire', x: f.x, y: f.y - 35, r: 8, grow: 3, life: 10 });
        if (!S.dealt) for (const t of c.opps) if (K.bodyHit(t, f.x, f.y - 30, 34)) { K.hit(f, t, { d: 3, kx: (t.x >= f.x ? 1 : -1) * 4, ky: -4, hs: 10 }); S.dealt = true; break; }
        S.orb.life = 0; K.end(c); } } },

  g2_utsuro: { name: 'Fragment Harvest', cd: 480,                             // slow fragment steals a strict-capped bit of super charge from a foe; a wall gives much less
    press(c) { const f = c.f, S = c.S, d = fc(f);
      K.proj(c, { style: 'void', x: f.x + d * 20, y: f.y - 40, vx: d * 3.2, r: 12, life: 82,
        onHit: (cc, e, t) => { K.hit(cc.f, t, { d: 4, kx: d * 3, ky: -2, hs: 10 }); const amt = Math.min(6, t.superMeter || 0); t.superMeter = (t.superMeter || 0) - amt; cc.f.superMeter = Math.min(cc.f.maxSuper || 100, (cc.f.superMeter || 0) + amt); e.life = 0; },
        onWall: (cc) => { cc.f.superMeter = Math.min(cc.f.maxSuper || 100, (cc.f.superMeter || 0) + 1.5); } }); return true; },
    tick(c) { if (!c.pw.ents.length) K.end(c); } },
};
