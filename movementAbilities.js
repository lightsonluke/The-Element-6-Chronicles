
 // Universal movement abilities shared by every fight-mode simulation.
//
// Rules:
// - Double-tap a directional button within 12 frames (~0.20s) to dash.
// - Grounded: only left/right dashes are allowed and they are NOT invulnerable.
// - Airborne: all four directions become a 0.30s dodge with invulnerability.
// - Airborne dodges consume one dodge use.
// - Solid walls at least half a fighter tall can be wall-slid while moving into them.
// - Leaving a wall restores two jumps, up to three times before landing.
// - Touching a wall alone does not restore jumps.
// - Landing resets the wall departure counter and restores normal jumps.
// - Sports modes are excluded; the existing identifier is "soccer".

export const MOVEMENT_ABILITY_CONFIG = Object.freeze({
  doubleTapWindow: 12,
  dashCooldown: 30,
  groundDashFrames: 13,
  airDodgeFrames: 15,
  groundDashSpeed: 9.5,
  airDodgeSpeed: 7.0,
  wallSlideMaxFallSpeed: 1,
  wallSlideAcceleration: 0.15,
  wallMinHeight: 10,
  maxWallJumpResets: 3,
  jumpsPerWallDeparture: 2,
});

const DIRECTIONS = ['left', 'right', 'up', 'down'];

function isSportsMode(fighter) {
  return fighter?.gameMode === 'soccer';
}

function ensureTapState(fighter) {
  if (!fighter._movementTapState) {
    fighter._movementTapState = {
      left: -9999,
      right: -9999,
      up: -9999,
      down: -9999,
      leftHeld: false,
      rightHeld: false,
      upHeld: false,
      downHeld: false,
    };
  }

  return fighter._movementTapState;
}

function startDash(fighter, x, y) {
  if (fighter.dashCooldown > 0 || fighter.dashTimer > 0) {
    return false;
  }

  const airborne = !fighter.grounded;

  if (!airborne && (x === 0 || y !== 0)) {
    return false;
  }

  if (airborne && fighter.airDodgeUses <= 0) {
    return false;
  }

  fighter.dashCooldown = MOVEMENT_ABILITY_CONFIG.dashCooldown;

  fighter.dashTimer = airborne
    ? MOVEMENT_ABILITY_CONFIG.airDodgeFrames
    : MOVEMENT_ABILITY_CONFIG.groundDashFrames;

  fighter.dashDirection = { x, y };

  // Preserve wallContactActive so leaving a wall during a dash
  // can still be detected and processed.
  fighter.wallSlide = false;

  fighter.vx =
    x *
    (airborne
      ? MOVEMENT_ABILITY_CONFIG.airDodgeSpeed
      : MOVEMENT_ABILITY_CONFIG.groundDashSpeed);

  fighter.vy =
    y *
    (airborne
      ? MOVEMENT_ABILITY_CONFIG.airDodgeSpeed
      : 0);

  if (x) {
    fighter.facing = x;
  }

  if (airborne) {
    fighter.airDodgeUses--;

    fighter.invincible = Math.max(
      fighter.invincible || 0,
      MOVEMENT_ABILITY_CONFIG.airDodgeFrames
    );

    fighter.state = 'jumping';
  } else {
    fighter.state = 'moving';
  }

  return true;
}

function tryDirectionalDoubleTap(fighter, inputs) {
  const taps = ensureTapState(fighter);
  const frame = fighter.frame || 0;

  for (const key of DIRECTIONS) {
    const heldKey = `${key}Held`;
    const pressed = !!inputs[key];
    const edge = pressed && !taps[heldKey];

    if (edge) {
      const previousTap = taps[key];

      if (
        frame - previousTap <=
        MOVEMENT_ABILITY_CONFIG.doubleTapWindow
      ) {
        let dx = 0;
        let dy = 0;

        if (key === 'left') dx = -1;
        else if (key === 'right') dx = 1;
        else if (key === 'up') dy = -1;
        else if (key === 'down') dy = 1;

        if (fighter.grounded) {
          if (dx !== 0) {
            startDash(fighter, dx, 0);
          }
        } else {
          startDash(fighter, dx, dy);
        }
      }

      taps[key] = frame;
    }

    taps[heldKey] = pressed;
  }
}

function getWallContact(platforms, fighter) {
  const halfW = 16;
  const fighterTop = fighter.y - 55;
  const fighterBottom = fighter.y;
  const tolerance = 4;

  let left = false;
  let right = false;

  for (const p of platforms || []) {
    const mat = p.material || 'normal';

    if (
      [
        'water',
        'lava',
        'cloud',
        'acid',
        'tar',
        'antigravity',
      ].includes(mat)
    ) {
      continue;
    }

    if (
      p._deleted > 0 ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      !Number.isFinite(p.w) ||
      !Number.isFinite(p.h) ||
      p.w <= 0 ||
      p.h <= 0 ||
      p.h < MOVEMENT_ABILITY_CONFIG.wallMinHeight
    ) {
      continue;
    }

    const verticallyOverlaps =
      fighterBottom > p.y + tolerance &&
      fighterTop < p.y + p.h - tolerance;

    if (!verticallyOverlaps) {
      continue;
    }

    const leftEdge = p.x - halfW;
    const rightEdge = p.x + p.w + halfW;

    if (Math.abs(fighter.x - leftEdge) <= tolerance) {
      left = true;
    }

    if (Math.abs(fighter.x - rightEdge) <= tolerance) {
      right = true;
    }

    if (left && right) {
      break;
    }
  }

  return left ? -1 : right ? 1 : 0;
}

export function updateMovementAbilities(fighter, inputs, platforms) {
  if (isSportsMode(fighter)) {
    return;
  }

  // Landing resets the wall departure chain and restores jumps.
  if (fighter.grounded) {
    fighter.airDodgeUses = fighter.maxJumps;
    fighter.jumpsUsed = 0;
    fighter.wallGrantsUsed = 0;
    fighter.wallSlide = false;
    fighter.wallContactActive = false;
    fighter.wallGrantPending = false;
  }

  const locked =
    fighter.hitstun > 0 ||
    fighter.landingLag > 0 ||
    fighter.state === 'attacking' ||
    fighter.state === 'superAttack' ||
    fighter.trapped;

  if (!locked) {
    tryDirectionalDoubleTap(fighter, inputs);
  }

  if (fighter.dashTimer > 0) {
    fighter.wallSlide = false;
    return;
  }

  // Use actual contact only. Falling back to the previous wallSide would
  // keep the fighter in wall-slide state after moving away, preventing the
  // wall-departure jump reset from triggering.
  const detectedWallSide = getWallContact(platforms, fighter);
  const side = detectedWallSide;

  const touchingWall =
    !fighter.grounded &&
    !fighter.gravityInverted &&
    side !== 0;

  if (touchingWall) {
    // Mark the start of wall contact only once.
    if (!fighter.wallContactActive) {
      fighter.wallContactActive = true;
    }

    fighter.wallSide = side;
    fighter.wallSlide = true;
    fighter.vx = 0;

    fighter.vy = Math.min(
      fighter.vy + MOVEMENT_ABILITY_CONFIG.wallSlideAcceleration,
      MOVEMENT_ABILITY_CONFIG.wallSlideMaxFallSpeed
    );

    fighter.state = 'jumping';
  } else {
    fighter.wallSlide = false;
  }
}

// Call after resolveCollisions(), so grounded and wallSide reflect
// the current frame.
export function onMovementAbilityLanded(fighter) {
  if (isSportsMode(fighter)) {
    return;
  }

  // A normal landing fully resets the wall-jump chain.
  if (fighter.grounded) {
    fighter.airDodgeUses = fighter.maxJumps;
    fighter.jumpsUsed = 0;
    fighter.wallSlide = false;
    fighter.wallContactActive = false;
    fighter.wallGrantPending = false;
    fighter.wallGrantsUsed = 0;
    return;
  }

  const stillOnWall = fighter.wallSlide && fighter.wallSide;

  if (stillOnWall) {
    fighter.wallContactActive = true;
    return;
  }

  // We have left a wall. Grant two jumps up to three times.
  if (fighter.wallContactActive) {
    const resetsUsed = fighter.wallGrantsUsed || 0;

    if (
      resetsUsed <
      MOVEMENT_ABILITY_CONFIG.maxWallJumpResets
    ) {
      fighter.wallGrantsUsed = resetsUsed + 1;

      // Two jumps remain regardless of the previous jump count.
      fighter.jumpsUsed = Math.max(
        0,
        fighter.maxJumps - MOVEMENT_ABILITY_CONFIG.jumpsPerWallDeparture
      );

      fighter.airDodgeUses =
        MOVEMENT_ABILITY_CONFIG.jumpsPerWallDeparture;
    }

    // Consume the wall departure event exactly once.
    fighter.wallContactActive = false;
  }

  fighter.wallGrantPending = false;
}

export function resetMovementAbilityState(fighter) {
  fighter.dashCooldown = 0;
  fighter.dashTimer = 0;
  fighter.dashDirection = { x: 0, y: 0 };

  fighter.jumpsUsed = 0;
  fighter.airDodgeUses = fighter.maxJumps || 3;

  fighter.wallSlide = false;
  fighter.wallSide = 0;
  fighter.wallContactActive = false;
  fighter.wallGrantsUsed = 0;
  fighter.wallGrantPending = false;

  fighter._movementTapState = {
    left: -9999,
    right: -9999,
    up: -9999,
    down: -9999,
    leftHeld: false,
    rightHeld: false,
    upHeld: false,
    downHeld: false,
  };
}
