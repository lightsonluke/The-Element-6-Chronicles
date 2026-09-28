# Element 6 — Gen 4 Hitbox + Knockback Alignment Package

This package is a replacement for the Gen 4 combat files from the detailed Gen 4 animation package.

## Files
- `gen4AttackAnims.js` — keeps the detailed Gen 4 animations and replaces the Gen 4 collision geometry with authored, shape-specific hitboxes. The hitboxes follow the visible barrier, blade, wind ribbon, shadow shape, ring, pillar, projectile, machine, and resonance geometry instead of using one large generic rectangle.
- `attackSpecs.js` — adds per-move Gen 4 knockback direction and a modest per-move strength multiplier. Up attacks launch upward, forward attacks launch in the attack direction, radial attacks push away from the impact center, and the heavier/super attacks are tuned separately.
- `fighter.js` — applies the per-move Gen 4 knockback multiplier while preserving the game's existing global knockback scaling and defender modifiers. It also contains the shared solid-wall/barrier collision fix from the previous package.

## Important
Replace the corresponding files in the project. Do not rename the files.

This package does not change damage values or non-Gen-4 attack geometry.
