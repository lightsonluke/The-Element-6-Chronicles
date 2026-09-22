# Element 6 — Freehand Crash + Friend Chat Fix

This is a targeted replacement package. It intentionally changes ONLY the files needed for:

1. Freehand stages crashing the game.
2. Friend direct chat failing with `permission denied for table users`.

It does NOT change camera motion/zoom, clips, volleyball, bots, leaderboards, clans, notifications, or any other feature.

## Freehand fix
- Bounds freehand render paths to 512 valid points while preserving the first/last points.
- Removes the unsafe `Math.min(...points)`/`Math.max(...points)` spread operation that can throw on very large strokes.
- Sanitizes invalid/non-finite points.
- Caps freehand collision geometry to 1,200 continuous slope segments per stage.
- Rebuilds legacy stages from their saved `freehandStrokes`, so old stages containing thousands of `_freehandSegment` objects are safe too.
- Keeps freehand as continuous line/slope collision; it is not converted into square blocks.
- Preserves the existing rolling/slope physics.

## Friend chat fix
Run `sql/Supabase-friend-chat-permission-fix.sql` in Supabase.
The broken policy queried `auth.users` from RLS. The new policy does not query `auth.users`; the existing foreign key validates the recipient instead. Friend-only direct chat remains friend-only.
