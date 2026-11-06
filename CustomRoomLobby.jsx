import db from './localBackend';
import { supabase } from './supabaseClient.js';
import { getClientRegion } from './hubRegion.js';

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
import { useLANConnection } from './useLANConnection.js';
import CharStats from './CharStats.jsx';
import ElementSelect from './ElementSelect.jsx';
import { STAGE_LIST } from './stages.js';
import { getControlOptions } from './keybinds.js';
import GameIcon from "./GameIcon.jsx";
import { getTitleById } from './profileTitles.js';

const ALL = ALL_CHARS; // all gens 1–5 available in custom rooms
const DIFFICULTIES = ['newcomer', 'beginner', 'easy', 'amateur', 'regular', 'pro', 'hard', 'insane', 'honored'];
const STAGE_OPTIONS = STAGE_LIST.map(s => ({ name: s.name, platforms: MAP_PLATFORMS[s.id] || [] }));

// Custom Room networking currently synchronizes the fight renderer only.
// Keep unsupported sports out of this room flow until their authoritative
// network adapters are implemented; launching a local copy on every device
// looked like a shared match while producing unrelated simulations.
const MODE_CONFIG = {
  fight: { maxPlayers: 8, label: 'FIGHT', stage: 'splitcity' },
};

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = ''; for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function CustomRoomLobby({ onBack, onEnd, partyId = null, partyRoomId = null, unlockedIds, favoriteId, equippedSkins = {}, equippedAccessories = {}, equippedMovementTrails = {}, sfxVolume = 70, musicVolume = 50, settings = {}, customStages = [], charLevels = {}, equippedElements = {}, onEquipElement, mode = 'fight', customCharsData = {}, customNumberMap = {}, equippedEmotes = {} }) {
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
  const skipAutoJoinRoomRef = useRef(null);
  const startInProgressRef = useRef(false);
  const unsubRef = useRef(null);
  const pollRef = useRef(null);
  const unlockedSet = new Set(unlockedIds || ['yellow']);
  const loadout = { equippedSkins, equippedAccessories, equippedMovementTrails };

  // Reset element to the equipped/basic one whenever the selected character changes
  useEffect(() => { setMyElement(equippedElements?.[myChar] || 'basic'); }, [myChar]);

  useEffect(() => {
    if (lan.status === 'connected' && phase === 'connecting') setPhase('game');
    if (lan.status === 'closed' && phase === 'game') { setError('The room connection closed. Reconnect to return to this match.'); setPhase('lobby'); }
    if (lan.status === 'error' && phase === 'connecting') setPhase('lobby');
  }, [lan.status, phase]);

  useEffect(() => {
    if (phase !== 'connecting' || lan.status !== 'joining') return undefined;
    const roomId=roomRef.current?.id;
    const timeout=setTimeout(()=>{
      if(roomId)skipAutoJoinRoomRef.current=roomId;
      setError('The room host did not complete the connection. You can retry from the lobby.');
      lan.closeConnection();
      setPhase('lobby');
    },20000);
    return()=>clearTimeout(timeout);
  },[phase,lan.status,lan.closeConnection]);

  useEffect(() => {
    let cancelled = false;
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu');

    const applyAuthUser = (user) => {
      if (cancelled) return;
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Player';
        setMe({
          ...user,
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || name,
          full_name: name,
          role: user.role || 'player',
        });
        return;
      }
      // Local/offline fallback only. A valid Supabase session always wins.
      db.auth.me().then(localUser => { if (!cancelled) setMe(localUser); }).catch(() => { if (!cancelled) setMe(null); });
    };

    supabase.auth.getUser()
      .then(({ data }) => applyAuthUser(data?.user || null))
      .catch(() => applyAuthUser(null));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyAuthUser(session?.user || null);
    });

    refreshBrowse();
    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe?.();
      music.stop();
    };
  }, [musicVolume, sfxVolume]);

  const toRoom = useCallback((raw, playerRows = [], profileRows = []) => {
    if (!raw) return null;
    const settingsRaw = raw.settings || {};
    const profileMap = Object.fromEntries((profileRows || []).map(p => [p.user_id, p.username]));
    const humans = (playerRows || []).map(p => ({
      slot: Number(p.player_slot || 1) - 1,
      char: p.loadout?.character_id || 'yellow',
      is_bot: false,
      user_id: p.user_id,
      name: profileMap[p.user_id] || p.username || 'Player',
      title: getTitleById(p.title)?.name || p.title || null,
      ready: p.ready === true,
      connected: typeof p.connected === 'boolean' ? p.connected : (!p.last_seen_at || Date.now() - new Date(p.last_seen_at).getTime() < 25_000),
      loadout: p.loadout || {},
    }));
    const bots = Array.isArray(settingsRaw.bots) ? settingsRaw.bots : [];
    const players = [...humans, ...bots].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
    return {
      id: raw.id,
      party_id: raw.party_id || null,
      room_code: raw.room_code,
      status: raw.status === 'waiting' ? 'open' : raw.status,
      host_user_id: raw.host_id,
      max_players: Number(settingsRaw.maxPlayers || 2),
      players,
      stage_name: settingsRaw.stageName || 'Split City',
      stage_platforms: settingsRaw.stagePlatforms || [],
      stage_spawn_points: settingsRaw.stageSpawnPoints || [],
      settings: settingsRaw,
      winner: raw.authoritative_state?.winner || 'none',
      region: raw.region || settingsRaw.region || getClientRegion(),
    };
  }, []);

  const fetchRoom = useCallback(async roomId => {
    const { data, error } = await supabase.rpc('element6_custom_room_snapshot', { p_room_id: roomId });
    if (error) throw error;
    if (!data?.room) return null;
    return toRoom(data.room, data.players || [], []);
  }, [toRoom]);

  const refreshBrowse = useCallback(async () => {
    try {
      const { data: rawRooms, error } = await supabase.from('online_custom_rooms').select('*').eq('status', 'waiting').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      const mc = MODE_CONFIG[mode] || MODE_CONFIG.fight;
      const region = getClientRegion();
      const rooms = (rawRooms || []).filter(r => !r.party_id && (r.settings?.mode || 'fight') === mode && (r.region || r.settings?.region || region) === region);
      const ids = rooms.map(r => r.id);
      if (!ids.length) { setBrowseRooms([]); return; }
      const { data: prs, error: playerError } = await supabase.from('online_custom_room_players').select('room_id,user_id,player_slot,loadout,ready,last_seen_at').in('room_id', ids);
      if (playerError) throw playerError;
      const profileIds = [...new Set((prs || []).map(p => p.user_id))];
      const { data: profiles } = profileIds.length ? await supabase.from('player_profiles').select('user_id,username').in('user_id', profileIds) : { data: [] };
      const byRoom = {};
      (prs || []).forEach(p => { (byRoom[p.room_id] ||= []).push(p); });
      const next = rooms.map(r => toRoom(r, (byRoom[r.id] || []).filter(p => !p.last_seen_at || Date.now() - new Date(p.last_seen_at).getTime() < 25_000), profiles || [])).filter(r => (r.players?.length || 0) < r.max_players);
      setBrowseRooms(next);
    } catch (e) { setError(e?.message || 'Could not load rooms.'); }
  }, [mode, toRoom]);

  useEffect(() => { if (me?.id) refreshBrowse(); }, [me?.id, refreshBrowse]);

  useEffect(() => {
    if (!MODE_CONFIG[mode] || !me?.id || !partyId || !partyRoomId) return undefined;
    let cancelled = false;
    const enterPartyRoom = async () => {
      try {
        const { error } = await supabase.rpc('element6_join_party_custom_room', { p_party_id: partyId, p_room_id: partyRoomId });
        if (error) throw error;
        const { error: loadoutError } = await supabase.rpc('update_element6_custom_room_player', {
          p_room_id: partyRoomId,
          p_character_id: myChar,
          p_loadout: { character_id: myChar, equippedSkins, equippedAccessories, equippedMovementTrails, equippedEmotes, element: myElement },
        });
        if (loadoutError) throw loadoutError;
        const joined = await fetchRoom(partyRoomId);
        if (!joined) throw new Error('The party room is no longer available.');
        if (cancelled) return;
        setError(null); setRoom(joined); setPhase('lobby');
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not enter the party room.');
      }
    };
    enterPartyRoom();
    return () => { cancelled = true; };
  }, [mode, me?.id, partyId, partyRoomId, myChar, myElement, equippedSkins, equippedAccessories, equippedMovementTrails, equippedEmotes, fetchRoom]);

  // Live lobby polling is intentionally backed by Supabase, not localStorage, so
  // a room made by a friend on another device is visible immediately.
  useEffect(() => {
    if (!room?.id || phase === 'game') return;
    let alive = true;
    const refresh = async () => {
      try {
        const r = await fetchRoom(room.id);
        if (!alive || !r) return;
        setRoom(r);
        if (r.status === 'playing' && phase !== 'game' && phase !== 'connecting' && lan.status === 'idle' && skipAutoJoinRoomRef.current !== r.id) {
          if (!lan.isHost && mode === 'fight') {
            setPhase('connecting');
            try { await lan.joinRoom(r.room_code, me?.id, me?.full_name || 'Guest', myChar, myElement); }
            catch (joinError) { setError(joinError?.message || 'Could not connect to the room host.'); setPhase('lobby'); }
          } else setPhase(mode === 'fight' ? 'connecting' : 'game');
        }
        if (r.status === 'cancelled' || r.status === 'finished') { setError('Room closed.'); setPhase('browse'); refreshBrowse(); }
      } catch (e) {
        if (alive && roomRef.current?.id === room.id) {
          setError(e?.message || 'Room state is temporarily unavailable. Reconnecting…');
        }
      }
    };
    refresh();
    const t = setInterval(refresh, 1200);
    return () => { alive = false; clearInterval(t); };
  }, [room?.id, phase, fetchRoom, lan.isHost, mode, me?.id, myChar, myElement, refreshBrowse]);

  useEffect(() => {
    if (!room?.id || phase === 'browse') return undefined;
    const roomId = room.id;
    let alive = true;
    const heartbeat = async () => {
      try {
        const { error } = await supabase.rpc('element6_heartbeat_custom_room', { p_room_id: roomId });
        if (error) throw error;
      } catch (e) {
        if (alive && roomRef.current?.id === roomId) setError(e?.message || 'Could not refresh room membership.');
      }
    };
    heartbeat();
    const timer = setInterval(heartbeat, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [room?.id, phase]);

  const createRoom = async () => {
    if (!me) { setError('Not signed in.'); return; }
    setError(null);
    try {
      const mc = MODE_CONFIG[mode] || MODE_CONFIG.fight;
      const { data, error } = await supabase.rpc('create_element6_custom_room', {
        p_settings: {
          mode,
          maxPlayers: mc.maxPlayers,
          region: getClientRegion(),
          characterId: myChar,
          stageName: STAGE_OPTIONS[0].name,
          stagePlatforms: STAGE_OPTIONS[0].platforms,
          stageSpawnPoints: [],
          bots: [],
          equippedSkins,
          equippedAccessories,
          element: myElement,
        }
      });
      if (error) throw error;
      const created = await fetchRoom(data.room_id);
      setRoom(created); setPhase('lobby');
    } catch (e) { setError(e?.message || 'Could not create room.'); }
  };

  const joinByCode = async () => {
    if (!me) { setError('Not signed in.'); return; }
    setError(null);
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    try {
      const { data, error } = await supabase.rpc('join_element6_custom_room', {
        p_room_code: code,
        p_loadout: { character_id: myChar, equippedSkins, equippedAccessories, equippedMovementTrails, element: myElement },
      });
      if (error) throw error;
      const joined = await fetchRoom(data.room_id);
      if (!joined) throw new Error('Room is no longer available.');
      setRoom(joined); setPhase('lobby');
    } catch (e) { setError(e?.message || 'No open room with that code.'); }
  };

  const joinFromBrowse = async (r) => {
    if (!me) { setError('Not signed in.'); return; }
    try {
      const { data, error } = await supabase.rpc('join_element6_custom_room', {
        p_room_code: r.room_code,
        p_loadout: { character_id: myChar, equippedSkins, equippedAccessories, equippedMovementTrails, element: myElement },
      });
      if (error) throw error;
      const joined = await fetchRoom(data.room_id);
      setRoom(joined); setPhase('lobby');
    } catch (e) { setError(e?.message || 'Could not join room.'); }
  };

  const updateRoomSettings = async patch => {
    const r = roomRef.current;
    if (!r || r.host_user_id !== me?.id) return;
    const next = { ...(r.settings || {}), ...patch };
    try {
      const { error } = await supabase.rpc('update_element6_custom_room_settings_v1', { p_room_id: r.id, p_settings: next });
      if (error) throw error;
      setRoom(prev => {
        if (!prev) return prev;
        const humans = (prev.players || []).filter(player => !player.is_bot).map(player => ({ ...player, ready: false }));
        const players = 'bots' in patch ? [...humans, ...(next.bots || [])] : (prev.players || []).map(player => player.is_bot ? player : { ...player, ready: false });
        return {
          ...prev,
          settings: next,
          players,
          ...('stageName' in patch ? { stage_name: next.stageName } : {}),
          ...('stagePlatforms' in patch ? { stage_platforms: next.stagePlatforms } : {}),
          ...('stageSpawnPoints' in patch ? { stage_spawn_points: next.stageSpawnPoints } : {}),
        };
      });
    } catch (e) { setError(e?.message || 'Could not update room.'); }
  };

  const leaveRoom = async () => {
    if (roomRef.current?.id) { try { await supabase.rpc('leave_element6_custom_room', { p_room_id: roomRef.current.id }); } catch {} }
    try { lan.closeConnection(); } catch {}
    setRoom(null); setPhase('browse'); refreshBrowse();
  };

  const addBot = async () => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const bots = Array.isArray(r.settings?.bots) ? [...r.settings.bots] : [];
    if ((r.players?.length || 0) >= (r.max_players || 8)) return;
    const pool = ALL; const botChar = pool[Math.floor(Math.random() * pool.length)].id;
    const usedSlots = new Set((r.players || []).map(player => Number(player.slot)));
    const freeSlot = Array.from({ length: r.max_players || 8 }, (_, slot) => slot).find(slot => !usedSlots.has(slot));
    if (freeSlot === undefined) return;
    const defaultDifficulty = DIFFICULTIES.includes(settings?.defaultCPUDifficulty) ? settings.defaultCPUDifficulty : 'regular';
    bots.push({ slot: freeSlot, char: botChar, is_bot: true, difficulty: defaultDifficulty, user_id: null, name: `Bot ${bots.length + 1}`, loadout: {} });
    await updateRoomSettings({ bots });
  };

  const botIndexForPlayer = idx => {
    const r = roomRef.current; const target = r?.players?.[idx];
    if (!target?.is_bot) return -1;
    return (r.settings?.bots || []).findIndex(b => Number(b.slot) === Number(target.slot));
  };

  const removePlayer = async idx => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const bi = botIndexForPlayer(idx); if (bi < 0) return;
    const bots = [...(r.settings?.bots || [])]; bots.splice(bi, 1);
    const occupied = new Set((r.players || []).filter(player => !player.is_bot).map(player => Number(player.slot)));
    let nextSlot = 0;
    bots.forEach(b => {
      while (occupied.has(nextSlot)) nextSlot++;
      b.slot = nextSlot;
      occupied.add(nextSlot++);
    });
    await updateRoomSettings({ bots });
  };

  const setBotDifficulty = async (idx, diff) => {
    const bi = botIndexForPlayer(idx); const bots = [...(roomRef.current?.settings?.bots || [])]; if (bi < 0 || !bots[bi]) return;
    bots[bi] = { ...bots[bi], difficulty: diff }; await updateRoomSettings({ bots });
  };

  const setBotChar = async (idx, charId) => {
    const bi = botIndexForPlayer(idx); const bots = [...(roomRef.current?.settings?.bots || [])]; if (bi < 0 || !bots[bi]) return;
    bots[bi] = { ...bots[bi], char: charId }; await updateRoomSettings({ bots });
  };

  const setStage = async idx => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    setSelectedStageIdx(idx);
    const stage = STAGE_OPTIONS[idx];
    await updateRoomSettings({ stageName: stage.name, stagePlatforms: stage.platforms, stageSpawnPoints: [] });
  };

  const setCustomStage = async stageIdx => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id) return;
    const stage = customStages[stageIdx]; if (!stage) return;
    await updateRoomSettings({ stageName: stage.name || 'Custom', stagePlatforms: stage.platforms || stage, stageSpawnPoints: stage.spawnPoints || [] });
  };

  const updateMyChar = async charId => {
    setMyChar(charId); setMyElement(equippedElements?.[charId] || 'basic');
    const r = roomRef.current; if (!r || !me) return;
    try { await supabase.rpc('update_element6_custom_room_player', { p_room_id: r.id, p_character_id: charId, p_loadout: { character_id: charId, equippedSkins, equippedAccessories, equippedMovementTrails, element: equippedElements?.[charId] || 'basic' } }); } catch (e) { setError(e?.message || 'Could not update fighter.'); }
  };

  const setPlayerReady = async ready => {
    const r = roomRef.current;
    if (!r || !me || r.status !== 'open') return;
    setError(null);
    try {
      const { error } = await supabase.rpc('set_element6_custom_room_ready', {
        p_room_id: r.id,
        p_ready: ready,
      });
      if (error) throw error;
      const refreshed = await fetchRoom(r.id);
      if (!refreshed) throw new Error('The room is no longer available.');
      setRoom(refreshed);
    } catch (e) {
      setError(e?.message || 'Could not update ready status.');
    }
  };

  const startGame = async () => {
    const r = roomRef.current; if (!r || r.host_user_id !== me?.id || startInProgressRef.current) return;
    const players = Array.isArray(r.players) ? r.players : [];
    const humans = players.filter(p => !p.is_bot);
    if (humans.length < 2) { setError('At least two human players are required.'); return; }
    if (humans.some(p => !p.ready)) { setError('Every human player must be ready before the host can start.'); return; }
    startInProgressRef.current=true;
    setError(null);
    try {
      // Create the signaling offer before marking the room active. If WebRTC
      // setup fails, the room remains in its lobby instead of stranding every
      // participant in a playing room with no host connection.
      if (mode === 'fight') await lan.createRoom(me.id, me.full_name || 'Host', 'custom', myChar, myElement, r.room_code);
      const started = await supabase.rpc('start_element6_custom_room', { p_room_id: r.id, p_settings: r.settings || {} });
      if (started.error) throw started.error;
      if (mode !== 'fight') { setPhase('game'); return; }
      setPhase('connecting');
    } catch (e) {
      const latest=await fetchRoom(r.id).catch(()=>null);
      if (latest?.status==='open') {
        try { await lan.closeConnection(); } catch {}
        setRoom(latest);setError(e?.message||'Could not start game.');
      } else if (latest?.status==='playing'&&mode==='fight') {
        // The server may have committed Start while the response was lost.
        // Reconcile with its state instead of asking players to start twice.
        setRoom(latest);setError('');setPhase(lan.status==='connected'?'game':'connecting');
      } else setError(e?.message||'Could not start game.');
    } finally { startInProgressRef.current=false; }
  };

  const finishMatch = async (roomId, result, host) => {
    try {
      if (host) {
        const { error } = await supabase.rpc('finish_element6_custom_room', { p_room_id: roomId, p_winner: result?.winner || 'draw' });
        if (error) throw error;
      }
      if (partyRoomId) {
        let refreshed = null;
        for (let attempt = 0; attempt < (host ? 1 : 20); attempt++) {
          refreshed = await fetchRoom(roomId);
          if (refreshed?.status === 'open') break;
          if (attempt < 19) await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (!refreshed || refreshed.status !== 'open') {
          setError('Waiting for the room host to save the result. Your party room is still active.');
          return;
        }
        setRoom(refreshed); setPhase('lobby');
        return;
      }
      onEnd?.(result);
      setRoom(null); setPhase('browse'); refreshBrowse();
    } catch (e) {
      setError(e?.message || 'Could not save the match result.');
    }
  };

  if (!MODE_CONFIG[mode]) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border border-border bg-card/90 p-6 text-center shadow-xl" role="alert">
        <GameIcon icon="game" size={36} />
        <h2 className="font-heading text-xl text-accent">CUSTOM ROOM MODE UNAVAILABLE</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This mode does not yet have a shared Custom Room network renderer. No match was started.
        </p>
        <button type="button" onClick={onBack} className="min-h-11 rounded-full bg-primary px-6 font-heading text-primary-foreground">
          BACK
        </button>
      </section>
    );
  }

  // ── Connecting phase ──
  if (phase === 'connecting') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md py-8">
        <h2 className="text-2xl font-heading text-accent">CONNECTING...</h2>
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Establishing peer connection...</p>
        {lan.error && <p className="text-sm text-destructive">{lan.error}</p>}
        <button onClick={() => { skipAutoJoinRoomRef.current = roomRef.current?.id || null; lan.closeConnection(); setPhase('lobby'); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon icon="info" size={14} /> CANCEL</button>
      </div>
    );
  }

  // ── Game phase ──
  if (phase === 'game' && room) {
    const isHost = room.host_user_id === me?.id;
    return (
      <CustomRoomGame
        room={room} isHost={isHost} myUserId={me?.id}
        sfxVolume={sfxVolume} musicVolume={musicVolume} settings={settings} myElement={myElement}
        lanConnection={lan} lanRole={lan.isHost ? 'host' : 'guest'} localScheme={localScheme}
        equippedEmotes={equippedEmotes}
        onEnd={async (res) => {
          lan.closeConnection();
          await finishMatch(room.id, res, isHost);
        }}
      />
    );
  }

  // ── Lobby phase ──
  if (phase === 'lobby' && room) {
    const isHost = room.host_user_id === me?.id;
    const players = Array.isArray(room.players) ? room.players : [];
    const humanPlayers = players.filter(player => !player.is_bot);
    const readyHumanCount = humanPlayers.filter(player => player.ready).length;
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
        <div className="flex justify-between items-center w-full">
          <div><h2 className="text-2xl font-heading text-accent tracking-wider">ROOM {room.room_code}</h2>{room.party_id&&<p className="mt-1 text-[10px] font-heading text-primary">PARTY LINKED ROOM</p>}</div>
          <button onClick={leaveRoom} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> Leave</button>
        </div>
        {room.status === 'playing' && !isHost && lan.status !== 'connected' && <div role="alert" className="w-full rounded-xl border border-primary/40 bg-primary/5 p-3 text-center text-xs">
          <p className="text-muted-foreground">The match is active, but this device is not connected to the host.</p>
          {error && <p className="mt-1 text-destructive">{error}</p>}
          <button type="button" onClick={async()=>{skipAutoJoinRoomRef.current=null;setError(null);setPhase('connecting');try{await lan.closeConnection();await lan.joinRoom(room.room_code,me?.id,me?.full_name||'Guest',myChar,myElement);}catch(e){setError(e?.message||'Could not reconnect to the room host.');setPhase('lobby');}}} className="mt-2 min-h-10 rounded-full bg-primary px-4 font-heading text-primary-foreground">RECONNECT</button>
        </div>}

        {/* Room code display */}
        <div className="bg-card border-2 border-accent rounded-xl px-8 py-3 text-center">
          <p className="text-[10px] font-body text-muted-foreground">SHARE THIS CODE</p>
          <p className="text-3xl font-heading text-accent tracking-[0.3em]">{room.room_code}</p>
        </div>

        {/* Player slots */}
        <div className="w-full bg-card border border-border rounded-xl p-3">
          <p className="text-xs font-heading text-muted-foreground mb-2">PLAYERS ({players.length}/{room.max_players || 8}) · {readyHumanCount}/{humanPlayers.length} HUMAN PLAYERS READY</p>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p, i) => {
              const cd = ALL.find(c => c.id === p.char) || ALL[0];
              const isMe = p.user_id === me?.id;
              return (
                <div key={i} className={`flex items-center gap-2 p-2 rounded border ${isMe ? 'border-accent bg-accent/10' : 'border-border'}`}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: cd.color, boxShadow: `0 0 6px ${cd.color}88` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading truncate">{isMe ? 'You' : p.name}{p.is_bot ? ' [Bot]' : ''}</p>
                    {!p.is_bot && p.title && <p className="max-w-full truncate text-[9px] text-primary" title={p.title}>{p.title}</p>}
                    {!p.is_bot && <p className={`text-[9px] font-heading ${p.ready ? 'text-emerald-400' : 'text-muted-foreground'}`}>{p.connected ? (p.ready ? 'READY' : 'NOT READY') : 'RECONNECTING'}</p>}
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
                        <button onClick={() => removePlayer(i)} className="text-[10px] text-destructive hover:opacity-70"><GameIcon icon="close" size={14} /></button>
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

        {players.some(p => p.user_id === me?.id) && (
          <button type="button" aria-pressed={!!players.find(p => p.user_id === me?.id)?.ready} onClick={() => setPlayerReady(!players.find(p => p.user_id === me?.id)?.ready)}
            className={`min-h-11 rounded-full px-6 font-heading ${players.find(p => p.user_id === me?.id)?.ready ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
            {players.find(p => p.user_id === me?.id)?.ready ? 'NOT READY' : 'READY'}
          </button>
        )}

        {isHost ? (
          <button onClick={startGame} disabled={humanPlayers.length < 2 || readyHumanCount !== humanPlayers.length}
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
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon icon="info" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground font-body">Create a room or join with a code. Add bots, use custom stages, up to 8 fighters!</p>
      </div>

      {/* Create + Join */}
      <div className="flex gap-3 w-full max-w-md">
        <button onClick={createRoom} className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90 shadow-lg">CREATE ROOM</button>
        <div className="flex-1 flex gap-1">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="CODE"
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
                  <button onClick={() => joinFromBrowse(r)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-xs hover:opacity-80">JOIN <GameIcon icon="arrowRight" size={14} /></button>
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
