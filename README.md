# Element 6 Story Mode replacement package

These are real replacement source files from the attached Element 6 repository, modified for the Story Mode expansion.

## Main changes

- Per-save procedural world seed; every newly created Story Mode slot gets a unique seed and existing saves retain their seed.
- 20 distinct biome profiles with biome-specific terrain, materials, terrain shaping, vegetation, water/lava behavior, caves, ruins, and structures.
- More varied procedural structures and environmental generation.
- Major villain encounters are spaced much farther apart than before.
- 120+ Story Mode item definitions, including food, animal/nature materials, minerals, elemental materials, collectibles, and utility items.
- Block mining can also discover corresponding Story Mode material items.
- Expanded crafting registry with 200+ recipes and searchable/categorized crafting UI.
- Inventory UI supports both world blocks and non-block Story Mode items; only real placeable blocks can be put on the world hotbar.
- Story Mode displays the current biome.
- Existing Element 6 playable character rendering/definitions are not redesigned by this patch.

## Files to replace

- Game.jsx
- gameProgress.js
- StoryMode.jsx
- StoryCrafting.jsx
- StoryInventory.jsx
- crafting.js
- storyItems.js
- world.js

## Build note

The environment used to prepare this package did not have node_modules installed, and dependency installation timed out, so a production Vite build could not be completed here. The JavaScript data/engine files pass `node --check`. Run the project's normal `npm install` and `npm run build` after applying the replacements.
