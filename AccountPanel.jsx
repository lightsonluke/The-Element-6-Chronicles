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
    return <section className="e6-account-panel"><p className="e6-auth-kicker">PLAYER ACCOUNT</p><h3 className="e6-auth-section-title">Cloud saves connected</h3><p className="e6-account-copy">Signed in as <strong>{displayName}</strong></p><p className="e6-account-copy mb-4">Friend code: <span className="e6-account-code">{makeFriendCode(user.id)}</span></p><button onClick={() => supabase.auth.signOut()} className="e6-auth-secondary">SIGN OUT</button></section>;
  }
  const creating = mode === 'create';
  return <section className="e6-account-panel"><p className="e6-auth-kicker">PLAYER ACCOUNT</p><h3 className="e6-auth-section-title">Account & cloud saves</h3><p className="e6-account-copy mb-4">Log in or create an account to sync cloud saves and connect with friends.</p><div className="e6-auth-tabs"><button type="button" onClick={() => { setMode('login'); setMessage(''); }} className={!creating ? 'is-active' : ''}>LOG IN</button><button type="button" onClick={() => { setMode('create'); setMessage(''); }} className={creating ? 'is-active' : ''}>CREATE ACCOUNT</button></div><div className="flex flex-col gap-2.5">{creating && <input value={username} onChange={e => setUsername(e.target.value)} maxLength="20" placeholder="Username (3–20 characters)" className="e6-auth-input" />}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="e6-auth-input" /><input type="password" minLength="6" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ characters)" className="e6-auth-input" /><button disabled={busy || !email || password.length < 6 || (creating && username.trim().length < 3)} onClick={submit} className="e6-auth-submit">{busy ? 'PLEASE WAIT…' : creating ? 'CREATE ACCOUNT' : 'LOG IN'}</button>{message && <p className="e6-account-message" role="status">{message}</p>}</div></section>;
}
