// ═══════════════════════════════════════════════════════════════════
// SOCCER AI — Prediction-based 1v1 bot intelligence
// Tracks ball trajectory, opponent state, and field position to make
// deliberate decisions: defend, intercept, position, attack, or clear.
// Higher difficulties are SMARTER (better prediction, shot selection,
// positioning) — never faster or unfair.
// ═══════════════════════════════════════════════════════════════════

import { CPU_DIFFICULTY } from './fighter.js';

// ── Field constants (must match SoccerFighter.jsx) ──
const W = 1280;
const GROUND_Y = 620;
const WALL_TOP = 80;
const WALL_GAP_TOP = 480;
const WALL_INNER_L = 40;
const WALL_INNER_R = 1240;
const GOAL_LINE_L = 20;
const GOAL_LINE_R = 1260;
const GOAL_TOP = WALL_GAP_TOP;
const GOAL_BOT = GROUND_Y;
const BALL_R = 12;
const GRAVITY = 0.35;
const AIR_DRAG_X = 0.992;
const AIR_DRAG_Y = 0.996;
const GROUND_BOUNCE = 0.6;
const GROUND_FRICTION = 0.85;
const WALL_BOUNCE = 0.6;
const CEILING_BOUNCE = 0.3;

// ── Difficulty intelligence parameters ──
// Higher = smarter, NOT faster. Controls prediction depth, shot accuracy,
// reaction speed, defensive awareness, side-switch IQ, and anticipation.
const DIFF_PARAMS = {
  newcomer:  { predDepth: 15, shotAcc: 0.25, react: 12, defAware: 0.2, sideIQ: 0.15, anticip: 0.1,  riskEval: 0.2, oppRead: 0.15 },
  beginner:  { predDepth: 25, shotAcc: 0.35, react: 10, defAware: 0.3, sideIQ: 0.25, anticip: 0.15, riskEval: 0.3, oppRead: 0.25 },
  easy:      { predDepth: 35, shotAcc: 0.45, react: 8,  defAware: 0.4, sideIQ: 0.35, anticip: 0.2,  riskEval: 0.4, oppRead: 0.35 },
  amateur:   { predDepth: 45, shotAcc: 0.55, react: 7,  defAware: 0.5, sideIQ: 0.45, anticip: 0.3,  riskEval: 0.5, oppRead: 0.45 },
  regular:   { predDepth: 60, shotAcc: 0.65, react: 6,  defAware: 0.6, sideIQ: 0.55, anticip: 0.4,  riskEval: 0.6, oppRead: 0.55 },
  pro:       { predDepth: 80, shotAcc: 0.75, react: 5,  defAware: 0.7, sideIQ: 0.7,  anticip: 0.55, riskEval: 0.7, oppRead: 0.7  },
  hard:      { predDepth: 100,shotAcc: 0.82, react: 4,  defAware: 0.8, sideIQ: 0.8,  anticip: 0.7,  riskEval: 0.8, oppRead: 0.8  },
  insane:    { predDepth: 120,shotAcc: 0.90, react: 3,  defAware: 0.9, sideIQ: 0.9,  anticip: 0.85, riskEval: 0.9, oppRead: 0.9  },
  honored:   { predDepth: 150,shotAcc: 0.95, react: 2,  defAware: 0.95,sideIQ: 0.95, anticip: 0.95, riskEval: 0.95,oppRead: 0.95 },
};

const PERSONALITY = {
  evasive:    { jumpMul: 1.5, attackMul: 0.6, defendMul: 1.3, aggroMul: 0.5 },
  defensive:  { jumpMul: 1.0, attackMul: 0.8, defendMul: 1.2, aggroMul: 0.75 },
  balanced:   { jumpMul: 1.0, attackMul: 1.0, defendMul: 1.0, aggroMul: 1.0 },
  aggressive: { jumpMul: 0.7, attackMul: 1.3, defendMul: 0.8, aggroMul: 1.5 },
};

// ═══════════════════════════════════════════════════════════════════
// BALL TRAJECTORY PREDICTION
// Simulates ball physics forward to find where it will be.
// ═══════════════════════════════════════════════════════════════════

function simulateBall(x, y, vx, vy, frames) {
  let px = x, py = y, pvx = vx, pvy = vy;
  for (let i = 0; i < frames; i++) {
    pvy += GRAVITY;
    if (pvy > 15) pvy = 15;
    pvx *= AIR_DRAG_X; pvy *= AIR_DRAG_Y;
    px += pvx; py += pvy;
    // Ground bounce
    if (py + BALL_R >= GROUND_Y) {
      py = GROUND_Y - BALL_R;
      pvy = -pvy * GROUND_BOUNCE;
      pvx *= GROUND_FRICTION;
      if (Math.abs(pvy) < 1.5) pvy = 0; // settle
    }
    // Wall bounce (only above gap)
    if (py - BALL_R < WALL_GAP_TOP && py + BALL_R > WALL_TOP) {
      if (px - BALL_R < WALL_INNER_L && px > 0) { px = WALL_INNER_L + BALL_R; pvx = Math.abs(pvx) * WALL_BOUNCE; }
      if (px + BALL_R > WALL_INNER_R && px < W) { px = WALL_INNER_R - BALL_R; pvx = -Math.abs(pvx) * WALL_BOUNCE; }
    }
    // Ceiling
    if (py < WALL_TOP) { py = WALL_TOP; pvy = Math.abs(pvy) * CEILING_BOUNCE; }
    if (Math.abs(pvx) < 0.3 && Math.abs(pvy) < 0.3 && py + BALL_R >= GROUND_Y - 1) break; // ball at rest
  }
  return { x: px, y: py, vx: pvx, vy: pvy };
}

// Predict where the ball will land (reach ground or settle)
function predictLanding(ball) {
  if (Math.hypot(ball.vx, ball.vy) < 2) return { x: ball.x, y: ball.y, frames: 0 };
  let px = ball.x, py = ball.y, pvx = ball.vx, pvy = ball.vy;
  for (let i = 0; i < 200; i++) {
    pvy += GRAVITY; if (pvy > 15) pvy = 15;
    pvx *= AIR_DRAG_X; pvy *= AIR_DRAG_Y;
    px += pvx; py += pvy;
    if (py + BALL_R >= GROUND_Y) {
      return { x: px, y: GROUND_Y - BALL_R, frames: i, vx: pvx, vy: -pvy * GROUND_BOUNCE };
    }
    if (py - BALL_R < WALL_GAP_TOP && py + BALL_R > WALL_TOP) {
      if (px - BALL_R < WALL_INNER_L) return { x: WALL_INNER_L + BALL_R, y: py, frames: i };
      if (px + BALL_R > WALL_INNER_R) return { x: WALL_INNER_R - BALL_R, y: py, frames: i };
    }
    if (py < WALL_TOP) { py = WALL_TOP; pvy = Math.abs(pvy) * CEILING_BOUNCE; }
  }
  return { x: px, y: py, frames: 200 };
}

// Predict ball position at a specific future frame
function predictBallAt(ball, frames) {
  return simulateBall(ball.x, ball.y, ball.vx, ball.vy, frames);
}

// Time (in frames) for ball to reach a given X position
function timeToReachX(ball, targetX) {
  if (Math.abs(ball.vx) < 0.5) return Infinity;
  const dx = targetX - ball.x;
  const t = dx / ball.vx;
  return t > 0 ? t : Infinity;
}

// ═══════════════════════════════════════════════════════════════════
// BALL STATE ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function analyzeBall(ball) {
  const speed = Math.hypot(ball.vx, ball.vy);
  const airborne = ball.y < GROUND_Y - BALL_R - 2;
  const onGround = ball.y >= GROUND_Y - BALL_R - 2;
  return {
    x: ball.x, y: ball.y,
    vx: ball.vx, vy: ball.vy,
    speed,
    airborne,
    onGround,
    rising: ball.vy < -1,
    falling: ball.vy > 1,
    rolling: onGround && Math.abs(ball.vy) < 2 && Math.abs(ball.vx) > 0.5,
    bouncing: onGround && ball.vy < -1,
    movingHorizontal: Math.abs(ball.vx) > 2 && Math.abs(ball.vy) < 1.5,
    high: ball.y < 200,
    nearCeiling: ball.y < WALL_TOP + 40,
    // Predictions
    predictAt: (frames) => predictBallAt(ball, frames),
    landing: predictLanding(ball),
    // Direction relative to goals
    headingRight: ball.vx > 1,
    headingLeft: ball.vx < -1,
    movingTowardX: (targetX) => (targetX > ball.x ? ball.vx > 0.5 : ball.vx < -0.5),
  };
}

// ═══════════════════════════════════════════════════════════════════
// OPPONENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function analyzeOpponent(opp, ball, attackGoalX, defendGoalX) {
  if (!opp) return null;
  const distToBall = Math.hypot(opp.x - ball.x, opp.y - ball.y);
  const movingToBall = (ball.x > opp.x ? opp.vx > 0.5 : opp.vx < -0.5);
  const movingToMyGoal = defendGoalX < 640 ? opp.vx < -0.5 : opp.vx > 0.5;
  // Can opponent reach the ball? Rough estimate: distance vs ball speed
  const ballTimeToOpp = distToBall / Math.max(Math.hypot(ball.vx, ball.vy), 1);
  const oppReachTime = Math.abs(opp.x - ball.x) / 5; // rough movement speed
  const canReachBall = oppReachTime < ballTimeToOpp + 10;
  // Is opponent between ball and attack goal?
  const betweenBallAndGoal = (attackGoalX > ball.x && opp.x > ball.x && opp.x < attackGoalX) ||
    (attackGoalX < ball.x && opp.x < ball.x && opp.x > attackGoalX);
  // Is opponent blocking the shot path?
  const blockingShot = betweenBallAndGoal && Math.abs(opp.x - ball.x) < 100;
  // Is opponent out of position (far from ball and not defending)?
  const distToOwnGoal = Math.abs(opp.x - defendGoalX);
  const outOfPosition = distToBall > 200 && distToOwnGoal > 200;
  // Is opponent behind or in front of ball (relative to attack goal)?
  const oppBehindBall = attackGoalX > ball.x ? opp.x < ball.x : opp.x > ball.x;
  const oppInFrontOfBall = !oppBehindBall;
  // Is opponent vulnerable to a particular shot?
  const oppGrounded = opp.grounded;
  const oppNearGoal = (defendGoalX < 640 ? opp.x < 280 : opp.x > 1000);
  const vulnerableToHigh = oppGrounded && oppNearGoal; // can't reach high ball
  const vulnerableToLow = !oppGrounded && opp.vy < -2; // airborne, can't block low
  const vulnerableToDriven = !oppGrounded && opp.vy > 0; // falling, limited interception

  return {
    x: opp.x, y: opp.y, vx: opp.vx, vy: opp.vy,
    grounded: oppGrounded,
    airborne: !oppGrounded,
    rising: opp.vy < -1,
    falling: opp.vy > 1,
    facing: opp.facing,
    distToBall,
    movingToBall,
    movingToMyGoal: movingToMyGoal,
    canReachBall,
    betweenBallAndGoal,
    blockingShot,
    outOfPosition,
    behindBall: oppBehindBall,
    inFrontOfBall: oppInFrontOfBall,
    nearGoal: oppNearGoal,
    vulnerableToHigh,
    vulnerableToLow,
    vulnerableToDriven,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SELF ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function analyzeSelf(fighter, ball, attackGoalX, defendGoalX) {
  const distToBall = Math.hypot(fighter.x - ball.x, fighter.y - ball.y);
  const onLeftSide = fighter.x < 640;
  // Which side of the ball am I on?
  const ballSide = fighter.x < ball.x ? 'left' : 'right';
  // Which side do I need to be on to shoot toward attack goal?
  const needSide = attackGoalX > ball.x ? 'left' : 'right';
  const mustSwitch = ballSide !== needSide;
  // Distance to goals
  const distToOwnGoal = Math.abs(fighter.x - defendGoalX);
  const distToAttackGoal = Math.abs(fighter.x - attackGoalX);
  // Is my goal exposed? (too far from own goal, ball could counter)
  const goalExposed = distToOwnGoal > 400 && ball.vx * (defendGoalX < 640 ? -1 : 1) > 2;
  // Can I reach the ball?
  const canReachBall = distToBall < 60;
  // Am I in kicking range?
  const inKickRange = distToBall < 55 && distToBall > 10;

  return {
    x: fighter.x, y: fighter.y, vx: fighter.vx, vy: fighter.vy,
    grounded: fighter.grounded,
    distToBall,
    canReachBall,
    inKickRange,
    ballSide,
    needSide,
    mustSwitch,
    onLeftSide,
    distToOwnGoal,
    distToAttackGoal,
    goalExposed,
    attackGoalX,
    defendGoalX,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SHOT EVALUATION — evaluate all shot types and pick the best
// ═══════════════════════════════════════════════════════════════════

// Simulate a shot and check if it would score (pass through goal gap)
function simulateShot(ball, vx, vy, attackGoalX) {
  let px = ball.x, py = ball.y, pvx = vx, pvy = vy;
  for (let i = 0; i < 120; i++) {
    pvy += GRAVITY; if (pvy > 15) pvy = 15;
    pvx *= AIR_DRAG_X; pvy *= AIR_DRAG_Y;
    px += pvx; py += pvy;
    // Ground bounce
    if (py + BALL_R >= GROUND_Y) { py = GROUND_Y - BALL_R; pvy = -pvy * GROUND_BOUNCE; pvx *= GROUND_FRICTION; if (Math.abs(pvy) < 1.5) pvy = 0; }
    // Wall above gap
    if (py - BALL_R < WALL_GAP_TOP && py + BALL_R > WALL_TOP) {
      if (px - BALL_R < WALL_INNER_L && px > 0) { px = WALL_INNER_L + BALL_R; pvx = Math.abs(pvx) * WALL_BOUNCE; }
      if (px + BALL_R > WALL_INNER_R && px < W) { px = WALL_INNER_R - BALL_R; pvx = -Math.abs(pvx) * WALL_BOUNCE; }
    }
    // Ceiling
    if (py < WALL_TOP) { py = WALL_TOP; pvy = Math.abs(pvy) * CEILING_BOUNCE; }
    // Goal check
    if (py > GOAL_TOP && py < GOAL_BOT) {
      if (attackGoalX > W / 2 && px >= GOAL_LINE_R) return { scores: true, frames: i, y: py };
      if (attackGoalX < W / 2 && px <= GOAL_LINE_L) return { scores: true, frames: i, y: py };
    }
    if (Math.abs(pvx) < 0.3 && Math.abs(pvy) < 0.3) break;
  }
  return { scores: false, frames: 120 };
}

// Check if opponent can intercept a shot at a given trajectory
function canOpponentIntercept(opp, ball, vx, vy, attackGoalX, diff) {
  if (!opp) return false;
  let px = ball.x, py = ball.y, pvx = vx, pvy = vy;
  for (let i = 0; i < 60; i++) {
    pvy += GRAVITY; if (pvy > 15) pvy = 15;
    pvx *= AIR_DRAG_X; pvy *= AIR_DRAG_Y;
    px += pvx; py += pvy;
    if (py + BALL_R >= GROUND_Y) { py = GROUND_Y - BALL_R; pvy = -pvy * GROUND_BOUNCE; pvx *= GROUND_FRICTION; }
    // Can opponent reach this position?
    const oppReachTime = i; // frames ahead
    const oppDistX = Math.abs(opp.x - px);
    const oppMoveSpeed = 5 * (1 + diff.oppRead * 0.2); // higher diff = better read
    if (oppDistX < oppMoveSpeed * oppReachTime && Math.abs(opp.y - py) < 80) {
      return true;
    }
    // Ball passed opponent's x position toward goal
    if (attackGoalX > opp.x && px > opp.x + 30) return false; // ball past opponent
    if (attackGoalX < opp.x && px < opp.x - 30) return false;
  }
  return false;
}

// Evaluate all shot types and return the best one with its score
function evaluateShots(fighter, ball, opp, selfState, ballState, diff, params) {
  const facing = fighter.facing;
  const statPowerMul = fighter.statPowerMul || 1;
  const ballDamage = ball.damage || 1;
  const attackGoalX = selfState.attackGoalX;
  const canPower = fighter.powerCooldown <= 0;
  const hasSuper = fighter.superMeter >= fighter.maxSuper;

  // Estimate normal kick power (from SoccerFighter kick code)
  // basePower = attackData.damage * 0.4 * statPowerMul, power = basePower * ballDamage * attackMul
  // Typical attackData.damage ≈ 16, attackMul ≈ 1 → power ≈ 6.4 * statPowerMul * ballDamage
  const normalPower = 6.4 * statPowerMul * ballDamage;
  const powerShotVx = 24 * statPowerMul;
  const chipVx = 10;

  const shots = [];

  // ── Normal shot (high) — sig, no down ──
  {
    const vx = facing * normalPower + fighter.vx * 0.5;
    const vy = -Math.abs(normalPower) * 1.0 - 5;
    const sim = simulateShot(ball, vx, vy, attackGoalX);
    const intercept = canOpponentIntercept(opp, ball, vx, vy, attackGoalX, params);
    let score = 0;
    if (sim.scores) score += 100;
    if (!intercept) score += 30;
    if (opp?.vulnerableToHigh) score += 20;
    score *= params.shotAcc;
    shots.push({ type: 'normal_high', sig: true, down: false, power: false, superMove: false, score, sim, intercept });
  }

  // ── Normal shot (low/driven) — sig + down ──
  {
    const vx = facing * normalPower + fighter.vx * 0.5;
    const vy = Math.abs(normalPower) * 0.4 + 3;
    const sim = simulateShot(ball, vx, vy, attackGoalX);
    const intercept = canOpponentIntercept(opp, ball, vx, vy, attackGoalX, params);
    let score = 0;
    if (sim.scores) score += 100;
    if (!intercept) score += 30;
    if (opp?.vulnerableToLow) score += 25;
    if (opp?.vulnerableToDriven) score += 20;
    score *= params.shotAcc;
    shots.push({ type: 'normal_low', sig: true, down: true, power: false, superMove: false, score, sim, intercept });
  }

  // ── Power shot (high) — power, no down ──
  if (canPower) {
    const vx = facing * powerShotVx + fighter.vx * 0.3;
    const vy = -14;
    const sim = simulateShot(ball, vx, vy, attackGoalX);
    const intercept = canOpponentIntercept(opp, ball, vx, vy, attackGoalX, params);
    let score = 0;
    if (sim.scores) score += 120;
    if (!intercept) score += 40;
    if (opp?.vulnerableToHigh) score += 15;
    score *= params.shotAcc * 0.9; // power shots slightly less accurate
    shots.push({ type: 'power_high', sig: false, down: false, power: true, superMove: false, score, sim, intercept });
  }

  // ── Power shot (low/driven) — power + down ──
  if (canPower) {
    const vx = facing * powerShotVx + fighter.vx * 0.3;
    const vy = 6;
    const sim = simulateShot(ball, vx, vy, attackGoalX);
    const intercept = canOpponentIntercept(opp, ball, vx, vy, attackGoalX, params);
    let score = 0;
    if (sim.scores) score += 120;
    if (!intercept) score += 40;
    if (opp?.vulnerableToLow) score += 30;
    if (opp?.vulnerableToDriven) score += 25;
    score *= params.shotAcc * 0.9;
    shots.push({ type: 'power_low', sig: false, down: true, power: true, superMove: false, score, sim, intercept });
  }

  // ── Chip shot (super) — high arc over opponent ──
  if (hasSuper) {
    const vx = facing * chipVx + fighter.vx * 0.2;
    const vy = -16;
    const sim = simulateShot(ball, vx, vy, attackGoalX);
    const intercept = canOpponentIntercept(opp, ball, vx, vy, attackGoalX, params);
    let score = 0;
    if (sim.scores) score += 110;
    if (!intercept) score += 50; // chips are hard to intercept
    if (opp?.blockingShot) score += 30; // great for chipping over a blocker
    if (opp?.grounded) score += 20; // grounded opp can't reach high chip
    score *= params.shotAcc * 0.85;
    shots.push({ type: 'chip', sig: false, down: false, power: false, superMove: true, score, sim, intercept });
  }

  // ── Defensive clear — kick toward own goal to reset ──
  // Own goals are impossible; ball bounces off back wall to safety
  {
    const clearDir = selfState.defendGoalX < 640 ? -1 : 1;
    const vx = clearDir * Math.abs(normalPower) * 0.8;
    const vy = -Math.abs(normalPower) * 0.5 - 3;
    let score = 0;
    // High value when ball is near own goal and under pressure
    if (selfState.distToOwnGoal < 200) score += 60;
    if (ballState.headingRight && selfState.defendGoalX < 640) score += 30;
    if (ballState.headingLeft && selfState.defendGoalX > 640) score += 30;
    if (opp?.distToBall < 80 && selfState.distToOwnGoal < 300) score += 40;
    score *= params.defAware;
    shots.push({ type: 'defensive_clear', sig: true, down: false, power: false, superMove: false, score, defensive: true, clearDir });
  }

  // ── Emergency clear — power kick away from own goal ──
  if (canPower) {
    const clearDir = selfState.defendGoalX < 640 ? 1 : -1; // kick toward attack goal
    const vx = clearDir * powerShotVx;
    const vy = -10;
    let score = 0;
    if (selfState.distToOwnGoal < 150) score += 80;
    if (ballState.speed > 5 && selfState.distToOwnGoal < 250) score += 40;
    score *= params.defAware;
    shots.push({ type: 'emergency_clear', sig: false, down: false, power: true, superMove: false, score, defensive: true, clearDir });
  }

  // Sort by score, return best
  shots.sort((a, b) => b.score - a.score);
  return shots[0] || shots[0];
}

// ═══════════════════════════════════════════════════════════════════
// SIDE-SWITCHING LOGIC — intelligent ball-side positioning
// ═══════════════════════════════════════════════════════════════════

function shouldJumpOverBall(fighter, ball, selfState, ballState, params) {
  if (!selfState.mustSwitch) return false;
  if (!fighter.grounded) return false; // already airborne
  // Don't jump if ball is too high (would miss)
  if (ball.y < fighter.y - 80) return false;
  // Don't jump if ball is moving fast toward us (would collide mid-air)
  const ballApproaching = (ball.x > fighter.x ? ball.vx < -3 : ball.vx > 3);
  if (ballApproaching && ballState.speed > 5) return false;
  // Jump over if ball is close and we need to switch sides
  const horizontalDist = Math.abs(fighter.x - ball.x);
  if (horizontalDist > 80) return false; // too far to jump over
  // Higher difficulty bots recognize when jumping over is better
  return Math.random() < params.sideIQ;
}

// ═══════════════════════════════════════════════════════════════════
// DEFENSE — predict opponent's shot and intercept
// ═══════════════════════════════════════════════════════════════════

// Predict where opponent's shot would go if they kicked now
function predictOpponentShot(opp, ball, defendGoalX) {
  if (!opp) return null;
  const facing = opp.facing;
  const statPowerMul = opp.statPowerMul || 1;
  const ballDamage = ball.damage || 1;
  const normalPower = 6.4 * statPowerMul * ballDamage;
  // Simulate a normal shot from opponent
  const vx = facing * normalPower + opp.vx * 0.5;
  const vy = -Math.abs(normalPower) * 1.0 - 5;
  let px = ball.x, py = ball.y, pvx = vx, pvy = vy;
  for (let i = 0; i < 120; i++) {
    pvy += GRAVITY; if (pvy > 15) pvy = 15;
    pvx *= AIR_DRAG_X; pvy *= AIR_DRAG_Y;
    px += pvx; py += pvy;
    if (py + BALL_R >= GROUND_Y) { py = GROUND_Y - BALL_R; pvy = -pvy * GROUND_BOUNCE; pvx *= GROUND_FRICTION; }
    if (py - BALL_R < WALL_GAP_TOP && py + BALL_R > WALL_TOP) {
      if (px - BALL_R < WALL_INNER_L) { px = WALL_INNER_L + BALL_R; pvx = Math.abs(pvx) * WALL_BOUNCE; }
      if (px + BALL_R > WALL_INNER_R) { px = WALL_INNER_R - BALL_R; pvx = -Math.abs(pvx) * WALL_BOUNCE; }
    }
    if (py < WALL_TOP) { py = WALL_TOP; pvy = Math.abs(pvy) * CEILING_BOUNCE; }
    // Does this shot reach our goal?
    if (py > GOAL_TOP && py < GOAL_BOT) {
      if (defendGoalX < 640 && px <= GOAL_LINE_L) return { x: px, y: py, frames: i, scores: true };
      if (defendGoalX > 640 && px >= GOAL_LINE_R) return { x: px, y: py, frames: i, scores: true };
    }
    if (Math.abs(pvx) < 0.3 && Math.abs(pvy) < 0.3) break;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN AI FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function soccerAI(fighter, ball, opponent, difficultyKey = 'regular', personality = 'balanced', gameCtx = {}) {
  const diff = CPU_DIFFICULTY[difficultyKey] || CPU_DIFFICULTY.regular;
  const params = DIFF_PARAMS[difficultyKey] || DIFF_PARAMS.regular;
  const pm = PERSONALITY[fighter._aiPersonality || personality] || PERSONALITY.balanced;

  // ── Situational awareness — score and time affect aggression ──
  const myScore = fighter.team === 1 ? (gameCtx.p1Score || 0) : (gameCtx.p2Score || 0);
  const oppScore = fighter.team === 1 ? (gameCtx.p2Score || 0) : (gameCtx.p1Score || 0);
  const lateGame = gameCtx.timer !== undefined && gameCtx.timer < 30 && !gameCtx.suddenDeath;
  const losing = myScore < oppScore, tied = myScore === oppScore, winning = myScore > oppScore;
  const mustScore = losing || tied || lateGame;
  const situationalAggro = mustScore ? 1.4 : winning ? 0.75 : 1.0;

  // ── Reaction timer — higher difficulties update more often ──
  fighter.aiTimer--;
  const alwaysUpdate = difficultyKey === 'honored' || difficultyKey === 'insane';
  if (fighter.aiTimer > 0 && !alwaysUpdate) return fighter.aiAction || {};
  fighter.aiTimer = Math.max(params.react, Math.floor(diff.reactionTime * 0.15 + Math.random() * diff.reactionTime * 0.1));

  // ── Analyze everything ──
  const ballState = analyzeBall(ball);
  const oppState = analyzeOpponent(opponent, ball, fighter.x < 640 ? GOAL_LINE_R : GOAL_LINE_L, fighter.x < 640 ? GOAL_LINE_L : GOAL_LINE_R);
  const selfState = analyzeSelf(fighter, ball, fighter.x < 640 ? GOAL_LINE_R : GOAL_LINE_L, fighter.x < 640 ? GOAL_LINE_L : GOAL_LINE_R);

  const inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
  const skill = Math.random() < Math.min(1, diff.skillChance * pm.aggroMul * situationalAggro);

  // ── Stuck detection ──
  if (!fighter._soccerStuck) fighter._soccerStuck = { x: fighter.x, t: 0 };
  if (Math.abs(fighter.x - fighter._soccerStuck.x) < 8) fighter._soccerStuck.t++;
  else { fighter._soccerStuck.t = 0; fighter._soccerStuck.x = fighter.x; }
  const stuck = fighter._soccerStuck.t > 90;

  // ═══════════════════════════════════════════════════════════════
  // DECISION PRIORITY TREE — evaluate the FULL situation before acting
  // ═══════════════════════════════════════════════════════════════

  // ── 1. EMERGENCY DEFENSE: Ball fast toward own goal → intercept NOW ──
  const ballHeadingToOwnGoal = (selfState.defendGoalX < 640 && ballState.headingLeft) || (selfState.defendGoalX > 640 && ballState.headingRight);
  const ballSpeed = ballState.speed;

  if (ballHeadingToOwnGoal && ballSpeed > 3 && skill) {
    const timeToGoal = Math.abs((selfState.defendGoalX - ball.x) / Math.max(Math.abs(ball.vx), 0.5));
    // Predict ball position at goal
    const ballAtGoal = ballState.predictAt(Math.min(Math.floor(timeToGoal), params.predDepth));
    const ballYAtGoal = ballAtGoal.y;
    // Intercept position — between ball and goal
    const interceptX = selfState.defendGoalX < 640
      ? Math.max(ballAtGoal.x - 20, 50)
      : Math.min(ballAtGoal.x + 20, 1230);
    // Move to intercept
    if (fighter.x < interceptX - 8) inputs.right = true;
    else if (fighter.x > interceptX + 8) inputs.left = true;
    // Jump for high shots, stay grounded for low shots
    if (ballYAtGoal < 420 && fighter.grounded) inputs.jump = true;
    else if (ballYAtGoal < 520 && fighter.grounded) { inputs.jump = true; if (!fighter.grounded) inputs.down = true; }
    else if (!fighter.grounded && ballYAtGoal > 520) inputs.down = true;
    // Kick ball away if close
    if (selfState.distToBall < 55) {
      // Emergency clear — kick toward attack goal or away from own goal
      const clearDir = selfState.defendGoalX < 640 ? 1 : -1;
      if (fighter.powerCooldown <= 0 && params.defAware > 0.5) {
        inputs.power = true;
        if (clearDir > 0) inputs.right = true; else inputs.left = true;
      } else {
        inputs.sig = true;
        if (clearDir > 0) inputs.right = true; else inputs.left = true;
      }
    }
    fighter.aiAction = inputs; return inputs;
  }

  // ── 2. PREDICT OPPONENT SHOT: If opponent is about to kick, intercept ──
  if (oppState && oppState.canReachBall && oppState.distToBall < 60 && skill && params.defAware > 0.5) {
    const predictedShot = predictOpponentShot(opponent, ball, selfState.defendGoalX);
    if (predictedShot && predictedShot.scores) {
      // Move to predicted shot intercept position
      const interceptX = predictedShot.x;
      const interceptY = predictedShot.y;
      if (fighter.x < interceptX - 10) inputs.right = true;
      else if (fighter.x > interceptX + 10) inputs.left = true;
      // Jump to block high shots
      if (interceptY < 450 && fighter.grounded) inputs.jump = true;
      // If close to ball, kick it away (interception kick)
      if (selfState.distToBall < 55) {
        const clearDir = selfState.defendGoalX < 640 ? 1 : -1;
        inputs.sig = true;
        if (clearDir > 0) inputs.right = true; else inputs.left = true;
      }
      fighter.aiAction = inputs; return inputs;
    }
  }

  // ── 3. DEFENSIVE POSITION: Ball near own goal, hold position & clear ──
  const ballNearOwnGoal = (selfState.defendGoalX < 200 && ball.x < 240) || (selfState.defendGoalX > 1080 && ball.x > 1040);
  const oppCloserToBall = oppState && oppState.distToBall < selfState.distToBall - 20;
  const isDefending = ballHeadingToOwnGoal || (ballNearOwnGoal && (oppCloserToBall || ballSpeed < 3));

  if (ballNearOwnGoal && skill) {
    // Position between ball and own goal
    const defendX = selfState.defendGoalX < 640
      ? Math.max(ball.x - 30, 55)
      : Math.min(ball.x + 30, 1225);
    if (fighter.x < defendX - 8) inputs.right = true;
    else if (fighter.x > defendX + 8) inputs.left = true;
    // Clear the ball when close
    if (selfState.distToBall < 55) {
      const clearDir = selfState.defendGoalX < 640 ? 1 : -1;
      // Use defensive clear or emergency clear based on pressure
      if (oppCloserToBall && fighter.powerCooldown <= 0 && params.defAware > 0.6) {
        inputs.power = true; // emergency clear
      } else {
        inputs.sig = true; // defensive clear
      }
      if (clearDir > 0) inputs.right = true; else inputs.left = true;
    }
    // Jump for high balls near goal
    if (ball.y < fighter.y - 40 && fighter.grounded) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 4. DEFENSIVE REBOUND: Under pressure near own goal, kick toward own wall ──
  // Own goals are impossible — ball bounces off back wall. Kicking backward
  // repositions the ball to a safer area.
  if (isDefending && ballNearOwnGoal && oppCloserToBall && skill && params.defAware > 0.5) {
    const reboundDir = selfState.defendGoalX < 640 ? -1 : 1;
    if (selfState.distToBall < 60) {
      inputs.sig = true; inputs.down = true; // driven shot — stays low, rebounds fast
      if (reboundDir > 0) inputs.right = true; else inputs.left = true;
      fighter.aiAction = inputs; return inputs;
    }
    // Get behind the ball to kick toward the wall
    const behindBallX = selfState.defendGoalX < 640 ? ball.x + 35 : ball.x - 35;
    if (fighter.x < behindBallX - 8) inputs.right = true;
    else if (fighter.x > behindBallX + 8) inputs.left = true;
    if (ball.y < fighter.y - 40 && fighter.grounded) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 5. CHIP BLOCK: Ball arcing high toward goal → double-jump to intercept ──
  const ballChippingToGoal = (selfState.defendGoalX < 640 && ballState.headingLeft && ball.vy < -5) ||
    (selfState.defendGoalX > 640 && ballState.headingRight && ball.vy < -5);
  if (ballChippingToGoal && skill && params.defAware > 0.6 && fighter.jumps > 0) {
    const interceptX = selfState.defendGoalX < 640
      ? Math.max(ball.x + ball.vx * 8, 60)
      : Math.min(ball.x + ball.vx * 8, 1220);
    if (fighter.x < interceptX - 8) inputs.right = true;
    else if (fighter.x > interceptX + 8) inputs.left = true;
    inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 6. INTERCEPTION: Can't reach ball first → go to predicted landing ──
  const ballMovingAway = (ballState.headingRight && fighter.x > ball.x) || (ballState.headingLeft && fighter.x < ball.x);
  const cantReachFirst = (oppCloserToBall && oppState.distToBall < selfState.distToBall - 15) || (ballMovingAway && ballSpeed > 4);
  if (cantReachFirst && !ballHeadingToOwnGoal && !ballNearOwnGoal && skill && params.anticip > 0.3) {
    const landing = ballState.landing;
    // Position behind the landing spot for shooting toward attack goal
    const wantLeftOfLanding = selfState.attackGoalX > landing.x;
    const interceptTargetX = wantLeftOfLanding ? landing.x - 40 : landing.x + 40;
    if (fighter.x < interceptTargetX - 10) inputs.right = true;
    else if (fighter.x > interceptTargetX + 10) inputs.left = true;
    if (landing.y < fighter.y - 80 && fighter.grounded) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 7. RICOCHET: Ball behind us near own wall → hit it off the wall ──
  const ballBehindNearWall = (selfState.onLeftSide && ball.x < fighter.x - 5 && ball.x < 420) ||
    (!selfState.onLeftSide && ball.x > fighter.x + 5 && ball.x > 860);
  if (ballBehindNearWall && skill) {
    if (selfState.onLeftSide) inputs.left = true; else inputs.right = true;
    if (selfState.distToBall < 55) inputs.sig = true;
    if (ball.y < fighter.y - 40 && fighter.grounded) inputs.jump = true;
    if (fighter.powerCooldown <= 0 && selfState.distToBall < 130) inputs.power = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 8. STUCK DETECTION: Replan if stuck ──
  if (stuck) {
    fighter._soccerStuck.t = 0; fighter._soccerStuck.x = fighter.x;
    if (fighter.x < 200) inputs.right = true;
    else if (fighter.x > 1080) inputs.left = true;
    else { inputs.left = fighter.x > ball.x; inputs.right = fighter.x < ball.x; }
    if (fighter.grounded) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 9. SIDE-SWITCHING: Need to get to the other side of the ball ──
  if (selfState.mustSwitch && selfState.distToBall < 80 && skill) {
    // Jump over the ball if appropriate
    if (shouldJumpOverBall(fighter, ball, selfState, ballState, params)) {
      inputs.jump = true;
      // Lean slightly toward the side we want to land on
      if (selfState.needSide === 'left') inputs.left = true;
      else inputs.right = true;
      fighter.aiAction = inputs; return inputs;
    }
    // Otherwise walk around the ball
    if (selfState.needSide === 'left') inputs.left = true;
    else inputs.right = true;
    // Jump if ball is high enough to walk under
    const oppBelowBall = oppState && oppState.grounded && Math.abs(oppState.x - ball.x) < 60;
    if (ball.y < fighter.y - 30 && !(oppBelowBall && skill)) inputs.jump = true;
    fighter.aiAction = inputs; return inputs;
  }

  // ── 10. OFFENSE: In position to shoot → evaluate shots and pick best ──
  const hasBallOnCorrectSide = (selfState.needSide === 'left' && fighter.x < ball.x - 5) ||
    (selfState.needSide === 'right' && fighter.x > ball.x + 5);

  if (hasBallOnCorrectSide && selfState.inKickRange && skill) {
    // Face the ball (toward attack goal)
    if (selfState.needSide === 'left') inputs.right = true;
    else inputs.left = true;

    // Evaluate all shots and pick the best
    const bestShot = evaluateShots(fighter, ball, opponent, selfState, ballState, diff, params);
    if (bestShot && bestShot.score > 10) {
      if (bestShot.sig) inputs.sig = true;
      if (bestShot.down) inputs.down = true;
      if (bestShot.power) inputs.power = true;
      if (bestShot.superMove) inputs.superMove = true;
      // Face toward attack goal for the shot
      if (selfState.needSide === 'left') inputs.right = true;
      else inputs.left = true;
    } else {
      // No good shot — default driven normal
      inputs.sig = true;
      if (skill && (mustScore ? Math.random() < 0.5 : Math.random() < 0.7)) inputs.down = true;
    }
    fighter.aiAction = inputs; return inputs;
  }

  // ── 11. POSITIONING: Get behind the ball for the next play ──
  const wantLeftOfBall = selfState.attackGoalX > ball.x;
  const targetX = wantLeftOfBall ? ball.x - 40 : ball.x + 40;

  if (!hasBallOnCorrectSide) {
    // Need to get to the correct side
    if (wantLeftOfBall) inputs.left = true; else inputs.right = true;
    const oppBelowBall = oppState && oppState.grounded && Math.abs(oppState.x - ball.x) < 60;
    if (ball.y < fighter.y - 30 && !(oppBelowBall && skill)) inputs.jump = true;
  } else {
    // On correct side but not in range — chase the ball
    if (fighter.x < targetX - 10) inputs.right = true;
    else if (fighter.x > targetX + 10) inputs.left = true;
    if (mustScore && selfState.distToBall > 60) {
      if (ball.x > fighter.x) inputs.right = true; else inputs.left = true;
    }
  }

  // ── 12. 1V1 RISK ASSESSMENT: Don't overcommit if goal is exposed ──
  if (selfState.goalExposed && params.riskEval > 0.4) {
    // If goal is exposed and ball is far from attack goal, fall back slightly
    if (selfState.distToAttackGoal > 400 && selfState.distToOwnGoal > 350) {
      const fallbackX = selfState.defendGoalX < 640
        ? Math.max(fighter.x - 3, selfState.defendGoalX + 200)
        : Math.min(fighter.x + 3, selfState.defendGoalX - 200);
      if (fighter.x > fallbackX + 10 && selfState.defendGoalX < 640) inputs.left = true;
      else if (fighter.x < fallbackX - 10 && selfState.defendGoalX > 640) inputs.right = true;
    }
  }

  // ── Jump for airborne ball ──
  const dy = ball.y - fighter.y;
  if (dy < -50 && fighter.grounded && Math.random() < diff.jumpChance + 0.2) {
    const oppBelowBall = oppState && oppState.grounded && Math.abs(oppState.x - ball.x) < 60;
    if (!(oppBelowBall && skill)) inputs.jump = true;
  }

  // ── Kick ball when close (fallback) ──
  if (selfState.distToBall < 55 && skill && !inputs.sig) inputs.sig = true;

  // ── Strategic power usage ──
  if (fighter.powerCooldown <= 0 && !inputs.power) {
    const powerChance = (difficultyKey === 'honored' || difficultyKey === 'insane' ? 0.35
      : difficultyKey === 'hard' ? 0.25 : difficultyKey === 'pro' ? 0.18 : difficultyKey === 'regular' ? 0.12 : 0.08) * situationalAggro;
    const ballOnAttackSide = selfState.onLeftSide ? ball.x > fighter.x : ball.x < fighter.x;
    if ((ballOnAttackSide || ballNearOwnGoal || mustScore) && Math.random() < powerChance) inputs.power = true;
  }

  // ── Wall avoidance ──
  if (fighter.x < WALL_INNER_L + 30) { inputs.left = false; inputs.right = true; }
  if (fighter.x > WALL_INNER_R - 30) { inputs.right = false; inputs.left = true; }

  // ── Hazard avoidance ──
  if (fighter.platformMaterial && ['lava', 'quicksand', 'spike', 'acid', 'tar', 'snow', 'water'].includes(fighter.platformMaterial)) inputs.jump = true;

  fighter.aiAction = inputs;
  return inputs;
}

// ── Penalty shootout AI (kept simple, same as before) ──
export function penaltyKeeperAI(fighter, ball, targetGoal, difficultyKey) {
  const diff = CPU_DIFFICULTY[difficultyKey] || CPU_DIFFICULTY.regular;
  const inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
  const ballApproaching = (targetGoal === 'right' && ball.vx > 2) || (targetGoal === 'left' && ball.vx < -2);
  const distToBall = Math.abs(ball.x - fighter.x);
  if (ballApproaching && distToBall < 130 && Math.random() < diff.skillChance * 0.7) inputs.jump = true;
  if (!fighter.grounded && ball.y > fighter.y - 20 && Math.random() < 0.3) inputs.down = true;
  return inputs;
}

export function penaltyShooterAI(fighter, ball, targetGoal, difficultyKey) {
  const diff = CPU_DIFFICULTY[difficultyKey] || CPU_DIFFICULTY.regular;
  const inputs = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };
  fighter._penAIDelay = (fighter._penAIDelay ?? (20 + Math.random() * 25)) - 1;
  if (fighter._penAIDelay <= 0) {
    inputs.sig = true;
    if (Math.random() < diff.skillChance * 0.5 + 0.15) inputs.down = true;
  }
  return inputs;
}