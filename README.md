# Resonance Construct Activation Crash Fix

Replacement patch for the existing Element 6 Chronicles project. Overwrite the five runtime files in the project root; tests and documentation are included.

The patch makes construct family metadata explicit, validates/rolls back construct activation, and prevents a construct weapon renderer exception from taking down the match update/render loop. The included regression test exercises orb pickup, character swap, orb consumption, and deactivation.

Verified: all four included Node test suites pass against the project's source tree. `npm run build` could not run because Vite is not installed in this environment; live browser testing was not available. If the crash persists, the first browser-console error and stack trace are needed to isolate any separate failure.
