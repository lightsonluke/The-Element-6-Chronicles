import React, { useCallback, useEffect, useRef, useState } from 'react';

import OnlineLobby from './OnlineLobby.jsx';
import RollbackOnlineFight from './RollbackOnlineFight.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import GameIcon from './GameIcon.jsx';
import { music } from './music.js';
import { sfx } from './sfx.js';
import {
  getMyRankedRating,
  getOnlineMatch,
  getSignedInOnlinePlayer,
  heartbeatOnlineMatch,
  leaveOnlineMatch,
  matchmakeOnlineGame,
  reportRankedMatchResult,
  subscribeToOnlineMatch,
  waitForRankedFinalization,
} from './rankedOnline.js';

export default function RankedOnlineLobby(props) {
  if (props.mode === 'soccer') return <OnlineLobby {...props} />;
  return <SupabaseFightLobby {...props} />;
}

function SupabaseFightLobby({
  mode,
  onBack,
  onEnd,
  onRatingChange,
  unlockedIds,
  favoriteId,
  equippedSkins = {},
  equippedAccessories = {},
  sfxVolume = 70,
  musicVolume = 50,
  settings = {},
  onlineElo = 1000,
  charLevels = {},
  equippedElements = {},
  onEquipElement,
  equippedShikigami = {},
  equippedEmotes = {},
  ownedAccessories = [],
  ownedShikigami = [],
  onEquipAccessory,
}) {
  const [me, setMe] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [myRating, setMyRating] = useState(onlineElo || 1000);
  const [phase, setPhase] = useState('pick');
  const [match, setMatch] = useState(null);
  const [role, setRole] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);
  const countdownStarted = useRef(false);

  const loadout = { equippedSkins, equippedAccessories, equippedShikigami, element: myElement };

  useEffect(() => {
    music.setVolume(musicVolume);
    sfx.setVolume(sfxVolume);
    music.play('menu');
    getSignedInOnlinePlayer().then(setMe).catch(() => setMe(null));
    if (mode === 'ranked') {
      getMyRankedRating().then(rating => {
        const value = rating?.rating ?? 1000;
        setMyRating(value);
        onRatingChange?.(value);
      }).catch(() => {});
    }
    return () => music.stop();
  }, [mode, musicVolume, sfxVolume]);

  useEffect(() => {
    setMyElement(equippedElements?.[myChar] || 'basic');
  }, [equippedElements, myChar]);

  const beginCountdown = useCallback(() => {
    if (countdownStarted.current) return;
    countdownStarted.current = true;
    setPhase('matched');
    setCountdown(3);
    sfx.coin();
  }, []);

  useEffect(() => {
    if (!match?.id || phase === 'fight') return;
    const applyMatch = next => {
      if (!next) return;
      setMatch(next);
      if (next.status === 'matched' || next.status === 'active') beginCountdown();
      if ((next.status === 'cancelled' || next.status === 'finished') && phase === 'searching') {
        setError('The other player left. Search again.');
        setPhase('pick');
      }
    };
    const unsubscribe = subscribeToOnlineMatch(match.id, applyMatch);
    const refresh = setInterval(() => getOnlineMatch(match.id).then(applyMatch).catch(() => {}), 2500);
    const heartbeat = setInterval(() => heartbeatOnlineMatch(match.id).catch(() => {}), 5000);
    return () => { unsubscribe(); clearInterval(refresh); clearInterval(heartbeat); };
  }, [match?.id, phase, beginCountdown]);

  useEffect(() => {
    if (phase !== 'matched') return;
    if (countdown <= 0) { setPhase('fight'); return; }
    const timer = setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const findMatch = async characterId => {
    if (!me) { setError('Log into an account before playing online.'); return; }
    setError(null);
    setMyChar(characterId);
    setPhase('searching');
    countdownStarted.current = false;
    try {
      const result = await matchmakeOnlineGame({ mode, characterId, loadout: { ...loadout, element: equippedElements?.[characterId] || myElement } });
      setRole(result.role);
      setMatch(result.match);
      if (result.match.status === 'matched') beginCountdown();
    } catch (matchError) {
      setError(matchError?.message || 'Could not search for a match. Run the ranked online SQL first.');
      setPhase('pick');
    }
  };

  const cancel = async () => {
    try { await leaveOnlineMatch(match?.id); } catch {}
    setMatch(null);
    setRole(null);
    setPhase('pick');
  };

  const finishFight = async result => {
    let serverRating = myRating;
    let ratingPending = false;
    if (result.forfeited) {
      try { await leaveOnlineMatch(match?.id); } catch {}
    } else if (mode === 'ranked' && result.opponentDisconnected) {
      try {
        await waitForRankedFinalization(match.id, 5000);
        const latest = await getMyRankedRating();
        serverRating = latest?.rating ?? myRating;
        setMyRating(serverRating);
        onRatingChange?.(serverRating);
      } catch { ratingPending = true; }
    } else if (mode === 'ranked' && result.winnerRole && Number.isInteger(result.finalFrame) && result.checksum) {
      try {
        const report = await reportRankedMatchResult({
          matchId: match.id,
          winnerRole: result.winnerRole,
          finalFrame: result.finalFrame,
          checksum: result.checksum,
        });
        if (!report?.finalized && !report?.disputed) await waitForRankedFinalization(match.id);
        if (report?.disputed) throw new Error('Result proofs did not match. Rating was not changed.');
        const latest = await getMyRankedRating();
        serverRating = latest?.rating ?? myRating;
        setMyRating(serverRating);
        onRatingChange?.(serverRating);
        ratingPending = !report?.finalized;
      } catch (reportError) {
        setError(reportError?.message || 'Ranked result is awaiting verification.');
        ratingPending = true;
      }
    }
    onEnd?.({ ...result, serverRating, ratingPending });
  };

  if (phase === 'fight' && match && role) {
    const opponentCharacter = role === 'host' ? match.guest_char : match.host_char;
    const opponentLoadout = role === 'host' ? (match.guest_loadout || {}) : (match.host_loadout || {});
    return (
      <RollbackOnlineFight
        matchId={match.id}
        playerId={me?.id}
        opponentPlayerId={role === 'host' ? match.guest_user_id : match.host_user_id}
        role={role}
        mode={mode}
        myChar={myChar}
        oppChar={opponentCharacter}
        myLoadout={loadout}
        oppLoadout={opponentLoadout}
        myElo={role === 'host' ? (match.host_elo ?? myRating) : (match.guest_elo ?? myRating)}
        oppElo={role === 'host' ? (match.guest_elo ?? 1000) : (match.host_elo ?? 1000)}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        settings={settings}
        equippedEmotes={equippedEmotes}
        onEnd={finishFight}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">{mode === 'ranked' ? 'ONLINE RANKED' : 'ONLINE UNRANKED'}</h2>
        <button onClick={() => { cancel(); onBack(); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
        <p className="text-xs font-heading text-primary">GLOBAL MATCHMAKING</p>
        {mode === 'ranked' && <p className="text-xs text-accent font-heading mt-1">SERVER RATING: {myRating}</p>}
        <p className="text-[10px] text-muted-foreground font-body mt-1">Two-player rollback · keyboard or controller</p>
      </div>
      {error && <p className="text-xs text-destructive font-body text-center">{error}</p>}

      {phase === 'pick' && (
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
          onStart={findMatch}
          onBack={onBack}
        />
      )}

      {phase === 'searching' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-accent animate-pulse">SEARCHING GLOBALLY…</p>
          <p className="text-xs text-muted-foreground font-body">Open the game with a different account to test matchmaking.</p>
          <button onClick={cancel} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">CANCEL</button>
        </div>
      )}

      {phase === 'matched' && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="font-heading text-2xl text-primary">MATCH FOUND!</p>
          <span className="text-7xl font-heading text-accent animate-pulse">{countdown > 0 ? countdown : 'GO'}</span>
        </div>
      )}
    </div>
  );
}
