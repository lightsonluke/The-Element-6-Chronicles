ELEMENT 6 — RESTORE REAL 1V1 ONLINE SPORTS

This restores the actual offline game presentation and rules for these ONLINE queues:

  • Soccer Online
  • Soccer Ranked
  • Volleyball Ranked 1v1
  • Dodgeball Online
  • Dodgeball Ranked

It deliberately does NOT replace or edit these offline files:

  • SoccerMode.jsx / SoccerFighter.jsx
  • VolleyballGame.jsx
  • DodgeballGame.jsx

Instead, the online match screen runs those existing real sport components and
uses Supabase Realtime to send each player's inputs / host state.  The generic
SportsRollbackArena placeholder is no longer used for these five 1v1 modes.

INSTALL

1. Upload BOTH files in this folder to the ROOT of the GitHub repository.
2. Let GitHub replace Game.jsx.
3. ActualSportsOnlineMatch.jsx is a new root file.
4. Commit to main and wait for the GitHub Pages workflow to finish.

No SQL is needed. Your existing online sports tables and matchmaking setup are
already used by this update.

IMPORTANT

This folder is only for the five listed 1v1 online sports queues. It does not
change 2v2 Volleyball, Banger, LAN, Custom Rooms, normal fights, or any offline
sport mode.
