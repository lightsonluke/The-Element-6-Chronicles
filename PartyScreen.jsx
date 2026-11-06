import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import GameIcon from './GameIcon.jsx';
import { getTitleById } from './profileTitles.js';
import { sfx } from './sfx.js';

const MODES = [
  ['customrooms','Custom Rooms',true],['banger-online','Banger Online 3v3 · 6 players',true],['volleyball-online','Volleyball Online 2v2 · 4 players',true],
  ['thetable','The Table',true],['battleroyale','Battle Royale · party queue',true],['grandcircuit-online','Grand Circuit · party tournament',true],
  ['lan','LAN Play',false],['soccer-online','Soccer Online 1v1 · 2 players',true],['dodgeball-online','Dodgeball Online 1v1 · 2 players',true],['ctf-online','Capture the Flag · 2v2',true],
];
const PARTY_SPORT_MODES = {
  'soccer-online':'soccer_online',
  'volleyball-online':'volleyball_2v2_online',
  'dodgeball-online':'dodgeball_online',
  'banger-online':'banger_online',
  'ctf-online':'ctf_party',
};
const nameOf = u => u?.user_metadata?.username || u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Player';

export default function PartyScreen({ onBack, onQueueMode }) {
  const [user,setUser]=useState(null), [party,setParty]=useState(null);
  const [publicParties,setPublicParties]=useState([]), [friends,setFriends]=useState([]), [invites,setInvites]=useState([]);
  const [mode,setMode]=useState(null), [isPublic,setIsPublic]=useState(true);
  const [error,setError]=useState(''), [loading,setLoading]=useState(true), [busy,setBusy]=useState(false), [autoInvite,setAutoInvite]=useState(true), [joinCode,setJoinCode]=useState('');
  const [notice,setNotice]=useState('');
  const [partyMessages,setPartyMessages]=useState([]), [chatText,setChatText]=useState(''), [sendingChat,setSendingChat]=useState(false);
  const launchedQueueRef=useRef('');

  const load=useCallback(async()=>{
    try {
      const {data:{user:u},error:authError}=await supabase.auth.getUser();
      if(authError) throw authError;
      setUser(u||null);
      if(!u){setParty(null);setLoading(false);setError('Sign in to use parties.');return;}

      // Always resolve membership and host recovery through the authoritative
      // presence snapshot. A stale host in an open lobby is elected on the
      // server before this roster is rendered.
      const {data:presence,error:mineError}=await supabase.rpc('element6_get_party_presence');
      if(mineError) throw mineError;
      const mine=presence?.party || null;
      setParty(mine);

      const [{data:pub,error:pubError},{data:reqs,error:reqError},{data:incoming,error:inviteError}]=await Promise.all([
        supabase.rpc('element6_list_public_parties'),
        supabase.from('player_friend_requests').select('*').or('sender_id.eq.'+u.id+',recipient_id.eq.'+u.id).eq('status','accepted'),
        supabase.rpc('element6_list_my_party_invites')
      ]);
      if(pubError) throw pubError;
      if(reqError) throw reqError;
      if(inviteError) throw inviteError;
      setInvites(incoming || []);
      const ids=[...new Set((reqs||[]).map(r=>r.sender_id===u.id?r.recipient_id:r.sender_id))];
      if(ids.length){
        const {data:ps,error:friendError}=await supabase.from('player_profiles').select('user_id,username').in('user_id',ids);
        if(friendError) throw friendError;
        setFriends(ps||[]);
      } else setFriends([]);
      setPublicParties((pub||[]).filter(x=>x.id!==mine?.id));
    } catch(e) {
      setError(e?.message||'Could not load party.');
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); const t=setInterval(load,2500); return()=>clearInterval(t); },[load]);

  const loadPartyChat=useCallback(async partyId=>{
    if(!partyId)return;
    try {
      const {data,error:e}=await supabase.from('community_hub_chat_messages').select('id,sender_id,sender_username,sender_title,body,created_at')
        .eq('channel','party').eq('channel_key',partyId).order('created_at',{ascending:false}).limit(100);
      if(e)throw e;
      setPartyMessages((data||[]).reverse());
    } catch(e) {setError(e?.message||'Could not load party chat.');}
  },[]);

  useEffect(()=>{
    if(!party?.id)return;
    loadPartyChat(party.id);
    const channel=supabase.channel(`party-chat:${party.id}`).on('postgres_changes',
      {event:'INSERT',schema:'public',table:'community_hub_chat_messages',filter:`channel_key=eq.${party.id}`},
      payload=>{if(payload.new?.channel==='party'&&payload.new?.channel_key===party.id)setPartyMessages(current=>current.some(message=>message.id===payload.new.id)?current:[...current,payload.new].slice(-100));}
    ).subscribe();
    const poll=setInterval(()=>loadPartyChat(party.id),8000);
    return()=>{clearInterval(poll);supabase.removeChannel(channel);};
  },[party?.id,loadPartyChat]);

  const sendPartyChat=async()=>{
    const body=chatText.trim();
    if(!body||body.length>300||!party?.id||!user||sendingChat)return;
    setSendingChat(true);setError('');
    try {
      const {error:e}=await supabase.from('community_hub_chat_messages').insert({
        channel:'party',channel_key:party.id,sender_id:user.id,sender_username:nameOf(user),body,
      });
      if(e)throw e;
      setChatText('');sfx.click();await loadPartyChat(party.id);
    } catch(e) {setError(e?.message||'Could not send party message.');}
    finally {setSendingChat(false);}
  };

  // When the host queues a party, every member sees the server-owned queued
  // state on refresh and is routed into the same selected mode. The ref keeps
  // the host from being launched twice by its own optimistic state update.
  useEffect(()=>{
    if(!party?.id || party.status!=='queued' || !party.queued_mode)return;
    const sessionId=party.queued_mode==='customrooms'?party.active_room_id:(party.queued_mode==='thetable'||party.queued_mode==='grandcircuit-online')?party.active_table_id:party.queued_mode==='sports-match'?party.active_sport_match_id:party.queued_mode==='battleroyale'?party.active_battle_royale_match_id:null;
    const key=`${party.id}:${party.queued_mode}:${sessionId||''}`;
    if(launchedQueueRef.current===key)return;
    launchedQueueRef.current=key;
    onQueueMode?.(party.queued_mode,party);
  },[party?.id,party?.status,party?.queued_mode,party?.active_room_id,party?.active_table_id,party?.active_sport_match_id,party?.active_battle_royale_match_id,onQueueMode]);

  const create=async()=>{
    if(!user || busy)return;
    setBusy(true);setError('');
    try {
      const {data,error:e}=await supabase.rpc('element6_create_party',{p_public:isPublic,p_name:nameOf(user)+"'s Party"});
      if(e)throw e;
      setParty(data); sfx.purchaseSuccess();
      if(autoInvite && friends.length) {
        const results=await Promise.all(friends.map(f=>supabase.rpc('element6_send_party_invite',{p_party_id:data.id,p_to_user:f.user_id})));
        const failed=results.filter(r=>r?.error);
        if(failed.length)setError(`Party created, but ${failed.length} friend invitation(s) failed. You can retry from the party panel.`);
      }
    } catch(e) { setError(e?.message||'Could not create party.'); }
    finally { setBusy(false); }
  };
  const join=async id=>{
    if(busy)return;
    setBusy(true);setError('');
    try {
      const args=id?{p_party_id:id,p_party_code:null}:{p_party_id:null,p_party_code:joinCode.trim().toUpperCase()};
      const {data,error:e}=await supabase.rpc('element6_join_party',args);
      if(e)throw e;
      setParty(data);sfx.click();
    } catch(e) { setError(e?.message||'Could not join party.'); }
    finally { setBusy(false); }
  };
  const leave=async()=>{
    if(!party||busy)return;
    setBusy(true);setError('');
    try {
      const {error:e}=await supabase.rpc('element6_leave_party',{p_party_id:party.id});
      if(e)throw e;
      setParty(null);setMode(null);sfx.click();await load();
    } catch(e) { setError(e?.message||'Could not leave party.'); }
    finally { setBusy(false); }
  };
  const invite=async id=>{
    if(!party||busy)return;
    setBusy(true);setError('');
    try {
      const {error:e}=await supabase.rpc('element6_send_party_invite',{p_party_id:party.id,p_to_user:id});
      if(e)throw e;
      sfx.purchaseSuccess();
    } catch(e) { setError(e?.message||'Could not send invitation.'); }
    finally { setBusy(false); }
  };
  const copyPartyCode=async()=>{
    if(!party?.party_code)return;
    setNotice('');
    try {
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(party.party_code);
      else {
        const field=document.createElement('textarea');
        field.value=party.party_code;field.setAttribute('readonly','');
        field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);
        field.select();
        const copied=document.execCommand('copy');
        document.body.removeChild(field);
        if(!copied)throw new Error('Clipboard access is unavailable.');
      }
      setNotice('Party code copied.');
    } catch(e) { setError(e?.message||'Could not copy the party code.'); }
  };
  const respondInvite=async(inviteId,accept)=>{
    if(busy)return;
    setBusy(true);setError('');
    try {
      const {data,error:e}=await supabase.rpc('element6_respond_party_invite',{p_invite_id:inviteId,p_accept:accept});
      if(e)throw e;
      if(data?.expired)throw new Error('This party invitation has expired. Ask your friend to send a new one.');
      if(data?.declined===true){sfx.click();}
      else sfx.purchaseSuccess();
      await load();
    } catch(e) { setError(e?.message||'Could not respond to the invitation.'); }
    finally { setBusy(false); }
  };
  const setReady=async ready=>{
    if(busy)return;
    setBusy(true);setError('');
    try {
      const {data,error:e}=await supabase.rpc('element6_set_party_ready',{p_ready:ready});
      if(e)throw e;
      setParty(data);sfx.click();
    } catch(e) { setError(e?.message||'Could not update ready status.'); }
    finally { setBusy(false); }
  };
  const transferHost=async userId=>{
    if(busy||!party)return;
    const member=party.members?.find(m=>m.user_id===userId);
    if(!member||!window.confirm(`Transfer party leadership to ${member.username}?`))return;
    setBusy(true);setError('');
    try {
      const {data,error:e}=await supabase.rpc('element6_transfer_party_host',{p_party_id:party.id,p_to_user:userId});
      if(e)throw e;
      setParty(data);sfx.click();
    } catch(e) { setError(e?.message||'Could not transfer party leadership.'); }
    finally { setBusy(false); }
  };
  const queue=async()=>{
    if(!party||!mode||busy)return;
    if(party.host_user_id!==user?.id){setError('Only the party host can start a shared activity.');return;}
    setBusy(true);setError('');
    try {
      const sportMode=PARTY_SPORT_MODES[mode];
      const rpcName=sportMode?(mode==='ctf-online'?'element6_party_queue_ctf':'element6_party_queue_online_sport'):mode==='customrooms'?'element6_party_create_custom_room':mode==='thetable'?'element6_party_join_the_table':mode==='battleroyale'?'element6_party_prepare_battle_royale':mode==='grandcircuit-online'?'element6_party_prepare_grand_circuit':null;
      if(!rpcName) throw new Error('This activity does not have a shared party session yet.');
      const args=sportMode?{p_party_id:party.id,p_mode:sportMode}:{p_party_id:party.id};
      const {data,error:e}=await supabase.rpc(rpcName,args);
      if(e)throw e;
      const activeSessionId=sportMode?data?.active_sport_match_id:(mode==='thetable'||mode==='grandcircuit-online')?data?.active_table_id:mode==='customrooms'?data?.active_room_id:data?.active_battle_royale_match_id;
      if(mode!=='battleroyale'&&!activeSessionId)throw new Error(sportMode?'The server did not create a shared sport match.':mode==='customrooms'?'The server did not create a party room.':'The server did not create the party tournament session.');
      const activityMode=sportMode?'sports-match':mode;
      launchedQueueRef.current=`${party.id}:${activityMode}:${activeSessionId}`;
      setParty(data);
      onQueueMode?.(activityMode,data);
      sfx.matchFound();
      return;
    } catch(e) { setError(e?.message||'Could not queue party.'); }
    finally { setBusy(false); }
  };

  if(loading)return <div className="py-20 text-center">Loading party…</div>;
  const isPartyHost=party?.host_user_id===user?.id;
  const requiredPartyPlayers=mode==='banger-online'?6:mode==='volleyball-online'||mode==='ctf-online'?4:PARTY_SPORT_MODES[mode]?2:null;
  const partyPlayerCount=(party?.members||[]).filter(member=>!member.spectator).length;
  return <div className="w-full max-w-4xl flex flex-col gap-4">
    <div className="flex items-center justify-between"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg"><GameIcon icon="info" size={14}/> BACK</button><h2 className="text-2xl font-heading text-accent">PARTY</h2><div className="w-20"/></div>
    {error&&<div role="alert" className="text-destructive text-xs text-center">{error}</div>}
    {notice&&<div role="status" className="text-primary text-xs text-center">{notice}</div>}
    {!party ? <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-primary">CREATE PARTY</h3><p className="text-xs text-muted-foreground mt-1">Up to 8 players. Public parties appear in the browser.</p>
        <label className="flex items-center gap-2 mt-4 text-xs"><input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)}/> PUBLIC PARTY</label>
        <label className="flex items-center gap-2 mt-2 text-xs"><input type="checkbox" checked={autoInvite} onChange={e=>setAutoInvite(e.target.checked)}/> AUTO-INVITE FRIENDS</label>
        <button disabled={busy} onClick={create} className="mt-4 w-full py-2 rounded bg-accent text-accent-foreground font-heading">CREATE PARTY</button>
      </div>
      <div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-primary">PUBLIC PARTIES</h3><div className="flex gap-2 mt-3"><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} maxLength={6} placeholder="PARTY CODE" className="flex-1 bg-secondary rounded px-2 py-2 text-xs font-heading tracking-widest"/><button disabled={busy || joinCode.trim().length!==6} onClick={()=>join(null)} className="px-3 rounded bg-primary text-primary-foreground text-xs">JOIN</button></div><div className="mt-3 space-y-2">{publicParties.length?publicParties.map(x=><button key={x.id} disabled={busy || (x.member_count||0)>=8} onClick={()=>join(x.id)} className="w-full text-left p-3 rounded border bg-secondary/40"><b>{x.name}</b><span className="float-right text-xs">{x.member_count||0}/8</span><div className="text-[10px] text-muted-foreground">Host: {x.host_username}</div></button>):<p className="text-xs text-muted-foreground">No public parties available.</p>}</div></div>
      {invites.length>0&&<div className="md:col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-4"><h3 className="font-heading text-primary">PARTY INVITATIONS</h3><div className="mt-2 space-y-2">{invites.map(invite=><div key={invite.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-3"><p className="min-w-0 flex-1 text-xs"><b>{invite.from_username}</b> invited you to <b>{invite.party_name}</b></p><button disabled={busy} onClick={()=>respondInvite(invite.id,true)} className="min-h-10 rounded-full bg-primary px-4 text-xs text-primary-foreground">JOIN</button><button disabled={busy} onClick={()=>respondInvite(invite.id,false)} className="min-h-10 rounded-full bg-secondary px-4 text-xs">DECLINE</button></div>)}</div></div>}
    </div>:
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-4">
      <div className="bg-card border rounded-xl p-5"><div className="flex justify-between gap-3"><div><h3 className="font-heading text-primary">{party.name}</h3><p className="text-xs text-muted-foreground">{party.member_count}/8 · {party.is_public?'PUBLIC':'PRIVATE'}</p><div className="mt-2 flex items-center gap-2"><span className="font-heading text-xs tracking-widest" aria-label={`Party code ${party.party_code}`}>{party.party_code}</span><button type="button" onClick={copyPartyCode} className="min-h-9 rounded-full bg-secondary px-3 text-[10px]" aria-label="Copy party code">COPY CODE</button></div></div><button disabled={busy} onClick={leave} className="min-h-10 text-xs text-destructive">LEAVE</button></div>
        <div className="mt-4 space-y-2">{(party.members||[]).map(m=>{const title=getTitleById(m.title)?.name||m.title;return <div key={m.user_id} className="flex flex-wrap items-center gap-2 p-2 rounded bg-secondary/40 text-xs"><span className="min-w-0 flex-1"><b>{m.username}</b>{m.user_id===user?.id&&<span className="ml-2 text-muted-foreground">YOU</span>}{m.user_id===party.host_user_id&&<span className="ml-2 text-accent">HOST</span>}{title&&<span className="ml-2 rounded-full border border-primary/40 px-2 py-0.5 text-[9px] text-primary" title={title}>{title}</span>}<span className="ml-2 text-muted-foreground">{m.app_status==='playing'?'IN MATCH':m.app_status==='away'?'AWAY':m.app_status==='online'?'ONLINE':'OFFLINE'}</span></span><span className={m.is_ready?'text-emerald-400':'text-muted-foreground'}>{m.is_ready?'READY':'NOT READY'}</span>{party.host_user_id===user?.id&&m.user_id!==user?.id&&<button disabled={busy} onClick={()=>transferHost(m.user_id)} className="min-h-9 rounded-full bg-secondary px-3 text-[10px]">MAKE HOST</button>}</div>})}</div>
        <button disabled={busy} onClick={()=>setReady(!(party.members||[]).find(m=>m.user_id===user?.id)?.is_ready)} className="mt-3 min-h-11 rounded-full bg-secondary px-4 text-xs font-heading">{(party.members||[]).find(m=>m.user_id===user?.id)?.is_ready?'NOT READY':'READY UP'}</button>
        <div className="mt-4"><h4 className="text-xs font-heading text-primary">FRIENDS</h4>{friends.filter(f=>!(party.members||[]).some(m=>m.user_id===f.user_id)).map(f=><button key={f.user_id} disabled={busy || (party.member_count||0)>=8} onClick={()=>invite(f.user_id)} className="w-full mt-1 p-2 text-left rounded bg-secondary/30 text-xs">+ INVITE {f.username}</button>)}</div>
      </div>
      <div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-primary">QUEUE AS A PARTY</h3><p className="text-xs text-muted-foreground">All party members are kept together.</p>
        <div className="grid grid-cols-2 gap-2 mt-4">{MODES.map(([id,label,supported])=><button key={id} type="button" disabled={!supported} aria-disabled={!supported} title={supported?'':'Party launch is not connected to a shared match session yet.'} onClick={()=>supported&&setMode(id)} className={'min-h-12 p-2 rounded-xl border text-xs disabled:cursor-not-allowed disabled:opacity-45 '+(mode===id?'border-accent bg-accent/10':'border-border bg-secondary/30')}>{label}{!supported&&<span className="mt-1 block text-[9px] text-muted-foreground">UNAVAILABLE FOR PARTIES</span>}</button>)}</div>
        {PARTY_SPORT_MODES[mode]&&<p className="mt-2 text-[10px] text-muted-foreground">The whole party enters one private sport match. The server requires exactly {mode==='banger-online'?6:mode==='volleyball-online'||mode==='ctf-online'?4:2} connected, ready members.</p>}
        {mode==='grandcircuit-online'&&<p className="mt-2 text-[10px] text-muted-foreground">Party-only elimination tournament for 2–8 ready members. It uses the existing online fight match for each round; eliminated members wait for the final result.</p>}
        {requiredPartyPlayers&&partyPlayerCount!==requiredPartyPlayers&&<p role="status" className="mt-2 text-[10px] text-amber-300">{mode.replace('-online','')} needs exactly {requiredPartyPlayers} human party members; currently {partyPlayerCount}.</p>}
        <p className="mt-3 text-[10px] text-muted-foreground">{(party.members||[]).filter(m=>m.is_ready).length} / {party.member_count||0} members ready</p>
        {!isPartyHost&&<p className="mt-3 text-[10px] text-muted-foreground">Only the host can start a shared activity.</p>}
        <button onClick={queue} disabled={!isPartyHost||!mode||busy||!(party.members||[]).length||(party.members||[]).some(m=>!m.is_ready)||(requiredPartyPlayers!==null&&partyPlayerCount!==requiredPartyPlayers)} className="mt-4 w-full py-3 rounded bg-primary text-primary-foreground font-heading disabled:opacity-40">{isPartyHost?'START PARTY':'WAITING FOR HOST'}{mode?' · '+mode.toUpperCase():''}</button>
      </div>
      <div className="md:col-span-2 bg-card border rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3"><h3 className="font-heading text-primary">PARTY CHAT</h3><span className="text-[10px] text-muted-foreground">Only current party members can read and send messages</span></div>
        <div role="log" aria-live="polite" className="mt-3 max-h-48 min-h-20 space-y-2 overflow-y-auto rounded-xl border border-border bg-background/40 p-3">
          {partyMessages.length?partyMessages.map(message=>{const title=getTitleById(message.sender_title)?.name||message.sender_title;return <p key={message.id} className="break-words text-xs"><b className="text-accent">{message.sender_username||'Player'}</b>{title&&<span className="ml-1 rounded-full border border-primary/40 px-1.5 py-0.5 text-[9px] text-primary" title={title}>{title}</span>}<span className="mx-2 text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</span>{message.body}</p>}):<p className="py-5 text-center text-xs text-muted-foreground">Start a conversation with your party.</p>}
        </div>
        <div className="mt-2 flex gap-2"><input value={chatText} maxLength={300} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendPartyChat();}}} aria-label="Party chat message" placeholder="Message your party" className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"/><button type="button" disabled={sendingChat||!chatText.trim()} onClick={sendPartyChat} className="min-h-11 rounded-full bg-primary px-4 text-xs font-heading text-primary-foreground disabled:opacity-45">SEND</button></div>
      </div>
    </div>}
  </div>;
}
