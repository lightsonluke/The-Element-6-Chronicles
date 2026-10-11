# Resonance Constructs — animation verification patch

This is a replacement-file patch for the existing The-Element-6-Chronicles project, not a standalone game.

## Included
- Updated construct assignment, activation/deactivation, and seven-slot attack profiles.
- Explicit seven-slot motion overrides for Fire Hero, Water Hero, Grass Hero, Ice Hero, Thunder Hero, Life, Mercy, and Death.
- Family-specific weapon artwork and attack effects for 30 construct weapon families.
- Fight-mode integration and fighter/renderer replacements.
- Automated tests and `ANIMATION_VERIFICATION_REPORT.md` describing exactly what was and was not verified.

## Install
1. Back up files with matching names in the project root.
2. Extract this ZIP into the existing project root and replace matching files.
3. Run `node --test resonanceConstructs.test.mjs resonanceConstructsAnimation.test.mjs resonanceConstructsAudit.test.mjs`.
4. Run `npm run build` in the project's normal development environment.

The animation smoke test relies on the original project modules imported by `renderer.js`, so run tests from the project root after applying the patch, not from the ZIP folder in isolation.

## Verification boundary
Automated syntax and renderer smoke tests pass. The renderer test covers 30 weapon families × seven attack slots × seven progress samples. Eight named characters have explicit profiles for all seven slots. Other characters currently use family-level choreography; they have not been manually verified as exact frame-by-frame recreations of every individual description. The Vite build and live gameplay have not been verified in this environment. See `ANIMATION_VERIFICATION_REPORT.md`.
