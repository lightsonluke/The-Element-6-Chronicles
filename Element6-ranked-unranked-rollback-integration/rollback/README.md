# Element 6 rollback foundation (ranked + unranked)

These modules provide the networking foundation for two-player ranked and
unranked rollback. `RollbackOnlineFight.jsx` is the connected game screen and
`OnlineLobby.jsx` routes ranked/unranked matches into it. Online soccer keeps
using its existing networking screen.

## What is already here

- Fixed 60 FPS frame numbering
- Compact input packets and input delay
- Remote-input prediction and rollback/replay
- Serializable state snapshots
- Periodic desync checksums
- Supabase Realtime Broadcast transport
- Local latency/jitter/loss testing
- A small deterministic fight simulation for isolated tests
- The real Element 6 fighter adapter in `element6Simulation.js`

## How the real fighter is made deterministic

`element6Simulation.js` runs the existing frame-based fighter engine at a fixed
60 Hz, replaces gameplay randomness with a match-seeded generator, snapshots
both fighters, and safely relinks fighter-to-fighter references after loading a
snapshot. Canvas drawing and audio remain outside simulation state.

The deterministic boundary has this shape:

```js
function stepElement6Frame(state, { host, guest }, fixedDelta) {
  // Decode inputs, update both fighters/projectiles/stage, return next state.
  // No canvas, React state, audio, Date.now, performance.now or Math.random.
  return nextState;
}
```

Rendering reads the latest session state but never changes it. Sound/particles
are emitted as frame events and only committed once the frame is confirmed.

## Ranked/unranked session wiring

```js
import { SupabaseRollbackTransport } from './rollback/realtimeTransport.js';
import { RollbackSession } from './rollback/rollbackSession.js';
import { createInitialRankedState, stepRankedPrototype } from './rollback/deterministicSimulation.js';

const transport = new SupabaseRollbackTransport({
  matchId,
  playerId: me.id,
  mode, // ranked or unranked
});
await transport.connect();

const session = new RollbackSession({
  matchId,
  playerId: me.id,
  playerRole: role, // host or guest
  initialState: createInitialRankedState({ mode, host, guest }),
  stepFrame: stepRankedPrototype, // isolated smoke test only
  sendInput: packet => transport.sendInput(packet),
  sendChecksum: packet => transport.sendChecksum(packet),
  onDesync: details => console.error('ROLLBACK DESYNC', details),
});

transport.on('input', packet => session.receiveRemoteInput(packet));
transport.on('checksum', packet => session.receiveRemoteChecksum(packet));

// Exactly 60 times per second:
const stateToDraw = session.advance(currentInputObject);
```

Run simulation ticks using a fixed-step accumulator. `requestAnimationFrame`
may render at any refresh rate, but it must not decide simulation time.

The production screen uses `stepElement6OnlineFrame` instead.

## Security rule for ranked

Never let the browser directly award ELO or tokens. The server/database must
validate and finalize ranked results. Checksums detect accidental desync; they
do not stop a modified client from cheating.
