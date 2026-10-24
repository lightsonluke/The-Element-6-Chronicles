
/*
 * Universal movement abilities shared by every fight-mode simulation.
 *
 * RULES:
 * - Double-tap a directional button within 12 frames (~0.20s) to dash.
 * - Grounded: only left/right dashes are allowed and they are NOT invulnerable.
 * - Airborne: all four directions become a 0.30s dodge with invulnerability.
 * - An airborne dodge consumes one dodge use.
 * - Wall sliding works against solid walls at least half a fighter tall.
 * - Leaving a wall while airborne restores jumps and air-dodges.
 * - Wall departures can restore jumps a maximum of 3 times per airtime.
 * - Landing restores jumps, air-dodges, and the wall-reset counter.
 * - Touching a wall repeatedly without leaving it does not grant extra resets.
 * - Sports mode ("soccer") is excluded.
 */

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
    maxWallJumpResets: 3
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
            downHeld: false
        };
    }

    return fighter._movementTapState;
}

function startDash(fighter, x, y) {
    if (fighter.dashCooldown > 0 || fighter.dashTimer > 0) {
        return false;
    }

    const airborne = !fighter.grounded;

    // Ground dashes are horizontal only.
    if (!airborne && (x === 0 || y !== 0)) {
        return false;
    }

    // Air dodges consume a use.
    if (airborne && fighter.airDodgeUses <= 0) {
        return false;
    }

    fighter.dashCooldown = MOVEMENT_ABILITY_CONFIG.dashCooldown;

    fighter.dashTimer = airborne
        ? MOVEMENT_ABILITY_CONFIG.airDodgeFrames
        : MOVEMENT_ABILITY_CONFIG.groundDashFrames;

    fighter.dashDirection = { x, y };
    fighter.wallSlide = false;
    fighter.wallContactActive = false;

    fighter.vx = x * (
        airborne
            ? MOVEMENT_ABILITY_CONFIG.airDodgeSpeed
            : MOVEMENT_ABILITY_CONFIG.groundDashSpeed
    );

    fighter.vy = y * (
        airborne
            ? MOVEMENT_ABILITY_CONFIG.airDodgeSpeed
            : 0
    );

    if (x !== 0) {
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
                'antigravity'
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
            p.h <= 0
        ) {
            continue;
        }

        // Ignore platforms too short to count as walls.
        if (p.h < MOVEMENT_ABILITY_CONFIG.wallMinHeight) {
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

function resetAirJumpsFromWall(fighter) {
    if (
        (fighter.wallJumpResets || 0) >=
        MOVEMENT_ABILITY_CONFIG.maxWallJumpResets
    ) {
        return false;
    }

    // Restore the normal jump pool.
    // This code assumes jumpsUsed tracks jumps already consumed.
    fighter.jumpsUsed = 0;

    // Restore the air-dodge pool as well.
    fighter.airDodgeUses = fighter.maxJumps;

    fighter.wallJumpResets =
        (fighter.wallJumpResets || 0) + 1;

    return true;
}

export function updateMovementAbilities(
    fighter,
    inputs,
    platforms
) {
    if (isSportsMode(fighter)) {
        return;
    }

    // Initialize wall-reset tracking for existing fighters.
    if (!Number.isFinite(fighter.wallJumpResets)) {
        fighter.wallJumpResets = 0;
    }

    if (typeof fighter.wasTouchingWall !== 'boolean') {
        fighter.wasTouchingWall = false;
    }

    // Landing restores all jumps, dodges, and wall resets.
    if (fighter.grounded) {
        fighter.airDodgeUses = fighter.maxJumps;
        fighter.jumpsUsed = 0;
        fighter.wallJumpResets = 0;
        fighter.wasTouchingWall = false;
        fighter.wallSlide = false;
        fighter.wallContactActive = false;
        fighter.wallGrantPending = false;
    }

    // Prevent double-taps from activating during control locks.
    // Still record the input edges to prevent accidental dash activation.
    const locked =
        fighter.hitstun > 0 ||
        fighter.landingLag > 0 ||
        fighter.state === 'attacking' ||
        fighter.state === 'superAttack' ||
        fighter.trapped;

    if (!locked) {
        tryDirectionalDoubleTap(fighter, inputs);
    } else {
        ensureTapState(fighter);

        const taps = fighter._movementTapState;

        for (const key of DIRECTIONS) {
            taps[`${key}Held`] = !!inputs[key];
        }
    }

    // An active dash takes priority over wall sliding.
    if (fighter.dashTimer > 0) {
        fighter.wallSlide = false;
        return;
    }

    // Detect actual contact with solid walls.
    const detectedWallSide = getWallContact(
        platforms,
        fighter
    );

    const side = detectedWallSide || fighter.wallSide || 0;

    const touchingWall =
        !fighter.grounded &&
        !fighter.gravityInverted &&
        side !== 0;

    // Track wall contact transitions.
    if (touchingWall) {
        fighter.wallSide = side;
        fighter.wallSlide = true;
        fighter.wallContactActive = true;

        fighter.vx = 0;

        fighter.vy = Math.min(
            fighter.vy +
                MOVEMENT_ABILITY_CONFIG.wallSlideAcceleration,
            MOVEMENT_ABILITY_CONFIG.wallSlideMaxFallSpeed
        );

        fighter.state = 'jumping';
        fighter.wasTouchingWall = true;
    } else {
        fighter.wallSlide = false;

        // The fighter was touching a wall, but is now airborne
        // and no longer touching it. Grant one reset for this departure.
        if (
            fighter.wasTouchingWall &&
            !fighter.grounded
        ) {
            resetAirJumpsFromWall(fighter);

            fighter.wallContactActive = false;
            fighter.wallGrantPending = false;
            fighter.wasTouchingWall = false;
        }
    }
}

// Called after resolveCollisions(), when grounded and wall contact
// should reflect the current frame.
export function onMovementAbilityLanded(fighter) {
    if (isSportsMode(fighter)) {
        return;
    }

    if (!Number.isFinite(fighter.wallJumpResets)) {
        fighter.wallJumpResets = 0;
    }

    if (fighter.grounded) {
        fighter.airDodgeUses = fighter.maxJumps;
        fighter.jumpsUsed = 0;
        fighter.wallJumpResets = 0;
        fighter.wasTouchingWall = false;
        fighter.wallSlide = false;
        fighter.wallContactActive = false;
        fighter.wallGrantPending = false;

        return;
    }

    // Do not restore jumps here for continued wall contact.
    // The departure is handled in updateMovementAbilities().
    if (fighter.wallSlide && fighter.wallSide) {
        fighter.wallContactActive = true;
        fighter.wasTouchingWall = true;
        return;
    }

    fighter.wallContactActive = false;
    fighter.wallGrantPending = false;
}

// Reset all movement-ability state when initializing or respawning.
export function resetMovementAbilityState(fighter) {
    fighter.dashCooldown = 0;
    fighter.dashTimer = 0;
    fighter.dashDirection = { x: 0, y: 0 };

    fighter.airDodgeUses = fighter.maxJumps || 3;

    fighter.wallSlide = false;
    fighter.wallSide = 0;
    fighter.wallContactActive = false;
    fighter.wallGrantsUsed = 0;
    fighter.wallGrantPending = false;

    fighter.wallJumpResets = 0;
    fighter.wasTouchingWall = false;

    fighter.jumpsUsed = 0;

    fighter._movementTapState = {
        left: -9999,
        right: -9999,
        up: -9999,
        down: -9999,
        leftHeld: false,
        rightHeld: false,
        upHeld: false,
        downHeld: false
    };
}
