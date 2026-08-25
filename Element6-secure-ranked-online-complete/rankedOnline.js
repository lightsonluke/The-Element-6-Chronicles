import { supabase } from './supabaseClient.js';

export async function getSignedInOnlinePlayer() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

export async function getMyRankedRating() {
  const { data, error } = await supabase.rpc('get_my_ranked_rating');
  if (error) throw error;
  return data || { rating: 1000, wins: 0, losses: 0, draws: 0, matches_played: 0 };
}

export async function matchmakeOnlineGame({ mode, characterId, loadout }) {
  const { data, error } = await supabase.rpc('matchmake_online_game', {
    p_mode: mode,
    p_character_id: characterId,
    p_loadout: loadout || {},
  });
  if (error) throw error;
  if (!data?.match?.id || !data?.role) throw new Error('Supabase returned an invalid matchmaking response.');
  return data;
}

export async function getOnlineMatch(matchId) {
  const { data, error } = await supabase.from('online_matches').select('*').eq('id', matchId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export function subscribeToOnlineMatch(matchId, callback) {
  const channel = supabase
    .channel(`online-match-row:${matchId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'online_matches',
      filter: `id=eq.${matchId}`,
    }, payload => callback(payload.new))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function heartbeatOnlineMatch(matchId) {
  const { error } = await supabase.rpc('online_match_heartbeat', { p_match_id: matchId });
  if (error) throw error;
}

export async function leaveOnlineMatch(matchId) {
  if (!matchId) return;
  const { error } = await supabase.rpc('leave_online_match', { p_match_id: matchId });
  if (error) throw error;
}

export async function reportRankedMatchResult({ matchId, winnerRole, finalFrame, checksum }) {
  const { data, error } = await supabase.rpc('report_ranked_match_result', {
    p_match_id: matchId,
    p_winner_role: winnerRole,
    p_final_frame: finalFrame,
    p_final_checksum: checksum,
  });
  if (error) throw error;
  return data;
}

export async function waitForRankedFinalization(matchId, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const match = await getOnlineMatch(matchId);
    if (match?.ranked_status === 'finalized') return { finalized: true, match };
    if (match?.ranked_status === 'disputed') return { finalized: false, disputed: true, match };
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  return { finalized: false, waiting_for_opponent: true };
}

