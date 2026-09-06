ELEMENT 6 CHRONICLES — STAGE EDITOR MOTION/CAMERA/PREVIEW V2

This package is based on the latest saved Element 6 source package and includes the Stage Editor motion/camera/preview changes.

V2 BUILD REPAIR:
- Fixed the StageEditor.jsx JSX build failure caused by bare numeric JSX attributes such as min=20/max=500/step=10.
- Removed a stale legacy motion-toolbar block that had been left outside its conditional JSX wrapper, causing additional unmatched JSX syntax errors.
- Syntax-checked every JS/JSX file in this replacement source package with the TypeScript JSX parser: 0 syntax errors.

Included feature files:
- StageEditor.jsx
- StagePreview.jsx
- StageMotionRuntime.js
- stageBackdrops.js
- Game.jsx
- Sandbox.jsx
- StoryMode.jsx
- hubRegion.js

No node_modules or generated build artifacts are included.
