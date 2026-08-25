import { supabase } from './supabaseClient.js';

export async function getHubUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Sign in to enter the online Community Hub.');
  const { data: profile } = await supabase.from('player_profiles').select('username').eq('user_id', user.id).maybeSingle();
  return { id: user.id, username: profile?.username || user.email?.split('@')[0] || 'Player' };
}

export async function updateHubPresence(payload) {
  const me = await getHubUser();
  const { error } = await supabase.from('online_hub_presence').upsert({ user_id: me.id, username: me.username, updated_at: new Date().toISOString(), ...payload }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function clearHubPresence() {
  const me = await getHubUser();
  const { error } = await supabase.from('online_hub_presence').delete().eq('user_id', me.id);
  if (error) throw error;
}

export async function loadHubPlayers(serverCode, myId) {
  const cutoff = new Date(Date.now() - 60000).toISOString();
  const { data, error } = await supabase.from('online_hub_presence').select('*').eq('hub_server', serverCode).gte('updated_at', cutoff).neq('user_id', myId);
  if (error) throw error;
  return data || [];
}

export function subscribeToHub(serverCode, refresh) {
  const channel = supabase.channel(`hub:${serverCode}`).on('postgres_changes', { event: '*', schema: 'public', table: 'online_hub_presence', filter: `hub_server=eq.${serverCode}` }, refresh).subscribe();
  return () => supabase.removeChannel(channel);
}
