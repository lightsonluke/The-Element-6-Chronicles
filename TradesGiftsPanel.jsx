import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { sfx } from './sfx.js';
import { getAccessory } from './cosmetics.js';
import { getSkin } from './skins.js';
import { getKillFX } from './killFX.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Trades & Gifts panel — shows all trade requests, completions, gifts sent/received,
// plus a list of all players in the current server for quick trade/gift access.
export default function TradesGiftsPanel({ userId, username, progress, room, onTrade, onGift, onClose }) {
  const [tab, setTab] = useState('incoming'); // incoming | outgoing | players
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userId) return;
    try {
      const [incoming, outgoing] = await Promise.all([
        db.entities.TradeGift.filter({ to_user_id: userId }, '-created_date', 50),
        db.entities.TradeGift.filter({ from_user_id: userId }, '-created_date', 50),
      ]);
      setRecords({ incoming: incoming || [], outgoing: outgoing || [] });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [userId]);

  const acceptTrade = async (rec) => {
    try {
      // Fetch both players' progress
      const [myProgRec, theirProgRec] = await Promise.all([
        db.entities.UserProgress.filter({ user_id: userId }),
        db.entities.UserProgress.filter({ user_id: rec.from_user_id }),
      ]);
      const myProg = myProgRec[0] ? JSON.parse(myProgRec[0].progress_json || '{}') : {};
      const theirProg = theirProgRec[0] ? JSON.parse(theirProgRec[0].progress_json || '{}') : {};

      // Auto-delete duplicate items before applying trade
      myProg.ownedSkins = [...new Set(myProg.ownedSkins || [])];
      myProg.ownedAccessories = [...new Set(myProg.ownedAccessories || [])];
      myProg.ownedKillFX = [...new Set(myProg.ownedKillFX || [])];
      myProg.unlockedIds = [...new Set(myProg.unlockedIds || [])];
      theirProg.ownedSkins = [...new Set(theirProg.ownedSkins || [])];
      theirProg.ownedAccessories = [...new Set(theirProg.ownedAccessories || [])];
      theirProg.ownedKillFX = [...new Set(theirProg.ownedKillFX || [])];
      theirProg.unlockedIds = [...new Set(theirProg.unlockedIds || [])];
      // Remove offer items from sender, add to me (only items I don't already own — no duplicates)
      const give = rec.give || {};
      if (give.tokens > 0) theirProg.coins = Math.max(0, (theirProg.coins || 0) - give.tokens);
      myProg.coins = (myProg.coins || 0) + (give.tokens || 0);
      if (give.skins) myProg.ownedSkins = [...new Set([...(myProg.ownedSkins || []), ...give.skins])];
      if (give.accessories) myProg.ownedAccessories = [...new Set([...(myProg.ownedAccessories || []), ...give.accessories])];
      if (give.killFX) myProg.ownedKillFX = [...new Set([...(myProg.ownedKillFX || []), ...give.killFX])];
      if (give.chars) myProg.unlockedIds = [...new Set([...(myProg.unlockedIds || []), ...give.chars])];

      // Remove request items from me, add to sender
      const req = rec.request || {};
      if (req.tokens > 0) myProg.coins = Math.max(0, (myProg.coins || 0) - req.tokens);
      theirProg.coins = (theirProg.coins || 0) + (req.tokens || 0);
      if (req.skins) { myProg.ownedSkins = (myProg.ownedSkins || []).filter(s => !req.skins.includes(s)); theirProg.ownedSkins = [...new Set([...(theirProg.ownedSkins || []), ...req.skins])]; }
      if (req.accessories) { myProg.ownedAccessories = (myProg.ownedAccessories || []).filter(a => !req.accessories.includes(a)); theirProg.ownedAccessories = [...new Set([...(theirProg.ownedAccessories || []), ...req.accessories])]; }
      if (req.killFX) { myProg.ownedKillFX = (myProg.ownedKillFX || []).filter(f => !req.killFX.includes(f)); theirProg.ownedKillFX = [...new Set([...(theirProg.ownedKillFX || []), ...req.killFX])]; }
      if (req.chars) { myProg.unlockedIds = (myProg.unlockedIds || []).filter(c => !req.chars.includes(c)); theirProg.unlockedIds = [...new Set([...(theirProg.unlockedIds || []), ...req.chars])]; }

      // Save both
      const now = new Date().toISOString();
      if (myProgRec[0]) await db.entities.UserProgress.update(myProgRec[0].id, { progress_json: JSON.stringify({ ...myProg, _lastSavedAt: Date.now() }) });
      if (theirProgRec[0]) await db.entities.UserProgress.update(theirProgRec[0].id, { progress_json: JSON.stringify({ ...theirProg, _lastSavedAt: Date.now() }) });

      // Mark trade as completed
      await db.entities.TradeGift.update(rec.id, { status: 'completed', type: 'trade_completed' });
      sfx.purchaseSuccess();
      // Merge received items into localStorage so they persist without a full reload
      try {
        const raw = localStorage.getItem('element6_progress');
        if (raw) {
          const prog = JSON.parse(raw);
          if (give.tokens > 0) prog.coins = (prog.coins || 0) + give.tokens;
          if (give.skins) prog.ownedSkins = [...new Set([...(prog.ownedSkins || []), ...give.skins])];
          if (give.accessories) prog.ownedAccessories = [...new Set([...(prog.ownedAccessories || []), ...give.accessories])];
          if (give.killFX) prog.ownedKillFX = [...new Set([...(prog.ownedKillFX || []), ...give.killFX])];
          if (give.chars) prog.unlockedIds = [...new Set([...(prog.unlockedIds || []), ...give.chars])];
          if (req.tokens > 0) prog.coins = Math.max(0, (prog.coins || 0) - req.tokens);
          if (req.skins) prog.ownedSkins = (prog.ownedSkins || []).filter(s => !req.skins.includes(s));
          if (req.accessories) prog.ownedAccessories = (prog.ownedAccessories || []).filter(a => !req.accessories.includes(a));
          if (req.killFX) prog.ownedKillFX = (prog.ownedKillFX || []).filter(f => !req.killFX.includes(f));
          if (req.chars) prog.unlockedIds = (prog.unlockedIds || []).filter(c => !req.chars.includes(c));
          prog._lastSavedAt = Date.now();
          localStorage.setItem('element6_progress', JSON.stringify(prog));
        }
      } catch {}
      load();
    } catch (e) { sfx.warning(); }
  };

  const declineTrade = async (rec) => {
    try { await db.entities.TradeGift.update(rec.id, { status: 'declined' }); sfx.click(); load(); } catch {}
  };

  const summarize = (items) => {
    if (!items) return [];
    const s = [];
    if (items.tokens > 0) s.push(`${items.tokens} ◆ Tokens`);
    if (items.skins?.length) items.skins.forEach(id => { const sk = getSkin(id); s.push(`🎨 ${sk?.name || id}`); });
    if (items.accessories?.length) items.accessories.forEach(id => { const a = getAccessory(id); s.push(`⚔ ${a?.name || id}`); });
    if (items.killFX?.length) items.killFX.forEach(id => { const fx = getKillFX(id); s.push(`✨ ${fx?.name || id}`); });
    if (items.chars?.length) items.chars.forEach(id => { const c = ALL.find(x => x.id === id); s.push(`👤 ${c?.name || id}`); });
    return s;
  };

  const serverPlayers = (room?.players || []).filter(p => p.id !== userId);

  const RecordRow = ({ rec, isIncoming }) => (
    <div className="bg-muted/30 border border-border rounded-lg p-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[10px] text-accent">
          {rec.type === 'gift' ? '🎁 GIFT' : '🔄 TRADE'} {isIncoming ? 'FROM' : 'TO'} {isIncoming ? rec.from_username : rec.to_username}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-heading ${
          rec.status === 'completed' ? 'bg-green-600/30 text-green-400' :
          rec.status === 'declined' ? 'bg-red-600/30 text-red-400' :
          rec.status === 'pending' ? 'bg-yellow-600/30 text-yellow-400' : 'bg-muted text-muted-foreground'
        }`}>{rec.status.toUpperCase()}</span>
      </div>
      <div className="flex gap-2 text-[9px] font-body">
        <div className="flex-1">
          <p className="text-muted-foreground font-heading">{isIncoming ? 'YOU RECEIVE:' : 'YOU OFFER:'}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {summarize(rec.give).map((s, i) => <span key={i} className="px-1.5 py-0.5 bg-accent/20 text-accent rounded font-heading text-[9px]">{s}</span>)}
            {summarize(rec.give).length === 0 && <span className="text-muted-foreground">—</span>}
          </div>
        </div>
        {rec.request && (
          <div className="flex-1">
            <p className="text-muted-foreground font-heading">{isIncoming ? 'THEY WANT:' : 'YOU WANT:'}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {summarize(rec.request).map((s, i) => <span key={i} className="px-1.5 py-0.5 bg-primary/20 text-primary rounded font-heading text-[9px]">{s}</span>)}
              {summarize(rec.request).length === 0 && <span className="text-muted-foreground">—</span>}
            </div>
          </div>
        )}
      </div>
      {isIncoming && rec.status === 'pending' && rec.type === 'trade_request' && (
        <div className="flex gap-1.5">
          <button onClick={() => acceptTrade(rec)} className="flex-1 px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]"><GameIcon emoji="✓" size={14} /> ACCEPT</button>
          <button onClick={() => declineTrade(rec)} className="flex-1 px-2 py-1 bg-destructive text-destructive-foreground rounded font-heading text-[10px]"><GameIcon emoji="✕" size={14} /> DECLINE</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-xl p-5 w-[540px] max-w-[94%] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon emoji="📦" size={14} /> TRADES & GIFTS</h3>
          <div className="flex gap-2">
            <button onClick={load} className="text-[10px] text-accent"><GameIcon emoji="↻" size={14} /></button>
            <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setTab('incoming')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'incoming' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>INBOX ({(records.incoming || []).length})</button>
          <button onClick={() => setTab('outgoing')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'outgoing' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>SENT ({(records.outgoing || []).length})</button>
          <button onClick={() => setTab('players')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'players' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>PLAYERS ({serverPlayers.length})</button>
        </div>

        {loading ? (
          <p className="text-[10px] text-muted-foreground">Loading…</p>
        ) : tab === 'players' ? (
          serverPlayers.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic">No other players in this server right now.</p>
          ) : (
            <div className="space-y-1.5">
              {serverPlayers.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-2.5 py-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color || '#66dd66' }} />
                  <span className="font-heading text-xs text-foreground flex-1">{p.name || p.username || 'Player'}</span>
                  <button onClick={() => { onTrade?.({ ...p, id: p.id, username: p.name || p.username }); sfx.click(); }} className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[10px]"><GameIcon emoji="🔄" size={14} /> TRADE</button>
                  <button onClick={() => { onGift?.({ ...p, id: p.id, username: p.name || p.username }); sfx.click(); }} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]"><GameIcon emoji="🎁" size={14} /> GIFT</button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-1.5">
            {(tab === 'incoming' ? records.incoming : records.outgoing || []).length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">Nothing here yet.</p>
            ) : (
              (tab === 'incoming' ? records.incoming : records.outgoing).map(rec => <RecordRow key={rec.id} rec={rec} isIncoming={tab === 'incoming'} />)
            )}
          </div>
        )}
        <p className="text-[9px] text-muted-foreground mt-3">Auto-refreshes every 5 seconds. Trades require acceptance from both players. Gifts are instant.</p>
      </div>
    </div>
  );
}