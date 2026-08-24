import db from './localBackend';

import React, { useState, useEffect } from 'react';

import GameIcon from "./GameIcon.jsx";

// Shows all currently-online users across the game.
// Uses the Presence entity (user_id, username, last_active) and also
// scans all open Community Hub rooms for live players.
const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export default function OnlineUsersModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('hub'); // hub | presence

  const load = async () => {
    setLoading(true);
    try {
      // Gather players from all open hub rooms — cross-reference with Presence
      // to filter out stale entries (players who left without cleaning up).
      const [rooms, presRecords] = await Promise.all([
        db.entities.CustomRoom.filter({ status: 'open', stage_name: 'Community Hub' }, '-created_date', 40),
        db.entities.Presence.filter({}, '-last_active', 200).catch(() => []),
      ]);
      const now = Date.now();
      const presenceMap = {};
      (presRecords || []).forEach(p => {
        const la = new Date(p.last_active || 0).getTime();
        if ((now - la) < ONLINE_WINDOW_MS) presenceMap[p.user_id] = p.last_active;
      });

      const hubPlayers = [];
      (rooms || []).forEach(r => {
        (r.players || []).forEach(p => {
          // Only show players who have an active Presence record
          if (presenceMap[p.id]) {
            hubPlayers.push({ ...p, room: r.room_code, roomName: r.stage_name, last_active: presenceMap[p.id] });
          }
        });
      });

      const presenceUsers = Object.entries(presenceMap).map(([id, last_active]) => {
        const p = (presRecords || []).find(pr => pr.user_id === id);
        return { id, name: p?.username || 'Player', last_active };
      });

      setUsers({ hub: hubPlayers, presence: presenceUsers });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const list = tab === 'hub' ? (users.hub || []) : (users.presence || []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-[460px] max-w-[94%] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon emoji="👥" size={14} /> ONLINE USERS</h3>
          <div className="flex gap-2">
            <button onClick={load} className="text-[10px] text-accent"><GameIcon emoji="↻" size={14} /></button>
            <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setTab('hub')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'hub' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>IN HUB ({(users.hub || []).length})</button>
          <button onClick={() => setTab('presence')} className={`px-3 py-1 rounded font-heading text-[10px] ${tab === 'presence' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>ALL ACTIVE ({(users.presence || []).length})</button>
        </div>

        {loading ? (
          <p className="text-[10px] text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic">No users online right now.</p>
        ) : (
          <div className="space-y-1.5">
            {list.map((u, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-2 py-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: u.color || '#66dd66' }} />
                <span className="font-heading text-xs text-foreground flex-1">{u.name || u.username || 'Player'}</span>
                {u.room && <span className="text-[9px] text-muted-foreground font-heading"><GameIcon emoji="🏠" size={14} /> {u.room}</span>}
                {u.last_active && <span className="text-[9px] text-muted-foreground"><GameIcon emoji="⚡" size={14} /> active</span>}
              </div>
            ))}
          </div>
        )}
        <p className="text-[9px] text-muted-foreground mt-3">Auto-refreshes every 5 seconds.</p>
      </div>
    </div>
  );
}