import { decodeInput } from './inputBits.js';
import { cloneState } from './stateSerializer.js';

export const ROLLBACK_FPS = 60;
export const FIXED_DELTA_SECONDS = 1 / ROLLBACK_FPS;
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

// Quantizing prevents tiny browser floating-point differences from accumulating.
export function quantize(value, places = 4) {
  const scale = 10 ** places;
  return Math.round((Number(value) || 0) * scale) / scale;
}

/** Deterministic xorshift32. Store the returned seed in rollback state. */
export function nextRandom(seed) {
  let value = (seed >>> 0) || 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  value >>>= 0;
  return { seed: value, value: value / 0x100000000 };
}

export function createInitialRankedState({
  seed = 0x0e1e6e06,
  mode = 'unranked',
  host = {},
  guest = {},
} = {}) {
  if (mode !== 'ranked' && mode !== 'unranked') throw new Error('Rollback mode must be ranked or unranked.');

  const fighter = (playerId, source, x, facing) => ({
    playerId,
    characterId: source.characterId || 'yellow',
    elementId: source.elementId || 'basic',
    x,
    y: 572,
    vx: 0,
    vy: 0,
    facing,
    grounded: true,
    jumps: 2,
    stocks: 3,
    damage: 0,
    superMeter: 0,
    attack: null,
    attackFrame: 0,
    hitstun: 0,
    invincible: 0,
  });

  return {
    version: 1,
    mode,
    frame: 0,
    seed: seed >>> 0,
    timerFrames: 4 * 60 * ROLLBACK_FPS,
    winner: null,
    fighters: {
      host: fighter('host', host, 300, 1),
      guest: fighter('guest', guest, 980, -1),
    },
  };
}

function stepPrototypeFighter(fighter, opponent, input) {
  const direction = Number(input.right) - Number(input.left);
  const speed = 5.4;
  const gravity = 0.72;

  if (fighter.hitstun > 0) fighter.hitstun -= 1;
  else fighter.vx = quantize(direction * speed);

  if (direction !== 0) fighter.facing = direction > 0 ? 1 : -1;
  if (input.jump && fighter.grounded) {
    fighter.vy = -13.2;
    fighter.grounded = false;
  }

  fighter.vy = quantize(fighter.vy + gravity);
  fighter.x = quantize(fighter.x + fighter.vx);
  fighter.y = quantize(fighter.y + fighter.vy);

  if (fighter.y >= 572) {
    fighter.y = 572;
    fighter.vy = 0;
    fighter.grounded = true;
  }

  fighter.x = Math.max(-180, Math.min(WORLD_WIDTH + 180, fighter.x));
  if (fighter.invincible > 0) fighter.invincible -= 1;

  const attackName = input.superMove ? 'super' : input.power ? 'power' : input.heavy ? 'heavy' : input.sig ? 'light' : null;
  if (attackName && !fighter.attack && fighter.hitstun <= 0) {
    fighter.attack = attackName;
    fighter.attackFrame = 0;
  }

  if (fighter.attack) {
    fighter.attackFrame += 1;
    const activeFrame = fighter.attack === 'light' ? 4 : fighter.attack === 'heavy' ? 8 : 10;
    if (fighter.attackFrame === activeFrame && opponent.invincible <= 0) {
      const closeX = Math.abs(opponent.x - fighter.x) < (fighter.attack === 'heavy' ? 105 : 80);
      const closeY = Math.abs(opponent.y - fighter.y) < 100;
      const facingOpponent = Math.sign(opponent.x - fighter.x) === fighter.facing;
      if (closeX && closeY && facingOpponent) {
        const damage = fighter.attack === 'super' ? 35 : fighter.attack === 'power' ? 24 : fighter.attack === 'heavy' ? 18 : 9;
        opponent.damage = quantize(opponent.damage + damage);
        opponent.vx = quantize(fighter.facing * (5 + opponent.damage * 0.035));
        opponent.vy = quantize(-3 - opponent.damage * 0.018);
        opponent.hitstun = fighter.attack === 'light' ? 10 : 18;
      }
    }
    if (fighter.attackFrame >= 24) {
      fighter.attack = null;
      fighter.attackFrame = 0;
    }
  }
}

/**
 * A deterministic test simulation for wiring and network testing.
 *
 * IMPORTANT: Element 6 must eventually move its real createFighter,
 * updateFighter, hit/projectile and stage logic behind this same pure function
 * boundary. Do not ship ranked rewards using only this prototype simulation.
 */
export function stepRankedPrototype(previousState, inputMasks) {
  const state = cloneState(previousState);
  if (state.winner) return state;

  const hostInput = decodeInput(inputMasks.host);
  const guestInput = decodeInput(inputMasks.guest);
  const host = state.fighters.host;
  const guest = state.fighters.guest;

  stepPrototypeFighter(host, guest, hostInput);
  stepPrototypeFighter(guest, host, guestInput);

  for (const fighter of [host, guest]) {
    if (fighter.x <= -150 || fighter.x >= WORLD_WIDTH + 150 || fighter.y > WORLD_HEIGHT + 180) {
      fighter.stocks -= 1;
      fighter.x = fighter.playerId === 'host' ? 300 : 980;
      fighter.y = 100;
      fighter.vx = 0;
      fighter.vy = 0;
      fighter.damage = 0;
      fighter.invincible = 90;
    }
  }

  state.timerFrames = Math.max(0, state.timerFrames - 1);
  state.frame += 1;
  if (host.stocks <= 0) state.winner = 'guest';
  else if (guest.stocks <= 0) state.winner = 'host';
  else if (state.timerFrames === 0) {
    state.winner = host.stocks !== guest.stocks
      ? (host.stocks > guest.stocks ? 'host' : 'guest')
      : (host.damage === guest.damage ? 'draw' : (host.damage < guest.damage ? 'host' : 'guest'));
  }

  return state;
}

/** Build an adapter around the real game simulation after it is made pure. */
export function createDeterministicSimulation({ initialState, stepFrame }) {
  if (typeof stepFrame !== 'function') throw new Error('stepFrame must be a function.');
  return {
    createState: () => cloneState(initialState),
    step: (state, inputs) => stepFrame(cloneState(state), inputs, FIXED_DELTA_SECONDS),
  };
}

