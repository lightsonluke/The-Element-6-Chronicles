// Generation I hand-authored attack animation system.
// IMPORTANT: every directional attack is authored facing RIGHT and mirrored
// with the canvas transform. This guarantees left/right are literal flips of
// the same move instead of two different animations.

const TAU = Math.PI * 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const easeOut = v => 1 - Math.pow(1 - clamp01(v), 3);
const alpha = p => Math.sin(clamp01(p) * Math.PI);

function glow(ctx, color, blur = 18) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
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
function fireUpReference(ctx,x,y,p){
  const c='#FF5A16', hot='#FF9A22', white='#FFF2B0';
  if(p<0){
    const q=holdCharge(p);
    // User-specified hold stance: frame 2 silhouette, with a growing flame hook.
    const lift=.05*q, r=15+22*q;
    glowStroke(ctx,[[x+8,y-30],[x+20,y-48],[x+25,y-70-lift*8]],c,8+q*2,.8);
    glowArc(ctx,x+28,y-76,10+r*.45,8+r*.3,-2.25,-.45,c,5+q*5,.85);
    flameShape(ctx,x+30,y-78,r*.42,hot,.9,.2);
    spark(ctx,x+30,y-78,3+q*2,white,.7);
    return;
  }
  const f=refFrame(p);
  // Frames 1-2: idle -> upward swing. Frame 3 forms the hook.
  if(f<2.0){ return; }
  const swing=Math.min(1,(f-2)/1.25);
  const armX=x+18+swing*8, armY=y-42-swing*34;
  glowStroke(ctx,[[x+10,y-24],[x+18,y-38],[armX,armY]],c,8,.9);
  if(f>=2.6){
    const hookT=Math.min(1,(f-2.6)/1.7), ang=-2.45+hookT*2.0;
    const hx=armX+Math.cos(ang)*38, hy=armY+Math.sin(ang)*38;
    glowArc(ctx,armX,armY,42+hookT*8,30+hookT*7,-2.55,ang,c,9,.95,-.05);
    flameShape(ctx,hx,hy,11,hot,1,ang+.4); spark(ctx,hx,hy,3,white,.9);
    for(let i=0;i<7;i++){const a=ang-.8+i*.22; spark(ctx,armX+Math.cos(a)*48,armY+Math.sin(a)*36,1.5,c,.6);}
    if(f>=4 && f<6.5){
      const launch=(f-4)/2.5;
      glowStroke(ctx,[[hx,hy],[hx+18*launch,hy-22*launch]],hot,3,.55);
    }
  }
  if(f>=7){
    // Reference hold visual can remain readable after the hit; actual game hold is pre-attack.
    const a=Math.max(.2,1-(f-7)/5);
    glowArc(ctx,armX,armY,48,35,-2.55,.25,c,8,a,-.05);
    flameShape(ctx,armX+32,armY-28,12,hot,a,.2);
  }
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
function fireAttack(ctx,x,y,p,move){
  const c='#FF5A16', hot='#FFB12B', q=attackP(p), a=.25+.75*Math.sin(q*Math.PI);
  if(move==='us'){fireUpReference(ctx,x,y,p);return;}
  if(move==='ss'){
    const t=Math.min(1,q/.72), ex=x+18+t*90, ey=y-43-Math.sin(t*Math.PI)*18;
    glowStroke(ctx,[[x+8,y-25],[x+25,y-43],[ex,ey]],c,8,a); flameShape(ctx,ex,ey,18,hot,a,.15); return;
  }
  if(move==='ds'){
    const spread=18+q*38; for(let i=-2;i<=2;i++){const xx=x+i*spread*.42; flameShape(ctx,xx,y-15-Math.abs(i)*3,14+q*5,c,a,.1*i); glowStroke(ctx,[[xx,y-2],[xx+i*5,y-28]],hot,3,a*.65);} return;
  }
  if(move==='sh'){
    const t=easeOut(q), ang=-.9+t*1.8, ex=x+26+Math.cos(ang)*58, ey=y-46+Math.sin(ang)*58;
    glowStroke(ctx,[[x+8,y-34],[x+28,y-48],[ex,ey]],c,13,a); flameShape(ctx,ex,ey,25,hot,a,ang); glowArc(ctx,x+35,y-46,58,44,-.9,ang,c,6,a*.7,-.15); return;
  }
  if(move==='uh'){
    const t=easeOut(q), r=58; glowArc(ctx,x,y-92,r,r*.62,-Math.PI*.15,Math.PI*1.85,c,10,a); for(let i=0;i<9;i++){const ang=i/9*REF_TAU+t*REF_TAU; flameShape(ctx,x+Math.cos(ang)*r,y-92+Math.sin(ang)*r*.62,10,hot,a*.8,ang);} return;
  }
  if(move==='dh'){
    for(let i=0;i<6;i++){const xx=x+(i-2.5)*25*q; glowStroke(ctx,[[x,y-5],[xx,y-38-Math.abs(i-2.5)*8]],c,5,a*.8); flameShape(ctx,xx,y-40-Math.abs(i-2.5)*7,12,hot,a,.2*(i-2.5));} return;
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// WATER HERO — native frame-by-frame animation reconstruction.
// The supplied blueprint is treated as animation keyframes, never as sprites.
// Every reference frame below is interpolated into a continuous water motion.

function waterGlowStroke(ctx, pts, a=1, width=7) {
  const c='#24BFFF', hi='#DDFBFF';
  glowStroke(ctx, pts, c, width, a);
  glowStroke(ctx, pts, hi, Math.max(1.2,width*.18), a*.78);
}
function waterDrop(ctx,x,y,r=2,a=.8) {
  ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#9CEEFF'; ctx.shadowColor='#24BFFF'; ctx.shadowBlur=10;
  ctx.beginPath(); ctx.ellipse(x,y,r*.7,r*1.35,-.35,0,TAU); ctx.fill(); ctx.restore();
}
function waterTrail(ctx, pts, a=1, width=8) {
  if (pts.length<2) return;
  // broad body + bright inner stream = flowing water instead of a static neon line
  waterGlowStroke(ctx, pts, a, width);
  for(let i=1;i<pts.length;i++){
    const t=i/(pts.length-1), q=pts[i];
    if(i%2===0) waterDrop(ctx,q[0]+Math.sin(i*2.7)*2,q[1]-Math.cos(i*1.8)*2,1.3+2*(1-t),a*.62*(1-t*.35));
  }
}
function waterJet(ctx, start, end, bend=0, a=1, width=9) {
  const [x1,y1]=start,[x2,y2]=end;
  const mx=(x1+x2)/2, my=(y1+y2)/2+bend;
  const pts=[];
  for(let i=0;i<=12;i++){
    const t=i/12, u=1-t;
    pts.push([u*u*x1+2*u*t*mx+t*t*x2, u*u*y1+2*u*t*my+t*t*y2]);
  }
  waterTrail(ctx,pts,a,width);
  return pts;
}
function waterCrescent(ctx,cx,cy,r,ang0,ang1,a=1,width=13) {
  const pts=[];
  for(let i=0;i<=24;i++){
    const t=i/24, ang=ang0+(ang1-ang0)*t;
    const rr=r*(.82+.18*Math.sin(t*Math.PI));
    pts.push([cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.72]);
  }
  waterTrail(ctx,pts,a,width);
  // detached spray follows the outer edge
  for(let i=2;i<22;i+=3){
    const t=i/24, ang=ang0+(ang1-ang0)*t, rr=r*(.98+.12*Math.sin(t*Math.PI));
    waterDrop(ctx,cx+Math.cos(ang)*rr+Math.sin(i)*2,cy+Math.sin(ang)*rr*.72-Math.cos(i)*2,1.6,a*.72*(1-t*.25));
  }
}
function waterSphere(ctx,x,y,r,a=1,phase=0) {
  ctx.save();
  ctx.globalAlpha=a;
  ctx.fillStyle='rgba(36,191,255,.20)'; ctx.shadowColor='#24BFFF'; ctx.shadowBlur=20;
  ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
  ctx.strokeStyle='#24BFFF'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y,r*.9,phase,phase+TAU*.86); ctx.stroke();
  ctx.strokeStyle='#DDFBFF'; ctx.lineWidth=1.7; ctx.beginPath(); ctx.arc(x,y,r*.66,phase+.8,phase+TAU*.66); ctx.stroke();
  ctx.restore();
  for(let i=0;i<8;i++){
    const a2=phase+i/8*TAU;
    waterDrop(ctx,x+Math.cos(a2)*r*1.02,y+Math.sin(a2)*r*1.02,1.4,a*.7);
  }
}
function waterSplash(ctx,x,y,dir=1,scale=1,a=1) {
  // Two curved sheets rise from one contact point, with a tapered breaking edge.
  const s=dir*scale;
  const p1=waterJet(ctx,[x,y],[x+s*34,y-42*scale],-14*scale,a,8*scale);
  const p2=waterJet(ctx,[x+s*3,y-1],[x+s*52,y-30*scale],-24*scale,a*.82,5*scale);
  for(let i=0;i<5;i++){
    const t=.45+i*.1, q=p1[Math.min(p1.length-1,Math.floor(t*(p1.length-1)))];
    waterDrop(ctx,q[0]+dir*i*3,q[1]-i*3,1.5+scale*.45,a*.72);
  }
  return p1;
}
function waterRingMoving(ctx,x,y,rx,ry,rot,a=1,broken=0) {
  glowArc(ctx,x,y,rx,ry,0,TAU,'#24BFFF',7,a,rot);
  glowArc(ctx,x,y,rx*.72,ry*.58,0,TAU,'#DDFBFF',1.8,a*.7,rot);
  const gaps=Math.max(0,Math.min(8,broken));
  for(let i=0;i<10;i++){
    if(gaps && i<gaps) continue;
    const t=i/10*TAU;
    waterDrop(ctx,x+Math.cos(t+rot)*rx,y+Math.sin(t+rot)*ry,1.5,a*.65);
  }
}
function waterFrame(p,count){ return 1+attackP(p)*(count-1); }
function lerp(a,b,t){return a+(b-a)*t;}
function lerp2(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t)];}
function frameSegment(f,keys){
  if(f<=1)return {i:0,t:0};
  if(f>=keys.length)return {i:keys.length-2,t:1};
  const z=f-1, i=Math.floor(z), t=z-i; return {i,t:ease(t)};
}

function waterUpReference(ctx,x,y,p){
  const f=waterFrame(p,4);
  if(p<0){
    const q=holdCharge(p);
    waterRingMoving(ctx,x+22,y-42,15+q*5,8+q*2,-.15,.72+.2*q);
    waterJet(ctx,[x+12,y-25],[x+24,y-48],-3,.65,5);
    return;
  }
  const keys=[[x+22,y-43],[x+34,y-76],[x+84,y-116],[x+116,y-122]];
  const seg=frameSegment(f,keys), pos=lerp2(keys[seg.i],keys[seg.i+1],seg.t);
  // Frame 1: ring is still wrapped around the raised hand.
  if(f<1.65){
    const k=Math.max(0,(f-1)/.65); waterRingMoving(ctx,lerp(x+20,x+30,k),lerp(y-43,y-73,k),18+7*k,9+3*k,-.2+k*.2,.95);
    waterJet(ctx,[x+8,y-24],[x+28,y-69],-3,.7,6);
    return;
  }
  // Frame 2: ring is pulled off the hand.
  if(f<2.55){
    const u=ease((f-1.65)/.9), hand=[x+31,y-73];
    waterRingMoving(ctx,lerp2(hand,keys[1],u)[0],lerp2(hand,keys[1],u)[1],24+5*u,11+3*u,.25+u*.25,1);
    waterJet(ctx,[hand[0],hand[1]],[pos[0],pos[1]],-10,.8,6);
  }
  // Frames 3-4: detached ring follows the exact rising/curving path and breaks apart.
  const u=Math.max(0,Math.min(1,(f-2)/2));
  const a=1-u*.72;
  waterRingMoving(ctx,pos[0],pos[1],26-4*u,11-2*u,.18+u*.35,a,Math.floor(u*5));
  const prev=lerp2(keys[Math.max(0,seg.i)],keys[seg.i+1],Math.max(0,seg.t-.18));
  waterTrail(ctx,[prev,pos],a*.7,6);
  if(u>.5) for(let i=0;i<8;i++){
    const t=i/8, dx=pos[0]-Math.cos(i)*8, dy=pos[1]-Math.sin(i)*5;
    waterDrop(ctx,dx-t*26,dy+t*16,1.3,a*(1-t)*.75);
  }
}

function waterDownReference(ctx,x,y,p){
  const f=waterFrame(p,4);
  if(p<0){
    const q=holdCharge(p); waterJet(ctx,[x-2,y-6],[x-38,y-18],-16,.55+.25*q,6); waterJet(ctx,[x+2,y-6],[x+38,y-18],-16,.55+.25*q,6); return;
  }
  if(f<1.55) return;
  const u=Math.max(0,Math.min(1,(f-1)/3));
  const rise=ease(Math.min(1,u*1.25));
  // Left and right sheets are independent hit regions and mirror each other.
  const lx=lerp(x-10,x-54,rise), rx=lerp(x+10,x+54,rise), yy=y-10-rise*35;
  waterSplash(ctx,lx,yy,-1,.95+.2*rise,1);
  waterSplash(ctx,rx,yy,1,.95+.2*rise,1);
  if(f>2.5){
    waterDrop(ctx,lx-10,yy-38,2,Math.max(.2,1-(f-2.5)/1.5));
    waterDrop(ctx,rx+10,yy-38,2,Math.max(.2,1-(f-2.5)/1.5));
  }
}

function waterSideReference(ctx,x,y,p){
  const f=waterFrame(p,4);
  if(p<0){
    const q=holdCharge(p); waterJet(ctx,[x+12,y-38],[x+32+q*12,y-44-q*8],-4,.45+.35*q,5); return;
  }
  if(f<1.45) return;
  const u=Math.max(0,Math.min(1,(f-1)/3));
  const hand=[x+27,y-47];
  const tip=[x+28+u*92,y-47-Math.sin(u*Math.PI)*45];
  // The reference is a short whip that curves upward only at the end.
  const pts=[];
  for(let i=0;i<=18;i++){
    const t=i/18;
    const px=lerp(hand[0],tip[0],t);
    const py=lerp(hand[1],tip[1],t)-Math.sin(t*Math.PI)*22*u;
    pts.push([px,py]);
  }
  waterTrail(ctx,pts,1-.48*Math.max(0,u-.7),8);
  // bright hooked tip at the apex
  if(u>.2){
    waterCrescent(ctx,tip[0]-4,tip[1]+2,16+10*u,-2.5,-.35,.95,5);
  }
  for(let i=0;i<8;i++){
    const t=.45+i*.065; waterDrop(ctx,lerp(hand[0],tip[0],t),lerp(hand[1],tip[1],t)-Math.sin(t*Math.PI)*22*u,1.2,.65*(1-t*.45));
  }
}

function waterUpHeavyReference(ctx,x,y,p){
  const f=waterFrame(p,4);
  if(p<0){
    const q=holdCharge(p); waterCrescent(ctx,x,y-70,58+q*8,-Math.PI*.98,Math.PI*.95,.65+.25*q,8); return;
  }
  const q=Math.max(0,Math.min(1,(f-1)/3));
  if(f<1.6){
    waterCrescent(ctx,x,y-70,52,-Math.PI*.98,Math.PI*.98,.95,10);
  } else if(f<2.5){
    const u=ease((f-1.6)/.9);
    // ribbon twists clockwise from a vertical wrap into a diagonal spiral
    waterCrescent(ctx,x,y-68,54+12*u,-Math.PI*.98+u*.8,Math.PI*.95+u*1.0,1,10);
    waterJet(ctx,[x-12,y-12],[x+42*u,y-96],-28*u,.75,7);
  } else {
    const u=ease((f-2.5)/1.5);
    waterCrescent(ctx,x+12*u,y-72-u*20,66+10*u,-1.95+u*.6,.95+u*.75,1-u*.18,11);
    waterJet(ctx,[x+12,y-18],[x+48+u*48,y-96-u*28],-20,.8,8);
    if(f>3.35){
      for(let i=0;i<12;i++){const a=-1.2+i/11*2.4;waterDrop(ctx,x+58+Math.cos(a)*28,y-132+Math.sin(a)*16,1.5,(f-3.35)/.65*.7);}
    }
  }
}

function waterDownHeavyReference(ctx,x,y,p){
  const f=waterFrame(p,4);
  if(p<0){const q=holdCharge(p);waterSphere(ctx,x+54,y-48,20+q*5,.75+.2*q,q*TAU);return;}
  // Reference: sphere beside fighter -> kicked downward -> ground contact -> upward burst.
  if(f<1.6){
    const u=ease((f-1)/.6); waterSphere(ctx,x+54+u*9,y-50+u*10,22,.95,u*2);
    waterJet(ctx,[x+28,y-28],[x+52,y-46],-8,.75,6);
  } else if(f<2.55){
    const u=ease((f-1.6)/.95), sx=lerp(x+63,x+62,u), sy=lerp(y-40,y-8,u);
    waterSphere(ctx,sx,sy,21,.95,u*3);
    waterTrail(ctx,[[x+60,y-48],[sx,sy]],.65,6);
  } else {
    const u=ease((f-2.55)/1.45), sx=x+62, sy=y-8;
    // First hit: the sphere bursts at the ground.
    waterSphere(ctx,sx,sy,20*(1-u*.75),1-u*.35,u*5);
    for(let i=0;i<12;i++){
      const a=-Math.PI*.9+i/11*Math.PI*.8, rr=18+u*42;
      waterDrop(ctx,sx+Math.cos(a)*rr,sy+Math.sin(a)*rr*.35,1.7,(.55+u*.4)*(1-i/18));
    }
    // Second hit: a concentrated vertical water burst.
    if(f>2.85){
      const rise=ease((f-2.85)/1.15), top=sy-74*rise;
      waterJet(ctx,[sx,sy],[sx,top],-8,.95,10);
      waterCrescent(ctx,sx,top,18+14*rise,-2.7,-.45,.95,5);
      for(let i=0;i<9;i++) waterDrop(ctx,sx+(i-4)*6,top-i*3,1.5,.8*(1-i/12));
    }
  }
}

function waterSideHeavyReference(ctx,x,y,p){
  const f=waterFrame(p,6);
  if(p<0){const q=holdCharge(p);waterCrescent(ctx,x+34,y-52,54+q*10,-1.0,.85,.7+.25*q,11);return;}
  const u=Math.max(0,Math.min(1,(f-1)/5));
  // Frame 1: arm starts. Frame 2: crescent forms. 3-4: blade grows and sweeps.
  // 5: blade rotates. 6: spray/dissipation.
  const sweep=ease(u);
  const cx=x+32+sweep*20, cy=y-50;
  let a=1;
  if(f>5) a=1-(f-5);
  const start=-1.15 + sweep*.18, end=.85 + sweep*1.55;
  waterCrescent(ctx,cx,cy,58+34*Math.sin(Math.min(1,u*1.1)*Math.PI*.75),start,end,Math.max(.15,a),14);
  if(f>=2){
    const tipAng=end, rr=72+22*sweep, tx=cx+Math.cos(tipAng)*rr, ty=cy+Math.sin(tipAng)*rr*.72;
    waterTrail(ctx,[[x+26,y-46],[tx,ty]],.45,5);
    for(let i=0;i<10;i++){
      const t=i/10; waterDrop(ctx,lerp(cx,tx,t),lerp(cy,ty,t)-Math.sin(t*Math.PI)*10,1.4,.6*(1-t*.5));
    }
  }
  if(f>=5){
    for(let i=0;i<14;i++){const ang=end+i*.12, rr=72+(i%4)*7;waterDrop(ctx,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.72,1.4,.6-(i*.025));}
  }
}

function waterAttack(ctx,x,y,p,move){
  if(move==='us'){waterUpReference(ctx,x,y,p);return;}
  if(move==='ds'){waterDownReference(ctx,x,y,p);return;}
  if(move==='ss'){waterSideReference(ctx,x,y,p);return;}
  if(move==='uh'){waterUpHeavyReference(ctx,x,y,p);return;}
  if(move==='dh'){waterDownHeavyReference(ctx,x,y,p);return;}
  if(move==='sh' || move==='heavy'){waterSideHeavyReference(ctx,x,y,p);return;}
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

// Improved supers. They deliberately have no hold state.
function fireSuper(ctx,x,y,p){const c='#FF5A16',hot='#FFB12B',q=attackP(p),a=.2+.8*Math.sin(q*Math.PI); const cx=x+90,cy=y-60; if(q<.45){for(let i=0;i<3;i++)flameShape(ctx,x+(i-1)*22,y-60,22+q*20,hot,a*.7,(i-1)*.35);core(ctx,x+18,y-58,16,c,a);} if(q>.25){const r=20+easeOut((q-.25)/.75)*92; spark(ctx,cx,cy,r*.72,c,a*.65); spark(ctx,cx,cy,r*.32,hot,a); glowArc(ctx,cx,cy,r,r,0,REF_TAU,c,10,a); for(let i=0;i<14;i++){const ang=i/14*REF_TAU; flameShape(ctx,cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,9,hot,a*.75,ang);}}}
function waterSuper(ctx,x,y,p){
  // Seven reference frames: gather -> sphere -> rapid spin -> collapse/explosion
  // -> outward ring -> upward-biased launch -> final ring. The motion is continuous.
  const f=waterFrame(p,7), c='#24BFFF';
  if(p<0){const q=holdCharge(p);waterSphere(ctx,x,y-66,22+q*10,.65+.25*q,q*TAU);waterJet(ctx,[x-22,y-28],[x-6,y-58],-5,.45,5);waterJet(ctx,[x+22,y-28],[x+6,y-58],-5,.45,5);return;}
  const q=Math.max(0,Math.min(1,(f-1)/6));
  const centerY=y-62;
  if(f<2.0){
    const u=ease(f-1); waterJet(ctx,[x-28,y-28],[x-8-u*12,centerY],-10,.7,7); waterJet(ctx,[x+28,y-28],[x+8+u*12,centerY],-10,.7,7); waterSphere(ctx,x,centerY,24+20*u,.9,u*2);
  } else if(f<3.1){
    const u=ease((f-2)/1.1), r=42+26*u;
    waterSphere(ctx,x,centerY,r,1,u*TAU*1.7);
    for(let i=0;i<14;i++){const a=i/14*TAU+u*TAU*1.8;waterDrop(ctx,x+Math.cos(a)*r,y-62+Math.sin(a)*r*.72,1.7,.7);}
  } else if(f<4.15){
    const u=ease((f-3.1)/1.05), r=68+26*u;
    waterSphere(ctx,x,centerY,r,1-u*.15,u*TAU*3.2);
    waterCrescent(ctx,x,centerY,r,-Math.PI*.9,Math.PI*.95,1,9);
    if(u>.45){
      for(let i=0;i<18;i++){const a=i/18*TAU;waterDrop(ctx,x+Math.cos(a)*r*(1+u*.25),centerY+Math.sin(a)*r*.7,1.5,.7);}
    }
  } else if(f<5.1){
    // Collapse inward, then explode outward as the sheet's bright fourth/fifth frame.
    const u=ease((f-4.15)/.95), r=94*(1-u)+18*u;
    waterCrescent(ctx,x,centerY,r,-Math.PI,Math.PI,1,10);
    for(let i=0;i<20;i++){const a=i/20*TAU;const rr=lerp(100,22,u);waterDrop(ctx,x+Math.cos(a)*rr,centerY+Math.sin(a)*rr*.68,1.7,1-u*.4);}
  } else if(f<6.15){
    const u=ease((f-5.1)/1.05), r=22+102*u;
    waterCrescent(ctx,x,centerY,r,-Math.PI,Math.PI,1-u*.15,11);
    for(let i=0;i<22;i++){const a=i/22*TAU;waterDrop(ctx,x+Math.cos(a)*r,centerY+Math.sin(a)*r*.7,1.5,(1-u)*.7+.25);}
  } else {
    const u=ease((f-6.15)/.85), r=124-22*u;
    // Final reference frame is a clean ring with a directional upper launch.
    waterRingMoving(ctx,x,centerY,r,r*.68,.12,u*.8+.2,Math.floor((1-u)*2));
    waterJet(ctx,[x,y-12],[x,y-78-u*38],-10,.7,6);
    for(let i=0;i<10;i++){const a=-Math.PI*.95+i/9*Math.PI*.45;waterDrop(ctx,x+Math.cos(a)*r*.86,centerY+Math.sin(a)*r*.58,1.5,.6*(1-i/14));}
  }
}

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
