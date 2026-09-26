// Generation I Up Heavy moves. They use the same authored animation/hitbox
// pipeline as signatures instead of falling back to the generic heavy box.
export const UP_HEAVIES = {
  g1_thunder: { name:'Rising Lightning Trio', type:'gen1UpHeavy', range:190, damage:23, color:'#FFFF44', duration:24 },
  g1_fire: { name:'Spinning Fire Wheel', type:'gen1UpHeavy', range:120, damage:24, color:'#FF6600', duration:24 },
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
