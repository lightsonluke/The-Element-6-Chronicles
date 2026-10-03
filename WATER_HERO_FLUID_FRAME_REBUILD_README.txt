WATER HERO — FLUID FRAME-BY-FRAME NATIVE REBUILD

This package replaces the previous Water Hero animation implementation.

Design target:
- Follow the supplied Water Hero ALL ATTACKS frame sheet as the visual blueprint.
- Recreate the water natively with Canvas curves, layered translucent bodies,
  bright inner streams, tapered ribbons, droplets, spray, rings, spheres and
  crescents. The reference images are NOT loaded or displayed by the game.
- Preserve the character's normal renderer/camera.

Moves rebuilt:
- Up Signature: low hand ring -> upward swing -> detached ring -> curved launch path.
- Down Signature: crouch/puddle -> two separate rising splash sheets -> dissipating spray.
- Side Signature: short hand-launched water whip -> upward-curled tip -> flowing droplets.
- Up Heavy: body-wrapping ribbon -> twisting spiral -> upward/outward launch and spray.
- Down Heavy: floating sphere -> downward kick -> ground contact -> concentrated upward burst.
- Side Heavy: large crescent water blade -> sweep/rotation -> breakup spray.
- Super: gathering sphere -> rapid rotation -> expansion/collapse -> outward ring -> final ring/launch.

Animation behavior:
- Each move is continuously animated between its reference keyframes.
- Water has internal highlight flow and detached droplets so it reads as liquid,
  not as a static neon shape.
- Existing hold/charge and attack interruption logic from the current Water build is preserved.
- No renderer.js changes are included in this rebuild.
