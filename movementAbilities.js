// Universal movement abilities shared by every fight-mode simulation.
//
// Rules:
// - Double-tap a directional button within 12 frames (~0.20s) to dash.
// - Grounded: only left/right dashes are allowed; they are NOT invulnerable.
// - Airborne: all four directions become a 0.30s dodge with invulnerability.
// - An airborne dodge consumes one dodge use.
// - Dodge uses track the remaining jump count.
// - Wall contact slows falling only while actually touching a wall.
// - Wall contact requires BOTH horizontal and vertical overlap.
// - Leaving a wall while airborne restores jumps, up to 3 times per airtime.
// - Landing resets the wall-departure counter.
// - Sports mode is excluded.

export const MOVEMENT_ABILITY_CONFIG = {
  doubleTapFrames: 12,
  dashCooldown: 12,
  groundDashDuration: 8,
  airDodgeDuration: 18, // 0.30 seconds at 60 FPS
  dashSpeed: 9.5,
  maxWallJumpResets: 3,
  wallSlideSpeed: 2,
  wallContactTolerance: 3,
};

function isSportsMode(fighter) {
  return (
    fighter?.gameMode === "soccer" ||
    fighter?.gameMode === "sports" ||
    fighter?.gameMode === "football"
  );
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

  if (!fighter.dashDirection) {
    fighter.dashDirection = { x: 0, y: 0 };
  }

  if (typeof fighter.dashCooldown !== "number") {
    fighter.dashCooldown = 0;
  }

  if (typeof fighter.dashTimer !== "number") {
    fighter.dashTimer = 0;
  }

  if (typeof fighter.dashInvulnerable !== "boolean") {
    fighter.dashInvulnerable = false;
  }

  if (typeof fighter.airDodgeUses !== "number") {
    fighter.airDodgeUses = fighter.jumps ?? fighter.maxJumps ?? 2;
  }

  if (typeof fighter.wallSlide !== "boolean") {
    fighter.wallSlide = false;
  }

  if (typeof fighter.wallSide !== "number") {
    fighter.wallSide = 0;
  }

  if (typeof fighter.wallContactActive !== "boolean") {
    fighter.wallContactActive = false;
  }

  if (typeof fighter.wallGrantsUsed !== "number") {
    fighter.wallGrantsUsed = 0;
  }

  if (typeof fighter.wallGrantPending !== "boolean") {
    fighter.wallGrantPending = false;
  }
}

function startDash(fighter, dx, dy, airborne) {
  const config = MOVEMENT_ABILITY_CONFIG;

  fighter.dashCooldown = config.dashCooldown;
  fighter.dashTimer = airborne
    ? config.airDodgeDuration
    : config.groundDashDuration;

  fighter.dashDirection = { x: dx, y: dy };
  fighter.dashInvulnerable = !!airborne;

  if (dx !== 0) {
    fighter.facing = dx;
  }

  if (airborne) {
    fighter.airDodgeUses = Math.max(
      0,
      (fighter.airDodgeUses ?? fighter.maxJumps ?? 2) - 1
    );
  }

  fighter.wallSlide = false;
}

function tryDirectionalDoubleTap(fighter, inputs) {
  const config = MOVEMENT_ABILITY_CONFIG;
  const state = fighter._movementTapState;
  const frame = fighter.frame ?? 0;

  const directions = [
    { name: "left", pressed: !!inputs.left, dx: -1, dy: 0 },
    { name: "right", pressed: !!inputs.right, dx: 1, dy: 0 },
    { name: "up", pressed: !!inputs.up, dx: 0, dy: -1 },
    { name: "down", pressed: !!inputs.down, dx: 0, dy: 1 },
  ];

  for (const direction of directions) {
    const heldKey = `${direction.name}Held`;
    const wasHeld = state[heldKey];

    // Process fresh presses only, not every frame a button is held.
    if (direction.pressed && !wasHeld) {
      const previousTap = state[direction.name];
      const framesSinceTap = frame - previousTap;

      state[direction.name] = frame;

      if (framesSinceTap <= config.doubleTapFrames) {
        const airborne = !fighter.grounded;

        // Ground dashes can only travel horizontally.
        if (!airborne && direction.dy !== 0) {
          state[heldKey] = direction.pressed;
          continue;
        }

        if (fighter.dashCooldown > 0) {
          state[heldKey] = direction.pressed;
          continue;
        }

        // Air dodges require an available use.
        if (airborne && fighter.airDodgeUses <= 0) {
          state[heldKey] = direction.pressed;
          continue;
        }

        startDash(
          fighter,
          direction.dx,
          direction.dy,
          airborne
        );

        // Consume this double-tap sequence.
        state[direction.name] = -9999;
        state[heldKey] = direction.pressed;
        break;
      }
    }

    state[heldKey] = direction.pressed;
  }
}

/**
 * Returns the side of a wall only when the character is actually
 * touching its horizontal boundary AND overlapping it vertically.
 *
 * Assumptions:
 * - fighter.x is the horizontal center of the character.
 * - fighter.y is the character's bottom position.
 * - Character collision dimensions are approximately 32 x 55.
 */
function getWallContact(fighter, platforms, stageWidth) {
  const config = MOVEMENT_ABILITY_CONFIG;

  const charHalfW = 16;
  const charHeight = 55;
  const tolerance = config.wallContactTolerance;

  const fighterLeft = fighter.x - charHalfW;
  const fighterRight = fighter.x + charHalfW;
  const fighterTop = fighter.y - charHeight;
  const fighterBottom = fighter.y;

  let contactSide = 0;

  for (const platform of platforms || []) {
    if (!platform) continue;
    if (platform._freehandSlope) continue;
    if (platform._deleted > 0) continue;

    const material = platform.material || "normal";

    // These materials do not provide solid wall contact.
    if (
      material === "water" ||
      material === "lava" ||
      material === "cloud" ||
      material === "acid" ||
      material === "tar" ||
      material === "antigravity"
    ) {
      continue;
    }

    // One-way platforms do not provide wall contact.
    if (!platform._forceSolid && platform.h <= 20) {
      continue;
    }

    const platformLeft = platform.x;
    const platformRight = platform.x + platform.w;
    const platformTop = platform.y;
    const platformBottom =
      platform._collisionBottom ?? platform.y + platform.h;

    // Require genuine vertical overlap.
    const verticalOverlap =
      fighterBottom > platformTop &&
      fighterTop < platformBottom;

    if (!verticalOverlap) continue;

    // Horizontal distance from the character to each platform side.
    const distanceToLeft = Math.abs(
      fighterRight - platformLeft
    );

    const distanceToRight = Math.abs(
      fighterLeft - platformRight
    );

    // Character is beside the platform's left edge.
    const touchingLeft =
      distanceToLeft <= tolerance &&
      fighterRight <= platformLeft + tolerance;

    // Character is beside the platform's right edge.
    const touchingRight =
      distanceToRight <= tolerance &&
      fighterLeft >= platformRight - tolerance;

    if (touchingLeft) {
      contactSide = -1;
      break;
    }

    if (touchingRight) {
      contactSide = 1;
      break;
    }
  }

  // Stage boundaries can also provide wall contact.
  if (!contactSide && typeof stageWidth === "number") {
    if (fighterLeft <= tolerance) {
      contactSide = -1;
    } else if (fighterRight >= stageWidth - tolerance) {
      contactSide = 1;
    }
  }

  // Use the collision system's wall side only as a fallback.
  // Do not let it override verified platform contact when geometry
  // has already identified a different contact side.
  if (!contactSide && fighter.wallSide) {
    contactSide = Math.sign(fighter.wallSide);
  }

  return contactSide;
}

function resetAirJumpsFromWall(fighter) {
  const maximumResets =
    MOVEMENT_ABILITY_CONFIG.maxWallJumpResets;

  if (fighter.grounded) return false;

  if (fighter.wallGrantsUsed >= maximumResets) {
    return false;
  }

  // Restore normal jumps when leaving a wall.
  fighter.jumps = fighter.maxJumps;

  // Restore air-dodge uses along with jumps.
  fighter.airDodgeUses = fighter.maxJumps;

  fighter.wallGrantsUsed++;
  fighter.wallGrantPending = false;

  return true;
}

export function updateMovementAbilities(
  fighter,
  inputs,
  platforms,
  stageWidth,
  stageHeight
) {
  if (!fighter || !inputs) return;

  ensureTapState(fighter);

  // Sports mode does not use these movement abilities.
  if (isSportsMode(fighter)) {
    fighter.wallSlide = false;
    fighter.dashInvulnerable = false;
    fighter.wallContactActive = false;
    fighter.wallGrantPending = false;
    return;
  }

  // Decrease dash cooldown.
  if (fighter.dashCooldown > 0) {
    fighter.dashCooldown--;
  }

  // Decrease dash timer and remove invulnerability when it expires.
  if (fighter.dashTimer > 0) {
    fighter.dashTimer--;

    if (fighter.dashTimer <= 0) {
      fighter.dashTimer = 0;
      fighter.dashInvulnerable = false;
      fighter.dashDirection = { x: 0, y: 0 };
    }
  } else {
    fighter.dashInvulnerable = false;
  }

  // Landing resets wall-departure resets and restores air-dodge uses.
  if (fighter.grounded) {
    fighter.wallGrantsUsed = 0;
    fighter.wallGrantPending = false;
    fighter.wallContactActive = false;
    fighter.wallSlide = false;
    fighter.airDodgeUses = fighter.maxJumps;
  }

  // Detect real wall contact using both horizontal and vertical ranges.
  const wallSide = getWallContact(
    fighter,
    platforms,
    stageWidth
  );

  const touchingWall =
    !fighter.grounded &&
    wallSide !== 0;

  const wasTouchingWall = fighter.wallContactActive;

  fighter.wallSide = touchingWall ? wallSide : 0;

  // Wall slide only slows downward velocity during confirmed contact.
  // Gravity continues normally whenever the character is not touching
  // a wall, and upward movement is never slowed by this section.
  if (
    touchingWall &&
    fighter.vy > 0 &&
    fighter.dashTimer <= 0
  ) {
    fighter.wallSlide = true;

    fighter.vy = Math.min(
      fighter.vy,
      MOVEMENT_ABILITY_CONFIG.wallSlideSpeed
    );
  } else {
    fighter.wallSlide = false;
  }

  // Leaving a wall while airborne restores jumps, at most three times
  // before landing. Touching the wall again does not reset this counter.
  if (
    wasTouchingWall &&
    !touchingWall &&
    !fighter.grounded
  ) {
    resetAirJumpsFromWall(fighter);
  }

  fighter.wallContactActive = touchingWall;

  // Process double-tap dash / air-dodge inputs.
  tryDirectionalDoubleTap(fighter, inputs);

  // Keep invulnerability active only during an airborne dodge.
  if (fighter.dashTimer <= 0) {
    fighter.dashInvulnerable = false;
  }
}

export function onMovementAbilityLanded(fighter, inputs) {
  if (!fighter) return;

  ensureTapState(fighter);

  if (!fighter.grounded) return;

  // Reset wall-departure counters on landing.
  fighter.wallGrantsUsed = 0;
  fighter.wallGrantPending = false;
  fighter.wallContactActive = false;
  fighter.wallSlide = false;

  // Restore normal jump and air-dodge counts.
  fighter.jumps = fighter.maxJumps;
  fighter.airDodgeUses = fighter.maxJumps;

  // End airborne invulnerability on landing.
  fighter.dashInvulnerable = false;

  // Do not cancel a currently active dash timer here.
  // updateMovementAbilities() manages the timer.
}

export function resetMovementAbilityState(fighter) {
  if (!fighter) return;

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

  fighter.dashCooldown = 0;
  fighter.dashTimer = 0;
  fighter.dashDirection = { x: 0, y: 0 };
  fighter.dashInvulnerable = false;

  fighter.airDodgeUses = fighter.maxJumps ?? 2;

  fighter.wallSlide = false;
  fighter.wallSide = 0;
  fighter.wallContactActive = false;
  fighter.wallGrantsUsed = 0;
  fighter.wallGrantPending = false;
}
