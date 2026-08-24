import { supabase } from './supabaseClient.js';

const columns = ['total_xp', 'soccer_xp', 'combat_xp', 'ranked_elo', 'wins', 'losses', 'soccer_goals', 'soccer_saves', 'combat_kills', 'combat_deaths'];

export async function syncSharedLeaderboard(localEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const meta = user.user_metadata || {};
  const entry = { user_id: user.id, username: meta.username || meta.full_name || (user.email || 'Player').split('@')[0], updated_at: new Date().toISOString() };
  columns.forEach(key => { entry[key] = localEntry[key] || 0; });
  const { error } = await supabase.from('shared_leaderboard').upsert(entry, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function loadSharedLeaderboard() {
  const { data, error } = await supabase.from('shared_leaderboard').select('*').order('total_xp', { ascending: false }).limit(200);
  if (error) throw error;
  return (data || []).map(row => ({ ...row, user_name: row.username }));
}
