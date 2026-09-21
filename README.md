# Element 6 — Freehand + Clips Final Fix

This is a targeted replacement package for the current Element 6 project.

## Freehand
- Reverts freehand collision generation to the original stable point/segment collision representation.
- Removes the experimental continuous-slope collision runtime from `fighter.js`.
- Removes freehand-slope motion bookkeeping from `movingPlatforms.js`.
- Keeps the current Stage Editor camera implementation untouched.

## Clips
- Removes FFmpeg usage completely from the clip recorder.
- Uses Mediabunny for real WebM -> MP4 conversion in the browser.
- MP4 conversion uses H.264/AVC video and AAC audio when the browser can encode them.
- Keeps the original WebM as the preview/fallback source so an encoding limitation cannot turn a valid recording into `CLIP SAVE FAILED`.
- Routes Element 6 music and SFX through a MediaStream recording destination so saved clips include game audio.
- Downloads use the actual stored file extension rather than renaming WebM to `.mp4`.

## Install
The GitHub workflow uses `pnpm install --no-frozen-lockfile`, so the new `mediabunny` dependency in `package.json` will be resolved automatically.

No camera zoom/motion code was changed for this fix.
