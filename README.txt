RESONANCE CONSTRUCTS — ATTACK GEOMETRY / GIANT SMEARS / GAUNTLET FIX

Replacement source files (copy these into the project root and overwrite matching files):
- resonanceConstructs.js
- fighter.js
- renderer.js
- PlatformFighter.jsx
- GCMatch.jsx
- CaptureTheFlag.jsx
- BattleRoyaleEngine.jsx

What this patch changes:
- Each construct move's live collision uses getConstructAttackGeometry(), the same geometry drawn by the Settings > Hitboxes overlay in Platform Fighter and Grand Circuit.
- Hitboxes only exist during the move profile's active frames. Jab, projectile, grab, rising attack, ground slam, radial burst, and slash use different geometry; slash/vertical/ground attacks use tighter polygons instead of a generic family-sized rectangle.
- Construct attacks get large, high-contrast animated smear/effect frames. Fire, water, nature, ice, lightning, and soul/reaper family modes have different visual treatment; ranged attacks travel, and upward/downward attacks are drawn above/below the fighter.
- Construct attacks can dash, rise, slam, or briefly snare based on their move profile.
- Gauntlets calculate hand joints at the same 36-unit character scale used by the fighter renderer, fixing the old tiny-scale hand coordinates that placed them incorrectly.
- Grand Circuit uses the same live construct hitbox geometry for the existing hitbox visibility setting.

Install:
1. Back up the seven listed files.
2. Extract this ZIP directly into the project root and overwrite matching files.
3. Restart the dev server and test several construct families and move slots, including opposite facing directions.
4. Turn on Settings > Hitboxes and confirm the red geometry follows the visible active smear/projectile.

Verification performed for this patch:
- node --check passed for fighter.js, renderer.js, and resonanceConstructs.js.
- TypeScript transpile syntax checks passed for all four JSX files.
- Direct geometry checks passed for jab, slash polygon, rising polygon, ground slam, moving projectile, active timing, and grab profile.

Limits: this patch has not been tested in a live browser match or a full production build. The hitbox overlay/collision share one geometry helper, but gameplay still needs an in-match test in the user's project.
