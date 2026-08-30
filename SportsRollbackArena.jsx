import React, { useEffect, useRef, useState } from 'react';
import { MultiplayerRollbackSession } from './rollback/multiplayerRollbackSession.js';
import { SportsRealtimeTransport } from './rollback/sportsRealtimeTransport.js';
import { createOnlineSportState, stepOnlineSport, WIDTH, HEIGHT } from './rollback/sportsSimulation.js';
import { checksumState } from './rollback/stateChecksum.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { reportOnlineSportResult, leaveOnlineSport } from './sportsOnline.js';
import { supabase } from './supabaseClient.js';
import ActualSportsOnlineMatch from './ActualSportsOnlineMatch.jsx';

const FRAME_MS = 1000 / 60;
const EMPTY = { left:false, right:false, up:false, down:false, jump:false, sig:false, heavy:false, power:false };

export default function SportsRollbackArena({ match, players, settings = {}, onEnd }) {
  // 2v2 Volleyball uses the real offline VolleyballGame renderer/physics,
  // not the generic sport-canvas fallback below. It remains host-authoritative
  // and uses the rollback transport for its input/checkpoint channel.
  if (match?.mode === 'volleyball_2v2_online') {
    return <ActualSportsOnlineMatch match={match} players={players} settings={settings} onEnd={onEnd} />;
  }
  const canvasRef = useRef(null); const sessionRef = useRef(null); const transportRef = useRef(null); const pausedForSync = useRef(false);
  const [status, setStatus] = useState('CONNECTING…'); const [result, setResult] = useState(null); const [me, setMe] = useState(null); const [syncing, setSyncing] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user || null)); }, []);
  useEffect(() => {
    if (!match?.id || !me?.id || !players?.length) return undefined;
    let stopped = false; let raf = 0; let heartbeat = null; let lastPeerAt = Date.now(); const keys = {}; const playerIds = players.map(p => p.user_id);
    const draw = state => { const ctx = canvasRef.current?.getContext('2d'); if (!ctx || !state) return; ctx.fillStyle='#08051e'; ctx.fillRect(0,0,WIDTH,HEIGHT); ctx.strokeStyle='#7946ff'; ctx.lineWidth=3; ctx.strokeRect(15,15,WIDTH-30,420); if (state.sport === 'volleyball') { ctx.fillStyle='#eee'; ctx.fillRect(WIDTH/2-3,160,6,275); } ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText(`${state.score[0]}  —  ${state.score[1]}`, WIDTH/2,55); state.players.forEach(p => { ctx.fillStyle=p.team===1?'#3192ff':'#ff4d6d'; ctx.beginPath(); ctx.arc(p.x,p.y,20,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.fillText(p.id===me.id?'YOU':p.char,p.x,p.y-30); }); ctx.fillStyle='#ffd447'; ctx.beginPath(); ctx.arc(state.ball.x,state.ball.y,12,0,Math.PI*2); ctx.fill(); };
    const startResync = async (reason = 'SYNC CHECK') => {
      if (pausedForSync.current || stopped) return;
      pausedForSync.current = true; setSyncing(true); setStatus(`${reason} · RESYNCING…`);
      const session = sessionRef.current; const transport = transportRef.current;
      if (session && transport) {
        // The lowest slot is the checkpoint host. It sends its exact immutable
        // rollback state; every client clears prediction history before resume.
        const hostId = playerIds[0];
        if (me.id === hostId) await transport.sendControl('resync-state', { frame: session.frame, state: session.getState() }).catch(() => {});
        await transport.sendControl('resync-request', { frame: session.frame }).catch(() => {});
      }
      setTimeout(() => { pausedForSync.current = false; setSyncing(false); setStatus('CONNECTED · VERIFIED'); }, 850);
    };
    const boot = async () => { try {
      const transport = new SportsRealtimeTransport({ matchId:match.id, playerId:me.id, playerIds }); transportRef.current = transport; await transport.connect();
      const session = new MultiplayerRollbackSession({ matchId:match.id, playerId:me.id, playerIds, initialState:createOnlineSportState({mode:match.mode,players}), stepFrame:stepOnlineSport, sendInput:p=>transport.sendInput(p), sendChecksum:p=>transport.sendChecksum(p), checksumInterval:15, maxRollbackFrames:30, historySize:300, onDesync:() => startResync('DESYNC DETECTED') }); sessionRef.current = session;
      transport.on('input', p => { lastPeerAt=Date.now(); session.receiveInput(p); }); transport.on('checksum', p => { lastPeerAt=Date.now(); session.receiveChecksum(p); });
      transport.on('control', p => { lastPeerAt=Date.now(); if (p.kind === 'resync-request' && me.id === playerIds[0]) transport.sendControl('resync-state', { frame:session.frame, state:session.getState() }).catch(() => {}); if (p.kind === 'resync-state' && p.state) { pausedForSync.current=true; setSyncing(true); session.replaceState(p.state, p.frame); setTimeout(() => { pausedForSync.current=false; setSyncing(false); setStatus('CONNECTED · VERIFIED'); }, 500); } if (p.kind === 'disconnect') { setResult({ forfeit:true, winnerTeam:players.find(x=>x.user_id===me.id)?.team === 1 ? 2 : 1 }); } });
      setStatus('CONNECTED · VERIFIED'); heartbeat=setInterval(() => { supabase.rpc('online_sport_heartbeat',{p_match_id:match.id}).catch(()=>{}); }, 5000);
      const binds=getKeybinds(settings); let previous=performance.now(), carry=0; const tick=now=>{ if(stopped) return; carry+=Math.min(100,now-previous); previous=now; while(carry>=FRAME_MS){ if (!pausedForSync.current) { const pad=settings.controllerEnabled===false?null:readGamepadInput(0); const k=readPlayerInput(keys,binds.p1); const input=pad?{...k,left:k.left||pad.left,right:k.right||pad.right,up:k.up||pad.up,down:k.down||pad.down,jump:k.jump||pad.jump,sig:k.sig||pad.sig,heavy:k.heavy||pad.heavy,power:k.power||pad.power}:k; const state=session.advance(input); if(state.winnerTeam && !result) setResult({winnerTeam:state.winnerTeam,frame:session.frame,checksum:checksumState(state)}); } carry-=FRAME_MS; } if(Date.now()-lastPeerAt>12000) startResync('CONNECTION CHECK'); draw(session.getState()); raf=requestAnimationFrame(tick);}; raf=requestAnimationFrame(tick);
    } catch(e){ setStatus(e.message || 'Could not connect.'); } };
    const down=e=>{ keys[e.key]=true; keys[e.key.toLowerCase()]=true; if (!['F5','F12'].includes(e.key)) e.preventDefault(); }; const up=e=>{ keys[e.key]=false; keys[e.key.toLowerCase()]=false; }; window.addEventListener('keydown',down); window.addEventListener('keyup',up); boot();
    return()=>{ stopped=true; cancelAnimationFrame(raf); clearInterval(heartbeat); window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); transportRef.current?.sendControl('disconnect').catch(()=>{}); transportRef.current?.close(); };
  },[match?.id, match?.mode, players, me?.id, settings, result]);
  const finish = async () => { const mine=players.find(p=>p.user_id===me?.id); try { if(result?.forfeit) await leaveOnlineSport(match.id); else await reportOnlineSportResult({matchId:match.id,winnerTeam:result.winnerTeam,finalFrame:result.frame,checksum:result.checksum}); } catch {} onEnd?.({won:mine?.team===result?.winnerTeam,sport:match.mode.split('_')[0],characterId:mine?.character_id,forfeited:!!result?.forfeit}); };
  const quit = async () => { try { await leaveOnlineSport(match?.id); } catch {} onEnd?.({won:false,sport:match?.mode?.split('_')[0],forfeited:true}); };
  if(result) return <div className="el6-match-viewport text-center space-y-5"><h2 className="text-4xl font-heading text-accent">{result.forfeit ? 'OPPONENT LEFT · YOU WIN!' : `TEAM ${result.winnerTeam} WINS!`}</h2><button onClick={finish} className="px-6 py-3 bg-primary rounded font-heading">CONTINUE</button></div>;
  return <div className="el6-match-viewport w-full max-w-5xl text-center"><div className="flex justify-between mb-2"><button onClick={quit} className="px-3 py-1 bg-secondary rounded text-xs">FORFEIT</button><p className="font-heading text-accent">{status}</p></div><div className="relative"><canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full border-2 border-primary rounded-lg" />{syncing && <div className="absolute inset-0 grid place-items-center bg-black/70 font-heading text-accent text-xl">SYNCING MATCH…</div>}</div><p className="text-xs text-muted-foreground mt-2">Automatic checksum checks keep every player on the same confirmed frame.</p></div>;
}
