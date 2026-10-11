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

// Shared source of truth for combat collision AND Settings -> Hitboxes. The
// shapes follow the specific animated weapon/action, not a generic range box.
export function getResonanceConstructHitboxes(fighter) {
  const a=fighter?.attackData;
  if(!a?.resonanceFamily) return [];
  const p=clamp01(a.progress);
  if(p < .20 || p > .70) return [];
  const active=(p-.20)/.50;
  const f=Number(fighter.facing)||1, x=Number(fighter.x)||0, y=(Number(fighter.y)||0)-30;
  const range=Math.max(42,Math.min(190,Number(a.range)||100));
  const heavy=!!a.isHeavy;
  const action=a.resonanceAction || getResonanceAttackAction(a.resonanceFamily, a.resonanceMove, a.sigType);
  const reach=range*(heavy?1.02:.78);
  const visualLen=(42+25*Math.max(.7,Math.min(1.55,range/125)))*(heavy?1.16:1);
  const strike=p>=.28&&p<=.68?Math.sin(((p-.28)/.4)*Math.PI):0;
  if(action==='jab') return [capsule(x+f*9,y-8,x+f*(Math.min(74,visualLen*(.42+strike*.18))+9),y-29,heavy?15:11)];
  if(action==='projectile' || action==='projectileUp') {
    const px=x+f*(action==='projectileUp'?19:9+visualLen*(.36+active*.86));
    const py=action==='projectileUp' ? (Number(fighter.y)||0)-33-visualLen*(.18+active*.62) : y+Math.sin(active*Math.PI*2)*6;
    const r=heavy?19:14;
    return [circle(px,py,r), capsule(px-f*r*.7,py,px+f*r*.7,py,r*.52)];
  }
  if(action==='rise') {
    const lift=visualLen*(.35+strike*.32);
    return [capsule(x+f*4,y-2,x+f*14,y-lift,heavy?19:15), capsule(x-f*9,y-lift+7,x+f*29,y-lift+7,heavy?16:12)];
  }
  if(action==='slam') {
    const groundY=(Number(fighter.y)||0)+9+active*12;
    const radius=visualLen*(.35+strike*.20);
    return [box(x+f*19,groundY,radius*2,heavy?36:27), arcStrip(x+f*19,groundY+3,radius,heavy?22:16,Math.PI*1.03,Math.PI*1.97,10)];
  }
  if(action==='grab') {
    const reachNow=9+visualLen*(.32+active*.43);
    const yy=(Number(fighter.y)||0)-38+Math.sin(active*Math.PI)*12;
    return [capsule(x+f*9,(Number(fighter.y)||0)-38,x+f*reachNow,yy,heavy?15:10), circle(x+f*reachNow,yy,heavy?18:13)];
  }
  if(action==='dashThrust') {
    const end=x+f*(9+visualLen*(.62+strike*.18));
    const cy=(Number(fighter.y)||0)-32;
    return [capsule(x+f*7,cy,end,cy,heavy?18:12), circle(end,cy,heavy?13:9)];
  }
  if(action==='burst') {
    const r=25+strike*25, cx=x+f*(9+visualLen*.52), cy=(Number(fighter.y)||0)-33;
    return [circle(cx,cy,r), arcStrip(cx,cy,r,heavy?24:16,Math.PI*1.1,Math.PI*2.9,12)];
  }
  // Weapon slash: a thick swept arc in front of the fighter, with radius and
  // thickness sized to the actual weapon family and heavy/light attack slot.
  const radius=Math.min(118,Math.max(48,visualLen*.82));
  const width=heavy?31:22;
  const start=-1.12+active*.05, end=.95+active*.1;
  const points=[];
  for(let i=0;i<=10;i++){const t=i/10,ang=start+(end-start)*t;points.push([x+f*(12+Math.cos(ang)*radius),y+Math.sin(ang)*radius]);}
  for(let i=10;i>=0;i--){const t=i/10,ang=start+(end-start)*t;points.push([x+f*(12+Math.cos(ang)*(radius-width)),y+Math.sin(ang)*(radius-width)]);}
  return [{shape:'polygon',points}];
}
export function makeConstructCharacter(baseChar, fighterId) {
  const constructName = getConstructForCharacter(baseChar);
  const spec = CONSTRUCTS[constructName] || CONSTRUCTS['Resonance Blade'];
  const seed = baseChar?.id || baseChar?.name || fighterId || 'fighter';
  const v = variation(seed, 'move');
  const color = baseChar?.color || '#56e7ff';
  const original = { ...baseChar };
  const make = (old, label, scale, type, rangeScale=1) => ({
    ...(old || {}), name:`${constructName} ${label}`, type,
    color:'#62eaff', damage:(old?.damage || 14),
    knockback:(old?.knockback || 1),
    range:Math.round((old?.range || 145)*spec.reach*rangeScale),
    duration:Math.max(8,Math.round((old?.duration || 18)/spec.speed)),
    resonanceConstruct:constructName, resonanceFamily:spec.family,
    resonanceMove:label, resonanceShape:spec.shape, accentColor:color, characterVariation:v,
    resonanceAction:getResonanceAttackAction(spec.family, label, type),
  });
  const signatures = {
    side:make(baseChar?.signatures?.side,'Side Resonance',spec.power+v,'dash',1.12),
    up:make(baseChar?.signatures?.up,'Rising Resonance',spec.power+v,'launch',.95),
    down:make(baseChar?.signatures?.down,'Ground Resonance',spec.power+v,'groundSlam',1.05),
  };
  const heavyAttack=make(baseChar?.heavyAttack,'Heavy Resonance',spec.power+v,'dash',1.18);
  const lightSource = baseChar?.lightAttack || baseChar?.normalAttack;
  const lightAttack = { ...make(lightSource, 'Light Resonance', 1, 'dash', .78), damage: Number(lightSource?.damage ?? 9), knockback: Number(lightSource?.knockback ?? 1) };
  const powerAttack = make(baseChar?.powerAttack, 'Resonance Burst', 1, 'dash', .92);
  const upHeavy = make(baseChar?.upHeavy || baseChar?.up_heavy, 'Up Heavy Resonance', spec.power + v, 'launch', 1.08);
  const downHeavy = make(baseChar?.downHeavy || baseChar?.down_heavy, 'Down Heavy Resonance', spec.power + v, 'groundSlam', 1.12);
  return { ...original, signatures, heavyAttack, upHeavy, downHeavy, lightAttack, normalAttack: lightAttack, powerAttack,
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
      const ground=(platforms||[]).filter(p=>p && Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.width>100);
      const p=ground[Math.floor(Math.random()*ground.length)];
      const left=Math.max(100, Math.min(W-100, p ? p.x+p.width/2 : W/2));
      const targetY=p?Math.max(70,p.y-110):Math.max(120,H*.38);
      match.orb={x:left,y:-48,targetY,age:0,pulse:0,fallSpeed:3.2};
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
  const x=orb.x,y=orb.y,pulse=1+Math.sin(frame*.12)*.08;
  ctx.save(); ctx.translate(x,y); ctx.scale(pulse,pulse);
  const halo=ctx.createRadialGradient(0,0,4,0,0,70);
  halo.addColorStop(0,'rgba(82,240,255,.45)'); halo.addColorStop(.5,'rgba(45,190,255,.18)'); halo.addColorStop(1,'rgba(45,190,255,0)');
  ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(0,0,70,0,Math.PI*2); ctx.fill();
  const core=ctx.createRadialGradient(-7,-9,2,0,0,23);
  core.addColorStop(0,'#ffffff');core.addColorStop(.28,'#b7ffff');core.addColorStop(.62,'#39dfff');core.addColorStop(1,'#126acb');
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(185,255,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,29+Math.sin(frame*.08)*3,frame*.025,frame*.025+Math.PI*1.55);ctx.stroke();
  for(let i=0;i<6;i++){const a=frame*.025+i*Math.PI/3;ctx.fillStyle=i%2?'#53dfff':'#eaffff';ctx.beginPath();ctx.moveTo(Math.cos(a)*33,Math.sin(a)*33);ctx.lineTo(Math.cos(a+.16)*42,Math.sin(a+.16)*42);ctx.lineTo(Math.cos(a-.12)*39,Math.sin(a-.12)*39);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#d9ffff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('ELEMENT 6',0,39);
  ctx.restore();
}
// Detailed layered weapon illustration. Every family has a distinct silhouette, bevels,
// inset energy channels and animated parts; the weapon is rendered continuously while active.
export function drawConstructWeapon(ctx, fighter, scale=1) {
  if (!fighter?.resonanceActive || !fighter.resonanceConstruct) return;
  // The active attack renderer draws the weapon through its full animated swing.
  // Avoid drawing a second idle copy on top of that authored attack pose.
  if (fighter.state === 'attacking' || fighter.state === 'attackHold') return;
  const name=fighter.resonanceConstruct, spec=CONSTRUCTS[name]||CONSTRUCTS['Resonance Blade'];
  const facing=fighter.facing||1, frame=fighter.frame||0, attack=fighter.attackData;
  const active=(fighter.state==='attacking' || fighter.state==='superAttack') && attack;
  const progress=active ? Math.max(0,Math.min(1,attack.progress||0)) : 0;
  const swing=Math.sin(progress*Math.PI), recovering=active && progress>.68;
  const v=variation(fighter.resonanceOriginalChar?.id||fighter.char?.id||name,'pose');
  const bob=Math.sin(frame*.13+v*20)*1.2;
  let angle=-.38+bob*.012;
  if(active) {
    const familyMotion = ({ hammer:.7, maul:.62, greatblade:.82, scythe:1.15, whip:1.3, flail:1.25, spear:.42, rapier:.32, katana:.95, staff:1.4, rings:1.6, core:1.7, shards:1.2, bow:.22, projector:.18, greaves:.6 })[spec.family] ?? .9;
    const characterPhase = variation(fighter.resonanceOriginalChar?.id || fighter.char?.id || name, 'attack-phase') * 4;
    const arc = Math.sin(Math.max(0, Math.min(1, progress + characterPhase * .035)) * Math.PI);
    angle += (attack.sigType==='up'?-familyMotion:attack.sigType==='down'?familyMotion:familyMotion)*(progress<.5?arc:-arc*.7) + characterPhase * .12;
  }
  if(recovering) angle*=.72;
  const size=scale*(1+(active?.06*swing:0));
  const x=fighter.x+facing*(10+v*8)*scale, y=fighter.y-23*scale+bob*scale;
  ctx.save();ctx.translate(x,y);ctx.scale(facing*size,size);ctx.rotate(angle);
  // Soft cyan bounce light and a narrow rim bloom, not a trailing line.
  const glow=ctx.createRadialGradient(11,0,1,11,0,37);
  glow.addColorStop(0,'rgba(80,245,255,.32)');glow.addColorStop(.55,'rgba(43,187,255,.13)');glow.addColorStop(1,'rgba(43,187,255,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(11,0,37,0,Math.PI*2);ctx.fill();
  const metal=ctx.createLinearGradient(-4,-30,18,27);
  metal.addColorStop(0,'#f5ffff');metal.addColorStop(.18,'#9cffff');metal.addColorStop(.42,'#37d9f4');metal.addColorStop(.7,'#0876b9');metal.addColorStop(1,'#073c78');
  const dark='#073b69', edge='#d8ffff', cyan='#6ff7ff';
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
  // Individual characters get a stable, deterministic pose offset, plus their own attack cadence.
  // Attack arcs are compact impact flashes aligned to the weapon's active frames, not permanent trails.
  if(active && progress>=.18 && progress<=.58){
    ctx.save();ctx.globalAlpha=.35+Math.sin(progress*Math.PI)*.3;ctx.strokeStyle='#b9ffff';ctx.lineWidth=2.4;
    ctx.beginPath();const r=spec.reach*19;ctx.arc(9,0,r,-.72,.72);ctx.stroke();
    ctx.globalAlpha=.8;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(9+r*.72,r*.7,1.8,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.restore();
}
