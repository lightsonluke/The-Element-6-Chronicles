import React,{useMemo,useState} from 'react';
import { RECIPES,canCraft,searchRecipes,getRecipeCategories } from './crafting.js';
import { STORY_ITEM_MAP,itemLabel } from './storyItems.js';
import GameIcon from './GameIcon.jsx';
export default function StoryCrafting({inventory,onCraft,onClose}){
 const [query,setQuery]=useState(''); const [category,setCategory]=useState('All');
 const cats=useMemo(()=>['All',...getRecipeCategories()],[ ]); const shown=useMemo(()=>searchRecipes(query,category),[query,category]);
 return <div className="absolute top-4 left-4 bg-card/95 backdrop-blur border border-border rounded-xl p-4 w-[420px] max-h-[calc(100%-32px)] shadow-2xl z-30">
  <div className="flex justify-between items-center mb-3"><h3 className="font-heading text-sm text-accent">CRAFTING</h3><button onClick={onClose}><GameIcon emoji="✕" size={14}/></button></div>
  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search crafting recipes..." className="w-full mb-2 px-3 py-2 rounded-lg bg-muted border border-border text-xs text-foreground outline-none focus:border-accent"/>
  <div className="flex gap-1 overflow-x-auto mb-3">{cats.map(c=><button key={c} onClick={()=>setCategory(c)} className={`px-2 py-1 rounded text-[9px] whitespace-nowrap ${category===c?'bg-accent text-accent-foreground':'bg-muted text-muted-foreground'}`}>{c}</button>)}</div>
  <div className="space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto">{shown.map((r,i)=>{const ok=canCraft(r,inventory);return <button key={i} disabled={!ok} onClick={()=>ok&&onCraft(r)} className={`w-full text-left p-2 rounded border ${ok?'border-accent/50 hover:bg-accent/10':'border-border opacity-50'}`}><div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-[8px]">{r.output.name.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="text-xs font-heading truncate">{r.output.name} ×{r.output.count}</p><p className="text-[9px] text-muted-foreground truncate">{r.ingredients.map(x=>`${x.count}× ${itemLabel(x.item)}`).join(' + ')}</p></div></div></button>})}</div>
  {!shown.length&&<p className="text-xs text-muted-foreground py-6 text-center">No matching recipes.</p>}
 </div>
}
