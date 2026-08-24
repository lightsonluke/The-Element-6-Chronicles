import db from './localBackend';

import React, { useState, useEffect, useRef } from 'react';

import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Hub Server Browser — multiple independent Community Hub servers, join by
// code, browse public, random, create public/private, favorite & recent.
// Uses CustomRoom entity (already RLS open). Each server is isolated.
export default function HubServerBrowser({ username, charColor, charName, charId, onJoin, onLeft, onClose }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [joined, setJoined] = useState(null);
  const [err, setErr] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('el6_hub_favorites') || '[]'); } catch { return []; } });
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem('el6_hub_recent') || '[]'); } catch { return []; } });
  const subRef = useRef(null);

  useEffect(() => { db.auth.me().then(u => setUserId(u.id)).catch(() => {}); }, []);

  const refresh = async () => {
    setLoading(true); setErr('');
    try {
      const list = await db.entities.CustomRoom.filter({ status: 'open' }, '-created_date', 40);
      setRooms((list || []).filter(r => r.settings?.mode === 'hub' || (r.settings && r.settings.mode === undefined)));
    } catch { setErr('Could not load servers.'); }
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const makePlayer = () => ({ id: userId, name: username || charName, color: charColor, charId, x: 200, z: 0 });

  const joinRoom = async (r) => {
    setBusy(true); setErr('');
    try {
      const players = r.players || [];
      if (players.length >= (r.max_players || 15)) { setErr('Server is full.'); setBusy(false); return; }
      const next = [...players.filter(p => p.id !== userId), makePlayer()];
      const updated = await db.entities.CustomRoom.update(r.id, { players: next });
      setJoined(updated); onJoin?.(updated); remember(r); sub(r.id); sfx.click();
    } catch { setErr('Failed to join.'); }
    setBusy(false);
  };

  const create = async (isPrivate) => {
    setBusy(true); setErr('');
    try {
      const code = Math.random().toString(36).slice(2, 7).toUpperCase();
      const room = await db.entities.CustomRoom.create({
        room_code: code, status: 'open', host_user_id: userId, host_char: charName,
        stage_name: 'Community Hub', max_players: 15, players: [makePlayer()],
        settings: { mode: 'hub', private: !!isPrivate },
      });
      setJoined(room); onJoin?.(room); remember(room); sub(room.id); sfx.purchaseSuccess();
    } catch { setErr('Failed to create.'); }
    setBusy(false);
  };

  const joinByCode = async () => {
    if (!codeInput.trim()) return;
    setBusy(true); setErr('');
    try {
      const found = await db.entities.CustomRoom.filter({ room_code: codeInput.trim().toUpperCase(), status: 'open' });
      if (!found || !found.length) { setErr('No server with that code.'); setBusy(false); return; }
      await joinRoom(found[0]);
    } catch { setErr('Failed.'); }
    setBusy(false);
  };

  const randomJoin = async () => {
    setBusy(true);
    try {
      const pool = rooms.filter(r => !r.settings?.private);
      if (!pool.length) { await create(false); return; }
      const r = pool[Math.floor(Math.random() * pool.length)];
      await joinRoom(r);
    } catch {}
    setBusy(false);
  };

  const remember = (r) => {
    const rec = [{ id: r.id, code: r.room_code, name: r.stage_name }, ...recent.filter(x => x.id !== r.id)].slice(0, 6);
    setRecent(rec); try { localStorage.setItem('el6_hub_recent', JSON.stringify(rec)); } catch {}
  };
  const toggleFav = (r) => {
    const next = favorites.some(f => f.id === r.id) ? favorites.filter(f => f.id !== r.id) : [...favorites, { id: r.id, code: r.room_code, name: r.stage_name }];
    setFavorites(next); try { localStorage.setItem('el6_hub_favorites', JSON.stringify(next)); } catch {} sfx.click();
  };
  const sub = (id) => { if (subRef.current) subRef.current(); subRef.current = db.entities.CustomRoom.subscribe(ev => { if (ev.data?.id === id) setJoined(ev.data); }); };

  const leave = async () => {
    if (!joined) return;
    try {
      const next = (joined.players || []).filter(p => p.id !== userId);
      if (next.length === 0) await db.entities.CustomRoom.delete(joined.id);
      else await db.entities.CustomRoom.update(joined.id, { players: next });
    } catch {}
    if (subRef.current) { subRef.current(); subRef.current = null; }
    setJoined(null); onLeft?.(); sfx.click();
  };

  const deleteServer = async (r) => {
    try { await db.entities.CustomRoom.delete(r.id); sfx.warning(); refresh(); }
    catch { setErr('Could not delete server.'); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-[480px] max-w-[94%] max-h-[86vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon emoji="🌐" size={14} /> COMMUNITY SERVERS</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>

        {joined ? (
          <div>
            <div className="bg-primary/10 border border-primary/40 rounded-lg p-3 mb-3">
              <p className="font-heading text-sm text-primary">{joined.stage_name}</p>
              <p className="text-[10px] text-muted-foreground">Code: <span className="text-accent font-heading">{joined.room_code}</span> • {(joined.players || []).length}/{joined.max_players || 15}</p>
            </div>
            <button onClick={leave} className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded font-heading text-xs">Leave Server</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder="Enter server code" className="flex-1 bg-secondary text-secondary-foreground rounded px-2 py-1.5 text-xs font-heading" />
              <button onClick={joinByCode} disabled={busy} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs">JOIN</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => create(false)} disabled={busy} className="px-3 py-2 bg-primary text-primary-foreground rounded font-heading text-xs">+ Public</button>
              <button onClick={() => create(true)} disabled={busy} className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs">+ Private</button>
              <button onClick={randomJoin} disabled={busy} className="px-3 py-2 bg-accent/80 text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="🎲" size={14} /> Random</button>
            </div>
            {favorites.length > 0 && (
              <div>
                <p className="text-[10px] font-heading text-primary mb-1"><GameIcon emoji="★" size={14} /> FAVORITES</p>
                <div className="space-y-1">{favorites.map(f => <button key={f.id} onClick={() => rooms.find(r => r.id === f.id) && joinRoom(rooms.find(r => r.id === f.id))} className="w-full text-left bg-muted/30 rounded px-2 py-1.5 text-xs font-heading text-foreground">{f.name} <span className="text-accent">{f.code}</span></button>)}</div>
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <p className="text-[10px] font-heading text-muted-foreground mb-1"><GameIcon emoji="⏱" size={14} /> RECENT</p>
                <div className="flex flex-wrap gap-1">{recent.map(r => <span key={r.id} className="text-[10px] px-2 py-0.5 bg-muted/50 rounded text-muted-foreground">{r.code}</span>)}</div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-heading text-muted-foreground">PUBLIC SERVERS</p>
              <button onClick={refresh} className="text-[10px] text-accent"><GameIcon emoji="↻" size={14} /></button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {loading && <p className="text-[10px] text-muted-foreground">Loading…</p>}
              {!loading && rooms.length === 0 && <p className="text-[10px] text-muted-foreground italic">No open servers. Create one!</p>}
              {rooms.map(r => (
                <div key={r.id} className="bg-muted/30 border border-border rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <p className="font-heading text-xs text-foreground">{r.stage_name}</p>
                    <p className="text-[9px] text-muted-foreground">{r.room_code} • {(r.players || []).length}/{r.max_players} • {r.host_char || '?'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleFav(r)} className="text-xs text-accent"><GameIcon emoji="★" size={14} /></button>
                    {r.host_user_id === userId && <button onClick={() => deleteServer(r)} className="text-xs text-destructive" title="Delete server"><GameIcon emoji="🗑" size={14} /></button>}
                    <button onClick={() => joinRoom(r)} disabled={busy} className="px-2.5 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px]">Join</button>
                  </div>
                </div>
              ))}
            </div>
            {err && <p className="text-[10px] text-destructive">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}