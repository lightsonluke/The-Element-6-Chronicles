# Element 6 Character Design Files

This is a small overlay for the supplied Element 6 project. Copy these files into the project root and replace the existing files with the same names.

## Included

- `characterPainter.js` — builds a clear, cel-shaded side-view sprite atlas for each roster entry and selects the matching pose at runtime.
- `characterVisuals.js` — per-character hair, clothing, footwear, accessory, palette, and movement-style definitions.
- `stickman.js` and `renderer.js` — route the existing visual state into the matching authored pose. Physics, collision, hurtboxes, abilities, and combat values remain with the game.
- `CharacterDesignPreview.html` — roster gallery showing idle, two run poses, dash, wall slide, jump, landing, and attack poses. Serve it from the project root so the game's ES modules can load.

The sprite art preserves each character's established exposed body color. Every hand is a simple rounded stump with no fingers or thumbs.
