# Element 6 — Clip WebM Storage / MP4-at-Download Fix

This is a targeted clips-only replacement.

## Behavior

- The game records the rolling clip as native WebM.
- The clip is saved to IndexedDB as WebM.
- The Clips tab previews the stored WebM directly.
- **No FFmpeg conversion occurs when saving a clip.** This prevents MP4/FFmpeg failures from producing `CLIP SAVE FAILED`.
- When the player presses **SAVE MP4**, the stored WebM is converted to a real MP4 with FFmpeg in the browser.
- The downloaded file contains actual MP4 bytes; this is NOT a filename-extension change.
- Camera/game behavior and all non-clip features are untouched by this package.

## Replace

Copy these four files over the corresponding files in the project:

- `clipRecorder.js`
- `clipStorage.js`
- `GlobalClipRecorder.jsx`
- `ClipsScreen.jsx`

No SQL migration is required.

## Validation

- `clipRecorder.js`: Node syntax check passed.
- `clipStorage.js`: Node syntax check passed.
- `GlobalClipRecorder.jsx`: TypeScript JSX parser check passed.
- `ClipsScreen.jsx`: TypeScript JSX parser check passed.
