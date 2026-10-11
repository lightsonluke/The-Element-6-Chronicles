RESONANCE CONSTRUCTS — ANIMATION + MOVESET UPDATE

Replacement files:
- resonanceConstructs.js
- fighter.js
- renderer.js
- PlatformFighter.jsx
- CaptureTheFlag.jsx
- BattleRoyaleEngine.jsx

Install:
1. Back up the six matching files in your existing game project.
2. Copy these replacement files into the same project directory, overwriting the old files.
3. Restart the development server/game and test a local match, CTF, and Battle Royale.

What this update changes:
- Adds a faint blue rim-glow to a fighter who is close enough to collect an orb.
- Uses construct-specific body/limb choreography during construct attacks and suppresses the original character attack/super overlays while the construct is active.
- Makes construct attack hitboxes use construct move-profile geometry rather than the original character's authored hitbox specs.
- Replaces the original attack and clears already-launched character-specific projectiles at pickup, so an old attack cannot continue alongside the construct moveset.
- Makes construct weapons light-blue with the character's main color as an accent; improves attack smear trails and gives Tether Gauntlets a gauntlet silhouette positioned at the hands.
- Prevents the super button from triggering a super while a construct is active; the existing dismiss-on-super-input behavior consumes the press.
- Updates the Battle Royale render path to use the construct-transformed character data for the limb animation.

Verification:
The project's four existing Node test suites passed after these changes:
- resonanceConstructs.test.mjs
- resonanceConstructsAnimation.test.mjs
- resonanceConstructsAudit.test.mjs
- resonanceActivationCrash.test.mjs

A production Vite build and live browser gameplay test were not run in this environment. Please test the replacement in your actual project before treating it as fully verified.
