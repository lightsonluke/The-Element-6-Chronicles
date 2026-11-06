# The Chronicles — update package

This is a changed-files overlay, not a complete copy of the game. Extract non-SQL files into the existing project root (the directory containing `package.json`), preserving folders and replacing matching files. SQL migrations are collected under `SQL/`; review and apply them separately only when not already deployed.

See `IMPLEMENTATION_STATUS.md` for implemented scope and known unfinished items. No production build was run because dependencies are absent from this checkout.
