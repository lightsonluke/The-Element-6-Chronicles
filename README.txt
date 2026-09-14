TARGETED CLIP FIX

Replace only:
- clipRecorder.js
- GlobalClipRecorder.jsx
- clipStorage.js
- ClipsScreen.jsx
- useClipRecorder.js

Fixes:
- Keeps the WebM initialization/header chunk in the rolling buffer.
- MP4 encoding tries H.264 first, then MPEG-4 Part 2 if the FFmpeg build does not contain libx264.
- The saved/downloaded file is ALWAYS MP4.
- The Clips screen uses the original browser-native WebM as an internal preview copy, so preview does not depend on MP4 browser decoding.
- IndexedDB stores both: MP4 for download and WebM for in-app preview.
- No Game.jsx or package.json changes.

After replacing, create a NEW clip. Old clips cannot gain the previewBlob field.
