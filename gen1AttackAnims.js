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


function grassUpReference(ctx,x,y,p){
  const c='#7CFF28', pale='#D9FF7A';
  if(p<0){
    // User-specified hold frame: frame 3 — propeller is visible and charging,
    // but the leaves are not collision-active until release.
    const q=holdCharge(p), cy=y-92;
    glowArc(ctx,x,cy,35+q*5,15+q*3,0,REF_TAU,c,4,.7,.0);
    for(let i=0;i<3;i++) leafBlade(ctx,x,cy,8+q*3,23+q*6,i*REF_TAU/3+q*1.2,c,.95);
    spark(ctx,x,cy,4+q*2,pale,.75);
    return;
  }
  const f=refFrame(p);
  if(f<2){ spark(ctx,x,y-88,4,c,.9); return; }
  const cy=y-92;
  const rot=Math.min(1,(f-2)/5.2)*REF_TAU;
  const radius=32;
  for(let i=0;i<3;i++) leafBlade(ctx,x+Math.cos(rot+i*REF_TAU/3)*radius,cy+Math.sin(rot+i*REF_TAU/3)*radius*.38,9,25,rot+i*REF_TAU/3,c,.95);
  glowArc(ctx,x,cy,42,17,0,REF_TAU,c,5,.55,rot*.12);
  if(f>=4 && f<8){
    const drop=Math.min(1,(f-4)/3.2), yy=cy+drop*72;
    glowArc(ctx,x,yy,39,15,0,REF_TAU,c,4,.8,rot*.2);
    for(let i=0;i<3;i++) leafBlade(ctx,x+Math.cos(rot+i*REF_TAU/3)*34,yy+Math.sin(rot+i*REF_TAU/3)*34*.4,8,22,rot+i*REF_TAU/3,c,.9);
  }
  if(f>=7){
    const burst=(f-7)/2.0;
  }
}

function iceUpReference(ctx,x,y,p){
  const c='#79DFFF', white='#EFFFFF';
  if(p<0){
    // User-specified hold frame: frame 2 — shard is formed and visibly charging.
    const q=holdCharge(p), sy=y-88-q*6;
    iceShard(ctx,x+1,sy,10+q*3,22+q*7,-.1-q*.25,c,.95);
    glowArc(ctx,x,sy+10,18+q*8,8+q*3,0,REF_TAU,c,3,.55,0);
    return;
  }
  const f=refFrame(p);
  const q=Math.min(1,Math.max(0,(f-2)/7));
  const sx=x+8+q*110, sy=y-88-q*92;
  if(f<2.1){ iceShard(ctx,x+1,y-88,10,24,0,c,.95); return; }
  if(f<4){ iceShard(ctx,sx,sy,12,30,q*6,c,1); }
  if(f>=4){
    glowArc(ctx,sx,sy+8,20,9,0,REF_TAU,c,3,.65,q*1.5);
    iceShard(ctx,sx,sy,13,31,q*9,c,1);
   
  }
  if(f>=8 && f<10){
    const launch=(f-8)/2;
    // Slight directional launch matching the reference's side-biased trajectory.
   
  }
  if(f>=10){ spark(ctx,sx,sy,3,white,.7); }
}

// ── Detailed non-up signatures/heavies ─────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// WATER HERO — true frame-by-frame native water animation.
// The supplied sheet is treated as a motion/design blueprint. Nothing from the
// sheet is drawn in-game. Every keyframe is reconstructed from native Canvas
// curves, layered translucent bodies, bright cores, tapering streams and spray.

// WATER HERO — optimized, frame-driven native liquid animation.
// The reference sheet is a blueprint only. Nothing from it is loaded at runtime.
const WATER_C='#18BFFF', WATER_MID='#65DDFF', WATER_HI='#E8FCFF';
const wlerp=(a,b,t)=>a+(b-a)*t;
const wease=t=>{t=clamp01(t);return t*t*(3-2*t);};
const wframe=(p,n)=>1+attackP(p)*(n-1);

// One inexpensive layered stroke replaces dozens of shadowBlur calls.
function wpath(ctx,pts,a=1,w=8,hi=.32){
  if(!pts||pts.length<2||a<=.01)return;
  ctx.save(); ctx.globalAlpha=a; ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle=WATER_C; ctx.lineWidth=w; ctx.shadowBlur=0;
  ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  ctx.globalAlpha=a*.7; ctx.strokeStyle=WATER_MID; ctx.lineWidth=Math.max(2,w*.42);
  ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  if(hi){ctx.globalAlpha=a*hi;ctx.strokeStyle=WATER_HI;ctx.lineWidth=Math.max(1,w*.13);ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}
  ctx.restore();
}
function wdrop(ctx,x,y,r=1.7,a=.7,ang=0){
  if(a<=.02)return; ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=WATER_HI;ctx.shadowBlur=0;
  ctx.beginPath();ctx.ellipse(0,0,r*.7,r*1.45,0,0,TAU);ctx.fill();ctx.restore();
}
function wspray(ctx,x,y,ang,spread,count,a,phase){
  const n=Math.min(count,10);
  for(let i=0;i<n;i++){const t=(i+.5)/n, th=ang+(t-.5)*spread, len=8+30*t+Math.sin(phase*8+i*2)*2;wdrop(ctx,x+Math.cos(th)*len,y+Math.sin(th)*len*.72,1.05+(i%3)*.35,a*(1-.42*t),th+.2);}
}
function wring(ctx,cx,cy,rx,ry,a=1,rot=0,phase=0,broken=.15){
  const seg=24,pts=[];for(let i=0;i<=seg;i++){const q=i/seg,ang=q*TAU+rot,w=1+Math.sin(ang*3+phase*7)*.035;pts.push([cx+Math.cos(ang)*rx*w,cy+Math.sin(ang)*ry*w]);}
  if(broken){for(let i=0;i<seg;i+=7){wpath(ctx,pts.slice(i,Math.min(i+5,seg+1)),a*.9,6,.26);}}
  else wpath(ctx,pts,a,6,.26);
  for(let i=0;i<8;i++){const ang=i/8*TAU+rot+phase*.3;wdrop(ctx,cx+Math.cos(ang)*rx,cy+Math.sin(ang)*ry,1.0+(i%2)*.35,a*.5,ang);}
}
function wcurve(ctx,p0,p1,p2,p3,n=18){const pts=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;pts.push([u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]);}return pts;}
function worb(ctx,cx,cy,r,a=1,phase=0){
  ctx.save();ctx.globalAlpha=a*.22;ctx.fillStyle=WATER_C;ctx.shadowBlur=0;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();ctx.globalAlpha=a;ctx.strokeStyle=WATER_C;ctx.lineWidth=6;ctx.beginPath();ctx.arc(cx,cy,r*.9,0,TAU);ctx.stroke();ctx.globalAlpha=a*.75;ctx.strokeStyle=WATER_HI;ctx.lineWidth=2;
  for(let i=0;i<3;i++){const z=phase*1.8+i*TAU/3;ctx.beginPath();ctx.ellipse(cx+Math.cos(z)*r*.1,cy+Math.sin(z)*r*.08,r*.76,r*.18,z*.35,0,TAU);ctx.stroke();}ctx.restore();
  for(let i=0;i<6;i++){const z=phase*1.5+i*TAU/6;wdrop(ctx,cx+Math.cos(z)*r*.95,cy+Math.sin(z)*r*.72,1.1+(i%2)*.3,a*.45,z);}
}
function wwhip(ctx,x,y,t,a=1,phase=0){
  const hand=[x+27,y-47], tip=[x+42+88*t,y-50-30*Math.sin(t*Math.PI)];
  const body=wcurve(hand,[x+42,y-49],[x+66+24*t,y-57-15*t],tip,20);wpath(ctx,body,a,11*(1-.25*t),.3);
  if(t>.18){const hookT=wease((t-.18)/.82),cx=tip[0],cy=tip[1];const pts=[];for(let i=0;i<=14;i++){const q=i/14,ang=-.55+q*(1.7+hookT*.6),rr=8+24*hookT*q;pts.push([cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr]);}wpath(ctx,pts,a*.95,8*(1-.35*hookT),.3);}
  for(let i=2;i<14;i+=3){const q=body[i];wdrop(ctx,q[0],q[1]-2*Math.sin(i+phase),1.05,a*.45,0);}
  wspray(ctx,tip[0],tip[1],-1.0,.8,6,a*.45,phase);
}
function wcrescent(ctx,x,y,t,a=1,phase=0){
  const cx=x+37+22*t,cy=y-54,r=53+23*Math.sin(t*Math.PI),start=-1.2+t*.12,end=.95+t*1.55;const pts=[];for(let i=0;i<=24;i++){const q=i/24,ang=start+(end-start)*q,rr=r*(.78+.22*Math.sin(q*Math.PI));pts.push([cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.74]);}wpath(ctx,pts,a,15,.28);
  const inner=[];for(let i=0;i<=18;i++){const q=i/18,ang=start+.1+(end-start-.2)*q;inner.push([cx+Math.cos(ang)*r*.82,cy+Math.sin(ang)*r*.82*.74]);}wpath(ctx,inner,a*.48,5,.3);
  if(t>.62)wspray(ctx,cx+Math.cos(end)*r,cy+Math.sin(end)*r*.74,end+.35,1.2,10,a*.8,phase);
}
function wspin(ctx,x,y,t,a=1,phase=0){
  const cx=x+4,cy=y-74-10*t,r0=28+12*t,r1=65+18*t,turns=1.15+1.0*t,pts=[];for(let i=0;i<=30;i++){const q=i/30,ang=-.25-q*turns*TAU,rr=wlerp(r0,r1,q);pts.push([cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.64]);}wpath(ctx,pts,a,13,.28);for(let i=0;i<10;i++){const q=i/9,ang=-.25-q*turns*TAU,rr=r1+5+q*18;wdrop(ctx,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.64,1.15+(i%2)*.35,a*.5*(1-.25*q),ang);}}
function wsplash(ctx,x,y,side,t,a=1,phase=0){
  const s=side, h=28+22*t, out=20+28*t;const p=wcurve([x,y],[x+s*5,y-h*.55],[x+s*out*.6,y-h],[x+s*out,y-h*.35],14);wpath(ctx,p,a,10,.3);const p2=wcurve([x+s*3,y],[x+s*12,y-8],[x+s*out*.7,y-h*.75],[x+s*(out+12),y-h*.15],12);wpath(ctx,p2,a*.62,5,.3);wspray(ctx,x+s*out,y-h*.25,s*(-1.2),1.0,6,a*.65,phase);}
function wburst(ctx,x,y,a=1,phase=0){
  for(let i=0;i<7;i++){const ang=-Math.PI/2+(i-3)*.28;const len=32+12*(i%3);const p=wcurve([x,y],[x+Math.cos(ang)*8,y+Math.sin(ang)*8],[x+Math.cos(ang)*len*.55,y+Math.sin(ang)*len*.55],[x+Math.cos(ang)*len,y+Math.sin(ang)*len],9);wpath(ctx,p,a*(1-.04*i),7,.25);}
  wspray(ctx,x,y,-Math.PI/2,2.2,10,a*.75,phase);
}

function waterUpReference(ctx,x,y,p){
  const q=attackP(p),f=wframe(p,4),phase=q*8;if(p<0){const h=holdCharge(p);wring(ctx,x+24,y-46,16+4*h,8+2*h,.8,-.2,h);return;}
  if(f<=1.5){const t=wease((f-1)*2);wring(ctx,wlerp(x+24,x+27,t),wlerp(y-44,y-58,t),18+5*t,9+2*t,.95,-.15,phase,.12);}
  else if(f<=2.5){const t=wease(f-1.5);wring(ctx,wlerp(x+28,x+37,t),wlerp(y-58,y-79,t),23,10,.98,-.1+t*.3,phase,.12);wpath(ctx,[[x+19,y-31],[x+25,y-47],[x+35,y-72]],.72,5,.3);}
  else {const t=wease((f-2.5)/1.5),cx=wlerp(x+38,x+96,t),cy=wlerp(y-80,y-110,t)-Math.sin(t*Math.PI)*7;wring(ctx,cx,cy,24-3*t,10-1*t,1,.05+t*.18,phase,.18);const trail=wcurve([x+35,y-76],[x+54,y-90],[x+76,y-106],[cx,cy],16);wpath(ctx,trail,.85,6,.3);wspray(ctx,cx-18,cy+5,-2.55,.75,7,.6,phase);}
}
function waterDownReference(ctx,x,y,p){
  const q=attackP(p),f=wframe(p,4),phase=q*8;if(p<0){const h=holdCharge(p);wring(ctx,x,y-3,34+6*h,8,.3,0,h,.3);return;}
  if(f<=1.5){wring(ctx,x,y-3,36,9,.5,0,phase,.3);}
  else if(f<=2.5){const t=wease(f-1.5);wsplash(ctx,x-5,y,-1,t,1,phase);wsplash(ctx,x+5,y,1,t,1,phase+1.2);}
  else {const t=wease((f-2.5)/1.5);wsplash(ctx,x-6,y,-1,1-t*.18,1-t*.18,phase+1);wsplash(ctx,x+6,y,1,1-t*.18,1-t*.18,phase+2);}
}
function waterSideReference(ctx,x,y,p){const q=attackP(p),f=wframe(p,4),phase=q*8;if(p<0){const h=holdCharge(p);wwhip(ctx,x,y,.25+.25*h,.55+.2*h,phase);return;}if(f<=1.5){wpath(ctx,[[x+16,y-36],[x+30,y-45]],.7,6,.3);}else{const t=wease((f-1.5)/2.5);wwhip(ctx,x,y,t,1,phase);}}
function waterUpHeavyReference(ctx,x,y,p){const q=attackP(p),f=wframe(p,4),phase=q*8;if(p<0){const h=holdCharge(p);wspin(ctx,x,y,.25*h,.6+.2*h,phase);return;}if(f<=1.5){const t=wease((f-1)*2);wspin(ctx,x,y,.15+.25*t,.9,phase);}else if(f<=2.5){wspin(ctx,x,y,wease(f-1.5),1,phase);}else{const t=wease((f-2.5)/1.5);wspin(ctx,x,y,1,1,phase);const launch=wcurve([x+8,y-42],[x+20,y-64],[x+48,y-92],[x+70,y-126],12);wpath(ctx,launch,.95,9,.28);wspray(ctx,x+70,y-126,-1.5,1.0,8,.65,phase);}}
function waterDownHeavyReference(ctx,x,y,p){const q=attackP(p),f=wframe(p,4),phase=q*8;if(p<0){const h=holdCharge(p);worb(ctx,x+52,y-52,20,.7+.2*h,phase);return;}if(f<=1.5){worb(ctx,x+52,y-52,22,1,phase);}else if(f<=2.5){const t=wease(f-1.5);worb(ctx,x+56,y-52+44*t,22,1,phase);wpath(ctx,[[x+28,y-30],[x+56,y-45+40*t]],.75,6,.25);}else{const t=wease((f-2.5)/1.5);worb(ctx,x+56,y-8,20*(1-.25*t),1-t*.2,phase);wburst(ctx,x+56,y-8,1-t*.15,phase);wpath(ctx,[[x+56,y-8],[x+56,y-70]],.9,9,.25);}}
function waterSideHeavyReference(ctx,x,y,p){const q=attackP(p),f=wframe(p,6),phase=q*8;if(p<0){const h=holdCharge(p);wcrescent(ctx,x,y,.18*h,.55+.25*h,phase);return;}if(f<=1.5){wpath(ctx,[[x+14,y-38],[x+28,y-47]],.7,6,.3);}else if(f<=5.5){wcrescent(ctx,x,y,wease((f-1.5)/4),1,phase);}else{const t=wease((f-5.5)/.5);wcrescent(ctx,x,y,1,1-t,phase);wspray(ctx,x+92,y-62,.25,1.5,10,(1-t)*.8,phase);}}
function waterAttack(ctx,x,y,p,move){
  const prev=WATER_PERF_MODE; WATER_PERF_MODE=true;
  try {
    if(move==='us')return waterUpReference(ctx,x,y,p);
    if(move==='ds')return waterDownReference(ctx,x,y,p);
    if(move==='ss')return waterSideReference(ctx,x,y,p);
    if(move==='uh'||move==='upHeavy')return waterUpHeavyReference(ctx,x,y,p);
    if(move==='dh'||move==='downHeavy')return waterDownHeavyReference(ctx,x,y,p);
    if(move==='sh'||move==='heavy')return waterSideHeavyReference(ctx,x,y,p);
  } finally { WATER_PERF_MODE=prev; }
}
function waterSuper(ctx,x,y,p){ const prev=WATER_PERF_MODE; WATER_PERF_MODE=true; try {const q=attackP(p),f=wframe(p,7),phase=q*10,cy=y-62;if(p<0){const h=holdCharge(p);worb(ctx,x,cy,24+10*h,.65+.2*h,phase);return;}if(f<=2){const t=wease(f-1);worb(ctx,x,cy,26+18*t,1,phase);wpath(ctx,[[x-24,y-26],[x-8,cy]],.7,6,.3);wpath(ctx,[[x+24,y-26],[x+8,cy]],.7,6,.3);}else if(f<=3){worb(ctx,x,cy,46+20*wease(f-2),1,phase);for(let i=0;i<5;i++){const a=i/5*TAU+phase;wdrop(ctx,x+Math.cos(a)*55,cy+Math.sin(a)*40,1.3,.55,a);}}else if(f<=4.1){const t=wease((f-3)/1.1);worb(ctx,x,cy,66+30*t,1,phase);wspray(ctx,x,cy,-Math.PI/2,TAU,10,.5,phase);}else if(f<=5.1){const t=wease(f-4.1),r=96-52*t;wring(ctx,x,cy,r,r*.7,1,.1,phase,.1);wburst(ctx,x,cy,.7,phase);}else if(f<=6.1){const t=wease(f-5.1),r=44+84*t;wring(ctx,x,cy,r,r*.68,1,.1,phase,.12);wpath(ctx,[[x,cy],[x+18*t,cy-58*t]],.85,6,.25);}else{const t=wease(f-6.1),r=128-10*t;wring(ctx,x,cy,r,r*.68,1,.12,phase,.1);wspray(ctx,x+42,cy-54,-1.5,1.1,8,.65*(1-t),phase);}} finally { WATER_PERF_MODE=prev; }}

// Per-attack body pose. The renderer uses these offsets to animate the actual
// arms/legs/lean; the canvas mirror in drawStickman handles facing automatically.
export function getGen1AttackPose(move,p,facing=1,charId='g1_water'){
  const q=clamp01(Math.max(0,p));
  const t=wease(q);
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

function grassAttack(ctx,x,y,p,move){
  const c='#7CFF28', pale='#D9FF7A', wood='#9B6A3B', q=attackP(p), a=.3+.7*Math.sin(q*Math.PI);
  if(move==='us'){grassUpReference(ctx,x,y,p);return;}
  if(move==='ss'){
    const t=easeOut(q), ex=x+18+t*100, ey=y-45-Math.sin(t*Math.PI)*10; glowStroke(ctx,[[x+8,y-25],[x+25,y-45],[ex,ey]],wood,10,a); glowStroke(ctx,[[x+18,y-42],[ex,ey]],c,3,a); for(let i=0;i<4;i++)leafBlade(ctx,x+35+t*50+i*8,ey+(i%2?6:-6),4,10,i*.8,c,a*.7); return;
  }
  if(move==='ds'){
    const t=easeOut(q); for(const s of [-1,1]){const bx=x+s*(22+32*t); glowStroke(ctx,[[x+s*10,y-4],[bx,y-34]],c,7,a); for(let i=0;i<3;i++)leafBlade(ctx,bx+s*i*9,y-34-i*6,4,10,s*.7+i*.2,c,a*.8);} return;
  }
  if(move==='sh'){
    const t=easeOut(q), ex=x+25+t*100; glowStroke(ctx,[[x+8,y-42],[ex,y-42]],wood,15,a); for(let i=0;i<5;i++)leafBlade(ctx,x+48+t*55+i*7,y-42+(i%2?8:-8),5,12,-.4+i*.25,c,a*.8); return;
  }
  if(move==='uh'){
    const r=68; glowArc(ctx,x,y-82,r,r*.55,0,REF_TAU,c,8,a); for(let i=0;i<9;i++){const ang=i/9*REF_TAU+q*4;leafBlade(ctx,x+Math.cos(ang)*r,y-82+Math.sin(ang)*r*.55,8,20,ang,c,a*.85);} return;
  }
  if(move==='dh'){
    glowStroke(ctx,[[x-40,y-100],[x+30,y-25],[x+5,y+2]],c,10,a); glowStroke(ctx,[[x+5,y+2],[x-30,y-35],[x-15,y-75]],c,8,a*.8); for(let i=0;i<8;i++)leafBlade(ctx,x-20+i*8,y-35+i*2,4,10,i*.6,c,a*.65); return;
  }
}
function iceAttack(ctx,x,y,p,move){
  const c='#79DFFF', white='#EFFFFF', q=attackP(p), a=.3+.7*Math.sin(q*Math.PI);
  if(move==='us'){iceUpReference(ctx,x,y,p);return;}
  if(move==='ss'){
    const t=easeOut(q), ang=-1+t*2; const ex=x+22+Math.cos(ang)*58, ey=y-45+Math.sin(ang)*58; glowStroke(ctx,[[x+8,y-30],[x+24,y-44],[ex,ey]],c,12,a); iceShard(ctx,ex,ey,13,32,ang,c,a); return;
  }
  if(move==='ds'){
    glowArc(ctx,x,y-10,55,15,0,REF_TAU,c,5,a); for(let i=0;i<7;i++){const ang=Math.PI*1.05+i/6*Math.PI*.9; iceShard(ctx,x+Math.cos(ang)*52*q,y-15+Math.sin(ang)*28*q,8,22,ang,c,a);} return;
  }
  if(move==='sh'){
    const t=easeOut(q), ang=-1+t*2; glowStroke(ctx,[[x+12,y-45],[x+28+Math.cos(ang)*50,y-45+Math.sin(ang)*50]],c,16,a); iceShard(ctx,x+28+Math.cos(ang)*60,y-45+Math.sin(ang)*60,16,42,ang,c,a); glowArc(ctx,x+28,y-45,62,52,-1,ang,c,4,a*.7); return;
  }
  if(move==='uh'){
    for(let i=0;i<3;i++){const ang=-Math.PI/2+i*REF_TAU/3+q*.8; const sx=x+Math.cos(ang)*72*q, sy=y-76+Math.sin(ang)*72*q; iceShard(ctx,sx,sy,13,34,ang,c,a);} return;
  }
  if(move==='dh'){
    const bx=x+25+q*110; ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=18;ctx.beginPath();ctx.roundRect(bx-34,y-25,68,38,8);ctx.fill();ctx.restore(); for(let i=0;i<5;i++)iceShard(ctx,bx-30+i*15,y-28-(i%2)*10,6,15,i*.8,c,a*.7); return;
  }
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
