WATER HERO — FLUID FRAME / LIMB / PERFORMANCE PATCH

Purpose:
- Rebuilds all Generation I Water Hero attack visuals as native Canvas animation based on the supplied frame-by-frame sheet.
- Uses flowing/tapered water bodies, internal highlights, spray, droplets, rings, ribbons, crescents and spheres.
- No reference image is loaded or used as a sprite.
- Adds attack-synchronized body/limb poses for Gen I characters, with lead-limb selection based on facing direction.
- Reduces Water attack lag by removing repeated expensive shadowBlur calls from the Water rendering path.
- Keeps canvas transforms protected with save/restore in Gen I attack rendering.
- Preserves the third-party hit cancellation/idle reset changes in fighter.js.

IMPORTANT:
- Do NOT replace renderer.js with an older Water patch after installing this package.
- The JSX files included here are the battle render callsites that pass live attackData into the character renderer so limb poses can follow the current move.

Replace the matching files in the project with these files.
