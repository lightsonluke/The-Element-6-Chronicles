// Generic deterministic stage motion helpers shared by the editor/preview/runtime.
// Directions use the 8 compass vectors. A chain can contain up to 10 one-way steps.
export const MOTION_DIRECTIONS = {
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  upLeft: { x: -1, y: -1 }, upRight: { x: 1, y: -1 }, downLeft: { x: -1, y: 1 }, downRight: { x: 1, y: 1 },
};

export function directionVector(name = 'right') {
  const v = MOTION_DIRECTIONS[name] || MOTION_DIRECTIONS.right;
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

export function makeMotionStep(direction = 'right', distance = 200, speed = 100) {
  return { direction, distance: Math.max(0, Number(distance) || 0), speed: Math.max(1, Number(speed) || 1) };
}

export function normalizeMotion(motion) {
  if (!motion || motion.enabled === false) return null;
  const steps = Array.isArray(motion.chain) ? motion.chain.slice(0, 10).map(s => makeMotionStep(s.direction, s.distance, s.speed)) : [];
  return {
    enabled: true,
    mode: motion.mode === 'pingpong' ? 'pingpong' : (steps.length ? 'chain' : 'oneway'),
    direction: motion.direction || 'right',
    distance: Math.max(0, Number(motion.distance) || 0),
    speed: Math.max(1, Number(motion.speed) || 100),
    loop: !!motion.loop,
    chain: steps,
    phase: Number(motion.phase) || 0,
  };
}

function elapsedSeconds(now, start) {
  return Math.max(0, (Number(now) - Number(start)) / 1000);
}

function oneWayOffset(step, t) {
  const dir = directionVector(step.direction);
  const distance = Math.max(0, Number(step.distance) || 0);
  const speed = Math.max(1, Number(step.speed) || 1);
  return { x: dir.x * Math.min(distance, speed * Math.max(0, t)), y: dir.y * Math.min(distance, speed * Math.max(0, t)), done: t >= distance / speed };
}

export function sampleMotion(motion, nowMs, startMs, state = {}) {
  const m = normalizeMotion(motion);
  if (!m) return { x: 0, y: 0, done: true, state };
  const t = elapsedSeconds(nowMs, startMs);

  if (m.mode === 'pingpong') {
    const distance = Math.max(0, m.distance);
    const speed = Math.max(1, m.speed);
    if (!distance) return { x: 0, y: 0, done: false, state };
    const span = distance / speed;
    const cycle = span * 2;
    const local = ((t + (m.phase || 0)) % cycle + cycle) % cycle;
    const d = local <= span ? local * speed : distance - (local - span) * speed;
    const dir = directionVector(m.direction);
    return { x: dir.x * d, y: dir.y * d, done: false, state };
  }

  const chain = m.chain.length ? m.chain : [makeMotionStep(m.direction, m.distance, m.speed)];
  const durations = chain.map(step => step.distance / step.speed);
  const totalDuration = durations.reduce((a, b) => a + b, 0);
  const totalDistance = chain.reduce((acc, step) => {
    const dir = directionVector(step.direction);
    return { x: acc.x + dir.x * step.distance, y: acc.y + dir.y * step.distance };
  }, { x: 0, y: 0 });

  if (!totalDuration) return { x: 0, y: 0, done: !m.loop, state };

  const completedCycles = m.loop ? Math.floor(t / totalDuration) : 0;
  let remaining = m.loop ? t - completedCycles * totalDuration : Math.min(t, totalDuration);
  let x = totalDistance.x * completedCycles;
  let y = totalDistance.y * completedCycles;
  let stepIndex = chain.length - 1;

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    const duration = durations[i];
    const dir = directionVector(step.direction);
    if (remaining <= duration) {
      const d = Math.min(step.distance, remaining * step.speed);
      x += dir.x * d;
      y += dir.y * d;
      stepIndex = i;
      return { x, y, done: !m.loop && t >= totalDuration, state: { ...state, stepIndex, loopCount: completedCycles } };
    }
    x += dir.x * step.distance;
    y += dir.y * step.distance;
    remaining -= duration;
  }

  return { x, y, done: !m.loop, state: { ...state, stepIndex, loopCount: completedCycles } };
}

export function movePathLabel(motion) {
  const m = normalizeMotion(motion);
  if (!m) return 'STATIC';
  if (m.mode === 'pingpong') return `↔ ${m.direction}`;
  if (m.chain.length) return `${m.chain.length}-STEP CHAIN${m.loop ? ' ↻' : ''}`;
  return `${m.direction}${m.loop ? ' ↻' : ''}`;
}
