# Gameplay launch and movement fix package

Copy these files into the matching project root paths, replacing the existing versions.

This increment addresses the reported launch paths for Sports/Soccer, Battle Royale, The Table, and local 2v2 Team Mode; limits super-move visual effects so they cannot cover the whole gameplay screen; and restores the shared gradual jump, dash afterimage/fade, and air-dive poses by passing live fighter motion into the existing pose renderer.

The updated files also pass current dash state through the legacy online snapshot format. The Table now shows a truthful preparing/round status instead of a blank or misleading player-count screen while the server advances the match.

No build or game-mode test suite was run in this increment. The source checkout has no installed dependencies and no Node executable available in this environment.
