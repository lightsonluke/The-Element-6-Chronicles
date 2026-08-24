import React, { useState } from 'react';
import { ACCESSORIES, getAccessory } from './cosmetics.js';
import { SKINS, getSkin } from './skins.js';
import { KILL_FX as KILL_FX_LIST, getKillFX } from './killFX.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Trade/Gift modal — shows your inventory so you can pick exactly what to give
// before confirming. mode: 'trade' | 'gift'. In trade mode, both sides confirm.
export default function TradeGiftModal({ mode, peerName, progress, onConfirm, onClose }) {
  const [tab, setTab] = useState('tokens');
  const [selected, setSelected] = useState({ tokens: 0, skins: [], accessories: [], killFX: [], chars: [] });

  const toggle = (category, id) => {
    setSelected(prev => {
      const arr = [...(prev[category] || [])];
      const idx = arr.indexOf(id);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(id);
      return { ...prev, [category]: arr };
    });
    sfx.click();
  };

  const tokenAmount = Math.min(selected.tokens, progress?.coins || 0);

  const summary = [];
  if (tokenAmount > 0) summary.push(`${tokenAmount} ◆ Tokens`);
  selected.skins.forEach(id => { const sk = getSkin(id); if (sk) summary.push(`🎨 ${sk.name}`); });
  selected.accessories.forEach(id => { const a = getAccessory(id); if (a) summary.push(`⚔ ${a.name}`); });
  selected.killFX.forEach(id => { const fx = getKillFX(id); if (fx) summary.push(`✨ ${fx.name}`); });
  selected.chars.forEach(id => { const c = ALL.find(x => x.id === id); if (c) summary.push(`👤 ${c.name}`); });

  const confirm = () => {
    if (summary.length === 0) { sfx.warning(); return; }
    sfx.purchaseSuccess();
    onConfirm?.({
      give: {
        tokens: tokenAmount,
        skins: selected.skins,
        accessories: selected.accessories,
        killFX: selected.killFX,
        chars: selected.chars,
      },
    });
  };

  const Tab = ({ id, label, count }) => (
    <button onClick={() => { setTab(id); sfx.click(); }} className={`px-2 py-1 rounded font-heading text-[10px] border ${tab === id ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>
      {label} {count > 0 && <span className="text-accent">({count})</span>}
    </button>
  );

  const ItemRow = ({ id, name, selected, onClick, color }) => (
    <button onClick={onClick} className={`w-full text-left px-2 py-1.5 rounded border flex items-center justify-between ${selected ? 'border-accent bg-accent/10' : 'border-border bg-secondary/50'}`}>
      <span className="text-xs font-body text-foreground flex items-center gap-2">
        {color && <span className="w-3 h-3 rounded-full" style={{ background: color }} />}
        {name}
      </span>
      <span className={`text-[10px] ${selected ? 'text-accent' : 'text-muted-foreground'}`}>{selected ? '✓ Selected' : '+ Select'}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-accent rounded-xl p-5 w-[520px] max-w-[94%] max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent">{mode === 'trade' ? '🔄 TRADE' : '🎁 GIFT'} — {peerName}</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          {mode === 'trade'
            ? 'Select items to offer. Both players must accept. Ownership transfers permanently — no duplication.'
            : 'Select items to send. Gifting is one-way. Ownership transfers permanently.'}
        </p>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-3">
          <Tab id="tokens" label="◆ TOKENS" count={tokenAmount} />
          <Tab id="skins" label="🎨 SKINS" count={selected.skins.length} />
          <Tab id="accs" label="⚔ GEAR" count={selected.accessories.length} />
          <Tab id="fx" label="✨ KILL FX" count={selected.killFX.length} />
          <Tab id="chars" label="👤 CHARS" count={selected.chars.length} />
        </div>

        {/* Tab content */}
        <div className="max-h-48 overflow-y-auto bg-muted/20 rounded-lg p-2 mb-3">
          {tab === 'tokens' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">You have <span className="text-accent font-heading">{progress?.coins || 0}</span> tokens.</p>
              <input type="range" min={0} max={progress?.coins || 0} value={tokenAmount} onChange={e => setSelected({ ...selected, tokens: parseInt(e.target.value) })} className="w-full" />
              <p className="font-heading text-lg text-accent text-center">{tokenAmount} <GameIcon emoji="◆" size={14} /></p>
            </div>
          )}
          {tab === 'skins' && (
            <div className="flex flex-col gap-1">
              {(progress?.ownedSkins || []).map(id => {
                const sk = getSkin(id); if (!sk) return null;
                return <ItemRow key={id} id={id} name={sk.name} color={sk.color} selected={selected.skins.includes(id)} onClick={() => toggle('skins', id)} />;
              })}
              {(progress?.ownedSkins || []).length === 0 && <p className="text-xs text-muted-foreground italic">No skins owned.</p>}
            </div>
          )}
          {tab === 'accs' && (
            <div className="flex flex-col gap-1">
              {(progress?.ownedAccessories || []).map(id => {
                const a = getAccessory(id); if (!a) return null;
                return <ItemRow key={id} id={id} name={a.name} color={a.color} selected={selected.accessories.includes(id)} onClick={() => toggle('accessories', id)} />;
              })}
              {(progress?.ownedAccessories || []).length === 0 && <p className="text-xs text-muted-foreground italic">No accessories owned.</p>}
            </div>
          )}
          {tab === 'fx' && (
            <div className="flex flex-col gap-1">
              {(progress?.ownedKillFX || []).map(id => {
                const fx = getKillFX(id); if (!fx) return null;
                return <ItemRow key={id} id={id} name={fx.name} selected={selected.killFX.includes(id)} onClick={() => toggle('killFX', id)} />;
              })}
              {(progress?.ownedKillFX || []).length === 0 && <p className="text-xs text-muted-foreground italic">No kill FX owned.</p>}
            </div>
          )}
          {tab === 'chars' && (
            <div className="flex flex-col gap-1">
              {(progress?.unlockedIds || []).filter(id => ALL.find(c => c.id === id)).map(id => {
                const c = ALL.find(x => x.id === id);
                return <ItemRow key={id} id={id} name={c.name} color={c.color} selected={selected.chars.includes(id)} onClick={() => toggle('chars', id)} />;
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3">
          <p className="text-[10px] font-heading text-primary mb-1">{mode === 'trade' ? 'OFFERING:' : 'GIFTING:'}</p>
          {summary.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nothing selected yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {summary.map((s, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded font-heading">{s}</span>)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={confirm} disabled={summary.length === 0} className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded font-heading text-xs disabled:opacity-50">
            {mode === 'trade' ? 'SEND TRADE OFFER' : 'SEND GIFT'}
          </button>
          <button onClick={onClose} className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs">CANCEL</button>
        </div>
      </div>
    </div>
  );
}