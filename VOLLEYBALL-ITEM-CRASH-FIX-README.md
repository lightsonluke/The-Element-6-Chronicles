# Element 6 — Volleyball + Stage Item Crash Fix

This replacement patch addresses the two reported issues:

1. **Volleyball canvas drifting to the bottom-right:** Volleyball now marks the shared canvas portal as `gameMode="volleyball"`, and the CSS gives that canvas a dedicated fixed viewport anchor centered at 50%/50%. This bypasses surrounding flex/transform layout changes after mount.

2. **Custom Stage items crashing matches:** `sandboxHazards.js` had a runtime bug in the stage-material collision loop: it used `hw`/`hh` before those values were declared. That means a custom stage with any playable item could crash as soon as item physics ran. The patch declares safe item half-extents before the loop and validates platform coordinates. `stageHazards.js` also sanitizes custom item type/position data before constructing gameplay objects.

Replace the matching files from this patch in the project. No other gameplay systems are intentionally changed.
