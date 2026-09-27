import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import TradeGiftModal from './TradeGiftModal.jsx';
import TradeOfferModal from './TradeOfferModal.jsx';
import SoundButton from './SoundButton.jsx';
import GameIcon from './GameIcon.jsx';

const nameOf = (u) => u?.user_metadata?.username || u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Player';

export default function ChatPanel({ onBack, initialDM, onMarkSeen, progress, onTransfer, onAcceptClanInvite, onReceiveGift }) {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [tradeOpen, setTradeOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [pendingTrade, setPendingTrade] = useState(null);
  const [clanInvites, setClanInvites] = useState([]);
  const bottomRef = useRef(null);

  const loadFriends = useCallback(async (account) => {
    const { data: rows, error: friendError } = await supabase.from('player_friend_requests').select('*').eq('status', 'accepted').or(`sender_id.eq.${account.id},recipient_id.eq.${account.id}`);
    if (friendError) throw friendError;
    const ids = (rows || []).map(r => r.sender_id === account.id ? r.recipient_id : r.sender_id);
    if (!ids.length) { setFriends([]); return; }
    const { data, error: profileError } = await supabase.from('player_profiles').select('user_id,username,friend_code').in('user_id', ids);
    if (profileError) throw profileError;
    setFriends((data || []).map(p => ({ ...p, friend_user_id: p.user_id, friend_username: p.username })));
  }, []);

  const loadMessages = useCallback(async (account, other) => {
    if (!account || !other) return;
    const { data, error: messageError } = await supabase.from('player_direct_messages').select('*').or(`and(sender_id.eq.${account.id},recipient_id.eq.${other.user_id}),and(sender_id.eq.${other.user_id},recipient_id.eq.${account.id})`).order('created_at', { ascending: true }).limit(300);
    if (messageError) { setError(messageError.message); return; }
    setMessages(data || []); onMarkSeen?.(`${account.id}:${other.user_id}`, new Date().toISOString());
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [onMarkSeen]);

  useEffect(() => {
    music.play('menu');
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setError('Log in first to use chat.'); return; }
      setUser(data.user);
      try { await loadFriends(data.user); } catch (e) { setError(e.message); }
      try { const { data: invites } = await supabase.from('player_direct_messages').select('*').eq('recipient_id', data.user.id).ilike('body', '%[E6CLAN_INVITE:%').order('created_at', { ascending: false }).limit(10); setClanInvites(invites || []); } catch {}
    });
    return () => music.stop();
  }, [loadFriends]);

  useEffect(() => {
    if (!initialDM || !friends.length) return;
    const match = friends.find(f => f.user_id === initialDM.friend_user_id);
    if (match) setPeer(match);
  }, [initialDM, friends]);

  useEffect(() => {
    if (!user || !peer) return;
    loadMessages(user, peer);
    const loadGifts = async () => {
      try {
        const { data } = await supabase.from('element6_trade_gifts').select('*').eq('to_user_id', user.id).eq('from_user_id', peer.user_id).eq('type', 'gift').eq('status', 'completed').order('created_at', { ascending: true }).limit(20);
        const key = 'element6_cloud_gifts_applied';
        const seen = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
        for (const gift of (data || [])) { if (seen.has(gift.id)) continue; await onReceiveGift?.(gift.give || {}, gift.from_username || peer.username); seen.add(gift.id); }
        localStorage.setItem(key, JSON.stringify([...seen].slice(-100)));
      } catch {}
    };
    loadGifts();
    const loadTrade = async () => {
      try {
        const { data } = await supabase.from('element6_trade_gifts').select('*').eq('to_user_id', user.id).eq('from_user_id', peer.user_id).eq('type', 'trade_request').eq('status', 'pending').order('created_at', { ascending: false }).limit(1);
        setPendingTrade(data?.[0] || null);
      } catch {}
    };
    loadTrade();
    const channel = supabase.channel(`dm-${user.id}-${peer.user_id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_direct_messages' }, payload => {
      const m = payload.new;
      if ((m.sender_id === user.id && m.recipient_id === peer.user_id) || (m.sender_id === peer.user_id && m.recipient_id === user.id)) loadMessages(user, peer);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, peer, loadMessages]);

  const applyTrade = async accept => {
    if (!pendingTrade || !user) return;
    try {
      const { error: tradeError } = await supabase.rpc('element6_accept_trade', { p_trade_id: pendingTrade.id, p_accept: accept });
      if (tradeError) throw tradeError;
      if (accept) { sfx.purchaseSuccess(); } else { sfx.click(); }
      setPendingTrade(null);
      await loadMessages(user, peer);
    } catch (e) { setError(e?.message || 'Could not complete the trade.'); sfx.warning(); }
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !user || !peer) return;
    setText(''); setError('');
    const { error: sendError } = await supabase.from('player_direct_messages').insert({ sender_id: user.id, recipient_id: peer.user_id, sender_username: nameOf(user), body });
    if (sendError) { setText(body); setError(sendError.message); sfx.warning(); return; }
    sfx.click(); await loadMessages(user, peer);
  };

  return <div className="w-full max-w-4xl flex flex-col gap-3" style={{ height: '75vh' }}>
    <div className="flex justify-between items-center"><h2 className="text-2xl font-heading text-accent"><GameIcon emoji="💬" size={14} /> FRIEND CHAT</h2><SoundButton onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg font-heading text-sm">← BACK</SoundButton></div>
    {error && <p className="text-xs text-destructive text-center">{error}</p>}
    {clanInvites.length > 0 && <div className="space-y-2">{clanInvites.map(inv => { const id = inv.body.match(/\[E6CLAN_INVITE:([^\]]+)\]/)?.[1]; return <div key={inv.id} className="rounded-lg border-2 border-accent bg-accent/10 p-3"><p className="font-heading text-xs text-accent">ELEMENT 6 · CLAN FOUNDING REQUEST</p><p className="text-xs mt-1">You have been requested to Found a clan! Click here to accept!</p><button onClick={async () => { if (id) { await onAcceptClanInvite?.(id); setClanInvites(v => v.filter(x => x.id !== inv.id)); } }} className="mt-2 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]">✓ ACCEPT · 5,000 TOKENS</button></div>; })}</div>}
    {pendingTrade && <div className="rounded-lg border-2 border-accent bg-accent/10 p-3"><p className="font-heading text-xs text-accent">🔄 TRADE OFFER FROM {pendingTrade.from_username}</p><p className="text-[10px] text-muted-foreground mt-1">Accepting exchanges the listed items and tokens permanently.</p><div className="flex gap-2 mt-2"><button onClick={() => applyTrade(true)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]">ACCEPT TRADE</button><button onClick={() => applyTrade(false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-[10px]">DECLINE</button></div></div>}
    {peer && <div className="flex gap-2 justify-end">
      <button onClick={() => setTradeOpen(true)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-[10px]">🔄 TRADE</button>
      <button onClick={() => setGiftOpen(true)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]">🎁 GIFT</button>
    </div>}
    <div className="flex gap-3 flex-1 min-h-0">
      <div className="w-56 overflow-y-auto bg-card border border-border rounded-xl p-2">{friends.length ? friends.map(f => <button key={f.user_id} onClick={() => setPeer(f)} className={`w-full text-left px-3 py-2 rounded font-heading text-xs mb-1 ${peer?.user_id === f.user_id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>{f.username}</button>) : <p className="text-xs text-muted-foreground p-3">Add and accept a friend before chatting.</p>}</div>
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl min-w-0">{peer ? <><div className="px-3 py-2 border-b border-border font-heading text-sm">{peer.username}</div><div className="flex-1 overflow-y-auto p-3 space-y-2">{messages.map(m => <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><p className="text-[9px] opacity-70 mb-1">{m.sender_username}</p><p className="text-xs break-words">{m.body.replace(/\s*\[E6CLAN_INVITE:[^\]]+\]/, '')}</p>
{m.body.includes('[E6CLAN_INVITE:') && m.sender_username === 'Element 6' && m.recipient_id === user?.id && <button onClick={() => { const id = m.body.match(/\[E6CLAN_INVITE:([^\]]+)\]/)?.[1]; if (id) onAcceptClanInvite?.(id); }} className="mt-2 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]">✓ ACCEPT · 5,000 TOKENS</button>}</div></div>)}<div ref={bottomRef} /></div><div className="flex gap-2 p-3 border-t border-border"><input value={text} maxLength={1000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message…" className="flex-1 px-3 py-2 bg-secondary rounded text-sm" /><SoundButton onClick={send} disabled={!text.trim()} className="px-4 py-2 bg-accent rounded font-heading text-xs">SEND</SoundButton></div></> : <p className="m-auto text-sm text-muted-foreground">Choose a friend to start chatting.</p>}</div>
    </div>
    {tradeOpen && peer && <TradeOfferModal mode="trade" peer={{ ...peer, name: peer.username }} progress={progress} userId={user?.id} username={nameOf(user)} onConfirm={() => setTradeOpen(false)} onClose={() => setTradeOpen(false)} />}
    {giftOpen && peer && <TradeGiftModal mode="gift" peerName={peer.username} progress={progress} onConfirm={async data => { setGiftOpen(false); await onTransfer?.({ ...data, to: peer.user_id, peerName: peer.username, kind: 'gift' }); }} onClose={() => setGiftOpen(false)} />}
  </div>;
}
