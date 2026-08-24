import db from './localBackend';

import React, { useState, useEffect, useRef } from 'react';

import { ALL_CHARS } from './allCharacters.js';
import { getCharNumber } from './characterNumber.js';
import ElementSelect from './ElementSelect.jsx';
import { sfx } from './sfx.js';
import GameIcon from './GameIcon.jsx';

// Ready-up phase for an online sports lobby.
// Both players pick a fighter + element and ready up. The match can only
// start once the team is full (host + guest present) AND both are ready.
export default function SportsLobbyReadyUp({ lobby, role, me, sport, favoriteId, unlockedIds = [], charLevels = {}, equippedElements = {}, onEquipElement, onMatchReady, onBack }) {
  const [live, setLive] = useState(lobby);
  const [myChar, setMyChar] = useState(role === 'host' ? (lobby.host_char || favoriteId || 'yellow') : (lobby.guest_char || favoriteId || 'yellow'));
  const [myElement, setMyElement] = useState(equippedElements?.[myChar] || 'basic');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);
  const pollRef = useRef(null);

  const isHost = role === 'host';
  const ALL = ALL_CHARS; // all gens 1–5 available

  // Live subscription to the lobby so both sides see ready state + char picks.
  useEffect(() => {
    const refresh = async () => {
      try {
        const r = await db.entities.SportsLobby.get(lobby.id);
        if (!r) return;
        setLive(r);
        if (r.status === 'playing' && r.match_settings?.matchId) onMatchReady?.(r.match_settings.matchId, r);
        if (r.status === 'closed') setError('Lobby closed.');
      } catch {}
    };
    refresh();
    try {
      unsubRef.current = db.entities.SportsLobby.subscribe((ev) => {
        if (!ev?.data || ev.data.id !== lobby.id) return;
        const r = ev.data;
        setLive(r);
        if (r.status === 'playing' && r.match_settings?.matchId) onMatchReady?.(r.match_settings.matchId, r);
        if (r.status === 'closed') setError('Lobby closed.');
      });
    } catch {}
    pollRef.current = setInterval(refresh, 2000);
    return () => { if (unsubRef.current) unsubRef.current(); clearInterval(pollRef.current); };
    // eslint-disable-next-line
  }, [lobby.id]);

  const guestPresent = !!live.guest_user_id;
  const hostReady = !!live.host_ready;
  const guestReady = !!live.guest_ready;
  const hostChar = live.host_char;
  const guestChar = live.guest_char;
  const bothReady = hostReady && guestReady && hostChar && guestChar && guestPresent;
  const canStart = isHost && bothReady && !starting;
  const myReady = isHost ? hostReady : guestReady;

  const updateMyChar = async (charId) => {
    setMyChar(charId);
    const el = equippedElements?.[charId] || 'basic';
    setMyElement(el);
    try {
      const patch = isHost
        ? { host_char: charId, host_element: el }
        : { guest_char: charId, guest_element: el };
      await db.entities.SportsLobby.update(lobby.id, patch);
    } catch {}
  };

  const setMyElementAndPersist = async (el) => {
    setMyElement(el);
    try {
      const patch = isHost ? { host_element: el } : { guest_element: el };
      await db.entities.SportsLobby.update(lobby.id, patch);
    } catch {}
  };

  const toggleReady = async () => {
    sfx.click();
    try {
      const patch = isHost ? { host_ready: !hostReady } : { guest_ready: !guestReady };
      await db.entities.SportsLobby.update(lobby.id, patch);
    } catch {}
  };

  const startMatch = async () => {
    if (!canStart) return;
    setStarting(true); setError(null);
    try {
      const match = await db.entities.OnlineMatch.create({
        status: 'playing', sport,
        host_user_id: live.host_user_id, host_username: live.host_username,
        guest_user_id: live.guest_user_id, guest_username: live.guest_username,
        host_char: live.host_char, guest_char: live.guest_char,
        host_state: {}, guest_state: {}, winner: 'none',
      });
      await db.entities.SportsLobby.update(lobby.id, {
        status: 'playing',
        match_settings: { ...(live.match_settings || {}), matchId: match.id },
      });
      onMatchReady?.(match.id, { ...live, status: 'playing' });
    } catch (e) {
      setError('Failed to start match');
      setStarting(false);
    }
  };

  const leaveLobby = async () => {
    try {
      if (isHost) {
        await db.entities.SportsLobby.update(lobby.id, { status: 'closed' });
      } else {
        await db.entities.SportsLobby.update(lobby.id, {
          guest_user_id: null, guest_username: null, guest_char: null, guest_element: null, guest_ready: false,
        });
      }
    } catch {}
    onBack?.();
  };

  const sportName = sport ? sport.toUpperCase() : 'SPORT';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between w-full">
        <button onClick={leaveLobby} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Leave</button>
        <h2 className="text-xl font-heading text-accent tracking-wider">{sportName} LOBBY · {live.room_code}</h2>
        <div className="w-20" />
      </div>

      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      {/* Player slots */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className={`bg-card border-2 rounded-xl p-3 ${isHost ? 'border-accent' : 'border-border'}`}>
          <p className="text-[10px] font-heading text-muted-foreground">HOST</p>
          <p className="font-heading text-sm text-foreground">{live.host_username || '—'}{isHost ? ' (You)' : ''}</p>
          <CharDot charId={live.host_char} />
          <div className="mt-1">
            <span className={`text-[9px] font-heading px-2 py-0.5 rounded ${hostReady ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{hostReady ? 'READY' : 'NOT READY'}</span>
          </div>
        </div>
        <div className={`bg-card border-2 rounded-xl p-3 ${!isHost ? 'border-accent' : 'border-border'}`}>
          <p className="text-[10px] font-heading text-muted-foreground">GUEST</p>
          {guestPresent ? (
            <>
              <p className="font-heading text-sm text-foreground">{live.guest_username || '—'}{!isHost ? ' (You)' : ''}</p>
              <CharDot charId={live.guest_char} />
              <div className="mt-1">
                <span className={`text-[9px] font-heading px-2 py-0.5 rounded ${guestReady ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{guestReady ? 'READY' : 'NOT READY'}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground font-body py-4">Waiting for opponent to join…</p>
          )}
        </div>
      </div>

      {/* My fighter + element pick */}
      <div className="w-full bg-card border border-border rounded-xl p-3">
        <p className="text-xs font-heading text-accent mb-1 text-center">YOUR FIGHTER</p>
        <ElementSelect charId={myChar} currentElement={myElement} onSelect={setMyElementAndPersist} charLevels={charLevels} label="YOUR ELEMENT" />
        <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto p-1 border border-border rounded mt-2">
          {ALL.map(c => (
            <button key={c.id} onClick={() => updateMyChar(c.id)}
              className={`flex flex-col items-center p-1 rounded border-2 ${myChar === c.id ? 'border-accent bg-accent/10' : 'border-border'}`}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 4px ${c.color}88` }} />
              <span className="text-[6px] font-heading text-foreground mt-0.5">#{getCharNumber(c.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 items-center">
        <button onClick={toggleReady} disabled={!myChar}
          className={`px-6 py-2 rounded-lg font-heading text-sm ${myReady ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'} hover:opacity-90 shadow-lg disabled:opacity-40`}>
          {myReady ? 'UNREADY' : 'READY UP'}
        </button>
        {isHost ? (
          <button onClick={startMatch} disabled={!canStart}
            className="px-8 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
            {starting ? 'STARTING…' : 'START MATCH'}
          </button>
        ) : (
          <p className="text-xs text-muted-foreground font-body">{bothReady ? 'Waiting for host to start…' : 'Ready up and wait for the host.'}</p>
        )}
      </div>
      {!guestPresent && <p className="text-[10px] text-muted-foreground font-body text-center">Match starts once both players join, pick a fighter, and ready up.</p>}
    </div>
  );
}

function CharDot({ charId }) {
  if (!charId) return <div className="w-6 h-6 rounded-full bg-muted mt-1" />;
  const c = ALL_CHARS.find(x => x.id === charId);
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c?.color || '#888', boxShadow: `0 0 4px ${c?.color || '#888'}88` }} />
      <span className="text-[9px] font-heading text-foreground">{c?.name || '—'} <span className="text-muted-foreground">#{getCharNumber(charId)}</span></span>
    </div>
  );
}