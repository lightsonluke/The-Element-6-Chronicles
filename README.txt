# Clip preview + file compatibility replacement

Replace these 5 files:

- ClipsScreen.jsx
- clipRecorder.js
- clipStorage.js
- GlobalClipRecorder.jsx
- useClipRecorder.js

Fixes:
- Downloaded files now use the ACTUAL extension of the stored video. A WebM fallback is never renamed to .mp4.
- MP4 encoding is made more broadly compatible with H.264 Main + yuv420p + even dimensions + faststart.
- The generated MP4 is tested by the browser before it is accepted as an MP4.
- Clips Screen waits for actual media metadata/canplay before enabling Preview.
- Video object URLs are created/cleaned up in a safer lifecycle.
- IndexedDB blobs whose MIME type is missing are restored with the stored MIME metadata.
- Preview retries muted playback if browser autoplay blocks the first attempt.

IMPORTANT:
Existing clips that are already genuinely damaged cannot be repaired by code after the fact. Delete those old damaged clips and record new ones after installing this package.
