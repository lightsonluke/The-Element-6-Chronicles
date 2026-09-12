ELEMENT 6 CLIPS — MP4 / 60 FPS / MATCH-TRANSITION FIX

Replace these files:
  clipRecorder.js
  GlobalClipRecorder.jsx
  useClipRecorder.js

clipStorage.js and ClipsScreen.jsx are included as matching files and may be replaced too.

- Records the game canvas at 60 FPS.
- Requires MP4/H.264 MediaRecorder support; no WebM fallback.
- Uses a 12 Mbps video bitrate.
- Maintains a rolling 30-second buffer.
- Space saves without stopping recording.
- Changing to Victory / Match Facts preserves the previous match's recent recording,
  so clips saved there can still include the end of the match.
- Existing IndexedDB storage and Clips screen features remain compatible.
