Element 6 Chronicles — checklist replacement package

Changed:
- Community Hub server list now discovers active regional servers with >=1 player and sorts by player count descending.
- Presence records now carry a broad matchmaking region.
- Battle Pass keeps 50 tiers, has star rewards across the unified all-generation roster, and Premium grants a second reward on every tier.
- Stage Editor includes the global World Stages browser plus a quick-start toolbar while retaining the existing editor feature set/help.
- Story Mode and Baseball have fullscreen controls.
- Fight/music rotation now explicitly covers every match-capable scene and uses the full fight library when not overridden by a custom track.
- Save Codes use the account-bound Supabase RPCs included in the SQL file.
- Sandbox supports individual stock counts per fighter.

Notes:
- Run the included Supabase account-bound save-code SQL in the same backend used by the app if it has not already been applied.
- Existing sport/fight pre-match flows are preserved; SoccerMode and SportsShell already use PrematchAnimation.
