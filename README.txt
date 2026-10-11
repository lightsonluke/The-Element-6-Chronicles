RESONANCE CONSTRUCTS — VISIBLE ANIMATION / HITBOX / GRAND CIRCUIT SPAWN PATCH

Replacement files:
- renderer.js
- resonanceConstructs.js
- PlatformFighter.jsx
- CaptureTheFlag.jsx
- BattleRoyaleEngine.jsx
- GCMatch.jsx

Install:
1. Back up the six matching files in your project root.
2. Extract these files into the project root and overwrite matching files.
3. Restart the development server and test each mode.

What this patch changes:
- Fixes the construct attack-effect branch condition: move attacks carry resonanceAnimation/resonanceHitboxFamily metadata, so the renderer must check those fields or it can skip the construct-specific effect path. This was a concrete reason the intended animation art could fail to appear.
- Increases the size, brightness, and readability of construct attack effects, with broad attack silhouettes that respond to vertical, ground, projectile, and sweeping move types and the character/family-authored mode.
- Allows construct attack effects to render in Grand Circuit, Capture the Flag, and Battle Royale instead of explicitly suppressing them while a construct is active.
- Draws the construct's active collision rectangle when the existing Settings > Hitboxes option is enabled in PlatformFighter and Grand Circuit. The collision logic itself remains in fighter.js and uses the same move profile/timing inputs.
- Places Grand Circuit's orb on a valid arena platform at spawn instead of beginning above the arena, and filters out top-boundary/vertical wall surfaces as orb landing surfaces.

Validation performed:
- Node syntax checks passed for resonanceConstructs.js, renderer.js, and fighter.js.
- TypeScript transpile syntax checks passed for PlatformFighter.jsx, CaptureTheFlag.jsx, BattleRoyaleEngine.jsx, and GCMatch.jsx.
- All 7 existing resonance construct test suites passed.

Limitations:
- No production build or live browser gameplay test was run in this environment. This patch is not a claim that Purple's separate pickup/camera bug is now fixed; that needs a reproducible live symptom/stack trace to trace reliably.
