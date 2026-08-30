import React from 'react';
import { BLOCK_COLORS,BLOCK_NAMES,BLOCKS } from './world.js';
import { STORY_ITEM_MAP } from './storyItems.js';
import GameIcon from './GameIcon.jsx';
export default function StoryInventory({inventory,selectedBlock,onSelect,onClose}){
 const entries=Object.entries(inventory).filter(([,v])=>v>0);
 return <div className="absolute top-4 right-4 bg-card/95 backdrop-blur border border-border rounded-xl p-4 w-[360px] max-h-[calc(100%-32px)] shadow-2xl z-30">
  <div className="flex justify-between items-center mb-3"><h3 className="font-heading text-sm text-foreground">INVENTORY</h3><button onClick={onClose}><GameIcon emoji="✕" size={14}/></button></div>
  <div className="grid grid-cols-5 gap-2 max-h-[calc(100vh-180px)] overflow-y-auto">{entries.map(([id,count])=>{const numeric=/^\d+$/.test(id);const bid=numeric?Number(id):null;const name=numeric?(BLOCK_NAMES[bid]||'Block'):(STORY_ITEM_MAP[id]?.name||id);return <button key={id} draggable={numeric} onDragStart={e=>numeric&&e.dataTransfer.setData('blockId',id)} onClick={()=>numeric&&onSelect(bid)} className={`flex flex-col items-center p-1.5 rounded border ${selectedBlock===bid?'border-accent bg-accent/10':'border-border hover:border-accent'}`}><div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[8px]" style={numeric?{backgroundColor:BLOCK_COLORS[bid]||'#888'}:{}}>{numeric?'':name.slice(0,2).toUpperCase()}</div><span className="text-[8px] text-foreground mt-1 leading-tight text-center">{name}</span><span className="text-[8px] text-muted-foreground">{count}</span></button>})}</div>
  {!entries.length&&<p className="text-xs text-muted-foreground text-center py-8">Empty.</p>}
 </div>
}
