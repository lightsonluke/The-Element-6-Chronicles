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

function body(ctx, lean=0, lift=0, col='#EAEAEA', a=1){
  stroke(ctx,'#20252B',5,a); line(ctx,lean-7,-62-lift,lean+7,-20-lift,col,12,a);
  circ(ctx,lean,-78-lift,11,col,a);
  line(ctx,lean,-42-lift,lean-18,-8-lift,col,6,a); line(ctx,lean,-42-lift,lean+18,-8-lift,col,6,a);
}

// Detailed character motion pass.  This is deliberately separate from the
// elemental construction so the fighter itself visibly performs each move.
function poseDetail(ctx,p,m,col,lean=0,lift=0,a=1){
  const q=clamp(p), hit=q*q*(3-2*q), wind=1-Math.abs(q-.5)*2;
  const dark='#20252B', hi='#FFFFFF';
  // torso seams / belt / face make the stickman read as a character rather than
  // a collection of attack primitives.
  stroke(ctx,dark,3,a*.9); ctx.beginPath(); ctx.roundRect(lean-8,-61-lift,16,38,5); ctx.stroke();
  line(ctx,lean-8,-30-lift,lean+8,-30-lift,col,3,a*.65);
  circ(ctx,lean-3,-80-lift,1.8,dark,a*.8);
  // legs dynamically brace for the move.
  let backX=-18, frontX=18, kneeB=-8, kneeF=10, footB=-25, footF=28;
  if(m==='us'||m==='uh'){backX=-24;frontX=24;kneeB=-14;kneeF=14;footB=-30;footF=32;}
  if(m==='ds'||m==='dh'){backX=-12;frontX=12;kneeB=-22;kneeF=22;footB=-28;footF=30;}
  if(m==='ss'||m==='sh'){frontX=28+18*hit; kneeF=20+12*hit; footF=42+22*hit;}
  if(m==='sp'){backX=-26;frontX=26;kneeB=-18;kneeF=18;footB=-34;footF=36;}
  line(ctx,lean-5,-24-lift,lean+kneeB,-4-lift,dark,9,a*.95); line(ctx,lean+kneeB,-4-lift,lean+footB,8-lift,dark,7,a*.95);
  line(ctx,lean+5,-24-lift,lean+kneeF,-4-lift,dark,9,a*.95); line(ctx,lean+kneeF,-4-lift,lean+footF,8-lift,dark,7,a*.95);
  line(ctx,lean+footB-5,8-lift,lean+footB+7,8-lift,dark,4,a); line(ctx,lean+footF-5,8-lift,lean+footF+8,8-lift,dark,4,a);
  // attack-specific arms: wind-up first, then a readable extension.
  let ax=-18, ay=-45-lift, bx=18, by=-42-lift;
  if(m==='ss'){ax=-14-22*(1-hit);ay=-48-12*wind;bx=18+62*hit;by=-45-10*hit;}
  else if(m==='us'||m==='uh'){ax=-18-10*wind;ay=-48-35*hit;bx=18+10*wind;by=-48-70*hit;}
  else if(m==='ds'||m==='dh'){ax=-18-12*hit;ay=-42+35*hit;bx=18+12*hit;by=-42+35*hit;}
  else if(m==='sh'){ax=-16-18*wind;ay=-42+12*wind;bx=18+75*hit;by=-42-25*hit;}
  else if(m==='sp'){ax=-32-15*wind;ay=-55-22*wind;bx=32+15*wind;by=-55-22*wind;}
  line(ctx,lean-7,-49-lift,lean+ax,ay,dark,8,a*.95); line(ctx,lean+7,-49-lift,lean+bx,by,dark,8,a*.95);
  circ(ctx,lean+ax,ay,5,col,a); circ(ctx,lean+bx,by,5,col,a);
  // directional afterimage gives the limbs a sense of acceleration.
  if(q>.12 && q<.88){ctx.globalAlpha=a*.16;line(ctx,lean+ax*.7,ay+6,lean+ax*.92,ay+2,hi,3);line(ctx,lean+bx*.7,by+6,lean+bx*.92,by+2,hi,3);ctx.globalAlpha=1;}
}
function slashTrail(ctx,x1,y1,x2,y2,col,p,w=5){
  for(let i=5;i>=1;i--) { const t=i/6; line(ctx,x1+(x2-x1)*t*.35,y1+(y2-y1)*t*.35,x2-(x2-x1)*t*.15,y2-(y2-y1)*t*.15,col,w*t,.12*t); }
  line(ctx,x1,y1,x2,y2,col,w,.95);
  sparks(ctx,x2,y2,col,5,p);
}
function sandArc(ctx,cx,cy,r,a0,a1,col,p){
  stroke(ctx,col,7,.9); ctx.beginPath(); ctx.arc(cx,cy,r,a0,a1); ctx.stroke();
  for(let i=0;i<8;i++){const a=a0+(a1-a0)*i/7;sand(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r,4,.75);}
}
function shardBurst(ctx,cx,cy,count,r,col,p){for(let i=0;i<count;i++){const a=i/count*TAU+p*2;const rr=r*(.35+.65*p);poly(ctx,[[cx+Math.cos(a)*rr,cy+Math.sin(a)*rr],[cx+Math.cos(a+.09)*(rr+18),cy+Math.sin(a+.09)*(rr+18)],[cx+Math.cos(a-.07)*(rr+6),cy+Math.sin(a-.07)*(rr+6)]],col,true,.8);}}
function venomTrail(ctx,x1,y1,x2,y2,col,p){line(ctx,x1,y1,x2,y2,col,11,.65);for(let i=0;i<9;i++){const t=i/8;venom(ctx,x1+(x2-x1)*t,y1+(y2-y1)*t,4+3*Math.sin(t*Math.PI),col,.8);}}
function ashCloud(ctx,cx,cy,rx,ry,p,alpha=.6){for(let i=0;i<18;i++){const a=i/18*TAU+p*2;const rr=.3+.7*((i*7)%10)/10;ash(ctx,cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr,5+7*rr,alpha);}}
function mistRibbon(ctx,cx,cy,r,p,col){for(let i=0;i<12;i++){const a=i/11*TAU+p*1.8;mist(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.55,12,6,.38);}}
function techBeam(ctx,x1,y1,x2,y2,col,p){line(ctx,x1,y1,x2,y2,col,16,.2);line(ctx,x1,y1,x2,y2,'#E8F7FF',5,.8);for(let i=0;i<5;i++){const t=(i/5+p)%1;circ(ctx,x1+(x2-x1)*t,y1+(y2-y1)*t,4,col,.8);}}
function formation(ctx,side,p){for(let i=0;i<3;i++){const x=side*(34+i*24), y=-20-i*8;guard(ctx,x,y);line(ctx,x,y-42,x+side*12,y-72,c3(),4,.55);} }
function c3(){return C.g3_kanenobu;}

function drawTakeshi(ctx,p,m){const c=C.g3_takeshi; const q=clamp(p),s=Math.sin(q*Math.PI),snap=Math.sin(q*Math.PI*2);
 body(ctx,-5*q,8*s,c); poseDetail(ctx,q,m,c,-5*q,8*s);
 if(m==='ss'){const ex=18+105*q, yy=-48-28*s; line(ctx,12,-48,ex,yy,c,5,.35); sandArc(ctx,ex-20,yy+8,34,-.45,.45,c,q); for(let i=0;i<10;i++)sand(ctx,ex-25+i*6,yy+Math.sin(i)*5,3,.7);}
 else if(m==='us'){const h=35+105*q; for(let i=0;i<10;i++)sand(ctx,(i-5)*3,-5-h*(i/10),5,.8); poly(ctx,[[-16,-10],[16,-10],[10,-h],[-10,-h]],c,true,.85); poly(ctx,[[-10,-h],[10,-h],[0,-h-30]],'#F2D99B',true,.95); sparks(ctx,0,-h-28,c,8,q);}
 else if(m==='ds'){const r=18+45*s; for(let i=0;i<12;i++)sand(ctx,Math.cos(i/12*TAU)*r,-7+Math.sin(i/12*TAU)*r*.45,6,.85); ring(ctx,0,-7,r,c,.8,4); if(q>.5){for(let i=0;i<9;i++)sand(ctx,Math.cos(i/9*TAU)*(r+22*s),-7+Math.sin(i/9*TAU)*(r+22*s)*.45,5,.75);}}
 else if(m==='uh'){const h=35+120*q; poly(ctx,[[-24,-5],[24,-5],[18,-h],[-18,-h]],c,true,.8); for(let i=0;i<7;i++){const a=-1.3+i*.43;poly(ctx,[[0,-h],[Math.cos(a)*(45+15*s),-h-18],[Math.cos(a)*30,-h+12]],'#E9CD91',true,.85);} }
 else if(m==='dh'){for(let i=0;i<13;i++){const a=-Math.PI+(i/12)*TAU;const r=25+38*s;sand(ctx,Math.cos(a)*r,-20+Math.sin(a)*r*.5,8,.85);} ring(ctx,0,-15,58*s,c,.65,5); if(q>.55) sparks(ctx,0,-20,'#EED7A5',12,q);}
 else if(m==='sh'){const w=45+90*q; poly(ctx,[[18,-78],[18+w,-64],[18+w+10,-28],[18,-18]],c,true,.92); for(let i=0;i<12;i++)sand(ctx,45+i*7*q,-45+Math.sin(i+q*8)*7,4,.8); line(ctx,18+w,-64,18+w+15,-30,'#F3DCA8',5,.8);}
 else {const r=20+90*q; circ(ctx,45,-48,20+12*(1-q),c,.45); for(let i=0;i<30;i++){const a=i/30*TAU+q*5;const rr=r*(.55+.45*((i*3)%10)/10);sand(ctx,Math.cos(a)*rr, -48+Math.sin(a)*rr*.62,4,.8);} ring(ctx,0,-48,r,c,.65,6); if(q>.7) shardBurst(ctx,0,-48,16,r,c,q);}
}
function drawAiko(ctx,p,m){const c=C.g3_aiko,q=clamp(p),s=Math.sin(q*Math.PI); body(ctx,-6*s,10*s,c); poseDetail(ctx,q,m,c,-6*s,10*s); const boneHi='#FFF9F0';
 if(m==='ss'){const len=42+72*q; bone(ctx,12,-48,12+len,-48,15,c); bone(ctx,12+len,-48,12+len+16,-58,11,c); slashTrail(ctx,20,-52,12+len,-48,boneHi,q,3);}
 else if(m==='us'){const len=75+75*q; bone(ctx,10,-45,15,-45-len,18,c); for(let i=0;i<5;i++)bone(ctx,15,-65-i*len/5,17,-72-i*len/5,10,boneHi); poly(ctx,[[8,-45-len],[22,-45-len],[15,-45-len-26]],c,true,.95);}
 else if(m==='ds'){for(let side of [-1,1]){bone(ctx,side*12,-45,side*30,-10,17,c);bone(ctx,side*30,-10,side*45,-8,12,c);} poly(ctx,[[-50,-8],[0,-27],[50,-8],[42,3],[-42,3]],c,true,.9); sparks(ctx,0,-6,boneHi,8,q);}
 else if(m==='uh'){for(let i=0;i<7;i++){const yy=-50-i*15; bone(ctx,0,yy,Math.sin(i*.8)*10,yy-18,9,c);} bone(ctx,0,-145,0,-185,12,boneHi); for(let i=0;i<6;i++)circ(ctx,Math.sin(i)*8,-65-i*20,4,boneHi,.8);}
 else if(m==='dh'){for(let i=0;i<6;i++){const x=-72+i*29;ctx.beginPath();ctx.arc(x,-5,27,Math.PI,TAU);ctx.strokeStyle=c;ctx.lineWidth=10;ctx.stroke();line(ctx,x,-5,x+Math.sin(i)*9,-42,c,5);} for(let i=0;i<7;i++)sparks(ctx,-55+i*18,-12,c,2,q);}
 else if(m==='sh'){const ang=-1.2+2.4*q; const pts=[];for(let i=0;i<=18;i++){const a=ang+i/18*1.45;pts.push([20+Math.cos(a)*112,-48+Math.sin(a)*112]);}poly(ctx,pts,c,true,.82); poly(ctx,[[20,-48],[128,-72],[140,-48],[128,-24]],boneHi,true,.62); slashTrail(ctx,22,-48,130,-52,boneHi,q,2);}
 else {for(let i=0;i<9;i++)bone(ctx,20+i*3,-105+i*4,48+i*9,-80+i*4,12,c,.75); bone(ctx,40,-62,155,-38,32,c); poly(ctx,[[150,-38],[178,-58],[175,-18]],c,true,.95); for(let i=0;i<14;i++)sparks(ctx,75,-48,boneHi,2,q); ring(ctx,75,-48,68,boneHi,.2,3);}
}
function drawHaru(ctx,p,m){const c=C.g3_haru,q=clamp(p),s=Math.sin(q*Math.PI); body(ctx,3*s,6*s,c); poseDetail(ctx,q,m,c,3*s,6*s); const hi='#FFFFFF';
 if(m==='ss'){const x=25+100*q; glass(ctx,[[12,-67],[x,-67],[x+8,-58],[12,-58]],c,.75,3); line(ctx,12,-62,x,-62,hi,2,.9); slashTrail(ctx,18,-62,x,-62,hi,q,2);}
 else if(m==='us'){const len=55+95*q; poly(ctx,[[-5,-45],[5,-45],[5,-45-len],[-5,-45-len]],c,true,.45); line(ctx,0,-45,0,-45-len,hi,3,.95); for(let i=0;i<5;i++)line(ctx,-8,-65-i*20,8,-65-i*20,c,2,.6); poly(ctx,[[-7,-45-len],[7,-45-len],[0,-45-len-22]],hi,true,.9);}
 else if(m==='ds'){for(let i=0;i<9;i++){const x=-65+i*16;const y=-7+Math.sin(i)*5;poly(ctx,[[x,y],[x+8,y-25-(i%3)*7],[x+14,y+2]],c,true,.7);line(ctx,x,y,x+8,y-25,hi,1,.7);}}
 else if(m==='uh'){const h=80+70*q;for(let i=0;i<6;i++){const x=-32+i*13;glass(ctx,[[x,-12],[x+12,-12],[x+18,-h],[x-8,-h]],c,.42,3);line(ctx,x+5,-h,x+10,-12,hi,1,.7);} shardBurst(ctx,0,-h,10,45,c,q);}
 else if(m==='dh'){poly(ctx,[[-95,-10],[95,-10],[80,-35],[-80,-35]],c,false,.7,4); for(let i=0;i<14;i++){const a=i/13*TAU;line(ctx,Math.cos(a)*70,-20,Math.cos(a)*110,-65-Math.sin(a)*12,c,2,.7);} if(q>.55)shardBurst(ctx,0,-15,12,75,c,q);}
 else if(m==='sh'){const x=20+105*q; poly(ctx,[[20,-112],[x,-112],[x,-2],[20,-2]],c,true,.22); line(ctx,x,-112,x,-2,hi,7,.9); for(let i=0;i<8;i++)line(ctx,x,-100+i*13,x-20,-92+i*14,hi,1,.8);}
 else {const r=15+95*q; circ(ctx,0,-50,8,hi,.9); for(let i=0;i<28;i++){const a=i/28*TAU+q*3;const rr=r*(.5+.5*((i*11)%10)/10);const x=Math.cos(a)*rr,y=-50+Math.sin(a)*rr*.7;poly(ctx,[[x,y-12],[x+8,y],[x,y+12],[x-8,y]],c,true,.65);line(ctx,x-7,y,x+7,y,hi,1,.6);} ring(ctx,0,-50,r,hi,.55,3);}
}
function drawChiyo(ctx,p,m){const c=C.g3_chiyo,q=clamp(p),s=Math.sin(q*Math.PI); body(ctx,-4*s,7*s,c); poseDetail(ctx,q,m,c,-4*s,7*s);
 if(m==='ss'){const x=30+75*q;venomTrail(ctx,18,-50,x,-50-18*s,c,q); if(q>.7){for(let i=0;i<7;i++)venom(ctx,x+Math.sin(i)*10,-50+(i-3)*7,5,c,.8);}}
 else if(m==='us'){const y=-38-92*q;venom(ctx,8,y,8,c);line(ctx,8,-42,8,y,c,8,.55);if(q>.62){for(let i=0;i<8;i++)venom(ctx,8+(i-4)*5,y,4,c,.8);}}
 else if(m==='ds'){for(let i=0;i<8;i++)venom(ctx,(i-3.5)*15,-4,11,c,.55);for(let i=0;i<7;i++){const x=-45+i*15;venom(ctx,x,-12-30*q,5,c,.8);}}
 else if(m==='uh'){for(let i=0;i<14;i++){const a=-Math.PI/2+i/13*Math.PI*1.6;const r=28+18*q;venom(ctx,Math.cos(a)*r,-58+Math.sin(a)*(80+35*q),7,c,.7);} line(ctx,0,-35,0,-145,c,15,.35);}
 else if(m==='dh'){for(let i=0;i<12;i++)venom(ctx,(i-5.5)*14,-8,11,c,.5);for(let i=0;i<9;i++){const x=-62+i*15;poly(ctx,[[x,-5],[x+6,-45-28*s],[x+13,-5]],c,true,.9);venom(ctx,x+7,-48-28*s,5,c,.8);}}
 else if(m==='sh'){for(let side of [-1,1]){const ex=20+side*55;venom(ctx,side*15,-48,17,c,.75);venomTrail(ctx,side*25,-48,side*(55+55*q),-42-10*s,c,q);poly(ctx,[[side*(55+55*q),-42-10*s],[side*(90+55*q),-52],[side*(78+55*q),-22]],c,true,.95);}}
 else {circ(ctx,45,-50,26,c,.8);for(let i=0;i<12;i++){const a=i/12*TAU;const rr=25+70*q;venomTrail(ctx,45+Math.cos(a)*20,-50+Math.sin(a)*15,45+Math.cos(a)*rr,-50+Math.sin(a)*rr*.7,c,q);}circ(ctx,45,-50,9,'#CFFF8A',.9);}
}
function drawEmi(ctx,p,m){const c=C.g3_emi,q=clamp(p),s=Math.sin(q*Math.PI); body(ctx,7*s,5*s,c); poseDetail(ctx,q,m,c,7*s,5*s); const pulse='#FFDCE1';
 if(m==='ss'){const dx=28+80*q; ring(ctx,dx,-50,10+9*s,c,.75,3);line(ctx,15,-50,dx,-50,pulse,2,.65);for(let i=0;i<5;i++)circ(ctx,dx-20+i*8,-50+Math.sin(i)*5,3,pulse,.8);}
 else if(m==='us'){for(let i=0;i<5;i++)ring(ctx,0,-45-i*18-35*q,8+i*3,c,.65,2);line(ctx,0,-42,0,-130-30*q,pulse,3,.8);sparks(ctx,0,-135,c,8,q);}
 else if(m==='ds'){ring(ctx,0,-8,20+48*s,c,.8,4);for(let i=0;i<12;i++){const a=i/12*TAU;line(ctx,Math.cos(a)*20,-8+Math.sin(a)*6,Math.cos(a)*(45+25*s),-8+Math.sin(a)*(15+12*s),c,2,.75);}}
 else if(m==='uh'){circ(ctx,0,-55,18,c,.35);for(let i=0;i<7;i++){const a=-Math.PI/2+i*.35;line(ctx,0,-55,Math.cos(a)*(30+18*s),-105-Math.sin(i)*30,c,3,.8);}ring(ctx,0,-85,26,pulse,.55,2);}
 else if(m==='dh'){circ(ctx,0,-8,12,c,.25);ring(ctx,0,-8,42+28*s,c,.8,5);for(let i=0;i<10;i++)sparks(ctx,0,-8,c,2,q);}
 else if(m==='sh'){const dx=35+70*q;line(ctx,14,-50,dx,-50,c,10,.8);circ(ctx,dx,-50,12,pulse,.85);for(let i=0;i<4;i++)ring(ctx,dx,-50,16+i*6,c,.3,2);}
 else {ring(ctx,0,-52,30+72*q,c,.85,4);for(let i=0;i<14;i++){const a=i/14*TAU+q*4;line(ctx,0,-52,Math.cos(a)*(45+75*q),-52+Math.sin(a)*(30+55*q),pulse,2,.8);}const tx=55+45*s;line(ctx,14,-50,tx,-50,c,14,.9);circ(ctx,tx,-50,14,'#FFF',.9);sparks(ctx,tx,-50,c,12,q);}
}
function drawNozomi(ctx,p,m){const c=C.g3_nozomi,q=clamp(p),s=Math.sin(q*Math.PI);body(ctx,-4*s,6*s,c); poseDetail(ctx,q,m,c,-4*s,6*s);
 if(m==='ss'){const pts=[[10,-50],[42,-62],[72+60*q,-42-28*s]];vine(ctx,pts,c,7,.95);for(let i=0;i<5;i++)poly(ctx,[[45+i*16,-54-i*4],[51+i*16,-67-i*4],[57+i*16,-55-i*4]],c,true,.9);}
 else if(m==='us'){vine(ctx,[[0,-5],[0,-55],[12,-105],[0,-145-20*q]],c,12,.95);for(let i=0;i<7;i++)poly(ctx,[[0,-110-i*6],[11,-127-i*6],[17,-112-i*6]],c,true,.9);}
 else if(m==='ds'){vine(ctx,[[-10,-5],[-40,-22],[-68,-5]],c,7);vine(ctx,[[10,-5],[40,-22],[68,-5]],c,7);for(let i=0;i<10;i++){const x=-55+i*12;poly(ctx,[[x,-8],[x+6,-27],[x+12,-8]],c,true,.8);}}
 else if(m==='uh'){for(let i=0;i<6;i++){const a=-1.45+i*.58;vine(ctx,[[0,-8],[Math.cos(a)*38,-62],[Math.cos(a)*50,-145-15*s]],c,10,.9);}}
 else if(m==='dh'){for(let i=0;i<10;i++){const a=i/10*TAU;const x=Math.cos(a)*(45+15*s),y=-45+Math.sin(a)*32;vine(ctx,[[0,-45],[x,y],[x*1.25,y-10]],c,9,.8);}}
 else if(m==='sh'){const len=70+70*q;for(let i=0;i<4;i++)vine(ctx,[[15,-48],[45+i*10,-55+i*6],[15+len,-48+i*3]],c,10,.9);for(let i=0;i<8;i++)poly(ctx,[[55+i*10,-50],[62+i*10,-66],[69+i*10,-50]],c,true,.9);}
 else {for(let i=0;i<20;i++){const a=i/20*TAU;const rr=25+75*q;vine(ctx,[[0,-48],[Math.cos(a)*45,-48+Math.sin(a)*24],[Math.cos(a)*rr,-48+Math.sin(a)*(40+35*q)]],c,9,.8); } ring(ctx,0,-48,105*q+25,c,.3,4);}
}
function drawMasaru(ctx,p,m){const c=C.g3_masaru,q=clamp(p),s=Math.sin(q*Math.PI);body(ctx,-5*s,7*s,c); poseDetail(ctx,q,m,c,-5*s,7*s);
 if(m==='ss'){const x=25+115*q;ashCloud(ctx,x,-50-18*s,28,18,q,.65);line(ctx,14,-50,x,-50,c,9,.4);for(let i=0;i<10;i++)ash(ctx,x-20+i*5,-50+Math.sin(i)*6,4,.8);}
 else if(m==='us'){ashCloud(ctx,0,-55-75*q,30,70,q,.7);circ(ctx,0,-125-15*q,9,'#D9D0C8',.7);sparks(ctx,0,-130,c,7,q);}
 else if(m==='ds'){ashCloud(ctx,0,-12,35+35*s,12,q,.7);ring(ctx,0,-12,35+35*s,c,.4,4);for(let i=0;i<12;i++)ash(ctx,Math.cos(i/12*TAU)*(35+40*s),-12+Math.sin(i/12*TAU)*10,5,.7);}
 else if(m==='uh'){ashCloud(ctx,0,-75,38,75,q,.7);for(let i=0;i<10;i++){const a=i/10*TAU;ash(ctx,Math.cos(a)*40,-75+Math.sin(a)*75,6,.7);}line(ctx,0,-30,0,-145,c,4,.25);}
 else if(m==='dh'){ashCloud(ctx,0,-25,80*s+25,22,q,.8);for(let i=0;i<16;i++){const a=i/16*TAU;ash(ctx,Math.cos(a)*(25+55*s),-25+Math.sin(a)*20,6,.8);}ring(ctx,0,-25,65*s+20,c,.35,4);}
 else if(m==='sh'){const x=30+115*q;ashCloud(ctx,x,-48,38,22,q,.75);poly(ctx,[[18,-78],[x,-72],[x+12,-30],[18,-25]],c,true,.7);for(let i=0;i<9;i++)ash(ctx,x-20+i*6,-50+Math.sin(i)*9,5,.8);}
 else {ashCloud(ctx,0,-48,75+35*q,55+25*q,q,.85);circ(ctx,0,-48,18+28*q,c,.25);if(q>.35){for(let i=0;i<22;i++){const a=i/22*TAU;ash(ctx,Math.cos(a)*(30+100*q),-48+Math.sin(a)*(20+75*q),7,.75);}}ring(ctx,0,-48,35+95*q,c,.45,5);}
}
function drawRyo(ctx,p,m){const c=C.g3_ryo,q=clamp(p),s=Math.sin(q*Math.PI);body(ctx,8*s,6*s,c); poseDetail(ctx,q,m,c,8*s,6*s);
 if(m==='ss'){mistRibbon(ctx,50+70*q,-48,25+20*s,q,c);line(ctx,14,-48,90+70*q,-48,c,6,.3);}
 else if(m==='us'){for(let i=0;i<15;i++)mist(ctx,Math.cos(i)*15,-45-75*q+i*3,16,8,.45);mist(ctx,0,-140-15*q,22,12,.8);ring(ctx,0,-40,28,c,.35,3);}
 else if(m==='ds'){mistRibbon(ctx,0,-8,35+25*s,q,c);for(let i=0;i<8;i++)mist(ctx,(i-3.5)*14,-5,18,8,.45);for(let i=0;i<7;i++)mist(ctx,0,-12-i*12,14,7,.5);}
 else if(m==='uh'){for(let i=0;i<18;i++){const a=i/18*TAU+p*2;mist(ctx,Math.cos(a)*38,-70+Math.sin(a)*70,13,8,.45);}ring(ctx,0,-140,45,c,.55,4);}
 else if(m==='dh'){mistRibbon(ctx,0,-20,55+30*s,q,c);for(let i=0;i<12;i++)mist(ctx,Math.cos(i/12*TAU)*(40+35*s),-20+Math.sin(i/12*TAU)*18,15,8,.5);ring(ctx,0,-20,70*s+25,c,.45,4);}
 else if(m==='sh'){const x=35+100*q;mist(ctx,x,-50,60,16,.7);line(ctx,18,-50,x,-50,'#FFFFFF',8,.5);slashTrail(ctx,25,-48,x,-50,c,q,5);}
 else {const r=25+80*q;for(let i=0;i<26;i++){const a=i/26*TAU+p*3;mist(ctx,Math.cos(a)*r,-50+Math.sin(a)*r*.7,15,8,.5);}circ(ctx,0,-50,40+30*q,c,.18);ring(ctx,0,-50,r,c,.65,5);if(q>.7)sparks(ctx,0,-50,'#F4FBFF',16,q);}
}
function drawSouta(ctx,p,m){const c=C.g3_souta,q=clamp(p),s=Math.sin(q*Math.PI);body(ctx,3*s,5*s,c); poseDetail(ctx,q,m,c,3*s,5*s);
 if(m==='ss'){for(let i=0;i<10;i++){const t=i/9;ash(ctx,18+85*q*t,-48+Math.sin(t*TAU+q*4)*18,4,.75);}line(ctx,16,-48,105*q+18,-48,c,4,.35);}
 else if(m==='us'){for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.16;ash(ctx,Math.cos(a)*(15+50*q),-45-Math.abs(Math.sin(a))*75*q,5,.75);}circ(ctx,0,-125*q-45,10,c,.45);}
 else if(m==='ds'){circ(ctx,0,-5,24,c,.35);for(let i=0;i<8;i++)ash(ctx,-35+i*10,-6,5,.75);if(q>.45){for(let i=0;i<10;i++)ash(ctx,-50+i*11,-45*s,4,.85);}}
 else if(m==='uh'){for(let i=0;i<18;i++){const a=i/18*TAU+q*2.5;ash(ctx,Math.cos(a)*(25+25*s),-60+Math.sin(a)*(65+35*q),5,.7);}ring(ctx,0,-75,40+35*q,c,.45,4);}
 else if(m==='dh'){poly(ctx,[[-15,-35],[90,-30],[90,-10],[-15,-5]],c,true,.5);ashCloud(ctx,45,-22,90,18,q,.7);for(let i=0;i<10;i++)ash(ctx,45+i*8,-25-Math.sin(i)*15,5,.75);}
 else if(m==='sh'){const len=55+100*q;poly(ctx,[[18,-58],[18+len,-58],[18+len,-36],[18,-38]],c,true,.65);for(let i=0;i<9;i++)ash(ctx,40+i*9*q,-48+Math.sin(i)*5,4,.85);}
 else {const forms=[q<.25?'sphere':q<.5?'blade':q<.75?'spike':'fist'];const r=20+65*q;ashCloud(ctx,45*q,-48,r*.7,r*.5,q,.75);if(q>.25){poly(ctx,[[30,-75],[90*q+45,-62],[90*q+45,-32],[30,-20]],c,true,.7);}if(q>.5){poly(ctx,[[50,-78],[140*q,-55],[140*q,-25],[50,-18]],c,true,.8);}if(q>.72){circ(ctx,125*q,-45,28,c,.8);for(let i=0;i<12;i++)ash(ctx,100*q+i*3,-45+Math.sin(i)*10,5,.8);}}
}
function drawOgata(ctx,p,m){const c=C.g3_ogata,q=clamp(p),s=Math.sin(q*Math.PI);body(ctx,-3*s,5*s,c); poseDetail(ctx,q,m,c,-3*s,5*s);const hot='#D8F4FF';
 if(m==='ss'){tech(ctx,20,-50,1,c);const x=45+85*q;techBeam(ctx,35,-50,x,-50,c,q);circ(ctx,x,-50,12,hot,.8);}
 else if(m==='us'){tech(ctx,0,-50,1.1,c);techBeam(ctx,0,-65,0,-155-20*q,c,q);for(let i=0;i<6;i++)circ(ctx,Math.sin(i)*9,-90-i*12,4,hot,.7);}
 else if(m==='ds'){for(let i=0;i<4;i++){const x=-50+i*34;tech(ctx,x,-12,.65,c);cable(ctx,x,-12,0,-20,c);}ring(ctx,0,-12,55*s+25,c,.8,5);for(let i=0;i<8;i++)sparks(ctx,0,-12,c,2,q);}
 else if(m==='uh'){tech(ctx,0,-25,1.4,c);techBeam(ctx,0,-45,0,-165,c,q);for(let i=0;i<8;i++)tech(ctx,Math.cos(i/8*TAU)*22,-100+Math.sin(i)*12,.35,c);circ(ctx,0,-165,22,hot,.8);}
 else if(m==='dh'){for(let i=0;i<5;i++){const x=-58+i*29;tech(ctx,x,-18,.6,c);cable(ctx,x,-18,0,-25,c);}circ(ctx,0,-20,22,c,.3);ring(ctx,0,-20,60,c,.8,5);if(q>.55)techBeam(ctx,-45,-20,45,-20,c,q);}
 else if(m==='sh'){tech(ctx,20,-50,1.2,c);const x=45+110*q;techBeam(ctx,38,-50,x,-50,c,q);for(let i=0;i<8;i++)sparks(ctx,x,-50,c,2,q);if(q>.72)circ(ctx,x,-50,25,c,.3);}
 else {for(let i=0;i<7;i++){const a=i/7*TAU;tech(ctx,Math.cos(a)*55,-50+Math.sin(a)*30,.75,c);cable(ctx,Math.cos(a)*55,-50+Math.sin(a)*30,0,-50,c);}circ(ctx,0,-50,25+38*q,c,.3);techBeam(ctx,-80,-50,80,-50,c,q);for(let i=0;i<12;i++)sparks(ctx,0,-50,hot,2,q);}
}
function drawKanenobu(ctx,p,m){const c=C.g3_kanenobu,q=clamp(p),s=Math.sin(q*Math.PI);body(ctx,4*s,4*s,c); poseDetail(ctx,q,m,c,4*s,4*s);
 if(m==='ss'){cane(ctx,12,-50,c);line(ctx,35,-70,75+65*q,-50,c,7,.9);sparks(ctx,75+65*q,-50,c,5,q);}
 else if(m==='us'){guard(ctx,18,-8);guard(ctx,-18,-18);for(let i=0;i<3;i++){line(ctx,18,-48,18,-85-i*18,c,7,.7);sparks(ctx,18,-105-i*10,c,2,q);}}
 else if(m==='ds'){guard(ctx,-35,-8);guard(ctx,35,-8);line(ctx,-45,-25,0,-58,c,10,.8);line(ctx,45,-25,0,-58,c,10,.8);ring(ctx,0,-15,50*s+25,c,.45,4);}
 else if(m==='uh'){for(let i=0;i<5;i++){const x=-36+i*18;guard(ctx,x,-10-i*12);line(ctx,x,-48-i*12,x,-100-i*15,c,7,.75);}}
 else if(m==='dh'){tech(ctx,28,-15,1,c);for(let i=0;i<8;i++)line(ctx,28,-15,65+i*9,-15,c,4,.35);ring(ctx,28,-15,48*s+25,c,.7,4);}
 else if(m==='sh'){guard(ctx,62,-15);fill(ctx,'#B9C2C8');ctx.fillRect(20,-78,50,66);stroke(ctx,'#F3D66A',4);ctx.strokeRect(20,-78,50,66);line(ctx,70,-45,145+20*q,-45,c,5,.85);for(let i=0;i<6;i++)sparks(ctx,145+20*q,-45,c,2,q);}
 else {guard(ctx,-40,-5);guard(ctx,0,-20);guard(ctx,40,-5);tech(ctx,0,-48,1.1,c);for(let i=0;i<10;i++){const a=i/10*TAU;line(ctx,0,-48,Math.cos(a)*(45+70*q),-48+Math.sin(a)*(35+48*q),c,6,.7);}cane(ctx,5,-50,c);ring(ctx,0,-48,40+55*q,c,.35,4);}
}

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
