ELEMENT 6 — ACTUAL CLIPS + CLANS FIX

This is a targeted integration package. It does NOT replace the whole game.

FILES INCLUDED
- Game.jsx
- MainMenu.jsx
- ClipsScreen.jsx
- GlobalClipRecorder.jsx
- clipStorage.js
- clipRecorder.js
- ClansScreen.jsx
- clanActivity.js
- Supabase-clans.sql

CLIPS FIXES
1. Game now actually mounts GlobalClipRecorder globally.
2. Home navigation actually routes to /clips and renders ClipsScreen.
3. Clips can be opened from the desktop and mobile Home UI.
4. The global recorder now detects when the current game canvas is destroyed/replaced and rebinds to the new canvas instead of continuing to record a dead canvas.
5. ClipsScreen refreshes when a new clip is saved.
6. Existing per-mode useClipRecorder integrations remain intact.
7. The 30-clip local IndexedDB limit is preserved.

CLANS FIXES
1. Game now actually routes to /clans and renders ClansScreen.
2. Home has a real Clans button on desktop and mobile.
3. The existing local token economy is connected to the clan 30,000-token creation cost.
4. Clan tier rewards are claimed through the secure clan reward RPC instead of a direct client insert.
5. Clan loading correctly preserves the leader role during the initial refresh, so leader-only applications/thread controls actually load.
6. Clan activity is now hooked into the existing completed fight/sport reward flow for supported modes instead of being a disconnected adapter.
7. Clan meeting inserts now have an RLS policy.
8. Leader-message realtime publication is enabled in the SQL migration.
9. Fixed a SQL syntax error in element6_get_or_create_leader_thread that prevented the clan SQL from executing.

SUPABASE
Run Supabase-clans.sql against the same Supabase project used by the game before testing online clans.
Do NOT expose a service-role key in the browser.

BUILD NOTE
The source package does not include node_modules, and this environment could not install the project's npm dependencies, so a full Vite production build could not be executed here. JavaScript syntax checks were run on the non-JSX changed JS files.
