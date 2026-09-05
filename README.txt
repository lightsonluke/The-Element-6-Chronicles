ELEMENT 6 — NATIVE CLIPS PREVIEW v4

This replacement fixes the Clips-tab playback path.

IMPORTANT FIX
The previous preview attempted to assign the saved Blob directly to video.srcObject. Browser support for Blob/File values in HTMLMediaElement.srcObject is limited and can produce a player that loads metadata but displays a black frame. This version always uses a normal blob: object URL through video.src instead.

The preview also waits for actual media data/video dimensions before considering the preview playable.

Included:
- clipRecorder.js
- useClipRecorder.js
- GlobalClipRecorder.jsx
- clipStorage.js
- ClipsScreen.jsx

Still native browser APIs only. No Mediabunny, FFmpeg, or media-processing dependency.

Existing saved clips remain in the same IndexedDB database.
