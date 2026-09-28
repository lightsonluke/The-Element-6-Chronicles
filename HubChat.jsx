import { supabase } from './supabaseClient.js';
import React, { useState, useEffect, useRef } from 'react';
import { sfx } from './sfx.js';
import GameIcon from './GameIcon.jsx';

export default function HubChat({ userId, username, serverCode, partyId, partyName, onClose }) {
  const [channel, setChannel] = useState('server');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const lastCountRef = useRef(0);
  const channelType = channel === 'server' ? 'server' : channel === 'world' ? 'world' : 'party';
  const channelKey = channel === 'server' ? (serverCode || 'default') : channel === 'world' ? 'world' : partyId || '';

  const load = async () => {
    if (!channelKey) { setMessages([]); return; }
    const { data, error: e } = await supabase
      .from('community_hub_chat_messages')
      .select('id,channel,channel_key,sender_id,sender_username,body,created_at')
      .eq('channel', channelType)
      .eq('channel_key', channelKey)
      .order('created_at', { ascending: true })
      .limit(100);
    if (e) { setError(e.message); return; }
    setError('');
    setMessages(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    load();
    const filter = `channel=eq.${channelType}`;
    const ch = supabase.channel(`hub-chat-${channelType}-${channelKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_hub_chat_messages', filter }, () => { if (!cancelled) load(); })
      .subscribe();
    const t = setInterval(() => { if (!cancelled) load(); }, 2500);
    return () => { cancelled = true; clearInterval(t); supabase.removeChannel(ch); };
  }, [channelType, channelKey]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (messages.length > lastCountRef.current) sfx.notification();
    lastCountRef.current = messages.length;
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !channelKey || !userId) return;
    setText(''); setError('');
    const { error: e } = await supabase.from('community_hub_chat_messages').insert({
      channel: channelType,
      channel_key: channelKey,
      sender_id: userId,
      sender_username: username || 'Player',
      body: body.slice(0, 300),
    });
    if (e) { setError(e.message); setText(body); return; }
    sfx.click();
  };

  const tabs = [
    { id: 'server', label: 'SERVER', available: !!serverCode },
    { id: 'world', label: 'WORLD', available: true },
    { id: 'party', label: `PARTY${partyName ? '' : ' (none)'}`, available: !!partyId },
  ].filter(t => t.available || t.id === 'party');

  return <div className="fixed bottom-0 left-0 z-50 w-80 max-w-[90%] bg-card border-2 border-primary rounded-t-xl shadow-2xl flex flex-col" style={{maxHeight:'60vh'}}>
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      <div className="flex gap-1">{tabs.map(t=><button key={t.id} onClick={()=>{setChannel(t.id);setError('');sfx.click();}} className={`px-2 py-1 rounded font-heading text-[9px] ${channel===t.id?'bg-primary text-primary-foreground':'bg-secondary text-secondary-foreground'}`}>{t.label}</button>)}</div>
      <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground"><GameIcon emoji="✕" size={14}/></button>
    </div>
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-[200px]">
      {error && <p className="text-[9px] text-destructive mb-2 break-words">{error}</p>}
      {messages.length===0 && !error ? <p className="text-[10px] text-muted-foreground italic text-center mt-4">No messages yet. Say something!</p> : messages.map(m=><div key={m.id} className={`text-xs ${m.sender_id===userId?'text-right':''}`}><span className="font-heading text-[9px] text-accent">{m.sender_username||'Player'}: </span><span className="font-body text-foreground break-words">{m.body}</span></div>)}
    </div>
    <div className="flex gap-1 px-3 py-2 border-t border-border">
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} placeholder={channelType==='party'&&!partyId?'Join a party to use party chat':`Message ${channel}...`} maxLength={300} disabled={!channelKey} className="flex-1 bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-body disabled:opacity-50"/>
      <button onClick={send} disabled={!channelKey||!text.trim()} className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-[10px] disabled:opacity-50"><GameIcon emoji="➤" size={14}/></button>
    </div>
  </div>;
}
