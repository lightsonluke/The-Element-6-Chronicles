import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { ACCESSORIES, getAccessory } from './cosmetics.js';
import { SKINS, getSkin } from './skins.js';
import { KILL_FX as KILL_FX_LIST, getKillFX } from './killFX.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Trade Offer Modal — shows BOTH players' inventories side by side.
// You select what you want from them (right) and what you'll offer in return (left).
// Creates a TradeGift record (type=trade_request, status=pending) that the other
// player must accept before items are swapped.
export default function TradeOfferModal({ mode = 'trade', peer, progress, userId, username, onConfirm, onClose }) {
  const [peerProgress, setPeerProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState({ tokens: 0, skins: [], accessories: [], killFX: [], chars: [] });
  const [request, setRequest] = useState({ tokens: 0, skins: [], accessories: [], killFX: [], chars: [] });
  const [activeSide, setActiveSide] = useState('offer'); // offer | request
  const [tab, setTab] = useState('tokens');
  const [busy, setBusy] = useState(false);

  // Fetch the peer's UserProgress to show their inventory
  useEffect(() => {
    if (!peer?.id) return;
    (async () => {
      try {
        const recs = await db.entities.UserProgress.filter({ user_id: peer.id });
        if (recs[0]?.progress_json) {
          setPeerProgress(JSON.parse(recs[0].progress_json));
        }
      } catch {}
      setLoading(false);
    })();
  }, [peer?.id]);

  const toggle = (side, category, id) => {
    const state = side === 'offer' ? offer : request;
    const setter = side === 'offer' ? setOffer : setRequest;
    const arr = [...(state[category] || [])];
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(id);
    setter({ ...state, [category]: arr });
    sfx.click();
  };

  const summary = (items) => {
    const s = [];
    if (items.tokens > 0) s.push(`${items.tokens} ◆`);
    if (items.skins?.length) s.push(`🎨 ${items.skins.length} skin${items.skins.length > 1 ? 's' : ''}`);
    if (items.accessories?.length) s.push(`⚔ ${items.accessories.length} gear`);
    if (items.killFX?.length) s.push(`✨ ${items.killFX.length} FX`);
    if (items.chars?.length) s.push(`👤 ${items.chars.length} char${items.chars.length > 1 ? 's' : ''}`);
    return s;
  };

  const hasItems = (items) => items.tokens > 0 || items.skins?.length || items.accessories?.length || items.killFX?.length || items.chars?.length;

  const confirm = async () => {
    if (!hasItems(offer) || !hasItems(request)) { sfx.warning(); return; }
    setBusy(true);
    try {
      // Create a TradeGift record (pending — peer must accept)
      await db.entities.TradeGift.create({
        type: 'trade_request',
        from_user_id: userId,
        to_user_id: peer.id,
        from_username: username,
        to_username: peer.username || peer.name || 'Player',
        status: 'pending',
        give: { tokens: offer.tokens || 0, skins: offer.skins, accessories: offer.accessories, killFX: offer.killFX, chars: offer.chars },
        request: { tokens: request.tokens || 0, skins: request.skins, accessories: request.accessories, killFX: request.killFX, chars: request.chars },
        room_code: peer.room || '',
      });
      sfx.purchaseSuccess();
      onConfirm?.({ give: offer, request });
    } catch (e) { sfx.warning(); }
    setBusy(false);
  };

  const ItemRow = ({ id, name, selected, onClick, color }) => (
    <button onClick={onClick} className={`w-full text-left px-2 py-1.5 rounded border flex items-center justify-between ${selected ? 'border-accent bg-accent/10' : 'border-border bg-secondary/50'}`}>
      <span className="text-xs font-body text-foreground flex items-center gap-2">
        {color && <span className="w-3 h-3 rounded-full" style={{ background: color }} />}
        {name}
      </span>
      <span className={`text-[10px] ${selected ? 'text-accent' : 'text-muted-foreground'}`}>{selected ? <GameIcon emoji="✓" size={14} /> : '+'}</span>
    </button>
  );

  // When offering, hide items the recipient already owns — prevents trading duplicates
  const peerOwns = (cat, id) => {
    if (!peerProgress) return false;
    if (cat === 'skins') return (peerProgress.ownedSkins || []).includes(id);
    if (cat === 'accessories') return (peerProgress.ownedAccessories || []).includes(id);
    if (cat === 'killFX') return (peerProgress.ownedKillFX || []).includes(id);
    if (cat === 'chars') return (peerProgress.unlockedIds || []).includes(id);
    return false;
  };

  const renderInventory = (side) => {
    const prog = side === 'offer' ? progress : peerProgress;
    const sel = side === 'offer' ? offer : request;
    if (!prog) return <p className="text-xs text-muted-foreground italic">No inventory data.</p>;

    const filterOwned = (cat, list) => side === 'offer' ? (list || []).filter(id => !peerOwns(cat, id)) : (list || []);

    return (
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto bg-muted/20 rounded-lg p-2">
        {tab === 'tokens' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{side === 'offer' ? 'You have' : 'They have'} <span className="text-accent font-heading">{prog.coins || 0}</span> tokens.</p>
            <input type="range" min={0} max={prog.coins || 0} value={sel.tokens} onChange={e => { const v = parseInt(e.target.value); side === 'offer' ? setOffer({ ...offer, tokens: v }) : setRequest({ ...request, tokens: v }); sfx.click(); }} className="w-full" />
            <p className="font-heading text-lg text-accent text-center">{sel.tokens} <GameIcon emoji="◆" size={14} /></p>
          </div>
        )}
        {tab === 'skins' && (
          filterOwned('skins', prog.ownedSkins).map(id => { const sk = getSkin(id); if (!sk) return null; return <ItemRow key={id} id={id} name={sk.name} color={sk.color} selected={sel.skins.includes(id)} onClick={() => toggle(side, 'skins', id)} />; })
        )}
        {tab === 'accs' && (
          filterOwned('accessories', prog.ownedAccessories).map(id => { const a = getAccessory(id); if (!a) return null; return <ItemRow key={id} id={id} name={a.name} color={a.color} selected={sel.accessories.includes(id)} onClick={() => toggle(side, 'accessories', id)} />; })
        )}
        {tab === 'fx' && (
          filterOwned('killFX', prog.ownedKillFX).map(id => { const fx = getKillFX(id); if (!fx) return null; return <ItemRow key={id} id={id} name={fx.name} selected={sel.killFX.includes(id)} onClick={() => toggle(side, 'killFX', id)} />; })
        )}
        {tab === 'chars' && (
          filterOwned('chars', prog.unlockedIds).filter(id => ALL.find(c => c.id === id)).map(id => { const c = ALL.find(x => x.id === id); return <ItemRow key={id} id={id} name={c.name} color={c.color} selected={sel.chars.includes(id)} onClick={() => toggle(side, 'chars', id)} />; })
        )}
        {tab === 'skins' && !filterOwned('skins', prog.ownedSkins).length && <p className="text-xs text-muted-foreground italic">{side === 'offer' ? 'No skins the recipient doesn\'t already have.' : 'No skins.'}</p>}
        {tab === 'accs' && !filterOwned('accessories', prog.ownedAccessories).length && <p className="text-xs text-muted-foreground italic">{side === 'offer' ? 'No gear the recipient doesn\'t already have.' : 'No gear.'}</p>}
        {tab === 'fx' && !filterOwned('killFX', prog.ownedKillFX).length && <p className="text-xs text-muted-foreground italic">{side === 'offer' ? 'No FX the recipient doesn\'t already have.' : 'No kill FX.'}</p>}
      </div>
    );
  };

  const Tab = ({ id, label }) => (
    <button onClick={() => { setTab(id); sfx.click(); }} className={`px-2 py-1 rounded font-heading text-[10px] border ${tab === id ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>{label}</button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-accent rounded-xl p-5 w-[680px] max-w-[94%] max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon emoji="🔄" size={14} /> TRADE — {peer.username || peer.name || 'Player'}</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">Select what you'll offer (left) and what you want from them (right). They must accept before the trade is official.</p>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading their inventory…</p>
        ) : (
          <>
            {/* Side selector */}
            <div className="flex gap-1.5 mb-2">
              <button onClick={() => setActiveSide('offer')} className={`flex-1 px-3 py-1.5 rounded font-heading text-[10px] ${activeSide === 'offer' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>YOUR OFFER {hasItems(offer) ? `(${summary(offer).length})` : ''}</button>
              <button onClick={() => setActiveSide('request')} className={`flex-1 px-3 py-1.5 rounded font-heading text-[10px] ${activeSide === 'request' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>YOU WANT {hasItems(request) ? `(${summary(request).length})` : ''}</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 flex-wrap mb-2">
              <Tab id="tokens" label="◆ TOKENS" />
              <Tab id="skins" label="🎨 SKINS" />
              <Tab id="accs" label="⚔ GEAR" />
              <Tab id="fx" label="✨ FX" />
              <Tab id="chars" label="👤 CHARS" />
            </div>

            {renderInventory(activeSide)}

            {/* Summary of both sides */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-muted/30 border border-border rounded-lg p-2">
                <p className="text-[10px] font-heading text-primary mb-1">OFFERING:</p>
                <div className="flex flex-wrap gap-1">
                  {summary(offer).length === 0 ? <span className="text-xs text-muted-foreground italic">Nothing yet.</span> : summary(offer).map((s, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 bg-accent/20 text-accent rounded font-heading">{s}</span>)}
                </div>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-2">
                <p className="text-[10px] font-heading text-primary mb-1">REQUESTING:</p>
                <div className="flex flex-wrap gap-1">
                  {summary(request).length === 0 ? <span className="text-xs text-muted-foreground italic">Nothing yet.</span> : summary(request).map((s, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-heading">{s}</span>)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={confirm} disabled={busy || !hasItems(offer) || !hasItems(request)} className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded font-heading text-xs disabled:opacity-50">
                {busy ? 'SENDING…' : 'SEND TRADE OFFER'}
              </button>
              <button onClick={onClose} className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs">CANCEL</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}