// Night villain engine for story mode — spawning, AI, rendering, combat
import { NIGHT_VILLAINS, RARE_NIGHT_VILLAINS, rollNightLevel } from './nightVillains.js';
import { BLOCKS, BLOCK_SIZE } from './world.js';

const GRAVITY = 0.35;
const MAX_FALL = 14;

// Count Element 6 Orbs in the player's current chunk — more orbs = stronger night villains
export function countElement6Orbs(world, playerWX) {
  const chunkIdx = Math.floor(Math.floor(playerWX / BLOCK_SIZE) / 32);
  let count = 0;
  const startX = chunkIdx * 32;
  for (let bx = startX; bx < startX + 32; bx++) {
    for (let by = 0; by < 128; by++) {
      if (world.getBlock(bx, by) === BLOCKS.ELEMENT6_ORB) count++;
    }
  }
  return count;
}

// Check if a position is near a torch (within 6 blocks)
export function isNearTorch(world, wx, wy) {
  const bx = Math.floor(wx / BLOCK_SIZE);
  const by = Math.floor(wy / BLOCK_SIZE);
  for (let dx = -6; dx <= 6; dx++) {
    for (let dy = -6; dy <= 6; dy++) {
      if (world.getBlock(bx + dx, by + dy) === BLOCKS.TORCH) return true;
    }
  }
  return false;
}

// Spawn night villains near the player (but not too close, and not near torches)
export function maybeSpawnNightVillain(s, nightLevel) {
  if (!s.nightVillains) s.nightVillains = [];
  if (s.nightVillains.length >= 6 + nightLevel * 2) return; // cap concurrent spawns
  
  // Only spawn during night (dayProgress > 0.5)
  if (s.dayProgress < 0.5) return;
  
  s.nightSpawnTimer = (s.nightSpawnTimer || 0) - 1;
  if (s.nightSpawnTimer > 0) return;
  s.nightSpawnTimer = 60 + Math.floor(Math.random() * 120); // respawn interval

  // Pick spawn position: 10-25 blocks from player, at surface
  const dir = Math.random() > 0.5 ? 1 : -1;
  const distBlocks = 10 + Math.floor(Math.random() * 15);
  const spawnBX = Math.floor(s.player.wx / BLOCK_SIZE) + dir * distBlocks;
  const spawnBY = s.world.getTerrainHeight(spawnBX);
  const spawnX = spawnBX * BLOCK_SIZE + BLOCK_SIZE / 2;
  const spawnY = spawnBY * BLOCK_SIZE - BLOCK_SIZE * 2;

  // Don't spawn near torches
  if (isNearTorch(s.world, spawnX, spawnY)) return;

  // Don't spawn too far from player vertically
  if (Math.abs(spawnY - s.player.wy) > BLOCK_SIZE * 20) return;

  // Pick villain type based on night level
  let villain;
  if (nightLevel === 3) {
    // Blood Moon: bloodmoon or specter_king, +25% HP
    const pool = RARE_NIGHT_VILLAINS.filter(v => v.id === 'bloodmoon' || v.id === 'specter_king');
    villain = pool[Math.floor(Math.random() * pool.length)];
  } else if (nightLevel === 2) {
    // 29%: rare villains can spawn
    villain = Math.random() < 0.3
      ? RARE_NIGHT_VILLAINS[Math.floor(Math.random() * RARE_NIGHT_VILLAINS.length)]
      : NIGHT_VILLAINS[Math.floor(Math.random() * NIGHT_VILLAINS.length)];
  } else {
    // 70%: common only
    villain = NIGHT_VILLAINS[Math.floor(Math.random() * NIGHT_VILLAINS.length)];
  }

  const orbCount = countElement6Orbs(s.world, s.player.wx);
  const orbMult = 1 + Math.min(orbCount * 0.15, 2.0); // up to +200% HP/dmg
  const hpMult = (nightLevel === 3 ? 1.25 : 1) * orbMult;
  s.nightVillains.push({
    id: villain.id,
    type: villain,
    wx: spawnX,
    wy: spawnY,
    vx: 0, vy: 0,
    hp: villain.hp * hpMult,
    maxHp: villain.hp * hpMult,
    dmgMul: orbMult,
    facing: dir === 1 ? -1 : 1, // face toward player
    frame: Math.floor(Math.random() * 60),
    attackCd: 0,
    powerCd: villain.cooldown || 0,
    grounded: false,
    defeated: false,
    resurrected: villain.resurrect ? false : undefined,
    frenzyStacks: 0,
  });
}

// Update night villains — AI, gravity, movement, attacks
export function updateNightVillains(s, dt) {
  if (!s.nightVillains) return;
  if (s.dayProgress < 0.5 && s.dayProgress > 0.25) {
    // Dawn approaching — remove all night villains (they vanish at dawn)
    s.nightVillains = [];
    return;
  }
  if (s.dayProgress < 0.5 && s.dayProgress < 0.25) return; // daytime, no night villains

  const p = s.player;
  
  s.nightVillains = s.nightVillains.filter(nv => {
    if (nv.defeated) return false;
    
    // Only update nearby villains for performance
    const distToPlayer = Math.abs(nv.wx - p.wx);
    if (distToPlayer > BLOCK_SIZE * 60) return true;

    nv.frame++;
    
    // Gravity
    if (!nv.grounded) nv.vy = (nv.vy || 0) + GRAVITY;
    if (nv.vy > MAX_FALL) nv.vy = MAX_FALL;
    
    // Y collision
    const newVY = nv.wy + nv.vy;
    const nvBxL = Math.floor((nv.wx - BLOCK_SIZE * 0.2) / BLOCK_SIZE);
    const nvBxR = Math.floor((nv.wx + BLOCK_SIZE * 0.2) / BLOCK_SIZE);
    const nvFeet = Math.floor(newVY / BLOCK_SIZE);
    if (isSolidBlock(s.world, nvBxL, nvFeet) || isSolidBlock(s.world, nvBxR, nvFeet)) {
      nv.wy = nvFeet * BLOCK_SIZE;
      nv.vy = 0;
      nv.grounded = true;
    } else {
      nv.wy = newVY;
      nv.grounded = false;
    }

    // AI — flee from normal (boss) villains, otherwise move toward player
    const dx = p.wx - nv.wx;
    const speed = nv.type.speed * (1 + (nv.frenzyStacks || 0) * 0.15);
    let _fleeBoss = false;
    (s.villainSpawns || []).forEach(vs => {
      if (vs.defeated) return;
      if (Math.abs(nv.wx - vs.wx) < BLOCK_SIZE * 5) {
        nv.vx = (nv.wx > vs.wx ? 1 : -1) * speed * 2.5;
        nv.facing = nv.wx > vs.wx ? 1 : -1;
        _fleeBoss = true;
      }
    });
    if (!_fleeBoss) {
      nv.facing = dx > 0 ? 1 : -1;
      if (distToPlayer > nv.type.range * 0.5) {
        nv.vx = nv.facing * speed * 1.5;
      } else {
        nv.vx *= 0.8;
      }
    }

    // X collision with auto-step
    const newX = nv.wx + nv.vx;
    const footY = Math.floor(nv.wy / BLOCK_SIZE);
    const midY = Math.floor((nv.wy - BLOCK_SIZE) / BLOCK_SIZE);
    const headY = Math.floor((nv.wy - BLOCK_SIZE * 2) / BLOCK_SIZE);
    const checkCol = nv.vx >= 0
      ? Math.floor((newX + BLOCK_SIZE * 0.2) / BLOCK_SIZE)
      : Math.floor((newX - BLOCK_SIZE * 0.2) / BLOCK_SIZE);

    if (!isSolidBlock(s.world, checkCol, footY) && !isSolidBlock(s.world, checkCol, midY)) {
      nv.wx = newX;
    } else if (nv.grounded) {
      // Auto-step up 1 block
      if (!isSolidBlock(s.world, checkCol, footY - 1) && !isSolidBlock(s.world, checkCol, midY - 1)) {
        nv.wx = newX;
        nv.wy = (footY - 1) * BLOCK_SIZE;
      }
    }

    // Attack the player
    nv.attackCd = Math.max(0, (nv.attackCd || 0) - 1);
    const distYToPlayer = Math.abs(nv.wy - p.wy);
    if (distToPlayer < nv.type.range && distYToPlayer < BLOCK_SIZE * 2 && nv.attackCd <= 0) {
      nv.attackCd = (nv.type.cooldown || 60) - (nv.frenzyStacks || 0) * 5;
      // Deal damage to player
      if (s.playerInvuln <= 0) {
        s.playerHp = Math.max(0, (s.playerHp || 100) - nv.type.dmg * (nv.dmgMul || 1));
        s.playerInvuln = 30; // 0.5s invuln
        if (nv.type.lifesteal) nv.hp = Math.min(nv.maxHp, nv.hp + nv.type.dmg * (nv.dmgMul || 1) * 0.5);
        if (nv.type.frenzy) nv.frenzyStacks = (nv.frenzyStacks || 0) + 1;
        // Screen darkening for whisper
        if (nv.type.id === 'whisper') s.screenDarken = 120;
        if (nv.type.id === 'eclipse') s.screenDarken = 200;
        // Knockback
        s.player.vx += nv.facing * 3;
        s.player.vy = -4;
        s.player.grounded = false;
        // Hit particles
        for (let i = 0; i < 6; i++) {
          s.particleEffects.push({
            x: p.wx, y: p.wy, vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 4,
            r: 3 + Math.random() * 3, color: nv.type.color, life: 18, maxLife: 18,
          });
        }
      }
    }

    return true;
  });
}

// Render a night villain with unique design
export function renderNightVillain(ctx, nv, screenX, screenY, frame) {
  const t = nv.type;
  ctx.save();
  
  // HP bar above
  if (nv.hp < nv.maxHp) {
    const barW = 30, barH = 4;
    ctx.fillStyle = '#330000';
    ctx.fillRect(screenX - barW / 2, screenY - 70, barW, barH);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(screenX - barW / 2, screenY - 70, barW * (nv.hp / nv.maxHp), barH);
  }

  // Name
  ctx.fillStyle = t.color;
  ctx.shadowColor = t.color; ctx.shadowBlur = 6;
  ctx.font = 'bold 9px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.name, screenX, screenY - 78);
  ctx.shadowBlur = 0;

  // Unique design per drawType
  if (t.intangible && Math.floor(frame / 20) % 2 === 0) ctx.globalAlpha = 0.3;
  if (t.id === 'glitch' && Math.random() < 0.1) {
    screenX += (Math.random() - 0.5) * 10;
  }

  drawNightVillainDesign(ctx, screenX, screenY, t, frame, nv.facing);
  
  ctx.restore();
}

function drawNightVillainDesign(ctx, x, y, t, frame, facing) {
  const bobY = Math.sin(frame * 0.08) * 2;
  y += bobY;
  
  // Body stickman base
  ctx.strokeStyle = t.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  // Unique visual effects per type
  switch (t.drawType) {
    case 'shadow':
      ctx.fillStyle = '#0a0a1a';
      ctx.beginPath(); ctx.arc(x, y - 30, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = t.secondaryColor;
      ctx.beginPath(); ctx.arc(x - 4, y - 32, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 32, 3, 0, Math.PI * 2); ctx.fill();
      // Shadow wisps
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(x + (frame * 2 + i * 20) % 40 - 20, y - 20 + i * 8, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    case 'flame':
      // Fire body
      ctx.fillStyle = '#FF4400';
      ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y - 30, 12, 0, Math.PI * 2);
      ctx.fill();
      // Flame flickers
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#FF8800' : '#FFCC00';
        ctx.beginPath();
        ctx.arc(x + Math.sin(frame * 0.1 + i) * 6, y - 40 - i * 4, 6 - i, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(x - 4, y - 30, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 30, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'ice':
      ctx.fillStyle = '#88CCFF';
      ctx.shadowColor = '#88CCFF'; ctx.shadowBlur = 10;
      // Diamond body
      ctx.beginPath();
      ctx.moveTo(x, y - 42); ctx.lineTo(x + 12, y - 30); ctx.lineTo(x, y - 18); ctx.lineTo(x - 12, y - 30);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // Ice crystals
      ctx.fillStyle = '#AADDFF';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x + (i - 1.5) * 6, y - 15 + Math.sin(frame * 0.05 + i) * 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'electric':
      ctx.fillStyle = '#FFFF44';
      ctx.shadowColor = '#FFFF00'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y - 30, 10, 0, Math.PI * 2); ctx.fill();
      // Electric arcs
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x + Math.sin(frame * 0.2 + i) * 15, y - 30 + Math.cos(frame * 0.2 + i) * 15);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      break;
    case 'poison':
      ctx.fillStyle = '#44AA44';
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      // Hood
      ctx.fillStyle = '#226622';
      ctx.beginPath(); ctx.arc(x, y - 35, 13, Math.PI, 0); ctx.fill();
      // Glowing eyes
      ctx.fillStyle = '#88FF44';
      ctx.shadowColor = '#88FF44'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(x - 4, y - 30, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 30, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    case 'portal':
      ctx.fillStyle = '#8844FF';
      ctx.shadowColor = '#8844FF'; ctx.shadowBlur = 15;
      // Portal swirl
      for (let r = 14; r > 4; r -= 3) {
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x + Math.sin(frame * 0.1) * 3, y - 30 + Math.cos(frame * 0.1) * 3, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    case 'rock':
      ctx.fillStyle = '#886644';
      ctx.beginPath(); ctx.arc(x, y - 28, 16, 0, Math.PI * 2); ctx.fill();
      // Rock bumps
      ctx.fillStyle = '#AA8855';
      ctx.beginPath(); ctx.arc(x - 6, y - 34, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 7, y - 32, 4, 0, Math.PI * 2); ctx.fill();
      // Crack eyes
      ctx.strokeStyle = '#442200'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 5, y - 28); ctx.lineTo(x - 2, y - 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 5, y - 28); ctx.lineTo(x + 2, y - 25); ctx.stroke();
      break;
    case 'ghost':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#444466';
      ctx.beginPath();
      ctx.arc(x, y - 28, 12, 0, Math.PI * 2);
      ctx.fill();
      // Ghost tail (wavy bottom)
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 20);
      for (let i = 0; i <= 4; i++) {
        ctx.lineTo(x - 12 + i * 6, y - 14 + Math.sin(frame * 0.1 + i) * 3);
      }
      ctx.lineTo(x + 12, y - 20);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Faint eyes
      ctx.fillStyle = '#AAAACC';
      ctx.beginPath(); ctx.arc(x - 4, y - 28, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 28, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'vine':
      ctx.fillStyle = '#226622';
      ctx.strokeStyle = '#448844';
      ctx.lineWidth = 4;
      // Plant body
      ctx.beginPath(); ctx.arc(x, y - 28, 11, 0, Math.PI * 2); ctx.fill();
      // Thorny vines
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y - 25);
        ctx.quadraticCurveTo(x + (i - 1) * 15, y - 35 - i * 5, x + (i - 1) * 20, y - 15);
        ctx.stroke();
      }
      // Flower eyes
      ctx.fillStyle = '#FF66AA';
      ctx.beginPath(); ctx.arc(x - 4, y - 28, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 28, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'sonic':
      ctx.fillStyle = '#CC88FF';
      ctx.beginPath(); ctx.arc(x, y - 30, 10, 0, Math.PI * 2); ctx.fill();
      // Sound rings
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.4 - i * 0.1;
        ctx.strokeStyle = '#CC88FF'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 30, 10 + i * 5 + Math.sin(frame * 0.1) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case 'light':
      ctx.fillStyle = '#FFFFCC';
      ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(x, y - 30, 12, 0, Math.PI * 2); ctx.fill();
      // Light rays
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + frame * 0.03;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 12, y - 30 + Math.sin(a) * 12);
        ctx.lineTo(x + Math.cos(a) * 18, y - 30 + Math.sin(a) * 18);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      break;
    case 'rust':
      ctx.fillStyle = '#AA5533';
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      // Rust spots
      ctx.fillStyle = '#664422';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + (i - 2) * 4, y - 28 + (i % 2) * 4, 2 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'phantom':
      ctx.globalAlpha = 0.5 + Math.sin(frame * 0.05) * 0.2;
      ctx.fillStyle = '#332255';
      ctx.beginPath();
      ctx.arc(x, y - 30, 12, 0, Math.PI * 2);
      ctx.fill();
      // Phantom trail
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#554477';
      ctx.beginPath(); ctx.arc(x - facing * 8, y - 30, 10, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // White eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(x - 4, y - 30, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 30, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'crystal':
      ctx.fillStyle = '#AA88FF';
      ctx.shadowColor = '#AA88FF'; ctx.shadowBlur = 8;
      // Crystal body (hexagonal)
      ctx.beginPath();
      ctx.moveTo(x, y - 42); ctx.lineTo(x + 10, y - 34); ctx.lineTo(x + 10, y - 22);
      ctx.lineTo(x, y - 16); ctx.lineTo(x - 10, y - 22); ctx.lineTo(x - 10, y - 34);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // Crystal facets
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - 42); ctx.lineTo(x, y - 16); ctx.stroke();
      break;
    case 'pulse':
      ctx.fillStyle = '#44FFCC';
      ctx.shadowColor = '#44FFCC'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y - 30, 10, 0, Math.PI * 2); ctx.fill();
      // Expanding ring
      const ringR = (frame % 60) / 60 * 20 + 10;
      ctx.globalAlpha = 1 - (frame % 60) / 60;
      ctx.strokeStyle = '#44FFCC'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 30, ringR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      break;
    case 'fog':
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#AAAAAA';
      // Fog cloud body
      ctx.beginPath();
      ctx.arc(x - 8, y - 30, 8, 0, Math.PI * 2);
      ctx.arc(x + 8, y - 30, 8, 0, Math.PI * 2);
      ctx.arc(x, y - 35, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case 'magnet':
      ctx.fillStyle = '#FF6644';
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      // Magnetic lines
      ctx.strokeStyle = '#FF8866'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y - 30, 14 + i * 3, frame * 0.05 + i, frame * 0.05 + i + Math.PI * 0.7);
        ctx.stroke();
      }
      break;
    case 'lava':
      ctx.fillStyle = '#FF2200';
      ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y - 30, 12, 0, Math.PI * 2); ctx.fill();
      // Lava drips
      ctx.fillStyle = '#FF6600';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + (i - 1) * 6, y - 18 + Math.sin(frame * 0.1 + i) * 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      break;
    case 'soul':
      ctx.fillStyle = '#6633AA';
      ctx.shadowColor = '#8855CC'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      // Soul particles flowing inward
      ctx.fillStyle = '#AA77DD';
      for (let i = 0; i < 4; i++) {
        const a = frame * 0.05 + i * Math.PI / 2;
        const r = 15 - (frame % 30) / 30 * 10;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y - 30 + Math.sin(a) * r, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      break;
    case 'mimic':
      ctx.fillStyle = '#FFAA22';
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      // Question mark eyes
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('?', x - 5, y - 26);
      ctx.fillText('?', x + 5, y - 26);
      break;
    // Rare villains
    case 'eclipse':
      ctx.fillStyle = '#110022';
      ctx.shadowColor = '#330055'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(x, y - 30, 16, 0, Math.PI * 2); ctx.fill();
      // Moon ring
      ctx.strokeStyle = '#330055'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 30, 22 + Math.sin(frame * 0.05) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'revenant':
      ctx.fillStyle = '#446644';
      ctx.beginPath(); ctx.arc(x, y - 30, 13, 0, Math.PI * 2); ctx.fill();
      // Skeleton ribs
      ctx.strokeStyle = '#88AA88'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y - 30 + i * 4, 10, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
      }
      break;
    case 'glitch':
      ctx.fillStyle = '#00FF00';
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      // Glitch lines
      ctx.strokeStyle = '#0088FF'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const gy = y - 35 + i * 5 + (Math.random() - 0.5) * 4;
        ctx.beginPath();
        ctx.moveTo(x - 12 + Math.random() * 4, gy);
        ctx.lineTo(x + 12 + Math.random() * 4, gy);
        ctx.stroke();
      }
      break;
    case 'bloodmoon':
      ctx.fillStyle = '#CC0000';
      ctx.shadowColor = '#FF3300'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(x, y - 30, 14, 0, Math.PI * 2); ctx.fill();
      // Blood drips
      ctx.fillStyle = '#FF0000';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + (i - 2) * 6, y - 20, 2, 5 + Math.sin(frame * 0.1 + i) * 3);
      }
      ctx.shadowBlur = 0;
      break;
    case 'specter_king':
      ctx.fillStyle = '#5500AA';
      ctx.shadowColor = '#AA00FF'; ctx.shadowBlur = 20;
      // Crown body
      ctx.beginPath(); ctx.arc(x, y - 32, 18, 0, Math.PI * 2); ctx.fill();
      // Crown spikes
      ctx.fillStyle = '#AA00FF';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 6 - 3, y - 48);
        ctx.lineTo(x + i * 6, y - 56);
        ctx.lineTo(x + i * 6 + 3, y - 48);
        ctx.fill();
      }
      // Glow eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(x - 6, y - 32, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6, y - 32, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    default:
      // Generic fallback
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(x, y - 30, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(x - 4, y - 32, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 32, 2, 0, Math.PI * 2); ctx.fill();
  }
  
  // Simple legs
  ctx.strokeStyle = t.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 10);
  ctx.lineTo(x - 4 + Math.sin(frame * 0.15) * 3, y);
  ctx.moveTo(x + 4, y - 10);
  ctx.lineTo(x + 4 - Math.sin(frame * 0.15) * 3, y);
  ctx.stroke();
}

// Helper — is block solid (reused from StoryMode)
function isSolidBlock(world, bx, by) {
  const b = world.getBlock(bx, by);
  return b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.LAVA && b !== BLOCKS.LADDER;
}

// Process a player attack — create hitbox, damage nearby night villains
export function storyAttack(s, attackType, heroData) {
  if (!s.nightVillains) return;
  if ((s.attackCd || 0) > 0) return;
  
  let dmg, range, cd, atkColor;
  switch (attackType) {
    case 'sig': dmg = heroData?.signatures?.side?.damage || 12; range = 55; cd = 20; atkColor = heroData?.color || '#FFD700'; break;
    case 'power': dmg = 16 + (heroData?.stats?.power || 5); range = 65; cd = 40; atkColor = heroData?.color || '#FFD700'; break;
    case 'super':
      dmg = heroData?.superMove?.damage || 40; range = 90; cd = 90; atkColor = heroData?.superMove?.color || '#FF00FF';
      for (let i = 0; i < 15; i++) s.particleEffects.push({ x: s.player.wx, y: s.player.wy - BLOCK_SIZE * 1.5, vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 8, r: 5 + Math.random() * 5, color: atkColor, life: 30, maxLife: 30 });
      break;
    case 'heavy': dmg = heroData?.heavyAttack?.damage || 18; range = 60; cd = 35; atkColor = heroData?.heavyAttack?.color || heroData?.color || '#FFD700'; break;
  }
  s.attackCd = cd;
  const p = s.player;
  const hbX = p.facing > 0 ? p.wx + range / 2 : p.wx - range / 2;
  const hbY = p.wy - BLOCK_SIZE;
  
  let hitSomething = false;
  s.nightVillains.forEach(nv => {
    if (nv.defeated) return;
    const dx = Math.abs(nv.wx - hbX);
    const dy = Math.abs(nv.wy - hbY);
    if (dx < range && dy < BLOCK_SIZE * 1.5) {
      nv.hp -= dmg;
      hitSomething = true;
      // Knockback
      nv.vx += p.facing * 5;
      nv.vy = -5;
      nv.grounded = false;
      // Hit particles
      for (let i = 0; i < 8; i++) {
        s.particleEffects.push({
          x: nv.wx, y: nv.wy - BLOCK_SIZE,
          vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5,
          r: 3 + Math.random() * 3, color: nv.type.color,
          life: 20, maxLife: 20,
        });
      }
      // Death
      if (nv.hp <= 0) {
        if (nv.type.resurrect && !nv.resurrected) {
          nv.resurrected = true;
          nv.hp = nv.maxHp * 0.5;
          // Resurrection effect
          for (let i = 0; i < 12; i++) {
            s.particleEffects.push({
              x: nv.wx, y: nv.wy - BLOCK_SIZE,
              vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 6,
              r: 4 + Math.random() * 4, color: '#88FF88',
              life: 30, maxLife: 30,
            });
          }
        } else {
          nv.defeated = true;
          // Death particles
          for (let i = 0; i < 15; i++) {
            s.particleEffects.push({
              x: nv.wx, y: nv.wy - BLOCK_SIZE,
              vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 8,
              r: 4 + Math.random() * 4, color: nv.type.color,
              life: 30, maxLife: 30,
            });
          }
          // Drop XP/coins
          s.nightKills = (s.nightKills || 0) + 1;
          if (nv.type.isRare) s.nightRareKills = (s.nightRareKills || 0) + 1;
        }
      }
    }
  });
  
  // Attack swing particles
  for (let i = 0; i < 5; i++) {
    s.particleEffects.push({
      x: hbX, y: hbY,
      vx: p.facing * (1 + Math.random() * 2), vy: (Math.random() - 0.5) * 3,
      r: 3 + Math.random() * 3, color: heroData?.color || '#FFD700',
      life: 12, maxLife: 12,
    });
  }
  
  return hitSomething;
}