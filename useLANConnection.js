import { supabase } from './supabaseClient.js';

import { useRef, useState, useEffect, useCallback } from 'react';

import { ConnectionState, SeqNum } from './netCore.js';

/**
 * WebRTC peer-to-peer connection hook for LAN/same-WiFi multiplayer.
 * Uses the LANRoom entity for signaling (SDP + ICE exchange), then a
 * data channel for real-time game sync.
 *
 * Now backed by netCore.js primitives:
 *  - ConnectionState: heartbeat tracking, 10s timeout, 15s reconnection window.
 *  - SeqNum: wraparound-safe tick on every message so stale/out-of-order
 *    packets are rejected instead of overwriting newer state.
 *
 * Extras:
 *  - Heartbeat + stall detection: `stalled`/`stalledRef` go true when no
 *    messages arrive for >1.2s while connected (both devices pause + resume).
 *  - Canvas streaming: host calls startStream(canvasEl, fps) to push JPEG
 *    frames to the peer; guest reads `frameUrl` to render the live host view.
 *  - Multi-listener onMessage: multiple consumers can subscribe to game messages.
 */
export function useLANConnection() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const pollRef = useRef(null);
  const listenersRef = useRef(new Set());
  const messageQueueRef = useRef([]);
  const roomIdRef = useRef(null);
  const lastRecvRef = useRef(Date.now());
  const streamRef = useRef(null);
  const tickRef = useRef(0);
  const lastMsgTickRef = useRef(-1);

  // netCore-backed connection state — 10s timeout, 15s reconnection window
  const connRef = useRef(new ConnectionState({
    timeout: 10000,
    reconnectWindow: 15000,
    onTimeout: () => { setStalled(true); stalledRef.current = true; },
    onReconnect: () => { setStalled(false); stalledRef.current = false; },
  }));

  const [status, setStatus] = useState('idle'); // idle | hosting | joining | connected | closed | error
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [opponentChar, setOpponentChar] = useState(null);
  const [opponentElement, setOpponentElement] = useState('basic');
  const [opponentName, setOpponentName] = useState(null);
  const [stalled, setStalled] = useState(false);
  const stalledRef = useRef(false);
  const [frameUrl, setFrameUrl] = useState(null);

  const sendRaw = useCallback((obj) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === 'open') {
      try { dc.send(JSON.stringify(obj)); } catch (_) { /* full buffer */ }
    }
  }, []);

  const sendMessage = useCallback((msg) => {
    const dc = dcRef.current;
    // Stamp every message with a monotonically increasing tick so the
    // receiver can reject stale/out-of-order packets via SeqNum.
    const stamped = { ...msg, _tick: ++tickRef.current };
    if (dc && dc.readyState === 'open') {
      try { dc.send(JSON.stringify(stamped)); } catch (_) { messageQueueRef.current.push(stamped); }
    } else {
      messageQueueRef.current.push(stamped);
    }
  }, []);

  const onMessage = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => { listenersRef.current.delete(cb); };
  }, []);

  const dispatch = useCallback((msg) => {
    listenersRef.current.forEach(cb => { try { cb(msg); } catch (_) { /* ignore */ } });
  }, []);

  const setupDataChannel = useCallback((dc) => {
    dcRef.current = dc;
    lastRecvRef.current = Date.now();
    connRef.current = new ConnectionState({
      timeout: 10000,
      reconnectWindow: 15000,
      onTimeout: () => { setStalled(true); stalledRef.current = true; },
      onReconnect: () => { setStalled(false); stalledRef.current = false; },
    });
    setStalled(false); stalledRef.current = false;
    dc.onopen = () => {
      setStatus('connected');
      while (messageQueueRef.current.length > 0) {
        try { dc.send(JSON.stringify(messageQueueRef.current.shift())); } catch (_) { break; }
      }
    };
    dc.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch (_) { return; }
      lastRecvRef.current = Date.now();
      connRef.current.heartbeat();
      if (msg && msg.type === '__ping') { sendRaw({ type: '__pong' }); return; }
      if (msg && msg.type === '__pong') return;
      if (msg && msg.type === '__frame') { setFrameUrl(msg.d); return; }
      // Reject stale/out-of-order messages via SeqNum tick comparison
      if (msg && msg._tick !== undefined) {
        if (!SeqNum.is_newer(msg._tick, lastMsgTickRef.current)) return;
        lastMsgTickRef.current = msg._tick;
      }
      dispatch(msg);
    };
    dc.onclose = () => setStatus('closed');
  }, [sendRaw, dispatch]);

  const waitForIce = (pc) => new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const check = setInterval(() => {
      if (pc.iceGatheringState === 'complete') { clearInterval(check); resolve(); }
    }, 100);
    setTimeout(() => { clearInterval(check); resolve(); }, 3000);
  });

  const startStream = useCallback((canvas, fps = 8) => {
    if (streamRef.current) clearInterval(streamRef.current);
    const iv = setInterval(() => {
      try {
        const dc = dcRef.current;
        if (!dc || dc.readyState !== 'open' || !canvas) return;
        const d = canvas.toDataURL('image/jpeg', 0.32);
        dc.send(JSON.stringify({ type: '__frame', d }));
      } catch (_) { /* ignore */ }
    }, Math.max(80, Math.round(1000 / fps)));
    streamRef.current = iv;
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) { clearInterval(streamRef.current); streamRef.current = null; }
  }, []);

  const createRoom = useCallback(async (hostUserId, hostName, gameMode, hostChar, hostElement, customCode) => {
    setIsHost(true);
    setStatus('hosting');
    setError(null);

    const code = customCode || Math.random().toString(36).slice(2, 8).toUpperCase();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    const dc = pc.createDataChannel('game', { ordered: true });
    setupDataChannel(dc);

    const iceCandidates = [];
    pc.onicecandidate = (e) => {
      if (e.candidate) iceCandidates.push(JSON.stringify(e.candidate));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);

    const { data: room, error: roomError } = await supabase.rpc('create_element6_lan_room', {
      p_room_code: code, p_game_mode: gameMode, p_host_char: hostChar,
      p_host_element: hostElement || 'basic', p_host_sdp: JSON.stringify(pc.localDescription), p_host_ice: iceCandidates,
    });
    if (roomError) throw roomError;
    const createdRoom = Array.isArray(room) ? room[0] : room;
    if (!createdRoom?.id) throw new Error('LAN room was not created.');

    roomIdRef.current = createdRoom.id;
    setRoomCode(code);

    pollRef.current = setInterval(async () => {
      try {
        const { data: updated } = await supabase.from('element6_lan_rooms').select('*').eq('id', createdRoom.id).maybeSingle();
        if (!updated) return;
        if (updated.guest_sdp && pc.currentRemoteDescription === null) {
          await pc.setRemoteDescription(JSON.parse(updated.guest_sdp));
          setOpponentChar(updated.guest_char);
          setOpponentElement(updated.guest_element || 'basic');
          setOpponentName(updated.guest_name);
        }
        if (updated.guest_ice && updated.guest_ice.length > 0) {
          for (const iceStr of updated.guest_ice) {
            try { await pc.addIceCandidate(JSON.parse(iceStr)); } catch (_) { /* ignore */ }
          }
        }
        if (updated.status === 'closed') {
          setStatus('closed');
          clearInterval(pollRef.current);
        }
      } catch (_) { /* ignore poll errors */ }
    }, 1000);
  }, [setupDataChannel]);

  const joinRoom = useCallback(async (code, guestUserId, guestName, guestChar, guestElement) => {
    setIsHost(false);
    setStatus('joining');
    setError(null);

    const { data: rooms, error: findError } = await supabase.from('element6_lan_rooms').select('*').eq('room_code', code).eq('status', 'open').limit(1);
    if (findError || !rooms?.length) {
      setError('Room not found or already closed');
      setStatus('error');
      return;
    }

    const room = rooms[0];
    roomIdRef.current = room.id;
    setRoomCode(code);
    setOpponentChar(room.host_char);
    setOpponentElement(room.host_element || 'basic');
    setOpponentName(room.host_name);

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    pc.ondatachannel = (e) => setupDataChannel(e.channel);

    const iceCandidates = [];
    pc.onicecandidate = (e) => {
      if (e.candidate) iceCandidates.push(JSON.stringify(e.candidate));
    };

    await pc.setRemoteDescription(JSON.parse(room.host_sdp));
    if (room.host_ice) {
      for (const iceStr of room.host_ice) {
        try { await pc.addIceCandidate(JSON.parse(iceStr)); } catch (_) { /* ignore */ }
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIce(pc);

    const { error: joinError } = await supabase.rpc('join_element6_lan_room', {
      p_room_code: code, p_guest_char: guestChar, p_guest_element: guestElement || 'basic',
      p_guest_sdp: JSON.stringify(pc.localDescription), p_guest_ice: iceCandidates,
    });
    if (joinError) throw joinError;

    pollRef.current = setInterval(async () => {
      try {
        // Only treat a fully-closed peer connection as a disconnect.
        // Transient 'disconnected'/'failed' states (common during ICE
        // renegotiation on LAN) are tolerated — the data channel's onclose
        // is the reliable signal that the peer actually left.
        if (pc.connectionState === 'closed') {
          setStatus('closed');
          clearInterval(pollRef.current);
          return;
        }
        const { data: updated } = await supabase.from('element6_lan_rooms').select('*').eq('id', room.id).maybeSingle();
        if (updated.status === 'closed') {
          setStatus('closed');
          clearInterval(pollRef.current);
        }
      } catch (_) { /* ignore */ }
    }, 2000);
  }, [setupDataChannel]);

  const closeConnection = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    stopStream();
    if (dcRef.current) dcRef.current.close();
    if (pcRef.current) pcRef.current.close();
    if (roomIdRef.current) {
      try { await supabase.rpc('close_element6_lan_room', { p_room_id: roomIdRef.current }); } catch (_) { /* ignore */ }
    }
    setStatus('idle');
    setRoomCode(null);
    setOpponentChar(null);
    setOpponentName(null);
    setFrameUrl(null);
  }, [stopStream]);

  // Heartbeat + stall detection (runs for the component lifetime)
  // Uses netCore ConnectionState for timeout/reconnection tracking.
  useEffect(() => {
    const hb = setInterval(() => {
      const dc = dcRef.current;
      if (dc && dc.readyState === 'open') {
        try { dc.send(JSON.stringify({ type: '__ping' })); } catch (_) { /* ignore */ }
      }
    }, 500);
    const chk = setInterval(() => {
      const dc = dcRef.current;
      const open = !!(dc && dc.readyState === 'open');
      if (open) {
        // Fast stall detection for LAN (1.2s) — tighter than ConnectionState's 10s
        const fastStall = Date.now() - lastRecvRef.current > 1200;
        if (fastStall !== stalledRef.current) { stalledRef.current = fastStall; setStalled(fastStall); }
        // Also check ConnectionState for the longer reconnection window
        connRef.current.isAlive();
      }
    }, 200);
    return () => { clearInterval(hb); clearInterval(chk); };
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (streamRef.current) clearInterval(streamRef.current);
      if (dcRef.current) dcRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  return {
    status, roomCode, isHost, error, opponentChar, opponentElement, opponentName,
    stalled, stalledRef, frameUrl,
    sendMessage, onMessage, createRoom, joinRoom, closeConnection,
    startStream, stopStream,
  };
}
