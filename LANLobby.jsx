import db from q{./localBackend};


import React, { useState, useEffect } from 'react';

import { useLANConnection } from './useLANConnection.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getCharNumber } from './characterNumber.js';
import PlatformFighter from './PlatformFighter';
import SoccerFighter from './SoccerFighter';
import VolleyballGame from './VolleyballGame.jsx';
import BaseballGame from './BaseballGame.jsx';

import { sfx } from './sfx.js';
import { music } from './music.js';
import { STAGE_LIST } from './stages.js';
import { getControlOptions } from './keybinds.js';
import { withCustomChars } from './characterNumber.js';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';
import LANShapeshiftSelect from './LANShapeshiftSelect';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const charById = (id) => ALL.find(c => c.id === id);

export default function LANLobby({ onBack, onEnd, unlockedIds, favoriteId, equippedSkins = {}, equippedAccessories = {}, settings = {}, sfxVolume = 70, musicVolume = 50, equippedElements = {}, customCharsData = {}, customNumberMap = {}, onEquipElement, charLevels = {}, equippedShikigami = {}, ownedShikigami = [], ownedAccessories = [], onEquipAccessory, ownedCrossovers = [], equippedCrossovers = {}, onEquipCrossover }) {
  const [phase, setPhase] = useState('menu'); // menu | host_select | guest_enter | connecting | fighting
  const [myChar, setMyChar] = useState(favoriteId || unlockedIds?.[0] || 'yellow');
  const [myTeam, setMyTeam] = useState(null); // 3-char team for shapeshift
  const [opponentTeam, setOpponentTeam] = useState(null);
  const [teamSynced, setTeamSynced] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [gameMode, setGameMode] = useState('fight');
  const [fightMode, setFightMode] = useState('regular');
  const [stage, setStage] = useState('splitcity');
  const [localScheme, setLocalScheme] = useState('p1'); // p1=arrows / p2=wasd — each device picks its own
  const lan = useLANConnection();

  // ── Receive opponent's shapeshift team via data channel ──
  useEffect(() => {
    const unsub = lan.onMessage((msg) => {
      if (msg?.type === '__shapeshift_team' && msg.team) {
        setOpponentTeam(msg.team);
        setTeamSynced(true);
      }
    });
    return unsub;
  }, [lan]);

  // ── Send my shapeshift team to opponent after connection ──
  useEffect(() => {
    if (lan.status === 'connected' && myTeam && fightMode === 'shapeshift') {
      lan.sendMessage({ type: '__shapeshift_team', team: myTeam });
    }
  }, [lan.status, myTeam, fightMode, lan]);

  useEffect(() => {
    db.auth.me().then(u => {
      setUserId(u.id);
      setUserName(u.full_name || u.email || 'Player');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (lan.status === 'connected' && phase === 'connecting') setPhase('fighting');
    if (lan.status === 'closed' && phase === 'fighting') setPhase('menu');
    if (lan.status === 'error' && phase === 'connecting') setPhase('guest_enter');
  }, [lan.status, phase]);

  const handleCreateRoom = async (charOrTeam) => {
    if (!userId) return;
    const isShapeshift = fightMode === 'shapeshift';
    if (isShapeshift && Array.isArray(charOrTeam)) {
      setMyTeam(charOrTeam);
      setMyChar(charOrTeam[0]);
      await lan.createRoom(userId, userName, 'fight', charOrTeam[0], equippedElements?.[charOrTeam[0]] || 'basic');
    } else {
      const char = typeof charOrTeam === 'string' ? charOrTeam : myChar;
      if (typeof charOrTeam === 'string') setMyChar(charOrTeam);
      await lan.createRoom(userId, userName, gameMode === 'soccer' ? 'soccer' : 'fight', char, equippedElements?.[char] || 'basic');
    }
    setPhase('connecting');
  };

  const handleJoinRoom = async (charOrTeam) => {
    if (!userId || joinCode.length < 4) return;
    const isShapeshift = fightMode === 'shapeshift';
    if (isShapeshift && Array.isArray(charOrTeam)) {
      setMyTeam(charOrTeam);
      setMyChar(charOrTeam[0]);
      await lan.joinRoom(joinCode.toUpperCase(), userId, userName, charOrTeam[0], equippedElements?.[charOrTeam[0]] || 'basic');
    } else {
      const char = typeof charOrTeam === 'string' ? charOrTeam : myChar;
      if (typeof charOrTeam === 'string') setMyChar(charOrTeam);
      await lan.joinRoom(joinCode.toUpperCase(), userId, userName, char, equippedElements?.[char] || 'basic');
    }
    setPhase('connecting');
  };

  const handleFightEnd = (result) => {
    lan.closeConnection();
    onEnd?.(result);
  };

  const ALL_WITH_CUSTOMS = withCustomChars(ALL, customCharsData, customNumberMap);
  const charGrid = unlockedIds?.length > 0 ? unlockedIds : ALL_WITH_CUSTOMS.map(c => c.id);

  // ── Fighting ──
  if (phase === 'fighting' && lan.opponentChar) {
    const _shapeshift = fightMode === 'shapeshift';
    // Shapeshift: wait for opponent's team to sync via data channel before starting
    if (_shapeshift && !teamSynced) {
      return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md py-8">
          <h2 className="text-2xl font-heading text-accent">SYNCING TEAMS...</h2>
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Waiting for opponent's Shapeshift team...</p>
          <button onClick={() => { lan.closeConnection(); setPhase('menu'); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> CANCEL</button>
        </div>
      );
    }
    const p1Char = lan.isHost ? myChar : lan.opponentChar;
    const p2Char = lan.isHost ? lan.opponentChar : myChar;
    const p1Element = lan.isHost ? (equippedElements?.[myChar] || 'basic') : (lan.opponentElement || 'basic');
    const p2Element = lan.isHost ? (lan.opponentElement || 'basic') : (equippedElements?.[myChar] || 'basic');
    const onQuitLan = () => { lan.closeConnection(); setPhase('menu'); };
    // Use synced 3-character teams (no auto-fill)
    const p1Team = _shapeshift ? (lan.isHost ? myTeam : opponentTeam) : null;
    const p2Team = _shapeshift ? (lan.isHost ? opponentTeam : myTeam) : null;
    if (gameMode === 'soccer') {
      return (
        <SoccerFighter
          p1Char={p1Char} p2Char={p2Char} p2IsCPU={false} p1IsCPU={false}
          cpuDifficulty="regular"
          musicVolume={musicVolume} sfxVolume={sfxVolume}
          equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
          p1Element={p1Element} p2Element={p2Element}
          settings={settings}
          localScheme={localScheme}
          lanConnection={lan} lanRole={lan.isHost ? 'host' : 'guest'}
          onEnd={handleFightEnd}
          customCharsData={customCharsData}
        />
      );
    }
    if (gameMode === 'volleyball') {
      return (
        <VolleyballGame
          p1Chars={[p1Char]} p2Chars={[p2Char]} p2IsCPU={false} difficulty="regular"
          p1Jersey p2Jersey
          musicVolume={musicVolume} sfxVolume={sfxVolume}
          equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
          p1Elements={[p1Element]} p2Elements={[p2Element]}
          settings={settings}
          lanConnection={lan} lanRole={lan.isHost ? 'host' : 'guest'}
          onResult={handleFightEnd} onQuit={onQuitLan}
          localScheme={localScheme}
          customCharsData={customCharsData}
        />
      );
    }
    if (gameMode === 'baseball') {
      return (
        <BaseballGame
          p1Chars={[p1Char, p1Char, p1Char]} p2Chars={[p2Char, p2Char, p2Char]} p2IsCPU={false} difficulty="regular"
          p1Jersey p2Jersey
          musicVolume={musicVolume} sfxVolume={sfxVolume}
          equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
          p1Elements={[p1Element, p1Element, p1Element]} p2Elements={[p2Element, p2Element, p2Element]}
          settings={settings}
          lanConnection={lan} lanRole={lan.isHost ? 'host' : 'guest'}
          onResult={handleFightEnd} onQuit={onQuitLan}
          localScheme={localScheme}
          customCharsData={customCharsData}
        />
      );
    }
    return (
      <PlatformFighter
        p1Char={p1Char} p2Char={p2Char} p2IsCPU={false}
        selectedMap={stage} cpuDifficulty="regular" gameMode={_shapeshift ? 'regular' : fightMode}
        onEnd={handleFightEnd}
        musicVolume={musicVolume} sfxVolume={sfxVolume}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        p1Element={p1Element} p2Element={p2Element}
        settings={settings}
        lanConnection={lan} lanRole={lan.isHost ? 'host' : 'guest'}
        localScheme={localScheme}
        customCharsData={customCharsData}
        shapeshiftMode={_shapeshift}
        p1Team={p1Team}
        p2Team={p2Team}
      />
    );
  }

  // ── Connecting ──
  if (phase === 'connecting') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md py-8">
        <h2 className="text-2xl font-heading text-accent">{lan.isHost ? 'ROOM CREATED' : 'JOINING...'}</h2>
        {lan.isHost && lan.roomCode && (
          <div className="bg-card border border-accent rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground">ROOM CODE</p>
            <p className="text-4xl font-heading text-accent tracking-widest">{lan.roomCode}</p>
            <p className="text-[10px] text-muted-foreground mt-2">Share this code with your friend on the same WiFi</p>
          </div>
        )}
        {lan.error && <p className="text-sm text-destructive">{lan.error}</p>}
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Waiting for connection...</p>
        <button onClick={() => { lan.closeConnection(); setPhase('menu'); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> CANCEL</button>
      </div>
    );
  }

  // ── Character Select (host) ──
  if (phase === 'host_select') {
    if (fightMode === 'shapeshift') {
      return (
        <LANShapeshiftSelect
          title="PICK YOUR SHAPESHIFT TEAM"
          startLabel="CREATE ROOM →"
          unlockedIds={unlockedIds || ['yellow']}
          favoriteId={favoriteId}
          equippedSkins={equippedSkins}
          equippedAccessories={equippedAccessories}
          ownedAccessories={ownedAccessories}
          onEquipAccessory={onEquipAccessory}
          charLevels={charLevels}
          equippedElements={equippedElements}
          onEquipElement={onEquipElement}
          equippedShikigami={equippedShikigami}
          ownedShikigami={ownedShikigami}
          onStart={(team) => handleCreateRoom(team)}
          onBack={() => setPhase('menu')}
        />
      );
    }
    return (
      <UniversalCharacterSelect
        title="SELECT YOUR FIGHTER"
        startLabel="CREATE ROOM →"
        unlockedIds={unlockedIds || ['yellow']}
        favoriteId={favoriteId}
        customCharsData={customCharsData}
        equippedSkins={equippedSkins}
        equippedAccessories={equippedAccessories}
        ownedAccessories={ownedAccessories}
        onEquipAccessory={onEquipAccessory}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
        equippedShikigami={equippedShikigami}
        ownedShikigami={ownedShikigami}
        ownedCrossovers={ownedCrossovers}
        equippedCrossovers={equippedCrossovers}
        onEquipCrossover={onEquipCrossover}
        playerCount={1}
        onStart={(c1) => { setMyChar(c1); handleCreateRoom(c1); }}
        onBack={() => setPhase('menu')}
      />
    );
  }

  // ── Enter Code + Select (guest) ──
  if (phase === 'guest_enter') {
    if (fightMode === 'shapeshift') {
      return (
        <LANShapeshiftSelect
          title="PICK YOUR SHAPESHIFT TEAM"
          startLabel={joinCode.length >= 4 ? 'JOIN →' : 'ENTER CODE FIRST'}
          unlockedIds={unlockedIds || ['yellow']}
          favoriteId={favoriteId}
          equippedSkins={equippedSkins}
          equippedAccessories={equippedAccessories}
          ownedAccessories={ownedAccessories}
          onEquipAccessory={onEquipAccessory}
          charLevels={charLevels}
          equippedElements={equippedElements}
          onEquipElement={onEquipElement}
          equippedShikigami={equippedShikigami}
          ownedShikigami={ownedShikigami}
          onStart={(team) => handleJoinRoom(team)}
          onBack={() => setPhase('menu')}
        />
      );
    }
    return (
      <UniversalCharacterSelect
        title="JOIN ROOM"
        startLabel={joinCode.length >= 4 ? 'JOIN →' : 'ENTER CODE FIRST'}
        unlockedIds={unlockedIds || ['yellow']}
        favoriteId={favoriteId}
        customCharsData={customCharsData}
        equippedSkins={equippedSkins}
        equippedAccessories={equippedAccessories}
        ownedAccessories={ownedAccessories}
        onEquipAccessory={onEquipAccessory}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
        equippedShikigami={equippedShikigami}
        ownedShikigami={ownedShikigami}
        ownedCrossovers={ownedCrossovers}
        equippedCrossovers={equippedCrossovers}
        onEquipCrossover={onEquipCrossover}
        playerCount={1}
        onStart={(c1) => { setMyChar(c1); handleJoinRoom(c1); }}
        onBack={() => setPhase('menu')}
        extraControls={
          <div className="flex flex-col items-center gap-1 bg-card/60 border border-border rounded-lg p-2">
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ENTER ROOM CODE"
              className="px-3 py-2 bg-card border border-border rounded font-heading text-sm tracking-widest text-center uppercase" maxLength={6} />
            <p className="text-[8px] text-muted-foreground">Enter the 6-character code from your friend</p>
          </div>
        }
      />
    );
  }

  // ── Main Menu ──
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md py-8">
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">LAN PLAY</h2>
        <button onClick={onBack} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <p className="text-sm text-muted-foreground text-center">Play with a friend on the same WiFi network. One player creates a room, the other joins with the code.</p>
      <div className="grid grid-cols-2 gap-2 w-full">
        <button onClick={() => setGameMode('fight')} className={`px-4 py-3 rounded-lg font-heading text-sm ${gameMode === 'fight' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>FIGHT</button>
        <button onClick={() => setGameMode('soccer')} className={`px-4 py-3 rounded-lg font-heading text-sm ${gameMode === 'soccer' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>SOCCER</button>
        <button onClick={() => setGameMode('volleyball')} className={`px-4 py-3 rounded-lg font-heading text-sm ${gameMode === 'volleyball' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>VOLLEYBALL</button>
        <button onClick={() => setGameMode('baseball')} className={`px-4 py-3 rounded-lg font-heading text-sm ${gameMode === 'baseball' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>BASEBALL</button>
      </div>
      {gameMode === 'fight' && (
        <div className="flex flex-wrap gap-1.5 w-full items-center">
          <span className="text-xs font-heading text-muted-foreground">MODE:</span>
          {[
            { id: 'regular', label: 'Regular' },
            { id: 'time', label: 'Time' },
            { id: 'sudden', label: 'Sudden Death' },
            { id: 'coin', label: 'Coin' },
            { id: 'brawl', label: 'Brawl' },
            { id: 'lowgravity', label: 'Low Gravity' },
            { id: 'shapeshift', label: 'Shapeshift' },
          ].map(m => (
            <button key={m.id} onClick={() => setFightMode(m.id)} className={`px-2.5 py-1.5 rounded-lg font-heading text-[10px] ${fightMode === m.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}>{m.label.toUpperCase()}</button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 w-full flex-wrap">
        <span className="text-xs font-heading text-muted-foreground">YOUR CONTROLS:</span>
        {getControlOptions(settings).map(o => (
          <button key={o.id} onClick={() => setLocalScheme(o.id)} className={`px-3 py-2 rounded-lg font-heading text-xs ${localScheme === o.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{o.label.toUpperCase()}</button>
        ))}
        <span className="text-[10px] text-muted-foreground font-body">each device picks its own</span>
      </div>
      {gameMode === 'fight' && (
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs font-heading text-muted-foreground">STAGE:</span>
        <select value={stage} onChange={e => setStage(e.target.value)} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-xs">
          {STAGE_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      )}
      <button onClick={() => setPhase('host_select')} className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">CREATE ROOM</button>
      <button onClick={() => setPhase('guest_enter')} className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90">JOIN ROOM</button>
      <div className="bg-card border border-border rounded-lg p-3 w-full">
        <p className="text-xs font-heading text-accent mb-1">HOW IT WORKS</p>
        <p className="text-[10px] text-muted-foreground">1. Host creates a room and gets a 6-character code</p>
        <p className="text-[10px] text-muted-foreground">2. Guest enters the code to connect</p>
        <p className="text-[10px] text-muted-foreground">3. Both players select their fighters</p>
        <p className="text-[10px] text-muted-foreground">4. Fight! Each player uses their own chosen control scheme.</p>
      </div>
    </div>
  );
}