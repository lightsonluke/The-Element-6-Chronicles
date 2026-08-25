import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { getKeybinds } from './keybinds.js';
import SoccerFighter from './SoccerFighter.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import DodgeballGame from './DodgeballGame.jsx';
import { reportOnlineSportResult } from './sportsOnline.js';

function getSport(mode = '') {
  if (mode.startsWith('soccer_')) return 'soccer';
  if (mode.startsWith('volleyball_')) return 'volleyball';
  if (mode.startsWith('dodgeball_')) return 'dodgeball';
  return null;
}

// A sport error must lead back to the game instead of leaving the whole app as
// a blank page. This boundary is deliberately local to online sports.
class SportErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="w-full max-w-xl mx-auto text-center space-y-4 p-6 rounded-xl border border-destructive bg-card">
      <h2 className="font-heading text-2xl text-destructive">ONLINE MATCH CLOSED</h2>
      <p className="text-sm text-muted-foreground">{this.state.error?.message || 'The match could not start safely.'}</p>
      <button onClick={this.props.onExit} className="px-5 py-2 rounded bg-secondary font-heading">RETURN TO SPORTS</button>
    </div>;
  }
}

// The old game components use key events for LAN. In an online match the host
// always owns P1 and the guest must be converted to P2 before the host receives
// it. That prevents both players moving the same dodgeball character.
function guestKeyForHost(message, sport, settings) {
  if (sport === 'soccer' || message?.type !== 'key') return message;
  const binds = getKeybinds(settings);
  const raw = String(message.key || '').toLowerCase();
  const actions = ['left', 'right', 'up', 'down', 'jump', 'sig', 'power', 'superMove', 'heavy'];
  const action = actions.find(name => String(binds.p1[name] || '').toLowerCase() === raw);
  return action ? { ...message, key: binds.p2[action] } : message;
}

function ActualSportsOnlineMatchInner({ match, players, settings = {}, sfxVolume = 70, musicVolume = 50, equippedSkins = {}, equippedAccessories = {}, equippedElements = {}, customCharsData = {}, onEnd }) {
  const [me, setMe] = useState(null);
  const [remoteState, setRemoteState] = useState(null);
  const [status, setStatus] = useState('CONNECTING…');
  const [result, setResult] = useState(null);
  const [startError, setStartError] = useState(null);
  const messageHandler = useRef(null);
  const channel = useRef(null);
  const lastStateSent = useRef(0);
  const submitted = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => { supabase.auth.getUser().then(({ data, error }) => { if (error) setStartError(error.message); setMe(data?.user || null); }); }, []);
  const ordered = useMemo(() => [...(players || [])].sort((a, b) => Number(a.slot) - Number(b.slot)), [players]);
  const sport = getSport(match?.mode);
  const hostId = match?.host_user_id || ordered[0]?.user_id;
  const isHost = Boolean(me?.id && String(me.id) === String(hostId));
  const p1 = ordered.find(p => Number(p.team) === 1);
  const p2 = ordered.find(p => Number(p.team) === 2);

  useEffect(() => {
    if (!match?.id || !me?.id || !sport) return undefined;
    let active = true;
    const realtime = supabase.channel(`actual-sport-v2:${match.id}`, { config: { broadcast: { self: false, ack: true } } });
    channel.current = realtime;
    realtime.on('broadcast', { event: 'input' }, ({ payload }) => {
      if (active && payload?.sender !== me.id) messageHandler.current?.(payload?.message);
    }).on('broadcast', { event: 'state' }, ({ payload }) => {
      if (active && !isHost && payload?.state) setRemoteState(payload.state);
    }).on('broadcast', { event: 'result' }, ({ payload }) => {
      if (active && payload?.winnerTeam) setResult(payload);
    }).subscribe(state => {
      if (!active) return;
      if (state === 'SUBSCRIBED') setStatus('CONNECTED');
      else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') setStartError(`Realtime connection failed: ${state}`);
      else setStatus(state);
    });
    return () => { active = false; channel.current = null; supabase.removeChannel(realtime); };
  }, [match?.id, me?.id, sport, isHost]);

  const lanConnection = useMemo(() => ({
    onMessage(handler) { messageHandler.current = handler; return () => { if (messageHandler.current === handler) messageHandler.current = null; }; },
    sendMessage(message) {
      if (!channel.current || !me?.id) return;
      const outgoing = isHost ? message : guestKeyForHost(message, sport, settings);
      channel.current.send({ type: 'broadcast', event: 'input', payload: { sender: me.id, message: outgoing } }).catch(() => {});
    },
    stalled: false, stalledRef: { current: false },
  }), [me?.id, isHost, sport, settings]);

  const exportState = state => {
    if (!isHost || !channel.current || performance.now() - lastStateSent.current < 50) return;
    lastStateSent.current = performance.now();
    channel.current.send({ type: 'broadcast', event: 'state', payload: { state } }).catch(() => {});
  };
  const finish = winnerTeam => {
    if (submitted.current || !winnerTeam) return;
    submitted.current = true;
    const payload = { winnerTeam, finalFrame: Math.max(1, Math.floor((Date.now() - startedAt.current) / (1000 / 60))), checksum: `actual-sport-v2-${match.id}-${winnerTeam}` };
    setResult(payload); channel.current?.send({ type: 'broadcast', event: 'result', payload }).catch(() => {});
  };
  useEffect(() => {
    if (!result || !me?.id) return;
    reportOnlineSportResult({ matchId: match.id, winnerTeam: result.winnerTeam, finalFrame: result.finalFrame, checksum: result.checksum }).catch(() => {});
  }, [result, me?.id, match?.id]);

  if (startError) return <div className="text-center space-y-4 p-6"><p className="font-heading text-destructive">{startError}</p><button onClick={onEnd} className="px-5 py-2 rounded bg-secondary font-heading">RETURN TO SPORTS</button></div>;
  if (!me) return <p className="font-heading text-accent text-center">CHECKING ONLINE ACCOUNT…</p>;
  if (!sport || ordered.length !== 2 || !p1 || !p2) return <div className="text-center space-y-3"><p className="text-muted-foreground">Waiting for both player slots to be ready.</p><button onClick={onEnd} className="px-5 py-2 rounded bg-secondary font-heading">RETURN TO SPORTS</button></div>;
  if (result) return <div className="text-center space-y-5"><h2 className="text-4xl font-heading text-accent">TEAM {result.winnerTeam} WINS!</h2><button onClick={onEnd} className="px-6 py-3 rounded bg-primary text-primary-foreground font-heading">CONTINUE</button></div>;

  const common = { settings, sfxVolume, musicVolume, equippedSkins, equippedAccessories, customCharsData, lanConnection, lanRole: isHost ? 'host' : 'guest', localScheme: isHost ? 'p1' : 'p2' };
  const element = player => player.loadout?.element || equippedElements[player.character_id] || 'basic';
  return <div className="w-full flex flex-col items-center gap-2"><p className="font-heading text-accent text-sm">{sport.toUpperCase()} ONLINE · {status}</p>
    {sport === 'soccer' && <SoccerFighter {...common} p1Char={p1.character_id} p2Char={p2.character_id} p1IsCPU={false} p2IsCPU={false} cpuDifficulty="regular" p1Element={element(p1)} p2Element={element(p2)} round={1} totalRounds={1} onRematch={() => {}} onEnd={r => { if (isHost && r?.p1Won !== undefined) finish(r.p1Won ? 1 : 2); }} />}
    {sport === 'volleyball' && <VolleyballGame {...common} p1Chars={[p1.character_id]} p2Chars={[p2.character_id]} p1IsCPU={false} p2IsCPU={false} difficulty="regular" p1Elements={[element(p1)]} p2Elements={[element(p2)]} onResult={r => { if (isHost && r?.p1Won !== undefined) finish(r.p1Won ? 1 : 2); }} onQuit={onEnd} onStateExport={isHost ? exportState : undefined} remoteState={isHost ? null : remoteState} isOnlineHost={isHost} />}
    {sport === 'dodgeball' && <DodgeballGame {...common} p1Chars={[p1.character_id]} p2Chars={[p2.character_id]} p1IsCPU={false} p2IsCPU={false} difficulty="regular" p1Elements={[element(p1)]} p2Elements={[element(p2)]} onResult={r => { if (isHost && r?.p1Won !== undefined) finish(r.p1Won ? 1 : 2); }} onQuit={onEnd} onStateExport={isHost ? exportState : undefined} remoteState={isHost ? null : remoteState} isOnlineHost={isHost} />}
  </div>;
}

export default function ActualSportsOnlineMatch(props) {
  return <SportErrorBoundary onExit={props.onEnd}><ActualSportsOnlineMatchInner {...props} /></SportErrorBoundary>;
}
