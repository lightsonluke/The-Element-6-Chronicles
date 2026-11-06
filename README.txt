The Chronicles — Party Sports and Split City Patch

INSTALL
1. Copy the files at this package root into the matching project paths. Keep
   the public/ asset paths unchanged.
2. Apply sql/Supabase-custom-room-sports-renderers.sql after the project's
   Supabase-online-sports-setup.sql, Supabase-custom-room-ready-controls.sql,
   and Supabase-party-linked-custom-rooms.sql migrations.

INCLUDED
- Global cherry blossom backdrop and the supplied Split City background,
  main platform, and drop-through platform art. The backdrop file is the
  exact supplied image (SHA-256:
  6fa96f47402a4041ed3b4333082450dd58d0a2bed3089053c519148c403b8cb7).
- Blossomed City music integration and its Settings track entry.
- Split City collision geometry follows only the two drawn top-face guides.
- Party-linked and independent Custom Room renderer adapters for Soccer
  (2 humans), Volleyball (2), Dodgeball (2), and Banger (6), using the
  existing sport engines.
- Server-validated sports rosters, ready checks, room checkpoints, and
  Custom Room host handoff with host-epoch fencing.

SCOPE LIMITS
This patch does not implement direct party matchmaking for sports, migration
for every online/party/Table mode, deterministic frame-perfect rollback, or a
bespoke from-scratch redesign of every screen. Custom Room sports use the
existing host-authoritative simulation and checkpoint recovery. Those larger
items are not represented as complete here.

No production build or multiplayer acceptance run was performed for this
package. The new files were manually reviewed.
