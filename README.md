# Element 6 — Targeted Online Matchmaking + Music Replacement

THIS IS NOT A WHOLE-GAME REPLACEMENT.

Copy/replace ONLY the files in this package in the matching locations of the existing Element 6 project.

## Included source fixes
- Ranked / Unranked OnlineLobby matchmaking lifecycle
- Rollback online match lifecycle + heartbeat/leave/result reporting
- Battle Royale queue, deterministic bot roster, stale-match cleanup hooks, heartbeat
- Battle Royale online leave helper
- Online Sports active-match heartbeat support
- Match music seed/full-track selection for online soccer, custom rooms, Banger, Dodgeball, Grand Circuit
- Full `music.js` seeded track selection
- Fixes the `camZoom` runtime declaration-order error in RollbackOnlineFight

## Included SQL
Only the four SQL files that were actually changed for these matchmaking fixes are included:
- Supabase-ranked-online-setup.sql
- Supabase-ranked-unranked-repair.sql
- Supabase-online-sports-setup.sql
- Supabase-battle-royale-custom-rooms-and-elo-search.sql

Run SQL deliberately in Supabase. Do not replace unrelated database scripts.

## Important
These are full-file replacements for the listed files only. They do not contain the rest of the game.
