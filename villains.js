// Villain data — ordered by encounter sequence per the user's specification
// Each villain has: weapon, power, heavyAttack (unique), signatures (side/up/down), superMove
// Order: Corpent, Magneto, Willow, Cable, Snodvor, Kirsten, Volt, Temple, Nightmare, Hazel, Whami, Controller, Evil

export const VILLAINS = [
  {
    id: 'corpent', name: 'Corpent', title: 'The Hammer Brute', color: '#775533', secondaryColor: '#997755',
    weapon: 'Construction Hammer', power: 'Hammer Slam', encounterOrder: 1,
    stats: { power: 9, speed: 5, defense: 8, utility: 7, control: 6 },
    lore: 'A massive brute who swings a giant construction hammer with devastating force. His hammer automatically homes toward the nearest opponent, knocks enemies away on impact, and returns like a boomerang after missing or hitting.',
    heavyAttack: { name: 'Hammer Crash', desc: 'Slams his construction hammer down with venom-coated force, leaving a toxic crater that damages enemies standing in it', damage: 20, range: 170, duration: 24, color: '#775533', type: 'groundSlam', knockback: 1.4 },
    signatures: {
      side: { name: 'Venom Smash', desc: 'Hammer smash coated in venom', duration: 22, damage: 14, range: 140, color: '#775533', type: 'groundSlam' },
      up:   { name: 'Serpent Rise', desc: 'Strikes upward with both daggers in a serpent motion', duration: 24, damage: 12, range: 110, color: '#997755', type: 'launch' },
      down: { name: 'Venom Pool', desc: 'Spills venom on the ground that damages over time', duration: 28, damage: 14, range: 130, color: '#554422', type: 'rootBind' },
    },
    superMove: { name: 'King\'s Venom', desc: 'A gigantic spectral cobra rises behind Corpent. It spits streams of venom across the battlefield before lunging forward with a devastating bite that poisons everyone it hits', duration: 50, damage: 35, color: '#775533' },
  },
  {
    id: 'magneto', name: 'Magneto', title: 'The Iron Tyrant', color: '#AAAAAA', secondaryColor: '#CCCCCC',
    weapon: 'Magnetic Halberd', power: 'Metal Pull', encounterOrder: 2,
    stats: { power: 8, speed: 5, defense: 8, utility: 7, control: 7 },
    lore: 'Attracts everything to himself. Uses magnetic force to control the battlefield, pulling opponents in before devastating them.',
    heavyAttack: { name: 'Magnetic Pull', desc: 'Pulls nearby opponents toward him before spinning his halberd in a powerful circular strike', damage: 22, range: 200, duration: 26, color: '#AAAAAA', type: 'magPull', knockback: 1.4 },
    signatures: {
      side: { name: 'Magnetic Pull', desc: 'Pulls enemy toward self with magnetic force', duration: 22, damage: 16, range: 200, color: '#AAAAAA', type: 'magPull' },
      up:   { name: 'Metal Rain', desc: 'Attracts metal debris upward then drops it', duration: 24, damage: 18, range: 150, color: '#CCCCCC', type: 'launch' },
      down: { name: 'Polarity Slam', desc: 'Magnetic force slams enemy into ground', duration: 26, damage: 20, range: 140, color: '#888888', type: 'groundSlam' },
    },
    superMove: { name: 'Planetary Polarity', desc: 'Metal objects begin flying through the air. Weapons, debris, and giant steel beams are ripped toward Magneto before he launches everything outward in one enormous magnetic explosion', duration: 55, damage: 40, color: '#AAAAAA' },
  },
  {
    id: 'willow', name: 'Willow', title: 'The Corrupted Forest', color: '#448833', secondaryColor: '#66AA55',
    weapon: 'Thorned Vines', power: 'Forest', encounterOrder: 3,
    stats: { power: 6, speed: 5, defense: 7, utility: 9, control: 8 },
    lore: 'Controls deadly vines and corrupted plant life. Entangles, constricts, and consumes opponents with thorn-covered growths.',
    heavyAttack: { name: 'Thorn Prison', desc: 'Huge vines erupt beneath opponents, wrapping around them before exploding into thorn-covered branches', damage: 21, range: 150, duration: 28, color: '#448833', type: 'cage', knockback: 1.3 },
    signatures: {
      side: { name: 'Vine Whip', desc: 'Lashes out with thorny vines', duration: 20, damage: 17, range: 190, color: '#448833', type: 'vineWhip' },
      up:   { name: 'Vine Launch', desc: 'Vines erupt from ground launching enemy up', duration: 22, damage: 15, range: 130, color: '#66AA55', type: 'launch' },
      down: { name: 'Root Bind', desc: 'Roots erupt and bind enemy to ground', duration: 28, damage: 18, range: 150, color: '#336622', type: 'rootBind' },
    },
    superMove: { name: 'Forest of Despair', desc: 'The entire stage becomes overgrown. Giant corrupted trees burst from the ground while vines attack from every direction before a massive flower blooms and explodes', duration: 55, damage: 38, color: '#448833' },
  },
  {
    id: 'cable', name: 'Cable', title: 'The Living Circuit', color: '#4488CC', secondaryColor: '#66AAEE',
    weapon: 'Shock Whips', power: 'Electricity', encounterOrder: 4,
    stats: { power: 7, speed: 9, defense: 4, utility: 7, control: 8 },
    lore: 'A living electrical circuit. Conducts and channels electricity through his shock whips, chaining lightning between enemies.',
    heavyAttack: { name: 'Overload Lash', desc: 'Cracks both electrified whips together, sending a chain of lightning bouncing between nearby enemies', damage: 22, range: 200, duration: 24, color: '#4488CC', type: 'lightningBolt', knockback: 1.4 },
    signatures: {
      side: { name: 'Laser Blast', desc: 'Fires a focused laser beam', duration: 18, damage: 19, range: 210, color: '#4488CC', type: 'laserBlast' },
      up:   { name: 'Drone Strike', desc: 'Deploys a drone that attacks from above', duration: 24, damage: 17, range: 160, color: '#66AAEE', type: 'launch' },
      down: { name: 'EMP Pulse', desc: 'Releases EMP that disrupts and damages', duration: 26, damage: 20, range: 150, color: '#2266AA', type: 'groundSlam' },
    },
    superMove: { name: 'Grid Collapse', desc: 'Power lines appear across the battlefield as electricity races through them. Massive bolts strike repeatedly before Cable channels every surge into one gigantic electrical beam', duration: 55, damage: 44, color: '#4488CC' },
  },
  {
    id: 'snodvor', name: 'Snodvor', title: 'The Avalanche', color: '#AADDFF', secondaryColor: '#CCEEFF',
    weapon: 'Great Hammer', power: 'Freeze', encounterOrder: 5,
    stats: { power: 9, speed: 3, defense: 10, utility: 5, control: 8 },
    lore: 'Controls snow and ice. Creates avalanches, blizzards, and buries enemies under packed snow with his enormous hammer.',
    heavyAttack: { name: 'Avalanche Crash', desc: 'Slams his hammer into the ground, creating a wave of packed snow that rolls forward and buries enemies', damage: 23, range: 180, duration: 26, color: '#AADDFF', type: 'groundSlam', knockback: 1.5 },
    signatures: {
      side: { name: 'Stasis Beam', desc: 'Beam that freezes enemy in place mid-air', duration: 24, damage: 14, range: 180, color: '#AADDFF', type: 'stasisBeam' },
      up:   { name: 'Suspend', desc: 'Locks enemy in stasis above the ground', duration: 26, damage: 12, range: 140, color: '#CCEEFF', type: 'launch' },
      down: { name: 'Lock Field', desc: 'Creates a zone where everything stops moving', duration: 30, damage: 16, range: 160, color: '#88BBDD', type: 'freeze' },
    },
    superMove: { name: 'Endless Winter', desc: 'The sky turns white as a blizzard covers the arena. Snowstorms reduce visibility while giant snow boulders tumble across the stage before one enormous avalanche crashes through everything', duration: 60, damage: 42, color: '#AADDFF' },
  },
  {
    id: 'kirsten', name: 'Kirsten', title: 'The Inferno Queen', color: '#FF4400', secondaryColor: '#FF6622',
    weapon: 'Flame Whip', power: 'Ignite', encounterOrder: 6,
    stats: { power: 9, speed: 8, defense: 5, utility: 5, control: 8 },
    lore: 'Commands elegant, precise flames rather than Red\'s explosive fire. Shapes fire into ribbons, walls, spears, and burning constructs. Flames spread quickly and become more dangerous over time.',
    heavyAttack: { name: 'Inferno Spiral', desc: 'Spins her flaming whip around herself, creating a towering spiral of fire that pulls enemies inward before launching them away in a fiery explosion', damage: 24, range: 170, duration: 26, color: '#FF4400', type: 'wave', knockback: 1.4 },
    signatures: {
      side: { name: 'Fire Stream', desc: 'Streams fire in a continuous blast', duration: 20, damage: 21, range: 190, color: '#FF4400', type: 'flameJet' },
      up:   { name: 'Flame Tower', desc: 'Erupts a tall flame tower', duration: 18, damage: 19, range: 130, color: '#FF6622', type: 'firePillar' },
      down: { name: 'Burn Zone', desc: 'Sets the ground on fire in a wide area', duration: 26, damage: 22, range: 170, color: '#CC2200', type: 'infernoRing' },
    },
    superMove: { name: 'Phoenix Ascension', desc: 'The arena darkens as Kirsten ignites in brilliant orange and crimson flames. A gigantic phoenix made entirely of fire erupts from behind her, circles the stage, and divebombs the battlefield. The impact creates a massive ring of fire while burning feathers rain from the sky', duration: 55, damage: 46, color: '#FF4400' },
  },
  {
    id: 'volt', name: 'Volt', title: 'The Soundwave', color: '#CCAA00', secondaryColor: '#DDCC22',
    weapon: 'Sound Cannons', power: 'Electric', encounterOrder: 7,
    stats: { power: 7, speed: 9, defense: 4, utility: 7, control: 8 },
    lore: 'Uses devastating soundwaves. Can shatter and disorient with concussive sonic force.',
    heavyAttack: { name: 'Bass Drop', desc: 'Deep bass frequency shakes the ground, creating a shockwave that launches nearby enemies upward', damage: 21, range: 170, duration: 24, color: '#CCAA00', type: 'groundSlam', knockback: 1.4 },
    signatures: {
      side: { name: 'Sonic Blast', desc: 'Fires a devastating sound wave', duration: 20, damage: 18, range: 200, color: '#CCAA00', type: 'sonicBlast' },
      up:   { name: 'Scream Rise', desc: 'Screams upward with concussive force', duration: 18, damage: 16, range: 130, color: '#DDCC22', type: 'launch' },
      down: { name: 'Dissonance', desc: 'Creates a dissonant field that disrupts movement', duration: 26, damage: 18, range: 160, color: '#AA8800', type: 'freeze' },
    },
    superMove: { name: 'Resonance Cascade', desc: 'Multi-frequency assault that shatters everything — cascading sound waves grow in intensity until the final resonance shatters the entire battlefield', duration: 50, damage: 42, color: '#CCAA00' },
  },
  {
    id: 'temple', name: 'Temple', title: 'The Forgotten King', color: '#AA6633', secondaryColor: '#CC8855',
    weapon: 'Greatsword', power: 'Dismantle', encounterOrder: 8,
    stats: { power: 9, speed: 4, defense: 9, utility: 5, control: 8 },
    lore: 'An ancient king who can dismantle anything he touches. Breaks down structures, defenses, and even the ground itself into flying fragments.',
    heavyAttack: { name: 'Ruin Cleave', desc: 'Swings his greatsword downward. Any solid object struck breaks apart into flying stone fragments', damage: 24, range: 170, duration: 24, color: '#AA6633', type: 'crimsonBlade', knockback: 1.5 },
    signatures: {
      side: { name: 'Dismantle Touch', desc: 'Touches and breaks apart enemy defense', duration: 24, damage: 22, range: 140, color: '#AA6633', type: 'crimsonBlade' },
      up:   { name: 'Shatter Rise', desc: 'Dismantles ground beneath to launch debris upward', duration: 22, damage: 18, range: 120, color: '#CC8855', type: 'launch' },
      down: { name: 'Collapse', desc: 'Dismantles the floor causing enemies to fall', duration: 28, damage: 24, range: 160, color: '#884422', type: 'groundSlam' },
    },
    superMove: { name: 'Ancient Collapse', desc: 'Ancient ruins appear around the battlefield. Massive stone pillars rise before Temple slices them apart, causing enormous chunks of debris to rain across the stage', duration: 55, damage: 46, color: '#AA6633' },
  },
  {
    id: 'nightmare', name: 'Nightmare', title: 'The Dream Eater', color: '#442266', secondaryColor: '#663388', whiteEyes: true,
    weapon: 'Twin Scythes', power: 'Nightmare', encounterOrder: 9,
    stats: { power: 8, speed: 8, defense: 3, utility: 7, control: 9 },
    lore: 'Traps victims in their worst nightmares. Psychological warfare specialist who feeds on fear and manipulate dreams.',
    heavyAttack: { name: 'Fear Strike', desc: 'Disappears into a cloud of dark mist before reappearing behind the opponent with both scythes', damage: 23, range: 180, duration: 22, color: '#442266', type: 'teleSlash', knockback: 1.4 },
    signatures: {
      side: { name: 'Terror Wave', desc: 'Sends a wave of nightmare energy', duration: 22, damage: 19, range: 180, color: '#442266', type: 'terrorWave' },
      up:   { name: 'Fear Rise', desc: 'Nightmare tendrils lift enemy into terror', duration: 20, damage: 17, range: 130, color: '#663388', type: 'launch' },
      down: { name: 'Night Trap', desc: 'Creates nightmare zone on ground', duration: 28, damage: 21, range: 150, color: '#331155', type: 'freeze' },
    },
    superMove: { name: 'Endless Nightmare', desc: 'The screen darkens completely. Giant shadow creatures surround opponents while illusions attack from every direction. Nightmare appears above everyone and slashes downward, breaking the illusion', duration: 55, damage: 44, color: '#442266' },
  },
  {
    id: 'hazel', name: 'Hazel', title: 'The Witch of Thorns', color: '#2D5A1B', secondaryColor: '#4A9A2A',
    weapon: 'Enchanted Staff', power: 'Poison', encounterOrder: 10, isBossPair: true, pairWith: 'whami',
    stats: { power: 6, speed: 6, defense: 7, utility: 9, control: 7 },
    lore: 'A nature witch who commands thorns, roots, and cursed plant life. Can grow, heal, and summon ancient forest entities.',
    heavyAttack: { name: 'Briar Cage', desc: 'Summons twisting thorn vines that trap enemies before exploding outward', damage: 22, range: 150, duration: 28, color: '#2D5A1B', type: 'cage', knockback: 1.3 },
    signatures: {
      side: { name: 'Web Shot', desc: 'Shoots sticky web that binds and damages', duration: 20, damage: 16, range: 200, color: '#3A7A22', type: 'vineWhip' },
      up:   { name: 'Spider Leap', desc: 'Leaps upward with spider agility', duration: 16, damage: 18, range: 140, color: '#4A9A2A', type: 'launch' },
      down: { name: 'Venom Strike', desc: 'Invisible strike from below with venom', duration: 24, damage: 22, range: 130, color: '#1A3A0E', type: 'rootBind' },
    },
    superMove: { name: 'Wrath of the Ancient Forest', desc: 'The battlefield transforms into a cursed forest. Massive roots burst upward while enchanted flowers fire magical spores. Hazel ends by summoning a colossal ancient tree that slams its branches across the stage', duration: 50, damage: 42, color: '#2D5A1B' },
  },
  {
    id: 'whami', name: 'Whami', title: 'The Potion Master', color: '#F5DEB3', secondaryColor: '#EEDD99',
    weapon: 'Potion Flask', power: 'Alchemy', encounterOrder: 10, isBossPair: true, pairWith: 'hazel',
    stats: { power: 5, speed: 5, defense: 5, utility: 10, control: 10 },
    lore: 'The smartest thing alive. Can make a potion to do anything — acid, growth, poison, healing, explosive, and more.',
    heavyAttack: { name: 'Acid Toss', desc: 'Throws a corrosive potion that explodes into a pool of acid, damaging enemies over time', damage: 19, range: 180, duration: 24, color: '#EEDD99', type: 'adhesiveShot', knockback: 1.2 },
    signatures: {
      side: { name: 'Acid Toss', desc: 'Throws a corrosive potion', duration: 22, damage: 17, range: 180, color: '#EEDD99', type: 'adhesiveShot' },
      up:   { name: 'Growth Elixir', desc: 'Drinks potion that causes explosive growth upward', duration: 20, damage: 15, range: 130, color: '#FFFFAA', type: 'launch' },
      down: { name: 'Poison Pool', desc: 'Spills a poison pool on the ground', duration: 28, damage: 18, range: 160, color: '#CCBB88', type: 'rootBind' },
    },
    superMove: { name: 'Ultimate Elixir', desc: 'Drinks ultimate potion granting all powers briefly — a chaotic barrage of acid, fire, ice, poison, and explosive effects', duration: 55, damage: 40, color: '#F5DEB3' },
  },
  {
    id: 'controller', name: 'The Controller', title: 'The Puppet Master', color: '#0A0A2A', secondaryColor: '#2222AA', whiteEyes: true,
    weapon: 'Staff', power: 'Control', encounterOrder: 11,
    stats: { power: 7, speed: 6, defense: 6, utility: 7, control: 9 },
    lore: 'Master manipulator. Controlled Pink and orchestrated the Elementor uprisings. Controls both matter and mind.',
    heavyAttack: { name: 'Control Field', desc: 'Plants his staff into the ground, creating a blue energy field. Enemies inside move slower while objects float around them', damage: 24, range: 180, duration: 28, color: '#1A1A6A', type: 'freeze', knockback: 1.4 },
    signatures: {
      side: { name: 'Mind Blast', desc: 'Psychic blast that controls and damages', duration: 20, damage: 24, range: 190, color: '#1A1A6A', type: 'mindBlast' },
      up:   { name: 'Puppet Strings', desc: 'Lifts enemy with invisible strings', duration: 22, damage: 20, range: 140, color: '#2222AA', type: 'launch' },
      down: { name: 'Dominate', desc: 'Forces enemy to attack themselves', duration: 28, damage: 26, range: 150, color: '#050520', type: 'freeze' },
    },
    superMove: { name: 'Total Domination', desc: 'Reality darkens as blue strings connect to every opponent. For several seconds the Controller controls gravity, throws debris telekinetically, and manipulates enemies before finishing with an enormous psychic explosion', duration: 60, damage: 52, color: '#0A0A2A' },
  },
  {
    id: 'evil', name: 'Evil', title: 'The Opposition', color: '#7700AA', secondaryColor: '#AA00CC', whiteEyes: true,
    weapon: 'Spirit Orbs', power: 'Erasure', encounterOrder: 12, isFinalBoss: true, isSpirit: true,
    stats: { power: 8, speed: 8, defense: 7, utility: 6, control: 6 },
    lore: 'The original force of Opposition. Not cruelty, not malice — the pressure against existence itself. The final boss.',
    heavyAttack: { name: 'Void Crush', desc: 'Creates a sphere of pink and purple energy that slowly expands before collapsing inward violently', damage: 28, range: 200, duration: 26, color: '#AA00CC', type: 'freeze', knockback: 1.6 },
    signatures: {
      side: { name: 'Void Blast', desc: 'Blast of pure nothingness that erases', duration: 20, damage: 28, range: 220, color: '#AA00CC', type: 'voidBlast' },
      up:   { name: 'Erasure', desc: 'Erases space upward, pulling everything into void', duration: 22, damage: 25, range: 160, color: '#CC44EE', type: 'launch' },
      down: { name: 'Annihilate', desc: 'Dark energy consumes the ground itself', duration: 26, damage: 30, range: 180, color: '#550088', type: 'groundSlam' },
    },
    superMove: { name: 'End of Existence', desc: 'The arena begins breaking apart. Platforms disappear, gravity changes constantly, reality tears open, and enormous spirit orbs rain from the sky. Evil gathers every remaining orb into one gigantic blast that covers nearly the entire stage before reality restores itself', duration: 70, damage: 60, color: '#7700AA' },
  },
];

export const getVillainById = (id) => VILLAINS.find(v => v.id === id);
export const getVillainByOrder = (order) => VILLAINS.filter(v => v.encounterOrder === order);