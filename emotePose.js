// Emote pose engine — calculates limb positions for animated emotes.
// Characters have NO elbows or knees, so all movement is whole-arm, whole-leg,
// torso, head, and body movement only.
//
// Each emote returns { bob, lean, armL, armR, legL, legR } where:
//   bob   — vertical body offset (negative = up)
//   lean  — torso rotation angle
//   armL  — left arm absolute angle (0 = down, -π/2 = fwd, -π = up, +π/2 = back)
//   armR  — right arm absolute angle (same convention)
//   legL  — left leg absolute angle (0 = down, + = left, - = right)
//   legR  — right leg absolute angle
//
// Facing is handled by mirroring: when facing left, left/right arms swap and negate.
import { getCharacterPresentation } from './characterPresentation.js';
import { BATTLE_PASSES_2027 } from './season2027.js';

const PI = Math.PI;
const HALF_PI = PI / 2;

// Arm angle presets
const A_DOWN = 0;
const A_FWD = -HALF_PI;
const A_UP = -PI;
const A_BACK = HALF_PI;
const A_DOWN_FWD = -0.3;
const A_DOWN_BACK = 0.3;

// ── Helper: ease in-out ──
function easeIO(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
// ── Helper: ease out ──
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
// ── Helper: ease in ──
function easeIn(t) { return t * t; }
// ── Helper: triangle wave 0→1→0 ──
function tri(t) { return 1 - Math.abs((t * 2) % 2 - 1); }
// ── Helper: smooth sine wave 0→1→0 ──
function sin01(t, speed) { return (Math.sin(t * speed * PI * 2) + 1) / 2; }

// ── Mirror a pose for facing left ──
function mirror(pose, facing) {
  if (facing === 1) return pose;
  return {
    bob: pose.bob,
    lean: -pose.lean,
    armL: -pose.armR,
    armR: -pose.armL,
    legL: -pose.legR,
    legR: -pose.legL,
  };
}

// ── Main entry: get emote pose vars ──
// Returns { bob, lean, armSwingL, armSwingR, legSwing, punchArmL, punchArmR, legLOver, legROver }
export function getEmotePoseVars(emoteId, progress, facing, character = null) {
  const fn = EMOTE_POSES[emoteId];
  if (!fn) return null;
  // Keep every named emote on the same 0→1 timeline in matches and previews.
  // A timer can briefly overshoot at the end of a frame; clamp it so poses
  // never jump into extrapolated, unintended limb positions.
  const t = Math.max(0, Math.min(1, Number(progress) || 0));
  const raw = fn(t, facing);
  const p = mirror(raw, facing);
  // Every gesture eases cleanly through neutral at both ends. The expressive
  // identity layer below is bounded by the same envelope, so it cannot strand
  // a fighter in an elemental flourish when the emote timer expires.
  const smooth = value => { const n = Math.max(0, Math.min(1, value)); return n * n * (3 - 2 * n); };
  const edge = smooth(t / 0.12) * smooth((1 - t) / 0.14);
  p.bob *= edge; p.lean *= edge;
  p.armL *= edge; p.armR *= edge; p.legL *= edge; p.legR *= edge;

  const identity = getCharacterPresentation(character);
  const pulse = Math.sin((t * 2.1 + identity.phase) * PI * 2);
  const wave = Math.sin((t * 1.25 + identity.phase * 0.62) * PI * 2);
  const force = edge * identity.flourish;
  const power = identity.temperament === 'calm' ? 0.68 : identity.temperament === 'bold' ? 1.18 : 1;
  switch (identity.element) {
    case 'fire':
      p.bob -= Math.abs(pulse) * 1.15 * force * power;
      p.lean += pulse * 0.035 * force * power;
      p.armR += wave * 0.09 * force;
      break;
    case 'water':
      p.lean += wave * 0.055 * force;
      p.armL += pulse * 0.055 * force;
      p.armR -= pulse * 0.055 * force;
      p.legL += wave * 0.035 * force;
      p.legR -= wave * 0.035 * force;
      break;
    case 'wind':
      p.bob -= pulse * 1.35 * force * identity.speed;
      p.lean += wave * 0.045 * force;
      p.legL += pulse * 0.055 * force;
      p.legR -= pulse * 0.055 * force;
      break;
    case 'lightning':
      p.lean += pulse * 0.052 * force;
      p.armL += Math.sin(t * PI * 8 + identity.phase) * 0.07 * force;
      p.armR -= Math.sin(t * PI * 8 + identity.phase) * 0.07 * force;
      break;
    case 'frost':
      p.lean += wave * 0.028 * force;
      p.armL += pulse * 0.035 * force;
      p.armR += pulse * 0.035 * force;
      break;
    case 'plant':
      p.lean += wave * 0.06 * force;
      p.armL += Math.sin(t * PI * 2 + identity.phase) * 0.065 * force;
      p.armR += Math.sin(t * PI * 2 + identity.phase + 0.8) * 0.065 * force;
      break;
    case 'earth': case 'metal':
      p.bob += Math.max(0, pulse) * 0.9 * force;
      p.lean *= 0.88;
      p.armL *= 0.94; p.armR *= 0.94;
      break;
    case 'shadow':
      p.lean += wave * 0.04 * force;
      p.armL -= 0.035 * force;
      p.armR += 0.035 * force;
      break;
    case 'space':
      p.lean += Math.sin((t * 1.7 + identity.phase) * PI * 2) * 0.05 * force;
      p.armL += pulse * 0.07 * force;
      p.armR -= wave * 0.07 * force;
      break;
    case 'time':
      p.lean += pulse * 0.025 * force;
      p.bob += wave * 0.85 * force;
      break;
    case 'light': case 'spirit':
      p.bob -= Math.max(0, pulse) * 0.95 * force;
      p.armL -= 0.035 * force;
      p.armR += 0.035 * force;
      break;
    case 'mind':
      p.lean += pulse * 0.035 * force;
      p.armL += wave * 0.065 * force;
      p.armR -= wave * 0.065 * force;
      break;
    default:
      p.lean += pulse * 0.025 * force;
  }
  // Canon weapons and era language provide a second, character-specific layer:
  // reach weapons arc, blades cut cleanly, guards stay composed, and brawlers
  // hit the beat. The bounded envelope above keeps every flourish readable and
  // returns each pose to the neutral rig at the start and end of the emote.
  const eraStyle = [1.08, 1.12, 0.9, 0.94, 1][identity.generation - 1] || 1;
  const weaponForce = force * eraStyle;
  switch (identity.weaponFamily) {
    case 'blade':
      p.lean += wave * 0.024 * weaponForce;
      p.armR += pulse * 0.035 * weaponForce;
      break;
    case 'reach':
      p.lean += pulse * 0.026 * weaponForce;
      p.armL -= wave * 0.03 * weaponForce;
      p.armR += wave * 0.03 * weaponForce;
      break;
    case 'ranged':
      p.lean -= wave * 0.02 * weaponForce;
      p.armL += pulse * 0.025 * weaponForce;
      break;
    case 'guard':
      p.lean *= 0.94;
      p.bob *= 0.94;
      p.armL += 0.018 * weaponForce;
      break;
    case 'brawler':
      p.bob -= Math.abs(pulse) * 0.65 * weaponForce;
      p.lean += pulse * 0.022 * weaponForce;
      break;
    default:
      p.lean += wave * 0.012 * weaponForce;
  }
  // A stable per-character phase makes shared emotes resolve into distinct
  // timing without introducing randomness or changing input/gameplay state.
  p.armL += Math.sin(t * PI * 2 + identity.phase * PI * 2) * 0.014 * weaponForce;
  p.armR -= Math.sin(t * PI * 2 + identity.phase * PI * 2) * 0.014 * weaponForce;
  if (identity.temperament === 'steady') { p.bob *= 0.9; p.lean *= 0.88; }
  if (identity.temperament === 'playful') p.bob -= Math.abs(wave) * 0.8 * force;
  if (identity.temperament === 'bold') p.lean += pulse * 0.018 * force;
  // Convert absolute arm angles to punchArm values
  // armAngleL = -0.28 + finalArmL = -0.28 + armSwingL + punchArmL
  // We set armSwingL = 0, so punchArmL = armL - (-0.28) = armL + 0.28
  // armAngleR = 0.28 + finalArmR = 0.28 + armSwingR + punchArmR
  // We set armSwingR = 0, so punchArmR = armR - 0.28
  return {
    bob: p.bob,
    lean: p.lean,
    armSwingL: 0,
    armSwingR: 0,
    legSwing: 0, // we use legLOver/legROver for independent leg control
    punchArmL: p.armL + 0.28,
    punchArmR: p.armR - 0.28,
    legLOver: p.legL,
    legROver: p.legR,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EMOTE POSE DEFINITIONS — 35 emotes
// Each function takes (progress 0→1, facing 1|-1) and returns a pose.
// Poses are defined for facing=1 (right); mirror() handles facing=-1.
// ═══════════════════════════════════════════════════════════════════════════

const EMOTE_POSES = {

  // 1. Fist Bump — extend forward arm with fist
  fistbump: (t, f) => {
    const ext = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = t > 0.3 && t < 0.8 ? 1 : ext * ret;
    return {
      bob: -2 * hold,
      lean: 0.08 * hold,
      armR: A_FWD * 0.85 * hold + A_DOWN_FWD * (1 - hold),
      armL: A_DOWN_BACK * 0.5 * hold,
      legL: 0.05, legR: -0.05,
    };
  },

  // 2. Yay! — three happy jumps, arms up
  yay: (t) => {
    const jumpT = (t * 3) % 1;
    const jumpY = Math.sin(jumpT * PI) * -12;
    const armsUp = t < 0.9 ? 1 : easeIO((1 - t) / 0.1);
    const wave = Math.sin(t * 12 * PI) * 0.15;
    return {
      bob: jumpY,
      lean: wave,
      armL: A_UP * 0.9 * armsUp + wave * 0.5,
      armR: A_UP * 0.9 * armsUp - wave * 0.5,
      legL: Math.sin(jumpT * PI) * 0.15, legR: -Math.sin(jumpT * PI) * 0.15,
    };
  },

  // 3. L — Take the L dance
  takeL: (t) => {
    const beat = Math.floor(t * 8) % 2;
    const sway = Math.sin(t * 8 * PI) * 0.2;
    return {
      bob: -Math.abs(Math.sin(t * 8 * PI)) * 4,
      lean: sway,
      armL: beat ? A_UP * 0.7 : A_DOWN + 0.5,
      armR: beat ? A_DOWN - 0.5 : A_FWD * 0.6,
      legL: sway * 0.3, legR: -sway * 0.3,
    };
  },

  // 4. High Five — needs shikigami, reach up
  highfive: (t) => {
    const reach = easeOut(Math.min(t * 2, 1));
    const slap = t > 0.4 && t < 0.55 ? Math.sin((t - 0.4) / 0.15 * PI) : 0;
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = reach * ret;
    return {
      bob: -3 * hold + slap * -5,
      lean: 0.1 * hold,
      armL: A_UP * 0.8 * hold + A_FWD * 0.3 * slap,
      armR: A_DOWN_BACK * 0.4 * hold,
      legL: 0.08, legR: -0.08,
    };
  },

  // 5. Wave — raise one arm and wave
  wave: (t) => {
    const raise = easeOut(Math.min(t * 2.5, 1));
    const ret = t > 0.75 ? easeIO((1 - t) / 0.25) : 1;
    const wave = Math.sin(t * 10 * PI) * 0.35;
    const hold = raise * ret;
    return {
      bob: -1 * hold,
      lean: 0,
      armL: A_UP * 0.65 * hold + wave * hold,
      armR: A_DOWN * (1 - hold) + A_DOWN_BACK * 0.3 * hold,
      legL: 0, legR: 0,
    };
  },

  // 6. Come Here — beckon with one arm
  comehere: (t) => {
    const raise = easeOut(Math.min(t * 3, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const beckon = Math.sin(t * 8 * PI) * 0.3;
    const hold = raise * ret;
    return {
      bob: -1 * hold,
      lean: 0.05 * hold,
      armL: A_FWD * 0.7 * hold + beckon * hold,
      armR: A_DOWN_BACK * 0.2 * hold,
      legL: 0, legR: 0,
    };
  },

  // 7. Point — dramatic point forward
  point: (t) => {
    const ext = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = ext * ret;
    return {
      bob: -2 * hold,
      lean: 0.12 * hold,
      armL: A_FWD * 0.95 * hold,
      armR: A_DOWN_BACK * 0.5 * hold,
      legL: 0.1 * hold, legR: -0.05,
    };
  },

  // 8. Laugh — torso bounces back, one arm near body
  laugh: (t) => {
    const bounce = Math.abs(Math.sin(t * 14 * PI)) * 3;
    const ret = t > 0.85 ? easeIO((1 - t) / 0.15) : 1;
    return {
      bob: -bounce * ret,
      lean: -0.15 * ret + Math.sin(t * 14 * PI) * 0.05,
      armL: A_DOWN + 0.4 + Math.sin(t * 14 * PI) * 0.1,
      armR: A_FWD * 0.5 + Math.sin(t * 14 * PI) * 0.15,
      legL: 0, legR: 0,
    };
  },

  // 9. Shrug — arms out, head tilt
  shrug: (t) => {
    const raise = easeOut(Math.min(t * 2.5, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = raise * ret;
    const tilt = Math.sin(t * 3 * PI) * 0.1;
    return {
      bob: -2 * hold,
      lean: tilt * hold,
      armL: A_DOWN + 0.8 * hold,
      armR: A_DOWN - 0.8 * hold,
      legL: 0, legR: 0,
    };
  },

  // 10. Facepalm — arm covers face
  facepalm: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = raise * ret;
    return {
      bob: -1 * hold,
      lean: 0.08 * hold,
      armL: A_UP * 0.7 * hold + A_FWD * 0.1 * hold,
      armR: A_DOWN * (1 - hold),
      legL: 0, legR: 0,
    };
  },

  // 11. Bow — lean forward deeply
  bow: (t) => {
    const dip = easeIO(Math.min(t * 2, 1));
    const ret = t > 0.6 ? easeIO((1 - t) / 0.4) : 1;
    const hold = dip * ret;
    return {
      bob: 0,
      lean: 0.5 * hold,
      armL: A_DOWN - 0.3 * hold,
      armR: A_DOWN + 0.3 * hold,
      legL: 0, legR: 0,
    };
  },

  // 12. Victory — confident pose, arms out
  victory: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.75 ? easeIO((1 - t) / 0.25) : 1;
    const hold = raise * ret;
    return {
      bob: -3 * hold,
      lean: 0,
      armL: A_UP * 0.7 * hold,
      armR: A_UP * 0.7 * hold,
      legL: 0.08 * hold, legR: -0.08 * hold,
    };
  },

  // 13. Clap — arms move together repeatedly
  clap: (t) => {
    const clapT = (t * 6) % 1;
    const dist = clapT < 0.5 ? 1 - clapT * 2 : (clapT - 0.5) * 2;
    const ret = t > 0.9 ? easeIO((1 - t) / 0.1) : 1;
    return {
      bob: -Math.abs(Math.sin(t * 12 * PI)) * 2 * ret,
      lean: 0,
      armL: A_FWD * 0.85 * ret + dist * 0.15 * ret,
      armR: A_FWD * 0.85 * ret - dist * 0.15 * ret,
      legL: 0, legR: 0,
    };
  },

  // 14. Respect — arm across body, slight bow
  respect: (t) => {
    const dip = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = dip * ret;
    return {
      bob: 2 * hold,
      lean: 0.2 * hold,
      armL: A_FWD * 0.4 * hold,
      armR: A_FWD * 0.2 * hold,
      legL: 0, legR: 0,
    };
  },

  // 15. Boo — arms raise, gesture outward repeatedly
  boo: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.85 ? easeIO((1 - t) / 0.15) : 1;
    const gesture = Math.sin(t * 8 * PI) * 0.25;
    const hold = raise * ret;
    return {
      bob: -2 * hold,
      lean: 0.1 * hold + gesture * 0.2,
      armL: A_UP * 0.5 * hold + gesture * hold,
      armR: A_UP * 0.5 * hold - gesture * hold,
      legL: 0, legR: 0,
    };
  },

  // 16. Taunt — cocky pose
  taunt: (t) => {
    const pose = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.75 ? easeIO((1 - t) / 0.25) : 1;
    const hold = pose * ret;
    const cocky = Math.sin(t * 4 * PI) * 0.1;
    return {
      bob: -2 * hold,
      lean: 0.15 * hold + cocky,
      armL: A_FWD * 0.6 * hold,
      armR: A_DOWN_BACK * 0.4 * hold,
      legL: 0.1 * hold, legR: -0.05,
    };
  },

  // 17. Bring It — lower body, arms forward
  bringit: (t) => {
    const dip = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = dip * ret;
    const gesture = Math.sin(t * 6 * PI) * 0.15;
    return {
      bob: 4 * hold,
      lean: 0.1 * hold,
      armL: A_FWD * 0.7 * hold + gesture * hold,
      armR: A_FWD * 0.7 * hold - gesture * hold,
      legL: 0.15 * hold, legR: -0.1 * hold,
    };
  },

  // 18. Too Easy — relaxed dismissive pose
  tooeasy: (t) => {
    const pose = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = pose * ret;
    return {
      bob: -1 * hold,
      lean: -0.08 * hold,
      armL: A_UP * 0.4 * hold,
      armR: A_DOWN - 0.3 * hold,
      legL: 0, legR: -0.1 * hold,
    };
  },

  // 19. What Was That? — confused gesture
  whatwas: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = raise * ret;
    const shrug = Math.sin(t * 5 * PI) * 0.15;
    return {
      bob: -1 * hold,
      lean: shrug * hold,
      armL: A_DOWN + 0.6 * hold + shrug * hold,
      armR: A_DOWN - 0.6 * hold - shrug * hold,
      legL: 0, legR: 0,
    };
  },

  // 20. Cry — head down, arms hanging, body shakes
  cry: (t) => {
    const dip = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.85 ? easeIO((1 - t) / 0.15) : 1;
    const hold = dip * ret;
    const shake = Math.sin(t * 20 * PI) * 0.08;
    return {
      bob: 4 * hold,
      lean: 0.2 * hold + shake,
      armL: A_DOWN - 0.2 * hold,
      armR: A_DOWN + 0.2 * hold,
      legL: 0, legR: 0,
    };
  },

  // 21. Angry — body shakes, arms raised
  angry: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.85 ? easeIO((1 - t) / 0.15) : 1;
    const hold = raise * ret;
    const shake = Math.sin(t * 25 * PI) * 0.06;
    return {
      bob: -2 * hold,
      lean: shake,
      armL: A_UP * 0.5 * hold + A_FWD * 0.2 * hold,
      armR: A_UP * 0.5 * hold - A_FWD * 0.2 * hold,
      legL: 0.1 * hold, legR: -0.1 * hold,
    };
  },

  // 22. Sleep — lower body, tilt head, then snap back
  sleep: (t) => {
    const dip = easeIO(Math.min(t * 2.5, 1));
    const ret = t > 0.85 ? 1 - Math.pow((1 - t) / 0.15, 2) : 1;
    const hold = dip * ret;
    const snore = Math.sin(t * 2 * PI) * 1.5;
    return {
      bob: 5 * hold + snore * hold,
      lean: 0.15 * hold,
      armL: A_DOWN - 0.1 * hold,
      armR: A_DOWN + 0.1 * hold,
      legL: 0, legR: 0,
    };
  },

  // 23. Flex — arms out, strong pose
  flex: (t) => {
    const pose = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = pose * ret;
    return {
      bob: -3 * hold,
      lean: 0,
      armL: A_UP * 0.55 * hold,
      armR: A_UP * 0.55 * hold,
      legL: 0.1 * hold, legR: -0.1 * hold,
    };
  },

  // 24. Challenge — extend arm forward, short gesture
  challenge: (t) => {
    const ext = easeOut(Math.min(t * 2.5, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = ext * ret;
    const jab = t > 0.3 && t < 0.5 ? Math.sin((t - 0.3) / 0.2 * PI) * 0.15 : 0;
    return {
      bob: -2 * hold,
      lean: 0.1 * hold,
      armL: A_FWD * 0.8 * hold + jab,
      armR: A_DOWN_BACK * 0.3 * hold,
      legL: 0.08 * hold, legR: -0.05,
    };
  },

  // 25. KO — celebration, arms raise, bounce, point
  ko: (t) => {
    const phase1 = Math.min(t / 0.6, 1);
    const phase2 = t > 0.6 ? (t - 0.6) / 0.4 : 0;
    const bounce = Math.abs(Math.sin(t * 8 * PI)) * 4;
    const celebrate = easeOut(phase1);
    const point = easeOut(phase2);
    return {
      bob: -bounce * celebrate - 2 * point,
      lean: 0.1 * celebrate + 0.15 * point,
      armL: A_UP * 0.7 * celebrate + A_FWD * 0.9 * point,
      armR: A_UP * 0.7 * celebrate * (1 - point) + A_DOWN_BACK * 0.3 * point,
      legL: 0.1 * celebrate, legR: -0.05,
    };
  },

  // 26. Almost — raise one arm, "almost" gesture
  almost: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.75 ? easeIO((1 - t) / 0.25) : 1;
    const hold = raise * ret;
    const pinch = Math.sin(t * 3 * PI) * 0.05;
    return {
      bob: -1 * hold,
      lean: 0.05 * hold,
      armL: A_FWD * 0.6 * hold + pinch * hold,
      armR: A_DOWN_BACK * 0.2 * hold,
      legL: 0, legR: 0,
    };
  },

  // 27. Oops — arms up in surprise, tilt, return
  oops: (t) => {
    const raise = easeOut(Math.min(t * 3, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = raise * ret;
    return {
      bob: -3 * hold,
      lean: -0.1 * hold,
      armL: A_UP * 0.5 * hold,
      armR: A_UP * 0.5 * hold,
      legL: 0, legR: 0,
    };
  },

  // 28. Panic — arms move in and out, body shakes
  panic: (t) => {
    const flap = Math.sin(t * 16 * PI) * 0.4;
    const shake = Math.sin(t * 20 * PI) * 0.06;
    const ret = t > 0.85 ? easeIO((1 - t) / 0.15) : 1;
    return {
      bob: -2 * ret + Math.abs(Math.sin(t * 16 * PI)) * 2 * ret,
      lean: shake * ret,
      armL: (A_DOWN + 0.5 + flap) * ret,
      armR: (A_DOWN - 0.5 - flap) * ret,
      legL: 0, legR: 0,
    };
  },

  // 29. Thinking — hand near head, tilt
  thinking: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = raise * ret;
    const tilt = Math.sin(t * 1.5 * PI) * 0.12;
    return {
      bob: -1 * hold,
      lean: tilt * hold,
      armL: A_FWD * 0.3 * hold + A_UP * 0.2 * hold,
      armR: A_DOWN * (1 - hold) + A_DOWN_BACK * 0.2 * hold,
      legL: 0, legR: 0,
    };
  },

  // 30. Genius — thinking pose then arm up
  genius: (t) => {
    const think = t < 0.6 ? easeOut(t / 0.6) : 1;
    const idea = t > 0.6 ? easeOut((t - 0.6) / 0.4) : 0;
    const ret = t > 0.85 ? easeIO((1 - t) / 0.15) : 1;
    return {
      bob: -1 * think * ret - 4 * idea * ret,
      lean: 0.1 * think * ret - 0.05 * idea * ret,
      armL: (A_FWD * 0.3 + A_UP * 0.2) * think * ret * (1 - idea) + A_UP * 0.8 * idea * ret,
      armR: A_DOWN_BACK * 0.2 * think * ret,
      legL: 0, legR: 0,
    };
  },

  // 31. Chill — relaxed pose, gentle rocking
  chill: (t) => {
    const lean = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const hold = lean * ret;
    const rock = Math.sin(t * 2 * PI) * 0.08;
    return {
      bob: 1 * hold,
      lean: -0.1 * hold + rock * hold,
      armL: A_DOWN - 0.3 * hold,
      armR: A_DOWN + 0.3 * hold,
      legL: 0.05 * hold, legR: -0.05 * hold,
    };
  },

  // 32. Dance — rhythmic torso + arm swings + leg movement
  dance: (t) => {
    const beat = Math.sin(t * 6 * PI);
    const beat2 = Math.cos(t * 6 * PI);
    const ret = t > 0.9 ? easeIO((1 - t) / 0.1) : 1;
    return {
      bob: -Math.abs(beat) * 4 * ret,
      lean: beat * 0.2 * ret,
      armL: (A_DOWN + 0.8 + beat * 0.6) * ret,
      armR: (A_DOWN - 0.8 - beat2 * 0.6) * ret,
      legL: beat2 * 0.2 * ret, legR: -beat2 * 0.2 * ret,
    };
  },

  // 33. Spin — full body spin, end in pose
  spin: (t) => {
    const spinT = Math.min(t / 0.7, 1);
    const pose = t > 0.7 ? easeOut((t - 0.7) / 0.3) : 0;
    const ret = t > 0.9 ? easeIO((1 - t) / 0.1) : 1;
    return {
      bob: -2 * ret + Math.sin(spinT * PI * 4) * 3 * (1 - pose) * ret,
      lean: Math.sin(spinT * PI * 4) * 0.3 * (1 - pose) * ret + 0.1 * pose * ret,
      armL: (A_DOWN + 1.2 + Math.sin(spinT * PI * 4) * 0.5) * (1 - pose) * ret + A_UP * 0.5 * pose * ret,
      armR: (A_DOWN - 1.2 - Math.sin(spinT * PI * 4) * 0.5) * (1 - pose) * ret + A_UP * 0.5 * pose * ret,
      legL: 0.1 * pose * ret, legR: -0.1 * pose * ret,
    };
  },

  // 34. Salute — hand to head, hold, lower
  salute: (t) => {
    const raise = easeOut(Math.min(t * 2, 1));
    const ret = t > 0.7 ? easeIO((1 - t) / 0.3) : 1;
    const hold = raise * ret;
    return {
      bob: -1 * hold,
      lean: 0.05 * hold,
      armL: A_UP * 0.65 * hold + A_FWD * 0.1 * hold,
      armR: A_DOWN * (1 - hold),
      legL: 0, legR: 0,
    };
  },

  // 35. Goodbye — turn, wave, turn back
  goodbye: (t) => {
    const turn = t < 0.2 ? easeOut(t / 0.2) : t > 0.8 ? easeIO((1 - t) / 0.2) : 1;
    const wave = t > 0.2 && t < 0.8 ? Math.sin((t - 0.2) / 0.6 * 8 * PI) * 0.3 : 0;
    return {
      bob: -1 * turn,
      lean: 0.2 * turn,
      armL: A_UP * 0.6 * turn + wave * turn,
      armR: A_DOWN_BACK * 0.3 * turn,
      legL: 0, legR: 0,
    };
  },
};

const SEASONAL_EMOTES = BATTLE_PASSES_2027.flatMap(event => event.rewards.filter(reward => reward.type === 'emote'));
function seasonalPoseStyle(name) {
  if (/drift|skater/.test(name)) return 'glide';
  if (/snowball|toss|firework finale|summer fan/.test(name)) return 'throw';
  if (/spin|dance|bon odori|parade|finale/.test(name)) return 'spin';
  if (/freeze|meditation|stargazing|frame/.test(name)) return 'stillness';
  if (/angel|petal|flower|blossom|springtime|thousand petals/.test(name)) return 'flutter';
  if (/bow|offering|lantern lighting/.test(name)) return 'bow';
  if (/stomp/.test(name)) return 'stomp';
  if (/float|gravity|projection/.test(name)) return 'float';
  if (/vanishing|shadow clone|vanish/.test(name)) return 'vanish';
  if (/ghost lantern|summoning|ritual|orbit|planet/.test(name)) return 'summon';
  if (/head tilt/.test(name)) return 'tilt';
  if (/possession/.test(name)) return 'twitch';
  if (/stretch/.test(name)) return 'stretch';
  if (/stance/.test(name)) return 'stance';
  if (/fan/.test(name)) return 'fan';
  return 'celebrate';
}

function createSeasonalPose(emote, index) {
  const style = seasonalPoseStyle(emote.name.toLowerCase());
  const tempo = 1 + (index % 4) * 0.09;
  const phase = (index % 7) * 0.31;
  return t => {
    const beat = Math.sin(t * PI * 2 * tempo + phase);
    const beat2 = Math.sin(t * PI * 4 * tempo + phase);
    const lift = Math.max(0, Math.sin(t * PI * 2 * tempo + phase));
    const reach = easeOut(Math.min(1, t * 2.8));
    const returnEase = t > 0.76 ? easeIO((1 - t) / 0.24) : 1;
    switch (style) {
      case 'glide':
        return { bob: -2 - lift * 3, lean: .22 + beat * .045, armL: A_DOWN_BACK * .65, armR: A_DOWN_FWD * .8, legL: .24 + beat * .12, legR: -.19 - beat * .1 };
      case 'throw': {
        const release = Math.max(0, Math.min(1, (t - .27) / .24));
        return { bob: -lift * 2, lean: -.1 - release * .16, armL: A_DOWN_BACK * .35, armR: A_UP * (.35 + reach * .48) + release * .3, legL: -.08, legR: .12 + release * .08 };
      }
      case 'spin':
        return { bob: -2 - Math.abs(beat2) * 2, lean: beat * .25, armL: A_FWD * (1 + beat * .12), armR: A_DOWN_BACK * (1 + beat * .12), legL: beat2 * .18, legR: -beat2 * .18 };
      case 'stillness': {
        const settle = t < .32 ? easeOut(t / .32) : 1;
        return { bob: -lift * 1.4, lean: .03 * beat * (1 - settle), armL: A_UP * (.36 + settle * .1), armR: A_UP * (.34 + settle * .12), legL: .03, legR: -.03 };
      }
      case 'flutter':
        return { bob: -1 - lift * 4, lean: beat * .08, armL: A_UP * (.42 + lift * .22) + beat * .08, armR: A_UP * (.4 + Math.max(0, -beat) * .2) - beat * .08, legL: beat2 * .11, legR: -beat2 * .11 };
      case 'bow': {
        const dip = Math.sin(Math.min(1, t * 2.2) * PI) * (t < .7 ? 1 : returnEase);
        return { bob: 2.5 * dip, lean: .3 * dip, armL: A_DOWN_BACK * .28 + .12 * dip, armR: A_DOWN_FWD * .32 - .12 * dip, legL: 0, legR: 0 };
      }
      case 'stomp': {
        const hit = Math.pow(Math.max(0, Math.sin((t * 2.2 + phase) * PI)), 8);
        return { bob: hit * 3 - lift, lean: -.08 + hit * .05, armL: A_UP * .42, armR: A_DOWN_BACK * .4, legL: .24 * hit, legR: -.05 };
      }
      case 'float':
        return { bob: -4 - Math.sin(t * PI * 2 * tempo + phase) * 5, lean: beat * .05, armL: A_DOWN_BACK * .42, armR: A_DOWN_FWD * .42, legL: -.08 - lift * .08, legR: .08 + lift * .08 };
      case 'vanish': {
        const crouch = Math.sin(Math.min(1, t * 1.7) * PI) * (t < .72 ? 1 : returnEase);
        return { bob: 2 + crouch * 2, lean: -.12 - crouch * .12, armL: A_DOWN_BACK * .6, armR: A_DOWN_FWD * .6, legL: .2 * crouch, legR: -.2 * crouch };
      }
      case 'summon':
        return { bob: -lift * 2, lean: -.04 + beat * .035, armL: A_UP * (.4 + reach * .25), armR: A_UP * (.38 + reach * .25), legL: .02, legR: -.02 };
      case 'tilt':
        return { bob: -1, lean: .25 + beat * .08, armL: A_DOWN_BACK * .28, armR: A_DOWN_FWD * .28, legL: 0, legR: 0 };
      case 'twitch':
        return { bob: beat2 * 1.4, lean: beat2 * .09, armL: A_UP * .25 + beat2 * .18, armR: A_DOWN_BACK * .35 - beat2 * .22, legL: beat2 * .08, legR: -beat2 * .08 };
      case 'stretch':
        return { bob: -lift * 2, lean: -.08 * beat, armL: A_UP * (.48 + lift * .12), armR: A_UP * (.48 + Math.max(0, -beat) * .12), legL: -.04, legR: .04 };
      case 'stance':
        return { bob: 1, lean: -.1 + beat * .04, armL: A_UP * .36, armR: A_FWD * .55, legL: .18, legR: -.16 };
      case 'fan':
        return { bob: -lift * 1.5, lean: beat * .12, armL: A_FWD * (.45 + lift * .2), armR: A_UP * (.3 + Math.max(0, -beat) * .25), legL: beat * .05, legR: -beat * .05 };
      default:
        return { bob: -2 - lift * 6, lean: beat * .09, armL: A_UP * (.48 + lift * .17), armR: A_UP * (.46 + Math.max(0, -beat) * .15), legL: beat * .1, legR: -beat * .1 };
    }
  };
}

Object.assign(EMOTE_POSES, Object.fromEntries(SEASONAL_EMOTES.map((emote, index) => [
  emote.id,
  createSeasonalPose(emote, index),
])));
