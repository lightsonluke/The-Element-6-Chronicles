import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { sfx } from './sfx.js';
import { syncCurrentUsername } from './usernameSync.js';

// UsernamePrompt — shows a one-time modal when a new player has no username
// set (0 data). The entered name is saved to the user profile via updateMe and
// surfaces everywhere (leaderboards, chat, matches).
export default function UsernamePrompt({ onSet }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await db.auth.me();
        if (!me || cancelled) return;
        if (!me.username && !me.full_name) {
          const prefill = (me.email || '').split('@')[0] || '';
          setName(prefill);
          setShow(true);
        } else {
          onSet?.(me.username || me.full_name);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) { sfx.warning(); return; }
    setBusy(true);
    try {
      // Cloud is canonical. localBackend remains as a harmless offline fallback.
      try { await syncCurrentUsername(trimmed); } catch (cloudError) { await db.auth.updateMe({ username: trimmed }); }
      sfx.purchaseSuccess();
      onSet?.(trimmed);
      setShow(false);
    } catch { sfx.warning(); }
    setBusy(false);
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="bg-card border-2 border-accent rounded-xl p-6 w-96 max-w-[94%] flex flex-col gap-3">
        <h2 className="font-heading text-xl text-accent text-center tracking-wider">WELCOME, FIGHTER!</h2>
        <p className="text-xs text-muted-foreground font-body text-center">Choose your username. This is how other players will see you on leaderboards and in matches.</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          maxLength={20}
          placeholder="Enter username..."
          className="w-full bg-input text-foreground rounded-lg px-3 py-2 text-sm font-heading border border-border text-center"
          autoFocus
        />
        <button onClick={submit} disabled={busy || name.trim().length < 2}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90 disabled:opacity-50">
          {busy ? 'SAVING...' : 'CONFIRM'}
        </button>
        <p className="text-[9px] text-muted-foreground font-body text-center">You can change this later in Settings.</p>
      </div>
    </div>
  );
}
