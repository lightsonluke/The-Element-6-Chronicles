ELEMENT 6 — CLAN MATCH XP FIX

WHY THIS WAS BROKEN
The clan SQL already had element6_record_clan_activity(), but that function was only a hook. It was NOT automatically called when a local match ended. So playing Regular Battle vs a bot could finish the match without changing clan XP.

WHAT THIS PACKAGE DOES
1. Adds a secure element6_record_clan_match_completion() RPC using auth.uid().
2. Automatically awards 5 clan XP when existing online combat matches finish.
3. Automatically awards 5 clan XP when existing online sports matches finalize.
4. Backfills already-finished online matches once, without double-awarding the same match.
5. Provides clanMatchXp.js for OFFLINE/local modes. Local matches cannot be detected by Supabase unless the game calls the RPC when the match actually ends.

OFFLINE MODES THAT MUST CALL THE HELPER AT MATCH END
- regularbattle
- bot_ranked
- time_battle

ONLINE MODES ARE AUTOMATIC WHERE THE MATCH IS STORED IN THE EXISTING SUPABASE MATCH TABLES.

CLIENT HOOK
At the actual successful match-completion code path, call:

await recordClanMatchCompletion(supabase, 'regularbattle', matchId);

Use the correct mode for each mode:
- 'regularbattle'
- 'bot_ranked'
- 'time_battle'

IMPORTANT
Do NOT call this when a match merely starts, when the player enters a lobby, or when they quit before completion. It belongs at the same point where the game declares the match finished.

The helper intentionally catches RPC errors so a clan-tracking failure cannot crash or block the match itself.
