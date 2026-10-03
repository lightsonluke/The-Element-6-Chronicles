Water Hero — clean restart patch

This patch starts from the uploaded game plus the completed Fire Hero animation file.

What changed:
- Restored the missing Water Hero attack dispatcher so every Water attack has a valid renderer.
- Rebuilt Water Hero Up Signature from the supplied 12-frame blueprint: ring forms on the arm, separates at frame 3, travels upward on a short curved path, fades at frame 7, then returns to neutral.
- Water Up Signature hitbox is the moving ring only and is active on reference frames 3–7.
- Water Up Signature knockback follows the ring's current travel direction.
- Water Up Signature hold/charge window is 12 frames.
- Added a universal attack/charge reset when an attack is interrupted by hitstun, and a clean idle/jumping reset when any attack ends.
- No camera, zoom, or renderer changes are included in this patch.
- Fire Hero animation code is taken from the latest completed Fire Hero package.

Replace these four files:
  gen1AttackAnims.js
  attackSpecs.js
  eras.js
  fighter.js

The other Water attacks are left at their existing designs because the supplied reference only specifies the Up Signature.
