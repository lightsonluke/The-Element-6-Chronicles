# Offline sports safety patch

Replace only `SportsHub.jsx` from this package. It fixes the offline Soccer
launch path without replacing `SoccerMode.jsx`, `SoccerFighter.jsx`,
`VolleyballGame.jsx`, `DodgeballGame.jsx`, or `BangerGame.jsx`.

No SQL needs to be run for this patch.

## Online/offline status

Offline sport components remain the source of truth for their gameplay.
The current online sports lobby/rollback arena is only a networking foundation;
it is not a complete deterministic port of those full offline sport components.
Do not overwrite offline sport files with generic rollback files.

Normal online fighting already runs through `rollback/element6Simulation.js`,
which uses the real fighter/projectile/hit routines. It does not need another
SQL migration for basic gameplay parity.
