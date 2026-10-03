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
function fireHold(ctx,x,y,move,q){
  // The hold is the actual second frame of the corresponding reference attack.
  // q only controls brightness; it never changes the silhouette or geometry.
  const c='#FF5A16', hot='#FFB12B', white='#FFF2B0';
  const pulse=.82 + .18*Math.sin(q*REF_TAU*2);
  if(move==='us'){
    // Frame 2: arm rising, small hook forming around the fist.
    glowStroke(ctx,[[x+8,y-24],[x+17,y-40],[x+24,y-58]],c,7,pulse);
    glowArc(ctx,x+28,y-62,22,15,-2.55,-.55,c,7,pulse);
    flameShape(ctx,x+28,y-62,7,hot,pulse,.2);
  } else if(move==='ds'){
    // Frame 2: foot pulled back, ember placed under the foot.
    glowStroke(ctx,[[x+8,y-8],[x+16,y-24],[x+7,y-38]],c,6,pulse);
    core(ctx,x+7,y-5,7,c,pulse);
  } else if(move==='ss'){
    // Frame 2: torso twist and small elbow flame.
    glowStroke(ctx,[[x+8,y-24],[x+22,y-39],[x+38,y-44]],c,8,pulse);
    flameShape(ctx,x+39,y-44,8,hot,pulse,.15);
  } else if(move==='uh'){
    // Frame 2: both hands raised; the spinning wheel has formed above them.
    glowStroke(ctx,[[x-8,y-22],[x-18,y-45]],c,7,pulse);
    glowStroke(ctx,[[x+8,y-22],[x+18,y-45]],c,7,pulse);
    glowArc(ctx,x,y-88,47,27,-.05,REF_TAU-.05,c,8,pulse);
    for(let i=0;i<8;i++){
      const a=i/8*REF_TAU;
      flameShape(ctx,x+Math.cos(a)*47,y-88+Math.sin(a)*27,5,hot,pulse*.8,a);
    }
  } else if(move==='dh'){
    // Frame 2: crouched punch into the ground; first cracks are just beginning.
    glowStroke(ctx,[[x+6,y-20],[x+13,y-3],[x+18,y+1]],c,8,pulse);
    glowStroke(ctx,[[x+18,y+1],[x+45,y-6]],hot,3,pulse*.8);
    glowStroke(ctx,[[x+18,y+1],[x-12,y-8]],hot,3,pulse*.8);
  } else if(move==='sh'){
    // Frame 2: arm driven forward; compact flame around the fist.
    glowStroke(ctx,[[x+8,y-25],[x+24,y-42],[x+55,y-44]],c,9,pulse);
    flameShape(ctx,x+55,y-44,10,hot,pulse,.15);
  }
}

function fireUpReference(ctx,x,y,p){
  const c='#FF5A16', hot='#FF9A22', white='#FFF2B0';
  if(p<0){ fireHold(ctx,x,y,'us',holdCharge(p)); return; }
  const f=Math.min(4,Math.floor(attackP(p)*4)+1);
  if(f===1) return;
  if(f===2){
    glowStroke(ctx,[[x+8,y-24],[x+17,y-40],[x+24,y-58]],c,7,.95);
    glowArc(ctx,x+28,y-62,22,15,-2.55,-.55,c,7,.95);
    flameShape(ctx,x+28,y-62,7,hot,.95,.2);
    return;
  }
  if(f===3){
    glowStroke(ctx,[[x+8,y-24],[x+18,y-43],[x+28,y-60]],c,8,1);
    glowArc(ctx,x+30,y-64,31,22,-2.65,.25,c,9,1,-.08);
    flameShape(ctx,x+30,y-64,11,hot,1,.2);
    spark(ctx,x+30,y-64,3,white,.9);
    return;
  }
  // Frame 4: completed hook snaps upward and leaves a short flame trail.
  glowStroke(ctx,[[x+8,y-24],[x+18,y-45],[x+29,y-72]],c,8,1);
  glowArc(ctx,x+30,y-76,35,24,-2.65,.45,c,9,.98,-.08);
  flameShape(ctx,x+34,y-90,12,hot,1,.1);
  glowStroke(ctx,[[x+35,y-86],[x+52,y-111]],hot,4,.85);
  for(let i=0;i<6;i++) spark(ctx,x+39+i*3,y-91-i*5,1.5,c,.65);
}

function fireAttack(ctx,x,y,p,move){
  const c='#FF5A16', hot='#FFB12B', white='#FFF2B0';
  if(p<0){ fireHold(ctx,x,y,move,holdCharge(p)); return; }
  const f=(move==='dh'||move==='super') ? 1 : 1;
  // Every reference frame is a discrete pose/effect state. There is no
  // interpolation between the supplied frames; the game repeats each state 3x.
  if(move==='us'){ fireUpReference(ctx,x,y,p); return; }
  if(move==='ds'){
    const rf=Math.min(4,Math.floor(attackP(p)*4)+1);
    if(rf===1) return;
    if(rf===2){
      glowStroke(ctx,[[x+8,y-8],[x+16,y-25],[x+7,y-39]],c,6,.95); core(ctx,x+7,y-5,7,c,1); return;
    }
    if(rf===3){
      core(ctx,x,y-5,8,c,1);
      for(let i=0;i<4;i++){
        const a=-Math.PI/2+i*Math.PI/2;
        const ex=x+Math.cos(a)*18, ey=y-5+Math.sin(a)*18;
        flameShape(ctx,ex,ey,10,hot,1,a+.2);
      }
      return;
    }
    // Frame 4: four-point burst remains behind the recovering foot.
    for(let i=0;i<4;i++){
      const a=-Math.PI/2+i*Math.PI/2;
      const ex=x+Math.cos(a)*23, ey=y-5+Math.sin(a)*19;
      flameShape(ctx,ex,ey,8,hot,.8,a+.2);
    }
    glowStroke(ctx,[[x+10,y-5],[x+28,y-22]],hot,3,.7);
    return;
  }
  if(move==='ss'){
    const rf=Math.min(4,Math.floor(attackP(p)*4)+1);
    if(rf===1) return;
    if(rf===2){
      glowStroke(ctx,[[x+8,y-24],[x+22,y-39],[x+39,y-44]],c,8,.95);
      flameShape(ctx,x+39,y-44,8,hot,1,.15); return;
    }
    if(rf===3){
      glowStroke(ctx,[[x+8,y-24],[x+22,y-40],[x+56,y-45]],c,9,1);
      flameShape(ctx,x+57,y-45,12,hot,1,.15); return;
    }
    glowStroke(ctx,[[x+8,y-24],[x+23,y-41],[x+70,y-48]],c,10,1);
    glowArc(ctx,x+58,y-47,30,18,-1.1,.35,c,6,.9,-.1);
    flameShape(ctx,x+73,y-49,13,hot,1,.05);
    glowStroke(ctx,[[x+68,y-47],[x+98,y-60]],hot,4,.75);
    return;
  }
  if(move==='uh'){
    const rf=Math.min(4,Math.floor(attackP(p)*4)+1);
    if(rf===1){
      glowStroke(ctx,[[x-8,y-22],[x-17,y-45]],c,7,.95);
      glowStroke(ctx,[[x+8,y-22],[x+17,y-45]],c,7,.95); return;
    }
    if(rf===2 || rf===3){
      glowArc(ctx,x,y-88,48,28,-.05,REF_TAU-.05,c,9,1);
      for(let i=0;i<14;i++){
        const a=i/14*REF_TAU;
        flameShape(ctx,x+Math.cos(a)*48,y-88+Math.sin(a)*28,6,hot,.9,a);
      }
      if(rf===3) glowArc(ctx,x+38,y-78,18,12,.2,2.8,c,4,.8);
      return;
    }
    // Frame 4: wheel breaks apart; only the remaining arcs/flames are visible.
    for(let i=0;i<7;i++){
      const a=-.9+i*.3;
      const rx=48+Math.cos(a)*15, ry=y-88+Math.sin(a)*28-20;
      flameShape(ctx,rx,ry,7,hot,.85,a+.5);
    }
    glowArc(ctx,x+6,y-88,42,24,-2.2,-.3,c,6,.75,-.1);
    return;
  }
  if(move==='dh'){
    const rf=Math.min(6,Math.floor(attackP(p)*6)+1);
    if(rf===1){ return; }
    if(rf===2){
      glowStroke(ctx,[[x+7,y-20],[x+15,y-2],[x+18,y+2]],c,8,1);
      glowStroke(ctx,[[x+18,y+2],[x-22,y-7]],hot,3,.8); return;
    }
    if(rf===3){
      for(const [x2,ang] of [[-48,-.35],[-18,-.15],[18,.15],[48,.35]]){
        glowStroke(ctx,[[x,y-2],[x+x2,y-10]],c,4,.95);
        spark(ctx,x+x2,y-10,2.5,hot,1);
      }
      return;
    }
    for(let i=0;i<5;i++){
      const xx=x+(i-2)*30;
      const top=y-45-(i%2)*6;
      glowStroke(ctx,[[xx,y-4],[xx,top]],c,7,.95);
      flameShape(ctx,xx,top,12,hot,1,i*.18-.35);
    }
    if(rf>=5){
      for(let i=0;i<5;i++){
        const xx=x+(i-2)*30, top=y-52-(i%2)*8;
        flameShape(ctx,xx,top,10,hot,.75,.2*(i-2));
      }
    }
    return;
  }
  if(move==='sh'){
    const rf=Math.min(4,Math.floor(attackP(p)*4)+1);
    if(rf===1){
      glowStroke(ctx,[[x+8,y-26],[x+30,y-48],[x+50,y-44]],c,8,.95);
      flameShape(ctx,x+50,y-44,9,hot,.9,.15); return;
    }
    if(rf===2){
      glowStroke(ctx,[[x+8,y-25],[x+24,y-42],[x+60,y-44]],c,9,1);
      flameShape(ctx,x+60,y-44,11,hot,1,.1); return;
    }
    if(rf===3){
      glowStroke(ctx,[[x+8,y-25],[x+25,y-44],[x+64,y-46]],c,11,1);
      glowArc(ctx,x+57,y-46,34,24,-1.0,.7,c,9,1,-.15);
      flameShape(ctx,x+72,y-47,18,hot,1,.05); return;
    }
    glowStroke(ctx,[[x+8,y-25],[x+25,y-44],[x+76,y-48]],c,10,.95);
    glowArc(ctx,x+58,y-47,39,26,-.9,.55,c,7,.85,-.15);
    flameShape(ctx,x+82,y-50,11,hot,.9,.05);
    return;
  }
}

function waterUpReference(ctx,x,y,p){
  const c='#24BFFF', white='#DDFBFF';
  if(p<0){
    // User-specified hold frame: frame 1 — ring begins around the lower arm.
    const q=holdCharge(p), rr=17+q*9;
    waterRing(ctx,x+4,y-34,rr+8,rr*.45,c,.75+q*.2,-.15);
    glowStroke(ctx,[[x+5,y-25],[x+12,y-42]],c,5,.8);
    return;
  }
  const f=refFrame(p);
  if(f<1.8){ waterRing(ctx,x+4,y-34,22,10,c,.75,-.15); return; }
  const travel=Math.min(1,Math.max(0,(f-2)/5.2));
  const tx=x+30+travel*130, ty=y-55-travel*70+Math.sin(travel*Math.PI)*20;
  const prevX=x+18+(travel-.12)*130, prevY=y-48-(travel-.12)*70+Math.sin(Math.max(0,travel-.12)*Math.PI)*20;
  glowStroke(ctx,[[x+10,y-34],[x+25,y-52],[tx,ty]],c,6,.55);
  for(let i=0;i<6;i++) spark(ctx,tx-Math.cos(.5)*i*7,ty+i*4,1.7,c,.65);
  if(f<3.1){ waterRing(ctx,x+18,y-48,25,12,c,.95,-.1); }
  if(f>=3){ waterRing(ctx,tx,ty,27,11,c,.98,.2+travel*.3); }
  if(f>=6 && f<8){
    const vanish=(f-6)/2; glowArc(ctx,tx,ty,25*(1-vanish),10*(1-vanish),0,REF_TAU,c,5,1-vanish,.25);
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

function waterAttack(ctx,x,y,p,move){
  const c='#24BFFF', white='#DDFBFF', q=attackP(p), a=.3+.7*Math.sin(q*Math.PI);
  if(move==='us'){waterUpReference(ctx,x,y,p);return;}
  if(move==='ss'){
    const t=easeOut(q), ex=x+18+t*105, ey=y-44-Math.sin(t*Math.PI)*24;
    glowStroke(ctx,[[x+5,y-30],[x+32,y-48],[ex,ey]],c,7,a); waterRing(ctx,ex,ey,14,7,c,.9,.3+t*2); return;
  }
  if(move==='ds'){
    const spread=28+q*30; glowArc(ctx,x,y-24,spread,18,Math.PI,REF_TAU,c,8,a,.0); for(let s of [-1,1]){waterRing(ctx,x+s*spread,y-38,14,6,c,.9,s*.4);} return;
  }
  if(move==='sh'){
    const t=easeOut(q), ang=-.9+t*1.8; glowArc(ctx,x+26,y-48,78,48,-.9,ang,c,13,a,-.08); waterRing(ctx,x+26+Math.cos(ang)*70,y-48+Math.sin(ang)*42,18,8,c,.9,ang); return;
  }
  if(move==='uh'){
    const r=62; const t=easeOut(q); glowArc(ctx,x,y-76,r,r*1.15,-1.0+t*REF_TAU,-1.0+t*REF_TAU+2.8,c,9,a,.0); for(let i=0;i<10;i++){const ang=i/10*REF_TAU+t*1.5; spark(ctx,x+Math.cos(ang)*r,y-76+Math.sin(ang)*r*1.15,3,c,.6);} return;
  }
  if(move==='dh'){
    const bx=x+80-160*easeOut(q), by=y-45+Math.max(0,q-.45)*70; waterRing(ctx,bx,by,22,16,c,a,.3); return;
  }
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
function fireSuper(ctx,x,y,p){
  const c='#FF5A16', hot='#FFB12B', white='#FFF2B0';
  const f=Math.min(7,Math.floor(attackP(p)*7)+1);
  if(f===1){
    glowStroke(ctx,[[x-8,y-24],[x-17,y-45]],c,7,.95);
    glowStroke(ctx,[[x+8,y-24],[x+17,y-45]],c,7,.95);
    core(ctx,x,y-65,8,c,1); return;
  }
  if(f===2){
    core(ctx,x,y-66,15,hot,1);
    glowArc(ctx,x,y-66,19,19,0,REF_TAU,c,5,.9); return;
  }
  if(f===3){
    core(ctx,x,y-66,21,hot,1);
    glowArc(ctx,x,y-66,25,25,0,REF_TAU,c,6,1); return;
  }
  if(f===4){
    core(ctx,x+28,y-62,23,hot,1);
    glowStroke(ctx,[[x+8,y-26],[x+28,y-49],[x+38,y-60]],c,8,1);
    glowArc(ctx,x+28,y-62,26,23,-.8,.8,c,5,.9,-.15); return;
  }
  if(f===5){
    core(ctx,x+62,y-56,19,hot,1);
    glowStroke(ctx,[[x+18,y-27],[x+62,y-56]],c,9,1);
    for(let i=0;i<7;i++) spark(ctx,x+42+i*6,y-48-i*2,1.7,c,.75); return;
  }
  if(f===6){
    const cx=x+72,cy=y-50;
    spark(ctx,cx,cy,48,c,1); spark(ctx,cx,cy,34,hot,1); core(ctx,cx,cy,22,hot,1);
    for(let i=0;i<14;i++){
      const a=i/14*REF_TAU;
      glowStroke(ctx,[[cx+Math.cos(a)*22,cy+Math.sin(a)*22],[cx+Math.cos(a)*58,cy+Math.sin(a)*42]],hot,4,.75);
    }
    return;
  }
  // Frame 7: explosion has collapsed; Fire Hero remains upright while debris/flame trails move outward.
  for(let i=0;i<10;i++){
    const a=-1.15+i*.25;
    const r=42+i*4;
    glowStroke(ctx,[[x+62,y-54],[x+62+Math.cos(a)*r,y-54+Math.sin(a)*r*.65]],hot,3,.65);
    spark(ctx,x+62+Math.cos(a)*r,y-54+Math.sin(a)*r*.65,2,c,.65);
  }
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
