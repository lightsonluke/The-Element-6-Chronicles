# Element 6 clip-save replacement

Replace only these three source files:

- `clipRecorder.js`
- `GlobalClipRecorder.jsx`
- `useClipRecorder.js`

No changes are required to `Game.jsx`, `ClansScreen.jsx`, or `pnpm-lock.yaml` for this fix.

Main fixes:
- Prevents repeated `ondataavailable` handler wrapping during every save.
- Keeps the recorder alive while FFmpeg is working.
- Saves the original WebM recording if browser-side MP4 conversion fails, instead of throwing away the clip.
- Passes the actual MIME type/extension into clip storage.
- Prevents overlapping Space-bar save operations.
- Keeps the existing 30-second rolling buffer and FFmpeg MP4 path.
