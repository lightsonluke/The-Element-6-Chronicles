# Element 6 Clips — Download-Time Real MP4 Fix

This is intentionally a **clips-only** replacement.

Files:
- `clipRecorder.js`
- `ClipsScreen.jsx`

What changed:
- The existing rolling recorder behavior is left intact.
- The WebM recording used for the clip remains available as the source for download conversion.
- When the player clicks **SAVE MP4**, the WebM is converted with FFmpeg to a real H.264 MP4 before the download is handed to the browser.
- The filename is only `.mp4` after the blob itself has been encoded as MP4; this is not a file-extension rename.
- The Clips preview now plays the stored MP4 instead of deliberately preferring the WebM preview blob.
- No camera, freehand, stage, volleyball, bot, leaderboard, clan, or other game systems are changed by this package.
