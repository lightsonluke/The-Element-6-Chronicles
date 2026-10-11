RESONANCE CONSTRUCTS — PURPLE / COMBAT / GRAND CIRCUIT PATCH

REPLACEMENT FILES (copy these to the root of the existing project and overwrite):
- resonanceConstructs.js
- fighter.js
- renderer.js
- PlatformFighter.jsx
- CaptureTheFlag.jsx
- BattleRoyaleEngine.jsx
- GCMatch.jsx

CHANGES
1. Purple's dash_slash power state and high dash velocity are cancelled when the orb is collected. This prevents the old 52-speed dash from continuing while the construct is active and throwing the camera/fighter off-screen.
2. Construct pickup clears the previous attack, old projectiles, old power state, and stale attack state; movement is clamped to a safe range on activation.
3. Tether Gauntlets are attached to both hand-joint positions and follow the character's attack pose instead of appearing below the hands.
4. Construct attacks now carry per-move action types (jab, slash, projectile, grab, rising attack, slam, etc.), use matching active-window hitboxes, mirror with facing, and include blue projectile/smear artwork. The light/power button becomes the construct light attack while active; original power and super activation remain suppressed.
5. Up-heavy, down-heavy, aerial, and recovery attacks use the construct profiles while active instead of falling back to generic/original attack data.
6. Bots seek Resonance Orbs and attempt to collect them in the shared fight loop, Battle Royale, Capture the Flag, and Grand Circuit.
7. Grand Circuit now has Resonance Orb spawns, pickup glow, construct weapon rendering, and construct combat hitboxes.
8. Orb spawning waits until all living fighters are out of construct mode. Platform records using either `w` or `width` are supported.
9. Camera zoom is clamped and the canvas transform is reset before clearing each frame.

INSTALL
1. Back up the seven matching files in the existing project.
2. Extract this ZIP directly into the existing project root and overwrite matching files.
3. Restart the game and test Purple collecting an orb, a gauntlet character, a bot match, and Grand Circuit.

VERIFICATION LIMITS
All seven automated Resonance Construct test suites passed in the working source tree. The four edited JSX files passed a syntax parse. A full Vite production build and live browser gameplay test were not completed in this environment, so test these modes in your actual project.
