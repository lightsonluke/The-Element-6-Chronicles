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
    us:{name:'Flaming Hook',shape:'hook',range:94,knockback:'upContact',duration:24,damage:17},
    ds:{name:'Ember Stamp',shape:'stampFlames',range:60,knockback:'radialContact',duration:22,damage:16},
    ss:{name:'Flaming Elbow',shape:'elbow',range:104,knockback:'forwardContact',duration:20,damage:16},
    upHeavy:{name:'Spinning Fire Wheel',shape:'fireWheel',range:132,knockback:'upContact',duration:28,damage:25},
    dh:{name:'Burning Cracks',shape:'cracks',range:126,knockback:'radialContact',duration:28,damage:22},
    sh:{name:'Flaming Gauntlet',shape:'gauntlet',range:118,knockback:'forwardContact',duration:26,damage:25},
    super:{name:'Fireball Detonation',shape:'explosion',range:160,knockback:'radialContact',duration:48,damage:42},
  },
  g1_water: {
    us:{name:'Water Ring',shape:'waterRing',range:145,knockback:'waterRingTravel',duration:20,damage:16},
    ds:{name:'Twin Splashes',shape:'twinSplashes',range:105,knockback:'waterSplashSide',duration:20,damage:17},
    ss:{name:'Water Whip Tip',shape:'whipTip',range:135,knockback:'forwardContact',duration:20,damage:16},
    upHeavy:{name:'Spiral Water Ribbon',shape:'waterRibbon',range:155,knockback:'upContact',duration:24,damage:25},
    dh:{name:'Bouncing Water Sphere',shape:'waterBounce',range:125,knockback:'waterBounce',duration:24,damage:22},
    sh:{name:'Water Crescent',shape:'crescent',range:145,knockback:'waterCrescent',duration:26,damage:25},
    super:{name:'Collapse Ring',shape:'collapseRing',range:170,knockback:'radialUp',duration:42,damage:40},
  },
  g1_grass: {
    us:{name:'Leaf Propeller',shape:'propellerLeaves',range:78,knockback:'up',duration:24,damage:16},
    ds:{name:'Thorn Snap',shape:'thornTips',range:82,knockback:'inward',duration:22,damage:15},
    ss:{name:'Wooden Branch Jab',shape:'branchEnd',range:112,knockback:'forwardContact',duration:20,damage:16},
    upHeavy:{name:'Petal Bloom',shape:'flowerPetals',range:132,knockback:'upContact',duration:28,damage:25},
    dh:{name:'Returning Vine',shape:'vineTwoHits',range:130,knockback:'forwardContact',duration:28,damage:22},
    sh:{name:'Branch Spear Split',shape:'branchSplit',range:136,knockback:'forwardContact',duration:28,damage:25},
    super:{name:'Flower Snap',shape:'flowerSnap',range:158,knockback:'radialContact',duration:48,damage:41},
  },
  g1_ice: {
    us:{name:'Throwing Ice Shard',shape:'throwingShard',range:130,knockback:'velocity',duration:24,damage:17},
    ds:{name:'Shattered Ice Plate',shape:'plateShards',range:96,knockback:'radialContact',duration:24,damage:18},
    ss:{name:'Ice Forearm Blade',shape:'forearmBlade',range:98,knockback:'forwardContact',duration:22,damage:17},
    upHeavy:{name:'Tri-Shard Burst',shape:'shardBurst',range:142,knockback:'velocity',duration:28,damage:25},
    dh:{name:'Sliding Ice Block',shape:'iceBlock',range:140,knockback:'forwardContact',duration:28,damage:23},
    sh:{name:'Ice Hammer',shape:'hammerArc',range:126,knockback:'forwardContact',duration:28,damage:26},
    super:{name:'Crystal Explosion',shape:'crystalShards',range:170,knockback:'radialContact',duration:48,damage:42},
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

export function getActiveSpecHitboxes(attacker) {
  const data = attacker?.attackData; if (!data) return [];
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
    case 'hook': { if(q<.16 || q>.82) break; const u=Math.max(0,Math.min(1,(q-.16)/.66)); const a=-2.45+u*2.0, r=42+u*8; const ex=18+Math.cos(a)*r, ey=-48+Math.sin(a)*r; K(18,-48,18+r*.50*Math.cos(a*.55),-48+r*.50*Math.sin(a*.55),9); K(18+r*.50*Math.cos(a*.55),-48+r*.50*Math.sin(a*.55),ex,ey,9); C(ex,ey,12); break; }
    case 'stampFlames': { for(let i=0;i<4;i++) C((i-1.5)*13,-9-Math.abs(i-1.5)*4,11); break; }
    case 'elbow': { K(20,-42,20+q*48,-42,14); break; }
    case 'fireWheel': { const r=70; for(let i=0;i<14;i++){const a=i/14*TAU+q*TAU; C(Math.cos(a)*r,-92+Math.sin(a)*r,11);} break; }
    case 'cracks': { if(q<.2) break; for(let i=0;i<5;i++){const dx=(i-2)*30*q; C(dx,-34-(i%2)*4,13);} break; }
    case 'gauntlet': { const ang=-.8+q*1.7, cx=28+Math.cos(ang)*42, cy=-42+Math.sin(ang)*42; K(8,-42,cx,cy,15); C(cx,cy,20); break; }
    case 'explosion': { if(q<.5) break; const e=(q-.5)/.5; C(78,-48,Math.min(88,34+e*54)); break; }
    case 'waterRing': {
      if(q<.34 || q>.9) break;
      const u=Math.max(0,Math.min(1,(q-.34)/.56));
      const tx=26+u*112, ty=-54-u*66+Math.sin(u*Math.PI)*17;
      const rx=26-2*u, ry=11-1*u;
      for(let i=0;i<10;i++){const a=i/10*TAU; C(tx+Math.cos(a)*rx,ty+Math.sin(a)*ry,6);}
      break;
    }
    case 'twinSplashes': {
      if(q<.22 || q>.9) break;
      const u=Math.max(0,Math.min(1,(q-.22)/.68));
      const h=18+38*Math.sin(Math.PI*u);
      C(-28-24*u,-5-h,11); C(28+24*u,-5-h,11);
      C(-20-18*u,-8-h*.55,8); C(20+18*u,-8-h*.55,8);
      break;
    }
    case 'whipTip': {
      if(q<.18 || q>.88) break;
      const u=Math.max(0,Math.min(1,(q-.18)/.70));
      C(18+112*u,-43-Math.sin(u*Math.PI)*18,10);
      break;
    }
    case 'waterRibbon': {
      if(q<.08 || q>.9) break;
      const u=Math.max(0,Math.min(1,(q-.08)/.82));
      const twist=u*TAU*1.25;
      for(let i=0;i<12;i++){const z=i/11,a=twist+z*TAU*1.15; C(Math.cos(a)*(30+z*42),-56+Math.sin(a)*(72-z*18),9);}
      break;
    }
    case 'waterBounce': {
      if(q<.12 || q>.9) break;
      const u=Math.max(0,Math.min(1,(q-.12)/.78));
      const bx=58-34*u, by=-40+Math.sin(u*Math.PI)*28;
      if(u<.42) C(bx,by,22);
      else { const rise=Math.max(0,Math.min(1,(u-.42)/.58)); C(bx,by-rise*82,Math.max(14,22-4*rise)); for(let i=0;i<8;i++) C(bx+(i-3.5)*5,by-rise*82-(i%2)*12,6); }
      break;
    }
    case 'crescent': {
      if(q<.08 || q>.92) break;
      const u=Math.max(0,Math.min(1,(q-.08)/.84));
      const a0=-1.15+u*.25, a1=1.15+u*TAU*.95, pts=[];
      for(let i=0;i<=20;i++){const z=i/20,a=a0+(a1-a0)*z; pts.push([34+Math.cos(a)*70,-48+Math.sin(a)*60]);}
      P(pts);
      break;
    }
    case 'collapseRing': {
      if(q<.2 || q>.96) break;
      let r;
      if(q<.55) r=20+55*Math.max(0,(q-.2)/.35);
      else if(q<.68) r=75-(q-.55)/.13*57;
      else r=18+(q-.68)/.28*92;
      for(let i=0;i<18;i++){const a=i/18*TAU; C(Math.cos(a)*r,-55+Math.sin(a)*r*.66,7);}
      break;
    }
    case 'propellerLeaves': { if(q<.12 || q>.78) break; const u=Math.max(0,Math.min(1,(q-.12)/.66)), cy=-92+u*72, rot=u*TAU; for(let i=0;i<3;i++){const a=rot+i*TAU/3, cx=Math.cos(a)*34, sy=cy+Math.sin(a)*34*.38; P([[cx-7,sy-24],[cx+10,sy],[cx-7,sy+24]]);} break; }
    case 'thornTips': { C(-38+q*24,-42,9); C(38-q*24,-42,9); break; }
    case 'branchEnd': { B(12+70*q,-44,20,16); C(82*q+12,-44,11); break; }
    case 'flowerPetals': { const r=76*q; for(let i=0;i<8;i++){const a=i/8*TAU; P([[Math.cos(a)*r-9,-48+Math.sin(a)*r*.55-24],[Math.cos(a)*r+14,-48+Math.sin(a)*r*.55],[Math.cos(a)*r-9,-48+Math.sin(a)*r*.55+24]]);} break; }
    case 'vineTwoHits': { if(q<.55) { const u=q/.55; K(-25,-105,85*u,-5,12); } else { const u=(q-.55)/.45; K(85,-5,85-95*u,-35+u*12,12); } break; }
    case 'branchSplit': { const len=115*q; P([[18,-48],[18+len,-55],[18+len,-41]]); if(q>.58){const s=(q-.58)/.42; for(const a of [-.28,0,.28]) P([[18+len,-48],[18+len+48*s,-48+Math.sin(a)*48*s],[18+len+48*s+8,-48+Math.sin(a)*48*s+6]]);} break; }
    case 'flowerSnap': { if(q<.4) break; const r=112-(q-.4)/.6*98; for(let i=0;i<12;i++){const a=i/12*TAU; P([[Math.cos(a)*r-10,-48+Math.sin(a)*r*.65-28],[Math.cos(a)*r+14,-48+Math.sin(a)*r*.65],[Math.cos(a)*r-10,-48+Math.sin(a)*r*.65+28]]);} break; }
    case 'throwingShard': { if(q<.16 || q>.88) break; const u=Math.max(0,Math.min(1,(q-.16)/.72)); const sx=8+u*110, sy=-88-u*92; P([[sx,sy-31],[sx+13,sy+12],[sx-8,sy+20],[sx-4,sy-8]]); break; }
    case 'plateShards': { for(let i=0;i<7;i++){const a=Math.PI*1.05+i/6*Math.PI*.9; const sx=Math.cos(a)*52*q, sy=-18+Math.sin(a)*35*q; P([[sx,sy-14],[sx+10,sy+5],[sx-8,sy+8]]);} break; }
    case 'forearmBlade': { const a=-1.15+q*2.3; K(20,-45,20+Math.cos(a)*58,-45+Math.sin(a)*58,12); break; }
    case 'shardBurst': { for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3+q*.7; const sx=Math.cos(a)*76*q, sy=-70+Math.sin(a)*76*q; K(sx*.65,-70+sy*.35,sx,sy,9);} break; }
    case 'iceBlock': { const bx=28+100*q; B(bx,-18,68,34); if(q>.7){B(bx+34,-48,24,26);B(bx-34,-6,24,26);} break; }
    case 'hammerArc': { const a=-1+q*2; C(22+Math.cos(a)*72,-42+Math.sin(a)*72,20); break; }
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
  if(p==='inward'){const dx=attacker.x-defender.x,dy=attacker.y-defender.y,len=Math.hypot(dx,dy)||1;return{x:dx/len,y:dy/len};}
  if(p==='forwardcontact'){const dy=(defender.y-attacker.y)/90;return{x:f,y:Math.max(-.75,Math.min(.35,dy))};}
  if(p==='radialup'){const dx=defender.x-attacker.x;return{x:Math.max(-.8,Math.min(.8,dx/100)),y:-1};}
  if(p==='waterringtravel'){
    const q=Number(attacker.attackData?.progress)||0;
    const u=Math.max(0,Math.min(1,(q-.34)/.56));
    const dx=112; const dy=-66+Math.cos(u*Math.PI)*17*Math.PI;
    const len=Math.hypot(dx,dy)||1; return {x:dx/len,y:dy/len};
  }
  if(p==='watersplashside'){
    const side=defender.x>=attacker.x?1:-1; return {x:side*.95,y:-.25};
  }
  if(p==='waterbounce'){
    const dx=defender.x-attacker.x; return {x:Math.max(-.55,Math.min(.55,dx/100)),y:-1};
  }
  if(p==='watercrescent'){
    const dx=defender.x-attacker.x,dy=defender.y-attacker.y,len=Math.hypot(dx,dy)||1;
    return {x:dx/len,y:Math.max(-.55,Math.min(.35,dy/len))};
  }
  if(p==='velocity'){const vx=attacker.vx||f,vy=attacker.vy||0,len=Math.hypot(vx,vy)||1;return{x:vx/len,y:vy/len};}
  return {x:f,y:-.38};
}
export function describeAttackSpec(spec){return spec?.description||'';}
