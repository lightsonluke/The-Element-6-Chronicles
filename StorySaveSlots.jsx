import React, { useState } from 'react';
import { HEROES } from './heroes.js';
import { calculateStoryProgress } from './storyModeOverhaul.js';
import GameIcon from './GameIcon.jsx';

function getHero(data){return HEROES.find(h=>h.id===(data?.currentHeroId||data?.selectedHeroId))||null}
function nickname(hero){return hero?.nickname||hero?.codename||hero?.title||hero?.name||'Hero'}

export default function StorySaveSlots({ slots=[null,null,null], onSelect, onDelete, onBack }) {
  const [confirmDelete,setConfirmDelete]=useState(null);
  return <div className="w-full max-w-4xl flex flex-col gap-5 text-white">
    <div className="flex items-end justify-between"><div><div className="text-[10px] tracking-[.5em] text-white/30">ELEMENT 6</div><h2 className="text-3xl font-heading tracking-[.2em]">SELECT YOUR SAVE</h2><p className="text-xs text-white/45 mt-1">Choose an existing journey or create a new save file.</p></div><button onClick={onBack} className="px-4 py-2 rounded-lg bg-white/10 text-xs hover:bg-white/15"><GameIcon emoji="←" size={13}/> BACK</button></div>
    <div className="grid gap-3">{[0,1,2].map(i=>{const data=slots[i];const h=getHero(data);const pct=calculateStoryProgress(data||{});const confirming=confirmDelete===i;return <div key={i} className={`rounded-2xl border p-4 flex items-center gap-4 ${data?'border-white/15 bg-black/45':'border-white/8 bg-black/25'}`}>
      <div className="text-xs tracking-[.25em] text-white/25 w-14 shrink-0">SAVE {i+1}</div>
      <div className="w-11 h-11 rounded-full border-2 shrink-0" style={{background:h?.color||'#161616',borderColor:h?.color||'rgba(255,255,255,.12)',boxShadow:h?`0 0 18px ${h.color}44`:undefined}}/>
      <div className="flex-1 min-w-0">{data?<><div className="font-heading text-sm truncate">{nickname(h)}</div><div className="text-[11px] text-white/45 mt-0.5">Progress: {pct}%</div><div className="mt-1.5 h-1 bg-white/10 rounded overflow-hidden"><div className="h-full bg-white" style={{width:`${pct}%`}}/></div></>:<div className="text-sm text-white/25">EMPTY — + NEW SAVE</div>}</div>
      <div className="flex gap-2">{data?<button onClick={()=>onSelect?.(i)} className="px-4 py-2 rounded-lg bg-white text-black text-[11px] font-heading">CONTINUE</button>:<button onClick={()=>onSelect?.(i)} className="px-4 py-2 rounded-lg bg-white text-black text-[11px] font-heading">CREATE</button>}{data&&!confirming&&<button onClick={()=>setConfirmDelete(i)} className="px-3 py-2 rounded-lg bg-white/8 text-[11px]">DELETE</button>}{data&&confirming&&<><button onClick={()=>{onDelete?.(i);setConfirmDelete(null)}} className="px-3 py-2 rounded-lg bg-red-500/80 text-[11px]">CONFIRM</button><button onClick={()=>setConfirmDelete(null)} className="px-3 py-2 rounded-lg bg-white/8 text-[11px]">CANCEL</button></>}</div>
    </div>})}</div>
    <div className="text-[10px] text-white/25 text-center">Each save stores its own story progress. Character unlocks remain shared with the main game.</div>
  </div>
}
