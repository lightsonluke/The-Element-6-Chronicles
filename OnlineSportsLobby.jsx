import db from './localBackend';

import React, { useState, useCallback } from 'react';

import SportsLobbyBrowser from './SportsLobbyBrowser.jsx';
import SportsLobbyReadyUp from './SportsLobbyReadyUp.jsx';
import OnlineSportsMatch from './OnlineSportsMatch.jsx';
import OnlineSoccerFight from './OnlineSoccerFight.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import DodgeballGame from './DodgeballGame.jsx';
import BangerGame from './BangerGame.jsx';
import { sfx } from './sfx.js';

// Maps sport id → game component (soccer uses its own OnlineSoccerFight)
const SPORT_COMPONENTS = {
  soccer: null,
  volleyball: VolleyballGame,
  dodgeball: DodgeballGame,
  banger: BangerGame,
};

/**
 * OnlineSportsLobby — orchestrates the online sports flow:
 * 1. SportsLobbyBrowser for matchmaking (create / join)
 * 2. SportsLobbyReadyUp — both players pick a fighter + element and ready up;
 *    the match only starts when the team is full (host + guest) and both ready.
 * 3. Once the match is ready, render the online game.
 */
export default function OnlineSportsLobby({ sport, me, onBack, onEnd, settings = {}, sfxVolume = 70, musicVolume = 50, unlockedIds = [], favoriteId, equippedSkins = {}, equippedAccessories = {}, charLevels = {}, equippedElements = {}, onEquipElement, customCharsData = {}, customNumberMap = {}, equippedShikigami = {}, equippedEmotes = {} }) {
  const [lobby, setLobby] = useState(null);
  const [role, setRole] = useState(null);
  const [matchId, setMatchId] = useState(null);

  const handleJoinLobby = useCallback((joinedLobby, joinedRole) => {
    setLobby(joinedLobby);
    setRole(joinedRole);
    sfx.click();
  }, []);

  const handleMatchReady = useCallback((id, readyLobby) => {
    if (readyLobby) setLobby(readyLobby);
    setMatchId(id);
    sfx.coin();
  }, []);

  const handleMatchEnd = useCallback((res) => {
    if (lobby) { try { db.entities.SportsLobby.update(lobby.id, { status: 'closed' }).catch(() => {}); } catch {} }
    onEnd?.(res);
  }, [lobby, onEnd]);

  const handleLeaveLobby = useCallback(() => {
    setLobby(null); setRole(null); setMatchId(null);
    onBack?.();
  }, [onBack]);

  // ── Render the online game once the match is ready ──
  if (matchId && role && lobby) {
    const gameProps = {
      p1Char: lobby.host_char || favoriteId || 'yellow',
      p2Char: lobby.guest_char || 'red',
      p1IsCPU: false, p2IsCPU: false,
      unlockedIds, equippedSkins, equippedAccessories, charLevels, equippedElements, onEquipElement, customCharsData, customNumberMap, equippedEmotes,
    };

    if (sport === 'soccer') {
      const myChar = role === 'host' ? (lobby.host_char || favoriteId || 'yellow') : (lobby.guest_char || favoriteId || 'yellow');
      const oppChar = role === 'host' ? (lobby.guest_char || 'red') : (lobby.host_char || 'red');
      const loadout = { equippedSkins, equippedAccessories, equippedShikigami };
      return (
        <OnlineSoccerFight
          matchId={matchId}
          role={role}
          myChar={myChar}
          oppChar={oppChar}
          myLoadout={loadout}
          oppLoadout={loadout}
          settings={settings}
          sfxVolume={sfxVolume}
          musicVolume={musicVolume}
          onEnd={handleMatchEnd}
          equippedEmotes={equippedEmotes}
        />
      );
    }

    const GameComp = SPORT_COMPONENTS[sport];
    if (!GameComp) {
      return <div className="text-center text-destructive p-4">Unsupported sport: {sport}</div>;
    }

    return (
      <OnlineSportsMatch
        matchId={matchId}
        role={role}
        sport={sport}
        GameComponent={GameComp}
        settings={settings}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        onEnd={handleMatchEnd}
        {...gameProps}
      />
    );
  }

  // ── Ready-up phase (character select + ready before match starts) ──
  if (lobby && role) {
    return (
      <SportsLobbyReadyUp
        lobby={lobby} role={role} me={me} sport={sport}
        favoriteId={favoriteId} unlockedIds={unlockedIds}
        charLevels={charLevels} equippedElements={equippedElements} onEquipElement={onEquipElement}
        onMatchReady={handleMatchReady} onBack={handleLeaveLobby}
      />
    );
  }

  // ── Browse / create lobbies ──
  return <SportsLobbyBrowser me={me} onJoinLobby={handleJoinLobby} onBack={onBack} />;
}