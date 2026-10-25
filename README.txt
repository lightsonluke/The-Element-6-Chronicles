ATTACK SPEED + HOLD + COOLDOWN BAR UPDATE

Replace these files in the root of The-Element-6-Chronicles-main:
- fighter.js
- renderer.js
- PlatformFighter.jsx
- GCMatch.jsx

Changes:
- Speeds up the existing attack animations by shortening attack lock time while keeping the hand-authored move art.
- Fire Hero's custom attack animations are noticeably faster without replacing their choreography.
- Removes the extra heavy/signature cooldown lockout; attack duration/endlag is now the limiter.
- Removes the small signature/heavy cooldown bars beneath fighters in the main fighter match and GC match renderers.
- Removes the old red sword-sweep guide line while keeping the actual sword animation.
- Adds a grounded attack hold for all characters: hold a grounded signature or heavy for up to 4 seconds; release to fire early, or it auto-fires at 4 seconds. A small colored ring above the fighter shows charge progress. Held attacks have no hitbox.
- Aerial attacks are never charge-held and execute immediately.
- Heavy alone selects Up Heavy when the fighter has one; Left/Right + Heavy selects Side Heavy; Down + Heavy on the ground selects Down Heavy; Down + Heavy in the air remains Ground Pound.

Validation:
- Node syntax checks passed for fighter.js, renderer.js, and attackSpecs.js.
- Confirmed the signature/heavy cooldown bars are absent from PlatformFighter.jsx and GCMatch.jsx.
- A full app build was not run because project dependencies are not installed in this runtime.
