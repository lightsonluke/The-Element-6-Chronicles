// Generation IV — fully authored, high-detail attack animation system.
// The visual language intentionally follows the hand-authored Thunder Hero
// animations: readable startup, layered construction, clear impact frame,
// directional motion trails, secondary particles, and a deliberate recovery.
// Every move is authored facing RIGHT and mirrored by facingWrap().
const TAU = Math.PI * 2;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const out = v => 1 - Math.pow(1 - clamp(v), 3);
const inout = v => { v = clamp(v); return v < .5 ? 4*v*v*v : 1 - Math.pow(-2*v+2,3)/2; };
const pulse = v => Math.sin(clamp(v) * Math.PI);
function glow(ctx,c,b=16){ctx.shadowColor=c;ctx.shadowBlur=b;}
function line(ctx,pts,c,w,a=1,dash=null){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';if(dash)ctx.setLineDash(dash);glow(ctx,c,Math.max(8,w*2));ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore();}
function ring(ctx,x,y,r,c,w=5,a=1,rot=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';glow(ctx,c,w*2);ctx.beginPath();ctx.arc(x,y,r,rot,rot+TAU);ctx.stroke();ctx.restore();}
function ellipse(ctx,x,y,rx,ry,c,w=5,a=1){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';glow(ctx,c,w*2);ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.stroke();ctx.restore();}
function dot(ctx,x,y,r,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;glow(ctx,c,r*2);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function box(ctx,x,y,w,h,c,a=1,sw=5,fill=false){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=sw;ctx.lineJoin='round';glow(ctx,c,sw*2);if(fill){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}else ctx.strokeRect(x,y,w,h);ctx.restore();}
function poly(ctx,pts,c,a=1,fill=true,sw=4){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=sw;ctx.lineJoin='round';glow(ctx,c,sw*2);ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();if(fill){ctx.fillStyle=c;ctx.fill();}else ctx.stroke();ctx.restore();}
function particleBurst(ctx,x,y,c,p,count=12,spread=70,r=3,a=.75){for(let i=0;i<count;i++){const ang=i/count*TAU+p*TAU*1.7;const rr=spread*(.2+.8*out(p));dot(ctx,x+Math.cos(ang)*rr,y+Math.sin(ang)*rr*.65,r*(1-.35*p),c,a*(1-.45*p));}}
function sparks(ctx,x,y,c,p,count=8,len=18,a=.8){for(let i=0;i<count;i++){const ang=i/count*TAU+p*5;const rr=12+(i%4)*8;const sx=x+Math.cos(ang)*rr,sy=y+Math.sin(ang)*rr*.6;line(ctx,[[sx,sy],[sx+Math.cos(ang)*len,sy+Math.sin(ang)*len*.6]],c,2.5,a*(1-p*.3));}}
function shards(ctx,x,y,c,p,count=8,rad=70,len=28,a=.8){for(let i=0;i<count;i++){const ang=i/count*TAU+p*1.8;const rr=rad*(.2+.8*out(p));const sx=x+Math.cos(ang)*rr,sy=y+Math.sin(ang)*rr*.65;line(ctx,[[sx-Math.cos(ang)*len*.3,sy-Math.sin(ang)*len*.3],[sx+Math.cos(ang)*len,sy+Math.sin(ang)*len]],c,4,a*(1-.35*p));}}
function trail(ctx,x1,y1,x2,y2,c,p,w=8,a=.8){line(ctx,[[x1,y1],[x2,y2]],c,w,a*(1-.35*p));line(ctx,[[x1,y1],[x2,y2]],'#FFFFFF',Math.max(1,w*.18),a*.65*(1-.4*p));}
function slash(ctx,x,y,r,a0,a1,c,p,w=12){ctx.save();ctx.globalAlpha=.95;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';glow(ctx,c,w*2);ctx.beginPath();ctx.arc(x,y,r,a0,a0+(a1-a0)*out(p));ctx.stroke();ctx.restore();}
function crack(ctx,x,y,c,p,dir=1){const q=out(p);line(ctx,[[x,y],[x+25*q*dir,y+12*q],[x+43*q*dir,y-10*q],[x+72*q*dir,y+5*q]],c,4,.75);}
function facingWrap(ctx,x,y,facing,fn){ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);fn(ctx);ctx.restore();}
function flash(ctx,x,y,c,p,r=35){const a=(1-p)*.65;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#FFFFFF';glow(ctx,c,22);ctx.beginPath();ctx.arc(x,y,r*(.6+.7*p),0,TAU);ctx.fill();ctx.restore();}
function construction(ctx,x,y,w,h,c,c2,p,tilt=0){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.globalAlpha=.95;glow(ctx,c,18);ctx.fillStyle=c;ctx.fillRect(-w/2,-h/2,w,h);ctx.globalAlpha=.9;ctx.strokeStyle=c2;ctx.lineWidth=3;ctx.strokeRect(-w/2+5,-h/2+5,w-10,h-10);ctx.globalAlpha=.5;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.5;ctx.strokeRect(-w/2+10,-h/2+10,w-20,h-20);ctx.restore();}
function windRibbon(ctx,x,y,len,amp,c,p,w=7,a=.8){const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push([x+len*t,y+Math.sin(t*TAU*1.5+p*7)*amp*(.25+.75*t)]);}line(ctx,pts,c,w,a);line(ctx,pts,'#FFFFFF',Math.max(1,w*.16),a*.55);}
function shadowBlade(ctx,x,y,len,c,p){const q=out(p);poly(ctx,[[x,y-12],[x+len*q,y-4],[x+len*q+24,y],[x+len*q,y+4],[x,y+12]],c,.92,true,4);line(ctx,[[x+10,y],[x+len*q,y]],'#A98CFF',3,.7);}
function flame(ctx,x,y,r,c,c2,a,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=a;glow(ctx,c,20);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.8,-r*.15,r*.2,r);ctx.quadraticCurveTo(-r*.8,r*.3,0,-r);ctx.fill();ctx.globalAlpha=a*.75;ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(0,-r*.55);ctx.quadraticCurveTo(r*.35,0,0,r*.52);ctx.quadraticCurveTo(-r*.35,0,0,-r*.55);ctx.fill();ctx.restore();}
function vibrationRings(ctx,x,y,r,c,p,count=4,a=.7){for(let i=0;i<count;i++){const q=clamp(p-i*.13);if(q<=0)continue;ellipse(ctx,x,y,r*q*(.75+i*.16),r*q*(.22+i*.06),c,3,a*(1-q));}}
function techNode(ctx,x,y,c,c2,p,s=1){box(ctx,x-14*s,y-9*s,28*s,18*s,c,.95,3,false);dot(ctx,x+7*s,y,3*s,c2,.95);line(ctx,[[x-8*s,y-5*s],[x+8*s,y+5*s]],c2,2,.65);ring(ctx,x,y,18*s,c2,2,.35,p*TAU);}
function mechRing(ctx,x,y,r,c,c2,p,a=.8){ring(ctx,x,y,r,c,6,a,p*TAU);ring(ctx,x,y,r*.72,c2,2.5,a*.75,-p*TAU);for(let i=0;i<6;i++){const ang=i/6*TAU+p*2;line(ctx,[[x+Math.cos(ang)*r*.72,y+Math.sin(ang)*r*.72],[x+Math.cos(ang)*r,y+Math.sin(ang)*r]],c2,2,a*.6);}}

const C={
 cobalt:'#3366FF', cobalt2:'#77AAFF', cyan:'#66DDFF', cyan2:'#C8F8FF',
 onyx:'#171225', onyx2:'#6E4CA0', gold:'#FFD83D', gold2:'#FFF2A0',
 verm:'#E34234', verm2:'#FFB04D', umber:'#9A5B32', umber2:'#D08A54',
 graphite:'#8899AA', graphite2:'#D8E8F5', daichi:'#FFB02E', daichi2:'#7EE8FF',
 renko:'#A90024', renko2:'#FF4568'
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. COBALT — Barrier Constructs
// The Up Signature is intentionally built from the supplied 12-frame reference.
function cobaltAttack(ctx,p,m){
 const c=C.cobalt,c2=C.cobalt2,q=out(p),frame=1+p*11;
 if(m==='us'){
   // Reference frame sequence:
   // 1 startup → 2 barrier begins → 3 rises through him → 4 spike forms
   // → 5 catches → 6-7 knockback → 8 retract → 9 out of range → 10 idle
   // → 11 return → 12 ready.
   const cy=-112,rx=86,ry=34,start=-Math.PI/2;
   ellipse(ctx,0,cy,rx,ry,c2,2,.24);
   if(frame<1.75){dot(ctx,0,-52,3,c,.3);return;}
   const ringIn=clamp((frame-1.75)/.75);
   ellipse(ctx,0,cy,rx,ry,c2,2,.28+.25*ringIn);
   const rise=out(clamp((frame-2)/1.7));
   if(frame>=2){
     const h=clamp(rise);
     construction(ctx,0,-h*88,34,112,c,c2,h,.0);
     line(ctx,[[-15,0],[-11,-h*90]],c2,3,.45);
     line(ctx,[[15,0],[11,-h*90]],c2,3,.45);
   }
   if(frame>=3){
     const h=out(clamp((frame-3)/1.2));
     construction(ctx,0,-90-22*h,38,118,c,c2,.95,0);
   }
   if(frame>=4 && frame<8.2){
     const hit=clamp((frame-4)/1.15);
     const sx=32,sy=-112;
     poly(ctx,[[sx,sy-7],[sx+70*hit,sy-34*hit],[sx+82*hit,sy-15*hit],[sx+35*hit,sy+5],[sx,sy+9]],c2,.96,true,4);
     line(ctx,[[sx,sy],[sx+82*hit,sy-24*hit]],'#FFFFFF',2,.85);
     for(let i=0;i<5;i++)line(ctx,[[sx+5,sy-4+i*3],[sx+45*hit,sy-20*hit+i*5]],c2,2,.35);
   }
   if(frame>=5 && frame<8){
     const k=out((frame-5)/2.1);
     trail(ctx,80*k,-138*k,125*k,-165*k,c2,k,.9,.7);
     trail(ctx,88*k,-130*k,145*k,-150*k,c,k,.6,.45);
     particleBurst(ctx,70*k,-125*k,c2,k,8,32,3,.55);
   }
   if(frame>=8){
     const r=1-clamp((frame-8)/1.2);
     construction(ctx,0,-92*r,34,112,c,c2,r,.0);
     if(frame<9)shards(ctx,0,-85,c2,1-r,7,52,18,.55);
   }
   if(frame>=9){const a=1-clamp((frame-9)/3);ellipse(ctx,0,cy,rx,ry,c2,2,.22*a);}
 } else if(m==='ds'){
   const close=out(clamp(p/.58));
   construction(ctx,-70+50*close,-45,44,70,c,c2,.9,-.06);
   construction(ctx,70-50*close,-45,44,70,c,c2,.9,.06);
   line(ctx,[[-48+45*close,-48],[-12,-18]],c2,4,.7);
   line(ctx,[[48-45*close,-48],[12,-18]],c2,4,.7);
   if(p>.48){const k=out((p-.48)/.52);flash(ctx,0,-30,c,k,30);shards(ctx,0,-28,c2,k,10,62,22,.8);}
 } else if(m==='ss'){
   const reach=out(p)*112;
   construction(ctx,30+reach*.5,-50,reach,30,c,c2,.96,0);
   if(p>.35)line(ctx,[[30+reach,-66],[30+reach+22,-50],[30+reach,-34]],'#FFFFFF',3,.8);
   for(let i=0;i<6;i++)line(ctx,[[30+i*reach/6,-62],[30+i*reach/6,-38]],c2,2,.3);
 } else if(m==='uh'){
   const rise=out(p)*104;
   construction(ctx,0,-rise,88,22,c,c2,.96,0);
   construction(ctx,0,-rise-12,116,7,c2,.5,0);
   if(p>.38){const k=out((p-.38)/.62);poly(ctx,[[0,-rise],[-76*k,-rise-60*k],[-59*k,-rise-78*k],[0,-rise-18]],c2,.9,true,4);poly(ctx,[[0,-rise],[76*k,-rise-60*k],[59*k,-rise-78*k],[0,-rise-18]],c2,.9,true,4);}
   if(p>.6)particleBurst(ctx,0,-rise,c2,(p-.6)/.4,10,70,3,.55);
 } else if(m==='dh'){
   const drop=out(p);const yy=-124+drop*105;
   construction(ctx,0,yy,178,24,c,c2,.96,0);
   if(p>.42){const k=out((p-.42)/.58);for(let i=0;i<8;i++){const x=-75+i*22;poly(ctx,[[x,-18],[x+9,7*k],[x+20,-10*k]],c2,.8,true,3);}particleBurst(ctx,0,-8,c2,k,12,92,3,.55);}
 } else if(m==='sh'){
   const k=inout(p);ctx.save();ctx.translate(10,-52);ctx.rotate(-1.12+2.18*k);ctx.globalAlpha=.96;ctx.strokeStyle=c;ctx.lineWidth=25;ctx.lineCap='round';glow(ctx,c,30);ctx.beginPath();ctx.arc(0,0,96,-1.05,1.05);ctx.stroke();ctx.restore();
   if(p>.4){const e=out((p-.4)/.6);line(ctx,[[24,-72],[104,-65+e*18]],c2,5,.65);line(ctx,[[24,-32],[104,-39-e*18]],c2,5,.65);}
 } }
function cobaltSuper(ctx,p){const c=C.cobalt,c2=C.cobalt2,r=42+out(p)*108;for(let i=0;i<6;i++){const a=i/6*TAU;const x=Math.cos(a)*r*.55,y=-48+Math.sin(a)*r*.4;construction(ctx,x,y,64,140,c,c2,.78,a*.04);line(ctx,[[x-24,y-60],[x+24,y+60]],c2,3,.5);}if(p>.28){const e=out((p-.28)/.72);ring(ctx,0,-48,34+e*122,c2,10,.95);ring(ctx,0,-48,54+e*95,c,4,.55);for(let i=0;i<20;i++){const a=i/20*TAU;line(ctx,[[Math.cos(a)*34,-48+Math.sin(a)*25],[Math.cos(a)*(34+e*120),-48+Math.sin(a)*(25+e*82)]],c,5,.72);}}}

// 2. CYAN — Wind
function cyanAttack(ctx,p,m){const c=C.cyan,c2=C.cyan2,q=out(p),a=pulse(p);
 if(m==='us'){const h=118*q;for(let i=0;i<5;i++){const x=-24+i*12;windRibbon(ctx,x,0,-h,.16,c,p,5,.55);}for(let i=0;i<4;i++)ring(ctx,0,-h*(.45+i*.12),18+i*8,c2,3,.65,a);particleBurst(ctx,0,-h,c2,p,10,35,2,.5);
 } else if(m==='ds'){const dip=38*q;ellipse(ctx,0,-12+dip,34,12,c,5,.8);if(p>.38){const k=out((p-.38)/.62);ring(ctx,0,-12+dip,25+65*k,c2,7,.9);for(let i=0;i<12;i++){const ang=i/12*TAU;line(ctx,[[Math.cos(ang)*25,-12+dip+Math.sin(ang)*8],[Math.cos(ang)*(25+65*k),-12+dip+Math.sin(ang)*(8+30*k)]],c,3,.55);}}
 } else if(m==='ss'){const len=92*q;const pts=[];for(let i=0;i<24;i++){const t=i/23;pts.push([22+len*t,-50+Math.sin(t*Math.PI)*24+Math.sin(t*9+p*8)*4]);}line(ctx,pts,c,9,.9);line(ctx,pts,c2,2,.8);if(p>.45){const k=out((p-.45)/.55);trail(ctx,22,-50,22+len*k,-50,c2,k,4,.55);}}
 else if(m==='uh'){const h=122*q;for(let i=0;i<4;i++){const ang=i/4*TAU+p*TAU*1.6;const rx=42+q*20,ry=55+q*52;const pts=[];for(let j=0;j<=28;j++){const t=j/28;pts.push([Math.cos(ang+t*TAU)*rx,-68+Math.sin(ang+t*TAU)*ry]);}line(ctx,pts,c,7,.75);line(ctx,pts,c2,2,.55);}ring(ctx,0,-68,24+q*40,c2,5,.75);line(ctx,[[-8,0],[0,-h]],c2,4,.35);
 } else if(m==='dh'){const by=-120+q*86;for(let i=0;i<10;i++){const ang=i/10*TAU;windRibbon(ctx,Math.cos(ang)*18,by+Math.sin(ang)*7,0,0,c,p,3,.4);}dot(ctx,0,by,27,c,.7);ring(ctx,0,by,30,c2,5,.85);if(p>.5){const k=out((p-.5)/.5);ring(ctx,0,0,20+64*k,c,7,.9);particleBurst(ctx,0,0,c2,k,14,70,3,.6);}}
 else if(m==='sh'){const len=145*q;for(let k=0;k<5;k++)windRibbon(ctx,22,-70+k*11,len,7,c,p+k*.02,8-k,.72);for(let i=0;i<8;i++)line(ctx,[[35+i*14*q,-82],[50+i*14*q,-67]],c2,2,.35);}
}
function cyanSuper(ctx,p){const c=C.cyan,c2=C.cyan2,r=22+Math.min(1,p/.58)*78;for(let i=0;i<18;i++){const ang=i/18*TAU+p*5;line(ctx,[[Math.cos(ang)*r,-50+Math.sin(ang)*r*.68],[Math.cos(ang)*(r+22),-50+Math.sin(ang)*(r+22)*.68]],c,5,.65);}if(p>.32){const e=out((p-.32)/.68);ctx.save();ctx.globalAlpha=.82;ctx.fillStyle=c;glow(ctx,c,35);ctx.beginPath();ctx.arc(0,-50,16+e*72,0,TAU);ctx.fill();ctx.restore();ring(ctx,0,-50,22+e*100,c2,9,.95);particleBurst(ctx,0,-50,c2,p,24,140,4,.72);}}

// 3. ONYX — Shadow
function onyxAttack(ctx,p,m){const c=C.onyx,c2=C.onyx2,q=out(p),a=pulse(p);
 if(m==='us'){const h=112*q;shadowBlade(ctx,-4,0,8,c,p);poly(ctx,[[-22,0],[0,-h],[22,0],[9,-h-24],[-9,-h-24]],c,.94,true,4);line(ctx,[[0,-h+20],[0,-h-24]],c2,5,.8);shards(ctx,0,-h,c2,p,6,42,20,.6);
 } else if(m==='ds'){ctx.save();ctx.globalAlpha=.9;ctx.fillStyle=c;glow(ctx,c,20);ctx.beginPath();ctx.ellipse(0,-5,52*q+12,17*q+4,0,0,TAU);ctx.fill();ctx.restore();if(p>.42){const k=out((p-.42)/.58);poly(ctx,[[-38*k,-8],[0,-90*k],[38*k,-8]],c2,.95,true,4);line(ctx,[[-26*k,-10],[0,-72*k],[26*k,-10]],'#FFFFFF',2,.55);}}
 else if(m==='ss'){for(let i=0;i<3;i++){const yy=-58+i*13;shadowBlade(ctx,18,yy,88,c2,p);line(ctx,[[18,yy],[104*q,yy-8+i*8]],c,4,.55);}}
 else if(m==='uh'){const h=110*q;box(ctx,-25,-h-18,50,104,c,.45,4,true);poly(ctx,[[-30,-h+8],[0,-h-38],[30,-h+8],[20,-h+1],[-20,-h+1]],c2,.92,true,4);if(p>.48){const k=out((p-.48)/.52);slash(ctx,0,-h+8,50,-2.45,.15,c2,k,12);shards(ctx,0,-h,c,k,8,58,24,.55);}}
 else if(m==='dh'){ctx.save();ctx.globalAlpha=.42*q;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,102*q,24*q,0,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<9;i++){const ang=i/9*TAU+p*2;const r=28+62*q;line(ctx,[[Math.cos(ang)*r,-Math.sin(ang)*r*.32],[Math.cos(ang)*(r+35),-Math.sin(ang)*(r+18)]],c2,8,.8);}}
 else if(m==='sh'){const len=130*q;poly(ctx,[[18,-76],[18+len,-55],[18+len+30,-44],[18+len,-32],[18,-20]],c,.95,true,4);poly(ctx,[[18+len,-55],[18+len+34,-45],[18+len,-32]],c2,.8,true,3);line(ctx,[[24,-48],[18+len,-44]],'#FFFFFF',2,.5);}
}
function onyxSuper(ctx,p){const c=C.onyx,c2=C.onyx2,r=32+out(p)*112;ctx.save();ctx.globalAlpha=.82;ctx.fillStyle=c;glow(ctx,c,30);ctx.beginPath();ctx.ellipse(0,-46,r,r*.7,0,0,TAU);ctx.fill();ctx.restore();const e=out(Math.max(0,(p-.18)/.82));poly(ctx,[[-54*e,-8],[0,-160*e],[54*e,-8],[0,-42*e]],c2,.72,true,4);if(p>.42){slash(ctx,0,-58,86,-2.2,.15,c2,(p-.42)/.58,18);particleBurst(ctx,0,-48,c,p,22,140,5,.65);}}

// 4. GOLD — Restoration
function goldAttack(ctx,p,m){const c=C.gold,c2=C.gold2,q=out(p),a=pulse(p);
 if(m==='us'){const h=108*q;for(let i=0;i<6;i++){const yy=-8-i*18*q;poly(ctx,[[-30-i*2,yy],[0,yy-15],[30+i*2,yy],[20,yy+10],[-20,yy+10]],c,.78,true,3);line(ctx,[[-24,yy+2],[24,yy+2]],c2,2,.65);}ring(ctx,0,-h,26,c2,6,.9);if(p>.55)particleBurst(ctx,0,-h,c,p,10,45,3,.55);
 } else if(m==='ds'){ring(ctx,0,-8,20+55*q,c,7,.92);ring(ctx,0,-8,12+42*q,c2,3,.8);if(p>.48){const k=out((p-.48)/.52);ring(ctx,0,-8,78-24*k,c2,5,.75);for(let i=0;i<14;i++){const ang=i/14*TAU;line(ctx,[[Math.cos(ang)*18,-8+Math.sin(ang)*8],[Math.cos(ang)*(18+58*k),-8+Math.sin(ang)*(8+32*k)]],c,4,.6);}}
 } else if(m==='ss'){const len=88*q;line(ctx,[[16,-48],[26+len,-48]],c,12,.95);ring(ctx,26+len,-48,19,c2,5,.8);for(let i=0;i<5;i++)dot(ctx,26+len*(i/5),-48,3,c2,.55);}
 else if(m==='uh'){const h=122*q;for(let i=0;i<7;i++){const yy=-10-i*17*q;poly(ctx,[[-28,yy],[0,yy-15],[28,yy],[18,yy+9],[-18,yy+9]],c,.72,true,3);line(ctx,[[-22,yy+1],[22,yy+1]],c2,2,.7);}ring(ctx,0,-h,28,c2,6,.9);}
 else if(m==='dh'){const r=84*q;ring(ctx,0,-6,r,c,8,.9);ring(ctx,0,-6,r*.72,c2,3,.65);if(p>.45){const k=out((p-.45)/.55);ring(ctx,0,-6,r*(1-.3*k),c2,5,.8);particleBurst(ctx,0,-6,c,k,18,r,3,.55);}}
 else if(m==='sh'){const r=18+34*q;dot(ctx,22,-48,r,c,.7);ring(ctx,22,-48,r,c2,5,.9);for(let i=0;i<8;i++){const ang=i/8*TAU;line(ctx,[[22+Math.cos(ang)*r,-48+Math.sin(ang)*r],[22+Math.cos(ang)*(r+30),-48+Math.sin(ang)*(r+20)]],c,4,.55);}if(p>.62)flash(ctx,95,-48,c2,(p-.62)/.38,28);}
}
function goldSuper(ctx,p){const c=C.gold,c2=C.gold2,r=28+Math.min(1,p/.68)*88;ctx.save();ctx.globalAlpha=.28;ctx.fillStyle=c;glow(ctx,c,35);ctx.beginPath();ctx.arc(0,-52,r,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<16;i++){const ang=i/16*TAU+p*1.4;line(ctx,[[Math.cos(ang)*r,-52+Math.sin(ang)*r*.7],[Math.cos(ang)*(r+26),-52+Math.sin(ang)*(r+26)*.7]],c2,4,.65);}if(p>.38){const e=out((p-.38)/.62);for(let i=0;i<8;i++){const a=i/8*TAU;const rr=38+e*55;construction(ctx,Math.cos(a)*rr,-52+Math.sin(a)*rr*.65,18,12,c,c2,.72,a);}if(p>.55){ring(ctx,0,-52,38+e*125,c,10,.95);particleBurst(ctx,0,-52,c2,e,26,145,5,.75);}}}

// 5. VERMILION — Fire
function fireAttack(ctx,p,m){const c=C.verm,c2=C.verm2,q=out(p),a=pulse(p);
 if(m==='us'){const h=108*q;for(let i=0;i<9;i++){const ang=i/9*TAU+p*1.5;flame(ctx,Math.cos(ang)*22,-35-h+Math.sin(ang)*18,18,c,c2,a*.8,ang+Math.PI/2);}poly(ctx,[[-18,-h-32],[0,-h-66],[18,-h-32],[8,-h-44],[-8,-h-44]],c,.9,true,3);}
 else if(m==='ds'){flame(ctx,0,-8,30+24*q,c,c2,.9);ring(ctx,0,-8,28+42*q,c2,4,.7);for(let i=0;i<7;i++){const ang=-Math.PI+i/6*Math.PI;flame(ctx,Math.cos(ang)*(28+q*35),-8-Math.abs(Math.sin(ang))*22,12,c,c2,.65,ang);}}
 else if(m==='ss'){const k=inout(p),ang=-1.15+2.25*k;flame(ctx,18+Math.cos(ang)*72,-48+Math.sin(ang)*48,22,c,c2,.9,ang);slash(ctx,18,-48,72,-1.15,1.1,c2,k,11);for(let i=0;i<5;i++)flame(ctx,35+i*14*q,-55+Math.sin(i+p*6)*7,8,c,c2,.5,-.4);}
 else if(m==='uh'){const h=112*q;for(let i=0;i<6;i++){const ang=i/6*TAU+p*3;flame(ctx,Math.cos(ang)*30,-8-h+Math.sin(ang)*35,24,c,c2,.75,ang+Math.PI/2);}ring(ctx,0,-h,35,c2,5,.75);if(p>.55)particleBurst(ctx,0,-h,c,(p-.55)/.45,12,55,4,.65);}
 else if(m==='dh'){const by=-126+q*104;flame(ctx,0,by,28+q*12,c,c2,.9);ring(ctx,0,by,34,c2,4,.6);if(p>.48){const k=out((p-.48)/.52);line(ctx,[[0,by+20],[0,by+90*k]],c,10,.75);ring(ctx,0,0,22+68*k,c2,7,.9);particleBurst(ctx,0,0,c,k,15,82,4,.7);}}
 else if(m==='sh'){const len=125*q;poly(ctx,[[18,-72],[18+len,-50],[18+len+20,-28],[18,-36]],c,.92,true,4);poly(ctx,[[22,-56],[18+len,-44],[22,-42]],c2,.8,true,2);for(let i=0;i<8;i++)flame(ctx,34+i*len/8,-49+Math.sin(i+p*9)*5,7,c,c2,.55,-.5);}
}
function fireSuper(ctx,p){const c=C.verm,c2=C.verm2;if(p<.58){const r=18+out(p/.58)*48;dot(ctx,0,-52,r,c,.9);dot(ctx,0,-52,r*.5,c2,.8);for(let i=0;i<10;i++)flame(ctx,Math.cos(i/10*TAU)*r,-52+Math.sin(i/10*TAU)*r*.6,14,c,c2,.55,i/10*TAU);ring(ctx,0,-52,r+8,c2,4,.7);}if(p>.45){const e=out((p-.45)/.55);const len=175*e;poly(ctx,[[18,-74],[18+len,-50],[18+len+20,-30],[18,-38]],c,.95,true,5);poly(ctx,[[22,-56],[18+len,-43],[22,-34]],c2,.82,true,3);ring(ctx,18+len,-50,30+e*60,c2,8,.9);particleBurst(ctx,18+len,-50,c,e,18,65,4,.7);}}

// 6. UMBER — Tremor-Sense / martial arts
function umberAttack(ctx,p,m){const c=C.umber,c2=C.umber2,q=out(p),a=pulse(p);
 if(m==='us'){vibrationRings(ctx,0,-8,36,c,p,4,.55);const h=82*q;line(ctx,[[15,-42],[34,-62],[42,-86-h*.3]],c2,11,.9);dot(ctx,42,-86-h*.3,10,c,.9);for(let i=0;i<6;i++)line(ctx,[[i*6-15,0],[i*7-18,-30-h]],c,3,.35);}
 else if(m==='ds'){line(ctx,[[-28,-2],[0,10],[28,-2]],c2,5,.65);vibrationRings(ctx,0,-3,30+45*q,c,p,5,.8);if(p>.55){const k=out((p-.55)/.45);line(ctx,[[0,-5],[0,-58*k]],c,7,.8);ring(ctx,0,-58*k,18,c2,4,.7);}}
 else if(m==='ss'){const ang=-.3+inout(p)*.9;const ex=25+Math.cos(ang)*62,ey=-50+Math.sin(ang)*34;line(ctx,[[12,-48],[ex,ey]],c,13,.9);line(ctx,[[12,-48],[ex,ey]],c2,3,.85);ring(ctx,ex,ey,17,c2,4,.7);for(let i=0;i<5;i++)dot(ctx,ex-i*12,ey+i*3,3,c,.5);}
 else if(m==='uh'){const h=92*q;line(ctx,[[18,-40],[34,-78-h]],c2,14,.95);line(ctx,[[18,-40],[34,-78-h]],'#EBC49B',3,.8);for(let i=0;i<6;i++)line(ctx,[[0,0],[i*12-30,-20-h*.6]],c,3,.45);vibrationRings(ctx,34,-78-h,42,c,p,5,.75);}
 else if(m==='dh'){line(ctx,[[0,-18],[18,8],[45,2]],c2,11,.95);for(let i=0;i<8;i++){const x=18+i*18*q;crack(ctx,x,2,c,i/8,.7);dot(ctx,x,2,3,c2,.55);}vibrationRings(ctx,48*q,2,34,c,p,3,.6);}
 else if(m==='sh'){const end=92*q;line(ctx,[[16,-52],[16+end,-52]],c2,14,.95);line(ctx,[[16,-52],[16+end,-52]],c,4,.85);if(p>.42){const k=out((p-.42)/.58);line(ctx,[[16+end,-52],[16+end+60*k,-42]],c2,7,.8);vibrationRings(ctx,16+end+60*k,-42,30,c,k,3,.65);}}
}
function umberSuper(ctx,p){const c=C.umber,c2=C.umber2;if(p<.7){vibrationRings(ctx,0,-4,28+out(p/.7)*95,c,p,6,.65);for(let i=0;i<12;i++){const a=i/12*TAU;line(ctx,[[Math.cos(a)*20,-4+Math.sin(a)*8],[Math.cos(a)*(30+out(p/.7)*95),-4+Math.sin(a)*(10+out(p/.7)*48)]],c2,2.5,.4);}}if(p>.5){const e=out((p-.5)/.5);line(ctx,[[15,-50],[145*e,-48]],c2,24,.95);line(ctx,[[15,-50],[145*e,-48]],'#F1D0A0',4,.8);ring(ctx,145*e,-48,30+e*32,c,8,.9);particleBurst(ctx,145*e,-48,c,e,18,70,4,.65);}}

// 7. GRAPHITE — Resonance Analysis
function graphiteAttack(ctx,p,m){const c=C.graphite,c2=C.graphite2,q=out(p);
 if(m==='us'){for(let i=0;i<5;i++){const y=-22-i*24*q;ring(ctx,0,y,11+i*5,c,3,.7);line(ctx,[[-18,y],[18,y]],c2,2,.45);}ring(ctx,0,-112*q,25,c2,6,.85);for(let i=0;i<5;i++)dot(ctx,0,-112*q-i*10,3,c,.45);}
 else if(m==='ds'){ring(ctx,0,-5,20+38*q,c,4,.75);line(ctx,[[-45,-5],[45,-5]],c2,2,.45);const x=70*q;ring(ctx,x,-22,15,c2,3,.8);line(ctx,[[0,-5],[x,-22]],c,4,.55);if(p>.5){const k=out((p-.5)/.5);ring(ctx,x,-22,15+46*k,c2,6,.85);particleBurst(ctx,x,-22,c,k,10,50,3,.55);}}
 else if(m==='ss'){const x=20+88*q;line(ctx,[[20,-50],[x,-50]],c2,8,.9);for(let i=0;i<5;i++)ring(ctx,20+i*17*q,-50,8+i*2,c,2,.55);ring(ctx,x,-50,27,c2,5,.85);}
 else if(m==='uh'){for(let i=0;i<7;i++){const y=-18-i*17*q;ring(ctx,0,y,13+i*5,c,3,.65);line(ctx,[[-22,y],[22,y]],c2,2,.45);}ring(ctx,0,-112*q,34,c2,7,.9);particleBurst(ctx,0,-112*q,c2,p,12,48,3,.5);}
 else if(m==='dh'){ring(ctx,0,-4,28+54*q,c,7,.8);for(let i=0;i<6;i++){const x=-22+i*9;line(ctx,[[x,0],[x+(i%2?-42:42)*q,5]],c2,4,.55);}if(p>.52){const k=out((p-.52)/.48);ring(ctx,0,-4,32+75*k,c2,7,.9);}}
 else if(m==='sh'){const x=42+82*q;line(ctx,[[18,-48],[x,-48]],c,9,.9);ring(ctx,x,-48,28,c2,6,.9);for(let i=0;i<6;i++){const rr=10+i*5;ring(ctx,x,-48,rr,c,2,.35);}}
}
function graphiteSuper(ctx,p){const c=C.graphite,c2=C.graphite2,r=34+out(p)*105;for(let i=0;i<18;i++){const a=i/18*TAU+p*2.2;ring(ctx,Math.cos(a)*r*.65,-52+Math.sin(a)*r*.4,10+out(p)*17,c,3,.45,a);}if(p>.38){const e=out((p-.38)/.62);ring(ctx,0,-52,30+e*116,c2,9,.95);ring(ctx,0,-52,52+e*92,c,3,.5);for(let i=0;i<16;i++){const a=i/16*TAU;line(ctx,[[Math.cos(a)*40,-52+Math.sin(a)*25],[Math.cos(a)*(40+e*110),-52+Math.sin(a)*(25+e*72)]],c2,3,.7);}}}

// 8. DAICHI ISHII — Resonance Technology
function daichiAttack(ctx,p,m){const c=C.daichi,c2=C.daichi2,q=out(p);
 const drone=(x,y,s=1)=>techNode(ctx,x,y,c,c2,p,s);
 if(m==='us'){drone(0,-62,1);line(ctx,[[0,-48],[0,-126*q]],c2,5,.8);for(let i=0;i<5;i++)ring(ctx,0,-76*q,12+i*7,c,3,.6);line(ctx,[[-10,-48],[0,-126*q],[10,-48]],c2,2,.45);}
 else if(m==='ds'){techNode(ctx,0,-12,c,c2,p,1.15);line(ctx,[[-38,-4],[38,-4]],c2,3,.55);ring(ctx,0,-4,18+52*q,c,5,.8);if(p>.48)particleBurst(ctx,0,-4,c2,(p-.48)/.52,12,60,3,.6);}
 else if(m==='ss'){const len=118*q;line(ctx,[[20,-50],[20+len,-50]],c2,10,.92);box(ctx,20+len-12,-60,24,20,c,.9,3,false);for(let i=0;i<7;i++)dot(ctx,25+i*len/7,-50,3,c,i===6?1:.55);if(p>.55)ring(ctx,20+len,-50,18,c2,4,.8);}
 else if(m==='uh'){for(let i=0;i<4;i++){const x=-36+i*24;drone(x,-8-80*q,.8);line(ctx,[[x,-8],[x,-80*q]],c2,3,.5);}ring(ctx,0,-88*q,32,c,6,.85);for(let i=0;i<4;i++)line(ctx,[[-36+i*24,-80*q],[0,-88*q]],c2,2,.45);}
 else if(m==='dh'){for(let i=0;i<6;i++){const ang=i/6*TAU+p*1.7;const x=Math.cos(ang)*58,y=-30+Math.sin(ang)*38;drone(x,y,.62);line(ctx,[[x,y],[0,-2]],c2,2,.5);}ring(ctx,0,-2,42*q,c,6,.85);if(p>.55){const k=out((p-.55)/.45);line(ctx,[[0,-2],[0,55*k]],c2,6,.7);}}
 else if(m==='sh'){const len=150*q;box(ctx,18,-70,42,42,c,.9,4,false);line(ctx,[[40,-49],[40+len,-49]],c2,18,.9);for(let i=0;i<5;i++)ring(ctx,48+i*28*q,-49,10+i*2,c,3,.55);if(p>.62)ring(ctx,40+len,-49,25,c2,5,.8);}
}
function daichiSuper(ctx,p){const c=C.daichi,c2=C.daichi2;for(let i=0;i<8;i++){const a=i/8*TAU;const r=58;const x=Math.cos(a)*r,y=-52+Math.sin(a)*r*.65;techNode(ctx,x,y,c,c2,p,.8);line(ctx,[[x,y],[Math.cos(a)*104,-52+Math.sin(a)*104*.65]],c2,3,.55);}if(p>.34){const e=out((p-.34)/.66);ring(ctx,0,-52,28+e*94,c2,8,.9);ring(ctx,0,-52,44+e*70,c,3,.45);particleBurst(ctx,0,-52,c,e,22,120,4,.7);}}

// 9. RENKO KURENAI — Extraction Technology
function renkoAttack(ctx,p,m){const c=C.renko,c2=C.renko2,q=out(p);
 if(m==='us'){mechRing(ctx,0,-26-q*88,28,c,c2,p,.9);mechRing(ctx,0,-52-q*56,19,c,c2,p,.72);line(ctx,[[0,0],[0,-122*q]],c2,9,.75);for(let i=0;i<4;i++)line(ctx,[[-25+i*17,-10],[0,-100*q]],c,2,.4);}
 else if(m==='ds'){mechRing(ctx,0,-8,24+30*q,c,c2,p,.9);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,[[Math.cos(a)*20,-8+Math.sin(a)*8],[Math.cos(a)*(44+36*q),-8+Math.sin(a)*(12+20*q)]],c,4,.65);}if(p>.55)particleBurst(ctx,0,-8,c2,(p-.55)/.45,14,72,3,.6);}
 else if(m==='ss'){const len=118*q;box(ctx,18,-62,30,28,c,.9,3,false);line(ctx,[[32,-48],[32+len,-48]],c2,11,.92);dot(ctx,32+len,-48,11,c,.85);for(let i=0;i<4;i++)mechRing(ctx,44+i*25*q,-48,8+i*2,c,c2,p,.45);}
 else if(m==='uh'){for(let i=0;i<5;i++)mechRing(ctx,0,-14-i*21*q,19+i*4,c,c2,p,.7);line(ctx,[[-42,0],[42,0]],c2,4,.5);if(p>.5)ring(ctx,0,-112*q,28,c2,5,.8);}
 else if(m==='dh'){mechRing(ctx,0,-8,78*q,c,c2,p,.92);mechRing(ctx,0,-8,54*q,c,c2,p,.58);if(p>.5){const k=out((p-.5)/.5);ring(ctx,0,-8,26+58*k,c2,8,.9);shards(ctx,0,-8,c,p,12,88,24,.7);}}
 else if(m==='sh'){const len=160*q;box(ctx,18,-74,46,50,c,.92,5,false);for(let i=0;i<4;i++)mechRing(ctx,42,-64+i*11,12+i*3,c,c2,p,.55);line(ctx,[[42,-49],[42+len,-49]],c2,20,.92);ring(ctx,42+len,-49,26,c,5,.82);if(p>.62)particleBurst(ctx,42+len,-49,c2,(p-.62)/.38,16,60,4,.65);}
}
function renkoSuper(ctx,p){const c=C.renko,c2=C.renko2;for(let i=0;i<7;i++){const a=i/7*TAU;const x=Math.cos(a)*62,y=-52+Math.sin(a)*40;mechRing(ctx,x,y,23,c,c2,p,.8);line(ctx,[[x,y],[Math.cos(a)*112,-52+Math.sin(a)*72]],c2,4,.58);}if(p>.38){const e=out((p-.38)/.62);dot(ctx,0,-52,20+e*44,c,.9);ring(ctx,0,-52,42+e*125,c2,10,.95);ring(ctx,0,-52,62+e*95,c,3,.45);particleBurst(ctx,0,-52,c,p,26,150,5,.8);}}

export function drawGen4Attack(ctx,x,y,color,p,facing,charId,move){facingWrap(ctx,x,y,facing,local=>{switch(charId){case'g4_cobalt':cobaltAttack(local,p,move);break;case'g4_cyan':cyanAttack(local,p,move);break;case'g4_onyx':onyxAttack(local,p,move);break;case'g4_gold':goldAttack(local,p,move);break;case'g4_vermilion':fireAttack(local,p,move);break;case'g4_umber':umberAttack(local,p,move);break;case'g4_graphite':graphiteAttack(local,p,move);break;case'g4_daichi':daichiAttack(local,p,move);break;case'g4_renko':renkoAttack(local,p,move);break;}});}
export function drawGen4Super(ctx,x,y,color,p,charId,facing=1){facingWrap(ctx,x,y,facing,local=>{switch(charId){case'g4_cobalt':cobaltSuper(local,p);break;case'g4_cyan':cyanSuper(local,p);break;case'g4_onyx':onyxSuper(local,p);break;case'g4_gold':goldSuper(local,p);break;case'g4_vermilion':fireSuper(local,p);break;case'g4_umber':umberSuper(local,p);break;case'g4_graphite':graphiteSuper(local,p);break;case'g4_daichi':daichiSuper(local,p);break;case'g4_renko':renkoSuper(local,p);break;}});}


function gen4RingHits(b,cx,cy,rx,ry,r=7,n=16){
  for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2;
    b.push({shape:'circle',x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry,r});
  }
}
function gen4ArcHits(b,cx,cy,r,a0,a1,thickness=10,n=12){
  for(let i=0;i<=n;i++){
    const a=a0+(a1-a0)*(i/n);
    const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
    b.push({shape:'circle',x,y,r:thickness});
  }
}
function gen4LineHit(b,x1,y1,x2,y2,r){
  b.push({shape:'capsule',x1,y1,x2,y2,r});
}
function gen4EllipsePoly(cx,cy,rx,ry,n=20){
  const pts=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;pts.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]);}
  return {shape:'polygon',points:pts};
}
function gen4MirrorHitboxes(bs,f){
  return bs.map(h=>{
    if(h.shape==='circle'||h.shape==='box') return {...h,x:h.x*f};
    if(h.shape==='capsule') return {...h,x1:h.x1*f,x2:h.x2*f};
    if(h.shape==='polygon') return {...h,points:h.points.map(([x,y])=>[x*f,y])};
    return h;
  });
}

/*
 * Generation IV collision geometry.
 * Every hitbox below is authored from the corresponding Gen IV renderer
 * immediately above in this same file. Decorative glow, trails, and
 * particles are intentionally not made independently damaging.
 */
export function getGen4Hitboxes(charId,move,t,facing=1){
  const e=out(t), q=inout(t), b=[];
  const C=(x,y,r)=>b.push({shape:'circle',x,y,r});
  const B=(x,y,w,h)=>b.push({shape:'box',x,y,w,h});
  const K=(x1,y1,x2,y2,r)=>gen4LineHit(b,x1,y1,x2,y2,r);
  const P=(pts)=>b.push({shape:'polygon',points:pts});

  switch(charId){

    case 'g4_cobalt':
      if(move==='us'){
        // Only the pointed barrier spike is damaging.
        if(t>=.34 && t<.78){
          const k=out((t-.34)/.44);
          P([[30,-112],[30+70*k,-146*k-112],[30+84*k,-127*k-112],[30+38*k,-105],[30,-103]]);
          K(30,-112,30+84*k,-112-24*k,8);
        }
      } else if(move==='ds'){
        const c=38*e;
        B(-70+c,-52,48,64);
        B(70-c,-52,48,64);
        if(t>.50){
          const k=out((t-.50)/.50);
          gen4RingHits(b,0,-20,45*k,28*k,7,10);
        }
      } else if(move==='ss'){
        const reach=112*e;
        B(30+reach/2,-50,Math.max(8,reach),30);
      } else if(move==='uh'){
        const y=-104*e;
        B(0,y,88,22);
        if(t>.38){
          const k=out((t-.38)/.62);
          P([[0,y],[-76*k,y-60*k],[-59*k,y-78*k],[0,y-18*k]]);
          P([[0,y],[76*k,y-60*k],[59*k,y-78*k],[0,y-18*k]]);
        }
      } else if(move==='dh'){
        const y=-124+105*e;
        B(0,y,178,24);
      } else if(move==='sh'){
        const ang=-1.12+2.18*q,r=96,cx=10,cy=-52;
        gen4ArcHits(b,cx,cy,r,-1.12,ang,13,16);
      } else if(move==='sp'){
        const r=42+e*108;
        for(let i=0;i<6;i++){
          const a=i/6*Math.PI*2;
          B(Math.cos(a)*r*.55,-48+Math.sin(a)*r*.4,64,140);
        }
        if(t>.28) C(0,-48,34+out((t-.28)/.72)*122);
      }
      break;

    case 'g4_cyan':
      if(move==='us'){
        const h=118*e;
        for(let i=0;i<5;i++) K(-24+i*12,0,-12+i*6,-h,8);
      } else if(move==='ds'){
        const y=-12+38*e;
        C(0,y,18+22*e);
        if(t>.38) gen4RingHits(b,0,y,25+65*out((t-.38)/.62),10+30*out((t-.38)/.62),7,14);
      } else if(move==='ss'){
        const ang=-Math.PI*.22+q*Math.PI*.44;
        K(22,-50,22+Math.cos(ang)*92,-50+Math.sin(ang)*24,9);
      } else if(move==='uh'){
        const rx=42+e*20,ry=55+e*52;
        gen4RingHits(b,0,-68,rx,ry,7,20);
      } else if(move==='dh'){
        const y=-120+86*e;
        C(0,y,27);
        if(t>.50) C(0,0,20+64*out((t-.50)/.50));
      } else if(move==='sh'){
        const len=145*e;
        for(let i=0;i<5;i++) K(22,-70+i*11,22+len,-70+i*11,7);
      } else if(move==='sp'){
        const r=22+Math.min(1,t/.58)*78;
        gen4RingHits(b,0,-50,r,r*.68,6,18);
        if(t>.32) C(0,-50,16+out((t-.32)/.68)*72);
      }
      break;

    case 'g4_onyx':
      if(move==='us'){
        const h=112*e;
        P([[-22,0],[0,-h],[22,0],[9,-h-24],[-9,-h-24]]);
        K(0,-h+20,0,-h-24,6);
      } else if(move==='ds'){
        P([[-52*e-12,-5],[0,-5-17*e],[52*e+12,-5],[0,-5+17*e]]);
        if(t>.42){
          const k=out((t-.42)/.58);
          P([[-38*k,-8],[0,-90*k],[38*k,-8]]);
        }
      } else if(move==='ss'){
        const x=22+82*e;
        for(let i=0;i<3;i++) K(20,-58+i*13,x,-58+i*13,9);
      } else if(move==='uh'){
        const h=110*e;
        B(0,-h-18,50,104);
        P([[-30,-h+8],[0,-h-38],[30,-h+8],[20,-h+1],[-20,-h+1]]);
        if(t>.48){
          const k=out((t-.48)/.52);
          K(0,-h+8,50*k*Math.cos(-2.45),-h+8+50*k*Math.sin(-2.45),12);
        }
      } else if(move==='dh'){
        const r=28+64*e;
        gen4RingHits(b,0,0,r,r*.32,8,14);
      } else if(move==='sh'){
        const len=130*e;
        P([[18,-76],[18+len,-55],[18+len+30,-44],[18+len,-32],[18,-20]]);
        K(20,-48,18+len,-44,16);
      } else if(move==='sp'){
        const r=32+out(t)*112;
        b.push(gen4EllipsePoly(0,-46,r,r*.7,24));
        const k=out(Math.max(0,(t-.18)/.82));
        if(k>0) P([[-54*k,-8],[0,-160*k],[54*k,-8],[0,-42*k]]);
        if(t>.42) K(0,-58,86*k*Math.cos(-2.2),-58+86*k*Math.sin(-2.2),14);
      }
      break;

    case 'g4_gold':
      if(move==='us'){
        const h=108*e;
        for(let i=0;i<6;i++){
          const yy=-8-i*18*e;
          P([[-30-i*2,yy],[0,yy-15],[30+i*2,yy],[20,yy+10],[-20,yy+10]]);
        }
        C(0,-h,24);
      } else if(move==='ds'){
        C(0,-8,20+55*e);
        if(t>.48) gen4RingHits(b,0,-8,78-24*out((t-.48)/.52),78-24*out((t-.48)/.52),6,18);
      } else if(move==='ss'){
        const len=88*e;
        K(16,-48,26+len,-48,14);
        C(26+len,-48,18);
      } else if(move==='uh'){
        const h=122*e;
        for(let i=0;i<7;i++){
          const yy=-10-i*17*e;
          P([[-28,yy],[0,yy-15],[28,yy],[18,yy+9],[-18,yy+9]]);
        }
        C(0,-h,28);
      } else if(move==='dh'){
        const r=84*e;
        gen4RingHits(b,0,-6,r,r,8,20);
        if(t>.45) C(0,-6,r*(1-.3*out((t-.45)/.55)));
      } else if(move==='sh'){
        const r=18+34*e;
        C(22,-48,r);
        if(t>.42) gen4RingHits(b,22,-48,70*out((t-.42)/.58),55*out((t-.42)/.58),5,10);
      } else if(move==='sp'){
        const r=28+Math.min(1,t/.68)*88;
        C(0,-52,r);
        if(t>.38){
          const rr=38+out((t-.38)/.62)*55;
          gen4RingHits(b,0,-52,rr,rr*.65,7,10);
        }
        if(t>.55) gen4RingHits(b,0,-52,38+out((t-.55)/.45)*125,38+out((t-.55)/.45)*125,7,18);
      }
      break;

    case 'g4_vermilion':
      if(move==='us'){
        const h=108*e;
        gen4RingHits(b,0,-35-h,22,18,8,10);
        P([[-18,-h-32],[0,-h-66],[18,-h-32],[8,-h-44],[-8,-h-44]]);
      } else if(move==='ds'){
        C(0,-8,30+24*e);
        for(let i=0;i<7;i++){
          const a=-Math.PI+i/6*Math.PI,r=25+e*35;
          K(Math.cos(a)*r,-8,Math.cos(a)*(r+22),-8-Math.abs(Math.sin(a))*38,7);
        }
      } else if(move==='ss'){
        const k=q,ang=-1.15+2.25*k;
        const x=18+Math.cos(ang)*72,y=-48+Math.sin(ang)*48;
        C(x,y,22);
        K(18,-48,x,y,11);
      } else if(move==='uh'){
        const h=112*e;
        gen4RingHits(b,0,-8-h,30,35,10,12);
        C(0,-h,35);
      } else if(move==='dh'){
        const by=-126+104*e;
        C(0,by,28+12*e);
        if(t>.48) K(0,by+20,0,by+90*out((t-.48)/.52),10);
        if(t>.48) C(0,0,22+68*out((t-.48)/.52));
      } else if(move==='sh'){
        const len=125*e;
        P([[18,-72],[18+len,-50],[18+len+20,-28],[18,-36]]);
        K(30,-49,18+len+18,-43,9);
      } else if(move==='sp'){
        if(t<.58){
          const r=18+out(t/.58)*48;
          C(0,-52,r);
          gen4RingHits(b,0,-52,r*.95,r*.6,7,12);
        }
        if(t>.45){
          const e2=out((t-.45)/.55),len=175*e2;
          P([[18,-74],[18+len,-50],[18+len+20,-30],[18,-38]]);
          K(30,-50,18+len+18,-42,12);
          C(18+len,-50,30+e2*60);
        }
      }
      break;

    case 'g4_umber':
      if(move==='us'){
        K(15,-42,42,-86-25*e,12);
        C(42,-86-25*e,11);
        K(-15,0,-18,-30-82*e,4);
      } else if(move==='ds'){
        gen4RingHits(b,0,-3,30+45*e,30+45*e,6,16);
        if(t>.55){
          const k=out((t-.55)/.45);
          K(0,-5,0,-58*k,8);
          C(0,-58*k,18);
        }
      } else if(move==='ss'){
        const ang=-.3+q*.9,ex=25+Math.cos(ang)*62,ey=-50+Math.sin(ang)*34;
        K(12,-48,ex,ey,13);
        C(ex,ey,18);
      } else if(move==='uh'){
        K(18,-40,34,-78-92*e,15);
        gen4RingHits(b,34,-78-92*e,42,42,7,16);
      } else if(move==='dh'){
        K(0,-18,18,8,12);
        for(let i=0;i<8;i++){
          const x=18+i*18*e;
          K(x,2,x+(i%2?-42:42)*e,5,5);
        }
      } else if(move==='sh'){
        const end=92*e;
        K(16,-52,16+end,-52,14);
        if(t>.42) K(16+end,-52,16+end+60*out((t-.42)/.58),-42,8);
        if(t>.55) C(16+end+60*out((t-.42)/.58),-42,18);
      } else if(move==='sp'){
        if(t<.70) gen4RingHits(b,0,-4,28+out(t/.70)*95,10+out(t/.70)*48,6,18);
        if(t>.50){
          const e2=out((t-.50)/.50);
          K(15,-50,145*e2,-48,13);
          C(145*e2,-48,30+e2*32);
        }
      }
      break;

    case 'g4_graphite':
      if(move==='us'){
        for(let i=0;i<5;i++){
          const y=-22-i*24*e;
          gen4RingHits(b,0,y,11+i*5,11+i*5,5,12);
        }
        C(0,-112*e,25);
      } else if(move==='ds'){
        gen4RingHits(b,0,-5,20+38*e,20+38*e,5,14);
        const x=70*e;
        K(0,-5,x,-22,5);
        C(x,-22,15);
        if(t>.5) C(x,-22,15+46*out((t-.5)/.5));
      } else if(move==='ss'){
        const x=20+88*e;
        K(20,-50,x,-50,9);
        C(x,-50,27);
      } else if(move==='uh'){
        for(let i=0;i<7;i++){
          const y=-18-i*17*e;
          gen4RingHits(b,0,y,13+i*5,13+i*5,5,12);
        }
        C(0,-112*e,34);
      } else if(move==='dh'){
        gen4RingHits(b,0,-4,28+54*e,28+54*e,8,18);
        for(let i=0;i<6;i++){
          const x=-22+i*9;
          K(x,0,x+(i%2?-42:42)*e,5,5);
        }
      } else if(move==='sh'){
        const x=42+82*e;
        K(18,-48,x,-48,9);
        C(x,-48,30);
      } else if(move==='sp'){
        const r=34+out(t)*105;
        for(let i=0;i<18;i++){
          const a=i/18*Math.PI*2+t*2.2;
          C(Math.cos(a)*r*.65,-52+Math.sin(a)*r*.4,12+out(t)*10);
        }
        if(t>.38){
          const e2=out((t-.38)/.62);
          C(0,-52,30+e2*116);
          gen4RingHits(b,0,-52,52+e2*92,(52+e2*92)*.48,5,18);
        }
      }
      break;

    case 'g4_daichi':
      if(move==='us'){
        B(0,-62*e,28,22);
        C(0,-65*e,12);
        K(0,-48,0,-126*e,7);
        gen4RingHits(b,0,-76*e,12+e*20,12+e*20,4,12);
      } else if(move==='ds'){
        B(0,-12,32,16);
        K(-38,-4,38,-4,4);
        C(0,-4,18+52*e);
      } else if(move==='ss'){
        const len=118*e;
        K(20,-50,20+len,-50,10);
        B(20+len,-50,24,20);
      } else if(move==='uh'){
        for(let i=0;i<4;i++){
          const x=-36+i*24,y=-8-80*e;
          B(x,y,24,16);
          K(x,-8,x,y,5);
        }
        C(0,-88*e,32);
      } else if(move==='dh'){
        for(let i=0;i<6;i++){
          const a=i/6*Math.PI*2+t*1.7,x=Math.cos(a)*58,y=-30+Math.sin(a)*38;
          C(x,y,10);
          K(x,y,0,-2,3);
        }
        C(0,-2,42*e);
        if(t>.55) K(0,-2,0,55*out((t-.55)/.45),7);
      } else if(move==='sh'){
        const len=150*e;
        B(18,-70,42,42);
        K(40,-49,40+len,-49,10);
        for(let i=0;i<5;i++) gen4RingHits(b,48+i*28*e,-49,10+i*2,10+i*2,5,8);
      } else if(move==='sp'){
        const r=58;
        for(let i=0;i<8;i++){
          const a=i/8*Math.PI*2,x=Math.cos(a)*r,y=-52+Math.sin(a)*r*.65;
          C(x,y,14);
          K(x,y,Math.cos(a)*104,-52+Math.sin(a)*104*.65,4);
        }
        if(t>.34){
          const e2=out((t-.34)/.66);
          C(0,-52,28+e2*94);
          gen4RingHits(b,0,-52,44+e2*70,(44+e2*70)*.65,6,16);
        }
      }
      break;

    case 'g4_renko':
      if(move==='us'){
        C(0,-25-e*85,26);
        C(0,-48-e*55,18);
        K(0,0,0,-122*e,7);
      } else if(move==='ds'){
        C(0,-8,24+30*e);
        gen4RingHits(b,0,-8,44+36*e,12+20*e,6,14);
      } else if(move==='ss'){
        const len=118*e;
        B(18,-62,30,28);
        K(32,-48,32+len,-48,11);
        C(32+len,-48,11);
      } else if(move==='uh'){
        for(let i=0;i<5;i++) C(0,-14-i*21*e,19+i*4);
        K(-42,0,42,0,5);
        if(t>.50) C(0,-112*e,28);
      } else if(move==='dh'){
        C(0,-8,75*e);
        C(0,-8,52*e);
        if(t>.55) C(0,0,24+55*out((t-.55)/.45));
      } else if(move==='sh'){
        const len=160*e;
        B(18,-74,46,50);
        for(let i=0;i<4;i++) gen4RingHits(b,42,-64+i*11,12+i*3,12+i*3,5,8);
        K(42,-49,42+len,-49,12);
        C(42+len,-49,26);
      } else if(move==='sp'){
        const r=62;
        for(let i=0;i<7;i++){
          const a=i/7*Math.PI*2,x=Math.cos(a)*r,y=-52+Math.sin(a)*40;
          C(x,y,14);
          K(x,y,Math.cos(a)*112,-52+Math.sin(a)*72,4);
        }
        if(t>.38){
          const e2=out((t-.38)/.62);
          C(0,-52,20+e2*44);
          gen4RingHits(b,0,-52,42+e2*125,(42+e2*125)*.64,7,20);
        }
      }
      break;
  }

  return gen4MirrorHitboxes(b,facing<0?-1:1);
}

