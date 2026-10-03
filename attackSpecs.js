// Frame-accurate attack specifications and collision geometry.
// Generation I moves are hand-authored to match the animation shapes exactly.

import { OLD_GEN_CHARS } from './eras.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { DOWN_HEAVIES } from './downHeavies.js';
import { getGen2Hitboxes } from './gen2AttackAnims.js';
import { getGen3Hitboxes } from './gen3AttackAnims.js';
import { getGen4Hitboxes } from './gen4AttackAnims.js';
import { getGen5Hitboxes } from './gen5AttackAnims.js';
import { getGen5RestHitboxes } from './gen5RestAttackAnims.js';

const TAU = Math.PI * 2;

const CHAR_MAP = new Map([
  ...[...OLD_GEN_CHARS, ...HEROES, ...VILLAINS, ...GUARDIANS].map(c => [c.id, c]),
]);

const GEN1_MOVE_SPECS = {
  g1_thunder: {
    us:{name:'Lightning Circle',shape:'orbitPoint',range:92,knockback:'upContact',duration:28,damage:16,description:'Only the moving dot at the beginning of the lightning circle is active.'},
    ds:{name:'Lightning Dome',shape:'smallDome',range:58,knockback:'radialContact',duration:22,damage:17},
    ss:{name:'Lightning Bolt',shape:'forwardBolt',range:82,knockback:'forwardContact',duration:14,damage:15},
    upHeavy:{name:'Rising Lightning Trio',shape:'threeBolts',range:190,knockback:'upContact',duration:24,damage:23},
    dh:{name:'Orbiting Lightning Ball',shape:'orbitBall',range:100,knockback:'forwardContact',duration:24,damage:22},
    sh:{name:'Large Lightning Bolt',shape:'forwardBoltHeavy',range:105,knockback:'forwardContact',duration:18,damage:23},
    super:{name:'Thunder Strike',shape:'bottomBolt',range:90,knockback:'radialUp',duration:42,damage:38},
  },
  g1_fire: {
    us:{name:'Flaming Hook',shape:'hook',range:88,knockback:'upContact',duration:20,damage:16},
    ds:{name:'Ember Stamp',shape:'stampFlames',range:52,knockback:'radialContact',duration:18,damage:15},
    ss:{name:'Flaming Elbow',shape:'elbow',range:62,knockback:'forwardContact',duration:14,damage:15},
    upHeavy:{name:'Spinning Fire Wheel',shape:'fireWheel',range:120,knockback:'upContact',duration:24,damage:24},
    dh:{name:'Burning Cracks',shape:'cracks',range:120,knockback:'hitboxRadial',duration:26,damage:21},
    sh:{name:'Flaming Gauntlet',shape:'gauntlet',range:105,knockback:'forwardContact',duration:20,damage:24},
    super:{name:'Fireball Detonation',shape:'explosion',range:150,knockback:'radialContact',duration:42,damage:40},
  },
  g1_water: {
    us:{name:'Water Ring',shape:'waterRing',range:84,knockback:'velocity',duration:20,damage:15},
    ds:{name:'Twin Splashes',shape:'twinSplashes',range:70,knockback:'waterSplit',duration:18,damage:16},
    ss:{name:'Water Whip Tip',shape:'whipTip',range:90,knockback:'forwardContact',duration:15,damage:15},
    upHeavy:{name:'Spiral Water Ribbon',shape:'waterRibbon',range:145,knockback:'upContact',duration:25,damage:24},
    dh:{name:'Bouncing Water Sphere',shape:'waterBounce',range:96,knockback:'hitboxRadial',duration:24,damage:21},
    sh:{name:'Water Crescent',shape:'crescent',range:118,knockback:'forwardContact',duration:22,damage:24},
    super:{name:'Collapse Ring',shape:'collapseRing',range:150,knockback:'radialContact',duration:42,damage:38},
  },
  g1_grass: {
    us:{name:'Leaf Propeller',shape:'propellerLeaves',range:64,knockback:'up',duration:18,damage:15},
    ds:{name:'Thorn Snap',shape:'thornTips',range:72,knockback:'inward',duration:18,damage:14},
    ss:{name:'Wooden Branch Jab',shape:'branchEnd',range:86,knockback:'forwardContact',duration:14,damage:15},
    upHeavy:{name:'Petal Bloom',shape:'flowerPetals',range:120,knockback:'upContact',duration:26,damage:24},
    dh:{name:'Returning Vine',shape:'vineTwoHits',range:118,knockback:'hitboxRadial',duration:25,damage:21},
    sh:{name:'Branch Spear Split',shape:'branchSplit',range:120,knockback:'forwardContact',duration:24,damage:24},
    super:{name:'Flower Snap',shape:'flowerSnap',range:145,knockback:'radialContact',duration:42,damage:39},
  },
  g1_ice: {
    us:{name:'Throwing Ice Shard',shape:'throwingShard',range:105,knockback:'velocity',duration:20,damage:16},
    ds:{name:'Shattered Ice Plate',shape:'plateShards',range:88,knockback:'hitboxRadial',duration:22,damage:17},
    ss:{name:'Ice Forearm Blade',shape:'forearmBlade',range:72,knockback:'forwardContact',duration:16,damage:16},
    upHeavy:{name:'Tri-Shard Burst',shape:'shardBurst',range:130,knockback:'velocity',duration:24,damage:24},
    dh:{name:'Sliding Ice Block',shape:'iceBlock',range:128,knockback:'hitboxRadial',duration:24,damage:22},
    sh:{name:'Ice Hammer',shape:'hammerArc',range:112,knockback:'hitboxRadial',duration:24,damage:25},
    super:{name:'Crystal Explosion',shape:'crystalShards',range:155,knockback:'radialContact',duration:42,damage:40},
  },
};

function normalizeProfile(value, fallback = 'forward') { const v = String(value || '').toLowerCase(); return v || fallback; }
function moveFromKey(char, key) {
  if (!char) return null;
  const k = String(key || '').toLowerCase();
  if (k === 'super' || k === 'sp') return char.superMove || null;
  if (k === 'side' || k === 'sidesignature' || k === 'ss') return char.signatures?.side || null;
  if (k === 'up' || k === 'upsignature' || k === 'us') return char.signatures?.up || null;
  if (k === 'down' || k === 'downsignature' || k === 'ds') return char.signatures?.down || null;
  if (k === 'upheavy' || k === 'upHeavy' || k === 'uh' || k === 'aerialheavy') return char.upHeavy || char.up_heavy || null;
  if (k === 'heavy' || k === 'sideheavy' || k === 'sh') return char.heavyAttack || null;
  if (k === 'downheavy' || k === 'dh') return char.downHeavy || char.down_heavy || DOWN_HEAVIES[char.id] || null;
  return null;
}
function inferKind(data) {
  if (data?.isSuper || data?.sigType === 'super') return 'super';
  if (data?.isHeavy || data?.sigType === 'heavy' || data?.sigType === 'downHeavy' || data?.sigType === 'upHeavy') return 'heavy';
  return 'signature';
}
function buildSpec(charId, data, moveKey = '') {
  if (!data) return null;
  const kind = inferKind(data);
  return { charId, kind, moveKey, name:data.name || moveKey, description:String(data.desc || data.description || ''), color:data.color, shape:normalizeProfile(data.hitboxProfile || data.type, 'forward'), knockback:normalizeProfile(data.knockbackProfile || data.knockbackType, 'forward'), range:Number(data.range) || 100, duration:Number(data.duration) || (kind === 'super' ? 26 : kind === 'heavy' ? 13 : 10), damage:Number(data.damage) || 0 };
}
export function getAttackSpec(charId, moveKey) {
  const char = CHAR_MAP.get(charId); if (!char) return null;
  return buildSpec(charId, moveFromKey(char, moveKey), moveKey);
}
export function getAttackSpecForData(charId, attackData) {
  if (!attackData) return null;
  if (GEN1_MOVE_SPECS[charId]) {
    const raw = attackData.sigType;
    const key = attackData.isSuper ? 'super' : attackData.isHeavy ? (raw === 'downHeavy' ? 'dh' : raw === 'upHeavy' ? 'upHeavy' : 'sh') : raw === 'up' ? 'us' : raw === 'down' || raw === 'downNormal' ? 'ds' : 'ss';
    const override = GEN1_MOVE_SPECS[charId][key];
    if (override) return { charId, kind:attackData.isSuper ? 'super' : attackData.isHeavy ? 'heavy' : 'signature', moveKey:key, color:attackData.color, ...override };
  }
  const char = CHAR_MAP.get(charId);
  if (!char) return null;
  if (attackData.hitboxProfile || attackData.knockbackProfile || attackData.desc) return buildSpec(charId, attackData, attackData.name || attackData.sigType || 'attack');
  let key = attackData.sigType || ''; if (attackData.isSuper) key = 'super'; else if (attackData.isHeavy) key = attackData.sigType === 'downHeavy' ? 'downHeavy' : 'heavy';
  return getAttackSpec(charId, key);
}
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function activeProgress(fighter) { return clamp01((clamp01(fighter?.attackData?.progress ?? 0) - .08) / .77); }
function g1Frame(p) { return 1 + clamp01(p) * 11; }
function g1PointRectBox(ox, oy, f, lx, ly, w, h) { return {shape:'box', x:ox + lx*f, y:oy + ly, w, h}; }
function g1Circle(ox, oy, f, lx, ly, r) { return {shape:'circle', x:ox + lx*f, y:oy + ly, r}; }
function g1Capsule(ox, oy, f, x1,y1,x2,y2,r) { return {shape:'capsule', x1:ox+x1*f,y1:oy+y1,x2:ox+x2*f,y2:oy+y2,r}; }
function g1Poly(ox, oy, f, pts) { return {shape:'polygon', points:pts.map(([x,y])=>[ox+x*f,oy+y])}; }

// Generation I collision is authored from the same 12 logical frames used by
// gen1AttackAnims.js. This keeps hitboxes attached to the visible effects rather
// than to a generic rectangle. Thunder is also kept here unchanged.
function getGen1HeroHitboxes(attacker, move, p) {
  const id=String(attacker?.char?.id||''), f=attacker?.facing||1, ox=Number(attacker?.x)||0, oy=Number(attacker?.y)||0;
  const fr=g1Frame(p), out=[];
  const C=(x,y,r)=>out.push(g1Circle(ox,oy,f,x,y,r));
  const K=(x1,y1,x2,y2,r)=>out.push(g1Capsule(ox,oy,f,x1,y1,x2,y2,r));
  const B=(x,y,w,h)=>out.push(g1PointRectBox(ox,oy,f,x,y,w,h));
  const P=pts=>out.push(g1Poly(ox,oy,f,pts));
  const q=Math.max(0,Math.min(1,(fr-2)/6));

  if(id==='g1_thunder') {
    if(move==='us' && fr>=3 && fr<=8.6){const a=-Math.PI/2+Math.max(0,Math.min(1,(fr-2)/6))*TAU;C(Math.cos(a)*86,-112+Math.sin(a)*34,9);}
    else if(move==='ds' && fr>=4 && fr<=8){for(let i=0;i<9;i++){const a=Math.PI+i/8*Math.PI,r=18+Math.min(1,(fr-4)/4)*35;C(Math.cos(a)*r,-24+Math.sin(a)*r,9);}}
    else if((move==='ss'||move==='sh') && fr>=4 && fr<=7.5){const len=move==='sh'?100:68,cur=len*Math.max(0,Math.min(1,(fr-3)/4));P([[24,-50],[24+cur*.23,-62],[24+cur*.14,-50],[24+cur*.52,-56],[24+cur*.42,-38],[24+cur*.82,-50],[24+cur*.62,-68],[24+cur,-56]]);}
    else if((move==='upHeavy'||move==='uh') && fr>=4 && fr<=8){const top=-38-150*Math.max(0,Math.min(1,(fr-3)/5));for(const dx of [24,82,140])P([[dx-10,-38],[dx+10,-38],[dx+10,top],[dx-10,top]]);}
    else if(move==='dh' && fr>=4 && fr<=8){const a=-Math.PI/2+Math.max(0,Math.min(1,(fr-3)/5))*TAU;C(20+Math.cos(a)*94,-72+Math.sin(a)*55,13);}
    return out;
  }

  if(id==='g1_fire') {
    if(move==='us' && fr>=4 && fr<=6.2){const t=Math.max(0,Math.min(1,(fr-3)/2.7)),a=-2.2+2.04*t,r=36,ex=18+Math.cos(a)*r,ey=-90+Math.sin(a)*r;K(18,-48,18+18*Math.cos(a*.55),-48+18*Math.sin(a*.55),8);K(18+18*Math.cos(a*.55),-48+18*Math.sin(a*.55),ex,ey,8);C(ex,ey,11);}
    else if(move==='ds' && fr>=4 && fr<=7.2){const q=Math.max(0,Math.min(1,(fr-4)/3));for(let i=0;i<4;i++){const a=-Math.PI/2+(i-1.5)*.58,r=8+q*18;C(Math.cos(a)*r,-8+Math.sin(a)*r*.5,11);}}
    else if(move==='ss' && fr>=3.5 && fr<=6.5){const q=Math.max(0,Math.min(1,(fr-3)/3));K(20,-43,20+48*q,-43,14);}
    else if((move==='upHeavy'||move==='uh') && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6)),r=28+q*50;for(let i=0;i<14;i++){const a=i/14*TAU+q*TAU;C(Math.cos(a)*r,-92+Math.sin(a)*r*.72,11);}}
    else if(move==='dh' && fr>=4.5 && fr<=8){const q=Math.max(0,Math.min(1,(fr-2)/5));for(let i=0;i<5;i++){const dx=(i-2)*24*q;C(dx,-32-(i%2)*8,13);}}
    else if(move==='sh' && fr>=3.5 && fr<=8){const q=Math.max(0,Math.min(1,(fr-2)/5)),a=-1+q*1.9,cx=25+Math.cos(a)*48,cy=-45+Math.sin(a)*48;K(8,-45,cx,cy,15);C(cx,cy,20);}
    else if(move==='sp' && fr>=7 && fr<=10.5)C(82,-50,18+Math.max(0,Math.min(1,(fr-7)/3.5))*60);
    return out;
  }

  if(id==='g1_water') {
    if(move==='us' && fr>=3 && fr<=7){const t=Math.max(0,Math.min(1,(fr-2)/5)),rx=15+56*t+8*Math.sin(t*Math.PI),ry=-45-62*t-20*Math.sin(t*Math.PI);C(rx,ry,22);}
    else if(move==='ds' && fr>=4 && fr<=6.5){const q=Math.max(0,Math.min(1,(fr-3)/3));C(-18-30*q,-10-58*q,11);C(18+30*q,-10-58*q,11);}
    else if(move==='ss' && fr>=3.5 && fr<=6.5){const q=Math.max(0,Math.min(1,(fr-2)/4));C(12+78*q,-44-Math.sin(Math.PI*q)*30*q,10);}
    else if((move==='upHeavy'||move==='uh') && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6));for(let i=0;i<10;i++){const a=-1.25+i/9*2.5+q*1.9;C(Math.cos(a)*54,-64+Math.sin(a)*92,9);}}
    else if(move==='dh' && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6)),bx=70-140*q,by=-46+Math.max(0,q-.45)*90;C(bx,by,22);if(q>.65)for(let i=0;i<8;i++)C(bx+(i-3.5)*12,by-70*(q-.65),8);}
    else if(move==='sh' && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6));const pts=[];for(let i=0;i<=12;i++){const a=-.85+i/12*1.7;pts.push([20+Math.cos(a)*78,-48+Math.sin(a)*78]);}P(pts);}
    else if(move==='sp' && fr>=6 && fr<=11){const q=Math.max(0,Math.min(1,(fr-6)/5)),r=8+q*112;for(let i=0;i<18;i++){const a=i/18*TAU;C(Math.cos(a)*r,-52+Math.sin(a)*r*.7,10);}}
    return out;
  }

  if(id==='g1_grass') {
    if(move==='us' && fr>=3 && fr<=7.3){const cy=-112,spin=Math.max(0,Math.min(1,(fr-2)/6))*TAU;for(let i=0;i<3;i++){const a=i/3*TAU+spin;P([[Math.cos(a)*5-7,cy+Math.sin(a)*5-25],[Math.cos(a)*30,cy+Math.sin(a)*30],[Math.cos(a)*5+7,cy+Math.sin(a)*5+25]]);}}
    else if(move==='ds' && fr>=3.5 && fr<=7){const q=Math.max(0,Math.min(1,(fr-2)/4));C(-38+24*q,-42,9);C(38-24*q,-42,9);}
    else if(move==='ss' && fr>=3.5 && fr<=6.5){const q=Math.max(0,Math.min(1,(fr-2)/4));B(12+70*q,-44,20,16);C(12+82*q,-44,11);}
    else if((move==='upHeavy'||move==='uh') && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6)),r=22+q*70;for(let i=0;i<8;i++){const a=i/8*TAU;C(Math.cos(a)*r,-48+Math.sin(a)*r*.55,14);}}
    else if(move==='dh' && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6));if(q<.55)K(-35,-105,85*q,-5,12);else{const u=(q-.55)/.45;K(85,-5,85-95*u,-35+u*12,12);}}
    else if(move==='sh' && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6)),len=115*q;P([[18,-48],[18+len,-55],[18+len,-41]]);if(q>.58){const z=(q-.58)/.42;for(const a of[-.28,0,.28])P([[18+len,-48],[18+len+48*z,-48+Math.sin(a)*48*z],[18+len+48*z+8,-48+Math.sin(a)*48*z+6]]);}}
    else if(move==='sp' && fr>=6 && fr<=10.5){const q=Math.max(0,Math.min(1,(fr-6)/4.5)),r=112-q*98;for(let i=0;i<12;i++){const a=i/12*TAU;P([[Math.cos(a)*r-10,-48+Math.sin(a)*r*.65-28],[Math.cos(a)*r+14,-48+Math.sin(a)*r*.65],[Math.cos(a)*r-10,-48+Math.sin(a)*r*.65+28]]);}}
    return out;
  }

  if(id==='g1_ice') {
    if(move==='us' && fr>=3 && fr<=8.5){const t=Math.max(0,Math.min(1,(fr-3)/6.5)),sx=18+58*t,sy=-82-112*t;C(sx,sy,13);}
    else if(move==='ds' && fr>=5 && fr<=8){for(let i=0;i<7;i++){const a=Math.PI*1.05+i/6*Math.PI*.9,sx=Math.cos(a)*52*Math.max(0,Math.min(1,(fr-3)/4)),sy=-18+Math.sin(a)*35*Math.max(0,Math.min(1,(fr-3)/4));P([[sx,sy-14],[sx+10,sy+5],[sx-8,sy+8]]);}}
    else if(move==='ss' && fr>=3.5 && fr<=7){const q=Math.max(0,Math.min(1,(fr-2)/5)),a=-1.15+q*2.3;K(20,-45,20+Math.cos(a)*58,-45+Math.sin(a)*58,12);}
    else if((move==='upHeavy'||move==='uh') && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6));for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+q*.7,sx=Math.cos(a)*76*q,sy=-70+Math.sin(a)*76*q;K(sx*.65,-70+sy*.35,sx,sy,9);}}
    else if(move==='dh' && fr>=3.5 && fr<=9){const q=Math.max(0,Math.min(1,(fr-2)/6)),bx=28+104*q;B(bx,-18,68,34);if(q>.7){const e=(q-.7)/.3;B(bx+34+28*e,-48-20*e,24,26);B(bx-34-28*e,-6+18*e,24,26);}}
    else if(move==='sh' && fr>=3.5 && fr<=8.5){const q=Math.max(0,Math.min(1,(fr-2)/6)),a=-1.15+q*2.3;for(let i=0;i<7;i++){const aa=-1.15+(2.3)*(i/6)*q;C(22+Math.cos(aa)*76,-42+Math.sin(aa)*76,14);}if(q>.82)for(let i=0;i<5;i++){const aa=-.25+i*.12;C(96+Math.cos(aa)*34,-42+Math.sin(aa)*28,7);}}
    else if(move==='sp' && fr>=5 && fr<=11){const e=Math.max(0,Math.min(1,(fr-5)/6)),cx=52,cy=-54,r=24+e*110;for(let i=0;i<16;i++){const a=i/16*TAU;P([[cx+Math.cos(a)*r-8*Math.cos(a),cy+Math.sin(a)*r*.72-8*Math.sin(a)*.72],[cx+Math.cos(a)*r+12*Math.cos(a),cy+Math.sin(a)*r*.72+12*Math.sin(a)*.72],[cx+Math.cos(a)*r-5*Math.cos(a)+Math.sin(a)*6,cy+Math.sin(a)*r*.72-5*Math.sin(a)-Math.cos(a)*6]]);}}
    return out;
  }
  return out;
}

export function getActiveSpecHitboxes(attacker) {
  const data = attacker?.attackData; if (!data) return [];
  if (data.holding) return []; // held stance is purely visual; no hitbox exists until release
  const rawP = clamp01(attacker?.attackData?.progress ?? 0);
  const t = activeProgress(attacker); if (t <= 0 || t >= 1) return [];
  if (String(attacker?.char?.id || '').startsWith('g2_')) {
    let mk = data.sigType || data.moveKey || '';
    if (data.isSuper) mk = 'sp';
    else if (data.isHeavy) {
      if (mk === 'downHeavy' || mk === 'down' || data.isGroundPound) mk = 'dh';
      else if (mk === 'upHeavy' || mk === 'upheavy' || mk === 'aerialHeavy' || mk === 'aerial' || data.isAerialHeavy) mk = 'uh';
      else mk = 'sh';
    } else if (mk === 'up' || mk === 'upSignature') mk = 'us';
    else if (mk === 'down' || mk === 'downSignature') mk = 'ds';
    else mk = 'ss';
    const localBoxes = getGen2Hitboxes(attacker.char.id, mk, t, attacker.facing || 1);
    // Generation II hitboxes are authored in the same local coordinate space as
    // their attack drawings. Convert that local geometry into fighter/world
    // coordinates here; otherwise the overlay/collision system renders them at
    // the canvas origin (top-left).
    const ox = Number(attacker.x) || 0, oy = Number(attacker.y) || 0;
    return localBoxes.map(h => {
      if (h.shape === 'circle' || h.shape === 'box') return { ...h, x: ox + h.x, y: oy + h.y };
      if (h.shape === 'capsule') return { ...h, x1: ox + h.x1, y1: oy + h.y1, x2: ox + h.x2, y2: oy + h.y2 };
      if (h.shape === 'polygon') return { ...h, points: h.points.map(([px, py]) => [ox + px, oy + py]) };
      return h;
    });
  }
  if (String(attacker?.char?.id || '').startsWith('g3_')) {
    let mk = data.sigType || data.moveKey || '';
    if (data.isSuper) mk = 'sp';
    else if (data.isHeavy) {
      if (mk === 'downHeavy' || mk === 'down' || data.isGroundPound) mk = 'dh';
      else if (mk === 'upHeavy' || mk === 'upheavy' || mk === 'aerialHeavy' || mk === 'aerial' || data.isAerialHeavy) mk = 'uh';
      else mk = 'sh';
    } else if (mk === 'up' || mk === 'upSignature') mk = 'us';
    else if (mk === 'down' || mk === 'downSignature') mk = 'ds';
    else mk = 'ss';
    const localBoxes = getGen3Hitboxes(attacker.char.id, mk, t, attacker.facing || 1);
    const ox = Number(attacker.x) || 0, oy = Number(attacker.y) || 0;
    return localBoxes.map(h => {
      if (h.shape === 'circle' || h.shape === 'box') return { ...h, x: ox + h.x, y: oy + h.y };
      if (h.shape === 'capsule') return { ...h, x1: ox + h.x1, y1: oy + h.y1, x2: ox + h.x2, y2: oy + h.y2 };
      if (h.shape === 'polygon') return { ...h, points: h.points.map(([px, py]) => [ox + px, oy + py]) };
      return h;
    });
  }

  if (String(attacker?.char?.id || '').startsWith('g4_')) {
    let mk = data.sigType || data.moveKey || '';
    if (data.isSuper) mk = 'sp';
    else if (data.isHeavy) {
      if (mk === 'downHeavy' || mk === 'down' || data.isGroundPound) mk = 'dh';
      else if (mk === 'upHeavy' || mk === 'upheavy' || mk === 'aerialHeavy' || mk === 'aerial' || data.isAerialHeavy) mk = 'uh';
      else mk = 'sh';
    } else if (mk === 'up' || mk === 'upSignature') mk = 'us';
    else if (mk === 'down' || mk === 'downSignature') mk = 'ds';
    else mk = 'ss';
    const localBoxes = getGen4Hitboxes(attacker.char.id, mk, t, attacker.facing || 1);
    const ox = Number(attacker.x) || 0, oy = Number(attacker.y) || 0;
    return localBoxes.map(h => {
      if (h.shape === 'circle' || h.shape === 'box') return { ...h, x: ox + h.x, y: oy + h.y };
      if (h.shape === 'capsule') return { ...h, x1: ox + h.x1, y1: oy + h.y1, x2: ox + h.x2, y2: oy + h.y2 };
      if (h.shape === 'polygon') return { ...h, points: h.points.map(([px, py]) => [ox + px, oy + py]) };
      return h;
    });
  }

  if (['black','magenta','indigo','maroon','crimson','scarlet','white','silver','corpent','magneto','willow','cable','snodvor','kirsten','volt','temple','nightmare','hazel','whami','controller','evil','life','death','mercy'].includes(attacker?.char?.id)) {
    let mk = data.sigType || data.moveKey || '';
    if (data.isSuper) mk = 'sp';
    else if (data.isHeavy) {
      if (mk === 'downHeavy' || mk === 'down' || data.isGroundPound) mk = 'dh';
      else if (mk === 'upHeavy' || mk === 'upheavy' || mk === 'aerialHeavy' || mk === 'aerial' || data.isAerialHeavy) mk = 'uh';
      else mk = 'sh';
    } else if (mk === 'up' || mk === 'upSignature') mk = 'us';
    else if (mk === 'down' || mk === 'downSignature') mk = 'ds';
    else mk = 'ss';
    const localBoxes = getGen5RestHitboxes(attacker.char.id, mk, t, attacker.facing || 1);
    const ox = Number(attacker.x) || 0, oy = Number(attacker.y) || 0;
    return localBoxes.map(h => {
      if (h.shape === 'circle' || h.shape === 'box') return { ...h, x: ox + h.x, y: oy + h.y };
      if (h.shape === 'capsule') return { ...h, x1: ox + h.x1, y1: oy + h.y1, x2: ox + h.x2, y2: oy + h.y2 };
      if (h.shape === 'polygon') return { ...h, points: h.points.map(([px, py]) => [ox + px, oy + py]) };
      return h;
    });
  }
  if (['yellow','blue','purple','orange','green','pink','grey','turquoise','olive','copper','emerald','pearl','red','lavender','amber'].includes(attacker?.char?.id) || String(attacker?.char?.id || '').startsWith('g5_')) {
    let mk = data.sigType || data.moveKey || '';
    if (data.isSuper) mk = 'sp';
    else if (data.isHeavy) {
      if (mk === 'downHeavy' || mk === 'down' || data.isGroundPound) mk = 'dh';
      else if (mk === 'upHeavy' || mk === 'upheavy' || mk === 'aerialHeavy' || mk === 'aerial' || data.isAerialHeavy) mk = 'uh';
      else mk = 'sh';
    } else if (mk === 'up' || mk === 'upSignature') mk = 'us';
    else if (mk === 'down' || mk === 'downSignature') mk = 'ds';
    else mk = 'ss';
    const localBoxes = getGen5Hitboxes(attacker.char.id, mk, t, attacker.facing || 1);
    const ox = Number(attacker.x) || 0, oy = Number(attacker.y) || 0;
    return localBoxes.map(h => {
      if (h.shape === 'circle' || h.shape === 'box') return { ...h, x: ox + h.x, y: oy + h.y };
      if (h.shape === 'capsule') return { ...h, x1: ox + h.x1, y1: oy + h.y1, x2: ox + h.x2, y2: oy + h.y2 };
      if (h.shape === 'polygon') return { ...h, points: h.points.map(([px, py]) => [ox + px, oy + py]) };
      return h;
    });
  }

  const spec = data.spec || getAttackSpecForData(attacker.char?.id, data); if (!spec) return [];
  const f = attacker.facing || 1, x = attacker.x, y = attacker.y;
  const out = [];
  const C = (lx, ly, r) => out.push({shape:'circle', x:x + lx * f, y:y + ly, r});
  const B = (lx, ly, w, h) => out.push({shape:'box', x:x + lx * f, y:y + ly, w, h});
  const K = (x1,y1,x2,y2,r) => out.push({shape:'capsule', x1:x + x1*f, y1:y + y1, x2:x + x2*f, y2:y + y2, r});
  const P = pts => out.push({shape:'polygon', points:pts.map(([px,py]) => [x + px*f, y + py])});
  const q = t;
  switch (spec.shape) {
    // Thunder — Up Signature: ONLY the moving dot at the start of the circular line.
    case 'orbitPoint': { const a = -Math.PI/2 + (q < .92 ? q * TAU : TAU); C(Math.cos(a)*86, -112 + Math.sin(a)*34, 9); break; }
    case 'smallDome': { if (q < .18) break; const r=18 + Math.min(1,(q-.18)/.82)*35; for(let i=0;i<9;i++){const a=Math.PI+i/8*Math.PI; C(Math.cos(a)*r, -24+Math.sin(a)*r, 9);} break; }
    case 'forwardBolt': case 'forwardBoltHeavy': {
      const len = spec.shape === 'forwardBoltHeavy' ? 100 : 68; const cur = len * (.25 + .75*q);
      P([[24,-50],[24+cur*.23,-50-12],[24+cur*.14,-50],[24+cur*.52,-50-6],[24+cur*.42,-50+12],[24+cur*.82,-50],[24+cur*.62,-50-18],[24+cur,-50-6]]); break;
    }
    case 'threeBolts': { const top = -38 - 150*q; for(const dx of [24,82,140]) P([[dx-10,-38],[dx+10,-38],[dx+10,top],[dx-10,top]]); break; }
    case 'orbitBall': { const a=-Math.PI/2+q*TAU; C(20+Math.cos(a)*94,-72+Math.sin(a)*55,13); break; }
    case 'bottomBolt': { if(q < .35) break; P([[-15,-95],[15,-95],[9,-42],[14,-10],[-14,-10],[-9,-42]]); break; }
    case 'hook': { const a=-1.2+q*2.1, r=52+q*14; const ex=18+Math.cos(a)*r, ey=-48+Math.sin(a)*r; K(18,-48,18+r*.50*Math.cos(a*.55),-48+r*.50*Math.sin(a*.55),8); K(18+r*.50*Math.cos(a*.55),-48+r*.50*Math.sin(a*.55),ex,ey,8); C(ex,ey,11); break; }
    case 'stampFlames': { for(let i=0;i<4;i++) C((i-1.5)*13,-9-Math.abs(i-1.5)*4,11); break; }
    case 'elbow': { K(20,-42,20+q*48,-42,14); break; }
    case 'fireWheel': { const r=70; for(let i=0;i<14;i++){const a=i/14*TAU+q*TAU; C(Math.cos(a)*r,-92+Math.sin(a)*r,11);} break; }
    case 'cracks': { if(q<.2) break; for(let i=0;i<5;i++){const dx=(i-2)*30*q; C(dx,-34-(i%2)*4,13);} break; }
    case 'gauntlet': { const ang=-.8+q*1.7, cx=28+Math.cos(ang)*42, cy=-42+Math.sin(ang)*42; K(8,-42,cx,cy,15); C(cx,cy,20); break; }
    case 'explosion': { if(q<.5) break; const e=(q-.5)/.5; C(78,-48,Math.min(88,34+e*54)); break; }
    case 'waterRing': { const a=-Math.PI/2+q*1.25; const r=48; C(12+Math.cos(a)*r,-54+Math.sin(a)*r,13); break; }
    case 'twinSplashes': { const sy=-8-62*q; C(-42,sy,11); C(42,sy,11); break; }
    case 'whipTip': { C(16+72*q,-42-Math.sin(q*Math.PI)*26,10); break; }
    case 'waterRibbon': { for(let i=0;i<10;i++){const a=-1.25+i/9*2.5+q*1.9; C(Math.cos(a)*54,-64+Math.sin(a)*92,9);} break; }
    case 'waterBounce': { const bx=70-140*q, by=-46+Math.max(0,q-.45)*90; C(bx,by,22); if(q>.65) for(let i=0;i<8;i++) C(bx+(i-3.5)*12,by-70*(q-.65),8); break; }
    case 'crescent': { const pts=[]; for(let i=0;i<=12;i++){const a=-.85+i/12*1.7; pts.push([20+Math.cos(a)*78,-48+Math.sin(a)*78]);} P(pts); break; }
    case 'collapseRing': { if(q<.45) break; const r=10+(q-.45)/.55*110; for(let i=0;i<18;i++){const a=i/18*TAU; C(Math.cos(a)*r,-52+Math.sin(a)*r*.7,10);} break; }
    case 'propellerLeaves': { const cy=-112; for(let i=0;i<3;i++){const a=i/3*TAU+q*TAU; P([[Math.cos(a)*5-7,cy+Math.sin(a)*5-25],[Math.cos(a)*30,cy+Math.sin(a)*30],[Math.cos(a)*5+7,cy+Math.sin(a)*5+25]]);} break; }
    case 'thornTips': { C(-38+q*24,-42,9); C(38-q*24,-42,9); break; }
    case 'branchEnd': { B(12+70*q,-44,20,16); C(82*q+12,-44,11); break; }
    case 'flowerPetals': { const r=76*q; for(let i=0;i<8;i++){const a=i/8*TAU; P([[Math.cos(a)*r-9,-48+Math.sin(a)*r*.55-24],[Math.cos(a)*r+14,-48+Math.sin(a)*r*.55],[Math.cos(a)*r-9,-48+Math.sin(a)*r*.55+24]]);} break; }
    case 'vineTwoHits': { if(q<.55) { const u=q/.55; K(-25,-105,85*u,-5,12); } else { const u=(q-.55)/.45; K(85,-5,85-95*u,-35+u*12,12); } break; }
    case 'branchSplit': { const len=115*q; P([[18,-48],[18+len,-55],[18+len,-41]]); if(q>.58){const s=(q-.58)/.42; for(const a of [-.28,0,.28]) P([[18+len,-48],[18+len+48*s,-48+Math.sin(a)*48*s],[18+len+48*s+8,-48+Math.sin(a)*48*s+6]]);} break; }
    case 'flowerSnap': { if(q<.4) break; const r=112-(q-.4)/.6*98; for(let i=0;i<12;i++){const a=i/12*TAU; P([[Math.cos(a)*r-10,-48+Math.sin(a)*r*.65-28],[Math.cos(a)*r+14,-48+Math.sin(a)*r*.65],[Math.cos(a)*r-10,-48+Math.sin(a)*r*.65+28]]);} break; }
    case 'throwingShard': { const sx=22+55*q, sy=-62-100*q; P([[sx,-30+sy],[sx+11,sy+12],[sx-7,sy+20]]); break; }
    case 'plateShards': { for(let i=0;i<7;i++){const a=Math.PI*1.05+i/6*Math.PI*.9; const sx=Math.cos(a)*52*q, sy=-18+Math.sin(a)*35*q; P([[sx,sy-14],[sx+10,sy+5],[sx-8,sy+8]]);} break; }
    case 'forearmBlade': { const a=-1.15+q*2.3; K(20,-45,20+Math.cos(a)*58,-45+Math.sin(a)*58,12); break; }
    case 'shardBurst': { for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+q*.7; const sx=Math.cos(a)*76*q, sy=-70+Math.sin(a)*76*q; K(sx*.65,-70+sy*.35,sx,sy,9);} break; }
    case 'iceBlock': { const bx=28+100*q; B(bx,-18,68,34); if(q>.7){const e=(q-.7)/.3; B(bx+34+28*e,-48-20*e,24,26); B(bx-34-28*e,-6+18*e,24,26);} break; }
    case 'hammerArc': { const a0=-1.15, a1=1.15; for(let i=0;i<7;i++){const a=a0+(a1-a0)*(i/6)*q; C(22+Math.cos(a)*76,-42+Math.sin(a)*76,14);} if(q>.82){for(let i=0;i<5;i++){const a=-.25+i*.12; C(96+Math.cos(a)*34,-42+Math.sin(a)*28,7);}} break; }
    case 'crystalShards': { if(q<.38) break; const e=(q-.38)/.62, cx=52, cy=-54, r=24+e*110; for(let i=0;i<16;i++){const a=i/16*TAU; const sx=cx+Math.cos(a)*r, sy=cy+Math.sin(a)*r*.72; const nx=Math.cos(a), ny=Math.sin(a)*.72; P([[sx-8*nx,sy-8*ny],[sx+12*nx,sy+12*ny],[sx-5*nx+ny*6,sy-5*ny-nx*6]]);} break; }
    default: {
      const reach=Math.min(160,Math.max(50,spec.range)); K(24,-42,reach*q,-42,12);
    }
  }
  return out;
}

function pointRectDistance(px, py, rx, ry, rw, rh) {
  const cx=Math.max(rx-rw/2,Math.min(px,rx+rw/2)); const cy=Math.max(ry-rh/2,Math.min(py,ry+rh/2)); return Math.hypot(px-cx,py-cy);
}
function pointInPoly(px,py,pts){let inside=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j]; const hit=((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi||1e-9)+xi); if(hit) inside=!inside;} return inside;}
function segIntersects(a,b,c,d){const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]); const c1=cross(a,b,c),c2=cross(a,b,d),c3=cross(c,d,a),c4=cross(c,d,b); return ((c1===0&&onSeg(a,b,c))||(c2===0&&onSeg(a,b,d))||(c3===0&&onSeg(c,d,a))||(c4===0&&onSeg(c,d,b)))||(c1>0)!==(c2>0)&&(c3>0)!==(c4>0);}
function onSeg(a,b,p){return p[0]>=Math.min(a[0],b[0])-1e-6&&p[0]<=Math.max(a[0],b[0])+1e-6&&p[1]>=Math.min(a[1],b[1])-1e-6&&p[1]<=Math.max(a[1],b[1])+1e-6;}
function polygonHitsBody(poly, bx, by, bw, bh){
  const rect=[[bx-bw/2,by-bh/2],[bx+bw/2,by-bh/2],[bx+bw/2,by+bh/2],[bx-bw/2,by+bh/2]];
  if(poly.some(p=>pointInPoly(p[0],p[1],rect))) return true;
  if(rect.some(p=>pointInPoly(p[0],p[1],poly))) return true;
  for(let i=0;i<poly.length;i++) if(segIntersects(poly[i],poly[(i+1)%poly.length],rect[0],rect[1])||segIntersects(poly[i],poly[(i+1)%poly.length],rect[1],rect[2])||segIntersects(poly[i],poly[(i+1)%poly.length],rect[2],rect[3])||segIntersects(poly[i],poly[(i+1)%poly.length],rect[3],rect[0])) return true;
  return false;
}
export function hitboxIntersectsBody(hb, defender){
  const bw=32,bh=72,bx=defender.x,by=defender.y-36;
  if(hb.shape==='circle') return pointRectDistance(hb.x,hb.y,bx,by,bw,bh)<=hb.r;
  if(hb.shape==='box') return Math.abs(hb.x-bx)<=hb.w/2+bw/2 && Math.abs(hb.y-by)<=hb.h/2+bh/2;
  if(hb.shape==='polygon') return polygonHitsBody(hb.points,bx,by,bw,bh);
  if(hb.shape==='capsule') {
    const vx=hb.x2-hb.x1,vy=hb.y2-hb.y1,len2=vx*vx+vy*vy||1; const t=Math.max(0,Math.min(1,((bx-hb.x1)*vx+(by-hb.y1)*vy)/len2)); const px=hb.x1+vx*t,py=hb.y1+vy*t; return pointRectDistance(px,py,bx,by,bw,bh)<=hb.r;
  }
  return false;
}
function radialVector(attacker, defender){const dx=defender.x-attacker.x,dy=defender.y-attacker.y-0;const len=Math.hypot(dx,dy)||1;return{x:dx/len,y:dy/len};}
export function specKnockbackVector(attacker, defender, profile){
  const p=String(profile||'forward').toLowerCase(),f=attacker.facing||1;
  if(p==='up') return {x:f*.18,y:-1};
  if(p==='upcontact'){const dx=defender.x-attacker.x;return{x:Math.max(-.55,Math.min(.55,dx/90)),y:-1};}
  if(p==='radial'||p==='radialcontact') return radialVector(attacker,defender);
  if(p==='hitboxradial'){ const hp=attacker?.attackData?._hitPoint; if(hp){ const dx=defender.x-hp.x, dy=(defender.y-30)-hp.y, len=Math.hypot(dx,dy)||1; return {x:dx/len,y:dy/len}; } return radialVector(attacker,defender); }
  if(p==='inward'){const dx=attacker.x-defender.x,dy=attacker.y-defender.y,len=Math.hypot(dx,dy)||1;return{x:dx/len,y:dy/len};}
  if(p==='watersplit'){ const side = defender.x >= attacker.x ? 1 : -1; return {x:side,y:-0.28}; }
  if(p==='forwardcontact'){const dy=(defender.y-attacker.y)/90;return{x:f,y:Math.max(-.75,Math.min(.35,dy))};}
  if(p==='radialup'){const dx=defender.x-attacker.x;return{x:Math.max(-.8,Math.min(.8,dx/100)),y:-1};}
  if(p==='velocity'){const vx=attacker.vx||f,vy=attacker.vy||0,len=Math.hypot(vx,vy)||1;return{x:vx/len,y:vy/len};}
  return {x:f,y:-.38};
}
export function describeAttackSpec(spec){return spec?.description||'';}
