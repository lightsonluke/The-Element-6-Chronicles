import { supabase } from './supabaseClient.js';

// Use this one function for account creation AND Settings username changes.
// The SQL RPC updates auth metadata plus every stored display-name copy used
// by the social/leaderboard systems, so stale names cannot reappear later.
export async function syncCurrentUsername(username) {
  const clean = String(username || '').trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 20) throw new Error('Username must be 2–20 characters.');
  const { data: auth, error: authError } = await supabase.auth.updateUser({ data: { username: clean, full_name: clean } });
  if (authError) throw authError;
  const { error } = await supabase.rpc('sync_current_username', { p_username: clean });
  if (error) throw error;
  return auth.user;
}
