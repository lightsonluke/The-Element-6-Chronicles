// Power-themed unique attack animations
// Each character's power determines a recognizable visual style
// Per-character variation via charId hash ensures no two characters share identical animations

function hashSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// Map power name → visual style index (0-14)
const POWER_STYLE_MAP = {
  'Enhance': 0, 'H₂O': 1, 'Ninja': 2, 'Portal Making': 3, 'Earth': 4,
  'Telekinesis': 5, 'Wall Creation': 6, 'Shapeshifting': 7, 'Size Mending': 8,
  'Time Freeze': 9, 'Phasing': 10, 'Echo Location': 11, 'Fire': 12, 'Air Solidifying': 13,
  'Cloning': 14, 'Thunder': 15, 'Glue': 16, 'Gravity Switch': 17, 'Energy': 18,
  'Element 6 Constructs': 19, 'Necromancy': 20, 'Flight': 21, 'Hardening': 22,
  'Venom Manipulation': 23, 'Magnetism': 24, 'Vine Manipulation': 25, 'Electricity Conduction': 26,
  'Snow Manipulation': 27, 'Soundwave Manipulation': 28, 'Dismantle': 29,
  'Nightmare Manipulation': 30, 'Nature Magic': 31, 'Alchemy': 32,
  'Matter & Mind Manipulation': 33, 'Opposition / Reality Erasure': 34,
  'Creation': 35, 'Endings': 36, 'Balance': 37,
};

function getStyleIndex(power, charId, attackKey) {
  const base = POWER_STYLE_MAP[power];
  if (base != null) return base + (hashSeed(charId + attackKey) % 3); // per-character variant
  return hashSeed((charId || 'x') + (attackKey || 's')) % 38;
}

export function drawUniqueAttack(ctx, x, y, color, progress, facing, attack, charId, attackKey, power) {
  const styleIdx = getStyleIndex(power, charId, attackKey);
  const p = progress;
  const a = Math.max(0, 1 - p);
  const c2 = shade(color, 60);
  const c3 = shade(color, -50);
  const range = attack.range || 150;
  const seed = hashSeed((charId || 'x') + (attackKey || 's'));
  const sizeMul = 0.85 + (seed % 5) * 0.1;

  ctx.save();

  const drawShape = (px, py, sz, col, shape) => {
    if (sz < 0.5) return;
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
    switch (shape % 6) {
      case 0: ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill(); break;
      case 1: ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2); break;
      case 2: ctx.beginPath(); ctx.moveTo(px, py - sz); ctx.lineTo(px - sz, py + sz); ctx.lineTo(px + sz, py + sz); ctx.closePath(); ctx.fill(); break;
      case 3: ctx.beginPath(); for (let i = 0; i < 5; i++) { const ang = (i/5)*Math.PI*2 - Math.PI/2; const r = i%2===0?sz:sz*0.4; const px2=px+Math.cos(ang)*r, py2=py+Math.sin(ang)*r; i===0?ctx.moveTo(px2,py2):ctx.lineTo(px2,py2); } ctx.closePath(); ctx.fill(); break;
      case 4: ctx.beginPath(); ctx.moveTo(px,py-sz); ctx.lineTo(px+sz,py); ctx.lineTo(px,py+sz); ctx.lineTo(px-sz,py); ctx.closePath(); ctx.fill(); break;
      case 5: ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,sz,0,Math.PI*2); ctx.stroke(); break;
    }
  };

  // Opening flash for most styles
  if (p < 0.12) {
    ctx.globalAlpha = (0.12 - p) / 0.12 * 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x, y - 18, 35 + p * 15, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = a;
  const f = facing || 1;
  // Directional bias: up attacks rise, down attacks drop, side attacks push toward facing
  const st = attack?.sigType || attackKey;
  const dirY = st === 'up' ? -1 : (st === 'down' || st === 'downHeavy' || st === 'downNormal') ? 1 : 0;
  const cy = y - 18 + dirY * 35 * Math.min(p * 1.5, 1) * (st === 'up' ? -1 : 1) + (st === 'up' ? -10 : 0);
  // Shift the entire attack forward in facing direction for side attacks
  const sweepX = (st === 'up' || st === 'down' || st === 'downHeavy' || st === 'downNormal') ? 0 : f * range * 0.25 * Math.min(p * 2, 1);
  ctx.translate(sweepX, 0);

  switch (styleIdx % 38) {
    case 0: { // Enhance — golden speed lines radiating
      for (let i = 0; i < 14; i++) {
        const ang = (i/14)*Math.PI*2 + p*2;
        const len = (30 + range*0.3) * p * sizeMul;
        ctx.globalAlpha = a * 0.8; ctx.strokeStyle = i%3===0?'#FFF':color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x+Math.cos(ang)*15, cy+Math.sin(ang)*10); ctx.lineTo(x+Math.cos(ang)*len, cy+Math.sin(ang)*len); ctx.stroke();
      }
      break;
    }
    case 1: { // H₂O — water ripples
      for (let r = 0; r < 4; r++) { const rp = p - r*0.1; if (rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.7; ctx.strokeStyle=r===0?'#FFF':color; ctx.lineWidth=4-r; ctx.beginPath(); ctx.arc(x+facing*rp*30, cy, (30+r*20)*rp*sizeMul, -Math.PI*0.7, Math.PI*0.7); ctx.stroke(); }
      break;
    }
    case 2: { // Ninja — shadow slashes
      ctx.globalAlpha = a * 0.4; ctx.fillStyle = '#220033'; ctx.beginPath(); ctx.arc(x, cy, 20+p*15, 0, Math.PI*2); ctx.fill();
      for (let i = 0; i < 5; i++) { const sp = p - i*0.1; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.9; ctx.strokeStyle=i===0?'#FFF':color; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x-facing*(40+i*15), cy-30); ctx.lineTo(x-facing*(10+i*5), cy+10); ctx.stroke(); }
      break;
    }
    case 3: { // Portal — orange rings
      for (let i = 0; i < 3; i++) { const rp = p - i*0.15; if (rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.8; ctx.strokeStyle=i===0?'#FFF':color; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x+facing*rp*range*0.5, cy, 20*rp*sizeMul, 30*rp*sizeMul, 0, 0, Math.PI*2); ctx.stroke(); }
      break;
    }
    case 4: { // Earth — stone chunks
      for (let i = 0; i < 10; i++) { const ang=(i/10)*Math.PI*2; const dist=(20+range*0.3)*p*sizeMul; const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5-Math.abs(Math.sin(ang))*20*p; drawShape(px,py,(6-p*3)*sizeMul, i%2===0?color:c3, 1); }
      ctx.globalAlpha=a*0.5; ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x,y+3,range*p*0.6, range*p*0.15,0,0,Math.PI*2); ctx.stroke();
      break;
    }
    case 5: { // Telekinesis — floating objects
      for (let i = 0; i < 8; i++) { const ang=p*Math.PI*2+i*(Math.PI*2/8); const dist=40+30*Math.sin(p*Math.PI); const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5; drawShape(px,py,7*sizeMul*(1-p*0.5), i%2===0?color:'#FFF', 1); }
      break;
    }
    case 6: { // Wall Creation — wall segments
      for (let i = 0; i < 5; i++) { const sp=p-i*0.08; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.8; ctx.fillStyle=i%2===0?color:c3; const wx=x+facing*sp*range*0.4; ctx.fillRect(wx-8, cy-25+i*12, 16, 10); }
      break;
    }
    case 7: { // Shapeshifting — claw marks
      for (let i = 0; i < 4; i++) { const sp=p-i*0.1; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.9; ctx.strokeStyle=i===0?'#FFF':color; ctx.lineWidth=5-i; ctx.beginPath(); for (let s=0;s<8;s++){ const t=s/8; const cx2=x+facing*(t*range*0.6-i*15); const cy2=cy-30+s*8+Math.sin(t*Math.PI*2+i)*5; s===0?ctx.moveTo(cx2,cy2):ctx.lineTo(cx2,cy2); } ctx.stroke(); }
      break;
    }
    case 8: { // Size Mending — growing/shrinking rings
      for (let r=0; r<4; r++) { const rp=p-r*0.12; if (rp<0||rp>1) continue; const sz=(20+r*25)*Math.sin(rp*Math.PI)*sizeMul; ctx.globalAlpha=(1-rp)*0.6; ctx.strokeStyle=r===0?'#FFF':color; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x, cy, sz, 0, Math.PI*2); ctx.stroke(); }
      break;
    }
    case 9: { // Time Freeze — clock gears
      ctx.globalAlpha=a*0.5; ctx.strokeStyle=color; ctx.lineWidth=2;
      for (let r=0;r<3;r++){ ctx.beginPath(); ctx.arc(x, cy, (25+r*15)*p*sizeMul, 0, Math.PI*2); ctx.stroke(); }
      for (let i=0;i<8;i++){ const ang=(i/8)*Math.PI*2+p*Math.PI*2; ctx.beginPath(); ctx.moveTo(x+Math.cos(ang)*20, cy+Math.sin(ang)*20); ctx.lineTo(x+Math.cos(ang)*(35+p*20), cy+Math.sin(ang)*(35+p*20)); ctx.stroke(); }
      break;
    }
    case 10: { // Phasing — ghost wisps
      for (let i = 0; i < 10; i++) { ctx.globalAlpha=a*(0.5-i*0.04); ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x-facing*i*12, cy-i*3, 8*sizeMul*(1-i*0.06), 16*sizeMul*(1-i*0.06), 0, 0, Math.PI*2); ctx.fill(); }
      break;
    }
    case 11: { // Echo Location — sound wave ripples
      for (let r=0; r<5; r++) { const rp=p-r*0.1; if (rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.5; ctx.strokeStyle=r===0?'#FFF':color; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x, cy, (20+r*25)*rp*sizeMul, 0, Math.PI*2); ctx.stroke(); }
      break;
    }
    case 12: { // Fire — flame bursts
      for (let i = 0; i < 12; i++) { const ang=(i/12)*Math.PI*2; const fl=(20+range*0.3)*p*sizeMul*(0.6+Math.sin(p*Math.PI*4+i)*0.4); const px=x+Math.cos(ang)*fl*facing, py=cy+Math.sin(ang)*fl*0.5-Math.sin(p*Math.PI)*30; drawShape(px,py,(6-p*3)*sizeMul, i%3===0?'#FF6600':i%3===1?color:'#FFAA00', 0); }
      break;
    }
    case 13: { // Air Solidifying — solid air blades
      for (let i = 0; i < 6; i++) { const sp=p-i*0.08; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.7; ctx.strokeStyle=i===0?'#FFF':color; ctx.lineWidth=3; const bx=x+facing*sp*range*0.5; ctx.beginPath(); ctx.moveTo(bx, cy-30); ctx.lineTo(bx+15, cy); ctx.lineTo(bx, cy+30); ctx.closePath(); ctx.stroke(); }
      break;
    }
    case 14: { // Cloning — afterimage silhouettes
      for (let i = 0; i < 5; i++) { ctx.globalAlpha=a*(0.4-i*0.06); ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x-facing*i*18, cy, 8*sizeMul, 18*sizeMul, 0, 0, Math.PI*2); ctx.fill(); }
      break;
    }
    case 15: { // Thunder — lightning bolts
      ctx.globalAlpha=a; ctx.strokeStyle='#FFFF44'; ctx.shadowColor='#FFFF44'; ctx.shadowBlur=15; ctx.lineWidth=4;
      for (let b=0; b<4; b++){ ctx.beginPath(); ctx.moveTo(x+facing*b*15, cy-40); for (let s=0;s<5;s++){ ctx.lineTo(x+facing*b*15+(Math.random()-0.5)*20, cy-40+s*16); } ctx.stroke(); }
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.globalAlpha=a*0.5; ctx.beginPath(); ctx.arc(x, cy, 30+p*20, 0, Math.PI*2); ctx.stroke();
      break;
    }
    case 16: { // Glue — sticky blobs
      for (let i = 0; i < 8; i++) { const sp=p-i*0.06; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.8; ctx.fillStyle=color; const sx=x+facing*sp*range*0.4; ctx.beginPath(); ctx.ellipse(sx, cy, 10*sizeMul*(1+sp*0.3), 8*sizeMul, 0, 0, Math.PI*2); ctx.fill(); }
      break;
    }
    case 17: { // Gravity — distortion rings
      ctx.globalAlpha=a*0.5; ctx.strokeStyle=color; ctx.setLineDash([6,4]); ctx.lineWidth=2;
      for (let r=0;r<5;r++){ const rr=(40-r*8)*(p<0.5?1-p*1.5+r*0.1:(p-0.5)*2.5)*sizeMul; if (rr<0) continue; ctx.beginPath(); ctx.arc(x, cy, rr, 0, Math.PI*2); ctx.stroke(); }
      ctx.setLineDash([]); ctx.globalAlpha=a*0.6; ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(x, cy, 12*(1-p*0.5), 0, Math.PI*2); ctx.fill();
      break;
    }
    case 18: { // Energy — energy beams
      const bl=range*Math.min(p*2.5,1)*sizeMul; ctx.strokeStyle='#FFF'; ctx.lineWidth=5*a; ctx.shadowColor=color; ctx.shadowBlur=20; ctx.beginPath(); ctx.moveTo(x,cy); ctx.lineTo(x+facing*bl,cy); ctx.stroke(); ctx.strokeStyle=color; ctx.lineWidth=10*a; ctx.globalAlpha=a*0.5; ctx.stroke();
      for (let i=0;i<6;i++){ drawShape(x+facing*bl*(i/6), cy+Math.sin(i*Math.PI+p*10)*8, 3*a*sizeMul, color, 0); }
      break;
    }
    case 19: { // Element 6 Constructs — energy blades
      for (let i = 0; i < 8; i++) { const ang=(i/8)*Math.PI*2+p*2; const dist=30+range*0.3*p; ctx.globalAlpha=a*0.8; ctx.strokeStyle=i===0?'#FFF':color; ctx.lineWidth=3; ctx.beginPath(); const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5; ctx.moveTo(px-10,py); ctx.lineTo(px+10,py); ctx.stroke(); }
      break;
    }
    case 20: { // Necromancy — soul wisps
      for (let i = 0; i < 12; i++) { const ang=(i/12)*Math.PI*2+p*3; const dist=20+range*0.3*p; const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.4-Math.sin(p*Math.PI+i)*20; ctx.globalAlpha=a*(0.7-i*0.04); drawShape(px,py,4*sizeMul*(1-p*0.5), i%2===0?color:'#FFF', 0); }
      break;
    }
    case 21: { // Flight — wind trails
      for (let i = 0; i < 8; i++) { ctx.globalAlpha=a*(0.6-i*0.06); ctx.strokeStyle=i===0?'#FFF':color; ctx.lineWidth=3; const wx=x-facing*i*15; ctx.beginPath(); ctx.moveTo(wx, cy-20); ctx.quadraticCurveTo(wx-10, cy, wx-5, cy+20); ctx.stroke(); }
      break;
    }
    case 22: { // Hardening — metal plates
      for (let i = 0; i < 6; i++) { const sp=p-i*0.08; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.8; ctx.fillStyle=i%2===0?'#E0E0E0':color; const px=x+facing*(i-3)*15; ctx.fillRect(px-8, cy-25, 16, 50); }
      break;
    }
    case 23: { // Venom — poison clouds
      for (let i = 0; i < 8; i++) { ctx.globalAlpha=a*(0.5-i*0.04); ctx.fillStyle=color; const px=x+facing*(i*12+10), py=cy+(Math.random()-0.5)*20; ctx.beginPath(); ctx.arc(px, py, (10+p*5)*sizeMul*(1-i*0.08), 0, Math.PI*2); ctx.fill(); }
      break;
    }
    case 24: { // Magnetism — field lines
      ctx.globalAlpha=a*0.6; ctx.strokeStyle=color; ctx.lineWidth=2;
      for (let i=0;i<6;i++){ const sp=p-i*0.1; if (sp<0) continue; ctx.globalAlpha=(1-sp)*0.6; ctx.beginPath(); ctx.ellipse(x, cy, (30+sp*range*0.3)*sizeMul, (15+sp*range*0.15)*sizeMul, 0, 0, Math.PI*2); ctx.stroke(); }
      break;
    }
    case 25: { // Vines — thorned vines
      ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.lineWidth=4;
      for (let v=0; v<4; v++){ const ang=(v/4)*Math.PI*2; ctx.beginPath(); ctx.moveTo(x, cy); for (let s=0;s<10;s++){ const t=s/10; const vx=x+Math.cos(ang)*t*range*0.5*p*facing+Math.sin(t*Math.PI*3+v)*8; const vy=cy+Math.sin(ang)*t*range*0.3*p+Math.cos(t*Math.PI*3+v)*8; s===0?ctx.moveTo(vx,vy):ctx.lineTo(vx,vy); } ctx.stroke(); }
      break;
    }
    case 26: { // Electricity — electric chains
      ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.shadowColor=color; ctx.shadowBlur=15; ctx.lineWidth=3;
      for (let c=0; c<4; c++){ ctx.beginPath(); ctx.moveTo(x, cy); for (let s=0;s<8;s++){ const t=s/8; const cx2=x+facing*t*range*p+Math.sin(t*Math.PI*4+c+p*10)*12; const cy2=cy+Math.cos(t*Math.PI*3+c)*8; s===0?ctx.moveTo(cx2,cy2):ctx.lineTo(cx2,cy2); } ctx.stroke(); }
      break;
    }
    case 27: { // Snow — ice shards
      for (let i = 0; i < 14; i++) { const ang=(i/14)*Math.PI*2+p*1.5; const dist=(15+range*0.3)*p*sizeMul; const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5; drawShape(px,py,(5-p*2)*sizeMul, i%2===0?'#FFF':color, 4); }
      break;
    }
    case 28: { // Soundwave — concentric sound waves
      for (let r=0; r<5; r++){ const rp=p-r*0.1; if (rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.6; ctx.strokeStyle=r===0?'#FFF':color; ctx.lineWidth=4-r; ctx.beginPath(); ctx.arc(x+facing*rp*20, cy, (25+r*20)*rp*sizeMul, -Math.PI*0.8, Math.PI*0.8); ctx.stroke(); }
      break;
    }
    case 29: { // Dismantle — breaking fragments
      for (let i = 0; i < 12; i++) { const ang=(i/12)*Math.PI*2; const dist=(10+range*0.4)*p*sizeMul; const px=x+Math.cos(ang)*dist*facing+Math.sin(p*Math.PI*4+i)*5, py=cy+Math.sin(ang)*dist*0.5; drawShape(px,py,(6-p*3)*sizeMul, i%2===0?color:c3, 2); }
      break;
    }
    case 30: { // Nightmare — dark fear mist
      ctx.globalAlpha=a*0.5; ctx.fillStyle='#1a0a2a'; ctx.beginPath(); ctx.arc(x, cy, 40+p*30, 0, Math.PI*2); ctx.fill();
      for (let i = 0; i < 8; i++) { ctx.globalAlpha=a*(0.6-i*0.06); ctx.fillStyle=color; const px=x+(Math.random()-0.5)*60, py=cy+(Math.random()-0.5)*40; ctx.beginPath(); ctx.arc(px, py, 8*sizeMul*(1-p*0.5), 0, Math.PI*2); ctx.fill(); }
      break;
    }
    case 31: { // Nature Magic — thorns and flowers
      ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.lineWidth=3;
      for (let i=0; i<5; i++){ const ang=(i/5)*Math.PI*2; const dist=range*0.4*p; const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5; ctx.beginPath(); ctx.arc(px, py, 8*sizeMul*(1-p*0.5), 0, Math.PI*2); ctx.stroke(); drawShape(px, py, 4*sizeMul, i%2===0?'#FF44AA':color, 3); }
      break;
    }
    case 32: { // Alchemy — potion splashes
      for (let i = 0; i < 10; i++) { const ang=(i/10)*Math.PI*2+p*2; const dist=(15+range*0.3)*p*sizeMul; const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5-Math.abs(Math.sin(ang))*15*p; drawShape(px,py,(5-p*2)*sizeMul, i%3===0?'#AAFFAA':i%3===1?color:'#FFAA00', 0); }
      break;
    }
    case 33: { // Mind Control — psychic energy
      ctx.globalAlpha=a*0.4; ctx.strokeStyle=color; ctx.lineWidth=2;
      for (let r=0;r<4;r++){ const rp=p-r*0.1; if (rp<0) continue; ctx.globalAlpha=(1-rp)*0.5; ctx.beginPath(); ctx.ellipse(x, cy, (30+rp*40)*sizeMul, (15+rp*20)*sizeMul, p*Math.PI, 0, Math.PI*2); ctx.stroke(); }
      for (let i=0;i<6;i++){ ctx.globalAlpha=a*0.7; ctx.strokeStyle=i%2===0?'#FFF':color; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x+Math.cos(i*Math.PI/3+p*5)*40, cy+Math.sin(i*Math.PI/3+p*5)*30); ctx.stroke(); }
      break;
    }
    case 34: { // Void — reality erasure
      ctx.globalAlpha=a*0.6; ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(x, cy, 30+p*40, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha=a*0.8; ctx.strokeStyle=color; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x, cy, 35+p*45, 0, Math.PI*2); ctx.stroke();
      for (let i=0;i<6;i++){ ctx.globalAlpha=a*0.4; ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x+Math.cos(i*Math.PI/3+p*3)*50, cy+Math.sin(i*Math.PI/3+p*3)*30, 5*sizeMul, 0, Math.PI*2); ctx.fill(); }
      break;
    }
    case 35: { // Creation — life energy
      for (let i = 0; i < 12; i++) { const ang=(i/12)*Math.PI*2+p*2; const dist=(20+range*0.3)*p*sizeMul; const px=x+Math.cos(ang)*dist*facing, py=cy+Math.sin(ang)*dist*0.5; drawShape(px,py,(5-p*2)*sizeMul, i%2===0?'#88FF88':color, 3); }
      ctx.globalAlpha=a*0.4; ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x, cy, 40*p*sizeMul, 0, Math.PI*2); ctx.stroke();
      break;
    }
    case 36: { // Endings — silence
      ctx.globalAlpha=a*0.5; ctx.fillStyle='#1a1a2a'; ctx.beginPath(); ctx.arc(x, cy, 30+p*40, 0, Math.PI*2); ctx.fill();
      for (let r=0;r<3;r++){ const rp=p-r*0.15; if (rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.6; ctx.strokeStyle=r===0?'#FFF':color; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x, cy, (30+r*25)*rp*sizeMul, 0, Math.PI*2); ctx.stroke(); }
      break;
    }
    case 37: { // Balance — equilibrium waves
      for (let r=0;r<5;r++){ const rp=p-r*0.1; if(rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.5; ctx.strokeStyle=r%2===0?'#FFF':color; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x, cy, (30+rp*range*0.3)*sizeMul, (8+rp*range*0.1)*sizeMul, rp*Math.PI, 0, Math.PI*2); ctx.stroke(); }
      break;
    }
    default: { // Fallback — radial burst
      for (let i = 0; i < 12; i++) { const ang=(i/12)*Math.PI*2; const dist=(20+range*0.3)*p*sizeMul; drawShape(x+Math.cos(ang)*dist, cy+Math.sin(ang)*dist*0.6, (6-p*3)*sizeMul, i%2===0?color:'#FFF', 0); }
    }
  }

  // Ring pulse for most styles
  if (styleIdx % 3 === 0) {
    for (let r = 0; r < 2; r++) { const rp=p-r*0.15; if (rp<0||rp>1) continue; ctx.globalAlpha=(1-rp)*0.4; ctx.strokeStyle=r===0?'#FFF':color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x, cy, (35+r*25)*rp*sizeMul, 0, Math.PI*2); ctx.stroke(); }
  }

  ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
}