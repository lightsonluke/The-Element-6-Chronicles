// Element 6 Strategic Bot Brain
// Persistent world-model, opponent tendencies, planning, objective awareness,
// adaptive roles and mode-specific strategic overlays. This layer deliberately
// sits above the existing mechanical CPUs instead of replacing their controls.

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const d=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
const profiles={
 newcomer:{sense:.35,predict:.08,plan:.10,adapt:.05,coord:.15,execution:.35,react:.30},
 beginner:{sense:.45,predict:.16,plan:.18,adapt:.10,coord:.25,execution:.45,react:.38},
 easy:{sense:.56,predict:.25,plan:.28,adapt:.18,coord:.35,execution:.56,react:.48},
 amateur:{sense:.66,predict:.35,plan:.38,adapt:.28,coord:.48,execution:.66,react:.56},
 regular:{sense:.76,predict:.46,plan:.50,adapt:.38,coord:.60,execution:.76,react:.66},
 pro:{sense:.84,predict:.58,plan:.62,adapt:.50,coord:.72,execution:.84,react:.74},
 hard:{sense:.91,predict:.70,plan:.74,adapt:.64,coord:.84,execution:.91,react:.82},
 insane:{sense:.97,predict:.84,plan:.88,adapt:.80,coord:.94,execution:.96,react:.90},
 honored:{sense:1,predict:.96,plan:.98,adapt:.94,coord:.99,execution:.985,react:.96}
};

export function strategicProfile(diff='regular'){return profiles[diff]||profiles.regular;}

function mind(bot,mode){
  if(!bot._e6StrategicMind) bot._e6StrategicMind={};
  if(!bot._e6StrategicMind[mode]) bot._e6StrategicMind[mode]={
    ticks:0,lastPlan:null,planAge:999,lastTarget:null,lastScore:null,lastRole:null,
    opponents:new Map(),actions:new Map(),success:0,fail:0,lastObjective:null,
    route:null,confidence:0
  };
  return bot._e6StrategicMind[mode];
}

function observeOpp(m,op){
  if(!op)return null;
  const id=op._userId||op.id||op.playerIndex||op.slot||`${op.x}|${op.y}`;
  let o=m.opponents.get(id);
  if(!o)o={samples:0,left:0,right:0,jump:0,attack:0,power:0,near:0,far:0,lastX:op.x||0};
  o.samples++;
  const dx=(op.x||0)-o.lastX;
  if(dx<-.4)o.left++; else if(dx>.4)o.right++;
  if((op.vy||0)<-1.5)o.jump++;
  if(op.state==='attacking'||op.state==='superAttack'||op.attackData)o.attack++;
  if(op.powerActive)o.power++;
  if(Math.abs(dx)<2)o.near++;
  else o.far++;
  o.lastX=op.x||0;
  m.opponents.set(id,o);
  return o;
}

function updateMemory(bot,world,mode,diff){
  const m=mind(bot,mode), p=strategicProfile(diff);
  m.ticks++;
  for(const op of (world.opponents||[]))observeOpp(m,op);
  const score=world.score;
  if(score){m.lastScore=m.lastScore||{for:score.for||0,against:score.against||0};}
  if(world.event){
    const key=world.event;
    m.actions.set(key,(m.actions.get(key)||0)+1);
  }
  return {m,p};
}

function predicted(entity,frames){return {x:(entity?.x||0)+(entity?.vx||0)*frames,y:(entity?.y||0)+(entity?.vy||0)*frames};}
function nearest(bot,list){let best=null,bd=Infinity;for(const x of list||[]){if(!x||x===bot||x._eliminated||x.stocks===0)continue;const z=d(bot,x);if(z<bd){bd=z;best=x;}}return best;}
function scoreTarget(bot,list,world,p){
  let best=null,bs=-1e9;
  for(const x of list||[]){if(!x||x===bot||x._eliminated||x.stocks===0)continue;let s=0;const z=d(bot,x);s+=clamp(1-z/700,-1,1)*1.2;s+=(x.damage||0)/100*1.5;if(world.carrier&&x===world.carrier)s+=4;if(world.objectiveTarget&&x===world.objectiveTarget)s+=3;if(world.threat&&x===world.threat)s+=2;if(x.grounded===false)s+=.25*p.predict;if(s>bs){bs=s;best=x;}}return best;
}

function safePosition(bot,world){
  const bounds=world.bounds||{};const min=bounds.left??80,max=bounds.right??880;
  if((bot.x||0)<min+35)return min+90;if((bot.x||0)>max-35)return max-90;
  return null;
}

export function strategicFight(bot,world={},diff='regular',baseInput={}){
  const {m,p}=updateMemory(bot,world,'fight',diff);
  const target=scoreTarget(bot,world.opponents||[],world,p)||world.target;
  if(!target)return baseInput;
  const pred=predicted(target,Math.round(8+36*p.predict));
  const out={...baseInput};
  const sx=safePosition(bot,world);
  if(sx!==null){out.left=bot.x>sx+8;out.right=bot.x<sx-8;out.jump=true;return out;}
  const dx=pred.x-bot.x,dy=pred.y-bot.y,dist=Math.abs(dx);
  // Strategic retreat when losing a stock/damage exchange, but don't retreat forever.
  const selfD=bot.damage||0,oppD=target.damage||0;
  const losing=(selfD>oppD+25)||(world.losing&&selfD>oppD-10);
  if(losing&&dist<250&&p.plan>.5&&!world.mustEngage){out.left=dx<0;out.right=dx>0; if(bot.grounded&&Math.abs(dy)>55)out.jump=true; return out;}
  // Approach predicted position rather than current position.
  if(dist>105){out.left=dx<0;out.right=dx>0;if(Math.abs(dy)>70&&bot.grounded)out.jump=dy<0;return out;}
  // Punish vulnerable targets; preserve base action if already attacking.
  if(target.hitstun>3||target._wasInHitstun>0||target._eliminated){
    out.left=dx<0;out.right=dx>0;
    if(bot.superMeter>=bot.maxSuper&&dist<250)out.superMove=true;
    else if(bot.heavyCooldown<=0&&dist<150)out.heavy=true;
    else if(bot.sigCooldown<=0&&dist<155)out.sig=true;
    return out;
  }
  // Don't blindly chase: hold a pressure distance and react to attacks.
  if(target.state==='attacking'||target.state==='superAttack'){
    const t=predicted(target,Math.round(6+16*p.predict));
    const incoming=Math.abs(t.x-bot.x)<120&&Math.abs(t.y-bot.y)<100;
    if(incoming){out.left=dx>0;out.right=dx<0;if(bot.grounded)out.jump=true;else out.down=true;return out;}
  }
  if(dist<90){out.left=false;out.right=false;}
  return out;
}

export function strategicTeam(bot,world={},diff='regular',baseInput={}){
  const {m,p}=updateMemory(bot,world,'team',diff);
  let target=world.target;
  const threat=world.threat||null;
  if(world.objective==='focus')target=world.objectiveTarget||target;
  else if(threat&&world.threatUrgency>.65)target=threat;
  else target=target||scoreTarget(bot,world.opponents||[],world,p);
  const out={...baseInput};
  if(world.role==='support'&&world.teammate){
    const spacing=world.supportDistance||150;const dx=bot.x-world.teammate.x;
    if(Math.abs(dx)<spacing*.75){out.left=false;out.right=false;}
    else if(Math.abs(dx)>spacing*1.15){out.left=dx<0;out.right=dx>0;}
  }
  if(target){const pred=predicted(target,Math.round(8+30*p.predict));const dx=pred.x-bot.x;if(Math.abs(dx)>110){out.left=dx<0;out.right=dx>0;}}
  return out;
}

export function strategicCTF(bot,world={},diff='regular',baseInput={}){
  const {m,p}=updateMemory(bot,world,'ctf',diff);
  const out={...baseInput};
  let target=world.objectiveTarget||null;
  const carrier=world.enemyCarrier;
  if(world.role==='interceptor'||world.role==='recovery')target=carrier||target;
  else if(world.role==='carrier'||world.role==='retreat')target=world.homeBase||target;
  else if(world.role==='escort')target=world.teammateCarrier||target;
  else if(world.role==='defender')target=world.defendPoint||target;
  else target=target||world.enemyBase;
  if(carrier&&world.carrierDanger>0.55)target=carrier;
  if(target){const pr=predicted(target,Math.round(12+40*p.predict));const dx=pr.x-bot.x;out.left=dx<-20;out.right=dx>20;if(Math.abs(pr.y-bot.y)>80&&bot.grounded)out.jump=pr.y<bot.y;}
  if(world.score&&world.time!=null){
    const lead=(world.score.for||0)-(world.score.against||0);
    if(lead>0&&world.time<20&&world.role!=='carrier'&&world.role!=='interceptor'){target=world.homeBase||target;}
    if(lead<0&&world.time<25&&world.role==='defender')target=world.enemyBase||target;
  }
  return out;
}

export function strategicBR(bot,world={},diff='regular',baseInput={}){
  const {m,p}=updateMemory(bot,world,'br',diff);const out={...baseInput};
  const alive=world.alive||[];const target=scoreTarget(bot,alive,world,p);
  const zone=world.zone;const outside=zone&&((bot.x||0)<zone.leftX||(bot.x||0)>zone.rightX);
  if(outside){const cx=(zone.leftX+zone.rightX)/2;out.left=bot.x>cx+30;out.right=bot.x<cx-30;out.jump=true;return out;}
  if(zone){const dl=bot.x-zone.leftX,dr=zone.rightX-bot.x;if(Math.min(dl,dr)<120){const cx=(zone.leftX+zone.rightX)/2;out.left=bot.x>cx+40;out.right=bot.x<cx-40;}}
  if(target){const z=d(bot,target);const thirdParty=world.targetEngaged&&world.targetEngaged!==target;if(thirdParty&&z>180){out.left=target.x<bot.x;out.right=target.x>bot.x;}else if(z>150){const pr=predicted(target,Math.round(10+30*p.predict));out.left=pr.x<bot.x;out.right=pr.x>bot.x;}}
  return out;
}

export function strategicSoccer(bot,world={},diff='regular',baseInput={}){
  const {m,p}=updateMemory(bot,world,'soccer',diff);const out={...baseInput};const ball=world.ball;if(!ball)return out;
  const ownGoal=world.ownGoal,enemyGoal=world.enemyGoal;const team=world.teammates||[];const opponents=world.opponents||[];
  const pred=predicted(ball,Math.round(8+42*p.predict));
  const threat=world.nearestOpponent;
  let tx=pred.x;
  if(world.possession==='own'&&enemyGoal)tx=enemyGoal.x;
  if(world.possession==='enemy'&&ownGoal)tx=ownGoal.x;
  if(world.role==='defender'&&ownGoal)tx=(ownGoal.x+pred.x)/2;
  if(world.role==='support'&&team[0])tx=team[0].x+(enemyGoal?.x>team[0].x?90:-90);
  if(threat&&world.possession==='enemy'&&d(bot,threat)<120)tx=threat.x;
  out.left=tx<bot.x-18;out.right=tx>bot.x+18;
  if(Math.abs(pred.y-bot.y)>80&&bot.grounded)out.jump=pred.y<bot.y;
  return out;
}

export function strategicDodgeball(bot,world={},diff='regular',baseInput={}){
  const {p}=updateMemory(bot,world,'dodgeball',diff);const out={...baseInput};
  const incoming=(world.balls||[]).filter(b=>b&&b.heldBy==null&&b.lastThrower&&b.lastThrower!==world.side).sort((a,b)=>d(a,bot)-d(b,bot))[0];
  if(incoming){const pr=predicted(incoming,Math.round(8+28*p.predict));if(Math.abs(pr.x-bot.x)<70&&Math.abs(pr.y-(bot.y-35))<80){const dir=bot.x<pr.x?-1:1;out.left=dir<0;out.right=dir>0;out.up=bot.onGround;out.down=!bot.onGround;return out;}}
  if(world.bestTarget&&world.holdingBall){const pr=predicted(world.bestTarget,Math.round(6+20*p.predict));out.left=pr.x<bot.x-30;out.right=pr.x>bot.x+30;}
  return out;
}

export function strategicVolleyball(s,diff='regular'){
  const p=strategicProfile(diff);const b=s?.ball;if(!b)return;
  const team=s.t2||[];const lo=typeof s.NET_X==='number'?s.NET_X+16:550;const hi=s.COURT_RIGHT||1060;
  if(!team.length)return;
  const landing=b.vy>0?(b.x+b.vx*Math.max(0,(540-b.y)/Math.max(.1,b.vy))):b.x;
  const active=team.reduce((best,x,i)=>Math.abs(x.x-landing)<Math.abs(team[best].x-landing)?i:best,0);
  const support=1-active;
  for(let i=0;i<team.length;i++){
    const pl=team[i]; if(pl.diving)continue;
    const target=i===active?Math.max(lo,Math.min(hi,landing)):Math.max(lo,Math.min(hi,landing+(landing>820?-120:120)));
    const maxStep=0.45+(p.execution*0.9);
    if(pl.x<target-8)pl.vx=Math.min((pl.vx||0)+maxStep,2.5+2.5*p.execution);
    else if(pl.x>target+8)pl.vx=Math.max((pl.vx||0)-maxStep,-2.5-2.5*p.execution);
    else pl.vx*=.7;
    pl.x+=pl.vx||0;pl.x=Math.max(lo,Math.min(hi,pl.x));
    if(i===active&&b.vy>0&&Math.abs(b.x-pl.x)<45&&b.y<500&&p.predict>.45&&pl.onGround){pl.vy=-15;pl.onGround=false;pl.jump=30;}
  }
}

export function strategicBaseball(s,diff='regular'){
  const p=strategicProfile(diff);if(!s)return;
  if(s.fieldBall?.alive&&!s.fieldBall.heldBy&&s.fielders?.length){let tx=s.fieldBall.x,ty=s.fieldBall.y;if(s.fieldBall.z>0&&s.fieldBall.vz<0){const t=s.fieldBall.z/Math.max(.12,Math.abs(s.fieldBall.vz));tx+=s.fieldBall.vx*t*p.predict;ty+=s.fieldBall.vy*t*p.predict;}let best=0,bd=Infinity;for(let i=0;i<s.fielders.length;i++){const z=Math.hypot(s.fielders[i].x-tx,s.fielders[i].y-ty);if(z<bd){bd=z;best=i;}}s.controlledFielder=best;const f=s.fielders[best];const dx=tx-f.x,dy=ty-f.y;const len=Math.hypot(dx,dy)||1;const sp=1.8+.6*p.execution;f.x+=(dx/len)*sp;f.y+=(dy/len)*sp;}
  if(s.runners?.length&&s.bases){const aggressive=p.plan>.7||s.outs>=2;for(const r of s.runners){if(r.reached)continue;if(r.atBase&&aggressive){r.runBoost=Math.max(r.runBoost||0,1.5);}}}
}

export function strategicBanger(s,diff='regular',helpers={}){
  if(!s)return null;const p=strategicProfile(diff);if(s.phase==='aim'&&s.aimSide){const a=typeof helpers.curAngle==='function'?helpers.curAngle(s):0;const target=Math.PI/3;const tolerance=.03+.12*(1-p.execution);if(Math.abs(a-target)<tolerance||p.execution>.96&&Math.abs(a-target)<.09)return 'strike';}
  if(s.phase==='flight'&&s.ball?.bangerWindow>0&&s.ball?.bangerBy){if(p.execution>.55)return 'banger';}
  return null;
}

export function strategicPlanSnapshot(bot,mode,world={},diff='regular'){
  const {m,p}=updateMemory(bot,world,mode,diff);return {mode,difficulty:diff,role:world.role||null,target:world.target||world.objectiveTarget||null,objective:world.objective||null,planAge:m.planAge,confidence:clamp(.25+p.plan*.75),opponentModels:m.opponents.size};
}
