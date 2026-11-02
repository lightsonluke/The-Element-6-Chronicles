# UI redesign implementation notes

This package updates the attached game source. The Home Menu and every Character Selection Menu retain their existing visual designs.

## Completed in this pass

- Gameplay canvases in the shared match host, Volleyball host, Platform Fighter, and Story Mode now resize to the viewport at device pixel ratio and use a uniform camera transform. The entire logical scene stays visible without stretching; any extra aspect-ratio space is filled by a low-resolution, blurred extension of the current scene. Resize, orientation, and visual-viewport changes refresh the canvas and camera metadata.
- Each active canvas exposes `__e6Viewport` dimensions, visible world bounds, and client-to-world/world-to-client coordinate helpers. Existing simulation coordinates and collision bounds are preserved.
- Emote posing now uses each roster character's canonical powers, personality clues, speed, generation, and weapon family. Emotes ease through neutral at their start and end. Accessory anchors use the same character-aware pose solver, and battle renderers pass their active emote into the accessory layer.
- Character-exclusive headbands, gloves, shoes, capes, and sports kits are generated for the Generation I–V roster. Their marks, trim, motion phase, colors, and pose accents use the intended character's palette, power motif, generation, and canon profile.
- Standalone Login, Register, Forgot Password, Reset Password, account panel, and restricted-access states use the shared Element 6 auth treatment, including focused form controls and mobile spacing. Authentication operations and route behavior remain intact.
- Routed non-home, non-character-select screens share the refreshed visual system for panels, controls, tabs, focus, and responsive spacing. This pass gives the Shop a storefront layout, Settings a grouped control-room layout, and the fight-mode browser large categorized tiles while preserving the existing callbacks and purchase flows.
- Fight HUD rows now show a large stock numeral inside a character-colored circle, with the numeral interpolating from white through green, yellow, red, and deep maroon as damage rises. The visible “STK” label is removed. Unlabeled super (yellow) and power (character-colored) bars sit beside each character name, with super above power. Online and custom-room snapshots carry the power cooldown values needed to draw the remote player's bar accurately.
- Super move screen-wide color washes and the freeze sweep rectangle are removed. The super callout is smaller and transparent, and the remaining impact cue is local to the fighter. Signature recovery adds three frames after the authored signature animation.

## Rendering scope

The adapter keeps each mode's existing logical canvas size and gameplay world bounds. It fits that complete rendered view into the browser viewport and fills the remaining area with a scene-derived backdrop; it does not reveal terrain outside a mode's existing camera/world bounds. Physics and stage boundaries are unchanged. Pointer coordinate conversion is exposed for renderers that need to map screen input into the logical world.

The bundled `dist/` output is omitted from the changed-files package. No build or tests were run in this pass. This update does not replace the roster's existing emote/accessory artwork with bespoke character-by-character designs, and it does not change authentication components that are not routed by the current `Game.jsx` shell.
