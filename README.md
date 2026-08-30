# Element 6 targeted replacement package

Built against the attached `The-Element-6-Chronicles-main-2_2.zip` source tree.

## Replace/add only these files

Copy the files in this folder into the repository root and overwrite files with the same names. `mobileControls.js` and `storyItems.js` are new files and should be added.

## Included fixes

### Story Mode recovery
- Restores seeded Story Mode worlds instead of forcing the fixed test seed.
- New Story Mode saves receive their own `worldSeed`.
- Story saves preserve the world seed.
- Restores robust keyboard input, including `KeyboardEvent.code` aliases and canvas focus.
- Restores bounded ambient wildlife/side-life spawning.
- Restores the terrain/entity-aware minimap.
- Restores Story Mode item drops through `storyItems.js`.
- Uses the recovered Story Mode world generator so the world is not the empty/blank state from the broken version.

### Bot character loading
- CPU/bot slots are not blocked by the human account's unlock list.
- Sport lineup normalization prevents an invalid/missing bot character ID from making an entire player disappear.
- Soccer character resolution has a safe fallback.
- Volleyball and Baseball character resolution have safe fallbacks.
- Banger already had full-roster bot support and is left intact rather than unnecessarily rewritten.

### Offline pauses
- Offline Volleyball 1v1 and 2v2 get a Pause (ESC) button and pause overlay.
- Offline Baseball gets a Pause (ESC) button and pause overlay.
- Escape pauses/resumes those offline modes instead of immediately quitting.
- The game simulation stops while paused.
- Dodgeball's existing pause now has a visible overlay with Resume and Quit.

### Mobile controls
- Added Mobile Button Layout settings.
- Arrow controls can be selected instead of the default touch layout.
- Joystick mode can be selected.
- Joystick can be fixed or dynamic.
- Button X/Y location, size, and opacity can be customized.
- Joystick X/Y location, size, and opacity can be customized.
- Settings are persisted through the existing game settings system.

## Important limitation

The repository's npm dependencies could not be reinstalled in the offline build environment, so a fresh `npm/pnpm build` could not be executed here. JavaScript-only files were syntax-checked. The package is therefore source-reviewed but not falsely labeled as a completed production build.
