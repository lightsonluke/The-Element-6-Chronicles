// Generation I hand-authored attack animation system.
// IMPORTANT: every directional attack is authored facing RIGHT and mirrored
// with the canvas transform. This guarantees left/right are literal flips of
// the same move instead of two different animations.

const TAU = Math.PI * 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const easeOut = v => 1 - Math.pow(1 - clamp01(v), 3);
const alpha = p => Math.sin(clamp01(p) * Math.PI);
let FIRE_PERF_MODE = false;

function glow(ctx, color, blur = 18) {
  if (FIRE_PERF_MODE) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; return; }
  ctx.shadowColor = color; ctx.shadowBlur = blur;
}
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
  ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=c; if(!FIRE_PERF_MODE){ctx.shadowColor=c;ctx.shadowBlur=14;} else ctx.shadowBlur=0;
  ctx.beginPath(); ctx.arc(x,y,r,0,REF_TAU); ctx.fill(); ctx.restore();
}
function glowStroke(ctx, pts, c, w, a=1) {
  ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; ctx.lineJoin='round';
  if(!FIRE_PERF_MODE){ctx.shadowColor=c;ctx.shadowBlur=Math.max(8,w*2.5);} else ctx.shadowBlur=0; ctx.beginPath();
  pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke(); ctx.restore();
}
function glowArc(ctx, x,y,rx,ry,a0,a1,c,w,a=1,rot=0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; if(!FIRE_PERF_MODE){ctx.shadowColor=c;ctx.shadowBlur=Math.max(10,w*2.5);} else ctx.shadowBlur=0;
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,a0,a1); ctx.stroke(); ctx.restore();
}
function core(ctx,x,y,r,c,a=1){ spark(ctx,x,y,r,'#fff',a*.85); spark(ctx,x,y,r*.58,c,a); }
function flameShape(ctx,x,y,r,c,a=1,rot=0){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=a; ctx.fillStyle=c; if(!FIRE_PERF_MODE){ctx.shadowColor=c; ctx.shadowBlur=18;} else {ctx.shadowBlur=0;}
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

function waterUpReference(ctx,x,y,p){
  // Native recreation of the supplied 12-frame Water Hero Up Signature guide.
  // The guide is a blueprint only: all water is drawn procedurally in-game.
  const c='#24BFFF', white='#DDFBFF';
  if(p<0){
    // Hold/charge: frame 1 silhouette — a small spinning ring wraps the lower arm.
    const q=holdCharge(p);
    const spin=q*REF_TAU*1.35;
    const rr=18+q*6;
    waterRing(ctx,x+4,y-34,rr+7,10+q*2,c,.72+q*.22,-.15+spin*.18);
    glowStroke(ctx,[[x+5,y-25],[x+12,y-42]],c,5,.75+q*.12);
    for(let i=0;i<4;i++){
      const a=spin+i*REF_TAU/4;
      spark(ctx,x+4+Math.cos(a)*(rr+6),y-34+Math.sin(a)*10,1.5,c,.45+q*.3);
    }
    return;
  }

  const f=refFrame(p);

  // Reference frame 1: small ring around the lower arm/waist area.
  if(f<1.65){
    waterRing(ctx,x+4,y-34,22,10,c,.78,-.15);
    return;
  }

  // Reference frame 2: the ring swings upward around the raised hand.
  if(f<2.55){
    const t=ease((f-1.65)/.9);
    const rx=22+3*t, ry=10+2*t;
    const cx=x+4+14*t, cy=y-34-16*t;
    waterRing(ctx,cx,cy,rx,ry,c,.84+.1*t,-.15-.08*t);
    glowStroke(ctx,[[x+8,y-26],[x+15,y-40],[x+4+18*t,y-50]],c,5.5,.78);
    return;
  }

  // Frames 3-7: the ring separates and follows a short curved upward path.
  // These staged points are taken directly from the visual guide's motion:
  // separate -> high/right -> near peak -> break apart.
  const points=[
    {f:3,x:76,y:-74,rx:27,ry:11,a:1},
    {f:4,x:142,y:-105,rx:27,ry:11,a:1},
    {f:5,x:151,y:-108,rx:25,ry:10,a:.98},
    {f:6,x:140,y:-128,rx:22,ry:9,a:.92},
    {f:7,x:129,y:-119,rx:12,ry:6,a:.55}
  ];
  if(f>=2.55 && f<7.85){
    const idx=Math.max(0,Math.min(points.length-2,Math.floor((f-3))));
    const a=points[idx], b=points[Math.min(points.length-1,idx+1)];
    const t=ease(clamp01((f-a.f)/Math.max(.001,b.f-a.f)));
    const px=a.x+(b.x-a.x)*t;
    const py=a.y+(b.y-a.y)*t;
    const rx=a.rx+(b.rx-a.rx)*t;
    const ry=a.ry+(b.ry-a.ry)*t;
    const op=a.a+(b.a-a.a)*t;

    // Curved water trail behind the ring; the ring itself remains the hitbox.
    const trail=[];
    const trailSteps=7;
    for(let i=trailSteps;i>=1;i--){
      const u=clamp01((f-3-i*.16)/4);
      const ti=ease(u);
      const tx=76+(151-76)*ti;
      const ty=-74+(-108+74)*ti;
      trail.push([x+tx,y+ty]);
    }
    trail.push([x+px,y+py]);
    glowStroke(ctx,trail,c,5.5,.42);
    for(let i=0;i<8;i++){
      const k=i/8;
      const sx=x+px-(px-76)*(0.15+k*.55);
      const sy=y+py-(py+74)*(0.15+k*.55)+Math.sin(i*1.7)*2;
      spark(ctx,sx,sy,1.5+(i%2),c,(.22+.08*(i%3))*(1-k));
    }
    waterRing(ctx,x+px,y+py,rx,ry,c,op,.2+(f-3)*.16);
    return;
  }

  // Frame 8: only a few fading water fragments remain.
  if(f<8.8){
    const t=ease((f-7.85)/.95);
    const px=129+7*t, py=-119-5*t;
    for(let i=0;i<5;i++){
      const dx=(i-2)*7, dy=(i%2)*3;
      spark(ctx,x+px+dx,y+py+dy,1.8-(t*.7),c,(.45*(1-t)));
    }
    return;
  }

  // Frames 9-12: clean return to neutral / idle. No attack effect remains.
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
// Improved supers. They deliberately have no hold state.
function fireFlameOrbitLegacy(ctx,cx,cy,rx,ry,start,end,color,alpha=1,count=7){
  glowArc(ctx,cx,cy,rx,ry,start,end,color,5,alpha);
  for(let i=0;i<count;i++){
    const t=count===1 ? 0 : i/(count-1);
    const a=start+(end-start)*t;
    flameShape(ctx,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,5.5,color,alpha*.9,a+Math.PI/2);
  }
}
function fireLineBurstLegacy(ctx,x,y,r,alpha=1){
  for(let i=0;i<10;i++){
    const a=i/10*REF_TAU;
    const len=r*(.75+.18*Math.sin(i*2.7));
    const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len*.68;
    flameShape(ctx,x2,y2,7,'#FF9A22',alpha*.85,a+Math.PI/2);
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
function waterSuper(ctx,x,y,p){const c='#24BFFF',q=attackP(p),a=.2+.8*Math.sin(q*Math.PI); const r=35+easeOut(q)*110; waterRing(ctx,x,y-58,r,r*.55,c,a,.1); for(let i=0;i<16;i++){const ang=i/16*REF_TAU+q*2; glowStroke(ctx,[[x+Math.cos(ang)*(r-20),y-58+Math.sin(ang)*(r-20)*.55],[x+Math.cos(ang)*r,y-58+Math.sin(ang)*r*.55]],c,6,a*.65);}}
function grassSuper(ctx,x,y,p){const c='#7CFF28',q=attackP(p),a=.2+.8*Math.sin(q*Math.PI); const r=30+easeOut(q)*105; for(let i=0;i<14;i++){const ang=i/14*REF_TAU+q*1.8; leafBlade(ctx,x+Math.cos(ang)*r,y-58+Math.sin(ang)*r*.62,13,34,ang,c,a*.85);} glowArc(ctx,x,y-58,r,r*.62,0,REF_TAU,c,6,a);}
function iceSuper(ctx,x,y,p){const c='#79DFFF',q=attackP(p),a=.2+.8*Math.sin(q*Math.PI); const r=30+easeOut(q)*120; for(let i=0;i<18;i++){const ang=i/18*REF_TAU;iceShard(ctx,x+Math.cos(ang)*r,y-58+Math.sin(ang)*r*.68,10,28,ang,c,a);} glowArc(ctx,x,y-58,r,r*.68,0,REF_TAU,c,5,a*.8);}

export function drawGen1Attack(ctx,x,y,color,p,facing,charId,move){
  ctx.save(); ctx.translate(x,y); ctx.scale(facing<0?-1:1,1);
  if(charId==='g1_thunder'){
    if(p < 0){
      thunderHold(ctx,0,0,move,Math.max(0,Math.min(1,-p-1)));
    } else if(move==='us') thunderUp(ctx,0,0,p); else if(move==='ds') thunderDown(ctx,0,0,Math.max(0,p)); else if(move==='ss') thunderSide(ctx,0,0,Math.max(0,p),false); else if(move==='sh'||move==='heavy') thunderSide(ctx,0,0,Math.max(0,p),true); else if(move==='uh'||move==='upHeavy') thunderUpHeavy(ctx,0,0,Math.max(0,p)); else if(move==='dh'||move==='downHeavy') thunderDownHeavy(ctx,0,0,Math.max(0,p));
  } else if(charId==='g1_fire') fireAttack(ctx,0,0,p,move);
  else if(charId==='g1_water') waterAttack(ctx,0,0,p,move);
  else if(charId==='g1_grass') grassAttack(ctx,0,0,p,move);
  else if(charId==='g1_ice') iceAttack(ctx,0,0,p,move);
  ctx.restore();
}
export function drawGen1Super(ctx,x,y,p,facing,charId){
  ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);
  if(charId==='g1_thunder') thunderSuper(ctx,0,0,p); else if(charId==='g1_fire') fireSuper(ctx,0,0,p); else if(charId==='g1_water') waterSuper(ctx,0,0,p); else if(charId==='g1_grass') grassSuper(ctx,0,0,p); else if(charId==='g1_ice') iceSuper(ctx,0,0,p); ctx.restore();
}
