// Element 6 Universal Bot Intelligence
// Shared perception, prediction, memory, tactical scoring, and difficulty scaling.

export const BOT_SKILL = {
  newcomer: { think: 0.35, predict: 0.05, adapt: 0.00, execution: 0.25, risk: 0.25 },
  beginner: { think: 0.45, predict: 0.12, adapt: 0.05, execution: 0.35, risk: 0.30 },
  easy:     { think: 0.58, predict: 0.22, adapt: 0.10, execution: 0.48, risk: 0.40 },
  amateur:  { think: 0.68, predict: 0.32, adapt: 0.18, execution: 0.58, risk: 0.48 },
  regular:  { think: 0.78, predict: 0.44, adapt: 0.28, execution: 0.68, risk: 0.56 },
  pro:      { think: 0.86, predict: 0.58, adapt: 0.40, execution: 0.78, risk: 0.62 },
  hard:     { think: 0.92, predict: 0.70, adapt: 0.54, execution: 0.86, risk: 0.68 },
  insane:   { think: 0.97, predict: 0.84, adapt: 0.72, execution: 0.94, risk: 0.76 },
  honored:  { think: 1.00, predict: 0.96, adapt: 0.94, execution: 0.985, risk: 0.82 },
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const dist = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

export function botSkill(difficulty = 'regular') {
  return BOT_SKILL[difficulty] || BOT_SKILL.regular;
}

export function predictPosition(entity, frames = 10) {
  if (!entity) return null;
  return {
    x: (entity.x || 0) + (entity.vx || 0) * frames,
    y: (entity.y || 0) + (entity.vy || 0) * frames,
  };
}

export function predictLandingX(entity, floorY, maxFrames = 90) {
  if (!entity) return 0;
  let x = entity.x || 0;
  let y = entity.y || 0;
  let vx = entity.vx || 0;
  let vy = entity.vy || 0;
  for (let i = 0; i < maxFrames; i++) {
    x += vx; y += vy;
    vy += 0.5;
    if (y >= floorY) return x;
  }
  return x;
}

function memoryFor(bot) {
  if (!bot._e6BotMind) {
    bot._e6BotMind = {
      observations: 0,
      lastX: bot.x || 0,
      lastY: bot.y || 0,
      opponentPatterns: new Map(),
      lastObjective: null,
      planAge: 0,
      mistakes: 0,
      successfulActions: 0,
    };
  }
  return bot._e6BotMind;
}

export function observeBot(bot, world = {}, difficulty = 'regular') {
  const skill = botSkill(difficulty);
  const m = memoryFor(bot);
  const opponents = (world.opponents || []).filter(Boolean);
  const teammates = (world.teammates || []).filter(Boolean);
  const target = world.target || opponents[0] || null;

  const vx = (bot.x || 0) - m.lastX;
  const vy = (bot.y || 0) - m.lastY;
  const targetKey = target?._userId || target?.id || target?.playerIndex || target?.slot || 'target';
  const old = m.opponentPatterns.get(targetKey) || { samples: 0, left: 0, right: 0, jumps: 0, attacks: 0 };
  old.samples++;
  if (vx < -0.4) old.left++; else if (vx > 0.4) old.right++;
  if ((target?.vy || 0) < -1.5) old.jumps++;
  if (target?.state === 'attacking' || target?.attackData?.progress > 0) old.attacks++;
  m.opponentPatterns.set(targetKey, old);
  m.lastX = bot.x || 0; m.lastY = bot.y || 0;
  m.observations++;
  m.planAge++;

  const predictedTarget = target ? predictPosition(target, Math.round(8 + 28 * skill.predict)) : null;
  const health = Number(bot.health ?? 100 - (bot.damage || 0));
  const targetHealth = target ? Number(target.health ?? 100 - (target.damage || 0)) : 100;
  const danger = target ? clamp((targetHealth - health) / 100 + ((target?.damage || 0) - (bot.damage || 0)) / 250, -1, 1) : 0;

  return {
    skill,
    self: bot,
    target,
    opponents,
    teammates,
    predictedTarget,
    danger,
    targetDistance: target ? dist(bot, target) : Infinity,
    winning: world.winning === true,
    losing: world.losing === true,
    objectiveUrgency: clamp(Number(world.objectiveUrgency || 0), 0, 1),
    memory: m,
  };
}

export function chooseBestTarget(bot, candidates = [], world = {}, difficulty = 'regular') {
  const skill = botSkill(difficulty);
  let best = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    if (!c || c === bot || c._eliminated || c.stocks === 0) continue;
    let score = 0;
    const d = dist(bot, c);
    score += clamp(500 - d, -300, 500) * 0.25;
    score += (c.damage || 0) * 0.9;
    if (world.objectiveTarget && c === world.objectiveTarget) score += 180;
    if (world.carrier && c === world.carrier) score += 300;
    if (world.threat && c === world.threat) score += 220;
    if (c.grounded === false && (c.x < 100 || c.x > 840)) score += 120 * skill.think;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best;
}

export function honoredFightTactics(fighter, opponent, platforms = [], difficulty = 'honored', world = {}) {
  if (difficulty !== 'honored' && difficulty !== 'insane') return null;
  if (!fighter || !opponent) return null;
  const info = observeBot(fighter, { ...world, target: opponent, opponents: world.opponents || [opponent] }, difficulty);
  const { predictedTarget, skill } = info;
  const dx = opponent.x - fighter.x;
  const dy = opponent.y - fighter.y;
  const d = Math.abs(dx);
  const input = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

  // Preserve recovery and stage safety above all else.
  const edge = fighter.x < 95 || fighter.x > 865;
  const falling = !fighter.grounded && fighter.y > 410;
  if (falling || edge && !fighter.grounded) {
    input.left = fighter.x > 480;
    input.right = fighter.x <= 480;
    if (fighter.grounded) input.jump = true;
    if (fighter.recoveryCooldown <= 0 && fighter.recoveryAirUses < 1) { input.sig = true; input.up = true; }
    return input;
  }

  // Read an attack before it lands instead of waiting for hitstun.
  if (opponent.state === 'attacking' || opponent.state === 'superAttack') {
    const p = predictPosition(opponent, Math.round(6 + 12 * skill.predict));
    const close = p && Math.abs(p.x - fighter.x) < 105 && Math.abs(p.y - fighter.y) < 95;
    if (close && fighter.invincible <= 0) {
      input.left = dx > 0;
      input.right = dx < 0;
      if (fighter.grounded) input.jump = true;
      else input.down = true;
      return input;
    }
  }

  // Predict where the opponent will be when the next attack becomes active.
  const tx = predictedTarget?.x ?? opponent.x;
  const leadDx = tx - fighter.x;
  if (d > 170) {
    input.left = leadDx < -20;
    input.right = leadDx > 20;
    if (Math.abs(dy) > 55) input.jump = fighter.grounded && dy < -35;
    if (fighter.powerCooldown <= 0 && Math.abs(leadDx) < 330 && Math.abs(dy) < 150 && skill.think > 0.9) {
      input.power = true;
      input.left = leadDx < 0;
      input.right = leadDx > 0;
    }
    return input;
  }

  // Punish recovery / hitstun with deliberate attacks.
  if (opponent.hitstun > 3 && d < 220) {
    input.left = dx > 0; input.right = dx < 0;
    if (fighter.superMeter >= fighter.maxSuper && d < 250 && Math.abs(dy) < 120) input.superMove = true;
    else if (fighter.heavyCooldown <= 0 && Math.abs(dy) < 60) input.heavy = true;
    else if (fighter.sigCooldown <= 0) input.sig = true;
    return input;
  }

  // Finish vulnerable targets and otherwise prefer safe pressure.
  input.left = dx > 0; input.right = dx < 0;
  if (fighter.superMeter >= fighter.maxSuper && d < 250 && Math.abs(dy) < 120 && (opponent.damage || 0) > 35) input.superMove = true;
  else if (fighter.powerCooldown <= 0 && fighter.powerDisabled <= 0 && d < 310 && Math.abs(dy) < 140) input.power = true;
  else if (fighter.heavyCooldown <= 0 && d < 150 && Math.abs(dy) < 55) input.heavy = true;
  else if (fighter.sigCooldown <= 0 && d < 135) input.sig = true;
  else if (fighter.grounded && Math.abs(dy) > 55) input.jump = true;
  return input;
}

export function universalDodgeballDecision(p, opp, state, side, difficulty = 'regular') {
  const skill = botSkill(difficulty);
  const input = { left: false, right: false, up: false, down: false, sig: false, superMove: false, power: false };
  const balls = state?.balls || [];
  const incoming = balls.find(b => b.heldBy == null && b.lastThrower && b.lastThrower !== side && Math.abs(b.x - p.x) < 340 && ((side === 1 && b.vx < 0) || (side === 2 && b.vx > 0)));
  if (incoming) {
    const lead = predictPosition(incoming, Math.round(8 + skill.predict * 18));
    const y = lead?.y ?? incoming.y;
    if (Math.abs(y - (p.y - 35)) < 55) {
      input[side === 1 ? 'left' : 'right'] = true;
      if (p.onGround) input.up = true; else input.down = true;
      return input;
    }
  }
  return null;
}

export function universalBangerDecision(s, side, difficulty = 'regular', helpers = {}) {
  if (!s?.ball) return null;
  const skill = botSkill(difficulty);
  if (difficulty !== 'honored' && difficulty !== 'insane') return null;
  const angle = typeof helpers.curAngle === 'function' ? helpers.curAngle(s) : 0;
  const input = { strike: false, banger: false };
  if (s.phase === 'aim' && s.aimSide === side) {
    const window = 0.10 + skill.execution * 0.10;
    if (Math.abs(angle - Math.PI / 3) < window || Math.abs(angle - Math.PI / 6) < window) input.strike = true;
  }
  if (s.phase === 'flight' && s.ball.bangerWindow > 0 && s.ball.bangerBy === side) input.banger = true;
  return input.strike || input.banger ? input : null;
}

export function botWorldSummary(bot, world = {}, difficulty = 'regular') {
  const info = observeBot(bot, world, difficulty);
  return {
    difficulty,
    skill: info.skill,
    target: info.target,
    predictedTarget: info.predictedTarget,
    targetDistance: info.targetDistance,
    winning: info.winning,
    losing: info.losing,
    objectiveUrgency: info.objectiveUrgency,
  };
}
