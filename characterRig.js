// Shared Element 6 rig. Expanded locomotion states + Gen-1 detailed art dispatch.
// Preserves the original rounded silhouette and colours while giving every limb
// real elbow/knee articulation. Gen 1 characters (g1_*) use the detailed drawers
// in gen1DetailedDraw.js so they match the authored reference designs.

import { getEmotePoseVars } from './emotePose.js';
import { drawGen1Character } from './gen1DetailedDraw.js';

const rotate = (x, y, angle) => ({
  x: x * Math.cos(angle) - y * Math.sin(angle),
  y: x * Math.sin(angle) + y * Math.cos(angle),
});
const midpoint = (a, b, amount = 0.5) => ({
  x: a.x + (b.x - a.x) * amount,
  y: a.y + (b.y - a.y) * amount,
});

export function getCharacterRig(frame = 0, state = 'idle', facing = 1, scale = 1, powerActive = null, emote = null, charData = null) {
  if (powerActive === 'range_boost') scale *= 1.35;
  const s = 42 * scale;
  let bob = 0, lean = 0, leftArm = 0.08, rightArm = -0.08, leftLeg = -0.09, rightLeg = 0.09;
  const time = frame * 0.18;

  if (emote) {
    const pose = getEmotePoseVars(emote.id, emote.progress, facing, charData);
    if (pose) {
      bob = pose.bob || 0;
      lean = pose.lean || 0;
      leftArm += (pose.armSwingL || 0) + (pose.punchArmL || 0);
      rightArm += (pose.armSwingR || 0) + (pose.punchArmR || 0);
      leftLeg += pose.legLOver ?? -(pose.legSwing || 0);
      rightLeg += pose.legROver ?? (pose.legSwing || 0);
    }
  } else if (state === 'moving' || state === 'running') {
    const stride = Math.sin(time);
    bob = -Math.abs(stride) * 2.7;
    lean = facing * 0.11;
    leftLeg = -stride * 0.62;
    rightLeg = stride * 0.62;
    leftArm = stride * 0.56;
    rightArm = -stride * 0.56;
  } else if (state === 'dashing' || state === 'airdash') {
    bob = -2;
    lean = facing * 0.32;
    leftLeg = -0.85;
    rightLeg = 0.55;
    leftArm = facing > 0 ? 0.9 : -1.1;
    rightArm = facing > 0 ? -1.1 : 0.9;
  } else if (state === 'wallslide') {
    bob = 1;
    lean = -facing * 0.18;
    leftLeg = facing > 0 ? -0.35 : 0.7;
    rightLeg = facing > 0 ? 0.7 : -0.35;
    leftArm = 0.35;
    rightArm = -0.35;
  } else if (state === 'jumping') {
    bob = -6;
    leftLeg = -0.64;
    rightLeg = 0.48;
    leftArm = -0.82;
    rightArm = 0.68;
  } else if (state === 'falling') {
    bob = -3;
    leftLeg = -0.4;
    rightLeg = 0.35;
    leftArm = -0.55;
    rightArm = 0.5;
  } else if (state === 'landing') {
    bob = 8;
    leftLeg = -0.55;
    rightLeg = 0.55;
    leftArm = 0.4;
    rightArm = -0.4;
  } else if (state === 'hitstun' || state === 'stunned') {
    bob = 3;
    lean = -facing * 0.26;
    leftLeg = -0.34;
    rightLeg = 0.32;
    leftArm = 0.72;
    rightArm = -0.54;
  } else if (state === 'crouching') {
    bob = 10;
    leftLeg = -0.44;
    rightLeg = 0.44;
    leftArm = 0.37;
    rightArm = -0.37;
  } else if (state === 'attacking' || state === 'superAttack') {
    lean = facing * (state === 'superAttack' ? 0.2 : 0.15);
    leftArm = facing > 0 ? -1.16 : 0.42;
    rightArm = facing > 0 ? 0.34 : 1.16;
    leftLeg = -0.22;
    rightLeg = 0.25;
  } else if (state === 'kick' || state === 'soccerKick') {
    lean = facing * 0.16;
    leftLeg = facing > 0 ? -0.18 : 0.82;
    rightLeg = facing > 0 ? 0.82 : -0.18;
    leftArm = 0.5;
    rightArm = -0.5;
  } else if (state === 'set' || state === 'volleySet') {
    bob = -2;
    leftArm = -2.04;
    rightArm = 2.04;
    leftLeg = -0.22;
    rightLeg = 0.22;
  } else if (state === 'bump' || state === 'volleyBump') {
    bob = 5;
    lean = facing * 0.1;
    leftArm = facing > 0 ? -0.96 : 0.68;
    rightArm = facing > 0 ? -0.68 : 0.96;
    leftLeg = -0.3;
    rightLeg = 0.3;
  } else if (state === 'spike' || state === 'volleySpike') {
    bob = -6;
    lean = facing * 0.25;
    leftArm = facing > 0 ? -2.12 : 0.4;
    rightArm = facing > 0 ? 0.28 : 2.12;
    leftLeg = -0.56;
    rightLeg = 0.56;
  } else if (state === 'throw' || state === 'dodgeThrow') {
    lean = facing * 0.2;
    leftArm = facing > 0 ? -1.76 : 0.3;
    rightArm = facing > 0 ? 0.16 : 1.76;
    leftLeg = -0.24;
    rightLeg = 0.24;
  }

  const headR = s * 0.34;
  const rawHead = { x: 0, y: -s * 1.7 + bob };
  const rawTop = { x: 0, y: -s * 1.7 + bob + headR + s * 0.05 };
  const rawBottom = { x: 0, y: rawTop.y + s * 0.72 };
  const head = rotate(rawHead.x, rawHead.y, lean);
  const torsoTop = rotate(rawTop.x, rawTop.y, lean);
  const torsoBottom = rotate(rawBottom.x, rawBottom.y, lean);
  const shoulders = {
    left: rotate(-s * 0.2, rawTop.y + s * 0.15, lean),
    right: rotate(s * 0.2, rawTop.y + s * 0.15, lean),
  };
  const hips = {
    left: rotate(-s * 0.13, rawBottom.y, lean),
    right: rotate(s * 0.13, rawBottom.y, lean),
  };
  const endpoint = (origin, length, angle) => {
    const point = rotate(0, length, angle + lean);
    return { x: origin.x + point.x, y: origin.y + point.y };
  };
  const hands = {
    left: endpoint(shoulders.left, s * 0.72, -0.26 + leftArm),
    right: endpoint(shoulders.right, s * 0.72, 0.26 + rightArm),
  };
  const feet = {
    left: endpoint(hips.left, s * 0.88, leftLeg),
    right: endpoint(hips.right, s * 0.88, rightLeg),
  };

  return {
    s,
    lean,
    headR,
    head,
    torsoTop,
    torsoBottom,
    shoulders,
    hips,
    hands,
    feet,
    elbows: {
      left: midpoint(shoulders.left, hands.left),
      right: midpoint(shoulders.right, hands.right),
    },
    knees: {
      left: midpoint(hips.left, feet.left, 0.52),
      right: midpoint(hips.right, feet.right, 0.52),
    },
    armAngleL: -0.26 + leftArm + lean,
    armAngleR: 0.26 + rightArm + lean,
    legAngleL: leftLeg + lean,
    legAngleR: rightLeg + lean,
  };
}

function limb(ctx, start, joint, end, radius, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(joint.x, joint.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(joint.x, joint.y, radius * 0.72, 0, Math.PI * 2);
  ctx.fill();
}

function foot(ctx, point, angle, s, color) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-s * 0.14, -s * 0.08, s * 0.28, s * 0.16, s * 0.07);
  ctx.fill();
  ctx.restore();
}

/**
 * Main character drawer.
 * Gen 1 characters (ids starting with g1_) are routed to the detailed
 * reference-matching art in gen1DetailedDraw.js.
 * All other characters keep the classic Element 6 rounded rig.
 */
export function drawElement6Rig(ctx, frame, color, facing, state, charData, powerActive, emote, scale = 1) {
  const rig = getCharacterRig(frame, state, facing, scale, powerActive, emote, charData);
  const id = charData?.id || '';

  if (id.startsWith('g1_')) {
    drawGen1Character(ctx, rig, frame, facing, state, charData, scale);
    return rig;
  }

  const ap = charData?.appearance || {};
  const torsoColor = ap.torso || color;
  const headColor = ap.head || torsoColor;
  const armL = ap.armL || torsoColor;
  const armR = ap.armR || torsoColor;
  const legL = ap.legL || torsoColor;
  const legR = ap.legR || torsoColor;

  ctx.save();
  ctx.shadowColor = torsoColor;
  ctx.shadowBlur = 10;

  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, rig.s * 0.105, legL);
  limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, rig.s * 0.105, legR);
  foot(ctx, rig.feet.left, rig.legAngleL + facing * 0.2, rig.s, legL);
  foot(ctx, rig.feet.right, rig.legAngleR + facing * 0.2, rig.s, legR);

  const width = rig.s * 0.43;
  const torsoHeight = Math.max(rig.s * 0.62, rig.torsoBottom.y - rig.torsoTop.y);
  ctx.fillStyle = torsoColor;
  ctx.beginPath();
  ctx.roundRect(-width / 2, rig.torsoTop.y, width, torsoHeight, rig.s * 0.12);
  ctx.fill();

  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, rig.s * 0.095, armL);
  limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, rig.s * 0.095, armR);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  ctx.beginPath();
  ctx.roundRect(-width * 0.34, rig.torsoTop.y + rig.s * 0.07, width * 0.68, rig.s * 0.11, rig.s * 0.05);
  ctx.fill();

  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(rig.head.x, rig.head.y, rig.headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return rig;
}
