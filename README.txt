FIRE HERO FINAL TWO FIXES

1. SUPER REVERT
The Fire Hero Super visual effect was reverted to the Super implementation from
"Fire Hero Exact Native Animation — 3.5x Slower Package". It uses the legacy
reference-style fireball/orbit and radial explosion rendering, without changing
the other Fire Hero attack designs.

The Fire Hero Super body pose was also reverted to the exact discrete seven-beat
pose timing from that package. The existing 3.5x attack timing is preserved.

2. UP HEAVY PERFORMANCE
The existing Up Heavy animation design and timing are preserved, but its fire-wheel
renderer was optimized. It no longer creates ten independently shadow-blurred flame
shapes plus a full expensive ring effect every frame. The wheel uses one shared glow
pass and lightweight flame tips, greatly reducing Canvas shadow/blur work while
keeping the same irregular wheel shape and breakup behavior.

Only these two files need replacing from this package:
- gen1AttackAnims.js
- renderer.js

No frame-by-frame reference images are loaded or used by the game.
