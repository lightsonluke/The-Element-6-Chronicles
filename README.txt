ELEMENT 6 — WORLD LEADERBOARD SAVE FIX

This patch fixes the Parkour, Ziplining and Rock Climbing server-backed
leaderboard save path.

ROOT CAUSE:
The existing submit_element6_world_score() function referenced
"auth.users.username". Supabase auth.users does not have that column, so the
RPC could fail before inserting the score. The React game caught that error,
which made the run look like it saved locally while element6_world_scores was
never updated.

INSTALL:
1. Replace the four JS/JSX files in this package in the repository.
2. Open Supabase SQL Editor.
3. Run Supabase-world-scores-fix.sql once.
4. Sign into an Element 6 account.
5. Complete a Parkour, Ziplining, and Rock Climbing run.
6. Verify rows appear in public.element6_world_scores.

MODES WRITTEN:
- parkour
- zipline
- rockclimb

SCORING:
- Parkour: higher distance replaces the player's previous best.
- Ziplining: higher distance replaces the player's previous best.
- Rock Climbing: lower completion time replaces the player's previous best.

The existing game code already calls submitWorldScore(). This patch keeps that
architecture and fixes the server function rather than bypassing Supabase RLS.
