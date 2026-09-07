ELEMENT 6 — CLAN FOUNDING ROUTES

This package adds three ways to create a clan without requiring the old 30,000-token gate.

ROUTE 1 — WEALTHY FOUNDER
- Cost: 15,000 tokens.
- Uses the existing game token economy callback.

ROUTE 2 — PROVEN FOUNDER
- No token cost.
- Requires 50 lifetime wins.
- Requires 5 hours of lifetime playtime.
- The existing Game progress is used to display and submit the proof values.

ROUTE 3 — COMMUNITY FOUNDER
- Cost: 5,000 tokens.
- Founder starts a 24-hour founding session.
- The session generates an 8-character code.
- 3 OTHER players must enter the code and confirm.
- Confirmers must not already belong to a clan.
- Once 3 confirmations are reached, the founder can create the clan.
- The session is marked used after successful creation.

FILES
- Game.jsx
- ClansScreen.jsx
- Supabase-clans.sql
- Supabase-clan-founding-routes-MIGRATION.sql

IMPORTANT
Run Supabase-clan-founding-routes-MIGRATION.sql in the same Supabase project after the existing clan SQL has already been installed. The included Supabase-clans.sql is the complete patched clan SQL file.

The founding-route SQL keeps the old element6_create_clan RPC blocked so an old client cannot bypass the three new routes. The new UI uses element6_create_clan_v2.

The Proven Founder proof is based on the game's existing local/cloud progress values (wins and playtime). The Community Founder confirmation/session state is server-side in Supabase.
