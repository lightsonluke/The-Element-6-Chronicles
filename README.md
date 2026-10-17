# Element 6 — Stage-Layer and Jump-Through Repair

Replace these three files at the **root of your GitHub repository**:

- `renderer.js`
- `fighter.js`
- `botNavigation.js`

This package does two focused things:

1. Removes the added floating stage-island layer by restoring the normal stage renderer. The included `renderer.js` contains no `drawPlatformIsland` code.
2. Makes normal elevated 18–20px stage platforms one-way, so fighters can jump up through a platform about the size of an ordinary random-stage platform. The wide lowest floor stays solid. The same shared `fighter.js` runs offline, LAN, custom rooms, and rollback simulations; bot jump prediction is updated too.

Do not rename or nest the files. Upload the files themselves, choose **Replace**, then commit and wait for GitHub Pages to finish deploying.

## About the requested bespoke combat art

This is deliberately not presented as an all-character illustrated-art replacement. The project currently renders attacks in Canvas and has no supplied character-by-character attack sprite set. A genuine replacement needs separate authored frames/assets for every character, move phase, construct, and orb state; it should be built and reviewed in batches rather than falsely claiming generic effects are unique artwork.
