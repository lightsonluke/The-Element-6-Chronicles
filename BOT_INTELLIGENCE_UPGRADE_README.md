# Element 6 Universal Bot Intelligence Upgrade

This replacement adds a shared intelligence layer without removing the existing per-mode AI systems.

## Added
- `botIntelligence.js`
  - shared difficulty skill profiles
  - world observation and short-term memory
  - movement prediction
  - landing prediction
  - target scoring
  - high-level fight tactics
  - advanced Dodgeball threat prediction
  - advanced Banger timing

## Integrated
- `botAI.js`: Honored and Insane now receive an additional predictive tactical layer before the legacy combat planner.
- `DodgeballGame.jsx`: advanced difficulties can use predicted incoming-ball positions instead of reacting only to current position.
- `BangerGame.jsx`: Honored/Insane can use the shared timing/banger decision layer.

Team Battle, Capture the Flag, Custom Battle, Story battles, and other fight-based modes that already call `updateAI()` inherit the upgraded fight brain automatically.

Battle Royale and Soccer retain their existing specialized environment/gameplay AI in this package rather than replacing those large systems blindly; the shared intelligence module is available for their next targeted integration.

Honored is intentionally the highest skill tier: it gets the strongest prediction, adaptation, execution, and tactical decision profile. It is not implemented as a simple speed/reaction multiplier.
