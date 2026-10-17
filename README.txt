CHARACTER DESIGN & ANIMATION REPLACEMENT PATCH

Install
1. Back up the originals.
2. Extract this archive into the project root, preserving filenames.
3. Run `npm install` once, then `npm run build`.

Included
- renderer.js — reference-style blank round head; narrow rounded limb skeleton; distinct directional fight poses; emotes; running, jumping, hitstun; sports action states; shared joint locations for attachments.
- cosmetics.js — every accessory reads the same body pose including attack data; slim fitted clothing; sleeves split between shoulder/elbow/hand; pants linked hip/knee/foot; armguards, shoes, gloves and kits anchored to limbs.
- sportDraw.jsx — sport body, slim jersey overlay, connected sleeve geometry and sports action pass-through.
- VolleyballGame.jsx — separate bump/set/spike/dive states.
- DodgeballGame.jsx — timed throwing pose and hitstun priority.
- SoccerFighter.jsx, OnlineSoccerFight.jsx — active soccer attacks drive the kick pose and propagate attack progress to gear.
- fighter.js, attackSpecs.js, botAI.js — taller slim body collision dimensions for authored hitboxes, fallback hitboxes, and CPU evasive targeting.
- PlatformFighter.jsx, TeamMode.jsx, StoryBattle.jsx, StoryBattle-3.jsx, RollbackOnlineFight.jsx, OnlineFight.jsx, CustomRoomGame.jsx, CustomBattle.jsx, BattleRoyaleEngine.jsx — attack progress passed to accessory rig in combat modes.
- BangerGame.jsx — active hitter uses a volleyball spike pose.
- PlatformFighter.jsx — training hurtbox overlay uses the same 28×92 geometry and foot-aligned center as gameplay. 

Design
The fighter body uses a plain solid head without eyes or head highlights, slender continuous rounded arms/legs connected through elbow/knee bends, and preserves each character's base color. Accessory/clothing colors are retained as designed. Sports jersey is kept close to the slim silhouette.

Verification performed in this environment
- Node syntax checks for JavaScript modules.
- TypeScript parser syntax checks for JSX files.
- Archive integrity check.
- Full Vite build could not be run because project dependencies are not installed in this environment (`vite` command unavailable). Visual in-game QA remains necessary after install.
