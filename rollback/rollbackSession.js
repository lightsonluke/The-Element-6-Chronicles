import { encodeInput, inputsEqual, makeInputPacket, NEUTRAL_INPUT_MASK, normalizeInputMask } from './inputBits.js';
import { checksumState } from './stateChecksum.js';
import { cloneState } from './stateSerializer.js';

export class RollbackSession {
  constructor({
    matchId,
    playerId,
    playerRole,
    initialState,
    stepFrame,
    sendInput,
    sendChecksum = null,
    inputDelay = 2,
    maxRollbackFrames = 12,
    historySize = 120,
    checksumInterval = 60,
    onRollback = () => {},
    onDesync = () => {},
    onFrame = () => {},
  }) {
    if (!matchId || !playerId) throw new Error('RollbackSession requires matchId and playerId.');
    if (playerRole !== 'host' && playerRole !== 'guest') throw new Error('playerRole must be host or guest.');
    if (typeof stepFrame !== 'function' || typeof sendInput !== 'function') throw new Error('stepFrame and sendInput are required.');

    this.matchId = String(matchId);
    this.playerId = String(playerId);
    this.localRole = playerRole;
    this.remoteRole = playerRole === 'host' ? 'guest' : 'host';
    this.stepFrame = stepFrame;
    this.sendInput = sendInput;
    this.sendChecksum = sendChecksum;
    this.inputDelay = Math.max(0, Math.floor(inputDelay));
    this.maxRollbackFrames = Math.max(1, Math.floor(maxRollbackFrames));
    this.historySize = Math.max(this.maxRollbackFrames + this.inputDelay + 4, Math.floor(historySize));
    this.checksumInterval = Math.max(1, Math.floor(checksumInterval));
    this.onRollback = onRollback;
    this.onDesync = onDesync;
    this.onFrame = onFrame;

    this.currentFrame = 0;
    this.confirmedFrame = this.inputDelay - 1;
    this.state = cloneState(initialState);
    this.state.frame = 0;
    this.stateHistory = new Map([[0, cloneState(this.state)]]);
    this.localInputs = new Map();
    this.remoteInputs = new Map();
    this.predictedRemoteInputs = new Map();
    this.localChecksums = new Map();
    this.remoteChecksums = new Map();
    this.lastChecksumSent = 0;
    this.stats = { rollbackCount: 0, rolledBackFrames: 0, largestRollback: 0, lateInputs: 0, desyncs: 0 };
    // Input-delay frames before the first captured input are known neutral on
    // both peers, so they can be considered confirmed immediately.
    for (let frame = 0; frame < this.inputDelay; frame += 1) {
      this.localInputs.set(frame, NEUTRAL_INPUT_MASK);
      this.remoteInputs.set(frame, NEUTRAL_INPUT_MASK);
    }
  }

  captureLocalInput(rawInput) {
    const frame = this.currentFrame + this.inputDelay;
    const mask = typeof rawInput === 'number' ? normalizeInputMask(rawInput) : encodeInput(rawInput);
    this.localInputs.set(frame, mask);
    const packet = makeInputPacket({ matchId: this.matchId, playerId: this.playerId, frame, input: mask });
    Promise.resolve(this.sendInput(packet)).catch(() => {});
    return packet;
  }

  advance(rawLocalInput) {
    this.captureLocalInput(rawLocalInput);
    this.#simulateOneFrame(false);
    this.#trimHistory();
    return this.getRenderableState();
  }

  receiveRemoteInput(packet) {
    if (!packet || packet.matchId !== this.matchId || packet.playerId === this.playerId) return false;
    if (!Number.isSafeInteger(packet.frame) || packet.frame < 0) return false;

    const frame = packet.frame;
    const mask = normalizeInputMask(packet.input);
    this.remoteInputs.set(frame, mask);
    const predicted = this.predictedRemoteInputs.get(frame);

    if (frame < this.currentFrame && predicted !== undefined && !inputsEqual(predicted, mask)) {
      const age = this.currentFrame - frame;
      if (age <= this.maxRollbackFrames && this.stateHistory.has(frame)) this.#rollbackFrom(frame);
      else this.stats.lateInputs += 1;
    }

    this.#updateConfirmedFrame();
    this.#publishConfirmedChecksum();
    return true;
  }

  receiveRemoteChecksum(packet) {
    if (!packet || packet.matchId !== this.matchId || packet.playerId === this.playerId) return false;
    if (!Number.isSafeInteger(packet.frame) || typeof packet.checksum !== 'string') return false;
    this.remoteChecksums.set(packet.frame, packet.checksum);
    const local = this.localChecksums.get(packet.frame);
    if (packet.frame <= this.confirmedFrame + 1 && local && local !== packet.checksum) {
      this.stats.desyncs += 1;
      this.onDesync({ frame: packet.frame, localChecksum: local, remoteChecksum: packet.checksum });
    }
    return true;
  }

  getRenderableState() {
    return cloneState(this.state);
  }

  getStateAtFrame(frame) {
    const snapshot = this.stateHistory.get(frame);
    return snapshot ? cloneState(snapshot) : null;
  }

  getStats() {
    return { ...this.stats, currentFrame: this.currentFrame, confirmedFrame: this.confirmedFrame };
  }

  // A confirmed host snapshot is used only as a recovery checkpoint after a
  // checksum mismatch. Both peers pause briefly, replace their prediction
  // history, then resume from exactly this frame instead of ending the match.
  replaceState(snapshot, frame = snapshot?.frame) {
    if (!snapshot || !Number.isSafeInteger(frame) || frame < 0) return false;
    this.state = cloneState(snapshot);
    this.currentFrame = frame;
    this.state.frame = frame;
    this.confirmedFrame = frame;
    this.stateHistory = new Map([[frame, cloneState(this.state)]]);
    this.localInputs.clear(); this.remoteInputs.clear(); this.predictedRemoteInputs.clear();
    this.localChecksums.clear(); this.remoteChecksums.clear(); this.lastChecksumSent = 0;
    for (let offset = 0; offset < this.inputDelay; offset += 1) {
      this.localInputs.set(frame + offset, NEUTRAL_INPUT_MASK);
      this.remoteInputs.set(frame + offset, NEUTRAL_INPUT_MASK);
    }
    return true;
  }

  #inputFor(map, frame, fallback) {
    return map.has(frame) ? map.get(frame) : fallback;
  }

  #latestRemoteBefore(frame) {
    for (let cursor = frame - 1; cursor >= Math.max(0, frame - this.historySize); cursor -= 1) {
      if (this.remoteInputs.has(cursor)) return this.remoteInputs.get(cursor);
    }
    return NEUTRAL_INPUT_MASK;
  }

  #simulateOneFrame(replaying) {
    const frame = this.currentFrame;
    const localInput = this.#inputFor(this.localInputs, frame, NEUTRAL_INPUT_MASK);
    const actualRemote = this.remoteInputs.get(frame);
    const remoteInput = actualRemote === undefined ? this.#latestRemoteBefore(frame) : actualRemote;
    if (actualRemote === undefined) this.predictedRemoteInputs.set(frame, remoteInput);
    else this.predictedRemoteInputs.delete(frame);

    const inputs = this.localRole === 'host'
      ? { host: localInput, guest: remoteInput }
      : { host: remoteInput, guest: localInput };

    this.state = this.stepFrame(cloneState(this.state), inputs);
    this.currentFrame = frame + 1;
    this.state.frame = this.currentFrame;
    this.stateHistory.set(this.currentFrame, cloneState(this.state));

    if (this.currentFrame % this.checksumInterval === 0) {
      const checksum = checksumState(this.state);
      this.localChecksums.set(this.currentFrame, checksum);
      const remote = this.remoteChecksums.get(this.currentFrame);
      if (this.currentFrame <= this.confirmedFrame + 1 && remote && remote !== checksum) {
        this.stats.desyncs += 1;
        this.onDesync({ frame: this.currentFrame, localChecksum: checksum, remoteChecksum: remote });
      }
    }

    if (!replaying) this.onFrame({ frame: this.currentFrame, state: this.getRenderableState(), inputs });
  }

  #rollbackFrom(frame) {
    const targetFrame = this.currentFrame;
    const restored = this.stateHistory.get(frame);
    if (!restored) return;

    const amount = targetFrame - frame;
    this.state = cloneState(restored);
    this.currentFrame = frame;
    for (const key of [...this.stateHistory.keys()]) if (key > frame) this.stateHistory.delete(key);
    for (const key of [...this.localChecksums.keys()]) if (key > frame) this.localChecksums.delete(key);

    while (this.currentFrame < targetFrame) this.#simulateOneFrame(true);
    this.stats.rollbackCount += 1;
    this.stats.rolledBackFrames += amount;
    this.stats.largestRollback = Math.max(this.stats.largestRollback, amount);
    this.onRollback({ fromFrame: frame, toFrame: targetFrame, frames: amount, state: this.getRenderableState() });
  }

  #updateConfirmedFrame() {
    while (this.remoteInputs.has(this.confirmedFrame + 1)) this.confirmedFrame += 1;
  }

  #publishConfirmedChecksum() {
    if (!this.sendChecksum) return;
    const stateFrame = Math.floor((this.confirmedFrame + 1) / this.checksumInterval) * this.checksumInterval;
    if (stateFrame <= 0 || stateFrame <= this.lastChecksumSent) return;
    const confirmedState = this.stateHistory.get(stateFrame);
    if (!confirmedState) return;
    const checksum = checksumState(confirmedState);
    this.localChecksums.set(stateFrame, checksum);
    this.lastChecksumSent = stateFrame;
    Promise.resolve(this.sendChecksum({
      version: 1,
      matchId: this.matchId,
      playerId: this.playerId,
      frame: stateFrame,
      checksum,
    })).catch(() => {});
    const remote = this.remoteChecksums.get(stateFrame);
    if (remote && remote !== checksum) {
      this.stats.desyncs += 1;
      this.onDesync({ frame: stateFrame, localChecksum: checksum, remoteChecksum: remote });
    }
  }

  #trimHistory() {
    const oldest = Math.max(0, this.currentFrame - this.historySize);
    for (const collection of [this.stateHistory, this.localInputs, this.remoteInputs, this.predictedRemoteInputs, this.localChecksums, this.remoteChecksums]) {
      for (const key of collection.keys()) if (key < oldest) collection.delete(key);
    }
  }
}
