// gen2AttackAnims.js — Generation II (Era of Heroes) attack artwork, choreography and hitboxes.
// ONE skeleton (getGen2Rig) feeds both the renderer and the collision system, so the hitbox is
// literally the limb / blade / wave being drawn on that frame. Hits are consumed by fighter.js
// after the first confirmed contact, so every non-super attack hits once and then vanishes.
// No shadowBlur is used anywhere (layered strokes fake glow) so attacks stay cheap to draw.
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const TM = { ss: [.28, .22], us: [.26, .18], ds: [.30, .22], sh: [.34, .20], uh: [.36, .20], dh: [.38, .18], sp: [.38, .34] };
function ph2(move, t) { const [S, A] = TM[move] || TM.ss, q = clamp(t); return { t: q, S, A, w: clamp(q / S), c: clamp((q - S) / A), act: q >= S && q < S + A, post: q >= S + A, rec: clamp((q - S - A) / (1 - S - A)) }; }
const sg = (pts, w, hit = 0, role = 'main', o) => ({ t: 'seg', pts, w, hit, role, ...o });
const ob = (x, y, r, hit = 0, role = 'tip', o) => ({ t: 'orb', x, y, r, hit, role, ...o });
const gh = (x, a) => ({ t: 'ghost', x, a });
const mk = (x, y, r, a, role = 'tell', o) => ({ t: 'mark', x, y, r, a, role, ...o });
const gd = (x0, x1, y, hit = 0, role = 'wave', o) => ({ t: 'ground', x0, x1, y, hit, role, ...o });
const fd = ph => ph.post ? 1 - ease(ph.rec * 2.2) : 1;
const swp = ph => ph.act ? .3 + .7 * ph.c : ph.post ? 1 : -.15 * ease(ph.w);
const chn = (fn, v, n = 4) => Array.from({ length: n + 1 }, (_, i) => fn(v * i / n));

// ───────────── move archetypes: each returns the parts drawn (and hit) this frame ─────────────
const K = {
  thrust(ph, o) { const P = [], v = swp(ph), H = ph.act ? 1 : 0, a = fd(ph), y = o.y, tx = 18 + o.R * clamp(v, -.15, 1), wv = o.fl.includes('wave');
    if (!ph.act && !ph.post) { P.push(sg([[10, y], [2, y + 2]], o.w * .7, 0, 'pull', { a: .5 * ease(ph.w) })); if (o.fl.includes('ghost')) P.push(gh(-16, Math.sin(ph.w * Math.PI) * .8)); if (o.fl.includes('tell')) P.push(mk(18 + o.R, y, 8, .2 + .5 * ph.w)); return P; }
    const pts = Array.from({ length: 5 }, (_, i) => { const k = i / 4; return [10 + (tx - 10) * k, y + (wv ? Math.sin(k * 7 + ph.c * 5) * 7 : 0)]; });
    P.push(sg(pts, o.w, H * (o.w * .6 + 2), 'main', { a })); P.push(ob(tx, y, o.w * .9, H * (o.w * .9 + 3), 'tip', { a })); return P; },
  slash(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), ang = u => -1.25 + 1.9 * u, pt = (u, r) => [18 + r * Math.cos(ang(u)), -56 + r * Math.sin(ang(u))];
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(sg([pt(-.05, o.R * .45), pt(-.05, o.R * .95)], o.w * .8, 0, 'pull', { a: .5 + .4 * e })); if (o.fl.includes('ghost')) P.push(gh(-14, Math.sin(ph.w * Math.PI) * .7)); return P; }
    const u = clamp(swp(ph), 0, 1), outer = Array.from({ length: 7 }, (_, i) => pt(u * i / 6, o.R)), inner = Array.from({ length: 7 }, (_, i) => pt(u * i / 6, o.R * .62)), e = outer[6];
    P.push(sg(inner, o.w * .55, H * (o.w * .5), 'inner', { a: a * .65 })); P.push(sg(outer, o.w, H * (o.w * .7 + 3), 'main', { a })); P.push(ob(e[0], e[1], o.w * .8, H * (o.w * .8 + 3), 'tip', { a })); return P; },
  kick(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), foot = u => [16 + o.R * u, -22 - (o.up ?? 34) * Math.sin(clamp(u) * Math.PI * .7)];
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(sg([[4, -34], [14 + 4 * e, -46]], o.w * .8, 0, 'pull', { a: .6 * e })); if (o.fl.includes('ghost')) P.push(gh(-18, Math.sin(ph.w * Math.PI) * .8)); return P; }
    const u = clamp(swp(ph), 0, 1), f = foot(u), trail = chn(foot, u, 4);
    P.push(sg(trail, o.w * .7, H * (o.w * .5), 'trail', { a: a * .6 })); P.push(sg([[2, -36], [(2 + f[0]) / 2, f[1] - 12], f], o.w, H * (o.w * .7 + 3), 'main', { a })); P.push(ob(f[0], f[1], o.w * .95, H * (o.w + 3), 'tip', { a })); return P; },
  uppercut(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), F = u => [14 + 14 * Math.sin(u * Math.PI * .6), -30 - o.H * u];
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(ob(12, -28 + 6 * e, o.w * (.5 + .4 * e), 0, 'charge', { a: .5 + .4 * e })); return P; }
    const v = clamp(swp(ph), 0, 1), e = F(v); P.push(sg([[8, -34], ...chn(F, v, 5)], o.w, H * (o.w * .65 + 3), 'main', { a })); P.push(ob(e[0], e[1], o.w * .95, H * (o.w + 4), 'tip', { a })); return P; },
  pillar(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), X = o.X ?? 34;
    if (!ph.act && !ph.post) { P.push(mk(X, -3, 8 + 12 * ph.w, .3 + .5 * ph.w)); return P; }
    const h = o.H * ease(ph.act ? .3 + .7 * ph.c : 1) * (ph.post ? 1 - ease(ph.rec * 1.5) : 1);
    P.push(gd(X - o.w, X + o.w, -4, H * 10, 'burst', { a })); P.push(sg([[X, -2], [X + 3, -2 - h * .5], [X, -2 - h]], o.w, H * (o.w * .6 + 4), 'column', { a })); P.push(ob(X, -2 - h, o.w * .6, H * (o.w * .6 + 4), 'tip', { a })); return P; },
  pulse(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph);
    if (!ph.act && !ph.post) { P.push(mk(0, -3, 10 + 6 * Math.sin(ph.w * 9), .25 + .3 * ph.w, 'tell')); return P; }
    const S = 20 + o.R * ease(ph.act ? .3 + .7 * ph.c : 1); P.push(gd(-S, S, -5, H * 11, 'wave', { a })); P.push(gd(-S * .55, S * .55, -5, 0, 'wave2', { a: a * .7 })); P.push(ob(0, -6, 12, H * 14, 'core', { a })); return P; },
  stamp(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), X = o.X ?? 26;
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(sg([[X - 8, -34 - 6 * e], [X - 2, -26 - 4 * e]], 9, 0, 'pull', { a: .5 + .4 * e })); return P; }
    const r = o.R * ease(ph.act ? .3 + .7 * ph.c : 1) + 10; P.push(gd(X - r * 1.2, X + r * 1.2, -5, H * 8, 'burst', { a })); P.push(ob(X, -10, r, H * (r + 4), 'blast', { a })); return P; },
  sweep(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), t0 = ph.act ? ph.c : ph.post ? 1 : ph.w * .25, R = ph.act ? o.R * (.5 + .5 * ease(ph.c)) : ph.post ? o.R : 14 + 10 * ph.w;
    for (const k of [0, 1]) { const th = u => TAU * (.15 + .95 * u) + k * Math.PI, arc = Array.from({ length: 7 }, (_, i) => { const t = th(Math.max(0, t0 - .3 * (1 - i / 6))); return [Math.cos(t) * R, -8 + Math.sin(t) * R * .3]; }), tip = [Math.cos(th(t0)) * R, -8 + Math.sin(th(t0)) * R * .3];
      P.push(sg(arc, o.w, H * (o.w * .65), 'trail', { a })); P.push(sg([[0, -12], tip], o.w * .9, H * (o.w * .6), 'main', { a })); }
    P.push(mk(0, -3, 8, .5, 'tell')); return P; },
  slam(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), X = o.X ?? 40;
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(sg([[8, -62], [6, -62 - o.H * .5 * e], [4, -60 - o.H * e]], o.w * .7, 0, 'pull', { a: .85 })); P.push(ob(4, -60 - o.H * e, o.w * (.8 + .4 * e), 0, 'charge', { a: .85 })); return P; }
    const u = clamp(swp(ph), 0, 1), F = k => [lerp(4, X, k), lerp(-60 - o.H, -10, k * k)], f = F(u);
    P.push(sg([[8, -62], ...chn(F, u, 4)], o.w * .8, H * (o.w * .55 + 3), 'main', { a })); P.push(ob(f[0], f[1], o.w * 1.1, H * (o.w * 1.1 + 3), 'tip', { a }));
    if (u > .6) { const S = 20 + o.R * ease((u - .6) / .4); P.push(gd(X - S, X + S, -5, H * 10, 'wave', { a })); } return P; },
  arcOver(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph), ang = u => .3 - 3.0 * u, pt = (u, r) => [8 + r * Math.cos(ang(u)), -60 + r * Math.sin(ang(u)) * 1.1];
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(sg([pt(0, o.R * .4), pt(0, o.R * .9)], o.w * .8, 0, 'pull', { a: .4 + .5 * e })); return P; }
    const u = clamp(swp(ph), 0, 1), outer = Array.from({ length: 8 }, (_, i) => pt(u * i / 7, o.R)), inner = Array.from({ length: 8 }, (_, i) => pt(u * i / 7, o.R * .6)), e = outer[7];
    P.push(sg(inner, o.w * .55, H * (o.w * .5), 'inner', { a: a * .6 })); P.push(sg(outer, o.w, H * (o.w * .7 + 3), 'main', { a })); P.push(ob(e[0], e[1], o.w * .85, H * (o.w * .85 + 4), 'tip', { a })); return P; },
  burst(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph);
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(mk(0, -50, o.R * .4 * (1 - e * .6), .3 + .5 * e, 'tell')); P.push(ob(0, -50, 6 + 10 * e, 0, 'charge', { a: .5 + .4 * e })); return P; }
    const r = o.R * ease(ph.act ? .2 + .8 * ph.c : 1), ring = Array.from({ length: 17 }, (_, i) => { const t = i / 16 * TAU; return [Math.cos(t) * r, -50 + Math.sin(t) * r * .7]; });
    P.push(sg(ring, o.w, H * (o.w * .6 + 3), 'ring', { a })); P.push(ob(0, -50, r * .45, H * (r * .45 + 4), 'core', { a })); P.push(gd(-r, r, -5, H * 8, 'wave', { a: a * .8 })); return P; },
  lane(ph, o) { const P = [], H = ph.act ? 1 : 0, a = fd(ph);
    if (!ph.act && !ph.post) { const e = ease(ph.w); P.push(ob(30, -50, 6 + 14 * e, 0, 'charge', { a: .5 + .45 * e })); P.push(mk(30, -50, 22 * (1 - e * .5), .5, 'tell')); return P; }
    const d = ease(ph.act ? .15 + .85 * ph.c : 1), x = 30 + o.R * d;
    P.push(sg([[30, -50], [(30 + x) / 2, -50 + Math.sin(d * 9) * 4], [x, -50]], o.w * 1.4, H * (o.w * 1.2), 'beam', { a })); P.push(ob(x, -50, o.w * 1.6, H * (o.w * 1.8), 'head', { a })); return P; }
};

// ───────────── per-character move sheet: [archetype, reach/height, thickness, extras] ─────────────
// Order matches GEN2_ATTACK_NAMES: ss, us, ds, sh, uh, dh, sp.
const M = (k, A, w, ex = {}) => [k, A, w, ex];
const CFG = {
 g2_renji:{mat:'iron',c:['#9AA3AD','#3A424B','#E6EEF4'],moves:{ss:M('slash',78,13,{fl:['ghost']}),us:M('pillar',95,16,{X:34}),ds:M('stamp',30,0,{X:24}),sh:M('slash',108,22),uh:M('uppercut',125,20),dh:M('slam',70,22,{H:100,X:44}),sp:M('lane',240,22)}},
 g2_kaito:{mat:'ember',c:['#FF7A2A','#8A1E0C','#FFE08A'],moves:{ss:M('kick',62,14,{up:30}),us:M('uppercut',98,15),ds:M('stamp',32,0,{X:26}),sh:M('kick',100,20,{up:60}),uh:M('arcOver',88,18),dh:M('slam',70,20,{H:95,X:42}),sp:M('lane',230,22)}},
 g2_hana:{mat:'water',c:['#3CB8FF','#0E5A9E','#E3F8FF'],moves:{ss:M('thrust',82,12,{y:-46,fl:['wave']}),us:M('pillar',95,18,{X:30}),ds:M('pulse',60,0),sh:M('pillar',90,22,{X:72}),uh:M('arcOver',88,18),dh:M('pulse',70,0),sp:M('burst',135,16)}},
 g2_daigo:{mat:'stone',c:['#B79A72','#5B452B','#EBD9B8'],moves:{ss:M('thrust',74,16,{y:-44}),us:M('pillar',95,20,{X:32}),ds:M('stamp',30,0,{X:30}),sh:M('pillar',100,24,{X:70}),uh:M('slam',60,26,{H:105,X:36}),dh:M('slam',70,24,{H:100,X:44}),sp:M('lane',230,28)}},
 g2_suzu:{mat:'wind',c:['#7FF0D0','#1F8A78','#EFFFFA'],moves:{ss:M('kick',88,12,{up:28,fl:['ghost']}),us:M('uppercut',100,13),ds:M('stamp',30,0,{X:22}),sh:M('kick',108,16,{up:50,fl:['ghost']}),uh:M('arcOver',90,15),dh:M('sweep',62,12),sp:M('burst',140,16)}},
 g2_mai:{mat:'shadow',c:['#8A5CD6','#241238','#D8C2FF'],moves:{ss:M('kick',70,14,{fl:['ghost']}),us:M('pillar',100,16,{X:20}),ds:M('sweep',64,12),sh:M('slash',110,20,{fl:['ghost']}),uh:M('pillar',120,16,{X:50}),dh:M('slam',70,18,{H:100,X:40}),sp:M('lane',260,20)}},
 g2_osamu:{mat:'sound',c:['#FFD76A','#8A5E10','#FFF6D0'],moves:{ss:M('thrust',80,12,{y:-48}),us:M('uppercut',98,14),ds:M('pulse',62,0),sh:M('thrust',105,16,{fl:['tell']}),uh:M('pillar',120,20,{X:30}),dh:M('slam',70,20,{H:95,X:40}),sp:M('burst',140,16)}},
 g2_yui:{mat:'star',c:['#FFE45E','#B8860B','#FFFFFF'],moves:{ss:M('thrust',84,11,{y:-52}),us:M('uppercut',100,13),ds:M('pulse',58,0),sh:M('slash',104,16),uh:M('arcOver',90,15),dh:M('burst',85,14),sp:M('burst',140,16)}},
 g2_ibuki:{mat:'drain',c:['#FF6FA8','#6A1038','#FFD0E2'],moves:{ss:M('thrust',80,12,{fl:['wave']}),us:M('pillar',95,16,{X:28}),ds:M('pulse',60,0),sh:M('slash',106,18),uh:M('arcOver',90,16),dh:M('slam',70,20,{H:95,X:40}),sp:M('burst',135,16)}},
 g2_nishikawa:{mat:'thread',c:['#D99BFF','#53267A','#F6E6FF'],moves:{ss:M('thrust',88,9,{fl:['wave']}),us:M('uppercut',100,11),ds:M('sweep',64,10),sh:M('pillar',100,14,{X:70}),uh:M('arcOver',92,12),dh:M('slam',70,16,{H:100,X:40}),sp:M('burst',140,12)}},
 g2_itto:{mat:'blade',c:['#DDE6F0','#33415A','#FFFFFF'],moves:{ss:M('slash',84,9,{fl:['ghost']}),us:M('uppercut',105,9),ds:M('sweep',66,9),sh:M('slash',118,12,{fl:['ghost']}),uh:M('arcOver',94,11),dh:M('pulse',74,0),sp:M('lane',270,14)}},
 g2_twinfoxes:{mat:'fox',twin:true,c:['#FF9A3C','#7A2A0C','#FFF0B0'],alt:['#6FE6FF','#1B5C7A','#EAFBFF'],moves:{ss:M('slash',80,13),us:M('uppercut',98,13),ds:M('sweep',62,12),sh:M('thrust',100,16,{y:-48}),uh:M('arcOver',88,15),dh:M('slam',70,18,{H:95,X:40}),sp:M('burst',140,16)}},
 g2_utsuro:{mat:'hollow',c:['#7A3FA8','#0D0614','#D9A8FF'],moves:{ss:M('thrust',82,16,{y:-46}),us:M('uppercut',105,16),ds:M('stamp',34,0,{X:28}),sh:M('slash',112,20),uh:M('arcOver',92,18),dh:M('slam',70,22,{H:100,X:42}),sp:M('burst',150,20)}}
};
function mirror(P) { return P.map(p => p.t === 'seg' ? { ...p, pts: p.pts.map(([x, y]) => [-x, y]), alt: true } : p.t === 'orb' || p.t === 'mark' ? { ...p, x: -p.x, alt: true } : p.t === 'ground' ? { ...p, x0: -p.x1, x1: -p.x0, alt: true } : p.t === 'ghost' ? { ...p, x: -p.x, alt: true } : p); }
export function getGen2Rig(charId, move, t) {
  const C = CFG[charId], m = C?.moves[move]; if (!m) return [];
  const [kind, A, w, ex] = m, o = { R: A, w, y: -48, H: ex.H ?? A, X: ex.X, up: ex.up ?? 34, fl: ex.fl || [] };
  const ph = ph2(move, t), P = K[kind](ph, o);
  return C.twin ? P.concat(mirror(P)) : P;
}
function rigShapes(parts) {
  const out = [], ln = (x1, y1, x2, y2, r) => out.push({ shape: 'capsule', x1, y1, x2, y2, r });
  for (const p of parts) { if (!(p.hit > 0)) continue;
    if (p.t === 'seg') { if (p.pts.length === 1) out.push({ shape: 'circle', x: p.pts[0][0], y: p.pts[0][1], r: p.hit }); for (let i = 0; i < p.pts.length - 1; i++) ln(p.pts[i][0], p.pts[i][1], p.pts[i + 1][0], p.pts[i + 1][1], p.hit); }
    else if (p.t === 'orb') out.push({ shape: 'circle', x: p.x, y: p.y, r: p.hit });
    else if (p.t === 'ground') ln(p.x0, p.y, p.x1, p.y, p.hit); }
  return out;
}
// Collision = the drawn parts of this exact frame, mirrored for facing. attackSpecs adds the fighter origin.
export function getGen2Hitboxes(charId, move, p, facing = 1) {
  const f = facing < 0 ? -1 : 1;
  return rigShapes(getGen2Rig(charId, move, p)).map(h => h.shape === 'circle' ? { ...h, x: h.x * f } : { ...h, x1: h.x1 * f, x2: h.x2 * f });
}

// ───────────── artwork: 13 distinct material looks built from the same skeleton ─────────────
function path(ctx, pts) { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); }
function ribbon(ctx, pts, w0, w1, fill, a, edge) {
  const n = pts.length; if (n < 2) return; const L = [], R = [];
  for (let i = 0; i < n; i++) { const p = pts[i], pr = pts[Math.max(0, i - 1)], nx = pts[Math.min(n - 1, i + 1)]; let dx = nx[0] - pr[0], dy = nx[1] - pr[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const w = lerp(w0, w1, i / (n - 1)) / 2; L.push([p[0] - dy * w, p[1] + dx * w]); R.push([p[0] + dy * w, p[1] - dx * w]); }
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fill(); if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1.4; ctx.stroke(); } ctx.restore();
}
function line(ctx, pts, col, w, a) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; path(ctx, pts); ctx.stroke(); ctx.restore(); }
function disc(ctx, x, y, r, col, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
function tear(ctx, x, y, s, ang, col, a, tail) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -s * 1.7); ctx.quadraticCurveTo(s * 1.1, -s * .2, 0, s); ctx.quadraticCurveTo(-s * 1.1, -s * .2, 0, -s * 1.7); ctx.fill(); if (tail) { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, s); ctx.quadraticCurveTo(s * .9, s * 1.8, s * .3, s * 2.4); ctx.stroke(); } ctx.restore(); }
// One small signature motif per material, drawn at points along limbs / waves / orbs.
function deco(ctx, mat, x, y, ang, s, a, c, t) {
  const [m, d, l] = c;
  if (mat === 'iron') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = m; ctx.strokeStyle = l; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-s, -s * .6); ctx.lineTo(s * 1.4, 0); ctx.lineTo(-s, s * .6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = d; ctx.beginPath(); ctx.arc(-s * .1, 0, s * .22, 0, TAU); ctx.fill(); ctx.restore(); }
  else if (mat === 'ember') { tear(ctx, x, y, s, ang + Math.PI / 2 + Math.sin(t * .3 + x) * .3, m, a); tear(ctx, x, y + s * .2, s * .55, ang + Math.PI / 2, l, a); }
  else if (mat === 'water') { tear(ctx, x, y, s * .8, ang + Math.PI / 2, l, a * .9); }
  else if (mat === 'stone') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = m; ctx.strokeStyle = d; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-s, -s * .3); ctx.lineTo(-s * .2, -s); ctx.lineTo(s, -s * .5); ctx.lineTo(s * .8, s * .6); ctx.lineTo(-s * .5, s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = l; ctx.beginPath(); ctx.moveTo(-s * .2, -s); ctx.lineTo(s, -s * .5); ctx.lineTo(0, -s * .1); ctx.fill(); ctx.restore(); }
  else if (mat === 'wind') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.strokeStyle = l; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, s, -2.4, .7); ctx.stroke(); ctx.globalAlpha = a * .6; ctx.beginPath(); ctx.arc(0, 0, s * .6, -2.2, .4); ctx.stroke(); ctx.restore(); }
  else if (mat === 'shadow') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a * .9; ctx.fillStyle = d; ctx.strokeStyle = m; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 1.4, s * 1.8, 0); ctx.quadraticCurveTo(0, s * .5, -s, 0); ctx.fill(); ctx.stroke(); ctx.restore(); }
  else if (mat === 'sound') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.strokeStyle = l; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; for (let i = 0; i < 2; i++) { ctx.globalAlpha = a * (1 - i * .4); ctx.beginPath(); ctx.arc(0, 0, s * (.7 + i * .6), -1, 1); ctx.stroke(); } ctx.restore(); }
  else if (mat === 'star') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang + t * .03); ctx.globalAlpha = a; ctx.fillStyle = l; ctx.strokeStyle = m; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .4 : s * 1.2, q = i * Math.PI / 4; ctx.lineTo(Math.cos(q) * r, Math.sin(q) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  else if (mat === 'drain') { disc(ctx, x, y, s * .7, m, a); disc(ctx, x - s * .2, y - s * .2, s * .28, l, a); line(ctx, [[x, y], [x - Math.cos(ang) * s * 2, y - Math.sin(ang) * s * 2 + 3]], l, 1.2, a * .7); }
  else if (mat === 'thread') { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = l; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, s * .6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + s * .6, y); ctx.quadraticCurveTo(x + s * 1.5, y - s, x + s * 2.2, y + s * .3); ctx.stroke(); ctx.restore(); }
  else if (mat === 'blade') { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.strokeStyle = l; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 1.3, 0); ctx.lineTo(s * 1.3, 0); ctx.moveTo(0, -s * .7); ctx.lineTo(0, s * .7); ctx.stroke(); ctx.restore(); }
  else if (mat === 'fox') { tear(ctx, x, y, s, ang + Math.PI / 2 + Math.sin(t * .25 + x) * .35, m, a, true); tear(ctx, x, y + s * .2, s * .5, ang + Math.PI / 2, l, a); }
  else { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = d; ctx.strokeStyle = m; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, s * 1.2, s * .8, ang, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * .2, y - s * .4); ctx.lineTo(x + s * .3, y + s * .3); ctx.lineTo(x + s, y); ctx.stroke(); ctx.restore(); }
}
const SOFT = ['pull', 'trail', 'inner', 'wave2'];
function gSeg(ctx, C, mat, p, t) {
  const c = p.alt ? C.alt : C.c, a = p.a ?? 1, pts = p.pts, w = p.w; if (a <= .01 || pts.length < 2) return;
  const soft = SOFT.includes(p.role), thin = mat === 'thread' ? .55 : 1, tip = mat === 'blade' ? 1 : w * .35;
  if (soft) { ribbon(ctx, pts, w * .8, 1.5, c[0], a * .4); line(ctx, pts, c[2], 1.3, a * .5); }
  else {
    ribbon(ctx, pts, (w + 5) * thin, tip + 2, mat === 'shadow' || mat === 'hollow' ? c[1] : c[1], a * .85);
    ribbon(ctx, pts, w * thin, tip, mat === 'shadow' || mat === 'hollow' ? c[1] : c[0], a, mat === 'blade' ? '#FFFFFF' : mat === 'shadow' || mat === 'hollow' ? c[0] : null);
    line(ctx, pts, mat === 'hollow' ? c[0] : c[2], Math.max(1.2, w * .2 * thin), a * .75);
  }
  for (let i = 1; i < pts.length; i++) { const q = pts[i], pr = pts[i - 1], an = Math.atan2(q[1] - pr[1], q[0] - pr[0]); deco(ctx, mat, q[0], q[1] + (i % 2 ? -1 : 1) * w * .5, an, Math.max(3, w * (soft ? .28 : .42)), a * (soft ? .5 : .95), c, t); }
}
function gOrb(ctx, C, mat, p, t) {
  const c = p.alt ? C.alt : C.c, a = p.a ?? 1, r = p.r, x = p.x, y = p.y; if (a <= .01) return;
  disc(ctx, x, y, r * 1.15, c[1], a * .5);
  if (mat === 'shadow' || mat === 'hollow') { disc(ctx, x, y, r, c[1], a * .95); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = c[0]; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); disc(ctx, x, y, r * .35, c[2], a * .5); }
  else if (mat === 'sound') { for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = a * (1 - i * .25); ctx.strokeStyle = i ? c[0] : c[2]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r * (1 - i * .28), 0, TAU); ctx.stroke(); ctx.restore(); } disc(ctx, x, y, r * .22, c[2], a); }
  else { disc(ctx, x, y, r, c[0], a * .95); disc(ctx, x - r * .15, y - r * .15, r * .58, c[2], a * .75); }
  const n = mat === 'star' ? 4 : 6;
  for (let i = 0; i < n; i++) { const an = i / n * TAU + t * .05; deco(ctx, mat, x + Math.cos(an) * r * 1.2, y + Math.sin(an) * r * 1.2, an, Math.max(3, r * .3), a * .9, c, t); }
}
function gGround(ctx, C, mat, p, t) {
  const c = p.alt ? C.alt : C.c, a = p.a ?? 1, y = p.y, x0 = Math.min(p.x0, p.x1), x1 = Math.max(p.x0, p.x1); if (a <= .01 || x1 - x0 < 2) return;
  line(ctx, [[x0, y], [x1, y]], c[1], 5, a * .8); line(ctx, [[x0, y], [x1, y]], c[0], 2.6, a);
  const sp = Math.max(10, Math.min(18, (x1 - x0) / 6)); let k = 0;
  for (let x = x0 + sp / 2; x <= x1; x += sp, k++) deco(ctx, mat, x, y - 6 - ((k * 7) % 4) * 3, -Math.PI / 2, 5 + ((k * 5) % 3) * 2, a * (p.role === 'wave2' ? .6 : .95), c, t);
}
function gMark(ctx, C, mat, p, t) { const c = p.alt ? C.alt : C.c, a = p.a ?? 1; if (a <= .01) return; ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = a; ctx.strokeStyle = c[2]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .4, 0, 0, TAU); ctx.stroke(); ctx.restore(); deco(ctx, mat, p.x, p.y, 0, Math.max(3, p.r * .35), a, c, t); }
function gGhost(ctx, C, p) { const c = p.alt ? C.alt : C.c, x = p.x; ctx.save(); ctx.globalAlpha = Math.max(0, p.a) * .36; ctx.fillStyle = c[0]; ctx.strokeStyle = c[2]; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, -90, 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineCap = 'round'; ctx.strokeStyle = c[0]; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(x, -76); ctx.lineTo(x, -40); ctx.stroke(); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - 4, -40); ctx.lineTo(x - 8, -2); ctx.moveTo(x + 4, -40); ctx.lineTo(x + 8, -2); ctx.stroke(); ctx.restore(); }
function drawParts(ctx, charId, move, p) {
  const C = CFG[charId]; if (!C) return false; const mat = C.mat, t = clamp(p) * 60, parts = getGen2Rig(charId, move, p), ph = ph2(move, p);
  for (const q of parts) if (q.t === 'ghost') gGhost(ctx, C, q);
  for (const q of parts) if (q.t === 'mark') gMark(ctx, C, mat, q, t);
  for (const q of parts) if (q.t === 'ground') gGround(ctx, C, mat, q, t);
  for (const q of parts) if (q.t === 'seg') gSeg(ctx, C, mat, q, t);
  for (const q of parts) if (q.t === 'orb') gOrb(ctx, C, mat, q, t);
  const lead = parts.filter(q => q.t === 'orb' && q.hit > 0).slice(-1)[0];       // contact sparks at the live hit shape
  if (lead && (ph.act || (ph.post && ph.rec < .12))) { const k = ph.act ? clamp(ph.c * .6 + .1) : clamp(.6 + ph.rec * 3), c = lead.alt ? C.alt : C.c; for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + t * .04, d = 8 + 26 * k; deco(ctx, mat, lead.x + Math.cos(an) * d, lead.y + Math.sin(an) * d, an, 5, 1 - k * .8, c, t); } }
  return true;
}
export function drawGen2Attack(ctx, x, y, color, p, facing, charId, moveKey) {
  if (!CFG[charId]) return false; ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1);
  try { drawParts(ctx, charId, moveKey, clamp(p)); } finally { ctx.restore(); } return true;
}
export function drawGen2Super(ctx, x, y, color, p, charId, facing = 1) { return drawGen2Attack(ctx, x, y, color, p, facing, charId, 'sp'); }

// ───────────── body choreography (arms / lean / legs / bob blended per phase) ─────────────
const KP = {
 thrust:{lead:[-.6,-1.7],off:[.4,.2],lean:[-.05,.2],leg:[.15,.1],bob:[2,2]}, slash:{lead:[-2.4,-.9],off:[-1.4,.6],lean:[-.12,.26],leg:[.2,.3],bob:[-1,4]},
 kick:{lead:[-.4,-.4],off:[.5,-.3],lean:[-.18,.24],leg:[.9,1.4],bob:[0,-2]}, uppercut:{lead:[.5,-2.3],off:[-.3,.4],lean:[-.08,.08],leg:[.3,.5],bob:[4,-5]},
 pillar:{lead:[-.2,.8],off:[-.2,.8],lean:[.05,.18],leg:[.2,.2],bob:[4,6]}, pulse:{lead:[.3,.6],off:[.3,.6],lean:[.05,.15],leg:[.4,.5],bob:[4,8]},
 stamp:{lead:[.2,.4],off:[.2,.4],lean:[.04,.1],leg:[.8,1],bob:[-4,8]}, sweep:{lead:[.5,.9],off:[.5,-.9],lean:[.1,-.12],leg:[.5,.7],bob:[5,6]},
 slam:{lead:[-2.7,.6],off:[-2.3,.5],lean:[-.14,.34],leg:[.2,.4],bob:[-5,9]}, arcOver:{lead:[.4,-2.7],off:[.2,-2.2],lean:[.1,-.06],leg:[.3,.5],bob:[3,-6]},
 burst:{lead:[-.9,-1.8],off:[-.9,1.8],lean:[-.04,.14],leg:[.1,.2],bob:[2,0]}, lane:{lead:[-.7,-1.8],off:[.6,.6],lean:[-.06,.2],leg:[.2,.3],bob:[1,2]}
};
export function getGen2AttackPose(move, p, facing, charId) {
  const kind = CFG[charId]?.moves[move]?.[0], k = KP[kind]; if (!k) return null;
  const ph = ph2(move, p), v = pr => ph.act ? lerp(pr[0], pr[1], ease(ph.c)) : ph.post ? lerp(pr[1], 0, ease(ph.rec)) : lerp(0, pr[0], ease(ph.w));
  const lead = v(k.lead), off = v(k.off); let L = 0, R = 0; if (facing >= 0) { R = lead; L = off; } else { L = -lead; R = -off; }
  return { punchArmL: L, punchArmR: R, legSwing: v(k.leg), lean: facing * v(k.lean), bob: v(k.bob) };
}

export const GEN2_ATTACK_NAMES = {
  g2_renji:['Blade Morph','Steel Spike','Knee Ridge','Cleaver Arc','Drill Plate','Iron Hammer','Armored Fist'],
  g2_kaito:['Flaming Knee','Ember Uppercut','Ember Stamp','Rising Roundhouse','Burning Fistprints','Flame Body Blow','Compressed Ember'],
  g2_hana:['Water Ribbon','Water Cushion','Foot Shield','Tidal Column','Tilting Disc','Water Wall','Pressure Sphere'],
  g2_daigo:['Stone Bash','Stone Lift','Ground Wedge','Pillar Split','Falling Slab','Stone Club','Stone Fist'],
  g2_suzu:['Flying Kick','Wind Launch','Air Pocket','Spiral Kick','Landing Burst','Crosswind Reversal','Compressed Wind'],
  g2_mai:['Shadow Kick','Shadow Reappear','Shadow Slide','Shadow Wing','Distant Hand','Silhouette Blade','Darkness Crossing'],
  g2_osamu:['Concussive Pulse','Rising Ring','Ground Vibration','Resonance Rings','Ground Resonance','Waveform Impact','Silent Field'],
  g2_yui:['Starlight Streak','Rising Star','Protective Pulse','Catching Star','Stored Light','Star Shield','Restorative Core'],
  g2_ibuki:['Life Tether','Energy Rise','Drain Pulse','Siphon Swing','Circular Drain','Stored Vitality','Life Transfer'],
  g2_nishikawa:['Living Thread','Puppet Hand','Thread Kick','Knot Lift','Clap Hands','Thread Drill','String Circle'],
  g2_itto:['Element Slash','Rising Draw','Reverse Cut','Iaijutsu Arc','Ground Cut','Long Draw','Severance'],
  g2_twinfoxes:['Crossing Foxfire','Coordinated Launch','Twin Orbit','Twin Rush','Closing Foxfire','Opposite Charge','Foxfire Spirits'],
  g2_utsuro:['Hollow Lunge','Hollow Hand','Hollow Emergence','Entity Swing','Entity Circle','Hollow Charge','Elementor Call']
};
