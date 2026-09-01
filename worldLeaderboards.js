import { supabase } from './supabaseClient.js';

const WORLD_MODES = new Set(['parkour', 'rockclimb', 'zipline']);

// Submit a personal best to the authoritative Element 6 world scoreboard.
// The Supabase RPC owns the insert/update decision so the browser cannot
// manufacture another user's score. The same function is used by all three
// world activities.
export async function submitWorldScore(mode, score, meta = {}) {
  const normalizedMode = String(mode || '').trim().toLowerCase();
  if (!WORLD_MODES.has(normalizedMode)) throw new Error(`Unsupported world score mode: ${normalizedMode}`);
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0) throw new Error('Invalid world score');

  const { data, error } = await supabase.rpc('submit_element6_world_score', {
    p_mode: normalizedMode,
    p_score: numericScore,
    p_meta: meta && typeof meta === 'object' ? meta : {},
  });
  if (error) throw error;
  return data || {};
}
