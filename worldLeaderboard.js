import { supabase } from './supabaseClient.js';

export async function loadWorldLeaderboard(mode) {
  const { data, error } = await supabase
    .from('element6_world_scores')
    .select('user_id,username,mode,score,score_meta,updated_at')
    .eq('mode', mode)
    .limit(300);
  if (error) throw error;
  return (data || []).sort((a,b) =>
    mode === 'rockclimb' ? Number(a.score) - Number(b.score) : Number(b.score) - Number(a.score)
  ).map((row, i) => ({
    ...row,
    id: `${row.user_id}_${row.mode}`,
    user_name: row.username,
    created_date: row.updated_at,
    distance: row.score,
    time_ms: mode === 'rockclimb' ? Number(row.score) : undefined,
    score_meta: row.score_meta || {},
    rank: i + 1
  }));
}
