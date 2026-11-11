// mvArtPhys.js — painter for PHYSICAL moves (m.phys).  Everything here is cosmetic and deliberately small:
//   • a close-fitting element wrap along the striking limb (flame / water sleeve / vine / frost / current)
//   • a THIN ring at the contact point, only during that element's own hit window
//   • a hairline smear following the limb's actual path (never damaging)
//   • the held weapon prop (only its edge capsule is a hitbox, see mvArchV2.js)
// No gradients-with-glow, no ribbons, no radial blasts.  Deterministic (no Math.random).
import { skinOf, rgba, lighten, darken, mixHex, clamp01, nzs } from './mvArtLib.js';
import { hash, TAU } from './mvCore.js';

const LIMB = {
  nh: (J) => [J.near.elbow, J.near.hand], fh: (J) => [J.far.elbow, J.far.hand],
  nf: (J) => [J.near.knee, J.near.foot], ff: (J) => [J.far.knee, J.far.foot],
  ne: (J) => [J.near.shoulder, J.near.elbow], nk: (J) => [J.near.hip, J.near.knee],
  sh: (J) => [J.shoulder, [J.shoulder[0] + 12, J.shoulder[1] + 4]],
};

function wrap(ctx, a, b, S, t, seed) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const [c0, c1, c2] = S.pal, fam = S.fam;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // soft sleeve + bright core hugging the limb
  ctx.strokeStyle = rgba(c0, 0.42); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.strokeStyle = rgba(c2, 0.85); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  const n = 5;
  ctx.strokeStyle = rgba(c1, 0.9); ctx.fillStyle = rgba(c1, 0.85); ctx.lineWidth = 1.6;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, px = a[0] + dx * u, py = a[1] + dy * u, j = hash(seed * 31 + i * 7 + Math.floor(t / 2));
    if (fam === 'flame') {                      // short tongues licking back along the limb
      const h = 5 + j * 6; ctx.beginPath(); ctx.moveTo(px + nx * 3, py + ny * 3); ctx.quadraticCurveTo(px + nx * 5 - ux * h * 0.5, py + ny * 5 - uy * h * 0.5, px + nx * 2 - ux * h, py + ny * 2 - uy * h - 2); ctx.stroke();
    } else if (fam === 'liquid') {              // thin water sleeve: a sine ripple riding the limb
      ctx.beginPath(); for (let k = 0; k <= 4; k++) { const w = Math.sin((u * 6 + k * 0.5 - t * 0.5) * 2) * 2.6, qx = px + ux * (k - 2) * 2 + nx * w, qy = py + uy * (k - 2) * 2 + ny * w; k ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); } ctx.stroke();
    } else if (fam === 'vine') {                // little leaf ticks
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * (i % 2 ? 5 : -5) + ux * 3, py + ny * (i % 2 ? 5 : -5) + uy * 3); ctx.stroke();
    } else if (fam === 'crystal') {             // frost shards on the edge
      ctx.beginPath(); ctx.moveTo(px - ux * 2, py - uy * 2); ctx.lineTo(px + nx * 5 * (i % 2 ? 1 : -1), py + ny * 5 * (i % 2 ? 1 : -1)); ctx.lineTo(px + ux * 2, py + uy * 2); ctx.stroke();
    } else if (fam === 'bolt') {                // jagged current
      ctx.beginPath(); ctx.moveTo(px - ux * 4, py - uy * 4); ctx.lineTo(px + nx * 4 * (j > 0.5 ? 1 : -1), py + ny * 4 * (j > 0.5 ? 1 : -1)); ctx.lineTo(px + ux * 4, py + uy * 4); ctx.stroke();
    } else { ctx.beginPath(); ctx.arc(px, py, 1.6, 0, TAU); ctx.fill(); }
  }
}

function glint(ctx, x, y, r, col) {            // tiny four-point star used to mark the instant of contact
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath();
  ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
}

function weaponProp(ctx, J, v, S) {
  const el = v.el, hand = LIMB[el.a](J)[1], th = v.th, L = el.wlen || 40, style = el.wstyle || 'staff';
  const c = Math.cos(th), s = Math.sin(th), tx = hand[0] + c * L, ty = hand[1] + s * L, nx = -s, ny = c;
  ctx.lineCap = 'round';
  if (style === 'katana' || style === 'dagger') {                 // thin steel blade, hilt wrap, round guard
    const bw = style === 'katana' ? 2.6 : 2.2;
    ctx.strokeStyle = '#1d2026'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(hand[0] - c * 8, hand[1] - s * 8); ctx.lineTo(hand[0] + c * 4, hand[1] + s * 4); ctx.stroke();
    ctx.strokeStyle = '#e8eef3'; ctx.lineWidth = bw; ctx.beginPath(); ctx.moveTo(hand[0] + c * 5, hand[1] + s * 5); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = rgba(S.pal[1], 0.8); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hand[0] + c * 8 + nx, hand[1] + s * 8 + ny); ctx.lineTo(tx - c * 4 + nx, ty - s * 4 + ny); ctx.stroke();   // temper line
    ctx.fillStyle = '#c9a24c'; ctx.beginPath(); ctx.ellipse(hand[0] + c * 5, hand[1] + s * 5, 1.6, 5, th, 0, TAU); ctx.fill();
    return;
  }
  ctx.strokeStyle = darken(S.pal[0], 0.55); ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(hand[0] - c * 7, hand[1] - s * 7); ctx.lineTo(hand[0] + c * 9, hand[1] + s * 9); ctx.stroke();   // grip
  ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 5.4; ctx.beginPath(); ctx.moveTo(hand[0] + c * 9, hand[1] + s * 9); ctx.lineTo(tx, ty); ctx.stroke();                                    // body of the weapon
  ctx.strokeStyle = lighten(S.pal[1], 0.35); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(hand[0] + c * 11, hand[1] + s * 11); ctx.lineTo(tx, ty); ctx.stroke();                     // edge
  ctx.strokeStyle = rgba(S.pal[2], 0.9); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hand[0] + c * 20, hand[1] + s * 20); ctx.lineTo(tx - c * 2, ty - s * 2); ctx.stroke();
  ctx.fillStyle = darken(S.pal[0], 0.2); ctx.beginPath(); ctx.arc(hand[0] + c * 9, hand[1] + s * 9, 3.2, 0, TAU); ctx.fill();                                                          // guard
}

export function paintPhys(ctx, viz, m, t, o = {}) {
  const J = o.J; if (!J) return;
  const [s, a] = m.fr, last = s + a - 1, sk = skinOf(m.skin, m.col);
  const S = { pal: sk.pal, fam: sk.fam };
  const seed = (hash(m.id.length * 977 + m.charId.length * 13) * 4096) | 0;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (viz.some((x) => x.el && x.el.wstyle === 'katana')) {                      // scabbard on the belt for katana users
    ctx.save(); ctx.strokeStyle = '#2a1f1a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(J.hip[0] - 4, J.hip[1] + 2); ctx.lineTo(J.hip[0] - 30, J.hip[1] + 15); ctx.stroke(); ctx.restore();
  }
  for (const v of viz) {
    const el = v.el; if (!el || v.k !== 'blade' || !LIMB[el.a]) continue;
    if (el.when === 'dive' && !o.dive) continue;
    if (el.when === 'land' && !o.landed) continue;
    if (el.when === 'counter' && !o.countered) continue;
    const [p0, p1] = LIMB[el.a](J);
    // 1) weapon prop is held for the whole move
    if (el.look === 'weapon') { ctx.save(); weaponProp(ctx, J, v, S); ctx.restore(); }
    // 2) element wrap only around the attack's own window (and a short wind-up cue)
    const win = el.u || [0, 1], gp = m.gp;
    const tt = gp ? (o.dive || o.landed ? last : t) : t;
    const pre = clamp01((t - (s - 5)) / 5), post = clamp01(1 - (t - (last + 3)) / 8);
    const on = gp ? (o.dive || o.landed) : (t >= s - 5 && t <= last + 11);
    if (on && el.look !== 'trail') {
      ctx.save(); ctx.globalAlpha = (gp ? 0.9 : Math.min(pre, post)) * (el.look === 'weapon' ? 0.7 : 1); wrap(ctx, p0, p1, S, t, seed + (v.i || 0)); ctx.restore();
    }
    if (el.look === 'trail' && t >= s && t <= last + 8) {                  // recovery: element wrap on both legs + speed lines behind the body
      ctx.save(); ctx.globalAlpha = Math.min(1, clamp01((t - s) / 3), post);
      wrap(ctx, ...LIMB.nf(J), S, t, seed); wrap(ctx, ...LIMB.ff(J), S, t, seed + 9);
      ctx.strokeStyle = rgba(S.pal[1], 0.5); ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) { const y = J.hip[1] - 14 + i * 12, x = J.hip[0] - 14 - i * 3, L = 22 + hash(seed + i + Math.floor(t / 3)) * 22; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L, y + nzs(seed, i) * 3); ctx.stroke(); }
      ctx.restore(); continue;
    }
    // 3) hairline smear + thin contact ring, strictly inside this element's own hit window
    if (v.live && v.eu > 0 && v.segs.length) {
      const tip = v.segs[v.segs.length - 1], tx = tip.x2, ty = tip.y2, rr = (tip.r || 10) + 2 + 8 * v.eu;
      ctx.save();
      ctx.globalAlpha = 0.45; ctx.strokeStyle = rgba(S.pal[1], 0.9); ctx.lineWidth = 1.6; ctx.beginPath();
      v.segs.forEach((g, i) => (i ? ctx.lineTo(g.x2, g.y2) : ctx.moveTo(g.x2, g.y2))); ctx.stroke();
      ctx.globalAlpha = Math.pow(1 - clamp01(v.eu), 1.1) * 0.95; ctx.strokeStyle = rgba(S.pal[2], 1); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(tx, ty, rr, 0, TAU); ctx.stroke();                       // thin contact ring (visual accent only)
      if (el.look === 'fist' || el.look === 'palm' || el.look === 'foot' || el.look === 'elbow') glint(ctx, tx, ty, 5 + 3 * (1 - v.eu), rgba(S.pal[2], 0.9));
      ctx.restore();
    }
  }
  ctx.restore();
}
