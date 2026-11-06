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
- Custom Rooms currently support shared networked fights only. Shared network
  renderers for sports modes, spectators, the expanded settings catalog, and
  complete multiplayer regression coverage remain unfinished.
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
