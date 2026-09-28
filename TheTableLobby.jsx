import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { MAP_PLATFORMS } from './PlatformFighter.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import RollbackOnlineFight from './RollbackOnlineFight.jsx';
import GameIcon from './GameIcon.jsx';
import { sfx } from './sfx.js';

const STAGES = Object.keys(MAP_PLATFORMS || {}).filter(id => id !== 'custom');
const stageLabel = id => String(id || '').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

export default function TheTableLobby({ onBack, unlockedIds=[], favoriteId='yellow', equippedElements={}, equippedSkins={}, equippedAccessories={}, equippedShikigami={}, settings={}, sfxVolume=70, musicVolume=50 }) {
  const [user,setUser]=useState(null),[tournament,setTournament]=useState(null),[players,setPlayers]=useState([]);
  const [phase,setPhase]=useState('pick'),[char,setChar]=useState(favoriteId||'yellow'),[error,setError]=useState('');
  const [watching,setWatching]=useState(false),[lastResult,setLastResult]=useState(null),[revealing,setRevealing]=useState(false);

  const refresh=async(id)=>{
    if(!id)return;
    const [{data:t},{data:p}]=await Promise.all([
      supabase.from('element6_table_tournaments').select('*').eq('id',id).maybeSingle(),
      supabase.from('element6_table_players').select('*').eq('tournament_id',id).order('slot')
    ]);
    if(!t)return;
    setTournament(t);setPlayers(p||[]);
    if(t.status==='voting')setPhase('voting');
    else if(t.status==='playing'){ if(phase==='voting' && !revealing){ setRevealing(true); setTimeout(()=>setRevealing(false),2200); } setPhase('playing'); }
    else if(t.status==='finished')setPhase('finished');
  };

  useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user||null)).catch(()=>{});},[]);
  useEffect(()=>{
    if(!tournamentId)return;
    refresh(tournamentId);
  },[tournamentId]);

  useEffect(()=>{
    if(!tournament?.id)return;
    refresh(tournament.id);
    const ch=supabase.channel(`the-table:${tournament.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'element6_table_tournaments',filter:`id=eq.${tournament.id}`},()=>refresh(tournament.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'element6_table_players',filter:`tournament_id=eq.${tournament.id}`},()=>refresh(tournament.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'element6_table_rounds',filter:`tournament_id=eq.${tournament.id}`},()=>refresh(tournament.id))
      .subscribe();
    const poll=setInterval(()=>refresh(tournament.id),1200);
    return()=>{clearInterval(poll);supabase.removeChannel(ch)};
  },[tournament?.id]);

  const me=players.find(p=>p.user_id===user?.id);
  const activeRound = useMemo(()=> {
    if(!tournament?.active_match_id)return null;
    return {matchId:tournament.active_match_id,p1:tournament.active_p1,p2:tournament.active_p2,stageId:tournament.stage_id};
  },[tournament]);

  useEffect(()=>{
    if(tournament?.status==='playing' && !tournament.active_match_id){
      supabase.rpc('element6_table_start_next',{p_tournament_id:tournament.id}).catch(()=>{});
    }
  },[tournament?.status,tournament?.active_match_id,tournament?.id]);

  const join=async()=>{
    if(!user){setError('Sign in to enter The Table.');return;}
    const {data,error:e}=await supabase.rpc('element6_join_the_table',{p_char_id:char,p_loadout:{element:equippedElements?.[char]||'basic',equippedSkins,equippedAccessories,equippedShikigami}});
    if(e){setError(e.message);return;}
    setError('');setTournamentId(data.tournament_id);sfx.matchFound();
  };
  const [tournamentId,setTournamentId]=useState(null);
  const vote=async stage=>{
    if(!tournament?.id)return;
    const {error:e}=await supabase.rpc('element6_vote_the_table',{p_tournament_id:tournament.id,p_stage_id:stage});
    if(e)setError(e.message);else setPhase('voting');
  };
  const report=async winner=>{
    if(!tournament?.id||!activeRound)return;
    await supabase.rpc('element6_table_report_result',{p_tournament_id:tournament.id,p_match_id:activeRound.matchId,p_winner:winner}).catch(e=>setError(e.message));
    setLastResult(winner);setWatching(false);
  };
  const leave=async()=>{if(tournament?.id)await supabase.rpc('element6_leave_the_table',{p_tournament_id:tournament.id}).catch(()=>{});setTournament(null);setTournamentId(null);setPlayers([]);setPhase('pick');setLastResult(null)};

  if(phase==='pick')return <div className="w-full max-w-4xl"><div className="flex justify-between mb-4"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded"><GameIcon emoji="←" size={14}/> BACK</button><h2 className="text-2xl font-heading text-accent">THE TABLE</h2><div/></div><p className="text-center text-xs text-muted-foreground mb-4">8 players · one stock · every round is one fight.</p><UniversalCharacterSelect title="THE TABLE · PICK YOUR FIGHTER" startLabel="JOIN THE TABLE" unlockedIds={unlockedIds} favoriteId={favoriteId} playerCount={1} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} equippedElements={equippedElements} onStart={c=>{setChar(c);join(c)}} onBack={onBack}/>{error&&<p className="text-center text-destructive text-xs">{error}</p>}</div>;

  const count=players.length;
  if(phase==='voting')return <div className="w-full max-w-4xl flex flex-col gap-4"><Header onBack={leave}/><div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-accent text-center">STAGE VOTE</h3><p className="text-xs text-muted-foreground text-center mt-1">All 8 players vote. The server randomizes the received votes and visually reveals the selected stage.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">{STAGES.map(id=><button key={id} onClick={()=>vote(id)} className={`p-3 rounded border ${me?.vote_stage===id?'border-accent bg-accent/10':'border-border bg-secondary/30'}`}><div className="font-heading text-xs">{stageLabel(id)}</div><div className="text-[9px] text-muted-foreground">{players.filter(p=>p.vote_stage===id).length} votes</div></button>)}</div><div className="mt-5 flex justify-center gap-2">{players.map(p=><div key={p.user_id} className={`px-2 py-1 rounded text-[9px] ${p.vote_stage?'bg-accent/20':'bg-secondary'}`}>{p.username}</div>)}</div></div></div>;

  if(revealing) return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"><div className="text-center"><p className="text-sm text-muted-foreground font-heading">THE TABLE STAGE SELECTED</p><h2 className="text-6xl font-heading text-accent mt-3 animate-pulse">{stageLabel(tournament?.stage_id)}</h2><p className="text-xs text-muted-foreground mt-3">RANDOMIZED FROM PLAYER VOTES</p></div></div>;

  if(phase==='playing'&&activeRound&&me&&(me.user_id===activeRound.p1||me.user_id===activeRound.p2)){
    const opp=players.find(p=>p.user_id===(me.user_id===activeRound.p1?activeRound.p2:activeRound.p1));
    return <RollbackOnlineFight matchId={activeRound.matchId} playerId={me.user_id} opponentPlayerId={opp?.user_id} role={me.user_id===activeRound.p1?'host':'guest'} mode="unranked" myChar={me.char_id} oppChar={opp?.char_id||'yellow'} myLoadout={me.loadout||{}} oppLoadout={opp?.loadout||{}} stageId={activeRound.stageId} stocks={1} myUsername={me.username} oppUsername={opp?.username||'OPPONENT'} sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings} onRoundFinished={({winnerUserId})=>report(winnerUserId)} onEnd={()=>{}} />;
  }

  if(phase==='finished') {
    const winner=players.find(p=>p.user_id===tournament?.winner_user_id);
    return <div className="w-full max-w-xl text-center bg-card border rounded-2xl p-8"><h2 className="text-4xl font-heading text-accent">THE TABLE COMPLETE</h2><p className="mt-4 text-xl">Victory</p><p className="text-3xl font-heading text-primary mt-2">{winner?.username||'Winner'}</p><button onClick={onBack} className="mt-6 px-6 py-3 rounded bg-primary text-primary-foreground">LEAVE</button></div>;
  }

  const eliminated=me?.status==='eliminated';
  if(eliminated||watching)return <div className="w-full max-w-xl text-center bg-card border-2 border-destructive rounded-2xl p-8"><h2 className="text-4xl font-heading text-destructive">YOU LOST</h2><p className="text-sm text-muted-foreground mt-2">You are eliminated from the tournament.</p>{!watching?<div className="flex gap-2 justify-center mt-6"><button onClick={()=>setWatching(true)} className="px-5 py-3 rounded bg-primary text-primary-foreground">WATCH</button><button onClick={onBack} className="px-5 py-3 rounded bg-secondary">LEAVE</button></div>:<div className="mt-5 rounded-xl bg-secondary/40 p-5"><div className="font-heading text-accent">LIVE — ROUND {tournament?.current_round||1}</div><p className="text-xs mt-2">{players.find(p=>p.user_id===activeRound?.p1)?.username} vs {players.find(p=>p.user_id===activeRound?.p2)?.username}</p><p className="text-[10px] text-muted-foreground mt-3">You are spectating the tournament bracket. The live fight remains synchronized for the two active players.</p><button onClick={()=>setWatching(false)} className="mt-4 px-4 py-2 bg-secondary rounded">BACK TO RESULT</button></div>}</div>;

  return <div className="w-full max-w-4xl"><Header onBack={leave}/><div className="bg-card border rounded-xl p-6 text-center"><h3 className="font-heading text-accent">WAITING FOR 8 PLAYERS</h3><div className="text-5xl font-heading text-primary my-4">{count} / 8</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{players.map(p=><div key={p.user_id} className="p-2 bg-secondary/40 rounded text-xs">{p.username}<div className="text-[9px] text-muted-foreground">{p.char_id}</div></div>)}</div><p className="text-xs text-muted-foreground mt-4">When player 8 joins, stage voting opens automatically.</p></div></div>
}

function Header({onBack}){return <div className="flex justify-between items-center mb-4"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded"><GameIcon emoji="←" size={14}/> LEAVE</button><h2 className="text-2xl font-heading text-accent">THE TABLE</h2><div/></div>}
