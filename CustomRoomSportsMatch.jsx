import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import SoccerFighter from './SoccerFighter.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import DodgeballGame from './DodgeballGame.jsx';
import BangerGame from './BangerGame.jsx';

const NO_INPUT = { left:false, right:false, up:false, down:false, jump:false, sig:false, power:false, superMove:false, heavy:false };
const sportFor = mode => ({ soccer:'soccer', volleyball:'volleyball', dodgeball:'dodgeball', banger:'banger' }[mode] || null);

/** Shared-room adapter for the game's existing sport simulations. The room host
 * owns simulation and result reporting; guests send inputs and render host
 * checkpoints through each sport engine's existing network hooks. */
export default function CustomRoomSportsMatch({ room, me, mode, settings={}, sfxVolume=70, musicVolume=50, equippedSkins={}, equippedAccessories={}, equippedElements={}, customCharsData={}, onEnd }) {
  const [remoteState,setRemoteState]=useState(room?.authoritative_state?.game_state||null);
  const [result,setResult]=useState(null);
  const [status,setStatus]=useState('CONNECTING');
  const [syncing,setSyncing]=useState(false);
  const channelRef=useRef(null), messageRef=useRef(null), exportRef=useRef(null), lastStateAt=useRef(room?.authoritative_state?.game_state?Date.now():0), lastSentAt=useRef(0), hostState=useRef(room?.authoritative_state?.game_state||null);
  const players=useMemo(()=>[...(room?.players||[]).filter(p=>!p.is_bot)].sort((a,b)=>Number(a.slot)-Number(b.slot)),[room?.players]);
  const participantKey=players.map(p=>String(p.user_id)).join('|');
  const participantIds=useMemo(()=>new Set(participantKey ? participantKey.split('|') : []),[participantKey]);
  const sport=sportFor(mode), hostId=room?.host_user_id, hostEpoch=Number(room?.host_epoch||0), isHost=String(me?.id||'')===String(hostId||'');
  const myPlayer=players.find(p=>String(p.user_id)===String(me?.id));
  const localSlot=Number(myPlayer?.slot ?? 0);
  const teams=useMemo(()=>players.map((p,i)=>({ ...p, team: (mode==='volleyball'&&players.length===4) ? (i%2===0?1:2) : (mode==='banger' ? (i%2===0?1:2) : (i===0?1:2)) })),[players,mode]);
  const team1=teams.filter(p=>p.team===1), team2=teams.filter(p=>p.team===2);
  const required=mode==='banger'?6:(mode==='volleyball'&&Number(room?.settings?.maxPlayers)===4?4:2);
  const elementFor=p=>p?.loadout?.element||equippedElements?.[p?.char]||'basic';

  useEffect(()=>{
    if(!room?.id||!me?.id)return undefined;
    let active=true;
    const ch=supabase.channel(`element6-custom-sport:${room.id}`,{config:{broadcast:{self:false,ack:true}}});
    channelRef.current=ch;
    ch.on('broadcast',{event:'input'},({payload})=>{
      if(!active||!isHost||!payload||Number(payload.epoch)!==hostEpoch||!participantIds.has(String(payload.sender)))return;
      messageRef.current?.(payload.message);
    }).on('broadcast',{event:'state'},({payload})=>{
      if(!active||isHost||Number(payload?.epoch)!==hostEpoch||String(payload?.sender)!==String(hostId)||!payload?.state)return;
      const frame=Number(payload.state.frame||0);
      if(frame<Number(hostState.current?.frame||-1))return;
      hostState.current=payload.state;setRemoteState(payload.state);lastStateAt.current=Date.now();setSyncing(false);
    }).on('broadcast',{event:'result'},({payload})=>{if(active&&Number(payload?.epoch)===hostEpoch&&String(payload?.sender)===String(hostId)&&payload?.winnerTeam)setResult(payload);})
      .subscribe(s=>{if(active)setStatus(s==='SUBSCRIBED'?'CONNECTED':String(s));});
    return()=>{active=false;channelRef.current=null;supabase.removeChannel(ch);};
  },[room?.id,me?.id,isHost,hostId,hostEpoch,participantIds]);

  useEffect(()=>{
    if(isHost||!room?.id)return undefined;
    const timer=setInterval(()=>{
      if(Date.now()-lastStateAt.current>1200)setSyncing(true);
    },300);
    return()=>clearInterval(timer);
  },[isHost,room?.id]);

  const lanConnection=useMemo(()=>({
    onMessage(cb){messageRef.current=cb;return()=>{if(messageRef.current===cb)messageRef.current=null;};},
    sendMessage(message){
      if(!channelRef.current||!me?.id)return;
      if(message?.type==='state'){
        if(!isHost)return;
        exportRef.current?.(message.state);
        return;
      }
      channelRef.current.send({type:'broadcast',event:'input',payload:{sender:me.id,slot:localSlot,epoch:hostEpoch,message:{...message,playerSlot:localSlot}}});
    },
    get stalled(){return syncing;},
    stalledRef:{get current(){return syncing;}},
  }),[me?.id,isHost,localSlot,syncing,hostEpoch]);

  const exportState=state=>{
    if(!isHost||!channelRef.current||performance.now()-lastSentAt.current<50)return;
    lastSentAt.current=performance.now();lastStateAt.current=Date.now();hostState.current=state;
    channelRef.current.send({type:'broadcast',event:'state',payload:{sender:me.id,epoch:hostEpoch,state}});
    // Persist an occasional checkpoint so a reconnect can recover the latest
    // renderer state without trusting a client-supplied room snapshot.
    if(Number(state?.frame||0)%180===0) supabase.rpc('element6_custom_room_checkpoint',{p_room_id:room.id,p_state:state}).catch(()=>{});
  };
  exportRef.current=exportState;

  const finish=winnerTeam=>{
    if(!isHost||!winnerTeam||result)return;
    const next={winnerTeam,frame:Number(hostState.current?.frame||0)};
    setResult(next);channelRef.current?.send({type:'broadcast',event:'result',payload:{sender:me.id,epoch:hostEpoch,...next}});
  };
  const continueRoom=()=>onEnd?.({winner:result?.winnerTeam===1?'TEAM 1':result?.winnerTeam===2?'TEAM 2':'draw',draw:!result?.winnerTeam});

  if(!sport)return <div role="alert" className="p-6 text-center">This Custom Room sport is unavailable.</div>;
  if(players.length!==required||!myPlayer)return <div role="status" className="el6-match-viewport grid place-items-center text-center"><p className="font-heading text-accent">WAITING FOR PLAYERS · {players.length}/{required}</p><p className="text-sm text-muted-foreground">This mode starts when every required human slot is filled.</p></div>;
  if(result)return <div className="el6-match-viewport grid place-items-center text-center"><div><h2 className="text-4xl font-heading text-accent">TEAM {result.winnerTeam} WINS</h2><button onClick={continueRoom} className="mt-5 min-h-11 rounded-full bg-primary px-6 font-heading text-primary-foreground">RETURN TO ROOM</button></div></div>;

  const common={settings,sfxVolume,musicVolume,equippedSkins,equippedAccessories,customCharsData,lanConnection,lanRole:isHost?'host':'guest',localScheme:isHost?'p1':'p2',remoteState:isHost?null:remoteState,onStateExport:isHost?exportState:undefined,isOnlineHost:isHost};
  const char=p=>p?.char||'yellow';
  return <div className="el6-match-viewport relative w-full">
    <div className="absolute right-3 top-3 z-20 rounded-full bg-black/55 px-3 py-1 text-[10px] font-heading text-white">{sport.toUpperCase()} · {isHost?'HOST':'GUEST'} · {status}</div>
    {sport==='soccer'&&<SoccerFighter {...common} p1Char={char(team1[0])} p2Char={char(team2[0])} p1Element={elementFor(team1[0])} p2Element={elementFor(team2[0])} p1IsCPU={false} p2IsCPU={false} cpuDifficulty="regular" round={1} totalRounds={1} onEnd={r=>{if(isHost&&r?.p1Won!=null)finish(r.p1Won?1:2);}} onQuit={continueRoom}/>}
    {sport==='volleyball'&&<VolleyballGame {...common} p1Chars={team1.map(char)} p2Chars={team2.map(char)} p1Elements={team1.map(elementFor)} p2Elements={team2.map(elementFor)} p1IsCPU={false} p2IsCPU={false} difficulty="regular" online2v2={players.length===4} localPlayerSlot={localSlot} onResult={r=>{if(isHost&&r?.p1Won!=null)finish(r.p1Won?1:2);}} onQuit={continueRoom}/>}
    {sport==='dodgeball'&&<DodgeballGame {...common} p1Chars={[char(team1[0])]} p2Chars={[char(team2[0])]} p1Elements={[elementFor(team1[0])]} p2Elements={[elementFor(team2[0])]} p1IsCPU={false} p2IsCPU={false} difficulty="regular" localPlayerSlot={localSlot} onResult={r=>{if(isHost&&r?.p1Won!=null)finish(r.p1Won?1:2);}} onQuit={continueRoom}/>}
    {sport==='banger'&&<BangerGame {...common} p1Chars={team1.map(char)} p2Chars={team2.map(char)} p1Elements={team1.map(elementFor)} p2Elements={team2.map(elementFor)} p1IsCPU={false} p2IsCPU={false} difficulty="regular" localPlayerSlot={localSlot} onResult={r=>{if(isHost&&r?.p1Won!=null)finish(r.p1Won?1:2);}} onQuit={continueRoom}/>}
    {syncing&&<div className="absolute inset-0 z-30 grid place-items-center bg-black/70 font-heading text-accent">SYNCING ROOM STATE…</div>}
  </div>;
}
