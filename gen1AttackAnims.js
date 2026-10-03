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


// Exact 12-frame-style Gen I Up Signature renderers based on the supplied
// animation sheets. `p` is normalized across the 12 logical frames.
function frame12(p) { return 1 + clamp01(p) * 11; }

// ─────────────────────────────────────────────────────────────────────────────
// FIRE / WATER / GRASS / ICE — full 12-frame authored Gen I animations.
// Every move is staged like the supplied Up Signature sheets: startup, wind-up,
// active creation/travel, impact/launch, recovery and idle.  The renderer is
// deliberately deterministic so the collision geometry can mirror these poses.
// ─────────────────────────────────────────────────────────────────────────────
function moveFrame(p) { return 1 + clamp01(p) * 11; }
function stageFade(f, a, b) { return Math.max(0, Math.min(1, (f - a) / Math.max(.001, b - a))); }
function streak(ctx, x1, y1, x2, y2, color, width=4, a=.7) {
  strokePath(ctx, [[x1,y1],[x2,y2]], color, width, a);
}
function ring(ctx, x, y, rx, ry, color, a=.8, width=6, rotation=0) {
  ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round';
  glow(ctx,color,width*2.4); ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rotation,0,TAU); ctx.stroke(); ctx.restore();
}

function fireUpExact(ctx, x, y, p) {
  const c='#FF6600', f=moveFrame(p), armX=x+18, hookY=y-90;
  // Supplied sheet: frame 1 idle, frame 2 hold/wind-up, frame 3 hook forms,
  // frames 4-6 active/catch, frame 7 neutral, frame 8-9 frozen/launch follow,
  // frame 10 hook release, frames 11-12 recovery.
  if (f < 2) return;
  if (f < 3) {
    strokePath(ctx,[[x+8,y-38],[armX,y-86]],c,10,.95);
    flame(ctx,armX+13,y-99,7,c,.95);
    return;
  }
  strokePath(ctx,[[x+8,y-38],[armX,hookY]],c,9,.95);
  const hookT=clamp01((f-3)/2.7), end=-.16;
  ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=10; ctx.lineCap='round'; glow(ctx,c,24);
  ctx.beginPath(); ctx.arc(armX,hookY,36,-2.2,-2.2+(end+2.2)*hookT); ctx.stroke(); ctx.restore();
  flame(ctx,armX+31,hookY-12,11,c,.95);
  if (f>=4 && f<=6) {
    const q=stageFade(f,4,6);
    for(let i=0;i<5;i++) streak(ctx,armX+28+i*4,hookY-8-i*3,armX+52+i*7,hookY-30-i*7,c,2.5,.7*(1-q*.35));
  }
  if (f>=7 && f<8) ring(ctx,armX,hookY,39,32,c,.42,4);
  if (f>=10) {
    const q=1-stageFade(f,10,12); ctx.save(); ctx.globalAlpha=q; ctx.strokeStyle=c; ctx.lineWidth=8; glow(ctx,c,18);
    ctx.beginPath(); ctx.arc(armX,hookY,38,-2.2,-.16); ctx.stroke(); ctx.restore();
  }
}

function fireDown(ctx,x,y,p){
  const c='#FF6600', f=moveFrame(p);
  if(f<2.5){ strokePath(ctx,[[x+10,y-5],[x-8,y+1]],c,8,.75); return; }
  if(f<4){ flame(ctx,x-2,y-8,9,c,.8); return; }
  const burst=stageFade(f,4,7);
  for(let i=0;i<4;i++){
    const ang=-Math.PI/2 + (i-1.5)*.58;
    const rr=8+burst*18;
    flame(ctx,x+Math.cos(ang)*rr,y-8+Math.sin(ang)*rr*.5,10+burst*5,c,.95,ang);
  }
  if(f>=7){ for(let i=0;i<5;i++) streak(ctx,x+(i-2)*8,y-8,x+(i-2)*13,y-25,c,2,.45*(12-f)); }
}
function fireSide(ctx,x,y,p){
  const c='#FF6600', f=moveFrame(p);
  const wind=stageFade(f,1,3), strike=stageFade(f,3,6), recover=stageFade(f,7,11);
  if(f<3){ strokePath(ctx,[[x+8,y-42],[x-8*wind,y-50]],c,10,.65+wind*.25); flame(ctx,x+2,y-46,14,c,.55); return; }
  ctx.save(); ctx.translate(x+20,y-43); ctx.rotate(-.45+strike*.95); flame(ctx,8+strike*24,0,21,c,.95); streak(ctx,-6,2,38+strike*25,2,c,9,.85); ctx.restore();
  if(f>=6&&f<9){ for(let i=0;i<4;i++) streak(ctx,x+42+i*6,y-48-i*4,x+64+i*8,y-52-i*5,c,2.4,.55); }
  if(f>=9){ ctx.save();ctx.globalAlpha=1-recover;ctx.strokeStyle=c;ctx.lineWidth=6;glow(ctx,c,14);ctx.beginPath();ctx.arc(x+28,y-43,24,-1.0,.55);ctx.stroke();ctx.restore(); }
}
function fireUpHeavy(ctx,x,y,p){
  const c='#FF6600',f=moveFrame(p), q=stageFade(f,2,8), r=28+q*50;
  if(f<3){ flame(ctx,x-18,y-42,12,c,.6); flame(ctx,x+18,y-42,12,c,.6); return; }
  ctx.save();ctx.translate(x,y-92-q*12);ctx.rotate(q*TAU*.9);ring(ctx,0,0,r,r*.72,c,.9,14);ctx.restore();
  for(let i=0;i<8;i++){const a=i/8*TAU+q*TAU;flame(ctx,x+Math.cos(a)*r,y-92-q*12+Math.sin(a)*r*.72,10,c,.75,a);}
  if(f>=8&&f<10) particles(ctx,x,y-92,c,stageFade(f,8,10),12,r*.6);
}
function fireDownHeavy(ctx,x,y,p){
  const c='#FF6600',f=moveFrame(p), q=stageFade(f,2,7);
  if(f<3){strokePath(ctx,[[x,y-8],[x,y+2]],c,8,.65);return;}
  for(let i=0;i<5;i++){
    const spread=(i-2)*24*q, mid=x+spread*.55, end=x+spread;
    strokePath(ctx,[[x,y-5],[mid,y+2],[end,y-30-(i%2)*8]],c,6,.7);
    if(f>=5) flame(ctx,end,y-32-(i%2)*8,13,c,stageFade(f,5,8));
  }
  if(f>=8) particles(ctx,x,y-24,c,stageFade(f,8,10),12,90);
}
function fireSideHeavy(ctx,x,y,p){
  const c='#FF6600',f=moveFrame(p),q=stageFade(f,2,7),ang=-1.0+q*1.9;
  if(f<3){strokePath(ctx,[[x+8,y-46],[x-16,y-58]],c,12,.8);return;}
  const gx=x+25+Math.cos(ang)*48, gy=y-45+Math.sin(ang)*48;
  ctx.save();ctx.translate(gx,gy);ctx.rotate(ang+.35);ctx.fillStyle=c;glow(ctx,c,26);ctx.globalAlpha=.95;ctx.beginPath();ctx.roundRect(-22,-28,58,56,18);ctx.fill();ctx.restore();
  streak(ctx,x+8,y-45,gx,gy,c,15,.8);
  if(f>=7){for(let i=0;i<7;i++)flame(ctx,gx+Math.cos(i)*26,gy+Math.sin(i)*20,8,c,.65,i*.7);}
}
function fireSuper(ctx,x,y,p){
  const c='#FF6600',f=moveFrame(p);
  if(f<4){flame(ctx,x-22,y-56,22,c,.7,-.25);flame(ctx,x+22,y-56,22,c,.7,.25);return;}
  const q=stageFade(f,4,7); const r=18+q*22;
  ctx.save();ctx.fillStyle='#FFF2A8';glow(ctx,c,30);ctx.globalAlpha=.95;ctx.beginPath();ctx.arc(x+14,y-58,r,0,TAU);ctx.fill();ctx.restore();
  if(f>=7){const e=stageFade(f,7,10),cx=x+82,cy=y-50,rr=10+e*62;ctx.save();ctx.fillStyle=c;glow(ctx,c,30);ctx.globalAlpha=1-e*.25;ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<16;i++){const a=i/16*TAU;streak(ctx,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,cx+Math.cos(a)*(rr+26*e),cy+Math.sin(a)*(rr+26*e),c,4,.65);}}
  if(f>=10){ctx.save();ctx.globalAlpha=1-stageFade(f,10,12);ctx.strokeStyle=c;ctx.lineWidth=8;glow(ctx,c,26);ctx.beginPath();ctx.arc(x+82,y-50,68,0,TAU);ctx.stroke();ctx.restore();}
}

function waterUpExact(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p);
  // Exact sequence from the supplied sheet: frame 1 ring around arm, 2 forms,
  // 3 separates, 4-6 travels on a short upward curve, 7 disappears, 8-9 idle.
  if(f<2){ring(ctx,x+5,y-34,22,16,c,.9,8,-.1);waterStroke(ctx,[[x-12,y-20],[x+8,y-38]],c,5,.8);return;}
  const t=clamp01((f-2)/5.0);const rx=x+15+56*t+8*Math.sin(t*Math.PI),ry=y-45-62*t-20*Math.sin(t*Math.PI);
  ring(ctx,rx,ry,22,14,c,f<7?.95:.45,9,-.15);
  waterStroke(ctx,[[x+8,y-40],[rx,ry]],c,4,.35*(1-t));
  for(let i=0;i<6;i++)dot(ctx,rx+Math.cos(i)*18,ry+Math.sin(i)*10,2,'#DFFFFF',.55);
  if(f>=5&&f<7) for(let i=0;i<5;i++) streak(ctx,rx-24-i*4,ry+6+i*2,rx-42-i*9,ry+10+i*5,c,2,.55);
  if(f>=7){const a=1-stageFade(f,7,9);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=5;ctx.beginPath();ctx.arc(rx,ry,24,0,TAU);ctx.stroke();ctx.restore();}
}
function waterDown(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p);
  if(f<3){waterStroke(ctx,[[x-10,y-12],[x-28,y-28]],c,8,.6);return;}
  const q=stageFade(f,3,6);
  for(const s of [-1,1]){const ex=x+s*(18+30*q),ey=y-10-58*q;waterStroke(ctx,[[x+s*10,y-10],[ex,ey+24],[ex+s*7,ey]],c,11,.9);for(let i=0;i<4;i++)dot(ctx,ex+s*i*5,ey-i*6,2.5,'#DFFFFF',.7);}
  if(f>=6) ring(ctx,x,y-20,38,22,c,.45,3);
}
function waterSide(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p),q=stageFade(f,2,6);
  if(f<3){waterStroke(ctx,[[x+5,y-42],[x+24,y-54]],c,8,.7);return;}
  const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push([x+12+78*q*t,y-44-Math.sin(t*Math.PI)*30*q]);}waterStroke(ctx,pts,c,10,.95);
  const tip=pts[pts.length-1];ring(ctx,tip[0],tip[1],10,7,c,.9,5,.2);
  if(f>=7) for(let i=0;i<6;i++)streak(ctx,tip[0],tip[1],tip[0]+22+i*8,tip[1]-6-i*5,c,2,.5);
}
function waterUpHeavy(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p),q=stageFade(f,2,8),spin=q*TAU*1.1;
  if(f<3){ring(ctx,x,y-32,25,18,c,.55,6);return;}
  const pts=[];for(let i=0;i<36;i++){const t=i/35,a=t*TAU+spin;pts.push([x+Math.cos(a)*54,y-64+Math.sin(a)*92]);}waterStroke(ctx,pts,c,13,.9);
  if(f>=6)for(let i=0;i<8;i++){const a=i/8*TAU+spin;dot(ctx,x+Math.cos(a)*54,y-64+Math.sin(a)*92,3,'#DFFFFF',.7);}
  if(f>=8)for(let i=0;i<8;i++){const a=-1.2+i*.34;streak(ctx,x+Math.cos(a)*52,y-64+Math.sin(a)*86,x+Math.cos(a)*86,y-64+Math.sin(a)*110,c,3,.55);}
}
function waterDownHeavy(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p),q=stageFade(f,2,8),bx=x+70-140*q,by=y-46+Math.max(0,q-.45)*90;
  if(f<3){ring(ctx,x+58,y-52,20,15,c,.55,6);return;}
  ctx.save();ctx.fillStyle=c;ctx.globalAlpha=.9;glow(ctx,c,20);ctx.beginPath();ctx.arc(bx,by,28,0,TAU);ctx.fill();ctx.restore();
  if(f>=6){for(let i=0;i<10;i++){const dx=(i-4.5)*10;waterStroke(ctx,[[bx,by],[bx+dx,by-65*(q-.55)]],c,4,.65);}}
  if(f>=8)ring(ctx,bx,by,34,18,c,.4,3);
}
function waterSideHeavy(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p),q=stageFade(f,2,8),ang=-.9+q*1.8;
  if(f<3){ring(ctx,x+18,y-46,28,18,c,.55,7,.2);return;}
  ctx.save();ctx.translate(x+28,y-48);ctx.rotate(ang);ctx.strokeStyle=c;ctx.lineWidth=18;glow(ctx,c,24);ctx.beginPath();ctx.arc(0,0,78,-.85,.85);ctx.stroke();ctx.restore();
  if(f>=7){const tx=x+105*q,ty=y-48;ring(ctx,tx,ty,12,7,c,.65,4);for(let i=0;i<6;i++)streak(ctx,tx,ty,tx+20+i*8,ty+(i-2)*7,c,2,.45);}
}
function waterSuper(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p);
  const r=30+stageFade(f,2,6)*68;
  if(f<7)ring(ctx,x,y-52,r,r*.68,c,.85,14);
  if(f>=6){const e=stageFade(f,6,10),rr=r*(1-e);for(let i=0;i<20;i++){const a=i/20*TAU;streak(ctx,x+Math.cos(a)*r,y-52+Math.sin(a)*r*.68,x+Math.cos(a)*rr,y-52+Math.sin(a)*rr*.68,c,5,.6);}}
  if(f>=9){const e=stageFade(f,9,11),rr=8+e*112;ring(ctx,x,y-52,rr,rr*.68,c,1-e*.15,9);}
}

function grassUpExact(ctx,x,y,p){
  const c='#44AA44',f=moveFrame(p),cy=y-112;
  // Supplied sheet: seed frame 1; three leaves from frame 2; spin frames 3-7;
  // completed rotation frame 7; burst/launch frames 8-11; idle frame 12.
  if(f<2){dot(ctx,x,cy,5,'#DDBB55',.95);return;}
  const spin=((f-2)/6)*TAU;
  for(let i=0;i<3;i++)leaf(ctx,x,cy,13,34,i*TAU/3+spin,c,.95);
  dot(ctx,x,cy,7,'#DDBB55',.95);
  if(f>=3&&f<=7)ring(ctx,x,cy,40,17,c,.3,2);
  if(f>=8&&f<9){particles(ctx,x,cy,c,stageFade(f,8,9),12,28);for(let i=0;i<5;i++)streak(ctx,x-14+i*7,cy+8,x-10+i*5,cy-78-i*8,c,2.5,.55);}
}
function grassDown(ctx,x,y,p){
  const c='#44AA44',f=moveFrame(p),q=stageFade(f,2,6);
  if(f<3){strokePath(ctx,[[x-12,y-4],[x-22,y-20]],c,8,.6);strokePath(ctx,[[x+12,y-4],[x+22,y-20]],c,8,.6);return;}
  for(const s of [-1,1]){const ex=x+s*(18+28*q),ey=y-18;strokePath(ctx,[[x+s*12,y-4],[x+s*35,y-22],[ex,ey-32]],c,7,.9);for(let i=0;i<3;i++)leaf(ctx,ex+s*i*6,ey-32-i*4,5,11,s*.7,c,.8);}
  if(f>=7)for(let i=0;i<5;i++)dot(ctx,x+(i-2)*12,y-28,3,c,.5);
}
function grassSide(ctx,x,y,p){
  const c='#44AA44',wood='#8B6B3F',f=moveFrame(p),q=stageFade(f,2,6);
  if(f<3){strokePath(ctx,[[x+6,y-44],[x+26,y-46]],wood,8,.7);return;}
  ctx.save();ctx.translate(x+10,y-44);ctx.rotate(-.06);ctx.fillStyle=wood;ctx.globalAlpha=.95;glow(ctx,wood,10);ctx.fillRect(0,-7,78*q,14);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.strokeRect(0,-7,78*q,14);ctx.restore();
  for(let i=0;i<4;i++)leaf(ctx,x+22+i*15*q,y-42,4,9,i*.5,c,.65);
  if(f>=7)streak(ctx,x+78*q,y-44,x+104*q,y-47,c,2,.5);
}
function grassUpHeavy(ctx,x,y,p){
  const c='#44AA44',f=moveFrame(p),q=stageFade(f,2,8),r=22+q*70;
  if(f<3){ring(ctx,x,y-20,28,18,c,.45,5);return;}
  for(let i=0;i<8;i++){const a=i/8*TAU;leaf(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.55,12,28,a,c,.9);}
  ring(ctx,x,y-48,r,r*.55,c,.55,5);
  if(f>=7)for(let i=0;i<8;i++){const a=i/8*TAU;streak(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.55,x+Math.cos(a)*(r+18),y-48+Math.sin(a)*(r+10),c,2,.45);}
}
function grassDownHeavy(ctx,x,y,p){
  const c='#44AA44',f=moveFrame(p),q=stageFade(f,2,8);
  if(f<3){strokePath(ctx,[[x-25,y-104],[x-4,y-45]],c,9,.7);return;}
  const pts1=[[x-35,y-105],[x+25,y-30],[x+12,y+4]],pts2=[[x+12,y+4],[x-24,y-26],[x-10,y-66]];
  strokePath(ctx,pts1,c,11,.9);strokePath(ctx,pts2,c,10,.9);
  for(let i=0;i<7;i++)leaf(ctx,x-25+i*7*q,y-30+i*2,5,12,i*.8,c,.65);
  if(f>=8)particles(ctx,x+10,y-24,c,stageFade(f,8,10),10,60);
}
function grassSideHeavy(ctx,x,y,p){
  const c='#44AA44',wood='#8B6B3F',f=moveFrame(p),q=stageFade(f,2,8);
  if(f<3){strokePath(ctx,[[x+8,y-46],[x-10,y-60]],wood,11,.8);return;}
  ctx.save();ctx.translate(x+24,y-48);ctx.rotate(-.12+q*.55);ctx.fillStyle=wood;ctx.globalAlpha=.95;glow(ctx,wood,12);ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(112*q,0);ctx.lineTo(0,10);ctx.closePath();ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.restore();
  if(f>=6){const bx=x+76*q,by=y-48;for(let i=0;i<3;i++){const a=-.22+i*.22;strokePath(ctx,[[bx,by],[bx+Math.cos(a)*48,by+Math.sin(a)*48]],wood,8,.9);}}
  if(f>=8)for(let i=0;i<6;i++)leaf(ctx,x+112*q+i*8,y-48+(i-2.5)*5,4,10,i*.6,c,.6);
}
function grassSuper(ctx,x,y,p){
  const c='#44AA44',f=moveFrame(p),q=stageFade(f,2,9),r=28+q*92;
  for(let i=0;i<12;i++){const a=i/12*TAU;leaf(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.65,16,38,a,c,.85);}
  if(f>=6){const rr=r*(1-stageFade(f,6,10));for(let i=0;i<12;i++){const a=i/12*TAU;streak(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.65,x+Math.cos(a)*rr,y-48+Math.sin(a)*rr*.65,c,8,.7);}}
}

function iceUpExact(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p);
  // Supplied sheet: frame 1 shard appears, 2 grab, 3 throw, 4-7 curved flight,
  // 8-10 launch continuation, 11 peak, 12 fall/recovery.
  let sx=x+18,sy=y-82;
  if(f<2){shard(ctx,sx,y-92,10,24,0,c,.95);return;}
  if(f<3){shard(ctx,sx,sy,11,28,-.08,c,1);strokePath(ctx,[[x+10,y-38],[sx,y-64]],c,7,.9);return;}
  const t=clamp01((f-3)/6.5);sx=x+18+58*t;sy=y-82-112*t;shard(ctx,sx,sy,12,30,t*TAU*1.25,c,1);strokePath(ctx,[[x+10,y-42],[x+18+28*t,y-82-54*t]],c,4,.32);
  if(f>=4&&f<=8)for(let i=0;i<6;i++)streak(ctx,sx-i*7,sy+i*4,sx-22-i*10,sy+10+i*5,c,2,.45);
  if(f>=8&&f<10)particles(ctx,sx,sy,c,stageFade(f,8,10),8,20);
  if(f>=10){ctx.save();ctx.globalAlpha=1-stageFade(f,10,12);ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();ctx.arc(sx,sy,24,0,TAU);ctx.stroke();ctx.restore();}
}
function iceDown(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),q=stageFade(f,2,7);
  if(f<3){ring(ctx,x,y-8,46,11,c,.55,5);return;}
  ctx.save();ctx.strokeStyle=c;ctx.lineWidth=6;glow(ctx,c,14);ctx.globalAlpha=.9;ctx.beginPath();ctx.ellipse(x,y-8,48,12,0,0,TAU);ctx.stroke();ctx.restore();
  if(f>=5){for(let i=0;i<7;i++){const a=Math.PI*1.05+i/6*Math.PI*.9,sx=x+Math.cos(a)*52*q,sy=y-18+Math.sin(a)*35*q;shard(ctx,sx,sy,9,22,a,c,.9);}}
  if(f>=8)particles(ctx,x,y-20,c,stageFade(f,8,10),10,60);
}
function iceSide(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),q=stageFade(f,2,7),a=-1.15+q*2.3;
  if(f<3){shard(ctx,x+18,y-45,9,25,-.4,c,.7);return;}
  ctx.save();ctx.translate(x+20,y-45);ctx.rotate(a);ctx.strokeStyle=c;ctx.lineWidth=15;glow(ctx,c,20);ctx.beginPath();ctx.arc(0,0,38,-1.15,1.15);ctx.stroke();ctx.restore();
  if(f>=7){for(let i=0;i<7;i++)shard(ctx,x+60+i*8,y-45+Math.sin(i)*8,5,15,i*.7,c,.7);}
}
function iceUpHeavy(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),q=stageFade(f,2,8);
  if(f<3){for(let i=0;i<3;i++)shard(ctx,x+(i-1)*20,y-88,11,28,i*.7,c,.7);return;}
  for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+q*.7,sx=x+Math.cos(a)*76*q,sy=y-70+Math.sin(a)*76*q;shard(ctx,sx,sy,16,42,a,c,.95);}
  if(f>=7)for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+q*.7;streak(ctx,x+Math.cos(a)*50,y-70+Math.sin(a)*50,x+Math.cos(a)*104,y-70+Math.sin(a)*104,c,3,.5);}
}
function iceDownHeavy(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),q=stageFade(f,2,8),bx=x+28+104*q;
  if(f<3){ctx.save();ctx.fillStyle=c;ctx.globalAlpha=.7;ctx.fillRect(x-30,y-18,60,30);ctx.restore();return;}
  ctx.save();ctx.fillStyle=c;ctx.globalAlpha=.9;glow(ctx,c,18);ctx.fillRect(bx-34,y-18,68,34);ctx.restore();
  if(f>=7){const e=stageFade(f,7,9);shard(ctx,bx+38+28*e,y-30-20*e,14,28,-.6,c,.95);shard(ctx,bx-38-28*e,y-6+18*e,14,28,.6,c,.95);}
}
function iceSideHeavy(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),q=stageFade(f,2,8),a=-1.15+q*2.3;
  if(f<3){shard(ctx,x+20,y-46,12,34,-.4,c,.7);return;}
  ctx.save();ctx.translate(x+22,y-42);ctx.rotate(a);ctx.fillStyle=c;glow(ctx,c,22);ctx.fillRect(-14,-58,28,108);ctx.restore();
  if(f>=7){for(let i=0;i<8;i++)shard(ctx,x+78+i*9,y-42+Math.sin(i)*8,6,16,i*.6,c,.8);}
}
function iceSuper(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),cx=x+52,cy=y-54;
  if(f<7){ctx.save();ctx.fillStyle=c;glow(ctx,c,24);ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(cx,cy-100);ctx.lineTo(cx+42,cy-22);ctx.lineTo(cx+30,cy+70);ctx.lineTo(cx-18,cy+45);ctx.lineTo(cx-44,cy-24);ctx.closePath();ctx.fill();ctx.restore();}
  if(f>=5){const e=stageFade(f,5,11),r=24+e*110;for(let i=0;i<16;i++){const a=i/16*TAU;sx=cx+Math.cos(a)*r;sy=cy+Math.sin(a)*r*.72;shard(ctx,sx,sy,10,28,a,c,.95);}}
}

function fireAttack(ctx,x,y,p,move){
  if(move==='us')fireUpExact(ctx,x,y,p);else if(move==='ds')fireDown(ctx,x,y,p);else if(move==='ss')fireSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')fireUpHeavy(ctx,x,y,p);else if(move==='dh')fireDownHeavy(ctx,x,y,p);else if(move==='sh')fireSideHeavy(ctx,x,y,p);
}
function waterAttack(ctx,x,y,p,move){
  if(move==='us')waterUpExact(ctx,x,y,p);else if(move==='ds')waterDown(ctx,x,y,p);else if(move==='ss')waterSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')waterUpHeavy(ctx,x,y,p);else if(move==='dh')waterDownHeavy(ctx,x,y,p);else if(move==='sh')waterSideHeavy(ctx,x,y,p);
}
function grassAttack(ctx,x,y,p,move){
  if(move==='us')grassUpExact(ctx,x,y,p);else if(move==='ds')grassDown(ctx,x,y,p);else if(move==='ss')grassSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')grassUpHeavy(ctx,x,y,p);else if(move==='dh')grassDownHeavy(ctx,x,y,p);else if(move==='sh')grassSideHeavy(ctx,x,y,p);
}
function iceAttack(ctx,x,y,p,move){
  if(move==='us')iceUpExact(ctx,x,y,p);else if(move==='ds')iceDown(ctx,x,y,p);else if(move==='ss')iceSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')iceUpHeavy(ctx,x,y,p);else if(move==='dh')iceDownHeavy(ctx,x,y,p);else if(move==='sh')iceSideHeavy(ctx,x,y,p);
}

// The frame-based supers above are intentionally kept separate from the normal
// move functions so a Super never inherits a hold pose.
function fireSuperFrame(ctx,x,y,p){
  const c='#FF6600',f=moveFrame(p); if(f<4){flame(ctx,x-22,y-56,22,c,.7,-.25);flame(ctx,x+22,y-56,22,c,.7,.25);}
  const q=stageFade(f,4,7),r=18+q*22;ctx.save();ctx.fillStyle='#FFF2A8';glow(ctx,c,30);ctx.globalAlpha=.95;ctx.beginPath();ctx.arc(x+14,y-58,r,0,TAU);ctx.fill();ctx.restore();
  if(f>=7){const e=stageFade(f,7,10),cx=x+82,cy=y-50,rr=10+e*62;ctx.save();ctx.fillStyle=c;glow(ctx,c,30);ctx.globalAlpha=1-e*.25;ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<16;i++){const a=i/16*TAU;streak(ctx,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,cx+Math.cos(a)*(rr+26*e),cy+Math.sin(a)*(rr+26*e),c,4,.65);}}
}
function waterSuperFrame(ctx,x,y,p){const c='#3399CC',f=moveFrame(p),r=30+stageFade(f,2,6)*68;if(f<7)ring(ctx,x,y-52,r,r*.68,c,.85,14);if(f>=6){const e=stageFade(f,6,10),rr=r*(1-e);for(let i=0;i<20;i++){const a=i/20*TAU;streak(ctx,x+Math.cos(a)*r,y-52+Math.sin(a)*r*.68,x+Math.cos(a)*rr,y-52+Math.sin(a)*rr*.68,c,5,.6);}}if(f>=9){const e=stageFade(f,9,11);ring(ctx,x,y-52,8+e*112,(8+e*112)*.68,c,1-e*.15,9);}}
function grassSuperFrame(ctx,x,y,p){const c='#44AA44',f=moveFrame(p),q=stageFade(f,2,9),r=28+q*92;for(let i=0;i<12;i++){const a=i/12*TAU;leaf(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.65,16,38,a,c,.85);}if(f>=6){const rr=r*(1-stageFade(f,6,10));for(let i=0;i<12;i++){const a=i/12*TAU;streak(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.65,x+Math.cos(a)*rr,y-48+Math.sin(a)*rr*.65,c,8,.7);}}}
function iceSuperFrame(ctx,x,y,p){const c='#AAEEFF',f=moveFrame(p),cx=x+52,cy=y-54;if(f<7){ctx.save();ctx.fillStyle=c;glow(ctx,c,24);ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(cx,cy-100);ctx.lineTo(cx+42,cy-22);ctx.lineTo(cx+30,cy+70);ctx.lineTo(cx-18,cy+45);ctx.lineTo(cx-44,cy-24);ctx.closePath();ctx.fill();ctx.restore();}if(f>=5){const e=stageFade(f,5,11),r=24+e*110;for(let i=0;i<16;i++){const a=i/16*TAU;const sx=cx+Math.cos(a)*r,sy=cy+Math.sin(a)*r*.72;shard(ctx,sx,sy,10,28,a,c,.95);}}}

function drawGen1HoldPose(ctx, x, y, charId, move, holdFrame, holdTick = 0) {
  // The held state is a literal frozen animation frame. The four supplied Up
  // Signature sheets use frames 2/1/3/2 for Fire/Water/Grass/Ice respectively;
  // Thunder uses frame 2. Other attacks use frame 2 as their authored wind-up.
  const p = clamp01((Math.max(1, holdFrame) - 1) / 11);
  if (charId === 'g1_thunder' && move === 'us') { thunderUp(ctx,x,y,p); return; }
  if (charId === 'g1_fire' && move === 'us') { fireUpExact(ctx,x,y,(2-1)/11); return; }
  if (charId === 'g1_water' && move === 'us') { waterUpExact(ctx,x,y,(1-1)/11); return; }
  if (charId === 'g1_grass' && move === 'us') { grassUpExact(ctx,x,y,(3-1)/11); return; }
  if (charId === 'g1_ice' && move === 'us') { iceUpExact(ctx,x,y,(2-1)/11); return; }

  if (charId === 'g1_thunder') {
    if (move === 'ds') thunderDown(ctx,x,y,p);
    else if (move === 'ss') thunderSide(ctx,x,y,p,false);
    else if (move === 'sh') thunderSide(ctx,x,y,p,true);
    else if (move === 'upHeavy') thunderUpHeavy(ctx,x,y,p);
    else if (move === 'dh') thunderDownHeavy(ctx,x,y,p);
  } else if (charId === 'g1_fire') fireAttack(ctx,x,y,p,move);
  else if (charId === 'g1_water') waterAttack(ctx,x,y,p,move);
  else if (charId === 'g1_grass') grassAttack(ctx,x,y,p,move);
  else if (charId === 'g1_ice') iceAttack(ctx,x,y,p,move);
}

export function drawGen1Attack(ctx, x, y, color, p, facing, charId, move, attackData = null) {
  // Author everything in right-facing local space, then mirror it for left.
  ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1);
  const localY = 0;
  if (attackData?.holding) { drawGen1HoldPose(ctx, 0, localY, charId, move, attackData.holdFrame || 2, attackData.holdTick || 0); ctx.restore(); return; }
  if (charId === 'g1_thunder') {
    if (move === 'us') thunderUp(ctx, 0, localY, p);
    else if (move === 'ds') thunderDown(ctx, 0, localY, p);
    else if (move === 'ss') thunderSide(ctx, 0, localY, p, false);
    else if (move === 'sh') thunderSide(ctx, 0, localY, p, true);
    else if (move === 'upHeavy' || move === 'uh') thunderUpHeavy(ctx, 0, localY, p);
    else if (move === 'dh') thunderDownHeavy(ctx, 0, localY, p);
  } else if (charId === 'g1_fire') fireAttack(ctx, 0, localY, p, move);
  else if (charId === 'g1_water') waterAttack(ctx, 0, localY, p, move);
  else if (charId === 'g1_grass') grassAttack(ctx, 0, localY, p, move);
  else if (charId === 'g1_ice') iceAttack(ctx, 0, localY, p, move);
  ctx.restore();
}

export function drawGen1Super(ctx, x, y, p, facing, charId) {
  ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1);
  if (charId === 'g1_thunder') thunderSuper(ctx, 0, 0, p);
  else if (charId === 'g1_fire') fireSuper(ctx, 0, 0, p);
  else if (charId === 'g1_water') waterSuper(ctx, 0, 0, p);
  else if (charId === 'g1_grass') grassSuper(ctx, 0, 0, p);
  else if (charId === 'g1_ice') iceSuper(ctx, 0, 0, p);
  ctx.restore();
}
