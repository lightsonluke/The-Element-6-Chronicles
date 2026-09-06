import { supabase } from './supabaseClient.js';

// Supabase Realtime transport for Battle Royale. The host owns simulation and
// publishes compact snapshots; every player publishes only their own input.
export async function findBattleRoyaleMatch(loadout) {
  const { data, error } = await supabase.rpc('find_or_create_element6_battle_royale', { p_loadout: loadout || {} });
  if (error) throw error;
  return data;
}

export function openBattleRoyaleTransport(matchId, { onInput, onSnapshot, onPresence } = {}) {
  const channel = supabase.channel(`element6-br:${matchId}`, { config: { broadcast: { self: false }, presence: { key: matchId } } });
  channel
    .on('broadcast', { event: 'input' }, ({ payload }) => onInput?.(payload))
    .on('broadcast', { event: 'snapshot' }, ({ payload }) => onSnapshot?.(payload))
    .on('presence', { event: 'sync' }, () => onPresence?.(channel.presenceState()))
    .subscribe();
  return {
    input: payload => channel.send({ type: 'broadcast', event: 'input', payload }),
    snapshot: payload => channel.send({ type: 'broadcast', event: 'snapshot', payload }),
    track: data => channel.track(data),
    close: () => supabase.removeChannel(channel),
  };
}



export async function getBattleRoyaleMatch(matchId) {
  const { data, error } = await supabase.from('online_battle_royale_matches').select('*').eq('id', matchId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getBattleRoyalePlayers(matchId) {
  const { data, error } = await supabase.from('online_battle_royale_players').select('*').eq('match_id', matchId).order('player_slot');
  if (error) throw error;
  return (data || []).map(p => ({
    user_id: p.user_id,
    slot: p.player_slot,
    username: p.loadout?.username || 'Player',
    char_id: p.loadout?.char_id || 'yellow',
    element: p.loadout?.element || 'basic',
    accessories: p.loadout?.equippedAccessories || p.loadout?.accessories || [],
    equippedSkins: p.loadout?.equippedSkins || {},
    equippedShikigami: p.loadout?.equippedShikigami || {},
    is_bot: false,
  }));
}

export function subscribeToBattleRoyale(matchId, callback) {
  const channel = supabase.channel(`element6-br-lobby:${matchId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_battle_royale_matches', filter: `id=eq.${matchId}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_battle_royale_players', filter: `match_id=eq.${matchId}` }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function startBattleRoyale(matchId, settings = {}) {
  const { data, error } = await supabase.rpc('start_element6_battle_royale', { p_match_id: matchId, p_settings: settings || {} });
  if (error) throw error;
  return data;
}

export async function heartbeatBattleRoyale(matchId) {
  const { error } = await supabase.rpc('battle_royale_heartbeat', { p_match_id: matchId });
  if (error) throw error;
}

export async function leaveBattleRoyale(matchId) {
  if (!matchId) return;
  const { error } = await supabase.rpc('leave_element6_battle_royale', { p_match_id: matchId });
  if (error) throw error;
}


export async function finishBattleRoyale(matchId, result = {}) {
  const { data, error } = await supabase.rpc('finish_element6_battle_royale', { p_match_id: matchId, p_result: result || {} });
  if (error) throw error;
  return data;
}
