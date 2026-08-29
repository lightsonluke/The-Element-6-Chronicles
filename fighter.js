// Fighter physics, state management, and combat logic — Brawlhalla-style smooth collisions
// Each fighter has: heavy attacks (unique per character), signatures, super moves, and power activation

import { getPowerEffect, SINGLE_RANDOM_POWER_CHARS } from './powerEffects.js';
import { applyShikigamiStat } from './shikigami.js';
import { DOWN_HEAVIES } from './downHeavies.js';
import { drawWhip } from './whipRenderer.js';
import { activateGenPower, updateGenProjectiles, onGenPowerExpire } from './genPowers.js';

export const GRAVITY = 0.42;
export const JUMP_FORCE = -14.5;
export const DOUBLE_JUMP_FORCE = -12.5;
export const MOVE_SPEED = 4.0;
export const AIR_SPEED = 3.4;
export const MAX_FALL_SPEED = 15;
export const KNOCKBACK_DECAY = 0.86; // smoother decay = floatier, more Brawlhalla-like
export const GROUND_FRICTION = 0.78;
export const AIR_FRICTION = 0.94;
export const ACCEL_GROUND = 1.2;
export const ACCEL_AIR = 0.9;

const SIG_COOLDOWN = 45;    // 0.75 seconds at 60fps
const NORMAL_COOLDOWN = 8;
const HEAVY_COOLDOWN = 42;  // 0.70 seconds at 60fps
const KNOCKBACK_SCALE = 0.40; // global 60% knockback reduction for all attacks

// CPU difficulty configs
// (CPU_DIFFICULTY moved to botAI.js)

// Stat-derived combat multipliers — stats 3..10 map to visible differences
// Speed: Yellow(10)=1.40x vs Grey(3)=0.70x — Yellow wins a race by a wide margin
// Power: Red(10)=1.35x vs Magenta(3)=0.75x — strong hits deal visibly more damage
// Defense: Silver(10)=40% reduction vs Emerald(3)=0% — tanky characters survive longer
function statSpeedMul(s) { return 0.55 + (s || 5) * 0.085; }
function statPowerMul(s) { return 0.60 + (s || 5) * 0.075; }
function statDefenseReduction(s) { return Math.max(0, ((s || 5) - 3) * 0.057); } // 3→0%, 10→40%
// Control: higher = faster attack recovery + more hitstun applied to enemies
function statControlRecoveryMul(s) { return 1.0 - Math.max(0, ((s || 5) - 3) * 0.04); } // 3→1.0, 10→0.72
function statControlHitstunMul(s) { return 1.0 + Math.max(0, ((s || 5) - 3) * 0.04); } // 3→1.0, 10→1.28
// Utility: higher = faster movement, higher jumps, longer mining range
function statUtilityMul(s) { return 1.0 + Math.max(0, ((s || 5) - 3) * 0.03); } // 3→1.0, 10→1.21

export function createFighter(charData, startX, startY, facing) {
  // Shikigami grants +0.5 to one stat in combat (silent — not shown in stats UI).
  // Modes set `charData.shikigamiId` before calling createFighter to opt in.
  const stats = applyShikigamiStat(charData?.stats || {}, charData?.shikigamiId);
  return {
    char: charData,
    statSpeedMul: statSpeedMul(stats.speed),
    statPowerMul: statPowerMul(stats.power),
    statDefenseReduction: statDefenseReduction(stats.defense),
    statControlRecoveryMul: statControlRecoveryMul(stats.control),
    statControlHitstunMul: statControlHitstunMul(stats.control),
    statUtilityMul: statUtilityMul(stats.utility),
    x: startX,
    y: startY,
    prevX: startX,
    prevY: startY,
    vx: 0,
    vy: 0,
    facing,
    grounded: false,
    coyoteTime: 0,
    jumps: 2,
    maxJumps: 2,
    damage: 0,
    stocks: 3,
    frame: 0,
    state: 'idle',
    attackTimer: 0,
    attackData: null,
    superMeter: 50,
    maxSuper: 100,
    hitstun: 0,
    invincible: 0,
    isAI: false,
    aiTimer: 0,
    aiAction: null,
    hitEffects: [],
    landingLag: 0,
    sigCooldown: 0,
    normalCooldown: 0,
    heavyCooldown: 0,
    doubleJumpParticles: [],
    cpuDifficulty: 'regular',
    canFly: false,
    isFlying: false,
    canPhase: charData?.id === 'emerald',
    gravityInverted: false,
    // Variable jump height
    jumpHeld: false,
    jumpCutApplied: false,
    // DI (directional influence) — slight knockback steering
    diX: 0,
    diY: 0,
    recoveryCooldown: 0,
    groundPoundCooldown: 0,
    powerCooldown: 0,
    powerActive: null,
    powerTimer: 0,
    gameMode: null,
    hp: 150,
    speedBoost: 1,
    damageBoost: 1,
    rangeBoost: 1,
    shieldAmount: 0,
    slowTimer: 0,
    noBlastKill: 0,
    dotTargets: null,
    dotDamage: 0,
    moveStats: { heavy: 0, downHeavy: 0, groundPound: 0, recovery: 0, aerial: 0, sigSide: 0, sigUp: 0, sigDown: 0, super: 0, power: 0, normal: 0 },
    recoveryAirUses: 0,
    platformMaterial: null,
    powerDisabled: 0,
    trapped: false,
    projectiles: [],
    knockbackMul: 1,
    knockbackReduction: 0,
  };
}

function activatePower(fighter, opponent) {
  const effect = getPowerEffect(fighter.char.baseCharId || fighter.char.id, fighter.char);
  if (!effect) return;

  // Soccer mode: powers launch the ball instead of damaging opponents
  if (fighter.gameMode === 'soccer') {
    fighter.powerCooldown = effect.cooldown * 60;
    fighter._maxPowerCooldown = fighter.powerCooldown;
    fighter.powerActive = 'soccer_power';
    fighter.powerTimer = 20;
    fighter._soccerPowerActivated = true;
    return;
  }

  // Multiple opponents: pick a random alive one for targeted powers
  let _savedAllOpps = null;
  if (fighter._allOpponents && fighter._allOpponents.length > 1) {
    const alive = fighter._allOpponents.filter(o => o && o.stocks > 0);
    if (alive.length > 0) opponent = alive[Math.floor(Math.random() * alive.length)];
    // For characters whose power should only ever hit ONE random opponent
    // (even in 3+ player matches), restrict the target list to that single
    // pick so every "forEach opponent" loop below affects only them.
    if (SINGLE_RANDOM_POWER_CHARS.has(fighter.char.id)) {
      _savedAllOpps = fighter._allOpponents;
      fighter._allOpponents = opponent ? [opponent] : [];
    }
  }

  fighter.powerCooldown = effect.cooldown * 60;
  const selfDamageBonus = effect.damageScalesWithSelfDamage ? fighter.damage * 0.01 : 0;

  // ── Gen 1-4 custom power button abilities — handle before the generic switch ──
  if (activateGenPower(fighter, opponent, effect)) {
    if (_savedAllOpps) fighter._allOpponents = _savedAllOpps;
    return;
  }

  switch (effect.type) {
    case 'stat_boost':
      fighter.powerActive = 'stat_boost'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.speedBoost = effect.speedMul || 1; fighter.damageBoost = effect.damageMul || 1; fighter.rangeBoost = effect.rangeMul || 1;
      if (effect.knockbackMul) fighter.knockbackMul = effect.knockbackMul;
      if (effect.damageReduction) fighter.shieldAmount = effect.damageReduction;
      if (effect.knockbackImmune) fighter.invincible = Math.max(fighter.invincible, effect.knockbackImmune);
      if (effect.selfDamage) fighter.damage += effect.selfDamage;
      break;
    case 'spawn_clone':
      fighter.powerActive = 'spawn_clone'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.damageBoost = effect.damageMul || 1;
      fighter._clone = { x: fighter.x - fighter.facing * 50, y: fighter.y, facing: -fighter.facing, frame: 0, life: Math.min(effect.duration, 10) * 60, char: fighter.char };
      break;
    case 'invincible': {
      const iDur = Math.min(effect.duration, 5); // phasing/immunity capped at 5s
      fighter.powerActive = 'invincible'; fighter.powerTimer = iDur * 60; fighter.invincible = iDur * 60;
      if (effect.damageReduction) fighter.shieldAmount = effect.damageReduction;
      break;
    }
    case 'shield': {
      // noAttackImmune (Silver): no invincibility — just damage + knockback reduction for the full duration.
      // Other shields: full attack immunity, capped at 5s.
      const sDur = effect.noAttackImmune ? Math.min(effect.duration, 10) : Math.min(effect.duration, 5);
      fighter.powerActive = 'shield'; fighter.powerTimer = sDur * 60; fighter.shieldAmount = effect.damageReduction || 0.5;
      fighter.knockbackReduction = effect.knockbackReduction || 0;
      if (!effect.noAttackImmune) fighter.invincible = Math.max(fighter.invincible, sDur * 60);
      if (effect.stunImmune) fighter.invincible = Math.max(fighter.invincible, 20);
      break;
    }
    case 'freeze_opponent':
      fighter.powerActive = 'freeze'; fighter.powerTimer = Math.min(effect.duration, 5) * 60;
      if (opponent) { opponent.hitstun = Math.min(effect.duration, 5) * 60; opponent.state = 'hitstun'; opponent.vx = 0; opponent.vy = 0; }
      break;
    case 'launch_opponent':
      if (opponent) {
        const force = effect.launchForce || 18;
        opponent.vy = (effect.reverseGravity ? force : -force) * KNOCKBACK_SCALE;
        opponent.grounded = false; opponent.noBlastKill = 120; opponent.state = 'hitstun'; opponent.hitstun = 30;
        if (effect.reverseGravity) opponent.gravityInverted = true;
      }
      break;
    case 'teleport': {
      let destX = opponent ? opponent.x + fighter.facing * 80 : fighter.x + fighter.facing * 200;
      const destY = opponent ? opponent.y : fighter.y;
      // Raycast from fighter to destination — stop portal at first solid wall/platform
      const plats = fighter._platforms || [];
      const dir = Math.sign(destX - fighter.x) || 1;
      const totalDist = Math.abs(destX - fighter.x);
      for (let d = 0; d <= totalDist; d += 8) {
        const checkX = fighter.x + dir * d;
        for (const p of plats) {
          const mat = p.material || 'normal';
          if (['water','lava','cloud','acid','tar','antigravity'].includes(mat)) continue;
          if (p._deleted > 0 || p.h < 18) continue;
          if (checkX > p.x - 16 && checkX < p.x + p.w + 16 && fighter.y > p.y && fighter.y < p.y + p.h) {
            destX = dir > 0 ? p.x - 20 : p.x + p.w + 20;
            d = totalDist + 1; break;
          }
        }
      }
      if (opponent) {
        fighter._portalEffect = { fromX: fighter.x, fromY: fighter.y, toX: destX, toY: destY, timer: 40, maxTimer: 40 };
        fighter.x = destX; fighter.y = destY; fighter.facing = -fighter.facing;
      } fighter.invincible = 15;
      break;
    }
    case 'damage_over_time':
      fighter.powerActive = 'dot'; fighter.powerTimer = Math.min(effect.duration, 10) * 60; fighter.dotDamage = effect.dotDamage || 2;
      fighter.dotTargets = (fighter._allOpponents || (opponent ? [opponent] : [])).filter(o => o && o.stocks > 0);
      break;
    case 'slow_opponent':
      fighter.powerActive = 'slow'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      { const _opps = fighter._allOpponents || (opponent ? [opponent] : []);
        _opps.forEach(opp => { if (!opp || opp.stocks <= 0) return;
          opp.slowTimer = effect.duration * 60; opp.speedMul = effect.speedMul ?? 0.4; }); }
      break;
    case 'flight':
      fighter.powerActive = 'flight'; fighter.powerTimer = Math.min(effect.duration, 10) * 60; fighter.canFly = true;
      break;
    case 'infinite_jumps':
      fighter.powerActive = 'infinite_jumps'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.maxJumps = 999; fighter.jumps = 999; fighter.canFly = true;
      break;
    case 'heal':
      fighter.powerActive = 'heal'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter._healPerTick = effect.healAmount ? effect.healAmount / (Math.min(effect.duration, 10) * 2) : 0;
      fighter._healOpponents = !!effect.healOpponents;
      if (effect.reviveChance) fighter.reviveChance = effect.reviveChance;
      break;
    case 'lightning_strike':
      fighter.powerActive = 'lightning_strike'; fighter.powerTimer = 60;
      if (opponent) {
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({
          type: 'lightning_bolt', x: opponent.x, y: -50, vx: 0, vy: 0,
          targetX: opponent.x, targetY: opponent.y,
          damage: (effect.damage || 25) * (fighter.damageBoost || 1) * (fighter.statPowerMul || 1) + selfDamageBonus,
          color: '#FFFF44', life: 85, hitApplied: false, warning: 45, size: 50,
        });
      }
      break;
    case 'pull_opponent':
      if (opponent) {
        const dx = fighter.x - opponent.x; const force = effect.pullForce || 14;
        opponent.vx = Math.sign(dx) * force * KNOCKBACK_SCALE; opponent.state = 'hitstun'; opponent.hitstun = effect.stunDuration || 15;
      }
      break;
    case 'range_boost':
      fighter.powerActive = 'range_boost'; fighter.powerTimer = Math.min(effect.duration, 10) * 60; fighter.rangeBoost = effect.rangeMul || 1.5;
      break;
    case 'charge_attack':
      fighter.powerActive = 'charge_attack'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      fighter.damageBoost = (effect.damageMul || 2) + selfDamageBonus;
      break;
    case 'beam': {
      fighter.powerActive = 'beam'; fighter.powerTimer = 20;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({
        type: 'beam',
        x: fighter.x + fighter.facing * 36, y: fighter.y - 38,
        vx: fighter.facing * (effect.speed || 18), vy: 0,
        damage: (effect.damage || 18) * (fighter.damageBoost || 1) * (fighter.statPowerMul || 1) + selfDamageBonus,
        knockback: effect.knockback || 14,
        color: effect.color || fighter.char.color || '#DC143C',
        life: 48, facing: fighter.facing, hitIds: {},
      });
      break;
    }
    case 'homing':
      fighter.powerActive = 'homing'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      if (effect.dodgeChance) fighter.dodgeChance = effect.dodgeChance;
      break;
    case 'reverse_controls':
      fighter.powerActive = 'reverse'; fighter.powerTimer = Math.min(effect.duration, 5) * 60;
      { const _opps = fighter._allOpponents || (opponent ? [opponent] : []);
        _opps.forEach(opp => { if (!opp || opp.stocks <= 0) return;
          opp.reverseControls = Math.min(effect.duration, 5) * 60; opp.slowTimer = Math.min(opp.slowTimer || 0, 30); }); }
      break;
    case 'random_effect': {
      const types = ['stat_boost', 'invincible', 'shield', 'freeze_opponent', 'damage_over_time', 'slow_opponent', 'reverse_controls'];
      const rt = types[Math.floor(Math.random() * types.length)];
      fighter.powerActive = rt; fighter.powerTimer = Math.min(effect.duration || 5, 10) * 60;
      const _rops = fighter._allOpponents || (opponent ? [opponent] : []);
      if (rt === 'stat_boost') { fighter.speedBoost = 1.5; fighter.damageBoost = 1.5; }
      else if (rt === 'invincible') fighter.invincible = 5 * 60;
      else if (rt === 'shield') fighter.shieldAmount = 0.5;
      else if (rt === 'freeze_opponent') { _rops.forEach(o => { if (o && o.stocks > 0) { o.hitstun = 8 * 60; o.state = 'hitstun'; } }); }
      else if (rt === 'damage_over_time') { fighter.dotDamage = 2; fighter.dotTargets = _rops.filter(o => o && o.stocks > 0); }
      else if (rt === 'slow_opponent') { _rops.forEach(o => { if (o && o.stocks > 0) o.slowTimer = 8 * 60; }); }
      else if (rt === 'reverse_controls') { _rops.forEach(o => { if (o && o.stocks > 0) o.reverseControls = 5 * 60; }); }
      break;
    }
    // ── NEW POWER TYPES ──
    case 'dash_slash': {
      // Actual dash (not teleport): drive horizontal velocity over a short
      // window. Normal platform collision stops the fighter at walls, so the
      // dash can't pass through them. Damage is applied per-frame to opponents
      // the fighter overlaps during the dash.
      fighter.powerActive = 'dash_slash'; fighter.powerTimer = 18; fighter.invincible = 18;
      const dir = fighter.facing;
      const dmg = (effect.damage || 22) * (fighter.damageBoost || 1) * (fighter.statPowerMul || 1);
      const kb = effect.knockback || 1.4;
      let dist;
      if (effect.dashDistance) {
        dist = effect.dashDistance;
      } else if (opponent) {
        const dx = opponent.x - fighter.x;
        fighter.facing = Math.sign(dx) || fighter.facing;
        dist = Math.min(Math.abs(dx) + 60, 420);
      } else {
        dist = 260;
      }
      fighter.vx = fighter.facing * 52;
      fighter.vy = 0;
      fighter._dash = { dir: fighter.facing, distance: dist, traveled: 0, damage: dmg, knockback: kb, hitIds: {}, color: effect.color || fighter.char.color || '#9933FF' };
      fighter._dashSlashEffect = { fromX: fighter.x, toX: fighter.x + fighter.facing * dist, y: fighter.y - 30, timer: 25, maxTimer: 25, facing: fighter.facing };
      break;
    }
    case 'earth_drop':
      fighter.powerActive = 'earth_drop'; fighter.powerTimer = 30;
      if (opponent) {
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({
          type: 'stone_drop', x: opponent.x, y: -100, vx: 0, vy: 0,
          targetX: opponent.x, targetY: opponent.y,
          damage: (effect.damage || 20) * (fighter.damageBoost || 1) * (fighter.statPowerMul || 1),
          color: '#886633', life: 120, hitApplied: false, size: 40,
          _onlyTarget: SINGLE_RANDOM_POWER_CHARS.has(fighter.char.id) ? opponent : null,
        });
      }
      break;
    case 'homing_projectile':
      fighter.powerActive = 'homing_projectile'; fighter.powerTimer = 30;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({
        type: effect.projectileType || 'fireball',
        x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 4, vy: 0, target: opponent,
        damage: (effect.damage || 25) * (fighter.statPowerMul || 1),
        knockback: effect.knockback || 1,
        color: effect.color || '#FF3333', life: 180, hitApplied: false, speed: 4.5,
      });
      break;
    case 'energy_ball': {
      fighter.powerActive = 'energy_ball'; fighter.powerTimer = 30;
      fighter.projectiles = fighter.projectiles || [];
      // Grand Circuit: Maroon's Energy power returns only 1/3 of damage taken (per stock)
      // instead of the full accumulated damage.
      const energyDmg = fighter._gcNoBlast ? Math.floor(fighter.damage / 4) : Math.floor(fighter.damage);
      fighter.projectiles.push({
        type: 'energy_ball', x: fighter.x, y: fighter.y - 30, vx: fighter.facing * 4, vy: 0, target: opponent,
        damage: energyDmg, color: '#800000', life: 180, hitApplied: false, speed: 4,
        willMiss: Math.random() < 0.5,
      });
      break;
    }
    case 'gravity_flip':
      fighter.powerActive = 'gravity_flip'; fighter.powerTimer = effect.duration * 60;
      // Gravity Switch — launch ALL opponents upward, auto-stopped before KO ceiling
      {
        const opps = fighter._allOpponents || (opponent ? [opponent] : []);
        opps.forEach(opp => {
          if (!opp || opp.stocks <= 0) return;
          opp.vy = -6;
          opp.grounded = false;
          opp.noBlastKill = effect.duration * 60 + 60;
          opp._gravCeiling = -450;
          opp._gravCeilingTimer = effect.duration * 60;
          opp._gravFloat = true;
          opp.state = 'hitstun';
          opp.hitstun = 10;
        });
      }
      break;
    case 'demon_strike': {
      fighter.powerActive = 'demon_strike'; fighter.powerTimer = 50;
      fighter.projectiles = fighter.projectiles || [];
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      const tgt = opps.length > 0 ? opps[Math.floor(Math.random() * opps.length)] : opponent;
      if (tgt) {
        const side = tgt.x < fighter.x ? 1 : -1; // spawn on far side so it swoops across
        fighter.projectiles.push({
          type: 'demon', x: tgt.x + side * 320, y: tgt.y - 260, vx: -side * 7, vy: -2,
          targetX: tgt.x, targetY: tgt.y,
          damage: (effect.damage || 18) * (fighter.statPowerMul || 1),
          color: '#FF2400', life: 160, hitApplied: false, size: 52, gravity: 0.22, wing: 0,
        });
      }
      break;
    }
    case 'whip_stun': {
      fighter.powerActive = 'whip_stun'; fighter.powerTimer = 25;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({
        type: 'whip', x: fighter.x + fighter.facing * 20, y: fighter.y - 38,
        vx: 0, vy: 0, facing: fighter.facing,
        damage: (effect.damage || 20) * (fighter.statPowerMul || 1),
        stunDuration: effect.stunDuration || 120, color: effect.color || '#44DDFF',
        life: 32, maxReach: 340, reach: 0, hitIds: {}, bolts: [], fireMode: effect.fireMode, embers: [],
      });
      break;
    }
    case 'platform_delete':
      fighter.powerActive = 'platform_delete'; fighter.powerTimer = 30;
      fighter._platformsToDelete = effect.deleteCount || 2;
      break;
    case 'gambit':
      fighter.powerActive = 'gambit'; fighter.powerTimer = 20;
      { const _opps = fighter._allOpponents || (opponent ? [opponent] : []);
        _opps.forEach(opp => { if (!opp || opp.stocks <= 0) return;
          if (Math.random() < 0.3) {
            const damages = [10, 30, 50, 100, 200];
            const dmg = damages[Math.floor(Math.random() * damages.length)];
            opp.damage += dmg; opp.hitstun = 25; opp.state = 'hitstun';
            opp.vy = -12 * KNOCKBACK_SCALE; opp.grounded = false;
          } }); }
      break;
    case 'copy_move':
      fighter.powerActive = 'copy_move'; fighter.powerTimer = effect.duration * 60;
      if (opponent && opponent.attackData) {
        fighter.attackData = { ...opponent.attackData, hitApplied: false, progress: 0 };
        fighter.state = 'attacking'; fighter.attackTimer = opponent.attackData.duration || 18;
      }
      break;

    // ── Death: add flat damage to opponent's current total ──
    case 'add_damage': {
      fighter.powerActive = 'add_damage'; fighter.powerTimer = 20;
      const targets = fighter._allOpponents || (opponent ? [opponent] : []);
      targets.forEach(opp => {
        if (opp && opp.stocks > 0) opp.damage += (effect.damage || 10);
      });
      break;
    }
    // ── Magneto: pull ALL opponents toward him with strong force ──
    case 'pull_all': {
      fighter.powerActive = 'pull_all'; fighter.powerTimer = 20;
      const force = effect.pullForce || 22;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const dx = fighter.x - opp.x;
        opp.vx = Math.sign(dx) * force * KNOCKBACK_SCALE; opp.state = 'hitstun'; opp.hitstun = effect.stunDuration || 14; opp.grounded = false;
      });
      break;
    }
    // ── Corpent: throw hammer forward, it comes back to him ──
    case 'hammer_throw': {
      fighter.powerActive = 'hammer_throw'; fighter.powerTimer = 90;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({
        type: 'hammer', x: fighter.x + fighter.facing * 30, y: fighter.y - 40,
        vx: fighter.facing * 14, vy: -3, ownerId: fighter.playerIndex,
        damage: (effect.damage || 22) * (fighter.statPowerMul || 1),
        knockback: effect.knockback || 1.4, color: '#8B7355', life: 120,
        facing: fighter.facing, phase: 'out', hitIds: {}, spin: 0,
        originX: fighter.x, originY: fighter.y - 40,
      });
      break;
    }
    // ── Whami: throw a conical potion flask at the opponent ──
    case 'potion_throw': {
      fighter.powerActive = 'potion_throw'; fighter.powerTimer = 60;
      fighter.projectiles = fighter.projectiles || [];
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      const tgt = opps.length > 0 ? opps[Math.floor(Math.random() * opps.length)] : opponent;
      const tx = tgt ? tgt.x : fighter.x + fighter.facing * 600;
      const ty = tgt ? tgt.y - 30 : fighter.y - 100;
      const dx = tx - fighter.x, dy = ty - (fighter.y - 40);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 11;
      fighter.projectiles.push({
        type: 'potion', x: fighter.x + fighter.facing * 24, y: fighter.y - 40,
        vx: (dx / dist) * speed, vy: (dy / dist) * speed - 2,
        damage: (effect.damage || 20) * (fighter.statPowerMul || 1),
        color: '#88FF44', life: 150, hitApplied: false, gravity: 0.18,
        target: tgt, brew: Math.random() < 0.5 ? 'poison' : 'slow',
      });
      break;
    }
    // ── Lavender: dream platform beneath her ──
    case 'spawn_platform': {
      fighter.powerActive = 'spawn_platform'; fighter.powerTimer = effect.duration * 60;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({
        type: 'spawn_platform', x: fighter.x, y: fighter.y + 14, w: 180, h: 16,
        color: effect.color || fighter.char.color, life: effect.duration * 60,
        owner: fighter, hitApplied: false,
      });
      break;
    }
    // ── Grey: iron walls on both sides ──
    case 'spawn_walls': {
      fighter.powerActive = 'spawn_walls'; fighter.powerTimer = effect.duration * 60;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({ type: 'iron_wall', x: fighter.x - 120, y: fighter.y - 40, w: 18, h: 120, side: -1, color: '#888888', life: effect.duration * 60, hitIds: {} });
      fighter.projectiles.push({ type: 'iron_wall', x: fighter.x + 120, y: fighter.y - 40, w: 18, h: 120, side: 1, color: '#888888', life: effect.duration * 60, hitIds: {} });
      break;
    }
    // ── Turquoise: transform — copy nearest opponent's stat multipliers ──
    case 'transform': {
      fighter.powerActive = 'transform'; fighter.powerTimer = Math.min(effect.duration, 10) * 60;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      const tgt = opps.find(o => o && o.stocks > 0) || opponent;
      if (tgt) {
        fighter._mimicTarget = tgt;
        fighter._origStatSpeedMul = fighter.statSpeedMul;
        fighter._origStatPowerMul = fighter.statPowerMul;
        fighter._origStatDefenseReduction = fighter.statDefenseReduction;
        fighter.statSpeedMul = tgt.statSpeedMul || fighter.statSpeedMul;
        fighter.statPowerMul = tgt.statPowerMul || fighter.statPowerMul;
        fighter.statDefenseReduction = Math.max(fighter.statDefenseReduction, tgt.statDefenseReduction || 0);
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'mimic_aura', target: fighter, mimic: tgt, color: tgt.char.color, life: Math.min(effect.duration, 10) * 60, hitApplied: false });
      }
      break;
    }
    // ── Magenta: glue trap — gunk the opponent to a near-halt ──
    case 'glue_trap': {
      fighter.powerActive = 'glue_trap'; fighter.powerTimer = 20;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const dur = Math.min(effect.duration, 5) * 60;
        opp.slowTimer = dur; opp.speedMul = 0.05;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'glue', target: opp, color: '#AA66CC', life: dur, hitApplied: false });
      });
      break;
    }
    // ── Willow: vine snare — root the opponent in place ──
    case 'vine_snare': {
      fighter.powerActive = 'vine_snare'; fighter.powerTimer = 20;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        opp.trapped = true; opp.hitstun = Math.min(effect.duration, 5) * 60; opp.state = 'hitstun'; opp.vx = 0; opp.vy = 0;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'vines', target: opp, color: '#448833', life: Math.min(effect.duration, 5) * 60, hitApplied: false });
      });
      break;
    }
    // ── Temple: stage slice — a sweeping blade across the stage ──
    case 'stage_slice': {
      fighter.powerActive = 'stage_slice'; fighter.powerTimer = 40;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({
        type: 'stage_slice', x: fighter.x, y: fighter.y - 30,
        vx: fighter.facing * 16, color: '#DDBB88', life: 60, hitApplied: false, hitIds: {},
        damage: (effect.damage || 22) * (fighter.statPowerMul || 1), facing: fighter.facing, sweep: 0,
      });
      break;
    }
    // ── Nightmare: shadow drain — latch a shadow that drains + slows ──
    case 'shadow_drain': {
      fighter.powerActive = 'shadow_drain'; fighter.powerTimer = effect.duration * 60;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        opp.slowTimer = effect.duration * 60; opp.speedMul = 0.5;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'shadow_drain', target: opp, color: '#553377', life: effect.duration * 60, tick: 0, dotDamage: effect.dotDamage || 3, hitApplied: false });
      });
      break;
    }
    // ── Controller: marionette — strings that stun + reverse opponent ──
    case 'marionette': {
      fighter.powerActive = 'marionette'; fighter.powerTimer = Math.min(effect.duration, 5) * 60;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const dur = Math.min(effect.duration, 5) * 60;
        opp.hitstun = dur; opp.state = 'hitstun'; opp.reverseControls = dur;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'marionette', target: opp, color: '#1A1A6A', life: dur, hitApplied: false });
      });
      break;
    }
    // ── Blue: bubble trap — encase opponent in a slowing bubble (no rise) ──
    case 'bubble_trap': {
      fighter.powerActive = 'bubble_trap'; fighter.powerTimer = 20;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const dur = Math.min(effect.duration, 5) * 60;
        opp.slowTimer = dur; opp.speedMul = 0.25;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'bubble', target: opp, color: effect.color || '#3399FF', life: dur, hitApplied: false, ringOnly: effect.ringOnly });
      });
      break;
    }
    // ── Snodvor: deep freeze — freeze opponent solid ──
    case 'deep_freeze': {
      fighter.powerActive = 'deep_freeze'; fighter.powerTimer = 20;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const dur = Math.min(effect.duration, 5) * 60;
        opp.hitstun = dur; opp.state = 'hitstun'; opp.vx = 0; opp.vy = 0; opp.slowTimer = dur; opp.speedMul = 0;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'ice_block', target: opp, color: '#AAEEFF', life: dur, hitApplied: false });
      });
      break;
    }
    // ── Hazel: poison cloud — bubbling toxic cloud on opponent ──
    case 'poison_cloud': {
      fighter.powerActive = 'poison_cloud'; fighter.powerTimer = effect.duration * 60;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        fighter.projectiles = fighter.projectiles || [];
        fighter.projectiles.push({ type: 'poison_cloud', target: opp, color: '#66CC44', life: effect.duration * 60, tick: 0, dotDamage: effect.dotDamage || 4, hitApplied: false });
      });
      break;
    }
    // ── Pearl: sonar pulse — expanding ring that stuns opponents it hits ──
    case 'sonar_pulse': {
      fighter.powerActive = 'sonar_pulse'; fighter.powerTimer = 40;
      fighter.projectiles = fighter.projectiles || [];
      fighter.projectiles.push({ type: 'sonar_pulse', x: fighter.x, y: fighter.y - 30, r: 0, maxR: 320, color: '#EEEEDD', life: 50, hitApplied: false, hitIds: {} });
      break;
    }
    // ── Utsuro: Elementor Call — spawn 3–7 random-colored hollow runners ──
    case 'elementor_call': {
      fighter.powerActive = 'elementor_call'; fighter.powerTimer = 60;
      fighter.projectiles = fighter.projectiles || [];
      const count = 3 + Math.floor(Math.random() * 5); // 3–7 runners
      const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF', '#FF8844', '#8844FF', '#FF4488', '#44FF88', '#FFAA00', '#AA00FF'];
      for (let i = 0; i < count; i++) {
        fighter.projectiles.push({
          type: 'elementor_runner',
          x: fighter.x + (Math.random() - 0.5) * 30,
          y: fighter.y,
          baseY: fighter.y,
          vx: fighter.facing * (4 + Math.random() * 3),
          vy: -3 - Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          damage: (effect.damage || 15) * (fighter.statPowerMul || 1),
          life: 180, facing: fighter.facing, hitIds: {}, runFrame: Math.random() * 6,
        });
      }
      break;
    }
    // ── Yui: Steal Power — steals one opponent's power and uses it in their color ──
    case 'steal_power': {
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      const alive = opps.filter(o => o && o.stocks > 0);
      if (alive.length === 0) break;
      const target = alive[Math.floor(Math.random() * alive.length)];
      const stolenEffect = getPowerEffect(target.char.id, target.char);
      if (!stolenEffect || stolenEffect.type === 'steal_power') break;

      // Store stolen power info so the aura renders in the original holder's color
      fighter._stolenPowerColor = target.char.color || '#FFFFFF';
      fighter._stolenPowerCharId = target.char.id;
      fighter._stolenPowerName = stolenEffect.name || target.char.power || 'Stolen Power';

      // Temporarily swap char so the stolen effect applies with its own parameters/color
      const origChar = fighter.char;
      fighter.char = target.char;
      activatePower(fighter, target); // recursively apply the stolen power
      fighter.char = origChar;

      // Use steal_power's own cooldown (not the stolen power's)
      fighter.powerCooldown = effect.cooldown * 60;
      fighter._maxPowerCooldown = fighter.powerCooldown;
      break;
    }
  }

  // Restore the full opponent list if we restricted it for a single-random power
  if (_savedAllOpps) fighter._allOpponents = _savedAllOpps;
}

export function activateFighterPower(fighter, opponent) { activatePower(fighter, opponent); }

export function updateProjectiles(fighter, opponent) {
  if (fighter.genProjectiles && fighter.genProjectiles.length > 0) {
    updateGenProjectiles(fighter, opponent);
  }
  if (!fighter.projectiles || fighter.projectiles.length === 0) return;
  fighter.projectiles = fighter.projectiles.filter(p => {
    p.life--;
    if (p.life <= 0) return false;

    if (p.type === 'fireball' || p.type === 'electric' || p.type === 'energy_ball' || p.type === 'energy') {
      if (p.target) {
        const dx = p.target.x - p.x;
        const dy = (p.target.y - 30) - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) { p.vx += (dx / dist) * 0.5; p.vy += (dy / dist) * 0.5; }
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSp = p.speed || 5;
        if (sp > maxSp) { p.vx = (p.vx / sp) * maxSp; p.vy = (p.vy / sp) * maxSp; }
      }
      p.x += p.vx; p.y += p.vy;
      if (!p.hitApplied && p.target && Math.abs(p.x - p.target.x) < 40 && Math.abs(p.y - (p.target.y - 20)) < 50) {
        if (p.willMiss) { p.willMiss = false; p.vy = -10; p.vx = Math.sign(p.vx || 1) * 8; return true; }
        p.hitApplied = true;
        if (p.target.invincible <= 0) {
          if (p.damage > 0) p.target.damage += p.damage;
          p.target.hitstun = 25; p.target.state = 'hitstun';
          const kb = p.knockback || 1;
          p.target.vx = Math.sign(p.vx || 1) * (10 + kb * 6) * KNOCKBACK_SCALE; p.target.vy = (-8 - kb * 2) * KNOCKBACK_SCALE; p.target.grounded = false;
        }
        return false;
      }
      return true;
    }

    if (p.type === 'stone_drop') {
      p.vy += 0.8; p.y += p.vy;
      if (!p.hitApplied && p.y >= p.targetY - 20) {
        p.hitApplied = true;
        const opps = p._onlyTarget ? [p._onlyTarget] : (fighter._allOpponents || (opponent ? [opponent] : []));
        opps.forEach(opp => {
          if (opp && opp.stocks > 0 && Math.abs(opp.x - p.x) < 60) {
            opp.damage += p.damage; opp.hitstun = 25; opp.state = 'hitstun';
            opp.vy = -15 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        });
        return false;
      }
      return true;
    }
    if (p.type === 'demon') {
      // Swooping demon — arcs through the air toward the target
      p.vy += p.gravity; p.x += p.vx; p.y += p.vy; p.wing += 0.4;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      for (const opp of opps) {
        if (!opp || opp.stocks <= 0) continue;
        if (Math.abs(opp.x - p.x) < 55 && Math.abs(opp.y - p.y) < 70 && (opp.invincible || 0) <= 0) {
          opp.damage += p.damage; opp.hitstun = 28; opp.state = 'hitstun';
          opp.vx = Math.sign(p.vx) * 12 * KNOCKBACK_SCALE; opp.vy = -10 * KNOCKBACK_SCALE; opp.grounded = false;
          p.hitApplied = true; return false;
        }
      }
      return p.life > 0 && p.x > -400 && p.x < 1900 && p.y < 1400;
    }
    if (p.type === 'hammer') {
      p.spin += 0.5;
      if (p.phase === 'out') {
        p.x += p.vx; p.vy += 0.3; p.y += p.vy;
        const opps = fighter._allOpponents || (opponent ? [opponent] : []);
        for (const opp of opps) {
          if (!opp || opp.stocks <= 0) continue;
          const key = opp.playerIndex != null ? 'p' + opp.playerIndex : opp;
          if (p.hitIds[key]) continue;
          if (Math.abs(opp.x - p.x) < 45 && Math.abs((opp.y - 30) - p.y) < 55 && (opp.invincible || 0) <= 0) {
            p.hitIds[key] = true;
            opp.damage += p.damage; opp.hitstun = 22; opp.state = 'hitstun';
            opp.vx = p.facing * p.knockback * 8 * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        }
        if (Math.abs(p.x - p.originX) > 420 || p.life < 70) p.phase = 'return';
      } else {
        // Return to fighter's hand
        const dx = fighter.x - p.x, dy = (fighter.y - 40) - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        p.x += (dx / d) * 15; p.y += (dy / d) * 15;
        if (d < 40) return false;
      }
      return p.life > 0;
    }
    if (p.type === 'potion') {
      p.vy += p.gravity; p.x += p.vx; p.y += p.vy;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      for (const opp of opps) {
        if (!opp || opp.stocks <= 0) continue;
        if (Math.abs(opp.x - p.x) < 40 && Math.abs((opp.y - 30) - p.y) < 55 && !p.hitApplied && (opp.invincible || 0) <= 0) {
          p.hitApplied = true;
          opp.damage += p.damage; opp.hitstun = 18; opp.state = 'hitstun';
          opp.vx = Math.sign(p.vx) * 8 * KNOCKBACK_SCALE; opp.vy = -6 * KNOCKBACK_SCALE; opp.grounded = false;
          if (p.brew === 'poison') { opp.slowTimer = 180; opp.speedMul = 0.4; }
          else { opp.slowTimer = 180; opp.speedMul = 0.3; }
          return false;
        }
      }
      if (p.y > 720 || p.x < -50 || p.x > 1900) return false;
      return p.life > 0;
    }
    if (p.type === 'whip') {
      p.reach = Math.min(p.maxReach, p.reach + 28);
      const tipX = p.x + p.facing * p.reach;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      for (const opp of opps) {
        if (!opp || opp.stocks <= 0) continue;
        const key = opp.playerIndex != null ? 'p' + opp.playerIndex : opp;
        if (p.hitIds[key]) continue;
        const inReach = p.facing > 0 ? (opp.x > p.x && opp.x < tipX + 30) : (opp.x < p.x && opp.x > tipX - 30);
        if (inReach && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = p.stunDuration; opp.state = 'hitstun';
          opp.vx = p.facing * 6 * KNOCKBACK_SCALE; opp.grounded = false;
          // Electric bolts erupt from the stunned victim
          p.bolts.push({ x: opp.x, y: opp.y - 30, life: 30 });
        }
      }
      p.bolts = (p.bolts || []).filter(b => { b.life--; return b.life > 0; });
      return p.life > 0;
    }
    if (p.type === 'lightning_bolt') {
      p.warning--;
      if (p.warning <= 0 && !p.hitApplied) {
        p.hitApplied = true;
        const opps = fighter._allOpponents || (opponent ? [opponent] : []);
        opps.forEach(opp => {
          if (opp && opp.stocks > 0 && Math.abs(opp.x - p.targetX) < 55 && opp.invincible <= 0) {
            opp.damage += p.damage; opp.hitstun = 25; opp.state = 'hitstun';
            opp.vy = -12 * KNOCKBACK_SCALE; opp.grounded = false;
          }
        });
      }
      return p.life > 0;
    }
    if (p.type === 'beam') {
      p.x += p.vx;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const key = opp._id != null ? opp._id : (opp.playerIndex != null ? 'p' + opp.playerIndex : opp);
        if (p.hitIds[key]) return;
        const dx = opp.x - p.x;
        const inFront = p.facing > 0 ? (dx > -30 && dx < 70) : (dx < 30 && dx > -70);
        const inHeight = Math.abs((opp.y - 30) - p.y) < 55;
        if (inFront && inHeight && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          if (fighter.gameMode === 'hp' || (fighter.gameMode === 'brawl' && !fighter._isBR)) opp.hp = Math.max(0, (opp.hp ?? 150) - p.damage);
          else opp.damage += p.damage;
          opp.hitstun = 25; opp.state = 'hitstun';
          opp.vx = p.facing * p.knockback * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      });
      return p.life > 0 && p.x > -300 && p.x < 1900;
    }
    // ── Status-visual projectiles that follow their target ──
    if (p.type === 'glue' || p.type === 'vines' || p.type === 'ice_block' || p.type === 'bubble' || p.type === 'marionette' || p.type === 'shadow_drain' || p.type === 'poison_cloud' || p.type === 'mimic_aura') {
      // Control-effect projectiles expire immediately when the victim is hit by any attack
      if ((p.type === 'glue' || p.type === 'vines' || p.type === 'ice_block' || p.type === 'bubble' || p.type === 'marionette') && p.target && p.target._controlBroken) {
        p.target._controlBroken = false;
        return false;
      }
      if ((p.type === 'shadow_drain' || p.type === 'poison_cloud')) {
        p.tick = (p.tick || 0) + 1;
        if (p.tick % 30 === 0 && p.target && p.target.stocks > 0) p.target.damage += p.dotDamage || 3;
      }
      if (p.type === 'bubble' && p.target && p.target.stocks > 0) {
        p.target.speedMul = 0.25; p.target.slowTimer = Math.max(p.target.slowTimer || 0, p.life);
      }
      if (p.type === 'vines' && p.target && p.target.stocks > 0) {
        p.target.vx = 0; p.target.trapped = true;
      }
      if (p.type === 'mimic_aura' && p.target && p.mimic) {
        // re-copy stat multipliers each frame in case opponent's change
        p.target.statSpeedMul = p.mimic.statSpeedMul || p.target.statSpeedMul;
        p.target.statPowerMul = p.mimic.statPowerMul || p.target.statPowerMul;
      }
      return p.life > 0 && p.target && p.target.stocks > 0;
    }
    // ── Lavender: dream platform — fighters can land on it ──
    if (p.type === 'spawn_platform') {
      const allF = [p.owner, ...((p.owner && p.owner._allOpponents) || [])].filter(Boolean);
      allF.forEach(f => {
        if (!f || f.stocks <= 0) return;
        if (f.vy >= 0 && f.x > p.x - p.w / 2 - 10 && f.x < p.x + p.w / 2 + 10 && f.y >= p.y - 6 && (f.prevY || f.y) <= p.y + 4) {
          f.y = p.y; f.vy = 0; f.grounded = true; f.jumps = f.maxJumps; f.recoveryAirUses = 0;
        }
      });
      return p.life > 0;
    }
    // ── Grey: iron walls — push opponents back ──
    if (p.type === 'iron_wall') {
      const opps = fighter._allOpponents || [];
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        if (Math.abs(opp.x - (p.x + p.w / 2)) < p.w / 2 + 18 && Math.abs(opp.y - p.y) < p.h) {
          opp.x += p.side * 3;
          if (p.side > 0 && opp.vx < 0) opp.vx = 0;
          if (p.side < 0 && opp.vx > 0) opp.vx = 0;
        }
      });
      return p.life > 0;
    }
    // ── Temple: stage slice — sweeping blade ──
    if (p.type === 'stage_slice') {
      p.x += p.vx; p.sweep += 1;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const key = opp.playerIndex != null ? 'p' + opp.playerIndex : opp;
        if (p.hitIds[key]) return;
        if (Math.abs(opp.x - p.x) < 60 && Math.abs((opp.y - 30) - p.y) < 70 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = 22; opp.state = 'hitstun';
          opp.vx = p.facing * 14 * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      });
      return p.life > 0 && p.x > -200 && p.x < 1900;
    }
    // ── Pearl: sonar pulse — expanding ring ──
    if (p.type === 'sonar_pulse') {
      p.r += 14;
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      opps.forEach(opp => {
        if (!opp || opp.stocks <= 0) return;
        const key = opp.playerIndex != null ? 'p' + opp.playerIndex : opp;
        if (p.hitIds[key]) return;
        const d = Math.abs(opp.x - p.x) + Math.abs((opp.y - 30) - p.y);
        if (d < p.r + 30 && d > p.r - 30 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.hitstun = 40; opp.state = 'hitstun'; opp.slowTimer = 120; opp.speedMul = 0.4;
        }
      });
      return p.life > 0 && p.r < p.maxR;
    }
    // ── Purple: persistent dash-line hitbox — damages opponents who touch the trail
    if (p.type === 'dash_line') {
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      for (const opp of opps) {
        if (!opp || opp.stocks <= 0) continue;
        const key = opp.playerIndex != null ? 'p' + opp.playerIndex : ('o' + opps.indexOf(opp));
        if (p.hitIds[key]) continue;
        const minX = Math.min(p.fromX, p.toX) - 30, maxX = Math.max(p.fromX, p.toX) + 30;
        if (opp.x >= minX && opp.x <= maxX && Math.abs((opp.y - 30) - p.y) < 50 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage; opp.hitstun = 20; opp.state = 'hitstun';
          opp.vx = p.facing * 14 * p.knockback * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false;
        }
      }
      return p.life > 0;
    }
    // ── Utsuro: Elementor Call — hollow runners that charge forward with gravity ──
    if (p.type === 'elementor_runner') {
      p.runFrame += 0.3;
      // Apply gravity so runners arc and fall realistically
      p.vy += 0.42;
      if (p.vy > 15) p.vy = 15;
      p.x += p.vx;
      p.y += p.vy;
      // Land on the ground level and keep running along it
      if (p.y >= p.baseY) { p.y = p.baseY; p.vy = 0; }
      const opps = fighter._allOpponents || (opponent ? [opponent] : []);
      for (const opp of opps) {
        if (!opp || opp.stocks <= 0) continue;
        const key = opp.playerIndex != null ? 'p' + opp.playerIndex : opp;
        if (p.hitIds[key]) continue;
        if (Math.abs(opp.x - p.x) < 35 && Math.abs((opp.y - 30) - p.y) < 55 && (opp.invincible || 0) <= 0) {
          p.hitIds[key] = true;
          opp.damage += p.damage || 15;
          opp.powerDisabled = 1800; // 30 seconds at 60fps
          opp.vx = p.facing * 12 * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false; opp.state = 'hitstun'; opp.hitstun = 20;
        }
      }
      return p.life > 0 && p.x > -200 && p.x < 1900;
    }
    return true;
  });
}

export { drawProjectiles } from './projectileRenderer.js';
// Re-export AI + power modules so existing imports from fighter.js still work
export { CPU_DIFFICULTY, updateAI, platformNavigate } from './botAI.js';

export function updateFighter(fighter, inputs, platforms, stageWidth, stageHeight, opponent) {
  fighter.frame++;
  fighter.prevX = fighter.x;
  fighter.prevY = fighter.y;
  fighter._platforms = platforms;

  // Reverse controls (Controller / Nightmare / Whami powers) — swap left/right and up/down
  if (fighter.reverseControls > 0) {
    const tmp = inputs.left; inputs.left = inputs.right; inputs.right = tmp;
    const tmp2 = inputs.up; inputs.up = inputs.down; inputs.down = tmp2;
  }

  if (fighter.invincible > 0) fighter.invincible--;
  if (fighter.landingLag > 0) fighter.landingLag--;
  if (fighter.sigCooldown > 0) fighter.sigCooldown--;
  if (fighter.normalCooldown > 0) fighter.normalCooldown--;
  if (fighter.heavyCooldown > 0) fighter.heavyCooldown--;
  if (fighter.recoveryCooldown > 0) fighter.recoveryCooldown--;
  if (fighter.groundPoundCooldown > 0) fighter.groundPoundCooldown--;
  // A power cannot recharge while its animation/effect is still running.
  // This is shared by every mode that uses updateFighter (offline, LAN,
  // battle royale, campaign, sandbox, and the rollback fight simulation).
  if (fighter.powerCooldown > 0 && !fighter.powerActive && fighter.powerTimer <= 0) fighter.powerCooldown--;
  if (fighter.slowTimer > 0) fighter.slowTimer--;
  if (fighter.noBlastKill > 0) fighter.noBlastKill--;
  if (fighter.reverseControls > 0) fighter.reverseControls--;
  if (fighter.powerDisabled > 0) fighter.powerDisabled--;
  // ── Passive healing + 500% KO: Battle Royale ONLY (not regular brawl) ──
  if (fighter._isBR) {
    if (fighter.damage > 0 && fighter.frame % 150 === 0) {
      fighter.damage = Math.max(0, fighter.damage - 1);
    }
    if (fighter.damage >= 500 && fighter.stocks > 0 && !fighter._pendingDeath) {
      fighter._pendingDeath = true;
    }
  }
  if (fighter._gravCeilingTimer > 0) {
    fighter._gravCeilingTimer--;
    // Slow upward float — gentle continuous lift while gravity flip is active
    if (fighter._gravFloat) {
      fighter.vy -= 0.5;
      if (fighter.vy < -2.5) fighter.vy = -2.5; // cap upward speed for a slow float
    }
    if (fighter.y < fighter._gravCeiling) {
      fighter.y = fighter._gravCeiling;
      fighter.vy = 0;
    }
    if (fighter._gravCeilingTimer <= 0) {
      fighter._gravCeiling = null;
      fighter._gravFloat = false;
    }
  }
  if (fighter.powerTimer > 0) {
    fighter.powerTimer--;
    if (fighter.powerTimer <= 0) {
      // Restore copied stats when Turquoise's transform ends
      if (fighter.powerActive === 'transform' && fighter._origStatSpeedMul !== undefined) {
        fighter.statSpeedMul = fighter._origStatSpeedMul;
        fighter.statPowerMul = fighter._origStatPowerMul;
        fighter.statDefenseReduction = fighter._origStatDefenseReduction;
        fighter._mimicTarget = null;
      }
      onGenPowerExpire(fighter);
      const wasInfiniteJumps = fighter.powerActive === 'infinite_jumps';
      fighter.powerActive = null;
      fighter._dash = null;
      fighter.speedBoost = 1; fighter.damageBoost = 1; fighter.rangeBoost = 1; fighter.shieldAmount = 0;
      fighter.knockbackMul = 1; fighter.knockbackReduction = 0; fighter._healPerTick = 0;
      fighter.speedMul = undefined; fighter.dodgeChance = undefined; fighter.reviveChance = 0;
      if (wasInfiniteJumps) { fighter.maxJumps = 2; fighter.jumps = Math.min(fighter.jumps, 2); }
      fighter.canFly = false;
      // Clear stolen power rendering flags when the stolen power expires
      fighter._stolenPowerColor = null;
      fighter._stolenPowerCharId = null;
      fighter._stolenPowerName = null;
    }
    if (fighter.powerActive === 'dot' && fighter.dotTargets && fighter.frame % 30 === 0) {
      (fighter.dotTargets || []).forEach(opp => { if (opp && opp.stocks > 0) opp.damage += fighter.dotDamage || 2; });
    }
    if (fighter.powerActive === 'heal' && fighter._healPerTick && fighter.frame % 30 === 0) {
      fighter.damage = Math.max(0, fighter.damage - fighter._healPerTick);
      if (fighter._healOpponents && fighter._allOpponents) {
        fighter._allOpponents.forEach(opp => { if (opp && opp.stocks > 0) opp.damage = Math.max(0, opp.damage - fighter._healPerTick * 0.6); });
      }
    }
  }
  // Update clone
  if (fighter._clone) { fighter._clone.life--; if (fighter._clone.life <= 0) fighter._clone = null; }
  // Update visual effect timers (portal, dash slash) — expire so animations go away
  if (fighter._portalEffect) { fighter._portalEffect.timer--; if (fighter._portalEffect.timer <= 0) fighter._portalEffect = null; }
  if (fighter._dashSlashEffect) { fighter._dashSlashEffect.timer--; if (fighter._dashSlashEffect.timer <= 0) fighter._dashSlashEffect = null; }

  // Update particles
  fighter.doubleJumpParticles = (fighter.doubleJumpParticles || []).filter(p => {
    p.life--;
    p.vy += 0.15;
    p.x += p.vx;
    p.y += p.vy;
    return p.life > 0;
  });

  if (fighter.grounded) {
    fighter.coyoteTime = 8;
  } else if (fighter.coyoteTime > 0) {
    fighter.coyoteTime--;
  }

  // Track DI from inputs
  fighter.diX = (inputs.left ? -1 : 0) + (inputs.right ? 1 : 0);
  fighter.diY = (inputs.down ? 0.5 : 0) + (inputs.up ? -0.3 : 0);

  // ── Hitstun: smooth knockback with DI influence ──
  if (fighter.hitstun > 0) {
    fighter.hitstun--;
    fighter.vx *= KNOCKBACK_DECAY;
    // Apply DI — slight steering during knockback (Brawlhalla-style)
    fighter.vx += fighter.diX * 0.15;
    fighter.vy += fighter.diY * 0.12;
    const gravMul = fighter.lowGravity ? 0.45 : 1;
    const grav = (fighter.gravityInverted ? -GRAVITY : GRAVITY) * gravMul;
    fighter.vy += grav;
    if (Math.abs(fighter.vy) > MAX_FALL_SPEED) fighter.vy = Math.sign(fighter.vy) * MAX_FALL_SPEED;
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;
    resolveCollisions(fighter, platforms, stageWidth, stageHeight);
    if (fighter.attackData) updateAttackProgress(fighter);
    return fighter;
  }

  // Attack state — can't act but still apply physics
  if (fighter.state === 'attacking' || fighter.state === 'superAttack') {
    fighter.attackTimer--;
    // Reduced friction during attacks so you slide a bit (Brawlhalla momentum)
    fighter.vx *= fighter.grounded ? 0.88 : 0.96;
    if (fighter.attackTimer <= 0) {
      fighter.state = fighter.grounded ? 'idle' : 'jumping';
      fighter.attackData = null;
    }
  }

  const canAct = fighter.landingLag <= 0 &&
    fighter.state !== 'attacking' &&
    fighter.state !== 'superAttack' &&
    !fighter.trapped;

  if (canAct) {
    const slowFactor = fighter.slowTimer > 0 ? (fighter.speedMul || 0.4) : 1;
    const speed = (fighter.grounded ? MOVE_SPEED : AIR_SPEED) * (fighter.statSpeedMul || 1) * (fighter.statUtilityMul || 1) * (fighter.speedBoost || 1) * slowFactor;
    const accel = (fighter.grounded ? ACCEL_GROUND : ACCEL_AIR) * (fighter.statSpeedMul || 1);

    // Indigo's Gravity power: tap down to launch self upward (auto-stops before KO)
    if (fighter.powerActive === 'gravity_flip') {
      if (inputs.down && !fighter._gravDownHeld) {
        fighter._gravDownHeld = true;
        fighter.vy = -6;
        fighter.grounded = false;
        fighter._gravCeiling = -450;
        fighter._gravCeilingTimer = fighter.powerTimer;
        fighter._gravFloat = true;
        fighter.noBlastKill = Math.max(fighter.noBlastKill, fighter.powerTimer + 30);
      }
      if (!inputs.down) fighter._gravDownHeld = false;
    }

    // ── Smoother movement — proper acceleration model ──
    if (inputs.left) {
      fighter.vx = Math.max(fighter.vx - accel, -speed);
      fighter.facing = -1;
      if (fighter.grounded) fighter.state = 'moving';
    } else if (inputs.right) {
      fighter.vx = Math.min(fighter.vx + accel, speed);
      fighter.facing = 1;
      if (fighter.grounded) fighter.state = 'moving';
    } else {
      // Smooth friction — ice platforms are much slicker
      let friction = fighter.grounded ? GROUND_FRICTION : AIR_FRICTION;
      if (fighter.grounded && fighter.platformMaterial === 'ice') friction = 0.995;
      fighter.vx *= friction;
      if (Math.abs(fighter.vx) < 0.15 && fighter.platformMaterial !== 'ice') fighter.vx = 0;
      if (fighter.grounded && fighter.state === 'moving') fighter.state = 'idle';
    }

    // Material contact effects
    if (fighter.grounded) {
      if (fighter.platformMaterial === 'quicksand') {
        fighter.vx *= 0.4;
        fighter.vy += 0.5;
      } else if (fighter.platformMaterial === 'conveyor') {
        fighter.vx += (fighter._conveyorDir || 1) * 1.2;
      } else if (fighter.platformMaterial === 'sand') {
        fighter.vx *= 0.55;
      } else if (fighter.platformMaterial === 'acid') {
        fighter.damage += 0.5;
        fighter.powerDisabled = 180;
      }
    }

    // Fast fall
    if (inputs.down && !fighter.grounded && !fighter.gravityInverted) {
      fighter.vy = Math.min(fighter.vy + 2.5, MAX_FALL_SPEED);
    }

    // Flying (White)
    if (fighter.canFly) {
      if (inputs.jump && !fighter.jumpHeld) {
        fighter.vy = JUMP_FORCE * 0.7;
        fighter.jumpHeld = true;
        fighter.isFlying = true;
      }
    }

    // ── Jump with variable height (Brawlhalla-style) — edge-detected via fighter.jumpHeld ──
    if (inputs.jump && !fighter.jumpHeld) {
      fighter.jumpHeld = true;
      fighter.jumpCutApplied = false;
      const useGroundJump = fighter.coyoteTime > 0 && fighter.jumps >= fighter.maxJumps;
      const useAirJump = !fighter.grounded && fighter.jumps > 0 && fighter.coyoteTime <= 0;

      if (useGroundJump || useAirJump) {
        const qsMul = (fighter.platformMaterial === 'quicksand' || fighter.platformMaterial === 'snow') ? 0.3 : 1;
        const force = (useGroundJump ? JUMP_FORCE : DOUBLE_JUMP_FORCE) * qsMul * (fighter.statUtilityMul || 1);
        fighter.vy = fighter.gravityInverted ? -force : force;
        if (useGroundJump) {
          fighter.jumps = fighter.maxJumps - 1;
          fighter.coyoteTime = 0;
          for (let i = 0; i < 8; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
            fighter.doubleJumpParticles.push({
              x: fighter.x + (Math.random() - 0.5) * 20,
              y: fighter.y,
              vx: Math.cos(angle) * (Math.random() * 2.2 + 0.3),
              vy: Math.sin(angle) * (Math.random() * 1.2 + 0.2) + 0.5,
              life: 12 + Math.floor(Math.random() * 8),
              maxLife: 20,
              color: '#FFFFFF',
              isGroundPuff: true,
            });
          }
        } else {
          fighter.jumps--;
          for (let i = 0; i < 14; i++) {
            const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
            fighter.doubleJumpParticles.push({
              x: fighter.x + (Math.random() - 0.5) * 14,
              y: fighter.y,
              vx: Math.cos(angle) * (Math.random() * 2.5 + 0.5),
              vy: Math.sin(angle) * (Math.random() * 1.5 + 0.5),
              life: 18 + Math.floor(Math.random() * 10),
              maxLife: 28,
              color: fighter.char.color,
              isGroundPuff: false,
            });
          }
        }
        fighter.grounded = false;
        fighter.state = 'jumping';
      }
    }
    // Variable jump height — cut velocity when jump released (short hop)
    // fullJump flag (online mode): tapping jump always does a full jump — no short hop
    if (!fighter.fullJump && fighter.jumpHeld && !inputs.jump && !fighter.jumpCutApplied && fighter.vy < 0) {
      fighter.vy *= 0.55;
      fighter.jumpCutApplied = true;
    }
    if (!inputs.jump) fighter.jumpHeld = false;

    // ── Heavy Attack ──
    // Air + down + heavy = Ground Pound (slam down with AoE)
    if (inputs.heavy && inputs.down && !fighter.grounded && !inputs._heavyConsumed && fighter.heavyCooldown <= 0 && fighter.groundPoundCooldown <= 0) {
      inputs._heavyConsumed = true;
      fighter.state = 'attacking';
      fighter.attackTimer = 20;
      fighter.attackData = { name: 'Ground Pound', type: 'groundPound', duration: 20, damage: 18, range: 130, color: fighter.char.color, sigType: 'down', hitApplied: false, progress: 0, isHeavy: true, isGroundPound: true };
      fighter.heavyCooldown = Math.max(60, HEAVY_COOLDOWN * (fighter.statControlRecoveryMul || 1));
      fighter.groundPoundCooldown = 45 * (fighter.statControlRecoveryMul || 1);
      fighter.vy = 18;
      fighter.moveStats.groundPound++;
    }
    // Ground + down + heavy = Down Heavy (unique per character, different from side heavy)
    else if (inputs.heavy && inputs.down && fighter.grounded && !inputs._heavyConsumed && fighter.heavyCooldown <= 0) {
      inputs._heavyConsumed = true;
      const downHeavy = DOWN_HEAVIES[fighter.char.id];
      if (downHeavy) {
        fighter.state = 'attacking';
        const dur = Math.min(downHeavy.duration, 28);
        fighter.attackTimer = dur;
        fighter.attackData = { ...downHeavy, duration: dur, sigType: 'downHeavy', hitApplied: false, progress: 0, isHeavy: true };
        fighter.heavyCooldown = Math.max(60, HEAVY_COOLDOWN * (fighter.statControlRecoveryMul || 1));
        fighter.vy = 0;
        fighter.moveStats.downHeavy++;
      }
    }
    // No down + heavy = Side Heavy (existing heavyAttack)
    else if (inputs.heavy && !inputs._heavyConsumed && fighter.heavyCooldown <= 0) {
      inputs._heavyConsumed = true;
      const heavy = fighter.char.heavyAttack;
      if (heavy) {
        fighter.state = 'attacking';
        const dur = Math.min(heavy.duration, 30);
        fighter.attackTimer = dur;
        fighter.attackData = { ...heavy, duration: dur, sigType: 'heavy', hitApplied: false, progress: 0, isHeavy: true };
        fighter.heavyCooldown = Math.max(60, HEAVY_COOLDOWN * (fighter.statControlRecoveryMul || 1));
        if (fighter.grounded) fighter.vy = 0;
        if (heavy.hasArmor) fighter.invincible = Math.max(fighter.invincible, 8);
        fighter.moveStats.heavy++;
      }
    }
    if (!inputs.heavy) inputs._heavyConsumed = false;

    // ── Signature / Recovery ──
    if (inputs.sig && !inputs._sigConsumed) {
      inputs._sigConsumed = true;

      // Recovery attack: sig + up in air = launch up with damage + knockback (air-only, cooldown-gated AND limited to once per airtime so it can't be spammed to fly infinitely)
      if (!fighter.grounded && inputs.up && fighter.recoveryCooldown <= 0 && fighter.recoveryAirUses < 1) {
        fighter.state = 'attacking';
        fighter.attackTimer = 16;
        fighter.attackData = { name: 'Recovery', type: 'recovery', duration: 16, damage: 12, range: 110, color: fighter.char.color, sigType: 'up', hitApplied: false, progress: 0, isRecovery: true };
        fighter.vy = -14;
        fighter.hitstun = 0;
        fighter.recoveryCooldown = 40 * (fighter.statControlRecoveryMul || 1);
        fighter.recoveryAirUses++;
        fighter.moveStats.recovery++;
      }
      // Aerial attack: sig in air without up
      else if (!fighter.grounded) {
        if (fighter.normalCooldown <= 0) {
          fighter.state = 'attacking';
          fighter.attackTimer = 18;
          fighter.attackData = {
            name: 'Aerial', type: 'aerialNormal',
            duration: 18, damage: 7 + Math.random() * 4,
            range: 55, color: fighter.char.color,
            sigType: 'aerial', hitApplied: false, progress: 0, isNormal: true,
          };
          fighter.normalCooldown = NORMAL_COOLDOWN * (fighter.statControlRecoveryMul || 1);
          fighter.moveStats.aerial++;
        }
      } else if (fighter.sigCooldown <= 0) {
        let sigType = 'up';
        if (inputs.left || inputs.right) sigType = 'side';
        else if (inputs.down) sigType = 'down';

        const sig = fighter.char.signatures?.[sigType];
        if (sig) {
          fighter.state = 'attacking';
          const dur = Math.min(sig.duration, 28);
          fighter.attackTimer = dur;
          fighter.attackData = { ...sig, duration: dur, sigType, hitApplied: false, progress: 0 };
          fighter.sigCooldown = SIG_COOLDOWN * (fighter.statControlRecoveryMul || 1);
          fighter.vy = 0;
          if (sigType === 'side') fighter.moveStats.sigSide++;
          else if (sigType === 'up') fighter.moveStats.sigUp++;
          else if (sigType === 'down') fighter.moveStats.sigDown++;
        }
      }
    }
    if (!inputs.sig) inputs._sigConsumed = false;

    // ── Power Activation (replaces light attack) ──
    if (inputs.power && !inputs._powerConsumed && !fighter.powerActive && fighter.powerTimer <= 0 && fighter.powerCooldown <= 0 && fighter.powerDisabled <= 0) {
      inputs._powerConsumed = true;
      fighter.moveStats.power++;
      activatePower(fighter, opponent);
    }
    if (!inputs.power) inputs._powerConsumed = false;

    // ── Super ──
    if (inputs.superMove && !inputs._superConsumed && fighter.superMeter >= fighter.maxSuper) {
      inputs._superConsumed = true;
      fighter.superMeter = 0;
      const sm = fighter.char.superMove;
      fighter.state = 'superAttack';
      const dur = Math.min(sm?.duration || 50, 55);
      fighter.attackTimer = dur;
      fighter.attackData = { ...(sm || {}), duration: dur, sigType: 'super', hitApplied: false, progress: 0, isSuper: true };
      fighter.moveStats.super++;
    }
    if (!inputs.superMove) inputs._superConsumed = false;
  }

  // Gravity
  if (!fighter.grounded || fighter.canFly) {
    const gravMul2 = fighter.lowGravity ? 0.45 : 1;
    const grav = (fighter.gravityInverted ? -GRAVITY : GRAVITY) * gravMul2;
    fighter.vy += grav;
    const maxFall = (fighter.gravityInverted ? -MAX_FALL_SPEED : MAX_FALL_SPEED) * (fighter.lowGravity ? 0.6 : 1);
    if (!fighter.gravityInverted && fighter.vy > maxFall) fighter.vy = maxFall;
    if (fighter.gravityInverted && fighter.vy < maxFall) fighter.vy = maxFall;
  }

  // Dash slash — drive horizontal velocity; collision stops the fighter at walls
  if (fighter.powerActive === 'dash_slash' && fighter._dash) {
    fighter.vx = fighter._dash.dir * 52;
    fighter.facing = fighter._dash.dir;
  }

  fighter.x += fighter.vx;
  fighter.y += fighter.vy;

  resolveCollisions(fighter, platforms, stageWidth, stageHeight);

  // Dash slash — damage opponents in the path, end when distance covered or blocked
  if (fighter.powerActive === 'dash_slash' && fighter._dash) {
    const d = fighter._dash;
    d.traveled += Math.abs(fighter.vx);
    const opps = fighter._allOpponents || (opponent ? [opponent] : []);
    for (const opp of opps) {
      if (!opp || opp.stocks <= 0 || (opp.invincible || 0) > 0) continue;
      const key = opp.playerIndex != null ? 'p' + opp.playerIndex : ('o' + opps.indexOf(opp));
      if (d.hitIds[key]) continue;
      if (Math.abs(opp.x - fighter.x) < 50 && Math.abs(opp.y - fighter.y) < 80) {
        d.hitIds[key] = true;
        opp.damage += d.damage; opp.hitstun = 20; opp.state = 'hitstun';
        opp.vx = d.dir * 14 * d.knockback * KNOCKBACK_SCALE; opp.vy = -8 * KNOCKBACK_SCALE; opp.grounded = false;
      }
    }
    if (d.traveled >= d.distance || Math.abs(fighter.vx) < 1) {
      fighter._dash = null;
      fighter.powerActive = null;
      fighter.powerTimer = 0;
      fighter.vx *= 0.3;
    }
  }

  if (fighter.attackData) updateAttackProgress(fighter);

  // Pass-through material effects (water, lava, cloud, antigravity) — overlap detection
  let _inAntiGrav = false;
  for (const p of platforms) {
    const pmat = p.material || 'normal';
    if (pmat !== 'water' && pmat !== 'lava' && pmat !== 'cloud' && pmat !== 'acid' && pmat !== 'tar' && pmat !== 'antigravity') continue;
    const overlapX = fighter.x > p.x - 16 && fighter.x < p.x + p.w + 16;
    const inMat = fighter.y > p.y && fighter.y < p.y + p.h + 20;
    if (overlapX && inMat) {
      fighter.platformMaterial = pmat;
      if (pmat === 'antigravity') {
        // Reverse gravity while inside the field — gentle upward float
        _inAntiGrav = true;
        fighter._antiGravActive = true;
        fighter.gravityInverted = true;
        fighter.vy -= 0.5;
        if (fighter.vy < -4) fighter.vy = -4;
        fighter.vx *= 0.96;
        if (inputs.jump) fighter.vy = -7; // boost up
      } else if (pmat === 'water' || pmat === 'lava') {
        fighter.vy = Math.min(fighter.vy, 2.5); // slow fall
        fighter.vx *= 0.92;
        if (inputs.jump) fighter.vy = -5.5; // swim up
        if (pmat === 'lava') fighter.damage += 0.8; // lava damages
      } else if (pmat === 'acid') {
        fighter.vy = Math.min(fighter.vy, 2.5); // slow fall — can swim through
        fighter.vx *= 0.85;
        if (inputs.jump) fighter.vy = -4; // swim up
        fighter.damage += 0.5; // acid damages
        fighter.powerDisabled = 180;
      } else if (pmat === 'tar') {
        fighter.vy = Math.min(fighter.vy, 1.5); // very slow fall — thick
        fighter.vx *= 0.3; // very thick — hard to move
        if (inputs.jump) fighter.vy = -2.5; // very hard to swim up
        fighter.trapped = true; // still traps
      }
      // cloud: no effect, pass through
      break;
    }
  }
  // Leaving an anti-gravity field restores normal gravity (unless a power inverted it)
  if (!_inAntiGrav && fighter._antiGravActive) {
    fighter._antiGravActive = false;
    if (!fighter.powerActive || fighter.powerActive !== 'gravity_flip') fighter.gravityInverted = false;
  }
  // HP mode + regular brawl: lose a stock when HP is depleted (BR uses 300% damage, not HP)
  if ((fighter.gameMode === 'hp' || (fighter.gameMode === 'brawl' && !fighter._isBR)) && fighter.hp <= 0 && fighter.stocks > 0) {
    loseStock(fighter, stageWidth, stageHeight);
    fighter.hp = 150;
  }

  // 1500% damage = instant death (lose a stock) — checked here so ALL damage sources
  // are caught: attacks (applyHit), power abilities, projectiles, hazards, items,
  // and material effects (spikes, lava, acid, etc.). BR is excluded (own 500% threshold).
  if (fighter.damage >= 1500 && fighter.stocks > 0 && !fighter._isBR && !fighter._pendingDeath) {
    fighter._pendingDeath = true;
  }
  if (fighter._pendingDeath && fighter.stocks > 0 && !fighter._isBR) {
    fighter._pendingDeath = false;
    loseStock(fighter, stageWidth, stageHeight);
  }

  return fighter;
}

// ── Smooth swept AABB collision (Brawlhalla-style) ──
function resolveCollisions(fighter, platforms, stageWidth, stageHeight) {
  const prevGrounded = fighter.grounded;
  fighter.grounded = false;
  fighter.platformMaterial = null;
  fighter.trapped = false;
  fighter._conveyorDir = 0;

  const charHalfW = 16; // half-width for platform edge tolerance
  const prevBottom = fighter.prevY;
  const currBottom = fighter.y;

  const PASS_THROUGH = ['water', 'lava', 'cloud', 'acid', 'tar', 'antigravity'];

  // ── Collect active iron_wall projectiles as solid platforms so fighters
  //    can't walk through walls created by any fighter's spawn_walls power. ──
  const wallPlatforms = [];
  const collectWalls = (f) => {
    if (!f) return;
    if (f.projectiles) {
      for (const wp of f.projectiles) {
        if (wp.type === 'iron_wall' && wp.life > 0) {
          wallPlatforms.push({ x: wp.x, y: wp.y, w: wp.w, h: wp.h, material: 'normal' });
        }
      }
    }
    if (f.genProjectiles) {
      for (const wp of f.genProjectiles) {
        if ((wp.type === 'gen_solid_barrier' || wp.type === 'gen_glass_wall' || wp.type === 'gen_protect_wall') && wp.life > 0) {
          wallPlatforms.push({ x: wp.x, y: wp.y - wp.h, w: wp.w, h: wp.h, material: 'normal' });
        }
      }
    }
  };
  collectWalls(fighter);
  if (fighter._allOpponents) fighter._allOpponents.forEach(collectWalls);
  if (wallPlatforms.length > 0) platforms = [...platforms, ...wallPlatforms];

  for (const p of platforms) {
    const mat = p.material || 'normal';
    if (PASS_THROUGH.includes(mat)) continue;
    if (p._deleted > 0) continue;
    const isSoft = p.h < 18; // thin platforms are soft (pass-through from below)

    // One-way platform collision — only land when falling onto it from above
    if (fighter.vy >= 0) {
      // Check horizontal overlap with generous edge tolerance
      const overlapX = fighter.x > p.x - charHalfW && fighter.x < p.x + p.w + charHalfW;

      // Swept check: was above last frame, now at/below platform top
      const wasAbove = prevBottom <= p.y + 2;
      const isAtOrBelow = currBottom >= p.y;

      if (overlapX && wasAbove && isAtOrBelow) {
        // Soft platforms: skip if moving up or phasing
        if (isSoft && fighter.canPhase && !fighter.grounded) continue;
        // Drop-through: if holding down and pressing jump on soft platform
        if (isSoft && fighter.diY > 0 && fighter.jumpHeld === false && fighter.vy > 0 && Math.abs(fighter.vx) < 0.5) {
          // Allow pass-through
          continue;
        }

        fighter.platformMaterial = mat;

        if (mat === 'quicksand') {
          // Slowly sink through quicksand — grounded but sinking
          fighter.y = p.y + 2;
          fighter.vy = Math.max(fighter.vy, 0.4);
          fighter.grounded = true;
          fighter.jumps = fighter.maxJumps;
        } else if (mat === 'snow') {
          // Snow — sink slowly, weaker jumps
          fighter.y = p.y + 1;
          fighter.vy = Math.max(fighter.vy, 0.2);
          fighter.grounded = true;
          fighter.jumps = fighter.maxJumps;
        } else if (mat === 'bounce') {
          // Bouncer — launch upward on contact
          fighter.y = p.y;
          fighter.vy = -22;
          fighter.grounded = false;
          fighter.jumps = fighter.maxJumps;
        } else if (mat === 'spike') {
          // Spikes — damage + knockback, launch off
          fighter.y = p.y;
          fighter.vy = -14;
          fighter.grounded = false;
          fighter.damage += 8;
          fighter.hitstun = 20;
          fighter.state = 'hitstun';
        } else if (mat === 'tar') {
          // Tar — trap fighter until knocked out by a hit
          fighter.y = p.y;
          fighter.vy = 0;
          fighter.grounded = true;
          fighter.jumps = fighter.maxJumps;
          fighter.trapped = true;
        } else if (mat === 'conveyor') {
          // Conveyor — solid, stores direction for push effect
          fighter.y = p.y;
          fighter.vy = 0;
          fighter.grounded = true;
          fighter.jumps = fighter.maxJumps;
          fighter.gravityInverted = false;
          fighter.recoveryAirUses = 0;
          fighter._conveyorDir = p.conveyorDir || 1;
        } else {
          fighter.y = p.y;
          fighter.vy = 0;
          fighter.grounded = true;
          fighter.jumps = fighter.maxJumps;
          fighter.gravityInverted = false;
          fighter.recoveryAirUses = 0;
        }
        if (!prevGrounded && fighter.state !== 'attacking') {
          fighter.landingLag = 2;
          fighter.state = 'idle';
        } else if (!prevGrounded) {
          fighter.landingLag = 2;
        }
        if (fighter.state === 'jumping') fighter.state = 'idle';
        break;
      }
    }
  }

  // ── Ceiling collision — hitting the bottom of a solid platform from below ──
  // Resolved BEFORE side walls so the head stops naturally instead of being
  // teleported sideways (was the underside-teleport bug). Platforms caught here
  // are excluded from the side-wall pass below.
  const ceilingHits = new Set();
  if (fighter.vy < 0) {
    for (const p of platforms) {
      const mat = p.material || 'normal';
      if (PASS_THROUGH.includes(mat)) continue;
      if (p._deleted > 0) continue;
      if (p.h < 18) continue;
      const overlapX = fighter.x > p.x - charHalfW && fighter.x < p.x + p.w + charHalfW;
      if (!overlapX) continue;
      const fighterHead = fighter.y - 55;
      const prevHead = fighter.prevY - 55;
      if (prevHead >= p.y + p.h && fighterHead < p.y + p.h) {
        fighter.y = p.y + p.h + 55;
        fighter.vy = 0;
        ceilingHits.add(p);
      }
    }
  }

  // ── Side wall collisions for solid platforms — prevent walking through sides ──
  for (const p of platforms) {
    const mat = p.material || 'normal';
    if (PASS_THROUGH.includes(mat)) continue;
    if (p._deleted > 0) continue;
    if (p.h < 18) continue; // thin platforms are pass-through
    if (ceilingHits.has(p)) continue; // head caught on underside — fall back down, no sideways shove
    // Skip if standing on top of this platform
    if (fighter.grounded && Math.abs(fighter.y - p.y) < 3) continue;
    // Skip if fighter's feet are at or above platform top
    if (fighter.y <= p.y + 2) continue;
    // Check if fighter body vertically overlaps platform body
    const fighterTop = fighter.y - 55;
    if (fighterTop >= p.y + p.h) continue;
    // Check horizontal overlap
    if (fighter.x + charHalfW > p.x && fighter.x - charHalfW < p.x + p.w) {
      // Push back to the side the fighter came from
      if (fighter.prevX + charHalfW <= p.x + 2) {
        fighter.x = p.x - charHalfW;
        if (fighter.vx > 0) fighter.vx = 0;
      } else if (fighter.prevX - charHalfW >= p.x + p.w - 2) {
        fighter.x = p.x + p.w + charHalfW;
        if (fighter.vx < 0) fighter.vx = 0;
      } else {
        // Was already inside — push to nearest side
        if (fighter.x < p.x + p.w / 2) {
          fighter.x = p.x - charHalfW;
          if (fighter.vx > 0) fighter.vx = 0;
        } else {
          fighter.x = p.x + p.w + charHalfW;
          if (fighter.vx < 0) fighter.vx = 0;
        }
      }
    }
  }

  // Blast zone — off-screen = lose stock (Grand Circuit prevents escapes via _gcNoBlast)
  if (!fighter._gcNoBlast && fighter.noBlastKill <= 0 && (fighter.x < -500 || fighter.x > stageWidth + 500 || fighter.y < -600 || fighter.y > stageHeight + 450)) {
    loseStock(fighter, stageWidth, stageHeight);
  }
}

function updateAttackProgress(fighter) {
  const elapsed = fighter.attackData.duration - fighter.attackTimer;
  fighter.attackData.progress = Math.min(elapsed / fighter.attackData.duration, 1);
}

export function checkHit(attacker, defender) {
  if (!attacker.attackData || attacker.attackData.hitApplied) return false;
  if (defender.invincible > 0) return false;
  // Pearl's Sixth Sense — 50% chance to auto-dodge any incoming attack
  if (defender.dodgeChance && Math.random() < defender.dodgeChance) {
    return false;
  }

  const p = attacker.attackData.progress;
  if (p < 0.08 || p > 0.85) return false;

  // Super moves use generous distance check
  if (attacker.attackData.isSuper) {
    const sdx = defender.x - attacker.x;
    const sdy = defender.y - attacker.y;
    return Math.sqrt(sdx * sdx + sdy * sdy) < 240;
  }

  // ── AABB hitbox collision — attacks only hit if the hitbox overlaps the defender's body ──
  const baseRange = (attacker.attackData.range || 80) * (attacker.rangeBoost || 1);
  const facing = attacker.facing;
  const st = attacker.attackData.sigType;

  // Build attack hitbox rectangle based on attack type
  let hbW, hbH, hbCX, hbCY;
  if (st === 'up' || st === 'aerial') {
    hbW = 70; hbH = baseRange;
    hbCX = attacker.x; hbCY = attacker.y - baseRange / 2 - 10;
  } else if (st === 'down' || st === 'downNormal') {
    hbW = 70; hbH = baseRange;
    hbCX = attacker.x; hbCY = attacker.y + baseRange / 2 - 20;
  } else if (st === 'heavy') {
    hbW = baseRange * 1.1; hbH = 80;
    hbCX = attacker.x + facing * (hbW / 2 - 10); hbCY = attacker.y - 30;
  } else {
    hbW = baseRange; hbH = 60;
    hbCX = attacker.x + facing * (hbW / 2 - 10); hbCY = attacker.y - 30;
  }

  // Defender body box — rectangle centered on body
  const dBW = 32, dBH = 72;
  const dBX = defender.x, dBY = defender.y - 36;

  // AABB overlap test
  return (hbCX - hbW / 2) < (dBX + dBW / 2) &&
         (hbCX + hbW / 2) > (dBX - dBW / 2) &&
         (hbCY - hbH / 2) < (dBY + dBH / 2) &&
         (hbCY + hbH / 2) > (dBY - dBH / 2);
}

export function applyHit(attacker, defender) {
  if (!attacker.attackData) return;
  attacker.attackData.hitApplied = true;
  defender.trapped = false; // getting hit frees you from tar / vines / freeze
  defender.reverseControls = 0; // getting hit frees you from reversed controls
  defender.slowTimer = 0; defender.speedMul = undefined; // getting hit frees you from slows / glue
  defender._controlBroken = true; // flag: expire control-effect projectiles (vines, ice, bubble, marionette, glue)

  // Power stat scales damage up; defense stat + active shields reduce it
  const rawDmg = (attacker.attackData.damage || 10) * (attacker.damageBoost || 1) * (attacker.statPowerMul || 1);
  const totalReduction = (defender.shieldAmount || 0) + (defender.statDefenseReduction || 0);
  const dmg = rawDmg * Math.max(0.1, 1 - totalReduction);
  // Super-only mode: non-super attacks deal no damage
  if (attacker.gameMode === 'superonly' && !attacker.attackData.isSuper) {
    return;
  }
  if (attacker.gameMode === 'hp') {
    defender.hp = Math.max(0, (defender.hp ?? 150) - dmg);
  } else {
    defender.damage += dmg;
    // Non-brawl modes (excludes Battle Royale & Grand Circuit, which use gameMode 'brawl'):
    // reaching 1500 damage instantly KOs the fighter (loses a stock).
    if (defender.damage >= 1500 && defender.stocks > 0 && defender.gameMode !== 'brawl') {
      defender._pendingDeath = true;
    }
  }
  defender._lastHitBy = attacker;

  attacker.superMeter = Math.min(attacker.maxSuper, attacker.superMeter + dmg * 0.7);
  defender.superMeter = Math.min(defender.maxSuper, defender.superMeter + dmg * 0.25);

  // Knockback scales smoothly with damage (Brawlhalla-style curve)
  const isLight = attacker.attackData.isNormal;
  const kbMul = 1 + defender.damage * 0.025;
  const kbBase = attacker.attackData.knockback || 1.0;
  const kbFactor = isLight ? 0.16 : attacker.attackData.isHeavy ? 0.32 : 0.24;
  const kb = dmg * kbFactor * kbMul * kbBase * (attacker.knockbackMul || 1) * KNOCKBACK_SCALE * (1 - (defender.knockbackReduction || 0));
  const st = attacker.attackData.sigType;

  if (attacker.attackData.isGroundPound) {
    defender.vy = -kb * 0.5;
    defender.vx = (defender.x > attacker.x ? 1 : -1) * kb * 1.5;
  } else if (attacker.attackData.isRecovery) {
    defender.vy = -kb * 2.0;
    defender.vx = attacker.facing * kb * 0.3;
  } else if (st === 'up' || st === 'aerial') {
    defender.vy = -kb * 1.8;
    defender.vx = attacker.facing * kb * 0.3;
  } else if (st === 'down' || st === 'downNormal') {
    defender.vy = kb * 0.6;
    defender.vx = attacker.facing * kb * 0.5;
  } else if (st === 'super') {
    defender.vy = -kb * 1.4;
    defender.vx = attacker.facing * kb * 1.2;
  } else if (st === 'heavy') {
    // Heavy attacks: strong, directional knockback based on attack type
    const heavyType = attacker.attackData.type;
    if (heavyType === 'groundSlam' || heavyType === 'freeze') {
      defender.vy = -kb * 1.5;
      defender.vx = attacker.facing * kb * 0.6;
    } else if (heavyType === 'launch') {
      defender.vy = -kb * 2.0;
      defender.vx = attacker.facing * kb * 0.3;
    } else {
      // Forward-launching heavy
      defender.vx = attacker.facing * kb * 1.4;
      defender.vy = -kb * 0.6;
    }
  } else {
    defender.vx = attacker.facing * kb * 1.2;
    defender.vy = -kb * 0.55;
  }

  const baseStun = attacker.attackData.isHeavy ? 20 : attacker.attackData.isSuper ? 35 : isLight ? 16 : 18;
  const controlHitstunMul = attacker.statControlHitstunMul || 1;
  defender.hitstun = Math.min(Math.round((baseStun + Math.floor(dmg * 0.4)) * controlHitstunMul), 50);
  defender.state = 'hitstun';
  defender.grounded = false;

  defender.hitEffects = defender.hitEffects || [];
  defender.hitEffects.push({
    x: defender.x, y: defender.y - 22,
    color: attacker.char.color,
    spawnFrame: defender.frame,
  });
}

export function loseStock(fighter, stageWidth, stageHeight) {
  const rp = fighter.respawnPoint;
  // Life's Rebirth: 50% chance to revive if power is active
  if (fighter.reviveChance && fighter.reviveChance > 0 && fighter.powerActive === 'heal') {
    if (Math.random() < fighter.reviveChance) {
      fighter.reviveChance = 0;
      fighter.damage = Math.max(0, fighter.damage - 100);
      fighter.x = rp ? rp.x : stageWidth / 2;
      fighter.y = rp ? rp.y : 60;
      fighter.vx = 0; fighter.vy = 0;
      fighter.invincible = 120;
      fighter.hitstun = 0;
      fighter.state = 'idle';
      fighter.attackData = null;
      fighter.attackTimer = 0;
      fighter.gravityInverted = false;
      return;
    }
    fighter.reviveChance = 0; // chance used, didn't revive
  }
  fighter._deathX = fighter.x;
  fighter._deathY = fighter.y;
  fighter.stocks--;
  fighter.damage = 0;
  fighter.x = rp ? rp.x : (stageWidth / 2 + (Math.random() - 0.5) * 80);
  fighter.y = rp ? rp.y : 60;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.invincible = 90;
  fighter.hitstun = 0;
  fighter.state = 'idle';
  fighter.attackData = null;
  fighter.attackTimer = 0;
  fighter.jumps = 2;
  fighter.sigCooldown = 0;
  fighter.normalCooldown = 0;
  fighter.heavyCooldown = 0;
  fighter.gravityInverted = false;
  if (fighter.gameMode === 'hp') fighter.hp = 150;
}

// (CPU AI logic extracted to botAI.js — re-exported at top of file)
