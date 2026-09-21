# Element 6 — Clips / Stage Physics / Social / Leaderboard / Clan Fix Package

This is a TARGETED replacement package. Copy the files at the package root over the
same-named files in the root of The Element 6 Chronicles project.

## Included fixes

### Clips
- Stops an FFmpeg/CDN failure from turning a valid recording into "CLIP SAVE FAILED".
- Saves the native WebM recording when MP4 conversion is unavailable.
- Preserves MP4 when conversion succeeds.
- IndexedDB now stores the actual MIME type/extension.
- Clip downloads use the real saved extension.

### Stage Editor / stage runtime
- Freehand collision is now continuous slope collision instead of hundreds of tiny
  square collision blobs.
- Players smoothly roll downhill on freehand slopes.
- Physics objects roll substantially faster downhill.
- Moving freehand slopes carry their actual endpoints with the motion.
- Looping motion chains no longer accumulate displacement and teleport/jump at cycle
  boundaries.
- Stage preview shows moving freehand strokes, moving objects, moving KO perimeter,
  camera motion/zoom, hazards, materials, spawn points and other saved stage data.
- Explicitly disabled KO perimeters remain disabled in the actual match.
- Custom stage camera zoom/motion and KO-perimeter settings continue through the
  custom-stage runtime.

### Leaderboards
The main Leaderboard now has:
- Overall
- Soccer
- Combat
- Ranked
- Parkour
- Rock Climbing
- Ziplining
- Honored Bot Tracking

Parkour/Rock Climbing/Ziplining screens prefer the Supabase world-score table and
fall back to their existing local entities.

Honored Bot matches are additionally written to a global Supabase table.

### Clan
- Clan tournament monthly view exposes `clan_tag`, fixing:
  `column element6_clan_tournament_monthly.clan_tag does not exist`
- Clan leader can change/remove the clan badge at any time.
- Badge can be entered by URL or uploaded as an image <=150 KB.

### Social notifications
Global top-left notifications are added for:
- Incoming chat from any player, not just friends
- Incoming friend request
- Friend request accepted
- Friend coming online

Notifications can be disabled in Settings -> Social notifications.

The SQL migration also allows DMs to be sent to players who are not friends.

### Private Community Hub servers
- Creating a private server requires an exactly 4-digit passcode.
- Joining a private server requires that passcode.
- Public servers do not require a passcode.

### Fight emotes
Capture the Flag now supports equipped emotes using the normal number-key slots.

### Daily quests
- Daily generation is deterministic by calendar date.
- Exactly 3 different quests are generated per day.
- The existing midnight reset path now also tracks matches, signature KOs,
  ground-pound KOs and emote-before-move progress correctly.

## SQL

Run:
`sql/Supabase-Element6-Complete-Feature-Fixes.sql`

after your existing Element 6 Supabase setup/migrations.

If the ELO leaderboard SQL has not already been run, also run:
`sql/Supabase-elo-leaderboard-fix.sql`

If the shared leaderboard hardening migration has not already been run, also run:
`sql/Supabase-all-leaderboards-fix.sql`

If your world-score setup is missing, run:
`sql/Supabase-world-scores-fix.sql`

Do not replace the entire database with these files; they are migrations.

## Validation

The changed JavaScript files passed Node syntax parsing and the changed JSX files passed
TypeScript/JSX parser validation.

A full Vite production build was not run in this environment because the uploaded
project did not contain its installed `node_modules`.
