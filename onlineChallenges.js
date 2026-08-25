import { supabase } from './supabaseClient.js';

export async function sendOnlineChallenge(playerId, mode) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  const { data, error } = await supabase.from('online_match_challenges').insert({ challenger_id: user.id, challenged_id: playerId, mode }).select().single();
  if (error) throw error;
  return data;
}

export async function answerOnlineChallenge(challengeId, accepted) {
  const { data, error } = await supabase.from('online_match_challenges').update({ status: accepted ? 'accepted' : 'declined' }).eq('id', challengeId).select().single();
  if (error) throw error;
  return data;
}
