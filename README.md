# Element 6 — Revert Gen 5 Attacks, Keep Gen 4

This package reverses the Gen 5 attack overhaul from the most recent update while keeping the Gen 4 attack work.

Included:
- fighter.js — Gen 4 fighter integration, including Gen 4 wall/hitbox behavior.
- attackSpecs.js — Gen 4 hitbox/knockback alignment.
- gen4AttackAnims.js — Gen 4 detailed attack animations.
- charAttackAnims.js — the pre-Gen-5 animation router that includes Gen 4 routing.

Not included:
- gen5AttackOverhaul.js
- Gen 5-specific fighter changes
- Gen 5-specific animation routing

Replace the matching files in the project with these files. Do not add gen5AttackOverhaul.js.
