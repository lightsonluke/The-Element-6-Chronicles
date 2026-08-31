ELEMENT 6 — REMOVE PIXEL JUMP

Replacement package for removing the "Pixel Jump" music track from the game's selectable/built-in fight and sports music library.

REPLACE:
  music.js

WHAT THIS FIX DOES:
- Removes the Pixel Jump entry from FIGHT_TRACK_LIBRARY.
- Pixel Jump will no longer be selected by the built-in fight/sports music rotation.
- Pixel Jump will no longer appear as a built-in selectable track wherever FIGHT_TRACK_LIBRARY is used.
- No other music tracks are changed.

IMPORTANT:
The repository currently contains both "public/audio/pixel-jump.mp3" and a duplicate-looking "public/audio/Pixel Jump.mp3" file. The game code only references the lowercase file through music.js, so replacing music.js is sufficient to remove Pixel Jump from the game library. If you also want the unused audio files physically removed from the repository, delete both audio files manually.
