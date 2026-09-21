# Element 6 Clips + Freehand Crash Fix

This is a targeted replacement package for the current Element 6 project.

## Files replaced
- `clipRecorder.js`
- `clipStorage.js`
- `ClipsScreen.jsx`
- `GlobalClipRecorder.jsx`
- `music.js`
- `sfx.js`
- `StageEditor.jsx`
- `materials.js`
- `freehandPhysics.js` (new)
- `VolleyballGame.jsx`

## Clips
- Records the game's actual music and procedural SFX into the clip audio track.
- Keeps native WebM as the reliable rolling recording/preview source.
- Converts the saved/downloaded clip to MP4 with H.264 + AAC when FFmpeg is available.
- MP4 conversion keeps audio instead of stripping it.
- MP4 uses broadly compatible H.264/yuv420p + AAC settings and `+faststart`.
- If MP4 conversion fails, the valid WebM recording is saved instead of reporting a false clip-save failure.
- Clips tab previews the reliable WebM preview first and falls back to the saved MP4.
- Downloads use the actual stored extension rather than forcing a false `.mp4` extension.
- Global recording is completely inactive unless Settings → Enable Clips is on.

## Freehand stages
- Freehand strokes are sanitized before being saved/loaded.
- Long strokes are capped at 4096 sampled points to avoid browser stack/path crashes.
- Collision geometry is continuous slope segments instead of thousands of tiny boxes.
- Existing smooth freehand slope/rolling runtime is preserved.
- Volleyball keeps the original strong movement/landing prediction; only the missing set/spike/finish execution was restored.
- Camera zoom/motion code is intentionally not changed by this package.

## Validation
- JavaScript syntax checks passed for every modified JS file.
- TypeScript JSX transpile/syntax checks passed for every modified JSX file.
- Freehand geometry stress test passed with a 6000-point input stroke.
- A matching H.264/AAC MP4 encoding command was tested with FFmpeg and produced a valid MP4 containing H.264 video + AAC audio.
- A full Vite production build was not run because this package environment does not contain the project's installed `node_modules`.
