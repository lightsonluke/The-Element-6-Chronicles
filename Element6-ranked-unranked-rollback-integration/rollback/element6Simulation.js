import {
  applyHit,
  checkHit,
  createFighter,
  updateFighter,
  updateProjectiles,
} from '../fighter.js';
import { applyElement } from '../elements.js';
import { decodeInput } from './inputBits.js';

export const ONLINE_STAGE_WIDTH = 1280;
export const ONLINE_STAGE_HEIGHT = 720;
export const ONLINE_PLATFORMS = Object.freeze([
  Object.freeze({ x: 40, y: 620, w: 1200, h: 48 }),
  Object.freeze({ x: 120, y: 440, w: 360, h: 20 }),
  Object.freeze({ x: 800, y: 440, w: 360, h: 20 }),
  Object.freeze({ x: 460, y: 270, w: 360, h: 20 }),
]);

const REF_KEY = '__rollbackFighterRef';

function hashSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 0x6d2b79f5;
}

function nextSeed(seed) {
  let value = (seed >>> 0) || 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function packValue(value, fighterRoles, seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? (Object.is(value, -0) ? 0 : value) : 0;
  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') return undefined;
  if (fighterRoles.has(value)) return { [REF_KEY]: fighterRoles.get(value) };
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value.map(item => packValue(item, fighterRoles, seen)).filter(item => item !== undefined);
    seen.delete(value);
    return result;
  }

  const result = {};
  for (const key of Object.keys(value).sort()) {
    // Platforms are constant and relinked each simulation frame.
    if (key === '_platforms') continue;
    const packed = packValue(value[key], fighterRoles, seen);
    if (packed !== undefined) result[key] = packed;
  }
  seen.delete(value);
  return result;
}

function unpackValue(value, fightersByRole) {
  if (value === null || typeof value !== 'object') return value;
  if (!Array.isArray(value) && typeof value[REF_KEY] === 'string') return fightersByRole[value[REF_KEY]] || null;
  if (Array.isArray(value)) return value.map(item => unpackValue(item, fightersByRole));
  for (const key of Object.keys(value)) value[key] = unpackValue(value[key], fightersByRole);
  return value;
}

function packFighters(host, guest) {
  const roles = new Map([[host, 'host'], [guest, 'guest']]);
  return {
    // Shallow root copies prevent the root fighter itself from becoming a
    // reference marker while nested fighter-to-fighter links still do.
    host: packValue({ ...host }, roles),
    guest: packValue({ ...guest }, roles),
  };
}

function unpackFighters(packed) {
  const fighters = {
    host: structuredCloneSafe(packed.host),
    guest: structuredCloneSafe(packed.guest),
  };
  unpackValue(fighters.host, fighters);
  unpackValue(fighters.guest, fighters);
  return fighters;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function prepareCharacter(character, elementId, shikigamiId) {
  const prepared = structuredCloneSafe(character);
  prepared.stats = applyElement(prepared.stats || {}, elementId || 'basic');
  if (shikigamiId) prepared.shikigamiId = shikigamiId;
  return prepared;
}

export function createElement6OnlineState({ matchId, mode, host, guest }) {
  if (mode !== 'ranked' && mode !== 'unranked') throw new Error('Element 6 rollback currently supports ranked and unranked only.');
  if (!host?.character || !guest?.character) throw new Error('Both online players require character data.');

  const hostChar = prepareCharacter(host.character, host.elementId, host.shikigamiId);
  const guestChar = prepareCharacter(guest.character, guest.elementId, guest.shikigamiId);
  const hostFighter = createFighter(hostChar, 300, 572, 1);
  const guestFighter = createFighter(guestChar, 980, 572, -1);
  hostFighter.grounded = true;
  guestFighter.grounded = true;
  hostFighter.gameMode = mode;
  guestFighter.gameMode = mode;
  hostFighter.playerIndex = 1;
  guestFighter.playerIndex = 2;

  return {
    version: 1,
    frame: 0,
    mode,
    seed: hashSeed(String(matchId)),
    timerFrames: 4 * 60 * 60,
    winner: null,
    events: [],
    fighters: packFighters(hostFighter, guestFighter),
  };
}

function hitEvent(frame, attackerRole, attacker) {
  return {
    id: `${frame}:${attackerRole}`,
    frame,
    type: attacker.attackData?.isSuper ? 'superHit' : attacker.attackData?.isHeavy ? 'heavyHit' : 'hit',
  };
}

export function stepElement6OnlineFrame(previousState, inputMasks) {
  const state = structuredCloneSafe(previousState);
  if (state.winner) return state;

  const fighters = unpackFighters(state.fighters);
  const hostInput = decodeInput(inputMasks.host);
  const guestInput = decodeInput(inputMasks.guest);
  const originalRandom = Math.random;
  let seed = state.seed >>> 0;
  Math.random = () => {
    seed = nextSeed(seed);
    return seed / 0x100000000;
  };

  const events = [];
  try {
    updateFighter(fighters.host, hostInput, ONLINE_PLATFORMS, ONLINE_STAGE_WIDTH, ONLINE_STAGE_HEIGHT, fighters.guest);
    updateFighter(fighters.guest, guestInput, ONLINE_PLATFORMS, ONLINE_STAGE_WIDTH, ONLINE_STAGE_HEIGHT, fighters.host);
    updateProjectiles(fighters.host, fighters.guest);
    updateProjectiles(fighters.guest, fighters.host);

    if (checkHit(fighters.host, fighters.guest)) {
      applyHit(fighters.host, fighters.guest);
      events.push(hitEvent(state.frame, 'host', fighters.host));
    }
    if (checkHit(fighters.guest, fighters.host)) {
      applyHit(fighters.guest, fighters.host);
      events.push(hitEvent(state.frame, 'guest', fighters.guest));
    }
    // Rendering used to remove expired hit sparks. That mutation must live in
    // the deterministic simulation for rollback, never in the canvas draw.
    for (const fighter of [fighters.host, fighters.guest]) {
      fighter.hitEffects = (fighter.hitEffects || []).filter(effect => fighter.frame - effect.spawnFrame < 24);
    }
  } finally {
    Math.random = originalRandom;
  }

  state.frame += 1;
  state.seed = seed;
  state.timerFrames = Math.max(0, state.timerFrames - 1);
  state.events = events;
  if (fighters.host.stocks <= 0) state.winner = 'guest';
  else if (fighters.guest.stocks <= 0) state.winner = 'host';
  else if (state.timerFrames <= 0) {
    state.winner = fighters.host.stocks !== fighters.guest.stocks
      ? (fighters.host.stocks > fighters.guest.stocks ? 'host' : 'guest')
      : (fighters.host.damage === fighters.guest.damage ? 'draw' : (fighters.host.damage < fighters.guest.damage ? 'host' : 'guest'));
  }
  state.fighters = packFighters(fighters.host, fighters.guest);
  return state;
}

/** Creates safe render copies with fighter-to-fighter references restored. */
export function unpackElement6Fighters(state) {
  return unpackFighters(state.fighters);
}
