import React, { useRef, useEffect, useState } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { createFighter, updateFighter, checkHit, applyHit, updateAI, CPU_DIFFICULTY } from './fighter.js';
import { drawStickman, drawPlatforms, drawBackground, drawHitSparks, drawDoubleJumpParticles } from './renderer.js';
import { drawSoccerKit, getAccessory, getEquippedAccessories, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getCrossoverColor } from './crossovers.js';
import { drawShikigamiFollower } from './shikigami.js';
import { getCharNumber, getCharName } from './characterNumber.js';
import { music } from './music.js';
import { mergeBotCosmetics } from './botCosmetics.js';
import { sfx } from './sfx.js';
import { getKeybinds, readPlayerInput, readSinglePlayerInput, getSchemeKeybinds, getSoloKeybinds } from './keybinds.js';
import { readGamepadInput } from './controllerProfiles.js';
import { applyElement } from './elements.js';
import { soccerAI, penaltyKeeperAI, penaltyShooterAI } from './soccerAI.js';

// Merge gamepad input with keyboard so both work simultaneously
const mergeGp = (kb, gp) => gp ? {
  left: kb.left || gp.left, right: kb.right || gp.right,
  jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down,
  sig: kb.sig || gp.sig, power: kb.power || gp.power,
  superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy,
} : kb;
import { EMOTES, drawEmote } from './emotes.js';
import { getEmoteForKey } from './emoteSlots.js';
import PauseMenu from './PauseMenu.jsx';
import { useClipRecorder } from './useClipRecorder.js';
import GameIcon from "./GameIcon.jsx";

const W = 1280;
const H = 720;

// ── Field layout: goals are BEHIND the wall (ball must pass through a narrow gap) ──
const WALL_TOP = 80;
const WALL_GAP_TOP = 480;   // goal gap starts here (taller nets)
const WALL_GAP_BOT = 620;   // goal gap ends at ground level
const WALL_INNER_L = 40;
const WALL_INNER_R = 1240;
const BACK_WALL_L = 5;      // back of left goal net
const BACK_WALL_R = 1275;   // back of right goal net
const GOAL_LINE_L = 20;     // ball must pass this line (behind wall) to score left
const GOAL_LINE_R = 1260;   // ball must pass this line (behind wall) to score right
const WIN_GOALS = 10;

// Split wall segments — solid above the gap, gap below for the goal mouth
const SOCCER_PLATFORMS = [
  { x: 40, y: 620, w: 1200, h: 48 },                                    // ground
  { x: 20, y: WALL_TOP, w: 20, h: WALL_GAP_TOP - WALL_TOP },             // left wall (above gap)
  { x: 1240, y: WALL_TOP, w: 20, h: WALL_GAP_TOP - WALL_TOP },          // right wall (above gap)
];

const GOAL_TOP = WALL_GAP_TOP;
const GOAL_BOT = WALL_GAP_BOT;

// Team / net colors — blue (left) vs purple (right)
const TEAM_LEFT_COLOR = '#4488FF';
const TEAM_RIGHT_COLOR = '#AA44FF';

// ── Penalty shootout positions ──
const PEN_SPOT_R = Math.round(W / 2 + (GOAL_LINE_R - W / 2) / 3);
const PEN_SPOT_L = Math.round(W / 2 - (W / 2 - GOAL_LINE_L) / 3);
const PEN_KEEPER_R = WALL_INNER_R - 15;
const PEN_KEEPER_L = WALL_INNER_L + 15;
const PEN_SHOTS_PER_PLAYER = 5;

// ── Soccer AI + penalty AI are imported from ../../game/engine/soccerAI.js ──

export default function SoccerFighter({ p1Char, p2Char, p2IsCPU, p1IsCPU = false, cpuDifficulty, round, totalRounds, onEnd, onRematch, sfxVolume = 70, musicVolume = 50, headSoccer = false, penaltiesEnabled = false, penaltiesOnly = false, settings = {}, teamMode = false, p1bChar, p2bChar, extraPlatforms = null,   p1Jersey = true, p2Jersey = true, p1Element = 'basic', p2Element = 'basic', tournamentMode = false, equippedSkins = {}, equippedAccessories = {}, localScheme = null, enableStream = false, lanConnection = null, lanRole = null, customCharsData = {}, equippedCrossovers = {}, equippedShikigami = {}, equippedEmotes = {}, remoteState = null, onStateExport = null, isOnlineHost = false, onSyncStateChange = null }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  // Merge bot cosmetics — bots get random accessories every match
  const _botIds = [];
  if (p2IsCPU) { _botIds.push(p2Char); if (p2bChar) _botIds.push(p2bChar); }
  if (p1IsCPU) { _botIds.push(p1Char); }
  const { equippedAccessories: mergedAccessories } = mergeBotCosmetics(equippedAccessories, {}, _botIds);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const scoreRef = useRef({ p1: 0, p2: 0 });
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState(null);
  const [goalFlash, setGoalFlash] = useState(null);
  const [extraTime, setExtraTime] = useState(false);
  const extraTimeRef = useRef(false);
  const suddenDeathRef = useRef(false);
  const penPhaseRef = useRef(false);
  const penStateRef = useRef('setup');
  const penShooterRef = useRef(1);
  const penTargetGoalRef = useRef('right');
  const penScoreRef = useRef({ p1: 0, p2: 0 });
  const penShotNumRef = useRef(0);
  const penBallLaunchedRef = useRef(false);
  const penBallTimerRef = useRef(0);
  const penResolveTimerRef = useRef(0);
  const penSetupTimerRef = useRef(0);
  const penInputTimerRef = useRef(0);
  const penHistoryRef = useRef({ p1: [], p2: [] });
  const penShooterChoiceRef = useRef(null);
  const penKeeperChoiceRef = useRef(null);
  const penTransitionTimerRef = useRef(0);
  const penTransDataRef = useRef(null);
  const penTransPosRef = useRef({ keeperX: 0, kickerX: 0, ballX: 0, ballY: 0 });
  const [penScore, setPenScore] = useState({ p1: 0, p2: 0 });
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const resetCountdownRef = useRef(0);
  const slowMoRef = useRef(0);
  const goalFlashColorRef = useRef('#FFD700');
  const p1PenDirRef = useRef(null);
  const p2PenDirRef = useRef(null);
  useClipRecorder(canvasRef);
  const remoteInputRef = useRef(null);
  const remoteStateRef = useRef(null);
  const onStateExportRef = useRef(null);
  const lastSnapshotAtRef = useRef(0);
  const lastCorrectedFrameRef = useRef(-1);
  const p1EmoteRef = useRef(null);
  const p2EmoteRef = useRef(null);
  const equippedShikigamiRef = useRef(equippedShikigami);
  equippedShikigamiRef.current = equippedShikigami;
  useEffect(() => { remoteStateRef.current = remoteState; }, [remoteState]);
  useEffect(() => { onStateExportRef.current = onStateExport; }, [onStateExport]);

  // Host canvas streaming for LAN spectators (JPEG frames over the data channel)
  useEffect(() => {
    if (!enableStream || !lanConnection?.startStream) return;
    let tries = 0;
    const start = () => { if (canvasRef.current) lanConnection.startStream(canvasRef.current, 8); else if (tries++ < 60) setTimeout(start, 50); };
    start();
    return () => { if (lanConnection.stopStream) lanConnection.stopStream(); };
  }, [enableStream, lanConnection]);

  const getCharData = (id) => customCharsData[id] || HEROES.find(h => h.id === id) || VILLAINS.find(v => v.id === id) || GUARDIANS.find(g => g.id === id);

  useEffect(() => {
    music.setVolume(musicVolume);
    sfx.setVolume(sfxVolume);
    music.play('soccer');
    return () => music.stop();
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else setGameStarted(true);
  }, [countdown]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (lanConnection) {
      lanConnection.onMessage((msg) => { if (msg && msg.type === 'input') remoteInputRef.current = msg.input; });
    }

    const char1 = getCharData(p1Char);
    const char2 = getCharData(p2Char);
    if (!char1 || !char2) return;

    const f1 = createFighter({ ...char1, stats: applyElement(char1.stats || {}, p1Element) }, 300, 572, 1);
    const f2 = createFighter({ ...char2, stats: applyElement(char2.stats || {}, p2Element) }, 980, 572, -1);
    f1.grounded = true; f2.grounded = true;
    f2.isAI = p2IsCPU;
    f1.isAI = p1IsCPU;
    f2.cpuDifficulty = cpuDifficulty;
    f1.gameMode = 'soccer'; f2.gameMode = 'soccer';
    f1.team = 1; f2.team = 2;

    // 2v2 team mode: one AI teammate per side
    let f1b = null, f2b = null;
    if (teamMode) {
      const c1b = getCharData(p1bChar) || char1;
      const c2b = getCharData(p2bChar) || char2;
      f1b = createFighter(c1b, 360, 572, 1);
      f2b = createFighter(c2b, 920, 572, -1);
      f1b.grounded = true; f2b.grounded = true;
      f1b.isAI = true; f2b.isAI = true;
      f1b.cpuDifficulty = cpuDifficulty; f2b.cpuDifficulty = cpuDifficulty;
      f1b.gameMode = 'soccer'; f2b.gameMode = 'soccer';
      f1b.team = 1; f2b.team = 2;
    }
    const allFighters = teamMode ? [f1, f1b, f2, f2b] : [f1, f2];
    const fieldPlatforms = (extraPlatforms && extraPlatforms.length)
      ? [...SOCCER_PLATFORMS, ...extraPlatforms.filter(p => p && p.y < 615)]
      : SOCCER_PLATFORMS;

    const ballR = headSoccer ? 16 : 12;
    const ball = { x: 640, y: 300, vx: 0, vy: 0, r: ballR, lastTouch: null, lastTeam: null, damage: 1 };

    // Internal timer is DOUBLE the displayed value — displayed "90" actually takes 180 real seconds.
    // The displayed timer = ceil(internalTimer / 2), so each visible number lasts 2 real seconds.
    const baseDisplayTime = headSoccer ? 60 : 90;
    const baseTime = baseDisplayTime * 2;
    gameRef.current = { f1, f2, allFighters, fieldPlatforms, ball, running: true, timer: 0, maxTime: baseTime, displayTimer: 0, goalLog: [], startedAt: performance.now(), weather: ['rainy','thunder','snow','sunny','cloudy'][Math.floor(Math.random()*5)] };

    // Online soccer has a host-authoritative snapshot in addition to normal
    // input forwarding.  The snapshot contains every gameplay-critical value:
    // stage timer/score, each fighter's position and velocity, and the ball.
    // This corrects even a one-pixel ball drift without ever ending a match.
    const fighterSnapshot = (fighter) => ({
      x: fighter.x, y: fighter.y, vx: fighter.vx, vy: fighter.vy,
      facing: fighter.facing, grounded: fighter.grounded,
      doubleJumped: fighter.doubleJumped, damage: fighter.damage,
      hitstun: fighter.hitstun, invuln: fighter.invuln,
      attackData: fighter.attackData ? { ...fighter.attackData } : null,
      frame: fighter.frame, animTimer: fighter.animTimer,
    });
    const snapshot = () => ({
      version: 'soccer-state-v1',
      frame: Math.floor((performance.now() - gameRef.current.startedAt) / (1000 / 60)),
      stage: { timer: gameRef.current.timer, maxTime: gameRef.current.maxTime, displayTimer: gameRef.current.displayTimer, weather: gameRef.current.weather },
      score: { ...scoreRef.current },
      fighters: allFighters.map(fighterSnapshot),
      ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, r: ball.r, damage: ball.damage, lastTeam: ball.lastTeam, prevX: ball.prevX },
      resetCountdown: resetCountdownRef.current,
    });
    const restoreSnapshot = (next) => {
      if (!next || next.version !== 'soccer-state-v1' || !Array.isArray(next.fighters)) return false;
      const local = snapshot();
      const drift = Math.abs((local.ball.x || 0) - (next.ball?.x || 0)) + Math.abs((local.ball.y || 0) - (next.ball?.y || 0))
        + Math.abs((local.fighters[0]?.x || 0) - (next.fighters[0]?.x || 0))
        + Math.abs((local.fighters[1]?.x || 0) - (next.fighters[1]?.x || 0));
      next.fighters.forEach((data, index) => { if (allFighters[index] && data) Object.assign(allFighters[index], data); });
      if (next.ball) Object.assign(ball, next.ball, { trail: [] });
      if (next.stage) Object.assign(gameRef.current, next.stage);
      if (next.score) { scoreRef.current = { ...next.score }; setScore({ ...next.score }); }
      if (Number.isFinite(next.resetCountdown)) resetCountdownRef.current = next.resetCountdown;
      // Only announce a correction once per received frame. Tiny normal
      // prediction differences are silently corrected; meaningful drift pauses.
      if (drift > 8 && lastCorrectedFrameRef.current !== next.frame) {
        lastCorrectedFrameRef.current = next.frame;
        onSyncStateChange?.();
      }
      return true;
    };

    const soccerStats = {
      p1: { shots: 0, shotsOnTarget: 0, goals: 0, misses: 0, saves: 0, possession: 0 },
      p2: { shots: 0, shotsOnTarget: 0, goals: 0, misses: 0, saves: 0, possession: 0 },
    };

    // Register a shot for a team — checks if it's heading toward the opponent's goal
    const registerShot = (team) => {
      const s = team === 1 ? soccerStats.p1 : soccerStats.p2;
      s.shots++;
      const attackGoalX = team === 1 ? GOAL_LINE_R : GOAL_LINE_L;
      const headingToGoal = (team === 1 && ball.vx > 2) || (team === 2 && ball.vx < -2);
      if (headingToGoal) {
        const timeToGoal = Math.abs((attackGoalX - ball.x) / Math.max(Math.abs(ball.vx), 0.5));
        const ballYAtGoal = ball.y + ball.vy * timeToGoal + 0.5 * 0.35 * timeToGoal * timeToGoal;
        if (ballYAtGoal > GOAL_TOP - 40 && ballYAtGoal < GOAL_BOT + 40) {
          s.shotsOnTarget++;
          ball._onTarget = true;
          ball._onTargetTeam = team;
        } else {
          s.misses++;
        }
      } else {
        s.misses++;
      }
    };

    // Weather particles (cosmetic only — no gameplay effect)
    const wParticles = [];
    if (gameRef.current.weather === 'rainy' || gameRef.current.weather === 'thunder') {
      for (let i = 0; i < 130; i++) wParticles.push({ x: Math.random()*W, y: Math.random()*H, sp: 9+Math.random()*7, len: 10+Math.random()*8 });
    } else if (gameRef.current.weather === 'snow') {
      for (let i = 0; i < 100; i++) wParticles.push({ x: Math.random()*W, y: Math.random()*H, sp: 1+Math.random()*1.5, r: 1.5+Math.random()*2, sw: Math.random()*Math.PI*2 });
    }
    let thunderFlash = 0;

    // Penalties-only mode: skip regular match, start penalty shootout immediately
    if (penaltiesOnly) {
      penPhaseRef.current = true;
      penStateRef.current = 'setup';
      penSetupTimerRef.current = 2;
      penShooterRef.current = 1;
      penTargetGoalRef.current = 'right';
      penShotNumRef.current = 0;
      penScoreRef.current = { p1: 0, p2: 0 };
      penHistoryRef.current = { p1: [], p2: [] };
      setPenScore({ p1: 0, p2: 0 });
    }

    const finish = (p1Won) => {
      if (!gameRef.current) return;
      gameRef.current.running = false;
      const finalScore = { ...scoreRef.current };
      gameRef.current.result = { p1Won, score: finalScore, teamMode, soccerStats: JSON.parse(JSON.stringify(soccerStats)), p1Char, p2Char, goalLog: [...(gameRef.current.goalLog || [])] };
      if (teamMode) {
        setWinner(p1Won === null ? 'DRAW' : (p1Won ? 'TEAM BLUE' : 'TEAM PURPLE'));
      } else {
        setWinner(p1Won === null ? 'DRAW' : (p1Won ? char1.name : char2.name));
      }
    };

    const scoreGoal = (scorer) => {
      scoreRef.current = { ...scoreRef.current, [`p${scorer}`]: scoreRef.current[`p${scorer}`] + 1 };
      if (gameRef.current) gameRef.current.goalLog.push({ team: scorer, second: Math.max(1, Math.round((performance.now() - (gameRef.current.startedAt || performance.now())) / 2000)) });
      if (scorer === 1) soccerStats.p1.goals++;
      else if (scorer === 2) soccerStats.p2.goals++;
      setScore({ ...scoreRef.current });
      const scorerChar = ball.lastTouch ? ball.lastTouch.char : null;
      const scorerName = scorerChar ? scorerChar.name : (scorer === 1 ? 'Team Blue' : 'Team Purple');
      const scorerColor = scorerChar ? scorerChar.color : (scorer === 1 ? TEAM_LEFT_COLOR : TEAM_RIGHT_COLOR);
      goalFlashColorRef.current = scorerColor;
      setGoalFlash(`GOAL! ${scorerName} SCORED!`);
      sfx.coin();
      sfx.cheer();
      setTimeout(() => setGoalFlash(null), 2000);
      ball.x = 640; ball.y = 300; ball.vx = 0; ball.vy = 0; ball.damage = 1; ball._prePowerDamage = undefined; ball.lastTeam = null; ball.lastTouch = null; ball._onTarget = false; ball._onTargetTeam = null;
      const basePos = teamMode
        ? [[300, 620, 1], [360, 620, 1], [980, 620, -1], [920, 620, -1]]
        : [[300, 620, 1], [980, 620, -1]];
      allFighters.forEach((f, i) => { const p = basePos[i]; f.x = p[0]; f.y = p[1]; f.facing = p[2]; f.vx = 0; f.vy = 0; });

      // Post-goal countdown — freeze the game for 3 seconds
      resetCountdownRef.current = 3;

      // Sudden death: first goal wins immediately
      if (suddenDeathRef.current) { finish(scorer === 1); return; }
      if (scoreRef.current.p1 >= WIN_GOALS) { finish(true); return; }
      if (scoreRef.current.p2 >= WIN_GOALS) { finish(false); return; }
    };

    const penaltyResolve = (result) => {
      if (penStateRef.current === 'resolved') return;
      penStateRef.current = 'resolved';
      penResolveTimerRef.current = 2;
      const shooter = penShooterRef.current;
      if (result === 'goal') {
        penScoreRef.current = { ...penScoreRef.current, [`p${shooter}`]: penScoreRef.current[`p${shooter}`] + 1 };
        setPenScore({ ...penScoreRef.current });
        setGoalFlash('PENALTY SCORED!');
        sfx.cheer();
      } else {
        if (result === 'save') {
          const savingTeam = penShooterRef.current === 1 ? 2 : 1;
          if (savingTeam === 1) soccerStats.p1.saves++;
          else soccerStats.p2.saves++;
        }
        if (result === 'goal') {
          const scoringTeam = penShooterRef.current;
          if (scoringTeam === 1) soccerStats.p1.goals++;
          else soccerStats.p2.goals++;
        }
        setGoalFlash(result === 'save' ? 'SAVED!' : 'MISSED!');
      }
      penHistoryRef.current = {
        ...penHistoryRef.current,
        [`p${shooter}`]: [...(penHistoryRef.current[`p${shooter}`] || []), result === 'goal' ? 'goal' : 'miss'],
      };
      setTimeout(() => setGoalFlash(null), 1800);
    };

    const penaltyNext = () => {
      penShotNumRef.current++;
      const p1S = penScoreRef.current.p1, p2S = penScoreRef.current.p2;
      const sn = penShotNumRef.current;
      const p1Taken = Math.ceil(sn / 2), p2Taken = Math.floor(sn / 2);
      let winner = null;
      if (p1Taken >= PEN_SHOTS_PER_PLAYER && p2Taken >= PEN_SHOTS_PER_PLAYER) {
        if (p1S !== p2S) winner = p1S > p2S;
        else if (sn % 2 === 0 && p1S !== p2S) winner = p1S > p2S;
      } else {
        if (p1S > p2S + (PEN_SHOTS_PER_PLAYER - p2Taken)) winner = true;
        if (p2S > p1S + (PEN_SHOTS_PER_PLAYER - p1Taken)) winner = false;
      }
      if (winner !== null) { finish(winner); return; }
      penShooterRef.current = penShooterRef.current === 1 ? 2 : 1;
      penTargetGoalRef.current = penTargetGoalRef.current === 'right' ? 'left' : 'right';
      penBallLaunchedRef.current = false;
      penBallTimerRef.current = 0;
      penSetupTimerRef.current = 1.5;
      penStateRef.current = 'setup';
      const shooter = penShooterRef.current === 1 ? f1 : f2;
      if (shooter) shooter._penAIDelay = null;
    };

    const kd = e => {
      keysRef.current[e.key] = true;
      keysRef.current[e.key.toLowerCase()] = true;
      // Penalty input tracking — last up/down press before lock-in is committed
      if (penStateRef.current === 'input') {
        const pk = getKeybinds(settings);
        const soloKb = getSoloKeybinds(settings);
        const p1Binds = (soloKb && p2IsCPU && !lanConnection) ? soloKb : pk.p1;
        if (e.key === p1Binds.jump) p1PenDirRef.current = 'up';
        if (e.key === p1Binds.down) p1PenDirRef.current = 'down';
        if (e.key === pk.p2.jump) p2PenDirRef.current = 'up';
        if (e.key === pk.p2.down) p2PenDirRef.current = 'down';
      }
      // Emotes — use equipped emote slots (works in solo, couch co-op, and LAN)
      if (['1','2','3','4','5','6','7','8','9','0'].includes(e.key)) {
        const g = gameRef.current;
        if (g) {
          const { f1, f2 } = g;
          const twoHumans = !p1IsCPU && !p2IsCPU;
          const emoteMode = twoHumans ? 'coop' : 'solo';
          if (emoteMode === 'coop' && ['1','2','3','4','5'].includes(e.key)) {
            const emote = getEmoteForKey(e.key, equippedEmotes, 2, 'coop');
            if (emote && f2 && f2.grounded && !f2.emote) f2.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
          } else if (!p1IsCPU) {
            const emote = getEmoteForKey(e.key, equippedEmotes, 1, emoteMode);
            if (emote && f1 && f1.grounded && !f1.emote) f1.emote = { id: emote.id, timer: emote.duration, maxTimer: emote.duration, progress: 0, key: e.key };
          }
        }
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        pausedRef.current = !pausedRef.current; setPaused(v => !v);
      }
      if (!['F5', 'F12'].includes(e.key)) e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let lastTime = performance.now();
    let shakeMag = 0;
    let prevGpStart = false;
    const attackMul = headSoccer ? 2.0 : 1.0;

    const loop = (now) => {
      if (!gameRef.current?.running) return;
      // Gamepad input (slot 0 = P1, slot 1 = P2) — read once per frame
      const _gpEnabled = settings?.controllerEnabled !== false;
      const _gp1 = _gpEnabled ? readGamepadInput(0) : null;
      const _gp2 = _gpEnabled ? readGamepadInput(1) : null;
      // Controller cannot pause — use mouse/trackpad or keyboard Esc/P to pause.
      prevGpStart = !!_gp1?.start;
      // Online/LAN pauses are local input menus only; the shared simulation
      // continues so the opponent never freezes with us.
      if (pausedRef.current && !lanConnection) { requestAnimationFrame(loop); return; }
      if (lanConnection && lanConnection.stalledRef && lanConnection.stalledRef.current) { lastTime = now; requestAnimationFrame(loop); return; }

      const rawDt = Math.min((now - lastTime) / 1000, 0.05);
      const inSlowMo = slowMoRef.current > 0;
      if (inSlowMo) slowMoRef.current -= rawDt;
      const dt = inSlowMo ? rawDt * 0.3 : rawDt;
      const ts = inSlowMo ? 0.3 : 1;
      lastTime = now;
      const { f1, f2, ball } = gameRef.current;
      // Guests predict locally between packets, then use the authoritative host
      // snapshot as a correction point. This keeps both canvases on the same
      // field position even when packets arrive late or a ball collision differs.
      if (!isOnlineHost && remoteStateRef.current) restoreSnapshot(remoteStateRef.current);
      if (!suddenDeathRef.current && resetCountdownRef.current <= 0) { const _mt = gameRef.current.maxTime || baseTime; if (gameRef.current.timer < _mt) gameRef.current.timer += dt; }
      if (resetCountdownRef.current > 0) resetCountdownRef.current -= dt;

      // Display timer: internal is double, so divide by 2 and ceil
      gameRef.current.displayTimer = Math.ceil(gameRef.current.timer / 2);

      const k = keysRef.current;
      const noInput = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
      const _kb = getKeybinds(settings);
      const _soloKb = getSoloKeybinds(settings);
      const _bp = settings.botPersonality || 'balanced';
      let p1In, p2In;
      let _rawP1 = null, _rawP2 = null; // raw per-frame inputs (for low/high shot detection)
      const _gameCtx = { p1Score: scoreRef.current.p1, p2Score: scoreRef.current.p2, timer: (gameRef.current.maxTime || baseTime) - gameRef.current.timer, suddenDeath: suddenDeathRef.current };
      // Botvbot: assign different personalities so one plays aggressive, the other defensive —
      // creates dynamic matches instead of both bots chasing the ball identically
      if (p1IsCPU && p2IsCPU && !f1._aiPersonality) {
        const pool = ['aggressive', 'defensive', 'balanced'];
        f1._aiPersonality = pool[Math.floor(Math.random() * pool.length)];
        f2._aiPersonality = f1._aiPersonality === 'aggressive' ? 'defensive'
          : f1._aiPersonality === 'defensive' ? 'aggressive'
          : (Math.random() < 0.5 ? 'aggressive' : 'defensive');
      }
      if (penPhaseRef.current) {
        const shooterIsP1 = penShooterRef.current === 1;
        if (penStateRef.current === 'input') {
          // 5s input window — last up/down press before lock-in is committed
          const shooterIsCPU = shooterIsP1 ? p1IsCPU : p2IsCPU;
          const keeperIsCPU = shooterIsP1 ? p2IsCPU : p1IsCPU;
          if (!shooterIsCPU) {
            const dir = shooterIsP1 ? p1PenDirRef.current : p2PenDirRef.current;
            penShooterChoiceRef.current = { low: (dir || 'up') === 'down' };
          }
          if (!keeperIsCPU) {
            const dir = shooterIsP1 ? p2PenDirRef.current : p1PenDirRef.current;
            penKeeperChoiceRef.current = { jump: (dir || 'up') === 'up' };
          }
          p1In = noInput; p2In = noInput;
        } else if (penStateRef.current === 'ballInPlay') {
          // Keeper dive is driven directly below for reliable saves
          p1In = noInput; p2In = noInput;
        } else {
          p1In = noInput; p2In = noInput;
        }
      } else if (lanConnection) {
        const localPlayer = lanRole === 'host' ? 1 : 2;
        const scheme = localScheme || (localPlayer === 1 ? 'p1' : 'p2');
        const localBinds = getSchemeKeybinds(settings, scheme);
        const localRaw = mergeGp(readPlayerInput(k, localBinds), _gp1);
        const remoteRaw = remoteInputRef.current || noInput;
        _rawP1 = localPlayer === 1 ? localRaw : remoteRaw;
        _rawP2 = localPlayer === 2 ? localRaw : remoteRaw;
        // Respect CPU slots (used by LAN Tournament): a CPU side runs AI, never local/remote human input.
        p1In = p1IsCPU ? soccerAI(f1, ball, f2, cpuDifficulty, _bp, _gameCtx) : { ..._rawP1, superMove: false, heavy: false };
        p2In = p2IsCPU ? soccerAI(f2, ball, f1, cpuDifficulty, _bp, _gameCtx) : { ..._rawP2, superMove: false, heavy: false };
        lanConnection.sendMessage({ type: 'input', input: localRaw });
      } else {
        const soloPlay = p2IsCPU && !p1IsCPU;
        _rawP1 = p1IsCPU ? null : mergeGp(soloPlay && _soloKb ? readPlayerInput(k, _soloKb) : (p2IsCPU ? readSinglePlayerInput(k, _kb.p1, _kb.p2) : readPlayerInput(k, _kb.p1)), _gp1);
        _rawP2 = p2IsCPU ? null : mergeGp(readPlayerInput(k, _kb.p2), _gp2);
        p1In = p1IsCPU ? soccerAI(f1, ball, f2, cpuDifficulty, _bp, _gameCtx) : { ..._rawP1, superMove: false, heavy: false };
        p2In = p2IsCPU ? soccerAI(f2, ball, f1, cpuDifficulty, _bp, _gameCtx) : { ..._rawP2, superMove: false, heavy: false };
      }

      // 2v2: AI inputs for extra teammates (penalties are disabled in team mode)
      let f1bIn = null, f2bIn = null;
      if (teamMode && !penPhaseRef.current) {
        f1bIn = soccerAI(f1b, ball, f2, cpuDifficulty, _bp, _gameCtx);
        f2bIn = soccerAI(f2b, ball, f1, cpuDifficulty, _bp, _gameCtx);
      }
      // Freeze all inputs during post-goal countdown
      if (resetCountdownRef.current > 0) { p1In = noInput; p2In = noInput; if (f1bIn) f1bIn = noInput; if (f2bIn) f2bIn = noInput; }

      // ── Penalty shootout state machine ──
      if (penPhaseRef.current) {
        const targetIsRight = penTargetGoalRef.current === 'right';
        if (penStateRef.current === 'setup') {
          penSetupTimerRef.current -= dt;
          if (targetIsRight) { f1.x = PEN_SPOT_R; f1.facing = 1; f2.x = PEN_KEEPER_R; f2.facing = -1; }
          else { f2.x = PEN_SPOT_L; f2.facing = -1; f1.x = PEN_KEEPER_L; f1.facing = 1; }
          f1.y = 620; f2.y = 620; f1.vx = 0; f2.vx = 0; f1.vy = 0; f2.vy = 0;
          f1.grounded = true; f2.grounded = true;
          const sx = penShooterRef.current === 1 ? f1.x : f2.x;
          ball.x = sx + (targetIsRight ? 25 : -25); ball.y = 608; ball.vx = 0; ball.vy = 0; ball.damage = 1; ball.lastTeam = null;
          if (penSetupTimerRef.current <= 0) {
            // Start 5s input window — CPU commits choices now
            penStateRef.current = 'input';
            penInputTimerRef.current = 5;
            penShooterChoiceRef.current = { low: false };
            penKeeperChoiceRef.current = { jump: false };
            p1PenDirRef.current = null;
            p2PenDirRef.current = null;
            if (p2IsCPU) {
              if (penShooterRef.current === 2) {
                penShooterChoiceRef.current = { low: Math.random() < 0.5 };
              } else {
                penKeeperChoiceRef.current = { jump: Math.random() < 0.5 };
              }
            }
            if (p1IsCPU) {
              if (penShooterRef.current === 1) {
                penShooterChoiceRef.current = { low: Math.random() < 0.5 };
              } else {
                penKeeperChoiceRef.current = { jump: Math.random() < 0.5 };
              }
            }
          }
        } else if (penStateRef.current === 'input') {
          // 5s input window — lock positions, players commit choices via key state
          if (targetIsRight) { f1.x = PEN_SPOT_R; f2.x = PEN_KEEPER_R; }
          else { f2.x = PEN_SPOT_L; f1.x = PEN_KEEPER_L; }
          f1.y = 620; f2.y = 620; f1.vx = 0; f2.vx = 0; f1.vy = 0; f2.vy = 0;
          f1.grounded = true; f2.grounded = true;
          const sx = penShooterRef.current === 1 ? f1.x : f2.x;
          ball.x = sx + (targetIsRight ? 25 : -25); ball.y = 608; ball.vx = 0; ball.vy = 0;
          penInputTimerRef.current -= dt;
          if (penInputTimerRef.current <= 0) {
            // Execute both choices simultaneously
            penStateRef.current = 'ballInPlay';
            penBallLaunchedRef.current = true;
            penBallTimerRef.current = 0;
            const shooter = penShooterRef.current === 1 ? f1 : f2;
            shooter.facing = targetIsRight ? 1 : -1;
            ball.lastTeam = penShooterRef.current;
            ball.damage = 2;
            ball.lastTouch = shooter;
            const sp = 22;
            const lowShot = penShooterChoiceRef.current?.low;
            ball.vx = (targetIsRight ? 1 : -1) * (lowShot ? 30 : sp); // low driven shot is fast and powerful
            ball.vy = lowShot ? -2 : -9.5; // low stays near the ground but reaches the net
            sfx.hit();
          }
        } else if (penStateRef.current === 'ballInPlay') {
          penBallTimerRef.current += dt;
          if (penBallTimerRef.current > 5) penaltyResolve('miss');
          if (Math.abs(ball.vx) < 0.5 && Math.abs(ball.vy) < 0.5 && ball.y + ball.r >= 619 && penBallTimerRef.current > 1) penaltyResolve('miss');
        } else if (penStateRef.current === 'resolved') {
          penResolveTimerRef.current -= dt;
          if (penResolveTimerRef.current <= 0) {
            // Start transition cutscene: keeper grabs ball, walks to new shooting spot; kicker walks to new goal
            const nextTargetIsRight = !targetIsRight;
            const newShooterX = nextTargetIsRight ? PEN_SPOT_R : PEN_SPOT_L;
            const newKeeperX = nextTargetIsRight ? PEN_KEEPER_R : PEN_KEEPER_L;
            const prevKeeper = penShooterRef.current === 1 ? f2 : f1;
            const prevShooter = penShooterRef.current === 1 ? f1 : f2;
            penTransDataRef.current = {
              prevKeeperStartX: prevKeeper.x, prevShooterStartX: prevShooter.x,
              prevKeeperEndX: newShooterX, prevShooterEndX: newKeeperX, duration: 3,
            };
            penStateRef.current = 'transition';
            penTransitionTimerRef.current = 3;
          }
        } else if (penStateRef.current === 'transition') {
          const td = penTransDataRef.current;
          if (td) {
            penTransitionTimerRef.current -= dt;
            const progress = Math.min(1, 1 - Math.max(0, penTransitionTimerRef.current / td.duration));
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            const prevKeeper = penShooterRef.current === 1 ? f2 : f1;
            const prevShooter = penShooterRef.current === 1 ? f1 : f2;
            const keeperX = td.prevKeeperStartX + (td.prevKeeperEndX - td.prevKeeperStartX) * ease;
            const kickerX = td.prevShooterStartX + (td.prevShooterEndX - td.prevShooterStartX) * ease;
            prevKeeper.facing = td.prevKeeperEndX > td.prevKeeperStartX ? 1 : -1;
            prevShooter.facing = td.prevShooterEndX > td.prevShooterStartX ? 1 : -1;
            let bx, by;
            if (progress < 0.85) { bx = keeperX; by = 520; }
            else { bx = td.prevKeeperEndX; by = 608; }
            penTransPosRef.current = { keeperX, kickerX, ballX: bx, ballY: by };
            if (penTransitionTimerRef.current <= 0) penaltyNext();
          }
        }
      }

      updateFighter(f1, p1In, fieldPlatforms, W, H, f2);
      updateFighter(f2, p2In, fieldPlatforms, W, H, f1);
      if (teamMode) {
        updateFighter(f1b, f1bIn || noInput, fieldPlatforms, W, H, f2);
        updateFighter(f2b, f2bIn || noInput, fieldPlatforms, W, H, f1);
      }
      // Update emote timers — cancel if airborne, decrement timer
      allFighters.forEach(f => {
        if (f.emote && f.emote.timer > 0) {
          if (!f.grounded) { f.emote = null; }
          else { f.emote.timer--; f.emote.progress = 1 - f.emote.timer / f.emote.maxTimer; if (f.emote.timer <= 0) { if (f.emote.key && keysRef.current[f.emote.key]) { f.emote.timer = f.emote.maxTimer; } else { f.emote = null; } } }
        }
      });

      // Clamp fighters within the inner field (skip during penalties — positions are locked)
      if (!penPhaseRef.current) {
        allFighters.forEach(f => {
          if (f.x < WALL_INNER_L + 5) f.x = WALL_INNER_L + 5;
          if (f.x > WALL_INNER_R - 5) f.x = WALL_INNER_R - 5;
        });
      }

      // Penalty: lock fighters to ground during setup/input (no floating)
      if (penPhaseRef.current && (penStateRef.current === 'setup' || penStateRef.current === 'input')) {
        const tir = penTargetGoalRef.current === 'right';
        if (tir) { f1.x = PEN_SPOT_R; f2.x = PEN_KEEPER_R; }
        else { f2.x = PEN_SPOT_L; f1.x = PEN_KEEPER_L; }
        f1.y = 620; f2.y = 620; f1.vx = 0; f2.vx = 0; f1.vy = 0; f2.vy = 0;
        f1.grounded = true; f2.grounded = true;
      }

      // Penalty keeper dive: a committed jump holds the keeper at the crossbar so a HIGH ball
      // is met (save), while a low driven shot rolls under them (goal). Staying grounded stops
      // a LOW shot (save) but lets a high ball over them (goal). Fixes the "jump too early" miss.
      if (penPhaseRef.current && penStateRef.current === 'ballInPlay') {
        const keeper = penShooterRef.current === 1 ? f2 : f1;
        const keeperX = penShooterRef.current === 1 ? PEN_KEEPER_R : PEN_KEEPER_L;
        keeper.x = keeperX;
        if (penKeeperChoiceRef.current?.jump) {
          const targetY = 541; // head reaches the crossbar (GOAL_TOP ≈ 480), body covers the upper net
          keeper.y += (targetY - keeper.y) * 0.25;
          keeper.vy = 0;
          keeper.grounded = false;
        } else {
          keeper.y = 620; keeper.vy = 0; keeper.grounded = true;
        }
      }

      // Penalty transition cutscene — override fighter + ball positions after physics
      if (penPhaseRef.current && penStateRef.current === 'transition' && penTransDataRef.current) {
        const prevKeeper = penShooterRef.current === 1 ? f2 : f1;
        const prevShooter = penShooterRef.current === 1 ? f1 : f2;
        prevKeeper.x = penTransPosRef.current.keeperX;
        prevShooter.x = penTransPosRef.current.kickerX;
        prevKeeper.y = 620; prevShooter.y = 620;
        prevKeeper.vx = 0; prevShooter.vx = 0;
        prevKeeper.vy = 0; prevShooter.vy = 0;
        ball.x = penTransPosRef.current.ballX;
        ball.y = penTransPosRef.current.ballY;
        ball.vx = 0; ball.vy = 0;
      }

      // Soccer power: launch the ball — only when touching it & it's in front; shot goes the way you face.
      allFighters.forEach((f) => {
        if (penPhaseRef.current) return;
        if (f._soccerPowerActivated) {
          f._soccerPowerActivated = false;
          const dx = ball.x - f.x;
          const front = Math.sign(dx) === f.facing || Math.abs(dx) < 16;
          const near = Math.abs(dx) < 140 && Math.abs(ball.y - (f.y - 40)) < 90;
          if (!front || !near) return; // must be touching the ball, and it must be in front of you
          const team = f.team;
          const isP1 = f === f1;
          const isP2 = f === f2;
          const low = isP1 ? (_rawP1?.down ?? p1In?.down ?? false) : isP2 ? (_rawP2?.down ?? p2In?.down ?? false) : false;
          if (ball._prePowerDamage !== undefined) ball.damage = ball._prePowerDamage;
          ball._prePowerDamage = ball.damage;
          ball.damage = 3.0;
          ball.lastTeam = team;
          ball.lastTouch = f;
          if (!f.grounded) {
            // BICYCLE KICK — airborne power shot aims at top corner of net; triggers slow-mo
            f._bicycleKick = 28;
            slowMoRef.current = 0.6;
            const attackGoalX = f.facing > 0 ? GOAL_LINE_R : GOAL_LINE_L;
            const ddx = attackGoalX - ball.x;
            const ddy = 475 - ball.y; // target the very top of the net (crossbar at 480)
            const ddist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
            const bspeed = 22; // slower — easier for keeper to save
            ball.vx = (ddx / ddist) * bspeed;
            ball.vy = (ddy / ddist) * bspeed;
            shakeMag = Math.max(shakeMag, 16);
            sfx.superActivate();
          } else {
            // GROUNDED POWER SHOT — Down = bottom of net, no Down = top of net
            ball.vx = f.facing * 24 * (f.statPowerMul || 1) + f.vx * 0.3;
            ball.vy = low ? 6 : -14;
            shakeMag = Math.max(shakeMag, 12);
            sfx.power();
          }
          registerShot(team);
        }
      });

      // Super-move button → lofted chip, only when near the ball & facing it; goes the way you face
      allFighters.forEach((f) => {
        if (penPhaseRef.current) return;
        const isP1 = f === f1;
        const isP2 = f === f2;
        const superPressed = isP1 ? (_rawP1?.superMove ?? p1In?.superMove ?? false) : isP2 ? (_rawP2?.superMove ?? p2In?.superMove ?? false) : false;
        if (superPressed && !f._soccerChipLaunched) {
          f._soccerChipLaunched = true;
          const dx = ball.x - f.x;
          const front = Math.sign(dx) === f.facing || Math.abs(dx) < 16;
          const near = Math.abs(dx) < 140 && Math.abs(ball.y - (f.y - 40)) < 90;
          if (front && near) {
            if (ball._prePowerDamage !== undefined) ball.damage = ball._prePowerDamage;
            ball._prePowerDamage = ball.damage;
            ball.damage = 3.0;
            ball.lastTeam = f.team;
            ball.lastTouch = f;
            ball.vx = f.facing * 10 + f.vx * 0.2; // high and forward arc
            ball.vy = -16; // goes high but doesn't hit the roof
            shakeMag = Math.max(shakeMag, 13);
            sfx.superActivate();
          }
        }
        if (!superPressed) f._soccerChipLaunched = false;
      });

      // Tick down bicycle-kick animation timers
      allFighters.forEach(f => { if (f._bicycleKick > 0) f._bicycleKick--; });

      // Ball physics — lighter drag so shots fly truer (more natural flight)
      ball.prevX = ball.x;
      ball.vy += 0.35 * ts;
      ball.x += ball.vx * ts;
      ball.y += ball.vy * ts;
      if (ts >= 1) { ball.vx *= 0.992; ball.vy *= 0.996; }
      // Motion trail for fast-moving shots
      ball.trail = ball.trail || [];
      const bsp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (bsp > 6) { ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 8) ball.trail.shift(); }
      else if (ball.trail.length) ball.trail.shift();

      // Possession tracking
      if (ball.lastTeam === 1) soccerStats.p1.possession++;
      else if (ball.lastTeam === 2) soccerStats.p2.possession++;

      // Ball ground bounce
      if (ball.y + ball.r >= 620) {
        ball.y = 620 - ball.r;
        ball.vy = -ball.vy * 0.6;
        ball.vx *= 0.85;
      }

      // Ball collision with upper wall segments (y = WALL_TOP to WALL_GAP_TOP)
      if (ball.y - ball.r < WALL_GAP_TOP && ball.y + ball.r > WALL_TOP) {
        if (ball.x - ball.r < WALL_INNER_L && ball.x > 0) {
          ball.x = WALL_INNER_L + ball.r; ball.vx = Math.abs(ball.vx) * 0.6;
        }
        if (ball.x + ball.r > WALL_INNER_R && ball.x < 1280) {
          ball.x = WALL_INNER_R - ball.r; ball.vx = -Math.abs(ball.vx) * 0.6;
        }
      }
      // Ball ceiling
      if (ball.y < WALL_TOP) { ball.y = WALL_TOP; ball.vy = Math.abs(ball.vy) * 0.3; }

      // ── Goal detection: ball must pass BEHIND the wall through the gap ──
      // Use swept check (prevX) so fast-moving balls never tunnel past the line
      if (ball.y > GOAL_TOP && ball.y < GOAL_BOT) {
        const crossedLeft = ball.x <= GOAL_LINE_L || (ball.prevX > GOAL_LINE_L && ball.x < GOAL_LINE_L + ball.r);
        const crossedRight = ball.x >= GOAL_LINE_R || (ball.prevX < GOAL_LINE_R && ball.x > GOAL_LINE_R - ball.r);
        if (crossedLeft) {
          if (penPhaseRef.current) {
            if (penTargetGoalRef.current === 'left') { penaltyResolve('goal'); }
            else { ball.x = GOAL_LINE_L + ball.r + 5; ball.vx = Math.abs(ball.vx) * 0.3 + 6; }
          } else if (ball.lastTeam === 1) {
            ball.x = GOAL_LINE_L + ball.r + 5; ball.vx = Math.abs(ball.vx) * 0.3 + 6;
          } else {
            scoreGoal(2);
          }
        } else if (crossedRight) {
          if (penPhaseRef.current) {
            if (penTargetGoalRef.current === 'right') { penaltyResolve('goal'); }
            else { ball.x = GOAL_LINE_R - ball.r - 5; ball.vx = -Math.abs(ball.vx) * 0.3 - 6; }
          } else if (ball.lastTeam === 2) {
            ball.x = GOAL_LINE_R - ball.r - 5; ball.vx = -Math.abs(ball.vx) * 0.3 - 6;
          } else {
            scoreGoal(1);
          }
        }
        // Back net bounce (for own-goal balls that went all the way in)
        if (ball.x - ball.r < BACK_WALL_L) { ball.x = BACK_WALL_L + ball.r; ball.vx = Math.abs(ball.vx) * 0.3 + 3; }
        if (ball.x + ball.r > BACK_WALL_R) { ball.x = BACK_WALL_R - ball.r; ball.vx = -Math.abs(ball.vx) * 0.3 - 3; }
      }

      // Crossbar bounce — bottom edge of the upper wall segment (y = WALL_GAP_TOP)
      if (ball.y + ball.r > WALL_GAP_TOP - 5 && ball.y - ball.r < WALL_GAP_TOP + 5 && ball.vy < 0) {
        if (ball.x < WALL_INNER_L || ball.x > WALL_INNER_R) { ball.y = WALL_GAP_TOP + ball.r; ball.vy = Math.abs(ball.vy) * 0.5; }
      }

      // Ball collision with custom obstacle platforms (from custom soccer stages)
      if (extraPlatforms && extraPlatforms.length) {
        extraPlatforms.forEach(p => {
          if (!p || p.y >= 615) return;
          const cx = Math.max(p.x, Math.min(ball.x, p.x + p.w));
          const cy = Math.max(p.y, Math.min(ball.y, p.y + p.h));
          const ddx = ball.x - cx, ddy = ball.y - cy;
          if (ddx * ddx + ddy * ddy < ball.r * ball.r) {
            const d = Math.sqrt(ddx * ddx + ddy * ddy) || 0.001;
            const nx = ddx / d, ny = ddy / d;
            ball.x = cx + nx * ball.r; ball.y = cy + ny * ball.r;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * 0.6;
            ball.vy = (ball.vy - 2 * dot * ny) * 0.6;
          }
        });
      }

      // Penalty: lock ball position during setup/input (overrides physics)
      if (penPhaseRef.current && (penStateRef.current === 'setup' || penStateRef.current === 'input')) {
        const tir = penTargetGoalRef.current === 'right';
        const sx = penShooterRef.current === 1 ? (tir ? PEN_SPOT_R : PEN_KEEPER_L) : (tir ? PEN_KEEPER_R : PEN_SPOT_L);
        ball.x = sx + (tir ? 25 : -25); ball.y = 608; ball.vx = 0; ball.vy = 0;
      }

      // Fighter-ball collision — push ball (dribbling does NOT build knockback)
      allFighters.forEach((f) => {
        if (penPhaseRef.current && penStateRef.current !== 'ballInPlay') return;
        const dx = ball.x - f.x;
        const dy = ball.y - (f.y - 30);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 46) {
          const isKeeper = penPhaseRef.current && f === (penShooterRef.current === 1 ? f2 : f1);
          if (isKeeper) penaltyResolve('save');
          const team = f.team;
          // Open-play save: defender blocks an on-target shot
          if (ball._onTarget && ball._onTargetTeam && ball._onTargetTeam !== team) {
            if (team === 1) soccerStats.p1.saves++;
            else soccerStats.p2.saves++;
            ball._onTarget = false;
          }
          // Body bounces only transfer ownership — they never increase ball.damage
          ball.lastTeam = team;
          ball.lastTouch = f;
          const force = (3 + Math.abs(f.vx) * 0.2) * ball.damage * (f.statPowerMul || 1);
          ball.vx = (dx / dist) * force + f.vx * 0.8;
          ball.vy = (dy / dist) * force - 3;
          shakeMag = Math.max(shakeMag, 3);
        }
      });

      // Attack-ball collision — launch ball (sig only, no heavy in soccer) — skip during penalties
      // Must be touching the ball AND it must be in front; shot goes the way you face (works in the air too).
      const _allInputs = teamMode ? [p1In, f1bIn || noInput, p2In, f2bIn || noInput] : [p1In, p2In];
      allFighters.forEach((f, idx) => {
        if (penPhaseRef.current) return;
        if (f.attackData && f.attackData.progress > 0.1 && f.attackData.progress < 0.85 && !f.attackData._ballHit) {
          const dx = ball.x - f.x;
          const dy = ball.y - (f.y - 30);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const front = Math.sign(dx) === f.facing || Math.abs(dx) < 16;
          if (dist < 140 && front) {
            f.attackData._ballHit = true;
            if (ball._prePowerDamage !== undefined) { ball.damage = ball._prePowerDamage; ball._prePowerDamage = undefined; }
            const team = f.team;
            ball.damage = Math.min(ball.damage + 0.1, 3); // attacks build knockback slowly; 3.0x max
            ball.lastTeam = team;
            const basePower = f.attackData.damage * 0.4 * (f.statPowerMul || 1);
            const power = basePower * ball.damage * attackMul;
            ball.vx = f.facing * power + f.vx * 0.5;
            if (_allInputs[idx] && _allInputs[idx].down) {
              ball.vy = Math.abs(power) * 0.4 + 3;
            } else {
              ball.vy = -Math.abs(power) * 1.0 - 5;
            }
            ball.lastTouch = f;
            registerShot(team);
            shakeMag = Math.max(shakeMag, 6);
            sfx.hit();
          }
        }
      });

      // Freeze ball at center during post-goal countdown
      if (resetCountdownRef.current > 0) { ball.x = 640; ball.y = 300; ball.vx = 0; ball.vy = 0; ball.damage = 1; ball.trail = []; }

      // ── Timer: 90 (180 internal) <GameIcon emoji="→" size={14} /> 30 extra time (60 internal) <GameIcon emoji="→" size={14} /> sudden death OR penalties ──
      if (gameRef.current.timer >= (gameRef.current.maxTime || baseTime) && !suddenDeathRef.current && !penPhaseRef.current) {
        const p1Won = scoreRef.current.p1 > scoreRef.current.p2 ? true : scoreRef.current.p2 > scoreRef.current.p1 ? false : null;
        if (p1Won === null) {
          if (!extraTimeRef.current) {
            extraTimeRef.current = true;
            setExtraTime(true);
            gameRef.current.maxTime = baseTime + 60; // extend by 30 displayed seconds of extra time
          } else if (penaltiesEnabled && !teamMode) {
            penPhaseRef.current = true;
            penStateRef.current = 'setup';
            penSetupTimerRef.current = 2;
            penShooterRef.current = 1;
            penTargetGoalRef.current = 'right';
            penShotNumRef.current = 0;
            penScoreRef.current = { p1: 0, p2: 0 };
            penHistoryRef.current = { p1: [], p2: [] };
            setPenScore({ p1: 0, p2: 0 });
          } else {
            suddenDeathRef.current = true; // sudden death — timer stops, next goal wins
          }
        } else {
          finish(p1Won);
        }
      }

      if (isOnlineHost && onStateExportRef.current && now - lastSnapshotAtRef.current >= 50) {
        lastSnapshotAtRef.current = now;
        onStateExportRef.current(snapshot());
      }

      // Camera shake
      let shakeX = 0, shakeY = 0;
      if (shakeMag > 0.3) { shakeX = (Math.random() - 0.5) * shakeMag; shakeY = (Math.random() - 0.5) * shakeMag; shakeMag *= 0.72; }

      // Render — weather-based backdrop
      ctx.clearRect(0, 0, W, H);
      const _wbg = gameRef.current.weather;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      if (_wbg === 'sunny') { bgGrad.addColorStop(0, '#4a90e2'); bgGrad.addColorStop(0.5, '#7ec8e3'); bgGrad.addColorStop(1, '#9ed488'); }
      else if (_wbg === 'cloudy') { bgGrad.addColorStop(0, '#5a6070'); bgGrad.addColorStop(0.5, '#7080a0'); bgGrad.addColorStop(1, '#90a0b8'); }
      else if (_wbg === 'rainy') { bgGrad.addColorStop(0, '#2a3040'); bgGrad.addColorStop(0.5, '#3a4055'); bgGrad.addColorStop(1, '#4a5060'); }
      else if (_wbg === 'thunder') { bgGrad.addColorStop(0, '#1a0a20'); bgGrad.addColorStop(0.5, '#2a1040'); bgGrad.addColorStop(1, '#150525'); }
      else if (_wbg === 'snow') { bgGrad.addColorStop(0, '#6080a0'); bgGrad.addColorStop(0.5, '#90b0c8'); bgGrad.addColorStop(1, '#c0d8e8'); }
      else { bgGrad.addColorStop(0, '#0a0820'); bgGrad.addColorStop(1, '#06040f'); }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Weather — background layer (cosmetic)
      const _weather = gameRef.current.weather;
      if (_weather === 'sunny') {
        ctx.fillStyle = 'rgba(255,240,150,0.22)'; ctx.beginPath(); ctx.arc(W-120, 90, 70, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,80,0.5)'; ctx.beginPath(); ctx.arc(W-120, 90, 42, 0, Math.PI*2); ctx.fill();
      } else if (_weather === 'cloudy') {
        ctx.fillStyle = 'rgba(235,238,248,0.55)';
        [[140,70,58],[220,92,48],[1060,78,54],[1150,104,44],[640,60,40]].forEach(c => { ctx.beginPath(); ctx.arc(c[0],c[1],c[2],0,Math.PI*2); ctx.fill(); });
      } else if (_weather === 'snow') {
        ctx.fillStyle = 'rgba(245,250,255,0.9)';
        for (let sx = 0; sx <= W; sx += 90) {
          ctx.beginPath();
          ctx.moveTo(sx, 622);
          ctx.quadraticCurveTo(sx + 45, 588 - (sx % 180 === 0 ? 20 : 8), sx + 90, 622);
          ctx.fill();
        }
      } else if (_weather === 'rainy' || _weather === 'thunder') {
        ctx.fillStyle = 'rgba(40,48,68,0.22)'; ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawPlatforms(ctx, fieldPlatforms, f1.frame, 'splitcity');

      // Weather-based wall colors
      const _wc = gameRef.current.weather;
      const wallColors = {
        sunny: { l: '#4488FF', r: '#AA44FF' },
        cloudy: { l: '#6688AA', r: '#8866BB' },
        rainy: { l: '#335588', r: '#663399' },
        thunder: { l: '#5544CC', r: '#9944BB' },
        snow: { l: '#88AAEE', r: '#BB88EE' },
      };
      const wc = wallColors[_wc] || wallColors.sunny;
      ctx.fillStyle = wc.l + 'AA'; ctx.fillRect(20, WALL_TOP, 20, WALL_GAP_TOP - WALL_TOP);
      ctx.fillStyle = wc.r + 'AA'; ctx.fillRect(1240, WALL_TOP, 20, WALL_GAP_TOP - WALL_TOP);

      // ── Draw goals BEHIND the wall with detailed posts ──
      const postW = 5;
      // Left goal (blue)
      ctx.fillStyle = 'rgba(68,136,255,0.10)'; ctx.fillRect(BACK_WALL_L, GOAL_TOP, GOAL_LINE_L - BACK_WALL_L, GOAL_BOT - GOAL_TOP);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
      for (let nx = BACK_WALL_L; nx < GOAL_LINE_L; nx += 6) { ctx.beginPath(); ctx.moveTo(nx, GOAL_TOP); ctx.lineTo(nx, GOAL_BOT); ctx.stroke(); }
      for (let ny = GOAL_TOP + 6; ny < GOAL_BOT; ny += 6) { ctx.beginPath(); ctx.moveTo(BACK_WALL_L, ny); ctx.lineTo(GOAL_LINE_L, ny); ctx.stroke(); }
      // Posts + crossbar
      ctx.fillStyle = TEAM_LEFT_COLOR; ctx.shadowColor = TEAM_LEFT_COLOR; ctx.shadowBlur = 6;
      ctx.fillRect(BACK_WALL_L - postW, GOAL_TOP, postW, GOAL_BOT - GOAL_TOP);
      ctx.fillRect(GOAL_LINE_L, GOAL_TOP, postW, GOAL_BOT - GOAL_TOP);
      ctx.fillRect(BACK_WALL_L - postW, GOAL_TOP - postW, GOAL_LINE_L - BACK_WALL_L + postW * 2, postW);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = TEAM_LEFT_COLOR; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(20, GOAL_TOP); ctx.lineTo(40, GOAL_TOP); ctx.stroke();
      // Right goal (purple)
      ctx.fillStyle = 'rgba(170,68,255,0.10)'; ctx.fillRect(GOAL_LINE_R, GOAL_TOP, BACK_WALL_R - GOAL_LINE_R, GOAL_BOT - GOAL_TOP);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
      for (let nx = GOAL_LINE_R; nx < BACK_WALL_R; nx += 6) { ctx.beginPath(); ctx.moveTo(nx, GOAL_TOP); ctx.lineTo(nx, GOAL_BOT); ctx.stroke(); }
      for (let ny = GOAL_TOP + 6; ny < GOAL_BOT; ny += 6) { ctx.beginPath(); ctx.moveTo(GOAL_LINE_R, ny); ctx.lineTo(BACK_WALL_R, ny); ctx.stroke(); }
      ctx.fillStyle = TEAM_RIGHT_COLOR; ctx.shadowColor = TEAM_RIGHT_COLOR; ctx.shadowBlur = 6;
      ctx.fillRect(GOAL_LINE_R, GOAL_TOP, postW, GOAL_BOT - GOAL_TOP);
      ctx.fillRect(BACK_WALL_R, GOAL_TOP, postW, GOAL_BOT - GOAL_TOP);
      ctx.fillRect(GOAL_LINE_R, GOAL_TOP - postW, BACK_WALL_R - GOAL_LINE_R + postW, postW);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = TEAM_RIGHT_COLOR; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(1240, GOAL_TOP); ctx.lineTo(1260, GOAL_TOP); ctx.stroke();

      // Draw fighters with proper soccer kits
      const drawSoccerFighter = (f) => {
        drawDoubleJumpParticles(ctx, f.doubleJumpParticles || []);
        const fScale = 1;
        ctx.save();
        if (f._bicycleKick > 0) {
          // Bicycle kick — pivot at the hips and swing the whole body backward overhead
          const prog = Math.min(1, f._bicycleKick / 28);
          ctx.translate(f.x, f.y - 30);
          ctx.rotate(prog * Math.PI * 0.92);
          ctx.translate(-f.x, -(f.y - 30));
        }
        const _jerseyOn = (f === f1 || (teamMode && f === f1b)) ? p1Jersey : (f === f2 || (teamMode && f === f2b)) ? p2Jersey : true;
        if (_jerseyOn) {
          // Jersey on — base character only, no skins/accessories underneath.
          drawStickman(ctx, f.x, f.y, f.char.color, f.facing, f.frame, fScale, f.char.isSpirit, f.state, f.char, f.powerActive, true, null, f.emote);
          drawSoccerKit(ctx, f.x, f.y, f.char.color, f.char.id, f.frame, fScale, f.state, f.facing, f.powerActive);
        } else {
          // No jersey — render skins + accessories normally.
          const crossoverColors = getCrossoverColor(f.char.id, equippedCrossovers);
          const renderColor = crossoverColors ? crossoverColors.primary : (getCharRenderColor(f.char.id, equippedSkins) || f.char.color);
          const skinParts = getSkinParts(f.char.id, equippedSkins);
          const accs = getEquippedAccessories(mergedAccessories, f.char.id);
          const skinColor = crossoverColors ? crossoverColors.primary : getCharRenderColor(f.char.id, equippedSkins);
          skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, fScale, f.char.id, f.state, f.facing, f.powerActive));
          accs.filter(a => isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, fScale, f.char.id, f.state, f.facing, f.powerActive));
          drawStickman(ctx, f.x, f.y, renderColor, f.facing, f.frame, fScale, f.char.isSpirit, f.state, f.char, f.powerActive, true, null, f.emote);
          skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, f.x, f.y, p.type, p.color, f.frame, fScale, f.char.id, f.state, f.facing, f.powerActive));
          accs.filter(a => !isBehindAccessory(a.type)).forEach(a => drawAccessory(ctx, f.x, f.y, a.type, skinColor && a.type === 'soccer_kit' ? skinColor : resolveAccColor(a, f.char), f.frame, fScale, f.char.id, f.state, f.facing, f.powerActive));
        }
        ctx.restore();
        drawShikigamiFollower(ctx, f, equippedShikigamiRef.current?.[f.char.id], f.frame, 1);
        if (f._bicycleKick > 0) {
          // Swinging legs + follow-through arc over the ball (the "bicycle")
          const prog = Math.min(1, f._bicycleKick / 28);
          ctx.save();
          ctx.strokeStyle = f.char.color; ctx.lineWidth = 4; ctx.globalAlpha = 0.65;
          const a0 = -Math.PI * 0.95 + prog * Math.PI * 1.5;
          ctx.beginPath(); ctx.arc(f.x, f.y - 30, 44, a0, a0 + Math.PI * 0.75); ctx.stroke();
          ctx.globalAlpha = 0.4; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(f.x, f.y - 30, 44, a0 + Math.PI * 0.5, a0 + Math.PI * 1.1); ctx.stroke();
          ctx.restore();
        }
        if (headSoccer) {
          const s = 36 * fScale;
          const headR = s * 0.34 * 1.6;
          const headY = f.y - s * 1.7;
          ctx.save();
          ctx.fillStyle = f.char.color;
          ctx.globalAlpha = 0.3;
          ctx.beginPath(); ctx.arc(f.x, headY, headR, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          const num = getCharNumber(f.char.id);
          if (num != null) {
            ctx.fillStyle = '#FFFFFF'; ctx.font = `bold ${Math.floor(s * 0.3)}px Orbitron`; ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3;
            ctx.fillText(String(num), f.x, headY + s * 0.1);
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        }
        // Power-shot ready bar above the nametag
        const maxCD = f._maxPowerCooldown || 300;
        const powerReady = (f.powerCooldown || 0) <= 0;
        const powerFill = powerReady ? 1 : Math.max(0, Math.min(1, 1 - (f.powerCooldown || 0) / maxCD));
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(f.x - 35, f.y - 92, 70, 5);
        if (powerReady) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6; }
        ctx.fillStyle = powerReady ? '#FFD700' : (powerFill > 0.6 ? '#FFAA00' : '#5577AA');
        ctx.fillRect(f.x - 35, f.y - 92, 70 * powerFill, 5);
        ctx.shadowBlur = 0; ctx.restore();

        ctx.save(); ctx.font = 'bold 12px Orbitron, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(f.x - 40, f.y - 84, 80, 18, 4); ctx.fill();
        ctx.fillStyle = f.char.color; ctx.fillText(f.char.name, f.x, f.y - 70);
        ctx.restore();
      };

      allFighters.forEach(f => drawSoccerFighter(f));

      // Emote labels — draw above each player's fighter
      if (f1.emote) drawEmote(ctx, f1.x, f1.y, f1.emote.id, f1.emote.timer, f1.emote.maxTimer, f1.frame);
      if (f2.emote) drawEmote(ctx, f2.x, f2.y, f2.emote.id, f2.emote.timer, f2.emote.maxTimer, f2.frame);

      // Draw ball trail
      if (ball.trail && ball.trail.length > 1) {
        for (let i = 0; i < ball.trail.length; i++) {
          const t = ball.trail[i];
          ctx.globalAlpha = (i / ball.trail.length) * 0.4;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(t.x, t.y, ball.r * (0.4 + 0.6 * (i / ball.trail.length)), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Draw ball
      ctx.save();
      ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (ball.damage > 1.05) {
        ctx.fillStyle = `rgba(255,${Math.floor(200 - ball.damage * 40)},0,0.8)`;
        ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('x' + ball.damage.toFixed(1), ball.x, ball.y - ball.r - 4);
      }
      ctx.restore();

      ctx.restore();

      // Weather — foreground particles (cosmetic)
      const _w = gameRef.current.weather;
      if (_w === 'rainy' || _w === 'thunder') {
        ctx.strokeStyle = 'rgba(160,185,225,0.5)'; ctx.lineWidth = 1.5;
        wParticles.forEach(p => {
          p.y += p.sp; p.x -= 2;
          if (p.y > H) { p.y = -10; p.x = Math.random()*W; }
          if (p.x < -10) p.x = W;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + p.len); ctx.stroke();
        });
        if (_w === 'thunder') {
          if (Math.random() < 0.008) thunderFlash = 8;
          if (thunderFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${thunderFlash/18})`; ctx.fillRect(0,0,W,H); thunderFlash--; }
        }
      } else if (_w === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        wParticles.forEach(p => {
          p.y += p.sp; p.sw += 0.03; p.x += Math.sin(p.sw) * 0.8;
          if (p.y > H) { p.y = -5; p.x = Math.random()*W; }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
        });
      }

      // Score HUD — team names above smaller score numbers (blue vs purple)
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(W / 2 - 145, 6, 290, 58);
      const leftLabel = teamMode ? `${char1.name}/${(getCharData(p1bChar) || {}).name || ''}` : char1.name;
      const rightLabel = teamMode ? `${char2.name}/${(getCharData(p2bChar) || {}).name || ''}` : char2.name;
      ctx.textAlign = 'right';
      ctx.fillStyle = TEAM_LEFT_COLOR; ctx.font = 'bold 10px Orbitron';
      ctx.fillText(leftLabel.toUpperCase().slice(0, 18), W / 2 - 16, 19);
      ctx.textAlign = 'left';
      ctx.fillStyle = TEAM_RIGHT_COLOR;
      ctx.fillText(rightLabel.toUpperCase().slice(0, 18), W / 2 + 16, 19);
      ctx.textAlign = 'center';
      ctx.fillStyle = TEAM_LEFT_COLOR; ctx.font = 'bold 22px Orbitron';
      ctx.fillText(scoreRef.current.p1, W / 2 - 50, 46);
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px Orbitron'; ctx.fillText(':', W / 2, 44);
      ctx.fillStyle = TEAM_RIGHT_COLOR; ctx.font = 'bold 22px Orbitron';
      ctx.fillText(scoreRef.current.p2, W / 2 + 50, 46);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px Orbitron';
      ctx.fillText(`FIRST TO ${WIN_GOALS}`, W / 2, 59);

      // Penalty shootout HUD — circles like real soccer
      if (penPhaseRef.current) {
        const histP1 = penHistoryRef.current.p1 || [];
        const histP2 = penHistoryRef.current.p2 || [];
        const maxCircles = PEN_SHOTS_PER_PLAYER + 1; // 5 + 1 extra that resets
        const cR = 7, cGap = 18;
        const circlesStartX = W / 2 - (maxCircles * cGap) / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(W / 2 - 190, 88, 380, 44);

        const drawPenCircles = (history, cy) => {
          for (let i = 0; i < maxCircles; i++) {
            const cx = circlesStartX + i * cGap;
            let result;
            if (i < PEN_SHOTS_PER_PLAYER) {
              result = history[i];
            } else {
              // Extra circle — shows latest sudden-death result, resets each round
              const extraShots = history.slice(PEN_SHOTS_PER_PLAYER);
              result = extraShots.length > 0 ? extraShots[extraShots.length - 1] : undefined;
            }
            if (result === 'goal') {
              ctx.fillStyle = '#22C55E'; ctx.beginPath(); ctx.arc(cx, cy, cR, 0, Math.PI * 2); ctx.fill();
            } else if (result === 'miss') {
              ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, cR, 0, Math.PI * 2); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx + 4, cy + 4); ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy + 4); ctx.stroke();
            } else {
              ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, cR, 0, Math.PI * 2); ctx.stroke();
            }
          }
        };

        ctx.textAlign = 'right';
        ctx.fillStyle = char1.color; ctx.font = 'bold 10px Orbitron';
        ctx.fillText(char1.name.toUpperCase().slice(0, 10), W / 2 - 100, 104);
        drawPenCircles(histP1, 101);

        ctx.fillStyle = char2.color; ctx.font = 'bold 10px Orbitron';
        ctx.fillText(char2.name.toUpperCase().slice(0, 10), W / 2 - 100, 123);
        drawPenCircles(histP2, 120);

        // Instructions under the score
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 8px Orbitron';
        ctx.fillText('SHOOTER: <GameIcon emoji="↑" size={14} />=high  <GameIcon emoji="↓" size={14} />=low  |  KEEPER: <GameIcon emoji="↑" size={14} />=jump', W / 2, 138);

        if (penStateRef.current === 'input') {
          const shooterName = penShooterRef.current === 1 ? char1.name : char2.name;
          const secs = Math.ceil(Math.max(0, penInputTimerRef.current));
          ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(W / 2 - 160, 144, 320, 28);
          ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px Orbitron';
          ctx.fillText(`${shooterName} SHOOTS — LOCK IN ${secs}s!`, W / 2, 156);
          ctx.fillStyle = '#FFF'; ctx.font = 'bold 8px Orbitron';
          ctx.fillText('Both commit at the same time', W / 2, 167);
        } else if (penStateRef.current === 'setup') {
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - 80, 144, 160, 20);
          ctx.fillStyle = '#FFF'; ctx.font = 'bold 10px Orbitron';
          ctx.fillText('GET READY...', W / 2, 157);
        } else if (penStateRef.current === 'transition') {
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - 80, 144, 160, 20);
          ctx.fillStyle = '#FFF'; ctx.font = 'bold 10px Orbitron';
          ctx.fillText('SWITCHING SIDES...', W / 2, 157);
        }
      }

      // Timer display — penalties/sudden death show label with no countdown
      if (penPhaseRef.current) {
        ctx.fillStyle = 'rgba(120,20,120,0.85)';
        ctx.fillRect(W / 2 - 60, 70, 120, 22);
        ctx.fillStyle = '#FF44FF'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('PENALTIES', W / 2, 87);
      } else if (suddenDeathRef.current) {
        ctx.fillStyle = 'rgba(180,20,20,0.85)';
        ctx.fillRect(W / 2 - 75, 70, 150, 22);
        ctx.fillStyle = '#FF4444'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText('SUDDEN DEATH', W / 2, 87);
      } else {
        const timerVal = extraTimeRef.current
          ? Math.max(0, Math.ceil((gameRef.current.timer - baseTime) / 2))
          : Math.min(baseDisplayTime, Math.ceil(gameRef.current.timer / 2));
        ctx.fillStyle = extraTimeRef.current ? 'rgba(180,40,40,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.fillRect(W / 2 - 50, 70, 100, 22);
        ctx.fillStyle = extraTimeRef.current ? '#FF6644' : '#FFF'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText((extraTimeRef.current ? 'ET ' : '') + timerVal + 's', W / 2, 87);
      }

      if (totalRounds > 1) {
        ctx.fillStyle = 'rgba(255,215,0,0.5)'; ctx.font = 'bold 10px Orbitron';
        ctx.fillText(`ROUND ${round}/${totalRounds}`, W / 2, 105);
      }
      if (headSoccer) {
        ctx.fillStyle = 'rgba(255,200,0,0.5)'; ctx.font = 'bold 10px Orbitron';
        ctx.fillText('HEAD SOCCER', W / 2, 118);
      }

      // Goal flash — in the scorer's character color
      if (goalFlash) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H / 2 - 40, W, 80);
        ctx.fillStyle = goalFlashColorRef.current; ctx.font = 'bold 48px Orbitron'; ctx.textAlign = 'center';
        ctx.shadowColor = goalFlashColorRef.current; ctx.shadowBlur = 20;
        ctx.fillText(goalFlash, W / 2, H / 2 + 15);
        ctx.shadowBlur = 0;
      }

      // Post-goal countdown
      if (resetCountdownRef.current > 0) {
        const num = Math.max(1, Math.ceil(resetCountdownRef.current));
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, H - 160, W, 120);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 70px Orbitron'; ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.fillText(String(num), W / 2, H - 80);
        ctx.shadowBlur = 0;
      }

      lastTime = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      if (gameRef.current) gameRef.current.running = false;
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [gameStarted, p1Char, p2Char, p2IsCPU, cpuDifficulty, headSoccer, penaltiesEnabled, penaltiesOnly]);

  const finishQuit = () => {
    if (gameRef.current) { gameRef.current.running = false; onEnd?.({ p1Won: false, score: scoreRef.current, teamMode }); }
  };

  // Tournament-only: simulate the remainder of the match from the current score.
  const simRest = () => {
    if (gameRef.current) gameRef.current.running = false;
    const cur = scoreRef.current;
    let p1 = cur.p1 + Math.floor(Math.random() * 4);
    let p2 = cur.p2 + Math.floor(Math.random() * 4);
    while (p1 === p2) { p1 += Math.floor(Math.random() * 2); }
    const log = [...(gameRef.current?.goalLog || [])];
    const nowSec = Math.max(1, Math.round((performance.now() - (gameRef.current?.startedAt || performance.now())) / 2000));
    const addGoals = (team, n) => { for (let i = 0; i < n; i++) log.push({ team, second: Math.min(120, nowSec + 1 + Math.floor(Math.random() * Math.max(2, 90 - nowSec))) }); };
    addGoals(1, Math.max(0, p1 - cur.p1));
    addGoals(2, Math.max(0, p2 - cur.p2));
    log.sort((a, b) => a.second - b.second);
    onEnd?.({ score: { p1, p2 }, p1Won: p1 > p2, simulated: true, goalLog: log });
  };

  // Tournament-only: end the match immediately, keeping the current score.
  const endNow = () => {
    if (gameRef.current) gameRef.current.running = false;
    onEnd?.({ score: { ...scoreRef.current }, goalLog: [...(gameRef.current?.goalLog || [])] });
  };

  // Suppress controller menu-nav while a match is actively running; re-enable
  // when paused or finished so the player can click buttons with the controller.
  useEffect(() => {
    window.__el6GameplayActive = !winner;
    return () => { window.__el6GameplayActive = false; };
  }, [winner]);

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="flex justify-between w-full px-1 max-w-[1280px]">
        {!tournamentMode && <button onClick={finishQuit} className="px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Menu</button>}
        <button onClick={() => { pausedRef.current = !pausedRef.current; setPaused(v => !v); }} className={`px-3 py-1 bg-secondary/80 text-secondary-foreground rounded font-body text-xs hover:opacity-80 ${tournamentMode ? 'ml-auto' : ''}`}>Pause (ESC)</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        className="el6-match-canvas"
        style={{ width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9', height: 'auto' }}
      />
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-9xl font-heading text-accent animate-pulse">{countdown}</span>
        </div>
      )}
      {paused && !winner && <PauseMenu online={!!lanConnection} onResume={() => { pausedRef.current = false; setPaused(false); }} onQuit={finishQuit} tournamentMode={tournamentMode} onSimRest={simRest} onEndNow={endNow} />}
      {winner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/78 rounded-lg gap-5">
          <span className="text-5xl font-heading text-accent drop-shadow-lg">{winner === 'DRAW' ? 'DRAW!' : `${winner} WINS!`}</span>
          {teamMode && winner !== 'DRAW' && (
            <div className="flex flex-col items-center gap-1">
              {(winner === 'TEAM BLUE' ? [getCharData(p1Char), getCharData(p1bChar)] : [getCharData(p2Char), getCharData(p2bChar)]).filter(Boolean).map((c, i) => (
                <span key={i} className="text-lg font-heading" style={{ color: c?.color }}>{c?.name}</span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            {onRematch && <button onClick={() => onRematch()} className="px-6 py-3 bg-secondary text-secondary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">REMATCH</button>}
            <button onClick={() => onEnd?.(gameRef.current?.result || { p1Won: false })} className="px-8 py-3 bg-primary text-primary-foreground font-heading rounded-lg hover:opacity-80 transition text-lg">CONTINUE</button>
          </div>
        </div>
      )}
      {lanConnection && lanConnection.stalled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg z-50">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-2xl font-heading text-accent">RECONNECTING…</span>
          <span className="text-xs text-muted-foreground font-body mt-1">Paused for both players while resyncing</span>
        </div>
      )}
    </div>
  );
}
