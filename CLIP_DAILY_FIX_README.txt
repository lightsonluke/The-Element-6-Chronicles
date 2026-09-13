ELEMENT 6 — REAL CLIP + DAILY QUEST FIX

Replace ONLY these files in the project root:

clipRecorder.js
GlobalClipRecorder.jsx
useClipRecorder.js
ClipsScreen.jsx
dailyQuests.js
DailyQuests.jsx
Game.jsx

CLIPPING FIXES
- The previous recorder was converting every automatically completed 30-second
  window through FFmpeg even when the player did not ask for a clip. That could
  backlog/fail conversion and cause CLIP SAVE FAILED.
- Automatic rotation now only closes a recording window and stores its complete
  source blob. MP4 conversion happens only when Space is pressed.
- MediaRecorder final data is retained through stop().
- Seven overlapping windows are kept at 5-second offsets.
- A completed window is retained for 45 seconds so a Victory/Match Facts screen
  can still save the previous match.
- If no completed window exists yet, the oldest active window can be saved, so
  there is no fake NOT READY state during warm-up.
- Multiple save requests are serialized safely while recording continues.
- FFmpeg conversion queue recovers after an error instead of poisoning all later
  conversions.
- Native MP4 recording is preferred when the browser supports it; otherwise the
  recorded WebM window is converted to H.264 MP4.
- Canvas capture is 60 FPS.
- The gameplay hook no longer installs a second Space-key save handler.

DAILY QUEST FIXES
- Chest order is GOLD → SILVER → BRONZE.
- Existing saved daily quests are normalized to that order immediately.
- Daily quests reset from the local calendar date at midnight even if the app is
  left open.
- Opening an earned chest automatically claims/records it.
- No OK button.
- The reward remains visible for 1 second, then the opened chest disappears.

IMPORTANT
- This package does not add @ffmpeg/ffmpeg to package.json, so it does not create
  the previous Vite/Rollup missing-package build error.
