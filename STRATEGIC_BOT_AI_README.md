# Element 6 Strategic Bot AI — Complete Upgrade

This is the second-stage bot package. Apply it AFTER `Element6_Universal_Bot_Intelligence_Upgrade.zip` (the files in this package were merged against that upgrade).

## What this adds
- Persistent per-bot strategic memory
- Opponent tendency tracking
- Predicted target/ball positions
- Situation-dependent plans instead of nearest-target-only behavior
- Objective-aware CTF decisions
- BR zone/survival positioning
- Soccer possession/attack/defense positioning
- Volleyball predicted landing positioning and coverage
- Baseball fielding/running strategic correction
- Dodgeball threat prediction and strategic reactions
- Banger timing/banger-window decisions
- Team support/spacing and focus behavior
- Strategic overlays for normal fights, Team Battle, Custom Battle, and Story fights

## Difficulty
The strategic layer scales sensing, prediction, planning depth, adaptation, coordination, execution, and reaction separately. Honored is the top tier; it is intended to be extremely difficult because it makes better decisions rather than receiving impossible game information or teleport-like advantages.

## Files
`botStrategicBrain.js` is the main new system. The other files are targeted integrations. `botIntelligence.js` is included so the package remains self-contained with the first-stage intelligence layer.

## Validation
The package was assembled from the supplied project plus the first bot upgrade. A full Vite build cannot be claimed in this environment because the uploaded project does not include installed `node_modules`/Vite.
