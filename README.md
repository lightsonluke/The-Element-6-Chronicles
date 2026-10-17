# Element 6 — Vector Sprite Artwork Production Pack

Copy every file in this package to the root of your current Element 6 project and let GitHub replace the matching files.

Files:

- `renderer.js`
- `resonanceConstructs.js`
- `vectorMoveArtwork.js` (new)

## What this is

This is an **additive Canvas-vector sprite layer**, not a random PNG generator. It is tied to the exact same `drawStickman` renderer used for your characters. Attack artwork gets the current character colour, facing direction, move progress, range, and authored move shape from the game data.

It has distinct detailed motifs for fire, water, ice, grass/nature, thunder, void/portal, blade, scythe, hammer, spear, and trident attacks. The marks are made from layered polygons, curved paths, shards, highlights, and impact flecks. The existing detailed construct weapons and resonance orb remain intact.

## Safety

- It does **not** alter attack damage, hitboxes, knockback, timing, or movement.
- Collision remains in `attackSpecs.js` and `resonanceConstructs.js`; visuals cannot create a hit.
- Since fights, rollback online fights, LAN, custom rooms, and Battle Royale use the shared renderer, the art layer appears everywhere that uses normal fight rendering.

## Important limitation

This is real code-native vector artwork, but it is not a replacement for 50 separate hand-painted sprite sheets. If you later want hand-drawn raster frames, those need to be authored as a separate asset set using the existing character designs as reference.
