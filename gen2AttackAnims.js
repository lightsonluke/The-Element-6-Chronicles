// Generation II — fully hand-authored attack animation + collision geometry.
// Every directional attack is authored in RIGHT-facing local space and mirrored
// by facing. Collision shapes use the same local coordinates as the drawings.
const TAU = Math.PI * 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const out = v => 1 - Math.pow(1 - clamp01(v), 3);
const pulse = v => Math.sin(clamp01(v) * Math.PI);

function glow(ctx, c, blur = 14) { ctx.shadowColor = c; ctx.shadowBlur = blur; }
function stroke(ctx, pts, c, w = 4, a = 1, dash = null) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash); glow(ctx, c, Math.max(7, w * 2));
  ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); ctx.restore();
}
function poly(ctx, pts, fill, a = 1, edge = '#fff') {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = fill; glow(ctx, fill, 16); ctx.beginPath();
  pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
  if (edge) { ctx.globalAlpha = a * .8; ctx.strokeStyle = edge; ctx.lineWidth = 1.4; ctx.stroke(); }
  ctx.restore();
}
function circle(ctx,x,y,r,c,a=1,fill=true) { ctx.save(); ctx.globalAlpha=a; fill?ctx.fillStyle=c:ctx.strokeStyle=c; glow(ctx,c,12); ctx.beginPath(); ctx.arc(x,y,r,0,TAU); fill?ctx.fill():ctx.stroke(); ctx.restore(); }
function capsule(ctx,x1,y1,x2,y2,r,c,a=1) { ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=r*2; ctx.lineCap='round'; glow(ctx,c,12); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }
function ring(ctx,x,y,rx,ry,c,a=1,w=3,rot=0) { ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=c; ctx.lineWidth=w; glow(ctx,c,12); ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot,0,TAU); ctx.stroke(); ctx.restore(); }
function spark(ctx,x,y,r,c,a=1,n=6) { for(let i=0;i<n;i++){const q=i/n*TAU; stroke(ctx,[[x+Math.cos(q)*r*.4,y+Math.sin(q)*r*.4],[x+Math.cos(q)*r,y+Math.sin(q)*r]],c,1.7,a);}}
function flame(ctx,x,y,r,c,a=1,ang=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=c;glow(ctx,c,18);ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.8,-r*.15,r*.2,r);ctx.quadraticCurveTo(-r*.9,r*.4,0,-r);ctx.fill();ctx.globalAlpha=a*.75;ctx.fillStyle='#FFF4B0';ctx.beginPath();ctx.moveTo(0,-r*.55);ctx.quadraticCurveTo(r*.3,0,0,r*.5);ctx.quadraticCurveTo(-r*.3,0,0,-r*.55);ctx.fill();ctx.restore();}
function water(ctx,pts,c='#44BFFF',w=10,a=.8){stroke(ctx,pts,c,w,a);stroke(ctx,pts,'#E9FBFF',Math.max(1.5,w*.16),a*.6);}
function leaf(ctx,x,y,rx,ry,ang,c,a=1){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=c;glow(ctx,c,10);ctx.beginPath();ctx.moveTo(0,-ry);ctx.quadraticCurveTo(rx,-ry*.1,0,ry);ctx.quadraticCurveTo(-rx,-ry*.1,0,-ry);ctx.fill();ctx.restore();}
function shadow(ctx,x,y,rx,ry,c='#6D4CA8',a=.6,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=a;ctx.fillStyle=c;glow(ctx,c,18);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();ctx.restore();}
function stone(ctx,x,y,w,h,c='#A48A68',a=1,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);poly(ctx,[[-w/2,-h/2],[w*.42,-h*.42],[w/2,h*.15],[w*.12,h/2],[-w*.45,h*.3]],c,a,'#E3D4BC');ctx.restore();}
function metal(ctx,x,y,w,h,c='#AEB7C1',a=1,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);poly(ctx,[[-w/2,-h*.35],[-w*.2,-h/2],[w*.48,-h*.3],[w/2,h*.28],[w*.08,h/2],[-w/2,h*.2]],c,a,'#F4F7FA');ctx.restore();}
function thread(ctx,pts,c='#D99BFF',a=.8,w=3){stroke(ctx,pts,c,w,a);pts.forEach((p,i)=>i%2===0&&circle(ctx,p[0],p[1],2.5,c,a));}
function gust(ctx,x,y,r,c='#B9FFF1',a=.65,ang=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);for(let i=0;i<3;i++)stroke(ctx,[[0,i*10-r*.3],[r*.7,i*8-r*.1],[r,i*3+r*.2]],c,3-i*.6,a-i*.12);ctx.restore();}
function soundRing(ctx,x,y,r,c='#FFE68A',a=.7){ring(ctx,x,y,r,r*.34,c,a,3);ring(ctx,x,y,r*.72,r*.25,c,a*.55,2);}
function star(ctx,x,y,r,c='#FFF6A6',a=1,rot=-Math.PI/2){const pts=[];for(let i=0;i<8;i++){const rr=i%2?r:r*.38;const q=rot+i*Math.PI/4;pts.push([x+Math.cos(q)*rr,y+Math.sin(q)*rr]);}poly(ctx,pts,c,a,'#FFFFFF');}
function blade(ctx,x,y,len,w,c='#D8DDE5',a=1,ang=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);poly(ctx,[[0,0],[len*.82,-w*.35],[len,w*.02],[len*.82,w*.35]],c,a,'#FFFFFF');ctx.restore();}

function withFacing(ctx,x,y,facing,fn){ctx.save();ctx.translate(x,y);ctx.scale(facing||1,1);fn();ctx.restore();}
function phase(p,a,b){return clamp01((p-a)/(b-a));}

function renji(ctx,p){
  const c='#AEB7C1', hi='#E9EEF2', dark='#59636D', q=out(p);
  // SS: forearm blade physically reshapes during the backhand.
  if(this==='ss'){const a=-.18+q*1.65; capsule(ctx,18,-48,18+Math.cos(a)*58,-48+Math.sin(a)*58,11,hi,pulse(p)); metal(ctx,42,-48,66,18, c,pulse(p),a); stroke(ctx,[[22,-54],[58,-50],[82,-42]],hi,2,.8*pulse(p)); return;}
  // US: narrow spike grows from the top of the forearm and retracts.
  if(this==='us'){const e=phase(p,.16,.58),r=phase(p,.72,1); const len=16+42*smooth(e)*(1-r*.75); capsule(ctx,18,-46,18,-46-len,7,hi,pulse(p)); poly(ctx,[[11,-46-len*.55],[18,-46-len],[25,-46-len*.55]],c,pulse(p),'#FFFFFF'); spark(ctx,18,-48-len,9,hi,.7*pulse(p)); return;}
  // DS: knees lock into plates, then a low ridge rises under the body.
  if(this==='ds'){metal(ctx,-18,-18,28,12,dark,.9);metal(ctx,18,-18,28,12,dark,.9);const e=phase(p,.3,.68);poly(ctx,[[-54,0],[-30,-10],[0,-14],[30,-10],[54,0],[28,10],[-28,10]],c,e,'#FFFFFF'); return;}
  // SH: entire arm becomes a cleaver and sweeps over the head.
  if(this==='uh'){const a=-2.7+q*2.8; const ex=35+Math.cos(a)*78,ey=-44+Math.sin(a)*78; capsule(ctx,14,-45,ex,ey,17,c,pulse(p)); metal(ctx,ex,ey,78,32,hi,pulse(p),a); for(let i=0;i<4;i++) metal(ctx,ex-Math.cos(a)*i*13,ey-Math.sin(a)*i*13,34,8,dark,.5*pulse(p),a); return;}
  // DH: legs merge into drill, then flatten into a shock plate.
  if(this==='sh'){const e=smooth(phase(p,.12,.82)); const a=-.75+e*1.45; const ex=45+Math.cos(a)*105,ey=-42+Math.sin(a)*55; metal(ctx,35+e*70,-42,115,48,hi,pulse(p),a); capsule(ctx,10,-42,ex,ey,20,c,pulse(p)); metal(ctx,ex,ey,72,58,hi,pulse(p),a); return;}
  if(this==='dh'){const e=phase(p,.1,.55); capsule(ctx,-8,-8,18,-56,18,c,e); capsule(ctx,8,-8,34,-56,18,hi,e); if(p>.5){const z=phase(p,.5,.9);poly(ctx,[[-68,4],[-38,-8],[0,-12],[38,-8],[68,4],[48,16],[-48,16]],c,z,'#FFFFFF');} return;}
  // SP: layered armored fist, pullback, straight punch.
  if(this==='sp'){const e=phase(p,0,.3),hit=phase(p,.42,.72); for(let i=0;i<5;i++) metal(ctx,22+i*5,-48,42+i*10,30+i*8, i%2?c:hi,.45+.1*i,p*.2); const px=18+smooth(hit)*145; capsule(ctx,8,-48,px,-48,26,hi,pulse(hit)); if(p>.62){circle(ctx,px,-48,30+hit*12,'#FFFFFF',pulse(hit));spark(ctx,px,-48,54,hi,pulse(hit),10);} return; }
  // default dh-ish
  metal(ctx,32,-44,70,24,c,pulse(p));
}

function kaito(ctx,p){
  const c='#FF5A24', hot='#FFB12A', q=out(p);
  if(this==='ss'){const e=phase(p,.18,.62); const kneeX=26+smooth(e)*34; flame(ctx,kneeX,-38,18,c,pulse(p),-.25); capsule(ctx,14,-24,kneeX,-38,13,c,pulse(p)); flame(ctx,kneeX+5,-40,11,hot,.8*pulse(p),-.2); return;}
  if(this==='us'){const e=phase(p,.18,.62); capsule(ctx,8,-42,10,-100-smooth(e)*24,12,c,pulse(p)); flame(ctx,14,-76,25,c,pulse(p),0); flame(ctx,0,-58,13,hot,.7*pulse(p),-.3); return;}
  if(this==='ds'){const e=phase(p,.3,.7); circle(ctx,0,-5,8,hot,e); if(p>.48){for(let i=0;i<4;i++) flame(ctx,(i-1.5)*11,-10-e*35,12,c,pulse(p),0); } return;}
  if(this==='uh'){const e=smooth(phase(p,.18,.8)); const kickA=-1.15+e*2.5; const lx=12+Math.cos(kickA)*88,ly=-30+Math.sin(kickA)*88; capsule(ctx,8,-30,lx,ly,12,c,pulse(p)); for(let i=0;i<9;i++){const a=-1.15+e*2.5-i*.05; flame(ctx,12+Math.cos(a)*88,-30+Math.sin(a)*88,10,c,.4*pulse(p),a+.8);} return;}
  if(this==='sh'){const e=smooth(phase(p,.15,.82)); const px=35+e*105; flame(ctx,55+e*45,-48,38,c,.7*pulse(p),0); capsule(ctx,8,-48,px,-48,24,c,pulse(p)); flame(ctx,px+8,-48,28,hot,pulse(p),0); return;}
  if(this==='dh'){const e=phase(p,.18,.8); for(let i=0;i<5;i++){const px=25+i*27*e; circle(ctx,px,-7,9,c,.7*pulse(p)); flame(ctx,px,-16,13,hot,.75*pulse(p),0); } return;}
  if(this==='sp'){const e=phase(p,.0,.38),dash=phase(p,.45,.72); flame(ctx,0,-55,48+e*12,c,.65+e*.2,0); flame(ctx,35+smooth(dash)*115,-45,30,c,pulse(dash),0); capsule(ctx,0,-48,40+smooth(dash)*115,-45,25,c,pulse(dash)); circle(ctx,45+smooth(dash)*115,-45,22,hot,pulse(dash)); return;}
  if(this==='super'){return;}
  if(this==='down'){return;}
  // side heavy/body blow
  if(this==='sh'){return;}
  flame(ctx,48,-45,24,c,pulse(p));
}

function hana(ctx,p){
  const c='#42B8FF', hi='#D8F7FF', q=out(p);
  if(this==='us'){const e=phase(p,.15,.6); for(let i=0;i<7;i++){const xx=(i-3)*10; water(ctx,[[xx,-2],[xx*1.05,-30-e*60],[xx*.8,-80-e*35]],c,7,.35*pulse(p));} ring(ctx,0,-6,46*e,10*e,hi,.65*pulse(p),4); return;}
  if(this==='ds'){const e=phase(p,.22,.65); for(let i=0;i<10;i++){const a=Math.PI*2*i/10+q; const r=24+18*e; circle(ctx,Math.cos(a)*r,-8+Math.sin(a)*r*.35,5,c,.55*pulse(p));} ring(ctx,0,-8,38,16,c,.8*pulse(p),5); return;}
  if(this==='ss'){const e=smooth(phase(p,.12,.75)); const pts=[[8,-46],[38+e*35,-48],[70+e*18,-30]]; water(ctx,pts,c,9,pulse(p)); water(ctx,[[8,-43],[38+e*35,-45],[70+e*18,-27]],hi,2.5,.55*pulse(p)); return;}
  if(this==='uh'){const e=smooth(phase(p,.12,.78)); const pts=[]; for(let i=0;i<=14;i++){const ang=-Math.PI/2+i/14*Math.PI*2;pts.push([Math.cos(ang)*48*e,-55+Math.sin(ang)*85*e]);} water(ctx,pts,c,14,pulse(p)); for(let i=0;i<5;i++)water(ctx,[[0,-5],[Math.cos(-Math.PI/2+i*.18)*55*e,-55-Math.sin(i*.2)*65*e]],hi,3,.5*pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.15,.8)); const pts=[]; for(let i=0;i<=18;i++){const a=-1.15+i/18*2.3;pts.push([20+Math.cos(a)*100*e,-48+Math.sin(a)*70*e]);} water(ctx,pts,c,15,pulse(p)); return;}
  if(this==='dh'){const e=phase(p,.2,.72); const side=q>.5?1:-1; const r=76*e; ctx.save();ctx.rotate(side*.12); water(ctx,[[-r,-8],[0,5],[r,-8]],c,12,pulse(p));ctx.restore(); for(let i=0;i<8;i++) water(ctx,[[side*15+i*side*7,-5],[side*(25+i*8),-40-pulse(p)*30]],hi,3,.45*pulse(p)); return;}
  if(this==='sp'){const e=phase(p,.0,.35),b=phase(p,.45,.75); ring(ctx,0,-45,70+e*12,58+e*8,c,.35+.2*p,5); for(let i=0;i<18;i++){const a=i/18*TAU;const rr=24+smooth(b)*105; circle(ctx,Math.cos(a)*rr,-45+Math.sin(a)*rr*.72,7,hi,.75*pulse(b));} return;}
  if(this==='down'){return;}
  water(ctx,[[8,-45],[80*q,-44]],c,10,pulse(p));
}

function daigo(ctx,p){
  const c='#A88A67', hi='#D6C1A2', q=out(p);
  if(this==='us'){const e=phase(p,.1,.65); stone(ctx,0,-10,70,30,c,pulse(p),-.04); stone(ctx,0,-45-e*95,64,36,hi,pulse(p),-.03); if(p>.58){stone(ctx,-35,-70-e*70,44,26,c,.8*pulse(p),-.3);stone(ctx,35,-70-e*70,44,26,c,.8*pulse(p),.3);} return;}
  if(this==='ds'){const e=phase(p,.2,.6); poly(ctx,[[-38,4],[-12,-30*e],[0,-50*e],[12,-30*e],[38,4]],c,pulse(p),'#F0E0C5'); return;}
  if(this==='ss'){const e=smooth(phase(p,.15,.7)); stone(ctx,35+e*45,-44,58,48,hi,pulse(p),-.08); capsule(ctx,8,-42,68+e*45,-44,17,c,pulse(p)); return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.7)); stone(ctx,0,-20-e*90,80,36,c,pulse(p),0); if(p>.45){stone(ctx,-32,-80-e*70,52,34,hi,.8*pulse(p),-.35);stone(ctx,32,-80-e*70,52,34,hi,.8*pulse(p),.35);} return;}
  if(this==='sh'){const e=smooth(phase(p,.12,.8)); const a=-.9+e*1.7; const bx=28+Math.cos(a)*80,by=-45+Math.sin(a)*80; stone(ctx,bx,by,105,58,c,pulse(p),a); return;}
  if(this==='dh'){const e=phase(p,.05,.58); stone(ctx,30,-160*e,95,62,hi,pulse(p),.05); if(p>.55){const z=phase(p,.55,.95); for(let i=0;i<5;i++) stone(ctx,(i-2)*24*z,-4,38,30,c,pulse(z),i*.3); } return;}
  if(this==='sp'){const e=phase(p,.0,.35),h=phase(p,.4,.75); stone(ctx,40,-48,100+e*30,90+e*20,hi,.65); const px=30+smooth(h)*130; stone(ctx,px,-48,105,100,c,pulse(h),-.03); capsule(ctx,5,-48,px,-48,27,c,pulse(h)); if(p>.65) spark(ctx,px,-48,55,hi,pulse(p),12); return;}
  stone(ctx,50,-46,75,35,c,pulse(p));
}

function suzu(ctx,p){
  const c='#B8FFF2', hi='#F4FFFF', q=out(p);
  if(this==='us'){const e=smooth(phase(p,.1,.7)); gust(ctx,0,-8,40,c,.8*pulse(p),-.1); const lx=22+e*58,ly=-30-e*70; capsule(ctx,5,-25,lx,ly,10,hi,pulse(p)); gust(ctx,lx,ly,24,c,.65*pulse(p),-.4); return;}
  if(this==='ds'){const e=phase(p,.15,.7); ring(ctx,0,-18,20+e*55,12+e*30,c,.7*pulse(p),4); gust(ctx,0,-5,55,c,.65*pulse(p),Math.PI/2); return;}
  if(this==='ss'){const e=smooth(phase(p,.12,.75)); capsule(ctx,8,-35,88+e*42,-52,10,hi,pulse(p)); gust(ctx,30+e*80,-50,35,c,.8*pulse(p),0); return;}
  if(this==='uh'){const e=smooth(phase(p,.12,.82)); const a=-1.0+e*2.2; for(let i=0;i<3;i++) gust(ctx,25+Math.cos(a+i*.1)*70,-48+Math.sin(a+i*.1)*50,48,c,.55*pulse(p),a+.7); capsule(ctx,8,-42,25+Math.cos(a)*90,-48+Math.sin(a)*65,12,c,pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.15,.82)); const px=40+e*100; gust(ctx,px,-48,42,c,.75*pulse(p),0); gust(ctx,px-45,-35,34,hi,.55*pulse(p),Math.PI); stroke(ctx,[[10,-42],[px,-48],[px-30,-85]],c,5,.7*pulse(p)); return;}
  if(this==='dh'){const e=smooth(phase(p,.1,.7)); gust(ctx,20,-20,60,c,.7*pulse(p),Math.PI/2); ring(ctx,20,-10,70*e,28*e,hi,.6*pulse(p),3); return;}
  if(this==='sp'){const e=phase(p,.0,.45),dash=phase(p,.45,.8); ring(ctx,0,-48,62+e*10,52+e*8,c,.35+.15*p,4); const a=-Math.PI/2+smooth(dash)*TAU; const px=Math.cos(a)*70,py=-48+Math.sin(a)*55; gust(ctx,px,py,45,c,pulse(dash),a); if(p>.75) ring(ctx,0,-48,85,70,c,pulse(p),5); return;}
  gust(ctx,55,-45,25,c,pulse(p),0);
}

function mai(ctx,p){
  const c='#7650A8', dark='#171322', hi='#B58BEA', q=out(p);
  if(this==='us'){const e=phase(p,.12,.65); shadow(ctx,0,-40,24+e*20,35+e*35,dark,pulse(p)); shadow(ctx,0,-85-e*35,32,18,c,pulse(p)); for(let i=0;i<8;i++) circle(ctx,(i-3.5)*7,-85-e*35+Math.sin(i)*7,3,c,.5*pulse(p)); return;}
  if(this==='ds'){const e=phase(p,.2,.7); shadow(ctx,0,0,45+e*30,12+e*6,dark,.8*pulse(p)); const hx=35+e*70; shadow(ctx,hx,-25,18,32,c,pulse(p),-.2); return;}
  if(this==='ss'){const e=smooth(phase(p,.15,.75)); shadow(ctx,35+e*55,-4,42,10,dark,.8); shadow(ctx,55+e*65,-38,22,30,c,pulse(p),-.2); return;}
  if(this==='uh'){const e=smooth(phase(p,.12,.78)); shadow(ctx,0,-80-e*35,75,18,c,pulse(p),-.25); shadow(ctx,0,-80-e*35,75,18,c,pulse(p),.25); stroke(ctx,[[-10,-30],[0,-85-e*35],[10,-30]],hi,5,.7*pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.12,.8)); const a=-1.0+e*2.1; shadow(ctx,30+Math.cos(a)*90,-48+Math.sin(a)*65,75,16,c,pulse(p),a); stroke(ctx,[[15,-50],[30+Math.cos(a)*90,-48+Math.sin(a)*65]],hi,8,.6*pulse(p)); return;}
  if(this==='dh'){const e=phase(p,.2,.75); shadow(ctx,0,-65,28,70,dark,pulse(p)); const hx=75*e; shadow(ctx,hx,-70,28,44,c,pulse(p),.2); return;}
  if(this==='sp'){const e=phase(p,.15,.5),h=phase(p,.5,.78); shadow(ctx,0,-45,80+e*12,70+e*8,dark,.7); shadow(ctx,-5,-45,90,65,c,.45); const a=-.8+smooth(h)*1.6; shadow(ctx,Math.cos(a)*90,-45+Math.sin(a)*55,50,14,hi,pulse(h),a); if(p>.7) ring(ctx,0,-45,105,80,c,pulse(p),4); return;}
  shadow(ctx,55,-45,30,15,c,pulse(p));
}

function osamu(ctx,p){
  const c='#FFE38A', hi='#FFFFFF', q=out(p);
  if(this==='us'){const e=phase(p,.1,.65); soundRing(ctx,0,-50-e*75,14+e*40,c,pulse(p)); soundRing(ctx,0,-70-e*70,10+e*25,hi,.45*pulse(p)); return;}
  if(this==='ds'){const e=phase(p,.2,.7); for(let i=0;i<5;i++) soundRing(ctx,(i-2)*24,-5-e*12,12+e*25,c,.55*pulse(p)); return;}
  if(this==='ss'){const e=smooth(phase(p,.12,.72)); soundRing(ctx,25+e*85,-45,14+e*24,c,pulse(p)); stroke(ctx,[[10,-45],[40+e*80,-45]],hi,3,.45*pulse(p)); return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.8)); for(let i=0;i<5;i++) soundRing(ctx,0,-45-i*22*e,18+i*7,c,.65*pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.12,.82)); for(let i=0;i<4;i++) soundRing(ctx,30+e*70,-45+i*2,20+i*8,c,.6*pulse(p)); capsule(ctx,8,-45,90+e*70,-45,12,hi,.65*pulse(p)); return;}
  if(this==='dh'){const e=phase(p,.15,.75); for(let i=0;i<10;i++){const a=i/10*TAU; soundRing(ctx,Math.cos(a)*(35+e*45),-5+Math.sin(a)*(15+e*9),10+e*20,c,.6*pulse(p));} return;}
  if(this==='sp'){const e=phase(p,.0,.42),r=phase(p,.45,.8); ring(ctx,0,-45,75+e*12,58+e*10,c,.35+.2*e,4); for(let i=0;i<16;i++){const a=i/16*TAU;const rr=20+smooth(r)*115;soundRing(ctx,Math.cos(a)*rr,-45+Math.sin(a)*rr*.72,8,c,.65*pulse(r));} if(p>.72) ring(ctx,0,-45,120,90,hi,pulse(p),5); return;}
  soundRing(ctx,55,-45,20,c,pulse(p));
}

function yui(ctx,p){
  const c='#FFF2A8', hi='#FFFFFF', q=out(p);
  if(this==='us'){const e=phase(p,.15,.65); star(ctx,0,-70-e*35,20+e*10,c,pulse(p)); ring(ctx,0,-8,30+e*20,12+e*6,hi,.6*pulse(p),3); return;}
  if(this==='ds'){const e=phase(p,.2,.65); star(ctx,0,-8,14+e*20,c,pulse(p)); ring(ctx,0,-8,28+e*25,12+e*10,hi,.5*pulse(p),3); return;}
  if(this==='ss'){const e=smooth(phase(p,.1,.7)); star(ctx,25+e*65,-45,10+e*5,c,pulse(p)); return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.7)); star(ctx,0,-125*e-25,34,c,pulse(p)); for(let i=0;i<5;i++)stroke(ctx,[[0,-95*e-25],[(i-2)*14,-30]],hi,3,.45*pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.12,.8)); const a=-1+e*2; star(ctx,35+Math.cos(a)*75,-45+Math.sin(a)*60,30,c,pulse(p),a); ring(ctx,35+Math.cos(a)*75,-45+Math.sin(a)*60,42,20,hi,.55*pulse(p),3,a); return;}
  if(this==='dh'){const e=phase(p,.15,.75); ring(ctx,0,2,70*e,22*e,c,.7*pulse(p),5); for(let i=0;i<8;i++) star(ctx,(i-3.5)*18*e,-5,8,c,.55*pulse(p)); return;}
  if(this==='sp'){const e=phase(p,.0,.4),r=phase(p,.45,.8); star(ctx,0,-48,70+e*12,c,.55); ring(ctx,0,-48,82+e*10,62+e*8,hi,.5); for(let i=0;i<12;i++){const a=i/12*TAU;const rr=20+smooth(r)*110;star(ctx,Math.cos(a)*rr,-48+Math.sin(a)*rr*.7,10,c,.7*pulse(r),a);} return;}
  star(ctx,60,-45,22,c,pulse(p));
}

function ibuki(ctx,p){
  const c='#D7E1E4', dark='#6E3A4A', hi='#FFB7C9', q=out(p);
  if(this==='us'){const e=phase(p,.12,.65); capsule(ctx,0,-45,0,-110-e*30,10,c,pulse(p)); for(let i=0;i<7;i++) circle(ctx,(i-3)*9,-95-e*25+Math.sin(i)*8,4,hi,.6*pulse(p)); return;}
  if(this==='ds'){const e=phase(p,.15,.7); ring(ctx,0,-6,28+e*45,14+e*15,dark,.7*pulse(p),4); for(let i=0;i<6;i++){const a=i/6*TAU;stroke(ctx,[[Math.cos(a)*55,-6+Math.sin(a)*18],[Math.cos(a)*20,-6+Math.sin(a)*8]],hi,3,.5*pulse(p));} return;}
  if(this==='ss'){const e=smooth(phase(p,.1,.75)); capsule(ctx,10,-45,95+e*30,-45,5,dark,pulse(p)); circle(ctx,100+e*30,-45,9,hi,pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.12,.8)); const a=-.8+e*1.6; capsule(ctx,10,-45,70+Math.cos(a)*85,-45+Math.sin(a)*55,11,c,pulse(p)); for(let i=0;i<6;i++) circle(ctx,25+e*70,-45+Math.sin(a)*45+(i-3)*6,4,hi,.45*pulse(p)); return;}
  if(this==='dh'){const e=phase(p,.12,.75); ring(ctx,0,-10,60+e*30,35+e*16,dark,.65*pulse(p),6); for(let i=0;i<12;i++){const a=i/12*TAU; circle(ctx,Math.cos(a)*(30+e*50),-10+Math.sin(a)*(18+e*25),5,hi,.65*pulse(p));} return;}
  if(this==='sp'){const e=phase(p,.0,.35),r=phase(p,.4,.8); circle(ctx,0,-45,38+e*12,hi,.35); for(let i=0;i<18;i++){const a=i/18*TAU;const rr=20+smooth(r)*115;circle(ctx,Math.cos(a)*rr,-45+Math.sin(a)*rr*.72,6,c,.75*pulse(r));} ring(ctx,0,-45,115,82,hi,pulse(p),4); return;}
  circle(ctx,55,-45,18,hi,pulse(p));
}

function nishikawa(ctx,p){
  const c='#D58CFF', hi='#F7E9FF', q=out(p);
  if(this==='us'){const e=phase(p,.1,.65); thread(ctx,[[0,-35],[0,-85-e*55],[0,-125-e*25]],c,.7*pulse(p),4); thread(ctx,[[-16,-112-e*20],[0,-126-e*25],[16,-112-e*20]],hi,.7*pulse(p),3); return;}
  if(this==='ds'){const e=phase(p,.15,.72); thread(ctx,[[-12,-5],[-35,-30-e*15],[-50,-8]],c,pulse(p),5);thread(ctx,[[12,-5],[35,-30-e*15],[50,-8]],c,pulse(p),5); return;}
  if(this==='ss'){const e=smooth(phase(p,.12,.78)); const ex=40+e*95; thread(ctx,[[8,-45],[45,-70+e*30],[ex,-45]],c,pulse(p),4); for(let i=0;i<5;i++) thread(ctx,[[ex,-45],[ex+15,-45+(i-2)*10]],hi,.45*pulse(p),2); return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.78)); for(let i=0;i<7;i++){const xx=(i-3)*18;thread(ctx,[[xx,-35],[xx,-95-e*55]],c,.7*pulse(p),4);circle(ctx,xx,-95-e*55,8,hi,.7*pulse(p));} return;}
  if(this==='sh'){const e=smooth(phase(p,.1,.8)); const ex=45+e*100; for(let i=0;i<8;i++){const yy=-75+i*8;thread(ctx,[[8,-45],[ex,yy],[ex+25,yy+(i-3.5)*3]],c,.7*pulse(p),3);} return;}
  if(this==='dh'){const e=phase(p,.2,.75); thread(ctx,[[-55,-5],[-35,-55-e*30],[0,-20]],c,.8*pulse(p),6);thread(ctx,[[55,-5],[35,-55-e*30],[0,-20]],c,.8*pulse(p),6); circle(ctx,0,-20,16,hi,.65*pulse(p)); return;}
  if(this==='sp'){const e=phase(p,.0,.4),h=phase(p,.45,.8); ring(ctx,0,-45,85+e*10,65+e*8,c,.4,4); for(let i=0;i<10;i++){const a=i/10*TAU;const rr=30+smooth(h)*90;thread(ctx,[[Math.cos(a)*rr,-45+Math.sin(a)*rr*.7],[Math.cos(a)*15,-45+Math.sin(a)*15]],c,.75*pulse(h),3);} if(p>.7){for(let i=0;i<8;i++){const a=i/8*TAU;thread(ctx,[[Math.cos(a)*90,-45+Math.sin(a)*65],[Math.cos(a)*20,-45+Math.sin(a)*15]],hi,pulse(p),4);}} return;}
  thread(ctx,[[10,-45],[80,-45]],c,pulse(p),4);
}

function itto(ctx,p){
  const c='#DDE5EA', red='#A8B4BF', q=out(p);
  if(this==='us'){const e=smooth(phase(p,.12,.7)); blade(ctx,10,-45,110*e,18,c,pulse(p),-Math.PI/2); stroke(ctx,[[10,-45],[10,-45-100*e]],'#FFFFFF',2,.7*pulse(p)); return;}
  if(this==='ds'){const e=smooth(phase(p,.12,.72)); blade(ctx,0,-30,100*e,16,c,pulse(p),Math.PI/2); stroke(ctx,[[0,-30],[0,20]],red,3,.65*pulse(p)); return;}
  if(this==='ss'){const e=smooth(phase(p,.1,.7)); blade(ctx,12,-48,115*e,14,c,pulse(p),-.08); stroke(ctx,[[22,-54],[100*e,-52]],'#FFFFFF',2,.7*pulse(p)); return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.75)); blade(ctx,10,-45,135*e,20,c,pulse(p),-Math.PI/2); stroke(ctx,[[10,-45],[10,-45-125*e]],'#FFFFFF',3,.7*pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.1,.82)); blade(ctx,18,-45,160*e,22,c,pulse(p),-.15); stroke(ctx,[[25,-54],[145*e,-58]],red,4,.45*pulse(p)); return;}
  if(this==='dh'){const e=smooth(phase(p,.15,.75)); blade(ctx,5,-28,115*e,18,c,pulse(p),Math.PI/2); stroke(ctx,[[5,-28],[115*e,-28]],red,2,.6*pulse(p)); return;}
  if(this==='sp'){const e=phase(p,.15,.45),h=phase(p,.5,.72); ring(ctx,0,-45,35+e*15,22+e*8,c,.35); if(p>.35){const len=60+smooth(h)*220;blade(ctx,10,-48,len,32,c,pulse(h),-.08);stroke(ctx,[[25,-62],[len,-58]],'#FFFFFF',3,.7*pulse(h));} return;}
  blade(ctx,15,-45,80,c,14,pulse(p),0);
}

function foxes(ctx,p){
  const c='#FF8A2A', hi='#FFD77A', white='#FFF4DD', q=out(p);
  if(this==='us'){const e=smooth(phase(p,.1,.7)); flame(ctx,-22,-28-e*65,16,c,pulse(p),-.2); flame(ctx,22,-28-e*80,16,hi,pulse(p),.2); return;}
  if(this==='ds'){const e=phase(p,.15,.75); const a=-.8+e*1.6; flame(ctx,Math.cos(a)*38,-42+Math.sin(a)*30,15,c,pulse(p),a); flame(ctx,-Math.cos(a)*38,-42-Math.sin(a)*30,15,hi,pulse(p),a+Math.PI); return;}
  if(this==='ss'){const e=smooth(phase(p,.12,.8)); const a=1.0+e*1.2; const p1=[Math.cos(a)*70,-45+Math.sin(a)*45],p2=[Math.cos(Math.PI-a)*70,-45+Math.sin(Math.PI-a)*45]; flame(ctx,p1[0],p1[1],14,c,pulse(p),a);flame(ctx,p2[0],p2[1],14,hi,pulse(p),Math.PI-a); return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.75)); flame(ctx,-22,-30-e*70,18,c,pulse(p),-.2); flame(ctx,22,-30-e*80,18,hi,pulse(p),.2); stroke(ctx,[[-22,-30],[22,-30-e*80]],white,4,.45*pulse(p)); return;}
  if(this==='sh'){const e=smooth(phase(p,.12,.8)); const a=-.9+e*1.8; flame(ctx,35+Math.cos(a)*85,-45+Math.sin(a)*55,18,c,pulse(p),a); flame(ctx,35+Math.cos(a+Math.PI)*85,-45+Math.sin(a+Math.PI)*55,18,hi,pulse(p),a+Math.PI); return;}
  if(this==='dh'){const e=smooth(phase(p,.15,.78)); flame(ctx,-65+e*55,-45,18,c,pulse(p),0);flame(ctx,65-e*55,-45,18,hi,pulse(p),Math.PI); return;}
  if(this==='sp'){const e=phase(p,.0,.35),h=phase(p,.42,.8); for(let side of [-1,1]){flame(ctx,side*28,-65,42,side<0?c:hi,.65);const a=side*(Math.PI/2+smooth(h)*Math.PI);const px=Math.cos(a)*90,py=-45+Math.sin(a)*60;flame(ctx,px,py,26,side<0?c:hi,pulse(h),a);} if(p>.7){ring(ctx,0,-45,105,70,c,pulse(p),5);ring(ctx,0,-45,80,55,hi,pulse(p),3);} return;}
  flame(ctx,50,-45,20,c,pulse(p));
}

function utsuro(ctx,p){
  const c='#7D4AA5', dark='#1A1025', hi='#B98AD8', q=out(p);
  function hollow(px,py,s,ang=0,a=1){ctx.save();ctx.translate(px,py);ctx.rotate(ang);poly(ctx,[[-s*.55,s*.2],[-s*.25,-s*.6],[s*.2,-s*.8],[s*.65,-s*.1],[s*.35,s*.55],[-s*.1,s*.75]],dark,a,hi);circle(ctx,0,-s*.1,s*.16,hi,.8*a);ctx.restore();}
  if(this==='us'){const e=smooth(phase(p,.1,.65));hollow(0,-65-e*45,28,0,pulse(p));for(let i=0;i<5;i++)stroke(ctx,[[0,-65-e*35],[(i-2)*9,-30]],hi,3,.4*pulse(p));return;}
  if(this==='ds'){const e=phase(p,.15,.75);hollow(0,0,38,0,pulse(p));return;}
  if(this==='ss'){const e=smooth(phase(p,.1,.75));hollow(25+e*90,-45,28,.15,pulse(p));return;}
  if(this==='uh'){const e=smooth(phase(p,.1,.75));hollow(0,-85-e*60,48,-.05,pulse(p));stroke(ctx,[[0,-35],[-15,-85-e*45]],hi,7,.6*pulse(p));return;}
  if(this==='sh'){const e=smooth(phase(p,.1,.8));hollow(30+e*100,-45,55,.05,pulse(p));for(let i=0;i<4;i++)stroke(ctx,[[30+e*50,-45+i*8],[110+e*30,-45+i*5]],c,5,.45*pulse(p));return;}
  if(this==='dh'){const e=phase(p,.15,.75);for(let i=0;i<3;i++)hollow((i-1)*45*e,-5,24,0,.75*pulse(p));return;}
  if(this==='sp'){const e=phase(p,.0,.4),h=phase(p,.45,.78);hollow(0,-48,80,0,.6);ring(ctx,0,-48,95,70,c,.4,5);if(p>.45){circle(ctx,0,-48,55+smooth(h)*50,hi,pulse(h));for(let i=0;i<12;i++){const a=i/12*TAU;stroke(ctx,[[0,-48],[Math.cos(a)*(60+smooth(h)*50),-48+Math.sin(a)*(45+smooth(h)*40)]],c,6,.5*pulse(h));}}return;}
  hollow(55,-45,28,0,pulse(p));
}

function attackDetail(ctx, charId, move, p, c) {
  const q = smooth(pulse(p));
  const hi = '#FFFFFF';
  if (charId === 'g2_renji') {
    const metalC = '#DDE5EA';
    if (move !== 'sp') {
      ring(ctx, 18, -46, 17 + q * 7, 10 + q * 4, metalC, .35 * q, 2);
      for (let i = 0; i < 3; i++) stroke(ctx, [[28 + i * 4, -54 + i * 5], [42 + i * 8, -58 + i * 5]], hi, 1.5, .4 * q);
    }
    if (move === 'sh' || move === 'uh') {
      blade(ctx, 18, -48, 48 + q * 20, 8, metalC, .45 * q, -.18);
      spark(ctx, 40 + q * 35, -52, 12, metalC, .65 * q, 6);
    }
  } else if (charId === 'g2_kaito') {
    for (let i = 0; i < 4; i++) {
      const a = -1.8 + i * .65 + p * 1.2;
      flame(ctx, Math.cos(a) * 22, -48 + Math.sin(a) * 22, 7 + i, c, .35 * q, a + Math.PI / 2);
    }
    if (move === 'sp') ring(ctx, 0, -48, 55 + q * 20, 38 + q * 12, hi, .3 * q, 3);
  } else if (charId === 'g2_hana') {
    const r = 24 + q * 28;
    ring(ctx, 0, -45, r, r * .55, '#E9FBFF', .4 * q, 2);
    water(ctx, [[-r, -45], [-r * .35, -55 - q * 12], [r * .2, -38 + q * 8], [r, -48]], c, 3, .55 * q);
    if (move === 'us' || move === 'uh') water(ctx, [[-10,-30],[0,-70-q*30],[10,-30]], hi, 2, .5*q);
  } else if (charId === 'g2_daigo') {
    if (move !== 'sp') {
      stone(ctx, -20, -22, 18 + q * 10, 12 + q * 8, c, .42 * q, -.25);
      stone(ctx, 35, -20, 14 + q * 8, 10 + q * 7, '#D7C4A8', .32 * q, .3);
    }
    if (move === 'dh' || move === 'sp') {
      for (let i = 0; i < 5; i++) circle(ctx, -45 + i * 22, -8 - q * 14, 2.5 + q * 2, '#E3D4BC', .55 * q);
    }
  } else if (charId === 'g2_suzu') {
    const a = -1.2 + p * 2.5;
    gust(ctx, 18 + Math.cos(a) * 35, -46 + Math.sin(a) * 25, 28 + q * 20, c, .45 * q, a);
    stroke(ctx, [[-8,-52],[18,-46],[45,-50]], hi, 2, .35 * q);
  } else if (charId === 'g2_mai') {
    shadow(ctx, 0, -46, 38 + q * 16, 28 + q * 10, '#171322', .35 * q);
    for (let i = 0; i < 3; i++) {
      const yy = -58 + i * 12;
      stroke(ctx, [[-18,yy],[18,yy + Math.sin(p*8+i)*5]], hi, 2, .25 * q);
    }
    if (move === 'uh' || move === 'sp') ring(ctx, 0, -48, 55 + q * 20, 42 + q * 12, c, .35 * q, 3);
  } else if (charId === 'g2_osamu') {
    for (let i = 0; i < 3; i++) soundRing(ctx, 18 + i * 16, -48 + i * 3, 8 + q * 5, i % 2 ? hi : c, .3 * q);
    if (move === 'sp') { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; stroke(ctx, [[Math.cos(a)*35,-48+Math.sin(a)*22],[Math.cos(a)*55,-48+Math.sin(a)*34]], hi, 2, .28*q); } }
  } else if (charId === 'g2_yui') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + p * 2;
      star(ctx, Math.cos(a) * (24 + q * 18), -48 + Math.sin(a) * (16 + q * 12), 4 + q * 3, i % 2 ? hi : c, .5 * q, a);
    }
    ring(ctx, 0, -48, 32 + q * 20, 20 + q * 10, hi, .3 * q, 2);
  } else if (charId === 'g2_ibuki') {
    const a = p * TAU;
    for (let i = 0; i < 6; i++) {
      const r = 18 + i * 8 + q * 18;
      circle(ctx, Math.cos(a + i) * r, -45 + Math.sin(a + i) * r * .6, 3.5, i % 2 ? hi : c, .45 * q);
    }
    ring(ctx, 0, -45, 36 + q * 18, 24 + q * 12, '#FFB7C9', .28 * q, 2);
  } else if (charId === 'g2_nishikawa') {
    const sway = Math.sin(p * TAU) * 10;
    for (let i = -2; i <= 2; i++) {
      thread(ctx, [[i * 12, -34], [i * 18 + sway, -55], [i * 28 + sway * .4, -78]], i % 2 ? hi : c, .35 * q, 2);
    }
    if (move === 'sp') ring(ctx, 0, -48, 70 + q * 20, 48 + q * 12, hi, .28 * q, 2);
  } else if (charId === 'g2_itto') {
    stroke(ctx, [[16,-54],[48 + q * 75,-58 + Math.sin(p*4)*4]], hi, 2, .5 * q);
    stroke(ctx, [[18,-40],[54 + q * 90,-36 + Math.sin(p*5)*3]], c, 1.5, .35 * q);
    if (move === 'ss' || move === 'sh' || move === 'sp') spark(ctx, 55 + q * 80, -48, 16, hi, .65 * q, 8);
  } else if (charId === 'g2_twinfoxes') {
    for (const side of [-1, 1]) {
      const fx = side * (20 + q * 22), fy = -48 - q * 18;
      circle(ctx, fx, fy, 9, side < 0 ? c : '#FFD77A', .4 * q);
      flame(ctx, fx + side * 8, fy - 4, 7, side < 0 ? c : '#FFD77A', .45 * q, side * .3);
    }
    if (move === 'sp') ring(ctx, 0, -48, 58 + q * 30, 40 + q * 18, hi, .3 * q, 3);
  } else if (charId === 'g2_utsuro') {
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + p * 2;
      const r = 28 + q * 24;
      stroke(ctx, [[Math.cos(a)*12,-48+Math.sin(a)*10],[Math.cos(a)*r,-48+Math.sin(a)*r*.65]], hi, 2.5, .28*q);
    }
    ring(ctx, 0, -48, 42 + q * 20, 30 + q * 14, c, .25 * q, 2);
  }
}

const ANIM = { g2_renji:renji,g2_kaito:kaito,g2_hana:hana,g2_daigo:daigo,g2_suzu:suzu,g2_mai:mai,g2_osamu:osamu,g2_yui:yui,g2_ibuki:ibuki,g2_nishikawa:nishikawa,g2_itto:itto,g2_twinfoxes:foxes,g2_utsuro:utsuro };

export function drawGen2Attack(ctx,x,y,color,p,facing,charId,moveKey){
  const fn=ANIM[charId]; if(!fn) return false;
  ctx.save(); ctx.translate(x,y); ctx.scale(facing||1,1);
  ctx.globalAlpha=1; glow(ctx,color||'#fff',10);
  // Extra authored detail layer: weapon edges, particles, motion traces and
  // character-specific visual signatures, kept entirely in local attack space.
  attackDetail(ctx, charId, moveKey, clamp01(p), color||'#fff');
  fn.call(moveKey,ctx,clamp01(p));
  // Fine recovery sparks make the animation read as a complete frame sequence.
  if(p>.82){ctx.globalAlpha=(1-p)*5; for(let i=0;i<4;i++) circle(ctx,(i-1.5)*12,-35-i*5,2,color||'#fff',.7);}
  ctx.restore(); return true;
}

export function drawGen2Super(ctx,x,y,color,p,charId){
  const c=color||'#fff', q=clamp01(p); ctx.save();ctx.translate(x,y);
  if(charId==='g2_renji'){const h=phase(q,.38,.72);metal(ctx,55,-48,130,120,c,.55);for(let i=0;i<5;i++)metal(ctx,55+i*8,-48,70+i*14,65+i*12,i%2?c:'#E8EEF2',.55);capsule(ctx,8,-48,55+smooth(h)*150,-48,34,c,pulse(h));if(q>.7)spark(ctx,55+smooth(h)*150,-48,65,c,pulse(q),14);}
  else if(charId==='g2_kaito'){const h=phase(q,.4,.75);flame(ctx,0,-48,65+q*10,c,.65);for(let i=0;i<10;i++)flame(ctx,Math.cos(i)*30+smooth(h)*120,-48+Math.sin(i)*25,14,c,.6*pulse(h),i*.6);capsule(ctx,5,-48,30+smooth(h)*150,-48,28,c,pulse(h));circle(ctx,30+smooth(h)*150,-48,32,'#FFD27A',pulse(h));}
  else if(charId==='g2_hana'){const e=phase(q,.0,.42),h=phase(q,.45,.82);ring(ctx,0,-48,80+e*12,60+e*8,c,.45);for(let i=0;i<22;i++){const a=i/22*TAU;const r=20+smooth(h)*120;circle(ctx,Math.cos(a)*r,-48+Math.sin(a)*r*.72,7,'#E7FAFF',.75*pulse(h));}ring(ctx,0,-48,125,90,c,pulse(q),5);}
  else if(charId==='g2_daigo'){const e=phase(q,.0,.45),h=phase(q,.45,.78);stone(ctx,55,-45,150+e*30,130+e*20,c,.7);stone(ctx,55+smooth(h)*140,-45,125,110,c,pulse(h));for(let i=0;i<8;i++)stone(ctx,55+Math.cos(i)*50,-45+Math.sin(i)*35,30,25,'#D7C4A8',.6*pulse(h),i*.4);}
  else if(charId==='g2_suzu'){const h=phase(q,.38,.8);ring(ctx,0,-48,75,58,c,.4,4);const a=-Math.PI/2+smooth(h)*TAU;const px=Math.cos(a)*90,py=-48+Math.sin(a)*65;gust(ctx,px,py,55,c,pulse(h),a);if(q>.72)ring(ctx,0,-48,115,85,c,pulse(q),5);}
  else if(charId==='g2_mai'){const h=phase(q,.4,.8);shadow(ctx,0,-48,95,70,'#171322',.8);shadow(ctx,0,-48,105,72,c,.35);const a=-.7+smooth(h)*1.4;shadow(ctx,Math.cos(a)*100,-48+Math.sin(a)*55,65,14,c,pulse(h),a);shadow(ctx,Math.cos(a+Math.PI)*100,-48+Math.sin(a+Math.PI)*55,65,14,c,pulse(h),a+Math.PI);}
  else if(charId==='g2_osamu'){const h=phase(q,.45,.82);ring(ctx,0,-48,95,72,c,.4,4);for(let i=0;i<20;i++){const a=i/20*TAU;const r=20+smooth(h)*125;soundRing(ctx,Math.cos(a)*r,-48+Math.sin(a)*r*.7,9,c,.7*pulse(h));}ring(ctx,0,-48,130,96,'#FFFFFF',pulse(q),5);}
  else if(charId==='g2_yui'){const e=phase(q,0,.4),h=phase(q,.45,.8);star(ctx,0,-48,78+e*10,c,.55);ring(ctx,0,-48,92+e*10,70+e*8,'#FFFFFF',.5);for(let i=0;i<14;i++){const a=i/14*TAU;const r=25+smooth(h)*115;star(ctx,Math.cos(a)*r,-48+Math.sin(a)*r*.7,10,c,.7*pulse(h),a);}}
  else if(charId==='g2_ibuki'){const h=phase(q,.45,.8);ring(ctx,0,-48,100,75,c,.35,5);for(let i=0;i<18;i++){const a=i/18*TAU;const r=25+smooth(h)*110;circle(ctx,Math.cos(a)*r,-48+Math.sin(a)*r*.7,7,i%2?c:'#FFB7C9',.7*pulse(h));}}
  else if(charId==='g2_nishikawa'){const h=phase(q,.4,.82);ring(ctx,0,-48,90,65,c,.4,4);for(let i=0;i<14;i++){const a=i/14*TAU;const r=25+smooth(h)*110;thread(ctx,[[Math.cos(a)*r,-48+Math.sin(a)*r*.7],[Math.cos(a)*15,-48+Math.sin(a)*12]],c,.8*pulse(h),4);}}
  else if(charId==='g2_itto'){const h=phase(q,.4,.78);blade(ctx,10,-48,100+smooth(h)*230,36,c,pulse(h),-.08);stroke(ctx,[[25,-62],[230* smooth(h),-58]],'#FFFFFF',4,.75*pulse(h));}
  else if(charId==='g2_twinfoxes'){const h=phase(q,.4,.8);for(const side of [-1,1]){const a=side*(Math.PI/2+smooth(h)*Math.PI);const px=Math.cos(a)*100,py=-48+Math.sin(a)*70;flame(ctx,px,py,30,side<0?c:'#FFD77A',pulse(h),a);}ring(ctx,0,-48,115,80,c,pulse(q),5);}
  else if(charId==='g2_utsuro'){const h=phase(q,.35,.8);circle(ctx,0,-48,80+smooth(h)*45,'#140B1C',.7);ring(ctx,0,-48,100+smooth(h)*40,75+smooth(h)*30,c,pulse(h),6);for(let i=0;i<12;i++){const a=i/12*TAU;stroke(ctx,[[0,-48],[Math.cos(a)*(70+smooth(h)*80),-48+Math.sin(a)*(50+smooth(h)*55)]],c,7,.6*pulse(h));}}
  ctx.restore();
}

// Precise local-space collision shapes. The drawing above and these coordinates
// deliberately describe the same weapon/energy surfaces.
function C(a,x,y,r){a.push({shape:'circle',x,y,r});}
function K(a,x1,y1,x2,y2,r){a.push({shape:'capsule',x1,y1,x2,y2,r});}
function P(a,points){a.push({shape:'polygon',points});}
function R(a,x,y,w,h){a.push({shape:'box',x,y,w,h});}

export function getGen2Hitboxes(charId,move,p,facing=1){
  const t=clamp01(p), q=out(t), a=[];
  switch(charId){
    case 'g2_renji':
      if(move==='us'){const e=smooth(phase(t,.16,.58));K(a,18,-46,18,-46-(16+42*e),7);C(a,18,-46-(16+42*e),8);}
      else if(move==='ds'){if(t>.28)P(a,[[-54,0],[-30,-10],[0,-14],[30,-10],[54,0],[28,10],[-28,10]]);}
      else if(move==='ss'){const z=smooth(phase(t,.18,.72)),ang=-.18+z*1.65;K(a,18,-48,18+Math.cos(ang)*60,-48+Math.sin(ang)*60,11);}
      else if(move==='uh'){const z=smooth(phase(t,.12,.82)),ang=-2.7+z*2.8,ex=35+Math.cos(ang)*78,ey=-44+Math.sin(ang)*78;K(a,14,-45,ex,ey,17);P(a,[[ex-35,ey-12],[ex+40,ey-15],[ex+48,ey+12],[ex-30,ey+18]]);}
      else if(move==='sh'){const z=smooth(phase(t,.12,.82)),ang=-.75+z*1.45,ex=45+Math.cos(ang)*105,ey=-42+Math.sin(ang)*55;K(a,10,-42,ex,ey,20);P(a,[[ex-55,ey-22],[ex+48,ey-28],[ex+58,ey+22],[ex-45,ey+25]]);}
      else if(move==='dh'){if(t>.5)P(a,[[-68,4],[-38,-8],[0,-12],[38,-8],[68,4],[48,16],[-48,16]]);}
      else if(move==='sp'){const h=smooth(phase(t,.42,.74)),px=18+h*145;K(a,8,-48,px,-48,26);C(a,px,-48,29);}
      break;
    case 'g2_kaito':
      if(move==='us'){const e=smooth(phase(t,.18,.62)),x=10;K(a,14,-28,x,-110-e*24,13);C(a,x,-110-e*24,13);}
      else if(move==='ds'){if(t>.3){for(let i=0;i<4;i++)C(a,(i-1.5)*11,-12-pulse(t)*30,11);}}
      else if(move==='ss'){const e=smooth(phase(t,.18,.65)),x=26+e*35;K(a,14,-24,x,-38,13);C(a,x,-38,15);}
      else if(move==='uh'){const e=smooth(phase(t,.18,.8)),ang=-1.15+e*2.5,x=12+Math.cos(ang)*88,y=-30+Math.sin(ang)*88;K(a,8,-30,x,y,12);for(let i=0;i<5;i++)C(a,x-Math.cos(ang)*i*12,y-Math.sin(ang)*i*12,8);}
      else if(move==='sh'){const e=smooth(phase(t,.15,.82)),px=35+e*105;K(a,8,-48,px,-48,24);C(a,px+8,-48,28);}
      else if(move==='dh'){for(let i=0;i<5;i++){const x=25+i*27*smooth(t);C(a,x,-10-pulse(t)*35,10);}}
      else if(move==='sp'){const h=smooth(phase(t,.45,.72)),x=30+h*150;K(a,8,-48,x,-48,25);C(a,x,-48,32);}
      break;
    case 'g2_hana':
      if(move==='us'){const e=smooth(phase(t,.15,.6));for(let i=0;i<5;i++)K(a,(i-2)*10,-4,(i-2)*8,-80-e*35,6);}
      else if(move==='ds'){if(t>.2)for(let i=0;i<10;i++){const ang=i/10*TAU+q;C(a,Math.cos(ang)*(24+18*q),-8+Math.sin(ang)*(10+8*q),6);}}
      else if(move==='ss'){const e=smooth(phase(t,.12,.75));K(a,8,-46,70+e*18,-30,8);C(a,70+e*18,-30,8);}
      else if(move==='uh'){const e=smooth(phase(t,.12,.78));const pts=[];for(let i=0;i<=14;i++){const ang=-Math.PI/2+i/14*TAU;pts.push([Math.cos(ang)*48*e,-55+Math.sin(ang)*85*e]);}P(a,pts);}
      else if(move==='sh'){const e=smooth(phase(t,.15,.8));const pts=[];for(let i=0;i<=12;i++){const ang=-1.15+i/12*2.3;pts.push([20+Math.cos(ang)*100*e,-48+Math.sin(ang)*70*e]);}P(a,pts);}
      else if(move==='dh'){const e=smooth(phase(t,.2,.72));P(a,[[-80*e,-8],[0,14],[80*e,-8],[60*e,-22],[0,-2],[-60*e,-22]]);}
      else if(move==='sp'){if(t>.45){const r=10+(t-.45)/.55*115;for(let i=0;i<18;i++){const ang=i/18*TAU;C(a,Math.cos(ang)*r,-48+Math.sin(ang)*r*.72,9);}}}
      break;
    case 'g2_daigo':
      if(move==='us'){const e=smooth(phase(t,.1,.65));P(a,[[-32,-8],[-30,-35-e*100],[0,-60-e*100],[30,-35-e*100],[32,-8],[18,6],[-18,6]]);}
      else if(move==='ds'){const e=smooth(phase(t,.2,.6));P(a,[[-40,5],[-14,-32*e],[0,-54*e],[14,-32*e],[40,5]]);}
      else if(move==='ss'){const e=smooth(phase(t,.15,.7));K(a,8,-42,70+e*45,-44,17);R(a,75+e*45,-44,50,38);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.7));P(a,[[-34,-8],[-30,-50-e*90],[0,-70-e*90],[30,-50-e*90],[34,-8],[18,8],[-18,8]]);}
      else if(move==='sh'){const e=smooth(phase(t,.12,.8)),ang=-.9+e*1.7,bx=28+Math.cos(ang)*80,by=-45+Math.sin(ang)*80;K(a,8,-45,bx,by,20);C(a,bx,by,40);}
      else if(move==='dh'){if(t>.55){for(let i=0;i<5;i++)C(a,(i-2)*24*smooth(phase(t,.55,.95)),-4,15);}}
      else if(move==='sp'){const h=smooth(phase(t,.4,.75)),x=30+h*140;K(a,5,-48,x,-48,27);C(a,x,-48,42);}
      break;
    case 'g2_suzu':
      if(move==='us'){const e=smooth(phase(t,.1,.7)),x=22+e*58,y=-30-e*70;K(a,5,-25,x,y,10);C(a,x,y,11);}
      else if(move==='ds'){if(t>.15){for(let i=0;i<12;i++){const ang=i/12*TAU;C(a,Math.cos(ang)*(20+q*55),-18+Math.sin(ang)*(12+q*30),8);}}}
      else if(move==='ss'){const e=smooth(phase(t,.12,.75));K(a,8,-35,88+e*42,-52,10);}
      else if(move==='uh'){const e=smooth(phase(t,.12,.82)),ang=-1+e*2.2;K(a,8,-42,25+Math.cos(ang)*90,-48+Math.sin(ang)*65,12);for(let i=0;i<3;i++)K(a,25+Math.cos(ang+i*.1)*70,-48+Math.sin(ang+i*.1)*50,25+Math.cos(ang+i*.1)*105,-48+Math.sin(ang+i*.1)*70,7);}
      else if(move==='sh'){const e=smooth(phase(t,.15,.82)),px=40+e*100;K(a,10,-42,px,-48,14);K(a,px,-48,px-30,-85,10);}
      else if(move==='dh'){const e=smooth(phase(t,.1,.7));C(a,20,-12,28+e*38);}
      else if(move==='sp'){if(t>.4){const h=smooth(phase(t,.4,.8)),ang=-Math.PI/2+h*TAU;C(a,Math.cos(ang)*75,-48+Math.sin(ang)*55,18);}}
      break;
    case 'g2_mai':
      if(move==='us'){const e=smooth(phase(t,.12,.65));C(a,0,-85-e*35,22);}
      else if(move==='ds'){const e=smooth(phase(t,.2,.7));C(a,35+e*70,-25,20);}
      else if(move==='ss'){const e=smooth(phase(t,.15,.75));C(a,55+e*65,-38,23);}
      else if(move==='uh'){const e=smooth(phase(t,.12,.78));K(a,-55,-45,0,-85-e*35,12);K(a,55,-45,0,-85-e*35,12);}
      else if(move==='sh'){const e=smooth(phase(t,.12,.8)),ang=-1+e*2.1;K(a,15,-50,30+Math.cos(ang)*90,-48+Math.sin(ang)*65,16);}
      else if(move==='dh'){const e=smooth(phase(t,.2,.75));C(a,75*e,-70,28);}
      else if(move==='sp'){const h=smooth(phase(t,.5,.78));K(a,-80,-48,80,-48,17);K(a,80,-48,-80,-48,17);C(a,0,-48,30+20*h);}
      break;
    case 'g2_osamu':
      if(move==='us'){const e=smooth(phase(t,.1,.65));C(a,0,-50-e*75,14+e*40);}
      else if(move==='ds'){const e=smooth(phase(t,.2,.7));for(let i=0;i<5;i++)C(a,(i-2)*24,-5-e*12,12+e*20);}
      else if(move==='ss'){const e=smooth(phase(t,.12,.72));C(a,25+e*85,-45,14+e*24);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.8));for(let i=0;i<5;i++)C(a,0,-45-i*22*e,18+i*7);}
      else if(move==='sh'){const e=smooth(phase(t,.12,.82));for(let i=0;i<4;i++)C(a,30+e*70,-45+i*2,20+i*8);K(a,8,-45,90+e*70,-45,12);}
      else if(move==='dh'){const e=smooth(phase(t,.15,.75));for(let i=0;i<10;i++){const ang=i/10*TAU;C(a,Math.cos(ang)*(35+e*45),-5+Math.sin(ang)*(15+e*9),11+e*18);}}
      else if(move==='sp'){if(t>.45){const r=10+(t-.45)/.55*125;for(let i=0;i<18;i++){const ang=i/18*TAU;C(a,Math.cos(ang)*r,-48+Math.sin(ang)*r*.72,10);}}}
      break;
    case 'g2_yui':
      if(move==='us'){const e=smooth(phase(t,.15,.65));C(a,0,-70-e*35,20+e*10);}
      else if(move==='ds'){const e=smooth(phase(t,.2,.65));C(a,0,-8,14+e*20);}
      else if(move==='ss'){const e=smooth(phase(t,.1,.7));C(a,25+e*65,-45,10+e*5);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.7));C(a,0,-25-e*125,34);for(let i=0;i<5;i++)K(a,0,-25-e*80,(i-2)*14,-30,5);}
      else if(move==='sh'){const e=smooth(phase(t,.12,.8)),ang=-1+e*2;C(a,35+Math.cos(ang)*75,-45+Math.sin(ang)*60,30);}
      else if(move==='dh'){const e=smooth(phase(t,.15,.75));for(let i=0;i<8;i++)C(a,(i-3.5)*18*e,-5,9);}
      else if(move==='sp'){const h=smooth(phase(t,.45,.8));for(let i=0;i<14;i++){const ang=i/14*TAU;C(a,Math.cos(ang)*(25+110*h),-48+Math.sin(ang)*(18+90*h),11);}}
      break;
    case 'g2_ibuki':
      if(move==='us'){const e=smooth(phase(t,.12,.65));K(a,0,-45,0,-110-e*30,10);}
      else if(move==='ds'){const e=smooth(phase(t,.15,.7));for(let i=0;i<8;i++){const ang=i/8*TAU;C(a,Math.cos(ang)*(30+e*45),-6+Math.sin(ang)*(12+e*16),8);}}
      else if(move==='ss'){const e=smooth(phase(t,.1,.75));K(a,10,-45,95+e*30,-45,5);C(a,100+e*30,-45,9);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.75));for(let i=0;i<7;i++)K(a,(i-3)*8,-20,(i-3)*8,-60-e*80,6);}
      else if(move==='sh'){const e=smooth(phase(t,.12,.8)),ang=-.8+e*1.6;K(a,10,-45,70+Math.cos(ang)*85,-45+Math.sin(ang)*55,11);}
      else if(move==='dh'){const e=smooth(phase(t,.12,.75));for(let i=0;i<12;i++){const ang=i/12*TAU;C(a,Math.cos(ang)*(35+e*55),-10+Math.sin(ang)*(18+e*25),8);}}
      else if(move==='sp'){if(t>.4){const r=15+(t-.4)/.6*120;for(let i=0;i<18;i++){const ang=i/18*TAU;C(a,Math.cos(ang)*r,-48+Math.sin(ang)*r*.72,8);}}}
      break;
    case 'g2_nishikawa':
      if(move==='us'){const e=smooth(phase(t,.1,.65));K(a,0,-35,0,-125-e*25,4);}
      else if(move==='ds'){const e=smooth(phase(t,.15,.72));K(a,-12,-5,-50,-8-e*25,6);K(a,12,-5,50,-8-e*25,6);}
      else if(move==='ss'){const e=smooth(phase(t,.12,.78));K(a,8,-45,45+e*95,-45,4);C(a,40+e*95,-45,8);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.78));for(let i=0;i<7;i++){const xx=(i-3)*18;K(a,xx,-35,xx,-95-e*55,4);C(a,xx,-95-e*55,8);}}
      else if(move==='sh'){const e=smooth(phase(t,.1,.8)),ex=45+e*100;for(let i=0;i<8;i++)K(a,8,-45,ex,-75+i*8,3);}
      else if(move==='dh'){const e=smooth(phase(t,.2,.75));K(a,-55,-5,-35,-55-e*30,7);K(a,55,-5,35,-55-e*30,7);}
      else if(move==='sp'){const h=smooth(phase(t,.45,.8));for(let i=0;i<12;i++){const ang=i/12*TAU;K(a,Math.cos(ang)*15,-48+Math.sin(ang)*12,Math.cos(ang)*(30+100*h),-48+Math.sin(ang)*(25+75*h),4);}}
      break;
    case 'g2_itto':
      if(move==='us'){const e=smooth(phase(t,.12,.7));K(a,10,-45,10,-45-110*e,9);}
      else if(move==='ds'){const e=smooth(phase(t,.12,.72));K(a,0,-30,0,65*e,8);}
      else if(move==='ss'){const e=smooth(phase(t,.1,.7));K(a,12,-48,12+115*e,-48,7);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.75));K(a,10,-45,10,-45-125*e,9);}
      else if(move==='sh'){const e=smooth(phase(t,.1,.82));K(a,18,-45,18+160*e,-45,10);}
      else if(move==='dh'){const e=smooth(phase(t,.15,.75));K(a,5,-28,5,70*e,9);}
      else if(move==='sp'){const h=smooth(phase(t,.4,.75));K(a,10,-48,10+230*h,-48,15);}
      break;
    case 'g2_twinfoxes':
      if(move==='us'){const e=smooth(phase(t,.1,.7));C(a,-22,-28-e*65,16);C(a,22,-28-e*80,16);}
      else if(move==='ds'){const e=smooth(phase(t,.15,.75));C(a,38*Math.cos(-.8+e*1.6),-42+30*Math.sin(-.8+e*1.6),16);C(a,-38*Math.cos(-.8+e*1.6),-42-30*Math.sin(-.8+e*1.6),16);}
      else if(move==='ss'){const e=smooth(phase(t,.12,.8));C(a,Math.cos(1+e*1.2)*70,-45+Math.sin(1+e*1.2)*45,15);C(a,Math.cos(Math.PI-1-e*1.2)*70,-45+Math.sin(Math.PI-1-e*1.2)*45,15);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.75));C(a,-22,-28-e*65,16);C(a,22,-28-e*80,16);}
      else if(move==='sh'){const e=smooth(phase(t,.12,.8));C(a,35+Math.cos(-.9+e*1.8)*85,-45+Math.sin(-.9+e*1.8)*55,19);C(a,35+Math.cos(-.9+e*1.8+Math.PI)*85,-45+Math.sin(-.9+e*1.8+Math.PI)*55,19);}
      else if(move==='dh'){const e=smooth(phase(t,.15,.78));C(a,-65+e*55,-45,18);C(a,65-e*55,-45,18);}
      else if(move==='sp'){const h=smooth(phase(t,.42,.8));C(a,Math.cos(Math.PI/2+h*Math.PI)*100,-48+Math.sin(Math.PI/2+h*Math.PI)*70,30);C(a,-Math.cos(Math.PI/2+h*Math.PI)*100,-48+Math.sin(Math.PI/2+h*Math.PI)*70,30);}
      break;
    case 'g2_utsuro':
      if(move==='us'){const e=smooth(phase(t,.1,.65));C(a,0,-65-e*45,28);}
      else if(move==='ds'){const e=smooth(phase(t,.15,.75));C(a,0,0,35);}
      else if(move==='ss'){const e=smooth(phase(t,.1,.75));C(a,25+e*90,-45,28);}
      else if(move==='uh'){const e=smooth(phase(t,.1,.75));C(a,0,-85-e*60,42);}
      else if(move==='sh'){const e=smooth(phase(t,.1,.8));C(a,30+e*100,-45,48);}
      else if(move==='dh'){const e=smooth(phase(t,.15,.75));for(let i=0;i<3;i++)C(a,(i-1)*45*e,-5,25);}
      else if(move==='sp'){const h=smooth(phase(t,.35,.8));C(a,0,-48,55+45*h);for(let i=0;i<12;i++){const ang=i/12*TAU;K(a,0,-48,Math.cos(ang)*(70+80*h),-48+Math.sin(ang)*(50+55*h),8);}}
      break;
  }
  return a.map(h=>{
    if(h.shape==='circle') return {...h,x:h.x*(facing||1)};
    if(h.shape==='box') return {...h,x:h.x*(facing||1)};
    if(h.shape==='capsule') return {...h,x1:h.x1*(facing||1),x2:h.x2*(facing||1)};
    if(h.shape==='polygon') return {...h,points:h.points.map(([x,y])=>[x*(facing||1),y])};
    return h;
  });
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
