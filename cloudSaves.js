import { supabase } from './supabaseClient.js';

let activeCloudOwnerId = null;
let cloudOwnerReady = false;
const cloudRevisions = new Map();
const saveQueues = new Map();
const conflictedOwners = new Set();

export function setCloudSaveOwner(userId) {
  const nextOwnerId = userId || null;
  if (activeCloudOwnerId !== nextOwnerId) cloudOwnerReady = false;
  activeCloudOwnerId = nextOwnerId;
  if (!nextOwnerId) cloudOwnerReady = false;
}

export function markCloudSaveOwnerReady(userId) {
  if (userId && activeCloudOwnerId === userId) cloudOwnerReady = true;
}

export function isCloudSaveOwnerReady(userId = activeCloudOwnerId) {
  return Boolean(userId && activeCloudOwnerId === userId && cloudOwnerReady);
}

export function invalidateCloudSaveOwner() {
  cloudOwnerReady = false;
  activeCloudOwnerId = null;
}

export function getCloudSaveOwner() {
  return activeCloudOwnerId;
}

// Server-side RPCs that mutate the account snapshot return the new revision.
// Keep the optimistic-save queue on that revision so the next ordinary save
// does not overwrite or conflict with the authoritative transaction.
export function acceptCloudProgressRevision(userId, updatedAt) {
  if (!userId || !updatedAt || activeCloudOwnerId !== userId) return false;
  cloudRevisions.set(userId, updatedAt);
  conflictedOwners.delete(userId);
  return true;
}

export async function getCloudUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function loadCloudProgress(expectedUserId = activeCloudOwnerId) {
  // A guest session has no account snapshot to read. Require an explicit,
  // currently active account owner before making any account-data request.
  if (!expectedUserId || !activeCloudOwnerId || expectedUserId !== activeCloudOwnerId) return null;
  const user = await getCloudUser();
  if (!user || user.id !== expectedUserId) return null;
  if (activeCloudOwnerId !== user.id) return null;
  const { data, error } = await supabase
    .from('user_progress')
    .select('progress_json,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  // A slow read from an account that was switched away from must not seed the
  // revision cache used by the newly active account.
  const currentUser = await getCloudUser();
  if (!currentUser || currentUser.id !== user.id || activeCloudOwnerId !== user.id) return null;
  cloudRevisions.set(user.id, data?.updated_at || null);
  conflictedOwners.delete(user.id);
  return data?.progress_json || null;
}

export async function saveCloudProgress(progress, ownerId = activeCloudOwnerId) {
  if (!ownerId) return false;
  if (!isCloudSaveOwnerReady(ownerId)) return false;
  if (conflictedOwners.has(ownerId)) throw new Error('Progress changed in another session. Reload the account data before saving again.');
  const previous = saveQueues.get(ownerId) || Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const user = await getCloudUser();
    if (!user || user.id !== ownerId || activeCloudOwnerId !== ownerId || !cloudOwnerReady) return false;
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
