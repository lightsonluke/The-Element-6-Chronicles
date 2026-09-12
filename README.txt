ELEMENT 6 CLIPS — VALID MP4 / 60 FPS FIX

IMPORTANT:
The previous MP4 recorder was broken because it took arbitrary 1-second pieces
(chunks) from one MP4 MediaRecorder session and joined those pieces into a new
Blob. MP4 needs container-level initialization/index information, so that can
produce a file that is labeled .mp4 but cannot be decoded by browsers, Canva,
CapCut, etc.

THIS PACKAGE FIXES THAT:

1. Every saved clip is the COMPLETE output of one MediaRecorder session.
2. Six complete 30-second MP4 sessions overlap, staggered by 5 seconds.
3. Pressing Space saves the oldest complete/near-complete session and immediately
   replaces it, so clipping remains seamless.
4. Canvas capture requests 60 FPS.
5. MP4/H.264 is required; the code never renames WebM data to .mp4.
6. When the game changes from the match canvas to another canvas (such as a
   Victory or Match Facts screen), one old recording window is preserved while
   the new screen starts recording. The previous match is therefore still
   available for the next Space press.
7. ClipsScreen uses 60 FPS for frame stepping.

REPLACE:
- clipRecorder.js
- GlobalClipRecorder.jsx
- useClipRecorder.js
- ClipsScreen.jsx

clipStorage.js does not need to change for this corruption fix.

BROWSER NOTE:
The browser must support MediaRecorder MP4/H.264. If it does not, this package
fails cleanly instead of producing a fake/corrupt MP4 by renaming WebM bytes.

OLD CORRUPT CLIPS:
Clips already created by the broken recorder cannot be repaired by changing
metadata or their file extension. Test with a newly recorded clip after this
replacement.
