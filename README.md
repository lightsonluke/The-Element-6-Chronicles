# Element 6 Online Gameplay Synchronization Repair v1

This is a targeted replacement package for the existing Element 6 project.

## Included fixes

- Variable-height jump input is synchronized by simulation tick in rollback matches.
- Rollback input packets now carry held/pressed/released information so a jump press and release cannot be collapsed into a generic `jumped` event.
- Ranked/Unranked rollback remains authoritative and checksum/resync based.
- Battle Royale is host-authoritative: guests no longer run a second independent physics/combat simulation.
- Battle Royale uses Supabase Realtime Broadcast for frequent input/snapshot traffic, with the database retained only as a low-rate recovery/persistence path.
- Battle Royale authoritative snapshots include fighter gameplay state, zone, loot, projectiles/attack state, and synchronized environment checkpoints.
- Custom Rooms use Realtime Broadcast for gameplay input/state and guests render the host-authoritative state instead of maintaining a second independent simulation.
- Online Soccer uses Realtime Broadcast for frequent held-input and authoritative-state traffic while retaining the database as a low-rate recovery path.
- Online Soccer and offline Soccer character construction now falls back to the unified character registry, so a CPU/bot using a locked character does not prevent the match from mounting.

## Replacement files

Copy the package files over the matching files in the project root, preserving all other project files.

No Supabase SQL migration is required for this package; it uses the existing Realtime Broadcast channels already used by the project.

## Validation performed

- JavaScript syntax checks passed for the modified `.js` files.
- TypeScript parser check with JSX enabled passed for the modified `.jsx` files (`tsc --noEmit --noResolve`).
- Full Vite production build was not claimed because the supplied project directory does not contain `node_modules`.
