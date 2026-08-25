import { supabase } from './supabaseClient.js';

export const ONLINE_SPORT_MODES = [
  { id: 'soccer_ranked', label: 'SOCCER RANKED', sport: 'soccer', players: 2, ranked: true, description: '1v1 · server ELO' },
  { id: 'soccer_online', label: 'SOCCER ONLINE', sport: 'soccer', players: 2, ranked: false, description: '1v1 · casual' },
  { id: 'volleyball_2v2_online', label: 'VOLLEYBALL ONLINE', sport: 'volleyball', players: 4, ranked: false, description: '2v2 · four players required' },
  { id: 'volleyball_1v1_ranked', label: 'VOLLEYBALL RANKED 1V1', sport: 'volleyball', players: 2, ranked: true, description: '1v1 · server ELO' },
  { id: 'dodgeball_ranked', label: 'DODGEBALL RANKED', sport: 'dodgeball', players: 2, ranked: true, description: '1v1 · server ELO' },
  { id: 'dodgeball_online', label: 'DODGEBALL ONLINE', sport: 'dodgeball', players: 2, ranked: false, description: '1v1 · casual' },
  { id: 'banger_online', label: 'BANGER ONLINE', sport: 'banger', players: 6, ranked: false, description: '3v3 · six players required' },
];

export async function queueForOnlineSport({ mode, characterId, loadout }) {
  const { data, error } = await supabase.rpc('join_online_sport_queue', {
    p_mode: mode,
    p_character_id: characterId,
    p_loadout: loadout || {},
  });
  if (error) throw error;
  return data;
}

export async function getOnlineSportMatch(matchId) {
  const { data, error } = await supabase.from('online_sport_matches').select('*').eq('id', matchId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getOnlineSportPlayers(matchId) {
  const { data, error } = await supabase.from('online_sport_players').select('*').eq('match_id', matchId).order('slot');
  if (error) throw error;
  return data || [];
}

export function subscribeToOnlineSport(matchId, callback) {
  const channel = supabase.channel(`online-sport:${matchId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_sport_matches', filter: `id=eq.${matchId}` }, () => callback())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_sport_players', filter: `match_id=eq.${matchId}` }, () => callback())
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function heartbeatOnlineSport(matchId) {
  const { error } = await supabase.rpc('online_sport_heartbeat', { p_match_id: matchId });
  if (error) throw error;
}

export async function leaveOnlineSport(matchId) {
  if (!matchId) return;
  const { error } = await supabase.rpc('leave_online_sport_queue', { p_match_id: matchId });
  if (error) throw error;
}

export async function getMyOnlineSportRatings() {
  const { data, error } = await supabase.rpc('get_my_online_sport_ratings');
  if (error) throw error;
  return data || {};
}

export async function reportOnlineSportResult({ matchId, winnerTeam, finalFrame, checksum }) {
  const { data, error } = await supabase.rpc('report_online_sport_result', {
    p_match_id: matchId,
    p_winner_team: winnerTeam,
    p_final_frame: finalFrame,
    p_final_checksum: checksum,
  });
  if (error) throw error;
  return data;
}
