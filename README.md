Element 6 — Generation V Detailed Attack Overhaul

This package replaces Generation V attack presentation and combat geometry without changing other generations.

Scope
- 38 Generation V characters: 22 heroes, 13 villains, 3 guardians.
- 6 combat slots per character: Side Signature, Up Signature, Down Signature, Side Heavy, Down Heavy, Super.
- 224 Gen V move variants are overridden by the new renderer/spec layer.
- Purple is intentionally protected: only Purple Side Signature and Purple Down Signature are overridden. Purple Up Signature, Side Heavy, Down Heavy, and Super are left on the existing implementation.

What changed
- Detailed, character-specific attack animation language for every affected Gen V move.
- Hitboxes are generated from the same geometric primitives used to draw the attack, so they track the visible weapon/effect instead of using a generic large rectangle.
- Arc attacks use multiple narrow circles/capsules along the actual arc.
- Beams, blades, barriers, portals, vines, lightning, sound rings, gravity fields, etc. use different collision geometry.
- Per-move knockback direction is calculated from the documented attack type and the actual defender contact direction.
- Directional attacks capture 8-way input (left/right/up/down + diagonals) at attack startup. The animation, hitbox geometry, and knockback all use the same aim vector.
- Side signatures still use the game's existing side/up/down selection rules; holding left/right plus up/down produces diagonal aiming for affected directional side moves.
- Down Heavy is included through its existing DOWN_HEAVIES data path; no separate down-heavy data file is required.

Files
- gen5AttackOverhaul.js — new Gen V animation/hitbox/knockback/directional-control layer.
- fighter.js — connects Gen V specs, hitboxes, knockback and 8-way aim into combat.
- charAttackAnims.js — routes affected Gen V moves to the detailed renderer.

No character roster data was rewritten. No Gen I–IV attacks are changed by this package.
