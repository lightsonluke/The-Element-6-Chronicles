# Current implementation status

This is a working status record for the current update. It does not certify the
full requested redesign or multiplayer/networking scope as complete.

## Implemented in the current source

- The 2027 season catalog contains six 50-tier Battle Passes and the holiday
  reward tracks, with six season banner SVGs under
  `public/assets/battle-passes/2027/`.
- Event reward claims use an authenticated, row-locked, idempotent Supabase RPC
  that looks up the reward in the server catalog and applies the corresponding
  ownership or Token grant.
- Party, Table, and Custom Room changes use the migration sequence in
  `PARTY_MIGRATION_ORDER.txt`. Table launch fills real vacant slots with the
  Honored AI; party-linked rooms and Tables use server-side membership checks.
- Custom Room membership, settings, readiness, launch, snapshots, and the
  existing host-authoritative sport renderer use server RPCs. Sport room launch
  requires the Custom Room sports-renderer migration and an exact human roster;
  unsupported sport modes are rejected rather than started as local matches.
- The clip shortcut is F8 and does not consume Space/Jump. Save Clip is a
  focusable pause-menu action, available through the shared controller menu
  navigation. Failed replay conversion preserves its WebM source for retry.
  Failed and processing replay entries remain visible in the library so the
  retry action is still reachable after navigation or refresh.
  Automatic replay preference is latched at match start, so a settings change
  applies to the next match. Holiday KO rewards have event-specific visual
  effects, and seasonal accessory rewards have purpose-shaped renderer variants.
- The common non-home routed-screen shell has unified styling and controller
  menu navigation. Sport and stat-element glyphs are authored in `GameIcon.jsx`.
- The primary character-select action is fixed inside the safe-area-aware
  viewport so it remains visible while the longer roster/customization content
  scrolls. CPU-only opponent selection now updates after render rather than
  setting React state during render. Claimed seasonal titles synchronize into a
  server-derived public profile field; the owned-title picker filters and sorts,
  and titles appear in friend, online-user, profile, and leaderboard rows.
- 2027 reward cards now preview the actual seasonal KO effect, authored emote
  pose, and movement-trail renderer instead of a generic category tile. Seasonal
  emotes use named action families with distinct motion timing and neutral
  entry/exit transitions.
- Community Hub chat displays the server-stamped equipped title. The Hub
  presence migration derives nametag titles from account progress and ignores
  client-supplied title values. Title IDs are resolved to readable title names
  in direct chat, party chat, party rosters, The Table, and Custom Room rosters.
- Controller focus now enters the topmost visible dialog when several overlays
  are stacked, using effective z-index with DOM order as a tie-breaker. This
  keeps controller navigation inside the active trade/chat/confirmation panel
  instead of sending focus to an older dialog behind it.
- Open party lobbies now elect the earliest-connected, currently-present
  non-host member when the server heartbeat marks the old host stale. The
  authoritative snapshot returns the updated leader to every polling client;
  active-match host migration is still not implemented.
- Waiting Custom Rooms recover their host from the authoritative snapshot.
  Sport matches can elect a new active host with a monotonically increasing
  host epoch; the existing shared sport engines resume from the last accepted
  checkpoint where one is available. This is host-authoritative recovery, not
  deterministic rollback.
- Ready parties can launch a server-created soccer, 2v2 volleyball, dodgeball,
  or Banger match through `element6_party_queue_online_sport`. Roster size,
  presence, readiness, and host permission are checked in SQL. Volleyball 2v2
  maps all four player slots to separate human-controlled fighters, including
  controller input.
- Guest progress stays in the current device's local storage. Account-progress
  reads and writes require a matching authenticated Supabase session; signed-out
  tabs do not query `user_progress` or call account-save RPCs. Delayed saves are
  still fenced against sign-out and account changes.

## Still incomplete

- Seasonal XP is not secure against a modified client: the award RPC still
  accepts `p_xp` and a client-generated match UUID. Secure claims do not make
  the XP source authoritative. The project has no trusted match simulation
  service covering every offline and online mode from which to derive XP.
- The screen work is a shared visual treatment, not a bespoke rebuild from
  scratch of every active menu, overlay, dialog, and special-case screen.
- Parties only launch modes with implemented shared sessions. Grand Circuit
  and several other requested group activities are not implemented. Active
  sports and Custom Room host recovery exists, but party leadership and all
  other mode-specific active-match migration paths are not complete.
- Custom Room sport rendering supports the existing Soccer, Volleyball,
  Dodgeball, and Banger engines through host-authoritative snapshots. Spectators,
  the expanded settings catalog, and complete multiplayer regression coverage
  remain unfinished.
- Table and Custom Room matches use the current host-authoritative transport;
  this is not deterministic frame-perfect rollback and has not been validated
  for parity across every mode.
- The requested full game-mode inventory, per-entry-point launch audit, MP4
  compatibility matrix, multi-account party/room testing, and complete
  controller accessibility audit have not been completed in this pass.

No production build or automated test suite was run for this pass, per the
current instruction. The final JavaScript edits and JSX changes were manually
reviewed. These items need implementation and verification before a release
package can be described as complete.

## Current continuation pass

- Added party sports matchmaking, live sport-host election, epoch-filtered
  sport transport, and independent human input for all four Volleyball 2v2
  slots. Added the migration order and focused patch package. Tightened cloud
  save helpers so guests remain local and account data is never queried or
  written without a verified session matching the active account owner.
- This continuation did not rebuild every screen or add deterministic rollback
  to each game engine. Existing mode-specific sports and room simulation still
  use host-authoritative state snapshots.

## Focused mode launch and party continuation — November 6, 2026

- Fixed The Table's party-launch hook ordering. The joining/loading branch now
  renders only after every React hook has been declared, avoiding a hook-order
  exception when the lobby changes from fighter selection to joining.
- A party-launched Table now consumes its server-provided tournament ID
  directly. It no longer depends on a second lookup to rediscover the session.
- Added party Battle Royale prepare/join/start/cancel/finish RPCs and wired the
  party roster into the existing Battle Royale renderer. Public queues exclude
  party sessions, and the host cannot start until all party members are online,
  ready, and present in the same server roster.
- Battle Royale now finalizes the shared Supabase match row and listens for its
  finished status. Previously, completion was written only to browser-local
  storage, leaving the shared lobby row stuck as active.
- The party finish RPC now only releases the shared party after the authoritative
  match row is finished. A guest cannot end an active party match by leaving its
  local result screen; the UI stays available for retry if server finalization
  has not completed yet.
- Tightened return-from-queue behavior so cancellation is confirmed before the
  Battle Royale lobby navigates away. Match refresh failures show a retrying
  message rather than disappearing silently.
- The 2v2 Team, Capture the Flag, Table, Battle Royale, and existing sport
  character selectors use the scroll-safe/sticky start action already defined
  in `index.css`. The Table, 2v2, CTF, Parkour, Rock Climbing, and Ziplining
  screens have their selection content contained in that scroll viewport.
- Grand Circuit and Capture the Flag are still not available as shared party
  matches. Their current gameplay components are local-only; these controls
  remain disabled rather than sending party members into separate local games.
- No production build or automated tests were run. The touched launch paths,
  hook order, SQL dependency order, and component handoffs were manually
  reviewed; this is not a complete per-mode launch certification.
