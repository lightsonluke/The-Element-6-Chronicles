import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import GameIcon from './GameIcon.jsx';
import { sfx } from './sfx.js';

const MODES = [
  ['customrooms','Custom Rooms'],['banger-online','Banger Online 3v3'],['volleyball-online','Volleyball Online 2v2'],
  ['thetable','The Table'],['battleroyale','Battle Royale'],['grandcircuit-online','Grand Circuit'],
  ['lan','LAN Play'],['soccer-online','Soccer Online'],['dodgeball-online','Dodgeball Online'],
  ['race','Race'],['ctf-online','Capture the Flag'],
];

const nameOf = u => u?.user_metadata?.username || u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Player';

export default function PartyScreen({ onBack, onQueueMode }) {
  const [user,setUser]=useState(null); const [party,setParty]=useState(null);
  const [publicParties,setPublicParties]=useState([]); const [friends,setFriends]=useState([]);
  const [mode,setMode]=useState(null); const [isPublic,setIsPublic]=useState(true);
  const [error,setError]=useState(''); const [loading,setLoading]=useState(true); const [autoInvite,setAutoInvite]=useState(true); const [joinCode,setJoinCode]=useState('');

  const load=useCallback(async()=>{
    const {data:{user:u}}=await supabase.auth.getUser(); setUser(u);
    if(!u){setLoading(false);setError('Sign in to use parties.');return;}
    const [{data:mine},{data:pub},{data:reqs}] = await Promise.all([
      supabase.from('element6_parties').select('*').eq('host_user_id',u.id).maybeSingle(),
      supabase.from('element6_parties').select('*').eq('is_public',true).eq('status','open').order('created_at',{ascending:false}).limit(30),
      supabase.from('player_friend_requests').select('*').or('sender_id.eq.' + u.id + ',recipient_id.eq.' + u.id).eq('status','accepted')
    ]);
    setParty(mine || null);
    const ids=[...new Set((reqs||[]).map(r=>r.sender_id===u.id?r.recipient_id:r.sender_id))];
    if(ids.length){const {data:ps}=await supabase.from('player_profiles').select('user_id,username').in('user_id',ids);setFriends(ps||[]);} else setFriends([]);
    setPublicParties((pub||[]).filter(p=>p.id!==mine?.id)); setLoading(false);
  },[]);

  useEffect(()=>{load(); const t=setInterval(load,2500); return()=>clearInterval(t)},[load]);

  const create=async()=>{if(!user)return;setError('');const {data,error:e}=await supabase.rpc('element6_create_party',{p_public:isPublic,p_name:nameOf(user) + "'s Party"});if(e){setError(e.message);return;}setParty(data);sfx.purchaseSuccess();
    if(autoInvite && friends.length) await Promise.all(friends.map(f=>supabase.rpc('element6_send_party_invite',{p_party_id:data.id,p_to_user:f.user_id}).catch(()=>null)));
  };
  const join=async id=>{const args=id?{p_party_id:id}:{p_party_code:joinCode.trim()};const {data,error:e}=await supabase.rpc('element6_join_party',args);if(e){setError(e.message);return;}setParty(data);sfx.click()};
  const leave=async()=>{if(!party)return;await supabase.rpc('element6_leave_party',{p_party_id:party.id}).catch(()=>{});setParty(null)};
  const invite=async id=>{if(!party)return;const {error:e}=await supabase.rpc('element6_send_party_invite',{p_party_id:party.id,p_to_user:id});if(e)setError(e.message);else sfx.purchaseSuccess()};
  const queue=async()=>{if(!party||!mode)return;const {data,error:e}=await supabase.rpc('element6_party_prepare_match',{p_party_id:party.id,p_mode:mode});if(e){setError(e.message);return;} onQueueMode?.(mode,e?.data||data)};

  if(loading)return <div className="py-20 text-center">Loading party…</div>;
  return <div className="w-full max-w-4xl flex flex-col gap-4">
    <div className="flex items-center justify-between"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg"><GameIcon emoji="←" size={14}/> BACK</button><h2 className="text-2xl font-heading text-accent">PARTY</h2><div className="w-20"/></div>
    {error&&<div className="text-destructive text-xs text-center">{error}</div>}
    {!party ? <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-primary">CREATE PARTY</h3><p className="text-xs text-muted-foreground mt-1">Up to 8 players. Public parties appear in the browser.</p>
        <label className="flex items-center gap-2 mt-4 text-xs"><input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)}/> PUBLIC PARTY</label>
        <label className="flex items-center gap-2 mt-2 text-xs"><input type="checkbox" checked={autoInvite} onChange={e=>setAutoInvite(e.target.checked)}/> AUTO-INVITE FRIENDS</label>
        <button onClick={create} className="mt-4 w-full py-2 rounded bg-accent text-accent-foreground font-heading">CREATE PARTY</button>
      </div>
      <div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-primary">PUBLIC PARTIES</h3><div className="flex gap-2 mt-3"><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={6} placeholder="PARTY CODE" className="flex-1 bg-secondary rounded px-2 py-2 text-xs font-heading tracking-widest"/><button onClick={()=>join(null)} className="px-3 rounded bg-primary text-primary-foreground text-xs">JOIN</button></div><div className="mt-3 space-y-2">{publicParties.length?publicParties.map(p=><button key={p.id} onClick={()=>join(p.id)} className="w-full text-left p-3 rounded border bg-secondary/40"><b>{p.name}</b><span className="float-right text-xs">{p.member_count||0}/8</span><div className="text-[10px] text-muted-foreground">Host: {p.host_username}</div></button>):<p className="text-xs text-muted-foreground">No public parties available.</p>}</div></div>
    </div>:
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-4">
      <div className="bg-card border rounded-xl p-5"><div className="flex justify-between"><div><h3 className="font-heading text-primary">{party.name}</h3><p className="text-xs text-muted-foreground">{party.member_count}/8 · {party.is_public?'PUBLIC':'PRIVATE'} · CODE <b>{party.party_code}</b></p></div><button onClick={leave} className="text-xs text-destructive">LEAVE</button></div>
        <div className="mt-4 space-y-2">{(party.members||[]).map(m=><div key={m.user_id} className="p-2 rounded bg-secondary/40 text-xs"><b>{m.username}</b>{m.user_id===party.host_user_id&&<span className="ml-2 text-accent">HOST</span>}</div>)}</div>
        <div className="mt-4"><h4 className="text-xs font-heading text-primary">FRIENDS</h4>{friends.filter(f=>!(party.members||[]).some(m=>m.user_id===f.user_id)).map(f=><button key={f.user_id} onClick={()=>invite(f.user_id)} className="w-full mt-1 p-2 text-left rounded bg-secondary/30 text-xs">+ INVITE {f.username}</button>)}</div>
      </div>
      <div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-primary">QUEUE AS A PARTY</h3><p className="text-xs text-muted-foreground">All party members are kept together. If a mode has fewer slots, extra party members are placed in spectator status.</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={'p-2 rounded border text-xs ' + (mode === id ? 'border-accent bg-accent/10' : 'border-border bg-secondary/30')}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={queue} disabled={!mode} className="mt-4 w-full py-3 rounded bg-primary text-primary-foreground font-heading disabled:opacity-40">QUEUE PARTY{mode ? ' · ' + mode.toUpperCase() : ''}</button>
      </div>
    </div>}
  </div>
}
