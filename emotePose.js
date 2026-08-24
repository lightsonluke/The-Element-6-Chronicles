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
export function getEmotePoseVars(emoteId, progress, facing) {
  const fn = EMOTE_POSES[emoteId];
  if (!fn) return null;
  const raw = fn(progress, facing);
  const p = mirror(raw, facing);
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