ELEMENT 6 PLATFORM FIGHTER — COMPLETE ACCESSORY + HIT-REACTION UPDATE

PACKAGE CONTENTS
- PlatformFighter.jsx
  Passes the impact-side signal from each fighter into the procedural stickman rig.
- fighter.js
  Records whether a confirmed hit came from the defender's front or back.
- stickman.js
  Adds a separate directional hurt response for front/back impacts while preserving the existing launch/knockback poses.
- cosmetics.js
  Replaces the active accessory painter with the redesigned art system. The redesign covers clothing and sports kits, Japanese-inspired outfits and props, headwear and masks, jewelry, hand/arm/leg gear, capes and wings, auras, and character-specific elemental effects. Accessories use consistent silhouettes, layered outlines, seams, highlights, material accents, and motion-reactive effects.

INSTALL
1. Back up the four matching files in your game project.
2. Replace those four files with the files from this package.
3. Keep the rest of your project and its existing dependencies in place.

VALIDATION PERFORMED
- JavaScript syntax checks passed for cosmetics.js, fighter.js, and stickman.js.
- The redesigned accessory painter was smoke-tested against 147 accessory type values with a mock canvas context; no drawing exceptions occurred.
- PlatformFighter.jsx was updated by a single object-property addition; a full browser build was not available in this source-only workspace because the project's package/dependency tree and imported renderer files were not supplied.

The hit-reaction change is visual only: it does not change damage, hitboxes, or knockback physics.
