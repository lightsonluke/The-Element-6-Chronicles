# Split City artwork + reference-sheet fighter update

Upload this package's contents to the repository root, preserving folders, and replace files when GitHub asks.

## Included changes

- `public/art/stages/split-city/city-backdrop.png` — supplied Split City city art, used by the shared Split City backdrop renderer.
- `public/art/stages/split-city/floating-island-full.png` — supplied island artwork. Its left and right halves are joined directly, with the blank middle removed; the painted top is aligned to the physical ground collision top.
- `PlatformFighter.jsx`, `OnlineFight.jsx`, `CustomRoomGame.jsx`, and `rollback/element6Simulation.js` — remove the old invisible upper platforms from Split City. The only physical platform is the compact painted island top at `x: 110, y: 602, w: 1060, h: 24`.
- `renderer.js`, `stageBackgrounds.js`, and `stageMaterials.js` — render the supplied artwork instead of the procedural Split City artwork and block the old generic metal slab from rendering over it. Split City remains the only selectable built-in stage.
- `renderer.js`, `fighter.js`, and `attackSpecs.js` — use a compact, no-eyes, joint-driven stick-figure silhouette based on the supplied sheet. It has individually animated limbs for idle, running, jumping, attacks, stun, emotes, wall sliding, wall jumps, dashes, and dodges, with matching collision dimensions.

`public/art/character-reference-sheet.png` is included as the unmodified design reference. It is not loaded by the game at runtime.

No SQL is needed.
