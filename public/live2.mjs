import { createFighter, updateFighter, checkHit, applyHit } from './fighter.js';
const noIn=()=>({left:false,right:false,up:false,down:false,jump:false,sig:false,heavy:false,superMove:false,dash:false,power:false,block:false,crouch:false});
const plat=[{x:100,y:520,w:1000,h:40,material:'normal'}];
const atk=(n)=>({name:n,type:'x',duration:20,damage:8,range:60,color:'#fff'});
function mk(base,x,y,face,tag='tst'){ const c={id:tag+'_'+base,baseCharId:base,name:base,color:'#fff',power:'x',stats:{power:6,speed:6,defense:5,utility:5,control:5},superMove:{name:'S',duration:60,damage:30},signatures:{up:atk('u'),down:atk('d'),side:atk('s')},upHeavy:atk('uh'),downHeavy:atk('dh'),heavyAttack:atk('sh'),isSpirit:false};
  const f=createFighter(c,x,y,face); f.grounded=true; return f; }
const inFor=(slot)=>{const i=noIn(); if(slot==='us'){i.sig=true;i.up=true;} if(slot==='ds'){i.sig=true;i.down=true;} if(slot==='ss'){i.sig=true;i.right=true;} if(slot==='sh'){i.heavy=true;i.right=true;} if(slot==='uh'){i.heavy=true;i.up=true;} if(slot==='dh'){i.heavy=true;i.down=true;} if(slot==='sp'){i.superMove=true;} if(slot==='rc'){i.sig=true;i.up=true;} if(slot==='gp'){i.heavy=true;i.down=true;} return i; };
export function fight(id,slot,opts={}){
  const a=mk(id,400,520,1), b=mk('g1_ice',opts.dx?400+opts.dx:470,520,-1,'dum'); b.damage=opts.dmg||0; b.facing=-1;
  a.superMeter=a.maxSuper=100; const inp=inFor(slot);
  if(slot==='rc'||slot==='gp'){ a.y=300;a.grounded=false; a.vy=0; }
  let hits=[],startF=-1,activeFrames=0,first=-1,last=-1,x0=a.x,y0=a.y,xs=[a.x];
  for(let f=0;f<400;f++){ if(f===0){a.y=slot==='rc'||slot==='gp'?300:519;b.y=519;}
    updateFighter(a,f===12?inp:noIn(),plat,1280,720,b); updateFighter(b,noIn(),plat,1280,720,a);
    if(a.attackData&&a.attackData._mv&&startF<0) startF=f;
    if(a.attackData&&a.attackData._mv){ const S=a.attackData._mv; const [s,aa]=S.m.fr; xs.push(a.x); if(S.f>=s&&S.f<s+aa){activeFrames++; if(first<0)first=f;}
      if(checkHit(a,b)){ const before=b.damage; applyHit(a,b); hits.push({f,stage:S.curStage,dmg:+(b.damage-before).toFixed(1),vx:+b.vx.toFixed(1),vy:+b.vy.toFixed(1),hs:b.hitstun}); b.vx=0;b.vy=0; b.hitstun=0; b.state='idle'; } }
    else if(startF>=0&&!a.attackData){ if(last<0)last=f; if(f>last+3)break; } }
  return {hits,startF,first,last,activeFrames,travel:+(Math.max(...xs)-Math.min(...xs)).toFixed(0),endX:+a.x.toFixed(0),endY:+a.y.toFixed(0)};
}
const ids=['g1_thunder','g1_fire','g1_water','g1_grass','g1_ice'];
if (process.argv[1].endsWith('live2.mjs')) for(const id of ids) for(const sl of ['us','ds','ss','uh','dh','sh','sp','rc','gp']){
  let best=null; for(const dx of [38,52,66,80,96,120]){ const r=fight(id,sl,{dx}); if(!best||r.hits.length>best.r.hits.length) best={dx,r}; }
  const r=best.r; console.log(id.padEnd(9),sl,'dx',String(best.dx).padEnd(3),'f',r.startF,r.first,r.last,'act',r.activeFrames,'travel',r.travel,'end',r.endX+','+r.endY,'hits',JSON.stringify(r.hits.map(h=>`s${h.stage}:${h.dmg}dmg hs${h.hs} v(${h.vx},${h.vy})`)));
}
