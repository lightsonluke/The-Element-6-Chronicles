SPLIT CITY REPLACEMENT v10

Changes in this package:
- Main platform uses the attached full-height Split City Main Platform image with the large bottom wall.
- Main platform collider top is y=370 (40 units higher than the prior y=410 setting).
- Main solid collider is 1090x242 at x=95,y=370; its side collision extends only through that collider and its underside/bottom boundary is y=612 (height reduced to 242 from 362, about one-third shorter).
- Main platform artwork is aligned so the front light-strip center is at the collision top (visualY=370). The full source image is scaled uniformly, not squished.
- Moving platform texture is byte-for-byte the user-attached /mnt/data/split-city-moving-platform.png (896x177 RGBA), not the main platform or its lower base.
- Moving platform collider is 220x16 at x=530,y=178 and marked _splitCityMoving, making it one-way with no side or underside collisions. Down+jump drop-through behavior remains in fighter.js.
- Horizontal span is 700 units. The triangle-wave motion speed is 1/180, producing a 90-second full cycle and approximately 45 seconds per one-way trip.

JavaScript syntax checked. Full game runtime / visual alignment has not been tested in-game.
