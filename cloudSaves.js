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

export function isAccountCloudUser(user) {
  if (!user?.id) return false;
  const userMeta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  const guestFlag = value => value === true || value === 'true' || value === 'guest' || value === 'anonymous';
  if (guestFlag(user.is_anonymous) || guestFlag(userMeta.is_anonymous) || guestFlag(userMeta.isGuest) || guestFlag(userMeta.guest)) return false;
  const identityProviders = Array.isArray(user.identities)
    ? user.identities.map(identity => String(identity?.provider || '').toLowerCase()).filter(Boolean)
    : [];
  const providers = Array.isArray(appMeta.providers)
    ? appMeta.providers.map(provider => String(provider || '').toLowerCase()).filter(Boolean)
    : [];
  const knownProviders = identityProviders.length ? identityProviders : providers;
  if (knownProviders.length && knownProviders.every(provider => provider === 'anonymous')) return false;
  if (String(appMeta.provider || '').toLowerCase() === 'anonymous' && !knownProviders.some(provider => provider !== 'anonymous')) return false;
  if (String(userMeta.provider || '').toLowerCase() === 'anonymous') return false;
  return true;
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
  // getSession reads the browser tab's stored auth state. Do not make an auth
  // verification request for a guest that has no session at all.
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const sessionUser = data?.session?.user;
  if (!isAccountCloudUser(sessionUser)) return null;
  const { data: verified, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = verified?.user;
  return user?.id === sessionUser.id && isAccountCloudUser(user) ? user : null;
}

// Read the tab's locally stored Supabase session before touching account data.
// A guest tab has no session, so it never reaches getUser() (which may make an
// auth network request) or the user_progress table/RPCs below.
async function getAuthenticatedCloudUser(expectedUserId) {
  if (!expectedUserId || activeCloudOwnerId !== expectedUserId) return null;
  // Confirm the stored session with Supabase only for an explicitly signed-in
  // account, then fence delayed auth responses against sign-out/account swaps.
  const user = await getCloudUser();
  if (!user?.id || user.id !== expectedUserId || activeCloudOwnerId !== expectedUserId) return null;
  return user;
}

export async function loadCloudProgress(expectedUserId = activeCloudOwnerId) {
  // Guest tabs keep local progress only. Do not request or synchronize any
  // account snapshot unless this tab has an authenticated owner.
  if (!expectedUserId || !activeCloudOwnerId || expectedUserId !== activeCloudOwnerId) return null;
  const user = await getAuthenticatedCloudUser(expectedUserId);
  if (!user) return null;
  if (activeCloudOwnerId !== user.id) return null;
  const { data, error } = await supabase
    .from('user_progress')
    .select('progress_json,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  // A slow read from an account that was switched away from must not seed the
  // revision cache used by the newly active account.
  const currentUser = await getAuthenticatedCloudUser(user.id);
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
    const user = await getAuthenticatedCloudUser(ownerId);
    if (!user || activeCloudOwnerId !== ownerId || !cloudOwnerReady) return false;
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
