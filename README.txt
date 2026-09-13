ELEMENT 6 CLIPS - FINAL TARGETED FIX

Replace ONLY:
- clipRecorder.js
- GlobalClipRecorder.jsx
- ClipsScreen.jsx
- clipStorage.js
- useClipRecorder.js

What this fixes:
- Keeps the first WebM initialization chunk in the rolling buffer.
- Converts the clip to MP4 for the stored/downloaded file.
- Stores the original WebM snapshot separately for in-game preview.
- Clips Screen previews the WebM snapshot instead of requiring the browser to decode the MP4.
- SAVE MP4 always downloads the MP4 file.

IMPORTANT:
New clips created after this update get both an MP4 download and a browser-compatible preview copy.
Existing clips do not have the new preview copy, so delete/re-record them if their preview was already broken.
