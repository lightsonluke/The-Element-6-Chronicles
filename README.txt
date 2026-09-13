Replace these 5 files only:
ClipsScreen.jsx
clipRecorder.js
GlobalClipRecorder.jsx
clipStorage.js
useClipRecorder.js

This keeps clips as MP4 downloads, encodes them as H.264/yuv420p with faststart,
validates generated MP4s before saving them, and uses a dedicated preview modal
that waits for the browser to decode the MP4 before attempting playback.

Do NOT replace Game.jsx or pnpm-lock.yaml.
Old clips that were already saved with invalid MP4 data may still be broken;
record one new clip after installing this package.
