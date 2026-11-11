# Element 6 — attack overhaul (693 moves) + power abilities (77)

## Install
Copy everything in `src/` into your game's `src/` folder.
- NEW files (add): mvMoves.js, mvArchV2.js, mvArchV2g2.js, mvArchV2g3.js, mvArchV2g5.js, mvArtPhys.js,
  mvPower.js, mvPowerKit.js, mvPowerFam.js, mvPowerDefs1.js, mvPowerDefs2.js, mvPowerDefs3.js, mvPowerArt.js
- REPLACE (patched copies of your files): fighter.js, mvBuild.js, mvKB.js, mvMove.js, mvEngine.js, PlatformFighter.jsx
  (If your copies have changed since you uploaded them, re-apply the edits instead of overwriting; each patch is small and marked with comments.)

## What is where
- attack_sheet_all.md  — every one of the 693 attacks: hitbox part, frames, damage, hitstun, notes
- power_abilities.md   — all 77 power abilities: second press, cooldown, mechanics
- tests/               — check_v2.mjs (attack structure), power_test.mjs + power_mech.mjs (abilities).
                         They import fighter.js, which needs files that were not uploaded (character data,
                         gen1AttackGeometry.js, genPowers.js, ...), so run them in your repo, not standalone.

## Known gaps
- Not seen rendered; verified numerically through fighter.js with stand-ins for missing files.
- Hero Codex / Meet the Characters not wired: read MOVE_NAMES from src/mvMoves.js and mvPowerName() from src/mvPower.js.
- Opponent-projectile interactions (Hana, Osamu, Itto, Magneto, Cable, Volt) assume `projectiles` / `genProjectiles` arrays.
- Team shields read fighter._allies (not present yet). Cooldowns for powers were chosen by me. Online sync untested.
