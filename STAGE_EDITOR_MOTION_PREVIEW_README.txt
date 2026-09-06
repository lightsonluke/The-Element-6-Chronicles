ELEMENT 6 CHRONICLES — STAGE EDITOR MOTION / CAMERA / PREVIEW REPLACEMENT

Base:
This package is built from the saved Element 6 Chronicles build-fix-v3 project package and keeps its existing Stage Editor / World Stages / Game changes.

ADDED
1. Material/platform motion
   - Materials/platforms can move.
   - Back/forth motion.
   - One-way motion.
   - All 8 compass directions: left, right, up, down, up-left, up-right, down-left, down-right.
   - One-way chains up to 10 steps.
   - Optional looping.
   - Looping chains continue from the current endpoint instead of snapping back to the original start.

2. Hazard motion
   - Same motion model is available for hazards.
   - Items are intentionally excluded from the new motion editor, matching the request.

3. Stage camera
   - Per-stage camera zoom is saved with the stage.
   - Optional camera motion supports the same 8 directions, back/forth, one-way chains up to 10 steps, and looping.
   - Runtime handoff fields are saved as stageCamera/cameraZoom/cameraMotion.
   - When camera motion is present, the runtime can disable its normal dynamic camera and use the authored camera path.

4. KO perimeter
   - Perimeter data remains saved.
   - Each wall has its own optional motion definition: left/right/top/bottom are independent.
   - Each wall can use the same 8-direction / chain / loop motion model.

5. Preview
   - PREVIEW button is available from the Stage Editor.
   - Preview is fullscreen with a bottom editor-style menu bar.
   - PLAY STAGE runs authored stage motion with no fighters.
   - Stage camera zoom/motion is represented in preview.
   - The bottom bar exposes editor tools and can return directly to the selected editor mode.

FILES ADDED / REPLACED
- StageEditor.jsx
- Game.jsx
- StagePreview.jsx
- StageMotionRuntime.js
- stageBackdrops.js

IMPORTANT RUNTIME NOTE
The saved project package used as the base does not contain PlatformFighter.jsx itself. Game.jsx now preserves and forwards the complete custom stage configuration through:
  customStageConfig
  stageCamera
  killPerimeter

StageMotionRuntime.js contains the shared motion sampler for the actual match runtime. The existing PlatformFighter.jsx in the user's full project must consume those forwarded fields for gameplay collisions/camera/perimeter. This package does NOT fabricate or replace a missing PlatformFighter implementation.

The editor and preview are fully authored around the new stage-data schema so the data is preserved through save/load/import/world stages.

MOTION DATA SHAPE
motion: {
  enabled: true,
  mode: 'pingpong' | 'chain',
  direction: 'left' | 'right' | 'up' | 'down' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight',
  distance: number,
  speed: number,
  loop: boolean,
  chain: [ up to 10 { direction, distance, speed } ]
}

The same shape is used by platforms/materials, hazards, authored camera motion, and individual KO-perimeter walls.
