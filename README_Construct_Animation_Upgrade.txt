ELEMENT 6 CHRONICLES — CONSTRUCT ATTACK ANIMATION + WEAPON DETAIL UPGRADE

REPLACEMENT FILES (copy to the project root and overwrite matching files):
- PlatformFighter.jsx
- CaptureTheFlag.jsx
- BattleRoyaleEngine.jsx
- GCMatch.jsx
- resonanceConstructs.js

WHAT THIS PATCH CHANGES
- Fixes the key visibility bug: construct fighters were excluded from drawAttackEffect, so the authored construct attack animations were not actually drawn during combat.
- Enables the construct attack art in Platform Fighter, Capture the Flag, Battle Royale, and Grand Circuit.
- Keeps the construct weapon visible and animated during attacks instead of hiding it exactly when an attack starts.
- Gives weapon motion different wind-up, strike, and recovery poses for thrusts/jabs, rising attacks/recovery, downward slams, projectiles, grabs/tethers, and broad sweeps. Weapon family and move direction influence the motion.
- Adds character-color powerstones and etched details to the existing layered weapon illustrations, alongside the cyan energy-metal finish.
- Keeps hold-charge visuals visible in the modes that support attack holding.
- Allows the existing Settings > Hitboxes overlay to display active construct attack geometry in Platform Fighter.

VALIDATION PERFORMED
- `node --check` passed for resonanceConstructs.js and renderer.js.
- TypeScript JSX transpile/syntax checks passed for all four edited JSX files.
- `node --test resonanceConstructs.test.mjs resonanceConstructsAnimation.test.mjs` passed (2/2 suites; the animation smoke test covers 30 weapon families and 7 phases).
- A render smoke test passed for all 30 construct weapon designs in idle, attacking, and attack-hold states.

LIMITATION
A full `pnpm build` was not run because this environment does not have the project's node_modules installed. These checks do not replace a production Vite build or live gameplay QA.
