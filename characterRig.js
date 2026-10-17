// Shared Element 6 rig. It preserves the original rounded silhouette and colours,
// while giving every limb real elbow/knee articulation.
import { getEmotePoseVars } from './emotePose.js';

const rotate = (x, y, angle) => ({ x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) });
const midpoint = (a, b, amount = .5) => ({ x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount });

export function getCharacterRig(frame = 0, state = 'idle', facing = 1, scale = 1, powerActive = null, emote = null) {
  if (powerActive === 'range_boost') scale *= 1.35;
  const s = 42 * scale;
  let bob = 0, lean = 0, leftArm = .08, rightArm = -.08, leftLeg = -.09, rightLeg = .09;
  const time = frame * .18;
  if (emote) {
    const pose = getEmotePoseVars(emote.id, emote.progress, facing);
    if (pose) { bob = pose.bob || 0; lean = pose.lean || 0; leftArm += (pose.armSwingL || 0) + (pose.punchArmL || 0); rightArm += (pose.armSwingR || 0) + (pose.punchArmR || 0); leftLeg += pose.legLOver ?? -(pose.legSwing || 0); rightLeg += pose.legROver ?? (pose.legSwing || 0); }
  } else if (state === 'moving' || state === 'running') {
    const stride = Math.sin(time); bob = -Math.abs(stride) * 2.7; lean = facing * .11;
    leftLeg = -stride * .62; rightLeg = stride * .62; leftArm = stride * .56; rightArm = -stride * .56;
  } else if (state === 'jumping') { bob = -6; leftLeg = -.64; rightLeg = .48; leftArm = -.82; rightArm = .68; }
  else if (state === 'hitstun' || state === 'stunned') { bob = 3; lean = -facing * .26; leftLeg = -.34; rightLeg = .32; leftArm = .72; rightArm = -.54; }
  else if (state === 'crouching') { bob = 10; leftLeg = -.44; rightLeg = .44; leftArm = .37; rightArm = -.37; }
  else if (state === 'attacking' || state === 'superAttack') { lean = facing * (state === 'superAttack' ? .2 : .15); leftArm = facing > 0 ? -1.16 : .42; rightArm = facing > 0 ? .34 : 1.16; leftLeg = -.22; rightLeg = .25; }
  else if (state === 'kick' || state === 'soccerKick') { lean = facing * .16; leftLeg = facing > 0 ? -.18 : .82; rightLeg = facing > 0 ? .82 : -.18; leftArm = .5; rightArm = -.5; }
  else if (state === 'set' || state === 'volleySet') { bob = -2; leftArm = -2.04; rightArm = 2.04; leftLeg = -.22; rightLeg = .22; }
  else if (state === 'bump' || state === 'volleyBump') { bob = 5; lean = facing * .1; leftArm = facing > 0 ? -.96 : .68; rightArm = facing > 0 ? -.68 : .96; leftLeg = -.3; rightLeg = .3; }
  else if (state === 'spike' || state === 'volleySpike') { bob = -6; lean = facing * .25; leftArm = facing > 0 ? -2.12 : .4; rightArm = facing > 0 ? .28 : 2.12; leftLeg = -.56; rightLeg = .56; }
  else if (state === 'throw' || state === 'dodgeThrow') { lean = facing * .2; leftArm = facing > 0 ? -1.76 : .3; rightArm = facing > 0 ? .16 : 1.76; leftLeg = -.24; rightLeg = .24; }

  const headR = s * .34;
  const rawHead = { x: 0, y: -s * 1.7 + bob }, rawTop = { x: 0, y: -s * 1.7 + bob + headR + s * .05 };
  const rawBottom = { x: 0, y: rawTop.y + s * .72 };
  const head = rotate(rawHead.x, rawHead.y, lean), torsoTop = rotate(rawTop.x, rawTop.y, lean), torsoBottom = rotate(rawBottom.x, rawBottom.y, lean);
  const shoulders = { left: rotate(-s * .20, rawTop.y + s * .15, lean), right: rotate(s * .20, rawTop.y + s * .15, lean) };
  const hips = { left: rotate(-s * .13, rawBottom.y, lean), right: rotate(s * .13, rawBottom.y, lean) };
  const endpoint = (origin, length, angle) => { const point = rotate(0, length, angle + lean); return { x: origin.x + point.x, y: origin.y + point.y }; };
  const hands = { left: endpoint(shoulders.left, s * .72, -.26 + leftArm), right: endpoint(shoulders.right, s * .72, .26 + rightArm) };
  const feet = { left: endpoint(hips.left, s * .88, leftLeg), right: endpoint(hips.right, s * .88, rightLeg) };
  return { s, lean, headR, head, torsoTop, torsoBottom, shoulders, hips, hands, feet, elbows: { left: midpoint(shoulders.left, hands.left), right: midpoint(shoulders.right, hands.right) }, knees: { left: midpoint(hips.left, feet.left, .52), right: midpoint(hips.right, feet.right, .52) }, armAngleL: -.26 + leftArm + lean, armAngleR: .26 + rightArm + lean, legAngleL: leftLeg + lean, legAngleR: rightLeg + lean };
}

function limb(ctx, start, joint, end, radius, color) {
  ctx.strokeStyle = color; ctx.lineWidth = radius * 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(joint.x, joint.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(joint.x, joint.y, radius * .72, 0, Math.PI * 2); ctx.fill();
}
function foot(ctx, point, angle, s, color) {
  ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(angle); ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-s * .14, -s * .08, s * .28, s * .16, s * .07); ctx.fill(); ctx.restore();
}

export function drawElement6Rig(ctx, frame, color, facing, state, charData, powerActive, emote, scale = 1) {
  const rig = getCharacterRig(frame, state, facing, scale, powerActive, emote);
  const ap = charData?.appearance || {}, torsoColor = ap.torso || color, headColor = ap.head || torsoColor;
  const armL = ap.armL || torsoColor, armR = ap.armR || torsoColor, legL = ap.legL || torsoColor, legR = ap.legR || torsoColor;
  ctx.save(); ctx.shadowColor = torsoColor; ctx.shadowBlur = 10;
  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, rig.s * .105, legL); limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, rig.s * .105, legR);
  foot(ctx, rig.feet.left, rig.legAngleL + facing * .2, rig.s, legL); foot(ctx, rig.feet.right, rig.legAngleR + facing * .2, rig.s, legR);
  const width = rig.s * .43, torsoHeight = Math.max(rig.s * .62, rig.torsoBottom.y - rig.torsoTop.y);
  ctx.fillStyle = torsoColor; ctx.beginPath(); ctx.roundRect(-width / 2, rig.torsoTop.y, width, torsoHeight, rig.s * .12); ctx.fill();
  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, rig.s * .095, armL); limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, rig.s * .095, armR);
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.roundRect(-width * .34, rig.torsoTop.y + rig.s * .07, width * .68, rig.s * .11, rig.s * .05); ctx.fill();
  // No eyes: retain the original Element 6 face silhouette.
  ctx.fillStyle = headColor; ctx.beginPath(); ctx.arc(rig.head.x, rig.head.y, rig.headR, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); return rig;
}
