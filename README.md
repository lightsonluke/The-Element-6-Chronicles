# Element 6 — Ranked ELO + Offline Sports Fix

## Replace these files only

Copy these files into the same directory in the Element 6 repository and replace the existing files with the same names:

- `MainMenu.jsx`
- `SoccerMode.jsx`
- `SoccerFighter.jsx`
- `VolleyballGame.jsx`
- `BaseballGame.jsx`
- `BangerGame.jsx`
- `SplitCityParkour.jsx`
- `CaptureTheFlag.jsx`

Do not replace the rest of the repository.

## Fixes

### 1. Main-menu ELO bar
- Removes the Bot Ranked ELO value from the top menu bar.
- Changes `Online:` to `Ranked ELO:`.
- Keeps the displayed value tied to the online ranked rating.
- Applies to desktop and mobile menu layouts.

### 2. Offline sports pause
The replacement keeps/adds the offline sports pause behavior from the existing sports patch for:
- Soccer
- Volleyball
- Baseball
- Banger
- Split City Parkour
- Capture the Flag

The repository already has pause implementations in Rock Climbing, Ziplining, and Dodgeball, so those files are intentionally not replaced here.

For Volleyball, Baseball, Banger, Split City Parkour, and Capture the Flag, the pause button/keyboard pause freezes the simulation and places the pause UI above the match canvas.

Soccer uses its existing `SoccerFighter` pause system (`Pause (ESC)`).

### 3. Locked CPU characters are allowed
CPU characters are not subject to the local player's unlock restriction. A locked character selected/generated for a bot must still load into the match normally.

Human character selections remain subject to the normal unlock validation.

### 4. Soccer older-generation character fix
`SoccerFighter.jsx` now resolves characters through the shared `sports.js` playable roster before the legacy hero/villain/guardian lists.

This is important for characters such as:
- `g3_masaru` — Masaru Hai

A bot using Masaru Hai (or another older-generation playable sports character) will now render and play as the selected character instead of failing character resolution and falling back incorrectly.

### 5. Other offline sports
The supplied sports architecture already allows CPU lineups to use the full playable roster while limiting the human player's selection to unlocked characters. This replacement preserves that behavior.

## Important

This package does **not** change online matchmaking/netcode, Stripe, Supabase, or unrelated game modes.

It is intended as a targeted replacement package for the requested menu ELO, offline sports pause, and locked-CPU-character fixes.
