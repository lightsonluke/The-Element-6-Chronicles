# Element 6 — Gameplay / Stage / Clips / Bot Fix Package

This is a targeted replacement package. It is intended to be applied over the current Element 6 project after the previously supplied complete-fix package and bot packages.

## Fixed in this package

### Clips
- Clips recording only initializes when `settings.enableClips === true`.
- Downloaded WebM clips are no longer mislabeled as `.mp4`.
- Clips screen can open a local video file directly in the browser.
- Clips screen can start/stop browser-native screen recording when Clips are enabled.
- Browser screen recording uses `getDisplayMedia` and saves a native WebM clip to the existing local clip store.

### Stage / Freehand / Camera
- Freehand rendering sanitizes malformed points and avoids `Math.min(...hugeArray)` argument-limit crashes.
- Very dense freehand input is de-duplicated/capped when converted to collision segments.
- Bot pathfinding ignores generated freehand micro-segments so a large drawing cannot create an O(n²) navigation explosion.
- Match camera zoom is normalized and stage-camera motion is guarded against malformed motion data.
- Freehand rendering errors are isolated instead of crashing the match.
- Stage preview payload is sanitized before rendering.

### Capture the Flag
- AI/input and fighter/projectile updates are guarded so malformed state cannot take down the match loop.
- CTF inputs are normalized before entering the shared fighter engine.

### Volleyball
- Spike contact validation is safer and uses the actual airborne state.
- CPU 1v1 and 2v2 bots can actually execute spikes after sets.
- CPU set decisions are enabled again.
- Bot aerial spike timing and contact are retained.
- Character/element lookups have safe fallbacks.

### Dodgeball
- CPU throws now calculate a predicted opponent position and aim at it.
- Throw trajectories use the predicted target position instead of always firing horizontally.
- Higher difficulty produces tighter aim while lower difficulty retains controlled inaccuracy.

### Fight bots
- Corrected multiple reversed attack-facing directions.
- Close-range attack openings are no longer discarded by random attack rolls.
- Close-range bots prioritize actual attacks before optional power usage.
- Normal-attack fallback now maps to a real signature attack instead of an unused `normal` input.

### Soccer
- Bot attack/defense direction is now based on the fighter's assigned team, not its current x-position.
- Crossing midfield no longer causes the bot to suddenly switch which goal it considers its own.
- Defensive and offensive positioning therefore remain consistent after side switches.

### Vertical bot navigation
- Navigation replans when a bot lands on an intermediate platform.
- Stale routes no longer keep a bot trying to reach a target from the wrong platform.
- Downward navigation has a safer edge/drop fallback.
- Up/down pathfinding remains physics-aware.

## Validation
- JavaScript files were checked with `node --check`.
- Modified JSX files passed delimiter/balance validation.
- A full Vite build was not run because the source package does not include installed `node_modules` in this environment.
