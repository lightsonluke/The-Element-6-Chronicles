# Element 6 — Clan Tournament + Clan Badge Fix

Replace only:
- `ClanTournamentPanel.jsx`
- `ClansScreen.jsx`

Then run:
- `Supabase-clan-tournaments-badge-FIX.sql`

Fixes:
- Clan Tournament weekly matchup now loads using the player's clan ID instead of the user's auth ID.
- Tournament RPC errors are no longer silently ignored.
- Active weekly XP updates live instead of remaining at zero until the week ends.
- Monthly Top 100 view exposes `clan_tag`, matching the UI.
- Current-month tournament scores are updated with upserts instead of deleting the standings on every refresh.
- Clan leaders can upload/change/remove a clan badge through the existing file picker/data-image flow.
- Badge RPC validates ownership and image input and returns the updated clan row.
