# Element 6 — Online/Offline Nametag Patch

## Behavior
- Offline matches show the character nametag only, using the existing Gen 1–4 naming rules from `allCharacters.js`.
- Online matches show the player's username on the line above the character nametag.
- Online username does not replace the character name.
- Custom Rooms use the room player's username above the character name.
- Existing character data is not rewritten by this patch.

## Replace
Copy these files into the project root and overwrite matching files:
- inGameNametags.js (new)
- PlatformFighter.jsx
- CustomBattle.jsx
- TeamMode.jsx
- StoryBattle.jsx
- BattleRoyaleEngine.jsx
- CustomRoomGame.jsx
- OnlineFight.jsx
- RollbackOnlineFight.jsx
- SoccerFighter.jsx
- OnlineSoccerFight.jsx
- VolleyballGame.jsx
- BaseballGame.jsx
- DodgeballGame.jsx
- BangerGame.jsx

## Note
OnlineFight and OnlineSoccerFight retain their existing username inputs/data flow; if a caller does not provide a username, the visual fallback is YOU/OPPONENT rather than replacing the character name.
