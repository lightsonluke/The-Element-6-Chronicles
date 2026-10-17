# Element 6 visual, animation, and stage replacement package

Upload every file in this folder to the **root** of the Element 6 repository,
and let GitHub replace same-named files. `characterRig.js` is new and must be
uploaded beside `renderer.js`.

Included changes:

- One taller, rounded, fully jointed Element 6 rig for every fight and sport
  renderer, with eyes, elbows, knees, hands, feet, run/jump/stun/attack poses,
  soccer kicks, volleyball set/bump/spike poses, and dodgeball throw poses.
- Existing accessory and sport jersey rendering now inherits the same live limb
  anchors from the shared rig.
- The renderer draws irregular material-specific floating-island platform art
  without changing the original collision rectangles.
- Stock respawns are locked and invulnerable for exactly 180 simulation frames
  (three seconds). Final stocks enter a dedicated final-death state instead.
- Theme-aware visual treatment for home, menus, panels, buttons, modals and
  match pause overlays. The home menu layout is not rearranged.

This is a replacement package, not a full project folder: do not upload it as a
nested directory.
