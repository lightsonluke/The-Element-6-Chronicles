ELEMENT 6 — CLIPS + DAILY QUESTS FIX

Replace these six files in the CURRENT project:

clipRecorder.js
GlobalClipRecorder.jsx
useClipRecorder.js
dailyQuests.js
DailyQuests.jsx
Game.jsx

CLIPS FIXES
- Fixed the rolling recorder eventually running out of slots because completed
  slots were not automatically restarted.
- A slot that is currently finalizing is no longer selected for a clip save.
  This was the direct cause of intermittent "CLIP IS NOT READY YET" results.
- saveClip waits briefly for the next usable recorder instead of immediately
  returning null during a recorder rotation.
- GlobalClipRecorder is the ONLY Space-key clip saver. useClipRecorder no
  longer installs a second Space handler.
- Global recorder follows the current .el6-match-canvas when React replaces it.
- Clips remain local game-canvas recordings. No getDisplayMedia() or browser
  screen permission is used.
- MP4/H.264/60FPS output is preserved.
- Overlapping saves remain supported through the FFmpeg conversion queue.
- The player's Enable Clips setting is respected; it remains OFF by default.

DAILY QUEST FIXES
1. Quest chest rewards are now ordered:
   Slot 1 = GOLD
   Slot 2 = SILVER
   Slot 3 = BRONZE
   This swaps the previous Bronze and Gold positions.

2. Daily quests reset at the user's LOCAL calendar midnight (12:00 AM), not
   24 hours after they were generated. Game.jsx also schedules a midnight
   reset while the app remains open.

3. Opening a chest no longer shows an OK button.
   The reward appears, stays visible for approximately one second, then the
   chest is automatically marked opened, removed, and persisted.

The existing Settings "Enable Clips" toggle is not replaced by this package.

BUILD NOTE
No new npm dependency is introduced by these files.
