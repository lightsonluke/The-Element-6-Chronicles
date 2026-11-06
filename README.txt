The Chronicles — Party Sports and Split City Patch

INSTALL
1. Copy the files at this package root into the matching paths in the game.
   Keep the public/ asset paths unchanged.
2. Apply the SQL migrations in this order, after the base game's party and
   online-sports schema migrations:
   a. Supabase-custom-room-sports-renderers.sql (after online sports,
      custom-room-ready-controls, and party-linked-custom-rooms).
   b. Supabase-party-sports-matchmaking.sql (after online sports, party
      presence/readiness, and party-linked-custom-rooms).
3. The party sports launch requires authenticated party members to have fresh
   online presence, be ready, and match the selected sport's exact human count:
   Soccer 1v1 = 2, Volleyball 2v2 = 4, Dodgeball 1v1 = 2, Banger 3v3 = 6.

INCLUDED
- Global cherry blossom backdrop and the supplied Split City background,
  main platform, and drop-through platform art. The backdrop file is the exact
  supplied image (SHA-256:
  6fa96f47402a4041ed3b4333082450dd58d0a2bed3089053c519148c403b8cb7).
- Blossomed City music integration and its Settings track entry.
- Split City collision geometry follows only the two drawn top-face guides.
- Party queue controls and Game routing that create and load one shared,
  server-rostered online sport match using the existing Soccer, Volleyball,
  Dodgeball, and Banger engines.
- SQL checks party host authority, exact player count, readiness, presence,
  existing active matches, account loadouts, and party release after a sport
  match reaches a terminal status.
- Independent and party-linked Custom Room sport adapters, room checkpoints,
  and Custom Room host handoff with host-epoch fencing.

NOT COMPLETE
This patch does not implement deterministic frame-perfect rollback for every
mode. The existing sports renderers and Custom Room sport sessions still use
their host-authoritative simulation/state-sync paths, and active-match host
migration for party sports is not implemented. The package also does not
rebuild every screen, dialog, and overlay from scratch. These requirements
remain unfinished; this package does not represent them as complete.

No production build or multi-account multiplayer acceptance run was performed.
The current extracted project has no installed Vite/esbuild dependencies, so
build validation was unavailable. Review the SQL migration order before
applying it to the deployed database.
