// Generation V — authored combat animations and collision geometry.
// Every visible attack is built from the same local collision shapes returned by G().
// No attack changes terrain or the stage. Facing is applied once to both art and hitboxes.
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const out=t=>1-Math.pow(1-clamp(t),3);
const inout=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function facingWrap(ctx,x,y,f,fn){ctx.save();ctx.translate(x,y);ctx.scale(f<0?-1:1,1);fn(ctx);ctx.restore()}
function stroke(ctx,pts,c,w,a=1){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=c;ctx.shadowBlur=w*2.5;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();ctx.restore()}
function poly(ctx,pts,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fill();ctx.restore()}
function ring(ctx,x,y,r,c,w=4,a=.7){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore()}
function dot(ctx,x,y,r,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function spark(ctx,x,y,r,c,a=1,n=7){for(let i=0;i<n;i++){const ang=i/n*TAU;stroke(ctx,[[x+Math.cos(ang)*r*.35,y+Math.sin(ang)*r*.35],[x+Math.cos(ang)*r,y+Math.sin(ang)*r]],c,2,a*(1-i*.04))}}
function slash(ctx,x,y,len,ang,c,w=7,a=1){const dx=Math.cos(ang)*len/2,dy=Math.sin(ang)*len/2;stroke(ctx,[[x-dx,y-dy],[x+dx,y+dy]],c,w,a)}
function wave(ctx,x,y,rx,ry,c,a=.7,phase=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=3;ctx.shadowColor=c;ctx.shadowBlur=12;ctx.beginPath();for(let i=0;i<=30;i++){const u=i/30;const xx=x-rx+u*rx*2;const yy=y+Math.sin(u*Math.PI*2+phase)*ry;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.stroke();ctx.restore()}
function flame(ctx,x,y,r,c,a=1,ang=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.9,-r*.1,r*.25,r);ctx.quadraticCurveTo(-r*.85,r*.35,0,-r);ctx.fill();ctx.globalAlpha=a*.7;ctx.fillStyle='#FFF3B0';ctx.beginPath();ctx.moveTo(0,-r*.52);ctx.quadraticCurveTo(r*.32,0,0,r*.5);ctx.quadraticCurveTo(-r*.3,0,0,-r*.52);ctx.fill();ctx.restore()}
function portal(ctx,x,y,r,c,a=.8){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=6;ctx.shadowColor=c;ctx.shadowBlur=20;ctx.beginPath();ctx.ellipse(x,y,r,r*.62,0,0,TAU);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,r*.7,r*.42,0,0,TAU);ctx.stroke();ctx.restore()}
function shard(ctx,x,y,w,h,ang,c,a=1){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-h);ctx.lineTo(w,h*.55);ctx.lineTo(-w*.5,h*.35);ctx.closePath();ctx.fill();ctx.restore()}
function after(ctx,hs,c,c2,p){if(p<.62)return;const q=clamp((p-.62)/.38);for(let i=0;i<Math.min(6,hs.length);i++){const h=hs[i];if(h.shape==='circle')dot(ctx,h.x,h.y,Math.max(2,h.r*.13),c2,.7*q);else if(h.shape==='capsule')dot(ctx,h.x2,h.y2,Math.max(2,h.r*.15),c2,.55*q)}}

// Local collision geometry. These shapes are deliberately attack-shaped rather than generic rectangles.
function G(id,m,t){
 const e=out(t),q=inout(t),b=[];
 const C=(x,y,r)=>b.push({shape:'circle',x,y,r});
 const B=(x,y,w,h)=>b.push({shape:'box',x,y,w,h});
 const K=(x1,y1,x2,y2,r)=>b.push({shape:'capsule',x1,y1,x2,y2,r});
 const P=points=>b.push({shape:'polygon',points});
 switch(id){
 case'yellow':
  if(m==='us'){K(-2,-18,-8,-112*e,15);C(-8,-112*e,20);K(-20,-28,12,-55*e,10)}
  if(m==='ds'){K(-34,-4,34,-4,13+6*e);C(0,-2,31+18*e);}
  if(m==='ss'){const x=30+90*e;K(5,-43,x,-43,17);C(x,-43,22);K(x-18,-55,x+8,-40,10)}
  if(m==='uh'){K(-16,-20,0,-132*e,20);K(16,-20,0,-118*e,18);C(0,-137*e,27)}
  if(m==='dh'){K(-28,-58,-8,-2,17);K(28,-58,8,-2,17);C(0,3,34+16*e)}
  if(m==='sh'){const x=32+132*e;K(6,-48,x,-48,20);K(30,-66,x,-49,12);C(x,-48,25)}
  if(m==='sp'){const x=20+145*e;K(0,-48,x,-48,31);C(x,-48,39+12*e);C(x*.65,-48,24)}
  break;
 case'blue':
  if(m==='us'){const y=-24-120*e;K(-26,-15,0,y,18);K(26,-15,0,y,18);C(0,y,24);}
  if(m==='ds'){C(0,-5,29+23*e);for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI/4;K(0,-5,Math.cos(a)*(38+30*e),-5+Math.sin(a)*(30+25*e),8)}}
  if(m==='ss'){const x=38+125*e;K(4,-46,x,-46,12);C(x,-46,18);K(x-8,-58,x+20,-38,7)}
  if(m==='uh'){const y=-20-130*e;for(let i=0;i<3;i++)K(-38+i*38,-8,0,y,17);C(0,y,27);}
  if(m==='dh'){const r=25+76*e;C(0,-5,r);K(-r,-5,0,-5,10);K(0,-5,r,-5,10)}
  if(m==='sh'){const x=38+138*e;P([[5,-67],[x-12,-58],[x+8,-45],[x-12,-27],[5,-36]]);C(x,-46,23)}
  if(m==='sp'){C(0,-48,27+34*e);for(let i=0;i<8;i++){const a=i/8*TAU+t*2;C(Math.cos(a)*(38+62*e),-48+Math.sin(a)*(24+48*e),10+5*e)}}
  break;
 case'purple':
  if(m==='us'){const x=-52+104*q,y=-42-62*e;K(x,y,x+30,-8,10);C(x,y,14)}
  if(m==='ds'){const x=-22+55*e;K(-8,-22,x,-5,11);C(x,-5,15);K(x,-5,x+30,10,7)}
  if(m==='ss'){const x=34+118*e;K(8,-48,x,-30,8);C(x,-30,13);}
  if(m==='uh'){const x=58-112*q,y=-55-72*e;K(x,y,x-30,-5,9);C(x,y,14)}
  if(m==='dh'){const y=-92+94*e;K(-8,y,20,y+45,11);C(20,y+45,15);K(-20,y+18,5,y+50,8)}
  if(m==='sh'){for(let i=0;i<3;i++){const s=clamp((t-i*.13)/.68);const x=28+118*ease(s),y=-62+Math.sin(s*Math.PI)*48;K(4,-46,x,y,7);C(x,y,11)}}
  if(m==='sp'){C(0,-50,25+28*e);for(let i=0;i<6;i++){const a=i/6*TAU+t*3;C(Math.cos(a)*55,-50+Math.sin(a)*38,12)}if(t>.55)K(-10,-50,112*ease((t-.55)/.45),-50,18)}
  break;
 case'orange':
  if(m==='us'){const cy=-78*e-28;C(0,cy,27);K(0,-12,0,cy,12)}
  if(m==='ds'){const y=10-88*e;C(0,y,25);K(-30,0,30,0,10);}
  if(m==='ss'){const x=40+128*e;K(12,-48,x,-48,16);C(x,-48,23);}
  if(m==='uh'){const y=-125*e;K(0,-4,0,y,17);C(0,y,27);C(0,y+32,15)}
  if(m==='dh'){C(-45,-48,28);C(45,-48,28);K(-45,-48,45,-48,12)}
  if(m==='sh'){const x=45+135*e;K(18,-48,x,-48,19);C(x,-48,25);}
  if(m==='sp'){C(0,-48,30+35*e);for(let i=0;i<4;i++){const a=i/4*TAU+t*1.5;K(Math.cos(a)*32,-48+Math.sin(a)*22,Math.cos(a)*(80+45*e),-48+Math.sin(a)*(50+20*e),12)}C(0,-48,42+45*e)}
  break;
 case'green':
  if(m==='us'){const y=-25-125*e;B(-30,y-18,60,36);C(0,y,28);K(-28,-5,0,y,11);K(28,-5,0,y,11)}
  if(m==='ds'){P([[-78,0],[-35,-30*e],[-8,-5],[0,-45*e],[8,-5],[35,-30*e],[78,0],[35,15],[-35,15]]);C(0,-18*e,27)}
  if(m==='ss'){const x=18+125*e;K(8,-44,x,-32,18);C(x,-32,26);P([[x-15,-54],[x+25,-42],[x+5,-20],[x-25,-34]])}
  if(m==='uh'){const y=-145*e;B(-34,y-24,68,48);C(0,y,29);P([[20,y+10],[62,y-18],[78,y+8],[35,y+30]])}
  if(m==='dh'){P([[-82,0],[-42,-34*e],[0,-10],[42,-34*e],[82,0],[30,20],[0,8],[-30,20]]);C(0,-8,34+20*e)}
  if(m==='sh'){const x=35+140*e;P([[8,-70],[x-20,-62],[x+12,-42],[x-18,-18],[8,-29]]);C(x,-45,30)}
  if(m==='sp'){P([[10,-72],[80+75*e,-82],[170*e,-48],[95+55*e,-12],[10,-24]]);C(105*e,-48,38)}
  break;
 case'pink':
  if(m==='us'){const y=-40-75*e;C(0,y,26);K(0,-18,0,y,17);for(let i=-1;i<=1;i++)K(i*12,-45,i*20,y,7)}
  if(m==='ds'){C(0,4,38);K(-54,-2,54,-2,11);C(-54,-2,15);C(54,-2,15)}
  if(m==='ss'){const x=38+120*e;C(x,-48,23);K(10,-48,x,-48,11);K(x-4,-65,x+12,-33,8)}
  if(m==='uh'){const r=52+28*e;C(0,-48,r);C(0,-118*e,22);K(0,-48,0,-118*e,11)}
  if(m==='dh'){const y=-118+126*e;C(0,y,23);K(0,y,0,7,14);C(0,7,31)}
  if(m==='sh'){const q=inout(t),x=80*Math.cos(q*Math.PI),y=-48+58*Math.sin(q*Math.PI);C(x,y,23);K(0,-48,x,y,11);C(x*.55,y*.55-25,12)}
  if(m==='sp'){C(0,-48,28+26*e);for(let i=0;i<8;i++){const a=i/8*TAU;C(Math.cos(a)*(38+82*e),-48+Math.sin(a)*(25+66*e),11+4*e)}}
  break;
 case'grey':
  if(m==='us'){B(-34,-12-122*e,68,36);C(0,-130*e,24);B(-24,-42-65*e,48,22)}
  if(m==='ds'){B(-70,-70*e,140,27);B(-38,-52*e,76,20);C(0,-6,28)}
  if(m==='ss'){B(18,-80,55+115*e,54);B(70+60*e,-65,38,24);}
  if(m==='uh'){B(-42,-18-135*e,84,42);P([[-42,-92-50*e],[0,-145*e],[42,-92-50*e],[28,-65],[-28,-65]])}
  if(m==='dh'){B(-72,-78,38,92);B(34,-78,38,92);B(-34,-48,68,48);C(0,-48,28)}
  if(m==='sh'){B(18,-84,60+145*e,72);C(155*e,-48,27);B(65+70*e,-65,32,34)}
  if(m==='sp'){B(-82,-100,164,25);B(-105,-74,25,75);B(80,-74,25,75);C(0,-48,36+72*e);B(-50,-30,100,25)}
  break;
 case'turquoise':
  if(m==='us'){K(-8,-20,0,-118*e,15);C(0,-118*e,24);P([[0,-58],[-34,-92],[-16,-125],[18,-92]])}
  if(m==='ds'){C(0,8,36);K(-28,-8,28,-8,17);C(0,-8,20)}
  if(m==='ss'){const x=14+142*e;K(10,-45,x,-45,14);C(x,-45,29);K(x-15,-60,x+18,-31,10)}
  if(m==='uh'){K(0,-12,0,-135*e,24);K(-20,-86,50,-105,17);C(0,-138*e,27)}
  if(m==='dh'){K(-45,-12,-18,34,20);K(45,-12,18,34,20);C(0,34,34);}
  if(m==='sh'){const x=25+145*e;K(8,-38,x,-27,25);C(x,-27,34);K(x-25,-48,x+25,-8,13)}
  if(m==='sp'){K(8,-50,160*e,-38,32);C(160*e,-38,43);K(35,-64,135*e,-42,17)}
  break;
 case'olive':
  if(m==='us'){K(0,-25,0,-120*e,24+18*e);C(0,-125*e,30+20*e)}
  if(m==='ds'){C(0,-8,25+52*e);B(-48,-12-22*e,96,22+28*e);C(0,-12-30*e,20)}
  if(m==='ss'){const x=18+112*e;K(8,-48,x,-48,19+22*e);C(x,-48,28+25*e)}
  if(m==='uh'){const y=-132*e;K(5,-25,5,y,26+25*e);C(5,y,31+30*e)}
  if(m==='dh'){const y=-112+120*e;C(0,y,22+60*e);K(0,-80+100*e,0,0,20+28*e);C(0,0,35+20*e)}
  if(m==='sh'){const x=45+118*e;C(x,-48,30+42*e);K(12,-48,x,-48,17+22*e);C(x-18,-65,18+18*e)}
  if(m==='sp'){C(0,-48,38+90*e);K(0,-48,0,-108*e,30+24*e);C(0,-108*e,30+35*e)}
  break;
 case'copper':
  if(m==='us'){const y=-20-108*e;B(-25,y-18,50,36);K(0,-28,0,y,12);C(0,y,24)}
  if(m==='ds'){C(0,-2,27);if(t>.28){const q2=ease((t-.28)/.72);C(0,-65*q2,30);K(-25,-5,25,-5,9)}}
  if(m==='ss'){const x=20+120*e;K(8,-48,x,-48,13);C(x,-48,21);if(t>.45)K(8,-48,x,-48,7)}
  if(m==='uh'){const y=-120*e;B(-34,y-20,68,40);C(0,y,27);K(-20,-35,20,y,10)}
  if(m==='dh'){C(0,-5,32);K(-62,-5,62,-5,11);C(-62+124*e,-5,16)}
  if(m==='sh'){const x=22+105*e;K(8,-48,x,-48,15);K(x,-48,x+42*e,-48,15);C(x+42*e,-48,22)}
  if(m==='sp'){C(0,-48,28+105*e);K(-30,-48,30,-48,27);for(let i=0;i<3;i++)C((i-1)*48*e,-48,13);}
  break;
 case'emerald':
  if(m==='us'){K(0,15,0,-118*e,12);C(0,-118*e,23);C(0,-80*e,12)}
  if(m==='ds'){K(0,-78+78*e,0,18,13);C(0,0,35);C(0,-45+45*e,18)}
  if(m==='ss'){K(5,-48,112*e,-48,11);C(112*e,-48,21);K(45*e,-60,112*e,-48,8)}
  if(m==='uh'){K(0,12,0,-120*e,14);K(0,-120*e,0,-20,18);C(0,-120*e,24)}
  if(m==='dh'){C(0,0,28+38*e);K(0,-60*e,0,0,11);C(0,-60*e,17)}
  if(m==='sh'){K(10,-48,110*e,-48,17);C(110*e,-48,26);K(50*e,-48,110*e,-48,9)}
  if(m==='sp'){C(0,-48,30+34*e);K(-20,-48,20,-48,29+28*e);if(t>.4)C(0,-48,48+80*ease((t-.4)/.6));}
  break;
 case'pearl':
  if(m==='us'){K(0,-25,0,-112*e,10);C(0,-112*e,20+15*e)}
  if(m==='ds'){C(0,0,29+48*e);K(-55,-4,55,-4,7);C(-55,-4,13);C(55,-4,13)}
  if(m==='ss'){const s=inout(t),x=132*s,y=-48+28*Math.sin(s*Math.PI);K(8,-48,x,y,11);C(x,y,22);C(x-18,y-20,12)}
  if(m==='uh'){for(let i=0;i<4;i++)C(0,-20-i*25*e,12+i*4);C(0,-120*e,26);K(0,-5,0,-120*e,7)}
  if(m==='dh'){C(0,-5,34+46*e);K(-62,-5,62,-5,8);C(-62*e,-5,14);C(62*e,-5,14)}
  if(m==='sh'){const s=inout(t),x=145*s,y=-48+38*Math.sin(s*TAU);K(8,-48,x,y,12);C(x,y,25);}
  if(m==='sp'){C(0,-48,30+90*e);for(let i=0;i<8;i++){const a=i/8*TAU;C(Math.cos(a)*(38+78*e),-48+Math.sin(a)*(28+58*e),12);}}
  break;
 case'red':
  if(m==='us'){const y=-125*e;K(0,0,0,y,18);C(0,y,29)}
  if(m==='ds'){C(0,-5,29+40*e);for(let i=0;i<6;i++){const a=i/6*TAU;K(Math.cos(a)*22,-5,Math.cos(a)*(58*e+22),-5+Math.sin(a)*(58*e),7)}}
  if(m==='ss'){K(10,-48,112*e,-48,14);C(112*e,-48,20);K(70*e,-62,112*e,-48,8)}
  if(m==='uh'){const r=44+68*e;C(0,-55,r);K(0,-55,0,-4,15);C(0,-55,r+12)}
  if(m==='dh'){C(0,0,29+62*e);K(-65,0,65,0,10);for(let i=-1;i<=1;i++)C(i*45*e,0,14)}
  if(m==='sh'){P([[8,-76],[132*e,-58],[150*e,-34],[8,-17]]);C(132*e,-46,27);K(35,-46,132*e,-46,11)}
  if(m==='sp'){C(20,-48,31+108*e);if(t>.35){const r=35+90*ease((t-.35)/.65);for(let i=0;i<8;i++){const a=i/8*TAU;C(20+Math.cos(a)*r,-48+Math.sin(a)*r*.62,10)}}}
  break;
 case'lavender':
  if(m==='us'){B(-30,-12-108*e,60,28);K(0,-15,0,-108*e,11);C(0,-108*e,21)}
  if(m==='ds'){P([[-20,-8],[0,58*e],[20,-8],[0,-38]]);K(0,-8,0,50*e,9);C(0,52*e,17)}
  if(m==='ss'){P([[8,-70],[128*e,-50],[8,-27]]);K(8,-48,128*e,-48,10);C(128*e,-48,18)}
  if(m==='uh'){B(-44,-18-132*e,88,38);P([[-35,-90*e],[0,-136*e],[35,-90*e]]);C(0,-136*e,25)}
  if(m==='dh'){B(-67,-77,30,80);B(37,-77,30,80);B(-37,-46,74,48);C(0,-46,34+12*e)}
  if(m==='sh'){P([[8,-78],[150*e,-57],[150*e,-34],[8,-18]]);C(150*e,-46,27);K(30,-46,150*e,-46,9)}
  if(m==='sp'){C(0,-48,32+96*e);B(-76,-105,152,27);B(-105,-75,27,58);B(78,-75,27,58);C(0,-48,44+28*e)}
  break;
 case'amber':
  if(m==='us'){K(0,-28,0,-104*e,11);K(0,-104*e,0,-145*e,11);C(0,-145*e,18);C(-24,-72*e,14);C(24,-72*e,14)}
  if(m==='ds'){K(-58*e,-48,58*e,-48,10);C(-58*e,-48,18);C(58*e,-48,18);K(-30*e,-70,30*e,-70,8)}
  if(m==='ss'){K(-92*e,-48,92*e,-48,10);C(-92*e,-48,17);C(92*e,-48,17);C(0,-48,22)}
  if(m==='uh'){for(let i=0;i<4;i++){const yy=-40-i*27*e;K(0,yy,0,yy-23,10);C(0,yy-23,15)}}
  if(m==='dh'){for(let i=0;i<5;i++){const a=i/5*TAU;K(Math.cos(a)*72*e,-48+Math.sin(a)*45*e,0,-48,9);C(Math.cos(a)*72*e,-48+Math.sin(a)*45*e,13)}C(0,-48,25)}
  if(m==='sh'){K(-105*e,-48,0,-48,12);K(0,-48,105*e,-48,12);C(-105*e,-48,18);C(105*e,-48,18);C(0,-48,26)}
  if(m==='sp'){for(let i=0;i<4;i++){const a=i/4*TAU;K(Math.cos(a)*98*e,-48+Math.sin(a)*62*e,0,-48,11);C(Math.cos(a)*98*e,-48+Math.sin(a)*62*e,16)}C(0,-48,38+38*e)}
  break;
 }
 return b;
}

const COLORS={yellow:['#FFD21A','#FFF0A0'],blue:['#3F8CFF','#B7EEFF'],purple:['#8E42D8','#E8B8FF'],orange:['#FF861F','#FFD08A'],green:['#46A84A','#B9F58A'],pink:['#F05AA7','#FFC1E7'],grey:['#9AA0A6','#E6EAEE'],turquoise:['#29C7A4','#A5FFF0'],olive:['#89912B','#D5D96A'],copper:['#C87848','#FFD0A6'],emerald:['#31D77A','#B4FFD2'],pearl:['#E8E5D1','#FFFFFF'],red:['#FF3B24','#FFD08A'],lavender:['#B48BE8','#F0D7FF'],amber:['#FFB52E','#FFF0A8']};

function art(ctx,id,m,t,c,c2){const e=out(t),q=inout(t),a=.95;
 // Each branch is a move-specific visual language; collision shapes in G() occupy the same path.
 if(id==='yellow'){
  if(m==='us'){stroke(ctx,[[-2,-18],[-8,-112*e]],c,15,a);dot(ctx,-8,-112*e,20,c2,a);spark(ctx,-8,-112*e,30,c2,a,8)}
  if(m==='ds'){stroke(ctx,[[-34,-4],[34,-4]],c,18,a);ring(ctx,0,-2,31+18*e,c2,3,.7)}
  if(m==='ss'){stroke(ctx,[[5,-43],[30+90*e,-43]],c,20,a);slash(ctx,45,-60,48,-.55,c2,6,.8);dot(ctx,30+90*e,-43,22,c,a)}
  if(m==='uh'){stroke(ctx,[[-16,-20],[0,-132*e]],c,22,a);stroke(ctx,[[16,-20],[0,-118*e]],c2,12,a);spark(ctx,0,-130*e,35,c2,.8)}
  if(m==='dh'){slash(ctx,-18,-28,62,1.2,c,16,a);slash(ctx,18,-28,62,1.95,c2,13,a);ring(ctx,0,3,34+16*e,c,4,.65)}
  if(m==='sh'){stroke(ctx,[[6,-48],[32+132*e,-48]],c,23,a);stroke(ctx,[[30,-66],[32+132*e,-49]],c2,8,a);spark(ctx,32+132*e,-48,30,c2,a)}
  if(m==='sp'){stroke(ctx,[[0,-48],[20+145*e,-48]],c,32,a);ring(ctx,20+145*e,-48,39+12*e,c2,6,.85);spark(ctx,20+145*e,-48,48,c2,a,10)}
 }
 if(id==='blue'){
  if(m==='us'){const y=-24-120*e;wave(ctx,0,y,34,18,c2,.8);stroke(ctx,[[-26,-15],[0,y],[26,-15]],c,12,a);ring(ctx,0,y,24,c2,4,.8)}
  if(m==='ds'){ring(ctx,0,-5,29+23*e,c,8,.8);for(let i=0;i<5;i++){const aa=-Math.PI/2+i*Math.PI/4;wave(ctx,Math.cos(aa)*35,-5+Math.sin(aa)*24,22,6,c2,.7,i)}}
  if(m==='ss'){stroke(ctx,[[4,-46],[38+125*e,-46]],c,15,a);slash(ctx,38+125*e,-46,38,-.4,c2,5,.8);dot(ctx,38+125*e,-46,18,c2)}
  if(m==='uh'){const y=-20-130*e;for(let i=0;i<3;i++)stroke(ctx,[[-38+i*38,-8],[0,y]],c,i===1?18:11,a*.85);ring(ctx,0,y,27,c2,5,.8)}
  if(m==='dh'){ring(ctx,0,-5,25+76*e,c,13,.75);stroke(ctx,[[-(25+76*e),-5],[(25+76*e),-5]],c2,4,.7)}
  if(m==='sh'){poly(ctx,[[5,-67],[38+138*e-12,-58],[38+138*e+8,-45],[38+138*e-12,-27],[5,-36]],c,a);slash(ctx,38+138*e,-46,42,-.2,c2,5,.9)}
  if(m==='sp'){ring(ctx,0,-48,27+34*e,c,9,.8);for(let i=0;i<8;i++){const aa=i/8*TAU+t*2;stroke(ctx,[[Math.cos(aa)*38,-48+Math.sin(aa)*24],[Math.cos(aa)*(70+55*e),-48+Math.sin(aa)*(45+30*e)]],c2,4,.65)}}
 }
 if(id==='purple'){
  if(m==='us'){const x=-52+104*q,y=-42-62*e;stroke(ctx,[[x,y],[x+30,-8]],c,10,a);slash(ctx,x,y,35,-.8,c2,4,a);dot(ctx,x,y,14,c2)}
  if(m==='ds'){const x=-22+55*e;stroke(ctx,[[-8,-22],[x,-5],[x+30,10]],c,10,a);for(let i=0;i<5;i++)slash(ctx,x+10,0+i*2,28,-.8+i*.35,c2,2,.5)}
  if(m==='ss'){const x=34+118*e;stroke(ctx,[[8,-48],[x,-30]],c,9,a);slash(ctx,x,-30,30,-.45,c2,4,a);dot(ctx,x,-30,13,c2)}
  if(m==='uh'){const x=58-112*q,y=-55-72*e;stroke(ctx,[[x,y],[x-30,-5]],c,10,a);slash(ctx,x,y,44,-1.1,c2,5,a);spark(ctx,x,y,22,c2,a)}
  if(m==='dh'){const y=-92+94*e;stroke(ctx,[[-8,y],[20,y+45]],c,11,a);slash(ctx,20,y+45,30,.8,c2,4,a);}
  if(m==='sh'){for(let i=0;i<3;i++){const s=clamp((t-i*.13)/.68),x=28+118*ease(s),y=-62+Math.sin(s*Math.PI)*48;stroke(ctx,[[4,-46],[x,y]],c,8,a*(1-i*.15));slash(ctx,x,y,28,-.6,c2,3,a)}}
  if(m==='sp'){ring(ctx,0,-50,25+28*e,c,6,.8);for(let i=0;i<6;i++){const aa=i/6*TAU+t*3;slash(ctx,Math.cos(aa)*55,-50+Math.sin(aa)*38,30,aa,c2,4,.8)}}
 }
 if(id==='orange'){
  if(m==='us'){const cy=-78*e-28;portal(ctx,0,cy,28,c,.9);stroke(ctx,[[0,-12],[0,cy]],c2,10,a)}
  if(m==='ds'){const y=10-88*e;portal(ctx,0,y,25,c,.9);slash(ctx,0,y,50,Math.PI/2,c2,5,.8)}
  if(m==='ss'){const x=40+128*e;portal(ctx,18,-48,20,c,.7);stroke(ctx,[[12,-48],[x,-48]],c2,16,a);portal(ctx,x,-48,24,c,.95)}
  if(m==='uh'){const y=-125*e;stroke(ctx,[[0,-4],[0,y]],c,16,a);portal(ctx,0,y,28,c2,.9);dot(ctx,0,y+32,15,c)}
  if(m==='dh'){portal(ctx,-45,-48,28,c,.9);portal(ctx,45,-48,28,c2,.9);stroke(ctx,[[-45,-48],[45,-48]],c,10,.7)}
  if(m==='sh'){const x=45+135*e;portal(ctx,18,-48,21,c,.8);stroke(ctx,[[18,-48],[x,-48]],c2,18,a);portal(ctx,x,-48,25,c,.95);spark(ctx,x,-48,30,c2,a)}
  if(m==='sp'){portal(ctx,0,-48,31+35*e,c,.9);for(let i=0;i<4;i++){const aa=i/4*TAU+t*1.5;stroke(ctx,[[Math.cos(aa)*32,-48+Math.sin(aa)*22],[Math.cos(aa)*(80+45*e),-48+Math.sin(aa)*(50+20*e)]],c2,7,.75)}}
 }
 if(id==='green'){
  if(m==='us'){const y=-25-125*e;poly(ctx,[[-30,y-18],[30,y-18],[30,y+18],[-30,y+18]],c,a);ring(ctx,0,y,28,c2,4,.8);stroke(ctx,[[-28,-5],[0,y],[28,-5]],c2,7,.75)}
  if(m==='ds'){poly(ctx,[[-78,0],[-35,-30*e],[-8,-5],[0,-45*e],[8,-5],[35,-30*e],[78,0],[35,15],[-35,15]],c,a);stroke(ctx,[[-55,0],[0,-22*e],[55,0]],c2,5,.7)}
  if(m==='ss'){const x=18+125*e;poly(ctx,[[8,-44],[x,-32],[x+15,-18],[x-15,-8],[8,-24]],c,a);dot(ctx,x,-32,25,c2,.8)}
  if(m==='uh'){const y=-145*e;poly(ctx,[[-34,y-24],[34,y-24],[34,y+24],[-34,y+24]],c,a);poly(ctx,[[20,y+10],[62,y-18],[78,y+8],[35,y+30]],c2,.8);ring(ctx,0,y,29,c2,4,.8)}
  if(m==='dh'){poly(ctx,[[-82,0],[-42,-34*e],[0,-10],[42,-34*e],[82,0],[30,20],[0,8],[-30,20]],c,a);ring(ctx,0,-8,34+20*e,c2,4,.7)}
  if(m==='sh'){const x=35+140*e;poly(ctx,[[8,-70],[x-20,-62],[x+12,-42],[x-18,-18],[8,-29]],c,a);poly(ctx,[[x-10,-52],[x+20,-45],[x,-25]],c2,.75)}
  if(m==='sp'){poly(ctx,[[10,-72],[80+75*e,-82],[170*e,-48],[95+55*e,-12],[10,-24]],c,a);ring(ctx,105*e,-48,38,c2,5,.8);spark(ctx,105*e,-48,48,c2,a,10)}
 }
 if(id==='pink'){
  if(m==='us'){const y=-40-75*e;dot(ctx,0,y,26,c,.85);stroke(ctx,[[0,-18],[0,y]],c2,12,a);for(let i=-1;i<=1;i++)stroke(ctx,[[i*12,-45],[i*20,y]],c,5,.7)}
  if(m==='ds'){ring(ctx,0,4,38,c,5,.8);stroke(ctx,[[-54,-2],[54,-2]],c2,12,a);dot(ctx,-54,-2,15,c2);dot(ctx,54,-2,15,c2)}
  if(m==='ss'){const x=38+120*e;dot(ctx,x,-48,23,c,a);stroke(ctx,[[10,-48],[x,-48]],c2,11,a);ring(ctx,x,-48,30,c2,3,.7)}
  if(m==='uh'){const r=52+28*e;ring(ctx,0,-48,r,c,9,.8);dot(ctx,0,-118*e,22,c2);stroke(ctx,[[0,-48],[0,-118*e]],c2,8,.75)}
  if(m==='dh'){const y=-118+126*e;dot(ctx,0,y,23,c,a);stroke(ctx,[[0,y],[0,7]],c2,13,a);ring(ctx,0,7,31,c2,4,.7)}
  if(m==='sh'){const q2=inout(t),x=80*Math.cos(q2*Math.PI),y=-48+58*Math.sin(q2*Math.PI);stroke(ctx,[[0,-48],[x,y]],c2,10,a);dot(ctx,x,y,23,c,a);ring(ctx,x,y,32,c2,3,.65)}
  if(m==='sp'){ring(ctx,0,-48,28+26*e,c,7,.8);for(let i=0;i<8;i++){const aa=i/8*TAU;stroke(ctx,[[Math.cos(aa)*38,-48+Math.sin(aa)*25],[Math.cos(aa)*(120*e),-48+Math.sin(aa)*(91*e)]],c2,4,.65)}}
 }
 if(id==='grey'){
  if(m==='us'){const y=-12-122*e;poly(ctx,[[-34,y], [34,y],[34,y+36],[-34,y+36]],c,a);ring(ctx,0,y+18,25,c2,3,.7)}
  if(m==='ds'){poly(ctx,[[-70,-70*e],[70,-70*e],[70,-43*e],[-70,-43*e]],c,a);stroke(ctx,[[-38,-52*e],[38,-52*e]],c2,6,.8)}
  if(m==='ss'){poly(ctx,[[18,-80],[73+115*e,-80],[73+115*e,-26],[18,-26]],c,a);poly(ctx,[[70+60*e,-65],[108+60*e,-65],[108+60*e,-41],[70+60*e,-41]],c2,.8)}
  if(m==='uh'){const y=-18-135*e;poly(ctx,[[-42,y],[42,y],[42,y+42],[-42,y+42]],c,a);poly(ctx,[[-42,-92-50*e],[0,-145*e],[42,-92-50*e],[28,-65],[-28,-65]],c2,.65)}
  if(m==='dh'){poly(ctx,[[-72,-78],[-34,-78],[-34,14],[-72,14]],c,a);poly(ctx,[[34,-78],[72,-78],[72,14],[34,14]],c,a);poly(ctx,[[-34,-48],[34,-48],[34,0],[-34,0]],c2,.75)}
  if(m==='sh'){poly(ctx,[[18,-84],[78+145*e,-84],[78+145*e,-12],[18,-12]],c,a);dot(ctx,155*e,-48,27,c2,.8);stroke(ctx,[[78,-65],[155*e,-65]],c2,4,.6)}
  if(m==='sp'){poly(ctx,[[-82,-100],[82,-100],[82,-75],[-82,-75]],c,a);poly(ctx,[[-105,-74],[-80,-74],[-80,1],[-105,1]],c,a);poly(ctx,[[80,-74],[105,-74],[105,1],[80,1]],c,a);ring(ctx,0,-48,36+72*e,c2,7,.8);poly(ctx,[[-50,-30],[50,-30],[50,-5],[-50,-5]],c2,.45)}
 }
 if(id==='turquoise'){
  if(m==='us'){const y=-118*e;stroke(ctx,[[-8,-20],[0,y]],c,14,a);poly(ctx,[[0,-58],[-34,-92],[-16,-125],[18,-92]],c2,.8);spark(ctx,0,y,28,c2,a)}
  if(m==='ds'){dot(ctx,0,8,36,c,.85);stroke(ctx,[[-28,-8],[28,-8]],c2,18,a);ring(ctx,0,-8,20,c2,3,.7)}
  if(m==='ss'){const x=14+142*e;stroke(ctx,[[10,-45],[x,-45]],c,14,a);dot(ctx,x,-45,29,c2);stroke(ctx,[[x-15,-60],[x+18,-31]],c2,8,.8)}
  if(m==='uh'){stroke(ctx,[[0,-12],[0,-135*e]],c,24,a);stroke(ctx,[[-20,-86],[50,-105]],c2,16,a);dot(ctx,0,-138*e,27,c)}
  if(m==='dh'){stroke(ctx,[[-45,-12],[-18,34]],c,20,a);stroke(ctx,[[45,-12],[18,34]],c2,20,a);dot(ctx,0,34,34,c,.8)}
  if(m==='sh'){const x=25+145*e;stroke(ctx,[[8,-38],[x,-27]],c,25,a);dot(ctx,x,-27,34,c2);stroke(ctx,[[x-25,-48],[x+25,-8]],c2,9,.8)}
  if(m==='sp'){const x=160*e;stroke(ctx,[[8,-50],[x,-38]],c,32,a);dot(ctx,x,-38,43,c2);stroke(ctx,[[35,-64],[x-25,-42]],c2,13,.7)}
 }
 if(id==='olive'){
  if(m==='us'){const y=-120*e;stroke(ctx,[[0,-25],[0,y]],c,24,a);dot(ctx,0,y,30+20*e,c2);ring(ctx,0,y,45,c2,4,.7)}
  if(m==='ds'){dot(ctx,0,-8,25+52*e,c,a);poly(ctx,[[-48,-12-22*e],[48,-12-22*e],[48,10],[-48,10]],c2,.65);ring(ctx,0,-35*e,30,c2,3,.7)}
  if(m==='ss'){const x=18+112*e;stroke(ctx,[[8,-48],[x,-48]],c,19+22*e,a);dot(ctx,x,-48,28+25*e,c2);ring(ctx,x,-48,40,c2,3,.65)}
  if(m==='uh'){const y=-132*e;stroke(ctx,[[5,-25],[5,y]],c,26+25*e,a);dot(ctx,5,y,31+30*e,c2);ring(ctx,5,y,48,c2,4,.65)}
  if(m==='dh'){const y=-112+120*e;dot(ctx,0,y,22+60*e,c,a);stroke(ctx,[[0,-80+100*e],[0,0]],c2,20+28*e,a);ring(ctx,0,0,35+20*e,c2,4,.65)}
  if(m==='sh'){const x=45+118*e;stroke(ctx,[[12,-48],[x,-48]],c,17+22*e,a);dot(ctx,x,-48,30+42*e,c2);dot(ctx,x-18,-65,18+18*e,c2,.7)}
  if(m==='sp'){const r=38+90*e;ring(ctx,0,-48,r,c,10,.85);stroke(ctx,[[0,-48],[0,-108*e]],c2,24+20*e,.9);dot(ctx,0,-108*e,30+35*e,c2)}
 }
 if(id==='copper'){
  if(m==='us'){const y=-20-108*e;poly(ctx,[[-25,y-18],[25,y-18],[25,y+18],[-25,y+18]],c,a);stroke(ctx,[[0,-28],[0,y]],c2,10,a);ring(ctx,0,y,24,c2,3,.7)}
  if(m==='ds'){dot(ctx,0,-2,27,c,a);if(t>.28){const q2=ease((t-.28)/.72);ring(ctx,0,-65*q2,30,c2,4,.8);stroke(ctx,[[-25,-5],[25,-5]],c2,7,.7)}}
  if(m==='ss'){const x=20+120*e;stroke(ctx,[[8,-48],[x,-48]],c,15,a);dot(ctx,x,-48,21,c2);if(t>.45)stroke(ctx,[[8,-48],[x,-48]],c2,6,.8)}
  if(m==='uh'){const y=-120*e;poly(ctx,[[-34,y-20],[34,y-20],[34,y+20],[-34,y+20]],c,a);ring(ctx,0,y,27,c2,4,.8);stroke(ctx,[[-20,-35],[20,y]],c2,7,.65)}
  if(m==='dh'){stroke(ctx,[[-62,-5],[62,-5]],c,11,a);dot(ctx,-62+124*e,-5,16,c2);ring(ctx,0,-5,32,c2,3,.7)}
  if(m==='sh'){const x=22+105*e;stroke(ctx,[[8,-48],[x,-48],[x+42*e,-48]],c,15,a);dot(ctx,x+42*e,-48,22,c2);ring(ctx,x,-48,20,c2,2,.7)}
  if(m==='sp'){ring(ctx,0,-48,28+105*e,c,10,.8);for(let i=0;i<3;i++)dot(ctx,(i-1)*48*e,-48,13,c2,.8)}
 }
 if(id==='emerald'){
  if(m==='us'){stroke(ctx,[[0,15],[0,-118*e]],c,12,a);dot(ctx,0,-118*e,23,c2);dot(ctx,0,-80*e,12,c2,.6)}
  if(m==='ds'){stroke(ctx,[[0,-78+78*e],[0,18]],c,13,a);dot(ctx,0,0,35,c2,.8);ring(ctx,0,-45+45*e,18,c2,3,.7)}
  if(m==='ss'){stroke(ctx,[[5,-48],[112*e,-48]],c,11,a);dot(ctx,112*e,-48,21,c2);stroke(ctx,[[45*e,-60],[112*e,-48]],c2,6,.7)}
  if(m==='uh'){stroke(ctx,[[0,12],[0,-120*e],[0,-20]],c,16,a);dot(ctx,0,-120*e,24,c2);ring(ctx,0,-70*e,30,c2,3,.6)}
  if(m==='dh'){dot(ctx,0,0,28+38*e,c,a);stroke(ctx,[[0,-60*e],[0,0]],c2,11,a);dot(ctx,0,-60*e,17,c2)}
  if(m==='sh'){stroke(ctx,[[10,-48],[110*e,-48]],c,17,a);dot(ctx,110*e,-48,26,c2);stroke(ctx,[[50*e,-48],[110*e,-48]],c2,6,.7)}
  if(m==='sp'){ring(ctx,0,-48,30+34*e,c,8,.8);ring(ctx,0,-48,48+80*e,c2,4,.7);dot(ctx,0,-48,15,c2)}
 }
 if(id==='pearl'){
  if(m==='us'){stroke(ctx,[[0,-25],[0,-112*e]],c,10,a);dot(ctx,0,-112*e,20+15*e,c2);for(let i=1;i<4;i++)ring(ctx,0,-112*e,20+i*12,c2,2,.4)}
  if(m==='ds'){ring(ctx,0,0,29+48*e,c,7,.75);stroke(ctx,[[-55,-4],[55,-4]],c2,5,.75);dot(ctx,-55,-4,13,c2);dot(ctx,55,-4,13,c2)}
  if(m==='ss'){const s=inout(t),x=132*s,y=-48+28*Math.sin(s*Math.PI);stroke(ctx,[[8,-48],[x,y]],c,11,a);dot(ctx,x,y,22,c2);ring(ctx,x,y,31,c2,3,.65)}
  if(m==='uh'){for(let i=0;i<4;i++){const yy=-20-i*25*e;dot(ctx,0,yy,12+i*4,c2,.8);ring(ctx,0,yy,18+i*6,c,2,.5)}stroke(ctx,[[0,-5],[0,-120*e]],c,7,.7)}
  if(m==='dh'){ring(ctx,0,-5,34+46*e,c,8,.8);stroke(ctx,[[-62,-5],[62,-5]],c2,6,.75);dot(ctx,-62*e,-5,14,c2);dot(ctx,62*e,-5,14,c2)}
  if(m==='sh'){const s=inout(t),x=145*s,y=-48+38*Math.sin(s*TAU);stroke(ctx,[[8,-48],[x,y]],c,12,a);dot(ctx,x,y,25,c2);wave(ctx,x,y,25,6,c2,.7,s*TAU)}
  if(m==='sp'){ring(ctx,0,-48,30+90*e,c,8,.8);for(let i=0;i<8;i++){const aa=i/8*TAU;stroke(ctx,[[Math.cos(aa)*38,-48+Math.sin(aa)*28],[Math.cos(aa)*(116*e),-48+Math.sin(aa)*(86*e)]],c2,4,.65)}}
 }
 if(id==='red'){
  if(m==='us'){const y=-125*e;stroke(ctx,[[0,0],[0,y]],c,18,a);flame(ctx,0,y,29,c,a);ring(ctx,0,y,40,c2,4,.7)}
  if(m==='ds'){ring(ctx,0,-5,29+40*e,c,9,.8);for(let i=0;i<6;i++){const aa=i/6*TAU;flame(ctx,Math.cos(aa)*(22+58*e),-5+Math.sin(aa)*(58*e),10,c2,.7,aa)}}
  if(m==='ss'){stroke(ctx,[[10,-48],[112*e,-48]],c,14,a);flame(ctx,112*e,-48,20,c2,a,-.2);slash(ctx,65*e,-60,40,-.5,c2,5,.7)}
  if(m==='uh'){const r=44+68*e;ring(ctx,0,-55,r,c,15,.85);for(let i=0;i<8;i++)flame(ctx,Math.cos(i/8*TAU)*r,-55+Math.sin(i/8*TAU)*r,11,c2,.8,i/8*TAU)}
  if(m==='dh'){ring(ctx,0,0,29+62*e,c,11,.8);stroke(ctx,[[-65,0],[65,0]],c2,8,.8);for(let i=-1;i<=1;i++)flame(ctx,i*45*e,0,14,c2,.8,i*.4)}
  if(m==='sh'){poly(ctx,[[8,-76],[132*e,-58],[150*e,-34],[8,-17]],c,a);flame(ctx,132*e,-46,27,c2,a,-.2);stroke(ctx,[[35,-46],[132*e,-46]],c2,7,.7)}
  if(m==='sp'){dot(ctx,20,-48,31+108*e,c,a);flame(ctx,20,-48,22+70*e,c2,.85);if(t>.35){const r=35+90*ease((t-.35)/.65);ring(ctx,20,-48,r,c2,7,.8);for(let i=0;i<8;i++)flame(ctx,20+Math.cos(i/8*TAU)*r,-48+Math.sin(i/8*TAU)*r*.62,9,c2,.7)}}
 }
 if(id==='lavender'){
  if(m==='us'){const y=-108*e;poly(ctx,[[-30,y-14],[30,y-14],[30,y+14],[-30,y+14]],c,a);stroke(ctx,[[0,-15],[0,y]],c2,9,a);ring(ctx,0,y,21,c2,3,.7)}
  if(m==='ds'){poly(ctx,[[-20,-8],[0,58*e],[20,-8],[0,-38]],c,a);stroke(ctx,[[0,-8],[0,50*e]],c2,6,a)}
  if(m==='ss'){poly(ctx,[[8,-70],[128*e,-50],[8,-27]],c,a);stroke(ctx,[[8,-48],[128*e,-48]],c2,5,.8);spark(ctx,128*e,-48,25,c2,.7)}
  if(m==='uh'){const y=-132*e;poly(ctx,[[-44,y-19],[44,y-19],[44,y+19],[-44,y+19]],c,a);poly(ctx,[[-35,-90*e],[0,-136*e],[35,-90*e]],c2,.8);ring(ctx,0,y,25,c2,3,.8)}
  if(m==='dh'){poly(ctx,[[-67,-77],[-37,-77],[-37,3],[-67,3]],c,a);poly(ctx,[[37,-77],[67,-77],[67,3],[37,3]],c,a);poly(ctx,[[-37,-46],[37,-46],[37,2],[-37,2]],c2,.75)}
  if(m==='sh'){poly(ctx,[[8,-78],[150*e,-57],[150*e,-34],[8,-18]],c,a);stroke(ctx,[[30,-46],[150*e,-46]],c2,6,.8);spark(ctx,150*e,-46,30,c2,.8)}
  if(m==='sp'){ring(ctx,0,-48,32+96*e,c,8,.8);poly(ctx,[[-76,-105],[76,-105],[76,-78],[-76,-78]],c2,.55);poly(ctx,[[-105,-75],[-78,-75],[-78,-17],[-105,-17]],c2,.55);poly(ctx,[[78,-75],[105,-75],[105,-17],[78,-17]],c2,.55)}
 }
 if(id==='amber'){
  if(m==='us'){stroke(ctx,[[0,-28],[0,-104*e],[0,-145*e]],c,11,a);dot(ctx,0,-145*e,18,c2);dot(ctx,-24,-72*e,14,c2,.7);dot(ctx,24,-72*e,14,c2,.7)}
  if(m==='ds'){stroke(ctx,[[-58*e,-48],[58*e,-48]],c,10,a);dot(ctx,-58*e,-48,18,c2);dot(ctx,58*e,-48,18,c2);stroke(ctx,[[-30*e,-70],[30*e,-70]],c2,6,.65)}
  if(m==='ss'){stroke(ctx,[[-92*e,-48],[92*e,-48]],c,10,a);dot(ctx,-92*e,-48,17,c2);dot(ctx,92*e,-48,17,c2);dot(ctx,0,-48,22,c2,.7)}
  if(m==='uh'){for(let i=0;i<4;i++){const yy=-40-i*27*e;stroke(ctx,[[0,yy],[0,yy-23]],c,10,a);dot(ctx,0,yy-23,15,c2)}}
  if(m==='dh'){for(let i=0;i<5;i++){const aa=i/5*TAU;stroke(ctx,[[Math.cos(aa)*72*e,-48+Math.sin(aa)*45*e],[0,-48]],c,9,a*.85);dot(ctx,Math.cos(aa)*72*e,-48+Math.sin(aa)*45*e,13,c2)}}
  if(m==='sh'){stroke(ctx,[[-105*e,-48],[0,-48],[105*e,-48]],c,12,a);dot(ctx,-105*e,-48,18,c2);dot(ctx,105*e,-48,18,c2);ring(ctx,0,-48,27,c2,3,.65)}
  if(m==='sp'){for(let i=0;i<4;i++){const aa=i/4*TAU;stroke(ctx,[[Math.cos(aa)*98*e,-48+Math.sin(aa)*62*e],[0,-48]],c,10,.9);dot(ctx,Math.cos(aa)*98*e,-48+Math.sin(aa)*62*e,16,c2)}ring(ctx,0,-48,38+38*e,c2,7,.8)}
 }
}

export function drawGen5Attack(ctx,x,y,color,p,facing,charId,move){const id=charId.startsWith('g5_')?charId.slice(3):charId;const cc=COLORS[id]||[color||'#FFF','#FFF'];facingWrap(ctx,x,y,facing,local=>{art(local,id,move,p,cc[0],cc[1]);after(local,G(id,move,p),cc[0],cc[1],p)})}
export function drawGen5Super(ctx,x,y,p,facing,charId){drawGen5Attack(ctx,x,y,null,p,facing,charId,'sp')}
function mirror(bs,f){return bs.map(h=>{if(h.shape==='circle'||h.shape==='box')return {...h,x:h.x*f};if(h.shape==='capsule')return {...h,x1:h.x1*f,x2:h.x2*f};if(h.shape==='polygon')return {...h,points:h.points.map(([x,y])=>[x*f,y])};return h})}
export function getGen5Hitboxes(charId,move,t,facing=1){const id=charId.startsWith('g5_')?charId.slice(3):charId;return mirror(G(id,move,t),facing<0?-1:1)}
export const GEN5_ATTACK_NAMES={
 yellow:['Enhanced Uppercut','Reinforced Stance','Power Step','Maximum Jump','Ground Breaker','Overdrive Punch','Limit Break'],
 blue:['Water Lift','Ice Drop','Pressure Stream','Water Spiral','Tidal Crush','Ice Ram','Pressure Core'],
 purple:['Shadow Flip','Vanish Sweep','Ninja Dash','Sky Assassin','Smoke Drop','Crescent Rush','Phantom Strike'],
 orange:['Portal Launch','Drop Portal','Portal Punch','Portal Loop','Portal Trap','Redirect','Portal Collapse'],
 green:['Earth Lift','Ground Buckle','Rock Fist','Earth Column','Fault Line','Boulder Arm','Mountain Fist'],
 pink:['Lift','Pin','Throw','Orbit','Slam','Redirect','Psychic Crush'],
 grey:['Rising Wall','Wall Drop','Wall Push','Tower Wall','Wall Cage','Moving Fortress','Absolute Fortress'],
 turquoise:['Hawk Form','Boulder Form','Stretch Punch','Serpent Rise','Hammer Form','Beast Charge','Chimera Form'],
 olive:['Growth Jump','Shrink Trap','Giant Hand','Giant Step','Growing Hammer','Size Shift','Colossal Growth'],
 copper:['Time Skip','Delayed Impact','Rewind Strike','Stolen Second','Time Anchor','Time Loop','Zero Second'],
 emerald:['Phase Rise','Phase Drop','Ghost Step','Phase Dive','Solid Point','Phase Break','Matter Break'],
 pearl:['Echo Ping','Ground Echo','Heartbeat Read','Echo Column','Resonant Ground','Tracking Wave','Perfect Echo'],
 red:['Flame Pillar','Fire Ring','Fireball','Inferno Wheel','Flame Burst','Fire Wave','Solar Burst'],
 lavender:['Air Step','Air Spike','Air Blade','Sky Platform','Air Cage','Air Ram','Invisible Fortress'],
 amber:['Clone Launch','Cross Step','Passing Strike','Clone Ladder','Clone Collapse','Pincer','Perfect Replication']
};
