# Element 6 — ONLY Requested UI/Scroll Fixes

This patch changes only:
1. Combo Trainer fight UI: Character Select button is anchored at the top-left and combo training steps are anchored at the top-center.
2. Volleyball canvas: the volleyball canvas uses a higher-specificity fixed viewport rule so later shared canvas CSS cannot move it back into normal-flow positioning; it remains centered in the browser viewport.
3. Scrolling: restores document/page scrolling by removing the fixed 100% height constraint from html/body/#root and using a minimum viewport height instead.

Files:
- ComboTrainer.jsx
- VolleyballGame.jsx
- index.css
