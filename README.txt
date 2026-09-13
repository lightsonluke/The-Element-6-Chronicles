ELEMENT 6 — CLIPS + COMPLETE STAGE TRANSFER FIX

REPLACE ONLY THESE 5 FILES:
- clipRecorder.js
- GlobalClipRecorder.jsx
- StageEditor.jsx
- PlatformFighter.jsx
- Game.jsx

WHY THE CLIP BUG HAPPENED
The recorder marked a window as stopped BEFORE MediaRecorder had delivered its
final dataavailable event. That could discard the final data and leave the
selected recording empty, producing the repeated "CLIP RECORDING IS STARTING"
or "not ready" behavior.

CLIP FIXES
- MediaRecorder keeps collecting the final chunk until stop() finishes.
- Save requests are serialized, so rapid Space presses cannot consume the same
  recording window twice.
- Recording continues while FFmpeg converts a completed window to MP4.
- The global recorder prioritizes canvas.el6-match-canvas so it does not capture
  the Stage Editor canvas as the game recording.
- Real H.264 MP4 output remains unchanged.
- 60 FPS capture/output remains unchanged.

STAGE TRANSFER FIXES
The match now receives and normalizes the COMPLETE custom stage definition.

Transferred gameplay features:
1. Every platform and its material.
2. Platform conveyor direction.
3. Platform moving motion, including chain/direction/distance/speed/loop.
4. Platform destroyable flag. A usable DESTROY toggle was added to the Motion
   toolbar because the editor already documented this feature and rendered the
   flag, but did not expose a working toggle.
5. Spawn points (P1/P2; P3/P4 remain saved for the editor/future multi-fighter
   flows).
6. Every placed hazard.
7. Hazard size.
8. Hazard-specific direction/strength/axis/range settings.
9. Hazard motion.
10. Every placed item/object.
11. Selected backdrop.
12. Stage camera zoom.
13. Stage camera motion, including chain/loop settings.
14. Custom KO perimeter.
15. Perimeter motion data.
16. Stage name/icon/metadata are retained in the saved stage object.
17. World-stage imported data is retained because the full stage object is
    passed through instead of reducing it to platforms.

IMPORTANT RUNTIME SAFETY
- Custom platforms/hazard/object data are cloned before gameplay mutates them.
  Moving and destructible platforms therefore cannot silently modify the saved
  stage in local progress.
- Older custom stages stored as a raw platform array are still accepted.
- Missing optional fields safely fall back to normal stage behavior.

DO NOT ADD @ffmpeg/ffmpeg TO PACKAGE.JSON FOR THIS FIX.
The clip recorder intentionally has no static FFmpeg package import, so the
Vite/Rollup build will not fail with the unresolved @ffmpeg/ffmpeg error from
the previous package.
