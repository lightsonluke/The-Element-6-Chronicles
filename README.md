# Split City artwork + reference-sheet fighter update

Upload this package's contents to the repository root, preserving folders, and replace files when GitHub asks.

## Included changes

- `public/art/stages/split-city/city-backdrop.png` — supplied Split City city art, used by the shared Split City backdrop renderer.
- `public/art/stages/split-city/floating-island.png` — supplied transparent island art, aligned to the physical ground collision top.
- `PlatformFighter.jsx`, `OnlineFight.jsx`, `CustomRoomGame.jsx`, and `rollback/element6Simulation.js` — remove the old invisible upper platforms from Split City. The only physical platform is the painted island top at `x: 40, y: 620, w: 1200, h: 48`.
- `renderer.js` and `stageBackgrounds.js` — render the supplied artwork instead of the procedural Split City artwork. Split City remains the only selectable built-in stage.
- `renderer.js`, `fighter.js`, and `attackSpecs.js` — use a taller, no-eyes stick-figure silhouette based on the supplied standing/running/jumping sheet, preserve each character's existing color and configured limb colors, and update body collision geometry to match it.

`public/art/character-reference-sheet.png` is included as the unmodified design reference. It is not loaded by the game at runtime.

No SQL is needed.
