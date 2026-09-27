// Generation IV — fully authored attack animation + hitbox system.
// Every move is rendered as an actual animated construction/effect. No fighter
// body is redrawn here; renderer.js draws the fighter separately.
const TAU = Math.PI * 2;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const out = v => 1 - Math.pow(1 - clamp(v), 3);
const inout = v => { v = clamp(v); return v < .5 ? 4*v*v*v : 1 - Math.pow(-2*v+2,3)/2; };
function glow(ctx,c,b=16){ctx.shadowColor=c;ctx.shadowBlur=b;}
function line(ctx,pts,c,w,a=1){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';glow(ctx,c,w*1.7);ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();ctx.restore();}
function ring(ctx,x,y,r,c,w=5,a=1,rot=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';glow(ctx,c,w*2);ctx.beginPath();ctx.arc(x,y,r,rot,rot+TAU);ctx.stroke();ctx.restore();}
function dot(ctx,x,y,r,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;glow(ctx,c,r*2);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function box(ctx,x,y,w,h,c,a=1,sw=5,fill=false){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=sw;ctx.lineJoin='round';glow(ctx,c,sw*2);if(fill){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}else ctx.strokeRect(x,y,w,h);ctx.restore();}
function poly(ctx,pts,c,a=1,fill=true,sw=4){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=sw;ctx.lineJoin='round';glow(ctx,c,sw*2);ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();if(fill){ctx.fillStyle=c;ctx.fill();}else ctx.stroke();ctx.restore();}
function particles(ctx,cx,cy,c,p,count=10,r=4,spread=60,a=.65){for(let i=0;i<count;i++){const ang=i/count*TAU+p*TAU*1.4;const rr=spread*(.25+.75*ease(p));dot(ctx,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.65,r*(1-p*.35),c,a*(1-p*.45));}}
function shards(ctx,cx,cy,c,p,count=7,rad=70,len=26,a=.75){for(let i=0;i<count;i++){const ang=i/count*TAU+p*1.8;const rr=rad*(.25+.75*out(p));const x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr*.65;line(ctx,[[x-Math.cos(ang)*len*.35,y-Math.sin(ang)*len*.35],[x+Math.cos(ang)*len,y+Math.sin(ang)*len]],c,4,a*(1-p*.35));}}
function sweepArc(ctx,cx,cy,r,a0,a1,c,p,w=10){const e=out(p);ctx.save();ctx.globalAlpha=.9;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';glow(ctx,c,w*2);ctx.beginPath();ctx.arc(cx,cy,r,a0,a0+(a1-a0)*e);ctx.stroke();ctx.restore();}
function crack(ctx,x,y,c,p,dir=1){const e=out(p);line(ctx,[[x,y],[x+28*e*dir,y+12*e],[x+45*e*dir,y-12*e],[x+72*e*dir,y+4*e]],c,4,.7);}
function facingWrap(ctx,x,y,facing,fn){ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);fn(ctx);ctx.restore();}

const C={
 cobalt:'#3366FF', cobalt2:'#77AAFF', cyan:'#66DDFF', cyan2:'#C8F8FF',
 onyx:'#171225', onyx2:'#5C3C88', gold:'#FFD83D', gold2:'#FFF2A0',
 verm:'#E34234', verm2:'#FF8A55', umber:'#9A5B32', umber2:'#D08A54',
 graphite:'#8899AA', graphite2:'#D8E8F5', daichi:'#FFB02E', daichi2:'#7EE8FF',
 renko:'#A90024', renko2:'#FF4568'
};

function cobaltAttack(ctx,p,m){const c=C.cobalt,c2=C.cobalt2,e=out(p),q=inout(p);
 if(m==='us'){const rise=110*e;box(ctx,-34,0-rise,68,18,c,.95,5,true);box(ctx,-28,-rise-5,56,10,c2,.75,3);if(p>.28){const tilt=(p-.28)/.72;poly(ctx,[[34,-rise-4],[88*tilt,-rise-28],[86*tilt,-rise-10],[34,-rise+10]],c2,.9,true,4);}for(let i=0;i<5;i++)line(ctx,[[-38+i*19,0],[ -30+i*16,-rise]],c2,.9,.18);}
 else if(m==='ds'){const close=38*e;box(ctx,-82+close, -52,48,64,c,.9,5,true);box(ctx,34-close,-52,48,64,c,.9,5,true);line(ctx,[[-58+close,-44],[-16,-18]],c2,4,.8);line(ctx,[[58-close,-44],[16,-18]],c2,4,.8);if(p>.62){shards(ctx,0,-20,c2,p-.62,8,55,18,.75);}}
 else if(m==='ss'){const reach=100*e;box(ctx,20,-58,reach,30,c,.95,5,true);box(ctx,20,-54,reach,30,c2,.35,3);if(p>.5){line(ctx,[[20+reach,-58],[20+reach+14,-43],[20+reach,-28]],c2,5,.8);}}
 else if(m==='uh'){const rise=100*e;box(ctx,-44,-rise,88,20,c,.95,5,true);box(ctx,-62,-rise-10,124,8,c2,.55,3);if(p>.48){const k=out((p-.48)/.52);poly(ctx,[[0,-rise],[ -72*k,-rise-60*k],[-56*k,-rise-76*k],[0,-rise-18]],c2,.85);poly(ctx,[[0,-rise],[72*k,-rise-60*k],[56*k,-rise-76*k],[0,-rise-18]],c2,.85);}}
 else if(m==='dh'){const drop=out(p);box(ctx,-86,-118+drop*98,172,22,c,.95,5,true);if(p>.48){for(let i=0;i<7;i++)poly(ctx,[[-70+i*23,-20],[-60+i*23,4],[-50+i*23,-12]],c2,.8);}}
 else if(m==='sh'){const a=-1.2+q*2.4;const r=94;ctx.save();ctx.translate(8,-52);ctx.rotate(a*.15);ctx.globalAlpha=.9;ctx.strokeStyle=c;ctx.lineWidth=22;glow(ctx,c,28);ctx.beginPath();ctx.arc(0,0,r,-1.05,1.05);ctx.stroke();ctx.restore();box(ctx,20,-72,72,40,c2,.25,3);}
}
function cobaltSuper(ctx,p){const c=C.cobalt,c2=C.cobalt2;const r=42+out(p)*105;for(let i=0;i<6;i++){const a=i/6*TAU;const cx=Math.cos(a)*r*.55,cy=-48+Math.sin(a)*r*.4;box(ctx,cx-32,cy-70,64,140,c,.75,6,false);line(ctx,[[cx-25,cy-62],[cx+25,cy+62]],c2,3,.6);}if(p>.32){const e=out((p-.32)/.68);ring(ctx,0,-48,35+e*120,c2,10,1);for(let i=0;i<18;i++){const a=i/18*TAU;line(ctx,[[Math.cos(a)*35,-48+Math.sin(a)*25],[Math.cos(a)*(35+e*110),-48+Math.sin(a)*(25+e*80)]],c,5,.75);}}}

function cyanAttack(ctx,p,m){const c=C.cyan,c2=C.cyan2,e=out(p),q=inout(p);
 if(m==='us'){const h=120*e;for(let i=0;i<5;i++){const x=-20+i*10+Math.sin(p*8+i)*8;line(ctx,[[x,0],[x*.5,-h]],c,5,.45);}for(let i=0;i<3;i++)ring(ctx,0,-h*.65,18+i*10,c2,4,.7);}
 else if(m==='ds'){const dip=42*e;ring(ctx,0,-12+dip,18+e*22,c,5,.8);if(p>.45){const b=out((p-.45)/.55);ring(ctx,0,-12+dip,18+b*68,c2,7,1);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,[[Math.cos(a)*18,-12+dip+Math.sin(a)*8],[Math.cos(a)*(18+b*68),-12+dip+Math.sin(a)*(8+b*35)]],c,4,.7);}}}
 else if(m==='ss'){const r=20+e*85;const pts=[];for(let i=0;i<18;i++){const t=i/17;pts.push([20+r*t,-48+Math.sin(t*Math.PI)*22+Math.sin(t*8+p*5)*4]);}line(ctx,pts,c,8,.95);line(ctx,pts,c2,2,.8);}
 else if(m==='uh'){const h=120*e;for(let i=0;i<3;i++){const a=i/3*TAU+p*TAU*1.5;const rx=38+e*18;const ry=58+e*45;const pts=[];for(let j=0;j<20;j++){const t=j/19;pts.push([Math.cos(a+t*TAU)*rx,-70+Math.sin(a+t*TAU)*ry]);}line(ctx,pts,c,7,.8);}ring(ctx,0,-70,25+e*40,c2,5,.75);}
 else if(m==='dh'){const r=out(p)*75;dot(ctx,0,-118+e*78,22,c,.7);ring(ctx,0,-118+e*78,26,c2,5,.8);if(p>.52){const b=out((p-.52)/.48);ring(ctx,0,0,18+b*62,c,6,.9);}}
 else if(m==='sh'){const len=135*e;for(let k=0;k<4;k++){const y=-65+k*10;line(ctx,[[20,y],[20+len,y+Math.sin(k+p*8)*8]],c,8-k,.65);}for(let i=0;i<8;i++){const x=20+len*(i/8);line(ctx,[[x,-75],[x+20*e,-75+Math.sin(i+p*8)*10]],c2,3,.5);}}
}
function cyanSuper(ctx,p){const c=C.cyan,c2=C.cyan2;ease;const r=24+Math.min(1,p/.55)*65;for(let i=0;i<16;i++){const a=i/16*TAU+p*4;line(ctx,[[Math.cos(a)*r,-48+Math.sin(a)*r*.7],[Math.cos(a)*(r+20),-48+Math.sin(a)*(r+20)*.7]],c,5,.6);}if(p>.35){const e=out((p-.35)/.65);ctx.save();ctx.globalAlpha=.8;ctx.fillStyle=c;glow(ctx,c,35);ctx.beginPath();ctx.arc(0,-48,18+e*70,0,TAU);ctx.fill();ctx.restore();ring(ctx,0,-48,22+e*95,c2,9,.95);particles(ctx,0,-48,c2,p,22,4,125,.7);}}

function onyxAttack(ctx,p,m){const c=C.onyx,c2=C.onyx2,e=out(p),q=inout(p);
 if(m==='us'){const h=110*e;poly(ctx,[[-18,0],[0,-h],[18,0]],c,.95);poly(ctx,[[-9,-h+22],[0,-h-22],[9,-h+22]],c2,.8);for(let i=0;i<5;i++)line(ctx,[[0,-h+8],[(-1+i%2*2)*18,-h+25+i*7]],c2,3,.5);}
 else if(m==='ds'){ctx.save();ctx.globalAlpha=.9;ctx.fillStyle=c;glow(ctx,c,18);ctx.beginPath();ctx.ellipse(0,-5,48*e,15*e,0,0,TAU);ctx.fill();ctx.restore();if(p>.48){const k=out((p-.48)/.52);poly(ctx,[[-30*k,-8],[0,-82*k],[30*k,-8]],c2,.95);}}
 else if(m==='ss'){const k=e;for(let i=0;i<3;i++){const x=22+72*k;const yy=-54+(i-1)*13;line(ctx,[[20,-54+(i-1)*4],[x,yy]],c2,9,.85);line(ctx,[[x,yy],[x+18*k,yy-10+i*8]],c,5,.8);}}
 else if(m==='uh'){const h=105*e;box(ctx,-22,-h-20,44,100,c,.5,4,true);poly(ctx,[[-26,-h+10],[0,-h-32],[26,-h+10],[18,-h+2],[-18,-h+2]],c2,.9);if(p>.55)sweepArc(ctx,0,-h+15,45,-2.4,.2,c,p-.55,12);}
 else if(m==='dh'){ctx.save();ctx.globalAlpha=.45;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,95*e,22*e,0,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<7;i++){const a=i/7*TAU+p*1.8;const r=30+e*62;line(ctx,[[Math.cos(a)*r,-Math.sin(a)*r*.35],[Math.cos(a)*(r+32),-Math.sin(a)*(r+.1*20)]],c2,8,.9);}}
 else if(m==='sh'){const len=120*e;poly(ctx,[[18,-75],[18+len,-52],[18+len,-35],[18,-20]],c,.95);poly(ctx,[[18+len,-52],[18+len+28,-44],[18+len,-35]],c2,.8);line(ctx,[[20,-48],[18+len,-44]],c2,4,.7);}
}
function onyxSuper(ctx,p){const c=C.onyx,c2=C.onyx2;const r=30+out(p)*105;ctx.save();ctx.globalAlpha=.8;ctx.fillStyle=c;glow(ctx,c,28);ctx.beginPath();ctx.ellipse(0,-45,r,r*.68,0,0,TAU);ctx.fill();ctx.restore();const e=out(Math.max(0,(p-.2)/.8));poly(ctx,[[-48*e,-10],[0,-155*e],[48*e,-10],[0,-40*e]],c2,.65);if(p>.45){sweepArc(ctx,0,-60,80,-2.2,.2,c2,(p-.45)/.55,18);particles(ctx,0,-50,c,p,20,5,130,.65);}}

function goldAttack(ctx,p,m){const c=C.gold,c2=C.gold2,e=out(p),q=inout(p);
 if(m==='us'){const h=105*e;for(let i=0;i<5;i++){const yy=-h+i*18;box(ctx,-26-i*2,yy,52+i*4,14,c2,.75,3,false);}ring(ctx,0,-h,24,c,5,.9);}
 else if(m==='ds'){ring(ctx,0,-8,18+e*52,c,7,.9);if(p>.5){const k=out((p-.5)/.5);ring(ctx,0,-8,70-k*18,c2,6,.8);for(let i=0;i<12;i++){const a=i/12*TAU;line(ctx,[[Math.cos(a)*18,-8+Math.sin(a)*9],[Math.cos(a)*(18+k*55),-8+Math.sin(a)*(9+k*30)]],c,4,.65);}}}
 else if(m==='ss'){const len=75*e;ring(ctx,25+len,-45,18,c2,5,.7);line(ctx,[[15,-45],[25+len,-45]],c,11,.95);particles(ctx,25+len,-45,c2,p,6,3,20,.6);}
 else if(m==='uh'){const h=120*e;for(let i=0;i<6;i++){const yy=-8-i*18*e;poly(ctx,[[-30,yy],[0,yy-16],[30,yy], [20,yy+10],[-20,yy+10]],c,.75);line(ctx,[[-28,yy+2],[28,yy+2]],c2,3,.7);}ring(ctx,0,-h,26,c2,6,.9);}
 else if(m==='dh'){const r=85*e;ring(ctx,0,-5,r,c,8,.9);ring(ctx,0,-5,r*.72,c2,3,.6);if(p>.55){const k=out((p-.55)/.45);ring(ctx,0,-5,r*(1-k*.3),c,10,.9);particles(ctx,0,-5,c2,p,14,4,r,.7);}}
 else if(m==='sh'){const r=18+e*34;dot(ctx,22,-48,r,c,.35);dot(ctx,22,-48,r*.65,c2,.5);if(p>.42){const k=out((p-.42)/.58);for(let i=0;i<6;i++){const a=i/6*TAU;line(ctx,[[22,-48],[22+Math.cos(a)*70*k,-48+Math.sin(a)*55*k]],c,5,.7);}}}
}
function goldSuper(ctx,p){const c=C.gold,c2=C.gold2;const r=28+Math.min(1,p/.72)*82;ctx.save();ctx.globalAlpha=.3;ctx.fillStyle=c;glow(ctx,c,35);ctx.beginPath();ctx.arc(0,-52,r,0,TAU);ctx.fill();ctx.restore();for(let i=0;i<12;i++){const a=i/12*TAU+p*1.2;line(ctx,[[Math.cos(a)*r,-52+Math.sin(a)*r*.7],[Math.cos(a)*(r+25),-52+Math.sin(a)*(r+25)*.7]],c2,5,.7);}if(p>.55){const e=out((p-.55)/.45);ring(ctx,0,-52,35+e*115,c,10,.95);particles(ctx,0,-52,c2,p,24,5,130,.75);}}

function fireAttack(ctx,p,m){const c=C.verm,c2=C.verm2,e=out(p),q=inout(p);
 if(m==='us'){const h=105*e;poly(ctx,[[0,-35-h],[22,-60-h],[8,-92-h],[-12,-70-h],[-24,-42-h]],c,.95);line(ctx,[[0,-30],[0,-h]],c2,5,.7);}
 else if(m==='ds'){ring(ctx,0,-6,28+e*22,c,8,.9);for(let i=0;i<7;i++){const a=-Math.PI+i/6*Math.PI;const r=25+e*35;line(ctx,[[Math.cos(a)*r,-8],[Math.cos(a)*(r+22),-8-Math.abs(Math.sin(a))*38]],c2,7,.8);}}
 else if(m==='ss'){sweepArc(ctx,18,-48,68,-1.15,1.0,c,p,14);line(ctx,[[18,-48],[80*e,-48]],c2,3,.7);}
 else if(m==='uh'){const h=105*e;for(let i=0;i<4;i++){const a=i/4*TAU+p*2;line(ctx,[[Math.cos(a)*28,-5],[Math.cos(a)*48,-h+Math.sin(a)*48]],c,10,.7);}ring(ctx,0,-h,32,c2,7,.8);if(p>.7)particles(ctx,0,-h,c,p,14,5,65,.75);}
 else if(m==='dh'){const by=-125+e*100;dot(ctx,0,by,25+e*12,c,.85);dot(ctx,0,by,14,c2,.9);if(p>.55){const k=out((p-.55)/.45);line(ctx,[[0,by+25],[0,by+90*k]],c,16,.85);ring(ctx,0,0,20+65*k,c2,6,.85);}}
 else if(m==='sh'){const len=115*e;poly(ctx,[[18,-72],[18+len,-48],[18+len,-22],[18,-36]],c,.95);poly(ctx,[[18+len,-48],[18+len+24,-35],[18+len,-22]],c2,.8);}
}
function fireSuper(ctx,p){const c=C.verm,c2=C.verm2;if(p<.62){const r=18+out(p/.62)*42;dot(ctx,0,-50,r,c,.9);dot(ctx,0,-50,r*.55,c2,.8);}if(p>.48){const e=out((p-.48)/.52);const len=160*e;poly(ctx,[[18,-70],[18+len,-48],[18+len,-24],[18,-38]],c,.9);poly(ctx,[[18,-52],[18+len,-42],[18,-32]],c2,.8);ring(ctx,18+len,-48,30+e*55,c2,7,.8);}}

function umberAttack(ctx,p,m){const c=C.umber,c2=C.umber2,e=out(p),q=inout(p);
 if(m==='us'){line(ctx,[[-18,-6],[0,-52-75*e],[18,-10]],c2,10,.9);ring(ctx,0,-85*e,18,c,4,.8);for(let i=0;i<5;i++)line(ctx,[[0,0],[Math.cos(i*1.2)*45*e,-10+Math.sin(i*1.2)*18]],c,3,.5);}
 else if(m==='ds'){ring(ctx,0,-4,20+e*42,c,5,.8);for(let i=0;i<8;i++){const a=i/8*TAU;line(ctx,[[Math.cos(a)*12,-4+Math.sin(a)*5],[Math.cos(a)*(22+e*50),-4+Math.sin(a)*(10+e*15)]],c2,4,.75);}}
 else if(m==='ss'){const ang=-.25+q*.9;line(ctx,[[12,-48],[30+Math.cos(ang)*50,-48+Math.sin(ang)*35]],c2,12,.9);ring(ctx,70*q,-48,14,c,4,.7);}
 else if(m==='uh'){line(ctx,[[15,-45],[32,-88-75*e]],c2,13,.95);const h=75*e;for(let i=0;i<5;i++){const x=(i-2)*14;line(ctx,[[x,0],[x,-h]],c,4,.7);}}
 else if(m==='dh'){line(ctx,[[0,-42],[0,-5]],c2,12,.95);for(let i=0;i<6;i++){const x=18+i*18*e;line(ctx,[[0,0],[x,-5+i%2*8]],c,5,.8);}}
 else if(m==='sh'){const end=92*e;line(ctx,[[16,-52],[16+end,-52]],c2,15,.95);line(ctx,[[16+end,-52],[16+end+35,-38],[16+end+50,-55]],c,6,.8);if(p>.6)ring(ctx,16+end+35,-48,18,c2,5,.7);}
}
function umberSuper(ctx,p){const c=C.umber,c2=C.umber2;if(p<.7){ring(ctx,0,-4,25+out(p/.7)*80,c,5,.5);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,[[Math.cos(a)*20,-4+Math.sin(a)*8],[Math.cos(a)*(25+out(p/.7)*80),-4+Math.sin(a)*(8+out(p/.7)*45)]],c2,3,.45);}}if(p>.55){const e=out((p-.55)/.45);line(ctx,[[15,-50],[120*e,-48]],c2,22,.95);ring(ctx,120*e,-48,32+e*25,c,8,.9);}}

function graphiteAttack(ctx,p,m){const c=C.graphite,c2=C.graphite2,e=out(p);
 if(m==='us'){for(let i=0;i<4;i++){const yy=-25-i*28*e;ring(ctx,0,yy,12+i*7,c,4,.75);}ring(ctx,0,-105*e,24,c2,5,.85);}
 else if(m==='ds'){ring(ctx,0,-5,18+e*35,c,4,.8);const x=62*e;ring(ctx,x,-20,16,c2,5,.8);line(ctx,[[0,-5],[x,-20]],c,3,.65);if(p>.5)ring(ctx,x,-20,16+out((p-.5)/.5)*45,c,7,.8);}
 else if(m==='ss'){line(ctx,[[18,-50],[18+78*e,-50]],c2,5,.9);for(let i=0;i<3;i++)ring(ctx,18+78*e,-50,8+i*8,c,3,.7);}
 else if(m==='uh'){for(let i=0;i<6;i++){const yy=-20-i*18*e;ring(ctx,0,yy,14+i*5,c,4,.8);}ring(ctx,0,-110*e,34,c2,6,.9);}
 else if(m==='dh'){ring(ctx,0,-4,26+e*50,c,6,.7);for(let i=0;i<5;i++)crack(ctx,-20+i*10,0,c2,p, i%2?-1:1);if(p>.55)shards(ctx,0,0,c,p,8,75,20,.75);}
 else if(m==='sh'){const k=e;ring(ctx,42+80*k,-48,18,c2,5,.8);ring(ctx,42+80*k,-48,30,c,3,.7);line(ctx,[[18,-48],[42+80*k,-48]],c,11,.85);}
}
function graphiteSuper(ctx,p){const c=C.graphite,c2=C.graphite2;for(let i=0;i<18;i++){const a=i/18*TAU+p*2;const r=35+out(p)*100;ring(ctx,Math.cos(a)*r*.65,-52+Math.sin(a)*r*.4,10+out(p)*18,c,3,.45,a);}if(p>.45){const e=out((p-.45)/.55);ring(ctx,0,-52,30+e*110,c2,9,.95);for(let i=0;i<14;i++){const a=i/14*TAU;dot(ctx,Math.cos(a)*(40+e*100),-52+Math.sin(a)*(25+e*70),5,c,e*.8);}}}

function daichiAttack(ctx,p,m){const c=C.daichi,c2=C.daichi2,e=out(p),q=inout(p);
 function drone(x,y,s=.75){box(ctx,x-12*s,y-8*s,24*s,16*s,c,.95,3,false);dot(ctx,x+8*s,y,3,c2,.8);}
 if(m==='us'){drone(0,-65*e);line(ctx,[[0,-50*e],[0,-125*e]],c2,5,.8);for(let i=0;i<4;i++)ring(ctx,0,-75*e,12+i*7,c,3,.65);}
 else if(m==='ds'){box(ctx,-16,-12,32,16,c,.9,3,true);line(ctx,[[-35,-5],[35,-5]],c2,3,.6);ring(ctx,0,-4,16+e*48,c,5,.8);}
 else if(m==='ss'){const len=110*e;line(ctx,[[18,-50],[18+len,-50]],c2,8,.9);box(ctx,18+len-10,-58,20,16,c,.8,3,false);for(let i=0;i<5;i++)dot(ctx,18+len*(i/5),-50,3,c,i<4?.6:1);}
 else if(m==='uh'){for(let i=0;i<4;i++){drone(-36+i*24,-8-e*80);line(ctx,[[-36+i*24,-8],[-36+i*24,-80*e]],c2,3,.5);}ring(ctx,0,-85*e,30,c,6,.85);}
 else if(m==='dh'){for(let i=0;i<5;i++){const a=i/5*TAU+q;const x=Math.cos(a)*55,y=-30+Math.sin(a)*35;drone(x,y,.65);line(ctx,[[x,y],[0,0]],c2,2,.5);}ring(ctx,0,0,38*e,c,6,.8);}
 else if(m==='sh'){const len=145*e;box(ctx,20,-67,38,38,c,.9,4,false);line(ctx,[[38,-48],[38+len,-48]],c2,17,.9);for(let i=0;i<4;i++)ring(ctx,45+i*28*e,-48,10+i*3,c,3,.65);}
}
function daichiSuper(ctx,p){const c=C.daichi,c2=C.daichi2;for(let i=0;i<8;i++){const a=i/8*TAU;const r=55;const x=Math.cos(a)*r,y=-52+Math.sin(a)*r*.65;box(ctx,x-14,y-9,28,18,c,.85,3,false);line(ctx,[[x,y],[Math.cos(a)*95,-52+Math.sin(a)*95*.65]],c2,3,.6);}if(p>.35){const e=out((p-.35)/.65);ring(ctx,0,-52,28+e*90,c2,8,.9);particles(ctx,0,-52,c,p,20,4,115,.7);}}

function renkoAttack(ctx,p,m){const c=C.renko,c2=C.renko2,e=out(p);
 function mechRing(y,r,a=.8){ring(ctx,0,y,r,c,6,a);ring(ctx,0,y,r*.72,c2,3,a*.7);}
 if(m==='us'){mechRing(-25-e*85,26,.9);mechRing(-48-e*55,18,.7);line(ctx,[[0,0],[0,-120*e]],c2,9,.8);}
 else if(m==='ds'){mechRing(-8,24+e*28,.9);for(let i=0;i<8;i++){const a=i/8*TAU;line(ctx,[[Math.cos(a)*18,-8+Math.sin(a)*8],[Math.cos(a)*(40+e*35),-8+Math.sin(a)*(12+e*18)]],c,5,.75);}}
 else if(m==='ss'){const len=115*e;box(ctx,18,-60,28,24,c,.9,3,false);line(ctx,[[30,-48],[30+len,-48]],c2,10,.9);dot(ctx,30+len,-48,10,c,.8);}
 else if(m==='uh'){for(let i=0;i<4;i++)mechRing(-15-i*22*e,20+i*4,.8);line(ctx,[[-38,0],[38,0]],c2,4,.5);}
 else if(m==='dh'){mechRing(-8,75*e,.9);mechRing(-8,52*e,.55);if(p>.55){const k=out((p-.55)/.45);ring(ctx,0,0,24+55*k,c2,8,.9);shards(ctx,0,0,c,p,10,80,22,.65);}}
 else if(m==='sh'){const len=155*e;box(ctx,18,-72,44,48,c,.9,5,false);for(let i=0;i<4;i++)mechRing(-64+i*10,12+i*3,.65);line(ctx,[[42,-48],[42+len,-48]],c2,19,.9);ring(ctx,42+len,-48,25,c,5,.8);}
}
function renkoSuper(ctx,p){const c=C.renko,c2=C.renko2;for(let i=0;i<6;i++){const a=i/6*TAU;const x=Math.cos(a)*60,y=-52+Math.sin(a)*38;ring(ctx,x,y,22,c,6,.8);line(ctx,[[x,y],[Math.cos(a)*110,-52+Math.sin(a)*70]],c2,4,.6);}if(p>.4){const e=out((p-.4)/.6);dot(ctx,0,-52,20+e*42,c,.9);ring(ctx,0,-52,40+e*120,c2,10,.95);particles(ctx,0,-52,c,p,24,5,145,.8);}}

export function drawGen4Attack(ctx,x,y,color,p,facing,charId,move){facingWrap(ctx,x,y,facing,local=>{switch(charId){case'g4_cobalt':cobaltAttack(local,p,move);break;case'g4_cyan':cyanAttack(local,p,move);break;case'g4_onyx':onyxAttack(local,p,move);break;case'g4_gold':goldAttack(local,p,move);break;case'g4_vermilion':fireAttack(local,p,move);break;case'g4_umber':umberAttack(local,p,move);break;case'g4_graphite':graphiteAttack(local,p,move);break;case'g4_daichi':daichiAttack(local,p,move);break;case'g4_renko':renkoAttack(local,p,move);break;}});}
export function drawGen4Super(ctx,x,y,color,p,charId,facing=1){facingWrap(ctx,x,y,facing,local=>{switch(charId){case'g4_cobalt':cobaltSuper(local,p);break;case'g4_cyan':cyanSuper(local,p);break;case'g4_onyx':onyxSuper(local,p);break;case'g4_gold':goldSuper(local,p);break;case'g4_vermilion':fireSuper(local,p);break;case'g4_umber':umberSuper(local,p);break;case'g4_graphite':graphiteSuper(local,p);break;case'g4_daichi':daichiSuper(local,p);break;case'g4_renko':renkoSuper(local,p);break;}});}

function boxesFor(charId,m,t){
 const e=out(t), b=[];
 const Cc=(x,y,r)=>b.push({shape:'circle',x,y,r});
 const B=(x,y,w,h)=>b.push({shape:'box',x,y,w,h});
 const K=(x1,y1,x2,y2,r)=>b.push({shape:'capsule',x1,y1,x2,y2,r});
 const P=pts=>b.push({shape:'polygon',points:pts});
 const A=(cx,cy,rx,ry,n=12)=>{for(let i=0;i<n;i++){const a=i/ n*Math.PI*2; Cc(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,9);}};
 switch(charId){
 case'g4_cobalt':
   if(m==='us'){const y=-110*e;B(-34,y,68,24);if(t>.28)K(28,y,Math.min(88,28+60*out((t-.28)/.72)),y-18,10);}
   else if(m==='ds'){const c=38*e;B(-82+c,-52,48,64);B(34-c,-52,48,64);if(t>.62)A(0,-20,45,28,10);}
   else if(m==='ss')B(20,-58,100*e,30);
   else if(m==='uh'){const y=-100*e;B(-44,y,88,24);if(t>.48){const k=out((t-.48)/.52);P([[0,y],[ -72*k,y-60*k],[-56*k,y-76*k],[0,y-18*k]]);P([[0,y],[72*k,y-60*k],[56*k,y-76*k],[0,y-18*k]]);}}
   else if(m==='dh')B(-86,-118+98*e,172,24);
   else if(m==='sh'){const q=inout(t),ang=-1.05+2.1*q,r=94,cx=8,cy=-52;Cc(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,18);K(cx+Math.cos(-1.05)*r,cy+Math.sin(-1.05)*r,cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,13);}
   break;
 case'g4_cyan':
   if(m==='us'){const h=120*e;for(let i=0;i<5;i++)K(-20+i*10,0,-10+i*5,-h,7);}
   else if(m==='ds'){const y=-12+42*e;Cc(0,y,18+22*e);if(t>.45)A(0,y,18+68*out((t-.45)/.55),8+35*out((t-.45)/.55),12);}
   else if(m==='ss'){const q=inout(t);const ang=-Math.PI*.22+q*Math.PI*.44;const ex=20+Math.cos(ang)*85,ey=-48+Math.sin(ang)*22;K(20,-48,ex,ey,8);}
   else if(m==='uh'){const rx=38+e*18,ry=58+e*45;A(0,-70,rx,ry,18);}
   else if(m==='dh'){const y=-118+78*e;Cc(0,y,25);if(t>.52)Cc(0,0,18+62*out((t-.52)/.48));}
   else if(m==='sh')B(20,-78,135*e,55);
   break;
 case'g4_onyx':
   if(m==='us'){const h=110*e;P([[-18,0],[0,-h],[18,0]]);P([[-9,-h+22],[0,-h-22],[9,-h+22]]);}
   else if(m==='ds'){Cc(0,-5,48*e+15);if(t>.48)P([[-30*out((t-.48)/.52),-8],[0,-82*out((t-.48)/.52)],[30*out((t-.48)/.52),-8]]);}
   else if(m==='ss'){const x=22+72*e;for(let i=0;i<3;i++)K(20,-54+(i-1)*4,x,-54+(i-1)*13,9);}
   else if(m==='uh'){const h=105*e;B(-22,-h-20,44,100);P([[-26,-h+10],[0,-h-32],[26,-h+10],[18,-h+2],[-18,-h+2]]);if(t>.55){const q=out((t-.55)/.45);K(0,-h+15,45*q*Math.cos(-1.1),-h+15+45*q*Math.sin(-1.1),12);}}
   else if(m==='dh'){const r=30+e*62;A(0,0,r,r*.35,12);}
   else if(m==='sh'){const len=120*e;P([[18,-75],[18+len,-52],[18+len,-35],[18,-20],[18+len+28,-44],[18+len,-35]]);K(20,-48,18+len,-44,16);}
   break;
 case'g4_gold':
   if(m==='us'){const h=105*e;for(let i=0;i<5;i++)B(-26-i*2,-h+i*18,52+i*4,14);Cc(0,-h,24);}
   else if(m==='ds'){const r=18+e*52;Cc(0,-8,r);if(t>.5)Cc(0,-8,70-52*out((t-.5)/.5));}
   else if(m==='ss'){const len=75*e;K(15,-45,25+len,-45,14);Cc(25+len,-45,18);}
   else if(m==='uh'){const h=120*e;for(let i=0;i<6;i++)P([[-30,-8-i*18*e],[0,-24-i*18*e],[30,-8-i*18*e],[20,2-i*18*e],[-20,2-i*18*e]]);Cc(0,-h,26);}
   else if(m==='dh'){const r=85*e;Cc(0,-5,r);if(t>.55)Cc(0,-5,r*(1-.3*out((t-.55)/.45)));}
   else if(m==='sh'){const r=18+e*34;Cc(22,-48,r);if(t>.42)A(22,-48,70*out((t-.42)/.58),55*out((t-.42)/.58),8);}
   break;
 case'g4_vermilion':
   if(m==='us'){const h=105*e;P([[0,-35-h],[22,-60-h],[8,-92-h],[-12,-70-h],[-24,-42-h]]);K(0,-30,0,-h,7);}
   else if(m==='ds'){Cc(0,-6,28+e*22);for(let i=0;i<7;i++){const a=-Math.PI+i/6*Math.PI,r=25+e*35;K(Math.cos(a)*r,-8,Math.cos(a)*(r+22),-8-Math.abs(Math.sin(a))*38,6);}}
   else if(m==='ss'){const q=inout(t),ang=-1.15+2.15*q;Cc(18+Math.cos(ang)*68,-48+Math.sin(ang)*68,16);K(18,-48,18+Math.cos(ang)*68,-48+Math.sin(ang)*68,10);}
   else if(m==='uh'){const h=105*e;for(let i=0;i<4;i++){const a=i/4*Math.PI*2+t*2;K(Math.cos(a)*28,-5,Math.cos(a)*48,-h+Math.sin(a)*48,7);}Cc(0,-h,32);}
   else if(m==='dh'){const by=-125+e*100;Cc(0,by,25+e*12);if(t>.55)K(0,by+25,0,by+90*out((t-.55)/.45),9);if(t>.55)Cc(0,0,20+65*out((t-.55)/.45));}
   else if(m==='sh'){const len=115*e;P([[18,-72],[18+len,-48],[18+len,-22],[18,-36],[18+len+24,-35],[18+len,-22]]);}
   break;
 case'g4_umber':
   if(m==='us'){K(-18,-6,0,-52-75*e,9);K(0,-52-75*e,18,-10,9);Cc(0,-85*e,18);}
   else if(m==='ds'){Cc(0,-4,20+e*42);A(0,-4,22+e*50,10+e*15,8);}
   else if(m==='ss'){const ang=-.25+inout(t)*.9,ex=30+Math.cos(ang)*50,ey=-48+Math.sin(ang)*35;K(12,-48,ex,ey,12);Cc(70*inout(t),-48,14);}
   else if(m==='uh'){K(15,-45,32,-88-75*e,14);for(let i=0;i<5;i++)K((i-2)*14,0,(i-2)*14,-75*e,4);}
   else if(m==='dh'){K(0,-42,0,-5,12);for(let i=0;i<6;i++)K(0,0,18+i*18*e,-5+(i%2)*8,7);}
   else if(m==='sh'){const end=92*e;K(16,-52,16+end,-52,14);K(16+end,-52,16+end+35,-38,7);K(16+end+35,-38,16+end+50,-55,7);if(t>.6)Cc(16+end+35,-48,18);}
   break;
 case'g4_graphite':
   if(m==='us'){for(let i=0;i<4;i++)Cc(0,-25-i*28*e,12+i*7);Cc(0,-105*e,24);}
   else if(m==='ds'){Cc(0,-5,18+e*35);const x=62*e;Cc(x,-20,16);K(0,-5,x,-20,4);if(t>.5)Cc(x,-20,16+45*out((t-.5)/.5));}
   else if(m==='ss'){K(18,-50,18+78*e,-50,8);Cc(18+78*e,-50,24);}
   else if(m==='uh'){for(let i=0;i<6;i++)Cc(0,-20-i*18*e,14+i*5);Cc(0,-110*e,34);}
   else if(m==='dh'){Cc(0,-4,26+e*50);for(let i=0;i<5;i++)K(-20+i*10,0,-20+i*10+(i%2?-45:45)*e,4,4);}
   else if(m==='sh'){const x=42+80*e;K(18,-48,x,-48,8);Cc(x,-48,30);}
   break;
 case'g4_daichi':
   if(m==='us'){B(-14,-100*e,28,22);Cc(0,-65*e,12);K(0,-50*e,0,-125*e,6);}
   else if(m==='ds'){B(-16,-12,32,16);K(-35,-5,35,-5,3);Cc(0,-4,16+e*48);}
   else if(m==='ss'){const len=110*e;K(18,-50,18+len,-50,9);B(18+len-10,-58,20,16);}
   else if(m==='uh'){for(let i=0;i<4;i++){B(-48+i*24,-8-e*80,24,16);K(-36+i*24,-8,-36+i*24,-80*e,4);}Cc(0,-85*e,30);}
   else if(m==='dh'){for(let i=0;i<5;i++){const a=i/5*Math.PI*2+inout(t),x=Math.cos(a)*55,y=-30+Math.sin(a)*35;Cc(x,y,9);K(x,y,0,0,3);}Cc(0,0,38*e);}
   else if(m==='sh'){const len=145*e;B(20,-67,38,38);K(38,-48,38+len,-48,9);for(let i=0;i<4;i++)Cc(45+i*28*e,-48,10+i*3);}
   break;
 case'g4_renko':
   if(m==='us'){Cc(0,-25-e*85,26);Cc(0,-48-e*55,18);K(0,0,0,-120*e,6);}
   else if(m==='ds'){const r=24+e*28;Cc(0,-8,r);A(0,-8,40+e*35,12+e*18,10);}
   else if(m==='ss'){const len=115*e;B(18,-60,28,24);K(30,-48,30+len,-48,10);Cc(30+len,-48,10);}
   else if(m==='uh'){for(let i=0;i<4;i++)Cc(0,-15-i*22*e,20+i*4);K(-38,0,38,0,4);}
   else if(m==='dh'){Cc(0,-8,75*e);Cc(0,-8,52*e);if(t>.55)Cc(0,0,24+55*out((t-.55)/.45));}
   else if(m==='sh'){const len=155*e;B(18,-72,44,48);for(let i=0;i<4;i++)Cc(0,-64+i*10,12+i*3);K(42,-48,42+len,-48,11);Cc(42+len,-48,25);}
   break;
 }
 return b;
}

function mirrorBoxes(bs,f){return bs.map(h=>h.shape==='circle'||h.shape==='box'?{...h,x:h.x*f}:h.shape==='capsule'?{...h,x1:h.x1*f,x2:h.x2*f}:h);}
export function getGen4Hitboxes(charId,move,t,facing=1){
 if(move==='sp'){
   const e=out(t), b=[]; const Cc=(x,y,r)=>b.push({shape:'circle',x,y,r}); const B=(x,y,w,h)=>b.push({shape:'box',x,y,w,h});
   switch(charId){
    case'g4_cobalt': if(t<.32){for(let i=0;i<6;i++){const a=i/6*Math.PI*2,r=42+e*55;B(Math.cos(a)*r*.55-32,-48+Math.sin(a)*r*.4-70,64,140);} } else Cc(0,-48,35+out((t-.32)/.68)*120); break;
    case'g4_cyan': if(t<.35){Cc(0,-48,24+Math.min(1,t/.55)*65);} else Cc(0,-48,18+out((t-.35)/.65)*70); break;
    case'g4_onyx': Cc(0,-45,30+e*105); if(t>.2)b.push({shape:'polygon',points:[[-48*out((t-.2)/.8),-10],[0,-155*out((t-.2)/.8)],[48*out((t-.2)/.8),-10],[0,-40*out((t-.2)/.8)]]}); break;
    case'g4_gold': Cc(0,-52,28+Math.min(1,t/.72)*82); if(t>.55)Cc(0,-52,35+out((t-.55)/.45)*115); break;
    case'g4_vermilion': if(t<.62)Cc(0,-50,18+out(t/.62)*42); if(t>.48)B(18,-70,160*out((t-.48)/.52),46); break;
    case'g4_umber': if(t<.7)Cc(0,-4,25+out(t/.7)*80); if(t>.55)B(15,-50,120*out((t-.55)/.45),24); break;
    case'g4_graphite': Cc(0,-52,35+out(t)*100); if(t>.45)Cc(0,-52,30+out((t-.45)/.55)*110); break;
    case'g4_daichi': for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*55,y=-52+Math.sin(a)*38;B(x-14,y-9,28,18);} if(t>.35)Cc(0,-52,28+out((t-.35)/.65)*90); break;
    case'g4_renko': for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*60,y=-52+Math.sin(a)*38;Cc(x,y,22);} if(t>.4)Cc(0,-52,40+out((t-.4)/.6)*120); break;
   }
   return mirrorBoxes(b,facing<0?-1:1);
 }
 return mirrorBoxes(boxesFor(charId,move,t),facing<0?-1:1);
}
