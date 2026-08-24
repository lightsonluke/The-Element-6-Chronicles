import { supabase } from './supabaseClient.js';

export async function getCloudUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function loadCloudProgress() {
  const user = await getCloudUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('user_progress')
    .select('progress_json')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.progress_json || null;
}

export async function saveCloudProgress(progress) {
  const user = await getCloudUser();
  if (!user) return false;
  const { error } = await supabase
    .from('user_progress')
    .upsert({ user_id: user.id, progress_json: progress, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
  return true;
}
