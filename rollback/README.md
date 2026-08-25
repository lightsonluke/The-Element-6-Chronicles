# Element 6 rollback foundation (ranked + unranked)

These modules provide the networking foundation for two-player ranked and
unranked rollback. They do **not** yet make the existing `OnlineFight.jsx`
rollback-safe on their own.

## What is already here

- Fixed 60 FPS frame numbering
- Compact input packets and input delay
- Remote-input prediction and rollback/replay
- Serializable state snapshots
- Periodic desync checksums
- Supabase Realtime Broadcast transport
- Local latency/jitter/loss testing
- A small deterministic fight simulation for integration tests

## Required fighter refactor before shipping

The current fighter runs directly inside `requestAnimationFrame` and uses
`performance.now()`, variable `dt`, rendering/sound calls and `Math.random()`.
Move the real gameplay mutations into one pure function shaped like this:

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
  stepFrame: stepRankedPrototype, // replace with stepElement6Frame
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

## Security rule for ranked

Never let the browser directly award ELO or tokens. The server/database must
validate and finalize ranked results. Checksums detect accidental desync; they
do not stop a modified client from cheating.

