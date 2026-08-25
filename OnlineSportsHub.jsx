import React, { useEffect, useState } from 'react';
import GameIcon from './GameIcon.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import {
  ONLINE_SPORT_MODES,
  queueForOnlineSport,
  getOnlineSportMatch,
  getOnlineSportPlayers,
  subscribeToOnlineSport,
  heartbeatOnlineSport,
  leaveOnlineSport,
} from './sportsOnline.js';

export default function OnlineSportsHub({ onBack, unlockedIds, favoriteId, equippedElements = {}, equippedSkins = {}, equippedAccessories = {}, equippedShikigami = {}, onMatchReady }) {
  const [selected, setSelected] = useState(null);
  const [queue, setQueue] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queue?.match?.id) return;
    const refresh = async () => {
      try {
        const [match, joined] = await Promise.all([getOnlineSportMatch(queue.match.id), getOnlineSportPlayers(queue.match.id)]);
        if (match) setQueue(prev => ({ ...prev, match }));
        setPlayers(joined);
        if (match?.status === 'matched') onMatchReady?.({ ...queue, match, players: joined });
      } catch (e) { setError(e.message); }
    };
    refresh();
    const off = subscribeToOnlineSport(queue.match.id, refresh);
    const timer = setInterval(() => heartbeatOnlineSport(queue.match.id).catch(() => {}), 5000);
    return () => { off(); clearInterval(timer); };
  }, [queue?.match?.id]);

  const cancel = async () => {
    try { await leaveOnlineSport(queue?.match?.id); } catch {}
    setQueue(null); setPlayers([]); setSelected(null);
  };

  const join = async characterId => {
    try {
      setError(null);
      const result = await queueForOnlineSport({
        mode: selected.id,
        characterId,
        loadout: { element: equippedElements?.[characterId] || 'basic', equippedSkins, equippedAccessories, equippedShikigami },
      });
      setQueue(result);
    } catch (e) { setError(e.message || 'Could not join the online queue.'); }
  };

  if (queue) {
    const joined = players.length || 1;
    const waiting = Math.max(0, queue.requiredPlayers - joined);
    return <div className="flex flex-col items-center gap-5 w-full max-w-xl text-center">
      <h2 className="text-2xl font-heading text-accent">{selected.label}</h2>
      <div className="w-full rounded-xl border border-primary bg-card p-6 space-y-3">
        <p className="font-heading text-lg text-primary">{queue.match.status === 'matched' ? 'MATCH READY!' : 'SEARCHING FOR PLAYERS…'}</p>
        <p className="text-4xl font-heading text-accent">{joined} / {queue.requiredPlayers}</p>
        <p className="text-xs text-muted-foreground">{waiting ? `Waiting for ${waiting} more player${waiting === 1 ? '' : 's'}.` : 'Starting the synchronized match…'}</p>
        <div className="grid grid-cols-2 gap-2 text-xs font-body text-left">
          {players.map(player => <div key={player.user_id} className="rounded bg-secondary/50 px-2 py-1">TEAM {player.team} · {player.username || 'Player'} · {player.character_id}</div>)}
        </div>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <button onClick={cancel} className="px-5 py-2 rounded bg-secondary font-heading text-sm">CANCEL</button>
    </div>;
  }

  if (selected) {
    return <UniversalCharacterSelect
      title={`PICK A FIGHTER · ${selected.label}`}
      startLabel="JOIN QUEUE"
      unlockedIds={unlockedIds || ['yellow']}
      favoriteId={favoriteId}
      playerCount={1}
      equippedSkins={equippedSkins}
      equippedAccessories={equippedAccessories}
      equippedElements={equippedElements}
      onStart={join}
      onBack={() => setSelected(null)}
    />;
  }

  return <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
    <div className="flex justify-between items-center w-full"><h2 className="text-2xl font-heading text-accent">ONLINE SPORTS</h2><button onClick={onBack} className="px-4 py-2 bg-secondary rounded font-heading text-sm"><GameIcon emoji="←" size={14} /> SPORTS</button></div>
    <p className="text-xs text-muted-foreground text-center">Global queues start only when the required number of players joins.</p>
    {error && <p className="text-xs text-destructive">{error}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {ONLINE_SPORT_MODES.map(mode => <button key={mode.id} onClick={() => setSelected(mode)} className="text-left p-4 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/10 transition"><div className="font-heading text-primary">{mode.label}</div><div className="text-xs text-muted-foreground mt-1">{mode.description}</div></button>)}
    </div>
  </div>;
}
