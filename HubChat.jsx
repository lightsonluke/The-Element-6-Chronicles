import db from './localBackend';

import React, { useState, useEffect, useRef } from 'react';

import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Hub chat overlay — three channels:
// - Server: only players in your hub server (conversation_id = "hub_{serverCode}")
// - World: everyone across all servers (conversation_id = "hub_world")
// - Party: your party members (conversation_id = "party_{partyId}")
export default function HubChat({ userId, username, serverCode, partyId, partyName, onClose }) {
  const [channel, setChannel] = useState('server');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [allWorldMsgs, setAllWorldMsgs] = useState([]);
  const scrollRef = useRef(null);
  const lastCountRef = useRef(0);

  const convId = channel === 'server' ? `hub_${serverCode}` : channel === 'world' ? 'hub_world' : partyId ? `party_${partyId}` : null;

  // Load messages for current channel
  useEffect(() => {
    if (!convId) { setMessages([]); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const list = await db.entities.ChatMessage.filter({ conversation_id: convId }, '-created_date', 80);
        if (cancelled) return;
        const sorted = (list || []).reverse();
        setMessages(sorted);
        lastCountRef.current = sorted.length;
      } catch {}
    };
    load();
    const unsub = db.entities.ChatMessage.subscribe((ev) => {
      if (ev.data?.conversation_id === convId) {
        load();
      }
    });
    const t = setInterval(load, 4000);
    return () => { cancelled = true; unsub?.(); clearInterval(t); };
  }, [convId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (messages.length > lastCountRef.current) sfx.notification();
    lastCountRef.current = messages.length;
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || !convId) return;
    setText('');
    try {
      await db.entities.ChatMessage.create({
        conversation_id: convId,
        sender_user_id: userId,
        sender_username: username,
        text: t.slice(0, 300),
      });
    } catch {}
  };

  const tabs = [
    { id: 'server', label: 'SERVER', available: !!serverCode },
    { id: 'world', label: 'WORLD', available: true },
    { id: 'party', label: `PARTY${partyName ? '' : ' (none)'}`, available: !!partyId },
  ].filter(t => t.available || t.id === 'party');

  return (
    <div className="fixed bottom-0 left-0 z-50 w-80 max-w-[90%] bg-card border-2 border-primary rounded-t-xl shadow-2xl flex flex-col" style={{ maxHeight: '60vh' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setChannel(t.id); sfx.click(); }}
              className={`px-2 py-1 rounded font-heading text-[9px] ${channel === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground"><GameIcon emoji="✕" size={14} /></button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-[200px]">
        {messages.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic text-center mt-4">No messages yet. Say something!</p>
        ) : messages.map(m => (
          <div key={m.id} className={`text-xs ${m.sender_user_id === userId ? 'text-right' : ''}`}>
            <span className="font-heading text-[9px] text-accent">{m.sender_username || 'Player'}: </span>
            <span className="font-body text-foreground break-words">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 px-3 py-2 border-t border-border">
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder={convId ? `Message ${channel}...` : 'Join a party to use party chat'}
          maxLength={300} disabled={!convId}
          className="flex-1 bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-body disabled:opacity-50"
        />
        <button onClick={send} disabled={!convId || !text.trim()} className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-[10px] disabled:opacity-50"><GameIcon emoji="➤" size={14} /></button>
      </div>
    </div>
  );
}