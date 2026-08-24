// brBotAI.js — Battle Royale ONLY: environment-aware bot AI.
// Wraps the standard updateAI with strategic decisions for destructible
// platforms, movement items, environmental hazards, and interactive objects.
// Bots can: break platforms under enemies, use launch/dash pads, avoid/seek
// hazards, hit objects toward enemies, and use the boomerang strategically.

import { updateAI } from './fighter.js';
import { navigateToward, selectTarget } from './botNavigation.js';
import { isPositionInHazard, nearestHazardToTarget, rockLandingNear } from './brHazards.js';
import { nearestLaunchPad, nearestDashPad, itemAt } from './brItems.js';
import { nearestObjectToHit, getBoomerangInfo } from './brObjects.js';
import { sectionUnderFighter, isSectionBrokenAt } from './brDestructible.js';

const NO_INPUT = { left: false, right: false, jump: false, up: false, down: false, sig: false, power: false, superMove: false, heavy: false };

// Main BR bot AI entry point. Called by the BR engine instead of updateAI.
// Layers environment-aware decisions on top of the standard combat AI.
export function updateBRAI(fighter, opponents, platforms, env, botDifficulty, dt) {
  const { sections, items, hazards, objects } = env;
  if (!opponents || opponents.length === 0) return NO_INPUT;

  // Select target (reuse the route-aware selector from botNavigation)
  let target = fighter._brTarget;
  if (!target || target._eliminated || target.stocks <= 0) {
    const alive = opponents.filter(o => o && o.stocks > 0 && !o._eliminated);
    target = alive.length > 0 ? selectTarget(fighter, alive, platforms) : null;
    fighter._brTarget = target;
  }
  if (!target) return NO_INPUT;

  const dx = target.x - fighter.x;
  const dy = target.y - fighter.y;
  const dist = Math.abs(dx) + Math.abs(dy) * 0.5;

  // ── Priority 1: Avoid immediate danger (falling rocks, fire, electric) ──
  const rockIncoming = rockLandingNear(hazards, fighter.x, fighter.y, 50);
  if (rockIncoming) {
    const inputs = { ...NO_INPUT };
    inputs.left = fighter.x > rockIncoming.x + 40;
    inputs.right = fighter.x < rockIncoming.x - 40;
    if (fighter.grounded) inputs.jump = true;
    return inputs;
  }

  const myHazard = isPositionInHazard(hazards, fighter.x, fighter.y);
  if (myHazard && (myHazard.type === 'fire' || myHazard.type === 'electric' || myHazard.type === 'moving')) {
    // Get out of the hazard
    const inputs = { ...NO_INPUT };
    const safeDir = findSafeDirection(hazards, fighter, platforms);
    inputs.left = safeDir < 0;
    inputs.right = safeDir > 0;
    if (fighter.grounded) inputs.jump = true;
    return inputs;
  }

  // ── Priority 2: Strategic platform destruction ──
  // If the target is standing on a destructible section and we're NOT on it,
  // attack the section to break it (use sig/heavy/super).
  const targetSection = sectionUnderFighter(sections, target);
  const mySection = sectionUnderFighter(sections, fighter);
  if (targetSection && !targetSection._indestructible && mySection !== targetSection) {
    // Only break if we're close enough to hit the section and not standing on it
    const sectionDist = Math.abs(fighter.x - (targetSection.x + targetSection.w / 2));
    if (sectionDist < 150 && Math.abs(fighter.y - targetSection.y) < 80) {
      // Check if we're not directly under it (unless we have recovery)
      const directlyUnder = fighter.y > targetSection.y + targetSection.h + 10 &&
                            fighter.x > targetSection.x - 20 &&
                            fighter.x < targetSection.x + targetSection.w + 20;
      if (!directlyUnder || fighter.recoveryCooldown <= 0) {
        // Attack the section — use heavy or sig
        const inputs = { ...NO_INPUT };
        if (fighter.heavyCooldown <= 0) {
          inputs.heavy = true;
          inputs.left = targetSection.x + targetSection.w / 2 < fighter.x;
          inputs.right = targetSection.x + targetSection.w / 2 > fighter.x;
          return inputs;
        }
        if (fighter.sigCooldown <= 0 && fighter.grounded) {
          inputs.sig = true;
          if (directlyUnder) { inputs.up = true; } // recovery to break from below
          else { inputs.left = targetSection.x + targetSection.w / 2 < fighter.x; inputs.right = targetSection.x + targetSection.w / 2 > fighter.x; }
          return inputs;
        }
        if (fighter.superMeter >= fighter.maxSuper && dist < 200) {
          inputs.superMove = true;
          return inputs;
        }
      }
    }
  }

  // ── Priority 3: Knock enemy into a hazard ──
  const nearbyHazard = nearestHazardToTarget(hazards, target.x, target.y, 350);
  if (nearbyHazard && dist < 200 && Math.abs(dy) < 60) {
    // Use heavy attack to knock enemy toward the hazard
    const inputs = { ...NO_INPUT };
    if (fighter.heavyCooldown <= 0) {
      inputs.heavy = true;
      // Face away from the hazard so knockback pushes enemy toward it
      const hazardDir = Math.sign(nearbyHazard.x - fighter.x);
      inputs.left = hazardDir < 0;
      inputs.right = hazardDir > 0;
      return inputs;
    }
    if (fighter.superMeter >= fighter.maxSuper && dist < 180) {
      inputs.superMove = true;
      inputs.left = nearbyHazard.x < fighter.x;
      inputs.right = nearbyHazard.x > fighter.x;
      return inputs;
    }
  }

  // ── Priority 4: Hit an object toward the enemy ──
  const obj = nearestObjectToHit(objects, fighter, target, 300);
  if (obj && dist > 100 && dist < 500) {
    const objDist = Math.abs(obj.x - fighter.x) + Math.abs(obj.y - fighter.y) * 0.5;
    if (objDist < 120) {
      // We're close to the object — hit it toward the enemy
      const inputs = { ...NO_INPUT };
      const dirToTarget = Math.sign(target.x - fighter.x) || 1;
      if (fighter.heavyCooldown <= 0) {
        inputs.heavy = true;
        inputs.left = dirToTarget < 0;
        inputs.right = dirToTarget > 0;
        return inputs;
      }
      if (fighter.sigCooldown <= 0 && fighter.grounded) {
        inputs.sig = true;
        inputs.left = dirToTarget < 0;
        inputs.right = dirToTarget > 0;
        return inputs;
      }
    }
  }

  // ── Priority 5: Boomerang strategy ──
  const boomerangs = getBoomerangInfo(objects);
  for (const b of boomerangs) {
    if (b.phase === 'idle') {
      // Boomerang is available — hit it if an enemy is along the outward path
      const bDist = Math.abs(b.x - fighter.x) + Math.abs(b.y - fighter.y) * 0.5;
      if (bDist < 100) {
        // Check if enemy is roughly in the direction we'd launch it
        const dirToEnemy = Math.sign(target.x - fighter.x) || 1;
        const dirToBoomerang = Math.sign(b.x - fighter.x) || 1;
        if (dirToEnemy === dirToBoomerang || bDist < 60) {
          const inputs = { ...NO_INPUT };
          if (fighter.heavyCooldown <= 0 || fighter.sigCooldown <= 0) {
            inputs.heavy = fighter.heavyCooldown <= 0;
            inputs.sig = fighter.heavyCooldown > 0 && fighter.sigCooldown <= 0 && fighter.grounded;
            inputs.left = b.x < fighter.x;
            inputs.right = b.x > fighter.x;
            return inputs;
          }
        }
      }
    } else if (b.phase === 'return') {
      // Avoid standing in the return path if an enemy might use it
      const bDist = Math.abs(fighter.x - b.originX) + Math.abs(fighter.y - b.originY) * 0.5;
      const returnPath = Math.abs(fighter.x - b.originX) < 80 && Math.abs(fighter.y - b.originY) < 100;
      if (returnPath && bDist < 200) {
        const inputs = { ...NO_INPUT };
        inputs.left = fighter.x > b.originX;
        inputs.right = fighter.x < b.originX;
        return inputs;
      }
    }
  }

  // ── Priority 6: Use movement items strategically ──
  // Launch pad for escape when at high damage
  if (fighter.damage > 350) {
    const pad = nearestLaunchPad(items, fighter.x, fighter.y, 400);
    if (pad) {
      const padDist = Math.abs(pad.x - fighter.x) + Math.abs(pad.y - fighter.y) * 0.5;
      if (padDist < 80) {
        // Step on it — just walk toward it
        const inputs = { ...NO_INPUT };
        inputs.left = pad.x < fighter.x;
        inputs.right = pad.x > fighter.x;
        return inputs;
      }
      // Navigate toward the pad if it's useful for escape
      if (padDist < 300) {
        const inputs = { ...NO_INPUT };
        inputs.left = pad.x < fighter.x;
        inputs.right = pad.x > fighter.x;
        if (fighter.grounded && Math.abs(pad.x - fighter.x) > 100) inputs.jump = true;
        return inputs;
      }
    }
  }

  // Launch pad for chase when target is far above
  if (dy < -300 && dist > 400) {
    const pad = nearestLaunchPad(items, fighter.x, fighter.y, 350);
    if (pad) {
      const inputs = { ...NO_INPUT };
      inputs.left = pad.x < fighter.x;
      inputs.right = pad.x > fighter.x;
      return inputs;
    }
  }

  // Air-dash pad for crossing gaps
  const gapAhead = isSectionBrokenAt(sections, fighter.x + (fighter.facing || 1) * 80, fighter.y);
  if (gapAhead && fighter.grounded) {
    const dashPad = nearestDashPad(items, fighter.x, fighter.y, fighter.facing || 1, 300);
    if (dashPad) {
      const inputs = { ...NO_INPUT };
      inputs.left = dashPad.x < fighter.x;
      inputs.right = dashPad.x > fighter.x;
      return inputs;
    }
  }

  // ── Priority 7: Avoid walking onto broken sections ──
  const aheadX = fighter.x + (fighter.facing || 1) * 50;
  if (isSectionBrokenAt(sections, aheadX, fighter.y) && fighter.grounded) {
    // Stop or jump — don't walk into a gap
    const inputs = { ...NO_INPUT };
    inputs.jump = true;
    // Turn around briefly
    if (fighter.facing > 0) inputs.left = true; else inputs.right = true;
    return inputs;
  }

  // ── Default: fall through to the standard combat AI ──
  // The standard AI handles navigation, attacking, recovery, and combos.
  // We pass the platforms array (which includes destructible sections with
  // _deleted flags) so the nav system automatically avoids broken sections.
  return updateAI(fighter, target, botDifficulty, platforms, 1, 'balanced');
}

// Find a safe direction to move when in a hazard.
function findSafeDirection(hazards, fighter, platforms) {
  // Try left and right — pick the direction that leads away from hazards
  const leftHazard = isPositionInHazard(hazards, fighter.x - 100, fighter.y);
  const rightHazard = isPositionInHazard(hazards, fighter.x + 100, fighter.y);
  if (leftHazard && !rightHazard) return 1;  // go right
  if (rightHazard && !leftHazard) return -1; // go left
  if (!leftHazard && !rightHazard) {
    // Both sides are safe — move toward stage center
    return fighter.x < 12000 ? 1 : -1;
  }
  // Both sides have hazards — pick the one with a platform
  return fighter.facing || 1;
}