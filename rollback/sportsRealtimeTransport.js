import { supabase } from '../supabaseClient.js';

// Realtime Broadcast transport for a sport match. It deliberately accepts every
// listed participant, unlike the old 1v1 transport which has one peer only.
export class SportsRealtimeTransport {
  constructor({ matchId, playerId, playerIds }) { this.matchId = String(matchId); this.playerId = String(playerId); this.playerIds = new Set(playerIds.map(String)); this.handlers = new Map(); }
  on(event, fn) { const set = this.handlers.get(event) || new Set(); set.add(fn); this.handlers.set(event, set); return () => set.delete(fn); }
  emit(event, data) { for (const fn of this.handlers.get(event) || []) fn(data); }
  async connect() {
    this.channel = supabase.channel(`online-sport-rollback:${this.matchId}`, { config: { broadcast: { self: false, ack: true } } });
    ['input', 'checksum', 'control'].forEach(event => this.channel.on('broadcast', { event }, ({ payload }) => { if (payload?.matchId === this.matchId && payload.playerId !== this.playerId && this.playerIds.has(String(payload.playerId))) this.emit(event, payload); }));
    await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Timed out connecting to sport match.')), 10000); this.channel.subscribe(status => { if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) { clearTimeout(timeout); reject(new Error(`Realtime failed: ${status}`)); } }); });
  }
  send(event, payload) { return this.channel.send({ type: 'broadcast', event, payload }); }
  sendInput(payload) { return this.send('input', payload); }
  sendChecksum(payload) { return this.send('checksum', payload); }
  sendControl(kind, data = {}) { return this.send('control', { version: 1, matchId: this.matchId, playerId: this.playerId, kind, ...data }); }
  close() { return this.channel ? supabase.removeChannel(this.channel) : Promise.resolve(); }
}
