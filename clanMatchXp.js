// ELEMENT 6 - CLAN MATCH XP CLIENT HOOK
//
// Add ONE call to this helper at the point where a match is genuinely finished.
// This is required for local/offline modes because Supabase cannot see a match
// that exists only inside the browser.
//
// Example:
// await recordClanMatchCompletion(supabase, 'regularbattle', matchId);
//
// The SQL endpoint uses auth.uid(), so the browser cannot award XP to another
// account by supplying another user's id.

export async function recordClanMatchCompletion(
  supabase,
  mode,
  sourceMatchId = null,
  xp = 5
) {
  if (!supabase) return { recorded: false, reason: 'missing_supabase' };

  const { data, error } = await supabase.rpc(
    'element6_record_clan_match_completion',
    {
      p_mode: mode,
      p_source_match_id: sourceMatchId,
      p_xp: xp,
    }
  );

  if (error) {
    // Clan XP must never make the actual match fail.
    console.warn('[Clan XP] Could not record match:', error);
    return { recorded: false, reason: 'rpc_error', error };
  }

  return data ?? { recorded: false, reason: 'empty_response' };
}
