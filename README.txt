Water Hero + Universal Animation Reset Update

This patch keeps the completed Fire Hero implementation intact and adds:

1. Universal attack/idle reset fix for all characters.
   - A normal attack now always clears its attack data when it completes.
   - Any third-party hit/hitstun immediately cancels the attack or charge.
   - When hitstun ends, the fighter cleanly returns to idle/jumping instead of carrying a broken attack/run pose.

2. Water Hero Up Signature rebuilt from the supplied 12-frame reference guide.
   - Native procedural water ring; the reference image is NOT used as a sprite.
   - 12-frame visual timing mapped into a 24-frame in-game attack.
   - Frame 1: ring forms around the lower arm.
   - Frame 2: ring swings up around the raised arm.
   - Frames 3-7: ring separates and travels upward along the curved path.
   - Frame 8: fading fragments. Frames 9-12: clean return to neutral.
   - Hitbox follows the ring itself only after separation (frames 3-7).
   - Knockback follows the ring's current movement direction, not the fighter's velocity.
   - Water Up Signature hold/charge window is 12 frames, matching the supplied reference length.

Files to replace:
- gen1AttackAnims.js
- attackSpecs.js
- fighter.js
- eras.js
- renderer.js (included to preserve the completed Fire Hero performance/smooth-super changes)
