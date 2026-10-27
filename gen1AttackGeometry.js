const TAU = Math.PI * 2;
// Shared Generation-I attack silhouettes. Coordinates are fighter-local (origin at feet/center),
// facing right. The renderer and collision system consume the same geometry every frame.
export const GEN1_TIMINGS = {
 g1_fire:{us:[10,2,13],ds:[11,4,27],ss:[4,5,17],uh:[14,5,38],dh:[14,4,27],sh:[17,7,37],recovery:[5,4,25],super:[30,15,48],groundPound:[15,6,31]},
 g1_grass:{us:[8,2,22],ds:[10,5,23],ss:[10,2,18],uh:[18,4,29],dh:[20,5,41],sh:[15,6,40],recovery:[5,3,20],super:[31,9,62],groundPound:[8,5,19]},
 g1_ice:{us:[9,2,22],ds:[14,7,15],ss:[9,2,9],uh:[15,7,26],dh:[18,3,41],sh:[18,7,38],recovery:[7,3,27],super:[31,17,51],groundPound:[16,6,27]},
 g1_thunder:{us:[5,5,10],ds:[6,7,24],ss:[4,3,13],uh:[12,3,32],dh:[23,3,27],sh:[21,4,38],recovery:[4,5,15],super:[27,18,57],groundPound:[5,2,14]},
 g1_water:{us:[9,2,13],ds:[7,3,26],ss:[7,4,9],uh:[21,5,30],dh:[26,3,36],sh:[21,4,32],recovery:[9,4,19],super:[28,10,65],groundPound:[10,2,29]}
};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const line=(x1,y1,x2,y2,r=6)=>({shape:'capsule',x1,y1,x2,y2,r});
const box=(x,y,w,h)=>({shape:'box',x,y,w,h});
const circle=(x,y,r)=>({shape:'circle',x,y,r});
export function gen1MoveKey(charId,d){
 // Mirrors charAttackAnims.getAttackKey exactly, so the hitbox is always the move that is being drawn.
 if(d?.isGroundPound||d?.type==='groundPound')return 'groundPound';
 if(d?.isRecovery||d?.type==='recovery'||d?.recoveryAnimationKey)return 'recovery';
 if(d?.isSuper||d?.sigType==='super')return 'super';
 const st=d?.sigType||'side';
 if(d?.isHeavy){if(['downHeavy','down','dh'].includes(st))return 'dh';if(['upHeavy','upheavy','uh','aerialHeavy','aerial'].includes(st)||d.isAerialHeavy)return 'uh';return 'sh';}
 if(['up','upSignature','us','aerial'].includes(st))return 'us';
 if(['down','downSignature','downNormal','ds'].includes(st))return 'ds';
 return 'ss';
}
// Full-animation progress, not active-window-normalized progress, so collision is literally on the rendered pose.
function legacyGen1Geometry(charId,move,p=0){
 const q=clamp(p), wind=ease(q/.35), hit=ease((q-.28)/.24), rec=clamp((q-.58)/.42), shapes=[];
 const fire=charId==='g1_fire',grass=charId==='g1_grass',ice=charId==='g1_ice',thunder=charId==='g1_thunder',water=charId==='g1_water';
 const element=fire?'fire':grass?'grass':ice?'ice':thunder?'thunder':'water';
 if(move==='us'){
  const u=ease((q-.22)/.24), cx=12+12*Math.sin(q*6), cy=-72-38*u;
  if(grass && q<.24){shapes.push(line(-24,-4,-9,-5,4),line(-7,-5,8,-3,4));}
  if(ice){const arc=ease((q-.18)/.42), ax=-22+44*arc, ay=-42-34*Math.sin(arc*Math.PI);shapes.push(line(-16,-24,ax,ay,8),line(ax,ay,14,-103,9),box(0,-126,34,45));}
  else if(water){const arc=ease((q-.14)/.38), ax=-24+42*arc, ay=-38-26*Math.sin(arc*Math.PI);shapes.push(line(-20,-25,ax,ay,7),line(ax,ay,18,-100,9),box(1,-123,34,44));}
  else if(thunder){shapes.push(line(-20,-36,-4,-25,5),line(-4,-25,15,-86,8),box(4,-110,40,48));}
  else {shapes.push(line(7,-27,cx,cy+22,10),box(cx-23,cy-27,46,54));}
 } else if(move==='ds'){
  const u=ease((q-.26)/.2), spread=18+62*u;
  if(grass){shapes.push(line(18-spread*.72,-4,18+spread,-4,7),line(18-spread*.95,-8,18+spread*1.12,-8,4),circle(18,-4,10+5*u));}
  else if(ice){for(let i=0;i<5;i++){const a=Math.PI*.1+i*Math.PI*.2;shapes.push(line(18+Math.cos(a)*12,-5+Math.sin(a)*6,18+Math.cos(a)*(spread*.75),-5+Math.sin(a)*(spread*.32),6));}circle(18,-4,10+5*u);}
  else if(fire){shapes.push(line(18-spread,-4,18+spread,-4,7),circle(18,-4,10+5*u));}
  else if(thunder){const r=16+55*u;for(let i=0;i<7;i++){const a=Math.PI+i/6*Math.PI;shapes.push(line(18,-7,18+Math.cos(a)*r,-7+Math.sin(a)*r*.5,5));}}
  else {shapes.push(line(15,-8,18+spread,-15,8),line(15,-8,18-spread*.72,-10,6),circle(18,-8,8+5*u));}
 } else if(move==='ss'){
  const u=ease((q-.24)/.25), sx=22+74*u, sy=-34-24*Math.sin(u*Math.PI);
  if(grass){shapes.push(line(7,-18,22,-29,6),line(22,-29,42,-40,7),line(42,-40,sx,sy,10),circle(sx,sy,10));}
  else if(ice){const reach=18+90*u;shapes.push(line(14,-27,34,-34,6),line(34,-34,reach,sy,9),circle(reach,sy,9));}
  else if(thunder){shapes.push(line(18,-42,40,-44,5),line(40,-44,sx,sy,6),circle(sx,sy,7));}
  else if(water){shapes.push(line(15,-28,34,-38,5),line(34,-38,sx,sy,6),circle(sx,sy,7));}
  else {shapes.push(line(14,-26,35,-35,7),line(35,-35,sx,sy,9),circle(sx,sy,10));}
 } else if(move==='uh'){
  const u=ease((q-.25)/.35), cx=6+18*u, cy=-56-62*u;
  if(grass){const drop=ease((q-.32)/.17), rebound=ease((q-.52)/.25), hx=18+28*drop-14*rebound, hy=-104+82*drop-48*rebound;shapes.push(line(-14,-20,18,-78,8),line(18,-78,hx,hy,12),box(hx-20,hy-12,40,28));}
  else if(ice){const spin=q*6.28, rr=28+18*u;for(let i=0;i<3;i++){const a=spin+i*2.09;shapes.push(line(Math.cos(a)*rr,-70+Math.sin(a)*rr*.6,Math.cos(a)*rr,-130-20*u,7));}box(0,-132,50,42);}
  else if(thunder){shapes.push(line(-24,-20,0,-62,8),line(0,-62,18,-110,8),box(4,-136,40,48));}
  else if(water){shapes.push(line(-18,-34,10,-54,8),line(10,-54,18,-118,10),box(0,-142,38,44));}
  else {shapes.push(line(-26,-22,cx-8,cy+26,10),box(cx-30,cy-26,60,58));}
 } else if(move==='dh'){
  const u=ease((q-.28)/.2), spread=20+72*u, cy=-3;
  if(grass){shapes.push(line(16,cy,16+spread,cy-11,7),line(16,cy,16-spread*.78,cy-7,6));}
  else if(ice){shapes.push(line(16,cy,16+spread,cy-3,8),line(16,cy,16-spread*.8,cy-2,8),circle(16,cy,10+5*u));}
  else if(thunder){for(let i=0;i<7;i++){let xx=-spread+2*spread*i/6;shapes.push(line(xx,cy,xx-10,cy-7,4));}}
  else if(fire){shapes.push(line(16-spread,cy,16+spread,cy,9),circle(16,cy,12+8*u));}
  else {shapes.push(line(16,cy,16+spread,cy-5,8),line(16,cy,16-spread*.72,cy-4,6),line(16,cy,16+spread*.7,cy-11,4));}
 } else if(move==='sh'){
  const u=ease((q-.25)/.36), start=charId==='g1_ice'?[-26,-86]:grass?[-24,-14]:thunder?[-28,-70]:[-24,-40], sx=30+112*u, sy=(charId==='g1_ice'?-70:grass?-28:-42)-10*Math.sin(u*Math.PI);
  if(grass){shapes.push(line(-24,-14,5,-20,8),line(5,-20,28,-34,10),line(28,-34,sx,sy,13),circle(sx,sy,13));}
  else if(ice){shapes.push(line(start[0],start[1],18,-48,9),line(18,-48,sx,sy,12),circle(sx,sy,13));}
  else if(thunder){shapes.push(line(-28,-70,10,-48,7),line(10,-48,sx,sy,10),line(sx,sy,sx+18,sy-4,7),circle(sx,sy,12));}
  else if(water){shapes.push(line(-24,-38,16,-50,8),line(16,-50,sx,sy,11),circle(sx,sy,12));}
  else {shapes.push(line(start[0],start[1],18,-48,9),line(18,-48,sx,sy,12),circle(sx,sy,13));}
 } else if(move==='recovery'){
  // Contact is the redirect point, not the decorative aura/marker.
  if(grass){
   const u=ease((q-.18)/.18), side=1-2*u, sx=side*(18+24*u), sy=-28-30*u;
   shapes.push(line(side*16,-25,sx,sy,8),line(sx,sy,sx-10,sy-18,8),circle(sx,sy,9));
  }else if(ice){
   const u=ease((q-.18)/.18), sx=-26+48*u, sy=-30-18*Math.sin(u*Math.PI);
   shapes.push(line(-26,-30,sx,sy,7),line(sx,sy,sx+10,sy-19,8),circle(sx,sy,8));
  }else if(thunder){
   const u=ease((q-.16)/.20), sx=8*Math.sin(q*TAU), sy=-18-54*u;
   shapes.push(line(-18,-24,-8,-12,5),line(-8,-12,sx,sy,7),line(sx,sy,sx+8,sy-19,7),circle(sx+8,sy-19,7));
  }else{
   const u=ease((q-.16)/.20), sx=8+38*u-18*u*u, sy=-32-40*u;
   shapes.push(line(-18,-24,sx,sy,8),line(sx,sy,sx+8,sy-22,8),circle(sx,sy,8));
  }
 } else if(move==='groundPound'){
  // Direct dive and landing pulse are separate collision events. Art is a shallow
  // diagonal for Grass, a shoulder curve for Ice, a last-instant twist for Thunder,
  // and a corkscrew for Water. The landing hitbox follows the two unequal waves.
  if(q<.58){
   if(grass){const u=ease(q/.58),sx=14+24*u,sy=-18-72*u;shapes.push(line(4,-24,sx,sy,8),line(sx,sy,sx+9,sy+14,8),box(sx-9,sy-16,18,30));}
   else if(ice){const u=ease(q/.58),sx=14+42*u-10*u*u,sy=-20-70*u+13*u*u;shapes.push(line(4,-25,sx,sy,8),line(sx,sy,sx+12,sy+12,9));}
   else if(thunder){const u=ease(q/.58),tw=ease((u-.72)/.28),sx=12+34*u,sy=-18-76*u;shapes.push(line(4,-24,sx-8,sy-10,8),line(sx-8,sy-10,sx+18*tw,sy+8,10),circle(sx+18*tw,sy+8,8));}
   else{const u=ease(q/.58),ang=q*TAU*2.3,sx=14+20*Math.sin(ang),sy=-20-75*u;shapes.push(line(3,-24,sx+Math.cos(ang)*10,sy-12,7),line(sx+Math.cos(ang)*10,sy-12,sx,sy+12,8),circle(sx,sy,7));}
  }else{
   const land=ease((q-.58)/.19),r1=18+70*land,r2=24+92*land;
   if(grass){shapes.push(line(10,-3,r1,-9,6),line(-10,-3,-r1*.72,-7,5),line(10,-3,r2,-12,3.5),line(-10,-3,-r2*.72,-10,3));}
   else if(ice){for(let i=0;i<8;i++){const side=i%2?1:-1,d=side*(12+i*r2/10);shapes.push(line(d,-8,d+side*8,-22-(i%3)*3,i<4?5:3.5));}shapes.push(line(-r1,-3,r1,-3,4));}
   else if(thunder){for(let i=0;i<7;i++){const d=-r2+2*r2*i/6;shapes.push(line(d,-4,d+10,-11, i%2?3:4));}shapes.push(line(-r1,-3,r1,-3,4));}
   else{shapes.push(line(10,-3,r1,-9,6),line(-10,-3,-r1*.72,-7,5),line(10,-3,r2,-12,3.5),line(-10,-3,-r2*.72,-10,3));}
  }
 } else if(move==='super'){
  const lane=ease((q-.18)/.25), dash=ease((q-(charId==='g1_fire'?.32:.30))/(charId==='g1_fire'?.16:.13)), finish=ease((q-.78)/.2);
  if(grass){
   // Three separate root traps first, then a diagonal vine-lance and a final bloom.
   for(let i=0;i<3;i++){const tx=86+i*112,t=ease((q-.18-i*.13)/.18);if(t>.05)shapes.push(line(tx,-2,tx,-72*t,7));}
   const sx=20+300*dash,sy=-55-18*Math.sin(q*TAU);shapes.push(line(18,-48,sx,sy,10),circle(sx,sy,12));if(q>.78)shapes.push(line(sx-30,sy,sx+30,sy,8),circle(sx,sy,20+12*finish));
  }else if(ice){
   const u=ease((q-.25)/.48),ret=ease((q-.7)/.3),sx=28+250*u-205*ret,sy=-58-24*Math.sin(u*Math.PI);shapes.push(line(28,-58,sx,sy,9),circle(sx,sy,11));if(q>.7)shapes.push(line(sx-22,sy,sx+22,sy,8),circle(sx,sy,16));
  }else if(thunder){
   for(let i=0;i<4;i++){const t=ease((q-.15-i*.12)/.2),xx=35+i*74;shapes.push(line(xx,-8,xx+18*t,-70*t,5));}
   const sx=30+230*dash;shapes.push({...line(22,-50,sx,-56,9),visualOnly:true},circle(sx,-56,11+8*finish));
  }else if(fire){
   const sx=40+1080*dash;shapes.push({...line(22,-58,sx,-58,13),visualOnly:true},circle(sx,-58,15+10*dash));if(q>.78)shapes.push(circle(sx,-58,22+30*finish));
  }else{
   // Three mark points are struck in sequence, then collapse to the close-range wave.
   const marks=[54,132,210];for(let i=0;i<marks.length;i++){const t=ease((q-.16-i*.105)/.18);if(q>.14+i*.105&&q<.82)shapes.push(circle(24+(marks[i]-24)*t,-48-16*Math.sin(t*Math.PI+i*.6),8));}
   if(q>.28&&q<.82){const u=ease((q-.28)/.52),sx=25+200*u,sy=-48-16*Math.sin(u*Math.PI);shapes.push(line(25,-48,sx,sy,9));}
   if(q>.60){const u=ease((q-.60)/.2),cx=225-160*u,cy=-52-10*Math.sin(u*Math.PI),r=24+88*u;for(let i=0;i<14;i++){const a=i/14*TAU;shapes.push(circle(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.62,6.5));}}
  }
 }

 return shapes;
}

// ═════════════════════════════════════════════════════════════════════════════
// Gen-I v2 — ONE skeleton drives BOTH the artwork and the hitbox.
// getGen1Rig() returns the exact parts (limbs, vines, crystals, waves...) that the
// renderer draws this frame. Parts with `hit>0` are the collision shapes, so the
// hitbox is literally the thing on screen at that moment. Hit radii are only
// non-zero inside the move's active window; art-only parts (trails, tells) have hit 0.
// Grass / Ice / Water use the rig below. Fire / Thunder keep their approved art and get
// hitboxes re-derived from the art's own per-frame positions (fireShapes/thunderShapes).
// ═════════════════════════════════════════════════════════════════════════════
export function gen1Phase(charId,move,q){
 const f=GEN1_TIMINGS[charId]?.[move]||[8,3,18],s=f[0],a=f[1],e=f[2],total=s+a+e,qq=clamp(q),el=qq*total+1e-6;
 return {s,a,e,total,q:qq,el,w:clamp(el/s),c:clamp((el-s)/a),act:el>=s&&el<s+a,post:el>=s+a,rec:clamp((el-s-a)/Math.max(1,e))};
}
const sg=(pts,w,hit=0,role='limb',o)=>({t:'seg',pts,w,hit,role,...o});
const ob=(x,y,r,hit=0,role='orb',o)=>({t:'orb',x,y,r,hit,role,...o});
const gh=(x,a)=>({t:'ghost',x,a});
const mk=(x,y,r,a,role='mark',o)=>({t:'mark',x,y,r,a,role,...o});
const gd=(x0,x1,y,hit=0,role='wave',o)=>({t:'ground',x0,x1,y,hit,role,...o});
const fade=ph=>ph.post?1-ease(ph.rec*1.6):1;
const sw=ph=>ph.act?.3+.7*ph.c:ph.post?1:-.2*ease(ph.w);
const ch=(fn,v,n=4)=>Array.from({length:n+1},(_,i)=>fn(v*i/n));
function gpInfo(ph){
 const dEnd=ph.s+Math.max(1,Math.floor(ph.a*.45)),lStart=Math.max(dEnd+1,Math.floor(ph.total*.58)),lEnd=lStart+Math.max(1,ph.a-(dEnd-ph.s));
 return {dEnd,lStart,lEnd,dive:ph.el>=ph.s&&ph.el<dEnd,land:ph.el>=lStart&&ph.el<lEnd,flying:ph.el<lStart,
  d:clamp(ph.el/(ph.s+1)),t1:ease((ph.el-lStart+1)/4),t2:ease((ph.el-lStart-1)/5),lf:1-ease((ph.el-lStart-5)/14)};
}
const RIG={g1_grass:{},g1_ice:{},g1_water:{}};
const GR=RIG.g1_grass, IC=RIG.g1_ice, WA=RIG.g1_water;

// ───────────────────────────── GRASS HERO ─────────────────────────────
GR.us=ph=>{const v=sw(ph),H=ph.act?1:0,a=fade(ph),P=[],sh=t=>[8+14*t,-56-62*t];
 // two quick side-steps (afterimages), then the shoulder-check vault
 if(!ph.act&&!ph.post){if(ph.w>.1&&ph.w<.55)P.push(gh(-17,Math.sin((ph.w-.1)/.45*Math.PI)));if(ph.w>.5)P.push(gh(15,Math.sin(clamp((ph.w-.5)/.5)*Math.PI)*.9));return P;}
 const s=clamp(v,0,1),e=sh(s);
 P.push(sg([[-22,-14],[-14,-38],[e[0]-16,e[1]+18]],10,0,'trail',{a}));
 P.push(sg(ch(sh,s,3),14,H*15,'shoulder',{a}));P.push(ob(e[0],e[1],20,H*24,'check',{a}));return P;};
GR.ds=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){if(ph.w>.35)P.push(gh(-24,Math.sin(clamp((ph.w-.35)/.65)*Math.PI)*.8));return P;}
 const t=ph.act?.3+.7*ph.c:1,x1=10+50*ease(t);
 P.push(sg([[8,-10],[(8+x1)/2,-18],[x1,-8]],11,H*10,'lowvine',{a}));P.push(ob(x1,-8,9,H*10,'bud',{a}));
 const t2=ph.act?clamp((ph.c-.4)/.6):1;   // second pulse: weaker, farther
 if(t2>0){const x2=x1+8+24*ease(t2);P.push(sg([[x1,-6],[x2,-6]],6,H*6,'pulse2',{a:a*.75}));P.push(ob(x2,-6,6,H*6,'bud',{a:a*.7}));}
 return P;};
GR.ss=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],tip=t=>[26+64*t,-66+26*t];
 if(!ph.act&&!ph.post){const f=ease(ph.w);P.push(sg([[4,-62],[16,-66+5*Math.sin(f*Math.PI*2)],[26,-62]],9,0,'feint',{a:.55*f}));return P;}
 const t=ph.act?.3+.7*ph.c:1,e=tip(t);
 P.push(sg([[8,-56],[20,-64],...ch(tip,t,3)],12,H*11,'limb',{a}));P.push(ob(e[0],e[1],12,H*13,'bud',{a}));return P;};
GR.uh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 const foot=c=>c<.6?[30,-132+86*ease(c/.6)]:[30-6*((c-.6)/.4),-46-76*ease((c-.6)/.4)];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(sg(Array.from({length:7},(_,i)=>{const k=i/6;return[-22+60*k,-26-106*Math.sin(k*Math.PI)];}),6,0,'path',{a:.5*w*(1-w*.3)}));return P;}
 const c=ph.act?ph.c:1,f=foot(c);
 P.push(sg(Array.from({length:5},(_,i)=>foot(c*i/4)),12,H*14,'trailpath',{a}));
 P.push(sg([[6,-62],[(6+f[0])/2-8,(-62+f[1])/2],f],11,H*12,'leg',{a}));P.push(ob(f[0],f[1],14,H*17,'heel',{a}));return P;};
GR.dh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){const w=ph.w;P.push(mk(0,-3,10+5*Math.sin(w*9),.25+.25*w,'still'));if(w>.82)P.push(mk(0,-3,22,(w-.82)/.18*.7,'late'));return P;}
 const t=ph.act?.25+.75*ph.c:1,S=18+57*ease(t),lag=ph.act?clamp((ph.c-.2)/.8):1;
 P.push(gd(-S,S,-5,H*10,'crack',{a}));P.push(gd(-S*lag,S*lag,-5,0,'roots',{a}));P.push(ob(0,-6,13,H*14,'bud',{a}));return P;};
GR.sh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],shd=t=>[16+46*t,-24-44*t];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(sg([[-46,-6],[-18,-5],[10+16*w,-8]],9,0,'slide',{a:.55*(.4+w*.6)}));P.push(ob(shd(0)[0],shd(0)[1],14,0,'coil',{a:.5*w}));return P;}
 const t=ph.act?.2+.8*ph.c:1,e=shd(t);
 P.push(sg([[4,-26],...ch(shd,t,3)],16,H*17,'ram',{a}));P.push(ob(e[0],e[1],19,H*22,'shoulder',{a}));
 if(t>.65){const lx=e[0]+60*ease((t-.65)/.35);P.push(sg([[e[0],e[1]],[(e[0]+lx)/2,e[1]-6],[lx,e[1]-2]],13,H*13,'lance',{a}));P.push(ob(lx,e[1]-2,12,H*14,'bud',{a}));}
 return P;};
GR.recovery=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(sg([[2,-44],[-20*w,-46],[-52*w,-44]],10,0,'burst',{a:.8*(1-w*.3)}));return P;}
 const v=ph.act?.3+.7*ph.c:1,y=-30-84*v;
 P.push(ob(0,-46,42,H*43,'aura',{a}));
 P.push(sg(Array.from({length:6},(_,i)=>{const k=i/5;return[8*Math.sin(k*6+1),-30+(y+30)*k];}),14,H*32,'spiral',{a}));return P;};
GR.groundPound=ph=>{const g=gpInfo(ph),P=[];
 if(g.flying){const d=ease(g.d),tx=4+42*d,ty=-52+86*d,a=1;
  P.push(sg([[2,-52],[(2+tx)/2,(-52+ty)/2-6],[tx,ty]],15,g.dive?20:0,'lance',{a}));P.push(ob(tx,ty,16,g.dive?22:0,'bud',{a}));return P;}
 const f=g.lf,r1=18+70*g.t1,r2=24+98*g.t2;
 P.push(gd(10,r1,-5,g.land?9:0,'burst',{a:f}));P.push(gd(-10,-r1*.72,-5,g.land?8:0,'burst',{a:f}));
 P.push(gd(r1*.6,r2,-5,g.land?5:0,'burst2',{a:f*.7}));P.push(gd(-r1*.5,-r2*.72,-5,g.land?4:0,'burst2',{a:f*.7}));return P;};
GR.super=ph=>{const P=[],a=fade(ph);
 for(let i=0;i<4;i++){const x=76+72*i,t=ease((ph.el-4-i*6.5)/8);
  if(t<=.02){if(ph.el>i*6)P.push(mk(x,-3,12,.5,'seedmark'));continue;}
  const hh=86*t,hit=ph.act&&ph.c<.6?12:0;
  P.push(sg([[x,-2],[x+5*Math.sin(i+1),-hh*.5],[x,-hh]],13,hit,'root',{a}));P.push(ob(x,-hh,10,0,'bud',{a}));}
 if(ph.act||ph.post){const d=ph.act?ease(.15+.85*ph.c):1,tx=24+310*d,ty=-52-14*Math.sin(d*Math.PI),H=ph.act?1:0;
  const pts=[0,.25,.5,.75,1].map(k=>[24+(tx-24)*k,-52-20*Math.sin(k*Math.PI)*(1-d*.5)]);
  P.push(sg(pts,17,H*14,'lance',{a}));P.push(ob(tx,ty,18,H*20,'bud',{a}));
  if(ph.post||ph.c>.8)P.push(ob(tx,ty,34+14*ease(ph.act?(ph.c-.8)/.2:1),H*(ph.c>.8?32:0),'bloom',{a}));}
 return P;};

// ───────────────────────────── ICE HERO ─────────────────────────────
IC.us=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],ang=v=>-2.2+6.2*v,pt=v=>[10+44*Math.cos(ang(v)),-84+34*Math.sin(ang(v))];
 if(!ph.act&&!ph.post){const f=ph.w;if(f>.1&&f<.6){const k=Math.sin((f-.1)/.5*Math.PI);P.push(sg([[10,-58],[30+8*k,-64]],7,0,'feint',{a:.6*k}));}return P;}
 const v=ph.act?.3+.7*ph.c:1,e=pt(v);
 P.push(sg(ch(pt,v,6),12,H*13,'blade',{a}));P.push(ob(e[0],e[1],11,H*14,'crystal',{a}));return P;};
IC.ds=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],t0=ph.act?ph.c:ph.post?1:ph.w*.25,R=ph.act?26+36*ease(.2+.8*ph.c):ph.post?62:14+10*ph.w;
 for(const k of [0,1]){const th=u=>TAU*(.15+.95*u)+k*Math.PI;
  const arc=Array.from({length:7},(_,i)=>{const t=th(Math.max(0,t0-.3*(1-i/6)));return[Math.cos(t)*R,-8+Math.sin(t)*R*.3];});
  const tip=[Math.cos(th(t0))*R,-8+Math.sin(th(t0))*R*.3];
  P.push(sg(arc,10,H*9,'sweep',{a}));P.push(sg([[0,-12],tip],9,H*9,'leg',{a}));}
 P.push(mk(0,-3,8,.5,'pivot'));return P;};
IC.ss=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){const f=ph.w;if(f>.25&&f<.75){const k=Math.sin((f-.25)/.5*Math.PI);P.push(sg([[10,-54],[10+26*k,-53]],7,0,'feint',{a:.6*k}));}return P;}
 const t=ph.act?.4+.6*ph.c:1,tx=24+72*t;
 P.push(sg([[10,-54],[tx,-52]],9,H*10,'blade',{a}));P.push(ob(tx,-52,9,H*10,'point',{a}));return P;};
IC.uh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],tip=t=>[18+12*t,-60-84*t];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(mk(0,-56,34*(1-.25*w),.3+.4*w,'spin',{rot:w*TAU*1.5}));return P;}
 const v=ph.act?.3+.7*ph.c:1,e=tip(v);
 P.push(sg([[6,-58],...ch(tip,v,3)],14,H*15,'arm',{a}));P.push(ob(e[0],e[1],18,H*(v>.6?24:16),'crystal',{a}));
 if(v>.45)P.push(mk(e[0],e[1],14+10*v,a*.8,'late'));return P;};
IC.dh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(gd(-w*34,w*34,-3,0,'creep',{a:.5}));P.push(mk(0,-3,8,.4,'pivot'));return P;}
 const S=24+51*(ph.act?.4+.6*ph.c:1);
 P.push(gd(-S,S,-5,H*10,'spikes',{a}));P.push(ob(0,-6,12,H*12,'crystal',{a}));return P;};
IC.sh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(sg([[8,-62],[6,-96-w*30],[4,-126]],12,0,'haft',{a:.9}));P.push(ob(4,-132,18+8*w,0,'maul',{a:.9}));return P;}
 const t=ph.act?.3+.7*ph.c:1,tx=28+90*t;
 P.push(sg([[10,-62],[(10+tx)/2,-61],[tx,-60]],15,H*14,'haft',{a}));P.push(ob(tx,-60,19,H*22,'maul',{a}));return P;};
IC.recovery=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],M=[48,-86];
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(mk(M[0],M[1],10+8*w,.3+.5*w,'rune'));return P;}
 const e=ease(ph.act?.3+.7*ph.c:1),pos=[M[0]*e,-46+(M[1]+46)*e];
 P.push(mk(M[0],M[1],18,a*.6,'rune'));P.push(sg([[0,-46],pos],16,H*30,'snap',{a}));P.push(ob(pos[0],pos[1],30,H*34,'body',{a}));
 if(!ph.act||ph.c>.4)P.push(ob(22,-96,22,H*30,'lift',{a:a*.8}));return P;};
IC.groundPound=ph=>{const g=gpInfo(ph),P=[];
 if(g.flying){const d=ease(g.d),pts=Array.from({length:5},(_,i)=>{const k=i/4,pk=d*k;return[8+34*Math.sin(pk*Math.PI)*(1-.4*pk),-52+88*pk];}),e=pts[4];
  P.push(sg(pts,15,g.dive?20:0,'shard',{a:1}));P.push(ob(e[0],e[1],17,g.dive?22:0,'crystal',{a:1}));return P;}
 const f=g.lf,r1=18+66*g.t1,r2=24+90*g.t2;
 P.push(gd(-r1,r1,-5,g.land?9:0,'spikes',{a:f}));P.push(gd(-r2,r2,-5,g.land?5:0,'spikes2',{a:f*.7}));return P;};
IC.super=ph=>{const P=[],a=fade(ph);
 if(!ph.act&&!ph.post){const w=ease(ph.w);P.push(ob(34,-58,8+14*w,0,'crystal',{a:.4+.5*w}));return P;}
 const c=ph.act?ph.c:1,H=ph.act?1:0;
 const T=c<.62?(()=>{const u=ease(c/.62);return[34+260*u,-58-46*Math.sin(u*Math.PI*.9)];})():(()=>{const u=ease((c-.62)/.38);return[294-242*u,-62+22*Math.sin(u*Math.PI)];})();
 const trail=Array.from({length:7},(_,i)=>{const cc=Math.max(0,c-.14*(1-i/6));
  return cc<.62?(()=>{const u=ease(cc/.62);return[34+260*u,-58-46*Math.sin(u*Math.PI*.9)];})():(()=>{const u=ease((cc-.62)/.38);return[294-242*u,-62+22*Math.sin(u*Math.PI)];})();});
 P.push(sg(trail,14,H*12,'frostarc',{a}));
 if(c>.84||ph.post){const k=ph.act?ease((c-.84)/.16):1;P.push(ob(52,-60,34+30*k,H*(c>.84?50:0),'burst',{a}));}
 else P.push(ob(T[0],T[1],17,H*22,'crystal',{a}));
 return P;};

// ───────────────────────────── WATER HERO ─────────────────────────────
WA.us=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],F=t=>[-18+46*Math.sin(t*Math.PI*.62),-34-78*t];
 if(!ph.act&&!ph.post){P.push(sg([[-40,-18],[-32,-50],[-8,-70]],9,0,'blur',{a:.3*ease(ph.w)}));return P;}
 const v=ph.act?.3+.7*ph.c:1,e=F(v);
 P.push(sg(ch(F,v,5),12,H*13,'jet',{a}));P.push(ob(e[0],e[1],14,H*18,'fist',{a}));return P;};
WA.ds=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){if(ph.w>.4)P.push(mk(30,-3,6+10*(ph.w-.4)/.6,.6,'ripple'));return P;}
 const t=ph.act?.3+.7*ph.c:1,h=78*ease(t);
 P.push(sg([[30,-4],[30,-4-h*.5],[30,-4-h]],26,H*20,'geyser',{a}));P.push(gd(-16,76,-6,H*13,'surge',{a}));P.push(ob(30,-4-h,16,H*18,'orb',{a}));return P;};
WA.ss=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){P.push(mk(92,-50,5+4*Math.sin(ph.w*8),.2+.6*ph.w,'tell'));return P;}
 const t=ph.act?.4+.6*ph.c:1,tx=14+84*t;
 P.push(sg([[10,-50],[tx,-50]],8,H*8,'jet',{a}));P.push(ob(tx,-50,8,H*9,'drop',{a}));return P;};
WA.uh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],T=t=>[30-46*t,-56-90*Math.sin(t*Math.PI*.55)];
 if(!ph.act&&!ph.post){P.push(ob(30,-58,10+4*ph.w,0,'grip',{a:.5+.4*ph.w}));return P;}
 const v=ph.act?.3+.7*ph.c:1,e=T(v);
 P.push(ob(30,-58,22,H*(ph.act&&ph.c<.5?26:0),'grip',{a:a*.8}));
 P.push(sg(ch(T,v,5),16,H*20,'torrent',{a}));P.push(ob(e[0],e[1],24,H*28,'orb',{a}));return P;};
WA.dh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){const w=ph.w;P.push(sg(Array.from({length:7},(_,i)=>{const k=i/6;return[-24+40*k,-8-46*Math.sin(k*Math.PI)*(1-w*.2)];}),7,0,'path',{a:.45*Math.sin(w*Math.PI)}));return P;}
 const t=ph.act?.4+.6*ph.c:1,S1=22+44*t,S2=28+52*ease(t);
 P.push(ob(16,-12,13,H*15,'knee',{a}));P.push(gd(-S1,S1,-5,H*10,'wave1',{a}));P.push(gd(-S2,S2,-5,H*6,'wave2',{a:a*.7}));return P;};
WA.sh=ph=>{const H=ph.act?1:0,a=fade(ph),P=[],ang=v=>-1.15+1.65*v,pt=(v,r)=>[24+r*Math.cos(ang(v)),-58+r*Math.sin(ang(v))];
 if(!ph.act&&!ph.post){if(ph.w>.3)P.push(gh(-14,Math.sin(clamp((ph.w-.3)/.7)*Math.PI)*.8));return P;}
 const v=ph.act?.3+.7*ph.c:1;
 P.push(sg(Array.from({length:6},(_,i)=>pt(Math.max(0,v-.45)+ (v-Math.max(0,v-.45))*i/5,96)),10,0,'trail',{a:a*.5}));
 P.push(sg(Array.from({length:6},(_,i)=>pt(v*i/5,96)),18,H*15,'crescent',{a}));P.push(sg(Array.from({length:6},(_,i)=>pt(v*i/5,62)),10,H*12,'crescentIn',{a:a*.65}));return P;};
WA.recovery=ph=>{const H=ph.act?1:0,a=fade(ph),P=[];
 if(!ph.act&&!ph.post){P.push(ob(14,-46,16-4*ph.w,0,'roll',{a:.5+.4*ph.w,rot:ph.w*TAU*2}));return P;}
 const t=ph.act?.3+.7*ph.c:1,y=-44-62*ease(t);
 P.push(sg([[0,-48],[16,y]],24,H*30,'bounce',{a}));P.push(ob(16,y,30,H*34,'orb',{a}));return P;};
WA.groundPound=ph=>{const g=gpInfo(ph),P=[];
 if(g.flying){const d=ease(g.d),u=ph.el*.5,pts=Array.from({length:6},(_,i)=>{const k=i/5;return[10*Math.sin(k*TAU*1.5+u),-50+88*d*k];}),e=pts[5];
  P.push(sg(pts,14,g.dive?22:0,'screw',{a:1}));P.push(ob(e[0],e[1],20,g.dive?24:0,'orb',{a:1}));return P;}
 const f=g.lf,r1=18+58*g.t1,r2=26+70*g.t2;
 P.push(gd(-r1,r1,-5,g.land?9:0,'wave1',{a:f}));P.push(gd(-r2,r2,-5,g.land?5:0,'wave2',{a:f*.7}));return P;};
WA.super=ph=>{const P=[],a=fade(ph),X=[56,124,192];
 if(!ph.act&&!ph.post){for(let i=0;i<3;i++){const t=ease((ph.el-3-i*7)/8);if(t>.02)P.push(ob(X[i],-48,6+8*t,0,'mark',{a:.4+.5*t}));}return P;}
 const c=ph.act?ph.c:1,H=ph.act?1:0;
 for(let i=0;i<3;i++){const t=clamp((c-i*.22)/.3);
  if(t<=0){P.push(ob(X[i],-48,14,0,'mark',{a}));continue;}
  const hh=120*ease(t);P.push(sg([[X[i],-4],[X[i],-4-hh*.5],[X[i],-4-hh]],26+10*t,H*(t<1?22:0),'geyser',{a:a*(1-.3*t)}));P.push(ob(X[i],-4-hh,18+10*t,H*(t<1?24:0),'orb',{a}));}
 if(c>.62||ph.post){const k=ph.act?ease((c-.62)/.38):1,rx=30+80*k,ry=.62*rx,cx=124,cy=-52;
  P.push(sg(Array.from({length:14},(_,i)=>{const t=i/13*TAU;return[cx+Math.cos(t)*rx,cy+Math.sin(t)*ry];}),12,H*(c>.62?10:0),'ring',{a}));}
 return P;};

export function getGen1Rig(charId,move,q){
 const fn=RIG[charId]?.[move];if(!fn)return [];
 return fn(gen1Phase(charId,move,q));
}
function rigShapes(parts){
 const out=[];
 for(const p of parts){if(!(p.hit>0))continue;
  if(p.t==='seg'){if(p.pts.length===1)out.push(circle(p.pts[0][0],p.pts[0][1],p.hit));for(let i=0;i<p.pts.length-1;i++)out.push(line(p.pts[i][0],p.pts[i][1],p.pts[i+1][0],p.pts[i+1][1],p.hit));}
  else if(p.t==='orb')out.push(circle(p.x,p.y,p.hit));
  else if(p.t==='ground')out.push(line(p.x0,p.y,p.x1,p.y,p.hit));}
 return out;
}

// ── Fire Hero: hitboxes re-derived from the approved art's own per-frame positions ──
function fireShapes(move,ph){
 const S=[],c=ph.c,el=ph.el,s=ph.s,sinp=Math.sin;
 if(move==='us'&&ph.act){const tr=ease(clamp((el-s*.62)/Math.max(1,ph.total-s*.62))),rx=26+tr*72,ry=-54-tr*74+tr*tr*38;S.push(circle(rx,ry,22),line(rx-20,ry+11,rx,ry,12));}
 else if(move==='ds'){let sp=0;if(el>=s&&el<s+2)sp=22+12*clamp((el-s)/2);else if(el>=s+8&&el<s+10)sp=40+18*clamp((el-s-8)/2);if(sp>0)S.push(line(24-sp,-2,24+sp,-2,8),circle(24,-2,11));}
 else if(move==='ss'&&ph.act){const hx=22+53*ease(c),hy=-22-39*sinp(c*Math.PI*.82),P=[[12,-14],[21,-24],[hx*.62,hy*.72],[hx,hy]];for(let i=0;i<3;i++)S.push(line(P[i][0],P[i][1],P[i+1][0],P[i+1][1],9));S.push(circle(hx,hy,13+5*sinp(c*Math.PI)));}
 else if((move==='uh')&&ph.act){const cx=10+12*c,cy=-78-25*c,rx=28+10*c,ry=15+5*c;S.push(box(cx-rx,cy-ry-3,rx*2,ry*2+6),line(-10,-52,cx-8,cy+8,13),circle(cx,cy,17));}
 else if(move==='dh'&&ph.act){const sp=30+45*c;S.push(line(20-sp,-3,20+sp,-3,9),circle(20,-3,14+8*c));}
 else if(move==='sh'&&ph.act){const ex=ease(c),hx=48,hy=-45,tx=hx+20+48*ex,P=[[hx-5,hy],[hx+5,hy-1],[hx+20+18*ex,hy-2],[tx,hy-4]];for(let i=0;i<3;i++)S.push(line(P[i][0],P[i][1],P[i+1][0],P[i+1][1],12));S.push(circle(tx,hy-4,14+8*sinp(c*Math.PI)));}
 else if(move==='recovery'&&ph.act){S.push(circle(16,-42,24),circle(20,-70,14+10*c));}
 else if(move==='groundPound'){const g=gpInfo(ph);
  if(g.dive){const cy=-25+18*c;S.push(circle(0,cy,24+12*c),line(0,cy-12,0,cy+26,22));}
  else if(g.land){const r=20+60*ease(clamp((el-s-ph.a)/Math.max(1,ph.total-s-ph.a)));S.push(line(-r,-3,r,-3,8),circle(0,-3,12));}}
 return S;
}
// ── Thunder Hero: hitboxes re-derived from the approved art (all use full-animation progress) ──
function thunderShapes(move,ph){
 const q=ph.q,S=[];
 if(move==='us'&&ph.act){const fr=1+q*11,ot=clamp((fr-2)/6),th=-Math.PI/2+ease(ot)*TAU,pt=t=>[Math.cos(t)*86,-112+Math.sin(t)*34],a=pt(th),b=pt(th-.5);S.push(circle(a[0],a[1],18),line(b[0],b[1],a[0],a[1],12));}
 else if(move==='ds'&&ph.act){S.push(circle(-22,-45,11),circle(22,-45,11));if(q>.28){const r=18+ease(q)*35,P=Array.from({length:9},(_,i)=>{const a=Math.PI+i/8*Math.PI;return[Math.cos(a)*r,-24+Math.sin(a)*r];});for(let i=0;i<8;i++)S.push(line(P[i][0],P[i][1],P[i+1][0],P[i+1][1],8));}}
 else if((move==='ss'||move==='sh')&&ph.act){const len=move==='sh'?100:68,tx=24+len*easeOutG(q),ty=-50+Math.sin(q*TAU)*(move==='sh'?34:24)*.16,r=move==='sh'?14:11;S.push(line(24,-50,tx,ty,r),circle(tx,ty,r));}
 else if(move==='uh'&&ph.act){const top=-38-easeOutG(q)*150;for(const dx of [24,82,140])S.push(box(dx-2,top-24,26,104));}
 else if(move==='dh'&&ph.act){const an=-Math.PI/2+easeOutG(q)*TAU,bx=20+Math.cos(an)*94,by=-72+Math.sin(an)*56.4;S.push(circle(bx,by,18));for(let i=1;i<=3;i++)S.push(circle(bx-Math.cos(an)*i*12,by-Math.sin(an)*i*7,12));}
 else if(move==='recovery'&&ph.act){const cr=ease(clamp(q/.24)),ri=ease(clamp((q-.24)/.42)),sx=Math.sin(q*TAU)*9,sy=-8-68*ri;
  S.push(line(-20,-25,-29+14*cr,-12,10),line(-29+14*cr,-12,-7+12*cr,sy+16,10),line(-7+12*cr,sy+16,sx,sy,10),line(sx,sy,sx+10,sy-26,12),circle(sx,sy,16),circle(0,-44,30));}
 else if(move==='groundPound'){const g=gpInfo(ph);
  if(g.dive){const dv=ease(clamp(q/.565)),sx=12+34*dv,sy=-18-76*dv;S.push(line(4,-24,sx,sy,12),circle(sx,sy,16),circle(6,8,22),line(6,-20,6,24,20));}
  else if(g.land){const ld=ease(clamp((q-.565)/.12)),r1=18+70*ld;S.push(line(-r1,-3,r1,-3,8),circle(0,-3,14));}}
 return S;
}
const easeOutG=t=>1-Math.pow(1-clamp(t),3);

export function getGen1AttackGeometry(charId,move,p=0){
 const q=clamp(p);
 if(charId==='g1_fire'||charId==='g1_thunder'){
  if(move==='super')return legacyGen1Geometry(charId,move,p);           // approved supers are untouched
  const ph=gen1Phase(charId,move,q);
  return charId==='g1_fire'?fireShapes(move,ph):thunderShapes(move,ph);
 }
 return rigShapes(getGen1Rig(charId,move,q));
}
