ELEMENT 6 — STAGE EDITOR BACKDROPS / CAMERA / KO PERIMETER

Replace the StageEditor.jsx and stageBackdrops.js files in this package.

Included:
- Every real playable stage ID is available as a Stage Editor backdrop.
- Backdrops use the existing stageBackgrounds.js renderer, so the editor previews the actual in-game stage environment instead of a generic gradient.
- CURSOR mode: drag empty stage space to pan the Stage Editor camera only. It never changes the saved stage or gameplay camera.
- ZOOM + / ZOOM - / RESET VIEW controls for close-up editing.
- KO PERIMETER editor with four independently movable walls (left/right/top/bottom).
- Numeric wall controls plus drag handles.
- Perimeter can be disabled/removed entirely.
- killPerimeter is saved into stage_data so the setting survives stage saves.
- world-stages.sql creates/repairs the community_stages table, RLS, indexes, realtime publication, and the kill_perimeter column.

Important:
The existing match engine must read stage.killPerimeter / stage_data.kill_perimeter if the custom KO boundary is intended to affect actual matches. This patch stores the editor setting; it does not silently change the global default KO rules for unrelated stages.
