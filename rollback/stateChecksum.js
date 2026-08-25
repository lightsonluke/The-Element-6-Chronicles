import { serializeState } from './stateSerializer.js';

/** FNV-1a 32-bit: fast enough to compare deterministic game snapshots. */
export function hashString32(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function checksumState(state) {
  return hashString32(serializeState(state)).toString(16).padStart(8, '0');
}

export function makeChecksumPacket({ matchId, playerId, frame, state }) {
  if (!matchId || !playerId) throw new Error('Checksum packets require matchId and playerId.');
  if (!Number.isSafeInteger(frame) || frame < 0) throw new Error('Checksum frame must be a non-negative integer.');
  return {
    version: 1,
    matchId: String(matchId),
    playerId: String(playerId),
    frame,
    checksum: checksumState(state),
  };
}

export function checksumsEqual(left, right) {
  return typeof left === 'string' && left === right;
}

