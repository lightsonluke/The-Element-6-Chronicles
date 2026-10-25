THE ELEMENT 6 CHRONICLES — FIRE HERO PERFORMANCE / ANIMATION / HITBOX FIX

Replace the matching files at the project root with the files in this ZIP.
This is a replacement-files patch, not the entire game project.

Changes:
- Slowed down and expanded Fire Hero's attack choreography so the side signature,
  side heavy, down heavy and super are visible instead of flashing by.
- Kept the original low base damage, with restrained damage growth as the opponent's
  damage rises. Fire Hero heavies and super scale slightly more than signatures.
- Increased Fire Hero knockback scaling with the opponent's damage, especially for
  heavy attacks, while capping the scaling curve.
- Reduced expensive repeated particle/ray work in Fire Hero's super and ground effects.
- Made the attack's active-frame progress linear so the rendered strike and hitbox
  use the same per-frame progress.
- Matched side signature and side heavy hitboxes to their visible flame trails,
  down-heavy hitboxes to the spreading ground strike, and super collision to the
  moving flame core instead of its decorative trail.
- Kept collision hitboxes active only during their authored active frames; a confirmed
  hit consumes the hitbox immediately while the remaining animation/recovery continues.
- Kept the previous removal of the red attack-guide overlay and extra cooldown bars.

Fire Hero updated timing (60 FPS):
- Up signature: 34 frames
- Down signature: 50 frames
- Side signature: 44 frames
- Up heavy: 68 frames
- Down heavy: 62 frames
- Side heavy: 72 frames
- Recovery: 42 frames
- Ground pound: 62 frames
- Super: 120 frames

Validation: JavaScript syntax checks passed for fighter.js, attackSpecs.js,
gen1AttackAnims.js and renderer.js. A full game build was not run in this environment.
