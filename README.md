# Element 6 — Global Pause Layer Fix

This package fixes a stacking-context problem where the gameplay/match layer can remain above the pause menu after clicking Pause (ESC).

## Architecture

Pause controls are rendered through React portals directly into `document.body`, outside the match viewport's stacking context. This makes the order unambiguous:

1. Match/gameplay rendering
2. Normal gameplay overlays
3. Pause overlay/menu
4. Pause button

The pause menu and pause button therefore cannot be trapped underneath a transformed/canvas/overlay match container with its own stacking context.

## Affected components

BattleRoyaleEngine.jsx
CustomRoomGame.jsx
DodgeballGame.jsx
GCMatch.jsx
OnlineSoccerFight.jsx
OnlineSportsMatch.jsx
PlatformFighter.jsx
RollbackOnlineFight.jsx
SoccerFighter.jsx
PauseLayerPortal.jsx
index.css

Only replace these files from this package. No new pause button is added to modes that did not already have one.
