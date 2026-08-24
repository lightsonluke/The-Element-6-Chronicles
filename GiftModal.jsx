import React, { useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getAccessory } from './cosmetics.js';
import { getSkin } from './skins.js';
import { getKillFX } from './killFX.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const nameOf = (id, fn) => (fn(id)?.name) || id;

// Gifting — free, one-way ownership transfer. Caller handles the actual
// inventory mutation + unequip via onApply.
export default function GiftModal({ peer, inventory, onApply, onClose }) {
  const [gift, setGift] = useState(null); // {cat, id}
  const [tokens, setTokens] = useState(0);

  const ownedChars = (inventory?.unlockedIds || []).filter(id => ALL.some(c => c.id === id) && id !== 'yellow');
  const ownedAccs = inventory?.ownedAccessories || [];
  const ownedSkins = inventory?.ownedSkins || [];
  const ownedFX = inventory?.ownedKillFX || [];
  const myTokens = inventory?.coins || 0;

  const send = () => {
    if (!gift && tokens <= 0) return;
    sfx.purchaseSuccess();
    onApply?.({ ...gift, tokens });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-xl p-5 w-[480px] max-w-[94%] max-h-[86vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-primary"><GameIcon emoji="🎁" size={14} /> GIFT — {peer.name}</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">Choose one item to gift. Ownership transfers permanently — you will no longer own it.</p>

        <div className="space-y-3">
          <PickSection label="Characters" items={ownedChars} selected={gift} onSelect={(id) => setGift({ cat: 'char', id })} render={id => ALL.find(c => c.id === id)?.name || id} />
          <PickSection label="Accessories" items={ownedAccs} selected={gift} onSelect={(id) => setGift({ cat: 'acc', id })} render={id => nameOf(id, getAccessory)} />
          <PickSection label="Skins" items={ownedSkins} selected={gift} onSelect={(id) => setGift({ cat: 'skin', id })} render={id => nameOf(id, getSkin)} />
          <PickSection label="Kill FX" items={ownedFX} selected={gift} onSelect={(id) => setGift({ cat: 'killfx', id })} render={id => nameOf(id, getKillFX)} />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-heading text-foreground">Tokens (<GameIcon emoji="◆" size={14} /> {myTokens})</span>
          <input type="number" min={0} max={myTokens} value={tokens} onChange={e => setTokens(Math.max(0, Math.min(myTokens, +e.target.value || 0)))} className="flex-1 bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-heading" />
        </div>

        <button onClick={send} disabled={!gift && tokens <= 0} className="w-full mt-4 px-3 py-2 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50">SEND GIFT</button>
        <p className="text-[9px] text-muted-foreground mt-2">Gifting is free and one-way. Equipped items are auto-unequipped. No duplication.</p>
      </div>
    </div>
  );
}

function PickSection({ label, items, selected, onSelect, render }) {
  return (
    <div>
      <p className="text-[9px] font-heading text-muted-foreground mb-1">{label}</p>
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
        {(items || []).map(id => (
          <button key={id} onClick={() => onSelect(id)}
            className={`px-2 py-0.5 rounded text-[10px] font-heading border ${selected?.cat && selected.id === id ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-secondary text-secondary-foreground'}`}>
            {render(id)}
          </button>
        ))}
        {(!items || items.length === 0) && <span className="text-[10px] text-muted-foreground italic">None owned.</span>}
      </div>
    </div>
  );
}