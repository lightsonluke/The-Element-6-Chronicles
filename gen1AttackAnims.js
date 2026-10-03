// Generation I hand-authored attack animation system.
// IMPORTANT: every directional attack is authored facing RIGHT and mirrored
// with the canvas transform. This guarantees left/right are literal flips of
// the same move instead of two different animations.

const TAU = Math.PI * 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
const frame12 = p => Math.min(12, Math.max(1, 1 + Math.floor(clamp01(p) * 12)));
const moveFrame = p => 1 + clamp01(p) * 11;
const stageFade = (f,a,b) => Math.max(0,Math.min(1,(f-a)/Math.max(.001,b-a)));
function ring(ctx,x,y,rx,ry,color,a=.8,width=6,rotation=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';glow(ctx,color,width*2.4);ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,TAU);ctx.stroke();ctx.restore();}
function streak(ctx,x1,y1,x2,y2,color,width=4,a=.7){strokePath(ctx,[[x1,y1],[x2,y2]],color,width,a);}
function g1Glow(ctx,color,blur=18){ctx.shadowColor=color;ctx.shadowBlur=blur;}
function g1Dot(ctx,x,y,r,color,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=color;g1Glow(ctx,color,Math.max(4,r*2));ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function g1Line(ctx,pts,color,width=6,a=1){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';g1Glow(ctx,color,width*2);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();}
function g1Ring(ctx,x,y,rx,ry,color,a=.9,w=6,rot=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';g1Glow(ctx,color,w*2.5);ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,TAU);ctx.stroke();ctx.restore();}
function g1Flame(ctx,x,y,r,color,a=1,ang=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;g1Glow(ctx,color,r*2.2);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-r*1.45);ctx.bezierCurveTo(r*.95,-r*.45,r*.8,r*.65,0,r);ctx.bezierCurveTo(-r*.75,r*.45,-r*.55,-r*.4,0,-r*1.45);ctx.fill();ctx.fillStyle='#FFD66B';ctx.globalAlpha*=.75;ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.bezierCurveTo(r*.4,-r*.2,r*.3,r*.45,0,r*.65);ctx.bezierCurveTo(-r*.3,r*.3,-r*.25,-r*.25,0,-r*.85);ctx.fill();ctx.restore();}
function g1Water(ctx,pts,color='#48D9FF',w=9,a=1){g1Line(ctx,pts,color,w,a);}
function g1Leaf(ctx,x,y,rx,ry,ang,color='#63E63C',a=1){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=color;g1Glow(ctx,color,10);ctx.beginPath();ctx.moveTo(0,-ry);ctx.bezierCurveTo(rx,-ry*.35,rx,ry*.5,0,ry);ctx.bezierCurveTo(-rx,ry*.5,-rx,-ry*.35,0,-ry);ctx.fill();ctx.restore();}
function g1Shard(ctx,x,y,w,h,ang,color='#BDEFFF',a=1){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=color;g1Glow(ctx,color,14);ctx.beginPath();ctx.moveTo(0,-h);ctx.lineTo(w*.65,-h*.2);ctx.lineTo(w*.42,h);ctx.lineTo(-w*.45,h*.45);ctx.closePath();ctx.fill();ctx.restore();}
function g1Particles(ctx,x,y,color,t,count=10,r=28){for(let i=0;i<count;i++){const a=i/count*TAU+t*2.5,rr=r*(.35+.65*((i*7)%13)/13);g1Dot(ctx,x+Math.cos(a)*rr,y+Math.sin(a)*rr,1.4+(i%3)*.6,color,.35+.3*Math.sin(t*4+i));}}
function g1Trail(ctx,x,y,color,dx,dy,n=6){for(let i=1;i<=n;i++){const q=i/n;g1Dot(ctx,x-dx*q,y-dy*q,2.5*(1-q),color,.45*(1-q));}}
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


// ── Exact supplied Up Signature sequences ────────────────────────────────────
function fireUp(ctx,x,y,p){
  const f=frame12(p),c='#FF5A12',cx=x+18,cy=y-88;
  if(f===1)return;
  if(f===2){g1Line(ctx,[[x+8,y-38],[cx,cy]],c,10,.95);g1Flame(ctx,cx+4,cy-4,7,c,.9,-.3);return;}
  g1Line(ctx,[[x+8,y-38],[cx,cy]],c,9,.95);
  if(f===3){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=10;ctx.lineCap='round';g1Glow(ctx,c,24);ctx.beginPath();ctx.arc(cx,cy,36,-2.35,-.2);ctx.stroke();ctx.restore();g1Flame(ctx,cx+30,cy-13,10,c,.95,-.3);return;}
  ctx.save();ctx.strokeStyle=c;ctx.lineWidth=10;ctx.lineCap='round';g1Glow(ctx,c,24);ctx.beginPath();ctx.arc(cx,cy,36,-2.35,-.2);ctx.stroke();ctx.restore();g1Flame(ctx,cx+30,cy-13,11,c,.95,-.3);
  if(f===4){g1Particles(ctx,cx+36,cy-22,c,.2,7,18);return;}
  if(f===5){g1Trail(ctx,cx+38,cy-20,c,18,-12,7);return;}
  if(f===6){for(let i=0;i<8;i++)g1Flame(ctx,cx+28+i*4,cy-14-i*3,7,c,.7,-.3);return;}
  if(f===7)return;
  if(f===8){g1Ring(ctx,cx,cy,39,32,c,.45,4);return;}
  if(f===9){g1Ring(ctx,cx,cy,39,32,c,.32,4);return;}
  if(f===10){ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle=c;ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy,36,-2.35,-.2);ctx.stroke();ctx.restore();return;}
  if(f===11||f===12){g1Particles(ctx,cx,cy,c,.65,8,26);}
}
function waterUp(ctx,x,y,p){
  const f=frame12(p),c='#27BFFF';
  if(f===1){g1Ring(ctx,x+4,y-33,23,16,c,.95,8,-.1);g1Water(ctx,[[x-10,y-20],[x+7,y-39]],c,5,.8);return;}
  if(f===2){g1Ring(ctx,x+12,y-52,22,15,c,.95,8,-.1);g1Water(ctx,[[x+7,y-40],[x+16,y-55]],c,5,.7);return;}
  const pos=[null,[28,-74],[43,-92],[57,-111],[64,-119],[64,-119],[64,-119],[64,-119],[64,-119],[64,-119],[64,-119]];
  const k=Math.min(10,f); const [px,py]=pos[k]||[64,-119];
  if(f>=3&&f<=6){const prev=f===3?[x+12,y-52]:[x+28+(f-3)*9,y-74-(f-3)*9];g1Water(ctx,[prev,[x+px,y+py]],c,4,.35);}
  g1Ring(ctx,x+px,y+py,22,14,c,f<=6?.98:.35,8,-.15);
  for(let i=0;i<5;i++)g1Dot(ctx,x+px+Math.cos(i*1.7)*18,y+py+Math.sin(i*1.7)*9,1.7,'#D9FBFF',.55);
  if(f===7)return;
  if(f>=8&&f<=12)g1Particles(ctx,x+px,y+py,c,.2+f*.03,7,20);
}
function grassUp(ctx,x,y,p){
  const f=frame12(p),c='#62E63A',cy=y-112;
  if(f===1){g1Dot(ctx,x,cy,5,'#E5C84A',1);return;}
  const spinFrames={2:0,3:.8,4:1.65,5:2.55,6:3.45,7:4.35};
  const spin=spinFrames[f]??4.35;
  for(let i=0;i<3;i++)g1Leaf(ctx,x,cy,13,34,i*TAU/3+spin,c,.98);
  g1Dot(ctx,x,cy,6,'#DDE85A',.9);
  if(f>=3&&f<=7)g1Ring(ctx,x,cy,40,17,c,.28,2);
  if(f===8){g1Particles(ctx,x,cy,c,.4,12,30);for(let i=0;i<6;i++)g1Line(ctx,[[x-12+i*5,cy+8],[x-8+i*5,cy-70-i*8]],c,2,.55);}
  if(f>=9&&f<=11)g1Particles(ctx,x,cy,c,.8,10,24);
}
function iceUp(ctx,x,y,p){
  const f=frame12(p),c='#BDEFFF';
  if(f===1){g1Shard(ctx,x+18,y-92,10,24,0,c,1);return;}
  if(f===2){g1Shard(ctx,x+18,y-82,11,28,-.08,c,1);g1Line(ctx,[[x+9,y-38],[x+18,y-62]],c,7,.9);return;}
  const t=Math.min(1,Math.max(0,(f-3)/6)),sx=x+18+58*t,sy=y-82-112*t-.0*Math.sin(t*Math.PI);
  const ang=(f-3)*.95;
  g1Shard(ctx,sx,sy,12,30,ang,c,1);
  if(f>=4&&f<=8)g1Trail(ctx,sx,sy,c,34,24,8);
  if(f===4||f===5){g1Ring(ctx,sx,sy,22,13,c,.3,3,ang);}
  if(f===6||f===7){g1Dot(ctx,sx,sy,15,c,.22);}
  if(f===8||f===9){g1Trail(ctx,sx,sy,c,45,28,9);g1Particles(ctx,sx,sy,c,.5,7,18);}
  if(f===10){g1Particles(ctx,sx,sy,c,.8,10,25);}
  if(f>=11)g1Particles(ctx,sx,sy,c,1,8,30);
}

// ── Authored 12-frame non-Up moves ───────────────────────────────────────────
function fireDown(ctx,x,y,p){const f=frame12(p),c='#FF5A12';if(f<=2){g1Flame(ctx,x-8,y-20,8,c,.65,-.2);return;}if(f===3){for(let i=-1;i<=1;i++)g1Flame(ctx,x+i*12,y-12,9,c,.8,-Math.PI/2);return;}const q=Math.min(1,(f-3)/4);for(let i=-2;i<=2;i++){const xx=x+i*(10+12*q);g1Flame(ctx,xx,y-8,10+q*5,c,.9,-Math.PI/2);}if(f>=8)g1Particles(ctx,x,y-22,c,.5,12,45);}
function fireSide(ctx,x,y,p){const f=frame12(p),c='#FF5A12';if(f<=2){g1Line(ctx,[[x+6,y-40],[x+25,y-52]],c,9,.7);g1Flame(ctx,x+26,y-52,9,c,.7);return;}const q=Math.min(1,(f-2)/4),ex=x+24+70*q,ey=y-44-Math.sin(q*Math.PI)*20;g1Line(ctx,[[x+8,y-40],[ex,ey]],c,12,.9);g1Flame(ctx,ex,ey,18+q*5,c,1,-.25);if(f>=7)g1Trail(ctx,ex,ey,c,45,-8,7);if(f>=10)g1Particles(ctx,ex,ey,c,.8,9,24);}
function fireUpHeavy(ctx,x,y,p){const f=frame12(p),c='#FF5A12',q=Math.min(1,Math.max(0,(f-2)/6)),r=25+55*q;for(let i=0;i<10;i++){const a=i/10*TAU+q*TAU;g1Flame(ctx,x+Math.cos(a)*r,y-92+Math.sin(a)*r*.7,10,c,.85,a+.4);}g1Ring(ctx,x,y-92,r,r*.7,c,.55,8);if(f>=9)g1Particles(ctx,x,y-92,c,.7,12,r*.7);}
function fireDownHeavy(ctx,x,y,p){const f=frame12(p),c='#FF5A12',q=Math.min(1,Math.max(0,(f-2)/6));for(let i=0;i<5;i++){const xx=x+(i-2)*28*q;g1Line(ctx,[[x,y-8],[xx,y+2],[xx+(i-2)*8,y-32]],c,6,.8);g1Flame(ctx,xx+(i-2)*8,y-34,11,c,.9,-Math.PI/2);}if(f>=9)g1Particles(ctx,x,y-28,c,.5,14,80);}
function fireSideHeavy(ctx,x,y,p){const f=frame12(p),c='#FF5A12',q=Math.min(1,Math.max(0,(f-2)/6)),ang=-1.05+q*1.9,cx=x+28+Math.cos(ang)*50,cy=y-45+Math.sin(ang)*50;g1Line(ctx,[[x+7,y-45],[cx,cy]],c,15,.9);g1Flame(ctx,cx,cy,22,c,1,ang);if(f>=8)for(let i=0;i<7;i++)g1Flame(ctx,cx+Math.cos(i)*24,cy+Math.sin(i)*18,7,c,.6,i*.7);}

function waterDown(ctx,x,y,p){const f=frame12(p),c='#27BFFF',q=Math.min(1,Math.max(0,(f-2)/5));for(const s of[-1,1]){const ex=x+s*(18+30*q),ey=y-10-58*q;g1Water(ctx,[[x+s*10,y-10],[ex,ey+24],[ex+s*8,ey]],c,11,.9);for(let i=0;i<4;i++)g1Dot(ctx,ex+s*i*5,ey-i*6,2.5,'#D9FBFF',.7);}if(f>=8)g1Ring(ctx,x,y-20,38,22,c,.45,3);}
function waterSide(ctx,x,y,p){const f=frame12(p),c='#27BFFF',q=Math.min(1,Math.max(0,(f-2)/5));const pts=[];for(let i=0;i<=18;i++){const t=i/18;pts.push([x+10+88*q*t,y-44-Math.sin(t*Math.PI)*32*q]);}g1Water(ctx,pts,c,10,.95);const e=pts.at(-1);g1Ring(ctx,e[0],e[1],11,7,c,.9,5,.2);if(f>=8)g1Trail(ctx,e[0],e[1],c,55,-10,8);}
function waterUpHeavy(ctx,x,y,p){const f=frame12(p),c='#27BFFF',q=Math.min(1,Math.max(0,(f-2)/6)),spin=q*TAU*1.1;const pts=[];for(let i=0;i<42;i++){const t=i/41,a=t*TAU+spin;pts.push([x+Math.cos(a)*(45+18*q),y-64+Math.sin(a)*(78+18*q)]);}g1Water(ctx,pts,c,13,.9);if(f>=7)for(let i=0;i<10;i++){const a=i/10*TAU+spin;g1Dot(ctx,x+Math.cos(a)*58,y-64+Math.sin(a)*92,3,'#D9FBFF',.7);}}
function waterDownHeavy(ctx,x,y,p){const f=frame12(p),c='#27BFFF',q=Math.min(1,Math.max(0,(f-2)/7)),bx=x+72-144*q,by=y-48+Math.max(0,q-.45)*95;g1Ring(ctx,bx,by,28,22,c,.8,8);g1Dot(ctx,bx,by,18,c,.65);if(f>=7)for(let i=0;i<9;i++)g1Water(ctx,[[bx,by],[bx+(i-4)*12,by-55*(q-.55)]],c,4,.6);}
function waterSideHeavy(ctx,x,y,p){const f=frame12(p),c='#27BFFF',q=Math.min(1,Math.max(0,(f-2)/7)),ang=-.95+q*1.9;ctx.save();ctx.translate(x+25,y-48);ctx.rotate(ang);ctx.strokeStyle=c;ctx.lineWidth=18;g1Glow(ctx,c,24);ctx.beginPath();ctx.arc(0,0,78,-.85,.85);ctx.stroke();ctx.restore();if(f>=8)g1Particles(ctx,x+95*q,y-48,c,.7,10,20);}

function grassDown(ctx,x,y,p){const f=frame12(p),c='#62E63A',q=Math.min(1,Math.max(0,(f-2)/5));for(const s of[-1,1]){const ex=x+s*(18+30*q),ey=y-18;g1Line(ctx,[[x+s*12,y-4],[x+s*34,y-24],[ex,ey-32]],c,7,.9);for(let i=0;i<3;i++)g1Leaf(ctx,ex+s*i*6,ey-32-i*4,5,11,s*.7,c,.85);}if(f>=8)g1Particles(ctx,x,y-30,c,.7,10,35);}
function grassSide(ctx,x,y,p){const f=frame12(p),c='#62E63A',wood='#8C6B3D',q=Math.min(1,Math.max(0,(f-2)/5));g1Line(ctx,[[x+8,y-44],[x+18+80*q,y-44]],wood,13,.95);for(let i=0;i<5;i++)g1Leaf(ctx,x+25+i*15*q,y-42,4,10,i*.6,c,.7);if(f>=8)g1Trail(ctx,x+18+80*q,y-44,c,50,0,7);}
function grassUpHeavy(ctx,x,y,p){const f=frame12(p),c='#62E63A',q=Math.min(1,Math.max(0,(f-2)/7)),r=22+68*q;for(let i=0;i<9;i++){const a=i/9*TAU;g1Leaf(ctx,x+Math.cos(a)*r,y-52+Math.sin(a)*r*.55,12,28,a,c,.9);}g1Ring(ctx,x,y-52,r,r*.55,c,.55,5);if(f>=8)g1Particles(ctx,x,y-52,c,.7,12,r*.5);}
function grassDownHeavy(ctx,x,y,p){const f=frame12(p),c='#62E63A',q=Math.min(1,Math.max(0,(f-2)/7));g1Line(ctx,[[x-35,y-105],[x+25*q,y-30],[x+12*q,y+4]],c,11,.9);g1Line(ctx,[[x+12*q,y+4],[x-24*q,y-26],[x-10*q,y-66]],c,10,.9);for(let i=0;i<7;i++)g1Leaf(ctx,x-25+i*7*q,y-30+i*2,5,12,i*.8,c,.65);if(f>=9)g1Particles(ctx,x+10,y-24,c,.7,10,60);}
function grassSideHeavy(ctx,x,y,p){const f=frame12(p),c='#62E63A',wood='#8C6B3D',q=Math.min(1,Math.max(0,(f-2)/7));g1Line(ctx,[[x+8,y-46],[x+30+110*q,y-48]],wood,16,.9);for(let i=0;i<8;i++)g1Leaf(ctx,x+45+i*12*q,y-48+(i-4)*3,5,12,i*.5,c,.7);if(f>=9)g1Particles(ctx,x+130*q,y-48,c,.6,8,28);}

function iceDown(ctx,x,y,p){const f=frame12(p),c='#BDEFFF',q=Math.min(1,Math.max(0,(f-2)/6));g1Ring(ctx,x,y-10,45,12,c,.65,5);if(f>=5)for(let i=0;i<8;i++){const a=Math.PI*1.05+i/7*Math.PI*.9,sx=x+Math.cos(a)*52*q,sy=y-18+Math.sin(a)*35*q;g1Shard(ctx,sx,sy,9,22,a,c,.9);}if(f>=9)g1Particles(ctx,x,y-20,c,.8,10,55);}
function iceSide(ctx,x,y,p){const f=frame12(p),c='#BDEFFF',q=Math.min(1,Math.max(0,(f-2)/6)),a=-1.15+q*2.3;g1Line(ctx,[[x+8,y-44],[x+20+Math.cos(a)*64,y-44+Math.sin(a)*64]],c,15,.9);g1Shard(ctx,x+20+Math.cos(a)*64,y-44+Math.sin(a)*64,12,30,a,c,1);if(f>=8)g1Trail(ctx,x+80*q,y-45,c,55,-5,8);}
function iceUpHeavy(ctx,x,y,p){const f=frame12(p),c='#BDEFFF',q=Math.min(1,Math.max(0,(f-2)/6));for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+q*.7,sx=x+Math.cos(a)*76*q,sy=y-70+Math.sin(a)*76*q;g1Shard(ctx,sx,sy,16,42,a,c,.95);}if(f>=8)g1Particles(ctx,x,y-70,c,.7,12,70);}
function iceDownHeavy(ctx,x,y,p){const f=frame12(p),c='#BDEFFF',q=Math.min(1,Math.max(0,(f-2)/7)),bx=x+28+104*q;ctx.save();ctx.fillStyle=c;g1Glow(ctx,c,20);ctx.globalAlpha=.9;ctx.fillRect(bx-34,y-18,68,34);ctx.restore();if(f>=8){g1Shard(ctx,bx+42,y-32,14,28,-.6,c,.95);g1Shard(ctx,bx-42,y-5,14,28,.6,c,.95);}}
function iceSideHeavy(ctx,x,y,p){const f=frame12(p),c='#BDEFFF',q=Math.min(1,Math.max(0,(f-2)/7)),a=-1.15+q*2.3;g1Line(ctx,[[x+8,y-44],[x+25,y-42]],c,17,.9);g1Shard(ctx,x+25+Math.cos(a)*68,y-42+Math.sin(a)*68,17,50,a,c,1);if(f>=8)for(let i=0;i<7;i++)g1Shard(ctx,x+85+i*9,y-42+Math.sin(i)*8,6,16,i*.6,c,.8);}

function fireSuper(ctx,x,y,p){
  const c='#FF6600',f=moveFrame(p);
  if(f<4){flame(ctx,x-22,y-56,22,c,.7,-.25);flame(ctx,x+22,y-56,22,c,.7,.25);return;}
  const q=stageFade(f,4,7); const r=18+q*22;
  ctx.save();ctx.fillStyle='#FFF2A8';glow(ctx,c,30);ctx.globalAlpha=.95;ctx.beginPath();ctx.arc(x+14,y-58,r,0,TAU);ctx.fill();ctx.restore();
  if(f>=7){const e=stageFade(f,7,10),cx=x+82,cy=y-50,rr=10+e*62;ctx.save();ctx.fillStyle=c;glow(ctx,c,30);ctx.globalAlpha=1-e*.25;ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<16;i++){const a=i/16*TAU;streak(ctx,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,cx+Math.cos(a)*(rr+26*e),cy+Math.sin(a)*(rr+26*e),c,4,.65);}}
  if(f>=10){ctx.save();ctx.globalAlpha=1-stageFade(f,10,12);ctx.strokeStyle=c;ctx.lineWidth=8;glow(ctx,c,26);ctx.beginPath();ctx.arc(x+82,y-50,68,0,TAU);ctx.stroke();ctx.restore();}
}

function waterSuper(ctx,x,y,p){
  const c='#3399CC',f=moveFrame(p);
  const r=30+stageFade(f,2,6)*68;
  if(f<7)ring(ctx,x,y-52,r,r*.68,c,.85,14);
  if(f>=6){const e=stageFade(f,6,10),rr=r*(1-e);for(let i=0;i<20;i++){const a=i/20*TAU;streak(ctx,x+Math.cos(a)*r,y-52+Math.sin(a)*r*.68,x+Math.cos(a)*rr,y-52+Math.sin(a)*rr*.68,c,5,.6);}}
  if(f>=9){const e=stageFade(f,9,11),rr=8+e*112;ring(ctx,x,y-52,rr,rr*.68,c,1-e*.15,9);}
}

function grassSuper(ctx,x,y,p){
  const c='#44AA44',f=moveFrame(p),q=stageFade(f,2,9),r=28+q*92;
  for(let i=0;i<12;i++){const a=i/12*TAU;leaf(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.65,16,38,a,c,.85);}
  if(f>=6){const rr=r*(1-stageFade(f,6,10));for(let i=0;i<12;i++){const a=i/12*TAU;streak(ctx,x+Math.cos(a)*r,y-48+Math.sin(a)*r*.65,x+Math.cos(a)*rr,y-48+Math.sin(a)*rr*.65,c,8,.7);}}
}

function iceSuper(ctx,x,y,p){
  const c='#AAEEFF',f=moveFrame(p),cx=x+52,cy=y-54;
  if(f<7){ctx.save();ctx.fillStyle=c;glow(ctx,c,24);ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(cx,cy-100);ctx.lineTo(cx+42,cy-22);ctx.lineTo(cx+30,cy+70);ctx.lineTo(cx-18,cy+45);ctx.lineTo(cx-44,cy-24);ctx.closePath();ctx.fill();ctx.restore();}
  if(f>=5){const e=stageFade(f,5,11),r=24+e*110;for(let i=0;i<16;i++){const a=i/16*TAU;const sx=cx+Math.cos(a)*r,sy=cy+Math.sin(a)*r*.72;shard(ctx,sx,sy,10,28,a,c,.95);}}
}

function drawGen1AttackVisual(ctx,x,y,p,charId,move){
  if(charId==='g1_thunder'){
    if(move==='us') thunderUp(ctx,x,y,p);
    else if(move==='ds') thunderDown(ctx,x,y,p);
    else if(move==='ss') thunderSide(ctx,x,y,p,false);
    else if(move==='sh') thunderSide(ctx,x,y,p,true);
    else if(move==='upHeavy'||move==='uh') thunderUpHeavy(ctx,x,y,p);
    else if(move==='dh') thunderDownHeavy(ctx,x,y,p);
    return;
  }
  if(charId==='g1_fire'){if(move==='us')fireUp(ctx,x,y,p);else if(move==='ds')fireDown(ctx,x,y,p);else if(move==='ss')fireSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')fireUpHeavy(ctx,x,y,p);else if(move==='dh')fireDownHeavy(ctx,x,y,p);else fireSideHeavy(ctx,x,y,p);return;}
  if(charId==='g1_water'){if(move==='us')waterUp(ctx,x,y,p);else if(move==='ds')waterDown(ctx,x,y,p);else if(move==='ss')waterSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')waterUpHeavy(ctx,x,y,p);else if(move==='dh')waterDownHeavy(ctx,x,y,p);else waterSideHeavy(ctx,x,y,p);return;}
  if(charId==='g1_grass'){if(move==='us')grassUp(ctx,x,y,p);else if(move==='ds')grassDown(ctx,x,y,p);else if(move==='ss')grassSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')grassUpHeavy(ctx,x,y,p);else if(move==='dh')grassDownHeavy(ctx,x,y,p);else grassSideHeavy(ctx,x,y,p);return;}
  if(charId==='g1_ice'){if(move==='us')iceUp(ctx,x,y,p);else if(move==='ds')iceDown(ctx,x,y,p);else if(move==='ss')iceSide(ctx,x,y,p);else if(move==='upHeavy'||move==='uh')iceUpHeavy(ctx,x,y,p);else if(move==='dh')iceDownHeavy(ctx,x,y,p);else iceSideHeavy(ctx,x,y,p);}
}

function holdFrameFor(charId,move){
  if(charId==='g1_water'&&move==='us')return 1;
  if(charId==='g1_grass'&&move==='us')return 3;
  if((charId==='g1_fire'||charId==='g1_ice'||charId==='g1_thunder')&&move==='us')return 2;
  return 2;
}
function drawGen1ChargeLayer(ctx,x,y,charId,move,tick){
  if(charId==='g1_thunder')return;
  const q=Math.max(0,Math.min(1,(tick||0)/180)),pulse=.55+.45*Math.sin((tick||0)*.18);
  if(charId==='g1_fire'){const r=8+q*28;g1Flame(ctx,x+18,y-48,r,'#FF5A12',.18+.45*q*pulse,-.35);g1Ring(ctx,x+18,y-48,r+8,r*.7,'#FFD66B',.18+.25*q,3);}
  else if(charId==='g1_water'){const r=12+q*32;g1Ring(ctx,x+18,y-48,r,r*.62,'#27BFFF',.25+.5*q*pulse,4);for(let i=0;i<8;i++)g1Dot(ctx,x+18+Math.cos(i*TAU/8+tick*.04)*(r+5),y-48+Math.sin(i*TAU/8+tick*.04)*r*.62,1.8,'#D9FBFF',.25+.3*q);}
  else if(charId==='g1_grass'){const r=10+q*25;for(let i=0;i<3;i++)g1Leaf(ctx,x+Math.cos(i*TAU/3+tick*.08)*r,y-112+Math.sin(i*TAU/3+tick*.08)*r*.35,6+q*5,14+q*9,i*TAU/3+tick*.08,'#8BFF48',.25+.5*q);}
  else if(charId==='g1_ice'){const r=8+q*24;g1Shard(ctx,x+18,y-82,9+q*5,20+q*10,-.15,'#BDEFFF',.25+.5*q);for(let i=0;i<8;i++)g1Dot(ctx,x+18+Math.cos(i*TAU/8+tick*.02)*r,y-82+Math.sin(i*TAU/8+tick*.02)*r,1.5+q,'#E7FCFF',.25+.35*q);}
}
function drawGen1HoldPose(ctx,x,y,charId,move,holdTick){const hf=holdFrameFor(charId,move),hp=(hf-1)/11;drawGen1AttackVisual(ctx,x,y,hp,charId,move);drawGen1ChargeLayer(ctx,x,y,charId,move,holdTick);}

export function drawGen1Attack(ctx,x,y,color,p,facing,charId,move,attackData=null){
  ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);
  if(attackData?.holding){drawGen1HoldPose(ctx,0,0,charId,move,attackData.holdTick||0);ctx.restore();return;}
  drawGen1AttackVisual(ctx,0,0,p,charId,move);ctx.restore();
}

export function drawGen1Super(ctx,x,y,p,facing,charId){
  ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);
  if(charId==='g1_thunder') thunderSuper(ctx,0,0,p);
  else if(charId==='g1_fire') fireSuper(ctx,0,0,p);
  else if(charId==='g1_water') waterSuper(ctx,0,0,p);
  else if(charId==='g1_grass') grassSuper(ctx,0,0,p);
  else if(charId==='g1_ice') iceSuper(ctx,0,0,p);
  ctx.restore();
}
