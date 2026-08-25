ELEMENT 6 — ONLINE FIGHTS: SHARED STAGES + ELO LIMIT

Install in this order:

1. Supabase -> SQL Editor -> New query.
2. Open Supabase-online-fights-stage-elo.sql and copy ALL of it into Supabase.
3. Press Run. Do not type the filename into the editor.
4. Upload these files to your GitHub repository root and replace the existing files:
   - RankedOnlineLobby.jsx
   - RollbackOnlineFight.jsx
5. Upload element6Simulation.js into the rollback folder in GitHub:
   rollback/element6Simulation.js
6. Commit and wait for GitHub Pages to deploy.
7. Test with two signed-in accounts in two browsers.

What this update does:
- The server randomly selects the same built-in, non-custom stage and platform layout for both players.
- Both players use their own selected character, element, shikigami, skins, and accessories saved in their matchmaking loadout.
- Each player controls only their own fighter from their own device using their Settings control preset: Arrows, WASD, custom bindings, or controller.
- Ranked Fight, Soccer Ranked, Volleyball Ranked, and Dodgeball Ranked ratings are clamped between 0 and 4000 on the server.

This package changes only Ranked and Unranked Fights. The existing sport matchmaking remains separate.

Parkour, Rock Climbing, Zipline, and Honored Bot leaderboard records use older,
separate score paths. They are deliberately not changed by this online-fight
package; they need their own shared-score update rather than a risky partial fix.
