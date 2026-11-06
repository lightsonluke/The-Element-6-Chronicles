import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import TradeGiftModal from './TradeGiftModal.jsx';
import TradeOfferModal from './TradeOfferModal.jsx';
import SoundButton from './SoundButton.jsx';
import GameIcon from './GameIcon.jsx';
import { getAccessory } from './cosmetics.js';
import { getSkin } from './skins.js';
import { getKillFX } from './killFX.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getTitleById } from './profileTitles.js';

const nameOf = (u) => u?.user_metadata?.username || u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Player';
const ALL_CHARS = [...HEROES, ...VILLAINS, ...GUARDIANS];

export default function ChatPanel({ onBack, initialDM, onMarkSeen, progress, onTransfer, onAcceptClanInvite, onRefreshProgress }) {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [tradeOpen, setTradeOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [activeTransfer, setActiveTransfer] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
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
    const channel = supabase.channel(`dm-${user.id}-${peer.user_id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_direct_messages' }, payload => {
      const m = payload.new;
      if ((m.sender_id === user.id && m.recipient_id === peer.user_id) || (m.sender_id === peer.user_id && m.recipient_id === user.id)) loadMessages(user, peer);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, peer, loadMessages]);

  const openTransfer = async (kind, id) => {
    if (!id) return;
    setTransferLoading(true); setError('');
    try {
      const { data, error: fetchError } = await supabase.from('element6_trade_gifts').select('*').eq('id', id).single();
      if (fetchError) throw fetchError;
      if (!data || (data.from_user_id !== user?.id && data.to_user_id !== user?.id)) throw new Error('This transaction is not available to your account.');
      if ((kind === 'gift' && data.type !== 'gift') || (kind === 'trade' && !['trade_request','trade_completed'].includes(data.type))) throw new Error('The transaction message does not match its record.');
      setActiveTransfer(data);
    } catch (e) { setError(e?.message || 'Could not open this transaction.'); sfx.warning(); }
    finally { setTransferLoading(false); }
  };

  const resolveTransfer = async accept => {
    if (!activeTransfer || !user || activeTransfer.to_user_id !== user.id) return;
    try {
      const rpc = activeTransfer.type === 'gift' ? 'element6_accept_gift' : 'element6_accept_trade';
      const args = activeTransfer.type === 'gift'
        ? { p_gift_id: activeTransfer.id, p_accept: accept }
        : { p_trade_id: activeTransfer.id, p_accept: accept };
      const { data: result, error: resolveError } = await supabase.rpc(rpc, args);
      if (resolveError) throw resolveError;
      const { data, error: reloadError } = await supabase.from('element6_trade_gifts').select('*').eq('id', activeTransfer.id).single();
      if (reloadError) throw reloadError;
      setActiveTransfer(data);
      await loadMessages(user, peer);
      if ((accept && result?.status === 'completed') || (!accept && result?.status === 'declined')) {
        if (accept) {
          sfx.purchaseSuccess();
          try { await onRefreshProgress?.(); }
          catch { setError('The transaction completed. Inventory refresh failed; reopen your account after reconnecting.'); }
        } else sfx.click();
      } else {
        setError(`This offer is ${result?.status || 'no longer pending'}.`);
        sfx.warning();
      }
    } catch (e) { setError(e?.message || 'Could not resolve this offer. The server did not confirm a change.'); sfx.warning(); }
  };

  const cancelTransfer = async () => {
    if (!activeTransfer || activeTransfer.from_user_id !== user?.id) return;
    try {
      const { error: cancelError } = await supabase.rpc('element6_cancel_transfer', { p_transaction_id: activeTransfer.id });
      if (cancelError) throw cancelError;
      const { data, error: reloadError } = await supabase.from('element6_trade_gifts').select('*').eq('id', activeTransfer.id).single();
      if (reloadError) throw reloadError;
      setActiveTransfer(data); await loadMessages(user, peer); sfx.click();
    } catch (e) { setError(e?.message || 'Could not cancel the offer.'); }
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
      <div className="flex justify-between items-center"><h2 className="text-2xl font-heading text-accent"><GameIcon icon="comment" size={14} /> FRIEND CHAT</h2><SoundButton onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg font-heading text-sm">← BACK</SoundButton></div>
    {error && <p className="text-xs text-destructive text-center">{error}</p>}
    {clanInvites.length > 0 && <div className="space-y-2">{clanInvites.map(inv => { const id = inv.body.match(/\[E6CLAN_INVITE:([^\]]+)\]/)?.[1]; return <div key={inv.id} className="rounded-lg border-2 border-accent bg-accent/10 p-3"><p className="font-heading text-xs text-accent">ELEMENT 6 · CLAN FOUNDING REQUEST</p><p className="text-xs mt-1">You have been requested to Found a clan! Click here to accept!</p><button onClick={async () => { if (id) { await onAcceptClanInvite?.(id); setClanInvites(v => v.filter(x => x.id !== inv.id)); } }} className="mt-2 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]"> ACCEPT · 5,000 TOKENS</button></div>; })}</div>}
    {peer && <div className="flex gap-2 justify-end">
      <button onClick={() => setTradeOpen(true)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-[10px]"> TRADE</button>
      <button onClick={() => setGiftOpen(true)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]"> GIFT</button>
    </div>}
    <div className="flex gap-3 flex-1 min-h-0">
      <div className="w-56 overflow-y-auto bg-card border border-border rounded-xl p-2">{friends.length ? friends.map(f => <button key={f.user_id} onClick={() => setPeer(f)} className={`w-full text-left px-3 py-2 rounded font-heading text-xs mb-1 ${peer?.user_id === f.user_id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>{f.username}</button>) : <p className="text-xs text-muted-foreground p-3">Add and accept a friend before chatting.</p>}</div>
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl min-w-0">{peer ? <><div className="px-3 py-2 border-b border-border font-heading text-sm">{peer.username}</div><div className="flex-1 overflow-y-auto p-3 space-y-2">{messages.map(m => <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><p className="text-[9px] opacity-70 mb-1">{m.sender_username}{m.sender_title&&<span className="ml-1 rounded-full border border-current/30 px-1.5 py-0.5 text-[8px]" title={getTitleById(m.sender_title)?.name || m.sender_title}>{getTitleById(m.sender_title)?.name || m.sender_title}</span>}</p>{(() => { const tx = m.body.match(/\[E6(GIFT|TRADE):([^\]]+)\]/); const plain = m.body.replace(/\s*\[E6(?:GIFT|TRADE):[^\]]+\]/g, '').replace(/\s*\[E6CLAN_INVITE:[^\]]+\]/, ''); return <><p className="text-xs break-words">{plain}</p>{tx && <button type="button" onClick={() => openTransfer(tx[1] === 'GIFT' ? 'gift' : 'trade', tx[2])} className="mt-2 inline-flex items-center gap-2 rounded-full border border-current/30 px-3 py-1.5 text-xs font-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{transferLoading ? 'LOADING OFFER…' : tx[1] === 'GIFT' ? 'OPEN GIFT OFFER' : 'OPEN TRADE OFFER'} <GameIcon icon="arrowRight" size={13} /></button>}</>; })()}
{m.body.includes('[E6CLAN_INVITE:') && m.sender_username === 'Element 6' && m.recipient_id === user?.id && <button onClick={() => { const id = m.body.match(/\[E6CLAN_INVITE:([^\]]+)\]/)?.[1]; if (id) onAcceptClanInvite?.(id); }} className="mt-2 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]"> ACCEPT · 5,000 TOKENS</button>}</div></div>)}<div ref={bottomRef} /></div><div className="flex gap-2 p-3 border-t border-border"><input value={text} maxLength={1000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message…" className="flex-1 px-3 py-2 bg-secondary rounded text-sm" /><SoundButton onClick={send} disabled={!text.trim()} className="px-4 py-2 bg-accent rounded font-heading text-xs">SEND</SoundButton></div></> : <p className="m-auto text-sm text-muted-foreground">Choose a friend to start chatting.</p>}</div>
    </div>
    {tradeOpen && peer && <TradeOfferModal mode="trade" peer={{ ...peer, name: peer.username }} progress={progress} userId={user?.id} username={nameOf(user)} onConfirm={() => setTradeOpen(false)} onClose={() => setTradeOpen(false)} />}
    {giftOpen && peer && <TradeGiftModal mode="gift" peerName={peer.username} progress={progress} onConfirm={async data => { await onTransfer?.({ ...data, to: peer.user_id, peerName: peer.username, kind: 'gift' }); setGiftOpen(false); }} onClose={() => setGiftOpen(false)} />}
    {activeTransfer && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4" role="presentation" onClick={() => setActiveTransfer(null)}><section role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="w-full max-w-xl rounded-3xl border border-accent/50 bg-card p-5 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-heading uppercase tracking-widest text-accent">Account transaction</p><h3 id="transfer-title" className="mt-1 text-xl font-heading">{activeTransfer.type === 'gift' ? 'Gift offer' : 'Trade offer'}</h3></div><button type="button" onClick={() => setActiveTransfer(null)} aria-label="Close offer" className="rounded-full border border-border p-2"><GameIcon icon="close" size={14} /></button></div><p className="mt-3 text-sm">{activeTransfer.from_username} → {activeTransfer.to_username}</p><TransferItems label={activeTransfer.type === 'gift' ? 'Gift' : 'Offered'} payload={activeTransfer.give} /><TransferItems label="Requested" payload={activeTransfer.request} />{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-4 flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-heading ${activeTransfer.status === 'pending' ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>{activeTransfer.status.toUpperCase()}</span>{activeTransfer.status === 'pending' && activeTransfer.to_user_id === user?.id && <div className="flex gap-2"><button type="button" onClick={() => resolveTransfer(false)} className="rounded-full border border-border px-4 py-2 text-xs font-heading">REJECT</button><button type="button" onClick={() => resolveTransfer(true)} className="rounded-full bg-accent px-4 py-2 text-xs font-heading text-accent-foreground">ACCEPT</button></div>}{activeTransfer.status === 'pending' && activeTransfer.from_user_id === user?.id && <button type="button" onClick={cancelTransfer} className="rounded-full border border-border px-4 py-2 text-xs font-heading">CANCEL OFFER</button>}</div></section></div>}
  </div>;
}

function TransferItems({ label, payload }) {
  if (!payload) return null;
  const meta = {
    skins: { title: 'Skin', icon: 'palette', name: id => getSkin(id)?.name || id },
    accessories: { title: 'Accessory', icon: 'package', name: id => getAccessory(id)?.name || id },
    killFX: { title: 'KO effect', icon: 'bolt', name: id => getKillFX(id)?.name || id },
    chars: { title: 'Character', icon: 'user', name: id => ALL_CHARS.find(char => char.id === id)?.name || id },
  };
  const entries = Object.entries(meta).flatMap(([key, item]) => (payload[key] || []).map(id => ({ key, ...item, id, text: item.name(id) })));
  if (Number(payload.tokens) > 0) entries.unshift({ key: 'tokens', title: 'Tokens', icon: 'star', text: `${Number(payload.tokens).toLocaleString()} Tokens` });
  if (!entries.length) return null;
  return <div className="mt-4 rounded-2xl border border-border bg-background/50 p-3"><p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground">{label}</p><ul className="mt-2 space-y-1 text-sm">{entries.map((entry, index) => <li key={`${entry.key}-${entry.id || 'tokens'}-${index}`} className="flex items-center gap-2"><GameIcon icon={entry.icon} size={14} /><span>{entry.text}</span>{entry.title !== 'Tokens' && <span className="text-[10px] text-muted-foreground">{entry.title}</span>}</li>)}</ul></div>;
}
