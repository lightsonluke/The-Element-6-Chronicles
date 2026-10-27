import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function PartyStatusBar() {
  const [user, setUser] = useState(null);
  const [presence, setPresence] = useState(null);
  const [invite, setInvite] = useState(null);
  const seenInvites = React.useRef(new Set());
  useEffect(() => {
    let alive = true;
    let channel;
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(data?.user || null);
    };
    boot();
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => { alive = false; authSub?.subscription?.unsubscribe?.(); if (channel) supabase.removeChannel(channel); };
  }, []);
  useEffect(() => {
    if (!user) { setPresence(null); return; }
    let alive = true;
    const refresh = async () => {
      try {
        const screen = window.__el6CurrentScreen || 'menu';
        const mode = window.__el6CurrentMode || screen;
        const playing = Boolean(window.__el6IsPlaying) || (/fight|match|battle|sports|soccer|battleroyale|storybattle|storymode|team|rockclimb|parkour|dodgeball|volleyball|baseball|zipline|banger|ctf|grandcircuit|race|training|sandbox|creator/i.test(screen) && !/select|lobby|review|result|menu/i.test(screen));
        await supabase.rpc('element6_set_app_presence', { p_status: document.visibilityState === 'hidden' ? 'away' : playing ? 'playing' : 'online', p_mode: playing ? mode : null });
        const { data, error } = await supabase.rpc('element6_get_party_presence');
        if (!error && alive) setPresence(data || null);
        // CommunityHub has its own invite toast; elsewhere the persistent app
        // shell owns invitations so they work from every game mode and menu.
        if (window.__el6CurrentScreen !== 'hub') {
          const { data: invites } = await supabase.rpc('element6_list_my_party_invites');
          const fresh = (invites || []).find(i => !seenInvites.current.has(`${i.id}:${i.created_at}`));
          if (fresh && alive) { seenInvites.current.add(`${fresh.id}:${fresh.created_at}`); setInvite(fresh); }
        }
      } catch {}
    };
    refresh();
    const timer = setInterval(refresh, 3000);
    const channel = supabase.channel(`app-party-status:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'element6_party_members' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'element6_app_presence' }, refresh)
      .subscribe();
    const onVisibility = () => refresh();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); supabase.removeChannel(channel); };
  }, [user]);
  const party = presence?.party;
  const members = presence?.members || [];
  if (!user || (!party && !invite)) return null;
  return <div className="fixed top-0 left-0 right-0 z-[120] pointer-events-none px-2 pt-1">
    {party && members.length > 0 && <div className="pointer-events-auto mx-auto flex max-w-[min(100%,1400px)] flex-wrap items-center gap-1.5 rounded-lg border border-primary/50 bg-black/85 px-2 py-1 text-[10px] text-white shadow-xl backdrop-blur">
      <span className="mr-1 font-heading text-accent">PARTY {members.length}/8</span>
      {members.map(m => {
        const status = m.app_status || 'offline';
        const isOnline = status === 'online' || status === 'playing';
        return <span key={m.user_id} className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-1">
          <i className={`h-1.5 w-1.5 rounded-full ${status === 'playing' ? 'bg-sky-400' : isOnline ? 'bg-green-400' : 'bg-zinc-500'}`}/>
          <span>{m.username || 'Player'}{m.user_id === party.host_user_id ? ' ★' : ''}</span>
          <span className="text-white/60">{status === 'playing' ? `PLAYING ${String(m.current_mode || '').replace(/[_-]/g,' ').toUpperCase()}` : isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </span>;
      })}
      <span className="ml-auto text-white/60">CODE {party.party_code}</span>
    </div>}
    {invite && <div className="pointer-events-auto fixed right-3 top-12 z-[121] w-[min(360px,calc(100vw-24px))] rounded-lg border border-primary bg-card p-3 text-foreground shadow-2xl"><p className="font-heading text-xs text-accent">PARTY INVITE</p><p className="mt-1 text-xs"><b>{invite.from_username}</b> invited you to <b>{invite.party_name}</b>.</p>{invite.error && <p className="mt-1 text-[10px] text-destructive">{invite.error}</p>}<div className="mt-2 flex gap-2"><button onClick={async () => { const { error } = await supabase.rpc('element6_respond_party_invite',{p_invite_id:invite.id,p_accept:true}); if (!error) { setInvite(null); const { data } = await supabase.rpc('element6_get_party_presence'); setPresence(data || null); } else setInvite(prev => prev ? { ...prev, error: error.message } : prev); }} className="flex-1 rounded bg-accent px-2 py-1.5 text-xs font-heading text-accent-foreground">JOIN PARTY</button><button onClick={async () => { const { error } = await supabase.rpc('element6_respond_party_invite',{p_invite_id:invite.id,p_accept:false}); if (!error) setInvite(null); else setInvite(prev => prev ? { ...prev, error: error.message } : prev); }} className="flex-1 rounded bg-secondary px-2 py-1.5 text-xs font-heading">DECLINE</button></div></div>}
  </div>;
}
