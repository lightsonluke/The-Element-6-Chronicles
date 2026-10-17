import { RESONANCE_CONSTRUCT_SPECS, RESONANCE_CONSTRUCT_SPEC_BY_NAME, getResonanceMoveSpec } from './resonanceConstructsAttackSpecs.js';
// Resonance Constructs — match-level state and construct combat profiles.
// Kept separate from the fighter engine so the rules can be reused by other fight modes.
export const CONSTRUCTS = {
  'Resonance Blade': { family:'blade', reach:1.00, speed:1.00, power:1.00, shape:'slash' },
  'Twin Fangs': { family:'dual', reach:.72, speed:1.20, power:.78, shape:'cross' },
  'Phase Katana': { family:'katana', reach:1.12, speed:.88, power:1.12, shape:'draw' },
  'Reaper Scythe': { family:'scythe', reach:1.18, speed:.78, power:1.08, shape:'crescent' },
  'Resonance Rapier': { family:'rapier', reach:1.06, speed:1.13, power:.84, shape:'thrust' },
  'Crescent Blades': { family:'crescent', reach:.98, speed:1.03, power:.93, shape:'doubleArc' },
  'Impact Hammer': { family:'hammer', reach:.92, speed:.76, power:1.18, shape:'smash' },
  'Greatblade': { family:'greatblade', reach:1.16, speed:.78, power:1.12, shape:'wideSlash' },
  'Rift Axe': { family:'axe', reach:1.02, speed:.82, power:1.13, shape:'chop' },
  'Gravity Maul': { family:'maul', reach:1.05, speed:.70, power:1.18, shape:'slam' },
  'Pulse Flail': { family:'flail', reach:1.22, speed:.82, power:1.00, shape:'swing' },
  'Resonance Spear': { family:'spear', reach:1.22, speed:.96, power:.92, shape:'thrust' },
  'Rift Halberd': { family:'halberd', reach:1.18, speed:.82, power:1.04, shape:'hookSlash' },
  'Flux Staff': { family:'staff', reach:1.08, speed:1.05, power:.88, shape:'spin' },
  'Triad Trident': { family:'trident', reach:1.14, speed:.92, power:.96, shape:'threeProng' },
  'Pulse Bow': { family:'bow', reach:1.42, speed:.80, power:.92, shape:'projectile' },
  'Resonance Cannons': { family:'cannons', reach:1.36, speed:.90, power:.94, shape:'blast' },
  'Twin Blasters': { family:'blasters', reach:1.28, speed:1.12, power:.78, shape:'volley' },
  'Disc Launcher': { family:'disc', reach:1.30, speed:.90, power:.90, shape:'disc' },
  'Siege Projector': { family:'projector', reach:1.48, speed:.68, power:1.10, shape:'beam' },
  'Chainwhip': { family:'whip', reach:1.32, speed:.92, power:.90, shape:'whip' },
  'Tether Gauntlets': { family:'tether', reach:1.05, speed:1.00, power:.98, shape:'tether' },
  'Vector Rings': { family:'rings', reach:1.12, speed:1.04, power:.88, shape:'orbit' },
  'Vector Greaves': { family:'greaves', reach:.92, speed:1.16, power:.88, shape:'kick' },
  'Orbit Core': { family:'core', reach:1.24, speed:.92, power:.94, shape:'orbit' },
  'Rift Claws': { family:'claws', reach:.82, speed:1.18, power:.86, shape:'rake' },
  'Aegis Shield': { family:'shield', reach:.96, speed:.84, power:1.00, shape:'bash' },
  'Pulse Tonfas': { family:'tonfas', reach:.78, speed:1.20, power:.82, shape:'combo' },
  'Shard Array': { family:'shards', reach:1.18, speed:.94, power:.90, shape:'shards' },
  'Bastion Set': { family:'bastion', reach:1.00, speed:.94, power:.96, shape:'counter' },
};

export { RESONANCE_CONSTRUCT_SPECS, RESONANCE_CONSTRUCT_SPEC_BY_NAME, getResonanceMoveSpec };

const ASSIGNMENTS = {
  'Fire Hero':'Greatblade','Water Hero':'Triad Trident','Grass Hero':'Shard Array','Ice Hero':'Resonance Spear','Thunder Hero':'Resonance Cannons',
  'Renji Kurogane':'Resonance Blade','Kaito':'Twin Fangs','Hana Mizushima':'Triad Trident','Daigo':'Impact Hammer','Osamu':'Flux Staff','Mai':'Phase Katana','Yui':'Orbit Core','Suzu':'Vector Greaves',
  'Takeshi Sando':'Rift Halberd','Aiko Hone':'Rift Claws','Haru Garasu':'Resonance Rapier','Chiyo Doku':'Chainwhip','Emi Chi':'Pulse Bow','Ryo Kiri':'Crescent Blades','Masaru Hai':'Pulse Flail','Nozomi Toge':'Shard Array',
  Cobalt:'Aegis Shield',Cyan:'Vector Greaves',Onyx:'Reaper Scythe',Gold:'Orbit Core',Vermilion:'Greatblade',Umber:'Gravity Maul',Graphite:'Flux Staff',Daichi:'Impact Hammer',
  Silver:'Pulse Flail',Indigo:'Chainwhip',Purple:'Phase Katana',Pink:'Tether Gauntlets',Red:'Orbit Core',Crimson:'Greatblade',Black:'Resonance Spear',Yellow:'Vector Greaves',Maroon:'Resonance Cannons',Magenta:'Chainwhip',Blue:'Triad Trident',Green:'Shard Array',White:'Aegis Shield',Grey:'Aegis Shield',Lavender:'Vector Rings',Orange:'Vector Rings',Turquoise:'Bastion Set',Olive:'Gravity Maul',Copper:'Impact Hammer',Pearl:'Orbit Core',Scarlet:'Shard Array',Amber:'Twin Blasters',Emerald:'Phase Katana',
  Life:'Orbit Core',Mercy:'Aegis Shield',Death:'Reaper Scythe',
  Controller:'Flux Staff',Evil:'Reaper Scythe',Magneto:'Resonance Cannons',Willow:'Chainwhip',Cable:'Resonance Spear',Snodvor:'Gravity Maul',Kirsten:'Greatblade',Volt:'Impact Hammer',Corpent:'Impact Hammer',Nightmare:'Orbit Core',Whami:'Orbit Core',Hazel:'Chainwhip',
};
export function getConstructForCharacter(char) {
  const name = char?.name || char?.id || char?.baseCharId || '';
  const explicit = ASSIGNMENTS[name] || ASSIGNMENTS[char?.id] || ASSIGNMENTS[char?.baseCharId];
  if (explicit) return explicit;
  // Deterministic fallback gives every roster/custom fighter a permanent assignment
  // without relying on a random weapon roll at orb activation time.
  let hash = 2166136261;
  for (const ch of String(char?.id || char?.name || 'fighter')) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  const names = Object.keys(CONSTRUCTS);
  return names[(hash >>> 0) % names.length];
}
export function getConstructAssignments() { return { ...ASSIGNMENTS }; }

function variation(seed, key) {
  let h = 0; const s = `${seed}|${key}`;
  for (let i=0;i<s.length;i++) h = (h*31+s.charCodeAt(i))|0;
  return ((Math.abs(h)%9)-4)*.012;
}

const RANGED_FAMILIES = new Set(['bow','cannons','blasters','disc','projector','shards','rings','core']);
const GRAB_FAMILIES = new Set(['whip','flail','tether','scythe']);
const DASH_FAMILIES = new Set(['greaves','claws','tonfas','dual','rapier','spear','trident']);
const HEAVY_FAMILIES = new Set(['hammer','maul','greatblade','axe','scythe']);

// Each move slot has an authored action class; weapon families can override the
// default so a bow fires, gauntlets rush, a tether grabs, and heavy weapons slam.
export function getResonanceAttackAction(family, label, sigType = '') {
  const slot = String(label || sigType || '').toLowerCase();
  if (slot.includes('light') || slot.includes('aerial')) return 'jab';
  if (slot.includes('rising') || slot.includes('up heavy') || slot === 'recovery' || sigType === 'up' || sigType === 'upHeavy' || sigType === 'aerial') {
    return RANGED_FAMILIES.has(family) ? 'projectileUp' : 'rise';
  }
  if (slot.includes('ground') || slot.includes('down heavy') || sigType === 'down' || sigType === 'downHeavy') {
    if (GRAB_FAMILIES.has(family) || family === 'shield' || family === 'bastion') return 'grab';
    return 'slam';
  }
  if (slot.includes('heavy') || sigType === 'heavy') {
    if (RANGED_FAMILIES.has(family)) return 'projectile';
    if (GRAB_FAMILIES.has(family)) return 'grab';
    if (HEAVY_FAMILIES.has(family)) return 'slam';
    if (DASH_FAMILIES.has(family)) return 'dashThrust';
    return 'heavySlash';
  }
  if (slot.includes('burst') || sigType === 'power') return RANGED_FAMILIES.has(family) ? 'projectile' : (GRAB_FAMILIES.has(family) ? 'grab' : 'burst');
  if (RANGED_FAMILIES.has(family)) return 'projectile';
  if (GRAB_FAMILIES.has(family)) return 'grab';
  if (DASH_FAMILIES.has(family)) return 'dashThrust';
  return 'slash';
}

function radiusSafe(v) { return Math.max(32, Math.min(120, Number(v)||60)); }
function clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }
function capsule(x1,y1,x2,y2,r) { return { shape:'capsule', x1,y1,x2,y2,r }; }
function box(x,y,w,h) { return { shape:'box',x,y,w,h }; }
function circle(x,y,r) { return { shape:'circle',x,y,r }; }
function arcStrip(cx,cy,r,thickness,start,end,steps=8) {
  const pts=[];
  for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}
  for(let i=steps;i>=0;i--){const a=start+(end-start)*i/steps;pts.push([cx+Math.cos(a)*(r-thickness),cy+Math.sin(a)*(r-thickness)]);}
  return {shape:'polygon',points:pts};
}

// Per-weapon authored pose curves. t is normalized attack time; each move has
// its own wind-up, strike, and follow-through instead of inheriting one generic arc.
function authoredWeaponMotion(family, slot, t, facing, baseAngle) {
  const active = t >= 0;
  if (!active) return null;
  const smooth = (a,b,x) => { const u=Math.max(0,Math.min(1,(x-a)/(b-a))); return u*u*(3-2*u); };
  const phase = (a,b,x) => smooth(a,b,x);
  let angle=baseAngle, x=0, y=0;
  const s=String(slot||'').toLowerCase();
  if (family==='blade') {
    if(s==='sideheavy') { angle += t<.24?-.45*phase(0,.24,t):t<.43?1.28-1.8*phase(.24,.43,t):t<.68?-.5+1.7*phase(.43,.68,t):.8*(1-phase(.68,1,t)); }
    else if(s==='upheavy') { angle += -.15-1.35*phase(.18,.48,t); y=-4*phase(.2,.48,t); }
    else if(s==='downheavy') { angle += .25+1.15*phase(.18,.5,t); y=4*phase(.2,.5,t); }
    else if(s==='sidesignature') { x=-8*phase(0,.22,t)+3*phase(.3,.5,t); angle += -.6+1.6*phase(.25,.54,t); }
    else if(s==='upsignature') { angle += Math.sin(t*10*Math.PI)*.9*phase(.18,.68,t); y=-10*phase(.05,.28,t)+10*phase(.68,1,t); }
    else if(s==='downsignature') { angle += .9*(1-phase(.15,.38,t)); }
    else if(s==='recovery') { angle += -.2-1.3*phase(.16,.44,t); y=-12*phase(.08,.44,t); }
  } else if (family==='dual') {
    if(s==='sideheavy') angle += t<.28?-.25-1.0*phase(0,.28,t):.65-1.35*phase(.28,.65,t);
    else if(s==='upheavy') { angle += -.25-1.0*phase(.18,.4,t); y=-3*phase(.2,.66,t); }
    else if(s==='downheavy') { angle += .45+Math.sin(t*2*Math.PI)*.55; y=4; }
    else if(s==='sidesignature') { x=18*phase(.12,.5,t)-7*phase(.6,.86,t); angle += -.5+Math.sin(t*6*Math.PI)*.65; }
    else if(s==='upsignature') { x=facing*5*phase(0,.3,t); y=-15*phase(.1,.5,t)+7*phase(.55,1,t); angle += Math.sin(t*5*Math.PI)*.85; }
    else if(s==='downsignature') { x=-9*phase(0,.28,t)+13*phase(.35,.58,t); angle += .6; }
    else if(s==='recovery') { y=-13*phase(.08,.52,t); angle += -.9+Math.sin(t*4*Math.PI)*.45; }
  } else if (family==='katana') {
    if(s==='sideheavy') angle += t<.46?-.05:1.35*phase(.46,.55,t)-.15*phase(.55,.72,t);
    else if(s==='upheavy') angle += .5-1.65*phase(.22,.54,t);
    else if(s==='downheavy') angle += -.65+1.75*phase(.28,.6,t);
    else if(s==='sidesignature') { x=8*phase(.2,.4,t); angle += t<.43?-.15:1.2*phase(.43,.56,t); }
    else if(s==='upsignature') { y=-6*phase(.15,.5,t); angle += -.2-1.2*phase(.38,.57,t); }
    else if(s==='downsignature') angle += -.05; // compact stillness/counter stance
    else if(s==='recovery') { y=-13*phase(.12,.46,t); angle += -.2-1.5*phase(.24,.48,t); }
  } else if (family==='rapier') {
    const thrust=['sideheavy','downheavy','sidesignature','downsignature'].includes(s);
    if(thrust) { x= (s==='sidesignature'?22: s==='downsignature'?3:14)*phase(.18,.43,t)-5*phase(.5,.8,t); angle += s==='downheavy'?.28:s==='downsignature'?.15:-.05; }
    else if(s==='upheavy') { angle += -.1-1.15*phase(.16,.7,t); y=-4*phase(.1,.7,t); }
    else if(s==='upsignature') { y=-9*phase(.05,.38,t); angle += -.5-0.55*phase(.35,.6,t); }
    else if(s==='recovery') { y=-14*phase(.1,.48,t); angle += -.15-1.0*phase(.22,.48,t); }
  } else if (family==='crescent') {
    if(s==='sideheavy') angle += t<.4?-.65+1.25*phase(.12,.38,t):.6-1.3*phase(.4,.66,t);
    else if(s==='upheavy') { angle += Math.sin(t*2*Math.PI)*.95; y=-5*phase(.15,.42,t); }
    else if(s==='downheavy') { angle += .8+Math.sin(t*2*Math.PI)*.65; y=5; }
    else if(s==='sidesignature') angle += -.45+1.4*phase(.35,.62,t);
    else if(s==='upsignature'||s==='recovery') { angle += Math.sin(t*3*Math.PI)*1.1; y=-10*phase(.12,.4,t)+7*phase(.65,.95,t); }
    else if(s==='downsignature') angle += .15+Math.sin(t*Math.PI)*.2;
  } else if (family==='greatblade') {
    if(s==='sideheavy') angle += t<.42?-.85*phase(0,.42,t):1.65*phase(.42,.62,t);
    else if(s==='upheavy') { angle += .65-1.75*phase(.25,.58,t); y=-3*phase(.2,.58,t); }
    else if(s==='downheavy') { angle += -.85+1.8*phase(.25,.58,t); y=7*phase(.3,.6,t); }
    else if(s==='sidesignature') { x=13*phase(.15,.48,t); angle += -.6+1.5*phase(.42,.66,t); }
    else if(s==='upsignature') { y=-12*phase(.08,.42,t)+6*phase(.65,.95,t); angle += -.6+2.1*phase(.42,.66,t); }
    else if(s==='downsignature') angle += .55;
    else if(s==='recovery') { y=-15*phase(.08,.46,t); angle += .5-1.9*phase(.22,.5,t); }
  } else if (family==='scythe') {
    if(s==='sideheavy') angle += t<.36?-.85*phase(0,.36,t):1.75*phase(.36,.6,t);
    else if(s==='upheavy') angle += .8-1.65*phase(.2,.52,t);
    else if(s==='downheavy') { angle += .8+1.0*phase(.15,.42,t); y=5; }
    else if(s==='sidesignature') { x=12*phase(.12,.36,t)-8*phase(.52,.7,t); angle += -.7+1.4*phase(.38,.58,t); }
    else if(s==='upsignature'||s==='recovery') { y=-13*phase(.08,.48,t); angle += Math.sin(t*2*Math.PI)*1.25; }
    else if(s==='downsignature') { x=-10*phase(.05,.3,t); angle += -1.1*phase(.12,.38,t)+.8*phase(.4,.6,t); }
  } else if (family==='claws') {
    if(s==='sideheavy') angle += Math.sin(t*3*Math.PI)*.6;
    else if(s==='upheavy') { angle += -.15-1.1*phase(.2,.6,t); y=-4*phase(.2,.6,t); }
    else if(s==='downheavy') { x=9*phase(.18,.48,t); y=4*phase(.35,.6,t); angle += .7; }
    else if(s==='sidesignature') { x=22*phase(.18,.5,t); angle += -.35+Math.sin(t*2*Math.PI)*.35; }
    else if(s==='upsignature') { angle += -.25; y=-4*phase(.2,.45,t); }
    else if(s==='downsignature') { x=-8*phase(0,.25,t); angle += .1; }
    else if(s==='recovery') { y=-12*phase(.08,.65,t); angle += -.45-Math.sin(t*3*Math.PI)*.35; }
  } else if (family==='tonfas') {
    if(s==='sideheavy'||s==='sidesignature') angle += Math.sin(t*8*Math.PI)*.35;
    else if(s==='upheavy') { angle += -.15-1.0*phase(.2,.65,t); y=-3*phase(.2,.65,t); }
    else if(s==='downheavy') { angle += .55+Math.sin(t*2*Math.PI)*.45; y=4; }
    else if(s==='upsignature') { angle += Math.sin(t*4*Math.PI)*.75; y=-11*phase(.08,.45,t); }
    else if(s==='downsignature') angle += .15;
    else if(s==='recovery') { angle += .1; y=-7*phase(.15,.45,t); }
  }
  return {angle, x, y};
}

// Shared source of truth for combat collision AND Settings -> Hitboxes. The
// shapes follow the specific animated weapon/action, not a generic range box.
function constructWeaponPose(fighter) {
  const a=fighter?.attackData;
  const name=fighter?.resonanceConstruct;
  const spec=CONSTRUCTS[name]||CONSTRUCTS['Resonance Blade'];
  const facing=Number(fighter?.facing)||1;
  const frame=Number(fighter?.frame)||0;
  const active=(fighter?.state==='attacking'||fighter?.state==='superAttack')&&!!a;
  const holding=fighter?.state==='attackHold'||!!a?.holding;
  const progress=active?clamp01(a.progress):0;
  const variationSeed=fighter?.resonanceOriginalChar?.id||fighter?.char?.id||name||'fighter';
  const v=variation(variationSeed,'pose');
  const bob=Math.sin(frame*.13+v*20)*1.2;
  const action=a?.resonanceAction||getResonanceAttackAction(spec.family,a?.resonanceMove,a?.sigType);
  const slot=String(a?.resonanceMoveSlot||'').toLowerCase();
  const move=slot || String(a?.resonanceMove||a?.sigType||'side').toLowerCase();
  const t=progress;
  const familyMotion=({hammer:1.05,maul:1.18,greatblade:1.22,scythe:1.45,whip:1.65,flail:1.6,spear:.62,trident:.72,halberd:1.12,rapier:.48,katana:1.24,staff:1.58,rings:1.9,core:1.82,shards:1.38,bow:.34,projector:.26,greaves:.9,claws:1.28,shield:.92,axe:1.2})[spec.family]??1.02;
  const characterPhase=variation(variationSeed,'attack-phase')*4;
  let angle=-.38+bob*.012, offsetX=0, offsetY=0;
  if(holding){angle+=(move.includes('up')?-.5:move.includes('down')?.78:-.82);offsetX-=facing*5;offsetY-=3;}
  else if(active){
    if(action==='projectile'||action==='projectileUp'){
      angle=action==='projectileUp'?-.14+Math.sin(t*Math.PI)*.12:1.40+(1-t)*.2;
      offsetX=facing*(t>.2?Math.min(18,(t-.2)*24):-4);
      offsetY=action==='projectileUp'?-Math.sin(t*Math.PI)*11:Math.sin(t*Math.PI*2)*2;
    } else if(action==='rise'){
      angle=-.12+Math.sin(t*Math.PI*1.25)*.52+characterPhase*.08;
      offsetY=-Math.sin(t*Math.PI)*14;offsetX=facing*Math.sin(t*Math.PI)*4;
    } else if(action==='slam'){
      angle=.15+Math.sin(t*Math.PI)*1.95+(t>.68?-.65*(t-.68)/.32:0);offsetY=Math.sin(t*Math.PI)*8;
    } else if(action==='grab'){
      angle=-1.05+Math.sin(t*Math.PI*1.35)*familyMotion+characterPhase*.12;offsetX=facing*Math.sin(t*Math.PI)*8;
    } else if(action==='dashThrust'||action==='jab'){
      const wind=Math.min(1,t/.28), strike=t>=.28&&t<=.68?Math.sin(((t-.28)/.4)*Math.PI):0;
      angle=1.35+(1-wind)*.18-strike*.12+(t>.68?-.35*(t-.68)/.32:0);
      offsetX=facing*((t<.28?-7*(1-wind):6+strike*9)-(t>.68?8*(t-.68)/.32:0));
    } else if(move.includes('up')||move==='recovery'){
      angle=-.12+Math.sin(t*Math.PI)*familyMotion*.68;offsetY=-Math.sin(t*Math.PI)*10;
    } else if(move.includes('down')){
      angle=.18+Math.sin(t*Math.PI)*familyMotion*1.55;offsetY=Math.sin(t*Math.PI)*7;
    } else {
      const sweep=-1.05+t*2.15;angle=sweep*Math.min(1,familyMotion)+Math.sin(t*Math.PI)*.22+characterPhase*.08;
      offsetX=facing*Math.sin(t*Math.PI)*7;offsetY=Math.sin(t*Math.PI*2)*4;
    }
    if(t>.68){angle*=.76;offsetX*=.45;offsetY*=.45;}
  }
  if(active) { const authored=authoredWeaponMotion(spec.family, slot, t, facing, angle); if(authored){angle=authored.angle;offsetX+=authored.x;offsetY+=authored.y;} }
  const scale=2;
  const fx=Number(fighter?.x)||0, fy=Number(fighter?.y)||0;
  // Each weapon family has its own attachment point/orientation. Feet weapons
  // sit on the boots, arm gear sits at the fists, shields stay in front, and
  // orbiting constructs float beside the fighter instead of pretending to be held.
  const mount=({
    greaves:[0,7,-.08], claws:[facing*7,-20,-.18], tonfas:[facing*8,-20,-.18],
    tether:[facing*8,-20,-.14], blasters:[facing*9,-20,-.12], cannons:[facing*10,-20,-.08],
    shield:[facing*11,-23,-.12], bastion:[facing*10,-20,-.1],
    bow:[facing*8,-23,-.62], rapier:[facing*8,-23,-.25], spear:[facing*8,-23,-.18],
    trident:[facing*8,-23,-.16], halberd:[facing*8,-23,-.35], staff:[facing*7,-22,-.08],
    whip:[facing*7,-22,-.24], flail:[facing*7,-22,-.15], rings:[facing*19,-28,0],
    core:[facing*21,-28,0], shards:[facing*17,-26,0], disc:[facing*9,-21,-.18],
    projector:[facing*5,-35,-.08], maul:[facing*8,-22,-.2], hammer:[facing*8,-22,-.2],
  })[spec.family] || [facing*(10+v*8),-23,-.38];
  if(spec.family==='blade') { mount[0]=facing*13; mount[1]=-24; mount[2]=-.62; }
  const mountedAngle=mount[2];
  return {facing,angle:angle+mountedAngle,x:fx+mount[0]+offsetX,y:fy+mount[1]+bob+offsetY,scale,spec,action,slot,progress,active,holding};
}
function transformWeaponPoint(pose, lx, ly) {
  const c=Math.cos(pose.angle),s=Math.sin(pose.angle);
  const k=pose.scale||1;
  return [pose.x+pose.facing*(lx*c-ly*s)*k,pose.y+(lx*s+ly*c)*k];
}
function localCapsule(pose, a, b, r) {
  const p1=transformWeaponPoint(pose,a[0],a[1]),p2=transformWeaponPoint(pose,b[0],b[1]);
  return {shape:'capsule',x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],r:r*(pose.scale||1)};
}
function localCircle(pose, p, r) { const q=transformWeaponPoint(pose,p[0],p[1]);return {shape:'circle',x:q[0],y:q[1],r:r*(pose.scale||1)}; }

// Collision follows the same pose and local weapon silhouette as drawConstructWeapon.
// This deliberately avoids the old oversized, fighter-centered generic attack boxes.
export function getResonanceConstructHitboxes(fighter) {
  const a=fighter?.attackData;
  if(!a?.resonanceFamily || !(fighter?.state==='attacking'||fighter?.state==='superAttack')) return [];
  const p=clamp01(a.progress), move=String(a.resonanceMoveSlot||'').toLowerCase();
  const spec=a.resonanceSpec, win=spec?.phaseWindows?.active||[.24,.72];
  // Separate hit windows for combo moves; this prevents one overlapping collider
  // from dealing repeated hits throughout the whole animation.
  const comboWindows = ({
    'crosscut':[[.28,.43],[.52,.68]], 'crossing fangs':[[.22,.37],[.48,.66]],
    'twin ascension':[[.24,.39],[.52,.69]], 'needle lift':[[.18,.31],[.37,.50],[.56,.71]],
    'pulse flurry':[[.16,.27],[.29,.40],[.42,.53],[.55,.70]], 'double pop':[[.28,.42],[.52,.69]],
    'staff combination':[[.25,.41],[.49,.68]], 'threefold thrust':[[.16,.29],[.33,.46],[.50,.69]],
    'shard volley':[[.18,.30],[.36,.48],[.54,.68]], 'rising burst':[[.16,.28],[.34,.46],[.52,.69]],
    'boxer rush':[[.18,.31],[.36,.49],[.54,.70]], 'rake combo':[[.16,.29],[.34,.47],[.52,.70]],
  })[String(a.resonanceMove||'').toLowerCase()];
  if(comboWindows && !comboWindows.some(([lo,hi])=>p>=lo&&p<=hi)) return [];
  if(!comboWindows && (p<win[0]||p>win[1])) return [];
  const pose=constructWeaponPose(fighter), fam=pose.spec.family;
  const pulse=Math.sin(Math.PI*Math.max(0,Math.min(1,(p-win[0])/(win[1]-win[0]))));
  const r=a.isHeavy?7.5:5.5;
  const cap=(a1,b1,rad=r)=>localCapsule(pose,a1,b1,rad);
  const circ=(pt,rad=r)=>localCircle(pose,pt,rad);
  const geometry=String(a.resonanceGeometry||spec?.geometry||'').toLowerCase();
  // Resonance Blade: seven individually authored attack paths and short active windows.
  // Coordinates describe the sword edge/tip/handle in weapon-local space; transforms mirror for left-facing attacks.
  if(fam==='blade') {
    const name=String(a.resonanceMove||'').toLowerCase();
    const slotName=String(a.resonanceMoveSlot||'').toLowerCase();
    const sideHeavy=name.includes('crosscut') || (slotName.includes('side') && a.isHeavy);
    const upHeavy=name.includes('rising edge') || (slotName.includes('up') && a.isHeavy);
    const downHeavy=name.includes('groundbreaker') || (slotName.includes('down') && a.isHeavy);
    const sideSig=name.includes('resonant lunge') || (slotName.includes('side') && !a.isHeavy && !slotName.includes('recovery'));
    const upSig=name.includes('sky splitter') || (slotName.includes('up') && !a.isHeavy);
    const downSig=name.includes('echo counter') || (slotName.includes('down') && !a.isHeavy);
    const recovery=slotName.includes('recovery') || name.includes('ascending cut');
    if(sideHeavy) {
      if(p>=.22&&p<=.34) return [cap([8,-15],[37,-20],r*.62),cap([18,-10],[40,-18],r*.52)]; // downswing edge + smear
      if(p>=.47&&p<=.61) return [cap([8,-25],[39,-9],r*.64),cap([17,-29],[41,-13],r*.5)]; // upswing finisher
      return [];
    }
    if(upHeavy) { if(p<.34||p>.48)return []; return [cap([14,-29],[17,-55],r*.48),circ([17,-55],r*.38)]; }
    if(downHeavy) { if(p<.34||p>.49)return []; return [cap([15,-7],[43,-3],r*.45),circ([43,-3],r*.4)]; }
    if(sideSig) { if(p<.44||p>.54)return []; return [cap([12,-26],[42,-7],r*.7),cap([17,-28],[44,-10],r*.55)]; }
    if(upSig) {
      if(!((p>=.23&&p<=.29)||(p>=.34&&p<=.40)||(p>=.45&&p<=.51)||(p>=.56&&p<=.62))) return [];
      const phase=Math.floor((p-.23)/.11)%2;
      return phase===0?[cap([10,-18],[38,-37],r*.55)]:[cap([13,-37],[35,-15],r*.55)];
    }
    if(downSig) { if(p<.42||p>.51)return []; return [cap([2,-4],[15,-3],r*.34),circ([3,-4],r*.36)]; } // handle pommel jab only
    if(recovery) { if(p<.28||p>.43)return []; return [cap([12,-22],[19,-53],r*.6),cap([17,-42],[24,-58],r*.45)]; }
  }
  // Weapon-specific authored paths for the remaining first nine weapon categories.
  // Each branch uses the actual contact part and distinct active windows; local
  // coordinates are mirrored by transformWeaponPoint for left-facing fighters.
  const slotName=move;
  const isHeavy=!!a.isHeavy;
  const inWindows=(windows)=>windows.some(([lo,hi])=>p>=lo&&p<=hi);
  const grabBox=(x,y,w,h,throwWindow=[.56,.78])=>({shape:'box',x:pose.x+pose.facing*x-w/2,y:pose.y+y-h/2,w,h,kind:'grab',throwWindow});
  if(fam==='dual') { // Twin Fangs: short hooked dagger edges, never a sword-length box.
    if(slotName==='sideheavy') { if(!inWindows([[.22,.34],[.49,.63]]))return []; return [cap([8,-13],[24,-2],r*.43),cap([8,-2],[24,-14],r*.43)]; }
    if(slotName==='upheavy') { if(!inWindows([[.24,.36],[.52,.67]]))return []; return [cap([7,-8],[14,-31],r*.42),cap([15,-8],[20,-38],r*.45)]; }
    if(slotName==='downheavy') { if(p<.32||p>.49)return []; return [cap([-21,5],[-5,2],r*.48),cap([5,2],[21,5],r*.48)]; }
    if(slotName==='sidesignature') { if(!inWindows([[.25,.34],[.39,.48],[.53,.64]]))return []; return [cap([8,-14],[29,-4],r*.48),cap([8,-3],[28,-15],r*.44)]; }
    if(slotName==='upsignature') { if(!inWindows([[.27,.38],[.43,.55]]))return []; return [cap([5,-9],[21,-27],r*.5),cap([20,-27],[28,-10],r*.45)]; }
    if(slotName==='downsignature') { if(p<.49||p>.63)return []; return [cap([8,-10],[30,-8],r*.48),cap([8,0],[30,-3],r*.48)]; }
    if(slotName==='recovery') { if(!inWindows([[.25,.37],[.48,.61]]))return []; return [cap([7,-10],[16,-35],r*.46),cap([15,-14],[22,-39],r*.46)]; }
  }
  if(fam==='katana') { // Phase Katana: long, narrow edge; delayed draw and phase timing.
    if(slotName==='sideheavy') { if(p<.48||p>.57)return []; return [cap([8,-12],[48,-13],r*.52),cap([16,-18],[48,-15],r*.38)]; }
    if(slotName==='upheavy') { if(p<.34||p>.51)return []; return [cap([10,-13],[31,-52],r*.5),cap([23,-35],[37,-49],r*.38)]; }
    if(slotName==='downheavy') { if(p<.48||p>.62)return []; return [cap([10,-2],[27,24],r*.48),cap([17,14],[30,30],r*.38)]; }
    if(slotName==='sidesignature') { if(p<.44||p>.56)return []; return [cap([10,-13],[49,-12],r*.52),cap([18,-18],[48,-14],r*.38)]; }
    if(slotName==='upsignature') { if(p<.39||p>.56)return []; return [cap([13,-8],[24,-47],r*.45),cap([17,-32],[27,-51],r*.38)]; }
    if(slotName==='downsignature') { return []; } // counter stance has no passive damage; successful trigger is resolved in checkHit
    if(slotName==='recovery') { if(p<.29||p>.46)return []; return [cap([13,-13],[25,-55],r*.53),cap([18,-37],[29,-57],r*.4)]; }
  }
  if(fam==='rapier') { // Resonance Rapier: point-only thrust hitboxes.
    if(slotName==='sideheavy') { if(p<.25||p>.44)return []; return [cap([10,-5],[43,-7],r*.32),circ([43,-7],r*.28)]; }
    if(slotName==='upheavy') { if(!inWindows([[.18,.29],[.36,.47],[.55,.68]]))return []; return [cap([12,-8],[18,-35],r*.3),circ([18,-35],r*.27)]; }
    if(slotName==='downheavy') { if(p<.32||p>.47)return []; return [cap([9,1],[39,5],r*.3),circ([39,5],r*.27)]; }
    if(slotName==='sidesignature') { if(p<.48||p>.62)return []; return [cap([9,-5],[49,-7],r*.36),circ([49,-7],r*.3)]; }
    if(slotName==='upsignature') { if(p<.43||p>.60)return []; return [cap([12,-14],[39,1],r*.34),circ([39,1],r*.29)]; }
    if(slotName==='downsignature') { if(p<.35||p>.53)return []; return [grabBox(20,-7,30,24,[.53,.72])]; }
    if(slotName==='recovery') { if(p<.25||p>.43)return []; return [cap([12,-10],[19,-45],r*.32),circ([19,-45],r*.28)]; }
  }
  if(fam==='crescent') { // Crescent Blades: paired curved edges, both sides on sweeps.
    if(slotName==='sideheavy') { if(!inWindows([[.24,.37],[.48,.62]]))return []; return [cap([7,-14],[29,-3],r*.48),cap([-7,-3],[-27,-14],r*.48)]; }
    if(slotName==='upheavy') { if(p<.28||p>.58)return []; return [cap([-20,-25],[0,-42],r*.43),cap([0,-42],[20,-25],r*.43),cap([-19,-27],[19,-27],r*.36)]; }
    if(slotName==='downheavy') { if(p<.31||p>.49)return []; return [cap([-27,5],[-7,9],r*.48),cap([7,9],[27,5],r*.48)]; }
    if(slotName==='sidesignature') { if(p<.38||p>.63)return []; return [cap([9,-13],[36,-27],r*.48),cap([5,-3],[21,-13],r*.4)]; }
    if(slotName==='upsignature') { if(!inWindows([[.28,.39],[.43,.54],[.57,.67]]))return []; return [cap([-16,-8],[1,-32],r*.44),cap([1,-32],[17,-8],r*.44)]; }
    if(slotName==='downsignature') { if(p<.36||p>.64)return []; return [circ([pose.facing*16,-7],r*.82),cap([pose.facing*7,-18],[pose.facing*28,-3],r*.42)]; }
    if(slotName==='recovery') { if(!inWindows([[.23,.34],[.39,.50],[.54,.66]]))return []; return [cap([-17,-8],[-3,-31],r*.44),cap([3,-31],[18,-8],r*.44)]; }
  }
  if(fam==='greatblade') { // Greatblade: broad steel edge, slower committed arcs.
    if(slotName==='sideheavy') { if(p<.43||p>.62)return []; return [cap([5,-13],[42,-25],r*.82),cap([18,-22],[43,-26],r*.65)]; }
    if(slotName==='upheavy') { if(p<.37||p>.56)return []; return [cap([8,-16],[26,-53],r*.78),cap([19,-39],[32,-55],r*.62)]; }
    if(slotName==='downheavy') { if(p<.38||p>.56)return []; return [cap([-29,6],[29,6],r*.78),cap([10,-2],[26,9],r*.58)]; }
    if(slotName==='sidesignature') { if(p<.46||p>.64)return []; return [cap([8,-13],[43,-21],r*.82),cap([10,-17],[36,-31],r*.68)]; }
    if(slotName==='upsignature') { if(p<.47||p>.64)return []; return [cap([-16,-48],[23,-13],r*.78),cap([-14,-43],[26,-10],r*.62)]; }
    if(slotName==='downsignature') { if(p<.34||p>.49)return []; return [grabBox(15,-7,28,28,[.49,.68])]; }
    if(slotName==='recovery') { if(p<.28||p>.47)return []; return [cap([8,-12],[24,-52],r*.78),cap([17,-39],[30,-56],r*.62)]; }
  }
  if(fam==='scythe') { // Reaper Scythe: hooked outer blade; pulls use dedicated grab contact.
    if(slotName==='sideheavy') { if(p<.37||p>.58)return []; return [cap([12,-34],[39,-17],r*.72),cap([30,-22],[43,-34],r*.58)]; }
    if(slotName==='upheavy') { if(p<.34||p>.51)return []; return [cap([13,-15],[32,-44],r*.64),cap([26,-35],[38,-43],r*.52)]; }
    if(slotName==='downheavy') { if(p<.32||p>.47)return []; return [cap([-27,7],[27,7],r*.62),cap([pose.facing*15,2],[pose.facing*29,7],r*.5)]; }
    if(slotName==='sidesignature') { if(p<.42||p>.56)return []; return [grabBox(26,-14,38,28,[.56,.72]),cap([18,-27],[42,-12],r*.62)]; }
    if(slotName==='upsignature') { if(!inWindows([[.27,.38],[.44,.57]]))return []; return [cap([-25,-21],[3,-39],r*.62),cap([3,-39],[28,-18],r*.62)]; }
    if(slotName==='downsignature') { if(p<.35||p>.61)return []; return [cap([-35,-18],[-8,1],r*.62),grabBox(-14,-9,26,24,[.61,.76])]; }
    if(slotName==='recovery') { if(p<.27||p>.47)return []; return [cap([-25,-16],[0,-42],r*.62),cap([0,-42],[24,-15],r*.62)]; }
  }
  if(fam==='claws') { // Rift Claws: short talon tips, not full-arm boxes.
    if(slotName==='sideheavy') { if(!inWindows([[.17,.27],[.32,.42],[.48,.61]]))return []; return [cap([7,-13],[25,-7],r*.4),cap([9,-5],[25,1],r*.4)]; }
    if(slotName==='upheavy') { if(!inWindows([[.27,.39],[.46,.60]]))return []; return [cap([5,-7],[13,-31],r*.42),cap([14,-7],[22,-34],r*.42)]; }
    if(slotName==='downheavy') { if(p<.43||p>.58)return []; return [cap([9,-4],[29,14],r*.46),cap([17,2],[34,17],r*.42)]; }
    if(slotName==='sidesignature') { if(p<.35||p>.54)return []; return [cap([8,-13],[34,-5],r*.46),cap([9,-3],[33,4],r*.46)]; }
    if(slotName==='upsignature') { if(p<.42||p>.58)return []; return [grabBox(15,-37,32,28,[.58,.74])]; }
    if(slotName==='downsignature') { return []; } // defensive phase-counter trigger, not a passive grab hitbox
    if(slotName==='recovery') { if(!inWindows([[.23,.34],[.39,.50],[.55,.67]]))return []; return [cap([6,-9],[13,-32],r*.42),cap([14,-11],[22,-36],r*.42)]; }
  }
  if(fam==='tonfas') { // Pulse Tonfas: compact baton impact caps, multi-hit windows.
    if(slotName==='sideheavy') { if(!inWindows([[.16,.26],[.29,.39],[.42,.52],[.55,.67]]))return []; return [cap([7,-12],[24,-7],r*.42),circ([24,-7],r*.34)]; }
    if(slotName==='upheavy') { if(!inWindows([[.28,.40],[.52,.66]]))return []; return [cap([7,-8],[13,-30],r*.4),cap([15,-8],[21,-33],r*.4)]; }
    if(slotName==='downheavy') { if(p<.29||p>.48)return []; return [cap([-21,3],[21,3],r*.48),cap([-15,7],[15,7],r*.4)]; }
    if(slotName==='sidesignature') { if(!inWindows([[.2,.29],[.34,.43],[.48,.57],[.60,.69]]))return []; return [cap([7,-12],[28,-7],r*.44),cap([9,-2],[27,-11],r*.4)]; }
    if(slotName==='upsignature') { if(p<.33||p>.58)return []; return [cap([-20,-27],[0,-42],r*.46),cap([0,-42],[20,-27],r*.46),circ([0,-39],r*.48)]; }
    if(slotName==='downsignature') { return []; } // counter stance; the successful trigger supplies the throw
    if(slotName==='recovery') { if(p<.28||p>.44)return []; return [circ([0,9],r*.72),cap([-13,4],[13,4],r*.46)]; }
  }
  // Geometry tags authored per move control timing and collider form. These
  // branches intentionally run before family fallbacks so traps, counters,
  // rifts, spins and broad sweeps are not treated as ordinary sword slashes.
  if(geometry==='phase') {
    // Phase attacks become hittable only after the displacement/afterimage.
    if(p<.43 || p>.68) return [];
    return [cap([9,-8],[31,-26],r*.78),circ([29,-24],r*.72)];
  }
  if(geometry==='control') {
    if(p<.34 || p>.76) return [];
    if(move.includes('down')) return [circ([pose.facing*19,7],r*1.15),cap([pose.facing*7,8],[pose.facing*32,8],r*.75)];
    return [circ([pose.facing*22,-8],r*1.05),cap([pose.facing*10,-7],[pose.facing*31,-8],r*.72)];
  }
  if(geometry==='spin') {
    const rad=fam==='staff'||fam==='halberd'||fam==='flail'?27:22;
    return [cap([-rad,-10],[rad,-10],r*.7),cap([0,-rad],[0,rad],r*.7),circ([0,-rad],r*.75),circ([0,rad],r*.75)];
  }
  if(geometry==='sweep') {
    if(move.includes('down')||move.includes('ground')) return [cap([-25,8],[25,8],r*.85),cap([-18,3],[18,3],r*.7)];
    return [cap([7,-30],[30,-15],r),cap([9,-10],[29,3],r*.78)];
  }
  if(geometry==='burst') {
    if(p<.36 || p>.69) return [];
    return [circ([pose.facing*20,-12],r*1.05),circ([pose.facing*29,-17],r*.72)];
  }
  if(geometry==='dash') {
    // Dash thrusts extend in front of the weapon; the mirrored local-space
    // transform handles facing-left attacks without separate hard-coded boxes.
    return [cap([9,-8],[34,-8],r*.72),circ([33,-8],r*.72)];
  }
  if(geometry==='rise') {
    return [cap([8,2],[20,-34],r*.76),cap([15,-24],[27,-43],r*.65)];
  }
  if(geometry==='slam') {
    if(p<.32) return [];
    return [cap([-26,7],[26,7],r*.8),circ([pose.facing*21,6],r*.85)];
  }
  if(geometry==='grab') {
    if(p<.28 || p>.56) return [];
    return [{shape:'box',x:pose.x+pose.facing*10-10,y:pose.y-17,w:20,h:27,kind:'grab',throwWindow:[.56,.78]}];
  }
  if(geometry==='combo') {
    // Combo move hit windows are filtered above; each window gets a tight
    // weapon-proximal collider instead of a full-duration generic overlap.
    return [cap([7,-12],[26,-18],r*.7),circ([25,-18],r*.68)];
  }
  // Projectile hitboxes are centered on the weapon's muzzle/launch point, not
  // the whole character. Their direction mirrors with the same facing transform.
  const isProjectile=['projectile','projectileUp'].includes(pose.action) || ['projectile'].includes(a.resonanceGeometry);
  if(isProjectile) {
    const origin=transformWeaponPoint(pose,[30, -4]);
    const travel=String(a.resonanceGeometry||'').includes('up') || move.includes('up') ? -1 : pose.facing;
    return [{shape:'circle',x:origin[0]+travel*(8+p*20),y:origin[1]+(move.includes('down')?p*18:move.includes('up')?-p*18:0),r:Math.max(5,r*.85)}];
  }
  // Narrow thrusts, jabs, and spear attacks stay narrow instead of inheriting
  // the broad sweep collider used by slashing weapons.
  if(['rapier','spear','trident'].includes(fam) && (move.includes('side')||move.includes('heavy')||pose.action==='jab')) {
    const tip=fam==='rapier'?[27,-8]:[26,-17];
    const base=fam==='rapier'?[8,-3]:[5,7];
    const thrust=pulse*7;
    return [cap(base,[tip[0]+thrust,tip[1]],fam==='rapier'?r*.55:r*.62)];
  }
  if(['blade','katana','greatblade','axe','rapier'].includes(fam)) {
    if(fam==='rapier') return [cap([9,-3],[28,-9],r*.58)];
    if(fam==='greatblade') return [cap([5,-10],[21,-48],r+1),cap([14,-33],[24,-45],r*.7)];
    if(fam==='axe') return [cap([10,-29],[28,-19],r+1),circ([24,-24],r*.8)];
    return [cap([7,-10],[19,-45],r*.82)];
  }
  if(['spear','trident','halberd','staff'].includes(fam)) {
    const main=cap([8,20],[11,-43],fam==='staff'?r*.65:r*.58);
    if(fam==='trident') return [main,cap([10,-29],[1,-38],r*.5),cap([10,-29],[20,-38],r*.5)];
    if(fam==='halberd') return [main,cap([12,-29],[27,-23],r*.85)];
    if(fam==='staff' && (move.includes('down')||pose.action==='slam')) return [cap([-4,4],[27,5],r*.85)];
    return [main];
  }
  if(['hammer','maul','projector'].includes(fam)) {
    if(move.includes('down')||pose.action==='slam') return [cap([-5,4],[27,5],r+1),circ([25,5],r*.8)];
    return [cap([4,-17],[25,-11],r+1),circ([23,-12],r*.9)];
  }
  if(fam==='scythe') return [cap([9,12],[32,-29],r+1),cap([25,-23],[37,-34],r*.75)];
  if(['crescent','dual','claws'].includes(fam)) return [cap([5,-16],[17,-2],r*.8),cap([12,3],[24,16],r*.8)];
  if(fam==='bow') return [cap([7,-27],[15,22],r*.55)];
  if(['cannons','blasters'].includes(fam)) return [cap([9,-12],[23,-7],r*.8),circ([24,-8],r*.7)];
  if(fam==='disc') return [circ([28,-5],r+1)];
  if(fam==='rings'||fam==='core'||fam==='shards') {
    const rad=fam==='shards'?r*.65:r*.8;
    return [circ([20,-4],rad),circ([29,-17],rad),circ([29,10],rad)];
  }
  if(['shield','bastion'].includes(fam)) return [cap([5,-19],[20,13],r+1)];
  if(['whip','flail','tether'].includes(fam)) {
    const extension=12+Math.sin(p*Math.PI)*18;
    return [cap([8,-2],[23+extension,8],r*.78),circ([23+extension,8],r*.82)];
  }
  if(fam==='greaves') return [cap([5,4],[18,21],r+1)];
  if(fam==='tonfas') return [cap([2,-12],[9,10],r*.8),cap([12,-10],[19,10],r*.8)];
  return [cap([5,-12],[18,12],r*.8)];
}

export function makeConstructCharacter(baseChar, fighterId) {
  const constructName = getConstructForCharacter(baseChar);
  const spec = CONSTRUCTS[constructName] || CONSTRUCTS['Resonance Blade'];
  const seed = baseChar?.id || baseChar?.name || fighterId || 'fighter';
  const v = variation(seed, 'move');
  const color = baseChar?.color || '#56e7ff';
  const original = { ...baseChar };
  const make = (old, label, scale, type, rangeScale=1, moveSlot=null) => {
    const moveSpec = moveSlot ? getResonanceMoveSpec(constructName, moveSlot) : null;
    return ({
    ...(old || {}), name:`${constructName} ${label}`, type,
    color:'#62eaff', damage:(old?.damage || 14),
    knockback:(old?.knockback || 1),
    range:Math.round((old?.range || 145)*spec.reach*rangeScale),
    duration:Math.max(8,Math.round((old?.duration || 18)/spec.speed)),
    resonanceConstruct:constructName, resonanceFamily:spec.family,
    resonanceMove:moveSpec?.name || label, resonanceMoveSlot:moveSlot, resonanceSpec:moveSpec, resonanceDescription:moveSpec?.description || '', resonanceMotion:moveSpec?.motion || '', resonanceGeometry:moveSpec?.geometry || '', resonanceShape:spec.shape, accentColor:color, characterVariation:v,
    resonanceAction:moveSpec ? ({projectile:'projectile',thrust:'jab',dash:'dashThrust',rise:'rise',slam:'slam',grab:'grab',counter:'burst',control:'grab',phase:'dashThrust',spin:'burst',combo:'jab',sweep:'heavySlash',burst:'burst'}[moveSpec.geometry] || getResonanceAttackAction(spec.family, label, type)) : getResonanceAttackAction(spec.family, label, type),
  }); }; 
  const signatures = {
    side:make(baseChar?.signatures?.side,'Side Resonance',spec.power+v,'dash',1.12,'sideSignature'),
    up:make(baseChar?.signatures?.up,'Rising Resonance',spec.power+v,'launch',.95,'upSignature'),
    down:make(baseChar?.signatures?.down,'Ground Resonance',spec.power+v,'groundSlam',1.05,'downSignature'),
  };
  const heavyAttack=make(baseChar?.heavyAttack,'Heavy Resonance',spec.power+v,'dash',1.18,'sideHeavy');
  const lightSource = baseChar?.lightAttack || baseChar?.normalAttack;
  const lightAttack = { ...make(lightSource, 'Light Resonance', 1, 'dash', .78, 'sideHeavy'), resonanceMoveSlot:'light', damage: Number(lightSource?.damage ?? 9), knockback: Number(lightSource?.knockback ?? 1) };
  const powerAttack = make(baseChar?.powerAttack, 'Resonance Burst', 1, 'dash', .92, 'sideSignature');
  const upHeavy = make(baseChar?.upHeavy || baseChar?.up_heavy, 'Up Heavy Resonance', spec.power + v, 'launch', 1.08, 'upHeavy');
  const downHeavy = make(baseChar?.downHeavy || baseChar?.down_heavy, 'Down Heavy Resonance', spec.power + v, 'groundSlam', 1.12, 'downHeavy');
  const recoveryAttack = { ...make(baseChar?.recoveryAttack || baseChar?.recovery, 'Recovery Resonance', spec.power + v, 'recovery', .95, 'recovery'), type: 'recovery', isRecovery: true };
  return { ...original, signatures, heavyAttack, upHeavy, downHeavy, recoveryAttack, lightAttack, normalAttack: lightAttack, powerAttack,
    _resonanceConstruct:constructName, _resonanceOriginal:baseChar };

}
export function activateConstruct(fighter) {
  if (!fighter || fighter.resonanceActive || !fighter.char) return false;
  fighter.resonanceOriginalChar = fighter.char._resonanceOriginal || fighter.char;
  fighter.resonanceConstruct = getConstructForCharacter(fighter.resonanceOriginalChar);
  fighter.resonanceActive = true;
  fighter.char = makeConstructCharacter(fighter.resonanceOriginalChar, fighter.id);
  fighter.resonanceActivationFrames = 36;
  fighter.resonanceDeactivateFrames = 0;
  return true;
}
export function deactivateConstruct(fighter) {
  if (!fighter?.resonanceActive) return false;
  fighter.char = fighter.resonanceOriginalChar || fighter.char._resonanceOriginal || fighter.char;
  fighter.resonanceActive = false;
  fighter.resonanceConstruct = null;
  fighter.resonanceOriginalChar = null;
  fighter.resonanceDeactivateFrames = 22;
  fighter.resonanceActivationFrames = 0;
  return true;
}
export function tryActivateResonanceConstruct(match, fighter, input) {
  if (!match?.orb || !fighter || !input?.sig || fighter.resonanceActive || fighter.stocks === 0 || fighter.hp === 0 || fighter._eliminated) return false;
  const orb = match.orb;
  const targetY = Number.isFinite(orb.y) ? orb.y : 0;
  if (Math.hypot((fighter.x || 0) - orb.x, ((fighter.y || 0) - 28) - targetY) > 104) return false;
  if (!activateConstruct(fighter)) return false;
  input.sig = false;
  input._sigConsumed = true;
  match.orb = null;
  match.spawnWait = null;
  return true;
}

export function updateResonanceMatch(match, fighters, inputs, platforms, W, H, dt=1/60) {
  if (!match || !Array.isArray(fighters)) return;
  match.frame = (match.frame||0)+1;
  for (const f of fighters) {
    if (!f) continue;
    if (f.resonanceActivationFrames>0) f.resonanceActivationFrames--;
    if (f.resonanceDeactivateFrames>0) f.resonanceDeactivateFrames--;
  }
  if (!match.orb && !fighters.some(f=>f && f.stocks!==0 && f.hp!==0 && !f._eliminated && f.resonanceActive)) {
    if (match.spawnWait == null) match.spawnWait = 480 + Math.random() * 480;
    match.spawnWait--;
    if (match.spawnWait<=0) {
      // Spawn anywhere across the playable stage width, not at a selected
      // platform's midpoint. Keep a safe edge margin and choose a fresh lane
      // so repeated orbs don't keep dropping through center-stage.
      const margin=Math.max(48,Math.min(110,W*.07));
      const minX=margin, maxX=Math.max(margin+1,W-margin);
      const x=minX+Math.random()*(maxX-minX);
      const targetY=Math.max(70,Math.min(H*.65,H*(.22+Math.random()*.42)));
      match.orb={x,y:-48,targetY,age:0,pulse:0,fallSpeed:3.2};
      match.spawnWait=null;
    }
  }
  if (match.orb) {
    match.orb.age++; match.orb.pulse+=.09;
    // Move the orb down gently until it reaches a stable hover above the stage.
    const targetY=Math.max(75,Math.min(H*.65,match.orb.targetY ?? match.orb.y));
    if (match.orb.y < targetY) match.orb.y = Math.min(targetY, match.orb.y + (match.orb.fallSpeed || 3.2));
    else match.orb.y = targetY + Math.sin(match.orb.pulse)*.22;
    for (let i=0;i<fighters.length;i++) {
      if (tryActivateResonanceConstruct(match, fighters[i], inputs[i])) break;
    }
    if (match.orb && match.orb.age>1200) { match.orb=null; match.spawnWait=180; }
  }
  for (let i=0;i<fighters.length;i++) {
    const f=fighters[i], input=inputs[i];
    if (!f) continue;
    if (input && f.resonanceActive && input.superMove && (f.superMeter == null || f.superMeter >= (f.maxSuper || 100))) deactivateConstruct(f);
    // KO, BR elimination, and CTF death/respawn cannot leave a stale construct.
    if ((f.stocks===0 || f._eliminated || f.hp===0) && f.resonanceActive) deactivateConstruct(f);
  }
}
/** Steer AI fighters toward an available construct orb and activate it in range. */
export function steerBotToResonanceOrb(match, fighter, input) {
  if (!match?.orb || !fighter || !input || !(fighter.isAI || fighter.isBot || fighter._gcBot || fighter._isBot) || fighter.resonanceActive || fighter.stocks === 0 || fighter.hp === 0 || fighter._eliminated) return input;
  const dx = match.orb.x - (Number(fighter.x) || 0);
  const dy = match.orb.y - ((Number(fighter.y) || 0) - 28);
  if (Math.hypot(dx, dy) <= 92) {
    input.sig = true; input.left = false; input.right = false;
  } else {
    input.left = dx < -20; input.right = dx > 20;
    if (dy < -72 && fighter.grounded) input.jump = true;
    if (dy > 95 && !fighter.grounded) input.down = true;
  }
  return input;
}

/** Consume the super button as construct dismissal, never as a super attack. */
export function consumeConstructSuperInput(fighter, input) {
  if (!fighter?.resonanceActive || !input?.superMove) return false;
  deactivateConstruct(fighter);
  input.superMove = false;
  input._resonanceDismissConsumed = true;
  return true;
}

/** Backwards-compatible name used by Grand Circuit's hitbox overlay. */
export function getConstructAttackGeometry(fighter) {
  return getResonanceConstructHitboxes(fighter);
}

/** Draw a subtle proximity cue while a fighter is close enough to collect the orb. */
export function drawResonanceRangeGlow(ctx, fighter, orb, frame=0) {
  if (!ctx || !fighter || !orb || fighter.resonanceActive || fighter.stocks===0 || fighter.hp===0 || fighter._eliminated) return;
  const fx=Number(fighter.x), fy=Number(fighter.y)-28, ox=Number(orb.x), oy=Number(orb.y);
  if (![fx,fy,ox,oy].every(Number.isFinite) || Math.hypot(fx-ox,fy-oy)>104) return;
  ctx.save();
  const pulse=0.92+Math.sin((frame||0)*0.12)*0.08;
  const grad=ctx.createRadialGradient(fx,fy-20,5,fx,fy-20,54*pulse);
  grad.addColorStop(0,'rgba(80,205,255,0.10)');
  grad.addColorStop(0.62,'rgba(80,205,255,0.07)');
  grad.addColorStop(1,'rgba(80,205,255,0)');
  ctx.fillStyle=grad; ctx.beginPath(); ctx.ellipse(fx,fy-20,40*pulse,50*pulse,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(125,220,255,0.38)'; ctx.lineWidth=1.5; ctx.shadowColor='#5bd8ff'; ctx.shadowBlur=9;
  ctx.beginPath(); ctx.ellipse(fx,fy-20,25*pulse,34*pulse,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}
export function drawResonanceOrb(ctx, orb, frame=0) {
  if (!orb) return;
  const x=orb.x,y=orb.y,pulse=1+Math.sin(frame*.12)*.055, spin=frame*.023;
  ctx.save(); ctx.translate(x,y); ctx.scale(pulse,pulse);
  // A contained aura makes the pickup readable without pretending that the
  // entire glow is damaging. The collect range remains simulation-defined.
  const halo=ctx.createRadialGradient(0,0,5,0,0,76);
  halo.addColorStop(0,'rgba(190,255,255,.30)');halo.addColorStop(.42,'rgba(45,198,255,.16)');halo.addColorStop(1,'rgba(20,100,210,0)');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,76,0,Math.PI*2);ctx.fill();
  // Three independently rotating containment rings, behind and in front of
  // the metal shell, give this a real resonance-device silhouette.
  ctx.save();ctx.rotate(spin*.82);ctx.strokeStyle='rgba(94,230,255,.52)';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,0,33,12,.32,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.save();ctx.rotate(-spin*1.18+.8);ctx.strokeStyle='rgba(206,255,255,.82)';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,0,17,34,-.38,0,Math.PI*2);ctx.stroke();ctx.restore();
  // Dark machined shell with distinct cyan power core.
  const shell=ctx.createRadialGradient(-8,-10,2,0,0,26);
  shell.addColorStop(0,'#3a6582');shell.addColorStop(.38,'#142c46');shell.addColorStop(.76,'#071423');shell.addColorStop(1,'#02070f');
  ctx.fillStyle=shell;ctx.strokeStyle='#8ceeff';ctx.lineWidth=1.5;ctx.shadowColor='#3bdcff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;ctx.strokeStyle='rgba(178,247,255,.58)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,20,spin,spin+Math.PI*1.36);ctx.stroke();
  const core=ctx.createRadialGradient(-4,-5,1,0,0,13);
  core.addColorStop(0,'#ffffff');core.addColorStop(.25,'#c9ffff');core.addColorStop(.62,'#36e0ff');core.addColorStop(1,'#0572c4');
  ctx.fillStyle=core;ctx.shadowColor='#63edff';ctx.shadowBlur=19;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // Floating crystal tabs are decorative, each visibly attached to the orb's
  // orbit. They do not create a separate collision surface.
  for(let i=0;i<6;i++){const a=spin*1.45+i*Math.PI/3,r=32+Math.sin(frame*.09+i)*2;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r);ctx.rotate(a+Math.PI/2);ctx.fillStyle=i%2?'#1199d0':'#c9ffff';ctx.strokeStyle='#edffff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5,0);ctx.lineTo(0,10);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  ctx.save();ctx.rotate(spin*.55-.5);ctx.strokeStyle='rgba(115,239,255,.82)';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(0,0,38,17,.18,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.restore();
}
// Detailed layered weapon illustration. Every family has a distinct silhouette, bevels,
// inset energy channels and animated parts; the weapon is rendered continuously while active.
export function drawConstructWeapon(ctx, fighter, scale=1) {
  if (!fighter?.resonanceActive || !fighter.resonanceConstruct) return;
  // Keep the actual weapon visible during every attack; the renderer adds the
  // move-specific smear/impact layer over this articulated weapon pose.
  const name=fighter.resonanceConstruct, spec=CONSTRUCTS[name]||CONSTRUCTS['Resonance Blade'];
  const facing=fighter.facing||1, frame=fighter.frame||0, attack=fighter.attackData;
  const active=(fighter.state==='attacking' || fighter.state==='superAttack') && !!attack;
  const holding=fighter.state==='attackHold' || !!attack?.holding;
  const progress=active ? Math.max(0,Math.min(1,Number(attack.progress)||0)) : 0;
  const swing=Math.sin(progress*Math.PI), recovering=active && progress>.68;
  const v=variation(fighter.resonanceOriginalChar?.id||fighter.char?.id||name,'pose');
  const bob=Math.sin(frame*.13+v*20)*1.2;
  const action=attack?.resonanceAction || getResonanceAttackAction(spec.family, attack?.resonanceMove, attack?.sigType);
  const move=String(attack?.resonanceMove || attack?.sigType || (attack?.isHeavy?'heavy':'side')).toLowerCase();
  const wind=holding ? .25 : Math.min(1,progress/.28);
  const strike=active && progress>=.28 && progress<=.68 ? Math.sin(((progress-.28)/.4)*Math.PI) : 0;
  const familyMotion = ({ hammer:1.05, maul:1.18, greatblade:1.22, scythe:1.45, whip:1.65, flail:1.6, spear:.62, trident:.72, halberd:1.12, rapier:.48, katana:1.24, staff:1.58, rings:1.9, core:1.82, shards:1.38, bow:.34, projector:.26, greaves:.9, claws:1.28, shield:.92, axe:1.2 })[spec.family] ?? 1.02;
  const characterPhase = variation(fighter.resonanceOriginalChar?.id || fighter.char?.id || name, 'attack-phase') * 4;
  let angle=-.38+bob*.012;
  let offsetX=0, offsetY=0;
  if(holding) {
    angle += move.includes('up') ? -.5 : move.includes('down') ? .78 : -.82;
    offsetX -= facing*5*scale; offsetY -= 3*scale;
  } else if(active) {
    const t=progress;
    if(action==='projectile' || action==='projectileUp') {
      angle = action==='projectileUp' ? -.14 + Math.sin(t*Math.PI)*.12 : 1.40 + (1-t)*.2;
      offsetX = facing*(t>.2 ? Math.min(18,(t-.2)*24) : -4)*scale;
      offsetY = action==='projectileUp' ? -Math.sin(t*Math.PI)*11*scale : Math.sin(t*Math.PI*2)*2*scale;
    } else if(action==='rise') {
      angle = -.12 + Math.sin(t*Math.PI*1.25)*.52 + characterPhase*.08;
      offsetY = -Math.sin(t*Math.PI)*14*scale;
      offsetX = facing*Math.sin(t*Math.PI)*4*scale;
    } else if(action==='slam') {
      angle = .15 + Math.sin(t*Math.PI)*1.95 + (t>.68 ? -.65*(t-.68)/.32 : 0);
      offsetY = Math.sin(t*Math.PI)*8*scale;
    } else if(action==='grab') {
      angle = -1.05 + Math.sin(t*Math.PI*1.35)*familyMotion + characterPhase*.12;
      offsetX = facing*Math.sin(t*Math.PI)*8*scale;
    } else if(action==='dashThrust' || action==='jab') {
      angle = 1.35 + (1-wind)*.18 - strike*.12 + (t>.68 ? -.35*(t-.68)/.32 : 0);
      offsetX = facing*((t<.28 ? -7*(1-wind) : 6+strike*9) - (t>.68 ? 8*(t-.68)/.32 : 0))*scale;
    } else if(move.includes('up') || move==='aerial' || move.includes('recovery')) {
      angle = -.12 + Math.sin(t*Math.PI)*familyMotion*.68;
      offsetY = -Math.sin(t*Math.PI)*10*scale;
    } else if(move.includes('down') || move.includes('ground')) {
      angle = .18 + Math.sin(t*Math.PI)*familyMotion*1.55;
      offsetY = Math.sin(t*Math.PI)*7*scale;
    } else {
      const sweep = -1.05 + t*2.15;
      angle = sweep * Math.min(1,familyMotion) + Math.sin(t*Math.PI)*.22 + characterPhase*.08;
      offsetX = facing*Math.sin(t*Math.PI)*7*scale;
      offsetY = Math.sin(t*Math.PI*2)*4*scale;
    }
    if(recovering) { angle = angle*.76; offsetX*=.45; offsetY*=.45; }
  }
  const drawSlot=String(attack?.resonanceMoveSlot||'').toLowerCase();
  if(active) { const authored=authoredWeaponMotion(spec.family, drawSlot, progress, facing, angle); if(authored){angle=authored.angle;offsetX+=authored.x*scale;offsetY+=authored.y*scale;} }
  const size=scale*2*(1+(active?.09*swing:0));
  const mount=({
    greaves:[0,7,-.08], claws:[facing*7,-20,-.18], tonfas:[facing*8,-20,-.18],
    tether:[facing*8,-20,-.14], blasters:[facing*9,-20,-.12], cannons:[facing*10,-20,-.08],
    shield:[facing*11,-23,-.12], bastion:[facing*10,-20,-.1], bow:[facing*8,-23,-.62],
    rapier:[facing*8,-23,-.25], spear:[facing*8,-23,-.18], trident:[facing*8,-23,-.16],
    halberd:[facing*8,-23,-.35], staff:[facing*7,-22,-.08], whip:[facing*7,-22,-.24],
    flail:[facing*7,-22,-.15], rings:[facing*19,-28,0], core:[facing*21,-28,0],
    shards:[facing*17,-26,0], disc:[facing*9,-21,-.18], projector:[facing*5,-35,-.08],
    maul:[facing*8,-22,-.2], hammer:[facing*8,-22,-.2],
  })[spec.family] || [facing*(10+v*8),-23,-.38];
  if(spec.family==='blade') { mount[0]=facing*13; mount[1]=-24; mount[2]=-.62; }
  const x=fighter.x+mount[0]*scale+offsetX, y=fighter.y+mount[1]*scale+bob*scale+offsetY;
  ctx.save();ctx.translate(x,y);ctx.scale(facing*size,size);ctx.rotate(angle+mount[2]);
  // Soft cyan bounce light and a narrow rim bloom, not a trailing line.
  const glow=ctx.createRadialGradient(11,0,1,11,0,37);
  glow.addColorStop(0,'rgba(80,245,255,.32)');glow.addColorStop(.55,'rgba(43,187,255,.13)');glow.addColorStop(1,'rgba(43,187,255,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(11,0,37,0,Math.PI*2);ctx.fill();
  const metal=ctx.createLinearGradient(-4,-30,18,27);
  metal.addColorStop(0,'#f5ffff');metal.addColorStop(.18,'#9cffff');metal.addColorStop(.42,'#37d9f4');metal.addColorStop(.7,'#0876b9');metal.addColorStop(1,'#073c78');
  const dark='#073b69', edge='#d8ffff', cyan='#6ff7ff';
  const accent=(fighter.resonanceOriginalChar?.color || fighter.char?.accentColor || '#ffb65c');
  ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=1.5;ctx.strokeStyle=edge;ctx.fillStyle=metal;
  const poly=(pts,fill=metal,stroke=edge)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}};
  const line=(pts,color=cyan,w=2)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();};
  const grip=()=>{poly([[2,-3],[7,-4],[11,21],[6,23]],'#07518a',edge);for(let i=0;i<4;i++)line([[3+i*1.2,3+i*4],[8+i*1.2,2+i*4]],'#d8ffff',.8);poly([[0,-5],[11,-6],[13,-2],[1,0]],'#e8ffff',dark);};
  switch(spec.family){
    case 'hammer': case 'maul':
      grip();poly([[-5,-22],[18,-25],[28,-17],[27,-4],[18,3],[-5,0],[-10,-8]],'#075b9d',edge);poly([[-3,-20],[17,-22],[23,-16],[19,-12],[-4,-12]],'#d9ffff',null);poly([[0,-9],[20,-10],[24,-6],[18,-2],[0,-3]],'#23cbe9',null);line([[5,-18],[16,-18]],'#ffffff',1.3);break;
    case 'projector':
      grip();poly([[0,-18],[17,-21],[25,-14],[25,-5],[18,1],[1,-2]],'#075b9d',edge);ctx.fillStyle='#0b315f';ctx.beginPath();ctx.ellipse(20,-10,5,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=cyan;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#eaffff';ctx.beginPath();ctx.arc(20,-10,2,0,Math.PI*2);ctx.fill();break;
    case 'spear': case 'trident': case 'halberd': case 'staff':
      poly([[6,-24],[10,-24],[12,27],[8,29]],'#0877b6',edge);line([[8,-18],[10,22]],'#dfffff',1.2);
      if(spec.family==='staff'){poly([[1,-27],[15,-29],[18,-25],[14,-21],[2,-21]],'#0c6ba7',edge);poly([[2,24],[15,24],[17,28],[4,30]],'#0c6ba7',edge);for(let j=0;j<3;j++){ctx.strokeStyle=cyan;ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(9,-7+j*12,5,2,.1,0,Math.PI*2);ctx.stroke();}}
      else {poly([[9,-44],[1,-28],[7,-31],[9,-25],[12,-31],[18,-28]],'#e7ffff',edge);poly([[8,-29],[2,-36],[-1,-31],[5,-24]],'#20cce9',edge);if(spec.family==='trident')poly([[10,-29],[17,-37],[21,-31],[14,-24]],'#20cce9',edge);if(spec.family==='halberd')poly([[10,-28],[22,-31],[25,-23],[15,-19]],'#2dd8f1',edge);}
      break;
    case 'bow':
      poly([[7,-29],[16,-24],[21,-10],[16,7],[8,25],[4,22],[11,5],[14,-10],[10,-22]],'#0877b6',edge);line([[7,-28],[10,-3],[5,23]],'#eaffff',1.2);poly([[9,-5],[23,-7],[19,-3],[9,-2]],'#eaffff',edge);break;
    case 'whip': case 'flail': case 'tether':
      grip();line([[8,-2],[18,2],[24,12],[31,8]],'#0876b9',4);line([[8,-2],[18,2],[24,12],[31,8]],cyan,1.2);
      if(spec.family==='flail'){ctx.save();ctx.translate(31,8);ctx.rotate(Math.sin(frame*.12)*.18);poly([[-5,-5],[5,-5],[8,0],[4,6],[-5,5],[-8,0]],'#0b5d9b',edge);poly([[-3,-3],[3,-3],[4,1],[-3,2]],'#dfffff',null);ctx.restore();}
      else if(spec.family==='whip'){for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(19+i*4,3+i*2,2,0,Math.PI*2);ctx.fillStyle=cyan;ctx.fill();}}
      else poly([[28,4],[35,7],[33,13],[27,12]],'#dfffff',edge);break;
    case 'shield': case 'bastion':
      poly([[4,-27],[20,-22],[24,-10],[20,10],[11,25],[1,11],[-2,-9]],'#07518d',edge);poly([[5,-22],[18,-18],[20,-9],[16,8],[11,16],[5,7],[2,-8]],'#21cde8','#dfffff');poly([[7,-17],[15,-14],[16,-8],[11,-3],[6,-8]],'#efffff',null);line([[4,2],[11,13],[18,1]],'#0876b9',1.4);break;
    case 'rings': case 'core': case 'shards': case 'disc':
      if(spec.family==='shards'){for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2+Math.sin(frame*.08)*.12);poly([[13,-26],[19,-17],[15,-9],[10,-16]],i%2?'#1ebedc':'#d9ffff',edge);ctx.restore();}ctx.beginPath();ctx.arc(12,0,13,.2,Math.PI*1.7);ctx.strokeStyle='#54edff';ctx.lineWidth=2;ctx.stroke();}
      else if(spec.family==='disc'){ctx.beginPath();ctx.ellipse(12,0,20,8,Math.sin(frame*.1)*.18,0,Math.PI*2);ctx.fillStyle=metal;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.ellipse(12,0,12,4,0,0,Math.PI*2);ctx.strokeStyle=cyan;ctx.stroke();ctx.beginPath();ctx.arc(12,0,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();}
      else {ctx.save();ctx.rotate(frame*.025);ctx.beginPath();ctx.ellipse(12,0,14,22,.28,0,Math.PI*2);ctx.fillStyle=metal;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.ellipse(12,0,7,15,-.28,0,Math.PI*2);ctx.strokeStyle=cyan;ctx.lineWidth=2;ctx.stroke();ctx.restore();poly([[8,-6],[13,-13],[17,-5],[13,4]],'#eaffff',edge);}break;
    case 'greaves': case 'claws': case 'tonfas': case 'dual': case 'blasters': case 'cannons':
      for(let i=0;i<2;i++){ctx.save();ctx.translate(5+i*11,-10+i*17);ctx.rotate(-.25+i*.5);if(spec.family==='blasters'||spec.family==='cannons'){poly([[-2,-10],[7,-12],[11,-7],[10,7],[5,11],[-2,6]],'#075b9d',edge);ctx.fillStyle='#dfffff';ctx.beginPath();ctx.ellipse(5,-8,3,2,0,0,Math.PI*2);ctx.fill();line([[4,-5],[4,4]],cyan,1.3);}else if(spec.family==='claws'){poly([[-3,-7],[3,-10],[8,4],[5,13],[1,8]],'#0876b9',edge);for(let c=0;c<3;c++)poly([[3+c*2,-5],[8+c*2,-13],[7+c*2,-3]],'#eaffff',edge);}else{poly([[-2,-12],[6,-13],[9,8],[4,12],[-1,6]],'#0876b9',edge);line([[1,-7],[5,5]],'#eaffff',1);}ctx.restore();}break;
    case 'greatblade': case 'katana': case 'blade':
      grip();
      if (spec.family==='greatblade') {
        poly([[4,-8],[0,-24],[4,-39],[12,-48],[20,-38],[22,-22],[16,-7]],'#075b9d',edge);
        poly([[7,-25],[10,-40],[14,-43],[18,-31],[14,-15]],'#eaffff',null);
        line([[7,-19],[16,-28],[17,-35]],cyan,1.4);
      } else if (spec.family==='katana') {
        poly([[8,-7],[9,-29],[16,-47],[19,-49],[17,-28],[13,-6]],'#075b9d',edge);
        poly([[13,-28],[17,-43],[18,-31]],'#efffff',null); line([[7,-5],[17,-8]],cyan,1.5);
      } else {
        poly([[6,-8],[4,-25],[8,-42],[14,-47],[18,-31],[15,-8]],'#075b9d',edge);
        poly([[9,-26],[13,-40],[15,-27]],'#efffff',null); line([[8,-14],[15,-30]],cyan,1.4);
      } break;
    case 'crescent':
      grip();
      poly([[7,-11],[0,-25],[1,-38],[10,-45],[8,-32],[7,-22],[15,-30],[23,-31],[19,-19],[13,-11]],'#075b9d',edge);
      poly([[5,-27],[8,-39],[12,-42],[10,-30]],'#eaffff',null);
      poly([[14,-12],[22,-22],[28,-23],[24,-13],[18,-7]],'#20cce9',edge); break;
    case 'scythe':
      grip();poly([[6,-15],[12,-20],[20,-34],[30,-38],[26,-27],[18,-19],[13,-10]],'#075b9d',edge);poly([[17,-28],[26,-35],[22,-27],[14,-20]],'#eaffff',null);line([[10,-16],[16,-24],[25,-32]],cyan,1.3);break;
    case 'axe':
      grip();poly([[9,-15],[17,-27],[28,-24],[25,-11],[17,-4],[10,-5]],'#075b9d',edge);poly([[18,-23],[25,-21],[22,-14],[15,-10]],'#eaffff',null);break;
    case 'rapier':
      poly([[5,-5],[10,-5],[13,29],[9,31]],'#075b9d',edge);poly([[9,-5],[10,-43],[13,-48],[14,-5]],'#eaffff',edge);poly([[2,-6],[17,-7],[16,-3],[3,-2]],'#20cce9',edge);break;
    case 'greaves': break;
    default:
      grip();poly([[7,-27],[13,-31],[18,-24],[17,8],[12,20],[6,8]],'#075b9d',edge);poly([[10,-26],[13,-30],[15,-21],[12,4]],'#eaffff',null);poly([[0,2],[20,0],[22,4],[1,7]],'#21cde8',edge);break;
  }
  // Authored design-specific detailing: recessed grooves, rivets, runes, and inlays.
  // These layers sit on the weapon itself (not as detached motion trails).
  const weaponSpec = RESONANCE_CONSTRUCT_SPEC_BY_NAME[name];
  const designText = weaponSpec?.design || '';
  const designAccent = /orange|molten/i.test(designText) ? '#ff8a32' : /crimson|red rift/i.test(designText) ? '#ff4c62' : /violet|purple|dimensional/i.test(designText) ? '#a78bff' : /gold/i.test(designText) ? '#ffd66b' : /jade|green/i.test(designText) ? '#7dffb0' : /turquoise/i.test(designText) ? '#73fff0' : accent;
  ctx.save(); ctx.globalAlpha=.95; ctx.strokeStyle=designAccent; ctx.fillStyle=designAccent; ctx.lineWidth=1.35;
  // Family-specific etched motif makes each silhouette feel manufactured rather than primitive.
  if (['blade','katana','greatblade','rapier','axe','scythe','crescent','halberd','spear','trident'].includes(spec.family)) {
    for(let i=0;i<4;i++){const yy=-35+i*7;ctx.beginPath();ctx.moveTo(7+(i%2)*2,yy);ctx.lineTo(12+(i%2)*2,yy-3);ctx.lineTo(14+(i%2)*2,yy+1);ctx.stroke();}
    ctx.strokeStyle='#efffff';ctx.globalAlpha=.75;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(11,-42);ctx.lineTo(14,-30);ctx.lineTo(12,-18);ctx.stroke();
  } else if (['hammer','maul','flail','projector'].includes(spec.family)) {
    for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(1+i*6,-16+(i%2)*17,1.4,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle=designAccent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-11);ctx.lineTo(3,-14);ctx.lineTo(8,-10);ctx.lineTo(13,-13);ctx.stroke();
  } else if (['rings','core','shards','disc'].includes(spec.family)) {
    for(let i=0;i<3;i++){ctx.save();ctx.rotate(frame*.018+i*Math.PI*2/3);ctx.strokeStyle=designAccent;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(12,0,17+i*2,.22,1.12);ctx.stroke();ctx.fillStyle='#f5ffff';ctx.beginPath();ctx.arc(12,-17-i*2,1.5,0,Math.PI*2);ctx.fill();ctx.restore();}
  } else {
    for(let i=0;i<4;i++){ctx.fillStyle=i%2?designAccent:'#dfffff';ctx.beginPath();ctx.moveTo(3+i*4,-16+i*7);ctx.lineTo(6+i*4,-12+i*7);ctx.lineTo(2+i*4,-9+i*7);ctx.closePath();ctx.fill();}
  }
  // Expose a tiny rune seam and rivets for every weapon; the cyan channel stays readable.
  ctx.globalAlpha=.9;ctx.strokeStyle=designAccent;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(2,9);ctx.lineTo(5,7);ctx.lineTo(8,10);ctx.lineTo(11,8);ctx.stroke();
  ctx.fillStyle='#f4ffff';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(4+i*4,14+i*2,1,0,Math.PI*2);ctx.fill();}
  ctx.restore();

  // A faceted character-color powerstone, recessed socket, and tiny etched runes
  // give every construct a second identity color rather than a flat cyan silhouette.
  ctx.save();
  ctx.shadowColor=accent; ctx.shadowBlur=active ? 10+strike*10 : 6;
  ctx.fillStyle='#062c50'; ctx.strokeStyle=edge; ctx.lineWidth=1.15;
  ctx.beginPath(); ctx.moveTo(9,-10); ctx.lineTo(15,-15); ctx.lineTo(21,-10); ctx.lineTo(19,-3); ctx.lineTo(12,-2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=accent; ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(15,-13); ctx.lineTo(19,-9); ctx.lineTo(17,-4); ctx.lineTo(12,-4); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.88)'; ctx.beginPath(); ctx.moveTo(11,-10); ctx.lineTo(15,-12); ctx.lineTo(14,-8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=accent; ctx.lineWidth=1.2; ctx.globalAlpha=.9;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-1+i*2,7+i*4);ctx.lineTo(3+i*2,5+i*4);ctx.stroke();}
  ctx.restore();
  // Individual characters get a stable, deterministic pose offset, plus their own attack cadence.
  // Attack arcs are compact impact flashes aligned to the weapon's active frames, not permanent trails.
  if(active && progress>=.18 && progress<=.58){
    ctx.save();ctx.globalAlpha=.35+Math.sin(progress*Math.PI)*.3;ctx.strokeStyle='#b9ffff';ctx.lineWidth=2.4;
    ctx.beginPath();const r=spec.reach*19;ctx.arc(9,0,r,-.72,.72);ctx.stroke();
    ctx.globalAlpha=.8;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(9+r*.72,r*.7,1.8,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.restore();
}
