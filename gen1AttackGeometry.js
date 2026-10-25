const TAU = Math.PI * 2;
// Shared Generation-I attack silhouettes. Coordinates are fighter-local (origin at feet/center),
// facing right. The renderer and collision system consume the same geometry every frame.
export const GEN1_TIMINGS = {
 g1_fire:{us:[10,2,13],ds:[11,4,27],ss:[4,5,17],uh:[14,5,38],dh:[14,4,27],sh:[17,7,37],recovery:[5,3,20],super:[30,15,48],groundPound:[8,5,19]},
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
 if(d?.isGroundPound||d?.type==='groundPound')return 'groundPound';
 if(d?.isRecovery||d?.type==='recovery'||d?.recoveryAnimationKey)return 'recovery';
 if(d?.isSuper||d?.sigType==='super')return 'super';
 if(d?.isHeavy){if(['downHeavy','down','dh'].includes(d.sigType))return 'dh';if(['upHeavy','upheavy','uh'].includes(d.sigType))return 'uh';return 'sh';}
 if(['up','upSignature','us'].includes(d?.sigType))return 'us';
 if(['down','downSignature','downNormal','ds'].includes(d?.sigType))return 'ds';
 return 'ss';
}
// Full-animation progress, not active-window-normalized progress, so collision is literally on the rendered pose.
export function getGen1AttackGeometry(charId,move,p=0){
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
