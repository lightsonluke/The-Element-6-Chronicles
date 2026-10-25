# Element 6 Chronicles — Update Validation Notes

## Implemented in this update
- Dedicated controller Dash action, defaulting to standard gamepad button index 6 (Nintendo ZL / PlayStation L2); remappable in Controller Settings.
- Keyboard Dash support in the existing keybind profiles.
- Dash uses press-edge detection and existing dash balance values; directional double-tap remains available.
- Match Settings per-player control assignments are carried into the fight. An explicitly assigned keyboard profile or controller is the exclusive input source for that player; disconnected assigned controllers stay idle.
- Fight variants selected in Match Settings map to their corresponding local fight simulation mode.
- Selecting a standalone mode in Match Settings now routes to that mode's actual app screen (tournament, Grand Circuit, The Table, Battle Royale, Custom Rooms, Party, LAN, Soccer, Sports, or the relevant online sports lobby) instead of silently launching the prior fight mode.
- Gen-I super collision paths that are only visual trails are marked visual-only so the hitbox follows the current projectile/contact point rather than the whole future path.
- Water capsule and splash artwork uses layered filled volumes, gradients, foam highlights, and deterministic droplets while preserving shared collision geometry.

## Checks actually run
- `node gen1-attack-smoke-test.mjs`: PASS — 495 animation/geometry samples, 1,726 finite hitbox shapes, five Gen-I timing profiles.
- JavaScript syntax checks (`node --check`) for modified `.js` modules: PASS.
- TypeScript parser/transpilation checks for modified `.jsx` and `.js` modules: PASS (12 files checked).
- ZIP integrity checks: PASS for the generated full-project and targeted replacement archives.

## Checks that did not pass or could not be completed
- Production Vite build: BLOCKED — `vite` is not installed. `npm install --ignore-scripts --no-audit --no-fund --prefer-offline` timed out; this environment did not obtain the dependencies.
- Existing `resonanceActivationCrash.test.mjs`: FAIL — assertion at line 17 (`false !== true`).
- Existing `resonanceConstructsAudit.test.mjs`, `resonanceConstructsAnimation.test.mjs`, and `resonanceConstructs.test.mjs`: FAIL at module import because the current `resonanceConstructs.js` does not export symbols expected by these tests. These are unrelated existing files and were not changed as part of this update.
- Browser/in-game visual test, physical Nintendo/PlayStation controller test, and performance benchmark: NOT RUN.
- Full individual audit of every attack's choreography, collision frames, damage, hitstun, knockback, and all multihit/super stages: NOT COMPLETE. Ice Hero and Water Hero supers still require in-game validation.

This report distinguishes code-level checks from gameplay verification. No unrun test is represented as passing.
