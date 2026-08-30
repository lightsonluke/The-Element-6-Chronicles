import db from './localBackend';

// ═══════════════════════════════════════════════════════════════════════════
// OnlineSportsMatch — Host-authoritative online wrapper for sport games
// ═══════════════════════════════════════════════════════════════════════════
// Wraps any sport game component (Volleyball, Baseball, Dodgeball, Banger)
// with host-authoritative state synchronization:
//
//   HOST:
//     • Runs the sport game simulation locally
//     • Captures state via onStateExport callback
//     • Sends state snapshots to guest via cloud DB (tick-stamped)
//     • Receives guest input and applies it via remoteInput prop
//
//   GUEST:
//     • Sends local input to host via cloud DB (tick-stamped)
//     • Renders from host's authoritative state via remoteState prop
//     • Does NOT run the simulation — only renders
//
// This ensures the host is the single source of truth for all gameplay
// objects (ball, players, score, etc.). The guest never independently
// decides the outcome of shared state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState, useCallback } from 'react';

import { SeqNum, SnapshotBuffer, ConnectionState, NetDiagnostics } from './netCore.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import PauseMenu from './PauseMenu.jsx';
import GameIcon from './GameIcon.jsx';

const SYNC_INTERVAL = 4;       // frames between state sends (~66ms at 60fps)
const SNAPSHOT_DELAY = 2;       // interpolation delay in ticks
const DISCONNECT_TIMEOUT = 10000;
const RECONNECT_WINDOW = 15000;
const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

// Round numbers to reduce bandwidth
function roundNums(obj, decimals = 1) {
  if (typeof obj === 'number') return Math.round(obj * Math.pow(10, decimals)) / Math.pow(10, decimals);
  if (Array.isArray(obj)) return obj.map(v => roundNums(v, decimals));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = roundNums(obj[k], decimals);
    return out;
  }
  return obj;
}

export default function OnlineSportsMatch({ matchId, role, sport, GameComponent, settings = {}, sfxVolume = 70, musicVolume = 50, onEnd, ...gameProps }) {
  const isHost = role === 'host';
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showDiag, setShowDiag] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const finishedRef = useRef(false);

  // Networking
  const diag = useRef(new NetDiagnostics()).current;
  const snapBuffer = useRef(new SnapshotBuffer(20)).current;
  const conn = useRef(new ConnectionState({
    timeout: DISCONNECT_TIMEOUT,
    reconnectWindow: RECONNECT_WINDOW,
    onTimeout: () => setReconnecting(true),
    onReconnect: () => setReconnecting(false),
  })).current;
  const tickRef = useRef(0);
  const lastRecvTickRef = useRef(-1);
  const rateLimitedUntil = useRef(0);

  diag.roomId = matchId;
  diag.playerNetId = isHost ? 'host' : 'guest';
  diag.connectionState = 'connected';

  // State management
  const remoteStateRef = useRef(null);     // guest: latest state from host
  const remoteInputRef = useRef(NO_INPUT);  // host: latest input from guest
  const lastStateSeen = useRef(Date.now());
  const exportStateRef = useRef(null);      // host: latest exported state

  // Cloud-based lanConnection bridge — provides the same interface as useLANConnection
  // so sport games can use their existing key-forwarding code for online play.
  // Host: receives guest input from cloud DB, converts to P2 key events, passes
  //       to the game's onMessage callback.
  // Guest: sendMessage is a no-op (the wrapper captures input via its own listeners).
  const prevInputRef = useRef({});
  const guestKeysRef = useRef({});
  const cloudLanRef = useRef({
    _cb: null,
    onMessage(cb) { this._cb = cb; return () => { this._cb = null; }; },
    sendMessage() { /* no-op — wrapper handles sending */ },
    stalled: false,
    stalledRef: { current: false },
  });

  const kb = getKeybinds(settings);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  // ── Soft pause: capture-phase key interceptor ──
  // ESC/P toggles the pause overlay. When paused, ALL key events are swallowed
  // so the underlying sport game keeps running but receives no local input
  // (your player stands still while the opponent keeps playing).
  useEffect(() => {
    if (!gameStarted) return;
    const captureKd = (e) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        pausedRef.current = !pausedRef.current;
        setPaused(v => !v);
        if (pausedRef.current) guestKeysRef.current = {};
        e.stopPropagation(); e.preventDefault();
        return;
      }
      if (e.key === 'F3') { setShowDiag(v => !v); return; }
      if (pausedRef.current) { e.stopPropagation(); e.preventDefault(); }
    };
    const captureKu = (e) => {
      if (pausedRef.current) { e.stopPropagation(); e.preventDefault(); }
    };
    window.addEventListener('keydown', captureKd, true);
    window.addEventListener('keyup', captureKu, true);
    return () => {
      window.removeEventListener('keydown', captureKd, true);
      window.removeEventListener('keyup', captureKu, true);
    };
  }, [gameStarted]);

  // ── Cloud DB sync: subscribe + poll ──
  useEffect(() => {
    if (!matchId) return;
    const checkRateLimit = (e) => { if (String(e?.message || e).match(/rate/i)) rateLimitedUntil.current = Date.now() + 3000; };

    const unsub = db.entities.OnlineMatch.subscribe((ev) => {
      if (!ev?.data || ev.data.id !== matchId) return;
      const m = ev.data;
      conn.heartbeat();

      if (isHost) {
        // Host receives guest input — convert to P2 key events and pass to game
        const gi = m.guest_state;
        if (gi && gi._tick !== undefined && SeqNum.is_newer(gi._tick, lastRecvTickRef.current)) {
          lastRecvTickRef.current = gi._tick;
          const input = gi.input || NO_INPUT;
          remoteInputRef.current = input;
          // Convert input state to P2 key events and pass to the game's onMessage callback
          const cb = cloudLanRef.current._cb;
          if (cb) {
            const p2kb = kb.p2;
            for (const act of ['left', 'right', 'up', 'down', 'jump', 'sig', 'power', 'superMove', 'heavy']) {
              const key = p2kb[act]?.toLowerCase();
              if (!key) continue;
              const down = !!input[act];
              if (down !== prevInputRef.current[act]) {
                cb({ type: 'key', key, down });
              }
              prevInputRef.current[act] = down;
            }
          }
        }
      } else {
        // Guest receives authoritative state from host
        const hs = m.host_state;
        if (hs && hs._tick !== undefined && SeqNum.is_newer(hs._tick, lastRecvTickRef.current)) {
          lastRecvTickRef.current = hs._tick;
          remoteStateRef.current = hs;
          lastStateSeen.current = Date.now();
          snapBuffer.add(hs._tick, hs, Date.now());
          diag.recordSnapshot(hs._tick, Date.now() - (hs._time || Date.now()));
        }
      }

      if (m.status === 'finished' && !finishedRef.current) {
        finishedRef.current = true;
        const w = m.winner;
        setWinner(w === role ? 'me' : (w && w !== 'none' ? 'opp' : 'disconnect'));
      }
    });

    const poll = setInterval(async () => {
      try {
        const m = await db.entities.OnlineMatch.get(matchId);
        if (!m) return;
        conn.heartbeat();
        if (isHost) {
          const gi = m.guest_state;
          if (gi && gi._tick !== undefined && SeqNum.is_newer(gi._tick, lastRecvTickRef.current)) {
            lastRecvTickRef.current = gi._tick;
            const input = gi.input || NO_INPUT;
            remoteInputRef.current = input;
            const cb = cloudLanRef.current._cb;
            if (cb) {
              const p2kb = kb.p2;
              for (const act of ['left', 'right', 'up', 'down', 'jump', 'sig', 'power', 'superMove', 'heavy']) {
                const key = p2kb[act]?.toLowerCase();
                if (!key) continue;
                const down = !!input[act];
                if (down !== prevInputRef.current[act]) { cb({ type: 'key', key, down }); }
                prevInputRef.current[act] = down;
              }
            }
          }
        } else {
          const hs = m.host_state;
          if (hs && hs._tick !== undefined && SeqNum.is_newer(hs._tick, lastRecvTickRef.current)) {
            lastRecvTickRef.current = hs._tick;
            remoteStateRef.current = hs;
            lastStateSeen.current = Date.now();
            snapBuffer.add(hs._tick, hs, Date.now());
          }
        }
        if (m.status === 'finished' && !finishedRef.current) {
          finishedRef.current = true;
          const w = m.winner;
          setWinner(w === role ? 'me' : (w && w !== 'none' ? 'opp' : 'disconnect'));
        }
      } catch {}
    }, 2000);

    return () => { unsub && unsub(); clearInterval(poll); };
  }, [matchId, isHost]);

  // ── Host: send state snapshots ──
  const sendState = useCallback((state) => {
    if (Date.now() < rateLimitedUntil.current) return;
    tickRef.current = (tickRef.current + 1) & 0xFFFF;
    const stamped = { ...roundNums(state), _tick: tickRef.current, _time: Date.now() };
    diag.currentTick = tickRef.current;
    try { db.entities.OnlineMatch.update(matchId, { host_state: stamped }).catch(() => {}); } catch {}
  }, [matchId]);

  // ── Guest: send input ──
  const sendInput = useCallback((input) => {
    if (Date.now() < rateLimitedUntil.current) return;
    tickRef.current = (tickRef.current + 1) & 0xFFFF;
    const stamped = { _tick: tickRef.current, input, _time: Date.now() };
    try { db.entities.OnlineMatch.update(matchId, { guest_state: stamped }).catch(() => {}); } catch {}
  }, [matchId]);

  // ── Guest: capture and send input at regular intervals ──
  useEffect(() => {
    if (!gameStarted || isHost) return;
    const keys = {};
    const kd = (e) => {
      keys[e.key] = true; keys[e.key.toLowerCase()] = true;
    };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const interval = setInterval(() => {
      const gp = settings?.controllerEnabled !== false ? readGamepadInput(0) : null;
      // Soft pause: send zeroed input so your player stands still while the game continues
      const input = pausedRef.current ? NO_INPUT : {
        left: !!keys[kb.p1.left.toLowerCase()] || !!gp?.left,
        right: !!keys[kb.p1.right.toLowerCase()] || !!gp?.right,
        up: !!keys[kb.p1.up.toLowerCase()] || !!gp?.up,
        down: !!keys[kb.p1.down.toLowerCase()] || !!gp?.down,
        jump: !!keys[kb.p1.jump.toLowerCase()] || !!gp?.jump,
        sig: !!keys[kb.p1.sig.toLowerCase()] || !!gp?.sig,
        power: !!keys[kb.p1.power.toLowerCase()] || !!gp?.power,
        superMove: !!keys[kb.p1.superMove.toLowerCase()] || !!gp?.superMove,
        heavy: !!keys[kb.p1.heavy.toLowerCase()] || !!gp?.heavy,
      };
      sendInput(input);
    }, SYNC_INTERVAL * 1000 / 60);

    return () => { clearInterval(interval); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [gameStarted, isHost, sendInput, kb, settings]);

  // ── Host: send state at regular intervals ──
  useEffect(() => {
    if (!gameStarted || !isHost) return;
    // Soft pause: host keeps broadcasting state so the guest's game continues
    // while the host's local player stands still (zeroed input).
    const interval = setInterval(() => {
      if (exportStateRef.current) sendState(exportStateRef.current);
    }, SYNC_INTERVAL * 1000 / 60);
    return () => clearInterval(interval);
  }, [gameStarted, isHost, sendState]);

  // ── Finish match ──
  const finish = useCallback((iWon) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setWinner(iWon ? 'me' : 'opp');
    try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: iWon ? role : (isHost ? 'guest' : 'host') }); } catch {}
  }, [matchId, isHost, role]);

  const handleQuit = () => {
    const forfeit = isHost ? { host_hit: { forfeit: true } } : { guest_hit: { forfeit: true } };
    try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: isHost ? 'guest' : 'host', ...forfeit }); } catch {}
    onEnd?.({ won: false, disconnected: true, sport });
  };

  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  if (winner) {
    const won = winner === 'me' || winner === 'me_disconnect';
    return (
      <div className="el6-match-viewport relative flex flex-col items-center gap-2 w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg gap-5">
          <span className="text-5xl font-heading drop-shadow-lg" style={{ color: won ? '#FFD700' : '#FF4444' }}>
            {winner === 'me_disconnect' || winner === 'disconnect' ? 'OTHER PLAYER DISCONNECTED' : won ? 'YOU WIN!' : 'YOU LOSE'}
          </span>
          <button onClick={() => onEnd?.({ won, sport })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">CONTINUE</button>
        </div>
      </div>
    );
  }

  // Get interpolated state for guest rendering
  const guestRemoteState = !isHost ? (snapBuffer.getInterpolated(SNAPSHOT_DELAY) || remoteStateRef.current) : null;

  return (
    <div className="el6-match-viewport relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        <button onClick={handleQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Forfeit</button>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className="el6-match-pause-button px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause (ESC)</button>
      </div>
      <GameComponent
        {...gameProps}
        settings={settings}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        onResult={(res) => { if (isHost) finish(res?.won ?? false); }}
        onQuit={handleQuit}
        // Cloud lanConnection bridge — reuses sport games' existing key-forwarding
        lanConnection={cloudLanRef.current}
        lanRole={isHost ? 'host' : 'guest'}
        localScheme={isHost ? 'p1' : 'p2'}
        // Host: export state + receive remote input
        onStateExport={isHost ? (s) => { exportStateRef.current = s; } : undefined}
        remoteInput={isHost ? remoteInputRef : undefined}
        // Guest: render from remote state, don't simulate
        remoteState={guestRemoteState}
        isOnlineHost={isHost}
      />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !winner && <PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={handleQuit} />}
      {reconnecting && !winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-3xl font-heading text-accent animate-pulse">RECONNECTING…</span>
        </div>
      )}
    </div>
  );
}