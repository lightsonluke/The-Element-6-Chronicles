# Party, guest-progress, and super-move recovery patch

Copy the eight source files at this package root into the game project root, replacing the same files. Apply the SQL migration only after the party, online-sports, and Table migrations listed below are already installed.

## Included changes

- Adds party-only Grand Circuit and four-player 2v2 Capture the Flag launch paths using the existing party/table/sports session code.
- Keeps unauthenticated and anonymous guest progress device-local. If auth initialization stalls, the game opens local guest progress instead of holding the screen on an account-sync overlay; a later confirmed sign-in still switches to account progress.
- Contains malformed super-move drawing to the fighter-local effect area, skips invalid effect frames, and recovers the gameplay animation loop after a rendering error instead of leaving the cleared canvas blank.

## Database migration

Apply `sql/Supabase-party-grand-circuit-and-ctf.sql` after the existing SQL setup for online sports, party presence/sports, party-linked rooms, party/Table integration, and Table rounds. The migration is intended for the matching schema already used by this project; it is not a replacement for those prerequisite migrations.

## Limits

Grand Circuit reuses the existing online 1v1 fight session for each elimination match. CTF uses the existing host-authoritative sport state transport. This patch does not implement deterministic frame-perfect rollback, nor does it complete a bespoke redesign of every game screen. The Grand Circuit result RPC still relies on a participant report and is not a trusted simulation result.

No production build or multiplayer test was run for this package.
