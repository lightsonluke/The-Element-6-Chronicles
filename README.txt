ELEMENT 6 CHRONICLES — SOCCER OFFLINE + ONLINE FIX

WHAT WAS FIXED

1. OFFLINE SOCCER CHARACTER-SELECT BUG
The universal character selector passes the selected characters to SoccerMode, but the old start handler immediately read the previous React state values. That could start SoccerFighter with the wrong/stale fighter IDs and make Soccer fail or load incorrectly.

The fix passes the selected character IDs directly into handleStart(), so the match always starts with the characters the player actually selected.

This also fixes tournament and 2v2 setup using stale selection state.

2. ONLINE SOCCER / ONLINE SPORTS DATABASE RLS
The existing Supabase online-sports SQL had recursive RLS policies. The player-table policy queried online_sport_players while evaluating that same table's policy, which can cause Supabase to reject reads with an infinite-recursion RLS error.

The SQL now uses a SECURITY DEFINER participant-check function for both match and player visibility.

INSTALL

A) OFFLINE SOCCER
Replace:
  SoccerMode.jsx

B) ONLINE SOCCER
In Supabase SQL Editor, run the ENTIRE:
  Supabase-online-sports-setup.sql

Running the full SQL is intentional because it also recreates/updates the existing online sports functions and policies.

IMPORTANT
- Do not replace Game.jsx.
- Do not replace SoccerFighter.jsx.
- Do not replace the character-selection system.
- Do not replace the online sports component files from the previous online-gamemodes package.

TEST

OFFLINE:
1. Open Soccer.
2. Pick a specific P1 and P2.
3. Start Quick Match.
4. Confirm the selected fighters appear.
5. Test Tournament and 2v2 as well.

ONLINE:
1. Make sure the SQL above has been run in Supabase.
2. Open two signed-in clients.
3. Enter the same online Soccer mode.
4. Confirm both clients enter the same match.
5. Confirm the player list loads instead of getting stuck on the waiting screen.

BUILD NOTE
A full Vite production build was not run here because the supplied source environment does not contain the project's installed node_modules/build dependencies.
