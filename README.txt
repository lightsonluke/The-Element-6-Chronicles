Fire Hero All Attacks Performance + Smooth Super Patch

Keeps the current Fire Hero attack designs and timing.

Changes only:
- Fire Hero attack/super effects use a performance rendering path with expensive Canvas shadowBlur passes disabled, while retaining the same native shapes, colors, layered cores, flame lobes, rings and rays.
- Reduces repeated glow/shadow work that was causing frame-rate drops across all Fire Hero attacks and the Super.
- Super now interpolates continuously between its existing seven reference beats (position, radius and opacity), so it transitions smoothly instead of snapping from one beat to another.
- The Super remains the current native animation; no reference images are loaded.

Replace only gen1AttackAnims.js and renderer.js from this package. Do not replace other files.
