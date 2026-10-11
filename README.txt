RESONANCE CONSTRUCT ATTACK VISUAL ALIGNMENT FIX

Replace renderer.js in the project's root with this file.

What this patch fixes:
- Restores the player-local weapon canvas transform before rendering attack smears that use world coordinates. This prevents attack effects from being translated/mirrored a second time and appearing far from the character.
- Clips the visible construct smear to the exact active construct hitbox geometry supplied by getConstructAttackGeometry(). This keeps the painted attack and the Settings > Hitboxes overlay aligned.
- Centers projectile visuals on the active geometry used by collision instead of calculating a separate, potentially displaced position.
- Makes layered smear strokes much thicker and more readable while keeping the effect clipped to the active shape.

IMPORTANT DEPENDENCY:
This is a focused renderer.js replacement for the previously provided construct animation/hitbox patch. The matching resonanceConstructs.js, fighter.js, and Settings/overlay changes from that patch must already be installed for construct collision and the Settings > Hitboxes toggle to use getConstructAttackGeometry().

Checks performed: node --check renderer.js; resonanceConstructs.test.mjs and resonanceConstructsAnimation.test.mjs passed. A production build and live browser match were not run.
