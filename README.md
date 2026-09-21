# Element 6 — Clip Conversion + Freehand Crash Fix

Targeted replacement package. Replace only the listed root files.

## Clips
- Keeps the rolling recording as WebM internally.
- Adds the game's Web Audio output to the recording stream so music and SFX are included.
- Converts the WebM to a real MP4 with H.264 + AAC before the clip is saved/downloaded.
- Uses lower-memory/faster FFmpeg settings to avoid the previous conversion stall around 8%.
- Keeps a WebM preview blob for reliable in-game preview.
- Marks clip `<video>` elements as trusted so the global media guard cannot silence them.

## Freehand stages
- Removes the `Math.min(...largeArray)` / `Math.max(...largeArray)` stack-overflow path from freehand rendering.
- Bounds rendered freehand samples to a safe number of points.
- Bounds generated legacy collision segments per stroke and across a stage.
- Filters legacy `_freehandSegment` explosions out of runtime platform lists and rebuilds a bounded collision representation from the actual stroke data.
- Camera zoom/motion code was not changed by this package.

## Validation
- TypeScript parser: 0 syntax/parse errors across all 8 modified files.
