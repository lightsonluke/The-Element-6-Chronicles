ELEMENT 6 - CLAN CHAT / APPLICATIONS / MEMBERS / ELO FIX

This is a targeted package based on the existing 15-hour Proven Founder package. It does NOT replace the game.

WHAT IT FIXES
- Clan chat no longer depends on a broken player_profiles PostgREST relationship.
- Clan applications use a secure server read model with usernames.
- Clan member lists load reliably.
- Clan member ELO loads through a secure RPC for Ranked, Soccer, Volleyball, and Dodgeball.
- Chat/applications get realtime publication setup.
- SQL policies are safe to rerun.

FILES
- ClansScreen.jsx
- Supabase-clan-chat-applications-members-elo-FIX.sql
- Supabase-clans.sql (full clan SQL with rerun-safe policy guards)
- Supabase-clan-founding-routes-MIGRATION.sql (kept so the 15-hour Proven Founder route is preserved)
- Game.jsx (unchanged copy from the 15-hour package)

SQL
If the existing clan SQL is already installed, run ONLY:
Supabase-clan-chat-applications-members-elo-FIX.sql

If you are rebuilding the clan database from scratch, use Supabase-clans.sql and then the founding-routes migration.

IMPORTANT
The migration assumes the existing Ranked/Online Sports ELO tables exist: ranked_ratings and online_sport_ratings.
