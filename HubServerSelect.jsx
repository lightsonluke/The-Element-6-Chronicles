import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { music } from './music.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const HUB_ROOM_NAME = 'Community Hub';
const STALE_MS = 120000; // 2 min — same cutoff as CommunityHub

// HubServerSelect — lists active hub servers by scanning Presence records.
// A "server" is just a hub_server code. Players who set hub_server to that code
// are in that server. No CustomRoom entities needed.
export default function HubServerSelect({ onBack, onJoin }) {
  const [servers, setServers] = useState([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    music.play('menu');
    db.auth.me().then(u => setMe(u)).catch(() => {});
    const load = async () => {
      try {
        const all = await db.entities.Presence.filter({}, '-last_active', 200);
        const cutoff = Date.now() - STALE_MS;
        // Private servers are joinable only by an explicit code. Never reveal
        // their code/name/player count in the public browser.
        const active = (all || []).filter(p => p.hub_server && !String(p.hub_server).toUpperCase().startsWith('PRV-') && p.last_active && new Date(p.last_active).getTime() > cutoff);
        // Group by hub_server code
        const map = {};
        active.forEach(p => {
          if (!map[p.hub_server]) map[p.hub_server] = { code: p.hub_server, players: [], count: 0 };
          map[p.hub_server].players.push({ id: p.user_id, name: p.username, color: p.hub_color, charId: p.hub_char_id });
          map[p.hub_server].count++;
        });
        const list = Object.values(map).sort((a, b) => b.count - a.count);
        setServers(list);
      } catch {}
    };
    load();
    const t = setInterval(load, 4000);
    return () => { clearInterval(t); music.stop(); };
  }, []);

  const join = (srv) => { sfx.click(); onJoin?.(srv); };

  const joinByCode = () => {
    if (!code.trim()) return;
    const upper = code.trim().toUpperCase();
    // Create a pseudo-server object with the code — CommunityHub will use it as serverCode
    join({ room_code: upper, players: [], count: 0 });
  };

  const joinRandom = async () => {
    setBusy(true);
    try {
      const withSpace = servers.filter(s => s.count < 20);
      if (withSpace[0]) join(withSpace[0]);
      else join({ room_code: 'HUB-' + Math.random().toString(36).slice(2, 6).toUpperCase(), players: [], count: 0 });
    } catch { sfx.warning(); }
    setBusy(false);
  };

  const createServer = (isPrivate) => {
    const prefix = isPrivate ? 'PRV' : 'HUB';
    const c = prefix + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    join({ room_code: c, players: [], count: 0, settings: { private: isPrivate } });
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading text-accent tracking-wider"><GameIcon emoji="🌐" size={14} /> SELECT A COMMUNITY SERVER</h2>
        <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="flex gap-2 flex-wrap bg-card/60 border border-border rounded-xl p-3">
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="SERVER CODE" maxLength={12}
          className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm w-40 uppercase" />
        <button onClick={joinByCode} disabled={busy} className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">JOIN CODE</button>
        <button onClick={joinRandom} disabled={busy} className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-sm">RANDOM</button>
        <button onClick={() => createServer(false)} disabled={busy} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm">+ PUBLIC</button>
        <button onClick={() => createServer(true)} disabled={busy} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-sm">+ PRIVATE</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {servers.length === 0 && <p className="text-muted-foreground font-body text-sm p-4">No public servers right now. Create one, join a code, or choose Random!</p>}
        {servers.map(s => {
          const full = s.count >= 20;
          return (
            <div key={s.code} className={`text-left bg-card border border-border rounded-lg p-3 hover:border-accent transition ${full ? 'opacity-40' : ''}`}>
              <button onClick={() => !full && join(s)} disabled={full} className="w-full text-left">
                <div className="flex justify-between items-center">
                  <span className="font-heading text-sm text-foreground">SERVER {s.code}</span>
                  <span className={`text-xs font-heading ${full ? 'text-destructive' : 'text-accent'}`}>{s.count}/20</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {s.players.slice(0, 6).map((p, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border border-border" style={{ background: p.color || '#888' }} title={p.name} />
                  ))}
                  {s.players.length > 6 && <span className="text-[9px] text-muted-foreground">+{s.players.length - 6}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-1">Click to join</p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
