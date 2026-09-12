ELEMENT 6 — FINAL BUILD-SAFE CLIPS FIX

The build failure shown in the screenshot was caused by this kind of static import:

  import { FFmpeg } from '@ffmpeg/ffmpeg';

Rollup/Vite could not resolve @ffmpeg/ffmpeg because the dependency was not
present in the project's installed node_modules/lockfile.

THIS PACKAGE DOES NOT USE A STATIC @ffmpeg IMPORT.
FFmpeg.wasm is loaded at runtime from jsDelivr after the app has built.

Therefore:
- no @ffmpeg package is required for the Vite/Rollup build
- no package-lock/pnpm-lock edit is required
- no browser screen capture is used
- no getDisplayMedia() exists in the recorder
- capture is from the Element 6 canvas only
- capture is 60 FPS
- saved files are real H.264 MP4 files, not WebM files renamed to .mp4
- FFmpeg conversion is queued so multiple Space presses cannot corrupt the
  FFmpeg virtual filesystem
- recording itself continues while MP4 conversion happens
- multiple clip saves can overlap
- ClipsScreen uses 60 FPS for frame stepping
- downloaded files are always named .mp4
- invalid/empty recorder output is rejected instead of being saved

REPLACE:
1. clipRecorder.js
2. GlobalClipRecorder.jsx
3. useClipRecorder.js
4. ClipsScreen.jsx

DO NOT add @ffmpeg/ffmpeg to package.json for this version.

IMPORTANT RUNTIME NOTE:
The first time an MP4 is saved, the browser downloads the FFmpeg.wasm runtime
from jsDelivr. This is a runtime dependency, not a build dependency. If the
deployment blocks that CDN, MP4 conversion will fail and the app will report
CLIP SAVE FAILED rather than creating a corrupt fake MP4.

SETTINGS:
Enable Clips remains the player-controlled setting. It should stay false by
default. GlobalClipRecorder checks settings.enableClips before starting.

VICTORY / MATCH FACTS:
GlobalClipRecorder does not stop merely because a gameplay child component
unmounts. The global recorder stays alive as long as the app's global recorder
component remains mounted, allowing the previous match's rolling recorder
windows to be saved from Victory/Match Facts.

BROWSER SUPPORT:
The recording source uses HTMLCanvasElement.captureStream() and
MediaRecorder. The final MP4 is encoded by FFmpeg.wasm using H.264.
