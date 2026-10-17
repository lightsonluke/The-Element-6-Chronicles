# Element 6 — match management and original-style character rig

Upload every file in this folder to the repository **root**. Replace existing
files when GitHub asks. `MatchSettingsOverlay.jsx` and `characterRig.js` are
new root files and must be uploaded alongside the replacements.

Files in this package:

- `characterRig.js` — restores the simple original rounded character look;
  makes torsos a little slimmer; removes eyes; adds articulated elbows/knees,
  visible feet, proper opposite-limb running, jumping, attack, and sport poses.
- `renderer.js` — keeps the shared renderer pointed at the new original-style
  rig, so fight and sport accessory anchors use the same limb positions.
- `UniversalCharacterSelect.jsx` — changes the shared selector header to
  **MANAGE MATCH**, removes the old VS P2/VS CPU/difficulty controls, and adds
  **MATCH SETTINGS** next to Back.
- `MatchSettingsOverlay.jsx` — new reusable settings overlay with game-mode
  tiles, fight variants, player/CPU rows, keyboard/controller choices,
  lock states for ranked/online modes, and character counts up to eight.

The selector passes its chosen match configuration to `onStart` as the final
argument and calls optional `onMatchModeChange` / `onMatchSettingsChange`
callbacks. Existing lobby files that do not yet consume these optional
callbacks preserve their current start behavior instead of being broken.
That is intentional: automatic cross-screen routing needs a dedicated update
to each lobby/router owner, not a browser-side fake redirect.
