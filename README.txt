Split City stage replacement v11

Files to replace/copy into the project:
- PlatformFighter.jsx
- renderer.js
- movingPlatforms.js
- movementAbilities.js
- fighter.js
- public/art/stages/split-city/split-city-main-platform.png
- public/art/stages/split-city/split-city-moving-platform.png
- public/art/stages/split-city/split-city-backdrop.png
- public/art/stages/split-city/split-city-side-platform.png

Main platform collision: top y=370 (standing line through the purple light strip); x=75, w=1118; bottom y=682, h=312, matching the visible main image bounds after uniform rendering. Artwork is drawn at x=75 with width 1130 and preserved aspect ratio.

Moving platform: renderer loads /art/stages/split-city/split-city-moving-platform.png directly. This file is the exact supplied thin-platform image (896x177; SHA-256 verified against the supplied attachment). It is rendered proportionally at platform.w. Collision is top-only/one-way at y=178 with h=16; no side/underside collision. Down+jump drop-through and jumping through from below are handled by the platform collision code. Horizontal distance is 700; speed 1/180 in the triangle-wave movement system gives about 45 seconds each way.

This package is source/assets only; test in the actual game after copying.
