import db from './localBackend';

import React, { useState, useEffect, useCallback } from 'react';

import { sfx } from './sfx.js';
import GameIcon from './GameIcon.jsx';

const SPORTS = [
  { id: 'soccer', name: 'Soccer', emoji: '⚽', color: '#44FF44' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', color: '#FF44FF' },
  { id: 'dodgeball', name: 'Dodgeball', emoji: '🟡', color: '#FFDD44' },
  { id: 'banger', name: 'Banger', emoji: '🔥', color: '#FF4444' },
];

export default function SportsLobbyBrowser({ me, onJoinLobby, onBack }) {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSport, setSelectedSport] = useState('soccer');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState(null);

  const fetchLobbies = useCallback(async () => {
    try {
      const open = await db.entities.SportsLobby.filter({ status: 'open' });
      setLobbies(open.filter(l => l.sport && SPORTS.some(s => s.id === l.sport)));
      setError(null);
    } catch (e) {
      setError('Failed to load lobbies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 5000);
    const unsub = db.entities.SportsLobby.subscribe(() => fetchLobbies());
    return () => { clearInterval(interval); unsub && unsub(); };
  }, [fetchLobbies]);

  const createLobby = async () => {
    if (!me) return;
    setCreating(true);
    setError(null);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const lobby = await db.entities.SportsLobby.create({
        sport: selectedSport,
        status: 'open',
        host_user_id: me.id,
        host_username: me.full_name || me.email?.split('@')[0] || 'Host',
        room_code: code,
        match_settings: {},
      });
      sfx.click();
      onJoinLobby?.(lobby, 'host');
    } catch (e) {
      setError('Failed to create lobby');
    } finally {
      setCreating(false);
    }
  };

  const joinByCode = async () => {
    if (!joinCode.trim()) return;
    setError(null);
    try {
      const matches = await db.entities.SportsLobby.filter({ room_code: joinCode.trim().toUpperCase(), status: 'open' });
      if (matches.length === 0) { setError('Lobby not found'); return; }
      const lobby = matches[0];
      await db.entities.SportsLobby.update(lobby.id, {
        guest_user_id: me.id,
        guest_username: me.full_name || me.email?.split('@')[0] || 'Guest',
      });
      sfx.click();
      onJoinLobby?.({ ...lobby, guest_user_id: me.id, guest_username: me.full_name }, 'guest');
    } catch (e) {
      setError('Failed to join lobby');
    }
  };

  const joinLobby = async (lobby) => {
    if (lobby.host_user_id === me.id) { onJoinLobby?.(lobby, 'host'); return; }
    setError(null);
    try {
      await db.entities.SportsLobby.update(lobby.id, {
        guest_user_id: me.id,
        guest_username: me.full_name || me.email?.split('@')[0] || 'Guest',
      });
      sfx.click();
      onJoinLobby?.({ ...lobby, guest_user_id: me.id, guest_username: me.full_name }, 'guest');
    } catch (e) {
      setError('Lobby is full or closed');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-3xl mx-auto p-3">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80">← Back</button>
        <h2 className="text-lg font-heading text-foreground">SPORTS LOBBIES</h2>
        <div className="w-16" />
      </div>

      {error && <div className="text-destructive text-xs font-body">{error}</div>}

      {/* Create lobby */}
      <div className="w-full bg-card border border-border rounded-lg p-3 flex flex-col gap-2">
        <span className="text-[10px] font-heading text-muted-foreground">CREATE LOBBY</span>
        <div className="flex gap-2 flex-wrap items-center">
          {SPORTS.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelectedSport(s.id); sfx.click(); }}
              className={`px-3 py-1.5 rounded font-heading text-[10px] border-2 transition ${
                selectedSport === s.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-secondary text-secondary-foreground hover:opacity-80'
              }`}
            >
              <GameIcon emoji={s.emoji} size={12} className="inline mr-1" />
              {s.name.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={createLobby}
          disabled={creating}
          className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-xs hover:opacity-80 disabled:opacity-50"
        >
          {creating ? 'CREATING…' : 'CREATE LOBBY'}
        </button>
      </div>

      {/* Join by code */}
      <div className="w-full bg-card border border-border rounded-lg p-3 flex gap-2 items-center">
        <input
          type="text"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          maxLength={6}
          className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs border border-border"
        />
        <button
          onClick={joinByCode}
          disabled={!joinCode.trim()}
          className="px-4 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs hover:opacity-80 disabled:opacity-50"
        >
          JOIN
        </button>
      </div>

      {/* Open lobbies list */}
      <div className="w-full flex flex-col gap-1.5">
        <span className="text-[10px] font-heading text-muted-foreground">OPEN LOBBIES {lobbies.length > 0 && `(${lobbies.length})`}</span>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-xs font-body">Loading…</div>
        ) : lobbies.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs font-body">No open lobbies. Create one!</div>
        ) : (
          lobbies.map(lobby => {
            const sport = SPORTS.find(s => s.id === lobby.sport) || SPORTS[0];
            return (
              <div
                key={lobby.id}
                className="flex items-center justify-between bg-card border border-border rounded-lg p-2.5 hover:border-primary/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <GameIcon emoji={sport.emoji} size={20} color={sport.color} />
                  <div className="flex flex-col">
                    <span className="font-heading text-xs text-foreground">{sport.name}</span>
                    <span className="text-[10px] font-body text-muted-foreground">
                      Host: {lobby.host_username || 'Unknown'} · Code: {lobby.room_code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => joinLobby(lobby)}
                  disabled={lobby.host_user_id === me?.id}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-[10px] hover:opacity-80 disabled:opacity-50"
                >
                  {lobby.host_user_id === me?.id ? 'YOUR LOBBY' : 'JOIN'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}