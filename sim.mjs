import { createFighter, updateFighter, checkHit, applyHit } from './fighter.js';
const noIn=()=>({left:false,right:false,up:false,down:false,jump:false,sig:false,heavy:false,superMove:false,dash:false,power:false,block:false,crouch:false});
const plat=[{x:100,y:520,w:1000,h:40,material:'normal'}];
function mk(id,x,y,face){ const c={id,name:id,color:'#fff',power:'x',stats:{power:6,speed:6,defense:5,utility:5,control:5},superMove:{name:'S'},isSpirit:false}; const f=createFighter(c,x,y,face); f.grounded=true; return f; }
function step(a,b,inp){ updateFighter(a,inp,plat,1280,720,b); updateFighter(b,noIn(),plat,1280,720,a); }
function fight(id,slot,opts={}){
  const a=mk(id,400,520,1), b=mk('red',opts.dx?400+opts.dx:470,520,-1); b.damage=opts.dmg||0; b.facing=-1;
  a.superMeter=a.maxSuper=100; const inp=noIn();
  if(slot==='us'){inp.sig=true;inp.up=true;} if(slot==='ds'){inp.sig=true;inp.down=true;} if(slot==='ss'){inp.sig=true;}
  if(slot==='sh'){inp.heavy=true;} if(slot==='uh'){inp.heavy=true;inp.up=true;} if(slot==='dh'){inp.heavy=true;inp.down=true;} if(slot==='sp'){inp.superMove=true;}
  if(slot==='rc'){ a.y=300;a.grounded=false; a.vy=0; inp.sig=true; inp.up=true; }
  if(slot==='gp'){ a.y=300;a.grounded=false; a.vy=0; inp.heavy=true; inp.down=true; }
  let hits=[], startF=-1, activeFrames=0, maxF=400, first=-1, last=-1, dmgTot=0;
  for(let f=0; f<maxF; f++){ if(f===0){ a.y=519; b.y=519; }
    step(a,b, f===12?inp:noIn());
    if(a.attackData&&a.attackData._mv&&startF<0) startF=f;
    if(a.attackData&&a.attackData._mv){ const S=a.attackData._mv; const [s,aa]=S.m.fr; if(S.f>=s&&S.f<s+aa){activeFrames++; if(first<0)first=f;} 
      if(checkHit(a,b)){ const before=b.damage; applyHit(a,b); hits.push({f,stage:S.curStage,dmg:+(b.damage-before).toFixed(1),vx:+b.vx.toFixed(1),vy:+b.vy.toFixed(1),hs:b.hitstun}); } }
    else if(startF>=0 && !a.attackData){ if(last<0) last=f; if(f>last+3) break; }
  }
  return {hits, startF, first, last, activeFrames, aState:a.state, bDamage:+b.damage.toFixed(1)};
}
export {fight, mk};
if (process.argv[1].endsWith('sim.mjs')) {
  for(const [id,slot] of [['g1_thunder','sh'],['g2_kaito','us'],['g3_takeshi','sp'],['yellow','sh'],['red','sp'],['g4_gold','dh'],['blue','rc'],['black','gp']]){
    const r=fight(id,slot); console.log(id,slot,JSON.stringify({start:r.startF,firstActive:r.first,end:r.last,activeFrames:r.activeFrames,hitCount:r.hits.length,hits:r.hits.slice(0,6)}));
  }
}
