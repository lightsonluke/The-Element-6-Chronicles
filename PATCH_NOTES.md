# Party Sports, Host Recovery, Volleyball 2v2, and Guest-Sync Patch

This is a focused source patch, not the full game. Copy the listed source files
into the project and apply the SQL migrations in `PARTY_MIGRATION_ORDER.txt`.

## Included changes

- Ready parties can create one server-backed Soccer, 2v2 Volleyball, Dodgeball,
  or Banger online match. SQL checks host permission, exact party size,
  readiness, presence, and conflicting active sessions.
- Sport matches can elect a live replacement host through a server-side
  heartbeat. The server increments `host_epoch`; clients ignore stale-epoch
  inputs, snapshots, resync controls, and results.
- Online Volleyball 2v2 assigns all four match slots to separate fighters.
  Each participant's keyboard or controller input controls only their own
  character; the simulation host applies the shared state.
- Cloud progress remains local for guests. Cloud read/write helpers first
  require a matching Supabase session for the active account. A signed-out tab
  does not query `user_progress` or call the account-save RPC. Delayed saves are
  fenced after sign-out and account switches.
- Includes the existing Custom Room sport renderer source and its SQL migration,
  plus the party/match route components needed by these flows.

## Apply SQL

Follow `PARTY_MIGRATION_ORDER.txt`. Both included SQL files are in the `SQL/`
folder. The online-sports and party/presence schema are prerequisites. Apply
`SQL/Supabase-custom-room-sports-renderers.sql` before
`SQL/Supabase-party-sports-and-host-migration.sql`.

## Still incomplete

- Sport and Custom Room simulations remain host-authoritative. This patch does
  not implement deterministic frame-perfect rollback across every mode.
- It does not rebuild every active screen from scratch.
- Grand Circuit and other unimplemented party activities remain unavailable.
- No production build or automated test suite was run for this patch. The
  included source was manually reviewed; SQL must be deployed against the
  project's actual Supabase schema.
