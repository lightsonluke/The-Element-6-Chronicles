import { BATTLE_PASSES_2027 } from './season2027.js';

const PALETTE = {
  'frost-found-2027': '#9DEBFF',
  'yokai-rising-2027': '#C06CFF',
  'petal-metal-2027': '#FF85B3',
  'six-oclock-2027': '#FFD76A',
  'out-of-this-element-2027': '#69CFFF',
  'sixth-eclipse-2027': '#F65C73',
};

export const MOVEMENT_TRAILS = Object.freeze(BATTLE_PASSES_2027.flatMap(pass =>
  pass.rewards.filter(reward => reward.type === 'trail').map(reward => Object.freeze({
    ...reward,
    passId: pass.id,
    passName: pass.name,
    color: PALETTE[pass.id] || '#C6A7FF',
  })),
));

const TRAILS_BY_ID = new Map(MOVEMENT_TRAILS.map(trail => [trail.id, trail]));
export const getMovementTrail = id => TRAILS_BY_ID.get(id) || null;
export const MOVEMENT_TRAIL_IDS = Object.freeze(MOVEMENT_TRAILS.map(trail => trail.id));

function drawParticle(ctx, x, y, size, type, color, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (type === 'petal') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.55, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'star' || type === 'snow') {
    ctx.lineWidth = Math.max(1, size * 0.16);
    ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
    ctx.moveTo(0, -size); ctx.lineTo(0, size);
    if (type === 'star') {
      ctx.moveTo(-size * 0.7, -size * 0.7); ctx.lineTo(size * 0.7, size * 0.7);
      ctx.moveTo(size * 0.7, -size * 0.7); ctx.lineTo(-size * 0.7, size * 0.7);
    }
    ctx.stroke();
  } else if (type === 'confetti') {
    ctx.fillRect(-size * 0.45, -size * 0.25, size * 0.9, size * 0.5);
  } else {
    ctx.beginPath(); ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Draws a purely visual trail from bounded render history; it never mutates fighter state. */
export function drawMovementTrail(ctx, fighter, trailId, histories, slot = 'fighter', scale = 1) {
  const trail = getMovementTrail(trailId);
  if (!trail || !fighter || !histories) {
    if (histories) delete histories[slot];
    return;
  }

  let history = histories[slot];
  if (!history || history.id !== trail.id || fighter.frame < history.lastFrame) {
    history = histories[slot] = { id: trail.id, lastFrame: -1, points: [] };
  }
  if (history.lastFrame !== fighter.frame) {
    history.points.push({ x: fighter.x, y: fighter.y - 20 * scale, frame: fighter.frame, facing: fighter.facing || 1 });
    history.lastFrame = fighter.frame;
    if (history.points.length > 18) history.points.splice(0, history.points.length - 18);
  }
  const points = history.points;
  if (points.length < 2) return;

  const label = trail.name.toLowerCase();
  const particleType = /petal|butterfly/.test(label) ? 'petal'
    : /snow|frost|aurora/.test(label) ? 'snow'
      : /starlight|comet|eclipse/.test(label) ? 'star'
        : /confetti|sparkler/.test(label) ? 'confetti' : 'glow';
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, 7 * scale);
  ctx.globalAlpha = 0.26;
  ctx.strokeStyle = trail.color;
  ctx.shadowColor = trail.color;
  ctx.shadowBlur = 10 * scale;
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let index = 0; index < points.length; index += 2) {
    const point = points[index];
    const ageAlpha = 0.08 + 0.42 * (index / Math.max(1, points.length - 1));
    const hue = index % 4 === 0 ? trail.color : `${trail.color}CC`;
    ctx.globalAlpha = ageAlpha;
    drawParticle(ctx, point.x, point.y, (3 + (index % 3)) * scale, particleType, hue, (point.frame * 0.07) + index);
  }
  ctx.restore();
}
