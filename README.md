# Element 6 — Complete Character Attack Package

This is a targeted replacement package for the character attack system.

## Included
- `fighter.js`
  - Heavy damage is derived from the character Power stat.
  - Signature damage is substantially below Heavy damage.
  - Super damage is substantially above Heavy damage.
  - Character-specific attack geometry is used for real hit detection.
  - Knockback follows the actual attack geometry/contact direction instead of one generic rectangle.
- `charAttackConfigs.js`
  - Adds explicit attack configs for the previously uncovered Gen I-IV villains and Guardians.
  - Keeps the existing detailed configurations for the rest of the roster.
- `charAttackAnims.js`
  - Crossover characters inherit the attack animations/configuration of their base character instead of falling back to generic attacks.
- `attackCombatProfiles.js`
  - Shared geometry/scaling layer used by the fighter simulation.

## Coverage
All playable base characters in the current unified roster resolve to an explicit attack configuration or their base character's configuration (for crossovers). No playable roster character falls through to the generic power-name fallback.

## Validation
- JavaScript syntax checks passed for all four replacement files.
- Roster/config resolution check passed for all 86 playable roster entries found in the current project registry.
- A full Vite build was not run because the supplied project does not contain `node_modules` in this environment.
