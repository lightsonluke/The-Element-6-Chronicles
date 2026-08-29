import { supabase } from './supabaseClient.js';

// Server-backed personal-best scoreboard used by the solo world activities.
// The database, rather than a browser-local record, decides whether a score is
// better and returns its rank.
export async function submitWorldScore(mode, score, meta = {}) {
  const { data, error } = await supabase.rpc('submit_element6_world_score', {
    p_mode: mode,
    p_score: Number(score) || 0,
    p_meta: meta,
  });
  if (error) throw error;
  return data || {};
}
