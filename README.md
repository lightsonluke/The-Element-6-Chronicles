# Element 6 — Routing + Mobile Layout Test + Story Recovery Replacement Package

Copy these files into the repository root and overwrite files with the same names.

## Included

### 1. Mobile Mode layout test
- Adds `/mobile-controls`.
- Settings now has **OPEN MOBILE CONTROL LAYOUT TEST**.
- Shows a gameplay-style preview of the mobile controls.
- Drag controls to preview placement.
- Preview supports arrow mode and joystick mode.
- Supports dynamic joystick preview.
- Size and opacity controls are reflected in the preview.
- Uses the existing `mobileControls` settings structure so the real gameplay controls use the same saved layout.

### 2. URL paths
Adds stable browser paths for the requested screens and game-mode entry points, including:
- `/regular-battle`
- `/time-battle`
- `/super-only`
- `/sudden-death`
- `/bot-ranked`
- `/coin-battle`
- `/split-city-brawl`
- `/the-challenge`
- `/bot-battle`
- `/low-gravity`
- `/tournament`
- `/grand-circuit`
- `/2v2-teams`
- `/shapeshift`
- `/ranked`
- `/unranked`
- `/battle-royale`
- `/custom-rooms`
- `/lan-play`
- `/friends`
- `/chat`
- `/elo`
- `/story-mode`
- `/soccer`
- `/volleyball`
- `/baseball`
- `/parkour`
- `/rock-climbing`
- `/capture-the-flag`
- `/dodgeball`
- `/ziplining`
- `/banger`
- `/online-sports`
- `/soccer-ranked`
- `/soccer-online`
- `/volleyball-online`
- `/volleyball-ranked-1v1`
- `/dodgeball-ranked`
- `/dodgeball-online`
- `/banger-online`
- `/sandbox-mode`
- `/stage-editor`
- `/training`
- `/combo-trainer`
- `/tutorial`
- `/about-the-game`
- `/community-hub`
- `/settings`
- `/battle-pass`
- `/lore-library`
- `/equip`
- `/meet-characters`
- `/edit-characters`
- `/create-character`
- `/hero-codex`
- `/daily-quests`
- `/fight-quests`
- `/leaderboard`
- `/campaigns`
- `/shop`
- `/save`

The direct single-player fight mode URLs enter the existing character-select flow rather than an active match.

### 3. Story Mode recovery
Uses the previously working Story Mode recovery implementation:
- Per-save world seeds.
- Saved world seed restoration.
- Saved block modifications.
- Keyboard `Space` handling.
- Canvas focus on mouse interaction.
- Ambient wildlife spawning.
- Biome display support.
- Story-specific save fields include `worldSeed`.

## Important

This package is intentionally a replacement package, not a full repository replacement. Do not delete unrelated files.

A fresh production build could not be executed in this environment because the package manager/dependency registry was unavailable. Run your normal CI build after copying these files.
