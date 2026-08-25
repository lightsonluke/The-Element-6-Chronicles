import { encodeInput, normalizeInputMask, NEUTRAL_INPUT_MASK } from '../rollback/inputBits.js';
import { cloneState } from '../rollback/stateSerializer.js';
import { checksumState } from '../rollback/stateChecksum.js';

// Generalized rollback session for team sports. Every client simulates the
// same state, predicts missing inputs, then rewinds/replays when late input
// arrives. It supports 2, 4, or 6 player matches.
export class MultiplayerRollbackSession {
  constructor({ matchId, playerId, playerIds, initialState, stepFrame, sendInput, sendChecksum, inputDelay = 2, maxRollbackFrames = 12, historySize = 180, checksumInterval = 60, onRollback = () => {}, onDesync = () => {} }) {
    if (!matchId || !playerId || !Array.isArray(playerIds) || !playerIds.includes(playerId)) throw new Error('Invalid multiplayer rollback session.');
    if (![2, 4, 6].includes(playerIds.length)) throw new Error('Sports rollback supports 2, 4, or 6 players.');
    this.matchId = String(matchId); this.playerId = String(playerId); this.playerIds = playerIds.map(String);
    this.stepFrame = stepFrame; this.sendInput = sendInput; this.sendChecksum = sendChecksum;
    this.inputDelay = inputDelay; this.maxRollbackFrames = maxRollbackFrames; this.historySize = historySize; this.checksumInterval = checksumInterval;
    this.onRollback = onRollback; this.onDesync = onDesync; this.frame = 0; this.confirmedFrame = inputDelay - 1;
    this.state = cloneState(initialState); this.stateHistory = new Map([[0, cloneState(this.state)] ]);
    this.inputs = new Map(this.playerIds.map(id => [id, new Map()]));
    this.predicted = new Map(this.playerIds.map(id => [id, new Map()]));
    this.localChecksums = new Map(); this.remoteChecksums = new Map(); this.lastSentChecksum = 0;
    this.stats = { rollbacks: 0, largestRollback: 0, desyncs: 0 };
    for (let f = 0; f < inputDelay; f += 1) this.playerIds.forEach(id => this.inputs.get(id).set(f, NEUTRAL_INPUT_MASK));
  }
  advance(rawInput) {
    const target = this.frame + this.inputDelay;
    const input = typeof rawInput === 'number' ? normalizeInputMask(rawInput) : encodeInput(rawInput);
    this.inputs.get(this.playerId).set(target, input);
    Promise.resolve(this.sendInput({ version: 1, matchId: this.matchId, playerId: this.playerId, frame: target, input })).catch(() => {});
    this.#step(false); this.#trim(); return this.getState();
  }
  receiveInput(packet) {
    if (!packet || packet.matchId !== this.matchId || !this.inputs.has(String(packet.playerId)) || packet.playerId === this.playerId || !Number.isSafeInteger(packet.frame)) return false;
    const id = String(packet.playerId), frame = packet.frame, value = normalizeInputMask(packet.input);
    const prior = this.predicted.get(id).get(frame); this.inputs.get(id).set(frame, value); this.predicted.get(id).delete(frame);
    if (frame < this.frame && prior !== undefined && prior !== value && this.frame - frame <= this.maxRollbackFrames && this.stateHistory.has(frame)) this.#rollback(frame);
    this.#confirm(); this.#sendConfirmedChecksum(); return true;
  }
  receiveChecksum(packet) {
    if (!packet || packet.matchId !== this.matchId || !this.inputs.has(String(packet.playerId)) || packet.playerId === this.playerId) return;
    this.remoteChecksums.set(`${packet.playerId}:${packet.frame}`, packet.checksum);
    const local = this.localChecksums.get(packet.frame);
    if (local && local !== packet.checksum && packet.frame <= this.confirmedFrame) { this.stats.desyncs += 1; this.onDesync({ frame: packet.frame, playerId: packet.playerId }); }
  }
  getState() { return cloneState(this.state); }
  getStats() { return { ...this.stats, frame: this.frame, confirmedFrame: this.confirmedFrame }; }
  replaceState(snapshot, frame = snapshot?.frame) {
    if (!snapshot || !Number.isSafeInteger(frame) || frame < 0) return false;
    this.state = cloneState(snapshot); this.state.frame = frame; this.frame = frame; this.confirmedFrame = frame;
    this.stateHistory = new Map([[frame, cloneState(this.state)]]);
    this.inputs = new Map(this.playerIds.map(id => [id, new Map()]));
    this.predicted = new Map(this.playerIds.map(id => [id, new Map()]));
    this.localChecksums.clear(); this.remoteChecksums.clear(); this.lastSentChecksum = 0;
    for (let offset = 0; offset < this.inputDelay; offset += 1) this.playerIds.forEach(id => this.inputs.get(id).set(frame + offset, NEUTRAL_INPUT_MASK));
    return true;
  }
  #lastInput(id, frame) { const inputs = this.inputs.get(id); for (let f = frame - 1; f >= Math.max(0, frame - this.historySize); f -= 1) if (inputs.has(f)) return inputs.get(f); return NEUTRAL_INPUT_MASK; }
  #step(replay) {
    const frame = this.frame, frameInputs = {};
    this.playerIds.forEach(id => { const known = this.inputs.get(id).get(frame); const value = known === undefined ? this.#lastInput(id, frame) : known; frameInputs[id] = value; if (known === undefined) this.predicted.get(id).set(frame, value); });
    this.state = this.stepFrame(cloneState(this.state), frameInputs); this.frame = frame + 1; this.state.frame = this.frame; this.stateHistory.set(this.frame, cloneState(this.state));
    if (this.frame % this.checksumInterval === 0) this.localChecksums.set(this.frame, checksumState(this.state));
  }
  #rollback(from) { const target = this.frame; this.state = cloneState(this.stateHistory.get(from)); this.frame = from; for (const key of this.stateHistory.keys()) if (key > from) this.stateHistory.delete(key); while (this.frame < target) this.#step(true); this.stats.rollbacks += 1; this.stats.largestRollback = Math.max(this.stats.largestRollback, target - from); this.onRollback({ from, to: target }); }
  #confirm() { while (this.playerIds.every(id => this.inputs.get(id).has(this.confirmedFrame + 1))) this.confirmedFrame += 1; }
  #sendConfirmedChecksum() { const frame = Math.floor((this.confirmedFrame + 1) / this.checksumInterval) * this.checksumInterval; if (!this.sendChecksum || frame <= 0 || frame <= this.lastSentChecksum || !this.stateHistory.has(frame)) return; const checksum = checksumState(this.stateHistory.get(frame)); this.localChecksums.set(frame, checksum); this.lastSentChecksum = frame; Promise.resolve(this.sendChecksum({ version: 1, matchId: this.matchId, playerId: this.playerId, frame, checksum })).catch(() => {}); }
  #trim() { const oldest = Math.max(0, this.frame - this.historySize); [this.stateHistory, this.localChecksums].forEach(map => { for (const key of map.keys()) if (key < oldest) map.delete(key); }); this.inputs.forEach(map => { for (const key of map.keys()) if (key < oldest) map.delete(key); }); this.predicted.forEach(map => { for (const key of map.keys()) if (key < oldest) map.delete(key); }); }
}
