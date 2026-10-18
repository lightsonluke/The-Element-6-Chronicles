SPLIT CITY STAGE REPLACEMENT — ACTUAL PATCH

Files in this package are replacement source files from the supplied project. Copy all three into the project root, overwriting the matching files after making a backup.

Changes made:
- Split City main platform collision top moved down 8 canvas pixels; the renderer anchors the stage artwork/front rim to the same platform object so the embedded-feet effect tracks it.
- Split City underside collision hull segments moved down by the same 8 pixels to preserve alignment. These are axis-aligned collision segments approximating the supplied underside; they are not per-pixel masks.
- Wall-slide jump recovery now restores up to two jumps and two air-dodge uses when leaving a wall after a valid wall slide, capped by the fighter's normal maxJumps.
- Split City stage data is shared by the selected map across regular modes; other map definitions are untouched.

Files: PlatformFighter.jsx, movementAbilities.js, renderer.js

Testing note: source patch only; this environment cannot launch your browser game, so verify visually and test wall-slide recovery in-game.
