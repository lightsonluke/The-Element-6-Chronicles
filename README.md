# Element 6 Story Mode - Runtime Recovery Replacement

Replace only the files in this package; do not replace unrelated game files.

## Fixes included
- Removes the malformed player X-collision expression that could break the Story Mode build.
- Makes keyboard input more robust by tracking `KeyboardEvent.code` aliases and focusing the match canvas when interacted with.
- Preserves normal Element 6 playable character rendering.
- Adds bounded ambient wildlife spawning near the player so a new save is not visually empty.
- Adds lightweight wildlife movement and rendering without changing the main character art.
- Rebuilds the minimap around the authoritative procedural terrain height, then overlays terrain, water/lava samples, villains, wildlife, and the player marker.
- Keeps entity counts bounded and removes distant ambient entities to avoid runaway performance costs.

## Important
This package is a targeted Story Mode replacement. It does not intentionally replace authentication, shop, multiplayer, matchmaking, or unrelated game modes.
