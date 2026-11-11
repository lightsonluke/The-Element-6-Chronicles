// mvPowerDefs2.js — power abilities, Generation III (11) and IV (9).
import * as K from './mvPowerKit.js';
import { grapple, returnMarker } from './mvPowerFam.js';
const fc = K.face;
const projArrays = (f) => [f.projectiles, f.genProjectiles].filter(Boolean);

export const DEFS2 = {
  // ───────────── GEN III ─────────────
  g3_takeshi: { name: 'Sand Serpent', cd: 540,                               // moving sand ridge you can ride; bursts into a serpent column at its end; never carries you offstage
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.x = f.x + S.d * 20; S.y = f.y; S.dist = 0; S.done = false; K.lock(c, 6);
      S.r = K.addSolid(c, { x: S.x - 26, y: S.y - 14, w: 52, h: 12, life: 9999, persist: true, style: 'sand' }); return true; },
    tick(c) { const f = c.f, S = c.S, r = S.r; if (c.pw.t < 6) return;
      if (!S.done) { const nx = S.x + S.d * 7, gy = K.groundY(c, nx, S.y - 16, 30);
        if (gy == null || Math.abs(gy - S.y) > 14 || S.dist >= 240 || K.ray(c, S.x, S.y - 14, S.d > 0 ? 0 : Math.PI, 10, true)) { S.done = true; S.t = 0; S.col = K.spawn(c, { k: 'rect', style: 'sand', x: S.x - 20, y: S.y - 90, w: 40, h: 90, life: 14 }); K.dropSolid(f, r);
          for (const t of c.opps) if (K.rectHit(t, S.x - 22, S.y - 92, 44, 94)) K.hit(f, t, { d: 7, kx: S.d * 2, ky: -9, hs: 16 }); }
        else { const rid = Math.abs(f.x - r.x - 26) < 30 && f.y >= r.y - 10 && f.y <= r.y + 14; S.x = nx; S.y = gy; S.dist += 7; r.x = S.x - 26; r.y = S.y - 14; if (rid) { f.x += S.d * 7; f.y = r.y; f.vy = 0; f.grounded = true; } K.spawn(c, { k: 'trail', style: 'sand', x: S.x, y: S.y, life: 14, w: 30 }); } }
      else if (++S.t > 18) K.end(c); } },

  g3_aiko: { name: 'Bone Scaffold', cd: 480, second: true,                    // temporary bone platform; second press shatters it into a forward fan of fragments
    press(c) { const f = c.f, S = c.S; S.d = fc(f); S.p = K.addSolid(c, { x: f.x - 48, y: f.y + 2, w: 96, h: 12, life: 150, style: 'bone' }); return true; },
    tick(c) { if (c.S.p && c.S.p.life <= 1) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (!S.p || S.p.life <= 0) return; const bx = S.p.x + S.p.w / 2, by = S.p.y; K.dropSolid(f, S.p);
      [-28, -14, 0, 14, 28].forEach((a) => { const r = a * Math.PI / 180; K.proj(c, { style: 'bone', x: bx + S.d * 20, y: by - 26, vx: Math.cos(r) * 8 * S.d, vy: Math.sin(r) * 8 - 0.5, r: 7, life: 28, d: 3.5, kx: 4, ky: -3, hs: 10 }); }); K.end(c, 480); } },

  g3_haru: { name: 'Prism Split', cd: 420,                                    // prism splits Haru's NEXT projectile into two weaker ones (up / down)
    press(c) { const f = c.f, S = c.S; S.px = f.x + fc(f) * 60; S.py = f.y - 45; S.used = false; S.pr = K.spawn(c, { k: 'marker', style: 'prism', x: S.px, y: S.py, life: 120, r: 18, tag: 'pr' }); return true; },
    tick(c) { const f = c.f, S = c.S; if (S.pr.life <= 1 || S.used) { if (S.used) S.pr.life = 0; K.end(c); return; }
      for (const arr of projArrays(f).concat([c.pw.ents.filter((e) => e.proj && e.tag !== 'split')])) for (const p of arr) {
        if (!p || p.life <= 0 || p._split || p.tag === 'pr' || p.k === 'marker' || Math.abs(p.x - S.px) > 22 || Math.abs(p.y - S.py) > 40) continue;
        const mk = (vy) => { const q = { ...p, _split: true, tag: 'split', vy: (p.vy || 0) + vy, hit: p.hit || {}, d: (p.d || 4) * 0.5, dmg: p.dmg != null ? p.dmg * 0.5 : p.dmg }; q.hit = p.hit; return q; };
        const a = mk(-3), b = mk(3); p.life = 0; const list = arr === f.projectiles || arr === f.genProjectiles ? arr : c.pw.ents; list.push(a, b); S.used = true; K.spawn(c, { k: 'ring', style: 'prism', x: S.px, y: S.py, r: 6, grow: 3, life: 10 }); break; } } },

  g3_chiyo: { name: 'Venom Molt', cd: 540, second: true,                       // shell poisons anyone touching it for 1.5 s; second press detonates it early
    press(c) { const f = c.f, S = c.S, d = fc(f); S.x = f.x; S.y = f.y; S.dl = 8; S.d = d;
      S.sh = K.spawn(c, { k: 'marker', style: 'shell', x: S.x, y: S.y - 20, life: 90, r: 22, tag: 'sh' }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (S.dl > 0) { S.dl--; K.lock(c, 1); const b = K.ray(c, f.x, f.y - 35, S.d > 0 ? 0 : Math.PI, 20, true); if (!b) K.dashStep(c, f, S.d * 12, 0); else f.vx = 0; }
      if (S.sh.life > 0) { if (K.struckBy(c, S.x, S.y - 20, 22)) { S.sh.life = 0; K.end(c, 300); return; }
        for (const t of c.opps) if (K.bodyHit(t, S.x, S.y - 20, 22) && !(t._pwDot && t._pwDot.t > 20)) t._pwDot = { t: 90, rate: 0.06, left: 5 }; }
      else if (!S.det) K.end(c); },
    second(c) { const S = c.S, f = c.f; if (!S.sh || S.sh.life <= 0) return; S.sh.life = 0; S.det = true; K.spawn(c, { k: 'ring', style: 'venom', x: S.x, y: S.y - 20, r: 10, grow: 3, life: 10 });
      for (const t of c.opps) if (K.bodyHit(t, S.x, S.y - 20, 40)) K.hit(f, t, { d: 5, kx: (t.x >= S.x ? 1 : -1) * 5, ky: -4, hs: 12 }); K.end(c); } },

  g3_emi: { ...grapple({ name: 'Blood Thread', cd: 480, ang: 28, len: 220, startup: 8, mode: 'auto', second: 'none', speed: 9, oppHit: 'pullself', style: 'blood' }) },

  g3_nozomi: { name: 'Thorn Vault', cd: 480, second: true,                    // vine at feet + diagonal vault; in the air, a second press curls the vine to the nearest platform edge as ONE landing point
    press(c) { const f = c.f, S = c.S, d = fc(f); S.vx = f.x; S.vy = f.y; S.v = K.spawn(c, { k: 'marker', style: 'vine', x: f.x, y: f.y, life: 120, r: 16, tag: 'vine' });
      f.vx = d * 5.8; f.vy = -10.5; f.grounded = false; S.land = false; return true; },
    tick(c) { const f = c.f, S = c.S; for (const t of c.opps) if (S.v.life > 0 && !S.v.hit[K.pid(t)] && K.bodyHit(t, S.vx, S.vy - 10, 16)) { S.v.hit[K.pid(t)] = 1; K.hit(f, t, { d: 3, kx: 2, ky: -3, hs: 8 }); }
      if (c.pw.t > 140) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (f.grounded || S.land) return; let best = null;
      for (const r of K.rects(c)) { if (r.h > 60) { } for (const ex of [r.x + 8, r.x + r.w - 8]) { const d = Math.hypot(ex - f.x, r.y - f.y); if (d < 280 && (!best || d < best.d)) best = { x: ex, y: r.y, d }; } }
      if (!best) return; S.land = true; S.p = K.addSolid(c, { x: best.x - 30, y: best.y - 2, w: 60, h: 10, life: 110, keep: true, style: 'vine' }); K.spawn(c, { k: 'line', style: 'vine', x1: S.vx, y1: S.vy, x2: best.x, y2: best.y, life: 20 }); } },

  g3_masaru: { name: 'Ash Rebirth', cd: 480,                                  // ash slide (no invincibility) → reform with a small upward burst; hit while sliding = forced early reform
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.t = 0; S.x0 = f.x; f._pwHide = true; K.lock(c, 30); return true; },
    tick(c) { const f = c.f, S = c.S; S.t++;
      if (S.t <= 30 && !S.reform) { K.lock(c, 1); const b = K.ray(c, f.x, f.y - 30, S.d > 0 ? 0 : Math.PI, 14, true); if (!b && K.onStage(c, f.x + S.d * 4, f.y)) K.setMove(f, S.d * 4.4, 0); else f.vx = 0; K.spawn(c, { k: 'trail', style: 'ash', x: f.x, y: f.y - 8, life: 16, w: 24 });
        if (f.state === 'hitstun') { S.reform = true; S.t = 30; } }
      if (S.t === 30 || S.reform) { if (!S.burst) { S.burst = true; f._pwHide = false; f.vx = 0; K.lock(c, 8); K.spawn(c, { k: 'ring', style: 'ash', x: f.x, y: f.y - 30, r: 8, grow: 3, life: 12 });
          for (const t of c.opps) if (K.bodyHit(t, f.x, f.y - 20, 36)) K.hit(f, t, { d: 4, kx: (t.x >= f.x ? 1 : -1) * 2, ky: -7.5, hs: 12 }); } }
      if (S.burst && S.t > 40) K.end(c); } },
  g3_ryo: returnMarker({ name: 'Mist Double', cd: 420, dash: 100, dashFrames: 7, window: 120, style: 'mist', clone: true, maxDist: 112 }),

  g3_souta: { name: 'Cinder Rocket', cd: 540,                                 // diagonal rocket in the held direction; a wall redirects you DOWN (no bounce chains, no jump reset)
    press(c) { const f = c.f, S = c.S, i = c.inputs; S.dx = i.left ? -1 : i.right ? 1 : fc(f); S.dy = i.down ? 0.6 : -0.75; const L = Math.hypot(S.dx, S.dy); S.dx /= L; S.dy /= L; S.t = 0; K.lock(c, 5); return true; },
    tick(c) { const f = c.f, S = c.S; S.t++; if (S.t <= 5) return;
      if (S.t <= 23 && !S.wall) { K.lock(c, 1); f.grounded = false; const st = (c.inputs.left ? -0.25 : c.inputs.right ? 0.25 : 0); S.dx += st * 0.05; K.setMove(f, S.dx * 11, S.dy * 11);
        const w = K.ray(c, f.x, f.y - 35, Math.atan2(S.dy, S.dx), 20, true); if (w) { S.wall = true; f.vx = 0; f.vy = 6; K.spawn(c, { k: 'ring', style: 'ember', x: w.x, y: w.y, r: 6, grow: 3, life: 8 }); }
        K.spawn(c, { k: 'trail', style: 'ember', x: f.x, y: f.y - 30, life: 14, w: 16 });
        for (const t of c.opps) if (!S.hit && K.bodyHit(t, f.x + S.dx * 10, f.y - 35, 20)) { S.hit = true; K.hit(f, t, { d: 4, kx: S.dx * 5, ky: -2, hs: 10 }); } }
      else K.end(c); } },

  g3_ogata: { ...grapple({ name: 'Extraction Harpoon', cd: 540, ang: 26, len: 280, startup: 10, mode: 'zip', second: 'zip', speed: 10, oppHit: 'stagger', style: 'chain' }) },
  g3_kanenobu: returnMarker({ name: 'Golden Standard', cd: 540, dash: 0, window: 180, style: 'standard', radius: 150, needGround: true, struck: false }),

  // ───────────── GEN IV ─────────────
  g4_cobalt: { name: 'Launch Barrier', cd: 540, second: true,                 // visual-only for 1 s, then launches forward as a pushing wall (never traps against a boundary)
    press(c) { const f = c.f, S = c.S; S.d = fc(f); S.x = f.x + S.d * 60; S.y = f.y; S.ph = 'form'; S.t = 0;
      S.b = K.spawn(c, { k: 'rect', style: 'barrier', x: S.x - 9, y: S.y - 90, w: 18, h: 90, life: 9999, hold: true }); return true; },
    tick(c) { const f = c.f, S = c.S, b = S.b; S.t++;
      if (S.ph === 'form') { b.x = f.x + S.d * 60 - 9 + (S.t < 14 ? 0 : 0); S.x = b.x + 9; if (S.t >= 60) { S.ph = 'go'; S.t = 0; } }
      if (S.ph === 'go') { const w = K.ray(c, S.x, S.y - 40, S.d > 0 ? 0 : Math.PI, 14, true); const edge = !K.groundY(c, S.x + S.d * 16, S.y - 20, 80) && S.t > 2;
        if (w || edge || S.x < -20 || S.x > c.W + 20 || S.t > 90) { b.life = 0; K.end(c); return; }
        S.x += S.d * 6; b.x = S.x - 9;
        for (const t of c.opps) if (K.rectHit(t, b.x, b.y, 18, 90)) { const nx = t.x + S.d * 6.5; if (K.free(c, nx, t.y) && nx > 20 && nx < c.W - 20) { t.x = nx; t.vx = S.d * 3; } else { b.life = 0; K.end(c); return; } }   // pushes, never crushes against a boundary
        if (Math.abs(f.x - (S.x - S.d * 26)) < 28 && Math.abs(f.y - S.y) < 20) { f.x += S.d * 6; f.vx = S.d * 6; } } },
    second(c) { const S = c.S; if (S.ph === 'form') { S.ph = 'go'; S.t = 0; } } },

  g4_cyan: { name: 'Cyclone Rail', cd: 540, second: true,                     // curved wind stream: ride it, then press again to burst out in the held direction
    press(c) { const f = c.f, S = c.S; S.d = fc(f); S.x0 = f.x; S.y0 = f.y - 20; S.ph = 'form'; S.t = 0; S.u = 0;
      S.pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; S.pts.push([S.x0 + S.d * (u * 210), S.y0 - Math.sin(u * 1.5) * 120 * u]); }
      S.s = K.spawn(c, { k: 'crack', style: 'wind', pts: S.pts, life: 110, wide: 8 }); return true; },
    tick(c) { const f = c.f, S = c.S; S.t++;
      if (S.ph === 'form' && S.t > 10) { S.ph = 'ride'; S.t = 0; }
      if (S.ph === 'ride') { S.u += 0.026; if (S.u >= 1 || S.t > 44) { S.ph = 'exit'; } else { const i = Math.min(11, Math.floor(S.u * 12)), a = S.pts[i], b = S.pts[i + 1]; const tx = a[0] + (b[0] - a[0]) * (S.u * 12 - i), ty = a[1] + (b[1] - a[1]) * (S.u * 12 - i);
          K.lock(c, 1); f.grounded = false; if (K.pathClear(c, f.x, f.y, tx, ty + 20)) { f.x = tx; f.y = ty + 20; f.vx = 0; f.vy = 0; } else S.ph = 'exit'; } }
      if (S.ph === 'exit' && !S.out) { S.out = true; const i = c.inputs; let dx = i.left ? -1 : i.right ? 1 : S.d, dy = i.up ? -0.9 : i.down ? 0.7 : -0.35; const L = Math.hypot(dx, dy); f.vx = dx / L * 10.5; f.vy = dy / L * 10.5; f.grounded = false; K.spawn(c, { k: 'ring', style: 'wind', x: f.x, y: f.y - 30, r: 6, grow: 3, life: 10 }); K.end(c); }
      for (const t of c.opps) for (let i = 0; i < S.pts.length - 1; i++) { const a = S.pts[i], b = S.pts[i + 1]; if (Math.abs(t.x - (a[0] + b[0]) / 2) < 24 && Math.abs(t.y - 30 - (a[1] + b[1]) / 2) < 30) { t.vx += (b[0] - a[0]) * 0.03; t.vy += (b[1] - a[1]) * 0.03 - 0.1; break; } } },
    second(c) { const S = c.S; if (S.ph === 'ride') S.ph = 'exit'; } },

  g4_onyx: { name: 'Shadow Route', cd: 480, second: true,                     // throw a marker onto the nearest surface ahead; second press travels along a shadow route to it
    press(c) { const f = c.f, S = c.S, d = fc(f); const w = K.ray(c, f.x, f.y - 40, d > 0 ? -0.12 : Math.PI + 0.12, 280, false) || K.ray(c, f.x + d * 120, f.y - 40, Math.PI / 2, 300, false);
      if (!w) return false; S.mx = w.x; S.my = Math.min(w.y, K.groundY(c, w.x, w.y - 20, 80) ?? w.y); const gy = K.groundY(c, S.mx, S.my - 30, 120); if (gy == null) return false; S.my = gy; if (!K.free(c, S.mx, S.my)) return false;
      S.mk = K.spawn(c, { k: 'marker', style: 'shadow', x: S.mx, y: S.my - 12, life: 120, r: 18, tag: 'mk' }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (S.dl > 0) { S.dl--; K.lock(c, 1); f.x += S.dx; f.y += S.dy; f.vx = 0; f.vy = 0; K.spawn(c, { k: 'trail', style: 'shadow', x: f.x, y: f.y - 35, life: 10, w: 20 }); if (S.dl === 0) { K.lock(c, 10); K.spawn(c, { k: 'ring', style: 'shadow', x: f.x, y: f.y - 30, r: 8, grow: 3, life: 12 }); S.arr = 10; } return; }
      if (S.arr > 0) { S.arr--; K.lock(c, 1); if (S.arr === 0) K.end(c); return; }
      if (!S.mk || S.mk.life <= 0) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (!S.mk || S.mk.life <= 0 || S.dl > 0 || S.arr > 0) return; if (!K.free(c, S.mx, S.my) || !K.pathClear(c, f.x, f.y, S.mx, S.my)) { K.end(c, 240); return; }
      S.dl = 14; S.dx = (S.mx - f.x) / 14; S.dy = (S.my - f.y) / 14; S.mk.life = 0; } },

  g4_gold: { name: 'Radiant Relay', cd: 480,                                   // light orb bounces ONCE; reaching an ally shields them; returning to Gold boosts his next jump (solo: small shield instead)
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d; S.ret = false;
      S.o = K.proj(c, { style: 'light', x: f.x + d * 20, y: f.y - 38, vx: d * 9, r: 11, life: 90, bounce: 1, harmless: true, onBounce: () => { S.bounced = true; } }); return true; },
    tick(c) { const f = c.f, S = c.S, o = S.o;
      if (o.life > 0 && !S.ret) { (f._allies || []).forEach((a) => { if (!S.shA && K.bodyHit(a, o.x, o.y, 12)) { S.shA = true; K.shield(a, 0.15, 180); o.life = 0; } });
        if (S.bounced && K.bodyHit(f, o.x, o.y, 16)) { S.ret = true; o.life = 0; if (!f._allies || !f._allies.length) K.shield(f, 0.12, 180); else { f._pwJumpBoost = true; } f._pwJumpBoost = true; } }
      if (f._pwJumpBoost && f.vy < -4 && !f.grounded) { f.vy *= 1.25; f._pwJumpBoost = false; }
      if (o.life <= 0 || c.pw.t > 100) { if (c.pw.t > 100) f._pwJumpBoost = false; K.end(c); } } },

  g4_vermilion: { name: 'Flame Circuit', cd: 540,                              // arc of fire; ignites after 0.6 s and launches him forward — an opponent touching the arc makes it flare early
    press(c) { const f = c.f, S = c.S; S.d = fc(f); S.t = 0; S.go = false; S.arc = K.spawn(c, { k: 'arc', style: 'flame', x: f.x, y: f.y - 36, dir: S.d, r: 46, life: 9999, hold: true, thin: true }); K.lock(c, 36); return true; },
    onHit(c) { if (!c.S.go) { c.S.arc.life = 0; K.end(c, 300); } },
    tick(c) { const f = c.f, S = c.S; S.t++; S.arc.x = f.x; S.arc.y = f.y - 36;
      if (!S.go) { K.lock(c, 1); const early = c.opps.some((t) => Math.hypot(t.x - f.x, (t.y - 36) - (f.y - 36)) < 56); if (S.t >= 36 || early) { S.go = true; S.gt = 0; S.arc.life = 8; S.arc.hold = false; } return; }
      if (++S.gt <= 14) { K.lock(c, 1); const b = K.ray(c, f.x, f.y - 35, S.d > 0 ? 0 : Math.PI, 20, true); if (!b) K.dashStep(c, f, S.d * 9.5, 0); else f.vx = 0; K.spawn(c, { k: 'trail', style: 'flame', x: f.x, y: f.y - 24, life: 20, w: 20, hazard: true });
        for (const t of c.opps) if (!S.h && K.bodyHit(t, f.x + S.d * 12, f.y - 35, 22)) { S.h = true; K.hit(f, t, { d: 5, kx: S.d * 5, ky: -3, hs: 12 }); } }
      else K.end(c); } },

  g4_umber: { name: 'Seismic Listening', cd: 480, second: true,               // crouch + outline grounded foes; second press: a small upward tremor under ONE marked position (visible warning first)
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.t = 0; S.marks = []; K.lock(c, 22); for (const t of c.opps) if (t.grounded) { t._pwRevealed = 90; S.marks.push(t); } return true; },
    tick(c) { const f = c.f, S = c.S; S.t++; if (S.t < 22) f.vx = 0;
      if (S.warn != null) { S.warn--; if (S.warn <= 0) { S.warn = null; K.spawn(c, { k: 'rect', style: 'stone', x: S.tx - 20, y: S.ty - 76, w: 40, h: 76, life: 10 }); for (const t of c.opps) if (K.rectHit(t, S.tx - 22, S.ty - 78, 44, 80)) K.hit(f, t, { d: 5, kx: 0, ky: -9, hs: 14 }); S.fired = true; S.t = 90; } }
      if (S.t > 100 || (S.fired && S.t > 100)) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (S.warn != null || S.fired) return; const tgt = S.marks.filter((t) => t._pwRevealed > 0).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0]; if (!tgt) return;
      S.tx = tgt.x; S.ty = K.groundY(c, tgt.x, tgt.y - 20, 60) ?? tgt.y; S.warn = 24; K.spawn(c, { k: 'rect', style: 'warn', x: S.tx - 20, y: S.ty - 4, w: 40, h: 4, life: 24 }); } },

  g4_graphite: { name: 'Resonance Skate', cd: 480, second: true,              // vibrating rail you ride; jump off any time, or collapse it into a sonic burst behind you
    press(c) { const f = c.f, S = c.S; if (!f.grounded) return false; S.d = fc(f); S.t = 0; S.dist = 0; S.p = K.addSolid(c, { x: f.x - 45, y: f.y + 2, w: 90, h: 10, life: 9999, persist: true, style: 'sound' }); return true; },
    tick(c) { const f = c.f, S = c.S, p = S.p; S.t++;
      if (!S.col) { const nx = p.x + S.d * 7.2; const b = K.ray(c, S.d > 0 ? nx + p.w : nx, p.y - 24, S.d > 0 ? 0 : Math.PI, 6, true);
        if (!b && S.dist < 240 && nx > -20 && nx + p.w < c.W + 20) { p.x = nx; S.dist += 7.2; const rid = Math.abs(f.x - (p.x + p.w / 2)) < p.w / 2 && f.y >= p.y - 12 && f.y <= p.y + 14; if (rid) { f.y = p.y; f.vy = 0; f.grounded = true; f.x += S.d * 7.2; } S.riding = rid; } else { K.dropSolid(f, p); K.end(c); return; }
        if (c.jump) { K.dropSolid(f, p); f.vy = -9; K.end(c); return; } } },
    second(c) { const f = c.f, S = c.S; if (S.col || !S.p) return; S.col = true; const bx = S.p.x + S.p.w / 2 - S.d * 30, by = S.p.y - 24; K.dropSolid(f, S.p); K.spawn(c, { k: 'ring', style: 'sound', x: bx, y: by, r: 10, grow: 4, life: 12 });
      for (const t of c.opps) if (K.bodyHit(t, bx, by, 50)) K.hit(f, t, { d: 5, kx: (t.x >= bx ? 1 : -1) * 6, ky: -4, hs: 12 }); K.end(c); } },

  g4_daichi: { name: 'Magnetic Reversal', cd: 480, second: true,              // disc sticks to a wall/platform, polarity flips at 0.5 s: pull toward it, then push away
    press(c) { const f = c.f, S = c.S, d = fc(f); S.d = d; S.stuck = false;
      S.disc = K.proj(c, { style: 'magnet', x: f.x + d * 18, y: f.y - 38, vx: d * 12, r: 9, life: 22, harmless: true, stick: true, hold: false, onStick: (cc, e, w) => { S.stuck = true; S.ax = w.x; S.ay = w.y; S.st = 0; e.life = 120; e.hold = false; e.k = 'marker'; e.style = 'magnet'; e.x = w.x; e.y = w.y; } }); return true; },
    tick(c) { const f = c.f, S = c.S;
      if (!S.stuck) { if (S.disc.life <= 0) K.end(c); return; }
      S.st++; S.disc.pol = S.st < 30 ? 'pull' : 'push'; S.disc.style = S.st < 30 ? 'magnet' : 'magnet2';
      if (S.go > 0) { S.go--; K.lock(c, 1); const dx = S.ax - f.x, dy = S.ay - (f.y - 35), L = Math.hypot(dx, dy) || 1; const sg = S.dirSign; K.setMove(f, dx / L * 10 * sg, dy / L * 10 * sg); if (L < 22 && sg > 0) { S.go = 0; f.vx *= 0.3; f.vy = 0; } if (S.go === 0) K.end(c); }
      if (S.disc.life <= 1) K.end(c); },
    second(c) { const S = c.S; if (!S.stuck || S.go > 0) return; S.dirSign = S.st < 30 ? 1 : -1; S.go = 13; S.disc.life += 14; } },

  g4_renko: { name: 'Crimson Ring', cd: 480, second: true,                    // ring drifts forward; jump through it for a speed burst + a second jump-like impulse (once); second press collapses it into a short-range strike
    press(c) { const f = c.f, S = c.S; S.d = fc(f); S.rx = f.x + S.d * 50; S.ry = f.y - 44; S.used = false;
      S.r = K.spawn(c, { k: 'ring', style: 'ring', x: S.rx, y: S.ry, r: 28, oval: true, life: 150, hold: false, thin: true }); return true; },
    tick(c) { const f = c.f, S = c.S; S.rx += S.d * 2.4; S.r.x = S.rx; if (!K.free(c, S.rx, S.ry + 30)) { }
      if (!S.used && Math.abs(f.x - S.rx) < 16 && Math.abs((f.y - 40) - S.ry) < 34 && (!f.grounded || c.pw.t > 6) && c.pw.t > 4 && Math.abs(f.vx) + Math.abs(f.vy) > 0.5) { S.used = true; f.vx = S.d * 8; f.vy = -9; f.grounded = false; K.spawn(c, { k: 'ring', style: 'ring', x: S.rx, y: S.ry, r: 10, grow: 3, life: 8 }); }
      if (S.r.life <= 1) K.end(c); },
    second(c) { const f = c.f, S = c.S; if (S.r.life <= 0 || Math.hypot(S.rx - f.x, S.ry - f.y) > 130) return; S.r.life = 0; K.spawn(c, { k: 'ring', style: 'ring', x: S.rx, y: S.ry, r: 10, grow: 4, life: 10 });
      for (const t of c.opps) if (K.bodyHit(t, S.rx, S.ry, 40)) K.hit(f, t, { d: 8, kx: S.d * 6, ky: -4, hs: 16 }); K.end(c); } },
};
