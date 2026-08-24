import { BLOCKS } from './world.js';

// Crafting recipes — blocks and decorative items only (no armor/tools)
export const RECIPES = [
  // Basic blocks
  { ingredients: [{ block: BLOCKS.WOOD, count: 4 }], output: { block: BLOCKS.PLANK, count: 8 } },
  { ingredients: [{ block: BLOCKS.SAND, count: 4 }], output: { block: BLOCKS.GLASS, count: 2 } },
  { ingredients: [{ block: BLOCKS.STONE, count: 8 }], output: { block: BLOCKS.BRICK, count: 4 } },
  { ingredients: [{ block: BLOCKS.WOOD, count: 1 }], output: { block: BLOCKS.TORCH, count: 4 } },

  // Ladder — climb up! (uses planks + paper)
  { ingredients: [{ block: BLOCKS.PLANK, count: 3 }, { block: BLOCKS.PAPER, count: 1 }], output: { block: BLOCKS.LADDER, count: 3 } },

  // Stone variants
  { ingredients: [{ block: BLOCKS.STONE, count: 4 }], output: { block: BLOCKS.COBBLESTONE, count: 4 } },
  { ingredients: [{ block: BLOCKS.COBBLESTONE, count: 1, name: 'Cobblestone' }, { block: BLOCKS.LEAVES, count: 1 }], output: { block: BLOCKS.MOSSSTONE, count: 1 } },
  { ingredients: [{ block: BLOCKS.STONE, count: 2 }], output: { block: BLOCKS.SMOOTHSTONE, count: 2 } },
  { ingredients: [{ block: BLOCKS.SMOOTHSTONE, count: 4 }], output: { block: BLOCKS.STONEBRICK, count: 4 } },
  { ingredients: [{ block: BLOCKS.STONEBRICK, count: 3, name: 'Stone Brick' }, { block: BLOCKS.OBSIDIAN, count: 1 }], output: { block: BLOCKS.DARKBRICK, count: 3 } },
  { ingredients: [{ block: BLOCKS.STONEBRICK, count: 3, name: 'Stone Brick' }, { block: BLOCKS.GLOWSTONE, count: 1 }], output: { block: BLOCKS.LIGHTBRICK, count: 3 } },

  // Sand & clay
  { ingredients: [{ block: BLOCKS.SAND, count: 4 }], output: { block: BLOCKS.SANDSTONE, count: 2 } },
  { ingredients: [{ block: BLOCKS.SAND, count: 4, name: 'Sand' }, { block: BLOCKS.DIRT, count: 2 }], output: { block: BLOCKS.CLAY, count: 2 } },
  { ingredients: [{ block: BLOCKS.CLAY, count: 4 }], output: { block: BLOCKS.TERRACOTTA, count: 2 } },

  // Paper & bookshelf
  { ingredients: [{ block: BLOCKS.LEAVES, count: 3 }], output: { block: BLOCKS.PAPER, count: 2 } },
  { ingredients: [{ block: BLOCKS.PLANK, count: 4 }, { block: BLOCKS.PAPER, count: 3 }], output: { block: BLOCKS.BOOKSHELF, count: 1 } },

  // Lighting
  { ingredients: [{ block: BLOCKS.IRON, count: 1 }, { block: BLOCKS.TORCH, count: 1 }], output: { block: BLOCKS.LANTERN, count: 1 } },
  { ingredients: [{ block: BLOCKS.GOLD, count: 1 }, { block: BLOCKS.TORCH, count: 1 }], output: { block: BLOCKS.GLOWSTONE, count: 2 } },

  // Snow & ice
  { ingredients: [{ block: BLOCKS.SAND, count: 4, name: 'Sand' }, { block: BLOCKS.WATER, count: 1 }], output: { block: BLOCKS.SNOWBLOCK, count: 2 } },
  { ingredients: [{ block: BLOCKS.SNOWBLOCK, count: 2 }], output: { block: BLOCKS.ICEBLOCK, count: 1 } },

  // Cactus & pumpkin & hay
  { ingredients: [{ block: BLOCKS.LEAVES, count: 4, name: 'Leaves' }, { block: BLOCKS.SAND, count: 1 }], output: { block: BLOCKS.CACTUS, count: 1 } },
  { ingredients: [{ block: BLOCKS.LEAVES, count: 3 }], output: { block: BLOCKS.PUMPKIN, count: 1 } },
  { ingredients: [{ block: BLOCKS.LEAVES, count: 4 }], output: { block: BLOCKS.HAYBLOCK, count: 2 } },

  // Bed — sets your respawn point, occupies 2 horizontal blocks
  { ingredients: [{ block: BLOCKS.PLANK, count: 4 }, { block: BLOCKS.LEAVES, count: 2 }], output: { block: BLOCKS.BED, count: 1 } },

  // Sapling — grows into a tree after 2 minutes
  { ingredients: [{ block: BLOCKS.LEAVES, count: 1 }], output: { block: BLOCKS.SAPLING, count: 1 } },

  // Apple — eat for +30 HP (right-click while holding)
  { ingredients: [{ block: BLOCKS.LEAVES, count: 1 }], output: { block: BLOCKS.APPLE, count: 1 } },

  // Chest — store items
  { ingredients: [{ block: BLOCKS.PLANK, count: 4 }], output: { block: BLOCKS.CHEST, count: 1 } },

  // Advanced building
  { ingredients: [{ block: BLOCKS.OBSIDIAN, count: 2 }, { block: BLOCKS.BRICK, count: 2 }], output: { block: BLOCKS.NETHERBRICK, count: 2 } },
  { ingredients: [{ block: BLOCKS.QUARTZ, count: 4 }], output: { block: BLOCKS.QUARTZ, count: 4 } },
  { ingredients: [{ block: BLOCKS.STONE, count: 2, name: 'Stone' }, { block: BLOCKS.CRYSTAL, count: 1 }], output: { block: BLOCKS.QUARTZ, count: 2 } },
  { ingredients: [{ block: BLOCKS.STONE, count: 2 }], output: { block: BLOCKS.MARBLE, count: 2 } },
  { ingredients: [{ block: BLOCKS.STONE, count: 2, name: 'Stone' }, { block: BLOCKS.IRON, count: 1 }], output: { block: BLOCKS.GRANITE, count: 2 } },
  { ingredients: [{ block: BLOCKS.IRON, count: 2, name: 'Iron' }, { block: BLOCKS.STONE, count: 1 }], output: { block: BLOCKS.COPPER, count: 2 } },

  // Decorative
  { ingredients: [{ block: BLOCKS.CRYSTAL, count: 2 }, { block: BLOCKS.STONEBRICK, count: 1 }], output: { block: BLOCKS.RUNESTONE, count: 1 } },
  { ingredients: [{ block: BLOCKS.STONEBRICK, count: 1, name: 'Stone Brick' }, { block: BLOCKS.QUARTZ, count: 1 }], output: { block: BLOCKS.CHISELED, count: 1 } },
  { ingredients: [{ block: BLOCKS.SMOOTHSTONE, count: 2 }], output: { block: BLOCKS.POLISHED, count: 2 } },
  { ingredients: [{ block: BLOCKS.POLISHED, count: 2 }], output: { block: BLOCKS.PILLAR, count: 2 } },

  // Element 6 Orb — crafted from 4 Element 6 blocks (glowing orb, strengthens night villains nearby)
  { ingredients: [{ block: BLOCKS.ELEMENT6, count: 4 }], output: { block: BLOCKS.ELEMENT6_ORB, count: 1 } },

  // Special blocks
  { ingredients: [{ block: BLOCKS.ELEMENT6, count: 1 }, { block: BLOCKS.DIAMOND, count: 1 }], output: { block: BLOCKS.RAINBOW, count: 1 } },
  { ingredients: [{ block: BLOCKS.GLASS, count: 2, name: 'Glass' }, { block: BLOCKS.WATER, count: 1 }], output: { block: BLOCKS.CLOUD, count: 2 } },
  { ingredients: [{ block: BLOCKS.QUARTZ, count: 1, name: 'Quartz' }, { block: BLOCKS.ELEMENT6, count: 1 }], output: { block: BLOCKS.NEON, count: 1 } },
];

// Attach readable names to recipe outputs
import { BLOCK_NAMES } from './world.js';
RECIPES.forEach(r => {
  if (r.output.block !== undefined) {
    r.output.name = BLOCK_NAMES[r.output.block] || 'Item';
  }
});

export function canCraft(recipe, inventory) {
  return recipe.ingredients.every(ing => (inventory[ing.block] || 0) >= ing.count);
}

export function craftItem(recipe, inventory) {
  const newInv = { ...inventory };
  recipe.ingredients.forEach(ing => {
    newInv[ing.block] = (newInv[ing.block] || 0) - ing.count;
  });
  if (recipe.output.block !== undefined) {
    newInv[recipe.output.block] = (newInv[recipe.output.block] || 0) + recipe.output.count;
  }
  return newInv;
}