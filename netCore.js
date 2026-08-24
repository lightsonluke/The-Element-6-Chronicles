// ═══════════════════════════════════════════════════════════════════════════
// netCore.js — Reusable multiplayer synchronization primitives
// ═══════════════════════════════════════════════════════════════════════════
// Used by all online modes (Ranked, Unranked, Custom Rooms, LAN, Sports).
// Provides:
//   • SeqNum        — wraparound-safe sequence/tick comparison
//   • SnapshotBuffer — tick-stamped state buffer with interpolation
//   • ConnectionState — heartbeat tracking, timeout, reconnection window
//   • NetDiagnostics — ping, tick, snapshot age, reconciliation stats, lag sim
// ═══════════════════════════════════════════════════════════════════════════

// ── SeqNum — wraparound-safe comparison for 16-bit sequence numbers ──
export const SeqNum = {
  is_newer(a, b) {
    // Returns true if sequence number `a` is strictly newer than `b`.
    // Handles wraparound by checking if the difference is within half the range.
    const diff = ((a - b) + 65536) & 0xFFFF;
    return diff > 0 && diff < 32768;
  },
  is_newer_or_eq(a, b) {
    const diff = ((a - b) + 65536) & 0xFFFF;
    return diff < 32768;
  },
};

// ── SnapshotBuffer — buffers tick-stamped state snapshots for interpolation ──
// Stores up to `maxSize` snapshots. Provides:
//   • add(tick, state)         — insert a snapshot (ignored if tick is older)
//   • getInterpolated(delay)   — interpolated state `delay` ticks behind latest
//   • getLatest()              — most recent snapshot (for reconciliation)
//   • getAtTick(tick)          — exact snapshot at a tick
export class SnapshotBuffer {
  constructor(maxSize = 30) {
    this.snapshots = []; // [{ tick, state, time }]
    this.maxSize = maxSize;
  }

  add(tick, state, time = Date.now()) {
    // Reject old/duplicate ticks
    if (this.snapshots.length > 0) {
      const latest = this.snapshots[this.snapshots.length - 1];
      if (!SeqNum.is_newer(tick, latest.tick)) return false;
    }
    this.snapshots.push({ tick, state, time });
    // Trim to max size
    while (this.snapshots.length > this.maxSize) this.snapshots.shift();
    return true;
  }

  // Get the latest snapshot (for reconciliation / authoritative checks)
  getLatest() {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  // Get snapshot at or before a specific tick
  getAtTick(tick) {
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].tick <= tick) return this.snapshots[i];
    }
    return null;
  }

  // Get interpolated state `delayTicks` behind the latest snapshot.
  // Uses linear interpolation between the two surrounding snapshots.
  // Falls back to latest if not enough snapshots for interpolation.
  getInterpolated(delayTicks = 2) {
    if (this.snapshots.length === 0) return null;
    if (this.snapshots.length === 1) return this.snapshots[0].state;

    const latest = this.snapshots[this.snapshots.length - 1];
    const targetTick = latest.tick - delayTicks;

    // Find the two snapshots surrounding targetTick
    let s0 = null, s1 = null;
    for (let i = this.snapshots.length - 1; i >= 1; i--) {
      if (this.snapshots[i - 1].tick <= targetTick && this.snapshots[i].tick >= targetTick) {
        s0 = this.snapshots[i - 1];
        s1 = this.snapshots[i];
        break;
      }
    }

    // If target is before our oldest snapshot, use the oldest
    if (!s0) return this.snapshots[0].state;
    // If target is at or after the latest, use the latest
    if (targetTick >= latest.tick) return latest.state;

    // Linear interpolation between s0 and s1
    const range = s1.tick - s0.tick;
    if (range === 0) return s0.state;
    const t = (targetTick - s0.tick) / range;
    return this._lerpStates(s0.state, s1.state, t);
  }

  // Interpolate numeric fields between two state objects
  _lerpStates(a, b, t) {
    const result = { ...b }; // start with b (includes non-numeric fields)
    for (const key of Object.keys(a)) {
      const av = a[key], bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') {
        result[key] = av + (bv - av) * t;
      } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
        result[key] = t > 0.5 ? bv : av;
      } else if (av && typeof av === 'object' && bv && typeof bv === 'object') {
        result[key] = this._lerpStates(av, bv, t);
      } else {
        result[key] = t > 0.5 ? bv : av;
      }
    }
    return result;
  }

  clear() { this.snapshots = []; }
  get size() { return this.snapshots.length; }
}

// ── ConnectionState — tracks remote contact, supports reconnection window ──
export class ConnectionState {
  constructor({ timeout = 10000, reconnectWindow = 15000, onTimeout, onReconnect } = {}) {
    this.lastContact = Date.now();
    this.timeout = timeout;
    this.reconnectWindow = reconnectWindow;
    this.onTimeout = onTimeout;
    this.onReconnect = onReconnect;
    this.timedOut = false;
    this.wasConnected = false;
  }

  // Call whenever we receive data from the remote
  heartbeat() {
    const wasOut = this.timedOut;
    this.lastContact = Date.now();
    this.wasConnected = true;
    if (this.timedOut) {
      this.timedOut = false;
      this.onReconnect?.();
    }
  }

  isAlive() {
    if (!this.wasConnected) return true; // haven't started yet
    const elapsed = Date.now() - this.lastContact;
    if (elapsed > this.timeout + this.reconnectWindow) return false;
    if (elapsed > this.timeout && !this.timedOut) {
      this.timedOut = true;
      this.onTimeout?.();
    }
    return true;
  }

  get timeSinceContact() { return Date.now() - this.lastContact; }
  get isReconnecting() { return this.timedOut && this.isAlive(); }
}

// ── NetDiagnostics — tracks network health, supports lag simulation ──
export class NetDiagnostics {
  constructor() {
    this.pings = [];
    this.snapshotAges = [];
    this.reconciliationCount = 0;
    this.reconciliationMagnitude = 0;
    this.droppedUpdates = 0;
    this.currentTick = 0;
    this.lastReceivedTick = 0;
    this.connectionState = 'connecting';
    this.roomId = null;
    this.playerNetId = null;
    this.stateVersion = 0;

    // Lag simulation
    this.simLatency = 0;
    this.simPacketLoss = 0;
    this.simJitter = 0;
  }

  recordPing(ping) {
    this.pings.push(ping);
    if (this.pings.length > 30) this.pings.shift();
  }

  recordSnapshot(tick, age) {
    this.lastReceivedTick = tick;
    this.snapshotAges.push(age);
    if (this.snapshotAges.length > 30) this.snapshotAges.shift();
  }

  recordReconciliation(magnitude) {
    this.reconciliationCount++;
    this.reconciliationMagnitude = Math.max(this.reconciliationMagnitude, magnitude);
  }

  recordDroppedUpdate() { this.droppedUpdates++; }

  get avgPing() {
    if (this.pings.length === 0) return 0;
    return Math.round(this.pings.reduce((a, b) => a + b, 0) / this.pings.length);
  }

  get avgSnapshotAge() {
    if (this.snapshotAges.length === 0) return 0;
    return Math.round(this.snapshotAges.reduce((a, b) => a + b, 0) / this.snapshotAges.length);
  }

  // Lag simulation — for testing under bad network conditions
  setSimulation({ latency = 0, packetLoss = 0, jitter = 0 }) {
    this.simLatency = latency;
    this.simPacketLoss = packetLoss;
    this.simJitter = jitter;
  }

  // Returns true if a packet should be dropped (simulated packet loss)
  shouldDropPacket() {
    return this.simPacketLoss > 0 && Math.random() < this.simPacketLoss;
  }

  // Wraps a callback with simulated latency + jitter
  applyLatency(callback) {
    if (this.shouldDropPacket()) return; // dropped
    const delay = this.simLatency + (this.simJitter > 0 ? (Math.random() - 0.5) * 2 * this.simJitter : 0);
    if (delay <= 0) { callback(); return; }
    setTimeout(callback, delay);
  }

  getStats() {
    return {
      ping: this.avgPing,
      snapshotAge: this.avgSnapshotAge,
      currentTick: this.currentTick,
      lastReceivedTick: this.lastReceivedTick,
      reconciliationCount: this.reconciliationCount,
      maxReconciliationMag: Math.round(this.reconciliationMagnitude),
      droppedUpdates: this.droppedUpdates,
      connectionState: this.connectionState,
      roomId: this.roomId,
      playerNetId: this.playerNetId,
      stateVersion: this.stateVersion,
    };
  }
}

// ── Helper: serialize a fighter for network transmission ──
export function serializeFighter(f, charId) {
  return {
    x: Math.round(f.x * 10) / 10,
    y: Math.round(f.y * 10) / 10,
    vx: Math.round(f.vx * 10) / 10,
    vy: Math.round(f.vy * 10) / 10,
    facing: f.facing,
    frame: f.frame,
    state: f.state,
    grounded: f.grounded,
    damage: Math.round(f.damage * 10) / 10,
    stocks: f.stocks,
    superMeter: Math.round(f.superMeter),
    powerActive: f.powerActive,
    invincible: f.invincible,
    // Defensive / stat fields — needed so the opponent can compute hit damage
    // and knockback exactly as the defender's stats dictate (defense, shields).
    shieldAmount: f.shieldAmount || 0,
    statDefenseReduction: f.statDefenseReduction || 0,
    dodgeChance: f.dodgeChance || 0,
    gameMode: f.gameMode || null,
    hp: f.hp ?? 150,
    maxSuper: f.maxSuper || 100,
    charId,
    attackData: f.attackData ? {
      type: f.attackData.type,
      progress: Math.round(f.attackData.progress * 100) / 100,
      name: f.attackData.name,
      color: f.attackData.color,
      isNormal: f.attackData.isNormal,
      isHeavy: f.attackData.isHeavy,
      isSuper: f.attackData.isSuper,
      sigType: f.attackData.sigType,
      damage: f.attackData.damage,
      range: f.attackData.range,
      isGroundPound: f.attackData.isGroundPound,
      isRecovery: f.attackData.isRecovery,
      hitApplied: f.attackData.hitApplied,
    } : null,
  };
}

// ── Helper: reconcile a predicted local fighter with authoritative state ──
// Returns the corrected fighter. If the discrepancy is small, lerps toward
// the authoritative position. If large, snaps.
export function reconcileFighter(localF, authState, { snapThreshold = 120, lerpRate = 0.3 } = {}) {
  if (!authState) return localF;
  const dx = authState.x - localF.x;
  const dy = authState.y - localF.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > snapThreshold) {
    // Large discrepancy — snap to authoritative state
    localF.x = authState.x;
    localF.y = authState.y;
    localF.vx = authState.vx;
    localF.vy = authState.vy;
  } else if (dist > 3) {
    // Small discrepancy — lerp toward authoritative position
    localF.x += dx * lerpRate;
    localF.y += dy * lerpRate;
  }

  // Always sync authoritative gameplay values (damage, stocks, etc.)
  if (authState.damage !== undefined) localF.damage = authState.damage;
  if (authState.stocks !== undefined) localF.stocks = authState.stocks;
  if (authState.superMeter !== undefined) localF.superMeter = authState.superMeter;
  if (authState.facing !== undefined) localF.facing = authState.facing;
  if (authState.state !== undefined) localF.state = authState.state;
  if (authState.grounded !== undefined) localF.grounded = authState.grounded;
  if (authState.invincible !== undefined) localF.invincible = Math.max(localF.invincible, authState.invincible);

  return dist;
}

// ── Helper: apply an authoritative hit event to a local fighter ──
export function applyRemoteHit(fighter, hit) {
  if (!hit) return;
  fighter.damage += hit.dmg || 0;
  fighter.vx = hit.kx || 0;
  fighter.vy = hit.ky || 0;
  fighter.hitstun = hit.stun || 18;
  fighter.state = 'hitstun';
  fighter.grounded = false;
  fighter.superMeter = Math.min(fighter.maxSuper, (fighter.superMeter || 0) + (hit.dmg || 0) * 0.25);
  fighter.hitEffects = fighter.hitEffects || [];
  fighter.hitEffects.push({
    x: fighter.x, y: fighter.y - 22,
    color: hit.color || '#FFFFFF',
    spawnFrame: fighter.frame,
  });
  if (fighter.damage >= 700) fighter._pendingDeath = true;
}