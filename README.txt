ELEMENT 6 — CLIPS + STAGE EDITOR RUNTIME FIX

This package was made from the current full project ZIP supplied by the user.
It is intentionally NOT a whole-project replacement.

REPLACE ONLY THESE 6 FILES:
- clipRecorder.js
- GlobalClipRecorder.jsx
- useClipRecorder.js
- movingPlatforms.js
- sandboxHazards.js
- fighter.js

CLIPS FIXES
- Rolling recorder windows now restart immediately after every 30-second window is sealed.
- The recorder therefore does not eventually run out of windows after a long session.
- A clip can be saved during the first 30 seconds; the oldest partial window is converted instead of returning "CLIP IS NOT READY YET".
- MP4 conversion happens after the recording window is restarted, so conversion does not stop recording.
- Only GlobalClipRecorder handles Space; game-specific hooks no longer install duplicate Space listeners.
- When a new match mounts a new canvas, the hook switches the recording source to that new match canvas.
- During Victory/Match Facts, the old match canvas remains the active source because no new match canvas has mounted, preserving the previous match for clipping.
- MP4 output remains H.264/yuv420p/60fps with faststart.

STAGE EDITOR → MATCH FIXES
The current project already passes the complete custom-stage object from StageEditor through Game into PlatformFighter. The missing runtime pieces were:

1. Stage Editor platform motion is stored as:
   { mode, direction, distance, speed, loop, chain }
   but movingPlatforms.js previously only understood the older:
   { type: 'horizontal'/'vertical'/'oneway', ... }
   format. movingPlatforms.js now samples the Stage Editor motion format.

2. Stage Editor generic hazard motion uses the same motion/chain format,
   while sandboxHazards.js previously only understood axis/range movement.
   sandboxHazards.js now samples the Stage Editor format too.

3. The Stage Editor kill perimeter was being passed into fighters, but fighter.js
   still used hard-coded -500/+500/-600/+450 bounds for actual KO detection.
   fighter.js now uses the supplied custom perimeter.

The existing complete-stage transfer in Game.jsx remains intact for:
- platform position and size
- platform material
- conveyor direction
- destroyable platforms
- platform motion
- motion chains/loop settings
- spawn points
- all Stage Editor hazard types
- hazard dimensions and configured properties
- hazard motion
- placed objects/items
- backdrop
- stage camera zoom
- stage camera motion
- KO perimeter
- perimeter motion data

IMPORTANT
Do not add @ffmpeg/ffmpeg as a static import for this package. The current
build-safe recorder continues to load the FFmpeg browser runtime at runtime.
