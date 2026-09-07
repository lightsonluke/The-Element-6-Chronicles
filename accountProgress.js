// Element 6 — account-bound progress helper
// Use this from the ROOT game/app that owns the master progress object.
// Do not store the authoritative progress in one shared localStorage key.

const EMPTY_PROGRESS = {};

function cloneProgress(value) {
  try {
    return JSON.parse(JSON.stringify(value ?? EMPTY_PROGRESS));
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export async function getAuthenticatedUser(supabase) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user ?? null;
}

export async function loadAccountProgress(supabase) {
  const user = await getAuthenticatedUser(supabase);
  if (!user) return { user: null, progress: null, updatedAt: null };

  const { data, error } = await supabase.rpc('load_element6_progress');
  if (error) throw error;

  return {
    user,
    progress: cloneProgress(data?.progress ?? EMPTY_PROGRESS),
    updatedAt: data?.updated_at ?? null,
  };
}

export async function saveAccountProgress(supabase, progress) {
  const user = await getAuthenticatedUser(supabase);
  if (!user) throw new Error('Cannot save progress while signed out.');

  const payload = cloneProgress(progress);
  const { data, error } = await supabase.rpc('save_element6_progress', {
    p_progress: payload,
  });
  if (error) throw error;
  return data;
}

// Important: call this ONLY after the account's cloud progress has finished loading.
// It prevents the initial/default client state from overwriting the real account save.
export function createAccountProgressSaver(supabase, getProgress, delayMs = 350) {
  let timer = null;
  let hydratedUserId = null;
  let saveVersion = 0;

  function setHydratedUser(userId) {
    hydratedUserId = userId || null;
  }

  function scheduleSave() {
    if (!hydratedUserId) return;
    saveVersion += 1;
    const version = saveVersion;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (!hydratedUserId || version !== saveVersion) return;
      try {
        await saveAccountProgress(supabase, getProgress());
      } catch (error) {
        console.error('[Element 6] Account progress save failed:', error);
      }
    }, delayMs);
  }

  function cancel() {
    clearTimeout(timer);
    timer = null;
  }

  function logoutReset() {
    cancel();
    hydratedUserId = null;
    saveVersion += 1;
  }

  return { setHydratedUser, scheduleSave, cancel, logoutReset };
}

export function accountLocalStorageKey(userId) {
  return userId ? `element6:progress:${userId}` : null;
}

export function readAccountLocalCache(userId) {
  const key = accountLocalStorageKey(userId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeAccountLocalCache(userId, progress) {
  const key = accountLocalStorageKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(progress ?? EMPTY_PROGRESS));
  } catch {}
}

export function clearAccountLocalCache(userId) {
  const key = accountLocalStorageKey(userId);
  if (!key) return;
  try { localStorage.removeItem(key); } catch {}
}
