import React, { useMemo, useState } from 'react';
import { HEROES } from './heroes.js';

export default function StoryCharacterSelect({ unlockedIds = ['yellow'], onNext, onBack }) {
  const [selected, setSelected] = useState(unlockedIds[0] || 'yellow');
  const unlocked = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const groups = useMemo(() => {
    const out = { 'GENERATION 1': [], 'GENERATION 2': [], 'GENERATION 3': [], 'GENERATION 4': [], 'GENERATION 5': [], 'COSMIC': [] };
    HEROES.forEach(h => {
      const g = String(h.generation || h.gen || h.book || '').toLowerCase();
      const key = g.includes('cosmic') ? 'COSMIC' : /5|g5|gen5/.test(g) ? 'GENERATION 5' : /4|g4|gen4/.test(g) ? 'GENERATION 4' : /3|g3|gen3/.test(g) ? 'GENERATION 3' : /2|g2|gen2/.test(g) ? 'GENERATION 2' : 'GENERATION 1';
      out[key].push(h);
    });
    Object.values(out).forEach(a => a.sort((x,y)=>(x.name||'').localeCompare(y.name||'')));
    return out;
  }, []);
  return <div className="min-h-[620px] w-full max-w-5xl bg-black/80 rounded-2xl border border-white/15 p-6 text-white">
    <div className="flex items-center justify-between mb-5"><div><div className="text-xs tracking-[.35em] text-white/45">NEW STORY</div><h2 className="text-3xl font-heading tracking-widest">SELECT YOUR HERO</h2><p className="text-sm text-white/55 mt-1">Choose any character you have already unlocked. Your choice stays with this save.</p></div><button onClick={onBack} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">BACK</button></div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-h-[440px] overflow-y-auto pr-2">
      {Object.entries(groups).map(([label, heroes]) => <section key={label} className="col-span-full"><h3 className="text-xs tracking-[.3em] text-white/40 mb-2">{label}</h3><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">{heroes.map(h => { const ok=unlocked.has(h.id); const active=selected===h.id; const color=h.color||'#888'; return <button key={h.id} disabled={!ok} onClick={()=>setSelected(h.id)} className={`relative p-3 rounded-xl border text-left transition ${active?'border-white bg-white/15':'border-white/10 bg-white/5 hover:bg-white/10'} ${!ok?'opacity-30 cursor-not-allowed':''}`}><div className="mx-auto mb-2 w-12 h-12 rounded-full border-2" style={{background:color,borderColor:active?'white':color,boxShadow:`0 0 18px ${color}55`}}/><div className="text-sm font-heading truncate">{h.name}</div><div className="text-[10px] text-white/45 truncate">{h.title||'Hero'}</div>{!ok&&<span className="absolute top-2 right-2">🔒</span>}</button> })}</div></section>)}
    </div>
    <div className="flex justify-end mt-5"><button onClick={()=>onNext(selected)} className="px-8 py-3 rounded-xl bg-white text-black font-heading tracking-widest hover:opacity-90">NEXT</button></div>
  </div>;
}
