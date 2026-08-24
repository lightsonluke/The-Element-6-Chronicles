// gen5Attacks.js — Gen 5 per-character attack animation configs.
// Each character's 6 attacks match their unique combat style descriptions.
// Format: [shapeType, particleType, color, sizeMul, effect]

export const GEN5_ATTACKS = {
  // ═══════════════════════════════════════════════════════════════
  // GEN 5 HEROES
  // ═══════════════════════════════════════════════════════════════

  // Yellow — super speed / enhanced strength: the runner who glowed gold
  'yellow': {
    ss: ['jab', 'streak', '#FFFF00', 0.7, 'trail'],        // speed-jab, very fast
    us: ['launch', 'streak', '#FFFF00', 1.0, 'burst'],     // explosive speed-boosted leap
    ds: ['ground', 'streak', '#FFFF00', 0.6, 'trail'],     // quick stomp with speed burst
    sh: ['charge', 'streak', '#FFFF00', 1.4, 'trail'],      // full sprinting heavy tackle
    dh: ['slam', 'streak', '#FFFF00', 1.3, 'shockwave'],   // slam at max speed, shockwave
    sp: ['unique', '#FFFF00', 'streak']            // golden speed limit break
  },

  // Blue — water manipulation / freeze
  'blue': {
    ss: ['whip', 'liquid', '#3399FF', 1.0, 'wave'],         // water whip lash
    us: ['launch', 'liquid', '#3399FF', 1.0, 'spout'],      // rising water spout
    ds: ['ground', 'liquid', '#3399FF', 0.7, 'wave'],       // small wave at feet
    sh: ['charge', 'liquid', '#3399FF', 1.2, 'fist'],       // heavy water-fist strike
    dh: ['slam', 'crystal', '#3399FF', 1.3, 'freeze'],      // freezing wave burst
    sp: ['unique', '#3399FF', 'liquid', 'freezeWall']        // rising water wall that freezes
  },

  // Purple — shadow / teleport
  'purple': {
    ss: ['lineArc', 'dark', '#9933CC', 1.0, 'shadow'],       // line out then arc blooms
    us: ['launch', 'dark', '#9933CC', 1.0, 'step'],         // teleport upward from shadow
    ds: ['ground', 'dark', '#9933CC', 0.7, 'pool'],         // shadow pool beneath
    sh: ['arcAround', 'dark', '#9933CC', 1.3, 'shadow'],     // arc sweeps around
    dh: ['slam', 'dark', '#9933CC', 1.3, 'burst'],          // shadows burst outward
    sp: ['unique', '#9933CC', 'dark', 'thousandShadows']    // shadow clones slash from all angles
  },

  // Orange — portals
  'orange': {
    ss: ['portal', 'ring', '#FF8800', 1.0, 'portal'],       // strike out of a portal
    us: ['launch', 'ring', '#FF8800', 1.0, 'portal'],       // portals upward
    ds: ['ground', 'ring', '#FF8800', 0.7, 'portal'],       // portal opens at feet
    sh: ['portal', 'ring', '#FF8800', 1.2, 'portal'],       // heavy strike through mid-swing portal
    dh: ['slam', 'ring', '#FF8800', 1.3, 'portal'],         // portal bursts from below
    sp: ['unique', '#FF8800', 'ring']     // dimensional portal collapse
  },

  // Green — stone / earth
  'green': {
    ss: ['jab', 'rock', '#66AA44', 1.0, 'push'],            // stone-fist push
    us: ['launch', 'rock', '#66AA44', 1.0, 'pillar'],       // stone pillar boosts up
    ds: ['ground', 'rock', '#66AA44', 0.8, 'spikes'],       // stone spikes rise
    sh: ['charge', 'rock', '#66AA44', 1.3, 'shove'],        // heavy stone-armored shove
    dh: ['slam', 'rock', '#66AA44', 1.4, 'crack'],          // cracks ground outward
    sp: ['unique', '#66AA44', 'rock']       // continental shift
  },

  // Pink — telekinesis
  'pink': {
    ss: ['radial', 'glow', '#FF66CC', 1.0, 'push'],         // telekinetic push, pure force
    us: ['launch', 'glow', '#FF66CC', 1.0, 'float'],        // floats upward
    ds: ['ground', 'glow', '#FF66CC', 0.7, 'pulse'],        // telekinetic pulse
    sh: ['charge', 'glow', '#FF66CC', 1.2, 'throw'],        // heavy telekinetic throw
    dh: ['slam', 'glow', '#FF66CC', 1.3, 'crush'],          // telekinetic crush
    sp: ['unique', '#FF66CC', 'glow']             // telekinetic storm
  },

  // Grey — barriers / walls
  'grey': {
    ss: ['barrier', 'metal', '#AAAAAA', 1.0, 'barrier'],    // barrier-fist jab
    us: ['launch', 'metal', '#AAAAAA', 1.0, 'platform'],    // barrier platform lifts up
    ds: ['ground', 'metal', '#AAAAAA', 0.7, 'barrier'],    // small barrier bursts
    sh: ['charge', 'metal', '#AAAAAA', 1.2, 'shove'],      // heavy barrier-charged shove
    dh: ['slam', 'metal', '#AAAAAA', 1.3, 'dome'],          // barrier dome bursts
    sp: ['unique', '#AAAAAA', 'metal']   // citadel fortress
  },

  // Turquoise — shapeshifting
  'turquoise': {
    ss: ['jab', 'clone', '#44DDCC', 1.0, 'shift'],          // shifting-form jab
    us: ['launch', 'clone', '#44DDCC', 1.0, 'shift'],       // shifts to lighter form, leaps
    ds: ['ground', 'clone', '#44DDCC', 0.7, 'shift'],      // brief shift, small shockwave
    sh: ['jab', 'clone', '#44DDCC', 1.2, 'mimic'],          // heavy mimic-strike
    dh: ['slam', 'clone', '#44DDCC', 1.3, 'shift'],          // slam in heavier shifted form
    sp: ['unique', '#44DDCC', 'clone']             // apex evolution
  },

  // Olive — size manipulation
  'olive': {
    ss: ['jab', 'ring', '#88AA33', 0.7, 'shrink'],         // quick jab while shrinking
    us: ['launch', 'ring', '#88AA33', 0.9, 'shrink'],       // shrinks to leap up
    ds: ['ground', 'ring', '#88AA33', 0.8, 'grow'],        // grows briefly for stomp
    sh: ['charge', 'ring', '#88AA33', 1.4, 'grow'],        // grows large for heavy shove
    dh: ['slam', 'ring', '#88AA33', 1.6, 'giant'],          // slams down at giant size
    sp: ['unique', '#88AA33', 'ring', 'giantSlam']         // shrinks battlefield, grows back with slam
  },

  // Copper — freezing objects mid-air
  'copper': {
    ss: ['jab', 'crystal', '#CC9966', 1.0, 'freeze'],       // freeze-touch jab
    us: ['launch', 'crystal', '#CC9966', 1.0, 'freeze'],    // freezes air to launch up
    ds: ['ground', 'crystal', '#CC9966', 0.7, 'freeze'],   // freezes ground at feet
    sh: ['charge', 'crystal', '#CC9966', 1.2, 'freeze'],   // heavy freeze-charged strike
    dh: ['slam', 'crystal', '#CC9966', 1.3, 'freeze'],      // freezes outward in burst
    sp: ['unique', '#CC9966', 'crystal', 'freezeBurst']    // freezes everything, strikes freely
  },

  // Emerald — phasing / intangibility
  'emerald': {
    ss: ['jab', 'phase', '#44CC88', 1.0, 'phase'],          // phased-through jab
    us: ['launch', 'phase', '#44CC88', 1.0, 'phase'],       // phases upward through geometry
    ds: ['ground', 'phase', '#44CC88', 0.7, 'phase'],       // phases, burst at feet
    sh: ['charge', 'phase', '#44CC88', 1.2, 'phase'],       // heavy phased lunge
    dh: ['slam', 'phase', '#44CC88', 1.3, 'phase'],         // phasing outward slam
    sp: ['unique', '#44CC88', 'phase']    // ghost realm
  },

  // Pearl — echolocation / enhanced senses
  'pearl': {
    ss: ['jab', 'spark', '#EEEEDD', 1.0, 'glow'],           // sound-guided jab, tracks opponent
    us: ['launch', 'spark', '#EEEEDD', 1.0, 'pulse'],      // sound-pulse boosts up
    ds: ['ground', 'spark', '#EEEEDD', 0.7, 'pulse'],       // sound pulse at feet
    sh: ['charge', 'spark', '#EEEEDD', 1.2, 'glow'],        // heavy sound-guided strike
    dh: ['slam', 'spark', '#EEEEDD', 1.3, 'glow'],          // sound shockwave bursts
    sp: ['unique', '#EEEEDD', 'spark']       // symphony of echoes
  },

  // Red — controlled energy orbs
  'red': {
    ss: ['radial', 'glow', '#EE3344', 0.9, 'ring'],        // quick energy-orb toss
    us: ['launch', 'glow', '#EE3344', 1.0, 'ring'],         // orb-boosted jump
    ds: ['ground', 'glow', '#EE3344', 0.7, 'ring'],         // small orb burst
    sh: ['charge', 'glow', '#EE3344', 1.3, 'ring'],         // heavy charged orb throw
    dh: ['slam', 'glow', '#EE3344', 1.3, 'ring'],           // orb bursts outward
    sp: ['unique', '#EE3344', 'glow']              // phoenix inferno volley
  },

  // Lavender — air platforms / constructs
  'lavender': {
    ss: ['jab', 'ring', '#CC99FF', 1.0, 'glow'],           // air-construct jab
    us: ['launch', 'ring', '#CC99FF', 1.0, 'platform'],     // air platform launches up
    ds: ['ground', 'ring', '#CC99FF', 0.7, 'glow'],         // small air burst
    sh: ['charge', 'ring', '#CC99FF', 1.2, 'shove'],        // heavy air-platform shove
    dh: ['slam', 'ring', '#CC99FF', 1.3, 'glow'],           // air constructs burst
    sp: ['unique', '#CC99FF', 'ring']         // crystal atmosphere
  },

  // Amber — duplication / clones
  'amber': {
    ss: ['illusion', 'clone', '#FFBB44', 1.0, 'clone'],     // jab backed by clone assist
    us: ['launch', 'clone', '#FFBB44', 1.0, 'clone'],       // clone boosts upward
    ds: ['ground', 'clone', '#FFBB44', 0.7, 'clone'],       // clone strikes at feet
    sh: ['illusion', 'clone', '#FFBB44', 1.2, 'clone'],     // heavy strike with duplicate
    dh: ['slam', 'clone', '#FFBB44', 1.3, 'clone'],         // slam with duplicates
    sp: ['unique', '#FFBB44', 'clone']   // clone army
  },

  // Black — lightning
  'black': {
    ss: ['jab', 'bolt', '#333333', 0.9, 'crackle'],        // quick lightning jab
    us: ['launch', 'bolt', '#333333', 1.0, 'crackle'],      // lightning boosts up
    ds: ['ground', 'bolt', '#333333', 0.7, 'crackle'],     // small static burst
    sh: ['charge', 'bolt', '#333333', 1.2, 'crackle'],      // heavy lightning-charged strike
    dh: ['slam', 'bolt', '#333333', 1.3, 'crackle'],       // lightning bursts outward
    sp: ['unique', '#333333', 'bolt']               // judgment storm
  },

  // Magenta — binding / adhesive constructs
  'magenta': {
    ss: ['jab', 'thread', '#CC44CC', 1.0, 'bind'],          // binding-construct jab
    us: ['launch', 'thread', '#CC44CC', 1.0, 'adhesive'],   // adhesive line pulls up
    ds: ['ground', 'thread', '#CC44CC', 0.7, 'bind'],       // binding burst
    sh: ['charge', 'thread', '#CC44CC', 1.2, 'bind'],       // heavy binding strike, restrains
    dh: ['slam', 'thread', '#CC44CC', 1.3, 'bind'],         // binding constructs burst
    sp: ['unique', '#CC44CC', 'thread']       // world adhesive
  },

  // Indigo — gravity
  'indigo': {
    ss: ['jab', 'ring', '#4466AA', 1.0, 'push'],            // gravity-push jab, invisible force
    us: ['launch', 'ring', '#4466AA', 1.0, 'lift'],         // gravity lift, weightless
    ds: ['ground', 'ring', '#4466AA', 0.7, 'ring'],         // gravity pulse, slight pull
    sh: ['charge', 'ring', '#4466AA', 1.2, 'push'],         // heavy gravity strike, pull-in
    dh: ['slam', 'ring', '#4466AA', 1.3, 'ring'],           // gravity well bursts
    sp: ['unique', '#4466AA', 'ring']      // singularity
  },

  // Maroon — energy absorption
  'maroon': {
    ss: ['jab', 'glow', '#883322', 1.0, 'drain'],          // absorbing jab, gains charge
    us: ['launch', 'glow', '#883322', 1.0, 'drain'],        // absorbed-energy boost
    ds: ['ground', 'glow', '#883322', 0.7, 'drain'],        // absorbing pulse
    sh: ['charge', 'glow', '#883322', 1.3, 'drain'],       // absorption-charged strike
    dh: ['slam', 'glow', '#883322', 1.3, 'drain'],          // releases absorbed energy
    sp: ['unique', '#883322', 'glow']                 // infinite reactor
  },

  // Crimson — explosive destructive force
  'crimson': {
    ss: ['jab', 'flame', '#DD2222', 1.0, 'wreath'],        // quick explosive jab, small detonation
    us: ['launch', 'flame', '#DD2222', 1.0, 'burst'],       // explosive boost
    ds: ['ground', 'flame', '#DD2222', 0.7, 'ember'],      // small detonation
    sh: ['charge', 'flame', '#DD2222', 1.4, 'wreath'],     // heavy explosive haymaker
    dh: ['slam', 'flame', '#DD2222', 1.5, 'burst'],         // big detonation
    sp: ['unique', '#DD2222', 'flame']                // endless arsenal
  },

  // Scarlet — death-energy sensing / spirit energy
  'scarlet': {
    ss: ['jab', 'spark', '#CC3366', 1.0, 'glow'],          // spirit-energy jab, translucent trail
    us: ['launch', 'spark', '#CC3366', 1.0, 'glow'],        // spirit energy boosts up
    ds: ['ground', 'spark', '#CC3366', 0.7, 'glow'],        // spirit pulse
    sh: ['charge', 'spark', '#CC3366', 1.2, 'glow'],        // heavy spirit-charged strike
    dh: ['slam', 'spark', '#CC3366', 1.3, 'glow'],          // spirit energy bursts
    sp: ['unique', '#CC3366', 'spark']      // army of the fallen
  },

  // White — flight
  'white': {
    ss: ['jab', 'streak', '#FFFFFF', 1.0, 'trail'],        // flying jab, mid-hover
    us: ['launch', 'streak', '#FFFFFF', 1.2, 'trail'],      // flies upward, best vertical recovery
    ds: ['ground', 'streak', '#FFFFFF', 0.7, 'trail'],    // light stomp from hover
    sh: ['charge', 'streak', '#FFFFFF', 1.3, 'trail'],     // heavy diving strike from altitude
    dh: ['slam', 'streak', '#FFFFFF', 1.3, 'trail'],       // slam from dive
    sp: ['unique', '#FFFFFF', 'streak']   // heaven's descent
  },

  // Silver — metal transformation + foresight
  'silver': {
    ss: ['jab', 'metal', '#CCCCCC', 1.0, 'iron'],          // metal-fist jab, hand hardens
    us: ['launch', 'metal', '#CCCCCC', 1.0, 'platform'],    // metal platform launches up
    ds: ['ground', 'metal', '#CCCCCC', 0.8, 'spikes'],     // metal spikes rise
    sh: ['charge', 'metal', '#CCCCCC', 1.2, 'shove'],       // heavy metal-armored shove
    dh: ['slam', 'metal', '#CCCCCC', 1.3, 'spikes'],       // metal spikes burst
    sp: ['unique', '#CCCCCC', 'metal']             // titanium fortress
  },

  // ═══════════════════════════════════════════════════════════════
  // GEN 5 VILLAINS
  // ═══════════════════════════════════════════════════════════════

  // Corpent — venom-coated hammer
  'corpent': {
    ss: ['slash', 'liquid', '#557733', 1.0, 'hammer'],      // venom-coated hammer swing
    us: ['launch', 'liquid', '#557733', 1.0, 'hammer'],     // hammer swing launches up
    ds: ['ground', 'liquid', '#557733', 0.7, 'venom'],     // venom pool
    sh: ['slam', 'liquid', '#557733', 1.4, 'hammer'],      // heavy hammer slam, huge knockback
    dh: ['slam', 'liquid', '#557733', 1.3, 'venom'],        // venom bursts outward
    sp: ['unique', '#557733', 'liquid']           // venom-hammer combo sweeps
  },

  // Magneto — metal
  'magneto': {
    ss: ['radial', 'metal', '#6666AA', 1.0, 'spike'],       // metal-shard toss
    us: ['launch', 'metal', '#6666AA', 1.0, 'platform'],    // metal platform lifts up
    ds: ['ground', 'metal', '#6666AA', 0.8, 'spikes'],      // metal spikes rise
    sh: ['charge', 'metal', '#6666AA', 1.2, 'iron'],        // heavy metal-charged strike
    dh: ['slam', 'metal', '#6666AA', 1.3, 'iron'],          // scattered metal bursts
    sp: ['unique', '#6666AA', 'metal']            // gathers all metal, hurls in barrage
  },

  // Willow — roots / plants
  'willow': {
    ss: ['whip', 'plant', '#339944', 1.0, 'vine'],          // root lash
    us: ['launch', 'plant', '#339944', 1.0, 'vine'],        // roots launch up
    ds: ['ground', 'plant', '#339944', 0.8, 'roots'],       // roots burst from ground
    sh: ['charge', 'plant', '#339944', 1.2, 'vine'],       // heavy root-wrap, entangles
    dh: ['slam', 'plant', '#339944', 1.3, 'roots'],         // roots erupt outward
    sp: ['unique', '#339944', 'plant', 'rootOvergrowth']    // overgrowth engulfs stage
  },

  // Cable — chaining lightning
  'cable': {
    ss: ['jab', 'bolt', '#44AAFF', 1.0, 'chain'],           // chain-lightning jab, arcs to nearest
    us: ['launch', 'bolt', '#44AAFF', 1.0, 'crackle'],      // lightning boosts up
    ds: ['ground', 'bolt', '#44AAFF', 0.7, 'chain'],        // chained spark
    sh: ['charge', 'bolt', '#44AAFF', 1.2, 'chain'],        // heavy chained lightning, amplification
    dh: ['slam', 'bolt', '#44AAFF', 1.3, 'chain'],          // lightning chains outward
    sp: ['unique', '#44AAFF', 'bolt']    // chains lightning between every foe
  },

  // Snodvor — overpowering cold, ice giant
  'snodvor': {
    ss: ['slash', 'crystal', '#AADDFF', 1.2, 'frost'],      // slow heavy frost swipe
    us: ['launch', 'crystal', '#AADDFF', 1.0, 'pillar'],    // ice pillar launches up
    ds: ['ground', 'crystal', '#AADDFF', 0.8, 'frost'],     // frost spreads, wide zoning
    sh: ['charge', 'crystal', '#AADDFF', 1.5, 'freeze'],    // heavy ice-clad shove, hardest hit
    dh: ['slam', 'crystal', '#AADDFF', 1.4, 'freeze'],      // freezing ground outward
    sp: ['unique', '#AADDFF', 'crystal']       // massive blizzard overpowers stage
  },

  // Kirsten — elegant flame
  'kirsten': {
    ss: ['jab', 'flame', '#FF66AA', 1.0, 'wreath'],        // elegant flame-lick jab
    us: ['launch', 'flame', '#FF66AA', 1.0, 'burst'],       // flame boosts up
    ds: ['ground', 'flame', '#FF66AA', 0.7, 'ember'],       // small flame burst
    sh: ['charge', 'flame', '#FF66AA', 1.2, 'wreath'],     // heavy flowing flame strike
    dh: ['slam', 'flame', '#FF66AA', 1.3, 'ember'],         // flame erupts outward
    sp: ['unique', '#FF66AA', 'flame']           // elegant sweeping flame combo
  },

  // Volt — concussive lightning
  'volt': {
    ss: ['jab', 'bolt', '#88CCFF', 1.0, 'crackle'],        // quick concussive jab, stagger
    us: ['launch', 'bolt', '#88CCFF', 1.0, 'crackle'],     // concussive burst launches up
    ds: ['ground', 'bolt', '#88CCFF', 0.7, 'crackle'],    // small concussive burst
    sh: ['charge', 'bolt', '#88CCFF', 1.2, 'crackle'],     // heavy concussive strike, stagger
    dh: ['slam', 'bolt', '#88CCFF', 1.3, 'crackle'],       // concussive blast
    sp: ['unique', '#88CCFF', 'bolt']              // one massive concussive burst
  },

  // Temple — Master of Dismantle
  'temple': {
    ss: ['jab', 'rock', '#DDBB88', 1.0, 'push'],            // dismantling touch, ignores shields
    us: ['launch', 'rock', '#DDBB88', 1.0, 'pillar'],       // dismantles platform to launch
    ds: ['ground', 'rock', '#DDBB88', 0.7, 'spikes'],       // dismantling pulse, chips shields
    sh: ['charge', 'rock', '#DDBB88', 1.2, 'shove'],        // heavy dismantling strike, ages constructs
    dh: ['slam', 'rock', '#DDBB88', 1.3, 'crack'],          // dismantling bursts
    sp: ['unique', '#DDBB88', 'rock']        // ages everything to dust
  },

  // Nightmare — fear / dream entity
  'nightmare': {
    ss: ['whip', 'dark', '#442266', 1.0, 'tendril'],        // fear-tendril lash, flinch
    us: ['launch', 'dark', '#442266', 1.0, 'step'],         // rises from shadow of fear
    ds: ['ground', 'dark', '#442266', 0.7, 'pool'],         // dread pulse
    sh: ['charge', 'dark', '#442266', 1.2, 'lunge'],        // heavy fear-charged strike
    dh: ['slam', 'dark', '#442266', 1.3, 'burst'],           // dread spreads
    sp: ['unique', '#442266', 'dark']    // nightmare haze, disorients
  },

  // Hazel — poison, thorned vines
  'hazel': {
    ss: ['whip', 'plant', '#66AA44', 1.0, 'vine'],          // thorned vine lash, poison
    us: ['launch', 'plant', '#66AA44', 1.0, 'vine'],        // vine launches up
    ds: ['ground', 'liquid', '#66AA44', 0.7, 'venom'],     // poison pool
    sh: ['charge', 'plant', '#66AA44', 1.2, 'vine'],       // heavy thorned-vine, poison DOT
    dh: ['slam', 'liquid', '#66AA44', 1.3, 'venom'],        // poison bursts
    sp: ['unique', '#66AA44', 'plant', 'poisonOvergrowth'] // poisonous thorn overgrowth
  },

  // Whami — reactive toxin / potion
  'whami': {
    ss: ['radial', 'liquid', '#88FF44', 1.0, 'venom'],      // reactive potion toss
    us: ['launch', 'liquid', '#88FF44', 1.0, 'venom'],      // potion boost
    ds: ['ground', 'liquid', '#88FF44', 0.7, 'venom'],     // reactive pool
    sh: ['charge', 'liquid', '#88FF44', 1.2, 'venom'],     // heavy reactive-potion strike
    dh: ['slam', 'liquid', '#88FF44', 1.3, 'venom'],        // potion bursts, changing effect
    sp: ['unique', '#88FF44', 'liquid', 'unstablePotion']  // unstable potion, randomized
  },

  // ═══════════════════════════════════════════════════════════════
  // COSMIC TIER (Four Forces + The Controller)
  // ═══════════════════════════════════════════════════════════════

  // The Controller — absorbs, redirects, multiplies energy
  'controller': {
    ss: ['jab', 'glow', '#AA44CC', 1.0, 'drain'],          // absorbing push
    us: ['launch', 'glow', '#AA44CC', 1.0, 'glow'],         // redirected energy
    ds: ['ground', 'glow', '#AA44CC', 0.7, 'drain'],        // absorb pulse, life-steal
    sh: ['charge', 'glow', '#AA44CC', 1.3, 'drain'],       // heavy redirected-energy, scales with absorbed
    dh: ['slam', 'glow', '#AA44CC', 1.3, 'ring'],           // multiplied energy bursts
    sp: ['unique', '#AA44CC', 'glow']                 // absorbs all, returns multiplied
  },

  // Evil — opposition / corruption / compression
  'evil': {
    ss: ['jab', 'dark', '#331122', 1.0, 'push'],            // compressing push
    us: ['launch', 'dark', '#331122', 1.0, 'step'],         // condenses, launches
    ds: ['ground', 'dark', '#331122', 0.7, 'pool'],          // corrupting pulse
    sh: ['charge', 'dark', '#331122', 1.2, 'push'],         // heavy compressive strike, pulls in
    dh: ['slam', 'dark', '#331122', 1.3, 'burst'],           // corruption spreads
    sp: ['unique', '#331122', 'dark']       // compresses stage inward, releases
  },

  // Life — expansion / growth / possibility
  'life': {
    ss: ['jab', 'plant', '#88FF66', 1.0, 'vine'],            // growth-fueled push
    us: ['launch', 'plant', '#88FF66', 1.0, 'vine'],        // expansion boosts up
    ds: ['ground', 'plant', '#88FF66', 0.7, 'roots'],        // growth pulse
    sh: ['charge', 'plant', '#88FF66', 1.2, 'vine'],         // heavy expansion strike
    dh: ['slam', 'plant', '#88FF66', 1.3, 'roots'],           // growth bursts
    sp: ['unique', '#88FF66', 'plant']     // burst of unrestrained growth and light
  },

  // Death — closure / endings / silence
  'death': {
    ss: ['jab', 'dark', '#222233', 1.0, 'push'],             // closing-force push
    us: ['launch', 'dark', '#222233', 1.0, 'step'],          // silent lift
    ds: ['ground', 'dark', '#222233', 0.7, 'pool'],          // closing pulse
    sh: ['charge', 'dark', '#222233', 1.2, 'push'],          // heavy closure strike, ends momentum
    dh: ['slam', 'dark', '#222233', 1.3, 'burst'],            // silence spreads
    sp: ['unique', '#222233', 'dark']     // wide closing pulse, ends momentum
  },

  // Mercy — restraint / compassion
  'mercy': {
    ss: ['jab', 'glow', '#FFDDAA', 1.0, 'glow'],             // restrained push
    us: ['launch', 'glow', '#FFDDAA', 1.0, 'float'],          // gentle lift
    ds: ['ground', 'glow', '#FFDDAA', 0.7, 'glow'],           // calming pulse, minor self-heal
    sh: ['charge', 'glow', '#FFDDAA', 1.1, 'glow'],          // heavy restrained strike, softer knockback
    dh: ['slam', 'glow', '#FFDDAA', 1.3, 'glow'],             // calming wave
    sp: ['unique', '#FFDDAA', 'glow']   // restraint pulse, softens damage
  },
};