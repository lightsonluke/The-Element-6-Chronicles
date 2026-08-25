/**
 * Compact, deterministic input packets for two-player rollback matches.
 * Keep this file free of DOM/gamepad APIs: UI code reads devices, then encodes
 * the resulting action object here.
 */

export const INPUT_BITS = Object.freeze({
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  UP: 1 << 2,
  DOWN: 1 << 3,
  JUMP: 1 << 4,
  LIGHT: 1 << 5,
  HEAVY: 1 << 6,
  POWER: 1 << 7,
  SUPER: 1 << 8,
});

export const ALL_INPUT_BITS = Object.values(INPUT_BITS).reduce((mask, bit) => mask | bit, 0);
export const NEUTRAL_INPUT_MASK = 0;

const toButton = value => value === true;

export function encodeInput(input = {}) {
  let mask = 0;
  if (toButton(input.left)) mask |= INPUT_BITS.LEFT;
  if (toButton(input.right)) mask |= INPUT_BITS.RIGHT;
  if (toButton(input.up)) mask |= INPUT_BITS.UP;
  if (toButton(input.down)) mask |= INPUT_BITS.DOWN;
  if (toButton(input.jump)) mask |= INPUT_BITS.JUMP;
  // The existing game calls its normal/light attack `sig`.
  if (toButton(input.light) || toButton(input.sig)) mask |= INPUT_BITS.LIGHT;
  if (toButton(input.heavy)) mask |= INPUT_BITS.HEAVY;
  if (toButton(input.power)) mask |= INPUT_BITS.POWER;
  if (toButton(input.super) || toButton(input.superMove)) mask |= INPUT_BITS.SUPER;
  return mask & ALL_INPUT_BITS;
}

export function normalizeInputMask(mask) {
  if (!Number.isInteger(mask)) return NEUTRAL_INPUT_MASK;
  return mask & ALL_INPUT_BITS;
}

export function decodeInput(mask = NEUTRAL_INPUT_MASK) {
  const value = normalizeInputMask(mask);
  return {
    left: Boolean(value & INPUT_BITS.LEFT),
    right: Boolean(value & INPUT_BITS.RIGHT),
    up: Boolean(value & INPUT_BITS.UP),
    down: Boolean(value & INPUT_BITS.DOWN),
    jump: Boolean(value & INPUT_BITS.JUMP),
    sig: Boolean(value & INPUT_BITS.LIGHT),
    light: Boolean(value & INPUT_BITS.LIGHT),
    heavy: Boolean(value & INPUT_BITS.HEAVY),
    power: Boolean(value & INPUT_BITS.POWER),
    superMove: Boolean(value & INPUT_BITS.SUPER),
    super: Boolean(value & INPUT_BITS.SUPER),
  };
}

export function inputsEqual(left, right) {
  return normalizeInputMask(left) === normalizeInputMask(right);
}

export function makeInputPacket({ matchId, playerId, frame, input }) {
  if (!matchId) throw new Error('makeInputPacket requires matchId.');
  if (!playerId) throw new Error('makeInputPacket requires playerId.');
  if (!Number.isSafeInteger(frame) || frame < 0) throw new Error('Input frame must be a non-negative integer.');

  return {
    version: 1,
    matchId: String(matchId),
    playerId: String(playerId),
    frame,
    input: typeof input === 'number' ? normalizeInputMask(input) : encodeInput(input),
  };
}

export function isValidInputPacket(packet) {
  return Boolean(
    packet &&
    packet.version === 1 &&
    typeof packet.matchId === 'string' && packet.matchId.length > 0 &&
    typeof packet.playerId === 'string' && packet.playerId.length > 0 &&
    Number.isSafeInteger(packet.frame) && packet.frame >= 0 &&
    Number.isInteger(packet.input) && packet.input >= 0 &&
    (packet.input & ~ALL_INPUT_BITS) === 0
  );
}

