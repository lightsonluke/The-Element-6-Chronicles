# Element 6 Movement / Collision + Tutorial Fix

This is a targeted replacement package for the movement feature only.

## Fixes
- Includes the required `movementAbilities.js` that the previous replacement package accidentally omitted.
- Makes solid wall collision swept across the previous/current frame so dashes cannot cross through a wall between frames.
- Makes wall-slide contact detection more forgiving while still requiring a real solid wall.
- Keeps movement abilities out of soccer/sports.
- Expands the in-game Tutorial with explicit Dash, Air Dodge, and Wall Slide steps and controls.
- Leaves camera, clips, freehand stage preview, leaderboards, clans, and other unrelated systems untouched.

## Controls
- Double-tap Left/Right: ground dash.
- In air, double-tap a direction: air dodge.
- While falling beside a tall solid wall, hold toward it: wall slide.
