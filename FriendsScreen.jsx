import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { sfx } from './sfx.js';
import { music } from './music.js';
import SoundButton from './SoundButton.jsx';
import GameIcon from './GameIcon.jsx';

const friendCode = (id) => `E6-${String(id || '').replaceAll('-', '').slice(0, 8).toUpperCase()}`;
const usernameFor = (user) => user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player';

export default function FriendsScreen({ onBack, onMessage }) {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const heartbeat = useRef(null);

  const profilePayload = useCallback((account) => ({ user_id: account.id, username: usernameFor(account), friend_code: friendCode(account.id), updated_at: new Date().toISOString() }), []);
  const ensureProfile = useCallback(async (account) => {
    const { error } = await supabase.from('player_profiles').upsert(profilePayload(account), { onConflict: 'user_id' });
    if (error) throw error;
  }, [profilePayload]);
  const updatePresence = useCallback(async (account) => {
    await supabase.from('player_presence').upsert({ user_id: account.id, username: usernameFor(account), last_active: new Date().toISOString() }, { onConflict: 'user_id' });
  }, []);

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const account = authData.user;
    if (!account) { setLoading(false); setMessage('Log in first to use Friends.'); return; }
    setUser(account);
    try {
      await ensureProfile(account);
      await updatePresence(account);
      const { data: rows, error } = await supabase.from('player_friend_requests').select('*').or(`sender_id.eq.${account.id},recipient_id.eq.${account.id}`).order('created_at', { ascending: false });
      if (error) throw error;
      const all = rows || [];
      const ids = [...new Set(all.flatMap(r => [r.sender_id, r.recipient_id]).filter(id => id !== account.id))];
      const { data: profiles, error: profileError } = ids.length ? await supabase.from('player_profiles').select('user_id,username,friend_code').in('user_id', ids) : { data: [], error: null };
      if (profileError) throw profileError;
      const byId = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setIncoming(all.filter(r => r.status === 'pending' && r.recipient_id === account.id).map(r => ({ ...r, profile: byId[r.sender_id] })));
      setSent(all.filter(r => r.status === 'pending' && r.sender_id === account.id).map(r => ({ ...r, profile: byId[r.recipient_id] })));
      setFriends(all.filter(r => r.status === 'accepted').map(r => {
        const id = r.sender_id === account.id ? r.recipient_id : r.sender_id;
        return { id: r.id, friend_user_id: id, friend_username: byId[id]?.username || 'Player', friend_code: byId[id]?.friend_code || friendCode(id) };
      }));
      setMessage('');
    } catch (error) { setMessage(error.message || 'Friends setup is not ready. Run the Social setup SQL once.'); }
    setLoading(false);
  }, [ensureProfile, updatePresence]);

  useEffect(() => {
    music.play('menu'); load();
    heartbeat.current = setInterval(async () => { const { data } = await supabase.auth.getUser(); if (data.user) updatePresence(data.user); }, 60000);
    return () => { clearInterval(heartbeat.current); music.stop(); };
  }, [load, updatePresence]);

  const search = async () => {
    const value = query.trim();
    if (value.length < 3 || !user) return;
    setMessage(''); setFound(null); sfx.click();
    const normalizedCode = value.toUpperCase().replace(/^E6-/, 'E6-');
    const { data, error } = await supabase.from('player_profiles').select('user_id,username,friend_code').or(`username.ilike.${value},friend_code.eq.${normalizedCode}`).limit(1).maybeSingle();
    if (error) { setMessage(error.message); return; }
    if (!data) { setMessage('No player found with that username or friend code.'); sfx.warning(); return; }
    if (data.user_id === user.id) { setMessage('That is your own account.'); return; }
    setFound(data); sfx.notification();
  };
  const sendRequest = async () => {
    if (!found || !user) return;
    const { error } = await supabase.from('player_friend_requests').insert({ sender_id: user.id, recipient_id: found.user_id, status: 'pending' });
    if (error) { setMessage(error.code === '23505' ? 'You already have a request or friendship with this player.' : error.message); sfx.warning(); return; }
    setFound(null); setQuery(''); sfx.purchaseSuccess(); await load();
  };
  const answerRequest = async (request, status) => {
    const { error } = await supabase.from('player_friend_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', request.id);
    if (error) { setMessage(error.message); return; }
    sfx.purchaseSuccess(); await load();
  };
  const removeFriend = async (friend) => {
    if (!confirm(`Remove ${friend.friend_username}?`)) return;
    const { error } = await supabase.from('player_friend_requests').delete().eq('id', friend.id);
    if (error) { setMessage(error.message); return; }
    await load();
  };

  if (loading) return <div className="text-center py-20"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  return <div className="w-full max-w-2xl flex flex-col gap-4">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="👥" size={14} /> FRIENDS</h2><SoundButton onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</SoundButton></div>
    {user && <div className="bg-card border border-accent rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground">YOUR FRIEND CODE</p><p className="text-3xl font-heading text-accent tracking-widest">{friendCode(user.id)}</p><p className="text-[10px] text-muted-foreground mt-1">Share this code or your username: {usernameFor(user)}</p></div>}
    {message && <p className="text-sm text-destructive text-center">{message}</p>}
    <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs font-heading text-primary mb-2"><GameIcon emoji="🔍" size={14} /> ADD FRIEND</p><div className="flex gap-2"><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="USERNAME OR E6-FRIEND CODE" className="flex-1 px-3 py-2 bg-secondary rounded font-heading text-sm text-center" maxLength={24} /><SoundButton onClick={search} disabled={query.trim().length < 3} className="px-4 py-2 rounded font-heading text-sm bg-accent text-accent-foreground">SEARCH</SoundButton></div>{found && <div className="mt-3 flex items-center justify-between bg-muted/30 rounded-lg p-2"><span className="text-sm font-heading">{found.username} · {found.friend_code}</span><SoundButton onClick={sendRequest} className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-xs">SEND REQUEST</SoundButton></div>}</div>
    {incoming.length > 0 && <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs font-heading text-primary mb-2">INCOMING REQUESTS</p>{incoming.map(r => <div key={r.id} className="flex justify-between items-center bg-muted/30 rounded-lg p-2 mb-2"><span className="font-heading text-sm">{r.profile?.username || 'Player'}</span><div className="flex gap-1"><SoundButton onClick={() => answerRequest(r, 'accepted')} className="px-3 py-1 bg-accent rounded font-heading text-xs">ACCEPT</SoundButton><SoundButton onClick={() => answerRequest(r, 'declined')} className="px-3 py-1 bg-destructive rounded font-heading text-xs">DECLINE</SoundButton></div></div>)}</div>}
    {sent.length > 0 && <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs font-heading text-primary mb-2">SENT REQUESTS</p>{sent.map(r => <p key={r.id} className="text-sm text-muted-foreground">Pending: {r.profile?.username || 'Player'}</p>)}</div>}
    <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs font-heading text-primary mb-2"><GameIcon emoji="🌟" size={14} /> FRIENDS ({friends.length})</p>{friends.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No friends yet. Add someone with their username or code!</p> : <div className="space-y-2">{friends.map(f => <div key={f.id} className="flex justify-between items-center bg-muted/30 rounded-lg p-2"><div><p className="text-sm font-heading">{f.friend_username}</p><p className="text-[9px] text-muted-foreground">Code: {f.friend_code}</p></div><div className="flex gap-1"><SoundButton onClick={() => onMessage?.(f)} className="px-2 py-1 bg-primary/70 rounded font-heading text-[10px]">MSG</SoundButton><SoundButton onClick={() => removeFriend(f)} className="px-2 py-1 bg-destructive/50 rounded font-heading text-[10px]">REMOVE</SoundButton></div></div>)}</div>}</div>
  </div>;
}
