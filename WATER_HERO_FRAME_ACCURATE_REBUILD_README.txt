WATER HERO — FRAME-ACCURATE NATIVE ANIMATION REBUILD

This patch rebuilds the Generation I Water Hero from the supplied frame-by-frame
blueprint. The blueprint is used only as a visual specification; no reference
image is loaded or drawn by the game.

Moves rebuilt:
- Up Signature: 4 reference frames — hand ring -> separation -> curved travel -> fade.
- Down Signature: 4 reference frames — crouch -> twin rising splashes -> peak -> recovery.
- Side Signature: 4 reference frames — arm extension -> short whip -> upward curl -> dissipation.
- Up Heavy: 4 reference frames — vertical water ribbon -> twist -> spiral -> upward launch.
- Down Heavy: 4 reference frames — floating sphere -> kick/downward movement -> ground burst -> upward burst.
- Side Heavy: 6 reference frames — crescent forms -> grows -> sweep -> rotation -> spray/fade.
- Super: 7 reference frames — gather -> sphere -> rapid spin -> collapse/explosion -> outward ring -> upward-biased launch -> final ring.

All effects are native Canvas geometry: curves, arcs, tapered water streams, droplets,
spheres and rings. They are continuously interpolated between the reference frames so
the result is actual motion rather than a sequence of screenshots.

Collision geometry was rebuilt to follow the moving water effects. Water Up Signature
uses the moving ring; Down Signature uses two independent splash hit regions; Side
Signature uses the whip tip; Up Heavy follows the ribbon; Down Heavy has the sphere/ground
hit followed by the upward burst; Side Heavy follows the crescent blade; Super uses the
collapsing/outward ring.

Knockback profiles were adjusted to match the reference descriptions, including the
split left/right Down Signature and the two-stage Down Heavy.

Also included: universal attack cancellation when a fighter is hit during an attack or
charge, so interrupted attacks cannot leave a running/attack animation stuck.

Do NOT replace renderer.js with this patch. No camera/zoom code was changed.
