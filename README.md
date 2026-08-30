# Element 6 replacement package

Copy the files in this folder into the root of the Element 6 repository and replace the existing files with the same names.

## Included fixes

- Match views use a unified full-viewport match surface instead of behaving like a scaled card/overlay. Pause, reconnect, countdown, and match-end UI are kept above the actual gameplay canvas.
- Offline/online fight and sports scenes use the same complete built-in match music library.
- Soccer uses the same full match music library instead of a small hard-coded subset.
- Settings exposes the complete match music library through the existing music selector.
- Token/coin glyphs use IconScout Unicons through the existing `@iconscout/react-unicons` dependency, with a fixed inline icon box so icons stay aligned with text.
- Match overlays receive a dedicated stacking class so ending and pause screens remain clickable and visible.

## Files

- GameIcon.jsx
- music.js
- Settings.jsx
- index.css
- PlatformFighter.jsx
- SoccerFighter.jsx
- OnlineFight.jsx
- OnlineSportsMatch.jsx

## Icon source

The token icon uses IconScout's Unicons React package already present in the repository. This avoids hotlinking a watermarked marketplace preview into production.

Before shipping, make sure the repository's existing IconScout/Unicons dependency and its applicable license terms remain valid for your distribution.
