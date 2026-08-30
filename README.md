# Element 6 — match-screen + bot unlock replacement package

This package contains the actual modified source files from the attached Element 6 repository.

## Replace only these files

Copy the files in this folder into the repository root, replacing files with the same names:

- `index.css`
- `PlatformFighter.jsx`
- `RollbackOnlineFight.jsx`
- `OnlineSoccerFight.jsx`
- `OnlineSportsMatch.jsx`
- `ActualSportsOnlineMatch.jsx`
- `SportsRollbackArena.jsx`
- `BattleRoyaleEngine.jsx`
- `CustomRoomGame.jsx`
- `SoccerFighter.jsx`
- `DodgeballGame.jsx`
- `VolleyballGame.jsx`
- `BaseballGame.jsx`
- `BangerGame.jsx`
- `GCMatch.jsx`
- `UniversalCharacterSelect.jsx`
- `Game.jsx`

## Fixes implemented

### 1. Full-screen match surface
The shared `.el6-match-viewport` is applied to the affected offline/online fight and sports surfaces so the gameplay canvas uses the actual viewport rather than a scaled card/overlay. This covers the offline fighter, rollback online fight, online soccer, online sports, offline soccer, volleyball, dodgeball, baseball, banger, Grand Circuit match, Battle Royale, Custom Room matches, and the online sports rollback surface.

### 2. Pause button placement
Where a match already has a pause button, it is assigned `.el6-match-pause-button`, which places that existing button in the top-left corner. Modes without a pause button do not receive a new one.

### 3. Bot character unlock validation
`UniversalCharacterSelect` explicitly treats a CPU slot as non-human for unlock validation. A bot may use a character the account has not unlocked. The human player's selected character remains subject to the normal unlock check.

`Game.jsx` also guards the start callback so the player's own locked character cannot bypass the unlock requirement while the CPU character is not checked against the player's unlock inventory.

## Important

These are replacement source files, not a full repository. Do not delete unrelated files. Test on a branch first and run the normal project build before merging.
