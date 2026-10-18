SPLIT CITY STAGE REPLACEMENT — install notes

Included files are only the files needed for the stage art/runtime changes:
- PlatformFighter.jsx: rectangular main collider and moving one-way mini platform
- renderer.js: render the replacement transparent stage assets and moving platform
- movementAbilities.js: touching a wall restores up to two jumps; wall-slide logic remains
- fighter.js: reliable down+jump drop-through on one-way platforms
- public/art/stages/split-city/*: replacement main platform art, the supplied moving mini-platform art, and backdrop

Install by replacing the matching project files and copying the public art folder
into the same location. The stage definition is keyed by `splitcity`, so it applies
whenever Split City is selected regardless of match mode.

Collision design:
- Main stage: one rectangular solid collider (top, sides, underside).
- Mini platform: 220x16 rectangular one-way collider; you can jump up through it
  and land on it while falling. The existing down+jump drop-through behavior is
  retained by the fighter collision system.
- Mini platform moves horizontally between its limits. The movement runtime's
  triangle wave yields approximately 45 seconds per left-to-right trip.

Important: this package has not been launched inside the game, so please test
visual alignment and the drop-through input in your actual build. Rendering and
physics are code changes, not a claim of an in-game QA pass.
