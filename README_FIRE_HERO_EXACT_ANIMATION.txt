FIRE HERO — REFERENCE ANIMATION REBUILD

This replacement does NOT use the supplied frame-sheet image as an in-game texture or sprite.
The sheet is treated as an animation blueprint. The Fire Hero attack renderer reproduces the
poses/effects described by each reference frame as native Canvas game animation code.

REFERENCE FRAME EXPANSION
Up Signature    4 reference frames x3 = 12 game frames
Down Signature  4 reference frames x3 = 12 game frames
Side Signature  4 reference frames x3 = 12 game frames
Up Heavy       4 reference frames x3 = 12 game frames
Down Heavy     6 reference frames x3 = 18 game frames
Side Heavy     4 reference frames x3 = 12 game frames
Super          7 reference frames x3 = 21 game frames

Each reference frame is discrete and is held for exactly 3 game frames. No reference image is
loaded by the game.

The hold state uses the actual second reference frame for the corresponding Fire Hero move,
with only brightness/pulse changing while held. Hold art does not become a different attack.

Hitboxes are move-specific and are aligned to the visible attack effect. Knockback profiles are
set per move: hook/upward, ember/radial, elbow/forward, wheel/upward, cracks/radial, gauntlet/
forward, and super explosion/radial.

REPLACEMENT FILES
- gen1AttackAnims.js
- attackSpecs.js
- eras.js
- upHeavies.js
- downHeavies.js
- renderer.js
- PlatformFighter.jsx

No PNG/JPG/GIF frame-sheet assets are included or required.
