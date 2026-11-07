ELEMENT 6 — CONTROLLER / SPORTS FIX PACKAGE

Replace the matching files in the repository root with the files in this ZIP.

Included:
- useGamepadMenuNav.js — makes spatial navigation stricter so a direction will not jump to a distant/unrelated control when there is no nearby target; improves held-direction repeat timing and smooth scrolling.
- DodgeballGame.jsx — adds a layered pause menu and Start/controller pause support; disables the ball streak trail that caused throw-line artifacts.
- VolleyballGame.jsx — disables the ball streak trail that caused line artifacts.
- BangerGame.jsx — disables the ball streak trail that caused top-of-screen smear artifacts.
- TeamMode.jsx — places the 2v2 pause menu in a full-match overlay layer.

IMPORTANT SCOPE NOTE:
This is a focused replacement package for the issues directly addressed by these edits. It does NOT yet resolve every item in the original bug list (ranked matchmaking/party presence, The Table start flow, CTF launch, battle-royale alive-player HUD/backdrop, custom-room spawn reset, soccer combat rules/AI, volleyball scoreboard presentation/AI, climbing/zipline effects and animation, or the remaining sports pause-menu coverage). Those require additional targeted investigation rather than replacing unrelated files or guessing at fixes.
