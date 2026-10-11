Resonance Constructs Build Import Fix

Fixes the mixed-version imports that caused the reported Vite/Rollup error.

Files:
- PlatformFighter.jsx
  * Removes the stale getConstructAttackGeometry import and uses the same
    getActiveSpecHitboxes path as combat for the Settings > Hitboxes overlay.
  * Imports drawConstructWeapon from resonanceConstructs.js, where the current
    action-specific patch defines it, rather than from renderer.js.
- resonanceConstructs.js
  * Adds the missing drawResonanceRangeGlow export required by PlatformFighter.

Install:
1. Back up these two files in the project root.
2. Extract this ZIP into the project root and overwrite the matching files.
3. Run `pnpm build` in your own project environment.

Validation performed here:
- 396 root-level JS/JSX source files passed TypeScript transpile syntax checks.
- Static audit found no missing named exports among root-level source imports.
- `node --check` passed for resonanceConstructs.js, fighter.js, and renderer.js.

Limitations:
- A full Vite build could not be run in this environment because pnpm/node_modules
  are not installed and package registry access is unavailable. The checks above
  are static validation, not a substitute for `pnpm build`.
