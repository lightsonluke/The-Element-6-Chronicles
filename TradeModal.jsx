import React, { useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getAccessory } from './cosmetics.js';
import { getSkin } from './skins.js';
import { getKillFX } from './killFX.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const nameOf = (id, fn) => (fn(id)?.name) || id;

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Trade modal — two-sided offer of characters, gear, accessories, kill FX, and
// tokens. Requires both Accept then Confirm. On complete, ownership transfers
// via the provided onApply callback (caller mutates inventory + unequips).
export default function TradeModal({ me, peer, inventory, onAccept, onConfirm, onClose }) {
  const [offer, setOffer] = useState({ chars: [], accs: [], skins: [], killfx: [], tokens: 0 });
  const [peerAccepted, setPeerAccepted] = useState(false);
  const [iAccepted, setIAccepted] = useState(false);
  const [phase, setPhase] = useState('offer'); // offer -> accepted -> confirm

  const ownedChars = (inventory?.unlockedIds || ['yellow']).filter(id => ALL.some(c => c.id === id));
  const ownedAccs = inventory?.ownedAccessories || [];
  const ownedSkins = inventory?.ownedSkins || [];
  const ownedFX = inventory?.ownedKillFX || [];
  const myTokens = inventory?.coins || 0;

  const toggle = (cat, id) => {
    setOffer(o => {
      const list = o[cat].includes(id) ? o[cat].filter(x => x !== id) : [...o[cat], id];
      return { ...o, [cat]: list, tokens: o.tokens };
    });
    setIAccepted(false); setPeerAccepted(false); setPhase('offer');
  };

  const confirm = () => {
    sfx.purchaseSuccess();
    onApply?.(offer);
    onClose?.();
  };
  const onApply = (offer) => {
    // caller handles inventory mutation; here we just signal transfer.
    onConfirm?.({ give: offer, toUserId: peer.id });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-accent rounded-xl p-5 w-[640px] max-w-[96%] max-h-[86vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon emoji="🤝" size={14} /> TRADE — {peer.name}</h3>
          {peerAccepted && <span className="text-[10px] px-2 py-0.5 rounded bg-green-600/30 text-green-400 font-heading">{peer.name} accepted</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-heading text-primary mb-2">YOUR OFFER</p>
            <PoolSection label="Characters" items={ownedChars} cat="chars" value={offer.chars} onToggle={toggle} render={id => ALL.find(c => c.id === id)?.name || id} />
            <PoolSection label="Accessories" items={ownedAccs} cat="accs" value={offer.accs} onToggle={toggle} render={id => nameOf(id, getAccessory)} />
            <PoolSection label="Skins" items={ownedSkins} cat="skins" value={offer.skins} onToggle={toggle} render={id => nameOf(id, getSkin)} />
            <PoolSection label="Kill FX" items={ownedFX} cat="killfx" value={offer.killfx} onToggle={toggle} render={id => nameOf(id, getKillFX)} />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-heading text-foreground">Tokens</span>
              <input type="number" min={0} max={myTokens} value={offer.tokens} onChange={e => { setOffer(o => ({ ...o, tokens: Math.max(0, Math.min(myTokens, +e.target.value || 0)) })); setIAccepted(false); }} className="flex-1 bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-heading" />
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 flex flex-col">
            <p className="text-xs font-heading text-primary mb-2">{peer.name}'S OFFER</p>
            {peer.offer ? (
              <ul className="text-[11px] text-foreground font-body space-y-1">
                {peer.offer.chars?.map(id => <li key={id}>Hero: {ALL.find(c => c.id === id)?.name || id}</li>)}
                {peer.offer.accs?.map(id => <li key={id}>Accessory: {nameOf(id, getAccessory)}</li>)}
                {peer.offer.skins?.map(id => <li key={id}>Skin: {nameOf(id, getSkin)}</li>)}
                {peer.offer.killfx?.map(id => <li key={id}>FX: {nameOf(id, getKillFX)}</li>)}
                {peer.offer.tokens > 0 && <li><GameIcon emoji="◆" size={14} /> {peer.offer.tokens} tokens</li>}
                {!peer.offer.chars?.length && !peer.offer.accs?.length && !peer.offer.skins?.length && !peer.offer.killfx?.length && !peer.offer.tokens && <li className="text-muted-foreground italic">Nothing offered yet.</li>}
              </ul>
            ) : <p className="text-[11px] text-muted-foreground italic">Waiting for {peer.name} to set their offer…</p>}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => { onAccept?.(offer); setPeerAccepted(true); }} className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded font-heading text-xs">Accept Offer</button>
          <button onClick={confirm} disabled={!peerAccepted} className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded font-heading text-xs disabled:opacity-50">CONFIRM TRADE</button>
          <button onClick={onClose} className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs">Cancel</button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-2">Trading permanently transfers ownership. Equipped items are auto-unequipped. No duplication.</p>
      </div>
    </div>
  );
}

function PoolSection({ label, items, cat, value, onToggle, render }) {
  return (
    <div className="mb-2">
      <p className="text-[9px] font-heading text-muted-foreground mb-1">{label}</p>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {(items || []).map(id => (
          <button key={id} onClick={() => onToggle(cat, id)}
            className={`px-2 py-0.5 rounded text-[10px] font-heading border ${value.includes(id) ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>
            {render(id)}
          </button>
        ))}
        {(!items || items.length === 0) && <span className="text-[10px] text-muted-foreground italic">None owned.</span>}
      </div>
    </div>
  );
}