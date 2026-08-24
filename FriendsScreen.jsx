import db from './localBackend';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { sfx } from './sfx.js';
import { music } from './music.js';
import SoundButton from './SoundButton.jsx';
import GameIcon from "./GameIcon.jsx";

const friendCode = (uid) => (uid || '').slice(0, 8).toUpperCase();
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

const SPORTS = [
  { id: 'fight', label: '⚔️ Fight' },
  { id: '1v1', label: '🥊 1v1' },
  { id: 'soccer', label: '⚽ Soccer' },
  { id: 'volleyball', label: '🏐 Volleyball' },
];

export default function FriendsScreen({ onBack, onMessage }) {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlineMap, setOnlineMap] = useState({});
  const [matchRequestTarget, setMatchRequestTarget] = useState(null); // friend to challenge
  const heartbeatRef = useRef(null);

  useEffect(() => {
    music.play('menu');
    return () => { music.stop(); if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, []);

  const myUsername = (u) => u?.username || (u?.full_name || u?.email || 'Player').split('@')[0];

  // Update own presence + ensure leaderboard entry exists
  const updatePresence = useCallback(async () => {
    try {
      const me = await db.auth.me();
      setUser(me);
      // Upsert presence
      const existing = await db.entities.Presence.filter({ user_id: me.id });
      if (existing[0]) {
        await db.entities.Presence.update(existing[0].id, { last_active: new Date().toISOString(), username: myUsername(me) });
      } else {
        await db.entities.Presence.create({ user_id: me.id, username: myUsername(me), last_active: new Date().toISOString() });
      }
      // Ensure leaderboard entry exists (so friend code search works)
      const lb = await db.entities.LeaderboardEntry.filter({ user_id: me.id });
      if (lb.length === 0) {
        await db.entities.LeaderboardEntry.create({ user_id: me.id, user_name: myUsername(me) });
      } else if (lb[0].user_name !== myUsername(me)) {
        await db.entities.LeaderboardEntry.update(lb[0].id, { user_name: myUsername(me) });
      }
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      const me = await db.auth.me();
      setUser(me);
      const [myFriends, myReqs, mySent] = await Promise.all([
        db.entities.Friendship.filter({ owner_user_id: me.id }),
        db.entities.FriendRequest.filter({ to_user_id: me.id, status: 'pending' }),
        db.entities.FriendRequest.filter({ from_user_id: me.id, status: 'pending' }),
      ]);
      // Sort: favorites first, then non-ignored, then ignored last
      const sorted = myFriends.sort((a, b) => {
        if (a.is_ignored && !b.is_ignored) return 1;
        if (!a.is_ignored && b.is_ignored) return -1;
        return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
      });
      setFriends(sorted);
      setRequests(myReqs);
      setSentRequests(mySent);

      // Check online status for all friends
      const friendIds = myFriends.map(f => f.friend_user_id).filter(id => id);
      if (friendIds.length > 0) {
        const presences = await db.entities.Presence.filter({});
        const map = {};
        const now = Date.now();
        presences.forEach(p => {
          if (friendIds.includes(p.user_id)) {
            const last = new Date(p.last_active || 0).getTime();
            map[p.user_id] = (now - last) < ONLINE_THRESHOLD_MS;
          }
        });
        setOnlineMap(map);
      }
    } catch (e) { setError('Failed to load friends data'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    updatePresence();
    loadData();
    // Heartbeat every 60s
    heartbeatRef.current = setInterval(updatePresence, 60000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [updatePresence, loadData]);

  const onlineCount = friends.filter(f => !f.is_ignored && onlineMap[f.friend_user_id]).length;

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) return;
    sfx.click();
    setError(''); setFoundUser(null);
    try {
      const entries = await db.entities.LeaderboardEntry.filter({});
      const q = searchQuery.trim().toUpperCase();
      // Match by friend code OR username
      const match = entries.find(e => friendCode(e.user_id) === q || (e.user_name || '').toUpperCase() === q);
      if (match) {
        setFoundUser({ id: match.user_id, name: match.user_name });
        sfx.notification();
      } else {
        setError('No player found with that code or username.');
        sfx.warning();
      }
    } catch { setError('Search failed.'); sfx.warning(); }
  };

  const sendRequest = async () => {
    if (!foundUser || !user) return;
    try {
      // Check if target allows friend requests
      try {
        const targetUser = await db.entities.User.get(foundUser.id);
        if (targetUser?.allow_friend_requests === false) {
          setError('This player is not accepting friend requests.'); sfx.warning(); return;
        }
      } catch {}
      await db.entities.FriendRequest.create({
        from_user_id: user.id, to_user_id: foundUser.id,
        from_username: myUsername(user), to_username: foundUser.name,
        from_code: friendCode(user.id), status: 'pending',
      });
      sfx.purchaseSuccess();
      setFoundUser(null); setSearchQuery('');
    } catch (e) { setError('Could not send request (already pending?)'); sfx.warning(); }
  };

  const acceptRequest = async (req) => {
    sfx.click();
    try {
      await db.entities.FriendRequest.update(req.id, { status: 'accepted' });
      await db.entities.Friendship.create({
        owner_user_id: user.id, friend_user_id: req.from_user_id,
        friend_username: req.from_username, friend_code: req.from_code, is_favorite: false, is_ignored: false,
      });
      await db.entities.Friendship.create({
        owner_user_id: req.from_user_id, friend_user_id: user.id,
        friend_username: myUsername(user), friend_code: friendCode(user.id), is_favorite: false, is_ignored: false,
      });
      sfx.purchaseSuccess();
      loadData();
    } catch (e) { setError('Failed to accept'); sfx.warning(); }
  };

  const declineRequest = async (req) => {
    sfx.click();
    await db.entities.FriendRequest.update(req.id, { status: 'declined' });
    loadData();
  };

  const cancelRequest = async (req) => {
    sfx.click();
    try { await db.entities.FriendRequest.delete(req.id); } catch {}
    loadData();
  };

  const removeFriend = async (f) => {
    if (!confirm(`Remove ${f.friend_username}?`)) return;
    sfx.click();
    await db.entities.Friendship.delete(f.id);
    const reverse = await db.entities.Friendship.filter({ owner_user_id: f.friend_user_id, friend_user_id: user.id });
    if (reverse[0]) await db.entities.Friendship.delete(reverse[0].id);
    loadData();
  };

  const toggleFavorite = async (f) => {
    sfx.click();
    await db.entities.Friendship.update(f.id, { is_favorite: !f.is_favorite });
    loadData();
  };

  const toggleIgnore = async (f) => {
    sfx.click();
    await db.entities.Friendship.update(f.id, { is_ignored: !f.is_ignored });
    loadData();
  };

  const handleMessage = (f) => {
    sfx.click();
    onMessage?.(f);
  };

  const sendMatchRequest = async (friend, sport) => {
    sfx.click();
    setMatchRequestTarget(null);
    try {
      await db.entities.MatchRequest.create({
        from_user_id: user.id,
        to_user_id: friend.friend_user_id,
        from_username: myUsername(user),
        to_username: friend.friend_username,
        sport,
        status: 'pending',
      });
      setError(''); sfx.purchaseSuccess();
    } catch { setError('Could not send match request.'); sfx.warning(); }
  };

  if (loading) return <div className="text-center py-20"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="👥" size={14} /> FRIENDS</h2>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-heading text-green-400">{onlineCount} ONLINE</span>
            </span>
          )}
        </div>
        <SoundButton onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</SoundButton>
      </div>

      {user && (
        <div className="bg-card border border-accent rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-body">YOUR FRIEND CODE</p>
          <p className="text-3xl font-heading text-accent tracking-widest">{friendCode(user.id)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Share this code or your username so friends can find you</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {/* Search by code or username */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-heading text-primary mb-2"><GameIcon emoji="🔍" size={14} /> ADD FRIEND</p>
        <div className="flex gap-2">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ENTER CODE OR USERNAME"
            className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm text-center uppercase" maxLength={20} />
          <SoundButton onClick={handleSearch} disabled={searchQuery.trim().length < 3}
            className={`px-4 py-2 rounded font-heading text-sm ${searchQuery.trim().length >= 3 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>SEARCH</SoundButton>
        </div>
        {foundUser && (
          <div className="mt-3 flex items-center justify-between bg-muted/30 rounded-lg p-2">
            <span className="text-sm font-heading text-foreground">{foundUser.name}</span>
            <SoundButton onClick={sendRequest} sound="success" className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-xs">SEND REQUEST</SoundButton>
          </div>
        )}
      </div>

      {/* Requests */}
      {requests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-heading text-primary mb-2"><GameIcon emoji="📨" size={14} /> FRIEND REQUESTS ({requests.length})</p>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <span className="text-sm font-heading text-foreground">{r.from_username}</span>
                <div className="flex gap-1">
                  <SoundButton onClick={() => acceptRequest(r)} sound="success" className="px-3 py-1 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="✓" size={14} /> ACCEPT</SoundButton>
                  <SoundButton onClick={() => declineRequest(r)} className="px-3 py-1 bg-destructive text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="✕" size={14} /></SoundButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-heading text-primary mb-2"><GameIcon emoji="📤" size={14} /> SENT REQUESTS ({sentRequests.length})</p>
          <div className="space-y-2">
            {sentRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <span className="text-sm font-heading text-foreground">{r.to_username}</span>
                <div className="flex gap-1 items-center">
                  <span className="text-[9px] text-muted-foreground font-body">Pending…</span>
                  <SoundButton onClick={() => cancelRequest(r)} className="px-3 py-1 bg-destructive/40 text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="✕" size={14} /> CANCEL</SoundButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-heading text-primary mb-2"><GameIcon emoji="🌟" size={14} /> FRIENDS ({friends.filter(f => !f.is_ignored).length})</p>
        {friends.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No friends yet. Add someone with their code or username!</p>
        ) : (
          <div className="space-y-2">
            {friends.map(f => {
              const isOnline = onlineMap[f.friend_user_id];
              return (
                <div key={f.id} className={`flex items-center justify-between rounded-lg p-2 ${f.is_ignored ? 'bg-muted/10 opacity-50' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(f)} className="text-lg">{f.is_favorite ? <GameIcon emoji="⭐" size={14} /> : <GameIcon emoji="☆" size={14} />}</button>
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} style={isOnline ? { boxShadow: '0 0 6px #22c55e' } : {}} />
                    <div>
                      <p className="text-sm font-heading text-foreground">{f.friend_username} {f.is_ignored && <span className="text-[9px] text-muted-foreground">(ignored)</span>}</p>
                      <p className="text-[9px] text-muted-foreground">{isOnline ? '🟢 Online' : '⚫ Offline'} · Code: {f.friend_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <SoundButton onClick={() => handleMessage(f)} sound="click" className="px-2 py-1 bg-primary/70 text-primary-foreground rounded font-heading text-[10px]"><GameIcon emoji="💬" size={14} /> MSG</SoundButton>
                    {!f.is_ignored && <SoundButton onClick={() => { sfx.click(); setMatchRequestTarget(f); }} sound="click" className="px-2 py-1 bg-accent/80 text-accent-foreground rounded font-heading text-[10px]"><GameIcon emoji="⚔️" size={14} /> MATCH</SoundButton>}
                    <SoundButton onClick={() => toggleIgnore(f)} sound="click" className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[10px]">{f.is_ignored ? 'UNIGNORE' : 'IGNORE'}</SoundButton>
                    <SoundButton onClick={() => removeFriend(f)} className="px-2 py-1 bg-destructive/50 text-destructive-foreground rounded font-heading text-[10px]">REMOVE</SoundButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {matchRequestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-card border-2 border-accent rounded-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h3 className="font-heading text-lg text-accent text-center"><GameIcon emoji="⚔️" size={14} /> CHALLENGE {matchRequestTarget.friend_username.toUpperCase()}</h3>
            <p className="text-xs text-muted-foreground text-center font-body">Select a game mode to challenge them to:</p>
            <div className="grid grid-cols-2 gap-3">
              {SPORTS.map(s => (
                <SoundButton key={s.id} onClick={() => sendMatchRequest(matchRequestTarget, s.id)} sound="success"
                  className="py-3 px-4 bg-primary/80 text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90 text-center">
                  {s.label}
                </SoundButton>
              ))}
            </div>
            <SoundButton onClick={() => setMatchRequestTarget(null)} className="py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm text-center">CANCEL</SoundButton>
          </div>
        </div>
      )}
    </div>
  );
}