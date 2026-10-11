Resonance Constructs build/import compatibility patch

Files included:
- PlatformFighter.jsx
- CaptureTheFlag.jsx
- BattleRoyaleEngine.jsx
- GCMatch.jsx
- resonanceConstructs.js

Install:
1. Back up the five matching files in your project root.
2. Extract this ZIP into the project root and overwrite the matching files.
3. Run `pnpm build` again.

Fixes:
- Restores exports imported by CaptureTheFlag and Battle Royale: steerBotToResonanceOrb and consumeConstructSuperInput.
- Exposes getConstructAttackGeometry as a compatibility wrapper around the shared construct collision geometry.
- Imports drawConstructWeapon from resonanceConstructs.js, where the action-specific patch defines it, rather than renderer.js.
- Updates Grand Circuit's Settings > Hitboxes drawing to support circles, polygons, boxes, and capsules returned by the actual construct hitbox geometry.
- Keeps PlatformFighter's construct weapon import consistent with the same source module.

Validation performed here: named import/export scan across root source files, default import scan, JavaScript syntax checks, and JSX transpilation/syntax checks. This environment does not have the project's pnpm dependencies installed, so a production Vite build was not run here.
