# Element 6 Daily Quest Update

Targeted replacement package for the daily quest system.

Changes:
- Daily quests now rotate from a larger pool with guaranteed hard + medium + flexible difficulty variety.
- Added hard objectives for Signature KOs, Ground Pound KOs, and emote-then-move actions.
- Added medium/easier objectives so the rotation is not always max difficulty.
- Daily progress is tracked from match results and includes match count, signature KOs, Ground Pound KOs, and emote-before-move events.
- Fighter KO attribution records whether the last hit was a signature or Ground Pound.
- Emote tracking records the first movement after an emote completes.
- Existing chest/reward behavior is preserved.
- Only quest-related/gameplay-stat files are included; no unrelated UI systems are replaced.

Replace these files in the project root:
- dailyQuests.js
- DailyQuests.jsx
- Game.jsx
- fighter.js
- PlatformFighter.jsx

The quest reset remains based on the existing local daily date key.
