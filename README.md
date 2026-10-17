# Element 6 — Revert Recent Vector Animation/Hitbox Work + Remove Constructs

Replace these files at the repository root:

- `renderer.js`
- `fighter.js`
- `resonanceConstructs.js`

## This reverts

- The recent `vectorMoveArtwork.js` layer is no longer imported or used.
- The recent normal-attack limb hitboxes and vector-driven knockback are removed.
- The game returns to its existing original attack rendering and collision paths.

## This removes game-wide

- Resonance construct activation.
- All falling/hovering resonance-orb drops.
- Construct weapon art and proximity glow.
- Bot movement toward orbs.
- Construct hitboxes, including stale online state from a match that began before this update.

The shared match update clears any active construct state, which covers the core fight, Battle Royale, Capture the Flag, Grand Circuit, LAN, rollback, and custom-room paths that use the construct module.

The requested stage rule remains included: ordinary elevated 18–20px platforms are jump-through; the broad lowest floor and combat walls stay solid.
