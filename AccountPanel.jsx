import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function AccountPanel() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async (kind) => {
    setBusy(true); setMessage('');
    const cleanUsername = username.trim();
    if (kind === 'signup' && cleanUsername.length < 3) {
      setBusy(false); setMessage('Choose a username with at least 3 characters.'); return;
    }
    const action = kind === 'signup'
      ? supabase.auth.signUp({ email, password, options: { data: { username: cleanUsername, full_name: cleanUsername } } })
      : supabase.auth.signInWithPassword({ email, password });
    const { data, error } = await action;
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (kind === 'signup' && data.user) {
      // The profile trigger may already create this row. This safely fills in the
      // chosen public name when the profile table accepts it.
      await supabase.from('profiles').upsert({ id: data.user.id, username: cleanUsername }, { onConflict: 'id' }).catch(() => {});
    }
    setMessage(kind === 'signup'
      ? data.session ? 'Account created and signed in — cloud saves are on.' : 'Account created. Confirm the email, then log in once.'
      : 'Signed in — cloud saves are on.');
  };

  if (user) return <div className="bg-card border border-border rounded-xl p-5"><h3 className="font-heading text-sm text-primary mb-2">ACCOUNT & CLOUD SAVES</h3><p className="text-xs text-muted-foreground mb-3">Signed in as {user.email}. Your progress will sync automatically.</p><button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 rounded bg-secondary text-secondary-foreground font-heading text-xs">SIGN OUT</button></div>;
  return <div className="bg-card border border-border rounded-xl p-5"><h3 className="font-heading text-sm text-primary mb-2">ACCOUNT & CLOUD SAVES</h3><p className="text-xs text-muted-foreground mb-3">Create an account to keep your progress across devices.</p><div className="flex flex-col gap-2"><input value={username} onChange={e => setUsername(e.target.value)} maxLength="20" placeholder="Username (3+ characters)" className="px-3 py-2 bg-secondary rounded text-sm" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 bg-secondary rounded text-sm" /><input type="password" minLength="6" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ characters)" className="px-3 py-2 bg-secondary rounded text-sm" /><div className="flex gap-2"><button disabled={busy || !email || password.length < 6} onClick={() => submit('login')} className="px-3 py-2 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50">LOG IN</button><button disabled={busy || !email || password.length < 6 || username.trim().length < 3} onClick={() => submit('signup')} className="px-3 py-2 bg-accent text-accent-foreground rounded font-heading text-xs disabled:opacity-50">CREATE ACCOUNT</button></div>{message && <p className="text-xs text-muted-foreground">{message}</p>}</div></div>;
}
