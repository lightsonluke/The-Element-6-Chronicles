import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import GameIcon from './GameIcon.jsx';

const KEY = 'element6_social_notifications_v1';

function enabledFrom(settings) {
  if (settings && settings.socialNotifications === false) return false;
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export default function GlobalNotifications({ settings = {} }) {
  const [items, setItems] = useState([]);
  const seen = useRef(new Set());
  const previousPresence = useRef(new Map());

  useEffect(() => {
    if (!enabledFrom(settings)) return undefined;
    let alive = true;
    let channel = null;
    let timer = null;

    const push = (title, text, icon = '🔔', key = '') => {
      if (!alive || !enabledFrom(settings)) return;
      if (key && seen.current.has(key)) return;
      if (key) {
        seen.current.add(key);
        if (seen.current.size > 300) seen.current = new Set([...seen.current].slice(-150));
      }
      const id = `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
      setItems(prev => [...prev.slice(-4), { id, title, text, icon }]);
      window.setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 6000);
    };

    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !alive) return;

      // Prime existing requests/messages/presence so opening the game does not
      // generate a wall of old notifications.
      try {
        const { data: requests } = await supabase
          .from('player_friend_requests')
          .select('id,status,sender_id,recipient_id,updated_at')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('updated_at', { ascending: false })
          .limit(50);
        (requests || []).forEach(r => seen.current.add(`fr_${r.id}_${r.status}`));
      } catch {}

      const { data: friendRows } = await supabase
        .from('player_friend_requests')
        .select('sender_id,recipient_id,status')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

      const friendIds = [...new Set((friendRows || []).map(r => r.sender_id === user.id ? r.recipient_id : r.sender_id))];

      if (friendIds.length) {
        const { data: presence } = await supabase
          .from('player_presence')
          .select('user_id,username,last_active')
          .in('user_id', friendIds);
        (presence || []).forEach(p => previousPresence.current.set(p.user_id, new Date(p.last_active).getTime()));
      }

      channel = supabase.channel(`element6-global-notifications:${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_direct_messages', filter: `recipient_id=eq.${user.id}` }, payload => {
          const row = payload.new;
          push('NEW CHAT', `${row.sender_username || 'Someone'} sent you a message.`, '💬', `dm_${row.id}`);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_friend_requests', filter: `recipient_id=eq.${user.id}` }, async payload => {
          const row = payload.new;
          let name = 'Someone';
          try {
            const { data: p } = await supabase.from('player_profiles').select('username').eq('user_id', row.sender_id).maybeSingle();
            name = p?.username || name;
          } catch {}
          push('FRIEND REQUEST', `${name} sent you a friend request.`, '👥', `fr_${row.id}_pending`);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player_friend_requests', filter: `sender_id=eq.${user.id}` }, async payload => {
          const row = payload.new;
          if (row.status !== 'accepted') return;
          let name = 'Your friend';
          try {
            const { data: p } = await supabase.from('player_profiles').select('username').eq('user_id', row.recipient_id).maybeSingle();
            name = p?.username || name;
          } catch {}
          push('FRIEND REQUEST ACCEPTED', `${name} accepted your friend request.`, '✅', `fr_${row.id}_accepted`);
        })
        .subscribe();

      const heartbeat = async () => {
        try {
          await supabase.from('player_presence').upsert({
            user_id: user.id,
            username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player',
            last_active: new Date().toISOString()
          }, { onConflict: 'user_id' });
        } catch {}
      };
      await heartbeat();
      const heartbeatTimer = window.setInterval(heartbeat, 30000);

      const pollPresence = async () => {
        if (!alive || !friendIds.length || !enabledFrom(settings)) return;
        const { data: presence } = await supabase
          .from('player_presence')
          .select('user_id,username,last_active')
          .in('user_id', friendIds);
        const now = Date.now();
        (presence || []).forEach(p => {
          const stamp = new Date(p.last_active).getTime();
          const was = previousPresence.current.get(p.user_id) || 0;
          // A friend is considered online when their heartbeat is recent.
          const online = Number.isFinite(stamp) && now - stamp < 120000;
          const wasOnline = Number.isFinite(was) && now - was < 120000;
          if (online && !wasOnline) {
            push('FRIEND ONLINE', `${p.username || 'Your friend'} is now online.`, '🟢', `online_${p.user_id}_${Math.floor(stamp / 60000)}`);
          }
          previousPresence.current.set(p.user_id, stamp);
        });
      };

      await pollPresence();
      timer = window.setInterval(pollPresence, 30000);
      // Keep the heartbeat timer separate from friend polling.
      setup._heartbeatTimer = heartbeatTimer;
    };

    setup().catch(() => {});

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      if (setup._heartbeatTimer) clearInterval(setup._heartbeatTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [settings?.socialNotifications]);

  if (!items.length) return null;

  return (
    <div className="fixed top-3 left-3 z-[100000] pointer-events-none flex w-[min(360px,calc(100vw-24px))] flex-col gap-2">
      {items.map(item => (
        <div key={item.id} className="pointer-events-none rounded-xl border-2 border-accent bg-card/95 px-3 py-2 shadow-2xl backdrop-blur animate-in slide-in-from-left-3">
          <div className="flex items-center gap-2">
            <span className="text-lg"><GameIcon emoji={item.icon} size={14} /></span>
            <div className="min-w-0">
              <p className="font-heading text-[10px] text-accent">{item.title}</p>
              <p className="text-xs text-foreground truncate">{item.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
