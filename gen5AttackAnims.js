// Generation V authored attack animation + hitbox system.
// The collision geometry is generated from the same local shapes used by the
// renderer, so visual direction and hitbox direction stay synchronized.
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>t*t*(3-2*t);
const out=t=>ease(clamp(t));
const inout=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function glow(c,b=18){this.shadowColor=c;this.shadowBlur=b;}
function facingWrap(ctx,x,y,f,fn){ctx.save();ctx.translate(x,y);ctx.scale(f<0?-1:1,1);fn(ctx);ctx.restore();}
function stroke(ctx,pts,c,w,a=1){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();ctx.restore();}
function poly(ctx,pts,c,a=.9){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fill();ctx.restore();}
function ring(ctx,x,y,r,c,w=4,a=.7){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
function dot(ctx,x,y,r,c,a=.8){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function lineEffect(ctx,x1,y1,x2,y2,c,w=3,a=.6){stroke(ctx,[[x1,y1],[x2,y2]],c,w,a);}

// Shapes: circle, box, capsule, polygon. All coordinates are fighter-local.
function G(id,m,t){
 const e=out(t), q=inout(t), b=[];
 const C=(x,y,r)=>b.push({shape:'circle',x,y,r});
 const B=(x,y,w,h)=>b.push({shape:'box',x,y,w,h});
 const K=(x1,y1,x2,y2,r)=>b.push({shape:'capsule',x1,y1,x2,y2,r});
 const P=points=>b.push({shape:'polygon',points});
 switch(id){
 case'yellow':
  if(m==='us'){K(0,-30,-8,-115*e,13);C(-8,-115*e,18+10*e);}
  else if(m==='ds'){C(0,-8,30+24*e);K(-25,0,25,0,10+8*e);}
  else if(m==='ss'){const x=22+68*e;K(8,-35,x,-18,15);C(x,-18,20);}
  else if(m==='uh'){K(0,-20,0,-135*e,24);C(0,-80*e,30);}
  else if(m==='dh'){K(-8,-22,-28,8,16);K(8,-22,28,8,16);C(0,2,45*e);}
  else if(m==='sh'){const x=28+125*e;K(8,-48,x,-48,20+10*e);C(x,-48,24);}
  else if(m==='sp'){const x=35+150*e;K(5,-48,x,-48,30+12*e);C(x,-48,38+20*e);}
  break;
 case'blue':
  if(m==='us'){const h=125*e;B(-25,-8-h,50,35);C(0,-h,28);K(-22,-8,22,-h,13);}
  else if(m==='ds'){C(0,-5,32+18*e);for(let i=0;i<5;i++)P([[Math.cos(i*1.25)*12,-5],[Math.cos(i*1.25)*45,-5-Math.abs(Math.sin(i*1.25))*30*e],[Math.cos(i*1.25)*28,18]]);}
  else if(m==='ss'){const x=38+105*e;K(10,-48,x,-48,9);C(x,-48,12);}
  else if(m==='uh'){const h=125*e;K(-35,-8,0,-h,24);K(35,-8,0,-h,24);for(let i=0;i<4;i++){const a=-1.1+i*.75+e*.9;C(Math.cos(a)*62,-h+Math.sin(a)*42,13);}}
  else if(m==='dh'){const r=28+70*e;C(0,-5,r);K(-r,-5,0,5,13);K(0,5,r,-5,13);}
  else if(m==='sh'){const x=35+125*e;P([[10,-70],[x,-50],[x,-25],[10,-38]]);C(x,-38,22);}
  else if(m==='sp'){C(28,-48,28+62*e);if(t>.55)C(28,-48,38+80*out((t-.55)/.45));}
  break;
 case'purple':
  if(m==='us'){const q=inout(t),x=-35+70*q,y=-75-55*e;K(x,y,x+22,-25,13);}
  else if(m==='ds'){const x=-18+36*e;K(x,-18,x+58,-8,12);C(x+58,-8,17);}
  else if(m==='ss'){const x=28+95*e;K(5,-45,x,-32,8);C(x,-32,12);}
  else if(m==='uh'){const q=inout(t),x=55-95*q,y=-70-65*e;K(x,y,x-28,-20,10);C(x,y,14);}
  else if(m==='dh'){const y=-15+105*e;K(0,y,18,y+45,12);C(18,y+45,16);}
  else if(m==='sh'){for(let i=0;i<3;i++){const q=clamp((t-i*.12)/.68),x=25+95*q,y=-70+Math.sin(q*Math.PI)*48;K(5,-48,x,y,7);C(x,y,11);}}
  else if(m==='sp'){C(0,-48,24+35*e);if(t>.25){for(let i=0;i<5;i++){const a=i/5*TAU+t*2;C(Math.cos(a)*65,-48+Math.sin(a)*48,14);}}if(t>.65)K(0,-48,105*out((t-.65)/.35),-48,22);}
  break;
 case'orange':
  if(m==='us'){C(0,-18,42*e+18);K(0,-20,0,-120*e,15);}
  else if(m==='ds'){C(0,25,26);C(0,-80*e,24);K(0,-65*e,0,20,10);}
  else if(m==='ss'){K(18,-48,105*e+18,-48,17);C(105*e+18,-48,18);}
  else if(m==='uh'){K(0,0,0,-115*e,18);C(0,-115*e,28);}
  else if(m==='dh'){C(-55,-45,30);C(55,-45,30);K(-55,-45,55,-45,18);}
  else if(m==='sh'){const x=45+130*e;B(28,-78,52,60);K(x,-48,x+35,-48,20);C(x+35,-48,24);}
  else if(m==='sp'){for(let i=0;i<6;i++){const a=i/6*TAU+t*1.5;C(Math.cos(a)*55,-48+Math.sin(a)*40,20);}if(t>.55)C(0,-48,35+100*out((t-.55)/.45));}
  break;
 case'green':
  if(m==='us'){const h=125*e;B(-35,-5-h,70,40);C(0,-h,28);}
  else if(m==='ds'){P([[-75,0],[-25,-45*e],[0,0],[-25,20],[25,20],[0,0],[25,-45*e],[75,0]]);C(0,-25*e,24);}
  else if(m==='ss'){K(12,-45,88*e,-32,20);C(88*e,-32,23);}
  else if(m==='uh'){const h=145*e;B(-38,-5-h,76,55);P([[30,-h],[75,-h-30*e],[90,-h+8],[35,-h+28]]);C(72,-h,25);}
  else if(m==='dh'){P([[-75,0],[-30,-35*e],[0,-10],[30,-35*e],[75,0],[30,18],[0,8],[-30,18]]);C(0,-8,38*e);}
  else if(m==='sh'){P([[10,-70],[135*e,-55],[155*e,-25],[45*e,-10],[10,-30]]);C(140*e,-40,28);}
  else if(m==='sp'){P([[20,-70],[95*e,-105],[165*e,-48],[100*e,8],[20,-20]]);C(110*e,-48,38);}
  break;
 case'pink':
  if(m==='us'){C(0,-85*e,30);K(0,-35,0,-85*e,18);}
  else if(m==='ds'){C(0,5,40);K(-50,0,50,0,12);}
  else if(m==='ss'){const x=40+105*e;C(x,-48,24);K(15,-48,x,-48,12);}
  else if(m==='uh'){const r=55+35*e;C(0,-48,r);C(0,-115*e,22);K(0,-48,0,-115*e,12);}
  else if(m==='dh'){C(0,-120+120*e,22);K(0,-120+120*e,0,8,13);C(0,8,30);}
  else if(m==='sh'){const q=inout(t),x=65*Math.cos(q*Math.PI),y=-48+55*Math.sin(q*Math.PI);C(x,y,23);K(0,-48,x,y,12);}
  else if(m==='sp'){C(0,-48,28+25*e);if(t>.25){for(let i=0;i<8;i++){const a=i/8*TAU;C(Math.cos(a)*(25+85*e),-48+Math.sin(a)*(20+65*e),13);}}}
  break;
 case'grey':
  if(m==='us'){B(-35,-8-120*e,70,36);C(0,-120*e,24);}
  else if(m==='ds'){B(-65,-70*e,130,28);C(0,-10,30);}
  else if(m==='ss'){B(20,-75,42+105*e,50);B(20+105*e,-75,20,50);}
  else if(m==='uh'){B(-42,-8-135*e,84,42);P([[-42,-100],[0,-135],[42,-100],[30,-70],[-30,-70]]);}
  else if(m==='dh'){B(-70,-75,38,90);B(32,-75,38,90);B(-32,-50,64,45);}
  else if(m==='sh'){B(20,-85,55+135*e,75);C(155*e,-48,26);}
  else if(m==='sp'){B(-85,-105,170,28);B(-105,-75,28,95);B(77,-75,28,95);C(0,-48,35+90*e);}
  break;
 case'turquoise':
  if(m==='us'){K(-8,-20,0,-115*e,15);C(0,-115*e,24);P([[0,-65],[-35,-90],[-20,-120],[15,-95]]);}
  else if(m==='ds'){C(0,15,38);K(-25,-8,25,-8,18);}
  else if(m==='ss'){K(10,-45,125*e,-45,13);C(125*e,-45,27);}
  else if(m==='uh'){K(0,-15,0,-130*e,25);K(-20,-85,50,-105,18);}
  else if(m==='dh'){K(-40,-15,-20,35,22);K(40,-15,20,35,22);C(0,30,34);}
  else if(m==='sh'){K(10,-35,145*e,-25,26);C(145*e,-25,32);}
  else if(m==='sp'){K(10,-50,155*e,-38,34);C(155*e,-38,44);}
  break;
 case'olive':
  if(m==='us'){K(0,-25,0,-115*e,25+22*e);C(0,-115*e,30+22*e);}
  else if(m==='ds'){C(0,-5,25+50*e);B(-45,-10-25*e,90,20+30*e);}
  else if(m==='ss'){K(12,-48,95*e,-48,20+25*e);C(95*e,-48,28+20*e);}
  else if(m==='uh'){K(5,-30,5,-130*e,25+28*e);C(5,-130*e,30+28*e);}
  else if(m==='dh'){C(0,-110+120*e,20+65*e);K(0,-90+120*e,0,0,22+30*e);}
  else if(m==='sh'){C(45+110*e,-48,30+40*e);K(12,-48,45+110*e,-48,16+20*e);}
  else if(m==='sp'){C(0,-48,40+90*e);K(0,-48,0,90*e-48,35+25*e);}
  break;
 case'copper':
  if(m==='us'){B(-25,-15-105*e,50,35);K(0,-30,0,-105*e,13);C(0,-105*e,23);}
  else if(m==='ds'){C(0,0,24);if(t>.45)C(0,-70*out((t-.45)/.55),35);}
  else if(m==='ss'){K(8,-48,105*e,-48,13);C(105*e,-48,20);if(t>.45)K(8,-48,105*e,-48,13);}
  else if(m==='uh'){B(-32,-110*e,64,42);C(0,-110*e,27);}
  else if(m==='dh'){C(0,-5,32);K(-55,-5,55,-5,10);}
  else if(m==='sh'){K(10,-48,75*e,-48,15);K(75*e,-48,110*e,-48,15);C(110*e,-48,22);}
  else if(m==='sp'){C(0,-48,28+100*e);K(-25,-48,25,-48,28);if(t>.62)C(0,-48,45+65*out((t-.62)/.38));}
  break;
 case'emerald':
  if(m==='us'){K(0,15,0,-115*e,12);C(0,-115*e,22);}
  else if(m==='ds'){K(0,-70+70*e,0,20,13);C(0,0,35);}
  else if(m==='ss'){K(0,-48,105*e,-48,11);C(105*e,-48,20);}
  else if(m==='uh'){K(0,15,0,-115*e,14);K(0,-115*e,0,-20,18);}
  else if(m==='dh'){C(0,0,28+35*e);K(0,-55*e,0,0,11);}
  else if(m==='sh'){K(10,-48,105*e,-48,17);C(105*e,-48,25);}
  else if(m==='sp'){C(0,-48,30+30*e);K(-15,-48,15,-48,28+30*e);if(t>.45)C(0,-48,50+85*out((t-.45)/.55));}
  break;
 case'pearl':
  if(m==='us'){K(0,-30,0,-105*e,10);C(0,-105*e,20+14*e);}
  else if(m==='ds'){C(0,0,28+45*e);}
  else if(m==='ss'){const q=inout(t),x=120*q,y=-48+22*Math.sin(q*Math.PI);K(10,-48,x,y,10);C(x,y,20);}
  else if(m==='uh'){for(let i=0;i<4;i++)C(0,-20-i*25*e,12+i*5);C(0,-115*e,25);}
  else if(m==='dh'){C(0,-4,32+45*e);K(-60,-4,60,-4,7);}
  else if(m==='sh'){const q=inout(t),x=140*q,y=-48+35*Math.sin(q*TAU);K(10,-48,x,y,12);C(x,y,25);}
  else if(m==='sp'){C(0,-48,30+90*e);for(let i=0;i<6;i++){const a=i/6*TAU;C(Math.cos(a)*(35+75*e),-48+Math.sin(a)*(28+55*e),14);}}
  break;
 case'red':
  if(m==='us'){const h=125*e;K(0,0,0,-h,18);C(0,-h,28);}
  else if(m==='ds'){C(0,-5,28+40*e);for(let i=0;i<6;i++){const a=i/6*TAU;K(Math.cos(a)*25,-5,Math.cos(a)*(55*e+25),-5+Math.sin(a)*(55*e),6);}}
  else if(m==='ss'){K(12,-48,105*e,-48,13);C(105*e,-48,18);}
  else if(m==='uh'){const r=45+70*e;C(0,-55,r);K(0,-55,0,-5,14);}
  else if(m==='dh'){C(0,0,28+60*e);K(-60,0,60,0,10);}
  else if(m==='sh'){P([[10,-78],[130*e,-55],[145*e,-30],[10,-18]]);C(130*e,-45,25);}
  else if(m==='sp'){C(20,-48,30+105*e);if(t>.5)C(20,-48,42+90*out((t-.5)/.5));}
  break;
 case'lavender':
  if(m==='us'){B(-30,-10-105*e,60,30);K(0,-15,0,-105*e,12);C(0,-105*e,20);}
  else if(m==='ds'){P([[-18,-10],[0,55*e], [18,-10],[0,-35]]);K(0,-10,0,45*e,9);}
  else if(m==='ss'){P([[10,-70],[120*e,-48],[10,-26]]);K(10,-48,120*e,-48,9);}
  else if(m==='uh'){B(-45,-10-130*e,90,38);for(let i=0;i<4;i++)P([[-30+i*20,-90*e],[0,-130*e],[30-i*20,-90*e]]);C(0,-130*e,25);}
  else if(m==='dh'){B(-65,-75,30,80);B(35,-75,30,80);B(-35,-45,70,50);C(0,-45,35*e);}
  else if(m==='sh'){P([[10,-78],[145*e,-55],[145*e,-35],[10,-18]]);C(145*e,-45,26);}
  else if(m==='sp'){C(0,-48,32+95*e);B(-75,-105,150,28);B(-105,-75,28,55);B(77,-75,28,55);}
  break;
 case'amber':
  if(m==='us'){K(0,-35,0,-105*e,12);K(0,-105*e,0,-145*e,12);C(0,-145*e,18);}
  else if(m==='ds'){K(-55*e,-48,55*e,-48,10);C(-55*e,-48,18);C(55*e,-48,18);}
  else if(m==='ss'){K(-80*e,-48,80*e,-48,10);C(0,-48,22);}
  else if(m==='uh'){for(let i=0;i<4;i++){const y=-45-i*25*e;K(0,y,0,y-22,10);C(0,y-22,15);}}
  else if(m==='dh'){for(let i=0;i<5;i++){const a=i/4*Math.PI*2;K(Math.cos(a)*70*e,-48+Math.sin(a)*45*e,0,-48,10);C(0,-48,25);}}
  else if(m==='sh'){K(-100*e,-48,0,-48,12);K(0,-48,100*e,-48,12);C(0,-48,28);}
  else if(m==='sp'){for(let i=0;i<4;i++){const a=i/4*TAU;K(Math.cos(a)*95*e,-48+Math.sin(a)*60*e,0,-48,11);}C(0,-48,38+35*e);}
  break;
 }
 return b;
}

function renderShape(ctx,h,c,c2,a=.72){ctx.save();ctx.globalAlpha=a;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=4;ctx.lineJoin='round';if(h.shape==='circle'){ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,TAU);ctx.stroke();ctx.globalAlpha=a*.22;ctx.fill();}else if(h.shape==='box'){ctx.strokeRect(h.x,h.y,h.w,h.h);ctx.globalAlpha=a*.18;ctx.fillRect(h.x,h.y,h.w,h.h);}else if(h.shape==='capsule'){ctx.beginPath();ctx.moveTo(h.x1,h.y1);ctx.lineTo(h.x2,h.y2);ctx.lineWidth=h.r*2;ctx.lineCap='round';ctx.stroke();ctx.lineWidth=3;ctx.globalAlpha=a*.35;ctx.strokeStyle=c2;ctx.beginPath();ctx.moveTo(h.x1,h.y1);ctx.lineTo(h.x2,h.y2);ctx.stroke();}else{ctx.beginPath();ctx.moveTo(h.points[0][0],h.points[0][1]);for(let i=1;i<h.points.length;i++)ctx.lineTo(h.points[i][0],h.points[i][1]);ctx.closePath();ctx.stroke();ctx.globalAlpha=a*.18;ctx.fill();}ctx.restore();}

function detail(ctx,id,m,t,c,c2){
 const e=out(t), q=inout(t);
 ctx.save();
 if(m==='sp'){ring(ctx,0,-48,35+105*e,c2,5,.55);ring(ctx,0,-48,55+125*e,c,2,.4);}
 if(id==='yellow'){for(let i=0;i<4;i++)lineEffect(ctx,-20+i*13,-5,(-35+i*18)*(1-e),-35-65*e,c2,3,.45);}
 if(id==='blue'){for(let i=0;i<6;i++){const a=i/6*TAU+t*5;lineEffect(ctx,Math.cos(a)*20,-48+Math.sin(a)*15,Math.cos(a)*85*e,-48+Math.sin(a)*55*e,c2,3,.42);}}
 if(id==='purple'){for(let i=0;i<3;i++)ring(ctx,-25+50*i,-48,12+28*q,c2,3,.35);}
 if(id==='orange'){for(let i=0;i<2;i++)ring(ctx,35+70*i*q,-48,18+25*e,c2,4,.45);}
 if(id==='green'){for(let i=0;i<5;i++)lineEffect(ctx,-55+i*25,-3,(-45+i*23)*e,-25-35*e,c2,4,.42);}
 if(id==='pink'){for(let i=0;i<5;i++){const a=i/4*Math.PI*2;lineEffect(ctx,Math.cos(a)*20,-48+Math.sin(a)*15,Math.cos(a)*(40+65*e),-48+Math.sin(a)*(35+55*e),c2,2,.4);}}
 if(id==='grey'){for(let i=0;i<3;i++)lineEffect(ctx,-70+i*55,-95,-50+i*50,-20,c2,3,.3);}
 if(id==='turquoise'){ring(ctx,0,-48,28+45*e,c2,3,.4);}
 if(id==='olive'){for(let i=0;i<4;i++)ring(ctx,0,-48,25+i*22*e,c2,2,.3);}
 if(id==='copper'){for(let i=0;i<4;i++)lineEffect(ctx,-55+i*35,-90,-55+i*35,0,c2,2,.35);}
 if(id==='emerald'){for(let i=0;i<4;i++)lineEffect(ctx,-50+i*30,-95,-35+i*25,-5,c2,2,.3);}
 if(id==='pearl'){for(let i=0;i<4;i++)ring(ctx,0,-48,15+i*25*e,c2,2,.35);}
 if(id==='red'){for(let i=0;i<6;i++){const a=i/6*TAU;lineEffect(ctx,0,-48,Math.cos(a)*(35+80*e),-48+Math.sin(a)*(25+65*e),c2,4,.35);}}
 if(id==='lavender'){for(let i=0;i<4;i++)lineEffect(ctx,-60+i*40,-90*e,60-i*40,-90*e,c2,2,.35);}
 if(id==='amber'){for(let i=0;i<4;i++){const a=i/4*TAU;lineEffect(ctx,0,-48,Math.cos(a)*(30+80*e),-48+Math.sin(a)*(25+60*e),c2,3,.35);}}
 ctx.restore();
}

const COLORS={yellow:['#FFD700','#FFA500'],blue:['#4488FF','#66CCFF'],purple:['#9944CC','#CC66FF'],orange:['#FF8800','#FFAA44'],green:['#44AA44','#66CC66'],pink:['#FF66AA','#FF99CC'],grey:['#888888','#AAAAAA'],turquoise:['#44CCAA','#66EECC'],olive:['#808000','#A0A040'],copper:['#CC7744','#FFAA66'],emerald:['#33CC66','#66FF99'],pearl:['#EEEEDD','#FFFFFF'],red:['#FF3333','#FF7744'],lavender:['#BB88DD','#DDBBFF'],amber:['#FFBB33','#FFE080']};
export function drawGen5Attack(ctx,x,y,color,p,facing,charId,move){const id=charId.startsWith('g5_')?charId.slice(3):charId;const cc=COLORS[id]||[color||'#FFFFFF','#FFFFFF'];facingWrap(ctx,x,y,facing,local=>{detail(local,id,move,p,cc[0],cc[1]);for(const h of G(id,move,p))renderShape(local,h,cc[0],cc[1],.86);if(p>.72){const h=G(id,move,p);for(let i=0;i<Math.min(5,h.length);i++){const z=h[i];if(z.shape==='circle')dot(local,z.x,z.y,Math.max(2,z.r*.18),cc[1],.55);}}});}
export function drawGen5Super(ctx,x,y,p,facing,charId){drawGen5Attack(ctx,x,y,null,p,facing,charId,'sp');}
function mirror(bs,f){return bs.map(h=>{if(h.shape==='circle'||h.shape==='box')return {...h,x:h.x*f};if(h.shape==='capsule')return {...h,x1:h.x1*f,x2:h.x2*f};if(h.shape==='polygon')return {...h,points:h.points.map(([x,y])=>[x*f,y])};return h;});}
export function getGen5Hitboxes(charId,move,t,facing=1){const id=charId.startsWith('g5_')?charId.slice(3):charId;return mirror(G(id,move,t),facing<0?-1:1);}
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
