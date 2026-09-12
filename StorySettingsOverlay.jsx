import React from 'react';
import { HEROES } from './heroes.js';

export default function StorySettingsOverlay({ unlockedIds=[], currentHeroId, onChangeHero, onClose }) {
  const unlocked = new Set(unlockedIds);
  return <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"><div className="w-full max-w-4xl bg-[#121212] border border-white/15 rounded-2xl p-6 text-white shadow-2xl"><div className="flex justify-between items-center mb-5"><div><div className="text-xs tracking-[.3em] text-white/40">STORY SETTINGS</div><h2 className="text-2xl font-heading">CHANGE HERO</h2><p className="text-xs text-white/45 mt-1">Swapping heroes never resets story progress.</p></div><button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg">CLOSE</button></div><div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-[55vh] overflow-y-auto">{HEROES.map(h=>{const ok=unlocked.has(h.id);const active=currentHeroId===h.id;const c=h.color||'#888';return <button key={h.id} disabled={!ok} onClick={()=>{onChangeHero?.(h.id);onClose?.()}} className={`p-3 rounded-xl border ${active?'border-white bg-white/15':'border-white/10 bg-white/5'} ${ok?'hover:bg-white/10':'opacity-25'}`}><div className="w-10 h-10 mx-auto rounded-full" style={{background:c}}/><div className="text-[11px] mt-2 truncate">{h.name}</div></button>})}</div></div></div>;
}
