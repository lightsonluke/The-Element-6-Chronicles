ELEMENT 6 ONLINE RELIABILITY UPDATE

DO THESE STEPS IN THIS ORDER:

1. Open Supabase -> SQL Editor -> New query.
2. Open Supabase-online-reliability-and-elo.sql from this folder.
3. Copy ALL of its text into Supabase and press Run.
4. Upload the remaining files in this folder to the ROOT of your GitHub repo.
   Keep the rollback folder inside the repo's existing rollback folder.
5. Let GitHub replace files with the same names. Commit the upload.
6. Wait for GitHub Pages to deploy, then hard-refresh the game.

WHAT THIS UPDATE DOES

- fixes the online_matches random_seed NOT NULL error
- checks fight and sport rollback checksums every 15 frames
- pauses briefly and restores a host checkpoint after a mismatch instead of
  ending a match because of a desync
- makes ranked fight/sport forfeits finish server-side and update ELO
- adds Top 100 plus username ranking lookup to the ELO screen
- gives 45 local character XP to the fighter used when you win an online match
- replaces the old local-only LAN room signaling with Supabase signaling
- adds the missing room-code input to LAN Shapeshift selection

IMPORTANT

Internet lag can never be made mathematically impossible. This uses frequent
checks plus an automatic short resync pause, so an incorrect state is repaired
instead of being allowed to continue or crashing the game.

Do NOT upload the old Element6-ranked-unranked folders that are inside your
repo. Upload only the files in this update folder / ZIP.
