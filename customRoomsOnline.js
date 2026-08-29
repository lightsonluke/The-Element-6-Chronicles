import { supabase } from './supabaseClient.js';

export async function createCustomRoom(settings) {
  const { data, error } = await supabase.rpc('create_element6_custom_room', { p_settings: settings || {} });
  if (error) throw error;
  return data;
}

export async function joinCustomRoom(roomCode, loadout) {
  const { data, error } = await supabase.rpc('join_element6_custom_room', { p_room_code: String(roomCode || '').toUpperCase(), p_loadout: loadout || {} });
  if (error) throw error;
  return data;
}

// Clients use this only for network messages. Player state is not written by
// the browser into a database table, which prevents one player overwriting the
// other player's character or position.
export function openCustomRoomTransport(roomId, { onInput, onSnapshot } = {}) {
  const channel = supabase.channel(`element6-custom:${roomId}`, { config: { broadcast: { self: false } } });
  channel.on('broadcast', { event: 'input' }, ({ payload }) => onInput?.(payload))
    .on('broadcast', { event: 'snapshot' }, ({ payload }) => onSnapshot?.(payload)).subscribe();
  return {
    input: payload => channel.send({ type: 'broadcast', event: 'input', payload }),
    snapshot: payload => channel.send({ type: 'broadcast', event: 'snapshot', payload }),
    close: () => supabase.removeChannel(channel),
  };
}
