import React, { useEffect, useState } from 'react';

const CARDS = [
  ['ELEMENT 6','Before the heroes, there was only the source.'],
  ['THE FOUR FORCES','Four powers shaped the first age.'],
  ['THE SHATTERING','Then the source broke — and history broke with it.'],
  ['THE SPLINTERS','The fragments became the force later generations would inherit.'],
  ['ELEMENT 6','One story. Five Books. One world connected across time.']
];

export default function StoryNewsreelCutscene({ onDone }) {
  const [i,setI]=useState(0); const [skip,setSkip]=useState(0);
  useEffect(()=>{ const kd=e=>{if(e.key==='Enter'||e.key==='Return'){setSkip(v=>v+1)}}; window.addEventListener('keydown',kd); return()=>window.removeEventListener('keydown',kd)},[]);
  useEffect(()=>{ if(skip>=1){onDone?.(); return;} const t=setTimeout(()=>setI(v=>{if(v<CARDS.length-1)return v+1; onDone?.(); return v}),3800); return()=>clearTimeout(t)},[i,skip,onDone]);
  const [title,text]=CARDS[i];
  return <div className="fixed inset-0 z-[100] bg-[#19130e] text-[#f4dfb0] flex items-center justify-center overflow-hidden" onClick={()=>setSkip(v=>v+1)}>
    <div className="absolute inset-0 opacity-20" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(255,255,255,.08) 4px)'}}/>
    <div className="text-center max-w-3xl px-8"><div className="text-xs tracking-[.6em] opacity-45 mb-5">ELEMENT 6 ARCHIVES • 1920s NEWSREEL</div><div className="text-6xl md:text-8xl font-serif tracking-widest mb-6">{title}</div><div className="text-lg md:text-2xl font-serif opacity-80">{text}</div><div className="mt-10 text-[10px] tracking-[.3em] opacity-35">PRESS ENTER TO SKIP • CLICK TO SKIP</div></div>
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1">{CARDS.map((_,n)=><div key={n} className={`h-1 w-8 ${n===i?'bg-[#f4dfb0]':'bg-[#f4dfb0]/20'}`}/>)}</div>
  </div>;
}
