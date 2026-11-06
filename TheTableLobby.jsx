import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { MAP_PLATFORMS } from './PlatformFighter.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import RollbackOnlineFight from './RollbackOnlineFight.jsx';
import CustomRoomGame from './CustomRoomGame.jsx';
import GameIcon from './GameIcon.jsx';
import { sfx } from './sfx.js';
import { getTitleById } from './profileTitles.js';

const STAGES = Object.keys(MAP_PLATFORMS || {}).filter(id => id !== 'custom');
const stageLabel = id => String(id || '').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

export default function TheTableLobby({ onBack, unlockedIds=[], favoriteId='yellow', equippedElements={}, equippedSkins={}, equippedAccessories={}, equippedShikigami={}, equippedMovementTrails={}, settings={}, sfxVolume=70, musicVolume=50 }) {
  const [user,setUser]=useState(null),[tournament,setTournament]=useState(null),[players,setPlayers]=useState([]);
  const [phase,setPhase]=useState('pick'),[char,setChar]=useState(favoriteId||'yellow'),[error,setError]=useState('');
  const [selectedStage,setSelectedStage]=useState('splitcity');
  const [tournamentId,setTournamentId]=useState(null);
  const [watching,setWatching]=useState(false),[lastResult,setLastResult]=useState(null),[revealing,setRevealing]=useState(false);
  const refreshInFlight=useRef(null),refreshPending=useRef(null),refreshToken=useRef(0),mounted=useRef(true);
  const previousStatus=useRef(null),revealingRef=useRef(false),revealTimer=useRef(null);

  const refresh=async(id)=>{
    if(!id)return;
    if(refreshInFlight.current){refreshPending.current=id;if(refreshInFlight.current!==id)refreshToken.current++;return;}
    refreshInFlight.current=id;
    const request=++refreshToken.current;
    try{
      const [tResult,pResult]=await Promise.all([
        supabase.from('element6_table_tournaments').select('*').eq('id',id).maybeSingle(),
        supabase.from('element6_table_players').select('*').eq('tournament_id',id).order('slot')
      ]);
      if(!mounted.current||request!==refreshToken.current)return;
      if(tResult.error)throw tResult.error;
      if(pResult.error)throw pResult.error;
      const t=tResult.data,p=pResult.data;
      if(!t){setError('The Table tournament could not be loaded.');return;}
      setError('');
      setTournament(t);setPlayers(p||[]);
      const priorStatus=previousStatus.current;
      previousStatus.current=t.status;
      if(t.status==='queue')setPhase('waiting');
      else if(t.status==='voting')setPhase('voting');
      else if(t.status==='playing'){
        if(priorStatus==='voting'&&!revealingRef.current){
          revealingRef.current=true;
          setRevealing(true);
          clearTimeout(revealTimer.current);
          revealTimer.current=setTimeout(()=>{revealingRef.current=false;if(mounted.current)setRevealing(false);},2200);
        }
        setPhase('playing');
      }
      else if(t.status==='finished')setPhase('finished');
      else if(t.status==='cancelled')setPhase('pick');
    }catch(e){if(mounted.current&&request===refreshToken.current)setError(e?.message||'The Table roster could not be refreshed.');}
    finally{
      if(refreshInFlight.current===id)refreshInFlight.current=null;
      const next=refreshPending.current;refreshPending.current=null;
      if(next&&mounted.current)queueMicrotask(()=>refresh(next));
    }
  };

  useEffect(()=>{
    mounted.current=true;
    let cancelled=false;
    (async()=>{
      const {data:{user:u}}=await supabase.auth.getUser();
      if(cancelled)return;
      setUser(u||null);
      if(!u)return;
      const {data,error}=await supabase.rpc('element6_get_my_table');
      if(cancelled)return;
      if(error){ setError(error.message); return; }
      if(data?.tournament_id){
        setTournamentId(data.tournament_id);
        if(data.status==='queue')setPhase('waiting');
        else if(data.status==='voting')setPhase('voting');
        else if(data.status==='playing')setPhase('playing');
        else if(data.status==='finished')setPhase('finished');
      }
    })().catch(e=>{if(!cancelled)setError(e?.message||'Could not load The Table.');});
    return()=>{cancelled=true;mounted.current=false;refreshToken.current++;clearTimeout(revealTimer.current);revealTimer.current=null;revealingRef.current=false;previousStatus.current=null;};
  },[]);
  useEffect(()=>{
    if(!tournamentId)return;
    refresh(tournamentId);
    const heartbeat=setInterval(()=>{
      supabase.rpc('element6_heartbeat_the_table',{p_tournament_id:tournamentId}).catch(()=>{});
    },5000);
    return()=>clearInterval(heartbeat);
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

  const join=async(selectedChar=char)=>{
    if(!user){setError('Sign in to enter The Table.');return;}
    setError('JOINING THE TABLE…');
    const {data,error:e}=await supabase.rpc('element6_join_the_table',{p_char_id:selectedChar,p_loadout:{element:equippedElements?.[selectedChar]||'basic',equippedSkins,equippedAccessories,equippedShikigami,equippedMovementTrails}});
    if(e){setError(e.message);return;}
    if(!data?.tournament_id){setError('The Table did not return a tournament.');return;}
    setError('');setTournamentId(data.tournament_id);sfx.matchFound();
  };
  const startMatch=async()=>{
    if(!tournament?.id)return;
    setError('PREPARING THE TABLE…');
    const {data,error:e}=await supabase.rpc('element6_table_start_match',{
      p_tournament_id:tournament.id,p_stage_id:selectedStage,
    });
    if(e){setError(e.message);return;}
    if(!data?.match_id){setError('The server did not create a match.');return;}
    setError('');
    await refresh(tournament.id);
  };
  const rematch=async()=>{
    if(!tournament?.id||!isHost)return;
    setError('PREPARING REMATCH…');
    const {data,error:e}=await supabase.rpc('element6_table_requeue_match',{p_tournament_id:tournament.id});
    if(e){setError(e.message);return;}
    setError('');setTournament(data);setPhase('waiting');
    await refresh(tournament.id);
  };
  const vote=async stage=>{
    if(!tournament?.id)return;
    const {error:e}=await supabase.rpc('element6_vote_the_table',{p_tournament_id:tournament.id,p_stage_id:stage});
    if(e)setError(e.message);else setPhase('voting');
  };
  const updateMatchSetting=async(key,value)=>{
    if(!tournament?.id||!isHost)return;
    setError('SAVING MATCH SETTINGS…');
    const {data,error:e}=await supabase.rpc('element6_table_update_match_settings',{
      p_tournament_id:tournament.id,p_settings:{[key]:Number(value)},
    });
    if(e){setError(e.message);return;}
    setTournament(current=>current?{...current,match_settings:data?.settings||{...(current.match_settings||{}),[key]:Number(value)}}:current);
    setError('');
  };
  const report=async winner=>{
    if(!tournament?.id||!activeRound)return;
    const { error: reportError } = await supabase.rpc('element6_table_report_result',{
      p_tournament_id:tournament.id,p_match_id:activeRound.matchId,p_winner:winner,
    });
    if(reportError){setError(reportError.message||'The match result could not be submitted.');return;}
    const { data: confirmedRound, error: readError } = await supabase.from('element6_table_rounds')
      .select('status,winner').eq('tournament_id',tournament.id).eq('match_id',activeRound.matchId).maybeSingle();
    if(readError||confirmedRound?.status!=='finished'||!confirmedRound?.winner){
      setError(readError?.message||'The server has not confirmed a completed result yet.');
      return;
    }
    setLastResult(confirmedRound.winner);setWatching(false);setError('');
  };
  const leave=async()=>{
    if(tournament?.id){
      const {error:e}=await supabase.rpc('element6_leave_the_table',{p_tournament_id:tournament.id});
      if(e){setError(e.message);return;}
    }
    setTournament(null);setTournamentId(null);setPlayers([]);setPhase('pick');setLastResult(null);setError('');
  };

  if(phase==='pick')return <div className="w-full max-w-4xl"><div className="flex justify-between mb-4"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded"><GameIcon icon="info" size={14}/> BACK</button><h2 className="text-2xl font-heading text-accent">THE TABLE</h2><div/></div><p className="text-center text-xs text-muted-foreground mb-4">2–8 humans can join. Empty slots become Honored Bots when the host starts.</p><UniversalCharacterSelect title="THE TABLE · PICK YOUR FIGHTER" startLabel="JOIN THE TABLE" unlockedIds={unlockedIds} favoriteId={favoriteId} playerCount={1} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} equippedElements={equippedElements} onStart={c=>{setChar(c);join(c)}} onBack={onBack}/>{error&&<p role="alert" className="text-center text-destructive text-xs">{error}</p>}</div>;

  const count=players.length;
  const connectedCount=players.filter(p=>!p.last_seen_at||Date.now()-Date.parse(p.last_seen_at)<20000).length;
  const isHost=me?.user_id===tournament?.host_user_id;
  if(phase==='waiting')return <div className="w-full max-w-4xl"><Header onBack={leave}/><div className="bg-card border rounded-xl p-6"><div className="text-center"><h3 className="font-heading text-accent">TABLE LOBBY</h3><div className="text-5xl font-heading text-primary my-3">{connectedCount} / 8</div><p className="text-xs text-muted-foreground">{connectedCount} connected human{connectedCount===1?'':'s'} · start requires two</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">{players.map(p=>{const title=getTitleById(p.title)?.name||p.title;return <div key={p.user_id} className={`p-3 rounded-xl border ${p.user_id===tournament?.host_user_id?'border-accent bg-accent/10':'border-border bg-secondary/30'}`}><div className="font-heading text-xs truncate">{p.username}{p.user_id===tournament?.host_user_id?' · HOST':''}{p.user_id===user?.id?' · YOU':''}</div>{title&&<div className="mt-1 max-w-full truncate text-[9px] text-primary" title={title}>{title}</div>}<div className="text-[9px] text-muted-foreground mt-1">{p.char_id} · {Date.now()-Date.parse(p.last_seen_at||new Date().toISOString())<20000?'Connected':'Reconnecting'}</div></div>})}</div><div className="mt-5"><p className="text-[10px] font-heading text-muted-foreground mb-2">SELECT STAGE · HOST STARTS THE MATCH</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">{STAGES.map(id=><button key={id} onClick={()=>setSelectedStage(id)} disabled={!isHost} aria-pressed={selectedStage===id} className={`p-2 rounded-lg border text-xs disabled:cursor-not-allowed ${selectedStage===id?'border-accent bg-accent/15 text-accent':'border-border bg-secondary/30'}`}>{stageLabel(id)}</button>)}</div></div><div className="mt-5 rounded-xl border border-primary/40 bg-secondary/20 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="text-xs font-heading text-primary">MATCH SETTINGS</h4>{!isHost&&<span className="text-[9px] text-muted-foreground">HOST CONTROLLED</span>}</div><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><label className="flex flex-col gap-1 text-[10px] font-heading text-muted-foreground">STOCKS PER FIGHTER<select disabled={!isHost} value={tournament.match_settings?.stocks??1} onChange={e=>updateMatchSetting('stocks',e.target.value)} className="min-h-10 rounded-lg bg-secondary px-2 text-foreground disabled:opacity-70">{[1,2,3,4,5,7,9].map(n=><option key={n} value={n}>{n} stocks</option>)}</select></label><label className="flex flex-col gap-1 text-[10px] font-heading text-muted-foreground">MATCH TIME<select disabled={!isHost} value={tournament.match_settings?.matchTime??180} onChange={e=>updateMatchSetting('matchTime',e.target.value)} className="min-h-10 rounded-lg bg-secondary px-2 text-foreground disabled:opacity-70">{[[60,'1 minute'],[120,'2 minutes'],[180,'3 minutes'],[240,'4 minutes'],[300,'5 minutes'],[480,'8 minutes'],[600,'10 minutes']].map(([n,label])=><option key={n} value={n}>{label}</option>)}</select></label><label className="flex flex-col gap-1 text-[10px] font-heading text-muted-foreground">STARTING DAMAGE<select disabled={!isHost} value={tournament.match_settings?.startingDamage??0} onChange={e=>updateMatchSetting('startingDamage',e.target.value)} className="min-h-10 rounded-lg bg-secondary px-2 text-foreground disabled:opacity-70">{[0,50,100,150,200,250].map(n=><option key={n} value={n}>{n}%</option>)}</select></label></div></div><div className="flex justify-center mt-5"><button onClick={startMatch} disabled={!isHost||connectedCount<2} className="px-7 py-3 rounded-xl bg-primary text-primary-foreground font-heading disabled:opacity-40">{isHost?'START MATCH · FILL WITH HONORED BOTS':'WAITING FOR HOST'}</button></div><p className="text-center text-[10px] text-muted-foreground mt-2">2–8 connected humans can join. The server checks the roster and fills remaining slots with Honored Bots.</p>{error&&<p role="alert" className="text-center text-xs text-destructive mt-3">{error}</p>}</div></div>;
  if(phase==='voting')return <div className="w-full max-w-4xl flex flex-col gap-4"><Header onBack={leave}/><div className="bg-card border rounded-xl p-5"><h3 className="font-heading text-accent text-center">STAGE VOTE</h3><p className="text-xs text-muted-foreground text-center mt-1">All 8 players vote. The server randomizes the received votes and visually reveals the selected stage.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">{STAGES.map(id=><button key={id} onClick={()=>vote(id)} className={`p-3 rounded border ${me?.vote_stage===id?'border-accent bg-accent/10':'border-border bg-secondary/30'}`}><div className="font-heading text-xs">{stageLabel(id)}</div><div className="text-[9px] text-muted-foreground">{players.filter(p=>p.vote_stage===id).length} votes</div></button>)}</div><div className="mt-5 flex justify-center gap-2">{players.map(p=><div key={p.user_id} className={`px-2 py-1 rounded text-[9px] ${p.vote_stage?'bg-accent/20':'bg-secondary'}`}>{p.username}</div>)}</div></div></div>;

  if(revealing) return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"><div className="text-center"><p className="text-sm text-muted-foreground font-heading">THE TABLE STAGE SELECTED</p><h2 className="text-6xl font-heading text-accent mt-3 animate-pulse">{stageLabel(tournament?.stage_id)}</h2><p className="text-xs text-muted-foreground mt-3">RANDOMIZED FROM PLAYER VOTES</p></div></div>;

  if(phase==='playing'&&tournament?.active_match_id&&me&&!tournament.active_p1&&!tournament.active_p2){
    const tableMatchPlayers=[
      ...players.map(p=>({...p,char:p.char_id,name:p.username,is_bot:false,loadout:p.loadout||{}})),
      ...(Array.isArray(tournament.bot_slots)?tournament.bot_slots:[]),
    ].sort((a,b)=>(a.slot||0)-(b.slot||0));
    const matchRoom={
      id:tournament.active_match_id,status:'playing',players:tableMatchPlayers,
      stage_id:tournament.stage_id||'splitcity',
      stage_platforms:MAP_PLATFORMS[tournament.stage_id||'splitcity']||MAP_PLATFORMS.splitcity,
      settings:{stocks:tournament.match_settings?.stocks??1,matchTime:tournament.match_settings?.matchTime??180,startingDamage:tournament.match_settings?.startingDamage??0,maxPlayers:8},
    };
    const onTableMatchEnd=async result=>{
      let winnerUserId=null;
      let winnerName='Draw';
      let winnerIsBot=false;
      if(isHost){
        const winner=tableMatchPlayers.find(p=>p.name===result?.winner||p.username===result?.winner);
        winnerIsBot=!!winner?.is_bot;
        winnerName=result?.disconnected?'Disconnected':(winner?.name||'Draw');
        winnerUserId=winnerIsBot||result?.disconnected?null:(winner?.user_id||null);
        const {data,error:e}=await supabase.rpc('element6_table_complete_match',{
          p_tournament_id:tournament.id,p_match_id:tournament.active_match_id,
          p_winner_user_id:winnerUserId,p_winner_name:winnerName,p_winner_is_bot:winnerIsBot,
        });
        if(e){setError(e.message);return;}
        setTournament(current=>current?{...current,...(data||{}),status:'finished',winner_user_id:winnerUserId,winner_name:winnerName,winner_is_bot:winnerIsBot}:current);
        setPhase('finished');
      }else if(result?.disconnected){
        await supabase.rpc('element6_leave_the_table',{p_tournament_id:tournament.id}).catch(()=>{});
        setTournamentId(null);setTournament(null);setPlayers([]);setPhase('pick');return;
      }else{
        await refresh(tournament.id);
      }
    };
    return <CustomRoomGame room={matchRoom} isHost={isHost} myUserId={user?.id}
      myElement={equippedElements?.[me.char_id]||'basic'} sfxVolume={sfxVolume} musicVolume={musicVolume}
      settings={settings} onEnd={onTableMatchEnd}/>;
  }

  if(phase==='playing'&&activeRound&&me&&(me.user_id===activeRound.p1||me.user_id===activeRound.p2)){
    const opp=players.find(p=>p.user_id===(me.user_id===activeRound.p1?activeRound.p2:activeRound.p1));
    return <RollbackOnlineFight matchId={activeRound.matchId} playerId={me.user_id} opponentPlayerId={opp?.user_id} role={me.user_id===activeRound.p1?'host':'guest'} mode="unranked" myChar={me.char_id} oppChar={opp?.char_id||'yellow'} myLoadout={me.loadout||{}} oppLoadout={opp?.loadout||{}} stageId={activeRound.stageId} stocks={1} myUsername={me.username} oppUsername={opp?.username||'OPPONENT'} sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings} onRoundFinished={({winnerUserId})=>report(winnerUserId)} onEnd={()=>{}} />;
  }

  if(phase==='finished') {
    const winner=players.find(p=>p.user_id===tournament?.winner_user_id);
    return <div className="w-full max-w-xl text-center bg-card border rounded-2xl p-8"><h2 className="text-4xl font-heading text-accent">THE TABLE COMPLETE</h2><p className="mt-4 text-xl">Match Complete</p><p className="text-3xl font-heading text-primary mt-2">{winner?.username||tournament?.winner_name||'Draw'}</p>{tournament?.winner_is_bot&&<p className="mt-1 text-xs text-muted-foreground">HONORED BOT</p>}<div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={rematch} disabled={!isHost} className="px-6 py-3 rounded-full bg-primary text-primary-foreground disabled:opacity-50">{isHost?'PLAY AGAIN':'WAIT FOR HOST'}</button><button onClick={leave} className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground">LEAVE TABLE</button></div>{error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}</div>;
  }

  const eliminated=me?.status==='eliminated';
  if(eliminated||watching)return <div className="w-full max-w-xl text-center bg-card border-2 border-destructive rounded-2xl p-8"><h2 className="text-4xl font-heading text-destructive">YOU LOST</h2><p className="text-sm text-muted-foreground mt-2">You are eliminated from the tournament.</p>{!watching?<div className="flex gap-2 justify-center mt-6"><button onClick={()=>setWatching(true)} className="px-5 py-3 rounded bg-primary text-primary-foreground">WATCH</button><button onClick={onBack} className="px-5 py-3 rounded bg-secondary">LEAVE</button></div>:<div className="mt-5 rounded-xl bg-secondary/40 p-5"><div className="font-heading text-accent">LIVE — ROUND {tournament?.current_round||1}</div><p className="text-xs mt-2">{players.find(p=>p.user_id===activeRound?.p1)?.username} vs {players.find(p=>p.user_id===activeRound?.p2)?.username}</p><p className="text-[10px] text-muted-foreground mt-3">You are spectating the tournament bracket. The live fight remains synchronized for the two active players.</p><button onClick={()=>setWatching(false)} className="mt-4 px-4 py-2 bg-secondary rounded">BACK TO RESULT</button></div>}</div>;

  return <div className="w-full max-w-4xl"><Header onBack={leave}/><div className="bg-card border rounded-xl p-6 text-center"><h3 className="font-heading text-accent">WAITING FOR 8 PLAYERS</h3><div className="text-5xl font-heading text-primary my-4">{count} / 8</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{players.map(p=><div key={p.user_id} className="p-2 bg-secondary/40 rounded text-xs">{p.username}<div className="text-[9px] text-muted-foreground">{p.char_id}</div></div>)}</div><p className="text-xs text-muted-foreground mt-4">When player 8 joins, stage voting opens automatically.</p>{error&&<p role="alert" className="text-xs text-destructive mt-3">{error}</p>}</div></div>
}

function Header({onBack}){return <div className="flex justify-between items-center mb-4"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded"><GameIcon icon="info" size={14}/> LEAVE</button><h2 className="text-2xl font-heading text-accent">THE TABLE</h2><div/></div>}
