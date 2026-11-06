# The Chronicles — Completed Work Package (current partial update)

This is an overlay package containing files changed or added relative to the supplied game source, plus status and installation notes. It is intentionally not a copy of the full game.

## Install

1. Make a backup of the game project.
2. Extract this archive into the project root (the directory containing `package.json`), preserving folders and allowing files to be replaced.
3. Review `IMPLEMENTATION_STATUS.md` before deployment. It lists what is implemented and what remains incomplete.
4. Apply the Supabase migrations only if the corresponding schema/RPCs are not already deployed. Follow `PARTY_MIGRATION_ORDER.txt`; do not rerun migrations managed by your deployment process.

## Scope

The archive includes the implemented menu/gameplay presentation changes, season 2027 reward catalog and previews, claim and profile-title integration, party/Table/Custom Room work, clip/replay fixes, controller navigation fixes, sport/element icons, and associated SQL/assets present in the current working source.

This package does not complete the entire requested update. In particular, XP award authority, a bespoke rebuild of every screen, party coverage of all modes, active-match host migration, shared online sports rooms, spectators and the expanded room settings, deterministic rollback across every mode, and the requested exhaustive audits/multi-client validation remain incomplete. The status file is authoritative.

No production build or automated suite was run for this pass.
