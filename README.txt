SPLIT CITY STAGE REPLACEMENT — USER-SUPPLIED ARTWORK

Files: replace PlatformFighter.jsx, renderer.js, and movementAbilities.js in the project root. Copy the public/ folder contents into the project's public/ folder (merge/overwrite the matching art/stages/split-city files).

Changes: renderer now loads the supplied Split City Main Platform and supplied city backdrop, crops the actual platform artwork, and draws its front rim over fighters. Split City retains stepped physics-only collision segments under the platform. Wall-slide departure restores two jumps (capped at maxJumps).

Note: the attached side-platform and moving-platform artwork is included in public/art/stages/split-city for the stage assets, but this patch does not yet implement animated movement or collision for those two additional pieces. Collision underside is a stepped approximation, not pixel-perfect. Test the stage in-game and tune dimensions if your canvas/camera scaling differs.
