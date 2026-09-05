ELEMENT 6 — NATIVE-ONLY CLIPS REPLACEMENT

This package removes the Mediabunny dependency from the clip system.

NO THIRD-PARTY MEDIA LIBRARY IS REQUIRED.

The recorder uses only browser-native APIs:
- HTMLCanvasElement.captureStream()
- MediaRecorder
- MediaRecorder.isTypeSupported()
- Blob / URL.createObjectURL()
- IndexedDB

WHAT IT DOES
- Press SPACE during gameplay to save the recent ~30-second replay window.
- Keeps a rolling MediaRecorder buffer in memory.
- Reassembles the MediaRecorder data in order before saving.
- Uses MP4 if the current browser supports MP4 recording.
- Otherwise uses the browser's native WebM recording format.
- Saves clips locally in IndexedDB.
- Keeps up to 30 clips and removes the oldest automatically.
- Clips Screen previews and downloads the actual native file type.
- Does not upload clips to Supabase.

IMPORTANT NATIVE-BROWSER LIMITATION

A browser cannot guarantee MP4 recording on every browser/device. The code checks
MediaRecorder.isTypeSupported() and chooses a supported format. If MP4 is not
supported, the clip is saved as WebM instead of pretending a WebM file is MP4.

This package also does not use a media transcoder. That means there is no
third-party conversion step that can losslessly cut an arbitrary recording to
exactly 30.000 seconds. The recorder keeps a small amount of extra rolling media
so the saved replay is a native, playable recent-window recording.

INSTALLATION

You do NOT need to run npm install for this package.

Delete/replace the old clip files with these files:
- clipRecorder.js
- useClipRecorder.js
- GlobalClipRecorder.jsx
- clipStorage.js
- ClipsScreen.jsx

IMPORTANT

The package uses a new IndexedDB database name (element6_clips_native), so old
broken MP4 entries from the previous Mediabunny version are not reused.

No changes to package.json are required.

BROWSER SUPPORT

The browser must support MediaRecorder and canvas.captureStream(). MP4 is used
only when the browser reports that the requested MP4 MIME type is supported.

AUDIO

This recorder captures the game canvas video. It does not automatically add
game audio because canvas.captureStream() provides the canvas video track only.

WHY THIS IS DIFFERENT FROM THE OLD VERSION

The old version required Mediabunny to convert/trim the recording to MP4.
This version does not import Mediabunny at all and never attempts to rename a
WebM file to MP4.
