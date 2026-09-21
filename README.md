# Element 6 Freehand Stage Editor Crash Fix

Targeted fix only for the freehand-stage/editor crash.

- Preserves the existing camera zoom/motion implementation unchanged.
- Prevents huge/invalid freehand point arrays from freezing or crashing the Stage Editor.
- Safely decimates only the render/collision representation of extremely large strokes; the saved original stroke data is not rewritten here.
- Keeps freehand collision as continuous slope segments (`x1/y1/x2/y2`), not square blocks.
- Prevents `Math.min(...points)` / `Math.max(...points)` argument-stack crashes during freehand rendering.
- Stage preview also bounds only its rendered point list.

Replace the three files at the project root.
