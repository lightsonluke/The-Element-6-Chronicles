ELEMENT 6 — ONLINE STATE VERIFICATION + RESYNC

This update does NOT end a match merely because the two browsers drift apart.
It pauses briefly with RESYNCING… and replaces the predicted state with the
authoritative host snapshot before continuing.

WHAT IS CHECKED

• Match frame / stage timer / score
• Every player's position, velocity, facing and relevant movement state
• Ball position, velocity, last team touch and score-related state
• Existing rollback checksums for regular ranked/unranked fights and generic
  rollback sports matches

WHAT IT UPDATES

• Soccer Online and Soccer Ranked now use host-authoritative snapshots every
  50ms, alongside input forwarding. A meaningful player/ball difference opens
  a short RESYNCING… overlay and corrects the state instead of ending a match.
• Volleyball 1v1 and Dodgeball Online/Ranked keep their existing host-state
  rendering and now share the same resync overlay.
• RollbackOnlineFight.jsx and SportsRollbackArena.jsx use the stronger
  checksum-recovery version: mismatch → temporary pause → host snapshot → resume.

INSTALL — KEEP THE FOLDERS

Upload the contents of this folder to the ROOT of the GitHub repository.
Let GitHub replace files when it asks.

Root files:
  ActualSportsOnlineMatch.jsx
  SoccerFighter.jsx
  RollbackOnlineFight.jsx
  SportsRollbackArena.jsx

Nested files — these MUST stay inside the repository's existing rollback folder:
  rollback/multiplayerRollbackSession.js
  rollback/rollbackSession.js

Do not replace Game.jsx with this update. No Supabase SQL is required.
