// Generation I hand-authored attack animation system.
// IMPORTANT: every directional attack is authored facing RIGHT and mirrored
// with the canvas transform. This guarantees left/right are literal flips of
// the same move instead of two different animations.

const TAU = Math.PI * 2;
let FIRE_PERF_MODE = false;
let WATER_PERF_MODE = false;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const easeOut = v => 1 - Math.pow(1 - clamp01(v), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const alpha = p => Math.sin(clamp01(p) * Math.PI);

function glow(ctx, color, blur = 18) { if (FIRE_PERF_MODE || WATER_PERF_MODE) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; } else { ctx.shadowColor = color; ctx.shadowBlur = blur; } }
function strokePath(ctx, pts, color, width, a = 1, dash = null) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  glow(ctx, color, Math.max(8, width * 2.2));
  ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  ctx.restore();
}
function fillPoly(ctx, pts, color, a = 1, stroke = '#FFFFFF') {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 16); ctx.beginPath();
  pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
  if (stroke) { ctx.globalAlpha = a * 0.9; ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
}
function dot(ctx, x, y, r, color, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 20); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}
function lineBolt(ctx, x, y, len, h, color, a = 1) {
  const pts = [[x, y], [x + len * .23, y - h * .45], [x + len * .14, y - h * .02], [x + len * .52, y - h * .22], [x + len * .42, y + h * .38], [x + len * .82, y + h * .02], [x + len * .62, y - h * .55], [x + len, y - h * .18]];
  fillPoly(ctx, pts, color, a, '#FFFFFF');
}
function flame(ctx, x, y, r, color, a = 1, angle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = a; glow(ctx, color, 18); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .8, -r * .1, r * .2, r); ctx.quadraticCurveTo(-r * .85, r * .35, 0, -r); ctx.fill();
  ctx.globalAlpha = a * .7; ctx.fillStyle = '#FFF4C4'; ctx.beginPath(); ctx.moveTo(0, -r * .55); ctx.quadraticCurveTo(r * .32, 0, 0, r * .52); ctx.quadraticCurveTo(-r * .32, 0, 0, -r * .55); ctx.fill();
  ctx.restore();
}
function waterStroke(ctx, pts, color, width, a = 1) {
  strokePath(ctx, pts, color, width, a);
  strokePath(ctx, pts, '#FFFFFF', Math.max(1.5, width * .16), a * .55);
}
function leaf(ctx, x, y, rx, ry, angle, color, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 10);
  ctx.beginPath(); ctx.moveTo(0, -ry); ctx.quadraticCurveTo(rx, -ry * .15, 0, ry); ctx.quadraticCurveTo(-rx, -ry * .15, 0, -ry); ctx.fill(); ctx.restore();
}
function shard(ctx, x, y, w, h, angle, color, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = a; ctx.fillStyle = color; glow(ctx, color, 14);
  ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(w, h * .55); ctx.lineTo(-w * .55, h * .35); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
}
function particles(ctx, x, y, color, p, count, radius, spread = TAU) {
  for (let i = 0; i < count; i++) {
    const a = i / count * spread + p * 5;
    const r = radius * (.4 + ((i * 17) % 11) / 11);
    dot(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * .65, 1.4 + (i % 3), color, .35 * (1 - p));
  }
}

// Thunder charging/hold frames. These are deliberately separate from the
// released Thunder animations below: the released animation is unchanged.
// While the button is held, the move is only a translucent visual preview and
// has no hitbox because fighter.js does not execute the attack until release.
function thunderHold(ctx, x, y, move, q) {
  const c = '#FFFF44';
  const charge = Math.max(0, Math.min(1, q));
  const a = 0.16 + charge * 0.22;
  const pulse = 1 + Math.sin(charge * Math.PI * 6) * 0.04;
  ctx.save();
  ctx.globalAlpha = a;

  if (move === 'us') {
    const cy = y - 112, rx = 86 * pulse, ry = 34 * pulse;
    ctx.strokeStyle = c; ctx.lineWidth = 2.5; glow(ctx, c, 12);
    ctx.setLineDash([7, 8]);
    ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, REF_TAU); ctx.stroke();
    const theta = -Math.PI / 2 + charge * REF_TAU;
    dot(ctx, x + Math.cos(theta) * rx, cy + Math.sin(theta) * ry, 5 + charge * 2, '#FFFFFF', .8);
  } else if (move === 'ds') {
    dot(ctx, x - 22, y - 45, 8 + charge * 3, '#FFFFFF', .8);
    dot(ctx, x + 22, y - 45, 8 + charge * 3, '#FFFFFF', .8);
    dot(ctx, x - 22, y - 45, 5 + charge * 2, c, .9);
    dot(ctx, x + 22, y - 45, 5 + charge * 2, c, .9);
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([5, 7]);
    ctx.beginPath(); ctx.arc(x, y - 24, 18 + charge * 35, Math.PI, REF_TAU); ctx.stroke();
  } else if (move === 'ss' || move === 'heavy') {
    const len = move === 'heavy' ? 100 : 68;
    ctx.strokeStyle = c; ctx.lineWidth = move === 'heavy' ? 5 : 3;
    ctx.setLineDash([8, 9]);
    glow(ctx, c, 14);
    ctx.beginPath(); ctx.moveTo(x + 24, y - 50);
    ctx.lineTo(x + 24 + len * (0.25 + charge * 0.75), y - 50); ctx.stroke();
    lineBolt(ctx, x + 24 + len * (0.15 + charge * .5), y - 50, len * .35, move === 'heavy' ? 34 : 24, c, .55);
  } else if (move === 'uh' || move === 'upHeavy') {
    for (const dx of [24, 82, 140]) {
      const top = y - 38 - (65 + charge * 85);
      lineBolt(ctx, x + dx, top, 22, 42, c, .6);
    }
  } else if (move === 'dh' || move === 'downHeavy') {
    const r = 94;
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([7, 9]);
    ctx.beginPath(); ctx.arc(x + 20, y - 72, r, 0, REF_TAU); ctx.stroke();
    const ang = -Math.PI / 2 + charge * REF_TAU;
    dot(ctx, x + 20 + Math.cos(ang) * r, y - 72 + Math.sin(ang) * r * .6, 10, c, .75);
  }

  ctx.setLineDash([]);
  ctx.restore();
}

// Thunder Up Signature — deliberately follows the supplied 12-frame reference:
// 1 startup, 2 circle begins, 3-8 moving dot around the ring, 9 launch, 10
// circle continues, 11 near-end, 12 recovery. The hitbox is NOT the circle.
// It is only the moving dot at the beginning of the circular path.
function thunderUp(ctx, x, y, p) {
  // This is intentionally authored as the supplied 12-frame reference:
  // 1 startup, 2 circle begins, 3-8 orbit, 9 launch, 10 continue,
  // 11 near-end, 12 recovery. The visible circle is never the hitbox.
  const c = '#FFFF44';
  const frame = 1 + clamp01(p) * 11;
  const cy = y - 112;
  const rx = 86, ry = 34;
  const start = -Math.PI / 2;
  const orbitT = clamp01((frame - 2) / 6);
  const theta = start + ease(orbitT) * TAU;
  const dotX = x + Math.cos(theta) * rx;
  const dotY = cy + Math.sin(theta) * ry;

  ctx.save();

  // Frame 1: startup pose only — no attack shape yet.
  if (frame < 1.75) {
    dot(ctx, x, y - 52, 3, c, .18 + alpha(p) * .2);
    ctx.restore();
    return;
  }

  // Frame 2 onward: the lightning circle appears above the head.
  const circleAlpha = frame < 2.5 ? (frame - 1.75) / .75 : 1;
  ctx.globalAlpha = .35 * circleAlpha;
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  glow(ctx, c, 14);
  ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, TAU); ctx.stroke();

  // The moving dot is the beginning of the circular line. It is deliberately
  // brighter/larger than the path so the attack's actual collision point is clear.
  if (frame >= 2) {
    const traceT = clamp01((frame - 2) / 8.7);
    ctx.globalAlpha = .78 * alpha(p) + .22;
    ctx.strokeStyle = c; ctx.lineWidth = 3.5; glow(ctx, c, 22);
    ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, start, start + traceT * TAU); ctx.stroke();

    // Electrical breaks along the authored path.
    for (let i = 0; i < 7; i++) {
      const a = start + (i / 7) * TAU + p * .04;
      const px = x + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
      const qx = x + Math.cos(a + .07) * (rx + 5), qy = cy + Math.sin(a + .07) * (ry + 2);
      strokePath(ctx, [[px, py], [qx, qy]], c, 1.6, .5 * alpha(p));
    }

    dot(ctx, dotX, dotY, frame < 3 ? 6 : 8, '#FFFFFF', .98);
    dot(ctx, dotX, dotY, 5.5, c, 1);
  }

  // Frame 9: upward launch begins while the circle is still completing.
  if (frame >= 9 && frame < 12) {
    const launch = easeOut((frame - 9) / 2.6);
    for (let i = 0; i < 8; i++) {
      const yy = y - 24 - launch * (45 + i * 18);
      strokePath(ctx, [[x - 15 + i * 4, y - 4], [x - 8 + i * 2, yy]], c, 2.4, (.5 - i * .045) * (1 - launch * .2));
    }
    dot(ctx, x, y - 48 - launch * 80, 4.5, '#FFFFFF', .8);
  }

  // Frame 10/11: the orbit finishes and discharges into the launch.
  if (frame >= 10) {
    const q = clamp01((frame - 10) / 2);
    particles(ctx, x, cy, c, q, 16, 100);
  }
  if (frame >= 11.5) {
    ctx.globalAlpha = (frame - 11.5) / .5;
    ctx.strokeStyle = c; ctx.lineWidth = 2; glow(ctx, c, 16);
    ctx.beginPath(); ctx.ellipse(x, cy, rx * .65, ry * .25, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function thunderDown(ctx, x, y, p) {
  const c = '#FFFF44'; const q = ease(p); const r = 18 + q * 35;
  // Two charged balls in the hands.
  dot(ctx, x - 22, y - 45, 7 + q * 3, '#FFFFFF', .85); dot(ctx, x + 22, y - 45, 7 + q * 3, '#FFFFFF', .85);
  dot(ctx, x - 22, y - 45, 4 + q * 2, c); dot(ctx, x + 22, y - 45, 4 + q * 2, c);
  if (p > .28) {
    ctx.save(); ctx.globalAlpha = alpha(p); ctx.strokeStyle = c; ctx.lineWidth = 5; glow(ctx, c, 20);
    ctx.beginPath(); ctx.arc(x, y - 24, r, Math.PI, TAU); ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI + i / 9 * Math.PI;
      const px = x + Math.cos(a) * r, py = y - 24 + Math.sin(a) * r;
      lineBolt(ctx, px, py, 11, 9, c, .75 * alpha(p));
    }
    ctx.restore();
  }
}

function thunderSide(ctx, x, y, p, heavy) {
  const c = '#FFFF44'; const len = heavy ? 100 : 68; const h = heavy ? 34 : 24; const q = easeOut(p);
  if (p < .25) {
    strokePath(ctx, [[x + 7, y - 52], [x + 25 + q * 12, y - 45]], c, heavy ? 5 : 3, alpha(p));
  }
  lineBolt(ctx, x + 24, y - 50, len * q, h, c, alpha(p));
  for (let i = 0; i < (heavy ? 7 : 4); i++) dot(ctx, x + 25 + len * q * (i / Math.max(1, heavy ? 6 : 3)), y - 50 + Math.sin(i * 2.4) * 5, 1.5, c, .35 * alpha(p));
}

function thunderUpHeavy(ctx, x, y, p) {
  const c = '#FFFF44'; const q = easeOut(p);
  for (const dx of [24, 82, 140]) {
    const top = y - 38 - q * 150;
    lineBolt(ctx, x + dx, top, 22, 42, c, alpha(p));
    for (let i = 0; i < 3; i++) dot(ctx, x + dx + 8 + Math.sin(i + p * 8) * 4, top + i * 38, 2, c, .5 * alpha(p));
  }
}

function thunderDownHeavy(ctx, x, y, p) {
  const c = '#FFFF44'; const q = easeOut(p); const a = alpha(p); const ang = -Math.PI / 2 + q * TAU; const r = 94;
  ctx.save(); ctx.globalAlpha = .3 * a; ctx.strokeStyle = c; ctx.setLineDash([6, 7]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 20, y - 72, r, 0, TAU); ctx.stroke(); ctx.restore();
  const bx = x + 20 + Math.cos(ang) * r, by = y - 72 + Math.sin(ang) * r * .6;
  dot(ctx, bx, by, 13, c, a);
  for (let i = 1; i <= 5; i++) dot(ctx, bx - Math.cos(ang) * i * 12, by - Math.sin(ang) * i * 7, Math.max(2, 8 - i), c, a * (.5 - i * .07));
}

function thunderSuper(ctx, x, y, p) {
  const c = '#FFFF44'; const a = alpha(p); const q = easeOut(p);
  // Giant bolt falls on the fighter's X. Only the bottom impact section is the hit.
  const top = y - 470 + q * 120;
  const impact = y - 8;
  lineBolt(ctx, x - 44, top, 88, 70, c, a * .85);
  strokePath(ctx, [[x - 5, top + 45], [x + 7, top + 100], [x - 10, top + 155], [x + 8, top + 215], [x - 4, impact]], c, 16, a * .8);
  if (p > .52) {
    ctx.save(); ctx.globalAlpha = a * .8; ctx.fillStyle = '#FFFFFF'; glow(ctx, c, 28); ctx.beginPath(); ctx.ellipse(x, impact, 46 + (p - .52) * 40, 12 + (p - .52) * 16, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation I — authored, frame-driven attack animation set.
// The four non-Thunder heroes use deliberate 12-frame silhouettes inspired by
// the supplied reference sheets.  The up-signatures are kept on the same
// frame beats: startup -> formation -> travel -> hit/launch -> recovery.
// p >= 0 is the released animation. p < 0 is the 3-second charging/hold pose;
// charge is encoded as -p-1 so the effect visibly forms while held.

const REF_TAU = Math.PI * 2;
const holdCharge = p => p < 0 ? Math.max(0, Math.min(1, -p - 1)) : 0;
const attackP = p => Math.max(0, Math.min(1, p));
const refFrame = p => 1 + attackP(p) * 11;

function spark(ctx, x, y, r, c, a=1) {
  ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=14;
  ctx.beginPath(); ctx.arc(x,y,r,0,REF_TAU); ctx.fill(); ctx.restore();
}
function glowStroke(ctx, pts, c, w, a=1) {
  ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.shadowColor=c; ctx.shadowBlur=Math.max(8,w*2.5); ctx.beginPath();
  pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke(); ctx.restore();
}
function glowArc(ctx, x,y,rx,ry,a0,a1,c,w,a=1,rot=0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; ctx.shadowColor=c; ctx.shadowBlur=Math.max(10,w*2.5);
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,a0,a1); ctx.stroke(); ctx.restore();
}
function core(ctx,x,y,r,c,a=1){ spark(ctx,x,y,r,'#fff',a*.85); spark(ctx,x,y,r*.58,c,a); }
function flameShape(ctx,x,y,r,c,a=1,rot=0){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=a; ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=18;
  ctx.beginPath(); ctx.moveTo(0,-r); ctx.bezierCurveTo(r*.75,-r*.15,r*.65,r*.55,0,r); ctx.bezierCurveTo(-r*.75,r*.5,-r*.5,-r*.05,0,-r); ctx.fill();
  ctx.fillStyle='#FFF3B0'; ctx.globalAlpha*=.75; ctx.beginPath(); ctx.moveTo(0,-r*.55); ctx.bezierCurveTo(r*.28,-r*.05,r*.25,r*.35,0,r*.52); ctx.bezierCurveTo(-r*.25,r*.3,-r*.18,-r*.05,0,-r*.55); ctx.fill(); ctx.restore();
}
function waterRing(ctx,x,y,rx,ry,c,a=1,rot=0){
  glowArc(ctx,x,y,rx,ry,0,REF_TAU,c,7,a,rot);
  glowArc(ctx,x,y,rx*.72,ry*.62,0,REF_TAU,'#dffaff',2,a*.65,rot);
  for(let i=0;i<8;i++){const t=i/8*REF_TAU; spark(ctx,x+Math.cos(t)*rx,y+Math.sin(t)*ry,2.2,c,a*.8);}
}
function leafBlade(ctx,x,y,rx,ry,rot,c,a=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=12;
  ctx.beginPath();ctx.moveTo(0,-ry);ctx.quadraticCurveTo(rx,-ry*.2,0,ry);ctx.quadraticCurveTo(-rx,-ry*.2,0,-ry);ctx.fill();ctx.restore();
}
function iceShard(ctx,x,y,w,h,rot,c,a=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=18;
  ctx.beginPath();ctx.moveTo(0,-h);ctx.lineTo(w,h*.35);ctx.lineTo(w*.35,h);ctx.lineTo(-w*.65,h*.55);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#F4FFFF';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}

// ── Exact reference-style UP SIGNATURES ─────────────────────────────────────

function fireRefFrame(p, count){
  return Math.min(count, Math.floor(attackP(p) * count) + 1);
}
function fireRefPhase(p, count){
  const z=attackP(p)*count;
  const frame=Math.min(count, Math.floor(z)+1);
  const u=Math.max(0,Math.min(1,z-Math.floor(z)));
  return {frame,u,z};
}
function smoothFire(u){ return u*u*(3-2*u); }
function fireRing(ctx,cx,cy,rx,ry,c,a=1,rot=0,seed=0){
  // Irregular, broken fire wheel/ring: deliberately NOT a smooth ellipse.
  const n=18, pts=[];
  for(let i=0;i<=n;i++){
    const t=i/n*REF_TAU;
    const wob=1 + .09*Math.sin(i*2.71+seed) + .045*Math.sin(i*5.17-seed*.6);
    pts.push([cx+Math.cos(t)*rx*wob, cy+Math.sin(t)*ry*wob]);
  }
  glowStroke(ctx,pts,c,4.5,a);
  for(let i=0;i<10;i++){
    const t=(i+.18*Math.sin(i*3.1+seed))/10*REF_TAU;
    const rr=1+.08*Math.sin(i*2.3+seed);
    const fx=cx+Math.cos(t)*rx*rr, fy=cy+Math.sin(t)*ry*rr;
    flameShape(ctx,fx,fy,5.5+.8*Math.sin(i+seed),i%2?'#FF9A22':'#FF6A18',a*.9,t+Math.PI/2);
  }
}
function fireBlob(ctx,cx,cy,r,c='#FF5A16',a=1,seed=0){
  // Lopsided fireball with flame lobes, matching the reference rather than a circle.
  const n=14, pts=[];
  for(let i=0;i<n;i++){
    const t=i/n*REF_TAU;
    const wob=1+.14*Math.sin(i*2.13+seed)+.07*Math.sin(i*4.7-seed);
    pts.push([cx+Math.cos(t)*r*wob,cy+Math.sin(t)*r*.82*wob]);
  }
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;if(!FIRE_PERF_MODE){ctx.shadowColor=c;ctx.shadowBlur=24;}else ctx.shadowBlur=0;ctx.beginPath();
  pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();ctx.restore();
  const inner=Math.max(4,r*.45);
  ctx.save();ctx.globalAlpha=a*.72;ctx.fillStyle='#FFF0A0';if(!FIRE_PERF_MODE){ctx.shadowColor='#FFB12B';ctx.shadowBlur=18;}else ctx.shadowBlur=0;ctx.beginPath();ctx.arc(cx-r*.08,cy-r*.08,inner,0,REF_TAU);ctx.fill();ctx.restore();
  for(let i=0;i<7;i++){
    const t=-2.7+i*.22;
    flameShape(ctx,cx+Math.cos(t)*r*.8,cy+Math.sin(t)*r*.62,r*(.18+.03*(i%3)), '#FF9A22',a*.8,t+Math.PI/2);
  }
}
function fireRay(ctx,x,y,angle,len,a=1,hot='#FF9A22'){
  const ux=Math.cos(angle), uy=Math.sin(angle), px=-uy, py=ux;
  const s=.12*len, m=.52*len;
  const pts=[[x+ux*4,y+uy*4],[x+ux*s+px*3,y+uy*s+py*3],[x+ux*m-px*2,y+uy*m-py*2],[x+ux*len,y+uy*len]];
  glowStroke(ctx,pts,hot,3.4,a);
  flameShape(ctx,x+ux*len,y+uy*len,5.5,hot,a*.9,angle+Math.PI/2);
  if(len>35) glowStroke(ctx,[[x+ux*18+px*2,y+uy*18+py*2],[x+ux*(len*.68)-px*1,y+uy*(len*.68)-py*1]],'#FF5A16',1.7,a*.75);
}
function fireLineBurstLegacy(ctx,x,y,r,alpha=1){ fireLineBurst(ctx,x,y,r,alpha,0); }
function fireLineBurst(ctx,x,y,r,alpha=1,phase=0){
  // Short jagged flame rays radiating from the impact point.
  const count=10;
  for(let i=0;i<count;i++){
    const a=i/count*REF_TAU + phase*.08;
    const len=r*(.68+.22*Math.sin(i*2.1+phase));
    fireRay(ctx,x,y,a,len,alpha*(.86+.12*Math.sin(i+phase)));
  }
  fireBlob(ctx,x,y,Math.max(6,r*.18),'#FF6A18',alpha*.9,phase);
}
function handPosePoint(x,y,facing,move){
  // Effects are authored in forward-local coordinates. The renderer mirrors them.
  if(move==='us') return [28,-91];
  if(move==='sh') return [48,-45];
  return [38,-42];
}

function fireUpReference(ctx,x,y,p){
  const c='#FF5A16', hot='#FF9A22';
  if(p<0){
    const q=holdCharge(p), [hx,hy]=handPosePoint(x,y,1,'us');
    fireRing(ctx,hx,hy,18+q*5,11+q*3,hot,.58+q*.3,0,q*2);
    return;
  }
  const {frame,u}=fireRefPhase(p,4), v=smoothFire(u);
  const [hx,hy]=handPosePoint(x,y,1,'us');
  if(frame===1){ return; }
  if(frame===2){
    const pulse=1+.06*Math.sin(u*REF_TAU);
    fireRing(ctx,hx,hy,20*pulse,13*pulse,hot,.98,0,u*2);
    return;
  }
  if(frame===3){
    // It leaves the hand quickly, but begins at the hand and remains close for the start of the launch.
    const launch=v;
    fireRing(ctx,hx,hy,19-4*launch,12-3*launch,c,.85*(1-launch),0,u);
    const fx=hx+7+32*launch, fy=hy-4-35*launch;
    fireBlob(ctx,fx,fy,11+3*(1-launch),hot,.95,u*3);
    for(let i=0;i<5;i++) fireRay(ctx,fx,fy,-2.55+i*.16,10+i*3,.55);
    return;
  }
  const launch=smoothFire(u);
  const fx=hx+39+34*launch, fy=hy-40-26*launch;
  fireBlob(ctx,fx,fy,12*(1-launch)+5,hot,.9*(1-.45*launch),u*4);
  for(let i=0;i<8;i++){
    const a=-2.55+i*.18;
    fireRay(ctx,fx,fy,a,10+i*2,.55*(1-launch));
  }
}

function fireSideReference(ctx,x,y,p){
  const c='#FF5A16', hot='#FF9A22';
  if(p<0){
    const q=holdCharge(p), [hx,hy]=handPosePoint(x,y,1,'ss');
    // Hold stays attached to the lead hand; facing is handled by drawGen1Attack.
    fireRing(ctx,hx,hy,12+q*5,9+q*4,hot,.58+q*.3,-.3,q);
    return;
  }
  const z=attackP(p)*4;
  const i=Math.min(3,Math.floor(z));
  const u=smoothFire(z-Math.floor(z));
  const lerp=(a,b)=>a+(b-a)*u;
  const hx=x+47, hy=y-45;

  // Continuous side-signature motion: hand/fire travel through the four
  // reference poses instead of snapping at the frame boundaries.
  if(i===0){
    const k=lerp(0,1);
    fireRing(ctx,hx,hy,12+2*k,8+2*k,hot,.78+.17*k,-.28+k*.03,z*.4);
  } else if(i===1){
    const k=lerp(0,1);
    const cx=hx+7*k, cy=hy-2*k;
    const r=14+6*k;
    fireRing(ctx,cx,cy,r,r*.66,hot,.95,-.24,z*.35);
    fireBlob(ctx,cx,cy,r*.82,hot,.72,z*.8);
  } else if(i===2){
    // The flame remains connected to the hand at the beginning of launch,
    // then separates smoothly as the projectile gains speed.
    const k=lerp(0,1);
    const separation=4+18*k;
    const cx=hx+separation, cy=hy-2*k;
    const r=19+4*k;
    fireRing(ctx,cx,cy,r,r*.62,hot,.98,-.16,z*.5);
    fireBlob(ctx,cx,cy,r*.86,hot,.9,z);
    for(let n=0;n<5;n++) fireRay(ctx,hx+separation*.45,cy,-.20+n*.09,8+n*2,.32);
  } else {
    const k=lerp(0,1);
    const separation=22+48*k;
    const cx=hx+separation, cy=hy-2-2*k;
    const r=18*(1-k)+6;
    fireBlob(ctx,cx,cy,r,hot,.92*(1-.35*k),z*1.1);
    for(let n=0;n<7;n++) fireRay(ctx,cx,cy,-.24+n*.08,10+n*2,.45*(1-k));
  }
}
function fireDownReference(ctx,x,y,p){
  const hot='#FF9A22',dark='#160604';
  if(p<0){
    const q=holdCharge(p),ox=x+24,oy=y-44+q*35;
    fireBlob(ctx,ox,oy,6+q*3,dark,.7+q*.15,q);
    return;
  }
  const {frame,u}=fireRefPhase(p,4),v=smoothFire(u),ox=x+24;
  if(frame===1){ fireBlob(ctx,ox,y-44,7,'#180504',.9,u); return; }
  if(frame===2){
    const oy=y-44+40*v;
    fireBlob(ctx,ox,oy,8+3*v,'#180504',1,u);
    return;
  }
  if(frame===3){
    fireLineBurst(ctx,ox,y-3,18+46*v,1,u*5);
    return;
  }
  fireLineBurst(ctx,ox,y-3,60+12*v,.72*(1-.3*v),u*6);
}

function fireWheelFast(ctx,cx,cy,rx,ry,c,a=1,rot=0,seed=0){
  // Same irregular wheel silhouette, but render the whole glow once and use
  // lightweight flame tips instead of ten independent shadow-blurred shapes.
  const n=18, pts=[];
  for(let i=0;i<=n;i++){
    const t=i/n*REF_TAU;
    const wob=1 + .09*Math.sin(i*2.71+seed) + .045*Math.sin(i*5.17-seed*.6);
    pts.push([cx+Math.cos(t)*rx*wob, cy+Math.sin(t)*ry*wob]);
  }
  ctx.save();
  ctx.globalAlpha=a;
  ctx.strokeStyle=c; ctx.lineWidth=4.5; ctx.lineCap='round'; ctx.lineJoin='round';
  if(!FIRE_PERF_MODE){ctx.shadowColor=c;ctx.shadowBlur=9;}else ctx.shadowBlur=0;
  ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  ctx.shadowBlur=0;
  for(let i=0;i<8;i++){
    const t=(i+.18*Math.sin(i*3.1+seed))/8*REF_TAU;
    const rr=1+.08*Math.sin(i*2.3+seed);
    const fx=cx+Math.cos(t)*rx*rr, fy=cy+Math.sin(t)*ry*rr;
    const r=5.5+.7*Math.sin(i+seed);
    ctx.save(); ctx.translate(fx,fy); ctx.rotate(t+Math.PI/2); ctx.globalAlpha=a*.82; ctx.fillStyle=i%2?'#FF9A22':'#FF6A18';
    ctx.beginPath(); ctx.moveTo(0,-r); ctx.quadraticCurveTo(r*.75,-r*.15,r*.2,r); ctx.quadraticCurveTo(-r*.75,r*.5,0,-r); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

function fireUpHeavyReference(ctx,x,y,p){
  const c='#FF5A16',hot='#FF9A22';
  if(p<0){ const q=holdCharge(p); fireWheelFast(ctx,x,y-94,30+q*6,13+q*3,hot,.5+q*.3,0,q); return; }
  const {frame,u}=fireRefPhase(p,4),v=smoothFire(u),cy=y-96;
  if(frame===1){ flameShape(ctx,x-5,y-104,7,hot,.5,-Math.PI/2); flameShape(ctx,x+5,y-104,7,hot,.5,-Math.PI/2); return; }
  if(frame===2){ fireWheelFast(ctx,x,cy,58,25,c,.98,0,u*2); return; }
  if(frame===3){ fireWheelFast(ctx,x,cy,58+3*v,25+2*v,c,.98,0,u*3); return; }
  for(let i=0;i<9;i++){
    const a=i/9*REF_TAU, rr=58+18*v;
    const px=x+Math.cos(a)*rr,py=cy+Math.sin(a)*rr*.55;
    const r=4.5+2*v;
    ctx.save(); ctx.translate(px,py); ctx.rotate(a+Math.PI/2); ctx.globalAlpha=.75*(1-.2*v); ctx.fillStyle=hot;
    ctx.beginPath(); ctx.moveTo(0,-r); ctx.quadraticCurveTo(r*.75,-r*.15,r*.2,r); ctx.quadraticCurveTo(-r*.75,r*.5,0,-r); ctx.fill(); ctx.restore();
  }
}

function fireRayLite(ctx,x,y,angle,len,a=1,hot='#FF9A22'){
  const ux=Math.cos(angle), uy=Math.sin(angle);
  ctx.save();
  ctx.globalAlpha=a;
  ctx.strokeStyle=hot;
  ctx.lineWidth=2.8;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(x+ux*3,y+uy*3);
  ctx.lineTo(x+ux*len*.24-uy*2,y+uy*len*.24+ux*2);
  ctx.lineTo(x+ux*len*.58+uy*1,y+uy*len*.58-ux*1);
  ctx.lineTo(x+ux*len,y+uy*len);
  ctx.stroke();
  ctx.restore();
}
function fireLineBurstLite(ctx,x,y,r,a=1,phase=0){
  const count=10;
  for(let i=0;i<count;i++){
    const ang=i/count*REF_TAU+phase*.08;
    const len=r*(.68+.22*Math.sin(i*2.1+phase));
    fireRayLite(ctx,x,y,ang,len,a*(.86+.12*Math.sin(i+phase)));
  }
}

function fireDownHeavyReference(ctx,x,y,p){
  const hot='#FF9A22', core='#FF5A16';
  if(p<0){
    const q=holdCharge(p);
    if(q>.45) fireLineBurstLite(ctx,x+24,y,16*q,.18+q*.16,q*4);
    return;
  }
  const {frame,u}=fireRefPhase(p,6),v=smoothFire(u),ox=x+24,oy=y-1;
  if(frame===1) return;
  if(frame===2){
    fireRayLite(ctx,ox,oy,Math.PI*.98,16,.55,hot);
    fireRayLite(ctx,ox,oy,.02,16,.55,hot);
    return;
  }
  if(frame===3){ fireLineBurstLite(ctx,ox,oy,28+34*v,1,u*5); return; }
  if(frame===4){ fireLineBurstLite(ctx,ox,oy,62+10*v,1,u*5); return; }
  if(frame===5){
    fireLineBurstLite(ctx,ox,oy,72,.86,u*7);
    // Only a few secondary embers; avoid dozens of expensive shadow/blur calls.
    for(let i=0;i<6;i++){
      const a=i/6*REF_TAU;
      flameShape(ctx,ox+Math.cos(a)*42,oy+Math.sin(a)*26,5.5,hot,.62,i);
    }
    return;
  }
  fireLineBurstLite(ctx,ox,oy,76,.30*(1-v),u*8);
  flameShape(ctx,ox,oy,7,core,.35*(1-v),0);
}
function fireSideHeavyReference(ctx,x,y,p){
  const hot='#FF9A22';
  if(p<0){ const q=holdCharge(p),hx=x+48,hy=y-45; fireBlob(ctx,hx,hy,9+q*12,hot,.68+q*.25,q); fireRing(ctx,hx,hy,10+q*10,7+q*6,hot,.65+q*.2,-.2,q); return; }
  const {frame,u}=fireRefPhase(p,4),v=smoothFire(u),hx=x+48,hy=y-45;
  if(frame===1){
    // Hand extends; the fire remains glued to the hand.
    fireBlob(ctx,hx,hy,7+3*v,hot,.8,u); fireRing(ctx,hx,hy,9+2*v,7+2*v,hot,.7,-.15,u); return;
  }
  if(frame===2){
    // Fireball grows around the hand before it ever becomes a projectile.
    const r=10+12*v; fireBlob(ctx,hx,hy,r,hot,.98,u*2); fireRing(ctx,hx,hy,r+4,r*.62,hot,.85,-.15,u*2); return;
  }
  if(frame===3){
    // Launch starts from the hand; it travels only a little at first, then accelerates.
    const d=10+55*v; const cx=hx+d,cy=hy-2*v; const r=22+4*v;
    fireBlob(ctx,cx,cy,r,hot,1,u*3); fireRing(ctx,cx,cy,r+4,r*.62,hot,.85,-.1,u*3);
    for(let i=0;i<6;i++) fireRay(ctx,cx-r*.75,cy,-.18+i*.07,16+i*3,.4);
    return;
  }
  const d=68+70*v,cx=hx+d,cy=hy-4*v,r=12*(1-v)+5;
  fireBlob(ctx,cx,cy,r,hot,.9*(1-.45*v),u*4);
  for(let i=0;i<8;i++) fireRay(ctx,cx,cy,-.2+i*.06,10+i*2,.5*(1-v));
}

function fireAttack(ctx,x,y,p,move){
  const prev=FIRE_PERF_MODE; FIRE_PERF_MODE=true;
  try {
  if(move==='us'){fireUpReference(ctx,x,y,p);return;}
  if(move==='ss'){fireSideReference(ctx,x,y,p);return;}
  if(move==='ds'){fireDownReference(ctx,x,y,p);return;}
  if(move==='uh'||move==='upHeavy'){fireUpHeavyReference(ctx,x,y,p);return;}
  if(move==='dh'||move==='downHeavy'){fireDownHeavyReference(ctx,x,y,p);return;}
  if(move==='sh'||move==='heavy'){fireSideHeavyReference(ctx,x,y,p);return;}
  } finally { FIRE_PERF_MODE=prev; }
}


function grassSeed(ctx,x,y,q,a=1){
  const c='#7CFF28', pale='#E7FF9A';
  // Small seed: oval body with a bright central seam, not a generic dot.
  ctx.save();ctx.translate(x,y);ctx.rotate(-.15*q);ctx.globalAlpha=a;
  ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=12;
  ctx.beginPath();ctx.ellipse(0,0,5.5,10,0,0,TAU);ctx.fill();
  ctx.strokeStyle=pale;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-1,-7);ctx.lineTo(1,7);ctx.stroke();ctx.restore();
}
function grassVine(ctx,x,y,tx,ty,t,a=1,thick=7){
  const c='#67D51F', hi='#B7FF55';
  const pts=[];
  for(let i=0;i<=24;i++){
    const u=i/24, xx=lerp(x,tx,u), yy=lerp(y,ty,u)-Math.sin(u*Math.PI)*10*t;
    pts.push([xx,yy]);
  }
  glowStroke(ctx,pts,c,thick,a);
  glowStroke(ctx,pts,hi,Math.max(1.4,thick*.2),a*.7);
  const tip=pts[pts.length-1];
  ctx.save();ctx.globalAlpha=a;ctx.translate(tip[0],tip[1]);
  for(let i=0;i<4;i++){const ang=-Math.PI/2+(i-.5)*.45; const l=5+i%2*2; glowStroke(ctx,[[0,0],[Math.cos(ang)*l,Math.sin(ang)*l]],hi,1.7,a*.75);}
  ctx.restore();
}
function grassBranch(ctx,x,y,len,thick,a=1,angle=0,split=false){
  const wood='#9B6A3B',hi='#D6A35B', c='#7CFF28';
  const ux=Math.cos(angle),uy=Math.sin(angle),px=-uy,py=ux;
  const pts=[];
  for(let i=0;i<=18;i++){
    const u=i/18, wob=Math.sin(u*Math.PI*2)*2.2;
    pts.push([x+ux*len*u+px*wob,y+uy*len*u+py*wob]);
  }
  glowStroke(ctx,pts,wood,thick,a); glowStroke(ctx,pts,hi,Math.max(1.5,thick*.18),a*.72);
  for(let i=0;i<5;i++){
    const u=.18+i*.15, bx=x+ux*len*u, by=y+uy*len*u;
    leafBlade(ctx,bx+px*4,by+py*4,4.5,10,angle+.8,c,a*.5);
  }
  if(split){
    for(const da of [-.30,0,.30]){
      const sx=x+ux*len, sy=y+uy*len;
      glowStroke(ctx,[[sx,sy],[sx+Math.cos(angle+da)*34,sy+Math.sin(angle+da)*34]],wood,Math.max(3,thick*.5),a*.9);
    }
  }
}
function grassFlower(ctx,x,y,open,scale=1,a=1,phase=0){
  const petal='#A8FF38', hi='#E4FF9C', center='#D7FF45';
  const n=8, r=16+open*48, petalLen=22+open*28;
  // Stem/base.
  glowStroke(ctx,[[x,y+18],[x,y-2],[x+Math.sin(phase)*3,y-20]],'#55B51A',7*scale,a*.75);
  for(let i=0;i<n;i++){
    const ang=-Math.PI/2 + i*TAU/n;
    const px=x+Math.cos(ang)*r, py=y-20+Math.sin(ang)*r*.72;
    const ctx2=ctx;
    ctx2.save();ctx2.translate(px,py);ctx2.rotate(ang+Math.PI/2);ctx2.globalAlpha=a;
    ctx2.fillStyle=petal;ctx2.shadowColor=petal;ctx2.shadowBlur=16;
    ctx2.beginPath();ctx2.moveTo(0,-petalLen);ctx2.quadraticCurveTo(13*scale,-petalLen*.2,0,petalLen*.35);ctx2.quadraticCurveTo(-13*scale,-petalLen*.2,0,-petalLen);ctx2.fill();
    ctx2.strokeStyle=hi;ctx2.lineWidth=1.4;ctx2.stroke();ctx2.restore();
  }
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=center;ctx.shadowColor=center;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y-20,12+open*5,0,TAU);ctx.fill();ctx.restore();
  for(let i=0;i<8;i++){const ang=i/8*TAU+phase; spark(ctx,x+Math.cos(ang)*(18+open*35),y-20+Math.sin(ang)*(12+open*24),1.5,hi,a*.55);}
}
function grassUpReference(ctx,x,y,p){
  const c='#7CFF28', pale='#D9FF7A';
  if(p<0){ const q=holdCharge(p); grassSeed(ctx,x,y-92, q,.7+.25*q); return; }
  const f=1+attackP(p)*3, phase=attackP(p);
  if(f<1.5){ grassSeed(ctx,x,y-62-(f-1)*26,1,.95); glowStroke(ctx,[[x,y-48],[x,y-70]],c,2.5,.6); return; }
  if(f<2.5){
    const u=ease(f-1.5), cy=lerp(y-88,y-96,u), rot=u*TAU;
    grassSeed(ctx,x,cy,.95,.45*(1-u));
    for(let i=0;i<3;i++) leafBlade(ctx,x+Math.cos(rot+i*TAU/3)*22,cy+Math.sin(rot+i*TAU/3)*8,8,22,rot+i*TAU/3,c,.95);
    glowArc(ctx,x,cy,31,11,0,TAU,c,3,.45,rot*.08);
    return;
  }
  const u=ease((f-2.5)/1.5), cy=lerp(y-96,y-58,u), rot=TAU*(1.0+u);
  const rad=32-5*u;
  for(let i=0;i<3;i++) leafBlade(ctx,x+Math.cos(rot+i*TAU/3)*rad,cy+Math.sin(rot+i*TAU/3)*rad*.38,9,24,rot+i*TAU/3,c,.98*(1-u*.2));
  glowArc(ctx,x,cy,38,14,0,TAU,c,4,.65,rot*.12);
  for(let i=0;i<7;i++){const a=i/7*TAU+rot; spark(ctx,x+Math.cos(a)*42,cy+Math.sin(a)*16,1.6,pale,.6*(1-u));}
}
function grassDownReference(ctx,x,y,p){
  const c='#7CFF28', pale='#D9FF7A';
  if(p<0){ const q=holdCharge(p); glowStroke(ctx,[[x-13,y-5],[x-20,y+2]],c,5,.35+q*.3); glowStroke(ctx,[[x+13,y-5],[x+20,y+2]],c,5,.35+q*.3); return; }
  const f=1+attackP(p)*3;
  if(f<1.5){ const u=ease((f-1)*2); glowStroke(ctx,[[x-10,y-10],[x-18-u*4,y-2]],c,7,.65); glowStroke(ctx,[[x+10,y-10],[x+18+u*4,y-2]],c,7,.65); return; }
  const u=ease((f-1.5)/2.5);
  const leftX=x-22-28*u, rightX=x+22+28*u;
  grassVine(ctx,x-8,y-3,leftX,y-40,u,1,7); grassVine(ctx,x+8,y-3,rightX,y-40,u,1,7);
  // Tips visibly curl inward as the snap reaches its active frame.
  const curl=8+18*u;
  grassVine(ctx,leftX,y-40,leftX+curl,y-34,u,1,5); grassVine(ctx,rightX,y-40,rightX-curl,y-34,u,1,5);
  if(u>.72){ for(let i=0;i<6;i++){const side=i%2?-1:1; spark(ctx,x+side*(18-i*2),y-32-i*2,1.7,pale,.55); } }
}
function grassSideReference(ctx,x,y,p){
  const c='#7CFF28', wood='#9B6A3B', hi='#D6A35B';
  if(p<0){ const q=holdCharge(p); grassBranch(ctx,x+18,y-43,35+18*q,10+2*q,.65+q*.25,0,false); return; }
  const f=1+attackP(p)*3, u=ease(attackP(p));
  const len=26+74*u, y0=y-44;
  if(f<2){ grassBranch(ctx,x+16,y0,len*.55,10,.75+u*.2,0,false); }
  else if(f<3){ grassBranch(ctx,x+16,y0,len,11,.98,0,false); for(let i=0;i<4;i++) spark(ctx,x+28+i*15,y0+(i%2?4:-4),1.4,hi,.65); }
  else { grassBranch(ctx,x+16,y0,len,11,.9,0,false); glowStroke(ctx,[[x+16,y0],[x+len+16,y0]],hi,1.8,.7); }
}
function grassUpHeavyReference(ctx,x,y,p){
  if(p<0){ const q=holdCharge(p); grassFlower(ctx,x,y-18,q*.35,.75+.2*q,.55+.3*q,q*2); return; }
  const f=1+attackP(p)*3;
  if(f<2){ const u=ease(f-1); grassFlower(ctx,x,y-8,u*.35,.6+.35*u,.7,u); }
  else if(f<3){ const u=ease(f-2); grassFlower(ctx,x,y-20,.35+.65*u,1,.95,u*2); }
  else { const u=ease(f-3); grassFlower(ctx,x,y-20,1,1,.98,u*2); for(let i=0;i<10;i++){const a=i/10*TAU; const rr=45+45*u; leafBlade(ctx,x+Math.cos(a)*rr,y-20+Math.sin(a)*rr*.7,8,24,a,'#A8FF38',.8*(1-u*.2));} }
}
function grassDownHeavyReference(ctx,x,y,p){
  const c='#67D51F', hi='#B7FF55';
  if(p<0){ const q=holdCharge(p); grassVine(ctx,x-8,y-12,x-8-45*q,y-65,q,.55+q*.25,9); return; }
  const f=1+attackP(p)*3;
  if(f<2){ const u=ease(f-1); grassVine(ctx,x-12,y-10,x+34*u,y+2,u,.9,10); }
  else if(f<3){ const u=ease(f-2); const endX=x+36+30*u, endY=y+2+42*u; grassVine(ctx,x-12,y-10,endX,endY,u,1,12); for(let i=0;i<7;i++) spark(ctx,endX+i*2,endY,1.5,hi,.55); }
  else { const u=ease(f-3); const startX=x+66-72*u, startY=y+44-36*u; grassVine(ctx,x+66,y+44,startX,startY,u,1-u*.15,11); for(let i=0;i<8;i++){const a=i/8*TAU; leafBlade(ctx,startX+Math.cos(a)*7,startY+Math.sin(a)*7,3,9,a,c,.55); } }
}
function grassSideHeavyReference(ctx,x,y,p){
  const c='#7CFF28',wood='#9B6A3B',hi='#D6A35B';
  if(p<0){ const q=holdCharge(p); grassBranch(ctx,x+18,y-46,55+30*q,14,.6+q*.25,0,false); return; }
  const f=1+attackP(p)*3;
  if(f<2){ const u=ease(f-1); grassBranch(ctx,x+18,y-46,70*u,14,.85,0,false); }
  else if(f<3){ const u=ease(f-2); grassBranch(ctx,x+18,y-46,70+55*u,14,.98,0,false); for(let i=0;i<4;i++) spark(ctx,x+88+i*10,y-46+(i-2)*3,1.5,hi,.6); }
  else { const u=ease(f-3), sx=x+143,sy=y-46; grassBranch(ctx,x+18,y-46,125,14,.92,0,true); for(const da of [-.32,0,.32]){const len=40+55*u; grassBranch(ctx,sx,sy,len,7,.9,da,false);} }
}
function grassAttack(ctx,x,y,p,move){
  if(move==='us')return grassUpReference(ctx,x,y,p);
  if(move==='ds')return grassDownReference(ctx,x,y,p);
  if(move==='ss')return grassSideReference(ctx,x,y,p);
  if(move==='uh')return grassUpHeavyReference(ctx,x,y,p);
  if(move==='dh')return grassDownHeavyReference(ctx,x,y,p);
  if(move==='sh'||move==='heavy')return grassSideHeavyReference(ctx,x,y,p);
}

function icePlate(ctx,x,y,r,a=1,phase=0){
  const c='#79DFFF',white='#EFFFFF';
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(121,223,255,.18)';ctx.strokeStyle=c;ctx.lineWidth=4;ctx.shadowColor=c;ctx.shadowBlur=18;
  ctx.beginPath();ctx.ellipse(x,y,r,r*.28,0,0,TAU);ctx.fill();ctx.stroke();ctx.globalAlpha=a*.75;ctx.strokeStyle=white;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,r*.75,r*.19,0,0,TAU);ctx.stroke();ctx.restore();
  for(let i=0;i<7;i++){const ang=i/7*TAU+phase*.2; iceShard(ctx,x+Math.cos(ang)*r*.72,y+Math.sin(ang)*r*.18,4,10,ang,c,a*.55);}
}
function iceBlade(ctx,x,y,len,angle,a=1){
  const c='#79DFFF',white='#EFFFFF';
  const ux=Math.cos(angle),uy=Math.sin(angle),px=-uy,py=ux;
  const pts=[[x,y],[x+ux*len*.35+px*7,y+uy*len*.35+py*7],[x+ux*len,y+uy*len],[x+ux*len*.68-px*6,y+uy*len*.68-py*6],[x+ux*len*.2-px*8,y+uy*len*.2-py*8]];
  fillPoly(ctx,pts,c,a,white); glowStroke(ctx,[[x+ux*5,y+uy*5],[x+ux*len,y+uy*len]],white,1.4,a*.75);
}
function iceBlock(ctx,x,y,w,h,a=1,cracked=false){
  const c='#79DFFF',white='#EFFFFF';
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(121,223,255,.45)';ctx.strokeStyle=c;ctx.lineWidth=3;ctx.shadowColor=c;ctx.shadowBlur=18;
  ctx.beginPath();ctx.moveTo(x-w/2,y+h/2);ctx.lineTo(x-w*.42,y-h*.48);ctx.lineTo(x-w*.05,y-h/2);ctx.lineTo(x+w*.45,y-h*.38);ctx.lineTo(x+w/2,y+h/2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=white;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-w*.2,y-h*.35);ctx.lineTo(x-w*.02,y);ctx.lineTo(x+w*.2,y+h*.4);ctx.moveTo(x+w*.2,y-h*.28);ctx.lineTo(x-w*.05,y+.05);ctx.stroke();
  if(cracked){ctx.strokeStyle=white;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-h*.48);ctx.lineTo(x-8,y-4);ctx.lineTo(x+4,y+h*.48);ctx.stroke();}
  ctx.restore();
}
function iceCrystal(ctx,x,y,scale,a=1,phase=0){
  const c='#79DFFF',white='#EFFFFF';
  for(let i=0;i<7;i++){const ang=-Math.PI/2+(i-3)*.18; const rr=(28+Math.abs(i-3)*8)*scale; shard(ctx,x+Math.cos(ang)*rr*.35,y+Math.sin(ang)*rr*.15,11*scale,28*scale,ang,c,a*.92);}
  spark(ctx,x,y,8*scale,white,a*.7);
  for(let i=0;i<10;i++){const ang=i/10*TAU+phase; spark(ctx,x+Math.cos(ang)*34*scale,y+Math.sin(ang)*24*scale,1.5,c,a*.55);}
}
function iceUpReference(ctx,x,y,p){
  const c='#79DFFF',white='#EFFFFF';
  if(p<0){const q=holdCharge(p);iceShard(ctx,x,y-92,10+q*3,24+q*7,-.08-q*.3,c,.95);spark(ctx,x,y-92,4+q*2,white,.7);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);iceShard(ctx,x,y-88,11,25,-.1-u*.2,c,.98);return;}
  if(f<3){const u=ease(f-2),sx=lerp(x+2,x+28,u),sy=lerp(y-88,y-112,u);iceShard(ctx,sx,sy,12,30,-.1-u*.8,c,1);glowStroke(ctx,[[x+6,y-55],[sx,sy+18]],c,3,.55);return;}
  const u=ease(f-3),sx=lerp(x+28,x+72,u),sy=lerp(y-112,y-150,u),rot=-.9+u*1.8;iceShard(ctx,sx,sy,13,31,rot,c,1);for(let i=0;i<8;i++){const z=i/8; spark(ctx,lerp(x+30,sx,z),lerp(y-112,sy,z),1.3,c,.5*(1-z));}spark(ctx,sx,sy,4,white,.75);
}
function iceDownReference(ctx,x,y,p){
  const c='#79DFFF',white='#EFFFFF';
  if(p<0){const q=holdCharge(p);icePlate(ctx,x,y-2,34+8*q,.55+.25*q,q*2);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);icePlate(ctx,x,y-3,34,1,u);return;}
  if(f<3){const u=ease(f-2);icePlate(ctx,x+20*u,y-8,34*(1-.25*u),1,u);iceBlock(ctx,x+20*u,y-8,48,16,.35);return;}
  const u=ease(f-3),cx=x+20+12*u,cy=y-18-22*u;iceBlock(ctx,cx,cy,48,18,.5*(1-u),true);for(let i=0;i<7;i++){const ang=-Math.PI*1.05+i/6*Math.PI*1.1;const rr=18+36*u;iceShard(ctx,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.55,7,17,ang,c,.95);}for(let i=0;i<10;i++){const a=i/10*TAU;spark(ctx,cx+Math.cos(a)*(18+38*u),cy+Math.sin(a)*(10+28*u),1.5,white,.65*(1-u));}
}
function iceSideReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const q=holdCharge(p);iceBlade(ctx,x+20,y-45,38+12*q,-.15,.55+.3*q);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);iceBlade(ctx,x+22,y-45,40+8*u,-.25+u*.15,.75);}
  else if(f<3){const u=ease(f-2);const ang=-.2+u*1.9;iceBlade(ctx,x+24,y-45,58,ang,.98);for(let i=0;i<5;i++)spark(ctx,x+24+Math.cos(ang)*50,y-45+Math.sin(ang)*50,1.4,c,.55);}
  else {const u=ease(f-3),ang=1.7+u*1.3;iceBlade(ctx,x+24,y-45,56,ang,.82*(1-u));for(let i=0;i<7;i++)spark(ctx,x+70+i*5,y-35+i*2,1.5,c,.5*(1-u));}
}
function iceUpHeavyReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const q=holdCharge(p);for(let i=0;i<3;i++)iceShard(ctx,x+(i-1)*24,y-98,12+q*3,30+q*8,-.15+i*.15,.55+.3*q);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);for(let i=0;i<3;i++)iceShard(ctx,x+(i-1)*24,y-80-25*u,12,30,-.1+i*.1,.95);}
  else if(f<3){const u=ease(f-2);for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+u*1.0;iceShard(ctx,x+Math.cos(a)*26,y-82+Math.sin(a)*26*.55,13,32,a,c,1);}}
  else {const u=ease(f-3);for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+1.0+u*.65,rr=28+65*u;const sx=x+Math.cos(a)*rr,sy=y-82+Math.sin(a)*rr*.6;iceShard(ctx,sx,sy,13,32,a,c,1);glowStroke(ctx,[[x,y-82],[sx,sy]],c,2.2,.35);}}
}
function iceDownHeavyReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const q=holdCharge(p);iceBlock(ctx,x+30,y-18,60+10*q,36+5*q,.65+.25*q,false);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);iceBlock(ctx,x+28+18*u,y-18,62,36,.95,false);}
  else if(f<3){const u=ease(f-2),bx=x+46+55*u;iceBlock(ctx,bx,y-18,62,36,1,false);for(let i=0;i<4;i++)spark(ctx,bx-25+i*15,y+2,1.5,c,.45);}
  else {const u=ease(f-3),bx=x+101,by=y-18;iceBlock(ctx,bx-24*u,by,30,30,.25*(1-u),true);iceShard(ctx,bx+28*u,by-18*u,12,24,.55,c,1);iceShard(ctx,bx+4*u,by+18*u,12,24,-.55,c,1);for(let i=0;i<8;i++){const a=i/8*TAU;spark(ctx,bx+Math.cos(a)*(20+35*u),by+Math.sin(a)*(10+24*u),1.5,c,.55*(1-u));}}
}
function iceSideHeavyReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const q=holdCharge(p);iceBlade(ctx,x+25,y-45,62+15*q,-.25,.6+.25*q);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);iceBlade(ctx,x+25,y-45,60+20*u,-.5+u*.2,.95);}
  else if(f<3){const u=ease(f-2),ang=-.3+u*2.6;iceBlade(ctx,x+25,y-45,86,ang,1);glowArc(ctx,x+25,y-45,74,54,-.7,ang,c,4,.6,ang*.2);}
  else {const u=ease(f-3),ang=2.3+u*.2;iceBlade(ctx,x+25,y-45,84,ang,.85*(1-u));for(let i=0;i<7;i++){const a=-.45+i*.15;iceShard(ctx,x+100+Math.cos(a)*(8+25*u),y-45+Math.sin(a)*(8+25*u),4,10,a,c,.7*(1-u));}}
}
function iceAttack(ctx,x,y,p,move){
  if(move==='us')return iceUpReference(ctx,x,y,p);
  if(move==='ds')return iceDownReference(ctx,x,y,p);
  if(move==='ss')return iceSideReference(ctx,x,y,p);
  if(move==='uh')return iceUpHeavyReference(ctx,x,y,p);
  if(move==='dh')return iceDownHeavyReference(ctx,x,y,p);
  if(move==='sh'||move==='heavy')return iceSideHeavyReference(ctx,x,y,p);
}

// WATER HERO — true frame-by-frame native water animation.
// The supplied sheet is treated as a motion/design blueprint. Nothing from the
// sheet is drawn in-game. Every keyframe is reconstructed from native Canvas
// curves, layered translucent bodies, bright cores, tapering streams and spray.

const WATER_C = '#18BFFF';
const WATER_HI = '#DDFBFF';
const WATER_MID = '#55D9FF';

function waterBezier(p0,p1,p2,p3,t){
  const u=1-t,uu=u*u,tt=t*t;
  return [uu*u*p0[0]+3*uu*t*p1[0]+3*u*tt*p2[0]+tt*t*p3[0],
          uu*u*p0[1]+3*uu*t*p1[1]+3*u*tt*p2[1]+tt*t*p3[1]];
}
function waterCurve(ctx, pts, a=1, width=8){
  if(pts.length<2)return;
  ctx.save();
  ctx.globalAlpha=a;
  ctx.lineCap='round'; ctx.lineJoin='round';
  // broad translucent body
  ctx.strokeStyle=WATER_C; ctx.lineWidth=width; ctx.shadowColor=WATER_C; ctx.shadowBlur=Math.max(7,width*1.6);
  ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  // brighter, narrower core
  ctx.globalAlpha=a*.78; ctx.strokeStyle=WATER_MID; ctx.lineWidth=Math.max(2,width*.46); ctx.shadowBlur=5;
  ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  ctx.globalAlpha=a*.9; ctx.strokeStyle=WATER_HI; ctx.lineWidth=Math.max(1,width*.12); ctx.shadowBlur=3;
  ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  ctx.restore();
}
function waterStream(ctx, points, a=1, width=8, phase=0){
  waterCurve(ctx,points,a,width);
  // broken filaments peel away from the main body, giving the stream motion.
  for(let i=1;i<points.length-1;i+=2){
    const q=points[i], n=points[Math.min(points.length-1,i+1)];
    const dx=n[0]-q[0],dy=n[1]-q[1],len=Math.max(1,Math.hypot(dx,dy));
    const nx=-dy/len, ny=dx/len, wob=Math.sin(phase*9+i*1.7)*3;
    waterDrop(ctx,q[0]+nx*wob,q[1]+ny*wob,1.2+(i%3)*.45,a*.48);
  }
}
function waterDrop(ctx,x,y,r=2,a=.8,ang=-.4){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.globalAlpha=a;
  ctx.fillStyle=WATER_HI; ctx.shadowColor=WATER_C; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.ellipse(0,0,r*.65,r*1.55,0,0,TAU); ctx.fill();
  ctx.restore();
}
function waterSpray(ctx,x,y,dir,spread,count,a=1,phase=0){
  for(let i=0;i<count;i++){
    const t=i/Math.max(1,count-1), ang=dir+(t-.5)*spread;
    const len=10+24*t+Math.sin(phase*7+i)*3;
    waterDrop(ctx,x+Math.cos(ang)*len,y+Math.sin(ang)*len*.72,1.1+(i%3)*.35,a*(1-.45*t),ang+.2);
  }
}
function waterIrregularRing(ctx,cx,cy,rx,ry,a=1,rot=0,phase=0,gap=0){
  const pts=[];
  const seg=34;
  for(let i=0;i<=seg;i++){
    const t=i/seg, ang=t*TAU+rot;
    const wob=1+Math.sin(ang*3+phase*8)*.045+Math.sin(ang*7-phase*5)*.025;
    pts.push([cx+Math.cos(ang)*rx*wob,cy+Math.sin(ang)*ry*wob]);
  }
  if(gap>0){
    // Draw as short pieces, leaving the intentional broken-water gaps from the sheet.
    const cut=Math.max(1,Math.floor(seg*gap));
    for(let i=0;i<seg;i+=cut+6){ waterCurve(ctx,pts.slice(i,Math.min(seg+1,i+cut)),a*.92,7); }
  }else waterCurve(ctx,pts,a,7);
  for(let i=0;i<12;i++){
    const ang=i/12*TAU+rot+phase*.35, rr=1+Math.sin(i*4+phase*5)*.08;
    waterDrop(ctx,cx+Math.cos(ang)*rx*rr,cy+Math.sin(ang)*ry*rr,1.1+(i%3)*.35,a*.52,ang+.2);
  }
}
function waterOrb(ctx,cx,cy,r,a=1,phase=0){
  ctx.save();
  ctx.globalAlpha=a*.22; ctx.fillStyle=WATER_C; ctx.shadowColor=WATER_C; ctx.shadowBlur=22;
  ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();
  ctx.globalAlpha=a*.85;ctx.strokeStyle=WATER_C;ctx.lineWidth=5;ctx.shadowBlur=10;
  ctx.beginPath();ctx.arc(cx,cy,r*.92,0,TAU);ctx.stroke();
  ctx.globalAlpha=a*.7;ctx.strokeStyle=WATER_HI;ctx.lineWidth=2;
  for(let i=0;i<3;i++){
    const off=phase*2+i*TAU/3;
    ctx.beginPath();ctx.ellipse(cx+Math.cos(off)*r*.12,cy+Math.sin(off)*r*.08,r*.78,r*(.18+i*.035),off*.45,0,TAU);ctx.stroke();
  }
  ctx.restore();
  for(let i=0;i<8;i++){
    const ang=phase*1.8+i*TAU/8;
    waterDrop(ctx,cx+Math.cos(ang)*r*.98,cy+Math.sin(ang)*r*.78,1.3+(i%2),a*.5,ang);
  }
}
function waterTaperedArc(ctx,cx,cy,r,ang0,ang1,a=1,phase=0,thick=13){
  const pts=[]; const n=30;
  for(let i=0;i<=n;i++){
    const t=i/n,ang=ang0+(ang1-ang0)*t;
    const rr=r*(.82+.18*Math.sin(t*Math.PI));
    pts.push([cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.72]);
  }
  // layered body; taper is simulated by short trailing segments.
  for(let i=0;i<pts.length-1;i+=2){
    const t=i/(pts.length-1); waterCurve(ctx,pts.slice(i,Math.min(i+4,pts.length)),a*(.52+.48*t),thick*(.38+.62*Math.sin(t*Math.PI)));
  }
  waterCurve(ctx,pts,a,Math.max(2,thick*.22));
  for(let i=4;i<n;i+=4){
    const t=i/n,ang=ang0+(ang1-ang0)*t;
    waterDrop(ctx,cx+Math.cos(ang)*r*(1+.05*Math.sin(phase+i)),cy+Math.sin(ang)*r*.72,1.3+(i%3)*.35,a*.55*(1-t*.35),ang+.4);
  }
}
function waterSheet(ctx,x,y,side,scale=1,a=1,phase=0){
  const s=side;
  const p0=[x,y], p1=[x+s*8,y-28*scale], p2=[x+s*30,y-48*scale], p3=[x+s*42,y-6*scale];
  const pts=[];for(let i=0;i<=18;i++)pts.push(waterBezier(p0,p1,p2,p3,i/18));
  waterStream(ctx,pts,a,10*scale,phase);
  const p4=[x+s*7,y],p5=[x+s*18,y-12*scale],p6=[x+s*34,y-34*scale],p7=[x+s*58,y-22*scale];
  const pts2=[];for(let i=0;i<=18;i++)pts2.push(waterBezier(p4,p5,p6,p7,i/18));
  waterStream(ctx,pts2,a*.7,5*scale,phase+1.3);
  waterSpray(ctx,x+s*40,y-20*scale,s*(-1.1),1.15,8,a*.7,phase);
}
function waterWhip(ctx,x,y,t,a=1,phase=0){
  // Starts at the hand, stays thick near the hand, then tapers into the hooked tip.
  const hand=[x+22,y-46];
  const tip=[x+34+82*t,y-47-34*Math.sin(t*Math.PI)];
  const pts=[];
  for(let i=0;i<=28;i++){
    const u=i/28;
    const px=lerp(hand[0],tip[0],u);
    const py=lerp(hand[1],tip[1],u)-Math.sin(u*Math.PI)*10*t;
    pts.push([px,py]);
  }
  waterCurve(ctx,pts,a,10*(1-.38*t));
  // hook curls upward at the tip in the reference.
  if(t>.28){
    const ca=-.35, cb=1.18;
    waterTaperedArc(ctx,tip[0]-7,tip[1]+3,20+10*t,ca,cb,a*.95,phase,7);
  }
  for(let i=0;i<10;i++){
    const u=.25+i*.07; const q=pts[Math.min(28,Math.floor(u*28))];
    waterDrop(ctx,q[0],q[1]-Math.sin(u*Math.PI)*5,1.1+(i%3)*.35,a*.55,0);
  }
}
function waterBlade(ctx,x,y,t,a=1,phase=0){
  // Giant crescent is a thick, hollow ribbon; it sweeps once and then tears into spray.
  const cx=x+34+18*t, cy=y-50;
  const r=50+18*Math.sin(t*Math.PI);
  const start=-1.35+.12*t, end=.92+1.15*t;
  waterTaperedArc(ctx,cx,cy,r,start,end,a,phase,15);
  // secondary inner stream makes the blade read as liquid, not a neon line.
  waterTaperedArc(ctx,cx-3,cy+1,r*.86,start+.1,end-.15,a*.52,phase+1.5,5);
  if(t>.62) waterSpray(ctx,cx+Math.cos(end)*r,cy+Math.sin(end)*r*.72,end+.35,1.2,14,a*.75,phase);
}
function waterSpiral(ctx,x,y,t,a=1,phase=0){
  const cx=x+3, cy=y-78-8*t;
  const turns=1.55+t*.45, r0=28+18*t, r1=66+18*t;
  const pts=[];
  for(let i=0;i<=44;i++){
    const u=i/44, ang=-Math.PI*.25-u*turns*TAU;
    const r=lerp(r0,r1,u);
    pts.push([cx+Math.cos(ang)*r,cy+Math.sin(ang)*r*.62]);
  }
  waterCurve(ctx,pts,a,12);
  // outer spray follows the final turn.
  for(let i=0;i<16;i++){
    const u=i/15, ang=-Math.PI*.25-u*turns*TAU;
    const r=r1+8+u*18;
    waterDrop(ctx,cx+Math.cos(ang)*r,cy+Math.sin(ang)*r*.62,1.2+(i%3)*.35,a*.55*(1-u*.3),ang);
  }
}
function waterBounceSphere(ctx,x,y,p,a=1,phase=0){
  waterOrb(ctx,x,y,21,a,phase);
  waterSpray(ctx,x,y,Math.PI*1.5,.9,8,a*.45,phase);
}
function waterAttackFrame(p,count){ return 1+attackP(p)*(count-1); }


// Water — the seven move sheets are reconstructed as continuous native canvas animation.
const WATER_C2='#18BFFF', WATER_HI2='#E9FDFF', WATER_MID2='#56D9FF';
function wCurve(ctx,pts,a=1,w=8){waterCurve(ctx,pts,a,w);}
function wRing(ctx,cx,cy,rx,ry,a=1,rot=0,phase=0){waterIrregularRing(ctx,cx,cy,rx,ry,a,rot,phase,.08);}
function wOrb(ctx,cx,cy,r,a=1,phase=0){waterOrb(ctx,cx,cy,r,a,phase);}
function wRibbon(ctx,x,y,t,a=1,phase=0){
  const cx=x+2,cy=y-72-30*t, outer=42+28*t, inner=18+12*t;
  const pts=[];
  for(let i=0;i<=40;i++){const u=i/40,ang=-Math.PI/2+u*(TAU*(.65+t*1.25)),r=lerp(inner,outer,u);pts.push([cx+Math.cos(ang)*r,cy+Math.sin(ang)*r*.82]);}
  waterStream(ctx,pts,a,13,phase);
  for(let i=0;i<3;i++){const u=.72+i*.09, ang=-Math.PI/2+u*(TAU*(.65+t*1.25)),r=outer+7+i*5;waterDrop(ctx,cx+Math.cos(ang)*r,cy+Math.sin(ang)*r*.82,1.5,a*.55,ang);}
}
function wCrescent(ctx,x,y,t,a=1,phase=0){waterBlade(ctx,x,y,t,a,phase);}
function waterUpReference(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);wRing(ctx,x+22,y-45,16+5*q,8+2*q,.7+.25*q,-.2,q);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);wRing(ctx,x+24+5*u,y-44-18*u,18+6*u,9+3*u,.95,-.1+u*.25,attackP(p));waterStream(ctx,[[x+10,y-25],[x+20,y-40],[x+26,y-55]],.55,5,attackP(p));}
  else if(f<3){const u=ease(f-2),cx=lerp(x+30,x+52,u),cy=lerp(y-62,y-88,u);wRing(ctx,cx,cy,23,10,1,.05,attackP(p));waterStream(ctx,[[x+24,y-48],[cx,cy]],.8,6,attackP(p)+1);}
  else {const u=ease(f-3),cx=lerp(x+52,x+92,u),cy=lerp(y-88,y-112,u);wRing(ctx,cx,cy,22-2*u,10-u,1,.12,attackP(p));const trail=[];for(let i=0;i<=22;i++){const z=i/22;trail.push([lerp(x+50,cx,z),lerp(y-88,cy,z)+Math.sin(z*Math.PI)*-12]);}waterStream(ctx,trail,.8,6,attackP(p)+2);for(let i=0;i<8;i++)waterDrop(ctx,cx-18+i*3,cy+8,1.2,.55*(1-u),i);}
}
function waterDownReference(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);wRing(ctx,x,y-2,32+8*q,8+2*q,.3,0,q);return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);wRing(ctx,x,y-3,30+5*u,8+2*u,.55+.2*u,0,attackP(p));waterStream(ctx,[[x,y-4],[x-10,y-10],[x-18,y-2]],.5,5,attackP(p));}
  else if(f<3){const u=ease(f-2);waterSheet(ctx,x-8,y-2,-1,.95+u*.15,1,attackP(p));waterSheet(ctx,x+8,y-2,1,.95+u*.15,1,attackP(p)+1.3);}
  else {const u=ease(f-3);waterSheet(ctx,x-10-u*5,y-3,-1,1.1-u*.1,1-u*.12,attackP(p)+1);waterSheet(ctx,x+10+u*5,y-3,1,1.1-u*.1,1-u*.12,attackP(p)+2);waterSpray(ctx,x-34,y-22,-2.5,.7,10,.65*(1-u),attackP(p));waterSpray(ctx,x+34,y-22,-.65,.7,10,.65*(1-u),attackP(p)+1);}
}
function waterSideReference(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);waterWhip(ctx,x,y,.25+.2*q,.55+.2*q,attackP(p));return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);waterWhip(ctx,x,y,.18+.22*u,.72,attackP(p));}
  else if(f<3){const u=ease(f-2);waterWhip(ctx,x,y,.4+.38*u,1,attackP(p));}
  else {const u=ease(f-3);waterWhip(ctx,x,y,.78+.22*u,.95*(1-u*.25),attackP(p));waterSpray(ctx,x+110,y-70,-.25,1.0,8,.5*(1-u),attackP(p));}
}
function waterUpHeavyReference(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);wRibbon(ctx,x,y,.2*q,.55+.3*q,attackP(p));return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);wRibbon(ctx,x,y,.15+.2*u,1,attackP(p));}
  else if(f<3){const u=ease(f-2);wRibbon(ctx,x,y,.35+.45*u,1,attackP(p)+1);}
  else {const u=ease(f-3);wRibbon(ctx,x,y,.8+.2*u,1,attackP(p)+2);const launch=[];for(let i=0;i<=18;i++){const z=i/18;launch.push([x+8+z*(58+18*u),y-48-z*(68+34*u)]);}waterStream(ctx,launch,.95,10,attackP(p));waterSpray(ctx,x+68+18*u,y-116-30*u,-1.55,1.15,12,.9*(1-u*.25),attackP(p));}
}
function waterDownHeavyReference(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);wOrb(ctx,x+52,y-52,22+4*q,.65+.25*q,attackP(p));return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);wOrb(ctx,x+48+8*u,y-52+4*u,22,1,attackP(p));waterStream(ctx,[[x+24,y-28],[x+48,y-46]],.6,5,attackP(p));}
  else if(f<3){const u=ease(f-2),sx=x+58,sy=lerp(y-48,y-4,u);wOrb(ctx,sx,sy,22*(1-.1*u),1,attackP(p));waterStream(ctx,[[sx,sy-32],[sx,sy]],.65,6,attackP(p));}
  else {const u=ease(f-3),sx=x+58,sy=y-4;wOrb(ctx,sx,sy,21*(1-u*.35),.75*(1-u*.2),attackP(p));const pts=[];for(let i=0;i<=18;i++){const z=i/18;pts.push([sx+Math.sin(z*Math.PI)*5,sy-58*z]);}waterStream(ctx,pts,1,11,attackP(p));waterSpray(ctx,sx,sy-58,-Math.PI/2,1.15,14,.85*(1-u*.25),attackP(p));}
}
function waterSideHeavyReference(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);wCrescent(ctx,x,y,.15*q,.6+.25*q,attackP(p));return;}
  const f=1+attackP(p)*3;
  if(f<2){const u=ease(f-1);wCrescent(ctx,x,y,.05+.18*u,.85,attackP(p));}
  else if(f<3){const u=ease(f-2);wCrescent(ctx,x,y,.23+.52*u,1,attackP(p));}
  else {const u=ease(f-3);wCrescent(ctx,x,y,.75+.25*u,1-u*.45,attackP(p));waterSpray(ctx,x+92,y-60,.2,1.5,16,.75*(1-u),attackP(p));}
}
function waterAttack(ctx,x,y,p,move){
  if(move==='us')return waterUpReference(ctx,x,y,p);
  if(move==='ds')return waterDownReference(ctx,x,y,p);
  if(move==='ss')return waterSideReference(ctx,x,y,p);
  if(move==='uh')return waterUpHeavyReference(ctx,x,y,p);
  if(move==='dh')return waterDownHeavyReference(ctx,x,y,p);
  if(move==='sh'||move==='heavy')return waterSideHeavyReference(ctx,x,y,p);
}
function waterSuper(ctx,x,y,p){
  if(p<0){const q=holdCharge(p);wOrb(ctx,x,y-62,25+14*q,.65+.25*q,attackP(p));return;}
  const f=1+attackP(p)*6, cy=y-62;
  if(f<2){const u=ease(f-1);wOrb(ctx,x,cy,28+18*u,.95,attackP(p));}
  else if(f<3){const u=ease(f-2);wOrb(ctx,x,cy,46+22*u,1,attackP(p)*2+u*3);}
  else if(f<4){const u=ease(f-3);wOrb(ctx,x,cy,68+30*u,1,attackP(p)*3);for(let i=0;i<18;i++){const a=i/18*TAU+attackP(p)*3;waterDrop(ctx,x+Math.cos(a)*(70+25*u),cy+Math.sin(a)*(52+18*u),1.4,.65,a);}}
  else if(f<5){const u=ease(f-4),r=98-55*u;wRing(ctx,x,cy,r,r*.72,1,.05,attackP(p)*4);for(let i=0;i<20;i++){const a=i/20*TAU;waterDrop(ctx,x+Math.cos(a)*r,cy+Math.sin(a)*r*.72,1.5,.75,a);}}
  else if(f<6){const u=ease(f-5),r=43+92*u;wRing(ctx,x,cy,r,r*.68,1,.08,attackP(p)*5);}
  else {const u=ease(f-6),r=135-8*u;wRing(ctx,x,cy,r,r*.68,1,.12,attackP(p)*6);waterSpray(ctx,x+42,cy-54,-1.5,1.1,12,.75*(1-u),attackP(p));}
}

export function getGen1AttackPose(move,p,facing=1,charId='g1_water'){
  const q=clamp01(Math.max(0,p));
  const t=ease(q);
  const lead=facing>0?'R':'L';
  let punchArmL=0,punchArmR=0,legSwing=0,lean=facing*.05,bob=0;
  const leadPunch=(v)=>{if(lead==='R')punchArmR=v;else punchArmL=-v;};
  const offArm=(v)=>{if(lead==='R')punchArmL=v;else punchArmR=-v;};
  if(charId==='g1_fire'){
    const count = move==='dh' ? 6 : move==='super' ? 7 : 4;
    const z=q*count, i=Math.min(count-1,Math.floor(z)), u=z-Math.floor(z), s=u*u*(3-2*u);
    const beat=(arr)=>arr[i]+(arr[Math.min(i+1,count-1)]-arr[i])*s;
    const lead=(angle)=>{if(facing>=0) punchArmR=angle; else punchArmL=-angle;};
    if(move==='us'){ lead(beat([0,-2.05,-2.25,-2.15])); lean=facing*beat([0,.02,.03,.08]); }
    else if(move==='ss'){ lead(beat([0,-1.05,-1.72,-1.15])); lean=facing*beat([0,.08,.20,.16]); legSwing=beat([0,.04,.22,.12]); }
    else if(move==='ds'){ lean=facing*beat([0,.10,.03,-.10]); bob=beat([0,5,8,2]); lead(beat([0,.30,.20,.05])); }
    else if(move==='uh'){ punchArmR=beat([-1.0,-2.55,-2.70,-2.20]); punchArmL=beat([-1.0,-2.85,-2.95,-2.45]); lean=facing*beat([0,0,.02,.05]); }
    else if(move==='dh'){ lean=facing*beat([0,.18,.06,-.02,-.04,-.02]); bob=beat([0,9,6,4,2,0]); legSwing=beat([0,.04,.12,.08,.03,0]); lead(beat([0,.62,.55,.35,.18,.05])); }
    else if(move==='sh'){ lead(beat([-1.15,-1.45,-1.75,-.55])); lean=facing*beat([.02,.08,.18,.10]); legSwing=beat([0,.05,.18,.08]); }
    else if(move==='super'){ if(i===0){punchArmR=-.85;punchArmL=-.65;lean=facing*.03;} else if(i===1||i===2){punchArmR=-1.15;punchArmL=-.95;lean=facing*.06;} else if(i===3||i===4){punchArmR=-1.7;punchArmL=-1.55;lean=facing*.22;legSwing=.2;} else if(i===5){punchArmR=.2;punchArmL=.1;lean=-facing*.12;} else {punchArmR=-.1;punchArmL=-.05;lean=-facing*.05;} }
    return {punchArmL,punchArmR,legSwing,lean,bob};
  }
  if(move==='us'){leadPunch(-1.45*t);offArm(.35*t);lean=facing*(.05+.13*t);legSwing=.12*t;}
  else if(move==='ds'){punchArmL=.72*t;punchArmR=-.72*t;lean=-facing*.14*t;legSwing=.18*t;bob=5*t;}
  else if(move==='ss'){leadPunch(-1.7*t);offArm(.18*t);lean=facing*(.05+.22*t);legSwing=.12*t;}
  else if(move==='uh'){leadPunch(-1.35*t);offArm(.72*t);lean=facing*(.08+.18*t);legSwing=-.28*t;}
  else if(move==='dh'){leadPunch(-.72*t);offArm(.62*t);lean=-facing*.16*t;legSwing=-.38*t;bob=5*t;}
  else if(move==='sh'||move==='heavy'){leadPunch(-1.28*t);offArm(.32*t);lean=facing*(.08+.26*t);legSwing=.25*t;}
  else if(move==='super'){punchArmL=-1.15*Math.sin(q*Math.PI);punchArmR=1.15*Math.sin(q*Math.PI);lean=Math.sin(q*Math.PI)*facing*.12;legSwing=.22*Math.sin(q*Math.PI);}
  return {punchArmL,punchArmR,legSwing,lean,bob};
}


// Improved supers. Fire keeps its existing design; Water uses the single reference-native implementation above.
function fireFlameOrbitLegacy(ctx,cx,cy,rx,ry,start,end,color,alpha=1,count=7){
  glowArc(ctx,cx,cy,rx,ry,start,end,color,5,alpha);
  for(let i=0;i<count;i++){
    const t=count===1 ? 0 : i/(count-1);
    const a=start+(end-start)*t;
    flameShape(ctx,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,5.5,color,alpha*.9,a+Math.PI/2);
  }
}

function fireSuper(ctx,x,y,p){
  const prev=FIRE_PERF_MODE; FIRE_PERF_MODE=true;
  try {
  // Smooth native interpolation through the same seven reference beats.
  // No hard frame-to-frame snapping: position, size and opacity all ease.
  const c='#FF5A16', hot='#FFB12B', white='#FFF3B0';
  const q=clamp01(p)*6, seg=Math.min(5,Math.floor(q)), t=ease(q-seg);
  const lerp=(a,b,k)=>a+(b-a)*k;
  const stages=[
    {cx:18,cy:-56,r:7,a:.55},
    {cx:26,cy:-60,r:17,a:.95},
    {cx:26,cy:-60,r:24,a:.98},
    {cx:62,cy:-58,r:27,a:1},
    {cx:80,cy:-58,r:22,a:1},
    {cx:105,cy:-48,r:34,a:1},
    {cx:105,cy:-48,r:18,a:.35}
  ];
  const a=stages[seg], b=stages[Math.min(6,seg+1)];
  const cx=lerp(a.cx,b.cx,t), cy=lerp(a.cy,b.cy,t), r=lerp(a.r,b.r,t), op=lerp(a.a,b.a,t);
  // Startup flames smoothly gather toward the hand.
  if(q<1.2){
    flameShape(ctx,x-18,y-56,7,hot,.5*(1-q/1.2),-.2);
    flameShape(ctx,x+18,y-56,7,hot,.5*(1-q/1.2),.2);
  }
  // The core and its irregular orbit remain visually consistent while moving.
  core(ctx,x+cx,y+cy,Math.max(5,r),c,op);
  fireFlameOrbitLegacy(ctx,x+cx,y+cy,r+5,r*.7,-2.8,.35,hot,op*.95,10);
  // Keep the travel trail short near the hand, then extend it as the projectile accelerates.
  const launchT=ease(clamp01((q-1.8)/2.7));
  if(launchT>0){
    glowStroke(ctx,[[x+12,y-25],[x+27+launchT*34,y-47-2*launchT]],c,5.5,.48*launchT);
    for(let i=0;i<5;i++) spark(ctx,x+cx-18-i*5,y+cy+(i-2)*2,1.3,hot,.35*launchT);
  }
  // Explosion grows smoothly instead of popping at one discrete frame.
  const blast=ease(clamp01((q-4.45)/1.05));
  if(blast>0){
    fireLineBurstLegacy(ctx,x+105,y-48,70+50*blast,blast);
    for(let i=0;i<10;i++){
      const ang=i/10*TAU;
      flameShape(ctx,x+105+Math.cos(ang)*(38+38*blast),y-48+Math.sin(ang)*(25+25*blast),7+4*blast,hot,blast*.72,ang+Math.PI/2);
    }
    spark(ctx,x+105,y-48,14+10*blast,white,.55*blast);
  }
  } finally { FIRE_PERF_MODE=prev; }
}

function grassSuper(ctx,x,y,p){const c='#7CFF28',q=attackP(p),a=.2+.8*Math.sin(q*Math.PI); const r=30+easeOut(q)*105; for(let i=0;i<14;i++){const ang=i/14*REF_TAU+q*1.8; leafBlade(ctx,x+Math.cos(ang)*r,y-58+Math.sin(ang)*r*.62,13,34,ang,c,a*.85);} glowArc(ctx,x,y-58,r,r*.62,0,REF_TAU,c,6,a);}
function iceSuper(ctx,x,y,p){const c='#79DFFF',q=attackP(p),a=.2+.8*Math.sin(q*Math.PI); const r=30+easeOut(q)*120; for(let i=0;i<18;i++){const ang=i/18*REF_TAU;iceShard(ctx,x+Math.cos(ang)*r,y-58+Math.sin(ang)*r*.68,10,28,ang,c,a);} glowArc(ctx,x,y-58,r,r*.68,0,REF_TAU,c,5,a*.8);}

export function drawGen1Attack(ctx,x,y,color,p,facing,charId,move){
  ctx.save();
  try {
    ctx.translate(x,y); ctx.scale(facing<0?-1:1,1);
    if(charId==='g1_thunder'){
      if(p < 0){
        thunderHold(ctx,0,0,move,Math.max(0,Math.min(1,-p-1)));
      } else if(move==='us') thunderUp(ctx,0,0,p); else if(move==='ds') thunderDown(ctx,0,0,Math.max(0,p)); else if(move==='ss') thunderSide(ctx,0,0,Math.max(0,p),false); else if(move==='sh'||move==='heavy') thunderSide(ctx,0,0,Math.max(0,p),true); else if(move==='uh'||move==='upHeavy') thunderUpHeavy(ctx,0,0,Math.max(0,p)); else if(move==='dh'||move==='downHeavy') thunderDownHeavy(ctx,0,0,Math.max(0,p));
    } else if(charId==='g1_fire') fireAttack(ctx,0,0,p,move);
    else if(charId==='g1_water') waterAttack(ctx,0,0,p,move);
    else if(charId==='g1_grass') grassAttack(ctx,0,0,p,move);
    else if(charId==='g1_ice') iceAttack(ctx,0,0,p,move);
  } finally {
    // Never allow a broken attack effect to leak its translate/scale into the main canvas.
    ctx.restore();
  }
}
export function drawGen1Super(ctx,x,y,p,facing,charId){
  ctx.save();
  try {
    ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);
    if(charId==='g1_thunder') thunderSuper(ctx,0,0,p); else if(charId==='g1_fire') fireSuper(ctx,0,0,p); else if(charId==='g1_water') waterSuper(ctx,0,0,p); else if(charId==='g1_grass') grassSuper(ctx,0,0,p); else if(charId==='g1_ice') iceSuper(ctx,0,0,p);
  } finally {
    ctx.restore();
  }
}
