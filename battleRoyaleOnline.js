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

