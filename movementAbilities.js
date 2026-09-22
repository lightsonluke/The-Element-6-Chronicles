// Universal movement abilities shared by every fight-mode simulation.
//
// Rules:
// - Double-tap a directional button within 12 frames (~0.20s) to dash.
// - Grounded: only left/right dashes are allowed and they are NOT invulnerable.
// - Airborne: all four directions become a 0.30s dodge with invulnerability.
// - An airborne dodge consumes one dodge use. Dodge uses track remaining jumps.
// - Solid walls at least half a fighter tall can be wall-slid while moving into them.
// - Leaving a wall after a slide restores one jump + one dodge, up to two wall grants
//   per airtime. Landing resets the normal jump/dodge pool.
//
// Sports modes are intentionally excluded here. The existing game uses "soccer" as
// its sports-mode identifier; other fight modes continue to share updateFighter().

export const MOVEMENT_ABILITY_CONFIG = Object.freeze({
  doubleTapWindow: 12,       // 0.20s at 60fps
  dashCooldown: 30,          // 1.0s at 60fps
  groundDashFrames: 13,       // very short grounded burst
  airDodgeFrames: 15,        // 0.30s
  groundDashSpeed: 9.5,
  airDodgeSpeed: 7.0,
  wallSlideMaxFallSpeed: 1,
  wallSlideAcceleration: 0.15,
  wallMinHeight: 18,          // > half of the ~55px fighter body
  wallContactTolerance: 5,    // collision/rendering can leave a few px of separation
  wallVerticalPadding: 2,
  wallDustInterval: 3,
  wallDustCount: 2,
  maxWallGrants: 2,
});

const DIRECTIONS = ['left', 'right', 'up', 'down'];

function isSportsMode(fighter) {
  return fighter?.gameMode === 'soccer';
}

function ensureTapState(fighter) {
  if (!fighter._movementTapState) {
    fighter._movementTapState = {
      left: -9999, right: -9999, up: -9999, down: -9999,
      leftHeld: false, rightHeld: false, upHeld: false, downHeld: false,
    };
  }
  return fighter._movementTapState;
}

function startDash(fighter, x, y) {
  if (fighter.dashCooldown > 0 || fighter.dashTimer > 0) return false;

  const airborne = !fighter.grounded;
  if (!airborne && (x === 0 || y !== 0)) return false;

  // Air dodge uses are deliberately tied to remaining jumps.
  // Example: after the first jump, 1 jump + 1 dodge remain; after the second, 0 + 0.
  if (airborne && fighter.airDodgeUses <= 0) return false;

  fighter.dashCooldown = MOVEMENT_ABILITY_CONFIG.dashCooldown;
  fighter.dashTimer = airborne
    ? MOVEMENT_ABILITY_CONFIG.airDodgeFrames
    : MOVEMENT_ABILITY_CONFIG.groundDashFrames;

  fighter.dashDirection = { x, y };
  fighter.wallSlide = false;
  fighter.wallContactActive = false;
  fighter.vx = x * (airborne ? MOVEMENT_ABILITY_CONFIG.airDodgeSpeed : MOVEMENT_ABILITY_CONFIG.groundDashSpeed);
  fighter.vy = y * (airborne ? MOVEMENT_ABILITY_CONFIG.airDodgeSpeed : 0);

  if (x) fighter.facing = x;

  if (airborne) {
    fighter.airDodgeUses--;
    // This is the actual attack immunity window. checkHit() already honors fighter.invincible.
    fighter.invincible = Math.max(fighter.invincible || 0, MOVEMENT_ABILITY_CONFIG.airDodgeFrames);
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
      if (frame - previousTap <= MOVEMENT_ABILITY_CONFIG.doubleTapWindow) {
        let dx = 0;
        let dy = 0;
        if (key === 'left') dx = -1;
        else if (key === 'right') dx = 1;
        else if (key === 'up') dy = -1;
        else if (key === 'down') dy = 1;

        if (fighter.grounded) {
          if (dx !== 0) startDash(fighter, dx, 0);
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
  const fighterHeight = 55;
  const fighterTop = fighter.y - fighterHeight;
  const fighterBottom = fighter.y;
  const tolerance = MOVEMENT_ABILITY_CONFIG.wallContactTolerance;
  const verticalPadding = MOVEMENT_ABILITY_CONFIG.wallVerticalPadding;

  let best = null;

  for (const p of platforms || []) {
    if (!p) continue;
    const mat = p.material || 'normal';
    if (['water', 'lava', 'cloud', 'acid', 'tar', 'antigravity'].includes(mat)) continue;
    if (p._deleted > 0 || p.h < MOVEMENT_ABILITY_CONFIG.wallMinHeight) continue;
    if (!(p.w > 0 && p.h > 0)) continue;

    // The fighter body must overlap the vertical span of the solid wall.
    const verticallyOverlaps =
      fighterBottom > p.y + verticalPadding &&
      fighterTop < p.y + p.h - verticalPadding;
    if (!verticallyOverlaps) continue;

    const leftEdge = p.x - halfW;
    const rightEdge = p.x + p.w + halfW;
    const leftGap = Math.abs(fighter.x - leftEdge);
    const rightGap = Math.abs(fighter.x - rightEdge);

    // The collision solver places the fighter's center exactly half a body-width
    // outside a wall. Use a small tolerance so the wall still registers when
    // floating-point movement/collision order leaves a tiny gap.
    if (leftGap <= tolerance && (!best || leftGap < best.distance)) {
      best = { side: -1, distance: leftGap, platform: p };
    }
    if (rightGap <= tolerance && (!best || rightGap < best.distance)) {
      best = { side: 1, distance: rightGap, platform: p };
    }
  }

  return best;
}

function spawnWallDust(fighter, contact) {
  if (!contact) return;
  if ((fighter._wallDustCooldown || 0) > 0) {
    fighter._wallDustCooldown--;
    return;
  }

  fighter._wallDustCooldown = MOVEMENT_ABILITY_CONFIG.wallDustInterval;

  // The normal renderer already draws doubleJumpParticles. Reuse that established
  // particle channel so wall dust is visible everywhere the fighter is rendered,
  // without touching camera/rendering code.
  fighter.doubleJumpParticles = fighter.doubleJumpParticles || [];

  const count = MOVEMENT_ABILITY_CONFIG.wallDustCount;
  const wallX = contact.side < 0
    ? fighter.x - 15
    : fighter.x + 15;

  for (let i = 0; i < count; i++) {
    fighter.doubleJumpParticles.push({
      x: wallX + (Math.random() - 0.5) * 3,
      y: fighter.y - 12 - Math.random() * 28,
      vx: contact.side * (0.15 + Math.random() * 0.45),
      vy: -0.15 - Math.random() * 0.7,
      life: 10 + Math.floor(Math.random() * 7),
      maxLife: 17,
      color: '#FFFFFF',
      isGroundPuff: true,
      isWallDust: true,
    });
  }

  // Keep the particle list bounded even during a long wall slide.
  if (fighter.doubleJumpParticles.length > 90) {
    fighter.doubleJumpParticles.splice(0, fighter.doubleJumpParticles.length - 90);
  }
}

export function updateMovementAbilities(fighter, inputs, platforms) {
  if (isSportsMode(fighter)) return;

  // A normal landing always restores the standard jump/dodge pool.
  if (fighter.grounded) {
    fighter.airDodgeUses = fighter.maxJumps;
    fighter.wallGrantsUsed = 0;
    fighter.wallSlide = false;
    fighter.wallContactActive = false;
    fighter.wallGrantPending = false;
  }

  // Do not let directional double-taps fire while an attack, hitstun, or landing lag
  // has control locked. Input edges are still recorded so the next real tap is clean.
  const locked =
    fighter.hitstun > 0 ||
    fighter.landingLag > 0 ||
    fighter.state === 'attacking' ||
    fighter.state === 'superAttack' ||
    fighter.trapped;

  if (!locked) tryDirectionalDoubleTap(fighter, inputs);

  // While a dodge is active, it takes priority over ordinary movement.
  if (fighter.dashTimer > 0) {
    fighter.wallSlide = false;
    return;
  }

  // Wall slide only happens when the player is airborne and is actually pressing
  // toward a real solid wall. Do not rely exclusively on fighter.wallSide: the
  // collision resolver can clear that value at the beginning of its next pass,
  // and that used to make wall contact intermittently disappear.
  const detectedWall = getWallContact(platforms, fighter);
  const side = detectedWall?.side || fighter.wallSide || 0;
  const intoWall =
    (side < 0 && !!inputs.left) ||
    (side > 0 && !!inputs.right);

  const touchingWall =
    !fighter.grounded &&
    !fighter.gravityInverted &&
    side !== 0 &&
    intoWall &&
    !!detectedWall;

  if (touchingWall) {
    fighter.wallSide = side;
    fighter.wallSlide = true;
    fighter.wallContactActive = true;
    fighter.wallGrantPending = true;
    fighter.vx = 0;

    // Clamp downward speed rather than replacing it. This gives a stable,
    // controllable slide instead of a sticky/teleporting wall state.
    fighter.vy = Math.min(
      fighter.vy + MOVEMENT_ABILITY_CONFIG.wallSlideAcceleration,
      MOVEMENT_ABILITY_CONFIG.wallSlideMaxFallSpeed
    );
    fighter.state = 'jumping';
    spawnWallDust(fighter, detectedWall);
  } else {
    fighter.wallSlide = false;
    if (!detectedWall) {
      fighter.wallContactActive = false;
    }
    fighter._wallDustCooldown = 0;
  }
}

// Called after resolveCollisions(), so wallSide and grounded reflect the current frame.
export function onMovementAbilityLanded(fighter) {
  if (isSportsMode(fighter)) return;

  if (fighter.grounded) {
    fighter.airDodgeUses = fighter.maxJumps;
    fighter.wallSlide = false;
    fighter.wallContactActive = false;
    fighter.wallGrantPending = false;
    return;
  }

  const stillOnWall = fighter.wallSlide && fighter.wallSide;
  if (stillOnWall) {
    fighter.wallContactActive = true;
    return;
  }

  // We have just left a wall after actually sliding against it.
  if (fighter.wallGrantPending && fighter.wallGrantsUsed < MOVEMENT_ABILITY_CONFIG.maxWallGrants) {
    fighter.wallGrantsUsed++;
    fighter.jumps = Math.min(fighter.maxJumps, fighter.jumps + 1);
    fighter.airDodgeUses = Math.min(fighter.maxJumps, fighter.airDodgeUses + 1);
  }

  fighter.wallGrantPending = false;
  fighter.wallContactActive = false;
}

export function resetMovementAbilityState(fighter) {
  fighter.dashCooldown = 0;
  fighter.dashTimer = 0;
  fighter.dashDirection = { x: 0, y: 0 };
  fighter.airDodgeUses = 3;
  fighter.wallSlide = false;
  fighter.wallSide = 0;
  fighter.wallContactActive = false;
  fighter.wallGrantsUsed = 0;
  fighter.wallGrantPending = false;
  fighter._wallDustCooldown = 0;

  fighter._movementTapState = {
    left: -9999, right: -9999, up: -9999, down: -9999,
    leftHeld: false, rightHeld: false, upHeld: false, downHeld: false,
  };
}
