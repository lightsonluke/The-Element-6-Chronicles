ELEMENT 6 — CLIPS MP4/60FPS FIX

WHY THIS VERSION IS DIFFERENT
The previous implementation tried to require a browser-native MP4 MediaRecorder.
Chrome frequently records canvas MediaStreams as WebM instead. That made the
"complete MP4" check fail.

This version:
1. Captures the Element 6 canvas at 60 FPS.
2. Records reliable WebM segments with MediaRecorder.
3. Waits for a complete segment when Space is pressed.
4. Converts that complete WebM into a real H.264 MP4 with ffmpeg.wasm.
5. Validates the resulting MP4 before saving it.
6. Keeps multiple staggered recording windows so the previous match remains
   available during Victory / Match Facts transitions.

INSTALL
Run:

npm install @ffmpeg/ffmpeg @ffmpeg/util

Then replace:
- clipRecorder.js
- GlobalClipRecorder.jsx
- useClipRecorder.js

Do NOT rename WebM files to MP4. This package actually converts them.

IMPORTANT
The first clip after starting recording may need a few seconds for a complete
recording window to become available. After the recorder has warmed up, the
staggered windows make the wait normally no more than about 5 seconds.

The global recorder intentionally does not stop when the Victory or Match Facts
React component unmounts. That is what allows those screens to save the clip
from the preceding match.

FFMPEG CORE
The recorder loads the FFmpeg browser core from jsDelivr at runtime. The app
therefore needs network access the first time conversion is used.
