import React, { useState, useEffect } from 'react';

import { supabase } from './supabaseClient.js';
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
export default function TradesGiftsPanel({ userId, username, progress, room, onTrade, onGift, onRefreshProgress, onClose }) {
  const [tab, setTab] = useState('incoming'); // incoming | outgoing | players
  const [records, setRecords] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!userId) return;
    try {
      const [incoming, outgoing] = await Promise.all([
        supabase.from('element6_trade_gifts').select('*').eq('to_user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('element6_trade_gifts').select('*').eq('from_user_id', userId).order('created_at', { ascending: false }).limit(50),
      ]);
      if (incoming.error) throw incoming.error;
      if (outgoing.error) throw outgoing.error;
      setRecords({ incoming: incoming.data || [], outgoing: outgoing.data || [] });
      setError('');
    } catch (e) { setError(e?.message || 'Could not load account transactions.'); }
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [userId]);

  const acceptTrade = async (rec) => {
    try {
      const rpc = rec.type === 'gift' ? 'element6_accept_gift' : 'element6_accept_trade';
      const args = rec.type === 'gift' ? { p_gift_id: rec.id, p_accept: true } : { p_trade_id: rec.id, p_accept: true };
      const { data: result, error: transactionError } = await supabase.rpc(rpc, args);
      if (transactionError) throw transactionError;
      if (result?.status !== 'completed') throw new Error(`This offer is ${result?.status || 'no longer pending'}.`);
      try { await onRefreshProgress?.(); } catch { setError('Transaction completed; account refresh failed. Reconnect to reload your inventory.'); }
      sfx.purchaseSuccess();
      load();
    } catch (e) { setError(e?.message || 'The transaction could not be completed. Inventory was not changed.'); sfx.warning(); }
  };

  const declineTrade = async (rec) => {
    try {
      const rpc = rec.type === 'gift' ? 'element6_accept_gift' : 'element6_accept_trade';
      const args = rec.type === 'gift' ? { p_gift_id: rec.id, p_accept: false } : { p_trade_id: rec.id, p_accept: false };
      const { error: transactionError } = await supabase.rpc(rpc, args);
      if (transactionError) throw transactionError;
      sfx.click(); load();
    } catch (e) { setError(e?.message || 'Could not reject the offer.'); }
  };

  const cancelTransfer = async (rec) => {
    try {
      const { error: cancelError } = await supabase.rpc('element6_cancel_transfer', { p_transaction_id: rec.id });
      if (cancelError) throw cancelError;
      sfx.click(); await load();
    } catch (e) { setError(e?.message || 'Could not cancel the offer.'); }
  };

  const summarize = (items) => {
    if (!items) return [];
    const s = [];
    if (items.tokens > 0) s.push(`${items.tokens} ◆ Tokens`);
    if (items.skins?.length) items.skins.forEach(id => { const sk = getSkin(id); s.push(` ${sk?.name || id}`); });
    if (items.accessories?.length) items.accessories.forEach(id => { const a = getAccessory(id); s.push(` ${a?.name || id}`); });
    if (items.killFX?.length) items.killFX.forEach(id => { const fx = getKillFX(id); s.push(` ${fx?.name || id}`); });
    if (items.chars?.length) items.chars.forEach(id => { const c = ALL.find(x => x.id === id); s.push(` ${c?.name || id}`); });
    return s;
  };

  const serverPlayers = (room?.players || []).filter(p => p.id !== userId);

  const RecordRow = ({ rec, isIncoming }) => (
    <div className="bg-muted/30 border border-border rounded-lg p-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[10px] text-accent">
          {rec.type === 'gift' ? ' GIFT' : ' TRADE'} {isIncoming ? 'FROM' : 'TO'} {isIncoming ? rec.from_username : rec.to_username}
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
      {isIncoming && rec.status === 'pending' && ['gift','trade_request'].includes(rec.type) && (
        <div className="flex gap-1.5">
          <button onClick={() => acceptTrade(rec)} className="flex-1 px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]"><GameIcon icon="check" size={14} /> ACCEPT</button>
          <button onClick={() => declineTrade(rec)} className="flex-1 px-2 py-1 bg-destructive text-destructive-foreground rounded font-heading text-[10px]"><GameIcon icon="close" size={14} /> DECLINE</button>
        </div>
      )}
      {!isIncoming && rec.status === 'pending' && <button onClick={() => cancelTransfer(rec)} className="self-end rounded-full border border-border px-3 py-1 text-[10px] font-heading">CANCEL OFFER</button>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-xl p-5 w-[540px] max-w-[94%] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon icon="package" size={14} /> TRADES & GIFTS</h3>
          <div className="flex gap-2">
            <button onClick={load} className="text-[10px] text-accent"><GameIcon icon="redo" size={14} /></button>
            <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon icon="close" size={14} /></button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setTab('incoming')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'incoming' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>INBOX ({(records.incoming || []).length})</button>
          <button onClick={() => setTab('outgoing')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'outgoing' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>SENT ({(records.outgoing || []).length})</button>
          <button onClick={() => setTab('players')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'players' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>PLAYERS ({serverPlayers.length})</button>
        </div>

        {error && <p role="alert" className="text-xs text-destructive mb-3">{error}</p>}

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
                  <button onClick={() => { onTrade?.({ ...p, id: p.id, username: p.name || p.username }); sfx.click(); }} className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[10px]"><GameIcon icon="refresh" size={14} /> TRADE</button>
                  <button onClick={() => { onGift?.({ ...p, id: p.id, username: p.name || p.username }); sfx.click(); }} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]"><GameIcon icon="gift" size={14} /> GIFT</button>
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
        <p className="text-[9px] text-muted-foreground mt-3">Auto-refreshes every 5 seconds. Gift and trade offers transfer only after recipient acceptance.</p>
      </div>
    </div>
  );
}
