ELEMENT 6 — STAGE EDITOR SELECT/BALL + WORLD SCORE PATCH

Replace only the files in this package. Run the included SQL once in Supabase.

STAGE EDITOR
- Adds SELECT next to ADD (drag).
- Drag a marquee around platforms, hazards and items to multi-select them.
- Drag any selected member to move the entire selection together.
- COPY/PASTE buttons and Cmd/Ctrl+C / Cmd/Ctrl+V are supported.
- Cmd/Ctrl+A selects every platform, hazard and item while SELECT mode is active.
- Pasted entities receive an offset so they do not exactly overlap the originals.
- Platform motion editor supports the existing motion plus ONE-WAY and a second independent motion channel.
- Motion distance remains compatible with the existing editor/runtime data.

BALL
- Adds a Ball item to the Stage Editor.
- Red, character-sized physics ball (64px).
- Gravity, bounce, friction, platform/material collision, object collision and hazard interaction are supported.
- Attacks can push the ball through the existing object-hit system.
- Ball does NOT collide with characters or damage them.

WORLD SCORES
- Parkour, Zipline and Rock Climbing already call submitWorldScore in the supplied source; the included SQL makes the shared element6_world_scores table/RPC authoritative for those three modes.
- Parkour and Zipline keep the highest score; Rock Climbing keeps the lowest completion time.
