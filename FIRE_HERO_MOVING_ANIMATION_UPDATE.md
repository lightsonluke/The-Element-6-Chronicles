# Fire Hero — Moving Animation Update

This replacement uses the frame-by-frame reference as the motion/design blueprint, but renders the attacks with the game's native Canvas animation system. The reference images are NOT loaded by the game.

## Timing
- Fire Hero release durations remain intentionally slow: 42 ticks (4-beat attacks), 63 ticks (6-beat Down Heavy), 74 ticks (7-beat Super).
- Movement inside each reference beat is now continuously interpolated instead of snapping from one static pose/effect position to another.
- Launch/travel phases use faster eased motion while preserving the slower overall attack duration.

## Direction
- The leading raised/extended hand changes sides with facing. Facing right uses the right hand; facing left uses the left hand.
- Fire effects remain attached to the correct hand until the launch point, then travel forward/upward according to the reference.

## Reference behaviors
- Up Signature: raised hand -> irregular fire ring around hand -> fire detaches from hand -> fast upward travel -> dissipation.
- Down Signature: dark ember in front -> straight drop to feet -> radial jagged fire-line burst -> fade.
- Side Signature: elbow preparation -> concentrated elbow fire -> strike -> dissipating flame.
- Up Heavy: both hands raise -> irregular fire wheel -> wheel remains coherent -> wheel breaks into separate flame pieces.
- Down Heavy: bend/touch ground -> small contact sparks -> fire-line explosion in all directions -> sustained eruption -> fade.
- Side Heavy: hand extends -> fireball grows around/encompasses hand -> fireball launches from hand -> fast forward travel -> dissipation.
- Super: compact fireball forms between hands -> grows/compresses -> launches forward -> large irregular fire explosion -> debris/flame recovery.

## Replacement files
- `gen1AttackAnims.js`
- `renderer.js`
- `attackSpecs.js`
