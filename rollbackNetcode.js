import db from './localBackend';

// Deterministic rollback netcode — implements all 5 principles:
// 1. Deterministic Simulation — identical formulas, seeded random, inputs are the only networked variable
// 2. Zero Input Delay — local inputs execute immediately, no server round-trip
// 3. State Speculation — predicts opponent inputs from last known, simulates ahead
// 4. Rollback & Correction — on confirmed input, rolls back & resimulates if misprediction
// 5. Time Sync — frame-advantage throttling keeps both clients aligned

const INPUT_DELAY = 2;        // frames of intentional delay for input fairness
const MAX_ROLLBACK = 7;       // max frames to resimulate on rollback
const MAX_FRAME_ADVANTAGE = 5; // stall if too far ahead of remote

export class RollbackSession {
  constructor({ matchId, localPlayerId, onSendState, onRemoteInput }) {
    this.matchId = matchId;
    this.localPlayerId = localPlayerId;
    this.remotePlayerId = 1 - localPlayerId;
    this.onSendState = onSendState;
    this.onRemoteInput = onRemoteInput;

    this.frame = 0;
    this.localInputs = {};   // frame -> input (confirmed local)
    this.remoteInputs = {};  // frame -> input (confirmed remote)
    this.stateHistory = [];  // ring buffer of { frame, state }
    this.lastConfirmedRemoteFrame = -1;
    this.lastRemoteInput = null;     // for prediction
    this.pendingRollback = null;     // frame to roll back to
    this.frameAdvantage = 0;         // for time sync (how far ahead local is)
    this.stallCounter = 0;           // stalls frame-advantage throttling
    this.rollingBack = false;
    this.running = true;

    // Deterministic RNG seeded per-match — both sides use same seed
    this._rngState = parseInt(matchId?.replace(/\D/g, '').slice(-8) || '12345678', 10);
  }

  // Deterministic RNG — same seed = same sequence on both machines
  nextRandom() { this._rngState = (this._rngState * 16807) % 2147483647; return (this._rngState - 1) / 2147483646; }

  // 1+2: Record local input, execute immediately (zero delay), send to remote
  recordLocalInput(input) {
    const f = this.frame;
    this.localInputs[f] = input;
    // Send to remote immediately — inputs are the only thing sent over network
    try { this.onSendState({ matchId: this.matchId, playerId: this.localPlayerId, frame: f, input }); } catch {}
    return f;
  }

  // 3+4: Confirm remote input — check prediction, schedule rollback if wrong
  confirmRemoteInput(frame, input) {
    const prev = this.remoteInputs[frame];
    this.remoteInputs[frame] = input;
    this.lastRemoteInput = input;
    if (frame > this.lastConfirmedRemoteFrame) this.lastConfirmedRemoteFrame = frame;

    // Time sync: track advantage
    this.frameAdvantage = this.frame - frame;

    // 4: If we already simulated past this frame with a (possibly wrong) prediction, rollback
    if (frame <= this.frame && this._predictionWasWrong(frame, prev, input)) {
      if (this.pendingRollback === null || frame < this.pendingRollback) {
        this.pendingRollback = frame;
      }
    }
    this.onRemoteInput?.(frame, input);
  }

  _predictionWasWrong(frame, prev, cur) {
    if (!prev) return cur != null; // had no input before, now we do
    return JSON.stringify(prev) !== JSON.stringify(cur);
  }

  // 3: Get predicted remote input for a frame (speculation)
  getInput(playerId, frame) {
    frame = frame ?? this.frame;
    if (playerId === this.localPlayerId) return this.localInputs[frame] || {};
    // Remote: use confirmed if available, else predict from last known
    if (this.remoteInputs[frame]) return this.remoteInputs[frame];
    return this.lastRemoteInput || {};
  }

  // Get both inputs for a frame
  getInputsForFrame(frame) {
    return { local: this.getInput(this.localPlayerId, frame), remote: this.getInput(this.remotePlayerId, frame) };
  }

  // 4: Save state snapshot for rollback resimulation
  saveState(frame, state) {
    // Deep copy for clean rollback
    this.stateHistory.push({ frame, state: JSON.parse(JSON.stringify(state)) });
    if (this.stateHistory.length > MAX_ROLLBACK * 3) this.stateHistory.shift();
  }

  // 4: Check & trigger rollback — returns old state to restore or null
  checkRollback() {
    if (this.pendingRollback === null) return null;
    const target = this.pendingRollback;
    this.pendingRollback = null;
    this.rollingBack = true;
    // Find nearest saved state at or before target frame
    let snap = null;
    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      if (this.stateHistory[i].frame <= target) { snap = this.stateHistory[i]; break; }
    }
    this.rollingBack = false;
    if (!snap) return null;
    return { frame: snap.frame, state: JSON.parse(JSON.stringify(snap.state)) };
  }

  // 5: Advance frame with time-sync throttling — stall if too far ahead
  advanceFrame() {
    // Frame-advantage throttling (Principle 5)
    if (this.frameAdvantage > MAX_FRAME_ADVANTAGE) {
      this.stallCounter = (this.stallCounter + 1) % 2; // stall ~every other frame
      this.frameAdvantage--;
      if (this.stallCounter !== 0) return false; // don't advance this frame
    }
    this.frame++;
    // Prune old data beyond rollback window
    const minF = this.frame - MAX_ROLLBACK * 3;
    for (const f in this.localInputs) if (parseInt(f) < minF) delete this.localInputs[f];
    for (const f in this.remoteInputs) if (parseInt(f) < minF) delete this.remoteInputs[f];
    return true;
  }

  // Resimulate from a saved state to current frame using confirmed inputs
  resimulateFrom(snapshot, simulateFn) {
    let state = JSON.parse(JSON.stringify(snapshot.state));
    for (let f = snapshot.frame + 1; f <= this.frame; f++) {
      const li = this.getInput(this.localPlayerId, f);
      const ri = this.getInput(this.remotePlayerId, f);
      state = simulateFn(state, f, li, ri);
      this.saveState(f, state);
    }
    return state;
  }

  stop() { this.running = false; }
}

// Factory: create a session wired to a CustomRoom/OnlineMatch entity
export function createRollbackSession(matchId, localPlayerId, localSession) {
  let pollTimer = null;
  const SYNC_INTERVAL = 1000 / 60;
  const session = new RollbackSession({
    matchId, localPlayerId,
    onSendState: async (data) => {
      try {
        const room = await db.entities.CustomRoom.filter({ room_code: matchId });
        if (room[0]) {
          const inputs = { ...(room[0].guest_inputs || {}) };
          const key = String(localPlayerId);
          inputs[key] = { ...(inputs[key] || {}) };
          inputs[key][data.frame] = data.input;
          await db.entities.CustomRoom.update(room[0].id, { guest_inputs: inputs });
        }
      } catch {}
    },
    onRemoteInput: () => {},
  });

  // Poll for remote confirmed inputs
  const poll = async () => {
    if (!session.running) return;
    try {
      const room = await db.entities.CustomRoom.filter({ room_code: matchId });
      if (room[0]?.guest_inputs) {
        const remoteId = String(localPlayerId === 0 ? 1 : 0);
        const remoteFrames = room[0].guest_inputs[remoteId] || {};
        for (const [f, input] of Object.entries(remoteFrames)) {
          session.confirmRemoteInput(parseInt(f), input);
        }
      }
    } catch {}
    pollTimer = setTimeout(poll, SYNC_INTERVAL);
  };
  poll();
  const origStop = session.stop.bind(session);
  session.stop = () => { origStop(); if (pollTimer) clearTimeout(pollTimer); };
  return session;
}