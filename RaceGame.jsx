import React,{useEffect,useRef,useState} from 'react';
import {supabase} from './supabaseClient.js';
import GameCanvasPortal from './GameCanvasPortal.jsx';
import GameIcon from './GameIcon.jsx';

const W=1280,H=720,PLAYER_R=16,MAX=30;
const randSeed=s=>{let x=0;for(const c of String(s)){x=(x*31+c.charCodeAt(0))>>>0}return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}};
function makePlatforms(seed){const r=randSeed(seed),out=[];for(let i=0;i<260;i++){const x=i*260+(r()*70);const y=430+r()*150;out.push({x,y,w:170+r()*100,h:18})}return out}
function botState(i,r){return{x:180+i*22,y:120+(i%5)*30,vx:2.6+r()*0.8,vy:0,alive:true,attack:0,jump:Math.floor(r()*90)}}
export default function RaceGame({matchId,me,players,seed,settings={},sfxVolume=70,musicVolume=50,onEnd}){
 const canvasRef=useRef(null),keys=useRef({}),frame=useRef(0),state=useRef(null),channel=useRef(null),winnerSent=useRef(false);
 const [finished,setFinished]=useState(null); const [alive,setAlive]=useState(true);
 useEffect(()=>{
  const roster=[...(players||[])];const r=randSeed(seed);
  while(roster.length<MAX)roster.push({user_id:`bot:${roster.length+1}`,loadout:{username:`BOT ${String(roster.length+1).padStart(2,'0')}`,character_id:'yellow'},player_slot:roster.length+1,is_bot:true});
  const localId=me?.id; const isHost=players?.[0]?.user_id===localId; const map=Object.fromEntries(roster.map((p,i)=>[p.user_id,{id:p.user_id,name:p.loadout?.username||'Player',x:180+i*24,y:150+(i%6)*28,vx:3.2,vy:0,alive:true,attack:0,ground:false,isBot:!!p.is_bot,seed:i+1}]));
  if(localId&&map[localId])map[localId].x=220;
  state.current={players:map,wall:-80,platforms:makePlatforms(seed),started:Date.now(),finished:null};
  channel.current=supabase.channel(`race-game:${matchId}`,{config:{broadcast:{self:false}}})
   .on('broadcast',{event:'state'},({payload})=>{if(!payload||payload.userId===localId)return;const p=state.current?.players?.[payload.userId];if(p)Object.assign(p,payload.state)})
   .on('broadcast',{event:'winner'},({payload})=>{if(payload?.winner&&!state.current.finished){state.current.finished=payload.winner;setFinished(payload.winner)}})
   .subscribe();
  const kd=e=>{keys.current[e.key.toLowerCase()]=true;if(e.key===' '||e.key==='ArrowUp')e.preventDefault()};const ku=e=>{keys.current[e.key.toLowerCase()]=false};window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  let raf=0,last=performance.now();
  const loop=now=>{const dt=Math.min(32,now-last)/16.67;last=now;const st=state.current;if(!st||st.finished)return;
   frame.current++;st.wall+=0.65*dt;
   const mep=st.players[localId]; if(mep&&mep.alive){mep.vx=3.4; if(keys.current.arrowleft)mep.vx=2.2;if(keys.current.arrowright)mep.vx=4.2;if((keys.current[' ']||keys.current.arrowup)&&mep.ground&&frame.current%12===0){mep.vy=-10;mep.ground=false}mep.vy+=0.48*dt;mep.x+=mep.vx*dt;mep.y+=mep.vy*dt;mep.ground=false;
    if(keys.current['x']&&mep.attack<=0){mep.attack=18;const near=Object.values(st.players).filter(p=>p.id!==localId&&p.alive&&Math.abs(p.x-mep.x)<85&&Math.abs(p.y-mep.y)<55);near.forEach(p=>{p.x-=4;p.vx=Math.max(1,p.vx-0.8)})}mep.attack=Math.max(0,mep.attack-1);
    if(mep.y>H+100||mep.x<st.wall+35){mep.alive=false;setAlive(false)}
   }
   Object.values(st.players).forEach((p,i)=>{if(p.id===localId||!p.alive)return;if(p.isBot){if(frame.current%60===0&&p.y>H-120)p.vy=-10;p.vy+=0.48*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.jump=(p.jump+1)%90;if(p.x<st.wall+35||p.y>H+100)p.alive=false}});
   // platform collision
   Object.values(st.players).forEach(p=>{if(!p.alive)return;for(const q of st.platforms){if(p.x>q.x&&p.x<q.x+q.w&&p.y+PLAYER_R>=q.y&&p.y+PLAYER_R<=q.y+25&&p.vy>=0){p.y=q.y-PLAYER_R;p.vy=0;p.ground=true;break}}});
   const alivePlayers=Object.values(st.players).filter(p=>p.alive);
   if(alivePlayers.length<=1){const win=alivePlayers[0]?.id||localId;if(isHost&&!winnerSent.current){winnerSent.current=true;st.finished=win;channel.current?.send({type:'broadcast',event:'winner',payload:{winner:win}}).catch(()=>{});setFinished(win)}}
   if(mep&&frame.current%6===0)channel.current?.send({type:'broadcast',event:'state',payload:{userId:localId,state:{x:mep.x,y:mep.y,vx:mep.vx,vy:mep.vy,alive:mep.alive,attack:mep.attack}}}).catch(()=>{});
   draw(canvasRef.current?.getContext('2d'),st,localId);raf=requestAnimationFrame(loop)
  };raf=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);if(channel.current)supabase.removeChannel(channel.current)}
 },[matchId]);
 useEffect(()=>{if(finished&&finished===me?.id){setTimeout(()=>onEnd?.({winner:finished}),1800)}},[finished,me?.id]);
 const draw=(ctx,st,localId)=>{if(!ctx)return;ctx.clearRect(0,0,W,H);ctx.fillStyle='#07111f';ctx.fillRect(0,0,W,H);
   const camX=Math.max(0,(st.players[localId]?.x||0)-300);ctx.save();ctx.translate(-camX,0);
   ctx.fillStyle='#2c3b52';st.platforms.filter(p=>p.x>camX-100&&p.x<camX+W+100).forEach(p=>ctx.fillRect(p.x,p.y,p.w,p.h));
   ctx.fillStyle='#ff3344';ctx.fillRect(st.wall,0,26,H);
   Object.values(st.players).forEach((p,i)=>{if(!p.alive)return;ctx.beginPath();ctx.arc(p.x,p.y,PLAYER_R,0,Math.PI*2);ctx.fillStyle=p.id===localId?'#ffd84a':p.isBot?'#8b8b9b':'#55aaff';ctx.fill();if(p.attack>0){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(p.x+10,p.y-12,38,24)}});
   ctx.restore();ctx.fillStyle='#fff';ctx.font='bold 20px Orbitron';ctx.fillText(`RACE · ${Object.values(st.players).filter(p=>p.alive).length}/${MAX}`,20,34);ctx.font='12px Rajdhani';ctx.fillText('MOVE: ← →   JUMP: SPACE/↑   ATTACK: X',20,55);ctx.fillText('THE WALL NEVER OUTRUNS YOU — KEEP MOVING',20,74);
 };
 if(finished)return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"><div className="bg-card border-2 border-accent rounded-2xl p-8 text-center"><h2 className="text-4xl font-heading text-accent">{finished===me?.id?'YOU WIN!':'RACE OVER'}</h2><p className="mt-2">{finished===me?.id?'You survived the wall.':`Winner: ${Object.values(state.current?.players||{}).find(p=>p.id===finished)?.name||'Player'}`}</p><button onClick={onEnd} className="mt-5 px-6 py-3 rounded bg-primary text-primary-foreground">CONTINUE</button></div></div>;
 return <div className="fixed inset-0 z-[9998] bg-black"><GameCanvasPortal><canvas data-e6-game-canvas="true" ref={canvasRef} width={W} height={H} className="el6-match-canvas" /></GameCanvasPortal>{!alive&&<div className="fixed inset-0 flex items-center justify-center pointer-events-none"><div className="bg-black/80 p-8 rounded-2xl text-center"><h2 className="text-4xl font-heading text-destructive">ELIMINATED</h2><p className="text-sm mt-2">Watch the remaining racers.</p></div></div>}</div>
}
