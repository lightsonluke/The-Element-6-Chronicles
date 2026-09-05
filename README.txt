ELEMENT 6 CHRONICLES — CLIPS TAB FIX

Replace these files in the current project:
- Game.jsx
- ClipsScreen.jsx
- GlobalClipRecorder.jsx
- clipRecorder.js
- clipStorage.js
- useClipRecorder.js

WHAT THIS FIXES
- Restores the Clips screen route so navigating to Clips actually renders ClipsScreen.
- Adds /clips to the app's screen/path routing.
- Rehydrates saved clip metadata from IndexedDB when the game starts.
- Keeps the progress metadata synchronized whenever a clip is saved or deleted.
- Mounts the global native clip recorder so the Clips feature is active across gameplay screens.
- Includes the latest native Clips playback/preview implementation from the v7 clips fix.

IMPORTANT
This is a focused replacement package. It does NOT replace the online gamemode files, so keep the latest online-gamemode replacement files already installed.

VALIDATION
- All local imports used by the six replacement files were checked and resolved.
- The full Vite production build was not run because the supplied repository does not contain node_modules/build dependencies in this environment.
