// botAI.js — CPU AI logic extracted from fighter.js for maintainability.
import { COMBOS, comboMoveReady as comboMoveReadyUtil, comboMoveToInput } from './combos.js';
import { selectTarget, navigateToward, platformNavigate as navPlatformNavigate } from './botNavigation.js';

export const CPU_DIFFICULTY = {
  newcomer: { reactionTime: 200, skillChance: 0.03, jumpChance: 0.03, attackChance: 0.05, edgeGuard: false, combo: false, superUse: false, heavyChance: 0.02 },
  beginner: { reactionTime: 120, skillChance: 0.08, jumpChance: 0.05, attackChance: 0.1,  edgeGuard: false, combo: false, superUse: false, heavyChance: 0.05 },
  easy:     { reactionTime: 70,  skillChance: 0.25, jumpChance: 0.18, attackChance: 0.3,  edgeGuard: false, combo: false, superUse: false, heavyChance: 0.15 },
  amateur:  { reactionTime: 55,  skillChance: 0.38, jumpChance: 0.28, attackChance: 0.42, edgeGuard: false, combo: false, superUse: false, heavyChance: 0.25 },
  regular:  { reactionTime: 38,  skillChance: 0.50, jumpChance: 0.38, attackChance: 0.55, edgeGuard: false, combo: false, superUse: true,  heavyChance: 0.35 },
  pro:      { reactionTime: 28,  skillChance: 0.65, jumpChance: 0.50, attackChance: 0.70, edgeGuard: true,  combo: false, superUse: true,  heavyChance: 0.45 },
  hard:     { reactionTime: 18,  skillChance: 0.78, jumpChance: 0.60, attackChance: 0.80, edgeGuard: true,  combo: true,  superUse: true,  heavyChance: 0.55 },
  insane:   { reactionTime: 7,   skillChance: 0.93, jumpChance: 0.80, attackChance: 0.95, edgeGuard: true,  combo: true,  superUse: true,  heavyChance: 0.75 },
  honored:  { reactionTime: 1,   skillChance: 1.0,  jumpChance: 1.0,  attackChance: 1.0,  edgeGuard: true,  combo: true,  superUse: true,  heavyChance: 1.0, autoDodge: true, perfectPower: true },
};

function avoidHazards(fighter, inputs, platforms, opponent) {
  if (!fighter.grounded) return;
  const moveDir = inputs.right ? 1 : (inputs.left ? -1 : 0);
  if (moveDir === 0) return;
  const aheadX = fighter.x + moveDir * 55;
  let aheadPlatform = null;
  for (const p of platforms) {
    if (p._deleted > 0) continue;
    const mat = p.material || 'normal';
    if (['water', 'lava', 'cloud', 'acid', 'tar'].includes(mat)) continue;
    if (aheadX < p.x - 16 || aheadX > p.x + p.w + 16) continue;
    if (p.y < fighter.y - 10) continue;
    if (!aheadPlatform || p.y < aheadPlatform.y) aheadPlatform = p;
  }
  const UNSAFE_MATS = ['lava', 'quicksand', 'spike', 'acid', 'tar', 'snow'];
  if (!aheadPlatform) {
    if (opponent && fighter.jumps > 0 && Math.abs(opponent.x - aheadX) < 60 && !opponent.grounded) {
      inputs.jump = false; return;
    }
    if (moveDir < 0) inputs.left = false; else inputs.right = false;
    inputs.jump = false; return;
  }
  if (UNSAFE_MATS.includes(aheadPlatform.material || 'normal')) {
    if (opponent && fighter.jumps > 0 && Math.abs(opponent.x - aheadX) < 80) return;
    inputs.jump = true;
  }
}

function honoredDecide(fighter, opponent, platforms, dx, dy, dist) {
  const inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
  if (dx > 0) inputs.right = true; else inputs.left = true;
  if (dy < -40 && (fighter.grounded || fighter.jumps > 0)) inputs.jump = true;
  const botOffstage = !fighter.grounded && (fighter.x < 150 || fighter.x > 770 || fighter.y > 400);
  const oppOffstage = !opponent.grounded && (opponent.x < 150 || opponent.x > 770 || opponent.y > 400);

  if (botOffstage && oppOffstage && fighter._honoredOffstageCombo !== 'done') {
    if (fighter._honoredOffstageCombo === 'recovery-done') {
      if (fighter.superMeter >= fighter.maxSuper && dist < 260) {
        inputs.superMove = true; fighter._honoredOffstageCombo = 'done'; return inputs;
      }
      fighter._honoredOffstageCombo = null;
    } else if (fighter.recoveryCooldown <= 0 && fighter.recoveryAirUses < 1 && Math.abs(dy) < 120 && dist < 130) {
      inputs.sig = true; inputs.up = true; fighter._honoredOffstageCombo = 'recovery-done'; return inputs;
    }
  }
  if (!botOffstage || !oppOffstage) fighter._honoredOffstageCombo = null;

  if (fighter.grounded && opponent.grounded && dist < 200 && Math.abs(dy) < 55) {
    if (!fighter._honoredAlt) fighter._honoredAlt = 'sig';
    if (fighter._honoredAlt === 'sig' && fighter.sigCooldown <= 0) {
      inputs.sig = true;
      if (dx > 0) { inputs.left = false; inputs.right = true; } else { inputs.left = true; inputs.right = false; }
      fighter._honoredAlt = 'heavy'; return inputs;
    }
    if (fighter._honoredAlt === 'heavy' && fighter.heavyCooldown <= 0) {
      inputs.heavy = true;
      if (dx > 0) { inputs.left = false; inputs.right = true; } else { inputs.left = true; inputs.right = false; }
      fighter._honoredAlt = 'sig'; return inputs;
    }
    return inputs;
  }
  if (fighter._honoredAlt && (dist > 200 || Math.abs(dy) > 55)) fighter._honoredAlt = null;

  if (fighter.superMeter >= fighter.maxSuper && dist < 240 && Math.abs(dy) < 120 && (opponent.damage > 30 || fighter.damage > 80)) {
    inputs.superMove = true; return inputs;
  }
  if (!fighter.grounded && dy < -40 && fighter.recoveryCooldown <= 0 && fighter.recoveryAirUses < 1 && dist < 120) {
    inputs.sig = true; inputs.up = true; return inputs;
  }
  if (fighter.grounded && fighter.sigCooldown <= 0 && dist < 130) {
    if (dy < -40) { inputs.sig = true; inputs.up = true; return inputs; }
    if (dy > 40) { inputs.sig = true; inputs.down = true; return inputs; }
    if (Math.abs(dy) < 55) {
      inputs.sig = true;
      if (dx > 0) { inputs.left = false; inputs.right = true; } else { inputs.left = true; inputs.right = false; }
      return inputs;
    }
  }
  if (fighter.heavyCooldown <= 0 && dist < 140 && Math.abs(dy) < 50) {
    inputs.heavy = true;
    if (dx > 0) { inputs.left = false; inputs.right = true; } else { inputs.left = true; inputs.right = false; }
    return inputs;
  }
  if (fighter.powerCooldown <= 0 && fighter.powerDisabled <= 0 && dist < 300 && Math.abs(dy) < 150) {
    inputs.power = true;
    if (dx > 0) { inputs.left = false; inputs.right = true; } else { inputs.left = true; inputs.right = false; }
    return inputs;
  }
  return null;
}

function _mvAway(fighter, px) { return fighter.x < px ? { left: true, right: false } : { left: false, right: true }; }
const _NO_INPUT = { left:false, right:false, jump:false, up:false, down:false, sig:false, power:false, superMove:false, heavy:false };

// ── Homing projectile flee logic ──
// Bots only panic-flee homing projectiles when within 50% of the mode's auto-KO threshold.
// Outside that range they still dodge but don't run away blindly.
function _getKOThreshold(fighter) {
  if (fighter._isBR) return 500;
  if (fighter._gcNoBlast) return 450;
  return 1500;
}
function _isHomingProjectile(t) {
  return t === 'fireball' || t === 'electric' || t === 'energy_ball' || t === 'energy';
}
// Choose a flee direction that won't run the bot off-stage or into a wall
function _safeFleeDir(fighter, fromX) {
  const wantLeft = fighter.x < fromX;
  const STAGE_LEFT = 80;
  const STAGE_RIGHT = 880;
  let leftSafe = fighter.x > STAGE_LEFT;
  let rightSafe = fighter.x < STAGE_RIGHT;
  // Check for solid walls in either direction
  const plats = fighter._platforms || [];
  for (const p of plats) {
    if (p._deleted > 0) continue;
    const mat = p.material || 'normal';
    if (['water','lava','cloud','acid','tar','antigravity'].includes(mat)) continue;
    if (p.h < 18) continue;
    // Wall to the left of fighter
    if (p.x + p.w < fighter.x && fighter.x - (p.x + p.w) < 60 && Math.abs(p.y - fighter.y) < 80) leftSafe = false;
    // Wall to the right of fighter
    if (p.x > fighter.x && p.x - fighter.x < 60 && Math.abs(p.y - fighter.y) < 80) rightSafe = false;
  }
  if (wantLeft && leftSafe) return { left: true, right: false };
  if (!wantLeft && rightSafe) return { left: false, right: true };
  // Preferred direction blocked — go the other way if it's safe
  if (wantLeft && rightSafe) return { left: false, right: true };
  if (!wantLeft && leftSafe) return { left: true, right: false };
  // Both directions unsafe — stay put and jump
  return { left: false, right: false };
}

function projectileThreat(fighter, p) {
  const fx = fighter.x, bodyY = fighter.y - 30;
  const dx = p.x - fx, dy = p.y - bodyY;
  const dist = Math.hypot(dx, dy);
  const t = p.type;
  if (t === 'fireball' || t === 'electric' || t === 'energy_ball' || t === 'energy') {
    if (dist > 320) return null;
    if (p.target !== fighter && dist > 200) return null;
    // Only panic-flee homing projectiles when within 50% of the mode's auto-KO threshold
    const koThreshold = _getKOThreshold(fighter);
    const inDangerZone = (fighter.damage || 0) >= koThreshold * 0.5;
    if (!inDangerZone) return null; // outside danger range — still dodge intelligently via normal AI
    const urgency = 1 - Math.min(1, dist / 320);
    const fleeDir = _safeFleeDir(fighter, p.x);
    return { urgency, inputs: { ..._NO_INPUT, ...fleeDir, jump: fighter.grounded, down: !fighter.grounded && fighter.y < p.y } };
  }
  if (t === 'beam' || t === 'stage_slice') {
    if (Math.abs(dy) > 55) return null;
    const approaching = (p.vx > 0 && dx < 0 && dx > -460) || (p.vx < 0 && dx > 0 && dx < 460);
    if (!approaching) return null;
    const urgency = 1 - Math.min(1, Math.abs(dx) / 460);
    return { urgency, inputs: { ..._NO_INPUT, jump: fighter.grounded, up: !fighter.grounded } };
  }
  if (t === 'lightning_bolt') {
    if (p.warning <= 0 || p.hitApplied) return null;
    if (Math.abs(fx - p.targetX) > 70) return null;
    const urgency = 1 - Math.min(1, p.warning / 45);
    return { urgency, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.targetX), jump: fighter.grounded } };
  }
  if (t === 'stone_drop') {
    if (p.hitApplied || Math.abs(fx - p.targetX) > 70 || p.y > fighter.y) return null;
    return { urgency: 0.85, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.targetX) } };
  }
  if (t === 'demon') {
    if (dist > 220 || p.hitApplied) return null;
    const urgency = 1 - Math.min(1, dist / 220);
    return { urgency, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.x), jump: fighter.grounded || fighter.y < p.y, down: !fighter.grounded && fighter.y < p.y } };
  }
  if (t === 'hammer') {
    if (Math.abs(dy) > 60 || dist > 90) return null;
    return { urgency: 0.9, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.x), jump: fighter.grounded } };
  }
  if (t === 'potion') {
    if (dist > 180) return null;
    return { urgency: 0.8, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.x), jump: fighter.grounded } };
  }
  if (t === 'sonar_pulse') {
    const ringDist = Math.hypot(fx - p.x, bodyY - p.y);
    if (Math.abs(ringDist - p.r) > 45 || p.r >= p.maxR) return null;
    return { urgency: 0.7, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.x), jump: true } };
  }
  if (t === 'whip') {
    const tipX = p.x + p.facing * p.reach;
    const inFront = p.facing > 0 ? (fx > p.x && fx < tipX + 30) : (fx < p.x && fx > tipX - 30);
    if (!inFront || Math.abs(dy) > 55) return null;
    return { urgency: 0.85, inputs: { ..._NO_INPUT, jump: fighter.grounded, up: !fighter.grounded } };
  }
  if (t === 'elementor_runner') {
    if (Math.abs(dy) > 60 || dist > 120) return null;
    return { urgency: 0.7, inputs: { ..._NO_INPUT, jump: true } };
  }
  // ── Gen 1-4 power projectiles ──
  if (t === 'gen_lightning_call') {
    if (p.warning <= 0 || p.hitApplied) return null;
    if (Math.abs(fx - p.targetX) > 70) return null;
    return { urgency: 0.9, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.targetX), jump: fighter.grounded } };
  }
  if (t === 'gen_flame_burst' || t === 'gen_ember_shot' || t === 'gen_venom_spit' || t === 'gen_cinder_snap') {
    if (dist > 250 || p.hitApplied) return null;
    return { urgency: 0.85, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.x), jump: fighter.grounded } };
  }
  if (t === 'gen_water_push' || t === 'gen_gust_push' || t === 'gen_scatter_gust' || t === 'gen_ash_flash' || t === 'gen_fire_wave' || t === 'gen_barrier_drive' || t === 'gen_wind_carry') {
    if (Math.abs(dy) > 55 || dist > 180) return null;
    return { urgency: 0.8, inputs: { ..._NO_INPUT, jump: fighter.grounded, up: !fighter.grounded } };
  }
  if (t === 'gen_water_whip') {
    const tipX = p.x + p.facing * p.reach;
    const inFront = p.facing > 0 ? (fx > p.x && fx < tipX + 30) : (fx < p.x && fx > tipX - 30);
    if (!inFront || Math.abs(dy) > 55) return null;
    return { urgency: 0.85, inputs: { ..._NO_INPUT, jump: fighter.grounded, up: !fighter.grounded } };
  }
  if (t === 'gen_stone_pillar' || t === 'gen_vine_strike' || t === 'gen_thorn_vine') {
    if (Math.abs(fx - (p.targetX || p.x)) > 60 || dist > 120) return null;
    return { urgency: 0.8, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.targetX || p.x), jump: true } };
  }
  if (t === 'gen_iron_clamp' || t === 'gen_resonance_lock' || t === 'gen_mist_ambush') {
    if (Math.abs(fx - (p.targetX || p.x)) > 70) return null;
    return { urgency: 0.9, inputs: { ..._NO_INPUT, ..._mvAway(fighter, p.targetX || p.x), jump: fighter.grounded } };
  }
  return null;
}

function dashSlashThreat(fighter, opp) {
  const d = opp._dash;
  if (!d) return null;
  const dx = fighter.x - opp.x;
  const approaching = (d.dir > 0 && dx < 0 && dx > -260) || (d.dir < 0 && dx > 0 && dx < 260);
  if (!approaching || Math.abs(opp.y - fighter.y) > 80) return null;
  const urgency = 1 - Math.min(1, Math.abs(dx) / 260);
  return { urgency, inputs: { ..._NO_INPUT, ..._mvAway(fighter, opp.x), jump: fighter.grounded, down: !fighter.grounded && fighter.y < opp.y } };
}

function dodgeIncomingPowers(fighter, opponents, diff) {
  let best = null;
  for (const opp of opponents) {
    if (!opp || opp === fighter || opp.stocks <= 0) continue;
    for (const p of (opp.projectiles || [])) {
      const th = projectileThreat(fighter, p);
      if (th && (!best || th.urgency > best.urgency)) best = th;
    }
    for (const p of (opp.genProjectiles || [])) {
      const th = projectileThreat(fighter, p);
      if (th && (!best || th.urgency > best.urgency)) best = th;
    }
    if (opp.powerActive === 'dash_slash' && opp._dash) {
      const th = dashSlashThreat(fighter, opp);
      if (th && (!best || th.urgency > best.urgency)) best = th;
    }
  }
  if (!best) return null;
  if (Math.random() > Math.min(1, (diff?.skillChance || 0.5) * 1.5 + 0.1)) return null;
  return best.inputs;
}

export function platformNavigate(fighter, target, platforms) {
  return navPlatformNavigate(fighter, target, platforms);
}

export function updateAI(fighter, opponent, difficultyKey = 'regular', platforms = [], aggressionMul = 1, personality = 'balanced') {
  const diff = CPU_DIFFICULTY[difficultyKey] || CPU_DIFFICULTY.regular;
  const PERSONALITY = {
    evasive:    { aggroMul: 0.5,  jumpMul: 1.5, attackMul: 0.6, retreatDamage: 0.25 },
    defensive:  { aggroMul: 0.75, jumpMul: 1.0, attackMul: 0.8, retreatDamage: 0.40 },
    balanced:   { aggroMul: 1.0,  jumpMul: 1.0, attackMul: 1.0, retreatDamage: 0.55 },
    aggressive: { aggroMul: 1.5,  jumpMul: 0.7, attackMul: 1.3, retreatDamage: 0.85 },
  };
  const pm = PERSONALITY[personality] || PERSONALITY.balanced;
  fighter.aiTimer--;
  const alwaysUpdate = difficultyKey === 'honored' || difficultyKey === 'insane';

  if (fighter.hitstun > 0) fighter._wasInHitstun = 8;
  else if (fighter._wasInHitstun > 0) fighter._wasInHitstun--;

  if (fighter.hitstun > 5) {
    let centerX = 640;
    for (const p of platforms) { if (p.w > 200) { centerX = p.x + p.w / 2; break; } }
    const inputs = { left: fighter.x > centerX + 15, right: fighter.x < centerX - 15, up: fighter.y > 350, down: false, jump: false, sig: false, power: false, superMove: false, heavy: false };
    fighter.aiAction = inputs; return inputs;
  }

  if (difficultyKey === 'honored' && fighter.hitstun <= 0 && fighter.state !== 'attacking' && fighter.state !== 'superAttack' && opponent && opponent.attackData && (opponent.state === 'attacking' || opponent.state === 'superAttack')) {
    const ap = opponent.attackData.progress || 0;
    if (ap >= 0.08 && ap <= 0.85) {
      const odx = opponent.x - fighter.x;
      let inHitbox = false;
      if (opponent.attackData.isSuper) {
        const sdx = fighter.x - opponent.x, sdy = fighter.y - opponent.y;
        inHitbox = Math.sqrt(sdx * sdx + sdy * sdy) < 240;
      } else {
        const baseRange = (opponent.attackData.range || 80) * (opponent.rangeBoost || 1);
        const of = opponent.facing; const st = opponent.attackData.sigType;
        let hbW, hbH, hbCX, hbCY;
        if (st === 'up' || st === 'aerial') { hbW = 70; hbH = baseRange; hbCX = opponent.x; hbCY = opponent.y - baseRange / 2 - 10; }
        else if (st === 'down' || st === 'downNormal') { hbW = 70; hbH = baseRange; hbCX = opponent.x; hbCY = opponent.y + baseRange / 2 - 20; }
        else if (st === 'heavy') { hbW = baseRange * 1.1; hbH = 80; hbCX = opponent.x + of * (hbW / 2 - 10); hbCY = opponent.y - 30; }
        else { hbW = baseRange; hbH = 60; hbCX = opponent.x + of * (hbW / 2 - 10); hbCY = opponent.y - 30; }
        const dBW = 32, dBH = 72;
        inHitbox = (hbCX - hbW / 2) < (fighter.x + dBW / 2) && (hbCX + hbW / 2) > (fighter.x - dBW / 2) && (hbCY - hbH / 2) < (fighter.y - 36 + dBH / 2) && (hbCY + hbH / 2) > (fighter.y - 36 - dBH / 2);
      }
      if (inHitbox) {
        const inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
        if (odx > 0) inputs.left = true; else inputs.right = true;
        if (fighter.grounded) inputs.jump = true;
        else if (fighter.x > 100 && fighter.x < 860) inputs.down = true;
        fighter.aiAction = inputs; return inputs;
      }
    }
  }

  if (fighter.invincible <= 0 && fighter.hitstun <= 0 && fighter.state !== 'attacking' && fighter.state !== 'superAttack') {
    const _dodgeOpps = (fighter._allOpponents && fighter._allOpponents.length > 0) ? fighter._allOpponents : (opponent ? [opponent] : []);
    const _dodge = dodgeIncomingPowers(fighter, _dodgeOpps, diff);
    if (_dodge) { fighter.aiAction = _dodge; return _dodge; }
  }

  if (fighter._allOpponents && fighter._allOpponents.length > 0) {
    const _alive = fighter._allOpponents.filter(o => o && o !== fighter && o.stocks > 0 && !o._eliminated);
    const _targetValid = fighter._aiTarget && _alive.includes(fighter._aiTarget);
    const TARGET_LOCK_FRAMES = 45 * 60;
    if (!_targetValid) {
      const _pick = selectTarget(fighter, _alive, platforms);
      if (_pick) { fighter._aiTarget = _pick; fighter._aiTargetTimer = 0; opponent = _pick; }
      else { fighter._aiTarget = null; }
    } else {
      opponent = fighter._aiTarget;
      fighter._aiTargetTimer = (fighter._aiTargetTimer || 0) + 1;
      if (fighter._aiTargetTimer > TARGET_LOCK_FRAMES && _alive.length > 1) {
        const _others = _alive.filter(o => o !== fighter._aiTarget);
        const _pick = selectTarget(fighter, _others, platforms);
        if (_pick) { fighter._aiTarget = _pick; fighter._aiTargetTimer = 0; opponent = _pick; }
      }
    }
  }

  if (!opponent || opponent.stocks <= 0) {
    let centerX = 640;
    for (const p of platforms) { if (p.w > 200) { centerX = p.x + p.w / 2; break; } }
    const inputs = { left: fighter.x > centerX + 20, right: fighter.x < centerX - 20, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
    fighter.aiAction = inputs; return inputs;
  }

  if (fighter.aiTimer > 0 && !alwaysUpdate) return fighter.aiAction || {};
  if (fighter.aiTimer > diff.reactionTime * 0.2 && alwaysUpdate) {
    const nav = navigateToward(fighter, opponent, platforms);
    const inputs = { left: nav.left, right: nav.right, jump: nav.jump, up: false, down: nav.down, sig: false, power: false, superMove: false, heavy: false };
    fighter.aiAction = inputs; return inputs;
  }

  fighter.aiTimer = diff.reactionTime + Math.floor(Math.random() * diff.reactionTime * 0.3);
  const dx = opponent.x - fighter.x;
  const dy = opponent.y - fighter.y;
  const dist = Math.abs(dx);
  const inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

  const _agMul = (aggressionMul || 1) * pm.aggroMul;
  const skill = Math.random() < Math.min(1, diff.skillChance * _agMul);
  const doAttack = Math.random() < Math.min(1, diff.attackChance * _agMul * pm.attackMul);
  const doJump = Math.random() < Math.min(1, diff.jumpChance * _agMul * pm.jumpMul);
  const doHeavy = Math.random() < Math.min(1, (diff.heavyChance || 0.3) * _agMul);

  if (fighter._comboFollowUp > 0) {
    fighter._comboFollowUp--;
    if (fighter.hitstun <= 0 && fighter.heavyCooldown <= 0 && dist < 200 && Math.abs(dy) < 55 && skill) {
      inputs.heavy = true; inputs.left = dx > 0; inputs.right = dx < 0;
      fighter.aiAction = inputs; return inputs;
    }
  }
  if (fighter._wasInHitstun > 0 && fighter.hitstun <= 0 && fighter.heavyCooldown <= 0 && dist < 250 && Math.abs(dy) < 55 && (difficultyKey === 'honored' || difficultyKey === 'insane' || difficultyKey === 'hard') && skill) {
    inputs.heavy = true; inputs.left = dx > 0; inputs.right = dx < 0;
    fighter.aiAction = inputs; return inputs;
  }

  const retreatThreshold = fighter._isBR ? 450 : 1200;
  const oppWeaker = !opponent || (opponent.damage || 0) <= (fighter.damage || 0);
  if (fighter.damage > retreatThreshold && dist < 400 && oppWeaker && !fighter._gcNoRetreat) {
    inputs.left = dx > 0; inputs.right = dx < 0;
    if (fighter.superMeter >= fighter.maxSuper && skill) inputs.superMove = true;
    else if (fighter.powerCooldown <= 0 && skill) inputs.power = true;
    else if (fighter.sigCooldown <= 0 && dist > 120 && Math.abs(dy) < 55 && skill) { inputs.sig = true; inputs.left = dx > 0; inputs.right = dx < 0; }
    if (doJump && fighter.grounded) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  if (['lava', 'quicksand', 'spike', 'acid', 'tar', 'snow', 'water'].includes(fighter.platformMaterial)) {
    let safeX = 640; let safeDist = Infinity;
    for (const p of platforms) {
      if (!['lava', 'quicksand', 'spike', 'acid', 'tar', 'snow', 'water', 'cloud'].includes(p.material || 'normal')) {
        const pc = p.x + p.w / 2; const d = Math.abs(pc - fighter.x);
        if (d < safeDist) { safeDist = d; safeX = pc; }
      }
    }
    inputs.left = fighter.x > safeX + 20; inputs.right = fighter.x < safeX - 20; inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }
  if (fighter.platformMaterial === 'conveyor' && fighter.grounded) {
    const dir = fighter.platformConveyorDir || 1;
    if (dir > 0) { inputs.left = true; inputs.right = false; } else { inputs.right = true; inputs.left = false; }
  }

  const hazardNearOpponent = platforms.find(p =>
    ['lava', 'quicksand', 'spike', 'acid', 'tar', 'snow'].includes(p.material) &&
    Math.abs((p.x + p.w / 2) - opponent.x) < p.w * 0.6 && Math.abs(p.y - opponent.y) < 80
  );
  const pushTowardHazard = hazardNearOpponent && dist < 200;

  if (difficultyKey === 'beginner') {
    if (Math.random() > 0.6) { inputs.left = Math.random() > 0.5; inputs.right = !inputs.left; }
    if (fighter.powerCooldown <= 0 && Math.random() < 0.12) inputs.power = true;
    if (fighter.superMeter >= fighter.maxSuper && Math.random() < 0.3) inputs.superMove = true;
    fighter.aiAction = inputs; return inputs;
  }
  if (difficultyKey === 'easy') {
    inputs.left = dx < -30; inputs.right = dx > 30;
    if (fighter.powerCooldown <= 0 && Math.random() < 0.25) inputs.power = true;
    if (fighter.superMeter >= fighter.maxSuper && Math.random() < 0.4) inputs.superMove = true;
    if (doJump && fighter.grounded) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  if (difficultyKey === 'honored' && opponent && opponent.stocks > 0) {
    const honoredInputs = honoredDecide(fighter, opponent, platforms, dx, dy, dist);
    if (honoredInputs) { avoidHazards(fighter, honoredInputs, platforms, opponent); fighter.aiAction = honoredInputs; return honoredInputs; }
  }

  if (diff.edgeGuard && !opponent.grounded && (opponent.x < 80 || opponent.x > 840)) {
    inputs.left = dx < 0; inputs.right = dx > 0;
    if (dy < -60 && doJump) inputs.jump = true;
    if (dist < 220 && skill) {
      if (diff.superUse && fighter.superMeter >= fighter.maxSuper && opponent.damage > 35 && Math.abs(dy) < 120) inputs.superMove = true;
      else if (fighter.heavyCooldown <= 0 && Math.abs(dy) < 55) { inputs.heavy = true; inputs.left = dx > 0; inputs.right = dx < 0; }
      else if (fighter.powerCooldown <= 0 && Math.abs(dy) < 150) { inputs.power = true; inputs.left = dx > 0; inputs.right = dx < 0; }
    }
    fighter.aiAction = inputs; return inputs;
  }

  if (fighter.x < 100) { inputs.right = true; if (!fighter.grounded) inputs.jump = true; }
  else if (fighter.x > 860) { inputs.left = true; if (!fighter.grounded) inputs.jump = true; }
  else if (fighter.y > 440 && !fighter.grounded) inputs.jump = true;
  if (!fighter.grounded && fighter.y > 420 && fighter.recoveryCooldown <= 0 && skill) { inputs.sig = true; inputs.up = true; }
  else if (dist > 240 || Math.abs(dy) > 55) {
    const nav = navigateToward(fighter, opponent, platforms);
    inputs.left = nav.left; inputs.right = nav.right;
    if (nav.jump) inputs.jump = true; if (nav.down) inputs.down = true;
    if (skill && doAttack && Math.abs(dy) < 150) {
      if (diff.superUse && fighter.superMeter >= fighter.maxSuper && dist < 240 && Math.abs(dy) < 120) inputs.superMove = true;
      else if (fighter.powerCooldown <= 0 && fighter.powerDisabled <= 0 && dist < 350) { inputs.power = true; inputs.left = dx > 0; inputs.right = dx < 0; }
    }
  } else if (skill && doAttack) {
    const r = Math.random();
    const ady = Math.abs(dy);
    if (pushTowardHazard && fighter.heavyCooldown <= 0) {
      inputs.heavy = true;
      const hazardX = hazardNearOpponent.x + hazardNearOpponent.w / 2;
      inputs.left = hazardX < fighter.x; inputs.right = hazardX > fighter.x;
    }
    else if (diff.superUse && fighter.superMeter >= fighter.maxSuper && ady < 120 && (opponent.damage > 45 || fighter.damage > 80 || Math.random() < 0.25)) inputs.superMove = true;
    else if (fighter.powerCooldown <= 0 && fighter.powerDisabled <= 0 && ady < 150) inputs.power = true;
    else if (doHeavy && fighter.heavyCooldown <= 0 && r > 0.45 && ady < 55) { inputs.heavy = true; if (dx > 0) { inputs.left = false; inputs.right = true; } else { inputs.left = true; inputs.right = false; } }
    else if (doHeavy && fighter.heavyCooldown <= 0 && fighter.grounded && (difficultyKey === 'hard' || difficultyKey === 'insane' || difficultyKey === 'honored') && r > 0.2 && ady < 55) { inputs.heavy = true; inputs.down = true; }
    else if (doHeavy && fighter.heavyCooldown <= 0 && !fighter.grounded && opponent.y > fighter.y + 40 && (difficultyKey === 'pro' || difficultyKey === 'hard' || difficultyKey === 'insane' || difficultyKey === 'honored')) { inputs.heavy = true; inputs.down = true; }
    else if (diff.combo && fighter.sigCooldown <= 0 && r > 0.3 && ady < 55) {
      if (opponent.hitstun > 3 && fighter.heavyCooldown <= 0 && opponent.damage > 40) inputs.heavy = true;
      else { inputs.sig = true; if (opponent.hitstun > 0) fighter._comboFollowUp = 3; }
      inputs.left = dx > 0; inputs.right = dx < 0;
    }
    else if (r > 0.35 && fighter.sigCooldown <= 0 && fighter.grounded) {
      if (dy < -55) inputs.sig = true;
      else if (dy > 55) { inputs.sig = true; inputs.down = true; }
      else if (ady < 55) { inputs.sig = true; inputs.left = dx > 0; inputs.right = dx < 0; }
    }
    else if (fighter.normalCooldown <= 0 && ady < 40) { inputs.normal = true; inputs.left = dx > 0; inputs.right = dx < 0; }
    else { inputs.left = dx < 0; inputs.right = dx > 0; if (doJump && fighter.grounded) inputs.jump = true; }
  } else {
    const nav = navigateToward(fighter, opponent, platforms);
    inputs.left = nav.left; inputs.right = nav.right;
    if (nav.jump) inputs.jump = true; if (nav.down) inputs.down = true;
  }

  avoidHazards(fighter, inputs, platforms, opponent);
  fighter.aiAction = inputs;
  return inputs;
}
