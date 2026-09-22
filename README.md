# Element 6 Wall-Slide Fix

Replace the existing root `movementAbilities.js` with the included file.

Changes:
- Wall contact is detected from the actual platform geometry instead of relying only on `fighter.wallSide` from the previous collision pass.
- Adds a small contact tolerance for floating-point/collision-order gaps.
- Requires real vertical overlap with a solid wall, so nearby platforms do not falsely trigger wall sliding.
- Preserves the existing wall-slide speed/acceleration behavior.
- Adds lightweight wall dust using the game's existing `doubleJumpParticles` renderer path, so no camera or renderer changes are required.
- Keeps sports exclusion, dash/air-dodge behavior, wall grants, and all camera/stage-editor code untouched.
