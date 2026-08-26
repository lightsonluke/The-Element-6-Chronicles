ELEMENT 6 ONLINE FINAL REPAIR

1. Run Supabase-elo-leaderboard-fix.sql in Supabase SQL Editor (this fixes the
   ambiguous user_id error in Top 100).
2. Upload every .jsx file in this folder to the repository root and allow GitHub
   to replace same-named files.
3. Upload the rollback folder to the repository root, replacing rollback/rollbackSession.js.
4. Upload the public/404.html file into the repository's public folder, then
   commit and wait for the build to finish before opening the game.

The Banger online queue uses six player slots. Each browser only sends its own
slot's key/action; when the ball reaches a player, only that player's slot can
perform the Banger action.

This package intentionally does not touch offline sport files.

URL note: the game now changes browser paths such as /home, /shop, /fights,
and /onlinesports while navigating. GitHub Pages needs a SPA fallback to make
a direct reload of a deep path work; use the normal home address if GitHub
Pages has not been configured with that fallback yet.
