# Full non-home UI redesign

This is a change-only package for the attached game source, not a full game copy. The Home Menu is the only screen excluded from the redesign system. Character selection screens are included in this update.

## What changed

- Applied a new shared visual system to every screen routed through `Game.jsx`: softened layered surfaces, rounded cards and panels, pill-shaped controls, consistent focus feedback, responsive spacing, and clearer type hierarchy. The common styling also covers in-game menus, popups, overlays, notifications, and results while preserving their existing layouts and actions.
- Rebuilt Settings as a responsive two-column control room with a section navigator. Audio, profile, music, CPU, match history, gameplay, controls, display, theme, social, and online settings retain their existing settings keys and handlers.
- Redesigned the active fighter, story, and Shapeshift selection screens to use the shared style. Character choices, unlock rules, filters, equipment, match settings, and start actions are preserved.
- Rounded the Shop storefront and Battle Pass season hub, including their panels and item/reward cards. Their purchase, ownership, claim, equip, progress, and navigation flows remain connected to the existing systems.
- Updated app loading, account forms, daily reward dialogs, global notifications, clip notices, and pause portals to match the shared rounded treatment.

The Home Menu remains outside the shared UI wrapper, so the new visual rules do not alter its layout. The game’s data, progression, networking, and gameplay handlers remain in their existing components.

## Included gameplay updates

- The active roster super renderer no longer darkens the stage or draws a viewport-wide flash rectangle. Other super renderers avoid full-screen color washes; localized effects retain the stage background.
- Purple's requested side-heavy, down-heavy, and up-signature endlag values match Itto's corresponding values.
- The package carries the earlier responsive gameplay viewport and compact HUD changes.

## Scope and verification

- Gameplay viewport sizing retains each mode's logical canvas and world bounds; camera-aware world expansion is still needed to guarantee every stage detail stays visible on every aspect ratio.
- Existing emote and accessory art has not been replaced with bespoke character-by-character designs across Generations I–V.
- The paid-pack checkout remains unavailable in the existing game and is still presented as unavailable.
- Bundled production output is omitted. No build or tests were run for this update.
