# Element 6 — Hardening + Story Mode Recovery Patch

Replace only the files in this package.

## Silver — Hardening

Silver's Hardened power now reduces incoming damage by exactly 30% and incoming knockback by exactly 30% while active. It does not make Silver invincible or immune to attacks. The reduction uses the central `fighter.js` combat pipeline, so it applies to the fight modes that use the shared fighter engine, including offline fights, Custom Battle, Ranked/Unranked fight matches, Battle Royale, Custom Rooms/LAN fight matches, Story Mode battles, Sandbox, learning/training fight modes, and Campaign/Story battles that use `fighter.js`.

## Story Mode recovery

The current Story Mode/world-generator changes were causing the Story Mode runtime to fail in the affected build. This patch restores the known-good StoryMode.jsx and world.js from the original repository version so Story Mode can mount and run again instead of showing a blank screen. Existing Game.jsx save-slot handling remains untouched.

This is intentionally a recovery patch: it does not reapply the experimental expanded procedural Story Mode layer that was causing the load failure. Once Story Mode is confirmed working again, the expansion can be reintroduced incrementally without replacing the known-good runtime all at once.
