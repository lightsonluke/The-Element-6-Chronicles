ELEMENT 6 — NATIVE-ONLY CLIPS REPLACEMENT v2

No Mediabunny. No FFmpeg. No third-party media-processing library.

REPLACE THESE FILES:
- clipRecorder.js
- useClipRecorder.js
- GlobalClipRecorder.jsx
- clipStorage.js
- ClipsScreen.jsx

WHAT THIS VERSION FIXES
- Clips load into the Clips screen as real video object URLs.
- The video element gets the saved MIME type and is explicitly preloaded.
- Fullscreen button is included.
- Previous-frame and next-frame buttons are included.
- Left/Right arrow keys also step one frame.
- Frame stepping uses 30 FPS (about 33.3ms per frame).
- Native recording keeps a rolling window bounded around 30 seconds.
- The recorder refuses to save a native recording if the resulting media duration exceeds the safety limit instead of claiming it is exactly 30 seconds.
- No media conversion is performed.

IMPORTANT NATIVE LIMITATION
Browser-native MediaRecorder cannot losslessly cut an arbitrary encoded video at exactly an arbitrary frame boundary. This implementation therefore keeps a tightly bounded rolling native recording and validates the resulting duration before saving. It does NOT fake an MP4 extension or use a hidden transcoder.

MP4 vs WEBM
MP4 is selected only if the browser reports native MP4 MediaRecorder support. Otherwise WebM is saved with its real MIME type/extension.

INSTALLATION
No npm package is required. Drop these replacement files into the repo.

AUDIO
This recorder captures the game canvas video. It does not automatically add game audio because canvas.captureStream() provides the canvas video track only.
