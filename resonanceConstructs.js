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

// Authored per-slot choreography metadata consumed by the weapon renderer. These
// are real move-specific profiles (not merely renamed attacks): each profile
// carries a distinct wind-up, active window, travel direction and impact style.
export const RESONANCE_MOVE_PROFILES = {
  sideSignature: { motion:'sweeping-lunge', windup:.22, active:.36, recovery:.42, hitbox:'forward-arc', travelX:1, travelY:0, impact:'wide', arc:1.25, extension:1.12, lift:0, spin:0 },
  upSignature: { motion:'rising-spiral', windup:.18, active:.30, recovery:.52, hitbox:'vertical-arc', travelX:.12, travelY:-1, impact:'lift', arc:1.65, extension:.78, lift:-18, spin:1.2 },
  downSignature: { motion:'overhead-slam', windup:.30, active:.28, recovery:.42, hitbox:'ground-arc', travelX:0, travelY:1, impact:'ground-burst', arc:1.75, extension:.95, lift:12, spin:0 },
  recovery: { motion:'recovery-thrust', windup:.12, active:.34, recovery:.54, hitbox:'vertical-thrust', travelX:.08, travelY:-1, impact:'launch', arc:1.35, extension:1.28, lift:-25, spin:0 },
  sideHeavy: { motion:'charged-cleave', windup:.36, active:.22, recovery:.42, hitbox:'long-forward-arc', travelX:1, travelY:.05, impact:'heavy-spark', arc:1.95, extension:1.32, lift:0, spin:0 },
  upHeavy: { motion:'rising-heavy', windup:.27, active:.25, recovery:.48, hitbox:'overhead-column', travelX:.1, travelY:-1, impact:'launch-spark', arc:1.85, extension:.92, lift:-22, spin:.3 },
  downHeavy: { motion:'crushing-drop', windup:.32, active:.25, recovery:.43, hitbox:'ground-column', travelX:0, travelY:1, impact:'ground-shockwave', arc:2.0, extension:1.05, lift:18, spin:0 },
  light: { motion:'quick-cut', windup:.12, active:.28, recovery:.60, hitbox:'short-arc', travelX:1, travelY:0, impact:'quick-spark', arc:.85, extension:.72, lift:0, spin:0 },
  aerial: { motion:'airborne-crosscut', windup:.16, active:.30, recovery:.54, hitbox:'air-arc', travelX:.5, travelY:-.3, impact:'air-spark', arc:1.1, extension:.86, lift:-8, spin:.4 },
  burst: { motion:'construct-discharge', windup:.28, active:.24, recovery:.48, hitbox:'energy-burst', travelX:1, travelY:0, impact:'radial-burst', arc:2.2, extension:1.1, lift:0, spin:2.5 },
};

// Family-specific choreography transforms the same seven combat slots into distinct
// physical actions. This table deliberately describes weapon mechanics, not just colors.
const FAMILY_CHOREOGRAPHY = {
  blade:{mode:'slash',arc:1.0,extension:1.0},katana:{mode:'draw-cut',arc:1.25,extension:1.15},greatblade:{mode:'broad-cleave',arc:1.55,extension:1.2},dual:{mode:'crosscut',arc:1.45,extension:.8},crescent:{mode:'double-arc',arc:1.6,extension:1.0},
  scythe:{mode:'hook-sweep',arc:1.8,extension:1.2},axe:{mode:'chop',arc:1.25,extension:1.05},halberd:{mode:'hook-thrust',arc:1.4,extension:1.2},rapier:{mode:'precision-thrust',arc:.35,extension:1.55},spear:{mode:'long-thrust',arc:.22,extension:1.65},trident:{mode:'three-prong-thrust',arc:.35,extension:1.45},staff:{mode:'staff-spin',arc:1.4,extension:1.0},
  hammer:{mode:'impact-smash',arc:1.6,extension:1.0},maul:{mode:'heavy-drop',arc:1.9,extension:1.08},flail:{mode:'lagging-orbit',arc:1.55,extension:1.28},bow:{mode:'draw-release',arc:.18,extension:1.8},cannons:{mode:'recoil-blast',arc:.15,extension:1.7},blasters:{mode:'dual-volley',arc:.3,extension:1.65},projector:{mode:'beam-charge',arc:.08,extension:1.9},disc:{mode:'disc-release',arc:.65,extension:1.65},
  whip:{mode:'whip-crack',arc:2.1,extension:1.7},tether:{mode:'tether-snap',arc:1.5,extension:1.5},rings:{mode:'orbiting-ring',arc:1.7,extension:1.25},greaves:{mode:'kick-combo',arc:1.1,extension:.9},core:{mode:'orbit-pulse',arc:1.9,extension:1.25},claws:{mode:'raking-combo',arc:1.25,extension:.75},shield:{mode:'shield-bash',arc:1.0,extension:.95},tonfas:{mode:'rapid-twin-strike',arc:1.2,extension:.8},shards:{mode:'shard-fan',arc:1.25,extension:1.4},bastion:{mode:'guard-counter',arc:1.15,extension:1.0}
};
// Character-authored motion overrides for the elemental heroes and the three
// primordial characters. These profiles are intentionally move-specific: the
// construct's weapon remains the physical attack source, while the trajectory,
// active region and impact are authored per character rather than shared blindly.
const CHARACTER_MOVE_OVERRIDES = {
  'Fire Hero': {
    sideSignature:{motion:'fire-cleave',familyMode:'fire-cleave',arc:1.9,extension:1.24,impact:'ember-burst'},
    upSignature:{motion:'flame-rising-cut',familyMode:'flame-rising-cut',arc:1.5,extension:.9,lift:-22,impact:'upward-flare'},
    downSignature:{motion:'firefall-slam',familyMode:'firefall-slam',arc:1.8,extension:1.1,impact:'ground-flare'},
    recovery:{motion:'flame-rocket',familyMode:'flame-rocket',arc:1.1,extension:1.3,lift:-30,impact:'launch-flare'},
    sideHeavy:{motion:'inferno-cleave',familyMode:'inferno-cleave',arc:2.15,extension:1.45,impact:'inferno-burst'},
    upHeavy:{motion:'pillar-of-fire',familyMode:'pillar-of-fire',arc:1.75,extension:1.0,lift:-27,impact:'fire-column'},
    downHeavy:{motion:'eruption',familyMode:'eruption',arc:2.2,extension:1.2,impact:'lava-shockwave'},
  },
  'Water Hero': {
    sideSignature:{motion:'tidal-thrust',familyMode:'tidal-thrust',arc:.5,extension:1.5,impact:'water-surge'},
    upSignature:{motion:'spinning-water-ring',familyMode:'spinning-water-ring',arc:1.8,extension:1.2,lift:-17,impact:'ring-launch'},
    downSignature:{motion:'descending-torrent',familyMode:'descending-torrent',arc:1.4,extension:1.25,impact:'splash-burst'},
    recovery:{motion:'geyser-rise',familyMode:'geyser-rise',arc:.65,extension:1.35,lift:-31,impact:'geyser'},
    sideHeavy:{motion:'breaker-wave',familyMode:'breaker-wave',arc:1.7,extension:1.5,impact:'wave-crash'},
    upHeavy:{motion:'whirlpool-lift',familyMode:'whirlpool-lift',arc:1.9,extension:1.1,lift:-26,impact:'vortex-launch'},
    downHeavy:{motion:'undertow-slam',familyMode:'undertow-slam',arc:1.7,extension:1.15,impact:'undertow'},
  },
  'Grass Hero': {
    sideSignature:{motion:'thorn-fan',familyMode:'thorn-fan',arc:1.3,extension:1.25,impact:'leaf-burst'},
    upSignature:{motion:'seed-propeller',familyMode:'seed-propeller',arc:1.55,extension:1.1,lift:-20,impact:'leaf-launch'},
    downSignature:{motion:'root-snare',familyMode:'root-snare',arc:1.45,extension:1.05,impact:'root-burst'},
    recovery:{motion:'vine-vault',familyMode:'vine-vault',arc:1.2,extension:1.25,lift:-30,impact:'vine-launch'},
    sideHeavy:{motion:'bramble-sweep',familyMode:'bramble-sweep',arc:1.9,extension:1.35,impact:'bramble-burst'},
    upHeavy:{motion:'canopy-bloom',familyMode:'canopy-bloom',arc:1.6,extension:1.1,lift:-25,impact:'canopy-launch'},
    downHeavy:{motion:'rootquake',familyMode:'rootquake',arc:1.9,extension:1.2,impact:'root-shockwave'},
  },
  'Ice Hero': {
    sideSignature:{motion:'frost-shard-thrust',familyMode:'frost-shard-thrust',arc:.35,extension:1.5,impact:'ice-splinter'},
    upSignature:{motion:'rotating-ice-knife',familyMode:'rotating-ice-knife',arc:.4,extension:1.65,lift:-17,impact:'shard-launch'},
    downSignature:{motion:'glacier-drop',familyMode:'glacier-drop',arc:1.4,extension:1.15,impact:'ice-spike'},
    recovery:{motion:'ice-spike-rise',familyMode:'ice-spike-rise',arc:.45,extension:1.4,lift:-32,impact:'frost-launch'},
    sideHeavy:{motion:'glacial-cleave',familyMode:'glacial-cleave',arc:1.8,extension:1.45,impact:'frozen-burst'},
    upHeavy:{motion:'blizzard-column',familyMode:'blizzard-column',arc:1.2,extension:1.1,lift:-25,impact:'ice-column'},
    downHeavy:{motion:'permafrost-slam',familyMode:'permafrost-slam',arc:1.7,extension:1.2,impact:'frost-shockwave'},
  },
  'Thunder Hero': {
    sideSignature:{motion:'lightning-dash',familyMode:'lightning-dash',arc:.25,extension:1.65,impact:'electric-impact'},
    upSignature:{motion:'forked-bolt-rise',familyMode:'forked-bolt-rise',arc:.7,extension:1.3,lift:-25,impact:'bolt-launch'},
    downSignature:{motion:'thunderstrike',familyMode:'thunderstrike',arc:.45,extension:1.5,impact:'thunder-ring'},
    recovery:{motion:'lightning-jet',familyMode:'lightning-jet',arc:.35,extension:1.45,lift:-33,impact:'electric-launch'},
    sideHeavy:{motion:'rail-cannon-burst',familyMode:'rail-cannon-burst',arc:.2,extension:1.8,impact:'rail-burst'},
    upHeavy:{motion:'storm-column',familyMode:'storm-column',arc:.5,extension:1.35,lift:-28,impact:'storm-launch'},
    downHeavy:{motion:'grounded-thunderclap',familyMode:'grounded-thunderclap',arc:.55,extension:1.5,impact:'thunder-shockwave'},
  },
  'Life': {
    sideSignature:{motion:'life-bloom',familyMode:'life-bloom',arc:1.4,extension:1.25,impact:'healing-burst'}, upSignature:{motion:'lifeline-rise',familyMode:'lifeline-rise',arc:1.2,extension:1.2,lift:-25,impact:'life-launch'}, downSignature:{motion:'renewal-pulse',familyMode:'renewal-pulse',arc:1.8,extension:1.15,impact:'renewal-ring'},
    recovery:{motion:'lifeline-recovery',familyMode:'lifeline-rise',arc:1.1,extension:1.3,lift:-32,impact:'life-launch'}, sideHeavy:{motion:'expansion-wave',familyMode:'orbit-pulse',arc:2.0,extension:1.4,impact:'growth-wave'}, upHeavy:{motion:'worldtree-ascent',familyMode:'lifeline-rise',arc:1.5,extension:1.25,lift:-29,impact:'canopy-launch'}, downHeavy:{motion:'seed-of-worlds',familyMode:'orbit-pulse',arc:2.1,extension:1.3,impact:'root-shockwave'}
  },
  'Mercy': {
    sideSignature:{motion:'aegis-counter',familyMode:'aegis-counter',arc:1.1,extension:1.05,impact:'guard-riposte'}, upSignature:{motion:'sanctuary-rise',familyMode:'sanctuary-rise',arc:1.2,extension:1.1,lift:-22,impact:'ward-launch'}, downSignature:{motion:'judgement-guard',familyMode:'judgement-guard',arc:1.5,extension:1.1,impact:'ward-burst'},
    recovery:{motion:'sanctuary-recovery',familyMode:'sanctuary-rise',arc:1.0,extension:1.2,lift:-30,impact:'ward-launch'}, sideHeavy:{motion:'shield-of-mercy',familyMode:'shield-bash',arc:1.4,extension:1.25,impact:'judgement-impact'}, upHeavy:{motion:'guardian-ascent',familyMode:'sanctuary-rise',arc:1.3,extension:1.15,lift:-27,impact:'ward-launch'}, downHeavy:{motion:'sanctuary-break',familyMode:'guard-counter',arc:1.8,extension:1.15,impact:'ward-shockwave'}
  },
  'Death': {
    sideSignature:{motion:'reaper-hook',familyMode:'reaper-hook',arc:2.0,extension:1.25,impact:'soul-rend'}, upSignature:{motion:'soul-harvest-rise',familyMode:'soul-harvest-rise',arc:1.7,extension:1.15,lift:-24,impact:'soul-launch'}, downSignature:{motion:'final-reaping',familyMode:'final-reaping',arc:2.0,extension:1.2,impact:'soul-shockwave'},
    recovery:{motion:'soul-ascent',familyMode:'soul-harvest-rise',arc:1.3,extension:1.3,lift:-31,impact:'soul-launch'}, sideHeavy:{motion:'reaper-judgement',familyMode:'hook-sweep',arc:2.2,extension:1.4,impact:'soul-rend-heavy'}, upHeavy:{motion:'harvest-of-souls',familyMode:'soul-harvest-rise',arc:1.9,extension:1.2,lift:-28,impact:'soul-launch-heavy'}, downHeavy:{motion:'endless-reaping',familyMode:'hook-sweep',arc:2.25,extension:1.25,impact:'soul-shockwave-heavy'}
  },
};

export function getConstructMoveProfile(family, key, characterName = '') {
  const base = RESONANCE_MOVE_PROFILES[key] || RESONANCE_MOVE_PROFILES.light;
  const fc = FAMILY_CHOREOGRAPHY[family] || FAMILY_CHOREOGRAPHY.blade;
  const vertical = key === 'upSignature' || key === 'recovery' || key === 'upHeavy';
  const downward = key === 'downSignature' || key === 'downHeavy';
  const heavy = key === 'sideHeavy' || key === 'upHeavy' || key === 'downHeavy';
  const authored = CHARACTER_MOVE_OVERRIDES[characterName]?.[key] || {};
  const baseMotion = authored.motion || base.motion;
  const familyMode = authored.familyMode || fc.mode;
  const rangedFamilies = ['bow','cannons','blasters','projector','disc','shards','core','rings'];
  const grabFamilies = ['tether','whip','flail','shield','bastion'];
  const attackKind = key === 'light' ? (rangedFamilies.includes(family) ? 'projectile' : family === 'tether' ? 'grab' : 'jab')
    : key === 'sideSignature' ? (rangedFamilies.includes(family) ? 'projectile' : grabFamilies.includes(family) ? 'grab' : 'slash')
    : key === 'upSignature' ? 'rising-slash'
    : key === 'downSignature' ? (family === 'tether' || family === 'whip' ? 'grab-slam' : 'slam')
    : key === 'recovery' ? 'recovery-launch'
    : key === 'sideHeavy' ? (rangedFamilies.includes(family) ? 'charged-projectile' : grabFamilies.includes(family) ? 'lunge-grab' : 'heavy-slash')
    : key === 'upHeavy' ? 'rising-heavy'
    : key === 'downHeavy' ? (family === 'tether' || family === 'whip' ? 'snare-slam' : 'heavy-slam')
    : key === 'aerial' ? (rangedFamilies.includes(family) ? 'air-projectile' : 'air-slash') : 'energy-burst';
  const autoMove = ['sweeping-lunge','recovery-launch','lunge-grab','rising-slash','rising-heavy'].includes(attackKind);
  return { ...base, ...authored, family, familyMode, baseMotion, characterName, attackKind, autoMove,
    directional: !['upSignature','upHeavy','downSignature','downHeavy','recovery'].includes(key),
    arc: (authored.arc ?? base.arc) * (authored.familyMode ? 1 : fc.arc),
    extension: (authored.extension ?? base.extension) * (authored.familyMode ? 1 : fc.extension),
    motion:`${familyMode}:${baseMotion}`, windup:base.windup*(heavy?1.12:1), active:base.active*(familyMode.includes('thrust')?.92:1),
    lift:authored.lift ?? (vertical?Math.min(base.lift,-12):downward?Math.max(base.lift,10):base.lift),
    hitbox:authored.hitbox || (familyMode.includes('thrust')?'weapon-thrust':familyMode.includes('beam')||familyMode.includes('blast')?'projectile-lane':base.hitbox) };
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
    resonanceConstruct:constructName, resonanceFamily:spec.family, resonanceAccent:color,
    resonanceMove:label, resonanceShape:spec.shape, accentColor:color, characterVariation:v,
  });
  const signatures = {
    side: { ...make(baseChar?.signatures?.side,'Side Resonance',spec.power+v,'dash',1.12), sigType:'side', resonanceMoveKey:'sideSignature', resonanceAnimation:getConstructMoveProfile(spec.family,'sideSignature',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family },
    up: { ...make(baseChar?.signatures?.up,'Rising Resonance',spec.power+v,'launch',.95), sigType:'up', resonanceMoveKey:'upSignature', resonanceAnimation:getConstructMoveProfile(spec.family,'upSignature',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family },
    down: { ...make(baseChar?.signatures?.down,'Ground Resonance',spec.power+v,'groundSlam',1.05), sigType:'down', resonanceMoveKey:'downSignature', resonanceAnimation:getConstructMoveProfile(spec.family,'downSignature',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family },
  };
  const heavyAttack={ ...make(baseChar?.heavyAttack,'Side Heavy',spec.power+v,'dash',1.18), sigType:'sideHeavy', resonanceMoveKey:'sideHeavy', resonanceAnimation:getConstructMoveProfile(spec.family,'sideHeavy',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  const upHeavy={ ...make(baseChar?.upHeavy || baseChar?.heavyAttack,'Up Heavy',spec.power+v,'launch',1.02), sigType:'upHeavy', resonanceMoveKey:'upHeavy', resonanceAnimation:getConstructMoveProfile(spec.family,'upHeavy',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  const downHeavy={ ...make(baseChar?.downHeavy || baseChar?.heavyAttack,'Down Heavy',spec.power+v,'groundSlam',1.08), sigType:'downHeavy', resonanceMoveKey:'downHeavy', resonanceAnimation:getConstructMoveProfile(spec.family,'downHeavy',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  const lightSource = baseChar?.lightAttack || baseChar?.normalAttack;
  const lightAttack = { ...make(lightSource, 'Light Attack', 1, 'dash', .78), damage: Number(lightSource?.damage ?? 9), knockback: Number(lightSource?.knockback ?? 1), sigType:'light', resonanceMoveKey:'light', resonanceAnimation:getConstructMoveProfile(spec.family,'light',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  const aerialAttack = { ...make(lightSource, 'Aerial Attack', 1, 'aerialNormal', .88), isNormal:true, sigType:'aerial', resonanceMoveKey:'aerial', resonanceAnimation:getConstructMoveProfile(spec.family,'aerial',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  const powerAttack = { ...make(baseChar?.powerAttack, 'Resonance Burst', 1, 'dash', .92), sigType:'burst', resonanceMoveKey:'burst', resonanceAnimation:getConstructMoveProfile(spec.family,'burst',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  const recoveryAttack = { ...make(baseChar?.signatures?.up, 'Recovery', spec.power+v, 'recovery', .9), isRecovery:true, sigType:'recovery', resonanceMoveKey:'recovery', resonanceAnimation:getConstructMoveProfile(spec.family,'recovery',baseChar?.name || baseChar?.id || ''), resonanceHitboxFamily:spec.family };
  return { ...original, signatures, heavyAttack, upHeavy, downHeavy, lightAttack, normalAttack: lightAttack, aerialAttack, recoveryAttack, powerAttack,
    // Constructs temporarily replace the normal moveset. The fighter engine uses these flags
    // to suppress original power/super logic and character-authored hitbox specs.
    _resonanceMovesetOnly: true, superMove: { name: 'Construct Dismiss', damage: 0, duration: 0, disabled: true, color: '#62eaff' },
    resonanceFamily: spec.family, resonanceShape: spec.shape, resonanceConstruct: constructName,
    _resonanceConstruct:constructName, _resonanceOriginal:baseChar };

}
export function activateConstruct(fighter) {
  if (!fighter || fighter.resonanceActive || !fighter.char) return false;
  const previousChar = fighter.char;
  try {
    const originalChar = previousChar._resonanceOriginal || previousChar;
    const constructName = getConstructForCharacter(originalChar);
    const constructChar = makeConstructCharacter(originalChar, fighter.id);
    // Validate the exact fields consumed by updateFighter before swapping live state.
    if (!constructChar || !constructChar.signatures || !constructChar.signatures.side || !constructChar.signatures.up || !constructChar.signatures.down || !constructChar.heavyAttack || !constructChar.lightAttack) return false;
    // Pickup immediately cancels the previous move's active hitbox/animation and any
    // already-launched character-specific projectiles, so only construct attacks remain.
    fighter.attackData = null;
    fighter.attackTimer = 0;
    fighter.attackHold = null;
    // Cancel the original character's power state too. Purple's dash_slash uses
    // vx=52 while its dash object is active; leaving that state alive at pickup
    // can fling the fighter off-screen and make the camera appear to collapse.
    fighter.powerActive = null;
    fighter.powerTimer = 0;
    fighter._dash = null;
    fighter._powerProjectiles = [];
    fighter.projectiles = [];
    fighter.genProjectiles = [];
    fighter.vx = Math.max(-12, Math.min(12, Number.isFinite(Number(fighter.vx)) ? Number(fighter.vx) : 0));
    fighter.vy = Math.max(-14, Math.min(14, Number.isFinite(Number(fighter.vy)) ? Number(fighter.vy) : 0));
    if (fighter.state === 'attacking' || fighter.state === 'superAttack' || fighter.state === 'attackHold') fighter.state = fighter.grounded ? 'idle' : 'jumping';
    fighter.resonanceOriginalChar = originalChar;
    fighter.resonanceConstruct = constructName;
    fighter.char = constructChar;
    fighter.resonanceActive = true;
    fighter.resonanceActivationFrames = 36;
    fighter.resonanceDeactivateFrames = 0;
    return true;
  } catch (error) {
    // A malformed/custom roster entry must not crash the match on orb pickup.
    fighter.char = previousChar;
    fighter.resonanceOriginalChar = null;
    fighter.resonanceConstruct = null;
    fighter.resonanceActive = false;
    console.error('[Resonance Constructs] Activation failed safely:', error);
    return false;
  }
}
export function consumeConstructSuperInput(fighter, input) {
  if (!fighter?.resonanceActive || !input?.superMove) return false;
  // Dismiss without consulting or modifying the super meter; do not let the
  // shared fighter engine interpret this same button press as a super attack.
  deactivateConstruct(fighter);
  input.superMove = false;
  input._resonanceDismissConsumed = true;
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
export function steerBotToResonanceOrb(match, fighter, input) {
  if (!match?.orb || !fighter || !input || !(fighter.isAI || fighter.isBot || fighter._gcBot || fighter._isBot) || fighter.resonanceActive || fighter.stocks===0 || fighter.hp===0 || fighter._eliminated) return input;
  const dx=match.orb.x-(Number(fighter.x)||0), dy=match.orb.y-((Number(fighter.y)||0)-28);
  if (Math.hypot(dx,dy)<=92) { input.sig=true; input.left=false; input.right=false; }
  else { input.left=dx < -20; input.right=dx > 20; if (dy < -72 && fighter.grounded) input.jump=true; if (dy > 95 && !fighter.grounded) input.down=true; }
  return input;
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
  if (!match.orb && fighters.some(f=>f && f.stocks!==0 && f.hp!==0 && !f._eliminated) && fighters.every(f=>!f || f.stocks===0 || f.hp===0 || f._eliminated || !f.resonanceActive)) {
    // A living player without a construct keeps the orb cycle eligible, even if
    // another living player is already using theirs. Shorter interval = more frequent drops.
    if (match.spawnWait == null) match.spawnWait = 300 + Math.random() * 240;
    match.spawnWait--;
    if (match.spawnWait<=0) {
      const ground=(platforms||[]).filter(p=>p && Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.width||p.w||0)>80 && p.y>H*.25 && p.y<H-18 && (p.h==null || p.h<=80));
      const p=ground.length ? ground[Math.floor(Math.random()*ground.length)] : null;
      // Pick a random landing lane along the selected platform, not its midpoint.
      // If there are no platform records, choose any safe horizontal lane on stage.
      const platformWidth = p ? (p.width || p.w || 0) : 0;
      const minX=Math.max(48, p ? p.x+Math.min(24, platformWidth*.15) : 48);
      const maxX=Math.min(W-48, p ? p.x+platformWidth-Math.min(24, platformWidth*.15) : W-48);
      const left=maxX>minX ? minX+Math.random()*(maxX-minX) : Math.max(48,Math.min(W-48,W*.5));
      // The orb is a physical pickup: it falls under gravity and settles on the
      // selected platform instead of hovering at an arbitrary height in mid-air.
      const landingY=p ? p.y-22 : H-70;
      // Spawn on the selected arena surface. Starting at -48 made Grand Circuit
      // constructs appear above the playfield and sometimes outside the camera.
      match.orb={x:left,y:landingY,vy:0,landingY,landed:true,age:0,pulse:0,fallSpeed:0};
      match.spawnWait=null;
    }
  }
  if (match.orb) {
    match.orb.age++; match.orb.pulse+=.09;
    // Gravity-driven fall with platform collision. Once it lands, it remains
    // resting on that surface; the tiny visual pulse is applied only by drawing.
    if (!match.orb.landed) {
      const previousY=match.orb.y;
      match.orb.vy=Math.min(9,(Number(match.orb.vy)||0)+0.34);
      match.orb.y+=match.orb.vy;
      let landingSurface=null;
      for (const platform of (platforms||[])) {
        const width=platform?.width || platform?.w || 0;
        if (!platform || !Number.isFinite(platform.x) || !Number.isFinite(platform.y) || width<=0) continue;
        const overlapsX=match.orb.x+20>=platform.x && match.orb.x-20<=platform.x+width;
        if (overlapsX && previousY+22<=platform.y && match.orb.y+22>=platform.y) {
          if (!landingSurface || platform.y<landingSurface.y) landingSurface=platform;
        }
      }
      if (landingSurface) {
        match.orb.y=landingSurface.y-22;
        match.orb.vy=0;
        match.orb.landed=true;
      } else if (match.orb.y>=H-48) {
        match.orb.y=H-48;
        match.orb.vy=0;
        match.orb.landed=true;
      }
    }
    // Bots deliberately seek the orb instead of treating it as scenery.
    // Clone their input object so shared NO_INPUT constants are never mutated.
    if (match.orb && Array.isArray(inputs)) {
      for (let i=0;i<fighters.length;i++) {
        const f=fighters[i];
        if (!f || !(f.isAI || f.isBot || f._gcBot)) continue;
        const botInput=inputs[i] || {};
        if (!inputs[i]) inputs[i]=botInput;
        steerBotToResonanceOrb(match, f, botInput);
      }
    }
    for (let i=0;i<fighters.length;i++) {
      if (tryActivateResonanceConstruct(match, fighters[i], inputs[i])) break;
    }
    if (match.orb && match.orb.age>1200) { match.orb=null; match.spawnWait=180; }
  }
  for (let i=0;i<fighters.length;i++) {
    const f=fighters[i], input=inputs[i];
    if (!f) continue;
    if (input) consumeConstructSuperInput(f, input);
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
  // Soft silhouette-shaped blue light makes it clear which fighter is in pickup range.
  // This is drawn behind the fighter, so it reads as a faint rim-light rather than a shield.
  ctx.globalAlpha=0.22; ctx.strokeStyle='#83eaff'; ctx.lineWidth=5; ctx.shadowColor='#55cfff'; ctx.shadowBlur=16;
  const headY=fy-33, shoulderY=fy-16, hipY=fy+7;
  ctx.beginPath(); ctx.arc(fx,headY,8,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fx,headY+8); ctx.lineTo(fx,hipY); ctx.moveTo(fx-9,shoulderY); ctx.lineTo(fx+9,shoulderY); ctx.moveTo(fx-8,shoulderY); ctx.lineTo(fx-14,fy-5); ctx.moveTo(fx+8,shoulderY); ctx.lineTo(fx+14,fy-5); ctx.moveTo(fx,hipY); ctx.lineTo(fx-9,fy+1); ctx.moveTo(fx,hipY); ctx.lineTo(fx+9,fy+1); ctx.stroke();
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
  // No floating label: the pickup is a mysterious physical Resonance artifact.
  // Layered facets, engraved seams, and orbiting shards provide the detail instead.
  ctx.strokeStyle='rgba(232,255,255,.92)';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-13,-15);ctx.lineTo(-5,-20);ctx.lineTo(7,-18);ctx.lineTo(14,-9);ctx.lineTo(13,7);ctx.lineTo(3,17);ctx.lineTo(-9,14);ctx.lineTo(-16,3);ctx.closePath();ctx.stroke();
  ctx.strokeStyle='rgba(15,102,190,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,-3);ctx.lineTo(-3,-10);ctx.lineTo(8,-4);ctx.lineTo(4,8);ctx.lineTo(-6,10);ctx.closePath();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(2,-14);ctx.lineTo(7,-6);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();
  ctx.restore();
}
// Detailed layered weapon illustration. Every family has a distinct silhouette, bevels,
// inset energy channels and animated parts; the weapon is rendered continuously while active.
