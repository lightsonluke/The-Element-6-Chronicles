Element 6 Chronicles — Build Fix v3

This is a replacement-files package based on the previous checklist-fixes v2 package.

Fixes in this revision:
- Fixed Sandbox.jsx JSX parse error: the bot difficulty <select> and STOCKS <label> were sibling JSX elements inside one conditional expression without a parent. They are now wrapped in a fragment.
- Fixed hubRegion.js invalid regular-expression literals caused by over-escaped slash characters.
- Re-checked the reachable application module graph with the TypeScript parser: 261 reachable modules, 0 syntax errors.
- Re-checked reachable relative imports: 0 missing local imports.
- Re-ran TypeScript semantic diagnostics with external-module noise filtered: 0 actionable diagnostics.

Install:
1. Unzip this package over the project root.
2. Replace the existing files when prompted.
3. Run the normal CI build: pnpm install --no-frozen-lockfile && pnpm build.

This package does not include the entire 200MB project; it contains only the files changed by the previous checklist-fixes package plus the two files corrected in this revision.
