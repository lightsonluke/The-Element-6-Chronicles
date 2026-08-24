import React, { useState } from 'react';
import { PC_FURNITURE, PC_CLOTHING } from './personalCommunity.js';
import GameIcon from "./GameIcon.jsx";

export default function PCShop({ stRef, selected, onSave, force, sfx }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState('furniture');
  if (!open || !selected) return null;
  const selChar = { name: selected };

  const buyFurniture = (fid) => {
    const st = stRef.current;
    const item = PC_FURNITURE.find(f => f.id === fid); if (!item) return;
    if ((st.pcCoins || 0) < item.price) { sfx.warning(); return; }
    st.pcCoins -= item.price;
    if (!st.furniture) st.furniture = {};
    st.furniture[selected] = [...(st.furniture[selected] || []), fid];
    sfx.purchaseSuccess(); onSave(st); force(x => x + 1);
  };
  const buyClothing = (cid) => {
    const st = stRef.current;
    const item = PC_CLOTHING.find(c => c.id === cid); if (!item) return;
    if ((st.pcCoins || 0) < item.price) { sfx.warning(); return; }
    st.pcCoins -= item.price;
    if (!st.clothing) st.clothing = {};
    st.clothing[selected] = cid;
    sfx.purchaseSuccess(); onSave(st); force(x => x + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-card border-2 border-accent rounded-xl p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-heading text-accent"><GameIcon emoji="🛒" size={14} /> SHOP</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-heading text-accent"><GameIcon emoji="🪙" size={14} /> {stRef.current.pcCoins || 0}</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><GameIcon emoji="✕" size={14} /></button>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setTab('furniture')} className={`px-3 py-1 rounded font-heading text-xs ${tab === 'furniture' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}><GameIcon emoji="🛋️" size={14} /> FURNITURE</button>
          <button onClick={() => setTab('clothing')} className={`px-3 py-1 rounded font-heading text-xs ${tab === 'clothing' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}><GameIcon emoji="👕" size={14} /> CLOTHING</button>
        </div>
        {tab === 'furniture' ? (
          <div className="grid grid-cols-2 gap-2">
            {PC_FURNITURE.map(f => {
              const owned = ((stRef.current.furniture || {})[selected] || []).includes(f.id);
              return (
                <div key={f.id} className="bg-muted/40 border border-border rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{f.emoji}</span>
                    <div><p className="text-[11px] font-heading text-foreground">{f.name}</p><p className="text-[9px] text-accent"><GameIcon emoji="🪙" size={14} /> {f.price}</p></div>
                  </div>
                  <button disabled={owned || (stRef.current.pcCoins || 0) < f.price} onClick={() => buyFurniture(f.id)}
                    className={`px-2 py-1 rounded font-heading text-[9px] ${owned ? 'bg-muted text-muted-foreground' : (stRef.current.pcCoins || 0) >= f.price ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {owned ? 'OWNED' : 'BUY'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {PC_CLOTHING.map(c => {
              const equipped = (stRef.current.clothing || {})[selected] === c.id;
              return (
                <div key={c.id} className="bg-muted/40 border border-border rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <div><p className="text-[11px] font-heading text-foreground">{c.name}</p><p className="text-[9px] text-accent"><GameIcon emoji="🪙" size={14} /> {c.price}</p></div>
                  </div>
                  <button disabled={equipped || (stRef.current.pcCoins || 0) < c.price} onClick={() => buyClothing(c.id)}
                    className={`px-2 py-1 rounded font-heading text-[9px] ${equipped ? 'bg-muted text-muted-foreground' : (stRef.current.pcCoins || 0) >= c.price ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {equipped ? 'WORN' : 'BUY'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}