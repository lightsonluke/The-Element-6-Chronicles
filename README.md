# Element 6 — 2026-09-28 Online/Community Fix Package

This package only changes the systems reported as broken:

1. **Party state**
   - Party membership is resolved from `element6_party_members`, not only `host_user_id`.
   - Stale memberships pointing at closed/deleted parties are cleaned automatically.
   - Creating a party no longer disappears on the next refresh.
   - Existing active membership is returned instead of producing a misleading failed join.
   - Leave/host transfer remains server-owned.

2. **The Table**
   - Added server-side current-table recovery.
   - Existing active membership is recovered instead of making the Join button appear dead.
   - A lone queue entry older than 30 minutes is treated as stale and cleaned.
   - Join errors are shown immediately in the lobby.

3. **Match Replays**
   - `Game.jsx` now actually starts the replay recorder when a real match canvas exists.
   - Recorder follows the mounted match canvas and stops when leaving the match.
   - MP4 conversion uses the recording's actual video dimensions/frame rate instead of hard-coded 1280x720.
   - Replays are saved only after a real MP4 conversion succeeds; no extension-only rename.
   - Replay metadata and duration are captured per recording session.

4. **Community Hub player content**
   - Other players' public campaigns and stages are loaded from the shared Supabase community tables instead of browser-local storage.

5. **Community Hub chat**
   - Server/world/party chat now uses a shared Supabase `community_hub_chat_messages` table.
   - Realtime updates and polling are enabled.
   - Party chat checks actual online party membership.

## Installation

### A. Game files
Replace the matching files in the project with the files in this package:

- `PartyScreen.jsx`
- `TheTableLobby.jsx`
- `matchReplayRecorder.js`
- `clipStorage.js`
- `Game.jsx`
- `CommunityHub.jsx`
- `PlayerProfileModal.jsx`
- `HubChat.jsx`

### B. Supabase
Run **the entire** `Supabase-2026-09-28-party-table-community-replay-fix.sql` in the Supabase SQL Editor.

Run it after the existing party/The Table/community SQL. It uses `create or replace function` and adds the Hub chat table/policies.

### Important
The package does not require a new npm dependency; it uses the project's existing `mediabunny` dependency for real MP4 conversion.

A full Vite production build was not run in this environment because the project dependencies are not installed here. JavaScript-only files were syntax-checked with Node, and the package was statically checked for the new RPC/import references.
