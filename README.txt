ELEMENT 6 — NATIVE CLIPS RECORDER V7

This package fixes the native Clips recording pipeline.

Files:
- clipRecorder.js
- useClipRecorder.js
- GlobalClipRecorder.jsx
- clipStorage.js
- ClipsScreen.jsx

What changed:
- The recorder no longer forces MP4 on Chrome/Chromium or WebM on other browsers.
- It lets MediaRecorder choose its native format first, then falls back through formats the browser reports as supported.
- The actual recorder.mimeType is stored and used for the saved file extension/type.
- Each saved clip is one complete, contiguous MediaRecorder session. No old chunks are deleted from the middle of a file.
- The recorder does NOT use a timeslice. MediaRecorder.stop() produces the final dataavailable Blob for the complete session.
- Before a clip is saved, the Blob is loaded into a video element and an actual decoded video frame is required. If the browser cannot decode the recording, the broken Blob is rejected instead of being saved.
- A fresh recorder segment is started after a successful save.
- Segments are capped at 30 seconds.
- A fresh IndexedDB database is used so old malformed clips are not mixed with the new recordings.
- ClipsScreen continues to use a normal blob: URL for playback, native controls, fullscreen, and frame stepping.

Native-browser limitation:
Browser-native MediaRecorder cannot retroactively encode an exact arbitrary last-30-second MP4 from an already encoded rolling stream without a media encoder/remuxer. This implementation therefore saves the current complete recording segment, which is always <=30 seconds and is validated before storage.

No third-party media library is used.

Testing note:
This package has its JavaScript syntax checked locally. A full Element 6 Vite build was not run here because the complete repository/build environment is not included in this focused patch.
