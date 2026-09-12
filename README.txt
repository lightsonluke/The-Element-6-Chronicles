ELEMENT 6 CLIPS FIX

Replace these five files in the project:
- clipRecorder.js
- GlobalClipRecorder.jsx
- useClipRecorder.js
- clipStorage.js
- ClipsScreen.jsx

The two changed files are clipRecorder.js and GlobalClipRecorder.jsx.
useClipRecorder.js was updated to use the same recorder behavior if that hook is used elsewhere.
clipStorage.js and ClipsScreen.jsx are included unchanged so this is a self-contained replacement package.

What changed:
- Clips no longer depend on settings.enableClips being present/enabled.
- The global recorder automatically records the active game canvas.
- Recording uses one continuous MediaRecorder with 1-second chunks instead of six simultaneous 30-second recorders.
- The recorder keeps a rolling 30-second buffer in memory.
- Pressing Space saves the current rolling buffer without stopping/restarting the main recorder.
- Repeated Space presses are serialized so the rolling buffer cannot be corrupted by overlapping saves.
- Recorder/canvas track failures trigger recovery through the existing canvas scan.
- IndexedDB persistence, 30-clip limit, preview, frame stepping, fullscreen, download, and delete remain intact.

No changes are required to App.jsx or Game.jsx. Game.jsx already mounts GlobalClipRecorder globally.
