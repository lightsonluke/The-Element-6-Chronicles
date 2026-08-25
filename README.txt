ELEMENT 6 — BUILD REPAIR

This fixes the exact two build messages in the screenshot.

1. Upload BattleRoyaleEngine.jsx to the ROOT of your GitHub repository and choose Replace.
2. Open the rollback folder in your GitHub repository.
3. Upload element6Simulation.js INTO that rollback folder and choose Replace.
   The final GitHub path must be exactly:
   rollback/element6Simulation.js
   It must NOT be at the repository root.
4. Commit the changes and wait for the action to finish.

Why it failed:
- RollbackOnlineFight.jsx needs getOnlineStagePlatforms.
- That export is in the replacement element6Simulation.js, but GitHub still had an older copy in rollback/.
- BattleRoyaleEngine.jsx had the word "time" twice in the same saved object.
