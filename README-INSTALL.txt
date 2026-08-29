ELEMENT 6 — GLOBAL MATCH + ONLINE FOUNDATION UPDATE

1. Run Supabase-battle-royale-custom-rooms-and-elo-search.sql, then Supabase-account-bound-save-codes.sql in Supabase SQL Editor.
2. Upload every other file in this folder to the matching location in your GitHub game repository.
   - Files in rollback/ go in your existing rollback/ folder.
   - public/ files go in public/.
3. Let GitHub replace same-named files, commit, then wait for the Pages deployment.

Included fixes
- ELO username search supports partial names and shows a player outside the top 100.
- Paid Shop ONLY: category browsing and new reduced prices. Token-shop tabs remain untouched.
- Offline opponent volleyball bots use bump returns only.
- A fight that reaches 0:00 resolves by stocks, then lower damage, then a true draw.
- A power cooldown does not tick while the power is active.
- Core fight, Battle Royale, and volleyball canvases use the full display.
- Icon rendering is baseline-safe and no longer relies on a duplicate-key generated icon map.
- The SQL and helper files provide Supabase room records plus Realtime transports for Battle Royale and custom rooms.
- Silver's Hardened power is exactly 50% incoming-damage and knockback reduction.
- Rollback fight recovery has a 2.5-second one-recovery guard, preventing repeated RESYNCING overlays.
- Save codes are server-stored and account-bound. Call invalidate_my_element6_save_codes('purchase') from your verified payment webhook and invalidate_my_element6_save_codes('trade_or_gift') after a verified trade/gift.

Important
The Battle Royale and Custom Room SQL/helpers are the secure multiplayer foundation. They must be connected to the existing BattleRoyaleLobby and CustomRoomLobby scene lifecycle in a follow-up replacement, because those current components still call localBackend. Do not mix browser-local rooms with these Supabase rooms: use the Supabase functions for cross-device play.
