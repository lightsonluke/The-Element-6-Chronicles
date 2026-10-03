// Generation I Up Heavy moves. They use the same authored animation/hitbox
// pipeline as signatures instead of falling back to the generic heavy box.
export const UP_HEAVIES = {
  g1_thunder: { name:'Rising Lightning Trio', type:'gen1UpHeavy', range:190, damage:23, color:'#FFFF44', duration:24 },
  g1_fire: { name:'Spinning Fire Wheel', type:'gen1UpHeavy', range:120, damage:24, color:'#FF6600', duration:12 },
  g1_water: { name:'Spiral Water Ribbon', type:'gen1UpHeavy', range:145, damage:24, color:'#3399CC', duration:25 },
  g1_grass: { name:'Petal Bloom', type:'gen1UpHeavy', range:120, damage:24, color:'#44AA44', duration:26 },
  g1_ice: { name:'Tri-Shard Burst', type:'gen1UpHeavy', range:130, damage:24, color:'#AAEEFF', duration:24 },
};

// Generation II — authored Up Heavy attacks. Their collision geometry is
// resolved by attackSpecs.js/gen2AttackAnims.js so these entries only provide
// the fighter-state metadata.
Object.assign(UP_HEAVIES, {
  g2_renji: { name:'Hooked Cleaver', type:'gen2UpHeavy', range:190, damage:24, color:'#AEB7C1', duration:26 },
  g2_kaito: { name:'Rising Roundhouse', type:'gen2UpHeavy', range:155, damage:24, color:'#FF5A24', duration:26 },
  g2_hana: { name:'Spiraling Tide Column', type:'gen2UpHeavy', range:160, damage:24, color:'#42B8FF', duration:26 },
  g2_daigo: { name:'Splitting Stone Pillar', type:'gen2UpHeavy', range:170, damage:25, color:'#A88A67', duration:28 },
  g2_suzu: { name:'Gale Spiral Kick', type:'gen2UpHeavy', range:160, damage:23, color:'#B8FFF2', duration:26 },
  g2_mai: { name:'Shadow Wing', type:'gen2UpHeavy', range:150, damage:23, color:'#7650A8', duration:26 },
  g2_osamu: { name:'Ascending Resonance', type:'gen2UpHeavy', range:165, damage:24, color:'#FFE38A', duration:26 },
  g2_yui: { name:'Catching Star', type:'gen2UpHeavy', range:160, damage:22, color:'#FFF2A8', duration:26 },
  g2_ibuki: { name:'Life-Energy Stream', type:'gen2UpHeavy', range:170, damage:24, color:'#D7E1E4', duration:26 },
  g2_nishikawa: { name:'Descending Knots', type:'gen2UpHeavy', range:175, damage:24, color:'#D58CFF', duration:27 },
  g2_itto: { name:'Iaijutsu Rising Cut', type:'gen2UpHeavy', range:185, damage:26, color:'#DDE5EA', duration:24 },
  g2_twinfoxes: { name:'Fox Launch', type:'gen2UpHeavy', range:165, damage:23, color:'#FF8A2A', duration:26 },
  g2_utsuro: { name:'Hollow Arm Rise', type:'gen2UpHeavy', range:170, damage:25, color:'#7D4AA5', duration:27 },
});

// Generation IV — authored Up Heavy metadata. Animation/hitbox geometry is
// supplied by gen4AttackAnims.js.
Object.assign(UP_HEAVIES, {
  g4_cobalt: { name:'Fortress Lift', type:'gen4UpHeavy', range:170, damage:24, color:'#3366FF', duration:26 },
  g4_cyan: { name:'Cyclone Rise', type:'gen4UpHeavy', range:160, damage:24, color:'#66DDFF', duration:26 },
  g4_onyx: { name:'Shadow Tower', type:'gen4UpHeavy', range:160, damage:25, color:'#5C3C88', duration:25 },
  g4_gold: { name:'Golden Rebuild', type:'gen4UpHeavy', range:165, damage:23, color:'#FFD83D', duration:27 },
  g4_vermilion: { name:'Inferno Column', type:'gen4UpHeavy', range:155, damage:26, color:'#E34234', duration:25 },
  g4_umber: { name:'Seismic Uppercut', type:'gen4UpHeavy', range:150, damage:25, color:'#9A5B32', duration:24 },
  g4_graphite: { name:'Resonance Column', type:'gen4UpHeavy', range:165, damage:24, color:'#8899AA', duration:27 },
  g4_daichi: { name:'Resonance Lift', type:'gen4UpHeavy', range:160, damage:23, color:'#FFB02E', duration:27 },
  g4_renko: { name:'Refinement Tower', type:'gen4UpHeavy', range:170, damage:25, color:'#A90024', duration:27 },
});

// Generation V — authored Up Heavy metadata. Geometry is supplied by gen5AttackAnims.js.
Object.assign(UP_HEAVIES, {
  yellow:{name:'Maximum Jump',type:'gen5UpHeavy',range:150,damage:25,color:'#FFD700',duration:26},
  blue:{name:'Water Spiral',type:'gen5UpHeavy',range:160,damage:24,color:'#4488FF',duration:27},
  purple:{name:'Sky Assassin',type:'gen5UpHeavy',range:165,damage:26,color:'#9944CC',duration:25},
  orange:{name:'Portal Loop',type:'gen5UpHeavy',range:165,damage:24,color:'#FF8800',duration:28},
  green:{name:'Earth Column',type:'gen5UpHeavy',range:170,damage:26,color:'#44AA44',duration:28},
  pink:{name:'Orbit',type:'gen5UpHeavy',range:150,damage:24,color:'#FF66AA',duration:27},
  grey:{name:'Tower Wall',type:'gen5UpHeavy',range:165,damage:25,color:'#888888',duration:27},
  turquoise:{name:'Serpent Rise',type:'gen5UpHeavy',range:170,damage:25,color:'#44CCAA',duration:27},
  olive:{name:'Giant Step',type:'gen5UpHeavy',range:170,damage:27,color:'#808000',duration:28},
  copper:{name:'Stolen Second',type:'gen5UpHeavy',range:155,damage:25,color:'#CC7744',duration:27},
  emerald:{name:'Phase Dive',type:'gen5UpHeavy',range:165,damage:25,color:'#33CC66',duration:26},
  pearl:{name:'Echo Column',type:'gen5UpHeavy',range:160,damage:24,color:'#EEEEDD',duration:27},
  red:{name:'Inferno Wheel',type:'gen5UpHeavy',range:165,damage:26,color:'#FF3333',duration:27},
  lavender:{name:'Sky Platform',type:'gen5UpHeavy',range:170,damage:24,color:'#BB88DD',duration:27},
  amber:{name:'Clone Ladder',type:'gen5UpHeavy',range:165,damage:25,color:'#FFBB33',duration:28},
});

// Generation V — Characters 16-39. Geometry is supplied by gen5RestAttackAnims.js.
Object.assign(UP_HEAVIES, {
  black:{name:'Rising Bolts',type:'gen5RestUpHeavy',range:170,damage:26,color:'#FFFF44',duration:27},
  magenta:{name:'Glue Pole',type:'gen5RestUpHeavy',range:170,damage:23,color:'#FF44AA',duration:28},
  indigo:{name:'Vertical Flip',type:'gen5RestUpHeavy',range:170,damage:26,color:'#4B0082',duration:28},
  maroon:{name:'Energy Column',type:'gen5RestUpHeavy',range:160,damage:26,color:'#800000',duration:27},
  crimson:{name:'Element Lance',type:'gen5RestUpHeavy',range:180,damage:27,color:'#DC143C',duration:27},
  scarlet:{name:'Phantom Column',type:'gen5RestUpHeavy',range:170,damage:26,color:'#FF2400',duration:28},
  white:{name:'Vertical Rush',type:'gen5RestUpHeavy',range:180,damage:25,color:'#EEEEEE',duration:26},
  silver:{name:'Steel Rising',type:'gen5RestUpHeavy',range:175,damage:27,color:'#C0C0C0',duration:28},
  corpent:{name:'Rising Hammer',type:'gen5RestUpHeavy',range:180,damage:28,color:'#8B5A2B',duration:28},
  magneto:{name:'Magnetic Launch',type:'gen5RestUpHeavy',range:175,damage:27,color:'#777777',duration:28},
  willow:{name:'Tree Rise',type:'gen5RestUpHeavy',range:175,damage:26,color:'#398A3F',duration:29},
  cable:{name:'Twin Whips',type:'gen5RestUpHeavy',range:175,damage:26,color:'#66CCFF',duration:27},
  snodvor:{name:'Glacier Rise',type:'gen5RestUpHeavy',range:175,damage:27,color:'#A9E7FF',duration:28},
  kirsten:{name:'Ignition Column',type:'gen5RestUpHeavy',range:170,damage:25,color:'#FF6A24',duration:27},
  volt:{name:'Frequency Column',type:'gen5RestUpHeavy',range:175,damage:27,color:'#4A62B8',duration:28},
  temple:{name:'Structural Collapse',type:'gen5RestUpHeavy',range:175,damage:27,color:'#7A4B32',duration:28},
  nightmare:{name:'Falling Fear',type:'gen5RestUpHeavy',range:175,damage:27,color:'#A66CFF',duration:27},
  hazel:{name:'Cursed Tree',type:'gen5RestUpHeavy',range:175,damage:26,color:'#355C35',duration:29},
  whami:{name:'Giant Potion',type:'gen5RestUpHeavy',range:175,damage:27,color:'#C28A32',duration:27},
  controller:{name:'Matter Orbit',type:'gen5RestUpHeavy',range:170,damage:27,color:'#6A4FB3',duration:28},
  evil:{name:'Missing Space',type:'gen5RestUpHeavy',range:165,damage:28,color:'#111111',duration:27},
  life:{name:'Growth Spiral',type:'gen5RestUpHeavy',range:175,damage:26,color:'#67D88A',duration:29},
  death:{name:'Last Ascent',type:'gen5RestUpHeavy',range:175,damage:27,color:'#282044',duration:28},
  mercy:{name:'Balance Rise',type:'gen5RestUpHeavy',range:170,damage:24,color:'#F2E8FF',duration:28},
});
