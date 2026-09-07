ELEMENT 6 — ACCOUNT PROGRESS FIX

WHY THIS FIX EXISTS
-------------------
The database already has public.user_progress keyed by user_id, with RLS intended to limit each row to auth.uid(). The failure is on the game/client side when progress is treated like one shared local/default state, or when the default state is saved before the signed-in account's cloud row finishes loading.

This package makes the cloud save explicitly account-bound and provides a safe client helper.

WHAT THIS FIX GUARANTEES
------------------------
1. Account A loads Account A's progress.
2. Account B loads Account B's progress.
3. Signing out does NOT save the empty/default state over the previous account.
4. Signing back in reloads that account's cloud progress.
5. A different browser/device gets the same account progress after login.
6. Progress is stored under the Supabase Auth user ID, not browser identity.
7. localStorage, if used at all, is keyed by user ID and is only a cache.

SUPABASE
--------
Run Element6-account-progress-FIX.sql once.

ROOT APP INTEGRATION
--------------------
The helper MUST be connected to the root component that owns the master `progress` state. Individual screens such as Shop cannot solve account persistence by themselves because they only receive `progress` as a prop.

After the authenticated user is known:

  const { user, progress: cloudProgress } = await loadAccountProgress(supabase);

Replace the in-memory progress with cloudProgress BEFORE enabling any automatic save effect.

Then mark the account as hydrated:

  saver.setHydratedUser(user.id);

Every real progress mutation should update the root progress state and call:

  saver.scheduleSave();

On sign-out:

  saver.logoutReset();
  setProgress(DEFAULT_PROGRESS);

Do NOT call saveAccountProgress after sign-out.

IMPORTANT AUTH FLOW
-------------------
The load must happen after the Supabase Auth session/user is established. Do not initialize a blank progress object and immediately save it before the cloud load completes.

Also subscribe to:

  supabase.auth.onAuthStateChange(...)

When SIGNED_IN fires, load that account's progress.
When SIGNED_OUT fires, cancel pending saves and clear only the in-memory state.

If the project currently uses localStorage for progress, replace any global key such as:

  element6_progress
  gameProgress
  progress

with accountLocalStorageKey(user.id).

The local cache must never be the authoritative source over Supabase.

FILES
-----
Supabase-account-progress-FIX.sql
  Database/RLS/RPC fix.

accountProgress.js
  Account-aware load/save/cache helper.

This package intentionally does NOT replace the entire game. The root App/Game component is the only remaining integration point because that file was not included in the supplied clan package.
