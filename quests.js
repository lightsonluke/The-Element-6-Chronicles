// Quest definitions for Story Mode
import { BLOCKS } from './world.js';
// Block names mapped to numeric block IDs for collection triggers
const B = { stone: BLOCKS.STONE, wood: BLOCKS.WOOD, sand: BLOCKS.SAND, glass: BLOCKS.GLASS, element6: BLOCKS.ELEMENT6 };

// Each quest has: id, title, desc, trigger (how it's offered/complete), reward
export const QUESTS = [
  // ── Main story ──
  { id: 'main1', title: 'Find Your Way', desc: 'Explore Split City and find the first villain.', trigger: { type: 'auto' }, done: false },
  { id: 'main2', title: 'First Battle', desc: 'Defeat Corpent, the Hammer Brute.', trigger: { type: 'defeat', villainId: 'corpent' }, done: false },

  // ── Save Pink ──
  { id: 'save_pink', title: 'Save Pink', desc: "Pink has been captured by Corpent's forces. Defeat Corpent to free her.", trigger: { type: 'defeat', villainId: 'corpent' }, reward: { unlockHero: 'pink' }, done: false },

  // ── Random NPC Retrieval ──
  { id: 'npc_retrieve_1', title: 'Lost Supplies', desc: 'An NPC lost their supplies near Split City. Mine 10 Stone and return.', trigger: { type: 'collect', block: B.stone, count: 10 }, done: false },
  { id: 'npc_retrieve_2', title: 'Wood for Shelter', desc: 'Gather 15 Wood for a villager building a shelter.', trigger: { type: 'collect', block: B.wood, count: 15 }, done: false },

  // ── Space Quest (after Controller) ──
  { id: 'space_quest', title: 'Beyond the Sky', desc: "The Controller's defeat has opened a rift. Travel beyond — defeat Evil to restore balance to the cosmos.", trigger: { type: 'defeat', villainId: 'controller' }, done: false },
  { id: 'rift_guardians', title: 'The Rift: Guardian Trial', desc: 'The rift leads to the cosmic guardians. Face Life, Death, and Mercy in a 3v1 battle.', trigger: { type: 'defeat', villainId: 'controller' }, done: false },
  { id: 'rift_final', title: 'The Rift: Final Confrontation', desc: 'Evil and the Controller have joined forces. Face them both in a 4v2 ultimate showdown.', trigger: { type: 'defeat', villainId: 'evil' }, done: false },

  // ── Emerald's Legacy ──
  { id: 'emerald_legacy', title: "Emerald's Legacy", desc: 'Honor the fallen Phantom. Defeat 3 villains while playing as Emerald.', trigger: { type: 'defeatAs', heroId: 'emerald', count: 3 }, done: false },

  // ── Amber's Clones ──
  { id: 'amber_clones', title: "Amber's Clones", desc: 'Amber seeks to master her cloning. Win a battle using only your power button (no sigs).', trigger: { type: 'special', key: 'amber_power' }, done: false },

  // ── Magenta's Masterpiece ──
  { id: 'magenta_masterpiece', title: "Magenta's Masterpiece", desc: 'Collect 20 Sand for Magenta to create her grand adhesive artwork.', trigger: { type: 'collect', block: B.sand, count: 20 }, done: false },

  // ── Silver's Trials ──
  { id: 'silver_trials', title: "Silver's Trials", desc: 'Prove your endurance. Survive a battle against Whami without losing a stock.', trigger: { type: 'special', key: 'silver_no_stock_loss' }, done: false },

  // ── Maroon's Reactor ──
  { id: 'maroon_reactor', title: "Maroon's Reactor", desc: "Fuel Maroon's reactor: collect 10 Element 6 ore from deep underground.", trigger: { type: 'collect', block: B.element6, count: 10 }, done: false },

  // ── Yellow's Speed Trial ──
  { id: 'yellow_speed', title: "Yellow's Speed Trial", desc: 'Defeat a villain in under 60 seconds as Yellow.', trigger: { type: 'special', key: 'yellow_fast' }, done: false },

  // ── Blue's Ocean Cleanup ──
  { id: 'blue_ocean', title: "Blue's Ocean Cleanup", desc: 'Collect 15 Sand and 5 Glass to help Blue purify the waters.', trigger: { type: 'collectMulti', needs: [{ block: B.sand, count: 15 }, { block: B.glass, count: 5 }] }, done: false },

  // ── Black's Storm Hunt ──
  { id: 'black_storm', title: "Black's Storm Hunt", desc: 'Channel the storm. Defeat Volt in battle as Black.', trigger: { type: 'defeatAs', villainId: 'volt', heroId: 'black' }, done: false },

  // ── Scarlet's Lost Souls ──
  { id: 'scarlet_souls', title: "Scarlet's Lost Souls", desc: 'Defeat Temple and Nightmare to free the souls Scarlet guards.', trigger: { type: 'defeatMulti', villainIds: ['temple', 'nightmare'] }, done: false },

  // ── Life, Death & Mercy ──
  { id: 'life_death_mercy', title: 'Life, Death & Mercy', desc: 'Face the cosmic guardians. Prove yourself worthy by defeating Evil.', trigger: { type: 'defeat', villainId: 'evil' }, done: false },
];

export function getQuest(id) { return QUESTS.find(q => q.id === id); }