FIRE HERO FINAL FIXES

Preserves the current Fire Hero native animations and only changes:

1. Side Signature transition
   - The character/effect now moves continuously between the existing reference beats.
   - No reset/snap at the frame boundaries.
   - The lead hand remains direction-aware.

2. Down Heavy performance
   - Keeps the same visual design and attack sequence.
   - Replaces the expensive repeated glow/shadow burst path with a lightweight native flame-ray renderer.
   - This prevents the Down Heavy from causing frame-rate drops while preserving the radial fire-line look.

3. Hold -> release continuation
   - Releasing a Gen I held signature/heavy stores the current normalized hold position.
   - The released attack starts from that exact position instead of restarting at frame 1.
   - The animation then continues forward to its normal end.
   - Hitbox progress uses the same continued animation progress.

4. Signature camera protection
   - Prevents transient signature movement from collapsing the gameplay camera to a tiny zoom.
   - Adds finite-value and zoom-range guards so a malformed/transient camera value cannot make the game view disappear.

No Fire Hero reference images are loaded or used as in-game sprites.


UPDATE: SUPER CAMERA FIX
The camera-collapse protection is now applied specifically while any super is active. Super execution preserves the last stable camera zoom, sanitizes fighter coordinates used by camera math, and prevents transient super knockback/position spikes from feeding the fit-zoom calculation. Signature camera behavior is otherwise unchanged.
