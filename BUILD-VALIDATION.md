Element 6 Complete Fix - Build Error Cleanup

Fixed the ClansScreen nullish-coalescing precedence error:
  data?.icon_url ?? icon || value
was changed to:
  (data?.icon_url ?? icon) || value

Validation performed against the replacement package:
- TypeScript parser checked every JavaScript/JSX/TypeScript source file in the package: 0 parse errors.
- The replacement package was overlaid onto the supplied Element 6 project and all relevant root source files were parser-checked: 0 parse errors.
- The old nested Element6Chronicles-syntax-fix folder is intentionally NOT included because it contained incomplete duplicate files that are not part of the root build and themselves produced parser errors.
- Supabase-all-leaderboards-fix.sql has been replaced with the schema-compatible version using ranked_elo/ranked_ratings instead of the nonexistent ranked_rating column.

A production Vite build could not be executed in this environment because package installation requires registry network access, which is unavailable here. The GitHub Actions build is therefore the final environment-specific verification.
