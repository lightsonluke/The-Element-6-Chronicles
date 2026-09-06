ELEMENT 6 CHRONICLES — ONLINE GAMEMODE HARDENING REPLACEMENT

Replace these files in the project:

- BattleRoyaleEngine.jsx
- BattleRoyaleLobby.jsx
- battleRoyaleOnline.js
- OnlineSoccerFight.jsx
- Supabase-battle-royale-custom-rooms-and-elo-search.sql

IMPORTANT SUPABASE STEP:
Run the included Supabase-battle-royale-custom-rooms-and-elo-search.sql in the Supabase SQL editor after replacing the files. It adds/updates the Battle Royale lifecycle RPCs used by the new online flow.

WHAT THIS PACKAGE FIXES

1. BATTLE ROYALE IS NOW ACTUALLY SERVER-AUTHORITATIVE DURING GAMEPLAY.
   - Host owns the simulation.
   - Guests send input only.
   - Guests render host snapshots instead of independently simulating.
   - Variable-duration jump input is preserved as held input rather than being converted into a one-time jump event.
   - Combat, projectiles, loot, zone damage, eliminations, hazards, moving objects and match state come from the authoritative snapshot.

2. BATTLE ROYALE LIVE GAMEPLAY USES SUPABASE REALTIME BROADCAST.
   - Gameplay is no longer written to a database row every few frames.
   - Input is sent at high frequency.
   - Authoritative snapshots are broadcast at a stable rate.
   - A low-frequency durable final result remains in the database.

3. BATTLE ROYALE MATCHMAKING USES THE SUPABASE BATTLE-ROYALE QUEUE.
   - No browser-local localStorage matchmaking.
   - Multiple devices can join the same online match.
   - The host's final bot roster/settings are stored in the authoritative match settings.

4. SOCCER ONLINE INPUT SYNC.
   - Guest held-input state is sent on a fixed cadence with a tick/time stamp.
   - The host accepts the wrapped input payload.
   - This preserves jump-button hold duration and other held inputs more reliably than sending only on key changes.

VALIDATION

- Reachable source graph: no missing local imports.
- Reachable source graph: no syntax errors.
- Full-source scan still reports two old unreachable files under Element6Chronicles-syntax-fix/; they are not part of the reachable Vite graph. They were not modified by this package.
- A complete pnpm/vite production build was not run because the provided environment does not contain the project's node_modules installation.
