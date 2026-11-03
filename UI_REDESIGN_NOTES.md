# UI redesign update notes

This is a change-only package for the attached game source, not a full game copy. The Home Menu and actual Character Selection Menus remain excluded.

## Shop and Battle Pass rebuild

- Rebuilt the Shop screen around a dedicated storefront: grouped category rail, token wallet, clear category context, and a responsive item catalog. Existing categories, previews, ownership states, currency checks, purchase callbacks, equip actions, and confirmation behavior remain wired to the game's existing data and handlers.
- Shop accessory and sport-kit previews can be selected by mouse, keyboard, and controller focus. The catalog adapts to compact screens with horizontally scrollable category navigation.
- Rebuilt the Battle Pass as a season hub with an event showcase, progress meter, free/premium lane distinction, and side-by-side reward cells for each tier. Claim, claim-all, tier eligibility, claimed state, Battle Pass+ rewards, next-event countdown, and Equip navigation continue to use the existing game state and callbacks.
- Reward previews animate only while visible to reduce work while browsing the 50-tier horizontal track. The paid-pack checkout remains marked unavailable because the existing game does not have a connected checkout flow; no purchase is presented as successful.

## Other included UI and gameplay changes

- The active roster super renderer no longer darkens the stage or draws a viewport-wide flash rectangle. Other super renderers avoid full-screen color washes; localized effects retain the stage background.
- Purple's requested side-heavy, down-heavy, and up-signature endlag values match Itto's corresponding values.
- The existing change-only bundle retains the earlier responsive gameplay viewport, HUD, non-exempt menu, settings, and mode-browser changes.

## Scope and verification

- Gameplay viewport sizing retains each mode's logical canvas and world bounds; it does not expand every mode's camera-aware world bounds.
- Existing emote/accessory art has not been replaced with bespoke character-by-character designs. Authentication screens outside the active Game.jsx shell were not changed.
- Bundled production output is omitted. No build or tests were run for this update.
