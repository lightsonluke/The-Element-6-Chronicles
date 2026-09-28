import React,{useEffect,useRef,useState} from 'react';
import {supabase} from './supabaseClient.js';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import RaceGame from './RaceGame.jsx';
import GameIcon from './GameIcon.jsx';
import {getEquippedAccessories} from './cosmetics.js';
import {sfx} from './sfx.js';

const LIMIT=60;
export default function RaceLobby({onBack,unlockedIds=[],favoriteId='yellow',equippedElements={},equippedAccessories={},equippedSkins={},settings={},sfxVolume=70,musicVolume=50}){
 const [me,setMe]=useState(null),[phase,setPhase]=useState('pick'),[matchId,setMatchId]=useState(null),[match,setMatch]=useState(null),[players,setPlayers]=useState([]),[countdown,setCountdown]=useState(60),[error,setError]=useState('');
 const validFavorite=(unlockedIds||[]).includes(favoriteId)?favoriteId:((unlockedIds||[])[0]||'yellow');
 const timer=useRef(null); const role=useRef('guest');
 useEffect(()=>{let active=true;(async()=>{try{const {data}=await supabase.auth.getUser();if(active)setMe(data.user||null)}catch(e){if(active)setError(e?.message||'Could not load your online session.')}})();return()=>{active=false}},[]);
 useEffect(()=>{
  if(!matchId)return;
  const refresh=async()=>{const [{data:m},{data:p}]=await Promise.all([supabase.from('element6_race_matches').select('*').eq('id',matchId).maybeSingle(),supabase.from('element6_race_players').select('*').eq('match_id',matchId).order('player_slot')]);if(!m)return;setMatch(m);setPlayers(p||[]);if(m.status==='playing')setPhase('fight')};
  refresh();
  const ch=supabase.channel(`race:${matchId}`).on('postgres_changes',{event:'*',schema:'public',table:'element6_race_matches',filter:`id=eq.${matchId}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'element6_race_players',filter:`match_id=eq.${matchId}`},refresh).subscribe();
  const poll=setInterval(refresh,1200);return()=>{clearInterval(poll);supabase.removeChannel(ch)}
 },[matchId]);
 useEffect(()=>{
  if(phase!=='queue'||!matchId||role.current!=='host')return;
  const deadline=Date.now()+60000; setCountdown(60);
  timer.current=setInterval(async()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));setCountdown(left);const real=players.length;if(real>=30||left<=0){clearInterval(timer.current);await start()}},250);
  return()=>clearInterval(timer.current)
 },[phase,matchId,players.length]);
 const join=async c=>{
  setError('');
  try{
   let user=me;
   if(!user){const {data}=await supabase.auth.getUser();user=data?.user||null;if(user)setMe(user);}
   if(!user){setError('Sign in to play Race.');return}
   const char=c||validFavorite;
   const loadout={character_id:char,element:equippedElements?.[char]||'basic',accessories:getEquippedAccessories(equippedAccessories,char),skins:equippedSkins,username:user.user_metadata?.username||user.user_metadata?.full_name||user.email?.split('@')[0]||'Player'};
   const {data,error}=await supabase.rpc('find_or_create_element6_race',{p_loadout:loadout});
   if(error)throw error;
   if(!data?.match_id)throw new Error('Race matchmaking returned no match. Make sure the Race SQL migration has been run.');
   setMatchId(data.match_id);role.current=data.role||'guest';setCountdown(60);setPhase('queue');
  }catch(e){setError(e?.message||'Could not join Race.');setPhase('pick');}
 };
 const start=async()=>{if(role.current!=='host'||!matchId)return;const {data,e}=await supabase.rpc('start_element6_race',{p_match_id:matchId});if(e)setError(e.message);else setMatch(data)};
 const leave=async()=>{if(matchId)await supabase.rpc('leave_element6_race',{p_match_id:matchId}).catch(()=>{});setMatchId(null);setMatch(null);setPlayers([]);setPhase('pick')};
 if(phase==='pick')return <div className="w-full max-w-4xl"><div className="flex justify-between mb-4"><button onClick={onBack} className="px-4 py-2 bg-secondary rounded"><GameIcon emoji="←" size={14}/> BACK</button><h2 className="text-2xl font-heading text-accent">RACE</h2><div/></div><p className="text-center text-xs text-muted-foreground mb-4">30 players · infinite parkour · moving wall · 50% knockback · constant damage.</p><UniversalCharacterSelect title="RACE · PICK YOUR FIGHTER" startLabel="JOIN RACE" unlockedIds={unlockedIds} favoriteId={validFavorite} playerCount={1} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} equippedElements={equippedElements} onStart={join} onBack={onBack}/>{error&&<p className="text-center text-destructive text-xs">{error}</p>}</div>;
 if(phase==='queue'){const bots=Math.max(0,30-players.length);return <div className="w-full max-w-xl text-center"><div className="flex justify-between mb-4"><button onClick={leave} className="px-4 py-2 bg-secondary rounded">← CANCEL</button><h2 className="text-2xl font-heading text-accent">RACE MATCHMAKING</h2><div/></div><div className="bg-card border rounded-2xl p-7"><div className="text-6xl font-heading text-primary">{players.length} / 30</div><p className="mt-2 text-sm">{countdown}s remaining</p><p className="text-xs text-muted-foreground mt-2">Exact Battle Royale-style fill. If the queue is not full after 60 seconds, bots fill the remaining slots.</p>{role.current==='host'&&<button onClick={start} className="mt-5 px-6 py-3 rounded bg-accent text-accent-foreground font-heading">START NOW · FILL {bots} BOTS</button>}<div className="grid grid-cols-3 gap-2 mt-5">{players.map(p=><div key={p.user_id} className="p-2 bg-secondary/40 rounded text-[10px]">{p.loadout?.username||'Player'}</div>)}</div></div></div>}
 if(phase==='fight')return <RaceGame matchId={matchId} me={me} players={players} seed={match?.random_seed||matchId} settings={settings} sfxVolume={sfxVolume} musicVolume={musicVolume} onEnd={()=>{setPhase('pick');setMatchId(null);onBack?.()}}/>;
}
