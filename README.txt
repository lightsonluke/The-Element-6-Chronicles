RESONANCE CONSTRUCTS — ACTION-SPECIFIC ANIMATION + HITBOX PATCH

Replace these four files in the project's root folder:
  resonanceConstructs.js
  attackSpecs.js
  fighter.js
  renderer.js

Back up the current versions first. Extract this ZIP directly into the project root and allow the four matching files to be overwritten.

WHAT THIS PATCH CHANGES
- Gives each construct attack slot an action profile rather than making every move a generic weapon swing.
- Uses distinct jab, projectile, upward projectile, rising/jump, ground slam, grab/tether, dash-thrust, burst, and sweeping-slash behavior.
- Draws weapon silhouettes based on the actual construct family (blades, polearms, hammers, bows, cannons/blasters, gauntlets/greaves/claws, chains/whips, rings/cores/shards, shields, and others).
- Adds attack-driven movement for construct dash-thrusts, rising moves, and airborne slams.
- Uses the same active per-move geometry for checkHit collision and getActiveSpecHitboxes(), which is what the existing Settings -> Hitboxes overlay reads.
- Hitboxes only exist during the authored active portion of the attack and are tied to the current move's projectile, tether, thrust, rising path, slam area, or slash arc rather than a generic family-sized rectangle.
- Adds construct-specific up-heavy and down-heavy move data, including aerial down-heavy/slam behavior.

VERIFICATION
- `node --check` passed for all four changed JavaScript files.
- Construct tests passed: resonanceConstructs.test.mjs, resonanceConstructsAnimation.test.mjs, resonanceConstructsCombat.test.mjs.
- The animation smoke test exercised all 30 construct families at seven animation phases.
- The combat test checks that the settings-overlay hitbox API returns the same geometry used by `checkHit`.
- JSX syntax checks passed for PlatformFighter.jsx, CaptureTheFlag.jsx, BattleRoyaleEngine.jsx, and GCMatch.jsx.

LIMITATION
A production build and live browser gameplay session were not run in this environment. Please test in-game with Settings -> Hitboxes enabled, including both facing directions and ground/air variants.
