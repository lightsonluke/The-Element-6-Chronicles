# Element 6 — Freehand Crash Fix ONLY

This replacement is intentionally limited to freehand-stage stability.

Files: StageEditor.jsx, PlatformFighter.jsx, fighter.js, StagePreview.jsx

It does NOT modify clips, clip recording/downloading, camera editor settings, camera runtime, leaderboards, bots, CTF, volleyball, soccer, or any other feature.

Fixes:
- Sanitizes malformed/non-finite freehand points.
- Bounds freehand point counts while preserving endpoints.
- Bounds generated freehand slope collision segments.
- Keeps x1/y1/x2/y2 continuous slope collision.
- Prevents giant strokes from producing thousands of per-frame collision checks.
- Bounds freehand rendering in matches and preview so a giant saved stroke cannot lock/crash the renderer.
- Preserves existing slope/rolling behavior.
