// charAttackConfigs.js — Per-character attack animation configs for ALL characters.
// Overhauled to faithfully map the Element 6 Move Animation Specification.
//
// Each character has 6 attacks: ss (side sig), us (up sig), ds (down sig),
// sh (side heavy), dh (down heavy), sp (super). Gens 1-4 also define pb (power button).
//
// Spec rules encoded:
//   - Side Heavy (sh) is the largest normal move (sizeMul 1.3-1.5).
//   - Side Sig (ss) is shorter/smaller but still distinctive (0.7-1.0).
//   - Up Sig (us) is vertical (launch).
//   - Down Sig (ds) controls the floor below or ahead (ground).
//   - Supers stay local to the user + nearby opponent (unique supers).
//   - Power Button (pb) entries exist only for Gens 1-4 (Gen 5 has its own).
//
// Format: [shapeType, particleType, color, sizeMul, effect]
//   shapeType: jab | slash | whip | launch | ground | slam | charge | radial | beam | illusion | portal | barrier | drain | lineBurst | lineArc | arcAround
//   particleType: bolt | flame | liquid | crystal | streak | rock | plant | cloud | dark | thread | clone | metal | slash | ring | glow | phase | spark
//   color: hex color string
//   sizeMul: size multiplier
//   effect: visual modifier string
//
// Super format: ['unique', color, particleType, ...params]  (routed to uniqueSupers.js)

import { GEN5_ATTACKS } from './gen5Attacks.js';

export const CHAR_ATTACKS = {
  // ═══════════════════════════════════════════════════════════════
  // ORIGINAL HERO — Purple (Ninja)
  // ═══════════════════════════════════════════════════════════════
  'purple': {
    ss: ['lineArc', 'dark', '#9944CC', 1.0, 'shadow'],      // high-speed dash cuts forward, stops at walls
    us: ['launch', 'dark', '#CC66FF', 1.0, 'spiral'],       // grappling line / wall-kick launch
    ds: ['ground', 'dark', '#6622AA', 0.8, 'pin'],          // smoke bomb + low sweep
    sh: ['arcAround', 'dark', '#9944CC', 1.4, 'shadow'],    // long ninja weapon arc sweeps sideways (largest)
    dh: ['slam', 'dark', '#9944CC', 1.3, 'shadow'],
    sp: ['unique', '#9944CC', 'dark', 'thousandShadows']
  },

  // ═══════════════════════════════════════════════════════════════
  // GEN 1 — Dawn of Heroes (Original Five)
  // ═══════════════════════════════════════════════════════════════

  // Thunder — Lightning
  'g1_thunder': {
    ss: ['jab', 'bolt', '#FFFF44', 0.8, 'crackle'],          // Static Rush: narrow streak dashes forward, spark burst
    us: ['launch', 'bolt', '#FFFF44', 1.0, 'coil'],         // Skyhook: bolt above pulls up, arcs below
    ds: ['ground', 'bolt', '#FFFF44', 0.7, 'fissure'],      // Grounded Storm: floor lightning forks, converges up
    sh: ['slash', 'bolt', '#FFFF44', 1.4, 'crackle'],       // Mountain Split: three staggered horizontal cuts (largest)
    dh: ['slam', 'bolt', '#FFFF44', 1.3, 'fissure'],
    sp: ['unique', '#FFFF44', 'bolt'],
    pb: ['jab', 'bolt', '#FFFF44', 0.7, 'crackle']          // Lightning Call: warning mark, one bolt
  },
  // Fire — Flame
  'g1_fire': {
    ss: ['jab', 'flame', '#FF6600', 0.9, 'wreath'],         // Flame Wheel: rolling ring of fire forward, low hit
    us: ['launch', 'flame', '#FF6600', 1.0, 'burst'],       // Rising Ember: fire geyser, two curling side flames
    ds: ['ground', 'flame', '#FF6600', 0.7, 'pillar'],      // Firefall: compact ground flame patch bursts up
    sh: ['slash', 'flame', '#FF6600', 1.4, 'wreath'],       // Inferno Breaker: huge flame fist sweeps sideways (largest)
    dh: ['slam', 'flame', '#FF6600', 1.3, 'ring'],
    sp: ['unique', '#FF6600', 'flame'],
    pb: ['jab', 'flame', '#FF6600', 0.8, 'ember']           // Flame Burst: small fireball, explodes on contact
  },
  // Water — Tide
  'g1_water': {
    ss: ['whip', 'liquid', '#3399CC', 0.9, 'wave'],         // Current Strike: short stream carries forward into wave
    us: ['launch', 'liquid', '#3399CC', 1.0, 'spout'],      // Rising Tide: water column up, bursts droplets
    ds: ['ground', 'liquid', '#3399CC', 0.7, 'wave'],      // Floodstep: low surge forward, pops up at end
    sh: ['slash', 'liquid', '#3399CC', 1.3, 'blade'],       // Breaker Arc: thick curved water blade whips across (largest)
    dh: ['slam', 'liquid', '#3399CC', 1.3, 'wave'],
    sp: ['unique', '#3399CC', 'liquid'],
    pb: ['whip', 'liquid', '#3399CC', 1.0, 'yank']          // Water Whip: tendril lashes, pulls opponent closer
  },
  // Grass — Growth
  'g1_grass': {
    ss: ['whip', 'plant', '#44AA44', 0.9, 'thorn'],         // Thorn Sweep: low fan of thin thorn vines forward
    us: ['launch', 'plant', '#44AA44', 1.0, 'vine'],        // Vine Lift: vertical vine coils, launches up
    ds: ['ground', 'plant', '#44AA44', 0.8, 'roots'],       // Root Snare: roots burst from floor, briefly hold
    sh: ['slam', 'plant', '#44AA44', 1.4, 'hammer'],        // Verdant Hammer: wooden hammer crashes sideways (largest)
    dh: ['slam', 'plant', '#44AA44', 1.3, 'tree'],
    sp: ['unique', '#44AA44', 'plant', 'overgrowth'],
    pb: ['whip', 'plant', '#44AA44', 1.0, 'vine']           // Vine Strike: one fast vine from ground, hits, retracts
  },
  // Ice — Frost
  'g1_ice': {
    ss: ['slash', 'crystal', '#AAEEFF', 0.9, 'frost'],      // Frost Drift: thin ice trail slides into low frosted strike
    us: ['launch', 'crystal', '#AAEEFF', 1.0, 'pillar'],    // Ice Pillar: sharp pillar erupts below, launches up
    ds: ['ground', 'crystal', '#AAEEFF', 0.7, 'frost'],    // Freeze Line: frost line along floor, briefly slows
    sh: ['slash', 'crystal', '#AAEEFF', 1.4, 'blade'],      // Glacier Edge: long crystal blade, one precise ice cut (largest)
    dh: ['slam', 'crystal', '#AAEEFF', 1.3, 'freeze'],
    sp: ['unique', '#AAEEFF', 'crystal'],
    pb: ['barrier', 'crystal', '#AAEEFF', 1.0, 'freeze']    // Ice Wall: short wall forms ahead, blocks, melts
  },

  // ═══════════════════════════════════════════════════════════════
  // GEN 2 — Kingdoms at War (The Eight)
  // ═══════════════════════════════════════════════════════════════

  // Renji — Iron
  'g2_renji': {
    ss: ['jab', 'metal', '#999999', 0.9, 'iron'],          // Iron Edge: narrow forearm blade thrusts forward
    us: ['launch', 'metal', '#999999', 1.0, 'spurs'],       // Steel Rising: metal spikes erupt beneath, launch up
    ds: ['ground', 'metal', '#999999', 0.8, 'spikes'],      // Iron Anchor: plates lock floor, short metal pulse forward
    sh: ['slash', 'metal', '#999999', 1.4, 'hammer'],       // Forged Fist: massive gauntlet swings sideways, fragments (largest)
    dh: ['slam', 'metal', '#999999', 1.3, 'iron'],
    sp: ['unique', '#999999', 'metal'],
    pb: ['ground', 'metal', '#999999', 1.0, 'bind']         // Iron Clamp: iron bands burst from floor, restrict
  },
  // Kaito — Ember
  'g2_kaito': {
    ss: ['charge', 'flame', '#FF4400', 0.9, 'ember'],      // Blaze Rush: short flame dash ends in knee strike
    us: ['launch', 'flame', '#FF4400', 1.0, 'boost'],       // Flare Jump: focused flame blast launches up
    ds: ['ground', 'flame', '#FF4400', 0.7, 'ember'],       // Ash Burst: downward impact, ash-and-ember pop
    sh: ['jab', 'flame', '#FF4400', 1.3, 'reckless'],      // Ember Break: compressed ember fist swings, sparks (largest)
    dh: ['slam', 'flame', '#FF4400', 1.3, 'shockwave'],
    sp: ['unique', '#FF4400', 'flame'],
    pb: ['jab', 'flame', '#FF4400', 0.8, 'ember']           // Ember Shot: compact ember projectile, tiny flame spot
  },
  // Hana — Tide
  'g2_hana': {
    ss: ['jab', 'liquid', '#33AAEE', 0.9, 'jet'],          // Flow Step: short stream carries forward into wave hit
    us: ['launch', 'liquid', '#33AAEE', 1.0, 'spout'],      // Water Column: narrow column launches up
    ds: ['ground', 'liquid', '#33AAEE', 0.7, 'tide'],       // Undertow: small floor current pulls inward
    sh: ['slash', 'liquid', '#33AAEE', 1.3, 'blade'],       // Tidal Crescent: broad crescent wave slices sideways (largest)
    dh: ['slam', 'liquid', '#33AAEE', 1.3, 'precise'],
    sp: ['unique', '#33AAEE', 'liquid'],
    pb: ['radial', 'liquid', '#33AAEE', 1.0, 'push']        // Water Push: direct blast pushes opponents away
  },
  // Daigo — Stone
  'g2_daigo': {
    ss: ['charge', 'rock', '#AA8855', 0.9, 'shove'],       // Stone Ram: stone shoulder guard drives forward
    us: ['launch', 'rock', '#AA8855', 1.0, 'pillar'],      // Rock Lift: rock pillar launches up
    ds: ['ground', 'rock', '#AA8855', 0.8, 'fissure'],      // Fault Line: short ground crack erupts into stone burst
    sh: ['slash', 'rock', '#AA8855', 1.4, 'hammer'],        // Boulder Knuckle: boulder fist smashes sideways, fragments (largest)
    dh: ['slam', 'rock', '#AA8855', 1.3, 'crack'],
    sp: ['unique', '#AA8855', 'rock'],
    pb: ['ground', 'rock', '#AA8855', 1.0, 'pillar']        // Stone Pillar: narrow pillar rises at marked spot, launches
  },
  // Suzu — Gale
  'g2_suzu': {
    ss: ['charge', 'streak', '#AAFFEE', 0.9, 'dash'],       // Crosswind: sideways dash leaves cross-shaped gust
    us: ['launch', 'streak', '#AAFFEE', 1.0, 'gust'],       // Sky Step: three compact air steps, launch up
    ds: ['ground', 'streak', '#AAFFEE', 0.7, 'downdraft'], // Wind Drop: spinning wind drill descends, landing gust
    sh: ['slash', 'streak', '#AAFFEE', 1.3, 'gust'],        // Gale Cutter: compressed wind crescent, spinning side kick (largest)
    dh: ['slam', 'streak', '#AAFFEE', 1.3, 'wind'],
    sp: ['unique', '#AAFFEE', 'streak'],
    pb: ['radial', 'streak', '#AAFFEE', 1.0, 'push']        // Gust Push: direct gust shoves opponents
  },
  // Mai — Dusk
  'g2_mai': {
    ss: ['jab', 'dark', '#664488', 0.9, 'wrap'],           // Dusk Slip: short floor-shadow trail, close slash
    us: ['launch', 'dark', '#664488', 1.0, 'step'],         // Night Rise: dark column launches up, catches above
    ds: ['ground', 'dark', '#664488', 0.7, 'pool'],         // Shadow Pool: small pool spreads below, briefly slows
    sh: ['slash', 'dark', '#664488', 1.3, 'blade'],         // Shadow Crescent: large sharp crescent sweeps sideways (largest)
    dh: ['slam', 'dark', '#664488', 1.3, 'spread'],
    sp: ['unique', '#664488', 'dark'],
    pb: ['whip', 'dark', '#664488', 1.0, 'tendril']         // Shadow Hand: hand sinks, emerges behind, slashes
  },
  // Osamu — Echo
  'g2_osamu': {
    ss: ['jab', 'spark', '#CCCCAA', 0.9, 'echo'],          // Echo Shot: sound sphere travels, rebounds once, fades
    us: ['launch', 'spark', '#CCCCAA', 1.0, 'echo'],        // Resonant Lift: vertical sound burst launches up
    ds: ['ground', 'spark', '#CCCCAA', 0.7, 'pulse'],       // Low Frequency: floor vibration forward, pops up
    sh: ['jab', 'spark', '#CCCCAA', 1.3, 'resonant'],      // Bellbreaker: dense soundwave arm, heavy impact ring (largest)
    dh: ['slam', 'spark', '#CCCCAA', 1.3, 'echo'],
    sp: ['unique', '#CCCCAA', 'spark'],
    pb: ['jab', 'spark', '#CCCCAA', 1.0, 'resonant']        // Resonance Lock: echo burst stuns 5s
  },
  // Yui — Starlight
  'g2_yui': {
    ss: ['jab', 'spark', '#FFFFCC', 0.8, 'glow'],          // Starlight Step: star springboard, short forward hit
    us: ['launch', 'spark', '#FFFFCC', 1.0, 'starlight'],  // Constellation Rise: vertical chain of stars up
    ds: ['ground', 'spark', '#FFFFCC', 0.7, 'heal'],        // Gentle Starfall: three stars fall, burst on contact
    sh: ['slash', 'spark', '#FFFFCC', 1.3, 'light'],        // Star Thread: thick luminous arc sweeps sideways (largest)
    dh: ['slam', 'spark', '#FFFFCC', 1.3, 'starlight'],
    sp: ['unique', '#FFFFCC', 'spark'],
    pb: ['radial', 'spark', '#FFFFCC', 1.0, 'heal']         // Restoration Light: starlight field restores health
  },

  // ── Gen 2 supporting cast (not in the Eight spec; tuned for consistency) ──
  'g2_ibuki': {
    ss: ['whip', 'dark', '#9944AA', 1.0, 'drain'],
    us: ['launch', 'dark', '#9944AA', 1.0, 'wisps'],
    ds: ['ground', 'dark', '#9944AA', 0.7, 'siphon'],
    sh: ['drain', 'dark', '#9944AA', 1.3, 'thread'],
    dh: ['slam', 'dark', '#9944AA', 1.3, 'drain'],
    sp: ['unique', '#9944AA', 'dark']
  },
  'g2_nishikawa': {
    ss: ['whip', 'thread', '#CC9944', 1.0, 'snap'],
    us: ['launch', 'thread', '#CC9944', 1.0, 'yank'],
    ds: ['ground', 'thread', '#CC9944', 0.8, 'net'],
    sh: ['jab', 'thread', '#CC9944', 1.3, 'haymaker'],
    dh: ['slam', 'thread', '#CC9944', 1.3, 'net'],
    sp: ['unique', '#CC9944', 'thread']
  },
  'g2_itto': {
    ss: ['slash', 'slash', '#DDDDDD', 0.9, 'blade'],
    us: ['launch', 'slash', '#DDDDDD', 1.0, 'rising'],
    ds: ['ground', 'slash', '#DDDDDD', 0.8, 'stab'],
    sh: ['charge', 'slash', '#DDDDDD', 1.3, 'lunge'],
    dh: ['slam', 'slash', '#DDDDDD', 1.3, 'overhead'],
    sp: ['unique', '#DDDDDD', 'slash']
  },
  'g2_twinfoxes': {
    ss: ['illusion', 'clone', '#FFAA44', 1.0, 'lash'],
    us: ['launch', 'clone', '#FFAA44', 1.0, 'swap'],
    ds: ['ground', 'clone', '#FFAA44', 0.8, 'decoy'],
    sh: ['charge', 'clone', '#FFAA44', 1.3, 'dash'],
    dh: ['slam', 'clone', '#FFAA44', 1.3, 'mirror'],
    sp: ['unique', '#FFAA44', 'clone']
  },
  'g2_utsuro': {
    ss: ['whip', 'dark', '#553377', 1.0, 'hollow'],
    us: ['launch', 'dark', '#553377', 1.0, 'dissolve'],
    ds: ['ground', 'dark', '#553377', 0.7, 'pool'],
    sh: ['charge', 'dark', '#553377', 1.3, 'grasp'],
    dh: ['slam', 'dark', '#553377', 1.3, 'hollow'],
    sp: ['unique', '#553377', 'dark']
  },

  // ═══════════════════════════════════════════════════════════════
  // GEN 3 — The Fallen Age
  // ═══════════════════════════════════════════════════════════════

  // Takeshi — Sand
  'g3_takeshi': {
    ss: ['ground', 'rock', '#DDBB88', 0.9, 'sand'],        // Sand Wave: low sand wave rolls forward
    us: ['launch', 'rock', '#DDBB88', 1.0, 'column'],      // Dune Rise: sand pillar launches up
    ds: ['ground', 'rock', '#DDBB88', 0.7, 'sand'],        // Burial Trap: shallow sand patch slows
    sh: ['jab', 'rock', '#DDBB88', 1.4, 'sand'],           // Sandbreaker: sand compacts into huge gauntlet side smash (largest)
    dh: ['slam', 'rock', '#DDBB88', 1.3, 'erupt'],
    sp: ['unique', '#DDBB88', 'rock'],
    pb: ['jab', 'rock', '#DDBB88', 1.0, 'blast']           // Scatter Gust: scattered sand forward, brief stun
  },
  // Aiko — Bone
  'g3_aiko': {
    ss: ['jab', 'rock', '#EEDDCC', 0.9, 'spike'],          // Bone Lance: thin bone spike shoots forward
    us: ['launch', 'rock', '#EEDDCC', 1.0, 'spurs'],        // Marrow Rise: layered bone plates launch up
    ds: ['ground', 'rock', '#EEDDCC', 0.8, 'spikes'],      // Bone Cage: short bone ribs rise in trapping arc
    sh: ['slash', 'rock', '#EEDDCC', 1.4, 'club'],         // Bone Cleaver: curved bone blade large side slash (largest)
    dh: ['slam', 'rock', '#EEDDCC', 1.3, 'ring'],
    sp: ['unique', '#EEDDCC', 'rock'],
    pb: ['radial', 'rock', '#EEDDCC', 1.0, 'spike']        // Bone Barrage: cluster of bone spikes tight spread
  },
  // Haru — Glass
  'g3_haru': {
    ss: ['slash', 'crystal', '#CCEEFF', 0.9, 'shard'],     // Shard Fan: short cone of glass shards forward
    us: ['launch', 'crystal', '#CCEEFF', 1.0, 'platform'], // Crystal Lift: glass pillar up, fractures at base
    ds: ['ground', 'crystal', '#CCEEFF', 0.7, 'shards'],   // Glass Lattice: floor lattice forms, breaks when crossed
    sh: ['slash', 'crystal', '#CCEEFF', 1.4, 'blade'],     // Glass Edge: long glass blade, horizontal cut, refracted afterimage (largest)
    dh: ['slam', 'crystal', '#CCEEFF', 1.3, 'shatter'],
    sp: ['unique', '#CCEEFF', 'crystal'],
    pb: ['barrier', 'crystal', '#CCEEFF', 1.0, 'freeze']   // Mirror Pane: reflective panel redirects one projectile
  },
  // Chiyo — Venom
  'g3_chiyo': {
    ss: ['jab', 'liquid', '#88DD44', 0.9, 'venom'],        // Venom Flick: venom glob arcs forward, bursts on impact
    us: ['launch', 'liquid', '#88DD44', 1.0, 'cloud'],     // Toxic Rise: venom burst launches up
    ds: ['ground', 'liquid', '#88DD44', 0.7, 'pool'],      // Poison Mark: small floor mark, brief slow
    sh: ['slash', 'liquid', '#88DD44', 1.3, 'venom'],      // Toxic Fang: curved venom blade slices sideways (largest)
    dh: ['slam', 'liquid', '#88DD44', 1.3, 'spread'],
    sp: ['unique', '#88DD44', 'liquid'],
    pb: ['jab', 'liquid', '#88DD44', 1.0, 'venom']         // Venom Spit: venom shot, short slow + light damage
  },
  // Emi — Blood Sense / Medical
  'g3_emi': {
    ss: ['jab', 'liquid', '#CC3344', 0.8, 'precise'],      // Pulse Dart: tiny red pulse projectile marks target
    us: ['launch', 'spark', '#CC3344', 0.9, 'light'],       // Heartbeat Lift: rhythmic red pulse launches up
    ds: ['ground', 'spark', '#CC3344', 0.7, 'sense'],       // Vital Scan: circular pulse expands along floor
    sh: ['jab', 'liquid', '#CC3344', 1.3, 'target'],        // Pressure Point: sharp close strike, red pulse impact (largest)
    dh: ['slam', 'spark', '#CC3344', 1.3, 'focus'],
    sp: ['unique', '#CC3344', 'liquid'],
    pb: ['jab', 'liquid', '#CC3344', 1.0, 'drain']          // Blood Sword: red blood sword 12s, 1.2x damage
  },
  // Nozomi — Thorn Vines
  'g3_nozomi': {
    ss: ['whip', 'plant', '#448833', 0.9, 'thorn'],        // Thorn Sweep: two ground vines sweep forward
    us: ['launch', 'plant', '#448833', 1.0, 'vine'],        // Vine Launch: vine coils, pulls upward
    ds: ['ground', 'plant', '#448833', 0.8, 'thorns'],     // Root Trap: thorny roots rise from floor patch
    sh: ['whip', 'plant', '#448833', 1.4, 'thorn'],         // Briar Lash: thick thorn vine snaps sideways, long range (largest)
    dh: ['slam', 'plant', '#448833', 1.3, 'roots'],
    sp: ['unique', '#448833', 'plant', 'thornOvergrowth'],
    pb: ['radial', 'plant', '#448833', 1.0, 'thorn']       // Thorn Volley: several small thorn vines burst in spread
  },
  // Masaru — Ash
  'g3_masaru': {
    ss: ['jab', 'cloud', '#998877', 0.9, 'reckless'],      // Ash Rush: close ash cloud surges into strike
    us: ['launch', 'cloud', '#998877', 1.0, 'plume'],       // Ash Column: vertical ash blast launches up
    ds: ['ground', 'cloud', '#998877', 0.7, 'ash'],         // Ash Cloud: low ash cloud obscures floor
    sh: ['slam', 'cloud', '#998877', 1.4, 'hammer'],        // Ash Hammer: ash compacts into massive side hammer (largest)
    dh: ['slam', 'cloud', '#998877', 1.3, 'burst'],
    sp: ['unique', '#998877', 'cloud'],
    pb: ['jab', 'cloud', '#998877', 1.0, 'wild']           // Ash Flash: dense ash blast, direct hit stuns
  },
  // Ryo — Mist
  'g3_ryo': {
    ss: ['jab', 'cloud', '#AABBCC', 0.9, 'mist'],          // Fade Step: short mist slide ends in quick hit
    us: ['launch', 'cloud', '#AABBCC', 1.0, 'dissolve'],    // Cloud Rise: mist burst launches up
    ds: ['ground', 'cloud', '#AABBCC', 0.7, 'cloak'],       // Mist Veil: low mist layer spreads nearby
    sh: ['slash', 'cloud', '#AABBCC', 1.3, 'mist'],         // Mist Blade: compressed mist sharp side blade at impact (largest)
    dh: ['slam', 'cloud', '#AABBCC', 1.3, 'mist'],
    sp: ['unique', '#AABBCC', 'cloud'],
    pb: ['jab', 'cloud', '#AABBCC', 1.0, 'mist']           // Mist Ambush: mist cloud at opponent, hidden strike stuns
  },
  // Souta — Developing Ash
  'g3_souta': {
    ss: ['jab', 'cloud', '#BBAA99', 0.8, 'clumsy'],        // Cinder Slide: short ash slide ends in cinder burst
    us: ['launch', 'cloud', '#BBAA99', 0.9, 'small'],      // Ash Lift: loose ash plume launches up
    ds: ['ground', 'cloud', '#BBAA99', 0.6, 'light'],      // Cinder Patch: small ash-and-cinder patch slows
    sh: ['jab', 'cloud', '#BBAA99', 1.2, 'unpolished'],    // Ash Claw: rough ash claws rake sideways (largest)
    dh: ['slam', 'cloud', '#BBAA99', 1.1, 'small'],
    sp: ['unique', '#BBAA99', 'cloud'],
    pb: ['jab', 'cloud', '#BBAA99', 0.9, 'clumsy']         // Cinder Snap: close cinder blast, brief stun
  },
  // ── Gen 3 supporting cast ──
  'g3_ogata': {
    ss: ['jab', 'liquid', '#DD66CC', 1.0, 'syringe'],
    us: ['launch', 'liquid', '#DD66CC', 1.0, 'inject'],
    ds: ['ground', 'liquid', '#DD66CC', 0.7, 'vial'],
    sh: ['jab', 'liquid', '#DD66CC', 1.3, 'overcharge'],
    dh: ['slam', 'liquid', '#DD66CC', 1.3, 'unstable'],
    sp: ['unique', '#DD66CC', 'liquid']
  },
  'g3_kanenobu': {
    ss: ['jab', 'metal', '#DDBB44', 1.0, 'cane'],
    us: ['launch', 'metal', '#DDBB44', 1.0, 'platform'],
    ds: ['ground', 'metal', '#DDBB44', 0.8, 'construct'],
    sh: ['slash', 'metal', '#DDBB44', 1.3, 'sweep'],
    dh: ['slam', 'metal', '#DDBB44', 1.3, 'construct'],
    sp: ['unique', '#DDBB44', 'metal']
  },

  // ═══════════════════════════════════════════════════════════════
  // GEN 4 — Hero Corps / Controller Era
  // ═══════════════════════════════════════════════════════════════

  // Cobalt — Barrier Constructs
  'g4_cobalt': {
    ss: ['barrier', 'metal', '#4466EE', 0.9, 'barrier'],   // two narrow barrier panels close together in front
    us: ['launch', 'metal', '#4466EE', 1.0, 'platform'],   // rising barrier column launches up
    ds: ['ground', 'metal', '#4466EE', 0.7, 'barrier'],    // low barrier ridge pushes along floor
    sh: ['slash', 'metal', '#4466EE', 1.3, 'barrier'],      // broad barrier slab sweeps sideways (largest)
    dh: ['slam', 'metal', '#4466EE', 1.3, 'dome'],
    sp: ['unique', '#4466EE', 'metal'],
    pb: ['charge', 'metal', '#4466EE', 1.0, 'shove']        // moving barrier panel advances, pushes
  },
  // Cyan — Wind
  'g4_cyan': {
    ss: ['charge', 'streak', '#66CCFF', 0.9, 'dash'],      // low crosswind dash cuts forward
    us: ['launch', 'streak', '#66CCFF', 1.0, 'current'],    // vertical gust launches up
    ds: ['ground', 'streak', '#66CCFF', 0.7, 'gust'],      // downward wind burst pushes on landing
    sh: ['slash', 'streak', '#66CCFF', 1.3, 'wind'],        // wide wind blade slices sideways (largest)
    dh: ['slam', 'streak', '#66CCFF', 1.3, 'wind'],
    sp: ['unique', '#66CCFF', 'streak'],
    pb: ['radial', 'streak', '#66CCFF', 1.0, 'push']        // targeted wind stream carries opponent sideways
  },
  // Onyx — Shadow
  'g4_onyx': {
    ss: ['whip', 'dark', '#332244', 0.9, 'tendril'],       // shadow trail slides under, erupts into upper slash
    us: ['launch', 'dark', '#332244', 1.0, 'step'],         // shadow column launches up
    ds: ['ground', 'dark', '#332244', 0.7, 'pool'],        // small shadow pool briefly tethers
    sh: ['slash', 'dark', '#332244', 1.3, 'blade'],        // heavy shadow blade sweeps sideways (largest)
    dh: ['slam', 'dark', '#332244', 1.3, 'spread'],
    sp: ['unique', '#332244', 'dark'],
    pb: ['jab', 'dark', '#332244', 1.0, 'phase']           // enter one shadow, exit another within short range
  },
  // Gold — Restoration / Light
  'g4_gold': {
    ss: ['jab', 'spark', '#FFCC44', 0.9, 'glow'],          // gold light orb rolls forward, bursts softly
    us: ['launch', 'spark', '#FFCC44', 1.0, 'heat'],        // pillar of warm light launches up
    ds: ['ground', 'spark', '#FFCC44', 0.7, 'glow'],       // small restoration circle on floor
    sh: ['slash', 'spark', '#FFCC44', 1.3, 'light'],        // bright light blade sweeps sideways (largest)
    dh: ['slam', 'spark', '#FFCC44', 1.3, 'glow'],
    sp: ['unique', '#FFCC44', 'spark'],
    pb: ['radial', 'spark', '#FFCC44', 1.0, 'heal']         // gold beam restores health/resource to ally/self
  },
  // Vermilion — Fire
  'g4_vermilion': {
    ss: ['charge', 'flame', '#FF3300', 0.9, 'crackle'],    // burning dash ends in short strike
    us: ['launch', 'flame', '#FF3300', 1.0, 'boost'],      // flame jet launches up
    ds: ['ground', 'flame', '#FF3300', 0.7, 'flame'],      // ground flame burst pops up in front
    sh: ['jab', 'flame', '#FF3300', 1.3, 'wreath'],         // large vermilion flame fist crashes sideways (largest)
    dh: ['slam', 'flame', '#FF3300', 1.3, 'erupt'],
    sp: ['unique', '#FF3300', 'flame'],
    pb: ['jab', 'flame', '#FF3300', 1.0, 'wreath']         // direct fire wave rolls forward short range
  },
  // Umber — Tremor-Sense / Martial Arts
  'g4_umber': {
    ss: ['ground', 'rock', '#886644', 0.9, 'tremor'],       // low sweep follows brief tremor warning
    us: ['launch', 'rock', '#886644', 1.0, 'pillar'],       // stomped earth pulse launches up
    ds: ['ground', 'rock', '#886644', 0.7, 'tremor'],      // circular tremor bursts around
    sh: ['jab', 'rock', '#886644', 1.3, 'shove'],           // heavy palm strike sends short ground tremor sideways (largest)
    dh: ['slam', 'rock', '#886644', 1.3, 'crack'],
    sp: ['unique', '#886644', 'rock'],
    pb: ['radial', 'rock', '#886644', 1.0, 'sense']         // floor pulse reveals opponents through terrain
  },
  // Graphite — Resonance Analysis
  'g4_graphite': {
    ss: ['jab', 'spark', '#778899', 0.9, 'pulse'],         // small resonance probe travels, sticks to first target
    us: ['launch', 'spark', '#778899', 1.0, 'resonance'],   // resonance lift launches up
    ds: ['ground', 'spark', '#778899', 0.7, 'pulse'],       // low-frequency floor wave travels forward
    sh: ['jab', 'spark', '#778899', 1.3, 'resonant'],      // dense analysis-wave wraps arm, hits sideways (largest)
    dh: ['slam', 'spark', '#778899', 1.3, 'resonance'],
    sp: ['unique', '#778899', 'spark'],
    pb: ['radial', 'spark', '#778899', 1.0, 'pulse']       // scanning pulse marks opponent's next attack start-up
  },
  // Daichi — Resonance-Tech Engineer
  'g4_daichi': {
    ss: ['jab', 'metal', '#FFAA33', 0.9, 'gadget'],        // small resonance mine skims forward, pops once
    us: ['launch', 'streak', '#FFAA33', 1.0, 'rocket'],     // boot-mounted impulse launches up
    ds: ['ground', 'spark', '#FFAA33', 0.7, 'gadget'],     // floor emitter sends short forward pulse
    sh: ['slash', 'metal', '#FFAA33', 1.3, 'hammer'],       // powered gauntlet heavy side punch (largest)
    dh: ['slam', 'metal', '#FFAA33', 1.3, 'mech'],
    sp: ['unique', '#FFAA33', 'metal'],
    pb: ['radial', 'spark', '#FFAA33', 1.0, 'gadget']       // temporary beacon disrupts projectiles/effects
  },
  // Renko — lore power not specified; keep existing (no pb invented)
  'g4_renko': {
    ss: ['jab', 'glow', '#CC4488', 1.0, 'drain'],
    us: ['launch', 'glow', '#CC4488', 1.0, 'stolen'],
    ds: ['ground', 'glow', '#CC4488', 0.7, 'drain'],
    sh: ['jab', 'glow', '#CC4488', 1.2, 'drain'],
    dh: ['slam', 'glow', '#CC4488', 1.3, 'drain'],
    sp: ['unique', '#CC4488', 'glow']
  },

  // ═══════════════════════════════════════════════════════════════
  // GEN 5 — Heroes of Color (imported from gen5Attacks.js)
  // ═══════════════════════════════════════════════════════════════
  ...GEN5_ATTACKS,
};

// ── Fallback for custom characters: derive a config from power name ──
export function getFallbackConfig(power, color) {
  const p = (power || '').toLowerCase();
  const c = color || '#AA44FF';
  if (p.includes('fire') || p.includes('flame') || p.includes('ember'))
    return { ss: ['jab', 'flame', c, 0.9, 'wreath'], us: ['launch', 'flame', c, 1.0, 'burst'], ds: ['ground', 'flame', c, 0.7, 'pillar'], sh: ['slash', 'flame', c, 1.4, 'wreath'], dh: ['slam', 'flame', c, 1.3, 'ring'], sp: ['sweep', c, 'flame', 300, 1] };
  if (p.includes('water') || p.includes('tide'))
    return { ss: ['whip', 'liquid', c, 0.9, 'wave'], us: ['launch', 'liquid', c, 1.0, 'spout'], ds: ['ground', 'liquid', c, 0.7, 'wave'], sh: ['slash', 'liquid', c, 1.3, 'blade'], dh: ['slam', 'liquid', c, 1.3, 'wave'], sp: ['sweep', c, 'liquid', 300, 1] };
  if (p.includes('lightning') || p.includes('thunder') || p.includes('electric'))
    return { ss: ['jab', 'bolt', c, 0.8, 'crackle'], us: ['launch', 'bolt', c, 1.0, 'coil'], ds: ['ground', 'bolt', c, 0.7, 'fissure'], sh: ['slash', 'bolt', c, 1.4, 'crackle'], dh: ['slam', 'bolt', c, 1.3, 'fissure'], sp: ['fromSky', c, 'bolt', 1] };
  if (p.includes('ice') || p.includes('frost') || p.includes('snow') || p.includes('cold'))
    return { ss: ['slash', 'crystal', c, 0.9, 'frost'], us: ['launch', 'crystal', c, 1.0, 'pillar'], ds: ['ground', 'crystal', c, 0.7, 'frost'], sh: ['slash', 'crystal', c, 1.4, 'blade'], dh: ['slam', 'crystal', c, 1.3, 'freeze'], sp: ['engulf', c, 'crystal', 'freeze'] };
  if (p.includes('shadow') || p.includes('dusk') || p.includes('dark'))
    return { ss: ['whip', 'dark', c, 0.9, 'tendril'], us: ['launch', 'dark', c, 1.0, 'step'], ds: ['ground', 'dark', c, 0.7, 'pool'], sh: ['slash', 'dark', c, 1.3, 'blade'], dh: ['slam', 'dark', c, 1.3, 'spread'], sp: ['multiStrike', c, 'dark', 6, 'shadow'] };
  if (p.includes('stone') || p.includes('earth') || p.includes('rock') || p.includes('tremor'))
    return { ss: ['charge', 'rock', c, 0.9, 'shove'], us: ['launch', 'rock', c, 1.0, 'pillar'], ds: ['ground', 'rock', c, 0.8, 'fissure'], sh: ['slash', 'rock', c, 1.4, 'hammer'], dh: ['slam', 'rock', c, 1.3, 'crack'], sp: ['construct', c, 'rock', 'stoneWall'] };
  if (p.includes('wind') || p.includes('gale') || p.includes('air'))
    return { ss: ['charge', 'streak', c, 0.9, 'dash'], us: ['launch', 'streak', c, 1.0, 'gust'], ds: ['ground', 'streak', c, 0.7, 'downdraft'], sh: ['slash', 'streak', c, 1.3, 'gust'], dh: ['slam', 'streak', c, 1.3, 'wind'], sp: ['engulf', c, 'streak', 'cyclone'] };
  if (p.includes('vine') || p.includes('plant') || p.includes('growth') || p.includes('nature'))
    return { ss: ['whip', 'plant', c, 0.9, 'thorn'], us: ['launch', 'plant', c, 1.0, 'vine'], ds: ['ground', 'plant', c, 0.8, 'roots'], sh: ['slam', 'plant', c, 1.4, 'hammer'], dh: ['slam', 'plant', c, 1.3, 'roots'], sp: ['unique', c, 'plant', 'overgrowth'] };
  if (p.includes('metal') || p.includes('iron') || p.includes('steel'))
    return { ss: ['jab', 'metal', c, 0.9, 'iron'], us: ['launch', 'metal', c, 1.0, 'spurs'], ds: ['ground', 'metal', c, 0.8, 'spikes'], sh: ['slash', 'metal', c, 1.4, 'hammer'], dh: ['slam', 'metal', c, 1.3, 'iron'], sp: ['combo', c, 'metal', 8, 1.2] };
  if (p.includes('speed') || p.includes('enhance'))
    return { ss: ['jab', 'streak', c, 0.8, 'trail'], us: ['launch', 'streak', c, 1.0, 'burst'], ds: ['ground', 'streak', c, 0.7, 'trail'], sh: ['charge', 'streak', c, 1.4, 'trail'], dh: ['slam', 'streak', c, 1.3, 'trail'], sp: ['combo', c, 'streak', 16, 3.0] };
  // Generic fallback
  return { ss: ['jab', 'glow', c, 0.9, 'glow'], us: ['launch', 'glow', c, 1.0, 'glow'], ds: ['ground', 'glow', c, 0.7, 'ring'], sh: ['slash', 'glow', c, 1.3, 'trail'], dh: ['slam', 'glow', c, 1.3, 'burst'], sp: ['burst', c, 'glow', 1.5] };
}