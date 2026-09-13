ELEMENT 6 — CLIPS RECORDER FIX

Replace:
  clipRecorder.js
  GlobalClipRecorder.jsx
  useClipRecorder.js

WHY THE PREVIOUS VERSION FAILED:
The old recorder rotated seven MediaRecorder instances and tried to construct a clip from a slot while that slot could be finalizing/stopping. That made saveClip return null and the UI showed "CLIP RECORDING IS STARTING".

THIS VERSION:
- Uses one continuously running 60 FPS canvas recorder.
- Requests a fresh data chunk when Space is pressed before taking the snapshot.
- Keeps the rolling 30-second buffer in memory.
- Starts recording immediately and does not run FFmpeg on rotation.
- Serializes MP4 conversions so FFmpeg cannot corrupt simultaneous saves.
- Produces H.264/yuv420p MP4 with faststart for CapCut/Canva compatibility.
- Removes the second save handler from useClipRecorder.js.

No package.json change is required for this fix if the project already contains:
  @ffmpeg/ffmpeg
  @ffmpeg/util
