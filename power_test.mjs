import { createFighter, updateFighter } from './fighter.js';
import { ABILITIES } from './mvPower.js';
const noIn=()=>({left:false,right:false,up:false,down:false,jump:false,sig:false,heavy:false,superMove:false,dash:false,power:false,block:false,crouch:false});
const plat=[{x:190,y:520,w:900,h:40,material:'normal'},{x:470,y:380,w:340,h:16,material:'normal'}];
const atk=(n)=>({name:n,type:'x',duration:20,damage:8,range:60,color:'#fff'});
const mk=(id,x,face,extra={})=>{ const c={id,name:id,color:'#fff',power:'x',stats:{power:6,speed:6,defense:5,utility:5,control:5},superMove:{name:'S'},signatures:{up:atk('u'),down:atk('d'),side:atk('s')},upHeavy:atk('uh'),heavyAttack:atk('sh'),...extra}; const f=createFighter(c,x,519,face); f.grounded=true; f.superMeter=50; f.maxSuper=100; return f; };
function run(id,{second=[],hold=0,inputs=()=>({}),opDx=140,frames=420,jumpAt=[]}={}){
  const a=mk(id,400,1), b=mk('dummy_ice',400+opDx,-1); a._allOpponents=[b]; b._allOpponents=[a];
  let fx={spawned:0,moved:0,oppDmg:0,solids:0,ended:-1,minX:9e9,maxX:-9e9,minY:9e9,maxY:-9e9,err:null,pressed:false,hidden:0}; const x0=a.x;
  for(let f=0;f<frames;f++){ const inp=noIn(); Object.assign(inp,inputs(f));
    if(f===10||second.includes(f)) inp.power=true; if(hold&&f>=10&&f<10+hold) inp.power=true; if(jumpAt.includes(f)) inp.jump=true;
    try{ updateFighter(a,inp,plat,1280,720,b); updateFighter(b,noIn(),plat,1280,720,a); }catch(e){ fx.err=e.stack.split('\n').slice(0,3).join(' | '); break; }
    if(a._pw){ fx.pressed=true; fx.spawned=Math.max(fx.spawned,a._pw.ents.length); } if(a._pwSolids&&a._pwSolids.length) fx.solids=Math.max(fx.solids,a._pwSolids.length); if(a._pwHide) fx.hidden++;
    if(fx.pressed&&!a._pw&&fx.ended<0) fx.ended=f; fx.minX=Math.min(fx.minX,a.x); fx.maxX=Math.max(fx.maxX,a.x); fx.minY=Math.min(fx.minY,a.y); fx.maxY=Math.max(fx.maxY,a.y);
    if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||!Number.isFinite(b.x)||!Number.isFinite(b.y)){ fx.err='NaN position'; break; } }
  fx.moved=Math.round(Math.abs(a.x-x0)); fx.oppDmg=+b.damage.toFixed(1); fx.cd=a.powerCooldown; fx.leftEnts=a._pw?a._pw.ents.length:0; fx.leftSolids=(a._pwSolids||[]).length; fx.aliveAbility=!!a._pw;
  return fx; }
export { run, noIn, mk };
if(process.argv[1].endsWith('power_test.mjs')){
  let bad=0;
  for(const id of Object.keys(ABILITIES)){
    const variants=[['press only',{}],['2nd@25',{second:[25]}],['2nd@60',{second:[60]}],['2nd@100',{second:[100]}],['hold',{hold:50}],['air/jump',{jumpAt:[14,40],inputs:(f)=>f>10&&f<60?{up:true,right:true}:{}}],['foe close',{opDx:50,second:[40]}]];
    const out=[]; let probs=[];
    for(const [n,o] of variants){ const r=run(id,o); out.push(r);
      if(r.err) probs.push(n+': ERR '+r.err); if(r.aliveAbility) probs.push(n+': ability never ended'); if(r.leftSolids) probs.push(n+': leaked solids '+r.leftSolids);
      if(r.cd>=99999) probs.push(n+': cooldown not set'); if(r.minX<-200||r.maxX>1480||r.maxY>900) probs.push(n+': out of bounds '+Math.round(r.minX)+'..'+Math.round(r.maxX)+' y'+Math.round(r.maxY)); }
    const did=out.some(r=>r.spawned>0||r.moved>25||r.oppDmg>0||r.solids>0||r.hidden>0);
    if(!did) probs.push('NO VISIBLE EFFECT in any variant');
    if(probs.length){ bad++; console.log('✗',id.padEnd(13),ABILITIES[id].name.padEnd(24),probs.slice(0,4).join(' ; ')); } else console.log('✓',id.padEnd(13),ABILITIES[id].name.padEnd(24),'ents',Math.max(...out.map(r=>r.spawned)),'moved',Math.max(...out.map(r=>r.moved)),'foeDmg',Math.max(...out.map(r=>r.oppDmg)),'solids',Math.max(...out.map(r=>r.solids)));
  }
  console.log('problem abilities:',bad,'of',Object.keys(ABILITIES).length);
}
