import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

const makeFriendCode = (id) => `E6-${String(id || '').replaceAll('-', '').slice(0, 8).toUpperCase()}`;

export default function AccountPanel() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
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

  const savePublicProfile = async (account, cleanUsername) => supabase.from('player_profiles').upsert({
    user_id: account.id, username: cleanUsername, friend_code: makeFriendCode(account.id), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  const submit = async () => {
    setBusy(true); setMessage('');
    const cleanUsername = username.trim();
    if (mode === 'create' && !/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) { setBusy(false); setMessage('Username: 3–20 letters, numbers, or underscores.'); return; }
    const result = mode === 'create'
      ? await supabase.auth.signUp({ email, password, options: { data: { username: cleanUsername, full_name: cleanUsername } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === 'create' && result.data.user) {
      const profileResult = await savePublicProfile(result.data.user, cleanUsername);
      if (profileResult.error) { setMessage(`Account created, but profile setup needs the Social setup SQL: ${profileResult.error.message}`); return; }
    }
    setMessage(mode === 'create' ? (result.data.session ? 'Account created and signed in — cloud saves are on.' : 'Account created. Confirm the email, then log in once.') : 'Signed in — cloud saves are on.');
  };

  if (user) {
    const displayName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player';
    return <div className="bg-card border border-border rounded-xl p-5"><h3 className="font-heading text-sm text-primary mb-2">ACCOUNT & CLOUD SAVES</h3><p className="text-xs text-muted-foreground">Signed in as <span className="text-foreground">{displayName}</span></p><p className="text-xs text-muted-foreground mb-3">Friend code: <span className="font-heading text-accent">{makeFriendCode(user.id)}</span></p><button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 rounded bg-secondary text-secondary-foreground font-heading text-xs">SIGN OUT</button></div>;
  }
  const creating = mode === 'create';
  return <div className="bg-card border border-border rounded-xl p-5"><h3 className="font-heading text-sm text-primary mb-2">ACCOUNT & CLOUD SAVES</h3><p className="text-xs text-muted-foreground mb-3">Log in to an existing account, or create a new one for cloud saves and friends.</p><div className="flex gap-2 mb-3"><button onClick={() => { setMode('login'); setMessage(''); }} className={`px-3 py-2 rounded font-heading text-xs ${!creating ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>LOG IN</button><button onClick={() => { setMode('create'); setMessage(''); }} className={`px-3 py-2 rounded font-heading text-xs ${creating ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>CREATE ACCOUNT</button></div><div className="flex flex-col gap-2">{creating && <input value={username} onChange={e => setUsername(e.target.value)} maxLength="20" placeholder="Username (3–20 characters)" className="px-3 py-2 bg-secondary rounded text-sm" />}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 bg-secondary rounded text-sm" /><input type="password" minLength="6" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ characters)" className="px-3 py-2 bg-secondary rounded text-sm" /><button disabled={busy || !email || password.length < 6 || (creating && username.trim().length < 3)} onClick={submit} className="px-3 py-2 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50">{busy ? 'PLEASE WAIT…' : creating ? 'CREATE ACCOUNT' : 'LOG IN'}</button>{message && <p className="text-xs text-muted-foreground">{message}</p>}</div></div>;
}
