import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';
import SoccerFighter from './SoccerFighter.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import DodgeballGame from './DodgeballGame.jsx';
import { reportOnlineSportResult } from './sportsOnline.js';

// Runs the existing sport components. This file does not replace or modify
// any offline component. Soccer forwards both players' inputs; Volleyball and
// Dodgeball use their existing host-state / guest-render hooks.

function getSport(mode = '') {
  if (mode.startsWith('soccer_')) return 'soccer';
  if (mode.startsWith('volleyball_')) return 'volleyball';
  if (mode.startsWith('dodgeball_')) return 'dodgeball';
  return null;
}

export default function ActualSportsOnlineMatch({
  match, players, settings = {}, sfxVolume = 70, musicVolume = 50,
  equippedSkins = {}, equippedAccessories = {}, equippedElements = {},
  customCharsData = {}, onEnd,
}) {
  const [me, setMe] = useState(null);
  const [remoteState, setRemoteState] = useState(null);
  const [status, setStatus] = useState('CONNECTING…');
  const [result, setResult] = useState(null);
  const messageHandler = useRef(null);
  const channel = useRef(null);
  const lastStateSent = useRef(0);
  const submitted = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user || null));
  }, []);

  const orderedPlayers = useMemo(
    () => [...(players || [])].sort((a, b) => Number(a.slot) - Number(b.slot)),
    [players],
  );
  const sport = getSport(match?.mode);
  const hostId = match?.host_user_id || orderedPlayers[0]?.user_id;
  const isHost = Boolean(me?.id && String(me.id) === String(hostId));
  const p1 = orderedPlayers.find(player => Number(player.team) === 1);
  const p2 = orderedPlayers.find(player => Number(player.team) === 2);

  useEffect(() => {
    if (!match?.id || !me?.id || !sport) return undefined;
    let active = true;
    const realtime = supabase.channel(`actual-sport:${match.id}`, {
      config: { broadcast: { self: false, ack: true } },
    });
    channel.current = realtime;
    realtime
      .on('broadcast', { event: 'input' }, ({ payload }) => {
        if (active && payload?.sender !== me.id) messageHandler.current?.(payload?.message);
      })
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (active && !isHost && payload?.state) setRemoteState(payload.state);
      })
      .on('broadcast', { event: 'result' }, ({ payload }) => {
        if (active && payload?.winnerTeam) setResult(payload);
      })
      .subscribe(state => {
        if (active) setStatus(state === 'SUBSCRIBED' ? 'CONNECTED' : state);
      });
    return () => {
      active = false;
      channel.current = null;
      supabase.removeChannel(realtime);
    };
  }, [match?.id, me?.id, sport, isHost]);

  const lanConnection = useMemo(() => ({
    onMessage(handler) {
      messageHandler.current = handler;
      return () => { if (messageHandler.current === handler) messageHandler.current = null; };
    },
    sendMessage(message) {
      if (channel.current && me?.id) {
        channel.current.send({ type: 'broadcast', event: 'input', payload: { sender: me.id, message } });
      }
    },
    stalled: false,
    stalledRef: { current: false },
  }), [me?.id]);

  const onStateExport = state => {
    // Existing games export every animation frame; send at ~20Hz instead.
    if (!isHost || !channel.current || performance.now() - lastStateSent.current < 50) return;
    lastStateSent.current = performance.now();
    channel.current.send({ type: 'broadcast', event: 'state', payload: { state } });
  };

  const finish = winnerTeam => {
    if (submitted.current || !winnerTeam) return;
    submitted.current = true;
    const payload = {
      winnerTeam,
      finalFrame: Math.max(1, Math.floor((Date.now() - startedAt.current) / (1000 / 60))),
      // Both clients receive this match result through the same Realtime message.
      checksum: `actual-sport-${match.id}-${winnerTeam}`,
    };
    setResult(payload);
    channel.current?.send({ type: 'broadcast', event: 'result', payload });
  };

  useEffect(() => {
    if (!result || !me?.id) return;
    reportOnlineSportResult({
      matchId: match.id,
      winnerTeam: result.winnerTeam,
      finalFrame: result.finalFrame,
      checksum: result.checksum,
    }).catch(() => {});
  }, [result, me?.id, match?.id]);

  if (!me) return <p className="font-heading text-accent text-center">SIGN IN TO PLAY ONLINE</p>;
  if (!sport || orderedPlayers.length !== 2 || !p1 || !p2) {
    return <p className="text-center text-muted-foreground">This screen currently supports the 1v1 Soccer, Volleyball, and Dodgeball queues.</p>;
  }
  if (result) return <div className="text-center space-y-5"><h2 className="text-4xl font-heading text-accent">TEAM {result.winnerTeam} WINS!</h2><button onClick={() => onEnd?.()} className="px-6 py-3 rounded bg-primary text-primary-foreground font-heading">CONTINUE</button></div>;

  const shared = {
    settings, sfxVolume, musicVolume, equippedSkins, equippedAccessories,
    customCharsData, lanConnection, lanRole: isHost ? 'host' : 'guest',
    localScheme: isHost ? 'p1' : 'p2',
  };
  const elementFor = player => player.loadout?.element || equippedElements[player.character_id] || 'basic';

  return <div className="w-full flex flex-col items-center gap-2">
    <p className="font-heading text-accent text-sm">{sport.toUpperCase()} ONLINE · {status}</p>
    {sport === 'soccer' && <SoccerFighter
      {...shared}
      p1Char={p1.character_id} p2Char={p2.character_id}
      p1IsCPU={false} p2IsCPU={false} cpuDifficulty="regular"
      p1Element={elementFor(p1)} p2Element={elementFor(p2)}
      round={1} totalRounds={1} onRematch={() => {}}
      onEnd={matchResult => { if (isHost) finish(matchResult?.p1Won ? 1 : 2); }}
    />}
    {sport === 'volleyball' && <VolleyballGame
      {...shared}
      p1Chars={[p1.character_id]} p2Chars={[p2.character_id]}
      p1IsCPU={false} p2IsCPU={false} difficulty="regular"
      p1Elements={[elementFor(p1)]} p2Elements={[elementFor(p2)]}
      onResult={matchResult => { if (isHost) finish(matchResult?.won ? 1 : 2); }}
      onQuit={onEnd}
      onStateExport={isHost ? onStateExport : undefined}
      remoteState={isHost ? null : remoteState}
      isOnlineHost={isHost}
    />}
    {sport === 'dodgeball' && <DodgeballGame
      {...shared}
      p1Chars={[p1.character_id]} p2Chars={[p2.character_id]}
      p1IsCPU={false} p2IsCPU={false} difficulty="regular"
      p1Elements={[elementFor(p1)]} p2Elements={[elementFor(p2)]}
      onResult={matchResult => { if (isHost) finish(matchResult?.won ? 1 : 2); }}
      onQuit={onEnd}
      onStateExport={isHost ? onStateExport : undefined}
      remoteState={isHost ? null : remoteState}
      isOnlineHost={isHost}
    />}
  </div>;
}
