import db from './localBackend';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { ALL_CHARS } from './allCharacters.js';
import { getCharNumber } from './characterNumber.js';
import { MAP_PLATFORMS } from './PlatformFighter.jsx';
import { music } from './music.js';
import { sfx } from './sfx.js';
import CustomRoomGame from './CustomRoomGame.jsx';
import CustomRoomSport from './CustomRoomSport.jsx';
import { useLANConnection } from './useLANConnection.js';
import CharStats from './CharStats.jsx';
import ElementSelect from './ElementSelect.jsx';
import { STAGE_LIST } from './stages.js';
import { getControlOptions } from './keybinds.js';
import GameIcon from "./GameIcon.jsx";

const ALL = ALL_CHARS; // all gens 1–5 available in custom rooms
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];
const STAGE_OPTIONS = STAGE_LIST.map(s => ({ name: s.name, platforms: MAP_PLATFORMS[s.id] || [] }));

const MODE_CONFIG = {
  fight:      { maxPlayers: 8, label: 'FIGHT',    stage: 'splitcity' },
  soccer:     { maxPlayers: 8, label: 'SOCCER',   stage: 'soccer' },
  volleyball: { maxPlayers: 6, label: 'VOLLEYBALL', stage: 'splitcity' },
  baseball:   { maxPlayers: 6, label: 'BASEBALL',   stage: 'splitcity' },
  banger:     { maxPlayers: 6, label: 'BANGER',    stage: 'splitcity' },
};

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = ''; for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function CustomRoomLobby({ onBack, onEnd, unlockedIds, favoriteId, equippedSkins = {}, equippedAccessories = {}, sfxVolume = 70, musicVolume = 50, settings = {}, customStages = [], charLevels = {}, equippedElements = {}, onEquipElement, mode = 'fight', customCharsData = {}, customNumberMap = {}, equippedEmotes = {} }) {
  const [me, setMe] = useState(null);
  const [phase, setPhase] = useState('browse'); // browse | lobby | connecting | game
  const [room, setRoom] = useState(null);
  const [browseRooms, setBrowseRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState(null);
  const [myChar, setMyChar] = useState(favoriteId || 'yellow');
  const [myElement, setMyElement] = useState(equippedElements?.[favoriteId || 'yellow'] || 'basic');
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);
  const [localScheme, setLocalScheme] = useState('p1');
  const lan = useLANConnection();
  const roomRef = useRef(null);
  roomRef.current = room;
  const unsubRef = useRef(null);
  const pollRef = useRef(null);
  const unlockedSet = new Set(unlockedIds || ['yellow']);
  const loadout = { equippedSkins, equippedAccessories };

  // Reset element to the equipped/basic one whenever the selected character changes
  useEffect(() => { setMyElement(equippedElements?.[myChar] || 'basic'); }, [myChar]);

  useEffect(() => {
    if (lan.status === 'connected' && phase === 'connecting') setPhase('game');
    if (lan.status === 'closed' && phase === 'game') setPhase('browse');
    if (lan.status === 'error' && phase === 'connecting') setPhase('lobby');
  }, [lan.status, phase]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu');
    db.auth.me().then(u => setMe(u)).catch(() => setMe(null));
    refreshBrowse();
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  const refreshBrowse = async () => {
    try {
      const rooms = await db.entities.CustomRoom.filter({ status: 'open' });
      const mc = MODE_CONFIG[mode] || MODE_CONFIG.fight;
      setBrowseRooms((rooms || []).filter(r => (r.settings?.mode || 'fight') === mode && (r.max_players || 8) > (r.players?.length || 0)));
    } catch {}
  };

  // Subscribe to room when we have one (not during game — game component handles its own sync)
  useEffect(() => {
    if (!room?.id || phase === 'game') return;
    const refresh = async () => {
      try {
        const r = await db.entities.CustomRoom.get(room.id);
        if (r) { setRoom(r); if (r.status === 'playing' && phase !== 'game' && phase !== 'connecting') { if (!lan.isHost) lan.joinRoom(r.room_code, me?.id, me?.full_name || 'Guest', myChar, myElement); setPhase('connecting'); } if (r.status === 'closed') { setError('Room closed.'); setPhase('browse'); } }
      } catch {}
    };
    refresh();
    try {
      unsubRef.current = db.entities.CustomRoom.subscribe((ev) => {
        if (!ev?.data || ev.data.id !== room.id) return;
        const r = ev.data;
        setRoom(r);
        if (r.status === 'playing' && phase !== 'game' && phase !== 'connecting') { if (!lan.isHost) lan.joinRoom(r.room_code, me?.id, me?.full_name || 'Guest', myChar, myElement); setPhase('connecting'); }
        if (r.status === 'closed') { setError('Room closed.'); setPhase('browse'); }
      });
    } catch {}
    pollRef.current = setInterval(refresh, 3000);
    return () => { if (unsubRef.current) unsubRef.current(); clearInterval(pollRef.current); };
    // eslint-disable-next-line
  }, [room?.id, phase]);

  const createRoom = async () => {
    if (!me) { setError('Not signed in.'); return; }
    setError(null);
    try {
      const code = genCode();
      const players = [{ slot: 0, char: myChar, is_bot: false, user_id: me.id, name: 'You', loadout }];
      const created = await db.entities.CustomRoom.create({
        room_code: code, status: 'open', host_user_id: me.id, host_char: myChar,
        players, max_players: (MODE_CONFIG[mode] || MODE_CONFIG.fight).maxPlayers,
        stage_name: STAGE_OPTIONS[0].name, stage_platforms: [], stage_spawn_points: [],
        guest_inputs: {}, game_state: {}, settings: { mode }, winner: 'none',
      });
      setRoom(created); setPhase('lobby');
    } catch (e) { setError('Could not create room.'); }
  };

  const joinByCode = async () => {
    if (!me) { setError('Not signed in.'); return; }
    setError(null);
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    try {
      const candidates = await db.entities.CustomRoom.filter({ room_code: code, status: 'open' });
      const r = (candidates || [])[0];
      if (!r) { setError('No open room with that code.'); return; }
      const players = Array.isArray(r.players) ? [...r.players] : [];
      if (players.length >= (r.max_players || 8)) { setError('Room is full.'); return; }
      const existing = players.findIndex(p => p.user_id === me.id);
      if (existing >= 0) {
        players[existing] = { ...players[existing], char: myChar, loadout };
      } else {
        players.push({ slot: players.length, char: myChar, is_bot: false, user_id: me.id, name: 'Guest', loadout });
      }
      await db.entities.CustomRoom.update(r.id, { players });
      const updated = await db.entities.CustomRoom.get(r.id);
      setRoom(updated); setPhase('lobby');
    } catch (e) { setError('Could not join room.'); }
  };

  const joinFromBrowse = async (r) => {
    if (!me) { setError('Not signed in.'); return; }
    const players = Array.isArray(r.players) ? [...r.players] : [];
    if (players.length >= (r.max_players || 8)) { setError('Room is full.'); return; }
    const existing = players.findIndex(p => p.user_id === me.id);
    if (existing >= 0) {
      players[existing] = { ...players[existing], char: myChar, loadout };
    } else {
      players.push({ slot: players.length, char: myChar, is_bot: false, user_id: me.id, name: 'Guest', loadout });
    }
    try {
      await db.entities.CustomRoom.update(r.id, { players });
      const updated = await db.entities.CustomRoom.get(r.id);
      setRoom(updated); setPhase('lobby');
    } catch { setError('Could not join room.'); }
  };

  const leaveRoom = async () => {
    if (roomRef.current) {
      const r = roomRef.current;
      const isHost = r.host_user_id === me?.id;
      if (isHost) {
        try { await db.entities.CustomRoom.update(r.id, { status: 'closed' }); } catch {}
      } else {
        const players = (Array.isArray(r.players) ? r.players : []).filter(p => p.user_id !== me?.id);
        try { await db.entities.CustomRoom.update(r.id, { players }); } catch {}
      }
    }
    setRoom(null); setPhase('browse'); refreshBrowse();
  };

  // ── Host lobby controls ──
  const addBot = async () => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const players = Array.isArray(r.players) ? [...r.players] : [];
    if (players.length >= (r.max_players || 8)) return;
    const pool = ALL;
    const botChar = pool[Math.floor(Math.random() * pool.length)].id;
    players.push({ slot: players.length, char: botChar, is_bot: true, difficulty: settings?.defaultCPUDifficulty || 'regular', user_id: null, name: `Bot ${players.length}`, loadout: {} });
    try { await db.entities.CustomRoom.update(r.id, { players }); } catch {}
  };

  const removePlayer = async (idx) => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const players = (Array.isArray(r.players) ? r.players : []).filter((_, i) => i !== idx);
    players.forEach((p, i) => { p.slot = i; });
    try { await db.entities.CustomRoom.update(r.id, { players }); } catch {}
  };

  const setBotDifficulty = async (idx, diff) => {
    const r = roomRef.current; if (!r) return;
    const players = Array.isArray(r.players) ? [...r.players] : [];
    if (players[idx]) { players[idx] = { ...players[idx], difficulty: diff }; }
    try { await db.entities.CustomRoom.update(r.id, { players }); } catch {}
  };

  const setBotChar = async (idx, charId) => {
    const r = roomRef.current; if (!r) return;
    const players = Array.isArray(r.players) ? [...r.players] : [];
    if (players[idx]) { players[idx] = { ...players[idx], char: charId }; }
    try { await db.entities.CustomRoom.update(r.id, { players }); } catch {}
  };

  const setStage = async (idx) => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    setSelectedStageIdx(idx);
    const stage = STAGE_OPTIONS[idx];
    try { await db.entities.CustomRoom.update(r.id, { stage_name: stage.name, stage_platforms: stage.platforms, stage_spawn_points: [] }); } catch {}
  };

  const setCustomStage = async (stageIdx) => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const stage = customStages[stageIdx];
    if (!stage) return;
    const platforms = stage.platforms || stage;
    const spawnPoints = stage.spawnPoints || [];
    try { await db.entities.CustomRoom.update(r.id, { stage_name: stage.name || 'Custom', stage_platforms: platforms, stage_spawn_points: spawnPoints }); } catch {}
  };

  const updateMyChar = async (charId) => {
    setMyChar(charId);
    const r = roomRef.current; if (!r || !me) return;
    const players = Array.isArray(r.players) ? [...r.players] : [];
    const idx = players.findIndex(p => p.user_id === me.id);
    if (idx >= 0) { players[idx] = { ...players[idx], char: charId, loadout }; try { await db.entities.CustomRoom.update(r.id, { players }); } catch {} }
  };

  const startGame = async () => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const players = Array.isArray(r.players) ? r.players : [];
    if (players.length < 2) { setError('Need at least 2 players/bots.'); return; }
    try {
      // Sport modes run locally (their engines don't support the CustomRoom sync layer)
      if (mode !== 'fight') {
        await db.entities.CustomRoom.update(r.id, { status: 'playing' });
        setPhase('game');
        return;
      }
      // Create WebRTC room first (for real-time game sync)
      await lan.createRoom(me.id, me.full_name || 'Host', 'custom', myChar, myElement, r.room_code);
      await db.entities.CustomRoom.update(r.id, { status: 'playing', guest_inputs: {}, game_state: {} });
      setPhase('connecting');
    } catch { setError('Could not start game.'); }
  };

  // ── Connecting phase ──
  if (phase === 'connecting') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md py-8">
        <h2 className="text-2xl font-heading text-accent">CONNECTING...</h2>
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Establishing peer connection...</p>
        {lan.error && <p className="text-sm text-destructive">{lan.error}</p>}
        <button onClick={() => { lan.closeConnection(); setPhase('lobby'); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> CANCEL</button>
      </div>
    );
  }

  // ── Game phase ──
  if (phase === 'game' && room) {
    const isHost = room.host_user_id === me?.id;
    if (mode !== 'fight') {
      return (
        <CustomRoomSport
          mode={mode} room={room} me={me}
          unlockedIds={unlockedIds} favoriteId={favoriteId}
          equippedSkins={equippedSkins} equippedAccessories={equippedAccessories}
          settings={settings} charLevels={charLevels} equippedElements={equippedElements} onEquipElement={onEquipElement}
          sfxVolume={sfxVolume} musicVolume={musicVolume}
          customCharsData={customCharsData} customNumberMap={customNumberMap}
          equippedEmotes={equippedEmotes}
          onEnd={() => { if (isHost) { try { db.entities.CustomRoom.update(room.id, { status: 'closed' }); } catch {} } onEnd?.(); setRoom(null); setPhase('browse'); refreshBrowse(); }}
        />
      );
    }
    return (
      <CustomRoomGame
        room={room} isHost={isHost} myUserId={me?.id}
        sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings} myElement={myElement}
        lanConnection={lan} lanRole={lan.isHost ? 'host' : 'guest'} localScheme={localScheme}
        equippedEmotes={equippedEmotes}
        onEnd={(res) => {
          if (isHost) { try { db.entities.CustomRoom.update(room.id, { status: 'closed' }); } catch {} }
          lan.closeConnection();
          onEnd?.(res); setRoom(null); setPhase('browse'); refreshBrowse();
        }}
      />
    );
  }

  // ── Lobby phase ──
  if (phase === 'lobby' && room) {
    const isHost = room.host_user_id === me?.id;
    const players = Array.isArray(room.players) ? room.players : [];
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-2xl font-heading text-accent tracking-wider">ROOM {room.room_code}</h2>
          <button onClick={leaveRoom} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> Leave</button>
        </div>

        {/* Room code display */}
        <div className="bg-card border-2 border-accent rounded-xl px-8 py-3 text-center">
          <p className="text-[10px] font-body text-muted-foreground">SHARE THIS CODE</p>
          <p className="text-3xl font-heading text-accent tracking-[0.3em]">{room.room_code}</p>
        </div>

        {/* Player slots */}
        <div className="w-full bg-card border border-border rounded-xl p-3">
          <p className="text-xs font-heading text-muted-foreground mb-2">PLAYERS ({players.length}/{room.max_players || 8})</p>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p, i) => {
              const cd = ALL.find(c => c.id === p.char) || ALL[0];
              const isMe = p.user_id === me?.id;
              return (
                <div key={i} className={`flex items-center gap-2 p-2 rounded border ${isMe ? 'border-accent bg-accent/10' : 'border-border'}`}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: cd.color, boxShadow: `0 0 6px ${cd.color}88` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading truncate">{isMe ? 'You' : p.name}{p.is_bot ? ' [Bot]' : ''}</p>
                    {isMe && !p.is_bot && (
                      <select value={p.char} onChange={e => updateMyChar(e.target.value)} className="text-[9px] bg-secondary text-secondary-foreground rounded px-1 border border-border">
                        {ALL.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                    {p.is_bot && isHost && (
                      <div className="flex gap-1 items-center">
                        <select value={p.char} onChange={e => setBotChar(i, e.target.value)} className="text-[9px] bg-secondary text-secondary-foreground rounded px-1 border border-border">
                          {ALL.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={p.difficulty || 'regular'} onChange={e => setBotDifficulty(i, e.target.value)} className="text-[9px] bg-secondary text-secondary-foreground rounded px-1 border border-border">
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button onClick={() => removePlayer(i)} className="text-[10px] text-destructive hover:opacity-70"><GameIcon emoji="✕" size={14} /></button>
                      </div>
                    )}
                    {!p.is_bot && !isMe && <p className="text-[9px] text-muted-foreground">{cd.name}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {isHost && players.length < (room.max_players || 8) && (
            <button onClick={addBot} className="mt-2 w-full py-2 bg-primary/30 border border-dashed border-primary rounded-lg font-heading text-xs text-primary hover:opacity-80">+ ADD BOT</button>
          )}
        </div>

        {/* Stage selection (host only) */}
        {isHost && (
          <div className="w-full bg-card border border-border rounded-xl p-3">
            <p className="text-xs font-heading text-muted-foreground mb-2">STAGE</p>
            <div className="flex gap-2 flex-wrap">
              {STAGE_OPTIONS.map((s, i) => (
                <button key={s.name} onClick={() => setStage(i)}
                  className={`px-3 py-2 rounded-lg font-heading text-xs ${selectedStageIdx === i && !room.stage_platforms?.length ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {s.name}
                </button>
              ))}
              {customStages.map((s, i) => (
                <button key={`custom-${i}`} onClick={() => setCustomStage(i)}
                  className={`px-3 py-2 rounded-lg font-heading text-xs ${room.stage_platforms?.length ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {s.name || `Custom ${i+1}`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-1">Current: {room.stage_name || 'Split City'}</p>
          </div>
        )}

        {/* Control scheme selector */}
        <div className="flex items-center gap-2 w-full flex-wrap">
          <span className="text-xs font-heading text-muted-foreground">YOUR CONTROLS:</span>
          {getControlOptions(settings).map(o => (
            <button key={o.id} onClick={() => setLocalScheme(o.id)} className={`px-3 py-2 rounded-lg font-heading text-xs ${localScheme === o.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{o.label.toUpperCase()}</button>
          ))}
          <span className="text-[10px] text-muted-foreground font-body">each device picks its own</span>
        </div>

        {/* My character picker (if in room) */}
        {players.find(p => p.user_id === me?.id) && (
          <div className="w-full">
            <p className="text-xs font-heading text-accent mb-1 text-center">YOUR FIGHTER</p>
            <CharStats char={ALL.find(c => c.id === myChar)} element={myElement} />
            <ElementSelect charId={myChar} currentElement={myElement} onSelect={setMyElement} charLevels={charLevels} label="YOUR ELEMENT" />
            <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded">
              {ALL.map(c => (
                <button key={c.id} onClick={() => updateMyChar(c.id)}
                  className={`flex flex-col items-center p-1 rounded border-2 ${myChar === c.id ? 'border-accent bg-accent/10' : 'border-border'}`}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 4px ${c.color}88` }} />
                  <span className="text-[6px] font-heading text-foreground mt-0.5">#{getCharNumber(c.id)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive font-body">{error}</p>}

        {isHost ? (
          <button onClick={startGame} disabled={players.length < 2}
            className="px-10 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
            START GAME ({players.length} fighters)
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-body">Waiting for host to start the game…</p>
          </div>
        )}
      </div>
    );
  }

  // ── Browse phase ──
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">CUSTOM ROOMS{(MODE_CONFIG[mode] || MODE_CONFIG.fight).label !== 'FIGHT' ? ` · ${(MODE_CONFIG[mode] || MODE_CONFIG.fight).label}` : ''}</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground font-body">Create a room or join with a code. Add bots, use custom stages, up to 8 fighters!</p>
      </div>

      {/* Create + Join */}
      <div className="flex gap-3 w-full max-w-md">
        <button onClick={createRoom} className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90 shadow-lg">CREATE ROOM</button>
        <div className="flex-1 flex gap-1">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))} placeholder="CODE"
            className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm border border-border text-center uppercase tracking-widest" />
          <button onClick={joinByCode} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-80">JOIN</button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      {/* Browse open rooms */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-heading text-muted-foreground">OPEN ROOMS</p>
          <button onClick={refreshBrowse} className="text-[10px] text-primary font-heading hover:opacity-70">REFRESH</button>
        </div>
        {browseRooms.length === 0 ? (
          <div className="text-center py-8 bg-card/50 border border-border rounded-xl">
            <p className="text-sm text-muted-foreground font-body">No open rooms. Create one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {browseRooms.map(r => {
              const players = Array.isArray(r.players) ? r.players : [];
              const numPlayers = players.length;
              const numBots = players.filter(p => p.is_bot).length;
              return (
                <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/20 border-2 border-accent rounded-lg px-3 py-1">
                      <span className="font-heading text-sm text-accent tracking-widest">{r.room_code}</span>
                    </div>
                    <div>
                      <p className="text-xs font-heading text-foreground">{r.stage_name || 'Split City'}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{numPlayers}/{r.max_players || 8} players{numBots > 0 ? ` (${numBots} bots)` : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => joinFromBrowse(r)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-xs hover:opacity-80">JOIN <GameIcon emoji="→" size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Character preview */}
      <div className="w-full max-w-md">
        <p className="text-xs font-heading text-accent mb-1 text-center">YOUR FIGHTER</p>
        <CharStats char={ALL.find(c => c.id === myChar)} element={myElement} />
        <ElementSelect charId={myChar} currentElement={myElement} onSelect={setMyElement} charLevels={charLevels} label="YOUR ELEMENT" />
        <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded">
          {ALL.filter(c => unlockedSet.has(c.id)).map(c => (
            <button key={c.id} onClick={() => setMyChar(c.id)}
              className={`flex flex-col items-center p-1 rounded border-2 ${myChar === c.id ? 'border-accent bg-accent/10' : 'border-border'}`}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 4px ${c.color}88` }} />
              <span className="text-[6px] font-heading text-foreground mt-0.5">#{getCharNumber(c.id)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}