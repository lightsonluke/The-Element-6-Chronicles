// Generation III — hand-authored attack animation + exact local hitbox geometry.
// Every attack is drawn in fighter-local coordinates and mirrored by facing.
const TAU=Math.PI*2;
const C={
  g3_takeshi:'#D8B27A',g3_aiko:'#EDE2D2',g3_haru:'#BDEBFF',g3_chiyo:'#76D63A',g3_emi:'#D65A6A',
  g3_nozomi:'#4FAE46',g3_masaru:'#9B9084',g3_ryo:'#C9D9E1',g3_souta:'#B9A99B',g3_ogata:'#6CB9FF',g3_kanenobu:'#D8B33F'
};
const clamp=v=>Math.max(0,Math.min(1,v));
function save(ctx,x,y,f=1){ctx.save();ctx.translate(x,y);ctx.scale(f||1,1);}
function stroke(ctx,col,w=3,a=1){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=a;ctx.lineCap='round';ctx.lineJoin='round';}
function fill(ctx,col,a=1){ctx.fillStyle=col;ctx.globalAlpha=a;}
function glow(ctx,col,blur=12){ctx.shadowColor=col;ctx.shadowBlur=blur;}
function circ(ctx,x,y,r,col,a=1){fill(ctx,col,a);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
function line(ctx,x1,y1,x2,y2,col,w=4,a=1){stroke(ctx,col,w,a);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function poly(ctx,pts,col,fillIt=true,a=1,w=3){if(fillIt)fill(ctx,col,a);else stroke(ctx,col,w,a);ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();fillIt?ctx.fill():ctx.stroke();}
function ellipse(ctx,x,y,rx,ry,rot,col,a=1,w=3){stroke(ctx,col,w,a);ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,TAU);ctx.stroke();}
function ring(ctx,x,y,r,col,a=1,w=3){ellipse(ctx,x,y,r,r*.62,0,col,a,w);}
function sparks(ctx,x,y,col,n=7,p=.5){for(let i=0;i<n;i++){const a=i/n*TAU+p*TAU*1.7,r=8+28*((i*7)%10)/10;line(ctx,x+Math.cos(a)*r*.35,y+Math.sin(a)*r*.35,x+Math.cos(a)*r,y+Math.sin(a)*r,col,1.5,.75);}}
function sand(ctx,x,y,s,a=1){fill(ctx,'#C8A16A',a);ctx.beginPath();ctx.arc(x,y,s,0,TAU);ctx.fill();fill(ctx,'#E1C58B',a*.8);ctx.beginPath();ctx.arc(x-s*.25,y-s*.18,s*.35,0,TAU);ctx.fill();}
function bone(ctx,x1,y1,x2,y2,w,col,a=1){line(ctx,x1,y1,x2,y2,col,w,a);circ(ctx,x1,y1,w*.52,col,a);circ(ctx,x2,y2,w*.52,col,a);}
function glass(ctx,pts,col,a=.8,w=2){poly(ctx,pts,col,false,a,w);line(ctx,pts[0][0],pts[0][1],pts[Math.floor(pts.length/2)][0],pts[Math.floor(pts.length/2)][1],'#FFFFFF',1,a*.8);}
function venom(ctx,x,y,r,col,a=1){circ(ctx,x,y,r,col,a);circ(ctx,x-r*.25,y-r*.25,r*.3,'#B8FF67',a*.7);}
function vine(ctx,pts,col,w=8,a=1,thorns=true){stroke(ctx,col,w,a);ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();if(thorns){for(let i=1;i<pts.length;i++){const [x,y]=pts[i];poly(ctx,[[x,y],[x-5,y-10],[x+5,y-5]],col,true,a);}}}
function ash(ctx,x,y,r,a=1){circ(ctx,x,y,r,'#7E756D',a*.65);circ(ctx,x+r*.25,y-r*.2,r*.45,'#B0A69C',a*.35);}
function mist(ctx,x,y,rx,ry,a=.5){fill(ctx,'#DCEAF0',a);ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function tech(ctx,x,y,s=1,col='#6CB9FF'){stroke(ctx,col,3,.9);ctx.strokeRect(x-14*s,y-14*s,28*s,28*s);line(ctx,x-10*s,y,x+10*s,y,col,2);line(ctx,x,y-10*s,x,y+10*s,col,2);circ(ctx,x,y,4*s,'#D8F2FF');}
function guard(ctx,x,y,flip=1,col='#7E8791'){fill(ctx,col);ctx.fillRect(x-9,y-26,18,30);ctx.fillStyle='#B9C1C8';ctx.fillRect(x-15,y-20,8,22);ctx.fillRect(x+7,y-20,8,22);stroke(ctx,'#E7EDF2',2);ctx.beginPath();ctx.arc(x,y-34,9,0,TAU);ctx.stroke();}
function cane(ctx,x,y,col){line(ctx,x,y-4,x+42,y-46,col,7);ctx.beginPath();ctx.arc(x+42,y-48,9,Math.PI*.15,Math.PI*1.35);ctx.stroke();}
function cable(ctx,x1,y1,x2,y2,col='#6CB9FF'){stroke(ctx,col,2);ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,y1+18,x2,y2);ctx.stroke();}

function drawTakeshi(ctx,p,m){const c=C.g3_takeshi; if(m==='ss'){line(ctx,15,-45,48+65*p,-48-Math.sin(p*Math.PI)*22,c,8);for(let i=0;i<5;i++)sand(ctx,42+i*13*p,-49+Math.sin(i+p*3)*5,5,c?1:1);}
else if(m==='us'){const h=110*p;for(let i=0;i<7;i++)sand(ctx,(i-3)*5,-8-h*(i/7),7);poly(ctx,[[-18,-10],[18,-10],[9,-105],[-9,-105]],c,true,.7);poly(ctx,[[-9,-105],[9,-105],[0,-132]],'#E8D09A',true,.95);}
else if(m==='ds'){for(let i=0;i<9;i++){const a=i/9*TAU,r=18+12*p;sand(ctx,Math.cos(a)*r,-8+Math.sin(a)*r*.45,7);}ring(ctx,0,-8,30,c,.7,4);}
else if(m==='uh'){poly(ctx,[[-25,-5],[25,-5],[18,-145],[-18,-145]],c,true,.85);for(let i=0;i<5;i++)poly(ctx,[[0,-125],[35+8*i,-155+i*7],[52+8*i,-135+i*5],[15,-115]],'#E5C78B',true,.85);}
else if(m==='dh'){for(let i=0;i<11;i++){const a=i/10*TAU;const r=35+18*p;sand(ctx,Math.cos(a)*r,-15+Math.sin(a)*r*.5,10);}ring(ctx,0,-12,52,c,.45,5);}
else if(m==='sh'){poly(ctx,[[18,-78],[130,-60],[130,-15],[18,-30]],c,true,.95);for(let i=0;i<9;i++)sand(ctx,45+i*9,-42+(i%3)*8,5);poly(ctx,[[130,-60],[145,-38],[130,-15]],'#E5C78B',true,.9);}
else {for(let i=0;i<20;i++){const a=i/20*TAU;const r=18+p*82;sand(ctx,Math.cos(a)*r,-42+Math.sin(a)*r*.65,5);}ring(ctx,0,-42,20+82*p,c,.7,4);sparks(ctx,0,-42,'#E8D09A',10,p);}}
function drawAiko(ctx,p,m){const c=C.g3_aiko;if(m==='ss'){bone(ctx,15,-45,62+28*p,-44,16,c);poly(ctx,[[62+28*p,-44],[78+28*p,-51],[72+28*p,-36]],c,true);}
else if(m==='us'){bone(ctx,14,-42,18,-120-30*p,17,c);bone(ctx,18,-120-30*p,18,-148-25*p,12,'#FFF6EA');}
else if(m==='ds'){bone(ctx,-24,-10,-38,-42,15,c);bone(ctx,24,-10,38,-42,15,c);poly(ctx,[[-44,-44],[0,-58],[44,-44],[38,-30],[-38,-30]],c,true,.9);}
else if(m==='uh'){for(let i=0;i<5;i++)bone(ctx,0,-45-i*14,(-10+i*5),-95-i*13,10,c);bone(ctx,0,-92,0,-160,12,c);}
else if(m==='dh'){for(let i=0;i<5;i++){const x=-58+i*29;ctx.beginPath();ctx.arc(x,-5,25,Math.PI,TAU);ctx.strokeStyle=c;ctx.lineWidth=9;ctx.stroke();}for(let i=0;i<4;i++)line(ctx,-42+i*28,-6,-32+i*28,-52,c,7);}
else if(m==='sh'){const pts=[];for(let i=0;i<=14;i++){const a=-1.1+i/14*2.2;pts.push([20+Math.cos(a)*105,-48+Math.sin(a)*105]);}poly(ctx,pts,c,true,.85);poly(ctx,[[20,-48],[126,-75],[135,-48],[126,-21]],'#FFF7ED',true,.65);}
else {poly(ctx,[[15,-100],[55,-82],[70,-20],[15,0],[-15,-5],[-42,-65]],c,true,.85);bone(ctx,35,-55,145,-35,30,c);poly(ctx,[[145,-35],[172,-55],[165,-18]],c,true);for(let i=0;i<8;i++)sparks(ctx,70,-45,'#FFF7ED',2,p);}}
function drawHaru(ctx,p,m){const c=C.g3_haru;if(m==='ss'){glass(ctx,[[15,-62],[105,-62],[105,-55],[15,-55]],c,.8,3);line(ctx,18,-58,100,-58,'#FFFFFF',1,.9);}
else if(m==='us'){for(let i=0;i<5;i++){glass(ctx,[[-18+i*9,-8],[18+i*9,-8],[10+i*9,-125],[-10+i*9,-125]],c,.7,2);}poly(ctx,[[0,-130],[7,-150],[14,-130],[-14,-130]],'#FFFFFF',true,.8);}
else if(m==='ds'){poly(ctx,[[-72,-4],[72,-4],[55,-28],[-55,-28]],c,false,.7,3);for(let i=0;i<8;i++){const a=i/8*TAU;line(ctx,0,-16,Math.cos(a)*70,-16+Math.sin(a)*18,c,2,.8);}}
else if(m==='uh'){for(let i=0;i<6;i++){const a=i/6*TAU+p*1.4;const x=Math.cos(a)*30;glass(ctx,[[x-8,-10],[x+8,-10],[x+12,-140],[x-12,-140]],c,.7,2);}sparks(ctx,0,-120,'#FFFFFF',8,p);}
else if(m==='dh'){poly(ctx,[[-90,-8],[90,-8],[80,-35],[-80,-35]],c,false,.75,4);for(let i=0;i<10;i++){const x=-80+i*18;line(ctx,x,-25,x+(i%2?12:-12),-70,c,2,.8);}}
else if(m==='sh'){poly(ctx,[[25,-105],[135,-105],[135,-5],[25,-5]],c,true,.32);line(ctx,25,-105,25,-5,'#FFFFFF',3,.9);line(ctx,135,-105,135,-5,'#FFFFFF',5,.9);}
else {for(let i=0;i<16;i++){const a=i/16*TAU;const r=18+70*p;const x=Math.cos(a)*r,y=-48+Math.sin(a)*r*.7;glass(ctx,[[x,y-18],[x+8,y],[x,y+18],[x-8,y]],c,.8,2);}circ(ctx,0,-48,8,'#FFFFFF',.9);}}
function drawChiyo(ctx,p,m){const c=C.g3_chiyo;if(m==='ss'){venom(ctx,28+62*p,-50-Math.sin(p*Math.PI)*20,8,c);if(p>.65){for(let i=0;i<6;i++)venom(ctx,90+(i-3)*6,-50+(i%2)*9,4,c);}}
else if(m==='us'){venom(ctx,0,-20-105*p,9,c);if(p>.65)for(let i=0;i<7;i++)venom(ctx,(i-3)*6,-125,5,c);}
else if(m==='ds'){for(let i=0;i<8;i++)venom(ctx,(i-3.5)*14,-5,9,c,.7);for(let i=0;i<5;i++)venom(ctx,(i-2)*24,-20-(p*35),5,c);}
else if(m==='uh'){for(let i=0;i<12;i++){const a=i/12*TAU+p*2;venom(ctx,Math.cos(a)*32,-55+Math.sin(a)*75,7,c,.8);}}
else if(m==='dh'){for(let i=0;i<11;i++)venom(ctx,(i-5)*14,-5,10,c,.7);for(let i=0;i<7;i++){const x=-70+i*23;poly(ctx,[[x,-5],[x+7,-50-p*30],[x+14,-5]],c,true,.85);}}
else if(m==='sh'){for(const s of [-1,1]){venom(ctx,18+s*18,-50,16,c);line(ctx,18+s*18,-50,85+s*42,-35,c,13,.9);poly(ctx,[[85+s*42,-35],[115+s*42,-43],[105+s*42,-20]],c,true,.95);}}
else {circ(ctx,55,-50,28,c,.85);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,55+Math.cos(a)*20,-50+Math.sin(a)*15,55+Math.cos(a)*95,-50+Math.sin(a)*55,c,9,.85);}}
}
function drawEmi(ctx,p,m){const c=C.g3_emi;if(m==='ss'){ring(ctx,42+55*p,-48,13,c,.7,3);line(ctx,24,-48,88+55*p,-48,c,3,.6);circ(ctx,88+55*p,-48,7,'#FFFFFF',.9);}
else if(m==='us'){for(let i=0;i<4;i++)ring(ctx,0,-35-30*p-i*5,10+i*3,c,.6,2);poly(ctx,[[-13,-40],[13,-40],[8,-120],[-8,-120]],c,true,.3);}
else if(m==='ds'){ring(ctx,0,-7,20+45*p,c,.55,3);for(let i=0;i<6;i++){const a=i/6*TAU;line(ctx,Math.cos(a)*20,-7+Math.sin(a)*8,Math.cos(a)*(30+35*p),-7+Math.sin(a)*(12+25*p),c,2,.7);}}
else if(m==='uh'){circ(ctx,0,-55,18,c,.35);for(let i=0;i<5;i++){const a=-Math.PI/2+i*.4;line(ctx,0,-55,Math.cos(a)*30,-100-Math.sin(i)*25,c,3,.8);}}
else if(m==='dh'){circ(ctx,0,-5,16,c,.25);ring(ctx,0,-5,42+25*p,c,.7,4);sparks(ctx,0,-5,c,8,p);}
else if(m==='sh'){line(ctx,15,-48,78+35*p,-48,c,8,.9);circ(ctx,78+35*p,-48,12,'#FFFFFF',.8);ring(ctx,78+35*p,-48,18,c,.7,2);}
else {ring(ctx,0,-52,35+65*p,c,.7,3);for(let i=0;i<12;i++){const a=i/12*TAU+p*2;line(ctx,Math.cos(a)*30,-52+Math.sin(a)*20,Math.cos(a)*(55+65*p),-52+Math.sin(a)*(35+65*p),c,2,.7);}circ(ctx,55+65*p*.4,-52,20,c,.8);}}
function drawNozomi(ctx,p,m){const c=C.g3_nozomi;if(m==='ss'){vine(ctx,[[10,-50],[45,-60],[80+55*p,-42-Math.sin(p*Math.PI)*25]],c,7,.95);}
else if(m==='us'){vine(ctx,[[0,-5],[0,-55],[12,-110],[0,-145]],c,12,.95);for(let i=0;i<5;i++)poly(ctx,[[0,-125-i*4],[10,-140-i*4],[16,-128-i*4]],c,true,.9);}
else if(m==='ds'){vine(ctx,[[-15,-5],[-42,-20],[-62,-6]],c,6);vine(ctx,[[15,-5],[42,-20],[62,-6]],c,6);for(let i=0;i<8;i++)poly(ctx,[[-45+i*13,-8],[-39+i*13,-25],[-33+i*13,-8]],c,true,.8);}
else if(m==='uh'){for(let i=0;i<5;i++){const a=-1.3+i*.65;vine(ctx,[[0,-8],[Math.cos(a)*35,-65],[Math.cos(a)*45,-145]],c,10,.9);}}
else if(m==='dh'){for(let i=0;i<8;i++){const a=i/8*TAU;vine(ctx,[[Math.cos(a)*20,-5],[Math.cos(a)*55,-45],[Math.cos(a)*75,-10]],c,8,.9);}}
else if(m==='sh'){vine(ctx,[[18,-52],[55,-70],[100,-45],[145,-35]],c,16,.95);for(let i=0;i<8;i++)poly(ctx,[[45+i*12,-60-i%2*8],[54+i*12,-78-i%2*8],[60+i*12,-58-i%2*8]],c,true,.9);}
else {for(let i=0;i<12;i++){const a=i/12*TAU;vine(ctx,[[0,-45],[Math.cos(a)*55,-45+Math.sin(a)*25],[Math.cos(a)*110,-45+Math.sin(a)*70]],c,9,.9);}}
}
function drawMasaru(ctx,p,m){const c=C.g3_masaru;if(m==='ss'){for(let i=0;i<10;i++)ash(ctx,25+i*7*p,-48+Math.sin(i+p*4)*10,7,.7);}
else if(m==='us'){for(let i=0;i<16;i++)ash(ctx,(Math.sin(i)*20),-10-i*8*p,8,.55);poly(ctx,[[-35,-5],[35,-5],[22,-125],[-22,-125]],c,true,.15);}
else if(m==='ds'){for(let i=0;i<14;i++)ash(ctx,(i-7)*9,-8+Math.sin(i)*5,10,.55);ring(ctx,0,-8,40+25*p,c,.35,4);}
else if(m==='uh'){for(let i=0;i<22;i++){const a=i/22*TAU+p*2;ash(ctx,Math.cos(a)*42,-65+Math.sin(a)*70,7,.55);}}
else if(m==='dh'){for(let i=0;i<18;i++)ash(ctx,(i-9)*9,-5+Math.sin(i)*7,9,.6);for(let i=0;i<9;i++)line(ctx,(i-4)*18,-5,(i-4)*22,-45,c,4,.35);}
else if(m==='sh'){for(let i=0;i<18;i++)ash(ctx,30+i*6*p,-48+Math.sin(i)*8,11,.7);poly(ctx,[[25,-70],[140,-55],[140,-20],[25,-32]],c,true,.7);}
else {circ(ctx,0,-45,35,c,.45);for(let i=0;i<24;i++){const a=i/24*TAU;const r=25+70*p;ash(ctx,Math.cos(a)*r,-45+Math.sin(a)*r*.7,7,.7);}if(p>.55)for(let i=0;i<14;i++)ash(ctx,Math.cos(i)*85,-45+Math.sin(i)*55,6,.6);}}
function drawRyo(ctx,p,m){const c=C.g3_ryo;if(m==='ss'){mist(ctx,25+60*p,-48,24,12,.45);line(ctx,25,-48,85+60*p,-48,'#FFFFFF',4,.4);}
else if(m==='us'){mist(ctx,0,-35-80*p,35,28,.45);mist(ctx,0,-105,25,18,.65);ring(ctx,0,-120,30,c,.45,3);}
else if(m==='ds'){mist(ctx,0,-5,55+20*p,18,.45);mist(ctx,0,-35,35,30,.6);}
else if(m==='uh'){mist(ctx,0,-75,42,80,.35);for(let i=0;i<9;i++){const a=i/9*TAU;mist(ctx,Math.cos(a)*55,-75+Math.sin(a)*65,15,10,.35);}}
else if(m==='dh'){mist(ctx,0,-5,70,25,.55);for(let i=0;i<8;i++){const a=i/8*TAU;line(ctx,Math.cos(a)*55,-5,Math.cos(a)*25,-35,c,4,.55);}}
else if(m==='sh'){mist(ctx,65,-48,55,18,.55);poly(ctx,[[18,-75],[135,-48],[18,-20]],'#EAFBFF',true,.35);line(ctx,18,-48,135,-48,c,10,.7);}
else {circ(ctx,0,-50,38,c,.18);for(let i=0;i<18;i++){const a=i/18*TAU;mist(ctx,Math.cos(a)*(25+60*p),-50+Math.sin(a)*(20+45*p),10,7,.4);}ring(ctx,0,-50,30+65*p,c,.55,3);}}
function drawSouta(ctx,p,m){const c=C.g3_souta;if(m==='ss'){vine(ctx,[[12,-48],[45,-65],[85+45*p,-35]],c,5,.6,false);for(let i=0;i<8;i++)ash(ctx,40+i*7*p,-50+i%2*5,5,.5);}
else if(m==='us'){for(let i=0;i<9;i++)ash(ctx,(i-4)*7,-8-i*13*p,6,.55);circ(ctx,0,-115,15,c,.45);}
else if(m==='ds'){ash(ctx,0,-8,28,.7);if(p>.55){for(let i=0;i<7;i++)ash(ctx,(i-3)*12,-20-(p-.55)*40,6,.75);}}
else if(m==='uh'){for(let i=0;i<18;i++){const a=i/18*TAU+p*3;ash(ctx,Math.cos(a)*(20+35*p),-50-Math.sin(a)*65*p,6,.6);}}
else if(m==='dh'){for(let i=0;i<16;i++)ash(ctx,(i-8)*10,-8,7,.65);poly(ctx,[[-80,-10],[0,-35],[80,-10],[80,4],[-80,4]],c,true,.25);}
else if(m==='sh'){poly(ctx,[[20,-62],[125,-52],[125,-35],[20,-40]],c,true,.55);for(let i=0;i<7;i++)ash(ctx,35+i*12*p,-48,6,.6);poly(ctx,[[125,-52],[150,-43],[125,-35]],'#D7C7B9',true,.7);}
else {const shapes=[[[0,-50],32],[[0,-50],52],[[0,-50],72],[[65,-48],18]];for(let i=0;i<shapes.length;i++){const [[x,y],r]=shapes[i];if(i<3)ring(ctx,x,y,r*(.4+.6*p),c,.45,3);else poly(ctx,[[x-20,-y*.0-65],[x+20,-65],[x+45,-35],[x,-20],[x-35,-35]],c,true,.65);}for(let i=0;i<10;i++)ash(ctx,40+i*6,-45+(i%3)*7,5,.6);}}
function drawOgata(ctx,p,m){const c=C.g3_ogata;if(m==='ss'){tech(ctx,30,-55,1,c);cable(ctx,42,-55,105+40*p,-45,c);poly(ctx,[[95+40*p,-55],[110+40*p,-45],[95+40*p,-35]],c,true,.8);}
else if(m==='us'){tech(ctx,0,-18,1.2,c);line(ctx,0,-35,0,-135,c,12,.55);for(let i=0;i<6;i++)line(ctx,-10+i*4,-40,-10+i*5,-130,c,2,.7);}
else if(m==='ds'){for(let i=0;i<4;i++){tech(ctx,(-45+i*30),-15,.7,c);cable(ctx,(-45+i*30),-15,0,-5,c);}ring(ctx,0,-5,48,c,.45,4);}
else if(m==='uh'){tech(ctx,0,-25,1.4,c);line(ctx,0,-40,0,-155,c,18,.45);circ(ctx,0,-155,18,'#E8F7FF',.8);sparks(ctx,0,-120,c,10,p);}
else if(m==='dh'){for(let i=0;i<4;i++){tech(ctx,-55+i*37,-15,.65,c);cable(ctx,-55+i*37,-15,0,-20,c);}circ(ctx,0,-10,55,c,.15);ring(ctx,0,-10,55,c,.7,5);}
else if(m==='sh'){tech(ctx,20,-50,1.1,c);line(ctx,38,-50,130+55*p,-50,c,12,.6);circ(ctx,130+55*p,-50,20,c,.55);for(let i=0;i<7;i++)sparks(ctx,130+55*p,-50,c,2,p);}
else {tech(ctx,0,-50,1.5,c);for(let i=0;i<8;i++){const a=i/8*TAU;line(ctx,0,-50,Math.cos(a)*(35+75*p),-50+Math.sin(a)*(35+55*p),c,7,.65);}circ(ctx,0,-50,30+40*p,c,.25);}}
function drawKanenobu(ctx,p,m){const c=C.g3_kanenobu;if(m==='ss'){cane(ctx,10,-48,c);line(ctx,35,-70,82+40*p,-48,c,5);}
else if(m==='us'){guard(ctx,25,-8);guard(ctx,-15,-18);for(let i=0;i<3;i++)line(ctx,20+i*6,-50,20+i*6,-125,c,7,.75);}
else if(m==='ds'){guard(ctx,-32,-10);guard(ctx,32,-10);line(ctx,-45,-25,0,-65,c,9,.75);line(ctx,45,-25,0,-65,c,9,.75);ring(ctx,0,-15,50,c,.45,4);}
else if(m==='uh'){for(let i=0;i<4;i++){guard(ctx,-28+i*18,-10-i*15);line(ctx,-28+i*18,-45-i*15,-28+i*18,-100-i*8,c,8,.75);}}
else if(m==='dh'){tech(ctx,28,-12,1,c);for(let i=0;i<7;i++)line(ctx,28,-12,80+i*8,-12,c,4,.35);ring(ctx,28,-12,48,c,.65,4);}
else if(m==='sh'){guard(ctx,58,-15);fill(ctx,'#AAB4BC');ctx.fillRect(25,-78,42,65);stroke(ctx,'#F0D66B',4);ctx.strokeRect(25,-78,42,65);line(ctx,68,-45,145,-45,c,4);}
else {guard(ctx,-30,-5);guard(ctx,30,-5);tech(ctx,0,-45,1.1,c);for(let i=0;i<8;i++){const a=i/8*TAU;line(ctx,0,-45,Math.cos(a)*(45+55*p),-45+Math.sin(a)*(35+45*p),c,6,.7);}cane(ctx,5,-50,c);}}

const DRAW={g3_takeshi:drawTakeshi,g3_aiko:drawAiko,g3_haru:drawHaru,g3_chiyo:drawChiyo,g3_emi:drawEmi,g3_nozomi:drawNozomi,g3_masaru:drawMasaru,g3_ryo:drawRyo,g3_souta:drawSouta,g3_ogata:drawOgata,g3_kanenobu:drawKanenobu};
export const GEN3_ATTACK_NAMES={
 g3_takeshi:{ss:'Sand Lash',us:'Sand Spear',ds:'Sand Sink',uh:'Sand Pillar',dh:'Sand Burial',sh:'Sand Crusher',sp:'Sandstorm Core'},
 g3_aiko:{ss:'Bone Hook',us:'Bone Fang',ds:'Bone Knuckle',uh:'Spine Lance',dh:'Rib Cage',sh:'Bone Greatblade',sp:'Bone Titan'},
 g3_haru:{ss:'Glass Edge',us:'Glass Needle',ds:'Glass Shard',uh:'Glass Cathedral',dh:'Glass Floor',sh:'Glass Guillotine',sp:'Shatterpoint'},
 g3_chiyo:{ss:'Venom Spit',us:'Venom Needle',ds:'Venom Drop',uh:'Venom Column',dh:'Toxic Pool',sh:'Venom Fang',sp:'Venom Bloom'},
 g3_emi:{ss:'Rhythm Step',us:'Pulse Read',ds:'Stabilizing Pulse',uh:'Vital Surge',dh:'Shock Response',sh:'Pulse Counter',sp:'Perfect Read'},
 g3_nozomi:{ss:'Thorn Whip',us:'Thorn Rise',ds:'Root Trap',uh:'Vine Tower',dh:'Briar Cage',sh:'Thorn Ram',sp:'Overgrowth'},
 g3_masaru:{ss:'Ash Shot',us:'Ash Burst',ds:'Ash Scatter',uh:'Ash Column',dh:'Ash Collapse',sh:'Ash Ram',sp:'Ash Devastation'},
 g3_ryo:{ss:'Mist Drift',us:'Mist Step',ds:'Mist Pool',uh:'Cloud Break',dh:'Vanishing Ground',sh:'Fog Blade',sp:'Whiteout'},
 g3_souta:{ss:'Ash Ribbon',us:'Ash Feather',ds:'Ash Footprint',uh:'Ash Spiral',dh:'Ash Wave',sh:'Ash Spear',sp:'Ash Evolution'},
 g3_ogata:{ss:'Injection Shot',us:'Extraction Spike',ds:'Forced Pulse',uh:'Extraction Column',dh:'Overload Field',sh:'Harvest Cannon',sp:'Forced Extraction'},
 g3_kanenobu:{ss:'Cane Strike',us:'Guard Lift',ds:'Command Retreat',uh:'Guard Formation',dh:'Suppression Order',sh:'Armored Escort',sp:'Executive Order'}
};
function drawSuper(ctx,x,y,p,id,facing=1){const c=C[id];save(ctx,x,y,facing||1);const q=clamp(p);if(id==='g3_takeshi'){for(let i=0;i<28;i++){const a=i/28*TAU;const r=35+105*q;sand(ctx,Math.cos(a)*r,-45+Math.sin(a)*r*.65,7,.75);}ring(ctx,0,-45,35+105*q,c,.75,5);}
else if(id==='g3_aiko'){poly(ctx,[[-15,-95],[55,-75],[80,-20],[15,5],[-45,-30]],c,true,.8);bone(ctx,35,-55,155,-30,32,c);}
else if(id==='g3_haru'){for(let i=0;i<30;i++){const a=i/30*TAU;const r=15+95*q;glass(ctx,[[Math.cos(a)*r-10,-48+Math.sin(a)*r*.7-20],[Math.cos(a)*r+10,-48+Math.sin(a)*r*.7],[Math.cos(a)*r-10,-48+Math.sin(a)*r*.7+20]],c,.8,2);}circ(ctx,0,-48,7,'#FFFFFF');}
else if(id==='g3_chiyo'){for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,55,-50,55+Math.cos(a)*(35+70*q),-50+Math.sin(a)*(25+55*q),c,11,.85);}venom(ctx,55,-50,28,c,.9);}
else if(id==='g3_emi'){ring(ctx,0,-50,30+75*q,c,.8,4);for(let i=0;i<12;i++){const a=i/12*TAU;line(ctx,0,-50,Math.cos(a)*(45+70*q),-50+Math.sin(a)*(30+55*q),c,3,.8);}line(ctx,15,-48,110+35*q,-48,c,12,.95);}
else if(id==='g3_nozomi'){for(let i=0;i<18;i++){const a=i/18*TAU;vine(ctx,[[0,-45],[Math.cos(a)*55,-45+Math.sin(a)*25],[Math.cos(a)*(55+75*q),-45+Math.sin(a)*(45+65*q)]],c,10,.9);}}
else if(id==='g3_masaru'){circ(ctx,0,-45,35,c,.55);for(let i=0;i<30;i++){const a=i/30*TAU;ash(ctx,Math.cos(a)*(25+95*q),-45+Math.sin(a)*(18+65*q),8,.75);}}
else if(id==='g3_ryo'){circ(ctx,0,-50,38,c,.2);for(let i=0;i<22;i++){const a=i/22*TAU;mist(ctx,Math.cos(a)*(25+75*q),-50+Math.sin(a)*(20+55*q),12,8,.5);}ring(ctx,0,-50,35+75*q,c,.65,4);}
else if(id==='g3_souta'){ring(ctx,0,-48,20+80*q,c,.6,3);for(let i=0;i<18;i++){const a=i/18*TAU;ash(ctx,Math.cos(a)*(25+70*q),-48+Math.sin(a)*(18+55*q),6,.65);}if(q>.65){poly(ctx,[[35,-70],[130,-55],[130,-25],[35,-35]],c,true,.75);}}
else if(id==='g3_ogata'){for(let i=0;i<6;i++)tech(ctx,Math.cos(i/6*TAU)*48,-50+Math.sin(i/6*TAU)*25,.8,c);circ(ctx,0,-50,30+50*q,c,.35);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,0,-50,Math.cos(a)*(50+65*q),-50+Math.sin(a)*(35+55*q),c,8,.7);}}
else {guard(ctx,-40,-5);guard(ctx,0,-20);guard(ctx,40,-5);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,0,-48,Math.cos(a)*(45+70*q),-48+Math.sin(a)*(35+50*q),c,7,.75);}cane(ctx,0,-50,c);}
ctx.restore();}

export function drawGen3Attack(ctx,x,y,color,p,facing,charId,moveKey){const fn=DRAW[charId];if(!fn)return;save(ctx,x,y,facing||1);fn(ctx,clamp(p),moveKey);ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();}
export function drawGen3Super(ctx,x,y,color,p,charId,facing=1){drawSuper(ctx,x,y,p,charId,facing);}

function H(shape,vals){return {shape,...vals};}
export function getGen3Hitboxes(charId,move,p,facing=1){const q=clamp(p),f=facing||1;const S=(arr)=>arr.map(h=>{if(h.shape==='circle'||h.shape==='box')return {...h,x:h.x*f};if(h.shape==='capsule')return {...h,x1:h.x1*f,x2:h.x2*f};if(h.shape==='polygon')return {...h,points:h.points.map(([x,y])=>[x*f,y])};return h;});let b=[];
switch(charId){
case'g3_takeshi': if(move==='ss')b=[H('capsule',{x1:15,y1:-45,x2:70+55*q,y2:-48,r:9})];else if(move==='us'||move==='uh')b=[H('polygon',{points:[[-18,-10],[18,-10],[10,-115],[-10,-115]]})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-8,r:48+10*q})];else if(move==='sh')b=[H('polygon',{points:[[18,-78],[135,-60],[145,-38],[130,-15],[18,-30]]})];else b=[H('circle',{x:0,y:-42,r:18+84*q})];break;
case'g3_aiko': if(move==='ss')b=[H('capsule',{x1:15,y1:-45,x2:80+20*q,y2:-44,r:9})];else if(move==='us'||move==='uh')b=[H('capsule',{x1:14,y1:-42,x2:18,y2:-145-20*q,r:9})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-15,r:52})];else if(move==='sh')b=[H('polygon',{points:[[20,-48],[95,-120],[140,-48],[95,25]]})];else b=[H('capsule',{x1:35,y1:-55,x2:145,y2:-35,r:30})];break;
case'g3_haru': if(move==='ss')b=[H('box',{x:55+35*q,y:-58,w:82,h:8})];else if(move==='us'||move==='uh')b=[H('box',{x:0,y:-100,w:24,h:100})];else if(move==='ds'||move==='dh')b=[H('box',{x:0,y:-18,w:160,h:18})];else if(move==='sh')b=[H('box',{x:80,y:-55,w:110,h:100})];else b=[H('circle',{x:0,y:-48,r:25+75*q})];break;
case'g3_chiyo': if(move==='ss')b=[H('circle',{x:28+62*q,y:-50,r:10})];else if(move==='us'||move==='uh')b=[H('capsule',{x1:0,y1:-20,x2:0,y2:-125,r:11})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-8,r:65})];else if(move==='sh')b=[H('capsule',{x1:20,y1:-50,x2:110,y2:-35,r:18})];else b=[H('circle',{x:55,y:-50,r:28}),H('circle',{x:115,y:-50,r:20})];break;
case'g3_emi': if(move==='ss'||move==='sh')b=[H('circle',{x:60+35*q,y:-48,r:15})];else if(move==='us'||move==='uh')b=[H('circle',{x:0,y:-105,r:22})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-8,r:45+25*q})];else b=[H('capsule',{x1:15,y1:-48,x2:110,y2:-48,r:12})];break;
case'g3_nozomi': if(move==='ss'||move==='sh')b=[H('capsule',{x1:12,y1:-50,x2:85+55*q,y2:-40,r:10})];else if(move==='us'||move==='uh')b=[H('capsule',{x1:0,y1:-5,x2:10,y2:-145,r:13})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-12,r:70})];else b=[H('circle',{x:0,y:-45,r:110*q+20})];break;
case'g3_masaru': if(move==='ss'||move==='sh')b=[H('capsule',{x1:20,y1:-48,x2:125+35*q,y2:-45,r:16})];else if(move==='us'||move==='uh')b=[H('box',{x:0,y:-75,w:55,h:120})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-8,r:65})];else b=[H('circle',{x:0,y:-45,r:35+70*q})];break;
case'g3_ryo': if(move==='ss'||move==='sh')b=[H('capsule',{x1:20,y1:-48,x2:110,y2:-48,r:15})];else if(move==='us'||move==='uh')b=[H('circle',{x:0,y:-115,r:35})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-15,r:70})];else b=[H('circle',{x:0,y:-50,r:38+75*q})];break;
case'g3_souta': if(move==='ss'||move==='sh')b=[H('capsule',{x1:12,y1:-48,x2:95+45*q,y2:-42,r:9})];else if(move==='us'||move==='uh')b=[H('circle',{x:0,y:-115,r:18})];else if(move==='ds'||move==='dh')b=[H('box',{x:0,y:-10,w:160,h:24})];else b=[H('circle',{x:0,y:-48,r:25+70*q})];break;
case'g3_ogata': if(move==='ss')b=[H('capsule',{x1:40,y1:-55,x2:115+35*q,y2:-45,r:10})];else if(move==='sh')b=[H('circle',{x:125+55*q,y:-50,r:22})];else if(move==='us'||move==='uh')b=[H('box',{x:0,y:-95,w:28,h:120})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-10,r:58})];else b=[H('circle',{x:0,y:-50,r:30+55*q})];break;
case'g3_kanenobu': if(move==='ss')b=[H('capsule',{x1:15,y1:-55,x2:85+40*q,y2:-48,r:9})];else if(move==='us'||move==='uh')b=[H('box',{x:0,y:-85,w:70,h:100})];else if(move==='ds'||move==='dh')b=[H('circle',{x:0,y:-15,r:55})];else if(move==='sh')b=[H('box',{x:70,y:-48,w:90,h:70})];else b=[H('circle',{x:0,y:-48,r:25+70*q})];break;}
return S(b);}
