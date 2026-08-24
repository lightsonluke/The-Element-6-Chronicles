// Guardians — primordial cosmic entities. Not heroes, not villains — their own category.
// Life, Death, and Mercy are the fragmented remnants of the original cosmic forces.

export const GUARDIANS = [
  {
    id: 'life', name: 'Life', title: 'The First Light', color: '#44FF44', secondaryColor: '#88FF88',
    weapon: 'Spirit Orbs', power: 'Second Chance', isGuardian: true, isSpirit: true,
    stats: { power: 4, speed: 8, defense: 8, utility: 10, control: 5 },
    lore: 'The primordial force of Expansion, Growth, and Possibility. One of the original Four. Fragmented into Element 6 alongside Mercy, Death, and Evil.',
    heavyAttack: { name: 'Bloom Burst', desc: 'Launches a green orb that explodes into flowers and roots. The blast damages enemies while the roots ensnare them', damage: 22, range: 190, duration: 24, color: '#44FF44', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Root Lance', desc: 'Roots surge forward as a piercing lance', duration: 22, damage: 20, range: 180, color: '#44FF44', type: 'vineWhip' },
      up: { name: 'Bloom Rise', desc: 'A giant flower blooms beneath, launching enemies skyward', duration: 20, damage: 18, range: 130, color: '#88FF88', type: 'launch' },
      down: { name: 'Root Bind', desc: 'Roots erupt and bind enemy to ground', duration: 28, damage: 16, range: 150, color: '#228822', type: 'rootBind' },
    },
    superMove: { name: 'Genesis', desc: 'A massive tree grows from beneath the battlefield. Branches spread everywhere as glowing life energy erupts outward before the tree dissolves into thousands of green particles', duration: 60, damage: 46, color: '#44FF44' },
  },
  {
    id: 'death', name: 'Death', title: 'The Final Silence', color: '#AAAAAA', secondaryColor: '#CCCCCC', whiteEyes: true,
    weapon: 'Spirit Orbs', power: 'Gambit', isGuardian: true, isSpirit: true,
    stats: { power: 9, speed: 5, defense: 7, utility: 6, control: 8 },
    lore: 'The primordial force of Closure, Endings, and Necessary Silence. One of the original Four. Not evil — simply the natural conclusion to all things.',
    heavyAttack: { name: 'Soul Collapse', desc: 'Fires a grey spirit orb that briefly creates a collapsing vortex before disappearing, pulling enemies inward', damage: 24, range: 200, duration: 24, color: '#AAAAAA', type: 'deathWave', knockback: 1.4 },
    signatures: {
      side: { name: 'Silence Wave', desc: 'A wave of absolute silence that erases sound and energy', duration: 22, damage: 22, range: 190, color: '#AAAAAA', type: 'deathWave' },
      up: { name: 'Spectral Rise', desc: 'Grey spirits rise upward, carrying enemies with them', duration: 20, damage: 19, range: 140, color: '#CCCCCC', type: 'launch' },
      down: { name: 'Final Rest', desc: 'Creates a zone of ending where everything stops', duration: 28, damage: 20, range: 160, color: '#888888', type: 'freeze' },
    },
    superMove: { name: 'Last Breath', desc: 'Everything becomes silent. Grey spirits surround the battlefield while Death summons a giant spectral orb overhead that crashes into the arena before fading into dust', duration: 60, damage: 50, color: '#AAAAAA' },
  },
  {
    id: 'mercy', name: 'Mercy', title: 'The Gentle Balance', color: '#FF99DD', secondaryColor: '#FFBBEE',
    weapon: 'Spirit Orbs', power: 'Healing', isGuardian: true, isSpirit: true,
    stats: { power: 3, speed: 7, defense: 9, utility: 10, control: 6 },
    lore: 'The primordial force of Restraint, Compassion, and Forgiveness. One of the original Four. Maintains equilibrium between all forces.',
    heavyAttack: { name: 'Guardian Pulse', desc: 'Releases a pink shockwave that pushes enemies back while briefly protecting nearby allies', damage: 20, range: 180, duration: 24, color: '#FF99DD', type: 'wave', knockback: 1.3 },
    signatures: {
      side: { name: 'Balance Beam', desc: 'Fires a beam of balanced energy that stabilizes and damages', duration: 22, damage: 18, range: 190, color: '#FF99DD', type: 'energyBeam' },
      up: { name: 'Mercy Rise', desc: 'A pillar of gentle light lifts enemies upward', duration: 20, damage: 16, range: 130, color: '#FFBBEE', type: 'launch' },
      down: { name: 'Equilibrium Field', desc: 'Creates a field that balances all forces, trapping enemies', duration: 28, damage: 18, range: 160, color: '#DD77BB', type: 'freeze' },
    },
    superMove: { name: 'Equilibrium', desc: 'Pink light fills the battlefield. Massive spirit rings surround the arena as Mercy creates protective barriers before releasing one enormous wave of balanced energy that launches enemies away', duration: 55, damage: 44, color: '#FF99DD' },
  },
];

export const getGuardianById = (id) => GUARDIANS.find(g => g.id === id);