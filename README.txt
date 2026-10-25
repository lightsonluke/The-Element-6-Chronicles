Fire Hero performance + readable animation update

Replace the matching files in the game's project root with the files in this ZIP.

Changes:
- Fire Hero's effect rendering now disables expensive canvas shadow blur throughout fire attacks/super, not only on selected shapes. This targets a major source of frame-time spikes.
- Fire rings and blobs use a reduced number of contour points/flame lobes in performance mode, and the super draws fewer decorative rays/impact nodes. The recognizable flame core, rings, and bright attack trails remain.
- Side Signature / Fire Hero's Wave now uses a 54-frame timeline (20 startup, 12 active, 22 endlag). Its crouch-roll windup and pop-up slash move progressively across the animation.
- Side Heavy / Rend Strike now uses a 90-frame timeline (36 startup, 14 active, 40 endlag). The recoil, fire gathering, palm extension, and flame core travel are spread across more frames.
- Attack spec timing metadata is updated alongside the animation and fighter timeline so active collision frames remain aligned to the authored move phases.

Note: no code change can guarantee literally zero lag on every device/browser. These changes remove costly per-frame blur and reduce repeated drawing work, which should materially reduce effect-related frame spikes. Please test in-game, especially on lower-end devices.
