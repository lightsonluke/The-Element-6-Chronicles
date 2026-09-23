# Element 6 — Freehand / Stages / Tutorial / Training Upgrade

Targeted replacement package built from the supplied Element 6 project.

## Fixes

### Freehand stage crash protection
- Sanitizes freehand points for finite numeric coordinates.
- Bounds extreme coordinates and limits freehand point/collision workloads.
- Match runtime rebuilds freehand collision geometry from safe strokes.
- Match renderer no longer feeds unsafe raw freehand point arrays directly into the renderer.
- Stage Editor thumbnails and World Stages thumbnails safely render malformed/large freehand data instead of crashing.
- Existing continuous freehand slope collision behavior is preserved.

### See Stages crash protection
- Saved-stage thumbnails validate platform coordinates before canvas drawing.
- World Stage thumbnails are wrapped in a safe renderer fallback.
- Freehand thumbnails are bounded/sanitized.

### Tutorial
- Keeps the hands-on tutorial flow but makes the curriculum explicit in the start screen.
- Tutorial remains a non-attacking practice dummy and tracks movement/combat lessons.

### Training Mode
- Training-only control overlay.
- Dummy / Mimic / Mirror behavior.
- Repeat Jump dummy behavior.
- Frame history with frame-back/frame-forward controls.
- Pause without opening the normal pause menu.
- Damage reset by timer or after 3 seconds grounded/quiet.
- Position reset using a captured position, by timer or after 3 seconds grounded/quiet.
- Direct P1/P2 character selectors in the training overlay.
- Stage selector remains available before starting.

### Hitboxes setting
- Adds Settings -> Gameplay -> Hitboxes.
- OFF by default unless enabled.
- Fight renderer shows fighter body boxes, active attack/super boxes, stage hazard boxes, and stage item boxes.

## Validation

TypeScript parser validation was run on every modified JS/JSX file in this package and returned zero parse diagnostics.

A full Vite production build was not run because the supplied project does not contain installed node_modules in this environment.
