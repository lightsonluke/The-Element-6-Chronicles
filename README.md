# Element 6 — Clip Download + Freehand Runtime Fix

Targeted replacement only. This package does not modify stage camera logic or other systems.

## Clips
- The Clips tab now converts stored WebM to a real MP4 before download.
- It no longer merely changes `.webm` to `.mp4`.
- Existing MP4 clips download directly.
- If MP4 conversion fails, the original WebM is downloaded as a real fallback instead of silently doing nothing.
- `convertToMP4` is exported from `clipRecorder.js` for the Clips tab.

## Freehand stages
- Large freehand strokes no longer use `Math.min(...points)` / `Math.max(...points)`, avoiding call-stack crashes.
- Canvas rendering is bounded to a smooth 2400-point visual path for extremely detailed strokes.
- Match collision rebuilds freehand strokes into at most 320 continuous slope segments per stroke.
- Existing `_freehandSegment` collision entries are discarded and safely rebuilt to prevent duplicated/huge collision arrays.
- Freehand slope collision, rolling behavior, item rolling, and existing camera zoom/motion code are otherwise untouched.

## Validation
Source files were checked for balanced delimiters. A full Vite build cannot be claimed in this environment because the project dependencies are not installed here.
