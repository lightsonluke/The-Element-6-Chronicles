FIRE HERO — FRAME-ACCURATE ANIMATION & INPUT FIX

Replace the matching files at the project root with the files in this ZIP.
Do not place them in a new nested folder; preserve the filenames and original paths.

What this fixes:
- Restores Flame's authored move timelines instead of compressing them to make the moves look faster.
- Uses the requested full durations at 60 FPS (startup + active + endlag):
  * Fire Hero's Rising: 10 + 2 + 13 = 25 frames
  * Fire Hero's Quake: 11 + 4 + 27 = 42 frames; two active bursts, with the second hit at the original stamp location after the hop-back
  * Fire Hero's Wave: 4 + 5 + 17 = 26 frames
  * Ascendant Breaker: 14 + 5 + 38 = 57 frames
  * Sunder Slam: 14 + 4 + 27 = 45 frames
  * Rend Strike: 17 + 7 + 37 = 61 frames
  * Return Return: 5 + 4 + 25 = 34 frames
  * Ultimate: Flame Unleashed: 30 + 15 + 48 = 93 frames
  * Meteor Pound: 15 + 6 + 31 = 52 frames
- Adds individual Fire Hero VFX/choreography for the rising corkscrew knee, delayed ground eruption, rolling pop-up strike, rising shoulder vault, two-foot slam, step-back palm lunge, midair roll/rebound, two-lane super projectile, and corkscrew meteor dive.
- Aligns Fire Hero's collision windows to the specified startup/active frames, and sets the specified damage values.
- Keeps the four-second charge indicator for grounded signatures/heavies without a hitbox; aerial attacks are not chargeable.
- Removes the extra signature/heavy cooldown bars and disables the extra Ground Pound cooldown. Endlag is the attack lockout.
- Directionless Heavy means Up Heavy when that character has one. Side Heavy requires left/right + Heavy; pressing Heavy alone will never silently turn into Side Heavy.
- Hides the red attack hitbox guide line in normal play.

Validation:
- JavaScript modules passed Node syntax checks.
- JSX files passed TypeScript's JSX parser/transpiler check.
- A full Vite build was not run because project dependencies are not installed in this environment.
