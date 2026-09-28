// Generation V attack overhaul.
// Detailed procedural animations + matching narrow hitboxes + per-contact knockback.
// Purple is intentionally excluded except for Side Signature and Down Signature.

const G5 = new Set([
  'yellow','blue','purple','orange','green','pink','grey','turquoise','olive','copper','emerald','pearl',
  'red','lavender','amber','black','magenta','indigo','maroon','scarlet','white','silver',
  'corpent','magneto','willow','cable','snodvor','kirsten','volt','temple','nightmare','hazel','whami','controller','evil',
  'life','death','mercy'
]);

const PROFILE = {
  yellow:['#FFD700','#FFA500','enhance'], blue:['#4488FF','#66CCFF','water'], purple:['#9944CC','#CC66FF','blade'],
  orange:['#FF8800','#FFAA44','portal'], green:['#44AA44','#66CC66','earth'], pink:['#FF66AA','#FF99CC','tele'],
  grey:['#888888','#AAAAAA','barrier'], turquoise:['#44CCAA','#66EECC','morph'], olive:['#808000','#AAAA44','scale'],
  copper:['#CC7744','#DD9966','time'], emerald:['#33CC66','#55EE88','phase'], pearl:['#EEEEDD','#FFFFFF','echo'],
  red:['#FF3333','#FF6644','fire'], lavender:['#BB88DD','#DDAAFF','airsolid'], amber:['#FFBB33','#FFDD66','clone'],
  black:['#333333','#FFFF44','thunder'], magenta:['#FF44AA','#FF77CC','glue'], indigo:['#4B0082','#7744AA','gravity'],
  maroon:['#800000','#AA3333','energy'], scarlet:['#FF2400','#FF5533','death'], white:['#EEEEEE','#FFFFFF','flight'],
  silver:['#C0C0C0','#E0E0E0','metal'], corpent:['#775533','#997755','hammer'], magneto:['#AAAAAA','#CCCCCC','metal'],
  willow:['#448833','#66AA55','vine'], cable:['#4488CC','#66AAEE','circuit'], snodvor:['#AADDFF','#CCEEFF','snow'],
  kirsten:['#FF4400','#FF6622','inferno'], volt:['#CCAA00','#DDCC22','sound'], temple:['#AA6633','#CC8855','dismantle'],
  nightmare:['#442266','#663388','dream'], hazel:['#2D5A1B','#4A9A2A','thorn'], whami:['#F5DEB3','#EEDD99','potion'],
  controller:['#0A0A2A','#2222AA','puppet'], evil:['#7700AA','#AA00CC','erase'], life:['#44FF44','#88FF88','growth'],
  death:['#AAAAAA','#CCCCCC','closure'], mercy:['#FF99DD','#FFBBEE','balance']
};

const PURPLE_ALLOWED = new Set(['side','down']);
const MOVES = ['side','up','down','heavy','downHeavy','super'];

function isG5(id){ return G5.has(id) && !(id === 'purple' ? false : false); }
function shouldOverride(id, move){ return isG5(id) && (id !== 'purple' || PURPLE_ALLOWED.has(move)); }

function moveOf(data){
  if (data?.isSuper || data?.sigType === 'super') return 'super';
  if (data?.isHeavy || data?.sigType === 'heavy') return data?.sigType === 'downHeavy' ? 'downHeavy' : 'heavy';
  return data?.sigType === 'up' ? 'up' : data?.sigType === 'down' ? 'down' : 'side';
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function norm(x,y){const m=Math.hypot(x,y)||1;return {x:x/m,y:y/m};}
function aimFor(attacker,facing=1){
  const ax=Number(attacker?.attackData?.aimX ?? attacker?.facing ?? facing);
  const ay=Number(attacker?.attackData?.aimY ?? 0);
  const n=norm(ax,ay);
  return n;
}
function rotate(v,a){const c=Math.cos(a),s=Math.sin(a);return{x:v.x*c-v.y*s,y:v.x*s+v.y*c};}
function pt(x,y,dx,dy,d){return [x+dx*d,y+dy*d];}
function capsule(x1,y1,x2,y2,r){return {shape:'capsule',x1,y1,x2,y2,r};}
function circle(x,y,r){return {shape:'circle',x,y,r};}
function box(x,y,w,h){return {shape:'box',x,y,w,h};}
function arcPoints(cx,cy,r,a0,a1,n){const out=[];for(let i=0;i<n;i++){const t=n===1?0:i/(n-1);const a=lerp(a0,a1,t);out.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return out;}
function arcHit(cx,cy,r,a0,a1,n,rad){return arcPoints(cx,cy,r,a0,a1,n).map(p=>circle(p[0],p[1],rad));}

// The same primitives used for rendering are used to build collision shapes.
// This keeps hitboxes attached to the visible effect rather than a generic box.
export function getGen5Hitboxes(attacker){
  const id=attacker?.char?.id; const move=moveOf(attacker?.attackData); if(!shouldOverride(id,move)) return [];
  const p=clamp(Number(attacker.attackData?.progress||0),0,1); const f=attacker.facing||1; const a=aimFor(attacker,f);
  const x=attacker.x,y=attacker.y-30; const [,accent,theme]=PROFILE[id];
  const t=clamp((p-0.12)/0.68,0,1); const out=[];
  const sideDir=a.x>=0?1:-1;
  const dir=move==='up'?{x:0,y:-1}:move==='down'?{x:0,y:1}:a;
  const d=Math.hypot(dir.x,dir.y)||1;
  const dx=dir.x/d,dy=dir.y/d;
  const px=-dy,py=dx;

  if(move==='side'||move==='heavy'){
    const reach=move==='heavy'?108:78;
    const sweep=(theme==='blade'||theme==='metal'||theme==='hammer'||theme==='fire'||theme==='inferno') ? 42 : 28;
    const ang0=-0.65, ang1=0.65;
    const ang=lerp(ang0,ang1,t)* (dx>=0?1:-1);
    const baseX=x+dx*18,baseY=y+dy*18;
    const ex=baseX+Math.cos(ang)*reach*dx-Math.sin(ang)*reach*dy;
    const ey=baseY+Math.sin(ang)*reach*dx+Math.cos(ang)*reach*dy;
    if(theme==='sound'||theme==='echo'||theme==='airsolid'||theme==='water'||theme==='gravity'||theme==='circuit'){
      out.push(capsule(baseX,baseY,ex,ey,move==='heavy'?10:7));
      if(theme==='sound'||theme==='echo') out.push(...arcHit(ex,ey,10,-Math.PI,Math.PI,3,5));
    } else if(theme==='portal'){
      out.push(circle(ex,ey,move==='heavy'?16:11));
    } else if(theme==='tele'||theme==='puppet'||theme==='glue'){
      out.push(capsule(baseX,baseY,ex,ey,move==='heavy'?11:8));
    } else {
      out.push(capsule(baseX,baseY,ex,ey,sweep));
    }
  } else if(move==='up'){
    const lift=move==='up'?84:84; const w=theme==='water'||theme==='airsolid'||theme==='growth'?14:11;
    out.push(capsule(x+dx*6,y-4,x+dx*6,y-lift,w));
    if(theme==='thunder'||theme==='circuit'||theme==='sound') out.push(circle(x+dx*6,y-lift,13));
  } else if(move==='down'){
    if(theme==='blade'){
      out.push(capsule(x-30,y+4,x+30,y+4,7));
    } else if(theme==='portal'||theme==='phase'||theme==='tele'||theme==='puppet'||theme==='dream'){
      out.push(circle(x,y+18,28));
    } else {
      const r=theme==='hammer'||theme==='earth'||theme==='barrier'||theme==='metal'?38:30;
      out.push(...arcHit(x,y+12,r,Math.PI*0.12,Math.PI*0.88,5,theme==='thorn'||theme==='vine'?8:7));
    }
  } else if(move==='downHeavy'){
    const r=theme==='gravity'||theme==='erase'||theme==='balance'?54:46;
    if(theme==='thorn'||theme==='vine'||theme==='growth'||theme==='earth'||theme==='barrier'){
      for(let i=0;i<5;i++){const xx=x-50+i*25;out.push(capsule(xx,y+8,xx,y+55,7));}
    } else if(theme==='thunder'||theme==='circuit'||theme==='sound'||theme==='echo'){
      out.push(...arcHit(x,y+14,r,0,Math.PI,7,7));
    } else out.push(...arcHit(x,y+14,r,0,Math.PI*2,8,7));
  } else if(move==='super'){
    if(theme==='blade'||theme==='hammer'||theme==='metal'||theme==='dismantle'||theme==='closure'||theme==='erase'){
      out.push(...arcHit(x,y,100,0,Math.PI*2,12,10));
    } else if(theme==='portal'||theme==='phase'||theme==='dream'||theme==='tele'||theme==='puppet'){
      out.push(circle(x,y,88),circle(x+dx*45,y+dy*45,34));
    } else {
      out.push(...arcHit(x,y,88,0,Math.PI*2,12,9));
    }
  }
  return out;
}

export function getGen5AttackSpec(charId, data){
  const move=moveOf(data); if(!shouldOverride(charId,move)) return null;
  const prof=PROFILE[charId];
  const directional = move==='heavy' || move==='super' || ['orange','pink','turquoise','copper','emerald','pearl','lavender','amber','indigo','controller','evil','life','death','mercy','blue','red','black','maroon'].includes(charId);
  const shape = move==='super'?'radial':move==='downHeavy'?'ground':move==='up'?'vertical':move==='down'?'radial':'forward';
  const knockback = move==='up'?'up':move==='down'?(charId==='death'?'down':'radial'):(move==='super'?'radial':'forward');
  return {
    id:`g5_${charId}_${move}`, shape, knockback, directional,
    description:`${charId} ${move} — Generation V detailed attack animation`,
    getHitboxes:getGen5Hitboxes,
  };
}

export function getGen5KnockbackVector(attacker,defender){
  const id=attacker?.char?.id; const move=moveOf(attacker?.attackData); const [,accent,theme]=PROFILE[id]||[];
  const spec=getGen5AttackSpec(id,attacker.attackData); if(!spec) return null;
  const dx=defender.x-attacker.x,dy=(defender.y-30)-(attacker.y-30); const dist=Math.hypot(dx,dy)||1;
  let x=dx/dist,y=dy/dist;
  if(spec.knockback==='up'){x=clamp(x*0.35,-0.45,0.45);y=-Math.sqrt(Math.max(0.7,1-x*x));}
  else if(spec.knockback==='down'){x=clamp(x*0.55,-0.7,0.7);y=Math.sqrt(Math.max(0.5,1-x*x));}
  else if(spec.knockback==='forward'){const a=aimFor(attacker,attacker.facing||1);x=a.x;y=a.y*0.7;}
  else if(spec.knockback==='radial'){x=dx/dist;y=dy/dist;}
  if(theme==='gravity') { x*=1.0; y*=1.15; }
  if(theme==='sound'||theme==='echo') { const q=Math.sin((attacker.attackData.progress||0)*Math.PI); x=clamp(x+q*0.12,-1,1); }
  return norm(x,y);
}

function line(ctx,x1,y1,x2,y2,w,col,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function glowCircle(ctx,x,y,r,col,alpha=.7){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function ring(ctx,x,y,r,col,w=3,alpha=.7){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
function particles(ctx,x,y,col,count=8,spread=35,p=.5){for(let i=0;i<count;i++){const a=i/count*Math.PI*2+p*5;const r=spread*(0.3+((i*37)%10)/10);glowCircle(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r,2+(i%3),col,.35);}}
function drawStick(ctx,x,y,facing,col,accent,pose=0){
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=5;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(x,y-55,11,0,Math.PI*2);ctx.fill();
  const lean=Math.sin(pose*Math.PI)*5;
  line(ctx,x,y-42,x+lean,y-15,5,col,.95);
  line(ctx,x,y-35,x+facing*20,y-20,5,accent,.95);
  line(ctx,x,y-35,x-facing*17,y-17,5,col,.95);
  line(ctx,x+lean,y-15,x+facing*16,y+2,5,col,.95);
  line(ctx,x+lean,y-15,x-facing*14,y+3,5,accent,.95);
  ctx.restore();
}

function drawTheme(ctx,id,move,x,y,p,facing,aim){
  const [col,accent,theme]=PROFILE[id]; const t=clamp((p-.06)/.88,0,1); const dir=aim;
  const bx=x+dir.x*12,by=y-30+dir.y*12;
  drawStick(ctx,x,y,facing,col,accent,t);
  ctx.save();
  if(theme==='enhance'){ for(let i=0;i<3;i++) line(ctx,x+dir.x*12,y-30+dir.y*12,x+dir.x*(35+i*12),y-30+dir.y*(35+i*12),8-i*2,accent,.3+.2*t); particles(ctx,bx,by,accent,10,28,t); }
  else if(theme==='water'){ for(let i=0;i<4;i++){const r=18+i*9;ring(ctx,bx,by,r,accent,2,.45);}; particles(ctx,bx+dir.x*45,by+dir.y*45,accent,12,20,t); }
  else if(theme==='blade'){ const a=Math.atan2(dir.y,dir.x)+lerp(-.9,.9,t); const r=70+(move==='heavy'?28:0); const ex=x+Math.cos(a)*r,ey=y-30+Math.sin(a)*r; line(ctx,bx,by,ex,ey,8,col,.95); line(ctx,bx,by,ex,ey,3,accent,.9); }
  else if(theme==='portal'){ ring(ctx,bx,by,18,accent,5,.9); ring(ctx,bx+dir.x*55,by+dir.y*55,16,accent,4,.75); line(ctx,bx,by,bx+dir.x*55,by+dir.y*55,3,accent,.5); }
  else if(theme==='earth'){ for(let i=0;i<5;i++){const xx=x+dir.x*(30+i*16), yy=y-8+dir.y*(30+i*16); ctx.fillStyle=accent;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(xx-9,yy+9);ctx.lineTo(xx,yy-12);ctx.lineTo(xx+10,yy+8);ctx.closePath();ctx.fill();} }
  else if(theme==='tele'||theme==='puppet'){ for(let i=0;i<4;i++){const a=i*Math.PI/2+t*2; const ex=x+Math.cos(a)*55,ey=y-30+Math.sin(a)*42; line(ctx,x,y-30,ex,ey,3,accent,.7); glowCircle(ctx,ex,ey,7,accent,.65);} }
  else if(theme==='barrier'){ const w=move==='heavy'?100:68,h=move==='downHeavy'?18:12; ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.globalAlpha=.85;ctx.strokeRect(x+dir.x*25-w/2,y-55+dir.y*25-h/2,w,h); ctx.globalAlpha=.25;ctx.fillStyle=accent;ctx.fillRect(x+dir.x*25-w/2,y-55+dir.y*25-h/2,w,h); }
  else if(theme==='morph'){ ctx.strokeStyle=accent;ctx.lineWidth=6;ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(x,y-30,25+20*Math.sin(t*Math.PI),0,Math.PI*2);ctx.stroke(); particles(ctx,bx,by,accent,12,35,t); }
  else if(theme==='scale'){ const s=1+1.3*t; ring(ctx,bx,by,20*s,accent,3,.65); ring(ctx,bx,by,10*s,accent,2,.45); }
  else if(theme==='time'){ for(let i=0;i<4;i++) ring(ctx,bx,by,15+i*11,accent,2,.35+i*.1); line(ctx,bx-30,by,bx+30,by,2,accent,.7); }
  else if(theme==='phase'){ ctx.globalAlpha=.25;ctx.fillStyle=accent;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(x+(i-1.5)*18,y-30,7,28,0,0,Math.PI*2);ctx.fill();} }
  else if(theme==='echo'||theme==='sound'){ for(let i=0;i<5;i++){const r=12+i*13+t*18;ring(ctx,bx,by,r,accent,2,.55-i*.07);} }
  else if(theme==='fire'||theme==='inferno'){ for(let i=0;i<7;i++){const xx=bx+dir.x*(i*12),yy=by+dir.y*(i*12)-Math.sin((i+t)*2)*8;glowCircle(ctx,xx,yy,7+(i%3)*2,accent,.5); } }
  else if(theme==='airsolid'){ for(let i=0;i<5;i++){const r=22+i*10;ring(ctx,bx,by,r,accent,2,.28);line(ctx,bx+dir.x*r,by+dir.y*r,bx+dir.x*(r+18),by+dir.y*(r+18),3,accent,.45);} }
  else if(theme==='clone'){ for(let i=0;i<4;i++){const ox=(i-1.5)*26;drawStick(ctx,x+ox,y,facing,col,accent,t);ctx.globalAlpha=.2;} }
  else if(theme==='thunder'){ for(let i=0;i<5;i++){const ex=bx+dir.x*(35+i*10),ey=by+dir.y*(35+i*10);line(ctx,bx,by,ex,ey,3,accent,.8);glowCircle(ctx,ex,ey,4,accent,.7);} }
  else if(theme==='glue'){ for(let i=0;i<5;i++){const a=i/4*Math.PI*2;const ex=bx+Math.cos(a)*40,ey=by+Math.sin(a)*30;line(ctx,bx,by,ex,ey,7,accent,.45);glowCircle(ctx,ex,ey,5,accent,.55);} }
  else if(theme==='gravity'){ ring(ctx,bx,by,28,accent,3,.8);for(let i=0;i<6;i++){const a=i*Math.PI/3+t*2;line(ctx,bx+Math.cos(a)*12,by+Math.sin(a)*12,bx+Math.cos(a)*45,by+Math.sin(a)*45,3,accent,.65);} }
  else if(theme==='energy'){ ring(ctx,bx,by,18+15*t,accent,5,.75);particles(ctx,bx,by,accent,14,45,t); }
  else if(theme==='death'||theme==='closure'){ line(ctx,bx-dir.x*45,by-dir.y*45,bx+dir.x*55,by+dir.y*55,5,accent,.8); for(let i=0;i<4;i++)ring(ctx,bx,by,18+i*9,accent,1.5,.25); }
  else if(theme==='flight'){ for(let i=0;i<4;i++){const yy=by+(i-1.5)*13;line(ctx,bx-dir.x*20,yy,bx+dir.x*55,yy+dir.y*12,3,accent,.55);} }
  else if(theme==='metal'){ for(let i=0;i<3;i++){ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.globalAlpha=.7-i*.15;ctx.strokeRect(bx-25-i*8,by-18-i*6,50+i*16,36+i*12);} }
  else if(theme==='hammer'){ const r=move==='heavy'?48:32;ctx.fillStyle=accent;ctx.globalAlpha=.8;ctx.fillRect(bx+dir.x*r-18,by+dir.y*r-18,36,36);line(ctx,bx,by,bx+dir.x*r,by+dir.y*r,9,col,.9); }
  else if(theme==='vine'||theme==='thorn'||theme==='growth'){ for(let i=0;i<4;i++){const a=-1.1+i*.7;const ex=bx+Math.cos(a)*65,ey=by+Math.sin(a)*45;ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+20*Math.cos(a+1),by+20*Math.sin(a+1),ex,ey);ctx.stroke();glowCircle(ctx,ex,ey,5,accent,.7);} }
  else if(theme==='circuit'){ for(let i=0;i<4;i++){const ex=bx+dir.x*(25+i*15)+(-dir.y)*(i%2?12:-12);const ey=by+dir.y*(25+i*15)+dir.x*(i%2?12:-12);line(ctx,bx,by,ex,ey,2,accent,.75);glowCircle(ctx,ex,ey,4,accent,.7);} }
  else if(theme==='snow'){ for(let i=0;i<8;i++){const a=i*Math.PI/4;const r=20+25*t;line(ctx,bx+Math.cos(a)*8,by+Math.sin(a)*8,bx+Math.cos(a)*r,by+Math.sin(a)*r,3,accent,.65);} }
  else if(theme==='dismantle'){ for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const r=18+40*t;line(ctx,bx+Math.cos(a)*10,by+Math.sin(a)*10,bx+Math.cos(a)*r,by+Math.sin(a)*r,4,accent,.7);} }
  else if(theme==='dream'){ for(let i=0;i<4;i++){const r=12+i*12;ring(ctx,bx+Math.sin(t*4+i)*10,by+Math.cos(t*3+i)*8,r,accent,3,.35);} }
  else if(theme==='potion'){ for(let i=0;i<5;i++){const xx=bx+dir.x*i*12,yy=by+Math.sin(i+t*4)*9;glowCircle(ctx,xx,yy,7,accent,.6);} ring(ctx,bx,by,25,accent,3,.5); }
  else if(theme==='erase'){ ring(ctx,bx,by,30+25*t,accent,5,.75); ctx.globalAlpha=.45;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(bx,by,20+20*t,0,Math.PI*2);ctx.fill(); }
  else if(theme==='balance'){ ring(ctx,bx,by,28,accent,3,.8);ring(ctx,bx,by,15,accent,2,.5);line(ctx,bx-45,by,bx-8,by,4,accent,.6);line(ctx,bx+8,by,bx+45,by,4,accent,.6); }
  ctx.restore();
}

export function drawGen5Attack(ctx,x,y,color,p,facing,attack,charId){
  const move=moveOf(attack); if(!shouldOverride(charId,move)) return false;
  const a=aimFor({facing,attackData:attack},facing);
  drawTheme(ctx,charId,move,x,y,p,facing,a);
  // impact accents are deliberately tied to the same hitbox phase.
  if(p>.42&&p<.72){const [,accent]=PROFILE[charId];const h=getGen5Hitboxes({x,y,facing,char:{id:charId},attackData:{...attack,progress:p}});for(const q of h){if(q.shape==='circle')glowCircle(ctx,q.x,q.y,Math.max(3,q.r*.28),accent,.5);else if(q.shape==='capsule')line(ctx,q.x1,q.y1,q.x2,q.y2,Math.max(2,q.r*.55),accent,.45);else line(ctx,q.x-q.w/2,q.y,q.x+q.w/2,q.y,3,accent,.4);}}
  return true;
}

export function drawGen5Super(ctx,x,y,color,p,facing,charId,attack){return drawGen5Attack(ctx,x,y,color,p,facing,{...(attack||{}),isSuper:true,sigType:'super'},charId);}

export function applyGen5Aim(data,inputs,facing){
  const x=(inputs?.right?1:0)-(inputs?.left?1:0); const y=(inputs?.down?1:0)-(inputs?.up?1:0);
  if(x===0&&y===0) return {...data,aimX:facing||1,aimY:0};
  const n=norm(x,y); return {...data,aimX:n.x,aimY:n.y};
}
