ELEMENT 6 — GLITCH FIX REPLACEMENT PACKAGE

Replace only the files in this package in the project root.

Fixes in this package:
- true fullscreen 16:9 match surface with centered letterboxing instead of upper-left rendering
- super-attack renderer crash caused by an undefined facing variable
- exact Gen 1 attack collision geometry instead of generic rectangles
- Gen 1 attacks are authored facing-right and mirrored for left-facing attacks
- Thunder Hero Up Signature follows the supplied 12-frame reference; only the moving dot is a hitbox
- Gen 1 Up Heavy and Down Heavy attacks are fully wired into fighter state + rendering
- Recovery explicitly reuses the Up Signature animation
- Gen 1 supers use their actual authored shapes rather than a universal ring
- Volleyball startup crash fixed by restoring the required keybind imports
- all sports use logical Fight Mode keyboard actions rather than hard-coded gameplay keys
- soccer bot controller replaced with direct ball/goal/interception logic
- controller menu navigation now has a visible focus ring and can enter pause overlays
- super render calls pass the fighter's facing direction so directional supers mirror correctly

Validation:
- JavaScript/JSX syntax was checked with the TypeScript parser/transpiler for every modified JS/JSX file.
- A full production build was not run because project dependencies are not installed in this environment.
