import React, { useEffect, useRef, useState } from 'react';

import db from './localBackend';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { drawProjectiles } from './fighter.js';
import {
  drawAttackEffect,
  drawBackground,
  drawDoubleJumpParticles,
  drawHealthBar,
  drawHitSparks,
  drawPlatforms,
  drawStickman,
  drawSuperEffect,
} from './renderer.js';
import { getKeybinds, readPlayerInput } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { drawAccessory, getEquippedAccessories, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { drawShikigamiFollower } from './shikigami.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import PauseMenu from './PauseMenu.jsx';
import GameIcon from './GameIcon.jsx';
import { useClipRecorder } from './useClipRecorder.js';
import { RollbackSession } from './rollback/rollbackSession.js';
import { SupabaseRollbackTransport } from './rollback/realtimeTransport.js';
import {
  createElement6OnlineState,
  ONLINE_PLATFORMS,
  ONLINE_STAGE_HEIGHT,
  ONLINE_STAGE_WIDTH,
  stepElement6OnlineFrame,
  unpackElement6Fighters,
} from './rollback/element6Simulation.js';

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const FRAME_MS = 1000 / 60;
const NO_INPUT = Object.freeze({ left: false, right: false, up: false, down: false, jump: false, sig: false, heavy: false, power: false, superMove: false });

const getCharData = id => ALL.find(character => character.id === id) || ALL[0];

function mergeInput(keyboard, gamepad) {
  if (!gamepad) return keyboard;
  return {
    left: keyboard.left || gamepad.left,
    right: keyboard.right || gamepad.right,
    up: keyboard.up || gamepad.up,
    down: keyboard.down || gamepad.down,
    jump: keyboard.jump || gamepad.jump,
    sig: keyboard.sig || gamepad.sig,
    heavy: keyboard.heavy || gamepad.heavy,
    power: keyboard.power || gamepad.power,
    superMove: keyboard.superMove || gamepad.superMove,
  };
}

export default function RollbackOnlineFight({
  matchId,
  playerId,
  role,
  mode,
  myChar,
  oppChar,
  myLoadout = {},
  oppLoadout = {},
  myElo,
  oppElo,
  sfxVolume = 70,
  musicVolume = 50,
  settings = {},
  onEnd,
}) {
  const canvasRef = useRef(null);
  const pausedRef = useRef(false);
  const showDiagnosticsRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [winner, setWinner] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionText, setConnectionText] = useState('CONNECTING…');
  const [networkError, setNetworkError] = useState(null);
  useClipRecorder(canvasRef);

  const isHost = role === 'host';
  const myCharData = getCharData(myChar);
  const oppCharData = getCharData(oppChar);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(value => value - 1), 1000);
      return () => clearTimeout(timer);
    }
    setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    music.setVolume(musicVolume);
    sfx.setVolume(sfxVolume);
    music.play('fight');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (!gameStarted || !playerId || (mode !== 'ranked' && mode !== 'unranked')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const keys = {};
    let animationFrame = 0;
    let pingTimer = null;
    let readyTimer = null;
    let stopped = false;
    let finished = false;
    let lastPeerMessageAt = Date.now();
    let transport;
    let session;

    const hostCharacter = isHost ? myCharData : oppCharData;
    const guestCharacter = isHost ? oppCharData : myCharData;
    const hostLoadout = isHost ? myLoadout : oppLoadout;
    const guestLoadout = isHost ? oppLoadout : myLoadout;
    const initialState = createElement6OnlineState({
      matchId,
      mode,
      host: {
        character: hostCharacter,
        elementId: hostLoadout.element || 'basic',
        shikigamiId: hostLoadout.equippedShikigami?.[hostCharacter.id],
      },
      guest: {
        character: guestCharacter,
        elementId: guestLoadout.element || 'basic',
        shikigamiId: guestLoadout.equippedShikigami?.[guestCharacter.id],
      },
    });

    const onKeyDown = event => {
      keys[event.key] = true;
      keys[event.key.toLowerCase()] = true;
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
      }
      if (event.key === 'F3') showDiagnosticsRef.current = !showDiagnosticsRef.current;
      if (!['F5', 'F12'].includes(event.key)) event.preventDefault();
    };
    const onKeyUp = event => {
      keys[event.key] = false;
      keys[event.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const drawFighter = (fighter, character, loadout, label) => {
      if (fighter.invincible > 0 && Math.floor(fighter.frame / 4) % 2 === 0) return;
      drawDoubleJumpParticles(ctx, fighter.doubleJumpParticles || []);
      const renderColor = getCharRenderColor(character.id, loadout?.equippedSkins) || character.color;
      const skinParts = getSkinParts(character.id, loadout?.equippedSkins);
      const accessories = getEquippedAccessories(loadout?.equippedAccessories || {}, character.id);
      const skinColor = getCharRenderColor(character.id, loadout?.equippedSkins);
      skinParts.filter(part => isBehindAccessory(part.type)).forEach(part => drawAccessory(ctx, fighter.x, fighter.y, part.type, part.color, fighter.frame, 1, character.id, fighter.state, fighter.facing, fighter.powerActive));
      accessories.filter(accessory => isBehindAccessory(accessory.type)).forEach(accessory => drawAccessory(ctx, fighter.x, fighter.y, accessory.type, skinColor && accessory.type === 'soccer_kit' ? skinColor : resolveAccColor(accessory, character), fighter.frame, 1, character.id, fighter.state, fighter.facing, fighter.powerActive));
      drawStickman(ctx, fighter.x, fighter.y, renderColor, fighter.facing, fighter.frame, 1, character.isSpirit, fighter.state, character, fighter.powerActive, false, null, fighter.emote);
      skinParts.filter(part => !isBehindAccessory(part.type)).forEach(part => drawAccessory(ctx, fighter.x, fighter.y, part.type, part.color, fighter.frame, 1, character.id, fighter.state, fighter.facing, fighter.powerActive));
      accessories.filter(accessory => !isBehindAccessory(accessory.type)).forEach(accessory => drawAccessory(ctx, fighter.x, fighter.y, accessory.type, skinColor && accessory.type === 'soccer_kit' ? skinColor : resolveAccColor(accessory, character), fighter.frame, 1, character.id, fighter.state, fighter.facing, fighter.powerActive));
      drawShikigamiFollower(ctx, fighter, loadout?.equippedShikigami?.[character.id], fighter.frame, 1);
      if (fighter.attackData && fighter.state === 'attacking') drawAttackEffect(ctx, fighter.x, fighter.y, fighter.attackData, fighter.attackData.progress, fighter.facing, fighter.attackData.color || character.color, fighter.attackData.isNormal, character.id, character.power, fighter.powerActive);
      if (fighter.attackData && fighter.state === 'superAttack') drawSuperEffect(ctx, fighter.x, fighter.y, character.color, fighter.attackData.progress, character.superMove?.name, character.id);
      for (const effect of fighter.hitEffects || []) drawHitSparks(ctx, effect.x, effect.y, effect.color, fighter.frame, effect.spawnFrame);
      drawProjectiles(ctx, fighter);
      return label;
    };

    const render = state => {
      const fighters = unpackElement6Fighters(state);
      const hostFighter = fighters.host;
      const guestFighter = fighters.guest;
      ctx.clearRect(0, 0, ONLINE_STAGE_WIDTH, ONLINE_STAGE_HEIGHT);
      drawBackground(ctx, ONLINE_STAGE_WIDTH, ONLINE_STAGE_HEIGHT, state.frame, 'splitcity');
      drawPlatforms(ctx, ONLINE_PLATFORMS, state.frame, 'splitcity');
      drawFighter(hostFighter, hostCharacter, hostLoadout, isHost ? 'YOU' : 'OPPONENT');
      drawFighter(guestFighter, guestCharacter, guestLoadout, isHost ? 'OPPONENT' : 'YOU');

      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, ONLINE_STAGE_HEIGHT - 80, ONLINE_STAGE_WIDTH, 80);
      drawHealthBar(ctx, 40, ONLINE_STAGE_HEIGHT - 66, hostFighter.damage, 280, hostCharacter.color, `${hostCharacter.name}${isHost ? ' (YOU)' : ''}`, hostFighter.stocks);
      drawHealthBar(ctx, ONLINE_STAGE_WIDTH - 320, ONLINE_STAGE_HEIGHT - 66, guestFighter.damage, 280, guestCharacter.color, `${guestCharacter.name}${!isHost ? ' (YOU)' : ''}`, guestFighter.stocks);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(mode === 'ranked' ? 'ONLINE RANKED · ROLLBACK' : 'ONLINE UNRANKED · ROLLBACK', ONLINE_STAGE_WIDTH / 2, ONLINE_STAGE_HEIGHT - 50);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '9px Orbitron';
      ctx.fillText(`ELO ${myElo || 1000} vs ${oppElo || 1000}`, ONLINE_STAGE_WIDTH / 2, ONLINE_STAGE_HEIGHT - 34);

      if (showDiagnosticsRef.current && session) {
        const stats = session.getStats();
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(ONLINE_STAGE_WIDTH - 245, 10, 235, 126);
        ctx.fillStyle = '#00FF88';
        ctx.font = '10px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`PING: ${Math.round(transport.latencyMs || 0)}ms`, ONLINE_STAGE_WIDTH - 235, 30);
        ctx.fillText(`FRAME: ${stats.currentFrame}`, ONLINE_STAGE_WIDTH - 235, 47);
        ctx.fillText(`CONFIRMED: ${stats.confirmedFrame}`, ONLINE_STAGE_WIDTH - 235, 64);
        ctx.fillText(`ROLLBACKS: ${stats.rollbackCount}`, ONLINE_STAGE_WIDTH - 235, 81);
        ctx.fillText(`LARGEST: ${stats.largestRollback} frames`, ONLINE_STAGE_WIDTH - 235, 98);
        ctx.fillText(`DESYNCS: ${stats.desyncs}`, ONLINE_STAGE_WIDTH - 235, 115);
      }
    };

    const finishMatch = winningRole => {
      if (finished) return;
      finished = true;
      const result = winningRole === role ? 'me' : winningRole === 'draw' ? 'draw' : 'opp';
      setWinner(result);
      try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: winningRole }).catch(() => {}); } catch {}
    };

    const start = async () => {
      try {
        transport = new SupabaseRollbackTransport({ matchId, playerId, mode });
        session = new RollbackSession({
          matchId,
          playerId,
          playerRole: role,
          initialState,
          stepFrame: stepElement6OnlineFrame,
          sendInput: packet => transport.sendInput(packet),
          sendChecksum: packet => transport.sendChecksum(packet),
          inputDelay: 2,
          maxRollbackFrames: 12,
          historySize: 120,
          onDesync: () => setNetworkError('The match desynced. Open diagnostics with F3.'),
          onFrame: ({ state }) => {
            for (const event of state.events || []) {
              if (event.type === 'superHit') sfx.superImpact();
              else if (event.type === 'heavyHit') sfx.heavyHit();
              else if (event.type === 'hit') sfx.hit();
            }
          },
        });

        let markPeerReady;
        const peerReady = new Promise(resolve => { markPeerReady = resolve; });
        const touchPeer = () => { lastPeerMessageAt = Date.now(); };
        transport.on('input', packet => { touchPeer(); session.receiveRemoteInput(packet); });
        transport.on('checksum', packet => { touchPeer(); session.receiveRemoteChecksum(packet); });
        transport.on('control', packet => {
          touchPeer();
          if (packet.kind === 'ready') {
            transport.sendControl('ready-ack').catch(() => {});
            markPeerReady();
          } else if (packet.kind === 'ready-ack') markPeerReady();
          else if (packet.kind === 'disconnect') finishMatch(role);
        });

        await transport.connect();
        setConnectionText('WAITING FOR OPPONENT…');
        readyTimer = setInterval(() => transport.sendControl('ready').catch(() => {}), 500);
        const readyTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Opponent did not connect in time.')), 20000));
        await Promise.race([peerReady, readyTimeout]);
        clearInterval(readyTimer);
        readyTimer = null;
        setConnectionText('CONNECTED');
        try { db.entities.OnlineMatch.update(matchId, { status: 'active' }).catch(() => {}); } catch {}
        pingTimer = setInterval(() => transport.ping().catch(() => {}), 1000);

        const keybinds = getKeybinds(settings);
        let lastTime = performance.now();
        let accumulator = 0;
        const loop = now => {
          if (stopped || finished) return;
          accumulator += Math.min(100, now - lastTime);
          lastTime = now;
          let steps = 0;
          while (accumulator >= FRAME_MS && steps < 6) {
            const gamepad = settings?.controllerEnabled === false ? null : readGamepadInput(0);
            const input = pausedRef.current ? NO_INPUT : mergeInput(readPlayerInput(keys, keybinds.p1), gamepad);
            const state = session.advance(input);
            if (state.winner) { finishMatch(state.winner); break; }
            accumulator -= FRAME_MS;
            steps += 1;
          }
          if (Date.now() - lastPeerMessageAt > 10000) setConnectionText('RECONNECTING…');
          else setConnectionText('CONNECTED');
          if (Date.now() - lastPeerMessageAt > 25000) { finishMatch(role); return; }
          render(session.getRenderableState());
          animationFrame = requestAnimationFrame(loop);
        };
        animationFrame = requestAnimationFrame(loop);
      } catch (error) {
        if (!stopped) {
          setNetworkError(error?.message || 'Could not start rollback match.');
          setConnectionText('CONNECTION FAILED');
        }
      }
    };

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      clearInterval(pingTimer);
      clearInterval(readyTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      transport?.close('screen-left').catch(() => {});
    };
  }, [gameStarted, matchId, playerId, role, mode, myChar, oppChar]);

  const handleQuit = () => {
    try { db.entities.OnlineMatch.update(matchId, { status: 'finished', winner: isHost ? 'guest' : 'host' }).catch(() => {}); } catch {}
    onEnd?.({ won: false, disconnected: true, mode });
  };

  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  if (winner) {
    const won = winner === 'me';
    return (
      <div className="relative flex flex-col items-center gap-2 w-full min-h-[500px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg gap-5">
          <span className="text-5xl font-heading drop-shadow-lg" style={{ color: winner === 'draw' ? '#FFFFFF' : won ? '#FFD700' : '#FF4444' }}>
            {winner === 'draw' ? 'DRAW' : won ? 'YOU WIN!' : 'YOU LOSE'}
          </span>
          <button onClick={() => onEnd?.({ won, draw: winner === 'draw', mode })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">CONTINUE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between items-center w-full px-1 max-w-[1280px]">
        <button onClick={handleQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Forfeit</button>
        <span className="text-[10px] font-heading text-accent">{connectionText}</span>
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80">⏸ Pause (ESC)</button>
      </div>
      {networkError && <p className="text-xs text-destructive font-body">{networkError}</p>}
      <canvas ref={canvasRef} width={ONLINE_STAGE_WIDTH} height={ONLINE_STAGE_HEIGHT} className="border-2 border-border rounded-lg shadow-2xl w-full" style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }} />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && <PauseMenu onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={handleQuit} />}
    </div>
  );
}

