/**
 * Development-only network conditions. Never enable this in normal matches.
 * It lets two local tabs reproduce latency, jitter, packet loss and reordering.
 */
export class NetworkSimulator {
  constructor({ latencyMs = 0, jitterMs = 0, packetLoss = 0, reorderChance = 0, random = Math.random } = {}) {
    this.latencyMs = Math.max(0, latencyMs);
    this.jitterMs = Math.max(0, jitterMs);
    this.packetLoss = Math.max(0, Math.min(1, packetLoss));
    this.reorderChance = Math.max(0, Math.min(1, reorderChance));
    this.random = random;
    this.timers = new Set();
    this.disposed = false;
    this.stats = { attempted: 0, delivered: 0, dropped: 0 };
  }

  send(deliver, packet) {
    if (this.disposed) return false;
    this.stats.attempted += 1;
    if (this.random() < this.packetLoss) {
      this.stats.dropped += 1;
      return false;
    }

    const jitter = (this.random() * 2 - 1) * this.jitterMs;
    const reorder = this.random() < this.reorderChance ? this.latencyMs + this.jitterMs : 0;
    const delay = Math.max(0, this.latencyMs + jitter + reorder);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (this.disposed) return;
      this.stats.delivered += 1;
      deliver(packet);
    }, delay);
    this.timers.add(timer);
    return true;
  }

  wrap(sendFunction) {
    if (typeof sendFunction !== 'function') throw new Error('NetworkSimulator.wrap requires a function.');
    return packet => new Promise((resolve, reject) => {
      const queued = this.send(async delayedPacket => {
        try { resolve(await sendFunction(delayedPacket)); }
        catch (error) { reject(error); }
      }, packet);
      if (!queued) resolve({ dropped: true });
    });
  }

  dispose() {
    this.disposed = true;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }

  getStats() {
    return { ...this.stats, queued: this.timers.size };
  }
}
