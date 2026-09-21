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
  const {x,y,w,h}=p; ctx.save();
  const g=ctx.createLinearGradient(x,y,x,y+h); g.addColorStop(0,'#F3FFFF'); g.addColorStop(.45,'#A9EFFF'); g.addColorStop(1,'#4C8DB5');
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.moveTo(x,y+h*.78); ctx.lineTo(x+w*.08,y+h*.38); ctx.lineTo(x+w*.2,y+h*.55); ctx.lineTo(x+w*.34,y+h*.12); ctx.lineTo(x+w*.48,y+h*.42); ctx.lineTo(x+w*.63,y+h*.18); ctx.lineTo(x+w*.78,y+h*.5); ctx.lineTo(x+w*.9,y+h*.28); ctx.lineTo(x+w,y+h*.7); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#E9FFFF';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.3;
  for(let i=0;i<Math.max(2,Math.floor(w/85));i++){const cx=x+35+i*82;ctx.beginPath();ctx.moveTo(cx,y+h*.5);ctx.lineTo(cx+13,y+h*.7);ctx.lineTo(cx+6,y+h*.86);ctx.moveTo(cx+13,y+h*.7);ctx.lineTo(cx+28,y+h*.58);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<Math.floor(w/55);i++){const px=x+15+((i*61+frame*.5)%Math.max(20,w-25));ctx.fillRect(px,y+3+(i%3)*2,2,2);}
  ctx.restore();
}

function drawLava(ctx,p,frame) {
  const {x,y,w,h}=p; ctx.save();
  ctx.fillStyle='#21151A'; ctx.beginPath(); ctx.moveTo(x,y+h*.3);ctx.lineTo(x+w*.08,y+h*.12);ctx.lineTo(x+w*.2,y+h*.24);ctx.lineTo(x+w*.33,y+h*.08);ctx.lineTo(x+w*.5,y+h*.25);ctx.lineTo(x+w*.68,y+h*.1);ctx.lineTo(x+w*.84,y+h*.25);ctx.lineTo(x+w,y+h*.12);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#FF5A18';ctx.lineWidth=Math.max(2,h*.12);ctx.lineJoin='round';
  for(let i=0;i<Math.max(3,Math.floor(w/70));i++){const sx=x+18+i*72;ctx.beginPath();ctx.moveTo(sx,y+h*.2);ctx.lineTo(sx+16,y+h*.45);ctx.lineTo(sx-3,y+h*.72);ctx.stroke();}
  ctx.strokeStyle='#FFD24A';ctx.lineWidth=Math.max(1.5,h*.045);
  for(let i=0;i<Math.max(2,Math.floor(w/110));i++){const sx=x+35+i*105;ctx.beginPath();ctx.moveTo(sx,y+h*.32);ctx.lineTo(sx+11,y+h*.45);ctx.lineTo(sx+3,y+h*.66);ctx.stroke();}
  ctx.fillStyle='#FFB52E';for(let i=0;i<Math.floor(w/60);i++){const bx=x+20+((i*67+frame*.8)%Math.max(20,w-30)),by=y+h*.2+(i%3)*5;ctx.beginPath();ctx.arc(bx,by,2+(i%2),0,TAU);ctx.fill();}
  ctx.restore();
}

function drawQuicksand(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createRadialGradient(x+w*.52,y+h*.48,3,x+w*.52,y+h*.48,w*.6);g.addColorStop(0,'#F0C76B');g.addColorStop(.5,'#C9974C');g.addColorStop(1,'#76502E');ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.6,w*.53,h*.42,0,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,225,151,.65)';ctx.lineWidth=2;
  for(let r=8;r<w*.45;r+=14){ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.58,r,r*.38,0,0,TAU);ctx.stroke();}
  ctx.fillStyle='#EBC274';for(let i=0;i<Math.floor(w/14);i++){const gx=x+(i*37)%Math.max(10,w),gy=y+5+(i*19)%Math.max(5,h-5);ctx.fillRect(gx,gy,1.5,1.5);}
  ctx.restore();
}

function drawWater(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='rgba(35,134,215,.42)';ctx.beginPath();ctx.moveTo(x,y+h*.28);for(let xx=0;xx<=w;xx+=5){const yy=y+h*.28+Math.sin(xx*.055+frame*.08)*3;ctx.lineTo(x+xx,yy);}ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#B8F4FF';ctx.lineWidth=2.2;ctx.beginPath();for(let xx=0;xx<=w;xx+=4){const yy=y+h*.28+Math.sin(xx*.06+frame*.1)*3;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();
  for(let k=0;k<3;k++){ctx.strokeStyle=`rgba(120,220,255,${.45-k*.1})`;ctx.lineWidth=1;ctx.beginPath();for(let xx=0;xx<=w;xx+=6){const yy=y+h*(.45+k*.16)+Math.sin(xx*.04+frame*.045+k)*2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  ctx.fillStyle='rgba(220,250,255,.7)';for(let i=0;i<Math.floor(w/70);i++){const bx=x+25+((i*79+frame*.25)%Math.max(20,w-40)),by=y+h-7-((frame*.2+i*11)%Math.max(4,h*.55));ctx.beginPath();ctx.arc(bx,by,1.8,0,TAU);ctx.fill();}
  ctx.restore();
}

function drawBounce(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#FF9CDE');g.addColorStop(.45,'#D63E9F');g.addColorStop(1,'#6D205D');ctx.fillStyle=g;rr(ctx,x,y,w,h,Math.min(12,h*.45));ctx.fill();
  ctx.strokeStyle='#FFD0F0';ctx.lineWidth=2;rr(ctx,x+2,y+2,w-4,h-4,Math.min(10,h*.4));ctx.stroke();
  ctx.strokeStyle='rgba(255,240,252,.55)';ctx.lineWidth=1.5;for(let i=0;i<Math.max(2,Math.floor(w/90));i++){const cx=x+40+i*85;ctx.beginPath();ctx.arc(cx,y+h*.55,Math.min(18,h*.3),0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-10,y+h*.55);ctx.lineTo(cx+10,y+h*.55);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.4)';rr(ctx,x+10,y+4,w-20,3,2);ctx.fill();ctx.restore();
}

function drawCloud(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.shadowColor='rgba(180,210,255,.8)';ctx.shadowBlur=10;ctx.fillStyle='#F8FBFF';
  const count=Math.max(3,Math.floor(w/52));for(let i=0;i<count;i++){const cx=x+(i+.45)*w/count,cy=y+h*.58+(i%2)*2,r=Math.min(w/count*.48,h*.52);ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();}
  ctx.shadowBlur=0;ctx.fillStyle='rgba(170,190,220,.35)';ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.78,w*.47,h*.18,0,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w*.08,y+h*.72);ctx.quadraticCurveTo(x+w*.5,y+h*.9,x+w*.92,y+h*.72);ctx.stroke();ctx.restore();
}

function drawSpike(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#4B2735';rr(ctx,x,y+h*.48,w,h*.52,4);ctx.fill();
  const count=Math.max(3,Math.floor(w/28));const sw=w/count;
  for(let i=0;i<count;i++){const bx=x+i*sw;const grad=ctx.createLinearGradient(bx,y,bx,y+h*.58);grad.addColorStop(0,'#F3F6FA');grad.addColorStop(1,'#69717D');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(bx+sw*.08,y+h*.52);ctx.lineTo(bx+sw*.5,y+2);ctx.lineTo(bx+sw*.92,y+h*.52);ctx.closePath();ctx.fill();ctx.strokeStyle='#313842';ctx.stroke();}
  ctx.strokeStyle='#A75B70';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+h*.54);ctx.lineTo(x+w,y+h*.54);ctx.stroke();ctx.restore();
}

function drawConveyor(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#292D34';rr(ctx,x,y+h*.18,w,h*.64,5);ctx.fill();
  ctx.fillStyle='#B9782A';ctx.fillRect(x,y+h*.12,w,4);ctx.fillRect(x,y+h*.82,w,4);
  const off=(frame*2)%30;for(let xx=x-30+off;xx<x+w+30;xx+=30){ctx.fillStyle='#555E69';ctx.beginPath();ctx.arc(xx,y+h*.5,8,0,TAU);ctx.fill();ctx.strokeStyle='#C8D0D8';ctx.lineWidth=1;ctx.stroke();}
  ctx.strokeStyle='#D99B4A';ctx.lineWidth=2;for(let xx=x-15+off;xx<x+w+15;xx+=30){ctx.beginPath();ctx.moveTo(xx,y+h*.3);ctx.lineTo(xx+12,y+h*.5);ctx.lineTo(xx,y+h*.7);ctx.stroke();}
  ctx.restore();
}

function drawAcid(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#314321';rr(ctx,x,y+h*.35,w,h*.65,5);ctx.fill();
  ctx.fillStyle='#B8F52F';ctx.beginPath();ctx.moveTo(x,y+h*.38);for(let xx=0;xx<=w;xx+=5){ctx.lineTo(x+xx,y+h*.35+Math.sin(xx*.07+frame*.1)*3);}ctx.lineTo(x+w,y+h*.7);ctx.lineTo(x,y+h*.7);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#EEFF86';ctx.lineWidth=2;ctx.beginPath();for(let xx=0;xx<=w;xx+=4){const yy=y+h*.35+Math.sin(xx*.07+frame*.1)*3;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();
  ctx.fillStyle='#D7FF5A';for(let i=0;i<Math.floor(w/45);i++){const bx=x+12+((i*51+frame*.4)%Math.max(15,w-25)),by=y+h*.55-((frame*.5+i*13)%Math.max(5,h*.35));ctx.beginPath();ctx.arc(bx,by,2+(i%2),0,TAU);ctx.fill();}
  ctx.strokeStyle='rgba(110,255,70,.7)';ctx.lineWidth=2;for(let i=0;i<Math.floor(w/80);i++){const sx=x+25+i*80;ctx.beginPath();ctx.moveTo(sx,y+h*.67);ctx.lineTo(sx+4,y+h*.9);ctx.lineTo(sx+10,y+h*.67);ctx.stroke();}ctx.restore();
}

function drawMetal(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#59636F');g.addColorStop(.18,'#D8DEE5');g.addColorStop(.5,'#7D8996');g.addColorStop(.72,'#E8EDF1');g.addColorStop(1,'#4B5562');ctx.fillStyle=g;rr(ctx,x,y,w,h,3);ctx.fill();
  ctx.strokeStyle='#F6FAFF';ctx.lineWidth=1;rr(ctx,x+2,y+2,w-4,h-4,2);ctx.stroke();
  ctx.fillStyle='#3D4650';for(let i=0;i<Math.floor(w/55);i++){const bx=x+20+i*55;ctx.beginPath();ctx.arc(bx,y+h*.5,3,0,TAU);ctx.fill();ctx.strokeStyle='#AAB4BF';ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,.3)';for(let xx=x+5;xx<x+w;xx+=9){ctx.beginPath();ctx.moveTo(xx,y+3);ctx.lineTo(xx,y+h-3);ctx.stroke();}ctx.restore();
}

function drawGlass(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='rgba(110,220,255,.16)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#BDF7FF';ctx.lineWidth=3;ctx.strokeRect(x+1.5,y+1.5,w-3,h-3);
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+8,y+h-4);ctx.lineTo(x+w*.42,y+4);ctx.lineTo(x+w*.52,y+4);ctx.lineTo(x+w-8,y+h-4);ctx.stroke();
  ctx.strokeStyle='rgba(150,230,255,.7)';ctx.lineWidth=1;for(let i=0;i<Math.max(1,Math.floor(w/100));i++){const cx=x+35+i*100;ctx.beginPath();ctx.moveTo(cx,y+h*.1);ctx.lineTo(cx+18,y+h*.48);ctx.lineTo(cx-4,y+h*.82);ctx.lineTo(cx+28,y+h*.95);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(x+8,y+7,Math.min(35,w*.2),2);ctx.restore();
}

function drawWood(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#7B4828';rr(ctx,x,y,w,h,5);ctx.fill();
  ctx.fillStyle='#B56D3A';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w*.96,y+h*.62);ctx.quadraticCurveTo(x+w*.5,y+h*.3,x+w*.04,y+h*.68);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#6C391F';ctx.lineWidth=1.5;for(let i=0;i<5;i++){ctx.beginPath();for(let xx=0;xx<=w;xx+=5){const yy=y+h*(.18+i*.13)+Math.sin(xx*.035+i)*2.2;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  ctx.strokeStyle='#E29A5B';ctx.lineWidth=1;for(let i=0;i<Math.floor(w/90);i++){const cx=x+35+i*90,cy=y+h*.45;ctx.beginPath();ctx.ellipse(cx,cy,11,4,0,0,TAU);ctx.stroke();}ctx.restore();
}

function drawGrass(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#69472C';ctx.fillRect(x,y+h*.45,w,h*.55);
  ctx.fillStyle='#58A93E';ctx.beginPath();ctx.moveTo(x,y+h*.5);for(let xx=0;xx<=w;xx+=5){ctx.lineTo(x+xx,y+h*.5+Math.sin(xx*.08)*2);}ctx.lineTo(x+w,y+h*.25);ctx.lineTo(x,y+h*.25);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#8BE56A';ctx.lineWidth=2;for(let xx=x+3;xx<x+w;xx+=8){const lean=Math.sin(xx*.3)*3;ctx.beginPath();ctx.moveTo(xx,y+h*.43);ctx.lineTo(xx+lean,y+2);ctx.stroke();}
  ctx.fillStyle='#9B6A35';for(let i=0;i<Math.floor(w/45);i++){const bx=x+14+i*45,by=y+h*.72;ctx.fillRect(bx,by,3,2);}ctx.restore();
}

function drawRubber(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#F06B9F');g.addColorStop(.5,'#B92D69');g.addColorStop(1,'#551A3B');ctx.fillStyle=g;rr(ctx,x,y,w,h,Math.min(10,h*.45));ctx.fill();
  ctx.strokeStyle='rgba(255,205,228,.7)';ctx.lineWidth=1.5;
  for(let i=-1;i<Math.floor(w/28)+2;i++){const bx=x+i*28+(frame%28);ctx.beginPath();ctx.moveTo(bx,y+h*.12);ctx.lineTo(bx+12,y+h*.88);ctx.lineTo(bx+24,y+h*.12);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x+8,y+3,w-16,3);ctx.restore();
}

function drawCrystal(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#52267A';ctx.fillRect(x,y+h*.55,w,h*.45);
  const cols=Math.max(3,Math.floor(w/60));const cw=w/cols;
  for(let i=0;i<cols;i++){const cx=x+cw*(i+.5),hh=h*(.55+.3*((i*7)%5)/4);const grad=ctx.createLinearGradient(cx,y+h-hh,cx,y+h);grad.addColorStop(0,i%2?'#E6A5FF':'#8A5CFF');grad.addColorStop(1,'#4B2381');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(cx-cw*.38,y+h);ctx.lineTo(cx-cw*.18,y+h-hh*.7);ctx.lineTo(cx,y+h-hh);ctx.lineTo(cx+cw*.2,y+h-hh*.68);ctx.lineTo(cx+cw*.4,y+h);ctx.closePath();ctx.fill();ctx.strokeStyle='#EBCBFF';ctx.lineWidth=1;ctx.stroke();}
  ctx.restore();
}

function drawSand(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#C99A4F';ctx.beginPath();ctx.moveTo(x,y+h*.68);ctx.quadraticCurveTo(x+w*.18,y+h*.15,x+w*.4,y+h*.48);ctx.quadraticCurveTo(x+w*.62,y+h*.8,x+w,y+h*.25);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  ctx.fillStyle='#E9C979';ctx.beginPath();ctx.moveTo(x,y+h*.68);ctx.quadraticCurveTo(x+w*.18,y+h*.15,x+w*.4,y+h*.48);ctx.quadraticCurveTo(x+w*.62,y+h*.8,x+w,y+h*.25);ctx.lineTo(x+w,y+h*.4);ctx.quadraticCurveTo(x+w*.62,y+h*.94,x+w*.4,y+h*.62);ctx.quadraticCurveTo(x+w*.18,y+h*.28,x,y+h*.78);ctx.closePath();ctx.fill();
  ctx.fillStyle='#A66E38';for(let i=0;i<Math.floor(w/12);i++){const gx=x+(i*41)%Math.max(10,w),gy=y+8+(i*23)%Math.max(5,h-8);ctx.fillRect(gx,gy,1.5,1.5);}ctx.restore();
}

function drawSnow(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#B7CDE0';ctx.fillRect(x,y+h*.48,w,h*.52);
  ctx.fillStyle='#F8FCFF';ctx.beginPath();ctx.moveTo(x,y+h*.55);ctx.quadraticCurveTo(x+w*.15,y+h*.08,x+w*.32,y+h*.38);ctx.quadraticCurveTo(x+w*.48,y+h*.05,x+w*.65,y+h*.4);ctx.quadraticCurveTo(x+w*.82,y+h*.1,x+w,y+h*.48);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#D5EBF8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+h*.55);ctx.quadraticCurveTo(x+w*.15,y+h*.08,x+w*.32,y+h*.38);ctx.quadraticCurveTo(x+w*.48,y+h*.05,x+w*.65,y+h*.4);ctx.quadraticCurveTo(x+w*.82,y+h*.1,x+w,y+h*.48);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<Math.floor(w/30);i++){const sx=x+8+(i*43)%Math.max(10,w-10),sy=y+4+(i*17)%Math.max(4,h*.45);ctx.fillRect(sx,sy,2,2);}ctx.restore();
}

function drawTar(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#4A334B');g.addColorStop(.25,'#17121B');g.addColorStop(1,'#050508');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(x,y+h*.45);ctx.bezierCurveTo(x+w*.12,y+h*.05,x+w*.3,y+h*.55,x+w*.46,y+h*.25);ctx.bezierCurveTo(x+w*.62,y+h*.0,x+w*.75,y+h*.58,x+w,y+h*.2);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(190,155,205,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+5,y+h*.42);ctx.bezierCurveTo(x+w*.3,y+h*.12,x+w*.5,y+h*.55,x+w-5,y+h*.3);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.16)';for(let i=0;i<Math.floor(w/80);i++){const bx=x+25+i*80;ctx.beginPath();ctx.ellipse(bx,y+h*.53,15,3,0,0,TAU);ctx.fill();}ctx.restore();
}

function drawNeon(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#07171A';rr(ctx,x,y,w,h,4);ctx.fill();
  ctx.shadowColor='#22FFE0';ctx.shadowBlur=9;ctx.strokeStyle='#20FFD9';ctx.lineWidth=3;ctx.strokeRect(x+5,y+5,w-10,h-10);ctx.shadowBlur=0;
  ctx.strokeStyle='#72FFF0';ctx.lineWidth=1.5;const pulse=.45+.4*(Math.sin(frame*.12)+1)/2;ctx.globalAlpha=pulse;
  for(let i=0;i<3;i++){const yy=y+10+i*h*.28;ctx.beginPath();ctx.moveTo(x+10,yy);ctx.lineTo(x+w*.3,yy);ctx.lineTo(x+w*.38,yy+8);ctx.lineTo(x+w*.72,yy+8);ctx.lineTo(x+w*.8,yy-4);ctx.lineTo(x+w-10,yy-4);ctx.stroke();}ctx.globalAlpha=1;
  ctx.fillStyle='#B8FFF7';for(let i=0;i<Math.floor(w/55);i++){ctx.beginPath();ctx.arc(x+20+i*55,y+h*.5,2,0,TAU);ctx.fill();}ctx.restore();
}

function drawGold(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#FFF0A0');g.addColorStop(.25,'#D9A52B');g.addColorStop(.7,'#8B5A0B');g.addColorStop(1,'#4E3107');ctx.fillStyle=g;rr(ctx,x,y,w,h,7);ctx.fill();
  ctx.strokeStyle='#FFE78A';ctx.lineWidth=2;rr(ctx,x+2,y+2,w-4,h-4,5);ctx.stroke();
  ctx.fillStyle='rgba(255,241,150,.35)';for(let i=0;i<Math.floor(w/48);i++){const cx=x+25+i*48;ctx.beginPath();ctx.arc(cx,y+h*.5,9,0,TAU);ctx.fill();ctx.strokeStyle='#FFED9A';ctx.stroke();ctx.fillStyle='#A86C0A';ctx.fillRect(cx-2,y+h*.5-5,4,10);}ctx.restore();
}

function drawDiamond(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='rgba(110,210,255,.18)';ctx.beginPath();ctx.moveTo(x,y+h*.65);ctx.lineTo(x+w*.15,y+h*.15);ctx.lineTo(x+w*.5,y);ctx.lineTo(x+w*.86,y+h*.18);ctx.lineTo(x+w,y+h*.65);ctx.lineTo(x+w*.72,y+h);ctx.lineTo(x+w*.25,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#DFFFFF';ctx.lineWidth=2;ctx.stroke();
  const cx=x+w*.5,cy=y+h*.5;ctx.strokeStyle='rgba(170,245,255,.75)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*.15,y+h*.15);ctx.lineTo(cx,cy);ctx.lineTo(x+w*.86,y+h*.18);ctx.moveTo(x+w*.25,y+h);ctx.lineTo(cx,cy);ctx.lineTo(x+w*.72,y+h);ctx.stroke();
  ctx.fillStyle=`rgba(255,255,255,${.45+.25*Math.sin(frame*.08)})`;ctx.beginPath();ctx.arc(cx,cy,3,0,TAU);ctx.fill();ctx.restore();
}

function drawPlasma(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.shadowColor='#FF45FF';ctx.shadowBlur=12;ctx.strokeStyle='#E66BFF';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+h*.55);for(let xx=0;xx<=w;xx+=5){const yy=y+h*.55+Math.sin(xx*.07+frame*.14)*h*.25+Math.sin(xx*.17-frame*.08)*h*.1;ctx.lineTo(x+xx,yy);}ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,210,255,.7)';ctx.lineWidth=1;for(let j=0;j<2;j++){ctx.beginPath();for(let xx=0;xx<=w;xx+=5){const yy=y+h*(.35+j*.25)+Math.sin(xx*.09+frame*.1+j)*5;xx?ctx.lineTo(x+xx,yy):ctx.moveTo(x+xx,yy);}ctx.stroke();}
  ctx.fillStyle='#FFB6FF';for(let i=0;i<Math.floor(w/45);i++){const bx=x+15+((i*53+frame*.8)%Math.max(15,w-25)),by=y+h*.5+Math.sin(i+frame*.05)*h*.3;ctx.beginPath();ctx.arc(bx,by,2,0,TAU);ctx.fill();}ctx.restore();
}

function drawSolar(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#182D43';rr(ctx,x,y,w,h,3);ctx.fill();
  const cols=Math.max(2,Math.floor(w/48)),rows=2,cw=w/cols,rh=h*.36;
  for(let c=0;c<cols;c++)for(let r=0;r<rows;r++){ctx.fillStyle=(c+r)%2?'#2F6D91':'#1E4D70';ctx.fillRect(x+c*cw+2,y+5+r*rh,cw-4,rh-3);}
  ctx.strokeStyle='#86DFFF';ctx.lineWidth=1;ctx.strokeRect(x+2,y+3,w-4,h*.75);ctx.strokeStyle='#4D9BC2';for(let c=1;c<cols;c++){ctx.beginPath();ctx.moveTo(x+c*cw,y+4);ctx.lineTo(x+c*cw,y+h*.73);ctx.stroke();}
  ctx.fillStyle='#FFD34E';ctx.beginPath();ctx.arc(x+w*.5,y+h*.86,3+2*(Math.sin(frame*.08)+1)/2,0,TAU);ctx.fill();ctx.restore();
}

function drawAzure(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#0B4D87';rr(ctx,x,y,w,h,5);ctx.fill();
  ctx.strokeStyle='#5BCBFF';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w*.08,y+h*.5);ctx.lineTo(x+w*.92,y+h*.5);ctx.moveTo(x+w*.5,y+h*.1);ctx.lineTo(x+w*.5,y+h*.9);ctx.stroke();
  const count=Math.max(2,Math.floor(w/85));for(let i=0;i<count;i++){const cx=x+(i+.5)*w/count,cy=y+h*.5;ctx.beginPath();ctx.arc(cx,cy,15,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,5,0,TAU);ctx.stroke();for(let a=0;a<4;a++){ctx.beginPath();ctx.moveTo(cx+Math.cos(a*Math.PI/2)*18,cy+Math.sin(a*Math.PI/2)*18);ctx.lineTo(cx+Math.cos(a*Math.PI/2)*23,cy+Math.sin(a*Math.PI/2)*23);ctx.stroke();}}
  ctx.fillStyle='rgba(130,225,255,.5)';ctx.fillRect(x+8,y+3,w-16,2);ctx.restore();
}

function drawRose(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#6A203D';ctx.fillRect(x,y+h*.72,w,h*.28);
  ctx.strokeStyle='#D86A8D';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+5,y+h*.8);for(let xx=5;xx<w;xx+=6){ctx.lineTo(x+xx,y+h*.55+Math.sin(xx*.045)*h*.2);}ctx.stroke();
  for(let i=0;i<Math.floor(w/65);i++){const cx=x+28+i*65,cy=y+h*.38+(i%2)*4;ctx.fillStyle='#E56A8C';for(let k=0;k<5;k++){const a=k*TAU/5;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*7,cy+Math.sin(a)*4,7,4,a,0,TAU);ctx.fill();}ctx.fillStyle='#FFD46A';ctx.beginPath();ctx.arc(cx,cy,3,0,TAU);ctx.fill();}
  ctx.fillStyle='#74B83C';for(let i=0;i<Math.floor(w/55);i++){const lx=x+18+i*55;ctx.beginPath();ctx.ellipse(lx,y+h*.63,8,3,-.5,0,TAU);ctx.fill();}ctx.restore();
}

function drawLime(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='#355A22';rr(ctx,x,y,w,h,6);ctx.fill();
  ctx.strokeStyle='#B8FF4F';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+8,y+h*.75);for(let xx=8;xx<w;xx+=6){ctx.lineTo(x+xx,y+h*.5+Math.sin(xx*.06)*h*.22);}ctx.stroke();
  ctx.strokeStyle='#7FE63D';ctx.lineWidth=1.5;for(let i=0;i<Math.floor(w/45);i++){const bx=x+15+i*45;ctx.beginPath();ctx.moveTo(bx,y+h*.75);ctx.lineTo(bx+12,y+h*.42);ctx.lineTo(bx+21,y+h*.68);ctx.stroke();ctx.beginPath();ctx.moveTo(bx+12,y+h*.42);ctx.lineTo(bx+17,y+h*.25);ctx.stroke();}
  ctx.fillStyle='#D7FF7A';for(let i=0;i<Math.floor(w/35);i++){ctx.beginPath();ctx.arc(x+12+i*35,y+h*.18+(i%3)*3,2,0,TAU);ctx.fill();}ctx.restore();
}

function drawAntiGravity(ctx,p,frame) {
  const {x,y,w,h}=p;ctx.save();
  ctx.fillStyle='rgba(91,42,174,.25)';ctx.fillRect(x,y,w,h);
  const pulse=.5+.2*Math.sin(frame*.08);ctx.strokeStyle=`rgba(216,177,255,${pulse+.25})`;ctx.lineWidth=2;
  for(let i=0;i<Math.max(2,Math.floor(w/90));i++){const cx=x+(i+.5)*w/Math.max(2,Math.floor(w/90)),cy=y+h*.52;const r=12+Math.sin(frame*.06+i)*2;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r*.55,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+r*.3);ctx.lineTo(cx,cy-r*.8);ctx.lineTo(cx-5,cy-r*.45);ctx.moveTo(cx,cy-r*.8);ctx.lineTo(cx+5,cy-r*.45);ctx.stroke();}
  ctx.strokeStyle='rgba(232,208,255,.55)';ctx.lineWidth=1;for(let xx=x+10;xx<x+w;xx+=24){ctx.beginPath();ctx.moveTo(xx,y+h*.9);ctx.lineTo(xx+8,y+h*.7);ctx.stroke();}ctx.restore();
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
  // Extremely detailed mouse/touch strokes can contain tens of thousands of
  // points. Keep the visual path smooth while bounding canvas path work.
  const renderPts = pts.length > 2400
    ? Array.from({ length: 2401 }, (_, i) => {
        const at = (i / 2400) * (pts.length - 1);
        const lo = Math.floor(at);
        const hi = Math.min(pts.length - 1, Math.ceil(at));
        const t = at - lo;
        return {
          x: pts[lo].x + (pts[hi].x - pts[lo].x) * t,
          y: pts[lo].y + (pts[hi].y - pts[lo].y) * t,
        };
      })
    : pts;
  ctx.beginPath();
  renderPts.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));
  if(renderPts.length===1) ctx.lineTo(renderPts[0].x+.01,renderPts[0].y+.01);
  ctx.stroke();
  ctx.shadowBlur=0;

  // A compact material-specific surface pass, scaled to the stroke width.
  // Never spread thousands of points into Math.min/Math.max. Large freehand
  // strokes can contain tens of thousands of points, and the argument spread
  // can overflow the JS engine's call stack and crash the match.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const q of pts) {
    const x = Number(q?.x);
    const y = Number(q?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return;
  const box={x:minX-diameter/2,y:minY-diameter/2,w:Math.max(diameter,maxX-minX+diameter),h:Math.max(diameter,maxY-minY+diameter),material:stroke.material};
  ctx.save();
  ctx.globalAlpha=.75;
  if(stroke.material==='water'||stroke.material==='lava'||stroke.material==='acid'||stroke.material==='tar'||stroke.material==='quicksand') {
    // Liquids get a moving highlight rather than a slab, matching their physics.
    const detailPts = renderPts;
    const n=Math.max(2,Math.floor(detailPts.length/240));
    ctx.strokeStyle=stroke.material==='lava'?'rgba(255,236,130,.8)':stroke.material==='acid'?'rgba(232,255,145,.75)':stroke.material==='tar'?'rgba(160,130,170,.55)':'rgba(205,244,255,.72)';
    ctx.lineWidth=Math.max(1.5,diameter*.055);
    ctx.beginPath();
    for(let i=0;i<detailPts.length;i+=Math.max(1,n)){const q=detailPts[i];i?ctx.lineTo(q.x,q.y-diameter*.12):ctx.moveTo(q.x,q.y-diameter*.12);}
    ctx.stroke();
  } else {
    // Stamp only a few high-value details; do not draw a rectangle around the stroke.
    ctx.strokeStyle=rgba('#FFFFFF',.18);ctx.lineWidth=Math.max(1,diameter*.035);
    ctx.beginPath();renderPts.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y-diameter*.18):ctx.moveTo(pt.x,pt.y-diameter*.18));ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

export { drawMaterialOverlay };
