ELEMENT 6 CLIP FIX — FINAL

Replace ONLY:
- ClipsScreen.jsx
- clipRecorder.js
- clipStorage.js
- GlobalClipRecorder.jsx
- useClipRecorder.js

This version keeps the WebM initialization chunk while maintaining the rolling
30-second buffer. The previous implementation deleted that initialization chunk,
which could produce MP4s that saved but could not be decoded by QuickTime,
Media Player, Canva, CapCut, or the browser.

MP4 output is forced to H.264 / yuv420p with an MP4 container and faststart.
The Clips screen uses stable Blob URLs and a dedicated preview viewer.
Downloads are always named .mp4.

IMPORTANT: delete old broken clips and record a NEW clip after installing this.
