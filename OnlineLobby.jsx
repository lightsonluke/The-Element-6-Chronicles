import React, { useEffect, useState, useCallback, useRef } from 'react';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { getSignedInOnlinePlayer, matchmakeOnlineGame, getOnlineMatch, subscribeToOnlineMatch, heartbeatOnlineMatch, leaveOnlineMatch } from './rankedOnline.js';
import RollbackOnlineFight from './RollbackOnlineFight.jsx';
import OnlineSoccerFight from './OnlineSoccerFight.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import GameIcon from './GameIcon.jsx';

export default function OnlineLobby({ mode, onBack, onEnd, unlockedIds, favoriteId, equippedSkins = {}, equippedAccessories = {}, sfxVolume = 70, musicVolume = 50, settings = {}, botElo = 1000, onlineElo = 1000, charLevels = {}, equippedElements = {}, onEquipElement, equippedShikigami = {}, equippedEmotes = {}, ownedAccessories = [], ownedShikigami = [], onEquipAccessory }) {
  const [me, setMe] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [phase, setPhase] = useState('pick');
  const [matchId, setMatchId] = useState(null);
  const [role, setRole] = useState('host');
  const [match, setMatch] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);
  const heartbeatRef = useRef(null);
  const subscribedMatchRef = useRef(null);

  const myElo = mode === 'ranked' ? (onlineElo ?? 1000) : (botElo ?? 1000);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu');
    getSignedInOnlinePlayer().then(setMe).catch(() => setMe(null));
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => { setMyElement(equippedElements?.[myChar] || 'basic'); }, [equippedElements, myChar]);

  const beginCountdown = useCallback(() => {
    setPhase(prev => prev === 'fight' ? prev : 'matched');
    sfx.coin();
  }, []);

  useEffect(() => {
    if (!matchId || phase === 'fight') return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const m = await getOnlineMatch(matchId);
        if (!active || !m) return;
        setMatch(m);
        if (m.status === 'matched') beginCountdown();
        if (m.status === 'finished' || m.status === 'cancelled' || m.status === 'disputed') {
          if (phase !== 'fight') { setError('Match ended.'); setPhase('pick'); setMatchId(null); }
        }
      } catch (e) {
        if (active && !match) setError(e?.message || 'Could not read matchmaking state.');
      }
    };
    refresh();
    const off = subscribeToOnlineMatch(matchId, refresh);
    subscribedMatchRef.current = matchId;
    heartbeatRef.current = setInterval(() => heartbeatOnlineMatch(matchId).catch(() => {}), 5000);
    return () => {
      active = false;
      off?.();
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      if (subscribedMatchRef.current === matchId) subscribedMatchRef.current = null;
    };
  }, [matchId, phase, beginCountdown]);

  useEffect(() => {
    if (phase !== 'matched') return undefined;
    setCountdown(3);
    let c = 3;
    const t = setInterval(() => { c -= 1; setCountdown(c); if (c <= 0) { clearInterval(t); setPhase('fight'); } }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const findMatch = async (charId) => {
    if (!me) { setError('Not signed in.'); return; }
    const char = charId || myChar;
    if (charId) setMyChar(charId);
    setError(null); setPhase('searching');
    try {
      const loadout = {
        character_id: char,
        element: myElement,
        equippedSkins,
        equippedAccessories,
        equippedShikigami,
        username: me.user_metadata?.full_name || me.full_name || (me.email || 'Player').split('@')[0],
      };
      const result = await matchmakeOnlineGame({ mode, characterId: char, loadout });
      const m = result.match;
      if (!m?.id) throw new Error('Invalid matchmaking response.');
      setMatchId(m.id); setRole(result.role || 'host'); setMatch(m);
      if (m.status === 'matched') beginCountdown();
    } catch (e) {
      setError(e?.message || 'Could not search for matches.');
      setPhase('pick');
    }
  };

  const cancelSearch = async () => {
    if (matchId) { try { await leaveOnlineMatch(matchId); } catch {} }
    setMatchId(null); setMatch(null); setPhase('pick'); setError(null);
  };

  if (phase === 'fight' && match) {
    const oppChar = role === 'host' ? match.guest_char : match.host_char;
    const oppLoadout = role === 'host' ? (match.guest_loadout || {}) : (match.host_loadout || {});
    const FightComponent = mode === 'soccer' ? OnlineSoccerFight : RollbackOnlineFight;
    const opponentPlayerId = role === 'host' ? match.guest_user_id : match.host_user_id;
    return <FightComponent
      matchId={matchId}
      playerId={me?.id}
      opponentPlayerId={opponentPlayerId}
      role={role}
      mode={mode}
      myChar={myChar}
      oppChar={oppChar}
      myLoadout={{ equippedSkins, equippedAccessories, equippedShikigami, element: myElement }}
      oppLoadout={oppLoadout}
      myElo={role === 'host' ? (match.host_elo ?? myElo) : (match.guest_elo ?? myElo)}
      oppElo={role === 'host' ? (match.guest_elo ?? 1000) : (match.host_elo ?? 1000)}
      sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings}
      equippedEmotes={equippedEmotes}
      onEnd={onEnd}
    />;
  }

  const modeLabel = mode === 'ranked' ? 'ONLINE RANKED' : mode === 'soccer' ? 'ONLINE SOCCER' : 'ONLINE UNRANKED';
  return <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
    <div className="flex justify-between items-center w-full">
      <h2 className="text-2xl font-heading text-accent tracking-wider">{modeLabel}</h2>
      <button onClick={() => { cancelSearch(); onBack(); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
    </div>
    <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
      <p className="text-xs text-muted-foreground font-body">GLOBAL MATCHMAKING</p>
      {mode === 'ranked' && <p className="text-xs font-heading text-primary">SERVER RATING: {myElo}</p>}
      <p className="text-[10px] text-muted-foreground font-body mt-1">Two-player rollback · keyboard or controller</p>
    </div>
    {error && <p className="text-xs text-destructive font-body">{error}</p>}
    {phase === 'pick' && <UniversalCharacterSelect
      title="PICK YOUR FIGHTER" startLabel="🔍 FIND MATCH" unlockedIds={unlockedIds || ['yellow']} favoriteId={favoriteId} playerCount={1} banCustomChars
      equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} ownedAccessories={ownedAccessories} onEquipAccessory={onEquipAccessory}
      charLevels={charLevels} equippedElements={equippedElements} onEquipElement={onEquipElement} equippedShikigami={equippedShikigami} ownedShikigami={ownedShikigami}
      onStart={(c1) => { setMyChar(c1); setMyElement(equippedElements?.[c1] || 'basic'); findMatch(c1); }} onBack={onBack}
    />}
    {phase === 'searching' && <div className="flex flex-col items-center gap-4 py-12">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="font-heading text-lg text-accent animate-pulse">SEARCHING FOR OPPONENT…</p>
      <p className="text-xs text-muted-foreground font-body">Waiting for another player to join the global queue.</p>
      <button onClick={cancelSearch} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">CANCEL</button>
    </div>}
    {phase === 'matched' && <div className="flex flex-col items-center gap-3 py-12">
      <p className="font-heading text-2xl text-primary">MATCH FOUND!</p>
      <p className="text-xs text-muted-foreground font-body">Opponent joined the arena.</p>
      <span className="text-7xl font-heading text-accent animate-pulse">{countdown > 0 ? countdown : 'GO'}</span>
    </div>}
  </div>;
}
