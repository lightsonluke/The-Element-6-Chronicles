// mvPowerFam.js — ability families with strongly different parameters per character (grapples, swap markers, return markers).
import * as K from './mvPowerKit.js';

const D2R = Math.PI / 180;
// ── GRAPPLE: thread / chain / harpoon that attaches to the first solid surface (never to players) ──
//  o: { name, cd, ang, len, startup, mode:'zip'|'auto'|'swing', second:'zip'|'retract'|'release'|'pull', speed, oppHit, edgeOnly, style, maxSwing, retractHit }
export function grapple(o) {
  const O = { ang: 24, len: 250, startup: 10, mode: 'zip', speed: 10, flySpeed: 17, style: 'thread', maxSwing: 100, oppHit: 'none', ...o };
  const chest = (f) => [f.x, f.y - 45];
  return { name: O.name, cd: O.cd || 540, second: true,
    press(c) { const S = c.S, f = c.f; S.ph = 'start'; S.t = 0; K.lock(c, O.startup); return true; },
    onHit(c) { K.end(c, 240); },                                                  // a strong hit breaks the line
    second(c) {
      const S = c.S;
      if (S.ph === 'att' && O.mode === 'zip') S.ph = 'pull';
      else if (S.ph === 'swing' && O.second === 'pull') S.ph = 'pull';
      else if (S.ph === 'pull' && O.second === 'retract') { S.ph = 'ret'; S.rx = S.ax; S.ry = S.ay; }
      else if ((S.ph === 'att' || S.ph === 'swing' || S.ph === 'pull') && O.second === 'release') release(c);
    },
    tick(c) {
      const f = c.f, S = c.S, pw = c.pw, fc = K.face(f);
      if (S.ph === 'start') { if (++S.t >= O.startup) {
          let a = O.ang + (c.inputs.up ? 20 : 0) - (c.inputs.down ? 14 : 0); a = a * D2R;
          const [ox, oy] = chest(f); S.hx = ox; S.hy = oy; S.dx = Math.cos(a) * fc; S.dy = -Math.sin(a); S.fl = 0; S.ph = 'fly';
          S.line = K.spawn(c, { k: 'line', style: O.style, x1: ox, y1: oy, x2: ox, y2: oy, life: 9999, hold: true, wide: O.style === 'chain' ? 4 : 2 });
          S.line.update = (cc, e) => { const [px, py] = chest(cc.f); e.x1 = px; e.y1 = py; e.x2 = S.ph === 'ret' ? S.rx : (S.ph === 'fly' || S.ph === 'miss' ? S.hx : S.ax); e.y2 = S.ph === 'ret' ? S.ry : (S.ph === 'fly' || S.ph === 'miss' ? S.hy : S.ay); };
          S.tip = K.spawn(c, { k: 'marker', style: O.style === 'chain' ? 'anchor' : 'hook', x: ox, y: oy, life: 9999, hold: true, r: 7 });
          S.tip.update = (cc, e) => { e.x = S.ph === 'ret' ? S.rx : (S.ph === 'fly' || S.ph === 'miss' ? S.hx : S.ax); e.y = S.ph === 'ret' ? S.ry : (S.ph === 'fly' || S.ph === 'miss' ? S.hy : S.ay); };
        } return; }
      if (S.ph === 'fly') {
        const steps = Math.ceil(O.flySpeed / 6);
        for (let i = 0; i < steps && S.ph === 'fly'; i++) {
          const sp = O.flySpeed / steps, ang = Math.atan2(S.dy, S.dx), w = K.ray(c, S.hx, S.hy, ang, sp + 1, false);
          if (w && w.t <= sp + 1) {
            const ok = !O.edgeOnly || (Math.abs(w.y - w.rect.y) < 6 || Math.abs(w.x - w.rect.x) < 6 || Math.abs(w.x - (w.rect.x + w.rect.w)) < 6);
            if (ok && K.onStage(c, w.x, w.y)) { S.ax = w.x; S.ay = w.y; S.L = Math.hypot(w.x - f.x, w.y - (f.y - 45)); S.ph = O.mode === 'auto' ? 'pull' : (O.mode === 'swing' ? 'swing' : 'att'); S.t = 0; S.sw = 0; }
            else S.ph = 'miss', S.t = 0; break;
          }
          S.hx += S.dx * sp; S.hy += S.dy * sp; S.fl += sp;
          for (const t of c.opps) if (K.bodyHit(t, S.hx, S.hy, 10) && !S.oh) {
            S.oh = 1;
            if (O.oppHit === 'tug') { t.vx = (f.x - t.x > 0 ? 1 : -1) * 6; t.vy = -2; }
            else if (O.oppHit === 'pullself') { K.hit(f, t, { d: 3, kx: fc * 3, ky: -2, hs: 8 }); S.px = t.x - fc * 30; S.ph = 'pullopp'; S.t = 0; }
            else if (O.oppHit === 'stagger') K.hit(f, t, { d: 3, kx: fc * 2, ky: -1, hs: 14 });
            else if (O.oppHit === 'slow') K.hit(f, t, { d: 2, kx: 0, ky: 0, slow: 90, slowMul: 0.55 });
            if (S.ph === 'fly') S.ph = 'miss';
            S.t = 0;
          }
          if (S.fl >= O.len) { S.ph = 'miss'; S.t = 0; }
        }
        return; }
      if (S.ph === 'miss') { S.hx -= S.dx * 14; S.hy -= S.dy * 14; if (++S.t > 6) K.end(c, 300); return; }
      if (S.ph === 'pullopp') {                                                 // Emi: pulled a short way toward the opponent that was hit — nobody is dragged
        const dx = S.px - f.x; if (Math.abs(dx) < 14 || ++S.t > 12) { f.vx = 0; K.end(c); return; }
        K.lock(c, 1); K.setMove(f, Math.sign(dx) * 7, Math.min(f.vy, 0.8)); return; }
      if (S.ph === 'att') { if (++S.t > 110) K.end(c, 360); return; }
      if (S.ph === 'swing') {                                                   // rope constraint pendulum
        const cx = f.x, cy = f.y - 45, dx = cx - S.ax, dy = cy - S.ay, d = Math.hypot(dx, dy) || 1;
        if (d > S.L) { const nx = dx / d, ny = dy / d; f.x = S.ax + nx * S.L; f.y = S.ay + ny * S.L + 45; const vr = f.vx * nx + f.vy * ny; if (vr > 0) { f.vx -= nx * vr; f.vy -= ny * vr; } f.grounded = false; }
        f.vx += (c.inputs.right ? 0.18 : 0) - (c.inputs.left ? 0.18 : 0);
        if (c.jump || ++S.sw > O.maxSwing || c.inputs.sig || c.inputs.heavy) { f.vy = Math.min(f.vy, -3.5); K.end(c, 360); }
        return; }
      if (S.ph === 'pull') {
        const cx = f.x, cy = f.y - 45, dx = S.ax - cx, dy = S.ay - cy, d = Math.hypot(dx, dy);
        if (d < 26 || ++S.t > 70) { f.vx *= 0.45; f.vy = Math.min(f.vy, 0) * 0.5; if (O.second === 'retract') { S.ph = 'ret'; S.rx = S.ax; S.ry = S.ay; S.t = 0; } else K.end(c, 420); return; }
        K.lock(c, 1); f.grounded = false; K.setMove(f, dx / d * O.speed, dy / d * O.speed - 0.15); return; }
      if (S.ph === 'ret') {                                                     // anchor returns along the chain; it can hit ONE opponent on the way
        const tx = f.x, ty = f.y - 45, dx = tx - S.rx, dy = ty - S.ry, d = Math.hypot(dx, dy);
        if (d < 22) { K.end(c, 420); return; }
        S.rx += dx / d * 18; S.ry += dy / d * 18;
        if (O.retractHit && !S.rh) for (const t of c.opps) if (K.bodyHit(t, S.rx, S.ry, 14)) { S.rh = 1; K.hit(f, t, { d: O.retractHit, kx: (tx - S.rx > 0 ? -1 : 1) * 6, ky: -3, hs: 14 }); break; }
      }
    } };
}
function release(c) { const f = c.f; f.vx += K.face(f) * 6; f.vy = Math.min(f.vy, -4); K.end(c, 400); }

// ── SWAP MARKER: leave a marker (shadow / clone), dash a short way, second press swaps places ──
//  o: { name, cd, dash, dashFrames, window, style, clone, killOnStrike }
export function swapMarker(o) {
  const O = { dash: 90, dashFrames: 6, window: 120, style: 'shadow', ...o };
  return { name: O.name, cd: O.cd || 420, second: true,
    press(c) {
      const f = c.f, S = c.S;
      if (!K.onStage(c, f.x, f.y) || (f.grounded && K.groundY(c, f.x, f.y - 6, 60) == null)) return false;      // cannot be placed offstage
      S.mx = f.x; S.my = f.y; S.mf = K.face(f); S.dl = O.dashFrames; S.sw = false;
      S.mk = K.spawn(c, { k: O.clone ? 'clone' : 'marker', style: O.style, x: S.mx, y: S.my, facing: S.mf, life: O.window, tag: 'mk', r: 18, hold: false });
      return true; },
    onHit(c) { },
    tick(c) {
      const f = c.f, S = c.S;
      if (S.dl > 0) { S.dl--; K.lock(c, 1); const step = O.dash / O.dashFrames, fc = K.face(f); const blocked = K.ray(c, f.x, f.y - 35, fc > 0 ? 0 : Math.PI, step + 18, true); if (!blocked) K.dashStep(c, f, fc * step, 0); else f.vx = 0; }
      if (S.mk && S.mk.life > 0 && K.struckBy(c, S.mk.x, S.mk.y - 35, 18)) { S.mk.life = 0; K.end(c, 300); return; }          // striking the marker cancels the swap
      if (!S.mk || S.mk.life <= 0) K.end(c);
    },
    second(c) {
      const f = c.f, S = c.S; if (!S.mk || S.mk.life <= 0 || S.dl > 0) return;
      const ox = f.x, oy = f.y;
      if (K.free(c, S.mx, S.my) && K.pathClear(c, ox, oy, S.mx, S.my)) { f.x = S.mx; f.y = S.my; f.vx = 0; f.vy = 0; f.facing = S.mf === K.face(f) ? f.facing : f.facing; S.mk.life = 0; S.swapped = true;
        K.spawn(c, { k: 'ring', x: ox, y: oy - 35, r: 6, grow: 3, life: 10, style: O.style }); K.spawn(c, { k: 'ring', x: f.x, y: f.y - 35, r: 6, grow: 3, life: 10, style: O.style }); }
      K.end(c); } };
}
// ── RETURN MARKER: second press moves the owner back to a marker ──
//  o: { name, cd, dash, window, style, radius, record, needGround }
export function returnMarker(o) {
  const O = { dash: 100, dashFrames: 7, window: 120, style: 'mist', ...o };
  return { name: O.name, cd: O.cd || 420, second: true,
    press(c) {
      const f = c.f, S = c.S;
      if (!K.onStage(c, f.x, f.y) || (O.needGround && f.grounded && K.groundY(c, f.x, f.y - 6, 60) == null)) return false;
      S.mx = f.x; S.my = f.y; S.d0 = O.dash; S.dl = O.dash ? O.dashFrames : 0; S.sx = f.x;
      S.mk = K.spawn(c, { k: O.clone ? 'clone' : 'marker', style: O.style, x: S.mx, y: S.my, facing: K.face(f), life: O.window, tag: 'mk', r: 18 });
      return true; },
    tick(c) {
      const f = c.f, S = c.S;
      if (S.dl > 0) { S.dl--; K.lock(c, 1); const step = O.dash / O.dashFrames, fc = K.face(f); const blocked = K.ray(c, f.x, f.y - 35, fc > 0 ? 0 : Math.PI, step + 18, true); if (!blocked) K.dashStep(c, f, fc * step, 0); else f.vx = 0; }
      if (O.struck !== false && S.mk && S.mk.life > 0 && K.struckBy(c, S.mk.x, S.mk.y - 35, 18)) { S.mk.life = 0; K.end(c, 300); return; }
      if (!S.mk || S.mk.life <= 0) K.end(c);
    },
    second(c) {
      const f = c.f, S = c.S; if (!S.mk || S.mk.life <= 0) return;
      if (f.hitstun > 0 || f.state === 'hitstun') { K.end(c, 300); return; }                       // hard control interrupts the return
      if (O.radius && Math.hypot(f.x - S.mx, f.y - S.my) > O.radius) return;                      // must be within the standard's radius
      if (O.maxDist && Math.hypot(f.x - S.mx, f.y - S.my) > O.maxDist) return;                    // return cannot exceed the original dash distance
      const ox = f.x, oy = f.y;
      if (K.teleport(c, f, S.mx, S.my)) { K.spawn(c, { k: 'ring', x: ox, y: oy - 35, r: 6, grow: 3, life: 10, style: O.style }); K.spawn(c, { k: 'ring', x: f.x, y: f.y - 35, r: 6, grow: 3, life: 10, style: O.style }); K.end(c); }
      else K.end(c, 240); } };
}
