# Element 6 Chronicles — Complete Replacement Feature Package

This package contains **full replacement files only for the files changed for this request**. It is designed to be copied over the matching files in the root of the existing Element 6 project.

## Install

1. Back up the current project.
2. Copy every file in this package into the matching path in the project root, replacing the existing file.
3. In Supabase, run `Supabase-clan-tournaments.sql` **after the existing clan migrations**.
4. Run `Supabase-all-leaderboards-fix.sql` after the existing leaderboard tables/migrations.
5. Build/deploy the project normally.

## Included changes

- Clan Tournaments tab in Clans.
- Deterministic weekly random clan pairings, weekly XP matchup scoring, monthly Top 100 standings, and monthly winner reward entitlement/claim RPC.
- Clan tier XP thresholds increased to 3× the previous XP requirements while preserving the existing age gates.
- Expanded Shikigami roster from 30 to **80 total**, using Japanese folklore/cultural names. Each Shikigami has a defined +0.5 stat boost.
- Mobile button editor now stores and previews actual button shapes, size, opacity, and color. Shapes include circle, square, rounded, pill, diamond, hexagon, and triangle.
- Existing controller stack was preserved rather than replaced; it already supports gamepad polling, hot-plugging, remapping, profiles, sticks/D-pad, menu navigation, and rumble.
- Clip recorder gets a second FFmpeg CDN fallback and MP4-only clip storage metadata. Website preview continues to use the playable preview blob while downloads use the saved MP4.
- Bots are explicitly prevented from receiving the Clan Badge accessory.
- Community Hub server discovery is global instead of region-filtered, so any active player makes that server visible.
- Freehand stage editor shows the stroke live while drawing and allows completed freehand strokes to be dragged.
- Saved freehand strokes are rendered as continuous strokes in the fight renderer instead of exposing the collision micro-boxes visually.
- Global leaderboard loading uses the hardened SQL RPC first, with the previous table query as fallback.
- Existing clan logo data-URL flow is preserved and remains the source for the Clan Badge renderer.

## Important

The package was syntax-checked for the modified JavaScript files. A production Vite build could not be executed in this environment because the uploaded project does not contain `node_modules`/the Vite binary. Install dependencies in your normal development environment before deploying.

The Supabase SQL migrations must be run for the online clan tournament and leaderboard functionality; the React files alone cannot create those database objects.
