# Fire Hero frame-accurate native rebuild

This replacement does not use the supplied frame sheet as in-game artwork. The sheet is used as the animation blueprint and the attack is recreated with native Canvas drawing and native fighter poses.

Reference sequences:
- Up Signature: raise arm -> fire surrounds hand/forearm without becoming a sleeve -> fire detaches and launches upward -> fire dissipates.
- Down Signature: dark ember starts in front -> drops straight to feet -> radial fire-line burst -> dissipates.
- Side Signature: prepare elbow -> fire surrounds elbow -> elbow strike/impact -> dissipates.
- Up Heavy: both hands raise -> fire wheel forms above -> wheel connects -> wheel breaks into separate fire pieces.
- Down Heavy: crouch/touch ground -> radial fire lines erupt beneath -> eruption continues -> fades.
- Side Heavy: extend hand -> fireball grows around hand -> detached fireball launches forward -> dissipates.
- Super: fists gather fireball -> compress/grow -> drive forward -> detached projectile travels -> large radial explosion -> recovery.

Timing is 3.5x the previous 3x reference-frame timing: 4-frame moves = 42 game ticks, 6-frame down heavy = 63 ticks, 7-frame super = 74 ticks. Fire Hero bypasses the generic Gen-I duration clamps so these timings are actually honored.

Hitboxes are authored per attack phase and only cover the visible fire effect. Knockback uses the corresponding directional profile.
