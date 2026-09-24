// Fast, description-themed rendering for the documented Gen I-V attacks.
// The exact active collision geometry is supplied by attackSpecs.js.

function alphaColor(ctx, color, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color || '#FFFFFF';
  ctx.fillStyle = color || '#FFFFFF';
}

function line(ctx, x1, y1, x2, y2, width, color, alpha = 1) {
  ctx.save(); alphaColor(ctx, color, alpha); ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

function glowCircle(ctx, x, y, r, color, alpha = 0.7) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = Math.max(8, r * 0.45);
  alphaColor(ctx, color, alpha); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function lightning(ctx, x1, y1, x2, y2, color, width = 4) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  const dx = x2 - x1, dy = y2 - y1;
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    ctx.lineTo(x1 + dx * t + (i % 2 ? 7 : -7), y1 + dy * t + (i % 3 ? -5 : 5));
  }
  ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

function keywordStyle(spec) {
  const d = (spec.description || '').toLowerCase();
  if (/lightning|thunder|bolt/.test(d)) return 'lightning';
  if (/fire|flame|ember|burn|blazing/.test(d)) return 'fire';
  if (/water|puddle|wave|whip|sphere of water|splash/.test(d)) return 'water';
  if (/ice|frost|glacier|crystal|shard/.test(d)) return 'ice';
  if (/vine|flower|branch|thorn|leaf|seed|wooden/.test(d)) return 'plant';
  if (/wind|gust|air|flight|wing/.test(d)) return 'wind';
  if (/shadow|dark|erasure|death|phase|void/.test(d)) return 'shadow';
  if (/sound|sonar|echo|reson/.test(d)) return 'sound';
  if (/portal|teleport/.test(d)) return 'portal';
  if (/metal|iron|steel|harden|armor/.test(d)) return 'metal';
  if (/gravity|time|freeze|telekin|control|force/.test(d)) return 'force';
  return 'energy';
}

function drawTheme(ctx, x, y, color, p, facing, spec, scale = 1) {
  const style = keywordStyle(spec);
  const t = Math.max(0, Math.min(1, p));
  const reach = Math.min(170, Math.max(48, spec.range || 100)) * scale;
  const fx = facing || 1;

  if (style === 'lightning') {
    lightning(ctx, x + fx * 18, y - 38, x + fx * reach * t, y - 42 - Math.sin(t * Math.PI) * 20, color, 4 * scale);
    glowCircle(ctx, x + fx * reach * t, y - 42, 6 * scale, color, 0.8);
    return;
  }
  if (style === 'fire') {
    const px = x + fx * reach * t, py = y - 38;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 13 * scale; ctx.globalAlpha = 0.65; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + fx * 20, y - 40); ctx.quadraticCurveTo(px - fx * 30, py - 35, px, py); ctx.stroke(); ctx.restore();
    glowCircle(ctx, px, py, 9 * scale, color, 0.55);
    return;
  }
  if (style === 'water') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 8 * scale; ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.arc(x + fx * reach * t, y - 42, 18 * scale, 0, Math.PI * 1.6); ctx.stroke(); ctx.restore();
    return;
  }
  if (style === 'ice') {
    const px = x + fx * reach * t, py = y - 44;
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.8; ctx.beginPath();
    ctx.moveTo(px, py - 22 * scale); ctx.lineTo(px + 11 * scale, py + 12 * scale); ctx.lineTo(px, py + 4 * scale); ctx.lineTo(px - 11 * scale, py + 12 * scale); ctx.closePath(); ctx.fill(); ctx.restore();
    return;
  }
  if (style === 'plant') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 5 * scale; ctx.globalAlpha = 0.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + fx * 18, y - 38); ctx.quadraticCurveTo(x + fx * reach * 0.55, y - 60, x + fx * reach * t, y - 20); ctx.stroke(); ctx.restore();
    return;
  }
  if (style === 'wind') {
    for (let i = 0; i < 3; i++) line(ctx, x + fx * 12, y - 32 - i * 8, x + fx * (reach * t + 25), y - 45 - i * 10, 3 * scale, color, 0.45 + i * 0.15);
    return;
  }
  if (style === 'portal') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 5 * scale; ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.ellipse(x + fx * reach * t, y - 42, 22 * scale, 34 * scale, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    return;
  }
  if (style === 'metal') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 15 * scale; ctx.globalAlpha = 0.75; ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(x + fx * 12, y - 40); ctx.lineTo(x + fx * reach * t, y - 42); ctx.stroke(); ctx.restore();
    return;
  }
  if (style === 'sound' || style === 'force') {
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2.5 * scale; ctx.globalAlpha = 0.25 + i * 0.15;
      ctx.beginPath(); ctx.arc(x, y - 38, (22 + i * 16) * (0.65 + t * 0.45), -Math.PI * 0.9, Math.PI * 0.9); ctx.stroke(); ctx.restore();
    }
    return;
  }
  if (style === 'shadow') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 7 * scale; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(x + fx * reach * t, y - 42, 20 * scale, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    return;
  }
  // Generic energy: compact weapon-like arc, never a stage/environment effect.
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 8 * scale; ctx.globalAlpha = 0.65; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x + fx * reach * 0.55 * t, y - 40, 24 * scale, -Math.PI * 0.8, Math.PI * 0.35); ctx.stroke(); ctx.restore();
}

export function drawSpecAttack(ctx, x, y, color, p, facing, spec) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawTheme(ctx, x, y, spec.color || color, p, facing, spec, 1);

  // Profile-specific focal shape keeps the animation visually aligned with the hitbox.
  const f = facing || 1;
  const r = Math.max(24, Math.min(75, (spec.range || 100) * 0.42));
  const t = Math.max(0, Math.min(1, p));
  if (spec.shape === 'radial') {
    ctx.strokeStyle = spec.color || color; ctx.globalAlpha = 0.45; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y - 34, r * (0.55 + t * 0.5), 0, Math.PI * 2); ctx.stroke();
  } else if (spec.shape === 'moving') {
    const a = -Math.PI * 0.75 + t * Math.PI * 2;
    glowCircle(ctx, x + Math.cos(a) * r, y - 34 + Math.sin(a) * r * 0.72, 7, spec.color || color, 0.9);
  } else if (spec.shape === 'bottom' || spec.shape === 'ground') {
    line(ctx, x - f * 12, y - 4, x + f * 75, y - 4, 7, spec.color || color, 0.55);
  } else {
    line(ctx, x + f * 12, y - 40, x + f * Math.min(160, (spec.range || 100) * (0.35 + t * 0.65)), y - 42, 7, spec.color || color, 0.55);
  }
  ctx.restore();
}

export function drawSpecSuper(ctx, x, y, color, p, spec, facing = 1) {
  ctx.save();
  const c = spec.color || color || '#FFFFFF';
  const t = Math.max(0, Math.min(1, p));
  const f = facing || 1;
  const r = Math.max(60, Math.min(150, (spec.range || 120) * 0.95));
  const style = keywordStyle(spec);

  if (style === 'lightning') {
    lightning(ctx, x, y - 260, x, y - 25, c, 12);
    lightning(ctx, x - 25, y - 230, x + 15, y - 35, c, 5);
  } else if (style === 'fire') {
    glowCircle(ctx, x + f * r * 0.55, y - 42, 32 + t * 25, c, 0.7);
    ctx.strokeStyle = c; ctx.lineWidth = 12; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x + f * r * 0.55, y - 42, 50 + t * 25, 0, Math.PI * 2); ctx.stroke();
  } else if (style === 'ice') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      line(ctx, x, y - 38, x + Math.cos(a) * r, y - 38 + Math.sin(a) * r * 0.7, 8, c, 0.7);
    }
  } else {
    ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(x, y - 38, r * (0.45 + t * 0.55), 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 38, r * (0.2 + t * 0.3), 0, Math.PI * 2); ctx.stroke();
  }

  // Concentrated super flash, deliberately brief.
  if (t > 0.55) glowCircle(ctx, x, y - 38, 10 + (1 - t) * 18, c, 0.75);
  ctx.restore();
}
