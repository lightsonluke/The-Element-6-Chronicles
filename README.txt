THE ELEMENT 6 CHRONICLES — RESONANCE CONSTRUCTS AUTHORED MOVES PACKAGE

This package implements the 30-weapon / 7-move-per-weapon specification supplied with the request.

REPLACEMENT FILES
- resonanceConstructs.js
  Integrates the authored weapon moves into each construct fighter, adds weapon-design details,
  provides action-specific collision geometry, and wires a dedicated Recovery attack.
- resonanceConstructsAttackSpecs.js
  Complete authored data for all 30 weapon designs and all 210 move definitions, including the
  exact move names and descriptions, plus animation / hitbox geometry tags.
- renderer.js
  Adds distinct layered visual effects for the authored move geometry: counter, grab, projectile,
  phase, control/trap, dash, rise, slam, spin, thrust, combo, and sweep.
- fighter.js
  Uses the dedicated construct Recovery attack for airborne Up + Signature.

INSTALL
1. Back up your current project first.
2. Extract this ZIP.
3. Copy all four replacement files into the same project directory as the existing files.
4. Overwrite matching files.
5. Run: pnpm build
6. Play-test all seven attack slots across weapon families and enable Settings > Hitboxes to compare
   collision geometry against the rendered attack.

IMPLEMENTATION NOTES
- Weapon names, design descriptions, and all seven named attacks per weapon are based on the
  attached specification. There are 30 constructs and 210 authored attack definitions.
- Geometry categories and the layered visual treatment are implemented in code; they are not 210
  individually hand-drawn sprite sheets. The current renderer animates vector-based weapon forms,
  smears, projectiles, arcs, traps, and impact effects according to each move's authored geometry.
- Exact damage, knockback, frame counts, and collision tuning still require live in-game balancing.
- Validation performed for this package: JavaScript syntax checks, the project's two existing
  Resonance Construct test suites, and a custom check that all 30 constructs have all seven move
  definitions and that the Recovery slot is wired. A full production pnpm build was not run in this
  environment because the project's installed dependencies / pnpm executable are unavailable.
