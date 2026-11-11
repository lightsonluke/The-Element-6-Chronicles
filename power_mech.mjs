import { createFighter, updateFighter } from './fighter.js';
const noIn=()=>({left:false,right:false,up:false,down:false,jump:false,sig:false,heavy:false,superMove:false,dash:false,power:false,block:false,crouch:false});
const STAGE=[{x:190,y:520,w:900,h:40,material:'normal'},{x:470,y:380,w:340,h:16,material:'normal'}];
const WALLS=[...STAGE,{x:560,y:280,w:50,h:240,material:'normal'}];
const atk=(n)=>({name:n,type:'x',duration:20,damage:8,range:60,color:'#fff'});
const mk=(id,x,face,y=519)=>{ const c={id,name:id,color:'#fff',power:'x',stats:{power:6,speed:6,defense:5,utility:5,control:5},superMove:{name:'S'},signatures:{up:atk('u'),down:atk('d'),side:atk('s')},upHeavy:atk('uh'),heavyAttack:atk('sh')}; const f=createFighter(c,x,y,face); f.grounded=true; return f; };
function sim(id,{plat=STAGE,ax=400,bx=700,frames=300,script=()=>({}),probe=()=>{},ay=519,by=519}={}){
  const a=mk(id,ax,1,ay), b=mk('dummy_ice',bx,-1,by); a._allOpponents=[b]; b._allOpponents=[a]; const log=[];
  for(let f=0;f<frames;f++){ const inp=Object.assign(noIn(),script(f,a,b)); updateFighter(a,inp,plat,1280,720,b); updateFighter(b,noIn(),plat,1280,720,a); const r=probe(f,a,b); if(r!==undefined) log.push(r); }
  return {a,b,log}; }
const res=[]; const T=(name,ok,info='')=>{ res.push(ok); console.log(ok?'PASS':'FAIL',name,info); };
const P=(frames)=>(f)=>({power:frames.includes(f)});
const pw=(a)=>a._pw;

// ── marker / teleport family ──
{ const {a,log}=sim('g1_thunder',{script:(f)=>({power:f===10||f===30}),probe:(f,a)=>[f,Math.round(a.x),!!(a._pw&&a._pw.ents.find(e=>e.tag==='mk'))]}); const mk0=log.find(l=>l[0]===20); T('Thunder: mark placed ahead',mk0&&mk0[2]); T('Thunder: dash along mark (~130px)',Math.abs(a.x-530)<30,'x='+Math.round(a.x)); }
{ const {a}=sim('g2_mai',{script:P([10,60]),probe:()=>0}); T('Mai: swap returns to start spot',Math.abs(a.x-400)<8,'x='+Math.round(a.x)); const r=sim('g2_mai',{script:P([10]),frames:50,probe:(f,a)=>Math.round(a.x)}); T('Mai: dashes ~90px first',Math.abs(r.a.x-490)<25,'x='+Math.round(r.a.x)); }
{ const {a}=sim('g2_mai',{script:P([10,60]),frames:200,probe:(f,a,b)=>0,by:519,bx:520,plat:STAGE}); const r=sim('g2_mai',{script:(f,a,b)=>({power:f===10}),frames:40,probe:(f,a)=>0}); }
{ const {a,b}=sim('g3_ryo',{script:P([10,50]),frames:120}); T('Ryo: returns to copy (start)',Math.abs(a.x-400)<8,'x='+Math.round(a.x)); }
{ const {a}=sim('copper',{script:(f)=>({power:f===10||f===40,right:f>12&&f<38}),frames:120}); T('Copper: returns to recorded spot within 1.2s',Math.abs(a.x-400)<8,'x='+Math.round(a.x)); const r=sim('copper',{script:(f)=>({power:f===10||f===120,right:f>12&&f<100}),frames:160}); T('Copper: window expires (no return after 1.2s)',r.a.x>440,'x='+Math.round(r.a.x)); }
{ const {a}=sim('g3_kanenobu',{script:(f)=>({power:f===10||f===40,right:f>12&&f<30}),frames:100}); T('Kanenobu: back to standard when within radius',Math.abs(a.x-400)<8,'x='+Math.round(a.x)); const r=sim('g3_kanenobu',{script:(f)=>({power:f===10||f===90,right:f>12&&f<80}),frames:140}); T('Kanenobu: no return when outside radius',r.a.x>480,'x='+Math.round(r.a.x)); }
{ const {a}=sim('g4_onyx',{script:P([10,40]),frames:140,plat:STAGE}); T('Onyx: shadow route travels to marker',Math.abs(a.x-400)>60,'x='+Math.round(a.x)); }
{ const {a}=sim('g2_twinfoxes',{script:P([10,24]),frames:100}); T('Twin Foxes: swap to orb location',a.x>480,'x='+Math.round(a.x)); }
{ const {a}=sim('g2_ibuki',{script:P([10,30]),frames:100}); T('Ibuki: swaps to far orb',a.x>520,'x='+Math.round(a.x)); }
{ const {a}=sim('g2_yui',{script:P([10,30]),frames:100}); T('Yui: dashes to beacon',a.x>440,'x='+Math.round(a.x)); }
// ── grapples ──
for (const [id,second] of [['g2_renji',[]],['g2_suzu',[34]],['g3_emi',[]],['g3_ogata',[34]],['g2_nishikawa',[40]],['magenta',[]]]) {
  const {a,log}=sim(id,{plat:WALLS,script:(f)=>({power:f===10||second.includes(f),up:f<14}),frames:140,bx:1000,probe:(f,a)=>[Math.round(a.x),Math.round(a.y),a._pw?a._pw.d.ph:null]});
  const attached=log.some(l=>['att','pull','swing','ret'].includes(l[2])); T(id+': thread attaches to wall',attached,'phases '+[...new Set(log.map(l=>l[2]))].join('>')); }
{ const {log}=sim('g2_nishikawa',{plat:WALLS,script:(f)=>({power:f===10,up:f<14}),frames:120,bx:1000,probe:(f,a)=>{ const d=a._pw&&a._pw.d; return d&&d.ph==='swing'?Math.hypot(a.x-d.ax,a.y-45-d.ay)-d.L:null; }}); const worst=Math.max(...log.filter(x=>x!==null)); T('Nishikawa: swing rope never stretches',worst<6,'max stretch '+worst.toFixed(1)); }
{ const {log}=sim('g2_renji',{plat:WALLS,script:(f)=>({power:f===10||f===50,up:f<14}),frames:140,bx:1000,probe:(f,a)=>a._pw?a._pw.d.ph:null}); T('Renji: pull then anchor returns',log.includes('pull')&&log.includes('ret')); }
{ const {b}=sim('g2_renji',{plat:WALLS,script:(f)=>({power:f===10}),frames:140,bx:430,by:519}); }
// ── terrain ──
{ const {log}=sim('g1_water',{script:P([10]),frames:110,probe:(f,a)=>[Math.round(a.x),Math.round(a.y)]}); const l1=log[40],l2=log[80]; T('Water Hero: surfs forward on the platform',l2[0]-l1[0]>120&&Math.abs(l2[1]-519)<20,'x '+l1[0]+'→'+l2[0]); }
{ const {a}=sim('g1_grass',{script:P([10]),frames:70,probe:(f,a)=>a.vy}); }
{ const r=sim('g1_grass',{script:P([10]),frames:90,probe:(f,a)=>a.vy}); T('Grass Hero: seed grows then launches',Math.min(...r.log)<-9,'min vy '+Math.min(...r.log).toFixed(1)); }
{ const {log}=sim('green',{script:P([10]),frames:60,probe:(f,a)=>{ const s=(a._pwSolids||[])[0]; return s?Math.round(s.h):0; }}); T('Green: slab rises over ~0.5s to ~70px',Math.max(...log)>=68&&log[14]<68,'h@14='+log[14]+' max '+Math.max(...log)); }
// ── buffs ──
{ const {log}=sim('yellow',{script:P([10]),frames:260,probe:(f,a)=>a._pwBuff?1:0}); const on=log.filter(x=>x).length; T('Yellow: buff lasts exactly 180 frames',on===180,'on '+on); const r=sim('yellow',{script:P([10,60,120,200]),frames:260,probe:(f,a)=>a._pwBuff?1:0}); T('Yellow: re-press cannot refresh',r.log.filter(x=>x).length===180);
  const q=sim('yellow',{script:P([10]),frames:260}); T('Yellow: stats restored',q.a.speedBoost===undefined||q.a.speedBoost===1||q.a.speedBoost===q.a._pwB?.s||Math.abs((q.a.speedBoost||1)-1)<1e-9,'speedBoost='+q.a.speedBoost); }
{ const {log}=sim('whami',{script:P([10]),frames:260,probe:(f,a)=>a._pwBuff?1:0}); T('Whami: exactly 180 frames',log.filter(x=>x).length===180); const r=sim('whami',{script:P([10,60]),frames:200,probe:(f,a)=>a._pwBuff?1:0}); T('Whami: second press ends buff early',r.log.filter(x=>x).length<90); }
{ const {log}=sim('turquoise',{script:P([10]),frames:200,probe:(f,a)=>a.speedBoost}); T('Turquoise: form lasts 2.5s then speed restored',log[60]>1.2&&Math.abs((log[190]||1)-1)<1e-6); }
// ── foes ──
{ const r=sim('volt',{script:P([10]),frames:100,bx:480,probe:(f,a,b)=>b.damage}); T('Volt: foe damaged once per activation',new Set(r.log.filter(d=>d>0)).size<=2 && r.b.damage<9,'dmg '+r.b.damage.toFixed(1)); }
{ const r=sim('g1_thunder',{script:(f)=>({power:f===10}),frames:120,bx:530,probe:(f,a,b)=>b.damage}); T('Thunder: foe touching the mark takes a small hit',r.b.damage>2&&r.b.damage<10,'dmg '+r.b.damage.toFixed(1)); }
{ const r=sim('red',{script:P([10]),frames:80,bx:440,probe:(f,a)=>a.vy}); T('Red: hit lifts Red upward',Math.min(...r.log)<-6&&r.b.damage>5,'min vy '+Math.min(...r.log).toFixed(1)+' foe '+r.b.damage.toFixed(1)); const m=sim('red',{script:P([10]),frames:80,bx:900,probe:(f,a)=>a.vy}); T('Red: miss gives no lift',Math.min(...m.log)>-3); }
{ const r=sim('pink',{script:P([10,40]),frames:140,bx:560}); T('Pink: thrown debris hurts a foe ahead',r.b.damage>2,'dmg '+r.b.damage.toFixed(1)); const j=sim('pink',{script:(f)=>({power:f===10,jump:f===30}),frames:140,ay:300,bx:420,by:519,probe:(f,a)=>a._pw&&a._pw.d.thrown?1:0}); T('Pink: jump while airborne launches debris downward',j.log.some(x=>x)); }
{ const r=sim('maroon',{script:(f)=>({power:f>=10&&f<50}),frames:140,bx:560}); T('Maroon: hold to charge, release fires forward',r.b.damage>3,'dmg '+r.b.damage.toFixed(1)); const d=sim('maroon',{script:(f)=>({power:(f>=10&&f<40)||f===30?true:false}),frames:80,probe:(f,a)=>a.vy}); }
{ const r=sim('indigo',{script:(f)=>({power:f===10,jump:f===30}),frames:100,probe:(f,a)=>Math.hypot(a.vx,a.vy)}); T('Indigo: jump slings her (speed burst)',Math.max(...r.log)>7); }
{ const r=sim('g4_cobalt',{script:P([10]),frames:140,bx:490,probe:(f,a,b)=>Math.round(b.x)}); T('Cobalt: barrier shoves a foe forward',r.log[139]>490,'foe x '+r.log[139]); }
{ const r=sim('g4_gold',{script:P([10]),frames:130,probe:(f,a)=>a.shieldAmount||0}); }
{ const r=sim('g2_hana',{script:P([10,40]),frames:140,bx:520,probe:(f,a,b)=>b.damage}); T('Hana: second press bursts the mirror as a wave',r.b.damage>3,'dmg '+r.b.damage.toFixed(1)); }
{ const r=sim('evil',{script:P([10,50]),frames:140,bx:560,probe:(f,a,b)=>b.damage}); T('Evil: collapse after warning damages a foe near the sphere',r.b.damage>8,'dmg '+r.b.damage.toFixed(1)); }
{ const r=sim('death',{script:P([10,50]),frames:140,bx:560}); T('Death: collapse pushes away',r.b.damage>5,'dmg '+r.b.damage.toFixed(1)); }
{ const r=sim('g3_masaru',{script:P([10]),frames:100,bx:480,probe:(f,a)=>a._pwHide}); T('Masaru: hidden while sliding, reforms',r.log.some(x=>x)&&!r.a._pwHide); }
{ const r=sim('g1_fire',{script:(f)=>({power:f===10,down:f===10}),frames:60,ay:300,probe:(f,a)=>a.y}); T('Fire Hero: held down kicks downward-forward',r.log[26]>r.log[12]-4,'y '+Math.round(r.log[12])+'→'+Math.round(r.log[26])); const u=sim('g1_fire',{script:(f)=>({power:f===10,up:f===10}),frames:60,ay:300,probe:(f,a)=>a.y}); T('Fire Hero: held up kicks upward-forward',u.log[26]<u.log[12]); }
{ const r=sim('g4_cyan',{script:P([10,40]),frames:140,probe:(f,a)=>[a.x,a.y]}); T('Cyan: rides the rail then bursts out',Math.abs(r.a.x-400)>150||r.a.y<480); }

{ const {log}=sim('orange',{script:P([10,60]),frames:90,probe:(f,a)=>[Math.round(a.x),Math.round(a.y)]}); const L=log[72]; T('Orange: teleports to the portal (up and forward)',L[1]<490&&L[0]>440,'pos@72='+L.join(',')); }
{ const {log}=sim('purple',{script:P([10]),frames:90,probe:(f,a)=>[a._pwHide,Math.round(a.y),Math.round(a.x)]}); const hid=log.filter(l=>l[0]).length; const top=Math.min(...log.map(l=>l[1])); T('Purple: hidden ~36 frames',hid>=30&&hid<=40,'hidden '+hid); T('Purple: reappears 4-5 heights higher (200-330px)',519-top>=200&&519-top<=330,'rise='+Math.round(519-top)); T('Purple: same x',log.every(l=>Math.abs(l[2]-400)<2)); }
{ const {a}=sim('black',{plat:WALLS,script:P([10,40]),frames:120}); T('Black: dash to the stuck rod',a.x>480,'x='+Math.round(a.x)); const r=sim('black',{plat:WALLS,script:P([10]),frames:120,bx:525}); T('Black: lightning strike hurts a foe at the rod',r.b.damage>0,'foe dmg='+r.b.damage.toFixed(1)); const d=sim('black',{plat:WALLS,script:P([10,40,44]),frames:120}); T('Black: cannot dash to the same rod twice',d.a.x<570,'x='+Math.round(d.a.x)); }
{ const {log}=sim('olive',{ax:440,plat:WALLS,script:(f)=>({power:f===10,up:f<14}),frames:140,bx:1000,probe:(f,a)=>a._pw?a._pw.d.ph:null}); T('Olive: grabs the platform edge and pulls in',log.includes('pull'),[...new Set(log)].join('>')); }
{ const {log}=sim('g2_daigo',{ax:1000,script:P([10]),frames:150,probe:(f,a)=>(a._pwSolids||[]).length}); T('Daigo: crack reaches the platform edge and raises a stone step',Math.max(...log)>=1,'max solids '+Math.max(...log)); }
{ const {log}=sim('corpent',{script:P([10,40]),frames:180,bx:520,probe:(f,a,b)=>b._pwDot?1:0}); T('Corpent: poison path hurts a grounded foe between the daggers',log.some(x=>x)); const r=sim('corpent',{script:P([10,40]),frames:180,bx:520,by:300,probe:(f,a,b)=>{ b.y=300; b.vy=0; b.grounded=false; return b._pwDot?1:0; }}); T('Corpent: a foe jumping the path is not poisoned',!r.log.some(x=>x)); }
{ const {log}=sim('silver',{script:P([10]),frames:100,probe:(f,a)=>a.knockbackTakenMul===undefined?1:a.knockbackTakenMul}); T('Silver: resists knockback while anchored, restored after',log[30]<0.5&&Math.abs(log[99]-1)<1e-6,'mul '+log[30]+'→'+log[99]); }
{ const r=sim('white',{script:(f)=>({power:f===10}),frames:140,ay:250,probe:(f,a)=>[a.vy,a.y,a._pw?a._pw.d.y0:null]}); const act=r.log.filter(l=>l[2]!==null); T('White: glides (never rises above start height, slow fall)',act.length>20&&act.every(l=>l[1]>=l[2]-7)&&act[20][0]<2.6,'n='+act.length); }
{ const {log}=sim('lavender',{script:P([10]),frames:120,probe:(f,a)=>(a._pwSolids||[]).length}); T('Lavender: two steps then they dissolve',Math.max(...log)===2&&log[110]===0,'max '+Math.max(...log)+' @110='+log[110]); }
{ const {log}=sim('g3_aiko',{script:P([10,50]),frames:120,probe:(f,a)=>[(a._pwSolids||[]).length,a._pw?a._pw.ents.filter(e=>e.proj).length:0]}); T('Aiko: platform then shatters into fragments',log[30][0]===1&&log.some(l=>l[1]>=5),'plat@30='+log[30][0]+' frags '+Math.max(...log.map(l=>l[1]))); }
{ const {log}=sim('g3_takeshi',{script:P([10]),frames:120,probe:(f,a)=>(a._pwSolids||[]).length}); T('Takeshi: ridge platform appears then bursts and is removed',Math.max(...log)===1&&log[119]===0,'max '+Math.max(...log)+' @119='+log[119]); }
{ const r=sim('g2_itto',{script:P([10]),frames:20,bx:500,probe:(f,a)=>Math.abs(a.vx)}); T('Itto: still, visible startup (no movement in the first 0.4s)',r.log[18]<0.5); }
console.log(res.filter(x=>x).length+'/'+res.length+' mechanic checks passed');
