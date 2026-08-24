import React, { useRef, useState, useEffect } from 'react';
import { ALL_CHARS } from './sports.js';
import { applyElement, getCharLevelData, getUnlockedElements } from './elements.js';
import { createFighter, updateFighter, checkHit, applyHit, updateAI, loseStock, updateProjectiles, drawProjectiles } from './fighter.js';
import { navigateToward, selectTarget } from './botNavigation.js';
import { drawStickman, drawPlatforms, drawAttackEffect } from './renderer.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { readGamepadInput } from './controllerProfiles.js';
import { getKeybinds, readPlayerInput, readSinglePlayerInput } from './keybinds.js';
import ElementSelect from './ElementSelect.jsx';
import GameIcon from "./GameIcon.jsx";

const VIEW_W = 1280, VIEW_H = 720;
const WORLD_W = 2800, WORLD_H = 840;

// All characters share the same HP in CTF — no HP stat differences.
const CTF_HP = 300;

// ── BIG, spread-out Split City Night Arena ──
// Flag platforms are ISOLATED on pillars with big gaps around them.
// Ground floor spans the full width — fighters can stand and jump from it.
const ARENA_PLATFORMS = [
  // Ground floor (street level) — full world width, jumpable
  { x: 0, y: 800, w: WORLD_W, h: 40, isFloor: true },
  // ── TEAM A (BLUE) — isolated flag platform ──
  { x: 130, y: 560, w: 150, h: 16, flagBase: true, isolated: true },
  // Approach platforms (spread far apart)
  { x: 40, y: 700, w: 80, h: 14 },
  { x: 340, y: 680, w: 80, h: 14 },
  { x: 220, y: 470, w: 80, h: 14 },
  { x: 400, y: 520, w: 70, h: 14 },
  { x: 470, y: 380, w: 90, h: 14 },
  // ── TEAM B (RED) — isolated flag platform ──
  { x: 2520, y: 560, w: 150, h: 16, flagBase: true, isolated: true },
  { x: 2680, y: 700, w: 80, h: 14 },
  { x: 2380, y: 680, w: 80, h: 14 },
  { x: 2500, y: 470, w: 80, h: 14 },
  { x: 2330, y: 520, w: 70, h: 14 },
  { x: 2240, y: 380, w: 90, h: 14 },
  // ── CENTER — spread out mid platforms ──
  { x: 1150, y: 640, w: 120, h: 16 },
  { x: 1530, y: 640, w: 120, h: 16 },
  { x: 950, y: 560, w: 90, h: 14 },
  { x: 1760, y: 560, w: 90, h: 14 },
  { x: 1250, y: 460, w: 100, h: 14 },
  { x: 1450, y: 460, w: 100, h: 14 },
  { x: 1050, y: 360, w: 110, h: 14 },
  { x: 1640, y: 360, w: 110, h: 14 },
  { x: 1320, y: 250, w: 160, h: 14 },
  // ── Left mid connectors (spread far) ──
  { x: 620, y: 680, w: 70, h: 14 },
  { x: 760, y: 600, w: 70, h: 14 },
  { x: 580, y: 440, w: 80, h: 14 },
  { x: 870, y: 470, w: 70, h: 14 },
  // ── Right mid connectors (spread far) ──
  { x: 2110, y: 680, w: 70, h: 14 },
  { x: 1970, y: 600, w: 70, h: 14 },
  { x: 2140, y: 440, w: 80, h: 14 },
  { x: 1860, y: 470, w: 70, h: 14 },
];

const TEAM_COMBOS = [
  { id: 'pp_cc', label: 'P + P  vs  CPU + CPU', desc: 'Two human players vs two CPUs' },
  { id: 'pc_pc', label: 'P + CPU  vs  P + CPU', desc: 'Each team has one human and one CPU' },
  { id: 'pc_cc', label: 'P + CPU  vs  CPU + CPU', desc: 'You + a CPU teammate vs two CPUs' },
];

const TEAM_A_BASE = { x: 205, y: 560 };
const TEAM_B_BASE = { x: 2595, y: 560 };
const TEAM_COLORS = { A: '#3577E8', B: '#E04646' };

const ALL_CHARS_POOL = ALL_CHARS;

function resolveChar(id) {
  return ALL_CHARS_POOL.find(c => c.id === id) || ALL_CHARS_POOL[0];
}

function safeChar(c) {
  return {
    ...c,
    heavyAttack: c.heavyAttack || { name: 'Heavy Strike', damage: 20, knockback: 1.3, range: 170, duration: 22, color: c.color, type: 'dash', desc: '' },
    signatures: c.signatures || { side: { name: 'Side', damage: 16, knockback: 1.0, range: 180, duration: 20, color: c.color, type: 'dash', desc: '' }, up: { name: 'Up', damage: 14, knockback: 1.2, range: 120, duration: 18, color: c.color, type: 'launch', desc: '' }, down: { name: 'Down', damage: 18, knockback: 1.1, range: 150, duration: 22, color: c.color, type: 'groundSlam', desc: '' } },
    stats: c.stats || { power: 6, speed: 6, defense: 6, utility: 6, control: 6 },
  };
}

export default function CaptureTheFlag({
  onExit, onAward, unlockedIds = [], equippedAccessories = {}, equippedSkins = {},
  customCharsData = {}, sfxVolume = 70, musicVolume = 50, settings = {},
  charLevels = {},
}) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const [phase, setPhase] = useState('setup');
  const [combo, setCombo] = useState('pp_cc');
  const [slots, setSlots] = useState({ p1: unlockedIds[0] || 'yellow', p2: 'red', p3: 'blue', p4: 'green' });
  const [elements, setElements] = useState({ p1: 'basic', p2: 'basic', p3: 'basic', p4: 'basic' });
  const [activeSlot, setActiveSlot] = useState('p1');
  const [matchSettings, setMatchSettings] = useState({ captureLimit: 3, matchTime: 300, friendlyFire: false, respawnTime: 3, cpuDifficulty: 'regular' });
  const [result, setResult] = useState(null);

  const charPool = (unlockedIds.length ? unlockedIds : ALL_CHARS.map(c => c.id)).map(id => ({ id, char: resolveChar(id) }));

  const isCPU = (slot) => {
    if (combo === 'pp_cc') return slot === 'p3' || slot === 'p4';
    if (combo === 'pc_pc') return slot === 'p2' || slot === 'p4';
    if (combo === 'pc_cc') return slot === 'p2' || slot === 'p3' || slot === 'p4';
    return false;
  };

  const startMatch = () => {
    setPhase('play'); sfx.click();
  };

  // ── Game loop ──
  useEffect(() => {
    if (phase !== 'play') return;
    music.setVolume(musicVolume); sfx.setVolume(sfxVolume);
    music.play('fight');
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const platforms = ARENA_PLATFORMS.map(p => ({ ...p }));
    const mkFighter = (slot, team, charId, elementId, spawnX, spawnY) => {
      const base = resolveChar(charId);
      const sc = safeChar(base);
      const stats = applyElement(sc.stats || {}, elementId);
      // Keep original character color — uniform overlay shows team
      const char = { ...sc, stats };
      const f = createFighter(char, spawnX, spawnY, team === 'A' ? 1 : -1);
      f.team = team; f.slot = slot; f.isAI = isCPU(slot); f.cpuDifficulty = matchSettings.cpuDifficulty;
      f.grounded = true; f.stocks = 999; f.damage = 0; f.hp = CTF_HP;
      f.respawnTimer = 0; f.spawnPoint = { x: spawnX, y: spawnY }; f.invincible = 0;
      f._lastX = spawnX; f._stuckTimer = 0; f._lastStuckJump = 0;
      return f;
    };

    const fighters = [
      mkFighter('p1', 'A', slots.p1, elements.p1, TEAM_A_BASE.x, TEAM_A_BASE.y - 40),
      mkFighter('p2', 'A', slots.p2, elements.p2, TEAM_A_BASE.x + 60, TEAM_A_BASE.y - 40),
      mkFighter('p3', 'B', slots.p3, elements.p3, TEAM_B_BASE.x, TEAM_B_BASE.y - 40),
      mkFighter('p4', 'B', slots.p4, elements.p4, TEAM_B_BASE.x - 60, TEAM_B_BASE.y - 40),
    ];

    const flags = {
      A: { x: TEAM_A_BASE.x, y: TEAM_A_BASE.y - 20, baseX: TEAM_A_BASE.x, baseY: TEAM_A_BASE.y - 20, state: 'base', carrier: null, returnTimer: 0, team: 'A' },
      B: { x: TEAM_B_BASE.x, y: TEAM_B_BASE.y - 20, baseX: TEAM_B_BASE.x, baseY: TEAM_B_BASE.y - 20, state: 'base', carrier: null, returnTimer: 0, team: 'B' },
    };

    const score = { A: 0, B: 0 };
    let timer = matchSettings.matchTime;
    let lastTime = performance.now();
    let frame = 0;
    let over = false;
    let camX = 0, camY = 0, camX2 = 0, camY2 = 0;

    gameRef.current = { fighters, flags, score, timer, running: true, platforms, captureLimit: matchSettings.captureLimit };

    const respawnFighter = (f) => {
      f.x = f.spawnPoint.x; f.y = f.spawnPoint.y - 40; f.vx = 0; f.vy = 0;
      f.damage = 0; f.hp = CTF_HP; f.grounded = true; f.invincible = 120;
      f.state = 'idle'; f.attackData = null; f.attackTimer = 0; f.hitstun = 0;
      f._stuckTimer = 0;
      for (const key of ['A', 'B']) {
        const fl = flags[key];
        if (fl.carrier === f) {
          fl.state = 'dropped'; fl.x = f.x; fl.y = f.y; fl.carrier = null; fl.returnTimer = 300;
        }
      }
    };

    // CTF AI — dynamic role-based: bots continuously reassess their role based on
    // flag states, teammate status, enemy positions, health, score, and time.
    // Uses platform-aware navigation (navigateToward) for objective movement and
    // the full combat AI (updateAI) for fighting. Supers enabled — powers stripped.
    const ctfAI = (f) => {
      const enemyTeam = f.team === 'A' ? 'B' : 'A';
      const myFlag = flags[f.team];
      const enemyFlag = flags[enemyTeam];
      const myBase = f.team === 'A' ? TEAM_A_BASE : TEAM_B_BASE;
      const enemyBase = f.team === 'A' ? TEAM_B_BASE : TEAM_A_BASE;
      const allies = fighters.filter(a => a.team === f.team && a !== f && a.hp > 0);
      const enemies = fighters.filter(e => e.team === enemyTeam && e.hp > 0);
      const nearestEnemy = enemies.length ? enemies.reduce((n, e) =>
        Math.hypot(e.x - f.x, e.y - f.y) < Math.hypot(n.x - f.x, n.y - f.y) ? e : n) : null;
      const nearestEnemyDist = nearestEnemy ? Math.hypot(nearestEnemy.x - f.x, nearestEnemy.y - f.y) : Infinity;

      // ── Flag & objective state (recalculated every frame) ──
      const carryingEnemyFlag = enemyFlag.carrier === f;
      const teammateCarrying = allies.find(a => enemyFlag.carrier === a);
      const ourFlagTaken = myFlag.carrier != null;
      const enemyCarrier = myFlag.carrier;
      const ourFlagDropped = myFlag.state === 'dropped';
      const enemyFlagDropped = enemyFlag.state === 'dropped';

      // ── Health & game state ──
      const veryLowHp = f.hp < CTF_HP * 0.15;
      const myTeamScore = score[f.team];
      const enemyTeamScore = score[enemyTeam];
      const winning = myTeamScore > enemyTeamScore;
      const lateGame = timer < 30;

      // ── Distances to objectives ──
      const distToEnemyFlag = Math.hypot(enemyFlag.x - f.x, enemyFlag.y - f.y);
      const distToMyFlag = Math.hypot(myFlag.x - f.x, myFlag.y - f.y);

      // ═══ DYNAMIC ROLE SELECTION — reassessed every frame ═══
      let role;
      if (carryingEnemyFlag) {
        role = 'carrier';
      } else if (veryLowHp && enemies.length > 0) {
        role = 'retreat';
      } else if (ourFlagTaken && enemyCarrier) {
        const teammateRecovering = allies.some(a => a._ctfRole === 'recovery');
        role = teammateRecovering ? 'interceptor' : 'recovery';
      } else if (teammateCarrying) {
        role = 'escort';
      } else if (ourFlagDropped) {
        role = 'defender';
      } else if (enemyFlagDropped) {
        role = 'recovery_flag';
      } else {
        const enemyThreatening = enemies.find(e => Math.hypot(e.x - myFlag.x, e.y - myFlag.y) < 250);
        const teammateRoles = allies.map(a => a._ctfRole).filter(Boolean);
        const someoneDefending = teammateRoles.includes('defender') || teammateRoles.includes('recovery');
        const someoneAttacking = teammateRoles.includes('attacker') || teammateRoles.includes('recovery_flag');
        if (enemyThreatening && !someoneDefending) role = 'defender';
        else if (enemyThreatening && someoneDefending && !someoneAttacking) role = 'attacker';
        else if (someoneAttacking && !someoneDefending) role = 'defender';
        else if (!someoneAttacking && someoneDefending) role = 'attacker';
        else role = distToEnemyFlag < distToMyFlag ? 'attacker' : 'midfield';
      }
      f._ctfRole = role;

      // ═══ TARGET SELECTION (with objective priority scoring) ═══
      let target = null;
      let aggressive = false;
      let objectivePriority = 5;

      if (role === 'carrier') { target = myBase; objectivePriority = 10; }
      else if (role === 'retreat') { target = myBase; objectivePriority = 5; }
      else if (role === 'recovery') { target = enemyCarrier; aggressive = true; objectivePriority = 9; }
      else if (role === 'interceptor') { target = enemyCarrier || { x: enemyBase.x, y: enemyBase.y }; aggressive = true; objectivePriority = 8; }
      else if (role === 'recovery_flag') { target = enemyFlag; objectivePriority = 8; }
      else if (role === 'escort') { target = teammateCarrying; objectivePriority = 7; }
      else if (role === 'defender') {
        if (nearestEnemy && Math.hypot(nearestEnemy.x - myFlag.x, nearestEnemy.y - myFlag.y) < 300) {
          target = { x: (myFlag.x + nearestEnemy.x) / 2, y: (myFlag.y + nearestEnemy.y) / 2 };
        } else { target = myFlag; }
        aggressive = true; objectivePriority = 6;
      }
      else if (role === 'attacker') { target = enemyFlag; aggressive = true; objectivePriority = 5; }
      else if (role === 'midfield') { target = { x: WORLD_W / 2, y: 500 }; objectivePriority = 3; }

      // ═══ COMBAT vs OBJECTIVE DECISION ═══
      const enemyIsCarrier = nearestEnemy === enemyCarrier;
      const shouldFight = aggressive && nearestEnemy && nearestEnemyDist < 130 && role !== 'carrier' && role !== 'retreat';
      const mustFight = nearestEnemy && nearestEnemyDist < 55 && (role === 'recovery' || role === 'interceptor' || role === 'defender' || (role === 'escort' && teammateCarrying));
      const fightEnemyCarrier = enemyIsCarrier && nearestEnemyDist < 200;

      let aiInput;
      if ((shouldFight || mustFight || fightEnemyCarrier) && nearestEnemy) {
        aiInput = updateAI(f, nearestEnemy, f.cpuDifficulty, platforms, 1, 'balanced');
        if (objectivePriority >= 8 && !mustFight && nearestEnemyDist > 80) {
          const nav = navigateToward(f, target, platforms);
          aiInput.left = nav.left; aiInput.right = nav.right;
          if (nav.jump) aiInput.jump = true;
          if (nav.down) aiInput.down = true;
        }
      } else {
        aiInput = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
        if (target) {
          const nav = navigateToward(f, target, platforms);
          aiInput.left = nav.left; aiInput.right = nav.right;
          if (nav.jump) aiInput.jump = true;
          if (nav.down) aiInput.down = true;
        }
      }

      // ── Anti-stuck tracking ──
      if (Math.abs(f.x - f._lastX) < 4) f._stuckTimer++;
      else { f._stuckTimer = 0; f._lastX = f.x; }

      if (target) {
        const dx = (target.x || 0) - f.x;
        const dy = (target.y || 0) - f.y;
        if (!shouldFight && !mustFight && !fightEnemyCarrier) {
          if (Math.abs(dx) > 30) { if (dx < 0) { aiInput.left = true; aiInput.right = false; } else { aiInput.right = true; aiInput.left = false; } }
          if (dy < -40 && f.grounded) aiInput.jump = true;
        }
        if (f._stuckTimer > 25 && f.grounded && frame - f._lastStuckJump > 20) { aiInput.jump = true; f._stuckTimer = 0; f._lastStuckJump = frame; }
        if (f._stuckTimer > 40 && !f.grounded) { aiInput.left = !aiInput.left; aiInput.right = !aiInput.right; f._stuckTimer = 0; }
        if ((shouldFight || mustFight || fightEnemyCarrier) && nearestEnemy && Math.abs(nearestEnemy.x - f.x) < 100 && Math.abs(nearestEnemy.y - f.y) < 80) { aiInput.sig = true; aiInput.heavy = Math.random() < 0.15; }
      }

      aiInput.power = false;
      return aiInput;
    };

    const checkFlagPickup = (f) => {
      if (f.invincible > 0) return;
      const enemyTeam = f.team === 'A' ? 'B' : 'A';
      const ef = flags[enemyTeam];
      if ((ef.state === 'base' || ef.state === 'dropped') && Math.abs(ef.x - f.x) < 35 && Math.abs(ef.y - f.y) < 50) {
        ef.state = 'carried'; ef.carrier = f; sfx.coin();
      }
      const mf = flags[f.team];
      if (mf.state === 'dropped' && Math.abs(mf.x - f.x) < 35 && Math.abs(mf.y - f.y) < 50) {
        mf.state = 'base'; mf.x = mf.baseX; mf.y = mf.baseY; mf.carrier = null; mf.returnTimer = 0; sfx.checkpoint();
      }
    };

    const checkFlagCapture = (f) => {
      const enemyTeam = f.team === 'A' ? 'B' : 'A';
      const ef = flags[enemyTeam];
      const mf = flags[f.team];
      const myBase = f.team === 'A' ? TEAM_A_BASE : TEAM_B_BASE;
      if (ef.state === 'carried' && ef.carrier === f && mf.state === 'base' && Math.abs(f.x - myBase.x) < 55 && Math.abs(f.y - myBase.y) < 70) {
        score[f.team]++;
        ef.state = 'base'; ef.x = ef.baseX; ef.y = ef.baseY; ef.carrier = null; sfx.summit();
        if (score[f.team] >= matchSettings.captureLimit) { over = true; gameRef.current.winner = f.team; }
      }
    };

    const kd = e => {
      const k = e.key; const kl = k.toLowerCase();
      keysRef.current[k] = true; keysRef.current[kl] = true;
      if (k === 'Escape' || kl === 'p') { gameRef.current.running = !gameRef.current.running; }
      if (!['F5', 'F12'].includes(k)) e.preventDefault();
    };
    const ku = e => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    const loop = (now) => {
      if (!gameRef.current?.running) { requestAnimationFrame(loop); return; }
      if (over) { finish(); return; }
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      frame++;
      timer -= dt;
      if (timer <= 0) { over = true; gameRef.current.winner = score.A > score.B ? 'A' : score.B > score.A ? 'B' : null; finish(); return; }

      // Input — same attack buttons as normal fight mode (standard per-player keybinds)
      const k = keysRef.current;
      const _kb = getKeybinds(settings);
      const gp1 = settings.controllerEnabled !== false ? readGamepadInput(0) : null;
      const gp2 = settings.controllerEnabled !== false ? readGamepadInput(1) : null;
      const mergeGp = (kb, gp) => gp ? { left: kb.left || gp.left, right: kb.right || gp.right, jump: kb.jump || gp.jump, up: kb.up || gp.up, down: kb.down || gp.down, sig: kb.sig || gp.sig, power: kb.power || gp.power, superMove: kb.superMove || gp.superMove, heavy: kb.heavy || gp.heavy } : kb;
      const stripPowers = (inp) => { inp.power = false; return inp; };

      fighters.forEach((f, i) => {
        if (f.hp <= 0) { f.respawnTimer -= dt; if (f.respawnTimer <= 0) respawnFighter(f); return; }
        if (f.invincible > 0) f.invincible--;
        let input;
        if (f.isAI) { input = ctfAI(f); }
        else {
          if (combo === 'pp_cc') {
            if (f.slot === 'p1') input = stripPowers(mergeGp(readPlayerInput(k, _kb.p1), gp1));
            else if (f.slot === 'p2') input = stripPowers(mergeGp(readPlayerInput(k, _kb.p2), gp2));
            else input = ctfAI(f);
          } else if (combo === 'pc_pc') {
            if (f.slot === 'p1') input = stripPowers(mergeGp(readPlayerInput(k, _kb.p1), gp1));
            else if (f.slot === 'p3') input = stripPowers(mergeGp(readPlayerInput(k, _kb.p2), gp2));
            else input = ctfAI(f);
          } else {
            if (f.slot === 'p1') input = stripPowers(mergeGp(readSinglePlayerInput(k, _kb.p1, _kb.p2), gp1));
            else input = ctfAI(f);
          }
        }

        updateFighter(f, input, platforms, WORLD_W, WORLD_H, null);
        // Enclosed arena — bounce off world walls
        if (f.x < 20) { f.x = 20; f.vx = Math.abs(f.vx) * 0.5; }
        if (f.x > WORLD_W - 20) { f.x = WORLD_W - 20; f.vx = -Math.abs(f.vx) * 0.5; }
        if (f.y < 30) { f.y = 30; f.vy = Math.abs(f.vy) * 0.3; }
        if (f.y > WORLD_H - 40) { f.y = WORLD_H - 40; f.vy = -Math.abs(f.vy) * 0.3; f.grounded = true; }

        // HP-based death
        if (f.hp <= 0 && f.respawnTimer <= 0) {
          f.respawnTimer = matchSettings.respawnTime;
          for (const key of ['A', 'B']) { const fl = flags[key]; if (fl.carrier === f) { fl.state = 'dropped'; fl.x = f.x; fl.y = f.y; fl.carrier = null; fl.returnTimer = 300; } }
        }
      });

      // Flag logic
      for (const key of ['A', 'B']) {
        const fl = flags[key];
        if (fl.state === 'carried' && fl.carrier) {
          fl.x = fl.carrier.x; fl.y = fl.carrier.y - 30;
          checkFlagCapture(fl.carrier);
        } else if (fl.state === 'dropped') {
          fl.returnTimer--;
          fl.vy = (fl.vy || 0) + 0.4; fl.y += fl.vy;
          for (const p of platforms) { if (fl.vy >= 0 && fl.x > p.x && fl.x < p.x + p.w && fl.y >= p.y && fl.y <= p.y + 12) { fl.y = p.y; fl.vy = 0; } }
          if (fl.returnTimer <= 0) { fl.state = 'base'; fl.x = fl.baseX; fl.y = fl.baseY; fl.vy = 0; sfx.checkpoint(); }
        }
      }
      fighters.forEach(f => { if (f.hp > 0 && f.invincible <= 0) checkFlagPickup(f); });

      // Combat — sigs and heavies only (powers/supers already stripped)
      for (let i = 0; i < fighters.length; i++) {
        for (let j = 0; j < fighters.length; j++) {
          if (i === j) continue;
          const a = fighters[i], b = fighters[j];
          if (a.hp <= 0 || b.hp <= 0) continue;
          if (!matchSettings.friendlyFire && a.team === b.team) continue;
          if (checkHit(a, b)) {
            applyHit(a, b);
            const dmgDealt = a.attackData?.damage || 10;
            b.hp = Math.max(0, b.hp - dmgDealt);
            sfx.hit();
            for (const key of ['A', 'B']) { const fl = flags[key]; if (fl.carrier === b && Math.random() < 0.3) { fl.state = 'dropped'; fl.x = b.x; fl.y = b.y; fl.carrier = null; fl.returnTimer = 300; fl.vy = -3; } }
          }
        }
      }
      fighters.forEach(f => { updateProjectiles(f, fighters.find(o => o !== f && o.team !== f.team)); });

      // ── Camera + Render — split screen for 2 human players ──
      const humans = fighters.filter(f => !f.isAI);
      if (humans.length >= 2) {
        const t1 = humans[0], t2 = humans[1];
        const halfW = VIEW_W / 2;
        camX += ((t1.x - halfW / 2) - camX) * 0.1;
        camY += ((t1.y - VIEW_H / 2) - camY) * 0.1;
        camX2 += ((t2.x - halfW / 2) - camX2) * 0.1;
        camY2 += ((t2.y - VIEW_H / 2) - camY2) * 0.1;
        camX = Math.max(0, Math.min(WORLD_W - halfW, camX));
        camY = Math.max(0, Math.min(WORLD_H - VIEW_H, camY));
        camX2 = Math.max(0, Math.min(WORLD_W - halfW, camX2));
        camY2 = Math.max(0, Math.min(WORLD_H - VIEW_H, camY2));
        drawScene(ctx, gameRef.current, frame, camX, camY, { x: 0, y: 0, w: halfW, h: VIEW_H });
        drawScene(ctx, gameRef.current, frame, camX2, camY2, { x: halfW, y: 0, w: halfW, h: VIEW_H });
        ctx.fillStyle = '#222'; ctx.fillRect(halfW - 2, 0, 4, VIEW_H);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(halfW - 1, 0, 2, VIEW_H);
      } else {
        const camTarget = humans[0] || fighters[0];
        if (camTarget) {
          let tx = camTarget.x - VIEW_W / 2;
          let ty = camTarget.y - VIEW_H / 2;
          camX += (tx - camX) * 0.1;
          camY += (ty - camY) * 0.1;
          camX = Math.max(0, Math.min(WORLD_W - VIEW_W, camX));
          camY = Math.max(0, Math.min(WORLD_H - VIEW_H, camY));
        }
        drawScene(ctx, gameRef.current, frame, camX, camY, { x: 0, y: 0, w: VIEW_W, h: VIEW_H });
      }
      requestAnimationFrame(loop);
    };

    function finish() {
      gameRef.current.running = false;
      const winner = gameRef.current.winner;
      setResult({ winner, score: { ...score }, time: matchSettings.matchTime - timer });
      setPhase('over');
      music.stop();
      onAward?.({ sport: 'ctf', p1Won: winner === 'A', stats: {}, tournamentWon: false });
    }

    requestAnimationFrame(loop);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); if (gameRef.current) gameRef.current.running = false; music.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Setup / Character Select ──
  if (phase === 'setup') {
    const slotOrder = ['p1', 'p2', 'p3', 'p4'];
    const slotTeam = { p1: 'A', p2: 'A', p3: 'B', p4: 'B' };
    const slotLabel = (s) => {
      const team = slotTeam[s];
      const cpu = isCPU(s);
      return `${team === 'A' ? 'BLUE' : 'RED'} ${s.toUpperCase()}${cpu ? ' (CPU)' : ''}`;
    };

    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-4xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🚩" size={14} /> CAPTURE THE FLAG</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1">2v2 offline CTF across the rooftops of Split City at Night. Steal the enemy flag, defend your base, and dominate the skyline! Sigs, Heavies &amp; Supers — no powers.</p>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> SPORTS</button>
        </div>

        {/* Team combo */}
        <div className="w-full">
          <p className="text-[11px] font-heading text-muted-foreground tracking-wider mb-2">TEAM COMBO</p>
          <div className="grid grid-cols-3 gap-2">
            {TEAM_COMBOS.map(c => (
              <button key={c.id} onClick={() => { setCombo(c.id); sfx.click(); }}
                className={`p-3 rounded-lg border-2 text-center transition hover:scale-[1.02] ${combo === c.id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                <p className="font-heading text-xs text-foreground">{c.label}</p>
                <p className="text-[9px] text-muted-foreground font-body mt-1">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Character select */}
        <div className="w-full">
          <div className="flex gap-1 mb-2 flex-wrap">
            {slotOrder.map(s => (
              <button key={s} onClick={() => { setActiveSlot(s); sfx.click(); }}
                className={`px-3 py-1 rounded font-heading text-[10px] tracking-wider transition ${activeSlot === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}
                style={{ borderLeft: `4px solid ${TEAM_COLORS[slotTeam[s]]}` }}>
                {slotLabel(s)}
              </button>
            ))}
          </div>

          {/* Active slot char select */}
          <div className="flex gap-3 items-start">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 flex-1 max-h-[200px] overflow-y-auto p-1 rounded-lg bg-muted/30 border border-border/50">
              {charPool.map(({ id, char }) => (
                <button key={id} onClick={() => { setSlots(s => ({ ...s, [activeSlot]: id })); sfx.characterSelect(); }}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded border-2 transition hover:scale-[1.05] ${slots[activeSlot] === id ? 'border-accent bg-accent/10' : 'border-transparent bg-card'}`}>
                  <span className="w-7 h-7 rounded-full" style={{ background: char?.color || '#888' }} />
                  <span className="font-heading text-[7px] tracking-wider text-center leading-tight">{(char?.name || id).toUpperCase().slice(0, 7)}</span>
                </button>
              ))}
            </div>

            {/* Stats + Element for active slot — NO HP stat, all characters same HP */}
            <div className="w-56 flex flex-col gap-2">
              {(() => {
                const char = resolveChar(slots[activeSlot]);
                const stats = char?.stats || {};
                const levelData = getCharLevelData({ charLevels }, slots[activeSlot]);
                const statRows = [
                  { label: 'Power', val: stats.power }, { label: 'Speed', val: stats.speed },
                  { label: 'Defense', val: stats.defense }, { label: 'Utility', val: stats.utility },
                  { label: 'Control', val: stats.control },
                ];
                return (
                  <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-8 h-8 rounded-full" style={{ background: char?.color || '#888' }} />
                      <div>
                        <p className="font-heading text-sm" style={{ color: TEAM_COLORS[slotTeam[activeSlot]] }}>{char?.name}</p>
                        <p className="text-[9px] text-muted-foreground font-body">Lv {levelData.level}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-body text-center mb-1">All characters have {CTF_HP} HP</p>
                    {statRows.map(r => (
                      <div key={r.label} className="flex items-center gap-2">
                        <span className="text-[9px] font-body text-muted-foreground w-14">{r.label}</span>
                        <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${((r.val || 5) / 10) * 100}%`, background: TEAM_COLORS[slotTeam[activeSlot]] }} />
                        </div>
                        <span className="text-[9px] font-heading text-foreground w-4 text-right">{r.val || 5}</span>
                      </div>
                    ))}
                    <ElementSelect charId={slots[activeSlot]} currentElement={elements[activeSlot]}
                      onSelect={(el) => { setElements(e => ({ ...e, [activeSlot]: el })); sfx.click(); }}
                      charLevels={charLevels} label="ELEMENT" />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Match settings */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-[10px] font-body">
            <span className="text-muted-foreground">Capture Limit</span>
            <input type="number" value={matchSettings.captureLimit} min={1} max={10}
              onChange={e => setMatchSettings(s => ({ ...s, captureLimit: parseInt(e.target.value) || 3 }))}
              className="bg-card border border-border rounded px-2 py-1 text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-body">
            <span className="text-muted-foreground">Match Time (s)</span>
            <input type="number" value={matchSettings.matchTime} min={60} max={600} step={30}
              onChange={e => setMatchSettings(s => ({ ...s, matchTime: parseInt(e.target.value) || 300 }))}
              className="bg-card border border-border rounded px-2 py-1 text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-body">
            <span className="text-muted-foreground">Respawn Time (s)</span>
            <input type="number" value={matchSettings.respawnTime} min={1} max={10}
              onChange={e => setMatchSettings(s => ({ ...s, respawnTime: parseInt(e.target.value) || 3 }))}
              className="bg-card border border-border rounded px-2 py-1 text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-body">
            <span className="text-muted-foreground">CPU Difficulty</span>
            <select value={matchSettings.cpuDifficulty}
              onChange={e => setMatchSettings(s => ({ ...s, cpuDifficulty: e.target.value }))}
              className="bg-card border border-border rounded px-2 py-1 text-foreground">
              <option value="easy">Easy</option>
              <option value="regular">Regular</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[10px] font-body">
            <input type="checkbox" checked={matchSettings.friendlyFire}
              onChange={e => setMatchSettings(s => ({ ...s, friendlyFire: e.target.checked }))} />
            <span className="text-muted-foreground">Friendly Fire</span>
          </label>
        </div>

        <button onClick={startMatch} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-heading text-lg hover:opacity-90 animate-pulse"><GameIcon emoji="▶" size={14} /> START MATCH</button>
      </div>
    );
  }

  // ── Game over ──
  if (phase === 'over' && result) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <h2 className={`text-4xl font-heading tracking-wider ${result.winner === 'A' ? 'text-primary' : result.winner === 'B' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {result.winner === 'A' ? '🔵 BLUE TEAM WINS!' : result.winner === 'B' ? '🔴 RED TEAM WINS!' : 'DRAW!'}
        </h2>
        <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-3 items-center">
          <div className="flex gap-8 text-center">
            <div><p className="text-[10px] font-heading text-primary">BLUE CAPTURES</p><p className="text-3xl font-heading text-primary">{result.score.A}</p></div>
            <div><p className="text-[10px] font-heading text-destructive">RED CAPTURES</p><p className="text-3xl font-heading text-destructive">{result.score.B}</p></div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPhase('setup'); setResult(null); sfx.click(); }} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="↻" size={14} /> PLAY AGAIN</button>
          <button onClick={onExit} className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">SPORTS</button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <div className="w-full flex justify-between items-center px-2 max-w-[1280px]">
        <button onClick={onExit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Quit</button>
        <span className="text-[10px] text-muted-foreground font-body">Move: <GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} />/AD · Jump: <GameIcon emoji="↑" size={14} />/W · Sig: J/K/L · Heavy: I · ESC: Pause · Sigs, Heavies &amp; Supers — no powers</span>
      </div>
      <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="rounded-lg shadow-2xl w-full"
        style={{ width: '100%', maxWidth: VIEW_W + 'px', aspectRatio: '16 / 9', height: 'auto' }} />
    </div>
  );
}

// ── Rendering (viewport-aware for split screen) ──
function drawScene(ctx, g, frame, camX, camY, vp) {
  if (!vp) vp = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
  const { fighters, flags, score, timer, platforms } = g;
  const vx = vp.x, vy = vp.y, vw = vp.w, vh = vp.h;

  ctx.save();
  ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();

  // Night sky gradient
  const skyGrad = ctx.createLinearGradient(vx, vy, vx, vy + vh);
  skyGrad.addColorStop(0, '#0a0e2a'); skyGrad.addColorStop(0.5, '#141a3a'); skyGrad.addColorStop(1, '#1a2050');
  ctx.fillStyle = skyGrad; ctx.fillRect(vx, vy, vw, vh);

  // Stars (slight parallax)
  ctx.fillStyle = 'rgba(255,255,220,0.6)';
  for (let i = 0; i < 45; i++) { const sx = vx + (((i * 73 - camX * 0.05) % vw) + vw) % vw; const sy = vy + (i * 41) % 250; const tw = 0.5 + 0.5 * Math.sin(frame * 0.03 + i); ctx.globalAlpha = tw * 0.7; ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;

  // Moon
  ctx.fillStyle = 'rgba(230,230,200,0.8)'; ctx.beginPath(); ctx.arc(vx + vw - 90, vy + 65, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a2050'; ctx.beginPath(); ctx.arc(vx + vw - 80, vy + 58, 24, 0, Math.PI * 2); ctx.fill();

  // ── World space (with camera offset, clipped to viewport) ──
  ctx.save();
  ctx.translate(vx - camX, vy - camY);

  // Distant skyline (slow parallax)
  ctx.fillStyle = 'rgba(20,28,60,0.7)';
  for (let i = 0; i < 30; i++) { const bx = (i * 90 - camX * 0.15) % (WORLD_W + 100) - 50; const bh = 120 + (i % 4) * 50; ctx.fillRect(bx, WORLD_H - bh - 40, 80, bh); }
  // Skyline windows
  ctx.fillStyle = 'rgba(255,220,120,0.4)';
  for (let i = 0; i < 30; i++) { const bx = (i * 90 - camX * 0.15) % (WORLD_W + 100) - 50; const bh = 120 + (i % 4) * 50; for (let wy = WORLD_H - bh - 30; wy < WORLD_H - 50; wy += 16) for (let wx = bx + 6; wx < bx + 74; wx += 14) if (Math.sin(wx * 2.1 + wy * 1.3) > 0.2) ctx.fillRect(wx, wy, 5, 7); }

  // Closer skyline
  ctx.fillStyle = 'rgba(30,38,70,0.8)';
  for (let i = 0; i < 25; i++) { const bx = (i * 120 - camX * 0.25) % (WORLD_W + 150) - 75; const bh = 80 + (i % 3) * 40; ctx.fillRect(bx, WORLD_H - bh - 40, 100, bh); }

  // Neon reflections (ground level)
  ctx.fillStyle = 'rgba(100,60,200,0.05)'; ctx.fillRect(0, WORLD_H - 70, WORLD_W, 70);

  // Platforms (rooftops)
  drawPlatforms(ctx, platforms, frame, 'splitcity');

  // Enhanced rooftop detail
  platforms.forEach(p => {
    if (p.isFloor) {
      // Street level floor — detailed
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(p.x, p.y, p.w, 2);
      // Street lines
      ctx.fillStyle = 'rgba(255,220,120,0.2)';
      for (let lx = p.x + 20; lx < p.x + p.w; lx += 60) ctx.fillRect(lx, p.y + 20, 30, 2);
      return;
    }
    // Building facade below platform
    const fGrad = ctx.createLinearGradient(0, p.y, 0, WORLD_H);
    fGrad.addColorStop(0, 'rgba(40,50,80,0.6)'); fGrad.addColorStop(1, 'rgba(20,25,50,0.3)');
    ctx.fillStyle = fGrad; ctx.fillRect(p.x, p.y + p.h, p.w, WORLD_H - p.y - p.h);
    // Windows in facade
    ctx.fillStyle = 'rgba(255,220,120,0.3)';
    for (let wy = p.y + 24; wy < WORLD_H - 50; wy += 20) for (let wx = p.x + 8; wx < p.x + p.w - 8; wx += 16) if (Math.sin(wx * 3 + wy * 2) > 0.1) ctx.fillRect(wx, wy, 5, 8);
    // Neon edge
    ctx.fillStyle = `rgba(100,200,255,${0.3 + 0.1 * Math.sin(frame * 0.05 + p.x)})`; ctx.fillRect(p.x, p.y, p.w, 2);
    // Isolated flag base — draw pillar support
    if (p.flagBase) {
      ctx.fillStyle = 'rgba(50,60,90,0.7)'; ctx.fillRect(p.x + p.w / 2 - 8, p.y + p.h, 16, WORLD_H - p.y - p.h);
    }
  });

  // Team base markers
  drawBase(ctx, TEAM_A_BASE, TEAM_COLORS.A, frame, 'A');
  drawBase(ctx, TEAM_B_BASE, TEAM_COLORS.B, frame, 'B');

  // Flags
  drawFlag(ctx, flags.A, TEAM_COLORS.A, frame);
  drawFlag(ctx, flags.B, TEAM_COLORS.B, frame);

  // Fighters — keep character color, draw team uniform overlay
  fighters.forEach(f => {
    if (f.hp <= 0) return;
    const flashing = f.invincible > 0 && Math.floor(frame / 4) % 2 === 0;
    if (flashing) return;
    const charColor = f.char?.color || '#888';
    // Shadow (team-colored)
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = TEAM_COLORS[f.team];
    ctx.beginPath(); ctx.ellipse(f.x, f.y + 3, 28, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Draw stickman with character's own color (NOT team color)
    drawStickman(ctx, f.x, f.y, charColor, f.facing, frame, 1, false, f.state, f.char, f.powerActive);
    // Team uniform overlay — colored jersey band on torso
    ctx.fillStyle = TEAM_COLORS[f.team];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(f.x - 11, f.y - 28, 22, 7); // jersey band
    ctx.globalAlpha = 1;
    // Team indicator dot above head
    ctx.fillStyle = TEAM_COLORS[f.team];
    ctx.beginPath(); ctx.arc(f.x, f.y - 52, 4, 0, Math.PI * 2); ctx.fill();
    if (f.attackData && f.state === 'attacking') drawAttackEffect(ctx, f.x, f.y, f.attackData, f.attackData.progress, f.facing, f.attackData.color || charColor, f.attackData.isNormal, f.char?.id, f.char?.power, f.powerActive);
    drawProjectiles(ctx, f);
  });

  ctx.restore();
  // ── End world space ──

  // HUD (relative to viewport) — NO HP bars at bottom
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(vx, vy, vw, 50);
  ctx.font = 'bold 22px Orbitron'; ctx.textAlign = 'center';
  ctx.fillStyle = TEAM_COLORS.A; ctx.fillText(`${score.A}`, vx + vw / 2 - 70, vy + 32);
  ctx.fillStyle = '#888'; ctx.fillText('vs', vx + vw / 2, vy + 32);
  ctx.fillStyle = TEAM_COLORS.B; ctx.fillText(`${score.B}`, vx + vw / 2 + 70, vy + 32);
  // Timer
  const mins = Math.floor(timer / 60); const secs = Math.floor(timer % 60);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px Orbitron'; ctx.textAlign = 'left';
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, vx + 16, vy + 32);
  // Capture limit
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 10px Orbitron';
  ctx.fillText(`FIRST TO ${g.captureLimit || 3}`, vx + vw - 16, vy + 32);
  // Carrier indicator
  for (const key of ['A', 'B']) {
    const fl = flags[key];
    if (fl.state === 'carried' && fl.carrier) {
      ctx.fillStyle = TEAM_COLORS[fl.carrier.team]; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(`${fl.carrier.char?.name || fl.carrier.slot} has ${key === 'A' ? 'RED' : 'BLUE'} flag!`, vx + vw / 2, vy + 44);
    }
  }

  ctx.restore(); // end viewport clip
}

function drawBase(ctx, base, color, frame, team) {
  ctx.fillStyle = `${color}33`; ctx.beginPath(); ctx.ellipse(base.x, base.y + 5, 45, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + 0.2 * Math.sin(frame * 0.05);
  ctx.beginPath(); ctx.ellipse(base.x, base.y + 5, 45, 14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = color; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
  ctx.globalAlpha = 0.6; ctx.fillText(team, base.x, base.y + 8); ctx.globalAlpha = 1;
}

function drawFlag(ctx, flag, color, frame) {
  if (flag.state === 'carried') return;
  const x = flag.x, y = flag.y;
  ctx.fillStyle = '#888'; ctx.fillRect(x - 1.5, y - 36, 3, 36);
  ctx.fillStyle = color;
  const wave = Math.sin(frame * 0.1) * 4;
  ctx.beginPath(); ctx.moveTo(x + 1.5, y - 36);
  ctx.lineTo(x + 22 + wave, y - 30); ctx.lineTo(x + 1.5, y - 22); ctx.closePath(); ctx.fill();
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.fillRect(x - 1.5, y - 36, 3, 36); ctx.shadowBlur = 0;
}