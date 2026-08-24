import db from './localBackend';

// ═══════════════════════════════════════════════════════════════════════════
// useOnlineSync — Reusable host-authoritative online sync hook
// ═══════════════════════════════════════════════════════════════════════════
// Encapsulates the common pattern used by all online modes:
//   • NetDiagnostics, ConnectionState, SnapshotBuffer from netCore
//   • Cloud DB subscription + polling for state/input sync
//   • Tick/sequence stamped sends with stale packet rejection
//   • sendState (host), sendInput (guest), sendHit (host) helpers
//   • Reconnection window handling
//   • Rate-limit awareness
//
// Usage:
//   const sync = useOnlineSync({ matchId, isHost, onRemoteState, onRemoteInput, onMatchEnd });
//   sync.sendState(stateObject);  // host: send authoritative state
//   sync.sendInput(inputObject);   // guest: send input to host
//   sync.sendHit(hitPayload);      // host: send authoritative hit event
//   sync.diag.getStats();          // network diagnostics
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback } from 'react';

import { SeqNum, SnapshotBuffer, ConnectionState, NetDiagnostics } from './netCore.js';

const DISCONNECT_TIMEOUT = 10000;
const RECONNECT_WINDOW = 15000;
const POLL_INTERVAL = 2000;

export function useOnlineSync({ matchId, isHost, onRemoteState, onRemoteInput, onRemoteHit, onMatchEnd, entityName = 'OnlineMatch' }) {
  const diag = useRef(new NetDiagnostics()).current;
  const snapBuffer = useRef(new SnapshotBuffer(30)).current;
  const conn = useRef(new ConnectionState({
    timeout: DISCONNECT_TIMEOUT,
    reconnectWindow: RECONNECT_WINDOW,
  })).current;
  const tickRef = useRef(0);
  const hitSeqRef = useRef(0);
  const lastRecvTickRef = useRef(-1);
  const lastHitSeqRef = useRef(0);
  const rateLimitedUntil = useRef(0);
  const finishedRef = useRef(false);

  diag.roomId = matchId;
  diag.playerNetId = isHost ? 'host' : 'guest';
  diag.connectionState = 'connected';

  const checkRateLimit = useCallback((e) => {
    if (String(e?.message || e).match(/rate/i)) rateLimitedUntil.current = Date.now() + 3000;
  }, []);

  // ── Set up subscription + polling ──
  useEffect(() => {
    if (!matchId) return;
    const entity = db.entities[entityName];

    const unsub = entity.subscribe((ev) => {
      if (!ev?.data || ev.data.id !== matchId) return;
      const m = ev.data;
      conn.heartbeat();

      if (isHost) {
        // Host receives guest input
        const gi = m.guest_state;
        if (gi && gi._tick !== undefined && SeqNum.is_newer(gi._tick, lastRecvTickRef.current)) {
          lastRecvTickRef.current = gi._tick;
          onRemoteInput?.(gi.input || gi);
        }
        // Host checks for guest forfeit
        const gh = m.guest_hit;
        if (gh && gh.forfeit && !finishedRef.current) {
          finishedRef.current = true;
          onMatchEnd?.({ won: true, forfeit: true });
        }
      } else {
        // Guest receives authoritative state from host
        const hs = m.host_state;
        if (hs && hs._tick !== undefined) {
          const added = snapBuffer.add(hs._tick, hs, Date.now());
          if (added) {
            diag.recordSnapshot(hs._tick, Date.now() - (hs._time || hs._ts || Date.now()));
            onRemoteState?.(hs);
          }
        }
        // Guest applies authoritative hit
        const hh = m.host_hit;
        if (hh && hh.seq !== undefined && SeqNum.is_newer(hh.seq, lastHitSeqRef.current)) {
          lastHitSeqRef.current = hh.seq;
          onRemoteHit?.(hh);
        }
      }

      if (m.status === 'finished' && !finishedRef.current) {
        finishedRef.current = true;
        const w = m.winner;
        const won = w === (isHost ? 'host' : 'guest');
        onMatchEnd?.({ won, winner: w });
      }
    });

    // Poll fallback
    const poll = setInterval(async () => {
      try {
        const m = await entity.get(matchId);
        if (!m) return;
        conn.heartbeat();
        if (isHost) {
          const gi = m.guest_state;
          if (gi && gi._tick !== undefined && SeqNum.is_newer(gi._tick, lastRecvTickRef.current)) {
            lastRecvTickRef.current = gi._tick;
            onRemoteInput?.(gi.input || gi);
          }
        } else {
          const hs = m.host_state;
          if (hs && hs._tick !== undefined) {
            snapBuffer.add(hs._tick, hs, Date.now());
            onRemoteState?.(hs);
          }
        }
        if (m.status === 'finished' && !finishedRef.current) {
          finishedRef.current = true;
          const w = m.winner;
          const won = w === (isHost ? 'host' : 'guest');
          onMatchEnd?.({ won, winner: w });
        }
      } catch {}
    }, POLL_INTERVAL);

    return () => {
      unsub && unsub();
      clearInterval(poll);
    };
  }, [matchId, isHost, entityName]);

  // ── Host: send authoritative state ──
  const sendState = useCallback((state) => {
    if (Date.now() < rateLimitedUntil.current) return;
    tickRef.current = (tickRef.current + 1) & 0xFFFF;
    const stamped = { ...state, _tick: tickRef.current, _time: Date.now() };
    diag.currentTick = tickRef.current;
    try {
      db.entities[entityName].update(matchId, { host_state: stamped }).catch(checkRateLimit);
    } catch {}
  }, [matchId, entityName, checkRateLimit]);

  // ── Guest: send input to host ──
  const sendInput = useCallback((input) => {
    if (Date.now() < rateLimitedUntil.current) return;
    tickRef.current = (tickRef.current + 1) & 0xFFFF;
    const stamped = { _tick: tickRef.current, input, _time: Date.now() };
    try {
      db.entities[entityName].update(matchId, { guest_state: stamped }).catch(checkRateLimit);
    } catch {}
  }, [matchId, entityName, checkRateLimit]);

  // ── Host: send authoritative hit event ──
  const sendHit = useCallback((hit) => {
    if (Date.now() < rateLimitedUntil.current) return;
    hitSeqRef.current = (hitSeqRef.current + 1) & 0xFFFF;
    const payload = { ...hit, seq: hitSeqRef.current };
    try {
      db.entities[entityName].update(matchId, { host_hit: payload }).catch(checkRateLimit);
    } catch {}
  }, [matchId, entityName, checkRateLimit]);

  // ── Finish match ──
  const finish = useCallback((won) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      db.entities[entityName].update(matchId, {
        status: 'finished',
        winner: won ? (isHost ? 'host' : 'guest') : (isHost ? 'guest' : 'host'),
      });
    } catch {}
  }, [matchId, isHost, entityName]);

  // ── Forfeit ──
  const forfeit = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const forfeitPayload = isHost
      ? { host_hit: { forfeit: true } }
      : { guest_hit: { forfeit: true } };
    try {
      db.entities[entityName].update(matchId, {
        status: 'finished',
        winner: isHost ? 'guest' : 'host',
        ...forfeitPayload,
      });
    } catch {}
  }, [matchId, isHost, entityName]);

  return {
    diag,
    conn,
    snapBuffer,
    sendState,
    sendInput,
    sendHit,
    finish,
    forfeit,
    isAlive: () => conn.isAlive(),
    isReconnecting: () => conn.isReconnecting,
    resetFinished: () => { finishedRef.current = false; },
  };
}