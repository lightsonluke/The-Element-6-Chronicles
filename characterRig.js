// Shared Element 6 character rig. One anatomy drives fighters, sports and cosmetics.
import { getEmotePoseVars } from './emotePose.js';

const turn = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
const between = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function getCharacterRig(frame = 0, state = 'idle', facing = 1, scale = 1, powerActive = null, emote = null) {
  if (powerActive === 'range_boost') scale *= 1.35;
  const s = 42 * scale;
  let bob = 0, lean = 0, armL = 0, armR = 0, legL = 0, legR = 0;
  const t = frame * .18;
  if (emote) {
    const p = getEmotePoseVars(emote.id, emote.progress, facing);
    if (p) { bob=p.bob||0; lean=p.lean||0; armL=(p.armSwingL||0)+(p.punchArmL||0); armR=(p.armSwingR||0)+(p.punchArmR||0); legL=p.legLOver ?? -(p.legSwing||0); legR=p.legROver ?? (p.legSwing||0); }
  } else if (state === 'moving' || state === 'running') { const g=Math.sin(t); bob=-Math.abs(g)*2.8; lean=facing*.1; legL=-g*.56; legR=g*.56; armL=g*.52; armR=-g*.52; }
  else if (state === 'jumping') { bob=-6; lean=facing*.04; legL=-.68; legR=.52; armL=-.95; armR=.76; }
  else if (state === 'hitstun' || state === 'stunned') { bob=3; lean=-facing*.28; legL=-.34; legR=.34; armL=.78; armR=-.58; }
  else if (state === 'crouching') { bob=12; legL=-.48; legR=.48; armL=.45; armR=-.45; }
  else if (state === 'attacking' || state === 'superAttack') { lean=facing*(state==='superAttack'?.20:.16); armL=facing>0?-1.15:.42; armR=facing>0?.36:1.15; legL=-.25; legR=.26; }
  else if (state === 'kick' || state === 'soccerKick') { lean=facing*.16; legL=facing>0?-.18:.82; legR=facing>0?.82:-.18; armL=.54; armR=-.54; }
  else if (state === 'set' || state === 'volleySet') { bob=-2; armL=-2.05; armR=2.05; legL=-.24; legR=.24; }
  else if (state === 'bump' || state === 'volleyBump') { bob=5; lean=facing*.1; armL=facing>0?-1:.7; armR=facing>0?-.7:1; legL=-.32; legR=.32; }
  else if (state === 'spike' || state === 'volleySpike') { bob=-6; lean=facing*.26; armL=facing>0?-2.15:.45; armR=facing>0?.3:2.15; legL=-.58; legR=.58; }
  else if (state === 'throw' || state === 'dodgeThrow') { lean=facing*.2; armL=facing>0?-1.8:.3; armR=facing>0?.18:1.8; legL=-.26; legR=.26; }
  const headR=s*.31, rawHead={x:0,y:-s*2.06+bob}, rawTop={x:0,y:rawHead.y+headR*1.72}, rawBottom={x:0,y:rawTop.y+s*.74};
  const head=turn(rawHead.x,rawHead.y,lean), torsoTop=turn(rawTop.x,rawTop.y,lean), torsoBottom=turn(rawBottom.x,rawBottom.y,lean);
  const shoulders={left:turn(-s*.25,rawTop.y+s*.14,lean),right:turn(s*.25,rawTop.y+s*.14,lean)};
  const hips={left:turn(-s*.16,rawBottom.y,lean),right:turn(s*.16,rawBottom.y,lean)};
  const endpoint=(origin,len,angle)=>{const p=turn(0,len,angle+lean);return{x:origin.x+p.x,y:origin.y+p.y};};
  const hands={left:endpoint(shoulders.left,s*.78,-.30+armL),right:endpoint(shoulders.right,s*.78,.30+armR)};
  const feet={left:endpoint(hips.left,s*.98,legL),right:endpoint(hips.right,s*.98,legR)};
  return {s,lean,headR,head,torsoTop,torsoBottom,shoulders,hips,hands,feet,elbows:{left:between(shoulders.left,hands.left,.5),right:between(shoulders.right,hands.right,.5)},knees:{left:between(hips.left,feet.left,.52),right:between(hips.right,feet.right,.52)},armAngleL:-.30+armL+lean,armAngleR:.30+armR+lean,legAngleL:legL+lean,legAngleR:legR+lean};
}

function tube(ctx,a,b,r,color){ctx.strokeStyle=color;ctx.lineWidth=r*2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(b.x,b.y,r*.98,0,Math.PI*2);ctx.fill();}

export function drawElement6Rig(ctx,frame,color,facing,state,charData,powerActive,emote,scale=1){
  const rig=getCharacterRig(frame,state,facing,scale,powerActive,emote), ap=charData?.appearance||{}, body=ap.torso||color, headColor=ap.head||body;
  ctx.save();ctx.shadowColor=body;ctx.shadowBlur=10;
  tube(ctx,rig.hips.left,rig.knees.left,rig.s*.105,ap.legL||body);tube(ctx,rig.knees.left,rig.feet.left,rig.s*.105,ap.legL||body);tube(ctx,rig.hips.right,rig.knees.right,rig.s*.105,ap.legR||body);tube(ctx,rig.knees.right,rig.feet.right,rig.s*.105,ap.legR||body);
  const w=rig.s*.39;ctx.fillStyle=body;ctx.beginPath();ctx.roundRect(-w,rig.torsoTop.y,w*2,rig.torsoBottom.y-rig.torsoTop.y,rig.s*.17);ctx.fill();
  tube(ctx,rig.shoulders.left,rig.elbows.left,rig.s*.095,ap.armL||body);tube(ctx,rig.elbows.left,rig.hands.left,rig.s*.095,ap.armL||body);tube(ctx,rig.shoulders.right,rig.elbows.right,rig.s*.095,ap.armR||body);tube(ctx,rig.elbows.right,rig.hands.right,rig.s*.095,ap.armR||body);
  ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.roundRect(-w*.65,rig.torsoTop.y+rig.s*.07,w*1.3,rig.s*.12,rig.s*.06);ctx.fill();
  ctx.fillStyle=headColor;ctx.beginPath();ctx.arc(rig.head.x,rig.head.y,rig.headR,0,Math.PI*2);ctx.fill();
  const ex=rig.head.x+facing*rig.headR*.18;ctx.shadowBlur=0;ctx.fillStyle=charData?.whiteEyes?'#FFFFFF':'#151326';ctx.beginPath();ctx.arc(ex-rig.headR*.20,rig.head.y-rig.headR*.04,rig.headR*.12,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+rig.headR*.20,rig.head.y-rig.headR*.04,rig.headR*.12,0,Math.PI*2);ctx.fill();
  if(!charData?.whiteEyes){ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(ex-rig.headR*.16,rig.head.y-rig.headR*.08,rig.headR*.035,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+rig.headR*.24,rig.head.y-rig.headR*.08,rig.headR*.035,0,Math.PI*2);ctx.fill();}ctx.restore();return rig;
}
