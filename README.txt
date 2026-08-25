ELEMENT 6 — RANKED + UNRANKED MATCHMAKING REPAIR

1. Open Supabase Dashboard -> SQL Editor -> New query.
2. Open Supabase-ranked-unranked-repair.sql.
3. Copy all of its text into Supabase. Do NOT type the filename into the editor.
4. Click Run once.
5. There are no GitHub files to upload for this repair.
6. Refresh the game and test Ranked and Unranked with two different signed-in accounts.

This repair fixes the old random_seed, host_id, and room_code requirements
and replaces the fight matchmaking RPC with a version that supplies all
required values itself.
