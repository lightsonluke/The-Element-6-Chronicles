# Mode Launch Repair Patch

This is a focused replacement-file package for the current mode launch pass.
Copy the root-level `.jsx` and `.css` files into the matching source root of the
game. Keep the existing app structure and merge local edits before replacing
large files such as `Game.jsx`.

## Database migration

If the party/presence, Table, online sports, and party-linked room migrations in
steps 1–13 of `PARTY_MIGRATION_ORDER.txt` are already installed, apply
`sql/Supabase-party-battle-royale-and-launch-reliability.sql` once. Otherwise,
follow the migration order in that document first. The frontend cannot create
the required Supabase columns or RPCs by itself.

## Included work

- Fixes The Table's party-launch hook ordering and uses the server-provided
  tournament ID directly.
- Wires the existing party Battle Royale queue into one shared party roster,
  keeps it out of public matchmaking, and finalizes the shared match state.
- Keeps the shared party session open until the server confirms match finish.
- Includes the scroll-safe character selection and visible start action used by
  the shared sports selector, 2v2/team, CTF, Parkour, Rock Climbing, and
  Ziplining screens.

## Scope limits

Grand Circuit and Capture the Flag remain disabled for party play because their
current engines do not have shared online sessions. They are not routed into
local matches under a misleading party label. Party Battle Royale continues to
use the existing host-authoritative simulation; it is not deterministic,
frame-perfect rollback. These files do not certify every mode or every launch
route, and no production build or automated tests were run for this package.
