// Element 6 — stage material visual system.
// One renderer is shared by Stage Editor, thumbnails, previews, normal matches,
// and Freehand strokes so a material never changes appearance between contexts.
//
// Design language:
// - Platforms use a rounded sci-fi slab silhouette inspired by the supplied Normal
//   platform reference: luminous top lip, beveled underside, segmented chassis.
// - Every material keeps that silhouette but changes its physical construction,
//   surface texture, and secondary details to match what the material actually is.
// - Liquid / field materials remain non-solid in physics; their visuals are still
//   available for rectangular zones and Freehand strokes.

export const MATERIALS = [
  { id:'normal', name:'Normal', color:'#5969D8' },
  { id:'ice', name:'Ice', color:'#9FE8FF' },
  { id:'lava', name:'Lava', color:'#FF5A18' },
  { id:'quicksand', name:'Quicksand', color:'#C99A55' },
  { id:'water', name:'Water', color:'#3E9DE8' },
  { id:'bounce', name:'Bounce', color:'#E75CBA' },
  { id:'cloud', name:'Cloud', color:'#E8ECFF' },
  { id:'spike', name:'Spike', color:'#9B5364' },
  { id:'conveyor', name:'Conveyor', color:'#D68A2B' },
  { id:'acid', name:'Acid', color:'#9BE53D' },
  { id:'metal', name:'Metal', color:'#AEB9C7' },
  { id:'glass', name:'Glass', color:'#9FE9FF' },
  { id:'wood', name:'Wood', color:'#9A5E35' },
  { id:'grass', name:'Grass', color:'#4C9B54' },
  { id:'rubber', name:'Rubber', color:'#D84E89' },
  { id:'crystal', name:'Crystal', color:'#C66BFF' },
  { id:'sand', name:'Sand', color:'#D7B66A' },
  { id:'snow', name:'Snow', color:'#F5FAFF' },
  { id:'tar', name:'Tar', color:'#251D27' },
  { id:'neon', name:'Neon', color:'#32FFD2' },
  { id:'gold', name:'Gold', color:'#E5B83D' },
  { id:'diamond', name:'Diamond', color:'#A9E7FF' },
  { id:'plasma', name:'Plasma', color:'#D84DFF' },
  { id:'solar', name:'Solar', color:'#F6A51A' },
  { id:'azure', name:'Azure', color:'#2C88E8' },
  { id:'rose', name:'Rose', color:'#D95B83' },
  { id:'lime', name:'Lime', color:'#82D638' },
  { id:'antigravity', name:'Anti-Grav', color:'#A96BFF' },
];

export const NON_SOLID_MATERIALS = [
  'water','lava','cloud','acid','tar','quicksand','antigravity'
];

export function getMaterial(id) {
  return MATERIALS.find(m => m.id === (id || 'normal')) || MATERIALS[0];
}

const TAU = Math.PI * 2;

function rr(ctx,x,y,w,h,r=6) {
  ctx.beginPath();
  ctx.roundRect(x,y,Math.max(0,w),Math.max(0,h),Math.min(r,Math.max(0,Math.min(w,h)/2)));
}

function clipRound(ctx,x,y,w,h,r=6) {
  rr(ctx,x,y,w,h,r); ctx.clip();
}

function hexToRgb(hex) {
  const h = String(hex || '#777777').replace('#','');
  const n = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h,16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

function rgba(hex,a) {
  const c=hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${Math.max(0,Math.min(1,a))})`;
}

function slab(ctx,p,opts={}) {
  const {x,y,w,h}=p;
  const c=opts.color || getMaterial(p.material).color;
  const r=Math.min(opts.radius ?? 7, Math.max(3,h*.35, Math.min(w,h)*.18));
  ctx.save();
  // soft underside shadow
  ctx.fillStyle='rgba(0,0,20,.32)';
  rr(ctx,x+4,y+Math.min(9,h*.55),w,Math.max(4,h*.65),r); ctx.fill();
  // beveled body
  const g=ctx.createLinearGradient(x,y,x,y+h);
  g.addColorStop(0, opts.top || rgba(c,.96));
  g.addColorStop(.16, opts.mid || rgba(c,.72));
  g.addColorStop(1, opts.bottom || 'rgba(15,18,42,.92)');
  ctx.fillStyle=g; rr(ctx,x,y,w,h,r); ctx.fill();
  // dark lower chassis
  if(h>=10){
    ctx.fillStyle=opts.chassis || 'rgba(12,16,38,.84)';
    rr(ctx,x+Math.min(10,w*.06),y+h*.48,Math.max(0,w-Math.min(20,w*.12)),h*.44,r*.7); ctx.fill();
  }
  // top luminous lip
  ctx.strokeStyle=opts.edge || rgba(c,.95);
  ctx.lineWidth=Math.max(1.2,Math.min(3,h*.09));
  ctx.beginPath();
  ctx.moveTo(x+r,y+1);
  ctx.lineTo(x+w-r,y+1);
  ctx.stroke();
  // side bevel
  ctx.strokeStyle=rgba('#FFFFFF',.14);
  ctx.lineWidth=1;
  rr(ctx,x+.8,y+.8,w-1.6,h-1.6,r); ctx.stroke();
  // underside ribs / brackets
  if(h>=16 && w>=50){
    ctx.strokeStyle=opts.rib || 'rgba(90,105,170,.55)';
    ctx.lineWidth=1.5;
    const count=Math.max(2,Math.floor(w/95));
    for(let i=1;i<count;i++){
      const rx=x+w*i/count;
      ctx.beginPath();
      ctx.moveTo(rx-10,y+h*.62);
      ctx.lineTo(rx-5,y+h*.9);
      ctx.lineTo(rx+10,y+h*.9);
      ctx.lineTo(rx+15,y+h*.62);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function topLine(ctx,p,color,width=2,offset=2) {
  const {x,y,w}=p;
  ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x+5,y+offset); ctx.lineTo(x+w-5,y+offset); ctx.stroke();
}

function drawNormal(ctx,p,frame=0) {
  slab(ctx,p,{color:'#5969D8',top:'#746BFF',mid:'#454FC2',bottom:'rgba(14,17,48,.96)',chassis:'rgba(13,16,39,.92)',edge:'#BFAEFF',rib:'rgba(99,117,218,.7)'});
  const {x,y,w,h}=p;
  ctx.save();
  ctx.globalAlpha=.8;
  ctx.strokeStyle='#D8D3FF'; ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(x+w*.03,y+5); ctx.lineTo(x+w*.32,y+5);
  ctx.moveTo(x+w*.68,y+5); ctx.lineTo(x+w*.97,y+5);
  ctx.stroke();
  ctx.globalAlpha=.35;
  ctx.fillStyle='#9E8CFF';
  const pulse=0.55+Math.sin(frame*.07+x*.01)*.2;
  ctx.globalAlpha=pulse;
  rr(ctx,x+w*.12,y+h*.7,w*.76,Math.max(2,h*.07),2); ctx.fill();
  ctx.globalAlpha=.45;
  for(let i=0;i<Math.floor(w/70);i++){
    const bx=x+24+i*70;
    ctx.beginPath(); ctx.arc(bx,y+h*.79,2,0,TAU); ctx.fill();
  }
  ctx.restore();
}

function drawIce(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#83DDF8',top:'rgba(224,251,255,.88)',mid:'rgba(111,201,235,.55)',bottom:'rgba(37,92,137,.9)',edge:'#D9FBFF',rib:'rgba(135,220,245,.65)'});
  ctx.save(); clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(255,255,255,.65)'; ctx.lineWidth=1.2;
  for(let i=0;i<Math.max(2,Math.floor(w/90));i++){
    const sx=x+30+i*83, sy=y+h*.25+(i%2)*4;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+18,sy+6); ctx.lineTo(sx+8,sy+13); ctx.lineTo(sx+30,sy+22); ctx.stroke();
  }
  ctx.fillStyle='rgba(255,255,255,.8)';
  for(let i=0;i<Math.floor(w/80)+1;i++){const px=x+20+((i*73+frame*.25)%Math.max(20,w-30));ctx.fillRect(px,y+4,2,2);}
  ctx.restore();
}

function drawLava(ctx,p,frame) {
  const {x,y,w,h}=p;
  slab(ctx,p,{color:'#D73B16',top:'#FFCC45',mid:'#F45A18',bottom:'rgba(77,16,9,.95)',edge:'#FFE37B',rib:'rgba(255,95,30,.65)'});
  ctx.save(); clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='#FFF0A0'; ctx.lineWidth=2;
  ctx.beginPath();
  for(let xx=0;xx<=w;xx+=5){const yy=y+2+Math.sin((x+xx)*.055+frame*.08)*2.3+Math.sin((x+xx)*.12+frame*.13)*1.2; xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}
  ctx.stroke();
  ctx.strokeStyle='rgba(255,116,26,.8)'; ctx.lineWidth=4;
  ctx.beginPath();
  for(let xx=0;xx<=w;xx+=8){const yy=y+5+Math.sin((x+xx)*.045+frame*.06)*3; xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);} ctx.stroke();
  for(let i=0;i<Math.max(3,Math.floor(w/90));i++){const bx=x+25+((i*71+frame*.5)%Math.max(20,w-35)), by=y+h*.55+Math.sin(frame*.05+i)*3;ctx.fillStyle='rgba(255,220,90,.8)';ctx.beginPath();ctx.arc(bx,by,2+(i%2),0,TAU);ctx.fill();}
  ctx.restore();
}

function drawQuicksand(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#B98248',top:'#E4BE77',mid:'#C79555',bottom:'rgba(92,61,36,.9)',edge:'#F0CF8B',rib:'rgba(180,125,66,.55)'});
  ctx.save(); clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(112,74,38,.55)';ctx.lineWidth=1;
  for(let j=0;j<3;j++){ctx.beginPath();for(let xx=0;xx<=w;xx+=5){const yy=y+h*(.28+j*.2)+Math.sin(xx*.06+frame*.025+j)*1.2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  for(let i=0;i<Math.floor(w/22);i++){const gx=x+(i*31)%Math.max(20,w), gy=y+h*.35+(i%4)*4;ctx.fillStyle=i%3?'rgba(255,224,157,.55)':'rgba(95,61,34,.5)';ctx.fillRect(gx,gy,1.5,1.5);}
  ctx.restore();
}

function drawWater(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#2C8ED8',top:'rgba(94,194,255,.65)',mid:'rgba(37,124,204,.45)',bottom:'rgba(11,52,105,.7)',edge:'#A7E8FF',chassis:'rgba(12,55,100,.35)'});
  ctx.save(); clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(190,240,255,.85)';ctx.lineWidth=2;ctx.beginPath();
  for(let xx=0;xx<=w;xx+=4){const yy=y+2+Math.sin(xx*.07+frame*.09)*2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();
  ctx.strokeStyle='rgba(150,225,255,.35)';ctx.lineWidth=1;
  for(let k=1;k<3;k++){ctx.beginPath();for(let xx=0;xx<=w;xx+=6){const yy=y+h*(.28+k*.22)+Math.sin(xx*.04+frame*.04+k)*1.5;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  ctx.fillStyle='rgba(230,250,255,.7)';
  for(let i=0;i<Math.floor(w/100)+1;i++){const bx=x+30+((i*91+frame*.3)%Math.max(20,w-50)), by=y+h-5-((frame*.18+i*9)%Math.max(5,h));ctx.beginPath();ctx.arc(bx,by,1.4,0,TAU);ctx.fill();}
  ctx.restore();
}

function drawBounce(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#D84DAB',top:'#FF88D3',mid:'#C34A9D',bottom:'rgba(65,24,63,.94)',edge:'#FFB9E6',rib:'#FF6FC5'});
  ctx.save(); clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(255,220,245,.65)';ctx.lineWidth=2;
  for(let xx=x+14;xx<x+w-8;xx+=26){ctx.beginPath();ctx.moveTo(xx,y+h*.3);ctx.lineTo(xx+8,y+h*.65);ctx.lineTo(xx+16,y+h*.3);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(x+8,y+2,w-16,2);
  ctx.restore();
}

function drawCloud(ctx,p,frame) {
  const {x,y,w,h}=p; ctx.save();
  ctx.shadowColor='#BFD8FF';ctx.shadowBlur=8;
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(174,190,224,.65)');ctx.fillStyle=g;
  const count=Math.max(3,Math.floor(w/55));
  for(let i=0;i<count;i++){const cx=x+(i+.5)*w/count, cy=y+h*.48+Math.sin(i*2.4)*2, r=Math.min(24,w/count*.42,h*.55);ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();}
  ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,y+h*.68);ctx.lineTo(x+w-4,y+h*.68);ctx.stroke();
  ctx.restore();
}

function drawSpike(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#6E3948',top:'#A65B6B',mid:'#713D4D',bottom:'rgba(35,19,29,.95)',edge:'#D68A99',rib:'#8B4C5C'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  const count=Math.max(3,Math.floor(w/32)); const sw=w/count;
  for(let i=0;i<count;i++){const bx=x+i*sw+sw*.1;ctx.fillStyle=i%2?'#C7CDD6':'#E7ECF2';ctx.strokeStyle='rgba(40,40,50,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx,y+3);ctx.lineTo(bx+sw*.38,y+h*.52);ctx.lineTo(bx+sw*.76,y+3);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.restore();
}

function drawConveyor(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#8D6739',top:'#C18A43',mid:'#8A5D2B',bottom:'rgba(38,27,19,.96)',edge:'#E7B96D',rib:'#7E5528'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  const radius=Math.min(7,h*.4);
  ctx.fillStyle='rgba(30,24,23,.72)';rr(ctx,x+5,y+4,w-10,Math.max(5,h*.48),radius);ctx.fill();
  const off=(frame*1.5)%28;
  for(let xx=x-28+off;xx<x+w+28;xx+=28){ctx.fillStyle='#D0A35F';ctx.beginPath();ctx.arc(xx,y+h*.27,5,0,TAU);ctx.fill();ctx.strokeStyle='#5D4528';ctx.stroke();}
  ctx.strokeStyle='rgba(255,220,150,.6)';ctx.lineWidth=1;for(let xx=x+10;xx<x+w;xx+=34){ctx.beginPath();ctx.moveTo(xx,y+h*.42);ctx.lineTo(xx+10,y+h*.42);ctx.stroke();}
  ctx.restore();
}

function drawAcid(ctx,p,frame) {
  const {x,y,w,h}=p; ctx.save();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'rgba(191,255,65,.82)');g.addColorStop(.6,'rgba(76,177,31,.62)');g.addColorStop(1,'rgba(28,75,25,.65)');ctx.fillStyle=g;rr(ctx,x,y,w,h,6);ctx.fill();
  ctx.strokeStyle='rgba(232,255,145,.9)';ctx.lineWidth=2;ctx.beginPath();for(let xx=0;xx<=w;xx+=4){const yy=y+2+Math.sin(xx*.06+frame*.1)*2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();
  for(let i=0;i<Math.floor(w/38)+2;i++){const bx=x+15+((i*53+frame*.35)%Math.max(15,w-25)),by=y+h*.6-((frame*.4+i*12)%Math.max(5,h*.5));ctx.strokeStyle='rgba(230,255,130,.7)';ctx.beginPath();ctx.arc(bx,by,2+(i%2),0,TAU);ctx.stroke();}
  ctx.restore();
}

function drawMetal(ctx,p,frame) {
  const {x,y,w,h}=p; slab(ctx,p,{color:'#8793A4',top:'#D4D9E0',mid:'#9BA6B5',bottom:'rgba(39,48,61,.98)',edge:'#EEF2F6',rib:'#657181'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  for(let xx=x+8;xx<x+w;xx+=7){ctx.strokeStyle=xx%14?'rgba(255,255,255,.07)':'rgba(20,25,32,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xx,y+4);ctx.lineTo(xx,y+h-4);ctx.stroke();}
  ctx.fillStyle='rgba(40,48,60,.8)';for(const q of [[x+10,y+h*.7],[x+w-10,y+h*.7]]){ctx.beginPath();ctx.arc(q[0],q[1],2.3,0,TAU);ctx.fill();}
  ctx.restore();
}

function drawGlass(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(210,250,255,.65)');g.addColorStop(.45,'rgba(92,181,215,.18)');g.addColorStop(1,'rgba(35,90,130,.45)');ctx.fillStyle=g;rr(ctx,x,y,w,h,6);ctx.fill();
  ctx.strokeStyle='rgba(220,252,255,.9)';ctx.lineWidth=2;rr(ctx,x+1,y+1,w-2,h-2,6);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y+h-3);ctx.lineTo(x+w*.42,y+3);ctx.lineTo(x+w*.58,y+3);ctx.lineTo(x+w-10,y+h-3);ctx.stroke();
  ctx.strokeStyle='rgba(180,230,245,.45)';ctx.lineWidth=1;for(let i=0;i<Math.max(1,Math.floor(w/120));i++){const cx=x+40+i*120;ctx.beginPath();ctx.moveTo(cx,y+h*.3);ctx.lineTo(cx+12,y+h*.42);ctx.lineTo(cx+5,y+h*.62);ctx.stroke();}
  ctx.restore();
}

function drawWood(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#8B542F',top:'#B87946',mid:'#8B542F',bottom:'rgba(58,34,22,.95)',edge:'#D69A64',rib:'#6D4026'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(75,38,20,.55)';ctx.lineWidth=1.2;
  for(let i=0;i<4;i++){ctx.beginPath();for(let xx=0;xx<=w;xx+=6){const yy=y+h*(.2+i*.17)+Math.sin(xx*.025+i)*2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  for(let i=0;i<Math.floor(w/110);i++){const kx=x+50+i*110,ky=y+h*.48;ctx.strokeStyle='rgba(58,30,17,.6)';ctx.beginPath();ctx.ellipse(kx,ky,9,3,0,0,TAU);ctx.stroke();}
  ctx.restore();
}

function drawGrass(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#3D7B40',top:'#5EAD5A',mid:'#3E8243',bottom:'rgba(28,53,31,.95)',edge:'#8BD47B',rib:'#356D38'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.fillStyle='#66B85A';for(let xx=x+3;xx<x+w;xx+=7){const bh=3+(Math.sin(xx*.3)+1)*2;ctx.beginPath();ctx.moveTo(xx,y+4);ctx.lineTo(xx+2,y+4-bh);ctx.lineTo(xx+4,y+4);ctx.fill();}
  ctx.fillStyle='rgba(120,80,35,.65)';ctx.fillRect(x,y+h*.62,w,Math.max(2,h*.18));
  for(let i=0;i<Math.floor(w/40);i++){ctx.fillStyle=i%2?'#7B5B31':'#4D8B3F';ctx.fillRect(x+12+i*40,y+h*.64,2,2);}
  ctx.restore();
}

function drawRubber(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#C63F7D',top:'#E765A0',mid:'#B63B72',bottom:'rgba(52,22,40,.96)',edge:'#FFB1D0',rib:'#8C2E59'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(255,220,235,.5)';ctx.lineWidth=1.2;
  for(let xx=x-20+(frame%18);xx<x+w+20;xx+=18){ctx.beginPath();ctx.moveTo(xx,y+3);ctx.lineTo(xx+8,y+h*.55);ctx.lineTo(xx+16,y+3);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.18)';rr(ctx,x+8,y+3,w-16,3,2);ctx.fill();
  ctx.restore();
}

function drawCrystal(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#9B45D8',top:'#E6A1FF',mid:'#9A46D0',bottom:'rgba(45,17,73,.95)',edge:'#F2C9FF',rib:'#7D39B2'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  const cols=Math.max(2,Math.floor(w/75)); const cw=w/cols;
  for(let i=0;i<cols;i++){const cx=x+cw*(i+.5);ctx.fillStyle=i%2?'rgba(255,190,255,.25)':'rgba(120,235,255,.22)';ctx.beginPath();ctx.moveTo(cx-cw*.4,y+h);ctx.lineTo(cx-cw*.1,y+4);ctx.lineTo(cx+cw*.08,y+h*.45);ctx.lineTo(cx+cw*.35,y+h);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(245,215,255,.65)';ctx.stroke();}
  ctx.restore();
}

function drawSand(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#C79A58',top:'#E7C77F',mid:'#CDA160',bottom:'rgba(83,59,35,.92)',edge:'#F5DA9A',rib:'#A87942'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  for(let i=0;i<Math.floor(w/9);i++){const gx=x+(i*29)%Math.max(10,w),gy=y+6+(i*17)%Math.max(5,h-6);ctx.fillStyle=i%4?'rgba(255,226,160,.5)':'rgba(112,74,38,.5)';ctx.fillRect(gx,gy,1.5,1.5);}
  ctx.strokeStyle='rgba(150,107,54,.4)';ctx.lineWidth=1;for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(x+w*.35+i*w*.3,y+h*.62,8+i*3,0,Math.PI*1.5);ctx.stroke();}
  ctx.restore();
}

function drawSnow(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#DCEAF7',top:'#FFFFFF',mid:'#DCEBFA',bottom:'rgba(78,103,130,.82)',edge:'#FFFFFF',rib:'#B6CCE0'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<Math.floor(w/20);i++){const sx=x+7+(i*31)%Math.max(10,w-12),sy=y+4+(i%3)*3;ctx.beginPath();ctx.arc(sx,sy,1.5,0,TAU);ctx.fill();}
  ctx.strokeStyle='rgba(120,160,190,.4)';ctx.lineWidth=1;for(let i=0;i<Math.floor(w/70);i++){const sx=x+30+i*70;ctx.beginPath();ctx.moveTo(sx,y+h*.45);ctx.lineTo(sx+8,y+h*.55);ctx.lineTo(sx+16,y+h*.45);ctx.stroke();}
  ctx.restore();
}

function drawTar(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#3B2A3C');g.addColorStop(.35,'#17131C');g.addColorStop(1,'#08070B');ctx.fillStyle=g;rr(ctx,x,y,w,h,6);ctx.fill();
  ctx.strokeStyle='rgba(125,100,140,.8)';ctx.lineWidth=2;ctx.beginPath();for(let xx=0;xx<=w;xx+=5){const yy=y+2+Math.sin(xx*.06+frame*.03)*2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.15)';for(let i=0;i<Math.floor(w/70);i++){const sx=x+20+i*70;rr(ctx,sx,y+h*.4,18,3,2);ctx.fill();}
  ctx.restore();
}

function drawNeon(ctx,p,frame) {
  const {x,y,w,h}=p;
  slab(ctx,p,{color:'#13C6A4',top:'#39FFE0',mid:'#078E80',bottom:'rgba(5,38,45,.96)',edge:'#B8FFF4',rib:'#0C8F84'});
  ctx.save(); clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(159,255,239,.7)'; ctx.lineWidth=1;
  for(let xx=x+12;xx<x+w;xx+=42){
    ctx.beginPath();ctx.moveTo(xx,y+4);ctx.lineTo(xx,y+h*.45);ctx.lineTo(xx+13,y+h*.56);ctx.lineTo(xx+13,y+h-4);ctx.stroke();
  }
  const pulse=.55+.35*Math.sin(frame*.12);
  ctx.globalAlpha=pulse;ctx.fillStyle='#E8FFFA';rr(ctx,x+w*.15,y+h*.72,w*.7,2,1);ctx.fill();
  ctx.restore();
}

function drawGold(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#D59F24',top:'#FFE37A',mid:'#C99824',bottom:'rgba(73,48,13,.96)',edge:'#FFF0A6',rib:'#9B7019'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(255,241,160,.55)';ctx.lineWidth=1;
  for(let xx=x+18;xx<x+w;xx+=46){ctx.beginPath();ctx.arc(xx,y+h*.42,8,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(xx-8,y+h*.42);ctx.lineTo(xx+8,y+h*.42);ctx.moveTo(xx,y+h*.42-8);ctx.lineTo(xx,y+h*.42+8);ctx.stroke();}
  const shine=(Math.sin(frame*.045)+1)/2;ctx.fillStyle=`rgba(255,255,220,${.15+.35*shine})`;ctx.fillRect(x+w*.25,y+3,w*.18,2);ctx.restore();
}

function drawDiamond(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(232,255,255,.85)');g.addColorStop(.45,'rgba(103,201,245,.5)');g.addColorStop(1,'rgba(46,103,173,.7)');ctx.fillStyle=g;rr(ctx,x,y,w,h,6);ctx.fill();
  clipRound(ctx,x,y,w,h,6);ctx.strokeStyle='rgba(235,255,255,.75)';ctx.lineWidth=1;
  const cx=x+w/2,cy=y+h/2;ctx.beginPath();ctx.moveTo(x,cy);ctx.lineTo(cx,y);ctx.lineTo(x+w,cy);ctx.lineTo(cx,y+h);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(cx,y);ctx.lineTo(cx,y+h);ctx.moveTo(x,cy);ctx.lineTo(x+w,cy);ctx.stroke();
  ctx.fillStyle=`rgba(255,255,255,${.45+.25*Math.sin(frame*.08)})`;ctx.beginPath();ctx.arc(cx,cy,2,0,TAU);ctx.fill();ctx.restore();
}

function drawPlasma(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#C42BE9',top:'#F16BFF',mid:'#9E2CC4',bottom:'rgba(49,10,65,.96)',edge:'#FFC1FF',rib:'#7F20A3'});
  ctx.save();clipRound(ctx,x,y,w,h,6);ctx.shadowColor='#FF42FF';ctx.shadowBlur=7;ctx.strokeStyle='rgba(255,190,255,.8)';ctx.lineWidth=1.5;
  for(let j=0;j<3;j++){ctx.beginPath();for(let xx=0;xx<=w;xx+=5){const yy=y+h*(.22+j*.27)+Math.sin(xx*.055+frame*.11+j)*3;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  ctx.shadowBlur=0;ctx.restore();
}

function drawSolar(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#E48A18',top:'#FFD35A',mid:'#D97812',bottom:'rgba(68,38,8,.95)',edge:'#FFF0A0',rib:'#A75A0C'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.fillStyle='rgba(255,220,105,.15)';for(let i=0;i<Math.floor(w/28);i++){const sx=x+8+i*28;ctx.fillRect(sx,y+6,18,Math.max(3,h*.32));}
  ctx.strokeStyle='rgba(255,245,170,.7)';ctx.lineWidth=1;for(let i=0;i<Math.floor(w/55);i++){const sx=x+20+i*55;ctx.beginPath();ctx.moveTo(sx,y+5);ctx.lineTo(sx+8,y+h*.35);ctx.stroke();}
  ctx.fillStyle=`rgba(255,255,210,${.25+.25*(Math.sin(frame*.08)+1)/2})`;ctx.fillRect(x+w*.42,y+2,w*.12,2);ctx.restore();
}

function drawAzure(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#176FC5',top:'#49B6FF',mid:'#1D72C8',bottom:'rgba(7,35,91,.96)',edge:'#91D9FF',rib:'#1259A6'});
  ctx.save();clipRound(ctx,x,y,w,h,6);ctx.strokeStyle='rgba(151,218,255,.65)';ctx.lineWidth=1;
  for(let i=0;i<Math.floor(w/65);i++){const cx=x+32+i*65,cy=y+h*.43;ctx.beginPath();ctx.arc(cx,cy,9,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-6,cy);ctx.lineTo(cx+6,cy);ctx.moveTo(cx,cy-6);ctx.lineTo(cx,cy+6);ctx.stroke();}
  ctx.restore();
}

function drawRose(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#B94D70',top:'#F08AA7',mid:'#B84D70',bottom:'rgba(64,24,39,.95)',edge:'#FFD0DE',rib:'#8D3857'});
  ctx.save();clipRound(ctx,x,y,w,h,6);
  ctx.strokeStyle='rgba(255,200,215,.5)';ctx.lineWidth=1;
  for(let i=0;i<Math.floor(w/55);i++){const cx=x+25+i*55,cy=y+h*.48;ctx.beginPath();for(let a=0;a<TAU;a+=.3){const r=3+4*Math.sin(3*a);const px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r*.55;a?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();}
  ctx.restore();
}

function drawLime(ctx,p,frame) {
  const {x,y,w,h}=p;slab(ctx,p,{color:'#65B52F',top:'#A8F34E',mid:'#5EAB2B',bottom:'rgba(26,59,20,.95)',edge:'#D5FF8A',rib:'#438022'});
  ctx.save();clipRound(ctx,x,y,w,h,6);ctx.strokeStyle='rgba(220,255,140,.55)';ctx.lineWidth=1;
  for(let i=0;i<Math.floor(w/38);i++){const xx=x+10+i*38;ctx.beginPath();ctx.moveTo(xx,y+h*.7);ctx.lineTo(xx+12,y+h*.35);ctx.lineTo(xx+22,y+h*.7);ctx.stroke();}
  ctx.restore();
}

function drawAntiGravity(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.globalAlpha=.75;slab(ctx,p,{color:'#8F54E8',top:'rgba(210,164,255,.5)',mid:'rgba(126,67,210,.34)',bottom:'rgba(38,17,74,.5)',edge:'#E3C7FF',chassis:'rgba(24,13,54,.3)',rib:'#A36CFF'});
  ctx.globalAlpha=1;
  ctx.strokeStyle=`rgba(221,187,255,${.55+.2*Math.sin(frame*.08)})`;ctx.lineWidth=1.5;
  const count=Math.max(2,Math.floor(w/90));
  for(let i=0;i<count;i++){const cx=x+(i+.5)*w/count,cy=y+h*.5+Math.sin(frame*.05+i)*2;ctx.beginPath();ctx.arc(cx,cy,10,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+6);ctx.lineTo(cx,cy-8);ctx.lineTo(cx-4,cy-3);ctx.moveTo(cx,cy-8);ctx.lineTo(cx+4,cy-3);ctx.stroke();}
  ctx.restore();
}

function drawMaterialOverlay(ctx,p,frame=0) {
  const id=p?.material || 'normal';
  if(id === 'normal') { drawNormal(ctx,p,frame); return; }
  const fn = {
    ice:drawIce,lava:drawLava,quicksand:drawQuicksand,water:drawWater,bounce:drawBounce,
    cloud:drawCloud,spike:drawSpike,conveyor:drawConveyor,acid:drawAcid,metal:drawMetal,
    glass:drawGlass,wood:drawWood,grass:drawGrass,rubber:drawRubber,crystal:drawCrystal,
    sand:drawSand,snow:drawSnow,tar:drawTar,neon:drawNeon,gold:drawGold,diamond:drawDiamond,
    plasma:drawPlasma,solar:drawSolar,azure:drawAzure,rose:drawRose,lime:drawLime,
    antigravity:drawAntiGravity
  }[id];
  (fn || drawNormal)(ctx,p,frame);
}

// Draw one Freehand stroke using the same material treatment as a platform.
// The center line remains a collision-friendly shape; material details are
// stamped along it so Freehand never looks like a chain of unrelated squares.
export function drawMaterialStroke(ctx, stroke, frame=0) {
  const pts=Array.isArray(stroke?.points)?stroke.points:[];
  if(!pts.length) return;
  const diameter=Math.max(4,Number(stroke?.diameter)||36);
  const color=getMaterial(stroke.material).color;
  ctx.save();
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=diameter;
  ctx.strokeStyle=rgba(color,.88);
  ctx.shadowColor=rgba(color,.28);ctx.shadowBlur=Math.min(12,diameter*.18);
  ctx.beginPath();
  pts.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));
  if(pts.length===1) ctx.lineTo(pts[0].x+.01,pts[0].y+.01);
  ctx.stroke();
  ctx.shadowBlur=0;

  // A compact material-specific surface pass, scaled to the stroke width.
  const minX=Math.min(...pts.map(q=>q.x)), maxX=Math.max(...pts.map(q=>q.x));
  const minY=Math.min(...pts.map(q=>q.y)), maxY=Math.max(...pts.map(q=>q.y));
  const box={x:minX-diameter/2,y:minY-diameter/2,w:Math.max(diameter,maxX-minX+diameter),h:Math.max(diameter,maxY-minY+diameter),material:stroke.material};
  ctx.save();
  ctx.globalAlpha=.75;
  if(stroke.material==='water'||stroke.material==='lava'||stroke.material==='acid'||stroke.material==='tar'||stroke.material==='quicksand') {
    // Liquids get a moving highlight rather than a slab, matching their physics.
    const n=Math.max(2,Math.floor(pts.length/6));
    ctx.strokeStyle=stroke.material==='lava'?'rgba(255,236,130,.8)':stroke.material==='acid'?'rgba(232,255,145,.75)':stroke.material==='tar'?'rgba(160,130,170,.55)':'rgba(205,244,255,.72)';
    ctx.lineWidth=Math.max(1.5,diameter*.055);
    ctx.beginPath();
    for(let i=0;i<pts.length;i+=Math.max(1,n)){const q=pts[i];i?ctx.lineTo(q.x,q.y-diameter*.12):ctx.moveTo(q.x,q.y-diameter*.12);}
    ctx.stroke();
  } else {
    // Stamp only a few high-value details; do not draw a rectangle around the stroke.
    ctx.strokeStyle=rgba('#FFFFFF',.18);ctx.lineWidth=Math.max(1,diameter*.035);
    ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y-diameter*.18):ctx.moveTo(pt.x,pt.y-diameter*.18));ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

export { drawMaterialOverlay };
