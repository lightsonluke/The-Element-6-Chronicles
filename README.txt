ELEMENT 6 — REAL CLIPS + DAILY QUESTS FIX

This package is based on the full current project supplied by the user.

CLIPS — actual bug fixed:
The previous recorder automatically converted EVERY expired 30-second window to
MP4. Because FFmpeg conversion can take longer than the 30-second window, the
rolling pool eventually emptied. saveClip() then had no active recorder and the
UI reported that the clip was not ready.

This version:
- rotates expired recorder windows immediately;
- NEVER runs FFmpeg during automatic rotation;
- restarts the replacement recorder before any MP4 conversion;
- uses 60 FPS canvas capture;
- keeps 7 staggered overlapping windows;
- flushes MediaRecorder data correctly;
- accepts the final dataavailable event after stop();
- allows a clip during the first 30 seconds using the current partial window;
- converts only the user-requested window to H.264 MP4;
- serializes FFmpeg's virtual filesystem without stopping recording;
- targets canvas.el6-match-canvas first;
- preserves the existing global Space handler so one press is one save.

DAILY QUESTS:
- Quest chest order is now Bronze → Silver → Gold (Gold and Bronze swapped).
- Existing same-day quest data is normalized to that order immediately when the
  Daily Quests screen opens.
- Daily reset is based on the local calendar date and checked every 30 seconds,
  so it resets at 12:00 AM and also recovers if the browser was asleep at midnight.
- Opening an earned chest automatically grants its reward, shows the reward for
  about one second, then removes the chest. There is no OK button.

REPLACE ONLY:
clipRecorder.js
GlobalClipRecorder.jsx
dailyQuests.js
DailyQuests.jsx

Do not replace the rest of the project with an older generated package.
Do not add @ffmpeg/ffmpeg to package.json. The recorder loads the browser FFmpeg
runtime dynamically so Vite/Rollup does not need that package as a build import.
