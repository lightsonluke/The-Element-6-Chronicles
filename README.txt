ELEMENT 6 — SOCCER BOT + CLIPS FIX

Replace only the files in this package in the repository.

SOCCER:
- Offline CPU characters are no longer limited by the player's unlocked-character list.
- SoccerFighter resolves characters from the complete sports roster, including old-generation characters such as Masaru Hai.
- A bot can use a locked character without being replaced by Yellow.
- Human character unlock validation remains unchanged.
- The existing Soccer pause menu/quit callback is preserved; bot character validation no longer interferes with the match state.

CLIPS:
- Adds /clips and a CLIPS button above Community Hub on desktop and mobile home menus.
- Press SPACE during a match to save the rolling clip.
- Clips are stored in IndexedDB rather than localStorage.
- Maximum 30 clips; oldest clips are automatically removed.
- The Clips screen loads saved video blobs and supports playback, saving, and deletion.
- Global fallback recording covers canvas-based game screens that do not already mount useClipRecorder.
- Existing game-specific clip recorder mounts continue to work without duplicate saves.

No database or Supabase migration is required for local clips.
