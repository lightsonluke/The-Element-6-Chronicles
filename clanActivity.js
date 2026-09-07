// Element 6 clan activity integration adapter.
//
// Call recordClanMatchActivity AFTER the existing game/match system has
// authoritatively finalized a match. Do not call it merely when a match opens.
//
// This adapter intentionally covers every requested qualifying category.
// The actual game files should call this once per completed match.
//
// XP is clan activity XP, not player ELO.

const MATCH_XP = {
  offline_regularbattle: 10,
  bot_ranked: 12,
  time_battle: 12,
  ranked: 15,
  unranked: 10,
  soccer_offline: 10,
  soccer_online: 12,
  volleyball_offline: 10,
  volleyball_online: 12,
  dodgeball_offline: 10,
  dodgeball_online: 12,
  banger_online: 12,
  battle_royale_online: 15,
};

export async function recordClanMatchActivity({
  supabase,
  userId,
  mode,
  matchId,
  result = 'played',
}) {
  if (!supabase || !userId || !mode) return { recorded: false, skipped: true };

  const xp = MATCH_XP[mode] ?? 10;

  return supabase.rpc('element6_record_clan_activity', {
    p_user_id: userId,
    p_event_key: `match:${mode}:${result}`,
    p_xp: xp,
    p_source_match_id: matchId ? String(matchId) : null,
  });
}

/*
Recommended hook locations:

RegularBattle:
  after the offline match result is finalized:
  await recordClanMatchActivity({ supabase, userId, mode:'offline_regularbattle', matchId });

Ranked vs bot:
  after the bot match result is finalized:
  mode:'bot_ranked'

Time Battle:
  mode:'time_battle'

Online Ranked / Unranked:
  only after the authoritative match result is finalized:
  mode:'ranked' or mode:'unranked'

Sports:
  soccer_offline / soccer_online
  volleyball_offline / volleyball_online
  dodgeball_offline / dodgeball_online

Battle Royale:
  mode:'battle_royale_online'

Do NOT put this in render loops, input handlers, animation loops, or matchmaking
polling. It should fire exactly once for a completed match.
*/
