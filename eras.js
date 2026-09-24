// ═══════════════════════════════════════════════════════════════
// ERA SYSTEM — Five playable eras of Element 6 history
// All old-generation characters with unique movesets + 35-point stats
// ═══════════════════════════════════════════════════════════════

export const ERAS = [
  {
    id: 'g1',
    name: 'Dawn of Heroes',
    subtitle: 'Generation I',
    short: 'G1',
    aesthetic: 'Ancient Japan — temples, ink-brush, dark wood, bronze',
    accent: '#FFD700',
    accent2: '#1a1a2a',
    uiTheme: 'dawn',
  },
  {
    id: 'g2',
    name: 'Kingdoms at War',
    subtitle: 'Generation II',
    short: 'G2',
    aesthetic: 'Warring states — clan banners, castle silhouettes, red/gold',
    accent: '#CC3333',
    accent2: '#1a0a0a',
    uiTheme: 'kingdoms',
  },
  {
    id: 'g3',
    name: 'The Fallen Age',
    subtitle: 'Generation III',
    short: 'G3',
    aesthetic: 'Darker era — weathered wood, ash, sand, cracked stone',
    accent: '#8a7a5a',
    accent2: '#1a1510',
    uiTheme: 'fallen',
  },
  {
    id: 'g4',
    name: 'The Hero Corps',
    subtitle: 'Generation IV',
    short: 'G4',
    aesthetic: 'Organized institution — command center, dark blue/gray/metal',
    accent: '#3366CC',
    accent2: '#0a1020',
    uiTheme: 'corps',
  },
  {
    id: 'g5',
    name: 'Heroes of Color',
    subtitle: 'Generation V',
    short: 'G5',
    aesthetic: 'Current era — vibrant, colorful, modern',
    accent: '#9944CC',
    accent2: '#0a0a1a',
    uiTheme: 'color',
  },
];

export const ERA_MAP = Object.fromEntries(ERAS.map(e => [e.id, e]));

// ═══════════════════════════════════════════════════════════════
// GENERATION I — DAWN OF HEROES (5 heroes, all split-color 50/50)
// ═══════════════════════════════════════════════════════════════

const G1_CHARS = [
  {
    id: 'g1_thunder', name: 'Thunder Hero', title: 'The First Lightning', era: 'g1', role: 'Hero',
    color: '#FFD700', secondaryColor: '#1a1a1a', splitColor: true,
    appearance: { head: '#FFD700', torso: '#1a1a1a', armL: '#FFD700', armR: '#1a1a1a', legL: '#1a1a1a', legR: '#FFD700' },
    powerTitle: 'Lightning', powerDescription: 'Calls down a powerful lightning bolt on the opponent, dealing heavy damage. The bolt strikes from above and cannot be dodged.',
    weapon: 'Lightning Gauntlets', stats: { speed: 8, power: 10, defense: 7, utility: 4, control: 6 },
    lore: 'One of the five original heroes of the Dawn of Heroes era. A master of lightning who fought with precision and speed.',
    heavyAttack: { name: 'Thunder Bolt', desc: 'Channels lightning into a focused bolt that pierces forward', damage: 22, range: 200, duration: 18, color: '#FFD700', type: 'laserBlast', knockback: 1.3 },
    signatures: {
      side: { name: 'Lightning Step', desc: 'Dashes forward as a bolt of lightning, striking everything in path', duration: 16, damage: 18, range: 220, color: '#FFD700', type: 'dash' },
      up: { name: 'Storm Rise', desc: 'Launches upward on a pillar of electricity', duration: 18, damage: 15, range: 130, color: '#FFEE44', type: 'launch' },
      down: { name: 'Static Field', desc: 'Slams the ground, creating an electric field that shocks nearby enemies', duration: 24, damage: 20, range: 160, color: '#FFD700', type: 'groundSlam' },
    },
    superMove: { name: 'Thunderstorm', desc: 'Summons a massive thunderstorm — lightning strikes repeatedly across the battlefield before one enormous bolt crashes down', duration: 55, damage: 44, color: '#FFD700' },
  },
  {
    id: 'g1_fire', name: 'Fire Hero', title: 'The First Flame', era: 'g1', role: 'Hero',
    color: '#FF4400', secondaryColor: '#FF8800', splitColor: true,
    appearance: { head: '#FF4400', torso: '#FF8800', armL: '#FF4400', armR: '#FF8800', legL: '#FF8800', legR: '#FF4400' },
    powerTitle: 'Flame', powerDescription: 'Cracks a line of flowing fire forward in the facing direction, damaging and stunning the opponent briefly.',
    weapon: 'Flame Fists', stats: { speed: 7, power: 8, defense: 6, utility: 6, control: 8 },
    lore: 'One of the five original heroes. An aggressive fighter who overwhelmed enemies with relentless flame.',
    heavyAttack: { name: 'Eruption', desc: 'Slams both fists into the ground, causing a pillar of fire to erupt beneath the opponent', damage: 23, range: 170, duration: 22, color: '#FF4400', type: 'groundSlam', knockback: 1.4 },
    signatures: {
      side: { name: 'Flame Charge', desc: 'Charges forward wreathed in fire, leaving a trail of flames', duration: 20, damage: 19, range: 200, color: '#FF4400', type: 'dash' },
      up: { name: 'Fire Fountain', desc: 'Erupts a fountain of fire upward', duration: 18, damage: 16, range: 130, color: '#FF8800', type: 'launch' },
      down: { name: 'Magma Pool', desc: 'Creates a pool of magma on the ground that damages over time', duration: 28, damage: 14, range: 150, color: '#CC2200', type: 'rootBind' },
    },
    superMove: { name: 'Inferno', desc: 'The entire battlefield erupts in fire — geysers, walls of flame, and a massive explosion at the center', duration: 55, damage: 42, color: '#FF4400' },
  },
  {
    id: 'g1_water', name: 'Water Hero', title: 'The First Tide', era: 'g1', role: 'Hero',
    color: '#00CCFF', secondaryColor: '#0044AA', splitColor: true,
    appearance: { head: '#00CCFF', torso: '#0044AA', armL: '#00CCFF', armR: '#0044AA', legL: '#0044AA', legR: '#00CCFF' },
    powerTitle: 'Tide', powerDescription: 'Encases the opponent in a slow-drifting water bubble they cannot escape, leaving them vulnerable to follow-up attacks.',
    weapon: 'Water Whip', stats: { speed: 6, power: 7, defense: 7, utility: 8, control: 7 },
    lore: 'One of the five original heroes. A master of water who controlled battlefields through adaptability.',
    heavyAttack: { name: 'Tidal Crush', desc: 'Summons a massive wave that crashes forward, sweeping enemies away', damage: 21, range: 200, duration: 24, color: '#00CCFF', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Water Whip', desc: 'Lashes out with a whip of high-pressure water', duration: 18, damage: 17, range: 190, color: '#00CCFF', type: 'vineWhip' },
      up: { name: 'Geyser', desc: 'Erupts a water geyser from beneath the enemy', duration: 20, damage: 16, range: 130, color: '#66DDFF', type: 'geyser' },
      down: { name: 'Whirlpool', desc: 'Creates a whirlpool that traps and damages enemies', duration: 26, damage: 15, range: 150, color: '#0088CC', type: 'rootBind' },
    },
    superMove: { name: 'Ocean\'s Wrath', desc: 'A massive tidal wave sweeps across the entire stage, followed by whirlpools and water spikes', duration: 55, damage: 40, color: '#00CCFF' },
  },
  {
    id: 'g1_grass', name: 'Grass Hero', title: 'The First Growth', era: 'g1', role: 'Hero',
    color: '#88DD44', secondaryColor: '#226622', splitColor: true,
    appearance: { head: '#88DD44', torso: '#226622', armL: '#88DD44', armR: '#226622', legL: '#226622', legR: '#88DD44' },
    powerTitle: 'Growth', powerDescription: 'Ensnars the opponent in thorned vines, rooting them in place and preventing all movement for the duration.',
    weapon: 'Vine Staff', stats: { speed: 5, power: 6, defense: 8, utility: 9, control: 7 },
    lore: 'One of the five original heroes. A guardian of nature who shaped battlefields with plant life.',
    heavyAttack: { name: 'Root Prison', desc: 'Massive roots erupt beneath opponents, wrapping around them before exploding', damage: 20, range: 160, duration: 26, color: '#88DD44', type: 'cage', knockback: 1.3 },
    signatures: {
      side: { name: 'Vine Lash', desc: 'Whips out thorned vines in a wide arc', duration: 20, damage: 17, range: 180, color: '#88DD44', type: 'vineWhip' },
      up: { name: 'Tree Rise', desc: 'A tree erupts from the ground, launching enemies skyward', duration: 22, damage: 16, range: 130, color: '#448822', type: 'launch' },
      down: { name: 'Forest Wall', desc: 'Creates a wall of trees and vines that blocks movement', duration: 30, damage: 12, range: 160, color: '#226622', type: 'rootBind' },
    },
    superMove: { name: 'Genesis Bloom', desc: 'The entire battlefield becomes overgrown — massive trees, thorned vines, and a colossal flower that blooms and explodes', duration: 58, damage: 40, color: '#88DD44' },
  },
  {
    id: 'g1_ice', name: 'Ice Hero', title: 'The First Frost', era: 'g1', role: 'Hero',
    color: '#AAEEFF', secondaryColor: '#4488CC', splitColor: true,
    appearance: { head: '#AAEEFF', torso: '#4488CC', armL: '#AAEEFF', armR: '#4488CC', legL: '#4488CC', legR: '#AAEEFF' },
    powerTitle: 'Frost', powerDescription: 'Freezes the opponent solid in a block of ice, fully immobile for the duration.',
    weapon: 'Ice Spear', stats: { speed: 6, power: 7, defense: 8, utility: 6, control: 8 },
    lore: 'One of the five original heroes. A master of ice who froze battlefields and trapped enemies.',
    heavyAttack: { name: 'Glacier Spike', desc: 'Slams the ground, causing enormous ice spikes to erupt beneath opponents', damage: 22, range: 170, duration: 24, color: '#AAEEFF', type: 'groundSlam', knockback: 1.4 },
    signatures: {
      side: { name: 'Ice Shard', desc: 'Fires a volley of sharp ice shards forward', duration: 18, damage: 18, range: 200, color: '#AAEEFF', type: 'laserBlast' },
      up: { name: 'Frost Pillar', desc: 'An ice pillar erupts upward, launching enemies', duration: 20, damage: 16, range: 130, color: '#66BBDD', type: 'launch' },
      down: { name: 'Freeze Field', desc: 'Freezes the ground in a radius, trapping enemies in ice', duration: 28, damage: 14, range: 160, color: '#AADDFF', type: 'freeze' },
    },
    superMove: { name: 'Absolute Zero', desc: 'The temperature drops to absolute zero — the entire stage freezes, ice spikes erupt everywhere, and a massive glacier crashes down', duration: 58, damage: 44, color: '#AAEEFF' },
  },
];

// ═══════════════════════════════════════════════════════════════
// GENERATION II — KINGDOMS AT WAR
// ═══════════════════════════════════════════════════════════════

const G2_CHARS = [
  {
    id: 'g2_renji', name: 'Renji Kurogane', title: 'The Ironclad', era: 'g2', role: 'Hero',
    color: '#888888', secondaryColor: '#AAAAAA',
    powerTitle: 'Iron', powerDescription: 'Hardens and reshapes metal, including armor grown directly from his own body.',
    weapon: 'Iron Gauntlets', stats: { speed: 7, power: 6, defense: 8, utility: 7, control: 7 },
    lore: 'A samurai-era hero who could grow iron armor from his own body. A steadfast defender of his clan.',
    heavyAttack: { name: 'Iron Slam', desc: 'Forms a massive iron gauntlet and slams it down with crushing force', damage: 23, range: 160, duration: 24, color: '#888888', type: 'groundSlam', knockback: 1.5 },
    signatures: {
      side: { name: 'Blade Arm', desc: 'Forms an iron blade on his arm and slashes forward', duration: 20, damage: 18, range: 180, color: '#AAAAAA', type: 'dash' },
      up: { name: 'Iron Pillar', desc: 'Grows an iron pillar from the ground that launches enemies', duration: 22, damage: 16, range: 130, color: '#888888', type: 'pillar' },
      down: { name: 'Armor Fortress', desc: 'Encases himself in iron armor, becoming a defensive wall', duration: 28, damage: 14, range: 120, color: '#666666', type: 'rootBind' },
    },
    superMove: { name: 'Iron Colossus', desc: 'Renji becomes a massive iron colossus — iron spikes erupt across the battlefield before he crashes down with enormous force', duration: 55, damage: 42, color: '#888888' },
  },
  {
    id: 'g2_kaito', name: 'Kaito Ren', title: 'The Ember Blade', era: 'g2', role: 'Hero',
    color: '#FF3322', secondaryColor: '#FF6622',
    powerTitle: 'Ember', powerDescription: 'Creates and manipulates fire through an aggressive fighting style. High offensive instinct with a focus on direct flame attacks.',
    weapon: 'Ember Katana', stats: { speed: 9, power: 8, defense: 6, utility: 6, control: 6 },
    lore: 'A fiery warrior known for his aggressive flame style. He burned through enemy lines with relentless intensity.',
    heavyAttack: { name: 'Flame Slash', desc: 'A devastating katana slash wreathed in fire that sends a wave of flame forward', damage: 24, range: 190, duration: 20, color: '#FF3322', type: 'wave', knockback: 1.4 },
    signatures: {
      side: { name: 'Ember Dash', desc: 'Dashes forward leaving a trail of fire', duration: 16, damage: 19, range: 220, color: '#FF3322', type: 'dash' },
      up: { name: 'Rising Flame', desc: 'A spiral of fire rises upward, carrying enemies with it', duration: 18, damage: 17, range: 120, color: '#FF6622', type: 'launch' },
      down: { name: 'Fire Trap', desc: 'Places a fire trap that explodes when enemies approach', duration: 26, damage: 20, range: 150, color: '#CC1100', type: 'rootBind' },
    },
    superMove: { name: 'Phoenix Inferno', desc: 'Kaito transforms into a phoenix of flame, soaring across the battlefield and raining fire down before crashing in a massive explosion', duration: 55, damage: 44, color: '#FF3322' },
  },
  {
    id: 'g2_hana', name: 'Hana Mizushima', title: 'The Calm Tide', era: 'g2', role: 'Hero',
    color: '#3399FF', secondaryColor: '#66BBFF',
    powerTitle: 'Tide', powerDescription: 'Precise water manipulation focused on disaster prevention, civilian protection, and controlled battlefield intervention.',
    weapon: 'Water Fan', stats: { speed: 6, power: 6, defense: 7, utility: 8, control: 8 },
    lore: 'A calm and precise water user who protected civilians during the warring states period. She controlled battlefields without unnecessary destruction.',
    heavyAttack: { name: 'Water Barrier', desc: 'Creates a massive wall of water that rushes forward, pushing enemies back', damage: 20, range: 180, duration: 24, color: '#3399FF', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Pressure Jet', desc: 'Fires a high-pressure water jet', duration: 18, damage: 18, range: 200, color: '#3399FF', type: 'laserBlast' },
      up: { name: 'Water Shield', desc: 'Creates a protective water barrier that launches enemies upward', duration: 22, damage: 15, range: 130, color: '#66BBFF', type: 'launch' },
      down: { name: 'Flood Zone', desc: 'Floods the area, slowing and damaging enemies', duration: 28, damage: 14, range: 160, color: '#2266CC', type: 'freeze' },
    },
    superMove: { name: 'Great Flood', desc: 'A enormous wave floods the entire battlefield, sweeping enemies away before water spikes erupt from below', duration: 55, damage: 40, color: '#3399FF' },
  },
  {
    id: 'g2_daigo', name: 'Daigo Ishikawa', title: 'The Stone Wall', era: 'g2', role: 'Hero',
    color: '#8B7355', secondaryColor: '#A0826D',
    powerTitle: 'Stone', powerDescription: 'Creates and manipulates stone for defensive structures, barriers, sustained defense, and powerful physical attacks.',
    weapon: 'Stone Hammer', stats: { speed: 4, power: 7, defense: 9, utility: 8, control: 7 },
    lore: 'An immovable defender who could raise stone walls and fortifications in seconds. He protected entire villages single-handedly.',
    heavyAttack: { name: 'Stone Crusher', desc: 'Slams his hammer down, causing the ground to crack and stone spikes to erupt', damage: 25, range: 160, duration: 26, color: '#8B7355', type: 'groundSlam', knockback: 1.5 },
    signatures: {
      side: { name: 'Boulder Roll', desc: 'Creates a giant boulder and sends it rolling forward', duration: 24, damage: 19, range: 180, color: '#8B7355', type: 'boulderCharge' },
      up: { name: 'Stone Pillar', desc: 'Raises a stone pillar from the ground', duration: 22, damage: 16, range: 130, color: '#A0826D', type: 'pillar' },
      down: { name: 'Earthquake', desc: 'Slams the ground creating seismic ripples', duration: 28, damage: 22, range: 180, color: '#6B5344', type: 'quake' },
    },
    superMove: { name: 'Mountain Fortress', desc: 'Daigo raises an entire mountain from the battlefield — stone walls, pillars, and boulders crash down before the mountain explodes outward', duration: 60, damage: 44, color: '#8B7355' },
  },
  {
    id: 'g2_suzu', name: 'Suzu Kaze', title: 'The Swift Gale', era: 'g2', role: 'Hero',
    color: '#99DDAA', secondaryColor: '#FFFFFF',
    powerTitle: 'Gale', powerDescription: 'Controls wind for extreme mobility, scouting, flanking, aerial movement, and fast attacks.',
    weapon: 'Wind Fans', stats: { speed: 10, power: 6, defense: 5, utility: 8, control: 6 },
    lore: 'The fastest warrior of her era. She moved like the wind, striking before enemies could react and vanishing before they could retaliate.',
    heavyAttack: { name: 'Cyclone', desc: 'Creates a cyclone that pulls enemies in before launching them upward', damage: 21, range: 190, duration: 24, color: '#99DDAA', type: 'magPull', knockback: 1.3 },
    signatures: {
      side: { name: 'Gale Dash', desc: 'Dashes forward at incredible speed as a blade of wind', duration: 14, damage: 19, range: 240, color: '#99DDAA', type: 'dash' },
      up: { name: 'Updraft', desc: 'Creates a column of wind that launches enemies upward', duration: 18, damage: 16, range: 140, color: '#CCFFDD', type: 'launch' },
      down: { name: 'Whirlwind', desc: 'Spins in place creating a whirlwind that damages nearby enemies', duration: 26, damage: 18, range: 150, color: '#77BB99', type: 'groundSlam' },
    },
    superMove: { name: 'Tempest', desc: 'Suzu becomes the wind itself — a massive tornado sweeps the battlefield, cutting enemies with wind blades before launching them skyward', duration: 55, damage: 42, color: '#99DDAA' },
  },
  {
    id: 'g2_mai', name: 'Mai Yoru', title: 'The Twilight Shadow', era: 'g2', role: 'Hero',
    color: '#663399', secondaryColor: '#1a1a2a',
    powerTitle: 'Dusk', powerDescription: 'Manipulates darkness and shadow, allowing stealth, shadow attacks, defensive evasion, and movement through dark areas.',
    weapon: 'Shadow Daggers', stats: { speed: 7, power: 8, defense: 5, utility: 6, control: 9 },
    lore: 'A shadow manipulator who could walk through darkness itself. She was a spy and assassin who struck from the shadows.',
    heavyAttack: { name: 'Shadow Slash', desc: 'Disappears into shadow and reappears behind the opponent with a devastating slash', damage: 24, range: 180, duration: 20, color: '#663399', type: 'teleSlash', knockback: 1.4 },
    signatures: {
      side: { name: 'Shadow Step', desc: 'Teleports through shadow and slashes from behind', duration: 16, damage: 20, range: 200, color: '#663399', type: 'teleSlash' },
      up: { name: 'Dark Spiral', desc: 'A spiral of shadow energy rises upward', duration: 18, damage: 17, range: 120, color: '#9944BB', type: 'spiralRise' },
      down: { name: 'Shadow Bind', desc: 'Pins the enemy\'s shadow to the ground, immobilizing them', duration: 28, damage: 12, range: 140, color: '#442266', type: 'pin' },
    },
    superMove: { name: 'Eternal Night', desc: 'Darkness consumes the battlefield — shadow clones attack from every direction before Mai delivers one final devastating strike', duration: 55, damage: 46, color: '#663399' },
  },
  {
    id: 'g2_osamu', name: 'Osamu Tsuchida', title: 'The Echo', era: 'g2', role: 'Hero',
    color: '#FFCC00', secondaryColor: '#FFDD44',
    powerTitle: 'Echo', powerDescription: 'Uses sound and resonance-like echoes for detection, tactical awareness, disruption, and battlefield support.',
    weapon: 'Resonance Bells', stats: { speed: 5, power: 6, defense: 7, utility: 9, control: 8 },
    lore: 'A sound user who could detect enemies through walls and disrupt their abilities with resonance. A master tactician.',
    heavyAttack: { name: 'Sonic Boom', desc: 'Releases a massive sonic wave that disrupts and damages all nearby enemies', damage: 21, range: 200, duration: 22, color: '#FFCC00', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Echo Pulse', desc: 'Sends a pulse of sound forward that damages and disorients', duration: 20, damage: 17, range: 190, color: '#FFCC00', type: 'laserBlast' },
      up: { name: 'Resonance Rise', desc: 'A column of sound energy launches enemies upward', duration: 18, damage: 15, range: 130, color: '#FFDD44', type: 'launch' },
      down: { name: 'Disruption Field', desc: 'Creates a field of disruptive sound that damages over time', duration: 28, damage: 16, range: 160, color: '#CC9900', type: 'rootBind' },
    },
    superMove: { name: 'Cacophony', desc: 'Osamu creates a deafening symphony of destruction — sound waves crash from every direction before one massive resonance blast', duration: 55, damage: 42, color: '#FFCC00' },
  },
  {
    id: 'g2_yui', name: 'Yui Hoshikawa', title: 'The Starlight Healer', era: 'g2', role: 'Hero',
    color: '#FFFFFF', secondaryColor: '#CCCCCC',
    powerTitle: 'Starlight', powerDescription: 'Uses restorative starlight-based energy for healing, protection, stabilization, and support.',
    weapon: 'Star Scepter', stats: { speed: 4, power: 5, defense: 6, utility: 10, control: 10 },
    lore: 'A gentle healer whose starlight could mend wounds and protect allies. She was the moral heart of her team.',
    heavyAttack: { name: 'Starlight Burst', desc: 'Releases a burst of starlight that damages enemies while healing nearby allies', damage: 18, range: 180, duration: 24, color: '#FFFFFF', type: 'wave', knockback: 1.2 },
    signatures: {
      side: { name: 'Star Beam', desc: 'Fires a focused beam of starlight', duration: 18, damage: 16, range: 200, color: '#FFFFFF', type: 'energyBeam' },
      up: { name: 'Rising Star', desc: 'A pillar of starlight launches enemies upward', duration: 20, damage: 14, range: 130, color: '#FFEEFF', type: 'launch' },
      down: { name: 'Protective Light', desc: 'Creates a field of protective starlight that shields and heals', duration: 30, damage: 10, range: 160, color: '#FFDDFF', type: 'freeze' },
    },
    superMove: { name: 'Celestial Blessing', desc: 'The stars themselves descend — a constellation forms overhead, raining starlight down that heals allies and damages enemies before a massive stellar explosion', duration: 58, damage: 38, color: '#FFFFFF' },
  },
  // ── G2 Villains/Antiheroes ──
  {
    id: 'g2_ibuki', name: 'Hollow Monk — Ibuki', title: 'The Hollow One', era: 'g2', role: 'Antivillain',
    color: '#DDDDDD', secondaryColor: '#660000',
    powerTitle: 'Life Drain', powerDescription: 'Drains life-energy from dying people and redirects it toward others. His philosophy is that mercy always has a cost.',
    weapon: 'Hollow Staff', stats: { speed: 6, power: 7, defense: 5, utility: 8, control: 9 },
    lore: 'A monk who twisted restorative Element 6 into something dangerous. He drains life from the dying and redirects it — mercy with a cost.',
    heavyAttack: { name: 'Life Drain', desc: 'Drains life energy from nearby enemies, healing himself', damage: 20, range: 170, duration: 24, color: '#DDDDDD', type: 'magPull', knockback: 1.2 },
    signatures: {
      side: { name: 'Hollow Hand', desc: 'Reaches out with hollow energy, draining and damaging', duration: 22, damage: 18, range: 180, color: '#DDDDDD', type: 'vineWhip' },
      up: { name: 'Inverted Restoration', desc: 'A pillar of inverted energy launches enemies upward', duration: 20, damage: 16, range: 130, color: '#990000', type: 'launch' },
      down: { name: 'Hollow Field', desc: 'Creates a field that drains life from anyone inside', duration: 28, damage: 18, range: 160, color: '#660000', type: 'rootBind' },
    },
    superMove: { name: 'Mercy\'s Cost', desc: 'Ibuki drains the life from the entire battlefield — a vortex of hollow energy pulls everything inward before exploding with stolen vitality', duration: 55, damage: 42, color: '#DDDDDD' },
  },
  {
    id: 'g2_nishikawa', name: 'Nishikawa the Puppeteer', title: 'The Thread Master', era: 'g2', role: 'Villain',
    color: '#1a1a1a', secondaryColor: '#880000', whiteEyes: true,
    powerTitle: 'Living Thread', powerDescription: 'Creates living Element 6 threads capable of binding people and controlling their movements and behavior.',
    weapon: 'Thread Gauntlets', stats: { speed: 7, power: 7, defense: 5, utility: 8, control: 8 },
    lore: 'A villain who controlled people like puppets with living threads. He could bind and manipulate opponents against their will.',
    heavyAttack: { name: 'Thread Bind', desc: 'Launches threads that wrap around the opponent, binding and crushing them', damage: 21, range: 180, duration: 24, color: '#880000', type: 'cage', knockback: 1.3 },
    signatures: {
      side: { name: 'Thread Whip', desc: 'Whips out threads that lash and bind enemies', duration: 20, damage: 18, range: 190, color: '#880000', type: 'vineWhip' },
      up: { name: 'Marionette', desc: 'Threads launch enemies upward like a puppet', duration: 22, damage: 16, range: 130, color: '#CC0000', type: 'launch' },
      down: { name: 'Thread Prison', desc: 'Creates a web of threads that traps enemies', duration: 28, damage: 14, range: 160, color: '#660000', type: 'rootBind' },
    },
    superMove: { name: 'Grand Marionette', desc: 'Nishikawa creates a massive web of threads across the entire battlefield — enemies are bound and controlled before the threads constrict and explode', duration: 55, damage: 42, color: '#880000' },
  },
  {
    id: 'g2_itto', name: 'Ittō', title: 'The Unnatural Blade', era: 'g2', role: 'Antagonist',
    color: '#555555', secondaryColor: '#660000',
    powerTitle: 'Unnatural Blade', powerDescription: 'Uses an unnatural Element 6-infused blade capable of cutting through defenses and enhanced targets. Extremely close-range and weapon-focused.',
    weapon: 'Element 6 Blade', stats: { speed: 8, power: 8, defense: 6, utility: 4, control: 9 },
    lore: 'A swordsman with an unnatural blade that could cut through any defense. He walked the line between antagonist and antihero.',
    heavyAttack: { name: 'Severing Slash', desc: 'A devastating blade slash that cuts through defenses', damage: 25, range: 170, duration: 18, color: '#660000', type: 'teleSlash', knockback: 1.5 },
    signatures: {
      side: { name: 'Blade Rush', desc: 'Dashes forward with a series of rapid blade strikes', duration: 16, damage: 20, range: 200, color: '#660000', type: 'dash' },
      up: { name: 'Rising Cut', desc: 'A rising slash that launches enemies upward', duration: 18, damage: 18, range: 120, color: '#880000', type: 'launch' },
      down: { name: 'Shearing Strike', desc: 'A downward slash that cuts through the ground', duration: 22, damage: 22, range: 150, color: '#440000', type: 'groundSlam' },
    },
    superMove: { name: 'Severance', desc: 'Ittō\'s blade glows with unnatural energy — he slashes through reality itself, creating dimensional rifts that cut enemies from every angle', duration: 55, damage: 46, color: '#660000' },
  },
  {
    id: 'g2_twinfoxes', name: 'The Twin Foxes', title: 'The Foxfire Duo', era: 'g2', role: 'Antivillain',
    color: '#FF8822', secondaryColor: '#FFFFFF',
    powerTitle: 'Foxfire', powerDescription: 'A coordinated pair capable of deceptive movement, foxfire attacks, misdirection, and teamwork-based combat.',
    weapon: 'Foxfire Orbs', stats: { speed: 8, power: 7, defense: 5, utility: 8, control: 7 },
    lore: 'A duo of foxfire users who fought as one. Their coordination and illusion made them nearly impossible to predict.',
    heavyAttack: { name: 'Twin Strike', desc: 'Both foxes dash from opposite sides, striking simultaneously', damage: 22, range: 200, duration: 20, color: '#FF8822', type: 'dash', knockback: 1.4 },
    signatures: {
      side: { name: 'Foxfire Dash', desc: 'Dashes forward leaving a trail of foxfire', duration: 16, damage: 18, range: 220, color: '#FF8822', type: 'dash' },
      up: { name: 'Illusion Rise', desc: 'Creates illusions that launch enemies upward', duration: 20, damage: 15, range: 130, color: '#FFAA44', type: 'launch' },
      down: { name: 'Foxfire Trap', desc: 'Lays foxfire mines that explode when approached', duration: 28, damage: 20, range: 160, color: '#CC6611', type: 'rootBind' },
    },
    superMove: { name: 'Foxfire Illusion', desc: 'The Twin Foxes create dozens of illusionary copies — foxfire rains from every direction before both converge in a massive coordinated strike', duration: 55, damage: 42, color: '#FF8822' },
  },
  {
    id: 'g2_utsuro', name: 'Utsuro', title: 'The Hollow Sovereign', era: 'g2', role: 'Major Villain',
    color: '#1a1a1a', secondaryColor: '#660066', whiteEyes: true,
    powerTitle: 'Elementor Call', powerDescription: 'Calls forth 3–7 hollowed entities from stolen Element 6 fragments — the random-colored hollows charge forward, and opponents touched lose their power for 30 seconds and suffer knockback but no damage.',
    weapon: 'Stolen Fragments', stats: { speed: 7, power: 9, defense: 8, utility: 7, control: 4 },
    lore: 'A being of stolen Element 6 — countless fragments taken from others. He is a hollow sovereign, powerful beyond measure but empty within.',
    heavyAttack: { name: 'Fragment Burst', desc: 'Releases a burst of stolen Element 6 fragments in all directions', damage: 24, range: 190, duration: 22, color: '#660066', type: 'wave', knockback: 1.4 },
    signatures: {
      side: { name: 'Hollow Drain', desc: 'Drains Element 6 from nearby enemies', duration: 22, damage: 20, range: 180, color: '#660066', type: 'magPull' },
      up: { name: 'Fragment Rise', desc: 'Stolen energy erupts upward, launching enemies', duration: 20, damage: 18, range: 130, color: '#990099', type: 'launch' },
      down: { name: 'Hollow Field', desc: 'Creates a field of hollow energy that drains and damages', duration: 28, damage: 22, range: 160, color: '#440044', type: 'rootBind' },
    },
    superMove: { name: 'Hollow Catastrophe', desc: 'Utsuro unleashes all his stolen fragments — the battlefield is consumed by hollow energy as thousands of fragments crash down in a catastrophic explosion', duration: 60, damage: 48, color: '#660066' },
  },
];

// ═══════════════════════════════════════════════════════════════
// GENERATION III — THE FALLEN AGE
// ═══════════════════════════════════════════════════════════════

const G3_CHARS = [
  {
    id: 'g3_takeshi', name: 'Takeshi Sando', title: 'The Sand Lord', era: 'g3', role: 'Hero',
    color: '#D2B48C', secondaryColor: '#8B7355',
    powerTitle: 'Sand', powerDescription: 'Controls sand for offense, defense, mobility, traps, battlefield shaping, and large-area manipulation.',
    weapon: 'Sand Gourd', stats: { speed: 6, power: 7, defense: 6, utility: 8, control: 8 },
    lore: 'A master of sand who could reshape entire battlefields. He was both offensive powerhouse and tactical controller.',
    heavyAttack: { name: 'Sand Avalanche', desc: 'Sends a massive wave of sand crashing forward', damage: 22, range: 190, duration: 24, color: '#D2B48C', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Sand Spear', desc: 'Forms a spear of compressed sand and thrusts it forward', duration: 18, damage: 18, range: 200, color: '#D2B48C', type: 'laserBlast' },
      up: { name: 'Sand Geyser', desc: 'Erupts a geyser of sand from below', duration: 20, damage: 16, range: 130, color: '#C8A878', type: 'launch' },
      down: { name: 'Quicksand', desc: 'Turns the ground to quicksand, trapping enemies', duration: 28, damage: 14, range: 160, color: '#8B7355', type: 'rootBind' },
    },
    superMove: { name: 'Desert Storm', desc: 'Takeshi creates a massive sandstorm — sand tears across the battlefield, blinding and damaging enemies before a giant sand fist crashes down', duration: 58, damage: 44, color: '#D2B48C' },
  },
  {
    id: 'g3_aiko', name: 'Aiko Hone', title: 'The Bone Maiden', era: 'g3', role: 'Hero',
    color: '#F5F5DC', secondaryColor: '#DEB887',
    powerTitle: 'Bone', powerDescription: 'Creates and manipulates bone structures for attacks, armor, weapons, and defensive constructs.',
    weapon: 'Bone Blade', stats: { speed: 5, power: 8, defense: 7, utility: 7, control: 8 },
    lore: 'A bone manipulator who could grow weapons and armor from her own skeleton. She was feared and respected in equal measure.',
    heavyAttack: { name: 'Bone Spike', desc: 'Erupts massive bone spikes from the ground beneath opponents', damage: 23, range: 160, duration: 24, color: '#F5F5DC', type: 'groundSlam', knockback: 1.4 },
    signatures: {
      side: { name: 'Bone Blade', desc: 'Forms a blade of bone and slashes forward', duration: 20, damage: 19, range: 180, color: '#F5F5DC', type: 'vineWhip' },
      up: { name: 'Bone Cage', desc: 'Creates a cage of bones that launches enemies upward', duration: 22, damage: 16, range: 130, color: '#DEB887', type: 'launch' },
      down: { name: 'Bone Armor', desc: 'Encases herself in bone armor, reflecting damage', duration: 28, damage: 14, range: 120, color: '#C8B887', type: 'rootBind' },
    },
    superMove: { name: 'Skeleton Army', desc: 'Aiko creates an army of bone constructs — they charge across the battlefield, attacking from every direction before a massive bone titan rises and crashes down', duration: 58, damage: 44, color: '#F5F5DC' },
  },
  {
    id: 'g3_haru', name: 'Haru Garasu', title: 'The Glass artisan', era: 'g3', role: 'Hero',
    color: '#E0FFFF', secondaryColor: '#B0E0E6',
    powerTitle: 'Glass', powerDescription: 'Creates precise glass constructs, barriers, lattices, weapons, and defensive structures.',
    weapon: 'Glass Staff', stats: { speed: 5, power: 6, defense: 8, utility: 8, control: 8 },
    lore: 'A glass user who created beautiful and deadly constructs. Her precision was unmatched — every structure was both art and weapon.',
    heavyAttack: { name: 'Glass Shatter', desc: 'Creates a glass construct that explodes into thousands of shards', damage: 22, range: 170, duration: 22, color: '#E0FFFF', type: 'groundSlam', knockback: 1.3 },
    signatures: {
      side: { name: 'Glass Lance', desc: 'Fires a lance of compressed glass', duration: 18, damage: 18, range: 200, color: '#E0FFFF', type: 'laserBlast' },
      up: { name: 'Glass Wall', desc: 'Creates a wall of glass that launches enemies upward when shattered', duration: 22, damage: 16, range: 130, color: '#B0E0E6', type: 'launch' },
      down: { name: 'Glass Field', desc: 'Covers the ground in glass shards that damage enemies', duration: 28, damage: 16, range: 160, color: '#A0C4C4', type: 'rootBind' },
    },
    superMove: { name: 'Crystal Cathedral', desc: 'Haru creates an enormous glass cathedral around the battlefield — glass pillars, walls, and shards erupt from every direction before the entire structure shatters in a catastrophic explosion', duration: 60, damage: 44, color: '#E0FFFF' },
  },
  {
    id: 'g3_chiyo', name: 'Chiyo Doku', title: 'The Venom Queen', era: 'g3', role: 'Hero',
    color: '#44AA44', secondaryColor: '#226622',
    powerTitle: 'Venom', powerDescription: 'Creates and manipulates venom and poisonous substances for attacks, traps, and battlefield control.',
    weapon: 'Venom Claws', stats: { speed: 7, power: 8, defense: 5, utility: 7, control: 8 },
    lore: 'A venom user who could create deadly poisons from nothing. Her attacks were as lethal as they were varied.',
    heavyAttack: { name: 'Venom Splash', desc: 'Splashes a burst of concentrated venom that corrodes and damages', damage: 22, range: 170, duration: 24, color: '#44AA44', type: 'wave', knockback: 1.2 },
    signatures: {
      side: { name: 'Venom Strike', desc: 'Claws forward, leaving venom that damages over time', duration: 20, damage: 19, range: 180, color: '#44AA44', type: 'vineWhip' },
      up: { name: 'Toxic Rise', desc: 'A pillar of venom erupts upward', duration: 20, damage: 16, range: 130, color: '#66CC66', type: 'launch' },
      down: { name: 'Venom Pool', desc: 'Creates a pool of venom that damages over time', duration: 28, damage: 18, range: 150, color: '#226622', type: 'rootBind' },
    },
    superMove: { name: 'Plague', desc: 'Chiyo releases a plague of venom — toxic clouds spread across the battlefield, venom rains from above, and a massive venomous serpent rises and strikes', duration: 55, damage: 44, color: '#44AA44' },
  },
  {
    id: 'g3_emi', name: 'Emi Chi', title: 'The Blood Seer', era: 'g3', role: 'Hero',
    color: '#DC143C', secondaryColor: '#FFFFFF',
    powerTitle: 'Blood-Sensing', powerDescription: 'Can sense biological conditions through blood-related Element 6 abilities. Specializes in medical support, detection, stabilization, and emergency intervention.',
    weapon: 'Blood Needles', stats: { speed: 5, power: 5, defense: 5, utility: 10, control: 10 },
    lore: 'A medical specialist who could sense life through blood. She saved countless lives during the Fallen Age.',
    heavyAttack: { name: 'Blood Spike', desc: 'Forms a spike of crystallized blood and fires it', damage: 18, range: 180, duration: 22, color: '#DC143C', type: 'laserBlast', knockback: 1.2 },
    signatures: {
      side: { name: 'Blood Sense', desc: 'Detects enemies and strikes with blood energy', duration: 20, damage: 16, range: 200, color: '#DC143C', type: 'energyBeam' },
      up: { name: 'Rising Blood', desc: 'A pillar of blood energy launches enemies upward', duration: 20, damage: 14, range: 130, color: '#FF4466', type: 'launch' },
      down: { name: 'Healing Field', desc: 'Creates a field that stabilizes and protects', duration: 30, damage: 8, range: 160, color: '#FFAAAA', type: 'freeze' },
    },
    superMove: { name: 'Vital Resonance', desc: 'Emi senses the blood of every enemy — blood energy erupts from within them, dealing massive damage before a wave of healing energy washes over the battlefield', duration: 58, damage: 40, color: '#DC143C' },
  },
  {
    id: 'g3_nozomi', name: 'Nozomi Toge', title: 'The Thorned Maiden', era: 'g3', role: 'Hero',
    color: '#228822', secondaryColor: '#114411',
    powerTitle: 'Thorned Vines', powerDescription: 'Creates and manipulates thorn-covered vines for attacks, restraints, barriers, traps, and environmental control.',
    weapon: 'Thorn Whip', stats: { speed: 5, power: 6, defense: 7, utility: 8, control: 9 },
    lore: 'A vine manipulator whose thorn-covered vines could trap and tear. She was a master of battlefield control.',
    heavyAttack: { name: 'Thorn Prison', desc: 'Erupts thorned vines that wrap around and crush the opponent', damage: 21, range: 160, duration: 26, color: '#228822', type: 'cage', knockback: 1.3 },
    signatures: {
      side: { name: 'Thorn Lash', desc: 'Whips out thorned vines in a wide arc', duration: 20, damage: 18, range: 190, color: '#228822', type: 'vineWhip' },
      up: { name: 'Vine Rise', desc: 'Vines erupt from the ground, launching enemies', duration: 22, damage: 16, range: 130, color: '#44AA44', type: 'launch' },
      down: { name: 'Thorn Field', desc: 'Covers the ground in thorns that damage and slow', duration: 28, damage: 16, range: 160, color: '#114411', type: 'rootBind' },
    },
    superMove: { name: 'Thorn Forest', desc: 'Nozomi creates an entire forest of thorned vines — they erupt from everywhere, wrapping and tearing at enemies before a colossal thorned flower blooms and explodes', duration: 58, damage: 42, color: '#228822' },
  },
  {
    id: 'g3_masaru', name: 'Masaru Hai', title: 'The Ash Reckoner', era: 'g3', role: 'Hero',
    color: '#36454F', secondaryColor: '#708090', whiteEyes: true,
    powerTitle: 'Ash', powerDescription: 'Uses ash aggressively for attacks and battlefield disruption. His fighting style feels reckless and emotionally driven.',
    weapon: 'Ash Gauntlets', stats: { speed: 6, power: 8, defense: 5, utility: 7, control: 9 },
    lore: 'An ash user whose reckless style reflected his inner turmoil. He fought with raw emotion, overwhelming enemies with ash storms.',
    heavyAttack: { name: 'Ash Burst', desc: 'Releases a burst of burning ash in all directions', damage: 23, range: 170, duration: 22, color: '#36454F', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Ash Dash', desc: 'Dashes forward as a cloud of burning ash', duration: 16, damage: 19, range: 220, color: '#36454F', type: 'dash' },
      up: { name: 'Ash Rise', desc: 'A pillar of ash launches enemies upward', duration: 18, damage: 17, range: 130, color: '#708090', type: 'launch' },
      down: { name: 'Ash Storm', desc: 'Creates a storm of burning ash that damages over time', duration: 28, damage: 20, range: 160, color: '#2F4F4F', type: 'rootBind' },
    },
    superMove: { name: 'Cremation', desc: 'Masaru creates a massive ash storm that consumes the battlefield — burning ash rains from above, obscuring everything before a catastrophic ash explosion', duration: 58, damage: 46, color: '#36454F' },
  },
  {
    id: 'g3_ryo', name: 'Ryo Kiri', title: 'The Mist Walker', era: 'g3', role: 'Hero',
    color: '#C0C0C0', secondaryColor: '#A0B0C0',
    powerTitle: 'Mist', powerDescription: 'Manipulates mist for stealth, movement, infiltration, concealment, battlefield confusion, and reconnaissance.',
    weapon: 'Mist Cloak', stats: { speed: 8, power: 4, defense: 4, utility: 9, control: 10 },
    lore: 'A mist manipulator who could vanish into thin air. He was a spy and infiltrator without peer.',
    heavyAttack: { name: 'Mist Veil', desc: 'Creates a dense mist that obscures vision and damages enemies', damage: 18, range: 180, duration: 24, color: '#C0C0C0', type: 'wave', knockback: 1.1 },
    signatures: {
      side: { name: 'Mist Step', desc: 'Vanishes into mist and reappears with a strike', duration: 14, damage: 16, range: 220, color: '#C0C0C0', type: 'teleSlash' },
      up: { name: 'Mist Rise', desc: 'A column of mist launches enemies upward', duration: 20, damage: 14, range: 130, color: '#D0D0E0', type: 'launch' },
      down: { name: 'Mist Field', desc: 'Creates a field of dense mist that disorients and damages', duration: 28, damage: 12, range: 170, color: '#A0B0C0', type: 'freeze' },
    },
    superMove: { name: 'Shrouded Realm', desc: 'Ryo engulfs the entire battlefield in impenetrable mist — enemies are disoriented and attacked from the fog before a massive condensation blast', duration: 55, damage: 38, color: '#C0C0C0' },
  },
  {
    id: 'g3_souta', name: 'Souta', title: 'The Young Ash', era: 'g3', role: 'Hero',
    color: '#404040', secondaryColor: '#606060', whiteEyes: true,
    powerTitle: 'Ash', powerDescription: 'A younger, still-developing ash user whose abilities are less refined but capable of growing into more advanced techniques.',
    weapon: 'Ash Gloves', stats: { speed: 4, power: 6, defense: 6, utility: 9, control: 10 },
    lore: 'A young ash user with raw potential. His abilities were unrefined but growing stronger with each battle.',
    heavyAttack: { name: 'Ash Cloud', desc: 'Releases a cloud of ash that damages and obscures', damage: 19, range: 160, duration: 24, color: '#404040', type: 'wave', knockback: 1.2 },
    signatures: {
      side: { name: 'Ash Punch', desc: 'A punch wreathed in ash', duration: 18, damage: 17, range: 170, color: '#404040', type: 'dash' },
      up: { name: 'Ash Rise', desc: 'A burst of ash launches enemies upward', duration: 20, damage: 14, range: 130, color: '#606060', type: 'launch' },
      down: { name: 'Ash Field', desc: 'Creates a field of ash that damages over time', duration: 28, damage: 16, range: 150, color: '#303030', type: 'rootBind' },
    },
    superMove: { name: 'Awakening', desc: 'Souta\'s power surges — ash erupts from his body in a massive storm, growing in intensity before exploding outward in a devastating wave', duration: 55, damage: 40, color: '#404040' },
  },
  // ── G3 Antagonists ──
  {
    id: 'g3_ogata', name: 'Ogata', title: 'The Extractor', era: 'g3', role: 'Villain',
    color: '#2F4F2F', secondaryColor: '#0a0a0a',
    powerTitle: 'Extraction Tech', powerDescription: 'A disgraced physician who refined the process of artificially forcing Element 6 into people. Uses experimental equipment and artificial power.',
    weapon: 'Extraction Gear', stats: { speed: 4, power: 7, defense: 4, utility: 10, control: 10 },
    lore: 'A disgraced physician who forced Element 6 into people artificially. His methods were unethical and dangerous.',
    heavyAttack: { name: 'Extraction Ray', desc: 'Fires an extraction beam that drains and damages', damage: 20, range: 190, duration: 24, color: '#2F4F2F', type: 'energyBeam', knockback: 1.2 },
    signatures: {
      side: { name: 'Extraction Pulse', desc: 'Sends a pulse that drains energy', duration: 22, damage: 18, range: 180, color: '#2F4F2F', type: 'magPull' },
      up: { name: 'Forced Awakening', desc: 'Artificial energy erupts upward, launching enemies', duration: 20, damage: 16, range: 130, color: '#4F6F4F', type: 'launch' },
      down: { name: 'Extraction Field', desc: 'Creates a field that drains Element 6', duration: 28, damage: 20, range: 160, color: '#1F2F1F', type: 'rootBind' },
    },
    superMove: { name: 'Mass Extraction', desc: 'Ogata activates his full extraction apparatus — tendrils of energy reach across the battlefield, draining everything before a massive energy explosion', duration: 58, damage: 42, color: '#2F4F2F' },
  },
  {
    id: 'g3_kanenobu', name: 'Lord Kanenobu', title: 'The Golden Lord', era: 'g3', role: 'Antagonist',
    color: '#B8860B', secondaryColor: '#0a0a0a',
    powerTitle: 'Political Influence', powerDescription: 'No natural Element 6. Uses political influence, hired combat technology, weapons, guards, and tactical tools as his combat kit.',
    weapon: 'Tactical Arsenal', stats: { speed: 5, power: 5, defense: 5, utility: 10, control: 10 },
    lore: 'A lord with no Element 6 who wielded political power and hired muscle. He was a strategic threat, not a personal one.',
    heavyAttack: { name: 'Guard Strike', desc: 'Calls in a guard to strike with a weapon', damage: 19, range: 170, duration: 24, color: '#B8860B', type: 'dash', knockback: 1.3 },
    signatures: {
      side: { name: 'Hired Blade', desc: 'Sends a hired warrior forward to attack', duration: 22, damage: 17, range: 190, color: '#B8860B', type: 'vineWhip' },
      up: { name: 'Artillery Call', desc: 'Calls in an artillery strike from above', duration: 24, damage: 18, range: 150, color: '#DAA520', type: 'launch' },
      down: { name: 'Tactical Trap', desc: 'Lays a trap with hired guards', duration: 28, damage: 16, range: 160, color: '#8B7500', type: 'rootBind' },
    },
    superMove: { name: 'Full Retinue', desc: 'Kanenobu calls in his entire retinue — guards, warriors, and artillery all strike at once from every direction', duration: 55, damage: 40, color: '#B8860B' },
  },
];

// ═══════════════════════════════════════════════════════════════
// GENERATION IV — THE HERO CORPS
// ═══════════════════════════════════════════════════════════════

const G4_CHARS = [
  {
    id: 'g4_cobalt', name: 'Cobalt — Kenji Aoyama', title: 'The Blue Shield', era: 'g4', role: 'Hero',
    color: '#0047AB', secondaryColor: '#3366CC',
    powerTitle: 'Barrier Constructs', powerDescription: 'Creates dense blue-shimmering force barriers and constructs for defense, protection, and battlefield control.',
    weapon: 'Barrier Projector', stats: { speed: 6, power: 6, defense: 8, utility: 8, control: 7 },
    lore: 'A Hero Corps member who creates impenetrable blue barriers. He is the defensive backbone of any team.',
    heavyAttack: { name: 'Barrier Bash', desc: 'Creates a barrier and charges forward, crushing enemies', damage: 21, range: 170, duration: 24, color: '#0047AB', type: 'dash', knockback: 1.4 },
    signatures: {
      side: { name: 'Barrier Wall', desc: 'Creates a wall of force that pushes enemies sideways', duration: 24, damage: 16, range: 180, color: '#0047AB', type: 'wave' },
      up: { name: 'Barrier Rise', desc: 'A barrier erupts from the ground, launching enemies', duration: 22, damage: 15, range: 130, color: '#3366CC', type: 'launch' },
      down: { name: 'Barrier Dome', desc: 'Creates a protective dome that traps enemies inside', duration: 28, damage: 14, range: 150, color: '#0033AA', type: 'rootBind' },
    },
    superMove: { name: 'Fortress', desc: 'Cobalt creates an enormous barrier fortress — walls, pillars, and domes of blue energy erupt across the battlefield before collapsing inward in a massive implosion', duration: 58, damage: 42, color: '#0047AB' },
  },
  {
    id: 'g4_cyan', name: 'Cyan — Reiji Fuma', title: 'The Wind Rider', era: 'g4', role: 'Hero',
    color: '#00B7EB', secondaryColor: '#66DDEE',
    powerTitle: 'Wind', powerDescription: 'Controls wind for mobility, ranged attacks, aerial movement, and battlefield manipulation.',
    weapon: 'Wind Blades', stats: { speed: 8, power: 7, defense: 5, utility: 8, control: 7 },
    lore: 'A Hero Corps wind user who moves like the breeze and strikes like a hurricane.',
    heavyAttack: { name: 'Cyclone Slash', desc: 'Creates a cyclone of wind blades that cuts through enemies', damage: 22, range: 190, duration: 22, color: '#00B7EB', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Wind Blade', desc: 'Fires a blade of compressed wind', duration: 18, damage: 18, range: 200, color: '#00B7EB', type: 'laserBlast' },
      up: { name: 'Updraft', desc: 'Creates a column of wind that launches enemies', duration: 20, damage: 16, range: 130, color: '#66DDEE', type: 'launch' },
      down: { name: 'Whirlwind', desc: 'Creates a whirlwind that traps and damages', duration: 26, damage: 17, range: 150, color: '#0099CC', type: 'rootBind' },
    },
    superMove: { name: 'Hurricane', desc: 'Cyan creates a massive hurricane — wind blades cut from every direction, enemies are swept into the air, and the eye of the storm explodes', duration: 55, damage: 44, color: '#00B7EB' },
  },
  {
    id: 'g4_onyx', name: 'Onyx — Ayaka Kurosawa', title: 'The Shadow Agent', era: 'g4', role: 'Hero',
    color: '#0B0B0B', secondaryColor: '#333333', whiteEyes: true,
    powerTitle: 'Shadow', powerDescription: 'Manipulates shadows for stealth, movement, attacks, evasion, and infiltration.',
    weapon: 'Shadow Blades', stats: { speed: 7, power: 6, defense: 5, utility: 9, control: 8 },
    lore: 'A Hero Corps shadow operative who strikes from darkness. She is the Corps\' top infiltrator.',
    heavyAttack: { name: 'Shadow Strike', desc: 'Vanishes into shadow and reappears with a devastating strike', damage: 23, range: 180, duration: 20, color: '#0B0B0B', type: 'teleSlash', knockback: 1.4 },
    signatures: {
      side: { name: 'Shadow Step', desc: 'Teleports through shadow and strikes from behind', duration: 16, damage: 19, range: 200, color: '#333333', type: 'teleSlash' },
      up: { name: 'Shadow Rise', desc: 'A pillar of shadow energy launches enemies', duration: 18, damage: 17, range: 130, color: '#555555', type: 'launch' },
      down: { name: 'Shadow Bind', desc: 'Pins the enemy\'s shadow, immobilizing them', duration: 28, damage: 14, range: 140, color: '#1a1a1a', type: 'pin' },
    },
    superMove: { name: 'Eclipse', desc: 'Onyx engulfs the battlefield in shadow — darkness consumes everything, shadow clones attack from every direction, before she delivers one final devastating strike', duration: 55, damage: 44, color: '#0B0B0B' },
  },
  {
    id: 'g4_gold', name: 'Gold — Sora Kanade', title: 'The Light of Restoration', era: 'g4', role: 'Hero',
    color: '#FFD700', secondaryColor: '#FFEE88',
    powerTitle: 'Restoration', powerDescription: 'Uses restorative light to heal, stabilize, restore, and protect others.',
    weapon: 'Light Staff', stats: { speed: 4, power: 7, defense: 5, utility: 10, control: 9 },
    lore: 'The Hero Corps\' top support operative. Her restorative light can mend any wound and shield any ally.',
    heavyAttack: { name: 'Light Burst', desc: 'Releases a burst of golden light that damages enemies and heals allies', damage: 19, range: 180, duration: 24, color: '#FFD700', type: 'wave', knockback: 1.2 },
    signatures: {
      side: { name: 'Light Beam', desc: 'Fires a beam of concentrated light', duration: 18, damage: 17, range: 200, color: '#FFD700', type: 'energyBeam' },
      up: { name: 'Rising Light', desc: 'A pillar of golden light launches enemies upward', duration: 20, damage: 15, range: 130, color: '#FFEE88', type: 'launch' },
      down: { name: 'Sanctuary', desc: 'Creates a field of protective light', duration: 30, damage: 10, range: 160, color: '#FFD700', type: 'freeze' },
    },
    superMove: { name: 'Radiance', desc: 'Gold calls down a pillar of heavenly light — the entire battlefield is bathed in golden radiance, healing allies and burning enemies before a massive light explosion', duration: 58, damage: 40, color: '#FFD700' },
  },
  {
    id: 'g4_vermilion', name: 'Vermilion — Haruto Ban', title: 'The Crimson Flame', era: 'g4', role: 'Hero',
    color: '#E34234', secondaryColor: '#FF6655',
    powerTitle: 'Fire', powerDescription: 'Generates and manipulates fire for direct offensive combat.',
    weapon: 'Flame Sword', stats: { speed: 6, power: 9, defense: 6, utility: 7, control: 7 },
    lore: 'The Hero Corps\' primary offensive fighter. His flames burn hotter than any natural fire.',
    heavyAttack: { name: 'Flame Crash', desc: 'A devastating sword strike wreathed in fire', damage: 24, range: 170, duration: 20, color: '#E34234', type: 'groundSlam', knockback: 1.5 },
    signatures: {
      side: { name: 'Flame Rush', desc: 'Charges forward wreathed in flame', duration: 16, damage: 20, range: 220, color: '#E34234', type: 'dash' },
      up: { name: 'Fire Rise', desc: 'A pillar of fire launches enemies upward', duration: 18, damage: 17, range: 130, color: '#FF6655', type: 'launch' },
      down: { name: 'Magma Field', desc: 'Creates a field of magma that damages over time', duration: 28, damage: 19, range: 150, color: '#CC2200', type: 'rootBind' },
    },
    superMove: { name: 'Crimson Inferno', desc: 'Vermilion unleashes his full power — the battlefield is consumed by crimson flames, fire erupts from every surface, and a massive fireball crashes down', duration: 55, damage: 46, color: '#E34234' },
  },
  {
    id: 'g4_umber', name: 'Umber — Yumi Sato', title: 'The Ground Listener', era: 'g4', role: 'Hero',
    color: '#8B4513', secondaryColor: '#A0522D',
    powerTitle: 'Tremor-Sense', powerDescription: 'Senses vibrations through the ground and combines that awareness with highly trained close-range martial arts.',
    weapon: 'Martial Arts', stats: { speed: 7, power: 7, defense: 7, utility: 7, control: 7 },
    lore: 'A martial artist who can sense every movement through the ground. No enemy can sneak up on her.',
    heavyAttack: { name: 'Tremor Strike', desc: 'Strikes the ground, sending a shockwave of vibrations', damage: 22, range: 180, duration: 22, color: '#8B4513', type: 'groundSlam', knockback: 1.4 },
    signatures: {
      side: { name: 'Ground Pulse', desc: 'Sends a pulse through the ground that damages enemies', duration: 20, damage: 18, range: 190, color: '#8B4513', type: 'quake' },
      up: { name: 'Rising Kick', desc: 'A rising martial arts kick launches enemies', duration: 18, damage: 17, range: 120, color: '#A0522D', type: 'launch' },
      down: { name: 'Tremor Field', desc: 'Creates a field of vibrations that damages and disrupts', duration: 28, damage: 16, range: 160, color: '#6B3410', type: 'rootBind' },
    },
    superMove: { name: 'Seismic Catastrophe', desc: 'Umber strikes the ground with perfect precision — the entire battlefield shakes, cracks spread everywhere, and a massive earthquake erupts', duration: 58, damage: 44, color: '#8B4513' },
  },
  {
    id: 'g4_graphite', name: 'Graphite — Chika Enomoto', title: 'The Resonance Analyst', era: 'g4', role: 'Hero',
    color: '#383838', secondaryColor: '#585858', whiteEyes: true,
    powerTitle: 'Resonance Analysis', powerDescription: 'Reads and analyzes the resonance of environments, structures, Element 6 signatures, and unusual energy patterns.',
    weapon: 'Resonance Scanner', stats: { speed: 4, power: 6, defense: 6, utility: 10, control: 9 },
    lore: 'A support specialist who reads the battlefield like a book. Her analysis gives her team every advantage.',
    heavyAttack: { name: 'Resonance Blast', desc: 'Fires a concentrated blast of resonance energy', damage: 19, range: 180, duration: 22, color: '#383838', type: 'energyBeam', knockback: 1.2 },
    signatures: {
      side: { name: 'Resonance Pulse', desc: 'Sends a pulse that reveals and damages', duration: 20, damage: 16, range: 200, color: '#383838', type: 'laserBlast' },
      up: { name: 'Frequency Rise', desc: 'A column of resonance energy launches enemies', duration: 20, damage: 14, range: 130, color: '#585858', type: 'launch' },
      down: { name: 'Analysis Field', desc: 'Creates a field that disrupts enemy abilities', duration: 28, damage: 12, range: 160, color: '#282828', type: 'freeze' },
    },
    superMove: { name: 'Full Spectrum', desc: 'Graphite activates her full scanner — resonance waves sweep the battlefield, analyzing and damaging everything before a massive frequency blast', duration: 55, damage: 40, color: '#383838' },
  },
  {
    id: 'g4_daichi', name: 'Daichi Ishii', title: 'The Resonance Engineer', era: 'g4', role: 'Hero',
    color: '#71797E', secondaryColor: '#919A9F',
    powerTitle: 'Resonance Technology', powerDescription: 'Does not naturally manifest Element 6. A resonance-tech engineer who creates equipment capable of interacting with Element 6 signatures. His Power stat represents technology, not natural Element 6.',
    weapon: 'Resonance Tech Gear', stats: { speed: 3, power: 7, defense: 6, utility: 10, control: 9 },
    lore: 'An engineer with no Element 6 who builds technology that can interact with it. His gear is his power.',
    heavyAttack: { name: 'Tech Blast', desc: 'Fires a blast from his resonance tech', damage: 21, range: 180, duration: 22, color: '#71797E', type: 'laserBlast', knockback: 1.3 },
    signatures: {
      side: { name: 'Tech Pulse', desc: 'Sends a pulse from his equipment', duration: 20, damage: 17, range: 190, color: '#71797E', type: 'energyBeam' },
      up: { name: 'Tech Launch', desc: 'Uses his tech to launch enemies upward', duration: 20, damage: 15, range: 130, color: '#919A9F', type: 'launch' },
      down: { name: 'Tech Field', desc: 'Deploys a field of resonance tech that damages', duration: 28, damage: 18, range: 160, color: '#51595E', type: 'rootBind' },
    },
    superMove: { name: 'Overload Protocol', desc: 'Daichi activates his full arsenal — every piece of resonance tech fires simultaneously, creating a devastating barrage before a massive energy core detonates', duration: 58, damage: 42, color: '#71797E' },
  },
  // ── G4 Villains ──
  {
    id: 'g4_renko', name: 'Renko Kurenai', title: 'The Crimson Ring Leader', era: 'g4', role: 'Villain',
    color: '#8B0000', secondaryColor: '#0a0a0a',
    powerTitle: 'Extraction Technology', powerDescription: 'Leader of the Kurenai Ring/Harvest Guild, pursuing artificial Element 6 extraction and refinement.',
    weapon: 'Extraction Apparatus', stats: { speed: 6, power: 8, defense: 6, utility: 8, control: 7 },
    lore: 'The leader of the Harvest Guild who extracts Element 6 artificially. She is a dangerous and ambitious criminal.',
    heavyAttack: { name: 'Extraction Beam', desc: 'Fires a beam that extracts and damages', damage: 22, range: 190, duration: 22, color: '#8B0000', type: 'energyBeam', knockback: 1.3 },
    signatures: {
      side: { name: 'Drain Pulse', desc: 'Sends a pulse that drains energy', duration: 22, damage: 19, range: 180, color: '#8B0000', type: 'magPull' },
      up: { name: 'Harvest Rise', desc: 'Energy erupts upward, launching enemies', duration: 20, damage: 17, range: 130, color: '#BB0000', type: 'launch' },
      down: { name: 'Extraction Field', desc: 'Creates a field that drains and damages', duration: 28, damage: 20, range: 160, color: '#5B0000', type: 'rootBind' },
    },
    superMove: { name: 'Total Harvest', desc: 'Renko activates her full extraction apparatus — tendrils of crimson energy reach across the entire battlefield, draining everything before a massive detonation', duration: 58, damage: 44, color: '#8B0000' },
  },
];

// ═══════════════════════════════════════════════════════════════
// ALL OLD-GEN CHARACTERS COMBINED
// ═══════════════════════════════════════════════════════════════

export const OLD_GEN_CHARS = [...G1_CHARS, ...G2_CHARS, ...G3_CHARS, ...G4_CHARS];

export const OLD_GEN_BY_ERA = {
  g1: G1_CHARS,
  g2: G2_CHARS,
  g3: G3_CHARS,
  g4: G4_CHARS,
  g5: [], // G5 uses existing HEROES + VILLAINS + GUARDIANS
};

export const OLD_GEN_MAP = Object.fromEntries(OLD_GEN_CHARS.map(c => [c.id, c]));

// Get all playable characters from an era (including G5 existing chars)
export function getEraRoster(eraId, existingHeroes = [], existingVillains = [], existingGuardians = []) {
  if (eraId === 'g5') {
    return [...existingHeroes, ...existingVillains, ...existingGuardians];
  }
  return OLD_GEN_BY_ERA[eraId] || [];
}

// Get character by id from any era
export function getCharById(id, existingHeroes = [], existingVillains = [], existingGuardians = []) {
  if (OLD_GEN_MAP[id]) return OLD_GEN_MAP[id];
  const all = [...existingHeroes, ...existingVillains, ...existingGuardians];
  return all.find(c => c.id === id);
}

// Get era label for a character
export function getCharEra(char) {
  if (!char) return null;
  if (char.era) return ERA_MAP[char.era];
  // G5 characters don't have an era field — they're the current era
  return ERA_MAP['g5'];
}

// Get era for any character id (old or new)
export function getEraForCharId(id, existingHeroes = [], existingVillains = [], existingGuardians = []) {
  if (OLD_GEN_MAP[id]) return ERA_MAP[OLD_GEN_MAP[id].era];
  return ERA_MAP['g5'];
}

// Random helpers
export function randomEra() {
  return ERAS[Math.floor(Math.random() * ERAS.length)].id;
}

export function randomCharFromEra(eraId, existingHeroes = [], existingVillains = [], existingGuardians = []) {
  const roster = getEraRoster(eraId, existingHeroes, existingVillains, existingGuardians);
  return roster.length ? roster[Math.floor(Math.random() * roster.length)] : null;
}

export function randomCharFromAllEras(existingHeroes = [], existingVillains = [], existingGuardians = []) {
  const all = [...OLD_GEN_CHARS, ...existingHeroes, ...existingVillains, ...existingGuardians];
  return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

// Search all characters by name/power/era
export function searchAllChars(query, existingHeroes = [], existingVillains = [], existingGuardians = []) {
  if (!query) return [];
  const q = query.toLowerCase();
  const results = [];
  for (const c of OLD_GEN_CHARS) {
    if (c.name.toLowerCase().includes(q) || c.powerTitle.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) {
      results.push({ ...c, eraInfo: ERA_MAP[c.era] });
    }
  }
  for (const c of [...existingHeroes, ...existingVillains, ...existingGuardians]) {
    if (c.name.toLowerCase().includes(q) || (c.power && c.power.toLowerCase().includes(q)) || (c.title && c.title.toLowerCase().includes(q))) {
      results.push({ ...c, eraInfo: ERA_MAP['g5'] });
    }
  }
  return results;
}