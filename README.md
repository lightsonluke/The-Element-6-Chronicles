# Element 6 — Soccer Offline Pause Visibility Fix

Replace `SoccerFighter.jsx` with the included file.

Fixes the actual layering problem that caused the Soccer offline Pause button and pause overlay to sit BEHIND the fixed match canvas (`z-index: 40`).

Changes:
- Soccer match root is now the shared full-screen match viewport.
- Pause (ESC) button is fixed in the top-left with z-index 100.
- Countdown is above the match but below pause controls.
- PauseMenu is placed in a full-screen z-index 110 wrapper, so the overlay and its buttons are above the match canvas.
- Winner/end screen is above the match canvas.
- Reconnect overlay remains above everything gameplay-related.
- Existing pause state, ESC/P keyboard behavior, quit behavior, tournament behavior, and game simulation are preserved.

No character, soccer physics, AI, scoring, or match rules were changed.
