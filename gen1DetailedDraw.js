// Gen 1 detailed character art — matches the authored reference designs.
// Uses the shared rig for pose / limb positions so running, jumping, dashing,
// wall-sliding, etc. animate correctly while the clothing, hair and accessories
// stay faithful to the provided concept art.

const TAU = Math.PI * 2;

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
  ctx.arc(joint.x, joint.y, radius * 0.72, 0, TAU);
  ctx.fill();
}

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function poly(ctx, pts, color) {
  if (pts.length < 2) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────
// Shared helpers for clothing layers
// ─────────────────────────────────────────────────────────────
function drawShoe(ctx, foot, angle, s, main, accent) {
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(angle);
  // sole
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(-s * 0.16, -s * 0.04, s * 0.32, s * 0.14, s * 0.06);
  ctx.fill();
  // upper
  ctx.fillStyle = main;
  ctx.beginPath();
  ctx.roundRect(-s * 0.14, -s * 0.1, s * 0.28, s * 0.12, s * 0.05);
  ctx.fill();
  ctx.restore();
}

function drawHand(ctx, hand, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, radius, 0, TAU);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────
// FIRE HERO  (spiky orange-red hair, red coat, orange arm stripes)
// ─────────────────────────────────────────────────────────────
function drawFireHero(ctx, rig, facing) {
  const s = rig.s;
  const head = rig.head;
  const headR = rig.headR;

  // Legs / pants (deep red)
  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, s * 0.11, '#8B1A1A');
  limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, s * 0.11, '#8B1A1A');
  drawShoe(ctx, rig.feet.left, rig.legAngleL + facing * 0.15, s, '#CC2200', '#991100');
  drawShoe(ctx, rig.feet.right, rig.legAngleR + facing * 0.15, s, '#CC2200', '#991100');

  // Torso coat (bright red, longer lower edge)
  const tw = s * 0.48;
  const th = Math.max(s * 0.7, rig.torsoBottom.y - rig.torsoTop.y + s * 0.15);
  ctx.fillStyle = '#E8331A';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.55, rig.torsoTop.y);
  ctx.lineTo(tw * 0.55, rig.torsoTop.y);
  ctx.lineTo(tw * 0.62, rig.torsoBottom.y + s * 0.22);
  ctx.lineTo(tw * 0.15, rig.torsoBottom.y + s * 0.08);
  ctx.lineTo(-tw * 0.15, rig.torsoBottom.y + s * 0.08);
  ctx.lineTo(-tw * 0.62, rig.torsoBottom.y + s * 0.22);
  ctx.closePath();
  ctx.fill();

  // Coat highlight stripe
  ctx.fillStyle = '#FF5533';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.35, rig.torsoTop.y + s * 0.05);
  ctx.lineTo(tw * 0.35, rig.torsoTop.y + s * 0.05);
  ctx.lineTo(tw * 0.3, rig.torsoTop.y + s * 0.18);
  ctx.lineTo(-tw * 0.3, rig.torsoTop.y + s * 0.18);
  ctx.closePath();
  ctx.fill();

  // Arms with orange stripes
  const armCol = '#E8331A';
  const stripe = '#FF8800';
  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, s * 0.095, armCol);
  limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, s * 0.095, armCol);

  // Stripe bands on arms
  [[rig.shoulders.left, rig.elbows.left], [rig.elbows.left, rig.hands.left],
   [rig.shoulders.right, rig.elbows.right], [rig.elbows.right, rig.hands.right]].forEach(([a, b]) => {
    const mx = (a.x + b.x) * 0.5, my = (a.y + b.y) * 0.5;
    ctx.strokeStyle = stripe;
    ctx.lineWidth = s * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x * 0.7 + b.x * 0.3, a.y * 0.7 + b.y * 0.3);
    ctx.lineTo(a.x * 0.3 + b.x * 0.7, a.y * 0.3 + b.y * 0.7);
    ctx.stroke();
  });

  drawHand(ctx, rig.hands.left, s * 0.11, '#CC2200');
  drawHand(ctx, rig.hands.right, s * 0.11, '#CC2200');

  // Head (dark red face)
  ctx.fillStyle = '#AA1A0A';
  ctx.beginPath();
  ctx.arc(head.x, head.y, headR, 0, TAU);
  ctx.fill();

  // Spiky fire hair
  const hairCols = ['#FF4400', '#FF6600', '#FF8800'];
  const spikes = [
    [-0.9, -1.1], [-0.55, -1.45], [-0.15, -1.55], [0.25, -1.5],
    [0.6, -1.35], [0.9, -1.05], [0.7, -0.7], [-0.7, -0.65],
    [-0.35, -1.25], [0.4, -1.2],
  ];
  spikes.forEach(([ox, oy], i) => {
    const hx = head.x + ox * headR * 1.15;
    const hy = head.y + oy * headR * 1.1;
    ctx.fillStyle = hairCols[i % 3];
    ctx.beginPath();
    ctx.moveTo(head.x + ox * headR * 0.4, head.y + oy * headR * 0.3);
    ctx.quadraticCurveTo(hx + (i % 2 ? 4 : -4), hy - 6, hx, hy);
    ctx.quadraticCurveTo(hx + (i % 2 ? -5 : 5), hy + 4, head.x + ox * headR * 0.55, head.y + oy * headR * 0.45);
    ctx.closePath();
    ctx.fill();
  });
}

// ─────────────────────────────────────────────────────────────
// WATER HERO  (blue wavy hair, wave-pattern clothes, water scarf)
// ─────────────────────────────────────────────────────────────
function drawWaterHero(ctx, rig, facing, frame) {
  const s = rig.s;
  const head = rig.head;
  const headR = rig.headR;
  const t = frame * 0.12;

  // Legs / pants (dark navy with wave accents)
  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, s * 0.11, '#0A2A5A');
  limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, s * 0.11, '#0A2A5A');
  drawShoe(ctx, rig.feet.left, rig.legAngleL + facing * 0.15, s, '#1A6ACC', '#0A3A8A');
  drawShoe(ctx, rig.feet.right, rig.legAngleR + facing * 0.15, s, '#1A6ACC', '#0A3A8A');

  // Wave patterns on lower legs
  ctx.strokeStyle = '#3AB0FF';
  ctx.lineWidth = 2;
  [rig.knees.left, rig.knees.right].forEach((k, i) => {
    const f = rig.feet[i === 0 ? 'left' : 'right'];
    ctx.beginPath();
    ctx.moveTo(k.x - 6, k.y + 4);
    ctx.quadraticCurveTo(k.x, k.y + 10, k.x + 6, k.y + 4);
    ctx.stroke();
  });

  // Torso – layered blue kimono-like top
  const tw = s * 0.46;
  ctx.fillStyle = '#1A5ACC';
  ctx.beginPath();
  ctx.roundRect(-tw / 2, rig.torsoTop.y, tw, s * 0.68, s * 0.1);
  ctx.fill();

  // White/light wave panel on chest
  ctx.fillStyle = '#A0D8FF';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.35, rig.torsoTop.y + s * 0.08);
  ctx.quadraticCurveTo(0, rig.torsoTop.y + s * 0.02, tw * 0.35, rig.torsoTop.y + s * 0.08);
  ctx.lineTo(tw * 0.25, rig.torsoTop.y + s * 0.35);
  ctx.quadraticCurveTo(0, rig.torsoTop.y + s * 0.42, -tw * 0.25, rig.torsoTop.y + s * 0.35);
  ctx.closePath();
  ctx.fill();

  // Belt with orb
  ctx.fillStyle = '#0A3A8A';
  ctx.fillRect(-tw * 0.4, rig.torsoBottom.y - s * 0.12, tw * 0.8, s * 0.1);
  oval(ctx, 0, rig.torsoBottom.y - s * 0.07, s * 0.09, s * 0.09, '#60C0FF');
  oval(ctx, 0, rig.torsoBottom.y - s * 0.07, s * 0.05, s * 0.05, '#E0F4FF');

  // Arms
  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, s * 0.09, '#0A2A5A');
  limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, s * 0.09, '#0A2A5A');
  // Cuffs
  [rig.elbows.left, rig.elbows.right].forEach(e => {
    oval(ctx, e.x, e.y + 4, s * 0.08, s * 0.05, '#3AB0FF');
  });
  drawHand(ctx, rig.hands.left, s * 0.105, '#0A1A3A');
  drawHand(ctx, rig.hands.right, s * 0.105, '#0A1A3A');

  // Flowing water scarf / cape (animated)
  ctx.save();
  ctx.globalAlpha = 0.9;
  const scarfBase = { x: facing * s * 0.15, y: rig.torsoTop.y + s * 0.1 };
  ctx.fillStyle = '#2A90E0';
  ctx.beginPath();
  ctx.moveTo(scarfBase.x, scarfBase.y);
  ctx.quadraticCurveTo(
    scarfBase.x + facing * s * 0.7 + Math.sin(t) * 6,
    scarfBase.y + s * 0.3,
    scarfBase.x + facing * s * 0.9 + Math.sin(t * 1.3) * 8,
    scarfBase.y + s * 0.7
  );
  ctx.quadraticCurveTo(
    scarfBase.x + facing * s * 0.5,
    scarfBase.y + s * 0.55,
    scarfBase.x + facing * s * 0.2,
    scarfBase.y + s * 0.35
  );
  ctx.closePath();
  ctx.fill();
  // Water droplets
  for (let i = 0; i < 4; i++) {
    const dx = scarfBase.x + facing * (s * 0.5 + i * 8) + Math.sin(t + i) * 4;
    const dy = scarfBase.y + s * 0.4 + i * 10 + Math.cos(t * 1.2 + i) * 3;
    oval(ctx, dx, dy, 3 + (i % 2), 4, '#60D0FF');
  }
  ctx.restore();

  // Head
  ctx.fillStyle = '#0A2A5A';
  ctx.beginPath();
  ctx.arc(head.x, head.y, headR, 0, TAU);
  ctx.fill();

  // Wavy blue hair
  const hairPts = [
    [-1.0, -0.3], [-0.85, -0.9], [-0.5, -1.3], [-0.1, -1.45],
    [0.3, -1.4], [0.65, -1.15], [0.95, -0.7], [0.8, -0.2],
  ];
  ctx.fillStyle = '#1A80E0';
  ctx.beginPath();
  hairPts.forEach(([ox, oy], i) => {
    const hx = head.x + ox * headR * 1.2;
    const hy = head.y + oy * headR * 1.15 + Math.sin(t + i * 0.7) * 1.5;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  });
  ctx.lineTo(head.x + headR * 0.9, head.y + headR * 0.3);
  ctx.lineTo(head.x - headR * 0.9, head.y + headR * 0.3);
  ctx.closePath();
  ctx.fill();
  // Lighter hair accents
  ctx.fillStyle = '#40B0FF';
  ctx.beginPath();
  ctx.moveTo(head.x - headR * 0.3, head.y - headR * 1.1);
  ctx.quadraticCurveTo(head.x, head.y - headR * 1.5, head.x + headR * 0.35, head.y - headR * 1.05);
  ctx.quadraticCurveTo(head.x, head.y - headR * 1.25, head.x - headR * 0.3, head.y - headR * 1.1);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────
// ICE HERO  (white-blue layered robes, diamond gem, white hair)
// ─────────────────────────────────────────────────────────────
function drawIceHero(ctx, rig, facing) {
  const s = rig.s;
  const head = rig.head;
  const headR = rig.headR;

  // Legs – dark blue pants with light trim
  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, s * 0.11, '#1A3A6A');
  limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, s * 0.11, '#1A3A6A');
  drawShoe(ctx, rig.feet.left, rig.legAngleL + facing * 0.15, s, '#2A5A9A', '#A0D0FF');
  drawShoe(ctx, rig.feet.right, rig.legAngleR + facing * 0.15, s, '#2A5A9A', '#A0D0FF');

  // Light cuff on pants
  ctx.strokeStyle = '#A0D0FF';
  ctx.lineWidth = 3;
  [rig.knees.left, rig.knees.right].forEach(k => {
    ctx.beginPath();
    ctx.arc(k.x, k.y + 6, s * 0.12, 0.2, Math.PI - 0.2);
    ctx.stroke();
  });

  // Outer robe (light blue/white)
  const tw = s * 0.5;
  ctx.fillStyle = '#C8E4FF';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.55, rig.torsoTop.y - s * 0.05);
  ctx.lineTo(tw * 0.55, rig.torsoTop.y - s * 0.05);
  ctx.lineTo(tw * 0.7, rig.torsoBottom.y + s * 0.25);
  ctx.lineTo(tw * 0.2, rig.torsoBottom.y + s * 0.1);
  ctx.lineTo(-tw * 0.2, rig.torsoBottom.y + s * 0.1);
  ctx.lineTo(-tw * 0.7, rig.torsoBottom.y + s * 0.25);
  ctx.closePath();
  ctx.fill();

  // Inner dark panel
  ctx.fillStyle = '#2A4A8A';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.28, rig.torsoTop.y + s * 0.1);
  ctx.lineTo(tw * 0.28, rig.torsoTop.y + s * 0.1);
  ctx.lineTo(tw * 0.22, rig.torsoBottom.y - s * 0.05);
  ctx.lineTo(-tw * 0.22, rig.torsoBottom.y - s * 0.05);
  ctx.closePath();
  ctx.fill();

  // Scarf / collar
  ctx.fillStyle = '#E8F4FF';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.45, rig.torsoTop.y - s * 0.02);
  ctx.quadraticCurveTo(0, rig.torsoTop.y - s * 0.18, tw * 0.45, rig.torsoTop.y - s * 0.02);
  ctx.lineTo(tw * 0.35, rig.torsoTop.y + s * 0.15);
  ctx.quadraticCurveTo(0, rig.torsoTop.y + s * 0.08, -tw * 0.35, rig.torsoTop.y + s * 0.15);
  ctx.closePath();
  ctx.fill();

  // Diamond gem on belt
  const gx = 0, gy = rig.torsoBottom.y - s * 0.08;
  ctx.fillStyle = '#40C0FF';
  ctx.beginPath();
  ctx.moveTo(gx, gy - s * 0.1);
  ctx.lineTo(gx + s * 0.08, gy);
  ctx.lineTo(gx, gy + s * 0.1);
  ctx.lineTo(gx - s * 0.08, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#E0F8FF';
  ctx.beginPath();
  ctx.moveTo(gx, gy - s * 0.05);
  ctx.lineTo(gx + s * 0.04, gy);
  ctx.lineTo(gx, gy + s * 0.05);
  ctx.lineTo(gx - s * 0.04, gy);
  ctx.closePath();
  ctx.fill();

  // Arms
  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, s * 0.09, '#1A3A6A');
  limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, s * 0.09, '#1A3A6A');
  // Light cuffs
  [rig.elbows.left, rig.elbows.right].forEach(e => {
    oval(ctx, e.x, e.y + 3, s * 0.09, s * 0.05, '#A0D0FF');
  });
  drawHand(ctx, rig.hands.left, s * 0.105, '#0A1A3A');
  drawHand(ctx, rig.hands.right, s * 0.105, '#0A1A3A');

  // Head
  ctx.fillStyle = '#1A2A4A';
  ctx.beginPath();
  ctx.arc(head.x, head.y, headR, 0, TAU);
  ctx.fill();

  // Soft white-blue hair
  ctx.fillStyle = '#D0E8FF';
  ctx.beginPath();
  const iceHair = [
    [-0.95, -0.4], [-0.8, -1.0], [-0.45, -1.35], [0.0, -1.45],
    [0.4, -1.35], [0.75, -1.05], [0.95, -0.5], [0.7, -0.15],
  ];
  iceHair.forEach(([ox, oy], i) => {
    const hx = head.x + ox * headR * 1.15;
    const hy = head.y + oy * headR * 1.1;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  });
  ctx.lineTo(head.x + headR * 0.85, head.y + headR * 0.25);
  ctx.lineTo(head.x - headR * 0.85, head.y + headR * 0.25);
  ctx.closePath();
  ctx.fill();
  // Cooler mid tone
  ctx.fillStyle = '#A0C8F0';
  ctx.beginPath();
  ctx.moveTo(head.x - headR * 0.5, head.y - headR * 0.9);
  ctx.quadraticCurveTo(head.x, head.y - headR * 1.35, head.x + headR * 0.5, head.y - headR * 0.9);
  ctx.quadraticCurveTo(head.x, head.y - headR * 1.1, head.x - headR * 0.5, head.y - headR * 0.9);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────
// GRASS HERO  (leafy hair/cape, vine wraps, earthy pants)
// ─────────────────────────────────────────────────────────────
function drawGrassHero(ctx, rig, facing, frame) {
  const s = rig.s;
  const head = rig.head;
  const headR = rig.headR;
  const t = frame * 0.1;

  // Legs – brown pants with vine wraps
  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, s * 0.11, '#4A3020');
  limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, s * 0.11, '#4A3020');
  drawShoe(ctx, rig.feet.left, rig.legAngleL + facing * 0.15, s, '#3A6A2A', '#2A4A1A');
  drawShoe(ctx, rig.feet.right, rig.legAngleR + facing * 0.15, s, '#3A6A2A', '#2A4A1A');

  // Vine wraps on legs
  ctx.strokeStyle = '#4A9A3A';
  ctx.lineWidth = 2.5;
  [rig.knees.left, rig.knees.right].forEach((k, i) => {
    const f = i === 0 ? rig.feet.left : rig.feet.right;
    ctx.beginPath();
    ctx.moveTo(k.x - 8, k.y);
    ctx.quadraticCurveTo(k.x + 4, k.y + 8, f.x - 4, f.y - 6);
    ctx.stroke();
    // small leaf
    oval(ctx, k.x + 6, k.y + 4, 4, 6, '#5ABA3A');
  });

  // Torso – tattered light shirt + leaf accents
  const tw = s * 0.44;
  ctx.fillStyle = '#D8C8A0';
  ctx.beginPath();
  ctx.roundRect(-tw / 2, rig.torsoTop.y, tw, s * 0.55, s * 0.08);
  ctx.fill();

  // Leaf on chest
  ctx.fillStyle = '#4A9A3A';
  ctx.beginPath();
  ctx.moveTo(0, rig.torsoTop.y + s * 0.12);
  ctx.quadraticCurveTo(s * 0.12, rig.torsoTop.y + s * 0.25, 0, rig.torsoTop.y + s * 0.4);
  ctx.quadraticCurveTo(-s * 0.12, rig.torsoTop.y + s * 0.25, 0, rig.torsoTop.y + s * 0.12);
  ctx.fill();

  // Rope belt
  ctx.strokeStyle = '#8A6A40';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-tw * 0.4, rig.torsoBottom.y - s * 0.08);
  ctx.lineTo(tw * 0.4, rig.torsoBottom.y - s * 0.08);
  ctx.stroke();

  // Leafy cape
  ctx.fillStyle = '#3A8A2A';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.4, rig.torsoTop.y);
  ctx.quadraticCurveTo(-tw * 0.9 + Math.sin(t) * 3, rig.torsoTop.y + s * 0.4, -tw * 0.7, rig.torsoBottom.y + s * 0.15);
  ctx.lineTo(-tw * 0.2, rig.torsoBottom.y - s * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tw * 0.4, rig.torsoTop.y);
  ctx.quadraticCurveTo(tw * 0.9 + Math.sin(t + 1) * 3, rig.torsoTop.y + s * 0.4, tw * 0.7, rig.torsoBottom.y + s * 0.15);
  ctx.lineTo(tw * 0.2, rig.torsoBottom.y - s * 0.05);
  ctx.closePath();
  ctx.fill();

  // Arms with vine wraps
  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, s * 0.09, '#2A4A1A');
  limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, s * 0.09, '#2A4A1A');
  ctx.strokeStyle = '#8A6A40';
  ctx.lineWidth = 2;
  [rig.elbows.left, rig.elbows.right].forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, s * 0.08, 0, TAU);
    ctx.stroke();
    oval(ctx, e.x + 5, e.y - 2, 3, 5, '#5ABA3A');
  });
  drawHand(ctx, rig.hands.left, s * 0.105, '#1A3A10');
  drawHand(ctx, rig.hands.right, s * 0.105, '#1A3A10');

  // Head
  ctx.fillStyle = '#1A3A10';
  ctx.beginPath();
  ctx.arc(head.x, head.y, headR, 0, TAU);
  ctx.fill();

  // Leafy green hair
  ctx.fillStyle = '#3A8A2A';
  ctx.beginPath();
  const grassHair = [
    [-0.95, -0.35], [-0.75, -0.95], [-0.4, -1.3], [0.0, -1.4],
    [0.35, -1.35], [0.7, -1.05], [0.95, -0.55], [0.75, -0.15],
  ];
  grassHair.forEach(([ox, oy], i) => {
    const hx = head.x + ox * headR * 1.15;
    const hy = head.y + oy * headR * 1.1 + Math.sin(t + i) * 1.2;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  });
  ctx.lineTo(head.x + headR * 0.85, head.y + headR * 0.3);
  ctx.lineTo(head.x - headR * 0.85, head.y + headR * 0.3);
  ctx.closePath();
  ctx.fill();

  // Individual leaves in hair
  const leafPositions = [
    [-0.7, -1.15], [0.1, -1.35], [0.65, -1.1], [-0.3, -0.9],
  ];
  leafPositions.forEach(([ox, oy]) => {
    const lx = head.x + ox * headR * 1.2;
    const ly = head.y + oy * headR * 1.15;
    ctx.fillStyle = '#5ABA3A';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5, 8, ox * 0.5, 0, TAU);
    ctx.fill();
  });
}

// ─────────────────────────────────────────────────────────────
// THUNDER HERO  (dark blue gi with yellow trim, yellow face, wild hair)
// ─────────────────────────────────────────────────────────────
function drawThunderHero(ctx, rig, facing) {
  const s = rig.s;
  const head = rig.head;
  const headR = rig.headR;

  // Legs – dark blue baggy pants
  limb(ctx, rig.hips.left, rig.knees.left, rig.feet.left, s * 0.115, '#1A1A4A');
  limb(ctx, rig.hips.right, rig.knees.right, rig.feet.right, s * 0.115, '#1A1A4A');
  drawShoe(ctx, rig.feet.left, rig.legAngleL + facing * 0.15, s, '#1A1A4A', '#E8C020');
  drawShoe(ctx, rig.feet.right, rig.legAngleR + facing * 0.15, s, '#1A1A4A', '#E8C020');

  // Torso – martial arts gi
  const tw = s * 0.48;
  ctx.fillStyle = '#1A1A5A';
  ctx.beginPath();
  ctx.roundRect(-tw / 2, rig.torsoTop.y, tw, s * 0.65, s * 0.08);
  ctx.fill();

  // Yellow lapel / trim
  ctx.fillStyle = '#E8C020';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.15, rig.torsoTop.y);
  ctx.lineTo(tw * 0.05, rig.torsoTop.y);
  ctx.lineTo(-tw * 0.05, rig.torsoBottom.y - s * 0.05);
  ctx.lineTo(-tw * 0.25, rig.torsoBottom.y - s * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tw * 0.15, rig.torsoTop.y);
  ctx.lineTo(-tw * 0.05, rig.torsoTop.y);
  ctx.lineTo(tw * 0.05, rig.torsoBottom.y - s * 0.05);
  ctx.lineTo(tw * 0.25, rig.torsoBottom.y - s * 0.05);
  ctx.closePath();
  ctx.fill();

  // Collar
  ctx.fillStyle = '#E8C020';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.35, rig.torsoTop.y - s * 0.02);
  ctx.lineTo(tw * 0.35, rig.torsoTop.y - s * 0.02);
  ctx.lineTo(tw * 0.25, rig.torsoTop.y + s * 0.12);
  ctx.lineTo(-tw * 0.25, rig.torsoTop.y + s * 0.12);
  ctx.closePath();
  ctx.fill();

  // Arms – dark sleeves
  limb(ctx, rig.shoulders.left, rig.elbows.left, rig.hands.left, s * 0.09, '#0A0A2A');
  limb(ctx, rig.shoulders.right, rig.elbows.right, rig.hands.right, s * 0.09, '#0A0A2A');
  // Yellow sleeve trim
  [rig.elbows.left, rig.elbows.right].forEach(e => {
    ctx.strokeStyle = '#E8C020';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y + 2, s * 0.09, 0, TAU);
    ctx.stroke();
  });
  drawHand(ctx, rig.hands.left, s * 0.105, '#0A0A1A');
  drawHand(ctx, rig.hands.right, s * 0.105, '#0A0A1A');

  // Head – bright yellow face
  ctx.fillStyle = '#F0D020';
  ctx.beginPath();
  ctx.arc(head.x, head.y, headR, 0, TAU);
  ctx.fill();

  // Wild dark-blue hair
  ctx.fillStyle = '#1A1A5A';
  ctx.beginPath();
  const thHair = [
    [-1.05, -0.25], [-0.9, -0.85], [-0.55, -1.25], [-0.15, -1.4],
    [0.25, -1.4], [0.6, -1.2], [0.9, -0.8], [1.0, -0.3],
    [0.75, 0.05], [-0.75, 0.05],
  ];
  thHair.forEach(([ox, oy], i) => {
    const hx = head.x + ox * headR * 1.2;
    const hy = head.y + oy * headR * 1.15;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  });
  ctx.closePath();
  ctx.fill();
  // Spikier tips
  [[-0.6, -1.35], [0.1, -1.5], [0.55, -1.3]].forEach(([ox, oy]) => {
    ctx.beginPath();
    ctx.moveTo(head.x + ox * headR * 0.6, head.y + oy * headR * 0.5);
    ctx.lineTo(head.x + ox * headR * 1.25, head.y + oy * headR * 1.25);
    ctx.lineTo(head.x + (ox + 0.2) * headR * 0.7, head.y + oy * headR * 0.55);
    ctx.closePath();
    ctx.fill();
  });
}

// ─────────────────────────────────────────────────────────────
// Public entry
// ─────────────────────────────────────────────────────────────
export function drawGen1Character(ctx, rig, frame, facing, state, charData, scale = 1) {
  ctx.save();
  // Flip for facing if needed (rig already accounts for lean, but hair/clothes
  // are drawn in local space; facing is applied by the caller via scaleX usually.
  // We keep drawings symmetric / use facing only for directional elements.)

  const id = charData?.id || '';

  switch (id) {
    case 'g1_fire':
      drawFireHero(ctx, rig, facing);
      break;
    case 'g1_water':
      drawWaterHero(ctx, rig, facing, frame);
      break;
    case 'g1_ice':
      drawIceHero(ctx, rig, facing);
      break;
    case 'g1_grass':
      drawGrassHero(ctx, rig, facing, frame);
      break;
    case 'g1_thunder':
      drawThunderHero(ctx, rig, facing);
      break;
    default:
      // Fallback – should not happen for g1_* but keep safe
      ctx.fillStyle = charData?.color || '#888';
      ctx.beginPath();
      ctx.arc(rig.head.x, rig.head.y, rig.headR, 0, TAU);
      ctx.fill();
  }

  ctx.restore();
}
