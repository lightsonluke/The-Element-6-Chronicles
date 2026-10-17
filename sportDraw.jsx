import { drawStickman, getLimbPose } from './renderer.js';
import { getCharNumber } from './characterNumber.js';
import { getCharRenderColor, getSkinParts } from './skins.js';
import { getAccessory, drawAccessory, isBehindAccessory, resolveAccColor } from './cosmetics.js';

// Draws a sport fighter: shadow + base stickman + themed jersey overlay.
// `teamColor` lets the jersey substrate use a per-side color so teams are
// visually distinct (P1 blue vs P2 red); character limbs/head still use the
// character's own color, so identity is preserved.
export function drawSportChar(ctx, x, y, char, opts = {}) {
  const { facing = 1, frame = 0, scale = 1, state = 'idle', powerActive = null, jersey = true, sport = 'soccer', teamColor, equippedSkins = {}, equippedAccessories = {}, attackData = null, emote = null, noWeapon = sport === 'volleyball' || sport === 'baseball' } = opts;
  const baseColor = char?.color || '#888';
  // Skins only apply when the jersey is OFF — jersey on = base character + jersey.
  const skinColor = !jersey ? getCharRenderColor(char?.id, equippedSkins) : null;
  const color = skinColor || baseColor;
  ctx.save(); ctx.globalAlpha = 0.22 + Math.sin(frame * 0.07) * 0.04; ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y + 3 * scale, 30 * scale, 9 * scale, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (!jersey) {
    const skinParts = getSkinParts(char?.id, equippedSkins);
    const acc = getAccessory(equippedAccessories[char?.id]);
    skinParts.filter(p => isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, x, y, p.type, p.color, frame, scale, char?.id, state, facing, powerActive, emote, attackData));
    if (acc && isBehindAccessory(acc.type)) drawAccessory(ctx, x, y, acc.type, resolveAccColor(acc, char), frame, scale, char?.id, state, facing, powerActive, emote, attackData);
  }
  drawStickman(ctx, x, y, color, facing, frame, scale, char?.isSpirit, state, char, powerActive, noWeapon, null, emote, attackData);
  if (!jersey) {
    const skinParts = getSkinParts(char?.id, equippedSkins);
    const acc = getAccessory(equippedAccessories[char?.id]);
    skinParts.filter(p => !isBehindAccessory(p.type)).forEach(p => drawAccessory(ctx, x, y, p.type, p.color, frame, scale, char?.id, state, facing, powerActive, emote, attackData));
    if (acc && !isBehindAccessory(acc.type)) drawAccessory(ctx, x, y, acc.type, resolveAccColor(acc, char), frame, scale, char?.id, state, facing, powerActive, emote, attackData);
  }
  if (jersey) drawSportJersey(ctx, x, y, color, char?.id, sport, frame, scale, state, facing, teamColor, emote, attackData);
}

const SPORT_ACCENTS = {
  soccer: '#FFFFFF', baseball: '#222222', volleyball: '#FFFFFF',
  tennis: '#FFFFFF', track: '#FFD700', basketball: '#222222', dodgeball: '#FF6600',
};

export function drawSportJersey(ctx, x, y, color, charId, sport, frame = 0, scale = 1, state = 'idle', facing = 1, teamColor, emote = null, attackData = null) {
  const pose = getLimbPose(frame, state, facing, scale, null, emote, attackData);
  const s = pose.s;
  const num = getCharNumber(charId);
  const accent = SPORT_ACCENTS[sport] || '#FFFFFF';
  const substrate = teamColor || color; // team-tone jersey substrate
  const torsoTopY = pose.torsoTopY, hipY = pose.hipY;
  const jW = s * 0.28;
  ctx.save();
  ctx.translate(x, y);
  // Pose points already include body lean, so do not rotate the rig a second time.
  const topY = pose.torsoTop.y;
  const bottomY = pose.torsoBottom.y;
  const topW = jW, bottomW = jW * 0.78;
  // Fitted tapered sports top, sized to the same slim torso as the character.
  ctx.fillStyle = substrate; ctx.globalAlpha = 0.80;
  ctx.beginPath(); ctx.moveTo(-topW/2,topY); ctx.lineTo(topW/2,topY); ctx.lineTo(bottomW/2,bottomY); ctx.lineTo(-bottomW/2,bottomY); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = accent; ctx.lineWidth = Math.max(0.7, s*0.018); ctx.beginPath(); ctx.moveTo(-topW/2,topY); ctx.lineTo(topW/2,topY); ctx.lineTo(bottomW/2,bottomY); ctx.lineTo(-bottomW/2,bottomY); ctx.closePath(); ctx.stroke();
  // Accent stripe / pinstripes
  ctx.fillStyle = accent; ctx.globalAlpha = 0.6;
  if (sport === 'basketball') {
    ctx.fillRect(-jW / 2, torsoTopY + (hipY - torsoTopY) * 0.4, jW, s * 0.08);
    // sides
    ctx.fillRect(-jW / 2, torsoTopY, s * 0.04, hipY - torsoTopY);
    ctx.fillRect(jW / 2 - s * 0.04, torsoTopY, s * 0.04, hipY - torsoTopY);
  } else if (sport === 'baseball') {
    ctx.save(); ctx.beginPath(); ctx.rect(-jW / 2, torsoTopY, jW, hipY - torsoTopY); ctx.clip();
    ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.beginPath();
    for (let bx = -jW / 2; bx < jW / 2; bx += s * 0.14) { ctx.beginPath(); ctx.moveTo(bx, torsoTopY); ctx.lineTo(bx + s * 0.05, hipY); ctx.stroke(); }
    ctx.restore();
  } else if (sport === 'volleyball') {
    // Soccer-style band across the chest, plus a white diagonal stripe (sash)
    ctx.fillRect(-jW / 2, torsoTopY + (hipY - torsoTopY) * 0.42, jW, s * 0.08);
    ctx.save();
    ctx.beginPath(); ctx.rect(-jW / 2, torsoTopY, jW, hipY - torsoTopY); ctx.clip();
    const stripH = (hipY - torsoTopY) * 0.12;
    ctx.beginPath();
    ctx.moveTo(-jW / 2 - s * 0.05, torsoTopY + (hipY - torsoTopY) * 0.35);
    ctx.lineTo(jW / 2 + s * 0.05, torsoTopY + (hipY - torsoTopY) * 0.20);
    ctx.lineTo(jW / 2 + s * 0.05, torsoTopY + (hipY - torsoTopY) * 0.20 + stripH);
    ctx.lineTo(-jW / 2 - s * 0.05, torsoTopY + (hipY - torsoTopY) * 0.35 + stripH);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    ctx.fillRect(-jW / 2, torsoTopY + (hipY - torsoTopY) * 0.5, jW, s * 0.06);
  }
  // A tiny centered number badge stays inside the slim shirt silhouette.
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = accent; ctx.font = `bold ${Math.max(4, Math.floor(s * 0.16))}px Orbitron, sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText(num != null ? String(num) : '6', 0, torsoTopY + s * 0.56);
  // Shorts (substrate) — baseball gets long white pants instead
  if (sport === 'baseball') {
    // Baseball pants are rigged as separate hip→knee and knee→foot pieces so
    // the fabric follows each joint through kicks, runs, jumps, and hitstun.
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const sideName of ['left', 'right']) {
      const hip = pose.hips[sideName], knee = pose.knees[sideName], foot = pose.feet[sideName];
      const drawPantSegment = (a, b, width) => {
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = width; ctx.globalAlpha = 0.96;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = Math.max(0.7, s * 0.012); ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      };
      drawPantSegment(hip, knee, s * 0.145);
      drawPantSegment(knee, foot, s * 0.13);
      ctx.fillStyle = substrate; ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.arc(hip.x, hip.y, s * 0.065, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(knee.x, knee.y, s * 0.068, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(foot.x, foot.y, s * 0.04, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Narrow shorts panels are capsules attached to each hip/thigh, not floating boxes.
    ctx.strokeStyle = substrate; ctx.globalAlpha = 0.86; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.12;
    for (const sideName of ['left','right']) {
      const hip = pose.hips[sideName], knee = pose.knees[sideName];
      const end = { x: hip.x + (knee.x - hip.x) * 0.32, y: hip.y + (knee.y - hip.y) * 0.32 };
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.restore();
}

// Per-character tennis racket. Head color & frame tint follow the character's
// own color so each character's racket is visually distinct (complaint: "the
// tennis rackets all look the same").
export function drawTennisRacket(ctx, p, char, facing, ground, swinging = false) {
  const cx = p.x + facing * 22;
  const cy = ground - 32 - (p.y < ground ? (ground - p.y) : 0);
  ctx.save();
  ctx.translate(cx, cy);
  if (swinging) ctx.rotate(facing * 0.6);
  const headColor = char?.color || '#FFCC66';
  // Handle
  ctx.strokeStyle = '#3b2a14'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(facing * 12, -10); ctx.stroke();
  // Frame
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
  ctx.fillStyle = headColor;
  ctx.beginPath(); ctx.ellipse(facing * 18, -16, 11, 7, facing * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Strings
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6;
  for (let i = -6; i <= 6; i += 3) {
    ctx.beginPath(); ctx.moveTo(facing * 18 + i * 1.2, -16 - 6); ctx.lineTo(facing * 18 + i * 1.2, -16 + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(facing * 18 - 9, -16 + i * 0.8); ctx.lineTo(facing * 18 + 9, -16 + i * 0.8); ctx.stroke();
  }
  ctx.restore();
}