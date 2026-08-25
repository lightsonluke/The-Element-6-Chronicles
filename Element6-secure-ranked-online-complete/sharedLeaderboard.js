import { supabase } from './supabaseClient.js';

// ranked_elo is intentionally excluded: only the ranked-result SQL may write it.
const columns = ['total_xp', 'soccer_xp', 'combat_xp', 'wins', 'losses', 'soccer_goals', 'soccer_saves', 'combat_kills', 'combat_deaths'];

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
  const [{ data, error }, ratingsResult] = await Promise.all([
    supabase.from('shared_leaderboard').select('*').order('total_xp', { ascending: false }).limit(200),
    supabase.from('ranked_ratings').select('user_id,rating'),
  ]);
  if (error) throw error;
  const ratings = new Map((ratingsResult.data || []).map(row => [row.user_id, row.rating]));
  return (data || []).map(row => ({ ...row, ranked_elo: ratings.get(row.user_id) ?? row.ranked_elo ?? 1000, user_name: row.username }));
}
