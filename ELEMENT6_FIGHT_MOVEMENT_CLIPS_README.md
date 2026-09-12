# Element 6 — Universal Fight Movement + Clip Fix

This package adds the requested movement system to the shared `fighter.js` simulation and fixes the native in-game clip recorder.

## Files

- `movementAbilities.js` — new dash / air-dodge / wall-slide module.
- `fighter.js` — patched shared fighter physics.
- `clipRecorder.js` — patched rolling recorder.
- `useClipRecorder.js` — patched in-game clip hook.
- `GlobalClipRecorder.jsx` — patched global recorder bridge.
- `movement_features_fighter.patch` — diff showing the fighter.js changes.

## Movement rules

### Double-tap dash
- Tap a directional input twice within 12 frames (~0.20s).
- Cooldown: 60 frames (1 second).
- Grounded: only LEFT/RIGHT work.
- Ground dashes are short and have NO invulnerability.
- Airborne: LEFT/RIGHT/UP/DOWN become a dodge.
- Air dodge lasts 18 frames (~0.30s) and sets the existing `fighter.invincible` field, so the existing hit detection rejects attacks, powers, signatures, supers, and heavies during the dodge window.
- Air dodge uses are tied to remaining jumps:
  - after the first jump: 1 dodge remains
  - after the second jump: 0 dodges remain
  - landing restores the normal pool.

### Wall slide
- A wall must be at least 28px tall, which is more than half of the current ~55px fighter body.
- The fighter must be airborne and pressing toward the wall.
- The fighter sticks to the wall and falls at a maximum of 2.5px/frame.
- Leaving a wall after a slide restores one jump and one dodge.
- Only two wall-grant restores are available per airtime.
- Landing resets the wall-grant counter and the normal jump/dodge pool.
- There is no wall-jump attack or automatic launch; this is a wall-slide + resource-restoration mechanic as requested.

## Mode coverage

The movement code lives in the shared `updateFighter()` path. The supplied `PlatformFighter.jsx` calls `updateFighter()` for both fighters and assigns each fighter its `gameMode`, so the feature automatically applies to the fight simulation rather than being hard-coded into one menu/mode. Battle Royale fighters that use the same shared fighter update path receive the same system.

The module explicitly skips the existing `soccer` sports mode. No sports-specific behavior was added.

## Clip fix

The supplied game currently mounts the clip hook inside `PlatformFighter`, while there is also a `GlobalClipRecorder` component in the provided codebase. The recorder singleton could therefore be initialized/stopped by multiple React owners.

The patched recorder:
1. Reuses the recorder if the same canvas is already being recorded.
2. Starts one recorder immediately instead of starting six MediaRecorder instances at the exact same moment.
3. Staggers the remaining recorder windows by 5 seconds.
4. Automatically replaces expired 30-second windows, so recording continues indefinitely.
5. Uses a generation guard so old stagger timers cannot interfere with a newly started recording.
6. Prevents `useClipRecorder` and `GlobalClipRecorder` from stopping each other's recorder when they share the same canvas.

## Integration

Replace the project's existing files with the package versions:

- `fighter.js`
- `clipRecorder.js`
- `useClipRecorder.js`

Add:

- `movementAbilities.js`

If your app also mounts `GlobalClipRecorder`, replace that file with the package version too.

`PlatformFighter.jsx` does not need a movement-code edit because its existing shared `updateFighter()` calls already route both local and online/LAN fight inputs through the common fighter simulation. It also already sets `f1.gameMode` and `f2.gameMode`.

`ClipsScreen.jsx` does not need to be replaced for the recording fix; it already reads the persisted Blob from the clip store and creates a normal object-URL video source.

## Validation

The patched `.js` files were checked with Node's syntax checker successfully.
