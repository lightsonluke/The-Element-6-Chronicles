import db from './localBackend';


import React, { useState, useEffect, useRef, useCallback } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getCharNumber } from './characterNumber.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import RollbackOnlineFight from './RollbackOnlineFight.jsx';
import OnlineSoccerFight from './OnlineSoccerFight';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import ElementSelect from './ElementSelect';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

export default function OnlineLobby({ mode, onBack, onEnd, unlockedIds, favoriteId, equippedSkins = {}, equippedAccessories = {}, sfxVolume = 70, musicVolume = 50, settings = {}, botElo = 1000, onlineElo = 1000, charLevels = {}, equippedElements = {}, onEquipElement, equippedShikigami = {}, equippedEmotes = {}, ownedAccessories = [], ownedShikigami = [], onEquipAccessory }) {
  const [me, setMe] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [phase, setPhase] = useState('pick'); // pick | searching | matched | fight
  const [matchId, setMatchId] = useState(null);
  const [role, setRole] = useState('host');
  const [match, setMatch] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);
  const matchRef = useRef(null);
  matchRef.current = match;
  const pollRef = useRef(null);
  const notifiedRef = useRef(false);
  const hostedCreatedAtRef = useRef(0); // when I created a searching match (ms)

  const unlockedSet = new Set(unlockedIds || ['yellow']);
  const loadout = { equippedSkins, equippedAccessories, equippedShikigami, element: myElement };
  const myElo = mode === 'ranked' ? (onlineElo ?? 1000) : (botElo ?? 1000);

  useEffect(() => {
    music.setVolume(musicVolume);
    sfx.setVolume(sfxVolume);
    music.play('menu');
    db.auth.me().then(u => setMe(u)).catch(() => setMe(null));
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  // Sync myElement when equippedElements changes (e.g. user picks element on pedestal)
  useEffect(() => { setMyElement(equippedElements?.[myChar] || 'basic'); }, [equippedElements, myChar]);

  // Subscribe to the active match once we have a matchId.
  useEffect(() => {
    if (!matchId || phase === 'fight') return;
    let unsub = () => {};
    const refresh = async () => {
      try {
        const m = await db.entities.OnlineMatch.get(matchId);
        if (m) { setMatch(m); if (m.status === 'matched') beginCountdown(m); }
      } catch {}
    };
    refresh();
    try {
      unsub = db.entities.OnlineMatch.subscribe((ev) => {
        if (ev?.data?.id !== matchId) return;
        const m = ev.data;
        setMatch(m);
        if (m.status === 'matched') beginCountdown(m);
        if (m.status === 'finished' && phase !== 'fight') { setError('Opponent disconnected.'); setPhase('pick'); }
      });
    } catch {}
    pollRef.current = setInterval(refresh, 3000);
    return () => { unsub(); clearInterval(pollRef.current); };
    // eslint-disable-next-line
  }, [matchId, phase]);

  const beginCountdown = useCallback((m) => {
    setPhase(prev => prev === 'fight' ? prev : 'matched');
    if (!notifiedRef.current) { notifiedRef.current = true; sfx.coin(); }
  }, []);

  useEffect(() => {
    if (phase !== 'matched') return;
    setCountdown(3);
    let c = 3;
    const t = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) { clearInterval(t); setPhase('fight'); }
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Try to join an existing searching match. If `afterMs` is set, only join
  // matches created after that timestamp (used by the host-wait poll to break
  // the simultaneous-create deadlock: the older host joins the newer host).
  const tryJoinExisting = async (char, afterMs = 0) => {
    if (!me) return false;
    const candidates = await db.entities.OnlineMatch.filter({ status: 'searching', mode });
    const now = Date.now();
    const joinable = (candidates || [])
      .filter(c => !c.guest_user_id && c.host_user_id !== me.id && c.id !== matchRef.current?.id)
      .filter(c => {
        const created = c.created_date ? new Date(c.created_date).getTime() : 0;
        // skip stale matches (host likely gone) and, when hosting, only newer ones
        return (!c.created_date || now - created < 45000) && created > afterMs;
      })
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    for (const c of joinable) {
      try {
        await db.entities.OnlineMatch.update(c.id, { status: 'matched', guest_user_id: me.id, guest_char: char, guest_loadout: loadout, guest_elo: myElo });
        const verified = await db.entities.OnlineMatch.get(c.id);
        if (verified && verified.status === 'matched' && verified.guest_user_id === me.id) {
          // Close any match I was hosting so it doesn't linger
          if (matchRef.current?.id && matchRef.current.id !== c.id) {
            try { await db.entities.OnlineMatch.update(matchRef.current.id, { status: 'finished' }); } catch {}
          }
          setMatchId(c.id); setRole('guest'); setMatch(verified); setPhase('matched'); return true;
        }
      } catch {}
    }
    return false;
  };

  const findMatch = async (charId) => {
    if (!me) { setError('Not signed in.'); return; }
    const char = charId || myChar;
    if (charId) setMyChar(charId);
    setError(null);
    notifiedRef.current = false;
    setPhase('searching');
    try {
      // Clean up any of my own stale searching matches first
      try {
        const myStale = await db.entities.OnlineMatch.filter({ status: 'searching', mode, host_user_id: me.id });
        for (const s of (myStale || [])) { try { await db.entities.OnlineMatch.update(s.id, { status: 'finished' }); } catch {} }
      } catch {}

      const joined = await tryJoinExisting(char);
      if (joined) return;
      // No joinable match — host one and wait.
      const created = await db.entities.OnlineMatch.create({ status: 'searching', mode, host_user_id: me.id, host_char: char, host_loadout: loadout, host_elo: myElo, winner: 'none' });
      hostedCreatedAtRef.current = created.created_date ? new Date(created.created_date).getTime() : Date.now();
      setMatchId(created.id); setRole('host'); setMatch(created);
    } catch (e) { setError('Could not search for matches. Try again.'); setPhase('pick'); }
  };

  // While hosting a searching match, re-scan for newer matches to join. This
  // breaks the deadlock where two players both create matches at the same time
  // and neither finds the other: the older host joins the newer host's match.
  useEffect(() => {
    if (phase !== 'searching' || role !== 'host' || !matchId) return;
    const t = setInterval(async () => {
      if (document.hidden) return;
      const joined = await tryJoinExisting(myChar, hostedCreatedAtRef.current);
      if (joined) clearInterval(t);
    }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [phase, role, matchId, myChar]);

  const cancelSearch = async () => {
    if (matchId) { try { await db.entities.OnlineMatch.update(matchId, { status: 'finished' }); } catch {} }
    setMatchId(null); setMatch(null); setPhase('pick');
  };

  if (phase === 'fight' && match) {
    const oppChar = role === 'host' ? match.guest_char : match.host_char;
    const oppLoadout = role === 'host' ? (match.guest_loadout || {}) : (match.host_loadout || {});
    const FightComponent = mode === 'soccer' ? OnlineSoccerFight : RollbackOnlineFight;
    return (
      <FightComponent
        matchId={matchId} playerId={me?.id} role={role} mode={mode}
        myChar={myChar} oppChar={oppChar}
        myLoadout={loadout} oppLoadout={oppLoadout}
        myElo={role === 'host' ? (match.host_elo ?? myElo) : (match.guest_elo ?? myElo)}
        oppElo={role === 'host' ? (match.guest_elo ?? 1000) : (match.host_elo ?? 1000)}
        sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings}
        equippedEmotes={equippedEmotes}
        onEnd={(res) => {
          try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: res.won ? role : (role === 'host' ? 'guest' : 'host') }).catch(() => {}); } catch {}
          onEnd(res);
        }}
      />
    );
  }

  const modeLabel = mode === 'ranked' ? 'ONLINE RANKED' : mode === 'soccer' ? 'ONLINE SOCCER' : 'ONLINE UNRANKED';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">{modeLabel}</h2>
        <button onClick={() => { cancelSearch(); onBack(); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground font-body">Matchmaking finds other players online via</p>
        <p className="text-xs font-heading text-primary">element6game.db.app</p>
        <p className="text-[10px] text-muted-foreground font-body mt-1">or the installed desktop app. Skins & accessories carry over.</p>
      </div>

      {phase === 'pick' && (
        <>
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
          <UniversalCharacterSelect
            title="PICK YOUR FIGHTER"
            startLabel="🔍 FIND MATCH"
            unlockedIds={unlockedIds || ['yellow']}
            favoriteId={favoriteId}
            playerCount={1}
            banCustomChars
            equippedSkins={equippedSkins}
            equippedAccessories={equippedAccessories}
            ownedAccessories={ownedAccessories}
            onEquipAccessory={onEquipAccessory}
            charLevels={charLevels}
            equippedElements={equippedElements}
            onEquipElement={onEquipElement}
            equippedShikigami={equippedShikigami}
            ownedShikigami={ownedShikigami}
            onStart={(c1) => { setMyChar(c1); setMyElement(equippedElements?.[c1] || 'basic'); findMatch(c1); }}
            onBack={onBack}
          />
        </>
      )}

      {phase === 'searching' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-accent animate-pulse">SEARCHING FOR OPPONENT…</p>
          <p className="text-xs text-muted-foreground font-body">Waiting for another player to join the queue.</p>
          <button onClick={cancelSearch} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">CANCEL</button>
        </div>
      )}

      {phase === 'matched' && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="font-heading text-2xl text-primary">MATCH FOUND!</p>
          <p className="text-xs text-muted-foreground font-body">{role === 'host' ? match?.guest_char : match?.host_char} joined the arena.</p>
          <span className="text-7xl font-heading text-accent animate-pulse">{countdown > 0 ? countdown : 'GO'}</span>
        </div>
      )}
    </div>
  );
}
