import { gen1Phase, getGen1Rig } from './gen1AttackGeometry.js';
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
  const c = '#FFFF44', charge = Math.max(0, Math.min(1, q));
  const a = 0.22 + charge * 0.30;
  if (move === 'us') {
    const cy=y-112,rx=86,ry=34;
    for(let i=0;i<9;i++){const t=i/9*TAU+charge*.3,px=x+Math.cos(t)*rx,py=cy+Math.sin(t)*ry;lineBolt(ctx,px-5,py-5,12+charge*5,13+charge*4,c,a*(.65+.25*Math.sin(i*2)));}
    const theta=-Math.PI/2+charge*TAU;dot(ctx,x+Math.cos(theta)*rx,cy+Math.sin(theta)*ry,5+charge*2,'#FFFFFF',.9);
  } else if (move === 'ds') {
    dot(ctx,x-22,y-45,8+charge*3,'#FFFFFF',.8);dot(ctx,x+22,y-45,8+charge*3,'#FFFFFF',.8);
    dot(ctx,x-22,y-45,5+charge*2,c,.9);dot(ctx,x+22,y-45,5+charge*2,c,.9);
    const r=18+charge*35;for(let i=0;i<7;i++){const t=Math.PI+i/6*Math.PI,px=x+Math.cos(t)*r,py=y-24+Math.sin(t)*r*.6;lineBolt(ctx,px-4,py-3,11,10,c,a*.8);}
  } else if (move === 'ss' || move === 'heavy') {
    const len=move==='heavy'?100:68;for(let i=0;i<5;i++){const t=(i+.5)/5,px=x+24+len*(.15+charge*.75)*t,py=y-50+Math.sin(i*2.2)*5;lineBolt(ctx,px-5,py-5,13+(move==='heavy'?5:0),12+(move==='heavy'?5:0),c,a*(.5+.08*i));}
  } else if (move === 'uh' || move === 'upHeavy') {
    for(const dx of [24,82,140])for(let i=0;i<3;i++)lineBolt(ctx,x+dx-5,y-38-(65+charge*85)+i*26,17,22,c,a*.75);
  } else if (move === 'dh' || move === 'downHeavy') {
    const r=94;for(let i=0;i<10;i++){const t=i/10*TAU,px=x+20+Math.cos(t)*r,py=y-72+Math.sin(t)*r*.6;if(i%2===0)lineBolt(ctx,px-4,py-3,11,13,c,a*.7);}
    const ang=-Math.PI/2+charge*TAU;dot(ctx,x+20+Math.cos(ang)*r,y-72+Math.sin(ang)*r*.6,8,c,.85);
  }
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
  // The orbit is shown by separated, angular lightning chunks instead of a drawn circle.
  if (frame >= 1.75) {
    const traceT = clamp01((frame - 2) / 8.7);
    const visible = Math.max(2, Math.ceil(12 * Math.max(.22, traceT)));
    for (let i=0;i<visible;i++) {
      const a=start+i/12*TAU;
      const px=x+Math.cos(a)*rx, py=cy+Math.sin(a)*ry;
      const side=(i%2?1:-1), len=7+(i%3)*3;
      lineBolt(ctx,px-4,py-3,len,len*.82,c,.58*circleAlpha);
      if(i%3===0) lineBolt(ctx,px+side*4,py+side*2,len*.55,len*.7,'#FFFFFF',.5*circleAlpha);
    }
    dot(ctx, dotX, dotY, frame < 3 ? 6 : 8, '#FFFFFF', .98);
    dot(ctx, dotX, dotY, 5.5, c, 1);
  }

  // Frame 9: upward launch begins while the circle is still completing.
  if (frame >= 9 && frame < 12) {
    const launch = easeOut((frame - 9) / 2.6);
    for (let i = 0; i < 6; i++) {
      const yy = y - 24 - launch * (45 + i * 18);
      lineBolt(ctx,x-12+i*4,yy,12,18,c,(.62-i*.07)*(1-launch*.2));
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
    for (let i=0;i<9;i++) {
      const a=Math.PI+i/8*Math.PI, px=x+Math.cos(a)*r, py=y-24+Math.sin(a)*r;
      lineBolt(ctx,px-4,py-3,12+(i%3)*3,10+(i%2)*4,c,.78*alpha(p));
      if(i%2===0)dot(ctx,px,py,2.8,'#FFFFFF',.78*alpha(p));
    }
  }
}

function thunderSide(ctx, x, y, p, heavy) {
  const c='#FFFF44',len=heavy?100:68,h=heavy?34:24,q=easeOut(p),a=alpha(p);
  // A traveling cluster of forked electric shards and a bright impact node;
  // deliberately not one long horizontal line/laser.
  const pieces=heavy?7:5, travel=len*q;
  for(let i=0;i<pieces;i++){
    const t=(i+.35)/pieces,px=x+24+travel*t,py=y-50+Math.sin(i*2.35+p*3)*h*.22;
    const size=(heavy?12:9)*(0.75+.25*Math.sin(i*1.7));
    lineBolt(ctx,px-size*.45,py-size*.35,size*1.55,size*1.6,c,a*(.55+.35*t));
    if(i%2===0)lineBolt(ctx,px-size*.25,py+size*.35,size*.9,size*1.15,'#FFFFFF',a*.6);
  }
  const tipX=x+24+travel,tipY=y-50+Math.sin(p*TAU)*h*.16;
  dot(ctx,tipX,tipY,heavy?9:7,'#FFFFFF',.95*a);dot(ctx,tipX,tipY,heavy?6:4.5,c,a);
  if(p>.28){for(let i=0;i<(heavy?5:3);i++){const side=i%2?1:-1;lineBolt(ctx,tipX-side*(i+1)*5,tipY+side*(i+1)*3,10+i*2,12+i*2,c,.72*a);}}
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
  for(let i=0;i<12;i++){const aa=i/12*TAU,bx0=x+20+Math.cos(aa)*r,by0=y-72+Math.sin(aa)*r*.6;if(i%2===0)lineBolt(ctx,bx0-4,by0-3,10,12,c,.34*a);}
  const bx = x + 20 + Math.cos(ang) * r, by = y - 72 + Math.sin(ang) * r * .6;
  dot(ctx, bx, by, 13, c, a);
  for (let i = 1; i <= 5; i++) dot(ctx, bx - Math.cos(ang) * i * 12, by - Math.sin(ang) * i * 7, Math.max(2, 8 - i), c, a * (.5 - i * .07));
}

function thunderSuper(ctx, x, y, p) {
  const c='#FFFF44',white='#FFFFFF',q=clamp01(p),gather=ease(clamp01(q/.25)),route=ease(clamp01((q-.18)/.48)),converge=ease(clamp01((q-.62)/.20)),finish=ease(clamp01((q-.82)/.18));
  // Six independent jagged discharges trace a broad route around the fighter,
  // then fold into one focused impact at the far end of the route.
  const centerX=x+35+route*210,centerY=y-62-10*Math.sin(route*Math.PI);
  for(let i=0;i<6;i++){
    const ang=i/6*TAU+q*1.2,r=32+route*95;
    const sx=x+Math.cos(ang)*r*.55,sy=y-52+Math.sin(ang)*r*.34;
    const ex=lerp(sx,centerX,converge),ey=lerp(sy,centerY,converge);
    for(let k=0;k<3;k++){const t=(k+.5)/3,px=lerp(sx,ex,t),py=lerp(sy,ey,t)+Math.sin(t*TAU+i)*7;lineBolt(ctx,px-6,py-7,14+4*route,19+5*route,c,(.5+.32*route)*(1-finish*.35));}
    if(i%2===0)lineBolt(ctx,ex-4,ey-5,12,15,white,.68*(1-finish*.25));
  }
  if(q<.3){for(let i=0;i<5;i++)lineBolt(ctx,x-18+i*9,y-52-8*gather,11+gather*5,17+gather*7,c,.65+.2*gather);}
  if(q>.58){const r=18+finish*62;for(let i=0;i<14;i++){const ang=i/14*TAU,px=centerX+Math.cos(ang)*r,py=centerY+Math.sin(ang)*r*.72;lineBolt(ctx,px-5,py-6,13+finish*6,17+finish*8,i%3===0?white:c,(.6+.3*finish)*(1-finish*.15));}dot(ctx,centerX,centerY,8+finish*12,white,.95);dot(ctx,centerX,centerY,5+finish*8,c,.95);}
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
  if (!FIRE_PERF_MODE && !WATER_PERF_MODE) { ctx.shadowColor=c; ctx.shadowBlur=Math.max(8,w*2.5); } else { ctx.shadowBlur=0; } ctx.beginPath();
  pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke(); ctx.restore();
}
function glowArc(ctx, x,y,rx,ry,a0,a1,c,w,a=1,rot=0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; if (!FIRE_PERF_MODE && !WATER_PERF_MODE) { ctx.shadowColor=c; ctx.shadowBlur=Math.max(10,w*2.5); } else { ctx.shadowBlur=0; }
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,a0,a1); ctx.stroke(); ctx.restore();
}
function core(ctx,x,y,r,c,a=1){ spark(ctx,x,y,r,'#fff',a*.85); spark(ctx,x,y,r*.58,c,a); }
function flameShape(ctx,x,y,r,c,a=1,rot=0){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=a; ctx.fillStyle=c; if (!FIRE_PERF_MODE && !WATER_PERF_MODE) { ctx.shadowColor=c; ctx.shadowBlur=18; } else { ctx.shadowBlur=0; }
  ctx.beginPath(); ctx.moveTo(0,-r); ctx.bezierCurveTo(r*.75,-r*.15,r*.65,r*.55,0,r); ctx.bezierCurveTo(-r*.75,r*.5,-r*.5,-r*.05,0,-r); ctx.fill();
  ctx.fillStyle='#FFF3B0'; ctx.globalAlpha*=.75; ctx.beginPath(); ctx.moveTo(0,-r*.55); ctx.bezierCurveTo(r*.28,-r*.05,r*.25,r*.35,0,r*.52); ctx.bezierCurveTo(-r*.25,r*.3,-r*.18,-r*.05,0,-r*.55); ctx.fill(); ctx.restore();
}
function waterRing(ctx,x,y,rx,ry,c,a=1,rot=0){
  // Broken crest made from overlapping droplets and rounded water lobes, not a line ring.
  const n=10;
  for(let i=0;i<n;i++){
    const t=i/n*REF_TAU+rot, wob=1+.08*Math.sin(i*2.4+rot);
    const px=x+Math.cos(t)*rx*wob,py=y+Math.sin(t)*ry*wob;
    waterDrop(ctx,px,py,2.8+(i%3)*.8,a*.7,t+.35);
    waterOrb(ctx,px,py,3.5+(i%2),a*.36,rot+i*.4);
  }
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
  // Fire is drawn as separated, overlapping flame tongues—not an outlined ring.
  // The negative space between tongues keeps the effect organic rather than a neon circle.
  const count=FIRE_PERF_MODE ? 7 : 13;
  for(let i=0;i<count;i++){
    const t=i/count*REF_TAU+rot;
    const wob=1+.10*Math.sin(i*2.71+seed)+.05*Math.sin(i*5.17-seed*.6);
    const fx=cx+Math.cos(t)*rx*wob, fy=cy+Math.sin(t)*ry*wob;
    const r=(FIRE_PERF_MODE?4.4:6.2)*(0.82+.24*Math.sin(i*1.9+seed));
    flameShape(ctx,fx,fy,r,c,a*(.72+.2*Math.sin(i*2.1+seed)),t+Math.PI/2);
    if(i%2===0) flameShape(ctx,fx+Math.cos(t)*r*.55,fy+Math.sin(t)*r*.45,r*.55,'#FFF0A0',a*.65,t+Math.PI/2);
  }
}
function fireBlob(ctx,cx,cy,r,c='#FF5A16',a=1,seed=0){
  // Lopsided fireball with flame lobes, matching the reference rather than a circle.
  const n=FIRE_PERF_MODE ? 10 : 14, pts=[];
  for(let i=0;i<n;i++){
    const t=i/n*REF_TAU;
    const wob=1+.14*Math.sin(i*2.13+seed)+.07*Math.sin(i*4.7-seed);
    pts.push([cx+Math.cos(t)*r*wob,cy+Math.sin(t)*r*.82*wob]);
  }
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;if(!FIRE_PERF_MODE){ctx.shadowColor=c;ctx.shadowBlur=24;}else ctx.shadowBlur=0;ctx.beginPath();
  pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();ctx.restore();
  const inner=Math.max(4,r*.45);
  ctx.save();ctx.globalAlpha=a*.72;ctx.fillStyle='#FFF0A0';if(!FIRE_PERF_MODE){ctx.shadowColor='#FFB12B';ctx.shadowBlur=18;}else ctx.shadowBlur=0;ctx.beginPath();ctx.arc(cx-r*.08,cy-r*.08,inner,0,REF_TAU);ctx.fill();ctx.restore();
  for(let i=0;i<(FIRE_PERF_MODE ? 4 : 7);i++){
    const count=FIRE_PERF_MODE ? 4 : 7;
    const t=-2.7+i*(FIRE_PERF_MODE ? .42 : .22);
    flameShape(ctx,cx+Math.cos(t)*r*.8,cy+Math.sin(t)*r*.62,r*(.18+.03*(i%3)), '#FF9A22',a*.8,t+Math.PI/2);
  }
}
function fireRock(ctx,x,y,scale=1,a=1,phase=0){
  const r=11*scale;
  ctx.save();ctx.translate(x,y);ctx.rotate(.18*Math.sin(phase));ctx.globalAlpha=a;
  ctx.fillStyle='#49352B';ctx.shadowColor='#FF5A16';ctx.shadowBlur=13;
  ctx.beginPath();ctx.moveTo(-r*.95,-r*.25);ctx.lineTo(-r*.48,-r*.92);ctx.lineTo(r*.34,-r*.78);ctx.lineTo(r,-r*.18);ctx.lineTo(r*.72,r*.62);ctx.lineTo(-r*.12,r);ctx.lineTo(-r*.85,r*.48);ctx.closePath();ctx.fill();
  ctx.fillStyle='#FF5A16';ctx.beginPath();ctx.moveTo(-r*.5,-r*.52);ctx.lineTo(-r*.08,-r*.22);ctx.lineTo(-r*.32,r*.28);ctx.lineTo(-r*.56,r*.08);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(r*.18,-r*.54);ctx.lineTo(r*.55,-r*.12);ctx.lineTo(r*.28,r*.42);ctx.lineTo(r*.05,r*.06);ctx.closePath();ctx.fill();
  ctx.fillStyle='#FFD15A';ctx.beginPath();ctx.ellipse(-r*.08,-r*.12,r*.16,r*.3,-.3,0,TAU);ctx.fill();ctx.restore();
  for(let i=0;i<5;i++){const ang=phase+i/5*TAU,dist=r*(.85+(i%2)*.22);flameShape(ctx,x-Math.cos(ang)*dist,y-Math.sin(ang)*dist*.65,4.5*scale*(.8+(i%3)*.1),i%2?'#FF9A22':'#FF5A16',a*.9,ang+Math.PI/2);}
}

function fireRay(ctx,x,y,angle,len,a=1,hot='#FF9A22'){
  // A short chain of overlapping flame lobes reads as fire, never as a stroked line.
  const ux=Math.cos(angle), uy=Math.sin(angle), count=Math.max(2,Math.min(6,Math.ceil(len/10)));
  for(let i=0;i<count;i++){
    const t=(i+.5)/count, r=(2.5+3.8*Math.sin(t*Math.PI))*(1-.42*t);
    flameShape(ctx,x+ux*len*t,y+uy*len*t,r,i%2?hot:'#FF5A16',a*(1-.25*t),angle+Math.PI/2);
    if(i%2===0) flameShape(ctx,x+ux*len*t,y+uy*len*t-r*.15,r*.45,'#FFF0A0',a*.72,angle+Math.PI/2);
  }
}
function fireLineBurstLegacy(ctx,x,y,r,alpha=1){ fireLineBurst(ctx,x,y,r,alpha,0); }
function fireLineBurst(ctx,x,y,r,alpha=1,phase=0){
  // Short jagged flame rays radiating from the impact point.
  const count=7;
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
  const n=FIRE_PERF_MODE ? 12 : 18, pts=[];
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
  const count=7;
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

function fireAttack(ctx,x,y,p,move,attack=null){
  const prev=FIRE_PERF_MODE; FIRE_PERF_MODE=true;
  try {
    const duration=Math.max(1, Number(attack?.duration)||1);
    const elapsed=p<0 ? 0 : clamp01(p)*duration;
    const start=Number(attack?.startupFrames ?? ({us:14,ds:15,ss:20,uh:18,dh:24,sh:36,recovery:7,groundPound:20,super:30}[move]||10));
    const active=Number(attack?.activeFrames ?? ({us:4,ds:4,ss:12,uh:7,dh:8,sh:14,recovery:6,groundPound:8,super:15}[move]||4));
    const hold=p<0, q=hold ? Math.max(0,Math.min(1,-p-1)) : clamp01(elapsed/Math.max(1,duration));
    const wind=hold ? q : ease(clamp01(elapsed/Math.max(1,start)));
    const contact=hold ? 0 : clamp01((elapsed-start)/Math.max(1,active));
    const recovery=hold ? 0 : ease(clamp01((elapsed-start-active)/Math.max(1,duration-start-active)));
    const hot='#FF9A22', core='#FF5A16', white='#FFF3B0', dark='#541006';
    const flameAt=(fx,fy,r,a=1,angle=0)=>flameShape(ctx,fx,fy,r,hot,a,angle);
    const sparks=(cx,cy,n,r,a,phase=0)=>{for(let i=0;i<n;i++){const ang=i/n*REF_TAU+phase;const rr=r*(.45+.55*((i*7)%n)/Math.max(1,n));flameAt(cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.62,3+(i%3),a*(.45+.4*((i%4)/4)),ang+Math.PI/2);}};
    const slash=(pts,w,a,c=hot)=>{
      // Convert the requested strike path into a filled, irregular flame plume.
      // There is no stroked path: the outline is made from overlapping lobes.
      if(!pts||pts.length<2||a<=0)return;
      for(let i=0;i<pts.length;i++){
        const pt=pts[i],prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)];
        const dx=next[0]-prev[0],dy=next[1]-prev[1],ang=Math.atan2(dy,dx)+Math.PI/2;
        const taper=Math.sin((i+1)/(pts.length+1)*Math.PI);
        const r=Math.max(2,w*(.18+.38*taper));
        flameShape(ctx,pt[0],pt[1],r,c,a*(.62+.28*taper),ang);
        if(i<pts.length-1){const mid=[(pt[0]+next[0])*.5,(pt[1]+next[1])*.5];flameShape(ctx,mid[0],mid[1],r*.8,c,a*.58,ang);}
        if(i%2===0)flameShape(ctx,pt[0]+Math.cos(ang)*r*.45,pt[1]+Math.sin(ang)*r*.45,r*.48,white,a*.55,ang);
      }
    };
    const groundCrack=(cx,cy,spread,a)=>{for(const side of [-1,1]){const pts=[[cx,cy],[cx+side*spread*.28,cy-2],[cx+side*spread*.48,cy+5],[cx+side*spread*.72,cy+1],[cx+side*spread,cy+6]];slash(pts,5,a,core);}};

    if(move==='us'){
      // Fire Hero's Rising: a burning rock is actually thrown diagonally upward,
      // then follows a readable gravity arc; it is not a vertical flame geyser.
      const sx=26,sy=-54;
      if(hold){fireRock(ctx,sx,sy,1+q*.32,.72+q*.25,q*2);fireRing(ctx,sx,sy,12+q*5,8+q*3,hot,.42+q*.25,q);return;}
      const t=clamp01(elapsed/Math.max(1,start+active+8));
      if(elapsed<start*.62){const u=ease(elapsed/Math.max(1,start*.62));fireRock(ctx,sx-5*u,sy+4*u,.82+.22*u,.78,q*4);}
      else if(elapsed<start+active+8){const travel=ease(clamp01((elapsed-start*.62)/Math.max(1,duration-start*.62)));const rx=26+travel*72,ry=-54-travel*74+travel*travel*38;fireRock(ctx,rx,ry,1.02-.12*travel,.98-.25*travel,travel*5);for(let i=0;i<4;i++){const back=travel*(i+1)/5;flameShape(ctx,rx-11-back*12,ry+5+back*7,5.5-back*1.5,i%2?hot:core,.7*(1-back),Math.PI*.72);}}
      if(elapsed>=start&&elapsed<start+active){const u=contact,rx=26+u*72,ry=-54-u*74+u*u*38;fireBlob(ctx,rx,ry,9+4*Math.sin(u*Math.PI),hot,.45,u*3);}
      if(elapsed>=start+active){const fade=1-recovery;const rx=98,ry=-90;fireRock(ctx,rx,ry,.72,.58*fade,recovery*3);for(let i=0;i<5;i++)flameShape(ctx,rx+(i-2)*7,ry+9,4,hot,.45*fade,(i-2)*.2);}
    } else if(move==='ds'){
      // Quake: stamp, retreat, then delayed eruption at the original footprint.
      const ox=24, oy=-2;
      if(hold){fireBlob(ctx,ox,oy,5+q*4,dark,.3+q*.25,q);return;}
      if(elapsed<start){const t=wind;slash([[14,-2],[22,2],[29,-1]],2,.25+t*.35,hot);flameAt(22,-7,5+t*3,.25+t*.2,Math.PI);}
      else if(elapsed<start+2){const t=clamp01((elapsed-start)/2);groundCrack(ox,oy,22+12*t,.75);fireLineBurstLite(ctx,ox,oy,18+10*t,.72,t*3);}
      else if(elapsed<start+8){const t=clamp01((elapsed-start-2)/6);slash([[18,-3],[12,-5],[6,-2]],2,.28*(1-t),hot);flameAt(ox-8,-5,4,.28*(1-t),Math.PI);}
      else if(elapsed<start+10){const t=clamp01((elapsed-start-8)/2);groundCrack(ox,oy,40+18*t,.95);fireLineBurstLite(ctx,ox,oy,42+22*t,.95,t*5);for(let i=0;i<5;i++)flameAt(ox+(i-2)*17,oy-4-(i%3)*5,5,.85,(i-2)*.18);}
      else {const t=recovery;const delayed=ease(clamp01((elapsed-start-10)/Math.max(1,duration-start-10)));groundCrack(ox,oy,58*(1-delayed*.45),.5*(1-delayed));if(delayed<.8){fireLineBurstLite(ctx,ox,oy,60-20*delayed,.45*(1-delayed),delayed*6);}}
    } else if(move==='ss'){
      // Wave: low forward roll, then close pop-up strike; fire follows the limb path.
      if(hold){fireRing(ctx,30,-36,9+q*5,6+q*3,hot,.25+q*.25,-q);return;}
      if(elapsed<start){
        // Readable crouch-and-roll windup: the body/fire coil travels gradually, not in a snap.
        const t=ease(elapsed/Math.max(1,start));
        ctx.save();ctx.translate(8+22*t,-10+8*t);ctx.rotate(-t*1.15);
        fireRing(ctx,0,0,11+5*t,7+3*t,hot,.35+t*.35,t*2);flameAt(0,-7,6+3*t,.65,-t);ctx.restore();
        slash([[12,-13],[19,-20],[25,-24]],3,.25+t*.35,hot);
      }
      else if(elapsed<start+active){
        // The pop-up strike visibly sweeps through a long, smooth arc over 12 frames.
        const t=contact, hx=22+53*ease(t), hy=-22-39*Math.sin(t*Math.PI*.82);
        slash([[12,-14],[21,-24],[hx*.62,hy*.72],[hx,hy]],10,.72,core);
        slash([[12,-14],[21,-24],[hx*.62,hy*.72],[hx,hy]],3,1,white);
        fireBlob(ctx,hx,hy,11+7*Math.sin(t*Math.PI),core,.98,t*4);
        for(let i=0;i<4;i++)flameAt(20+(hx-20)*(i+1)/5,hy*(i+1)/5,5,.8,(i-1.5)*.2);
      } else {const t=recovery;slash([[72,-56],[62,-49],[52,-40]],4,.28*(1-t));sparks(58,-45,4,17,.42*(1-t),t*2);}
    } else if(move==='uh'||move==='upHeavy'){
      // Ascendant Breaker: crouch-vault, shoulder through centerline, fire trails behind.
      if(hold){fireRing(ctx,2,-48,20+q*8,7+q*4,hot,.22+q*.3,0);return;}
      if(elapsed<start){const t=wind;fireRing(ctx,0,-30,17*(1-t*.4),8*(1-t*.4),hot,.25+t*.3,t);flameAt(-13,-13,5,.4+t*.25,-.7);flameAt(-4,-20,6,.4+t*.25,-.7);}
      else if(elapsed<start+active){const t=contact;const cx=10+12*t,cy=-78-25*t;fireRing(ctx,cx,cy,28+10*t,15+5*t,core,.9,t*REF_TAU);fireBlob(ctx,cx,cy,15,hot,1,t*4);slash([[-35,-14],[-23,-32],[-10,-54],[cx-8,cy+7]],14,.8,core);slash([[-30,-14],[-18,-32],[-6,-54],[cx-8,cy+7]],4,1,white);for(let i=0;i<8;i++)flameAt(-28+i*6,-17-i*8,5,.85,Math.PI*.8);}
      else {const t=recovery;fireRing(ctx,12,-92,36*(1-t),16*(1-t),hot,.5*(1-t),t);sparks(-12,-48,7,30,.5*(1-t),t*2);}
    } else if(move==='dh'||move==='downHeavy'){
      // Sunder Slam: toe-rise, brace, two-footed impact, outward ground wave.
      const ox=20,oy=-1;
      if(hold){fireRing(ctx,ox,oy,13+q*8,5+q*3,hot,.18+q*.25,q);return;}
      if(elapsed<start){const t=wind;flameAt(ox-8,-7,5,.35+t*.3,Math.PI);flameAt(ox+8,-7,5,.35+t*.3,Math.PI);fireRing(ctx,ox,oy,12+8*t,5+3*t,hot,.25+t*.2,0);}
      else if(elapsed<start+active){const t=contact;fireBlob(ctx,ox,oy,12+8*t,core,1,t*4);groundCrack(ox,oy,30+45*t,1);fireLineBurstLite(ctx,ox,oy,30+42*t,.9,t*5);}
      else {const t=recovery;const r=80+18*t;slash([[ox-r,oy+5],[ox-r*.55,oy+2],[ox,oy+4],[ox+r*.55,oy+2],[ox+r,oy+5]],4,.5*(1-t),hot);for(let i=0;i<8;i++)flameAt(ox+(i-3.5)*19,oy+2,4,.45*(1-t),Math.PI);}
    } else if(move==='sh'||move==='heavy'){
      // Rend Strike: visible retreat, sudden palm thrust, trace snaps off at contact.
      const hx=48,hy=-45;
      if(hold){fireBlob(ctx,hx,hy,8+q*12,hot,.3+q*.3,q);return;}
      if(elapsed<start){
        // A clear, held-back palm: gradual recoil and visible fire gathering at the hand.
        const t=ease(elapsed/Math.max(1,start));
        slash([[hx-4,-42],[hx-13-13*t,-39],[hx-20-15*t,-31]],4,.42+t*.25,hot);
        fireBlob(ctx,hx-8-16*t,hy,6+5*t,hot,.48+t*.3,t);
        fireRing(ctx,hx-13-11*t,hy,8+5*t,5+3*t,hot,.25+t*.22,-t);
      }
      else if(elapsed<start+active){
        // Slow, readable palm extension: flame core advances in measured steps over 14 frames.
        const t=contact, extension= ease(t), tx=hx+20+48*extension;
        slash([[hx-5,hy],[hx+5,hy-1],[hx+20+18*extension,hy-2],[tx,hy-4]],14,.78,core);
        slash([[hx-2,hy],[hx+8,hy-1],[hx+24+18*extension,hy-2],[tx,hy-4]],4.5,1,white);
        fireBlob(ctx,tx,hy-4,13+8*Math.sin(t*Math.PI),hot,1,t*4);
        for(let i=0;i<5;i++){const along=(i+1)/6;flameAt(hx+12+(tx-hx-12)*along,hy-4+(i-2)*3,4.5,.82,(i-2)*.14);}
      } else {const t=recovery;slash([[hx+60,-48],[hx+43,-47],[hx+25,-43]],6,.38*(1-t),hot);sparks(hx+40,-48,4,19,.4*(1-t),t);}
    } else if(move==='recovery'){
      // Return Return: roll through, two uneven pulses, upward rebound.
      if(hold){fireRing(ctx,0,-45,12+q*6,8+q*4,hot,.2+q*.25,q);return;}
      if(elapsed<start){const t=wind;ctx.save();ctx.translate(-10+20*t,-36-8*t);ctx.rotate(t*REF_TAU);fireRing(ctx,0,0,15,10,hot,.55,t*REF_TAU);ctx.restore();}
      else if(elapsed<start+active){const t=contact;fireRing(ctx,16,-42,18,12,hot,.9,t*REF_TAU);fireBlob(ctx,18,-42,10,core,1,t*4);fireRing(ctx,20,-70,12+10*t,7+6*t,hot,.8,t*REF_TAU);}
      else {const t=recovery;fireRing(ctx,20,-88-18*t,20*(1-t*.6),12*(1-t*.6),hot,.65*(1-t*.35),t*3);fireBlob(ctx,20,-90-20*t,8*(1-t*.4),core,.8*(1-t*.3),t*4);for(let i=0;i<6;i++)flameAt(20+(i-2.5)*6,-75-i*7,4,.55*(1-t),(i-3)*.15);}
    } else if(move==='groundPound'){
      // Meteor Pound: tucked corkscrew drill, strongest at the final rotation, landing wave.
      if(hold){fireRing(ctx,0,-38,11+q*5,8+q*3,hot,.2+q*.2,q);return;}
      if(elapsed<start){const t=wind;ctx.save();ctx.translate(0,-34-15*t);ctx.rotate(t*REF_TAU*1.5);fireRing(ctx,0,0,16+8*t,10+4*t,hot,.5+t*.2,t*3);for(let i=0;i<4;i++)flameAt(Math.cos(i*TAU/4)*12,Math.sin(i*TAU/4)*8,5,.6,i*TAU/4);ctx.restore();}
      else if(elapsed<start+active){const t=contact;ctx.save();ctx.translate(0,-25+18*t);ctx.rotate(t*REF_TAU*1.5);fireRing(ctx,0,0,20+12*t,12+8*t,core,.9,t*4);fireBlob(ctx,0,0,11+5*t,hot,1,t*6);ctx.restore();}
      else {const t=recovery;const r=20+60*ease(clamp01((elapsed-start-active)/Math.max(1,duration-start-active)));fireRing(ctx,0,-2,r,r*.28,hot,.75*(1-t*.55),t*2);groundCrack(0,0,r,.7*(1-t*.5));for(let i=0;i<8;i++)flameAt(Math.cos(i*TAU/8)*r,Math.sin(i*TAU/8)*r*.25,5,.6*(1-t),i*TAU/8);}
    }
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
function grassBoulder(ctx,cx,cy,r,alpha=1,cracked=false){
  const pts=[];for(let i=0;i<11;i++){const a=-Math.PI/2+i/11*TAU,rr=r*(.84+.16*Math.sin(i*4.7+1.2));pts.push([cx+Math.cos(a)*rr*1.12,cy+Math.sin(a)*rr*.78]);}
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#315B25';ctx.shadowColor='#7CFF28';ctx.shadowBlur=14;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();
  ctx.globalAlpha=alpha*.9;ctx.fillStyle='#72B83A';ctx.beginPath();ctx.moveTo(cx-r*.58,cy-r*.08);ctx.lineTo(cx-r*.18,cy-r*.66);ctx.lineTo(cx+r*.48,cy-r*.5);ctx.lineTo(cx+r*.72,cy+r*.02);ctx.lineTo(cx+r*.12,cy+r*.32);ctx.closePath();ctx.fill();
  ctx.globalAlpha=alpha*.8;ctx.fillStyle='#A9ED5C';ctx.beginPath();ctx.ellipse(cx-r*.13,cy-r*.23,r*.32,r*.12,-.45,0,TAU);ctx.fill();ctx.restore();
  if(cracked){for(let i=0;i<5;i++){const a=-.7+i*.34,px=cx+Math.cos(a)*r*.45,py=cy+Math.sin(a)*r*.35;fillPoly(ctx,[[px,py],[px+4,py+7],[px+1,py+13]],'#203E1C',alpha*.95,null);}}
}
function grassSideReference(ctx,x,y,p){
  const q=attackP(p),cx=x+52,cy=y-43;
  if(p<0){const h=holdCharge(p);grassBoulder(ctx,cx,cy,19+12*h,.58+.32*h,false);for(let i=0;i<3;i++)leafBlade(ctx,cx-14+i*12,cy-18,4,10,-.5+i*.5,'#A8FF38',.65);return;}
  const f=1+q*4;
  if(f<2){const u=ease(f-1);grassBoulder(ctx,cx,cy,18+13*u,.82+.18*u,false);}
  else if(f<3){const u=ease(f-2);grassBoulder(ctx,cx+u*4,cy,31,.98,true);}
  else if(f<3.45){const u=ease((f-3)/.45);grassBoulder(ctx,cx+8*u,cy,31*(1-u*.35),1-u*.5,true);}
  else {const u=ease((f-3.45)/.55);for(let i=0;i<9;i++){const a=i/9*TAU,dist=12+u*(28+(i%3)*8),sx=cx+8+Math.cos(a)*dist,sy=cy+Math.sin(a)*dist*.72;fillPoly(ctx,[[sx,sy-7],[sx+7,sy-1],[sx+3,sy+7],[sx-5,sy+3]],i%2?'#72B83A':'#A9ED5C',1-u*.25,null);spark(ctx,sx,sy,1.8,'#E4FF9C',.6*(1-u));}}
}
function grassUpHeavyReference(ctx,x,y,p){
  if(p<0){ const q=holdCharge(p); grassFlower(ctx,x,y-18,q*.35,.75+.2*q,.55+.3*q,q*2); return; }
  const f=1+attackP(p)*3;
  if(f<2){ const u=ease(f-1); grassFlower(ctx,x,y-8,u*.35,.6+.35*u,.7,u); }
  else if(f<3){ const u=ease(f-2); grassFlower(ctx,x,y-20,.35+.65*u,1,.95,u*2); }
  else { const u=ease(f-3); grassFlower(ctx,x,y-20,1,1,.98,u*2); for(let i=0;i<10;i++){const a=i/10*TAU; const rr=45+45*u; leafBlade(ctx,x+Math.cos(a)*rr,y-20+Math.sin(a)*rr*.7,8,24,a,'#A8FF38',.8*(1-u*.2));} }
}
function grassDownHeavyReference(ctx,x,y,p,hit=false,facing=1){
  const wood='#9B6A3B', hi='#D6A35B', leaf='#7CFF28';
  if(p<0){const h=holdCharge(p);grassBranch(ctx,x+16,y-48,48+10*h,11,.65+.2*h,0.72,false);return;}
  const q=attackP(p), f=1+q*3;
  // Initial stick: comes down diagonally in the direction faced.
  const diagAngle=facing>0 ? .82 : 2.32;
  if(f<2){
    const u=ease(f-1), len=28+62*u;
    grassBranch(ctx,x+14,y-48,len,11,.85,diagAngle,false);
  } else if(f<2.35){
    const u=ease((f-2)/.35), len=90+8*u;
    grassBranch(ctx,x+14,y-48,len,11,1,diagAngle,false);
    for(let i=0;i<5;i++) spark(ctx,x+14+Math.cos(diagAngle)*(len-8)+i*2*facing,y-48+Math.sin(diagAngle)*(len-8),1.5,hi,.55);
  } else if(hit){
    // Once the first stick connects, a second stick grows out of its tip toward
    // the knockback direction — behind the Grass Hero.
    const tipX=x+14+Math.cos(diagAngle)*98, tipY=y-48+Math.sin(diagAngle)*98;
    grassBranch(ctx,x+14,y-48,98,11,.9,diagAngle,false);
    const u=ease(Math.min(1,(f-2.35)/.65));
    const backAngle=facing>0 ? 3.05 : .09;
    grassBranch(ctx,tipX,tipY,62*u,10,.98,backAngle,false);
    if(u>.25) for(let i=0;i<5;i++) spark(ctx,tipX+Math.cos(backAngle)*(42*u+i*3),tipY+Math.sin(backAngle)*(42*u+i*3),1.5,leaf,.55);
  } else {
    // Miss/recovery: retract the first stick without creating the follow-up branch.
    const u=ease((f-2.35)/.65), len=98*(1-u*.72);
    grassBranch(ctx,x+14,y-48,len,11,.9,diagAngle,false);
  }
}
function grassSideHeavyReference(ctx,x,y,p){
  const c='#7CFF28',wood='#9B6A3B',hi='#D6A35B';
  if(p<0){ const q=holdCharge(p); grassBranch(ctx,x+18,y-46,55+30*q,14,.6+q*.25,0,false); return; }
  const f=1+attackP(p)*3;
  if(f<2){ const u=ease(f-1); grassBranch(ctx,x+18,y-46,70*u,14,.85,0,false); }
  else if(f<3){ const u=ease(f-2); grassBranch(ctx,x+18,y-46,70+55*u,14,.98,0,false); for(let i=0;i<4;i++) spark(ctx,x+88+i*10,y-46+(i-2)*3,1.5,hi,.6); }
  else { const u=ease(f-3), sx=x+143,sy=y-46; grassBranch(ctx,x+18,y-46,125,14,.92,0,true); for(const da of [-.32,0,.32]){const len=40+55*u; grassBranch(ctx,sx,sy,len,7,.9,da,false);} }
}
function grassAttack(ctx,x,y,p,move,attack){
  if(move==='us')return grassUpReference(ctx,x,y,p);
  if(move==='ds')return grassDownReference(ctx,x,y,p);
  if(move==='ss')return grassSideReference(ctx,x,y,p);
  if(move==='uh')return grassUpHeavyReference(ctx,x,y,p);
  if(move==='dh')return grassDownHeavyReference(ctx,x,y,p,!!attack?.hitApplied,1);
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
function iceLargeIcicle(ctx,x,y,w=18,h=58,angle=0,a=1){
  const c='#79DFFF',white='#EFFFFF';
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=a;ctx.fillStyle=c;ctx.strokeStyle=white;ctx.lineWidth=1.5;ctx.shadowColor=c;ctx.shadowBlur=22;
  ctx.beginPath();ctx.moveTo(0,-h);ctx.lineTo(w*.55,-h*.28);ctx.lineTo(w*.42,h*.35);ctx.lineTo(0,h*.58);ctx.lineTo(-w*.5,h*.2);ctx.lineTo(-w*.62,-h*.3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.globalAlpha=a*.55;ctx.strokeStyle=white;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w*.18,-h*.65);ctx.lineTo(w*.08,h*.35);ctx.lineTo(-w*.05,h*.5);ctx.stroke();ctx.restore();
}
function iceCrystal(ctx,x,y,scale,a=1,phase=0){
  const c='#79DFFF',white='#EFFFFF';
  for(let i=0;i<7;i++){const ang=-Math.PI/2+(i-3)*.18; const rr=(28+Math.abs(i-3)*8)*scale; shard(ctx,x+Math.cos(ang)*rr*.35,y+Math.sin(ang)*rr*.15,11*scale,28*scale,ang,c,a*.92);}
  spark(ctx,x,y,8*scale,white,a*.7);
  for(let i=0;i<10;i++){const ang=i/10*TAU+phase; spark(ctx,x+Math.cos(ang)*34*scale,y+Math.sin(ang)*24*scale,1.5,c,a*.55);}
}
function iceUpReference(ctx,x,y,p){
  const c='#79DFFF',white='#EFFFFF';
  if(p<0){const h=holdCharge(p);iceShard(ctx,x,y-94,11+2*h,27+5*h,-.1,c,.65+.3*h);return;}
  const f=1+attackP(p)*5;
  if(f<2){const u=ease(f-1);iceShard(ctx,x+2*u,y-92-5*u,12,30,-.15-u*.35,c,1);}
  else if(f<3){const u=ease(f-2),sx=lerp(x+4,x+10,u),sy=lerp(y-97,y-122,u),rot=-.5+u*TAU;iceShard(ctx,sx,sy,13,32,rot,c,1);spark(ctx,sx,sy,4,white,.75);}
  else if(f<4.3){const u=ease((f-3)/1.3),sx=lerp(x+10,x+26,u),sy=lerp(y-122,y-148,u),rot=.8+u*1.3;iceShard(ctx,sx,sy,13,32,rot,c,1);for(let i=0;i<6;i++)spark(ctx,sx-i*3,sy+i*4,1.4,c,.45);}
  else {const u=ease((f-4.3)/.7),sx=lerp(x+26,x+35,u),sy=lerp(y-148,y-166,u),rot=2.1+u*.5;iceShard(ctx,sx,sy,13,31,rot,c,1-u*.3);for(let i=0;i<7;i++)spark(ctx,sx-i*3,sy+i*3,1.5,c,.5*(1-u));}
}
function iceDownReference(ctx,x,y,p){
  const c='#79DFFF',white='#EFFFFF';
  if(p<0){const h=holdCharge(p);iceLargeIcicle(ctx,x+42,y-76,18+3*h,54+10*h,0,.6+.3*h);return;}
  const f=1+attackP(p)*5;
  if(f<2){const u=ease(f-1);iceLargeIcicle(ctx,x+42,y-78,19,58,-.02*u,1);}
  else if(f<3){const u=ease(f-2);iceLargeIcicle(ctx,x+42,y-78+42*u,20,62,.04*u,1);}
  else if(f<4){const u=ease(f-3);iceLargeIcicle(ctx,x+42,y-36+26*u,20,62,.06*u,1-u*.15);}
  else {
    const u=ease(f-4),cx=x+42,cy=y-6;
    for(let i=0;i<8;i++){
      const a=-Math.PI*.92+i/7*Math.PI*1.08,rr=10+56*u;
      iceShard(ctx,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.62,10,24,a,c,1-u*.12);
    }
    for(let i=0;i<12;i++){const a=i/12*TAU;spark(ctx,cx+Math.cos(a)*(18+50*u),cy+Math.sin(a)*(12+34*u),1.6,white,.65*(1-u));}
  }
}

function iceSideReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const h=holdCharge(p);iceLargeIcicle(ctx,x+30,y-48,18+3*h,50+8*h,-.18,.65+.3*h);return;}
  const f=1+attackP(p)*4;
  if(f<2){const u=ease(f-1);iceLargeIcicle(ctx,x+30+8*u,y-48,20,52,-.18+u*.05,.95);}
  else if(f<3){const u=ease(f-2);iceLargeIcicle(ctx,x+30+42*u,y-48,20,56,-.13+u*.16,1);}
  else if(f<4){const u=ease(f-3);iceLargeIcicle(ctx,x+30+72*u,y-48,20,56,.03+u*.18,1);for(let i=0;i<5;i++)spark(ctx,x+80+i*5,y-46+i*2,1.5,c,.5);}
  else {const u=ease(f-4);iceLargeIcicle(ctx,x+104,y-48,20,54,.22,.8*(1-u));}
}

function iceUpHeavyReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const h=holdCharge(p);for(let i=0;i<3;i++)iceShard(ctx,x+(i-1)*28,y-104,13+2*h,32+5*h,-.08+i*.08,.6+.25*h);return;}
  const f=1+attackP(p)*4;
  if(f<2){const u=ease(f-1);for(let i=0;i<3;i++)iceShard(ctx,x+(i-1)*30,y-88-28*u,13,34,-.05+i*.05,.95);}
  else if(f<3){const u=ease(f-2);for(let i=0;i<3;i++){
    const sx=x+(i-1)*30,sy=y-116-35*u;iceShard(ctx,sx,sy,14,35,-.05+i*.05,c,1);
    for(let k=0;k<3;k++)iceShard(ctx,sx+(k-1)*5,sy+32+k*4,3.5,10,.15*(k-1),c,.58);
  }}
  else {const u=ease(f-3);for(let i=0;i<3;i++){
    const sx=x+(i-1)*30,sy=y-151-55*u;iceShard(ctx,sx,sy,14,36,-.05+i*.05,c,1-u*.2);
    for(let j=0;j<3;j++)spark(ctx,sx+(j-1)*5,sy+24+j*6,1.4,c,.45*(1-u));
  }}
}
function iceDownHeavyReference(ctx,x,y,p){
  const c='#79DFFF',white='#EFFFFF';
  if(p<0){const h=holdCharge(p);iceBlock(ctx,x+50,y-24,64+8*h,38+5*h,.6+.3*h,false);return;}
  const f=1+attackP(p)*4;
  if(f<2){const u=ease(f-1);iceBlock(ctx,x+50,y-24,64,38,.95,false);}
  else if(f<3){const u=ease(f-2),bx=lerp(x+50,x+62,u);iceBlock(ctx,bx,y-24,66,40,1,false);}
  else if(f<3.5){const u=ease((f-3)/.5),bx=x+62;iceBlock(ctx,bx,y-24,66,40,1-u,true);}
  else {const u=ease((f-3.5)/.5),bx=x+62,by=y-24;for(let i=0;i<8;i++){
    const a=-Math.PI*.92+i/7*Math.PI*1.08,rr=14+58*u;iceShard(ctx,bx+Math.cos(a)*rr,by+Math.sin(a)*rr*.65,9,23,a,c,1);
  }for(let i=0;i<10;i++){const a=i/10*TAU;spark(ctx,bx+Math.cos(a)*(20+50*u),by+Math.sin(a)*(12+32*u),1.5,white,.65*(1-u));}}
}
function iceSideHeavyReference(ctx,x,y,p){
  const c='#79DFFF';
  if(p<0){const h=holdCharge(p);iceLargeIcicle(ctx,x-30,y-72,25+4*h,72+10*h,-.12,.6+.3*h);return;}
  const f=1+attackP(p)*4;
  if(f<2){const u=ease(f-1);iceLargeIcicle(ctx,x-30,y-72,26,74,-.12-u*.12,1);}
  else if(f<3){const u=ease(f-2);iceLargeIcicle(ctx,x-30+32*u,y-72-22*u,27,78,-.25+u*1.15,1);}
  else if(f<4){const u=ease(f-3);iceLargeIcicle(ctx,x+2+48*u,y-94+34*u,28,80,.9+u*.9,1);}
  else {const u=ease(f-4),ang=1.8+u*.15;iceLargeIcicle(ctx,x+52,y-50,28,80,ang,.9*(1-u));for(let i=0;i<8;i++)iceShard(ctx,x+82+Math.cos(i)*12,y-48+Math.sin(i)*12,5,14,i*.45,c,.65*(1-u));}
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
function waterRibbonPolygon(ctx, pts, width, alpha, color, taper=true){
  if(pts.length<2 || alpha<=0)return;
  const closed=Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<Math.max(4,width*.65);
  const left=[],right=[];
  for(let i=0;i<pts.length;i++){
    const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)];
    const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.max(1,Math.hypot(dx,dy));
    const u=i/(pts.length-1), taperScale=(!closed&&taper)?(.20+.80*Math.pow(Math.sin(Math.PI*u),.42)):1;
    const w=Math.max(1,width*.5*taperScale),nx=-dy/len,ny=dx/len;
    left.push([pts[i][0]+nx*w,pts[i][1]+ny*w]);right.push([pts[i][0]-nx*w,pts[i][1]-ny*w]);
  }
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=Math.min(16,Math.max(3,width*.48));ctx.beginPath();
  left.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));
  for(let i=right.length-1;i>=0;i--)ctx.lineTo(right[i][0],right[i][1]);ctx.closePath();ctx.fill();ctx.restore();
}
function waterCurve(ctx, pts, a=1, width=8){
  if(pts.length<2)return;
  // Filled liquid ribbon with a broad body and internal highlights, never a stroked attack line.
  const body=Math.max(7,width*1.9);
  waterRibbonPolygon(ctx,pts,body,a,WATER_C,true);
  const inner=pts.map((q,i)=>{const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)];const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.max(1,Math.hypot(dx,dy));return [q[0]-dy/len*body*.08,q[1]+dx/len*body*.08];});
  waterRibbonPolygon(ctx,inner,Math.max(3,body*.48),a*.78,WATER_MID,true);
  waterRibbonPolygon(ctx,inner,Math.max(2,body*.18),a*.78,WATER_HI,true);
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
  // One substantial curved sheet of water, with an actual filled silhouette and a tapered tip.
  const outer=[],inner=[],n=34;
  for(let i=0;i<=n;i++){
    const t=i/n,ang=ang0+(ang1-ang0)*t,centerR=r*(.84+.16*Math.sin(t*Math.PI));
    const width=Math.max(1,thick*(.16+.84*Math.pow(Math.sin(Math.PI*t),.55)));
    outer.push([cx+Math.cos(ang)*(centerR+width*.5),cy+Math.sin(ang)*(centerR+width*.5)*.72]);
    inner.push([cx+Math.cos(ang)*(centerR-width*.5),cy+Math.sin(ang)*(centerR-width*.5)*.72]);
  }
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=WATER_C;ctx.shadowColor=WATER_C;ctx.shadowBlur=13;ctx.beginPath();
  outer.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));
  for(let i=inner.length-1;i>=0;i--)ctx.lineTo(inner[i][0],inner[i][1]);ctx.closePath();ctx.fill();ctx.restore();
  const highlight=[];for(let i=2;i<n-2;i+=2)highlight.push([(outer[i][0]+inner[i][0])*.5,(outer[i][1]+inner[i][1])*.5]);
  if(highlight.length>1)waterRibbonPolygon(ctx,highlight,Math.max(3,thick*.26),a*.82,WATER_HI,true);
  for(let i=4;i<n;i+=4){const t=i/n,ang=ang0+(ang1-ang0)*t;waterDrop(ctx,cx+Math.cos(ang)*r*(1+.05*Math.sin(phase+i)),cy+Math.sin(ang)*r*.72,1.5+(i%3)*.45,a*.58*(1-t*.3),ang+.4);}
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
function waterWave(ctx,x,y,side,t,a=1,phase=0){
  // Broad, layered flowing water sheet — deliberately NOT a neon line.
  const u=clamp01(t), dir=side;
  const pts=[];
  for(let i=0;i<=28;i++){
    const z=i/28;
    const xx=x+dir*(8+92*z*u);
    const crest=-Math.sin(z*Math.PI)*34*u - Math.sin(z*TAU+phase*2)*5;
    const yy=y-3+crest;
    pts.push([xx,yy]);
  }
  waterCurve(ctx,pts,a,18-5*u);
  const pts2=pts.map(([xx,yy],i)=>[xx,yy+8+Math.sin(i*.8+phase)*2]);
  waterCurve(ctx,pts2,a*.58,10-3*u);
  for(let i=0;i<10;i++){
    const z=i/9, xx=x+dir*(18+76*z*u), yy=y-8-Math.sin(z*Math.PI)*30*u;
    waterDrop(ctx,xx,yy,1.8+(i%3)*.45,a*.65,dir*.4);
  }
}
function waterWhipReferenceShape(ctx,x,y,t,a=1,phase=0){
  const u=clamp01(t);
  const hand=[x+22,y-54];
  const tip=[x+42+92*u,y-55-30*Math.sin(u*Math.PI)];
  const pts=[];
  for(let i=0;i<=30;i++){
    const z=i/30;
    const xx=lerp(hand[0],tip[0],z);
    const yy=lerp(hand[1],tip[1],z)-Math.sin(z*Math.PI)*16*u;
    pts.push([xx,yy]);
  }
  waterCurve(ctx,pts,a,16-7*u);
  if(u>.18){
    const r=14+18*u;
    waterTaperedArc(ctx,tip[0]-5,tip[1]+4,r,-.25,1.35,a,.5+phase,8);
  }
  for(let i=0;i<12;i++){
    const z=.15+i*.065, idx=Math.min(30,Math.floor(z*30));
    const pt=pts[idx]; waterDrop(ctx,pt[0],pt[1]-3,1.3+(i%2)*.5,a*.5,0);
  }
}
function waterSpiralFlow(ctx,x,y,t,a=1,phase=0){
  const u=clamp01(t);
  // Several overlapping liquid ribbons rise from below/around the fighter.
  for(let lane=0;lane<3;lane++){
    const pts=[];
    for(let i=0;i<=42;i++){
      const z=i/42;
      const yy=y+2-(142*u)*z;
      const wob=Math.sin(z*TAU*(1.15+u*.8)+phase+lane*2.1)*20;
      const zig=((i%2)?-1:1)*8*z*u;
      const xx=x+(lane-1)*16 + wob + zig;
      pts.push([xx,yy]);
    }
    waterCurve(ctx,pts,a*.82,15-lane*2);
    for(let i=5;i<38;i+=6){
      const pt=pts[i]; waterDrop(ctx,pt[0],pt[1],1.5,a*.45,phase);
    }
  }
  // Crown of flowing water above the head.
  const crownY=y-42-130*u;
  waterIrregularRing(ctx,x,crownY,30+22*u,10+5*u,a*.8,phase*.7,phase,.04);
}
function waterDownHeavyShape(ctx,x,y,p,a=1,phase=0){
  const u=clamp01(p);
  const bx=x+52;
  if(u<.32){
    const k=ease(u/.32); waterOrb(ctx,bx,y-55,22+2*k,a,phase);
    return;
  }
  if(u<.62){
    const k=ease((u-.32)/.30);
    // The ball is visibly driven downward by the stomp.
    waterOrb(ctx,bx,y-55+58*k,22,a,phase+1);
    waterSpray(ctx,bx,y-55+58*k,Math.PI/2,.8,10,a*.5,phase);
    return;
  }
  const k=ease((u-.62)/.38), sy=y+3;
  waterOrb(ctx,bx,sy,20*(1-k*.55),a*(1-k*.35),phase+2);
  waterWave(ctx,bx,sy,-1,k,a*.95,phase);
  waterWave(ctx,bx,sy,1,k,a*.95,phase+1.3);
}
function waterUpReference(ctx,x,y,p){
  if(p<0){const h=holdCharge(p);waterRing(ctx,x+22,y-52,17+3*h,9+2*h,.65+.3*h,-h*.4,h);return;}
  const f=1+attackP(p)*7;
  if(f<2){
    const u=ease(f-1); waterRing(ctx,x+20,y-54,18+5*u,10+2*u,.9,-u*TAU,.4+u*2);
  } else if(f<3){
    const u=ease(f-2),cx=lerp(x+20,x+40,u),cy=lerp(y-54,y-72,u);
    waterRing(ctx,cx,cy,22,11,1,u*TAU,.8); waterCurve(ctx,[[x+20,y-54],[cx,cy]],.6,6);
  } else if(f<5.5){
    const u=ease((f-3)/2.5),cx=lerp(x+40,x+108,u),cy=lerp(y-72,y-116,u);
    waterRing(ctx,cx,cy,22-3*u,11-2*u,1,u*TAU,1.4+u*3);
    const trail=[];for(let i=0;i<=20;i++){const z=i/20;trail.push([lerp(x+40,cx,z),lerp(y-72,cy,z)+Math.sin(z*Math.PI)*8]);}
    waterCurve(ctx,trail,.55,5);
  } else if(f<7){
    const u=ease((f-5.5)/1.5),cx=lerp(x+108,x+116,u),cy=lerp(y-116,y-120,u);
    waterRing(ctx,cx,cy,19-8*u,9-4*u,1-u*.8,(u+1)*TAU,2);
    for(let i=0;i<8;i++)waterDrop(ctx,cx+(i-4)*4,cy+(i%2?5:-5),1.4,.55*(1-u),i);
  }
}
function waterDownReference(ctx,x,y,p){
  if(p<0){const h=holdCharge(p);waterWave(ctx,x,y,-1,.18+h*.12,.45+.25*h,0);waterWave(ctx,x,y,1,.18+h*.12,.45+.25*h,1.3);return;}
  const f=1+attackP(p)*4;
  if(f<2){
    const u=ease(f-1);
    // Bend/slap startup: low water begins at both palms.
    waterWave(ctx,x,y,-1,.15+.18*u,.75+.2*u,0);
    waterWave(ctx,x,y,1,.15+.18*u,.75+.2*u,1.2);
  } else if(f<3.3){
    const u=ease((f-2)/1.3);
    waterWave(ctx,x,y,-1,.33+.67*u,1,.2);
    waterWave(ctx,x,y,1,.33+.67*u,1,1.5);
  } else {
    const u=ease((f-3.3)/.7);
    waterWave(ctx,x,y,-1,1,1-u*.75,.3);
    waterWave(ctx,x,y,1,1,1-u*.75,1.6);
  }
}
function waterSideReference(ctx,x,y,p){
  if(p<0){const h=holdCharge(p);waterWhipReferenceShape(ctx,x,y,.12+.12*h,.55+.25*h,.2);return;}
  const q=attackP(p),f=1+q*4;
  if(f<2){waterWhipReferenceShape(ctx,x,y,.10+.15*ease(f-1),.8,.2);}
  else if(f<3){waterWhipReferenceShape(ctx,x,y,.25+.5*ease(f-2),1,.5);}
  else if(f<4){waterWhipReferenceShape(ctx,x,y,.75+.25*ease(f-3),1,.8);}
  else waterWhipReferenceShape(ctx,x,y,1,.72,1);
}
function waterUpHeavyReference(ctx,x,y,p){
  if(p<0){const h=holdCharge(p);waterSpiralFlow(ctx,x,y,.12+.12*h,.55+.25*h,.2);return;}
  const q=attackP(p),f=1+q*4;
  if(f<2)waterSpiralFlow(ctx,x,y,.12+.18*ease(f-1),.9,q);
  else if(f<3)waterSpiralFlow(ctx,x,y,.30+.34*ease(f-2),1,q+.7);
  else if(f<4)waterSpiralFlow(ctx,x,y,.64+.22*ease(f-3),1,q+1.2);
  else waterSpiralFlow(ctx,x,y,.86+.14*ease(f-4),.8,q+2);
}
function waterDownHeavyReference(ctx,x,y,p){
  if(p<0){const h=holdCharge(p);waterOrb(ctx,x+52,y-55,22+2*h,.65+.25*h,0);return;}
  waterDownHeavyShape(ctx,x,y,attackP(p),1,attackP(p)*4);
}
function waterSideHeavyReference(ctx,x,y,p){
  if(p<0){const h=holdCharge(p);waterTaperedArc(ctx,x+36,y-48,55+12*h,-1.55,.9,.55+.25*h,h,18);return;}
  const q=attackP(p),f=1+q*4;
  const u=f<2?ease(f-1)*.22:f<3?.22+ease(f-2)*.34:f<4?.56+ease(f-3)*.34:.90+ease(f-4)*.10;
  // Large flowing water slash, broad and layered like a real sheet of water.
  const cx=x+34+28*u,cy=y-48,r=56+18*Math.sin(u*Math.PI);
  waterTaperedArc(ctx,cx,cy,r,-1.45+u*.15,.95+u*1.65,1-u*.12,q,22);
  waterTaperedArc(ctx,cx-4,cy+2,r*.78,-1.3+u*.12,.75+u*1.45,.55,q+1,9);
  if(u>.72)waterSpray(ctx,cx+Math.cos(.95+u*1.65)*r,cy+Math.sin(.95+u*1.65)*r*.72,.4,1.3,16,.8,q);
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
  const q=attackP(p), charge=ease(clamp01(q/.22)), mark=ease(clamp01((q-.18)/.42)), converge=ease(clamp01((q-.60)/.20)), finish=ease(clamp01((q-.80)/.20));
  const marks=[x+54,x+132,x+210];
  // Three pressure marks appear in a quick exchange, each with its own readable ring.
  for(let i=0;i<marks.length;i++){
    const delay=i*.105, t=ease(clamp01((q-.16-delay)/.18)), mx=lerp(x+24,marks[i],t), my=y-48-16*Math.sin(t*Math.PI+i*.6);
    if(q>.14+delay&&q<.82){
      waterIrregularRing(ctx,mx,my,13+7*t,9+4*t,.68,0,q+i*.7);
      waterOrb(ctx,mx,my,6+5*t,.82,q*5+i);
      waterSpray(ctx,mx,my,-.15,1.0,5,.55,q+i);
    }
  }
  // The marked pressure columns pull inward before a single broad wave cashes them in.
  if(q<.22){waterOrb(ctx,x+22,y-52,19+13*charge,.72+charge*.2,q*5);waterIrregularRing(ctx,x+22,y-52,24+17*charge,13+8*charge,.65,0,q);}
  if(q>.28&&q<.82){
    const t=mark, pts=[];
    for(let i=0;i<=28;i++){const u=i/28,xx=lerp(x+25,x+225,u),yy=lerp(y-48,y-48-16*Math.sin(u*Math.PI),u)-Math.sin(u*Math.PI)*22*(1-t*.55);pts.push([xx,yy]);}
    waterCurve(ctx,pts,.42+.4*(1-converge),14);waterCurve(ctx,pts,WATER_HI,.82,7);
  }
  if(q>.60){
    const cx=x+225-160*converge,cy=y-52-10*Math.sin(converge*Math.PI),r=24+88*converge;
    waterIrregularRing(ctx,cx,cy,r,r*.62,1,.08,q*4);
    waterOrb(ctx,cx,cy,16+22*finish,1,q*6);
    for(let i=0;i<18;i++){const a=i/18*TAU+q*2,rr=r*(.72+.28*((i*7)%11)/11);waterDrop(ctx,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.62,1.5,.8*(1-finish*.3),a+.2);}
  }
  if(charge>.1){waterIrregularRing(ctx,x+22,y-52,18+charge*20,11+charge*9,.5,0,q);}
}

function gen1AuthoredBodyPose(move,q,facing,charId){
  const t=clamp01(q), wind=ease(clamp01(t/.34)), strike=ease(clamp01((t-.30)/.18)), recover=ease(clamp01((t-.52)/.48));
  const lead=facing>=0?'R':'L';let punchArmL=0,punchArmR=0,legSwing=0,lean=0,bob=0;
  const leadPunch=v=>{if(lead==='R')punchArmR=v;else punchArmL=-v;};
  const offArm=v=>{if(lead==='R')punchArmL=v;else punchArmR=-v;};
  const grass=charId==='g1_grass',ice=charId==='g1_ice',thunder=charId==='g1_thunder',water=charId==='g1_water';
  // Water and Ice have bespoke move choreography: throws, two-hand slams, sweeps, dives and rolls.
  if(grass && move==='ss'){const wind=ease(clamp01(t/.35)),breakHit=ease(clamp01((t-.42)/.16));lean=facing*(-.22*wind+.44*breakHit);bob=3*wind-5*breakHit;legSwing=-.32*wind+.58*breakHit;leadPunch(-.25-1.65*breakHit);offArm(.55+.4*breakHit);return {punchArmL,punchArmR,legSwing,lean,bob};}
  if(grass){
    const wind=ease(clamp01(t/.34)),hit=ease(clamp01((t-.38)/.18)),settle=ease(clamp01((t-.7)/.3));
    if(move==='us'){lean=-facing*.28*wind+facing*.12*hit;bob=-15*hit;legSwing=.5*wind-.3*hit;leadPunch(-1.4*wind-.25*hit);offArm(.75*wind);}
    else if(move==='ds'){lean=-facing*.22*wind+facing*.12*hit;bob=8*wind+3*hit;legSwing=-.3*wind;punchArmL=.85*hit;punchArmR=.85*hit;}
    else if(move==='ss'){lean=facing*(-.22*wind+.44*hit);bob=3*wind-5*hit;legSwing=-.32*wind+.58*hit;leadPunch(-.25-1.65*hit);offArm(.55+.4*hit);}
    else if(move==='uh'){lean=-facing*.18*wind+facing*.08*hit;bob=-28*hit+5*settle;legSwing=.7*wind-.5*hit;leadPunch(-1.0*wind-1.0*hit);offArm(-.85*wind-1.0*hit);}
    else if(move==='dh'){lean=facing*(.08*wind+.2*hit);bob=8*wind+7*hit;legSwing=-.1*wind;punchArmL=-1.15*hit;punchArmR=-1.15*hit;}
    else if(move==='sh'){lean=facing*(-.34*wind+.5*hit);bob=4*wind-4*hit;legSwing=-.7*wind+.4*hit;leadPunch(-.15-1.45*hit);offArm(.9*hit);}
    else if(move==='recovery'){const spin=Math.sin(t*TAU*1.2);lean=facing*(.34*spin-.1);bob=-17*ease(clamp01((t-.28)/.4));legSwing=.85*spin;leadPunch(-.8*spin);offArm(.7*spin);}
    else if(move==='groundPound'){const dive=ease(clamp01(t/.6)),land=ease(clamp01((t-.6)/.22));lean=facing*(.2+.58*dive-.35*land);bob=16*dive-12*land;legSwing=.9*dive-.45*land;punchArmL=-.7-.2*dive;punchArmR=-.7-.2*dive;}
    else if(move==='super'){const spread=ease(clamp01(t/.3)),fin=ease(clamp01((t-.76)/.2));lean=facing*(.12*spread-.38*fin);bob=-6*spread+3*fin;legSwing=.5*Math.sin(t*TAU);punchArmL=-1.15*spread-.2*fin;punchArmR=-1.15*spread-.2*fin;offArm(.5*fin);}
    return {punchArmL,punchArmR,legSwing,lean,bob};
  }
  if(water){
    const wind=ease(clamp01(t/.32)),hit=ease(clamp01((t-.34)/.18)),recover=ease(clamp01((t-.66)/.34));
    if(move==='us'){lean=facing*(.12*wind-.28*hit);bob=-18*hit+4*recover;legSwing=.8*wind-1.1*hit;leadPunch(-.3-1.05*wind);offArm(.8*hit);}
    else if(move==='ds'){lean=-facing*(.24*wind-.12*hit);bob=8*wind+4*hit;legSwing=-.15*wind;punchArmL=.45+1.0*hit;punchArmR=.45+1.0*hit;}
    else if(move==='ss'){lean=facing*(-.24*wind+.36*hit);bob=2*wind-2*hit;legSwing=-.55*wind+.2*hit;leadPunch(-.2-1.1*wind+.65*hit);offArm(.85*hit);}
    else if(move==='uh'){lean=facing*(.22*wind-.36*hit);bob=-26*hit+7*recover;legSwing=.55*wind-.85*hit;leadPunch(-1.2*hit);offArm(-.9*wind-.35*hit);}
    else if(move==='dh'){lean=-facing*.18*wind+facing*.1*hit;bob=7*wind+8*hit;legSwing=.25*wind;punchArmL=-1.05*hit;punchArmR=-1.05*hit;}
    else if(move==='sh'||move==='heavy'){lean=facing*(-.3*wind+.48*hit);bob=4*wind-3*hit;legSwing=-.75*wind+.45*hit;leadPunch(-.1-1.75*hit);offArm(.8*hit);}
    else if(move==='recovery'){const roll=Math.sin(t*TAU*1.3);lean=facing*(.3*roll-.1);bob=-15*ease(clamp01((t-.28)/.4));legSwing=.9*roll;leadPunch(-.7*roll);offArm(.65*roll);}
    else if(move==='groundPound'){const dive=ease(clamp01(t/.62)),land=ease(clamp01((t-.62)/.22));lean=facing*(.25+.4*dive);bob=17*dive-12*land;legSwing=.9*Math.sin(t*TAU*1.5);punchArmL=-.45-.4*dive;punchArmR=-.45-.4*dive;}
    else if(move==='super'){const spin=Math.sin(t*TAU*2),cash=ease(clamp01((t-.72)/.2));lean=facing*(.22*spin-.42*cash);bob=-5*wind-8*cash;legSwing=.8*spin;leadPunch(-.5-1.0*cash);offArm(.75*spin);}
    return {punchArmL,punchArmR,legSwing,lean,bob};
  }
  if(ice){
    const wind=ease(clamp01(t/.36)),hit=ease(clamp01((t-.4)/.14)),settle=ease(clamp01((t-.72)/.28));
    if(move==='us'){lean=-facing*(.18*wind)+facing*.08*hit;bob=-22*hit+4*settle;legSwing=.7*wind-.5*hit;leadPunch(-.25-1.0*hit);offArm(-.75*hit);}
    else if(move==='ds'){lean=facing*(.12*wind-.1*hit);bob=6*wind;legSwing=.15*hit;punchArmL=.9*hit;punchArmR=.9*hit;}
    else if(move==='ss'){lean=facing*(-.28*wind+.5*hit);bob=2*wind-2*hit;legSwing=-.4*wind+.75*hit;leadPunch(-.15-1.7*hit);offArm(.7*hit);}
    else if(move==='uh'){lean=facing*(.25*wind-.25*hit);bob=-30*hit+5*settle;legSwing=.85*wind-.4*hit;leadPunch(-.65-1.1*hit);offArm(-1.0*hit);}
    else if(move==='dh'){lean=facing*(.12*wind+.2*hit);bob=7*wind+6*hit;legSwing=-.2*wind;punchArmL=-1.1*hit;punchArmR=-1.1*hit;}
    else if(move==='sh'||move==='heavy'){lean=facing*(-.35*wind+.55*hit);bob=4*wind-3*hit;legSwing=-.75*wind+.45*hit;leadPunch(-.1-1.75*hit);offArm(.8*hit);}
    else if(move==='recovery'){lean=facing*(.35*wind-.2*hit);bob=-20*hit;legSwing=.65*Math.sin(t*TAU);leadPunch(-.5*hit);offArm(-.8*hit);}
    else if(move==='groundPound'){const dive=ease(clamp01(t/.62)),land=ease(clamp01((t-.62)/.2));lean=facing*(.05+.65*dive);bob=15*dive-11*land;legSwing=.2*dive-.8*land;punchArmL=-.8*dive;punchArmR=-.8*dive;}
    else if(move==='super'){const gather=ease(clamp01(t/.28)),shatter=ease(clamp01((t-.72)/.2));lean=facing*(.15*gather-.35*shatter);bob=-6*gather+5*shatter;legSwing=.5*Math.sin(t*TAU);leadPunch(-.6-1.2*shatter);offArm(-.75*gather+.6*shatter);}
    return {punchArmL,punchArmR,legSwing,lean,bob};
  }
  if(move==='us'){
    if(grass){lean=facing*(t<.2?-.18+Math.sin(t*40)*.08:.08+.18*strike);legSwing=.24*Math.sin(t*18)+.55*strike;bob=-17*strike+3*recover;leadPunch(-.45-1.1*strike);offArm(.35+.4*strike);}
    else if(ice){lean=facing*(.06-.25*wind+.12*strike);legSwing=.35*Math.sin(t*14);bob=-8*wind-10*strike;leadPunch(-.55-1.25*strike);offArm(.35+.45*strike);}
    else if(thunder){lean=-facing*.18*(1-strike)+facing*.20*strike;legSwing=-.25+1.0*strike;bob=-12*strike;leadPunch(-.2-1.45*strike);offArm(.5);}
    else if(water){lean=facing*(.08*Math.sin(t*10)+.2*strike);legSwing=.42*Math.sin(t*12);bob=-12*strike;leadPunch(-.4-1.3*strike);offArm(.25);}
    else {lean=facing*(.08+.12*strike);legSwing=.2+.65*strike;bob=-15*strike;leadPunch(-.5-1.3*strike);offArm(.3);}
  } else if(move==='ds'){
    if(grass){lean=-facing*.16*wind+facing*.22*strike;bob=5*wind+2*strike;legSwing=-.35*wind+.2*strike;leadPunch(.35+.45*strike);offArm(.2);}
    else if(ice){lean=facing*.18*wind;legSwing=.7*strike;bob=2*wind;leadPunch(.55*strike);offArm(-.55*strike);}
    else if(thunder){lean=-facing*.10+facing*.15*strike;legSwing=.8*strike;bob=3*wind;leadPunch(.3*strike);offArm(-.5*strike);}
    else if(water){lean=-facing*.2*wind;legSwing=.25*wind;bob=2*wind;leadPunch(.3*strike);offArm(-.3*strike);}
    else {lean=facing*.06;bob=4*wind;leadPunch(.25*strike);}
  } else if(move==='ss'){
    if(grass){lean=facing*(.12*wind+.25*strike);bob=2*wind-3*strike;legSwing=-.3*wind+.45*strike;leadPunch(-.45-1.1*strike);offArm(.55*strike);}
    else if(ice){lean=facing*(.08+.18*strike);leadPunch(-.4-1.35*strike);offArm(.25);legSwing=.18*strike;}
    else if(thunder){lean=facing*.02+facing*.24*strike;leadPunch(-.2-1.3*strike);offArm(.3);legSwing=.1*strike;}
    else if(water){lean=facing*(.05+.18*strike);leadPunch(-.45-1.2*strike);offArm(.25);legSwing=.2*strike;}
    else {lean=facing*(.08+.2*strike);leadPunch(-.45-1.15*strike);offArm(.2);legSwing=.2*strike;}
  } else if(move==='uh'){
    if(grass){lean=facing*(.05+.28*wind-.38*strike+.12*recover);bob=-24*wind+15*strike-5*recover;legSwing=.55*wind-1.0*strike+.25*recover;leadPunch(-.4-1.4*strike);offArm(-.25-1.0*strike);}
    else if(ice){lean=facing*(.12*wind-.22*strike);bob=-8*wind-18*strike;legSwing=.55*Math.sin(t*TAU);leadPunch(-.45-1.5*strike);offArm(-.7-0.5*strike);}
    else if(thunder){lean=facing*(.18*wind+.22*strike);bob=-20*strike;legSwing=.5*wind-.55*strike;leadPunch(-.3-1.35*strike);offArm(.65);}
    else if(water){lean=facing*(.1*wind+.12*strike);bob=-10*wind-24*strike;legSwing=.35*wind-.5*strike;leadPunch(-.45-1.2*strike);offArm(-.7);}
    else {lean=facing*.15*strike;bob=-18*strike;legSwing=.4*strike;leadPunch(-.6-1.3*strike);offArm(-.8);}
  } else if(move==='dh'){
    // Stop completely before the floor hit; then brace as the elemental follow-through expands.
    const brace=ease(clamp01((t-.18)/.16)), impact=ease(clamp01((t-.30)/.12));
    lean=facing*(.06*wind-.12*impact);bob=8*wind+8*impact-3*recover;legSwing=.08*wind+.12*impact;
    punchArmL=-.35-.45*brace;punchArmR=-.35-.45*brace;
    if(thunder){lean=-facing*.18*wind+facing*.04*impact;leadPunch(.45*impact);}
    if(water){lean=-facing*.12*wind;legSwing=.45*impact;}
  } else if(move==='sh'){
    if(grass){lean=facing*(.28*wind-.32*strike);bob=4*wind-5*strike;legSwing=-.5*wind+.35*strike;leadPunch(-.45-1.0*strike);offArm(.7*strike);}
    else if(ice){lean=-facing*.22*wind+facing*.26*strike;bob=3*wind;legSwing=.2*strike;leadPunch(-.15-1.7*strike);offArm(.75*strike);}
    else if(thunder){lean=facing*.2*Math.sin(t*TAU);legSwing=.5*Math.sin(t*TAU);leadPunch(-.4-1.25*strike);offArm(.7*strike);}
    else if(water){lean=-facing*.12*wind+facing*.24*strike;legSwing=-.25*wind+.3*strike;leadPunch(-.4-1.2*strike);offArm(.5*strike);}
    else {lean=-facing*.12*wind+facing*.3*strike;legSwing=-.2*wind+.4*strike;leadPunch(-.4-1.2*strike);offArm(.55*strike);}
  } else if(move==='recovery'){
    const side=Math.sin(t*Math.PI*1.15), lift=ease(clamp01((t-.3)/.4));
    if(grass){lean=facing*(t<.22?-.30:.24-lift*.65);bob=-17*lift;legSwing=.85*side;leadPunch(-.35-1.15*lift);offArm(.75*side);}
    else if(ice){lean=facing*(t<.3?.18:-.12+lift*.18);bob=-9*lift+3*Math.sin(t*TAU);legSwing=.45*side;leadPunch(-.8*Math.sin(t*Math.PI)-.25);offArm(.55*Math.sin(t*Math.PI));}
    else if(thunder){lean=facing*(t<.3?.25-.8*wind: -.20+lift*.35);bob=8*wind-21*lift;legSwing=-.25+1.1*lift;leadPunch(-.35-1.25*lift);offArm(.8*lift);}
    else if(water){lean=facing*(.20*Math.sin(t*TAU)-.12*lift);bob=-13*lift;legSwing=.75*side;leadPunch(-.65*Math.sin(t*TAU));offArm(.55*Math.sin(t*TAU));}
  } else if(move==='groundPound'){
    const dive=ease(clamp01(t/.62)),land=ease(clamp01((t-.58)/.22));
    if(grass){lean=facing*(.18+.58*dive-.42*land);bob=15*dive-12*land;legSwing=.95*dive-.45*land;punchArmL=-.65-.2*dive;punchArmR=-.65-.2*dive;}
    else if(ice){lean=facing*(.05+.25*dive+.45*ease(clamp01((dive-.72)/.28)));bob=14*dive-9*land;legSwing=.25*dive-.6*land;leadPunch(-.35-1.0*dive);offArm(-.45-.55*dive);}
    else if(thunder){lean=facing*(.10+.68*dive);bob=16*dive-9*land;legSwing=.8*dive-.2*land;leadPunch(-.75-.35*dive);offArm(-.7-.25*dive);}
    else if(water){lean=facing*(.18+.32*Math.sin(t*TAU*2));bob=14*dive-10*land;legSwing=.7*Math.sin(t*TAU*2);leadPunch(-.5-.55*dive);offArm(-.5+.35*Math.sin(t*TAU));}
  } else if(move==='super'){
    const gather=ease(clamp01(t/.28)), dash=ease(clamp01((t-.3)/.18)), finish=ease(clamp01((t-.78)/.2));
    lean=facing*(.04+.16*gather-.34*dash+.12*finish);bob=-4*gather-8*dash+4*finish;legSwing=.2*gather+.65*dash-.25*finish;leadPunch(-.4-1.1*gather-0.3*dash);offArm(-.25-.9*gather+.2*finish);
  }
  return {punchArmL,punchArmR,legSwing,lean,bob};
}

function gen1FireBodyPose(move,q,facing){
  const t=clamp01(q),wind=ease(clamp01(t/.28)),hit=ease(clamp01((t-.30)/.16)),settle=ease(clamp01((t-.72)/.28));
  let punchArmL=0,punchArmR=0,legSwing=0,lean=0,bob=0;
  const lead=v=>{if(facing>=0)punchArmR=v;else punchArmL=-v;};
  if(move==='us'){ // plants, whips the throwing arm diagonally up, then follows the burning rock
    lead(-.35-1.55*wind-.25*hit);punchArmL=.35+.35*wind;lean=facing*(-.12*wind+.18*hit);legSwing=-.2*wind+.62*hit;bob=3*wind-13*hit+4*settle;
  }else if(move==='ds'){ // heel stamp with both fists pulled back
    punchArmL=.35+1.0*wind;punchArmR=.35+1.0*wind;lean=-facing*.12*wind;legSwing=.65*hit;bob=5*wind+7*hit-2*settle;
  }else if(move==='ss'){ // low roll into an upward hook
    lead(-.15-1.0*wind-1.0*hit);punchArmL=.25+.65*hit;lean=facing*(-.36*wind+.42*hit);legSwing=-.75*wind+.65*hit;bob=5*wind-5*hit;
  }else if(move==='uh'){ // both arms launch overhead, knees tuck then extend
    punchArmL=-.65-1.4*wind-1.0*hit;punchArmR=-.8-1.45*wind-1.05*hit;lean=facing*(.12*wind-.18*hit);legSwing=.7*wind-.8*hit;bob=-3*wind-22*hit+5*settle;
  }else if(move==='dh'){ // wind back, two-fist hammer slam, recoil
    punchArmL=-.2-1.1*wind+.5*hit;punchArmR=-.2-1.1*wind+.5*hit;lean=facing*(.18*wind+.25*hit);legSwing=-.15*wind+.2*hit;bob=3*wind+10*hit-4*settle;
  }else if(move==='sh'){ // long forward punch with rear leg driving the body
    lead(-.2-1.1*wind-1.45*hit);punchArmL=.55+.45*hit;lean=facing*(-.32*wind+.5*hit);legSwing=-.55*wind+.42*hit;bob=4*wind-4*hit;
  }else if(move==='recovery'){ // tucked shoulder roll and rising knee
    lead(-.25-1.3*Math.sin(t*Math.PI));punchArmL=.45+.45*Math.sin(t*Math.PI);lean=facing*(.32*Math.sin(t*TAU)-.12);legSwing=.95*Math.sin(t*TAU);bob=-16*ease(clamp01((t-.28)/.42));
  }else if(move==='groundPound'){ // corkscrew tuck, then both arms brace on landing
    punchArmL=-.7-.35*wind;punchArmR=-.7-.35*wind;lean=facing*(.15+.62*wind-.4*hit);legSwing=.8*wind-.45*hit;bob=13*wind-12*hit;
  }else if(move==='super'){ // alternating rush strikes, cross-body finish
    const combo=Math.sin(t*TAU*2);punchArmL=-.35-1.1*wind-.6*Math.max(0,combo);punchArmR=-.35-1.1*wind-.6*Math.max(0,-combo);lean=facing*(.12*wind-.34*hit+.12*settle);legSwing=.65*combo;bob=-5*wind-7*hit+3*settle;
  }
  return {punchArmL,punchArmR,legSwing,lean,bob};
}
function gen1ThunderBodyPose(move,q,facing){
  const t=clamp01(q),wind=ease(clamp01(t/.24)),strike=ease(clamp01((t-.24)/.20)),recover=ease(clamp01((t-.68)/.32));
  let punchArmL=0,punchArmR=0,legSwing=0,lean=0,bob=0;
  const lead=v=>{if(facing>=0)punchArmR=v;else punchArmL=-v;};
  if(move==='us'){ // pivot on one foot, orbiting arm leads the upward electric launch
    lead(-.2-1.55*strike);punchArmL=.75*wind-.25*strike;lean=facing*(-.22*wind+.18*strike);legSwing=-.45*wind+1.0*strike;bob=-14*strike+3*recover;
  }else if(move==='ds'){ // compact crouch, both palms clap down/outward
    punchArmL=.6+1.05*strike;punchArmR=.6+1.05*strike;lean=-facing*(.2*wind-.08*strike);legSwing=.25*wind+.6*strike;bob=6*wind+4*strike;
  }else if(move==='ss'){ // fast fencing thrust: arm shoots forward while rear leg drives
    lead(-.15-1.8*strike);punchArmL=.45+.5*strike;lean=facing*(-.28*wind+.48*strike);legSwing=-.45*wind+.35*strike;bob=2*wind-3*strike;
  }else if(move==='uh'){ // spring upward with both fists split above the head
    punchArmL=-.6-1.25*wind-1.1*strike;punchArmR=-.65-1.35*wind-1.15*strike;lean=facing*(.15*wind-.2*strike);legSwing=.7*wind-.75*strike;bob=-5*wind-22*strike+4*recover;
  }else if(move==='dh'){ // two-handed overhead hammer and grounded brace
    punchArmL=-.3-1.25*wind+.6*strike;punchArmR=-.3-1.25*wind+.6*strike;lean=facing*(.12*wind+.25*strike);legSwing=-.2*wind+.2*strike;bob=4*wind+9*strike-3*recover;
  }else if(move==='sh'){ // burst-step kick, hands counterbalance the extended leg
    punchArmL=.7*wind-.45*strike;punchArmR=-.5-1.1*strike;lean=facing*(-.25*wind+.45*strike);legSwing=1.05*strike-.35*wind;bob=2*wind-5*strike;
  }else if(move==='recovery'){ // tight crouch, then a rapid rising spin
    lead(-.2-1.2*strike);punchArmL=.75*Math.sin(t*TAU);lean=facing*(.3*wind-.18*recover);legSwing=1.0*Math.sin(t*TAU);bob=7*wind-23*recover;
  }else if(move==='groundPound'){ // shoulder-forward aerial dive with legs tucked behind
    punchArmL=-.65-.45*wind;punchArmR=-.7-.4*wind;lean=facing*(.12+.68*wind-.2*strike);legSwing=.9*wind-.25*strike;bob=15*wind-10*strike;
  }else if(move==='super'){ // rapid alternating strikes followed by a grounded power slam
    const combo=Math.sin(t*TAU*2.4);punchArmL=-.35-1.2*wind-.7*Math.max(0,combo);punchArmR=-.35-1.2*wind-.7*Math.max(0,-combo);lean=facing*(.12*wind-.32*strike+.12*recover);legSwing=.7*combo;bob=-4*wind-8*strike+4*recover;
  }
  return {punchArmL,punchArmR,legSwing,lean,bob};
}

export function getGen1AttackPose(move,p,facing=1,charId='g1_water'){
  const q=clamp01(Math.max(0,p));
  const t=ease(q);
  const lead=facing>0?'R':'L';
  let punchArmL=0,punchArmR=0,legSwing=0,lean=facing*.05,bob=0;
  const leadPunch=(v)=>{if(lead==='R')punchArmR=v;else punchArmL=-v;};
  const offArm=(v)=>{if(lead==='R')punchArmL=v;else punchArmR=-v;};
  if (p >= 0) {
    if(charId==='g1_fire') return gen1FireBodyPose(move,q,facing);
    if(charId==='g1_thunder') return gen1ThunderBodyPose(move,q,facing);
    return gen1HeroBodyPose(move,p,facing,charId);
  }
  // Give the non-Fire Gen-I heroes matching body choreography for their newly
  // authored recovery and ground-pound effects instead of leaving them in idle.
  if(move==='recovery'||move==='groundPound'){
    const recovery=move==='recovery';
    const phase=recovery?clamp01(q/.78):clamp01(q/.72);
    const snap=easeOut(phase);
    if(recovery){
      lean=facing*(phase<.38?-.16+phase*.28:.12-snap*.20);
      bob=-4*snap;
      legSwing=.45*Math.sin(phase*Math.PI*1.4);
      leadPunch(-1.1*Math.sin(phase*Math.PI)); offArm(.55*Math.sin(phase*Math.PI));
    }else{
      lean=facing*(.05+.32*snap);
      bob=phase<.68?3+10*snap:10*(1-ease(clamp01((phase-.68)/.32)));
      legSwing=.55*snap;
      punchArmL=-.65*snap; punchArmR=-.65*snap;
    }
    return {punchArmL,punchArmR,legSwing,lean,bob};
  }
  if(charId==='g1_fire'){
    const count = move==='dh' ? 6 : move==='super' ? 7 : (move==='groundPound' ? 6 : move==='recovery' ? 4 : 4);
    const z=q*count, i=Math.min(count-1,Math.floor(z)), u=z-Math.floor(z), s=u*u*(3-2*u);
    const beat=(arr)=>arr[i]+(arr[Math.min(i+1,count-1)]-arr[i])*s;
    const lead=(angle)=>{if(facing>=0) punchArmR=angle; else punchArmL=-angle;};
    if(move==='us'){ lead(beat([0,-1.55,-2.15,-1.65])); lean=facing*beat([0,.02,.03,.08]); legSwing=beat([0,.18,.62,.12]); bob=beat([0,1,-5,0]); }
    else if(move==='ss'){ lead(beat([0,-1.05,-1.72,-1.15])); lean=facing*beat([0,.08,.20,.16]); legSwing=beat([0,.04,.22,.12]); }
    else if(move==='ds'){ lean=facing*beat([0,.10,.03,-.10]); bob=beat([0,5,8,2]); lead(beat([0,.30,.20,.05])); }
    else if(move==='uh'){ punchArmR=beat([-1.0,-2.55,-2.70,-2.20]); punchArmL=beat([-1.0,-2.85,-2.95,-2.45]); lean=facing*beat([0,0,.02,.05]); bob=beat([0,2,-10,-4]); legSwing=beat([0,.1,.5,.18]); }
    else if(move==='dh'){ lean=facing*beat([0,.18,.06,-.02,-.04,-.02]); bob=beat([0,9,6,4,2,0]); legSwing=beat([0,.04,.12,.08,.03,0]); lead(beat([0,.62,.55,.35,.18,.05])); }
    else if(move==='sh'){ lead(beat([-1.15,-1.45,-1.75,-.55])); lean=facing*beat([.02,.08,.18,.10]); legSwing=beat([0,.05,.18,.08]); }
    else if(move==='recovery'){ lead(beat([-.2,-1.2,-2.0,-.35])); punchArmL=beat([.3,.8,-.4,.1]); lean=facing*beat([-.05,.15,.08,-.12]); legSwing=beat([0,.35,.5,.05]); bob=beat([0,2,-4,0]); }
    else if(move==='groundPound'){ punchArmL=beat([-.3,-.8,.2,.6,.3,0]); punchArmR=beat([-.3,-.8,.2,.6,.3,0]); lean=facing*beat([0,.2,.35,.15,.05,0]); bob=beat([0,2,8,5,2,0]); legSwing=beat([0,.2,.45,.3,.1,0]); }
    else if(move==='super'){ if(i===0){punchArmR=-.85;punchArmL=-.65;lean=facing*.03;} else if(i===1||i===2){punchArmR=-1.15;punchArmL=-.95;lean=facing*.06;} else if(i===3||i===4){punchArmR=-1.7;punchArmL=-1.55;lean=facing*.22;legSwing=.2;} else if(i===5){punchArmR=.2;punchArmL=.1;lean=-facing*.12;} else {punchArmR=-.1;punchArmL=-.05;lean=-facing*.05;} }
    return {punchArmL,punchArmR,legSwing,lean,bob};
  }
  if(charId==='g1_water'){
    if(move==='us'){leadPunch(-1.65*t);offArm(.15*t);lean=facing*(.04+.08*t);}
    else if(move==='ds'){punchArmL=.95*t;punchArmR=-.95*t;lean=-facing*(.10+.10*t);bob=7*t;}
    else if(move==='ss'){leadPunch(-1.85*t);offArm(.25*t);lean=facing*(.05+.18*t);}
    else if(move==='uh'){leadPunch(-1.15*t);offArm(-1.0*t);lean=facing*.10*t;}
    else if(move==='dh'){leadPunch(.15*t);offArm(.15*t);lean=-facing*.12*t;legSwing=.65*t;bob=6*t;}
    else if(move==='sh'||move==='heavy'){leadPunch(-1.35*t);offArm(.45*t);lean=facing*(.08+.20*t);}
    else if(move==='super'){punchArmL=-.9*Math.sin(q*Math.PI);punchArmR=.9*Math.sin(q*Math.PI);lean=facing*.10*Math.sin(q*Math.PI);}
  } else if(charId==='g1_ice'){
    if(move==='us'){leadPunch(-1.75*t);offArm(.2*t);lean=facing*.04*t;}
    else if(move==='ds'){leadPunch(.85*t);offArm(.45*t);lean=facing*.14*t;bob=6*t;}
    else if(move==='ss'){leadPunch(-1.9*t);offArm(.15*t);lean=facing*(.05+.20*t);}
    else if(move==='uh'){leadPunch(-1.45*t);offArm(-1.1*t);lean=facing*.08*t;}
    else if(move==='dh'){leadPunch(-1.65*t);offArm(.3*t);lean=facing*.18*t;}
    else if(move==='sh'||move==='heavy'){leadPunch(-2.0*t);offArm(.55*t);lean=facing*.12*t;}
    else if(move==='super'){punchArmL=-.7*Math.sin(q*Math.PI);punchArmR=1.35*Math.sin(q*Math.PI);lean=facing*.12*Math.sin(q*Math.PI);}
  } else {
    if(move==='us'){leadPunch(-1.45*t);offArm(.35*t);lean=facing*(.05+.13*t);legSwing=.12*t;}
    else if(move==='ds'){punchArmL=.72*t;punchArmR=-.72*t;lean=-facing*.14*t;legSwing=.18*t;bob=5*t;}
    else if(move==='ss'){leadPunch(-1.7*t);offArm(.18*t);lean=facing*(.05+.22*t);legSwing=.12*t;}
    else if(move==='uh'){leadPunch(-1.35*t);offArm(.72*t);lean=facing*(.08+.18*t);legSwing=-.28*t;}
    else if(move==='dh'){leadPunch(-.72*t);offArm(.62*t);lean=-facing*.16*t;legSwing=-.38*t;bob=5*t;}
    else if(move==='sh'||move==='heavy'){leadPunch(-1.28*t);offArm(.32*t);lean=facing*(.08+.26*t);legSwing=.25*t;}
    else if(move==='super'){punchArmL=-1.15*Math.sin(q*Math.PI);punchArmR=1.15*Math.sin(q*Math.PI);lean=Math.sin(q*Math.PI)*facing*.12;legSwing=.22*Math.sin(q*Math.PI);}
  }
  return {punchArmL,punchArmR,legSwing,lean,bob};
}


// Improved supers. Fire keeps its existing design; Water uses the single reference-native implementation above.
function fireFlameOrbitLegacy(ctx,cx,cy,rx,ry,start,end,color,alpha=1,count=7){
  for(let i=0;i<count;i++){
    const t=count===1 ? 0 : i/(count-1);
    const a=start+(end-start)*t;
    flameShape(ctx,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,5.5,color,alpha*.9,a+Math.PI/2);
  }
}

function fireSuper(ctx,x,y,p){
  const prev=FIRE_PERF_MODE; FIRE_PERF_MODE=true;
  try {
    const q=clamp01(p), c='#FF5A16', hot='#FF9A22', white='#FFF3B0';
    const charge=ease(clamp01(q/.34));
    const launch=ease(clamp01((q-.375)/.10));
    const travel=clamp01((q-.375)/.20);
    const impact=ease(clamp01((q-.575)/.22));
    // Two distinct lanes are presented first, making the opponent choose a response.
    for (const lane of [-1,1]) {
      const yLane=y-58+lane*(42-28*launch);
      const spread=1-charge*.55;
      fireRing(ctx,x+24+launch*18,yLane,18+charge*17,8+charge*7,hot,.55+charge*.3,lane*launch*2);
      if(q<.375 || q<.58){
        const endX=q<.375 ? x+96+launch*34 : x+80+travel*1030;
        const endY=yLane+lane*travel*5;
        const a=(1-launch)*.75+travel*.45;
        for(let k=0;k<5;k++){const t=k/4,px=x+26+(endX-(x+26))*t,py=yLane+(endY-yLane)*t-lane*5*Math.sin(t*Math.PI);fireBlob(ctx,px,py,5+launch*5,c,a*(.65+.2*Math.sin(t*Math.PI)),k+q*5);if(k%2===0)flameShape(ctx,px,py-4,4+launch*3,hot,a*.72,-Math.PI/2);}
        for(let i=0;i<2;i++) fireRay(ctx,x+45+i*18,yLane,-.1+lane*.08,10+i*2,a*.5,hot);
        if(q>.18){const cx=x+35+travel*990,cy=yLane;fireBlob(ctx,cx,cy,10+launch*18,hot,.7+launch*.25,q*6+lane);}
      }
    }
    // The committed lane snaps into one fast, high-energy projectile, not a lingering aura.
    if(q>=.375 && q<.575){
      const cx=x+40+travel*1080, cy=y-58;
      const radius=18+travel*12;
      fireBlob(ctx,cx,cy,radius,c,1- impact*.2,q*8);
      fireRing(ctx,cx,cy,radius+8,radius*.42,hot,.9*(1-impact),q*5);
      for(let k=0;k<4;k++){const t=k/3,px=x+24+(cx-radius*.55-(x+24))*t,py=y-58-3*t-8*Math.sin(t*Math.PI);fireBlob(ctx,px,py,7+5*Math.sin(t*Math.PI),hot,.7*(1-impact),k+q*8);if(k%2===0)flameShape(ctx,px,py-4,4,white,.68*(1-impact),-.4);}
      for(let i=0;i<3;i++) fireRay(ctx,cx-radius*.5,cy,-.14+i*.14,12+i*3,.55*(1-impact),hot);
    }
    if(impact>0){
      const cx=x+1120, cy=y-58, r=22+impact*72;
      fireLineBurstLite(ctx,cx,cy,r,impact,impact*8);
      fireBlob(ctx,cx,cy,14+impact*18,c,impact,q*9);
      for(let i=0;i<5;i++){const a=i/5*REF_TAU;flameShape(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.58,5+impact*3,hot,impact*.65,a+Math.PI/2);}
    }
  } finally { FIRE_PERF_MODE=prev; }
}


// Older generic Grass/Ice super stubs removed; detailed authored implementations below are the sole definitions.


// ─────────────────────────────────────────────────────────────────────────────
// Gen-I recovery and ground-pound animation sheets for Grass, Ice, Thunder,
// and Water. These are authored per element and use the same p progress value
// as the rest of the attack renderer. Effects are deterministic (no random
// particle allocation), so their cost does not grow over time.
function gen1Recovery(ctx,x,y,p,charId){
  const q=attackP(p), c=charId==='g1_grass'?'#7CFF28':charId==='g1_ice'?'#79DFFF':charId==='g1_thunder'?'#FFFF44':'#18BFFF';
  const white=charId==='g1_grass'?'#E4FF9C':'#F1FFFF';
  const wind=ease(clamp01(q/.22)), snap=ease(clamp01((q-.22)/.23)), lift=ease(clamp01((q-.46)/.34)), fade=1-ease(clamp01((q-.78)/.22));
  if(charId==='g1_grass'){
    // Side burst first; then the vine brace bends sharply upward at the redirect.
    const side=1-2*snap, sx=x+side*(12+34*snap), sy=y-28-8*wind-38*lift;
    grassVine(ctx,x-13,y-14,x+side*26,y-25,wind,.75,5);
    grassVine(ctx,x+side*26,y-25,sx,sy,lift,.95,7);
    grassBranch(ctx,sx-8,sy+10,24+16*lift,6,.88*fade,-1.18,false);
    leafBlade(ctx,sx,sy,10,25,-.7+lift*.3,c,.95*fade);
    leafBlade(ctx,sx+side*10,sy+9,7,18,.7,c,.78*fade);
    if(q>.52)for(let i=0;i<6;i++)leafBlade(ctx,sx+(i-2.5)*7,sy-14-i%2*5,4,11,-.4+i*.17,c,.6*fade);
  } else if(charId==='g1_ice'){
    // A fixed frost marker remains behind while the body snaps through a curved return path.
    const markerX=x+18, markerY=y-38, travel=ease(clamp01((q-.20)/.46));
    for(let i=0;i<7;i++){const aa=i/7*TAU;iceShard(ctx,markerX+Math.cos(aa)*15,markerY+Math.sin(aa)*9,3.5,10,-.2+i*.13,c,.65*(q<.72?1:fade));}
    const sx=lerp(x-26, x+22, travel), sy=lerp(y-30,y-76,travel)-Math.sin(travel*Math.PI)*18;
    if(q>.2){for(let i=0;i<=10;i++){const t=i/10,px=lerp(x-26,sx,t),py=lerp(y-30,sy,t)-Math.sin(t*Math.PI)*12;iceShard(ctx,px,py,4.5,10+(i%3)*2,-.55+t*.9,c,.66*fade);if(i%3===0)iceShard(ctx,px+3,py-2,2.5,7,.2,white,.62*fade);}}
    iceLargeIcicle(ctx,sx,sy,12,34,-.65+travel*.85,.95*fade);
    if(q>.42){iceShard(ctx,sx-11,sy+7,6,18,.9,c,.7*fade);iceShard(ctx,sx+12,sy-7,5,16,-.8,c,.65*fade);}
  } else if(charId==='g1_thunder'){
    // Compress low with a visible ground spark, then snap almost vertically upward.
    const sx=x+Math.sin(q*TAU)*10, sy=y-8-66*lift;
    if(q<.25){lineBolt(ctx,x-12,y-3,20,8,c,.45+.35*wind);dot(ctx,x+18,y-4,3,white,.75);}
    const pts=[[x-18,y-24],[x-28+12*snap,y-13],[x-8+10*snap,sy+13],[sx,sy-10],[sx+9,sy-28]];
    for(let i=0;i<pts.length-1;i++){const a0=pts[i],b0=pts[i+1],mx=(a0[0]+b0[0])*.5,my=(a0[1]+b0[1])*.5;lineBolt(ctx,mx-5,my-7,15,19,c,.82*fade);}
    lineBolt(ctx,sx-12,sy-7,27,29,c,.95*fade);dot(ctx,sx+13,sy-29,4,white,.9*fade);
    if(q>.48)for(let i=0;i<4;i++)lineBolt(ctx,sx-20+i*13,sy+5+i*2,8,11,c,.6*fade);
  } else {
    // Water roll travels past the target before the pressure stream redirects upward.
    const roll=ease(clamp01(q/.48)), bounce=ease(clamp01((q-.40)/.38));
    const sx=x+8+42*roll-25*bounce, sy=y-34-12*Math.sin(roll*TAU)-44*bounce;
    const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push([lerp(x-18,sx,t),lerp(y-24,sy,t)-Math.sin(t*Math.PI)*18]);}
    waterCurve(ctx,pts,.95*fade,13);waterCurve(ctx,pts,white,.72*fade,3);
    waterOrb(ctx,sx,sy,13+9*bounce,.9*fade,q*4);waterSpray(ctx,sx,sy,-.7,1.4,9,.68*fade,q);
    if(q>.45){waterWave(ctx,sx,sy+8,1,bounce,fade*.75,q*4);waterDrop(ctx,sx+12,sy-20,3,.8*fade,-.6);}
  }
  if(q>.30&&q<.78){const a=Math.sin((q-.30)/.48*Math.PI);spark(ctx,x+18+20*snap,y-42-22*lift,3,c,.75*a);}
}
function gen1GroundPound(ctx,x,y,p,charId){
  const q=attackP(p), c=charId==='g1_grass'?'#7CFF28':charId==='g1_ice'?'#79DFFF':charId==='g1_thunder'?'#FFFF44':'#18BFFF';
  const white=charId==='g1_grass'?'#E4FF9C':'#F1FFFF';
  const dive=ease(clamp01(q/.58)), land=ease(clamp01((q-.58)/.19)), fade=1-ease(clamp01((q-.80)/.20));
  if(q<.59){
    if(charId==='g1_grass'){
      // Shallow diagonal leaf-first dive, with the stem/branch trailing the actual path.
      const dx=14+24*dive,dy=y-18-72*dive;
      grassBranch(ctx,dx-22,dy-4,30+12*dive,6,.78,-.68,false);
      leafBlade(ctx,dx,dy,11,27,-.72,c,.95);leafBlade(ctx,dx-8,dy+14,7,19,-.2,c,.82);
      grassVine(ctx,x+10,y-25,dx-4,dy+14,dive,.55,4);
    }else if(charId==='g1_ice'){
      // Pass the shoulder, then curve sharply to the floor rather than diving straight down.
      const dx=14+42*dive-10*dive*dive,dy=y-20-70*dive+13*dive*dive;
      iceLargeIcicle(ctx,dx,dy,17,46,-.42-dive*.75,.95);iceShard(ctx,dx-12,dy+13,6,17,.55,c,.72);
      if(dive>.45){iceShard(ctx,dx+9,dy-14,5,16,-.9,c,.7);}
    }else if(charId==='g1_thunder'){
      // Head-first approach twists into a shoulder-first diagonal on the final beat.
      const twist=ease(clamp01((dive-.72)/.28)),dx=12+34*dive,dy=y-18-76*dive;
      lineBolt(ctx,dx-14,dy-18,30,30,c,.92);lineBolt(ctx,x+8+(dx-x)*.45,y-25+38*dive,17,22,white,.78);lineBolt(ctx,dx-8,dy-8,23,21,c,.9);
    }else{
      // Tight corkscrew: three offset streams rotate around the diving pressure core.
      const angle=q*TAU*2.3,dx=14+20*Math.sin(angle),dy=y-20-75*dive;
      const pts=[];for(let i=0;i<=15;i++){const t=i/15;pts.push([x+dx*t+Math.cos(angle+t*TAU*1.2)*10,lerp(y-24,dy+14,t)]);}
      waterCurve(ctx,pts,.9,10);waterCurve(ctx,pts,white,.68,2.4);waterOrb(ctx,dx,dy,12+4*Math.sin(angle),.88,q*5);
      waterDrop(ctx,dx+13*Math.cos(angle+1),dy+10*Math.sin(angle+1),2.4,.8,angle);
    }
    return;
  }
  // Landing: two uneven pulses; second is visibly farther out and weaker.
  const r1=18+70*land,r2=24+92*land, a1=fade,a2=fade*.62;
  if(charId==='g1_grass'){
    grassVine(ctx,x+10,y-3,x+r1,y-9,land,a1,6);grassVine(ctx,x-10,y-3,x-r1*.72,y-7,land,a1*.8,5);
    grassVine(ctx,x+10,y-3,x+r2,y-12,land,a2,3.5);grassVine(ctx,x-10,y-3,x-r2*.72,y-10,land,a2*.75,3);
    for(let i=0;i<6;i++){const d=(i+1)/7*r2;leafBlade(ctx,x+d,y-8-(i%2)*4,4,10,.4,c,a2);leafBlade(ctx,x-d*.72,y-7,4,9,-.4,c,a2*.8);}
  }else if(charId==='g1_ice'){
    icePlate(ctx,x,y-2,r1*.72,a1,q*4);icePlate(ctx,x,y-2,r2*.60,a2,q*4+1);
    for(let i=0;i<8;i++){const side=i%2?1:-1,d=side*(12+i*r2/10);iceShard(ctx,x+d,y-8,5,12+i%3*3,side*.6,c,(i<4?a1:a2)*.8);}
  }else if(charId==='g1_thunder'){
    for(let i=0;i<12;i++){const aa=Math.PI+i/11*Math.PI,xx=x+Math.cos(aa)*r1,yy=y-3+Math.sin(aa)*r1*.20;lineBolt(ctx,xx-4,yy-3,11,10,c,a1*.8);if(i%2===0){const bx=x+Math.cos(aa)*r2,by=y-3+Math.sin(aa)*r2*.18;lineBolt(ctx,bx-3,by-3,8,8,c,a2*.65);}}
  }else{
    waterWave(ctx,x,y-2,-1,land,a1,q*4);waterWave(ctx,x,y-2,1,land*.82,a1*.8,q*4+1);
    waterWave(ctx,x,y-2,-1,land*.84,a2,q*4+2);waterWave(ctx,x,y-2,1,land*.68,a2*.8,q*4+3);
    waterOrb(ctx,x,y-8,10+10*(1-land),a1*.7,q*5);
  }
  if(land>.2){for(let i=0;i<6;i++){const side=i%2?1:-1,d=side*(18+(i<3?r1:r2)*(i%3+1)/5);spark(ctx,x+d,y-8-(i%3)*3,2.2,white,(i<3?a1:a2)*.75);}}
}
function grassSuper(ctx,x,y,p){
  const q=attackP(p), c='#7CFF28', pale='#E4FF9C';
  const dash=ease(clamp01((q-.52)/.28)), finish=ease(clamp01((q-.78)/.22));
  // Sequential root traps are separate, not a circular aura.
  for(let i=0;i<3;i++){
    const tx=x+86+i*112, delay=i*.13, t=ease(clamp01((q-.18-delay)/.34));
    if(q>.18+delay){
      grassBranch(ctx,tx,y-3,78*t,7,.9*(1-finish*.6),-Math.PI/2,false);
      leafBlade(ctx,tx,y-3-78*t,8,22,-.25,c,.9*(1-finish*.5));
      grassVine(ctx,tx-22,y-12,tx+22,y-34,t,.68,4);
    }
  }
  const sx=x+20+dash*300,sy=y-55-18*Math.sin(q*TAU),trail=[];
  for(let i=0;i<=20;i++){const t=i/20;trail.push([lerp(x+18,sx,t),lerp(y-48,sy,t)-Math.sin(t*Math.PI)*20]);}
  if(q>.42&&q<.9){for(let i=0;i<7;i++){const t=i/6,px=lerp(x+18,sx,t),py=lerp(y-48,sy,t)-Math.sin(t*Math.PI)*20;leafBlade(ctx,px,py,8,22,-.7+t*1.25,c,.78*(1-finish*.3));leafBlade(ctx,px+5,py-4,4,13,.4+t*.5,pale,.62);}}
  else {for(let i=0;i<4;i++){const t=i/3,px=lerp(x+18,sx,t),py=lerp(y-48,sy,t)-Math.sin(t*Math.PI)*20;leafBlade(ctx,px,py,5,14,-.6+t*.9,c,.5);}}
  if(q>.78){const r=28+82*finish;grassFlower(ctx,sx,sy,finish,1,.95,q*2);glowArc(ctx,sx,sy,r,r*.55,0,TAU,c,5,.85);for(let i=0;i<8;i++)leafBlade(ctx,sx+Math.cos(i/8*TAU)*r,sy+Math.sin(i/8*TAU)*r*.55,6,16,i/8*TAU,pale,.75);}
}
function iceSuper(ctx,x,y,p){
  const q=attackP(p), c='#79DFFF', white='#F1FFFF';
  const charge=ease(clamp01(q/.3)), travel=ease(clamp01((q-.28)/.48)), ret=ease(clamp01((q-.7)/.3));
  const cx=x+30+travel*250-ret*205,cy=y-58-24*Math.sin(travel*Math.PI);
  if(q<.42){icePlate(ctx,x+28,y-2,22+charge*28,.85,charge*3);for(let i=0;i<5;i++)iceShard(ctx,x+28+(i-2)*10,y-20-charge*(30+i*5),5,15+charge*12,-.15+i*.08,c,.85);}
  // A guided frost path curves around the opponent lane, then returns to a close finisher.
  const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push([lerp(x+28,cx,t),lerp(y-56,cy,t)-Math.sin(t*Math.PI)*(42+travel*26)]);}
  if(q>.24){waterCurve(ctx,pts,.48+.2*ret,22);for(let i=2;i<pts.length;i+=4){const z=i/(pts.length-1),pt=pts[i];iceShard(ctx,pt[0],pt[1],5+2*ret,13+4*travel,Math.sin(z*TAU)*.5,c,.65);}}
  iceCrystal(ctx,cx,cy,.65+travel*.35,.9,q*4);
  if(q>.7){icePlate(ctx,cx,cy+8,32+ret*20,ret,.0);for(let i=0;i<7;i++)iceShard(ctx,cx+(i-3)*11,cy-18,6,18,-.3+i*.1,c,ret*.8);}
}

function thunderRecoveryOrPound(ctx,x,y,p,groundPound=false){
  const q=attackP(p),c='#FFFF44',white='#FFFFFF';
  if(!groundPound){
    const crouch=ease(clamp01(q/.24)),rise=ease(clamp01((q-.24)/.42)),sx=x+Math.sin(q*TAU)*9,sy=y-8-68*rise;
    if(q<.3){lineBolt(ctx,x-15,y-7,23,12,c,.7);dot(ctx,x+16,y-4,3,white,.85);}
    const pts=[[x-20,y-25],[x-29+14*crouch,y-12],[x-7+12*crouch,sy+16],[sx,sy],[sx+10,sy-26]];
    for(let i=0;i<pts.length-1;i++){const a0=pts[i],b0=pts[i+1],mx=(a0[0]+b0[0])*.5,my=(a0[1]+b0[1])*.5;lineBolt(ctx,mx-5,my-7,15,19,c,.82);if(i%2===0)lineBolt(ctx,mx-2,my-5,9,13,white,.72);}
    lineBolt(ctx,sx-13,sy-6,28,30,c,.95);dot(ctx,sx+12,sy-27,4.5,white,.95);
    if(q>.45)for(let i=0;i<5;i++)lineBolt(ctx,sx-22+i*11,sy+4+i*2,10,12,c,.62*(1-q*.25));
  }else{
    const dive=ease(clamp01(q/.565)),twist=ease(clamp01((dive-.70)/.30)),land=ease(clamp01((q-.565)/.12)),fade=1-ease(clamp01((q-.8)/.2));
    if(q<.566){const sx=12+34*dive,sy=y-18-76*dive;lineBolt(ctx,sx-14,sy-20,31,32,c,.95);lineBolt(ctx,x+12+(sx-x)*.45,y-20-38*dive,18,24,white,.76);lineBolt(ctx,sx-7,sy-7,27,25,c,.9);}
    else{const r1=18+70*land,r2=24+92*land;for(let i=0;i<12;i++){const aa=i/12*TAU,xx=x+Math.cos(aa)*r1,yy=y-3+Math.sin(aa)*r1*.20;lineBolt(ctx,xx-4,yy-3,11,10,c,fade*.8);if(i%2===0)lineBolt(ctx,x+Math.cos(aa)*r2-3,y-3+Math.sin(aa)*r2*.18-3,8,8,c,fade*.55);}}
  }
}

function drawNonFireRecoveryAndPound(ctx,x,y,p,charId,move){
  if(move==='recovery'){
    if(charId==='g1_thunder')thunderRecoveryOrPound(ctx,x,y,p,false);else gen1Recovery(ctx,x,y,p,charId);
    return true;
  }
  if(move==='groundPound'){
    if(charId==='g1_thunder')thunderRecoveryOrPound(ctx,x,y,p,true);else gen1GroundPound(ctx,x,y,p,charId);
    return true;
  }
  return false;
}


// ═════════════════════════════════════════════════════════════════════════════
// Gen-I v2 hero artwork (Grass / Ice / Water). Every shape drawn here comes from
// getGen1Rig(), the same skeleton the hitbox uses, so art and collision can't drift.
// No shadowBlur is used (layered strokes fake the glow), so these are cheap to draw.
// ═════════════════════════════════════════════════════════════════════════════
const HC = {
  g1_grass:{main:'#3FBF4A',dark:'#17582A',light:'#B8F77E',acc:'#FFD84D',pale:'#9CE88A'},
  g1_ice:  {main:'#7FE3FF',dark:'#2A7FB8',light:'#F4FDFF',acc:'#BFF3FF',pale:'#CFF3FF'},
  g1_water:{main:'#2F9BFF',dark:'#0E4C9E',light:'#D4F2FF',acc:'#FFFFFF',pale:'#8FD3FF'}
};
function hLeaf(ctx,x,y,len,ang,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.5,-len*.38,len,0);ctx.quadraticCurveTo(len*.5,len*.38,0,0);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len*.9,0);ctx.stroke();ctx.restore();}
function hShard(ctx,x,y,len,ang,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-len*.14);ctx.lineTo(len,0);ctx.lineTo(0,len*.14);ctx.lineTo(-len*.12,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#FFFFFF';ctx.globalAlpha=a*.8;ctx.lineWidth=1;ctx.stroke();ctx.restore();}
function hDrop(ctx,x,y,r,col,a,ang=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-r*1.6);ctx.quadraticCurveTo(r*1.1,-r*.2,0,r);ctx.quadraticCurveTo(-r*1.1,-r*.2,0,-r*1.6);ctx.fill();ctx.globalAlpha=a*.8;ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(-r*.3,-r*.1,r*.25,0,TAU);ctx.fill();ctx.restore();}
function hRibbon(ctx,pts,w0,w1,fill,a,edge){
  const n=pts.length;if(n<2)return;const L=[],R=[];
  for(let i=0;i<n;i++){const p=pts[i],pr=pts[Math.max(0,i-1)],nx=pts[Math.min(n-1,i+1)];let dx=nx[0]-pr[0],dy=nx[1]-pr[1];const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const w=lerp(w0,w1,i/(n-1))/2;L.push([p[0]-dy*w,p[1]+dx*w]);R.push([p[0]+dy*w,p[1]-dx*w]);}
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=fill;ctx.beginPath();L.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));for(let i=n-1;i>=0;i--)ctx.lineTo(R[i][0],R[i][1]);ctx.closePath();ctx.fill();
  if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1.4;ctx.stroke();}ctx.restore();
}
function hLine(ctx,pts,col,w,a){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore();}
function hHex(ctx,x,y,r,rot,fill,a,edge='#FFFFFF'){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=a;ctx.fillStyle=fill;ctx.beginPath();for(let i=0;i<6;i++){const t=i/6*TAU,rr=i%2?r*.78:r;ctx.lineTo(Math.cos(t)*rr,Math.sin(t)*rr);}ctx.closePath();ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=1.4;ctx.stroke();ctx.globalAlpha=a*.6;ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.moveTo(-r*.1,-r*.8);ctx.lineTo(r*.5,-r*.2);ctx.lineTo(0,r*.05);ctx.closePath();ctx.fill();ctx.restore();}

// ── segments (limbs, vines, blades, jets) ──
function heroSeg(ctx,id,p,t){
  const C=HC[id],a=p.a??1,pts=p.pts,w=p.w;if(a<=.01||pts.length<1)return;
  const ghostRole=['trail','path','feint','slide','burst','blur','trailpath','sweep','frostarc','creep'].includes(p.role);
  if(id==='g1_grass'){
    if(ghostRole){hRibbon(ctx,pts,w*.9,w*.15,C.pale,a*.45);hLine(ctx,pts,C.light,1.5,a*.5);for(let i=1;i<pts.length;i+=2)hLeaf(ctx,pts[i][0],pts[i][1],7,(i*1.9)+t*.1,C.main,a*.55);return;}
    hRibbon(ctx,pts,w+5,w*.5+3,C.dark,a*.85);hRibbon(ctx,pts,w,w*.45,C.main,a);hLine(ctx,pts,C.light,Math.max(1.5,w*.22),a*.7);
    for(let i=1;i<pts.length;i++){const q=pts[i],pr=pts[i-1],ang=Math.atan2(q[1]-pr[1],q[0]-pr[0]);const s=(i%2?1:-1);hLeaf(ctx,q[0],q[1],w*1.1+4,ang+s*.95,C.main,a*.95);hLeaf(ctx,q[0],q[1],w*.8+3,ang-s*.95,C.light,a*.8);if(p.role==='lance'||p.role==='ram'||p.role==='lowvine'){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=C.dark;ctx.translate(q[0],q[1]);ctx.rotate(ang+s*1.6);ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(0,-6);ctx.lineTo(2,0);ctx.fill();ctx.restore();}}
  }else if(id==='g1_ice'){
    if(ghostRole){hRibbon(ctx,pts,w*.8,1,C.pale,a*.4);hLine(ctx,pts,'#FFFFFF',1.4,a*.6);for(let i=0;i<pts.length;i+=2)hShard(ctx,pts[i][0],pts[i][1],7,i*1.4+t*.1,C.main,a*.6);return;}
    hRibbon(ctx,pts,w+3,2,C.dark,a*.8);hRibbon(ctx,pts,w,1.5,C.main,a,'#FFFFFF');hLine(ctx,pts,'#FFFFFF',Math.max(1.2,w*.16),a*.8);
    for(let i=1;i<pts.length;i++){const q=pts[i],pr=pts[i-1],ang=Math.atan2(q[1]-pr[1],q[0]-pr[0]);hShard(ctx,q[0],q[1],w*.9+4,ang+1.1,C.light,a*.9);hShard(ctx,q[0],q[1],w*.7+3,ang-1.1,C.main,a*.9);}
  }else{
    if(ghostRole){hRibbon(ctx,pts,w*.8,1.5,C.pale,a*.4);hLine(ctx,pts,'#FFFFFF',1.2,a*.5);return;}
    hRibbon(ctx,pts,w+6,w*.4+2,C.dark,a*.35);hRibbon(ctx,pts,w,w*.4,C.main,a*.92);hRibbon(ctx,pts,w*.55,w*.2,C.pale,a*.9);hLine(ctx,pts,'#FFFFFF',Math.max(1.2,w*.14),a*.75);
    for(let i=1;i<pts.length;i++){const q=pts[i],s=(i%2?1:-1);hDrop(ctx,q[0]+Math.sin(t*.3+i)*3,q[1]+s*(w*.7+3),2+w*.1,C.pale,a*.85,s*.6);}
  }
}
// ── orbs (fists, shoulders, crystals, buds, geysers) ──
function heroOrb(ctx,id,p,t){
  const C=HC[id],a=p.a??1,r=p.r,x=p.x,y=p.y;if(a<=.01)return;
  if(id==='g1_grass'){
    if(p.role==='aura'){ctx.save();ctx.globalAlpha=a*.55;ctx.strokeStyle=C.main;ctx.lineWidth=4;ctx.setLineDash([14,8]);ctx.beginPath();ctx.ellipse(x,y,r,r*.85,t*.15,0,TAU);ctx.stroke();ctx.restore();for(let i=0;i<8;i++){const an=i/8*TAU+t*.15;hLeaf(ctx,x+Math.cos(an)*r,y+Math.sin(an)*r*.85,12,an+1.6,C.main,a*.85);}return;}
    if(p.role==='bloom'){for(let i=0;i<8;i++)hLeaf(ctx,x,y,r*.9,i/8*TAU+t*.1,i%2?C.acc:'#FF8FB8',a*.9);ctx.save();ctx.globalAlpha=a;ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(x,y,r*.2,0,TAU);ctx.fill();ctx.restore();return;}
    if(p.role==='coil'){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=C.main;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r,0,TAU*.8);ctx.stroke();ctx.restore();return;}
    // bud / shoulder pad / heel guard: layered seed-pod with petals
    for(let i=0;i<6;i++)hLeaf(ctx,x,y,r*1.15,i/6*TAU+t*.12,i%2?C.main:C.light,a*.9);
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle=C.dark;ctx.beginPath();ctx.arc(x,y,r*.62,0,TAU);ctx.fill();ctx.fillStyle=C.main;ctx.beginPath();ctx.arc(x,y,r*.5,0,TAU);ctx.fill();ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(x-r*.12,y-r*.12,r*.2,0,TAU);ctx.fill();ctx.restore();
  }else if(id==='g1_ice'){
    if(p.role==='burst'){for(let i=0;i<10;i++){const an=i/10*TAU+t*.08;hShard(ctx,x+Math.cos(an)*r*.3,y+Math.sin(an)*r*.3,r*(.6+.4*((i*7)%3)/2),an,i%2?C.light:C.main,a*.9);}hHex(ctx,x,y,r*.3,t*.1,C.light,a);return;}
    if(p.role==='maul'){hHex(ctx,x,y,r,.3,C.main,a);hHex(ctx,x+r*.55,y-r*.35,r*.55,1,C.light,a);hHex(ctx,x-r*.5,y+r*.4,r*.5,.1,C.acc,a);for(let i=0;i<4;i++)hShard(ctx,x+r*.6,y-r*.1+(i-1.5)*r*.45,r*.9,(i-1.5)*.35,C.light,a*.9);return;}
    if(p.role==='body'){ctx.save();ctx.globalAlpha=a*.5;ctx.fillStyle=C.pale;ctx.beginPath();ctx.ellipse(x,y,r*.85,r,0,0,TAU);ctx.fill();ctx.restore();hHex(ctx,x,y,r*.45,t*.1,C.main,a*.9);return;}
    if(p.role==='lift'){ctx.save();ctx.globalAlpha=a*.4;ctx.strokeStyle=C.light;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,r,r*.5,0,0,TAU);ctx.stroke();ctx.restore();return;}
    hHex(ctx,x,y,r,t*.05,C.main,a);for(let i=0;i<5;i++)hShard(ctx,x,y,r*1.5,i/5*TAU+t*.05+.3,C.light,a*.85);
  }else{
    if(p.role==='mark'){ctx.save();ctx.globalAlpha=a*.8;ctx.strokeStyle=C.pale;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y,r,r*.5,0,0,TAU);ctx.stroke();ctx.globalAlpha=a*.5;ctx.beginPath();ctx.ellipse(x,y,r*.55,r*.28,0,0,TAU);ctx.stroke();ctx.restore();hDrop(ctx,x,y-2,Math.max(3,r*.28),C.main,a);return;}
    if(p.role==='grip'){ctx.save();ctx.globalAlpha=a*.6;ctx.strokeStyle=C.pale;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,r*.7,-1.2,1.2);ctx.stroke();ctx.beginPath();ctx.arc(x-4,y,r*.5,1.9,TAU-1.9);ctx.stroke();ctx.restore();return;}
    if(p.role==='roll'){ctx.save();ctx.translate(x,y);ctx.rotate(p.rot||0);ctx.globalAlpha=a;ctx.strokeStyle=C.pale;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,TAU*.75);ctx.stroke();ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*.6,0,TAU*.6);ctx.stroke();ctx.restore();return;}
    // droplet-orb: body, rim, rotating highlight, ripple ring
    ctx.save();ctx.globalAlpha=a*.35;ctx.fillStyle=C.dark;ctx.beginPath();ctx.arc(x,y,r*1.12,0,TAU);ctx.fill();ctx.globalAlpha=a*.92;ctx.fillStyle=C.main;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.globalAlpha=a*.85;ctx.fillStyle=C.pale;ctx.beginPath();ctx.arc(x-r*.18,y-r*.18,r*.62,0,TAU);ctx.fill();ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.ellipse(x-r*.38,y-r*.42,r*.22,r*.14,-.6,0,TAU);ctx.fill();ctx.globalAlpha=a*.6;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(x,y,r*(1.25+.1*Math.sin(t*.3)),r*.55,0,0,TAU);ctx.stroke();ctx.restore();
    for(let i=0;i<4;i++){const an=i/4*TAU+t*.2;hDrop(ctx,x+Math.cos(an)*r*1.4,y+Math.sin(an)*r*1.0,2.2,C.pale,a*.8,an);}
  }
}
// ── ground waves (roots, spikes, crests) ──
function heroGround(ctx,id,p,t){
  const C=HC[id],a=p.a??1,y=p.y,x0=Math.min(p.x0,p.x1),x1=Math.max(p.x0,p.x1);if(a<=.01||x1-x0<2)return;
  const sp=Math.max(9,Math.min(16,(x1-x0)/6));
  if(id==='g1_grass'){
    if(p.role==='creep')return;
    hLine(ctx,[[x0,y],[(x0+x1)/2,y-3],[x1,y]],C.dark,5,a*.8);hLine(ctx,[[x0,y],[(x0+x1)/2,y-3],[x1,y]],C.main,3,a);
    if(p.role==='crack')return;
    let k=0;for(let x=x0+sp/2;x<=x1;x+=sp,k++){const h=(p.role==='roots'?20:12)+((k*7)%5)*(p.role==='roots'?5:2),lean=Math.sin(k*1.7)*4;ctx.save();ctx.globalAlpha=a;ctx.fillStyle=C.dark;ctx.beginPath();ctx.moveTo(x-4,y);ctx.quadraticCurveTo(x+lean,y-h*.6,x+lean*1.6,y-h);ctx.quadraticCurveTo(x+lean+3,y-h*.5,x+4,y);ctx.fill();ctx.fillStyle=C.main;ctx.beginPath();ctx.moveTo(x-2.5,y);ctx.quadraticCurveTo(x+lean,y-h*.6,x+lean*1.6,y-h);ctx.quadraticCurveTo(x+lean+2,y-h*.5,x+2.5,y);ctx.fill();ctx.restore();if(k%2===0)hLeaf(ctx,x+lean,y-h*.55,9,-1.1+(k%4)*.5,C.light,a*.9);}
  }else if(id==='g1_ice'){
    hLine(ctx,[[x0,y],[x1,y]],C.pale,3,a*.55);
    if(p.role==='creep'){return;}
    let k=0;for(let x=x0+sp/2;x<=x1;x+=sp,k++){const h=(p.role==='spikes2'?12:20)+((k*5)%4)*7;ctx.save();ctx.globalAlpha=a;ctx.fillStyle=k%2?C.main:C.light;ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+Math.sin(k)*3,y-h);ctx.lineTo(x+5,y);ctx.closePath();ctx.fill();ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
  }else{
    ctx.save();ctx.globalAlpha=a*.9;ctx.fillStyle=C.main;ctx.beginPath();ctx.moveTo(x0,y+3);let k=0;for(let x=x0;x<x1;x+=sp,k++){const h=10+((k*3)%4)*4+(p.role==='wave2'?-3:2);ctx.quadraticCurveTo(x+sp*.5,y-h*1.6,x+sp,y-h*.3);}ctx.lineTo(x1,y+3);ctx.closePath();ctx.fill();ctx.globalAlpha=a*.8;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();
    for(let x=x0+4;x<x1;x+=sp*1.5)hDrop(ctx,x,y-14-((x*3)%7),2,C.pale,a*.8);
  }
}
function heroMark(ctx,id,p,t){
  const C=HC[id],a=p.a??1,r=p.r;if(a<=.01)return;
  ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=a;
  if(id==='g1_grass'){ctx.strokeStyle=C.light;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r,r*.35,0,0,TAU);ctx.stroke();for(let i=0;i<4;i++){ctx.save();ctx.rotate(i/4*TAU+t*.05);hLeaf(ctx,r*.5,0,r*.7,0,C.main,a);ctx.restore();}}
  else if(id==='g1_ice'){ctx.rotate(p.rot||0);ctx.strokeStyle=C.light;ctx.lineWidth=2;for(let i=0;i<6;i++){ctx.rotate(TAU/6);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r,0);ctx.moveTo(r*.6,0);ctx.lineTo(r*.8,r*.2);ctx.moveTo(r*.6,0);ctx.lineTo(r*.8,-r*.2);ctx.stroke();}}
  else{ctx.strokeStyle=C.pale;ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.globalAlpha=a*(1-i*.3);ctx.beginPath();ctx.ellipse(0,0,r*(1+i*.55),r*(1+i*.55)*.4,0,0,TAU);ctx.stroke();}}
  ctx.restore();
}
function heroGhost(ctx,id,p){
  const C=HC[id],x=p.x;ctx.save();ctx.globalAlpha=Math.max(0,p.a)*.38;ctx.fillStyle=C.main;ctx.strokeStyle=C.light;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(x,-90,10,0,TAU);ctx.fill();ctx.stroke();ctx.lineCap='round';ctx.lineWidth=15;ctx.strokeStyle=C.main;ctx.beginPath();ctx.moveTo(x,-76);ctx.lineTo(x,-40);ctx.stroke();ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-4,-40);ctx.lineTo(x-8,-2);ctx.moveTo(x+4,-40);ctx.lineTo(x+8,-2);ctx.stroke();ctx.restore();
}
function heroImpact(ctx,id,x,y,k,t){
  const C=HC[id];if(k<=0)return;const n=8;
  for(let i=0;i<n;i++){const an=i/n*TAU+t*.04,d=8+26*k,a=1-k*.8;
    if(id==='g1_grass')hLeaf(ctx,x+Math.cos(an)*d,y+Math.sin(an)*d,10,an,i%2?C.main:C.light,a);
    else if(id==='g1_ice')hShard(ctx,x+Math.cos(an)*d,y+Math.sin(an)*d,11,an,i%2?C.light:C.main,a);
    else hDrop(ctx,x+Math.cos(an)*d,y+Math.sin(an)*d,3,i%2?C.pale:C.main,a,an+1.57);}
}
const HOLD_ANCHOR={us:[14,-96],ds:[22,-8],ss:[30,-54],sh:[30,-56],uh:[14,-112],dh:[0,-8],recovery:[0,-46],groundPound:[0,-40],super:[28,-58]};
function heroHold(ctx,id,move,q){
  const [ax,ay]=HOLD_ANCHOR[move]||[24,-50],C=HC[id],r=5+q*9,t=q*40;
  heroOrb(ctx,id,{x:ax,y:ay,r,a:.55+.3*q,role:'bud'},t);
  for(let i=0;i<6;i++){const an=i/6*TAU+q*9,d=(1-q*.55)*(26+i%2*8);
    if(id==='g1_grass')hLeaf(ctx,ax+Math.cos(an)*d,ay+Math.sin(an)*d*.7,8,an+Math.PI,C.main,.6);
    else if(id==='g1_ice')hShard(ctx,ax+Math.cos(an)*d,ay+Math.sin(an)*d*.7,8,an+Math.PI,C.light,.7);
    else hDrop(ctx,ax+Math.cos(an)*d,ay+Math.sin(an)*d*.7,2.4,C.pale,.7,an);}
}
function drawHeroAttack(ctx,x,y,p,move,charId){
  const t=(p<0?0:p)*60;
  ctx.save();ctx.translate(x,y);
  try{
    if(p<0){heroHold(ctx,charId,move,Math.max(0,Math.min(1,-p-1)));return;}
    const parts=getGen1Rig(charId,move,p),ph=gen1Phase(charId,move,p);
    // draw order: ground & ghosts & marks (back) → segments → orbs (front) → impact sparks
    for(const q of parts)if(q.t==='ghost')heroGhost(ctx,charId,q);
    for(const q of parts)if(q.t==='mark')heroMark(ctx,charId,q,t);
    for(const q of parts)if(q.t==='ground')heroGround(ctx,charId,q,t);
    for(const q of parts)if(q.t==='seg')heroSeg(ctx,charId,q,t);
    for(const q of parts)if(q.t==='orb')heroOrb(ctx,charId,q,t);
    // contact flash at the leading hit shape on the first frames of the active window and just after
    const lead=parts.filter(q=>q.t==='orb'&&q.hit>0).slice(-1)[0]||parts.filter(q=>q.t==='orb').slice(-1)[0];
    if(lead&&(ph.act||(ph.post&&ph.rec<.18))){const k=ph.act?clamp01(ph.c*.6+.1):clamp01(.6+ph.rec*2);heroImpact(ctx,charId,lead.x,lead.y,k,t);}
  }finally{ctx.restore();}
}

// ── Body choreography: [windup-end, contact-end] keys, blended per phase ──
const POSE={
 g1_grass:{
  us:{lead:[.4,-1.9],off:[-.5,.5],lean:[-.10,.05],leg:[.35,.5],bob:[3,-6]},
  ds:{lead:[.5,.9],off:[.2,.4],lean:[-.14,.08],leg:[.3,.45],bob:[6,7]},
  ss:{lead:[-.7,-1.7],off:[.5,.2],lean:[-.06,.2],leg:[.15,.1],bob:[2,3]},
  uh:{lead:[-1.2,-2.6],off:[-1,-2.4],lean:[.1,0],leg:[.4,.7],bob:[-2,-10]},
  dh:{lead:[0,.3],off:[0,.3],lean:[0,.16],leg:[0,.1],bob:[0,8]},
  sh:{lead:[-.4,-1.5],off:[.6,.5],lean:[.22,.3],leg:[.5,.2],bob:[10,4]},
  recovery:{lead:[-1,-2.2],off:[.4,-.4],lean:[-.2,.1],leg:[.4,.3],bob:[2,-6]},
  groundPound:{lead:[-.6,.2],off:[-.6,.2],lean:[.12,.34],leg:[.4,.3],bob:[-2,6]},
  super:{lead:[-.9,-1.9],off:[-.9,.9],lean:[-.05,.18],leg:[.1,.3],bob:[0,2]}},
 g1_ice:{
  us:{lead:[-.3,-1.8],off:[.4,-1.2],lean:[.05,-.08],leg:[.2,.6],bob:[-2,-8]},
  ds:{lead:[.5,.9],off:[.5,-.9],lean:[.1,-.12],leg:[.5,.7],bob:[5,6]},
  ss:{lead:[-1,-1.9],off:[.2,.3],lean:[-.04,.2],leg:[.05,.15],bob:[0,2]},
  uh:{lead:[-.9,-2.7],off:[-.9,-2.3],lean:[.08,.04],leg:[.2,.4],bob:[-1,-9]},
  dh:{lead:[-.2,.3],off:[-.2,.3],lean:[-.04,.1],leg:[0,.1],bob:[0,6]},
  sh:{lead:[-2.6,-1.35],off:[-2,.5],lean:[-.1,.28],leg:[.1,.3],bob:[-2,5]},
  recovery:{lead:[-1.2,-1.8],off:[.4,.5],lean:[-.1,.1],leg:[.3,.2],bob:[-3,-5]},
  groundPound:{lead:[-1.4,.4],off:[-1.4,.4],lean:[.2,.36],leg:[.3,.5],bob:[-6,6]},
  super:{lead:[-1.2,-2],off:[1.2,1.4],lean:[.1,.14],leg:[.1,.2],bob:[0,0]}},
 g1_water:{
  us:{lead:[.5,-2.2],off:[-.3,.3],lean:[.04,.16],leg:[.5,.6],bob:[3,-5]},
  ds:{lead:[.9,.4],off:[.3,-.4],lean:[.12,-.1],leg:[.1,.4],bob:[8,5]},
  ss:{lead:[-.5,-1.8],off:[.3,.2],lean:[-.02,.2],leg:[.1,.2],bob:[2,2]},
  uh:{lead:[-.9,-2],off:[-.9,-1.5],lean:[.12,-.06],leg:[.2,.5],bob:[4,-4]},
  dh:{lead:[.3,.5],off:[.3,.5],lean:[.18,.2],leg:[.7,.9],bob:[-8,9]},
  sh:{lead:[.3,-1.8],off:[-.5,.5],lean:[-.14,.28],leg:[.5,.3],bob:[4,3]},
  recovery:{lead:[-.6,-1.6],off:[.6,-.8],lean:[-.2,.14],leg:[.5,.4],bob:[0,-5]},
  groundPound:{lead:[-.4,.3],off:[-.4,.3],lean:[.1,.4],leg:[.6,.4],bob:[0,8]},
  super:{lead:[-1,-1.9],off:[1,1.9],lean:[.05,.12],leg:[.1,.3],bob:[0,0]}}
};
function gen1HeroBodyPose(move,p,facing,charId){
  const k=POSE[charId]?.[move];if(!k)return {punchArmL:0,punchArmR:0,legSwing:0,lean:facing*.05,bob:0};
  const ph=gen1Phase(charId,move,p),v=pair=>ph.act?lerp(pair[0],pair[1],ease(ph.c)):ph.post?lerp(pair[1],0,ease(ph.rec)):lerp(0,pair[0],ease(ph.w));
  let punchArmL=0,punchArmR=0;const lead=v(k.lead),off=v(k.off);
  if(facing>=0){punchArmR=lead;punchArmL=off;}else{punchArmL=-lead;punchArmR=-off;}
  return {punchArmL,punchArmR,legSwing:v(k.leg),lean:facing*v(k.lean),bob:v(k.bob)};
}

export function drawGen1Attack(ctx,x,y,color,p,facing,charId,move,attack=null){
  ctx.save();
  try {
    ctx.translate(x,y); ctx.scale(facing<0?-1:1,1);
    if(charId==='g1_grass'||charId==='g1_ice'||charId==='g1_water'){ drawHeroAttack(ctx,0,0,p,move,charId); return; }
    // Render the actual hero-specific animation functions. Do not short-circuit
    // into a shared generic geometry overlay: that overlay made every hero's
    // attacks look alike and hid the authored choreography below.
    if (move === 'super') {
      if (charId === 'g1_fire') fireSuper(ctx,0,0,p);
      else if (charId === 'g1_grass') grassSuper(ctx,0,0,p);
      else if (charId === 'g1_ice') iceSuper(ctx,0,0,p);
      else if (charId === 'g1_thunder') thunderSuper(ctx,0,0,p);
      else if (charId === 'g1_water') waterSuper(ctx,0,0,p);
    } else if(charId!=='g1_fire' && drawNonFireRecoveryAndPound(ctx,0,0,p,charId,move)) { /* hero-specific recovery / meteor art */ }
    else if(charId==='g1_thunder'){
      if(p < 0){
        thunderHold(ctx,0,0,move,Math.max(0,Math.min(1,-p-1)));
      } else if(move==='us') thunderUp(ctx,0,0,p); else if(move==='ds') thunderDown(ctx,0,0,Math.max(0,p)); else if(move==='ss') thunderSide(ctx,0,0,Math.max(0,p),false); else if(move==='sh'||move==='heavy') thunderSide(ctx,0,0,Math.max(0,p),true); else if(move==='uh'||move==='upHeavy') thunderUpHeavy(ctx,0,0,Math.max(0,p)); else if(move==='dh'||move==='downHeavy') thunderDownHeavy(ctx,0,0,Math.max(0,p));
    } else if(charId==='g1_fire') fireAttack(ctx,0,0,p,move,attack);
    else if(charId==='g1_water') waterAttack(ctx,0,0,p,move);
    else if(charId==='g1_grass') grassAttack(ctx,0,0,p,move,attack);
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
    // Use the dedicated super animation for each hero; never replace these with
    // a shared silhouette/effect pass.
    if(charId==='g1_fire') fireSuper(ctx,0,0,p);
    else if(charId==='g1_grass') drawHeroAttack(ctx,0,0,p,'super','g1_grass');
    else if(charId==='g1_ice') drawHeroAttack(ctx,0,0,p,'super','g1_ice');
    else if(charId==='g1_thunder') thunderSuper(ctx,0,0,p);
    else if(charId==='g1_water') drawHeroAttack(ctx,0,0,p,'super','g1_water');
  } finally {
    ctx.restore();
  }
}
