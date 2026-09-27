// Generation V — Characters 16-39. Individually authored combat geometry + animation.
// The collision shapes returned by H() are the same shapes drawn by A(), so the
// active hitbox follows the visible attack instead of being a generic range box.
const TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v));
const e=v=>1-Math.pow(1-clamp(v),3);
const s=v=>{v=clamp(v);return v*v*(3-2*v)};
const io=v=>{v=clamp(v);return v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2};
const colors={
 black:['#333333','#FFFF44'],magenta:['#FF44AA','#FF77CC'],indigo:['#4B0082','#7744AA'],maroon:['#800000','#AA3333'],crimson:['#DC143C','#FF4466'],scarlet:['#FF2400','#FF5533'],white:['#EEEEEE','#FFFFFF'],silver:['#C0C0C0','#E0E0E0'],
 corpent:['#8B5A2B','#C58A45'],magneto:['#777777','#CC55FF'],willow:['#398A3F','#75C95A'],cable:['#244B7A','#66CCFF'],snodvor:['#A9E7FF','#F4FFFF'],kirsten:['#FF6A24','#FFD35A'],volt:['#4A62B8','#AEEBFF'],temple:['#7A4B32','#D9A36C'],nightmare:['#24183D','#A66CFF'],hazel:['#355C35','#B9E36A'],whami:['#C28A32','#6BE0A8'],controller:['#6A4FB3','#E2D7FF'],evil:['#111111','#777777'],life:['#67D88A','#F7FF9A'],death:['#282044','#8C78C8'],mercy:['#F2E8FF','#FFFFFF']
};
const TA=(id)=>colors[id]||['#FFF','#FFF'];
function st(ctx,pts,c,w,a=1){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=c;ctx.shadowBlur=w*2.2;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.stroke();ctx.restore()}
function fill(ctx,pts,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();ctx.fill();ctx.restore()}
function circ(ctx,x,y,r,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function ring(ctx,x,y,r,c,w=4,a=.75){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore()}
function spark(ctx,x,y,r,c,a=1,n=8){for(let i=0;i<n;i++){let q=i/n*TAU;st(ctx,[[x+Math.cos(q)*r*.2,y+Math.sin(q)*r*.2],[x+Math.cos(q)*r,y+Math.sin(q)*r]],c,2,a)}}
function wave(ctx,x,y,w,h,c,a=.7){st(ctx,[[x-w,y],[x-w*.5,y-h],[x,y],[x+w*.5,y+h],[x+w,y]],c,3,a)}
function bolt(ctx,x,y,len,h,c,a=1){fill(ctx,[[x,y],[x+len*.24,y-h*.42],[x+len*.12,y-h*.05],[x+len*.52,y-h*.26],[x+len*.42,y+h*.36],[x+len,y+h*.02],[x+len*.62,y-h*.5],[x+len*.76,y-h*.1]],c,a)}
function glue(ctx,x,y,r,c,a=1){circ(ctx,x,y,r,c,a);ring(ctx,x,y,r*.72,'#FFD6EE',2,a*.55)}
function root(ctx,x,y,len,c,a=1){st(ctx,[[x,y],[x+len*.35,y-len*.2],[x+len*.7,y+len*.05],[x+len,y-len*.1]],c,7,a)}
function ghost(ctx,x,y,r,c,a=1){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y-r*.15,r*.72,Math.PI,0);ctx.lineTo(x+r*.8,y+r*.75);ctx.lineTo(x+r*.35,y+r*.5);ctx.lineTo(x,y+r*.8);ctx.lineTo(x-r*.35,y+r*.5);ctx.lineTo(x-r*.8,y+r*.75);ctx.closePath();ctx.fill();ctx.restore()}
function wing(ctx,x,y,side,scale,c,a=1){fill(ctx,[[x,y],[x+side*45*scale,y-30*scale],[x+side*72*scale,y-5*scale],[x+side*28*scale,y+12*scale]],c,a)}
function face(ctx,x,y,r,c,a=1){ring(ctx,x,y,r,c,3,a);circ(ctx,x-r*.28,y-r*.12,r*.07,c,a);circ(ctx,x+r*.28,y-r*.12,r*.07,c,a)}
function mirror(bs,f){return bs.map(h=>h.shape==='circle'||h.shape==='box'?{...h,x:h.x*f}:h.shape==='capsule'?{...h,x1:h.x1*f,x2:h.x2*f}:h.shape==='polygon'?{...h,points:h.points.map(([x,y])=>[x*f,y])}:h)}

// H() is the canonical attack geometry. A() below intentionally draws the same geometry.
function H(id,m,t){
 const q=e(t), z=io(t), b=[]; const C=(x,y,r)=>b.push({shape:'circle',x,y,r}); const B=(x,y,w,h)=>b.push({shape:'box',x,y,w,h}); const K=(x1,y1,x2,y2,r)=>b.push({shape:'capsule',x1,y1,x2,y2,r}); const P=points=>b.push({shape:'polygon',points});
 switch(id){
 case'black':
  if(m==='us'){let a=-Math.PI/2+q*TAU,x=Math.cos(a)*78,y=-110+Math.sin(a)*42;C(x,y,10)}
  if(m==='ds'){C(0,-30,24+10*q)}
  if(m==='ss'){P([[5,-58],[48*q,-78],[92*q,-48],[48*q,-18],[5,-34]])}
  if(m==='uh'){for(let i=0;i<3;i++)P([[-32+i*32,-18],[-20+i*32,-18],[-10+i*32,-145*q],[-25+i*32,-145*q]])}
  if(m==='dh'){let a=-Math.PI/2+q*TAU;C(Math.cos(a)*62, -48+Math.sin(a)*62,14)}
  if(m==='sh'){P([[6,-70],[135*q,-58],[150*q,-42],[135*q,-25],[6,-34]])}
  if(m==='sp'){P([[-22,-155*q],[22,-155*q],[18,-18],[0,5],[-18,-18]]);C(0,-18,25)} break;
 case'magenta':
  if(m==='us'){K(0,0,0,-95*q,10);C(0,-95*q,15)}
  if(m==='ds'){C(0,0,35+15*q);K(-42,-5,42,-5,7)}
  if(m==='ss'){K(5,-48,120*q,-48,12);C(120*q,-48,17)}
  if(m==='uh'){K(0,-20,0,-145*q,8);K(0,-90*q,90*q,-65*q,8);C(0,-145*q,13)}
  if(m==='dh'){for(let i=0;i<5;i++){let a=i/4*TAU;C(Math.cos(a)*55*q,-48+Math.sin(a)*38*q,9);K(0,-48,Math.cos(a)*55*q,-48+Math.sin(a)*38*q,5)}}
  if(m==='sh'){B(18,-92,120*q,92);C(138*q,-46,18)}
  if(m==='sp'){for(let i=0;i<9;i++){let a=i/9*TAU;K(0,-48,Math.cos(a)*(70+55*q),-48+Math.sin(a)*(50+42*q),6)}C(0,-48,30)} break;
 case'indigo':
  if(m==='us'){C(0,-115*q,27);K(-30,-50,30,-50,8)}
  if(m==='ds'){C(0,2,23+22*q)}
  if(m==='ss'){P([[5,-72],[90*q,-58],[110*q,-46],[90*q,-34],[5,-24]])}
  if(m==='uh'){K(0,5,0,-125*q,22);C(0,-125*q,25);C(0,5,29)}
  if(m==='dh'){C(0,0,48*q+18);C(0,-20,28*q)}
  if(m==='sh'){let a=.0+q*Math.PI*1.15;C(Math.cos(a)*72,-48+Math.sin(a)*48,18);C(Math.cos(a+Math.PI)*72,-48+Math.sin(a+Math.PI)*48,13)}
  if(m==='sp'){C(65*q,-48,48);for(let i=0;i<6;i++){let a=i/6*TAU;C(65*q+Math.cos(a)*28,-48+Math.sin(a)*28,10)}} break;
 case'maroon':
  if(m==='us'){K(0,-15,0,-128*q,18);C(0,-128*q,25)}
  if(m==='ds'){C(0,-5,35+25*q)}
  if(m==='ss'){K(5,-48,135*q,-48,14);C(135*q,-48,20)}
  if(m==='uh'){B(-28,-140*q,56,140*q);C(0,-140*q,28)}
  if(m==='dh'){P([[-95*q,-4],[0,15],[95*q,-4],[45*q,-28],[-45*q,-28]]);C(0,-4,28)}
  if(m==='sh'){K(12,-48,145*q,-48,22);C(145*q,-48,31)}
  if(m==='sp'){C(0,-48,30+68*q);C(0,-48,52+78*q)} break;
 case'crimson':
  if(m==='us'){K(0,-8,0,-130*q,9);C(0,-130*q,13)}
  if(m==='ds'){B(-42,-10,84,25);P([[-42,0],[42,0],[24,32],[-24,32]])}
  if(m==='ss'){P([[8,-67],[115*q,-56],[125*q,-42],[115*q,-28],[8,-36]])}
  if(m==='uh'){K(0,-15,0,-150*q,18);P([[-8,-120*q],[8,-120*q],[18,-155*q],[-18,-155*q]])}
  if(m==='dh'){C(0,-2,35+35*q);B(-38,-35,76,42)}
  if(m==='sh'){P([[5,-80],[150*q,-62],[170*q,-45],[150*q,-25],[5,-17]]);for(let i=0;i<3;i++)C(90*q+i*18,-45+(i-1)*12,9)}
  if(m==='sp'){P([[-20,-72],[155*q,-55],[170*q,-45],[155*q,-35],[-20,-24]]);C(0,-48,32)} break;
 case'scarlet':
  if(m==='us'){K(8,-5,8,-110*q,12);C(8,-110*q,18)}
  if(m==='ds'){C(0,2,28);C(0,18-60*q,14)}
  if(m==='ss'){P([[10,-72],[120*q,-52],[130*q,-42],[120*q,-32],[10,-22]])}
  if(m==='uh'){for(let i=0;i<4;i++){let y=-20-i*28*q;K(-8,y,8,y-30,10);C(0,y-30,13)}}
  if(m==='dh'){for(let i=0;i<5;i++){let a=i/5*TAU;K(0,-48,Math.cos(a)*55*q,-48+Math.sin(a)*55*q,8)}}
  if(m==='sh'){K(5,-48,155*q,-48,28);C(155*q,-48,25)}
  if(m==='sp'){C(0,-48,35);K(0,-48,115*q,-48,38);C(115*q,-48,42)} break;
 case'white':
  if(m==='us'){let y=-30-115*q;K(8,-35,8,y,11);C(8,y,15)}
  if(m==='ds'){K(0,-40,0,15,14);C(0,15,27)}
  if(m==='ss'){K(5,-48,150*q,-48,15);C(150*q,-48,19)}
  if(m==='uh'){K(0,0,0,-145*q,18);K(0,-145*q,0,-10,16);C(0,-145*q,22)}
  if(m==='dh'){K(0,-15,0,8,28);C(0,8,32)}
  if(m==='sh'){let a=q*TAU*2;let x=110*q,y=-48+Math.sin(a)*48;K(5,-48,x,y,16);C(x,y,19)}
  if(m==='sp'){K(0,-155*q,0,-5,24);C(0,-5,42)} break;
 case'silver':
  if(m==='us'){K(0,-25,0,-120*q,22);C(0,-120*q,28)}
  if(m==='ds'){B(-35,-5,70,32);C(0,10,35)}
  if(m==='ss'){K(12,-48,130*q,-48,25);C(130*q,-48,30)}
  if(m==='uh'){K(0,-10,0,-145*q,32);C(0,-145*q,34)}
  if(m==='dh'){K(0,-20,0,20*q,34);C(0,20*q,40)}
  if(m==='sh'){K(5,-48,155*q,-48,31);C(155*q,-48,35)}
  if(m==='sp'){K(5,-48,185*q,-48,38);C(185*q,-48,46)} break;
 case'corpent':
  if(m==='us'){K(12,-42,-12,-125*q,18);C(-12,-125*q,25)}
  if(m==='ds'){C(0,0,35);B(-45,-10,90,22)}
  if(m==='ss'){B(10,-58,70,35);C(80,-40,25)}
  if(m==='uh'){let a=-1.4+q*1.8;K(20,-45,20+Math.cos(a)*85,-45+Math.sin(a)*85,22);C(20+Math.cos(a)*85,-45+Math.sin(a)*85,29)}
  if(m==='dh'){B(-38,-100,76,105);C(0,5,39)}
  if(m==='sh'){K(8,-55,145*q,-35,25);C(145*q,-35,30)}
  if(m==='sp'){B(12,-145,110,75);C(75,-105,52)} break;
 case'magneto':
  if(m==='us'){C(0,-105*q,20);K(0,-25,0,-105*q,8)}
  if(m==='ds'){C(0,0,42*q+18);for(let i=0;i<5;i++){let a=i/5*TAU;C(Math.cos(a)*45*q,-5+Math.sin(a)*35*q,10)}}
  if(m==='ss'){K(5,-48,100*q,-48,12);C(100*q,-48,18)}
  if(m==='uh'){B(-25,-140*q,50,75);C(0,-140*q,28)}
  if(m==='dh'){for(let i=0;i<5;i++){let x=(i-2)*28*q;C(x,-45-25*q,15);K(x,-45-25*q,x,-5,7)}}
  if(m==='sh'){B(-65*q,-62,130*q,28);C(130*q,-48,26)}
  if(m==='sp'){C(60*q,-48,50);for(let i=0;i<8;i++){let a=i/8*TAU;C(60*q+Math.cos(a)*42,-48+Math.sin(a)*32,11)}} break;
 case'willow':
  if(m==='us'){K(0,0,0,-120*q,15);C(0,-120*q,24)}
  if(m==='ds'){for(let i=-1;i<=1;i++)K(i*8,-2,i*65*q,-5,8)}
  if(m==='ss'){K(5,-48,135*q,-48,10);C(135*q,-48,15)}
  if(m==='uh'){B(-28,-145*q,56,145*q);C(0,-145*q,27);K(-20,-115*q,55,-100*q,8)}
  if(m==='dh'){for(let i=0;i<6;i++){let a=i/5*TAU;K(0,-48,Math.cos(a)*55*q,-48+Math.sin(a)*38*q,7)}}
  if(m==='sh'){P([[5,-68],[130*q,-65],[155*q,-45],[130*q,-22],[5,-28]]);K(20,-48,130*q,-48,15)}
  if(m==='sp'){for(let i=0;i<10;i++){let a=i/10*TAU;K(0,-48,Math.cos(a)*(60+75*q),-48+Math.sin(a)*(50+60*q),7)}C(0,-48,30)} break;
 case'cable':
  if(m==='us'){K(-8,-45,-55,-130*q,7);K(8,-45,55,-130*q,7)}
  if(m==='ds'){K(0,-5,65*q,-5,7);K(0,-5,-65*q,-5,7)}
  if(m==='ss'){K(0,-48,145*q,-48,7)}
  if(m==='uh'){K(-8,-45,-45,-130*q,8);K(8,-45,45,-130*q,8)}
  if(m==='dh'){K(-55*q,-5,55*q,-5,8);C(0,-5,18)}
  if(m==='sh'){K(5,-48,125*q,-48,8);C(125*q,-48,16)}
  if(m==='sp'){K(-5,-48,70*q,-48,10);K(5,-48,115*q,-48,10);C(115*q,-48,24)} break;
 case'snodvor':
  if(m==='us'){P([[-14,-5],[14,-5],[0,-130*q]]);C(0,-130*q,16)}
  if(m==='ds'){C(0,-5,32+18*q)}
  if(m==='ss'){P([[4,-58],[120*q,-48],[4,-38]]);C(120*q,-48,16)}
  if(m==='uh'){B(-35,-145*q,70,110);C(0,-145*q,28)}
  if(m==='dh'){B(-32,-135*q,64,135*q);C(0,0,35)}
  if(m==='sh'){K(5,-48,145*q,-48,27);P([[100*q,-78],[160*q,-48],[100*q,-18]])}
  if(m==='sp'){C(0,-48,35+50*q);for(let i=0;i<8;i++){let a=i/8*TAU;C(Math.cos(a)*(55+65*q),-48+Math.sin(a)*(40+55*q),10)}} break;
 case'kirsten':
  if(m==='us'){C(0,-110*q,13);C(0,-75*q,8)}
  if(m==='ds'){C(0,0,25);C(-28*q,-8,9);C(28*q,-8,9)}
  if(m==='ss'){C(120*q,-48,13)}
  if(m==='uh'){for(let i=0;i<4;i++)C(-25+i*17,-65-i*18*q,12)}
  if(m==='dh'){for(let i=0;i<5;i++)C((i-2)*30*q,-48,12)}
  if(m==='sh'){B(10,-60,145*q,24)}
  if(m==='sp'){C(85*q,-48,52+20*q)} break;
 case'volt':
  if(m==='us'){K(0,-5,0,-120*q,18)}
  if(m==='ds'){waveShape('unused');C(0,0,36)}
  if(m==='ss'){P([[5,-68],[125*q,-48],[5,-28]])}
  if(m==='uh'){for(let i=0;i<3;i++)P([[-25+i*25,-15],[-10+i*25,-15],[5+i*35,-135*q],[-15+i*25,-135*q]])}
  if(m==='dh'){P([[-85*q,-8],[0,18],[85*q,-8],[50*q,-32],[-50*q,-32]]);C(0,-4,25)}
  if(m==='sh'){P([[5,-80],[145*q,-60],[160*q,-48],[145*q,-36],[5,-16]]);C(145*q,-48,20)}
  if(m==='sp'){C(85*q,-48,48);C(85*q,-48,28)} break;
 case'temple':
  if(m==='us'){C(0,-115*q,18)}
  if(m==='ds'){B(-55,-5,110,24);C(0,-5,30)}
  if(m==='ss'){C(105*q,-48,14)}
  if(m==='uh'){K(0,-15,0,-130*q,12);C(0,-130*q,20)}
  if(m==='dh'){B(-80,-8,160*q,28);for(let i=0;i<4;i++)C((-60+i*40)*q,-40,12)}
  if(m==='sh'){K(5,-48,150*q,-48,12);for(let i=0;i<3;i++)C((70+i*30)*q,-48+(i-1)*15,10)}
  if(m==='sp'){C(80*q,-48,50);for(let i=0;i<6;i++)C(80*q+Math.cos(i/6*TAU)*32,-48+Math.sin(i/6*TAU)*32,10)} break;
 case'nightmare':
  if(m==='us'){C(0,-110*q,24)}
  if(m==='ds'){K(0,0,0,-55*q,14);C(0,-55*q,20)}
  if(m==='ss'){C(105*q,-48,18);K(10,-48,105*q,-48,8)}
  if(m==='uh'){C(0,-145*q,32)}
  if(m==='dh'){C(0,0,40+18*q);C(0,-48,25)}
  if(m==='sh'){K(5,-48,145*q,-48,25);C(145*q,-48,28)}
  if(m==='sp'){C(0,-48,48);C(0,-48,62*q+30)} break;
 case'hazel':
  if(m==='us'){K(0,0,0,-120*q,10);C(0,-120*q,15)}
  if(m==='ds'){C(0,-5,35);for(let i=0;i<3;i++)K(0,-5,(i-1)*48*q,-5,6)}
  if(m==='ss'){K(5,-48,125*q,-48,8);C(125*q,-48,13)}
  if(m==='uh'){B(-30,-145*q,60,130);for(let i=-1;i<=1;i++)K(i*15,-110*q,i*45,-90*q,7)}
  if(m==='dh'){for(let i=0;i<6;i++){let a=i/6*TAU;C(Math.cos(a)*55*q,-48+Math.sin(a)*35*q,11)}}
  if(m==='sh'){P([[5,-72],[130*q,-58],[150*q,-45],[130*q,-30],[5,-24]]);K(15,-48,130*q,-48,12)}
  if(m==='sp'){C(0,-48,45);for(let i=0;i<8;i++){let a=i/8*TAU;K(0,-48,Math.cos(a)*(65+65*q),-48+Math.sin(a)*(48+48*q),6)}} break;
 case'whami':
  if(m==='us'){C(0,-100*q,16);K(0,0,0,-100*q,8)}
  if(m==='ds'){C(0,-5,30);C(0,25*q,20)}
  if(m==='ss'){C(115*q,-48,16)}
  if(m==='uh'){K(0,-20,0,-145*q,30);C(0,-145*q,35)}
  if(m==='dh'){C(0,-5,42);C(0,-5,27)}
  if(m==='sh'){C(55*q,-48,15);C(95*q,-48,19);C(140*q,-48,26)}
  if(m==='sp'){C(80*q,-48,48);for(let i=0;i<5;i++)C((55+i*12)*q,-48+(i-2)*13,10)} break;
 case'controller':
  if(m==='us'){K(0,-5,0,-120*q,13);C(0,-120*q,19)}
  if(m==='ds'){C(0,5,35);K(-15,-20,15,-20,9)}
  if(m==='ss'){K(8,-48,125*q,-48,13);C(125*q,-48,19)}
  if(m==='uh'){for(let i=0;i<3;i++){let x=(i-1)*35*q;C(x,-80-35*q,13);K(x,-80-35*q,x,-140*q,7)}}
  if(m==='dh'){C(0,0,45);for(let i=0;i<4;i++){let a=i/4*TAU;K(Math.cos(a)*45*q,-48+Math.sin(a)*30*q,0,0,7)}}
  if(m==='sh'){C(80*q,-48,20);C(140*q,-48,20);K(80*q,-48,140*q,-48,9)}
  if(m==='sp'){C(0,-48,34);for(let i=0;i<8;i++){let a=i/8*TAU;C(Math.cos(a)*58*q,-48+Math.sin(a)*48*q,11)}} break;
 case'evil':
  if(m==='us'){C(0,-112*q,14)}
  if(m==='ds'){C(0,0,18+16*q)}
  if(m==='ss'){B(8,-52,135*q,4)}
  if(m==='uh'){B(-10,-145*q,20,145*q)}
  if(m==='dh'){B(-55*q,-5,110*q,5)}
  if(m==='sh'){B(5,-49,145*q,3)}
  if(m==='sp'){C(70*q,-48,45*q+18)} break;
 case'life':
  if(m==='us'){B(-28,-110*q,56,20);C(0,-110*q,24)}
  if(m==='ds'){C(0,-10,30);ringShape('x')}
  if(m==='ss'){let x=125*q;K(5,-48,x,-48,12);C(x,-48,18)}
  if(m==='uh'){for(let i=0;i<4;i++)B(-28+i*4,-35-i*28*q,56-i*8,24);C(0,-145*q,27)}
  if(m==='dh'){C(0,0,42*q+18)}
  if(m==='sh'){P([[5,-65],[150*q,-72],[170*q,-48],[150*q,-24],[5,-31]])}
  if(m==='sp'){C(0,-48,42);C(0,-48,65*q+25)} break;
 case'death':
  if(m==='us'){B(-12,-115*q,24,90);C(0,-115*q,17)}
  if(m==='ds'){C(0,0,26);C(0,-35,16)}
  if(m==='ss'){B(5,-49,130*q,3)}
  if(m==='uh'){K(0,0,0,-135*q,17);C(0,-135*q,25)}
  if(m==='dh'){C(0,-48,40+20*q)}
  if(m==='sh'){B(5,-50,150*q,5);C(75*q,-48,16)}
  if(m==='sp'){C(0,-48,45);C(0,-48,60*q+30)} break;
 case'mercy':
  if(m==='us'){C(0,-105*q,25);K(-30,-5,30,-5,8)}
  if(m==='ds'){C(0,0,35);ringShape('x')}
  if(m==='ss'){C(115*q,-48,18);K(5,-48,115*q,-48,10)}
  if(m==='uh'){K(-25,-20,-25,-120*q,9);K(25,-20,25,-120*q,9);C(0,-120*q,25)}
  if(m==='dh'){C(0,-5,40);for(let i=0;i<4;i++){let a=i/4*TAU;C(Math.cos(a)*38*q,-5+Math.sin(a)*25*q,9)}}
  if(m==='sh'){P([[5,-70],[115*q,-58],[145*q,-48],[115*q,-38],[5,-26]])}
  if(m==='sp'){C(0,-48,45);C(0,-48,65*q+25)} break;
 }
 return b;
}
// no-op placeholders used only to keep H's design language readable; never affect collision.
function ringShape(){} function waveShape(){}

function A(ctx,id,m,t,c,c2){
 const q=e(t),z=io(t);
 switch(id){
 case'black':
  if(m==='us'){let a=-Math.PI/2+q*TAU;let x=Math.cos(a)*78,y=-110+Math.sin(a)*42;ring(ctx,0,-110,78,c,3,.35);st(ctx,[[0,-110],[x,y]],c,3,.5);circ(ctx,x,y,10,c2)}
  if(m==='ds'){circ(ctx,-18,-45,8,c2);circ(ctx,18,-45,8,c2);ring(ctx,0,-30,24+10*q,c,4,.8);spark(ctx,0,-30,28,c2,.7)}
  if(m==='ss'){bolt(ctx,5,-58,92*q,22,c2,.95);st(ctx,[[5,-58],[48*q,-78],[92*q,-48]],c,2,.7)}
  if(m==='uh'){for(let i=0;i<3;i++)bolt(ctx,-32+i*32,-18,25,115*q,c2,.9);}
  if(m==='dh'){let a=-Math.PI/2+q*TAU;let x=Math.cos(a)*62,y=-48+Math.sin(a)*62;ring(ctx,0,-48,62,c,.8,.3);circ(ctx,x,y,14,c2);bolt(ctx,x,y,18,12,c2,.7)}
  if(m==='sh'){bolt(ctx,6,-70,145*q,28,c2,1)}
  if(m==='sp'){bolt(ctx,-22,-155*q,44,70,c2,1);ring(ctx,0,-18,25,c,.7,.8);spark(ctx,0,-18,35,c2,.8)} break;
 case'magenta':
  if(m==='us'){glue(ctx,0,-95*q,15,c,.9);st(ctx,[[0,0],[0,-95*q]],c2,5,.8)}
  if(m==='ds'){glue(ctx,0,0,35+15*q,c,.75);for(let i=-1;i<=1;i++)st(ctx,[[0,-2],[i*42,-5]],c2,4,.6)}
  if(m==='ss'){glue(ctx,120*q,-48,17,c,.9);st(ctx,[[5,-48],[120*q,-48]],c2,6,.7)}
  if(m==='uh'){st(ctx,[[0,-20],[0,-145*q]],c,7,.9);glue(ctx,0,-145*q,13,c2);st(ctx,[[0,-90*q],[90*q,-65*q]],c2,5,.8)}
  if(m==='dh'){for(let i=0;i<5;i++){let a=i/4*TAU;let x=Math.cos(a)*55*q,y=-48+Math.sin(a)*38*q;glue(ctx,x,y,9,c,.8);st(ctx,[[0,-48],[x,y]],c2,3,.55)}}
  if(m==='sh'){fill(ctx,[[18,-92],[138*q,-92],[138*q,0],[18,0]],c,.65);for(let i=0;i<5;i++)st(ctx,[[18,-78+i*18],[138*q,-78+i*18]],c2,3,.55)}
  if(m==='sp'){for(let i=0;i<9;i++){let a=i/9*TAU;st(ctx,[[0,-48],[Math.cos(a)*(70+55*q),-48+Math.sin(a)*(50+42*q)]],c,5,.7);glue(ctx,Math.cos(a)*(70+55*q),-48+Math.sin(a)*(50+42*q),6,c2,.8)}} break;
 case'indigo':
  if(m==='us'){ring(ctx,0,-115*q,27,c,6,.8);st(ctx,[[-30,-50],[30,-50]],c2,5,.7);circ(ctx,0,-115*q,8,c2)}
  if(m==='ds'){ring(ctx,0,2,23+22*q,c,8,.8);spark(ctx,0,2,28,c2,.6)}
  if(m==='ss'){fill(ctx,[[5,-72],[90*q,-58],[110*q,-46],[90*q,-34],[5,-24]],c,.55);st(ctx,[[5,-48],[110*q,-48]],c2,4,.8)}
  if(m==='uh'){ring(ctx,0,-55,50,c,.8,.35);st(ctx,[[0,5],[0,-125*q]],c,18,.8);circ(ctx,0,-125*q,25,c2)}
  if(m==='dh'){circ(ctx,0,0,48*q+18,c,.55);ring(ctx,0,0,25,c2,4,.8);spark(ctx,0,0,35,c2,.7)}
  if(m==='sh'){let a=q*Math.PI*1.15;let x=Math.cos(a)*72,y=-48+Math.sin(a)*48;st(ctx,[[0,-48],[x,y]],c,8,.6);circ(ctx,x,y,18,c2);st(ctx,[[x,y],[Math.cos(a+Math.PI)*72,-48+Math.sin(a+Math.PI)*48]],c2,4,.6)}
  if(m==='sp'){circ(ctx,65*q,-48,48,c,.5);ring(ctx,65*q,-48,48,c2,4,.9);spark(ctx,65*q,-48,58,c2,.9,10)} break;
 case'maroon':
  if(m==='us'){st(ctx,[[0,-15],[0,-128*q]],c,18,.9);circ(ctx,0,-128*q,25,c2);spark(ctx,0,-128*q,35,c2,.7)}
  if(m==='ds'){circ(ctx,0,-5,35+25*q,c,.55);ring(ctx,0,-5,48,c2,3,.6);spark(ctx,0,-5,52,c2,.7)}
  if(m==='ss'){st(ctx,[[5,-48],[135*q,-48]],c,14,1);circ(ctx,135*q,-48,20,c2)}
  if(m==='uh'){fill(ctx,[[-28,-140*q],[28,-140*q],[28,0],[-28,0]],c,.35);st(ctx,[[0,-15],[0,-140*q]],c2,8,.8);circ(ctx,0,-140*q,28,c2)}
  if(m==='dh'){fill(ctx,[[-95*q,-4],[0,15],[95*q,-4],[45*q,-28],[-45*q,-28]],c,.5);wave(ctx,0,-4,95*q,20,c2,.8)}
  if(m==='sh'){st(ctx,[[12,-48],[145*q,-48]],c,22,1);circ(ctx,145*q,-48,31,c2);spark(ctx,145*q,-48,42,c2,.8)}
  if(m==='sp'){circ(ctx,0,-48,30+68*q,c,.45);circ(ctx,0,-48,52+78*q,c2,.3);ring(ctx,0,-48,52+78*q,c2,6,.8)} break;
 case'crimson':
  if(m==='us'){st(ctx,[[0,-8],[0,-130*q]],c,9,1);circ(ctx,0,-130*q,13,c2);spark(ctx,0,-130*q,20,c2,.8)}
  if(m==='ds'){fill(ctx,[[-42,-10],[42,-10],[24,32],[-24,32]],c,.7);st(ctx,[[-42,0],[42,0]],c2,5,.8)}
  if(m==='ss'){fill(ctx,[[8,-67],[115*q,-56],[125*q,-42],[115*q,-28],[8,-36]],c,.8);st(ctx,[[8,-48],[115*q,-42]],c2,3,.8)}
  if(m==='uh'){st(ctx,[[0,-15],[0,-150*q]],c,18,1);fill(ctx,[[-8,-120*q],[8,-120*q],[18,-155*q],[-18,-155*q]],c2,.85)}
  if(m==='dh'){circ(ctx,0,-2,35+35*q,c,.6);spark(ctx,0,-2,50+35*q,c2,.8)}
  if(m==='sh'){fill(ctx,[[5,-80],[150*q,-62],[170*q,-45],[150*q,-25],[5,-17]],c,.85);for(let i=0;i<3;i++)circ(ctx,(90+i*18)*q,-45+(i-1)*12,9,c2,.9)}
  if(m==='sp'){fill(ctx,[[-20,-72],[155*q,-55],[170*q,-45],[155*q,-35],[-20,-24]],c,.75);st(ctx,[[-5,-48],[155*q,-45]],c2,8,.8);spark(ctx,0,-48,32,c2,.8)} break;
 case'scarlet':
  if(m==='us'){ghost(ctx,8,-110*q,18,c2,.8);st(ctx,[[8,-5],[8,-110*q]],c,7,.6)}
  if(m==='ds'){ghost(ctx,0,-48*q,14,c,.8);circ(ctx,0,2,28,c2,.35)}
  if(m==='ss'){fill(ctx,[[10,-72],[120*q,-52],[130*q,-42],[120*q,-32],[10,-22]],c,.6);st(ctx,[[10,-48],[130*q,-42]],c2,5,.9)}
  if(m==='uh'){for(let i=0;i<4;i++)ghost(ctx,0,-20-i*28*q,12,c2,.7)}
  if(m==='dh'){for(let i=0;i<5;i++){let a=i/5*TAU;ghost(ctx,Math.cos(a)*55*q,-48+Math.sin(a)*55*q,10,c2,.65);st(ctx,[[0,-48],[Math.cos(a)*55*q,-48+Math.sin(a)*55*q]],c,4,.5)}}
  if(m==='sh'){ghost(ctx,75*q,-48,38,c2,.8);st(ctx,[[5,-48],[155*q,-48]],c,12,.5)}
  if(m==='sp'){ghost(ctx,0,-48,45,c2,.8);ghost(ctx,115*q,-48,42,c,.7);st(ctx,[[0,-48],[115*q,-48]],c2,9,.6)} break;
 case'white':
  if(m==='us'){wing(ctx,8,-50,1,1,c2,.8);wing(ctx,8,-50,-1,1,c2,.8);st(ctx,[[8,-35],[8,-30-115*q]],c,8,1);circ(ctx,8,-30-115*q,15,c2)}
  if(m==='ds'){wing(ctx,0,-35,1,1,c2,.7);wing(ctx,0,-35,-1,1,c2,.7);st(ctx,[[0,-40],[0,15]],c,12,.9);wave(ctx,0,15,28,8,c2,.8)}
  if(m==='ss'){wing(ctx,20,-48,1,1,c2,.8);st(ctx,[[5,-48],[150*q,-48]],c,12,1);circ(ctx,150*q,-48,19,c2)}
  if(m==='uh'){st(ctx,[[0,0],[0,-145*q]],c,16,1);st(ctx,[[0,-145*q],[0,-10]],c2,12,.9);wing(ctx,0,-145*q,1,1,c2,.8);wing(ctx,0,-145*q,-1,1,c2,.8)}
  if(m==='dh'){wing(ctx,0,-20,1,1.2,c2,.8);wing(ctx,0,-20,-1,1.2,c2,.8);st(ctx,[[0,-15],[0,8]],c,22,1);ring(ctx,0,8,32,c2,4,.7)}
  if(m==='sh'){let a=q*TAU*2,x=110*q,y=-48+Math.sin(a)*48;st(ctx,[[5,-48],[x,y]],c,15,1);wing(ctx,x,y,1,.7,c2,.7);wing(ctx,x,y,-1,.7,c2,.7);circ(ctx,x,y,19,c2)}
  if(m==='sp'){st(ctx,[[0,-155*q],[0,-5]],c,24,1);wing(ctx,0,-80*q,1,1.5,c2,.8);wing(ctx,0,-80*q,-1,1.5,c2,.8);circ(ctx,0,-5,42,c2,.8)} break;
 case'silver':
  if(m==='us'){fill(ctx,[[-15,-25],[15,-25],[15,-120*q],[-15,-120*q]],c,.65);circ(ctx,0,-120*q,28,c2);spark(ctx,0,-120*q,28,c2,.8)}
  if(m==='ds'){fill(ctx,[[-35,-5],[35,-5],[35,27],[-35,27]],c,.8);ring(ctx,0,10,35,c2,5,.8)}
  if(m==='ss'){fill(ctx,[[12,-73],[130*q,-73],[130*q,-23],[12,-23]],c,.8);circ(ctx,130*q,-48,30,c2)}
  if(m==='uh'){fill(ctx,[[-32,-10],[32,-10],[32,-145*q],[-32,-145*q]],c,.8);circ(ctx,0,-145*q,34,c2);spark(ctx,0,-145*q,40,c2,.8)}
  if(m==='dh'){fill(ctx,[[-34,-20],[34,-20],[34,20*q],[ -34,20*q]],c,.9);ring(ctx,0,20*q,40,c2,6,.8)}
  if(m==='sh'){fill(ctx,[[5,-79],[155*q,-79],[155*q,-17],[5,-17]],c,.9);circ(ctx,155*q,-48,35,c2)}
  if(m==='sp'){fill(ctx,[[5,-80],[185*q,-80],[185*q,-16],[5,-16]],c,.95);circ(ctx,185*q,-48,46,c2);ring(ctx,185*q,-48,52,c2,5,.8)} break;
 case'corpent':
  if(m==='us'){st(ctx,[[12,-42],[-12,-125*q]],c,16,.9);circ(ctx,-12,-125*q,25,c2)}
  if(m==='ds'){fill(ctx,[[-45,-10],[45,-10],[45,12],[-45,12]],c,.7);circ(ctx,0,0,35,c2,.65)}
  if(m==='ss'){fill(ctx,[[10,-58],[80,-58],[80,-23],[10,-23]],c,.85);circ(ctx,80,-40,25,c2)}
  if(m==='uh'){let a=-1.4+q*1.8,x=20+Math.cos(a)*85,y=-45+Math.sin(a)*85;st(ctx,[[20,-45],[x,y]],c,22,1);circ(ctx,x,y,29,c2);ring(ctx,x,y,32,c2,4,.7)}
  if(m==='dh'){fill(ctx,[[-38,-100],[38,-100],[38,5],[-38,5]],c,.75);circ(ctx,0,5,39,c2);spark(ctx,0,5,48,c2,.8)}
  if(m==='sh'){st(ctx,[[8,-55],[145*q,-35]],c,22,1);circ(ctx,145*q,-35,30,c2)}
  if(m==='sp'){fill(ctx,[[12,-145],[122,-145],[122,-70],[12,-70]],c,.8);circ(ctx,75,-105,52,c2);spark(ctx,75,-105,58,c2,.8)} break;
 case'magneto':
  if(m==='us'){circ(ctx,0,-105*q,20,c2);st(ctx,[[0,-25],[0,-105*q]],c,5,.8);spark(ctx,0,-105*q,24,c2,.7)}
  if(m==='ds'){for(let i=0;i<5;i++){let a=i/5*TAU;circ(ctx,Math.cos(a)*45*q,-5+Math.sin(a)*35*q,10,c2,.9);st(ctx,[[0,-5],[Math.cos(a)*45*q,-5+Math.sin(a)*35*q]],c,4,.55)}}
  if(m==='ss'){st(ctx,[[5,-48],[100*q,-48]],c2,12,.8);circ(ctx,100*q,-48,18,c)}
  if(m==='uh'){fill(ctx,[[-25,-140*q],[25,-140*q],[25,-65*q],[-25,-65*q]],c,.5);circ(ctx,0,-140*q,28,c2)}
  if(m==='dh'){for(let i=0;i<5;i++){let x=(i-2)*28*q;circ(ctx,x,-45-25*q,15,c,.8);st(ctx,[[x,-45-25*q],[x,-5]],c2,4,.6)}}
  if(m==='sh'){fill(ctx,[[-65*q,-62],[65*q,-62],[65*q,-34],[-65*q,-34]],c,.65);st(ctx,[[-65*q,-48],[130*q,-48]],c2,6,.7)}
  if(m==='sp'){circ(ctx,60*q,-48,50,c,.55);for(let i=0;i<8;i++){let a=i/8*TAU;circ(ctx,60*q+Math.cos(a)*42,-48+Math.sin(a)*32,11,c2,.9);st(ctx,[[60*q,-48],[60*q+Math.cos(a)*42,-48+Math.sin(a)*32]],c,4,.5)}} break;
 case'willow':
  if(m==='us'){root(ctx,0,0,0,c,0);st(ctx,[[0,0],[0,-120*q]],c,15,.9);circ(ctx,0,-120*q,24,c2)}
  if(m==='ds'){for(let i=-1;i<=1;i++)st(ctx,[[0,-2],[i*65*q,-5]],c,8,.9)}
  if(m==='ss'){st(ctx,[[5,-48],[135*q,-48]],c,9,1);circ(ctx,135*q,-48,15,c2)}
  if(m==='uh'){fill(ctx,[[-28,-145*q],[28,-145*q],[28,0],[-28,0]],c,.55);root(ctx,-15,-105*q,75,c2,.8);root(ctx,15,-95*q,-75,c2,.8)}
  if(m==='dh'){for(let i=0;i<6;i++){let a=i/6*TAU;st(ctx,[[0,-48],[Math.cos(a)*55*q,-48+Math.sin(a)*38*q]],c,7,.8);circ(ctx,Math.cos(a)*55*q,-48+Math.sin(a)*38*q,8,c2,.7)}}
  if(m==='sh'){fill(ctx,[[5,-68],[130*q,-65],[155*q,-45],[130*q,-22],[5,-28]],c,.6);st(ctx,[[20,-48],[130*q,-48]],c2,8,.7)}
  if(m==='sp'){for(let i=0;i<10;i++){let a=i/10*TAU;st(ctx,[[0,-48],[Math.cos(a)*(60+75*q),-48+Math.sin(a)*(50+60*q)]],c,7,.75);circ(ctx,Math.cos(a)*(60+75*q),-48+Math.sin(a)*(50+60*q),6,c2)}} break;
 case'cable':
  if(m==='us'){st(ctx,[[-8,-45],[-55,-130*q]],c,8,1);st(ctx,[[8,-45],[55,-130*q]],c,8,1);spark(ctx,-55,-130*q,15,c2,.7);spark(ctx,55,-130*q,15,c2,.7)}
  if(m==='ds'){st(ctx,[[0,-5],[65*q,-5]],c,8,1);st(ctx,[[0,-5],[-65*q,-5]],c,8,1);wave(ctx,0,-5,65*q,10,c2,.7)}
  if(m==='ss'){st(ctx,[[0,-48],[145*q,-48]],c,9,1);for(let i=0;i<5;i++)circ(ctx,i*28*q,-48,4,c2,.8)}
  if(m==='uh'){st(ctx,[[-8,-45],[-45,-130*q]],c,9,1);st(ctx,[[8,-45],[45,-130*q]],c,9,1);spark(ctx,0,-130*q,30,c2,.8)}
  if(m==='dh'){st(ctx,[[-55*q,-5],[55*q,-5]],c,9,1);wave(ctx,0,-5,55*q,12,c2,.9)}
  if(m==='sh'){st(ctx,[[5,-48],[125*q,-48]],c,9,1);for(let i=0;i<5;i++)circ(ctx,(25+i*25)*q,-48,5,c2,.8)}
  if(m==='sp'){st(ctx,[[-5,-48],[70*q,-48]],c,11,1);st(ctx,[[5,-48],[115*q,-48]],c,11,1);circ(ctx,115*q,-48,24,c2);spark(ctx,115*q,-48,38,c2,.8)} break;
 case'snodvor':
  if(m==='us'){fill(ctx,[[-14,-5],[14,-5],[0,-130*q]],c,.85);circ(ctx,0,-130*q,16,c2)}
  if(m==='ds'){circ(ctx,0,-5,32+18*q,c,.5);for(let i=0;i<8;i++)circ(ctx,Math.cos(i/8*TAU)*(25+18*q),-5+Math.sin(i/8*TAU)*20,4,c2,.7)}
  if(m==='ss'){fill(ctx,[[4,-58],[120*q,-48],[4,-38]],c,.85);circ(ctx,120*q,-48,16,c2)}
  if(m==='uh'){fill(ctx,[[-35,-145*q],[35,-145*q],[35,-35*q],[-35,-35*q]],c,.55);circ(ctx,0,-145*q,28,c2);for(let i=-1;i<=1;i++)st(ctx,[[0,-90*q],[i*35,-130*q]],c2,4,.6)}
  if(m==='dh'){fill(ctx,[[-32,-135*q],[32,-135*q],[32,0],[-32,0]],c,.6);circ(ctx,0,0,35,c2);spark(ctx,0,0,42,c2,.7)}
  if(m==='sh'){wave(ctx,75*q,-48,75,30,c,.8);fill(ctx,[[100*q,-78],[160*q,-48],[100*q,-18]],c2,.7)}
  if(m==='sp'){circ(ctx,0,-48,35+50*q,c,.45);for(let i=0;i<8;i++)circ(ctx,Math.cos(i/8*TAU)*(55+65*q),-48+Math.sin(i/8*TAU)*(40+55*q),10,c2,.8)} break;
 case'kirsten':
  if(m==='us'){circ(ctx,0,-110*q,13,c,.9);circ(ctx,0,-75*q,8,c2,.8);spark(ctx,0,-110*q,20,c2,.6)}
  if(m==='ds'){for(let i=-1;i<=1;i++)circ(ctx,i*28*q,-8,9,c,.9);if(t>.55)spark(ctx,0,-5,40,c2,.9)}
  if(m==='ss'){circ(ctx,120*q,-48,13,c,.95);st(ctx,[[0,-48],[120*q,-48]],c2,3,.6)}
  if(m==='uh'){for(let i=0;i<4;i++){let x=-25+i*17,y=-65-i*18*q;circ(ctx,x,y,12,c,.9);if(i)t>.2&&spark(ctx,x,y,18,c2,.5)}}
  if(m==='dh'){for(let i=0;i<5;i++)circ(ctx,(i-2)*30*q,-48,12,c,.9);if(t>.55)spark(ctx,0,-48,55,c2,.9)}
  if(m==='sh'){fill(ctx,[[10,-60],[145*q,-60],[145*q,-36],[10,-36]],c,.85);for(let i=0;i<8;i++)circ(ctx,(20+i*17)*q,-48,5,c2,.7)}
  if(m==='sp'){circ(ctx,85*q,-48,52+20*q,c,.65);circ(ctx,85*q,-48,22,c2,.85);spark(ctx,85*q,-48,62,c2,.9,12)} break;
 case'volt':
  if(m==='us'){st(ctx,[[0,-5],[0,-120*q]],c,18,.9);wave(ctx,0,-120*q,22,10,c2,.9);circ(ctx,0,-120*q,18,c2)}
  if(m==='ds'){wave(ctx,0,0,36,12,c,1);ring(ctx,0,0,36,c2,3,.8)}
  if(m==='ss'){fill(ctx,[[5,-68],[125*q,-48],[5,-28]],c,.75);st(ctx,[[5,-48],[125*q,-48]],c2,4,.9)}
  if(m==='uh'){for(let i=0;i<3;i++)wave(ctx,-5+i*8,-20,25+i*4,110*q,c2,.7);}
  if(m==='dh'){wave(ctx,0,-4,85*q,20,c,.95);ring(ctx,0,-4,25,c2,3,.7)}
  if(m==='sh'){fill(ctx,[[5,-80],[145*q,-60],[160*q,-48],[145*q,-36],[5,-16]],c,.7);wave(ctx,82*q,-48,70*q,14,c2,.9)}
  if(m==='sp'){circ(ctx,85*q,-48,48,c,.35);circ(ctx,85*q,-48,28,c2,.7);wave(ctx,85*q,-48,80*q,25,c2,.8)} break;
 case'temple':
  if(m==='us'){circ(ctx,0,-115*q,18,c,.7);st(ctx,[[0,-20],[0,-115*q]],c2,4,.8);spark(ctx,0,-115*q,24,c2,.7)}
  if(m==='ds'){fill(ctx,[[-55,-5],[55,-5],[55,19],[-55,19]],c,.45);for(let i=0;i<5;i++)st(ctx,[[(-50+i*25),-5],[(-40+i*25),-25]],c2,4,.6)}
  if(m==='ss'){circ(ctx,105*q,-48,14,c,.9);st(ctx,[[8,-48],[105*q,-48]],c2,5,.7)}
  if(m==='uh'){st(ctx,[[0,-15],[0,-130*q]],c,10,1);circ(ctx,0,-130*q,20,c2);spark(ctx,0,-130*q,25,c2,.8)}
  if(m==='dh'){fill(ctx,[[-80,-8],[80*q,-8],[80*q,20],[-80,20]],c,.5);for(let i=0;i<4;i++)circ(ctx,(-60+i*40)*q,-35,12,c2,.8)}
  if(m==='sh'){st(ctx,[[5,-48],[150*q,-48]],c,10,1);for(let i=0;i<3;i++)circ(ctx,(70+i*30)*q,-48+(i-1)*15,10,c2,.8)}
  if(m==='sp'){circ(ctx,80*q,-48,50,c,.55);for(let i=0;i<6;i++){let a=i/6*TAU;circ(ctx,80*q+Math.cos(a)*32,-48+Math.sin(a)*32,10,c2,.85)}} break;
 case'nightmare':
  if(m==='us'){ghost(ctx,0,-100*q,24,c2,.8);circ(ctx,0,-110*q,24,c,.25)}
  if(m==='ds'){ghost(ctx,0,-55*q,20,c2,.7);st(ctx,[[0,0],[0,-55*q]],c,8,.5)}
  if(m==='ss'){ghost(ctx,105*q,-48,28,c2,.8);st(ctx,[[10,-48],[105*q,-48]],c,6,.5)}
  if(m==='uh'){ghost(ctx,0,-145*q,35,c2,.85);for(let i=0;i<3;i++)st(ctx,[[-25+i*25,-100*q],[0,-145*q]],c,4,.5)}
  if(m==='dh'){circ(ctx,0,0,40+18*q,c,.3);ghost(ctx,0,-48,25,c2,.7);ring(ctx,0,0,40+18*q,c2,4,.7)}
  if(m==='sh'){ghost(ctx,145*q,-48,38,c2,.85);st(ctx,[[5,-48],[145*q,-48]],c,9,.5)}
  if(m==='sp'){circ(ctx,0,-48,48,c,.3);for(let i=0;i<6;i++)ghost(ctx,Math.cos(i/6*TAU)*32,-48+Math.sin(i/6*TAU)*32,14,c2,.75);ghost(ctx,0,-48,45,c2,.75)} break;
 case'hazel':
  if(m==='us'){st(ctx,[[0,0],[0,-120*q]],c,9,.9);circ(ctx,0,-120*q,15,c2);spark(ctx,0,-120*q,22,c2,.7)}
  if(m==='ds'){circ(ctx,0,-5,35,c,.4);for(let i=-1;i<=1;i++)st(ctx,[[0,-5],[i*65*q,-5]],c2,6,.8)}
  if(m==='ss'){st(ctx,[[5,-48],[125*q,-48]],c,8,1);circ(ctx,125*q,-48,13,c2)}
  if(m==='uh'){fill(ctx,[[-30,-145*q],[30,-145*q],[30,-15],[-30,-15]],c,.45);for(let i=-1;i<=1;i++)st(ctx,[[0,-105*q],[i*45,-90*q]],c2,7,.8)}
  if(m==='dh'){for(let i=0;i<6;i++){let a=i/6*TAU;circ(ctx,Math.cos(a)*55*q,-48+Math.sin(a)*35*q,11,c,.8);st(ctx,[[0,-48],[Math.cos(a)*55*q,-48+Math.sin(a)*35*q]],c2,4,.55)}}
  if(m==='sh'){fill(ctx,[[5,-72],[130*q,-58],[150*q,-45],[130*q,-30],[5,-24]],c,.55);st(ctx,[[15,-48],[130*q,-48]],c2,7,.8)}
  if(m==='sp'){circ(ctx,0,-48,45,c,.35);for(let i=0;i<8;i++){let a=i/8*TAU;st(ctx,[[0,-48],[Math.cos(a)*(65+65*q),-48+Math.sin(a)*(48+48*q)]],c,6,.7);circ(ctx,Math.cos(a)*(65+65*q),-48+Math.sin(a)*(48+48*q),6,c2)}} break;
 case'whami':
  if(m==='us'){circ(ctx,0,-100*q,16,c,.8);st(ctx,[[0,0],[0,-100*q]],c2,5,.8)}
  if(m==='ds'){circ(ctx,0,-5,30,c,.45);circ(ctx,0,25*q,20,c2,.55);spark(ctx,0,-5,38,c,.7)}
  if(m==='ss'){circ(ctx,55*q,-48,15,c,.8);circ(ctx,95*q,-48,19,c2,.8);circ(ctx,140*q,-48,26,c,.8);st(ctx,[[55*q,-48],[140*q,-48]],c2,4,.6)}
  if(m==='uh'){st(ctx,[[0,-20],[0,-145*q]],c,26,.8);circ(ctx,0,-145*q,35,c2);ring(ctx,0,-145*q,40,c,4,.6)}
  if(m==='dh'){circ(ctx,0,-5,42,c,.5);spark(ctx,0,-5,52,c2,.8)}
  if(m==='sh'){circ(ctx,55*q,-48,15,c,.8);circ(ctx,95*q,-48,19,c2,.8);circ(ctx,140*q,-48,26,c,.8)}
  if(m==='sp'){circ(ctx,80*q,-48,48,c,.45);for(let i=0;i<5;i++)circ(ctx,(55+i*12)*q,-48+(i-2)*13,10,i%2?c2:c,.85);spark(ctx,80*q,-48,58,c2,.8)} break;
 case'controller':
  if(m==='us'){st(ctx,[[0,-5],[0,-120*q]],c,10,.7);circ(ctx,0,-120*q,19,c2,.9);ring(ctx,0,-120*q,26,c2,3,.7)}
  if(m==='ds'){circ(ctx,0,5,35,c,.35);for(let i=0;i<4;i++)st(ctx,[[Math.cos(i/4*TAU)*45,-48+Math.sin(i/4*TAU)*30],[0,5]],c2,4,.6)}
  if(m==='ss'){circ(ctx,125*q,-48,19,c2);st(ctx,[[8,-48],[125*q,-48]],c,6,.7)}
  if(m==='uh'){for(let i=0;i<3;i++){let x=(i-1)*35*q,y=-80-35*q;circ(ctx,x,y,13,c2,.85);st(ctx,[[x,y],[x,-140*q]],c,4,.6)}}
  if(m==='dh'){circ(ctx,0,0,45,c,.35);for(let i=0;i<4;i++){let a=i/4*TAU;st(ctx,[[Math.cos(a)*45*q,-48+Math.sin(a)*30*q],[0,0]],c2,7,.65)}}
  if(m==='sh'){circ(ctx,80*q,-48,20,c,.8);circ(ctx,140*q,-48,20,c2,.8);st(ctx,[[80*q,-48],[140*q,-48]],c,8,.7)}
  if(m==='sp'){circ(ctx,0,-48,34,c,.4);for(let i=0;i<8;i++){let a=i/8*TAU;st(ctx,[[Math.cos(a)*58*q,-48+Math.sin(a)*48*q],[0,-48]],c2,5,.7);circ(ctx,Math.cos(a)*58*q,-48+Math.sin(a)*48*q,11,c,.7)}} break;
 case'evil':
  if(m==='us'){circ(ctx,0,-112*q,14,c2,.8);ring(ctx,0,-112*q,20,c2,2,.6)}
  if(m==='ds'){ring(ctx,0,0,18+16*q,c2,3,.8);circ(ctx,0,0,8,c,.8)}
  if(m==='ss'){st(ctx,[[8,-50],[135*q,-50]],c2,3,1)}
  if(m==='uh'){fill(ctx,[[-10,-145*q],[10,-145*q],[10,0],[-10,0]],c,.18);st(ctx,[[0,0],[0,-145*q]],c2,4,.9)}
  if(m==='dh'){fill(ctx,[[-55*q,-8],[55*q,-8],[55*q,-3],[-55*q,-3]],c,.25);st(ctx,[[-55*q,-5],[55*q,-5]],c2,2,.9)}
  if(m==='sh'){st(ctx,[[5,-48],[150*q,-48]],c2,3,1)}
  if(m==='sp'){circ(ctx,70*q,-48,45*q+18,c2,.22);ring(ctx,70*q,-48,45*q+18,c2,3,.9)} break;
 case'life':
  if(m==='us'){fill(ctx,[[-28,-110*q],[28,-110*q],[28,-90*q],[-28,-90*q]],c,.7);circ(ctx,0,-110*q,24,c2)}
  if(m==='ds'){circ(ctx,0,-10,30,c,.35);ring(ctx,0,-10,42,c2,4,.7)}
  if(m==='ss'){st(ctx,[[5,-48],[125*q,-48]],c,10,.8);circ(ctx,125*q,-48,18,c2)}
  if(m==='uh'){for(let i=0;i<4;i++)fill(ctx,[[-28+i*4,-35-i*28*q],[28-i*4,-35-i*28*q],[28-i*4,-11-i*28*q],[-28+i*4,-11-i*28*q]],c,.45);circ(ctx,0,-145*q,27,c2)}
  if(m==='dh'){circ(ctx,0,0,42*q+18,c,.4);ring(ctx,0,0,42*q+18,c2,5,.8)}
  if(m==='sh'){wave(ctx,85*q,-48,85*q,24,c,.9);wave(ctx,85*q,-48,55*q,13,c2,.8)}
  if(m==='sp'){circ(ctx,0,-48,42,c,.3);ring(ctx,0,-48,65*q+25,c2,6,.8);circ(ctx,0,-48,18,c2)} break;
 case'death':
  if(m==='us'){st(ctx,[[0,-15],[0,-115*q]],c,10,.7);circ(ctx,0,-115*q,17,c2);ring(ctx,0,-115*q,25,c2,3,.7)}
  if(m==='ds'){circ(ctx,0,0,26,c,.3);ring(ctx,0,0,26,c2,4,.8);circ(ctx,0,-35,16,c2,.7)}
  if(m==='ss'){st(ctx,[[5,-50],[150*q,-50]],c2,3,.9);ring(ctx,75*q,-48,12,c2,2,.5)}
  if(m==='uh'){st(ctx,[[0,0],[0,-135*q]],c,15,.55);ring(ctx,0,-135*q,25,c2,5,.8)}
  if(m==='dh'){ring(ctx,0,-48,40+20*q,c2,6,.8);circ(ctx,0,-48,10,c,.7)}
  if(m==='sh'){st(ctx,[[5,-50],[150*q,-50]],c2,5,.8);ring(ctx,75*q,-48,15,c2,2,.5)}
  if(m==='sp'){circ(ctx,0,-48,45,c,.25);ring(ctx,0,-48,60*q+30,c2,5,.8)} break;
 case'mercy':
  if(m==='us'){circ(ctx,0,-105*q,25,c2,.55);ring(ctx,0,-105*q,32,c2,4,.8);st(ctx,[[-30,-5],[30,-5]],c,5,.7)}
  if(m==='ds'){ring(ctx,0,0,35,c2,5,.8);wave(ctx,0,0,35,10,c,.8)}
  if(m==='ss'){st(ctx,[[5,-48],[115*q,-48]],c,9,.8);circ(ctx,115*q,-48,18,c2);ring(ctx,115*q,-48,27,c2,3,.7)}
  if(m==='uh'){st(ctx,[[-25,-20],[-25,-120*q]],c,7,.7);st(ctx,[[25,-20],[25,-120*q]],c2,7,.7);ring(ctx,0,-120*q,25,c2,4,.8)}
  if(m==='dh'){ring(ctx,0,-5,40,c2,5,.8);for(let i=0;i<4;i++){let a=i/4*TAU;circ(ctx,Math.cos(a)*38*q,-5+Math.sin(a)*25*q,9,c,.7)}}
  if(m==='sh'){fill(ctx,[[5,-70],[115*q,-58],[145*q,-48],[115*q,-38],[5,-26]],c,.35);wave(ctx,75*q,-48,70*q,16,c2,.9)}
  if(m==='sp'){circ(ctx,0,-48,45,c2,.28);ring(ctx,0,-48,65*q+25,c2,7,.9);wave(ctx,0,-48,65*q+25,20,c,.8)} break;
 }
}

export function getGen5RestHitboxes(charId,move,t,facing=1){const id=String(charId||'').replace(/^g5_/,'');return mirror(H(id,move,t),facing<0?-1:1)}
export function drawGen5RestAttack(ctx,x,y,color,p,facing,charId,move){const id=String(charId||'').replace(/^g5_/,'');const cc=TA(id);ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);A(ctx,id,move,p,cc[0],cc[1]);ctx.restore()}
export function drawGen5RestSuper(ctx,x,y,p,facing,charId){drawGen5RestAttack(ctx,x,y,null,p,facing,charId,'sp')}
export const GEN5_REST_IDS=['black','magenta','indigo','maroon','crimson','scarlet','white','silver','corpent','magneto','willow','cable','snodvor','kirsten','volt','temple','nightmare','hazel','whami','controller','evil','life','death','mercy'];
export const GEN5_REST_ATTACK_NAMES={
 black:['Lightning Circle','Lightning Dome','Lightning Bolt','Rising Bolts','Orbiting Lightning','Large Lightning Bolt','Thunderstrike'],
 magenta:['Sticky Launch','Glue Patch','Glue Shot','Glue Pole','Adhesive Trap','Glue Wall','Absolute Adhesion'],
 indigo:['Reverse Pull','Heavy Point','Gravity Shift','Vertical Flip','Gravity Well','Orbit','Gravitational Collapse'],
 maroon:['Energy Return','Energy Sink','Stored Shot','Energy Column','Power Dump','Overcharged Strike','Full Release'],
 crimson:['Element Spear','Element Shield','Element Blade','Element Lance','Element Armor','Element Greatblade','Unstable Core'],
 scarlet:['Spectral Rise','Grave Pulse','Spirit Slash','Phantom Column','Spirit Circle','Spectral Charge','Legion Break'],
 white:['Sky Kick','Dive Brake','Flight Dash','Vertical Rush','Meteor Dive','Spiral Flight','Heavenfall'],
 silver:['Steel Uppercut','Iron Drop','Metal Shoulder','Steel Rising','Meteor Body','Iron Charge','Living Fortress'],
 corpent:['Hammer Lift','Hammer Drop','Hammer Jab','Rising Hammer','Construction Drop','Homing Swing','Wrecking Blow'],
 magneto:['Magnetic Lift','Metal Crash','Pull','Magnetic Launch','Magnetic Pile','Rail Shot','Magnetic Singularity'],
 willow:['Vine Lift','Root Snap','Vine Lash','Tree Rise','Root Cage','Forest Ram','Corrupted Grove'],
 cable:['Whip Lift','Ground Current','Shock Lash','Twin Whips','Electric Snare','Chain Lightning','Overload Chain'],
 snodvor:['Ice Spike','Snow Burst','Ice Shard','Glacier Rise','Icefall','Frozen Wave','Absolute Freeze'],
 kirsten:['Ignition Point','Flash Ignite','Flame Pin','Ignition Column','Delayed Burn','Flame Line','Controlled Detonation'],
 volt:['Sonic Lift','Bass Drop','Sonic Burst','Frequency Column','Resonance Slam','Shatterwave','Devastating Frequency'],
 temple:['Dismantle Strike','Ground Break','Break Touch','Structural Collapse','Split Ground','Dismantle Sweep','Complete Dismantling'],
 nightmare:['Fear Rise','Nightmare Grip','Fright Step','Falling Fear','Dream Pit','Nightmare Charge','Worst Fear'],
 hazel:['Thorn Bloom','Poison Root','Thorn Shot','Cursed Tree','Poison Garden','Root Beast','Black Bloom'],
 whami:['Growth Flask','Acid Flask','Explosion Flask','Giant Potion','Poison Mix','Alchemical Chain','Grand Alchemy'],
 controller:['Controlled Lift','Forced Drop','Puppet Throw','Matter Orbit','Compression','Forced Collision','Total Control'],
 evil:['Erase Point','Vanish Mark','Erasure Swipe','Missing Space','Erased Ground','Null Edge','Absolute Erasure'],
 life:['New Beginning','Renew','Possibility','Growth Spiral','Rebirth Pulse','Expansion Wave','Second Chance'],
 death:['Final Rise','Closing Point','Final Step','Last Ascent','End Point','Closure','The End'],
 mercy:['Gentle Lift','Restraint','Forgiving Palm','Balance Rise','Compassion Field','Equilibrium',"Mercy's Balance"]
};
