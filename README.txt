SPLIT CITY STAGE REPLACEMENT

Files to replace in the project root:
- PlatformFighter.jsx
- movementAbilities.js

Changes:
- Split City platform layout is shared through MAP_PLATFORMS, so the revised main platform and lower collision hull coordinates apply wherever Split City is selected, across supported fight game modes.
- Main platform collision top and the underside hull profile are shifted down 14 canvas pixels so characters visually sink into the stage rim.
- Wall-slide exit grants two jumps and two air-dodge uses per wall-grant event, up to the existing two wall grants per airtime. Landing resets the normal pool.

Notes:
- Side collisions continue to use the platform's solid rectangular collision geometry and the existing wall-slide detection. This package does not replace artwork assets.
- Please test in-game: the platform artwork is drawn by renderer.js from the project's existing stage image, and exact pixel-perfect collision for irregular side/bottom silhouettes would require adding polygon collision support rather than rectangular platform collision boxes.
