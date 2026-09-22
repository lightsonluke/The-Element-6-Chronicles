import React, { useMemo, useState } from 'react';
import { HEROES } from './heroes.js';

function generationOf(hero,index){
  const raw=String(hero?.generation||hero?.gen||hero?.generationId||'').toLowerCase();
  const n=raw.match(/(?:gen(?:eration)?\s*)?(\d+)/)?.[1];
  if(n&&Number(n)>=1&&Number(n)<=5)return Number(n);
  // The current roster does not expose a generation field. Keep every existing
  // hero selectable and divide the existing roster into five visual generations
  // without changing the underlying character data.
  const size=Math.ceil(HEROES.length/5);
  return Math.min(5,Math.floor(index/size)+1);
}

export default function StoryCharacterSelect({ onNext, onBack }) {
  const all=useMemo(()=>HEROES.map((h,i)=>({...h,_storyGeneration:generationOf(h,i)})),[]);
  const [generation,setGeneration]=useState(1);
  const [selected,setSelected]=useState(all[0]?.id||'yellow');
  const visible=all.filter(h=>h._storyGeneration===generation);
  const selectedHero=all.find(h=>h.id===selected)||all[0];
  return <div className="min-h-[620px] w-full max-w-6xl bg-black/80 rounded-2xl border border-white/15 p-6 text-white">
    <div className="flex items-center justify-between mb-5">
      <div><div className="text-xs tracking-[.35em] text-white/45">NEW STORY • ALL GENERATIONS AVAILABLE</div><h2 className="text-3xl font-heading tracking-widest">SELECT YOUR HERO</h2><p className="text-sm text-white/55 mt-1">Every existing Element 6 playable hero from Generations 1–5 can be used in Story Mode. This does not unlock them in the rest of the game.</p></div>
      <button onClick={onBack} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">BACK</button>
    </div>
    <div className="grid grid-cols-5 gap-2 mb-5">{[1,2,3,4,5].map(g=><button key={g} onClick={()=>setGeneration(g)} className={`py-2 rounded-lg border text-xs font-heading tracking-widest ${generation===g?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/60'}`}>GEN {g}</button>)}</div>
    <div className="text-[10px] tracking-[.3em] text-white/35 mb-2">GENERATION {generation} • {visible.length} HEROES</div>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[430px] overflow-y-auto pr-2">
      {visible.map(h=>{const active=selected===h.id;const color=h.color||'#888';return <button key={h.id} onClick={()=>setSelected(h.id)} className={`relative p-3 rounded-xl border text-left transition ${active?'border-white bg-white/15':'border-white/10 bg-white/5 hover:bg-white/10'}`}><div className="mx-auto mb-2 w-12 h-12 rounded-full border-2" style={{background:color,borderColor:active?'white':color,boxShadow:`0 0 18px ${color}55`}}/><div className="text-sm font-heading truncate">{h.name}</div><div className="text-[10px] text-white/45 truncate">{h.title||'Hero'}</div></button>})}
    </div>
    {selectedHero&&<div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-full" style={{background:selectedHero.color}}/><div className="flex-1"><div className="font-heading">{selectedHero.name}</div><div className="text-xs text-white/45">{selectedHero.title} • {selectedHero.power}</div></div><button onClick={()=>onNext(selectedHero.id)} className="px-8 py-3 rounded-xl bg-white text-black font-heading tracking-widest hover:opacity-90">BEGIN CHRONICLES</button></div>}
  </div>;
}
