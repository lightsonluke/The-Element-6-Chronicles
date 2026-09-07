ELEMENT 6 CLANS — TARGETED FEATURE PACKAGE

This package adds a persistent clan system designed around the existing Element 6
Supabase/social/ELO architecture.

FEATURES
- Clans button component for the Home top menu, intended to sit immediately left
  of Settings.
- SQL-backed clan browser and searchable clan names/tags.
- Clan creation for exactly 30,000 tokens.
- Clan starts at Tier 0.
- First qualifying match by any member immediately unlocks Tier 1.
- Tier 2-10 progression uses both clan activity XP and minimum elapsed time.
- Tier 10 has a 365-day minimum age.
- Join applications requiring leader approval.
- One clan per player.
- Leave clan for non-leaders.
- Leader-only ownership transfer.
- Leader-only disbanding.
- Four clan ranks: Member, Officer, Lieutenant, Leader.
- Leader rank controls.
- Clan bio/name/tag/icon settings.
- Clan-only realtime chat.
- Leader-to-leader realtime chat infrastructure.
- Leader meeting scheduling/accept/decline/completion infrastructure.
- Tier rewards with one claim per member per tier.
- Clan member ELO view using the existing ranked and sports rating tables.
- Realtime application/chat/meeting updates.
- Server-side clan activity RPC to prevent fake tier progression.

IMPORTANT EXISTING-GAME INTEGRATION
The current Library snapshot does not contain the root Home/App navigation file or
the authoritative token-economy implementation. Therefore this package includes
small integration adapters instead of guessing and overwriting those files.

Files:
  ClansScreen.jsx
  ClansMenuButton.jsx
  clanActivity.js
  Supabase-clans.sql
  HOME-INTEGRATION.txt

INSTALL
1. Run Supabase-clans.sql in Supabase SQL Editor.
2. Add ClansScreen.jsx and clanActivity.js to the React project.
3. Add ClansMenuButton.jsx.
4. Follow HOME-INTEGRATION.txt to connect the Home route and the existing token
   economy.
5. Add clanActivity.js calls at authoritative match-completion points.
6. Build and test.

DO NOT:
- Replace the existing ELO tables.
- Replace the existing token system.
- Award clan XP from the browser without the RPC.
- Award XP from render loops or polling.
- Let clients directly change clan ownership/ranks.
