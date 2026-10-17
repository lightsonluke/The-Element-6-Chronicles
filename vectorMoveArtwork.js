// Vector move artwork: deliberately authored layered Canvas sprites rather than
// generic glow rings.  Every mark is anchored to the fighter's actual pose and
// takes its palette from the selected Element 6 character.

const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));

function alpha(hex, a) {
  if (!hex || hex[0] !== '#') return `rgba(180,245,255,${a})`;
  const raw = hex.slice(1);
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function poly(ctx, pts, fill, stroke = 'rgba(235,255,255,.9)', width = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function shard(ctx, x, y, r, angle, fill, stroke) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  poly(ctx, [[0,-r],[r*.42,-r*.14],[r*.18,r],[ -r*.42,r*.18]], fill, stroke, 1);
  ctx.restore();
}

function impact(ctx, x, y, color, amount, seed = 0) {
  const n = 7 + Math.round(amount * 6);
  for (let i = 0; i < n; i++) {
    const a = seed + (i / n) * TAU;
    const d = 12 + (i % 4) * 6 + amount * 18;
    shard(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + (i % 3) * 1.7,
      a, i % 2 ? alpha(color, .9) : '#efffff', alpha(color, .8));
  }
}

function orbit(ctx, radius, color, p, count = 3) {
  for (let i = 0; i < count; i++) {
    const a = p * TAU * 1.8 + (i / count) * TAU;
    shard(ctx, Math.cos(a) * radius, -28 + Math.sin(a) * radius * .55, 6,
      a + Math.PI / 2, alpha(color, .95), '#edffff');
  }
}

function weapon(ctx, kind, color, p) {
  const swing = Math.sin(p * Math.PI);
  const stroke = '#efffff';
  const metal = ctx.createLinearGradient(2, -58, 30, 28);
  metal.addColorStop(0, '#ffffff'); metal.addColorStop(.26, alpha(color, .95));
  metal.addColorStop(.64, alpha(color, .55)); metal.addColorStop(1, '#082344');
  if (kind === 'blade' || kind === 'katana' || kind === 'rapier') {
    poly(ctx, [[8,12],[12,-8],[22,-54],[29,-61],[27,-22],[18,14]], metal, stroke, 1.2);
    poly(ctx, [[2,10],[24,8],[26,14],[4,17]], alpha(color,.9), stroke, 1);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath();ctx.moveTo(17,-6);ctx.lineTo(22,-47);ctx.stroke();
  } else if (kind === 'scythe' || kind === 'crescent') {
    poly(ctx, [[8,23],[13,-46],[18,-49],[16,24]], alpha(color,.85), stroke, 1.2);
    poly(ctx, [[15,-46],[37,-52],[43,-42],[32,-25],[20,-19],[25,-33],[17,-35]], metal, stroke, 1.2);
  } else if (kind === 'hammer' || kind === 'maul') {
    poly(ctx, [[8,27],[13,-36],[19,-37],[17,28]], alpha(color,.85), stroke, 1.2);
    poly(ctx, [[-3,-51],[34,-53],[41,-42],[35,-24],[-6,-25],[-12,-37]], metal, stroke, 1.3);
    for(let i=0;i<3;i++){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(2+i*11,-38,1.5,0,TAU);ctx.fill();}
  } else if (kind === 'spear' || kind === 'trident') {
    poly(ctx, [[9,30],[14,-50],[19,-50],[16,31]], alpha(color,.88), stroke, 1.1);
    poly(ctx, [[17,-67],[5,-48],[13,-52],[17,-44],[22,-52],[31,-48]], metal, stroke, 1.1);
    if(kind === 'trident') { poly(ctx, [[9,-48],[-1,-59],[0,-47],[13,-40]], metal, stroke); poly(ctx, [[23,-48],[35,-59],[34,-47],[20,-40]], metal, stroke); }
  } else {
    ctx.strokeStyle = alpha(color,.95);ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(6,21);ctx.lineTo(19,-41);ctx.stroke();
  }
  // Motion-cut highlights live on the weapon only during the actual strike.
  if (swing > .1) { ctx.globalAlpha=swing*.75;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(8,-20,42,-1.9,-.25);ctx.stroke();ctx.globalAlpha=1; }
}

function motifFor(charId, spec) {
  const id = String(charId || '').toLowerCase();
  const shape = String(spec?.shape || '').toLowerCase();
  if (/fire|ember|flame|inferno|phoenix/.test(id + shape)) return 'fire';
  if (/water|tidal|ocean|splash|ribbon/.test(id + shape)) return 'water';
  if (/ice|frost|crystal|shard/.test(id + shape)) return 'ice';
  if (/grass|leaf|thorn|flower|branch/.test(id + shape)) return 'nature';
  if (/thunder|lightning|bolt|electric/.test(id + shape)) return 'thunder';
  if (/shadow|void|dark|portal/.test(id + shape)) return 'void';
  if (/spear|trident/.test(shape)) return 'spear';
  if (/hammer|maul/.test(shape)) return 'hammer';
  if (/scythe|crescent/.test(shape)) return 'scythe';
  return 'blade';
}

// The visible art is only drawn during the move's active fraction. Collision
// still comes exclusively from attackSpecs/resonanceConstructs, never art pixels.
export function drawVectorMoveArtwork(ctx, x, y, color, progress, facing, spec, charId = '') {
  if (!spec) return;
  const p = clamp(Number(progress) || 0);
  const life = Math.sin(p * Math.PI);
  if (life <= .015) return;
  const motif = motifFor(charId, spec);
  const range = clamp((Number(spec.range) || 90) / 130, .65, 1.45);
  ctx.save(); ctx.translate(x, y - 26); ctx.scale(facing || 1, 1);
  ctx.globalAlpha = .35 + life * .65;
  ctx.shadowColor = color; ctx.shadowBlur = 10 + life * 12;

  if (motif === 'fire') {
    for(let i=0;i<7;i++){const a=-1.4+i*.34, d=18+i*range*6;poly(ctx,[[0,7],[Math.cos(a-.2)*d,Math.sin(a-.2)*d-18],[Math.cos(a)* (d+12),Math.sin(a)*(d+12)-22],[Math.cos(a+.2)*d,Math.sin(a+.2)*d-18]],i%2?'#ffcc4d':'#ff5b22','#fff3c7');}
    impact(ctx, 44*range, -12, '#ffae35', life, .3);
  } else if (motif === 'water') {
    ctx.strokeStyle='#d7ffff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(14,-8,34*range,-1.9,1.1);ctx.stroke();ctx.strokeStyle=alpha(color,.9);ctx.lineWidth=9;ctx.beginPath();ctx.arc(14,-8,34*range,-1.9,1.1);ctx.stroke();
    for(let i=0;i<5;i++) shard(ctx, 18+i*12*range, -8+Math.sin(i*1.7+p*8)*11, 5, i, '#baffff', alpha(color,.9));
  } else if (motif === 'ice') {
    for(let i=0;i<8;i++) shard(ctx, (18+i*9)*range, -20+((i%3)-1)*12, 8+(i%2)*4, -.55+i*.25, '#d9fbff', alpha(color,.9));
    impact(ctx, 58*range, -18, '#8cecff', life, .2);
  } else if (motif === 'nature') {
    for(let i=0;i<7;i++){const a=-1.2+i*.36;ctx.save();ctx.translate(Math.cos(a)*30*range,Math.sin(a)*24-15);ctx.rotate(a+p*2);ctx.fillStyle=i%2?'#b6f26c':alpha(color,.92);ctx.beginPath();ctx.ellipse(0,0,5,12,.4,0,TAU);ctx.fill();ctx.strokeStyle='#efffcf';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
    ctx.strokeStyle='#89542a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,6);ctx.quadraticCurveTo(35*range,-18,68*range,-6);ctx.stroke();
  } else if (motif === 'thunder') {
    ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(4,-44);ctx.lineTo(26*range,-20);ctx.lineTo(15*range,-19);ctx.lineTo(52*range,13);ctx.lineTo(31*range,-8);ctx.lineTo(44*range,-8);ctx.stroke();
    ctx.strokeStyle=alpha(color,.95);ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(4,-44);ctx.lineTo(26*range,-20);ctx.lineTo(15*range,-19);ctx.lineTo(52*range,13);ctx.stroke(); orbit(ctx,24*range,color,p,3);
  } else if (motif === 'void') {
    ctx.fillStyle='rgba(10,0,28,.72)';ctx.beginPath();ctx.arc(34*range,-14,31*range,0,TAU);ctx.fill();ctx.strokeStyle=alpha(color,.96);ctx.lineWidth=3;ctx.beginPath();ctx.arc(34*range,-14,31*range,p*TAU,p*TAU+Math.PI*1.6);ctx.stroke(); orbit(ctx,30*range,color,p,4);
  } else {
    weapon(ctx,motif,color,p); impact(ctx,50*range,-12,color,life,.45);
  }
  ctx.shadowBlur=0; ctx.restore();
}

// Normal contacts are deliberately tiny and attached to a visible limb.  This
// one definition is consumed by both the drawn sprite and fighter collision;
// keeping it here prevents a future visual-only range change from silently
// changing what can hit.
export function getNormalVectorContact(attack = {}) {
  if (attack.isGroundPound || attack.type === 'groundPound') return { kind: 'groundPound', knockback: 'downDiagonal' };
  if (attack.isRecovery || attack.sigType === 'aerial' || attack.type === 'aerialNormal') return { kind: 'aerialKick', knockback: 'upForward' };
  if (attack.sigType === 'power' || attack.type === 'power') return { kind: 'palmBurst', knockback: 'forward' };
  return { kind: 'jab', knockback: 'forward' };
}

export function getNormalVectorHitboxes(attacker) {
  const attack = attacker?.attackData;
  if (!attack || !attack.isNormal || attack.resonanceFamily) return [];
  const p = clamp(Number(attack.progress) || 0);
  // Wind-up and recovery are visible but harmless.  The active slice maps to
  // the drawn extended fist/boot/palm instead of an attacker-centred rectangle.
  if (p < .22 || p > .66) return [];
  const f = attacker.facing || 1, x = Number(attacker.x) || 0, y = Number(attacker.y) || 0;
  const contact = getNormalVectorContact(attack);
  if (contact.kind === 'aerialKick') {
    const lift = Math.sin((p - .22) / .44 * Math.PI) * 8;
    return [{ shape:'capsule', x1:x + f*9, y1:y - 27 - lift, x2:x + f*54, y2:y - 15 - lift, r:9 }];
  }
  if (contact.kind === 'palmBurst') {
    return [
      { shape:'capsule', x1:x + f*11, y1:y - 43, x2:x + f*40, y2:y - 43, r:9 },
      { shape:'circle', x:x + f*49, y:y - 43, r:13 },
    ];
  }
  return [{ shape:'capsule', x1:x + f*10, y1:y - 43, x2:x + f*43, y2:y - 43, r:9 }];
}

export function getNormalVectorKnockback(attacker, defender) {
  const f = attacker?.facing || 1;
  const contact = getNormalVectorContact(attacker?.attackData || {});
  if (contact.knockback === 'upForward') return { x:f*.42, y:-1 };
  if (contact.knockback === 'downDiagonal') {
    const dx = Math.sign((defender?.x || 0) - (attacker?.x || 0)) || f;
    return { x:dx*.58, y:.82 };
  }
  return { x:f, y:-.28 };
}

export function drawNormalVectorArtwork(ctx, x, y, color, progress, facing, attack = {}) {
  const p = clamp(Number(progress) || 0); if (p < .08 || p > .84) return;
  const contact = getNormalVectorContact(attack); const active = p >= .22 && p <= .66;
  ctx.save(); ctx.translate(x, y - 26); ctx.scale(facing || 1, 1);
  ctx.globalAlpha = .25 + Math.sin(p * Math.PI) * .75;
  ctx.shadowColor = color; ctx.shadowBlur = active ? 13 : 5;
  if (contact.kind === 'aerialKick') {
    const lift = Math.sin((p - .22) / .44 * Math.PI) * 8;
    poly(ctx, [[8,-4-lift],[50,-17-lift],[61,-10-lift],[48,0-lift]], alpha(color,.9), '#efffff', 1.1);
    if (active) impact(ctx, 57, -10-lift, color, .55, .1);
  } else if (contact.kind === 'palmBurst') {
    poly(ctx, [[8,-17],[43,-24],[59,-17],[43,-10]], alpha(color,.9), '#efffff', 1.1);
    ctx.strokeStyle='#efffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(50,-17,17,0,TAU);ctx.stroke();
    if (active) impact(ctx, 50, -17, color, .55, .6);
  } else {
    poly(ctx, [[7,-20],[43,-27],[52,-21],[43,-14]], alpha(color,.9), '#efffff', 1.1);
    if (active) impact(ctx, 48, -21, color, .42, .2);
  }
  ctx.restore();
}
