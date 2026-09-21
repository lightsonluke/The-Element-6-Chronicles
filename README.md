# Element 6 Clips — Real MP4 Download Fix

This is a targeted clips-only replacement.

## What it changes
- Leaves the existing recording and IndexedDB storage behavior alone.
- Clips continue to be captured/stored as WebM.
- The Clips tab's **SAVE MP4** button now converts that WebM blob to a genuine MP4 using FFmpeg/WASM before downloading it.
- It does **not** merely rename `.webm` to `.mp4`.
- The existing clip preview and recorder behavior are otherwise untouched.

## Replace
- `ClipsScreen.jsx`
- Add `clipMp4Download.js`

The project already uses `@ffmpeg/ffmpeg` and `@ffmpeg/util`, so no new npm dependency is required.
