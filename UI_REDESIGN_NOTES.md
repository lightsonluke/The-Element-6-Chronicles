# UI redesign implementation notes

This is a changed-files package for the attached game source, not a full game copy. The Home Menu and every Character Selection Menu remain excluded from the redesign.

## This update

- The active roster super renderer no longer darkens the whole stage or draws a viewport-wide flash rectangle. Other super renderers also avoid full-screen color washes; water and freeze effects use local arcs and particles. The existing stage background remains visible during supers.
- Purple's move data now matches Itto's endlag for the requested moves: side heavy 31 frames, down heavy 43 frames, and up signature 11 frames. Purple's up-signature timing was already 11 frames; that value is retained.
- Non-exempt menus have a second visual pass with flatter, compact panels, clearer hierarchy, simpler focus and button states, and less glow/gradient decoration. Shop, Settings, and mode browsers use the same cleaner competitive-fighter UI language. Existing theme colors, functionality, navigation, and purchase flows are preserved.

## Included from the prior update

- Gameplay canvases in the shared match host, Volleyball host, Platform Fighter, and Story Mode resize to the viewport at device pixel ratio and use a uniform camera transform. The complete logical scene stays visible without stretching; extra aspect-ratio space uses a scene-derived backdrop. Existing physics and stage boundaries remain unchanged.
- Character-aware emote posing and cosmetic fit handling across the existing roster, plus updates to the stock/damage HUD, bars, and pause-button placement.
- Routed non-home, non-character-select menu styling and responsive layouts.

## Scope and verification

The viewport adapter retains each mode's logical canvas size and gameplay world bounds; it does not expand every mode's camera-aware world bounds. The package does not replace existing emote/accessory art with bespoke character-by-character designs and does not alter authentication screens that are not routed by the current Game.jsx shell. Bundled dist output is omitted. No build or tests were run for this pass.
