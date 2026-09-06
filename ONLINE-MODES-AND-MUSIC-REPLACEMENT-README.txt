ELEMENT 6 CHRONICLES — ONLINE MODES + FULL MATCH MUSIC REPLACEMENT

This replacement audits/fixes the online matchmaking/gameplay paths and makes match music use the complete built-in fight/sports library.

ONLINE / MATCHMAKING
- Ranked fights: existing Supabase matchmake_online_game path retained and queue cleanup hardened.
- Unranked fights: same authoritative queue path and stale-search cleanup.
- Online sports: existing Supabase sport queues retained; stale queue cleanup and active-match protection added.
- Battle Royale: moved matchmaking/game transport off the old localBackend/Base44-style BattleRoyaleMatch entity path and onto Supabase RPC + Realtime broadcast.
- Battle Royale: host-authoritative gameplay snapshots; guests send inputs and render authoritative host state.
- Battle Royale: deterministic bot roster fill so all clients reconstruct the same full roster.
- Battle Royale: atomic Supabase start/leave RPCs added.
- Custom Rooms: match music is seeded by room ID; existing room networking is preserved.
- Online sports: ActualSportsOnlineMatch seeds music by the same Supabase match ID so every client gets the same track.

MUSIC
- The built-in match library contains 31 match-capable tracks.
- Matches no longer walk the library in simple index order.
- Offline/local matches use a randomized shuffle bag, exhausting the full library before repeating.
- Online matches use a deterministic match seed, so all players in the same match select the same randomized track.
- Battle Royale, Custom Rooms, Grand Circuit, Banger, Dodgeball, soccer, volleyball, baseball, CTF, team, tournament, story, and standard fight scenes all route through the full match library unless an explicit custom music override is configured.
- Grand Circuit's old 6-track/final-only restriction was removed.
- Banger/Dodgeball no longer force the old chill/epic shortcuts for match music.

SUPABASE SQL
Run the included SQL replacements/migrations in the same Supabase project used by Element 6:
- Supabase-ranked-unranked-repair.sql
- Supabase-online-sports-setup.sql
- Supabase-battle-royale-custom-rooms-and-elo-search.sql

The SQL is written to be rerunnable with CREATE OR REPLACE / IF NOT EXISTS patterns where applicable.

VALIDATION
- TypeScript/JSX transpile syntax check: 412 files checked, 0 diagnostics.
- Match music library: 31 built-in match tracks detected.
- Online mode source files verified present for ranked/unranked fights, online sports, Battle Royale, and Custom Rooms.
