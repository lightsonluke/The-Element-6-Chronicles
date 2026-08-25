import { supabase } from '../supabaseClient.js';
import { isValidInputPacket } from './inputBits.js';

const ALLOWED_MODES = new Set(['ranked', 'unranked']);

/** Supabase Realtime Broadcast transport for a single 1v1 match. */
export class SupabaseRollbackTransport {
  constructor({ matchId, playerId, mode, client = supabase, heartbeatMs = 5000 }) {
    if (!matchId || !playerId) throw new Error('Transport requires matchId and playerId.');
    if (!ALLOWED_MODES.has(mode)) throw new Error('Rollback transport currently supports ranked and unranked only.');
    this.matchId = String(matchId);
    this.playerId = String(playerId);
    this.mode = mode;
    this.client = client;
    this.heartbeatMs = heartbeatMs;
    this.channel = null;
    this.heartbeatTimer = null;
    this.handlers = new Map();
    this.connected = false;
    this.latencyMs = null;
  }

  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  #emit(event, payload) {
    for (const handler of this.handlers.get(event) || []) handler(payload);
  }

  async connect({ timeoutMs = 10000 } = {}) {
    if (this.connected) return;
    this.channel = this.client.channel(`rollback:${this.matchId}`, {
      config: { broadcast: { self: false, ack: true } },
    });

    this.channel
      .on('broadcast', { event: 'input' }, ({ payload }) => {
        if (this.#isPeerPayload(payload) && isValidInputPacket(payload)) this.#emit('input', payload);
      })
      .on('broadcast', { event: 'checksum' }, ({ payload }) => {
        if (this.#isPeerPayload(payload)) this.#emit('checksum', payload);
      })
      .on('broadcast', { event: 'control' }, ({ payload }) => {
        if (!this.#isPeerPayload(payload)) return;
        if (payload.kind === 'ping') this.sendControl('pong', { pingId: payload.pingId, sentAt: payload.sentAt });
        if (payload.kind === 'pong' && payload.pingId === this.pendingPingId) {
          this.latencyMs = Math.max(0, performance.now() - this.pendingPingAt);
          this.#emit('latency', this.latencyMs);
        }
        this.#emit('control', payload);
      });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out connecting to the match channel.')), timeoutMs);
      this.channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          this.connected = true;
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timeout);
          reject(new Error(`Realtime channel failed: ${status}`));
        }
      });
    });

    this.heartbeatTimer = setInterval(() => {
      this.client.rpc('online_match_heartbeat', { p_match_id: this.matchId }).catch(() => {});
    }, this.heartbeatMs);
    await this.sendControl('ready');
  }

  #isPeerPayload(payload) {
    return Boolean(payload && payload.matchId === this.matchId && payload.playerId !== this.playerId);
  }

  async #broadcast(event, payload) {
    if (!this.connected || !this.channel) throw new Error('Rollback transport is not connected.');
    const response = await this.channel.send({ type: 'broadcast', event, payload });
    if (response !== 'ok') throw new Error(`Realtime broadcast failed: ${response}`);
  }

  sendInput(packet) {
    return this.#broadcast('input', packet);
  }

  sendChecksum(packet) {
    return this.#broadcast('checksum', packet);
  }

  sendControl(kind, data = {}) {
    return this.#broadcast('control', {
      version: 1,
      matchId: this.matchId,
      playerId: this.playerId,
      mode: this.mode,
      kind,
      ...data,
    });
  }

  ping() {
    this.pendingPingId = `${this.playerId}:${Date.now()}`;
    this.pendingPingAt = performance.now();
    return this.sendControl('ping', { pingId: this.pendingPingId, sentAt: Date.now() });
  }

  async close(reason = 'left') {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    if (this.connected) {
      try { await this.sendControl('disconnect', { reason }); } catch {}
    }
    this.connected = false;
    if (this.channel) await this.client.removeChannel(this.channel);
    this.channel = null;
  }
}

