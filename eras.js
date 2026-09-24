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
    heavyAttack: { name: "Thunder Bolt", desc: "a bigger lighting bolt(IN THE SHAPE OF A LIGHTING BOLT and bigger than the sig sig bolt) is shot foward very short. make sure the hitbox is ONLY around the lighting bolt. does damage based on direction of heavy and point of contact..", damage: 32, range: 138, duration: 13, color: "#FFD700", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "radial" },
    signatures: { side: { name: "Lightning Step", desc: "a lighting bolt(IN THE SHAPE OF A LIGHTING BOLT) is shot foward very short. make sure the hitbox is ONLY around the lighting bolt. does damage based on direction of sig and point of contact..", damage: 17.6, range: 138, duration: 10, color: "#FFD700", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "radial" }, up: { name: "Storm Rise", desc: "A Lighting Circle circles above his head. the hitbox should ONLY be a dot around where the CURRENT position of the beginign of that circular line is moving soo as it quickly moves in that circle, the hitbox is only where the beginign of it is so the hitbox follows it. does knockback upward but can rarely be diagonal based on the placement of the hitbox of the attack to the hurtbox of the player.", damage: 17.6, range: 88, duration: 10, color: "#FFD700", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "up" }, down: { name: "Static Field", desc: "2 energized ball of lightning spawn in both of his hands and he shakes his hands and then a lighting dome arises but the circle is really small and isn’t even as tall as him. does knockback in all directions based on point of contact between hitbox and hurtbox.", damage: 17.6, range: 118, duration: 10, color: "#FFD700", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Thunderstorm", desc: "a giant lightning bolt crashes down on the x coordinate of the character. but instead of this bolt to do downward knockback it does knockback outward pushing you up and out, MAKE SURE the hitbox of this attack is only THE BOTTOM PART of the falling lighting bolt.", damage: 51.2, range: 112, duration: 26, color: "#FFD700", type: "bottom", knockback: 1.4, hitboxProfile: "bottom", knockbackProfile: "radial" },
  },
  {
    id: 'g1_fire', name: 'Fire Hero', title: 'The First Flame', era: 'g1', role: 'Hero',
    color: '#FF4400', secondaryColor: '#FF8800', splitColor: true,
    appearance: { head: '#FF4400', torso: '#FF8800', armL: '#FF4400', armR: '#FF8800', legL: '#FF8800', legR: '#FF4400' },
    powerTitle: 'Flame', powerDescription: 'Cracks a line of flowing fire forward in the facing direction, damaging and stunning the opponent briefly.',
    weapon: 'Flame Fists', stats: { speed: 7, power: 8, defense: 6, utility: 6, control: 8 },
    lore: 'One of the five original heroes. An aggressive fighter who overwhelmed enemies with relentless flame.',
    heavyAttack: { name: "Eruption", desc: "The Fire Hero pulls his arm backward and creates a large flaming gauntlet around his fist. He then swings the fist forward in a huge hook. The entire gauntlet follows the punch, with the strongest hit being around the knuckles. The knockback follows the punch's direction and changes depending on whether the opponent is hit near the beginning or end of the swing.", damage: 28, range: 92, duration: 13, color: "#FF4400", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Flame Charge", desc: "The Fire Hero twists his torso and performs a short flaming elbow strike in the direction he is facing. The flame wraps around his elbow rather than extending outward as a projectile. The hitbox is only around the elbow/flame during the strike. Knockback follows the direction of the elbow.", damage: 15.4, range: 118, duration: 10, color: "#FF4400", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" }, up: { name: "Fire Fountain", desc: "The Fire Hero swings one arm upward and creates a small flaming hook that curls around his fist and snaps upward. The hitbox is only around the hook as it completes the upward swing. It catches opponents above him and sends them upward at a slight angle based on which side of the hook connects.", damage: 15.4, range: 92, duration: 10, color: "#FF4400", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Magma Pool", desc: "The Fire Hero briefly pulls his foot backward and stamps a small glowing ember into the ground. The ember immediately bursts into a tiny four-point flame directly underneath him. The hitbox is only around the four flames as they pop out. Knockback sends the opponent slightly away from the point of the burst.", damage: 15.4, range: 126, duration: 10, color: "#FF4400", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Inferno", desc: "The Fire Hero raises both fists and forms a giant ball of fire directly between his hands. He compresses it until it becomes extremely bright, then punches both hands forward and releases it. The fireball immediately detonates a short distance in front of him, creating a concentrated circular explosion. The hitbox is only around the actual explosion, not the fireball's visual trail. The center sends opponents directly away from the Fire Hero, while the outer edge sends them diagonally upward and outward.", damage: 44.8, range: 118, duration: 26, color: "#FF4400", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g1_water', name: 'Water Hero', title: 'The First Tide', era: 'g1', role: 'Hero',
    color: '#00CCFF', secondaryColor: '#0044AA', splitColor: true,
    appearance: { head: '#00CCFF', torso: '#0044AA', armL: '#00CCFF', armR: '#0044AA', legL: '#0044AA', legR: '#00CCFF' },
    powerTitle: 'Tide', powerDescription: 'Encases the opponent in a slow-drifting water bubble they cannot escape, leaving them vulnerable to follow-up attacks.',
    weapon: 'Water Whip', stats: { speed: 6, power: 7, defense: 7, utility: 8, control: 7 },
    lore: 'One of the five original heroes. A master of water who controlled battlefields through adaptability.',
    heavyAttack: { name: "Tidal Crush", desc: "The Water Hero forms a giant crescent-shaped blade of water around both arms and swings it forward. The crescent travels a short distance after the swing and rotates once before disappearing. Its hitbox is only the curved blade. The center of the blade produces strong horizontal knockback, while the tips produce diagonal knockback.", damage: 26, range: 88, duration: 13, color: "#00CCFF", type: "moving", knockback: 1.1, hitboxProfile: "moving", knockbackProfile: "forward" },
    signatures: { side: { name: "Water Whip", desc: "The Water Hero swings his arm forward and creates a short water whip that curves upward at the end. The hitbox is only around the whip's tip. The tip snaps toward the direction he is facing and knocks the opponent diagonally forward.", damage: 14.3, range: 92, duration: 10, color: "#00CCFF", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, up: { name: "Geyser", desc: "The Water Hero quickly creates a small spinning water ring around one arm and swings it upward. The ring briefly separates from his arm and travels in a short curved path above him before disappearing. The hitbox follows the ring itself. Knockback follows the ring's current movement direction.", damage: 14.3, range: 88, duration: 10, color: "#00CCFF", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "velocity" }, down: { name: "Whirlpool", desc: "The Water Hero bends down and slaps the ground with one hand, causing a small puddle to splash upward on both sides of him. The two splashes are separate hitboxes. Getting hit on the left launches toward the left; getting hit on the right launches toward the right.", damage: 14.3, range: 150, duration: 10, color: "#00CCFF", type: "multi", knockback: 0.8, hitboxProfile: "multi", knockbackProfile: "up" } },
    superMove: { name: "Ocean\\", desc: "The Water Hero pulls both hands toward his chest and creates a large rotating sphere of water around himself. The sphere rapidly spins for one rotation and then suddenly collapses inward toward the Water Hero before exploding outward. The hitbox is only the outward-moving water ring created by the collapse. It sends opponents away from the Water Hero, with the launch becoming more upward the farther toward the top of the ring they are hit.", damage: 41.6, range: 118, duration: 26, color: "#00CCFF", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g1_grass', name: 'Grass Hero', title: 'The First Growth', era: 'g1', role: 'Hero',
    color: '#88DD44', secondaryColor: '#226622', splitColor: true,
    appearance: { head: '#88DD44', torso: '#226622', armL: '#88DD44', armR: '#226622', legL: '#226622', legR: '#88DD44' },
    powerTitle: 'Growth', powerDescription: 'Ensnars the opponent in thorned vines, rooting them in place and preventing all movement for the duration.',
    weapon: 'Vine Staff', stats: { speed: 5, power: 6, defense: 8, utility: 9, control: 7 },
    lore: 'One of the five original heroes. A guardian of nature who shaped battlefields with plant life.',
    heavyAttack: { name: "Root Prison", desc: "The Grass Hero creates a massive wooden branch shaped like a spear from his arm. He throws it forward. The branch rotates through the air and then suddenly splits into three smaller branches that spread apart. The original branch and the three split branches each have their own hitboxes. The farther the attack spreads, the more separated the possible hit locations become.", damage: 24, range: 150, duration: 13, color: "#88DD44", type: "multi", knockback: 1.1, hitboxProfile: "multi", knockbackProfile: "forward" },
    signatures: { side: { name: "Vine Lash", desc: "The Grass Hero swings his arm and creates a flat wooden branch extending from his forearm. He uses it like a short staff and performs a forward jab. The hitbox is only around the branch's end. It knocks opponents directly forward.", damage: 13.2, range: 92, duration: 10, color: "#88DD44", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Tree Rise", desc: "The Grass Hero throws a tiny seed directly above himself. Instead of growing into a plant, the seed immediately sprouts three small leaves that spin around it like a propeller. The leaves are the hitbox. They disappear after completing one rotation and send opponents upward.", damage: 13.2, range: 150, duration: 10, color: "#88DD44", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Forest Wall", desc: "The Grass Hero quickly places both hands on the ground and creates two small thorny vines that emerge beside his feet. The vines snap inward toward him. Their hitboxes are only around the snapping tips. Opponents are knocked slightly toward the Grass Hero, allowing the move to set up another attack.", damage: 13.2, range: 92, duration: 10, color: "#88DD44", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "radial" } },
    superMove: { name: "Genesis Bloom", desc: "The Grass Hero plants both hands on the ground and causes a giant flower to grow directly behind him. The flower opens and its enormous petals surround the Grass Hero in a circular formation. The petals then snap inward toward the center, creating one massive concentrated hit around the character. The hitbox is only around the petals during the inward snap. The impact launches opponents directly away from the Grass Hero, with the angle determined by which petal hits them.", damage: 38.4, range: 118, duration: 26, color: "#88DD44", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g1_ice', name: 'Ice Hero', title: 'The First Frost', era: 'g1', role: 'Hero',
    color: '#AAEEFF', secondaryColor: '#4488CC', splitColor: true,
    appearance: { head: '#AAEEFF', torso: '#4488CC', armL: '#AAEEFF', armR: '#4488CC', legL: '#4488CC', legR: '#AAEEFF' },
    powerTitle: 'Frost', powerDescription: 'Freezes the opponent solid in a block of ice, fully immobile for the duration.',
    weapon: 'Ice Spear', stats: { speed: 6, power: 7, defense: 8, utility: 6, control: 8 },
    lore: 'One of the five original heroes. A master of ice who froze battlefields and trapped enemies.',
    heavyAttack: { name: "Glacier Spike", desc: "The Ice Hero forms a giant ice hammer around his entire arm and swings it in a complete horizontal arc. The hammer physically follows the swing. At the end, it shatters and produces several tiny ice fragments that fly a short distance in the same direction as the final swing.", damage: 26, range: 92, duration: 13, color: "#AAEEFF", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Ice Shard", desc: "The Ice Hero creates a short ice blade around his forearm and performs a horizontal spinning slash. The blade follows his arm and disappears at the end of the rotation. The hitbox is only the blade. The knockback follows the slash.", damage: 14.3, range: 92, duration: 10, color: "#AAEEFF", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Frost Pillar", desc: "The Ice Hero creates a small ice shard above his head, grabs it, and immediately throws it upward. The shard rotates like a throwing knife. The hitbox is only around the shard. It launches opponents upward and slightly to whichever side the shard is traveling.", damage: 14.3, range: 150, duration: 10, color: "#AAEEFF", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Freeze Field", desc: "The Ice Hero stomps and creates a small circular ice plate beneath his feet. He immediately kicks the plate, causing it to flip upward in front of him and shatter. The individual large pieces of the shattered plate are the hitboxes. They launch opponents outward from the point where the plate breaks.", damage: 14.3, range: 126, duration: 10, color: "#AAEEFF", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Absolute Zero", desc: "The Ice Hero raises one hand and creates a massive jagged ice crystal directly beside him. He then punches the crystal, causing it to explode outward from the point of impact. The actual hitboxes are the large shards created by the explosion, not the entire crystal. Shards near the top launch opponents upward and outward, while shards on either side launch them horizontally outward. The crystal is deliberately close to the Ice Hero, keeping the Super concentrated around him like Thunder's lightning strike. GENERATION II", damage: 41.6, range: 118, duration: 26, color: "#AAEEFF", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
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
    heavyAttack: { name: "Iron Slam", desc: "Renji transforms both arms into a massive two-handed metal hammer and swings it forward. The hammer physically extends farther than his normal body before smashing downward at the end of the swing.", damage: 24, range: 92, duration: 13, color: "#888888", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "down" },
    signatures: { side: { name: "Blade Arm", desc: "His forearm reshapes into a short metal blade, and he performs a quick horizontal backhand slash. The blade actually changes shape during the swing rather than being a separate projectile. The hitbox follows the blade's edge.", damage: 13.2, range: 118, duration: 10, color: "#888888", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "forward" }, up: { name: "Iron Pillar", desc: "Renji instantly forms a narrow metal spike from the top of his forearm and thrusts it upward. The spike retracts immediately after the strike. The hitbox is only around the actual spike and follows his arm as it extends.", damage: 13.2, range: 92, duration: 10, color: "#888888", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Armor Fortress", desc: "Renji hardens both knees into small metal plates and drops into a compact crouching slam, causing a short metal ridge to protrude from the ground directly beneath him. The ridge catches opponents underneath and pops them slightly upward.", damage: 13.2, range: 92, duration: 10, color: "#888888", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" } },
    superMove: { name: "Iron Colossus", desc: "Renji completely encases one arm in an enormous amount of layered metal, forming a gigantic armored fist. He pulls the arm backward, then delivers one enormous straight punch. The metal fist is the only major hitbox. The attack is concentrated around the punch and sends opponents violently away from the point of impact.", damage: 38.4, range: 92, duration: 26, color: "#888888", type: "point", knockback: 1.4, hitboxProfile: "point", knockbackProfile: "radial" },
  },
  {
    id: 'g2_kaito', name: 'Kaito Ren', title: 'The Ember Blade', era: 'g2', role: 'Hero',
    color: '#FF3322', secondaryColor: '#FF6622',
    powerTitle: 'Ember', powerDescription: 'Creates and manipulates fire through an aggressive fighting style. High offensive instinct with a focus on direct flame attacks.',
    weapon: 'Ember Katana', stats: { speed: 9, power: 8, defense: 6, utility: 6, control: 6 },
    lore: 'A fiery warrior known for his aggressive flame style. He burned through enemy lines with relentless intensity.',
    heavyAttack: { name: "Flame Slash", desc: "He pulls both fists behind himself and charges forward with a two-fisted flaming body blow. The flame forms a large wedge around his upper body during the strike.", damage: 28, range: 118, duration: 13, color: "#FF3322", type: "radial", knockback: 1.1, hitboxProfile: "radial", knockbackProfile: "forward" },
    signatures: { side: { name: "Ember Dash", desc: "Kaito performs a flaming knee strike in the direction he faces. The flame wraps tightly around his knee instead of becoming a projectile.", damage: 15.4, range: 92, duration: 10, color: "#FF3322", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Rising Flame", desc: "Kaito drives his fist upward while a small flame wraps around his forearm, turning the uppercut into a short flaming rising strike.", damage: 15.4, range: 92, duration: 10, color: "#FF3322", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Fire Trap", desc: "He quickly drops into a low stance and stomps a tiny ember into the ground, causing it to burst upward directly beneath him.", damage: 15.4, range: 126, duration: 10, color: "#FF3322", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" } },
    superMove: { name: "Phoenix Inferno", desc: "Kaito pulls both fists together and creates an enormous compressed flame around his entire upper body. He then drives forward with one devastating punch, releasing the stored fire at the instant his fist connects. The hitbox is concentrated around the fist and the compact explosion immediately around it.", damage: 44.8, range: 118, duration: 26, color: "#FF3322", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "forward" },
  },
  {
    id: 'g2_hana', name: 'Hana Mizushima', title: 'The Calm Tide', era: 'g2', role: 'Hero',
    color: '#3399FF', secondaryColor: '#66BBFF',
    powerTitle: 'Tide', powerDescription: 'Precise water manipulation focused on disaster prevention, civilian protection, and controlled battlefield intervention.',
    weapon: 'Water Fan', stats: { speed: 6, power: 6, defense: 7, utility: 8, control: 8 },
    lore: 'A calm and precise water user who protected civilians during the warring states period. She controlled battlefields without unnecessary destruction.',
    heavyAttack: { name: "Water Barrier", desc: "She forms a large compressed water shield in front of herself and pushes it forward like a moving wall. The shield travels a short distance before breaking apart.", damage: 24, range: 88, duration: 13, color: "#3399FF", type: "moving", knockback: 1.1, hitboxProfile: "moving", knockbackProfile: "forward" },
    signatures: { side: { name: "Pressure Jet", desc: "Hana creates a thin water ribbon around her wrist and snaps it horizontally. The ribbon curves around the end of the strike.", damage: 13.2, range: 155, duration: 10, color: "#3399FF", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "forward" }, up: { name: "Water Shield", desc: "Hana raises one hand and creates a small vertical water cushion beneath herself, which suddenly pushes her upward. The water only exists directly underneath her.", damage: 13.2, range: 126, duration: 10, color: "#3399FF", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" }, down: { name: "Flood Zone", desc: "She places her palm downward and creates a small rotating water shield around her feet. It catches an opponent nearby and gently throws them away from her.", damage: 13.2, range: 92, duration: 10, color: "#3399FF", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "down" } },
    superMove: { name: "Great Flood", desc: "Hana gathers water into a huge rotating sphere directly beside herself. Instead of throwing it, she compresses it until it becomes extremely dense, then releases the pressure. The sphere bursts outward in one concentrated circular water blast around her.", damage: 38.4, range: 118, duration: 26, color: "#3399FF", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g2_daigo', name: 'Daigo Ishikawa', title: 'The Stone Wall', era: 'g2', role: 'Hero',
    color: '#8B7355', secondaryColor: '#A0826D',
    powerTitle: 'Stone', powerDescription: 'Creates and manipulates stone for defensive structures, barriers, sustained defense, and powerful physical attacks.',
    weapon: 'Stone Hammer', stats: { speed: 4, power: 7, defense: 9, utility: 8, control: 7 },
    lore: 'An immovable defender who could raise stone walls and fortifications in seconds. He protected entire villages single-handedly.',
    heavyAttack: { name: "Stone Crusher", desc: "He tears a huge slab of stone out of the ground and swings it like a massive rectangular club.", damage: 26, range: 126, duration: 13, color: "#8B7355", type: "ground", knockback: 1.1, hitboxProfile: "ground", knockbackProfile: "forward" },
    signatures: { side: { name: "Boulder Roll", desc: "He rapidly forms a stone forearm guard and thrusts it forward like a shield bash.", damage: 14.3, range: 92, duration: 10, color: "#8B7355", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Stone Pillar", desc: "A small stone platform instantly forms underneath Daigo and tilts upward, launching him while its raised edge catches opponents above him.", damage: 14.3, range: 92, duration: 10, color: "#8B7355", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Earthquake", desc: "Daigo punches the ground and creates a small stone wedge between his feet that rises just enough to catch someone standing close.", damage: 14.3, range: 92, duration: 10, color: "#8B7355", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" } },
    superMove: { name: "Mountain Fortress", desc: "Daigo pulls an enormous section of stone from the ground beside himself and forms it into a giant stone fist. The fist performs one concentrated upward-to-forward punch before breaking apart.", damage: 41.6, range: 92, duration: 26, color: "#8B7355", type: "point", knockback: 1.4, hitboxProfile: "point", knockbackProfile: "up" },
  },
  {
    id: 'g2_suzu', name: 'Suzu Kaze', title: 'The Swift Gale', era: 'g2', role: 'Hero',
    color: '#99DDAA', secondaryColor: '#FFFFFF',
    powerTitle: 'Gale', powerDescription: 'Controls wind for extreme mobility, scouting, flanking, aerial movement, and fast attacks.',
    weapon: 'Wind Fans', stats: { speed: 10, power: 6, defense: 5, utility: 8, control: 6 },
    lore: 'The fastest warrior of her era. She moved like the wind, striking before enemies could react and vanishing before they could retaliate.',
    heavyAttack: { name: "Cyclone", desc: "She dashes forward and suddenly changes direction midair, creating two intersecting gust trails. The collision point between the two gusts is the primary hitbox.", damage: 24, range: 155, duration: 13, color: "#99DDAA", type: "line", knockback: 1.1, hitboxProfile: "line", knockbackProfile: "forward" },
    signatures: { side: { name: "Gale Dash", desc: "Suzu leans forward and performs a wind-assisted flying kick. A narrow gust forms behind her foot.", damage: 13.2, range: 138, duration: 10, color: "#99DDAA", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Updraft", desc: "Suzu creates a tiny burst of wind beneath one foot and launches herself upward diagonally. Her extended leg is the hitbox during the movement.", damage: 13.2, range: 118, duration: 10, color: "#99DDAA", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Whirlwind", desc: "She quickly spins downward and creates a small circular air pocket beneath herself, kicking anyone underneath outward.", damage: 13.2, range: 126, duration: 10, color: "#99DDAA", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Tempest", desc: "Suzu surrounds herself with a tightly rotating sphere of compressed wind. She launches herself through the sphere in a single circular motion and exits the opposite side, causing the entire compressed wind shell to collapse outward around her.", damage: 38.4, range: 118, duration: 26, color: "#99DDAA", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g2_mai', name: 'Mai Yoru', title: 'The Twilight Shadow', era: 'g2', role: 'Hero',
    color: '#663399', secondaryColor: '#1a1a2a',
    powerTitle: 'Dusk', powerDescription: 'Manipulates darkness and shadow, allowing stealth, shadow attacks, defensive evasion, and movement through dark areas.',
    weapon: 'Shadow Daggers', stats: { speed: 7, power: 8, defense: 5, utility: 6, control: 9 },
    lore: 'A shadow manipulator who could walk through darkness itself. She was a spy and assassin who struck from the shadows.',
    heavyAttack: { name: "Shadow Slash", desc: "She creates a massive shadow blade directly from her own silhouette and performs a sweeping slash that leaves her shadow briefly detached from her body.", damage: 28, range: 92, duration: 13, color: "#663399", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Shadow Step", desc: "Mai steps into her own shadow and slides a short distance along the ground, emerging with a small shadow kick.", damage: 15.4, range: 88, duration: 10, color: "#663399", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "forward" }, up: { name: "Dark Spiral", desc: "Mai briefly dissolves into shadow and reappears just above herself, with a small shadow burst at the reappearance point.", damage: 15.4, range: 150, duration: 10, color: "#663399", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Shadow Bind", desc: "Her shadow spreads underneath her and forms a small black hand that reaches upward before disappearing.", damage: 15.4, range: 118, duration: 10, color: "#663399", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" } },
    superMove: { name: "Eternal Night", desc: "Mai disappears completely into darkness. A huge shadow version of her emerges directly behind her and performs a single crossing slash alongside her. The two attacks meet at the center around Mai, creating the concentrated Super hitbox.", damage: 44.8, range: 92, duration: 26, color: "#663399", type: "point", knockback: 1.4, hitboxProfile: "point", knockbackProfile: "radial" },
  },
  {
    id: 'g2_osamu', name: 'Osamu Tsuchida', title: 'The Echo', era: 'g2', role: 'Hero',
    color: '#FFCC00', secondaryColor: '#FFDD44',
    powerTitle: 'Echo', powerDescription: 'Uses sound and resonance-like echoes for detection, tactical awareness, disruption, and battlefield support.',
    weapon: 'Resonance Bells', stats: { speed: 5, power: 6, defense: 7, utility: 9, control: 8 },
    lore: 'A sound user who could detect enemies through walls and disrupt their abilities with resonance. A master tactician.',
    heavyAttack: { name: "Sonic Boom", desc: "He draws his hands apart and creates a huge visible waveform between them before thrusting his hands together. The collision produces a concentrated sonic impact in front of him.", damage: 24, range: 155, duration: 13, color: "#FFCC00", type: "line", knockback: 1.1, hitboxProfile: "line", knockbackProfile: "forward" },
    signatures: { side: { name: "Echo Pulse", desc: "Osamu claps toward the opponent, creating a compact concussive pulse shaped like a flattened circle.", damage: 13.2, range: 118, duration: 10, color: "#FFCC00", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "forward" }, up: { name: "Resonance Rise", desc: "Osamu snaps his fingers above himself and creates a small expanding sound ring that rises with the vibration.", damage: 13.2, range: 118, duration: 10, color: "#FFCC00", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Disruption Field", desc: "He stomps once, sending a short vibration through the ground. The vibration erupts beneath anyone standing very close to him.", damage: 13.2, range: 126, duration: 10, color: "#FFCC00", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Cacophony", desc: "Osamu creates an enormous perfectly circular resonance field around himself. Every sound inside the field suddenly becomes silent. He then snaps his fingers. The stored resonance releases in one concentrated 360-degree sonic shockwave around him.", damage: 38.4, range: 118, duration: 26, color: "#FFCC00", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g2_yui', name: 'Yui Hoshikawa', title: 'The Starlight Healer', era: 'g2', role: 'Hero',
    color: '#FFFFFF', secondaryColor: '#CCCCCC',
    powerTitle: 'Starlight', powerDescription: 'Uses restorative starlight-based energy for healing, protection, stabilization, and support.',
    weapon: 'Star Scepter', stats: { speed: 4, power: 5, defense: 6, utility: 10, control: 10 },
    lore: 'A gentle healer whose starlight could mend wounds and protect allies. She was the moral heart of her team.',
    heavyAttack: { name: "Starlight Burst", desc: "Yui forms a large starlight shield and swings it forward like a physical barrier.", damage: 22, range: 92, duration: 13, color: "#FFFFFF", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Star Beam", desc: "Yui extends one hand and creates a small streak of starlight that travels a short distance before gently bursting.", damage: 12.1, range: 88, duration: 10, color: "#FFFFFF", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "forward" }, up: { name: "Rising Star", desc: "Yui creates a small star of restorative light above herself. It briefly expands into a four-pointed shape and pushes opponents upward.", damage: 12.1, range: 150, duration: 10, color: "#FFFFFF", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Protective Light", desc: "A tiny star appears beneath her and creates a short protective pulse around her feet, pushing nearby opponents away.", damage: 12.1, range: 118, duration: 10, color: "#FFFFFF", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Celestial Blessing", desc: "Yui creates a massive star-shaped core directly behind herself. She draws both hands inward, causing the star to contract, then releases it. A concentrated sphere of restorative light bursts outward around her, becoming a powerful repelling blast against enemies.", damage: 35.2, range: 118, duration: 26, color: "#FFFFFF", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  // ── G2 Villains/Antiheroes ──
  {
    id: 'g2_ibuki', name: 'Hollow Monk — Ibuki', title: 'The Hollow One', era: 'g2', role: 'Antivillain',
    color: '#DDDDDD', secondaryColor: '#660000',
    powerTitle: 'Life Drain', powerDescription: 'Drains life-energy from dying people and redirects it toward others. His philosophy is that mercy always has a cost.',
    weapon: 'Hollow Staff', stats: { speed: 6, power: 7, defense: 5, utility: 8, control: 9 },
    lore: 'A monk who twisted restorative Element 6 into something dangerous. He drains life from the dying and redirects it — mercy with a cost.',
    heavyAttack: { name: "Life Drain", desc: "Ibuki forms a long energy tether and swings it horizontally. The tether bends toward nearby targets rather than moving perfectly straight.", damage: 26, range: 155, duration: 13, color: "#DDDDDD", type: "line", knockback: 1.1, hitboxProfile: "line", knockbackProfile: "forward" },
    signatures: { side: { name: "Hollow Hand", desc: "Ibuki extends his palm and creates a thin life-energy tether that briefly connects to the opponent before snapping.", damage: 14.3, range: 155, duration: 10, color: "#DDDDDD", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "forward" }, up: { name: "Inverted Restoration", desc: "Ibuki reaches upward and creates a small life-energy orb above his palm. He pulls it toward himself, creating a short upward energy burst.", damage: 14.3, range: 150, duration: 10, color: "#DDDDDD", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Hollow Field", desc: "He places his palm near the ground and releases a small draining pulse that weakens the immediate area before returning the energy to him.", damage: 14.3, range: 118, duration: 10, color: "#DDDDDD", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Mercy\\", desc: "Ibuki gathers a massive amount of life-energy around himself into a bright, dense sphere. He compresses the sphere into his hands and then releases it in a powerful circular pulse. The attack doesn't create death or summon corpses; it represents the violent transfer and redirection of stored life-energy.", damage: 41.6, range: 118, duration: 26, color: "#DDDDDD", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g2_nishikawa', name: 'Nishikawa the Puppeteer', title: 'The Thread Master', era: 'g2', role: 'Villain',
    color: '#1a1a1a', secondaryColor: '#880000', whiteEyes: true,
    powerTitle: 'Living Thread', powerDescription: 'Creates living Element 6 threads capable of binding people and controlling their movements and behavior.',
    weapon: 'Thread Gauntlets', stats: { speed: 7, power: 7, defense: 5, utility: 8, control: 8 },
    lore: 'A villain who controlled people like puppets with living threads. He could bind and manipulate opponents against their will.',
    heavyAttack: { name: "Thread Bind", desc: "He launches a massive bundle of living threads forward that wraps around itself as it travels, creating a rotating thread drill.", damage: 26, range: 88, duration: 13, color: "#1a1a1a", type: "moving", knockback: 1.1, hitboxProfile: "moving", knockbackProfile: "forward" },
    signatures: { side: { name: "Thread Whip", desc: "Nishikawa flicks his wrist and sends a single living thread forward. The thread bends toward the opponent before snapping back.", damage: 14.3, range: 155, duration: 10, color: "#1a1a1a", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "forward" }, up: { name: "Marionette", desc: "A thin living thread shoots upward and briefly forms a small puppet hand above Nishikawa that pulls downward.", damage: 14.3, range: 150, duration: 10, color: "#1a1a1a", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Thread Prison", desc: "Several tiny threads emerge around his feet and tug his body downward, creating a low sweeping attack.", damage: 14.3, range: 155, duration: 10, color: "#1a1a1a", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "down" } },
    superMove: { name: "Grand Marionette", desc: "Nishikawa creates an enormous puppet-string circle around himself. The strings suddenly attach to every opponent within the immediate area. He pulls all of them toward a central point before violently snapping the strings outward, launching everyone away.", damage: 41.6, range: 118, duration: 26, color: "#1a1a1a", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g2_itto', name: 'Ittō', title: 'The Unnatural Blade', era: 'g2', role: 'Antagonist',
    color: '#555555', secondaryColor: '#660000',
    powerTitle: 'Unnatural Blade', powerDescription: 'Uses an unnatural Element 6-infused blade capable of cutting through defenses and enhanced targets. Extremely close-range and weapon-focused.',
    weapon: 'Element 6 Blade', stats: { speed: 8, power: 8, defense: 6, utility: 4, control: 9 },
    lore: 'A swordsman with an unnatural blade that could cut through any defense. He walked the line between antagonist and antihero.',
    heavyAttack: { name: "Severing Slash", desc: "He performs a huge horizontal draw-cut that creates a thin, extremely precise energy blade extending from the sword.", damage: 28, range: 92, duration: 13, color: "#555555", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Blade Rush", desc: "Ittō performs a precise forward single slash, with the Element 6 edge extending only a tiny distance beyond the sword.", damage: 15.4, range: 92, duration: 10, color: "#555555", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Rising Cut", desc: "Ittō performs a short upward draw-cut. The blade briefly glows with Element 6 energy at the tip.", damage: 15.4, range: 92, duration: 10, color: "#555555", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Shearing Strike", desc: "He lowers the blade and performs a short reverse slash along the ground.", damage: 15.4, range: 92, duration: 10, color: "#555555", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "radial" } },
    superMove: { name: "Severance", desc: "Ittō completely stills himself and raises the blade. He then performs one single enormous slash through the space immediately in front of him. The visual is simple: the blade itself creates a massive Element 6 cutting arc. The hitbox is ONLY the cutting edge.", damage: 44.8, range: 92, duration: 26, color: "#555555", type: "point", knockback: 1.4, hitboxProfile: "point", knockbackProfile: "radial" },
  },
  {
    id: 'g2_twinfoxes', name: 'The Twin Foxes', title: 'The Foxfire Duo', era: 'g2', role: 'Antivillain',
    color: '#FF8822', secondaryColor: '#FFFFFF',
    powerTitle: 'Foxfire', powerDescription: 'A coordinated pair capable of deceptive movement, foxfire attacks, misdirection, and teamwork-based combat.',
    weapon: 'Foxfire Orbs', stats: { speed: 8, power: 7, defense: 5, utility: 8, control: 7 },
    lore: 'A duo of foxfire users who fought as one. Their coordination and illusion made them nearly impossible to predict.',
    heavyAttack: { name: "Twin Strike", desc: "One Fox charges forward while the other creates a large foxfire duplicate that charges from the opposite direction. The two attacks meet around the center.", damage: 26, range: 138, duration: 13, color: "#FF8822", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Foxfire Dash", desc: "The Foxes briefly cross paths, each carrying a small foxfire flame. The crossing point becomes the hitbox.", damage: 14.3, range: 138, duration: 10, color: "#FF8822", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Illusion Rise", desc: "One Fox leaps upward while the other throws a small foxfire flame underneath them, creating a coordinated launch.", damage: 14.3, range: 126, duration: 10, color: "#FF8822", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" }, down: { name: "Foxfire Trap", desc: "One Fox crouches while the other circles around them in a small arc, leaving a tiny foxfire trail.", damage: 14.3, range: 118, duration: 10, color: "#FF8822", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Foxfire Illusion", desc: "The Foxes create two enormous foxfire spirits behind themselves. The spirits mimic their movements for one attack, creating a coordinated crossing strike that converges directly around the Foxes.", damage: 41.6, range: 118, duration: 26, color: "#FF8822", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g2_utsuro', name: 'Utsuro', title: 'The Hollow Sovereign', era: 'g2', role: 'Major Villain',
    color: '#1a1a1a', secondaryColor: '#660066', whiteEyes: true,
    powerTitle: 'Elementor Call', powerDescription: 'Calls forth 3–7 hollowed entities from stolen Element 6 fragments — the random-colored hollows charge forward, and opponents touched lose their power for 30 seconds and suffer knockback but no damage.',
    weapon: 'Stolen Fragments', stats: { speed: 7, power: 9, defense: 8, utility: 7, control: 4 },
    lore: 'A being of stolen Element 6 — countless fragments taken from others. He is a hollow sovereign, powerful beyond measure but empty within.',
    heavyAttack: { name: "Fragment Burst", desc: "He summons one large hollowed creature that charges forward on all fours, disappearing after completing its attack.", damage: 30, range: 118, duration: 13, color: "#1a1a1a", type: "radial", knockback: 1.1, hitboxProfile: "radial", knockbackProfile: "forward" },
    signatures: { side: { name: "Hollow Drain", desc: "Utsuro summons a small hollow entity beside him that lunges forward before dissolving.", damage: 16.5, range: 138, duration: 10, color: "#1a1a1a", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Fragment Rise", desc: "Utsuro summons a tiny hollow entity above himself. It reaches downward with a spectral hand before disappearing.", damage: 16.5, range: 118, duration: 10, color: "#1a1a1a", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "down" }, down: { name: "Hollow Field", desc: "A hollow creature emerges briefly from the ground beneath Utsuro and snaps upward.", damage: 16.5, range: 126, duration: 10, color: "#1a1a1a", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" } },
    superMove: { name: "Hollow Catastrophe", desc: "Utsuro summons a massive hollowed entity directly behind himself. Instead of simply attacking, the entity opens its chest and releases a concentrated Element 6-stripping pulse. The pulse is confined to the area immediately around Utsuro. An opponent hit by it suffers the attack's major knockback, while the visual implication is that the entity is attempting to strip away the opponent's Element 6 power.", damage: 48, range: 118, duration: 26, color: "#1a1a1a", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
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
    heavyAttack: { name: "Sand Crusher", desc: "He forms a massive slab of densely packed sand beside himself and swings it forward like a giant stone paddle. The slab crumbles immediately after the hit.", damage: 26, range: 138, duration: 13, color: "#D2B48C", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Sand Lash", desc: "Takeshi swings his arm horizontally, creating a thin whip of sand that follows the motion of his arm. The whip bends slightly toward the direction of the swing, with the hitbox following the actual sand strand.", damage: 14.3, range: 155, duration: 10, color: "#D2B48C", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "forward" }, up: { name: "Sand Spear", desc: "Takeshi thrusts one hand upward and a narrow column of compacted sand shoots from the ground directly above him. The column forms into a pointed spear only at its tip. The hitbox is restricted to the spearhead as it rises, launching struck opponents upward.", damage: 14.3, range: 92, duration: 10, color: "#D2B48C", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Sand Sink", desc: "Takeshi sweeps his hand downward and the ground immediately beneath him becomes loose sand. A small circular patch collapses inward, pulling nearby opponents toward its center before bursting them outward.", damage: 14.3, range: 126, duration: 10, color: "#D2B48C", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Sandstorm Core", desc: "Takeshi gathers a dense sphere of violently rotating sand beside himself. The sphere compresses smaller and smaller before suddenly expanding into a concentrated circular sand blast around him, with the strongest hit occurring at the expanding outer edge.", damage: 41.6, range: 118, duration: 26, color: "#D2B48C", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_aiko', name: 'Aiko Hone', title: 'The Bone Maiden', era: 'g3', role: 'Hero',
    color: '#F5F5DC', secondaryColor: '#DEB887',
    powerTitle: 'Bone', powerDescription: 'Creates and manipulates bone structures for attacks, armor, weapons, and defensive constructs.',
    weapon: 'Bone Blade', stats: { speed: 5, power: 8, defense: 7, utility: 7, control: 8 },
    lore: 'A bone manipulator who could grow weapons and armor from her own skeleton. She was feared and respected in equal measure.',
    heavyAttack: { name: "Bone Greatblade", desc: "Aiko forms an enormous bone blade along one arm and performs a full sweeping slash. The blade is thick near her body but narrows toward the tip, creating a crescent-shaped attack.", damage: 28, range: 92, duration: 13, color: "#F5F5DC", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Bone Hook", desc: "A curved bone hook grows from her arm and swings horizontally. The hook's curved tip is the primary hitbox and can catch opponents slightly above or below the center of the swing.", damage: 15.4, range: 92, duration: 10, color: "#F5F5DC", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Bone Fang", desc: "A short bone spike grows from Aiko's forearm as she thrusts upward. The spike extends slightly during the attack, with the hitbox following its pointed end.", damage: 15.4, range: 118, duration: 10, color: "#F5F5DC", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Bone Knuckle", desc: "A thick layer of bone forms over both fists. Aiko drives both hands downward, creating a short bone ridge along the ground that pops opponents upward.", damage: 15.4, range: 92, duration: 10, color: "#F5F5DC", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" } },
    superMove: { name: "Bone Titan", desc: "Aiko rapidly covers her upper body in massive layers of bone armor, forming an oversized skeletal arm. She swings the arm forward in one enormous punch before the constructed bones shatter away.", damage: 44.8, range: 92, duration: 26, color: "#F5F5DC", type: "point", knockback: 1.4, hitboxProfile: "point", knockbackProfile: "forward" },
  },
  {
    id: 'g3_haru', name: 'Haru Garasu', title: 'The Glass artisan', era: 'g3', role: 'Hero',
    color: '#E0FFFF', secondaryColor: '#B0E0E6',
    powerTitle: 'Glass', powerDescription: 'Creates precise glass constructs, barriers, lattices, weapons, and defensive structures.',
    weapon: 'Glass Staff', stats: { speed: 5, power: 6, defense: 8, utility: 8, control: 8 },
    lore: 'A glass user who created beautiful and deadly constructs. Her precision was unmatched — every structure was both art and weapon.',
    heavyAttack: { name: "Glass Guillotine", desc: "A huge vertical pane appears beside Haru and slides horizontally across him like a moving blade. The cutting edge is the active hitbox.", damage: 24, range: 88, duration: 13, color: "#E0FFFF", type: "moving", knockback: 1.1, hitboxProfile: "moving", knockbackProfile: "forward" },
    signatures: { side: { name: "Glass Edge", desc: "A razor-thin glass panel forms along Haru's arm. He makes a short horizontal slicing motion, with the hitbox following the edge rather than the entire panel.", damage: 13.2, range: 92, duration: 10, color: "#E0FFFF", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Glass Needle", desc: "Haru creates a thin transparent glass needle that shoots upward from his hand. The needle briefly catches the light as it moves, and only the needle itself has a hitbox.", damage: 13.2, range: 92, duration: 10, color: "#E0FFFF", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Glass Shard", desc: "Several tiny glass fragments appear beneath him and shoot outward along the ground in a shallow fan.", damage: 13.2, range: 126, duration: 10, color: "#E0FFFF", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Shatterpoint", desc: "Haru creates a dense cluster of glass directly in front of himself. Instead of throwing it, he compresses the entire cluster until it reaches a critical point and then causes every pane to explode outward from one tiny central point, producing a concentrated radial burst.", damage: 38.4, range: 118, duration: 26, color: "#E0FFFF", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_chiyo', name: 'Chiyo Doku', title: 'The Venom Queen', era: 'g3', role: 'Hero',
    color: '#44AA44', secondaryColor: '#226622',
    powerTitle: 'Venom', powerDescription: 'Creates and manipulates venom and poisonous substances for attacks, traps, and battlefield control.',
    weapon: 'Venom Claws', stats: { speed: 7, power: 8, defense: 5, utility: 7, control: 8 },
    lore: 'A venom user who could create deadly poisons from nothing. Her attacks were as lethal as they were varied.',
    heavyAttack: { name: "Venom Fang", desc: "She creates two enormous venom-coated fangs extending from her forearms and lunges forward. The tips are the strongest hitboxes, while the venom coating produces a secondary hit when contact occurs.", damage: 28, range: 92, duration: 13, color: "#44AA44", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Venom Spit", desc: "Chiyo forms venom at her fingertips and flicks it horizontally. The projectile travels a short distance before popping into a small toxic burst.", damage: 15.4, range: 88, duration: 10, color: "#44AA44", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "forward" }, up: { name: "Venom Needle", desc: "Chiyo flicks a tiny globule of venom upward that hardens into a narrow spike while traveling. The spike bursts into a small venom splash when it reaches its maximum height.", damage: 15.4, range: 92, duration: 10, color: "#44AA44", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Venom Drop", desc: "She releases a small puddle directly beneath herself. The puddle briefly bubbles upward, striking opponents standing inside it before disappearing.", damage: 15.4, range: 118, duration: 10, color: "#44AA44", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" } },
    superMove: { name: "Venom Bloom", desc: "Chiyo creates a compact dark sphere of concentrated venom in front of herself. The sphere suddenly splits open like a flower, sending several thick venom-coated tendrils outward in a tight radius before they snap back into the center.", damage: 44.8, range: 118, duration: 26, color: "#44AA44", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_emi', name: 'Emi Chi', title: 'The Blood Seer', era: 'g3', role: 'Hero',
    color: '#DC143C', secondaryColor: '#FFFFFF',
    powerTitle: 'Blood-Sensing', powerDescription: 'Can sense biological conditions through blood-related Element 6 abilities. Specializes in medical support, detection, stabilization, and emergency intervention.',
    weapon: 'Blood Needles', stats: { speed: 5, power: 5, defense: 5, utility: 10, control: 10 },
    lore: 'A medical specialist who could sense life through blood. She saved countless lives during the Fallen Age.',
    heavyAttack: { name: "Pulse Counter", desc: "Emi deliberately waits for an opponent to enter striking distance, senses their movement through their biological rhythm, and swings directly toward their approach. The hitbox is concentrated around her fist.", damage: 22, range: 92, duration: 13, color: "#DC143C", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Rhythm Step", desc: "Emi reads the opponent's heartbeat and movement rhythm, then immediately shifts into a short counter-step and strikes toward the detected position.", damage: 12.1, range: 138, duration: 10, color: "#DC143C", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Pulse Read", desc: "Emi briefly senses the movement of nearby opponents. A small pulse radiates upward from her body and reacts to the nearest moving target, producing a short upward strike.", damage: 12.1, range: 118, duration: 10, color: "#DC143C", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Stabilizing Pulse", desc: "She places one hand near the ground and releases a small biological-energy pulse around her feet. The pulse pushes opponents away without forming a blood projectile.", damage: 12.1, range: 118, duration: 10, color: "#DC143C", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Perfect Read", desc: "Emi enters a brief heightened sensing state. A pulse spreads through the immediate area and identifies every nearby opponent's movement. She then instantly pivots toward the closest detected target and delivers one extremely powerful precision strike at the point where their movement is headed.", damage: 35.2, range: 118, duration: 26, color: "#DC143C", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_nozomi', name: 'Nozomi Toge', title: 'The Thorned Maiden', era: 'g3', role: 'Hero',
    color: '#228822', secondaryColor: '#114411',
    powerTitle: 'Thorned Vines', powerDescription: 'Creates and manipulates thorn-covered vines for attacks, restraints, barriers, traps, and environmental control.',
    weapon: 'Thorn Whip', stats: { speed: 5, power: 6, defense: 7, utility: 8, control: 9 },
    lore: 'A vine manipulator whose thorn-covered vines could trap and tear. She was a master of battlefield control.',
    heavyAttack: { name: "Thorn Ram", desc: "Nozomi forms a thick bundle of vines in front of herself. The vines intertwine into a massive thorn-covered battering ram and thrust forward.", damage: 24, range: 118, duration: 13, color: "#228822", type: "radial", knockback: 1.1, hitboxProfile: "radial", knockbackProfile: "forward" },
    signatures: { side: { name: "Thorn Whip", desc: "Nozomi swings one arm and a single thorned vine follows it like a whip. The vine curves naturally through the air, with its thorn-covered end acting as the primary hitbox.", damage: 13.2, range: 155, duration: 10, color: "#228822", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "forward" }, up: { name: "Thorn Rise", desc: "A vine erupts from beneath Nozomi and curls upward. A thorn-covered section at its tip snaps toward the opponent above her.", damage: 13.2, range: 92, duration: 10, color: "#228822", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Root Trap", desc: "Small vines spread from both of Nozomi's feet and wrap around the ground. If an opponent is nearby, the roots suddenly pull inward and trip them upward.", damage: 13.2, range: 126, duration: 10, color: "#228822", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" } },
    superMove: { name: "Overgrowth", desc: "The ground immediately around Nozomi erupts into a dense mass of gigantic thorned vines. Rather than covering the stage, the growth forms a tight circle around her, all of the vines converging on opponents inside the radius before violently recoiling outward.", damage: 38.4, range: 118, duration: 26, color: "#228822", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_masaru', name: 'Masaru Hai', title: 'The Ash Reckoner', era: 'g3', role: 'Hero',
    color: '#36454F', secondaryColor: '#708090', whiteEyes: true,
    powerTitle: 'Ash', powerDescription: 'Uses ash aggressively for attacks and battlefield disruption. His fighting style feels reckless and emotionally driven.',
    weapon: 'Ash Gauntlets', stats: { speed: 6, power: 8, defense: 5, utility: 7, control: 9 },
    lore: 'An ash user whose reckless style reflected his inner turmoil. He fought with raw emotion, overwhelming enemies with ash storms.',
    heavyAttack: { name: "Ash Ram", desc: "He compresses an enormous amount of ash directly in front of his body until it becomes almost solid. He drives it forward like a giant blunt projectile, which breaks apart upon impact.", damage: 28, range: 138, duration: 13, color: "#36454F", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Ash Shot", desc: "Masaru thrusts one palm forward and fires a tightly compressed stream of ash. The stream spreads slightly before disappearing.", damage: 15.4, range: 118, duration: 10, color: "#36454F", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "forward" }, up: { name: "Ash Burst", desc: "Masaru throws a handful of ash upward. The cloud rapidly compresses into a small projectile that bursts at the top of its movement.", damage: 15.4, range: 150, duration: 10, color: "#36454F", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Ash Scatter", desc: "He strikes the ground and kicks up a compact cloud around his feet. The cloud expands outward in a low ring, pushing opponents away.", damage: 15.4, range: 118, duration: 10, color: "#36454F", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Ash Devastation", desc: "Masaru gathers an enormous ash cloud immediately around himself. For a moment it completely obscures his body, then he compresses the entire cloud into one dense mass before detonating it outward in a powerful close-range blast.", damage: 44.8, range: 118, duration: 26, color: "#36454F", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_ryo', name: 'Ryo Kiri', title: 'The Mist Walker', era: 'g3', role: 'Hero',
    color: '#C0C0C0', secondaryColor: '#A0B0C0',
    powerTitle: 'Mist', powerDescription: 'Manipulates mist for stealth, movement, infiltration, concealment, battlefield confusion, and reconnaissance.',
    weapon: 'Mist Cloak', stats: { speed: 8, power: 4, defense: 4, utility: 9, control: 10 },
    lore: 'A mist manipulator who could vanish into thin air. He was a spy and infiltrator without peer.',
    heavyAttack: { name: "Fog Blade", desc: "Ryo compresses mist around his arm until it forms a long, extremely dense cutting shape. He swings it forward, and the condensed mist disperses immediately after the strike.", damage: 20, range: 138, duration: 13, color: "#C0C0C0", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Mist Drift", desc: "Ryo becomes a thin horizontal stream of mist and slides a short distance before reforming with an extended strike.", damage: 11, range: 88, duration: 10, color: "#C0C0C0", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "forward" }, up: { name: "Mist Step", desc: "Ryo dissolves his upper body into mist and reforms slightly above his original position. The moment he reforms, the condensed mist around his feet bursts outward.", damage: 11, range: 150, duration: 10, color: "#C0C0C0", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "radial" }, down: { name: "Mist Pool", desc: "Mist rapidly collects around Ryo's feet and spreads across the ground in a small circle. The cloud suddenly rises, striking opponents standing within it.", damage: 11, range: 118, duration: 10, color: "#C0C0C0", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" } },
    superMove: { name: "Whiteout", desc: "A dense sphere of mist forms around Ryo, restricting the attack to the immediate area. He disappears inside it, then the entire sphere suddenly collapses inward before exploding outward as Ryo reappears at its center.", damage: 32, range: 118, duration: 26, color: "#C0C0C0", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g3_souta', name: 'Souta', title: 'The Young Ash', era: 'g3', role: 'Hero',
    color: '#404040', secondaryColor: '#606060', whiteEyes: true,
    powerTitle: 'Ash', powerDescription: 'A younger, still-developing ash user whose abilities are less refined but capable of growing into more advanced techniques.',
    weapon: 'Ash Gloves', stats: { speed: 4, power: 6, defense: 6, utility: 9, control: 10 },
    lore: 'A young ash user with raw potential. His abilities were unrefined but growing stronger with each battle.',
    heavyAttack: { name: "Ash Spear", desc: "Souta compresses ash into a long spear and thrusts it forward. The spear begins rough and cloudlike before becoming increasingly solid toward its tip.", damage: 24, range: 92, duration: 13, color: "#404040", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Ash Ribbon", desc: "A narrow ribbon of ash extends from Souta's hand and curves through the air before snapping back toward him.", damage: 13.2, range: 155, duration: 10, color: "#404040", type: "line", knockback: 0.8, hitboxProfile: "line", knockbackProfile: "forward" }, up: { name: "Ash Feather", desc: "Souta creates several tiny ash fragments that rise like feathers. They suddenly converge above him into one compact upward burst.", damage: 13.2, range: 150, duration: 10, color: "#404040", type: "vertical", knockback: 0.8, hitboxProfile: "vertical", knockbackProfile: "up" }, down: { name: "Ash Footprint", desc: "Souta stamps the ground, leaving a small patch of ash. The patch immediately erupts upward when an opponent steps near it.", damage: 13.2, range: 126, duration: 10, color: "#404040", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" } },
    superMove: { name: "Ash Evolution", desc: "Souta pulls ash from the immediate surroundings into one rapidly rotating mass. The mass repeatedly changes shape—sphere, blade, spike, then finally a gigantic compressed ash fist—which he launches forward in one concentrated strike before the construct disintegrates.", damage: 38.4, range: 118, duration: 26, color: "#404040", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "forward" },
  },
  // ── G3 Antagonists ──
  {
    id: 'g3_ogata', name: 'Ogata', title: 'The Extractor', era: 'g3', role: 'Villain',
    color: '#2F4F2F', secondaryColor: '#0a0a0a',
    powerTitle: 'Extraction Tech', powerDescription: 'A disgraced physician who refined the process of artificially forcing Element 6 into people. Uses experimental equipment and artificial power.',
    weapon: 'Extraction Gear', stats: { speed: 4, power: 7, defense: 4, utility: 10, control: 10 },
    lore: 'A disgraced physician who forced Element 6 into people artificially. His methods were unethical and dangerous.',
    heavyAttack: { name: "Harvest Cannon", desc: "Ogata unfolds a large mechanical cannon from his arm and fires a dense artificial-energy projectile. The projectile becomes increasingly unstable as it travels before exploding on contact.", damage: 26, range: 88, duration: 13, color: "#2F4F2F", type: "moving", knockback: 1.1, hitboxProfile: "moving", knockbackProfile: "forward" },
    signatures: { side: { name: "Injection Shot", desc: "A small mechanical injector launches forward on a cable. It strikes at the end of the cable before immediately retracting.", damage: 14.3, range: 138, duration: 10, color: "#2F4F2F", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Extraction Spike", desc: "A small extraction device opens above Ogata and fires a narrow energy spike upward. The spike briefly flickers between several colors before dissipating.", damage: 14.3, range: 92, duration: 10, color: "#2F4F2F", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Forced Pulse", desc: "Ogata activates a device attached to his arm and releases an unstable pulse around his feet. The pulse knocks nearby opponents away while the machine visibly overheats.", damage: 14.3, range: 118, duration: 10, color: "#2F4F2F", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Forced Extraction", desc: "Ogata activates his largest extraction mechanism directly around himself. Multiple mechanical arms lock into position and forcibly compress artificial Element 6 energy into one extremely dense sphere. The machinery releases everything at once in a concentrated blast surrounding Ogata, then visibly shuts down from the strain.", damage: 41.6, range: 150, duration: 26, color: "#2F4F2F", type: "multi", knockback: 1.4, hitboxProfile: "multi", knockbackProfile: "radial" },
  },
  {
    id: 'g3_kanenobu', name: 'Lord Kanenobu', title: 'The Golden Lord', era: 'g3', role: 'Antagonist',
    color: '#B8860B', secondaryColor: '#0a0a0a',
    powerTitle: 'Political Influence', powerDescription: 'No natural Element 6. Uses political influence, hired combat technology, weapons, guards, and tactical tools as his combat kit.',
    weapon: 'Tactical Arsenal', stats: { speed: 5, power: 5, defense: 5, utility: 10, control: 10 },
    lore: 'A lord with no Element 6 who wielded political power and hired muscle. He was a strategic threat, not a personal one.',
    heavyAttack: { name: "Armored Escort", desc: "A heavily armored guard charges past Kanenobu with a large shield, carrying the attack forward. Kanenobu remains behind the guard rather than becoming the projectile himself.", damage: 22, range: 92, duration: 13, color: "#B8860B", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Cane Strike", desc: "Kanenobu swings his weaponized cane horizontally. The tip contains a concealed mechanical reinforcement that extends slightly during the strike.", damage: 12.1, range: 118, duration: 10, color: "#B8860B", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "forward" }, up: { name: "Guard Lift", desc: "Kanenobu signals upward and a guard rapidly steps in beside him, using a shield to strike upward and launch nearby opponents.", damage: 12.1, range: 92, duration: 10, color: "#B8860B", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Command Retreat", desc: "He gives a hand signal and two guards briefly appear on either side of him, crossing their shields downward and forcing opponents away from Kanenobu.", damage: 12.1, range: 92, duration: 10, color: "#B8860B", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "down" } },
    superMove: { name: "Executive Order", desc: "Kanenobu raises his hand and gives one final command. Several armed guards and mechanical units immediately converge into the small area around him, surrounding him with a coordinated formation before simultaneously striking toward the center and then outward. Kanenobu himself delivers the final hit with his reinforced weapon as the formation breaks apart.", damage: 35.2, range: 118, duration: 26, color: "#B8860B", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
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
    heavyAttack: { name: "Barrier Sweep", desc: "A huge curved barrier forms beside Cobalt and swings around him like a physical wall being pushed forward. The leading edge is the primary hitbox.", damage: 24, range: 92, duration: 13, color: "#0047AB", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Barrier Ram", desc: "Cobalt forms a short rectangular barrier directly from his forearm and thrusts it forward. The front edge is the only active hitbox.", damage: 13.2, range: 92, duration: 10, color: "#0047AB", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Barrier Rise", desc: "Cobalt creates a narrow blue barrier directly beneath himself. It rises vertically like an elevator, carrying him upward. At the top, the barrier tilts forward and catches opponents with its upper edge.", damage: 13.2, range: 92, duration: 10, color: "#0047AB", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Barrier Clamp", desc: "Two small barriers appear on either side of Cobalt and angle inward. They rapidly close toward him, striking anything caught between them before shattering.", damage: 13.2, range: 118, duration: 10, color: "#0047AB", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Absolute Barrier", desc: "Cobalt creates several massive barriers around his immediate position, forming a compact enclosed structure. The barriers rapidly contract toward him before simultaneously expanding outward, producing a powerful concentrated burst in every direction.", damage: 38.4, range: 118, duration: 26, color: "#0047AB", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g4_cyan', name: 'Cyan — Reiji Fuma', title: 'The Wind Rider', era: 'g4', role: 'Hero',
    color: '#00B7EB', secondaryColor: '#66DDEE',
    powerTitle: 'Wind', powerDescription: 'Controls wind for mobility, ranged attacks, aerial movement, and battlefield manipulation.',
    weapon: 'Wind Blades', stats: { speed: 8, power: 7, defense: 5, utility: 8, control: 7 },
    lore: 'A Hero Corps wind user who moves like the breeze and strikes like a hurricane.',
    heavyAttack: { name: "Wind Tunnel", desc: "Cyan creates a dense horizontal tunnel of rushing air. He thrusts both hands forward, causing the tunnel to surge ahead and carry opponents along before throwing them out its front.", damage: 26, range: 138, duration: 13, color: "#00B7EB", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Wind Cutter", desc: "Cyan sweeps his hand horizontally and creates a thin curved blade of compressed air. The blade travels only a short distance before dispersing.", damage: 14.3, range: 88, duration: 10, color: "#00B7EB", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "forward" }, up: { name: "Updraft", desc: "Cyan points upward and creates a narrow column of rising air directly beneath his hand. The column launches opponents upward while also lifting Cyan slightly.", damage: 14.3, range: 126, duration: 10, color: "#00B7EB", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" }, down: { name: "Pressure Drop", desc: "Cyan suddenly removes the air pressure immediately beneath him, causing a small vacuum-like dip before air rushes back into the space and bursts outward.", damage: 14.3, range: 126, duration: 10, color: "#00B7EB", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Skybreaker", desc: "Cyan pulls air from the immediate surroundings into a rapidly rotating sphere around himself. He compresses the sphere until it becomes nearly invisible, then releases it as one enormous concentrated pressure burst centered directly on him.", damage: 41.6, range: 118, duration: 26, color: "#00B7EB", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g4_onyx', name: 'Onyx — Ayaka Kurosawa', title: 'The Shadow Agent', era: 'g4', role: 'Hero',
    color: '#0B0B0B', secondaryColor: '#333333', whiteEyes: true,
    powerTitle: 'Shadow', powerDescription: 'Manipulates shadows for stealth, movement, attacks, evasion, and infiltration.',
    weapon: 'Shadow Blades', stats: { speed: 7, power: 6, defense: 5, utility: 9, control: 8 },
    lore: 'A Hero Corps shadow operative who strikes from darkness. She is the Corps\' top infiltrator.',
    heavyAttack: { name: "Shadow Execution", desc: "Onyx's silhouette stretches dramatically to one side and forms a huge blade-like arm. The arm performs one sweeping slash before snapping back into his body.", damage: 24, range: 92, duration: 13, color: "#0B0B0B", type: "point", knockback: 1.1, hitboxProfile: "point", knockbackProfile: "forward" },
    signatures: { side: { name: "Shadow Claw", desc: "Onyx extends his shadow sideways, forming three claw-like projections that swipe forward before retracting.", damage: 13.2, range: 92, duration: 10, color: "#0B0B0B", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Shadow Spike", desc: "Onyx's shadow stretches upward and forms a sharp spike above him. The spike briefly becomes solid before sinking back into his shadow.", damage: 13.2, range: 92, duration: 10, color: "#0B0B0B", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "up" }, down: { name: "Shadow Maw", desc: "His shadow opens into a small dark mouth beneath him. It snaps shut, catching opponents close to the ground and launching them upward.", damage: 13.2, range: 126, duration: 10, color: "#0B0B0B", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" } },
    superMove: { name: "Eclipse Form", desc: "Onyx's entire immediate shadow expands into a giant circular silhouette. A massive shadow version of Onyx rises behind him and mirrors his movement with one enormous concentrated strike, causing the giant silhouette to collapse back into Onyx at impact.", damage: 38.4, range: 150, duration: 26, color: "#0B0B0B", type: "vertical", knockback: 1.4, hitboxProfile: "vertical", knockbackProfile: "up" },
  },
  {
    id: 'g4_gold', name: 'Gold — Sora Kanade', title: 'The Light of Restoration', era: 'g4', role: 'Hero',
    color: '#FFD700', secondaryColor: '#FFEE88',
    powerTitle: 'Restoration', powerDescription: 'Uses restorative light to heal, stabilize, restore, and protect others.',
    weapon: 'Light Staff', stats: { speed: 4, power: 7, defense: 5, utility: 10, control: 9 },
    lore: 'The Hero Corps\' top support operative. Her restorative light can mend any wound and shield any ally.',
    heavyAttack: { name: "Restored Impact", desc: "Gold extends his arm and creates a golden sphere around his fist. The sphere repeatedly flickers between damaged and restored states before he releases the accumulated force through one heavy punch.", damage: 26, range: 118, duration: 13, color: "#FFD700", type: "radial", knockback: 1.1, hitboxProfile: "radial", knockbackProfile: "forward" },
    signatures: { side: { name: "Rebound Light", desc: "Gold touches his forearm and restores a burst of energy through it, then releases that restored force through a short forward strike.", damage: 14.3, range: 138, duration: 10, color: "#FFD700", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Restored Step", desc: "Gold briefly restores the space directly beneath his feet to a previous stable state, producing a sudden upward rebound that launches nearby opponents.", damage: 14.3, range: 126, duration: 10, color: "#FFD700", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" }, down: { name: "Renewal Pulse", desc: "Gold places his hand near the ground and releases a small golden pulse. The pulse expands around his feet and pushes opponents away while restoring Gold's own position.", damage: 14.3, range: 118, duration: 10, color: "#FFD700", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Second State", desc: "Gold surrounds himself with a large golden sphere. The sphere rapidly reconstructs itself whenever it cracks, storing the force of every restoration. Once completely stabilized, Gold releases the accumulated restorative energy in a powerful close-range explosion that launches everyone around him.", damage: 41.6, range: 118, duration: 26, color: "#FFD700", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g4_vermilion', name: 'Vermilion — Haruto Ban', title: 'The Crimson Flame', era: 'g4', role: 'Hero',
    color: '#E34234', secondaryColor: '#FF6655',
    powerTitle: 'Fire', powerDescription: 'Generates and manipulates fire for direct offensive combat.',
    weapon: 'Flame Sword', stats: { speed: 6, power: 9, defense: 6, utility: 7, control: 7 },
    lore: 'The Hero Corps\' primary offensive fighter. His flames burn hotter than any natural fire.',
    heavyAttack: { name: "Flame Breaker", desc: "Vermilion forms a massive burning wedge around his forearm and drives it forward. The flame wedge expands slightly during the strike before collapsing.", damage: 30, range: 118, duration: 13, color: "#E34234", type: "radial", knockback: 1.1, hitboxProfile: "radial", knockbackProfile: "forward" },
    signatures: { side: { name: "Flame Arc", desc: "He sweeps one arm forward and creates a short curved flame blade that follows the motion of his arm.", damage: 16.5, range: 92, duration: 10, color: "#E34234", type: "point", knockback: 0.8, hitboxProfile: "point", knockbackProfile: "forward" }, up: { name: "Flame Crest", desc: "A small flame blade forms above Vermilion's hand. He flicks it upward and the flame briefly becomes a sharp crescent before disappearing.", damage: 16.5, range: 118, duration: 10, color: "#E34234", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Fire Stamp", desc: "Vermilion stamps the ground, creating a compact circular flame underneath himself. The flame rises around his legs and bursts outward.", damage: 16.5, range: 126, duration: 10, color: "#E34234", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "radial" } },
    superMove: { name: "Crimson Detonation", desc: "Vermilion pulls the flames around his body into one intensely compressed core at his chest. He drives both hands forward and releases the entire core in a concentrated explosion immediately in front of him.", damage: 48, range: 118, duration: 26, color: "#E34234", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "forward" },
  },
  {
    id: 'g4_umber', name: 'Umber — Yumi Sato', title: 'The Ground Listener', era: 'g4', role: 'Hero',
    color: '#8B4513', secondaryColor: '#A0522D',
    powerTitle: 'Tremor-Sense', powerDescription: 'Senses vibrations through the ground and combines that awareness with highly trained close-range martial arts.',
    weapon: 'Martial Arts', stats: { speed: 7, power: 7, defense: 7, utility: 7, control: 7 },
    lore: 'A martial artist who can sense every movement through the ground. No enemy can sneak up on her.',
    heavyAttack: { name: "Impact Chain", desc: "Umber performs a powerful martial-arts strike that sends vibration through whatever he hits. The vibration travels through the target and erupts a short distance behind them.", damage: 26, range: 88, duration: 13, color: "#8B4513", type: "moving", knockback: 1.1, hitboxProfile: "moving", knockbackProfile: "forward" },
    signatures: { side: { name: "Vibration Counter", desc: "Umber reads an approaching opponent through the ground and pivots precisely into a short body strike.", damage: 14.3, range: 126, duration: 10, color: "#8B4513", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "forward" }, up: { name: "Ground Read", desc: "Umber touches the ground and instantly detects the movement above him. He follows the detected position with a rising palm strike.", damage: 14.3, range: 126, duration: 10, color: "#8B4513", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" }, down: { name: "Tremor Stomp", desc: "He stomps the ground, creating a tiny vibration pulse around his feet. The pulse detects nearby movement and immediately produces a short upward shock.", damage: 14.3, range: 118, duration: 10, color: "#8B4513", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" } },
    superMove: { name: "Earthsense", desc: "Umber becomes completely still and senses every vibration within his immediate area. The instant an opponent moves, he precisely intercepts their trajectory with one enormous close-range martial-arts strike, releasing all the gathered vibration through the point of impact.", damage: 41.6, range: 118, duration: 26, color: "#8B4513", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g4_graphite', name: 'Graphite — Chika Enomoto', title: 'The Resonance Analyst', era: 'g4', role: 'Hero',
    color: '#383838', secondaryColor: '#585858', whiteEyes: true,
    powerTitle: 'Resonance Analysis', powerDescription: 'Reads and analyzes the resonance of environments, structures, Element 6 signatures, and unusual energy patterns.',
    weapon: 'Resonance Scanner', stats: { speed: 4, power: 6, defense: 6, utility: 10, control: 9 },
    lore: 'A support specialist who reads the battlefield like a book. Her analysis gives her team every advantage.',
    heavyAttack: { name: "Frequency Break", desc: "Graphite generates two opposing resonance frequencies around his hands. He brings them together, creating a concentrated interference point that explodes forward.", damage: 24, range: 118, duration: 13, color: "#383838", type: "radial", knockback: 1.1, hitboxProfile: "radial", knockbackProfile: "forward" },
    signatures: { side: { name: "Harmonic Ping", desc: "Graphite emits a narrow resonance pulse toward one side. It strikes at the end of its short range and briefly creates visible rings around the contact point.", damage: 13.2, range: 118, duration: 10, color: "#383838", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "forward" }, up: { name: "Frequency Mark", desc: "Graphite scans upward with a device-like pulse. A small resonance marker appears above him before emitting a short upward shock.", damage: 13.2, range: 118, duration: 10, color: "#383838", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Structural Scan", desc: "He touches the ground and sends a tiny resonance pulse through it. The pulse returns from nearby surfaces and creates a compact upward burst at the detected point.", damage: 13.2, range: 118, duration: 10, color: "#383838", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" } },
    superMove: { name: "Perfect Resonance", desc: "Graphite scans the immediate area and locks onto the resonance signature of everything nearby. He synchronizes his energy with the environment, then releases one precisely tuned resonance pulse that causes a massive concentrated shock at every detected contact point around him.", damage: 38.4, range: 118, duration: 26, color: "#383838", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  {
    id: 'g4_daichi', name: 'Daichi Ishii', title: 'The Resonance Engineer', era: 'g4', role: 'Hero',
    color: '#71797E', secondaryColor: '#919A9F',
    powerTitle: 'Resonance Technology', powerDescription: 'Does not naturally manifest Element 6. A resonance-tech engineer who creates equipment capable of interacting with Element 6 signatures. His Power stat represents technology, not natural Element 6.',
    weapon: 'Resonance Tech Gear', stats: { speed: 3, power: 7, defense: 6, utility: 10, control: 9 },
    lore: 'An engineer with no Element 6 who builds technology that can interact with it. His gear is his power.',
    heavyAttack: { name: "Resonance Cannon", desc: "Daichi unfolds a larger cannon from his equipment and charges it by analyzing the surrounding Element 6 frequencies. The cannon fires a thick concentrated beam that destabilizes when it reaches its maximum range.", damage: 26, range: 138, duration: 13, color: "#71797E", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Signal Bolt", desc: "Daichi fires a narrow technological resonance bolt from a wrist device. The projectile travels a short distance and destabilizes whatever it contacts.", damage: 14.3, range: 88, duration: 10, color: "#71797E", type: "moving", knockback: 0.8, hitboxProfile: "moving", knockbackProfile: "forward" }, up: { name: "Resonance Drone", desc: "Daichi releases a small hovering device above himself. The drone fires a short vertical resonance pulse before returning to his shoulder.", damage: 14.3, range: 118, duration: 10, color: "#71797E", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" }, down: { name: "Ground Node", desc: "Daichi throws a small mechanical node onto the ground. It immediately anchors itself and sends a short pulse through the floor, creating a compact upward blast.", damage: 14.3, range: 118, duration: 10, color: "#71797E", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "up" } },
    superMove: { name: "Signature Collapse", desc: "Daichi deploys his full resonance apparatus around himself. Several devices scan the immediate area, identify nearby Element 6 signatures, and synchronize into one frequency. The entire system then releases a concentrated disruption burst centered on Daichi, knocking nearby opponents outward.", damage: 41.6, range: 118, duration: 26, color: "#71797E", type: "radial", knockback: 1.4, hitboxProfile: "radial", knockbackProfile: "radial" },
  },
  // ── G4 Villains ──
  {
    id: 'g4_renko', name: 'Renko Kurenai', title: 'The Crimson Ring Leader', era: 'g4', role: 'Villain',
    color: '#8B0000', secondaryColor: '#0a0a0a',
    powerTitle: 'Extraction Technology', powerDescription: 'Leader of the Kurenai Ring/Harvest Guild, pursuing artificial Element 6 extraction and refinement.',
    weapon: 'Extraction Apparatus', stats: { speed: 6, power: 8, defense: 6, utility: 8, control: 7 },
    lore: 'The leader of the Harvest Guild who extracts Element 6 artificially. She is a dangerous and ambitious criminal.',
    heavyAttack: { name: "Harvest Cannon", desc: "A large industrial cannon unfolds beside Renko and draws energy through several rotating chambers. The final chamber opens and releases a huge compressed beam forward.", damage: 28, range: 138, duration: 13, color: "#8B0000", type: "forward", knockback: 1.1, hitboxProfile: "forward", knockbackProfile: "forward" },
    signatures: { side: { name: "Refinement Shot", desc: "Renko fires a compact refined-energy projectile from a wrist-mounted device. Unlike Ogata's unstable attacks, it remains perfectly shaped until impact.", damage: 15.4, range: 138, duration: 10, color: "#8B0000", type: "forward", knockback: 0.8, hitboxProfile: "forward", knockbackProfile: "forward" }, up: { name: "Extraction Rail", desc: "Renko deploys a compact extraction rail beneath herself. It shoots a concentrated stream of refined energy upward while carrying her slightly into the air.", damage: 15.4, range: 126, duration: 10, color: "#8B0000", type: "ground", knockback: 0.8, hitboxProfile: "ground", knockbackProfile: "up" }, down: { name: "Harvest Node", desc: "She places a small extraction node on the ground. It immediately pulls energy toward itself and then releases a short radial burst.", damage: 15.4, range: 118, duration: 10, color: "#8B0000", type: "radial", knockback: 0.8, hitboxProfile: "radial", knockbackProfile: "radial" } },
    superMove: { name: "Kurenai Harvest", desc: "Renko activates her most powerful extraction apparatus directly around herself. Multiple mechanical rings lock into position and begin refining the surrounding Element 6 energy into one incredibly dense core. The core becomes suspended directly in front of Renko. She then commands the machinery to release it. The refined energy detonates in a tight, massive radius around her, creating a violent outward blast before the extraction rings collapse and retract. GENERATION V — HEROES Generation V is where the powers get especially weird, so I'm making sure each character has a distinct combat language, not just a different visual effect on the same attack. I'm also keeping the supers as one concentrated, extremely powerful attack in the immediate area, not stage-wide attacks.", damage: 44.8, range: 150, duration: 26, color: "#8B0000", type: "multi", knockback: 1.4, hitboxProfile: "multi", knockbackProfile: "radial" },
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