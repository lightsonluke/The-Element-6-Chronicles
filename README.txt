THE CHRONICLES — BACKDROP + SPLIT CITY PATCH

Install
1. Back up the current project.
2. Copy this folder's contents into the game project root, preserving folders and replacing the listed source files.
3. Keep the supplied public/assets/e6-home-menu-background.png at that exact path. It is the cherry-blossom city image already used by the main menu and now also sits behind the app's other screens.

Included implementation
- One app-wide cherry-blossom wallpaper layer behind screens.
- Rebuilt Split City stage visuals from the supplied city backdrop, main platform, and secondary platform PNGs.
- Exactly two Split City collision rectangles. Their horizontal spans and top lines use the black strokes in the provided collision-reference PNGs: main platform x=82..2055, y=205..214 of the 2137x736 image; drop-through x=117..1723, y=280..289 of the 1840x855 image. The lower decorative artwork has no collision hulls.
- The secondary platform is one-way and supports down+jump drop-through using the existing fighter collision rules.
- Blossomed City is added to the existing Fight & Sports Music settings list and is forced for matches using the Split City stage. Local fight, online fight, rollback fight, Custom Battle, and fight Custom Room paths pass their stage ID into music selection.
- Custom Room stage selection now carries the selected built-in stage ID through to match rendering.

Files in this patch
Game.jsx, index.css, PlatformFighter.jsx, renderer.js, stageBackgrounds.js, stageMaterials.js, music.js, CustomBattle.jsx, OnlineFight.jsx, RollbackOnlineFight.jsx, CustomRoomGame.jsx, CustomRoomLobby.jsx, rollback/element6Simulation.js, and the required public assets.

Scope status
This patch does NOT implement the larger networking and redesign requests: party sports sessions, active-match host migration, Custom Room sports renderers, deterministic frame-perfect rollback across modes, or a bespoke rebuild of every screen. The current project has no complete shared sports-room simulation or trusted deterministic simulation layer to extend safely in this asset/UI patch. Those items remain unfinished; this package does not claim otherwise. No SQL migration is needed for these changes.

Verification
The supplied images and MP3 were copied as runtime assets and their file formats were checked. Source changes were manually reviewed. A production build was not run.
