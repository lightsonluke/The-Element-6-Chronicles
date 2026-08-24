import db from './localBackend';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { sfx } from './sfx.js';
import { music } from './music.js';
import SoundButton from './SoundButton.jsx';
import GameIcon from "./GameIcon.jsx";

const friendCode = (uid) => (uid || '').slice(0, 8).toUpperCase();

export default function ChatPanel({ onBack, initialDM, onMarkSeen }) {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [dmUsername, setDmUsername] = useState('');
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmError, setDmError] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addError, setAddError] = useState('');
  const pollRef = useRef(null);
  const [unreadMap, setUnreadMap] = useState({});
  const lastReadRef = useRef({});
  const chatInitRef = useRef(false);
  const convPollRef = useRef(null);

  useEffect(() => {
    music.play('menu');
    db.auth.me().then(u => { setUser(u); }).catch(() => {});
    return () => { music.stop(); if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const myUsername = (u) => u?.username || (u?.full_name || u?.email || 'Player').split('@')[0];

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convs = await db.entities.ChatConversation.filter({});
      const mine = convs.filter(c => c.member_ids && c.member_ids.includes(user.id));
      setConversations(mine.sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || '')));
      // Initialize read state on first load (don't count existing messages as unread)
      if (!chatInitRef.current) {
        mine.forEach(c => { if (c.last_message_at) lastReadRef.current[c.id] = c.last_message_at; });
        chatInitRef.current = true;
      }
      // Compute unread badges
      const map = {};
      mine.forEach(c => { if (c.last_message_at && c.last_message_at > (lastReadRef.current[c.id] || '')) map[c.id] = true; });
      setUnreadMap(map);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
    convPollRef.current = setInterval(loadConversations, 3000);
    return () => { if (convPollRef.current) clearInterval(convPollRef.current); };
  }, [loadConversations]);

  // Mark a conversation as read when it becomes active
  useEffect(() => {
    if (!activeConv) return;
    const lastAt = activeConv.last_message_at || new Date().toISOString();
    lastReadRef.current[activeConv.id] = lastAt;
    setUnreadMap(prev => { const next = { ...prev }; delete next[activeConv.id]; return next; });
    onMarkSeen?.(activeConv.id, lastAt);
  }, [activeConv]);

  // Poll for new messages in active conversation
  useEffect(() => {
    if (!activeConv || !user) return;
    const loadMsgs = async () => {
      try {
        const msgs = await db.entities.ChatMessage.filter({ conversation_id: activeConv.id });
        const sorted = msgs.sort((a, b) => (a.created_date || '').localeCompare(b.created_date || ''));
        setMessages(sorted);
      } catch {}
    };
    loadMsgs();
    pollRef.current = setInterval(loadMsgs, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv, user]);

  const sendMessage = async () => {
    if (!text.trim() || !activeConv || !user) return;
    sfx.click();
    const msgText = text.trim();
    setText('');
    try {
      await db.entities.ChatMessage.create({
        conversation_id: activeConv.id, sender_user_id: user.id,
        sender_username: myUsername(user), text: msgText,
      });
      await db.entities.ChatConversation.update(activeConv.id, { last_message: msgText, last_message_at: new Date().toISOString() });
      const now = new Date().toISOString();
      lastReadRef.current[activeConv.id] = now;
      onMarkSeen?.(activeConv.id, now);
      const msgs = await db.entities.ChatMessage.filter({ conversation_id: activeConv.id });
      setMessages(msgs.sort((a, b) => (a.created_date || '').localeCompare(b.created_date || '')));
    } catch (e) { sfx.warning(); }
  };

  // Search leaderboard for a user by username (works even if not friends)
  const findUserByUsername = async (username) => {
    const entries = await db.entities.LeaderboardEntry.filter({});
    return entries.find(e => (e.user_name || '').toLowerCase() === username.toLowerCase().trim());
  };

  const startDMByUsername = async () => {
    if (!dmUsername.trim() || !user) return;
    setDmError(''); sfx.click();
    try {
      const match = await findUserByUsername(dmUsername);
      if (!match) { setDmError('No player found with that username.'); sfx.warning(); return; }
      if (match.user_id === user.id) { setDmError("You can't DM yourself!"); sfx.warning(); return; }
      // Check if DM already exists
      const existing = conversations.find(c => c.type === 'dm' && c.member_ids.includes(match.user_id));
      if (existing) { setActiveConv(existing); setShowNewDM(false); setDmUsername(''); return; }
      // Check if target allows chats from non-friends
      const myFriends = await db.entities.Friendship.filter({ owner_user_id: user.id });
      const isFriend = myFriends.some(f => f.friend_user_id === match.user_id);
      if (!isFriend) {
        try {
          const targetUser = await db.entities.User.get(match.user_id);
          if (targetUser?.allow_chats_non_friends === false) {
            setDmError('This player does not accept chats from non-friends.'); sfx.warning(); return;
          }
        } catch {}
      }
      const conv = await db.entities.ChatConversation.create({
        type: 'dm', name: '', member_ids: [user.id, match.user_id],
        member_names: [myUsername(user), match.user_name], owner_user_id: user.id,
      });
      sfx.purchaseSuccess();
      setActiveConv(conv); setShowNewDM(false); setDmUsername('');
      loadConversations();
    } catch { setDmError('Could not start chat.'); sfx.warning(); }
  };

  const startDM = async (friend) => {
    if (!user || !friend) return;
    const existing = conversations.find(c => c.type === 'dm' && c.member_ids.includes(friend.friend_user_id));
    if (existing) { setActiveConv(existing); return; }
    try {
      const conv = await db.entities.ChatConversation.create({
        type: 'dm', name: '', member_ids: [user.id, friend.friend_user_id],
        member_names: [myUsername(user), friend.friend_username], owner_user_id: user.id,
      });
      sfx.purchaseSuccess();
      setActiveConv(conv);
      loadConversations();
    } catch { sfx.warning(); }
  };

  // Auto-start DM when arriving from Friends screen
  useEffect(() => {
    if (initialDM && user) startDM(initialDM);
  }, [initialDM, user]);

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    try {
      const conv = await db.entities.ChatConversation.create({
        type: 'group', name: newGroupName.trim(), member_ids: [user.id],
        member_names: [myUsername(user)], owner_user_id: user.id,
      });
      sfx.purchaseSuccess();
      setNewGroupName(''); setShowNewGroup(false);
      setActiveConv(conv);
      loadConversations();
    } catch { sfx.warning(); }
  };

  const leaveConversation = async () => {
    if (!activeConv || !user) return;
    if (!confirm('Leave this conversation?')) return;
    sfx.click();
    const newMembers = activeConv.member_ids.filter(id => id !== user.id);
    const newNames = (activeConv.member_names || []).filter((_, i) => activeConv.member_ids[i] !== user.id);
    if (newMembers.length === 0) {
      await db.entities.ChatConversation.delete(activeConv.id);
    } else {
      await db.entities.ChatConversation.update(activeConv.id, { member_ids: newMembers, member_names: newNames });
    }
    setActiveConv(null); setMessages([]);
    loadConversations();
  };

  const deleteConversation = async () => {
    if (!activeConv || !user) return;
    if (!confirm('Delete this conversation and ALL its messages? This cannot be undone.')) return;
    sfx.click();
    try {
      await db.entities.ChatMessage.deleteMany({ conversation_id: activeConv.id });
      await db.entities.ChatConversation.delete(activeConv.id);
      setActiveConv(null); setMessages([]);
      loadConversations();
    } catch { sfx.warning(); }
  };

  const renameGroup = async () => {
    if (!activeConv || activeConv.type !== 'group') return;
    const name = prompt('New group name:', activeConv.name);
    if (!name) return;
    sfx.click();
    await db.entities.ChatConversation.update(activeConv.id, { name });
    loadConversations();
    setActiveConv({ ...activeConv, name });
  };

  const addMemberByUsername = async () => {
    if (!addUsername.trim() || !activeConv || !user) return;
    setAddError(''); sfx.click();
    try {
      const match = await findUserByUsername(addUsername);
      if (!match) { setAddError('No player found.'); sfx.warning(); return; }
      if (activeConv.member_ids.includes(match.user_id)) { setAddError('Already in the group.'); sfx.warning(); return; }
      const newMembers = [...activeConv.member_ids, match.user_id];
      const newNames = [...(activeConv.member_names || []), match.user_name];
      await db.entities.ChatConversation.update(activeConv.id, { member_ids: newMembers, member_names: newNames });
      sfx.purchaseSuccess();
      setAddUsername(''); setAddError('');
      setActiveConv({ ...activeConv, member_ids: newMembers, member_names: newNames });
      loadConversations();
    } catch { setAddError('Could not add member.'); sfx.warning(); }
  };

  const removeMember = async (memberId) => {
    if (!activeConv || !user) return;
    if (!confirm('Remove this member?')) return;
    sfx.click();
    const idx = activeConv.member_ids.indexOf(memberId);
    const newMembers = activeConv.member_ids.filter(id => id !== memberId);
    const newNames = (activeConv.member_names || []).filter((_, i) => i !== idx);
    await db.entities.ChatConversation.update(activeConv.id, { member_ids: newMembers, member_names: newNames });
    setActiveConv({ ...activeConv, member_ids: newMembers, member_names: newNames });
    loadConversations();
  };

  if (loading) return <div className="text-center py-20"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-3" style={{ height: '75vh' }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="💬" size={14} /> CHAT</h2>
        <div className="flex gap-2">
          <SoundButton onClick={() => { setShowNewDM(!showNewDM); setShowNewGroup(false); }} sound="click" className="px-3 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-xs"><GameIcon emoji="✉" size={14} /> NEW DM</SoundButton>
          <SoundButton onClick={() => { setShowNewGroup(!showNewGroup); setShowNewDM(false); }} sound="click" className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-xs">+ GROUP</SoundButton>
          <SoundButton onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</SoundButton>
        </div>
      </div>

      {showNewDM && (
        <div className="flex gap-2 items-center">
          <input value={dmUsername} onChange={e => setDmUsername(e.target.value)} placeholder="Enter username to start a chat"
            className="flex-1 px-3 py-2 bg-card border border-border rounded font-body text-sm" />
          <SoundButton onClick={startDMByUsername} sound="success" disabled={!dmUsername.trim()}
            className={`px-4 py-2 rounded font-heading text-sm ${dmUsername.trim() ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>START</SoundButton>
        </div>
      )}
      {dmError && <p className="text-[10px] text-destructive">{dmError}</p>}

      {showNewGroup && (
        <div className="flex gap-2">
          <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name"
            className="flex-1 px-3 py-2 bg-card border border-border rounded font-body text-sm" />
          <SoundButton onClick={createGroup} sound="success" className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">CREATE</SoundButton>
        </div>
      )}

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Conversation list */}
        <div className="w-56 flex flex-col gap-1 overflow-y-auto bg-card border border-border rounded-xl p-2">
          {conversations.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">No conversations yet.<br />Start a DM or create a group!</p>
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => { sfx.click(); setActiveConv(c); setShowMembers(false); }}
              className={`relative text-left px-2 py-2 rounded transition ${activeConv?.id === c.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>
              <p className="text-xs font-heading truncate">{c.type === 'group' ? `🎮 ${c.name || 'Group'}` : c.member_names?.find(n => n !== myUsername(user)) || 'DM'}</p>
              {c.last_message && <p className="text-[9px] opacity-60 truncate">{c.last_message}</p>}
              {unreadMap[c.id] && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" style={{ boxShadow: '0 0 4px #ef4444' }} />}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl">
          {activeConv ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-heading text-foreground">
                  {activeConv.type === 'group' ? `🎮 ${activeConv.name || 'Group'}` : 'Direct Message'}
                </span>
                <div className="flex gap-1">
                  {activeConv.type === 'group' && activeConv.owner_user_id === user?.id && <SoundButton onClick={renameGroup} className="text-[10px] px-2 py-0.5 bg-secondary rounded"><GameIcon emoji="✏" size={14} /> RENAME</SoundButton>}
                  {activeConv.type === 'group' && activeConv.owner_user_id === user?.id && <SoundButton onClick={() => setShowMembers(!showMembers)} sound="click" className="text-[10px] px-2 py-0.5 bg-primary/70 text-primary-foreground rounded">+ ADD</SoundButton>}
                  <SoundButton onClick={leaveConversation} className="text-[10px] px-2 py-0.5 bg-destructive/30 text-destructive rounded">LEAVE</SoundButton>
                  <SoundButton onClick={deleteConversation} className="text-[10px] px-2 py-0.5 bg-destructive/50 text-destructive-foreground rounded"><GameIcon emoji="🗑" size={14} /> DELETE</SoundButton>
                </div>
              </div>

              {/* Members panel (group) */}
              {showMembers && activeConv.type === 'group' && (
                <div className="px-3 py-2 border-b border-border bg-muted/20 space-y-2">
                  <div className="flex gap-2 items-center">
                    <input value={addUsername} onChange={e => setAddUsername(e.target.value)} placeholder="Username to add"
                      className="flex-1 px-2 py-1 bg-card border border-border rounded text-[10px] font-body" />
                    <SoundButton onClick={addMemberByUsername} sound="click" disabled={!addUsername.trim()}
                      className={`px-2 py-1 rounded text-[9px] font-heading ${addUsername.trim() ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>ADD</SoundButton>
                  </div>
                  {addError && <p className="text-[9px] text-destructive">{addError}</p>}
                  <div className="flex flex-wrap gap-1">
                    {activeConv.member_ids.map((id, i) => (
                      <span key={id} className="flex items-center gap-1 bg-card border border-border rounded px-1.5 py-0.5 text-[9px]">
                        {activeConv.member_names?.[i] || 'User'}
                        {id !== user?.id && <button onClick={() => removeMember(id)} className="text-destructive"><GameIcon emoji="✕" size={14} /></button>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? <p className="text-[10px] text-muted-foreground text-center py-8">No messages yet. Say hello!</p> :
                  messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender_user_id === user?.id ? 'items-end' : 'items-start'}`}>
                      <p className="text-[9px] font-heading mb-0.5 px-1" style={{ color: m.sender_user_id === user?.id ? 'var(--accent)' : 'var(--primary)' }}>
                        {m.sender_username || 'Player'}{m.sender_user_id === user?.id ? ' (You)' : ''}
                      </p>
                      <div className={`max-w-[75%] px-3 py-1.5 rounded-lg ${m.sender_user_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        <p className="text-xs font-body">{m.text}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div className="flex gap-2 p-2 border-t border-border">
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder="Type a message..." className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body" />
                <SoundButton onClick={sendMessage} disabled={!text.trim()} sound="click"
                  className={`px-4 py-1.5 rounded font-heading text-xs ${text.trim() ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>SEND</SoundButton>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}