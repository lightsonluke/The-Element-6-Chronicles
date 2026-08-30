// Each character's unique power activation — replaces the light attack button.
// Powers have a time limit (duration in seconds), then the power bar must recharge.
// Gen 1-4 powers use unique 'gen_*' types handled by genPowers.js.

const VALID_POWER_TYPES = new Set([
  'stat_boost', 'spawn_clone', 'invincible', 'shield', 'freeze_opponent', 'launch_opponent',
  'teleport', 'damage_over_time', 'slow_opponent', 'flight', 'infinite_jumps', 'heal',
  'lightning_strike', 'pull_opponent', 'range_boost', 'charge_attack', 'beam', 'homing',
  'reverse_controls', 'random_effect', 'dash_slash', 'earth_drop', 'homing_projectile',
  'energy_ball', 'gravity_flip', 'demon_strike', 'whip_stun', 'platform_delete', 'gambit',
  'copy_move', 'add_damage', 'pull_all', 'hammer_throw', 'potion_throw', 'spawn_platform',
  'spawn_walls', 'transform', 'glue_trap', 'vine_snare', 'stage_slice', 'shadow_drain',
  'marionette', 'bubble_trap', 'deep_freeze', 'poison_cloud', 'sonar_pulse', 'elementor_call',
  'steal_power',
  // ── Gen 1-4 unique power types ──
  'gen_lightning_call', 'gen_flame_burst', 'gen_water_whip', 'gen_vine_strike', 'gen_ice_wall',
  'gen_iron_clamp', 'gen_ember_shot', 'gen_water_push', 'gen_stone_pillar', 'gen_gust_push',
  'gen_shadow_hand', 'gen_resonance_lock', 'gen_restoration_light',
  'gen_scatter_gust', 'gen_bone_barrage', 'gen_mirror_pane', 'gen_venom_spit', 'gen_blood_sword',
  'gen_thorn_volley', 'gen_ash_flash', 'gen_mist_ambush', 'gen_cinder_snap',
  'gen_barrier_drive', 'gen_wind_carry', 'gen_shadow_shift', 'gen_restoration_beam',
  'gen_fire_wave', 'gen_tremor_sense', 'gen_resonance_scan', 'gen_resonance_beacon',
  // ── New/changed Gen 1-4 power types ──
  'gen_star_shot', 'gen_life_steal_aura', 'gen_glass_wall', 'gen_sword_in_hand',
  'gen_extraction_tech', 'gen_solid_barrier', 'gen_platform_shake', 'gen_bomb',
]);

export const POWER_EFFECTS = {
  // ── HEROES ──
  yellow:   { type: 'stat_boost', name: 'Enhance', duration: 8, cooldown: 16, speedMul: 1.4, damageMul: 1.2, knockbackImmune: 30, damageReduction: 0.2 },
  blue:     { type: 'bubble_trap', name: 'Bubble', duration: 2, cooldown: 15 },
  purple:   { type: 'dash_slash', name: 'Ninja', duration: 0, cooldown: 14, damage: 22, knockback: 1.4, dashDistance: 288 },
  orange:   { type: 'teleport', name: 'Portalmaking', duration: 0, cooldown: 16 },
  green:    { type: 'earth_drop', name: 'Earthbending', duration: 0, cooldown: 16, damage: 20, knockback: 1.3 },
  pink:     { type: 'reverse_controls', name: 'Mind Control', duration: 4, cooldown: 15 },
  grey:     { type: 'spawn_walls', name: 'Walls', duration: 5, cooldown: 16 },
  turquoise: { type: 'transform', name: 'Shapeshift', duration: 8, cooldown: 18 },
  olive:    { type: 'range_boost', name: 'Growth', duration: 10, cooldown: 18, rangeMul: 1.6, damageReduction: 0.3 },
  copper:   { type: 'freeze_opponent', name: 'Time', duration: 3, cooldown: 35 },
  emerald:  { type: 'invincible', name: 'Phase', duration: 10, cooldown: 18 },
  pearl:    { type: 'sonar_pulse', name: 'Echo Location', duration: 0, cooldown: 16 },
  red:      { type: 'homing_projectile', name: 'Fire', duration: 0, cooldown: 16, damage: 25, color: '#FF3333', projectileType: 'fireball' },
  lavender: { type: 'spawn_platform', name: 'Air Solidification', duration: 5, cooldown: 16 },
  amber:    { type: 'spawn_clone', name: 'Mirror Clone', duration: 8, cooldown: 16, damageMul: 1.5 },
  black:    { type: 'lightning_strike', name: 'Thunder', duration: 0, cooldown: 16, damage: 25 },
  magenta:  { type: 'glue_trap', name: 'Glue', duration: 3, cooldown: 15 },
  indigo:   { type: 'gravity_flip', name: 'Gravity', duration: 4, cooldown: 15 },
  maroon:   { type: 'energy_ball', name: 'Energy', duration: 0, cooldown: 18 },
  crimson:  { type: 'beam', name: 'Element 6', duration: 0, cooldown: 16, damage: 22, knockback: 14, color: '#DC143C' },
  scarlet:  { type: 'demon_strike', name: 'Necromancy', duration: 0, cooldown: 16, damage: 18, knockback: 1.2 },
  white:    { type: 'infinite_jumps', name: 'Flight', duration: 10, cooldown: 16 },
  // Silver's power reduces incoming damage and knockback by 30% in every fight mode.
  silver:   { type: 'shield', name: 'Hardened', duration: 7, cooldown: 18, damageReduction: 0.30, knockbackReduction: 0.30, noAttackImmune: true },

  // ── VILLAINS ──
  corpent:  { type: 'hammer_throw', name: 'Hammer Throw', duration: 0, cooldown: 14, damage: 22, knockback: 1.4 },
  magneto:  { type: 'pull_all', name: 'Magnet', duration: 0, cooldown: 15, pullForce: 22 },
  willow:   { type: 'vine_snare', name: 'Vine Snare', duration: 3, cooldown: 15 },
  cable:    { type: 'whip_stun', name: 'Electricity', duration: 0, cooldown: 15, damage: 20, stunDuration: 120 },
  snodvor:  { type: 'deep_freeze', name: 'Deep Freeze', duration: 3, cooldown: 18 },
  kirsten:  { type: 'homing_projectile', name: 'Ignite', duration: 0, cooldown: 16, damage: 28, color: '#FF4400', projectileType: 'fireball' },
  volt:     { type: 'homing_projectile', name: 'Electric', duration: 0, cooldown: 15, damage: 20, color: '#CCAA00', projectileType: 'electric' },
  temple:   { type: 'stage_slice', name: 'Dismantle', duration: 0, cooldown: 18, damage: 22 },
  nightmare: { type: 'shadow_drain', name: 'Nightmare', duration: 4, cooldown: 18, dotDamage: 3 },
  hazel:    { type: 'poison_cloud', name: 'Poison Cloud', duration: 4, cooldown: 16, dotDamage: 4 },
  whami:    { type: 'potion_throw', name: 'Alchemy', duration: 0, cooldown: 20, damage: 20 },
  controller: { type: 'marionette', name: 'Control', duration: 4, cooldown: 20 },
  evil:     { type: 'platform_delete', name: 'Erasure', duration: 0, cooldown: 22, deleteCount: 2 },

  // ── GUARDIANS ──
  life:     { type: 'heal', name: 'Second Chance', duration: 10, cooldown: 20, reviveChance: 0.5 },
  death:    { type: 'add_damage', name: 'Gambit', duration: 0, cooldown: 18, damage: 10 },
  mercy:    { type: 'heal', name: 'Sanctuary', duration: 10, cooldown: 18, healAmount: 40, healOpponents: true },

  // ── GENERATION I — Dawn of Heroes ──
  g1_thunder: { type: 'gen_lightning_call', name: 'Lightning Call', duration: 0, cooldown: 16, damage: 24, color: '#FFFF44', how: 'A warning mark flashes beneath the opponent; a lightning bolt crashes directly onto the mark.', effect: 'Warning mark, then bolt strikes.' },
  g1_fire:    { type: 'gen_flame_burst', name: 'Flame Burst', duration: 0, cooldown: 14, damage: 18, color: '#FF6600', how: 'A compact fireball shoots straight ahead and explodes on contact.', effect: 'Fireball projectile, explodes on hit.' },
  g1_water:   { type: 'gen_water_whip', name: 'Water Whip', duration: 0, cooldown: 15, damage: 14, color: '#3399FF', how: 'A long water tendril lashes forward, hits the opponent, and pulls them slightly closer.', effect: 'Water whip, pulls opponent in.' },
  g1_grass:   { type: 'gen_vine_strike', name: 'Vine Barrage', duration: 0, cooldown: 15, damage: 18, color: '#44AA33', vineCount: 5, how: 'Five thick vines burst from the ground in a horizontal spread.', effect: '5 vines from ground in a row.' },
  g1_ice:     { type: 'gen_ice_wall', name: 'Ice Wall', duration: 4, cooldown: 18, color: '#AAEEFF', how: 'A short solid ice wall erupts in front of Ice, briefly blocks movement, then melts away.', effect: 'Ice wall blocks movement, then melts.' },

  // ── GENERATION II — Kingdoms at War ──
  g2_renji:      { type: 'gen_iron_clamp', name: 'Iron Clamp', duration: 0, cooldown: 16, damage: 12, color: '#888899', how: 'Iron bands burst from the floor around the opponent and briefly restrict movement.', effect: 'Iron bands trap opponent briefly.' },
  g2_kaito:      { type: 'gen_ember_shot', name: 'Ember Shot', duration: 0, cooldown: 16, damage: 20, color: '#FF4400', how: 'A dense ember projectile fires forward, bursts on impact, and leaves a tiny flame patch.', effect: 'Ember projectile, bursts, leaves fire.' },
  g2_hana:       { type: 'gen_water_push', name: 'Water Push', duration: 0, cooldown: 15, damage: 8, color: '#22AACC', how: 'A direct wave blast hits forward and pushes opponents away.', effect: 'Water wave pushes opponents back.' },
  g2_daigo:      { type: 'gen_stone_pillar', name: 'Stone Pillar', duration: 0, cooldown: 17, damage: 16, color: '#998866', how: 'A stone pillar erupts a set distance in front of Daigo.', effect: 'Stone pillar in front of Daigo.' },
  g2_suzu:       { type: 'gen_gust_push', name: 'Gust Push', duration: 0, cooldown: 15, damage: 6, color: '#CCEEFF', how: 'A concentrated gust fires forward and shoves opponents in the chosen direction.', effect: 'Gust shoves opponents forward.' },
  g2_mai:        { type: 'gen_shadow_hand', name: 'Shadow Hand', duration: 0, cooldown: 18, damage: 20, color: '#553388', how: 'A shadow hand appears in front, sinks into the ground, then emerges behind the opponent and slashes.', effect: 'Shadow hand emerges behind opponent.' },
  g2_osamu:      { type: 'gen_resonance_lock', name: 'Resonance Field', duration: 0, cooldown: 18, damage: 10, color: '#DDBB88', how: 'A resonance field forms around Osamu; anyone it hits is stunned.', effect: 'Aura around Osamu stuns on hit.' },
  g2_yui:        { type: 'gen_star_shot', name: 'Star Shot', duration: 0, cooldown: 16, damage: 18, color: '#FFDDAA', how: 'A star shoots forward dealing damage and knockback.', effect: 'Star projectile forward.' },

  // ── GENERATION III — The Fallen Age ──
  g3_takeshi:    { type: 'gen_scatter_gust', name: 'Scatter Gust', duration: 0, cooldown: 16, damage: 10, color: '#DDCC88', how: 'A scattered gust of sand shoots straight ahead; any opponent hit is briefly stunned.', effect: 'Sand gust stuns briefly.' },
  g3_aiko:       { type: 'gen_bone_barrage', name: 'Bone Barrage', duration: 0, cooldown: 16, damage: 16, color: '#EEEEDD', how: 'A tight spread of bone spikes shoots forward.', effect: 'Bone spikes spread forward.' },
  g3_haru:       { type: 'gen_glass_wall', name: 'Glass Wall', duration: 5, cooldown: 18, color: '#AAEEFF', how: 'A solid glass wall forms that blocks movement.', effect: 'Solid glass wall.' },
  g3_chiyo:      { type: 'gen_venom_spit', name: 'Venom Spit', duration: 0, cooldown: 16, damage: 12, color: '#88DD44', how: 'A venom shot fires forward and applies a brief slow on hit.', effect: 'Venom shot slows on hit.' },
  g3_emi:        { type: 'gen_sword_in_hand', name: 'Blood Sword', duration: 12, cooldown: 20, color: '#CC1133', damageMul: 1.3, how: 'A visible sword appears in hand dealing extra damage for 12 seconds.', effect: 'Sword in hand, extra damage 12s.' },
  g3_nozomi:     { type: 'gen_thorn_volley', name: 'Thorn Volley', duration: 0, cooldown: 16, damage: 14, color: '#338833', how: 'Several thorn vines burst forward from the ground in a spread.', effect: 'Thorn vines spread from ground.' },
  g3_masaru:     { type: 'gen_ash_flash', name: 'Ash Flash', duration: 0, cooldown: 16, damage: 12, color: '#999988', how: 'A dense ash blast fires ahead; a direct hit briefly stuns the opponent.', effect: 'Ash blast stuns briefly.' },
  g3_ryo:        { type: 'gen_mist_ambush', name: 'Mist Cloud', duration: 0, cooldown: 18, damage: 16, color: '#CCDDBB', how: 'A mist cloud forms in front; a hidden strike stuns anyone who enters.', effect: 'Mist cloud, stuns on contact.' },
  g3_souta:      { type: 'gen_cinder_snap', name: 'Cinder Snap', duration: 0, cooldown: 14, damage: 14, color: '#FF6633', how: 'A close cinder blast hits once and briefly stuns the opponent.', effect: 'Close cinder blast stuns briefly.' },

  // ── GENERATION IV — The Hero Corps ──
  g4_cobalt:     { type: 'gen_solid_barrier', name: 'Solid Barrier', duration: 6, cooldown: 18, color: '#3344AA', how: 'A solid barrier forms that can be wall-climbed.', effect: 'Solid climbable barrier.' },
  g4_cyan:       { type: 'gen_wind_carry', name: 'Wind Carry', duration: 0, cooldown: 17, damage: 8, color: '#AADDFF', how: 'A focused wind stream catches an opponent and carries them a short distance sideways.', effect: 'Wind carries opponent sideways.' },
  g4_onyx:       { type: 'gen_shadow_shift', name: 'Shadow Step', duration: 0, cooldown: 16, color: '#442266', how: 'Onyx steps through shadows to behind the opponent, leaving a trail.', effect: 'Teleport behind opponent with trail.' },
  g4_gold:       { type: 'gen_restoration_beam', name: 'Restoration Beam', duration: 5, cooldown: 18, color: '#FFCC44', how: 'A gold light beam connects to Gold or a nearby ally and restores health.', effect: 'Gold beam heals over time.' },
  g4_vermilion:  { type: 'gen_fire_wave', name: 'Fire Wave', duration: 0, cooldown: 17, damage: 14, color: '#FF4422', how: 'A low wave of fire rolls straight forward over short range.', effect: 'Fire wave rolls forward.' },
  g4_umber:      { type: 'gen_platform_shake', name: 'Tremor', duration: 4, cooldown: 16, color: '#886644', how: 'The platform Umber stands on shakes violently. (Grand Circuit: protective wall)', effect: 'Platform shakes / wall in GC.' },
  g4_graphite:   { type: 'stat_boost', name: 'Overclock', duration: 8, cooldown: 16, speedMul: 1.085 },
  g4_daichi:     { type: 'gen_bomb', name: 'Tech Bomb', duration: 0, cooldown: 18, damage: 30, color: '#66AAFF', how: 'A bomb deploys that explodes after a short fuse.', effect: 'Bomb with fuse.' },

  // ── Unchanged Gen 1-4 powers (keep existing types) ──
  g2_ibuki:      { type: 'gen_life_steal_aura', name: 'Life Steal', duration: 10, cooldown: 20, color: '#553377', dotDamage: 4, how: 'A visible field forms around the user that steals life for 10 seconds.', effect: 'Life steal aura for 10s.' },
  g2_nishikawa:  { type: 'marionette', name: 'Puppet Strings', duration: 5, cooldown: 20 },
  g2_itto:       { type: 'dash_slash', name: 'Phantom Blade', duration: 0, cooldown: 16, damage: 28, knockback: 1.6, color: '#00CCFF' },
  g2_twinfoxes:  { type: 'spawn_clone', name: 'Kitsune Trick', duration: 6, cooldown: 18, damageMul: 1.6 },
  g2_utsuro:     { type: 'elementor_call', name: 'Elementor Call', duration: 0, cooldown: 18, damage: 15 },
  g3_ogata:      { type: 'gen_extraction_tech', name: 'Extraction Tech', duration: 8, cooldown: 18, color: '#66AAFF', how: 'A tech device appears in hand for 8 seconds, then disappears.', effect: 'Tech in hand for 8s.' },
  g3_kanenobu:   { type: 'spawn_clone', name: 'Phantom Guard', duration: 5, cooldown: 16, damageMul: 1.4 },
  g4_renko:      { type: 'gen_life_steal_aura', name: 'Vitality Siphon', duration: 10, cooldown: 20, color: '#553377', dotDamage: 4, how: 'A visible field forms around the user that steals life for 10 seconds.', effect: 'Life steal aura for 10s.' },
};

function sanitizePowerType(type) {
  if (!type || typeof type !== 'string') return 'stat_boost';
  const normalized = type.trim().toLowerCase().replace(/[-\s]/g, '_');
  if (VALID_POWER_TYPES.has(normalized)) return normalized;
  for (const valid of VALID_POWER_TYPES) {
    if (normalized === valid || normalized.includes(valid) || valid.includes(normalized)) return valid;
  }
  return 'stat_boost';
}

export const SINGLE_RANDOM_POWER_CHARS = new Set([
  'blue', 'orange', 'green', 'pink', 'turquoise', 'red', 'black', 'magenta', 'maroon', 'scarlet',
  'willow', 'snodvor', 'nightmare', 'hazel', 'controller', 'death',
  'g1_thunder', 'g1_water',
  'g2_renji', 'g2_daigo', 'g2_mai', 'g2_osamu', 'g2_ibuki', 'g2_nishikawa', 'g2_itto',
  'g3_ryo', 'g3_ogata',
  'g4_renko',
]);

export function getPowerEffect(charId, charData = null) {
  if (POWER_EFFECTS[charId]) return POWER_EFFECTS[charId];
  if (charId?.startsWith('custom_')) {
    if (charData?.power_effect) {
      const pe = charData.power_effect;
      const type = sanitizePowerType(pe.type);
      return {
        type,
        name: pe.name || charData.power || 'Custom Power',
        duration: Math.min(pe.duration ?? 0, 10),
        cooldown: Math.min(Math.max(pe.cooldown ?? 14, 10), 25),
        damage: pe.damage ?? 20,
        knockback: pe.knockback ?? 1.2,
        color: pe.color || charData.color || '#FF6600',
        projectileType: pe.projectileType || 'energy',
        speedMul: pe.speedMul,
        damageMul: pe.damageMul,
        rangeMul: pe.rangeMul,
        damageReduction: pe.damageReduction,
        pullForce: pe.pullForce,
        stunDuration: pe.stunDuration,
        dotDamage: pe.dotDamage,
        deleteCount: pe.deleteCount,
        healAmount: pe.healAmount,
        healOpponents: pe.healOpponents,
        dodgeChance: pe.dodgeChance,
        reviveChance: pe.reviveChance,
        knockbackImmune: pe.knockbackImmune,
      };
    }
    return {
      type: 'homing_projectile', name: charData?.power || 'Custom Power',
      duration: 0, cooldown: 14, damage: 20, knockback: 1.2,
      color: charData?.color || '#FF6600', projectileType: 'fireball',
    };
  }
  return null;
}
