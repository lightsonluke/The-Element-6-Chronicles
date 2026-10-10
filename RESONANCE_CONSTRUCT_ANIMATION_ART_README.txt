RESONANCE CONSTRUCT ANIMATION ART UPDATE

What changed
- renderer.js now routes resonance attacks through a dedicated construct-animation renderer rather than showing the character's unrelated normal signature artwork.
- The renderer authors 30 distinct construct-family silhouettes: blades, greatblades, dual weapons, spear/trident/halberd/staff, heavy hammer/maul/shield, whip/flail, bow/blasters/cannons/projector, rings/core/shards, and close-combat gear.
- Each attack is drawn continuously through its wind-up, strike, impact, and recovery phases. Hold poses are supported, with layered metal bevels, cyan energy insets, highlights, hit flashes, and brief impact flecks.
- Character variation affects the motion cadence, while the weapon family determines the silhouette and attack motion.
- resonanceConstructs.js now suppresses the idle weapon copy while an authored attack pose is being drawn, preventing two overlapping weapons during the swing. The persistent weapon remains visible during movement, jumps, falls, landings, and idle states.
- The animation code is shared through renderer.js, so any fight mode that calls drawAttackEffect can render the family-specific art.

Validation performed
- node --check renderer.js
- node --check resonanceConstructs.js
- node resonanceConstructs.test.mjs
- node resonanceConstructsAnimation.test.mjs (all 30 families across 7 phases)
- TypeScript parser pass for the changed JS/JSX files (no syntax diagnostics)

Limitations
- This is hand-authored procedural Canvas artwork and animation inside the game code, not a set of external raster sprite sheets.
- The full Vite browser build and live gameplay/multiplayer regression tests were not run because the dependency installation is absent in this environment. Run npm install and npm run build in the project folder before release.
