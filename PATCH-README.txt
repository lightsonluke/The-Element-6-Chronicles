The Element 6 Chronicles — targeted update

Modified files:
- gen1AttackArt.js: water capsules now render as filled, layered, translucent-looking water volumes with internal current highlights and deterministic spray details. Non-water art paths are unchanged.
- controllerProfiles.js: adds Dash to the default controller profile on standard button index 6 (Nintendo ZL / PlayStation L2) and exposes the action from gamepad input, including a compatibility fallback for existing profiles without a dash binding.
- ControllerSettings.jsx: adds a remappable Dash action and shows the standard trigger glyph when an older profile has no saved Dash binding.
- PlatformFighter.jsx: merges the new gamepad Dash action into gameplay input.
- movementAbilities.js: handles Dash on the button press edge, uses movement direction or facing, and prevents repeated activation while held. Existing double-tap logic and dash tuning are preserved.

Validation performed:
- `node --check` passed for modified .js modules and the relevant attack geometry/spec/animation modules.
- `node gen1-attack-smoke-test.mjs` passed: 495 animation/geometry samples, 1,726 finite hitbox shapes, 5 Gen-I timing profiles.
- Dedicated dash behavior test passed: single press starts dash; holding the button does not retrigger.
- `npm run build` could not run because dependencies are not installed in this environment (`vite: not found`).

Important scope note:
This is a targeted replacement package, not a claim that every requested attack hitbox, both super moves, all per-move choreography, and all performance issues have been fully audited or fixed. Those require further gameplay/browser validation. No Fire Hero, Thunder Hero, Ice Hero, or Grass Hero attack artwork was intentionally redesigned.
