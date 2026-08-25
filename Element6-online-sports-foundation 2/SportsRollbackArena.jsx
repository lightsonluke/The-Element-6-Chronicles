import React, { useEffect, useRef, useState } from 'react';
import { MultiplayerRollbackSession } from './rollback/multiplayerRollbackSession.js';
import { SportsRealtimeTransport } from './rollback/sportsRealtimeTransport.js';
import { createOnlineSportState, stepOnlineSport, WIDTH, HEIGHT } from './rollback/sportsSimulation.js';
import { checksumState } from './rollback/stateChecksum.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { reportOnlineSportResult } from './sportsOnline.js';
import { supabase } from './supabaseClient.js';

export default function SportsRollbackArena({ match, players, settings = {}, onEnd }) {
  const canvasRef = useRef(null); const [status, setStatus] = useState('CONNECTING…'); const [result, setResult] = useState(null); const [me, setMe] = useState(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user || null)); }, []);
  useEffect(() => {
    if (!match?.id || !me?.id || !players.length) return; let stopped = false, raf = 0; const keys = {}; let transport, session; const playerIds = players.map(p => p.user_id);
    const down = e => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; e.preventDefault(); }; const up = e => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const draw = state => { const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return; ctx.fillStyle='#08051e'; ctx.fillRect(0,0,WIDTH,HEIGHT); ctx.strokeStyle='#7946ff'; ctx.lineWidth=3; ctx.strokeRect(15,15,WIDTH-30,420); if (state.sport === 'volleyball') { ctx.fillStyle='#eee'; ctx.fillRect(WIDTH/2-3,160,6,275); } ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText(`${state.score[0]}  —  ${state.score[1]}`, WIDTH/2,55); state.players.forEach(p => { ctx.fillStyle=p.team===1?'#3192ff':'#ff4d6d'; ctx.beginPath(); ctx.arc(p.x,p.y,20,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.fillText(p.id===me.id?'YOU':p.char,p.x,p.y-30); }); ctx.fillStyle='#ffd447'; ctx.beginPath(); ctx.arc(state.ball.x,state.ball.y,12,0,Math.PI*2); ctx.fill(); };
    const boot = async () => { try { transport = new SportsRealtimeTransport({ matchId:match.id, playerId:me.id, playerIds }); await transport.connect(); session = new MultiplayerRollbackSession({ matchId:match.id, playerId:me.id, playerIds, initialState:createOnlineSportState({mode:match.mode,players}), stepFrame:stepOnlineSport, sendInput:p=>transport.sendInput(p), sendChecksum:p=>transport.sendChecksum(p), onDesync:()=>setStatus('DESYNC DETECTED') }); transport.on('input', p=>session.receiveInput(p)); transport.on('checksum', p=>session.receiveChecksum(p)); setStatus('CONNECTED · ROLLBACK'); const binds=getKeybinds(settings); let previous=performance.now(), carry=0; const tick=now=>{ if(stopped) return; carry+=Math.min(100,now-previous); previous=now; while(carry>=1000/60){ const pad=settings.controllerEnabled===false?null:readGamepadInput(0); const k=readPlayerInput(keys,binds.p1); const input=pad?{...k,left:k.left||pad.left,right:k.right||pad.right,up:k.up||pad.up,down:k.down||pad.down,jump:k.jump||pad.jump,sig:k.sig||pad.sig,heavy:k.heavy||pad.heavy,power:k.power||pad.power}:k; const state=session.advance(input); if(state.winnerTeam&&!result){ setResult({winnerTeam:state.winnerTeam,frame:state.frame,checksum:checksumState(state)}); } carry-=1000/60; } draw(session.getState()); raf=requestAnimationFrame(tick);}; raf=requestAnimationFrame(tick); } catch(e){setStatus(e.message);} }; boot(); return()=>{stopped=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);transport?.close();};
  },[match?.id, players.length, me?.id]);
  const finish = async () => { try { await reportOnlineSportResult({matchId:match.id,winnerTeam:result.winnerTeam,finalFrame:result.frame,checksum:result.checksum}); } catch {} const mine=players.find(p=>p.user_id===me.id); onEnd?.({won:mine?.team===result.winnerTeam,sport:match.mode.split('_')[0]}); };
  if(result) return <div className="text-center space-y-5"><h2 className="text-4xl font-heading text-accent">TEAM {result.winnerTeam} WINS!</h2><button onClick={finish} className="px-6 py-3 bg-primary rounded font-heading">SUBMIT RESULT</button></div>;
  return <div className="w-full max-w-5xl text-center"><p className="font-heading text-accent mb-2">{status}</p><canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full border-2 border-primary rounded-lg" /><p className="text-xs text-muted-foreground mt-2">Move, jump, and use signature/heavy/power near the ball.</p></div>;
}
