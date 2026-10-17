# Element 6 — Hitbox and Knockback Calibration Pack

Replace these files in the root of your repository:

- `renderer.js`
- `fighter.js`
- `resonanceConstructs.js`
- `attackSpecs.js`
- `vectorMoveArtwork.js`

## What is calibrated

### Normal, aerial, and power attacks

The visible extended limb effect and its collision now come from the same shared vector-contact data:

- Jab: capsule attached to the visible fist.
- Aerial: capsule attached to the visible boot.
- Power burst: capsule through the visible palm plus a small visible burst circle.

The hit window is only frames 22%–66% of the animation. Wind-up and recovery cannot hit. Knockback now follows the actual contact direction: forward for jab/palm, up-forward for aerials, and down-diagonal for ground-pounds.

### Special/heavy attacks

The existing `attackSpecs.js` geometry remains the authority for their visible path, contact, and knockback profile. The vector-art layer is drawn using the same move shape/range/color data.

### Resonance constructs

`resonanceConstructs.js` already calculates collision from the exact transformed construct-weapon pose (weapon edge, tip, or grab point) and then applies weapon/slot-specific knockback. This package preserves that exact construct system; it does not replace it with oversized fighter-centred boxes.

This is shared fighter code, so the same calibrated collision is used by offline fights, LAN, custom rooms, rollback online fights, Battle Royale, and other modes that use `fighter.js`.

## Included platform safeguard

The replacement `fighter.js` also keeps the previous platform repair: ordinary elevated 18–20px platforms are jump-through, while the broad lowest stage floor and combat-created walls remain solid.
