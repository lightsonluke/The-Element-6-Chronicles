import { supabase } from './supabaseClient.js';

let activeCloudOwnerId = null;
const cloudRevisions = new Map();
const saveQueues = new Map();
const conflictedOwners = new Set();

export function setCloudSaveOwner(userId) {
  activeCloudOwnerId = userId || null;
}

export function getCloudSaveOwner() {
  return activeCloudOwnerId;
}

export async function getCloudUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function loadCloudProgress() {
  const user = await getCloudUser();
  if (!user) return null;
  activeCloudOwnerId = user.id;
  const { data, error } = await supabase
    .from('user_progress')
    .select('progress_json,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  cloudRevisions.set(user.id, data?.updated_at || null);
  conflictedOwners.delete(user.id);
  return data?.progress_json || null;
}

export async function saveCloudProgress(progress, ownerId = activeCloudOwnerId) {
  if (!ownerId) return false;
  if (conflictedOwners.has(ownerId)) throw new Error('Progress changed in another session. Reload the account data before saving again.');
  const previous = saveQueues.get(ownerId) || Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const user = await getCloudUser();
    if (!user || user.id !== ownerId || activeCloudOwnerId !== ownerId) return false;
    const { data, error } = await supabase.rpc('save_element6_progress_v2', {
      p_progress: progress,
      p_expected_updated_at: cloudRevisions.get(ownerId) || null,
    });
    if (error) throw error;
    if (data?.conflict) {
      cloudRevisions.set(ownerId, data.updated_at || null);
      conflictedOwners.add(ownerId);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('element6-cloud-save-conflict'));
      throw new Error('Progress changed in another session. Reload the account data before saving again.');
    }
    if (!data?.saved) throw new Error('The account save was not confirmed by the server.');
    cloudRevisions.set(ownerId, data.updated_at || null);
    return true;
  });
  saveQueues.set(ownerId, next);
  try { return await next; }
  finally { if (saveQueues.get(ownerId) === next) saveQueues.delete(ownerId); }
}
