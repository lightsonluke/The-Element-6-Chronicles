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
- Custom Room membership, settings, readiness, launch, and snapshots use server
  RPCs. The fight renderer is the only currently supported shared Custom Room
  renderer; unsupported sports modes are rejected rather than launched as
  unrelated local simulations.
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
- Waiting Custom Rooms now do the same server-side host recovery from their
  authoritative snapshot. It is deliberately restricted to the lobby; the
  live match host and renderer lifecycle still need a state-preserving
  migration design.

## Still incomplete

- Seasonal XP is not secure against a modified client: the award RPC still
  accepts `p_xp` and a client-generated match UUID. Secure claims do not make
  the XP source authoritative. The project has no trusted match simulation
  service covering every offline and online mode from which to derive XP.
- The screen work is a shared visual treatment, not a bespoke rebuild from
  scratch of every active menu, overlay, dialog, and special-case screen.
- Parties only launch modes with implemented shared sessions. Grand Circuit,
  online sports party flows, and several other requested group activities are
  not implemented. Active-match host migration is also incomplete.
- Custom Rooms currently support shared networked fights only. This update adds host-controlled room capacity, stock count, timer, starting damage, bot difficulty, and stage selection, with server validation. Shared network renderers for sports modes, spectators, the full expanded settings catalog, and complete multiplayer regression coverage remain unfinished.
- Table and Custom Room matches use the current host-authoritative transport;
  this is not deterministic frame-perfect rollback and has not been validated
  for parity across every mode.
- The requested full game-mode inventory, per-entry-point launch audit, MP4
  compatibility matrix, multi-account party/room testing, and complete
  controller accessibility audit have not been completed in this pass.

No production build or automated test suite was run for this pass, per the
current instruction. All 187 root JavaScript modules passed Node's syntax
checker. JSX files were manually reviewed because the project parser/build
dependencies are not installed in this source checkout. These items need
implementation and verification before a release package can be described as
complete.


## November 6 package additions

- Fixed the reported `infinite recursion detected in policy for relation "element6_party_members"` error. The migration replaces self-referencing membership policies with a security-definer membership check that bypasses RLS only inside the helper.
- Added Custom Room setting validation and host-only Table match settings.
- Added supported-range settings for local fight, offline Tournament, Custom Room, and The Table. Grand Circuit, party, LAN, and offline sports retain the participant formats currently implemented by their game engines; arbitrary counts are not enabled where the engine or transport cannot play them.
- The background and authenticated-only cloud-read changes are included in the overlay.


## November 6 continuation

- The home menu explicitly receives the requested Split City cherry-blossom
  backdrop asset (`public/assets/e6-home-menu-background.png`).
- Signed-out progress is saved only to the local guest key. Guest saves do not
  enqueue cloud synchronization, and the legacy unscoped progress key is not
  loaded into a guest session.
- Regular Battle's multi-fighter launch carries the selected 2–8 fighter count,
  human/CPU slots, stocks, starting damage, team settings, and selected stage
  into the existing 8-fighter renderer. The renderer accepts two local keyboard
  players; remaining selected slots are CPUs.
- Tournament setup now supports one or two local entrants. Player 2 selects a
  fighter and can use the arrow-key layout or a second connected controller.
  The opening match is head-to-head; its winner advances under that fighter's
  identity.
- The Table host can set the active fighter total from 2 to 8. Its start RPC
  validates that the setting can hold the connected human roster and fills the
  remaining selected slots with Honored Bots. The SQL order was updated so the
  settings column exists before the launch RPC is installed.
- Monthly clan tournament rewards now use a pool of 7,000 Tokens per current
  member and divide it using the claimant's recorded XP share. A one-member
  clan therefore cannot claim the former fixed 100,000-token pool. The final
  SQL file reapplies this function after earlier clan reward migrations.

No production build was run. This source checkout has neither Node.js nor
installed project dependencies, so the final JSX edits were manually reviewed.


## November 6 continuation

- The home menu explicitly receives the requested Split City cherry-blossom
  backdrop asset (`public/assets/e6-home-menu-background.png`).
- Signed-out progress is saved only to the local guest key. Guest saves do not
  enqueue cloud synchronization, delayed writes are discarded after sign-out or
  account switching, and the legacy unscoped progress key is not loaded into a
  guest session.
- Regular Battle's multi-fighter launch carries the selected 2–8 fighter count,
  human/CPU slots, stocks, starting damage, team settings, and selected stage
  into the existing 8-fighter renderer. The renderer accepts two local keyboard
  players; remaining selected slots are CPUs.
- Tournament setup supports one or two local entrants. Player 2 selects a
  fighter and can use the arrow-key layout or a second connected controller.
  The two local entrants play head-to-head in the opening round; the winner
  advances under that fighter's identity.
- The Table host can set the active fighter total from 2 to 8. Its start RPC
  validates that the setting can hold the connected human roster and fills the
  remaining selected slots with Honored Bots. The SQL order installs the settings
  column before the launch RPC.
- Monthly clan tournament rewards use a pool of 7,000 Tokens per current member
  and divide it using the claimant's recorded XP share. A one-member clan
  therefore cannot claim the former fixed 100,000-token pool. The final SQL file
  reapplies this function after earlier clan reward migrations.

No production build was run. This source checkout has neither Node.js nor
installed project dependencies, so the final JSX edits were manually reviewed.
