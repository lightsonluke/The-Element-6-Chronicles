FIRE HERO — ATTACKS + CUSTOM ART UPDATE

Replace these existing files in the root of The-Element-6-Chronicles-main with the files in this ZIP:
- eras.js
- fighter.js
- renderer.js
- gen1AttackAnims.js
- charAttackAnims.js
- attackSpecs.js
- upHeavies.js
- downHeavies.js

What changed:
- Added hand-authored, layered flame artwork and distinct body poses for Fire Hero's Rising, Fire Hero's Quake, Fire Hero's Wave, Ascendant Breaker, Sunder Slam, Rend Strike, Return Return, Meteor Pound, and Ultimate: Flame Unleashed.
- Recovery and ground pound now use their own visual animation paths instead of reusing Up Signature / Down Heavy art.
- Added bespoke hitbox shapes for the Fire Hero attacks, with separate aerial meteor and grounded lateral knockback behavior for Meteor Pound.
- Updated Fire Hero's attack names, baseline damage, ranges, and move durations to match the supplied design.
- Heavy alone or Up + Heavy selects Up Heavy; Left/Right + Heavy selects Side Heavy; Down + Heavy on the ground selects Down Heavy; Down + Heavy in the air selects Ground Pound.
- Recovery remains Up + Signature while airborne; a normal Signature tap selects Up Signature unless a direction is held.

Validation:
- Ran Node syntax checks on every changed JavaScript file.
- Successfully imported gen1AttackAnims.js, attackSpecs.js, and charAttackAnims.js in Node.
- A full Vite build was not run because dependencies are not installed in the supplied project directory.
